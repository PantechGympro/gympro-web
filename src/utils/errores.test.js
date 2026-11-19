import { mensajeAmigable, mensajeDeRespuesta, mensajePorEstado } from "./errores";

describe("mensajePorEstado", () => {
  it.each([401, 403, 404, 409, 429, 503])("tiene un texto específico para %i", (codigo) => {
    const m = mensajePorEstado(codigo);
    expect(m).toBeTruthy();
    expect(m).not.toMatch(/\d{3}/);
  });
  it("5xx desconocido usa el genérico, 4xx desconocido el de 'dato inválido'", () => {
    expect(mensajePorEstado(599)).toMatch(/Algo salió mal/);
    expect(mensajePorEstado(418)).toBe(mensajePorEstado(400));
  });
});

describe("mensajeAmigable", () => {
  it("devuelve el respaldo cuando el error viene vacío", () => {
    expect(mensajeAmigable(null, "No se pudo guardar.")).toBe("No se pudo guardar.");
    expect(mensajeAmigable(undefined)).toMatch(/Algo salió mal/);
  });
  it.each(["Failed to fetch", "NetworkError when attempting", "Network Error", "timeout of 5000ms exceeded"])(
    "detecta falta de conexión: %s", (texto) => {
      expect(mensajeAmigable(new Error(texto))).toMatch(/No pudimos conectar/);
    });
  it("traduce 'Error 500' y 'HTTP 404' a un texto útil", () => {
    expect(mensajeAmigable("Error 404")).toBe(mensajePorEstado(404));
    expect(mensajeAmigable("HTTP 503: Service Unavailable")).toBe(mensajePorEstado(503));
  });
  it("descarta jerga técnica y usa el respaldo", () => {
    for (const jerga of ["Unexpected token < in JSON at position 0", "Cannot read properties of undefined", "TypeError: x is not a function"]) {
      expect(mensajeAmigable(new Error(jerga), "Respaldo.")).toBe("Respaldo.");
    }
  });
  it("respeta los mensajes que la API redactó para el usuario", () => {
    expect(mensajeAmigable(new Error("Ese correo ya está registrado"))).toBe("Ese correo ya está registrado");
  });
});

describe("mensajeDeRespuesta (axios)", () => {
  it("prefiere el texto de la API (error o msg)", () => {
    expect(mensajeDeRespuesta({ response: { status: 400, data: { error: "Falta el nombre" } } })).toBe("Falta el nombre");
    expect(mensajeDeRespuesta({ response: { status: 400, data: { msg: "Datos incompletos" } } })).toBe("Datos incompletos");
  });
  it("sin texto de la API usa el del código HTTP, nunca 'Request failed with status code'", () => {
    const m = mensajeDeRespuesta({ message: "Request failed with status code 403", response: { status: 403, data: {} } });
    expect(m).toBe(mensajePorEstado(403));
  });
  it("sin respuesta cae a mensajeAmigable", () => {
    expect(mensajeDeRespuesta(new Error("Network Error"))).toMatch(/No pudimos conectar/);
  });
});
