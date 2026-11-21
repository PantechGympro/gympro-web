import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useTheme, { ThemeProvider } from "./ThemeContext";
import { guardarConsentimiento } from "../utils/consentimiento";

function Selector() {
  const { theme, changeTheme } = useTheme();
  return <button onClick={() => changeTheme("light")}>tema:{theme}</button>;
}
const montar = () => render(<ThemeProvider><Selector /></ThemeProvider>);

beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute("data-theme"); });

test("sin consentimiento el tema se aplica pero NO se guarda", async () => {
  montar();
  await userEvent.click(screen.getByRole("button"));
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(localStorage.getItem("theme")).toBeNull();
});

test("con consentimiento de preferencias el tema se recuerda", async () => {
  guardarConsentimiento({ preferencias: true });
  montar();
  await userEvent.click(screen.getByRole("button"));
  expect(localStorage.getItem("theme")).toBe("light");
});

test("si acepta después de elegir un tema, se guarda en ese momento", async () => {
  montar();
  await userEvent.click(screen.getByRole("button"));
  expect(localStorage.getItem("theme")).toBeNull();
  act(() => { guardarConsentimiento({ preferencias: true }); });
  expect(localStorage.getItem("theme")).toBe("light");
});
