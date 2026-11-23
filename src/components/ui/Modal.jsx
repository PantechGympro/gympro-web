/**
 * Modal.jsx — Diálogo accesible, con las piezas que suelen faltar.
 *
 * Qué resuelve, punto por punto:
 *   - Cierre con Escape y con clic fuera (ambos opcionales por si el
 *     diálogo no debe poder abandonarse a media operación).
 *   - Bloqueo de scroll del fondo SIN salto de layout: al ocultar la barra
 *     de scroll la página se ensancha unos píxeles y todo el contenido se
 *     corre; se compensa con el mismo ancho en `padding-right`.
 *   - Contador de modales abiertos: con dos diálogos encimados, cerrar el
 *     de arriba ya no desbloquea el scroll del de abajo. Ese era el
 *     "bloqueo de scroll residual" clásico.
 *   - Foco: entra al primer control del panel, se queda atrapado dentro
 *     mientras está abierto (Tab y Shift+Tab hacen ciclo) y vuelve al
 *     elemento que lo abrió al cerrarse.
 *   - Entrada/salida con escala + opacidad, 200ms ease-out, y
 *     `transform-origin: center` -- los modales son la excepción a la
 *     regla de anclar el origen al disparador, porque no cuelgan de uno.
 */
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const EASE_OUT = [0.23, 1, 0.32, 1];
const FOCALIZABLES =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Cuántos modales hay abiertos ahora mismo. El scroll solo se restaura
// cuando se cierra el último.
let abiertos = 0;
let overflowPrevio = "";
let padPrevio = "";

function bloquearScroll() {
  if (abiertos === 0) {
    const anchoBarra = window.innerWidth - document.documentElement.clientWidth;
    overflowPrevio = document.body.style.overflow;
    padPrevio = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (anchoBarra > 0) document.body.style.paddingRight = `${anchoBarra}px`;
  }
  abiertos += 1;
}

function liberarScroll() {
  abiertos = Math.max(0, abiertos - 1);
  if (abiertos === 0) {
    document.body.style.overflow = overflowPrevio;
    document.body.style.paddingRight = padPrevio;
  }
}

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  icono,
  tono = "neutro",
  children,
  pie,
  ancho = 440,
  cerrarAlClicarFuera = true,
  cerrarConEscape = true,
  mostrarCerrar = true,
  etiqueta,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const panelRef = useRef(null);
  const previoRef = useRef(null);

  const cerrar = useCallback(() => { if (onCerrar) onCerrar(); }, [onCerrar]);

  useEffect(() => {
    if (!abierto) return undefined;
    bloquearScroll();
    return liberarScroll;
  }, [abierto]);

  useEffect(() => {
    if (!abierto || !cerrarConEscape) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      // Se detiene aquí para que un modal encimado no cierre también al
      // de abajo con una sola pulsación.
      e.stopPropagation();
      cerrar();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto, cerrarConEscape, cerrar]);

  useEffect(() => {
    if (!abierto) return undefined;
    previoRef.current = document.activeElement;
    const id = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const destino =
        panel.querySelector("[data-foco-inicial]") ||
        panel.querySelector(FOCALIZABLES) ||
        panel;
      destino.focus?.();
    });
    return () => {
      cancelAnimationFrame(id);
      // Devolver el foco a donde estaba evita que el lector de pantalla
      // (y el teclado) queden al principio del documento al cerrar.
      previoRef.current?.focus?.();
    };
  }, [abierto]);

  /** Trampa de foco: Tab hace ciclo dentro del panel. */
  const onKeyDownPanel = (e) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focos = Array.from(panel.querySelectorAll(FOCALIZABLES)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (focos.length === 0) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  const variantesPanel = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: "scale(0.96)" },
        animate: { opacity: 1, transform: "scale(1)" },
        exit:    { opacity: 0, transform: "scale(0.97)" },
      };

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="u-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          onMouseDown={(e) => {
            // mousedown y no click: si el usuario empieza a seleccionar
            // texto dentro del panel y suelta fuera, un handler de click
            // cerraría el diálogo a media selección.
            if (cerrarAlClicarFuera && e.target === e.currentTarget) cerrar();
          }}
        >
          <motion.div
            ref={panelRef}
            className="u-modal"
            role="dialog"
            aria-modal="true"
            aria-label={etiqueta || (typeof titulo === "string" ? titulo : undefined)}
            tabIndex={-1}
            style={{ maxWidth: ancho }}
            onKeyDown={onKeyDownPanel}
            initial={variantesPanel.initial}
            animate={variantesPanel.animate}
            exit={variantesPanel.exit}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            {(titulo || mostrarCerrar) && (
              <div className="u-modal-top">
                {icono && <span className="u-modal-icono" data-tono={tono} aria-hidden="true">{icono}</span>}
                <div style={{ minWidth: 0 }}>
                  {titulo && <h2 className="u-modal-titulo">{titulo}</h2>}
                  {descripcion && <p className="u-modal-desc">{descripcion}</p>}
                </div>
                {mostrarCerrar && (
                  <button type="button" className="u-modal-cerrar" onClick={cerrar} aria-label="Cerrar">
                    <FiX size={16} />
                  </button>
                )}
              </div>
            )}
            {children && <div className="u-modal-cuerpo">{children}</div>}
            {pie && <div className="u-modal-pie">{pie}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
