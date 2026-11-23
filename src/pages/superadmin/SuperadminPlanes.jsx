import { useState, useEffect } from "react";
import { avisos, confirmar } from "../../utils/avisos";
import Modal from "../../components/ui/Modal";
import { TarjetasSkeleton } from "../../components/ui/Skeleton";
import { getPlanes, crearPlan, editarPlan, togglePlan } from "../../api/superadmin";
import FuncionesPorRol from "../../components/compartido/FuncionesPorRol";

const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:  { bg: "rgba(16,185,129,.15)", color: "var(--success)" },
    neg:  { bg: "rgba(239,68,68,.15)", color: "var(--danger)" },
    info: { bg: "var(--accent-dim)", color: "var(--accent-soft)" },
    warn: { bg: "rgba(234,179,8,.15)", color: "var(--warning)" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary") => {
  const v = {
    primary: { background: "var(--accent, var(--accent))", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary)" },
    danger:  { background: "rgba(239,68,68,.1)",     color: "var(--danger)" },
    success: { background: "rgba(16,185,129,.1)",    color: "var(--success)" },
  };
  return { border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary) };
};

const INPUT = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 12px",
  color: "var(--text-primary)",
  fontSize: 13,
  boxSizing: "border-box",
};

// Conversión de precio: el formulario captura pesos, la API espera centavos.
// Se aísla aquí para que ningún componente tenga que hacer la aritmética a mano.
const pesosACentavos = (pesos) => Math.round((Number(pesos) || 0) * 100);
const centavosAPesos = (centavos) => (Number(centavos) || 0) / 100;

// Un nombre de plan válido: letras, números, espacios y guiones, sin dejarlo vacío.
const NOMBRE_PLAN_RE = /^[\p{L}0-9][\p{L}0-9\s-]{1,49}$/u;

