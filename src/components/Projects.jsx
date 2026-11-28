import { useCallback, useEffect, useRef, useState } from 'react';
import { projects as PROFILE_PROJECTS } from '../data/profile';
import { SKILLS } from '../data/skills';
import { externalLink, isReal } from '../lib/links';
import Laptop3D from './Laptop3D/Laptop3D';

/** Nombre de archivo de un proyecto: "[PROYECTO 1]" → "proyecto-1", "Tienda Online" → "tienda-online". */
export const slugOf = (p) => p.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'programa';

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M7 13.5l2.5 2-2.5 2M12 17.5h4" />
    </svg>
  );
}

/**
 * Lista de programas (opción D, elegida por Jhon el 26/11/2026; sustituye al carrusel de tarjetas): quieta, un archivo
 * por proyecto. Al abrir uno se ve en la pantalla del portátil (captura, descripción, stack) y aquí se despliegan sus
 * enlaces. Título y descripción también van aquí: visibles en móvil (el portátil queda arriba) y para lectores de
 * pantalla en escritorio (la pantalla 3D no es accesible). Si no caben, la lista se desplaza con la rueda o el dedo.
 */
function Programs({ open, onToggle, projects }) {
  return (
    <div className="progs">
      <p className="progs__path"><span>~/programas</span> — {projects.length} {projects.length === 1 ? 'elemento' : 'elementos'}</p>
      <ul className="progs__list" aria-label="Proyectos" data-lenis-prevent>
        {projects.map((p, i) => {
          const on = open === i;
          const id = `prog-${i}`;
          return (
            <li key={`${p.title}-${i}`} className={`prog${on ? ' is-open' : ''}`}>
              <button type="button" className="prog__btn" aria-expanded={on} aria-controls={id} onClick={() => onToggle(i)}>
                <FileIcon />
                <span className="prog__name">{slugOf(p)}.app</span>
                <span className="prog__state">{on ? 'abierto' : 'abrir'}</span>
              </button>
              <div id={id} className="prog__body" hidden={!on}>
                <div className="prog__info">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </div>
                <p className="prog__stack"><span>stack</span> {p.tags.join(' · ')}</p>
                <div className="prog__links">
                  <a {...externalLink(p.code)}>Código{!isReal(p.code) && <small>pendiente</small>}</a>
                  <a {...externalLink(p.demo)}>Demo{!isReal(p.demo) && <small>pendiente</small>}</a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Progreso del encendido con el scroll (0 a 1) en un ref, sin re-renderizar.
 * Escritorio (≥ 900 px y con movimiento): la pista mide la sección + RUNWAY pantallas y la sección va sticky; p es lo
 * recorrido de ese extra. SIN SCROLL MUERTO (Jhon, 26/11/2026: "el scroll no hace nada"): antes la sección seguía
 * fijada 2,4 pantallas cada vez que pasabas, aunque el portátil ya estuviera encendido. Ahora la pista es más corta
 * (1,6) y, en cuanto el encendido termina (p = 1), se quita para siempre (unpin) compensando el scroll en el mismo
 * fotograma: lo que ves no se mueve y desde ahí la sección pasa como cualquier otra. Móvil: sin fijar; p va de 0 cuando el escenario asoma por abajo a 1 cuando su borde superior
 * llega arriba. Con "reducir movimiento" no hay pista (el portátil ya sale encendido: useLaptop no hace la entrada).
 */
const RUNWAY = 1.6; // pantallas de scroll del encendido (si lo cambias, cambia .boot-runway.is-pinned en index.css)
function useBootRunway(ref) {
  const p = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const desk = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    let raf = 0, done = false;
    // Quita la pista sin que se note: la sección (fija hasta ahora) queda donde estaba y el scroll se compensa. Con el
    // scroll con inercia (Lenis) se corrige también su destino, para que un salto a #ancla en marcha llegue bien.
    const unpin = () => {
      done = true;
      const before = el.offsetHeight;
      el.classList.remove('is-pinned');
      const delta = before - el.offsetHeight;
      if (delta <= 0) return; // p = 1: ya estás al final de la pista o más abajo, así que siempre se compensa
      const lenis = window.__lenis, y = window.scrollY - delta;
      if (lenis) {
        const goal = lenis.targetScroll - delta;
        lenis.resize();
        lenis.scrollTo(y, { immediate: true, force: true });
        if (goal > y + 1) lenis.scrollTo(goal, { force: true });
      } else window.scrollTo({ top: y, behavior: 'instant' });
    };
    const read = () => {
      raf = 0;
      if (done) return;
      const vh = window.innerHeight, r = el.getBoundingClientRect();
      let v;
      if (desk.matches) v = -r.top / (RUNWAY * vh);
      else {
        const stage = el.querySelector('.work__stage')?.getBoundingClientRect() || r;
        v = (vh - stage.top) / (vh * 0.95);
      }
      p.current = Math.max(p.current, Math.min(1, Math.max(0, v))); // no retrocede
      el.dataset.scVerifyState = `encendido ${Math.round(p.current * 100)}%`;
      if (p.current >= 1 && el.classList.contains('is-pinned')) unpin();
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    const setMode = () => { el.classList.toggle('is-pinned', desk.matches && !done); on(); };
    setMode();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    desk.addEventListener('change', setMode);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      desk.removeEventListener('change', setMode);
    };
  }, [ref]);
  return p;
}

/**
 * Sección Proyectos: el portátil 3D a la izquierda (a pantalla completa de la sección) y a la derecha la lista de
 * programas. Abrir un programa lo muestra en la pantalla del portátil; elegir una skill vuelve al editor de código.
 */
// En /lab (web de Astro): lab = true quita la pista del encendido (el portátil arranca solo) y list trae los proyectos de
// la colección de Markdown (src/content/proyectos/) en lugar de los de profile.js.
export default function Projects({ lab = false, list }) {
  const projects = list ?? PROFILE_PROJECTS;
  const [skill, setSkill] = useState(SKILLS[0]);
  const [exploded, setExploded] = useState(false);
  const [open, setOpen] = useState(null); // índice del proyecto abierto en la pantalla, o null
  const pickSkill = useCallback((s) => { setSkill(s); setOpen(null); }, []);
  const toggle = useCallback((i) => setOpen((v) => (v === i ? null : i)), []);

  const runwayRef = useRef(null);
  const bootRef = useBootRunway(runwayRef);

  return (
    // Pista del encendido (el pico, scroll-craft 25/11/2026): en escritorio la sección queda fijada (sticky) durante
    // RUNWAY pantallas de scroll mientras el portátil arranca; en móvil arranca a medida que entra en la pantalla
    <div ref={lab ? null : runwayRef} className={lab ? 'lab-laptop' : 'boot-runway'} data-sc-act="pin" data-sc-verify-state="">
    <section id="proyectos" className={`work${exploded ? ' work--exploded' : ''}`}>
      <div id="skills" className="work__stage">
        <h2 className="sr-only">Skills</h2>
        <Laptop3D
          skill={skill} onPickSkill={pickSkill} onExplodedChange={setExploded} bootRef={lab ? undefined : bootRef}
          project={open == null ? null : { ...projects[open], file: `${slugOf(projects[open])}.app` }}
        />
      </div>

      <div className="container work__panel">
        <div className="work__col">
          <div className="work__head">
            <div className="section__head">
              {/* Sin el kicker "// proyectos" (Jhon lo quitó el 24/11/2026) */}
              <h2>Programas instalados</h2>
            </div>
          </div>
          <Programs open={open} onToggle={toggle} projects={projects} />
        </div>
      </div>
    </section>
    </div>
  );
}
