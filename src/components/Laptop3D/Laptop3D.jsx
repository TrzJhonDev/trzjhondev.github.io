import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { boot } from '../../lib/boot';
import { SKILLS, PARTS } from '../../data/skills';
import { DEG, LIGHT, billboard, easeInOut, hexA, rotX } from '../../lib/math3d';
import { useLaptop, BOOT, FRONT, LID_OPEN, PROJECT_VIEW } from './useLaptop';
import { useGuide } from '../Mascot/Guide';
import { useTerminal } from './useTerminal';
import { useLayout, COL_RIGHT } from './useLayout';
import { HALF_D, HALF_W, layers } from './geometry';
import { KEYS, SKILL_KEY_INDEX, LETTER_KEYS, keyCenter, keyIndexForCode } from './keyLayout';
import { usePuzzle } from './usePuzzle';
import { CodeGlyphs } from './Effects';
import { isRunning } from './Screen';
import Base from './Base';
import Deck from './Deck';
import Keyboard from './Keyboard';
import Lid from './Lid';
import Hinge from './Hinge';
import Charger from './Charger';
import Motherboard from './Motherboard';
import { Hologram, FlyingHologram } from './Hologram';
import './Laptop3D.css';

// ¿Hay puntero que pueda "pasar por encima"? (ratón o touchpad; no en móviles y tabletas táctiles). Se mira una vez.
const CAN_HOVER = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

// Modelo de Blender dibujado con WebGL (PLAN-PORTATIL-3D.md). Se carga aparte; mientras tanto (o sin WebGL) se ve el CSS.
const LaptopGL = lazy(() => import('./gl/LaptopGL.jsx'));

// Partículas del fondo (fijas, se desplazan con parallax)
const DOTS = Array.from({ length: 18 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53 + 11) % 100, s: 2 + (i % 3), alt: i % 2 }));

/**
 * Posición del puntero sobre el touchpad (u, v de 0 a 1). Usa las marcas de tres esquinas
 * (.pad-mark) para saber cómo se proyecta en pantalla y resuelve el sistema 2×2.
 * (offsetX no sirve: en elementos con transformación 3D no es fiable en todos los navegadores.)
 */
function padUV(pad, x, y) {
  const m = pad.querySelectorAll('.pad-mark');
  if (m.length < 3) return null;
  const c = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const [o, ax, ay] = [c(m[0]), c(m[1]), c(m[2])];
  const ex = [ax[0] - o[0], ax[1] - o[1]], ey = [ay[0] - o[0], ay[1] - o[1]];
  const det = ex[0] * ey[1] - ex[1] * ey[0];
  if (Math.abs(det) < 1e-3) return null;
  const px = x - o[0], py = y - o[1];
  return [(px * ey[1] - py * ey[0]) / det, (ex[0] * py - ex[1] * px) / det];
}

const BEAM_FRAMES = 16; // duración del vuelo del holograma a la pantalla (~0,5 s)
const tr = ([x, y, z]) => `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px)`;

/**
 * Portátil 3D hecho solo con HTML + CSS 3D (transform / preserve-3d), a pantalla completa.
 * Las piezas están en Base, Deck, Keyboard, Lid, Motherboard y Hologram; este componente
 * coordina el estado (useLaptop) y la colocación (useLayout).
 * Props:
 *  - skill:            skill seleccionada (de data/skills.js)
 *  - onPickSkill:      (skill) => void
 *  - onExplodedChange: (bool) => void, para que la portada oculte el texto en el despiece
 */
