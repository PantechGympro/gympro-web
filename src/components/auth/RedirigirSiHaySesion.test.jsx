import { render, screen } from "@testing-library/react";
import RedirigirSiHaySesion from "./RedirigirSiHaySesion";
import { peticion } from "../../api/cliente";

jest.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div data-testid="navegar">{to}</div>,
}), { virtual: true });
jest.mock("../../api/cliente", () => ({ peticion: jest.fn() }));
jest.mock("../compartido/CargandoPagina", () => ({ __esModule: true, default: () => <div>cargando</div> }));

const publico = <RedirigirSiHaySesion><div>pantalla pública</div></RedirigirSiHaySesion>;

beforeEach(() => localStorage.clear());

test("sin sesión local muestra la pantalla pública sin pedir nada", () => {
  render(publico);
  expect(screen.getByText("pantalla pública")).toBeInTheDocument();
  expect(peticion).not.toHaveBeenCalled();
});

test.each([
  ["Propietario", "/owner"],
  ["Administrador", "/owner"],
  ["Recepcionista", "/receptionist-dashboard"],
  ["Entrenador", "/trainer-dashboard"],
  ["Miembro", "/user/dashboard"],
  ["superadmin", "/superadmin"],
])("con sesión válida (%s) manda a %s", async (role, destino) => {
  localStorage.setItem("token", "t");
  peticion.mockResolvedValue({ role });
  render(publico);
  expect(screen.getByText("cargando")).toBeInTheDocument();
  expect(await screen.findByTestId("navegar")).toHaveTextContent(destino);
  expect(peticion).toHaveBeenCalledWith("/api/auth/me", { sinRedireccion: true });
});

test("si la sesión ya no sirve (401 definitivo) muestra la pantalla pública", async () => {
  localStorage.setItem("token", "muerto");
  peticion.mockResolvedValue(null);
  render(publico);
  expect(await screen.findByText("pantalla pública")).toBeInTheDocument();
});

test("si la verificación falla (red/5xx) no bloquea el acceso al login", async () => {
  localStorage.setItem("token", "t");
  peticion.mockRejectedValue(Object.assign(new Error("x"), { status: 503 }));
  render(publico);
  expect(await screen.findByText("pantalla pública")).toBeInTheDocument();
});
