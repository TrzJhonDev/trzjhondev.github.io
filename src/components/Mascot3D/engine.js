import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
// Los modelos se exportan comprimidos con meshopt desde Blender (sin cuantizar: sin pérdida); este lector los descomprime
const gltfLoader = () => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { modelBuffer } from '../../lib/boot';
import { EYE, EYE_X, EYE_Y, MOUTH, MOUTH_X, MOUTH_Y, P, PUPIL, MIRRORED, mirror } from '../Mascot/faceData';

// Mascota modelada en Blender (blender/mascota.blend -> public/models/mascota.glb) dibujada con Three.js.
// Reproduce el comportamiento de la mascota CSS de la portada (Mascot.jsx): sigue el puntero, parpadea, saluda una vez
// por sesión, se asusta o se ríe con un clic, teclea tras IDLE_TYPING_MS con el ratón quieto, celebra si la guía lo pide
// (cmd) y mira donde la guía diga (look). La pantalla del pecho copia en cada fotograma la consola real (Console.jsx,
// montada oculta): su canvas y sus textos. Un único bucle rAF; se para fuera de pantalla, con la pestaña oculta o en pausa.

// Colores por tema: los mismos que las variables --m-* de Mascot.css (PLAN-COLORES.md)
const THEMES = {
  dark: { carcasa: '#5B5E67', articulacion: '#26282D', auricular: '#1E88C2', boton: '#2AB4F4', marco: '#0A0B0D' },
  // Carcasa en claro: perla gris azulado (#C9D2DC). El blanco perla de la CSS (#E8EEF4) en 3D se veía blanco puro
  // (Jhon, 24/11/2026: "aún se ve muy blanco"): las caras que miran a la luz lo muestran entero, sin la capa de sombra.
  light: { carcasa: '#C9D2DC', articulacion: '#4E6075', auricular: '#1E88C2', boton: '#097AAE', marco: '#0A0B0D' },
};

/** Teclado: teclas oscuras en una rejilla de 3 × 12 que se encienden al azar mientras la mascota teclea. */
function drawKeys(ctx, lit, now) {
  const W = 512, H = 160, cols = 12, rows = 3, gap = 8;
  ctx.fillStyle = '#071017'; ctx.fillRect(0, 0, W, H);
  const kw = (W - gap * (cols + 1)) / cols, kh = (H - gap * (rows + 1)) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c, a = Math.max(0, 1 - (now - (lit[i] || 0)) / 260); // se apaga en 260 ms
      ctx.fillStyle = a > 0 ? `rgba(143, 216, 255, ${0.25 + a * 0.75})` : '#1B2530';
      const x = gap + c * (kw + gap), y = gap + r * (kh + gap);
      ctx.beginPath(); ctx.roundRect(x, y, kw, kh, 6); ctx.fill();
    }
  }
}
const LIT = '#8FD8FF', MID = '#2AB4F4', SILVER = '#BCC2CC';
const SCREEN = ['#0B1A24', '#061016'];
const EXPR = { dormir: 'sleep', despertar: 'happy', saludo: 'happy', hola: 'happy', susto: 'surprised', risa: 'laugh', celebrar: 'happy', teclear: 'focus', salto: 'happy',
  cargar: 'happy', caminar_carga: 'happy', triste: 'sad' };
const LOOPS = new Set(['reposo', 'teclear', 'caminar', 'cargar', 'caminar_carga', 'triste', 'dormir']);
// Escenario de Contacto (opts.stage): alto de la mascota en px según el alto de la caja y el suelo (px desde abajo)
const STAGE_FLOOR = 30;
const stagePx = (h) => Math.max(150, Math.min(220, h * 0.58));
const IDLE_TYPING_MS = 8000;
const SHARED = {}; // url -> promesa del glTF ya interpretado (una sola descarga para todas las mascotas)
// Teclado: de dónde sale (en el mundo: hacia dentro del pecho y un poco abajo) y cuánto tarda en salir y en guardarse
const KB_HIDE = new THREE.Vector3(0, -0.05, -0.34);
const KB_OUT = 0.5, KB_BACK = 0.32;
const backOut = (t) => { const c = 1.4; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; }; // pasa un poco y vuelve
// Parte del color (lineal) que cada pieza tiene en sombra; la luz pone el resto hasta el 100 %. 0,36 en lineal ≈ 63 % en
// sRGB, el lado en sombra de la CSS (1 - 0,62 · soft).
const BASE_GLOW = 0.36;
const DESKTOP = 900;

/** Cara de píxeles en un canvas de 4× (640 × 496) con los mismos datos que Face.jsx. */
/**
 * Desplazamiento de la mirada en la cara, AJUSTADO a la rejilla: unidades enteras de diseño (1 unidad = 4 px del canvas).
 * Antes se usaba el valor continuo: cada pequeño cambio de mirada redibujaba los ojos medio píxel movidos y los bloques
 * de píxeles "temblaban" (Jhon lo grabó en vídeo). Ahora solo se redibuja cuando la mirada cruza una unidad entera.
 */
