import { Link } from "react-router-dom";
import { FiFileText, FiMail } from "react-icons/fi";
import LayoutLegal, { S } from "./LayoutLegal";
import { VERSION_TERMINOS, FECHA_TERMINOS, CORREO_SOPORTE } from "../../constants/legal";

/**
 * Términos y Condiciones de uso de GymPro.
 *
 * Complementa el Aviso de Privacidad: aquí van las reglas del servicio (qué es
 * GymPro, quién contrata, qué puede hacer cada rol, cómo se cobra la
 * suscripción, de quién es el software y de quién son los datos, cómo se
 * cancela y los límites de responsabilidad). Se mantiene pegado a lo que el
 * sistema hace hoy -- SaaS por suscripción, cobro por redirección a PayPal o
 * Mercado Pago, una sola instalación multiinquilino -- sin prometer niveles de
 * servicio que todavía no están contratados.
 */

const T = ({ children }) => <strong style={S.strong}>{children}</strong>;

const secciones = [
  {
    id: "que-es",
    titulo: "Qué es GymPro y quién lo presta",
    cuerpo: (
      <>
        <p style={S.p}>
          GymPro es un sistema de gestión para gimnasios, formado por una plataforma web y una aplicación móvil,
          desarrollado y operado por <T>PanTech</T> bajo el modelo de software como servicio: no se vende una licencia
          ni un equipo, se da acceso continuo a una plataforma alojada y mantenida por PanTech a cambio de una
          suscripción.
        </p>
        <p style={S.p}>
          Al crear una cuenta o usar el sistema aceptas estos Términos y el{" "}
          <Link to="/privacidad" style={S.enlace}>Aviso de Privacidad</Link>. Si no estás de acuerdo con ellos, no uses
          la plataforma.
        </p>
      </>
    ),
  },
  {
    id: "partes",
    titulo: "Quién contrata y quién usa",
    cuerpo: (
      <>
        <p style={S.destacado}>
          El <T>gimnasio</T> es quien contrata GymPro y administra su propio espacio dentro del sistema. Los{" "}
          <T>socios y el personal</T> usan la plataforma dentro de ese espacio, con la cuenta que el gimnasio les da
          de alta o que ellos crean al inscribirse.
        </p>
        <ul style={S.ul}>
          <li>La relación comercial por el servicio del gimnasio (mensualidades, acceso a las instalaciones, clases, entrenadores) es entre el socio y su gimnasio. PanTech no es parte de ella.</li>
          <li>El gimnasio decide qué personal tiene cada rol y qué puede ver o modificar; GymPro aplica esos permisos, pero no decide por el gimnasio.</li>
          <li>PanTech puede acceder a la información del gimnasio únicamente para operar, respaldar y dar soporte a la plataforma.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cuenta",
    titulo: "Tu cuenta",
    cuerpo: (
      <ul style={S.ul}>
        <li>Los datos que registres deben ser verdaderos y mantenerse actualizados.</li>
        <li>Tu cuenta es personal: no la compartas ni cedas tus credenciales. Las acciones hechas con tu cuenta se registran en la bitácora del sistema a tu nombre.</li>
        <li>Si el sistema te asigna o restablece una contraseña, deberás cambiarla al entrar por primera vez.</li>
        <li>Avísanos de inmediato si crees que alguien más está usando tu cuenta, para revocar sus sesiones.</li>
        <li>Debes ser mayor de edad para abrir una cuenta por tu cuenta; el registro de un menor lo realiza el gimnasio con el consentimiento de su padre, madre o tutor.</li>
      </ul>
    ),
  },
  {
    id: "uso",
    titulo: "Uso aceptable",
    cuerpo: (
      <>
        <p style={S.p}>Al usar GymPro te comprometes a no:</p>
        <ul style={S.ul}>
          <li>Intentar acceder a datos de otro gimnasio, de otro usuario o a funciones que tu rol no tiene asignadas.</li>
          <li>Sondear, vulnerar o sobrecargar la plataforma, ni eludir sus controles de acceso, sus límites de uso o sus registros.</li>
          <li>Subir contenido ilícito, ofensivo, o fotos de otras personas sin su autorización; el chat y las fotos de progreso son para fines del entrenamiento.</li>
          <li>Usar el sistema para enviar publicidad no solicitada o para extraer datos de forma masiva o automatizada.</li>
          <li>Copiar, descompilar o redistribuir el software, ni usarlo para crear un servicio competidor.</li>
        </ul>
        <p style={S.p}>
          El incumplimiento puede llevar a la suspensión de la cuenta —o del chat, cuando el abuso se dé ahí— por
          parte del gimnasio o de PanTech, sin perjuicio de las acciones legales que correspondan.
        </p>
      </>
    ),
  },
  {
    id: "pagos",
    titulo: "Suscripción, pagos y cobros",
    cuerpo: (
      <ul style={S.ul}>
        <li>La suscripción del gimnasio se contrata por periodos (mensual o anual) y da acceso a las funciones del plan elegido. Los límites de cada plan —sucursales, usuarios y funciones— se muestran dentro del sistema antes de contratar.</li>
        <li>Los pagos en línea se procesan por redirección a <T>PayPal</T> o <T>Mercado Pago</T>. GymPro no captura ni almacena datos de tarjetas; esas plataformas aplican sus propios términos y comisiones.</li>
        <li>Un pago se considera aplicado cuando la pasarela lo confirma. Si la confirmación no llega, el sistema la reconsulta; un pago declarado por el socio queda pendiente hasta que el gimnasio lo verifique.</li>
        <li>Si activas el <T>cargo recurrente</T>, la pasarela cobrará automáticamente cada periodo hasta que lo canceles desde el panel. Cancelarlo no cancela el plan: el servicio sigue hasta la fecha ya pagada.</li>
        <li>La falta de pago puede limitar el acceso a las funciones del plan. Antes de suspender el servicio se avisa al propietario, y los datos del gimnasio no se eliminan por esa causa sin notificación previa.</li>
        <li>El cobro de membresías, productos y servicios a los socios lo define y lo realiza cada gimnasio, incluidas sus políticas de devolución. Las aclaraciones sobre esos cobros se atienden en el gimnasio.</li>
      </ul>
    ),
  },
  {
    id: "propiedad",
    titulo: "De quién es el software y de quién son los datos",
    cuerpo: (
      <ul style={S.ul}>
        <li><T>El software es de PanTech.</T> El código, el diseño, la marca GymPro y la documentación son propiedad de PanTech. La suscripción otorga un derecho de uso, limitado y no exclusivo, mientras esté vigente.</li>
        <li><T>Los datos del gimnasio son del gimnasio.</T> PanTech los trata como encargado, conforme al Aviso de Privacidad, y no los usa para fines propios.</li>
        <li><T>Lo que subes sigue siendo tuyo.</T> Al subir fotos, videos, rutinas o textos concedes a PanTech y a tu gimnasio el permiso necesario para almacenarlos y mostrarlos dentro de la plataforma con la finalidad del servicio, y nada más.</li>
        <li>El propietario puede descargar una copia de la información de su gimnasio en cualquier momento desde el panel, y se le ofrece antes de eliminar la cuenta.</li>
      </ul>
    ),
  },
  {
    id: "salud",
    titulo: "GymPro no da consejo médico",
    cuerpo: (
      <p style={S.p}>
        Las rutinas, planes de nutrición, metas y sugerencias que ofrece el sistema son herramientas de apoyo para el
        personal del gimnasio y <T>no constituyen diagnóstico, tratamiento ni asesoría médica</T>. Las sugerencias
        automáticas siempre las revisa un entrenador antes de aplicarse. Consulta a un profesional de la salud antes
        de iniciar o cambiar un programa de ejercicio o alimentación, sobre todo si tienes una condición médica, estás
        en rehabilitación o te encuentras embarazada. Ante una urgencia, acude a servicios médicos.
      </p>
    ),
  },
  {
    id: "disponibilidad",
    titulo: "Disponibilidad y cambios en el servicio",
    cuerpo: (
      <ul style={S.ul}>
        <li>PanTech trabaja para mantener GymPro disponible, pero el servicio puede interrumpirse por mantenimiento, actualizaciones, fallas de terceros (red, servidor, pasarelas) o causas de fuerza mayor.</li>
        <li>El mantenimiento programado se avisa con anticipación cuando implique una interrupción perceptible.</li>
        <li>La plataforma evoluciona: pueden añadirse, modificarse o retirarse funciones. Si un cambio reduce de forma relevante lo contratado, se avisa al gimnasio.</li>
        <li>Las funciones que dependen de internet (cobro en línea, notificaciones, respaldo) requieren conexión; la app permite capturar sin conexión y sincroniza al recuperarla.</li>
      </ul>
    ),
  },
  {
    id: "cancelacion",
    titulo: "Cancelar el plan y eliminar la cuenta",
    cuerpo: (
      <>
        <p style={S.p}>
          El propietario puede hacer las dos cosas por su cuenta, sin pedírselo a nadie, desde{" "}
          <T>Suscripción → Cuenta y datos</T>. No son lo mismo:
        </p>
        <h3 style={S.h3}>Cancelar la suscripción</h3>
        <ul style={S.ul}>
          <li>El plan sigue activo hasta el final del periodo ya pagado; no hay devolución proporcional de lo pagado por el periodo en curso, salvo acuerdo expreso.</li>
          <li>Al llegar la fecha de corte, las funciones del plan se desactivan, pero <T>la información no se elimina</T> y puedes volver a contratar cuando quieras.</li>
          <li>También se cancela el cargo recurrente con la pasarela. Puedes reactivar la suscripción antes de la fecha de corte sin perder nada.</li>
        </ul>
        <h3 style={S.h3}>Eliminar la cuenta y los datos</h3>
        <p style={S.destacado}>
          La eliminación es <T>definitiva</T> y borra el gimnasio con todos sus datos, no solo el acceso. El sistema
          te muestra antes cuántos registros se eliminarán, te ofrece descargar una copia y exige tu contraseña para
          confirmar.
        </p>
        <ul style={S.ul}>
          <li>La eliminación se programa con <T>30 días</T> de margen. En ese plazo el servicio sigue funcionando y puedes cancelarla desde el mismo panel.</li>
          <li>Al cumplirse la fecha se purgan los datos del gimnasio y de las cuentas asociadas, en los términos de la sección 11 del Aviso de Privacidad.</li>
          <li>Solo el propietario puede eliminar la cuenta; un administrador de sucursal no puede.</li>
          <li>Eliminar la cuenta no cancela por sí mismo obligaciones de pago ya devengadas, ni libera al gimnasio de conservar lo que la ley le obligue a conservar.</li>
        </ul>
        <p style={S.p}>
          Un socio que solo quiera dejar de usar GymPro puede pedir la baja de su cuenta a su gimnasio, sin que eso
          afecte al resto.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidad",
    titulo: "Límites de responsabilidad",
    cuerpo: (
      <>
        <p style={S.p}>
          GymPro se proporciona tal como está disponible en cada momento. En la medida que la ley lo permita, PanTech
          no responde por:
        </p>
        <ul style={S.ul}>
          <li>Decisiones que el gimnasio o su personal tomen con la información del sistema, ni por la exactitud de los datos que ellos capturan.</li>
          <li>El servicio que el gimnasio presta a sus socios, ni por los cobros que realiza.</li>
          <li>Interrupciones o fallas atribuibles a terceros, a la red del usuario o a su dispositivo.</li>
          <li>Pérdidas derivadas del uso de credenciales compartidas o del incumplimiento de estos Términos.</li>
          <li>La pérdida de información causada por una eliminación de cuenta confirmada por el propio propietario.</li>
        </ul>
        <p style={S.p}>
          Nada de lo anterior limita las obligaciones de PanTech en materia de protección de datos personales ni los
          derechos que la ley reconoce al consumidor.
        </p>
      </>
    ),
  },
  {
    id: "terminacion",
    titulo: "Terminación por otras causas",
    cuerpo: (
      <ul style={S.ul}>
        <li>El gimnasio puede dar de baja a un socio o a un integrante de su personal cuando termine su relación con él.</li>
        <li>PanTech puede suspender o terminar el acceso ante un uso que ponga en riesgo la seguridad, la integridad de los datos de otros gimnasios o el cumplimiento de la ley, avisando al propietario salvo que la urgencia lo impida.</li>
        <li>Tras cualquier baja, la información se conserva o se elimina conforme a las secciones 10 y 11 del Aviso de Privacidad.</li>
      </ul>
    ),
  },
  {
    id: "cambios",
    titulo: "Cambios a estos Términos",
    cuerpo: (
      <p style={S.p}>
        Estos Términos pueden actualizarse. Cada versión lleva número y fecha —la vigente es la{" "}
        <T>versión {VERSION_TERMINOS}, del {FECHA_TERMINOS}</T>— y se publica en esta página. Si un cambio es
        relevante se avisará dentro del sistema o por correo; seguir usando GymPro después de esa fecha implica
        aceptarlo.
      </p>
    ),
  },
  {
    id: "ley",
    titulo: "Ley aplicable",
    cuerpo: (
      <p style={S.p}>
        Estos Términos se rigen por la legislación mexicana. Para cualquier controversia, las partes se someten a los
        tribunales competentes del Estado de México, sin perjuicio de que el usuario consumidor pueda acudir a las
        instancias de protección al consumidor que la ley le reconoce.
      </p>
    ),
  },
  {
    id: "contacto",
    titulo: "Contacto",
    cuerpo: (
      <>
        <p style={S.p}>¿Dudas sobre estos Términos? Escríbenos:</p>
        <p style={{ margin: "0 0 6px" }}>
          <a href={`mailto:${CORREO_SOPORTE}`} style={S.contactBox}>
            <FiMail /> {CORREO_SOPORTE}
          </a>
        </p>
      </>
    ),
  },
];

export default function TerminosCondiciones() {
  return (
    <LayoutLegal
      icono={<FiFileText size={30} color="var(--accent, #00FFA3)" />}
      titulo="Términos y Condiciones"
      descripcion={
        "Las reglas del servicio: quién contrata, qué puede hacer cada quien, cómo se cobra la suscripción, de "
        + "quién es el software y de quién son los datos, y cómo se cancela."
      }
      version={VERSION_TERMINOS}
      fecha={FECHA_TERMINOS}
      secciones={secciones}
    />
  );
}
