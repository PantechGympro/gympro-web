import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OwnerCuenta from "./OwnerCuenta";
import * as api from "../../api/owner_gym";

jest.mock("axios", () => ({ __esModule: true, default: {} }));
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });
jest.mock("../../api/owner_gym", () => ({
  getEstadoCuenta: jest.fn(), cancelarSuscripcion: jest.fn(), reactivarSuscripcion: jest.fn(),
  programarEliminacion: jest.fn(), cancelarEliminacion: jest.fn(), exportarDatosCuenta: jest.fn(),
}));

const ESTADO = {
  gimnasio: { id: 1, nombre: "Hyper Panchito Gym" },
  dias_gracia: 30,
  baja: null,
  suscripcion: {
    plan: "pro", estado: "active", ciclo: "mensual", auto_renovar: true,
    pasarela: "paypal", servicio_hasta: "2026-12-20T00:00:00+00:00",
    cancelacion_programada: false,
  },
  datos: { miembros: 42, membresias: 51, asistencias: 1240, pagos: 90, ventas: 7, cuentas_personal: 4, sucursales: 1 },
};

const conEstado = (parche = {}) => api.getEstadoCuenta.mockResolvedValue({ data: { ...ESTADO, ...parche } });

beforeEach(() => {
  conEstado();
  api.cancelarSuscripcion.mockResolvedValue({ data: { msg: "Suscripción cancelada." } });
  api.reactivarSuscripcion.mockResolvedValue({ data: { msg: "Tu suscripción sigue activa." } });
  api.programarEliminacion.mockResolvedValue({ data: { msg: "Programada." } });
  api.cancelarEliminacion.mockResolvedValue({ data: { msg: "Tu cuenta se conserva." } });
});

test("muestra el plan y los conteos reales de lo que se eliminaría", async () => {
  render(<OwnerCuenta />);
  expect(await screen.findByText(/Cuenta y datos/)).toBeInTheDocument();
  expect(screen.getByText(/1,240/)).toBeInTheDocument();      // asistencias
  expect(screen.getByText(/42/)).toBeInTheDocument();         // socios
  expect(screen.getByText(/Socios en el padrón/)).toBeInTheDocument();
});

test("separa cancelar el plan de eliminar los datos", async () => {
  render(<OwnerCuenta />);
  expect(await screen.findByRole("button", { name: /Cancelar suscripción/ })).toBeInTheDocument();
  expect(screen.getByText(/no borra nada/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Eliminar mi cuenta/ })).toBeInTheDocument();
});

test("cancelar la suscripción pide confirmación y manda el motivo", async () => {
  render(<OwnerCuenta />);
  await userEvent.click(await screen.findByRole("button", { name: /Cancelar suscripción/ }));
  const dialogo = await screen.findByRole("dialog");
  expect(dialogo).toHaveTextContent(/seguirá activo hasta el/);
  await userEvent.type(screen.getByLabelText(/por qué/i), "Cerramos");
  await userEvent.click(screen.getByRole("button", { name: /Sí, cancelar el plan/ }));
  await waitFor(() => expect(api.cancelarSuscripcion).toHaveBeenCalledWith("Cerramos"));
});

test("eliminar exige entender, contraseña y la palabra exacta", async () => {
  render(<OwnerCuenta />);
  await userEvent.click(await screen.findByRole("button", { name: /Eliminar mi cuenta/ }));
  const confirmar = screen.getByRole("button", { name: /Programar la eliminación/ });
  expect(confirmar).toBeDisabled();

  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.type(screen.getByLabelText(/Tu contraseña/), "secreta");
  await userEvent.type(screen.getByLabelText(/Escribe/), "borrar");
  expect(confirmar).toBeDisabled();                           // palabra incorrecta

  await userEvent.clear(screen.getByLabelText(/Escribe/));
  await userEvent.type(screen.getByLabelText(/Escribe/), "eliminar");
  expect(confirmar).toBeEnabled();                            // no distingue mayúsculas

  await userEvent.click(confirmar);
  await waitFor(() => expect(api.programarEliminacion).toHaveBeenCalledWith(
    expect.objectContaining({ password: "secreta", confirmacion: "ELIMINAR" }),
  ));
});

test("con una baja programada avisa la fecha y ofrece conservar la cuenta", async () => {
  conEstado({ baja: { programada_para: "2026-12-20T00:00:00+00:00", dias_restantes: 30, motivo: null } });
  render(<OwnerCuenta />);
  expect(await screen.findByText(/Tu cuenta se eliminará el/)).toBeInTheDocument();
  // Con la baja en curso ya no se ofrece volver a eliminar.
  expect(screen.queryByRole("button", { name: /Eliminar mi cuenta/ })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Conservar mi cuenta/ }));
  await waitFor(() => expect(api.cancelarEliminacion).toHaveBeenCalled());
});

test("si el plan ya está cancelado ofrece reactivarlo", async () => {
  conEstado({ suscripcion: { ...ESTADO.suscripcion, cancelacion_programada: true, auto_renovar: false } });
  render(<OwnerCuenta />);
  await userEvent.click(await screen.findByRole("button", { name: /Reactivar mi suscripción/ }));
  await waitFor(() => expect(api.reactivarSuscripcion).toHaveBeenCalled());
});

test("un error del servidor se muestra y no se inventa un resultado", async () => {
  api.getEstadoCuenta.mockRejectedValue({ response: { data: { error: "Solo el propietario." } } });
  render(<OwnerCuenta />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Solo el propietario.");
});
