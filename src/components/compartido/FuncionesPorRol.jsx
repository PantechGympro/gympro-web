/**
 * FuncionesPorRol.jsx
 * "Ver todo lo que incluye": despliega, rol por rol (propietario, recepción,
 * entrenador y miembro), lo que el plan incluye y lo que no.
 *
 * Lee `plan.funciones_por_rol` (backend: constants/catalogo_funciones.py), así
 * que web y móvil muestran siempre lo mismo y lo que aparece como bloqueado es
 * lo que el servidor realmente rechaza con 402.
 *
 * El panel se renderiza por portal a <body>, con posición fija calculada a
 * partir del botón que lo abre (mismo patrón que el flyout lateral del nav en
 * Sidebar.jsx) -- NO inline/empujando el contenido hacia abajo. En Landing.jsx
 * esto se usa lado a lado con los otros planes en una fila; expandir inline
 * cambiaba la altura de esa tarjeta y deformaba a sus vecinas (todas quedan
 * igual de altas por el layout de la fila). Como panel flotante, abrir uno no
 * mueve nada del resto de la página.
 *
 * Fix 2026-11-22: el panel se cerraba solo al intentar scrollear SU PROPIO
 * contenido (se reportó como "se cierra al mover el cursor / interactuar").
 * La causa era el listener `window.addEventListener("scroll", cerrar, true)`
 * -- el `true` final lo pone en fase de "captura", y un scroll SÍ pasa por
 * esa fase en `window` aunque el evento no haga bubbling y el objetivo real
 * sea un descendiente (aquí, el propio `<ul>` con `overflowY: "auto"` del
 * panel). Resultado: scrollear la lista de funciones disparaba `cerrar()` de
 * inmediato. Quitar la fase de captura basta como arreglo -- "scroll" no
 * hace bubbling, así que un listener normal en `window` solo reacciona
 * cuando el scroll real es el de la página (que es la intención original:
 * cerrar si el panel quedaría desalineado de su botón).
 *
 * De paso (mismo bug, visto en el screenshot de Miguel: panel recortado y
 * encimado sobre la tarjeta vecina en una ventana baja): el panel ahora
 * detecta si no hay suficiente espacio debajo del botón y se ancla hacia
 * arriba en ese caso, con `transform-origin` correcto para la animación de
 * entrada (criterio `review-animations`: popovers nunca escalan desde el
 * centro, siempre desde su punto de anclaje real).
 *
 * Props
 *   plan    -- un plan de la API (con funciones_por_rol).
 *   planes  -- todos los planes; sirve para decir "disponible desde Pro".
 *   rotuloAbrir -- texto del botón (opcional).
 */
import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiLock } from "react-icons/fi";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const borde = "1px solid var(--border-color, var(--border, rgba(148,163,184,.35)))";
const ANCHO_PANEL = 360;
const MARGEN_VIEWPORT = 16;
// Debajo de esto el panel ya no sirve para nada (apenas un par de líneas
// visibles con scroll inmediato) -- mejor voltear hacia arriba si ahí hay
// más sitio, en vez de forzar ese espacio.
const ALTO_MINIMO_UTIL = 200;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"; // mismo token que Landing.jsx (--gympro-ease-out)

/** Plan más barato (o de menor `orden`) que sí incluye esa función. */
function planDesde(planes, rol, nombreFuncion, actualId) {
  const candidatos = [...(planes || [])]
    .filter((p) => p.id !== actualId)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || (a.precio_mensual_mxn ?? 0) - (b.precio_mensual_mxn ?? 0));
  const hallado = candidatos.find((p) => p.funciones_por_rol?.[rol]?.some((f) => f.nombre === nombreFuncion && f.incluido));
  return hallado?.nombre || null;
}

const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/**
 * Posición fija del panel, anclado al botón y recortado para no salirse del
 * viewport. Decide además hacia qué lado abrir verticalmente: si debajo del
 * botón no cabe un panel útil pero arriba sí, se ancla por su borde inferior
 * en vez de por el superior -- así no hace falta conocer de antemano la
 * altura real del panel (depende de cuántas funciones tenga ese rol), el
 * `maxHeight` + `overflowY: auto` se encargan del resto en cualquier caso.
 */
function calcularRect(botonEl) {
  const r = botonEl.getBoundingClientRect();
  const left = Math.max(MARGEN_VIEWPORT, Math.min(r.left, window.innerWidth - ANCHO_PANEL - MARGEN_VIEWPORT));
  const espacioAbajo = window.innerHeight - r.bottom - MARGEN_VIEWPORT;
  const espacioArriba = r.top - MARGEN_VIEWPORT;

  if (espacioAbajo < ALTO_MINIMO_UTIL && espacioArriba > espacioAbajo) {
    return {
      left,
      bottom: window.innerHeight - r.top + 8,
      maxHeight: Math.max(ALTO_MINIMO_UTIL, espacioArriba),
      origen: "bottom center",
    };
  }
  return {
    left,
    top: r.bottom + 8,
    maxHeight: Math.max(ALTO_MINIMO_UTIL, espacioAbajo),
    origen: "top center",
  };
}

