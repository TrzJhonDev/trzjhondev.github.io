import { useEffect, useRef, useState } from 'react';
import { SKILLS } from '../data/skills';
import { useTheme } from '../lib/useTheme';
import { Laptop3D } from './laptop3d';
import './proto.css';

// Página de prueba del portátil modelado en Blender (se abre con ?portatil3d). Solo prueba el modelo, sus texturas
// (teclas y pantalla), la tapa y el despiece; la migración de toda la interacción va en PLAN-PORTATIL-3D.md.

export default function ProtoLaptop() {
  const [theme, toggleTheme] = useTheme();
  const box = useRef(null);
  const engine = useRef(null);
  const [info, setInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [skill, setSkill] = useState(0);
  const [open, setOpen] = useState(true);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    const e = new Laptop3D(box.current, { onStats: setStats, onSkill: setSkill });
    engine.current = e;
    e.load(`${import.meta.env.BASE_URL}models/portatil.glb`).then(setInfo).catch((err) => setError(String(err?.message || err)));
    return () => e.dispose();
  }, []);

  const toggleOpen = () => { const v = !open; setOpen(v); engine.current?.setOpen(v ? 1 : 0); };
  const toggleExplode = () => { const v = !exploded; setExploded(v); engine.current?.setExplode(v ? 1 : 0); if (v && !open) toggleOpen(); };
  const s = SKILLS[skill];

  return (
    <main className="proto">
      <header className="proto__head">
        <div>
          <h1>Prototipo: portátil en 3D</h1>
          <p>Modelo de Blender con Three.js. Arrastra para girarlo y haz clic en una tecla de color para cargar esa skill en la pantalla.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={toggleTheme}>Modo {theme === 'dark' ? 'claro' : 'oscuro'}</button>
      </header>

      <figure className="proto__card">
        <div className="proto__stage proto__stage--laptop" ref={box}>
          {!info && !error && <p className="proto__msg">Cargando modelo…</p>}
          {error && <p className="proto__msg proto__msg--err">No se pudo cargar: {error}</p>}
        </div>
        <figcaption>Skill: {s.name} · {s.cat}</figcaption>
      </figure>

      <div className="proto__controls">
        <button type="button" className="btn btn--ghost" onClick={toggleOpen} aria-pressed={!open}>{open ? 'Cerrar tapa' : 'Abrir tapa'}</button>
        <button type="button" className="btn btn--ghost" onClick={toggleExplode} aria-pressed={exploded}>{exploded ? 'Montar' : 'Despiece'}</button>
      </div>

      <div className="proto__stats" aria-live="off">
        {info && <span>Carga: <b>{info.load} ms</b></span>}
        {info && <span>Triángulos: <b>{info.tris.toLocaleString('es')}</b></span>}
        {info && <span>Mallas: <b>{info.meshes}</b></span>}
        {stats && <span>FPS: <b>{stats.fps}</b></span>}
        {stats && <span>Por fotograma: <b>{stats.ms} ms</b></span>}
      </div>
    </main>
  );
}
