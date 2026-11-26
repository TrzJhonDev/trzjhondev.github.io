import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clamp, toView, tween } from '../../lib/math3d';
import { PLUG_PATH } from './geometry';

export const FRONT = { rx: -30, ry: -22 };
// Vista con un programa abierto (Jhon, 26/11/2026): girado hacia el otro lado que FRONT y con menos ángulo, mirando a la lista
export const PROJECT_VIEW = { rx: -30, ry: 5 };
export const LID_OPEN = 108;
const LID_MAX = 130;
const RX_MIN = -80, RX_MAX = 40; // se puede inclinar por debajo para ver la base
const ZOOM_MIN = 0.6, ZOOM_MAX = 2.4;
const CLICK_SLOP = 5; // px que puede moverse el puntero y seguir contando como clic

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/** Escala real de .scale-box (cambia en móvil por media queries). */
function boxScale(stage) {
  try {
    const tf = getComputedStyle(stage.querySelector('.scale-box')).transform;
    return tf && tf !== 'none' ? new DOMMatrixReadOnly(tf).a : 1;
  } catch { return 1; }
}

// Grados de tapa por píxel arrastrado (a escala 1). Arrastrar hacia abajo cierra y hacia
// arriba abre: así se mueve el borde superior de la tapa al cerrarla desde casi cualquier
// vista (frente, atrás, arriba), y es lo que espera la mano.
const LID_DEG_PER_PX = 0.45;


/**
 * Todo el estado y las animaciones del portátil 3D.
 * stageRef: ref al contenedor .stage (para pausar fuera de pantalla y medir escala).
 */
// Animación de entrada (en fotogramas del bucle, ~30 por segundo): el portátil aparece cerrado,
// la tapa se abre, arranca la BIOS y luego se iluminan las teclas de izquierda a derecha.
export const BOOT = { open: 12, bios: 34, keys: 84, end: 112 };

// Encendido con el scroll (el pico de la página, scroll-craft 25/11/2026). Con options.bootRef ({ current: p de 0 a 1 })
// la animación de entrada no corre sola: la mueve el scroll. Tramos de p:
//   0 … PRESS      silencio: portátil cerrado y oscuro, solo el logo
//   PRESS          la mascota pulsa el botón A de su pecho (options.onPress)
//   LID0 … LID1    la tapa se abre
//   LID1 … 1       BIOS y teclas que se encienden de izquierda a derecha
// Al llegar al final queda terminada (si vuelves a subir no se "desenciende").
export const SCROLL_BOOT = { press: 0.1, lid0: 0.16, lid1: 0.46, end: 0.97 };

/**
 * Un paso del encendido con el scroll: la tapa se acerca a su ángulo con suavizado por TIEMPO (rate 13/s ≈ el 0,35 por
 * fotograma de 33 ms de antes, pero igual a 30 o a 60 fps) y la BIOS avanza a su fotograma (nunca retrocede).
 */
function scrubBoot(s, sp, dt) {
  const k = (a, b) => Math.min(1, Math.max(0, (sp - a) / (b - a)));
  const lid = LID_OPEN * k(SCROLL_BOOT.lid0, SCROLL_BOOT.lid1);
  const out = { open: s.open + (lid - s.open) * (1 - Math.exp(-dt * 13)) };
  const frame = sp < SCROLL_BOOT.lid1 ? 0 : BOOT.bios + (BOOT.end - BOOT.bios) * k(SCROLL_BOOT.lid1, SCROLL_BOOT.end);
  out.boot = Math.max(s.boot, Math.round(frame));
  if (sp >= SCROLL_BOOT.end || out.boot >= BOOT.end) { out.boot = null; out.typed = 0; out.open = LID_OPEN; }
  return out;
}

/**
 * options.onScreen: qué hacer al hacer clic en la pantalla encendida (abre la terminal).
 */
