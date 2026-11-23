/**
 * Pruebas de utils/avisos.js — la puerta única de avisos y confirmaciones.
 *
 * Lo que de verdad importa cubrir aquí no es que `toast.success` se llame
 * (eso es sonner, no nuestro), sino las dos piezas con lógica propia:
 *   1. Que cada aviso mande el título y la descripción al canal correcto.
 *   2. Que `confirmar()` resuelva bien en los tres caminos posibles:
 *      con el diálogo montado (confirma / cancela) y SIN él, donde cae al
 *      `window.confirm` del navegador. Ese respaldo es el que evita que
 *      una acción sensible se ejecute sin preguntar si el host no cargó.
 */
import { avisos, confirmar, _registrarDialogo } from "./avisos";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error:   jest.fn(),
    warning: jest.fn(),
    info:    jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    promise: jest.fn(),
  },
}));

// eslint-disable-next-line import/first
import { toast } from "sonner";

beforeEach(() => jest.clearAllMocks());

describe("avisos", () => {
  test("cada tipo va a su canal con título y descripción", () => {
    avisos.exito("Guardado", "Ya aparece en la lista");
    expect(toast.success).toHaveBeenCalledWith("Guardado", { description: "Ya aparece en la lista" });

    avisos.error("No se pudo guardar", "Inténtalo de nuevo");
    expect(toast.error).toHaveBeenCalledWith("No se pudo guardar", { description: "Inténtalo de nuevo" });

    avisos.advertencia("Plan desactivado", "3 gimnasios afectados");
    expect(toast.warning).toHaveBeenCalledWith("Plan desactivado", { description: "3 gimnasios afectados" });

    avisos.info("Recalculando");
    expect(toast.info).toHaveBeenCalledWith("Recalculando", { description: undefined });
  });

  test("cargando devuelve el id para poder cerrarlo después", () => {
    // La implementación se define aquí y no en la fábrica del mock: CRA
    // activa `resetMocks: true`, que borra las implementaciones antes de
    // cada test.
    toast.loading.mockReturnValue("id-1");
    const id = avisos.cargando("Subiendo respaldo");
    expect(toast.loading).toHaveBeenCalledWith("Subiendo respaldo", { description: undefined });
    expect(id).toBe("id-1");

    avisos.cerrar(id);
    expect(toast.dismiss).toHaveBeenCalledWith("id-1");
  });

  test("promesa traduce los rótulos al formato de sonner", () => {
    const p = Promise.resolve("ok");
    avisos.promesa(p, { cargando: "Restaurando…", exito: "Listo", error: "Falló" });
    expect(toast.promise).toHaveBeenCalledWith(p, {
      loading: "Restaurando…",
      success: "Listo",
      error: "Falló",
    });
  });
});

describe("confirmar", () => {
  test("sin diálogo montado cae al confirm del navegador y respeta su respuesta", async () => {
    const original = window.confirm;

    window.confirm = jest.fn(() => true);
    await expect(confirmar({ titulo: "¿Borrar?", mensaje: "No se puede deshacer." })).resolves.toBe(true);
    // Título y mensaje viajan juntos: el respaldo no debe perder el detalle.
    expect(window.confirm).toHaveBeenCalledWith("¿Borrar?\n\nNo se puede deshacer.");

    window.confirm = jest.fn(() => false);
    await expect(confirmar({ titulo: "¿Borrar?" })).resolves.toBe(false);

    window.confirm = jest.fn(() => false);
    await expect(confirmar()).resolves.toBe(false);
    expect(window.confirm).toHaveBeenCalledWith("¿Continuar?");

    window.confirm = original;
  });

  test("con el diálogo montado resuelve con lo que responda el usuario", async () => {
    const abrir = jest.fn((opciones, resolver) => resolver(true));
    const desregistrar = _registrarDialogo(abrir);

    await expect(confirmar({ titulo: "¿Desactivar gimnasio?" })).resolves.toBe(true);
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(abrir.mock.calls[0][0]).toEqual({ titulo: "¿Desactivar gimnasio?" });

    const cancelar = jest.fn((opciones, resolver) => resolver(false));
    _registrarDialogo(cancelar);
    await expect(confirmar({ titulo: "¿Restaurar?" })).resolves.toBe(false);

    desregistrar();
  });

  test("al desmontar el host se vuelve al respaldo del navegador", async () => {
    const abrir = jest.fn((opciones, resolver) => resolver(true));
    const desregistrar = _registrarDialogo(abrir);
    desregistrar();

    const original = window.confirm;
    window.confirm = jest.fn(() => true);
    await expect(confirmar({ titulo: "¿Seguir?" })).resolves.toBe(true);
    expect(abrir).not.toHaveBeenCalled();
    expect(window.confirm).toHaveBeenCalled();
    window.confirm = original;
  });

  test("desregistrar un host ya reemplazado no desactiva al nuevo", async () => {
    const viejo = jest.fn((o, r) => r(true));
    const desregistrarViejo = _registrarDialogo(viejo);
    const nuevo = jest.fn((o, r) => r(true));
    _registrarDialogo(nuevo);

    // El host viejo se desmonta DESPUÉS de que el nuevo se registró: su
    // limpieza no debe dejar la app sin diálogo.
    desregistrarViejo();

    await expect(confirmar({ titulo: "¿Sigue habiendo diálogo?" })).resolves.toBe(true);
    expect(nuevo).toHaveBeenCalledTimes(1);
    expect(viejo).not.toHaveBeenCalled();
  });
});
