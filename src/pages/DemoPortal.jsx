import React, { useState, useRef } from 'react';
import { Icon } from '../components/common/Icon';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Configurar el worker de PDF.js usando CDN seguro para empaquetado sin conflictos
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Límite máximo de peso para el archivo PDF: 10 Megabytes
const MAX_PDF_SIZE_MB = 10;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;
// Límite máximo de preguntas por documento
const MAX_QUESTIONS_ALLOWED = 5;

// Catálogo simulado de stock en memoria para la Demo 2
const HARDCODED_INVENTORY = [
  {
    id: 'PROD-001',
    nombre: 'MacBook Pro 16" M3 Max 36GB RAM',
    categoria: 'Laptops & Workstations',
    stock_actual: 4,
    stock_minimo: 3,
    ubicacion: 'Depósito Central - Bahía B3',
    proximo_ingreso: '22/10/2026',
    cantidad_por_ingresar: 10,
    precio_usd: 3499,
    estado: 'Stock Bajo'
  },
  {
    id: 'PROD-002',
    nombre: 'Monitor Dell UltraSharp 32" 4K IPS USB-C',
    categoria: 'Monitores',
    stock_actual: 18,
    stock_minimo: 5,
    ubicacion: 'Depósito Norte - Rack A1',
    proximo_ingreso: '15/10/2026',
    cantidad_por_ingresar: 25,
    precio_usd: 890,
    estado: 'Disponible'
  },
  {
    id: 'PROD-003',
    nombre: 'Servidor Dell PowerEdge R750 Xeon 64C 128GB',
    categoria: 'Infraestructura & Servidores',
    stock_actual: 0,
    stock_minimo: 2,
    ubicacion: 'Depósito Central - Jaula Segura',
    proximo_ingreso: '28/10/2026',
    cantidad_por_ingresar: 5,
    precio_usd: 6200,
    estado: 'Agotado (En tránsito)'
  },
  {
    id: 'PROD-004',
    nombre: 'Switch Cisco Catalyst 9300 48 Puertos PoE+',
    categoria: 'Redes & Conectividad',
    stock_actual: 7,
    stock_minimo: 4,
    ubicacion: 'Depósito Oeste - Estante C2',
    proximo_ingreso: '19/10/2026',
    cantidad_por_ingresar: 12,
    precio_usd: 2150,
    estado: 'Disponible'
  },
  {
    id: 'PROD-005',
    nombre: 'Placa NVIDIA RTX 4090 24GB GDDR6X',
    categoria: 'Componentes & IA Hardware',
    stock_actual: 2,
    stock_minimo: 4,
    ubicacion: 'Depósito Central - Bahía B1',
    proximo_ingreso: '16/10/2026',
    cantidad_por_ingresar: 8,
    precio_usd: 1990,
    estado: 'Stock Crítico'
  },
  {
    id: 'PROD-006',
    nombre: 'Disco NVMe Enterprise Samsung PM9A3 3.84TB U.2',
    categoria: 'Almacenamiento',
    stock_actual: 34,
    stock_minimo: 10,
    ubicacion: 'Depósito Norte - Rack B4',
    proximo_ingreso: '05/11/2026',
    cantidad_por_ingresar: 50,
    precio_usd: 480,
    estado: 'Disponible'
  }
];

// Documento demo inicial precargado
const DEFAULT_PDF_TEXT = `CONTRATO Y ESPECIFICACIÓN DE SERVICIOS TECNOLÓGICOS - NEFETECH
FECHA DE EMISIÓN: 10 de Octubre de 2026
CLIENTE: Corporación Andina de Innovación S.A.
PROYECTO: Plataforma Enterprise Cloud con Módulos de Inteligencia Artificial y RAG

1. ALCANCE GENERAL DEL PROYECTO
El presente documento describe los términos de implementación, arquitectura y niveles de servicio acordados. Nefetech desarrollará un ecosistema completo que incluye aplicaciones móviles multiplataforma, panel de administración con dashboards en tiempo real, base de datos relacional MySQL y un motor de búsqueda semántica con vectores de embeddings.

2. ARQUITECTURA TÉCNICA Y SEGURIDAD
El backend operará sobre contenedores Linux securizados con certificados SSL/TLS y cabeceras HSTS obligatorias. La autenticación de usuarios implementará tokens JWT criptográficamente firmados con caducidad dinámica y control biométrico en dispositivos compatibles. La base vectorial operará en memoria y almacenamiento columnar para garantizar tiempos de respuesta inferiores a 250 milisegundos en el 99% de las consultas.

3. POLÍTICA DE BACKUPS Y RECUPERACIÓN ANTE DESASTRES (SLA)
Se realizarán copias de seguridad incrementales cada 4 horas y snapshots completos diarios a las 02:00 AM UTC. El tiempo objetivo de recuperación (RTO) se fija en un máximo de 60 minutos, mientras que el punto objetivo de recuperación (RPO) es inferior a 240 minutos. La disponibilidad garantizada de los servicios contratados es del 99.95% mensual.

4. CONDICIONES COMERCIALES Y HITOS DE ENTREGA
El costo de desarrollo se dividirá en 3 hitos: Hito 1 (30% al inicio y aprobación del diseño UI/UX), Hito 2 (40% al completar las APIs y autenticación), y Hito 3 (30% final tras 15 días de pruebas en entorno de homologación y despliegue a producción). Las garantías de corrección de bugs sin costo adicional aplican durante 180 días posteriores a la entrega final.`;