const faceOffset = (look) => ({ lx: Math.round(look.x * 4), ly: Math.round(look.y * 3), px: Math.round(look.x * 1.2 * P), py: Math.round(look.y * P) });

function drawFace(ctx, expr, look) {
  const K = 4;
  const g = ctx.createLinearGradient(0, 0, 160 * K, 124 * K);
  g.addColorStop(0, SCREEN[0]); g.addColorStop(1, SCREEN[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 160 * K, 124 * K);
  const e = EYE[expr] ? expr : 'idle';
  const rowsL = EYE[e], rowsR = MIRRORED.has(e) ? mirror(EYE[e]) : EYE[e];
  const px = (rows, ox, oy) => rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '#') ctx.fillRect((ox + x * P) * K, (oy + y * P) * K, P * K + 0.5, P * K + 0.5);
  }));
  ctx.save();
  ctx.fillStyle = LIT; ctx.shadowColor = 'rgba(143, 216, 255, 0.75)'; ctx.shadowBlur = 16;
  const { lx, ly, px: pdx, py: pdy } = faceOffset(look);
  px(rowsL, EYE_X[0] + lx, EYE_Y + ly); px(rowsR, EYE_X[1] + lx, EYE_Y + ly);
  px(MOUTH[expr] || MOUTH.idle, MOUTH_X, MOUTH_Y);
  if (expr === 'happy' || expr === 'laugh') {
    ctx.globalAlpha = 0.4; ctx.fillRect(16 * K, 76 * K, 14 * K, 7 * K); ctx.fillRect(130 * K, 76 * K, 14 * K, 7 * K);
  }
  ctx.restore();
  const pup = PUPIL[e];
  if (pup) {
    ctx.fillStyle = SCREEN[1];
    [EYE_X[0], EYE_X[1]].forEach((ex) => ctx.fillRect((ex + lx + pup[0] * P + pdx) * K, (EYE_Y + ly + pup[1] * P + pdy) * K, pup[2] * P * K, pup[3] * P * K));
  }
}

/**
 * Pantalla del pecho: copia la consola real (oculta) en un canvas de 512 × 288 (la pantallita mide 96 × 54 unidades:
 * 5,33 px por unidad). Pinta el fondo, el canvas de los juegos, la barra de puntos (.mc-hud) y los textos de
 * .mconsole__text con los mismos tamaños y colores que Mascot.css.
 */
function drawConsole(ctx, els, now) {
  const W = 512, H = 288, U = W / 96;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, SCREEN[0]); g.addColorStop(1, SCREEN[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!els) return;
  ctx.drawImage(els.canvas, 0, 0, W, H);
  const blinkOn = (period) => Math.floor(now / (period / 2)) % 2 === 0;
  const mono = (w, px) => `${w} ${px}px "JetBrains Mono", ui-monospace, monospace`;
  // Barra de puntos
  if (els.hud.style.display === 'flex') {
    ctx.font = mono(700, 6.8 * U); ctx.fillStyle = SILVER; ctx.textBaseline = 'top';
    ctx.textAlign = 'left'; ctx.fillText(els.hud.children[0].textContent, 3 * U, 1.5 * U);
    ctx.textAlign = 'right'; ctx.fillText(els.hud.children[1].textContent, W - 3 * U, 1.5 * U);
  }
  const t = els.text, cls = t.classList;
  if (cls.contains('mc-over')) { ctx.fillStyle = 'rgba(6, 16, 22, 0.8)'; ctx.fillRect(0, 0, W, H); }
  // Filas: en los estados centrados cada elemento hijo es una fila; en los datos, cada línea del texto
  const rows = [];
  if (cls.contains('is-center')) {
    t.childNodes.forEach((n) => {
      if (n.nodeType === 1) rows.push({ text: n.textContent, kind: n.classList.contains('mc-logo') ? 'logo' : n.classList.contains('mc-sm') ? 'sm' : n.classList.contains('mc-dim') ? 'dim' : 'b' });
      else n.textContent.split('\n').forEach((l) => { if (l.trim()) rows.push({ text: l, kind: 'n' }); });
    });
  } else if (t.textContent) {
    t.textContent.split('\n').forEach((l) => rows.push({ text: l, kind: l.startsWith('//') ? 'dim' : 'n' }));
    if (rows.length) rows[rows.length - 1].block = t.querySelector('.mc-block') != null;
  }
  if (!rows.length) return;
  const size = { logo: 26, sm: 7 }, line = { logo: 26, sm: 9 };
  const sz = (r) => (size[r.kind] || 8.2) * U, lh = (r) => (line[r.kind] || 9.6) * U;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(143, 216, 255, 0.4)'; ctx.shadowBlur = 2 * U;
  const center = cls.contains('is-center');
  const total = rows.reduce((a, r) => a + lh(r), 0);
  let y = center ? (H - total) / 2 : 4 * U;
  rows.forEach((r) => {
    const h = lh(r);
    ctx.font = mono(r.kind === 'logo' ? 700 : 600, sz(r));
    ctx.fillStyle = r.kind === 'dim' || r.kind === 'sm' ? MID : LIT;
    ctx.textAlign = center ? 'center' : 'left';
    const x = center ? W / 2 : 5 * U;
    let text = r.text;
    if (r.kind === 'logo' && text.endsWith('_') && !blinkOn(1000)) text = `${text.slice(0, -1)} `; // cursor parpadeante
    if (r.kind !== 'sm' || blinkOn(1400)) ctx.fillText(text, x, y + h / 2);
    if (r.block && blinkOn(1000)) {
      const w = ctx.measureText(text).width;
      ctx.fillStyle = LIT; ctx.fillRect(x + w + 1 * U, y + h / 2 - 3.7 * U, 4 * U, 7.4 * U);
    }
    y += h;
  });
  ctx.shadowBlur = 0;
}

