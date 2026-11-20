import { render, screen } from "@testing-library/react";
import PrivacyPolicy from "./PrivacyPolicy";
import TerminosCondiciones from "./TerminosCondiciones";
import { VERSION_AVISO, VERSION_TERMINOS } from "../../constants/legal";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });

describe("Aviso de Privacidad", () => {
  const montar = () => render(<PrivacyPolicy />);

  test("se identifica como aviso con su versión vigente", () => {
    montar();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Aviso de Privacidad");
    expect(screen.getByText(new RegExp(`Versión ${VERSION_AVISO}`))).toBeInTheDocument();
  });

  test("cita la ley vigente y la autoridad actual, no el INAI", () => {
    montar();
    expect(screen.getByText(/20 de marzo de 2025/)).toBeInTheDocument();
    expect(screen.getAllByText(/Secretaría Anticorrupción y Buen Gobierno/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/INAI/)).not.toBeInTheDocument();
  });

  test("declara el reparto de figuras: el gimnasio responsable y PanTech encargado", () => {
    montar();
    expect(screen.getByText(/Tu gimnasio es el responsable/)).toBeInTheDocument();
    expect(screen.getByText(/PanTech es el encargado/)).toBeInTheDocument();
  });

  test("tiene las secciones que se enlazan desde el producto", () => {
    montar();
    ["responsable", "datos", "finalidades", "salud", "pagos", "seguridad",
      "conservacion", "derechos", "menores", "cookies"].forEach((id) => {
      // eslint-disable-next-line testing-library/no-node-access
      expect(document.getElementById(id)).not.toBeNull();
    });
  });

  test("dice que la tarjeta no pasa por el sistema", () => {
    montar();
    expect(screen.getByText(/no almacena, no procesa y no/)).toBeInTheDocument();
    expect(screen.getByText(/PCI DSS 4\.0\.1/)).toBeInTheDocument();
  });

  test("enlaza a los Términos y permite reconfigurar las cookies", () => {
    montar();
    expect(screen.getAllByRole("link", { name: /Términos y Condiciones/ })[0]).toHaveAttribute("href", "/terminos");
    expect(screen.getByRole("button", { name: /Configurar cookies/ })).toBeInTheDocument();
  });
});

describe("Términos y Condiciones", () => {
  const montar = () => render(<TerminosCondiciones />);

  test("se identifica con su versión vigente", () => {
    montar();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Términos y Condiciones");
    expect(screen.getByText(new RegExp(`Versión ${VERSION_TERMINOS}`))).toBeInTheDocument();
  });

  test("aclara que no es consejo médico y de quién son software y datos", () => {
    montar();
    expect(screen.getByText(/no constituyen diagnóstico, tratamiento ni asesoría/)).toBeInTheDocument();
    expect(screen.getByText(/El software es de PanTech/)).toBeInTheDocument();
    expect(screen.getByText(/Los datos del gimnasio son del gimnasio/)).toBeInTheDocument();
  });

  test("enlaza al Aviso de Privacidad", () => {
    montar();
    expect(screen.getAllByRole("link", { name: /Aviso de Privacidad/ })[0]).toHaveAttribute("href", "/privacidad");
  });
});
