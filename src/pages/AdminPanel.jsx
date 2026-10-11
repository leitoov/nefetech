import React, { useState, useEffect } from 'react';
import { Icon } from '../components/common/Icon';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('nefetech_admin_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nefetech_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Pestaña activa del panel: 'leads', 'calculadora', 'configuracion'
  const [activeTab, setActiveTab] = useState('leads');

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

  // Responder Lead
  const [replyChannel, setReplyChannel] = useState('email');
  const [replySubject, setReplySubject] = useState('Respuesta a tu consulta de proyecto en Nefetech');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState('');

  // -------------------------------------------------------------
  // ESTADO DE CALCULADORA DE PRESUPUESTO & CONFIGURACIÓN
  // -------------------------------------------------------------
  const [dolarRate, setDolarRate] = useState({ blue: 1540, actualizado: '' });
  const [budgetConfig, setBudgetConfig] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [saveConfigMsg, setSaveConfigMsg] = useState('');

  // Parámetros de la Calculadora actual
  const [calcHours, setCalcHours] = useState(40);
  const [calcHourlyRate, setCalcHourlyRate] = useState(35);
  const [calcSelectedLang, setCalcSelectedLang] = useState('React / Next.js');
  const [calcSelectedIA, setCalcSelectedIA] = useState('RAG Semántico con Base Vectorial');
  const [calcIncludeDomain, setCalcIncludeDomain] = useState(true);
  const [calcServerType, setCalcServerType] = useState('server_basic_monthly_usd');
  const [calcServerMonths, setCalcServerMonths] = useState(12);
  const [calcSelectedDesign, setCalcSelectedDesign] = useState('UI Kit Moderno & Responsive (Tailwind)');
  const [calcMarginPercent, setCalcMarginPercent] = useState(15); // Margen de contingencia o ganancia

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

  // 3. Cargar Detalle del Lead
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

  // 4. Cargar Parámetros de Presupuesto y Cotización Dólar en Vivo
  const fetchBudgetConfig = async () => {
    if (!token) return;
    setIsLoadingConfig(true);
    try {
      const res = await fetch('/api/admin/budget_config.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBudgetConfig(data.configs);
        if (data.configs?.hourly_rate) {
          setCalcHourlyRate(Number(data.configs.hourly_rate));
        }
        if (data.dolar) {
          setDolarRate(data.dolar);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeads();
      fetchBudgetConfig();
    }
  }, [token]);

  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadDetail(selectedLeadId);
      setReplySuccessMsg('');
      setReplyMessage('');
    }
  }, [selectedLeadId]);

  // 5. Enviar Respuesta a Lead
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

  // 6. Guardar Cambios en Configuración de Presupuestos
  const handleSaveBudgetConfig = async (e) => {
    e.preventDefault();
    setSaveConfigMsg('');

    try {
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(budgetConfig)
      });
      const data = await res.json();
      if (data.success) {
        setSaveConfigMsg('¡Parámetros de presupuesto guardados con éxito!');
        setTimeout(() => setSaveConfigMsg(''), 4000);
      }
    } catch {
      alert('Error al guardar configuración');
    }
  };

  // -------------------------------------------------------------
  // CÁLCULOS DE LA CALCULADORA
  // -------------------------------------------------------------
  const selectedLangObj = budgetConfig?.languages?.find(l => l.name === calcSelectedLang);
  const langFactor = selectedLangObj ? Number(selectedLangObj.factor) : 1.0;

  const costDevelopmentUSD = calcHours * calcHourlyRate * langFactor;

  const selectedIaObj = budgetConfig?.ia_modules?.find(i => i.name === calcSelectedIA);
  const costIaUSD = selectedIaObj ? Number(selectedIaObj.cost_usd) : 0;

  const costDomainUSD = calcIncludeDomain ? Number(budgetConfig?.infrastructure?.domain_annual_usd || 18) : 0;
  
  const serverMonthlyRate = Number(budgetConfig?.infrastructure?.[calcServerType] || 0);
  const costServerUSD = serverMonthlyRate * calcServerMonths;

  const selectedDesignObj = budgetConfig?.design_levels?.find(d => d.name === calcSelectedDesign);
  const costDesignUSD = selectedDesignObj ? Number(selectedDesignObj.cost_usd) : 0;

  const subtotalUSD = costDevelopmentUSD + costIaUSD + costDomainUSD + costServerUSD + costDesignUSD;
  const marginUSD = (subtotalUSD * (calcMarginPercent / 100));
  const totalUSD = subtotalUSD + marginUSD;

  const blueRate = Number(dolarRate.blue) || 1540;
  const totalARS = totalUSD * blueRate;

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
            <p className="text-sm text-slate-500 mt-1">Panel de control, CRM y Calculadora de Presupuestos</p>
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

  const filteredLeads = leads.filter((l) => {
    if (filterStatus === 'todos') return true;
    return l.status === filterStatus;
  });

  const activeLead = leadDetail?.lead;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white">
              N
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none">Nefetech CRM Admin</h1>
              <span className="text-[11px] text-slate-400">Panel de Control & Cotizador Interno</span>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'leads' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="inbox" size={15} />
              <span>Bandeja de Leads</span>
            </button>
            <button
              onClick={() => setActiveTab('calculadora')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'calculadora' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="calculate" size={15} />
              <span>Calculadora de Presupuesto</span>
            </button>
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'configuracion' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="settings" size={15} />
              <span>Configuración de Costos</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Badge Dólar en Vivo */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-emerald-400 font-bold">USD Blue Hoy:</span>
            <span className="text-white font-mono font-bold">${dolarRate.blue}</span>
            <span className="text-[10px] text-slate-400">DolarApi</span>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{currentUser?.username || 'lvincent'}</div>
            <div className="text-[10px] text-emerald-400">Admin Activo</div>
          </div>

          <button
            onClick={fetchBudgetConfig}
            title="Actualizar cotización dólar y datos"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="sync" size={17} />
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

      {/* Selector móvil de pestañas */}
      <div className="md:hidden flex bg-slate-900 border-b border-slate-800 p-2 gap-1 text-xs font-bold text-white overflow-x-auto">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center ${activeTab === 'leads' ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}
        >
          Leads
        </button>
        <button
          onClick={() => setActiveTab('calculadora')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center ${activeTab === 'calculadora' ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}
        >
          Calculadora
        </button>
        <button
          onClick={() => setActiveTab('configuracion')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center ${activeTab === 'configuracion' ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}
        >
          Configuración
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: BANDEJA DE LEADS & CRM                         */}
      {/* ========================================================= */}
      {activeTab === 'leads' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar: Lista de Leads */}
          <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 h-[300px] md:h-auto">
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

          {/* Área de Detalle y Respuesta */}
          <main className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
            {!activeLead ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Selecciona un lead de la lista izquierda para ver su historial y responder.
              </div>
            ) : (
              <>
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
                        Fecha: {new Date(activeLead.created_at).toLocaleString()} • IP: {activeLead.ip_address}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCalcHours(60);
                          setActiveTab('calculadora');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Icon name="calculate" size={16} />
                        <span>Cotizar en Calculadora</span>
                      </button>

                      {activeLead.phone && (
                        <a
                          href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}?text=Hola,%20nos%20comunicamos%20desde%20Nefetech%20sobre%20tu%20consulta%20de%20desarrollo...`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <WhatsAppIcon size={16} />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
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

                {/* Cadena de Respuestas */}
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

                {/* Formulario de Respuesta */}
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
                        placeholder={`Hola! Te escribimos desde Nefetech para avanzar sobre tu requerimiento...`}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {replyChannel === 'email' 
                          ? `Se despachará a: ${activeLead.email} con copia oculta a leonelexequielvincent@gmail.com`
                          : `Quedará registrado en la cadena cronológica`}
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

                {/* Transcripción del Chatbot */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Icon name="chat" size={16} className="text-blue-600" />
                    <span>Historial Completo de Conversación del ChatBot</span>
                  </h3>

                  {!leadDetail?.chat_history || leadDetail.chat_history.length === 0 ? (
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
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: CALCULADORA DE PRESUPUESTO INTERNA             */}
      {/* ========================================================= */}
      {activeTab === 'calculadora' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header Cotización Dólar */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Herramienta de Estimación Comercial Interna
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-1">Calculadora de Presupuestos</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Cotiza horas, tecnologías, inteligencia artificial, infraestructura y diseño en tiempo real.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 shrink-0">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl">
                  $
                </div>
                <div>
                  <div className="text-[11px] text-slate-300 uppercase font-semibold">Dólar Blue Hoy (DolarApi)</div>
                  <div className="text-2xl font-black font-mono text-emerald-400 leading-none mt-0.5">
                    ${blueRate.toLocaleString()} <span className="text-xs font-normal text-slate-300">ARS / USD</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Actualizado: {new Date(dolarRate.actualizado).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Formulario de Parámetros de Entrada */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 space-y-6">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Icon name="tune" size={20} className="text-blue-600" />
                  <span>1. Parámetros de Desarrollo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Horas estimadas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Horas Estimadas de Trabajo:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={calcHours}
                        onChange={(e) => setCalcHours(Math.max(1, Number(e.target.value)))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">horas</span>
                    </div>
                  </div>

                  {/* Tarifa Base USD/hora */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Costo Base por Hora:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={calcHourlyRate}
                        onChange={(e) => setCalcHourlyRate(Math.max(5, Number(e.target.value)))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">USD/h</span>
                    </div>
                  </div>
                </div>

                {/* Lenguaje / Stack */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Stack / Lenguaje de Programación:
                  </label>
                  <select
                    value={calcSelectedLang}
                    onChange={(e) => setCalcSelectedLang(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {budgetConfig?.languages?.map((lang) => (
                      <option key={lang.name} value={lang.name}>
                        {lang.name} (Factor multiplicador: x{lang.factor})
                      </option>
                    ))}
                  </select>
                </div>

                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
                  <Icon name="smart_toy" size={20} className="text-blue-600" />
                  <span>2. Módulos de Inteligencia Artificial (IA)</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nivel de Integración de IA:
                  </label>
                  <select
                    value={calcSelectedIA}
                    onChange={(e) => setCalcSelectedIA(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {budgetConfig?.ia_modules?.map((ia) => (
                      <option key={ia.name} value={ia.name}>
                        {ia.name} (+${ia.cost_usd} USD)
                      </option>
                    ))}
                  </select>
                </div>

                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
                  <Icon name="palette" size={20} className="text-blue-600" />
                  <span>3. Diseño UI/UX</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nivel de Diseño:
                  </label>
                  <select
                    value={calcSelectedDesign}
                    onChange={(e) => setCalcSelectedDesign(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {budgetConfig?.design_levels?.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} (+${d.cost_usd} USD)
                      </option>
                    ))}
                  </select>
                </div>

                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
                  <Icon name="dns" size={20} className="text-blue-600" />
                  <span>4. Infraestructura y Hosting</span>
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={calcIncludeDomain}
                      onChange={(e) => setCalcIncludeDomain(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded-md focus:ring-blue-500"
                    />
                    <div className="flex-1 text-xs font-semibold text-slate-800">
                      Incluir Dominio Anual (.com / .online / .com.ar)
                    </div>
                    <span className="text-xs font-bold text-slate-600 font-mono">
                      +${budgetConfig?.infrastructure?.domain_annual_usd || 18} USD/año
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Tipo de Servidor:
                      </label>
                      <select
                        value={calcServerType}
                        onChange={(e) => setCalcServerType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                      >
                        <option value="server_basic_monthly_usd">
                          Hosting Compartido (+${budgetConfig?.infrastructure?.server_basic_monthly_usd || 15}/mes)
                        </option>
                        <option value="server_vps_monthly_usd">
                          Servidor VPS (+${budgetConfig?.infrastructure?.server_vps_monthly_usd || 35}/mes)
                        </option>
                        <option value="server_cloud_dedicated_monthly_usd">
                          Cloud Dedicado (+${budgetConfig?.infrastructure?.server_cloud_dedicated_monthly_usd || 90}/mes)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Meses de Servidor:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        value={calcServerMonths}
                        onChange={(e) => setCalcServerMonths(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Margen de Contingencia / Comercial (%):
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="5"
                      value={calcMarginPercent}
                      onChange={(e) => setCalcMarginPercent(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold mt-1">
                      <span>0%</span>
                      <span className="text-blue-600 font-bold">{calcMarginPercent}%</span>
                      <span>40%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel de Resumen de Cotización (Planilla Formal de Presupuesto) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Planilla de Cotización
                        </span>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                          Presupuesto Estimado
                        </h3>
                      </div>
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                        Uso Interno
                      </span>
                    </div>

                    {/* Desglose en tabla */}
                    <table className="w-full text-xs border-collapse mb-6">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-600 font-medium">
                            Desarrollo ({calcHours}h x ${calcHourlyRate} x{langFactor}):
                          </td>
                          <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                            ${costDevelopmentUSD.toLocaleString()} USD
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-600 font-medium">Módulo de IA:</td>
                          <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                            ${costIaUSD.toLocaleString()} USD
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-600 font-medium">Diseño UI/UX:</td>
                          <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                            ${costDesignUSD.toLocaleString()} USD
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-600 font-medium">
                            Hosting ({calcServerMonths} meses) + Dominio:
                          </td>
                          <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                            ${(costServerUSD + costDomainUSD).toLocaleString()} USD
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 text-slate-500">
                          <td className="py-2.5">Subtotal Base:</td>
                          <td className="py-2.5 text-right font-mono font-semibold">
                            ${subtotalUSD.toLocaleString()} USD
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 text-blue-600 font-semibold">
                          <td className="py-2.5">Margen Comercial ({calcMarginPercent}%):</td>
                          <td className="py-2.5 text-right font-mono">
                            +${marginUSD.toLocaleString()} USD
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Total USD */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl mb-4 shadow-md">
                      <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Total Presupuestado en USD
                      </div>
                      <div className="text-3xl font-black font-mono text-emerald-400">
                        ${totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs text-white font-normal ml-1">USD</span>
                      </div>
                    </div>

                    {/* Total Pesos Argentinos (ARS) */}
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-5 rounded-2xl">
                      <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold uppercase tracking-wider mb-1">
                        <span>Total en Pesos Argentinos (ARS)</span>
                        <span className="font-mono">${blueRate} Blue</span>
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-900">
                        ${totalARS.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        <span className="text-xs text-emerald-700 font-normal ml-1">ARS</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de copia rápida para enviar al cliente */}
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => {
                        const copyText = `Propuesta estimada: ${calcHours} horas de desarrollo en ${calcSelectedLang}, ${calcSelectedIA}, diseño ${calcSelectedDesign}. Inversión estimada: $${totalUSD.toFixed(0)} USD (o aprox. $${totalARS.toLocaleString('es-AR')} ARS cotización blue).`;
                        navigator.clipboard.writeText(copyText);
                        alert('¡Resumen de presupuesto copiado al portapapeles!');
                      }}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Icon name="content_copy" size={16} />
                      <span>Copiar Resumen para el Cliente</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: CONFIGURACIÓN EDITABLE DE COSTOS Y TABLA       */}
      {/* ========================================================= */}
      {activeTab === 'configuracion' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Configuración de Parámetros de Costos</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Estos valores alimentan la tabla de la calculadora de presupuestos y quedan guardados en MySQL.
                  </p>
                </div>

                <button
                  onClick={handleSaveBudgetConfig}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Icon name="save" size={16} />
                  <span>Guardar Cambios</span>
                </button>
              </div>

              {saveConfigMsg && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                  <Icon name="check_circle" size={18} className="text-emerald-600" />
                  <span>{saveConfigMsg}</span>
                </div>
              )}

              {isLoadingConfig || !budgetConfig ? (
                <div className="p-8 text-center text-xs text-slate-400">Cargando configuración...</div>
              ) : (
                <form onSubmit={handleSaveBudgetConfig} className="space-y-8">
                  {/* Tarifa Base */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                      1. Tarifa Base General (USD / Hora)
                    </h3>
                    <div className="max-w-xs">
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={budgetConfig.hourly_rate || 35}
                        onChange={(e) => setBudgetConfig({ ...budgetConfig, hourly_rate: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Factores de Lenguajes */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                      2. Factores Multiplicadores por Lenguaje / Stack
                    </h3>
                    <div className="space-y-2.5">
                      {budgetConfig.languages?.map((lang, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <input
                            type="text"
                            value={lang.name}
                            onChange={(e) => {
                              const updated = [...budgetConfig.languages];
                              updated[idx].name = e.target.value;
                              setBudgetConfig({ ...budgetConfig, languages: updated });
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-bold">Multiplicador: x</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0.5"
                              max="3"
                              value={lang.factor}
                              onChange={(e) => {
                                const updated = [...budgetConfig.languages];
                                updated[idx].factor = Number(e.target.value);
                                setBudgetConfig({ ...budgetConfig, languages: updated });
                              }}
                              className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Módulos de IA */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                      3. Costos por Módulos de Inteligencia Artificial (USD Fijo)
                    </h3>
                    <div className="space-y-2.5">
                      {budgetConfig.ia_modules?.map((ia, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <input
                            type="text"
                            value={ia.name}
                            onChange={(e) => {
                              const updated = [...budgetConfig.ia_modules];
                              updated[idx].name = e.target.value;
                              setBudgetConfig({ ...budgetConfig, ia_modules: updated });
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-bold">$ USD:</span>
                            <input
                              type="number"
                              min="0"
                              max="10000"
                              value={ia.cost_usd}
                              onChange={(e) => {
                                const updated = [...budgetConfig.ia_modules];
                                updated[idx].cost_usd = Number(e.target.value);
                                setBudgetConfig({ ...budgetConfig, ia_modules: updated });
                              }}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Infraestructura */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                      4. Costos de Infraestructura y Servidores (USD)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Dominio Anual ($ USD):</label>
                        <input
                          type="number"
                          value={budgetConfig.infrastructure?.domain_annual_usd || 18}
                          onChange={(e) => setBudgetConfig({
                            ...budgetConfig,
                            infrastructure: { ...budgetConfig.infrastructure, domain_annual_usd: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hosting Básico Mensual ($ USD):</label>
                        <input
                          type="number"
                          value={budgetConfig.infrastructure?.server_basic_monthly_usd || 15}
                          onChange={(e) => setBudgetConfig({
                            ...budgetConfig,
                            infrastructure: { ...budgetConfig.infrastructure, server_basic_monthly_usd: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">VPS Mensual ($ USD):</label>
                        <input
                          type="number"
                          value={budgetConfig.infrastructure?.server_vps_monthly_usd || 35}
                          onChange={(e) => setBudgetConfig({
                            ...budgetConfig,
                            infrastructure: { ...budgetConfig.infrastructure, server_vps_monthly_usd: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Cloud Dedicado Mensual ($ USD):</label>
                        <input
                          type="number"
                          value={budgetConfig.infrastructure?.server_cloud_dedicated_monthly_usd || 90}
                          onChange={(e) => setBudgetConfig({
                            ...budgetConfig,
                            infrastructure: { ...budgetConfig.infrastructure, server_cloud_dedicated_monthly_usd: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Icon name="save" size={16} />
                      <span>Guardar Toda la Configuración</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
