import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "../../css/CSSUnificado.css";

/**
 * Armazón común de las páginas legales (Aviso de Privacidad y Términos y
 * Condiciones): barra superior, encabezado y contenedor. Evita duplicar el
 * mismo bloque de estilos en cada documento y mantiene los dos consistentes.
 *
 * `ancla`: si la URL llega con ese hash (#cookies, por ejemplo), desplaza hasta
 * la sección. La SPA no lo hace sola cuando la página se abre en otra pestaña.
 */
export default function LayoutLegal({ icono, titulo, version, fecha, children }) {
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id) document.getElementById(id)?.scrollIntoView?.();
  }, []);

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <Link to="/" style={S.brand}>GYM PRO</Link>
        <Link to="/" style={S.backLink}><FiArrowLeft /> Volver al inicio</Link>
      </div>

      <div style={S.container}>
        <div style={S.heroBox}>
          {icono}
          <h1 style={S.h1}>{titulo}</h1>
        </div>
        <p style={S.subtitle}>
          GymPro — desarrollado por <strong style={{ color: "inherit" }}>PanTech</strong>.
          {" "}Versión {version} · última actualización: {fecha}.
        </p>
        {children}
      </div>
    </div>
  );
}

export const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-main, #040B07)",
    color: "var(--text-primary, #E5FDF1)",
    padding: "0 0 64px",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid var(--border, rgba(0,255,163,0.15))",
    marginBottom: 32,
  },
  brand: {
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: 1,
    color: "var(--accent, #00FFA3)",
    textDecoration: "none",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "var(--text-secondary, #82C2A1)",
    textDecoration: "none",
    fontSize: 14,
  },
  container: { maxWidth: 820, margin: "0 auto", padding: "0 24px" },
  heroBox: { display: "flex", alignItems: "center", gap: 14, marginBottom: 8 },
  h1: { fontSize: 32, fontWeight: 800, margin: 0 },
  subtitle: { color: "var(--text-secondary, #82C2A1)", fontSize: 14, marginTop: 6, marginBottom: 36 },
  card: {
    background: "var(--bg-card, #0B1610)",
    border: "1px solid var(--border, rgba(0,255,163,0.15))",
    borderRadius: 16,
    padding: "28px 32px",
    marginBottom: 20,
  },
  h2: {
    fontSize: 19,
    fontWeight: 700,
    color: "var(--accent-soft, #4DFFBC)",
    marginTop: 0,
    marginBottom: 12,
  },
  p: { lineHeight: 1.7, color: "var(--text-primary, #E5FDF1)", marginBottom: 12, fontSize: 15 },
  ul: { lineHeight: 1.7, color: "var(--text-primary, #E5FDF1)", fontSize: 15, paddingLeft: 20, marginBottom: 12 },
  strong: { color: "var(--accent-soft, #4DFFBC)" },
  linkBtn: {
    background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit",
    textDecoration: "underline", color: "var(--accent-soft, #4DFFBC)",
  },
  enlace: { color: "var(--accent, #00FFA3)" },
  contactBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "var(--accent-dim, rgba(0,255,163,0.15))",
    color: "var(--accent-soft, #4DFFBC)",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 14,
  },
  // Resalta el punto que más consulta la gente (quién responde por sus datos).
  destacado: {
    borderLeft: "3px solid var(--accent, #00FFA3)",
    paddingLeft: 14,
    margin: "0 0 12px",
    lineHeight: 1.7,
    fontSize: 15,
  },
};
