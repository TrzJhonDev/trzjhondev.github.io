import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { siReact, siThreedotjs, siBlender, siCss, siJavascript, siSvg } from 'simple-icons';
import { GuideProvider } from './Mascot/Guide';
import Projects from './Projects';
import Contact from './Contact';
import '../styles/lab.css';
import './Mascot/Mascot.css';

/**
 * Laboratorio como UNA VENTANA CON PESTAÑAS (opción L1, elegida por Jhon el 27/11/2026: "interactivo pero limpio,
 * organizado, con buena estructura y buen espaciado"). Tres pestañas (Portátil, Consola, Switch) con enlace propio
 * (#portatil, #consola, #switch); se monta SOLO la pieza activa (cada una tiene su escena 3D). Dentro de la ventana:
 * barra de título con la ruta, la pieza a todo el ancho y, debajo, la misma franja en las tres: qué es, controles
 * (con teclas) y con qué está hecha. Pestañas según el patrón de ARIA: flechas, Inicio y Fin para moverse.
 * Comparte la guía de la mascota (GuideProvider) porque el portátil y el switch la usan.
 */
const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));

const icon = (s) => ({ title: s.title, path: s.path, hex: s.hex });
const TABS = [
  {
    id: 'portatil', label: 'Portátil', file: '~/lab/portatil',
    about: 'Un portátil hecho con CSS 3D y dibujado con WebGL encima. Cada tecla de color es una de mis habilidades, con su código. A la derecha, mis proyectos: ábrelos y se ven en la pantalla.',
    controls: [
      { g: 'drag', what: 'Girar el portátil', how: ['Arrastra el portátil'] },
      { g: 'dragY', what: 'Abrir o cerrar la tapa', how: ['Arrastra la tapa'] },
      { g: 'click', what: 'Cargar una habilidad', how: ['Clic en una tecla de color'] },
      { g: 'key', what: 'Abrir la terminal', how: ['Clic en la pantalla o ', { k: 'T' }] },
      { g: 'click', what: 'Ejecutar el código', how: ['Clic en el touchpad o ', { k: 'Enter' }] },
      { g: 'wheel', what: 'Acercar o alejar', how: [{ k: 'Ctrl' }, ' + rueda del ratón'] },
    ],
    tip: 'Elige "Arquitectura de computadoras" para desmontarlo y armar el rompecabezas.',
    made: [icon(siReact), { title: 'CSS 3D', path: siCss.path, hex: siCss.hex }, icon(siThreedotjs), icon(siBlender)],
  },
  {
    id: 'consola', label: 'Consola', file: '~/lab/consola',
    about: 'La consola del pecho de la mascota tiene tres juegos: Serpiente, Salto y Ladrillos. Se dibujan en un canvas que el motor 3D copia a la pantalla del modelo.',
    controls: [
      { g: 'click', what: 'Abrir el menú de juegos', how: ['Clic en la pantalla del pecho'] },
      { g: 'arrows', what: 'Moverte', how: [{ k: '↑' }, { k: '↓' }, { k: '←' }, { k: '→' }, ' o ', { k: 'WASD' }] },
      { g: 'key', what: 'Acción del juego', how: [{ k: 'Espacio' }] },
      { g: 'key', what: 'Salir del juego', how: [{ k: 'Esc' }] },
      { g: 'pad', what: 'Jugar en el móvil', how: ['Toca la cruz y los botones A/B'] },
    ],
    tip: 'Tu mejor marca se guarda en este navegador.',
    made: [icon(siReact), icon(siJavascript), icon(siThreedotjs), icon(siBlender)],
  },
  {
    id: 'switch', label: 'Switch', file: '~/lab/switch',
    about: 'Un switch de red con siete puertos y un servidor renderizado en Blender. La mascota pasea con el conector y prueba los puertos por su cuenta.',
    controls: [
      { g: 'drag', what: 'Enchufar un puerto', how: ['Arrastra el conector hasta un enchufe'] },
      { g: 'point', what: 'Pedirle que conecte', how: ['Pasa el puntero por un puerto'] },
      { g: 'grab', what: 'Quitarle el conector', how: ['Se pone triste… y se le pasa'] },
    ],
    tip: 'Los puertos de las redes que aún no tienen enlace dicen "pendiente".',
    made: [icon(siReact), icon(siThreedotjs), icon(siBlender), icon(siSvg)],
  },
];
const fromHash = () => {
  const h = typeof location !== 'undefined' ? location.hash.slice(1) : '';
  return TABS.some((t) => t.id === h) ? h : 'portatil';
};

