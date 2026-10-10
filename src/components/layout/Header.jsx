import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { LogoIcon } from '../common/LogoIcon';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-14 py-3.5">
        {/* Logo a la izquierda extrema */}
        <a href="#inicio" className="flex items-center gap-3 group">
          <LogoIcon size={36} className="group-hover:scale-105 shadow-sm shadow-blue-500/20 rounded-xl" />
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Nefe<span className="text-blue-600">tech</span>
          </span>
        </a>

        {/* Navegación a la derecha */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#inicio"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Inicio
          </a>
          <a
            href="#servicios"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            Servicios
          </a>
          <a
            href="#contacto"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            Contacto
          </a>
        </nav>

        {/* Botón Móvil */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
        </button>
      </div>

      {/* Menú Móvil */}
      {menuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-6 pt-2 pb-5 space-y-3 shadow-lg">
          <a
            href="#inicio"
            className="block text-sm font-semibold text-blue-600 py-1"
            onClick={() => setMenuOpen(false)}
          >
            Inicio
          </a>
          <a
            href="#servicios"
            className="block text-sm font-medium text-slate-600 hover:text-blue-600 py-1"
            onClick={() => setMenuOpen(false)}
          >
            Servicios
          </a>
          <a
            href="#contacto"
            className="block text-sm font-medium text-slate-600 hover:text-blue-600 py-1"
            onClick={() => setMenuOpen(false)}
          >
            Contacto
          </a>
        </div>
      )}
    </header>
  );
}
