import { passwordStrength } from "./passwordStrength";

describe("passwordStrength", () => {
  it("devuelve null sin contraseña", () => {
    expect(passwordStrength("")).toBeNull();
    expect(passwordStrength(undefined)).toBeNull();
  });
  it.each([
    ["abc", 0, "Muy débil"],
    ["abcdefgh", 0, "Muy débil"],
    ["abcdefgH", 1, "Aceptable"],
    ["abcdefH1", 2, "Buena"],
    ["abcdeH1!", 3, "Excelente"],
  ])("%s → nivel %i (%s)", (pwd, nivel, etiqueta) => {
    expect(passwordStrength(pwd)).toMatchObject({ level: nivel, label: etiqueta });
  });
});
