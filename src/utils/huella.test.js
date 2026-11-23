import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from "util";
import { CABECERA_HUELLA, cabecerasHuella, calcularHuella } from "./huella";

// jsdom no trae TextEncoder/TextDecoder (los navegadores sí, desde hace
// años). Sin este relleno, calcularHuella() se va por su catch y devuelve
// null siempre, y estas pruebas pasarían por el motivo equivocado.
if (typeof global.TextEncoder === "undefined") global.TextEncoder = NodeTextEncoder;
if (typeof global.TextDecoder === "undefined") global.TextDecoder = NodeTextDecoder;

// Hash falso y determinista: no se prueba SHA-256 (eso es del navegador),
// se prueba que la huella sea ESTABLE entre llamadas, CAMBIE cuando cambia
// el equipo, y que nada reviente cuando WebCrypto no está.
function digestFalso(_algoritmo, datos) {
  const texto = new TextDecoder().decode(datos);
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  // 32 bytes derivados del texto, para que salga un hex de 64 caracteres.
  return Promise.resolve(Uint8Array.from({ length: 32 }, (_, i) => (h >>> (i % 4) * 8) & 0xff).buffer);
}

function simularEquipo({ conCrypto = true, idioma = "es-MX", ancho = 1920 } = {}) {
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: conCrypto ? { subtle: { digest: digestFalso } } : {},
  });
  Object.defineProperty(window.navigator, "language", { configurable: true, value: idioma });
  Object.defineProperty(window, "screen", {
    configurable: true,
    value: { width: ancho, height: 1080, colorDepth: 24 },
  });
}

describe("huella del equipo", () => {
  it("es un hexadecimal de 64 caracteres", async () => {
    simularEquipo();
    const huella = await calcularHuella();
    expect(huella).toMatch(/^[0-9a-f]{64}$/);
  });

  it("no cambia entre llamadas en el mismo equipo", async () => {
    simularEquipo();
    expect(await calcularHuella()).toBe(await calcularHuella());
  });

  it("cambia si cambia el equipo", async () => {
    simularEquipo({ ancho: 1920 });
    const a = await calcularHuella();
    simularEquipo({ ancho: 1280 });
    expect(await calcularHuella()).not.toBe(a);
  });

  it("devuelve null si el navegador no expone WebCrypto, sin lanzar", async () => {
    // Pasa en contextos no seguros (http). No debe impedir el registro: el
    // servidor trata la ausencia de huella como "no se sabe" y deja pasar.
    simularEquipo({ conCrypto: false });
    await expect(calcularHuella()).resolves.toBeNull();
  });

  it("devuelve null si el digest falla, sin lanzar", async () => {
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: { subtle: { digest: () => Promise.reject(new Error("no disponible")) } },
    });
    await expect(calcularHuella()).resolves.toBeNull();
  });
});

describe("cabecerasHuella", () => {
  it("manda la cabecera cuando hay huella", async () => {
    simularEquipo();
    const cabeceras = await cabecerasHuella();
    expect(cabeceras[CABECERA_HUELLA]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("no manda nada cuando no se pudo calcular", async () => {
    simularEquipo({ conCrypto: false });
    expect(await cabecerasHuella()).toEqual({});
  });
});
