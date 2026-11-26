// Director del escenario de Contacto (Jhon, 24/11/2026: "que la mascota camine, agarre los contenedores y los mueva;
// si se lo quito, que se ponga triste; que dé la vuelta, se ponga de espalda… todo muy fluido").
//
// Todo va en px de la caja del escenario: la mascota 3D (cámara ortográfica, ver fitStage() en engine.js) camina por
// la línea del suelo y las tarjetas son HTML normales (botones y enlaces reales) que se colocan con transform encima
// del canvas. Un solo bucle: el del motor 3D llama a update() en cada fotograma (se para fuera de pantalla).
// No importa Three.js: la página principal no cambia de peso.

const GAP = 16; // separación mínima entre tarjetas
const EDGE = 16; // margen a los lados de la caja
const SPEED = 78; // px/s al caminar
const FRONT = 0, SIDE = Math.PI / 2, BACK = Math.PI;
const LIFT_T = 0.42, DROP_T = 0.36; // s para levantar y dejar una tarjeta
const DRAG_PX = 6; // px que hay que mover el puntero para que un clic pase a ser arrastre

const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const smooth = (dt, rate) => 1 - Math.exp(-dt * rate);

export class ContactStage {
  /**
   * el: la caja del escenario (.cta__stage). Las tarjetas llevan data-card="id" (y data-big la del mensaje).
   * hooks: { say(key, ms) } para que Contact.jsx cambie el texto del globo.
   */
  constructor(el, hooks) {
    this.el = el; this.hooks = hooks;
    this.bubble = el.querySelector('.cta__bubble');
    this.shadow = el.querySelector('.cta__shadow');
    this.cards = [...el.querySelectorAll('[data-card]')].map((node) => ({
      id: node.dataset.card, el: node, big: node.dataset.big != null,
      w: node.offsetWidth, h: node.offsetHeight, x: 0, tx: 0, lift: 0, tilt: 0, drag: null, held: false, lastLift: -1,
    }));
    this.m = { x: 0, yaw: FRONT, tyaw: FRONT, phase: 0 };
    this.plan = []; this.step = null;
    this.carry = null; // { card, p, x0, dropping }
    this.attn = null; // id de la tarjeta que tiene el puntero o el foco
    this.sad = null; // tarjeta que le quitaron (mientras está triste)
    this.bubbleH = 0; this.bubbleW = 0;
    this.listeners = [];
  }

  /** Empieza: toma las posiciones que el CSS dio a las tarjetas (sin salto) y pasa a colocarlas a mano. */
  attach(engine) {
    this.engine = engine;
    const box = this.el.getBoundingClientRect();
    this.cards.forEach((c) => {
      const r = c.el.getBoundingClientRect();
      c.w = c.el.offsetWidth; c.h = c.el.offsetHeight;
      c.x = c.tx = r.left - box.left + r.width / 2;
    });
    const bot = this.el.querySelector('.cta__bot');
    const br = bot?.getBoundingClientRect();
    this.m.x = br ? br.left - box.left + br.width / 2 : box.width - 110;
    this.el.classList.add('is-live');
    Object.values(engine.actions || {}).forEach((a) => { const n = a.getClip().name; if (n === 'caminar' || n === 'caminar_carga') a.timeScale = 1.5; });
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(this.el);
    if (this.bubble) this.ro.observe(this.bubble);
    this.cards.forEach((c) => this.bindDrag(c));
    this.queue([{ t: 'wait', s: 1.6 }]);
  }

  measure() {
    this.cards.forEach((c) => { c.w = c.el.offsetWidth; c.h = c.el.offsetHeight; });
    this.bubbleH = this.bubble?.offsetHeight || 0; this.bubbleW = this.bubble?.offsetWidth || 0;
    this.resolve();
  }

  dispose() {
    this.ro?.disconnect();
    this.listeners.forEach(([n, type, fn, cap]) => n.removeEventListener(type, fn, cap));
    this.el.classList.remove('is-live');
    this.cards.forEach((c) => { c.el.style.transform = ''; c.el.classList.remove('is-dragging', 'is-held'); });
    if (this.bubble) this.bubble.style.transform = '';
    if (this.engine) this.engine.lookHold = null;
  }

