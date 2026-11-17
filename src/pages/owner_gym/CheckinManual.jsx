/**
 * CheckinManual.jsx
 * Registro de entrada de miembros por Propietario y Administrador.
 *   - Al abrir lista a los miembros del gimnasio (paginada, con selector de
 *     cuántos ver), para que la pantalla nunca parezca vacía o sin cargar.
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
import PaginacionControles, { usePorPagina } from "../../components/compartido/PaginacionControles";
import { mensajeDeRespuesta } from "../../utils/errores";
import "../../css/CSSUnificado.css";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const ESTADOS = {
  activa:        { label: "Membresía vigente", color: "var(--success-color, #16a34a)", puede: true },
  por_vencer:    { label: "Vigente · vence pronto", color: "var(--warning-color, #d97706)", puede: true },
  vencida:       { label: "Membresía vencida", color: "var(--error-color, #dc2626)", puede: false },
  sin_membresia: { label: "Sin membresía activa", color: "var(--error-color, #dc2626)", puede: false },
};

const OPCIONES = [10, 20, 50];
const MIN_BUSQUEDA = 2;
// Una búsqueda es válida con 2+ caracteres o con un número de socio (aunque sea de 1 dígito).
const esBusqueda = (q) => q.length >= MIN_BUSQUEDA || /^\d+$/.test(q);

export default function CheckinManual() {
  const esMovil = useIsMobile();
  const [q, setQ] = useState("");
  const [miembros, setMiembros] = useState([]);
  const [page, setPage] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = usePorPagina("owner-checkin", 10, OPCIONES);
  const [cargando, setCargando] = useState(true);       // true desde el inicio: nunca "en blanco"
  const [errorCarga, setErrorCarga] = useState(null);
  const [recarga, setRecarga] = useState(0);            // fuerza un reintento
  const [registrando, setRegistrando] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }
  const peticionActual = useRef(0);
  const qAnterior = useRef(q);

  const busqueda = q.trim();
  const filtrando = esBusqueda(busqueda);
  const escribiendoPoco = busqueda.length > 0 && !filtrando;   // 1 letra: pedimos un poco más

  // Carga la lista (o la búsqueda). Al teclear espera 350 ms; al paginar o
  // cambiar el tamaño va directo. Se descartan respuestas viejas (carrera).
  useEffect(() => {
    if (escribiendoPoco) { setMiembros([]); setTotal(0); setCargando(false); return undefined; }
    const id = ++peticionActual.current;
    const espera = qAnterior.current !== q ? 350 : 0;
    qAnterior.current = q;
    setCargando(true);
    setErrorCarga(null);
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get("/api/checkins/manual/buscar", {
          headers: headers(),
          params: { page, per_page: perPage, ...(filtrando ? { q: busqueda } : {}) },
        });
        if (id !== peticionActual.current) return;
        setMiembros(data.miembros || []);
        setTotal(data.total || 0);
        setPaginas(data.pages || 1);
      } catch (e) {
        if (id === peticionActual.current) {
          setMiembros([]); setTotal(0);
          setErrorCarga(mensajeDeRespuesta(e, "No pudimos cargar los miembros."));
        }
      } finally {
        if (id === peticionActual.current) setCargando(false);
      }
    }, espera);
    return () => clearTimeout(t);
  }, [q, page, perPage, recarga]); // eslint-disable-line react-hooks/exhaustive-deps

  const registrar = async (m) => {
    setRegistrando(m.id);
    setAviso(null);
    try {
      const { data } = await axios.post("/api/checkins/manual", { id_miembro: m.id }, { headers: headers() });
      setAviso({ tipo: "ok", texto: `${data.message} (${data.hora})` });
      setQ(""); setPage(1);
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
        Elige al miembro de la lista o fíltralo por nombre, correo, teléfono o número de socio y registra su llegada.
      </p>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <FiSearch style={{ position: "absolute", left: 14, top: 16, color: "var(--text-secondary)" }} aria-hidden />
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} autoFocus
               placeholder="Filtrar por nombre, correo, teléfono o número de socio" aria-label="Buscar miembro"
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

      {/* Qué estamos mostrando: aclara si es la lista completa o una búsqueda */}
      {!errorCarga && !escribiendoPoco && (total > 0 || cargando) && (
        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 10px" }}>
          {filtrando ? `Resultados para “${busqueda}”` : "Miembros del gimnasio"}
          {total > 0 ? ` · ${total}` : ""}
          {cargando && total > 0 ? " · actualizando…" : ""}
        </p>
      )}

      {cargando && !miembros.length && !errorCarga && (
        <p role="status" style={{ color: "var(--text-secondary)" }}>
          {filtrando ? "Buscando…" : "Cargando miembros…"}
        </p>
      )}

      {escribiendoPoco && (
        <p style={{ color: "var(--text-secondary)" }}>Escribe una letra más para buscar, o borra el texto para ver a todos los miembros.</p>
      )}

      {errorCarga && (
        <div role="alert" style={{ padding: 12, borderRadius: 12, marginBottom: 12, background: "rgba(220,38,38,.1)",
                                   color: "var(--error-color, #dc2626)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span>{errorCarga}</span>
          <button type="button" className="btn-primary" onClick={() => setRecarga((n) => n + 1)} style={{ minHeight: 36 }}>Reintentar</button>
        </div>
      )}

      {!cargando && !errorCarga && !escribiendoPoco && total === 0 && (
        <p style={{ color: "var(--text-secondary)" }}>
          {filtrando
            ? `No encontramos a nadie con “${busqueda}”. Revisa la escritura o prueba con el número de socio.`
            : "Todavía no hay miembros activos en tu gimnasio. Da de alta al primero desde Miembros."}
        </p>
      )}

      <div style={{ display: "grid", gap: 10, opacity: cargando && miembros.length ? 0.6 : 1, transition: "opacity .15s" }}>
        {miembros.map((m) => {
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

      <PaginacionControles
        page={page} totalPages={paginas} total={total} perPage={perPage} opciones={OPCIONES}
        loading={cargando} etiqueta="por página"
        onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }}
      />
    </div>
  );
}
