import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingActions } from '../common/FloatingActions';

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
