/**
 * utils/correos.js — Validación y alta de correos libres (p. ej. los
 * destinatarios extra de un reporte automático).
 *
 * Mismo criterio que el backend (reportes_automaticos.py::_EMAIL_RE): algo@dominio.tld
 * sin espacios, comas ni punto y coma. El servidor vuelve a validar; esto solo
 * evita ir y volver por un error de dedo.
 */
export const MAX_CORREOS_EXTRA = 5;

const EMAIL_RE = /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]{2,}$/;

export const esCorreoValido = (correo) =>
  typeof correo === "string" && correo.length <= 254 && EMAIL_RE.test(correo.trim());

/** Parte un texto pegado ("a@x.com, b@x.com; c@x.com") en candidatos sueltos. */
export const separarCorreos = (texto) =>
  String(texto ?? "").split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);

/**
 * Suma `texto` (uno o varios correos) a `actuales`.
 * Devuelve { correos, invalidos, excedido }: `correos` en minúsculas y sin
 * repetidos (los inválidos y los que no caben NO se agregan); `invalidos` lo
 * que no tiene forma de correo; `excedido` true si algo válido se quedó fuera
 * por el tope `max`.
 */
export const agregarCorreos = (actuales, texto, max = MAX_CORREOS_EXTRA) => {
  const correos = [...actuales];
  const invalidos = [];
  let excedido = false;

  for (const candidato of separarCorreos(texto)) {
    if (!esCorreoValido(candidato)) {
      invalidos.push(candidato);
      continue;
    }
    const correo = candidato.toLowerCase();
    if (correos.includes(correo)) continue;
    if (correos.length >= max) {
      excedido = true;
      continue;
    }
    correos.push(correo);
  }
  return { correos, invalidos, excedido };
};
