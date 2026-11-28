import { useEffect, useRef, useState } from 'react';
import { TIPS } from '../../data/tips';
import { GAMES, H, W } from './consoleGames';
import { boot } from '../../lib/boot';

/**
 * Consola del pecho de la mascota: una pantallita (canvas de W×H) con tres estados.
 *  - standby: el logotipo TRZ_ y, en la mascota grande, "clic: jugar".
 *  - tips: cuando el ratón lleva un rato quieto y la mascota "teclea", escribe datos cortos y útiles (src/data/tips.js).
 *  - cargando: durante la pantalla de carga (PLAN-PANTALLA-CARGA.md) dice CARGANDO con una barra y el porcentaje
 *    reales (lib/boot.js); al terminar, LISTO. Lo enciende la mascota con link.current.loading(true | false).
 *  - menu / game: tres minijuegos (consoleGames.js) con flechas o WASD, espacio y Esc. También se juega con los botones de la consola.
 *    Mientras se juega la consola "suena" solo en lo visual: el ecualizador de la píldora baila y la pantalla late (clase .is-playing).
 *    No hay audio de ningún tipo: ni se reproduce ni se escucha nada (Jhon no quiere micrófono ni compartir audio).
 * Todo se pinta directamente en el DOM y el canvas (sin re-renderizar). Solo la mascota grande ('hero') es interactiva;
 * la pequeña ('mini') muestra el logotipo y los datos.
 * `link` es un ref que comparte la mascota: aquí se registra link.current.typing(bool), que ella llama al empezar o dejar de teclear,
 * y se publica link.current.busy (menú o juego abiertos: la mascota no teclea ni saca su mini teclado).
 */

// Acciones para el botón accesible de la portada (Portrait.jsx), que vive fuera de la escena 3D
// (y para la mascota 3D, que pulsa la pantalla y los botones de su modelo: press(tecla, abajo) y screen())
export const consoleCtl = { open: () => {}, press: () => {}, screen: () => {} };

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'action', Enter: 'action', Escape: 'back',
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const RES = 2; // el canvas se dibuja al doble de W×H para que los bordes salgan nítidos (los juegos siguen usando coordenadas de W×H)
const MAX_COLS = 17; // letra grande = pocas columnas: una línea más larga se parte sola por las palabras
const wrapLine = (l) => {
  if (l.length <= MAX_COLS) return [l];
  const out = [];
  let cur = '';
  l.split(' ').forEach((w) => {
    if (cur && cur.length + 1 + w.length > MAX_COLS) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  });
  out.push(cur);
  return out;
};
const record = (id) => { try { return Number(localStorage.getItem(`mascota-record-${id}`)) || 0; } catch { return 0; } };
const saveRecord = (id, v) => { try { localStorage.setItem(`mascota-record-${id}`, String(v)); } catch { /* sin almacenamiento */ } };

