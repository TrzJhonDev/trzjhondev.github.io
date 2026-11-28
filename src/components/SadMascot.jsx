import { Suspense, lazy, useRef } from 'react';
import '../components/Mascot/Mascot.css';

/**
 * Mascota de la página 404 (isla client:only): la misma mascota 3D, triste y QUIETA. Con `still` el motor no teclea,
 * no se acomoda las gafas ni reacciona al scroll (antes, a los 8 s se ponía a teclear, cambiaba a la cara concentrada y
 * la cabeza daba saltos: Jhon lo vio "parpadear raro"). NO usa la acción `triste`: es un sollozo corto pensado para
 * Contacto y, repetida en bucle, la cabeza daba tirones de ~9° cada segundo. Se queda en `reposo` (solo respira el
 * cuerpo) con la cabeza un poco hacia abajo (lookHold) y la cara `sad` también en reposo (restFace), así vuelve a
 * estar triste tras parpadear o tras un clic (susto o risa). Sin juegos en el pecho.
 * Desde el 27/11/2026 usa su propia acción de Blender, `triste_reposo` (pose triste mantenida que solo respira, bucle
 * sin costura), como bucle de reposo (pose): ya no hace falta inclinar la cabeza por código.
 */
const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));

export default function SadMascot() {
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  const onReady = (e) => {
    e.restFace = () => 'sad';
    e.lookHold = { dx: 0, dy: 0.1 }; // la mirada quieta (manda sobre el puntero); lo cabizbajo lo pone la acción
    e.pose('triste_reposo');
    e.setExpr('sad');
    e.renderOnce?.();
  };
  return (
    <div className="sad-bot" onPointerMove={(ev) => { ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY; }}>
      <Suspense fallback={null}>
        <Mascot3D games={false} still ptr={ptr} onReady={onReady} />
      </Suspense>
    </div>
  );
}
