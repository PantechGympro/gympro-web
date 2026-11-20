import { render, screen } from "@testing-library/react";
import axios from "axios";
import userEvent from "@testing-library/user-event";
import ReceptionistMembers from "./ReceptionistMembers";
import * as api from "../../api/miembros";

// Mismo criterio que el test del panel del Propietario: se sustituye la
// infraestructura y se prueba lo que ve recepción al registrar a alguien.
jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock("framer-motion", () => {
  const React = require("react");   // eslint-disable-line global-require
  const pasar = (tag) => React.forwardRef(({ children, ...resto }, ref) => {
    const limpio = Object.fromEntries(Object.entries(resto).filter(([k]) => !/^(initial|animate|exit|transition|whileHover|whileTap|layout|variants)$/.test(k)));
    return React.createElement(tag, { ref, ...limpio }, children);
  });
  return { motion: { div: pasar("div"), button: pasar("button"), tr: pasar("tr"), span: pasar("span") }, AnimatePresence: ({ children }) => children };
});
jest.mock("../../api/miembros", () => ({
  createMiembro: jest.fn(), updateMiembro: jest.fn(), deleteMiembro: jest.fn(),
  reactivateMiembro: jest.fn(), reenviarCredencialesMiembro: jest.fn(),
}));
jest.mock("../../components/compartido/DetalleUsuarioModal", () => ({ __esModule: true, default: () => null, fechaFicha: () => "" }));
jest.mock("../../components/compartido/HistorialAsistencias", () => ({ __esModule: true, default: () => null }));
jest.mock("../../components/compartido/EmailDomainInput", () => ({
  __esModule: true,
  default: ({ value, onChange }) => <input aria-label="Correo" value={value} onChange={(e) => onChange(e.target.value)} />,
}));

// CRA reinicia las implementaciones de los mocks antes de cada test (resetMocks):
// lo que deba devolver algo se define aquí, no en las fábricas de jest.mock.
beforeEach(() => {
  axios.get.mockResolvedValue({ data: { miembros: [], total: 0, pages: 1, page: 1 } });
  localStorage.setItem("token", "t");
  api.createMiembro.mockResolvedValue({ data: { numero_socio: 301, id_usuario_pg: 301 } });
});

const registrar = async () => {
  await userEvent.click(await screen.findByRole("button", { name: /Nuevo miembro/ }));
  await userEvent.type(screen.getByPlaceholderText("Ej: Ana López"), "Ana López");
  await userEvent.type(screen.getByLabelText("Correo"), "ana@x.com");
  await userEvent.click(screen.getByRole("button", { name: "Registrar" }));
};

it("recepción ve el modal con el nombre y el número de miembro tras el alta", async () => {
  render(<ReceptionistMembers />);
  await registrar();

  const dialogo = await screen.findByRole("dialog", { name: "Miembro registrado" });
  expect(dialogo).toHaveTextContent("Ana López");
  expect(dialogo).toHaveTextContent("#301");
  expect(api.createMiembro).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Ana López", email: "ana@x.com" }));
});

it("si el alta falla no hay modal de miembro registrado", async () => {
  api.createMiembro.mockRejectedValue({ response: { data: { error: "El email ya está registrado" } } });
  render(<ReceptionistMembers />);
  await registrar();
  expect(await screen.findByText("El email ya está registrado")).toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "Miembro registrado" })).not.toBeInTheDocument();
});
