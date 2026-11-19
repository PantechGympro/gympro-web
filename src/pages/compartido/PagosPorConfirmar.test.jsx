import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import PagosPorConfirmar from "./PagosPorConfirmar";
import * as api from "../../api/confirmaciones";

jest.mock("sweetalert2", () => ({ __esModule: true, default: { fire: jest.fn() } }));
jest.mock("../../api/confirmaciones", () => ({
  getPagosPendientes: jest.fn(), confirmarVenta: jest.fn(), rechazarVenta: jest.fn(),
  confirmarRenovacion: jest.fn(), rechazarRenovacion: jest.fn(),
}));

const VENTA = { tipo: "venta", id: "v1", nombre_miembro: "Ana", metodo_pago: "Efectivo", total: 40,
  items: [{ nombre: "Agua", qty: 2 }], fecha: "2026-11-18T10:00:00Z" };
const RENOV = { tipo: "renovacion", id: "r1", nombre_miembro: "Luis", metodo_pago: "Transferencia", total: 500,
  membresia_nombre: "Mensual", referencia: "SPEI-123", fecha: "2026-11-18T09:00:00Z" };

beforeEach(() => {
  jest.clearAllMocks();
  api.getPagosPendientes.mockResolvedValue({ data: { ventas: [VENTA], renovaciones: [RENOV] } });
  Swal.fire.mockResolvedValue({ isConfirmed: true, value: "no llegó" });
});

const boton = (tarjeta, nombre) => within(tarjeta).getByRole("button", { name: new RegExp(nombre) });
// La tarjeta no tiene rol accesible propio: se sube desde el nombre para acotar los botones.
// eslint-disable-next-line testing-library/no-node-access
const tarjetaDe = async (nombre) => (await screen.findByText(nombre)).closest(".chart-card");

it("lista renovaciones y tienda con contadores y la más antigua primero", async () => {
  render(<PagosPorConfirmar />);
  expect(await screen.findByText("Luis")).toBeInTheDocument();
  expect(screen.getByText("Ana")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Todos (2)" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Renovaciones (1)" })).toBeInTheDocument();
  const nombres = screen.getAllByText(/^(Ana|Luis)$/).map((n) => n.textContent);
  expect(nombres).toEqual(["Luis", "Ana"]);              // Luis (09:00) antes que Ana (10:00)
});

it("el filtro 'Tienda' oculta las renovaciones", async () => {
  render(<PagosPorConfirmar />);
  await screen.findByText("Luis");
  userEvent.click(screen.getByRole("button", { name: "Tienda (1)" }));
  await waitFor(() => expect(screen.queryByText("Luis")).not.toBeInTheDocument());   // espera la animación de salida
  expect(screen.getByText("Ana")).toBeInTheDocument();
});

it("confirmar: pide confirmación, llama a la API correcta y quita la fila", async () => {
  render(<PagosPorConfirmar />);
  userEvent.click(boton(await tarjetaDe("Ana"), "Confirmar pago"));
  await waitFor(() => expect(api.confirmarVenta).toHaveBeenCalledWith("v1"));
  expect(api.confirmarRenovacion).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByText("Ana")).not.toBeInTheDocument());
});

it("confirmar una renovación usa el endpoint de renovaciones", async () => {
  render(<PagosPorConfirmar />);
  userEvent.click(boton(await tarjetaDe("Luis"), "Confirmar pago"));
  await waitFor(() => expect(api.confirmarRenovacion).toHaveBeenCalledWith("r1"));
});

it("si el personal cancela el diálogo NO se confirma nada", async () => {
  Swal.fire.mockResolvedValue({ isConfirmed: false });
  render(<PagosPorConfirmar />);
  userEvent.click(boton(await tarjetaDe("Ana"), "Confirmar pago"));
  await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
  expect(api.confirmarVenta).not.toHaveBeenCalled();
  expect(screen.getByText("Ana")).toBeInTheDocument();
});

it("rechazar manda el motivo capturado", async () => {
  render(<PagosPorConfirmar />);
  userEvent.click(boton(await tarjetaDe("Ana"), "Rechazar"));
  await waitFor(() => expect(api.rechazarVenta).toHaveBeenCalledWith("v1", "no llegó"));
});

it("SEGURIDAD: lo que escribe el miembro se escapa en el HTML del diálogo (anti-XSS)", async () => {
  api.getPagosPendientes.mockResolvedValue({ data: { ventas: [], renovaciones: [
    { ...RENOV, nombre_miembro: "<img src=x onerror=alert(1)>", referencia: "<script>robar()</script>" },
  ] } });
  Swal.fire.mockResolvedValue({ isConfirmed: false });
  render(<PagosPorConfirmar />);
  // eslint-disable-next-line testing-library/no-node-access
  const tarjeta = (await screen.findByText("<img src=x onerror=alert(1)>")).closest(".chart-card");
  userEvent.click(boton(tarjeta, "Confirmar pago"));
  await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
  const { html } = Swal.fire.mock.calls[0][0];
  expect(html).not.toContain("<img");
  expect(html).not.toContain("<script");
  expect(html).toContain("&lt;img");
  expect(html).toContain("&lt;script&gt;");
});

it("409 (otra persona ya lo resolvió): avisa y recarga la bandeja", async () => {
  api.confirmarVenta.mockRejectedValue({ response: { status: 409, data: { error: "Este pago ya fue resuelto por otra persona." } } });
  render(<PagosPorConfirmar />);
  userEvent.click(boton(await tarjetaDe("Ana"), "Confirmar pago"));
  expect(await screen.findByText(/ya fue resuelto por otra persona/)).toBeInTheDocument();
  await waitFor(() => expect(api.getPagosPendientes).toHaveBeenCalledTimes(2));
});

it("bandeja vacía", async () => {
  api.getPagosPendientes.mockResolvedValue({ data: { ventas: [], renovaciones: [] } });
  render(<PagosPorConfirmar />);
  expect(await screen.findByText("No hay pagos por confirmar")).toBeInTheDocument();
});

it("403 al cargar: mensaje claro, sin jerga", async () => {
  api.getPagosPendientes.mockRejectedValue({ response: { status: 403, data: { error: "Solo recepción, administración o el propietario pueden confirmar pagos." } } });
  render(<PagosPorConfirmar />);
  expect(await screen.findByText(/Solo recepción, administración o el propietario/)).toBeInTheDocument();
});
