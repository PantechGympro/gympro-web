/**
 * Boton.jsx — Botón con estado de carga que no cambia de ancho.
 *
 * El problema que resuelve: el patrón habitual era
 *   {cargando ? <span className="spinner" /> : "Ingresar al sistema"}
 * que reemplaza la etiqueta por el spinner y encoge el botón de ~180px a
 * ~40px en el momento exacto en que la persona acaba de hacer clic. Se
 * lee como si algo se hubiera roto, aunque el envío vaya perfecto.
 *
 * Aquí la etiqueta se queda en el flujo y solo baja a opacidad 0; el
 * spinner se superpone centrado. El ancho no se mueve.
 *
 * Además bloquea el doble clic (`disabled` mientras carga) y expone
 * `aria-busy` para que un lector de pantalla anuncie el estado.
 */
import { forwardRef } from "react";

const Boton = forwardRef(function Boton(
  { variante = "primario", tamano, cargando = false, disabled, children, className = "", type = "button", ...resto },
  ref
) {
  const clases = [
    "u-btn",
    `u-btn-${variante}`,
    tamano === "sm" ? "u-btn-sm" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      ref={ref}
      type={type}
      className={clases}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      <span className="u-btn-etiqueta" data-cargando={cargando}>{children}</span>
      {cargando && <span className="u-btn-spinner" />}
    </button>
  );
});

export default Boton;
