// utils/sesionAxios.js — renovación automática de sesión para TODAS las
// instancias de axios del portal.
//
// Los 15 módulos de src/api crean su propia instancia con axios.create() y
// ninguno maneja el 401. En vez de tocarlos uno por uno, este módulo envuelve
// axios.create (e instala el interceptor en el axios global) para que cada
// instancia, al recibir 401, renueve la sesión UNA vez y reintente la petición.
// Debe importarse antes que cualquier módulo de api (ver index.js).
//
// Los interceptores de petición de cada módulo vuelven a leer el token de
// localStorage en el reintento, así que viaja el token ya renovado.
import axios from "axios";
import { renovarSesion, limpiarSesionLocal } from "./sesion";

const esRutaDeAutenticacion = (url = "") => /\/auth\//.test(url);

export function instalarRenovacion(instancia) {
  instancia.interceptors.response.use(
    (respuesta) => respuesta,
    async (error) => {
      const config = error?.config;
      if (!config || error?.response?.status !== 401 || config.__reintentada || esRutaDeAutenticacion(config.url)) {
        throw error;
      }
      config.__reintentada = true;

      const resultado = await renovarSesion();
      if (resultado === "ok") return instancia.request(config);
      if (resultado === "expirada") {
        // Refresh vencido/revocado: sesión terminada. Se limpia ANTES de ir al
        // login para que las rutas públicas no rebote al panel con un token muerto.
        limpiarSesionLocal();
        window.location.replace("/login");
      }
      throw error;
    },
  );
  return instancia;
}

if (!axios.__renovacionInstalada) {
  const crearOriginal = axios.create.bind(axios);
  axios.create = (...args) => instalarRenovacion(crearOriginal(...args));
  instalarRenovacion(axios);
  axios.__renovacionInstalada = true;
}
