import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import '../components/Mascot/Mascot.css';

/**
 * Mascota pequeña de la esquina (web de Astro, isla client:only). La anfitriona acompaña la página: aparece en su
 * esquina cuando la portada sale de la vista, SIN entrada animada, y saluda con la mano (decisión de Jhon del
 * 24/11/2026); cambia de pose según la sección que tienes delante (SECTION_POSE de engine.js: concentrada mirando
 * la vitrina en Proyectos, contenta en Habilidades y Formación, saluda en Contacto); mira hacia abajo mientras haces
 * scroll y con un clic se asusta o se ríe. No se puede ocultar (Jhon quitó la ×). Por debajo de 900 px es más pequeña.
 */
const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));
const SECTIONS = ['proyectos', 'habilidades', 'formacion', 'contacto'];

export default function MiniMascot() {
  const [show, setShow] = useState(false);
  const ptr = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  const section = useRef(null);

  useEffect(() => {
    const hero = document.getElementById('inicio');
    if (!hero) return undefined;
    // Los IntersectionObserver leen el ÚLTIMO aviso de la lista (con el primero, a veces se quedaba con uno viejo)
    const io = new IntersectionObserver((list) => setShow(!list[list.length - 1].isIntersecting), { threshold: 0.15 });
    io.observe(hero);
    // Sección de la franja central de la pantalla
    const band = new IntersectionObserver((list) => {
      list.forEach((e) => { if (e.isIntersecting) section.current = e.target.id; });
    }, { rootMargin: '-45% 0px -45% 0px' });
    SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) band.observe(el); });
    const move = (ev) => { ptr.current.mx = ev.clientX; ptr.current.my = ev.clientY; };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { io.disconnect(); band.disconnect(); window.removeEventListener('pointermove', move); };
  }, []);

  if (!show) return null;
  return (
    <div className="mascot-mini">
      <Suspense fallback={null}>
        <Mascot3D variant="mini" greet ptr={ptr} section={section} />
      </Suspense>
    </div>
  );
}
