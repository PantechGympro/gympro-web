/**
 * CheckinManual.jsx
 * Registro de entrada de miembros por Propietario y Administrador.
 *   - Búsqueda rápida por nombre, correo, teléfono o número de socio.
 *   - Muestra el estado de la membresía ANTES de registrar: si está vencida o
 *     no existe, el botón se desactiva y se explica qué hacer.
 *   - El backend vuelve a validar (POST /api/checkins/manual): la regla nunca
 *     depende solo de lo que pinta esta pantalla.
 */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiSearch, FiUserCheck, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { mensajeDeRespuesta } from "../../utils/errores";
import "../../css/CSSUnificado.css";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const ESTADOS = {
  activa:        { label: "Membresía vigente", color: "var(--success-color, #16a34a)", puede: true },
  por_vencer:    { label: "Vigente · vence pronto", color: "var(--warning-color, #d97706)", puede: true },
  vencida:       { label: "Membresía vencida", color: "var(--error-color, #dc2626)", puede: false },
  sin_membresia: { label: "Sin membresía activa", color: "var(--error-color, #dc2626)", puede: false },
};

export default function CheckinManual() {
  const esMovil = useIsMobile();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [registrando, setRegistrando] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }
  const peticionActual = useRef(0);

  // Búsqueda con espera de 350 ms; se descartan respuestas viejas (carrera).
  useEffect(() => {
    if (q.trim().length < 2) { setResultados([]); return undefined; }
    const id = ++peticionActual.current;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const { data } = await axios.get("/api/checkins/manual/buscar", { headers: headers(), params: { q: q.trim() } });
        if (id === peticionActual.current) setResultados(data.miembros || []);
      } catch (e) {
        if (id === peticionActual.current) setAviso({ tipo: "error", texto: mensajeDeRespuesta(e, "No pudimos buscar miembros.") });
      } finally {
        if (id === peticionActual.current) setBuscando(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const registrar = async (m) => {
    setRegistrando(m.id);
    setAviso(null);
    try {
      const { data } = await axios.post("/api/checkins/manual", { id_miembro: m.id }, { headers: headers() });
      setAviso({ tipo: "ok", texto: `${data.message} (${data.hora})` });
      setQ(""); setResultados([]);
    } catch (e) {
      setAviso({ tipo: "error", texto: mensajeDeRespuesta(e, "No pudimos registrar la entrada.") });
    } finally {
      setRegistrando(null);
    }
  };

  return (
    <div style={{ padding: esMovil ? "72px 16px 24px" : "28px 32px", color: "var(--text-primary)", maxWidth: 820 }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Registrar entrada</h1>
      <p style={{ color: "var(--text-secondary)", margin: "4px 0 16px" }}>
        Busca al miembro por nombre, correo, teléfono o número de socio y registra su llegada.
      </p>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <FiSearch style={{ position: "absolute", left: 14, top: 16, color: "var(--text-secondary)" }} aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} autoFocus
               placeholder="Escribe al menos 2 letras o el número de socio" aria-label="Buscar miembro"
               style={{ width: "100%", minHeight: 48, padding: "0 14px 0 40px", borderRadius: 12, fontSize: 16,
                        border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card)", color: "var(--text-primary)" }} />
      </div>

      {aviso && (
        <div role={aviso.tipo === "error" ? "alert" : "status"} style={{
          display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 12, marginBottom: 12,
          background: aviso.tipo === "ok" ? "rgba(22,163,74,.12)" : "rgba(220,38,38,.1)",
          color: aviso.tipo === "ok" ? "var(--success-color, #16a34a)" : "var(--error-color, #dc2626)" }}>
          {aviso.tipo === "ok" ? <FiCheckCircle size={20} /> : <FiAlertTriangle size={20} />}
          <span>{aviso.texto}</span>
        </div>
      )}

      {buscando && <p style={{ color: "var(--text-secondary)" }}>Buscando…</p>}
      {!buscando && q.trim().length >= 2 && !resultados.length && (
        <p style={{ color: "var(--text-secondary)" }}>No encontramos a nadie con “{q.trim()}”. Revisa la escritura o prueba con el número de socio.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {resultados.map((m) => {
          const est = ESTADOS[m.estado] || ESTADOS.sin_membresia;
          return (
            <div key={m.id} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between",
                                     background: "var(--bg-card)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 14, padding: 14 }}>
              <div style={{ minWidth: 0 }}>
                <strong>{m.nombre}</strong>
                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}> · Socio #{m.id_usuario_pg}</span>
                <div style={{ color: est.color, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                  {est.label}{m.tipo_membresia ? ` · ${m.tipo_membresia}` : ""}
                  {m.fecha_fin_local ? ` · ${est.puede ? "vence" : "venció"} ${m.fecha_fin_local}` : ""}
                </div>
                {!est.puede && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                    Para registrar su entrada primero debe renovar o contratar un plan.
                  </div>
                )}
              </div>
              <button type="button" className="btn-primary" disabled={!est.puede || registrando === m.id}
                      onClick={() => registrar(m)} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6 }}>
                <FiUserCheck /> {registrando === m.id ? "Registrando…" : "Registrar entrada"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
