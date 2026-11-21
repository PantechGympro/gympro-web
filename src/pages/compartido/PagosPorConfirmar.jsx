/**
 * PagosPorConfirmar.jsx
 *
 * Bandeja de pagos que el MIEMBRO declaró a mano y nadie ha verificado todavía:
 *   - compras de la tienda con Efectivo / Transferencia
 *   - renovaciones de membresía con Efectivo / Transferencia
 *
 * Visible para Recepcionista, Administrador y Propietario (el API responde 403 al
 * resto). Confirmar una renovación ACTIVA la membresía; confirmar una compra la deja
 * pagada y lista para entregar; rechazar cancela (y en tienda devuelve el stock).
 * PayPal y Mercado Pago no aparecen aquí: los verifica el webhook del proveedor.
 *
 * Se usa tal cual en /owner/confirmar-pagos y /receptionist/confirmar-pagos.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  FiCheckCircle, FiXCircle, FiRefreshCw, FiAlertCircle, FiClock, FiX,
  FiShoppingBag, FiCreditCard, FiDollarSign, FiSend, FiHash,
} from "react-icons/fi";
import {
  getPagosPendientes, confirmarVenta, rechazarVenta,
  confirmarRenovacion, rechazarRenovacion,
} from "../../api/confirmaciones";
import { mensajeAmigable } from "../../utils/errores";
import "../../css/CSSUnificado.css";

const REFRESCO_MS = 30000;

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n ?? 0);

const resumenItems = (items = []) =>
  items.map((it) => `${it.qty ?? it.cantidad ?? 1}× ${it.nombre}`).join(", ");

// La referencia y el nombre los escribe el MIEMBRO y aquí se pintan en un diálogo
// HTML del personal: se escapan para que no puedan inyectar marcado/scripts.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const hace = (iso) => {
  if (!iso) return "";
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
};

// Qué debe comprobar quien confirma, según el método declarado.
const INSTRUCCION = {
  Efectivo: (m) => `Confirma que recibiste ${fmtMoney(m)} en efectivo.`,
  Transferencia: (m) => `Confirma que la transferencia de ${fmtMoney(m)} ya aparece en el estado de cuenta.`,
};

const ICONO_METODO = { Efectivo: FiDollarSign, Transferencia: FiSend };

const FILTROS = [
  { id: "todos",      label: "Todos" },
  { id: "renovacion", label: "Renovaciones" },
  { id: "venta",      label: "Tienda" },
];

export default function PagosPorConfirmar() {
  const [ventas,       setVentas]       = useState([]);
  const [renovaciones, setRenovaciones] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filtro,       setFiltro]       = useState("todos");
  const [trabajandoId, setTrabajandoId] = useState(null);

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    try {
      const { data } = await getPagosPendientes();
      setVentas(data.ventas || []);
      setRenovaciones(data.renovaciones || []);
      // La recarga silenciosa (30 s o tras un 409) NO debe borrar el aviso que el
      // usuario aún no leyó, p. ej. "Este pago ya fue resuelto por otra persona".
      if (!silencioso) setError(null);
    } catch (e) {
      if (!silencioso) setError(mensajeAmigable(e?.response?.data?.error || e, "No se pudo cargar la bandeja."));
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(() => cargar({ silencioso: true }), REFRESCO_MS);
    return () => clearInterval(t);
  }, [cargar]);

  // Un solo listado, lo más antiguo primero: es lo que más lleva esperando.
  const items = useMemo(() => {
    const todos = [...renovaciones, ...ventas].sort(
      (a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
    return filtro === "todos" ? todos : todos.filter((i) => i.tipo === filtro);
  }, [ventas, renovaciones, filtro]);

  const quitar = (it) => {
    if (it.tipo === "venta") setVentas((p) => p.filter((x) => x.id !== it.id));
    else setRenovaciones((p) => p.filter((x) => x.id !== it.id));
  };

  const concepto = (it) =>
    it.tipo === "renovacion" ? `Renovación · ${it.membresia_nombre || "Membresía"}` : resumenItems(it.items);

  const detalleHtml = (it) => `
    <div style="text-align:left;font-size:13px;line-height:1.55">
      <b>${esc(it.nombre_miembro || "Miembro")}</b><br/>
      ${esc(concepto(it))}<br/>
      <span style="opacity:.8">${esc(fmtMoney(it.total))} · ${esc(it.metodo_pago)}${it.referencia ? ` · ref. <b>${esc(it.referencia)}</b>` : ""}</span>
    </div>`;

  const confirmar = async (it) => {
    const instr = (INSTRUCCION[it.metodo_pago] || (() => "Confirma que verificaste el pago."))(it.total);
    const extra = it.tipo === "renovacion"
      ? "Al confirmar, la membresía se activa de inmediato."
      : "Al confirmar, la compra queda pagada y lista para entregar.";
    const { isConfirmed } = await Swal.fire({
      title: "¿Confirmar pago?",
      html: `${detalleHtml(it)}<p style="text-align:left;font-size:13px;margin-top:10px"><b style="color:#f59e0b">${instr}</b><br/>${extra}</p>`,
      icon: "question", showCancelButton: true,
      confirmButtonText: "Sí, pago verificado", cancelButtonText: "Cancelar",
      confirmButtonColor: "var(--accent)", background: "var(--bg-card)", color: "var(--text-primary)",
    });
    if (!isConfirmed) return;
    await resolver(it, () => (it.tipo === "venta" ? confirmarVenta(it.id) : confirmarRenovacion(it.id)),
      it.tipo === "renovacion" ? "Membresía activada" : "Pago confirmado");
  };

  const rechazar = async (it) => {
    const { isConfirmed, value } = await Swal.fire({
      title: "¿Rechazar este pago?",
      html: `${detalleHtml(it)}<p style="text-align:left;font-size:13px;margin-top:10px">${
        it.tipo === "renovacion"
          ? "La membresía NO se activará."
          : "La compra se cancela y el producto vuelve al inventario."} El miembro recibirá un aviso.</p>`,
      input: "text", inputPlaceholder: "Motivo (opcional): no llegó la transferencia…",
      inputAttributes: { maxlength: 200 },
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Rechazar pago", cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444", background: "var(--bg-card)", color: "var(--text-primary)",
    });
    if (!isConfirmed) return;
    await resolver(it, () => (it.tipo === "venta" ? rechazarVenta(it.id, value) : rechazarRenovacion(it.id, value)),
      "Pago rechazado");
  };

  const resolver = async (it, accion, mensajeOk) => {
    setTrabajandoId(it.id);
    try {
      await accion();
      quitar(it);
      Swal.fire({ title: mensajeOk, icon: "success", timer: 1300, showConfirmButton: false,
        background: "var(--bg-card)", color: "var(--text-primary)" });
    } catch (e) {
      const status = e?.response?.status;
      setError(e?.response?.data?.error || mensajeAmigable(e));
      if (status === 409) cargar({ silencioso: true });   // otra persona ya lo resolvió
    } finally {
      setTrabajandoId(null);
    }
  };

  const total = ventas.length + renovaciones.length;

  return (
    <div className="dashboard-content">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20, display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0,
            display: "flex", alignItems: "center" }}>
            Pagos por confirmar
            {total > 0 && (
              <span style={{ marginLeft: 10, background: "#f59e0b", color: "#fff", borderRadius: 99,
                fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>{total}</span>
            )}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4, maxWidth: 640 }}>
            Pagos en efectivo o transferencia que el miembro declaró desde su cuenta.
            No cuentan como ingreso ni se entregan ni se activan hasta que los verifiques.
            Los pagos con PayPal y Mercado Pago se validan solos con la pasarela.
          </p>
        </div>
        <motion.button onClick={() => cargar()} disabled={loading}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Actualizar"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            background: "transparent", border: "1px solid var(--border-dark)",
            color: "var(--text-secondary)", borderRadius: "var(--r-md)", cursor: "pointer", fontSize: 13 }}>
          <FiRefreshCw size={14} />
        </motion.button>
      </motion.div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTROS.map((f) => {
          const n = f.id === "todos" ? total : f.id === "venta" ? ventas.length : renovaciones.length;
          const activo = filtro === f.id;
          return (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              style={{ padding: "6px 14px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${activo ? "var(--accent)" : "var(--border)"}`,
                background: activo ? "var(--accent)" : "transparent",
                color: activo ? "#fff" : "var(--text-secondary)" }}>
              {f.label} ({n})
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: 8,
          color: "#ef4444", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span><FiAlertCircle size={13} style={{ marginRight: 6 }} />{error}</span>
          <button onClick={() => setError(null)} aria-label="Cerrar aviso"
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><FiX size={12} /></button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
          Cargando pagos pendientes...
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 52, textAlign: "center", color: "var(--text-secondary)" }}>
          <FiCheckCircle size={36} style={{ opacity: .3, marginBottom: 12 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No hay pagos por confirmar</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AnimatePresence>
            {items.map((it, i) => {
              const Icono = ICONO_METODO[it.metodo_pago] || FiCreditCard;
              const ocupado = trabajandoId === it.id;
              return (
                <motion.div key={`${it.tipo}-${it.id}`} layout
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 14 }} transition={{ delay: i * 0.03 }}
                  className="chart-card"
                  style={{ padding: "14px 16px", borderLeft: "3px solid #f59e0b" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", flexShrink: 0,
                      background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {it.tipo === "renovacion"
                        ? <FiRefreshCw size={16} color="var(--accent)" />
                        : <FiShoppingBag size={16} color="var(--accent)" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                          {it.nombre_miembro || "Miembro"}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: "rgba(99,102,241,.12)", color: "var(--accent)" }}>
                          {it.tipo === "renovacion" ? "Renovación" : "Tienda"}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>{concepto(it)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 6,
                        fontSize: 12, color: "var(--text-secondary)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, color: "var(--text-primary)" }}>
                          {fmtMoney(it.total)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Icono size={12} /> {it.metodo_pago}
                        </span>
                        {it.referencia && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FiHash size={12} /> <b style={{ color: "var(--text-primary)", userSelect: "all" }}>{it.referencia}</b>
                          </span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FiClock size={12} /> {hace(it.fecha)}
                        </span>
                        {it.tipo === "venta" && it.fecha_recogida && (
                          <span>Recoge {it.fecha_recogida} · {it.hora_recogida}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => rechazar(it)} disabled={ocupado}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "transparent",
                          border: "1px solid rgba(239,68,68,.5)", color: "#ef4444", borderRadius: "var(--r-md)",
                          cursor: "pointer", fontSize: 12.5, fontWeight: 600, opacity: ocupado ? .6 : 1 }}>
                        <FiXCircle size={14} /> Rechazar
                      </button>
                      <button onClick={() => confirmar(it)} disabled={ocupado}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent)",
                          border: "none", color: "#fff", borderRadius: "var(--r-md)", cursor: "pointer",
                          fontSize: 12.5, fontWeight: 600, opacity: ocupado ? .6 : 1 }}>
                        <FiCheckCircle size={14} /> {ocupado ? "Procesando…" : "Confirmar pago"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
