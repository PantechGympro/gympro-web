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

// ── Renovación de sesión (refresh silencioso) ──────────────────────────────
const jwt = (claims) => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${b64({ alg: "HS256" })}.${b64(claims)}.f`;
};
const tokenCon = (restante, sub = "7") => jwt({ sub, exp: Math.floor(Date.now() / 1000) + restante });
const res = (status, cuerpo = {}) => respuesta(status, cuerpo);

describe("peticion: renovación de sesión", () => {
  let replace;
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    global.fetch = jest.fn();
    replace = jest.fn();
    delete window.location;
    window.location = { replace };
  });

  test("adjunta el token y devuelve los datos", async () => {
    localStorage.setItem("token", "abc");
    fetch.mockResolvedValue(res(200, { ok: 1 }));
    expect(await peticion("/api/x")).toEqual({ ok: 1 });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
  });

  test("un 401 renueva la sesión y reintenta con el token nuevo", async () => {
    localStorage.setItem("token", tokenCon(-10));
    const nuevo = tokenCon(8 * 3600);
    fetch
      .mockResolvedValueOnce(res(401))                              // petición original
      .mockResolvedValueOnce(res(200, { access_token: nuevo }))     // /auth/refresh
      .mockResolvedValueOnce(res(200, { role: "Propietario" }));    // reintento
    expect(await peticion("/api/auth/me")).toEqual({ role: "Propietario" });
    expect(fetch.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe(`Bearer ${nuevo}`);
    expect(replace).not.toHaveBeenCalled();
  });

  test("si el refresh tampoco sirve limpia la sesión y manda al login", async () => {
    localStorage.setItem("token", tokenCon(-10));
    localStorage.setItem("user", "{}");
    fetch.mockResolvedValueOnce(res(401)).mockResolvedValueOnce(res(401));
    expect(await peticion("/api/x")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("sinRedireccion devuelve null sin tocar la ubicación", async () => {
    localStorage.setItem("token", tokenCon(-10));
    fetch.mockResolvedValueOnce(res(401)).mockResolvedValueOnce(res(401));
    expect(await peticion("/api/x", { sinRedireccion: true })).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  test("un fallo de red al renovar NO cierra la sesión", async () => {
    localStorage.setItem("token", tokenCon(-10));
    fetch.mockResolvedValueOnce(res(401)).mockRejectedValueOnce(new TypeError("offline"));
    await expect(peticion("/api/x")).rejects.toMatchObject({ status: 0 });
    expect(replace).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).not.toBeNull();
  });

  test("los errores del servidor llevan su status", async () => {
    fetch.mockResolvedValue(res(503, { msg: "caído" }));
    await expect(peticion("/api/x")).rejects.toMatchObject({ message: "caído", status: 503 });
  });
});
