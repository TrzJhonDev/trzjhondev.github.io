import { useEffect, useRef, useState } from 'react';
import Mascot from '../components/Mascot/Mascot';
import { useTheme } from '../lib/useTheme';
import { Mascot3D } from './mascot3d';
import './proto.css';

// Página de prueba (se abre con ?mascota3d en la dirección): la mascota actual (CSS 3D) al lado de la modelada
// en Blender (Three.js), con botones para sus animaciones y los fotogramas por segundo, para decidir con datos
// (ver PLAN-MASCOTA-3D.md). La página normal no carga nada de esto.

const ACTIONS = [
  ['saludo', 'Saludo'], ['hola', 'Hola'], ['susto', 'Susto'], ['risa', 'Risa'], ['celebrar', 'Celebrar'],
  ['salto', 'Salto'], ['teclear', 'Teclear'], ['caminar', 'Caminar'], ['reposo', 'Reposo'],
];

export default function Proto3D() {
  const [theme, toggleTheme] = useTheme();
  const box = useRef(null);
  const engine = useRef(null);
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  const [info, setInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState('reposo');

  // Puntero para la mascota CSS (la 3D lo lee ella sola)
  useEffect(() => {
    const move = (ev) => { ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY; };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    const e = new Mascot3D(box.current, { onStats: setStats });
    engine.current = e;
    e.load(`${import.meta.env.BASE_URL}models/mascota.glb`)
      .then((r) => { setInfo(r); e.setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'); })
      .catch((err) => setError(String(err?.message || err)));
    return () => e.dispose();
  }, []);

  useEffect(() => { engine.current?.setTheme(theme); }, [theme, info]);

  const play = (name) => { engine.current?.play(name); setCurrent(name); };

  return (
    <main className="proto">
      <header className="proto__head">
        <div>
          <h1>Prototipo: mascota en 3D</h1>
          <p>Izquierda: la actual (CSS 3D). Derecha: la modelada en Blender (Three.js). Haz clic en la 3D para que se asuste o se ría; las dos siguen el puntero.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={toggleTheme}>Modo {theme === 'dark' ? 'claro' : 'oscuro'}</button>
      </header>

      <section className="proto__grid">
        <figure className="proto__card">
          <div className="proto__stage proto__stage--css"><Mascot ptr={ptr} /></div>
          <figcaption>Actual · CSS 3D</figcaption>
        </figure>
        <figure className="proto__card">
          <div className="proto__stage" ref={box}>
            {!info && !error && <p className="proto__msg">Cargando modelo…</p>}
            {error && <p className="proto__msg proto__msg--err">No se pudo cargar el modelo: {error}</p>}
          </div>
          <figcaption>Blender · Three.js</figcaption>
        </figure>
      </section>

      <section className="proto__controls" aria-label="Animaciones de la mascota 3D">
        {ACTIONS.map(([id, label]) => (
          <button key={id} type="button" className={`btn ${current === id ? 'btn--accent' : 'btn--ghost'}`} onClick={() => play(id)}>{label}</button>
        ))}
      </section>

      <section className="proto__stats" aria-live="polite">
        <span><b>{stats ? stats.fps : '–'}</b> fps</span>
        <span><b>{stats ? stats.ms.toFixed(1) : '–'}</b> ms por fotograma</span>
        <span><b>{info ? info.triangles.toLocaleString('es') : '–'}</b> triángulos</span>
        <span><b>{stats ? stats.calls : '–'}</b> llamadas de dibujo</span>
        <span>Modelo: 530 KB (158 KB comprimido)</span>
      </section>
    </main>
  );
}
