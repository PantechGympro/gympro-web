/**
 * CargandoPagina — lo que se ve mientras se descarga el archivo de una
 * pantalla cargada bajo demanda (ver lazy() en App.jsx).
 *
 * Es deliberadamente discreto: en una conexión normal dura décimas de
 * segundo, así que un indicador grande parpadearía. `role="status"` +
 * `aria-live` hacen que un lector de pantalla anuncie la espera sin
 * interrumpir, y la animación se apaga sola con prefers-reduced-motion
 * (regla global en CSSUnificado.css).
 */
export default function CargandoPagina({ pantallaCompleta = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        minHeight: pantallaCompleta ? "100vh" : "40vh",
        color: "var(--text-secondary, #94a3b8)", fontSize: 14,
        background: pantallaCompleta ? "var(--bg-main, #080A10)" : "transparent",
      }}
    >
      <span className="spinner" aria-hidden="true" />
      Cargando…
    </div>
  );
}
