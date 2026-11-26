import { memo, useRef, useState } from 'react';
import { MOBO_H, MOBO_W, PIECES, SNAP } from './usePuzzle';

// Gira con una animación CSS (no con React), así la placa no se redibuja en cada fotograma.
// level: 0 parado, 1 a 3 cada vez más rápido (según la temperatura).
function Fan({ level }) {
  return (
    <svg className={`fan${level ? ` fan--${level}` : ''}`} width="62" height="62" viewBox="0 0 62 62" aria-hidden="true">
      <circle cx="31" cy="31" r="29" fill="none" stroke="#3A3A42" strokeWidth="2" />
      <circle cx="31" cy="31" r="6" fill="#3A3A42" />
      <path
        d="M31 25 C 36 12, 46 12, 48 18 C 42 20, 36 22, 33 26 Z M37 31 C 50 36, 50 46, 44 48 C 42 42, 40 36, 36 33 Z M31 37 C 26 50, 16 50, 14 44 C 20 42, 26 40, 29 36 Z M25 31 C 12 26, 12 16, 18 14 C 20 20, 22 26, 26 29 Z"
        fill="#8C8C92"
      />
    </svg>
  );
}

// Detalles decorativos de la placa (chips pequeños, tornillos, conectores)
const SMD = [
  [205, 30, 10, 6], [205, 122, 10, 6], [300, 120, 14, 8], [150, 134, 8, 8], [176, 134, 8, 8],
  [60, 60, 12, 12], [80, 60, 8, 12], [300, 140, 24, 10], [190, 20, 8, 5],
];
const SCREWS = [[22, 12], [418, 12], [22, 278], [418, 278], [210, 150], [300, 18]];

/** Ejes de la placa en pantalla (px de pantalla por px de placa), leídos de tres marcas de esquina. */
function basis(root) {
  const m = root.querySelectorAll('.mobo-mark');
  if (m.length < 3) return null;
  const c = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const [o, ax, ay] = [c(m[0]), c(m[1]), c(m[2])];
  return { ex: [(ax[0] - o[0]) / MOBO_W, (ax[1] - o[1]) / MOBO_W], ey: [(ay[0] - o[0]) / MOBO_H, (ay[1] - o[1]) / MOBO_H] };
}
/** Movimiento en pantalla (dx, dy) → movimiento sobre la placa (du, dv). */
function toBoard(b, dx, dy) {
  const det = b.ex[0] * b.ey[1] - b.ex[1] * b.ey[0];
  if (Math.abs(det) < 1e-6) return [0, 0];
  return [(dx * b.ey[1] - dy * b.ey[0]) / det, (b.ex[0] * dy - b.ex[1] * dx) / det];
}

const NUDGE = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };

/**
 * Placa base con piezas clicables. En el despiece (e: 0→1) cada pieza se eleva a su altura
 * (`lift`). Con el rompecabezas activo las piezas se arrastran (o se mueven con las flechas)
 * hasta su hueco punteado y encajan al acercarse.
 * fanLevel: velocidad del ventilador (0–3); heat: calor de la CPU (0–4).
 */
