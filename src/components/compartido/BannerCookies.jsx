import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiShield } from "react-icons/fi";
import {
  leerConsentimiento, guardarConsentimiento, alPedirConfiguracion,
} from "../../utils/consentimiento";

/**
 * Aviso de cookies. No bloquea la página (no es modal): se muestra abajo hasta
 * que la persona decide, y se puede reabrir desde "Configurar cookies".
 * Rechazar es tan fácil como aceptar (mismo peso visual, un solo clic).
 */
export default function BannerCookies() {
  const [visible, setVisible] = useState(() => leerConsentimiento() === null);
  const [configurando, setConfigurando] = useState(false);
  const [preferencias, setPreferencias] = useState(() => leerConsentimiento()?.preferencias ?? false);

  // "Configurar cookies" (Política de Privacidad, pie de la landing) lo reabre.
  useEffect(() => alPedirConfiguracion(() => {
    setPreferencias(leerConsentimiento()?.preferencias ?? false);
    setConfigurando(true);
    setVisible(true);
  }), []);

  if (!visible) return null;

  const decidir = (acepta) => {
    guardarConsentimiento({ preferencias: acepta });
    setPreferencias(acepta);
    setConfigurando(false);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookies-titulo"
      style={{
        position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 9999,
        maxWidth: 720, margin: "0 auto", padding: "18px 20px",
        background: "var(--bg-card, #0B1610)", color: "var(--text-primary, #E5FDF1)",
        border: "1px solid var(--border, rgba(0,255,163,0.25))", borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,.45)", fontSize: 14, lineHeight: 1.55,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <FiShield color="var(--accent, #00FFA3)" aria-hidden="true" />
        <strong id="cookies-titulo" style={{ fontSize: 15 }}>Tu privacidad en GymPro</strong>
      </div>

      <p style={{ margin: "0 0 12px", color: "var(--text-secondary, #82C2A1)" }}>
        Usamos cookies y almacenamiento local <strong>necesarios</strong> para mantener tu sesión iniciada y
        proteger tu cuenta. Con tu permiso también recordamos tus <strong>preferencias</strong> (como el tema
        visual). No usamos cookies publicitarias ni de rastreo. Más detalles en la{" "}
        <Link to="/privacidad#cookies" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #00FFA3)" }}>
          Política de Privacidad
        </Link>.
      </p>

      {configurando && (
        <div style={{ display: "grid", gap: 10, margin: "0 0 14px" }}>
          <label style={fila}>
            <span>
              <strong>Necesarias</strong>
              <span style={detalle}>
                Sesión y seguridad (cookies HttpOnly de acceso y renovación, hasta 90 días mientras no cierres
                sesión) y esta misma elección. Siempre activas.
              </span>
            </span>
            <input type="checkbox" role="switch" checked disabled aria-label="Necesarias (siempre activas)" />
          </label>
          <label style={fila}>
            <span>
              <strong>Preferencias</strong>
              <span style={detalle}>Recordar el tema visual en este dispositivo.</span>
            </span>
            <input
              type="checkbox" role="switch" checked={preferencias}
              aria-label="Preferencias"
              onChange={(e) => setPreferencias(e.target.checked)}
            />
          </label>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
        {configurando ? (
          <button type="button" className="btn-primary" onClick={() => decidir(preferencias)}>
            Guardar selección
          </button>
        ) : (
          <>
            <button type="button" className="btn-outline-small" onClick={() => setConfigurando(true)}>
              Configurar
            </button>
            <button type="button" className="btn-outline-small" onClick={() => decidir(false)}>
              Solo necesarias
            </button>
            <button type="button" className="btn-primary" onClick={() => decidir(true)}>
              Aceptar todas
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const fila = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
  padding: "10px 12px", border: "1px solid var(--border, rgba(255,255,255,.12))", borderRadius: 10,
};
const detalle = { display: "block", fontSize: 12.5, color: "var(--text-secondary, #82C2A1)", marginTop: 2 };
