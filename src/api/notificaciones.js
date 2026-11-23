// src/api/notificaciones.js — historial de notificaciones in-app y Web Push.
//
// Contrato real (api/app/routes/compartido/notificaciones.py), compartido por
// TODOS los roles -- no es exclusivo del panel de Miembro:
//   GET    /api/notificaciones                  → { notificaciones, no_leidas }
//   PATCH  /api/notificaciones/leer-todas        → marca todas como leídas
//   PATCH  /api/notificaciones/<id>/leer         → marca una como leída
//   GET    /api/notificaciones/vapid-public-key  → { publicKey }
//   POST   /api/notificaciones/web-push/subscribe   (body: { subscription })
//   DELETE /api/notificaciones/web-push/subscribe   (body: { endpoint })
import { peticion } from "./cliente";

export const listarNotificaciones = (soloNoLeidas = false, limit = 30) =>
  peticion(`/api/notificaciones?solo_no_leidas=${soloNoLeidas}&limit=${limit}`);

export const marcarLeida = (id) =>
  peticion(`/api/notificaciones/${id}/leer`, { method: "PATCH" });

export const marcarTodasLeidas = () =>
  peticion("/api/notificaciones/leer-todas", { method: "PATCH" });

export const obtenerVapidPublicKey = () =>
  peticion("/api/notificaciones/vapid-public-key");

export const suscribirWebPush = (subscription) =>
  peticion("/api/notificaciones/web-push/subscribe", {
    method: "POST",
    body: JSON.stringify({ subscription }),
  });

export const desuscribirWebPush = (endpoint) =>
  peticion("/api/notificaciones/web-push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
