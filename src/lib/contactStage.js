// Director del escenario de Contacto: "Abrir conexión" como un panel de puertos con cable (Jhon, 26/11/2026, opción C
// de 4 propuestas, "pero que la mascota siga moviéndose, desplazándose"). Sustituye al de las tarjetas que llevaba de
// un sitio a otro (24/11/2026).
//
// En la pared del fondo hay un panel con un puerto por canal (Copiar correo, GitHub, LinkedIn, CV): botones y enlaces
// reales. La mascota lleva en la mano un conector con cable que sale de un servidor del suelo (rack); pasea, se da la vuelta,
// salta y lo enchufa en un puerto (se enciende su luz y dice "en línea"); luego lo desenchufa y sigue. Si señalas o
// enfocas un puerto, va a ese y lo conecta. El conector se puede arrastrar: si se lo quitas de la mano se pone triste;
// si lo sueltas cerca de un puerto queda enchufado; si no, cae al suelo y ella vuelve a por él.
//
// Todo va en px de la caja del escenario: la mascota 3D (cámara ortográfica, fitStage() en engine.js) camina por la
// línea del suelo; el conector, el cable (SVG, que rodea su silueta: route()), el globo y la sombra se colocan con transform en el mismo bucle del
// motor 3D (update() en cada fotograma; se para fuera de pantalla). No importa Three.js.

const EDGE = 16; // margen a los lados de la caja
const SPEED = 78; // px/s al pasear
const RUSH = 1.9; // más deprisa cuando va a un puerto que señalas
const FRONT = 0, SIDE = Math.PI / 2, BACK = Math.PI;
const DRAG_PX = 6; // px que hay que mover el puntero para que sea arrastre
const SNAP_PX = 44; // distancia a un enchufe para que el conector suelto quede enchufado
const PLUG_H = 30; // alto del conector (CSS .cta__plug: punta 9 + cuerpo 21)
const TIP = 9; // alto de la punta de metal del conector (CSS .cta__plug i): entra entera en el enchufe
const SOCK_H = 10; // alto del puerto metálico (CSS .cta__socket; su boca está en la cara de abajo)
const INSERT_T = 0.26, EXTRACT_T = 0.18; // s para meter y sacar la punta

const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const smooth = (dt, rate) => 1 - Math.exp(-dt * rate);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];


export class ContactStage {
  /**
   * el: la caja del escenario (.cta__stage). Puertos: [data-port="id"] (con .cta__socket dentro); listo = sin aria-disabled.
   * hooks: { say(key, ms), hint(id) } para que Contact.jsx cambie el texto del globo.
   */
  constructor(el, hooks) {
    this.el = el; this.hooks = hooks;
    this.bubble = el.querySelector('.cta__bubble');
    this.shadow = el.querySelector('.cta__shadow');
    this.plugEl = el.querySelector('.cta__plug');
    this.cable = el.querySelector('.cta__cable');
    this.cablePath = this.cable?.querySelector('path');
    this.hubEl = el.querySelector('.cta__server'); // base del cable: un servidor en el suelo
    this.hubPort = el.querySelector('.cta__server-port');
    this.ports = [...el.querySelectorAll('[data-port]')].map((node) => ({
      id: node.dataset.port, el: node, ready: node.getAttribute('aria-disabled') !== 'true', x: 0, y: 0,
    }));
    this.m = { x: 0, yaw: FRONT, tyaw: FRONT, phase: 0 };
    // Conector: 'hand' (en la mano) | 'port' (enchufado) | 'floor' (en el suelo) | 'drag' (lo lleva el puntero)
    this.plug = { state: 'hand', x: 0, y: 0, port: null, fly: null };
    this.hub = { x: 0, y: 0 };
    this.serverLeft = Infinity;
    this.detour = 0; // desvío del cable sobre la cabeza (px), suavizado
    this.tipHide = 0; // px de punta de metal ya dentro del enchufe
    this.plan = []; this.step = null;
    this.attn = null; // id del puerto que tiene el puntero o el foco
    this.sad = false;
    this.lastPort = null;
    this.bubbleH = 0; this.bubbleW = 0;
    this.listeners = [];
  }

