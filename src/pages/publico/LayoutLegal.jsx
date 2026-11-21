import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiArrowLeft, FiArrowUp, FiPrinter, FiList, FiLink } from "react-icons/fi";
import "../../css/CSSUnificado.css";

/**
 * Armazón de los documentos legales (Aviso de Privacidad, Términos).
 *
 * Diseño pensado para leer un texto largo, no para rellenar una página: dos
 * columnas con índice fijo a la izquierda --el patrón de los avisos de Google,
 * YouTube o Mercado Libre--, ancho de lectura acotado, secciones numeradas y
 * enlazables, y un conmutador entre documentos siempre visible.
 *
 * Las páginas no maquetan nada: entregan `secciones` como datos
 * ({ id, titulo, cuerpo }) y aquí se numeran, se enlazan y se indexan. Así los
 * dos documentos no pueden divergir en estilo y agregar una sección es una
 * entrada más en un arreglo.
 */
const DOCUMENTOS = [
  { ruta: "/privacidad", etiqueta: "Aviso de Privacidad" },
  { ruta: "/terminos", etiqueta: "Términos y Condiciones" },
];

export default function LayoutLegal({
  icono, titulo, descripcion, version, fecha, secciones, cierre,
}) {
  const { pathname } = useLocation();
  const [activa, setActiva] = useState(secciones[0]?.id);
  const [arriba, setArriba] = useState(true);
  const contenedor = useRef(null);

  const ids = useMemo(() => secciones.map((s) => s.id), [secciones]);

  // Índice que sigue a la lectura: resalta la sección visible más alta. Se usa
  // IntersectionObserver y no un listener de scroll para no recalcular en cada
  // píxel desplazado.
  useEffect(() => {
    const visibles = new Set();
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) visibles.add(e.target.id);
          else visibles.delete(e.target.id);
        });
        const primera = ids.find((id) => visibles.has(id));
        if (primera) setActiva(primera);
      },
      // El margen superior descuenta la barra fija; el inferior evita que una
      // sección se marque activa cuando apenas asoma por abajo.
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const nodo = document.getElementById(id);
      if (nodo) observador.observe(nodo);
    });
    return () => observador.disconnect();
  }, [ids]);

  // Desplazamiento al ancla con que llega la URL (#cookies, #eliminar-cuenta…).
  // La SPA no lo hace sola cuando el documento se abre en otra pestaña.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (id) window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView?.());
  }, [pathname]);

  useEffect(() => {
    const alScroll = () => setArriba(window.scrollY < 400);
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  const irA = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    // El hash queda en la URL para poder compartir la sección exacta.
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <div style={S.page} ref={contenedor}>
      <header style={S.barra}>
        <div style={S.barraInterior} className="legal-barra">
          <Link to="/" style={S.marca}>
            <img src="/logo64.png" alt="" style={S.logo} aria-hidden="true" />
            <span>GYM<span style={{ color: "var(--accent, #00FFA3)" }}>PRO</span></span>
          </Link>

          <nav aria-label="Documentos legales" style={S.conmutador} className="legal-conmutador">
            {DOCUMENTOS.map((d) => {
              const actual = d.ruta === pathname;
              return (
                <Link
                  key={d.ruta}
                  to={d.ruta}
                  aria-current={actual ? "page" : undefined}
                  className="legal-tab"
                  style={{ ...S.tab, ...(actual ? S.tabActiva : null) }}
                >
                  {d.etiqueta}
                </Link>
              );
            })}
          </nav>

          <Link to="/" style={S.volver}><FiArrowLeft /> <span className="legal-solo-ancho">Volver al inicio</span></Link>
        </div>
      </header>

      <div style={S.hero}>
        <div style={S.heroInterior}>
          <div style={S.heroTitulo}>
            {icono}
            <h1 style={S.h1}>{titulo}</h1>
          </div>
          {descripcion && <p style={S.heroTexto}>{descripcion}</p>}
          <div style={S.metaFila}>
            <span style={S.chip}>Versión {version}</span>
            <span style={S.chip}>Vigente desde el {fecha}</span>
            <button type="button" onClick={() => window.print()} style={S.botonImprimir} className="legal-imprimir">
              <FiPrinter size={13} /> Imprimir o guardar en PDF
            </button>
          </div>
        </div>
      </div>

      <div style={S.cuerpo} className="legal-cuerpo">
        {/* Índice: columna fija en escritorio, plegable en móvil. */}
        <aside style={S.indiceEscritorio} className="legal-indice">
          <p style={S.indiceTitulo}>Contenido</p>
          <nav aria-label="Índice del documento">
            <ol style={S.indiceLista}>
              {secciones.map((s, i) => (
                <li key={s.id} style={S.indiceItem}>
                  <a
                    href={`#${s.id}`}
                    onClick={irA(s.id)}
                    className="legal-indice-enlace"
                    style={{ ...S.indiceEnlace, ...(activa === s.id ? S.indiceEnlaceActivo : null) }}
                  >
                    <span style={S.indiceNumero}>{i + 1}</span>
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <details style={S.indiceMovil} className="legal-indice-movil">
          <summary style={S.indiceMovilResumen}><FiList size={14} /> Contenido del documento</summary>
          <ol style={{ ...S.indiceLista, marginTop: 10 }}>
            {secciones.map((s, i) => (
              <li key={s.id} style={S.indiceItem}>
                <a href={`#${s.id}`} onClick={irA(s.id)} style={S.indiceEnlace}>
                  <span style={S.indiceNumero}>{i + 1}</span>{s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </details>

        <main style={S.contenido}>
          {secciones.map((s, i) => (
            <section key={s.id} id={s.id} style={S.seccion} className="legal-seccion">
              <h2 style={S.h2}>
                <span style={S.h2Numero}>{i + 1}</span>
                <span>{s.titulo}</span>
                <a href={`#${s.id}`} onClick={irA(s.id)} className="legal-ancla"
                  style={S.ancla} aria-label={`Enlace a la sección ${s.titulo}`}>
                  <FiLink size={14} />
                </a>
              </h2>
              {s.cuerpo}
            </section>
          ))}

          {cierre}

          <p style={S.pie}>
            Documento {titulo.toLowerCase()} de GymPro, versión {version}, vigente desde el {fecha}.
            {" "}Consulta también{" "}
            {DOCUMENTOS.filter((d) => d.ruta !== pathname).map((d) => (
              <Link key={d.ruta} to={d.ruta} style={S.enlace}>{d.etiqueta}</Link>
            ))}.
          </p>
        </main>
      </div>

      {!arriba && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={S.botonArriba} aria-label="Volver al inicio del documento">
          <FiArrowUp />
        </button>
      )}

      <style>{`
        .legal-tab:hover { color: var(--text-primary, #E5FDF1); }
        .legal-indice-enlace:hover { color: var(--accent, #00FFA3); }
        .legal-imprimir:hover { border-color: var(--accent, #00FFA3); color: var(--accent, #00FFA3); }
        .legal-ancla { opacity: 0; transition: opacity .15s; }
        .legal-seccion:hover .legal-ancla, .legal-ancla:focus { opacity: .7; }
        .legal-indice { display: block; }
        .legal-indice-movil { display: none; }

        /* El índice fijo necesita ancho; por debajo pasa a plegable arriba. */
        @media (max-width: 1040px) {
          .legal-cuerpo { grid-template-columns: 1fr !important; }
          .legal-indice { display: none; }
          .legal-indice-movil { display: block; }
        }
        /* En móvil el conmutador no cabe junto a la marca: pasa a su propia
           fila completa en lugar de recortar "Términos y Condiciones". */
        @media (max-width: 760px) {
          .legal-solo-ancho { display: none; }
          .legal-barra { flex-wrap: wrap; row-gap: 8px; }
          .legal-conmutador { order: 3; width: 100%; justify-content: flex-start; }
        }

        /* Impresión: el documento completo, sin navegación ni colores de pantalla. */
        @media print {
          .legal-indice, .legal-indice-movil, .legal-imprimir { display: none !important; }
          .legal-cuerpo { grid-template-columns: 1fr !important; }
          .legal-ancla { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}

const BORDE = "var(--border, rgba(0,255,163,0.15))";

export const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-main, #040B07)",
    color: "var(--text-primary, #E5FDF1)",
    paddingBottom: 72,
  },

  // ── Barra superior fija ───────────────────────────────────────────────────
  barra: {
    position: "sticky", top: 0, zIndex: 20,
    background: "var(--bg-main, #040B07)",
    borderBottom: `1px solid ${BORDE}`,
    backdropFilter: "blur(8px)",
  },
  barraInterior: {
    maxWidth: 1180, margin: "0 auto", padding: "12px 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
  },
  marca: {
    display: "inline-flex", alignItems: "center", gap: 8,
    fontWeight: 800, fontSize: 17, letterSpacing: 0.5,
    color: "var(--text-primary, #E5FDF1)", textDecoration: "none", flexShrink: 0,
  },
  logo: { width: 22, height: 22, borderRadius: 6 },
  conmutador: { display: "flex", gap: 4, overflowX: "auto" },
  tab: {
    padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
    color: "var(--text-secondary, #82C2A1)", textDecoration: "none", whiteSpace: "nowrap",
    transition: "color .15s, background .15s",
  },
  tabActiva: {
    background: "var(--accent-dim, rgba(0,255,163,0.15))",
    color: "var(--accent-soft, #4DFFBC)",
  },
  volver: {
    display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
    color: "var(--text-secondary, #82C2A1)", textDecoration: "none", fontSize: 13,
  },

  // ── Encabezado del documento ──────────────────────────────────────────────
  hero: { borderBottom: `1px solid ${BORDE}`, padding: "44px 0 36px" },
  heroInterior: { maxWidth: 1180, margin: "0 auto", padding: "0 24px" },
  heroTitulo: { display: "flex", alignItems: "center", gap: 14, marginBottom: 10 },
  h1: { fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, margin: 0, letterSpacing: -0.5 },
  heroTexto: {
    color: "var(--text-secondary, #82C2A1)", fontSize: 16, lineHeight: 1.65,
    maxWidth: "64ch", margin: "0 0 18px",
  },
  metaFila: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  chip: {
    fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 999,
    border: `1px solid ${BORDE}`, color: "var(--text-secondary, #82C2A1)",
  },
  botonImprimir: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 999,
    border: `1px solid ${BORDE}`, background: "none",
    color: "var(--text-secondary, #82C2A1)", cursor: "pointer",
    transition: "color .15s, border-color .15s",
  },

  // ── Cuerpo en dos columnas ────────────────────────────────────────────────
  cuerpo: {
    maxWidth: 1180, margin: "0 auto", padding: "36px 24px 0",
    display: "grid", gridTemplateColumns: "248px minmax(0, 1fr)", gap: 48, alignItems: "start",
  },
  indiceEscritorio: { position: "sticky", top: 84, maxHeight: "calc(100vh - 120px)", overflowY: "auto" },
  indiceTitulo: {
    fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
    color: "var(--text-tertiary, #5C8C74)", margin: "0 0 12px",
  },
  indiceMovil: {
    border: `1px solid ${BORDE}`, borderRadius: 12, padding: "12px 14px", marginBottom: 24,
  },
  indiceMovilResumen: {
    display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
    fontSize: 13, fontWeight: 600, color: "var(--text-secondary, #82C2A1)",
  },
  indiceLista: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 2 },
  indiceItem: { margin: 0 },
  indiceEnlace: {
    display: "flex", gap: 9, alignItems: "baseline",
    padding: "6px 10px", borderRadius: 8, fontSize: 13, lineHeight: 1.45,
    color: "var(--text-secondary, #82C2A1)", textDecoration: "none",
    borderLeft: "2px solid transparent", transition: "color .15s, background .15s",
  },
  indiceEnlaceActivo: {
    color: "var(--accent-soft, #4DFFBC)",
    background: "var(--accent-dim, rgba(0,255,163,0.10))",
    borderLeft: "2px solid var(--accent, #00FFA3)",
    fontWeight: 600,
  },
  indiceNumero: {
    fontSize: 11, fontVariantNumeric: "tabular-nums",
    color: "var(--text-tertiary, #5C8C74)", minWidth: 14,
  },

  // ── Secciones ─────────────────────────────────────────────────────────────
  contenido: { maxWidth: "72ch" },
  seccion: {
    padding: "0 0 34px", marginBottom: 34, borderBottom: `1px solid ${BORDE}`,
    scrollMarginTop: 92,
  },
  h2: {
    display: "flex", alignItems: "baseline", gap: 10,
    fontSize: 21, fontWeight: 700, lineHeight: 1.3, letterSpacing: -0.2,
    color: "var(--text-primary, #E5FDF1)", margin: "0 0 14px",
  },
  h2Numero: {
    fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
    color: "var(--accent, #00FFA3)", minWidth: 18,
  },
  ancla: { color: "var(--text-tertiary, #5C8C74)", marginLeft: -2 },
  h3: {
    fontSize: 15, fontWeight: 700, margin: "22px 0 8px",
    color: "var(--accent-soft, #4DFFBC)",
  },
  p: { lineHeight: 1.78, color: "var(--text-primary, #E5FDF1)", margin: "0 0 14px", fontSize: 15.5 },
  ul: {
    lineHeight: 1.78, color: "var(--text-primary, #E5FDF1)", fontSize: 15.5,
    paddingLeft: 22, margin: "0 0 14px", display: "grid", gap: 8,
  },
  strong: { color: "var(--accent-soft, #4DFFBC)" },
  enlace: { color: "var(--accent, #00FFA3)" },
  linkBtn: {
    background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit",
    textDecoration: "underline", color: "var(--accent-soft, #4DFFBC)",
  },

  // Bloque para lo que no debe pasarse por alto (quién responde por los datos,
  // qué ocurre al eliminar la cuenta).
  destacado: {
    background: "var(--bg-card, #0B1610)",
    borderLeft: "3px solid var(--accent, #00FFA3)",
    borderRadius: "0 10px 10px 0",
    padding: "14px 18px", margin: "0 0 16px",
    lineHeight: 1.75, fontSize: 15.5,
  },
  // Tabla ligera para pares dato/explicación.
  tabla: {
    width: "100%", borderCollapse: "collapse", fontSize: 14.5, margin: "0 0 16px",
  },
  th: {
    textAlign: "left", padding: "9px 12px", borderBottom: `1px solid ${BORDE}`,
    color: "var(--accent-soft, #4DFFBC)", fontWeight: 700, fontSize: 13,
  },
  td: {
    padding: "9px 12px", borderBottom: `1px solid ${BORDE}`, verticalAlign: "top",
    lineHeight: 1.6, color: "var(--text-primary, #E5FDF1)",
  },
  contactBox: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "var(--accent-dim, rgba(0,255,163,0.15))",
    color: "var(--accent-soft, #4DFFBC)", borderRadius: 10,
    padding: "11px 16px", fontWeight: 600, textDecoration: "none", fontSize: 14.5,
  },
  pie: {
    fontSize: 13, color: "var(--text-tertiary, #5C8C74)", lineHeight: 1.7,
    padding: "4px 0 0", margin: 0,
  },
  botonArriba: {
    position: "fixed", right: 20, bottom: 20, zIndex: 20,
    width: 42, height: 42, borderRadius: "50%", cursor: "pointer",
    display: "grid", placeItems: "center",
    background: "var(--bg-card, #0B1610)", color: "var(--accent, #00FFA3)",
    border: `1px solid ${BORDE}`, boxShadow: "0 6px 20px rgba(0,0,0,.35)",
  },
};
