import { useState } from 'react';
import { Icon } from '../components/common/Icon';
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../utils/constants';

const EMAIL_URL = 'mailto:comercial@nefetech.online';

const GOALS = [
  {
    id: 'clientes',
    label: 'Quiero más clientes',
    emoji: '🚀',
    pitch: 'Te armamos una web rápida que convierte visitas de Instagram o Google en mensajes directos a tu WhatsApp.',
    waText: 'Hola! Quiero atraer más clientes con una página web.',
  },
  {
    id: 'mensajes',
    label: 'Me tapan los mensajes',
    emoji: '💬',
    pitch: 'Ponemos un Chat con IA que responde precios, horarios y dudas las 24 hs, para que solo hables con quien ya quiere comprar.',
    waText: 'Hola! Quiero un chat con IA para responder consultas automáticamente.',
  },
  {
    id: 'tiempo',
    label: 'Pierdo horas anotando',
    emoji: '⚡',
    pitch: 'Automatizamos tus turnos, pedidos y planillas para que todo se guarde solo y le llegue confirmación al cliente.',
    waText: 'Hola! Quiero automatizar tareas repetitivas en mi negocio.',
  },
];

const CHAT_SCENARIOS = [
  {
    id: 'precio',
    userMsg: 'Hola! Cuánto sale y qué incluye?',
    botMsg: '¡Hola! 👋 Te cuento rápido: armamos todo a medida según tu negocio. ¿Querés que te pase opciones y precios por acá o preferís un turno para charlarlo?',
    autoBadge: '✅ Lead guardado automáticamente',
  },
  {
    id: 'turno',
    userMsg: 'Tienen lugar mañana a la tarde?',
    botMsg: '¡Sí! Tengo disponible mañana a las 15:00 y a las 17:30 hs. Decime cuál te queda mejor y tu nombre así ya te lo dejo reservado 📅',
    autoBadge: '📅 Turno pre-agendado en Calendar',
  },
  {
    id: 'envio',
    userMsg: 'Hacen envíos o trabajan online?',
    botMsg: 'Trabajamos 100% online y también hacemos envíos en el día 🚚. Si me pasás tu código postal te confirmo el costo exacto al instante.',
    autoBadge: '📲 Resumen enviado a tu WhatsApp',
  },
];

const MARQUEE_ITEMS = [
  'Webs que venden',
  'Chats con IA 24/7',
  'Chau planillas eternas',
  'Turnos en automático',
  'Cero palabras técnicas',
  'Hecho para celulares',
];

const SITUATIONS = [
  {
    id: 'ig',
    chip: '“Solo tengo Instagram”',
    headline: 'Tu perfil está bueno, pero no alcanza.',
    answer:
      'En redes la gente scrollea y se olvida. Con una web propia tenés tu vidriera ordenada, aparecés en Google y das mucha más confianza para que te escriban listos para comprar.',
    cta: 'Quiero mi web propia',
  },
  {
    id: 'repetitivo',
    chip: '“Contesto siempre lo mismo”',
    headline: 'Dejá que un chat con IA haga el filtro por vos.',
    answer:
      '¿Te preguntan 40 veces por día el horario, la dirección o los precios? Un asistente con IA contesta al segundo con la info de tu negocio y te pasa el contacto cuando el cliente ya decidió.',
    cta: 'Quiero probar el chat con IA',
  },
  {
    id: 'caos',
    chip: '“Anoto todo a mano”',
    headline: 'Que tu negocio no dependa de tu memoria.',
    answer:
      'Conectamos tus formularios, WhatsApp, agenda y planillas. Entra una consulta, se guarda sola y el cliente recibe su confirmación automática sin que toques un botón.',
    cta: 'Quiero automatizar mi día',
  },
  {
    id: 'cero',
    chip: '“No entiendo nada de tech”',
    headline: 'No hace falta. Para eso estamos nosotros.',
    answer:
      'Nos contás cómo trabajás en una charla de 15 minutos, sin términos raros. Te mostramos opciones claras y te lo entregamos funcionando y fácil de usar.',
    cta: 'Charlemos sin compromiso',
  },
];

