/**
 * PaginacionControles.jsx
 * Pie de lista reutilizable: "Mostrando 1–12 de 26", selector de cuántos
 * registros ver por página y botones Anterior / Siguiente.
 *
 * El selector siempre se muestra (aunque quepa todo en una página) para que la
 * persona sepa que puede cambiar la cantidad. La elección se recuerda por
 * pantalla en localStorage (`clave`); si el navegador lo bloquea, simplemente
 * no se recuerda.
 */
import { useState } from "react";

export const OPCIONES_POR_PAGINA = [6, 12, 24, 48, 96];

/** Hook: tamaño de página persistente. Devuelve [perPage, setPerPage]. */
export function usePorPagina(clave, defecto = 12, opciones = OPCIONES_POR_PAGINA) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = parseInt(localStorage.getItem(`porPagina:${clave}`), 10);
      if (opciones.includes(guardado)) return guardado;
    } catch { /* storage bloqueado: usamos el defecto */ }
    return defecto;
  });
  const cambiar = (n) => {
    setValor(n);
    try { localStorage.setItem(`porPagina:${clave}`, String(n)); } catch { /* sin persistencia */ }
  };
  return [valor, cambiar];
}

const boton = (deshabilitado) => ({
  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
  border: "1px solid var(--border-color, var(--border, #cbd5e1))", background: "transparent",
  color: "var(--text-secondary, #64748b)", opacity: deshabilitado ? 0.4 : 1,
  cursor: deshabilitado ? "not-allowed" : "pointer",
});

export default function PaginacionControles({
  page, totalPages, total, perPage, onPage, onPerPage,
  opciones = OPCIONES_POR_PAGINA, loading = false, etiqueta = "por página",
}) {
  if (!total) return null;
  const desde = (page - 1) * perPage + 1;
  const hasta = Math.min(page * perPage, total);
  const paginas = Math.max(1, totalPages || 1);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
                  gap: 12, marginTop: 24, color: "var(--text-secondary, #64748b)", fontSize: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span>Mostrando {desde}–{hasta} de {total}</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select value={perPage} disabled={loading} onChange={(e) => onPerPage(Number(e.target.value))}
                  aria-label={`Registros ${etiqueta}`}
                  style={{ padding: "6px 8px", borderRadius: 8, fontSize: 13,
                           border: "1px solid var(--border-color, var(--border, #cbd5e1))",
                           background: "var(--bg-card, transparent)", color: "var(--text-primary, inherit)" }}>
            {opciones.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {etiqueta}
        </label>
      </div>

      {paginas > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}
                  style={boton(page <= 1 || loading)}>← Anterior</button>
          <span>Página {page} de {paginas}</span>
          <button type="button" disabled={page >= paginas || loading} onClick={() => onPage(page + 1)}
                  style={boton(page >= paginas || loading)}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}
