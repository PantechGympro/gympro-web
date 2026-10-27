import { useEffect, useRef, useState } from "react";

/**
 * useCountUp -- anima un número desde `from` hasta `to` con easing ease-out
 * (cúbico, sin dependencias) cuando `activo` pasa a true. Pensado para las
 * cifras de ejemplo del panel de vista previa en el hero de Landing.jsx
 * ("248 socios activos", etc.): es una animación rara, de una sola vez, en
 * una página de marketing -- un bucle con requestAnimationFrame (en vez de
 * una transición CSS) es apropiado para este caso puntual.
 *
 * No arranca mientras `activo` sea false, y no se reinicia si ya corrió
 * una vez (evita recontar si el componente se vuelve a renderizar).
 */
export default function useCountUp(to, activo, { duration = 1400, from = 0 } = {}) {
  const [valor, setValor] = useState(from);
  const yaCorrioRef = useRef(false);

  useEffect(() => {
    if (!activo || yaCorrioRef.current) return undefined;
    yaCorrioRef.current = true;

    let frameId;
    const inicio = performance.now();

    const tick = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duration);
      // Ease-out cúbico: arranca rápido, se asienta suave -- mismo criterio
      // que el resto de la página usa para elementos que entran a pantalla.
      const avance = 1 - Math.pow(1 - t, 3);
      setValor(from + (to - from) * avance);
      if (t < 1) frameId = requestAnimationFrame(tick);
      else setValor(to);
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [activo, to, from, duration]);

  return valor;
}
