// Datos de la cara de píxeles de la mascota, compartidos por la cara SVG (Face.jsx) y el prototipo 3D
// (src/proto). Cada píxel mide P unidades. '#' = encendido. Los ojos son de 6×7 y la boca de 8×3.
// La pantalla de la cara mide 160 × 124 unidades.

export const P = 7;
/** Ojos que no son simétricos por sí mismos: el derecho se dibuja en espejo. */
export const MIRRORED = new Set(['laugh', 'sad', 'dizzy']);
export const mirror = (rows) => rows.map((r) => [...r].reverse().join(''));

export const EYE = {
  idle: ['.####.', '######', '######', '######', '######', '######', '.####.'],
  blink: ['......', '......', '......', '.####.', '......', '......', '......'],
  happy: ['......', '......', '.####.', '##..##', '#....#', '......', '......'],
  laugh: ['##....', '.##...', '..##..', '...##.', '..##..', '.##...', '##....'], // ">" (el derecho es "<")
  surprised: ['.####.', '##..##', '#....#', '#....#', '#....#', '##..##', '.####.'],
  focus: ['......', '......', '......', '######', '######', '######', '.####.'],
  sad: ['......', '......', '....##', '..####', '.#####', '.####.', '......'], // caído hacia fuera (el derecho es su espejo)
  dizzy: ['######', '.....#', '.###.#', '.#.#.#', '.#...#', '.#####', '......'], // espiral: se marea si bajas muy rápido
  sleep: ['......', '......', '......', '......', '######', '......', '......'], // dormido: ojo cerrado, una línea (pantalla de carga)
};
export const MOUTH = {
  idle: ['#......#', '.######.', '........'],
  happy: ['#......#', '.#....#.', '..####..'],
  laugh: ['########', '.######.', '..####..'],
  surprised: ['..####..', '..#..#..', '..####..'],
  focus: ['........', '..####..', '........'],
  sad: ['........', '..####..', '.#....#.'],
  dizzy: ['........', '.##..##.', '#..##..#'],
  sleep: ['........', '...##...', '...##...'],
};
// Expresiones con pupila (un bloque oscuro que se mueve dentro del ojo)
export const PUPIL = { idle: [2, 2, 2, 3], surprised: [2, 3, 2, 2] }; // [columna, fila, ancho, alto] en píxeles

export const EYE_W = 6 * P, EYE_H = 7 * P;
export const EYE_Y = 22;
export const EYE_X = [80 - 36 - EYE_W / 2, 80 + 36 - EYE_W / 2]; // centros a ±36 del centro de la pantalla (160 de ancho)
export const MOUTH_X = 80 - (8 * P) / 2, MOUTH_Y = 90;
