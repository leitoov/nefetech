import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { WhatsAppIcon } from './WhatsAppIcon';
import { sendChatMessage } from '../../services/api';
import { WHATSAPP_URL } from '../../utils/constants';

const MAX_CHAR_LIMIT = 350;

/**
 * Renderiza el texto del mensaje detectando automáticamente números de WhatsApp,
 * menciones a WhatsApp y correos electrónicos para convertirlos en enlaces clicables directos.
 */
function renderMessageWithLinks(text) {
  if (!text) return null;

  // Regex combinada para capturar correos, números con formato internacional y URLs
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const phoneRegex = /(\+54\s?9?\s?11\s?\d{4}[-\s]?\d{4}|\+5491170605129)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Si hay saltos de línea, procesamos por líneas para preservar diseño
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Tokenizar elementos especiales en la línea
    const tokens = [];
    let lastIndex = 0;

    // Expresión combinada
    const combinedRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+54\s?9?\s?11\s?\d{4}[-\s]?\d{4}|\+5491170605129)|(https?:\/\/[^\s]+)/gi;
    let match;

    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', val: line.substring(lastIndex, match.index) });
      }

      const matchStr = match[0];
      if (matchStr.includes('@')) {
        tokens.push({ type: 'email', val: matchStr });
      } else if (matchStr.startsWith('http')) {
        tokens.push({ type: 'url', val: matchStr });
      } else {
        tokens.push({ type: 'whatsapp', val: matchStr });
      }
      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push({ type: 'text', val: line.substring(lastIndex) });
    }

    return (
      <React.Fragment key={lineIdx}>
        {tokens.map((token, tokIdx) => {
          if (token.type === 'email') {
            return (
              <a
                key={tokIdx}
                href={`mailto:${token.val}`}
                className="font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 underline-offset-2 transition-colors inline-flex items-center gap-0.5 mx-0.5"
                title={`Enviar correo a ${token.val}`}
              >
                <span>{token.val}</span>
              </a>
            );
          }

          if (token.type === 'whatsapp') {
            const cleanPhone = token.val.replace(/[^0-9]/g, '');
            const waLink = `https://wa.me/${cleanPhone}?text=Hola,%20vengo%20del%20chat%20de%20Nefetech%20y%20quiero%20hacer%20una%20consulta.`;
            return (
              <a
                key={tokIdx}
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300 hover:decoration-emerald-500 underline-offset-2 transition-colors inline-flex items-center gap-1 mx-0.5"
                title={`Abrir WhatsApp con ${token.val}`}
              >
                <WhatsAppIcon size={14} className="inline-block text-emerald-600" />
                <span>{token.val}</span>
              </a>
            );
          }

          if (token.type === 'url') {
            return (
              <a
                key={tokIdx}
                href={token.val}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:underline inline-block break-all"
              >
                {token.val}
              </a>
            );
          }

          // Si el texto plano contiene la palabra "WhatsApp" o "mail" sin enlace directo, dar un toque interactivo
          return <span key={tokIdx}>{token.val}</span>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

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
        text: '¡Hola! Soy el asistente de Nefetech.\n¿En qué puedo ayudarte?',
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

  // Bloquear scroll de fondo en móviles cuando el chat está abierto a pantalla completa
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
          text: 'Hubo un error de conexión con el servidor. Puedes escribirnos directamente por WhatsApp (+54 9 11 7060-5129) o a comercial@nefetech.online.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const welcome = [
      {
        id: 'welcome',
        sender: 'bot',
        text: '¡Hola! Soy el asistente de Nefetech.\n¿En qué puedo ayudarte?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(welcome);
    localStorage.removeItem('nefetech_chat_history');
  };

  return (
    <>
      {/* Fondo oscuro para móvil */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 sm:hidden transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Contenedor del Chat: En móvil es pantalla completa optimizada tipo App de mensajería, en escritorio es ventana flotante elegante */}
      <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 sm:w-[420px] sm:max-h-[600px] sm:h-[540px] bg-white sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in sm:slide-in-from-bottom-5 duration-200">
        
        {/* Header del Chat */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 text-white flex items-center justify-between shadow-md shrink-0 safe-top">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="sm:hidden -ml-1 p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Volver atrás"
            >
              <Icon name="arrow_back" size={22} />
            </button>

            <div className="relative">
              <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
                <Icon name="smart_toy" size={22} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-indigo-700"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight leading-none text-white">
                  Nefetech Asistente
                </h3>
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-blue-50">
                  Comercial
                </span>
              </div>
              <span className="text-[11px] text-blue-100 flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                En línea • Respuestas al instante
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Reiniciar conversación"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Limpiar chat"
            >
              <Icon name="restart_alt" size={20} />
            </button>
            <button
              onClick={onClose}
              className="hidden sm:flex p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Cerrar chat"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Acceso rápido a WhatsApp en cabecera */}
        <div className="bg-blue-50/80 border-b border-blue-100/80 px-4 py-2 flex items-center justify-between text-xs text-blue-900 shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Icon name="support_agent" size={16} className="text-blue-600" />
            <span>¿Prefieres atención humana inmediata?</span>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[11px] transition-colors shadow-2xs"
          >
            <WhatsAppIcon size={13} />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Cuerpo de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/80 text-xs sm:text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                }`}
              >
                {/* Renderizar contenido con hipervínculos automáticos a WhatsApp y Mail */}
                <div className="leading-relaxed">
                  {renderMessageWithLinks(msg.text)}
                </div>

                {/* Si incluye derivación explícita a WhatsApp */}
                {msg.isDerivacion && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <a
                      href={msg.whatsappUrl || whatsappDerivacionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors"
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
            <div className="flex items-center gap-2.5 text-slate-600 bg-white border border-slate-200/90 px-4 py-3 rounded-2xl rounded-bl-xs w-fit shadow-xs animate-in fade-in duration-150">
              <div className="flex gap-1.5 items-center">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Asistente escribiendo...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input de Envío o Banner de Límite Alcanzado */}
        {isLimitReached ? (
          <div className="p-4 bg-slate-100 border-t border-slate-200 text-center space-y-2.5 shrink-0 safe-bottom">
            <p className="text-xs text-slate-700 font-semibold">
              Has alcanzado el límite de 10 consultas en este chat.
            </p>
            <p className="text-[11px] text-slate-500">
              Continuemos directamente con nuestro equipo comercial para brindarte atención personalizada:
            </p>
            <a
              href={whatsappDerivacionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <WhatsAppIcon size={18} />
              <span>Continuar en WhatsApp</span>
            </a>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="p-3 sm:p-3.5 bg-white border-t border-slate-200/80 flex flex-col gap-2 shrink-0 safe-bottom shadow-lg"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                maxLength={MAX_CHAR_LIMIT}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta o requerimiento..."
                disabled={isLoading}
                className="flex-1 bg-slate-100/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all cursor-pointer shrink-0 shadow-xs"
                aria-label="Enviar mensaje"
              >
                <Icon name="send" size={19} />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1.5">
              <span className="flex items-center gap-1">
                <Icon name="lock" size={12} className="text-slate-400" />
                <span>Conversación protegida</span>
              </span>
              <span className={input.length >= MAX_CHAR_LIMIT ? 'text-amber-500 font-bold' : ''}>
                {input.length}/{MAX_CHAR_LIMIT}
              </span>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
