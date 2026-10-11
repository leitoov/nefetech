import React from 'react';

export function DemoPortal() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl font-bold">
          0
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Portal de Demostraciones</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          El portal de demostraciones se encuentra en preparación. Próximamente estará disponible.
        </p>
        <div className="pt-2">
          <a
            href="https://nefetech.online"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/30"
          >
            Volver a Nefetech
          </a>
        </div>
      </div>
    </div>
  );
}
