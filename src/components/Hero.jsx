import { profile } from '../data/profile';
import { localLink } from '../lib/links';

const fill = (s) => s.replace('{name}', profile.name);

export default function Hero() {
  const { hero } = profile;
  return (
    <div className="intro">
      {/* Sin la etiqueta "Disponible para prácticas" (Jhon la quitó el 24/11/2026) */}
      {/* Voz de la máquina (26/11/2026): una línea de consola y el titular "Sistema listo. Usuario: Jhon." en lugar del
          "Hola, soy… Construyo <palabra que rota>" de plantilla. Textos en profile.hero */}
      <p className="kicker hero__kicker" aria-hidden="true">{hero.kicker}</p>
      {/* Titular por renglones (scroll-craft, acto 1): cada renglón entra por separado al cargar */}
      <h1>
        <span className="h1-line">{fill(hero.title)}</span>
        {/* Un solo renglón en azul (revisión de color del 25/11/2026): el azul vivo se reserva para lo que destaca */}
        <span className="h1-line accent">{fill(hero.accent)}</span>
      </h1>
      <p className="lead">
        {profile.role} en la {profile.university}, {profile.city}. {profile.bio}
      </p>
      <div className="row">
        <a href="#proyectos" className="btn btn--accent btn--lg">Abrir proyectos</a>
        <a {...localLink(profile.cvUrl)} className="btn btn--ghost btn--lg" download>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
          Descargar CV
        </a>
      </div>
    </div>
  );
}
