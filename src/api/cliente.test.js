import { peticion } from "./cliente";

const respuesta = (status, cuerpo) => ({ status, ok: status >= 200 && status < 300, json: async () => cuerpo });

describe("peticion (cliente HTTP)", () => {
  let reemplazar;
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
    reemplazar = jest.fn();
    delete window.location;
    window.location = { replace: reemplazar };
  });

  it("envía la cookie de sesión y, si hay token en localStorage, la cabecera Authorization", async () => {
    localStorage.setItem("token", "abc");
    global.fetch.mockResolvedValue(respuesta(200, { ok: 1 }));
    await expect(peticion("/api/x")).resolves.toEqual({ ok: 1 });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.credentials).toBe("include");
    expect(opts.headers.Authorization).toBe("Bearer abc");
  });

  it("sin token no manda Authorization", async () => {
    global.fetch.mockResolvedValue(respuesta(200, {}));
    await peticion("/api/x");
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("401 → manda a /login y devuelve null", async () => {
    global.fetch.mockResolvedValue(respuesta(401, {}));
    await expect(peticion("/api/x")).resolves.toBeNull();
    expect(reemplazar).toHaveBeenCalledWith("/login");
  });

  it("error de la API → lanza con el texto de la API", async () => {
    global.fetch.mockResolvedValue(respuesta(400, { msg: "Datos incompletos" }));
    await expect(peticion("/api/x")).rejects.toThrow("Datos incompletos");
  });

  it("error sin cuerpo JSON → mensaje genérico, no revienta", async () => {
    global.fetch.mockResolvedValue({ status: 500, ok: false, json: async () => { throw new Error("no json"); } });
    await expect(peticion("/api/x")).rejects.toThrow("Error en la petición");
  });
});
