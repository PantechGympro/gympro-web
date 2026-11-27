import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAnalisisActualizable — refresco manual + automatico para cualquier
 * pantalla que muestre metricas calculadas.
 *
 * Por que existe
 * --------------
 * Cada analitica resolvia el refresco a su manera: unas traian boton, otras
 * no, y ninguna se actualizaba sola. El personal operativo terminaba viendo
 * cifras de hace horas sin saberlo. Este hook centraliza las dos cosas que
 * toda metrica necesita: poder actualizarla a mano y que se actualice sola.
 *
 * Dos tipos de analitica
 * ----------------------
 * - Las que se calculan al leer (mapa de calor, RFM, fuerza): basta volver a
 *   pedirlas, y por eso `recalcular` es opcional.
 * - Las que guardan su resultado en cache y se recalculan con un POST /train
 *   (k-means, regresion, finanzas, cancelaciones): ahi volver a leer no trae
 *   nada nuevo, hay que pedir el recalculo.
 *
 * Permisos
 * --------
 * No todos los roles pueden recalcular: /cancelaciones/train, por ejemplo,
 * esta restringido a la direccion del gimnasio (auditoria OWASP A01). En vez
 * de duplicar aqui esa matriz de roles —que se desincronizaria del backend en
 * cuanto cambie— se intenta el recalculo y, si el servidor responde 403, se
 * cae a una lectura simple. El backend sigue siendo la unica fuente de verdad
 * sobre quien puede que cosa.
 *
 * @param {Object}   opciones
 * @param {Function} opciones.cargar      Lectura de los datos. Obligatoria.
 * @param {Function} [opciones.recalcular] Dispara el recalculo (POST /train).
 * @param {number}   [opciones.intervaloMs=3600000] Cada cuanto se refresca solo.
 * @param {boolean}  [opciones.activo=true] Permite apagarlo (p. ej. si la
 *                   pestana todavia no tiene datos que refrescar).
 */
export default function useAnalisisActualizable({
  cargar,
  recalcular = null,
  intervaloMs = 60 * 60 * 1000,
  activo = true,
}) {
  const [actualizando, setActualizando]           = useState(false);
  const [ultimaActualizacion, setUltima]          = useState(null);
  const [sinPermisoRecalcular, setSinPermiso]     = useState(false);

  // Las funciones se guardan en refs para que el temporizador no se reinicie
  // cada vez que el componente vuelve a renderizar: si dependiera de ellas
  // directamente, una funcion recreada en cada render reiniciaria el intervalo
  // sin parar y el refresco automatico no llegaria nunca a dispararse.
  const refCargar     = useRef(cargar);
  const refRecalcular = useRef(recalcular);
  useEffect(() => { refCargar.current = cargar; }, [cargar]);
  useEffect(() => { refRecalcular.current = recalcular; }, [recalcular]);

  // Evita que dos refrescos se encimen (el del boton y el del temporizador).
  const enCurso = useRef(false);

  /**
   * @param {Object}  opciones
   * @param {boolean} [opciones.forzarRecalculo=true] El refresco automatico
   *        tambien recalcula: volver a leer un resultado cacheado cada hora no
   *        traeria nada nuevo, que es justo lo que se quiere evitar.
   */
  const actualizar = useCallback(async ({ forzarRecalculo = true } = {}) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setActualizando(true);
    try {
      if (forzarRecalculo && refRecalcular.current) {
        try {
          await refRecalcular.current();
          setSinPermiso(false);
        } catch (e) {
          // 403: el rol puede leer la analitica pero no recalcularla. No es un
          // error que deba interrumpir nada -- se muestra el ultimo calculo
          // disponible y se marca para que la interfaz lo explique.
          const estado = e?.status ?? e?.response?.status;
          if (estado === 403) setSinPermiso(true);
          else throw e;
        }
      }
      await refCargar.current();
      setUltima(new Date());
    } finally {
      enCurso.current = false;
      setActualizando(false);
    }
  }, []);

  // Refresco automatico cada hora.
  useEffect(() => {
    if (!activo) return undefined;

    const id = setInterval(() => {
      // Con la pestana en segundo plano no se refresca: seria trabajo de
      // servidor (y de Spark) para una pantalla que nadie esta mirando. Al
      // volver se comprueba si quedo vieja, mas abajo.
      if (document.visibilityState === "visible") actualizar();
    }, intervaloMs);

    const alVolver = () => {
      if (document.visibilityState !== "visible") return;
      const vencido = !ultimaActualizacion ||
        Date.now() - ultimaActualizacion.getTime() >= intervaloMs;
      if (vencido) actualizar();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [activo, intervaloMs, actualizar, ultimaActualizacion]);

  /**
   * La hora del primer calculo. Cada pantalla trae su propio useEffect que
   * pide los datos al montarse, asi que ese momento ES el primer calculo: sin
   * esto la barra se queda en "sin calcular" hasta que alguien aprieta el
   * boton, que es justo lo contrario de lo que se quiere comunicar.
   */
  useEffect(() => { setUltima(new Date()); }, []);

  /** Permite re-sellar la hora a mano si la pantalla recarga por su cuenta. */
  const marcarCargaInicial = useCallback(() => setUltima(new Date()), []);

  return {
    actualizando,
    ultimaActualizacion,
    sinPermisoRecalcular,
    actualizar,
    marcarCargaInicial,
  };
}
