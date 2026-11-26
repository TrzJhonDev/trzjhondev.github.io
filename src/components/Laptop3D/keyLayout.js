// Distribución del teclado del portátil (español).
// Coordenadas en px dentro de la capa de teclas (480×320, origen arriba a la izquierda).
// Cada fila suma 15 unidades de ancho; `u` es el ancho relativo de la tecla.

export const KB = { x: 48, y: 62, w: 384, gap: 3 };

const R = (h, keys) => ({ h, keys: keys.map((k) => (Array.isArray(k) ? k : [k, 1])) });

const ROWS = [
  R(12, [['esc', 1.5], 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', ['supr', 1.5]]),
  R(20, ['º', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', "'", '¡', ['⌫', 2]]),
  R(20, [['tab', 1.5], 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '`', '+', ['ç', 1.5]]),
  R(20, [['bloq', 1.75], 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ', '´', ['intro', 2.25]]),
  R(20, [['⇧', 2.25], 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '-', ['⇧', 2.75]]),
  R(20, ['fn', 'ctrl', 'win', ['alt', 1.25], ['', 5.5], ['alt gr', 1.25], 'ctrl', '←', '↓', '→']),
];

// Teclas que llevan una skill: fila 1 (de "1" a "¡") y fila 2 (Q, W, E) → 15 teclas
const SKILL_SLOTS = [
  ...Array.from({ length: 12 }, (_, i) => [1, i + 1]),
  [2, 1], [2, 2], [2, 3],
];

function build() {
  const keys = [];
  let y = KB.y;
  ROWS.forEach((row, r) => {
    const units = row.keys.reduce((a, [, u]) => a + u, 0);
    const unit = (KB.w - (row.keys.length - 1) * KB.gap) / units;
    let x = KB.x;
    row.keys.forEach(([label, u], c) => {
      const w = unit * u;
      keys.push({ label, x, y, w, h: row.h, row: r, col: c });
      x += w + KB.gap;
    });
    y += row.h + KB.gap;
  });
  return keys;
}

export const KEYS = build();
export const KB_BOTTOM = KEYS[KEYS.length - 1].y + KEYS[KEYS.length - 1].h;

/** Índice en KEYS de la tecla que lleva la skill número i. */
export const SKILL_KEY_INDEX = SKILL_SLOTS.map(([r, c]) => KEYS.findIndex((k) => k.row === r && k.col === c));

/** Teclas de letras normales (para la animación de tecleo). */
export const LETTER_KEYS = KEYS
  .map((k, i) => ({ k, i }))
  .filter(({ k, i }) => k.row >= 2 && k.row <= 4 && /^[A-ZÑ]$/.test(k.label) && !SKILL_KEY_INDEX.includes(i))
  .map(({ i }) => i);

/** Centro de una tecla en coordenadas de la capa (para ubicar el holograma). */
export const keyCenter = (k) => [k.x + k.w / 2, k.y + k.h / 2];

// Código físico (KeyboardEvent.code) de cada tecla, fila por fila, en el mismo orden que ROWS.
// Con la distribución española, por ejemplo, la Ñ es la tecla física "Semicolon".
const D = (s) => s.split(' ');
const CODES = [
  ['Escape', ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`), 'Delete'],
  ['Backquote', ...D('Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0'), 'Minus', 'Equal', 'Backspace'],
  ['Tab', ...D('KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP'), 'BracketLeft', 'BracketRight', 'Backslash'],
  ['CapsLock', ...D('KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL'), 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', ...D('KeyZ KeyX KeyC KeyV KeyB KeyN KeyM'), 'Comma', 'Period', 'Slash', 'ShiftRight'],
  [null, 'ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'ControlRight', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],
];

/** Índice en KEYS de la tecla física pulsada (KeyboardEvent.code), o -1 si no está en el portátil. */
const CODE_INDEX = new Map(KEYS.map((k, i) => [CODES[k.row][k.col], i]).filter(([c]) => c));
export const keyIndexForCode = (code) => CODE_INDEX.get(code) ?? -1;