export default function LabApp({ projects }) {
  const [tab, setTab] = useState(fromHash);
  const tabsRef = useRef([]);
  const t = TABS.find((x) => x.id === tab);

  useEffect(() => {
    const onHash = () => setTab(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const choose = (id, focus = false) => {
    setTab(id);
    history.replaceState(null, '', `#${id}`);
    if (focus) tabsRef.current[TABS.findIndex((x) => x.id === id)]?.focus();
  };
  const onKey = (ev) => {
    const i = TABS.findIndex((x) => x.id === tab);
    const go = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[ev.key];
    if (go === undefined) return;
    ev.preventDefault();
    choose(TABS[(go + TABS.length) % TABS.length].id, true);
  };

  return (
    <GuideProvider>
      <div className="wrap lab">
        <div className="lab__tabs" role="tablist" aria-label="Piezas del laboratorio" onKeyDown={onKey}>
          {TABS.map((x, i) => (
            <button key={x.id} ref={(el) => { tabsRef.current[i] = el; }} type="button" role="tab" id={`tab-${x.id}`}
              aria-selected={x.id === tab} aria-controls="lab-panel" tabIndex={x.id === tab ? 0 : -1}
              className={`lab__tab${x.id === tab ? ' is-on' : ''}`} onClick={() => choose(x.id)}>
              <span className="mono lab__tab-n">0{i + 1}</span>{x.label}
            </button>
          ))}
        </div>

        <section className="lab__win" id="lab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          <div className="lab__bar" aria-hidden="true"><i /><i /><i /><span className="mono">{t.file}</span></div>
          <div className={`lab__view lab__view--${tab}`} key={tab}>
            {tab === 'portatil' && <Projects lab list={projects} />}
            {tab === 'consola' && <ConsoleView />}
            {tab === 'switch' && <Contact lab />}
          </div>
          <div className="lab__info" key={`info-${tab}`}>
            <div className="lab__ctrl">
              <h2 className="mono lab__h">controles</h2>
              <ul className="lab__ctls">
                {t.controls.map((c, i) => (
                  <li key={c.what} className={`lab__ctl lab__ctl--${c.g}`} style={{ '--i': i }}>
                    <span className="lab__ctl-ico" aria-hidden="true"><Gesture g={c.g} /></span>
                    <span className="lab__ctl-txt">
                      <strong>{c.what}</strong>
                      <span className="lab__ctl-how">{c.how.map((p, j) => (typeof p === 'string' ? <span key={j}>{p}</span> : <kbd key={j}>{p.k}</kbd>))}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lab__about">
              <h2 className="mono lab__h">qué es</h2>
              <p>{t.about}</p>
              <p className="lab__tip">{t.tip}</p>
            </div>
            <div className="lab__made-col">
              <h2 className="mono lab__h">hecho con</h2>
              <ul className="lab__made">
                {t.made.map((m) => (
                  <li key={m.title} style={{ '--brand': m.hex === '000000' ? 'var(--text)' : `#${m.hex}` }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d={m.path} /></svg>{m.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </GuideProvider>
  );
}

// Iconos del gesto de cada control (24 × 24, trazo). La parte con clase `m` es la que se mueve al pasar el puntero
// (el cursor que arrastra, la onda del clic, la tecla que baja, la rueda que gira…); el CSS hace la animación.
const CURSOR = (x, y) => <path className="cur" d={`M${x} ${y}l11 5.6-4.8 1.6-2.1 5z`} fill="currentColor" stroke="none" />;
function Gesture({ g }) {
  const s = { viewBox: '0 0 24 24', width: 24, height: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (g) {
    case 'drag': return <svg {...s}><path d="M4 6h16M7 3.5 4 6l3 2.5M17 3.5 20 6l-3 2.5" opacity=".55" /><g className="m">{CURSOR(8, 10)}</g></svg>;
    case 'dragY': return <svg {...s}><path d="M6 4v16M3.5 7 6 4l2.5 3M3.5 17 6 20l2.5-3" opacity=".55" /><g className="m">{CURSOR(11, 8)}</g></svg>;
    case 'click': return <svg {...s}><circle className="m" cx="8" cy="8" r="5" opacity=".6" />{CURSOR(8, 8)}</svg>;
    case 'key': return <svg {...s}><path d="M5 19h14" opacity=".45" /><g className="m"><rect x="4" y="6" width="16" height="11" rx="3" /><path d="M9 11.5h6" /></g></svg>;
    case 'wheel': return <svg {...s}><rect x="7" y="3" width="10" height="18" rx="5" /><path className="m" d="M12 7v3" /></svg>;
    case 'arrows': return <svg {...s}><path className="m a1" d="M12 3.5 9.5 7h5z" /><path className="m a2" d="M20.5 12 17 9.5v5z" /><path className="m a3" d="M12 20.5 9.5 17h5z" /><path className="m a4" d="M3.5 12 7 9.5v5z" /><circle cx="12" cy="12" r="1.6" /></svg>;
    case 'pad': return <svg {...s}><path className="m" d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" /></svg>;
    case 'point': return <svg {...s}><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="6" r="4.6" opacity=".35" /><g className="m">{CURSOR(4, 11)}</g></svg>;
    default: return <svg {...s}><rect x="15" y="3.5" width="5" height="7" rx="1.2" opacity=".55" /><path d="M17.5 10.5v3" opacity=".55" /><g className="m">{CURSOR(5, 9)}</g></svg>;
  }
}

function ConsoleView() {
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  return (
    <div className="lab-console" onPointerMove={(ev) => { ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY; }}>
      <div className="lab-console__bot">
        <Suspense fallback={null}><Mascot3D ptr={ptr} /></Suspense>
      </div>
    </div>
  );
}
