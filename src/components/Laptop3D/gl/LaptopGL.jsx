import { useEffect, useLayoutEffect, useRef } from 'react';
import { LaptopGL as Engine } from './glEngine';

// Capa WebGL del portátil (ver glEngine.js). Se carga en diferido desde Laptop3D.jsx; mientras tanto, o si no hay
// WebGL, se ve el portátil CSS. Dibuja un fotograma cada vez que React pinta el escenario (el bucle de useLaptop, ~30 fps),
// así va siempre a la par de las piezas CSS que siguen encima (pantalla, hologramas) y debajo (suelo).
import { modelUrl } from '../../../lib/boot';

const MODEL = modelUrl('portatil');

export default function LaptopGL({ frame, onReady, onError }) {
  const host = useRef(null);
  const engine = useRef(null);
  const cb = useRef({});
  cb.current = { onReady, onError };
  const last = useRef(frame);
  last.current = frame;

  useEffect(() => {
    let e;
    try { e = new Engine(host.current); } catch (err) { cb.current.onError?.(err); return undefined; }
    engine.current = e;
    if (import.meta.env.DEV) window.__laptopGL = e; // para depurar desde la consola
    e.load(MODEL)
      .then(() => { if (engine.current !== e) return; e.draw(last.current); cb.current.onReady?.(); })
      .catch((err) => { if (engine.current === e) cb.current.onError?.(err); });
    return () => { e.dispose(); engine.current = null; };
  }, []);

  useLayoutEffect(() => { engine.current?.draw(frame); });

  return <div ref={host} className="stage__gl-host" aria-hidden="true" />;
}
