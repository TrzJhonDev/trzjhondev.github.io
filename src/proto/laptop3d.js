import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
// Los modelos se exportan comprimidos con meshopt desde Blender (sin cuantizar: sin pérdida); este lector los descomprime
const gltfLoader = () => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
import { KEYS, SKILL_KEY_INDEX } from '../components/Laptop3D/keyLayout';
import { highlight, langOf } from '../components/Laptop3D/highlight';
import { SKILLS } from '../data/skills';
import { profile } from '../data/profile';
import { readableOn } from '../lib/math3d';

// Prototipo del portátil modelado en Blender (blender/portatil.blend -> public/models/portatil.glb), ver
// PLAN-PORTATIL-3D.md. Misma luz que la mascota 3D (una luz blanca con la dirección de LIGHT y cada pieza emite
// BASE_GLOW de su color: ninguna cara pasa de su color base). Teclas y pantalla son texturas de canvas.
// Se arrastra para girar (solo en horizontal, como el de la web), un clic en una tecla de skill la carga.

const BASE_GLOW = 0.36;
const S = 0.01; // 1 px de la CSS = 1 cm
const LIFT = { bat: 26, spk: 34, wifi: 44, ram: 52, ssd: 44, cpu: 60, pipe: 92, fan: 70 };
const TOKEN = {
  plain: '#E6E6EA', keyword: '#5CC6F7', string: '#8FC9A8', number: '#D9A27A', comment: '#6B7686', func: '#8FA8E8',
  type: '#D9B97A', const: '#F78C6C', tag: '#F07178', attr: '#8FC7D9', punct: '#8C8C92', prompt: '#8FD8FF', caret: '#8FD8FF',
};
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const ease = (t) => t * t * (3 - 2 * t);

/** Teclado: la capa de 480 × 320 de keyLayout.js a 4× (las teclas tienen UV de vista superior sobre ella). */
function drawKeys(ctx, active, hover) {
  const K = 4;
  ctx.fillStyle = '#151518'; ctx.fillRect(0, 0, 480 * K, 320 * K);
  KEYS.forEach((k, i) => {
    const si = SKILL_KEY_INDEX.indexOf(i);
    const s = si >= 0 ? SKILLS[si] : null;
    const x = k.x * K, y = k.y * K, w = k.w * K, h = k.h * K;
    let bg = '#1B1B1F', fg = '#8C8C92', label = k.label;
    if (s) {
      label = s.badge;
      if (si === active) { bg = s.color; fg = readableOn(s.color); }
      else if (si === hover) { bg = '#26303A'; fg = '#FFFFFF'; }
      else { bg = '#141416'; fg = s.color; }
    }
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 10); ctx.fill();
    if (s && si !== active) { ctx.strokeStyle = `${s.color}88`; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const size = k.row === 0 ? 17 : s ? 26 : label.length > 2 ? 19 : 24;
    ctx.font = `${s ? 700 : 600} ${size}px ${MONO}`;
    ctx.fillText(label, x + w / 2, y + h / 2 + 1, w - 10);
  });
}