export default function FuncionesPorRol({ plan, planes = [], rotuloAbrir = "Ver todo lo que incluye" }) {
  const roles = useMemo(() => Object.keys(plan?.funciones_por_rol || {}), [plan]);
  const [abierto, setAbierto] = useState(false);
  const [mostrando, setMostrando] = useState(false);
  const [rol, setRol] = useState(null);
  const [rect, setRect] = useState(null);
  const botonRef = useRef(null);
  const panelId = useId();
  const prefersReducedMotion = usePrefersReducedMotion();

  const cerrar = () => { setAbierto(false); setRect(null); };

  const toggle = () => {
    if (abierto) { cerrar(); return; }
    setRect(calcularRect(botonRef.current));
    setAbierto(true);
  };

  // Entrada: arranca en opacity:0/scale:0.95 y pasa a su estado final un
  // frame después de montar (mismo patrón que `heroMontado` en Landing.jsx)
  // -- si activáramos la clase final en el mismo render que monta el panel,
  // el navegador podría pintar ya con los valores finales y la transición
  // nunca llegaría a verse.
  useEffect(() => {
    if (!abierto) { setMostrando(false); return undefined; }
    const id = requestAnimationFrame(() => setMostrando(true));
    return () => cancelAnimationFrame(id);
  }, [abierto]);

  // La posición se calcula una sola vez al abrir (igual que el flyout del
  // nav): si la página se desplaza o la ventana cambia de tamaño mientras
  // está abierto, se cierra en vez de quedar desalineado del botón. Sin
  // fase de captura: "scroll" no hace bubbling, así que esto solo reacciona
  // al scroll real de la página, nunca al scroll interno del propio panel.
  useEffect(() => {
    if (!abierto) return undefined;
    const onKeyDown = (e) => { if (e.key === "Escape") cerrar(); };
    window.addEventListener("scroll", cerrar);
    window.addEventListener("resize", cerrar);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", cerrar);
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!roles.length) return null;

  const rolActual = roles.includes(rol) ? rol : roles[0];
  const items = plan.funciones_por_rol[rolActual];
  const incluidas = items.filter((f) => f.incluido).length;

  return (
    <div style={{ marginTop: 4 }}>
      <button ref={botonRef} type="button" onClick={toggle} aria-expanded={abierto} aria-controls={panelId}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "6px 0",
                       color: "var(--accent, #6366f1)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        {abierto ? "Ver menos" : rotuloAbrir}
        <FiChevronDown aria-hidden style={{ transition: "transform .2s", transform: abierto ? "rotate(180deg)" : "none" }} />
      </button>

      {abierto && rect && createPortal(
        <>
          <div onClick={cerrar} style={{ position: "fixed", inset: 0, zIndex: 1199 }} />
          <div
            id={panelId}
            style={{
              position: "fixed",
              left: rect.left,
              ...(rect.top !== undefined ? { top: rect.top } : { bottom: rect.bottom }),
              width: ANCHO_PANEL,
              maxHeight: rect.maxHeight,
              overflowY: "auto",
              textAlign: "left", zIndex: 1200, padding: 16, borderRadius: 14,
              background: "var(--bg-card, #fff)", border: borde,
              boxShadow: "0 16px 40px rgba(0,0,0,.18)",
              transformOrigin: rect.origen,
              opacity: mostrando || prefersReducedMotion ? 1 : 0,
              transform: mostrando || prefersReducedMotion ? "scale(1)" : "scale(0.95)",
              transition: prefersReducedMotion
                ? `opacity 160ms ${EASE_OUT}`
                : `opacity 160ms ${EASE_OUT}, transform 160ms ${EASE_OUT}`,
            }}
          >
            <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", margin: "0 0 8px", lineHeight: 1.45 }}>
              Tu gimnasio no solo se administra: cada persona del equipo y cada socio usa su propia parte de GymPro. Esto es lo que incluye este plan para cada uno.
            </p>

            <div role="tablist" aria-label="Funciones por tipo de usuario" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {roles.map((r) => {
                const activo = r === rolActual;
                const n = plan.funciones_por_rol[r].filter((f) => f.incluido).length;
                return (
                  <button key={r} type="button" role="tab" aria-selected={activo} onClick={() => setRol(r)}
                          style={{ padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                   border: activo ? "1px solid var(--accent, #6366f1)" : borde,
                                   background: activo ? "var(--accent, #6366f1)" : "transparent",
                                   color: activo ? "#fff" : "var(--text-secondary, #94a3b8)" }}>
                    {r} · {n}/{plan.funciones_por_rol[r].length}
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", margin: "0 0 8px" }}>
              {incluidas} de {items.length} funciones incluidas para {rolActual.toLowerCase()}.
            </p>

            <ul role="tabpanel" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((f) => {
                const desde = !f.incluido ? planDesde(planes, rolActual, f.nombre, plan.id) : null;
                return (
                  <li key={f.nombre} style={{ display: "flex", gap: 8, alignItems: "flex-start", opacity: f.incluido ? 1 : 0.7 }}>
                    {f.incluido
                      ? <FiCheck aria-label="Incluido" style={{ color: "var(--success, #16a34a)", flexShrink: 0, marginTop: 3 }} size={14} />
                      : <FiLock aria-label="No incluido" style={{ color: "var(--text-secondary, #94a3b8)", flexShrink: 0, marginTop: 3 }} size={13} />}
                    <span style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--text-primary, inherit)" }}>
                      <strong style={{ fontWeight: 700 }}>{f.nombre}</strong>
                      <span style={{ display: "block", color: "var(--text-secondary, #94a3b8)", fontSize: 12 }}>{f.descripcion}</span>
                      {!f.incluido && (
                        <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--warning-color, #d97706)" }}>
                          {desde ? `Disponible desde el plan ${capitalizar(desde)}` : "No incluido en este plan"}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
