import {
  decodificarJwt, segundosRestantes, renovarSesion, asegurarSesionFresca,
  cerrarSesion, enImpersonacion, MARGEN_RENOVACION_SEG,
} from "./sesion";

// JWT sin firma real: el cliente solo lee exp/sub.
const jwt = (claims) => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64(claims)}.firma`;
};
const ahoraSeg = () => Math.floor(Date.now() / 1000);
const tokenCon = (restanteSeg, sub = "7") => jwt({ sub, exp: ahoraSeg() + restanteSeg });
const respuesta = (status, cuerpo = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => cuerpo });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  global.fetch = jest.fn();
});

describe("lectura de JWT", () => {
  test("decodifica claims y calcula la vida restante", () => {
    const t = tokenCon(600);
    expect(decodificarJwt(t).sub).toBe("7");
    expect(segundosRestantes(t)).toBeGreaterThan(590);
    expect(segundosRestantes(t)).toBeLessThanOrEqual(600);
  });

  test("un token ilegible cuenta como caducado", () => {
    expect(decodificarJwt("basura")).toBeNull();
    expect(segundosRestantes("basura")).toBe(-Infinity);
    expect(segundosRestantes(null)).toBe(-Infinity);
  });

  test("tolera acentos en los claims", () => {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify({ nombre: "José", exp: 1 })))).replace(/=+$/, "");
    expect(decodificarJwt(`x.${b64}.y`).nombre).toBe("José");
  });
});

describe("renovarSesion", () => {
  test("sin sesión local no hace nada", async () => {
    expect(await renovarSesion()).toBe("omitida");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("durante una impersonación no renueva", async () => {
    localStorage.setItem("token", tokenCon(10));
    sessionStorage.setItem("sa_prev_token", "super");
    expect(enImpersonacion()).toBe(true);
    expect(await renovarSesion()).toBe("omitida");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("canjea el refresh SIN cabecera Authorization y guarda token y usuario", async () => {
    localStorage.setItem("token", tokenCon(10));
    localStorage.setItem("user", JSON.stringify({ id: 7, nombre: "Ana", role: "Propietario", access_level: "pro" }));
    const nuevo = tokenCon(8 * 3600);
    fetch.mockResolvedValue(respuesta(200, { access_token: nuevo, user: { id: 7, nombre: "Ana R." } }));

    expect(await renovarSesion()).toBe("ok");

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("/api/auth/refresh");
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");
    expect(opts.headers.Authorization).toBeUndefined();
    expect(localStorage.getItem("token")).toBe(nuevo);
    // fusiona: conserva campos locales que el refresh no trae
    expect(JSON.parse(localStorage.getItem("user"))).toEqual({
      id: 7, nombre: "Ana R.", role: "Propietario", access_level: "pro",
    });
  });

  test("dos llamadas simultáneas comparten UN solo canje (la rotación revoca reusos)", async () => {
    localStorage.setItem("token", tokenCon(10));
    fetch.mockResolvedValue(respuesta(200, { access_token: tokenCon(8 * 3600) }));
    const [a, b] = await Promise.all([renovarSesion(), renovarSesion()]);
    expect([a, b]).toEqual(["ok", "ok"]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("si otra pestaña ya renovó no vuelve a canjear", async () => {
    const viejo = tokenCon(10);
    localStorage.setItem("token", viejo);
    const otraPestana = tokenCon(8 * 3600);
    // El candado cede el turno tras escribir la otra pestaña su token nuevo.
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: { request: async (_n, cb) => { localStorage.setItem("token", otraPestana); return cb(); } },
    });
    try {
      expect(await renovarSesion()).toBe("ok");
      expect(fetch).not.toHaveBeenCalled();
      expect(localStorage.getItem("token")).toBe(otraPestana);
    } finally {
      Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
    }
  });

  test.each([401, 403, 422])("un %i del refresh significa sesión expirada", async (status) => {
    localStorage.setItem("token", tokenCon(10));
    fetch.mockResolvedValue(respuesta(status));
    expect(await renovarSesion()).toBe("expirada");
  });

  test("5xx y fallo de red son transitorios: no se marca como expirada", async () => {
    localStorage.setItem("token", tokenCon(10));
    fetch.mockResolvedValueOnce(respuesta(503));
    expect(await renovarSesion()).toBe("error");
    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await renovarSesion()).toBe("error");
  });

  test("nunca cambia de identidad en silencio", async () => {
    const viejo = tokenCon(10, "7");
    localStorage.setItem("token", viejo);
    fetch.mockResolvedValue(respuesta(200, { access_token: tokenCon(8 * 3600, "99") }));
    expect(await renovarSesion()).toBe("expirada");
    expect(localStorage.getItem("token")).toBe(viejo);
  });
});

describe("asegurarSesionFresca", () => {
  test("con vida de sobra no usa la red", async () => {
    localStorage.setItem("token", tokenCon(MARGEN_RENOVACION_SEG + 600));
    expect(await asegurarSesionFresca()).toBe("ok");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("por caducar (o caducado) renueva", async () => {
    localStorage.setItem("token", tokenCon(MARGEN_RENOVACION_SEG - 60));
    fetch.mockResolvedValue(respuesta(200, { access_token: tokenCon(8 * 3600) }));
    expect(await asegurarSesionFresca()).toBe("ok");
    expect(fetch).toHaveBeenCalledTimes(1);

    localStorage.setItem("token", tokenCon(-3600));
    expect(await asegurarSesionFresca()).toBe("ok");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("cerrarSesion", () => {
  test("revoca en el servidor y limpia lo local", async () => {
    localStorage.setItem("token", tokenCon(600));
    localStorage.setItem("user", "{}");
    fetch.mockResolvedValue(respuesta(200));
    await cerrarSesion();
    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST", credentials: "include" }));
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("sin red igual cierra localmente", async () => {
    localStorage.setItem("token", tokenCon(600));
    fetch.mockRejectedValue(new TypeError("offline"));
    await cerrarSesion();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
