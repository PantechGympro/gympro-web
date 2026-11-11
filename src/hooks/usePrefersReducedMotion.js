import { useState, useEffect } from "react";

/**
 * usePrefersReducedMotion -- true cuando el visitante tiene activado
 * "reducir movimiento" a nivel de sistema/navegador (accesibilidad, no una
 * preferencia propia de GymPro). Mismo patrón que useIsMobile.js: matchMedia
 * + listener de "change", nunca un solo chequeo congelado al montar.
 *
 * Se usa en Landing.jsx para apagar el carrusel de gimnasios en movimiento
 * continuo (sin propósito funcional más allá de lo decorativo) y acortar
 * las animaciones de entrada con desplazamiento -- conservando los
 * fundidos de opacidad, que sí ayudan a entender qué cambió en pantalla.
 */
export default function usePrefersReducedMotion() {
  const [reducido, setReducido] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReducido(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reducido;
}
