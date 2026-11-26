import { useEffect, useRef } from 'react';
import { education, profile } from '../data/profile';
import './Education.css';

/*
 * Formación como MAPA DE NIVELES (Jhon, 26/11/2026, opción F: "como los juegos de la consola de la mascota").
 * Cada etapa es un nivel: una ficha con volumen (como los módulos de Contacto) sobre un camino que serpentea hacia
 * abajo; la tarjeta de cada nivel va a un lado, alternando. Orden de juego: primero los niveles SUPERADOS
 * (certificados, en el orden de profile.js), después el NIVEL ACTUAL (lo que dice "presente") y al final la
 * próxima versión, BLOQUEADA (prácticas, si profile.available). La cabeza de la mascota es la ficha del jugador:
 * cuando un nivel pasa la mitad de la ventana, SALTA hasta él, nivel a nivel, con un arco (animación por tiempo, no
 * ligada al scroll, que daba sensación de lag) y el camino se enciende detrás de ella. Subiendo, salta hacia atrás.
 * El camino es un SVG que se calcula con las posiciones reales de las fichas (ResizeObserver), así la maqueta
 * es solo CSS. Con "reducir movimiento": sin saltos, en el nivel actual y con todo a la vista.
 */

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
const Check = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
const Lock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** Cabeza de la mascota (render del modelo de Blender, en oscuro y en claro: public/img/mascota-cabeza-*.webp, 320 × 272). */
const BASE = import.meta.env.BASE_URL;
const Bot = () => (
  <>
    <img className="track__bot-img track__bot-img--dark" src={`${BASE}img/mascota-cabeza-oscuro.webp`} width="48" height="41" alt="" decoding="async" />
    <img className="track__bot-img track__bot-img--light" src={`${BASE}img/mascota-cabeza-claro.webp`} width="48" height="41" alt="" decoding="async" />
  </>
);

const isCurrent = (e) => /presente/i.test(e.date);
// Orden de juego: superados → actual (ver arriba)
const LEVELS = [...education.filter((e) => !isCurrent(e)), ...education.filter(isCurrent)];

