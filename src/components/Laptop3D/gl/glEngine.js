import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
// Los modelos se exportan comprimidos con meshopt desde Blender (sin cuantizar: sin pérdida); este lector los descomprime
const gltfLoader = () => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
import { KB, KEYS, SKILL_KEY_INDEX } from '../keyLayout';
import { PIECES } from '../usePuzzle';
import { CABLE_ANCHOR, PLUG_LEN, plugTip } from '../geometry';
import { cablePoints } from '../Charger';
import { SKILLS } from '../../../data/skills';
import { readableOn } from '../../../lib/math3d';

// Portátil modelado en Blender (blender/portatil.blend -> public/models/portatil.glb) dibujado con WebGL DENTRO de la
// misma escena que la versión CSS (docs/historial/PLAN-PORTATIL-3D.md, fase 6). La cámara reproduce EXACTAMENTE la proyección CSS
// del escenario (perspective 1700 px, perspective-origin, scale(--fit), y el transform de .scene), así el modelo cae
// en el mismo sitio que las piezas CSS: esas siguen en la página, invisibles, y reciben los clics y arrastres
// (data-hit), así que toda la interacción (useLaptop, terminal, rompecabezas, cargador) no cambia. La pantalla, los
// hologramas, las etiquetas y el suelo siguen siendo CSS y se ven por encima o por debajo del canvas.
// Colores físicos fijos del portátil (los del modelo); luz: la misma que la mascota 3D (BASE_GLOW + una luz blanca
// con la dirección de LIGHT), equivalente a shade() de la CSS.

const S = 0.01; // 1 px de la escena CSS = 1 cm = 0,01 unidades del modelo
const BASE_GLOW = 0.36;
const D = 1700; // perspective de .stage
const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const SHARED = {};
const deg = Math.PI / 180;

/** Punto de la escena CSS (px; y hacia abajo, z hacia el espectador) → coordenadas del modelo (y arriba, base en 0). */
const fromCss = (x, y, z) => new THREE.Vector3(x * S, (14 - y) * S, z * S);

/** Teclas: capa de 480 × 320 a 2× con el mismo aspecto que Keyboard.jsx (skills con su color, la activa rellena). */
function drawKeys(ctx, { skillId, hover, power, lit }) {
  const K = 2;
  ctx.fillStyle = '#111113'; ctx.fillRect(0, 0, 480 * K, 320 * K);
  KEYS.forEach((k, i) => {
    const si = SKILL_KEY_INDEX.indexOf(i);
    const s = si >= 0 ? SKILLS[si] : null;
    const x = k.x * K, y = k.y * K, w = k.w * K, h = k.h * K;
    const dark = lit !== null && (k.x + k.w / 2 - KB.x) / KB.w > lit;
    let bg = '#1B1B1F', fg = power ? '#8C8C92' : '#4A4A52', label = k.label;
    if (s) {
      label = s.badge;
      if (s.id === skillId) { bg = s.color; fg = readableOn(s.color); }
      else if (si === hover) { bg = '#26303A'; fg = '#FFFFFF'; }
      else { bg = '#141416'; fg = s.color; }
    }
    if (dark) { bg = '#141416'; fg = '#2E2E34'; }
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 5); ctx.fill();
    if (s && s.id !== skillId && !dark) { ctx.strokeStyle = `${s.color}70`; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (!label) return;
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const size = k.row === 0 ? 8.5 : s ? 13 : label.length > 2 ? 9.5 : 12;
    ctx.font = `${s ? 700 : 600} ${size}px ${MONO}`;
    ctx.fillText(label, x + w / 2, y + h / 2 + 0.5, w - 6);
  });
}

