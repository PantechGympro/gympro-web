import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import OwnerReportesAutomaticos from "./OwnerReportesAutomaticos";
import * as api from "../../api/owner_gym";

// Dependencias de infraestructura (axios ESM, router v7, CSS de sweetalert2)
// que el Jest de CRA no resuelve: se sustituyen. Lo que se prueba es la
// pantalla: qué manda al guardar y qué pinta según lo que devuelve la API.
jest.mock("axios", () => ({ __esModule: true, default: {} }));
jest.mock("sweetalert2", () => ({ __esModule: true, default: { fire: jest.fn(() => Promise.resolve({})) } }));
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn(), useOutletContext: () => ({}) }), { virtual: true });
jest.mock("../../hooks/useFuncionesPlan", () => ({ useFuncionesPlan: () => ({ reportes_pdf: true }) }));
jest.mock("../../components/compartido/BloqueoFuncionPlan", () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock("../../api/owner_gym", () => ({
  getReporteOpciones: jest.fn(),
  getReporteSucursales: jest.fn(),
  getReportesAutomaticos: jest.fn(),
  crearReporteAutomatico: jest.fn(),
  actualizarReporteAutomatico: jest.fn(),
  eliminarReporteAutomatico: jest.fn(),
  ejecutarReporteAutomaticoAhora: jest.fn(),
  getReporteDestinatarios: jest.fn(),
}));

const CFG = {
  id: 7, nombre: "Corte semanal", frecuencia: "semanal", frecuencia_label: "Semanal",
  secciones: ["resumen"], comparar: true, graficas: true, activo: true,
  momento_envio: "dia_siguiente", momento_envio_label: "Dia siguiente", hora_envio: 6,
  enviar_propietario: true, enviar_administrador: true, correos_extra: ["conta@gym.com"],
  destinatarios_label: "Propietario, Administrador, conta@gym.com",
  ultima_ejecucion: null, ultimo_error: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  api.getReporteOpciones.mockResolvedValue({ data: { secciones: [{ id: "resumen", label: "Resumen", descripcion: "Totales" }] } });
  api.getReporteSucursales.mockResolvedValue({ data: [] });
  api.getReportesAutomaticos.mockResolvedValue({ data: [] });
  api.getReporteDestinatarios.mockResolvedValue({
    data: { propietario: { nombre: "D", email: "dueno@gym.com" }, administradores: [{ nombre: "A", email: "ana@gym.com" }], max_correos_extra: 5 },
  });
  api.crearReporteAutomatico.mockResolvedValue({ data: {} });
  api.actualizarReporteAutomatico.mockResolvedValue({ data: {} });
});

const abrirFormulario = async () => {
  render(<OwnerReportesAutomaticos />);
  await userEvent.click(await screen.findByRole("button", { name: /Nueva automatización/ }));
  await userEvent.type(screen.getByPlaceholderText(/Corte de caja semanal/), "Mi corte");
};

it("por omisión solo marca Propietario y lo manda así al crear", async () => {
  await abrirFormulario();
  expect(screen.getByRole("checkbox", { name: /Propietario/ })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("checkbox", { name: /Administrador/ })).toHaveAttribute("aria-checked", "false");
  expect(screen.getByText("dueno@gym.com")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Crear automatización" }));
  await waitFor(() => expect(api.crearReporteAutomatico).toHaveBeenCalledTimes(1));
  expect(api.crearReporteAutomatico.mock.calls[0][0]).toMatchObject({
    enviar_propietario: true, enviar_administrador: false, correos_extra: [],
  });
});

it("manda Administrador + correos extra elegidos", async () => {
  await abrirFormulario();
  await userEvent.click(screen.getByRole("checkbox", { name: /Administrador/ }));
  await userEvent.type(screen.getByLabelText("Otros correos"), "Conta@Gym.com{enter}");

  await userEvent.click(screen.getByRole("button", { name: "Crear automatización" }));
  await waitFor(() => expect(api.crearReporteAutomatico).toHaveBeenCalled());
  expect(api.crearReporteAutomatico.mock.calls[0][0]).toMatchObject({
    enviar_propietario: true, enviar_administrador: true, correos_extra: ["conta@gym.com"],
  });
});

it("no deja guardar sin ningún destinatario", async () => {
  await abrirFormulario();
  await userEvent.click(screen.getByRole("checkbox", { name: /Propietario/ }));   // queda sin nadie

  await userEvent.click(screen.getByRole("button", { name: "Crear automatización" }));
  expect(api.crearReporteAutomatico).not.toHaveBeenCalled();
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Elige a quién le llega" }));
});

it("la tarjeta muestra a quién le llega y Editar carga esos destinatarios", async () => {
  api.getReportesAutomaticos.mockResolvedValue({ data: [CFG] });
  render(<OwnerReportesAutomaticos />);
  expect(await screen.findByText(/Para: Propietario, Administrador, conta@gym.com/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /Editar/ }));
  expect(screen.getByRole("checkbox", { name: /Propietario/ })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("checkbox", { name: /Administrador/ })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByText("conta@gym.com")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(api.actualizarReporteAutomatico).toHaveBeenCalled());
  expect(api.actualizarReporteAutomatico.mock.calls[0][1]).toMatchObject({
    enviar_propietario: true, enviar_administrador: true, correos_extra: ["conta@gym.com"],
  });
});

it("una receta antigua sin los campos nuevos se edita como solo-Propietario", async () => {
  const { enviar_propietario, enviar_administrador, correos_extra, destinatarios_label, ...vieja } = CFG; // eslint-disable-line no-unused-vars
  api.getReportesAutomaticos.mockResolvedValue({ data: [vieja] });
  render(<OwnerReportesAutomaticos />);
  expect(await screen.findByText(/Para: Propietario$/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Editar/ }));
  expect(screen.getByRole("checkbox", { name: /Propietario/ })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("checkbox", { name: /Administrador/ })).toHaveAttribute("aria-checked", "false");
});

it("si falla la consulta de destinatarios el formulario sigue funcionando", async () => {
  api.getReporteDestinatarios.mockRejectedValue(new Error("boom"));
  await abrirFormulario();
  expect(screen.getByRole("checkbox", { name: /Propietario/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Crear automatización" }));
  await waitFor(() => expect(api.crearReporteAutomatico).toHaveBeenCalled());
});