// Jhon (26/11/2026): "va muy rápido y termina en una" → salta de UN nivel en UN nivel (nunca varios en un arco),
// cada salto más pausado y con una pequeña parada al aterrizar; y el nivel se alcanza al pasar la mitad de la ventana.
const JUMP_T = 0.72; // s por salto
const LAND_PAUSE = 220; // ms quieta en cada nivel antes de seguir saltando
const LINE = 0.5; // un nivel se alcanza cuando su ficha sube por encima de esta fracción de la ventana
const SEEN = 0.88; // la tarjeta se descubre al asomar (su ficha por encima de esta fracción)
const HOP = 34; // alto del arco del salto (px)
const BOT_Y = 60; // la cabeza (41 px) queda de pie sobre la ficha (44 px, centrada en el camino)
const START = 64; // el camino empieza esta distancia por encima del primer nivel (casilla de salida)
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function Education() {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const svg = map.querySelector('.map__path');
    const base = svg.querySelector('.map__road');
    const lit = svg.querySelector('.map__lit');
    const bot = map.querySelector('.track__bot');
    const startEl = map.querySelector('.map__start');
    const nodes = [...map.querySelectorAll('.map__level')];
    const played = nodes.filter((n) => !n.classList.contains('is-locked'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    let stops = []; // longitud del camino en cada nivel (y en la salida, índice 0)
    let total = 1, at = 0, target = 0, jump = null, raf = 0, sraf = 0, wait = 0;

    // Centro de cada ficha dentro del mapa (offsetLeft/Top: sin transformaciones de por medio)
    const center = (n) => {
      const t = n.querySelector('.map__tile');
      let x = t.offsetWidth / 2, y = t.offsetHeight / 2, el = t;
      while (el && el !== map) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      return { x, y };
    };

    const measure = () => {
      const pts = nodes.map(center);
      const start = { x: pts[0].x, y: pts[0].y - START };
      const all = [start, ...pts];
      // Curvas en S entre fichas: salen y llegan en vertical
      let d = `M${start.x} ${start.y}`;
      const lens = [0];
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(probe);
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1], b = all[i], my = (a.y + b.y) / 2;
        d += ` C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
        probe.setAttribute('d', d);
        lens.push(probe.getTotalLength());
      }
      probe.remove();
      svg.setAttribute('viewBox', `0 0 ${map.offsetWidth} ${map.offsetHeight}`);
      startEl.style.transform = `translate(${start.x}px, ${start.y}px)`;
      base.setAttribute('d', d);
      lit.setAttribute('d', d);
      total = lens[lens.length - 1] || 1;
      stops = lens.slice(0, played.length + 1); // la salida y los niveles jugables (el bloqueado no)
      target = reached();
      at = target; jump = null; clearTimeout(wait); wait = 0;
      place(stops[at], 0);
    };

    // Último nivel cuya ficha ya pasó la línea LINE de la ventana (0 = la salida). De paso abre la cortinilla de las
    // tarjetas que ya asoman (SEEN: al entrar en la vista, sin esperar a la mascota, para que no haya huecos vacíos)
    const reached = () => {
      if (reduce.matches) return played.length;
      const top = map.getBoundingClientRect().top, line = window.innerHeight * LINE;
      nodes.forEach((n) => { if (top + center(n).y <= window.innerHeight * SEEN) n.classList.add('is-seen'); });
      let k = 0;
      played.forEach((n, i) => { if (top + center(n).y <= line) k = i + 1; });
      return k;
    };

    // Pone la ficha del jugador en la longitud L del camino (con `lift` px de arco) y enciende el camino hasta ahí
    const place = (L, lift) => {
      const p = base.getPointAtLength(Math.max(0, Math.min(total, L)));
      bot.style.transform = `translate(${(p.x - 24).toFixed(1)}px, ${(p.y - BOT_Y - lift).toFixed(1)}px)`;
      lit.style.strokeDasharray = `${L.toFixed(1)} ${total + 10}`;
      nodes.forEach((n, i) => n.classList.toggle('is-lit', i < played.length && L >= stops[i + 1] - 0.5));
    };

    const frame = (now) => {
      raf = 0;
      if (!jump) return;
      const t = Math.min(1, (now - jump.t0) / jump.dur);
      const k = ease(t);
      place(jump.from + (jump.to - jump.from) * k, Math.sin(Math.PI * t) * HOP * jump.hop);
      if (t < 1) { raf = requestAnimationFrame(frame); return; }
      at = jump.toIdx; jump = null;
      bot.classList.remove('is-jumping');
      if (target !== at) wait = setTimeout(() => { wait = 0; go(target); }, LAND_PAUSE); // falta camino: sigue, nivel a nivel
    };

    const go = (idx) => {
      if (idx === at || jump || wait) return;
      const next = at + Math.sign(idx - at); // un solo nivel por salto
      jump = { from: stops[at], to: stops[next], toIdx: next, t0: performance.now(), dur: JUMP_T * 1000, hop: 1 };
      bot.classList.add('is-jumping');
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      if (sraf) return;
      sraf = requestAnimationFrame(() => {
        sraf = 0;
        const k = reached();
        if (k === target) return;
        target = k;
        if (reduce.matches) { at = k; place(stops[k], 0); return; }
        go(k);
      });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(map);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduce.addEventListener('change', measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduce.removeEventListener('change', measure);
      cancelAnimationFrame(raf); cancelAnimationFrame(sraf); clearTimeout(wait);
    };
  }, []);

  return (
    <section id="formacion" className="container section section--tight">
      <div className="section__head">
        <h2>Historial de versiones</h2>
      </div>
      <div className="map" ref={mapRef}>
        <svg className="map__path" aria-hidden="true" preserveAspectRatio="none">
          <path className="map__road" />
          <path className="map__lit" />
        </svg>
        <span className="map__start mono" aria-hidden="true" />
        <ol className="map__list">
          {LEVELS.map((e, i) => {
            const current = isCurrent(e);
            const cert = e.type === 'certificado';
            return (
              <li key={e.title} className={`map__level${current ? ' is-current' : ' is-done'}`}>
                <span className="map__tile" aria-hidden="true">{current ? i + 1 : <Check />}</span>
                <div className="map__card">
                  <div className="track__meta">
                    <span className="track__kind">{cert ? <Badge /> : <Cap />}nivel {i + 1} · {cert ? 'certificado' : 'carrera'}</span>
                    <span className="mono track__date">{e.date}</span>
                  </div>
                  <strong>{e.title}</strong>
                  <span className="track__place">{e.place}</span>
                  {current
                    ? <span className="track__now"><i aria-hidden="true" />En curso · nivel actual</span>
                    : <span className="track__now track__now--done"><Check />superado</span>}
                </div>
              </li>
            );
          })}
          {profile.available && (
            <li className="map__level is-locked">
              <span className="map__tile" aria-hidden="true"><Lock /></span>
              <div className="map__card map__card--next">
                <div className="track__meta">
                  <span className="track__kind"><Flag />nivel {LEVELS.length + 1} · próxima versión</span>
                  <span className="mono track__date">bloqueado</span>
                </div>
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
