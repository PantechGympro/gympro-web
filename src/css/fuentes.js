// css/fuentes.js — tipografías autoalojadas.
//
// Antes las tres familias se traían con @import de fonts.googleapis.com, lo que
// enviaba la dirección IP y el navegador de CADA visitante a Google antes de que
// pudiera aceptar o rechazar nada (y el aviso de privacidad tenía que declararlo).
// Con los paquetes @fontsource los archivos .woff2 se sirven desde el propio
// dominio: cero peticiones a terceros, y además la fuente ya no depende de que
// un servicio externo esté disponible.
//
// Se importan solo los pesos que el sistema de diseño usa de verdad: cada peso
// extra es un archivo más que descargar. El especificador va SIN la extensión
// .css: el mapa "exports" de estos paquetes ya la añade (con ella, webpack
// busca "400.css.css" y falla).
import "@fontsource/plus-jakarta-sans/400";
import "@fontsource/plus-jakarta-sans/400-italic";
import "@fontsource/plus-jakarta-sans/500";
import "@fontsource/plus-jakarta-sans/600";
import "@fontsource/plus-jakarta-sans/700";
import "@fontsource/plus-jakarta-sans/800";

// Títulos de la landing (.gympro-display).
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
