import { leerToken, renovarSesion, limpiarSesionLocal } from "../utils/sesion";

// web/src/api/cliente.js — cliente HTTP centralizado del portal.
//
// Actividad 09, PR-01 (M. Arriaga Mora): antes cada módulo de web/src/api
// leía el token con localStorage.getItem("token") y lo adjuntaba a mano en
// la cabecera Authorization. localStorage es legible por CUALQUIER script
// que corra en el origen -- incluido el de una dependencia comprometida o
// una inyección -- así que una sola vulnerabilidad de scripting entregaba
// la sesión completa, y el valor sobrevivía al cierre del navegador.
//
// La API ahora TAMBIÉN emite el JWT en una cookie HttpOnly (ver
// api/app/auth/routes.py y JWT_TOKEN_LOCATION en api/app/config.py), que
// el navegador adjunta solo con `credentials: "include"` y que JavaScript
// no puede leer.
//
// Migración incremental, a propósito: convertir TODA la aplicación de una
// vez (56 archivos leen el token de localStorage, incluida la ventana de
// impersonación de superadmin) es un cambio demasiado grande para aplicar
// de golpe sin volver a probar cada pantalla. Por eso este cliente manda
// la cookie Y, si todavía existe un token en localStorage, también la
// cabecera Authorization -- la API acepta cualquiera de las dos
// (JWT_TOKEN_LOCATION = ["headers", "cookies"]; headers tiene prioridad).
// Así los módulos que ya pasan por aquí (completeOnboarding, la guarda de
// navegación de Layout.jsx) funcionan igual para todos los roles --
// incluida la impersonación, que inyecta su propio token en localStorage
// sin tocar la cookie de la sesión original -- mientras el resto de la
// aplicación se migra módulo por módulo. El cierre completo del hueco de
// PR-01 (cero lecturas de localStorage en todo el frontend) queda anotado
// como seguimiento, no como "ya resuelto".
//
// Sesión: si una petición responde 401 se intenta UNA renovación silenciosa
// (utils/sesion.js: refresh por cookie HttpOnly) y se reintenta. Solo si el
// refresh tampoco sirve se limpia la sesión local y se manda al login. Los
// fallos de red / 5xx NO cierran la sesión: se propagan con `error.status`.
//
// opciones.sinRedireccion: no redirigir al login en un 401 definitivo
// (lo usa la guarda de rutas públicas, que decide qué hacer por su cuenta).
export async function peticion(ruta, opciones = {}) {
  const { sinRedireccion = false, ...opcionesFetch } = opciones;

  const enviar = () => {
    const token = leerToken();
    return fetch(ruta, {
      ...opcionesFetch,
      credentials: "include", // envía (y recibe) la cookie de sesión
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opcionesFetch.headers || {}),
      },
    });
  };

  let respuesta = await enviar();

  if (respuesta.status === 401) {
    const resultado = await renovarSesion();
    if (resultado === "ok") respuesta = await enviar();
    else if (resultado === "error") {
      const e = new Error("No se pudo verificar la sesión. Revisa tu conexión.");
      e.status = 0;
      throw e;
    }
  }

  if (respuesta.status === 401) {
    // Sesión vencida o revocada y sin forma de renovarla: se limpia ANTES de ir
    // al login para que /login y / no devuelvan al panel con un token muerto.
    if (!sinRedireccion) {
      limpiarSesionLocal();
      window.location.replace("/login");
    }
    return null;
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const e = new Error(datos.msg || "Error en la petición");
    e.status = respuesta.status;
    throw e;
  }
  return datos;
}
