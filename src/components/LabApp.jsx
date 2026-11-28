import { Suspense, lazy, useRef } from 'react';
import { GuideProvider } from './Mascot/Guide';
import Projects from './Projects';
import Contact from './Contact';
import '../styles/lab.css';
import './Mascot/Mascot.css';

/**
 * Laboratorio (/lab, fase 4 de PLAN-REESCRITURA.md): lo interactivo de la web anterior, reunido en una página para
 * quien quiera jugar, sin competir con los proyectos en la portada. Es UNA isla de React (client:only) porque las tres
 * piezas comparten la guía de la mascota (GuideProvider: comentarios del portátil, mirada y órdenes del switch).
 *  1. El portátil 3D con su lista de programas (los proyectos de la colección de Markdown), sin la pista fijada:
 *     arranca solo al entrar.
 *  2. La consola del pecho de la mascota con sus 3 juegos (Serpiente, Salto, Ladrillos).
 *  3. El switch de puertos con el cable (Contact.jsx en modo lab: sin formulario ni pie).
 */
const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));

export default function LabApp({ projects }) {
  return (
    <GuideProvider>
      <section className="lab-sec" aria-labelledby="lab-portatil">
        <div className="wrap"><header className="lab-sec__head">
          <p className="kicker">01 · portátil</p>
          <h2 id="lab-portatil">El portátil</h2>
          <p>Gíralo arrastrando, abre la tapa, pulsa las teclas de colores (cada una es una habilidad), abre la terminal con un clic en la pantalla o elige "Arquitectura de computadoras" para desmontarlo.</p>
        </header></div>
        <Projects lab list={projects} />
      </section>
      <ConsoleSection />
      <section className="lab-sec" aria-labelledby="lab-switch">
        <div className="wrap"><header className="lab-sec__head">
          <p className="kicker">03 · switch</p>
          <h2 id="lab-switch">El switch de puertos</h2>
          <p>La mascota pasea con un conector: arrástralo hasta un puerto para enchufarlo, o señala un puerto y ella va a conectarlo.</p>
        </header></div>
        <Contact lab />
      </section>
    </GuideProvider>
  );
}

function ConsoleSection() {
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  return (
    <section className="lab-sec" aria-labelledby="lab-consola"
      onPointerMove={(ev) => { ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY; }}>
      <div className="wrap lab-console">
        <header className="lab-sec__head">
          <p className="kicker">02 · consola</p>
          <h2 id="lab-consola">La consola de la mascota</h2>
          <p>Haz clic en la pantalla de su pecho y elige un juego: Serpiente, Salto o Ladrillos. Se juega con las flechas o WASD, espacio, y Esc para salir; en el móvil, con la cruz y los botones A y B de la consola.</p>
          <ul className="lab-keys">
            <li><kbd>↑ ↓ ← →</kbd> mover</li>
            <li><kbd>Espacio</kbd> acción</li>
            <li><kbd>Esc</kbd> salir</li>
          </ul>
        </header>
        <div className="lab-console__bot">
          <Suspense fallback={null}>
            <Mascot3D ptr={ptr} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
