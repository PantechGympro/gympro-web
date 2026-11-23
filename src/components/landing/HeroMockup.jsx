/**
 * HeroMockup.jsx — Vista previa viva del panel de GymPro para el hero.
 *
 * Reemplaza la tarjeta plana de barras que había antes. Es un mockup con
 * pestañas (Resumen / Check-ins / Ingresos) que rota solo y también se
 * puede manejar a mano, con profundidad real (sombra en capas + ligera
 * inclinación 3D) y entrada escalonada.
 *
 * Honestidad de los datos: son cifras ILUSTRATIVAS, no de ningún cliente.
 * Por eso el encabezado dice "Vista de ejemplo" y los check-ins van
 * anonimizados como "Socio #1042" -- GymPro es todavía un piloto con un
 * solo gimnasio real, inventar nombres de socios o métricas de clientes
 * sería mentir en la página pública (mismo criterio que ya aplica la
 * sección de gimnasios, que solo muestra datos reales de la BD).
 *
 * Decisiones de movimiento (skills `animate` / `apple-design`):
 *   - La rotación automática se detiene al pasar el cursor, al enfocar con
 *     teclado, cuando la sección sale de pantalla y con `prefers-reduced-
 *     motion` (un bucle lento es justo lo que esa preferencia evita).
 *   - El indicador de pestaña viaja con `layoutId`: una sola superficie que
 *     se mueve, no dos colores interpolándose por separado.
 *   - El contador de KPIs vive en un componente hoja (`KpiValor`) a
 *     propósito: `useCountUp` hace `setState` en cada frame, y aislarlo
 *     evita volver a renderizar todo el mockup 60 veces por segundo.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiTrendingUp, FiCheckCircle } from "react-icons/fi";
import useCountUp from "../../hooks/useCountUp";

const EASE_OUT = [0.23, 1, 0.32, 1];
const INTERVALO_ROTACION = 5200;

const PESTANAS = [
  { id: "resumen",  rotulo: "Resumen"   },
  { id: "checkins", rotulo: "Check-ins" },
  { id: "ingresos", rotulo: "Ingresos"  },
];

// Alturas relativas de la semana (lunes a domingo). El pico marcado como
// "fuerte" es el que el texto del hero sugiere: el negocio creciendo.
const BARRAS_SEMANA = [42, 66, 51, 80, 58, 95, 71];

const CHECKINS = [
  { id: "1042", hora: "07:42", estado: "Acceso validado", tono: "exito" },
  { id: "0871", hora: "07:55", estado: "Acceso validado", tono: "exito" },
  { id: "1190", hora: "08:03", estado: "Membresía por vencer", tono: "aviso" },
  { id: "0664", hora: "08:11", estado: "Acceso validado", tono: "exito" },
];

const INGRESOS = [
  { metodo: "Mercado Pago", porcentaje: 46 },
  { metodo: "PayPal",       porcentaje: 34 },
  { metodo: "Efectivo (POS)", porcentaje: 20 },
];

/**
 * Hoja aislada: aquí sí se re-renderiza en cada frame, y solo aquí.
 * `animar` en false hace que el número aparezca ya en su valor final --
 * es lo que evita que la cifra se vuelva a contar cada vez que la rotación
 * automática regresa a esta pestaña, que a los 15s de estar mirando se
 * siente un tic nervioso y no una demostración.
 */
function KpiValor({ hasta, activo, prefijo = "", duracion = 1300, animar = true }) {
  const valor = useCountUp(hasta, activo, { duration: animar ? duracion : 1 });
  return (
    <div className="gympro-display l-kpi-valor">
      {prefijo}{Math.round(valor).toLocaleString("es-MX")}
    </div>
  );
}

