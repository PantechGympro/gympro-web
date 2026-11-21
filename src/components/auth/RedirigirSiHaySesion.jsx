import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import CargandoPagina from "../compartido/CargandoPagina";
import { peticion } from "../../api/cliente";
import { leerToken } from "../../utils/sesion";
import { rutaInicioPorRol } from "../../utils/rutaInicio";

/**
 * Envuelve las pantallas públicas de entrada ("/" y "/login"): si el navegador
 * aún tiene una sesión válida (o renovable con el refresh de 90 días) manda al
 * panel del rol en vez de mostrar el login. Es lo que hace que al reabrir la
 * web tras cerrarla NO haya que iniciar sesión otra vez.
 *
 * El rol sale de /api/auth/me (verificado por el servidor), nunca del
 * localStorage editable: así un rol desactualizado no provoca un bucle
 * login ⇄ panel. Si la verificación falla se muestra la pantalla pública.
 */
export default function RedirigirSiHaySesion({ children }) {
  // undefined = verificando · null = sin sesión (mostrar hijos) · string = destino
  const [destino, setDestino] = useState(() => (leerToken() ? undefined : null));

  useEffect(() => {
    if (destino !== undefined) return undefined;
    let vigente = true;
    peticion("/api/auth/me", { sinRedireccion: true })
      .then((d) => { if (vigente) setDestino(d?.role ? rutaInicioPorRol(d.role) : null); })
      .catch(() => { if (vigente) setDestino(null); });
    return () => { vigente = false; };
  }, [destino]);

  if (destino === undefined) return <CargandoPagina pantallaCompleta />;
  if (destino) return <Navigate to={destino} replace />;
  return children;
}
