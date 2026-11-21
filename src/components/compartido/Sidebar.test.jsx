import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "../../hooks/ThemeContext";
import Sidebar, { MENUS } from "./Sidebar";
import { NAV_MAP, ROUTE_MAP } from "./Layout";
import { ROL_ADMINISTRADOR, ROL_PROPIETARIO } from "../../constants/roles";

// axios y react-router-dom v7 (paquete "exports") no los resuelve el Jest de CRA;
// el resto de las pruebas del proyecto ya mockea axios por lo mismo.
jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn(() => Promise.resolve({ data: {} })) } }));
// sweetalert2 inyecta CSS moderno (@container) que jsdom no sabe parsear: ruido sin valor.
jest.mock("sweetalert2", () => ({ __esModule: true, default: { fire: jest.fn(() => Promise.resolve({})) } }));
jest.mock("react-router-dom", () => ({
  Outlet: () => null, Navigate: () => null, useNavigate: () => jest.fn(), useLocation: () => ({ pathname: "/" }),
}), { virtual: true });

const montar = (props = {}, rol = ROL_PROPIETARIO) => {
  localStorage.setItem("user", JSON.stringify({ nombre: "Ana Test", role: rol }));
  const onTabChange = jest.fn();
  render(
    <ThemeProvider>
      <Sidebar role="owner_gym" onTabChange={onTabChange} {...props} />
    </ThemeProvider>,
  );
  return { onTabChange, nav: screen.getByRole("navigation") };
};

afterEach(() => localStorage.clear());

describe("Sidebar del Propietario/Administrador", () => {
  it("deja a la vista solo lo esencial y agrupa el resto en desplegables", () => {
    const { nav } = montar();
    const visibles = within(nav).getAllByText(/./, { selector: "span" }).map((n) => n.textContent);
    expect(visibles).toEqual([
      "Dashboard", "Miembros", "Cobrar Membresía", "Punto de Venta", "Entradas y Vencimientos",
      "Pagos y Entregas", "Gestión del Negocio", "IA & Analíticas", "Configuración",
    ]);
    // Antes eran filas sueltas del primer nivel.
    ["Pagos", "Pagos por confirmar", "Entregas pendientes", "Registrar entrada", "Por vencer"]
      .forEach((t) => expect(screen.queryByText(t)).not.toBeInTheDocument());
  });

  it("'Entradas y Vencimientos' es una sola fila que abre la pantalla con pestañas", async () => {
    const { onTabChange } = montar();
    await userEvent.click(screen.getByText("Entradas y Vencimientos"));
    expect(onTabChange).toHaveBeenCalledWith("ow-entradas");
  });

  it("'Pagos y Entregas' despliega sus tres pantallas y navega a la elegida", async () => {
    const { onTabChange } = montar();
    await userEvent.click(screen.getByText("Pagos y Entregas"));
    ["Pagos", "Pagos por confirmar", "Entregas pendientes"].forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
    await userEvent.click(screen.getByText("Pagos por confirmar"));
    expect(onTabChange).toHaveBeenCalledWith("ow-confirmar-pagos");
  });

  it("'Verificar Visitante' solo aparece con 2+ sucursales, dentro de Gestión del Negocio", async () => {
    montar({ multiSucursal: false });
    await userEvent.click(screen.getByText("Gestión del Negocio"));
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.queryByText("Verificar Visitante")).not.toBeInTheDocument();
  });

  it("con varias sucursales, 'Verificar Visitante' está en Gestión del Negocio", async () => {
    montar({ multiSucursal: true });
    expect(screen.queryByText("Verificar Visitante")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Gestión del Negocio"));
    expect(screen.getByText("Verificar Visitante")).toBeInTheDocument();
  });

  it("el Administrador no ve Sucursales (sigue siendo solo del Propietario)", async () => {
    montar({}, ROL_ADMINISTRADOR);
    await userEvent.click(screen.getByText("Gestión del Negocio"));
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.queryByText("Sucursales")).not.toBeInTheDocument();
  });
});

describe("Cada entrada del menú tiene ruta (sin enlaces muertos)", () => {
  const hojas = (items) => items.flatMap(({ id, children }) => (children ? hojas(children) : id ? [id] : []));

  Object.keys(MENUS).forEach((rol) => {
    it(`panel ${rol}: todo id del menú existe en NAV_MAP`, () => {
      const faltan = hojas(MENUS[rol]).filter((id) => !NAV_MAP[rol]?.[id]);
      expect(faltan).toEqual([]);
    });
  });

  it("owner_gym: las dos rutas de Entradas y Vencimientos resaltan la misma fila", () => {
    expect(ROUTE_MAP.owner_gym["/owner/checkin"]).toBe("ow-entradas");
    expect(ROUTE_MAP.owner_gym["/owner/por-vencer"]).toBe("ow-entradas");
    expect(NAV_MAP.owner_gym["ow-entradas"]).toBe("/owner/checkin");
  });
});