export function useLaptop(skill, stageRef, options = {}) {
  const optsRef = useRef(options);
  optsRef.current = options;
  const reduced = useRef(reducedMotion());
  const [st, setSt] = useState(() => ({
    rx: FRONT.rx, ry: FRONT.ry, zoom: 1, open: reduced.current ? LID_OPEN : 0,
    boot: reduced.current ? null : 0, // fotograma de la animación de entrada; null = terminada
    cursor: null, // cursor del touchpad en la pantalla: { u, v, t }
    auto: !reduced.current, dragging: null, // 'rotate' | 'lid' | null
    t: 0, typed: 0, running: false, runT: 0,
    explode: 0, exploded: false, part: 'cpu',
    power: true, press: -1, pressUntil: 0, hover: null,
    plug: 0, battery: 64, // cargador: 0 = en el suelo, 1 = enchufado; batería en %
    temp: 0.2, // temperatura de la CPU de 0 a 1 (sube al escribir y ejecutar, baja en reposo)
    runs: 0, // cuántas veces se ha ejecutado el código (reinicia las partículas)
  }));
  const ref = useRef(st);
  ref.current = st;

  const drag = useRef(null);
  const bootLid = useRef(false);
  const openLid = useRef(null);
  const vel = useRef(0);
  const pauseUntil = useRef(0);
  // Con un programa abierto (lista de Proyectos) el portátil no gira solo: se queda de frente para leer la pantalla
  const hold = useRef(false);
  const visible = useRef(true);
  const anims = useRef({});
  const total = skill.code.join('\n').length;
  const totalRef = useRef(total);
  totalRef.current = total;

  const patch = useCallback((p) => setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })), []);

  // Una animación por canal ('view', 'lid', 'explode'): la nueva cancela a la anterior
  const animate = useCallback((key, ms, apply) => {
    anims.current[key]?.();
    anims.current[key] = tween(reduced.current ? 0 : ms, apply);
  }, []);
  const stop = useCallback((key) => { anims.current[key]?.(); anims.current[key] = null; }, []);

  const pressed = useRef(false);
  // Bucle principal (~30 fps). Se pausa cuando el escenario no está en pantalla.
  useEffect(() => {
    const el = stageRef.current;
    let io;
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((list) => { visible.current = list[list.length - 1].isIntersecting; });
      io.observe(el);
    }
    let raf, last = 0, lastScrub = 0;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible.current) return;
      const bootRef = optsRef.current.bootRef;
      const sp = bootRef && ref.current.boot !== null ? bootRef.current : null; // p del encendido con scroll
      // Fluidez (Jhon, 26/11/2026: "se ve tosco"): mientras el scroll mueve el encendido, la tapa y la BIOS se
      // actualizan en CADA fotograma (60 fps) con suavizado por tiempo; el resto del bucle sigue a ~30 fps
      if (sp !== null && now - last < 33) {
        const dt = Math.min(0.05, (now - (lastScrub || now)) / 1000);
        lastScrub = now;
        setSt((s) => (s.boot === null ? s : { ...s, ...scrubBoot(s, sp, dt) }));
        return;
      }
      if (now - last < 33) return;
      const dtFull = Math.min(0.05, (now - (lastScrub || now)) / 1000);
      last = now; lastScrub = now;
      if (sp !== null) {
        bootLid.current = true; // la tapa la abre el scroll, no la animación
        if (sp >= SCROLL_BOOT.press && !pressed.current) { pressed.current = true; optsRef.current.onPress?.(); }
      }
      // La tapa empieza a abrirse en su fotograma de la animación de entrada
      if (ref.current.boot === BOOT.open && !bootLid.current) { bootLid.current = true; openLid.current?.(); }
      setSt((s) => {
        const n = { ...s, t: s.t + 1 };
        if (s.boot !== null && sp !== null) {
          Object.assign(n, scrubBoot(s, sp, dtFull));
        } else if (s.boot !== null) {
          n.boot = s.boot + 1 >= BOOT.end ? null : s.boot + 1;
          if (n.boot === null) n.typed = 0;
        } else if (s.typed < totalRef.current) n.typed = Math.min(totalRef.current, s.typed + 2);
        if (s.running) n.runT = s.runT + 1;
        // Batería: carga con el cargador enchufado, se descarga despacio sin él
        if (s.plug >= 0.999) { if (s.battery < 100) n.battery = Math.min(100, s.battery + 0.05); }
        else if (s.power && s.battery > 5) n.battery = Math.max(5, s.battery - 0.004);
        if (s.press >= 0 && s.t >= s.pressUntil) n.press = -1;
        // Temperatura: ejecutar código la sube al máximo (unos 5 s); escribir, a la mitad
        const goal = !s.power ? 0
          : s.running && s.runT < 150 ? 1
          : s.boot === null && s.typed < totalRef.current ? 0.5 : 0.18;
        n.temp = s.temp + (goal - s.temp) * (goal > s.temp ? 0.06 : 0.018);
        if (!drag.current) {
          if (Math.abs(vel.current) > 0.05) {
            n.ry = s.ry + vel.current;
            vel.current *= 0.93;
          } else if (s.auto && !hold.current && s.boot === null && Date.now() > pauseUntil.current) {
            n.ry = s.ry + 0.3;
          }
        }
        return n;
      });
    };
    raf = requestAnimationFrame(tick);
    // Zoom con Ctrl + rueda (y pellizco en touchpad). Sin Ctrl la rueda sigue haciendo scroll.
    // Se registra a mano porque React marca la rueda como pasiva y no deja cancelar el zoom del navegador.
    const onWheel = (ev) => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      setSt((s) => ({ ...s, zoom: clamp(s.zoom * Math.exp(-ev.deltaY * 0.004), ZOOM_MIN, ZOOM_MAX) }));
    };
    el?.addEventListener('wheel', onWheel, { passive: false });
    const running = anims.current;
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      el?.removeEventListener('wheel', onWheel);
      Object.values(running).forEach((c) => c?.());
    };
  }, [stageRef]);

  const viewTo = useCallback((rx, ry, ms = 850) => {
    const { ry: ry0, rx: rx0 } = ref.current;
    vel.current = 0;
    pauseUntil.current = Date.now() + 6000;
    animate('view', ms, (e) => patch({ ry: ry0 + (ry - ry0) * e, rx: rx0 + (rx - rx0) * e }));
  }, [animate, patch]);

  // Ir a una vista por el camino más corto (sin dar vueltas completas)
  const goTo = useCallback((rx, ryBase) => {
    const ry0 = ref.current.ry;
    viewTo(rx, Math.round((ry0 - ryBase) / 360) * 360 + ryBase);
  }, [viewTo]);

  const setLid = useCallback((target) => {
    const o0 = ref.current.open;
    animate('lid', 700, (e) => patch({ open: o0 + (target - o0) * e }));
  }, [animate, patch]);

  openLid.current = () => setLid(LID_OPEN);
  // Saltar la animación de entrada (al tocar o elegir una skill)
  const skipBoot = useCallback(() => {
    if (ref.current.boot === null) return;
    bootLid.current = true;
    patch({ boot: null, typed: 0 });
    if (ref.current.open < LID_OPEN - 1) setLid(LID_OPEN);
  }, [patch, setLid]);

  // Conector del cargador: anima hasta enchufado (1) o en el suelo (0)
  const setPlug = useCallback((on) => {
    const p0 = ref.current.plug;
    animate('plug', 450, (e) => patch({ plug: p0 + ((on ? 1 : 0) - p0) * e }));
  }, [animate, patch]);

  const setExplode = useCallback((on) => {
    const e0 = ref.current.explode;
    patch({ exploded: on });
    animate('explode', 900, (e) => patch({ explode: e0 + ((on ? 1 : 0) - e0) * e }));
    if (on) {
      if (ref.current.open < 90) setLid(LID_OPEN);
      goTo(-26, -40);
    }
  }, [animate, patch, goTo, setLid]);

  const run = useCallback(() => {
    patch((s) => ({ running: true, runT: 0, typed: 9999, power: true, runs: s.runs + 1 }));
    if (ref.current.open < 80) setLid(LID_OPEN);
  }, [patch, setLid]);

  // Al cambiar de skill: reescribir, girar al frente o abrir el despiece
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    patch({ typed: 0, running: false, runT: 0, power: true });
    if (skill.explode) setExplode(true);
    else {
      if (ref.current.exploded) setExplode(false);
      goTo(FRONT.rx, FRONT.ry);
    }
    if (ref.current.open < 80) setLid(LID_OPEN);
  }, [skill.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clic (sin arrastrar) sobre una pieza del portátil
  const clickPart = useCallback((hit, key) => {
    const s = ref.current;
    if (hit === 'lid') setLid(s.open < 40 ? LID_OPEN : 0);
    else if (hit === 'screen') {
      if (s.open < 40) setLid(LID_OPEN);
      else if (!s.power) patch({ power: true });
      else if (optsRef.current.onScreen) optsRef.current.onScreen();
      else run();
    } else if (hit === 'pad') run();
    else if (hit === 'power') patch((p) => ({ power: !p.power }));
    else if (hit === 'plug') setPlug(s.plug < 0.5);
    else if (hit === 'keys') {
      // Tú tecleas: cada clic escribe un trozo; si ya terminó, vuelve a empezar
      patch((p) => {
        const done = p.typed >= totalRef.current;
        return {
          press: key ?? 0, pressUntil: p.t + 5, power: true,
          typed: done ? 0 : Math.min(totalRef.current, p.typed + 14),
          running: done ? false : p.running, runT: done ? 0 : p.runT,
        };
      });
      if (s.open < 40) setLid(LID_OPEN);
    }
  }, [patch, run, setLid, setPlug]);

  // Puntero: arrastrar para girar, arrastrar la tapa para abrir/cerrar, clic en piezas
  const onPointerDown = (ev) => {
    if (ref.current.boot !== null) skipBoot(); // tocar durante la intro la salta
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    if (ev.target.closest('button,a,input')) return;
    const hitEl = ev.target.closest('[data-hit]');
    const hit = hitEl ? hitEl.dataset.hit : null;
    const keyEl = ev.target.closest('[data-key]');
    const s = ref.current;
    const mode = hit === 'lid' || hit === 'screen' ? 'lid' : hit === 'plug' ? 'plug' : 'rotate';
    drag.current = {
      mode, hit, key: keyEl ? Number(keyEl.dataset.key) : null,
      x: ev.clientX, y: ev.clientY, lx: ev.clientX, ly: ev.clientY, lt: performance.now(),
      rx: s.rx, ry: s.ry, moved: false, scale: boxScale(ev.currentTarget), plug0: s.plug,
    };
    vel.current = 0;
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch { /* puntero ya liberado */ }
  };

  const onPointerMove = (ev) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved) {
      if (Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < CLICK_SLOP) return;
      d.moved = true;
      stop(d.mode === 'lid' ? 'lid' : d.mode === 'plug' ? 'plug' : 'view');
      patch({ dragging: d.mode });
    }
    const mx = ev.clientX - d.lx, my = ev.clientY - d.ly;
    d.lx = ev.clientX; d.ly = ev.clientY;

    if (d.mode === 'plug') {
      // El conector avanza según cuánto se mueve el puntero en la dirección del recorrido en pantalla
      const s = ref.current;
      const k = d.scale * s.zoom;
      const [vx, vy] = toView(PLUG_PATH, s.rx, s.ry);
      const dx = vx * k, dy = vy * k;
      const len2 = dx * dx + dy * dy || 1;
      patch({ plug: clamp(s.plug + (mx * dx + my * dy) / len2, 0, 1) });
    } else if (d.mode === 'lid') {
      const s = ref.current;
      const k = LID_DEG_PER_PX / (d.scale * s.zoom * (1 - 0.24 * s.explode));
      patch({ open: clamp(s.open - my * k, 0, LID_MAX) });
    } else {
      vel.current = mx * 0.45;
      d.lt = performance.now();
      const rx = clamp(d.rx - (ev.clientY - d.y) * 0.3, RX_MIN, RX_MAX);
      patch({ ry: d.ry + (ev.clientX - d.x) * 0.45, rx });
    }
  };

  const endDrag = (asClick) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (!d.moved) {
      if (asClick && d.hit) clickPart(d.hit, d.key);
      return;
    }
    if (d.mode === 'plug') {
      setPlug(ref.current.plug > 0.55); // suelto cerca del puerto: se enchufa; si no, vuelve al suelo
    } else if (d.mode === 'lid') {
      if (ref.current.open < 20) setLid(0); // casi cerrada: termina de cerrarse
    } else {
      if (performance.now() - d.lt > 90) vel.current = 0; // soltó quieto: sin inercia
      pauseUntil.current = Date.now() + 3000;
    }
    patch({ dragging: null });
  };

  const onPointerOver = (ev) => {
    if (drag.current) return;
    const hitEl = ev.target.closest('[data-hit]');
    const hover = hitEl ? hitEl.dataset.hit : null;
    if (hover) pauseUntil.current = Date.now() + 4000; // quieto mientras apuntas a una pieza
    if (hover !== ref.current.hover) patch({ hover });
  };

  // Doble clic en el fondo: volver a la vista frontal
  const onDoubleClick = (ev) => {
    if (ev.target.closest('button,a,[data-hit]')) return;
    goTo(FRONT.rx, FRONT.ry);
  };

  // Teclado cuando el escenario tiene el foco
  const onKeyDown = (ev) => {
    if (ev.target !== ev.currentTarget) return;
    const s = ref.current;
    const keys = {
      ArrowLeft: () => viewTo(s.rx, s.ry - 20, 300),
      ArrowRight: () => viewTo(s.rx, s.ry + 20, 300),
      ArrowUp: () => viewTo(clamp(s.rx - 10, RX_MIN, RX_MAX), s.ry, 300),
      ArrowDown: () => viewTo(clamp(s.rx + 10, RX_MIN, RX_MAX), s.ry, 300),
      Home: () => goTo(FRONT.rx, FRONT.ry),
      t: () => optsRef.current.onScreen?.(),
      T: () => optsRef.current.onScreen?.(),
      ' ': () => setLid(s.open > 40 ? 0 : LID_OPEN),
      Enter: run,
      '+': () => actions.zoomIn(),
      '=': () => actions.zoomIn(),
      '-': () => actions.zoomOut(),
    };
    if (keys[ev.key]) { ev.preventDefault(); keys[ev.key](); }
  };

  const pointer = {
    onPointerDown, onPointerMove, onPointerOver, onDoubleClick, onKeyDown,
    onPointerUp: () => endDrag(true),
    onPointerCancel: () => endDrag(false), // p. ej. el navegador tomó el gesto para hacer scroll
    onPointerLeave: () => { if (!drag.current && ref.current.hover) patch({ hover: null }); },
  };

  // Acciones estables (misma referencia entre renders) para que las piezas memorizadas
  // como el teclado o la placa base no se vuelvan a dibujar sin necesidad
  const actions = useMemo(() => ({
    goTo,
    front: () => goTo(FRONT.rx, FRONT.ry),
    setLid,
    toggleLid: () => setLid(ref.current.open > 40 ? 0 : LID_OPEN),
    setExplode,
    toggleExplode: () => setExplode(!ref.current.exploded),
    run,
    retype: () => patch({ typed: 0, running: false, runT: 0, power: true }),
    togglePower: () => patch((s) => ({ power: !s.power })),
    /** Detiene (true) o devuelve (false) el giro automático, sin tocar la preferencia del usuario (auto). */
    hold: (on) => { hold.current = on; },
    toggleAuto: () => { pauseUntil.current = 0; patch((s) => ({ auto: !s.auto })); },
    zoomIn: () => patch((s) => ({ zoom: Math.min(ZOOM_MAX, Math.round((s.zoom + 0.1) * 10) / 10) })),
    zoomOut: () => patch((s) => ({ zoom: Math.max(ZOOM_MIN, Math.round((s.zoom - 0.1) * 10) / 10) })),
    skipBoot,
    /** Ilumina una tecla del portátil (cuando se pulsa la misma tecla física). */
    pressKey: (i) => patch((s) => ({ press: i, pressUntil: s.t + 4 })),
    /** Mueve el cursor de la pantalla (u, v de 0 a 1 sobre el touchpad). */
    moveCursor: (u, v) => patch((s) => ({ cursor: { u: clamp(u, 0, 1), v: clamp(v, 0, 1), t: s.t } })),
    togglePlug: () => setPlug(ref.current.plug < 0.5),
    pickPart: (id) => {
      patch({ part: id });
      if (!ref.current.exploded) setExplode(true);
    },
  }), [goTo, setLid, setExplode, setPlug, skipBoot, run, patch]);

  return { st, pointer, actions };
}
