// utils/errores.js — Convierte cualquier error en un mensaje que una persona
// pueda entender y sobre el que pueda actuar.
//
// Auditoría nov/2026. Antes, 94 pantallas hacían `setError(e.message)` y 36
// lanzaban `new Error(\`Error ${r.status}\`)`: lo que veía el usuario era
// "Error 500", "Failed to fetch" o "Unexpected token < in JSON". Ninguno le
// dice qué pasó ni qué hacer. Este módulo es el único lugar donde se decide
// ese texto, para que todas las pantallas hablen igual.
//
//   mensajePorEstado(status)        → texto para un código HTTP
//   mensajeAmigable(error, respaldo) → texto para un Error / string cualquiera

const SIN_CONEXION =
  "No pudimos conectar con el servidor. Revisa tu conexión a internet e intenta de nuevo.";
const GENERICO =
  "Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos; si sigue pasando, avísale a soporte.";

const POR_ESTADO = {
  400: "Hay un dato que no pudimos procesar. Revisa la información e intenta de nuevo.",
  401: "Tu sesión caducó. Vuelve a iniciar sesión para continuar.",
  403: "Tu cuenta no tiene permiso para hacer esto. Si crees que es un error, pide acceso a tu administrador.",
  404: "No encontramos lo que buscabas. Puede que ya no exista.",
  408: "El servidor tardó demasiado en responder. Intenta de nuevo.",
  409: "Esta acción choca con información que ya existe. Actualiza la página y revisa antes de reintentar.",
  413: "El archivo es demasiado grande. El máximo permitido es 15 MB.",
  422: "No pudimos validar tu sesión. Inicia sesión de nuevo.",
  429: "Hiciste demasiados intentos en poco tiempo. Espera un momento y vuelve a intentarlo.",
  502: "El servidor se está reiniciando. Espera unos segundos y vuelve a intentarlo.",
  503: "El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.",
  504: "El servidor tardó demasiado en responder. Intenta de nuevo en unos minutos.",
};

/** Mensaje claro para un código de estado HTTP. */
export function mensajePorEstado(status) {
  const codigo = Number(status);
  if (POR_ESTADO[codigo]) return POR_ESTADO[codigo];
  if (codigo >= 500) return GENERICO;
  if (codigo >= 400) return POR_ESTADO[400];
  return GENERICO;
}

// Señales de que un texto es jerga del navegador/servidor y no un mensaje
// escrito para el usuario. Si alguna aparece, el texto original se descarta.
const SIN_RED = /failed to fetch|networkerror|network error|load failed|err_network|err_internet|econn|enotfound|timeout|timed out/i;
const TECNICO = new RegExp(
  [
    "unexpected token", "unexpected end of", "is not valid json", "json\\.parse", "no devolvió json",
    "is not a function", "is not defined", "cannot read", "undefined", "\\bnull\\b", "nan\\b",
    "traceback", "exception", "errno", "stack", "syntaxerror", "typeerror", "referenceerror",
    "pymongo", "psycopg", "sqlalchemy", "keyerror", "attributeerror", "valueerror",
    "status code", "request failed", "internal server", "bad gateway", "^error$", "^error:?\\s*$",
  ].join("|"),
  "i",
);
// "Error 500", "HTTP 404", "Error 500: Internal Server Error"...
const CODIGO = /^(?:error|http)\s*:?\s*(\d{3})\b/i;

/**
 * Mensaje claro para un error cualquiera.
 * @param {unknown} error    Un Error, un string, o cualquier cosa atrapada en un catch.
 * @param {string} [respaldo] Texto a usar cuando el error no trae nada útil
 *                            (p. ej. "No pudimos guardar tu perfil.").
 */
export function mensajeAmigable(error, respaldo) {
  const crudo = typeof error === "string" ? error : error?.message;
  const texto = String(crudo ?? "").replace(/^error:\s*/i, "").trim();

  if (!texto) return respaldo || GENERICO;
  if (SIN_RED.test(texto)) return SIN_CONEXION;

  const codigo = texto.match(CODIGO);
  if (codigo) return respaldo && Number(codigo[1]) >= 500
    ? `${respaldo} ${mensajePorEstado(codigo[1])}`.trim()
    : mensajePorEstado(codigo[1]);

  if (TECNICO.test(texto)) return respaldo || GENERICO;

  // Llegó hasta aquí: es un mensaje redactado por la API para el usuario
  // ("Ese correo ya está registrado"). Se respeta tal cual.
  return texto;
}
