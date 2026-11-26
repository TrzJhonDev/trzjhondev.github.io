import { useLayoutEffect, useState } from 'react';

const LAPTOP_HALF = 300; // medio ancho que ocupa el portátil girado (px de escena)
export const DESKTOP = 900; // desde este ancho el texto va al lado del portátil
const BANK_REACH = 385; // hasta dónde llega la batería del cargador a la izquierda del centro (px de escena)

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
  let cx, cy, fit, ecx, efit;
  if (desktop) {
    // El portátil ocupa la mitad izquierda; a la derecha va la columna de tarjetas (CARDS_W, igual que en CSS)
    const cardsW = Math.min(460, Math.max(380, w * 0.36));
    // +40 a la izquierda: deja sitio a la batería portátil del cargador, que queda fuera de la carcasa por ese lado
    const left = Math.max(16, colLeft - 24) + 40, right = w - colLeft - cardsW - 24;
    cx = (left + right) / 2;
    cy = h * 0.7;
    fit = Math.min(1.05, (right - left) / 2 / half, h / 820);
    // En el despiece las tarjetas se ocultan y la ficha de la pieza ocupa su sitio: el portátil no se mueve
    ecx = cx;
    efit = fit;
  } else {
    cy = h * 0.66;
    efit = Math.min(1, (w - 16) / 2 / half, h / 820);
    ecx = w / 2;
    // Con la batería del cargador a la izquierda (llega a -380 px de escena) el conjunto mide más: se achica un poco y se
    // desplaza a la derecha para que el cable no salga del cuadro (en el despiece el cargador se oculta y vale lo de arriba)
    fit = Math.min(1, (w - 16) / (BANK_REACH + half + 30), h / 820);
    cx = Math.max(w / 2, 8 + BANK_REACH * fit);
  }
  fit = Math.max(0.4, fit);
  efit = Math.max(0.4, efit);
  return { cx, cy, fit, ecx, efit, colLeft, w, h, desktop, holo: Math.min(1.6, Math.max(1, 0.8 / fit)) };
}
