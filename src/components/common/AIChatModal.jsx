import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { WhatsAppIcon } from './WhatsAppIcon';
import { sendChatMessage } from '../../services/api';

const MAX_CHAR_LIMIT = 350;

export function AIChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('nefetech_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: '¡Hola! Soy el asistente de Nefetech. ¿En qué puedo ayudarte?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(() => {
    return localStorage.getItem('nefetech_chat_limit_reached') === 'true';
  });
  const [whatsappDerivacionUrl, setWhatsappDerivacionUrl] = useState(() => {
    return (
      localStorage.getItem('nefetech_chat_wa_url') ||
      'https://wa.me/5491170605129?text=Hola,%20estaba%20consultando%20con%20el%20asistente%20de%20IA%20y%20quiero%20continuar%20mi%20consulta.'
    );
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('nefetech_chat_history', JSON.stringify(messages));
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isLimitReached) return;

    if (trimmed.length > MAX_CHAR_LIMIT) {
      alert(`El mensaje supera el límite de ${MAX_CHAR_LIMIT} caracteres.`);
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(trimmed);

      if (data.limit_reached || data.derivacion) {
        setIsLimitReached(true);
        localStorage.setItem('nefetech_chat_limit_reached', 'true');
        if (data.whatsapp_url) {
          setWhatsappDerivacionUrl(data.whatsapp_url);
          localStorage.setItem('nefetech_chat_wa_url', data.whatsapp_url);
        }
      }

      const botText = data.respuesta || data.error || 'No pudimos procesar tu mensaje en este momento.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDerivacion: Boolean(data.derivacion || data.limit_reached),
          whatsappUrl: data.whatsapp_url,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Hubo un error de conexión con el servidor. Puedes escribirnos directamente por WhatsApp o a comercial@nefetech.online.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[400px] max-h-[580px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header del Chat */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Icon name="smart_toy" size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight leading-none text-white">
              Nefetech AI Assistant
            </h3>
            <span className="text-[11px] text-blue-100 flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              En línea
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Cerrar chat"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* Cuerpo de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs sm:text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {msg.isDerivacion && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <a
                    href={msg.whatsappUrl || whatsappDerivacionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <WhatsAppIcon size={16} />
                    <span>Continuar por WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {msg.time}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl rounded-bl-xs w-fit">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span className="text-xs text-slate-400">Escribiendo respuesta...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envío o Banner de Derivación */}
      {isLimitReached ? (
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-600 font-medium">
            Has completado las consultas de esta sesión.
          </p>
          <a
            href={whatsappDerivacionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <WhatsAppIcon size={17} />
            <span>Hablar con un asesor en WhatsApp</span>
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              maxLength={MAX_CHAR_LIMIT}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta aquí..."
              disabled={isLoading}
              className="flex-1 bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all cursor-pointer shrink-0 shadow-xs"
              aria-label="Enviar mensaje"
            >
              <Icon name="send" size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Máx. 10 consultas por sesión</span>
            <span className={input.length >= MAX_CHAR_LIMIT ? 'text-amber-500 font-bold' : ''}>
              {input.length}/{MAX_CHAR_LIMIT}
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