function PlanForm({ plan, planesExistentes = [], onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre:           plan?.nombre           || "",
    titulo_comercial: plan?.titulo_comercial || "",
    precio_pesos:     plan ? centavosAPesos(plan.precio_mensual_mxn) : 0,
    // SCRUM-224: vacío = null = se cobra 12x el mensual (ver billing._monto_para_ciclo).
    precio_anual_pesos: plan?.precio_anual_mxn != null ? centavosAPesos(plan.precio_anual_mxn) : "",
    descripcion:      plan?.descripcion      || "",
    max_miembros:     plan?.max_miembros     || null,
    // SCRUM-223: estos dos viven en el JSON `limites`, no como columna
    // propia (igual que max_miembros hace con su columna) -- ver
    // routes/superadmin/planes.py::_limites_desde_payload.
    max_staff:        plan?.limites?.max_staff      ?? null,
    max_sucursales:   plan?.limites?.max_sucursales ?? null,
    caracteristicas:  (plan?.caracteristicas || []).join("\n"),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return; // evita doble envío por doble clic

    const nombre = form.nombre.trim();
    if (!NOMBRE_PLAN_RE.test(nombre)) {
      avisos.advertencia("Nombre inválido", "Usa solo letras, números, espacios y guiones (2 a 50 caracteres).");
      return;
    }
    const duplicado = planesExistentes.some(
      p => p.id !== plan?.id && p.nombre.trim().toLowerCase() === nombre.toLowerCase()
    );
    if (duplicado) {
      avisos.advertencia("Ese nombre ya existe", `Ya hay un plan llamado "${nombre}". Elige otro para no confundirlos en la página de precios.`);
      return;
    }

    const payload = {
      nombre,
      titulo_comercial:   form.titulo_comercial.trim() || null,
      precio_mensual_mxn: pesosACentavos(form.precio_pesos),
      precio_anual_mxn:   form.precio_anual_pesos === "" ? null : pesosACentavos(form.precio_anual_pesos),
      descripcion:        form.descripcion,
      max_miembros:       form.max_miembros,
      max_staff:          form.max_staff,
      max_sucursales:     form.max_sucursales,
      caracteristicas:    form.caracteristicas.split("\n").map(s => s.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      if (plan?.id) await editarPlan(plan.id, payload);
      else          await crearPlan(payload);
      onSave();
    } catch (err) {
      const msg = err?.response?.data?.msg || "Error al guardar";
      avisos.error("No se pudo guardar el plan", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Nombre comercial del plan</label>
        <input style={INPUT} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Ej: Enterprise" maxLength={50} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Frase comercial (opcional)</label>
        <input style={INPUT} value={form.titulo_comercial} onChange={e => setForm(f => ({ ...f, titulo_comercial: e.target.value }))} placeholder="Ej: Ideal para gimnasios en crecimiento" maxLength={120} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Precio mensual (MXN)</label>
        <input style={INPUT} type="number" min={0} step="0.01" value={form.precio_pesos} onChange={e => setForm(f => ({ ...f, precio_pesos: e.target.value }))} required placeholder="1499.00" />
        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
          Se guardará como ${pesosACentavos(form.precio_pesos).toLocaleString("es-MX")} centavos internamente.
        </p>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Precio anual (MXN, opcional)</label>
        <input style={INPUT} type="number" min={0} step="0.01" value={form.precio_anual_pesos} onChange={e => setForm(f => ({ ...f, precio_anual_pesos: e.target.value }))} placeholder={`Ej: ${(Number(form.precio_pesos || 0) * 10).toFixed(2)} (2 meses gratis)`} />
        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
          Vacío = se cobra 12x el precio mensual sin descuento. La convención del equipo es fijarlo en 10x el mensual ("2 meses gratis").
        </p>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Descripción</label>
        <textarea
          style={{ ...INPUT, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          placeholder="Describe brevemente el plan"
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Beneficios incluidos (uno por línea)</label>
        <textarea
          style={{ ...INPUT, minHeight: 100, resize: "vertical", fontFamily: "inherit" }}
          value={form.caracteristicas}
          onChange={e => setForm(f => ({ ...f, caracteristicas: e.target.value }))}
          placeholder={"Gestión de miembros\nControl de pagos\nReportes básicos"}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Máximo de miembros por sucursal (vacío = ilimitado)</label>
        <input style={INPUT} type="number" min={1} value={form.max_miembros || ""} onChange={e => setForm(f => ({ ...f, max_miembros: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Ej: 200" />
        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
          Se aplica a CADA sucursal por separado -- una organización con varias sucursales multiplica su capacidad, no la reparte (ver utils/capacidad.py).
        </p>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Máximo de staff por sucursal (vacío = ilimitado)</label>
        <input style={INPUT} type="number" min={1} value={form.max_staff || ""} onChange={e => setForm(f => ({ ...f, max_staff: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Ej: 10" />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Máximo de sucursales por organización (vacío = ilimitado)</label>
        <input style={INPUT} type="number" min={1} value={form.max_sucursales || ""} onChange={e => setForm(f => ({ ...f, max_sucursales: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Ej: 5" />
        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
          Una organización contrata UN plan para todas sus sucursales (SCRUM-223) -- este es el tope de sucursales que ese plan cubre.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="u-presion" style={btnStyle("ghost")} onClick={onCancel} disabled={saving}>Cancelar</button>
        <button
          type="submit"
          className="u-presion u-btn-carga-host"
          style={{ ...btnStyle("primary"), opacity: saving ? .7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          disabled={saving}
          aria-busy={saving || undefined}
        >
          {/* La etiqueta se queda en su sitio y el spinner se superpone:
              el botón no cambia de ancho al pasar a "guardando". */}
          <span className="u-btn-etiqueta" data-cargando={saving}>
            {plan?.id ? "Guardar cambios" : "Crear plan"}
          </span>
          {saving && <span className="u-btn-spinner" />}
        </button>
      </div>
    </form>
  );
}

function PlanCard({ plan, planes, onEdit, onToggle }) {
  const precio = centavosAPesos(plan.precio_mensual_mxn).toLocaleString("es-MX", { minimumFractionDigits: 2 });
  const beneficios = plan.caracteristicas || [];
  return (
    <div style={{ ...card(), borderTop: `3px solid ${plan.activo ? "var(--accent, var(--accent))" : "rgba(100,116,139,.4)"}`, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{plan.nombre}</h3>
          {/* La frase comercial y la descripción se muestran cada una una sola vez */}
          {plan.titulo_comercial && (
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{plan.titulo_comercial}</p>
          )}
        </div>
        <span style={badge(plan.activo ? "pos" : "neg")}>{plan.activo ? "Activo" : "Inactivo"}</span>
      </div>

      <div>
        <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>${precio}</span>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 4 }}>MXN/mes</span>
        {plan.precio_anual_display != null && (
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            o {plan.precio_anual_display}
            {plan.ahorro_anual_pct > 0 && (
              <span style={{ ...badge("pos"), marginLeft: 6, fontSize: 10 }}>Ahorra {plan.ahorro_anual_pct}%</span>
            )}
          </p>
        )}
      </div>

      {plan.descripcion && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{plan.descripcion}</p>
      )}

      {plan.max_miembros && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Máx: {plan.max_miembros.toLocaleString()} miembros{plan.limites?.max_staff ? ` y ${plan.limites.max_staff} staff` : ""} por sucursal
        </p>
      )}
      {plan.limites?.max_sucursales && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Máx: {plan.limites.max_sucursales.toLocaleString()} sucursal{plan.limites.max_sucursales !== 1 ? "es" : ""} por organización
        </p>
      )}

      {beneficios.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {beneficios.map((b, i) => (
            <li key={i} style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "var(--success)" }}>✓</span> {b}
            </li>
          ))}
        </ul>
      )}

      <FuncionesPorRol plan={plan} planes={planes} />

      {plan.suscriptores_activos != null && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          {plan.suscriptores_activos} suscripciones activas
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button style={{ ...btnStyle("ghost"), flex: 1 }} onClick={() => onEdit(plan)}>Editar</button>
        <button style={{ ...btnStyle(plan.activo ? "danger" : "success"), flex: 1 }} onClick={() => onToggle(plan)}>
          {plan.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}

export default function SuperadminPlanes() {
  const [planes,   setPlanes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);   // plan en edición o {} para nuevo
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    getPlanes().then(r => setPlanes(r.data.planes || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (plan) => {
    const confirmado = await confirmar({
      titulo: `${plan.activo ? "Desactivar" : "Activar"} el plan "${plan.nombre}"`,
      mensaje: plan.activo
        ? "Los gimnasios que ya lo tienen conservan su acceso, pero no podrán renovarlo y dejará de ofrecerse a gimnasios nuevos."
        : "Volverá a aparecer en la página de precios y podrá contratarse.",
      confirmar: plan.activo ? "Desactivar" : "Activar",
      tono: plan.activo ? "peligro" : "neutro",
    });
    if (!confirmado) return;
    try {
      const r = await togglePlan(plan.id);
      if (r.data.advertencia) {
        // La advertencia del backend explica a cuántos gimnasios afecta:
        // merece quedarse en pantalla más tiempo que un "listo".
        avisos.advertencia("Plan desactivado", r.data.advertencia);
      } else {
        avisos.exito(plan.activo ? "Plan desactivado" : "Plan activado");
      }
      load();
    } catch (e) {
      avisos.error("No se pudo cambiar el plan", e?.response?.data?.msg || "Inténtalo de nuevo en un momento.");
    }
  };

  const handleEdit = (plan) => { setEditing(plan); setShowForm(true); };
  const handleNew  = ()     => { setEditing(null);  setShowForm(true); };
  const cerrarForm = () => { setShowForm(false); setEditing(null); };
  const handleSave = () => { cerrarForm(); load(); avisos.exito("Plan guardado"); };

  return (
    <div className="superadmin-page" style={{ minHeight: "100vh", background: "var(--bg-input)", fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Planes de Suscripción</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Gestiona los planes disponibles para los gimnasios</p>
        </div>
        <button className="u-presion" style={btnStyle("primary")} onClick={handleNew}>+ Nuevo Plan</button>
      </div>

      {/* Antes era un overlay hecho a mano: sin Escape, sin clic fuera, sin
          bloqueo de scroll del fondo y sin manejo de foco. El Modal
          compartido trae esas cuatro cosas y la entrada/salida animada. */}
      <Modal
        abierto={showForm}
        onCerrar={cerrarForm}
        titulo={editing?.id ? "Editar plan" : "Nuevo plan"}
        ancho={540}
        /* Un formulario a medio llenar no debe perderse por un clic
           distraído fuera del panel. */
        cerrarAlClicarFuera={false}
      >
        <PlanForm plan={editing} planesExistentes={planes} onSave={handleSave} onCancel={cerrarForm} />
      </Modal>

      {loading ? (
        <TarjetasSkeleton tarjetas={4} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {planes.map(plan => (
            <PlanCard key={plan.id} plan={plan} planes={planes} onEdit={handleEdit} onToggle={handleToggle} />
          ))}
          {planes.length === 0 && (
            <div className="u-vacio" style={{ gridColumn: "1/-1" }}>
              <strong>Todavía no hay planes configurados</strong>
              Crea el primero y aparecerá en la página pública de precios.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
