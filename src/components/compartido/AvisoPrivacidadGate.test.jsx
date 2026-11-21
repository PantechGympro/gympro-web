import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AvisoPrivacidadGate from "./AvisoPrivacidadGate";
import { aceptarAvisoPrivacidad } from "../../api/auth";
import { cerrarSesion } from "../../utils/sesion";

jest.mock("../../api/auth", () => ({ aceptarAvisoPrivacidad: jest.fn() }));
jest.mock("../../utils/sesion", () => ({ cerrarSesion: jest.fn() }));

beforeEach(() => {
  aceptarAvisoPrivacidad.mockResolvedValue({ pendiente: false });
  cerrarSesion.mockResolvedValue();
  delete window.location;
  window.location = { replace: jest.fn() };
});

test("enlaza el aviso y los términos sin aceptar nada por el usuario", () => {
  render(<AvisoPrivacidadGate version="2.0" />);
  expect(screen.getByRole("dialog")).toHaveTextContent(/Aviso de Privacidad/);
  expect(screen.getByRole("link", { name: /Leer el Aviso/ })).toHaveAttribute("href", "/privacidad");
  expect(screen.getByRole("link", { name: /Términos/ })).toHaveAttribute("href", "/terminos");
  expect(aceptarAvisoPrivacidad).not.toHaveBeenCalled();
});

test("aceptar registra la versión vigente y avisa al panel", async () => {
  const onAceptado = jest.fn();
  render(<AvisoPrivacidadGate version="2.0" onAceptado={onAceptado} />);
  await userEvent.click(screen.getByRole("button", { name: /Entendido/ }));
  await waitFor(() => expect(aceptarAvisoPrivacidad).toHaveBeenCalledWith("2.0"));
  expect(onAceptado).toHaveBeenCalled();
});

test("si falla el registro no se continúa y se explica", async () => {
  aceptarAvisoPrivacidad.mockRejectedValue(new Error("Sin conexión"));
  const onAceptado = jest.fn();
  render(<AvisoPrivacidadGate version="2.0" onAceptado={onAceptado} />);
  await userEvent.click(screen.getByRole("button", { name: /Entendido/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
  expect(onAceptado).not.toHaveBeenCalled();
});

test("cerrar sesión es una salida válida", async () => {
  render(<AvisoPrivacidadGate version="2.0" />);
  await userEvent.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
  await waitFor(() => expect(cerrarSesion).toHaveBeenCalled());
  expect(window.location.replace).toHaveBeenCalledWith("/login");
});
