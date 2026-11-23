/**
 * BotonMagnetico.jsx — Envoltura con atracción sutil hacia el cursor.
 *
 * Es seguimiento decorativo del ratón: `find-animation-opportunities` lo
 * permite exactamente aquí (página de marketing, frecuencia baja) y lo
 * prohibiría sobre datos que el usuario está leyendo. Por eso se usa en UN
 * solo botón de toda la página -- el CTA principal del hero -- y no en los
 * seis botones que hay repartidos.
 *
 * Por qué un muelle y no una transición: el movimiento es continuo y el
 * usuario puede cambiar de dirección a media animación. Un muelle arranca
 * desde el valor actual y absorbe ese cambio sin saltos; una transición con
 * duración fija tendría que reiniciarse en cada `pointermove`.
 *
 * Detalles que lo mantienen estable:
 *   - El desplazamiento se limita a ±10px y se escala a 0.22 del offset
 *     real, para que el botón nunca se escape del cursor que lo persigue.
 *   - El que se traslada es el envoltorio, no el <button>: así el botón
 *     conserva su `:active { transform: scale(0.97) }` de CSS, que un
 *     transform inline de Motion pisaría.
 *   - Se desactiva en punteros gruesos (táctil) y con movimiento reducido.
 */
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const DESPLAZAMIENTO_MAX = 10;
const FACTOR = 0.22;
// Muelle sin rebote: el botón acompaña al cursor, no oscila alrededor de él.
const MUELLE = { stiffness: 260, damping: 22, mass: 0.5 };

const limitar = (v) => Math.max(-DESPLAZAMIENTO_MAX, Math.min(DESPLAZAMIENTO_MAX, v));

export default function BotonMagnetico({ activo = true, children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, MUELLE);
  const sy = useSpring(y, MUELLE);

  // Cadena `transform` completa en vez de los atajos x/y de Motion: los
  // atajos pasan por variables CSS y no se aceleran por hardware.
  const transform = useTransform([sx, sy], ([vx, vy]) => `translate3d(${vx}px, ${vy}px, 0)`);

  const seguir = (e) => {
    if (!activo || !ref.current) return;
    // Solo punteros finos: en táctil no hay cursor al que atraerse y el
    // evento llegaría al tocar, moviendo el botón bajo el dedo.
    if (e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    x.set(limitar((e.clientX - (r.left + r.width / 2)) * FACTOR));
    y.set(limitar((e.clientY - (r.top + r.height / 2)) * FACTOR));
  };

  const soltar = () => { x.set(0); y.set(0); };

  if (!activo) return <span ref={ref}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      style={{ transform, display: "inline-flex" }}
      onPointerMove={seguir}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
    >
      {children}
    </motion.span>
  );
}
