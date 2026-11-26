import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Portrait from './components/Portrait';
import Projects from './components/Projects';
import Education from './components/Education';
import Contact from './components/Contact';
import { GuideProvider } from './components/Mascot/Guide';

// El color de acento se cambia solo en --accent (src/index.css)
export default function App() {
  return (
    // GuideProvider reparte los mensajes de la mascota y muestra la pequeña cuando la de la portada ya no se ve
    <GuideProvider>
      <Navbar />
      <main>
        {/* Portada: presentación a la izquierda y la mascota (con su escena 3D) a la derecha.
            El portátil vive en Projects. */}
        <section id="inicio" className="hero">
          {/* Niebla azul muy tenue (decoración: se oculta en móvil y con "reducir movimiento") */}
          <div className="fog" aria-hidden="true"><i /><i /></div>
          <div className="container hero__content">
            <Hero />
            <Portrait />
          </div>
        </section>
        <Projects />
        <Education />
        <Contact />
      </main>
    </GuideProvider>
  );
}
