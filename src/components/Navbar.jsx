import { useEffect, useRef } from 'react';
import { profile } from '../data/profile';
import { useTheme } from '../lib/useTheme';

// section: la sección de la página que corresponde a cada enlace. Skills y Proyectos son la MISMA escena (el teclado del
// portátil y la lista de programas, en #proyectos), así que la rayita los subraya a los dos a la vez.
const LINKS = [
  { href: '#skills', label: 'Skills', section: 'proyectos' },
  { href: '#proyectos', label: 'Proyectos', section: 'proyectos' },
  { href: '#formacion', label: 'Formación', section: 'formacion' },
];
const SECTIONS = ['proyectos', 'formacion'];
const TOP = 80; // por encima de esto la barra es la de la portada (transparente y siempre visible)

/**
 * Barra flotante con la sección activa (Jhon, 26/11/2026). Arriba del todo es la de siempre, sobre la portada. Al bajar
 * se esconde (no tapa el portátil ni las tarjetas) y al subir vuelve, ya con fondo. Una rayita azul se desliza bajo el
 * enlace de la sección que tienes delante (la que cruza el 40 % de la ventana) y ese enlace lleva aria-current. Todo se
 * escribe en el DOM desde un único listener de scroll con requestAnimationFrame (sin re-renderizar React).
 */
function useFloatingNav(navRef) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ind = nav.querySelector('.nav__ind');
    const links = [...nav.querySelectorAll('.nav__links a[data-section]')];
    let lastY = window.scrollY, raf = 0, active = null;

    const paint = () => {
      raf = 0;
      const y = window.scrollY, dy = y - lastY;
      if (y <= TOP) nav.classList.remove('is-floating', 'is-hidden');
      else if (dy > 4) nav.classList.add('is-floating', 'is-hidden');
      else if (dy < -4) { nav.classList.add('is-floating'); nav.classList.remove('is-hidden'); }
      if (Math.abs(dy) > 4 || y <= TOP) lastY = y;

      // Sección activa: la que cruza la línea del 40 % de la ventana
      const line = window.innerHeight * 0.4;
      let now = null;
      for (const id of SECTIONS) {
        const r = document.getElementById(id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom > line) { now = id; break; }
      }
      if (now === active) return;
      active = now;
      const on = links.filter((a) => a.dataset.section === now && a.offsetWidth > 0);
      links.forEach((a) => (on.includes(a) ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
      if (!on.length) { ind.classList.remove('is-on'); return; }
      const left = on[0].offsetLeft, right = on[on.length - 1].offsetLeft + on[on.length - 1].offsetWidth;
      ind.style.transform = `translateX(${left}px)`;
      ind.style.width = `${right - left}px`;
      ind.classList.add('is-on');
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const onResize = () => { active = undefined; onScroll(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    paint();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [navRef]);
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function Navbar() {
  const [theme, toggleTheme] = useTheme();
  const dark = theme === 'dark';
  const navRef = useRef(null);
  useFloatingNav(navRef);

  return (
    <header className="nav" ref={navRef}>
      <nav className="container nav__inner">
        <a href="#inicio" className="brand">
          {/* Firma: la "J_" con el cursor azul parpadeando (decorativa; la marca va al lado). Jhon cambiará el icono más adelante */}
          <span className="brand__mark" aria-hidden="true">J<span className="cursor-blink">_</span></span>
          {/* La marca TrzJhonDev (profile.brand) en lugar de nombre y apellido (Jhon, 24/11/2026) */}
          <span className="brand__name">{profile.brand}</span>
        </a>
        <div className="nav__links">
          {LINKS.map((l) => <a key={l.href} href={l.href} data-section={l.section}>{l.label}</a>)}
          <span className="nav__ind" aria-hidden="true" />
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {/* key: al cambiar el tema el icono se vuelve a montar y repite su giro */}
            <span key={theme} className="theme-icon">{dark ? <SunIcon /> : <MoonIcon />}</span>
          </button>
          <a href="#contacto" className="btn btn--accent">Contáctame</a>
        </div>
      </nav>
    </header>
  );
}
