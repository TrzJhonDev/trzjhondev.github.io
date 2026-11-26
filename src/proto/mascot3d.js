import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
// Los modelos se exportan comprimidos con meshopt desde Blender (sin cuantizar: sin pérdida); este lector los descomprime
const gltfLoader = () => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
import { EYE, EYE_X, EYE_Y, MOUTH, MOUTH_X, MOUTH_Y, P, PUPIL, mirror } from '../components/Mascot/faceData';

// Prototipo de la mascota modelada en Blender (blender/mascota.blend -> public/models/mascota.glb).
// Solo para comparar con la mascota CSS (ver PLAN-MASCOTA-3D.md). No se usa en la página normal.

// Colores por tema: los mismos que las variables --m-* de Mascot.css (PLAN-COLORES.md)
const THEMES = {
  dark: { carcasa: '#5B5E67', articulacion: '#26282D', auricular: '#1E88C2', boton: '#2AB4F4', marco: '#0A0B0D' },
  light: { carcasa: '#C9D2DC', articulacion: '#4E6075', auricular: '#1E88C2', boton: '#097AAE', marco: '#0A0B0D' },
};
const LIT = '#8FD8FF';
const SCREEN = ['#0B1A24', '#061016'];

// Acción -> expresión de la cara (como ACT_EXPR en Mascot.jsx)
const EXPR = { saludo: 'happy', hola: 'happy', susto: 'surprised', risa: 'laugh', celebrar: 'happy', teclear: 'focus', salto: 'happy' };
const LOOPS = new Set(['reposo', 'teclear', 'caminar']);

/** Cara de píxeles en un canvas de 4× (640 × 496) con los mismos datos que Face.jsx. */
function drawFace(ctx, expr, look) {
  const K = 4;
  const g = ctx.createLinearGradient(0, 0, 160 * K, 124 * K);
  g.addColorStop(0, SCREEN[0]); g.addColorStop(1, SCREEN[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 160 * K, 124 * K);
  const e = EYE[expr] ? expr : 'idle';
  const rowsL = EYE[e], rowsR = e === 'laugh' ? mirror(EYE.laugh) : EYE[e];
  const px = (rows, ox, oy) => rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '#') ctx.fillRect((ox + x * P) * K, (oy + y * P) * K, P * K + 0.5, P * K + 0.5);
  }));
  ctx.save();
  ctx.fillStyle = LIT; ctx.shadowColor = 'rgba(143, 216, 255, 0.75)'; ctx.shadowBlur = 16;
  const lx = look.x * 4, ly = look.y * 3; // los ojos se desplazan un poco hacia el puntero
  px(rowsL, EYE_X[0] + lx, EYE_Y + ly); px(rowsR, EYE_X[1] + lx, EYE_Y + ly);
  px(MOUTH[expr] || MOUTH.idle, MOUTH_X, MOUTH_Y);
  if (expr === 'happy' || expr === 'laugh') {
    ctx.globalAlpha = 0.4; ctx.fillRect(16 * K, 76 * K, 14 * K, 7 * K); ctx.fillRect(130 * K, 76 * K, 14 * K, 7 * K);
  }
  ctx.restore();
  const pup = PUPIL[e];
  if (pup) {
    ctx.fillStyle = SCREEN[1];
    [EYE_X[0], EYE_X[1]].forEach((ex) => ctx.fillRect((ex + lx + (pup[0] + look.x * 1.2) * P) * K, (EYE_Y + ly + (pup[1] + look.y) * P) * K, pup[2] * P * K, pup[3] * P * K));
  }
}

