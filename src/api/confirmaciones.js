import axios from "axios";

// Bandeja "Pagos por confirmar": pagos manuales que el miembro declaró
// (efectivo / transferencia / TotalPass) y que Recepción, Administración o el
// Propietario verifican. Cliente propio para inyectar el token vigente.
const API = axios.create({ baseURL: "/api/confirmaciones-pago" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getPagosPendientes   = ()            => API.get("");
export const getResumenPendientes = ()            => API.get("/resumen");
export const confirmarVenta       = (id)          => API.post(`/ventas/${id}/confirmar`);
export const rechazarVenta        = (id, motivo)  => API.post(`/ventas/${id}/rechazar`, { motivo });
export const confirmarRenovacion  = (id)          => API.post(`/renovaciones/${id}/confirmar`);
export const rechazarRenovacion   = (id, motivo)  => API.post(`/renovaciones/${id}/rechazar`, { motivo });
