import { useLayoutEffect, useState } from 'react';

const LAPTOP_HALF = 300; // medio ancho que ocupa el portátil girado (px de escena)
export const DESKTOP = 900; // desde este ancho el texto va al lado del portátil
const BANK_REACH = 385;
const LID_REACH = 420; // cuánto sube la tapa abierta por encima del centro (px de escena)
const TOP_GAP = 36; // aire sobre la tapa en pantallas estrechas (px)
export const COL_RIGHT = 32; // margen derecho de la lista de programas en escritorio (= padding-right de .work__panel) // hasta dónde llega la batería del cargador a la izquierda del centro (px de escena)

/**
 * Coloca y escala el portátil según el tamaño del escenario.
 * En escritorio lo centra en la mitad izquierda de la sección Proyectos (las tarjetas van a la derecha);
 * en el despiece (ecx / efit) las tarjetas se ocultan y la ficha de la pieza ocupa su columna.
 */
export function useLayout(ref) {
  const [size, setSize] = useState({ w: 1280, h: 760 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setSize({ w: el.clientWidth, h: el.clientHeight });
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  const { w, h } = size;
  const desktop = w >= DESKTOP;
  const half = LAPTOP_HALF;
  const colLeft = Math.max(0, (w - 1200) / 2) + 24; // columna del texto (y de la ficha del despiece)
  let cx, cy, fit, ecx, ecy, efit;
  if (desktop) {
    // El portátil ocupa la izquierda; la lista de programas va pegada al borde derecho (a COL_RIGHT) y es estrecha
    // (Jhon, 26/11/2026: así el portátil es más grande). cardsW = --cards-w de src/styles/lab.css: si cambias uno, cambia el otro
    const cardsW = Math.min(380, Math.max(320, w * 0.26));
    // +40 a la izquierda: deja sitio a la batería portátil del cargador, que queda fuera de la carcasa por ese lado
    const left = 16 + 40, right = w - COL_RIGHT - cardsW - 32;
    cx = (left + right) / 2;
    cy = h * 0.7;
    // Tope 1,2 y alto: con h/750 la tapa abierta queda por debajo de la etiqueta de la skill y el suelo sobre la pista
    fit = Math.min(1.2, (right - left) / 2 / half, h / 750);
    // En el despiece las tarjetas se ocultan y la ficha de la pieza ocupa su sitio: el portátil no se mueve
    ecx = cx;
    ecy = cy - 20;
    efit = fit;
  } else {
    ecy = h * 0.66 - 40;
    efit = Math.min(1, (w - 16) / 2 / half, h / 820);
    ecx = w / 2;
    // Con la batería del cargador a la izquierda (llega a -380 px de escena) el conjunto mide más: se achica un poco y se
    // desplaza a la derecha para que el cable no salga del cuadro (en el despiece el cargador se oculta y vale lo de arriba)
    fit = Math.min(1, (w - 16) / (BANK_REACH + half + 30), h / 820);
    cx = Math.max(w / 2, 8 + BANK_REACH * fit);
  }
  fit = Math.max(0.4, fit);
  efit = Math.max(0.4, efit);
  // En pantallas estrechas el portátil va pegado arriba de la ventana (Jhon, 28/11/2026: se veía muy abajo)
  // (Se mira la ventana, igual que la regla de lab.css: una ventana de escritorio estrecha no cambia.)
  if (!desktop) cy = window.innerWidth < DESKTOP ? Math.min(h * 0.66, TOP_GAP + LID_REACH * fit) : h * 0.66;
  return { cx, cy, fit, ecx, ecy, efit, colLeft, w, h, desktop, holo: Math.min(1.6, Math.max(1, 0.8 / fit)) };
}