/** Pantalla (UV 0–1 sobre 452 × 280 px de la CSS, a 2×): barra con la pestaña, código coloreado y barra de estado. */
function drawScreen(ctx, skill, now) {
  const W = 904, H = 560, s = skill;
  ctx.fillStyle = '#08131B'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#060E14'; ctx.fillRect(0, 0, W, 48);
  ['#F07178', '#D9B97A', '#8FC9A8'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(22 + i * 18, 24, 6, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#08131B'; ctx.fillRect(84, 0, 190, 48);
  ctx.fillStyle = s.color; ctx.fillRect(84, 0, 190, 4);
  ctx.font = `500 18px ${MONO}`; ctx.fillStyle = '#E6E6EA'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(s.file, 104, 26);
  const lang = langOf(s);
  ctx.font = `400 21px ${MONO}`;
  s.code.forEach((line, i) => {
    const y = 84 + i * 32;
    ctx.fillStyle = '#4A5563'; ctx.textAlign = 'right'; ctx.fillText(String(i + 1), 44, y);
    ctx.textAlign = 'left';
    let x = 66;
    highlight(line, lang).forEach((t) => { ctx.fillStyle = TOKEN[t.cls] || TOKEN.plain; ctx.fillText(t.text, x, y); x += ctx.measureText(t.text).width; });
  });
  if (Math.floor(now / 530) % 2 === 0) { ctx.fillStyle = s.color; ctx.fillRect(66, 84 + s.code.length * 32 - 14, 12, 28); }
  // Terminal con la salida
  const ty = H - 36 - 22 - s.out.length * 28;
  ctx.fillStyle = '#060E14'; ctx.fillRect(0, ty - 18, W, H - 36 - ty + 18);
  ctx.font = `400 20px ${MONO}`;
  s.out.forEach((l, i) => { ctx.fillStyle = i === 0 ? '#8FD8FF' : '#E6E6EA'; ctx.fillText(l, 20, ty + 8 + i * 28); });
  ctx.fillStyle = s.color; ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = readableOn(s.color); ctx.font = `600 17px ${MONO}`;
  ctx.fillText(`${profile.brand.toLowerCase()}@portafolio`, 20, H - 18);
  ctx.textAlign = 'right'; ctx.fillText(`${s.cat} · ${s.name}`, W - 20, H - 18);
}

export class Laptop3D {
  constructor(host, { onStats, onSkill } = {}) {
    this.host = host; this.onStats = onStats; this.onSkill = onSkill;
    this.skill = 0; this.hover = -1; this.open = 1; this.explode = 0; this.target = { open: 1, explode: 0 };
    this.yaw = -0.5; this.tyaw = -0.5;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    host.appendChild(r.domElement);
    this.scene = new THREE.Scene();
    const key = new THREE.DirectionalLight(0xffffff, Math.PI * (1 - BASE_GLOW)); key.position.set(-0.35, 0.85, 0.4); this.scene.add(key);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.turntable = new THREE.Group(); this.scene.add(this.turntable);

    const kc = document.createElement('canvas'); kc.width = 1920; kc.height = 1280;
    this.keysCtx = kc.getContext('2d'); this.keysTex = new THREE.CanvasTexture(kc);
    const sc = document.createElement('canvas'); sc.width = 904; sc.height = 560;
    this.scrCtx = sc.getContext('2d'); this.scrTex = new THREE.CanvasTexture(sc);
    [this.keysTex, this.scrTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 8; });

    this.ray = new THREE.Raycaster();
    this.frames = 0; this.t0 = performance.now(); this.cost = 0;
    this.drag = null;
    const el = r.domElement;
    el.style.touchAction = 'pan-y';
    this.onDown = (e) => { this.drag = { x: e.clientX, yaw: this.tyaw, moved: false }; };
    this.onMove = (e) => {
      if (this.drag) {
        const dx = e.clientX - this.drag.x;
        if (Math.abs(dx) > 4) this.drag.moved = true;
        this.tyaw = this.drag.yaw + dx * 0.008;
      } else this.setHover(this.pick(e));
    };
    this.onUp = (e) => {
      const d = this.drag; this.drag = null;
      if (d && !d.moved) { const si = this.pick(e); if (si >= 0) this.setSkill(si); }
    };
    el.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    this.loop = this.loop.bind(this);
  }

  async load(url) {
    const t0 = performance.now();
    const gltf = await gltfLoader().loadAsync(url);
    if (this.disposed) return null;
    const m = this.model = gltf.scene;
    let tris = 0, meshes = 0;
    m.traverse((o) => {
      if (!o.isMesh) return;
      meshes += 1; tris += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      const name = o.material.name;
      if (name === 'pantalla') { o.material = new THREE.MeshBasicMaterial({ map: this.scrTex }); return; }
      const src = o.material;
      const glow = /^led|led_/.test(name);
      const mat = new THREE.MeshLambertMaterial({ name, color: src.color.clone(), map: name === 'tecla' ? this.keysTex : null });
      mat.emissive.copy(src.color); mat.emissiveIntensity = glow ? 1 : BASE_GLOW;
      // Teclas: el color sale de la textura (sombra BASE_GLOW + luz, igual que el resto)
      if (name === 'tecla') { mat.color.set('#ffffff'); mat.emissive.set('#ffffff'); mat.emissiveMap = this.keysTex; }
      o.material = mat;
    });
    const by = (n) => m.getObjectByName(n);
    this.lid = by('tapa');
    this.lidRest = this.lid.quaternion.clone();
    this.blades = by('fan_aspas');
    // Grupos del despiece (cuánto se mueve cada uno en el mundo de Three: y arriba, z hacia delante)
    this.groups = [];
    m.children.forEach((o) => {
      const n = o.name;
      let dy = 0;
      if (n === 'carcasa_sup' || n === 'touchpad' || n === 'boton_encendido') dy = 1.7;
      else if (n.startsWith('tecla_')) dy = 2.85;
      else if (n === 'placa') dy = -0.1;
      else if (n.startsWith('pieza_')) dy = (LIFT[n.slice(6).split('-')[0]] || 0) * S - 0.1;
      else if (/^(base|pata_|tornillo_\d|rejilla|puerto_|led_carga|led_frontal)/.test(n)) dy = -1.3;
      this.groups.push({ o, rest: o.position.clone(), dy });
    });
    // Tapa y bisagras: en el despiece suben y se van hacia atrás (Three.js quita el punto de "bisagra.L")
    this.lidParts = this.groups.filter((g) => g.o.name === 'tapa' || g.o.name.startsWith('bisagra'));
    this.turntable.add(m);
    const box = new THREE.Box3().setFromObject(m); this.bounds = box;
    // Centrado en el portátil (la batería portátil queda a la izquierda), apoyado en y = 0
    m.position.set(0.6, -box.min.y, 0);
    this.paint(); this.resize();
    this.raf = requestAnimationFrame(this.loop);
    return { load: Math.round(performance.now() - t0), tris: Math.round(tris), meshes };
  }

  paint() { drawKeys(this.keysCtx, this.skill, this.hover); this.keysTex.needsUpdate = true; }
  setSkill(i) { this.skill = i; this.paint(); this.onSkill?.(i); }
  setHover(i) { if (i !== this.hover) { this.hover = i; this.paint(); this.renderer.domElement.style.cursor = i >= 0 ? 'pointer' : 'grab'; } }
  setOpen(v) { this.target.open = v; }
  setExplode(v) { this.target.explode = v; }

  /** Índice de la skill bajo el puntero (o -1): raycast contra las teclas tecla_<fila>_<col>. */
  pick(e) {
    if (!this.model) return -1;
    const b = this.renderer.domElement.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) return -1;
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), this.camera);
    const hit = this.ray.intersectObject(this.model, true)[0];
    const m = hit && /^tecla_(\d+)_(\d+)/.exec(hit.object.name);
    if (!m) return -1;
    const ki = KEYS.findIndex((k) => k.row === +m[1] && k.col === +m[2]);
    return SKILL_KEY_INDEX.indexOf(ki);
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    // Vista desde delante, arriba (como la escena CSS)
    const d = 15.5 / Math.min(1, this.camera.aspect / 1.2);
    this.camera.position.set(0, d * 0.55, d * 0.83); this.camera.lookAt(0, 0.9, 0);
  }

  loop(now) {
    this.raf = requestAnimationFrame(this.loop);
    const t = performance.now();
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    const k = 1 - Math.exp(-dt * 6);
    this.yaw += (this.tyaw - this.yaw) * (1 - Math.exp(-dt * 10));
    this.turntable.rotation.y = this.yaw;
    this.open += (this.target.open - this.open) * k;
    this.explode += (this.target.explode - this.explode) * k;
    const e = ease(this.explode);
    // Tapa: de cerrada (90°) a abierta (−20°: 110° como en la web). En el despiece sube y se aleja hacia atrás
    this.lid.quaternion.copy(this.lidRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(90 - 110 * this.open)));
    this.groups.forEach((g) => { g.o.position.copy(g.rest); g.o.position.y += g.dy * e; });
    this.lidParts.forEach((g) => { g.o.position.copy(g.rest); g.o.position.y += 0.9 * e; g.o.position.z -= 1.0 * e; });
    if (this.blades) this.blades.rotation.y += dt * 14;
    drawScreen(this.scrCtx, SKILLS[this.skill], now); this.scrTex.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    this.cost += performance.now() - t; this.frames += 1;
    if (t - this.t0 > 1000) {
      this.onStats?.({ fps: Math.round((this.frames * 1000) / (t - this.t0)), ms: (this.cost / this.frames).toFixed(2) });
      this.frames = 0; this.cost = 0; this.t0 = t;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf); this.ro.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}
