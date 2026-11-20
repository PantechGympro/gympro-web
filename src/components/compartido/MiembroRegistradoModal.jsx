/**
 * MiembroRegistradoModal.jsx — Aviso emergente al dar de alta a un miembro.
 *
 * Muestra el nombre y el NÚMERO DE MIEMBRO (el "ID #n" de su ficha, que es el
 * id de su usuario) para que quien lo registró -- Propietario, Administrador o
 * Recepción -- se lo pueda decir de palabra en ese momento. Sin esto el número
 * solo se descubre después, abriendo la ficha del miembro en la lista.
 *
 * Lo usan las dos pantallas donde se registran miembros: owner_gym/MiembrosDashboard
 * (Propietario y Administrador) y recepcionista/ReceptionistMembers.
 *
 *   miembro: { nombre, id } | null   (null = cerrado). `id` puede faltar si el
 *            API todavía no devuelve numero_socio: se muestra el aviso sin él.
 */
import { useEffect, useRef, useState } from "react";
import { FiCheckCircle, FiCopy, FiCheck } from "react-icons/fi";

const C = {
  card:   "var(--bg-card,#1a1d27)",
  input:  "var(--bg-input,#12151e)",
  border: "var(--border,rgba(255,255,255,.08))",
  accent: "var(--accent,#6366f1)",
  ok:     "var(--success,#22c55e)",
  t1:     "var(--text-primary,#f1f5f9)",
  t2:     "var(--text-secondary,#94a3b8)",
};

export default function MiembroRegistradoModal({ miembro, onClose }) {
  const [copiado, setCopiado] = useState(false);
  const botonRef = useRef(null);

  useEffect(() => {
    if (!miembro) return undefined;
    setCopiado(false);
    botonRef.current?.focus();
    const alTeclear = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [miembro, onClose]);

  if (!miembro) return null;
  const tieneId = miembro.id !== undefined && miembro.id !== null && miembro.id !== "";

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(miembro.id));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (http, navegador viejo): el número sigue a la vista.
    }
  };

  return (
    <div
      data-testid="miembro-registrado-fondo"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9500, padding: 24,
        background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-labelledby="miembro-registrado-titulo"
        style={{
          width: "100%", maxWidth: 400, textAlign: "center", color: C.t1,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "28px 26px 24px", boxShadow: "0 24px 64px rgba(0,0,0,.6)",
        }}
      >
        <FiCheckCircle size={40} color={C.ok} aria-hidden="true" />
        <h2 id="miembro-registrado-titulo" style={{ fontSize: 18, fontWeight: 700, margin: "12px 0 4px" }}>
          Miembro registrado
        </h2>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, wordBreak: "break-word" }}>{miembro.nombre}</p>

        {tieneId ? (
          <>
            <p style={{
              margin: "20px 0 6px", fontSize: 11.5, fontWeight: 700,
              letterSpacing: ".06em", textTransform: "uppercase", color: C.t2,
            }}>
              Número de miembro
            </p>
            <div style={{
              fontSize: 40, fontWeight: 800, color: C.accent, lineHeight: 1.1,
              padding: "14px 10px", borderRadius: 12, background: C.input, border: `1px solid ${C.border}`,
            }}>
              #{miembro.id}
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: C.t2 }}>
              Dile este número al miembro: lo necesita para identificarse en recepción.
            </p>
          </>
        ) : (
          <p style={{ margin: "16px 0 0", fontSize: 12.5, color: C.t2 }}>
            Su número de miembro aparece como “ID” en su ficha, dentro de la lista de miembros.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {tieneId && (
            <button
              type="button" onClick={copiar}
              style={{
                flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
                background: "transparent", color: C.t1, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {copiado ? <FiCheck /> : <FiCopy />} {copiado ? "Copiado" : "Copiar número"}
            </button>
          )}
          <button
            ref={botonRef} type="button" onClick={onClose}
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 10, border: "none",
              background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
