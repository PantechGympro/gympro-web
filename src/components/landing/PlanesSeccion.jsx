/**
 * PlanesSeccion.jsx — Catálogo comercial de planes.
 *
 * Todo sale de /api/publico/planes (tabla planes_suscripcion): precios,
 * características, plan destacado y el ciclo anual. Nunca hay precios
 * escritos a mano en el frontend -- si alguien cambia un precio desde el
 * panel de superadmin, esta sección lo refleja sola.
 *
 * Toggle Mensual/Anual: se apoya en `precio_anual_mxn` y `ahorro_anual_pct`,
 * que el backend ya calcula (SCRUM-224, migración 023). Por eso el toggle
 * NO se dibuja si ningún plan tiene precio anual: antes que inventar un
 * descuento en la página pública de un negocio real, se oculta el control.
 * Un plan suelto sin anual tampoco rompe nada -- se queda en su precio
 * mensual y lo dice.
 *
 * Legibilidad (el problema que tenía antes): las tarjetas listaban hasta 7
 * características y se volvían un muro. Ahora cada tarjeta muestra el
 * límite de socios -- que es el dato que de verdad decide la compra -- más
 * tres beneficios, y el desglose completo rol por rol vive en el panel
 * desplegable de FuncionesPorRol.
 */
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck } from "react-icons/fi";
import FuncionesPorRol from "../compartido/FuncionesPorRol";

const EASE_OUT = [0.23, 1, 0.32, 1];
const CARACTERISTICAS_VISIBLES = 3;

const pesos = (centavos) => `$${Math.round(centavos / 100).toLocaleString("es-MX")}`;

/** Línea de límite de socios: el dato más decisivo de cada plan. */
function limiteSocios(plan) {
  if (plan.max_miembros == null) return "Socios ilimitados";
  return `Hasta ${plan.max_miembros.toLocaleString("es-MX")} socios`;
}

function Precio({ plan, ciclo, reducedMotion }) {
  const gratis = !plan.precio_mensual_mxn;
  const anualDisponible = Boolean(plan.precio_anual_mxn);
  const mostrandoAnual = ciclo === "anual" && anualDisponible;

  let monto;
  let unidad = null;
  let pie = null;

  if (gratis) {
    monto = "Gratis";
    pie = "Sin tarjeta para empezar";
  } else if (mostrandoAnual) {
    monto = pesos(plan.precio_anual_mxn);
    unidad = "/año";
    const equivalenteMensual = pesos(plan.precio_anual_mxn / 12);
    pie = plan.ahorro_anual_pct
      ? `${equivalenteMensual}/mes · ahorras ${plan.ahorro_anual_pct}%`
      : `${equivalenteMensual}/mes`;
  } else {
    monto = pesos(plan.precio_mensual_mxn);
    unidad = "/mes";
    pie = ciclo === "anual" && !anualDisponible ? "Este plan solo se cobra por mes" : " ";
  }

  const variantes = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: "translateY(7px)" },
        animate: { opacity: 1, transform: "translateY(0px)" },
        exit:    { opacity: 0, transform: "translateY(-7px)" },
      };

  return (
    <>
      <div className="l-plan-precio">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={monto}
            className="gympro-display l-plan-precio-num"
            initial={variantes.initial}
            animate={variantes.animate}
            exit={variantes.exit}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            {monto}
          </motion.span>
        </AnimatePresence>
        {unidad && <span className="l-plan-precio-unidad">{unidad}</span>}
      </div>
      <div className="l-plan-precio-pie">{pie}</div>
    </>
  );
}

export default function PlanesSeccion({ planes, cargando, visible, ciclo, setCiclo, reducedMotion, onElegir }) {
  const hayAnual = planes.some((p) => Boolean(p.precio_anual_mxn));
  const ahorroMaximo = planes.reduce((max, p) => Math.max(max, p.ahorro_anual_pct || 0), 0);

  if (!cargando && planes.length === 0) {
    return (
      <div className="l-vacio">
        <strong>Los planes no están disponibles en este momento.</strong>
        Vuelve a intentarlo en unos minutos o escríbenos y te los pasamos directo.
      </div>
    );
  }

  return (
    <>
      {hayAnual && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="l-toggle" role="group" aria-label="Ciclo de cobro">
            {[
              { id: "mensual", rotulo: "Mensual" },
              { id: "anual",   rotulo: "Anual"   },
            ].map((opcion) => {
              const activo = ciclo === opcion.id;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  className="l-toggle-opcion"
                  aria-pressed={activo}
                  onClick={() => setCiclo(opcion.id)}
                >
                  {activo && (
                    <motion.span
                      layoutId="toggle-pastilla"
                      className="l-toggle-pastilla"
                      transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }}
                    />
                  )}
                  <span className="l-toggle-rotulo">
                    {opcion.rotulo}
                    {opcion.id === "anual" && ahorroMaximo > 0 && (
                      <span className="l-toggle-ahorro">−{ahorroMaximo}%</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="l-planes">
        {planes.map((p, i) => (
          <article
            key={p.id}
            className={`l-plan${visible ? " is-visible" : ""}`}
            data-destacado={p.destacado || undefined}
            style={{ transitionDelay: `${140 + i * 70}ms` }}
          >
            <header className="l-plan-encabezado">
              <h3 className="l-plan-nombre">{p.nombre}</h3>
              {p.destacado && <span className="l-plan-recomendado">Recomendado</span>}
            </header>
            <p className="l-plan-tagline">{p.titulo_comercial || p.descripcion}</p>

            <Precio plan={p} ciclo={ciclo} reducedMotion={reducedMotion} />

            {p.dias_prueba > 0 && (
              <span className="l-plan-prueba">{p.dias_prueba} días de prueba</span>
            )}

            <ul className="l-plan-lista">
              <li className="l-plan-item">
                <FiCheck size={13} aria-hidden="true" />
                <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{limiteSocios(p)}</strong>
              </li>
              {(p.caracteristicas || []).slice(0, CARACTERISTICAS_VISIBLES).map((c, idx) => (
                <li key={idx} className="l-plan-item">
                  <FiCheck size={13} aria-hidden="true" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>

            {/* Comparación detallada: panel flotante rol por rol, para no
                volver a llenar la tarjeta de viñetas. */}
            <FuncionesPorRol plan={p} planes={planes} rotuloAbrir="Ver todo lo que incluye" />

            <button
              type="button"
              className={`l-btn ${p.destacado ? "l-btn-primario" : "l-btn-secundario"}`}
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => onElegir(p)}
            >
              Elegir {p.nombre}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
