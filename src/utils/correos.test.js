import { esCorreoValido, separarCorreos, agregarCorreos, MAX_CORREOS_EXTRA } from "./correos";

describe("esCorreoValido", () => {
  it.each(["a@x.com", " conta@mi-gym.com.mx ", "nombre.apellido+tag@dominio.io"])("acepta %p", (c) => {
    expect(esCorreoValido(c)).toBe(true);
  });
  it.each(["", "a", "a@x", "a@x.c", "a b@x.com", "a@x.com,b@x.com", "@x.com", null, undefined])(
    "rechaza %p",
    (c) => expect(esCorreoValido(c)).toBe(false),
  );
});

describe("separarCorreos", () => {
  it("parte por comas, punto y coma, espacios y saltos de línea", () => {
    expect(separarCorreos("a@x.com, b@x.com;c@x.com\nd@x.com  e@x.com")).toEqual(
      ["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com"],
    );
  });
  it("texto vacío o nulo → []", () => {
    expect(separarCorreos("")).toEqual([]);
    expect(separarCorreos(null)).toEqual([]);
  });
});

describe("agregarCorreos", () => {
  it("normaliza a minúsculas y no repite", () => {
    const r = agregarCorreos(["a@x.com"], "A@X.com, b@x.com");
    expect(r).toEqual({ correos: ["a@x.com", "b@x.com"], invalidos: [], excedido: false });
  });
  it("separa los inválidos sin perder los buenos", () => {
    const r = agregarCorreos([], "bueno@x.com malo@x");
    expect(r.correos).toEqual(["bueno@x.com"]);
    expect(r.invalidos).toEqual(["malo@x"]);
  });
  it("respeta el tope y avisa", () => {
    const base = Array.from({ length: MAX_CORREOS_EXTRA - 1 }, (_, i) => `c${i}@x.com`);
    const r = agregarCorreos(base, "uno@x.com, dos@x.com");
    expect(r.correos).toHaveLength(MAX_CORREOS_EXTRA);
    expect(r.correos).toContain("uno@x.com");
    expect(r.excedido).toBe(true);
  });
  it("no muta el arreglo original", () => {
    const base = ["a@x.com"];
    agregarCorreos(base, "b@x.com");
    expect(base).toEqual(["a@x.com"]);
  });
});
