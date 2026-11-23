import { Link } from "react-router-dom";
import { FiShield, FiMail } from "react-icons/fi";
import LayoutLegal, { S } from "./LayoutLegal";
import { abrirConfiguracionCookies } from "../../utils/consentimiento";
import {
  VERSION_AVISO, FECHA_AVISO, CORREO_SOPORTE,
  LEY_DATOS, LEY_DATOS_DOF, AUTORIDAD_DATOS,
} from "../../constants/legal";

/**
 * Aviso de Privacidad de GymPro.
 *
 * Redactado contra el marco normativo del proyecto (capítulo 3 del entregable):
 *  · LFPDPPP vigente (DOF 20/03/2025) y autoridad actual, no el INAI extinto.
 *  · Reparto real de figuras: el gimnasio es RESPONSABLE, PanTech ENCARGADO.
 *  · Finalidades necesarias y voluntarias diferenciadas, como exige la ley.
 *  · Datos de salud como dato SENSIBLE, con consentimiento expreso y módulo
 *    que se activa por socio.
 *  · PCI DSS 4.0.1 por redirección: el número de tarjeta no entra al sistema.
 *  · Derechos ARCO con la vía concreta dentro del producto, no solo un correo.
 *
 * El contenido se declara como datos (`secciones`); la maquetación, el índice y
 * la numeración los resuelve LayoutLegal.
 */

const T = ({ children }) => <strong style={S.strong}>{children}</strong>;

