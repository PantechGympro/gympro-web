import { normalizarRol, ROUTE_FOR_ROLE } from "../constants/roles";

/** Panel de inicio según el rol (cualquier alias); el de Miembro si no se reconoce. */
export function rutaInicioPorRol(rol) {
  return ROUTE_FOR_ROLE[normalizarRol(rol).toLowerCase()] || "/user/dashboard";
}
