import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingActions } from '../common/FloatingActions';

export function Layout({ children, fullBleed = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-[#20251f] antialiased selection:bg-[#eceeff] selection:text-[#304cff]">
      <Header />
      <main className={fullBleed ? 'flex-1 w-full' : 'flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8'}>
        {children}
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
