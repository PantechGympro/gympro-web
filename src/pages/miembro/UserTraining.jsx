import { mensajeAmigable } from "../../utils/errores";
/**
 * UserTraining.jsx — Hub de entrenamiento del miembro.
 *
 * Tabs:
 *   1. Rutinas       — mis rutinas propias + las asignadas por el entrenador
 *   2. Entrenador    — solicitar entrenamiento personal + chat directo
 *   3. Alertas       — recordatorios y notificaciones de entrenamiento
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiFileText, FiUser, FiBell, FiPlus, FiSend,
  FiCheck, FiX, FiClock, FiAlertCircle, FiCheckCircle,
  FiMessageSquare, FiZap, FiToggleLeft, FiToggleRight,
  FiChevronDown, FiChevronUp, FiRefreshCw, FiStar,
  FiChevronLeft, FiChevronRight, FiImage, FiInfo, FiCalendar,
  FiCreditCard, FiDollarSign,
} from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../../css/CSSUnificado.css";
import { useWebPush } from "../../hooks/useWebPush";
import { listarNotificaciones, marcarLeida, marcarTodasLeidas } from "../../api/notificaciones";

/* ── Video helper (same as TrainerRoutines) ─────────────────── */
const videoCache = new Map();
function getVideoBlobUrl(b64, exerciseId) {
  if (!b64) return null;
  // MinIO (nov/2026): un ejercicio nuevo guarda una URL directa (http(s)://...)
  // en vez de un data-URL base64 -- se usa tal cual, sin blob ni cache.
  if (/^https?:\/\//.test(b64)) return b64;
  const cacheKey = (exerciseId ?? "u") + "_" + b64.slice(-24);
  if (videoCache.has(cacheKey)) return videoCache.get(cacheKey);
  try {
    const [header, data] = b64.split(",");
    const mime   = header.match(/:(.*?);/)?.[1] || "video/webm";
    const binary = atob(data);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    videoCache.set(cacheKey, url);
    return url;
  } catch { return null; }
}

/* ── ExerciseDetailModal (read-only) ────────────────────────── */
function ExerciseDetailModal({ exercise, seriesReps, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  const blobUrl = exercise?.video ? getVideoBlobUrl(exercise.video, exercise.id) : null;
  const imgs    = exercise?.imagenes || [];
  if (!exercise) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 10100,
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 18 }}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 18, width: "100%", maxWidth: 540,
          maxHeight: "92vh", overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{exercise.nombre}</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {exercise.grupo_muscular && (
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "var(--accent)22", color: "var(--accent)" }}>
                  {exercise.grupo_muscular}
                </span>
              )}
              {exercise.tipo && (
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                  {exercise.tipo}
                </span>
              )}
              {seriesReps && (
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "rgba(34,197,94,.15)", color: "#4ade80" }}>
                  {seriesReps}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "var(--text-secondary)", padding: 4, borderRadius: 6, flexShrink: 0 }}>
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Galería de imágenes */}
          {imgs.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                Cómo ejecutarlo
              </p>
              <div style={{
                width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden",
                background: "var(--bg-input)", border: "1px solid var(--border)",
                marginBottom: 8, position: "relative",
              }}>
                <img src={imgs[imgIdx]} alt={`paso ${imgIdx + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                      style={{ position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",
                        background:"rgba(0,0,0,.55)",border:"none",borderRadius:6,
                        color:"#fff",cursor:"pointer",padding:"6px 8px",lineHeight:0 }}>
                      <FiChevronLeft size={16} />
                    </button>
                    <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                      style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
                        background:"rgba(0,0,0,.55)",border:"none",borderRadius:6,
                        color:"#fff",cursor:"pointer",padding:"6px 8px",lineHeight:0 }}>
                      <FiChevronRight size={16} />
                    </button>
                    <div style={{ position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4 }}>
                      {imgs.map((_,i)=>(
                        <button key={i} onClick={()=>setImgIdx(i)}
                          style={{ width:i===imgIdx?18:6,height:6,borderRadius:3,
                            background:i===imgIdx?"#fff":"rgba(255,255,255,.4)",
                            border:"none",cursor:"pointer",padding:0,transition:"all .2s" }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {imgs.length > 1 && (
                <div style={{ display:"flex",gap:8 }}>
                  {imgs.map((src,i)=>(
                    <button key={i} onClick={()=>setImgIdx(i)}
                      style={{ padding:0,border:`2px solid ${i===imgIdx?"var(--accent)":"var(--border)"}`,
                        borderRadius:7,overflow:"hidden",cursor:"pointer",
                        width:64,height:48,flexShrink:0,transition:"border-color .15s" }}>
                      <img src={src} alt={`min ${i+1}`} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video */}
          {blobUrl && (
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:"var(--text-secondary)",
                textTransform:"uppercase",letterSpacing:".05em",marginBottom:10 }}>
                Video demostrativo
              </p>
              <video src={blobUrl} controls playsInline preload="metadata"
                style={{ width:"100%",borderRadius:10,border:"1px solid var(--border)",
                  background:"#000",maxHeight:280,display:"block" }} />
            </div>
          )}

          {/* Descripción */}
          {exercise.descripcion && (
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:"var(--text-secondary)",
                textTransform:"uppercase",letterSpacing:".05em",marginBottom:8 }}>
                Instrucciones
              </p>
              <p style={{ fontSize:13,color:"var(--text-primary)",lineHeight:1.65,
                background:"var(--bg-input)",padding:"12px 14px",borderRadius:8,
                border:"1px solid var(--border)" }}>
                {exercise.descripcion}
              </p>
            </div>
          )}

          {/* Sin media */}
          {imgs.length === 0 && !blobUrl && !exercise.descripcion && (
            <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text-secondary)" }}>
              <FiImage size={32} style={{ opacity:.3,marginBottom:8 }} />
              <p style={{ fontSize:13 }}>Este ejercicio no tiene imágenes ni video aún.</p>
              <p style={{ fontSize:12,marginTop:4 }}>Pídele a tu entrenador que los agregue.</p>
            </div>
          )}
        </div>

        <div style={{ padding:"14px 24px",borderTop:"1px solid var(--border)",flexShrink:0 }}>
          <button onClick={onClose}
            style={{ width:"100%",padding:"10px 0",background:"var(--bg-input)",
              border:"1px solid var(--border)",borderRadius:10,color:"var(--text-secondary)",
              cursor:"pointer",fontWeight:600,fontSize:14 }}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── API helper ─────────────────────────────────────────────── */
const API = async (method, path, body) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/user/training${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.msg || "Error");
  return data;
};

const ROUTINES_API = async (method, path, body) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/user${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.msg || "Error");
  return data;
};

/* ── Palette & helpers ──────────────────────────────────────── */
const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  ...extra,
});

const btn = (color = "var(--accent)", outline = false) => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 16px", borderRadius: 8, cursor: "pointer",
  fontSize: 13, fontWeight: 600,
  border: outline ? `1px solid ${color}` : "none",
  background: outline ? "transparent" : color,
  color: outline ? color : "#fff",
});

const fmtFecha = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso.slice(0, 10); }
};

/* ══════════════════════════════════════════════════════════════
   TAB 1 — RUTINAS
══════════════════════════════════════════════════════════════ */
function TabRutinas() {
  const navigate = useNavigate();
  const [propias,    setPropias]    = useState([]);
  const [asignadas,  setAsignadas]  = useState([]);
  const [loadP,      setLoadP]      = useState(true);
  const [loadA,      setLoadA]      = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [vista,      setVista]      = useState("propias"); // propias | asignadas
  const [catalog,    setCatalog]    = useState({});         // nombre.lower -> ejercicio
  const [selectedEj, setSelectedEj] = useState(null);      // { ejercicio, seriesReps }

  const cargarPropias = useCallback(async () => {
    setLoadP(true);
    try {
      const d = await ROUTINES_API("GET", "/routines");
      setPropias(d.rutinas || []);
    } catch { /* silente */ }
    finally { setLoadP(false); }
  }, []);

  const cargarAsignadas = useCallback(async () => {
    setLoadA(true);
    try {
      const d = await API("GET", "/assigned-routines");
      setAsignadas(d.rutinas || []);
    } catch { /* silente */ }
    finally { setLoadA(false); }
  }, []);

  // Cargar catálogo de ejercicios del gimnasio (una sola vez)
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/catalogos/ejercicios", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        const map = {};
        (Array.isArray(list) ? list : []).forEach(e => {
          map[(e.nombre || "").trim().toLowerCase()] = e;
        });
        setCatalog(map);
      })
      .catch(() => {});
  }, []);

  const openEjercicioModal = (ej) => {
    const catalogEntry = catalog[(ej.nombre || "").trim().toLowerCase()] || null;
    const merged = catalogEntry
      ? { ...catalogEntry, nombre: ej.nombre }
      : { nombre: ej.nombre, imagenes: [], video: null, descripcion: null };
    const seriesReps = ej.series && ej.reps
      ? `${ej.series} series × ${ej.reps} reps${ej.peso ? ` · ${ej.peso}` : ""}`
      : null;
    setSelectedEj({ ejercicio: merged, seriesReps });
  };

  useEffect(() => { cargarPropias(); cargarAsignadas(); }, [cargarPropias, cargarAsignadas]);

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const RutinaCard = ({ rutina, asignada }) => {
    const open = expanded === rutina.id;
    return (
      <div style={{ ...card({ marginBottom: 10, overflow: "hidden" }) }}>
        <div
          onClick={() => toggle(rutina.id)}
          style={{
            padding: "14px 18px", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: asignada ? "rgba(16,185,129,.15)" : "var(--accent-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <GiMuscleUp size={18} color={asignada ? "var(--success)" : "var(--accent)"} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                {rutina.nombre || rutina.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                {asignada
                  ? <>Asignada por <strong style={{ color: "var(--success)" }}>{rutina.nombre_entrenador}</strong> · {fmtFecha(rutina.fecha_asignacion)}</>
                  : <>{rutina.categoria || rutina.category} · {rutina.dificultad || rutina.difficulty}</>
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 99,
              background: asignada ? "rgba(16,185,129,.15)" : "var(--accent-dim)",
              color: asignada ? "var(--success)" : "var(--accent-soft)",
              fontWeight: 700,
            }}>
              {asignada ? "Entrenador" : "Propia"}
            </span>
            {open ? <FiChevronUp size={16} color="var(--text-secondary)" /> : <FiChevronDown size={16} color="var(--text-secondary)" />}
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border, rgba(255,255,255,.06))" }}>
                {rutina.notas_entrenador && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 8,
                    background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.2)",
                    fontSize: 13, color: "var(--success)",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <FiMessageSquare /> {rutina.notas_entrenador}
                  </div>
                )}
                {rutina.descripcion && (
                  <p style={{ margin: "12px 0 8px", fontSize: 13, color: "var(--text-secondary)" }}>
                    {rutina.descripcion}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {["duracion_minutos", "dificultad", "categoria"].map(k =>
                    rutina[k] ? (
                      <span key={k} style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 99,
                        background: "rgba(255,255,255,.06)", color: "var(--text-secondary)",
                      }}>
                        {k === "duracion_minutos" ? `${rutina[k]} min` : rutina[k]}
                      </span>
                    ) : null
                  )}
                </div>

                {(rutina.dias || []).length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    {(rutina.dias).map((dia, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-soft)", marginBottom: 6,
                          textTransform: "uppercase", letterSpacing: ".06em" }}>
                          {dia.dia} — {dia.grupo}
                        </div>
                        {(dia.ejercicios || []).map((ej, j) => (
                          <div
                            key={j}
                            onClick={() => openEjercicioModal(ej)}
                            style={{
                              display: "flex", gap: 10, padding: "9px 12px",
                              background: "var(--bg-input)", borderRadius: 8, marginBottom: 4,
                              fontSize: 12, color: "var(--text-primary)", cursor: "pointer",
                              alignItems: "center",
                              transition: "background .15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
                            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-input)"}
                          >
                            <span style={{ flex: 1, fontWeight: 500 }}>{ej.nombre}</span>
                            <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                              {ej.series}×{ej.reps}
                            </span>
                            {ej.peso && (
                              <span style={{ color: "var(--warning)", fontSize: 11, fontWeight: 600 }}>
                                {ej.peso}
                              </span>
                            )}
                            <FiInfo size={12} color="var(--accent)" style={{ flexShrink: 0, opacity: .7 }} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const loading = vista === "propias" ? loadP : loadA;
  const lista   = vista === "propias" ? propias : asignadas;

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Selector de vista */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "propias",   label: "Mis Rutinas",      count: propias.length   },
          { key: "asignadas", label: "Del Entrenador",   count: asignadas.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setVista(key)}
            style={{
              padding: "7px 16px", borderRadius: 8,
              border: vista === key ? "none" : "1px solid var(--border, rgba(255,255,255,.1))",
              background: vista === key ? "var(--accent)" : "transparent",
              color: vista === key ? "#fff" : "var(--text-secondary)",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {label}
            {count > 0 && (
              <span style={{
                background: vista === key ? "var(--accent)" : "var(--bg-input)",
                borderRadius: 99, padding: "1px 7px", fontSize: 10,
              }}>
                {count}
              </span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate("/user/routine")}
          style={{ ...btn("var(--accent)", false), padding: "7px 14px" }}
        >
          <FiPlus size={13} /> Crear rutina
        </button>
        <button
          onClick={() => vista === "propias" ? cargarPropias() : cargarAsignadas()}
          style={{ ...btn("#374151", true), padding: "7px 12px" }}
        >
          <FiRefreshCw size={13} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 0",
          color: "var(--text-secondary)", borderRadius: 12,
          border: "1px dashed var(--border, rgba(255,255,255,.1))",
        }}>
          <GiMuscleUp size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>
            {vista === "propias"
              ? "No tienes rutinas creadas todavía"
              : "Tu entrenador aún no te ha asignado rutinas"
            }
          </p>
        </div>
      ) : (
        lista.map(r => <RutinaCard key={r.id} rutina={r} asignada={vista === "asignadas"} />)
      )}

      {/* Modal detalle ejercicio */}
      <AnimatePresence>
        {selectedEj && (
          <ExerciseDetailModal
            exercise={selectedEj.ejercicio}
            seriesReps={selectedEj.seriesReps}
            onClose={() => setSelectedEj(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 2 — ENTRENADOR PERSONAL
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   RATING WIDGET — calificar entrenador (solicitud aceptada)
══════════════════════════════════════════════════════════════ */
function RatingWidget({ trainerId, trainerName }) {
  const [rating,     setRating]     = useState(0);       // valor guardado
  const [hover,      setHover]      = useState(0);       // estrella bajo el cursor
  const [comentario, setComentario] = useState("");
  const [guardado,   setGuardado]   = useState(false);   // ¿ya tiene calificación?
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState(null);    // {type, text}
  const [open,       setOpen]       = useState(false);   // panel expandido

  // Cargar calificación existente
  useEffect(() => {
    API("GET", "/trainer-rating")
      .then(d => {
        if (d.rating != null) {
          setRating(d.rating);
          setComentario(d.comentario || "");
          setGuardado(true);
          setOpen(false);
        } else {
          setOpen(true); // Si no ha calificado, expandir por defecto
        }
      })
      .catch(() => setOpen(true))
      .finally(() => setLoading(false));
  }, []);

  const guardar = async () => {
    if (!rating) { setMsg({ type: "err", text: "Selecciona una calificación" }); return; }
    setSaving(true); setMsg(null);
    try {
      await API("POST", "/trainer-rating", { calificacion: rating, comentario });
      setGuardado(true);
      setOpen(false);
      setMsg({ type: "ok", text: "¡Calificación guardada!" });
    } catch (e) {
      setMsg({ type: "err", text: mensajeAmigable(e) });
    } finally { setSaving(false); }
  };

  if (loading) return null;

  const estrellaColor = (i) => {
    const active = (hover || rating) >= i;
    return active ? "var(--warning)" : "var(--border)";
  };

  return (
    <div style={{
      marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)",
    }}>
      {/* Header colapsable */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: 0, color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <FiStar size={14} style={{ color: "var(--warning)" }} />
          {guardado ? `Tu calificación: ${rating}/5` : `Calificar a ${trainerName}`}
          {guardado && (
            <span style={{ marginLeft: 4, display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(i => (
                <FiStar key={i} size={12} style={{ color: i <= rating ? "var(--warning)" : "var(--border)", fill: i <= rating ? "var(--warning)" : "none" }} />
              ))}
            </span>
          )}
        </div>
        {open ? <FiChevronUp size={14} color="var(--text-secondary)" />
               : <FiChevronDown size={14} color="var(--text-secondary)" />}
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {msg && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 10,
              background: msg.type === "ok" ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)",
              border: `1px solid ${msg.type === "ok" ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}`,
              color: msg.type === "ok" ? "var(--success)" : "var(--danger)",
              fontSize: 12, display: "flex", gap: 6, alignItems: "center",
            }}>
              {msg.type === "ok" ? <FiCheckCircle size={13} /> : <FiAlertCircle size={13} />}
              {msg.text}
            </div>
          )}

          {/* Estrellas */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[1,2,3,4,5].map(i => (
              <button
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, lineHeight: 1,
                }}
              >
                <FiStar
                  size={26}
                  style={{
                    color: estrellaColor(i),
                    fill: estrellaColor(i),
                    transition: "color 0.1s, fill 0.1s",
                  }}
                />
              </button>
            ))}
            {(hover || rating) > 0 && (
              <span style={{ fontSize: 12, color: "var(--text-secondary)", alignSelf: "center", marginLeft: 4 }}>
                {["", "Muy malo", "Regular", "Bueno", "Muy bueno", "Excelente"][hover || rating]}
              </span>
            )}
          </div>

          {/* Comentario */}
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Comentario opcional (máx. 500 caracteres)..."
            maxLength={500}
            rows={3}
            style={{
              width: "100%", resize: "vertical", fontFamily: "inherit",
              background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "8px 12px", fontSize: 12,
              color: "var(--text-primary)", outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            {guardado && (
              <button
                onClick={() => { setOpen(false); setMsg(null); }}
                style={{ ...btn("var(--text-secondary)", true), padding: "6px 14px", fontSize: 12 }}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={guardar}
              disabled={saving || !rating}
              style={{
                ...btn(saving || !rating ? "#374151" : "var(--warning)"),
                padding: "6px 16px", fontSize: 12,
                opacity: saving || !rating ? 0.6 : 1,
                cursor: saving || !rating ? "not-allowed" : "pointer",
              }}
            >
              <FiStar size={12} />
              {saving ? "Guardando…" : guardado ? "Actualizar calificación" : "Guardar calificación"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TabEntrenador() {
  const [trainers,    setTrainers]    = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [chatOpen,    setChatOpen]    = useState(null); // id_entrenador_pg del chat abierto
  const [vista,       setVista]       = useState("solicitudes"); // solicitudes | nuevo

  // Solicitud nueva
  const [selTrainer,  setSelTrainer]  = useState(null);
  const [notas,       setNotas]       = useState("");
  const [tipoSesion,  setTipoSesion]  = useState("individual");
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null); // {type, text}

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.allSettled([
        API("GET", "/trainers"),
        API("GET", "/pt-request"),
      ]);
      if (t.status === "fulfilled") setTrainers(t.value.trainers || []);
      if (s.status === "fulfilled") setSolicitudes(s.value.solicitudes || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const solicitudActiva = solicitudes.find(s => ["pendiente", "aceptada"].includes(s.estado));

  const enviarSolicitud = async () => {
    if (!selTrainer) { setMsg({ type: "err", text: "Selecciona un entrenador" }); return; }
    setSaving(true); setMsg(null);
    try {
      await API("POST", "/pt-request", {
        id_entrenador_pg: selTrainer.id,
        notas,
        tipo_sesion: tipoSesion,
      });
      setMsg({ type: "ok", text: "¡Solicitud enviada! El entrenador la revisará pronto." });
      setNotas(""); setSelTrainer(null);
      setVista("solicitudes");
      cargar();
    } catch (e) {
      setMsg({ type: "err", text: mensajeAmigable(e) });
    } finally { setSaving(false); }
  };

  const cancelar = async (id) => {
    if (!window.confirm("¿Cancelar esta solicitud?")) return;
    try {
      await API("DELETE", `/pt-request/${id}`);
      cargar();
    } catch (e) {
      alert(mensajeAmigable(e));
    }
  };

  const terminarActivo = async () => {
    if (!window.confirm("¿Terminar el entrenamiento con este entrenador? Después podrás solicitar a otro; tu nuevo entrenador podrá ver lo que ya trabajaste.")) return;
    try {
      await API("DELETE", "/pt-activo");
      cargar();
    } catch (e) {
      alert(mensajeAmigable(e));
    }
  };

  const ESTADO_COLOR = {
    pendiente: "var(--warning)", aceptada: "var(--success)", rechazada: "var(--danger)",
  };
  const ESTADO_LABEL = {
    pendiente: "Pendiente", aceptada: "Aceptada ✓", rechazada: "Rechazada",
  };

  if (chatOpen !== null) {
    return <ChatView trainerId={chatOpen} onBack={() => setChatOpen(null)} trainers={trainers} />;
  }

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Tabs internos */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "solicitudes", label: "Mis Solicitudes" },
          { key: "nuevo",       label: "Solicitar Entrenador" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setVista(key); setMsg(null); }}
            style={{
              padding: "7px 16px", borderRadius: 8, cursor: "pointer",
              border: vista === key ? "none" : "1px solid var(--border, rgba(255,255,255,.1))",
              background: vista === key ? "var(--accent)" : "transparent",
              color: vista === key ? "#fff" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SOLICITUDES ── */}
      {vista === "solicitudes" && (
        loading ? (
          <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        ) : solicitudes.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 0",
            border: "1px dashed var(--border, rgba(255,255,255,.1))", borderRadius: 12,
            color: "var(--text-secondary)",
          }}>
            <FiUser size={38} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p>Aún no tienes solicitudes de entrenamiento personal</p>
            <button onClick={() => setVista("nuevo")} style={{ ...btn(), marginTop: 12 }}>
              <FiPlus size={14} /> Solicitar entrenador
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {solicitudes.map(s => (
              <div key={s.id} style={{ ...card({ padding: "16px 20px" }) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                      {s.nombre_entrenador}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      Solicitado el {fmtFecha(s.fecha_solicitud)} · {s.tipo_sesion}
                    </div>
                    {s.notas_miembro && (
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontStyle: "italic" }}>
                        "{s.notas_miembro}"
                      </div>
                    )}
                    {s.notas_entrenador && (
                      <div style={{
                        marginTop: 8, padding: "7px 12px", borderRadius: 8,
                        background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
                        fontSize: 12, color: "var(--success)",
                      }}>
                        Respuesta: {s.notas_entrenador}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, flexShrink: 0,
                    background: `${ESTADO_COLOR[s.estado]}18`,
                    color: ESTADO_COLOR[s.estado],
                  }}>
                    {ESTADO_LABEL[s.estado]}
                  </span>
                </div>

                {/* Barra de acciones (clara y bien ubicada) */}
                {s.estado === "aceptada" && (
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button
                      onClick={() => setChatOpen(s.id_entrenador_pg)}
                      style={{ ...btn("var(--accent)", false), flex: 1, justifyContent: "center", padding: "10px 0", fontSize: 13, fontWeight: 700 }}
                    >
                      <FiMessageSquare size={14} /> Chatear con tu entrenador
                    </button>
                    <button
                      onClick={terminarActivo}
                      title="Terminar entrenamiento personal"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 9,
                        background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)",
                        cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                    >
                      <FiX size={14} /> Terminar
                    </button>
                  </div>
                )}
                {s.estado === "pendiente" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <button
                      onClick={() => cancelar(s.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                        background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)",
                        cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                    >
                      <FiX size={13} /> Cancelar solicitud
                    </button>
                  </div>
                )}

                {/* Calificación — solo para solicitudes aceptadas */}
                {s.estado === "aceptada" && (
                  <RatingWidget
                    trainerId={s.id_entrenador_pg}
                    trainerName={s.nombre_entrenador}
                  />
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── NUEVA SOLICITUD ── */}
      {vista === "nuevo" && (
        <div>
          {solicitudActiva && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 16,
              background: "rgba(234,179,8,.08)", border: "1px solid rgba(234,179,8,.3)",
              display: "flex", gap: 10, alignItems: "center",
              fontSize: 13, color: "var(--warning)",
            }}>
              <FiAlertCircle size={15} />
              Ya tienes una solicitud activa con {solicitudActiva.nombre_entrenador}. Cancélala antes de enviar una nueva.
            </div>
          )}

          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 14,
              background: msg.type === "ok" ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)",
              border: `1px solid ${msg.type === "ok" ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}`,
              color: msg.type === "ok" ? "var(--success)" : "var(--danger)",
              display: "flex", gap: 8, alignItems: "center", fontSize: 13,
            }}>
              {msg.type === "ok" ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
              {msg.text}
            </div>
          )}

          {/* Selección de entrenador */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
              Elige un entrenador
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {loading
                ? [1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)
                : trainers.length === 0
                  ? <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No hay entrenadores disponibles</p>
                  : trainers.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelTrainer(t)}
                      style={{
                        ...card({
                          padding: "14px",
                          cursor: "pointer",
                          outline: selTrainer?.id === t.id ? "2px solid var(--accent)" : "none",
                          background: selTrainer?.id === t.id ? "var(--accent-dim)" : "var(--bg-card)",
                          transition: "all .15s",
                        }),
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%",
                          background: "var(--accent-dim)", display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <FiUser size={16} color="var(--accent-soft)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{t.nombre}</div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t.especialidad}</div>
                        </div>
                      </div>

                      {/* Calificación del entrenador */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                        {t.rating != null ? (
                          <>
                            <span style={{ display: "inline-flex", gap: 1 }}>
                              {[1, 2, 3, 4, 5].map(i => (
                                <FiStar key={i} size={12} style={{ color: i <= Math.round(t.rating) ? "var(--warning)" : "var(--border)", fill: i <= Math.round(t.rating) ? "var(--warning)" : "none" }} />
                              ))}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warning)" }}>{t.rating}</span>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>({t.num_ratings})</span>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Sin calificaciones aún</span>
                        )}
                      </div>

                      {/* Rutinas del entrenador */}
                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {(t.rutinas && t.rutinas.length > 0)
                          ? <>Rutinas: {t.rutinas.map(r => r.nombre).slice(0, 3).join(" · ")}{t.total_rutinas > 3 ? ` +${t.total_rutinas - 3}` : ""}</>
                          : <>{t.total_rutinas || 0} rutina{t.total_rutinas === 1 ? "" : "s"} creada{t.total_rutinas === 1 ? "" : "s"}</>}
                      </div>

                      {selTrainer?.id === t.id && (
                        <div style={{ marginTop: 8, textAlign: "right" }}>
                          <FiCheckCircle size={14} color="var(--accent)" />
                        </div>
                      )}
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Tipo de sesión */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
              Tipo de sesión
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["individual", "grupal", "virtual"].map(t => (
                <button
                  key={t}
                  onClick={() => setTipoSesion(t)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                    border: tipoSesion === t ? "none" : "1px solid var(--border, rgba(255,255,255,.1))",
                    background: tipoSesion === t ? "var(--accent)" : "transparent",
                    color: tipoSesion === t ? "#fff" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
              Tu objetivo / notas para el entrenador
            </div>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Quiero ganar masa muscular, tengo problemas de rodilla..."
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 12px", borderRadius: 8,
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 13,
                resize: "none", outline: "none",
              }}
            />
          </div>

          <button
            onClick={enviarSolicitud}
            disabled={saving || !selTrainer || !!solicitudActiva}
            style={{
              ...btn(saving || !selTrainer || !!solicitudActiva ? "#374151" : "var(--accent)"),
              width: "100%", justifyContent: "center", padding: "11px 0",
              opacity: saving || !selTrainer || !!solicitudActiva ? 0.6 : 1,
              cursor: saving || !selTrainer || !!solicitudActiva ? "not-allowed" : "pointer",
            }}
          >
            <FiZap size={14} />
            {saving ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Chat View ────────────────────────────────────────────────── */
function ChatView({ trainerId, onBack, trainers }) {
  const [mensajes,  setMensajes]  = useState([]);
  const [texto,     setTexto]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef(null);

  const trainer = trainers.find(t => t.id === trainerId);

  const cargar = useCallback(async () => {
    try {
      const d = await API("GET", `/chat/${trainerId}`);
      setMensajes(d.mensajes || []);
    } catch { /* silente */ }
    finally { setLoading(false); }
  }, [trainerId]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5000); // polling ligero
    return () => clearInterval(interval);
  }, [cargar]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await API("POST", `/chat/${trainerId}`, { texto: t });
      setTexto("");
      cargar();
    } catch { /* silente */ }
    finally { setSending(false); }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  const fmtHora = (iso) => {
    try { return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", padding: "0 24px 16px" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 0",
        borderBottom: "1px solid var(--border)", marginBottom: 12,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}>
          ← Volver
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(16,185,129,.15)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FiUser size={16} color="var(--success)" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            {trainer?.nombre || "Entrenador"}
          </div>
          <div style={{ fontSize: 11, color: "var(--success)" }}>Entrenador Personal</div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontSize: 13 }}>
            Cargando mensajes...
          </div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
            <FiMessageSquare size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>Inicia la conversación con tu entrenador</p>
          </div>
        ) : (
          mensajes.map(m => {
            const esMio = m.remitente === "miembro";
            return (
              <div key={m.id} style={{
                display: "flex",
                justifyContent: esMio ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "72%", padding: "9px 14px", borderRadius: esMio ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  background: esMio ? "var(--accent)" : "var(--bg-card)",
                  border: esMio ? "none" : "1px solid var(--border)",
                  fontSize: 13, color: esMio ? "#fff" : "var(--text-primary)",
                  lineHeight: 1.5,
                }}>
                  <div>{m.texto}</div>
                  <div style={{ fontSize: 10, marginTop: 4, opacity: 0.65, textAlign: "right" }}>
                    {fmtHora(m.fecha)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 8, paddingTop: 10,
        borderTop: "1px solid var(--border)",
      }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={onKey}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          rows={1}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 10,
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)", fontSize: 13,
            resize: "none", outline: "none",
          }}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim() || sending}
          style={{
            ...btn(texto.trim() && !sending ? "var(--accent)" : "#374151"),
            padding: "0 16px",
            opacity: texto.trim() && !sending ? 1 : 0.5,
          }}
        >
          <FiSend size={15} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 3 — ALERTAS DE ENTRENAMIENTO
══════════════════════════════════════════════════════════════ */
function TabAlertas() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas,       setNoLeidas]       = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(false);
  const [marcandoTodas,  setMarcandoTodas]  = useState(false);

  const { soportado: pushSoportado, permiso: pushPermiso, activando: pushActivando,
          error: pushError, solicitar: activarPush, desactivar: desactivarPush } = useWebPush();

  const cargar = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const d = await listarNotificaciones();
      setNotificaciones(d.notificaciones || []);
      setNoLeidas(d.no_leidas || 0);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const marcarUna = async (n) => {
    if (n.leida) return;
    setNotificaciones(prev => prev.map(x => x._id === n._id ? { ...x, leida: true } : x));
    setNoLeidas(c => Math.max(0, c - 1));
    try { await marcarLeida(n._id); } catch { /* optimismo de UI ya la marcó */ }
  };

  const marcarTodas = async () => {
    if (!noLeidas) return;
    setMarcandoTodas(true);
    setNotificaciones(prev => prev.map(x => ({ ...x, leida: true })));
    setNoLeidas(0);
    try { await marcarTodasLeidas(); } catch { /* optimismo de UI ya las marcó */ }
    finally { setMarcandoTodas(false); }
  };

  const togglePush = async () => {
    if (pushPermiso === "granted") await desactivarPush();
    else await activarPush();
  };

  const fmtFechaHora = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("es-MX", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  const iconoTipo = (tipo = "") => {
    if (tipo.startsWith("cita"))      return <FiCalendar size={15} />;
    if (tipo.includes("membresia"))   return <FiCreditCard size={15} />;
    if (tipo.includes("pago"))        return <FiDollarSign size={15} />;
    if (tipo.includes("mensaje"))     return <FiMessageSquare size={15} />;
    if (tipo.includes("rutina") || tipo.includes("sesion")) return <GiMuscleUp size={15} />;
    return <FiBell size={15} />;
  };

  return (
    <div style={{ padding: "20px 24px", maxWidth: 680 }}>
      {/* Estado de las notificaciones push: móvil (Expo, automático si tiene
          la app instalada) y web (requiere permiso explícito del navegador) */}
      <div style={{ ...card({ padding: "16px 18px" }), marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
          Notificaciones push
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiCheckCircle size={15} style={{ color: "var(--success)" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>App móvil</div>
              <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>Automática si tienes la app de GymPro instalada e iniciaste sesión ahí.</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {pushPermiso === "granted"
              ? <FiCheckCircle size={15} style={{ color: "var(--success)" }} />
              : <FiAlertCircle size={15} style={{ color: "var(--warning)" }} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Este navegador</div>
              <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                {!pushSoportado
                  ? "Este navegador no soporta notificaciones push."
                  : pushPermiso === "granted"
                    ? "Activadas en este navegador."
                    : pushPermiso === "denied"
                      ? "Bloqueadas — actívalas desde los ajustes del navegador."
                      : "Aún no activadas en este navegador."}
              </div>
              {pushError && <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 2 }}>{pushError}</div>}
            </div>
          </div>
          {pushSoportado && pushPermiso !== "denied" && (
            <button
              onClick={togglePush}
              disabled={pushActivando}
              style={{ background: "none", border: "none", cursor: pushActivando ? "default" : "pointer", color: pushPermiso === "granted" ? "var(--accent)" : "var(--text-secondary)", padding: 4, flexShrink: 0 }}
              aria-label={pushPermiso === "granted" ? "Desactivar" : "Activar"}
            >
              {pushPermiso === "granted" ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Historial real de avisos (in-app + lo que ya se mandó por push) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo leído"}
        </div>
        {noLeidas > 0 && (
          <button onClick={marcarTodas} disabled={marcandoTodas} style={{ ...btn("var(--accent)", true), fontSize: 11.5, padding: "5px 12px" }}>
            <FiCheck size={12} /> Marcar todo como leído
          </button>
        )}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
      ) : error ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
          No se pudo cargar tu historial. <button onClick={cargar} style={{ ...btn(), marginLeft: 8 }}>Reintentar</button>
        </div>
      ) : notificaciones.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 0",
          border: "1px dashed var(--border, rgba(255,255,255,.1))", borderRadius: 12,
          color: "var(--text-secondary)",
        }}>
          <FiBell size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
          <p style={{ fontSize: 13 }}>Todavía no tienes avisos. Aquí aparecerá el historial de tus notificaciones.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notificaciones.map((n) => (
            <div
              key={n._id}
              onClick={() => marcarUna(n)}
              style={{
                ...card({ padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12, cursor: n.leida ? "default" : "pointer" }),
                borderLeft: `3px solid ${n.leida ? "transparent" : "var(--accent)"}`,
                opacity: n.leida ? 0.72 : 1,
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: "var(--bg-input)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)",
              }}>
                {iconoTipo(n.tipo)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)" }}>{n.titulo}</span>
                  {!n.leida && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{n.mensaje}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                  <FiClock size={10} color="var(--text-secondary)" />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmtFechaHora(n.creado_en)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 4 — MIS CITAS
   Citas que recepción agendó para este miembro (SCRUM-97: antes no había
   forma de verlas fuera del módulo de recepción).
══════════════════════════════════════════════════════════════ */
function TabCitas() {
  const [citas,   setCitas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const d = await ROUTINES_API("GET", "/citas");
      setCitas(d.citas || []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const ESTADO_LABEL = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada", completada: "Completada" };
  const ESTADO_COLOR = { pendiente: "#f59e0b", confirmada: "#22c55e", cancelada: "#ef4444", completada: "var(--text-secondary)" };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Cargando…</div>;
  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
      No se pudieron cargar tus citas. <button onClick={cargar} style={{ ...btn(), marginLeft: 8 }}>Reintentar</button>
    </div>
  );
  if (citas.length === 0) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
      <FiCalendar size={28} style={{ marginBottom: 10, opacity: .6 }} />
      <p>No tienes citas agendadas todavía. Aquí verás las que te agenden recepción o tu entrenador.</p>
    </div>
  );

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
      {citas.map((c) => (
        <div key={c._id} style={card({ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 })}>
          <div style={{
            width: 46, height: 46, borderRadius: 10, background: "var(--bg-input)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <FiCalendar size={16} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{c.type}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: `${ESTADO_COLOR[c.status] || "var(--text-secondary)"}20`,
                color: ESTADO_COLOR[c.status] || "var(--text-secondary)",
              }}>
                {ESTADO_LABEL[c.status] || c.status}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>
              {fmtFecha(c.date)} · {c.time} {c.trainer ? `· con ${c.trainer}` : ""}
            </p>
            {c.notes && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>{c.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function UserTraining() {
  const [tab, setTab] = useState("rutinas");

  const TABS = [
    { key: "rutinas",    label: "Rutinas",         icon: <GiMuscleUp size={14} /> },
    { key: "entrenador", label: "Entrenador",       icon: <FiUser size={13} />    },
    { key: "citas",      label: "Mis Citas",        icon: <FiCalendar size={13} />},
    { key: "alertas",    label: "Alertas",          icon: <FiBell size={13} />    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-input)", overflow: "hidden" }}>
      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 24px", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <GiMuscleUp size={20} color="var(--accent)" />
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Entrenamiento</h1>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)" }}>
              {tab === "rutinas"    && "Tus rutinas propias y las asignadas por tu entrenador"}
              {tab === "entrenador" && "Entrenamiento personal y chat con tu entrenador"}
              {tab === "citas"     && "Citas que recepción agendó para ti"}
              {tab === "alertas"   && "Tus notificaciones: citas, mensajes, pagos y recordatorios"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", borderRadius: 10, padding: 4 }}>
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: tab === key ? "var(--accent)" : "transparent",
                color: tab === key ? "#fff" : "var(--text-secondary)",
                transition: "all .15s",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "rutinas"    && <TabRutinas />}
            {tab === "entrenador" && <TabEntrenador />}
            {tab === "citas"      && <TabCitas />}
            {tab === "alertas"   && <TabAlertas />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
