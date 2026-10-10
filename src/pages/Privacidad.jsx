import React from 'react';
import { Icon } from '../components/common/Icon';

export function Privacidad() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-2 text-zinc-900 text-sm font-semibold mb-2">
          <Icon name="shield" size={20} />
          <span>Seguridad y Privacidad</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Contenido */}
      <div className="space-y-8 text-zinc-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">1.</span> Información que Recopilamos
          </h2>
          <p>
            En <strong className="text-zinc-900">Nefetech</strong> valoramos y protegemos la privacidad de quienes nos contactan. Recopilamos información únicamente cuando nos la proporcionas de forma voluntaria al solicitar una cotización o asesoría técnica:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-600">
            <li><strong>Datos de contacto:</strong> Nombre, dirección de correo electrónico, teléfono y empresa.</li>
            <li><strong>Información del proyecto:</strong> Requerimientos técnicos, objetivos comerciales y detalles presupuestarios.</li>
            <li><strong>Datos técnicos:</strong> Métricas anónimas de rendimiento para optimizar la velocidad del sitio.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">2.</span> Uso de la Información
          </h2>
          <p>Utilizamos la información recopilada exclusivamente para los siguientes fines:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-600">
            <li>Responder a tus consultas y solicitudes de cotización técnica.</li>
            <li>Planificar, desarrollar y ejecutar los proyectos de software contratados.</li>
            <li>Mejorar continuamente nuestra plataforma web y la experiencia de usuario.</li>
            <li>Cumplir con las obligaciones contractuales y regulatorias aplicables.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">3.</span> Confidencialidad y Modelos de IA
          </h2>
          <p>
            Tratamos los datos comerciales e ideas de proyectos con estricto secreto profesional. En proyectos que involucran Inteligencia Artificial, garantizamos que los datos privados de nuestros clientes no sean expuestos ni utilizados para entrenar modelos públicos sin consentimiento explícito por escrito.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">4.</span> No Venta ni Cesión de Datos
          </h2>
          <p>
            <strong className="text-zinc-900">No vendemos, alquilamos ni comercializamos</strong> tus datos personales con terceros con fines publicitarios. Únicamente compartimos datos con proveedores tecnológicos de confianza bajo acuerdos estrictos de confidencialidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">5.</span> Seguridad de la Información
          </h2>
          <p>
            Implementamos medidas técnicas y organizativas adecuadas para proteger tu información contra acceso no autorizado, alteración o divulgación, empleando protocolos de comunicación cifrada (HTTPS/SSL).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">6.</span> Tus Derechos
          </h2>
          <p>
            Tienes derecho a acceder, rectificar, actualizar o solicitar la eliminación definitiva de tus datos personales de nuestras bases de datos en cualquier momento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-400">7.</span> Consultas sobre Privacidad
          </h2>
          <p>
            Para cualquier inquietud sobre cómo tratamos tus datos o solicitar la baja de tus registros, puedes escribir a <a href="mailto:comercial@nefetech.online" className="text-zinc-900 underline font-medium">comercial@nefetech.online</a>.
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
