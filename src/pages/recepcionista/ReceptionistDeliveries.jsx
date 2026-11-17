/**
 * ReceptionistDeliveries.jsx
 *
 * HU-39: panel de compras pendientes de entrega (productos comprados en la
 * app que el miembro recogerá en una hora acordada). Visible a todo el
 * personal -- no solo recepción -- porque cualquiera puede entregar el
 * producto, incluso si quien atendió la venta no está.
 *
 * nov/2026: todo pago que el miembro declara a mano (efectivo o transferencia) deja la venta con estado_pago="pendiente" -- nadie ha verificado
 * el dinero. El botón "Entregar" se convierte en "Verificar pago y entregar":
 * quien entrega confirma que cobró/verificó y se cierran pago Y entrega en la
 * misma acción (PATCH /api/ventas/<id>/entregar con confirmar_pago=true). El
 * API lo exige y solo lo permite a Recepción, Administración y Propietario.
 * También se puede confirmar antes desde "Pagos por confirmar".
 *
 * Datos reales contra /api/ventas/pendientes-entrega y
 * PATCH /api/ventas/<id>/entregar (ventas_bp, backend).
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  FiPackage, FiRefreshCw, FiAlertCircle, FiClock,
  FiCheckCircle, FiAlertTriangle, FiCreditCard, FiX,
} from "react-icons/fi";
import { getPendientesEntrega, marcarEntregada } from "../../api/recepcionista";
import "../../css/CSSUnificado.css";

const fmtFecha = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric", month: "short",
    });
  } catch {
    return iso;
  }
};

const resumenItems = (items = []) =>
  items.map((it) => `${it.qty ?? it.cantidad ?? 1}× ${it.nombre}`).join(", ");

// Nombre y referencia los escribe el miembro: se escapan antes de ir a un diálogo HTML.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Qué debe comprobar quien entrega, según el método que declaró el miembro.
const instruccionPago = (v) => {
  const monto = `$${Number(v.total || 0).toFixed(2)}`;
  if (v.metodo_pago === "Transferencia") {
    return `Confirma que la transferencia de ${monto}${v.referencia ? ` (ref. ${esc(v.referencia)})` : ""} ya aparece en el banco.`;
  }
  return `Confirma que ya cobraste ${monto} en efectivo.`;
};

export default function ReceptionistDeliveries() {
  const [pendientes, setPendientes] = useState([]);
  const [loading,     setLoading]   = useState(true);
  const [error,       setError]     = useState(null);
  const [entregandoId, setEntregandoId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getPendientesEntrega();
      setPendientes(data.pendientes || []);
    } catch {
      setError("No se pudieron cargar las compras pendientes de entrega.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const entregar = async (venta) => {
    const pagoPendiente = venta.estado_pago === "pendiente";
    const { isConfirmed } = await Swal.fire({
      title: pagoPendiente ? "¿Verificar pago y marcar como entregada?" : "¿Marcar como entregada?",
      html: `<div style="text-align:left;font-size:13px;">
               <b>${esc(venta.nombre_miembro || "Miembro")}</b><br/>
               ${esc(resumenItems(venta.items))}<br/>
               <span style="color:var(--text-secondary)">$${Number(venta.total || 0).toFixed(2)} · ${esc(venta.metodo_pago || "")}</span>
               ${pagoPendiente ? `<br/><b style="color:#f59e0b">${instruccionPago(venta)}</b>` : ""}
             </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: pagoPendiente ? "Sí, pago verificado, entregar" : "Sí, entregar",
      confirmButtonColor: "var(--accent)",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
    });
    if (!isConfirmed) return;

    setEntregandoId(venta.id);
    try {
      await marcarEntregada(venta.id, pagoPendiente);
      setPendientes((prev) => prev.filter((p) => p.id !== venta.id));
      Swal.fire({
        title: "Entregado",
        text: "El miembro recibió una confirmación.",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
        background: "var(--bg-card)",
        color: "var(--text-primary)",
      });
    } catch (e) {
      setError(e?.response?.data?.error || "No se pudo registrar la entrega.");
      if (e?.response?.status === 409) cargar();   // otra persona ya la resolvió: refrescar
    } finally {
      setEntregandoId(null);
    }
  };

  const vencidas = pendientes.filter((p) => p.vencida).length;

  return (
    <div className="dashboard-content">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20, display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0,
            display: "flex", alignItems: "center" }}>
            Entregas pendientes
            {pendientes.length > 0 && (
              <span style={{ marginLeft: 10, background: "var(--accent)", color: "#fff",
                borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>
                {pendientes.length}
              </span>
            )}
            {vencidas > 0 && (
              <span style={{ marginLeft: 6, background: "rgba(239,68,68,0.15)", color: "#ef4444",
                borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "2px 8px",
                display: "flex", alignItems: "center", gap: 4 }}>
                <FiAlertTriangle size={11} /> {vencidas} vencida{vencidas > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Productos comprados desde la app, pendientes de recoger (y de verificar el pago si fue efectivo o transferencia)
          </p>
        </div>
        <motion.button onClick={cargar} disabled={loading}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            background: "transparent", border: "1px solid var(--border-dark)",
            color: "var(--text-secondary)", borderRadius: "var(--r-md)",
            cursor: "pointer", fontSize: 13 }}>
          <FiRefreshCw size={14} />
        </motion.button>
      </motion.div>

      {error && (
        <div style={{ marginBottom: 14, padding: "10px 14px",
          background: "rgba(239,68,68,0.1)", borderRadius: 8,
          color: "#ef4444", fontSize: 13, display: "flex",
          justifyContent: "space-between", alignItems: "center" }}>
          <span><FiAlertCircle size={13} style={{ marginRight: 6 }} />{error}</span>
          <button onClick={() => setError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <FiX size={12} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
          Cargando compras pendientes...
        </div>
      ) : pendientes.length === 0 ? (
        <div style={{ padding: 52, textAlign: "center", color: "var(--text-secondary)" }}>
          <FiPackage size={36} style={{ opacity: .3, marginBottom: 12 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No hay compras pendientes de entrega</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <AnimatePresence>
            {pendientes.map((v, i) => (
              <motion.div key={v.id}
                initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 14 }} transition={{ delay: i * 0.03 }}
                className="chart-card"
                style={{ padding: "14px 16px",
                  borderLeft: v.vencida ? "3px solid #ef4444" : "3px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", flexShrink: 0,
                    background: v.vencida ? "rgba(239,68,68,0.12)" : "var(--accent-dim)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FiPackage size={16} color={v.vencida ? "#ef4444" : "var(--accent)"} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        {v.nombre_miembro || "Miembro"}
                      </span>
                      {v.vencida && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px",
                          borderRadius: 99, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                          Vencida
                        </span>
                      )}
                      {v.estado_pago === "pendiente" && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px",
                          borderRadius: 99, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                          {v.metodo_pago === "Efectivo" ? "Cobrar" : "Verificar pago"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>
                      {resumenItems(v.items)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, color: v.vencida ? "#ef4444" : "var(--text-secondary)", fontWeight: v.vencida ? 700 : 400 }}>
                        <FiClock size={11} /> {fmtFecha(v.fecha_recogida)} · {v.hora_recogida}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, color: "var(--text-secondary)" }}>
                        <FiCreditCard size={11} /> ${Number(v.total || 0).toFixed(2)} · {v.metodo_pago}{v.referencia ? ` · ref. ${v.referencia}` : ""}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => entregar(v)} disabled={entregandoId === v.id}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                      background: v.estado_pago === "pendiente" ? "#f59e0b" : "var(--accent)", border: "none", color: "#fff",
                      borderRadius: "var(--r-md)", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                      flexShrink: 0, opacity: entregandoId === v.id ? 0.6 : 1 }}>
                    <FiCheckCircle size={14} />
                    {entregandoId === v.id
                      ? "Procesando…"
                      : v.estado_pago === "pendiente" ? "Verificar y entregar" : "Entregar"}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
