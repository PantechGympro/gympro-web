/**
 * pages/publico/Landing.jsx — Página comercial de GymPro.
 *
 * Es la "/" (antes el login vivía ahí, ver App.jsx y la nota en
 * AuthPage.jsx): lo primero que ve cualquier visitante, sin sesión. De aquí
 * se sale hacia /login o /register-gym -- esta página no llama a ningún
 * endpoint que requiera autenticación.
 *
 * Los gimnasios, los testimonios y los planes salen de datos reales
 * (api/landing.js -> api/app/routes/publico/landing.py). Nunca hay nombres,
 * citas ni precios inventados: mientras ningún gimnasio haya subido fotos o
 * testimonios, esas secciones muestran un estado vacío honesto. Lo único
 * ilustrativo son las vistas previas del producto (mockup del hero, micro-UI
 * del bento, paneles por rol), y cada una lo dice en pantalla.
 *
 * ── Reescritura 2026-11-22 ────────────────────────────────────────────────
 * Este archivo pasó de 900 líneas (con ~470 de CSS incrustado en un
 * template literal) a ser solo el orquestador: estado, peticiones y
 * composición. Lo demás vive en:
 *   - src/css/landing.css                      todos los estilos
 *   - components/landing/HeroMockup.jsx        vista previa viva del panel
 *   - components/landing/BentoFuncionalidades  bento asimétrico con micro-UI
 *   - components/landing/RolesShowcase.jsx     showcase de 2 columnas
 *   - components/landing/PlanesSeccion.jsx     precios + ciclo mensual/anual
 *   - components/landing/PruebaSocial.jsx      gimnasios y testimonios (BD)
 *   - components/landing/BotonMagnetico.jsx    atracción del CTA principal
 *
 * El CSS salió del JSX por una razón concreta además del orden: dentro de
 * un template literal, un backtick en un comentario cierra la cadena y
 * rompe el build (pasó), y las @media queries no pueden sobreescribir
 * estilos inline de React, así que lo responsivo tenía que vivir en clases.
 *
 * Movimiento de la página: un solo momento protagonista (la entrada del
 * hero con su mockup) y por debajo un sistema de revelado uniforme -- mismas
 * curvas y duraciones en todas las secciones. `prefers-reduced-motion` se
 * respeta de punta a punta y `prefers-reduced-transparency` apaga el vidrio
 * esmerilado de la barra de navegación.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSun, FiMoon, FiArrowRight } from "react-icons/fi";

import useTheme from "../../hooks/useTheme";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import { getGimnasiosDestacados, getTestimoniosDestacados, getPlanesPublicos } from "../../api/landing";
import { abrirConfiguracionCookies } from "../../utils/consentimiento";

import HeroMockup from "../../components/landing/HeroMockup";
import BentoFuncionalidades from "../../components/landing/BentoFuncionalidades";
import RolesShowcase from "../../components/landing/RolesShowcase";
import PlanesSeccion from "../../components/landing/PlanesSeccion";
import { GimnasiosSeccion, TestimoniosSeccion } from "../../components/landing/PruebaSocial";
import BotonMagnetico from "../../components/landing/BotonMagnetico";

import "../../css/CSSUnificado.css";
import "../../css/landing.css";

const ENLACES_NAV = [
  { id: "funcionalidades", rotulo: "Funcionalidades" },
  { id: "roles",           rotulo: "Roles" },
  { id: "planes",          rotulo: "Planes" },
  { id: "gimnasios",       rotulo: "Gimnasios" },
];

// Cifras verificables del producto mismo (roles, pasarelas, módulos,
// infraestructura). Nunca métricas de clientes: GymPro sigue siendo un
// piloto con un solo gimnasio real, así que presumir "+100 gimnasios"
// sería falso.
const CIFRAS = [
  { num: "5",    label: "Roles de equipo" },
  { num: "2",    label: "Pasarelas de pago" },
  { num: "3",    label: "Módulos con IA" },
  { num: "100%", label: "En la nube, sin instalación" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [gimnasios, setGimnasios] = useState([]);
  const [testimonios, setTestimonios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [cargandoGimnasios, setCargandoGimnasios] = useState(true);
  const [cargandoTestimonios, setCargandoTestimonios] = useState(true);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [ciclo, setCiclo] = useState("mensual");

  // Secuencia de entrada del hero: arranca en su estado "antes" y pasa a
  // "visible" un frame después de montar -- si activáramos la clase en el
  // mismo render que monta el componente, el navegador podría pintar ya con
  // la clase final puesta y la transición nunca llegaría a verse.
  const [heroMontado, setHeroMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Vidrio esmerilado de la barra solo después de hacer scroll: señal de que
  // el contenido empezó a pasar por debajo, no decoración permanente.
  const [navConScroll, setNavConScroll] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavConScroll(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Indicador del nav: la franja del centro del viewport decide qué sección
  // está "activa". El rootMargin deja una banda delgada en medio, así que
  // siempre hay como mucho una sección cruzándola.
  const [seccionActiva, setSeccionActiva] = useState(null);
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => { if (e.isIntersecting) setSeccionActiva(e.target.id); });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    ENLACES_NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observador.observe(el);
    });
    return () => observador.disconnect();
  }, []);

  const [funcionalidadesRef, funcionalidadesVisible] = useRevealOnScroll();
  const [rolesRef, rolesVisible] = useRevealOnScroll();
  const [planesRef, planesVisible] = useRevealOnScroll();
  const [testimoniosRef, testimoniosVisible] = useRevealOnScroll();
  const [cifrasRef, cifrasVisible] = useRevealOnScroll();
  const [ctaRef, ctaVisible] = useRevealOnScroll();

  // El carrusel de gimnasios arranca congelado y solo empieza a moverse la
  // primera vez que la sección entra en pantalla -- si no, para cuando el
  // visitante llega hasta aquí el carrusel ya iba a media vuelta y parecía
  // arrancar empezado.
  const gimnasiosRef = useRef(null);
  const [marqueeEnCurso, setMarqueeEnCurso] = useState(false);
  useEffect(() => {
    const el = gimnasiosRef.current;
    if (!el) return undefined;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) { setMarqueeEnCurso(true); observador.disconnect(); }
      },
      { threshold: 0.2 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    // Peticiones independientes a propósito: si una falla (p. ej. el
    // carrusel de gimnasios) no debe ocultar los datos de la otra que sí
    // cargaron bien (p. ej. los testimonios).
    getGimnasiosDestacados()
      .then((res) => setGimnasios(res.data || []))
      .catch(() => { /* la landing debe seguir viéndose bien aunque esto falle */ })
      .finally(() => setCargandoGimnasios(false));

    getTestimoniosDestacados()
      .then((res) => setTestimonios(res.data || []))
      .catch(() => { /* idem */ })
      .finally(() => setCargandoTestimonios(false));

    getPlanesPublicos()
      .then((res) => setPlanes(res.data || []))
      .catch(() => { /* idem */ })
      .finally(() => setCargandoPlanes(false));
  }, []);

  const irA = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  };

  const toggleTheme = () => changeTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className="gympro-landing">
      {/* ── Barra de navegación ─────────────────────────────────────────── */}
      <nav className={`l-nav${navConScroll ? " is-scrolled" : ""}`}>
        <Link to="/" className="gympro-display l-brand">
          <img src="/logo64.png" alt="" aria-hidden="true" />
          GymPro
        </Link>

        <div className="l-nav-links">
          {ENLACES_NAV.map(({ id, rotulo }) => {
            const activo = seccionActiva === id;
            return (
              <button
                key={id}
                type="button"
                className="l-nav-link"
                data-activo={activo}
                onClick={() => irA(id)}
              >
                {rotulo}
                {activo && (
                  <motion.span
                    layoutId="nav-indicador"
                    className="l-nav-indicador"
                    transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="l-nav-actions">
          <button
            type="button"
            className="l-icon-btn"
            onClick={toggleTheme}
            title="Cambiar tema"
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          {/* Dos rótulos por acción: en pantallas angostas el texto largo
              parte en dos líneas y la barra crece de 64 a 96 px. El corto se
              intercambia por CSS, sin duplicar el control ni su destino. */}
          <Link to="/login" className="l-btn l-btn-fantasma">
            <span className="l-rotulo-largo">Iniciar sesión</span>
            <span className="l-rotulo-corto">Entrar</span>
          </Link>
          <button type="button" className="l-btn l-btn-primario" onClick={() => navigate("/register-gym")}>
            <span className="l-rotulo-largo">Registra tu gimnasio</span>
            <span className="l-rotulo-corto">Registrarme</span>
            <FiArrowRight aria-hidden="true" className="l-rotulo-flecha" />
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <header className="l-shell l-hero">
        <div className={`l-hero-copy${heroMontado ? " is-visible" : ""}`}>
          <h1 className="gympro-display l-h1">
            Gestiona tu gimnasio.<br />
            <span className="l-h1-acento">Hazlo crecer.</span>
          </h1>
          <p className="l-hero-sub">
            GymPro automatiza la administración de tu gimnasio y mejora la retención
            de tus socios con seguimiento personalizado: membresías, pagos, reportes
            con IA y una app para que tus socios sigan su progreso.
          </p>
          <div className="l-hero-ctas">
            <BotonMagnetico activo={!prefersReducedMotion}>
              <button type="button" className="l-btn l-btn-primario" onClick={() => navigate("/register-gym")}>
                Registra tu gimnasio <FiArrowRight aria-hidden="true" />
              </button>
            </BotonMagnetico>
            <Link to="/login" className="l-btn l-btn-secundario">Iniciar sesión</Link>
          </div>
          <p className="l-hero-nota">Sin instalación · Tus datos salen cuando tú quieras</p>
        </div>

        <HeroMockup visible={heroMontado} reducedMotion={prefersReducedMotion} />
      </header>

      {/* ── Franja de cifras del producto ───────────────────────────────── */}
      <section className={`l-cifras l-reveal${cifrasVisible ? " is-visible" : ""}`} ref={cifrasRef}>
        <div className="l-cifras-grid l-shell">
          {CIFRAS.map((c) => (
            <div key={c.label}>
              <div className="gympro-display l-cifra-num">{c.num}</div>
              <div className="l-cifra-label">{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades (bento) ─────────────────────────────────────── */}
      <section id="funcionalidades" className="l-section l-ancla" ref={funcionalidadesRef}>
        <div className="l-shell">
          <h2 className={`gympro-display l-h2 l-reveal${funcionalidadesVisible ? " is-visible" : ""}`}>
            Todo lo que tu gimnasio necesita
          </h2>
          <p
            className={`l-sub l-reveal${funcionalidadesVisible ? " is-visible" : ""}`}
            style={{ transitionDelay: "70ms" }}
          >
            Ahorra tiempo, mejora la organización y enfócate en lo más importante: tus socios.
            Las vistas de estas tarjetas son ilustrativas.
          </p>
          <BentoFuncionalidades visible={funcionalidadesVisible} />
        </div>
      </section>

      {/* ── Roles ───────────────────────────────────────────────────────── */}
      <section id="roles" className="l-section-alt l-ancla" ref={rolesRef}>
        <div className="l-shell">
          <h2 className={`gympro-display l-h2 l-reveal${rolesVisible ? " is-visible" : ""}`}>
            Un panel para cada persona de tu equipo
          </h2>
          <p
            className={`l-sub l-reveal${rolesVisible ? " is-visible" : ""}`}
            style={{ transitionDelay: "70ms" }}
          >
            GymPro reparte el trabajo en 5 roles, cada uno con justo lo que necesita ver.
            Elige uno y mira lo que aparece en su pantalla.
          </p>
          <RolesShowcase visible={rolesVisible} reducedMotion={prefersReducedMotion} />
        </div>
      </section>

      {/* ── Planes ──────────────────────────────────────────────────────── */}
      <section id="planes" className="l-section l-ancla" ref={planesRef}>
        <div className="l-shell">
          <h2 className={`gympro-display l-h2 l-reveal${planesVisible ? " is-visible" : ""}`}>
            Un plan para cada etapa de tu gimnasio
          </h2>
          <p
            className={`l-sub l-reveal${planesVisible ? " is-visible" : ""}`}
            style={{ transitionDelay: "70ms" }}
          >
            Empieza gratis y sube de plan cuando tu gimnasio lo necesite, sin contratos forzosos.
          </p>
          <PlanesSeccion
            planes={planes}
            cargando={cargandoPlanes}
            visible={planesVisible}
            ciclo={ciclo}
            setCiclo={setCiclo}
            reducedMotion={prefersReducedMotion}
            onElegir={() => navigate("/register-gym")}
          />
        </div>
      </section>

      {/* ── Gimnasios reales (datos de BD) ──────────────────────────────── */}
      <section id="gimnasios" className="l-section-alt l-ancla" ref={gimnasiosRef}>
        <div className="l-shell">
          <h2 className={`gympro-display l-h2 l-reveal${marqueeEnCurso ? " is-visible" : ""}`}>
            Gimnasios que ya confían en nosotros
          </h2>
          <p
            className={`l-sub l-reveal${marqueeEnCurso ? " is-visible" : ""}`}
            style={{ transitionDelay: "70ms" }}
          >
            Negocios reales que administran su día a día con GymPro.
          </p>
        </div>
        <GimnasiosSeccion
          gimnasios={gimnasios}
          cargando={cargandoGimnasios}
          enCurso={marqueeEnCurso}
          reducedMotion={prefersReducedMotion}
        />
      </section>

      {/* ── Testimonios (datos de BD) ───────────────────────────────────── */}
      <section className="l-section" ref={testimoniosRef}>
        <div className="l-shell">
          <h2 className={`gympro-display l-h2 l-reveal${testimoniosVisible ? " is-visible" : ""}`}>
            Historias reales, resultados reales
          </h2>
          <p
            className={`l-sub l-reveal${testimoniosVisible ? " is-visible" : ""}`}
            style={{ transitionDelay: "70ms" }}
          >
            Lo que dicen las personas que ya usan GymPro todos los días.
          </p>
          <TestimoniosSeccion
            testimonios={testimonios}
            cargando={cargandoTestimonios}
            visible={testimoniosVisible}
          />
        </div>
      </section>

      {/* ── Cierre ──────────────────────────────────────────────────────── */}
      <div className="l-shell" style={{ paddingBottom: "clamp(56px, 8vw, 88px)" }}>
        <div className={`l-cta-band l-reveal${ctaVisible ? " is-visible" : ""}`} ref={ctaRef}>
          <div>
            <h3 className="gympro-display">¿Listo para llevar tu gimnasio al siguiente nivel?</h3>
            <p>Crea tu cuenta y configura tu gimnasio en minutos.</p>
          </div>
          <button type="button" className="l-btn l-btn-primario" onClick={() => navigate("/register-gym")}>
            Registra tu gimnasio <FiArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <footer className="l-shell l-footer">
        <Link to="/" className="gympro-display l-brand" style={{ fontSize: 15 }}>
          <img src="/logo64.png" alt="" aria-hidden="true" style={{ width: 20, height: 20 }} />
          GymPro
        </Link>
        <div className="l-footer-links">
          <Link className="l-footer-link" to="/privacidad" target="_blank" rel="noopener noreferrer">Privacidad</Link>
          <Link className="l-footer-link" to="/terminos" target="_blank" rel="noopener noreferrer">Términos</Link>
          <button type="button" className="l-footer-link" onClick={abrirConfiguracionCookies}>Cookies</button>
          <a className="l-footer-link" href="mailto:soporteGympro@gmail.com">Contacto</a>
          <Link className="l-footer-link" to="/login">Iniciar sesión</Link>
        </div>
      </footer>
    </div>
  );
}