  // ── Interacción del usuario ────────────────────────────────────────────────────

  /** El puntero o el foco está en una tarjeta (o en ninguna: null). La mascota se detiene a mirarla. */
  attend(id) {
    this.attn = id;
    if (!id || this.sad || this.carry) return;
    // Si estaba paseando, curioseando de espalda o yendo a por otra tarjeta, se para y se vuelve hacia ti
    this.queue([{ t: 'face', yaw: FRONT, hold: 0.6 }, { t: 'wait', s: 2.2 }]);
  }

  on(node, type, fn, cap = false) { node.addEventListener(type, fn, cap); this.listeners.push([node, type, fn, cap]); }

  bindDrag(c) {
    let start = null, moved = false;
    this.on(c.el, 'pointerdown', (ev) => {
      if (ev.button !== 0 || ev.target.closest('textarea, input')) return;
      start = { px: ev.clientX, py: ev.clientY, x: c.x, lift: c.lift, id: ev.pointerId };
      moved = false;
    });
    this.on(c.el, 'pointermove', (ev) => {
      if (!start || ev.pointerId !== start.id) return;
      const dx = ev.clientX - start.px, dy = ev.clientY - start.py;
      if (!c.drag) {
        if (Math.hypot(dx, dy) < DRAG_PX) return;
        c.drag = true; moved = true;
        try { c.el.setPointerCapture(ev.pointerId); } catch { /* el puntero ya no está */ }
        c.el.classList.add('is-dragging');
        this.grabbed(c);
        // Si la llevaba, se queda donde está la tarjeta ahora (no salta al puntero)
        start.x = c.x; start.lift = c.lift; start.px = ev.clientX; start.py = ev.clientY;
      }
      const M = this.engine.metrics;
      c.x = clamp(start.x + (ev.clientX - start.px), c.w / 2, M.W - c.w / 2);
      c.lift = clamp(start.lift - (ev.clientY - start.py), 0, M.floorY - c.h);
      c.tilt = clamp((ev.movementX || 0) * 0.6, -8, 8);
    });
    const end = () => {
      if (!start) return;
      start = null;
      if (!c.drag) return;
      c.drag = false; c.tx = c.x;
      c.el.classList.remove('is-dragging');
      this.resolve(c);
    };
    this.on(c.el, 'pointerup', end);
    this.on(c.el, 'pointercancel', end);
    // Un arrastre no es un clic: no abre el enlace ni copia el correo
    this.on(c.el, 'click', (ev) => { if (moved) { ev.preventDefault(); ev.stopPropagation(); moved = false; } }, true);
    this.on(c.el, 'dragstart', (ev) => ev.preventDefault());
  }

  /** El usuario agarró una tarjeta. Si era la que llevaba la mascota, se pone triste; si iba a por ella, se sorprende. */
  grabbed(c) {
    if (this.carry?.card === c) {
      this.carry = null; c.held = false; c.el.classList.remove('is-held');
      this.sad = c;
      this.hooks.say('triste', 3200);
      this.queue([{ t: 'sad', s: 2.8 }, { t: 'say', key: 'recupera', ms: 3000 }, { t: 'anim', name: 'hola' }, { t: 'wait', s: 1.4 }]);
      return;
    }
    if (this.plan.some((s) => s.t === 'grab' && s.card === c) || (this.step?.t === 'grab' && this.step.card === c)) {
      this.queue([{ t: 'anim', name: 'susto' }, { t: 'wait', s: 1.2 }]);
    }
  }

  // ── Planes ───────────────────────────────────────────────────────────────────

  queue(steps) { this.plan = steps; this.step = null; }

  /** Elige lo siguiente que hace: mover una tarjeta, pasear, mirar de espaldas, saludar o quedarse mirándote. */
  think() {
    const r = Math.random();
    const M = this.engine.metrics;
    let steps = null;
    if (r < 0.5) steps = this.moveCardPlan();
    if (!steps && r < 0.68) {
      steps = [{ t: 'walk', x: rand(EDGE + 60, M.W - EDGE - 60) }, { t: 'face', yaw: FRONT, hold: 0.2 }];
    }
    if (!steps && r < 0.82) steps = [{ t: 'face', yaw: BACK, hold: rand(1.4, 2.4) }, { t: 'face', yaw: FRONT, hold: 0.3 }];
    if (!steps && r < 0.9) steps = [{ t: 'face', yaw: FRONT, hold: 0.1 }, { t: 'anim', name: 'hola' }];
    if (!steps) steps = [{ t: 'face', yaw: FRONT, hold: rand(1.5, 3) }];
    steps.push({ t: 'wait', s: rand(1, 2.4) });
    this.queue(steps);
  }

