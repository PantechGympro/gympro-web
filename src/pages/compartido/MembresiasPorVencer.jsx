/**
 * MembresiasPorVencer.jsx
 * Lista de miembros cuya membresía vence pronto. La usan Propietario,
 * Administrador (panel /owner) y Recepcionista (panel /receptionist): el
 * backend (GET /api/membresias/por-vencer) ya filtra por gimnasio y rol.
 *
 * Pensada para "llamar hoy a quien vence esta semana": ordena por fecha de
 * vencimiento, muestra día y hora exactos y deja contactar con un toque
 * (llamar, WhatsApp, correo). En pantallas angostas la tabla se vuelve tarjetas.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { FiRefreshCw, FiPhone, FiMail, FiMessageCircle, FiSearch, FiClock } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { mensajeDeRespuesta } from "../../utils/errores";
import "../../css/CSSUnificado.css";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const ESTADOS = {
  por_vencer: { label: "Por vencer", color: "var(--warning-color, #d97706)" },
  vencida:    { label: "Vencida",    color: "var(--error-color, #dc2626)" },
  activa:     { label: "Vigente",    color: "var(--success-color, #16a34a)" },
};

const OPCIONES_DIAS = [7, 15, 30];

/** "Vence hoy", "Vence mañana", "Vence en 5 días", "Venció hace 2 días". */
function textoRestante(f) {
  const d = f.dias_restantes;
  if (f.estado === "vencida") return d >= -1 ? "Venció hoy" : `Venció hace ${Math.abs(d)} días`;
  if (d <= 0) return `Vence hoy (en ${Math.max(f.horas_restantes, 0)} h)`;
  if (d === 1) return "Vence mañana";
  return `Vence en ${d} días`;
}

/** Solo dígitos para wa.me; 10 dígitos se asumen de México (+52). */
function telefonoWhatsApp(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  return d.length === 10 ? `52${d}` : d;
}

export default function MembresiasPorVencer() {
  const esMovil = useIsMobile();
  const [dias, setDias] = useState(7);
  const [incluirVencidas, setIncluirVencidas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/membresias/por-vencer", {
        headers: headers(),
        params: { dias, incluir_vencidas: incluirVencidas },
      });
      setFilas(data.miembros || []);
    } catch (e) {
      setError(mensajeDeRespuesta(e, "No pudimos cargar las membresías por vencer."));
    } finally {
      setCargando(false);
    }
  }, [dias, incluirVencidas]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter((f) =>
      [f.nombre, f.email, f.telefono, f.tipo_membresia].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [filas, busqueda]);

  const estiloChip = (activo) => ({
    padding: "8px 14px", minHeight: 44, borderRadius: 999, cursor: "pointer", fontWeight: 600, fontSize: 14,
    border: "1px solid var(--border-color, #cbd5e1)",
    background: activo ? "var(--accent, #6366f1)" : "transparent",
    color: activo ? "#fff" : "var(--text-primary)",
  });

  const Contacto = ({ f }) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {f.telefono && (
        <>
          <a href={`tel:${f.telefono}`} aria-label={`Llamar a ${f.nombre}`} className="btn-secondary" style={botonContacto}><FiPhone /> Llamar</a>
          <a href={`https://wa.me/${telefonoWhatsApp(f.telefono)}`} target="_blank" rel="noopener noreferrer"
             aria-label={`Enviar WhatsApp a ${f.nombre}`} className="btn-secondary" style={botonContacto}><FiMessageCircle /> WhatsApp</a>
        </>
      )}
      {f.email && (
        <a href={`mailto:${f.email}`} aria-label={`Enviar correo a ${f.nombre}`} className="btn-secondary" style={botonContacto}><FiMail /> Correo</a>
      )}
      {!f.telefono && !f.email && <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Sin datos de contacto</span>}
    </div>
  );

  const Badge = ({ estado }) => {
    const e = ESTADOS[estado] || ESTADOS.activa;
    return <span style={{ color: e.color, border: `1px solid ${e.color}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{e.label}</span>;
  };

  return (
    <div style={{ padding: esMovil ? "72px 16px 24px" : "28px 32px", color: "var(--text-primary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Membresías por vencer</h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)" }}>
            Contacta a tiempo a quienes están por terminar su plan y evita que dejen de venir.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={cargar} disabled={cargando} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6 }}>
          <FiRefreshCw /> {cargando ? "Actualizando…" : "Actualizar lista"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        {OPCIONES_DIAS.map((n) => (
          <button key={n} type="button" style={estiloChip(dias === n)} onClick={() => setDias(n)} aria-pressed={dias === n}>
            Próximos {n} días
          </button>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 14 }}>
          <input type="checkbox" checked={incluirVencidas} onChange={(e) => setIncluirVencidas(e.target.checked)} />
          Incluir las que ya vencieron
        </label>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 360 }}>
          <FiSearch style={{ position: "absolute", left: 12, top: 14, color: "var(--text-secondary)" }} aria-hidden />
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                 placeholder="Buscar por nombre, plan o contacto" aria-label="Buscar en la lista"
                 style={{ width: "100%", minHeight: 44, padding: "0 12px 0 36px", borderRadius: 10, border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card)", color: "var(--text-primary)" }} />
        </div>
      </div>

      {error && <div role="alert" style={{ padding: 12, borderRadius: 10, background: "rgba(220,38,38,.1)", color: "var(--error-color, #dc2626)", marginBottom: 12 }}>{error}</div>}

      {cargando && !filas.length ? (
        <p>Cargando…</p>
      ) : !visibles.length ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
          <FiClock size={32} aria-hidden />
          <p>{busqueda ? "Ninguna coincidencia con tu búsqueda." : `Ninguna membresía vence en los próximos ${dias} días. ¡Buen trabajo!`}</p>
        </div>
      ) : esMovil ? (
        <div style={{ display: "grid", gap: 12 }}>
          {visibles.map((f) => (
            <div key={f.id} style={tarjeta}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong>{f.nombre}</strong><Badge estado={f.estado} />
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 14, margin: "6px 0" }}>{f.tipo_membresia}</div>
              <div style={{ fontSize: 14, marginBottom: 10 }}><strong>{textoRestante(f)}</strong> · {f.fecha_fin_local}</div>
              <Contacto f={f} />
            </div>
          ))}
        </div>
      ) : (
        <div className="superadmin-table-scroll" style={tarjeta}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-secondary)", fontSize: 13 }}>
                <th style={th}>Miembro</th><th style={th}>Plan</th><th style={th}>Vence</th><th style={th}>Estado</th><th style={th}>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id} style={{ borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                  <td style={td}><strong>{f.nombre}</strong></td>
                  <td style={td}>{f.tipo_membresia}</td>
                  <td style={td}>{f.fecha_fin_local}<div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{textoRestante(f)}</div></td>
                  <td style={td}><Badge estado={f.estado} /></td>
                  <td style={td}><Contacto f={f} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 12 }}>{visibles.length} miembro(s) · Las horas son del horario del gimnasio.</p>
    </div>
  );
}

const th = { padding: "10px 12px", fontWeight: 600 };
const td = { padding: "12px", verticalAlign: "top", fontSize: 14 };
const tarjeta = { background: "var(--bg-card)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 14, padding: 16 };
const botonContacto = { minHeight: 44, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 12px", textDecoration: "none", fontSize: 13 };
