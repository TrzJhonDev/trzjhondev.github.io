import { useEffect, useRef } from 'react';
import Console, { consoleCtl } from '../Mascot/Console';
import { MascotEngine } from './engine';
import './Mascot3D.css';

// Mascota 3D (modelo de Blender con Three.js). Misma interfaz que Mascot:
// variant ('hero' en la portada; 'mini' en la esquina y en Contacto), ptr (puntero), look (mirada pedida por la guía),
// cmd (órdenes: 'cheer'), onAct ('wave' | 'startle' | 'laugh'), paused y greet (la pequeña saluda al aparecer).
// La consola del pecho es la de siempre (Console.jsx), montada oculta: el motor copia su pantalla en el modelo. Solo la
// de la portada ('hero') juega: recibe las pulsaciones de la pantalla, la cruz y A/B (consoleCtl) y teclea con datos.
// Se carga en diferido (Portrait.jsx, MascotAuto.jsx); mientras tanto (o si falla WebGL) se ve la mascota CSS.

import { MASCOT_URL as MODEL } from '../../lib/boot';

export default function Mascot3D({ variant = 'hero', games, greet = false, ptr, look, cmd, section, onAct, paused = false, stage = false, sleeping = false, loading = false, onFrame, onReady, onError }) {
  const host = useRef(null);
  const ghost = useRef(null);
  const link = useRef({});
  const engine = useRef(null);
  const cb = useRef({});
  cb.current = { onAct, onReady, onError, onFrame };
  const hero = variant !== 'mini';

  useEffect(() => {
    let e;
    try {
      e = new MascotEngine(host.current, {
        variant, greet, ptr, look, cmd, section, link, ctl: hero && games !== false ? consoleCtl : null, // games={false}: la pantalla del pecho no abre los juegos (viven en /lab)
        // section: ref con la sección que tienes delante (pose de la pequeña)
        onAct: (t) => cb.current.onAct?.(t),
        // Escenario de Contacto: el director mueve la mascota en cada fotograma (Contact.jsx + lib/contactStage.js)
        // Pantalla de carga: empieza dormida (PLAN-PANTALLA-CARGA.md)
        sleeping,
        stage, onFrame: stage ? (dt, now) => cb.current.onFrame?.(dt, now) : null,
        consoleEls: () => {
          const g = ghost.current;
          return g && { canvas: g.querySelector('canvas'), text: g.querySelector('.mconsole__text'), hud: g.querySelector('.mc-hud') };
        },
      });
    } catch (err) { cb.current.onError?.(err); return undefined; } // sin WebGL: se queda la mascota CSS
    engine.current = e;
    if (import.meta.env.DEV) (window.__mascots ||= new Set()).add(e); // para depurar desde la consola
    // Solo avisa el motor vivo (en desarrollo React monta dos veces y el primero se destruye a mitad de carga)
    e.load(MODEL)
      .then(() => { if (engine.current === e) cb.current.onReady?.(e); })
      .catch((err) => { if (engine.current === e) cb.current.onError?.(err); });
    return () => { e.dispose(); engine.current = null; window.__mascots?.delete(e); };
    // variant y greet no cambian durante la vida de una mascota
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptr, look, cmd]);

  useEffect(() => { engine.current?.setPaused(paused); }, [paused]);
  // Consola del pecho en modo CARGANDO / LISTO mientras dura la pantalla de carga
  // Con "reducir movimiento" el motor no tiene bucle: hay que volver a pintar el pecho, o se quedaba en CARGANDO
  useEffect(() => {
    link.current.loading?.(loading);
    const id = requestAnimationFrame(() => engine.current?.renderOnce());
    return () => cancelAnimationFrame(id);
  }, [loading]);

  const onKey = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); engine.current?.react(); } };
  const label = hero ? 'Mascota robot de la portada. Pulsa para que reaccione.' : 'Mascota robot. Pulsa para que reaccione.';

  return (
    <div ref={host} className={`mascot3d mascot3d--${stage ? 'stage' : variant}`} role="button" tabIndex={0} aria-label={label} onKeyDown={onKey}>
      {/* Consola real, invisible: da los juegos, los datos y las teclas; su pantalla se pinta en el pecho del modelo */}
      <div ref={ghost} className="mascot mascot3d__ghost" aria-hidden="true"><Console variant={variant} link={link} games={games} /></div>
    </div>
  );
}
