import axios from "axios";

export const BASE_URL = "";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Interceptor para inyectar el token en cada petición
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET ahora acepta el parámetro search
// perPage: opcional -- se omite para las pantallas de roster paginado
// (MiembrosDashboard.jsx x2, que ya traen su propio control de pagina), y se
// pasa un numero alto desde una busqueda en vivo que necesita el padron
// completo de una sola vez (CobrarMembresia.jsx, PagosDashboard.jsx) -- ver
// el tope real en owner_gym/miembros.py::listar_miembros.
export const getMiembros = (page = 1, mostrarInactivos = false, search = "", perPage = null) =>
  API.get(`/miembros?page=${page}&inactivos=${mostrarInactivos}&search=${search}`
    + (perPage ? `&per_page=${perPage}` : ""));

export const createMiembro = (data) => API.post("/miembros", data);
export const updateMiembro = (id, data) => API.put(`/miembros/${id}`, data);
export const deleteMiembro = (id) => API.delete(`/miembros/${id}`);
export const reactivateMiembro = (id) => API.put(`/miembros/${id}/reactivar`);

/** Genera una contrasena nueva y reenvia el correo de bienvenida -- para
 *  cuando el original nunca llego (p. ej. a un correo @hotmail). */
export const reenviarCredencialesMiembro = (id) => API.post(`/miembros/${id}/reenviar-credenciales`);

/** Historial paginado de días asistidos al gimnasio por un miembro. */
export const getAsistenciasMiembro = (id, page = 1, perPage = 10) =>
  API.get(`/miembros/${id}/asistencias?page=${page}&per_page=${perPage}`);