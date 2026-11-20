import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectorDestinatarios from "./SelectorDestinatarios";

const DISPONIBLES = {
  propietario: { nombre: "Dueño", email: "dueno@gym.com" },
  administradores: [{ nombre: "Ana", email: "ana@gym.com" }, { nombre: "Luis", email: "luis@gym.com" }],
  max_correos_extra: 5,
};

// El selector es controlado: se prueba con un padre que guarda el estado y
// expone el último valor para verificar lo que de verdad emite.
let ultimo;
function Padre({ inicial, disponibles }) {
  const [v, setV] = useState(inicial ?? { propietario: true, administrador: false, extras: [] });
  ultimo = v;
  return <SelectorDestinatarios value={v} onChange={setV} disponibles={disponibles} />;
}

const casilla = (nombre) => screen.getByRole("checkbox", { name: new RegExp(nombre) });
const campo = () => screen.getByLabelText("Otros correos");

beforeEach(() => { ultimo = undefined; });

it("refleja las casillas y las alterna de forma independiente (Propietario, Administrador o ambos)", async () => {
  render(<Padre />);
  expect(casilla("Propietario")).toHaveAttribute("aria-checked", "true");
  expect(casilla("Administrador")).toHaveAttribute("aria-checked", "false");

  await userEvent.click(casilla("Administrador"));
  expect(ultimo).toMatchObject({ propietario: true, administrador: true });

  await userEvent.click(casilla("Propietario"));
  expect(ultimo).toMatchObject({ propietario: false, administrador: true });
});

it("muestra a quién resuelve cada casilla", () => {
  render(<Padre disponibles={DISPONIBLES} />);
  expect(screen.getByText("dueno@gym.com")).toBeInTheDocument();
  expect(screen.getByText("ana@gym.com, luis@gym.com")).toBeInTheDocument();
});

it("avisa si la sucursal no tiene Administrador activo o el Propietario no tiene correo", () => {
  render(<Padre disponibles={{ ...DISPONIBLES, propietario: null, administradores: [] }} />);
  expect(screen.getByText(/no tiene un Administrador activo/)).toBeInTheDocument();
  expect(screen.getByText(/No hay un Propietario con correo/)).toBeInTheDocument();
});

it("Enter agrega el correo normalizado y limpia el campo", async () => {
  render(<Padre />);
  await userEvent.type(campo(), "Conta@Gym.com{enter}");
  expect(ultimo.extras).toEqual(["conta@gym.com"]);
  expect(campo()).toHaveValue("");
  expect(screen.getByText("conta@gym.com")).toBeInTheDocument();
});

it("acepta varios pegados de una vez y descarta repetidos", async () => {
  render(<Padre inicial={{ propietario: true, administrador: false, extras: ["a@x.com"] }} />);
  userEvent.paste(campo(), "a@x.com, b@x.com;c@x.com");
  await userEvent.type(campo(), "{enter}");
  expect(ultimo.extras).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
});

it("un correo inválido avisa, no se agrega y queda en el campo para corregirlo", async () => {
  render(<Padre />);
  await userEvent.type(campo(), "no-es-correo{enter}");
  expect(screen.getByRole("alert")).toHaveTextContent("Correo no válido: no-es-correo");
  expect(ultimo.extras).toEqual([]);
  expect(campo()).toHaveValue("no-es-correo");
});

it("agrega el correo escrito al salir del campo (sin pulsar Enter)", async () => {
  render(<Padre />);
  await userEvent.type(campo(), "socio@gym.com");
  await userEvent.click(casilla("Propietario"));          // quita el foco del campo
  expect(ultimo.extras).toEqual(["socio@gym.com"]);
});

it("quitar un correo con su botón", async () => {
  render(<Padre inicial={{ propietario: false, administrador: false, extras: ["a@x.com", "b@x.com"] }} />);
  await userEvent.click(screen.getByRole("button", { name: "Quitar a@x.com" }));
  expect(ultimo.extras).toEqual(["b@x.com"]);
});

it("al llegar al tope oculta el campo", () => {
  const cinco = ["1@x.com", "2@x.com", "3@x.com", "4@x.com", "5@x.com"];
  render(<Padre inicial={{ propietario: true, administrador: false, extras: cinco }} />);
  expect(screen.queryByLabelText("Otros correos")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /^Quitar/ })).toHaveLength(5);
});

it("avisa del tope si se pega más de lo que cabe", async () => {
  const cuatro = ["1@x.com", "2@x.com", "3@x.com", "4@x.com"];
  render(<Padre inicial={{ propietario: true, administrador: false, extras: cuatro }} />);
  userEvent.paste(campo(), "5@x.com, 6@x.com");
  await userEvent.type(campo(), "{enter}");
  expect(ultimo.extras).toHaveLength(5);
  expect(screen.getByRole("alert")).toHaveTextContent("Máximo 5 correos adicionales");
});
