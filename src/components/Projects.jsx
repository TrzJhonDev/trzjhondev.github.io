import { useEffect, useRef, useState } from 'react';
import { projects } from '../data/profile';
import { SKILLS } from '../data/skills';
import { externalLink } from '../lib/links';
import Laptop3D from './Laptop3D/Laptop3D';

// Segundos que tarda cada tarjeta en recorrer la columna: cuanto mayor, más lento
const SECONDS_PER_CARD = 14;

function Card({ p }) {
  return (
    <article className="card">
      {p.image
        ? <img className="card__img" src={p.image} alt={`Captura de ${p.title}`} loading="lazy" />
        : <div className="card__img card__img--empty">[CAPTURA DEL PROYECTO]</div>}
      <h3>{p.title}</h3>
      <p>{p.description}</p>
      <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
      <div className="card__links">
        <a {...externalLink(p.code)}>Código</a>
        <a {...externalLink(p.demo)}>Demo</a>
      </div>
    </article>
  );
}

/**
 * Movimiento del carrusel (un único bucle rAF que escribe `transform`, sin re-renderizar):
 * - solo, baja despacio (una copia cada `dur` segundos) mientras no esté pausado, con el puntero encima ni con foco dentro;
 * - con el puntero encima, la rueda del ratón (o el trackpad) mueve las tarjetas en vez de la página:
 *   rueda hacia abajo = las tarjetas suben, como en una lista normal. El desplazamiento se suaviza por tiempo.
 * La posición se envuelve con el alto de una copia, así que no tiene fin en ningún sentido.
 * Con "reducir movimiento" no hace nada: el CSS lo convierte en una lista con scroll nativo.
 */
function useCarousel(ref, { dur }) {

  useEffect(() => {
    const box = ref.current;
    if (!box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const track = box.querySelector('.carousel__track');
    const set = box.querySelector('.carousel__set');

    let setH = set.offsetHeight || 1;
    let y = 0, target = 0, hover = false, focus = false, raf = 0, prev = performance.now(), onScreen = true;
    const ro = new ResizeObserver(() => { setH = set.offsetHeight || 1; });
    ro.observe(set);
    // Rendimiento: el bucle solo corre mientras el carrusel está en pantalla (y la pestaña visible)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen && !raf) { prev = performance.now(); raf = requestAnimationFrame(frame); }
    });
    io.observe(box);

    const frame = (now) => {
      raf = 0;
      if (!onScreen) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!hover && !focus) {
        const step = (setH / dur) * dt;
        y += step;
        target += step;
      }
      y += (target - y) * (1 - Math.exp(-dt * 12));
      const off = ((y % setH) + setH) % setH;
      track.style.transform = `translateY(${off - setH}px)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // gesto horizontal: no es para el carrusel
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? box.clientHeight : 1;
      target -= e.deltaY * unit;
    };
    const enter = () => { hover = true; };
    const leave = () => { hover = false; };
    const fin = () => { focus = true; };
    const fout = (e) => { if (!box.contains(e.relatedTarget)) focus = false; };

    box.addEventListener('wheel', onWheel, { passive: false });
    box.addEventListener('pointerenter', enter);
    box.addEventListener('pointerleave', leave);
    box.addEventListener('focusin', fin);
    box.addEventListener('focusout', fout);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      box.removeEventListener('wheel', onWheel);
      box.removeEventListener('pointerenter', enter);
      box.removeEventListener('pointerleave', leave);
      box.removeEventListener('focusin', fin);
      box.removeEventListener('focusout', fout);
      track.style.transform = '';
    };
  }, [ref, dur]);
}

/**
 * Progreso del encendido con el scroll (0 a 1) en un ref, sin re-renderizar.
 * Escritorio (≥ 900 px y con movimiento): la pista mide la sección + RUNWAY pantallas y la sección va sticky; p es lo
 * recorrido de ese extra. Móvil: sin fijar; p va de 0 cuando el escenario asoma por abajo a 1 cuando su borde superior
 * llega arriba. Con "reducir movimiento" no hay pista (el portátil ya sale encendido: useLaptop no hace la entrada).
 */
const RUNWAY = 2.4;
function useBootRunway(ref) {
  const p = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const desk = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    let raf = 0;
    const read = () => {
      raf = 0;
      const vh = window.innerHeight, r = el.getBoundingClientRect();
      let v;
      if (desk.matches) v = -r.top / (RUNWAY * vh);
      else {
        const stage = el.querySelector('.work__stage')?.getBoundingClientRect() || r;
        v = (vh - stage.top) / (vh * 0.95);
      }
      p.current = Math.max(p.current, Math.min(1, Math.max(0, v))); // no retrocede
      el.dataset.scVerifyState = `encendido ${Math.round(p.current * 100)}%`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    const setMode = () => { el.classList.toggle('is-pinned', desk.matches); on(); };
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
 * Sección Proyectos: el portátil 3D a la izquierda (a pantalla completa de la sección) y a la derecha
 * un carrusel vertical que circula despacio de arriba hacia abajo, en bucle, y se mueve con la rueda
 * cuando el puntero está encima (ver useCarousel).
 * La lista se repite (`copies` veces) y la posición se envuelve con el alto de una copia, así que el salto no se nota.
 * Solo la primera copia es accesible; se pausa con el puntero, con el foco y con el botón.
 */
export default function Projects() {
  const [skill, setSkill] = useState(SKILLS[0]);
  const [exploded, setExploded] = useState(false);
  const copies = projects.length < 3 ? 4 : 2;
  const carouselRef = useRef(null);
  useCarousel(carouselRef, { dur: projects.length * SECONDS_PER_CARD });

  const runwayRef = useRef(null);
  const bootRef = useBootRunway(runwayRef);

  return (
    // Pista del encendido (el pico, scroll-craft 25/11/2026): en escritorio la sección queda fijada (sticky) durante
    // RUNWAY pantallas de scroll mientras el portátil arranca; en móvil arranca a medida que entra en la pantalla
    <div ref={runwayRef} className="boot-runway" data-sc-act="pin" data-sc-verify-state="">
    <section id="proyectos" className={`work${exploded ? ' work--exploded' : ''}`}>
      <div id="skills" className="work__stage">
        <h2 className="sr-only">Skills</h2>
        <Laptop3D skill={skill} onPickSkill={setSkill} onExplodedChange={setExploded} bootRef={bootRef} />
      </div>

      <div className="container work__panel">
        <div className="work__col">
          <div className="work__head">
            <div className="section__head">
              {/* Sin el kicker "// proyectos" (Jhon lo quitó el 24/11/2026) */}
              <h2>Cosas que he construido</h2>
            </div>
            {/* Sin botón de Pausar (Jhon lo quitó el 24/11/2026): el carrusel se detiene con el puntero encima o con el foco dentro */}
          </div>

          <div
            ref={carouselRef}
            className="carousel"
            role="region"
            aria-label="Proyectos"
            tabIndex={-1}
          >
            <div className="carousel__track">
              {Array.from({ length: copies }, (_, c) => (
                <ul key={c} className="carousel__set" {...(c > 0 ? { 'aria-hidden': 'true', inert: '' } : {})}>
                  {projects.map((p, i) => (
                    <li key={`${p.title}-${i}`}><Card p={p} /></li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