function Motherboard({ y, e, part, onPick, active, fanLevel, heat, puzzle }) {
  const rootRef = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const [held, setHeld] = useState(null);
  const playing = puzzle?.active;

  const onPointerDown = (ev, p) => {
    if (!playing) return;
    const b = basis(rootRef.current);
    if (!b) return;
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch { /* puntero ya liberado */ }
    drag.current = { key: p.key, x: ev.clientX, y: ev.clientY, l: puzzle.pos[p.key][0], t: puzzle.pos[p.key][1], b, moved: false };
    setHeld(p.key);
  };
  const onPointerMove = (ev) => {
    const d = drag.current;
    if (!d) return;
    const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    const [du, dv] = toBoard(d.b, dx, dy);
    puzzle.move(d.key, d.l + du, d.t + dv);
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setHeld(null);
    if (d.moved) { suppressClick.current = true; puzzle.drop(d.key); }
  };
  const onKeyDown = (ev, p) => {
    if (!playing || !NUDGE[ev.key]) return;
    ev.preventDefault();
    const [l, t] = puzzle.pos[p.key];
    puzzle.move(p.key, l + NUDGE[ev.key][0], t + NUDGE[ev.key][1]);
    // encaja al acercarse (en la siguiente pulsación ya está en su sitio)
    const next = [l + NUDGE[ev.key][0], t + NUDGE[ev.key][1]];
    if (Math.hypot(next[0] - p.home[0], next[1] - p.home[1]) <= SNAP) puzzle.drop(p.key);
  };
  const pos = (p) => (playing ? puzzle.pos[p.key] : [p.l, p.t]);
  const near = (p) => playing && !puzzle.placed.includes(p.key) && Math.hypot(puzzle.pos[p.key][0] - p.home[0], puzzle.pos[p.key][1] - p.home[1]) <= SNAP * 1.6;

  return (
    <div ref={rootRef} className={`mobo${playing && puzzle.done ? ' is-done' : ''}`} aria-hidden={!active} style={{ transform: `translateY(${y}px) rotateX(90deg)` }}>
      <i className="trace" style={{ left: 20, top: 150, width: 400, height: 2 }} />
      <i className="trace" style={{ left: 200, top: 20, width: 2, height: 130 }} />
      <i className="trace" style={{ left: 100, top: 100, width: 120, height: 2 }} />
      <i className="trace" style={{ left: 300, top: 90, width: 2, height: 60 }} />
      <i className="trace" style={{ left: 150, top: 128, width: 2, height: 22 }} />
      {SMD.map(([l, t, w, h], i) => <i key={`s${i}`} className="smd" style={{ left: l, top: t, width: w, height: h }} />)}
      {SCREWS.map(([l, t], i) => <i key={`t${i}`} className="screw" style={{ left: l - 4, top: t - 4 }} />)}
      <i className="mobo__ports" />
      {/* marcas invisibles en tres esquinas: dicen cómo se ve la placa en pantalla para convertir el arrastre */}
      <i className="mobo-mark" style={{ left: 0, top: 0 }} /><i className="mobo-mark" style={{ left: MOBO_W, top: 0 }} /><i className="mobo-mark" style={{ left: 0, top: MOBO_H }} />

      {/* huecos punteados donde va cada pieza */}
      {playing && PIECES.filter((p) => !puzzle.placed.includes(p.key)).map((p) => (
        <i key={`g${p.key}`} className={`mobo__slot${near(p) ? ' is-near' : ''}`} style={{ left: p.home[0], top: p.home[1], width: p.w, height: p.h, borderRadius: p.r }} />
      ))}

      {PIECES.map((p) => {
        const sel = p.id === part;
        const [l, t] = pos(p);
        const isHeld = held === p.key;
        const placed = playing && puzzle.placed.includes(p.key);
        // En el rompecabezas las piezas bajan casi a ras de la placa: si flotaran a distintas alturas,
        // una pieza que se ve sobre su hueco estaría desplazada por la perspectiva y no encajaría.
        const lift = playing ? (isHeld ? 14 : 3) : (p.lift || 0) * e;
        return (
          <button
            key={p.key}
            type="button"
            className={`mobo__part${sel ? ' is-active' : ''}${p.pipe ? ' mobo__part--pipe' : ''}${p.speaker ? ' mobo__part--speaker' : ''}${playing ? ' is-puzzle' : ''}${isHeld ? ' is-held' : ''}${placed ? ' is-placed' : ''}`}
            aria-label={playing ? `${p.name}${placed ? ' (en su sitio)' : ': usa las flechas para llevarla a su hueco'}` : p.name}
            aria-pressed={sel}
            tabIndex={active && (playing || !p.twin) ? 0 : -1}
            onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } onPick(p.id); }}
            onPointerDown={(ev) => onPointerDown(ev, p)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(ev) => onKeyDown(ev, p)}
            style={{
              left: l, top: t, width: p.w, height: p.h, borderRadius: p.r, background: p.bg,
              transform: `translateZ(${lift}px)`,
              boxShadow: e > 0.05 ? `0 ${Math.round((playing ? (isHeld ? 6 : 2) : 14) * e)}px ${Math.round((playing ? 8 : 20) * e)}px rgba(0,0,0,${0.45 * e})` : undefined,
            }}
          >
            {p.fan ? <Fan level={fanLevel} /> : p.short}
            {p.id === 'cpu' && heat > 0 && <i className="cpu-glow" style={{ opacity: heat / 4 }} />}
          </button>
        );
      })}
    </div>
  );
}

export default memo(Motherboard);
