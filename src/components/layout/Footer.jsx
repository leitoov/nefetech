import React from 'react';
import { Icon } from '../common/Icon';
import { LogoIcon } from '../common/LogoIcon';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { WHATSAPP_URL } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-slate-50/60 py-12 text-slate-600">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <LogoIcon size={28} className="rounded-lg shadow-xs" />
              <span className="text-base font-bold tracking-tight text-slate-900">
                Nefe<span className="text-blue-600">tech</span>
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500">
              Desarrollo de software de alto nivel, soluciones de Inteligencia Artificial y consultoría técnica para empresas en crecimiento.
            </p>
            <div className="pt-2 flex flex-col gap-1.5 text-xs">
              <a
                href="mailto:comercial@nefetech.online"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Icon name="mail" size={16} className="text-blue-600" />
                <span>comercial@nefetech.online</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors"
              >
                <WhatsAppIcon size={16} className="text-emerald-500" />
                <span>Contacto</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Icon name="explore" size={15} className="text-blue-600" />
              Navegación
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#inicio" className="hover:text-blue-600 transition-colors">Inicio</a></li>
              <li><a href="#servicios" className="hover:text-blue-600 transition-colors">Servicios</a></li>
              <li><a href="#contacto" className="hover:text-blue-600 transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Icon name="verified_user" size={15} className="text-blue-600" />
              Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#terminos" className="hover:text-blue-600 transition-colors">Términos de servicio</a></li>
              <li><a href="#privacidad" className="hover:text-blue-600 transition-colors">Privacidad</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>&copy; {new Date().getFullYear()} Nefetech. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1">
            <Icon name="location_on" size={14} className="text-blue-500" />
            Buenos Aires, Argentina
          </span>
        </div>
      </div>
    </footer>
  );
}
