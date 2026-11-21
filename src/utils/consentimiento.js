// utils/consentimiento.js — consentimiento de cookies y almacenamiento local.
//
// Dos categorías, a propósito (no se inventan categorías que hoy no existen):
//  * necesarias  — SIEMPRE activas, no requieren consentimiento: sesión
//    (cookies HttpOnly access_token_cookie / refresh_token_cookie y el token y
//    usuario locales) y el registro de esta misma decisión.
//  * preferencias — OPCIONALES: recordar el tema visual en este dispositivo.
// GymPro no usa analítica ni publicidad. Si algún día se agrega, es una
// categoría nueva: subir VERSION_CONSENTIMIENTO para volver a preguntar.
//
// El consentimiento se guarda en localStorage (necesario para recordar la
// decisión; no es un dato de seguimiento) con versión y fecha.

export const CLAVE_CONSENTIMIENTO = "gympro_consentimiento";
export const VERSION_CONSENTIMIENTO = 1;

const EVENTO_CAMBIO = "gympro:consentimiento";
const EVENTO_ABRIR = "gympro:abrir-cookies";

/** Decisión vigente o null si no hay (o es de una versión anterior). */
export function leerConsentimiento() {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_CONSENTIMIENTO) || "null");
    if (c && c.version === VERSION_CONSENTIMIENTO && typeof c.preferencias === "boolean") return c;
  } catch { /* JSON inválido o almacenamiento no disponible */ }
  return null;
}

/**
 * Registra la decisión. Si se rechazan las preferencias, se borran las que ya
 * estuvieran guardadas (retirar el consentimiento debe limpiar, no solo dejar
 * de escribir).
 */
export function guardarConsentimiento({ preferencias }) {
  const consentimiento = {
    version: VERSION_CONSENTIMIENTO,
    necesarias: true,
    preferencias: !!preferencias,
    fecha: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(consentimiento));
    if (!consentimiento.preferencias) localStorage.removeItem("theme");
  } catch { /* sin almacenamiento: la decisión vale solo en esta sesión de la página */ }
  window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: consentimiento }));
  return consentimiento;
}

/** ¿Se puede guardar una preferencia opcional (p. ej. el tema) en este dispositivo? */
export function puedeGuardarPreferencias() {
  return leerConsentimiento()?.preferencias === true;
}

/** Guarda una preferencia opcional SOLO si hay consentimiento. */
export function guardarPreferencia(clave, valor) {
  if (!puedeGuardarPreferencias()) return false;
  try { localStorage.setItem(clave, valor); return true; } catch { return false; }
}

/** Suscripción a cambios de la decisión; devuelve la función para cancelar. */
export function alCambiarConsentimiento(callback) {
  const manejador = (e) => callback(e.detail);
  window.addEventListener(EVENTO_CAMBIO, manejador);
  return () => window.removeEventListener(EVENTO_CAMBIO, manejador);
}

/** Pide al banner que se abra para cambiar la decisión (enlace "Configurar cookies"). */
export function abrirConfiguracionCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

export function alPedirConfiguracion(callback) {
  window.addEventListener(EVENTO_ABRIR, callback);
  return () => window.removeEventListener(EVENTO_ABRIR, callback);
}
