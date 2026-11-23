/**
 * PruebaSocial.jsx — Gimnasios reales y testimonios.
 *
 * IMPORTANTE: estas dos secciones ya estaban conectadas a la base de datos
 * y probadas (api/landing.js -> routes/publico/landing.py). Aquí solo
 * cambia la presentación: la consulta, el shape de los datos y el criterio
 * de "qué se muestra" quedan exactamente igual.
 *
 * Lo que sí cambia:
 *   - Mientras carga ya no hay un hueco en blanco: van esqueletos con la
 *     forma exacta del contenido que viene, para que el layout no salte
 *     cuando llegue la respuesta.
 *   - Si la consulta vuelve vacía, hay un texto honesto que explica por qué
 *     (ningún gimnasio ha subido fotos todavía), no una caja rota ni datos
 *     de relleno. GymPro es un piloto con un gimnasio real: inventar logos
 *     o citas sería mentir en la página pública.
 *   - El carrusel se desvanece en los bordes (máscara CSS) en vez de
 *     cortar las tarjetas en seco contra el borde de la ventana.
 */
import { useEffect, useState } from "react";
import { FiStar } from "react-icons/fi";

const MS_POR_FOTO = 5000;

/**
 * Rota el índice de la foto mostrada cada 5s, solo si el gimnasio subió
 * más de una y el visitante no pidió movimiento reducido. Es un hook para
 * que la regla de hooks se cumpla siempre: se llama antes de cualquier
 * return temprano de la tarjeta.
 */
function useRotacion(total, reducedMotion, setIndice) {
  useEffect(() => {
    if (reducedMotion || total <= 1) return undefined;
    const id = setInterval(() => setIndice((i) => (i + 1) % total), MS_POR_FOTO);
    return () => clearInterval(id);
  }, [total, reducedMotion, setIndice]);
}

/* ── Esqueletos ─────────────────────────────────────────────────────────── */

function EsqueletoGimnasio() {
  return (
    <div className="l-skeleton-gym" aria-hidden="true">
      <div className="l-skeleton l-skeleton-gym-img" />
      <div style={{ padding: "11px 12px 13px", display: "flex", flexDirection: "column", gap: 7 }}>
        <div className="l-skeleton" style={{ height: 12, width: "70%" }} />
        <div className="l-skeleton" style={{ height: 10, width: "45%" }} />
      </div>
    </div>
  );
}

function EsqueletoTestimonio() {
  return (
    <div className="l-testi is-visible" aria-hidden="true" style={{ gap: 12 }}>
      <div className="l-skeleton" style={{ height: 12, width: 86 }} />
      <div className="l-skeleton" style={{ height: 10, width: "100%" }} />
      <div className="l-skeleton" style={{ height: 10, width: "92%" }} />
      <div className="l-skeleton" style={{ height: 10, width: "64%" }} />
      <div className="l-skeleton" style={{ height: 11, width: "40%", marginTop: 4 }} />
    </div>
  );
}

/* ── Gimnasios ──────────────────────────────────────────────────────────── */

function Estrellas({ valor }) {
  if (!valor) return null;
  return (
    <div style={{ display: "flex", gap: 2 }} aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          size={13}
          aria-hidden="true"
          style={{ color: n <= valor ? "var(--warning)" : "var(--border)" }}
          fill={n <= valor ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

/**
 * Una tarjeta por gimnasio. Si el propietario subió más de una foto, la
 * imagen va rotando sola cada 5s para que todas se terminen viendo (antes
 * solo se mostraba imagenes[0] y el resto nunca aparecía en la web).
 */
function TarjetaGimnasio({ gimnasio, reducedMotion }) {
  const imagenes = gimnasio.imagenes?.length ? gimnasio.imagenes : [];
  const [indice, setIndice] = useState(0);

  // El cambio de foto es movimiento automático: con movimiento reducido se
  // queda en la primera y ya.
  useRotacion(imagenes.length, reducedMotion, setIndice);

  if (!imagenes.length) return null;

  return (
    <div className="l-gym-card">
      <img src={imagenes[indice]} alt={gimnasio.nombre} className="l-gym-img" loading="lazy" />
      <div className="l-gym-nombre">{gimnasio.nombre}</div>
      {gimnasio.direccion && <div className="l-gym-direccion">{gimnasio.direccion}</div>}
    </div>
  );
}

export function GimnasiosSeccion({ gimnasios, cargando, enCurso, reducedMotion }) {
  const [pausado, setPausado] = useState(false);

  if (cargando) {
    return (
      <div className="l-gym-grid">
        {[0, 1, 2, 3].map((i) => <EsqueletoGimnasio key={i} />)}
      </div>
    );
  }

  if (!gimnasios.length) {
    return (
      <p className="l-vacio">
        Todavía ningún gimnasio ha publicado sus fotos. En cuanto un propietario
        las suba desde su panel, aparecerán aquí — y serán suyas de verdad, no
        imágenes de catálogo.
      </p>
    );
  }

  // Con movimiento reducido el desplazamiento continuo no aporta nada más
  // que decoración: se muestra como grilla fija, sin duplicar la lista.
  if (reducedMotion) {
    return (
      <div className="l-gym-grid">
        {gimnasios.map((g) => (
          <TarjetaGimnasio key={g.id} gimnasio={g} reducedMotion />
        ))}
      </div>
    );
  }

  // Se repite la lista para que el bucle no deje un hueco al llegar al final.
  const paraMarquee = [...gimnasios, ...gimnasios];

  return (
    <div className="l-marquee-viewport">
      <div
        className="l-marquee-track"
        style={{ animationPlayState: enCurso && !pausado ? "running" : "paused" }}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        {paraMarquee.map((g, i) => (
          <TarjetaGimnasio key={`${g.id}-${i}`} gimnasio={g} reducedMotion={false} />
        ))}
      </div>
    </div>
  );
}

/* ── Testimonios ────────────────────────────────────────────────────────── */

export function TestimoniosSeccion({ testimonios, cargando, visible }) {
  if (cargando) {
    return (
      <div className="l-testi-grid">
        {[0, 1, 2].map((i) => <EsqueletoTestimonio key={i} />)}
      </div>
    );
  }

  if (!testimonios.length) {
    return (
      <p className="l-vacio">
        Aún no hay testimonios publicados. Los propietarios pueden escribir el
        suyo desde &quot;Perfil público&quot; en su panel, y aparece aquí firmado
        con su nombre y su gimnasio.
      </p>
    );
  }

  return (
    <div className="l-testi-grid">
      {testimonios.slice(0, 6).map((t, i) => (
        <figure
          key={t.id}
          className={`l-testi${visible ? " is-visible" : ""}`}
          style={{ transitionDelay: `${140 + i * 70}ms`, margin: 0 }}
        >
          <Estrellas valor={t.calificacion} />
          <blockquote className="l-testi-texto" style={{ margin: 0 }}>
            &ldquo;{t.texto}&rdquo;
          </blockquote>
          <figcaption style={{ marginTop: "auto" }}>
            <div className="l-testi-autor">{t.autor_nombre}</div>
            {t.autor_cargo && <div className="l-testi-cargo">{t.autor_cargo}</div>}
            {t.gimnasio_nombre && <div className="l-testi-gym">{t.gimnasio_nombre}</div>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
