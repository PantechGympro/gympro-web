/**
 * useWebPush.js — Suscripción del navegador a notificaciones Web Push.
 *
 * Hasta ahora el push solo llegaba a la app móvil (Expo, ver
 * mobile/services/push.ts). Quien solo usa la web -- propietario,
 * entrenador, recepción o un miembro que no instaló la app -- no recibía
 * push de nada (mensajes, citas, pagos por confirmar, vencimientos): solo
 * correo. Este hook cierra ese hueco para TODOS los roles por igual, por
 * eso vive aquí y se monta una sola vez en Layout.jsx (compartido por todo
 * el portal) en vez de dentro de una pantalla de un solo rol.
 *
 * Flujo:
 *   1. Registra public/sw.js (una vez, idempotente: el navegador reutiliza
 *      el registro si ya existe).
 *   2. Si el permiso del navegador ya es "granted" pero no hay suscripción
 *      vigente (o el backend no la tiene), se vuelve a suscribir en
 *      silencio -- cubre el caso de que el usuario limpiara datos del sitio.
 *   3. Si el permiso es "default" (nunca se le preguntó), NO se pide solo:
 *      los navegadores penalizan el permiso pedido sin que el usuario haya
 *      hecho un gesto explícito. Layout.jsx muestra un aviso discreto que
 *      llama a `solicitar()` cuando la persona decide activarlo.
 *   4. Si el permiso es "denied", no se hace nada (no se puede volver a
 *      preguntar desde JS; solo la persona puede cambiarlo en los ajustes
 *      del navegador).
 */
import { useCallback, useEffect, useState } from "react";
import {
  obtenerVapidPublicKey,
  suscribirWebPush,
  desuscribirWebPush,
} from "../api/notificaciones";

const SOPORTADO =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  typeof Notification !== "undefined";

// El navegador exige la applicationServerKey como Uint8Array, pero el
// backend la entrega en base64url (formato "raw" que espera pywebpush).
function base64UrlAUint8Array(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const salida = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) salida[i] = raw.charCodeAt(i);
  return salida;
}

export function useWebPush() {
  const [permiso, setPermiso] = useState(SOPORTADO ? Notification.permission : "unsupported");
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState("");

  // Re-sincroniza la suscripción si el permiso ya estaba concedido de una
  // sesión anterior (p. ej. el usuario activó notificaciones ayer y hoy
  // vuelve a entrar). Silencioso: no hay nada que mostrarle si falla aquí,
  // ya tiene el permiso del navegador concedido.
  useEffect(() => {
    if (!SOPORTADO || permiso !== "granted") return;
    (async () => {
      try {
        const registro = await navigator.serviceWorker.register("/sw.js");
        const existente = await registro.pushManager.getSubscription();
        if (existente) {
          await suscribirWebPush(existente.toJSON());
        }
      } catch {
        // Si falla la resincronización silenciosa, `solicitar()` lo
        // reintentará con el usuario viendo el resultado.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permiso]);

  const solicitar = useCallback(async () => {
    if (!SOPORTADO) {
      setError("Este navegador no soporta notificaciones push.");
      return false;
    }
    setActivando(true);
    setError("");
    try {
      const resultado = await Notification.requestPermission();
      setPermiso(resultado);
      if (resultado !== "granted") return false;

      const { publicKey } = await obtenerVapidPublicKey();
      const registro = await navigator.serviceWorker.register("/sw.js");
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlAUint8Array(publicKey),
      });
      await suscribirWebPush(suscripcion.toJSON());
      return true;
    } catch (e) {
      setError(
        e?.status === 503
          ? "El servidor no tiene configurado el push por navegador todavía."
          : "No se pudo activar la notificación. Intenta de nuevo."
      );
      return false;
    } finally {
      setActivando(false);
    }
  }, []);

  const desactivar = useCallback(async () => {
    if (!SOPORTADO) return;
    try {
      const registro = await navigator.serviceWorker.getRegistration("/sw.js");
      const suscripcion = await registro?.pushManager.getSubscription();
      if (suscripcion) {
        await desuscribirWebPush(suscripcion.endpoint);
        await suscripcion.unsubscribe();
      }
    } catch {
      // Best-effort: aunque falle el DELETE en el backend, el navegador ya
      // dejó de estar suscrito localmente si unsubscribe() corrió.
    }
  }, []);

  return { soportado: SOPORTADO, permiso, activando, error, solicitar, desactivar };
}
