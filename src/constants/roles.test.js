import {
  normalizarRol, ROL_LABEL, ROL_BADGE, ROUTE_FOR_ROLE, ROLES_PERMITIDOS_POR_PANEL,
  ROL_SUPERADMIN, ROL_PROPIETARIO, ROL_ADMINISTRADOR, ROL_ENTRENADOR, ROL_RECEPCIONISTA, ROL_MIEMBRO,
} from "./roles";

const CANONICOS = [ROL_SUPERADMIN, ROL_PROPIETARIO, ROL_ADMINISTRADOR, ROL_ENTRENADOR, ROL_RECEPCIONISTA, ROL_MIEMBRO];

describe("normalizarRol", () => {
  it.each([
    ["owner_gym", ROL_PROPIETARIO], ["OWNER", ROL_PROPIETARIO], ["  admin ", ROL_ADMINISTRADOR],
    ["trainer", ROL_ENTRENADOR], ["receptionist", ROL_RECEPCIONISTA], ["user", ROL_MIEMBRO],
  ])("%s → %s", (alias, canonico) => expect(normalizarRol(alias)).toBe(canonico));

  it("un rol desconocido se devuelve en minúsculas, sin inventar un canónico", () => {
    expect(normalizarRol("Hacker")).toBe("hacker");
    expect(normalizarRol(null)).toBe("");
  });
  it("los canónicos son estables (idempotente)", () => {
    CANONICOS.forEach((r) => expect(normalizarRol(r)).toBe(r));
  });
});

describe("catálogos por rol", () => {
  it("todo rol canónico tiene etiqueta, badge y ruta de destino", () => {
    CANONICOS.forEach((r) => {
      expect(ROL_LABEL[r]).toBeTruthy();
      expect(ROL_BADGE[r.toLowerCase()]).toBeTruthy();
      expect(ROUTE_FOR_ROLE[r.toLowerCase()]).toMatch(/^\//);
    });
  });
  it("Propietario y Administrador comparten panel; el Miembro nunca entra al del personal", () => {
    expect(ROUTE_FOR_ROLE[ROL_ADMINISTRADOR.toLowerCase()]).toBe(ROUTE_FOR_ROLE[ROL_PROPIETARIO.toLowerCase()]);
    expect(ROLES_PERMITIDOS_POR_PANEL.owner_gym).not.toContain("miembro");
    expect(ROLES_PERMITIDOS_POR_PANEL.receptionist).not.toContain("miembro");
    expect(ROLES_PERMITIDOS_POR_PANEL.superadmin).toEqual(["superadmin"]);
  });
});
