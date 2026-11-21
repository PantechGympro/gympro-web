import { createContext, useContext, useEffect, useState } from "react";
import { guardarPreferencia, alCambiarConsentimiento } from "../utils/consentimiento";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  // El tema se aplica siempre, pero solo se RECUERDA en el dispositivo si la
  // persona aceptó las cookies de preferencias (utils/consentimiento.js).
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    guardarPreferencia("theme", theme);
  }, [theme]);

  // Si acepta después de haber elegido un tema, se guarda en ese momento.
  useEffect(() => alCambiarConsentimiento((c) => {
    if (c.preferencias) guardarPreferencia("theme", theme);
  }), [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function useTheme() {
  return useContext(ThemeContext);
}
