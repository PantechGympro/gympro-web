/**
 * AvisosHost.jsx — Monta, UNA sola vez, la capa de avisos de la app.
 *
 * Dos piezas y solo dos (ver .claude/skills/ask-sonner):
 *   1. <Toaster /> de sonner. Montado en la raíz, nunca por página: un
 *      segundo Toaster montado duplica cada aviso.
 *   2. El diálogo de confirmación que atiende a `confirmar()` de
 *      utils/avisos.js.
 *
 * Decisiones concretas:
 *   - `theme` se pasa explícito. Sonner NO sigue al sistema por su cuenta
 *     (su valor por omisión es "light"), así que sin esto los avisos
 *     saldrían en claro sobre el panel oscuro. Los temas "forest" y
 *     "nebula" del proyecto son oscuros, así que todo lo que no sea
 *     "light" se mapea a "dark".
 *   - Posición abajo a la derecha: arriba taparía el botón de acción
 *     principal de cada pantalla ("Nuevo plan", "Crear respaldo"), que en
 *     este panel vive en la esquina superior derecha.
 *   - `closeButton`: si un aviso llegara a estorbar, se quita en el acto
 *     sin esperar a que caduque.
 *   - `richColors`: éxito en verde y error en rojo. Sin esto los dos salen
 *     grises y el usuario tiene que leer para saber si algo falló.
 */
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { FiAlertTriangle, FiHelpCircle, FiTrash2 } from "react-icons/fi";

import useTheme from "../../hooks/useTheme";
import { _registrarDialogo } from "../../utils/avisos";
import Modal from "./Modal";
import Boton from "./Boton";

const ICONOS = {
  peligro: <FiTrash2 />,
  aviso:   <FiAlertTriangle />,
  neutro:  <FiHelpCircle />,
};

function DialogoConfirmacion() {
  const [peticion, setPeticion] = useState(null); // { opciones, resolver }
  const [texto, setTexto] = useState("");

  useEffect(() => _registrarDialogo((opciones, resolver) => {
    setTexto("");
    setPeticion({ opciones, resolver });
  }), []);

  const responder = (valor) => {
    peticion?.resolver(valor);
    setPeticion(null);
    setTexto("");
  };

  const o = peticion?.opciones || {};
  const tono = o.tono || "neutro";
  const palabra = o.escribirParaConfirmar;
  // La comparación ignora mayúsculas y espacios sobrantes: el objetivo es
  // que la persona se detenga a leer, no ponerle una prueba de mecanografía.
  const puedeConfirmar = !palabra || texto.trim().toUpperCase() === String(palabra).toUpperCase();

  return (
    <Modal
      abierto={Boolean(peticion)}
      onCerrar={() => responder(false)}
      titulo={o.titulo}
      descripcion={o.mensaje}
      icono={ICONOS[tono]}
      tono={tono}
      ancho={440}
      /* Una acción irreversible no debería cancelarse por un clic
         distraído fuera del panel; con Escape y el botón basta. */
      cerrarAlClicarFuera={!palabra}
      pie={
        <>
          <Boton variante="secundario" onClick={() => responder(false)}>
            {o.cancelar || "Cancelar"}
          </Boton>
          <Boton
            variante={tono === "peligro" ? "peligro" : "primario"}
            onClick={() => responder(true)}
            disabled={!puedeConfirmar}
          >
            {o.confirmar || "Confirmar"}
          </Boton>
        </>
      }
    >
      {palabra && (
        <label style={{ display: "block" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Escribe <strong style={{ color: "var(--text-primary)" }}>{palabra}</strong> para habilitar el botón.
          </span>
          <input
            className="u-confirm-input"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={palabra}
            autoComplete="off"
            spellCheck={false}
            data-foco-inicial
            onKeyDown={(e) => { if (e.key === "Enter" && puedeConfirmar) responder(true); }}
          />
        </label>
      )}
    </Modal>
  );
}

export default function AvisosHost() {
  const { theme } = useTheme();
  return (
    <>
      <Toaster
        theme={theme === "light" ? "light" : "dark"}
        position="bottom-right"
        richColors
        closeButton
        offset={24}
        mobileOffset={16}
        toastOptions={{ duration: 4000 }}
      />
      <DialogoConfirmacion />
    </>
  );
}
