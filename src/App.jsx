import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Terminos } from './pages/Terminos';
import { Privacidad } from './pages/Privacidad';
import { AdminPanel } from './pages/AdminPanel';
import { MentoriaPortal } from './pages/MentoriaPortal';
import { DemoPortal } from './pages/DemoPortal';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentHash(window.location.hash);
      setCurrentPath(window.location.pathname);

      if (window.location.hash === '#terminos' || window.location.hash === '#privacidad') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  // 1. Subdominio demo.nefetech.online o ruta /demo o #demo
  const isSubdomainDemo = window.location.hostname.startsWith('demo.');
  const isDemoRoute = currentPath.startsWith('/demo') || currentHash === '#demo';

  if (isSubdomainDemo || isDemoRoute) {
    return <DemoPortal />;
  }

  // 2. Subdominio mentorias.nefetech.online o ruta /mentorias
  const isSubdomainMentoria = window.location.hostname.startsWith('mentorias.');
  const isMentoriaRoute = currentPath.startsWith('/mentorias') || currentHash === '#mentorias';

  if (isSubdomainMentoria || isMentoriaRoute) {
    return <MentoriaPortal />;
  }

  // 2. Panel de administración: si entran por nefetech.online/admin o #admin, redirigir a admin.nefetech.online
  const isSubdomainAdmin = window.location.hostname.startsWith('admin.');
  const isAdminRoute = currentPath.startsWith('/admin') || currentHash === '#admin';

  if (!isSubdomainAdmin && isAdminRoute) {
    window.location.href = 'https://admin.nefetech.online';
    return null;
  }

  if (isSubdomainAdmin || isAdminRoute) {
    return <AdminPanel />;
  }

  // Enrutamiento según el hash de la URL
  let PageContent = <Home />;
  if (currentHash === '#terminos') {
    PageContent = <Terminos />;
  } else if (currentHash === '#privacidad') {
    PageContent = <Privacidad />;
  }

  return (
    <Layout>
      {PageContent}
    </Layout>
  );
}

export default App;
