import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import MembresiasPorVencer from "./MembresiasPorVencer";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));

const FILAS = [
  { id: "1", nombre: "Ana Pérez", email: "ana@x.test", telefono: "7221234567", tipo_membresia: "Mensual",
    fecha_fin_local: "20/11/2026", dias_restantes: 1, horas_restantes: 30, estado: "por_vencer" },
  { id: "2", nombre: "Luis Gómez", email: "", telefono: "", tipo_membresia: "Trimestral",
    fecha_fin_local: "17/11/2026", dias_restantes: -2, horas_restantes: -50, estado: "vencida" },
];

beforeEach(() => {
  axios.get.mockReset();
  axios.get.mockResolvedValue({ data: { miembros: FILAS, total: 2, dias: 7 } });
});

it("pide la lista con los parámetros por defecto y pinta cada miembro", async () => {
  render(<MembresiasPorVencer />);
  expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
  expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/membresias/por-vencer",
    expect.objectContaining({ params: { dias: 7, incluir_vencidas: false } }));
  expect(screen.getByText("Vence mañana")).toBeInTheDocument();
  expect(screen.getByText("Venció hace 2 días")).toBeInTheDocument();
});

it("regresión: la fecha viene ya formateada por la API (no se recalcula en el navegador)", async () => {
  render(<MembresiasPorVencer />);
  await screen.findByText("Ana Pérez");
  expect(screen.getByText("20/11/2026")).toBeInTheDocument();
});

it("WhatsApp: un teléfono de 10 dígitos se manda con lada +52", async () => {
  render(<MembresiasPorVencer />);
  const enlace = await screen.findByLabelText("Enviar WhatsApp a Ana Pérez");
  expect(enlace).toHaveAttribute("href", "https://wa.me/527221234567");
  expect(enlace).toHaveAttribute("rel", expect.stringContaining("noopener"));
});

it("sin datos de contacto lo indica en vez de mostrar botones vacíos", async () => {
  render(<MembresiasPorVencer />);
  await screen.findByText("Luis Gómez");
  expect(screen.getByText("Sin datos de contacto")).toBeInTheDocument();
});

it("cambiar la ventana de días vuelve a consultar con ese valor", async () => {
  render(<MembresiasPorVencer />);
  await screen.findByText("Ana Pérez");
  userEvent.click(screen.getByRole("button", { name: "Próximos 30 días" }));
  await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith("/api/membresias/por-vencer",
    expect.objectContaining({ params: { dias: 30, incluir_vencidas: false } })));
});

it("'Incluir las que ya vencieron' manda incluir_vencidas=true", async () => {
  render(<MembresiasPorVencer />);
  await screen.findByText("Ana Pérez");
  userEvent.click(screen.getByLabelText("Incluir las que ya vencieron"));
  await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith("/api/membresias/por-vencer",
    expect.objectContaining({ params: { dias: 7, incluir_vencidas: true } })));
});

it("la búsqueda filtra en el cliente y avisa cuando no hay coincidencias", async () => {
  render(<MembresiasPorVencer />);
  await screen.findByText("Ana Pérez");
  userEvent.type(screen.getByLabelText("Buscar en la lista"), "trimestral");
  expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
  expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
  userEvent.clear(screen.getByLabelText("Buscar en la lista"));
  userEvent.type(screen.getByLabelText("Buscar en la lista"), "zzz");
  expect(screen.getByText(/Ninguna coincidencia/)).toBeInTheDocument();
});

it("lista vacía muestra el mensaje positivo", async () => {
  axios.get.mockResolvedValue({ data: { miembros: [] } });
  render(<MembresiasPorVencer />);
  expect(await screen.findByText(/Ninguna membresía vence en los próximos 7 días/)).toBeInTheDocument();
});

it("si la API falla muestra el mensaje de la API, no jerga técnica", async () => {
  axios.get.mockRejectedValue({ message: "Request failed with status code 403", response: { status: 403, data: {} } });
  render(<MembresiasPorVencer />);
  const alerta = await screen.findByRole("alert");
  expect(alerta).toHaveTextContent(/no tiene permiso/i);
  expect(alerta).not.toHaveTextContent(/status code/i);
});
