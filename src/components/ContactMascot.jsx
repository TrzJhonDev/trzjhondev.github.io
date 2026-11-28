import { Suspense, lazy, useRef } from 'react';
import '../components/Mascot/Mascot.css';

/**
 * Mascota de Contacto, "la cartera" (opción C1, elegida por Jhon el 27/11/2026; isla client:visible: solo se carga al
 * llegar). La misma mascota 3D: sigue el puntero, saluda con la mano la primera vez que aparece y CELEBRA cuando envías
 * el formulario (index.astro lanza el evento `mascota:celebrar`). Sin juegos en el pecho. Mientras se ve, la mascota
 * pequeña de la esquina se aparta (MiniMascot observa `[data-contact-bot]`).
 */
const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));

export default function ContactMascot() {
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  const onReady = (e) => {
    const move = (ev) => { ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('mascota:celebrar', () => e.play('celebrar'));
    e.play('hola');
  };
  return (
    <div className="contact-bot">
      <Suspense fallback={null}>
        <Mascot3D games={false} ptr={ptr} onReady={onReady} />
      </Suspense>
    </div>
  );
}
