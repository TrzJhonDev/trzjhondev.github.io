import { useEffect, useState } from 'react';
import { profile } from '../data/profile';
import { localLink } from '../lib/links';

/** Palabra que rota ("software", "apps web"…). Todas ocupan la misma celda: el titular no cambia de tamaño. */
function Rotor({ words }) {
  const [at, setAt] = useState({ i: 0, prev: -1 });
  useEffect(() => {
    if (words.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = window.setInterval(() => setAt((a) => ({ i: (a.i + 1) % words.length, prev: a.i })), 2600);
    return () => window.clearInterval(id);
  }, [words.length]);
  return (
    <span className="rotor" aria-hidden="true">
      {words.map((w, k) => (
        <span key={w} className={`rotor__w${k === at.i ? ' is-on' : k === at.prev ? ' is-out' : ''}`}>{w}.</span>
      ))}
    </span>
  );
}

export default function Hero() {
  return (
    <div className="intro">
      {/* Sin la etiqueta "Disponible para prácticas" (Jhon la quitó el 24/11/2026) */}
      {/* Titular por renglones (scroll-craft, acto 1): cada renglón entra por separado al cargar */}
      <h1>
        <span className="h1-line">Hola, soy {profile.name}.</span>
        {/* Un solo renglón en azul (revisión de color del 25/11/2026): el azul vivo se reserva para lo que destaca */}
        <span className="h1-line">Construyo</span>
        <span className="h1-line accent">
          <span className="sr-only">{profile.building[0]}.</span>
          <Rotor words={profile.building} />
        </span>
      </h1>
      <p className="lead">
        {profile.role} en la {profile.university}, {profile.city}. {profile.bio}
      </p>
      <div className="row">
        <a href="#proyectos" className="btn btn--accent btn--lg">Ver proyectos</a>
        <a {...localLink(profile.cvUrl)} className="btn btn--ghost btn--lg" download>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
          Descargar CV
        </a>
      </div>
    </div>
  );
}
