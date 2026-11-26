import { useCallback, useMemo, useState } from 'react';
import { PARTS } from '../../data/skills';

export const MOBO_W = 440, MOBO_H = 290;
export const SNAP = 18; // distancia (px sobre la placa) a la que una pieza encaja en su hueco

/** Piezas del despiece; la gemela de un par (altavoces) lleva `twin` y su propia posición. */
export const PIECES = PARTS.flatMap((p) => {
  const base = { ...p, key: p.id, home: [p.l, p.t] };
  if (!p.mirror) return [base];
  const l = MOBO_W - p.l - p.w;
  return [base, { ...base, key: `${p.id}-2`, twin: true, l, home: [l, p.t] }];
});

// Dónde se dejan las piezas al mezclar: todas fuera de la placa, sin pisarse (px sobre la placa)
const SCATTER = {
  bat: [48, 305], spk: [-70, 30], 'spk-2': [488, 160], wifi: [60, -60], ram: [250, -70],
  ssd: [410, 300], cpu: [-110, 200], pipe: [-60, 280], fan: [470, 40],
};
// Segunda disposición para "Mezclar de nuevo" (intercambia lados)
const SCATTER_B = {
  bat: [48, -90], spk: [488, 30], 'spk-2': [-70, 150], wifi: [420, 305], ram: [-20, 310],
  ssd: [-100, -40], cpu: [470, 190], pipe: [250, 305], fan: [-120, 100],
};

const LIMITS = { l: [-150, 600], t: [-140, 440] };
const clamp = (v, [lo, hi]) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const scatter = (table) => Object.fromEntries(PIECES.map((p) => [p.key, [...table[p.key]]]));

/**
 * Estado del rompecabezas del despiece.
 * pos: posición actual de cada pieza sobre la placa; placed: piezas ya encajadas.
 */
export function usePuzzle() {
  const [st, setSt] = useState(null); // null = inactivo; { pos, placed: string[], round }

  const start = useCallback(() => setSt({ pos: scatter(SCATTER), placed: [], round: 0 }), []);
  const shuffle = useCallback(() => setSt((s) => {
    const round = (s?.round ?? 0) + 1;
    return { pos: scatter(round % 2 ? SCATTER_B : SCATTER), placed: [], round };
  }), []);
  const stop = useCallback(() => setSt(null), []);
  const solve = useCallback(() => setSt((s) => s && ({ ...s, pos: Object.fromEntries(PIECES.map((p) => [p.key, [...p.home]])), placed: PIECES.map((p) => p.key) })), []);

  /** Mueve una pieza a (l, t). Si estaba encajada, se suelta. */
  const move = useCallback((key, l, t) => setSt((s) => s && ({
    ...s,
    pos: { ...s.pos, [key]: [clamp(l, LIMITS.l), clamp(t, LIMITS.t)] },
    placed: s.placed.includes(key) ? s.placed.filter((k) => k !== key) : s.placed,
  })), []);

  /** Al soltar: si está cerca de su hueco, encaja. */
  const drop = useCallback((key) => setSt((s) => {
    if (!s) return s;
    const piece = PIECES.find((p) => p.key === key);
    if (!piece || dist(s.pos[key], piece.home) > SNAP || s.placed.includes(key)) return s;
    return { ...s, pos: { ...s.pos, [key]: [...piece.home] }, placed: [...s.placed, key] };
  }), []);

  return useMemo(() => ({
    active: st !== null,
    pos: st?.pos ?? null,
    placed: st?.placed ?? [],
    count: st?.placed.length ?? 0,
    total: PIECES.length,
    done: st !== null && st.placed.length === PIECES.length,
    start, shuffle, stop, solve, move, drop,
  }), [st, start, shuffle, stop, solve, move, drop]);
}
