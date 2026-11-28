import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import '../components/Mascot/Mascot.css';

/**
 * Mascota de la portada en la web de Astro (isla de React, client:only). Sin pantalla de carga a pantalla completa:
 * el texto se lee al instante y la mascota empieza DORMIDA en su sitio (la misma imagen del motor 3D,
 * public/img/mascota-dormida-*.webp, que Astro pinta como fallback antes de que llegue esta isla). Cuando el modelo
 * 3D está listo se funde con la imagen (mismo encuadre 3:4), despierta y saluda (una vez por sesión, lo decide el motor).
 * Sigue al puntero en escritorio; los juegos de la consola del pecho viven en /lab (games={false}).
 */
const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function HeroMascot() {
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const fine = window.matchMedia('(min-width: 900px) and (hover: hover)');
    const move = (ev) => { if (fine.matches) { ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY; } };
    const leave = () => { ptr.current.mx = -1e4; ptr.current.my = -1e4; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const onReady = (e) => {
    setReady(true);
    // Primero se funde con la imagen dormida (0,5 s), luego despierta y, al terminar, saluda
    timers.current.push(setTimeout(() => { if (e.sleeping) e.wake(); }, 520));
    timers.current.push(setTimeout(() => e.welcome(), 2100));
  };

  return (
    <div className={`hero-bot${ready ? ' is-ready' : ''}`}>
      <Sleeping />
      {!failed && (
        <Suspense fallback={null}>
          <Mascot3D games={false} sleeping ptr={ptr} onReady={onReady} onError={() => setFailed(true)} />
        </Suspense>
      )}
    </div>
  );
}

/** La imagen del robot dormido, del tema actual (también la pinta Astro como fallback mientras llega la isla). */
export function Sleeping() {
  return (
    <>
      <img className="hero-bot__img hero-bot__img--dark" src={`${BASE}/img/mascota-dormida-oscuro.webp`} alt="" width="680" height="907" decoding="async" fetchpriority="high" />
      <img className="hero-bot__img hero-bot__img--light" src={`${BASE}/img/mascota-dormida-claro.webp`} alt="" width="680" height="907" decoding="async" />
    </>
  );
}
