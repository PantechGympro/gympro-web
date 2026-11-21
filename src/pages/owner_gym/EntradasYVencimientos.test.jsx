import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EntradasYVencimientos from "./EntradasYVencimientos";

// react-router-dom v7 (paquete "exports") no lo resuelve el Jest de CRA: se
// mockea el hook que usa el cascarón. Las pantallas hijas tienen sus propias
// pruebas; aquí solo importa que las pestañas elijan bien y naveguen a su ruta.
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock("./CheckinManual", () => ({ __esModule: true, default: ({ embebido }) => <div>pantalla-checkin {String(embebido)}</div> }));
jest.mock("../compartido/MembresiasPorVencer", () => ({ __esModule: true, default: ({ embebido }) => <div>pantalla-por-vencer {String(embebido)}</div> }));

beforeEach(() => mockNavigate.mockClear());

it("tab=checkin abre Registrar entrada, con la pantalla embebida", () => {
  render(<EntradasYVencimientos tab="checkin" />);
  expect(screen.getByRole("tab", { name: /Registrar entrada/ })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tab", { name: /Por vencer/ })).toHaveAttribute("aria-selected", "false");
  expect(screen.getByText("pantalla-checkin true")).toBeInTheDocument();
});

it("tab=por-vencer abre Por vencer", () => {
  render(<EntradasYVencimientos tab="por-vencer" />);
  expect(screen.getByRole("tab", { name: /Por vencer/ })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("pantalla-por-vencer true")).toBeInTheDocument();
});

it("una pestaña desconocida cae en Registrar entrada", () => {
  render(<EntradasYVencimientos tab="otra" />);
  expect(screen.getByText("pantalla-checkin true")).toBeInTheDocument();
});

it("pulsar la otra pestaña navega a su URL; pulsar la actual no hace nada", async () => {
  render(<EntradasYVencimientos tab="checkin" />);
  await userEvent.click(screen.getByRole("tab", { name: /Registrar entrada/ }));
  expect(mockNavigate).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("tab", { name: /Por vencer/ }));
  expect(mockNavigate).toHaveBeenCalledWith("/owner/por-vencer");
});
