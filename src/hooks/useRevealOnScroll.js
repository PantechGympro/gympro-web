import { useEffect, useRef, useState } from "react";

/**
 * useRevealOnScroll -- true la primera vez que el elemento referenciado
 * entra en el viewport (IntersectionObserver, se desconecta tras el primer
 * disparo). Es el mismo mecanismo que Landing.jsx ya usaba a mano para
 * arrancar el carrusel de gimnasios solo cuando el visitante llega a esa
 * sección -- extraído aquí como hook para reutilizarlo en el resto de
 * secciones de la página comercial sin duplicar el observer en cada una.
 *
 * `threshold` bajo (0.15 por defecto) para que la animación empiece un
 * poco antes de que la sección quede 100% visible.
 */
export default function useRevealOnScroll(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}
