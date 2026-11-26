import { profile } from '../data/profile';
import { useTheme } from '../lib/useTheme';

const LINKS = [
  { href: '#skills', label: 'Skills' },
  { href: '#proyectos', label: 'Proyectos' },
  { href: '#formacion', label: 'Formación' },
];

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

  return (
    <header className="nav">
      <nav className="container nav__inner">
        <a href="#inicio" className="brand">
          {/* Firma: la "J_" con el cursor azul parpadeando (decorativa; la marca va al lado). Jhon cambiará el icono más adelante */}
          <span className="brand__mark" aria-hidden="true">J<span className="cursor-blink">_</span></span>
          {/* La marca TrzJhonDev (profile.brand) en lugar de nombre y apellido (Jhon, 24/11/2026) */}
          <span className="brand__name">{profile.brand}</span>
        </a>
        <div className="nav__links">
          {LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
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
