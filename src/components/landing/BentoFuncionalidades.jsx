/**
 * BentoFuncionalidades.jsx — Las 6 capacidades del sistema, en bento.
 *
 * Antes eran 6 tarjetas idénticas "icono arriba + título + párrafo" en una
 * rejilla uniforme: el patrón que se lee como plantilla a primera vista.
 * Aquí cada tarjeta ocupa un ancho distinto (4/2, 2/4, 3/3) y lleva su
 * propia micro-UI, así que ninguna es intercambiable con otra: la forma de
 * la tarjeta explica la función antes de leer el texto.
 *
 * Las micro-UI son ilustrativas (lo dice el subtítulo de la sección); el
 * único dato real de la página es el que viene de la BD -- gimnasios,
 * testimonios y planes.
 *
 * Movimiento: la tarjeta entra una vez al cruzar el viewport, escalonada
 * 70ms entre hermanas. Al hover se mueve UN solo elemento -- el icono --
 * en vez de las seis cosas a la vez; todo detrás de `(hover: hover)`.
 */
import {
  FiUsers, FiCreditCard, FiBarChart2, FiSmartphone, FiActivity, FiMapPin,
  FiArrowRight, FiFileText, FiCheck,
} from "react-icons/fi";

/** Cabecera común: icono + título + texto. La micro-UI es lo que cambia. */
function Encabezado({ icono, titulo, texto }) {
  return (
    <div className="l-bento-encabezado">
      <div className="l-bento-icono" aria-hidden="true">{icono}</div>
      <div>
        <h3 className="l-bento-titulo">{titulo}</h3>
        <p className="l-bento-texto">{texto}</p>
      </div>
    </div>
  );
}

const SOCIOS = [
  { ini: "A.M.", plan: "Mensual", estado: "Al corriente", tono: null },
  { ini: "J.R.", plan: "Anual",   estado: "Al corriente", tono: null },
  { ini: "L.C.", plan: "Mensual", estado: "Vence en 3 días", tono: "aviso" },
];

const SUCURSALES = [
  { nombre: "Sucursal Centro",  socios: 142 },
  { nombre: "Sucursal Norte",   socios: 86  },
  { nombre: "Sucursal Lerma",   socios: 64  },
];

