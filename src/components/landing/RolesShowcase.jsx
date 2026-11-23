/**
 * RolesShowcase.jsx — "Un panel para cada persona de tu equipo".
 *
 * Antes los 5 roles se apilaban en una columna y la mitad derecha de la
 * sección quedaba en blanco. Ahora es un showcase de dos columnas: la
 * izquierda selecciona el rol, la derecha muestra una vista previa de lo
 * que esa persona ve realmente al entrar al sistema. El espacio vacío
 * desaparece porque ahora hace un trabajo.
 *
 * El contenido de cada vista previa corresponde a los permisos reales del
 * rol en GymPro (ver api/app/constants/catalogo_funciones.py): el
 * Propietario ve todas las sucursales, el Entrenador solo a sus clientes,
 * el Miembro solo lo suyo. No es decorado: si mañana cambia el alcance de
 * un rol, esta sección es la que hay que actualizar.
 *
 * Accesibilidad: es un `tablist` vertical de verdad -- flechas arriba/abajo
 * mueven la selección y el foco, Home/End saltan a los extremos, y el
 * panel derecho está asociado con `aria-controls`/`aria-labelledby`.
 *
 * Movimiento: el resaltado de la fila activa viaja con `layoutId` (una
 * superficie que se mueve, no cinco que se encienden y apagan) y el panel
 * derecho cruza con un fundido corto. Con `prefers-reduced-motion` ambos
 * se quedan en fundido puro, sin desplazamiento.
 */
import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiBriefcase, FiUserCheck, FiActivity, FiHeadphones, FiCreditCard, FiCheck,
} from "react-icons/fi";

const EASE_OUT = [0.23, 1, 0.32, 1];

/** Fila de la vista previa: etiqueta + contenido, en el mismo vocabulario
 *  visual que el mockup del hero (cohesión, no un estilo por sección). */
function Fila({ etiqueta, children }) {
  return (
    <div className="l-mock-fila">
      <span className="l-mock-fila-nombre" style={{ minWidth: 112 }}>{etiqueta}</span>
      {children}
    </div>
  );
}

function Barra({ porcentaje, visible, retraso = 0 }) {
  return (
    <>
      <span className={`l-medida${visible ? " is-visible" : ""}`}>
        <i style={{ width: `${porcentaje}%`, transitionDelay: `${retraso}ms` }} />
      </span>
      <span className="l-mock-fila-dato">{porcentaje}%</span>
    </>
  );
}

const ROLES = [
  {
    id: "propietario",
    nombre: "Propietario",
    icono: <FiBriefcase />,
    texto: "Ve todo el negocio: miembros, pagos, reportes, IA y la configuración de todas sus sucursales.",
    contexto: "Todas las sucursales",
    vista: (visible) => (
      <>
        <Fila etiqueta="Ingresos del mes"><span className="l-mock-fila-dato">$128,400</span></Fila>
        <Fila etiqueta="Sucursal Centro"><Barra porcentaje={82} visible={visible} retraso={120} /></Fila>
        <Fila etiqueta="Sucursal Norte"><Barra porcentaje={61} visible={visible} retraso={200} /></Fila>
        <Fila etiqueta="Socios en riesgo">
          <span className="l-pastilla" data-tono="aviso" style={{ marginLeft: "auto" }}>12 detectados por IA</span>
        </Fila>
        <Fila etiqueta="Equipo activo"><span className="l-mock-fila-dato">9 personas</span></Fila>
      </>
    ),
  },
  {
    id: "administrador",
    nombre: "Administrador",
    icono: <FiUserCheck />,
    texto: "Gestiona el día a día de una sucursal con los mismos permisos operativos que el Propietario.",
    contexto: "Sucursal Centro",
    vista: (visible) => (
      <>
        <Fila etiqueta="Membresías por vencer">
          <span className="l-pastilla" data-tono="aviso" style={{ marginLeft: "auto" }}>7 esta semana</span>
        </Fila>
        <Fila etiqueta="Pagos por confirmar">
          <span className="l-pastilla" data-tono="acento" style={{ marginLeft: "auto" }}>3 pendientes</span>
        </Fila>
        <Fila etiqueta="Ocupación de hoy"><Barra porcentaje={64} visible={visible} retraso={140} /></Fila>
        <Fila etiqueta="Altas del mes"><span className="l-mock-fila-dato">+18 socios</span></Fila>
        <Fila etiqueta="Personal en turno"><span className="l-mock-fila-dato">4 de 5</span></Fila>
      </>
    ),
  },
  {
    id: "entrenador",
    nombre: "Entrenador",
    icono: <FiActivity />,
    texto: "Da seguimiento a sus clientes: rutinas, dietas, reportes de desempeño y mensajes.",
    contexto: "Solo sus clientes asignados",
    vista: (visible) => (
      <>
        <Fila etiqueta="Clientes asignados"><span className="l-mock-fila-dato">14</span></Fila>
        <Fila etiqueta="Rutina de hoy">
          <span className="l-chip" style={{ marginLeft: "auto" }}>Pierna · 6 ejercicios</span>
        </Fila>
        <Fila etiqueta="Adherencia del grupo"><Barra porcentaje={76} visible={visible} retraso={140} /></Fila>
        <Fila etiqueta="Planes de nutrición">
          <span className="l-pastilla" data-tono="acento" style={{ marginLeft: "auto" }}>2 generados con IA</span>
        </Fila>
        <Fila etiqueta="Mensajes sin leer"><span className="l-mock-fila-dato">3</span></Fila>
      </>
    ),
  },
  {
    id: "recepcionista",
    nombre: "Recepcionista",
    icono: <FiHeadphones />,
    texto: "Atiende el mostrador: check-ins, punto de venta, citas y cobros del día a día.",
    contexto: "Mostrador · turno matutino",
    vista: (visible) => (
      <>
        <Fila etiqueta="Check-ins de hoy"><span className="l-mock-fila-dato">96</span></Fila>
        <Fila etiqueta="Último acceso">
          <span className="l-pastilla" style={{ marginLeft: "auto" }}>Socio #1042 validado</span>
        </Fila>
        <Fila etiqueta="Venta en mostrador"><span className="l-mock-fila-dato">$2,180</span></Fila>
        <Fila etiqueta="Citas agendadas"><span className="l-mock-fila-dato">5 hoy</span></Fila>
        <Fila etiqueta="Meta del turno"><Barra porcentaje={58} visible={visible} retraso={160} /></Fila>
      </>
    ),
  },
  {
    id: "miembro",
    nombre: "Miembro",
    icono: <FiCreditCard />,
    texto: "Reserva, paga su membresía y sigue su propio progreso desde la app o la web.",
    contexto: "Su cuenta, nada más",
    vista: (visible) => (
      <>
        <Fila etiqueta="Mi membresía">
          <span className="l-pastilla" style={{ marginLeft: "auto" }}>Activa hasta el 14/12</span>
        </Fila>
        <Fila etiqueta="Rutina de hoy">
          <span className="l-chip" style={{ marginLeft: "auto" }}>Pierna · 45 min</span>
        </Fila>
        <Fila etiqueta="Progreso del mes"><Barra porcentaje={72} visible={visible} retraso={140} /></Fila>
        <Fila etiqueta="Próxima clase"><span className="l-mock-fila-dato">Spinning · 19:00</span></Fila>
        <Fila etiqueta="Asistencias"><span className="l-mock-fila-dato">12 este mes</span></Fila>
      </>
    ),
  },
];

