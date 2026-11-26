// Medidas y geometría del portátil (px de escena). Ver convención de ejes en CLAUDE.md.
import { DEG } from '../../lib/math3d';

export const HALF_W = 240, HALF_D = 160, BASE_H = 14;

// ── Bordes con esquinas redondeadas ──────────────────────────────
// La carcasa tiene esquinas curvas, así que sus paredes no pueden ser rectángulos
// del ancho total: cada lado recto se acorta y las esquinas se arman con facetas finas.
const CORNER_FACETS = 5;
const facetW = (r) => 2 * r * Math.tan(Math.PI / 4 / CORNER_FACETS) + 0.6;

/** Paredes de la base (plano XZ). th = ángulo de la normal (0 = frente, 90 = derecha). */
export const BASE_R = 14;
export const BASE_RIM = (() => {
  const segs = [
    { x: 0, z: HALF_D, th: 0, w: 2 * (HALF_W - BASE_R), kind: 'front' },
    { x: HALF_W, z: 0, th: 90, w: 2 * (HALF_D - BASE_R), kind: 'right' },
    { x: 0, z: -HALF_D, th: 180, w: 2 * (HALF_W - BASE_R), kind: 'back' },
    { x: -HALF_W, z: 0, th: -90, w: 2 * (HALF_D - BASE_R), kind: 'left' },
  ];
  [[1, 1, 0], [1, -1, 90], [-1, -1, 180], [-1, 1, 270]].forEach(([sx, sz, a0]) => {
    for (let i = 0; i < CORNER_FACETS; i++) {
      const th = a0 + ((i + 0.5) * 90) / CORNER_FACETS;
      segs.push({
        x: sx * (HALF_W - BASE_R) + BASE_R * Math.sin(th * DEG),
        z: sz * (HALF_D - BASE_R) + BASE_R * Math.cos(th * DEG),
        th, w: facetW(BASE_R), kind: 'corner',
      });
    }
  });
  return segs.map((s) => ({ ...s, n: [Math.sin(s.th * DEG), 0, Math.cos(s.th * DEG)] }));
})();

/** Canto de la tapa (plano XY local de la tapa). ph = ángulo de la normal (0 = arriba, 90 = derecha). */
export const LID_TOP = -322, LID_BOT = -6;
const LID_RT = 16, LID_RB = 6;
export const LID_RIM = (() => {
  const midY = (LID_TOP + LID_RT + LID_BOT - LID_RB) / 2;
  const sideH = (LID_BOT - LID_RB) - (LID_TOP + LID_RT);
  const segs = [
    { x: 0, y: LID_TOP, ph: 0, w: 2 * (HALF_W - LID_RT) },
    { x: HALF_W, y: midY, ph: 90, w: sideH },
    { x: 0, y: LID_BOT, ph: 180, w: 2 * (HALF_W - LID_RB) },
    { x: -HALF_W, y: midY, ph: 270, w: sideH },
  ];
  [
    [HALF_W - LID_RT, LID_TOP + LID_RT, LID_RT, 0],
    [HALF_W - LID_RB, LID_BOT - LID_RB, LID_RB, 90],
    [-(HALF_W - LID_RB), LID_BOT - LID_RB, LID_RB, 180],
    [-(HALF_W - LID_RT), LID_TOP + LID_RT, LID_RT, 270],
  ].forEach(([cx, cy, r, a0]) => {
    for (let i = 0; i < CORNER_FACETS; i++) {
      const ph = a0 + ((i + 0.5) * 90) / CORNER_FACETS;
      segs.push({ x: cx + r * Math.sin(ph * DEG), y: cy - r * Math.cos(ph * DEG), ph, w: facetW(r) });
    }
  });
  return segs.map((s) => ({ ...s, n: [Math.sin(s.ph * DEG), -Math.cos(s.ph * DEG), 0] }));
})();

/**
 * Posiciones de cada capa según el despiece (e de 0 a 1).
 * Eje Y local de la base: negativo = arriba.
 */
export function layers(e) {
  return {
    deckY: -170 * e, keysY: -3 - 285 * e, mbY: 8 + 10 * e, bottomY: BASE_H + 130 * e,
    deckOp: 1 - 0.55 * e, // en el despiece la carcasa se vuelve translúcida (rayos X)
    walls: 1 - e, screenZ: 3 + 110 * e, padLift: 50 * e,
    floorY: 16 + 140 * e, shadowS: 1 + 0.35 * e,
    lidY: -90 * e, lidZ: -158 - 100 * e,
  };
}

// ── Cargador ─────────────────────────────────────────────────────
// Puerto USB-C de carga en la pared izquierda (centro del puerto, px de escena).
// La pared izquierda mide 292 px a lo largo de Z; el puerto está a 47 px de su borde trasero.
export const CHARGE_PORT = [-HALF_W, 7, -99];
export const PLUG_LEN = 40; // largo del conector sin la punta metálica (funda + cuerpo)
const PLUG_IN = [-HALF_W - 1, 7, -99]; // punta del conector dentro del puerto
// Punta en reposo: en el suelo, pegada a la batería portátil y al puerto (así el cable es corto y va directo de la batería
// al conector, sin dar rodeos). El conector siempre apunta hacia +X, como cuando está enchufado; x < -240: no cruza la carcasa.
const PLUG_REST = [-268, 10, -30];

/** Punta del conector a lo largo del recorrido (p: 0 = en el suelo, 1 = enchufado), con un arco. */
export function plugTip(p) {
  const l = (a, b) => a + (b - a) * p;
  return [l(PLUG_REST[0], PLUG_IN[0]), l(PLUG_REST[1], PLUG_IN[1]) - 34 * Math.sin(Math.PI * p), l(PLUG_REST[2], PLUG_IN[2])];
}

// Batería portátil en el suelo, a la izquierda del portátil, de modo que el cable tenga origen (antes salía del cuadro
// por delante, "de la nada"). Largo L a lo largo de Z, ancho W a lo largo de X, alto H. Su puerto USB-C está en la cara
// que mira al portátil, a la misma Z que el puerto de carga.
export const BANK = { c: [-352, 5, CHARGE_PORT[2]], L: 110, H: 22, W: 54 };
/** Donde el cable entra en la batería (centro de su puerto, en la cara que mira al portátil). */
export const CABLE_ANCHOR = [BANK.c[0] + BANK.W / 2, 6, BANK.c[2]];

/** Vector del recorrido completo (para traducir el arrastre del puntero a avance del conector). */
export const PLUG_PATH = [PLUG_IN[0] - PLUG_REST[0], PLUG_IN[1] - PLUG_REST[1], PLUG_IN[2] - PLUG_REST[2]];