// games: false = la grande sin juegos (portada de la web en Astro: los juegos viven en /lab); por defecto, los de la grande
export default function Console({ variant = 'hero', link, games }) {
  const hero = variant !== 'mini';
  const play = games ?? hero;
  const rootRef = useRef(null), canvasRef = useRef(null), textRef = useRef(null), hudRef = useRef(null);
  const act = useRef({ press: () => {}, screen: () => {} });
  const [down, setDown] = useState(''); // botón de la consola que se está pulsando (solo para resaltarlo)

  useEffect(() => {
    const root = rootRef.current, cv = canvasRef.current, g = cv.getContext('2d'), text = textRef.current, hud = hudRef.current;
    g.setTransform(RES, 0, 0, RES, 0, 0);
    const C = {
      user: null, typing: false, mode: '', gi: 0, game: null, over: false, visible: true,
      io: { held: new Set(), pressed: new Set() }, raf: 0, timer: 0, last: 0, pal: null,
      order: TIPS.map((_, i) => i).sort(() => Math.random() - 0.5), ti: 0,
    };

    const readPal = () => {
      const s = getComputedStyle(root.closest('.mascot') || root), v = (n) => s.getPropertyValue(n).trim();
      return { lit: v('--m-lit'), mid: v('--m-mid'), hot: v('--m-hot'), silver: v('--m-silver') };
    };
    const setText = (html, cls = '') => { text.className = `mconsole__text ${cls}`; text.innerHTML = html; };
    const setHud = (l, r) => { hud.style.display = l ? 'flex' : 'none'; hud.children[0].textContent = l; hud.children[1].textContent = r; };
    const clear = () => g.clearRect(0, 0, W, H);
    const stopLoops = () => { clearTimeout(C.timer); cancelAnimationFrame(C.raf); C.raf = 0; };
    const playing = (on) => root.classList.toggle('is-playing', on); // solo decorativo: la consola "suena" mientras se juega

    // ── standby ──
    const standby = () => {
      setText(`<b class="mc-logo">TRZ<i class="mc-cur">_</i></b>${play ? '<span class="mc-sm">clic: jugar</span>' : ''}`, 'is-center');
    };

    // ── cargando (pantalla de carga) ──
    const loading = () => {
      const draw = () => {
        const p = boot.progress, n = Math.round(p * 10);
        if (C.loadingDone) { setText('<b>LISTO</b><span class="mc-dim">[##########] 100%</span>', 'is-center'); return; }
        setText(`<b>CARGANDO</b><span class="mc-dim">[${'#'.repeat(n)}${'·'.repeat(10 - n)}] ${Math.round(p * 100)}%</span>`, 'is-center');
        C.timer = setTimeout(draw, 120);
      };
      draw();
    };

    // ── datos que "escribe" ──
    const tipsLoop = () => {
      const lines = TIPS[C.order[C.ti++ % TIPS.length]].flatMap(wrapLine);
      const full = lines.join('\n');
      let i = 0;
      const paint = (n) => {
        const shown = full.slice(0, n).split('\n').map((l) => (l.startsWith('//') ? `<span class="mc-dim">${esc(l)}</span>` : esc(l)));
        text.innerHTML = `${shown.join('\n')}<i class="mc-block"></i>`;
      };
      setText('');
      paint(0);
      const tick = () => {
        i += 1; paint(i);
        C.timer = setTimeout(i < full.length ? tick : tipsLoop, i < full.length ? 34 + Math.random() * 46 : 4200);
      };
      C.timer = setTimeout(tick, 450);
    };

    // ── menú y juegos ──
    const drawMenu = () => {
      const gm = GAMES[C.gi];
      setText(`<span class="mc-dim">ELIGE JUEGO</span>\n<b>&lt; ${gm.name} &gt;</b>\n${gm.keys}\n<span class="mc-dim">récord ${record(gm.id)}</span>`, 'is-center');
    };
    const gameLoop = (now) => {
      C.raf = 0;
      const dt = Math.min(0.05, (now - C.last) / 1000);
      C.last = now;
      const gm = C.game;
      gm.step(dt, C.io);
      C.io.pressed.clear();
      clear();
      gm.draw(g, C.pal);
      setHud(GAMES[C.gi].name, gm.lives !== undefined ? `${'♥'.repeat(gm.lives)} ${String(gm.score).padStart(3, '0')}` : String(gm.score).padStart(3, '0'));
      if (gm.over) {
        C.over = true;
        playing(false);
        const id = GAMES[C.gi].id, prev = record(id);
        if (gm.score > prev) saveRecord(id, gm.score);
        setText(`<b>FIN</b>\npuntos ${gm.score}\nrécord ${Math.max(prev, gm.score)}\n<span class="mc-dim">ESPACIO: otra vez</span>`, 'is-center mc-over');
        return;
      }
      C.raf = requestAnimationFrame(gameLoop);
    };
    const startGame = () => {
      C.game = GAMES[C.gi].make();
      C.over = false;
      C.io.pressed.clear();
      setText('');
      playing(true);
      C.last = performance.now();
      C.raf = requestAnimationFrame(gameLoop);
    };

    const enter = (mode) => {
      stopLoops();
      const wasBusy = link.current.busy;
      C.mode = mode;
      // Mientras se juega (menú o juego) la mascota no teclea ni saca su mini teclado; al salir empieza de nuevo la cuenta del ratón quieto
      link.current.busy = mode === 'menu' || mode === 'game';
      // Mientras se juega no se pinta el anillo de foco de la mascota (el navegador lo dibuja al usar las flechas con ella enfocada)
      root.closest('.mascot')?.classList.toggle('is-gaming', link.current.busy);
      if (wasBusy && !link.current.busy) link.current.wake?.();
      C.pal = readPal();
      clear();
      setHud('', '');
      playing(false);
      if (mode === 'standby') standby();
      else if (mode === 'tips') tipsLoop();
      else if (mode === 'loading') loading();
      else if (mode === 'menu') drawMenu();
      else if (mode === 'game') startGame();
    };
    const refresh = () => {
      const want = C.loading ? 'loading' : C.user || (C.typing && hero ? 'tips' : 'standby');
      if (want !== C.mode) enter(want);
    };
    const leave = () => { C.user = null; C.io.held.clear(); C.io.pressed.clear(); refresh(); };

    // ── entrada: teclado y botones de la consola ──
    const press = (code, isDown) => {
      if (!hero) return;
      if (code === 'back') {
        if (!isDown) return;
        if (C.user === 'game') { C.user = 'menu'; C.io.held.clear(); enter('menu'); } else if (C.user === 'menu') leave();
        return;
      }
      if (isDown) { C.io.held.add(code); C.io.pressed.add(code); } else C.io.held.delete(code);
      if (!isDown) return;
      if (C.user === 'menu') {
        if (code === 'left' || code === 'right') { C.gi = (C.gi + (code === 'left' ? GAMES.length - 1 : 1)) % GAMES.length; drawMenu(); } else if (code === 'action') { C.user = 'game'; enter('game'); }
      } else if (C.user === 'game' && C.over && code === 'action') enter('game');
    };
    const open = () => { if (!hero || C.user) return; C.user = 'menu'; enter('menu'); };
    act.current = {
      press,
      screen: () => { if (!hero) return; if (!C.user) open(); else press('action', true); },
    };
    consoleCtl.open = hero ? open : consoleCtl.open;
    // La mascota 3D de la portada (Mascot3D) pulsa la pantalla y los botones de su modelo a través de estas acciones
    if (hero) { consoleCtl.press = press; consoleCtl.screen = act.current.screen; }

    const onKeyDown = (e) => {
      if (!C.user || !C.visible || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault(); e.stopPropagation(); // que la página no se desplace ni la mascota se asuste con Espacio o Intro
      if (!e.repeat) press(k, true);
    };
    const onKeyUp = (e) => { const k = KEYS[e.code]; if (k && C.user) press(k, false); };
    const onBlur = () => C.io.held.clear();
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur);

    // Si la mascota sale de la vista, se sale del juego (no se capturan teclas de una consola que no se ve)
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((list) => { const e = list[list.length - 1]; C.visible = e.isIntersecting; if (!C.visible && C.user) leave(); }) : null;
    io?.observe(root);

    link.current.typing = (v) => { C.typing = v; refresh(); };
    // Pantalla de carga: 'on' = CARGANDO con progreso, 'done' = LISTO, false = vuelve a lo normal
    link.current.loading = (v) => { C.loading = !!v; C.loadingDone = v === 'done'; C.mode = ''; refresh(); };
    refresh();

    return () => {
      stopLoops();
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      io?.disconnect();
      if (link.current.typing) delete link.current.typing;
      if (link.current.loading) delete link.current.loading;
      link.current.busy = false;
      root.closest('.mascot')?.classList.remove('is-gaming');
    };
  }, [hero, link]);

  const stop = (e) => e.stopPropagation(); // los clics en la consola no deben asustar a la mascota
  const btn = (k) => ({
    onPointerDown: (e) => { e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId); setDown(k); act.current.press(k, true); },
    onPointerUp: () => { setDown(''); act.current.press(k, false); },
    onPointerCancel: () => { setDown(''); act.current.press(k, false); },
    onClick: stop,
  });
  const cls = (k) => (down === k ? ' is-down' : '');

  return (
    // onMouseDown: los clics en la consola no enfocan a la mascota (tiene tabIndex), así no queda su anillo de foco al usar el teclado después
    <div ref={rootRef} className="mchest mconsole" aria-hidden="true" onClick={stop} onMouseDown={(e) => e.preventDefault()}>
      <div className="mconsole__screen" onClick={() => act.current.screen()}>
        <canvas ref={canvasRef} width={W * RES} height={H * RES} />
        <div ref={hudRef} className="mc-hud"><span /><span /></div>
        <div ref={textRef} className="mconsole__text" />
      </div>
      {hero && (
        <>
          <div className="mconsole__dpad">
            <i className={`mc-pad mc-pad--up${cls('up')}`} {...btn('up')} />
            <i className={`mc-pad mc-pad--left${cls('left')}`} {...btn('left')} />
            <i className="mc-pad mc-pad--mid" />
            <i className={`mc-pad mc-pad--right${cls('right')}`} {...btn('right')} />
            <i className={`mc-pad mc-pad--down${cls('down')}`} {...btn('down')} />
          </div>
          {/* Ecualizador de adorno: baila solo mientras se juega (no oye nada ni es un control) */}
          <span className="mconsole__eq"><b /><b /><b /><b /><b /></span>
          <span className={`mconsole__btn mconsole__btn--b${cls('back')}`} {...btn('back')}>B</span>
          <span className={`mconsole__btn mconsole__btn--a${cls('action')}`} {...btn('action')}>A</span>
        </>
      )}
    </div>
  );
}
