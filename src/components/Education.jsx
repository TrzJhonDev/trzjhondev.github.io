import { useEffect, useRef } from 'react';
import { education, profile } from '../data/profile';
import './Education.css';

/*
 * Formación como MAPA DE NIVELES (Jhon, 26/11/2026, opción F: "como los juegos de la consola de la mascota").
 * Cada etapa es un nivel: una ficha con volumen (como los módulos de Contacto) sobre un camino que serpentea hacia
 * abajo; la tarjeta de cada nivel va a un lado, alternando. Orden de juego: primero los niveles SUPERADOS
 * (certificados, en el orden de profile.js), después el NIVEL ACTUAL (lo que dice "presente") y al final la
 * próxima versión, BLOQUEADA (prácticas, si profile.available). La cabeza de la mascota es la ficha del jugador:
 * cuando la punta del camino (que sigue a tu scroll) llega a un nivel, SALTA hasta él, nivel a nivel, con un arco (por tiempo, no
 * ligado al scroll, que daba sensación de lag). Subiendo, la punta retrocede y ella salta hacia atrás.
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

// Ritmo (Jhon, 26/11/2026): "va muy rápido y termina en una" → la mascota salta de UN nivel en UN nivel, pausada y
// con una parada al aterrizar. Y "el scroll no hace nada" → el CAMINO responde siempre: la línea azul sigue a tu scroll
// (la punta va a la altura de la mitad de la ventana, suavizada por tiempo); cuando la punta pasa una ficha, la
// mascota salta a ella y la ficha se hunde como una tecla con un pulso (.is-landed).
const JUMP_T = 0.72; // s por salto
const LAND_PAUSE = 220; // ms quieta en cada nivel antes de seguir saltando
const LINE = 0.5; // la punta del camino va a esta fracción de la ventana
const LINE_RATE = 7; // suavizado de la punta (1/s): sigue al scroll sin saltos ni retraso pesado
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
    let table = []; // muestras { y, L } del camino: de la altura en el mapa a la longitud recorrida (y crece con L)
    let total = 1, end = 0; // end: longitud del nivel actual (la punta no entra en el tramo bloqueado)
    let litL = 0, goalL = 0, at = 0, jump = null, raf = 0, wait = 0, last = 0;

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
      end = stops[stops.length - 1];
      table = [];
      for (let i = 0; i <= 240; i++) { const L = (end * i) / 240; table.push({ y: base.getPointAtLength(L).y, L }); }
      litL = goalL = goal();
      at = levelFor(litL); jump = null; clearTimeout(wait); wait = 0;
      setLit(litL); placeBot(stops[at], 0);
    };

    // Longitud del camino que corresponde a la línea LINE de la ventana. De paso abre la cortinilla de las tarjetas
    // que ya asoman (SEEN: al entrar en la vista, sin esperar a la mascota, para que no haya huecos vacíos)
    const goal = () => {
      if (reduce.matches) return end;
      const top = map.getBoundingClientRect().top, vh = window.innerHeight;
      nodes.forEach((n) => { if (!n.classList.contains('is-seen') && top + center(n).y <= vh * SEEN) n.classList.add('is-seen'); });
      const y = vh * LINE - top;
      if (y <= table[0].y) return 0;
      if (y >= table[table.length - 1].y) return end;
      let i = 1;
      while (table[i].y < y) i++;
      const a = table[i - 1], b = table[i];
      return a.L + ((y - a.y) / Math.max(0.001, b.y - a.y)) * (b.L - a.L);
    };
    // Nivel alcanzado por la punta del camino (0 = la salida)
    const levelFor = (L) => { let k = 0; for (let i = 1; i < stops.length; i++) if (L >= stops[i] - 0.5) k = i; return k; };

    const setLit = (L) => { lit.style.strokeDasharray = `${L.toFixed(1)} ${total + 10}`; };
    // La ficha del jugador en la longitud L del camino (con `lift` px de arco); los niveles por los que ya pasó, encendidos
    const placeBot = (L, lift) => {
      const p = base.getPointAtLength(Math.max(0, Math.min(total, L)));
      bot.style.transform = `translate(${(p.x - 24).toFixed(1)}px, ${(p.y - BOT_Y - lift).toFixed(1)}px)`;
      nodes.forEach((n, i) => n.classList.toggle('is-lit', i < played.length && L >= stops[i + 1] - 0.5));
    };
    // Al aterrizar: la ficha se hunde como una tecla y suelta un pulso; la cabeza se aplasta un instante
    const land = (idx) => {
      const n = played[idx - 1];
      for (const el of [n, bot]) {
        if (!el) continue;
        el.classList.remove('is-landed');
        void el.offsetWidth; // reinicia la animación
        el.classList.add('is-landed');
      }
    };

    const loop = (now) => {
      raf = 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      // Punta del camino: sigue al scroll, suavizada por tiempo
      litL += (goalL - litL) * (1 - Math.exp(-dt * LINE_RATE));
      if (Math.abs(goalL - litL) < 0.3) litL = goalL;
      setLit(litL);
      // La mascota: un salto por nivel hacia donde ha llegado la punta
      const want = levelFor(litL);
      if (!jump && !wait && want !== at) {
        const next = at + Math.sign(want - at);
        jump = { from: stops[at], to: stops[next], toIdx: next, t0: now, dur: JUMP_T * 1000 };
        bot.classList.add('is-jumping');
      }
      if (jump) {
        const t = Math.min(1, (now - jump.t0) / jump.dur);
        placeBot(jump.from + (jump.to - jump.from) * ease(t), Math.sin(Math.PI * t) * HOP);
        if (t >= 1) {
          at = jump.toIdx; jump = null;
          bot.classList.remove('is-jumping');
          land(at);
          wait = setTimeout(() => { wait = 0; kick(); }, LAND_PAUSE);
        }
      }
      if (jump || litL !== goalL) raf = requestAnimationFrame(loop);
      else last = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const onScroll = () => {
      if (reduce.matches) return;
      goalL = goal();
      kick();
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
      cancelAnimationFrame(raf); clearTimeout(wait);
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
