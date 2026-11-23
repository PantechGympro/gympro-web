// utils/huella.js — Huella del navegador para el alta de gimnasios.
//
// Para qué: el plan gratuito da capacidad real, así que a alguien le sale a
// cuenta abrir varios gimnasios "gratis" en vez de contratar uno. El servidor
// frena las altas en serie desde el mismo equipo (ver app/utils/antiabuso.py);
// esto le da la señal con la que compara.
//
// Qué NO es: no identifica a una persona ni se usa para perfilar, seguir
// navegación ni publicidad. Solo viaja en la petición de REGISTRO de un
// gimnasio, en ninguna otra, y lo que se manda es un hash: el servidor nunca
// recibe los valores que lo componen.
//
// Por qué estas señales y no más: son estables entre recargas y no cambian de
// un día para otro, que es lo único que necesita la regla. Deliberadamente NO
// se usan canvas, WebGL, fuentes instaladas ni audio -- son las técnicas que
// convierten esto en seguimiento, distinguen a una persona entre millones y
// no hacen falta para contar tres altas desde la misma máquina.
//
// Débil a propósito: se borra reinstalando el navegador o usando otro. Por eso
// el servidor nunca bloquea a la primera por este dato, solo cuenta altas
// repetidas (ver ALTAS_MAX_POR_HUELLA).

export const CABECERA_HUELLA = "X-GymPro-Huella";

function señales() {
  const n = typeof navigator !== "undefined" ? navigator : {};
  // window.screen y no `screen` a secas: CRA prohibe el global ambiguo.
  const s = (typeof window !== "undefined" && window.screen) || {};
  let zona = "";
  try {
    zona = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    zona = "";
  }
  return [
    n.language || "",
    n.platform || "",
    n.hardwareConcurrency || "",
    s.width || "",
    s.height || "",
    s.colorDepth || "",
    zona,
  ].join("|");
}

/**
 * Hash hexadecimal (SHA-256) de las señales del equipo.
 *
 * Devuelve null si el navegador no expone WebCrypto -- pasa en contextos no
 * seguros (http). No es un error: el servidor trata la ausencia de huella
 * como "no se sabe" y deja pasar el alta. Preferimos que alguien abuse a que
 * un cliente legítimo no pueda registrarse porque su navegador es viejo.
 */
export async function calcularHuella() {
  try {
    if (!window.crypto?.subtle) return null;
    const datos = new TextEncoder().encode(señales());
    const resumen = await window.crypto.subtle.digest("SHA-256", datos);
    return Array.from(new Uint8Array(resumen))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/** Cabeceras con la huella, o {} si no se pudo calcular. */
export async function cabecerasHuella() {
  const huella = await calcularHuella();
  return huella ? { [CABECERA_HUELLA]: huella } : {};
}
