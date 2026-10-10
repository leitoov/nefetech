import React from 'react';
import { Icon } from '../components/common/Icon';

export function Terminos() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-2 text-zinc-900 text-sm font-semibold mb-2">
          <Icon name="gavel" size={20} />
          <span>Información Legal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
          Términos y Condiciones de Servicio
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Contenido */}
      <div className="space-y-8 text-zinc-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">1.</span> Aceptación de los Términos
          </h2>
          <p>
            Al acceder, navegar o utilizar los servicios y el sitio web de <strong className="text-zinc-900">Nefetech</strong>, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de los términos, te sugerimos no utilizar nuestros servicios ni plataformas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">2.</span> Servicios Ofrecidos
          </h2>
          <p>
            Nefetech brinda servicios especializados en desarrollo de software a medida, integración de herramientas basadas en Inteligencia Artificial (IA) y consultoría tecnológica. Los alcances específicos, cronogramas, entregables y presupuestos de cada proyecto se formalizarán en sus respectivas propuestas comerciales y contratos particulares.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">3.</span> Propiedad Intelectual y Derechos
          </h2>
          <p>
            Todo el código fuente, diseños, marcas, logos y material gráfico presente en este sitio web son propiedad exclusiva de Nefetech o de sus licenciantes y están protegidos por leyes de derechos de autor y propiedad intelectual. En los desarrollos a medida para clientes, la cesión de derechos de autor sobre el producto final se regirá según lo acordado explícitamente en el contrato de servicio correspondiente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">4.</span> Uso Aceptable y Responsabilidades
          </h2>
          <p>
            El usuario se compromete a no utilizar este sitio web ni los servicios tecnológicos prestados para:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-600">
            <li>Actividades ilícitas, fraudulentas o que vulneren derechos de terceros.</li>
            <li>Introducir virus, troyanos, gusanos u otro material tecnológicamente dañino.</li>
            <li>Intentar accesos no autorizados a servidores, bases de datos o infraestructuras de Nefetech.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">5.</span> Limitación de Responsabilidad
          </h2>
          <p>
            Nefetech se esfuerza por mantener una alta disponibilidad y precisión en toda la información provista; no obstante, los servicios y contenidos se ofrecen &quot;tal cual&quot; (as-is). Nefetech no será responsable por interrupciones ajenas a su control directo, fluctuaciones en servicios de terceros o pérdidas indirectas derivadas del uso del sitio web.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">6.</span> Modificaciones a los Términos
          </h2>
          <p>
            Nos reservamos el derecho de actualizar o modificar estos términos en cualquier momento con el fin de reflejar mejoras en los servicios o cambios regulatorios. Cualquier cambio entrará en vigor inmediatamente tras su publicación en esta página.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">7.</span> Contacto Legal
          </h2>
          <p>
            Si tienes dudas o consultas sobre estos Términos y Condiciones, puedes ponerte en contacto con nosotros escribiendo a <a href="mailto:comercial@nefetech.online" className="text-zinc-900 underline font-medium">comercial@nefetech.online</a>.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-zinc-200 text-center">
        <a href="#inicio" className="inline-flex items-center gap-2 text-sm text-zinc-900 hover:text-zinc-700 font-medium">
          <Icon name="arrow_back" size={18} />
          Volver al Inicio
        </a>
      </div>
    </div>
  );
}
