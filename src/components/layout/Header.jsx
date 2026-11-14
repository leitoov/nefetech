import { useState } from 'react';
import { Icon } from '../common/Icon';
import logoNefetech from '../../assets/nefetech-logo.png';
import { WHATSAPP_URL } from '../../utils/constants';

const navLinks = [
  { label: 'Qué armamos', href: '#soluciones' },
  { label: 'Cómo te ayuda', href: '#situaciones' },
  { label: 'Dudas', href: '#preguntas' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#faf9f6]/85 backdrop-blur-md border-b border-[#dedfd7]/60">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-3 sm:px-8">
        <a href="#inicio" className="flex items-center shrink-0 transition-transform hover:scale-[1.02]">
          <img
            src={logoNefetech}
            alt="Nefetech"
            className="h-11 w-auto sm:h-13 object-contain"
          />
        </a>

        <nav className="hidden md:flex items-center gap-2 rounded-full border border-[#dedfd7] bg-white px-2 py-1.5 text-[14px] font-medium text-[#20251f] shadow-2xs">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 hover:bg-[#f0f1eb] hover:text-[#304cff] transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center shrink-0">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#304cff] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-[#304cff]/25 transition-all hover:bg-[#233ce0] hover:-translate-y-0.5 active:scale-95"
          >
            <span>Hablemos</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-full border border-[#dedfd7] bg-white p-2 text-[#20251f] hover:bg-[#f0f1eb] focus:outline-none cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#dedfd7] bg-white px-5 pt-3 pb-5 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#20251f] hover:bg-[#f0f1eb] hover:text-[#304cff]"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#304cff] px-5 py-3 text-[15px] font-semibold text-white"
          >
            <span>Hablemos por WhatsApp</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </header>
  );
}
