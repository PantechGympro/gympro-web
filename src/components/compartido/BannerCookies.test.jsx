import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BannerCookies from "./BannerCookies";
import { leerConsentimiento, guardarConsentimiento, abrirConfiguracionCookies } from "../../utils/consentimiento";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });

beforeEach(() => localStorage.clear());

test("sin decisión previa aparece con un enlace a la política", () => {
  render(<BannerCookies />);
  expect(screen.getByRole("dialog", { name: /privacidad/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /política de privacidad/i })).toHaveAttribute("href", "/privacidad#cookies");
});

test("Aceptar todas guarda las preferencias y oculta el aviso", async () => {
  render(<BannerCookies />);
  await userEvent.click(screen.getByRole("button", { name: "Aceptar todas" }));
  expect(leerConsentimiento()).toMatchObject({ preferencias: true });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("Solo necesarias rechaza las preferencias y borra el tema guardado", async () => {
  localStorage.setItem("theme", "light");
  render(<BannerCookies />);
  await userEvent.click(screen.getByRole("button", { name: "Solo necesarias" }));
  expect(leerConsentimiento()).toMatchObject({ preferencias: false });
  expect(localStorage.getItem("theme")).toBeNull();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("Configurar: las necesarias son fijas y las preferencias se eligen", async () => {
  render(<BannerCookies />);
  await userEvent.click(screen.getByRole("button", { name: "Configurar" }));
  expect(screen.getByRole("switch", { name: /necesarias/i })).toBeDisabled();
  const pref = screen.getByRole("switch", { name: "Preferencias" });
  expect(pref).not.toBeChecked();                       // nada activado por omisión
  await userEvent.click(pref);
  await userEvent.click(screen.getByRole("button", { name: "Guardar selección" }));
  expect(leerConsentimiento()).toMatchObject({ preferencias: true });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("con una decisión vigente no se muestra", () => {
  guardarConsentimiento({ preferencias: false });
  render(<BannerCookies />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("'Configurar cookies' lo reabre con la decisión actual para cambiarla", async () => {
  guardarConsentimiento({ preferencias: true });
  render(<BannerCookies />);
  act(() => abrirConfiguracionCookies());
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  const pref = screen.getByRole("switch", { name: "Preferencias" });
  expect(pref).toBeChecked();
  await userEvent.click(pref);
  await userEvent.click(screen.getByRole("button", { name: "Guardar selección" }));
  expect(leerConsentimiento()).toMatchObject({ preferencias: false });
});
