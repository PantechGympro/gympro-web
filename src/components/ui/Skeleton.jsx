/**
 * Skeleton.jsx — Esqueletos de carga con la forma del contenido real.
 *
 * Por qué esqueletos y no un spinner centrado: el spinner no dice nada
 * sobre lo que viene y, cuando llegan los datos, el layout salta de un
 * bloque vacío a una tabla completa. El esqueleto reserva el espacio
 * exacto, así que la llegada de los datos no mueve nada de sitio.
 *
 * Son decorativos: van marcados `aria-hidden` y la región que los
 * contiene debe anunciar el estado con `aria-busy`.
 */

export function Linea({ ancho = "100%", alto = 11, style }) {
  return <span className="u-skeleton" style={{ display: "block", width: ancho, height: alto, ...style }} />;
}

/** Filas de tabla/listado. `columnas` son los anchos relativos de cada celda. */
export function FilasSkeleton({ filas = 5, columnas = ["34%", "22%", "18%", "12%"] }) {
  return (
    <div className="u-skeleton-tabla" aria-hidden="true">
      {Array.from({ length: filas }).map((_, i) => (
        <div className="u-skeleton-fila" key={i}>
          {columnas.map((ancho, j) => (
            <Linea key={j} ancho={ancho} alto={j === 0 ? 13 : 10} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Rejilla de tarjetas de métrica (dashboards). */
export function TarjetasSkeleton({ tarjetas = 4 }) {
  return (
    <div className="u-skeleton-tarjetas" aria-hidden="true">
      {Array.from({ length: tarjetas }).map((_, i) => (
        <div className="u-skeleton-tarjeta" key={i}>
          <Linea ancho="52%" alto={10} />
          <Linea ancho="68%" alto={24} />
          <Linea ancho="40%" alto={9} />
        </div>
      ))}
    </div>
  );
}

const Skeleton = { Linea, FilasSkeleton, TarjetasSkeleton };
export default Skeleton;
