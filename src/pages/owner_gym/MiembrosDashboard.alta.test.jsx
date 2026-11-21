import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MiembrosDashboard from "./MiembrosDashboard";
import * as api from "../../api/miembros";
import * as verificacion from "../../api/verificacion";

// Infraestructura que el Jest de CRA no resuelve (axios ESM) o que no es lo
// probado (ficha, historial, selector de dominio): se sustituye. Lo que se
// prueba es el cableado del alta: qué ve quien registra al miembro.
jest.mock("axios", () => ({ __esModule: true, default: {} }));
jest.mock("../../api/miembros", () => ({
  BASE_URL: "",
  getMiembros: jest.fn(), createMiembro: jest.fn(), updateMiembro: jest.fn(),
  deleteMiembro: jest.fn(), reactivateMiembro: jest.fn(), reenviarCredencialesMiembro: jest.fn(),
}));
jest.mock("../../api/verificacion", () => ({
  trasladarMiembros: jest.fn(), getSucursalesDestino: jest.fn(),
}));
jest.mock("../../components/compartido/DetalleUsuarioModal", () => ({ __esModule: true, default: () => null, fechaFicha: () => "" }));
jest.mock("../../components/compartido/HistorialAsistencias", () => ({ __esModule: true, default: () => null }));
jest.mock("../../components/compartido/EmailDomainInput", () => ({
  __esModule: true,
  default: ({ value, onChange }) => <input aria-label="Correo" value={value} onChange={(e) => onChange(e.target.value)} />,
}));

const MIEMBRO = { id: "m1", nombre: "Luis Viejo", email: "luis@x.com", telefono: "7220000000", sexo: "M", id_usuario_pg: 12, estado: "Activo" };

// CRA reinicia las implementaciones de los mocks antes de cada test (resetMocks):
// todo lo que deba devolver algo se define aquí, no en las fábricas de jest.mock.
beforeEach(() => {
  verificacion.getSucursalesDestino.mockResolvedValue({ data: [] });
  api.getMiembros.mockResolvedValue({ data: { miembros: [], total: 0, pages: 1 } });
  api.createMiembro.mockResolvedValue({ data: { id: "mongo1", numero_socio: 184, id_usuario_pg: 184 } });
  api.updateMiembro.mockResolvedValue({ data: {} });
});

const llenarYRegistrar = async () => {
  await userEvent.click((await screen.findAllByRole("button", { name: /Nuevo Miembro/ }))[0]);
  await userEvent.type(screen.getByPlaceholderText("Ej: Juan Pérez"), "Ana Nueva");
  await userEvent.type(screen.getByLabelText("Correo"), "ana@x.com");
  await userEvent.type(screen.getByPlaceholderText("+52 664 123 4567"), "7221112233");
  await userEvent.selectOptions(screen.getByDisplayValue("Seleccionar…"), "F");
  await userEvent.click(screen.getByRole("button", { name: "Registrar miembro" }));
};

it("al registrar un miembro aparece el modal con su nombre y número de miembro", async () => {
  render(<MiembrosDashboard />);
  await llenarYRegistrar();

  const dialogo = await screen.findByRole("dialog", { name: "Miembro registrado" });
  expect(dialogo).toHaveTextContent("Ana Nueva");
  expect(dialogo).toHaveTextContent("#184");
  expect(api.createMiembro).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Ana Nueva", email: "ana@x.com" }));
  // el formulario de alta ya se cerró y la lista se recargó
  expect(screen.queryByText("Registrar Nuevo Miembro")).not.toBeInTheDocument();
  await waitFor(() => expect(api.getMiembros.mock.calls.length).toBeGreaterThan(1));
});

it("cerrar el modal con Entendido lo quita", async () => {
  render(<MiembrosDashboard />);
  await llenarYRegistrar();
  await userEvent.click(await screen.findByRole("button", { name: "Entendido" }));
  expect(screen.queryByRole("dialog", { name: "Miembro registrado" })).not.toBeInTheDocument();
});

it("si el API aún no manda el número, igual avisa del alta (sin número)", async () => {
  api.createMiembro.mockResolvedValue({ data: { id: "mongo1" } });
  render(<MiembrosDashboard />);
  await llenarYRegistrar();
  const dialogo = await screen.findByRole("dialog", { name: "Miembro registrado" });
  expect(dialogo).toHaveTextContent("Ana Nueva");
  expect(dialogo).not.toHaveTextContent("#");
});

it("editar un miembro NO muestra el modal de alta", async () => {
  api.getMiembros.mockResolvedValue({ data: { miembros: [MIEMBRO], total: 1, pages: 1 } });
  render(<MiembrosDashboard />);
  await userEvent.click(await screen.findByRole("button", { name: "Editar" }));
  await userEvent.click(await screen.findByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(api.updateMiembro).toHaveBeenCalled());
  expect(screen.queryByRole("dialog", { name: "Miembro registrado" })).not.toBeInTheDocument();
});

it("si el alta falla no aparece el modal y el formulario sigue abierto", async () => {
  api.createMiembro.mockRejectedValue({ response: { data: { error: "El email ya está registrado" } } });
  render(<MiembrosDashboard />);
  await llenarYRegistrar();
  expect(await screen.findByText("El email ya está registrado")).toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "Miembro registrado" })).not.toBeInTheDocument();
});