export class MascotEngine {
  /**
   * opts: { ptr, look, cmd, onAct, link, ctl (consoleCtl: press/screen), consoleEls: () => ({ canvas, text, hud }) }
   * ptr.current = { mx, my } (px de pantalla); look/cmd/onAct como en Mascot.jsx; link: el ref que comparte la consola.
   */
  constructor(host, opts) {
    this.host = host; this.o = opts;
    this.expr = 'idle';
    this.look = { x: 0, y: 0, tx: 0, ty: 0 };
    this.clock = new THREE.Clock();
    this.paused = false; this.visible = true;
    this.mqMotion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    this.mqDesk = window.matchMedia(`(min-width: ${DESKTOP}px)`);
    this.lastMove = performance.now() + 2500; this.lpx = 0; this.lpy = 0;
    this.nextBlink = performance.now() + 2500; this.blinking = false;
    this.clicks = 0; this.typing = false;
    this.base = 'reposo'; // bucle al que vuelve tras una acción suelta (el escenario lo cambia: cargar, triste…)
    this.stage = !!opts.stage; this.anchorX = null; this.lookHold = null;
    this.cmdN = opts.cmd?.current?.n ?? 0;
    // Variante 'mini' (esquina y Contacto): tranquila, sin teclear ni consola; mira hacia abajo mientras haces scroll
    this.mini = opts.variant === 'mini';
    this.lastScroll = 0;
    // Gesto propio de la página (scroll-craft, 25/11/2026): la cara sigue tu scroll. Velocidad suavizada en px/s;
    // si bajas rápido se marea, si subes rápido se sorprende y al parar te mira y sonríe (ver scrollMood en el bucle).
    this.vel = 0; this.lastY = window.scrollY; this.lastT = performance.now(); this.mood = null; this.moodT = 0; this.fastT = 0;
    this.onScroll = () => {
      const now = performance.now(), y = window.scrollY, dt = Math.max(8, now - this.lastT);
      this.vel = this.vel * 0.7 + ((y - this.lastY) / dt) * 1000 * 0.3;
      this.lastY = y; this.lastT = now; this.lastScroll = now;
      this.kick();
    };
    if (!this.stage) window.addEventListener('scroll', this.onScroll, { passive: true });
    // Pulsar el botón A del pecho (orden 'press' de la guía): el brazo izquierdo va al botón y vuelve
    this.pressT0 = -1;

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Colores iguales a la mascota CSS (Jhon, 24/11/2026: "los colores cambian" y "en modo claro se ve blanco").
    // La CSS oscurece cada cara con una capa negra (shade() de math3d.js): ninguna supera su color base; la que mira a la
    // luz lo tiene exacto, el frente ~78 % y el lado en sombra ~63 % (en sRGB). Aquí: material sin brillos (Lambert),
    // cada pieza emite BASE_GLOW de su color (la sombra) y una sola luz blanca con la MISMA dirección que LIGHT pone el
    // resto hasta el 100 %. Sin tono de cine, sin entorno ni luces de color.
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.domElement.className = 'mascot3d__canvas';
    host.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    // LIGHT de la CSS es (-0,35, -0,85, 0,4) con y hacia abajo: en Three (y hacia arriba) es (-0,35, 0,85, 0,4).
    // Con luces físicas, intensidad π deja el color base completo en una cara de frente a la luz: (1 - BASE_GLOW)·π.
    const key = new THREE.DirectionalLight(0xffffff, Math.PI * (1 - BASE_GLOW)); key.position.set(-0.35, 0.85, 0.4); this.scene.add(key);
    // En el escenario la cámara es ortográfica: 1 px de la caja = wpp unidades en todo el ancho (las tarjetas HTML
    // se colocan en px y tienen que coincidir con las manos de la mascota)
    this.camera = this.stage ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60) : new THREE.PerspectiveCamera(24, 1, 0.1, 60);

