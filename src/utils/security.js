/**
 * Medidas de endurecimiento del cliente (Client-Side Hardening):
 * 1. Deshabilitar menú contextual (Click derecho).
 * 2. Bloquear atajos comunes de DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U).
 * 3. Detección proactiva de DevTools abiertas con limpiado de consola y advertencia de seguridad.
 */

export function setupClientProtection() {
  if (typeof window === 'undefined') return;

  // 1. Deshabilitar Click Derecho en toda la aplicación
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 2. Bloquear atajos de teclado para inspección
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I (Inspeccionar), Ctrl+Shift+J (Consola), Ctrl+Shift+C (Inspeccionar elemento)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }

    // Mac Cmd+Option+I / Cmd+Option+J / Cmd+Option+C
    if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }

    // Ctrl+U / Cmd+U (Ver código fuente HTML)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      return false;
    }
  });

  // 3. Advertencia de seguridad en consola
  try {
    const warningTitle = 'font-size: 20px; font-weight: bold; color: #ef4444;';
    const warningBody = 'font-size: 13px; color: #64748b;';
    console.log('%c¡Atención! Zona protegida de Nefetech', warningTitle);
    console.log('%cEsta consola es solo para propósitos internos del sistema. No pegues scripts ni intentes manipular tokens.', warningBody);
  } catch {
    // Silencioso
  }
}
