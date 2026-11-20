import { Link } from "react-router-dom";
import { FiFileText, FiMail } from "react-icons/fi";
import LayoutLegal, { S } from "./LayoutLegal";
import { VERSION_TERMINOS, FECHA_TERMINOS, CORREO_SOPORTE } from "../../constants/legal";

/**
 * Términos y Condiciones de uso de GymPro.
 *
 * Complementa el Aviso de Privacidad: aquí van las reglas del servicio (qué es
 * GymPro, quién contrata, qué puede hacer cada rol, cómo se cobra la
 * suscripción, de quién es el software y de quién son los datos, y los límites
 * de responsabilidad). Se mantiene pegado a lo que el sistema hace hoy
 * -- SaaS por suscripción mensual, cobro por redirección a PayPal o Mercado
 * Pago, una sola instalación multiinquilino -- sin prometer niveles de
 * servicio que todavía no están contratados.
 */
export default function TerminosCondiciones() {
  return (
    <LayoutLegal
      icono={<FiFileText size={28} color="var(--accent, #00FFA3)" />}
      titulo="Términos y Condiciones"
      version={VERSION_TERMINOS}
      fecha={FECHA_TERMINOS}
    >
      <div style={S.card}>
        <h2 style={S.h2}>1. Qué es GymPro y quién lo presta</h2>
        <p style={S.p}>
          GymPro es un sistema de gestión para gimnasios, formado por una plataforma web y una aplicación móvil,
          desarrollado y operado por <strong style={S.strong}>PanTech</strong> bajo el modelo de software como servicio:
          no se vende una licencia ni un equipo, se da acceso continuo a una plataforma alojada y mantenida por PanTech
          a cambio de una suscripción.
        </p>
        <p style={S.p}>
          Al crear una cuenta o usar el sistema aceptas estos Términos y el{" "}
          <Link to="/privacidad" style={S.enlace}>Aviso de Privacidad</Link>. Si no estás de acuerdo con ellos, no uses
          la plataforma.
        </p>
      </div>

      <div style={S.card} id="partes">
        <h2 style={S.h2}>2. Quién contrata y quién usa</h2>
        <p style={S.destacado}>
          El <strong style={S.strong}>gimnasio</strong> es quien contrata GymPro y administra su propio espacio dentro
          del sistema. Los <strong style={S.strong}>socios y el personal</strong> usan la plataforma dentro de ese
          espacio, con la cuenta que el gimnasio les da de alta o que ellos crean al inscribirse.
        </p>
        <ul style={S.ul}>
          <li>La relación comercial por el servicio del gimnasio (mensualidades, acceso a las instalaciones, clases, entrenadores) es entre el socio y su gimnasio. PanTech no es parte de ella.</li>
          <li>El gimnasio decide qué personal tiene cada rol y qué puede ver o modificar; GymPro aplica esos permisos, pero no decide por el gimnasio.</li>
          <li>PanTech puede acceder a la información del gimnasio únicamente para operar, respaldar y dar soporte a la plataforma.</li>
        </ul>
      </div>

      <div style={S.card} id="cuenta">
        <h2 style={S.h2}>3. Tu cuenta</h2>
        <ul style={S.ul}>
          <li>Los datos que registres deben ser verdaderos y mantenerse actualizados.</li>
          <li>Tu cuenta es personal: no la compartas ni cedas tus credenciales. Las acciones hechas con tu cuenta se registran en la bitácora del sistema a tu nombre.</li>
          <li>Si el sistema te asigna o restablece una contraseña, deberás cambiarla al entrar por primera vez.</li>
          <li>Avísanos de inmediato si crees que alguien más está usando tu cuenta, para revocar sus sesiones.</li>
          <li>Debes ser mayor de edad para abrir una cuenta por tu cuenta; el registro de un menor lo realiza el gimnasio con el consentimiento de su padre, madre o tutor.</li>
        </ul>
      </div>

      <div style={S.card} id="uso">
        <h2 style={S.h2}>4. Uso aceptable</h2>
        <p style={S.p}>Al usar GymPro te comprometes a no:</p>
        <ul style={S.ul}>
          <li>Intentar acceder a datos de otro gimnasio, de otro usuario o a funciones que tu rol no tiene asignadas.</li>
          <li>Sondear, vulnerar o sobrecargar la plataforma, ni eludir sus controles de acceso, sus límites de uso o sus registros.</li>
          <li>Subir contenido ilícito, ofensivo, o fotos de otras personas sin su autorización; el chat y las fotos de progreso son para fines del entrenamiento.</li>
          <li>Usar el sistema para enviar publicidad no solicitada o para extraer datos de forma masiva o automatizada.</li>
          <li>Copiar, descompilar o redistribuir el software, ni usarlo para crear un servicio competidor.</li>
        </ul>
        <p style={S.p}>
          El incumplimiento puede llevar a la suspensión de la cuenta —o del chat, cuando el abuso se dé ahí— por parte
          del gimnasio o de PanTech, sin perjuicio de las acciones legales que correspondan.
        </p>
      </div>

      <div style={S.card} id="pagos">
        <h2 style={S.h2}>5. Suscripción, pagos y cobros</h2>
        <ul style={S.ul}>
          <li>La suscripción del gimnasio se contrata por periodos y da acceso a las funciones del plan elegido. Los límites de cada plan (sucursales, usuarios y funciones) se muestran dentro del sistema antes de contratar.</li>
          <li>Los pagos en línea se procesan por redirección a <strong style={S.strong}>PayPal</strong> o <strong style={S.strong}>Mercado Pago</strong>. GymPro no captura ni almacena datos de tarjetas; esas plataformas aplican sus propios términos y comisiones.</li>
          <li>Un pago se considera aplicado cuando la pasarela lo confirma. Si la confirmación no llega, el sistema la reconsulta; un pago declarado por el socio queda pendiente hasta que el gimnasio lo verifique.</li>
          <li>La falta de pago de la suscripción puede limitar el acceso a las funciones del plan. Antes de suspender el servicio se avisa al propietario, y los datos del gimnasio no se eliminan por esa causa sin notificación previa.</li>
          <li>El cobro de membresías, productos y servicios a los socios lo define y lo realiza cada gimnasio, incluidas sus políticas de devolución. Las aclaraciones sobre esos cobros se atienden en el gimnasio.</li>
        </ul>
      </div>

      <div style={S.card} id="propiedad">
        <h2 style={S.h2}>6. De quién es el software y de quién son los datos</h2>
        <ul style={S.ul}>
          <li><strong style={S.strong}>El software es de PanTech.</strong> El código, el diseño, la marca GymPro y la documentación son propiedad de PanTech. La suscripción otorga un derecho de uso, limitado y no exclusivo, mientras esté vigente.</li>
          <li><strong style={S.strong}>Los datos del gimnasio son del gimnasio.</strong> PanTech los trata como encargado, conforme al Aviso de Privacidad, y no los usa para fines propios.</li>
          <li><strong style={S.strong}>Lo que subes sigue siendo tuyo.</strong> Al subir fotos, videos, rutinas o textos concedes a PanTech y a tu gimnasio el permiso necesario para almacenarlos y mostrarlos dentro de la plataforma con la finalidad del servicio, y nada más.</li>
          <li>Al terminar la suscripción, el gimnasio puede solicitar una copia de su información antes de que se elimine, en el plazo que se acuerde al cierre.</li>
        </ul>
      </div>

      <div style={S.card} id="salud">
        <h2 style={S.h2}>7. GymPro no da consejo médico</h2>
        <p style={S.p}>
          Las rutinas, planes de nutrición, metas y sugerencias que ofrece el sistema son herramientas de apoyo para el
          personal del gimnasio y <strong style={S.strong}>no constituyen diagnóstico, tratamiento ni asesoría
          médica</strong>. Las sugerencias automáticas siempre las revisa un entrenador antes de aplicarse. Consulta a
          un profesional de la salud antes de iniciar o cambiar un programa de ejercicio o alimentación, sobre todo si
          tienes una condición médica, estás en rehabilitación o te encuentras embarazada. Ante una urgencia, acude a
          servicios médicos.
        </p>
      </div>

      <div style={S.card} id="disponibilidad">
        <h2 style={S.h2}>8. Disponibilidad y cambios en el servicio</h2>
        <ul style={S.ul}>
          <li>PanTech trabaja para mantener GymPro disponible, pero el servicio puede interrumpirse por mantenimiento, actualizaciones, fallas de terceros (red, servidor, pasarelas) o causas de fuerza mayor.</li>
          <li>El mantenimiento programado se avisa con anticipación cuando implique una interrupción perceptible.</li>
          <li>La plataforma evoluciona: pueden añadirse, modificarse o retirarse funciones. Si un cambio reduce de forma relevante lo contratado, se avisa al gimnasio.</li>
          <li>Las funciones que dependen de internet (cobro en línea, notificaciones, respaldo) requieren conexión; la app permite capturar sin conexión y sincroniza al recuperarla.</li>
        </ul>
      </div>

      <div style={S.card} id="responsabilidad">
        <h2 style={S.h2}>9. Límites de responsabilidad</h2>
        <p style={S.p}>
          GymPro se proporciona tal como está disponible en cada momento. En la medida que la ley lo permita, PanTech no
          responde por:
        </p>
        <ul style={S.ul}>
          <li>Decisiones que el gimnasio o su personal tomen con la información del sistema, ni por la exactitud de los datos que ellos capturan.</li>
          <li>El servicio que el gimnasio presta a sus socios, ni por los cobros que realiza.</li>
          <li>Interrupciones o fallas atribuibles a terceros, a la red del usuario o a su dispositivo.</li>
          <li>Pérdidas derivadas del uso de credenciales compartidas o del incumplimiento de estos Términos.</li>
        </ul>
        <p style={S.p}>
          Nada de lo anterior limita las obligaciones de PanTech en materia de protección de datos personales ni los
          derechos que la ley reconoce al consumidor.
        </p>
      </div>

      <div style={S.card} id="terminacion">
        <h2 style={S.h2}>10. Terminación</h2>
        <ul style={S.ul}>
          <li>Puedes dejar de usar GymPro cuando quieras y pedir la baja de tu cuenta (ver sección 11 del Aviso de Privacidad).</li>
          <li>El gimnasio puede dar de baja a un socio o a un integrante de su personal cuando termine su relación con él.</li>
          <li>PanTech puede suspender o terminar el acceso ante un uso que ponga en riesgo la seguridad, la integridad de los datos de otros gimnasios o el cumplimiento de la ley.</li>
          <li>Tras la baja, la información se conserva o se elimina conforme a la sección 10 del Aviso de Privacidad.</li>
        </ul>
      </div>

      <div style={S.card} id="cambios">
        <h2 style={S.h2}>11. Cambios a estos Términos</h2>
        <p style={S.p}>
          Estos Términos pueden actualizarse. Cada versión lleva número y fecha —la vigente es la{" "}
          <strong style={S.strong}>versión {VERSION_TERMINOS}, del {FECHA_TERMINOS}</strong>— y se publica en esta
          página. Si un cambio es relevante se avisará dentro del sistema o por correo; seguir usando GymPro después de
          esa fecha implica aceptarlo.
        </p>
      </div>

      <div style={S.card} id="ley">
        <h2 style={S.h2}>12. Ley aplicable</h2>
        <p style={S.p}>
          Estos Términos se rigen por la legislación mexicana. Para cualquier controversia, las partes se someten a los
          tribunales competentes del Estado de México, sin perjuicio de que el usuario consumidor pueda acudir a las
          instancias de protección al consumidor que la ley le reconoce.
        </p>
      </div>

      <div style={{ ...S.card, textAlign: "center" }}>
        <h2 style={S.h2}>13. Contacto</h2>
        <p style={S.p}>¿Dudas sobre estos Términos? Escríbenos:</p>
        <a href={`mailto:${CORREO_SOPORTE}`} style={S.contactBox}>
          <FiMail /> {CORREO_SOPORTE}
        </a>
        <p style={{ ...S.p, marginTop: 16, marginBottom: 0 }}>
          Consulta también el <Link to="/privacidad" style={S.enlace}>Aviso de Privacidad</Link>.
        </p>
      </div>
    </LayoutLegal>
  );
}