  /** ¿Se puede llevar esta tarjeta? No si la usas tú (puntero, foco, mensaje a medio escribir) o la arrastras. */
  free(c) {
    if (c.drag || c.id === this.attn || c.el.contains(document.activeElement)) return false;
    const box = c.el.querySelector('textarea');
    return !(box && box.value.trim());
  }

  moveCardPlan() {
    const M = this.engine.metrics;
    const list = this.cards.filter((c) => this.free(c));
    for (let tries = 0; tries < 4 && list.length; tries += 1) {
      const c = list.splice(Math.floor(Math.random() * list.length), 1)[0];
      const target = this.freeSpot(c);
      if (target == null) continue;
      if (!c.big) {
        const steps = [{ t: 'walk', x: c.x }, { t: 'face', yaw: FRONT, hold: 0.15 }, { t: 'grab', card: c }];
        if (Math.random() < 0.4) steps.push({ t: 'say', key: 'mover', ms: 2600 });
        steps.push({ t: 'walk', x: target }, { t: 'face', yaw: FRONT, hold: 0.1 }, { t: 'drop' });
        if (Math.random() < 0.3) steps.push({ t: 'anim', name: 'celebrar' });
        return steps;
      }
      // La del mensaje es grande: la empuja de lado (se pone junto a ella y camina con los brazos por delante)
      const dir = Math.sign(target - c.x);
      const reach = c.w / 2 + M.mpx * 0.2;
      const stand = c.x - dir * reach;
      if (stand < EDGE + 30 || stand > M.W - EDGE - 30) continue;
      return [
        { t: 'walk', x: stand }, { t: 'face', yaw: dir * SIDE, hold: 0.1 }, { t: 'grab', card: c },
        { t: 'walk', x: target - dir * reach }, { t: 'drop' },
        { t: 'walk', x: target - dir * (reach + 36) }, { t: 'face', yaw: FRONT, hold: 0.2 },
      ];
    }
    return null;
  }

  /** Un hueco libre para la tarjeta c (lejos de donde está), o null. */
  freeSpot(c) {
    const M = this.engine.metrics;
    const others = this.cards.filter((o) => o !== c).sort((a, b) => a.tx - b.tx);
    const spots = [];
    let left = EDGE;
    [...others, null].forEach((o) => {
      const right = o ? o.tx - o.w / 2 : M.W - EDGE;
      const a = left + GAP + c.w / 2, b = right - GAP - c.w / 2;
      if (b >= a) spots.push([a, b]);
      if (o) left = o.tx + o.w / 2;
    });
    const far = spots.map(([a, b]) => {
      const x = rand(a, b);
      return Math.abs(x - c.x) > 110 ? x : (Math.abs(a - c.x) > Math.abs(b - c.x) ? a : b);
    }).filter((x) => Math.abs(x - c.x) > 110);
    return far.length ? far[Math.floor(Math.random() * far.length)] : null;
  }

  /** Que ninguna tarjeta del suelo se monte sobre otra (la que se acaba de soltar, keep, se queda si cabe). */
  resolve(keep) {
    const M = this.engine?.metrics;
    if (!M) return;
    const floor = this.cards.filter((c) => !c.held && !c.drag).sort((a, b) => (a.tx - b.tx) || (a === keep ? -1 : 1));
    // Hacia la derecha y luego hacia la izquierda, sin salirse de la caja
    for (let i = 1; i < floor.length; i += 1) {
      const p = floor[i - 1], c = floor[i], min = p.tx + p.w / 2 + GAP + c.w / 2;
      if (c.tx < min) c.tx = min;
    }
    let max = M.W - EDGE;
    for (let i = floor.length - 1; i >= 0; i -= 1) {
      const c = floor[i];
      c.tx = Math.min(c.tx, max - c.w / 2);
      max = c.tx - c.w / 2 - GAP;
    }
    let min = EDGE;
    floor.forEach((c) => { c.tx = Math.max(c.tx, min + c.w / 2); min = c.tx + c.w / 2 + GAP; });
  }

