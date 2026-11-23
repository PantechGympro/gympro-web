/**
 * POSCheckoutModal.jsx — Modal de confirmacion de cobro con seleccion
 * de miembro y metodo de pago.
 *
 * PayPal/Mercado Pago (nov/2026, pedido del gym): solo deben verse cuando
 * quien cobra ES el miembro (self-checkout en /user/pos, ya sea web o
 * movil) -- el pagador tiene que usar su propia cuenta. El staff que cobra
 * en mostrador (Propietario, Administrador, Recepcionista, Entrenador)
 * nunca debe verlas: solo cobra lo que puede recibir en mano o confirmar
 * por transferencia, igual que ya hace CobrarMembresia.jsx (ver
 * useMetodosPago.js / "soloManual" para el porque completo).
 */
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiAlertCircle, FiDollarSign, FiUser, FiLock, FiCalendar, FiClock } from "react-icons/fi";
import { registrarVenta, getHorariosGym } from "../../api/owner_gym";
import useMetodosPago from "../../hooks/useMetodosPago";
import { pagarYRedirigir } from "../../api/pagosOnline";

/* Mismo criterio que PointOfSale.jsx (getIsMiembro): se calcula sincrono
   desde localStorage, sin esperar al useEffect que arma `lockedMiembro`,
   para que useMetodosPago reciba el valor correcto desde el primer render
   y no pida pasarelas de mas para luego descartarlas. */
function getIsMiembroActual() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.role === "Miembro" || u.role === "user";
  } catch { return false; }
}

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const nowStr = () => new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });

const inputSt = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)", fontSize: 14, outline: "none",
};
const labelSt = {
  display: "block", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: ".06em",
  color: "var(--text-secondary)", marginBottom: 5,
};

