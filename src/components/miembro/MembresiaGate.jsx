/**
 * MembresiaGate.jsx -- Reglas de membresía vencida para el portal web del miembro.
 *
 *   <MembresiaGate servicio="tus rutinas"><UserRoutineCreator /></MembresiaGate>
 *   <AvisoMembresia />      // banner de "por vencer / vencida / sin membresía"
 *
 * Misma regla que la app móvil y que el API (utils/membresia.py): con la
 * membresía vencida se bloquean rutinas, entrenamientos y nutrición; Membresía
 * y pagos, perfil, salud y progreso siguen abiertos para poder renovar. El
 * servidor igualmente responde 403 `membresia_vencida`: esto es la parte amable.
 * Ante un fallo de red NO se bloquea (el servidor decide en cada petición).
 */
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiClock } from "react-icons/fi";

let _cache = { t: 0, p: null };

/** Estado de membresía con caché de 30 s compartido por todos los componentes. */
export function useEstadoMembresia() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    if (!_cache.p || Date.now() - _cache.t > 30000) {
      _cache = {
        t: Date.now(),
        p: axios.get("/api/user/membership/estado", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }).then((r) => r.data).catch(() => null),
      };
    }
    _cache.p.then((d) => { if (vivo) { setEstado(d); setCargando(false); } });
    return () => { vivo = false; };
  }, []);

  return { estado, cargando, bloqueado: !!estado && estado.vigente === false };
}

function PantallaBloqueo({ servicio, estado }) {
  const sin = estado?.codigo === "sin_membresia";
  return (
    <div role="alert" style={{ maxWidth: 520, margin: "48px auto", padding: 24, textAlign: "center",
      background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 16 }}>
      <FiClock size={40} aria-hidden style={{ color: "var(--warning-color, #d97706)" }} />
      <h2 style={{ margin: "12px 0 8px" }}>{sin ? "Aún no tienes membresía" : "Tu membresía venció"}</h2>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        {sin ? `Elige un plan para empezar a usar ${servicio}.` : `Renueva tu membresía para volver a usar ${servicio}.`}
        {!sin && estado?.fecha_fin_local ? ` Venció el ${estado.fecha_fin_local}.` : ""}
      </p>
      <p style={{ margin: "10px 0 18px", opacity: 0.8 }}>
        Tranquilo: tu progreso, tus medidas y tu historial siguen guardados.
      </p>
      <Link to="/user/renew" style={{ display: "inline-block", minHeight: 44, lineHeight: "44px", padding: "0 20px",
        borderRadius: 10, background: "var(--accent, #6366f1)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
        {sin ? "Elegir mi membresía" : "Renovar mi membresía"}
      </Link>{" "}
      <Link to="/user/dashboard" style={{ display: "inline-block", minHeight: 44, lineHeight: "44px", padding: "0 16px" }}>
        Volver al inicio
      </Link>
    </div>
  );
}

export function MembresiaGate({ servicio, children }) {
  const { estado, cargando, bloqueado } = useEstadoMembresia();
  if (cargando) return null;
  if (bloqueado) return <PantallaBloqueo servicio={servicio} estado={estado} />;
  return children;
}

export function AvisoMembresia() {
  const { estado } = useEstadoMembresia();
  if (!estado || estado.estado === "activa") return null;
  const d = estado.dias_restantes ?? 0;
  const vencida = estado.estado === "vencida";
  const texto = vencida
    ? `Tu membresía venció el ${estado.fecha_fin_local}. Renuévala para volver a entrenar; tu progreso sigue guardado.`
    : estado.estado === "sin_membresia"
      ? "Aún no tienes una membresía activa. Elige un plan para empezar."
      : d <= 0 ? "Tu membresía vence hoy. Renueva para no perder el acceso."
        : d === 1 ? "Tu membresía vence mañana. Renueva para no perder el acceso."
          : `Tu membresía vence en ${d} días. Renueva a tiempo y sigue entrenando.`;
  return (
    <div role="status" style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 16px 0", padding: "12px 14px",
      borderRadius: 12, background: vencida ? "rgba(220,38,38,.1)" : "rgba(217,119,6,.12)" }}>
      <FiAlertCircle size={20} aria-hidden style={{ flexShrink: 0, color: vencida ? "var(--error-color, #dc2626)" : "var(--warning-color, #d97706)" }} />
      <span style={{ flex: 1, fontSize: 14 }}>{texto}</span>
      <Link to="/user/renew" style={{ fontWeight: 700, minHeight: 44, lineHeight: "44px" }}>
        {estado.estado === "sin_membresia" ? "Elegir plan" : "Renovar"}
      </Link>
    </div>
  );
}
