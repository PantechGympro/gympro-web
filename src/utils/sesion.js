// utils/sesion.js — persistencia y renovación silenciosa de la sesión web.
//
// Problema original: el portal guardaba el access token (8 h) en localStorage y
// NUNCA lo renovaba, aunque la API ya emitía un refresh token de 90 días en una
// cookie HttpOnly. Resultado: a las 8 h (o al cerrar la pestaña con cookies de
// sesión) el usuario tenía que iniciar sesión otra vez.
//
// Ahora:
//  * La API deja las cookies como persistentes (JWT_SESSION_COOKIE=False).
//  * Este módulo canjea el refresh (cookie, sin cabecera Authorization) por un
//    access nuevo ANTES de que caduque y cuando una petición responde 401.
//
// Dos garantías que importan por la rotación del refresh en la API (reusar un
// refresh ya canjeado revoca TODA la sesión):
//  1. Un solo canje a la vez dentro de la pestaña (promesa compartida).
//  2. Un solo canje a la vez entre pestañas (Web Locks) y, tras obtener el
//     candado, se comprueba si otra pestaña ya renovó para no canjear dos veces.

const CLAVE_TOKEN = "token";
const CLAVE_USUARIO = "user";
const NOMBRE_CANDADO = "gympro-renovar-sesion";

// Se renueva cuando quedan menos de 30 min de vida (access token = 8 h).
export const MARGEN_RENOVACION_SEG = 30 * 60;
const INTERVALO_REVISION_MS = 5 * 60 * 1000;

// ── Helpers de almacenamiento ───────────────────────────────────────────────

export function leerToken() {
  try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
}

/** Impersonación de superadmin: el token activo es temporal y NO se renueva. */
export function enImpersonacion() {
  try { return !!sessionStorage.getItem("sa_prev_token"); } catch { return false; }
}

/** Claims (sin verificar firma: solo para leer exp/sub en el cliente). */
export function decodificarJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
    let texto;
    try {
      texto = decodeURIComponent(
        bin.split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""),
      );
    } catch {
      texto = bin;
    }
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** Segundos de vida que le quedan al token; -Infinity si no es legible. */
export function segundosRestantes(token, ahoraMs = Date.now()) {
  const exp = decodificarJwt(token || "")?.exp;
  return typeof exp === "number" ? exp - ahoraMs / 1000 : -Infinity;
}

export function limpiarSesionLocal() {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    sessionStorage.removeItem("sa_prev_token");
    sessionStorage.removeItem("sa_prev_user");
  } catch { /* almacenamiento no disponible */ }
}

// ── Renovación ──────────────────────────────────────────────────────────────

/**
 * Resultado de un intento de renovación:
 *  "ok"        — hay un access token nuevo guardado (o ya lo renovó otra pestaña).
 *  "expirada"  — el refresh ya no sirve (vencido/revocado/otro usuario): hay que
 *                iniciar sesión.
 *  "error"     — fallo transitorio (sin red, 5xx): NO cerrar la sesión, reintentar.
 *  "omitida"   — nada que renovar (sin sesión local o impersonando).
 */
let enCurso = null;

async function canjearRefresh(tokenInicial) {
  // Otra pestaña pudo renovar mientras esperábamos el candado.
  const actual = leerToken();
  if (actual && actual !== tokenInicial && segundosRestantes(actual) > 0) return "ok";

  let respuesta;
  try {
    // Sin cabecera Authorization a propósito: /auth/refresh exige un token de
    // tipo "refresh"; con un access token en la cabecera la API lo rechaza.
    respuesta = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    return "error";
  }

  if (respuesta.status === 401 || respuesta.status === 403 || respuesta.status === 422) return "expirada";
  if (!respuesta.ok) return "error";

  const datos = await respuesta.json().catch(() => null);
  const nuevo = datos?.access_token;
  if (!nuevo) return "error";

  // Defensa: el refresh viaja por cookie, que puede ser de OTRA identidad que
  // el token guardado (p. ej. tras una impersonación). Nunca cambiar de usuario
  // en silencio.
  const subViejo = decodificarJwt(tokenInicial)?.sub;
  const subNuevo = decodificarJwt(nuevo)?.sub;
  if (subViejo && subNuevo && subViejo !== subNuevo) return "expirada";

  try {
    localStorage.setItem(CLAVE_TOKEN, nuevo);
    if (datos.user) {
      let previo = {};
      try { previo = JSON.parse(localStorage.getItem(CLAVE_USUARIO) || "{}") || {}; } catch { previo = {}; }
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify({ ...previo, ...datos.user }));
    }
  } catch { return "error"; }
  return "ok";
}

export function renovarSesion() {
  if (enCurso) return enCurso;

  const tokenInicial = leerToken();
  if (!tokenInicial || enImpersonacion()) return Promise.resolve("omitida");

  const ejecutar = () => canjearRefresh(tokenInicial);
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;

  enCurso = (locks?.request ? locks.request(NOMBRE_CANDADO, ejecutar) : ejecutar())
    .catch(() => "error")
    .finally(() => { enCurso = null; });
  return enCurso;
}

/** Renueva solo si el access token está por caducar (o ya caducó). */
export async function asegurarSesionFresca() {
  const token = leerToken();
  if (!token || enImpersonacion()) return "omitida";
  if (segundosRestantes(token) > MARGEN_RENOVACION_SEG) return "ok";
  return renovarSesion();
}

/**
 * Mantiene la sesión viva mientras la web esté abierta: revisa al arrancar, al
 * volver a la pestaña, al recuperar la red y cada 5 min. La revisión es local
 * (decodifica el JWT); solo hay red cuando de verdad toca renovar.
 * Devuelve una función para detenerlo.
 */
export function iniciarMantenimientoSesion() {
  const revisar = () => { asegurarSesionFresca(); };
  const alVolver = () => { if (document.visibilityState === "visible") revisar(); };

  revisar();
  const timer = setInterval(revisar, INTERVALO_REVISION_MS);
  document.addEventListener("visibilitychange", alVolver);
  window.addEventListener("online", revisar);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", alVolver);
    window.removeEventListener("online", revisar);
  };
}

// ── Cierre de sesión ────────────────────────────────────────────────────────

/**
 * Cierra la sesión también en el servidor: revoca el refresh de 90 días y borra
 * las cookies. Es de mejor esfuerzo (sin red igual se cierra localmente) y con
 * tope de espera para no retener al usuario.
 */
export async function cerrarSesion() {
  if (!enImpersonacion() && leerToken()) {
    try {
      await Promise.race([
        fetch("/api/auth/logout", { method: "POST", credentials: "include" }),
        new Promise((resolver) => setTimeout(resolver, 2000)),
      ]);
    } catch { /* sin red: se cierra solo localmente */ }
  }
  limpiarSesionLocal();
}