export function DemoPortal() {
  const [selectedDemo, setSelectedDemo] = useState(null); // null = bloques; 'pdf' | 'stock'

  // -------------------------------------------------------------
  // ESTADOS DEMO 1: LECTOR DE PDF / CARGA REAL & RAG VECTORIAL
  // -------------------------------------------------------------
  const [pdfFileName, setPdfFileName] = useState('Contrato_Servicios_Nefetech.pdf');
  const [pdfFileSize, setPdfFileSize] = useState('240 KB');
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [pdfText, setPdfText] = useState(DEFAULT_PDF_TEXT);
  const [vectorIndex, setVectorIndex] = useState(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingMsg, setIndexingMsg] = useState('');
  const [pdfUploadError, setPdfUploadError] = useState('');

  // Contador de preguntas por IP (máximo 5)
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [hasLeadContact, setHasLeadContact] = useState(false);
  const [leadContactValue, setLeadContactValue] = useState('');
  const [isChatTerminated, setIsChatTerminated] = useState(false);

  // Modal para pedir presupuesto a un asesor
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteContactInput, setQuoteContactInput] = useState('');
  const [quoteMessageInput, setQuoteMessageInput] = useState('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState('');

  // Consultar uso de la IP al montar el componente
  useEffect(() => {
    const fetchIpUsage = async () => {
      try {
        const res = await fetch('/api/demo/rag.php?action=usage');
        const data = await res.json();
        if (data.success) {
          if (typeof data.used_questions === 'number') {
            setQuestionsUsed(data.used_questions);
          }
          if (data.has_contact) {
            setHasLeadContact(true);
            setLeadContactValue(data.lead_contact || '');
            setQuoteContactInput(data.lead_contact || '');
          }
          if (data.is_terminated) {
            setIsChatTerminated(true);
          }
        }
      } catch (e) {
        console.error('Error fetching IP usage:', e);
      }
    };
    fetchIpUsage();
  }, []);

  const fileInputRef = useRef(null);
  
  const [pdfQuestion, setPdfQuestion] = useState('');
  const [isAskingPdf, setIsAskingPdf] = useState(false);
  const [pdfConversation, setPdfConversation] = useState([
    {
      sender: 'bot',
      text: '¡Hola! He cargado el documento inicial. Puedes hacer hasta 5 preguntas fundamentadas sobre este PDF, o hacer clic en "Subir Archivo PDF" para analizar cualquier documento de tu empresa (máximo 10 MB).'
    }
  ]);

  // -------------------------------------------------------------
  // ESTADOS DEMO 2: BUSCADOR DE STOCK (SIMULADO / HARDCODEADO)
  // -------------------------------------------------------------
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSelectedCategory, setStockSelectedCategory] = useState('Todas');
  const [stockChatQuery, setStockChatQuery] = useState('');
  const [stockConversation, setStockConversation] = useState([
    {
      sender: 'bot',
      text: 'Asistente de Almacén Nefetech listo. Pregúntame por disponibilidad, por ejemplo: "¿Cuántas MacBook Pro quedan?", "¿Cuándo entran los servidores Dell?" o "¿Qué productos están con stock crítico?".'
    }
  ]);

  // Manejo de Carga de Archivo PDF
  const handlePdfFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfUploadError('');
    setIndexingMsg('');

    // 1. Validar Tipo de Archivo
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfUploadError('Por favor selecciona un archivo en formato PDF (.pdf).');
      return;
    }

    // 2. Validar Peso Máximo (10 MB)
    if (file.size > MAX_PDF_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setPdfUploadError(`El archivo pesa ${sizeMb} MB. El límite máximo permitido es de ${MAX_PDF_SIZE_MB} MB.`);
      return;
    }

    const formattedSize = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : Math.round(file.size / 1024) + ' KB';

    setIsParsingPdf(true);
    setPdfFileName(file.name);
    setPdfFileSize(formattedSize);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      setPdfPageCount(pdfDoc.numPages);
      let extractedFullText = '';

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item) => item.str);
        const pageText = pageStrings.join(' ');
        extractedFullText += `--- PÁGINA ${pageNum} ---\n${pageText}\n\n`;
      }

      if (!extractedFullText.trim()) {
        setPdfUploadError('No se pudo extraer texto seleccionable del PDF (puede ser un PDF escaneado sólo como imagen).');
        setIsParsingPdf(false);
        return;
      }

      setPdfText(extractedFullText.trim());

      setVectorIndex(null);
      setPdfConversation([
        {
          sender: 'bot',
          text: `Se ha cargado con éxito "${file.name}" (${pdfDoc.numPages} páginas, ${formattedSize}). La IA lo está indexando vectorialmente.`
        }
      ]);

      // Indexar automáticamente el nuevo documento
      await executeIndexDocument(file.name, extractedFullText.trim());

    } catch (err) {
      console.error(err);
      setPdfUploadError('Ocurrió un error al procesar el archivo PDF. Intenta con otro documento.');
    } finally {
      setIsParsingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Función auxiliar de indexación vectorial
  const executeIndexDocument = async (name, text) => {
    setIsIndexing(true);
    try {
      const res = await fetch('/api/demo/rag.php?action=index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text })
      });
      const data = await res.json();
      if (data.success) {
        setVectorIndex(data.document);
        setIndexingMsg(`¡Indexación vectorial completada! (${data.document.total_chunks} fragmentos RAG calculados).`);
      } else {
        setIndexingMsg('Error: ' + (data.error || 'No se pudo indexar.'));
      }
    } catch (e) {
      setIndexingMsg('Error de conexión con el motor vectorial.');
    } finally {
      setIsIndexing(false);
    }
  };

  // Botón manual de Re-indexar
  const handleIndexPdf = async () => {
    setIndexingMsg('');
    await executeIndexDocument(pdfFileName, pdfText);
  };

  // Preguntar al PDF con control de límite de 5 preguntas
  const handleAskPdf = async (e) => {
    e.preventDefault();
    if (!pdfQuestion.trim()) return;

    if (isChatTerminated) {
      alert('Has alcanzado el límite de 5 preguntas.');
      return;
    }

    const q = pdfQuestion.trim();
    setPdfQuestion('');

    setPdfConversation(prev => [...prev, { sender: 'user', text: q }]);
    setIsAskingPdf(true);

    try {
      // Si aún no indexó, indexar automáticamente primero
      let currentVectors = vectorIndex?.vectors;
      if (!currentVectors) {
        const resIdx = await fetch('/api/demo/rag.php?action=index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: pdfFileName, text: pdfText })
        });
        const dataIdx = await resIdx.json();
        if (dataIdx.success) {
          setVectorIndex(dataIdx.document);
          currentVectors = dataIdx.document.vectors;
        }
      }

      const res = await fetch('/api/demo/rag.php?action=ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          document_name: pdfFileName,
          vectors: currentVectors
        })
      });
      const data = await res.json();

      if (data.success) {
        if (typeof data.used_questions === 'number') {
          setQuestionsUsed(data.used_questions);
        }
        if (data.has_contact) {
          setHasLeadContact(true);
          setLeadContactValue(data.lead_contact || '');
          setQuoteContactInput(data.lead_contact || '');
        }
        if (data.is_terminated) {
          setIsChatTerminated(true);
        }
        setPdfConversation(prev => [
          ...prev, 
          { 
            sender: 'bot', 
            text: data.answer,
            chunks: data.relevant_chunks
          }
        ]);
      } else {
        if (data.is_blocked || data.used_questions >= 5) {
          setQuestionsUsed(5);
        }
        if (data.is_terminated) {
          setIsChatTerminated(true);
        }
        setPdfConversation(prev => [
          ...prev, 
          { sender: 'bot', text: data.error || 'Lo siento, no pude procesar la consulta.' }
        ]);
      }
    } catch (err) {
      setPdfConversation(prev => [
        ...prev, 
        { sender: 'bot', text: 'Error de comunicación con el motor de IA.' }
      ]);
    } finally {
      setIsAskingPdf(false);
    }
  };

  // Enviar presupuesto a un asesor desde la Demo de PDF
  const handleSendQuote = async (e) => {
    e.preventDefault();
    const contact = quoteContactInput.trim();
    if (!contact) {
      alert('Por favor ingresa tu correo electrónico o teléfono.');
      return;
    }

    setIsSendingQuote(true);
    setQuoteSuccessMsg('');

    try {
      const res = await fetch('/api/demo/rag.php?action=lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: contact,
          message: quoteMessageInput.trim() || `Solicitud de presupuesto para análisis y RAG sobre ${pdfFileName}`,
          document_name: pdfFileName
        })
      });
      const data = await res.json();
      if (data.success) {
        setHasLeadContact(true);
        setLeadContactValue(contact);
        setQuoteSuccessMsg(data.message || '¡Solicitud enviada con éxito! Un asesor se comunicará a la brevedad.');
        setPdfConversation(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `¡Excelente! Hemos recibido tu solicitud de presupuesto para "${pdfFileName}". Un asesor comercial de Nefetech te enviará la propuesta detallada al contacto provisto (${contact}).`
          }
        ]);
        setTimeout(() => {
          setIsQuoteModalOpen(false);
          setQuoteSuccessMsg('');
        }, 2200);
      } else {
        alert(data.error || 'No se pudo enviar la solicitud. Revisa tus datos.');
      }
    } catch (err) {
      alert('Error de conexión al enviar la solicitud.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  // Consulta por chat inteligente al stock simulado
  const handleAskStock = (e) => {
    e.preventDefault();
    if (!stockChatQuery.trim()) return;

    const q = stockChatQuery.trim();
    setStockChatQuery('');
    setStockConversation(prev => [...prev, { sender: 'user', text: q }]);

    const lowerQ = q.toLowerCase();
    let reply = "";

    // Búsqueda en los productos hardcodeados
    const matchedProducts = HARDCODED_INVENTORY.filter(p => 
      lowerQ.includes(p.nombre.toLowerCase().split(' ')[0].toLowerCase()) ||
      lowerQ.includes(p.categoria.toLowerCase()) ||
      p.nombre.toLowerCase().split(' ').some(word => word.length > 3 && lowerQ.includes(word))
    );

    if (lowerQ.includes('critico') || lowerQ.includes('agotado') || lowerQ.includes('bajo')) {
      const lowStock = HARDCODED_INVENTORY.filter(p => p.stock_actual <= p.stock_minimo);
      reply = `Actualmente tenemos ${lowStock.length} artículos en alerta:\n` + 
        lowStock.map(p => `• ${p.nombre}: Quedan ${p.stock_actual} un. (Mínimo: ${p.stock_minimo}). Próximo arribo: ${p.proximo_ingreso} (${p.cantidad_por_ingresar} un.)`).join('\n');
    } else if (lowerQ.includes('ingreso') || lowerQ.includes('llega') || lowerQ.includes('cuando entran')) {
      reply = `Cronograma de próximos arribos a depósito:\n` + 
        HARDCODED_INVENTORY.map(p => `• ${p.nombre}: Ingresan ${p.cantidad_por_ingresar} unidades el día ${p.proximo_ingreso}`).join('\n');
    } else if (matchedProducts.length > 0) {
      reply = matchedProducts.map(p => 
        `Producto: ${p.nombre}\n` +
        `• Stock disponible: ${p.stock_actual} unidades\n` +
        `• Ubicación física: ${p.ubicacion}\n` +
        `• Próxima fecha de ingreso: ${p.proximo_ingreso} (${p.cantidad_por_ingresar} unidades en camino)\n` +
        `• Estado: ${p.estado}`
      ).join('\n\n');
    } else {
      reply = `He consultado el inventario pero no encontré coincidencias exactas para "${q}". Puedes consultar por: MacBook Pro, Monitores Dell, Servidores Dell, Switches Cisco, Placas RTX 4090 o Discos NVMe.`;
    }

    setTimeout(() => {
      setStockConversation(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 400);
  };

  // Filtrado de la tabla de stock
  const filteredStock = HARDCODED_INVENTORY.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(stockSearchQuery.toLowerCase());
    const matchesCat = stockSelectedCategory === 'Todas' || item.categoria === stockSelectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col justify-between">
      {/* Input oculto de subida de PDF */}
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
        onChange={handlePdfFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Icon name="smart_toy" size={24} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                Nefetech <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Demos</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                demo.nefetech.online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedDemo && (
              <button
                onClick={() => setSelectedDemo(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="arrow_back" size={16} /> Ver Todos los Bloques
              </button>
            )}

            <a
              href="https://nefetech.online"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-2"
            >
              Ir a Nefetech Principal <Icon name="open_in_new" size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col justify-center">

        {/* 1. VISTA INICIAL: BLOQUES QUE AL HACER CLICK MUESTRAN LA DEMO */}
        {!selectedDemo && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
                <Icon name="bolt" size={14} /> Demos Interactivas en Vivo
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Experimenta nuestras <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Automatizaciones e IA</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
                Selecciona uno de los siguientes módulos para probar en tiempo real la tecnología que implementamos para empresas y startups.
              </p>
            </div>

            {/* Grid de Bloques / Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Bloque 1: Lector de PDF Vectorial */}
              <div 
                onClick={() => setSelectedDemo('pdf')}
                className="group bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-500/60 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon name="picture_as_pdf" size={32} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2 block">
                    Demo 1 • Cargar PDF & IA Vectorial RAG
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                    Leer PDF & Preguntas a la IA
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    Sube tu propio archivo PDF (hasta 10 MB). La IA lo indexa con embeddings vectoriales en segundos y te permite hacer hasta 5 preguntas fundamentadas con respuestas extraídas del documento.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-white">
                  <span>Cargar PDF y Probar</span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                    <Icon name="arrow_forward" size={16} />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Buscador Inteligente de Stock */}
              <div 
                onClick={() => setSelectedDemo('stock')}
                className="group bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon name="inventory_2" size={32} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
                    Demo 2 • Inventario Automatizado
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                    Buscador de Stock & Fechas de Ingreso
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    Asistente de almacén y logística con catálogo simulado. Pregúntale cuántas unidades quedan, qué productos están en stock crítico o cuándo ingresan nuevas partidas por proveedor.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-white">
                  <span>Probar Demo en Vivo</span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
                    <Icon name="arrow_forward" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DEMO 1: LEER PDF REAL & CONSULTAS VECTORIALES (RAG) */}
        {selectedDemo === 'pdf' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header de la Demo */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 inline-block">
                    Demo 1 • Búsqueda Vectorial RAG
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
                    Máx: {MAX_PDF_SIZE_MB} MB
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    questionsUsed >= MAX_QUESTIONS_ALLOWED 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    Preguntas: {questionsUsed} de {MAX_QUESTIONS_ALLOWED}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Cargar Documento PDF & Consultas Inteligentes
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Sube tu archivo PDF. La IA extrae el texto, genera embeddings vectoriales y te responde hasta {MAX_QUESTIONS_ALLOWED} consultas basadas estrictamente en su contenido.
                </p>
              </div>

              {/* Botón de Carga de PDF */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsingPdf || isIndexing}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Icon name={isParsingPdf ? 'hourglass_top' : 'upload_file'} size={18} className={isParsingPdf ? 'animate-spin' : ''} />
                  {isParsingPdf ? 'Leyendo PDF...' : 'Subir Archivo PDF'}
                </button>

                <button
                  onClick={handleIndexPdf}
                  disabled={isIndexing || isParsingPdf}
                  className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Re-indexar vectores del documento actual"
                >
                  <Icon name="refresh" size={16} className={isIndexing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Re-indexar</span>
                </button>
              </div>
            </div>

            {/* Mensaje de Error en Subida */}
            {pdfUploadError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-3">
                <Icon name="error" size={20} className="text-rose-400 shrink-0" />
                <span>{pdfUploadError}</span>
              </div>
            )}

            {/* Layout dos columnas: Documento a la izquierda, Chat IA a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Documento cargado */}
              <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  {/* Tarjeta de Información del Archivo Cargado */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                        <Icon name="picture_as_pdf" size={22} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                          {pdfFileName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {pdfFileSize} • {pdfPageCount} {pdfPageCount === 1 ? 'página' : 'páginas'} • {pdfText.length} caracteres
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      Cambiar PDF
                    </button>
                  </div>

                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Texto Extraído del PDF (puedes revisarlo o editarlo):
                  </label>
                  <textarea
                    rows={14}
                    value={pdfText}
                    onChange={(e) => setPdfText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl p-4 text-xs font-mono text-slate-300 leading-relaxed focus:outline-none resize-none"
                    placeholder="El texto extraído del PDF aparecerá aquí..."
                  />
                </div>

                {indexingMsg && (
                  <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center gap-2">
                    <Icon name="check_circle" size={16} className="text-blue-400" />
                    <span>{indexingMsg}</span>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Chat y Consultas al PDF */}
              <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-[600px]">
                {/* Header del Chat con contador y botón Pedir Presupuesto */}
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Icon name="psychology" size={18} className="text-blue-400" />
                    <span className="text-xs font-bold text-white">Consultas sobre el Documento</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Icon name="request_quote" size={14} />
                      <span>Pedir presupuesto a un asesor</span>
                    </button>

                    <div className="text-[11px] font-mono">
                      <span className="text-slate-400">Preguntas: </span>
                      <span className={questionsUsed >= MAX_QUESTIONS_ALLOWED ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {questionsUsed} / {MAX_QUESTIONS_ALLOWED}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banner de contacto o asesor disponible */}
                {hasLeadContact && (
                  <div className="mb-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center justify-between">
                    <span className="truncate">
                      Datos registrados: <strong className="text-white">{leadContactValue}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(true)}
                      className="text-xs underline text-blue-400 hover:text-blue-300 ml-2 shrink-0 font-medium cursor-pointer"
                    >
                      Enviar nueva consulta
                    </button>
                  </div>
                )}

                {/* Historial de conversación */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {pdfConversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Mostrar fragmentos citados si existen */}
                        {msg.chunks && msg.chunks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                              Fragmentos vectoriales recuperados:
                            </span>
                            {msg.chunks.map((c, cIdx) => (
                              <div key={cIdx} className="bg-slate-950/70 p-2 rounded-lg text-[11px] font-mono text-slate-400 border border-slate-800">
                                <span className="text-cyan-300 font-bold">Frag #{c.id} ({Math.round(c.score * 100)}% sim):</span> {c.text.slice(0, 110)}...
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isAskingPdf && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Icon name="refresh" size={16} className="animate-spin text-blue-400" />
                      <span>Buscando vectores similares y sintetizando respuesta...</span>
                    </div>
                  )}
                </div>

                {/* Input para preguntar o aviso de límite alcanzado / chat terminado */}
                {isChatTerminated ? (
                  <div className="pt-3 border-t border-slate-800 p-4 bg-slate-950/90 rounded-2xl border border-slate-800/80 text-center space-y-3">
                    <p className="text-xs text-rose-300 font-bold">
                      Has alcanzado el límite de 5 preguntas.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/30 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Icon name="support_agent" size={16} />
                      Pedir presupuesto a un asesor
                    </button>
                  </div>
                ) : questionsUsed >= MAX_QUESTIONS_ALLOWED ? (
                  <div className="pt-3 border-t border-slate-800 p-3 bg-slate-950/90 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-rose-300 font-bold">
                        Has alcanzado el límite de 5 preguntas.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Icon name="request_quote" size={14} />
                        Pedir presupuesto a un asesor
                      </button>
                    </div>
                    <form onSubmit={handleAskPdf} className="flex gap-2">
                      <input
                        type="text"
                        value={pdfQuestion}
                        onChange={(e) => setPdfQuestion(e.target.value)}
                        placeholder="Ingresa tu email o teléfono para coordinar con un asesor..."
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isAskingPdf || !pdfQuestion.trim()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      >
                        <Icon name="send" size={16} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    {questionsUsed >= 4 && !hasLeadContact && (
                      <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
                        <span>Te queda 1 sola pregunta disponible.</span>
                        <button
                          type="button"
                          onClick={() => setIsQuoteModalOpen(true)}
                          className="font-bold underline text-amber-200 hover:text-white cursor-pointer"
                        >
                          Dejar datos para asesor
                        </button>
                      </div>
                    )}
                    <form onSubmit={handleAskPdf} className="flex gap-2">
                      <input
                        type="text"
                        value={pdfQuestion}
                        onChange={(e) => setPdfQuestion(e.target.value)}
                        placeholder={`Pregunta sobre el documento (${MAX_QUESTIONS_ALLOWED - questionsUsed} restantes)...`}
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isAskingPdf || !pdfQuestion.trim()}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      >
                        <Icon name="send" size={16} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Modal: Pedir Presupuesto a un Asesor */}
            {isQuoteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Icon name="support_agent" size={22} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Pedir Presupuesto a un Asesor</h3>
                        <p className="text-[11px] text-slate-400">Atención personalizada y propuesta a medida</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(false)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>

                  {quoteSuccessMsg ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                      <Icon name="check_circle" size={32} className="text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-emerald-300">{quoteSuccessMsg}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendQuote} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Email o Teléfono / WhatsApp *
                        </label>
                        <input
                          type="text"
                          required
                          value={quoteContactInput}
                          onChange={(e) => setQuoteContactInput(e.target.value)}
                          placeholder="ej: contacto@empresa.com o +54 9 11..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Consulta o requerimiento específico
                        </label>
                        <textarea
                          rows={3}
                          value={quoteMessageInput}
                          onChange={(e) => setQuoteMessageInput(e.target.value)}
                          placeholder={`Deseo presupuesto para implementar un lector de documentos inteligente como "${pdfFileName}"...`}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsQuoteModalOpen(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingQuote || !quoteContactInput.trim()}
                          className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
                        >
                          <Icon name={isSendingQuote ? 'hourglass_top' : 'send'} size={14} className={isSendingQuote ? 'animate-spin' : ''} />
                          {isSendingQuote ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. DEMO 2: BUSCADOR DE STOCK & FECHAS DE INGRESO (SIMULADO / HARDCODEADO) */}
        {selectedDemo === 'stock' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header de la Demo */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2 inline-block">
                  Demo 2 • Inventario y Logística Simulado
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Buscador Inteligente de Stock & Fechas de Ingreso
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Consulta cuántas unidades quedan y sus fechas estimadas de reposición en depósito. Totalmente interactivo en memoria.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                  {HARDCODED_INVENTORY.length} Artículos en Base
                </span>
              </div>
            </div>

            {/* Asistente interactivo en tiempo real */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tabla de Inventario */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <div className="absolute left-3 top-2.5 text-slate-500">
                      <Icon name="search" size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar producto o código..."
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={stockSelectedCategory}
                    onChange={(e) => setStockSelectedCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Todas">Todas las Categorías</option>
                    <option value="Laptops & Workstations">Laptops & Workstations</option>
                    <option value="Monitores">Monitores</option>
                    <option value="Infraestructura & Servidores">Servidores</option>
                    <option value="Redes & Conectividad">Redes</option>
                    <option value="Componentes & IA Hardware">Hardware IA</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                        <th className="py-2.5 px-3">Producto</th>
                        <th className="py-2.5 px-3 text-center">Stock</th>
                        <th className="py-2.5 px-3">Próximo Ingreso</th>
                        <th className="py-2.5 px-3 text-right">Precio USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredStock.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{prod.nombre}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{prod.id} • {prod.ubicacion}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              prod.stock_actual === 0
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : prod.stock_actual <= prod.stock_minimo
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {prod.stock_actual} un.
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-cyan-300">{prod.proximo_ingreso}</span>
                            <span className="text-[10px] text-slate-400 block">+{prod.cantidad_por_ingresar} unidades</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                            ${prod.precio_usd.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chat Asistente de Almacén */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-[550px]">
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Icon name="support_agent" size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Preguntar al Asistente de Stock</h4>
                      <p className="text-[10px] text-slate-400">Responde sobre unidades y fechas de ingreso</p>
                    </div>
                  </div>

                  {/* Mensajes */}
                  <div className="h-[360px] overflow-y-auto space-y-3 pr-1 text-xs">
                    {stockConversation.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[90%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                            msg.sender === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-xs'
                              : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-xs font-mono text-[11px]'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input de consulta */}
                <form onSubmit={handleAskStock} className="pt-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={stockChatQuery}
                    onChange={(e) => setStockChatQuery(e.target.value)}
                    placeholder="Ej: ¿Cuándo ingresan los servidores Dell?"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Icon name="send" size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          Nefetech Demos &copy; {new Date().getFullYear()} &mdash; Soluciones de Automatización & Inteligencia Artificial
        </div>
      </footer>
    </div>
  );
}

export default DemoPortal;