export default function CheckoutModal({ cart, miembros, onClose, onComplete }) {
  const [miembro,    setMiembro]    = useState("");
  const [metodo,     setMetodo]     = useState("Efectivo");
  const [referencia, setReferencia] = useState("");
  // Efectivo + TotalPass siempre; PayPal/Mercado Pago solo si cobra el
  // propio miembro (soloManual=false) -- nunca si cobra el staff.
  const isMiembroActual = getIsMiembroActual();
  const { metodos: metodosPago } = useMetodosPago("producto", {
    // TotalPass solo lo registra el personal en mostrador: no hay forma de verificar
    // que un miembro lo use, y el API lo rechaza si viene de un miembro.
    incluirTotalPass: !isMiembroActual,
    soloManual: !isMiembroActual,
  });
  const [loading,    setLoading]  = useState(false);
  const [err,        setErr]      = useState("");

  // Si el usuario autenticado es un Miembro, se auto-asigna la venta a él.
  // lockedMiembro: { pgId: number, nombre: string } | null
  const [lockedMiembro, setLockedMiembro] = useState(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u.role === "Miembro" || u.role === "user") {
        setLockedMiembro({ pgId: parseInt(u.id, 10), nombre: u.nombre || "" });
      }
    } catch { /* si no hay user en storage, no bloqueamos */ }
  }, []);

  // ── HU-39 (web): dia y hora de recogida del producto ────────────────────
  // Paridad con la app movil (app/(member)/pos.tsx): cuando quien compra es
  // el propio miembro, el backend EXIGE fecha_recogida/hora_recogida (ver
  // registrar_venta en ventas.py) -- sin esto la venta se rechazaba con 400
  // y nunca llegaba a avisarle a recepcion. El staff cobrando en mostrador
  // no necesita nada de esto (entrega el producto ahi mismo).
  const [horarios,   setHorarios]   = useState(null);
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);

  useEffect(() => {
    if (!isMiembroActual) return;
    getHorariosGym()
      .then(res => setHorarios(res.data?.horarios || {}))
      .catch(() => setHorarios({}));
  }, [isMiembroActual]);

  // Proximos 7 dias en que el gimnasio abre, cada uno con sus franjas de 30
  // min dentro del horario de atencion. La validacion real (autoritativa)
  // ocurre en el backend; esto solo evita ofrecer algo que el servidor
  // rechazaria. Mismo algoritmo que la app movil, para que ambas ofrezcan
  // exactamente las mismas franjas.
  const pickupDays = useMemo(() => {
    if (!horarios) return [];
    const DIA_KEY_POR_JS_DAY = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const ahora = new Date();
    const dias = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(ahora);
      d.setDate(d.getDate() + i);
      const horario = horarios[DIA_KEY_POR_JS_DAY[d.getDay()]];
      if (!horario || horario.cerrado) continue;

      const [hA, mA] = horario.apertura.split(":").map(Number);
      const [hC, mC] = horario.cierre.split(":").map(Number);
      const finMin = hC * 60 + mC;
      const minDesde = i === 0
        ? Math.max(hA * 60 + mA, ahora.getHours() * 60 + ahora.getMinutes() + 15)
        : hA * 60 + mA;

      const slots = [];
      for (let cursor = minDesde; cursor <= finMin; cursor += 30) {
        const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
        const mm = String(cursor % 60).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
      if (slots.length === 0) continue;

      const label = i === 0 ? "Hoy" : i === 1 ? "Mañana"
        : d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dias.push({ iso, label, slots });
    }
    return dias;
  }, [horarios]);

  // Preselecciona el primer dia/horario disponible en cuanto cargan.
  useEffect(() => {
    if (pickupDays.length === 0) return;
    if (!pickupDate || !pickupDays.some(d => d.iso === pickupDate)) {
      setPickupDate(pickupDays[0].iso);
      setPickupTime(pickupDays[0].slots[0]);
    }
  }, [pickupDays]);

  const selectedDaySlots = pickupDays.find(d => d.iso === pickupDate)?.slots ?? [];

  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);

  // Elegir miembro es OPCIONAL (pedido del gym, nov/2026): permite cobrar
  // visitas de un dia u otras ventas de mostrador a alguien que no esta
  // registrado, sin obligar a elegir un miembro que no es quien compra.
  const esTransferencia = metodo === "Transferencia";
  const faltaReferencia = esTransferencia && !referencia.trim();
  const faltaRecogida   = isMiembroActual && (!pickupDate || !pickupTime);
  const puedeConfirmar  = !faltaReferencia && !faltaRecogida;

  const handlePagar = async () => {
    if (faltaReferencia) { setErr("Captura la referencia de la transferencia"); return; }
    if (faltaRecogida)   { setErr("Elige el día y la hora en que pasarás por tu producto"); return; }

    // HU-39 (web): solo viaja cuando compra el propio miembro -- el staff
    // entrega en mostrador, sin agendar nada.
    const recogida = isMiembroActual
      ? { fecha_recogida: pickupDate, hora_recogida: pickupTime }
      : {};

    // Con PayPal o Mercado Pago el cobro se hace en la pasarela y se redirige.
    const metodoSel = metodosPago.find(m => m.id === metodo);
    if (metodoSel?.esPasarela) {
      setLoading(true); setErr("");
      try {
        await pagarYRedirigir({
          proveedor: metodoSel.proveedor,
          contexto: "producto",
          monto: Number(total.toFixed(2)),
          descripcion: `Venta de productos (${cart.length} artículo${cart.length === 1 ? "" : "s"})`,
          referencia_local: lockedMiembro?.pgId || miembro || null,
          // El backend registra la venta y descuenta inventario al confirmarse
          // (_aplicar_venta en pagos_online.py, que ya sabe leer fecha/hora de
          // recogida desde estos mismos metadatos -- ver app/(member)/pos.tsx).
          metadatos: {
            items: cart.map(({ id, nombre, precio, qty, categoria }) => ({ id, nombre, precio, qty, categoria })),
            id_miembro: lockedMiembro ? lockedMiembro.pgId : miembro,
            nombre_miembro: lockedMiembro
              ? lockedMiembro.nombre
              : (miembros.find(m => String(m.id) === String(miembro))?.nombre || ""),
            ...recogida,
          },
        });
      } catch (e) {
        setErr(e.response?.data?.msg || "No se pudo iniciar el pago en línea");
        setLoading(false);
      }
      return;
    }

    setLoading(true); setErr("");
    try {
      // Miembro auto-asignado (rol Miembro): usa el PG user ID para el lookup de email en backend.
      // Selección manual (staff): usa el Mongo _id tal cual — se almacena en ventas sin conversión.
      const id_miem   = lockedMiembro ? lockedMiembro.pgId : miembro;
      const nom_miem  = lockedMiembro
        ? lockedMiembro.nombre
        : (miembros.find(m => String(m.id) === String(miembro))?.nombre || "");

      const payload = {
        items:          cart.map(({ id, nombre, precio, qty, categoria }) => ({ id, nombre, precio, qty, categoria })),
        total,
        metodo_pago:    metodo,
        id_miembro:     id_miem,
        nombre_miembro: nom_miem,
        ...(esTransferencia ? { referencia: referencia.trim() } : {}),
        ...recogida,
      };
      const res = await registrarVenta(payload);
      onComplete({ ...payload, id: res.data?.id, fecha: nowStr(), estado_pago: res.data?.estado_pago });
    } catch (e) {
      setErr(e.response?.data?.error || "Error al registrar la venta");
      setLoading(false);
    }
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9992, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 9993, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 0, maxWidth: 460, width: "100%", pointerEvents: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FiDollarSign size={18} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Confirmar cobro</h3>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><FiX size={18} /></button>
          </div>

          {/* Resumen de items */}
          <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)", maxHeight: 160, overflowY: "auto" }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, fontSize: 13 }}>
                <span style={{ color: "var(--text-primary)" }}>
                  {item.nombre} <span style={{ color: "var(--text-secondary)" }}>x{item.qty}</span>
                </span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>{fmt(item.precio * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Miembro */}
            <div>
              <label style={labelSt}>
                <FiUser style={{ display: "inline", marginRight: 4 }} size={11} />
                Miembro {!lockedMiembro && "(opcional)"}
              </label>

              {lockedMiembro ? (
                /* Compra propia: campo bloqueado, asignado automáticamente */
                <div style={{
                  ...inputSt,
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "default", userSelect: "none",
                  border: "1px solid var(--border-hover)",
                  background: "rgba(99,102,241,.07)",
                }}>
                  <FiUser size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{lockedMiembro.nombre}</span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, fontWeight: 700, color: "var(--accent)",
                    background: "var(--accent-dim)", borderRadius: 99,
                    padding: "2px 8px", flexShrink: 0,
                  }}>
                    <FiLock size={9} /> Tú
                  </span>
                </div>
              ) : (
                /* Staff: selector libre de miembro -- opcional. Sin elegir
                   nada, la venta se registra como venta de mostrador / visita
                   sin miembro asociado (p. ej. cobrar una visita de un dia). */
                <select style={inputSt} value={miembro} onChange={e => { setMiembro(e.target.value); setErr(""); }}>
                  <option value="">Sin miembro (visita / venta directa)</option>
                  {miembros.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                  ))}
                </select>
              )}
              {!lockedMiembro && miembros.length === 0 && (
                <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 6 }}>
                  No hay miembros registrados en este gimnasio todavía.
                </p>
              )}
            </div>

            {/* Metodo de pago */}
            <div>
              <label style={labelSt}>Metodo de pago</label>
              {/* Efectivo + pasarelas activas del gimnasio */}
              <div style={{ display: "flex", gap: 8 }}>
                {metodosPago.map(m => (
                  <button key={m.id} type="button" onClick={() => { setMetodo(m.id); setErr(""); }}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: metodo === m.id ? "var(--accent)" : "var(--bg-input, rgba(255,255,255,.05))",
                      color: metodo === m.id ? "#fff" : "var(--text-secondary)" }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Referencia de la transferencia: queda en el historial del
                  movimiento para poder localizarla en el banco si hace falta. */}
              {esTransferencia && (
                <div style={{ marginTop: 10 }}>
                  <input
                    style={inputSt}
                    placeholder="Folio o referencia de la transferencia"
                    value={referencia}
                    onChange={e => { setReferencia(e.target.value); setErr(""); }}
                  />
                </div>
              )}
            </div>

            {/* HU-39 (web): dia y hora de recogida -- solo cuando compra el
                propio miembro. El staff entrega el producto ahi mismo. */}
            {isMiembroActual && (
              <div>
                <label style={labelSt}>
                  <FiCalendar style={{ display: "inline", marginRight: 4 }} size={11} />
                  ¿Cuándo pasas por tu producto?
                </label>
                {horarios === null ? (
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Cargando horario del gimnasio…</p>
                ) : pickupDays.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--danger)" }}>
                    El gimnasio no tiene horario de atención configurado para los próximos días.
                  </p>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                      {pickupDays.map(d => (
                        <button key={d.iso} type="button"
                          onClick={() => { setPickupDate(d.iso); setPickupTime(d.slots[0]); setErr(""); }}
                          style={{
                            flexShrink: 0, padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                            background: pickupDate === d.iso ? "var(--accent)" : "var(--bg-input, rgba(255,255,255,.05))",
                            color: pickupDate === d.iso ? "#fff" : "var(--text-secondary)",
                          }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {selectedDaySlots.map(t => (
                        <button key={t} type="button"
                          onClick={() => { setPickupTime(t); setErr(""); }}
                          style={{
                            padding: "6px 11px", borderRadius: 8, border: "none", cursor: "pointer",
                            fontSize: 12, fontWeight: 600,
                            background: pickupTime === t ? "var(--accent)" : "var(--bg-input, rgba(255,255,255,.05))",
                            color: pickupTime === t ? "#fff" : "var(--text-secondary)",
                          }}>
                          <FiClock style={{ display: "inline", marginRight: 3, verticalAlign: "-1px" }} size={10} />
                          {t}
                        </button>
                      ))}
                    </div>
                    {metodo === "Efectivo" && (
                      <p style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>
                        Tu pago queda pendiente hasta que pases a recepción a esa hora. Le avisamos al personal.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {err && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 12px", color: "var(--danger)", fontSize: 12 }}>
                <FiAlertCircle size={14} /> {err}
              </div>
            )}

            {/* Total + boton */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Total a cobrar</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{fmt(total)}</span>
              </div>
              <button onClick={handlePagar} disabled={loading || !puedeConfirmar}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                  background: loading ? "#4f46e5" : puedeConfirmar ? "var(--accent)" : "var(--border-hover, rgba(255,255,255,.12))",
                  color: puedeConfirmar ? "#fff" : "var(--text-secondary)",
                  fontSize: 15, fontWeight: 700, cursor: (loading || !puedeConfirmar) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.8 : 1 }}>
                {loading
                  ? "Procesando..."
                  : <><FiCheck size={16} />
                      {metodosPago.find(m => m.id === metodo)?.esPasarela
                        ? `Cobrar con ${metodosPago.find(m => m.id === metodo)?.label}`
                        : "Confirmar cobro"}
                    </>}
              </button>

              {metodosPago.find(m => m.id === metodo)?.esPasarela && (
                <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "10px 0 0", lineHeight: 1.5 }}>
                  Se abrirá la pasarela para cobrar {fmt(total)}. La venta se registra al confirmarse el pago.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
