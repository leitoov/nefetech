import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Terminos } from './pages/Terminos';
import { Privacidad } from './pages/Privacidad';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentHash(hash);

      if (hash === '#terminos' || hash === '#privacidad') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash) {
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