  // ── Fotograma ────────────────────────────────────────────────────────────────

  /** Pose en bucle según lo que hace: caminar o estar quieta, con o sin tarjeta. */
  pose(moving) {
    const name = this.carry ? (moving ? 'caminar_carga' : 'cargar') : (moving ? 'caminar' : 'reposo');
    this.engine.pose(name);
  }

  /** Giro objetivo por el camino corto (de espaldas puede ser π o −π). */
  aim(yaw) {
    let t = yaw;
    while (t - this.m.yaw > Math.PI + 0.01) t -= 2 * Math.PI;
    while (t - this.m.yaw < -Math.PI - 0.01) t += 2 * Math.PI;
    this.m.tyaw = t;
  }

  tick(dt) {
    const m = this.m, e = this.engine, M = e.metrics;
    if (!this.step) {
      this.step = this.plan.shift() || null;
      if (!this.step) { this.think(); this.step = this.plan.shift(); }
      this.step.time = 0;
      if (this.step.t === 'anim') e.play(this.step.name);
      if (this.step.t === 'say') { this.hooks.say(this.step.key, this.step.ms); this.step = null; return; }
      if (this.step.t === 'sad') { e.pose('triste'); this.aim(FRONT); }
    }
    const s = this.step;
    s.time += dt;
    let done = false;
    switch (s.t) {
      case 'wait': this.pose(false); done = s.time > s.s; break;
      case 'face':
        this.pose(false); this.aim(s.yaw);
        if (Math.abs(m.yaw - m.tyaw) < 0.08) { s.held = (s.held || 0) + dt; done = s.held > s.hold; }
        break;
      case 'anim': done = s.time > 0.2 && !e.oneShot(); break;
      case 'walk': {
        const x = clamp(s.x, EDGE + 30, M.W - EDGE - 30);
        const dx = x - m.x;
        // Con la tarjeta que miras en la mano, se para y te la enseña
        const showing = this.carry && this.carry.card.id === this.attn;
        if (Math.abs(dx) < 1.5 || showing) {
          if (showing) { this.pose(false); this.aim(FRONT); break; }
          done = true; break;
        }
        const dir = Math.sign(dx);
        // De empujar, mira a la tarjeta (va hacia delante); si no, hacia donde camina
        this.aim(dir * SIDE);
        this.pose(true);
        // Primero gira, luego anda (y no anda mientras suena una acción suelta, como el susto de un clic)
        if (Math.abs(m.yaw - m.tyaw) < 0.5 && !e.oneShot()) {
          const v = SPEED * Math.min(1, Math.abs(dx) / 30 + 0.35);
          m.x += dir * Math.min(Math.abs(dx), v * dt);
          m.phase += dt * 1.5;
        }
        break;
      }
      case 'grab': {
        const c = s.card;
        if (!this.carry) {
          if (!this.free(c)) { this.queue([{ t: 'face', yaw: FRONT, hold: 0.8 }]); return; }
          this.carry = { card: c, p: 0, x0: c.x, off: c.x - m.x };
          c.held = true; c.el.classList.add('is-held');
        }
        this.pose(false);
        this.carry.p = Math.min(1, this.carry.p + dt / LIFT_T);
        done = this.carry.p >= 1;
        break;
      }
      case 'drop': {
        const k = this.carry;
        if (!k) { done = true; break; }
        k.dropping = true;
        k.p = Math.max(0, k.p - dt / DROP_T);
        if (k.p <= 0) {
          k.card.held = false; k.card.tx = k.card.x; k.card.el.classList.remove('is-held');
          this.carry = null; this.resolve(k.card); this.pose(false);
          done = true;
        }
        break;
      }
      case 'sad': done = s.time > s.s; break;
      default: done = true;
    }
    if (done) {
      if (s.t === 'sad') { this.sad = null; e.base = 'reposo'; }
      this.step = null;
    }
  }

