import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle, FiDownload, FiShield, FiTrash2, FiRotateCcw, FiCheckCircle,
  FiArrowLeft, FiLock,
} from "react-icons/fi";
import {
  getEstadoCuenta, cancelarSuscripcion, reactivarSuscripcion,
  programarEliminacion, cancelarEliminacion, exportarDatosCuenta,
} from "../../api/owner_gym";
import { CORREO_SOPORTE } from "../../constants/legal";

/**
 * "Cuenta y datos" — el propietario cancela su plan o elimina su cuenta.
 *
 * Las dos cosas estaban fuera del producto: cancelar había que pedirlo y
 * eliminar el gimnasio solo era posible con el script de mantenimiento. Ahora
 * se puede hacer solo, pero la pantalla está escrita para que nadie borre nada
 * sin entender qué pierde:
 *
 *  · Cancelar y eliminar se presentan separados y con consecuencias distintas.
 *  · Lo que se eliminaría son los CONTEOS REALES del gimnasio, no categorías
 *    genéricas: "1 240 asistencias" pesa distinto que "tus datos".
 *  · Antes del botón rojo se ofrecen las salidas que casi siempre resuelven el
 *    motivo real: bajar de plan, cancelar sin borrar, llevarse una copia.
 *  · La eliminación se programa con margen y se puede deshacer; exige
 *    contraseña y escribir ELIMINAR.
 */

const FRASE = "ELIMINAR";

const fecha = (iso) => (iso
  ? new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
  : "—");

// Etiquetas de lo que se eliminaría. El orden importa: primero lo que más
// duele perder.
const ETIQUETAS = [
  ["miembros", "Socios en el padrón"],
  ["membresias", "Membresías registradas"],
  ["asistencias", "Asistencias y entradas"],
  ["pagos", "Pagos de membresía"],
  ["ventas", "Ventas del punto de venta"],
  ["productos", "Productos del inventario"],
  ["rutinas", "Rutinas creadas"],
  ["dietas", "Planes de nutrición"],
  ["progreso_fisico", "Registros de progreso físico"],
  ["mensajes_chat", "Mensajes de chat"],
  ["cuentas_personal", "Cuentas de personal"],
  ["sucursales", "Sucursales"],
];

