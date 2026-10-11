import React, { useState, useEffect } from 'react';
import { Icon } from '../components/common/Icon';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('nefetech_admin_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nefetech_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Pestañas principales: 'dashboard', 'leads', 'calculadora', 'configuracion'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal para agrandar el chat de un lead a pantalla completa
  const [expandedChatLead, setExpandedChatLead] = useState(null);

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
  // CALCULADORA & ASESORÍA & COTIZACIÓN
  // -------------------------------------------------------------
  const [dolarRate, setDolarRate] = useState({ blue: 1540, actualizado: '' });
  const [budgetConfig, setBudgetConfig] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  // Historial de cambios y cotizaciones enviadas
  const [configHistory, setConfigHistory] = useState([]);
  const [sentQuotations, setSentQuotations] = useState([]);
  const [percentageIncreaseInput, setPercentageIncreaseInput] = useState(10);
  const [isApplyingIncrease, setIsApplyingIncrease] = useState(false);
  const [increaseSuccessMsg, setIncreaseSuccessMsg] = useState('');

  // Modo de la Calculadora: 'manual' o 'ia'
  const [calcMode, setCalcMode] = useState('ia');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');

  // Parámetros calculables
  const [calcHours, setCalcHours] = useState(50);
  const [calcHourlyRate, setCalcHourlyRate] = useState(35);
  
  // Selección de Stack: 'combo' o 'custom' (individual)
  const [calcStackMode, setCalcStackMode] = useState('combo');
  const [calcSelectedCombo, setCalcSelectedCombo] = useState('MERN (React + Node.js)');
  const [calcSelectedFrontend, setCalcSelectedFrontend] = useState('React / Next.js');
  const [calcSelectedBackend, setCalcSelectedBackend] = useState('Node.js / Express / NestJS');
  
  const [calcSelectedIA, setCalcSelectedIA] = useState('RAG Semántico con Base Vectorial');
  const [calcSelectedAsesoria, setCalcSelectedAsesoria] = useState('Diagnóstico Inicial de Procesos y Arquitectura');
  const [calcIncludeDomain, setCalcIncludeDomain] = useState(true);
  const [calcServerType, setCalcServerType] = useState('server_basic_monthly_usd');
  const [calcServerMonths, setCalcServerMonths] = useState(12);
  const [calcSelectedDesign, setCalcSelectedDesign] = useState('UI Kit Moderno & Responsive (Tailwind)');
  const [calcMarginPercent, setCalcMarginPercent] = useState(15);

  // Manejo de Login
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

  // Cargar Leads
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

  // Cargar Detalle del Lead
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

  // Cargar Parámetros de Presupuesto y Cotización Dólar
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
        if (data.history) {
          setConfigHistory(data.history);
        }
        if (data.sent_quotations) {
          setSentQuotations(data.sent_quotations);
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

  // Estimador con Inteligencia Artificial
  const handleAIEstimate = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiEstimating) return;

    setIsAiEstimating(true);
    setAiAnalysisResult('');

    try {
      const res = await fetch('/api/admin/ai_estimate.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.success && data.estimation) {
        const est = data.estimation;
        setAiAnalysisResult(est.analisis || 'Estimación procesada con éxito.');
        if (est.horas_sugeridas) setCalcHours(Number(est.horas_sugeridas));
        if (est.stack_tipo === 'combo' && est.combo_sugerido) {
          setCalcStackMode('combo');
          setCalcSelectedCombo(est.combo_sugerido);
        } else if (est.frontend_sugerido || est.backend_sugerido) {
          setCalcStackMode('custom');
          if (est.frontend_sugerido) setCalcSelectedFrontend(est.frontend_sugerido);
          if (est.backend_sugerido) setCalcSelectedBackend(est.backend_sugerido);
        }
        if (est.ia_modulo_sugerido) setCalcSelectedIA(est.ia_modulo_sugerido);
        if (est.diseno_sugerido) setCalcSelectedDesign(est.diseno_sugerido);
        if (est.servidor_sugerido) setCalcServerType(est.servidor_sugerido);
        if (est.meses_servidor) setCalcServerMonths(Number(est.meses_servidor));
        if (est.incluir_dominio !== undefined) setCalcIncludeDomain(Boolean(est.incluir_dominio));
        if (est.asesoria_modulo_sugerido) setCalcSelectedAsesoria(est.asesoria_modulo_sugerido);
        if (est.margen_sugerido) setCalcMarginPercent(Number(est.margen_sugerido));
      } else {
        alert(data.error || 'No se pudo generar la estimación de IA');
      }
    } catch {
      alert('Error de conexión al consultar el asistente de IA');
    } finally {
      setIsAiEstimating(false);
    }
  };

  // Enviar Respuesta a Lead (y registrar cotización si está adjunta)
  const [attachCurrentQuotation, setAttachCurrentQuotation] = useState(false);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedLeadId) return;

    setIsSendingReply(true);
    setReplySuccessMsg('');

    try {
      const payload = {
        lead_id: selectedLeadId,
        channel: replyChannel,
        subject: replySubject,
        message: replyMessage
      };

      if (attachCurrentQuotation) {
        payload.quotation = {
          hours: calcHours,
          hourly_rate_usd: stackRatePerHourUSD,
          stack_description: stackDescription,
          asesoria_module: calcSelectedAsesoria,
          asesoria_cost_usd: costAsesoriaUSD,
          ia_module: calcSelectedIA,
          ia_cost_usd: costIaUSD,
          design_level: calcSelectedDesign,
          design_cost_usd: costDesignUSD,
          server_type: calcServerType,
          server_months: calcServerMonths,
          server_cost_usd: costServerUSD,
          domain_included: calcIncludeDomain,
          domain_cost_usd: costDomainUSD,
          margin_percent: calcMarginPercent,
          total_usd: totalUSD,
          dolar_blue_rate: blueRate,
          total_ars: totalARS,
          full_summary: `Cotización formal: ${calcHours}h en ${stackDescription}, ${calcSelectedAsesoria}, ${calcSelectedIA}, diseño ${calcSelectedDesign}, infraestructura ($${costServerUSD + costDomainUSD} USD). Total: $${totalUSD.toFixed(2)} USD / $${totalARS.toLocaleString('es-AR')} ARS (Blue $${blueRate}).`
        };
      }

      const res = await fetch('/api/admin/reply.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setReplySuccessMsg('¡Mensaje enviado y registrado en la cadena de conversación!');
        setReplyMessage('');
        setAttachCurrentQuotation(false);
        fetchLeadDetail(selectedLeadId);
        fetchLeads();
        fetchBudgetConfig();
      } else {
        alert(data.error || 'Error al enviar respuesta');
      }
    } catch {
      alert('Error de conexión al enviar');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Guardar Cambios en Configuración de Presupuestos
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
        body: JSON.stringify({ action: 'save', configs: budgetConfig })
      });
      const data = await res.json();
      if (data.success) {
        setSaveConfigMsg('¡Parámetros de presupuesto guardados con éxito!');
        if (data.history) setConfigHistory(data.history);
        setTimeout(() => setSaveConfigMsg(''), 4000);
      }
    } catch {
      alert('Error al guardar configuración');
    }
  };

  // Aplicar Aumento Porcentual Masivo a Todas las Tarifas
  const handleApplyPercentageIncrease = async (e) => {
    e.preventDefault();
    const percent = Number(percentageIncreaseInput);
    if (!percent || percent <= 0) {
      alert('Ingresa un porcentaje de aumento mayor a 0');
      return;
    }

    if (!window.confirm(`¿Confirmas aplicar un aumento de +${percent}% a TODAS las tarifas de lenguajes, combos, asesorías y servidores?`)) {
      return;
    }

    setIsApplyingIncrease(true);
    setIncreaseSuccessMsg('');

    try {
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'percentage_increase', percentage: percent })
      });
      const data = await res.json();
      if (data.success) {
        setBudgetConfig(data.configs);
        if (data.history) setConfigHistory(data.history);
        setIncreaseSuccessMsg(`¡Aumento del +${percent}% aplicado y registrado en el historial!`);
        setTimeout(() => setIncreaseSuccessMsg(''), 5000);
      } else {
        alert(data.error || 'Error al aplicar aumento');
      }
    } catch {
      alert('Error de conexión al aplicar aumento');
    } finally {
      setIsApplyingIncrease(false);
    }
  };

  // Cálculos matemáticos de la Calculadora con soporte de Combos y Stack Individual por Precio/Hora
  let stackRatePerHourUSD = Number(budgetConfig?.hourly_rate) || 35;
  let stackDescription = '';

  if (calcStackMode === 'combo') {
    const comboObj = budgetConfig?.stack_combos?.find(c => c.name === calcSelectedCombo);
    stackRatePerHourUSD = comboObj ? Number(comboObj.price_per_hour_usd || (comboObj.factor ? comboObj.factor * 35 : 40)) : 40;
    stackDescription = comboObj ? `${comboObj.name} (${comboObj.frontend} + ${comboObj.backend})` : calcSelectedCombo;
  } else {
    // Modo individual / personalizado (mezclar front y back)
    const frontObj = budgetConfig?.frontend_techs?.find(f => f.name === calcSelectedFrontend);
    const backObj = budgetConfig?.backend_techs?.find(b => b.name === calcSelectedBackend);
    const frontRate = frontObj ? Number(frontObj.price_per_hour_usd || (frontObj.factor ? frontObj.factor * 35 : 38)) : 38;
    const backRate = backObj ? Number(backObj.price_per_hour_usd || (backObj.factor ? backObj.factor * 35 : 40)) : 40;
    // Promedio de tarifa horaria combinada
    stackRatePerHourUSD = Math.round((frontRate + backRate) / 2);
    stackDescription = `${calcSelectedFrontend} ($${frontRate}/h) + ${calcSelectedBackend} ($${backRate}/h)`;
  }

  const costDevelopmentUSD = calcHours * stackRatePerHourUSD;

  const selectedIaObj = budgetConfig?.ia_modules?.find(i => i.name === calcSelectedIA);
  const costIaUSD = selectedIaObj ? Number(selectedIaObj.cost_usd) : 0;

  const selectedAsesoriaObj = budgetConfig?.consultoria_modules?.find(c => c.name === calcSelectedAsesoria);
  const costAsesoriaUSD = selectedAsesoriaObj ? Number(selectedAsesoriaObj.cost_usd) : 0;

  const costDomainUSD = calcIncludeDomain ? Number(budgetConfig?.infrastructure?.domain_annual_usd || 18) : 0;
  const serverMonthlyRate = Number(budgetConfig?.infrastructure?.[calcServerType] || 0);
  const costServerUSD = serverMonthlyRate * calcServerMonths;

  const selectedDesignObj = budgetConfig?.design_levels?.find(d => d.name === calcSelectedDesign);
  const costDesignUSD = selectedDesignObj ? Number(selectedDesignObj.cost_usd) : 0;

  const subtotalUSD = costDevelopmentUSD + costIaUSD + costAsesoriaUSD + costDomainUSD + costServerUSD + costDesignUSD;
  const marginUSD = (subtotalUSD * (calcMarginPercent / 100));
  const totalUSD = subtotalUSD + marginUSD;

  const blueRate = Number(dolarRate.blue) || 1540;
  const totalARS = totalUSD * blueRate;

  // Estadísticas para el Dashboard Gráfico
  const totalLeadsCount = leads.length;
  const nuevosLeadsCount = leads.filter(l => l.status === 'nuevo').length;
  const enCursoLeadsCount = leads.filter(l => l.status === 'en_contacto').length;
  const conWhatsAppCount = leads.filter(l => Boolean(l.phone)).length;
  const conEmailCount = leads.filter(l => Boolean(l.email)).length;
  const tasaContacto = totalLeadsCount > 0 ? Math.round((conEmailCount / totalLeadsCount) * 100) : 0;

  // Si no está autenticado, Login
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
      
      {/* ========================================================= */}
      {/* MODAL PARA AGRANDAR CHAT A PANTALLA COMPLETA              */}
      {/* ========================================================= */}
      {expandedChatLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center">
                  <Icon name="chat" size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Historial Completo con IA • Lead #{expandedChatLead.id}</h3>
                  <span className="text-xs text-slate-400">
                    {expandedChatLead.email || 'Sin email'} • {expandedChatLead.phone || 'Sin WhatsApp'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExpandedChatLead(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {!leadDetail?.chat_history || leadDetail.chat_history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Sin mensajes registrados en esta sesión.</div>
              ) : (
                leadDetail.chat_history.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[11px] opacity-75 mb-1.5 font-bold">
                        <span>{msg.sender === 'user' ? '👤 Cliente' : '🤖 Asistente Nefetech'}</span>
                        <span>{msg.created_at}</span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed">{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setExpandedChatLead(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white">
              N
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none">Nefetech CRM Admin</h1>
              <span className="text-[11px] text-slate-400">Control Comercial, Cotizaciones & IA</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="dashboard" size={15} />
              <span>Dashboard & Métricas</span>
            </button>
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
              <span>Calculadora & Asesoría</span>
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
            <button
              onClick={() => setActiveTab('historiales')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'historiales' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="history" size={15} />
              <span>Historiales</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
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
            title="Refrescar cotizaciones"
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
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center ${activeTab === 'dashboard' ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}
        >
          Métricas
        </button>
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
          Costos
        </button>
        <button
          onClick={() => setActiveTab('historiales')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center ${activeTab === 'historiales' ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}
        >
          Historiales
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 0: DASHBOARD LIMPIO CON GRÁFICOS Y PROMEDIOS      */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Tarjeta de bienvenida / encabezado métrico */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Métricas & Estado Comercial</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Resumen estadístico de captación, canales de contacto y cotización promedio.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('calculadora')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="add" size={16} />
                  <span>Nueva Cotización</span>
                </button>
              </div>
            </div>

            {/* Tarjetas KPI Superiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon name="groups" size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{totalLeadsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Registrados en la plataforma</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nuevos Sin Contactar</span>
                  <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Icon name="mark_email_unread" size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-600">{nuevosLeadsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Requieren primera propuesta</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">En Conversación</span>
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon name="forum" size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-indigo-600">{enCursoLeadsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Con respuestas despachadas</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasa de Identificación</span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Icon name="contact_mail" size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-600">{tasaContacto}%</div>
                <div className="text-[11px] text-slate-400 mt-1">De leads dejaron correo válido</div>
              </div>
            </div>

            {/* Gráficos Visuales de Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Gráfico 1: Canales de Contacto */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Icon name="pie_chart" size={18} className="text-blue-600" />
                  <span>Distribución de Canales de Contacto</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Correo Electrónico ({conEmailCount})</span>
                      <span>{totalLeadsCount > 0 ? Math.round((conEmailCount / totalLeadsCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalLeadsCount > 0 ? (conEmailCount / totalLeadsCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>WhatsApp / Teléfono ({conWhatsAppCount})</span>
                      <span>{totalLeadsCount > 0 ? Math.round((conWhatsAppCount / totalLeadsCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalLeadsCount > 0 ? (conWhatsAppCount / totalLeadsCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Tarifa Base Definida</span>
                    <div className="text-xl font-black text-slate-800 mt-0.5">${calcHourlyRate} USD/h</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Cotización Blue</span>
                    <div className="text-xl font-black text-emerald-600 mt-0.5">${blueRate} ARS</div>
                  </div>
                </div>
              </div>

              {/* Gráfico 2: Accesos Directos & Actividad Rápida */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Icon name="bolt" size={18} className="text-blue-600" />
                    <span>Acciones Frecuentes</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Gestiona leads pendientes, envía presupuestos automatizados o personaliza el tarifario de Nefetech.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon name="inbox" size={18} className="text-blue-600" />
                        <span>Ver Bandeja de Leads ({leads.length})</span>
                      </div>
                      <Icon name="chevron_right" size={16} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('calculadora')}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon name="calculate" size={18} className="text-indigo-600" />
                        <span>Abrir Calculadora Inteligente con IA</span>
                      </div>
                      <Icon name="chevron_right" size={16} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('configuracion')}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon name="settings" size={18} className="text-slate-600" />
                        <span>Configurar Costos & Multiplicadores</span>
                      </div>
                      <Icon name="chevron_right" size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  Plataforma Nefetech v2.0 • Sincronizada en Tiempo Real
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 1: BANDEJA DE LEADS & CRM                         */}
      {/* ========================================================= */}
      {activeTab === 'leads' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
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
                          setAiPrompt(activeLead.lead_message);
                          setActiveTab('calculadora');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Icon name="calculate" size={16} />
                        <span>Cotizar con IA</span>
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

                    {/* Opción de Adjuntar y Registrar Cotización Formal */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attachCurrentQuotation}
                          onChange={(e) => {
                            setAttachCurrentQuotation(e.target.checked);
                            if (e.target.checked && !replyMessage.includes('Presupuesto Estimado:')) {
                              const cotizText = `\n\n--- PRESUPUESTO FORMAL ESTIMADO ---\n• Desarrollo (${calcHours}h a $${stackRatePerHourUSD}/h): ${stackDescription}\n• Asesoría: ${calcSelectedAsesoria} ($${costAsesoriaUSD} USD)\n• Módulo IA: ${calcSelectedIA} ($${costIaUSD} USD)\n• Diseño UI/UX: ${calcSelectedDesign} ($${costDesignUSD} USD)\n• Servidor + Dominio: $${costServerUSD + costDomainUSD} USD\n• Total Estimado: $${totalUSD.toFixed(0)} USD (o aprox. $${totalARS.toLocaleString('es-AR')} ARS cotización dólar blue $${blueRate}).`;
                              setReplyMessage((prev) => prev ? prev + cotizText : cotizText.trim());
                            }
                          }}
                          className="mt-0.5 h-4 w-4 text-blue-600 rounded-md focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-800 block">
                            Adjuntar y registrar cotización calculada activa (${totalUSD.toFixed(0)} USD / ${totalARS.toLocaleString('es-AR')} ARS)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Guarda el registro histórico oficial de la cotización enviada con el valor exacto del dólar y tarifas del momento.
                          </span>
                        </div>
                      </label>
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

                {/* Transcripción del Chatbot con BOTÓN AGRANDAR */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="chat" size={16} className="text-blue-600" />
                      <span>Historial de Conversación con el Asistente</span>
                    </h3>

                    {leadDetail?.chat_history && leadDetail.chat_history.length > 0 && (
                      <button
                        onClick={() => setExpandedChatLead(activeLead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        title="Ver chat completo en pantalla grande"
                      >
                        <Icon name="open_in_full" size={14} />
                        <span>Agrandar Chat</span>
                      </button>
                    )}
                  </div>

                  {!leadDetail?.chat_history || leadDetail.chat_history.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">Sin mensajes previos registrados.</div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-slate-50/60 rounded-xl border border-slate-100">
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
      {/* PESTAÑA 2: CALCULADORA DE PRESUPUESTO & ASESORÍA CON IA   */}
      {/* ========================================================= */}
      {activeTab === 'calculadora' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Encabezado con Cotización Dólar */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Cotizador Dinámico • Software, IA y Asesoría Tecnológica
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-1">Calculadora de Presupuestos</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Estima por parámetros manuales o deja que la IA analice la idea del proyecto en segundos.
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

            {/* Selector de Modo: Asistente IA vs Manual */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs max-w-md">
              <button
                onClick={() => setCalcMode('ia')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  calcMode === 'ia' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon name="auto_awesome" size={16} />
                <span>Estimar con IA (Chat)</span>
              </button>
              <button
                onClick={() => setCalcMode('manual')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  calcMode === 'manual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon name="tune" size={16} />
                <span>Configuración Manual</span>
              </button>
            </div>

            {/* MODO ASISTENTE DE IA PARA COTIZAR */}
            {calcMode === 'ia' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-blue-100 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Icon name="smart_toy" size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Asistente de Estimación IA</h3>
                    <p className="text-xs text-slate-500">Pega o describe la idea del cliente y la IA sugerirá horas, stack, IA y asesoría.</p>
                  </div>
                </div>

                <form onSubmit={handleAIEstimate} className="space-y-3">
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ejemplo: El cliente necesita un sistema para una clínica odontológica con turnos online, historia clínica, recordatorios de WhatsApp automáticos y módulo de IA para predecir ausencias..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAiEstimating || !aiPrompt.trim()}
                      className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Icon name="auto_awesome" size={16} />
                      <span>{isAiEstimating ? 'Analizando requerimiento...' : 'Analizar & Calcular con IA'}</span>
                    </button>
                  </div>
                </form>

                {aiAnalysisResult && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-slate-800 leading-relaxed space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Icon name="lightbulb" size={16} className="text-amber-500" />
                      <span>Diagnóstico de la IA:</span>
                    </div>
                    <p>{aiAnalysisResult}</p>
                    <div className="text-[11px] text-blue-700 font-semibold pt-1">
                      Los parámetros en la calculadora han sido calibrados automáticamente según este análisis.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Formulario de Parámetros */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 space-y-6">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Icon name="code" size={20} className="text-blue-600" />
                  <span>1. Desarrollo de Software</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Horas Estimadas:
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Stack Tecnológico:
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCalcStackMode('combo')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          calcStackMode === 'combo' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Combos Predefinidos
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcStackMode('custom')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          calcStackMode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Individual (Front + Back)
                      </button>
                    </div>
                  </div>

                  {calcStackMode === 'combo' ? (
                    <div>
                      <select
                        value={calcSelectedCombo}
                        onChange={(e) => setCalcSelectedCombo(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                      >
                        {budgetConfig?.stack_combos?.map((combo) => {
                          const rate = combo.price_per_hour_usd || (combo.factor ? Math.round(combo.factor * 35) : 40);
                          return (
                            <option key={combo.name} value={combo.name}>
                              {combo.name} — ({combo.frontend} + {combo.backend}) [${rate} USD/h]
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                        <span>Tarifa horaria del combo:</span>
                        <strong className="text-emerald-600 font-mono text-xs">${stackRatePerHourUSD} USD / hora</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Frontend:
                        </label>
                        <select
                          value={calcSelectedFrontend}
                          onChange={(e) => setCalcSelectedFrontend(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                        >
                          {budgetConfig?.frontend_techs?.map((front) => {
                            const rate = front.price_per_hour_usd || (front.factor ? Math.round(front.factor * 35) : 38);
                            return (
                              <option key={front.name} value={front.name}>
                                {front.name} (${rate} USD/h)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Backend / API:
                        </label>
                        <select
                          value={calcSelectedBackend}
                          onChange={(e) => setCalcSelectedBackend(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                        >
                          {budgetConfig?.backend_techs?.map((back) => {
                            const rate = back.price_per_hour_usd || (back.factor ? Math.round(back.factor * 35) : 40);
                            return (
                              <option key={back.name} value={back.name}>
                                {back.name} (${rate} USD/h)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="sm:col-span-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Tarifa horaria promedio:</span>
                        <strong className="text-emerald-600 font-mono text-xs">${stackRatePerHourUSD} USD / hora</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Asesoría y Consultoría */}
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
                  <Icon name="psychology" size={20} className="text-blue-600" />
                  <span>2. Asesoría & Consultoría Tecnológica</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nivel de Asesoramiento:
                  </label>
                  <select
                    value={calcSelectedAsesoria}
                    onChange={(e) => setCalcSelectedAsesoria(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {budgetConfig?.consultoria_modules?.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} (+${c.cost_usd} USD)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inteligencia Artificial */}
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
                  <Icon name="smart_toy" size={20} className="text-blue-600" />
                  <span>3. Soluciones de Inteligencia Artificial (IA)</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Módulo de IA:
                  </label>
                  <select
                    value={calcSelectedIA}
                    onChange={(e) => setCalcSelectedIA(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {budgetConfig?.ia_modules?.map((ia) => (
                      <option key={ia.name} value={ia.name}>
                        {ia.name} (+${ia.cost_usd} USD)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Diseño UI/UX */}
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
                  <Icon name="palette" size={20} className="text-blue-600" />
                  <span>4. Diseño UI/UX</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nivel de Diseño:
                  </label>
                  <select
                    value={calcSelectedDesign}
                    onChange={(e) => setCalcSelectedDesign(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {budgetConfig?.design_levels?.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} (+${d.cost_usd} USD)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Infraestructura */}
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
                  <Icon name="dns" size={20} className="text-blue-600" />
                  <span>5. Infraestructura & Servidores</span>
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
                      Incluir Dominio Anual
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
                      Margen Comercial (%):
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

              {/* Panel de Resumen de Cotización */}
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

                    <table className="w-full text-xs border-collapse mb-6">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-600 font-medium">
                            <div>Desarrollo ({calcHours}h x ${stackRatePerHourUSD} USD/h):</div>
                            <div className="text-[10px] text-blue-600 font-semibold">{stackDescription}</div>
                          </td>
                          <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                            ${costDevelopmentUSD.toLocaleString()} USD
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-600 font-medium">Asesoría / Consultoría:</td>
                          <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                            ${costAsesoriaUSD.toLocaleString()} USD
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
                            Hosting ({calcServerMonths}m) + Dominio:
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

                    <div className="bg-slate-900 text-white p-5 rounded-2xl mb-4 shadow-md">
                      <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Total Presupuestado en USD
                      </div>
                      <div className="text-3xl font-black font-mono text-emerald-400">
                        ${totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs text-white font-normal ml-1">USD</span>
                      </div>
                    </div>

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

                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => {
                        const copyText = `Propuesta estimada Nefetech: ${calcHours} horas de desarrollo en ${stackDescription}, ${calcSelectedAsesoria}, ${calcSelectedIA}, diseño ${calcSelectedDesign}. Inversión estimada: $${totalUSD.toFixed(0)} USD (o aprox. $${totalARS.toLocaleString('es-AR')} ARS cotización blue).`;
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
      {/* PESTAÑA 3: CONFIGURACIÓN EDITABLE DE COSTOS               */}
      {/* ========================================================= */}
      {activeTab === 'configuracion' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Configuración de Parámetros de Costos</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Valores maestros que alimentan el cotizador y la IA estimadora.
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

              {/* Herramienta de Aumento Porcentual Masivo */}
              <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <Icon name="trending_up" size={18} className="text-amber-600" />
                      <span>Aplicar Aumento Porcentual Masivo</span>
                    </div>
                    <p className="text-xs text-amber-700/80 mt-1">
                      Aplica un incremento general (+%) a todas las tarifas de lenguajes, combos, módulos de IA y servidores, registrando el cambio en el historial.
                    </p>
                  </div>

                  <form onSubmit={handleApplyPercentageIncrease} className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-white border border-amber-300 rounded-xl px-3 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-amber-800 mr-1">+</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        step="1"
                        value={percentageIncreaseInput}
                        onChange={(e) => setPercentageIncreaseInput(e.target.value)}
                        className="w-14 text-center text-xs font-black font-mono text-slate-800 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-amber-800">%</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isApplyingIncrease}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Icon name="bolt" size={14} />
                      <span>{isApplyingIncrease ? 'Aplicando...' : 'Aplicar Aumento'}</span>
                    </button>
                  </form>
                </div>

                {increaseSuccessMsg && (
                  <div className="mt-3 p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-lg font-bold flex items-center gap-2">
                    <Icon name="check_circle" size={16} className="text-emerald-700" />
                    <span>{increaseSuccessMsg}</span>
                  </div>
                )}
              </div>

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

                  {/* 2. Tecnologías Frontend (Añadir / Eliminar / Editar) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                          2. Tecnologías Frontend (Individuales)
                        </h3>
                        <p className="text-[11px] text-slate-500">Agrega o quita tecnologías frontend con su precio por hora en USD.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(budgetConfig.frontend_techs || [])];
                          updated.push({ name: 'Nuevo Frontend', price_per_hour_usd: 35 });
                          setBudgetConfig({ ...budgetConfig, frontend_techs: updated });
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Icon name="add" size={14} />
                        <span>Añadir Frontend</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {budgetConfig.frontend_techs?.map((front, idx) => {
                        const val = front.price_per_hour_usd ?? (front.factor ? Math.round(front.factor * 35) : 38);
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <input
                              type="text"
                              value={front.name}
                              placeholder="Ej. React / Next.js"
                              onChange={(e) => {
                                const updated = [...budgetConfig.frontend_techs];
                                updated[idx].name = e.target.value;
                                setBudgetConfig({ ...budgetConfig, frontend_techs: updated });
                              }}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 font-bold">$</span>
                              <input
                                type="number"
                                min="5"
                                max="500"
                                value={val}
                                onChange={(e) => {
                                  const updated = [...budgetConfig.frontend_techs];
                                  updated[idx].price_per_hour_usd = Number(e.target.value);
                                  setBudgetConfig({ ...budgetConfig, frontend_techs: updated });
                                }}
                                className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-mono"
                              />
                              <span className="text-[11px] text-slate-400 font-medium">USD/h</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (budgetConfig.frontend_techs.length <= 1) {
                                  alert('Debes conservar al menos una tecnología frontend');
                                  return;
                                }
                                const updated = budgetConfig.frontend_techs.filter((_, i) => i !== idx);
                                setBudgetConfig({ ...budgetConfig, frontend_techs: updated });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar tecnología"
                            >
                              <Icon name="delete" size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Tecnologías Backend (Añadir / Eliminar / Editar) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                          3. Tecnologías Backend (Individuales)
                        </h3>
                        <p className="text-[11px] text-slate-500">Agrega o quita tecnologías backend / APIs con su precio por hora en USD.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(budgetConfig.backend_techs || [])];
                          updated.push({ name: 'Nuevo Backend', price_per_hour_usd: 40 });
                          setBudgetConfig({ ...budgetConfig, backend_techs: updated });
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Icon name="add" size={14} />
                        <span>Añadir Backend</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {budgetConfig.backend_techs?.map((back, idx) => {
                        const val = back.price_per_hour_usd ?? (back.factor ? Math.round(back.factor * 35) : 40);
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <input
                              type="text"
                              value={back.name}
                              placeholder="Ej. Node.js / NestJS"
                              onChange={(e) => {
                                const updated = [...budgetConfig.backend_techs];
                                updated[idx].name = e.target.value;
                                setBudgetConfig({ ...budgetConfig, backend_techs: updated });
                              }}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 font-bold">$</span>
                              <input
                                type="number"
                                min="5"
                                max="500"
                                value={val}
                                onChange={(e) => {
                                  const updated = [...budgetConfig.backend_techs];
                                  updated[idx].price_per_hour_usd = Number(e.target.value);
                                  setBudgetConfig({ ...budgetConfig, backend_techs: updated });
                                }}
                                className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-mono"
                              />
                              <span className="text-[11px] text-slate-400 font-medium">USD/h</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (budgetConfig.backend_techs.length <= 1) {
                                  alert('Debes conservar al menos una tecnología backend');
                                  return;
                                }
                                const updated = budgetConfig.backend_techs.filter((_, i) => i !== idx);
                                setBudgetConfig({ ...budgetConfig, backend_techs: updated });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar backend"
                            >
                              <Icon name="delete" size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Combos de Stack (Mezclar Front + Back con Precio Fijo por Hora) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                          4. Combos de Stack (Front + Back Empaquetados)
                        </h3>
                        <p className="text-[11px] text-slate-500">Crea combos combinando backend + frontend con una tarifa por hora específica.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(budgetConfig.stack_combos || [])];
                          const defaultFront = budgetConfig.frontend_techs?.[0]?.name || 'React / Next.js';
                          const defaultBack = budgetConfig.backend_techs?.[0]?.name || 'Node.js / Express / NestJS';
                          updated.push({
                            name: `Nuevo Combo Stack (${updated.length + 1})`,
                            frontend: defaultFront,
                            backend: defaultBack,
                            price_per_hour_usd: 45
                          });
                          setBudgetConfig({ ...budgetConfig, stack_combos: updated });
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Icon name="add" size={14} />
                        <span>Crear Nuevo Combo</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {budgetConfig.stack_combos?.map((combo, idx) => {
                        const val = combo.price_per_hour_usd ?? (combo.factor ? Math.round(combo.factor * 35) : 42);
                        return (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={combo.name}
                                placeholder="Nombre del combo (ej. MERN Stack)"
                                onChange={(e) => {
                                  const updated = [...budgetConfig.stack_combos];
                                  updated[idx].name = e.target.value;
                                  setBudgetConfig({ ...budgetConfig, stack_combos: updated });
                                }}
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                              />
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500 font-bold">Precio: $</span>
                                <input
                                  type="number"
                                  min="5"
                                  max="500"
                                  value={val}
                                  onChange={(e) => {
                                    const updated = [...budgetConfig.stack_combos];
                                    updated[idx].price_per_hour_usd = Number(e.target.value);
                                    setBudgetConfig({ ...budgetConfig, stack_combos: updated });
                                  }}
                                  className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-mono"
                                />
                                <span className="text-[11px] text-slate-400 font-medium">USD/h</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (budgetConfig.stack_combos.length <= 1) {
                                    alert('Debes conservar al menos un combo de stack');
                                    return;
                                  }
                                  const updated = budgetConfig.stack_combos.filter((_, i) => i !== idx);
                                  setBudgetConfig({ ...budgetConfig, stack_combos: updated });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar combo"
                              >
                                <Icon name="delete" size={16} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Frontend del Combo:
                                </span>
                                <select
                                  value={combo.frontend}
                                  onChange={(e) => {
                                    const updated = [...budgetConfig.stack_combos];
                                    updated[idx].frontend = e.target.value;
                                    setBudgetConfig({ ...budgetConfig, stack_combos: updated });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                                >
                                  {budgetConfig.frontend_techs?.map((f) => (
                                    <option key={f.name} value={f.name}>{f.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Backend del Combo:
                                </span>
                                <select
                                  value={combo.backend}
                                  onChange={(e) => {
                                    const updated = [...budgetConfig.stack_combos];
                                    updated[idx].backend = e.target.value;
                                    setBudgetConfig({ ...budgetConfig, stack_combos: updated });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                                >
                                  {budgetConfig.backend_techs?.map((b) => (
                                    <option key={b.name} value={b.name}>{b.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Asesoría y Consultoría */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                      5. Servicios de Asesoría & Consultoría Tecnológica (USD Fijo)
                    </h3>
                    <div className="space-y-2.5">
                      {budgetConfig.consultoria_modules?.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const updated = [...budgetConfig.consultoria_modules];
                              updated[idx].name = e.target.value;
                              setBudgetConfig({ ...budgetConfig, consultoria_modules: updated });
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-bold">$ USD:</span>
                            <input
                              type="number"
                              min="0"
                              max="10000"
                              value={c.cost_usd}
                              onChange={(e) => {
                                const updated = [...budgetConfig.consultoria_modules];
                                updated[idx].cost_usd = Number(e.target.value);
                                setBudgetConfig({ ...budgetConfig, consultoria_modules: updated });
                              }}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Módulos de IA */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                      6. Costos por Módulos de Inteligencia Artificial (USD Fijo)
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
                      7. Costos de Infraestructura y Servidores (USD)
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

      {/* ========================================================= */}
      {/* PESTAÑA 4: HISTORIALES DE COTIZACIONES Y CAMBIOS DE PRECIOS */}
      {/* ========================================================= */}
      {activeTab === 'historiales' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* 1. Historial de Cotizaciones Enviadas */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Icon name="mark_email_read" size={18} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Historial de Cotizaciones Enviadas</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Registro inmutable de cotizaciones comerciales despachadas a clientes, conservando el valor exacto del momento (USD y cotización Blue).
                  </p>
                </div>

                <div className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  {sentQuotations.length} cotizaciones registradas
                </div>
              </div>

              {sentQuotations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Aún no se han despachado cotizaciones formales. Cuando respondas a un lead con la casilla "Adjuntar cotización formal", aparecerá registrada aquí automáticamente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-3">Fecha</th>
                        <th className="py-3 px-3">Cliente / Destinatario</th>
                        <th className="py-3 px-3">Canal</th>
                        <th className="py-3 px-3">Stack & Alcance</th>
                        <th className="py-3 px-3 text-right">Total USD</th>
                        <th className="py-3 px-3 text-right">Dólar Blue</th>
                        <th className="py-3 px-3 text-right">Total ARS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {sentQuotations.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(q.created_at).toLocaleDateString()} {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            <div>{q.client_recipient}</div>
                            {q.lead_id && <span className="text-[10px] text-blue-600 font-normal">Lead #{q.lead_id}</span>}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {q.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate">{q.stack_description}</div>
                            <div className="text-[11px] text-slate-400">
                              {q.hours}h • {q.asesoria_module || 'Sin asesoría'} • {q.ia_module || 'Sin IA'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-black font-mono text-emerald-600 whitespace-nowrap">
                            ${Number(q.total_usd).toLocaleString()} USD
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                            ${Number(q.dolar_blue_rate)}
                          </td>
                          <td className="py-3 px-3 text-right font-black font-mono text-slate-900 whitespace-nowrap">
                            ${Number(q.total_ars).toLocaleString('es-AR')} ARS
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Historial de Cambios de Parámetros y Tarifas */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Icon name="history" size={18} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Historial de Cambios de Costos & Aumentos</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Auditoría de aumentos porcentuales aplicados y ediciones de precios por hora y módulos.
                  </p>
                </div>

                <div className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  {configHistory.length} modificaciones registradas
                </div>
              </div>

              {configHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Sin registros de cambios previos.
                </div>
              ) : (
                <div className="space-y-3">
                  {configHistory.map((h) => (
                    <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.action_type === 'percentage_increase' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {h.action_type === 'percentage_increase' ? `Aumento +${h.percentage_applied}%` : 'Edición Manual'}
                          </span>
                          <span className="font-bold text-slate-800">{h.description}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Modificado por: <strong className="text-slate-600">{h.created_by}</strong>
                        </div>
                      </div>

                      <div className="text-slate-400 text-[11px] font-mono sm:text-right shrink-0">
                        {new Date(h.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
