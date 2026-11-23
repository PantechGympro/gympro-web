/**
 * public/sw.js — Service Worker minimo para Web Push (navegador de escritorio
 * y móvil SIN la app instalada).
 *
 * No intercepta fetch ni cachea nada (no es un service worker "offline-first",
 * sería un cambio de alcance mucho mayor para este proyecto): su única
 * responsabilidad es recibir el evento `push` que manda el navegador cuando
 * llega una notificación Web Push (ver app/utils/web_push.py en la API) y
 * mostrarla con `showNotification`, y reaccionar a que el usuario le dé clic.
 *
 * Se registra una sola vez desde src/hooks/useWebPush.js, para TODOS los
 * roles (propietario, entrenador, recepción, miembro) -- cualquiera que use
 * solo la web, sin la app móvil instalada, debe poder recibir avisos de
 * mensajes, citas, pagos por confirmar, etc. sin depender del correo.
 */

self.addEventListener("install", () => {
  // activa la version nueva de inmediato, sin esperar a que se cierren
  // las demas pestanas abiertas con la version anterior.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "GymPro", body: "Tienes una notificación nueva.", data: {} };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Payload no era JSON (no debería pasar: lo manda app/utils/web_push.py
    // siempre como JSON) -- se muestra el aviso generico en vez de fallar.
  }

  const opciones = {
    body: payload.body,
    icon: "/logo192.png",
    badge: "/logo64.png",
    data: payload.data || {},
    tag: payload.data?.referencia_id || undefined, // agrupa avisos repetidos de la misma cita/pago
  };

  event.waitUntil(self.registration.showNotification(payload.title, opciones));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Ruta destino segun el tipo de aviso -- igual de utilidad que simplemente
  // enfocar la pestana ya abierta (la mayoria de sesiones de escritorio ya
  // tienen GymPro abierto en alguna pestana).
  const tipo = event.notification.data?.tipo || "";
  let ruta = "/";
  if (tipo.startsWith("cita")) ruta = "/panel"; // Mis Citas / Agenda (cada rol resuelve su propio panel al entrar)
  else if (tipo.includes("mensaje")) ruta = "/panel";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ("focus" in cliente) return cliente.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(ruta);
    })
  );
});