export default function BentoFuncionalidades({ visible }) {
  // Una sola función para no repetir la clase y el retraso en cada tarjeta.
  const card = (clase, i) => ({
    className: `l-bento-card ${clase}${visible ? " is-visible" : ""}`,
    style: { transitionDelay: `${120 + i * 70}ms` },
  });

  return (
    <div className="l-bento">
      {/* A — Gestión de socios: una mini tabla, que es exactamente lo que
          el propietario ve todo el día. */}
      <article {...card("l-bento-a", 0)}>
        <Encabezado
          icono={<FiUsers />}
          titulo="Gestión de socios"
          texto="Altas, bajas, membresías y control de accesos en un solo lugar, con el estado de cada socio siempre a la vista."
        />
        <div className="l-micro">
          {SOCIOS.map((s) => (
            <div key={s.ini} className="l-micro-fila">
              <span className="l-micro-avatar" aria-hidden="true">{s.ini.replace(/\./g, "")}</span>
              <span style={{ fontWeight: 700 }}>{s.ini}</span>
              <span style={{ color: "var(--text-tertiary)" }}>{s.plan}</span>
              <span className="l-pastilla" data-tono={s.tono || undefined} style={{ marginLeft: "auto" }}>
                {s.estado}
              </span>
            </div>
          ))}
        </div>
      </article>

      {/* B — Pagos: las pasarelas que realmente integra el sistema. */}
      <article {...card("l-bento-b", 1)}>
        <Encabezado
          icono={<FiCreditCard />}
          titulo="Pagos y punto de venta"
          texto="Cobros en línea y venta en mostrador, conciliados solos."
        />
        <div className="l-micro">
          <div className="l-micro-chips">
            <span className="l-chip">Mercado Pago</span>
            <span className="l-chip">PayPal</span>
            <span className="l-chip">Efectivo</span>
          </div>
          <div className="l-micro-fila" style={{ marginTop: 2 }}>
            <FiCheck size={13} aria-hidden="true" style={{ color: "var(--success)", flexShrink: 0 }} />
            <span style={{ fontWeight: 700 }}>Cobro aprobado</span>
            <span className="l-mock-fila-dato">$499.00</span>
          </div>
        </div>
      </article>

      {/* C — IA: el valor del módulo es la predicción, así que eso es lo
          que se muestra, no un icono de gráfica. */}
      <article {...card("l-bento-c", 2)}>
        <Encabezado
          icono={<FiBarChart2 />}
          titulo="Reportes e IA"
          texto="Predicción de cancelaciones y tendencias del negocio."
        />
        <div className="l-micro">
          <div className="l-micro-fila">
            <span className="l-pastilla" data-tono="aviso">12 socios en riesgo</span>
          </div>
          <div className="l-micro-fila">
            <span style={{ color: "var(--text-tertiary)", minWidth: 58 }}>Retención</span>
            <span className={`l-medida${visible ? " is-visible" : ""}`}>
              <i style={{ width: "78%", transitionDelay: "420ms" }} />
            </span>
            <span className="l-mock-fila-dato">78%</span>
          </div>
        </div>
      </article>

      {/* D — App de socios: un teléfono de verdad al lado del texto. Es la
          única tarjeta con dos columnas, porque es la única cuya promesa
          es "esto se ve en otro dispositivo". */}
      <article {...card("l-bento-d", 3)}>
        <Encabezado
          icono={<FiSmartphone />}
          titulo="App para tus socios"
          texto="Tus socios reservan, pagan y siguen su progreso desde su propio teléfono, sin pasar por recepción."
        />
        <div className="l-bento-split">
          <div className="l-telefono" aria-hidden="true">
            <span className="l-telefono-muesca" />
            <div className="l-telefono-tarjeta">
              <strong>Hoy · Pierna</strong>
              <div style={{ color: "var(--text-tertiary)" }}>6 ejercicios · 45 min</div>
            </div>
            <div className="l-telefono-tarjeta" style={{ background: "var(--accent)", color: "var(--text-on-accent)", textAlign: "center", fontWeight: 800 }}>
              Check-in
            </div>
            <div className="l-telefono-tarjeta">
              <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>Progreso del mes</div>
              <span className={`l-medida${visible ? " is-visible" : ""}`} style={{ display: "block" }}>
                <i style={{ width: "72%", transitionDelay: "520ms" }} />
              </span>
            </div>
          </div>
          <div className="l-micro">
            <div className="l-micro-fila">
              <FiCheck size={13} aria-hidden="true" style={{ color: "var(--success)", flexShrink: 0 }} />
              <span>Reserva de clases y horarios</span>
            </div>
            <div className="l-micro-fila">
              <FiCheck size={13} aria-hidden="true" style={{ color: "var(--success)", flexShrink: 0 }} />
              <span>Pago de membresía desde el teléfono</span>
            </div>
            <div className="l-micro-fila">
              <FiCheck size={13} aria-hidden="true" style={{ color: "var(--success)", flexShrink: 0 }} />
              <span>Rutina del día y avance personal</span>
            </div>
            <div className="l-micro-fila">
              <FiCheck size={13} aria-hidden="true" style={{ color: "var(--success)", flexShrink: 0 }} />
              <span>Avisos de vencimiento y recordatorios</span>
            </div>
          </div>
        </div>
      </article>

      {/* E — Rutinas con IA: lo que importa es la transformación
          (documento que ya existe -> rutina cargada), no el icono. */}
      <article {...card("l-bento-e", 4)}>
        <Encabezado
          icono={<FiActivity />}
          titulo="Rutinas y nutrición con IA"
          texto="Importa las rutinas que ya tienes en PDF o Excel y genera planes asistidos por IA."
        />
        <div className="l-micro">
          <div className="l-micro-fila">
            <FiFileText size={14} aria-hidden="true" style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <span className="l-chip">rutina-hipertrofia.pdf</span>
            <FiArrowRight size={13} aria-hidden="true" style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <span className="l-chip" data-tono="acento">12 ejercicios</span>
          </div>
          <div className="l-micro-fila">
            <span style={{ color: "var(--text-tertiary)" }}>Plan de nutrición sugerido</span>
            <span className="l-pastilla" data-tono="acento" style={{ marginLeft: "auto" }}>IA</span>
          </div>
        </div>
      </article>

      {/* F — Multi-sucursal: varias sedes bajo una organización. */}
      <article {...card("l-bento-f", 5)}>
        <Encabezado
          icono={<FiMapPin />}
          titulo="Multi-sucursal"
          texto="Administra varias sedes bajo una sola organización, cada una con su propio equipo."
        />
        <div className="l-micro">
          {SUCURSALES.map((s) => (
            <div key={s.nombre} className="l-micro-fila">
              <span className="l-rol-panel-punto" aria-hidden="true" />
              <span style={{ fontWeight: 700 }}>{s.nombre}</span>
              <span className="l-mock-fila-dato">{s.socios} socios</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
