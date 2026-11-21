import { instalarRenovacion } from "./sesionAxios";
import { renovarSesion, limpiarSesionLocal } from "./sesion";

// Axios es ESM y el Jest de CRA no lo resuelve: se sustituye por un doble mínimo.
jest.mock("axios", () => ({ __esModule: true, default: { create: jest.fn(), interceptors: { response: { use: jest.fn() } } } }), { virtual: true });
jest.mock("./sesion", () => ({ renovarSesion: jest.fn(), limpiarSesionLocal: jest.fn() }));

let manejador;
let instancia;
beforeEach(() => {
  instancia = { request: jest.fn(), interceptors: { response: { use: (_ok, ko) => { manejador = ko; } } } };
  instalarRenovacion(instancia);
  delete window.location;
  window.location = { replace: jest.fn() };
});

const error401 = (extra = {}) => ({ response: { status: 401 }, config: { url: "/owner_gym/alertas" }, ...extra });

test("un 401 renueva y reintenta la misma petición una vez", async () => {
  renovarSesion.mockResolvedValue("ok");
  instancia.request.mockResolvedValue({ data: "ok" });
  const err = error401();
  await expect(manejador(err)).resolves.toEqual({ data: "ok" });
  expect(instancia.request).toHaveBeenCalledWith(expect.objectContaining({ url: "/owner_gym/alertas", __reintentada: true }));
});

test("no reintenta dos veces la misma petición", async () => {
  await expect(manejador(error401({ config: { url: "/x", __reintentada: true } }))).rejects.toBeDefined();
  expect(renovarSesion).not.toHaveBeenCalled();
});

test("no interviene en errores que no son 401 ni en rutas de auth", async () => {
  await expect(manejador({ response: { status: 500 }, config: { url: "/x" } })).rejects.toBeDefined();
  await expect(manejador(error401({ config: { url: "/auth/login" } }))).rejects.toBeDefined();
  expect(renovarSesion).not.toHaveBeenCalled();
});

test("refresh vencido: limpia la sesión y manda al login", async () => {
  renovarSesion.mockResolvedValue("expirada");
  await expect(manejador(error401())).rejects.toBeDefined();
  expect(limpiarSesionLocal).toHaveBeenCalled();
  expect(window.location.replace).toHaveBeenCalledWith("/login");
});

test("fallo de red al renovar: propaga el error sin cerrar la sesión", async () => {
  renovarSesion.mockResolvedValue("error");
  await expect(manejador(error401())).rejects.toBeDefined();
  expect(limpiarSesionLocal).not.toHaveBeenCalled();
  expect(window.location.replace).not.toHaveBeenCalled();
});
