import React from 'react';
import { Icon } from '../common/Icon';
import { LogoIcon } from '../common/LogoIcon';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { WHATSAPP_URL } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-slate-50/70 pt-10 pb-8 text-slate-600">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marca y contacto */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <LogoIcon size={30} className="rounded-lg shadow-xs" />
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Nefe<span className="text-blue-600">tech</span>
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500">
              Desarrollo de software de alto nivel, soluciones de Inteligencia Artificial y consultoría técnica para empresas en crecimiento.
            </p>

            {/* Badges de Contacto optimizados para Mobile y Desktop */}
            <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs">
              <a
                href="mailto:comercial@nefetech.online"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all shadow-2xs group w-fit"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon name="mail" size={15} />
                </div>
                <span className="font-medium">comercial@nefetech.online</span>
              </a>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-2xs group w-fit"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <WhatsAppIcon size={15} />
                </div>
                <span className="font-medium">WhatsApp directo</span>
              </a>
            </div>
          </div>

          {/* Enlaces: 2 columnas en mobile para ahorrar espacio vertical */}
          <div className="grid grid-cols-2 gap-6 md:contents">
            <div>
              <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <Icon name="explore" size={15} className="text-blue-600" />
                Navegación
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#inicio" className="text-slate-600 hover:text-blue-600 font-medium transition-colors block py-0.5">Inicio</a></li>
                <li><a href="#servicios" className="text-slate-600 hover:text-blue-600 font-medium transition-colors block py-0.5">Servicios</a></li>
                <li><a href="#contacto" className="text-slate-600 hover:text-blue-600 font-medium transition-colors block py-0.5">Contacto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <Icon name="verified_user" size={15} className="text-blue-600" />
                Legal
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#terminos" className="text-slate-600 hover:text-blue-600 font-medium transition-colors block py-0.5">Términos</a></li>
                <li><a href="#privacidad" className="text-slate-600 hover:text-blue-600 font-medium transition-colors block py-0.5">Privacidad</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} Nefetech. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Icon name="location_on" size={14} className="text-blue-500" />
            Buenos Aires, Argentina
          </span>
        </div>
      </div>
    </footer>
  );
}
