import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

/**
 * BarraAnalisis — encabezado comun de toda pantalla con metricas calculadas:
 * cuando se calculo y un boton para recalcularlo ahora.
 *
 * Por que el texto importa tanto como el boton
 * --------------------------------------------
 * Sin la marca de tiempo, el personal no puede distinguir una cifra recien
 * calculada de una de hace seis horas, y termina tomando decisiones sobre
 * datos viejos sin saberlo. El boton solo sirve si uno sabe que hace falta
 * apretarlo.
 */

/** "hace un momento" / "hace 5 min" / "hace 2 h" — en lenguaje de todos los dias. */
function haceCuanto(fecha) {
  if (!fecha) return "sin calcular";
  const seg = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 1000));
  if (seg < 60)    return "hace un momento";
  const min = Math.floor(seg / 60);
  if (min < 60)    return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24)     return `hace ${hr} h`;
  const dias = Math.floor(hr / 24);
  return dias === 1 ? "hace un día" : `hace ${dias} días`;
}

export default function BarraAnalisis({
  ultimaActualizacion,
  actualizando,
  onActualizar,
  sinPermisoRecalcular = false,
  etiqueta = "Actualizar análisis",
}) {
  // El texto se recalcula solo cada 30 s: si no, "hace un momento" se quedaria
  // congelado ahi media hora porque nada vuelve a renderizar el componente.
  const [, forzarRender] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forzarRender((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-barra-analisis">
      <div className="p-barra-analisis-estado">
        <span className="p-barra-analisis-punto" data-fresco={!actualizando} />
        <span>
          {actualizando
            ? "Actualizando…"
            : `Actualizado ${haceCuanto(ultimaActualizacion)}`}
        </span>
        {sinPermisoRecalcular && (
          <span className="p-barra-analisis-nota">
            · Tu rol consulta el análisis, no lo recalcula
          </span>
        )}
      </div>

      <button
        type="button"
        className="u-btn u-btn-secundario u-btn-sm u-presion"
        onClick={() => onActualizar()}
        disabled={actualizando}
        aria-label={etiqueta}
      >
        <FiRefreshCw
          aria-hidden="true"
          className={actualizando ? "p-girando" : undefined}
        />
        {etiqueta}
      </button>
    </div>
  );
}
