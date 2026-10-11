import React, { useState, useEffect } from 'react';
import { Icon } from '../components/common/Icon';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('nefetech_admin_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nefetech_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Credenciales form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Leads
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');

  // Responder
  const [replyChannel, setReplyChannel] = useState('email');
  const [replySubject, setReplySubject] = useState('Respuesta a tu consulta de proyecto en Nefetech');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState('');

  // 1. Manejo de Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      const data = await res.json();

      if (data.success && data.token) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('nefetech_admin_token', data.token);
        localStorage.setItem('nefetech_admin_user', JSON.stringify(data.user));
      } else {
        setLoginError(data.error || 'Credenciales inválidas.');
      }
    } catch {
      setLoginError('Error de conexión con el servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('nefetech_admin_token');
    localStorage.removeItem('nefetech_admin_user');
  };

  // 2. Cargar Leads
  const fetchLeads = async () => {
    if (!token) return;
    setIsLoadingLeads(true);
    try {
      const res = await fetch('/api/admin/leads.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
        if (data.leads.length > 0 && !selectedLeadId) {
          setSelectedLeadId(data.leads[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // 3. Cargar Detalle del Lead seleccionado
  const fetchLeadDetail = async (id) => {
    if (!token || !id) return;
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/leads.php?id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeadDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeads();
    }
  }, [token]);

  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadDetail(selectedLeadId);
      setReplySuccessMsg('');
      setReplyMessage('');
    }
  }, [selectedLeadId]);

  // 4. Enviar Respuesta
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedLeadId) return;

    setIsSendingReply(true);
    setReplySuccessMsg('');

    try {
      const res = await fetch('/api/admin/reply.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: selectedLeadId,
          channel: replyChannel,
          subject: replySubject,
          message: replyMessage
        })
      });

      const data = await res.json();
      if (data.success) {
        setReplySuccessMsg('¡Mensaje enviado y registrado en la cadena de conversación!');
        setReplyMessage('');
        fetchLeadDetail(selectedLeadId);
        fetchLeads();
      } else {
        alert(data.error || 'Error al enviar respuesta');
      }
    } catch {
      alert('Error de conexión al enviar');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Si no está autenticado, mostrar pantalla de Login
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/30">
              <Icon name="lock" size={26} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nefetech Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Panel de control y gestión de leads comerciales</p>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <Icon name="error" size={16} className="text-red-500 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuario o Email
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="lvincent o tu email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoggingIn ? 'Iniciando sesión...' : 'Ingresar al Panel'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
              ← Volver al sitio web
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filtrado de leads
  const filteredLeads = leads.filter((l) => {
    if (filterStatus === 'todos') return true;
    return l.status === filterStatus;
  });

  const activeLead = leadDetail?.lead;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white">
            N
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none">Nefetech CRM Admin</h1>
            <span className="text-[11px] text-slate-400">Gestión de presupuestos y leads web</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{currentUser?.email}</div>
            <div className="text-[10px] text-emerald-400">Rol: Administrador</div>
          </div>
          <button
            onClick={fetchLeads}
            title="Refrescar leads"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="refresh" size={18} />
          </button>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
          >
            <Icon name="logout" size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Lista de Leads */}
        <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 h-[320px] md:h-auto">
          {/* Header de Leads y Filtro */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Bandeja de Leads</span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {leads.length}
                </span>
              </h2>
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('todos')}
                className={`flex-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'todos' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('nuevo')}
                className={`flex-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'nuevo' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                }`}
              >
                Nuevos
              </button>
              <button
                onClick={() => setFilterStatus('en_contacto')}
                className={`flex-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'en_contacto' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                }`}
              >
                En curso
              </button>
            </div>
          </div>

          {/* Listado de items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingLeads && leads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Cargando leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No hay leads registrados aún.</div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = lead.id === selectedLeadId;
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {lead.email || lead.phone || 'Sin contacto directo'}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        lead.status === 'nuevo' 
                          ? 'bg-amber-100 text-amber-700'
                          : lead.status === 'en_contacto'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>

                    {lead.phone && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-1.5">
                        <WhatsAppIcon size={13} className="text-emerald-600 shrink-0" />
                        <span className="font-mono">{lead.phone}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {lead.lead_message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5">
                      <span>{new Date(lead.created_at).toLocaleDateString()} {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {Number(lead.reply_count) > 0 && (
                        <span className="text-blue-600 font-semibold flex items-center gap-1">
                          <Icon name="reply" size={12} />
                          {lead.reply_count} respuestas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Content Area: Detalle, Chat del bot y Formulario de Respuesta */}
        <main className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {!activeLead ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Selecciona un lead de la lista izquierda para ver su historial y responder.
            </div>
          ) : (
            <>
              {/* Tarjeta de Datos del Cliente */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ficha de Requerimiento #{activeLead.id}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                      <span>{activeLead.email || 'Sin correo'}</span>
                    </h2>
                    <span className="text-xs text-slate-500">
                      Fecha de registro: {new Date(activeLead.created_at).toLocaleString()} • IP: {activeLead.ip_address}
                    </span>
                  </div>

                  {activeLead.phone && (
                    <a
                      href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}?text=Hola,%20nos%20comunicamos%20desde%20Nefetech%20sobre%20tu%20consulta%20de%20desarrollo...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <WhatsAppIcon size={16} />
                      <span>Contactar en WhatsApp ({activeLead.phone})</span>
                    </a>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Necesidad Planteada por el Cliente:
                  </h3>
                  <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-sm text-slate-800 leading-relaxed font-medium">
                    {activeLead.lead_message}
                  </div>
                </div>
              </div>

              {/* Hilo de Respuestas Previas de Administración */}
              {leadDetail?.replies && leadDetail.replies.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Icon name="history_edu" size={16} className="text-blue-600" />
                    <span>Cadena de Respuestas Enviadas ({leadDetail.replies.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {leadDetail.replies.map((rep) => (
                      <div key={rep.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                          <span className="font-bold text-slate-700 uppercase">
                            Canal: {rep.channel.toUpperCase()} • Destinatario: {rep.recipient}
                          </span>
                          <span>{new Date(rep.created_at).toLocaleString()}</span>
                        </div>
                        {rep.subject && <div className="font-semibold text-slate-800 mb-1">Asunto: {rep.subject}</div>}
                        <div className="text-slate-700 whitespace-pre-line leading-relaxed">{rep.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario de Respuesta para Enviar Nuevo Email o Registrar WA */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Icon name="send" size={16} className="text-blue-600" />
                    <span>Responder al Cliente</span>
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyChannel('email')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        replyChannel === 'email' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon name="mail" size={14} />
                      <span>Email</span>
                    </button>
                    {activeLead.phone && (
                      <button
                        type="button"
                        onClick={() => setReplyChannel('whatsapp')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                          replyChannel === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <WhatsAppIcon size={14} />
                        <span>WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>

                {replySuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                    <Icon name="check_circle" size={16} className="text-emerald-600" />
                    <span>{replySuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSendReply} className="space-y-4">
                  {replyChannel === 'email' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Asunto del Correo:
                      </label>
                      <input
                        type="text"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Mensaje / Propuesta para el cliente:
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={
                        replyChannel === 'email'
                          ? `Hola! Te escribimos desde Nefetech para avanzar sobre tu requerimiento...`
                          : `Escribe la nota o mensaje de WhatsApp que le enviaste...`
                      }
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {replyChannel === 'email' 
                        ? `Se despachará a: ${activeLead.email} con copia oculta a leonelexequielvincent@gmail.com`
                        : `Quedará asentado en el historial de WhatsApp`}
                    </span>

                    <button
                      type="submit"
                      disabled={isSendingReply || !replyMessage.trim()}
                      className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Icon name="send" size={14} />
                      <span>{isSendingReply ? 'Enviando...' : 'Despachar Respuesta'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Transcripción del Chat Original del Bot */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Icon name="chat" size={16} className="text-blue-600" />
                  <span>Historial Completo de Conversación del ChatBot</span>
                </h3>

                {isLoadingDetail ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Cargando chat...</div>
                ) : !leadDetail?.chat_history || leadDetail.chat_history.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Sin mensajes previos registrados.</div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    {leadDetail.chat_history.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs max-w-[85%] ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white ml-auto'
                            : 'bg-white text-slate-800 border border-slate-200 mr-auto'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 mb-1 font-semibold">
                          <span>{msg.sender === 'user' ? '👤 Usuario' : '🤖 Bot'}</span>
                          <span>{msg.created_at}</span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">{msg.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
