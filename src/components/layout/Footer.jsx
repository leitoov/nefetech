import logoNefetech from '../../assets/nefetech-logo.png';
import { WHATSAPP_URL } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-[#dedfd7] bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-start gap-2">
            <a href="#inicio" className="inline-block">
              <img
                src={logoNefetech}
                alt="Nefetech"
                className="h-12 w-auto sm:h-14 object-contain"
              />
            </a>
            <p className="max-w-md text-[13px] leading-relaxed text-[#656b63]">
              Páginas web, chats con Inteligencia Artificial y automatizaciones simples para que tu negocio venda más y trabaje menos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[13px]">
            <a href="#soluciones" className="font-medium text-[#20251f] hover:text-[#304cff] transition-colors">
              Qué armamos
            </a>
            <a href="#situaciones" className="font-medium text-[#20251f] hover:text-[#304cff] transition-colors">
              Cómo te ayuda
            </a>
            <a href="#preguntas" className="font-medium text-[#20251f] hover:text-[#304cff] transition-colors">
              Dudas
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#304cff] hover:text-[#233ce0] transition-colors"
            >
              WhatsApp ↗
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#dedfd7] pt-6 text-[12px] text-[#656b63] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nefetech · Webs, Chats con IA y Automatización.</p>
          <div className="flex items-center gap-4">
            <a href="#privacidad" className="hover:text-[#20251f] transition-colors">
              Privacidad
            </a>
            <span aria-hidden="true">·</span>
            <a href="#terminos" className="hover:text-[#20251f] transition-colors">
              Términos y condiciones
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
