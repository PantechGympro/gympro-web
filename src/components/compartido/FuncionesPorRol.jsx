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
 * Props
 *   plan    -- un plan de la API (con funciones_por_rol).
 *   planes  -- todos los planes; sirve para decir "disponible desde Pro".
 *   rotuloAbrir -- texto del botón (opcional).
 */
import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiLock } from "react-icons/fi";

const borde = "1px solid var(--border-color, var(--border, rgba(148,163,184,.35)))";
const ANCHO_PANEL = 360;
const MARGEN_VIEWPORT = 16;

/** Plan más barato (o de menor `orden`) que sí incluye esa función. */
function planDesde(planes, rol, nombreFuncion, actualId) {
  const candidatos = [...(planes || [])]
    .filter((p) => p.id !== actualId)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || (a.precio_mensual_mxn ?? 0) - (b.precio_mensual_mxn ?? 0));
  const hallado = candidatos.find((p) => p.funciones_por_rol?.[rol]?.some((f) => f.nombre === nombreFuncion && f.incluido));
  return hallado?.nombre || null;
}

const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** Posición fija del panel, anclado bajo el botón y recortado para no salirse
 * del viewport por la derecha (planes como Enterprise, al final de la fila). */
function calcularRect(botonEl) {
  const r = botonEl.getBoundingClientRect();
  const left = Math.min(r.left, window.innerWidth - ANCHO_PANEL - MARGEN_VIEWPORT);
  return { top: r.bottom + 8, left: Math.max(MARGEN_VIEWPORT, left) };
}

export default function FuncionesPorRol({ plan, planes = [], rotuloAbrir = "Ver todo lo que incluye" }) {
  const roles = useMemo(() => Object.keys(plan?.funciones_por_rol || {}), [plan]);
  const [abierto, setAbierto] = useState(false);
  const [rol, setRol] = useState(null);
  const [rect, setRect] = useState(null);
  const botonRef = useRef(null);
  const panelId = useId();

  const cerrar = () => { setAbierto(false); setRect(null); };

  const toggle = () => {
    if (abierto) { cerrar(); return; }
    setRect(calcularRect(botonRef.current));
    setAbierto(true);
  };

  // La posición se calcula una sola vez al abrir (igual que el flyout del
  // nav): si la página se desplaza o la ventana cambia de tamaño mientras
  // está abierto, se cierra en vez de quedar desalineado del botón.
  useEffect(() => {
    if (!abierto) return;
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
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
              position: "fixed", top: rect.top, left: rect.left, width: ANCHO_PANEL,
              maxHeight: `calc(100vh - ${rect.top + MARGEN_VIEWPORT}px)`, overflowY: "auto",
              textAlign: "left", zIndex: 1200, padding: 16, borderRadius: 14,
              background: "var(--bg-card, #fff)", border: borde,
              boxShadow: "0 16px 40px rgba(0,0,0,.18)",
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
