// Pequeñas utilidades 3D usadas por el portátil.
// Convención de CSS: X a la derecha, Y hacia abajo, Z hacia el espectador.

export const DEG = Math.PI / 180;

export function rotX([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

export function rotY([x, y, z], b) {
  const c = Math.cos(b), s = Math.sin(b);
  return [x * c + z * s, y, -x * s + z * c];
}

const norm = ([x, y, z]) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Lleva un vector de la escena al espacio de la cámara (después de girar la escena). */
export const toView = (v, rx, ry) => rotX(rotY(v, ry * DEG), rx * DEG);

// Dirección de la luz por defecto (arriba, izquierda, delante), en espacio de cámara
export const LIGHT = norm([-0.35, -0.85, 0.4]);

/**
 * Devuelve la opacidad de una capa negra para sombrear una cara,
 * según hacia dónde apunta su normal después de rotar la escena.
 */
export function shade(normal, rx, ry, light = LIGHT) {
  const d = dot(toView(normal, rx, ry), light);
  return 0.62 * (1 - Math.max(0, d));
}

/**
 * Reflejo especular de una cara plana (modelo de Blinn-Phong).
 *  - normal: normal de la cara en la escena
 *  - tx, ty: ejes x / y locales de la cara en la escena (para ubicar el brillo sobre ella)
 * Devuelve { o: intensidad 0–1, x, y: posición del brillo en % de la cara }.
 */
export function sheen(normal, tx, ty, rx, ry, light = LIGHT, power = 4) {
  const n = toView(normal, rx, ry);
  const h = norm([light[0], light[1], light[2] + 1]); // vector medio entre luz y cámara
  const o = Math.pow(Math.max(0, dot(n, h)), power);
  const u = dot(toView(tx, rx, ry), h), v = dot(toView(ty, rx, ry), h);
  return { o, x: 50 + u * 110, y: 50 + v * 110 };
}

/**
 * Brillo del chaflán de cada borde de una cara (0–1), según la luz.
 * bevels: normales de los biseles en la escena.
 */
export const glint = (bevels, rx, ry, light = LIGHT) =>
  bevels.map((b) => Math.pow(Math.max(0, dot(toView(norm(b), rx, ry), norm([light[0], light[1], light[2] + 1]))), 6));

/** Transformación que hace que un elemento mire siempre a la cámara. */
export function billboard(rx, ry) {
  return ` rotateY(${-ry}deg) rotateX(${-rx}deg)`;
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Color de texto (casi negro o blanco) que más contrasta sobre un fondo `hex` (#RRGGBB). */
export function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return 1.05 / (L + 0.05) > (L + 0.05) / 0.0535 ? '#FFFFFF' : '#0A0A0B';
}

export const easeInOut =(p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Anima de 0 a 1 durante `ms` y llama a `apply(progreso)` en cada fotograma.
 * Devuelve una función que cancela la animación (para que dos no se pisen).
 */
export function tween(ms, apply) {
  let t0 = null, raf = 0, dead = false;
  const step = (t) => {
    if (dead) return;
    if (t0 == null) t0 = t;
    const p = ms <= 0 ? 1 : Math.min(1, (t - t0) / ms);
    apply(easeInOut(p));
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { dead = true; cancelAnimationFrame(raf); };
}
