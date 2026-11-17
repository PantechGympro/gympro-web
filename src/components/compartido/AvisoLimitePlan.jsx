/**
 * AvisoLimitePlan.jsx
 * Banner amable para Propietario/Administrador cuando el gimnasio está cerca
 * (>= 90 %) o en el tope de miembros, staff o sucursales de su plan.
 * Lee GET /api/plan/estado (solo lectura). Se puede cerrar por sesión.
 * El tope real lo sigue aplicando el servidor en cada alta.
 */
import { useEffect, useState } from "react";
import axios from "axios";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const CLAVE = "aviso_limite_plan_cerrado";

const ETIQUETAS = { miembros: "miembros activos", staff: "usuarios de staff", sucursales: "sucursales" };

export default function AvisoLimitePlan({ onVerPlanes }) {
  const [avisos, setAvisos] = useState([]);
  const [cerrado, setCerrado] = useState(() => {
    try { return sessionStorage.getItem(CLAVE) === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (cerrado) return undefined;
    let vivo = true;
    axios.get("/api/plan/estado", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(({ data }) => {
        if (!vivo) return;
        const lista = ["miembros", "staff", "sucursales"]
          .map((k) => ({ k, b: data[k] }))
          .filter(({ b }) => b && b.tope != null && (b.cerca_del_tope || b.en_el_tope))
          .map(({ k, b }) => ({ k, actual: b.actual, tope: b.tope, lleno: b.en_el_tope }));
        setAvisos(lista);
      })
      .catch(() => { /* aviso opcional: si falla, simplemente no se muestra */ });
    return () => { vivo = false; };
  }, [cerrado]);

  if (cerrado || !avisos.length) return null;
  const hayLleno = avisos.some((a) => a.lleno);

  const cerrar = () => {
    try { sessionStorage.setItem(CLAVE, "1"); } catch { /* sin storage: solo se cierra ahora */ }
    setCerrado(true);
  };

  return (
    <div role="status" style={{
      display: "flex", alignItems: "flex-start", gap: 12, margin: "12px 16px 0", padding: "12px 14px", borderRadius: 12,
      background: hayLleno ? "rgba(220,38,38,.1)" : "rgba(217,119,6,.12)",
      color: hayLleno ? "var(--error-color, #dc2626)" : "var(--warning-color, #d97706)",
    }}>
      <FiAlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
      <div style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>
        <strong>{hayLleno ? "Llegaste al límite de tu plan" : "Estás por llegar al límite de tu plan"}</strong>
        <div>
          {avisos.map((a) => `${a.actual} de ${a.tope} ${ETIQUETAS[a.k]}`).join(" · ")}.{" "}
          {hayLleno ? "No podrás agregar más hasta ampliar tu capacidad." : "Planea tu ampliación para no frenar las altas."}
          {onVerPlanes && (
            <button type="button" onClick={onVerPlanes}
              style={{ marginLeft: 8, background: "none", border: 0, color: "var(--accent, #6366f1)", fontWeight: 700, cursor: "pointer", minHeight: 44 }}>
              Ver opciones
            </button>
          )}
        </div>
      </div>
      <button type="button" onClick={cerrar} aria-label="Cerrar aviso"
        style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", minWidth: 44, minHeight: 44 }}>
        <FiX />
      </button>
    </div>
  );
}