export default function OwnerCuenta() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState(null);                 // { tipo: "ok"|"error", texto }
  const [confirmando, setConfirmando] = useState(null); // null | "cancelar" | "eliminar"

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await getEstadoCuenta();
      setEstado(data);
    } catch (e) {
      setMsg({ tipo: "error", texto: e?.response?.data?.error || "No pudimos cargar el estado de tu cuenta." });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const accion = async (fn, exito) => {
    setOcupado(true);
    setMsg(null);
    try {
      const { data } = await fn();
      setMsg({ tipo: "ok", texto: data?.msg || exito });
      setConfirmando(null);
      await cargar();
      return true;
    } catch (e) {
      setMsg({ tipo: "error", texto: e?.response?.data?.error || "No se pudo completar la acción." });
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const descargar = async () => {
    setOcupado(true);
    try {
      const { data } = await exportarDatosCuenta();
      const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `gympro-datos-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ tipo: "ok", texto: "Descargamos una copia de la información de tu gimnasio." });
    } catch {
      setMsg({ tipo: "error", texto: "No pudimos generar la copia. Inténtalo de nuevo." });
    } finally {
      setOcupado(false);
    }
  };

  if (cargando) {
    return <div style={S.page}><p style={S.sub}>Cargando tu cuenta…</p></div>;
  }
  if (!estado) {
    return (
      <div style={S.page}>
        <p role="alert" style={{ ...S.banner, ...S.bannerErr }}>{msg?.texto || "No disponible."}</p>
      </div>
    );
  }

  const sus = estado.suscripcion;
  const baja = estado.baja;
  const datos = estado.datos || {};
  const lineas = ETIQUETAS.filter(([k]) => (datos[k] ?? 0) > 0);

  return (
    <div style={S.page}>
      <Link to="/owner/subscription" style={S.volver}><FiArrowLeft /> Volver a Mi Suscripción</Link>
      <h1 style={S.title}>Cuenta y datos</h1>
      <p style={S.sub}>
        Aquí decides qué pasa con tu plan y con la información de {estado.gimnasio?.nombre || "tu gimnasio"}.
      </p>

      {msg && (
        <p role={msg.tipo === "error" ? "alert" : "status"}
          style={{ ...S.banner, ...(msg.tipo === "ok" ? S.bannerOk : S.bannerErr) }}>
          {msg.texto}
        </p>
      )}

      {/* ── Baja programada: lo primero que debe ver, con la salida a mano ── */}
      {baja && (
        <div style={{ ...S.card, ...S.cardPeligro }}>
          <h2 style={S.h2}><FiAlertTriangle /> Tu cuenta se eliminará el {fecha(baja.programada_para)}</h2>
          <p style={S.texto}>
            Faltan <strong>{baja.dias_restantes} día(s)</strong>. Hasta esa fecha todo sigue funcionando con
            normalidad y puedes detenerlo con un clic. Después, la eliminación es definitiva.
          </p>
          <div style={S.acciones}>
            <button type="button" style={S.primario} disabled={ocupado}
              onClick={() => accion(cancelarEliminacion, "Tu cuenta se conserva.")}>
              <FiRotateCcw /> Conservar mi cuenta
            </button>
            <button type="button" style={S.ghost} disabled={ocupado} onClick={descargar}>
              <FiDownload /> Descargar mis datos
            </button>
          </div>
        </div>
      )}

      {/* ── Suscripción ──────────────────────────────────────────────────── */}
      <div style={S.card}>
        <h2 style={S.h2}>Tu suscripción</h2>
        {!sus ? (
          <p style={S.texto}>Este gimnasio no tiene una suscripción activa.</p>
        ) : (
          <>
            <dl style={S.datos}>
              <div><dt style={S.dt}>Plan</dt><dd style={S.dd}>{sus.plan || "—"} ({sus.ciclo})</dd></div>
              <div><dt style={S.dt}>Estado</dt><dd style={S.dd}>{sus.estado}</dd></div>
              <div>
                <dt style={S.dt}>{sus.cancelacion_programada ? "Servicio hasta" : "Próximo cobro"}</dt>
                <dd style={S.dd}>{fecha(sus.servicio_hasta)}</dd>
              </div>
              <div>
                <dt style={S.dt}>Cargo automático</dt>
                <dd style={S.dd}>{sus.auto_renovar ? `Activo (${sus.pasarela || "pasarela"})` : "Desactivado"}</dd>
              </div>
            </dl>

            {sus.cancelacion_programada ? (
              <>
                <p style={S.texto}>
                  Tu plan está cancelado y seguirá activo hasta el <strong>{fecha(sus.servicio_hasta)}</strong>.
                  No se eliminó ninguna información: si cambias de idea, puedes reactivarlo antes de esa fecha.
                </p>
                <div style={S.acciones}>
                  <button type="button" style={S.primario} disabled={ocupado}
                    onClick={() => accion(reactivarSuscripcion, "Tu suscripción sigue activa.")}>
                    <FiCheckCircle /> Reactivar mi suscripción
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={S.texto}>
                  Cancelar el plan <strong>no borra nada</strong>: conservas el servicio hasta la fecha ya pagada y,
                  después, tu información se queda guardada por si vuelves.
                </p>
                <div style={S.acciones}>
                  <button type="button" style={S.ghost} disabled={ocupado || !!baja}
                    onClick={() => setConfirmando("cancelar")}>
                    Cancelar suscripción
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Copia de los datos ───────────────────────────────────────────── */}
      <div style={S.card}>
        <h2 style={S.h2}>Llévate una copia</h2>
        <p style={S.texto}>
          Descarga la información de tu gimnasio en un archivo JSON: padrón de socios, membresías, pagos, ventas,
          productos, rutinas y progreso. No incluye contraseñas ni credenciales de las pasarelas.
        </p>
        <div style={S.acciones}>
          <button type="button" style={S.ghost} disabled={ocupado} onClick={descargar}>
            <FiDownload /> Descargar mis datos
          </button>
        </div>
      </div>

      {/* ── Eliminación ──────────────────────────────────────────────────── */}
      {!baja && (
        <div style={{ ...S.card, ...S.cardPeligro }}>
          <h2 style={S.h2}><FiTrash2 /> Eliminar la cuenta y todos los datos</h2>
          <p style={S.texto}>
            Esto borra <strong>{estado.gimnasio?.nombre || "tu gimnasio"}</strong> y toda su información de GymPro,
            no solo el acceso. Es definitivo.
          </p>

          <h3 style={S.h3}>Antes de hacerlo, considera que</h3>
          <ul style={S.lista}>
            <li>
              Si el problema es el costo, puedes <Link to="/owner/subscription" style={S.enlace}>cambiar a un plan
              menor</Link> y conservar todo.
            </li>
            <li>
              Si solo quieres dejar de pagar, <strong>cancela la suscripción</strong>: el servicio termina en la fecha
              pagada y tus datos se quedan guardados.
            </li>
            <li>Si te vas por algo que falta o no funciona, escríbenos a {CORREO_SOPORTE}: a veces ya está resuelto.</li>
            <li>Descarga tus datos primero: después de la eliminación no hay forma de recuperarlos.</li>
          </ul>

          <h3 style={S.h3}>Qué se eliminará</h3>
          {lineas.length === 0 ? (
            <p style={S.texto}>Tu gimnasio todavía no tiene información registrada.</p>
          ) : (
            <ul style={S.conteos}>
              {lineas.map(([clave, etiqueta]) => (
                <li key={clave} style={S.conteo}>
                  <strong style={S.numero}>{(datos[clave] ?? 0).toLocaleString("es-MX")}</strong> {etiqueta}
                </li>
              ))}
            </ul>
          )}
          <p style={S.nota}>
            También las cuentas de tu personal y de tus socios, con sus rutinas, fotos y notificaciones. Se conserva
            únicamente la constancia de que la baja ocurrió y los comprobantes que la ley fiscal obligue a mantener
            (ver <Link to="/privacidad#eliminar-cuenta" style={S.enlace}>el Aviso de Privacidad</Link>).
          </p>

          <div style={S.acciones}>
            <button type="button" style={S.peligro} disabled={ocupado} onClick={() => setConfirmando("eliminar")}>
              <FiTrash2 /> Eliminar mi cuenta
            </button>
          </div>
        </div>
      )}

      {confirmando === "cancelar" && (
        <ModalCancelar
          hasta={fecha(sus?.servicio_hasta)}
          ocupado={ocupado}
          onCerrar={() => setConfirmando(null)}
          onConfirmar={(motivo) => accion(() => cancelarSuscripcion(motivo), "Suscripción cancelada.")}
        />
      )}
      {confirmando === "eliminar" && (
        <ModalEliminar
          nombre={estado.gimnasio?.nombre}
          dias={estado.dias_gracia}
          total={lineas.reduce((suma, [k]) => suma + (datos[k] ?? 0), 0)}
          ocupado={ocupado}
          onCerrar={() => setConfirmando(null)}
          onConfirmar={(datosForm) => accion(() => programarEliminacion(datosForm), "Eliminación programada.")}
        />
      )}
    </div>
  );
}

// ── Confirmación de cancelación ─────────────────────────────────────────────

function ModalCancelar({ hasta, ocupado, onCerrar, onConfirmar }) {
  const [motivo, setMotivo] = useState("");
  return (
    <Modal titulo="Cancelar tu suscripción" onCerrar={onCerrar}>
      <p style={S.texto}>
        Tu plan seguirá activo hasta el <strong>{hasta}</strong> y no se cobrará de nuevo. Después, las funciones de
        pago se desactivan, pero <strong>tu información no se elimina</strong>.
      </p>
      <label style={S.label} htmlFor="motivo-cancelar">¿Nos dices por qué? (opcional)</label>
      <textarea id="motivo-cancelar" style={S.textarea} rows={3} value={motivo}
        onChange={(e) => setMotivo(e.target.value)} placeholder="Nos ayuda a mejorar." />
      <div style={S.acciones}>
        <button type="button" style={S.ghost} onClick={onCerrar} disabled={ocupado}>Mejor no</button>
        <button type="button" style={S.peligro} disabled={ocupado} onClick={() => onConfirmar(motivo.trim())}>
          Sí, cancelar el plan
        </button>
      </div>
    </Modal>
  );
}

// ── Confirmación de eliminación ─────────────────────────────────────────────

function ModalEliminar({ nombre, dias, total, ocupado, onCerrar, onConfirmar }) {
  const [password, setPassword] = useState("");
  const [frase, setFrase] = useState("");
  const [motivo, setMotivo] = useState("");
  const [entiendo, setEntiendo] = useState(false);
  const listo = entiendo && password.length > 0 && frase.trim().toUpperCase() === FRASE;

  return (
    <Modal titulo="Eliminar la cuenta" onCerrar={onCerrar}>
      <p style={{ ...S.texto, ...S.avisoFuerte }}>
        Se eliminarán <strong>{nombre || "tu gimnasio"}</strong> y {total.toLocaleString("es-MX")} registros
        asociados. La eliminación se ejecuta en <strong>{dias} días</strong>; hasta entonces puedes detenerla desde
        esta misma pantalla. Después no hay vuelta atrás.
      </p>

      <label style={S.checkFila}>
        <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} />
        <span>Entiendo que la eliminación es definitiva y que descargar mis datos antes es mi responsabilidad.</span>
      </label>

      <label style={S.label} htmlFor="password-baja">Tu contraseña</label>
      <input id="password-baja" type="password" style={S.input} value={password} autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)} placeholder="Para confirmar que eres tú" />

      <label style={S.label} htmlFor="frase-baja">Escribe <strong>{FRASE}</strong> para confirmar</label>
      <input id="frase-baja" style={S.input} value={frase} onChange={(e) => setFrase(e.target.value)}
        placeholder={FRASE} autoComplete="off" />

      <label style={S.label} htmlFor="motivo-baja">¿Por qué te vas? (opcional)</label>
      <textarea id="motivo-baja" style={S.textarea} rows={2} value={motivo}
        onChange={(e) => setMotivo(e.target.value)} />

      <div style={S.acciones}>
        <button type="button" style={S.ghost} onClick={onCerrar} disabled={ocupado}>Conservar mi cuenta</button>
        <button type="button" style={{ ...S.peligro, opacity: listo ? 1 : 0.5 }} disabled={!listo || ocupado}
          onClick={() => onConfirmar({ password, confirmacion: frase.trim().toUpperCase(), motivo: motivo.trim() })}>
          <FiLock /> Programar la eliminación
        </button>
      </div>
    </Modal>
  );
}

function Modal({ titulo, onCerrar, children }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} style={S.fondo} onClick={onCerrar}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ ...S.h2, marginBottom: 14 }}><FiShield size={18} /> {titulo}</h2>
        {children}
      </div>
    </div>
  );
}

const BORDE = "var(--border, rgba(255,255,255,.12))";

const S = {
  page: { padding: "28px 32px 56px", color: "var(--text-primary)", maxWidth: 860 },
  volver: {
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
    color: "var(--text-secondary)", textDecoration: "none", marginBottom: 14,
  },
  title: { fontSize: 26, fontWeight: 800, margin: "0 0 6px" },
  sub: { color: "var(--text-secondary)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 },
  card: {
    background: "var(--bg-card)", border: `1px solid ${BORDE}`, borderRadius: 14,
    padding: "22px 24px", marginBottom: 18,
  },
  cardPeligro: { borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.04)" },
  h2: {
    display: "flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 700,
    margin: "0 0 12px", color: "var(--text-primary)",
  },
  h3: { fontSize: 14, fontWeight: 700, margin: "18px 0 8px", color: "var(--text-primary)" },
  texto: { fontSize: 14.5, lineHeight: 1.7, margin: "0 0 12px", color: "var(--text-secondary)" },
  nota: { fontSize: 13, lineHeight: 1.65, margin: "10px 0 0", color: "var(--text-tertiary, #6b7280)" },
  avisoFuerte: {
    background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)",
    borderRadius: 10, padding: "12px 14px",
  },
  datos: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14, margin: "0 0 16px",
  },
  dt: { fontSize: 11.5, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-tertiary, #6b7280)" },
  dd: { fontSize: 15, fontWeight: 600, margin: "3px 0 0", textTransform: "capitalize" },
  lista: { fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: "0 0 4px", display: "grid", gap: 7, color: "var(--text-secondary)" },
  conteos: {
    listStyle: "none", padding: 0, margin: "0 0 4px",
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8,
  },
  conteo: {
    fontSize: 14, padding: "9px 12px", borderRadius: 9,
    border: `1px solid ${BORDE}`, color: "var(--text-secondary)",
  },
  numero: { color: "var(--danger, #ef4444)", fontSize: 16, marginRight: 4 },
  enlace: { color: "var(--accent)" },
  acciones: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  primario: {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none",
    background: "var(--accent)", color: "#04120B",
  },
  ghost: {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: "pointer", background: "none",
    color: "var(--text-secondary)", border: `1px solid ${BORDE}`,
  },
  peligro: {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(239,68,68,.5)",
    background: "rgba(239,68,68,.12)", color: "var(--danger, #ef4444)",
  },
  banner: { fontSize: 14, borderRadius: 10, padding: "11px 14px", margin: "0 0 18px", lineHeight: 1.6 },
  bannerOk: { background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.35)", color: "var(--success, #22c55e)" },
  bannerErr: { background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.35)", color: "var(--danger, #ef4444)" },
  fondo: {
    position: "fixed", inset: 0, zIndex: 900, display: "grid", placeItems: "center",
    background: "rgba(2,6,4,.7)", padding: 20,
  },
  modal: {
    width: "min(520px, 100%)", maxHeight: "88vh", overflowY: "auto",
    background: "var(--bg-card)", border: `1px solid ${BORDE}`, borderRadius: 14,
    padding: "22px 24px", boxShadow: "0 20px 60px rgba(0,0,0,.5)",
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, margin: "14px 0 6px" },
  input: {
    width: "100%", padding: "10px 12px", borderRadius: 9, fontSize: 14,
    background: "var(--bg-main)", color: "var(--text-primary)", border: `1px solid ${BORDE}`,
  },
  textarea: {
    width: "100%", padding: "10px 12px", borderRadius: 9, fontSize: 14, resize: "vertical",
    background: "var(--bg-main)", color: "var(--text-primary)", border: `1px solid ${BORDE}`,
    fontFamily: "inherit",
  },
  checkFila: {
    display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.6,
    color: "var(--text-secondary)", margin: "14px 0 4px", cursor: "pointer",
  },
};
