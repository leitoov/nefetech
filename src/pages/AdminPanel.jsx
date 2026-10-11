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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const [saveConfigMsg, setSaveConfigMsg] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [activeHistorySubTab, setActiveHistorySubTab] = useState({});

  // -------------------------------------------------------------
  // ASISTENTE IA & PROMPTS VERSIONADOS & LÍMITES DE MENSAJES
  // -------------------------------------------------------------
  const [chatPrompts, setChatPrompts] = useState([]);
  const [activePromptText, setActivePromptText] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [chatMaxMessagesInput, setChatMaxMessagesInput] = useState(10);
  const [isSavingChatLimit, setIsSavingChatLimit] = useState(false);
  const [chatLimitSuccessMsg, setChatLimitSuccessMsg] = useState('');

  // Creación de nueva versión de Prompt (Inmutable)
  const [showNewPromptModal, setShowNewPromptModal] = useState(false);
  const [newPromptVersionName, setNewPromptVersionName] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptActivateNow, setNewPromptActivateNow] = useState(false);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [promptSuccessMsg, setPromptSuccessMsg] = useState('');
  const [isActivatingPrompt, setIsActivatingPrompt] = useState(false);

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
  const [calcServerType, setCalcServerType] = useState('none'); // 'none' permite no seleccionar servidor
  const [calcServerMonths, setCalcServerMonths] = useState(12);
  const [calcSelectedDesign, setCalcSelectedDesign] = useState('UI Kit Moderno & Responsive (Tailwind)');
  const [calcMarginPercent, setCalcMarginPercent] = useState(15);
  const [calcApplyIva, setCalcApplyIva] = useState(false); // Switch IVA 21% (Factura A / B)

  // Campañas de Descuento
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('none');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [campaignSuccessMsg, setCampaignSuccessMsg] = useState('');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignScope, setNewCampaignScope] = useState('all'); // 'all', 'desarrollo', 'ia', 'asesoria', 'servidores', 'diseno'
  const [newCampaignDiscountType, setNewCampaignDiscountType] = useState('percentage'); // 'percentage', 'fixed_usd'
  const [newCampaignDiscountValue, setNewCampaignDiscountValue] = useState(15);
  const [newCampaignStart, setNewCampaignStart] = useState(() => new Date().toISOString().slice(0, 16));
  const [newCampaignEnd, setNewCampaignEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 16);
  });
  const [newCampaignClient, setNewCampaignClient] = useState('all'); // 'all' o ID/Email específico
  const [newCampaignActive, setNewCampaignActive] = useState(true);

  // Modal: Enviar Cotización a Cliente Seleccionado
  const [showSendQuoteModal, setShowSendQuoteModal] = useState(false);
  const [selectedQuoteLeadId, setSelectedQuoteLeadId] = useState('');
  const [quoteRecipientName, setQuoteRecipientName] = useState('');
  const [quoteRecipientContact, setQuoteRecipientContact] = useState('');
  const [quoteSendChannel, setQuoteSendChannel] = useState('email');
  const [quoteCustomMessage, setQuoteCustomMessage] = useState('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quoteSentSuccessMsg, setQuoteSentSuccessMsg] = useState('');

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
        if (data.prompts) {
          setChatPrompts(data.prompts);
          const active = data.prompts.find(p => Number(p.is_active) === 1) || data.prompts[0];
          if (active) {
            setSelectedPromptId(active.id);
          }
        }
        if (data.active_prompt) {
          setActivePromptText(data.active_prompt);
        }
        if (data.configs?.chat_max_messages) {
          setChatMaxMessagesInput(Number(data.configs.chat_max_messages));
        }
        if (data.campaigns) {
          setCampaigns(data.campaigns);
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
          apply_iva: calcApplyIva,
          iva_usd: ivaUSD,
          net_usd: netUSD,
          total_usd: totalUSD,
          dolar_blue_rate: blueRate,
          total_ars: totalARS,
          full_summary: `Cotización formal: ${calcHours}h en ${stackDescription}, ${calcSelectedAsesoria}, ${calcSelectedIA}, diseño ${calcSelectedDesign}, infraestructura ($${costServerUSD + costDomainUSD} USD). ${calcApplyIva ? `Neto: $${netUSD.toFixed(0)} USD + IVA 21%: $${ivaUSD.toFixed(0)} USD = Total: $${totalUSD.toFixed(0)} USD` : `Total: $${totalUSD.toFixed(0)} USD`} / $${totalARS.toLocaleString('es-AR')} ARS (Blue $${blueRate}).`
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

  // Guardar Límite de Mensajes del Chat del Front
  const handleSaveMaxMessages = async (e) => {
    e.preventDefault();
    const limitNum = parseInt(chatMaxMessagesInput, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      alert('Por favor ingresa un número válido mayor a 0 para el límite de mensajes');
      return;
    }

    setIsSavingChatLimit(true);
    setChatLimitSuccessMsg('');

    try {
      const updatedConfig = { ...(budgetConfig || {}), chat_max_messages: limitNum };
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'save', configs: updatedConfig })
      });
      const data = await res.json();
      if (data.success) {
        setBudgetConfig(updatedConfig);
        setChatLimitSuccessMsg(`¡Límite de mensajes actualizado a ${limitNum} con éxito!`);
        setTimeout(() => setChatLimitSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'No se pudo actualizar el límite de mensajes');
      }
    } catch {
      alert('Error de conexión al actualizar límite');
    } finally {
      setIsSavingChatLimit(false);
    }
  };

  // Crear Nueva Versión de Prompt (Inmutable)
  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!newPromptVersionName.trim() || !newPromptText.trim()) {
      alert('Por favor completa el nombre de la versión y el contenido del prompt.');
      return;
    }

    setIsCreatingPrompt(true);
    setPromptSuccessMsg('');

    try {
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'create_prompt',
          version_name: newPromptVersionName.trim(),
          prompt_text: newPromptText.trim(),
          activate_immediately: newPromptActivateNow
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatPrompts(data.prompts || []);
        if (data.prompt) {
          setSelectedPromptId(data.prompt.id);
          if (newPromptActivateNow) {
            setActivePromptText(data.prompt.prompt_text);
          }
        }
        setShowNewPromptModal(false);
        setNewPromptVersionName('');
        setNewPromptText('');
        setNewPromptActivateNow(false);
        setPromptSuccessMsg('¡Nueva versión de Prompt guardada exitosamente en el historial inmutable!');
        setTimeout(() => setPromptSuccessMsg(''), 5000);
      } else {
        alert(data.error || 'Error al guardar la nueva versión de prompt');
      }
    } catch {
      alert('Error de conexión al guardar la nueva versión');
    } finally {
      setIsCreatingPrompt(false);
    }
  };

  // Switchear / Activar Versión de Prompt
  const handleActivatePrompt = async (promptId) => {
    if (!promptId || isActivatingPrompt) return;
    const targetPrompt = chatPrompts.find(p => p.id === promptId);
    if (!targetPrompt) return;

    if (!window.confirm(`¿Deseas activar "${targetPrompt.version_name}" como el Prompt de IA oficial en producción?`)) {
      return;
    }

    setIsActivatingPrompt(true);
    setPromptSuccessMsg('');

    try {
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'activate_prompt',
          prompt_id: promptId
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatPrompts(data.prompts || []);
        if (data.active_prompt) {
          setActivePromptText(data.active_prompt);
        }
        setSelectedPromptId(promptId);
        setPromptSuccessMsg(`¡Versión "${targetPrompt.version_name}" activada con éxito en el Chat de Producción!`);
        setTimeout(() => setPromptSuccessMsg(''), 5000);
      } else {
        alert(data.error || 'Error al activar versión de prompt');
      }
    } catch {
      alert('Error de conexión al activar versión');
    } finally {
      setIsActivatingPrompt(false);
    }
  };

  // -------------------------------------------------------------
  // GESTIÓN DE CAMPAÑAS DE DESCUENTO
  // -------------------------------------------------------------
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      alert('Por favor ingresa un nombre para la campaña.');
      return;
    }

    setIsCreatingCampaign(true);
    setCampaignSuccessMsg('');

    try {
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'create_campaign',
          campaign: {
            name: newCampaignName.trim(),
            target_scope: newCampaignScope,
            discount_type: newCampaignDiscountType,
            discount_value: Number(newCampaignDiscountValue) || 0,
            start_datetime: newCampaignStart.replace('T', ' ') + ':00',
            end_datetime: newCampaignEnd.replace('T', ' ') + ':00',
            target_client: newCampaignClient,
            is_active: newCampaignActive ? 1 : 0
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        setShowNewCampaignModal(false);
        setNewCampaignName('');
        setCampaignSuccessMsg('¡Campaña de descuento guardada con éxito!');
        setTimeout(() => setCampaignSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Error al crear la campaña');
      }
    } catch {
      alert('Error de conexión al crear campaña');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleToggleCampaign = async (campaignId, currentActive) => {
    try {
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'toggle_campaign',
          campaign_id: campaignId,
          is_active: !currentActive
        })
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch {
      alert('Error al alternar estado de la campaña');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('¿Deseas eliminar esta campaña de descuento?')) return;
    try {
      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'delete_campaign',
          campaign_id: campaignId
        })
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (selectedCampaignId === String(campaignId)) {
          setSelectedCampaignId('none');
        }
      }
    } catch {
      alert('Error al eliminar campaña');
    }
  };

  // -------------------------------------------------------------
  // GENERAR PDF DE COTIZACIÓN PROFESIONAL
  // -------------------------------------------------------------
  const handleGeneratePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes (popups) para generar el PDF.');
      return;
    }

    const items = [];
    if (costDevelopmentUSD > 0) {
      items.push({
        concept: `Desarrollo de Software (${calcHours}h x $${stackRatePerHourUSD} USD/h)`,
        detail: stackDescription,
        usd: costDevelopmentUSD
      });
    }
    if (costAsesoriaUSD > 0) {
      items.push({
        concept: 'Asesoría / Consultoría Tecnológica',
        detail: calcSelectedAsesoria,
        usd: costAsesoriaUSD
      });
    }
    if (costIaUSD > 0) {
      items.push({
        concept: 'Módulo de Inteligencia Artificial',
        detail: calcSelectedIA,
        usd: costIaUSD
      });
    }
    if (costDesignUSD > 0) {
      items.push({
        concept: 'Diseño de Interfaz UI/UX',
        detail: calcSelectedDesign,
        usd: costDesignUSD
      });
    }
    if ((costServerUSD + costDomainUSD) > 0) {
      const infraDetail = [
        calcServerType !== 'none' ? `Servidor (${calcServerMonths}m)` : null,
        calcIncludeDomain ? 'Dominio Anual' : null
      ].filter(Boolean).join(' + ');

      items.push({
        concept: 'Infraestructura & Servidores',
        detail: infraDetail,
        usd: costServerUSD + costDomainUSD
      });
    }

    if (marginUSD > 0) {
      items.push({
        concept: 'Gestión Integral, QA & Despliegue',
        detail: 'Control de calidad, pruebas funcionales, gestión de entregables y puesta en producción',
        usd: marginUSD
      });
    }

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    const expirationStr = expirationDate.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Presupuesto Oficial - Nefetech</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
          .logo span { color: #2563eb; }
          .badge { background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 99px; text-transform: uppercase; }
          .meta { font-size: 12px; color: #64748b; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f8fafc; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #e2e8f0; }
          td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .right { text-align: right; }
          .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .totals-table { width: 380px; margin-left: auto; margin-bottom: 20px; }
          .totals-table td { padding: 8px 12px; font-size: 13px; }
          .total-box { background: #0f172a; color: white; padding: 20px 24px; border-radius: 16px; margin-top: 10px; text-align: right; }
          .total-box .val-usd { font-size: 32px; font-weight: 900; color: #34d399; font-family: monospace; }
          .footer { font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 40px; line-height: 1.8; }
          .vigencia-footer { color: #b45309; font-weight: 800; font-size: 12px; margin-bottom: 6px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Nefe<span>tech</span></div>
            <div class="meta" style="margin-top: 4px;">Soluciones Tecnológicas & Inteligencia Artificial</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">Propuesta Comercial</div>
            <div class="meta" style="margin-top: 6px;">Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Concepto / Módulo</th>
              <th>Especificación Técnica</th>
              <th class="right">Subtotal USD</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => `
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${it.concept}</td>
                <td style="color: #64748b; font-size: 12px;">${it.detail}</td>
                <td class="right mono" style="font-weight: 700;">$${it.usd.toLocaleString()} USD</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="totals-table">
          ${discountUSD > 0 ? `
          <tr>
            <td style="color: #059669; font-weight: 700;">Descuento Campaña (${campaignDiscountLabel}):</td>
            <td class="right mono" style="color: #059669; font-weight: 700;">-$${discountUSD.toLocaleString()} USD</td>
          </tr>` : ''}
          ${calcApplyIva ? `
          <tr>
            <td style="color: #4f46e5; font-weight: 600;">IVA (21%):</td>
            <td class="right mono" style="color: #4f46e5; font-weight: 600;">+$${ivaUSD.toFixed(2)} USD</td>
          </tr>` : ''}
        </table>

        <div class="total-box">
          <div class="val-usd">$${totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>
        </div>

        <div class="footer">
          <div class="vigencia-footer">Este presupuesto se encuentra vigente por 24hs (${expirationStr})</div>
          Nefetech • comercial@nefetech.online • WhatsApp: +54 9 11 7060-5129 • https://nefetech.online<br>
          Este documento es una cotización técnica preliminar no contractual. Sujeto a firma de alcance de proyecto.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // -------------------------------------------------------------
  // REGISTRAR / ENVIAR COTIZACIÓN A CLIENTE SELECCIONADO
  // -------------------------------------------------------------
  const handleSendQuotationToClient = async (e) => {
    e.preventDefault();
    if (!quoteRecipientContact.trim()) {
      alert('Por favor ingresa el correo o número de contacto del cliente.');
      return;
    }

    setIsSendingQuote(true);
    setQuoteSentSuccessMsg('');

    try {
      const summaryText = `Propuesta Nefetech: ${calcHours}h en ${stackDescription}. Inversión: $${totalUSD.toFixed(0)} USD (aprox $${totalARS.toLocaleString('es-AR')} ARS cotización $${blueRate}). ${quoteCustomMessage}`;

      const res = await fetch('/api/admin/budget_config.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'send_quotation_to_client',
          quotation: {
            lead_id: selectedQuoteLeadId ? Number(selectedQuoteLeadId) : null,
            client_name: quoteRecipientName.trim() || 'Cliente Nefetech',
            client_recipient: quoteRecipientContact.trim(),
            channel: quoteSendChannel,
            subject: `Presupuesto de Proyecto - Nefetech`,
            hours: calcHours,
            hourly_rate_usd: stackRatePerHourUSD,
            stack_description: stackDescription,
            asesoria_module: costAsesoriaUSD > 0 ? calcSelectedAsesoria : null,
            asesoria_cost_usd: costAsesoriaUSD,
            ia_module: costIaUSD > 0 ? calcSelectedIA : null,
            ia_cost_usd: costIaUSD,
            design_level: costDesignUSD > 0 ? calcSelectedDesign : null,
            design_cost_usd: costDesignUSD,
            server_type: calcServerType !== 'none' ? calcServerType : null,
            server_months: calcServerType !== 'none' ? calcServerMonths : 0,
            server_cost_usd: costServerUSD,
            domain_included: calcIncludeDomain ? 1 : 0,
            domain_cost_usd: costDomainUSD,
            margin_percent: calcMarginPercent,
            total_usd: totalUSD,
            dolar_blue_rate: blueRate,
            total_ars: totalARS,
            full_summary: summaryText
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.sent_quotations) {
          setSentQuotations(data.sent_quotations);
        }
        setQuoteSentSuccessMsg('¡Cotización guardada y asignada al cliente con éxito!');
        setTimeout(() => {
          setShowSendQuoteModal(false);
          setQuoteSentSuccessMsg('');
        }, 2000);
      } else {
        alert(data.error || 'Error al registrar la cotización');
      }
    } catch {
      alert('Error de conexión al enviar cotización');
    } finally {
      setIsSendingQuote(false);
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
  const serverMonthlyRate = calcServerType !== 'none' ? Number(budgetConfig?.infrastructure?.[calcServerType] || 0) : 0;
  const costServerUSD = serverMonthlyRate * calcServerMonths;

  const selectedDesignObj = budgetConfig?.design_levels?.find(d => d.name === calcSelectedDesign);
  const costDesignUSD = selectedDesignObj ? Number(selectedDesignObj.cost_usd) : 0;

  const subtotalUSD = costDevelopmentUSD + costIaUSD + costAsesoriaUSD + costDomainUSD + costServerUSD + costDesignUSD;
  const marginUSD = (subtotalUSD * (calcMarginPercent / 100));
  const preDiscountUSD = subtotalUSD + marginUSD;

  // Lógica de Descuento de Campaña
  const activeCampaignObj = campaigns.find(c => String(c.id) === String(selectedCampaignId));
  let discountUSD = 0;
  let campaignDiscountLabel = '';

  if (activeCampaignObj && Number(activeCampaignObj.is_active) === 1) {
    let applicableBase = 0;
    const scope = activeCampaignObj.target_scope || 'all';

    if (scope === 'all') {
      applicableBase = preDiscountUSD;
    } else if (scope === 'desarrollo') {
      applicableBase = costDevelopmentUSD;
    } else if (scope === 'ia') {
      applicableBase = costIaUSD;
    } else if (scope === 'asesoria') {
      applicableBase = costAsesoriaUSD;
    } else if (scope === 'servidores') {
      applicableBase = costServerUSD + costDomainUSD;
    } else if (scope === 'diseno') {
      applicableBase = costDesignUSD;
    }

    if (activeCampaignObj.discount_type === 'percentage') {
      const pct = Number(activeCampaignObj.discount_value) || 0;
      discountUSD = Math.round((applicableBase * (pct / 100)) * 100) / 100;
      campaignDiscountLabel = `${activeCampaignObj.name} (-${pct}%)`;
    } else {
      const val = Number(activeCampaignObj.discount_value) || 0;
      discountUSD = Math.min(applicableBase, val);
      campaignDiscountLabel = `${activeCampaignObj.name} (-$${val} USD)`;
    }
  }

  const netUSD = Math.max(0, preDiscountUSD - discountUSD);
  const ivaUSD = calcApplyIva ? (netUSD * 0.21) : 0;
  const totalUSD = netUSD + ivaUSD;

  const blueRate = Number(dolarRate.blue) || 1540;
  const netARS = netUSD * blueRate;
  const ivaARS = ivaUSD * blueRate;
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
                Usuario
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="nombre de usuario"
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

      {/* CONTENEDOR PRINCIPAL CON MENÚ LATERAL (SIDEBAR) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* BARRA SUPERIOR PARA MÓVILES (md:hidden) */}
        <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20">
              N
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-tight">Nefetech Admin</span>
              <span className="text-[10px] text-slate-400">Panel Comercial & IA</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              <Icon name={isMobileMenuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </header>

        {/* OVERLAY OSCURO PARA MENÚ MÓVIL */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 animate-in fade-in duration-200"
          />
        )}

        {/* SIDEBAR LATERAL (DESKTOP FIJO + MÓVIL DESLIZABLE) */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40 md:z-auto
            w-64 lg:w-72 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800/80 shadow-2xl md:shadow-none
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Cabecera / Marca del Sidebar */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">
                N
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">Nefetech CRM</h1>
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Panel Administrativo
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Navegación Vertical */}
          <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Navegación Principal
            </div>

            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="dashboard" size={18} className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="text-xs">Dashboard & Métricas</span>
              </div>
              {activeTab === 'dashboard' && (
                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('leads'); setIsMobileMenuOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'leads'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="inbox" size={18} className={activeTab === 'leads' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="text-xs">Bandeja de Leads</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'leads' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-300'
              }`}>
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('calculadora'); setIsMobileMenuOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'calculadora'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="calculate" size={18} className={activeTab === 'calculadora' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="text-xs">Calculadora & Asesoría</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                activeTab === 'calculadora' ? 'bg-white/20 text-white' : 'bg-indigo-900/60 text-indigo-300'
              }`}>
                IA
              </span>
            </button>

            <div className="pt-3 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Gestión & Tarifarios
            </div>

            <button
              onClick={() => { setActiveTab('configuracion'); setIsMobileMenuOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'configuracion'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="settings" size={18} className={activeTab === 'configuracion' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="text-xs">Configuración de Costos</span>
              </div>
              {activeTab === 'configuracion' && (
                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('historiales'); setIsMobileMenuOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'historiales'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="history" size={18} className={activeTab === 'historiales' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="text-xs">Historiales de Cotización</span>
              </div>
              {sentQuotations.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'historiales' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-400'
                }`}>
                  {sentQuotations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('prompts'); setIsMobileMenuOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'prompts'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="psychology" size={18} className={activeTab === 'prompts' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="text-xs">IA Chat & Prompts</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'prompts' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-300'
              }`}>
                {chatPrompts.length || 1}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('campanas'); setIsMobileMenuOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'campanas'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="campaign" size={18} className={activeTab === 'campanas' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                <span className="text-xs">Campañas de Descuento</span>
              </div>
              {campaigns.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'campanas' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-300'
                }`}>
                  {campaigns.length}
                </span>
              )}
            </button>
          </nav>

          {/* Widget Dólar Blue en Sidebar */}
          <div className="p-3.5 mx-3 mb-3 bg-slate-800/70 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Dólar Blue Hoy
              </span>
              <button
                onClick={fetchBudgetConfig}
                title="Actualizar cotización"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
              >
                <Icon name="sync" size={13} />
              </button>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-emerald-400 leading-none">
                ${blueRate.toLocaleString()} <span className="text-[10px] font-medium text-slate-400 font-sans">ARS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">DolarApi</span>
            </div>
          </div>

          {/* Usuario y Cierre de Sesión en el pie del Sidebar */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {(currentUser?.username || 'A')[0].toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate leading-tight">
                  {currentUser?.username || 'lvincent'}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  ● Admin Activo
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/20 transition-all cursor-pointer shrink-0"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO DE LAS PESTAÑAS (SCROLLABLE INDEPENDIENTE) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

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
                  <span>+ Nueva Cotización</span>
                </button>
              </div>
            </div>

            {/* Tarjetas KPI Superiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{totalLeadsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Registrados en la plataforma</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nuevos Sin Contactar</span>
                </div>
                <div className="text-3xl font-black text-amber-600">{nuevosLeadsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Requieren primera propuesta</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">En Conversación</span>
                </div>
                <div className="text-3xl font-black text-indigo-600">{enCursoLeadsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Con respuestas despachadas</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasa de Identificación</span>
                </div>
                <div className="text-3xl font-black text-emerald-600">{tasaContacto}%</div>
                <div className="text-[11px] text-slate-400 mt-1">De leads dejaron correo válido</div>
              </div>
            </div>

            {/* Gráficos Visuales de Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Gráfico 1: Canales de Contacto */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-5">
                  Distribución de Canales de Contacto
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
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4">
                    Acciones Frecuentes
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Gestiona leads pendientes, envía presupuestos automatizados o personaliza el tarifario de Nefetech.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Ver Bandeja de Leads ({leads.length})</span>
                      <span className="text-slate-400">→</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('calculadora')}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Abrir Calculadora Inteligente con IA</span>
                      <span className="text-slate-400">→</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('configuracion')}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Configurar Costos & Multiplicadores</span>
                      <span className="text-slate-400">→</span>
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
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                      Cadena de Respuestas Enviadas ({leadDetail.replies.length})
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
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Responder al Cliente
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyChannel('email')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                          replyChannel === 'email' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
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
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                      <span>✓ {replySuccessMsg}</span>
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
                            if (e.target.checked && !replyMessage.includes('PRESUPUESTO FORMAL ESTIMADO')) {
                              const cotizText = `\n\n--- PRESUPUESTO FORMAL ESTIMADO ---\n• Desarrollo (${calcHours}h a $${stackRatePerHourUSD}/h): ${stackDescription}\n• Asesoría: ${calcSelectedAsesoria} ($${costAsesoriaUSD} USD)\n• Módulo IA: ${calcSelectedIA} ($${costIaUSD} USD)\n• Diseño UI/UX: ${calcSelectedDesign} ($${costDesignUSD} USD)\n• Servidor + Dominio: $${costServerUSD + costDomainUSD} USD\n${calcApplyIva ? `• Subtotal Neto: $${netUSD.toFixed(0)} USD\n• IVA (21% Factura A/B): $${ivaUSD.toFixed(0)} USD\n• TOTAL FINAL: $${totalUSD.toFixed(0)} USD` : `• TOTAL ESTIMADO NETO: $${totalUSD.toFixed(0)} USD`}\n• Equivalente en Pesos: aprox. $${totalARS.toLocaleString('es-AR')} ARS (Dólar Blue $${blueRate}).`;
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
                        className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>{isSendingReply ? 'Enviando...' : 'Despachar Respuesta'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Transcripción del Chatbot con BOTÓN AGRANDAR */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Historial de Conversación con el Asistente
                    </h3>

                    {leadDetail?.chat_history && leadDetail.chat_history.length > 0 && (
                      <button
                        onClick={() => setExpandedChatLead(activeLead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        title="Ver chat completo en pantalla grande"
                      >
                        <span>Agrandar Chat ↗</span>
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
                    Actualizado: {dolarRate?.actualizado ? new Date(dolarRate.actualizado).toLocaleTimeString() : 'En tiempo real'}
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
                <span>Estimar con IA (Chat)</span>
              </button>
              <button
                onClick={() => setCalcMode('manual')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  calcMode === 'manual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Configuración Manual</span>
              </button>
            </div>

            {/* MODO ASISTENTE DE IA PARA COTIZAR */}
            {calcMode === 'ia' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-blue-100 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Asistente de Estimación IA</h3>
                  <p className="text-xs text-slate-500">Pega o describe la idea del cliente y la IA sugerirá horas, stack, IA y asesoría.</p>
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
                      className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>{isAiEstimating ? 'Analizando requerimiento...' : 'Analizar & Calcular con IA'}</span>
                    </button>
                  </div>
                </form>

                {aiAnalysisResult && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-slate-800 leading-relaxed space-y-1">
                    <div className="font-bold text-blue-900">
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
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
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
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 pt-2">
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
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 pt-2">
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
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 pt-2">
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
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 pt-2">
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
                        <option value="none">
                          -- Sin servidor / Lo aporta el cliente ($0) --
                        </option>
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
                        disabled={calcServerType === 'none'}
                        value={calcServerMonths}
                        onChange={(e) => setCalcServerMonths(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Campaña de Descuento Promocional */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Aplicar Campaña de Descuento:
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="none">-- Sin campaña / Precio regular --</option>
                      {campaigns.filter(c => Number(c.is_active) === 1).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.discount_type === 'percentage' ? `-${c.discount_value}%` : `-$${c.discount_value} USD`} en {c.target_scope === 'all' ? 'todo' : c.target_scope})
                        </option>
                      ))}
                    </select>
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

                  {/* Switch de Aplicación de IVA (21%) Factura A / B */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        <span>Aplicar IVA (21%) — Facturación Oficial</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {calcApplyIva ? 'Presupuesto formal discriminado con IVA (Factura A / B)' : 'Presupuesto neto sin IVA discriminado'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calcApplyIva}
                        onChange={(e) => setCalcApplyIva(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
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
                        {calcApplyIva ? 'Con Factura (IVA 21%)' : 'Neto / Uso Interno'}
                      </span>
                    </div>

                    <table className="w-full text-xs border-collapse mb-6">
                      <tbody>
                        {costDevelopmentUSD > 0 && (
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 text-slate-600 font-medium">
                              <div>Desarrollo ({calcHours}h x ${stackRatePerHourUSD} USD/h):</div>
                              <div className="text-[10px] text-blue-600 font-semibold">{stackDescription}</div>
                            </td>
                            <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                              ${costDevelopmentUSD.toLocaleString()} USD
                            </td>
                          </tr>
                        )}

                        {costAsesoriaUSD > 0 && (
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 text-slate-600 font-medium">
                              <div>Asesoría / Consultoría:</div>
                              <div className="text-[10px] text-slate-400">{calcSelectedAsesoria}</div>
                            </td>
                            <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                              ${costAsesoriaUSD.toLocaleString()} USD
                            </td>
                          </tr>
                        )}

                        {costIaUSD > 0 && (
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 text-slate-600 font-medium">
                              <div>Módulo de IA:</div>
                              <div className="text-[10px] text-slate-400">{calcSelectedIA}</div>
                            </td>
                            <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                              ${costIaUSD.toLocaleString()} USD
                            </td>
                          </tr>
                        )}

                        {costDesignUSD > 0 && (
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 text-slate-600 font-medium">
                              <div>Diseño UI/UX:</div>
                              <div className="text-[10px] text-slate-400">{calcSelectedDesign}</div>
                            </td>
                            <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                              ${costDesignUSD.toLocaleString()} USD
                            </td>
                          </tr>
                        )}

                        {(costServerUSD + costDomainUSD) > 0 && (
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 text-slate-600 font-medium">
                              <div>Infraestructura & Servidores:</div>
                              <div className="text-[10px] text-slate-400">
                                {[
                                  calcServerType !== 'none' ? `Hosting (${calcServerMonths}m)` : null,
                                  calcIncludeDomain ? 'Dominio Anual' : null
                                ].filter(Boolean).join(' + ')}
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                              ${(costServerUSD + costDomainUSD).toLocaleString()} USD
                            </td>
                          </tr>
                        )}

                        <tr className="border-b border-slate-100 text-slate-500">
                          <td className="py-2.5">Subtotal Costos Directos:</td>
                          <td className="py-2.5 text-right font-mono font-semibold">
                            ${subtotalUSD.toLocaleString()} USD
                          </td>
                        </tr>

                        {marginUSD > 0 && (
                          <tr className="border-b border-slate-100 text-blue-600 font-semibold">
                            <td className="py-2.5">Margen Comercial ({calcMarginPercent}%):</td>
                            <td className="py-2.5 text-right font-mono">
                              +${marginUSD.toLocaleString()} USD
                            </td>
                          </tr>
                        )}

                        {discountUSD > 0 && (
                          <tr className="border-b border-slate-100 text-emerald-700 font-bold bg-emerald-50/60">
                            <td className="py-2.5 px-2">
                              <div>Descuento de Campaña:</div>
                              <div className="text-[10px] text-emerald-600">{campaignDiscountLabel}</div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono">
                              -${discountUSD.toLocaleString()} USD
                            </td>
                          </tr>
                        )}

                        <tr className="border-b border-slate-200 text-slate-800 font-bold">
                          <td className="py-2.5">Subtotal Neto:</td>
                          <td className="py-2.5 text-right font-mono">
                            ${netUSD.toLocaleString()} USD
                          </td>
                        </tr>

                        {calcApplyIva && (
                          <tr className="border-b border-slate-200 text-indigo-700 font-bold bg-indigo-50/50">
                            <td className="py-2.5 px-2">IVA (21%):</td>
                            <td className="py-2.5 px-2 text-right font-mono">
                              +${ivaUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="bg-slate-900 text-white p-5 rounded-2xl mb-4 shadow-md">
                      <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                        <span>Total Presupuestado en USD</span>
                        {calcApplyIva && <span className="text-indigo-400 text-[10px]">IVA 21% INCLUIDO</span>}
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
                      {calcApplyIva && (
                        <div className="text-[10px] text-emerald-700 mt-1 font-mono">
                          Neto: ${netARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })} + IVA: ${ivaARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleGeneratePDF}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Icon name="picture_as_pdf" size={16} />
                      <span>Generar PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQuoteLeadId('');
                        setQuoteRecipientName('');
                        setQuoteRecipientContact('');
                        setQuoteSendChannel('email');
                        setQuoteCustomMessage('');
                        setShowSendQuoteModal(true);
                      }}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      <Icon name="send" size={16} />
                      <span>Enviar a un Cliente</span>
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
                  <span>Guardar Cambios</span>
                </button>
              </div>

              {saveConfigMsg && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                  <span>✓ {saveConfigMsg}</span>
                </div>
              )}

              {/* Herramienta de Aumento Porcentual Masivo */}
              <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-amber-900 font-bold text-sm">
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
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span>{isApplyingIncrease ? 'Aplicando...' : 'Aplicar Aumento'}</span>
                    </button>
                  </form>
                </div>

                {increaseSuccessMsg && (
                  <div className="mt-3 p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-lg font-bold">
                    <span>✓ {increaseSuccessMsg}</span>
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
                  <h2 className="text-xl font-black text-slate-900">Historial de Cotizaciones Enviadas</h2>
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
                  <h2 className="text-xl font-black text-slate-900">Historial de Cambios de Costos & Aumentos</h2>
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
                <div className="space-y-4">
                  {configHistory.map((h) => {
                    const isExpanded = expandedHistoryId === h.id;
                    let snapshot = null;
                    try {
                      snapshot = typeof h.snapshot_configs === 'string'
                        ? JSON.parse(h.snapshot_configs)
                        : h.snapshot_configs;
                    } catch (e) {
                      console.error('Error parsing snapshot', e);
                    }

                    return (
                      <div
                        key={h.id}
                        className={`rounded-2xl border transition-all duration-200 ${
                          isExpanded 
                            ? 'bg-white border-amber-300 shadow-md ring-1 ring-amber-400/20' 
                            : 'bg-slate-50/90 border-slate-200 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Cabecera del Item / Desplegable */}
                        <div
                          onClick={() => setExpandedHistoryId(isExpanded ? null : h.id)}
                          className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs select-none"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                h.action_type === 'percentage_increase' 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}>
                                {h.action_type === 'percentage_increase' ? `Aumento +${h.percentage_applied}%` : 'Edición Manual'}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">{h.description}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Modificado por: <strong className="text-slate-700">{h.created_by || 'admin'}</strong></span>
                              <span>•</span>
                              <span>Tarifa base en ese momento: <strong className="text-emerald-700 font-mono">${snapshot?.hourly_rate || 35} USD/h</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            <div className="text-slate-400 text-[11px] font-mono">
                              {new Date(h.created_at).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              className={`p-1.5 rounded-xl border transition-all ${
                                isExpanded 
                                  ? 'bg-amber-500 text-white border-amber-500 rotate-180' 
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={isExpanded ? "Ocultar detalle de tarifas" : "Desplegar detalle de tarifas"}
                            >
                              <Icon name="expand_more" size={16} />
                            </button>
                          </div>
                        </div>

                        {/* PANEL DESPLEGABLE CON EL DETALLE COMPLETO DEL CAMBIO */}
                        {isExpanded && (
                          <div className="p-5 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl animate-in fade-in duration-150 space-y-6">
                            
                            {!snapshot ? (
                              <div className="text-xs text-slate-400 italic">No hay datos de captura detallada para este registro.</div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                      Tarifas Resultantes en este Registro
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500">
                                    Valores exactos en USD almacenados
                                  </span>
                                </div>

                                {/* NAVEGACIÓN POR SUB-PESTAÑAS DENTRO DEL REGISTRO PARA LIMPIAR LA VISTA */}
                                {(() => {
                                  const currentSubTab = activeHistorySubTab[h.id] || 'general';
                                  const setSubTab = (tabKey) => {
                                    setActiveHistorySubTab(prev => ({ ...prev, [h.id]: tabKey }));
                                  };

                                  const pct = h.action_type === 'percentage_increase' ? Number(h.percentage_applied || 0) : null;
                                  
                                  const renderPriceComparison = (newPrice, unit = 'USD/h') => {
                                    if (pct && pct > 0 && newPrice > 0) {
                                      const oldPrice = Math.round(newPrice / (1 + pct / 100));
                                      return (
                                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                                          <span className="text-slate-400 line-through text-[11px] font-normal" title="Precio anterior">
                                            ${oldPrice}
                                          </span>
                                          <span className="text-slate-300 text-[10px]">→</span>
                                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs" title={`Precio con aumento +${pct}%`}>
                                            ${newPrice} {unit}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <span className="font-mono font-bold text-emerald-600 shrink-0 text-xs bg-emerald-50/50 px-2 py-0.5 rounded-md">
                                        ${newPrice} {unit}
                                      </span>
                                    );
                                  };

                                  return (
                                    <div className="space-y-4">
                                      {/* SELECTOR DE SUB-PESTAÑAS */}
                                      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl max-w-fit">
                                        <button
                                          type="button"
                                          onClick={() => setSubTab('general')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            currentSubTab === 'general'
                                              ? 'bg-white text-slate-900 shadow-xs'
                                              : 'text-slate-600 hover:text-slate-900'
                                          }`}
                                        >
                                          <span>Tarifa Base & Servidores</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSubTab('lenguajes')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            currentSubTab === 'lenguajes'
                                              ? 'bg-white text-slate-900 shadow-xs'
                                              : 'text-slate-600 hover:text-slate-900'
                                          }`}
                                        >
                                          <span>Lenguajes & Frameworks ({((snapshot.frontend_techs?.length || 0) + (snapshot.backend_techs?.length || 0))})</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSubTab('combos')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            currentSubTab === 'combos'
                                              ? 'bg-white text-slate-900 shadow-xs'
                                              : 'text-slate-600 hover:text-slate-900'
                                          }`}
                                        >
                                          <span>Combos de Stack ({snapshot.stack_combos?.length || 0})</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSubTab('ia_asesoria')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            currentSubTab === 'ia_asesoria'
                                              ? 'bg-white text-slate-900 shadow-xs'
                                              : 'text-slate-600 hover:text-slate-900'
                                          }`}
                                        >
                                          <span>IA & Asesoría ({((snapshot.ia_modules?.length || 0) + (snapshot.consultoria_modules?.length || 0))})</span>
                                        </button>
                                      </div>

                                      {/* CONTENIDO TAB 1: TARIFA BASE & SERVIDORES */}
                                      {currentSubTab === 'general' && (
                                        <div className="space-y-4 animate-in fade-in duration-150">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">Tarifa Base General</span>
                                                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Por Hora</span>
                                              </div>
                                              <p className="text-[11px] text-slate-400">Tarifa horaria inicial de referencia para el equipo de desarrollo.</p>
                                              <div className="pt-1">{renderPriceComparison(snapshot.hourly_rate, 'USD/h')}</div>
                                            </div>

                                            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">Dominio Anual</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Anual</span>
                                              </div>
                                              <p className="text-[11px] text-slate-400">Renovación de dominios internacionales (.com / .online / .tech).</p>
                                              <div className="pt-1">{renderPriceComparison(snapshot.infrastructure?.domain_annual_usd || 18, 'USD')}</div>
                                            </div>

                                            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">Hosting Compartido</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Mensual</span>
                                              </div>
                                              <p className="text-[11px] text-slate-400">Plataforma de hosting estándar para sitios web y landing pages.</p>
                                              <div className="pt-1">{renderPriceComparison(snapshot.infrastructure?.server_basic_monthly_usd || 15, 'USD/m')}</div>
                                            </div>

                                            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">Servidor VPS</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Mensual</span>
                                              </div>
                                              <p className="text-[11px] text-slate-400">Servidor virtual dedicado para sistemas y bases de datos intermedias.</p>
                                              <div className="pt-1">{renderPriceComparison(snapshot.infrastructure?.server_vps_monthly_usd || 35, 'USD/m')}</div>
                                            </div>

                                            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 sm:col-span-2 lg:col-span-1">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">Cloud Dedicado</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Mensual</span>
                                              </div>
                                              <p className="text-[11px] text-slate-400">Instancia de alto rendimiento para tráfico intensivo y modelos de IA.</p>
                                              <div className="pt-1">{renderPriceComparison(snapshot.infrastructure?.server_cloud_dedicated_monthly_usd || 90, 'USD/m')}</div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* CONTENIDO TAB 2: LENGUAJES & FRAMEWORKS */}
                                      {currentSubTab === 'lenguajes' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
                                          {/* Frontend */}
                                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                <span>Tecnologías Frontend</span>
                                              </h4>
                                              <span className="text-[10px] text-slate-400 font-bold uppercase">USD / Hora</span>
                                            </div>

                                            <div className="divide-y divide-slate-100">
                                              {snapshot.frontend_techs?.map((front, fIdx) => {
                                                const newRate = front.price_per_hour_usd || (front.factor ? Math.round(front.factor * 35) : 38);
                                                return (
                                                  <div key={fIdx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded-lg">
                                                    <span className="font-semibold text-slate-800">{front.name}</span>
                                                    {renderPriceComparison(newRate, 'USD/h')}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {/* Backend */}
                                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                <span>Tecnologías Backend</span>
                                              </h4>
                                              <span className="text-[10px] text-slate-400 font-bold uppercase">USD / Hora</span>
                                            </div>

                                            <div className="divide-y divide-slate-100">
                                              {snapshot.backend_techs?.map((back, bIdx) => {
                                                const newRate = back.price_per_hour_usd || (back.factor ? Math.round(back.factor * 35) : 40);
                                                return (
                                                  <div key={bIdx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded-lg">
                                                    <span className="font-semibold text-slate-800">{back.name}</span>
                                                    {renderPriceComparison(newRate, 'USD/h')}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* CONTENIDO TAB 3: COMBOS DE STACK */}
                                      {currentSubTab === 'combos' && (
                                        <div className="space-y-3 animate-in fade-in duration-150">
                                          {!snapshot.stack_combos || snapshot.stack_combos.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                                              No hay combos registrados en este cambio.
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {snapshot.stack_combos.map((combo, cIdx) => {
                                                const newRate = combo.price_per_hour_usd || (combo.factor ? Math.round(combo.factor * 35) : 40);
                                                return (
                                                  <div key={cIdx} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                                                    <div>
                                                      <span className="font-bold text-slate-900 text-sm block leading-snug">{combo.name}</span>
                                                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">{combo.frontend}</span>
                                                        <span>+</span>
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">{combo.backend}</span>
                                                      </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                      <span className="text-[11px] text-slate-400 font-semibold">Tarifa empaquetada:</span>
                                                      {renderPriceComparison(newRate, 'USD/h')}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* CONTENIDO TAB 4: IA & ASESORÍA */}
                                      {currentSubTab === 'ia_asesoria' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
                                          {/* Módulos de IA */}
                                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                <span>Inteligencia Artificial</span>
                                              </h4>
                                              <span className="text-[10px] text-slate-400 font-bold uppercase">Costo Fijo USD</span>
                                            </div>

                                            <div className="divide-y divide-slate-100">
                                              {snapshot.ia_modules?.map((ia, iaIdx) => (
                                                <div key={iaIdx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded-lg">
                                                  <span className="font-semibold text-slate-800 pr-2">{ia.name}</span>
                                                  {renderPriceComparison(ia.cost_usd, 'USD')}
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Asesoría y Consultoría */}
                                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                <span>Asesoría Tecnológica</span>
                                              </h4>
                                              <span className="text-[10px] text-slate-400 font-bold uppercase">Costo Fijo USD</span>
                                            </div>

                                            <div className="divide-y divide-slate-100">
                                              {snapshot.consultoria_modules?.map((c, cIdx) => (
                                                <div key={cIdx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded-lg">
                                                  <span className="font-semibold text-slate-800 pr-2">{c.name}</span>
                                                  {renderPriceComparison(c.cost_usd, 'USD')}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    </div>
                                  );
                                })()}

                              </>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 5: ASISTENTE IA, PROMPTS VERSIONADOS & LÍMITES   */}
      {/* ========================================================= */}
      {activeTab === 'prompts' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Encabezado Principal */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Motor de Inteligencia Comercial
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-2">
                  Asistente IA, Prompts Inmutables & Límite de Chat
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Configura la cantidad máxima de preguntas que el usuario puede realizar en el chat del front y gestiona las versiones inmutables del System Prompt de Gemini. Cada versión queda resguardada y nunca se sobreescribe ni elimina.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const active = chatPrompts.find(p => Number(p.is_active) === 1) || chatPrompts[0];
                  setNewPromptText(active ? active.prompt_text : activePromptText);
                  setNewPromptVersionName(`v${(chatPrompts.length + 1)}.0 - Nueva Versión`);
                  setNewPromptActivateNow(false);
                  setShowNewPromptModal(true);
                }}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto shrink-0"
              >
                <span>+ Crear Nueva Versión de Prompt</span>
              </button>
            </div>

            {/* Mensajes de notificación */}
            {promptSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold animate-in fade-in">
                {promptSuccessMsg}
              </div>
            )}

            {/* SECCIÓN 1: CONTROL DE LÍMITE DE MENSAJES DEL CHAT DEL FRONT */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Límite de Mensajes del Chat Web (Front)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Número máximo de preguntas libres que un visitante puede enviar al bot antes de solicitar obligatoriamente sus datos de contacto (WhatsApp o Correo).
                  </p>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl max-w-fit">
                  Límite Actual: {budgetConfig?.chat_max_messages || 10} mensajes
                </span>
              </div>

              <form onSubmit={handleSaveMaxMessages} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Preguntas permitidas por sesión de usuario:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={chatMaxMessagesInput}
                        onChange={(e) => setChatMaxMessagesInput(e.target.value)}
                        className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                      <span className="text-xs text-slate-500 font-medium">
                        mensajes libres antes de bloquear y solicitar lead
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Al llegar a este límite, el bot invita al cliente a dejar sus datos y su necesidad en un único mensaje final para ser derivado al equipo de ventas.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingChatLimit}
                      className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSavingChatLimit ? 'Guardando...' : 'Actualizar Límite'}
                    </button>
                  </div>
                </div>

                {chatLimitSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                    {chatLimitSuccessMsg}
                  </div>
                )}
              </form>
            </div>

            {/* SECCIÓN 2: GESTIÓN DE PROMPTS VERSIONADOS (INMUTABLES) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Columna Izquierda: Historial de Versiones */}
              <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col h-[650px]">
                <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Versiones Guardadas
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Historial inmutable ({chatPrompts.length} disponibles)
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {chatPrompts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No hay prompts registrados.
                    </div>
                  ) : (
                    chatPrompts.map((p) => {
                      const isActive = Number(p.is_active) === 1;
                      const isSelected = selectedPromptId === p.id;

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPromptId(p.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                              : 'border-slate-200/90 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-extrabold text-xs text-slate-900 truncate">
                              {p.version_name}
                            </span>
                            {isActive ? (
                              <span className="shrink-0 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                                Activo
                              </span>
                            ) : (
                              <span className="shrink-0 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Inactivo
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Fecha:</span>
                              <span className="font-semibold text-slate-700">{p.created_at || 'Inicial'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Creado por:</span>
                              <span className="font-semibold text-slate-700">{p.created_by || 'admin'}</span>
                            </div>
                          </div>

                          {/* Botón de activación si está inactivo */}
                          {!isActive && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivatePrompt(p.id);
                                }}
                                disabled={isActivatingPrompt}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isActivatingPrompt ? 'Activando...' : 'Activar esta versión'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Columna Derecha: Visor de Prompt Seleccionado */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 flex flex-col h-[650px]">
                {(() => {
                  const currentPrompt = chatPrompts.find(p => p.id === selectedPromptId) || chatPrompts[0];
                  if (!currentPrompt) {
                    return (
                      <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                        Selecciona una versión del historial para previsualizar su contenido.
                      </div>
                    );
                  }

                  const isActive = Number(currentPrompt.is_active) === 1;

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">
                              {currentPrompt.version_name}
                            </h3>
                            {isActive ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Versión en Producción
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                Versión Histórica
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Registrado por {currentPrompt.created_by || 'admin'} • {currentPrompt.created_at || 'Inicial'} • Inmutable
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewPromptText(currentPrompt.prompt_text);
                              setNewPromptVersionName(`v${(chatPrompts.length + 1)}.0 - Basado en ${currentPrompt.version_name}`);
                              setNewPromptActivateNow(false);
                              setShowNewPromptModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            <span>Duplicar como Nueva Versión</span>
                          </button>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleActivatePrompt(currentPrompt.id)}
                              disabled={isActivatingPrompt}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isActivatingPrompt ? 'Activando...' : 'Switchear / Activar'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                          Contenido de Instrucciones del Sistema (Solo Lectura):
                        </label>
                        <div className="flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800 select-text">
                          {currentPrompt.prompt_text}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Estado: Los prompts no pueden ser editados ni eliminados para garantizar trazabilidad.</span>
                        <span>{currentPrompt.prompt_text?.length || 0} caracteres</span>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVA VERSIÓN DE PROMPT (INMUTABLE)         */}
      {/* ========================================================= */}
      {showNewPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Crear Nueva Versión de System Prompt
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Las versiones son permanentes e inmutables. Se creará una nueva entrada en el historial sin sobreescribir la actual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPromptModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePrompt} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre descriptivo de la versión:
                </label>
                <input
                  type="text"
                  value={newPromptVersionName}
                  onChange={(e) => setNewPromptVersionName(e.target.value)}
                  placeholder="Ej: v2.0 - Énfasis en leads de Inteligencia Artificial"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contenido del System Prompt:
                </label>
                <textarea
                  rows="14"
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Ingresa el prompt de instrucciones para el asistente..."
                  className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                ></textarea>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {newPromptText.length} caracteres
                </span>
              </div>

              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activatePromptNow"
                  checked={newPromptActivateNow}
                  onChange={(e) => setNewPromptActivateNow(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="activatePromptNow" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                  Activar esta versión inmediatamente en el Chat de Producción
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPromptModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPrompt}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPrompt ? 'Guardando...' : 'Guardar Versión Inmutable'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 6: GESTIÓN DE CAMPAÑAS DE DESCUENTO              */}
      {/* ========================================================= */}
      {activeTab === 'campanas' && (
        <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Cabecera */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Estrategia Comercial & Promociones
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-2">
                  Campañas de Descuento
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Crea y programa promociones porcentuales o de monto fijo en USD sobre todo el catálogo o categorías específicas (Desarrollo, IA, Asesoría, Servidores o Diseño), asignándolas a un cliente específico o a todos los clientes dentro de un rango de fechas y horas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewCampaignName('');
                  setNewCampaignScope('all');
                  setNewCampaignDiscountType('percentage');
                  setNewCampaignDiscountValue(15);
                  setNewCampaignClient('all');
                  setNewCampaignActive(true);
                  setShowNewCampaignModal(true);
                }}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto shrink-0"
              >
                <span>+ Nueva Campaña de Descuento</span>
              </button>
            </div>

            {campaignSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold animate-in fade-in">
                {campaignSuccessMsg}
              </div>
            )}

            {/* Listado de Campañas */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Campañas Registradas ({campaigns.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Las campañas activas se pueden seleccionar inmediatamente desde la Calculadora de Presupuestos.
                  </p>
                </div>
              </div>

              {campaigns.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No hay campañas de descuento creadas aún. Haz clic en "+ Nueva Campaña de Descuento" para configurar una.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaigns.map((camp) => {
                    const isActive = Number(camp.is_active) === 1;
                    const scopeLabels = {
                      all: 'Todo el Catálogo',
                      desarrollo: 'Solo Desarrollo de Software',
                      ia: 'Solo Módulos de IA',
                      asesoria: 'Solo Asesoría Tecnológica',
                      servidores: 'Solo Infraestructura & Servidores',
                      diseno: 'Solo Diseño UI/UX'
                    };

                    return (
                      <div
                        key={camp.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-white border-slate-200 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-slate-900">
                                {camp.name}
                              </h4>
                              {isActive ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Vigente
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                  Pausada
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider block mt-1">
                              {scopeLabels[camp.target_scope] || camp.target_scope}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black font-mono text-emerald-600 block">
                              {camp.discount_type === 'percentage'
                                ? `-${camp.discount_value}%`
                                : `-$${Number(camp.discount_value).toLocaleString()} USD`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {camp.discount_type === 'percentage' ? 'Porcentual' : 'Monto Fijo USD'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 mb-4 border border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Desde:</span>
                            <span className="font-semibold">{camp.start_datetime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Hasta:</span>
                            <span className="font-semibold">{camp.end_datetime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Destinatario:</span>
                            <span className="font-semibold text-slate-800">
                              {camp.target_client === 'all' ? 'Todos los clientes' : `Cliente: ${camp.target_client}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleToggleCampaign(camp.id, isActive)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                              isActive
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                            }`}
                          >
                            {isActive ? 'Pausar Campaña' : 'Reanudar Campaña'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVA CAMPAÑA DE DESCUENTO                   */}
      {/* ========================================================= */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Crear Campaña de Descuento
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configura descuentos porcentuales o de monto fijo con fechas y alcance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCampaignModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre de la Campaña:
                </label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Ej: Promo Lanzamiento IA - 20% OFF"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Alcance de la Campaña:
                  </label>
                  <select
                    value={newCampaignScope}
                    onChange={(e) => setNewCampaignScope(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todo el Catálogo Completo</option>
                    <option value="desarrollo">Solo Desarrollo de Software</option>
                    <option value="ia">Solo Módulos de Inteligencia Artificial</option>
                    <option value="asesoria">Solo Asesoría Tecnológica</option>
                    <option value="servidores">Solo Infraestructura & Servidores</option>
                    <option value="diseno">Solo Diseño UI/UX</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tipo de Descuento:
                  </label>
                  <select
                    value={newCampaignDiscountType}
                    onChange={(e) => setNewCampaignDiscountType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed_usd">Monto Fijo en USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Valor del Descuento ({newCampaignDiscountType === 'percentage' ? '%' : 'USD'}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={newCampaignDiscountType === 'percentage' ? 100 : 50000}
                  step={newCampaignDiscountType === 'percentage' ? 1 : 5}
                  value={newCampaignDiscountValue}
                  onChange={(e) => setNewCampaignDiscountValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Fecha y Hora de Inicio:
                  </label>
                  <input
                    type="datetime-local"
                    value={newCampaignStart}
                    onChange={(e) => setNewCampaignStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Fecha y Hora de Fin:
                  </label>
                  <input
                    type="datetime-local"
                    value={newCampaignEnd}
                    onChange={(e) => setNewCampaignEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Destinatario / Clientes a los que aplica:
                </label>
                <select
                  value={newCampaignClient}
                  onChange={(e) => setNewCampaignClient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">A todos los clientes (Público General)</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.email || l.phone || `Lead #${l.id}`}>
                      Lead #{l.id} - {l.email || l.phone || 'Sin contacto'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCampaignModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCampaign ? 'Guardando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ENVIAR COTIZACIÓN A CLIENTE SELECCIONADO           */}
      {/* ========================================================= */}
      {showSendQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Enviar Presupuesto a Cliente
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona el cliente de la lista de leads o escribe un contacto nuevo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSendQuoteModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSendQuotationToClient} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Selección de Lead existente */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vincular con Lead Registrado (Opcional):
                </label>
                <select
                  value={selectedQuoteLeadId}
                  onChange={(e) => {
                    const leadId = e.target.value;
                    setSelectedQuoteLeadId(leadId);
                    if (leadId) {
                      const matched = leads.find(l => String(l.id) === String(leadId));
                      if (matched) {
                        setQuoteRecipientContact(matched.email || matched.phone || '');
                        setQuoteRecipientName(`Cliente Lead #${matched.id}`);
                        if (matched.phone && !matched.email) setQuoteSendChannel('whatsapp');
                        else setQuoteSendChannel('email');
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Ingresar cliente nuevo manualmente --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lead #{l.id} • {l.email || l.phone || 'Sin contacto directo'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre del Cliente:
                </label>
                <input
                  type="text"
                  value={quoteRecipientName}
                  onChange={(e) => setQuoteRecipientName(e.target.value)}
                  placeholder="Ej: Juan Pérez / Empresa XYZ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Canal de Envío:
                  </label>
                  <select
                    value={quoteSendChannel}
                    onChange={(e) => setQuoteSendChannel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="email">Correo Electrónico</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Destinatario ({quoteSendChannel === 'email' ? 'Email' : 'WhatsApp'}):
                  </label>
                  <input
                    type="text"
                    value={quoteRecipientContact}
                    onChange={(e) => setQuoteRecipientContact(e.target.value)}
                    placeholder={quoteSendChannel === 'email' ? 'cliente@empresa.com' : '+54 9 11 1234-5678'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Resumen de Monto a Enviar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Monto Total a Cotizar:</span>
                  <span className="font-mono text-emerald-600 text-sm">${totalUSD.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Equivalente en Pesos:</span>
                  <span className="font-mono">${totalARS.toLocaleString('es-AR')} ARS (Blue ${blueRate})</span>
                </div>
                {discountUSD > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                    <span>Descuento Aplicado:</span>
                    <span className="font-mono">-${discountUSD} USD ({campaignDiscountLabel})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nota / Mensaje adicional para el cliente (Opcional):
                </label>
                <textarea
                  rows="3"
                  value={quoteCustomMessage}
                  onChange={(e) => setQuoteCustomMessage(e.target.value)}
                  placeholder="Ej: Te adjuntamos la propuesta técnica y comercial con validez por 15 días..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {quoteSentSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                  {quoteSentSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSendQuoteModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingQuote}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingQuote ? 'Registrando...' : 'Registrar y Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </div>
      </div>

    </div>
  );
}