/** Matriz CSS (filas) a THREE.Matrix4. */
const m4 = (...rows) => new THREE.Matrix4().set(...rows);
const T = (x, y, z) => m4(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
const Sc = (x, y, z) => m4(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
const RxCss = (a) => { const c = Math.cos(a), s = Math.sin(a); return m4(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1); };
const RyCss = (a) => { const c = Math.cos(a), s = Math.sin(a); return m4(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1); };
// Modelo → escena CSS: x igual, y invertida (y hacia abajo) con la base en y = 14, z igual; en px
const TO_CSS = T(0, 14, 0).multiply(Sc(100, -100, 100));
const FLIP = Sc(1, -1, 1);

export class LaptopGL {
  constructor(host) {
    this.host = host;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    r.domElement.className = 'stage__gl';
    host.appendChild(r.domElement);
    this.scene = new THREE.Scene();
    // LIGHT de math3d.js (-0,35, -0,85, 0,4 con y hacia abajo) en el mundo, que tiene la y hacia arriba (FLIP)
    const key = new THREE.DirectionalLight(0xffffff, Math.PI * (1 - BASE_GLOW));
    key.position.set(-0.35, 0.85, 0.4); this.scene.add(key); this.scene.add(key.target);
    this.camera = new THREE.Camera();
    this.root = new THREE.Group(); this.root.matrixAutoUpdate = false; this.scene.add(this.root);
    const kc = document.createElement('canvas'); kc.width = 960; kc.height = 640;
    this.keysCtx = kc.getContext('2d');
    this.keysTex = new THREE.CanvasTexture(kc); this.keysTex.colorSpace = THREE.SRGBColorSpace; this.keysTex.flipY = false; this.keysTex.anisotropy = 8;
    this.keysKey = '';
    this.fanA = 0; this.lastT = performance.now();
  }

  async load(url) {
    const gltf = await (SHARED[url] ||= gltfLoader().loadAsync(url));
    if (this.disposed) return;
    const m = this.model = gltf.scene.clone(true);
    this.mats = {};
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const name = o.material.name;
      const src = o.material;
      const mat = new THREE.MeshLambertMaterial({ name, color: src.color.clone() });
      mat.emissive.copy(src.color); mat.emissiveIntensity = BASE_GLOW;
      if (name === 'tecla') { mat.color.set('#ffffff'); mat.emissive.set('#ffffff'); mat.map = this.keysTex; mat.emissiveMap = this.keysTex; }
      if (/^led|led_/.test(name) || name === 'logo') mat.emissiveIntensity = 1;
      o.material = mat;
      (this.mats[name] ||= []).push(mat);
    });
    const by = (n) => m.getObjectByName(n);
    this.root.add(m);
    const rest = (o) => ({ o, p: o.position.clone() });
    // La pantalla la sigue dibujando la CSS (código, terminal, BIOS…), encima del modelo
    ['pantalla', 'marca'].forEach((n) => { const o = by(n); if (o) o.visible = false; });
    this.deck = ['carcasa_sup', 'boton_encendido'].map(by).filter(Boolean).map(rest);
    this.pad = rest(by('touchpad'));
    this.base = m.children.filter((o) => /^(base|pata_|tornillo_\d|rejilla|puerto_|led_carga|led_frontal)/.test(o.name)).map(rest);
    this.board = rest(by('placa'));
    this.lid = rest(by('tapa')); this.lidQ = this.lid.o.quaternion.clone();
    this.hinges = m.children.filter((o) => o.name.startsWith('bisagra')).map(rest);
    this.keys = new Map();
    m.children.forEach((o) => {
      const k = /^tecla_(\d+)_(\d+)$/.exec(o.name);
      if (k) this.keys.set(KEYS.findIndex((q) => q.row === +k[1] && q.col === +k[2]), rest(o));
    });
    this.pieces = PIECES.map((pc) => { const o = by(`pieza_${pc.key}`); return o && { pc, ...rest(o) }; }).filter(Boolean);
    this.blades = by('fan_aspas');
    this.charger = ['bateria', 'conector', ...[0, 1, 2, 3].map((i) => `bateria_led_${i}`)].map(by).filter(Boolean);
    this.plug = by('conector');
    // Piezas que cambian de color (LED, logo, tapa de la CPU): cada una con su propio material
    const own = (n) => { const o = by(n); if (!o) return null; o.material = o.material.clone(); return o.material; };
    this.ledFront = own('led_frontal'); this.ledCharge = own('led_carga'); this.camLed = own('webcam_led');
    this.logo = own('logo'); this.cpuCap = own('cpu_tapa');
    this.bankLeds = [0, 1, 2, 3].map((i) => own(`bateria_led_${i}`)).filter(Boolean);
    this.deckMats = [...(this.mats.carcasa || []), ...(this.mats.hueco || [])];
    // Hueco de la pantalla: el panel CSS (.panel, 480 × 316, radios 16 arriba y 6 abajo) está DEBAJO del canvas.
    // Esta placa se dibuja con alfa 0 y sin mezcla: "borra" el canvas donde está el panel, así se ve la pantalla CSS,
    // pero lo que el modelo tenga delante (las teclas en el despiece, la base vista desde abajo) la sigue tapando.
    // Una sola cara (la de delante): desde atrás se ve la carcasa de la tapa, igual que el panel CSS (backface hidden).
    const hole = new THREE.Shape();
    const [x0, x1, y0, y1, rt, rb] = [-2.4, 2.4, 0.06, 3.22, 0.16, 0.06];
    hole.moveTo(x0 + rb, y0); hole.lineTo(x1 - rb, y0); hole.quadraticCurveTo(x1, y0, x1, y0 + rb);
    hole.lineTo(x1, y1 - rt); hole.quadraticCurveTo(x1, y1, x1 - rt, y1); hole.lineTo(x0 + rt, y1);
    hole.quadraticCurveTo(x0, y1, x0, y1 - rt); hole.lineTo(x0, y0 + rb); hole.quadraticCurveTo(x0, y0, x0 + rb, y0);
    this.hole = new THREE.Mesh(new THREE.ShapeGeometry(hole, 8),
      // transparent: un material opaco escribe alfa 1 (OPAQUE); con NoBlending el alfa 0 sustituye lo que hubiera.
      // Va en la pasada de transparentes (después de lo opaco): donde algo está delante, la prueba de profundidad lo respeta
      new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending }));
    this.hole.frustumCulled = false;
    this.lid.o.add(this.hole);
    // Huecos punteados del rompecabezas (en la CSS quedan debajo del canvas): un rectángulo discontinuo por pieza,
    // sobre la placa en su sitio; se ven mientras se juega y la pieza no está encajada
    const slotMat = new THREE.LineDashedMaterial({ color: '#C9D2DC', dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.6 });
    this.slots = this.pieces.map((x) => {
      const { l, t, w, h } = { l: x.pc.home[0], t: x.pc.home[1], w: x.pc.w, h: x.pc.h };
      const pts = [[l, t], [l + w, t], [l + w, t + h], [l, t + h], [l, t]].map(([a, b]) => new THREE.Vector3((a - 220) * S, 0.062, (b - 145) * S));
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), slotMat);
      line.computeLineDistances(); line.visible = false; line.frustumCulled = false;
      this.board.o.add(line);
      return line;
    });
    // El tablero tiene su propio origen: los huecos se colocan en coordenadas del mundo del modelo
    this.board.o.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.board.o.matrixWorld).invert();
    this.slots.forEach((s) => s.applyMatrix4(inv));
    // Cable: tubo que se rehace cuando se mueve el conector
    this.cableMat = new THREE.MeshLambertMaterial({ color: '#DDE1E8', emissive: '#DDE1E8', emissiveIntensity: BASE_GLOW });
    this.cable = new THREE.Mesh(new THREE.BufferGeometry(), this.cableMat); this.cable.frustumCulled = false;
    m.add(this.cable);
  }

  /** Ajusta el canvas al escenario (px CSS) con la densidad de la pantalla. */
  size(w, h) {
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
  }

  /**
   * Dibuja un fotograma con el estado del portátil. v: { w, h, cx, cy, fit, ox, oy, k, ty, rx, ry, L, open, skill, hover,
   * press, power, lit, plug, hidden, ledOn, plugged, battery, camOn, fan, heat, puzzle } (mismos valores que la CSS).
   */
  draw(v) {
    if (!this.model || this.disposed) return;
    this.size(v.w, v.h);
    const now = performance.now(), dt = Math.min(0.1, (now - this.lastT) / 1000); this.lastT = now;
    // Proyección: la de CSS (perspective D con su origen) a coordenadas de recorte; profundidad lineal en z
    const { w: W, h: H, ox, oy } = v, A = -1 / 5000;
    // El mundo es el espacio de la pantalla CSS con la y invertida (FLIP: y hacia arriba). Así el giro de las caras no
    // cambia: si la inversión de y fuese en la proyección, Three.js vería un determinante negativo en el modelo y
    // tomaría las caras de atrás por las de delante (se veía el interior de la tapa).
    this.camera.projectionMatrix.set(
      2 / W, 0, (1 - (2 / W) * ox) / D, -1,
      0, 2 / H, ((2 / H) * oy - 1) / D, 1,
      0, 0, A, 0,
      0, 0, -1 / D, 1,
    );
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    // .scale-box: scale(fit) alrededor de (cx, cy); .scene: translateY, scale(k), rotateX(rx), rotateY(ry)
    this.root.matrix.copy(FLIP).multiply(T(v.cx, v.cy, 0)).multiply(Sc(v.fit, v.fit, 1)).multiply(T(0, v.ty, 0)).multiply(Sc(v.k, v.k, 1))
      .multiply(RxCss(v.rx * deg)).multiply(RyCss(v.ry * deg)).multiply(TO_CSS);
    this.root.matrixWorldNeedsUpdate = true;

    const L = v.L;
    const up = (px) => -px * S; // un desplazamiento en y de la CSS (hacia abajo) es negativo en el modelo
    this.deck.forEach((g) => { g.o.position.copy(g.p); g.o.position.y += up(L.deckY); });
    this.pad.o.position.copy(this.pad.p); this.pad.o.position.y += up(L.deckY - L.padLift);
    this.deckMats.forEach((mt) => { const t = L.deckOp < 0.99; if (mt.transparent !== t) { mt.transparent = t; mt.needsUpdate = true; } mt.opacity = L.deckOp; });
    this.base.forEach((g) => { g.o.position.copy(g.p); g.o.position.y += up(L.bottomY - 14); });
    this.board.o.position.copy(this.board.p); this.board.o.position.y += up(L.mbY - 8);
    this.keys.forEach((g, i) => { g.o.position.copy(g.p); g.o.position.y += up(L.keysY + 3) - (i === v.press ? 0.015 : 0); });
    // Tapa: rotateX(open − 90) de la CSS es rotateX(90 − open) aquí (y invertida); el eje sube y se va hacia atrás
    const lidMove = (o, p) => { o.position.copy(p); o.position.y += up(L.lidY); o.position.z += (L.lidZ + 158) * S; };
    lidMove(this.lid.o, this.lid.p);
    this.lid.o.quaternion.copy(this.lidQ).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (90 - v.open) * deg));
    this.hinges.forEach((g) => lidMove(g.o, g.p));
    this.hole.position.z = L.screenZ * S + 0.0005; // el panel CSS se separa de la tapa en el despiece (translateZ)
    // Piezas de la placa: suben en el despiece; en el rompecabezas van donde las deja el usuario
    const pz = v.puzzle;
    this.pieces.forEach((x) => {
      const [l, t] = pz?.active ? pz.pos[x.pc.key] : x.pc.home;
      const lift = pz?.active ? 3 : (x.pc.lift || 0) * v.e;
      x.o.position.copy(x.p);
      x.o.position.x += (l - x.pc.home[0]) * S;
      x.o.position.z += (t - x.pc.home[1]) * S;
      x.o.position.y += up(L.mbY - 8) + lift * S;
    });
    this.slots.forEach((s, i) => { s.visible = !!pz?.active && !pz.placed.includes(this.pieces[i].pc.key); });
    if (this.blades) { this.fanA += dt * [0, 6, 14, 26][v.fan || 0]; this.blades.rotation.y = this.fanA; }
    if (this.cpuCap) { this.cpuCap.emissive.set(v.heat ? '#FF6B6B' : this.cpuCap.color); this.cpuCap.emissiveIntensity = v.heat ? 0.15 + 0.2 * v.heat : BASE_GLOW; }
    // LED y logo
    if (this.ledFront) this.ledFront.color.set(v.ledOn ? '#8FD8FF' : '#0B3A52'), this.ledFront.emissive.copy(this.ledFront.color);
    if (this.ledCharge) this.ledCharge.color.set(!v.plugged ? '#2C2C31' : v.battery >= 100 ? '#8FD8FF' : '#BCC2CC'), this.ledCharge.emissive.copy(this.ledCharge.color);
    if (this.camLed) this.camLed.color.set(v.camOn ? '#8FD8FF' : '#12202B'), this.camLed.emissive.copy(this.camLed.color);
    if (this.logo) {
      this.logo.color.set(v.power ? v.skill.color : '#4E4E57'); this.logo.emissive.copy(this.logo.color);
      this.logo.emissiveIntensity = v.power ? 0.9 : BASE_GLOW;
    }
    this.bankLeds.forEach((mt) => { mt.color.set(v.plug > 0.97 ? '#8FD8FF' : '#1B2530'); mt.emissive.copy(mt.color); });
    // Cargador: conector y cable (en el despiece no se ve, como en la CSS)
    this.charger.forEach((o) => { o.visible = !v.hidden; });
    this.cable.visible = !v.hidden;
    if (!v.hidden && v.plug !== this.lastPlug) {
      this.lastPlug = v.plug;
      const tip = plugTip(v.plug);
      // El modelo del conector tiene el origen en el extremo de la punta metálica (9 px más allá de la punta de la CSS)
      this.plug.position.copy(fromCss(tip[0] + 9, tip[1] - 1, tip[2]));
      const tail = [tip[0] - PLUG_LEN, tip[1], tip[2]];
      const pts = cablePoints(tail, [1, 0, 0]).map(([x, y, z]) => fromCss(x, y, z));
      pts.push(fromCss(CABLE_ANCHOR[0] - 4, CABLE_ANCHOR[1], CABLE_ANCHOR[2]));
      this.cable.geometry.dispose();
      this.cable.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.04, 8, false);
    }
    // Teclas: la textura solo se repinta cuando cambia algo (no con cada pulsación: esa hunde la tecla)
    const kk = `${v.skill.id}|${v.hover}|${v.power}|${v.lit === null ? 'x' : Math.round(v.lit * 40)}`;
    if (kk !== this.keysKey) {
      this.keysKey = kk;
      drawKeys(this.keysCtx, { skillId: v.skill.id, hover: v.hover, power: v.power, lit: v.lit });
      this.keysTex.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.cable?.geometry.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}
