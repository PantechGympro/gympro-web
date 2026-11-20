import {
  leerConsentimiento, guardarConsentimiento, puedeGuardarPreferencias, guardarPreferencia,
  alCambiarConsentimiento, abrirConfiguracionCookies, alPedirConfiguracion,
  CLAVE_CONSENTIMIENTO, VERSION_CONSENTIMIENTO,
} from "./consentimiento";

beforeEach(() => localStorage.clear());

test("sin decisión previa no hay consentimiento ni se guardan preferencias", () => {
  expect(leerConsentimiento()).toBeNull();
  expect(puedeGuardarPreferencias()).toBe(false);
  expect(guardarPreferencia("theme", "light")).toBe(false);
  expect(localStorage.getItem("theme")).toBeNull();
});

test("aceptar guarda versión, fecha y permite guardar preferencias", () => {
  const c = guardarConsentimiento({ preferencias: true });
  expect(c).toMatchObject({ version: VERSION_CONSENTIMIENTO, necesarias: true, preferencias: true });
  expect(Number.isNaN(Date.parse(c.fecha))).toBe(false);
  expect(leerConsentimiento()).toEqual(c);
  expect(guardarPreferencia("theme", "light")).toBe(true);
  expect(localStorage.getItem("theme")).toBe("light");
});

test("rechazar preferencias borra las que ya estaban guardadas", () => {
  localStorage.setItem("theme", "forest");
  guardarConsentimiento({ preferencias: false });
  expect(localStorage.getItem("theme")).toBeNull();
  expect(puedeGuardarPreferencias()).toBe(false);
  expect(guardarPreferencia("theme", "dark")).toBe(false);
});

test("una decisión de otra versión o corrupta se ignora y se vuelve a preguntar", () => {
  localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify({ version: 0, preferencias: true }));
  expect(leerConsentimiento()).toBeNull();
  localStorage.setItem(CLAVE_CONSENTIMIENTO, "{no es json");
  expect(leerConsentimiento()).toBeNull();
});

test("notifica los cambios y permite cancelar la suscripción", () => {
  const cb = jest.fn();
  const cancelar = alCambiarConsentimiento(cb);
  guardarConsentimiento({ preferencias: true });
  expect(cb).toHaveBeenCalledWith(expect.objectContaining({ preferencias: true }));
  cancelar();
  guardarConsentimiento({ preferencias: false });
  expect(cb).toHaveBeenCalledTimes(1);
});

test("abrirConfiguracionCookies avisa a quien escucha", () => {
  const cb = jest.fn();
  const cancelar = alPedirConfiguracion(cb);
  abrirConfiguracionCookies();
  expect(cb).toHaveBeenCalledTimes(1);
  cancelar();
});