export default function Laptop3D({ skill, onPickSkill, onExplodedChange, bootRef, project = null }) {
  const stageRef = useRef(null);
  // Clic en la pantalla encendida: abre la terminal (la referencia evita depender del orden de los hooks)
  const termRef = useRef(null);
  // bootRef: el encendido lo mueve el scroll de Projects.jsx; al empezar, la mascota pulsa el botón de su pecho
  const pressRef = useRef(null);
  const { st, pointer, actions } = useLaptop(skill, stageRef, {
    onScreen: () => termRef.current?.openTerminal(),
    bootRef,
    onPress: () => pressRef.current?.(),
  });
  const skillRef = useRef(skill);
  skillRef.current = skill;
  const term = useTerminal({
    getSkill: () => skillRef.current,
    onPickSkill: (s) => { actions.skipBoot(); onPickSkill(s); },
    onRun: actions.run,
  });
  termRef.current = term;
  const layout = useLayout(stageRef);
  const [hoverSkill, setHoverSkill] = useState(null); // índice en SKILLS
  const [beam, setBeam] = useState(null); // { i, start }
  const [gl, setGl] = useState('loading'); // 'loading' | 'ready' | 'failed'
  // El modelo del portátil no compite con la pantalla de carga: se pide cuando la mascota ya aterrizó y el navegador
  // tiene un momento libre (PLAN-PANTALLA-CARGA.md, punto 5). Mientras tanto se ve el portátil CSS.
  const [glGo, setGlGo] = useState(false);
  useEffect(() => {
    let id = 0;
    const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 200));
    const go = () => { id = idle(() => setGlGo(true), { timeout: 1500 }); };
    if (!boot.active) { go(); return undefined; }
    const off = boot.on(() => { if (boot.finished) { off(); go(); } });
    return () => { off(); (window.cancelIdleCallback || window.clearTimeout)(id); };
  }, []);
  const { rx, ry, zoom, t, explode: e } = st;
  const tRef = useRef(t);
  tRef.current = t;

  // En el despiece el texto de presentación se oculta y el portátil usa su sitio
  const cx = layout.cx + (layout.ecx - layout.cx) * e;
  const fit = layout.fit + (layout.efit - layout.fit) * e;
  const cy = layout.cy - (layout.desktop ? 20 * e : 40 * e);
  useEffect(() => { onExplodedChange?.(st.exploded); }, [st.exploded, onExplodedChange]);

  // La mascota (guía) acompaña al portátil: comenta la skill elegida, ejecutar y el despiece, y si lo dejas inclinado
  // un rato ofrece enderezarlo (solo la inclinación vertical: el portátil ya gira solo en horizontal).
  const guide = useGuide();
  const laptopGuide = guide?.laptop;
  pressRef.current = () => laptopGuide?.press?.();
  const prevSkill = useRef(skill.id);
  useEffect(() => {
    if (prevSkill.current === skill.id) return;
    prevSkill.current = skill.id;
    laptopGuide?.skill(skill);
  }, [skill, laptopGuide]);
  const prevRuns = useRef(st.runs);
  useEffect(() => {
    if (prevRuns.current === st.runs) return;
    prevRuns.current = st.runs;
    laptopGuide?.run();
  }, [st.runs, laptopGuide]);
  useEffect(() => { if (st.exploded) laptopGuide?.exploded(); }, [st.exploded, laptopGuide]);
  const tilted = Math.abs(rx - FRONT.rx) > 14;
  useEffect(() => {
    if (!tilted || st.dragging || st.exploded) return undefined;
    const id = window.setTimeout(() => laptopGuide?.tilted(), 6000);
    return () => window.clearTimeout(id);
  }, [tilted, st.dragging, st.exploded, laptopGuide]);
  useEffect(() => laptopGuide?.register({ straighten: () => actions.front() }), [laptopGuide, actions]);

  // Abrir un programa de la lista (Projects.jsx): el portátil se pone a punto para enseñarlo en la pantalla
  // (salta el arranque, enciende, abre la tapa, sale del despiece y de la terminal). Se compara por archivo, no por objeto.
  const projectFile = project?.file ?? null;
  const stRef = useRef(st);
  stRef.current = st;
  useEffect(() => {
    actions.hold(!!projectFile); // abierto: no gira solo (petición de Jhon, 26/11/2026)
    if (!projectFile) return;
    const s = stRef.current;
    actions.goTo(PROJECT_VIEW.rx, PROJECT_VIEW.ry); // casi de frente, girado un poco hacia la lista
    actions.skipBoot();
    if (!s.power) actions.togglePower();
    if (s.exploded) actions.setExplode(false);
    if (s.open < 80) actions.setLid(LID_OPEN);
    termRef.current?.close();
  }, [projectFile, actions]);

  // Rompecabezas del despiece: se cancela al cerrar el despiece
  const puzzle = usePuzzle();
  const stopPuzzle = puzzle.stop;
  useEffect(() => { if (!st.exploded) stopPuzzle(); }, [st.exploded, stopPuzzle]);

  const o = Math.max(0, Math.min(130, st.open));
  const L = layers(e);
  const view = { rx, ry, light: LIGHT }; // luz fija (arriba a la izquierda)
  // Al inclinar la vista por debajo del horizonte el suelo se desvanece para dejar ver la base
  const floorOp = rx > 0 ? Math.max(0, 1 - rx / 14) : 1;
  const bb = billboard(rx, ry);
  const running = isRunning(st.running, st.runT, skill);
  const screenOn = st.power && o > 20;
  const plugged = st.plug >= 0.999;
  const lidPoint = (p) => { const r = rotX(p, (o - 90) * DEG); return [r[0], r[1] + L.lidY, r[2] + L.lidZ]; };
  const keyPoint = (k, up = 4) => { const [x, y] = keyCenter(k); return [-HALF_W + x, L.keysY - up, -HALF_D + y]; };

  // Luz que la pantalla proyecta sobre el teclado (más fuerte cuanto más abierta)
  const glow = screenOn ? Math.min(1, (o - 20) / 70) * (1 - 0.7 * e) : 0;

  // Teclas: la pulsada se hunde; durante el tecleo automático se pulsan letras
  const typingDone = st.typed >= skill.code.join('\n').length;
  const booting = st.boot !== null;
  const pressIdx = st.press >= 0 ? st.press
    : booting || typingDone || !st.power || project ? -1 : LETTER_KEYS[Math.floor(st.typed / 3) * 7 % LETTER_KEYS.length];

  // Funciones estables para que el teclado memorizado no se redibuje en cada fotograma
  const pick = useCallback((i) => {
    actions.skipBoot();
    setBeam({ i, start: tRef.current });
    onPickSkill(SKILLS[i]);
  }, [onPickSkill, actions]);
  const hoverKey = useCallback((i, on) => setHoverSkill((v) => (on ? i : v === i ? null : v)), []);

  // Vuelo del holograma de la tecla a la pantalla, y destello al llegar
  const beamK = beam ? t - beam.start : 999;
  const flash = beamK < 11 ? 0 : beamK < 15 ? (beamK - 11) / 4 : beamK < 28 ? 1 - (beamK - 15) / 13 : 0;
  let flying = null;
  if (beam && beamK < BEAM_FRAMES) {
    const p = easeInOut(Math.max(0, beamK) / BEAM_FRAMES);
    const from = keyPoint(KEYS[SKILL_KEY_INDEX[beam.i]], 60);
    const to = lidPoint([0, -164, L.screenZ + 6]);
    flying = {
      skill: SKILLS[beam.i],
      transform: tr(from.map((v, j) => v + (to[j] - v) * p)) + bb,
      scale: 1 - 0.65 * p,
      opacity: p < 0.8 ? 1 : (1 - p) / 0.2,
    };
  }

  // Etiquetas del despiece (a la derecha y a la izquierda para no amontonarse)
  const labels = [
    { text: 'Pantalla', p: lidPoint([270, -200, L.screenZ]) },
    { text: 'Teclado', p: [270, L.keysY, 30] },
    { text: 'Carcasa superior', p: [270, L.deckY, 120] },
    { text: 'Placa base', p: [270, L.mbY, 70] },
    { text: 'Carcasa inferior', p: [270, L.bottomY, 110] },
    { text: 'Carcasa de la tapa', p: lidPoint([-270, -250, -3]), left: true },
    { text: 'Touchpad', p: [-120, L.deckY - L.padLift, 93], left: true },
    { text: 'Componentes', p: [-270, L.mbY - 55 * e, -60], left: true },
  ];

  const blink = Math.floor(t / 15) % 2 === 0;
  const part = PARTS.find((p) => p.id === st.part);
  const hovered = hoverSkill != null ? SKILLS[hoverSkill] : null;

  const showHolo = hovered && e < 0.3 && !(flying && beam.i === hoverSkill);

  // Efectos de temperatura y de ejecución
  const hotLevel = Math.round(Math.max(0, (st.temp - 0.5) / 0.5) * 4); // 0–4: brillo de la CPU
  const fanLevel = !st.power ? 0 : st.temp > 0.75 ? 3 : st.temp > 0.4 ? 2 : 1;
  // Modo ligero (pantallas estrechas / móvil): sin partículas
  const lite = !layout.desktop;
  const showGlyphs = !lite && st.running && st.runT < 100 && screenOn && e < 0.3;
  const lit = !booting ? null : st.boot < BOOT.keys ? 0 : (st.boot - BOOT.keys) / (BOOT.end - BOOT.keys);
  const sceneTransform = `translateY(${-20 * e}px) scale(${zoom * (1 - 0.4 * e)}) rotateX(${rx}deg) rotateY(${ry}deg)`;
  // Lo que necesita la capa WebGL para dibujar el portátil exactamente donde están las piezas CSS
  const glFrame = {
    w: layout.w, h: layout.h, cx, cy, fit, ox: cx, oy: cy - layout.h * 0.3, k: zoom * (1 - 0.4 * e), ty: -20 * e, rx, ry,
    L, e, open: o, skill, hover: hoverSkill ?? -1, press: pressIdx, power: st.power, lit, plug: st.plug, hidden: e > 0.05,
    ledOn: st.power && (blink || running), plugged, battery: st.battery, camOn: running, fan: fanLevel, heat: hotLevel, puzzle,
  };

  const HINTS = {
    lid: o < 40 ? 'Clic para abrir la tapa · o arrástrala' : 'Arrastra la tapa para cerrarla · clic la cierra',
    screen: o < 40 ? 'Clic para abrir la tapa' : term.open ? 'Escribe un comando (ayuda) · Esc para salir' : 'Clic en la pantalla para abrir la terminal · arrástrala para mover la tapa',
    keys: 'Clic en las letras para escribir',
    pad: 'Mueve el puntero por el touchpad · clic ejecuta el código',
    power: st.power ? 'Clic para apagar la pantalla' : 'Clic para encender la pantalla',
    skill: hovered ? `Clic para cargar ${hovered.name} en el portátil` : '',
    plug: plugged ? 'Clic en el cargador para desenchufarlo' : 'Arrastra el cargador hasta el puerto USB-C de la izquierda (o haz clic)',
  };
  const hint = (st.dragging === 'lid' && 'Suelta para dejar la tapa así')
    || (st.dragging === 'plug' && (st.plug > 0.55 ? 'Suelta para enchufar' : 'Acércalo al puerto USB-C'))
    || (st.hover && HINTS[st.hover])
    // En pantallas táctiles no hay puntero que pasar (CAN_HOVER, abajo)
    || (CAN_HOVER ? 'Pasa el puntero por las teclas de colores: son mis skills' : 'Toca las teclas de colores: son mis skills');

  return (
    <div className="laptop-wrap">
      <div
        ref={stageRef}
        className={`stage${st.dragging ? ' is-dragging' : ''}${gl === 'ready' ? ' is-gl' : ''}`}
        role="group"
        aria-roledescription="escena 3D"
        aria-label={`Portátil 3D interactivo mostrando ${skill.name}`}
        aria-describedby="stage-help"
        tabIndex={0}
        {...pointer}
        onPointerMove={(ev) => {
          pointer.onPointerMove(ev);
          // Touchpad: la posición del puntero sobre él mueve el cursor de la pantalla
          if (!st.dragging && ev.target.dataset?.hit === 'pad') { const uv = padUV(ev.target, ev.clientX, ev.clientY); if (uv) actions.moveCursor(uv[0], uv[1]); }
        }}
        style={{
          '--skill': skill.color, '--fit': fit, '--holo': layout.holo,
          '--cx': `${cx}px`, '--cy': `${cy}px`, '--col-left': `${layout.colLeft}px`, '--col-right': `${layout.desktop ? COL_RIGHT : 24}px`,
          perspectiveOrigin: `${cx}px ${cy - layout.h * 0.3}px`,
        }}
      >
        <p id="stage-help" className="sr-only">
          Con el foco aquí: flechas para girar (flecha abajo inclina la vista para ver la base), espacio abre o cierra la tapa, Enter ejecuta el código, T abre la terminal,
          más y menos (o Ctrl + rueda) para el zoom, Inicio vuelve a la vista frontal. El cargador que descansa junto a la batería, a la izquierda, se arrastra hasta el puerto USB-C. Las teclas de colores del teclado eligen una skill.
        </p>
        <p className="sr-only" aria-live="polite">Skill cargada: {skill.name}, categoría {skill.cat}.</p>
        {/* Terminal: campo real (oculto) donde se escribe; la pantalla 3D muestra lo escrito */}
        <input
          ref={term.inputRef}
          className="term-input"
          type="text"
          tabIndex={-1}
          aria-label="Terminal del portátil: escribe un comando (por ejemplo, ayuda) y pulsa Intro. Esc para salir."
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
          value={term.input}
          onChange={(ev) => term.setInput(ev.target.value)}
          onKeyDown={(ev) => {
            const k = keyIndexForCode(ev.code);
            if (k >= 0) actions.pressKey(k); // la misma tecla se hunde en el portátil
            term.onKeyDown(ev);
          }}
          onBlur={term.close}
        />
        <div className="sr-only" aria-live="polite">{term.open ? term.lines.slice(-3).map((l) => l.text).join('. ') : ''}</div>

        <div className="parallax" style={{ transform: `translateX(${Math.sin(ry * DEG) * 26}px)` }} aria-hidden="true">
          {!lite && DOTS.map((d, i) => (
            <i key={i} className="dot" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, background: d.alt ? 'var(--skill)' : 'var(--dot)' }} />
          ))}
        </div>

        {/* Suelo y sombra: debajo del modelo WebGL (la misma escena, en su propia caja) */}
        <div className="scale-box" aria-hidden="true">
          <div className="scene" style={{ transform: sceneTransform }}>
            {/* suelo con cuadrícula que gira con el portátil */}
            <div className="floor" aria-hidden="true" style={{ transform: `translateY(${L.floorY + 1}px) rotateX(90deg)`, opacity: floorOp, visibility: floorOp ? 'visible' : 'hidden' }} />
            <div
              className="floor-shadow"
              aria-hidden="true"
              style={{
                transform: `translateY(${L.floorY}px) rotateX(90deg) scale(${L.shadowS})`,
                opacity: floorOp, visibility: floorOp ? 'visible' : 'hidden',
                background: `radial-gradient(closest-side, var(--floor-shadow), transparent), radial-gradient(closest-side, ${hexA(skill.color, 0.28 * glow)}, transparent 120%)`,
              }}
            />

          </div>
        </div>
        {/* Piezas CSS: con el modelo WebGL listo (.is-gl) quedan invisibles pero siguen recibiendo clics y arrastres.
            La pantalla (CSS) se ve a través de un hueco transparente que el modelo deja en su sitio (glEngine.js) */}
        <div className="scale-box">
          <div className="scene" style={{ transform: sceneTransform }}>
            <Base L={L} view={view} power={st.power} ledOn={st.power && (blink || running)} plugged={plugged} battery={st.battery} />
            <Charger plug={st.plug} hidden={e > 0.05} view={view} led={plugged ? (st.battery >= 100 ? "#8FD8FF" : "#BCC2CC") : undefined} />
            <Motherboard y={L.mbY} e={e} part={st.part} onPick={actions.pickPart} active={st.exploded} fanLevel={fanLevel} heat={hotLevel} puzzle={puzzle} />
            <Deck L={L} view={view} color={skill.color} power={st.power} glow={glow} />
            <Hinge L={L} view={view} />
            <Keyboard
              keysY={L.keysY} pressIdx={pressIdx} skillId={skill.id} color={skill.color} power={st.power}
              hoverSkill={hoverSkill} interactive={e <= 0.5} onPick={pick} onHover={hoverKey}
              lit={lit}
            />
            <Lid
              L={L} open={o} view={view} skill={skill} power={st.power} camOn={running}
              zoom={zoom * fit} screen={{ typed: st.typed, running: st.running, runT: st.runT, t, on: screenOn, flash, battery: st.battery, charging: plugged && st.battery < 100, temp: st.temp,
                bios: booting && st.boot < BOOT.keys ? { k: st.boot - BOOT.bios, total: BOOT.keys - BOOT.bios } : null,
                terminal: term.open ? { lines: term.lines, input: term.input } : null,
                project,
                cursor: st.cursor && t - st.cursor.t < 90 ? st.cursor : null }}
            />

          </div>
        </div>

        {/* Modelo WebGL: encima de las piezas CSS (que no se ven) y de la pantalla (que se ve por su hueco) */}
        {gl !== 'failed' && glGo && (
          <Suspense fallback={null}>
            <LaptopGL frame={glFrame} onReady={() => setGl('ready')} onError={() => setGl('failed')} />
          </Suspense>
        )}

        {/* Hologramas, partículas de código y etiquetas del despiece: por encima de todo */}
        <div className="scale-box" aria-hidden="true">
          <div className="scene" style={{ transform: sceneTransform }}>
            {showHolo && <Hologram skill={hovered} transform={tr(keyPoint(KEYS[SKILL_KEY_INDEX[hoverSkill]])) + bb} />}
            {flying && <FlyingHologram {...flying} />}
            {showGlyphs && <CodeGlyphs skill={skill} runs={st.runs} transform={tr(lidPoint([0, -110, L.screenZ + 6])) + bb} />}

            {/* ETIQUETAS DEL DESPIECE */}
            {labels.map((lb) => (
              <div key={lb.text} className="anchor" aria-hidden="true" style={{ transform: tr(lb.p) + bb, opacity: Math.max(0, (e - 0.4) / 0.6), pointerEvents: 'none' }}>
                <div className={`part-label${lb.left ? ' part-label--left' : ''}`}>
                  <i />
                  <span>{lb.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stage__skill" aria-hidden="true">
          <i style={{ background: skill.color }} />
          <span>{skill.name}</span>
          <small>{skill.cat}</small>
        </div>

        <div className="stage__bottom">
          <div className="stage__hint" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
            <span>{hint}</span>
          </div>
        </div>

        {st.exploded && (
          <div className="part-info">
            <div className="part-info__head">
              <span className="part-info__badge">Vista despiece</span>
              <button type="button" className="part-info__close" onClick={() => actions.setExplode(false)}>Cerrar despiece</button>
            </div>
            <h3>{part.name}</h3>
            <p>{part.info}</p>
            {puzzle.active ? (
              <div className="puzzle">
                <span className="puzzle__count" role="status">
                  {puzzle.done ? '¡Armado! Todas las piezas están en su sitio.' : `${puzzle.count} de ${puzzle.total} piezas en su sitio`}
                </span>
                <div className="puzzle__bar"><i style={{ width: `${(puzzle.count / puzzle.total) * 100}%` }} /></div>
                <span className="part-info__tip">Arrastra cada pieza hasta su hueco punteado. Con teclado: enfoca una pieza y usa las flechas.</span>
                <div className="puzzle__btns">
                  <button type="button" onClick={puzzle.shuffle}>Mezclar de nuevo</button>
                  <button type="button" onClick={puzzle.solve}>Resolver</button>
                  <button type="button" onClick={puzzle.stop}>Salir</button>
                </div>
              </div>
            ) : (
              <>
                <span className="part-info__tip">Pulsa las piezas elevadas sobre la placa base para ver qué hace cada una.</span>
                <button type="button" className="part-info__puzzle" onClick={puzzle.start}>Armar rompecabezas</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
