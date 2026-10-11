import React, { useState } from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Icon } from './Icon';
import { AIChatModal } from './AIChatModal';
import { WHATSAPP_URL } from '../../utils/constants';

export function FloatingActions() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Ventana de Chat Inteligente */}
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Contenedor Flotante Inferior Derecho */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* 1. Botón de Chat IA (Al lado de WhatsApp) */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label="Abrir asistente de IA"
          className="relative flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg shadow-blue-950/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
        >
          <Icon name="smart_toy" size={24} className="shrink-0" />
          <span className="hidden sm:inline-block font-semibold text-sm tracking-tight pr-1">
            {isChatOpen ? 'Cerrar Chat' : 'Chat en vivo'}
          </span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white border-2 border-blue-600"></span>
          </span>
        </button>

        {/* 2. Botón de WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="relative flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
        >
          <WhatsAppIcon size={24} className="shrink-0" />
          <span className="hidden sm:inline-block font-semibold text-sm tracking-tight pr-1">
            WhatsApp
          </span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white border-2 border-emerald-500"></span>
          </span>
        </a>
      </div>
    </>
  );
}