    const face = document.createElement('canvas'); face.width = 640; face.height = 496;
    this.faceCtx = face.getContext('2d');
    this.faceTex = new THREE.CanvasTexture(face); this.faceTex.colorSpace = THREE.SRGBColorSpace; this.faceTex.flipY = false; this.faceTex.anisotropy = 4;
    const cons = document.createElement('canvas'); cons.width = 512; cons.height = 288;
    this.consCtx = cons.getContext('2d');
    this.consTex = new THREE.CanvasTexture(cons); this.consTex.colorSpace = THREE.SRGBColorSpace; this.consTex.flipY = false; this.consTex.anisotropy = 4;
    const keys = document.createElement('canvas'); keys.width = 512; keys.height = 160;
    this.keysCtx = keys.getContext('2d'); this.keysLit = []; this.nextKey = 0;
    this.keysTex = new THREE.CanvasTexture(keys); this.keysTex.colorSpace = THREE.SRGBColorSpace; this.keysTex.flipY = false;
    drawKeys(this.keysCtx, this.keysLit, 0);
    this.kb = 0; // aparición del teclado (0 escondido, 1 fuera)
    this.redrawFace();

    this.raycaster = new THREE.Raycaster();
    this.onClick = (ev) => this.handleClick(ev);
    r.domElement.addEventListener('click', this.onClick);
    this.onVis = () => this.kick();
    document.addEventListener('visibilitychange', this.onVis);
    this.onMotion = () => this.kick();
    this.mqMotion.addEventListener?.('change', this.onMotion);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.kick(); });
    this.io.observe(host);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    // El tema se cambia con data-theme en <html> (useTheme.js)
    this.mo = new MutationObserver(() => this.setTheme());
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.loop = this.loop.bind(this);
    if (opts.link) opts.link.current.wake = () => { this.lastMove = performance.now(); };
  }

  async load(url) {
    // El modelo se descarga e interpreta una sola vez para todas las mascotas; cada una usa un clon con sus propios huesos
    // La pantalla de carga ya descarga el modelo con progreso (lib/boot.js): se usa esa misma descarga
    const gltf = await (SHARED[url] ||= modelBuffer(url).then((buf) => gltfLoader().parseAsync(buf, '')).catch(() => gltfLoader().loadAsync(url)));
    if (this.disposed) return; // React en desarrollo monta dos veces: el primer motor ya se destruyó
    this.model = cloneSkinned(gltf.scene);
    this.materials = {};
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      const name = o.material.name;
      if (name === 'pantalla_cara' || name === 'pantalla_consola') {
        // Pantallas sin luz: se ven con sus colores exactos (el mismo degradado y los mismos píxeles que la CSS)
        o.material = new THREE.MeshBasicMaterial({ map: name === 'pantalla_cara' ? this.faceTex : this.consTex });
        if (name === 'pantalla_consola') this.consoleMesh = o;
      } else if (name === 'teclas') {
        o.material = new THREE.MeshBasicMaterial({ map: this.keysTex });
      } else {
        // Lambert: solo luz difusa, sin reflejos que blanqueen (la CSS tampoco tiene brillos en la carcasa)
        const src = o.material;
        o.material = new THREE.MeshLambertMaterial({ name, color: src.color.clone(), emissive: src.emissive.clone(), emissiveIntensity: src.emissiveIntensity });
        if (name !== 'brillo_lentes') o.material.emissiveIntensity = BASE_GLOW; // el brillo azul conserva su emisión
        (this.materials[name] ||= []).push(o.material);
      }
      // Botones de la consola en el modelo (para jugar con el ratón o el dedo)
      const base = o.name.replace(/_\d+$/, '');
      if (/^cruceta_[hv]$/.test(base)) (this.pads ||= []).push(o);
      if (base === 'boton_A') this.btnA = o;
      if (base === 'boton_B') this.btnB = o;
      // Teclado: solo se ve mientras teclea (como el mini teclado .mkb de la CSS)
      if (base === 'teclado' || base === 'teclado_teclas') { (this.keyboard ||= []).push(o); o.visible = false; }
    });
    this.scene.add(this.model);
    // Teclado: guarda su posición de reposo y la dirección (en el espacio del hueso cuerpo) por la que entra en el pecho
    this.model.updateMatrixWorld(true);
    this.keyboard?.forEach((o) => {
      const inv = o.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
      o.userData.kbRest = o.position.clone();
      o.userData.kbIn = KB_HIDE.clone().applyQuaternion(inv); // de su sitio a "guardado dentro del cuerpo"
    });
    this.model.traverse((o) => { if (o.isBone && o.name.replace(/_\d+$/, '') === 'cabeza') this.head = o; });
    this.headRest = this.head?.quaternion.clone();
    this.model.traverse((o) => { if (o.isBone && o.name.replace(/_d+$/, '') === 'brazoL') this.armL = o; });
    if (this.armL && this.btnA) {
      // Del hombro al botón A (en el espacio del modelo): el brazo, que cuelga hacia abajo, gira hacia esa dirección
      const shoulder = this.armL.getWorldPosition(new THREE.Vector3());
      const btn = new THREE.Box3().setFromObject(this.btnA).getCenter(new THREE.Vector3());
      const dir = btn.sub(shoulder).normalize();
      this.pressQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      // Su brillo cambia sin tocar los demás botones (y sigue recibiendo el color del tema)
      this.btnA.material = this.btnA.material.clone();
      (this.materials[this.btnA.material.name] ||= []).push(this.btnA.material);
    }
    this.bounds = new THREE.Box3().setFromObject(this.model);
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    gltf.animations.forEach((clip) => {
      const a = this.mixer.clipAction(clip);
      // Las acciones sueltas se quedan en su último fotograma al terminar (clamp) y el bucle entra con un fundido desde ahí.
      // Antes se soltaban sin fundido y la pose saltaba al reposo en un fotograma: la cabeza daba un tirón de ~9° al acabar
      // cada saludo, susto, risa… (Jhon: "la cabeza se mueve como mal, como parpadeos")
      if (!LOOPS.has(clip.name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      this.actions[clip.name] = a;
    });
    this.mixer.addEventListener('finished', (e) => { if (e.action === this.current) this.play(this.typing ? 'teclear' : this.base); });
    // Dormido (pantalla de carga, PLAN-PANTALLA-CARGA.md): bucle 'dormir', cara 'sleep', sin seguir el puntero ni teclear
    this.sleeping = !!this.o.sleeping && !!this.actions.dormir;
    this.base = this.sleeping ? 'dormir' : 'reposo';
    this.current = this.actions[this.base]; this.current?.play();
    if (this.sleeping) this.setExpr('sleep');
    this.mixer.update(0); // aplica ya la pose (con "reducir movimiento" no hay bucle que lo haga)
    this.setTheme();
    this.resize();
    // Compilar los materiales antes del primer dibujo: así el relevo de la imagen al 3D no da un tirón
    try { await this.renderer.compileAsync(this.scene, this.camera); } catch { /* navegadores sin compileAsync */ }
    if (this.disposed) return;
    // La pequeña saluda con la mano al aparecer, sin hablar (greet); la de la portada da la bienvenida
    if (this.mini) {
      if (this.o.greet && this.mqMotion.matches) this.greetT = window.setTimeout(() => this.play('hola'), 120);
      this.kick(); this.renderOnce();
      return;
    }
    // Dormido: el saludo espera a que aterrice en la portada (welcome(), lo llama Portrait.jsx)
    if (this.sleeping) { this.kick(); this.renderOnce(); return; }
    this.welcome();
    this.kick();
    this.renderOnce();
  }

  /** Despierta (fin de la pantalla de carga): parpadea, se estira y sonríe; luego vuelve a su reposo. */
  wake() {
    if (!this.sleeping) return;
    this.sleeping = false;
    this.base = 'reposo';
    this.lastMove = performance.now(); // que no se ponga a teclear nada más despertar
    if (this.mqMotion.matches && this.actions.despertar) this.play('despertar');
    else { this.play('reposo'); this.setExpr('idle'); }
    this.kick();
  }

  /** Saludo de bienvenida: una vez por sesión, marcado cuando empieza de verdad (StrictMode monta dos veces). */
  welcome() {
    this.lastMove = performance.now(); // recién llegada: que no se ponga a teclear enseguida
    let seen = false;
    try { seen = !!sessionStorage.getItem('mascota-saludo'); } catch { /* sin almacenamiento */ }
    if (!seen && this.mqMotion.matches) {
      this.greetT = window.setTimeout(() => {
        try { sessionStorage.setItem('mascota-saludo', '1'); } catch { /* sin almacenamiento */ }
        this.play('saludo'); this.o.onAct?.('wave');
      }, 600);
    }
  }

  setTheme() {
    const pal = THEMES[document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'];
    Object.entries(this.materials || {}).forEach(([name, mats]) => {
      mats.forEach((m) => {
        if (pal[name]) m.color.set(pal[name]);
        if (name !== 'brillo_lentes') m.emissive.copy(m.color); // emite la mitad de su propio color (BASE_GLOW)
      });
    });
    this.renderOnce();
  }

  setPaused(p) { this.paused = p; this.kick(); }

  play(name) {
    const next = this.actions?.[name];
    if (!next) return;
    if (next === this.current && LOOPS.has(name)) return;
    next.reset(); next.setEffectiveWeight(1); next.play();
    if (this.current && this.current !== next) next.crossFadeFrom(this.current, 0.25, false);
    this.current = next;
    this.setExpr(EXPR[name] || 'idle');
  }

  /** true mientras suena una acción suelta (saludo, susto…): el escenario espera a que vuelva a su bucle. */
  oneShot() { return !!this.current && !LOOPS.has(this.current.getClip().name); }
  /** Bucle actual del escenario (reposo, caminar, cargar…): lo pone si no suena ya, sin cortar una acción suelta. */
  pose(name) { this.base = name; if (!this.oneShot()) this.play(name); }

  setExpr(expr) { this.expr = expr; this.redrawFace(); }

  /**
   * Gesto propio: la cara sigue tu scroll (solo con su bucle de reposo o tecleo, nunca encima de una acción).
   * Bajar rápido (> 2.200 px/s durante 0,15 s) = mareo; subir rápido = sorpresa; al parar, una sonrisa de 0,9 s.
   */
  scrollMood(now) {
    if (this.stage || !this.model) return;
    const still = now - this.lastScroll > 220;
    if (still) this.vel *= 0.5;
    const loopName = this.current?.getClip().name;
    const free = !this.oneShot() && this.pressT0 < 0 && (loopName === 'reposo' || loopName === 'teclear');
    let want = this.mood;
    if (!still && this.vel > 2200) { if (!this.fastT) this.fastT = now; if (now - this.fastT > 150) want = 'dizzy'; }
    else if (!still && this.vel < -1800) { if (!this.fastT) this.fastT = now; if (now - this.fastT > 150) want = 'up'; }
    else this.fastT = 0;
    if (still && (this.mood === 'dizzy' || this.mood === 'up')) { want = 'smile'; this.moodT = now; }
    if (this.mood === 'smile' && now - this.moodT > 900) want = null;
    if (want === this.mood) return;
    this.mood = want;
    if (!free && want) { this.mood = null; return; }
    const face = { dizzy: 'dizzy', up: 'surprised', smile: 'happy' }[want];
    this.setExpr(face || (loopName === 'teclear' ? 'focus' : 'idle'));
  }

  /** Pulsar el botón A: el brazo izquierdo se acerca al botón (0,35 s), aprieta, aguanta y vuelve (1 s en total). */
  pressPose(now) {
    if (this.pressT0 < 0 || !this.armL) return;
    const t = (now - this.pressT0) / 1000;
    if (t > 1) { this.pressT0 = -1; this.setExpr('happy'); window.setTimeout(() => { if (this.pressT0 < 0 && !this.mood) this.setExpr('idle'); }, 900); return; }
    const ease = (x) => x * x * (3 - 2 * x);
    const w = t < 0.35 ? ease(t / 0.35) : t < 0.65 ? 1 + 0.06 * Math.sin(((t - 0.35) / 0.3) * Math.PI) : 1 - ease((t - 0.65) / 0.35);
    const bone = this.armL, parent = bone.parent;
    parent.updateWorldMatrix(true, false); // el mezclador acaba de mover los huesos: las matrices del mundo van atrasadas
    const parentQ = parent.getWorldQuaternion(new THREE.Quaternion());
    const boneQ = parentQ.clone().multiply(bone.quaternion);
    const target = new THREE.Quaternion().slerp(this.pressQ, Math.min(1, w)).multiply(boneQ);
    bone.quaternion.copy(parentQ.invert().multiply(target));
    // El botón se enciende mientras está apretado
    if (this.btnA) {
      const on = t > 0.3 && t < 0.7;
      this.btnA.material.emissiveIntensity = on ? 1.4 : BASE_GLOW;
    }
    // Mira su botón
    this.look.tx = 0.35; this.look.ty = 0.7;
  }
  redrawFace() { drawFace(this.faceCtx, this.blinking ? 'blink' : this.expr, this.look); this.faceTex.needsUpdate = true; }

  /** Clic o Intro en la mascota: se asusta o se ríe (alterna), como la CSS. */
  react() {
    this.clicks += 1;
    const type = this.clicks % 2 ? 'startle' : 'laugh';
    if (this.mqMotion.matches) this.play(type === 'startle' ? 'susto' : 'risa');
    else {
      // "Reducir movimiento": sin animación, solo cambia la cara un momento
      this.setExpr(type === 'startle' ? 'surprised' : 'laugh'); this.renderOnce();
      window.setTimeout(() => { this.setExpr('idle'); this.renderOnce(); }, 900);
    }
    this.lastMove = performance.now();
    this.o.onAct?.(type);
  }

  handleClick(ev) {
    if (!this.model) return;
    const b = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - b.left) / b.width) * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.model, true)[0];
    if (!hit) return;
    const ctl = this.o.ctl;
    // Consola del pecho: la pantalla abre el menú o confirma; la cruz y A/B mandan la tecla a la consola real
    if (ctl && hit.object === this.consoleMesh) { ctl.screen(); return; }
    if (ctl && this.pads?.includes(hit.object)) {
      const box = new THREE.Box3(); this.pads.forEach((o) => box.expandByObject(o));
      const d = hit.point.clone().sub(box.getCenter(new THREE.Vector3()));
      this.tap(Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? 'right' : 'left') : (d.y > 0 ? 'up' : 'down')); return;
    }
    if (ctl && hit.object === this.btnA) { this.tap('action'); return; }
    if (ctl && hit.object === this.btnB) { this.tap('back'); return; }
    this.react();
  }

  /** Pulsa y suelta una tecla de la consola (como los botones de la versión CSS). */
  tap(code) {
    this.o.ctl.press(code, true);
    window.setTimeout(() => this.o.ctl.press(code, false), 90);
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    if (!this.stage) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    this.fit(); this.renderOnce();
    this.rect = null;
  }

  /** Encuadre según el tamaño real del modelo: ocupa FILL del alto (o del ancho si la caja es estrecha). */
  fit() {
    if (!this.bounds) return;
    if (this.stage) { this.fitStage(); return; }
    const FILL = 0.88;
    const size = this.bounds.getSize(new THREE.Vector3()), c = this.bounds.getCenter(new THREE.Vector3());
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const byH = (size.y / FILL) / 2 / Math.tan(vfov / 2);
    const byW = (size.x / FILL) / 2 / Math.tan(vfov / 2) / this.camera.aspect;
    const dist = Math.max(byH, byW) + size.z / 2;
    this.camera.position.set(c.x, c.y + size.y * 0.06, c.z + dist);
    this.camera.lookAt(c.x, c.y, c.z);
  }

  /** Escenario: la mascota mide stagePx(alto) px y sus pies pisan la línea del suelo. metrics la lee el director. */
  fitStage() {
    const W = this.host.clientWidth, H = this.host.clientHeight;
    const size = this.bounds.getSize(new THREE.Vector3());
    const mpx = stagePx(H), wpp = size.y / mpx, floorY = H - STAGE_FLOOR;
    const cam = this.camera;
    // y del mundo en el centro de la caja: el suelo (bounds.min.y) cae en floorY
    const yc = this.bounds.min.y + (floorY - H / 2) * wpp;
    cam.left = (-W / 2) * wpp; cam.right = (W / 2) * wpp; cam.top = (H / 2) * wpp; cam.bottom = (-H / 2) * wpp;
    cam.position.set(0, yc, 20); cam.lookAt(0, yc, 0); cam.updateProjectionMatrix();
    this.metrics = { W, H, wpp, mpx, floorY };
  }

  running() { return !this.disposed && !!this.model && !this.paused && this.visible && !document.hidden && this.mqMotion.matches; }
  kick() { if (!this.raf && this.running()) { this.clock.getDelta(); this.raf = requestAnimationFrame(this.loop); } }
  renderOnce() {
    if (!this.model || this.disposed) return;
    drawConsole(this.consCtx, this.o.consoleEls?.(), performance.now()); this.consTex.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  loop(now) {
    this.raf = 0;
    if (!this.running()) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const p = this.o.ptr?.current, ask = this.o.look?.current;
    // Mirada: la guía manda mientras dure su petición; si no, el puntero (solo en escritorio)
    if (this.o.onFrame) this.o.onFrame(dt, now); // director del escenario: mueve y gira la mascota, coloca las tarjetas
    // Dormida: la cabeza y los ojos quietos (sin mirada). Antes iba hacia una mirada fija poco a poco y los ojos de píxeles
    // se desplazaban a saltos: parecía que la cabeza se movía y parpadeaba sola (Jhon lo notó en la pantalla de carga)
    if (this.sleeping) { this.look.tx = 0; this.look.ty = 0; this.look.x = 0; this.look.y = 0; }
    else if (this.lookHold) { this.look.tx = this.lookHold.dx; this.look.ty = this.lookHold.dy; }
    else if (ask && ask.until > now) { this.look.tx = ask.dx; this.look.ty = ask.dy; }
    else if (this.mood === 'up') { this.look.tx = 0; this.look.ty = -0.8; } // subes rápido: mira hacia arriba
    else if (this.mini && now - this.lastScroll < 1300) { this.look.tx = 0; this.look.ty = 0.6; } // la pequeña mira abajo al hacer scroll
    else if (p && this.mqDesk.matches && p.mx > -1000) {
      if (!this.rect || now - (this.rectAt || 0) > 250) { this.rect = this.host.getBoundingClientRect(); this.rectAt = now; }
      const b = this.rect;
      const cx = b.left + (this.anchorX ?? b.width / 2);
      this.look.tx = THREE.MathUtils.clamp((p.mx - cx) / (window.innerWidth * 0.45), -1, 1);
      this.look.ty = THREE.MathUtils.clamp((p.my - (b.top + (this.metrics ? this.metrics.floorY - this.metrics.mpx * 0.8 : b.height * 0.3))) / (window.innerHeight * 0.5), -1, 1);
    } else { this.look.tx = 0; this.look.ty = 0.15; }
    if (p && (p.mx !== this.lpx || p.my !== this.lpy)) { this.lastMove = now; this.lpx = p.mx; this.lpy = p.my; }
    const k = 1 - Math.exp(-dt * 8);
    this.look.x += (this.look.tx - this.look.x) * k; this.look.y += (this.look.ty - this.look.y) * k;
    // Orden de la guía (celebrar): solo si es reciente
    const order = this.o.cmd?.current;
    if (order && order.n !== this.cmdN) {
      this.cmdN = order.n;
      if (now - order.t < 1500 && order.type === 'cheer') this.play('celebrar');
      if (now - order.t < 1500 && order.type === 'press') { this.pressT0 = now; this.setExpr('focus'); }
    }
    this.scrollMood(now);
    // Teclear con el ratón quieto (no mientras se juega en la consola)
    const busy = this.o.link?.current?.busy;
    const idle = this.current === this.actions.reposo || this.current === this.actions.teclear;
    const want = !this.mini && idle && !busy && now - this.lastMove > IDLE_TYPING_MS; // la pequeña no teclea
    if (want !== this.typing) {
      this.typing = want;
      this.o.link?.current?.typing?.(want);
      if (idle) this.play(want ? 'teclear' : 'reposo');
    }
    // Teclado (Jhon pidió que aparezca y desaparezca bien animado): la mascota lo saca de su pecho.
    // Sale deslizándose hacia delante con un pequeño rebote (KB_OUT s, ease-out-back) y se guarda de vuelta con una curva
    // suave (KB_BACK s). Las teclas solo se encienden cuando ya está casi fuera.
    const kbWant = this.typing && this.current === this.actions.teclear;
    if (kbWant || this.kb > 0) {
      this.kbDir = kbWant ? 1 : -1;
      this.kb = kbWant ? Math.min(1, this.kb + dt / KB_OUT) : Math.max(0, this.kb - dt / KB_BACK);
      const t = this.kb;
      const e = kbWant ? backOut(t) : t * t * (3 - 2 * t);
      const s = 0.86 + 0.14 * Math.min(1, e);
      this.keyboard?.forEach((o) => {
        o.visible = t > 0.001;
        o.position.copy(o.userData.kbRest).addScaledVector(o.userData.kbIn, 1 - e);
        o.scale.setScalar(s);
      });
      if (kbWant && t > 0.8 && now > this.nextKey) { this.keysLit[Math.floor(Math.random() * 36)] = now; this.nextKey = now + 70 + Math.random() * 90; }
      drawKeys(this.keysCtx, this.keysLit, now); this.keysTex.needsUpdate = true;
    }
    // Parpadeo (solo con la cara en reposo)
    const blink = this.expr === 'idle' && now > this.nextBlink && now < this.nextBlink + 140;
    if (now > this.nextBlink + 140) this.nextBlink = now + 2600 + Math.random() * 3400;
    // La cara solo se redibuja si cambia algo visible (parpadeo o la mirada cruza una unidad entera de la rejilla)
    const fo = faceOffset(this.look), fk = `${blink}|${fo.lx}|${fo.ly}|${fo.px}|${fo.py}`;
    if (fk !== this.faceKey) { this.faceKey = fk; this.blinking = blink; this.redrawFace(); }
    // Esqueleto y, encima, la cabeza hacia donde mira
    if (this.head) this.head.quaternion.copy(this.headRest);
    this.mixer.update(dt);
    if (this.head) this.head.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(this.look.y * 0.22, this.look.x * 0.5, 0, 'YXZ')));
    // Mareo: la cabeza da vueltas pequeñas mientras dura
    if (this.head && this.mood === 'dizzy') this.head.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.cos(now * 0.011) * 0.07, 0, Math.sin(now * 0.011) * 0.16)));
    // Suavizado final de la cabeza (por tiempo, ~55 ms): ningún cambio de animación puede dar un salto de un fotograma
    if (this.head) {
      if (!this.headQ) this.headQ = this.head.quaternion.clone();
      else { this.headQ.slerp(this.head.quaternion, 1 - Math.exp(-dt * 18)); this.head.quaternion.copy(this.headQ); }
    }
    this.pressPose(now);
    drawConsole(this.consCtx, this.o.consoleEls?.(), now); this.consTex.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf); window.clearTimeout(this.greetT);
    this.io.disconnect(); this.ro.disconnect(); this.mo.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    window.removeEventListener('scroll', this.onScroll);
    this.mqMotion.removeEventListener?.('change', this.onMotion);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    if (this.o.link?.current) { delete this.o.link.current.wake; this.o.link.current.typing?.(false); }
    this.renderer.dispose();
    // La pequeña se crea y se destruye cada vez que aparece: se libera el contexto WebGL (el navegador admite pocos)
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