const FAQS = [
  {
    q: '¿Tengo que saber algo de programación o IA?',
    a: 'Cero. Vos nos contás qué querés lograr en tu negocio y nosotros armamos todo de punta a punta.',
  },
  {
    q: '¿En cuánto tiempo lo puedo tener funcionando?',
    a: 'Un chat con IA o una automatización suele estar lista en pocos días. Una web completa entre 1 y 2 semanas.',
  },
  {
    q: '¿Y si ya tengo web pero está vieja o lenta?',
    a: 'La renovamos desde cero manteniendo tu nombre, o le sumamos directamente el chat con IA y botones automáticos.',
  },
  {
    q: '¿Cómo sé cuánto me va a salir?',
    a: 'Nos escribís por WhatsApp, charlamos 10 minutos sobre lo que necesitás y te pasamos un presupuesto cerrado antes de empezar.',
  },
];

function buildWaLink(msg) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function Home() {
  const [selectedGoal, setSelectedGoal] = useState(GOALS[0]);
  const [activeScenario, setActiveScenario] = useState(CHAT_SCENARIOS[0]);
  const [autoMode, setAutoMode] = useState(true);
  const [activeSituation, setActiveSituation] = useState(SITUATIONS[0]);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="w-full bg-[#faf9f6] text-[#20251f]">
      {/* HERO DINÁMICO */}
      <section id="inicio" className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20">
        {/* Manchas suaves de color en el fondo */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#eceeff] blur-3xl opacity-80"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-20 -right-24 h-80 w-80 rounded-full bg-[#dcef98]/50 blur-3xl opacity-70"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
          {/* Columna izquierda: selector interactivo de objetivo */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#dcef98] px-3.5 py-1.5 text-[12px] font-semibold text-[#20251f] -rotate-1 shadow-2xs">
              <span>⚡</span>
              <span>Para negocios reales, cero vueltas</span>
            </div>

            <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#20251f] sm:text-[56px] lg:text-[62px]">
              Dejá de perder clientes por{' '}
              <span className="relative inline-block text-[#304cff]">
                no llegar a todo.
                <span
                  className="absolute bottom-1 left-0 -z-10 h-3 w-full rounded-full bg-[#dcef98]"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="max-w-xl text-[17px] leading-[1.5] text-[#656b63] sm:text-[18px]">
              Armamos tu <strong className="font-semibold text-[#20251f]">página web</strong>, un{' '}
              <strong className="font-semibold text-[#20251f]">chat con IA</strong> que atiende 24/7 y{' '}
              <strong className="font-semibold text-[#20251f]">automatizaciones</strong> para que trabajes menos y vendas más.
            </p>

            {/* Selector rápido de qué quiere el usuario */}
            <div className="rounded-2xl border border-[#dedfd7] bg-white p-4 sm:p-5 shadow-xs space-y-4">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#656b63]">
                ¿Qué te gustaría resolver primero? Tocá una opción:
              </p>

              <div className="flex flex-wrap gap-2">
                {GOALS.map((goal) => {
                  const active = selectedGoal.id === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setSelectedGoal(goal)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#20251f] text-white scale-[1.02]'
                          : 'bg-[#f0f1eb] text-[#20251f] hover:bg-[#eceeff] hover:text-[#304cff]'
                      }`}
                    >
                      <span>{goal.emoji}</span>
                      <span>{goal.label}</span>
                    </button>
                  );
                })}
              </div>

              <div key={selectedGoal.id} className="animate-pop rounded-xl bg-[#eceeff] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14px] leading-snug text-[#20251f] sm:max-w-[70%]">
                  {selectedGoal.pitch}
                </p>
                <a
                  href={buildWaLink(selectedGoal.waText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#304cff] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#233ce0] active:scale-95"
                >
                  <span>Quiero esto</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Columna derecha: Simulador vivo estilo celular + notificación flotante */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px]">
              {/* Badge flotante arriba */}
              <div className="animate-float absolute -top-4 -left-2 z-10 hidden sm:inline-flex items-center gap-2 rounded-full border border-[#dedfd7] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#20251f] shadow-md">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Respondiendo en vivo 24/7</span>
              </div>

              <div className="rounded-[28px] border border-[#d9ddf3] bg-white p-5 sm:p-6 shadow-[0_20px_50px_-15px_rgba(48,76,255,0.18)]">
                {/* Cabecera del chat */}
                <div className="flex items-center justify-between border-b border-[#f0f1eb] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#304cff] text-white font-bold">
                      ✦
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#20251f]">Tu Negocio · Chat IA</p>
                      <p className="text-[11px] text-[#656b63]">Probá tocar una pregunta abajo</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#dcef98] px-2.5 py-1 text-[11px] font-bold text-[#20251f]">
                    DEMO
                  </span>
                </div>

                {/* Burbujas de chat animadas */}
                <div key={activeScenario.id} className="animate-pop mt-5 space-y-3 min-h-[175px]">
                  <div className="ml-auto w-fit max-w-[82%] rounded-2xl rounded-br-xs bg-[#20251f] px-4 py-2.5 text-[13px] text-white">
                    {activeScenario.userMsg}
                  </div>

                  <div className="mr-auto w-fit max-w-[90%] rounded-2xl rounded-bl-xs bg-[#eceeff] px-4 py-3 text-[13px] leading-relaxed text-[#20251f]">
                    {activeScenario.botMsg}
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-[#dcef98]/80 px-3 py-1 text-[11px] font-semibold text-[#20251f]">
                    <span>{activeScenario.autoBadge}</span>
                  </div>
                </div>

                {/* Botones para cambiar la escena del chat */}
                <div className="mt-5 border-t border-[#f0f1eb] pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#656b63]">
                    Simulá otra consulta:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CHAT_SCENARIOS.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setActiveScenario(sc)}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                          activeScenario.id === sc.id
                            ? 'bg-[#304cff] text-white'
                            : 'bg-[#f0f1eb] text-[#20251f] hover:bg-[#eceeff]'
                        }`}
                      >
                        {sc.userMsg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CINTA EN MOVIMIENTO (MARQUEE) */}
      <div className="w-full overflow-hidden bg-[#20251f] py-3.5 text-white border-y border-[#20251f]">
        <div className="animate-marquee flex items-center gap-8">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((text, idx) => (
            <div key={`${text}-${idx}`} className="flex items-center gap-8 whitespace-nowrap">
              <span className="text-[14px] font-medium tracking-wide text-white">{text}</span>
              <span className="text-[#dcef98] text-[14px]" aria-hidden="true">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* BENTO GRID DINÁMICO: QUÉ ARMAMOS */}
      <section id="soluciones" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block rounded-full bg-[#eceeff] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#304cff]">
                QUÉ ARMAMOS PARA VOS
              </span>
              <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#20251f] sm:text-[46px]">
                Todo lo que necesitás, sin enredos.
              </h2>
            </div>
            <p className="max-w-sm text-[15px] text-[#656b63]">
              Elegís una cosa o combinamos todo. Siempre pensado para que lo entienda cualquiera.
            </p>
          </div>

          {/* Bento Grid asimétrico */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* Bloque grande 1: Webs */}
            <div className="group md:col-span-7 rounded-[24px] bg-[#eceeff] p-7 sm:p-8 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#304cff]">
                    PÁGINAS WEB
                  </span>
                  <span className="text-[22px] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                    🌐
                  </span>
                </div>
                <h3 className="mt-5 text-[28px] font-semibold leading-tight text-[#20251f] sm:text-[32px]">
                  Una web que da confianza y trae consultas.
                </h3>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#656b63]">
                  Ideal si hoy solo tenés Instagram o si tu página quedó vieja. La diseñamos para celular, rápida y con botones directos a tu WhatsApp.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dcef98] text-[#20251f]">
                    <Icon name="trending_up" size={20} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#20251f]">Hecha para vender</p>
                    <p className="text-[12px] text-[#656b63]">Clara en 5 segundos</p>
                  </div>
                </div>
                <a
                  href={buildWaLink('Hola! Me interesa armar una página web para mi negocio.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#20251f] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#304cff]"
                >
                  Consultar web ↗
                </a>
              </div>
            </div>

            {/* Bloque 2: Chats IA */}
            <div className="group md:col-span-5 rounded-[24px] bg-[#20251f] p-7 sm:p-8 text-white flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#dcef98] px-3 py-1 text-[11px] font-bold text-[#20251f]">
                    CHATS CON IA
                  </span>
                  <span className="text-[22px]">🤖</span>
                </div>
                <h3 className="mt-5 text-[26px] font-semibold leading-tight sm:text-[28px]">
                  Atendé clientes incluso mientras dormís.
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                  Un asistente entrenado con tus precios, horarios y servicios que responde al instante sin sonar como un robot duro.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-5">
                <span className="text-[13px] font-medium text-[#dcef98]">Funciona 24/7</span>
                <a
                  href={buildWaLink('Hola! Quiero un chat con IA para mi negocio.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#304cff] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#233ce0]"
                >
                  <span>Quiero mi chat</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            {/* Bloque 3: Automatización con switch interactivo */}
            <div className="group md:col-span-5 rounded-[24px] bg-[#dcef98] p-7 sm:p-8 text-[#20251f] flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#20251f] px-3 py-1 text-[11px] font-bold text-white">
                    AUTOMATIZACIÓN
                  </span>

                  {/* Switch interactivo */}
                  <button
                    type="button"
                    onClick={() => setAutoMode(!autoMode)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#20251f] shadow-2xs cursor-pointer"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        autoMode ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{autoMode ? 'Piloto automático ON' : 'Todo manual'}</span>
                  </button>
                </div>

                <h3 className="mt-5 text-[26px] font-semibold leading-tight sm:text-[28px]">
                  {autoMode
                    ? 'Tus turnos, avisos y planillas se hacen solos.'
                    : 'Basta de copiar y pegar mensajes todo el día.'}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#20251f]/80">
                  {autoMode
                    ? 'Conectamos tu web, WhatsApp, Google Calendar y planillas para ahorrarte horas todas las semanas.'
                    : 'Tocá el botón de arriba para activar el piloto automático y olvidarte de las tareas repetitivas.'}
                </p>
              </div>

              <div className="mt-8">
                <a
                  href={buildWaLink('Hola! Quiero automatizar tareas en mi negocio.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] font-bold text-[#20251f] hover:text-[#304cff]"
                >
                  <span>Automatizar mi negocio</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            {/* Bloque 4: Sistemas simples */}
            <div className="group md:col-span-7 rounded-[24px] bg-[#f4ede4] p-7 sm:p-8 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#20251f]">
                    SISTEMAS A MEDIDA
                  </span>
                  <span className="text-[22px]">🧩</span>
                </div>
                <h3 className="mt-5 text-[28px] font-semibold leading-tight text-[#20251f] sm:text-[32px]">
                  ¿El Excel ya te quedó chico? Armamos tu propio panel.
                </h3>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#656b63]">
                  Reservas, clientes, pedidos o stock en un lugar simple hecho exactamente para tu forma de trabajar, sin funciones de más que nadie usa.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#dedfd7] pt-5">
                <div className="flex flex-wrap gap-2">
                  {['Turnos', 'Clientes', 'Pedidos', 'Stock'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#20251f]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={buildWaLink('Hola! Necesito un sistema simple a medida para mi negocio.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#304cff] hover:text-[#233ce0]"
                >
                  <span>Contanos qué necesitás</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SELECTOR INTERACTIVO: ¿QUÉ TE FRENA HOY? */}
      <section id="situaciones" className="scroll-mt-20 w-full bg-[#f0f1eb] py-16 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#304cff]">
              TOCÁ TU SITUACIÓN
            </span>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#20251f] sm:text-[42px]">
              ¿Cuál de estas frases te suena más?
            </h2>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {SITUATIONS.map((sit) => {
              const active = activeSituation.id === sit.id;
              return (
                <button
                  key={sit.id}
                  type="button"
                  onClick={() => setActiveSituation(sit)}
                  className={`rounded-full px-5 py-3 text-[14px] font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#304cff] text-white shadow-md shadow-[#304cff]/20 -translate-y-0.5'
                      : 'bg-white text-[#20251f] border border-[#dedfd7] hover:border-[#304cff]'
                  }`}
                >
                  {sit.chip}
                </button>
              );
            })}
          </div>

          <div
            key={activeSituation.id}
            className="animate-pop mx-auto mt-8 max-w-3xl rounded-[24px] border border-[#dedfd7] bg-white p-7 sm:p-10 shadow-xs"
          >
            <h3 className="text-[24px] font-semibold leading-snug text-[#20251f] sm:text-[28px]">
              {activeSituation.headline}
            </h3>
            <p className="mt-3 text-[16px] leading-relaxed text-[#656b63] sm:text-[17px]">
              {activeSituation.answer}
            </p>
            <div className="mt-6">
              <a
                href={buildWaLink(`Hola! Me pasa esto: ${activeSituation.chip}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#20251f] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#304cff]"
              >
                <span>{activeSituation.cta}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PREGUNTAS ESTILO CHAT */}
      <section id="preguntas" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8">
          <div className="text-center">
            <span className="inline-block rounded-full bg-[#eceeff] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#304cff]">
              DUDAS RÁPIDAS
            </span>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#20251f] sm:text-[42px]">
              Lo que casi todos nos preguntan.
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-6 py-4 text-left transition-all cursor-pointer ${
                      isOpen
                        ? 'border-[#304cff] bg-[#20251f] text-white'
                        : 'border-[#dedfd7] bg-white text-[#20251f] hover:border-[#304cff]/60'
                    }`}
                  >
                    <span className="text-[16px] font-semibold sm:text-[17px]">{faq.q}</span>
                    <span
                      className={`shrink-0 text-[20px] leading-none ${
                        isOpen ? 'text-[#dcef98]' : 'text-[#304cff]'
                      }`}
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="animate-pop ml-4 sm:ml-10 rounded-2xl rounded-tl-xs bg-[#eceeff] px-6 py-4 text-[15px] leading-relaxed text-[#20251f]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CIERRE CON ENERGÍA */}
      <section id="contacto" className="scroll-mt-20 w-full bg-[#304cff] py-16 sm:py-20 text-white">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center px-5 text-center sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#dcef98] px-4 py-1.5 text-[12px] font-bold text-[#20251f] -rotate-1">
            <span>👋</span>
            <span>Charla de 15 min · Sin compromiso</span>
          </span>

          <h2 className="mt-6 text-[36px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[54px]">
            ¿Lo charlamos hoy por WhatsApp?
          </h2>

          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[#e5e8ff]">
            Contanos en dos líneas qué hacés y qué te gustaría mejorar. Te respondemos con ideas simples y un presupuesto claro.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#dcef98] px-8 py-4 text-[16px] font-bold text-[#20251f] shadow-lg transition-all hover:scale-[1.03] active:scale-95 sm:w-auto"
            >
              <span>Escribir por WhatsApp</span>
              <span aria-hidden="true">↗</span>
            </a>

            <a
              href={EMAIL_URL}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-4 text-[15px] font-semibold text-white backdrop-blur-xs transition-all hover:bg-white hover:text-[#304cff] sm:w-auto"
            >
              <span>comercial@nefetech.online</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
