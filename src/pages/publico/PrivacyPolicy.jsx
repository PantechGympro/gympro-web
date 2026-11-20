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
 *  · LFPDPPP vigente (DOF 20/03/2025) y autoridad actual, no el INAI.
 *  · Reparto real de figuras: el gimnasio es RESPONSABLE, PanTech ENCARGADO.
 *  · Finalidades necesarias y voluntarias diferenciadas, como exige la ley.
 *  · Datos de salud como dato SENSIBLE, con consentimiento expreso y módulo
 *    que se activa por socio.
 *  · PCI DSS 4.0.1 por redirección: el número de tarjeta no entra al sistema.
 *  · Derechos ARCO con la vía concreta dentro del producto, no solo un correo.
 */
export default function PrivacyPolicy() {
  return (
    <LayoutLegal
      icono={<FiShield size={28} color="var(--accent, #00FFA3)" />}
      titulo="Aviso de Privacidad"
      version={VERSION_AVISO}
      fecha={FECHA_AVISO}
    >
      <div style={S.card}>
        <h2 style={S.h2}>1. Qué es este documento</h2>
        <p style={S.p}>
          Este Aviso de Privacidad explica qué datos personales trata <strong style={S.strong}>GymPro</strong> —la
          plataforma web y la aplicación móvil de gestión de gimnasios desarrollada por PanTech—, para qué se usan,
          con quién se comparten, cómo se protegen y qué puedes hacer tú al respecto. Aplica a todas las personas que
          usan el sistema: socios, entrenadores, recepción, administradores y propietarios de gimnasios.
        </p>
        <p style={S.p}>
          Se emite conforme a la <strong style={S.strong}>{LEY_DATOS}</strong> ({LEY_DATOS_DOF}), que sustituyó a la
          ley de 2010. La autoridad competente en la materia es la <strong style={S.strong}>{AUTORIDAD_DATOS}</strong>.
          Las condiciones de uso del servicio están en los{" "}
          <Link to="/terminos" style={S.enlace}>Términos y Condiciones</Link>.
        </p>
      </div>

      <div style={S.card} id="responsable">
        <h2 style={S.h2}>2. Quién responde por tus datos</h2>
        <p style={S.destacado}>
          <strong style={S.strong}>Tu gimnasio es el responsable</strong> de tus datos: es quien decide qué información
          te pide y para qué la usa. <strong style={S.strong}>PanTech es el encargado</strong>: opera la plataforma por
          cuenta de ese gimnasio y trata tus datos únicamente siguiendo sus instrucciones y lo descrito en este aviso.
        </p>
        <p style={S.p}>La distinción no es un trámite; define a quién acudir:</p>
        <ul style={S.ul}>
          <li>
            Si eres <strong style={S.strong}>socio o personal de un gimnasio</strong>, el responsable es ese gimnasio.
            Tus solicitudes sobre tus datos se atienden ahí, con las herramientas que GymPro le entrega. PanTech apoya
            al gimnasio, pero no decide por él qué datos se piden ni los usa para fines propios.
          </li>
          <li>
            Si eres <strong style={S.strong}>propietario de un gimnasio</strong> y contratas GymPro, PanTech es
            responsable de los datos de tu cuenta de cliente (nombre, correo, teléfono, datos de facturación y de la
            suscripción) y encargado respecto de los datos de tus socios.
          </li>
        </ul>
        <p style={S.p}>
          PanTech <strong style={S.strong}>no vende ni renta datos personales</strong>, no los usa con fines
          publicitarios y no los comparte con otros gimnasios: cada gimnasio ve exclusivamente su propia información.
        </p>
      </div>

      <div style={S.card} id="datos">
        <h2 style={S.h2}>3. Qué datos se tratan</h2>
        <p style={S.p}>Solo se piden los datos que una operación real del gimnasio utiliza. Por categoría:</p>
        <ul style={S.ul}>
          <li><strong style={S.strong}>Identificación.</strong> Nombre, fecha de nacimiento, sexo y fotografía de perfil.</li>
          <li><strong style={S.strong}>Contacto.</strong> Teléfono, correo electrónico y, si el gimnasio lo registra, domicilio.</li>
          <li>
            <strong style={S.strong}>Salud y estado físico (dato sensible).</strong> Peso, estatura, índice de masa
            corporal, medidas corporales, porcentaje de grasa, fotos de progreso y los padecimientos o lesiones que
            declares a tu entrenador. Requiere tu consentimiento expreso (sección 5).
          </li>
          <li><strong style={S.strong}>Autenticación.</strong> Correo, contraseña y tokens de sesión. La contraseña se guarda como resumen criptográfico (hash), nunca en claro ni de forma reversible.</li>
          <li><strong style={S.strong}>Operación.</strong> Asistencias y entradas al gimnasio, rutinas asignadas, entrenamientos registrados, planes de nutrición, membresías, pagos y compras en el punto de venta.</li>
          <li><strong style={S.strong}>Medios de pago.</strong> Identificador de la transacción, monto, estado y lo que devuelve la pasarela. <strong style={S.strong}>El número de tarjeta no entra al sistema</strong> (sección 7).</li>
          <li><strong style={S.strong}>Técnicos y de diagnóstico.</strong> Registros de error de la aplicación y la bitácora de eventos del sistema (quién hizo qué y cuándo), necesarios para la seguridad y para corregir fallas.</li>
        </ul>
        <p style={S.p}>
          <strong style={S.strong}>Lo que GymPro no trata:</strong> origen étnico o racial, creencias religiosas o
          filosóficas, afiliación sindical, opiniones políticas, preferencia sexual ni datos genéticos o biométricos.
          Tampoco accede a tus contactos, mensajes, archivos de audio ni a tu historial de navegación.
        </p>
      </div>

      <div style={S.card} id="finalidades">
        <h2 style={S.h2}>4. Para qué se usan</h2>
        <p style={S.p}>
          <strong style={S.strong}>Finalidades necesarias</strong> — sin ellas no es posible darte el servicio:
        </p>
        <ul style={S.ul}>
          <li>Crear y administrar tu cuenta y mantener tu sesión de forma segura.</li>
          <li>Registrar y controlar tu membresía: altas, renovaciones, vigencias, avisos de vencimiento y entradas al gimnasio.</li>
          <li>Procesar y dejar constancia de pagos y compras, y emitir los comprobantes que el gimnasio deba conservar.</li>
          <li>Permitir que el personal autorizado de tu propio gimnasio te atienda.</li>
          <li>Enviarte avisos operativos del servicio (recuperación de contraseña, confirmaciones, vencimientos).</li>
          <li>Mantener la seguridad del sistema, prevenir usos indebidos y poder reconstruir incidentes.</li>
          <li>Cumplir las obligaciones legales, fiscales y contables aplicables.</li>
        </ul>
        <p style={S.p}>
          <strong style={S.strong}>Finalidades voluntarias</strong> — requieren tu consentimiento y puedes retirarlo
          cuando quieras sin perder el acceso al gimnasio:
        </p>
        <ul style={S.ul}>
          <li>Seguimiento de tu progreso físico y corporal, incluidas las fotos de progreso.</li>
          <li>Diseño de rutinas y planes de nutrición personalizados a partir de esos datos.</li>
          <li>Recordar tus preferencias de uso en el dispositivo, como el tema visual (sección 11).</li>
        </ul>
      </div>

      <div style={S.card} id="salud">
        <h2 style={S.h2}>5. Datos de salud: consentimiento expreso</h2>
        <p style={S.p}>
          Los datos de salud son <strong style={S.strong}>datos sensibles</strong> y reciben un trato aparte. El
          seguimiento físico es un módulo que <strong style={S.strong}>se activa por socio</strong>: si no otorgas tu
          consentimiento, el sistema no te pide ni almacena medidas corporales, padecimientos ni fotos de progreso, y el
          resto de la plataforma funciona igual.
        </p>
        <ul style={S.ul}>
          <li>El consentimiento se registra con la fecha en que lo otorgaste, y se usa solo para la finalidad acotada del seguimiento físico y de las rutinas.</li>
          <li>Esta información la ve el personal autorizado de tu gimnasio que participa en tu atención (tu entrenador, por ejemplo), nunca otro gimnasio.</li>
          <li>Puedes retirar el consentimiento en cualquier momento desde tu perfil o pidiéndolo al gimnasio; al hacerlo se deja de tratar y se eliminan los datos de esa finalidad.</li>
        </ul>
      </div>

      <div style={S.card} id="automatizado">
        <h2 style={S.h2}>6. Sugerencias automáticas y decisiones humanas</h2>
        <p style={S.p}>
          GymPro puede sugerir rutinas o ajustes a partir de tu historial. Esas sugerencias
          <strong style={S.strong}> siempre son revisables por tu entrenador</strong>: ninguna decisión que te afecte
          se aplica de forma automática, sin intervención de una persona. Puedes oponerte a que tus datos se usen para
          generar estas sugerencias; en ese caso el seguimiento sigue siendo manual.
        </p>
      </div>

      <div style={S.card} id="pagos">
        <h2 style={S.h2}>7. Pagos: tu tarjeta no pasa por GymPro</h2>
        <p style={S.p}>
          Cuando pagas en línea, GymPro te redirige a <strong style={S.strong}>PayPal</strong> o a
          {" "}<strong style={S.strong}>Mercado Pago</strong>, que capturan los datos de tu tarjeta en sus propias
          páginas y bajo su propia certificación. GymPro <strong style={S.strong}>no almacena, no procesa y no
          transmite</strong> el número de tarjeta, su fecha de vencimiento ni su código de seguridad; es una decisión
          de diseño alineada con el estándar PCI DSS 4.0.1.
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
      </div>

      <div style={S.card} id="comparte">
        <h2 style={S.h2}>8. Con quién se comparten</h2>
        <ul style={S.ul}>
          <li><strong style={S.strong}>El personal autorizado de tu gimnasio</strong>, en lo necesario para atenderte. El sistema filtra toda consulta por el gimnasio de quien la hace y, si no puede determinarlo, niega el acceso en lugar de concederlo.</li>
          <li><strong style={S.strong}>Pasarelas de pago</strong> (PayPal, Mercado Pago), solo los datos indispensables para cobrar.</li>
          <li><strong style={S.strong}>Proveedor de infraestructura</strong> donde se aloja la plataforma, que actúa como encargado y no usa los datos para fines propios.</li>
          <li><strong style={S.strong}>Servicio de correo</strong> empleado para enviarte los avisos operativos y los reportes que el gimnasio configure.</li>
          <li><strong style={S.strong}>Autoridades competentes</strong>, cuando exista un requerimiento o una obligación legal.</li>
        </ul>
        <p style={S.p}>
          No se realizan transferencias de datos que requieran tu consentimiento conforme a la ley. Si en el futuro
          fueran necesarias, se te informará y se te pedirá antes de llevarlas a cabo.
        </p>
      </div>

      <div style={S.card} id="seguridad">
        <h2 style={S.h2}>9. Cómo se protegen</h2>
        <ul style={S.ul}>
          <li>Cifrado del tráfico con HTTPS y certificado vigente en el dominio del servicio.</li>
          <li>Contraseñas guardadas como resumen criptográfico; nunca viajan ni se almacenan en claro.</li>
          <li>Sesión con vida corta y renovación rotativa: reutilizar un token de renovación invalida la sesión completa, y al cerrar sesión se revoca en el servidor.</li>
          <li>Credenciales de las pasarelas de cobro cifradas en reposo y fuera del código fuente.</li>
          <li>Aislamiento entre gimnasios aplicado en el servidor, no en la pantalla, y verificado con pruebas dedicadas a intentar romperlo.</li>
          <li>Bitácora de eventos con actor, acción y momento, que permite reconstruir qué ocurrió y quién lo hizo.</li>
          <li>Respaldos verificados por restauración antes de cualquier migración de datos.</li>
          <li>Límite de intentos de inicio de sesión y revisión de código obligatoria antes de liberar un cambio.</li>
        </ul>
        <p style={S.p}>
          Ninguna medida es infalible. Si ocurriera una vulneración que afecte de forma significativa tus datos, el
          gimnasio responsable te lo comunicará para que puedas tomar medidas, y la bitácora permite determinar el
          alcance real del incidente.
        </p>
      </div>

      <div style={S.card} id="conservacion">
        <h2 style={S.h2}>10. Cuánto tiempo se conservan</h2>
        <ul style={S.ul}>
          <li>Mientras tu cuenta esté activa en el gimnasio, para poder prestarte el servicio.</li>
          <li>La <strong style={S.strong}>baja permanente</strong> purga tus registros asociados y deja constancia del hecho sin conservar el dato cancelado.</li>
          <li>Los comprobantes de pago pueden conservarse mientras lo exijan las obligaciones fiscales y contables del gimnasio (hasta cinco años, conforme a la legislación fiscal aplicable).</li>
          <li>La bitácora de eventos se conserva el tiempo necesario para fines de seguridad y auditoría.</li>
          <li>Un dato eliminado puede permanecer en un respaldo hasta que ese respaldo se sobrescribe en su ciclo normal; no se restaura para volver a usarlo.</li>
        </ul>
      </div>

      <div style={S.card} id="derechos">
        <h2 style={S.h2}>11. Tus derechos (ARCO) y cómo ejercerlos</h2>
        <p style={S.p}>Puedes, en todo momento:</p>
        <ul style={S.ul}>
          <li><strong style={S.strong}>Acceder</strong> a tus datos y saber qué se hace con ellos: están visibles en tu perfil dentro de la app y del portal.</li>
          <li><strong style={S.strong}>Rectificar</strong> lo que esté incorrecto o desactualizado: editable desde tu perfil o solicitándolo en recepción.</li>
          <li><strong style={S.strong}>Cancelar</strong> el tratamiento y pedir la baja permanente de tu cuenta y de los datos asociados.</li>
          <li><strong style={S.strong}>Oponerte</strong> a un uso concreto, como el seguimiento físico o las sugerencias automáticas.</li>
          <li><strong style={S.strong}>Revocar tu consentimiento</strong> para las finalidades voluntarias, sin que eso afecte tu acceso al gimnasio.</li>
        </ul>
        <p style={S.p}>
          Dirige tu solicitud al <strong style={S.strong}>gimnasio en el que estás inscrito</strong>, que es el
          responsable: puede atenderla desde la administración del sistema. También puedes escribir a{" "}
          <strong style={S.strong}>{CORREO_SOPORTE}</strong> y PanTech la canalizará al gimnasio y dará apoyo técnico.
          Indica tu nombre, el gimnasio, un medio de contacto y qué derecho quieres ejercer.
        </p>
        <p style={S.p}>
          La cancelación de datos puede estar limitada por obligaciones legales de conservación (sección 10). Si
          consideras que tu derecho no fue atendido, puedes acudir a la <strong style={S.strong}>{AUTORIDAD_DATOS}</strong>.
        </p>
      </div>

      <div style={S.card} id="menores">
        <h2 style={S.h2}>12. Menores de edad</h2>
        <p style={S.p}>
          GymPro no está dirigido a menores de edad que actúen por su cuenta. Si un gimnasio inscribe a un menor, el
          registro y el consentimiento —incluido el de los datos de salud— los debe otorgar su padre, madre o tutor
          legal, y es el gimnasio quien lo recaba y acredita. PanTech no recaba intencionalmente datos de menores
          fuera de ese contexto supervisado.
        </p>
      </div>

      <div style={S.card} id="cookies">
        <h2 style={S.h2}>13. Cookies y almacenamiento local</h2>
        <p style={S.p}>
          No se utilizan cookies de rastreo, analítica ni publicidad de terceros. Esto es lo único que se guarda en tu
          navegador:
        </p>
        <ul style={S.ul}>
          <li>
            <strong style={S.strong}>Necesarias (siempre activas).</strong> Cookies HttpOnly de acceso
            (<code>access_token_cookie</code>, 8 horas) y de renovación (<code>refresh_token_cookie</code>, hasta
            90 días) que mantienen tu sesión iniciada, junto con tu sesión y perfil básico en el almacenamiento local
            del navegador. Se eliminan al cerrar sesión (la renovación también se revoca en el servidor). Se guarda
            además tu elección de cookies (<code>gympro_consentimiento</code>).
          </li>
          <li>
            <strong style={S.strong}>Preferencias (opcionales, solo si las aceptas).</strong> El tema visual que elijas
            (<code>theme</code>). Si las rechazas, la app funciona igual pero no recuerda esa preferencia.
          </li>
        </ul>
        <p style={S.p}>
          Para mostrar la tipografía, las páginas cargan fuentes de Google Fonts, lo que implica una solicitud al
          servicio de Google (tu dirección IP y navegador). Al pagar con PayPal o Mercado Pago eres dirigido a sus
          sitios, que aplican sus propias políticas.
        </p>
        <p style={S.p}>
          Puedes cambiar tu elección en cualquier momento:{" "}
          <button type="button" onClick={abrirConfiguracionCookies} style={S.linkBtn}>Configurar cookies</button>.
        </p>
      </div>

      <div style={S.card} id="accesibilidad">
        <h2 style={S.h2}>14. Accesibilidad</h2>
        <p style={S.p}>
          GymPro se desarrolla con el compromiso de cumplir las Pautas de Accesibilidad para el Contenido Web
          (WCAG) 2.1 en nivel AA: contraste mínimo de texto, uso completo con teclado, foco visible, áreas táctiles
          amplias en la app y mensajes de error junto al campo que los origina. Si encuentras una barrera para usar el
          sistema, escríbenos a {CORREO_SOPORTE} y la atenderemos como un defecto del producto.
        </p>
      </div>

      <div style={S.card} id="cambios">
        <h2 style={S.h2}>15. Cambios a este aviso</h2>
        <p style={S.p}>
          Este aviso puede actualizarse cuando cambie la plataforma, el marco normativo o la forma en que se tratan los
          datos. Cada versión lleva número y fecha —la vigente es la{" "}
          <strong style={S.strong}>versión {VERSION_AVISO}, del {FECHA_AVISO}</strong>— y se publica en esta misma
          página. Si un cambio afecta las finalidades voluntarias o implica un tratamiento nuevo, se te informará y se
          te pedirá tu consentimiento antes de aplicarlo.
        </p>
      </div>

      <div style={{ ...S.card, textAlign: "center" }}>
        <h2 style={S.h2}>16. Contacto</h2>
        <p style={S.p}>¿Dudas sobre el manejo de tus datos o quieres ejercer un derecho? Escríbenos:</p>
        <a href={`mailto:${CORREO_SOPORTE}`} style={S.contactBox}>
          <FiMail /> {CORREO_SOPORTE}
        </a>
        <p style={{ ...S.p, marginTop: 16, marginBottom: 0 }}>
          Consulta también los <Link to="/terminos" style={S.enlace}>Términos y Condiciones</Link> del servicio.
        </p>
      </div>
    </LayoutLegal>
  );
}
