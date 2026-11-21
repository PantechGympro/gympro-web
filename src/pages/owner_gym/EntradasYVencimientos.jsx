/**
 * EntradasYVencimientos.jsx
 * Una sola entrada del menú para dos tareas que se hacen juntas en el
 * mostrador: registrar la llegada de un miembro y ver a quién se le vence la
 * membresía. Antes eran dos filas sueltas del sidebar ("Registrar entrada" y
 * "Por vencer"); ahora comparten pantalla con pestañas, igual que Staff.
 *
 * Cada pestaña sigue teniendo su propia URL (/owner/checkin y
 * /owner/por-vencer): los enlaces y marcadores anteriores no se rompen, el
 * botón "atrás" del navegador cambia de pestaña y la pestaña activa sale de la
 * ruta, no de un estado local que se pierda al recargar.
 */
import { useNavigate } from "react-router-dom";
import { FiUserCheck, FiClock } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import CheckinManual from "./CheckinManual";
import MembresiasPorVencer from "../compartido/MembresiasPorVencer";

export const PESTANAS_ENTRADAS = [
  { v: "checkin",    label: "Registrar entrada", to: "/owner/checkin",    icon: <FiUserCheck /> },
  { v: "por-vencer", label: "Por vencer",        to: "/owner/por-vencer", icon: <FiClock />     },
];

export default function EntradasYVencimientos({ tab = "checkin" }) {
  const navigate = useNavigate();
  const esMovil = useIsMobile();
  const activa = PESTANAS_ENTRADAS.some((p) => p.v === tab) ? tab : "checkin";

  return (
    <div>
      {/* Mismo gutter que las pantallas hijas; en móvil deja libre el botón
          hamburguesa (72 px), que las hijas ya no reservan al ir embebidas. */}
      <div style={{ padding: esMovil ? "72px 16px 0" : "28px 32px 0" }}>
        <div
          role="tablist"
          aria-label="Entradas y vencimientos"
          style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}
        >
          {PESTANAS_ENTRADAS.map(({ v, label, to, icon }) => {
            const seleccionada = activa === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={seleccionada}
                onClick={() => { if (!seleccionada) navigate(to); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: "none", border: "none", marginBottom: -1,
                  borderBottom: `2px solid ${seleccionada ? "var(--accent, #6366f1)" : "transparent"}`,
                  color: seleccionada ? "var(--accent, #6366f1)" : "var(--text-secondary, #94a3b8)",
                }}
              >
                {icon}{label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel">
        {activa === "checkin" ? <CheckinManual embebido /> : <MembresiasPorVencer embebido />}
      </div>
    </div>
  );
}
