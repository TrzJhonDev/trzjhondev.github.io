import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { boot } from './boot';

/**
 * Scroll con inercia (Jhon lo eligió el 26/11/2026 entre 4 propuestas de scroll-craft: "el scroll no se ve suave").
 * La rueda ya no salta ~100 px de golpe: la página se desliza y frena suave, y con ella avanzan sin escalones el
 * encendido del portátil, los planos de la portada y la pista de Formación (todos leen window.scrollY).
 *
 * Solo con ratón o touchpad (puntero fino) y sin "reducir movimiento"; en táctil el dedo sigue siendo nativo.
 * Empieza al terminar la pantalla de carga (antes la página no se puede desplazar).
 * Lenis ya respeta: Ctrl + rueda (zoom del portátil), las listas con su propio scroll (allowNestedScroll y
 * data-lenis-prevent) y los enlaces a #ancla (anchors). Las teclas (flechas, espacio) siguen siendo nativas.
 */
export function startSmoothScroll() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  let lenis = null;
  const sync = () => {
    const want = fine.matches && motion.matches && boot.finished;
    if (want && !lenis) {
      lenis = new Lenis({ autoRaf: true, lerp: 0.1, anchors: true, allowNestedScroll: true, stopInertiaOnNavigate: true });
      window.__lenis = lenis; // para las pruebas (lab/*.mjs)
    } else if (!want && lenis) {
      lenis.destroy();
      lenis = null;
      delete window.__lenis;
    }
  };
  fine.addEventListener('change', sync);
  motion.addEventListener('change', sync);
  boot.on(sync);
}
