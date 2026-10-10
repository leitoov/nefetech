import React from 'react';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { WHATSAPP_URL } from '../utils/constants';

const servicesData = [
  {
    id: 'desarrollo-medida',
    icon: 'code',
    title: 'Desarrollos a Medida',
    tagline: 'Realizamos desarrollo adaptado a tu necesidad, con el foco en la calidad y escalabilidad.',
    description:
      'Diseñamos y programamos aplicaciones web, plataformas SaaS y APIs de alto rendimiento pensadas para soportar el crecimiento de tu negocio sin fricción.',
    features: [
      'Frontend moderno y reactivo (React, TypeScript)',
      'Arquitectura de APIs REST y microservicios escalables',
      'Modelado y optimización de bases de datos relacionales y no relacionales',
    ],
    techTags: ['React', 'Node.js', 'Java', 'Php', 'Mysql', 'PostgreSQL', 'Docker'],
    colorScheme: {
      accent: 'text-blue-600',
      bgLight: 'bg-blue-50',
      borderLight: 'border-blue-100',
      tagBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      hoverBorder: 'hover:border-blue-500',
      hoverTitle: 'group-hover:text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
  },
  {
    id: 'integracion-ia',
    icon: 'smart_toy',
    title: 'Integración con IA',
    tagline: 'Integramos herramientas de inteligencia artificial en tus proyectos para potenciar soluciones y automatizar procesos.',
    description:
      'Aprovechamos el potencial de los modelos de lenguaje para conectar tus bases de conocimiento, procesar documentos automáticamente y construir agentes operativos útiles.',
    features: [
      'Conexión segura con modelos de lenguaje (OpenAI, Claude, Gemini)',
      'Búsqueda semántica sobre tus propios documentos y archivos (RAG)',
      'Extracción y estructuración automática de información clave',
      'Asistentes conversacionales y agentes de soporte integrados',
    ],
    techTags: ['OpenAI', 'Gemini', 'Claude', 'LangChain', 'Vector DB', 'FastAPI', 'Python'],
    colorScheme: {
      accent: 'text-purple-600',
      bgLight: 'bg-purple-50',
      borderLight: 'border-purple-100',
      tagBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
      hoverBorder: 'hover:border-purple-500',
      hoverTitle: 'group-hover:text-purple-600',
      badgeBg: 'bg-purple-50 text-purple-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
    },
  },
  {
    id: 'consultoria-tecnologica',
    icon: 'lightbulb',
    title: 'Consultoría Tecnológica',
    tagline: 'Asesoramiento personalizado para transformar tus ideas en proyectos reales y viables.',
    description:
      'Te acompañamos desde la idea inicial: analizamos la viabilidad técnica, definimos el alcance y te asesoramos en la incorporación estratégica de Inteligencia Artificial para que tu proyecto nazca con bases sólidas y escalables.',
    features: [
      'De la idea al proyecto: definición de alcance, etapas y MVP viable',
      'Asesoramiento estratégico para incorporar Inteligencia Artificial',
      'Elección del stack tecnológico adecuado sin gastos innecesarios',
      'Acompañamiento técnico y validación funcional para startups y negocios',
    ],
    techTags: ['Ideación & MVP', 'Estrategia de IA', 'Arquitectura Funcional', 'Validación Técnica', 'Roadmap de Producto'],
    colorScheme: {
      accent: 'text-amber-600',
      bgLight: 'bg-amber-50',
      borderLight: 'border-amber-100',
      tagBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      hoverBorder: 'hover:border-amber-500',
      hoverTitle: 'group-hover:text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
    },
  },
];

export function Home() {
  return (
    <div className="space-y-28">
      {/* Hero Section con acentos tecnológicos */}
      <section id="inicio" className="text-center max-w-3xl mx-auto pt-10 pb-6 flex flex-col items-center">

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.12]">
          Soluciones reales, con ideas{' '}
          <span className="text-blue-600 underline decoration-blue-200 decoration-wavy decoration-2">
            innovadoras
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 mb-9 max-w-2xl leading-relaxed">
          ¿Tenés una idea y no sabés cómo llevarla al siguiente nivel? Te ayudamos a crearla con ingeniería sólida, tecnologías modernas y foco en resultados.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-950/15 cursor-pointer active:scale-95"
          >
            <WhatsAppIcon size={18} />
            <span>WhatsApp</span>
          </a>

          <a href="mailto:comercial@nefetech.online">
            <Button variant="primary" size="lg" className="gap-2 shadow-md shadow-blue-500/25">
              <Icon name="mail" size={20} />
              <span>Enviar Email</span>
            </Button>
          </a>

          <a href="#servicios">
            <Button variant="secondary" size="lg" className="gap-2">
              <Icon name="layers" size={18} className="text-blue-600" />
              <span>Ver Servicios</span>
            </Button>
          </a>
        </div>
      </section>

      {/* Tarjetas Resumen ("Ofrecemos") */}
      <section>
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <Icon name="auto_awesome" size={24} className="text-blue-600" />
            <span>Qué ofrecemos</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Nuestros pilares para llevar tus soluciones digitales a producción
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {servicesData.map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              className={`group p-7 rounded-2xl bg-white border border-slate-200/90 ${service.colorScheme.hoverBorder} hover:shadow-xl transition-all block text-left`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className={`h-12 w-12 rounded-xl ${service.colorScheme.bgLight} ${service.colorScheme.accent} flex items-center justify-center border ${service.colorScheme.borderLight} transition-transform group-hover:scale-105`}>
                  <Icon name={service.icon} size={26} />
                </div>
              </div>

              <h3 className={`text-lg font-bold text-slate-900 mb-2 ${service.colorScheme.hoverTitle} transition-colors flex items-center justify-between`}>
                <span>{service.title}</span>
                <Icon name="arrow_forward" size={16} className={`text-slate-400 ${service.colorScheme.hoverTitle} group-hover:translate-x-1 transition-all`} />
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {service.tagline}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Sección Detallada de Servicios */}
      <section id="servicios" className="scroll-mt-24 pt-12 border-t border-slate-100">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 mb-3">
            <Icon name="settings_suggest" size={16} />
            SERVICIOS EN DETALLE
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Tecnología a medida, de punta a punta
          </h2>
          <p className="mt-2.5 text-slate-600 text-sm sm:text-base">
            Conocé en profundidad el alcance de cada uno de nuestros servicios y cómo podemos colaborar con tu equipo.
          </p>
        </div>

        <div className="space-y-8">
          {servicesData.map((service, idx) => (
            <div
              key={service.id}
              id={service.id}
              className="scroll-mt-24 p-7 sm:p-9 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`h-12 w-12 rounded-xl ${service.colorScheme.bgLight} ${service.colorScheme.accent} flex items-center justify-center border ${service.colorScheme.borderLight} shrink-0`}>
                      <Icon name={service.icon} size={28} />
                    </div>
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-md ${service.colorScheme.badgeBg}`}>
                        Servicio 0{idx + 1}
                      </span>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {service.tagline}
                  </p>

                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {service.description}
                  </p>

                  {/* Badges de Tecnologías */}
                  <div className="pt-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-2 flex items-center gap-1.5">
                      <Icon name="memory" size={16} className={service.colorScheme.accent} />
                      Tecnologías y herramientas clave:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {service.techTags.map((tech) => (
                        <span
                          key={tech}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border ${service.colorScheme.tagBg}`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha (UX Checklist card) */}
                <div className={`lg:col-span-5 ${service.colorScheme.bgLight} p-6 rounded-2xl border ${service.colorScheme.borderLight} space-y-4`}>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Icon name="task_alt" size={18} className={service.colorScheme.accent} />
                    Qué incluye
                  </h4>
                  <ul className="space-y-3">
                    {service.features.map((item, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-snug">
                        <Icon name="check_circle" size={17} className={`${service.colorScheme.accent} shrink-0 mt-0.5`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 border-t border-slate-200/70">
                    <a href="#contacto" className="block">
                      <button
                        type="button"
                        className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl text-white ${service.colorScheme.buttonBg} shadow-sm transition-all cursor-pointer active:scale-95`}
                      >
                        <span>Consultar por este servicio</span>
                        <Icon name="arrow_forward" size={15} />
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección Contacto Directo */}
      <section id="contacto" className="scroll-mt-24 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center max-w-4xl mx-auto space-y-6 shadow-xl shadow-blue-600/15">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md items-center justify-center text-white border border-white/20">
          <Icon name="mail" size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ¿Tenés un proyecto en mente?
          </h2>
          <p className="text-blue-100 text-base max-w-xl mx-auto leading-relaxed">
            Escribinos directamente y coordinemos una llamada para charlar sobre tu idea técnica.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
          >
            <WhatsAppIcon size={20} />
            <span>WhatsApp</span>
          </a>

          <a href="mailto:comercial@nefetech.online">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-all shadow-md cursor-pointer active:scale-95">
              <Icon name="mail" size={18} />
              <span>comercial@nefetech.online</span>
            </button>
          </a>
        </div>
      </section>
    </div>
  );
}
