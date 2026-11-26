import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { boot } from '../lib/boot';
import { clamp } from '../lib/math3d';
import { DESKTOP } from './Laptop3D/useLayout';
import { Bubble } from './Mascot/Bubble';
import { consoleCtl } from './Mascot/Console';
import { useGuide } from './Mascot/Guide';
import Mascot from './Mascot/Mascot';
import './Portrait.css';

// Mascota 3D (Blender + Three.js, decidido por Jhon el 24/11/2026): se carga aparte; la CSS se ve mientras tanto o si falla
const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));

/**
 * Parte derecha de la portada, en capas dentro de una escena CSS 3D (sin librerías):
 *   aura (al fondo) → suelo con cuadrícula → mascota robot (Mascot).
 * Con el puntero la escena se inclina un poco y cada capa se desplaza distinto (parallax); la mascota además
 * mira y gira la cabeza hacia el puntero.
 * Por debajo de DESKTOP (modo ligero) no hay suelo ni parallax y la mascota no sigue al puntero.
 */
export default function Portrait() {
  const tiltRef = useRef(null);
  const auraRef = useRef(null);
  const guide = useGuide(); // mensajes y mirada que pide la guía (ver Mascot/Guide.jsx)
  // Estado compartido con la mascota: inclinación suavizada (x, y en −1..1) y puntero (px de pantalla)
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  // 'loading' → se ve la mascota CSS; 'ready' → la 3D; 'failed' (sin WebGL o sin modelo) → se queda la CSS
  const [m3d, setM3d] = useState('loading');

  // ── Pantalla de carga (PLAN-PANTALLA-CARGA.md) ──────────────────────────────────────────────────────────
  // Hay UN solo motor 3D. Se dibuja dentro de `holder` (un div que no gestiona React: la mascota va en un portal),
  // y ese div viaja: empieza en #boot (dormida), y al terminar vuela a su sitio en la portada (.portrait__slot).
  // Fases: 'boot' (dormida, CARGANDO) → 'wake' (LISTO, despierta) → 'landed' (en su sitio; saluda).
  const booting = useRef(boot.active);
  const [phase, setPhase] = useState(booting.current ? 'boot' : 'landed');
  const [holder] = useState(() => { const d = document.createElement('div'); d.className = 'portrait__holder'; return d; });
  const slotRef = useRef(null);
  const engineRef = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const host = booting.current ? document.querySelector('#boot .boot__gl') : slotRef.current;
    (host || slotRef.current).appendChild(holder);
    boot.set('app', 1); // la página ya está montada (y maquetada, aunque oculta)
  }, [holder]);

  useEffect(() => {
    if (!booting.current) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const bootEl = document.getElementById('boot');
    const removeBoot = (ms) => window.setTimeout(() => bootEl?.remove(), ms);

    // Aterrizar: la página aparece y la mascota va a su sitio (volando si se puede; si no, directamente)
    const land = () => {
      const e = engineRef.current, slot = slotRef.current;
      const A = holder.getBoundingClientRect();
      boot.finish(); // fuera .is-booting: la página se ve (y los titulares entran por renglones)
      if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
      const B = slot.getBoundingClientRect();
      const vis = Math.max(0, Math.min(B.bottom, window.innerHeight) - Math.max(B.top, 0)) / (B.height || 1);
      const fly = e && !reduce.matches && !boot.skipped && vis > 0.5 && A.width > 0;
      bootEl?.classList.add('is-leaving');
      const settle = () => {
        holder.removeAttribute('style');
        slot.appendChild(holder);
        e?.resize();
        if (e?.sleeping) e.wake();
        setPhase('landed');
        e?.welcome();
      };
      if (!fly) { settle(); removeBoot(600); return; }
      // FLIP: se coloca ya en su sitio final (B), con la transformación que la deja donde estaba (A), y se anima a cero.
      // En coordenadas de la PÁGINA (absolute + scroll), no de la ventana (Jhon, 26/11/2026: si hacía scroll rápido al
      // cargar, la mascota se quedaba flotando sobre Proyectos con "LISTO" en el pecho): si la página se mueve durante el
      // vuelo, la mascota se mueve con ella hacia su sitio. Y si el usuario hace scroll, aterriza al instante (scroll → end).
      Object.assign(holder.style, {
        position: 'absolute', left: `${B.left + window.scrollX}px`, top: `${B.top + window.scrollY}px`, width: `${B.width}px`, height: `${B.height}px`, zIndex: 1001,
        transformOrigin: '50% 50%',
        transform: `translate(${A.left + A.width / 2 - (B.left + B.width / 2)}px, ${A.top + A.height / 2 - (B.top + B.height / 2)}px) scale(${A.width / B.width})`,
      });
      document.body.appendChild(holder);
      e.resize();
      holder.getBoundingClientRect(); // fija el punto de partida antes de animar
      holder.style.transition = 'transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)';
      holder.style.transform = 'none';
      let done = false;
      const y0 = window.scrollY;
      const onEnd = (ev) => { if (ev.target === holder && ev.propertyName === 'transform') end(); }; // no la de un hijo
      const onScroll = () => { if (Math.abs(window.scrollY - y0) > 2) end(); };
      const end = () => {
        if (done) return;
        done = true;
        holder.removeEventListener('transitionend', onEnd);
        window.removeEventListener('scroll', onScroll);
        settle();
        removeBoot(100);
      };
      holder.addEventListener('transitionend', onEnd);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.setTimeout(end, 1100);
    };

    // Despertar cuando todo está listo (o se saltó, o se agotó el tope): LISTO, se estira y, al terminar, aterriza
    const off = boot.on(() => {
      if (started.current || !boot.ready) return;
      started.current = true;
      const e = engineRef.current;
      if (!e || boot.skipped || reduce.matches) { land(); return; }
      setPhase('wake');
      e.wake();
      window.setTimeout(land, 1000);
    });
    return off;
  }, [holder]);
  const paused = guide ? !guide.heroVisible : false;

  // Acto 1 de scroll-craft (25/11/2026): al salir de la portada, tres planos se separan a ritmos distintos.
  // La luz (fondo) se queda atrás, la mascota (sujeto) va más despacio que el scroll y el suelo (delante) un poco más
  // rápido. Se usa la propiedad CSS translate, que se suma al transform que escribe la inclinación sin pisarlo.
  // Se recalcula solo al hacer scroll (rAF) y solo mientras la portada está en pantalla. Sin "reducir movimiento".
  useEffect(() => {
    const root = tiltRef.current?.closest('.portrait');
    if (!root) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const planes = [['.portrait__aura', 0.45], ['.mascot3d', 0.2], ['.portrait__tilt > .mascot', 0.2], ['.portrait__floor', -0.06]];
    let raf = 0;
    const paint = () => {
      raf = 0;
      const y = reduce.matches ? 0 : Math.min(window.scrollY, window.innerHeight);
      if (y > window.innerHeight) return;
      planes.forEach(([sel, rate]) => root.querySelectorAll(sel).forEach((el) => { el.style.translate = y ? `0 ${(y * rate).toFixed(1)}px` : ''; }));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    window.addEventListener('scroll', on, { passive: true });
    reduce.addEventListener?.('change', on);
    paint();
    return () => { window.removeEventListener('scroll', on); reduce.removeEventListener?.('change', on); cancelAnimationFrame(raf); };
  }, [m3d]);

  // Parallax: la inclinación (−1..1) se suaviza con requestAnimationFrame y solo corre mientras el puntero se mueve.
  // IMPORTANTE (rendimiento): las transformaciones se escriben directamente (style.transform) y NO con variables CSS
  // (--px / --py) en .portrait__tilt: una variable heredada que cambia obliga a recalcular el estilo de todos los
  // descendientes (más de 2.000 elementos de la mascota: unos 8 ms por fotograma frente a 0,1 ms), y eso daba tirones al seguir el ratón.
  useEffect(() => {
    const el = tiltRef.current, aura = auraRef.current;
    const host = el?.closest('.hero');
    if (!el || !aura || !host) return undefined;
    const mq = window.matchMedia(`(min-width: ${DESKTOP}px) and (prefers-reduced-motion: no-preference)`);
    const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
    let raf = 0, last = 0, rect = null, rectAt = 0;
    const paint = () => {
      el.style.transform = `rotateY(${(cur.x * 7).toFixed(3)}deg) rotateX(${(cur.y * -5).toFixed(3)}deg)`;
      aura.style.transform = `translate3d(calc(-50% + ${(cur.x * -16).toFixed(2)}px), calc(-50% + ${(cur.y * -10).toFixed(2)}px), -120px)`;
    };
    const step = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const k = 1 - Math.exp(-dt * 11); // suavizado por tiempo (no por fotograma): igual de ágil a 60 que a 144 Hz
      cur.x += (tgt.x - cur.x) * k;
      cur.y += (tgt.y - cur.y) * k;
      paint();
      ptr.current.x = cur.x; ptr.current.y = cur.y;
      if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.002) raf = requestAnimationFrame(step);
      else { raf = 0; last = 0; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const move = (ev) => {
      if (ev.pointerType !== 'mouse' || !mq.matches) return;
      const now = performance.now();
      // el rectángulo de la caja (sin transformar) se guarda un momento: leerlo en cada evento obligaba a recalcular el layout
      if (!rect || now - rectAt > 250) { rect = el.parentElement.getBoundingClientRect(); rectAt = now; }
      tgt.x = clamp((ev.clientX - (rect.left + rect.width / 2)) / (window.innerWidth * 0.5), -1, 1);
      tgt.y = clamp((ev.clientY - (rect.top + rect.height / 2)) / (window.innerHeight * 0.5), -1, 1);
      ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY;
      kick();
    };
    const leave = () => { tgt.x = 0; tgt.y = 0; ptr.current.mx = -1e4; ptr.current.my = -1e4; kick(); };
    // Si la ventana pasa a modo ligero (o "reducir movimiento"), se quitan las transformaciones y manda el CSS
    const onMq = () => { if (!mq.matches) { el.style.transform = ''; aura.style.transform = ''; cur.x = cur.y = tgt.x = tgt.y = 0; } };
    mq.addEventListener?.('change', onMq);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      mq.removeEventListener?.('change', onMq);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`portrait${guide && !guide.heroVisible ? ' is-away' : ''}`}>
      <div ref={tiltRef} className="portrait__tilt">
        <div ref={auraRef} className="portrait__aura" aria-hidden="true" />
        <div className="portrait__floor" aria-hidden="true" />

        {/* Mascota CSS: solo mientras carga la 3D o si no se puede usar. paused: mientras la pequeña está en la esquina */}
        {m3d !== 'ready' && phase === 'landed' && <Mascot ptr={ptr} look={guide?.lookRef} onAct={guide?.onAct} paused={paused} />}
      </div>

      {/* Mascota 3D, fuera de la escena inclinada (es su propio lienzo WebGL) */}
      {/* Sitio de la mascota 3D en la portada: aquí aterriza su lienzo (holder) al terminar la pantalla de carga */}
      <div ref={slotRef} className="portrait__slot" />
      {m3d !== 'failed' && createPortal(
        <Suspense fallback={null}>
          <Mascot3D ptr={ptr} look={guide?.lookRef} onAct={guide?.onAct} paused={paused}
            sleeping={booting.current} loading={phase === 'boot' ? true : phase === 'wake' ? 'done' : false}
            onReady={(e) => {
              engineRef.current = e; setM3d('ready');
              document.getElementById('boot')?.classList.add('has-gl'); // la imagen fija se funde con el 3D (mismo encuadre)
              // Llegó tarde (la pantalla de carga ya terminó por el tope o se saltó): despierta y saluda aquí mismo
              if (booting.current && boot.finished) { if (e.sleeping) e.wake(); e.welcome(); }
              boot.mascotReady();
            }}
            onError={() => { setM3d('failed'); boot.mascotReady(); }} />
        </Suspense>,
        holder,
      )}

      {/* Botón de la consola del pecho para teclado y lectores de pantalla (la consola 3D es aria-hidden).
          Invisible hasta que recibe el foco. */}
      <div className="console-a11y" role="group" aria-label="Consola de la mascota">
        <button type="button" className="btn btn--ghost" onClick={() => consoleCtl.open()}>
          Jugar en la consola (flechas o WASD, espacio, Esc para salir)
        </button>
      </div>

      {/* Globo de la mascota (plano, por encima de la escena 3D). Solo mientras esta mascota es la que se ve */}
      {guide?.heroVisible && guide.bubbleProps && <Bubble where="hero" {...guide.bubbleProps} />}
    </div>
  );
}