  attach(engine) {
    this.engine = engine;
    const box = this.el.getBoundingClientRect();
    const bot = this.el.querySelector('.cta__bot');
    const br = bot?.getBoundingClientRect();
    this.m.x = br ? br.left - box.left + br.width / 2 : box.width * 0.4;
    this.el.classList.add('is-live');
    Object.values(engine.actions || {}).forEach((a) => { const n = a.getClip().name; if (n === 'caminar' || n === 'caminar_carga') a.timeScale = 1.5; });
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(this.el);
    if (this.bubble) this.ro.observe(this.bubble);
    this.measure();
    const h = this.hand();
    this.plug.x = h.x; this.plug.y = h.y;
    this.bindDrag();
    this.queue([{ t: 'wait', s: 1.2 }]);
  }

  /** Posiciones de los enchufes y del puerto del servidor (solo aquí se lee el diseño, nunca en cada fotograma). */
  measure() {
    const box = this.el.getBoundingClientRect();
    this.ports.forEach((p) => {
      const r = (p.el.querySelector('.cta__socket') || p.el).getBoundingClientRect();
      p.x = r.left - box.left + r.width / 2; p.y = r.top - box.top + r.height / 2;
    });
    if (this.hubPort) {
      const r = this.hubPort.getBoundingClientRect();
      this.hub = { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    }
    this.serverLeft = this.hubEl ? this.hubEl.getBoundingClientRect().left - box.left : box.width;
    if (this.cable) this.cable.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`);
    this.bubbleH = this.bubble?.offsetHeight || 0; this.bubbleW = this.bubble?.offsetWidth || 0;
    if (this.plug.state === 'port' && this.plug.port) { this.plug.x = this.plug.port.x; this.plug.y = this.socketY(this.plug.port); }
  }

  dispose() {
    this.ro?.disconnect();
    this.listeners.forEach(([n, type, fn, cap]) => n.removeEventListener(type, fn, cap));
    this.el.classList.remove('is-live', 'is-behind');
    this.ports.forEach((p) => delete p.el.dataset.link);
    if (this.hubEl) delete this.hubEl.dataset.link;
    [this.bubble, this.plugEl, this.shadow].forEach((n) => { if (n) n.style.transform = ''; });
    if (this.engine) this.engine.lookHold = null;
  }

  on(node, type, fn, cap = false) { node.addEventListener(type, fn, cap); this.listeners.push([node, type, fn, cap]); }

  // ── Geometría ────────────────────────────────────────────────────────────────

  /** Centro del conector cuando lo lleva: en una mano, a un costado (no tapa la pantallita del pecho). */
  hand() {
    const M = this.engine.metrics, m = this.m;
    return {
      // De frente o de espaldas, junto a la mano (fuera del brazo); de lado, por delante del cuerpo
      x: m.x + Math.cos(m.yaw) * M.mpx * 0.4 + Math.sin(m.yaw) * M.mpx * 0.27,
      y: M.floorY - M.mpx * 0.3 + Math.sin(m.phase * Math.PI * 2) * 2,
    };
  }
  /** Borde inferior del enchufe (por ahí entra la punta). p.y es el centro del enchufe. */
  sockBottom(p) { return p.y + SOCK_H / 2; }
  /** Centro del conector enchufado del todo: la punta de metal (TIP px) dentro, el cuerpo justo bajo el enchufe. */
  socketY(p) { return this.sockBottom(p) + PLUG_H / 2 - TIP; }
  /** Centro del conector alineado bajo el enchufe, con la punta a punto de entrar. */
  preY(p) { return this.sockBottom(p) + PLUG_H / 2 + 3; }
  /** Hasta dónde puede caminar: el servidor también choca (no se mete delante de él ni lo atraviesa). */
  maxX() { const M = this.engine.metrics; return Math.min(M.W - EDGE - 30, this.serverLeft - M.mpx * 0.4); }
  walkX(x) { return clamp(x, EDGE + 30, this.maxX()); }
  /**
   * Dónde se pone para enchufar o desenchufar un puerto: a un costado, no debajo, para que el conector suba por fuera
   * de su cabeza y el cable caiga recto sin tocarla. De espaldas la mano queda a su izquierda (−x): se pone a la derecha
   * del puerto; si ahí se sale del escenario, se pone a la izquierda y lo hace de frente.
   */
  standFor(port) {
    const M = this.engine.metrics, off = M.mpx * 0.56; // también al girar (cabeza cúbica: de 45° se ve más ancha)
    if (port.x + off <= this.maxX()) return [{ t: 'walk', x: port.x + off }, { t: 'face', yaw: BACK, hold: 0.05 }];
    return [{ t: 'walk', x: port.x - off }, { t: 'face', yaw: FRONT, hold: 0.05 }];
  }
  /** Mitad del ancho de su silueta (cabeza y cuerpo con brazos) según hacia dónde mira: de lado es más estrecha. */
  halves() {
    const M = this.engine.metrics, c = Math.abs(Math.cos(this.m.yaw)), s = Math.abs(Math.sin(this.m.yaw));
    return { head: M.mpx * (0.37 * c + 0.33 * s), body: M.mpx * (0.33 * c + 0.2 * s) };
  }

  // ── Interacción del usuario ──────────────────────────────────────────────────

  /** El puntero o el foco está en un puerto (o en ninguno: null): va a ese puerto y lo conecta. */
  attend(id) {
    this.attn = id;
    const P = this.plug;
    if (!id || this.sad || P.state === 'drag' || P.fly || P.ins) return;
    const port = this.ports.find((p) => p.id === id);
    if (!port) return;
    if (P.state === 'port' && P.port === port) { this.queue([{ t: 'face', yaw: FRONT, hold: 0.4 }, { t: 'wait', s: 3 }]); return; }
    const steps = [];
    if (P.state === 'floor') steps.push({ t: 'walk', x: P.x, rush: true }, { t: 'pickup' });
    const rush = (list) => list.map((st) => (st.t === 'walk' ? { ...st, rush: true } : st));
    if (P.state === 'port') steps.push(...rush(this.standFor(P.port)), { t: 'unplug' });
    steps.push(...rush(this.standFor(port)), { t: 'connect', port, quiet: true }, { t: 'face', yaw: FRONT, hold: 0.3 }, { t: 'wait', s: 3 });
    this.queue(steps);
  }

  bindDrag() {
    const el = this.plugEl;
    if (!el) return;
    let start = null;
    this.on(el, 'pointerdown', (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      const box = this.el.getBoundingClientRect();
      start = { px: ev.clientX, py: ev.clientY, id: ev.pointerId, box, ox: this.plug.x - (ev.clientX - box.left), oy: this.plug.y - (ev.clientY - box.top), dragging: false };
      // Captura ya: un gesto rápido sale del conector (18 px) antes de llegar al umbral de arrastre
      try { el.setPointerCapture(ev.pointerId); } catch { /* el puntero ya no está */ }
    });
    this.on(el, 'pointermove', (ev) => {
      if (!start || ev.pointerId !== start.id) return;
      if (!start.dragging) {
        if (Math.hypot(ev.clientX - start.px, ev.clientY - start.py) < DRAG_PX) return;
        start.dragging = true;
        el.classList.add('is-dragging');
        this.grabbed();
      }
      const M = this.engine.metrics;
      this.plug.x = clamp(ev.clientX - start.box.left + start.ox, 10, M.W - 10);
      this.plug.y = clamp(ev.clientY - start.box.top + start.oy, PLUG_H / 2, M.floorY - PLUG_H / 2);
    });
    const end = () => {
      if (!start) return;
      const was = start.dragging;
      start = null;
      if (!was) return;
      el.classList.remove('is-dragging');
      this.released();
    };
    this.on(el, 'pointerup', end);
    this.on(el, 'pointercancel', end);
  }

  /** El usuario agarró el conector: si lo llevaba ella, se pone triste; si estaba enchufado, se desconecta. */
  grabbed() {
    const P = this.plug;
    const from = P.state;
    if (P.port) this.setLink(P.port, null);
    P.fly = null; P.ins = null; P.state = 'drag'; P.port = null;
    if (from === 'hand') {
      this.sad = true;
      this.hooks.say('triste', 3200);
      this.queue([{ t: 'sad', s: 2.8 }, { t: 'say', key: 'recupera', ms: 3000 }, { t: 'anim', name: 'hola' }, { t: 'wait', s: 1 }]);
    } else if (!this.sad) {
      this.queue([{ t: 'face', yaw: FRONT, hold: 0.2 }, { t: 'anim', name: 'susto' }, { t: 'wait', s: 1 }]);
    }
  }

  /** Lo soltó: cerca de un enchufe queda enchufado; si no, cae al suelo. */
  released() {
    const P = this.plug;
    const near = this.ports
      .map((p) => ({ p, d: Math.hypot(p.x - P.x, this.preY(p) - P.y) }))
      .filter((o) => o.d < SNAP_PX).sort((a, b) => a.d - b.d)[0];
    if (near) {
      P.state = 'snap'; // de camino al enchufe (stepPlug no mueve un conector en 'drag')
      this.fly(near.p, 0.14, 'port');
      if (!this.sad) this.queue([{ t: 'face', yaw: FRONT, hold: 0.2 }, { t: 'anim', name: near.p.ready ? 'celebrar' : 'susto' }, { t: 'wait', s: 2 }]);
    } else {
      const M = this.engine.metrics;
      P.state = 'floor';
      P.fly = { from: { x: P.x, y: P.y }, to: { x: P.x, y: M.floorY - PLUG_H / 2 }, p: 0, dur: 0.32, then: 'floor', fall: true };
    }
  }

  // ── Conector ─────────────────────────────────────────────────────────────────

  /** Vuela el conector hasta un puerto ('port') o hasta la mano ('hand'), con una curva suave. */
  fly(target, dur, then) {
    const P = this.plug;
    P.fly = { from: { x: P.x, y: P.y }, target, p: 0, dur, then };
    if (then === 'port') P.port = target;
  }

  /** Luz del puerto (y la actividad del servidor): 'on' si tiene señal, 'nosignal' si el dato aún es un marcador, null apagado. */
  setLink(port, v) {
    if (!port) return;
    if (v) port.el.dataset.link = v; else delete port.el.dataset.link;
    if (this.hubEl) { if (v === 'on') this.hubEl.dataset.link = 'on'; else delete this.hubEl.dataset.link; }
  }

  /**
   * Enchufar en dos tiempos: vuela hasta quedar alineado justo debajo del enchufe (preY) y después sube despacio
   * hasta dentro (socketY) mientras la punta de metal se oculta en el enchufe (layout: --tip-hide). Al terminar se
   * enciende el puerto. Desenchufar es lo mismo al revés y luego vuela a la mano.
   */
  insert(dir) {
    const P = this.plug;
    P.ins = { p: 0, dir, dur: dir > 0 ? INSERT_T : EXTRACT_T };
    P.state = dir > 0 ? 'plugging' : 'unplugging';
    if (dir < 0) this.setLink(P.port, null);
  }

  stepPlug(dt) {
    const P = this.plug, f = P.fly;
    if (P.state === 'drag') return;
    if (P.ins) {
      const s = P.ins, port = P.port;
      s.p = Math.min(1, s.p + dt / s.dur);
      const k = easeInOut(s.p);
      const a = this.preY(port), b = this.socketY(port);
      P.x = port.x;
      P.y = s.dir > 0 ? a + (b - a) * k : b + (a - b) * k;
      if (s.p >= 1) {
        P.ins = null;
        if (s.dir > 0) { P.state = 'port'; this.setLink(port, port.ready ? 'on' : 'nosignal'); } else { P.state = 'loose'; this.fly('hand', 0.32, 'hand'); }
      }
      return;
    }
    if (f) {
      f.p = Math.min(1, f.p + dt / f.dur);
      const k = f.fall ? f.p * f.p : easeOut(f.p);
      const to = f.target === 'hand' ? this.hand() : f.target ? { x: f.target.x, y: this.preY(f.target) } : f.to;
      P.x = f.from.x + (to.x - f.from.x) * k;
      P.y = f.from.y + (to.y - f.from.y) * k;
      if (f.p >= 1) {
        P.fly = null;
        if (f.then === 'port') this.insert(1);
        else { P.state = f.then; P.port = null; }
      }
      return;
    }
    if (P.state === 'hand') { const h = this.hand(); P.x = h.x; P.y = h.y; }
    if (P.state === 'port' && P.port) { P.x = P.port.x; P.y = this.socketY(P.port); }
  }

  // ── Planes ───────────────────────────────────────────────────────────────────

  queue(steps) { this.plan = steps; this.step = null; }

  /** Lo siguiente que hace por su cuenta: probar un puerto, desenchufar, pasear, mirar de espaldas o saludar. */
  think() {
    const M = this.engine.metrics, P = this.plug, r = Math.random();
    let steps = null;
    if (P.state === 'floor') steps = [{ t: 'walk', x: P.x }, { t: 'pickup' }, { t: 'face', yaw: FRONT, hold: 0.3 }];
    else if (P.state === 'port' && r < 0.5) {
      steps = [...this.standFor(P.port), { t: 'unplug' }, { t: 'face', yaw: FRONT, hold: 0.2 }];
    } else if (P.state === 'hand' && r < 0.5 && this.ports.length) {
      // Prefiere los puertos con señal y no repetir el último
      const pool = this.ports.filter((p) => p !== this.lastPort && (p.ready || Math.random() < 0.3));
      const port = pool.length ? pickOne(pool) : pickOne(this.ports);
      this.lastPort = port;
      steps = this.standFor(port);
      if (Math.random() < 0.35) steps.push({ t: 'say', key: 'conectar', ms: 2200 });
      steps.push({ t: 'connect', port }, { t: 'face', yaw: FRONT, hold: 0.3 });
      // Sin señal: no siempre se queja (con todos los datos aún por completar sería triste a cada rato)
      if (port.ready) { if (Math.random() < 0.4) steps.push({ t: 'anim', name: 'celebrar' }); } else if (Math.random() < 0.35) steps.push({ t: 'say', key: 'sinSenal', ms: 2800 }, { t: 'sad', s: 1.4 });
      steps.push({ t: 'wait', s: rand(2, 3.5) });
    }
    if (!steps && r < 0.72) steps = [{ t: 'walk', x: rand(EDGE + 60, M.W - EDGE - 60) }, { t: 'face', yaw: FRONT, hold: 0.2 }];
    if (!steps && r < 0.84) steps = [{ t: 'face', yaw: BACK, hold: rand(1.2, 2.2) }, { t: 'face', yaw: FRONT, hold: 0.3 }];
    if (!steps && r < 0.92) steps = [{ t: 'face', yaw: FRONT, hold: 0.1 }, { t: 'anim', name: 'hola' }];
    if (!steps) steps = [{ t: 'face', yaw: FRONT, hold: rand(1.5, 3) }];
    steps.push({ t: 'wait', s: rand(0.8, 2) });
    this.queue(steps);
  }

  // ── Fotograma ────────────────────────────────────────────────────────────────

  /** Pose en bucle: el conector va colgando de una mano, así que camina y espera con los brazos normales. */
  pose(moving) { this.engine.pose(moving ? 'caminar' : 'reposo'); }

  aim(yaw) {
    let t = yaw;
    while (t - this.m.yaw > Math.PI + 0.01) t -= 2 * Math.PI;
    while (t - this.m.yaw < -Math.PI - 0.01) t += 2 * Math.PI;
    this.m.tyaw = t;
  }

  tick(dt) {
    const m = this.m, e = this.engine, P = this.plug;
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
        const dx = this.walkX(s.x) - m.x;
        if (Math.abs(dx) < 1.5) { done = true; break; }
        const dir = Math.sign(dx);
        this.aim(dir * SIDE);
        this.pose(true);
        // Primero gira, luego anda (y no anda mientras suena una acción suelta, como el susto de un clic)
        if (Math.abs(m.yaw - m.tyaw) < 0.5 && !e.oneShot()) {
          const v = SPEED * (s.rush ? RUSH : 1) * Math.min(1, Math.abs(dx) / 30 + 0.35);
          m.x += dir * Math.min(Math.abs(dx), v * dt);
          m.phase += dt * (s.rush ? 2.2 : 1.5);
        }
        break;
      }
      case 'connect': {
        // Salta y, en lo alto, el conector sube hasta el enchufe
        if (P.state !== 'hand' && !P.fly) { done = true; break; }
        if (!s.jumped) { s.jumped = true; e.play('salto'); }
        if (s.time > 0.22 && !s.flew && P.state === 'hand' && !P.fly) { s.flew = true; this.fly(s.port, 0.38, 'port'); }
        done = s.flew && !P.fly && !P.ins;
        if (done && !s.quiet && s.port.ready && Math.random() < 0.5) this.hooks.hint(s.port.id);
        break;
      }
      case 'unplug':
        if (!s.flew) {
          if (P.state !== 'port') { done = true; break; }
          s.flew = true; this.insert(-1); // saca la punta y luego vuela a la mano (stepPlug)
        }
        this.pose(false);
        done = !P.fly && !P.ins;
        break;
      case 'pickup':
        if (!s.flew) {
          if (P.state !== 'floor') { done = true; break; }
          s.flew = true; this.fly('hand', 0.3, 'hand');
        }
        this.pose(false);
        done = !P.fly;
        break;
      case 'sad': done = s.time > s.s; break;
      default: done = true;
    }
    if (done) {
      if (s.t === 'sad') { this.sad = false; e.base = 'reposo'; }
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
    if (Math.abs(m.yaw) > Math.PI) { const w = Math.sign(m.yaw) * 2 * Math.PI; m.yaw -= w; m.tyaw -= w; }
    m.x = this.walkX(m.x);
    e.model.position.x = (m.x - M.W / 2) * M.wpp;
    e.model.rotation.y = m.yaw;
    e.anchorX = m.x;
    this.stepPlug(dt);

    // Mirada: triste o con el conector suelto lo mira; si señalas un puerto, lo mira (arriba); si no, a ti
    const P = this.plug;
    const toward = (x, dy) => ({ dx: clamp((x - m.x) / 280, -1, 1), dy });
    const sideways = Math.abs(Math.sin(m.yaw)) > 0.5 || Math.abs(m.yaw) > 2;
    const port = this.attn && this.ports.find((p) => p.id === this.attn);
    if (P.state === 'drag' || (this.sad && P.state !== 'hand')) e.lookHold = toward(P.x, P.y > M.floorY - M.mpx * 0.5 ? 0.45 : -0.4);
    else if (port && !sideways) e.lookHold = toward(port.x, -0.5);
    else if (sideways) e.lookHold = { dx: 0, dy: 0.1 };
    else e.lookHold = null;

    this.layout(dt);
  }

  /**
   * Recorrido del cable, con choque y sin saltos (Jhon: "se teletransporta de un lado de la mascota a otro, como si no
   * pudiera estar delante de ella"). Del conector cae recto al suelo y va por el suelo, delante de los pies, hasta el
   * servidor. Con el conector en la mano el cable puede ir por delante de ella (cuelga de su mano); con la mano detrás
   * de su cuerpo, va por detrás (.is-behind) y ella lo tapa. Lo único que no hace es caer a través de su cabeza desde
   * un puerto: entonces pasa por encima y baja por el costado que da al servidor. Ese desvío no aparece de golpe: su
   * tamaño (this.detour) se suaviza por tiempo, así que el cable se aparta o vuelve poco a poco. Devuelve el trazo SVG.
   */
  route(dt) {
    const M = this.engine.metrics, m = this.m, P = this.plug, H = this.hub;
    const S = { x: P.x, y: P.y + PLUG_H / 2 + 4 }; // sale del protector, bajo el cuerpo del conector
    const headTop = M.floorY - M.mpx * 1.02;
    const { head: headHalf } = this.halves();
    const floor = M.floorY + 4;
    const toward = Math.sign(H.x - m.x) || 1;
    let want = 0;
    if (!this.behind && S.y < headTop - 6 && Math.abs(S.x - m.x) < headHalf + 10) want = m.x + toward * (headHalf + 16) - S.x;
    this.detour += (want - this.detour) * smooth(dt, 6);
    const f = (v) => v.toFixed(1);
    let d = `M${f(S.x)} ${f(S.y)}`;
    // Desde dónde cuelga hacia el suelo: el conector, o el punto al costado de la cabeza si hay desvío
    let A = S;
    if (Math.abs(this.detour) > 0.5) {
      const W = { x: S.x + this.detour, y: Math.max(S.y + 8, headTop - 6) };
      // Sale recto del conector y se arquea por encima de la cabeza hasta su costado (curva en S, sin esquinas)
      d += ` C${f(S.x)} ${f(S.y + (W.y - S.y) * 0.7)} ${f(W.x)} ${f(W.y - 26)} ${f(W.x)} ${f(W.y)}`;
      A = W;
    }
    // CAÍDA NATURAL (Jhon eligió "cable con caída natural", 26/11/2026): el cable no dobla en ángulo recto como una
    // pista de circuito. Cuelga recto bajo el conector (por su peso), se curva al llegar abajo y se apoya en el suelo
    // un poco más allá, hacia el servidor (la holgura). Luego va tumbado y sube al puerto del servidor con otra curva.
    const dir = Math.sign(H.x - A.x) || 1;
    const drop = Math.max(0, floor - A.y);
    const span = Math.abs(H.x - A.x);
    const land = Math.min(span * 0.45, 18 + drop * 0.42); // dónde toca el suelo, medido desde la vertical del conector
    const T = { x: A.x + dir * land, y: floor };
    d += ` C${f(A.x)} ${f(A.y + drop * 0.62)} ${f(A.x + dir * land * 0.15)} ${f(floor)} ${f(T.x)} ${f(T.y)}`;
    const Lx = H.x - dir * Math.min(34, Math.max(0, span - land) * 0.5); // dónde empieza a subir al servidor
    if (Math.abs(Lx - T.x) > 1 && Math.sign(Lx - T.x) === dir) d += ` L${f(Lx)} ${f(floor)}`;
    d += ` C${f(Lx + dir * 20)} ${f(floor)} ${f(H.x)} ${f(H.y + 16)} ${f(H.x)} ${f(H.y)}`;
    return d;
  }

  layout(dt) {
    const M = this.engine.metrics, m = this.m, P = this.plug;
    // Profundidad de la mano (hacia ti > 0): la misma mano local que hand() (0,4 al costado, 0,27 por delante), girada
    const behind = P.state === 'hand' && !P.fly && -0.4 * Math.sin(m.yaw) + 0.27 * Math.cos(m.yaw) < -0.02;
    if (behind !== this.behind) { this.behind = behind; this.el.classList.toggle('is-behind', behind); }
    if (this.plugEl) {
      this.plugEl.style.transform = `translate3d(${(P.x - 8).toFixed(1)}px, ${(P.y - PLUG_H / 2).toFixed(1)}px, 0)`;
      // Punta de metal oculta lo que ya entró en el enchufe (de 0 a TIP px), para que se vea entrar y no atravesarlo
      const hide = P.port && (P.state === 'port' || P.ins) ? Math.round(clamp(this.sockBottom(P.port) - (P.y - PLUG_H / 2), 0, TIP)) : 0;
      if (hide !== this.tipHide) { this.tipHide = hide; this.plugEl.style.setProperty('--tip-hide', `${hide}px`); }
    }
    if (this.cablePath) this.cablePath.setAttribute('d', this.route(dt));
    if (this.bubble) {
      const bw = this.bubbleW;
      const bx = clamp(m.x - bw / 2, 8, M.W - bw - 8);
      const by = Math.max(4, M.floorY - M.mpx - 10 - this.bubbleH);
      this.bubble.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`;
      this.bubble.style.setProperty('--tip', `${clamp(m.x - bx, 18, bw - 18).toFixed(1)}px`);
    }
    if (this.shadow) this.shadow.style.transform = `translate3d(${(m.x - 60).toFixed(1)}px, ${(M.floorY - 9).toFixed(1)}px, 0)`;
  }
}
