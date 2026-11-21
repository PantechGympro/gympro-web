/**
 * SelectorDestinatarios.jsx — "Quién lo recibe" de un reporte automático.
 *
 * Tres fuentes que se combinan (al menos una es obligatoria):
 *   - Propietario            (casilla)
 *   - Administrador(es)      (casilla — los activos asignados a la sucursal)
 *   - Otros correos          (hasta MAX_CORREOS_EXTRA, cualquier dirección)
 * "Ambos" es marcar las dos casillas.
 *
 * Controlado: el padre guarda { propietario, administrador, extras } y recibe
 * los cambios por onChange. `disponibles` (opcional, de
 * GET /reportes/automaticos/destinatarios) solo informa a quién resuelve hoy
 * cada casilla -- si no llega, el selector funciona igual, sin esos detalles.
 */
import { useState } from "react";
import { FiCheckSquare, FiSquare, FiX, FiPlus, FiAlertCircle } from "react-icons/fi";
import { agregarCorreos, MAX_CORREOS_EXTRA } from "../../utils/correos";

const C = {
  input:  "var(--bg-input, var(--bg-main))",
  border: "var(--border)",
  t2:     "var(--text-secondary, #94a3b8)",
  accent: "var(--accent, #6366f1)",
  danger: "var(--danger, #ef4444)",
  warn:   "var(--warning, #eab308)",
};

const filaStyle = (activa) => ({
  display: "flex", alignItems: "center", gap: 12, cursor: "pointer", width: "100%",
  textAlign: "left", font: "inherit", color: "inherit",
  padding: "13px 15px", borderRadius: 11, background: C.input,
  border: `1px solid ${activa ? C.accent : C.border}`,
});

function FilaCasilla({ activa, titulo, detalle, advertencia, onToggle }) {
  return (
    <button type="button" role="checkbox" aria-checked={activa} onClick={onToggle} style={filaStyle(activa)}>
      <span style={{ color: activa ? C.accent : C.t2, display: "flex" }}>
        {activa ? <FiCheckSquare size={19} /> : <FiSquare size={19} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{titulo}</span>
        <span style={{
          display: "block", marginTop: 2, fontSize: 11.5, wordBreak: "break-word",
          color: advertencia ? C.warn : C.t2,
        }}>
          {detalle}
        </span>
      </span>
    </button>
  );
}

export default function SelectorDestinatarios({ value, onChange, disponibles = null }) {
  const { propietario, administrador, extras } = value;
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState("");

  const max = disponibles?.max_correos_extra ?? MAX_CORREOS_EXTRA;
  const cambiar = (parcial) => onChange({ ...value, ...parcial });

  const agregar = () => {
    if (!texto.trim()) return;
    const { correos, invalidos, excedido } = agregarCorreos(extras, texto, max);
    if (correos.length !== extras.length) cambiar({ extras: correos });

    if (invalidos.length) {
      setAviso(`Correo no válido: ${invalidos.slice(0, 3).join(", ")}`);
      setTexto(invalidos.join(", "));          // deja a la vista lo que falta corregir
    } else {
      setAviso(excedido ? `Máximo ${max} correos adicionales` : "");
      setTexto("");
    }
  };

  const quitar = (correo) => {
    cambiar({ extras: extras.filter((c) => c !== correo) });
    setAviso("");
  };

  const emailPropietario = disponibles?.propietario?.email;
  const admins = disponibles?.administradores;
  const sinAdmins = Array.isArray(admins) && admins.length === 0;
  const sinPropietario = disponibles && !emailPropietario;

  return (
    <div style={{ display: "grid", gap: 9 }}>
      <FilaCasilla
        activa={propietario}
        titulo="Propietario"
        detalle={sinPropietario ? "No hay un Propietario con correo registrado" : (emailPropietario || "El dueño del gimnasio")}
        advertencia={sinPropietario}
        onToggle={() => cambiar({ propietario: !propietario })}
      />
      <FilaCasilla
        activa={administrador}
        titulo="Administrador"
        detalle={
          sinAdmins
            ? "Esta sucursal no tiene un Administrador activo asignado"
            : Array.isArray(admins) ? admins.map((a) => a.email).join(", ") : "Los administradores de la sucursal"
        }
        advertencia={sinAdmins}
        onToggle={() => cambiar({ administrador: !administrador })}
      />

      <div style={{ padding: "13px 15px", borderRadius: 11, background: C.input, border: `1px solid ${extras.length ? C.accent : C.border}` }}>
        <label htmlFor="destinatarios-extra" style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>
          Otros correos
        </label>
        <span style={{ display: "block", margin: "2px 0 10px", fontSize: 11.5, color: C.t2 }}>
          Contador, socio, etc. Hasta {max}; cualquier dirección.
        </span>

        {extras.length > 0 && (
          <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 10px", padding: 0, listStyle: "none" }}>
            {extras.map((c) => (
              <li key={c} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 6px 5px 12px",
                borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                background: "var(--accent-dim, rgba(99,102,241,.15))", color: C.accent,
              }}>
                {c}
                <button
                  type="button" aria-label={`Quitar ${c}`} onClick={() => quitar(c)}
                  style={{ display: "flex", border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 2 }}
                >
                  <FiX size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {extras.length < max && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="destinatarios-extra" type="text" inputMode="email" autoComplete="off"
              value={texto} placeholder="correo@ejemplo.com"
              onChange={(e) => { setTexto(e.target.value); if (aviso) setAviso(""); }}
              onKeyDown={(e) => {
                if (["Enter", ",", ";"].includes(e.key)) { e.preventDefault(); agregar(); }
              }}
              onBlur={agregar}
              style={{
                flex: 1, minWidth: 0, padding: "10px 14px", borderRadius: 10, fontSize: 13.5,
                border: `1px solid ${aviso ? C.danger : C.border}`, background: "var(--bg-main)",
                color: "var(--text-primary, #f1f5f9)",
              }}
            />
            <button
              type="button" onClick={agregar} aria-label="Agregar correo"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: "transparent", color: "inherit",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              <FiPlus /> Agregar
            </button>
          </div>
        )}

        {aviso && (
          <p role="alert" style={{ margin: "8px 0 0", fontSize: 12, color: C.danger, display: "flex", alignItems: "center", gap: 5 }}>
            <FiAlertCircle /> {aviso}
          </p>
        )}
      </div>
    </div>
  );
}
