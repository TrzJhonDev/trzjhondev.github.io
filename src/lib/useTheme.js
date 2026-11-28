import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

// El tema inicial lo pone el script de index.html (preferencia guardada o la del sistema).
// El DOM (data-theme en <html>) es la fuente de verdad; los componentes se sincronizan con él.
export const currentTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/**
 * Cambia el tema ('light' | 'dark') con un fundido suave entre el aspecto viejo y el nuevo (View Transitions;
 * la duración está en src/styles/global.css); sin esa API, un fundido de colores con CSS. Con "reducir movimiento" es instantáneo.
 * Se puede llamar desde cualquier parte: el botón de la barra o el comando `tema` de la terminal.
 * Guarda la elección solo cuando el usuario la cambia.
 */
export function applyTheme(next) {
  if (next === currentTheme()) return;
  try { localStorage.setItem('theme', next); } catch { /* sin almacenamiento: solo esta visita */ }

  const root = document.documentElement;
  const apply = () => {
    root.dataset.theme = next;
    // Barra del navegador en el móvil: el fondo del tema (--bg)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#FAF8F4' : '#0C0E13');
  };

  if (prefersReducedMotion()) { apply(); return; }
  if (typeof document.startViewTransition === 'function') {
    const vt = document.startViewTransition(apply);
    // Si se cambia el tema dos veces seguidas, el navegador salta la primera transición: no es un error
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach((p) => p?.catch(() => {}));
  } else {
    root.classList.add('theme-fade');
    apply();
    window.setTimeout(() => root.classList.remove('theme-fade'), 650);
  }
}

export const toggleTheme = () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');

/** Devuelve [tema, alternar]. Se mantiene al día aunque el tema cambie desde otro sitio (p. ej. la terminal). */
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    // flushSync: el icono del botón debe estar al día cuando el navegador captura el aspecto nuevo
    const mo = new MutationObserver(() => flushSync(() => setTheme(currentTheme())));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  return [theme, toggleTheme];
}
