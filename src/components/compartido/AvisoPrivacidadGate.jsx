import { useState } from "react";
import { FiShield, FiExternalLink } from "react-icons/fi";
import { aceptarAvisoPrivacidad } from "../../api/auth";
import { cerrarSesion } from "../../utils/sesion";
import { VERSION_AVISO } from "../../constants/legal";

/**
 * Pasarela de aceptación del aviso de privacidad.
 *
 * La LFPDPPP exige que el aviso se ponga a disposición ANTES de tratar los
 * datos y poder acreditar qué versión aceptó cada persona y cuándo. El portal
 * solo enlazaba el documento: no quedaba constancia de nada. Esta pantalla es
 * ese consentimiento informado, y el servidor guarda versión y fecha
 * (POST /api/auth/aviso-privacidad).
 *
 * Bloquea el panel a propósito -- no es un banner que se pueda ignorar -- pero
 * deja dos salidas legítimas: leer el documento completo o cerrar sesión. No se
 * acepta nada en nombre de nadie.
 */
export default function AvisoPrivacidadGate({ version = VERSION_AVISO, onAceptado }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const aceptar = async () => {
    setEnviando(true);
    setError("");
    try {
      await aceptarAvisoPrivacidad(version);
      onAceptado?.();
    } catch (e) {
      setError(e?.message || "No pudimos registrar tu aceptación. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const salir = async () => {
    await cerrarSesion();
    window.location.replace("/login");
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="aviso-titulo" style={S.fondo}>
      <div style={S.caja}>
        <div style={S.encabezado}>
          <FiShield size={22} color="var(--accent, #00FFA3)" aria-hidden="true" />
          <h2 id="aviso-titulo" style={S.titulo}>Antes de continuar</h2>
        </div>

        <p style={S.texto}>
          Actualizamos nuestro <strong>Aviso de Privacidad</strong> (versión {version}). Queremos que sepas qué datos
          trata GymPro y qué puedes decidir sobre ellos:
        </p>
        <ul style={S.lista}>
          <li>Tu gimnasio es el responsable de tus datos; PanTech solo opera la plataforma por su cuenta.</li>
          <li>Los datos de salud y el seguimiento físico son opcionales y requieren tu consentimiento aparte.</li>
          <li>Tu número de tarjeta nunca entra al sistema: el cobro lo hace la pasarela.</li>
          <li>Puedes acceder, corregir o pedir la baja de tus datos en cualquier momento.</li>
        </ul>

        <p style={S.enlaces}>
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={S.enlace}>
            Leer el Aviso de Privacidad <FiExternalLink size={12} />
          </a>
          <a href="/terminos" target="_blank" rel="noopener noreferrer" style={S.enlace}>
            Términos y Condiciones <FiExternalLink size={12} />
          </a>
        </p>

        {error && <p role="alert" style={S.error}>{error}</p>}

        <div style={S.acciones}>
          <button type="button" onClick={salir} style={S.secundario} disabled={enviando}>
            Cerrar sesión
          </button>
          <button type="button" onClick={aceptar} style={S.primario} disabled={enviando}>
            {enviando ? "Guardando…" : "Entendido, continuar"}
          </button>
        </div>
        <p style={S.pie}>
          Al continuar queda registrado que conoces esta versión del aviso, con la fecha. Es el consentimiento de las
          finalidades necesarias para darte el servicio; las opcionales se piden por separado.
        </p>
      </div>
    </div>
  );
}

const S = {
  fondo: {
    position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center",
    background: "rgba(2,6,4,.72)", backdropFilter: "blur(4px)", padding: 20,
  },
  caja: {
    width: "min(560px, 100%)", maxHeight: "90vh", overflowY: "auto",
    background: "var(--bg-card, #0B1610)", color: "var(--text-primary, #E5FDF1)",
    border: "1px solid var(--border, rgba(0,255,163,.25))", borderRadius: 16,
    padding: "26px 28px", boxShadow: "0 20px 60px rgba(0,0,0,.5)",
  },
  encabezado: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  titulo: { fontSize: 20, fontWeight: 800, margin: 0 },
  texto: { fontSize: 14.5, lineHeight: 1.7, margin: "0 0 10px", color: "var(--text-secondary, #82C2A1)" },
  lista: {
    fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: "0 0 14px",
    display: "grid", gap: 6, color: "var(--text-primary, #E5FDF1)",
  },
  enlaces: { display: "flex", gap: 16, flexWrap: "wrap", margin: "0 0 16px" },
  enlace: {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 600,
    color: "var(--accent, #00FFA3)", textDecoration: "none",
  },
  error: {
    fontSize: 13.5, color: "var(--danger, #ef4444)", background: "rgba(239,68,68,.1)",
    border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 12px", margin: "0 0 14px",
  },
  acciones: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" },
  secundario: {
    padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
    background: "none", color: "var(--text-secondary, #82C2A1)",
    border: "1px solid var(--border, rgba(255,255,255,.14))",
  },
  primario: {
    padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
    background: "var(--accent, #00FFA3)", color: "#04120B", border: "none",
  },
  pie: {
    fontSize: 12, lineHeight: 1.6, color: "var(--text-tertiary, #5C8C74)", margin: "14px 0 0",
  },
};