  /** Lo llama el motor 3D en cada fotograma, antes de mover el esqueleto y dibujar. */
  update(dt) {
    const e = this.engine, M = e?.metrics;
    if (!M || !e.model) return;
    const m = this.m;
    this.tick(dt);
    m.yaw += (m.tyaw - m.yaw) * smooth(dt, 6.5);
    // El giro se guarda entre −π y π (una vuelta entera no se nota)
    if (Math.abs(m.yaw) > Math.PI) { const w = Math.sign(m.yaw) * 2 * Math.PI; m.yaw -= w; m.tyaw -= w; }
    m.x = clamp(m.x, EDGE + 30, M.W - EDGE - 30);
    e.model.position.x = (m.x - M.W / 2) * M.wpp;
    e.model.rotation.y = m.yaw;
    e.anchorX = m.x;

    // Mirada: triste mira la tarjeta que perdió (hacia abajo); si arrastras una, la sigue; si señalas una, la mira
    const dragged = this.cards.find((c) => c.drag);
    const toward = (c, dy) => ({ dx: clamp((c.x - m.x) / 280, -1, 1), dy });
    const sideways = Math.abs(Math.sin(m.yaw)) > 0.5 || Math.abs(m.yaw) > 2;
    if (this.sad) e.lookHold = toward(this.sad, 0.55);
    else if (dragged) e.lookHold = toward(dragged, 0.1);
    else if (this.attn && !sideways) e.lookHold = toward(this.cards.find((c) => c.id === this.attn) || { x: m.x }, 0.25);
    else if (sideways) e.lookHold = { dx: 0, dy: 0.1 }; // de lado o de espaldas no sigue el puntero
    else e.lookHold = null;

    this.layout(dt);
  }

  layout(dt) {
    const M = this.engine.metrics, m = this.m, k = this.carry;
    const follow = smooth(dt, 9);
    this.cards.forEach((c) => {
      if (c.drag) { /* lo coloca el puntero */ } else if (k && k.card === c) {
        // En las manos: de lado la tarjeta va por delante; de frente, delante del pecho
        const p = ease(k.p);
        let hx, hl;
        if (c.big) { hx = m.x + k.off; hl = 0; } else {
          hx = m.x + Math.sin(m.yaw) * (M.mpx * 0.16 + c.w * 0.3);
          hl = Math.max(6, M.mpx * 0.36 - c.h / 2) + Math.sin(m.phase * Math.PI * 2) * 2;
        }
        const from = k.dropping ? c.x : k.x0;
        if (!k.dropping) { c.x = from + (hx - from) * p; c.lift = hl * p; } else { c.x = hx; c.lift = hl * p; }
        c.tilt = c.big ? 0 : Math.sin(m.phase * Math.PI * 2) * 2.2 * p;
      } else {
        c.x += (c.tx - c.x) * follow;
        c.lift += (0 - c.lift) * smooth(dt, 11);
        if (c.lift < 0.2) c.lift = 0;
        c.tilt += (0 - c.tilt) * follow;
      }
      const top = M.floorY - c.h - c.lift;
      c.el.style.transform = `translate3d(${(c.x - c.w / 2).toFixed(1)}px, ${top.toFixed(1)}px, 0) rotate(${c.tilt.toFixed(2)}deg)`;
      const l = Math.round(c.lift);
      if (l !== c.lastLift) { c.el.style.setProperty('--lift', String(l)); c.lastLift = l; }
    });
    // Globo sobre la cabeza y sombra bajo los pies
    if (this.bubble) {
      const bw = this.bubbleW; // medido por el ResizeObserver: leerlo aquí forzaría un cálculo de diseño por fotograma
      const bx = clamp(m.x - bw / 2, 8, M.W - bw - 8);
      const by = Math.max(4, M.floorY - M.mpx - 10 - this.bubbleH);
      this.bubble.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`;
      this.bubble.style.setProperty('--tip', `${clamp(m.x - bx, 18, bw - 18).toFixed(1)}px`);
    }
    if (this.shadow) this.shadow.style.transform = `translate3d(${(m.x - 60).toFixed(1)}px, ${(M.floorY - 9).toFixed(1)}px, 0)`;
  }
}
