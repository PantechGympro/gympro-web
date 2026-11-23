/**
 * utils/avisos.js — Una sola puerta para avisos y confirmaciones.
 *
 * El proyecto tenía tres sistemas conviviendo: el hook propio `useToast`
 * (9 archivos), SweetAlert2 (24 archivos) y `sonner` instalado en
 * package.json pero sin montar en ninguna parte. Resultado: el mismo
 * "guardado correctamente" se veía distinto según la pantalla.
 *
 * Esto unifica la capa en `sonner` (ver .claude/skills/ask-sonner):
 *   - Un solo <Toaster /> montado en la raíz. Dos Toasters duplicarían
 *     cada aviso, por eso AvisosHost es el único lugar que lo monta.
 *   - `confirmar()` devuelve una promesa booleana, con la misma forma de
 *     uso que tenía `Swal.fire(...).isConfirmed`, para que migrar una
 *     pantalla sea un cambio mecánico y no una reescritura.
 *
 * ALCANCE: de momento lo usan las vistas de autenticación y el panel de
 * SuperAdmin. El resto de los paneles (owner, recepción, entrenador)
 * siguen con Swal/useToast y se migrarán en otra pasada -- cambiar 24
 * archivos sin poder ejecutar la app sería imprudente.
 */
import { toast } from "sonner";

/* ── Avisos ─────────────────────────────────────────────────────────────── */

export const avisos = {
  exito:       (titulo, descripcion) => toast.success(titulo, { description: descripcion }),
  error:       (titulo, descripcion) => toast.error(titulo, { description: descripcion }),
  advertencia: (titulo, descripcion) => toast.warning(titulo, { description: descripcion }),
  info:        (titulo, descripcion) => toast.info(titulo, { description: descripcion }),

  /** Devuelve el id para poder actualizarlo después con el mismo id. */
  cargando: (titulo, descripcion) => toast.loading(titulo, { description: descripcion }),

  cerrar: (id) => toast.dismiss(id),

  /**
   * Para procesos largos (respaldos, restauraciones, recálculos): un solo
   * aviso que pasa de "cargando" a éxito o error cuando la promesa
   * resuelve, en vez de dos avisos sueltos que el usuario ve como ruido.
   */
  promesa: (promesa, { cargando, exito, error }) =>
    toast.promise(promesa, { loading: cargando, success: exito, error }),
};

/* ── Confirmaciones ─────────────────────────────────────────────────────── */

let abrirDialogo = null;

/** Lo llama AvisosHost al montarse. No se usa desde las pantallas. */
export function _registrarDialogo(fn) {
  abrirDialogo = fn;
  return () => { if (abrirDialogo === fn) abrirDialogo = null; };
}

/**
 * Pregunta antes de una acción sensible. Resuelve a true si el usuario
 * confirma, false si cancela o cierra.
 *
 *   if (!(await confirmar({ titulo: "¿Desactivar gimnasio?", ... }))) return;
 *
 * Opciones:
 *   titulo         — la pregunta, en una línea.
 *   mensaje        — qué va a pasar exactamente, en lenguaje cotidiano.
 *   confirmar      — texto del botón que ejecuta (un verbo, no "OK").
 *   cancelar       — texto del botón que cancela.
 *   tono           — "peligro" | "aviso" | "neutro". Decide color e icono.
 *   escribirParaConfirmar — palabra exacta que hay que teclear para
 *                    habilitar el botón. Solo para lo irreversible:
 *                    pedirla en todo entrena a la gente a teclearla sin leer.
 */
export function confirmar(opciones = {}) {
  if (!abrirDialogo) {
    // Respaldo honesto: si el host no está montado, es preferible el
    // diálogo del navegador a ejecutar una acción sensible sin preguntar.
    const texto = [opciones.titulo, opciones.mensaje].filter(Boolean).join("\n\n");
    return Promise.resolve(window.confirm(texto || "¿Continuar?"));
  }
  return new Promise((resolver) => abrirDialogo(opciones, resolver));
}
