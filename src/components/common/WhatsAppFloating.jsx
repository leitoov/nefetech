import React from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_URL } from '../../utils/constants';

export function WhatsAppFloating() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
    >
      <WhatsAppIcon size={26} className="shrink-0" />
      <span className="hidden sm:inline-block font-semibold text-sm tracking-tight pr-1">
        ¿Hablamos?
      </span>
      {/* Indicador de estado en línea */}
      <span className="absolute top-1 right-1 flex h-3 w-3">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white border-2 border-emerald-500"></span>
      </span>
    </a>
  );
}