export default function RolesShowcase({ visible, reducedMotion }) {
  const [activo, setActivo] = useState(ROLES[0].id);
  const refsBotones = useRef([]);
  const baseId = useId();

  const indiceActivo = ROLES.findIndex((r) => r.id === activo);
  const rol = ROLES[indiceActivo] || ROLES[0];

  /** Navegación por teclado del tablist vertical. */
  const onKeyDown = (e) => {
    const ultimos = ROLES.length - 1;
    let destino = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") destino = indiceActivo === ultimos ? 0 : indiceActivo + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") destino = indiceActivo === 0 ? ultimos : indiceActivo - 1;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = ultimos;
    if (destino === null) return;
    e.preventDefault();
    setActivo(ROLES[destino].id);
    refsBotones.current[destino]?.focus();
  };

  const variantes = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: "translateY(8px)" },
        animate: { opacity: 1, transform: "translateY(0px)" },
        exit:    { opacity: 0, transform: "translateY(-6px)" },
      };

  return (
    <div className="l-roles">
      <div
        className="l-roles-lista"
        role="tablist"
        aria-orientation="vertical"
        aria-label="Roles del equipo"
        onKeyDown={onKeyDown}
      >
        {ROLES.map((r, i) => {
          const seleccionado = r.id === activo;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${r.id}`}
              aria-selected={seleccionado}
              aria-controls={`${baseId}-panel`}
              tabIndex={seleccionado ? 0 : -1}
              ref={(el) => { refsBotones.current[i] = el; }}
              className="l-rol-fila"
              onClick={() => setActivo(r.id)}
              /* Apple §1: la respuesta ocurre al presionar, no al soltar.
                 En puntero fino, pasar el cursor ya cambia la vista previa
                 -- explorar los 5 roles no debería costar 5 clics. */
              onMouseEnter={() => setActivo(r.id)}
            >
              {seleccionado && (
                <motion.span
                  layoutId="rol-resalte"
                  className="l-rol-resalte"
                  transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }}
                />
              )}
              <span className="l-rol-contenido">
                <span className="gympro-display l-rol-indice" aria-hidden="true">{i + 1}</span>
                <span className="l-rol-icono" aria-hidden="true">{r.icono}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="l-rol-nombre" style={{ display: "block" }}>{r.nombre}</span>
                  <span className="l-rol-texto" style={{ display: "block" }}>{r.texto}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="l-rol-panel"
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${rol.id}`}
      >
        <div className="l-rol-panel-top">
          <span className="l-rol-panel-punto" aria-hidden="true" />
          <span className="l-rol-panel-titulo">Lo que ve {rol.nombre}</span>
          <span className="l-rol-panel-sub">{rol.contexto}</span>
        </div>
        <div className="l-rol-panel-cuerpo">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={rol.id}
              initial={variantes.initial}
              animate={variantes.animate}
              exit={variantes.exit}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              style={{ display: "flex", flexDirection: "column", gap: 9 }}
            >
              {rol.vista(visible)}
            </motion.div>
          </AnimatePresence>
          <p className="l-mock-nota" style={{ marginTop: 4 }}>
            <FiCheck size={11} aria-hidden="true" style={{ verticalAlign: "-1px", marginRight: 4 }} />
            Vista de ejemplo: el alcance mostrado es el que GymPro aplica de verdad a ese rol.
          </p>
        </div>
      </div>
    </div>
  );
}
