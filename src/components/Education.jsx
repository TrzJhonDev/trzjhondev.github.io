import { useEffect, useRef } from 'react';
import { education, profile } from '../data/profile';
import './Education.css';

// Formación como una pista de circuito: un nodo (vía) por etapa. Al bajar, la pista se enciende
// y una mascota en miniatura la recorre. El bucle escribe estilos directos (sin re-renderizar).
// Con "reducir movimiento" la pista sale encendida entera y la mascota espera al final.

const Cap = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 9 12 4 2 9l10 5 10-5Z" /><path d="M6 11v5c3 2.5 9 2.5 12 0v-5" />
  </svg>
);
const Badge = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="9" r="6" /><path d="m9 14.5-1.5 7L12 19l4.5 2.5-1.5-7" />
  </svg>
);
const Flag = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" />
  </svg>
);

/**
 * Cabeza de la mascota en miniatura: render del modelo de Blender (blender/mascota.blend, cámara ortográfica de frente),
 * en oscuro y en claro (public/img/mascota-cabeza-*.webp, 320 × 272: el doble de 40 × 34 para que se vea nítida).
 * El CSS muestra la del tema actual. Un 3D en vivo para 34 px sería un gasto inútil.
 */
const BASE = import.meta.env.BASE_URL;
const Bot = () => (
  <>
    <img className="track__bot-img track__bot-img--dark" src={`${BASE}img/mascota-cabeza-oscuro.webp`} width="40" height="34" alt="" decoding="async" />
    <img className="track__bot-img track__bot-img--light" src={`${BASE}img/mascota-cabeza-claro.webp`} width="40" height="34" alt="" decoding="async" />
  </>
);

const isCurrent = (e) => /presente/i.test(e.date);

export default function Education() {
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rail = list.querySelector('.track__rail');
    const lit = list.querySelector('.track__lit');
    const bot = list.querySelector('.track__bot');
    const nodes = [...list.querySelectorAll('.track__node')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    let top = 0, len = 1, stops = [], raf = 0, last = -1;

    // Posiciones de las vías dentro de la lista (offsetTop: sin transformaciones de por medio)
    const measure = () => {
      const vias = nodes.map((n) => n.offsetTop + n.querySelector('.track__via').offsetTop + 8);
      top = vias[0];
      len = Math.max(1, vias[vias.length - 1] - top);
      stops = vias.map((v) => (v - top) / len);
      rail.style.top = `${top}px`;
      rail.style.height = `${len}px`;
      last = -1;
      paint();
    };

    const paint = () => {
      raf = 0;
      let p = 1;
      if (!reduce.matches) {
        // La pista llega hasta la línea del 62 % de la ventana (un solo getBoundingClientRect por fotograma)
        const r = list.getBoundingClientRect();
        p = Math.min(1, Math.max(0, (window.innerHeight * 0.62 - r.top - top) / len));
      }
      if (Math.abs(p - last) < 0.001) return;
      last = p;
      lit.style.transform = `scaleY(${p})`;
      bot.style.transform = `translateY(${top + p * len - 17}px)`;
      nodes.forEach((n, i) => {
        const lit = p >= stops[i] - 0.001;
        n.classList.toggle('is-lit', lit);
        if (lit) n.classList.add('is-seen'); // la cortinilla solo se abre (si subes no vuelve a taparse)
      });
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduce.addEventListener('change', measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduce.removeEventListener('change', measure);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="formacion" className="container section section--tight">
      <div className="section__head">
        {/* Sin el kicker "// formación" (pulido del 26/11/2026: Proyectos y Contacto ya no lo llevan; el título se basta) */}
        <h2>Historial de versiones</h2>
      </div>
      <div className="track" ref={listRef}>
        <div className="track__rail" aria-hidden="true"><i className="track__lit" /></div>
        <ol className="track__list">
          {education.map((e) => {
            const current = isCurrent(e);
            const cert = e.type === 'certificado';
            return (
              <li key={e.title} className={`track__node${current ? ' is-current' : ''}`}>
                <span className="track__via" aria-hidden="true" />
                <div className="track__card">
                  <div className="track__meta">
                    <span className="track__kind">{cert ? <Badge /> : <Cap />}{cert ? 'certificado' : 'carrera'}</span>
                    <span className="mono track__date">{e.date}</span>
                  </div>
                  <strong>{e.title}</strong>
                  <span className="track__place">{e.place}</span>
                  {current && <span className="track__now"><i aria-hidden="true" />En curso</span>}
                </div>
              </li>
            );
          })}
          {profile.available && (
            <li className="track__node track__node--next">
              <span className="track__via" aria-hidden="true" />
              <div className="track__card track__card--next">
                <span className="track__kind"><Flag />próxima versión</span>
                <strong>Prácticas pre‑profesionales<span className="cursor-blink" aria-hidden="true">_</span></strong>
              </div>
            </li>
          )}
        </ol>
        <span className="track__bot" aria-hidden="true"><Bot /></span>
      </div>
    </section>
  );
}
