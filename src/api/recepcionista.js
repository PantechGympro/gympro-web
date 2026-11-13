import axios from "axios";

// Cliente centralizado del área de recepción: inyecta el token vigente en
// cada petición (en vez de recalcular headers manualmente en cada componente).
const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Tareas de recepción ──────────────────────────────────────────
export const getTasks    = (params = {}) => API.get("/recepcionista/tasks", { params });
export const createTask  = (data)        => API.post("/recepcionista/tasks", data);
export const updateTask  = (id, data)    => API.patch(`/recepcionista/tasks/${id}`, data);
export const deleteTask  = (id)          => API.delete(`/recepcionista/tasks/${id}`);

// ── HU-39: entregas pendientes (productos comprados desde la app) ────
// Rutas reales en ventas_bp (/api/ventas/...), no en /recepcionista: cualquier
// integrante del personal del gimnasio las usa, no solo recepción.
export const getPendientesEntrega = ()   => API.get("/ventas/pendientes-entrega");
export const marcarEntregada      = (id) => API.patch(`/ventas/${id}/entregar`);