/** Pantallita de la consola en reposo: logotipo TRZ_ y "clic: jugar" (como el estado standby de Console.jsx). */
function drawConsole(ctx) {
  const W = 384, H = 216;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, SCREEN[0]); g.addColorStop(1, SCREEN[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.fillStyle = '#2AB4F4';
  ctx.font = '700 72px "IBM Plex Mono", ui-monospace, monospace'; ctx.fillText('TRZ_', W / 2, H / 2 + 14);
  ctx.fillStyle = '#BCC2CC'; ctx.font = '600 28px "IBM Plex Mono", ui-monospace, monospace'; ctx.fillText('clic: jugar', W / 2, H / 2 + 62);
}

export class Mascot3D {
  constructor(container, { onStats } = {}) {
    this.container = container;
    this.onStats = onStats;
    this.expr = 'idle';
    this.look = { x: 0, y: 0, tx: 0, ty: 0 };
    this.clock = new THREE.Clock();
    this.frames = []; // tiempos de los últimos fotogramas (para fps y ms)

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping; // mismos colores que la CSS (ver Mascot3D/engine.js)
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    // Iluminación igual que Mascot3D/engine.js: media emisión propia + una luz blanca arriba a la izquierda
    const key = new THREE.DirectionalLight(0xffffff, Math.PI * 0.64); key.position.set(-0.35, 0.85, 0.4); this.scene.add(key);

    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    this.camera.position.set(0, 1.55, 8.6); this.camera.lookAt(0, 1.4, 0);

    // Texturas de la cara y de la consola
    const face = document.createElement('canvas'); face.width = 640; face.height = 496;
    this.faceCtx = face.getContext('2d');
    this.faceTex = new THREE.CanvasTexture(face); this.faceTex.colorSpace = THREE.SRGBColorSpace; this.faceTex.flipY = false;
    this.faceTex.anisotropy = 4;
    const cons = document.createElement('canvas'); cons.width = 384; cons.height = 216;
    drawConsole(cons.getContext('2d'));
    this.consTex = new THREE.CanvasTexture(cons); this.consTex.colorSpace = THREE.SRGBColorSpace; this.consTex.flipY = false;
    this.redrawFace();

    this.raycaster = new THREE.Raycaster();
    this.onPointer = (ev) => {
      const b = r.domElement.getBoundingClientRect();
      this.look.tx = THREE.MathUtils.clamp((ev.clientX - (b.left + b.width / 2)) / (b.width / 2), -1, 1);
      this.look.ty = THREE.MathUtils.clamp((ev.clientY - (b.top + b.height * 0.32)) / (b.height / 2), -1, 1);
    };
    this.onLeave = () => { this.look.tx = 0; this.look.ty = 0; };
    this.onClick = (ev) => {
      const b = r.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((ev.clientX - b.left) / b.width) * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      if (this.model && this.raycaster.intersectObject(this.model, true).length) {
        this.clicks = (this.clicks || 0) + 1;
        this.play(this.clicks % 2 ? 'susto' : 'risa');
      }
    };
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.documentElement.addEventListener('mouseleave', this.onLeave);
    r.domElement.addEventListener('click', this.onClick);

    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container);
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  async load(url) {
    const gltf = await gltfLoader().loadAsync(url);
    this.model = gltf.scene;
    this.materials = {};
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      const name = o.material.name;
      if (name === 'pantalla_cara' || name === 'pantalla_consola') {
        const map = name === 'pantalla_cara' ? this.faceTex : this.consTex;
        o.material = new THREE.MeshBasicMaterial({ map });
      } else {
        const src = o.material;
        o.material = new THREE.MeshLambertMaterial({ name, color: src.color.clone(), emissive: src.emissive.clone(), emissiveIntensity: src.emissiveIntensity });
        if (name !== 'brillo_lentes') o.material.emissiveIntensity = 0.36;
        (this.materials[name] ||= []).push(o.material);
      }
    });
    this.scene.add(this.model);
    // Encuadre según el tamaño real del modelo (en reposo): así sale del mismo tamaño que la mascota CSS
    this.bounds = new THREE.Box3().setFromObject(this.model);
    this.fit();
    // El hueso (no la malla, que se llama igual): GLTFLoader renombra el duplicado a "cabeza_1"
    this.model.traverse((o) => { if (o.isBone && o.name.replace(/_\d+$/, '') === 'cabeza') this.head = o; });
    this.headRest = this.head?.quaternion.clone();
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    gltf.animations.forEach((clip) => {
      const a = this.mixer.clipAction(clip);
      if (!LOOPS.has(clip.name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; }
      this.actions[clip.name] = a;
    });
    this.mixer.addEventListener('finished', (e) => {
      if (e.action === this.current) this.play('reposo');
    });
    this.current = this.actions.reposo; this.current?.play();
    this.triangles = 0;
    this.model.traverse((o) => { if (o.isMesh) this.triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    return { clips: Object.keys(this.actions), triangles: Math.round(this.triangles) };
  }

  setTheme(theme) {
    const pal = THEMES[theme] || THEMES.dark;
    Object.entries(this.materials || {}).forEach(([name, mats]) => {
      mats.forEach((m) => { if (pal[name]) m.color.set(pal[name]); if (name !== 'brillo_lentes') m.emissive.copy(m.color); });
    });
  }

  play(name) {
    const next = this.actions?.[name];
    if (!next) return;
    if (next === this.current && LOOPS.has(name)) return;
    next.reset(); next.setEffectiveWeight(1); next.play();
    if (this.current && this.current !== next) next.crossFadeFrom(this.current, 0.25, false);
    this.current = next;
    this.setExpr(EXPR[name] || 'idle');
  }

  setExpr(expr) { this.expr = expr; this.redrawFace(); }

  redrawFace() { drawFace(this.faceCtx, this.blinking ? 'blink' : this.expr, this.look); this.faceTex.needsUpdate = true; }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.fit();
  }

  /** Coloca la cámara para que la mascota ocupe FILL del alto (o del ancho, si la caja es estrecha). */
  fit() {
    if (!this.bounds) return;
    const FILL = 0.85;
    const size = this.bounds.getSize(new THREE.Vector3()), center = this.bounds.getCenter(new THREE.Vector3());
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const byH = (size.y / FILL) / 2 / Math.tan(vfov / 2);
    const byW = (size.x / FILL) / 2 / Math.tan(vfov / 2) / this.camera.aspect;
    const dist = Math.max(byH, byW) + size.z / 2;
    this.camera.position.set(center.x, center.y + size.y * 0.04, center.z + dist);
    this.camera.lookAt(center.x, center.y, center.z);
  }

  loop(now) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    // Parpadeo y mirada (la cara se repinta solo si cambia algo)
    const k = 1 - Math.exp(-dt * 8);
    const ox = this.look.x, oy = this.look.y;
    this.look.x += (this.look.tx - this.look.x) * k; this.look.y += (this.look.ty - this.look.y) * k;
    if (!this.nextBlink) this.nextBlink = now + 2500;
    const blink = this.expr === 'idle' && now > this.nextBlink && now < this.nextBlink + 140;
    if (now > this.nextBlink + 140) this.nextBlink = now + 2600 + Math.random() * 3400;
    if (blink !== this.blinking || Math.abs(ox - this.look.x) + Math.abs(oy - this.look.y) > 0.004) { this.blinking = blink; this.redrawFace(); }
    // Animación del esqueleto y, encima, la cabeza girada hacia el puntero
    if (this.mixer) {
      if (this.head) this.head.quaternion.copy(this.headRest);
      this.mixer.update(dt);
      if (this.head) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.look.y * 0.22, this.look.x * 0.5, 0, 'YXZ'));
        this.head.quaternion.multiply(q);
      }
    }
    this.renderer.render(this.scene, this.camera);
    // Estadísticas: fps y milisegundos por fotograma (medio segundo)
    this.frames.push(now);
    while (this.frames.length && now - this.frames[0] > 1000) this.frames.shift();
    if (this.onStats && (!this.lastStats || now - this.lastStats > 500)) {
      this.lastStats = now;
      const n = this.frames.length;
      this.onStats({ fps: n, ms: n > 1 ? (this.frames[n - 1] - this.frames[0]) / (n - 1) : 0, calls: this.renderer.info.render.calls, tris: Math.round(this.triangles || 0) });
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    document.documentElement.removeEventListener('mouseleave', this.onLeave);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