const secciones = [
  {
    id: "que-es",
    titulo: "Qué es este documento",
    cuerpo: (
      <>
        <p style={S.p}>
          Este Aviso de Privacidad explica qué datos personales trata <T>GymPro</T> —la plataforma web y la
          aplicación móvil de gestión de gimnasios desarrollada por PanTech—, para qué se usan, con quién se
          comparten, cómo se protegen y qué puedes hacer tú al respecto. Aplica a todas las personas que usan el
          sistema: socios, entrenadores, recepción, administradores y propietarios de gimnasios.
        </p>
        <p style={S.p}>
          Se emite conforme a la <T>{LEY_DATOS}</T> ({LEY_DATOS_DOF}), que sustituyó a la ley de 2010. La autoridad
          competente en la materia es la <T>{AUTORIDAD_DATOS}</T>. Las condiciones de uso del servicio están en los{" "}
          <Link to="/terminos" style={S.enlace}>Términos y Condiciones</Link>.
        </p>
      </>
    ),
  },
  {
    id: "responsable",
    titulo: "Quién responde por tus datos",
    cuerpo: (
      <>
        <p style={S.destacado}>
          <T>Tu gimnasio es el responsable</T> de tus datos: es quien decide qué información te pide y para qué la
          usa. <T>PanTech es el encargado</T>: opera la plataforma por cuenta de ese gimnasio y trata tus datos
          únicamente siguiendo sus instrucciones y lo descrito en este aviso.
        </p>
        <p style={S.p}>La distinción no es un trámite; define a quién acudir:</p>
        <ul style={S.ul}>
          <li>
            Si eres <T>socio o personal de un gimnasio</T>, el responsable es ese gimnasio. Tus solicitudes sobre tus
            datos se atienden ahí, con las herramientas que GymPro le entrega. PanTech apoya al gimnasio, pero no
            decide por él qué datos se piden ni los usa para fines propios.
          </li>
          <li>
            Si eres <T>propietario de un gimnasio</T> y contratas GymPro, PanTech es responsable de los datos de tu
            cuenta de cliente (nombre, correo, teléfono, datos de facturación y de la suscripción) y encargado
            respecto de los datos de tus socios.
          </li>
        </ul>
        <p style={S.p}>
          PanTech <T>no vende ni renta datos personales</T>, no los usa con fines publicitarios y no los comparte con
          otros gimnasios: cada gimnasio ve exclusivamente su propia información.
        </p>
      </>
    ),
  },
  {
    id: "datos",
    titulo: "Qué datos se tratan",
    cuerpo: (
      <>
        <p style={S.p}>Solo se piden los datos que una operación real del gimnasio utiliza. Por categoría:</p>
        <table style={S.tabla}>
          <thead>
            <tr>
              <th style={S.th}>Categoría</th>
              <th style={S.th}>Qué se registra</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><T>Identificación</T></td>
              <td style={S.td}>Nombre, fecha de nacimiento, sexo y fotografía de perfil.</td>
            </tr>
            <tr>
              <td style={S.td}><T>Contacto</T></td>
              <td style={S.td}>Teléfono, correo electrónico y, si el gimnasio lo registra, domicilio.</td>
            </tr>
            <tr>
              <td style={S.td}><T>Salud y estado físico</T><br /><span style={{ fontSize: 12.5 }}>dato sensible</span></td>
              <td style={S.td}>
                Peso, estatura, índice de masa corporal, medidas corporales, porcentaje de grasa, fotos de progreso y
                los padecimientos o lesiones que declares a tu entrenador. Requiere tu consentimiento expreso
                (sección 5).
              </td>
            </tr>
            <tr>
              <td style={S.td}><T>Autenticación</T></td>
              <td style={S.td}>
                Correo, contraseña y tokens de sesión. La contraseña se guarda como resumen criptográfico (hash),
                nunca en claro ni de forma reversible.
              </td>
            </tr>
            <tr>
              <td style={S.td}><T>Operación</T></td>
              <td style={S.td}>
                Asistencias y entradas al gimnasio, rutinas asignadas, entrenamientos registrados, planes de
                nutrición, membresías, pagos y compras en el punto de venta.
              </td>
            </tr>
            <tr>
              <td style={S.td}><T>Medios de pago</T></td>
              <td style={S.td}>
                Identificador de la transacción, monto, estado y lo que devuelve la pasarela.{" "}
                <T>El número de tarjeta no entra al sistema</T> (sección 7).
              </td>
            </tr>
            <tr>
              <td style={S.td}><T>Técnicos</T></td>
              <td style={S.td}>
                Registros de error de la aplicación y la bitácora de eventos del sistema (quién hizo qué y cuándo),
                necesarios para la seguridad y para corregir fallas.
              </td>
            </tr>
          </tbody>
        </table>
        <p style={S.p}>
          <T>Lo que GymPro no trata:</T> origen étnico o racial, creencias religiosas o filosóficas, afiliación
          sindical, opiniones políticas, preferencia sexual ni datos genéticos o biométricos. Tampoco accede a tus
          contactos, mensajes, archivos de audio ni a tu historial de navegación.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    titulo: "Para qué se usan",
    cuerpo: (
      <>
        <h3 style={S.h3}>Finalidades necesarias</h3>
        <p style={S.p}>Sin ellas no es posible darte el servicio:</p>
        <ul style={S.ul}>
          <li>Crear y administrar tu cuenta y mantener tu sesión de forma segura.</li>
          <li>Registrar y controlar tu membresía: altas, renovaciones, vigencias, avisos de vencimiento y entradas al gimnasio.</li>
          <li>Procesar y dejar constancia de pagos y compras, y emitir los comprobantes que el gimnasio deba conservar.</li>
          <li>Permitir que el personal autorizado de tu propio gimnasio te atienda.</li>
          <li>Enviarte avisos operativos del servicio (recuperación de contraseña, confirmaciones, vencimientos).</li>
          <li>Mantener la seguridad del sistema, prevenir usos indebidos y poder reconstruir incidentes.</li>
          <li>Cumplir las obligaciones legales, fiscales y contables aplicables.</li>
        </ul>
        <h3 style={S.h3}>Finalidades voluntarias</h3>
        <p style={S.p}>
          Requieren tu consentimiento y puedes retirarlo cuando quieras, sin perder el acceso al gimnasio:
        </p>
        <ul style={S.ul}>
          <li>Seguimiento de tu progreso físico y corporal, incluidas las fotos de progreso.</li>
          <li>Diseño de rutinas y planes de nutrición personalizados a partir de esos datos.</li>
          <li>Recordar tus preferencias de uso en el dispositivo, como el tema visual (sección 14).</li>
        </ul>
      </>
    ),
  },
  {
    id: "salud",
    titulo: "Datos de salud: consentimiento expreso",
    cuerpo: (
      <>
        <p style={S.p}>
          Los datos de salud son <T>datos sensibles</T> y reciben un trato aparte. El seguimiento físico es un módulo
          que <T>se activa por socio</T>: si no otorgas tu consentimiento, el sistema no te pide ni almacena medidas
          corporales, padecimientos ni fotos de progreso, y el resto de la plataforma funciona igual.
        </p>
        <ul style={S.ul}>
          <li>El consentimiento se registra con la fecha en que lo otorgaste, y se usa solo para la finalidad acotada del seguimiento físico y de las rutinas.</li>
          <li>Esta información la ve el personal autorizado de tu gimnasio que participa en tu atención (tu entrenador, por ejemplo), nunca otro gimnasio.</li>
          <li>Puedes retirar el consentimiento en cualquier momento desde tu perfil o pidiéndolo al gimnasio; al hacerlo se deja de tratar y se eliminan los datos de esa finalidad.</li>
        </ul>
      </>
    ),
  },
  {
    id: "automatizado",
    titulo: "Sugerencias automáticas y decisiones humanas",
    cuerpo: (
      <p style={S.p}>
        GymPro puede sugerir rutinas o ajustes a partir de tu historial. Esas sugerencias{" "}
        <T>siempre son revisables por tu entrenador</T>: ninguna decisión que te afecte se aplica de forma
        automática, sin intervención de una persona. Puedes oponerte a que tus datos se usen para generar estas
        sugerencias; en ese caso el seguimiento sigue siendo manual.
      </p>
    ),
  },
  {
    id: "pagos",
    titulo: "Pagos: tu tarjeta no pasa por GymPro",
    cuerpo: (
      <>
        <p style={S.p}>
          Cuando pagas en línea, GymPro te redirige a <T>PayPal</T> o a <T>Mercado Pago</T>, que capturan los datos de
          tu tarjeta en sus propias páginas y bajo su propia certificación. GymPro <T>no almacena, no procesa y no
          transmite</T> el número de tarjeta, su fecha de vencimiento ni su código de seguridad; es una decisión de
          diseño alineada con el estándar PCI DSS 4.0.1.
        </p>
        <p style={S.p}>
          De cada operación el sistema conserva únicamente el identificador de la transacción, el monto, el método, el
          estado y la referencia que devuelve la pasarela. El estado del pago se confirma consultándolo contra la
          pasarela y validando la firma de su notificación, no a partir de la página de retorno. Los pagos en efectivo
          o por transferencia que registra el gimnasio quedan como movimientos en tu historial.
        </p>
        <p style={S.p}>
          El tratamiento que PayPal y Mercado Pago hacen de tus datos se rige por sus propios avisos de privacidad.
        </p>
      </>
    ),
  },
  {
    id: "comparte",
    titulo: "Con quién se comparten",
    cuerpo: (
      <>
        <ul style={S.ul}>
          <li><T>El personal autorizado de tu gimnasio</T>, en lo necesario para atenderte. El sistema filtra toda consulta por el gimnasio de quien la hace y, si no puede determinarlo, niega el acceso en lugar de concederlo.</li>
          <li><T>Pasarelas de pago</T> (PayPal, Mercado Pago), solo los datos indispensables para cobrar.</li>
          <li><T>Proveedor de infraestructura</T> donde se aloja la plataforma, que actúa como encargado y no usa los datos para fines propios.</li>
          <li><T>Servicio de correo</T> empleado para enviarte los avisos operativos y los reportes que el gimnasio configure.</li>
          <li><T>Autoridades competentes</T>, cuando exista un requerimiento o una obligación legal.</li>
        </ul>
        <p style={S.p}>
          No se realizan transferencias de datos que requieran tu consentimiento conforme a la ley. Si en el futuro
          fueran necesarias, se te informará y se te pedirá antes de llevarlas a cabo.
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    titulo: "Cómo se protegen",
    cuerpo: (
      <>
        <ul style={S.ul}>
          <li>Cifrado del tráfico con HTTPS y certificado vigente en el dominio del servicio.</li>
          <li>Contraseñas guardadas como resumen criptográfico; nunca viajan ni se almacenan en claro.</li>
          <li>Sesión con vida corta y renovación rotativa: reutilizar un token de renovación invalida la sesión completa, y al cerrar sesión se revoca en el servidor.</li>
          <li>Credenciales de las pasarelas de cobro cifradas en reposo y fuera del código fuente.</li>
          <li>Aislamiento entre gimnasios aplicado en el servidor, no en la pantalla, y verificado con pruebas dedicadas a intentar romperlo.</li>
          <li>Bitácora de eventos con actor, acción y momento, que permite reconstruir qué ocurrió y quién lo hizo.</li>
          <li>Tipografías y recursos servidos desde el propio dominio: la plataforma no pide archivos a terceros que pudieran registrar tu dirección IP.</li>
          <li>Respaldos verificados por restauración antes de cualquier migración de datos.</li>
          <li>Límite de intentos de inicio de sesión y revisión de código obligatoria antes de liberar un cambio.</li>
          <li>
            Control de altas repetidas <strong>solo en el registro de un gimnasio nuevo</strong>: para evitar que una
            misma persona abra varias cuentas gratuitas, en esa petición —y únicamente en esa— se calcula en tu
            navegador un identificador técnico del equipo (idioma, zona horaria, resolución de pantalla y número de
            núcleos) y se envía convertido en un resumen criptográfico. El servidor nunca recibe esos valores, solo el
            resumen; no se usan canvas, WebGL ni tipografías instaladas, y <strong>no sirve para seguir tu navegación,
            perfilarte ni mostrarte publicidad</strong>. Se conserva junto con tu correo y teléfono en forma
            normalizada —no en claro— y con la dirección IP de la que salió el registro.
          </li>
        </ul>
        <p style={S.p}>
          Ninguna medida es infalible. Si ocurriera una vulneración que afecte de forma significativa tus datos, el
          gimnasio responsable te lo comunicará para que puedas tomar medidas, y la bitácora permite determinar el
          alcance real del incidente.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    titulo: "Cuánto tiempo se conservan",
    cuerpo: (
      <>
        <table style={S.tabla}>
          <thead>
            <tr>
              <th style={S.th}>Información</th>
              <th style={S.th}>Plazo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Tu cuenta y tu actividad en el gimnasio</td>
              <td style={S.td}>Mientras la cuenta esté activa.</td>
            </tr>
            <tr>
              <td style={S.td}>Datos de salud y fotos de progreso</td>
              <td style={S.td}>Mientras mantengas el consentimiento; se eliminan al retirarlo.</td>
            </tr>
            <tr>
              <td style={S.td}>Comprobantes de pago</td>
              <td style={S.td}>Hasta cinco años, mientras lo exijan las obligaciones fiscales y contables del gimnasio.</td>
            </tr>
            <tr>
              <td style={S.td}>Bitácora de eventos</td>
              <td style={S.td}>El tiempo necesario para fines de seguridad y auditoría.</td>
            </tr>
            <tr>
              <td style={S.td}>Respaldos</td>
              <td style={S.td}>
                Un dato eliminado puede permanecer en un respaldo hasta que ese respaldo se sobrescribe en su ciclo
                normal; no se restaura para volver a usarlo.
              </td>
            </tr>
          </tbody>
        </table>
        <p style={S.p}>
          La <T>baja permanente</T> purga tus registros asociados y deja constancia del hecho sin conservar el dato
          cancelado.
        </p>
      </>
    ),
  },
  {
    id: "eliminar-cuenta",
    titulo: "Si cancelas tu plan o eliminas tu cuenta",
    cuerpo: (
      <>
        <p style={S.p}>
          Son dos cosas distintas y conviene no confundirlas. Un propietario puede hacer ambas desde{" "}
          <T>Suscripción → Cuenta y datos</T> en su panel.
        </p>
        <h3 style={S.h3}>Cancelar la suscripción</h3>
        <ul style={S.ul}>
          <li>El servicio sigue funcionando hasta el final del periodo que ya pagaste; a partir de esa fecha el gimnasio queda sin plan y las funciones de pago se desactivan.</li>
          <li><T>No se borra nada.</T> La información del gimnasio y de sus socios se conserva, y puedes volver a contratar y seguir donde te quedaste.</li>
          <li>Se cancela también el cargo automático con la pasarela, para que no vuelva a cobrarte.</li>
          <li>Puedes reactivar la suscripción antes de la fecha de corte y no pasa nada.</li>
        </ul>
        <h3 style={S.h3}>Eliminar la cuenta y los datos del gimnasio</h3>
        <p style={S.destacado}>
          La eliminación es <T>definitiva e irreversible</T>: borra el gimnasio y todos sus datos en la plataforma, no
          solo el acceso. Antes de confirmarla el sistema te muestra exactamente cuántos registros se eliminarán y te
          ofrece descargar una copia.
        </p>
        <ul style={S.ul}>
          <li>Se elimina: el gimnasio y sus sucursales, las cuentas de su personal, el padrón de socios con sus membresías y asistencias, rutinas, planes de nutrición, progreso y fotos, productos, ventas, pagos registrados, reportes configurados y las credenciales de las pasarelas.</li>
          <li>Se conserva: la constancia de que la baja ocurrió (sin los datos cancelados) y los comprobantes que la legislación fiscal obligue a mantener, en poder de quien tenga esa obligación.</li>
          <li>Las personas con cuenta en ese gimnasio pierden el acceso y sus datos asociados se eliminan con él.</li>
          <li>
            La eliminación se <T>programa con 30 días de margen</T>. Durante ese plazo todo sigue funcionando y puedes
            cancelarla con un clic desde el mismo panel; al cumplirse la fecha, la purga se ejecuta y ya no hay vuelta
            atrás.
          </li>
          <li>Antes de programarla puedes <T>descargar una copia</T> de la información del gimnasio en formato JSON.</li>
        </ul>
        <p style={S.p}>
          Si eres socio y solo quieres que tus datos dejen de tratarse, no necesitas que el gimnasio se elimine:
          pídele la baja permanente de tu cuenta (sección 12).
        </p>
      </>
    ),
  },
  {
    id: "derechos",
    titulo: "Tus derechos (ARCO) y cómo ejercerlos",
    cuerpo: (
      <>
        <p style={S.p}>Puedes, en todo momento:</p>
        <ul style={S.ul}>
          <li><T>Acceder</T> a tus datos y saber qué se hace con ellos: están visibles en tu perfil dentro de la app y del portal.</li>
          <li><T>Rectificar</T> lo que esté incorrecto o desactualizado: editable desde tu perfil o solicitándolo en recepción.</li>
          <li><T>Cancelar</T> el tratamiento y pedir la baja permanente de tu cuenta y de los datos asociados.</li>
          <li><T>Oponerte</T> a un uso concreto, como el seguimiento físico o las sugerencias automáticas.</li>
          <li><T>Revocar tu consentimiento</T> para las finalidades voluntarias, sin que eso afecte tu acceso al gimnasio.</li>
        </ul>
        <p style={S.p}>
          Dirige tu solicitud al <T>gimnasio en el que estás inscrito</T>, que es el responsable: puede atenderla desde
          la administración del sistema. También puedes escribir a <T>{CORREO_SOPORTE}</T> y PanTech la canalizará al
          gimnasio y dará apoyo técnico. Indica tu nombre, el gimnasio, un medio de contacto y qué derecho quieres
          ejercer.
        </p>
        <p style={S.p}>
          La cancelación de datos puede estar limitada por obligaciones legales de conservación (sección 10). Si
          consideras que tu derecho no fue atendido, puedes acudir a la <T>{AUTORIDAD_DATOS}</T>.
        </p>
      </>
    ),
  },
  {
    id: "menores",
    titulo: "Menores de edad",
    cuerpo: (
      <p style={S.p}>
        GymPro no está dirigido a menores de edad que actúen por su cuenta. Si un gimnasio inscribe a un menor, el
        registro y el consentimiento —incluido el de los datos de salud— los debe otorgar su padre, madre o tutor
        legal, y es el gimnasio quien lo recaba y acredita. PanTech no recaba intencionalmente datos de menores fuera
        de ese contexto supervisado.
      </p>
    ),
  },
  {
    id: "cookies",
    titulo: "Cookies y almacenamiento local",
    cuerpo: (
      <>
        <p style={S.p}>
          No se utilizan cookies de rastreo, analítica ni publicidad de terceros, y la plataforma no carga recursos de
          servidores ajenos: las tipografías se sirven desde el propio dominio. El registro de un gimnasio nuevo
          calcula un identificador técnico del equipo que no se guarda en tu navegador ni se usa para seguirte
          (se explica en «Cómo se protegen»). Esto es lo único que se guarda en tu navegador:
        </p>
        <table style={S.tabla}>
          <thead>
            <tr>
              <th style={S.th}>Categoría</th>
              <th style={S.th}>Qué guarda y por cuánto tiempo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><T>Necesarias</T><br /><span style={{ fontSize: 12.5 }}>siempre activas</span></td>
              <td style={S.td}>
                Cookies HttpOnly de acceso (<code>access_token_cookie</code>, 8 horas) y de renovación
                (<code>refresh_token_cookie</code>, hasta 90 días) que mantienen tu sesión iniciada, junto con tu
                sesión y perfil básico en el almacenamiento local del navegador. Se eliminan al cerrar sesión (la
                renovación también se revoca en el servidor). Se guarda además tu elección de cookies
                (<code>gympro_consentimiento</code>).
              </td>
            </tr>
            <tr>
              <td style={S.td}><T>Preferencias</T><br /><span style={{ fontSize: 12.5 }}>opcionales</span></td>
              <td style={S.td}>
                El tema visual que elijas (<code>theme</code>), solo si las aceptas. Si las rechazas, la app funciona
                igual pero no recuerda esa preferencia.
              </td>
            </tr>
          </tbody>
        </table>
        <p style={S.p}>
          Al pagar con PayPal o Mercado Pago eres dirigido a sus sitios, que aplican sus propias políticas de cookies.
        </p>
        <p style={S.p}>
          Puedes cambiar tu elección en cualquier momento:{" "}
          <button type="button" onClick={abrirConfiguracionCookies} style={S.linkBtn}>Configurar cookies</button>.
        </p>
      </>
    ),
  },
  {
    id: "accesibilidad",
    titulo: "Accesibilidad",
    cuerpo: (
      <p style={S.p}>
        GymPro se desarrolla con el compromiso de cumplir las Pautas de Accesibilidad para el Contenido Web
        (WCAG) 2.1 en nivel AA: contraste mínimo de texto, uso completo con teclado, foco visible, áreas táctiles
        amplias en la app y mensajes de error junto al campo que los origina. Si encuentras una barrera para usar el
        sistema, escríbenos a {CORREO_SOPORTE} y la atenderemos como un defecto del producto.
      </p>
    ),
  },
  {
    id: "cambios",
    titulo: "Cambios a este aviso",
    cuerpo: (
      <p style={S.p}>
        Este aviso puede actualizarse cuando cambie la plataforma, el marco normativo o la forma en que se tratan los
        datos. Cada versión lleva número y fecha —la vigente es la <T>versión {VERSION_AVISO}, del {FECHA_AVISO}</T>—
        y se publica en esta misma página; al iniciar sesión se te pide confirmar que lo conoces y queda registrado
        qué versión aceptaste y cuándo. Si un cambio afecta las finalidades voluntarias o implica un tratamiento
        nuevo, se te pedirá tu consentimiento antes de aplicarlo.
      </p>
    ),
  },
  {
    id: "contacto",
    titulo: "Contacto",
    cuerpo: (
      <>
        <p style={S.p}>¿Dudas sobre el manejo de tus datos o quieres ejercer un derecho? Escríbenos:</p>
        <p style={{ margin: "0 0 6px" }}>
          <a href={`mailto:${CORREO_SOPORTE}`} style={S.contactBox}>
            <FiMail /> {CORREO_SOPORTE}
          </a>
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LayoutLegal
      icono={<FiShield size={30} color="var(--accent, #00FFA3)" />}
      titulo="Aviso de Privacidad"
      descripcion={
        "Qué datos recoge GymPro, para qué se usan, quién responde por ellos y cómo puedes decidir sobre tu "
        + "información. Está escrito para leerse: si solo buscas un punto, usa el índice."
      }
      version={VERSION_AVISO}
      fecha={FECHA_AVISO}
      secciones={secciones}
    />
  );
}