export default function HeroMockup({ visible, reducedMotion }) {
  const [pestana, setPestana] = useState("resumen");
  const [pausado, setPausado] = useState(false);
  // La cuenta ascendente es el gancho de la primera impresión: se juega una
  // sola vez por visita, no en cada vuelta del carrusel de pestañas.
  const [yaConto, setYaConto] = useState(false);

  useEffect(() => {
    if (!visible || yaConto) return undefined;
    const id = setTimeout(() => setYaConto(true), 1700);
    return () => clearTimeout(id);
  }, [visible, yaConto]);

  // Rotación automática: solo mientras el mockup está en pantalla, nadie lo
  // está usando y el visitante no pidió movimiento reducido.
  useEffect(() => {
    if (!visible || pausado || reducedMotion) return undefined;
    const id = setInterval(() => {
      setPestana((actual) => {
        const i = PESTANAS.findIndex((p) => p.id === actual);
        return PESTANAS[(i + 1) % PESTANAS.length].id;
      });
    }, INTERVALO_ROTACION);
    return () => clearInterval(id);
  }, [visible, pausado, reducedMotion]);

  // Variantes del cruce entre pestañas. Con movimiento reducido se queda
  // solo el fundido: se entiende igual qué cambió, sin desplazamiento.
  const variantes = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: "translateY(6px)" },
        animate: { opacity: 1, transform: "translateY(0px)" },
        exit:    { opacity: 0, transform: "translateY(-4px)" },
      };

  return (
    <div className="l-mock-wrap">
      <div
        className={`l-mock${visible ? " is-visible" : ""}`}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocusCapture={() => setPausado(true)}
        onBlurCapture={() => setPausado(false)}
      >
        <div className="l-mock-top">
          <div className="l-mock-ident">
            <div className="l-mock-avatar" aria-hidden="true">GP</div>
            <div>
              <div className="l-mock-titulo">Panel del gimnasio</div>
              <div className="l-mock-etiqueta">Vista de ejemplo</div>
            </div>
          </div>
          <span className="l-pastilla" data-tono="acento">En vivo</span>
        </div>

        <div className="l-mock-tabs" role="tablist" aria-label="Vista previa del panel">
          {PESTANAS.map((p) => {
            const activa = p.id === pestana;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activa}
                className="l-mock-tab"
                onClick={() => setPestana(p.id)}
              >
                {p.rotulo}
                {activa && (
                  <motion.span
                    layoutId="mock-tab-indicador"
                    className="l-mock-tab-indicador"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: "spring", duration: 0.4, bounce: 0 }
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="l-mock-cuerpo" role="tabpanel">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pestana}
              initial={variantes.initial}
              animate={variantes.animate}
              exit={variantes.exit}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              {pestana === "resumen" && (
                <>
                  <div className="l-kpis">
                    <div className="l-kpi">
                      <div className="l-kpi-label">Socios activos</div>
                      <KpiValor hasta={248} activo={visible} animar={!yaConto} />
                      <div className="l-kpi-delta">
                        <FiTrendingUp size={11} aria-hidden="true" /> +12 este mes
                      </div>
                    </div>
                    <div className="l-kpi">
                      <div className="l-kpi-label">Ingresos del mes</div>
                      <KpiValor hasta={52400} activo={visible} prefijo="$" duracion={1500} animar={!yaConto} />
                      <div className="l-kpi-delta">
                        <FiTrendingUp size={11} aria-hidden="true" /> +8.4%
                      </div>
                    </div>
                  </div>
                  <div className="l-barras" aria-hidden="true">
                    {BARRAS_SEMANA.map((h, i) => (
                      <div
                        key={i}
                        className={`l-barra${visible ? " is-visible" : ""}`}
                        data-fuerte={h > 85}
                        style={{ height: `${h}%`, transitionDelay: `${260 + i * 55}ms` }}
                      />
                    ))}
                  </div>
                  <p className="l-mock-nota">Asistencia de la semana, de lunes a domingo</p>
                </>
              )}

              {pestana === "checkins" && (
                <>
                  <div className="l-mock-filas">
                    {CHECKINS.map((c) => (
                      <div key={c.id} className="l-mock-fila">
                        <FiCheckCircle
                          size={14}
                          aria-hidden="true"
                          style={{ color: c.tono === "aviso" ? "var(--warning)" : "var(--success)", flexShrink: 0 }}
                        />
                        <span className="l-mock-fila-nombre">Socio #{c.id}</span>
                        <span className="l-pastilla" data-tono={c.tono === "aviso" ? "aviso" : undefined}>
                          {c.estado}
                        </span>
                        <span className="l-mock-fila-dato">{c.hora}</span>
                      </div>
                    ))}
                  </div>
                  <div className="l-mock-fila" style={{ marginTop: 9 }}>
                    <span className="l-mock-fila-nombre">Aforo ahora</span>
                    <span className={`l-medida${visible ? " is-visible" : ""}`}>
                      <i style={{ width: "64%", transitionDelay: "200ms" }} />
                    </span>
                    <span className="l-mock-fila-dato">64%</span>
                  </div>
                  <p className="l-mock-nota">Accesos validados contra la membresía vigente</p>
                </>
              )}

              {pestana === "ingresos" && (
                <>
                  <div className="l-kpis" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="l-kpi">
                      <div className="l-kpi-label">Cobrado este mes</div>
                      <KpiValor hasta={52400} activo={visible} prefijo="$" duracion={1500} animar={!yaConto} />
                      <div className="l-kpi-delta">
                        <FiTrendingUp size={11} aria-hidden="true" /> 97% de las membresías al corriente
                      </div>
                    </div>
                  </div>
                  <div className="l-mock-filas">
                    {INGRESOS.map((f, i) => (
                      <div key={f.metodo} className="l-mock-fila">
                        <span className="l-mock-fila-nombre" style={{ minWidth: 104 }}>{f.metodo}</span>
                        <span className={`l-medida${visible ? " is-visible" : ""}`}>
                          <i style={{ width: `${f.porcentaje}%`, transitionDelay: `${180 + i * 90}ms` }} />
                        </span>
                        <span className="l-mock-fila-dato">{f.porcentaje}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="l-mock-nota">Desglose por forma de pago</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
