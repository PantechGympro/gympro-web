import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MiembroRegistradoModal from "./MiembroRegistradoModal";

it("cerrado (null) no pinta nada", () => {
  const { container } = render(<MiembroRegistradoModal miembro={null} onClose={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

it("muestra el nombre y el número de miembro, y el foco queda en Entendido", () => {
  render(<MiembroRegistradoModal miembro={{ nombre: "Ana Nueva", id: 184 }} onClose={() => {}} />);
  const dialogo = screen.getByRole("dialog", { name: "Miembro registrado" });
  expect(dialogo).toHaveTextContent("Ana Nueva");
  expect(dialogo).toHaveTextContent("#184");
  expect(screen.getByRole("button", { name: "Entendido" })).toHaveFocus();
});

it("sin número (API vieja) avisa dónde verlo y no ofrece copiar", () => {
  render(<MiembroRegistradoModal miembro={{ nombre: "Ana Nueva" }} onClose={() => {}} />);
  expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  expect(screen.getByText(/aparece como “ID” en su ficha/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Copiar/ })).not.toBeInTheDocument();
});

it("el id 0 o texto también cuenta como número válido solo si no está vacío", () => {
  const { rerender } = render(<MiembroRegistradoModal miembro={{ nombre: "A", id: "" }} onClose={() => {}} />);
  expect(screen.queryByText("Número de miembro")).not.toBeInTheDocument();
  rerender(<MiembroRegistradoModal miembro={{ nombre: "A", id: "77" }} onClose={() => {}} />);
  expect(screen.getByText("#77")).toBeInTheDocument();
});

it("Entendido, Escape y pulsar fuera lo cierran; pulsar dentro no", async () => {
  const onClose = jest.fn();
  render(<MiembroRegistradoModal miembro={{ nombre: "Ana", id: 5 }} onClose={onClose} />);

  await userEvent.click(screen.getByRole("dialog"));
  expect(onClose).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole("button", { name: "Entendido" }));
  expect(onClose).toHaveBeenCalledTimes(1);

  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(2);

  await userEvent.click(screen.getByTestId("miembro-registrado-fondo"));
  expect(onClose).toHaveBeenCalledTimes(3);
});

it("Copiar número manda el número al portapapeles y lo confirma", async () => {
  const writeText = jest.fn(() => Promise.resolve());
  Object.assign(navigator, { clipboard: { writeText } });
  render(<MiembroRegistradoModal miembro={{ nombre: "Ana", id: 184 }} onClose={() => {}} />);

  userEvent.click(screen.getByRole("button", { name: /Copiar número/ }));
  expect(await screen.findByRole("button", { name: /Copiado/ })).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith("184");
});

it("si el portapapeles falla no rompe y el número sigue visible", async () => {
  const writeText = jest.fn(() => Promise.reject(new Error("denegado")));
  Object.assign(navigator, { clipboard: { writeText } });
  render(<MiembroRegistradoModal miembro={{ nombre: "Ana", id: 184 }} onClose={() => {}} />);
  userEvent.click(screen.getByRole("button", { name: /Copiar número/ }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(screen.getByText("#184")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Copiado/ })).not.toBeInTheDocument();
});
