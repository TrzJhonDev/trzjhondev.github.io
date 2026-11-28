import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DEG, clamp, rotX, rotY } from '../../lib/math3d';
import { DESKTOP } from '../Laptop3D/useLayout';
import Console from './Console';
import { Face } from './Face';
import { Prism, TILT, collectShades, reshade, rotZ } from './prism';
import './Mascot.css';
import { profile } from '../../data/profile';

/**
 * Mascota: un robot hecho con piezas 3D de CSS (prismas de esquinas redondeadas, sombreados con la luz fija).
 * Unidades = px de diseño; el conjunto se escala con --ms según el tamaño de la caja. Origen: centro del torso; y hacia abajo.
 *
 * Comportamientos (todo en un único bucle de animación que escribe en el DOM, sin re-renderizar):
 *  - Los ojos (pupilas) y la cabeza siguen el puntero; sin puntero mira a su alrededor de vez en cuando.
 *  - Parpadea. Saluda una vez por sesión. Con clic o Intro se asusta o se ríe (alterna).
 *  - Si lleva unos segundos sin actividad, teclea en su mini teclado.
 * Por debajo de DESKTOP el puntero no cuenta; con "reducir movimiento" no hay bucle: pose fija y solo cambia la expresión.
 */

const DESIGN_W = 262;          // ancho de diseño que cabe en la caja (más ancho = mascota más pequeña). Era 310; Jhon la pidió más grande
const HEAD = { W: 186, H: 146, D: 130, R: 40, y: -73 }; // y: centro de la cabeza respecto del cuello
const NECK_Y = 3;              // el cuello (eje de giro de la cabeza)
const ARM = { x: 72, y: 36 };  // hombro
const IDLE_TYPING_MS = 8000;

// hi: saludo corto sin mensaje (la pequeña al aparecer en la esquina); wave: el saludo de bienvenida, que habla
const ACT = { wave: 2400, hi: 1500, startle: 900, laugh: 1400, cheer: 1100 };
const ACT_EXPR = { wave: 'happy', hi: 'happy', startle: 'surprised', laugh: 'laugh', cheer: 'happy' };

const f1 = (v) => v.toFixed(2);
const lerp = (a, b, t) => a + (b - a) * t;

// Piezas que no cambian nunca (memorizadas): suelo, pies, torso (con la consola del pecho, ver Console.jsx), cuello, hombros y mini teclado
const Body = memo(function Body({ variant, link }) {
  return (
    <>
      <div className="mshadow" />
      <Prism at={[-30, 121, 8]} rx={90} W={44} H={60} D={18} R={9} k={3} color="var(--m-joint)" />
      <Prism at={[30, 121, 8]} rx={90} W={44} H={60} D={18} R={9} k={3} color="var(--m-joint)" />
      <Prism at={[0, 66, 0]} W={116} H={96} D={88} R={22} k={12} soft={0.65} color="var(--m-shell)" details={{ front: <Console variant={variant} link={link} /> }} />
      <Prism at={[0, 10, 0]} rx={90} W={40} H={40} D={16} R={20} k={6} soft={0.5} color="var(--m-joint)" />
      <Prism at={[-61, 36, 0]} ry={-90} W={26} H={26} D={12} R={13} k={6} soft={0.5} color="var(--m-joint)" />
      <Prism at={[61, 36, 0]} ry={90} W={26} H={26} D={12} R={13} k={6} soft={0.5} color="var(--m-joint)" />
      {/* el mini teclado solo está fuera mientras teclea (.is-typing): el resto del tiempo tapaba los botones de la consola */}
      <div className="mg mkb">
        <Prism at={[0, 78, 72]} rx={90} W={104} H={46} D={6} R={8} k={2} color="var(--m-joint)" details={{ front: <i className="mkeys" /> }} />
      </div>
    </>
  );
});

/** Brazo: cuelga del hombro (pivote en el origen de su grupo); la muñeca es una banda oscura. */
const Arm = memo(function Arm() {
  return (
    <>
      <Prism at={[0, 28, 0]} W={24} H={64} D={24} R={11} k={5} color="var(--m-shell)" />
      <Prism at={[0, 56, 0]} W={26} H={9} D={26} R={4} k={3} color="var(--m-joint)" />
    </>
  );
});

// Orejas y headset ligero. La diadema es el contorno de la cabeza (media anchura 93, alto 73, radio 40) alejado un hueco GAP
// y con grosor BAND (fina): así rodea la cabeza sin tocarla en ninguna esquina. Su pata baja hasta el centro de la oreja.
const GAP = 5, BAND = 5;
const EAR_X = HEAD.W / 2 + GAP + BAND / 2; // centro de la oreja (eje x), justo bajo la pata de la diadema
const EAR_Y = 4;

/** Oreja: disco redondo (cilindro de muchas facetas) con un botón central de otro color. La tapa "front" mira hacia fuera. */
function Ear({ side }) {
  const s = side; // +1 derecha, −1 izquierda
  const ry = 90 * s;
  return (
    <>
      {/* Disco de la oreja en mandarina (marfil y mandarina, 26/11/2026), igual que orejaL/R en el modelo 3D */}
      <Prism at={[s * EAR_X, EAR_Y, 0]} ry={ry} W={42} H={42} D={12} R={21} k={12} soft={0.45} color="var(--m-cup)" />
      <Prism at={[s * (EAR_X + 6.5), EAR_Y, 0]} ry={ry} W={22} H={22} D={3} R={11} k={8} soft={0.4} color="var(--m-cup)" />
    </>
  );
}

/** Micrófono: varilla fina curva (cilindros cortos a lo largo de una curva de Bézier) desde la oreja derecha hasta delante de la barbilla. */
const BOOM = (() => {
  const P = [[EAR_X + 3, 22, 4], [EAR_X + 12, 52, 18], [EAR_X + 4, 70, 62], [70, 66, 76]];
  const bez = (t) => [0, 1, 2].map((i) => (1 - t) ** 3 * P[0][i] + 3 * (1 - t) ** 2 * t * P[1][i] + 3 * (1 - t) * t * t * P[2][i] + t ** 3 * P[3][i]);
  const N = 22, segs = []; // tramos cortos y solapados: la curva sale lisa. No subas N sin medir: cada cara de más pesa en el seguimiento del ratón
  for (let i = 0; i < N; i += 1) {
    const a = bez(i / N), b = bez((i + 1) / N);
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d);
    // eje z local del prisma (rotateY · rotateX) apuntando a lo largo de d
    segs.push({
      at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], len: len + 2.4, // se solapan un poco para que no queden rendijas en las curvas
      rx: Math.asin(-d[1] / len) / DEG, ry: Math.atan2(d[0], d[2]) / DEG,
    });
  }
  return { segs, end: P[3] };
})();

function Mic() {
  return (
    <>
      {BOOM.segs.map((s, i) => (
        <Prism key={i} at={s.at} rx={s.rx} ry={s.ry} W={5} H={5} D={s.len} R={2.5} k={3} caps={false} soft={0.3} color="var(--m-cup)" />
      ))}
      {/* cápsula del micrófono: cilindro de muchas facetas con una tapa más oscura y una rejilla azul en la punta */}
      <Prism at={BOOM.end} ry={-70} W={13} H={13} D={13} R={6.5} k={10} soft={0.35} color="var(--m-joint)" />
      <Prism at={[BOOM.end[0] - 7.2, BOOM.end[1], BOOM.end[2] + 2.6]} ry={-70} W={10} H={10} D={4} R={5} k={8} soft={0.3} color="var(--m-btn)" />
    </>
  );
}

/** Cabeza: carcasa, orejas, diadema fina y micrófono. La cara va aparte porque cambia de expresión. */
const HeadShell = memo(function HeadShell() {
  const w = HEAD.W + 2 * (GAP + BAND), top = HEAD.H / 2 + GAP + BAND;
  return (
    <>
      {/* k = 18 y soft 0,6: con 9 facetas y más contraste el sombreado de las curvas se veía en franjas (salto de ~0,08 entre facetas; ahora ~0,03) */}
      <Prism W={HEAD.W} H={HEAD.H} D={HEAD.D} R={HEAD.R} k={18} soft={0.6} color="var(--m-shell)" />
      <Ear side={1} />
      <Ear side={-1} />
      <Mic />
      {/* diadema: el arco plano en varias capas finas para que tenga grosor */}
      {/* capas finas y juntas (cada 0,75): más separadas dejaban rendijas oscuras al verla de lado */}
      {[-3, -2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25, 3].map((z) => (
        <div
          key={z}
          className="mf mband"
          data-n="0,0,1"
          style={{ left: -w / 2, top: -top, width: w, height: top + EAR_Y, '--band': `${BAND}px`, borderRadius: `${HEAD.R + GAP + BAND}px ${HEAD.R + GAP + BAND}px 0 0`, transform: `translateZ(${z}px)` }}
        >
          <i className="ms" style={{ opacity: 0.18 }} />
        </div>
      ))}
    </>
  );
});

/**
 * Props:
 *  - ptr:     ref con el puntero ({ mx, my } en px de pantalla; x, y los usa la portada)
 *  - variant: 'hero' (grande, portada: saluda, curiosea y teclea) o 'mini' (pequeña y fija, calmada: no teclea,
 *             no curiosea, mira hacia abajo mientras haces scroll)
 *  - look:    ref { dx, dy, until } con una mirada pedida desde fuera (la guía al cambiar de sección)
 *  - cmd:     ref { type, n, t } con una acción pedida desde fuera (la guía: 'cheer'); cada orden lleva un n nuevo
 *  - onAct:   (tipo) => void, avisa cuando saluda ('wave') o reacciona a un clic ('startle' | 'laugh')
 *  - greet:   saluda con la mano al montarse, sin decir nada ('hi'): la pequeña cada vez que aparece en la esquina
 */
export default function Mascot({ ptr, variant = 'hero', look, cmd, onAct, paused = false, greet = false }) {
  const props = useRef({});
  props.current = { variant, look, cmd, onAct, paused, greet };
  const rootRef = useRef(null);
  const worldRef = useRef(null);
  const headRef = useRef(null);
  const armRRef = useRef(null);
  const armLRef = useRef(null);
  const link = useRef({}); // lo que la consola del pecho registra para que el bucle le avise (typing)
  const faceRefs = useRef({ eyeL: { current: null }, eyeR: { current: null }, pupL: { current: null }, pupR: { current: null } }).current;
  const [expr, setExpr] = useState('idle');
  const api = useRef({ react: () => {} });

  // Escala: el conjunto mide DESIGN_W unidades de ancho y se ajusta al ancho de la caja
  useLayoutEffect(() => {
    const el = rootRef.current;
    const fit = () => el.style.setProperty('--ms', (el.clientWidth / DESIGN_W).toFixed(4));
    fit();
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current, world = worldRef.current, head = headRef.current, armR = armRRef.current, armL = armLRef.current;
    const headSh = collectShades(head), armRSh = collectShades(armR), armLSh = collectShades(armL);
    const mqMotion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const mqDesk = window.matchMedia(`(min-width: ${DESKTOP}px)`);
    const now0 = performance.now();
    const S = {
      yaw: 0, pitch: 0, typing: 0,
      aR: { x: 3, z: -7 }, aL: { x: 3, z: 7 },
      lastMove: now0 + 2500, lpx: 0, lpy: 0, lastScroll: 0,
      glanceNext: now0 + 2500, gx: 0, gy: 0,
      nextBlink: now0 + 2500, blinkUntil: 0,
      act: null, clicks: 0, ex: 0, ey: 0, px: 0, py: 0,
      cmdN: props.current.cmd?.current?.n ?? 0, // las órdenes anteriores a montarse no cuentan
    };
    link.current.wake = () => { S.lastMove = performance.now(); }; // al salir de un juego empieza de nuevo la cuenta del ratón quieto
    let animated = mqMotion.matches, visible = true, raf = 0, last = now0, exprNow = 'idle', rect = null, rectAt = 0, typingClass = false, idleTimer = 0;

    const setE = (e) => { if (e !== exprNow) { exprNow = e; setExpr(e); } };

    // Escribe la pose en el DOM (grupos que giran) y vuelve a sombrear sus caras con la luz fija
    const apply = (yaw, pitch, lift, aR, aL) => {
      world.style.transform = `translateY(${f1(14 + lift)}px) rotateX(${TILT}deg)`;
      head.style.transform = `translate3d(0,${NECK_Y}px,0) rotateY(${f1(yaw)}deg) rotateX(${f1(pitch)}deg)`;
      armR.style.transform = `translate3d(${ARM.x}px,${ARM.y}px,0) rotateZ(${f1(aR.z)}deg) rotateX(${f1(aR.x)}deg)`;
      armL.style.transform = `translate3d(${-ARM.x}px,${ARM.y}px,0) rotateZ(${f1(aL.z)}deg) rotateX(${f1(aL.x)}deg)`;
      const y = yaw * DEG, p = pitch * DEG;
      reshade(headSh, (n) => rotY(rotX(n, p), y));
      reshade(armRSh, (n) => rotZ(rotX(n, aR.x * DEG), aR.z * DEG));
      reshade(armLSh, (n) => rotZ(rotX(n, aL.x * DEG), aL.z * DEG));
    };
    const setEyes = (ex, ey, px, py) => {
      faceRefs.eyeL.current?.setAttribute('transform', `translate(${f1(ex)} ${f1(ey)})`);
      faceRefs.eyeR.current?.setAttribute('transform', `translate(${f1(ex)} ${f1(ey)})`);
      faceRefs.pupL.current?.setAttribute('transform', `translate(${f1(px)} ${f1(py)})`);
      faceRefs.pupR.current?.setAttribute('transform', `translate(${f1(px)} ${f1(py)})`);
    };
    const rest = () => { S.yaw = 0; S.pitch = 0; S.aR = { x: 3, z: -7 }; S.aL = { x: 3, z: 7 }; apply(0, 0, 0, S.aR, S.aL); setEyes(0, 0, 0, 0); };

    const frame = (now) => {
      raf = 0;
      if (!animated || !visible || document.hidden || props.current.paused) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const p = ptr.current;
      const hasPtr = mqDesk.matches && p.mx > -1000;
      const mini = props.current.variant === 'mini';
      const ask = props.current.look?.current;

      // ── a dónde mira ── (lo pedido desde fuera manda; luego el puntero; luego curiosear, que la pequeña no hace)
      let dx = 0, dy = 0;
      if (ask && ask.until > now) {
        dx = ask.dx; dy = ask.dy;
      } else if (hasPtr) {
        if (!rect || now - rectAt > 250) { rect = root.getBoundingClientRect(); rectAt = now; }
        dx = clamp((p.mx - (rect.left + rect.width / 2)) / (window.innerWidth * 0.38), -1, 1);
        dy = clamp((p.my - (rect.top + rect.height * 0.33)) / (window.innerHeight * 0.42), -1, 1);
        if (p.mx !== S.lpx || p.my !== S.lpy) { S.lastMove = now; S.lpx = p.mx; S.lpy = p.my; }
      } else if (!mini) {
        if (now > S.glanceNext) { // curiosa: de vez en cuando mira a otro lado
          const look = Math.random() < 0.6;
          S.gx = look ? Math.random() * 1.6 - 0.8 : 0; S.gy = look ? Math.random() * 0.7 - 0.25 : 0;
          S.glanceNext = now + (look ? 1100 + Math.random() * 1000 : 2200 + Math.random() * 2800);
        }
        dx = S.gx; dy = S.gy;
      }
      if (mini) { // calmada: mientras haces scroll mira hacia abajo, como leyendo contigo, y gira menos la cabeza
        if (now - S.lastScroll < 1300 && !(ask && ask.until > now)) { dx = 0; dy = 0.6; }
        dx *= 0.7;
      }

      // ── orden de la guía (celebrar): solo si es reciente, para no atender órdenes viejas al reaparecer ──
      const order = props.current.cmd?.current;
      if (order && order.n !== S.cmdN) {
        S.cmdN = order.n;
        if (now - order.t < 1500 && ACT[order.type] && !S.act) S.act = { type: order.type, t0: now, dur: ACT[order.type] };
      }

      // ── acción en curso (saludo, susto, risa, celebrar) ──
      let act = S.act, actP = 0, env = 0;
      if (act) {
        actP = (now - act.t0) / act.dur;
        if (actP >= 1) { S.act = null; act = null; }
        else if (actP < 0) act = null; // aún no ha empezado (el saludo espera un momento)
        else {
          env = Math.min(1, actP / 0.12, (1 - actP) / 0.18);
          if (act.type === 'wave' && !act.marked) {
            act.marked = true;
            try { sessionStorage.setItem('mascota-saludo', '1'); } catch { /* ignorar */ }
            props.current.onAct?.('wave');
          }
        }
      }
      // Teclea si el ratón lleva un rato quieto, salvo mientras se juega en su consola (link.current.busy: menú o juego)
      const wantType = !mini && !act && !link.current.busy && now - S.lastMove > IDLE_TYPING_MS;
      S.typing = lerp(S.typing, wantType ? 1 : 0, 1 - Math.exp(-dt * 4));
      const ty = S.typing;
      if (!typingClass && ty > 0.2) { root.classList.add('is-typing'); typingClass = true; link.current.typing?.(true); }
      else if (typingClass && ty < 0.1) { root.classList.remove('is-typing'); typingClass = false; link.current.typing?.(false); }

      // ── pose objetivo ──
      let tYaw = dx * 30 * (1 - ty), tPitch = -dy * 12 * (1 - ty) - 12 * ty;
      let lift = Math.sin(t * 2) * 1.2;
      const tR = { x: 3, z: -7 }, tL = { x: 3, z: 7 }; // brazo derecho (x > 0): hacia fuera = z negativa
      if (ty > 0.01) { // teclea: los antebrazos bajan al teclado y golpean por turnos
        const tap = Math.sin(t * 17);
        tR.x = lerp(tR.x, 50 + 8 * tap, ty); tR.z = lerp(tR.z, 28, ty);
        tL.x = lerp(tL.x, 50 - 8 * tap, ty); tL.z = lerp(tL.z, -28, ty);
      }
      if (act) {
        if (act.type === 'wave' || act.type === 'hi') {
          tR.x = lerp(tR.x, 0, env); tR.z = lerp(tR.z, -(125 + 14 * Math.sin(t * 13)), env);
          tYaw += 6 * env;
        } else if (act.type === 'startle') {
          lift -= 18 * Math.sin(Math.min(1, actP * 2.2) * Math.PI);
          tR.x = lerp(tR.x, 0, env); tR.z = lerp(tR.z, -(78 + 8 * Math.sin(t * 20)), env);
          tL.x = lerp(tL.x, 0, env); tL.z = lerp(tL.z, 78 + 8 * Math.sin(t * 20), env);
          tPitch += 6 * env;
        } else if (act.type === 'cheer') { // celebra: brazos arriba y un saltito
          lift -= 6 * Math.sin(Math.min(1, actP * 2) * Math.PI);
          tR.x = lerp(tR.x, 0, env); tR.z = lerp(tR.z, -(64 + 6 * Math.sin(t * 16)), env);
          tL.x = lerp(tL.x, 0, env); tL.z = lerp(tL.z, 64 + 6 * Math.sin(t * 16 + 1), env);
        } else { // laugh
          tYaw += 5 * Math.sin(t * 30) * env;
          lift -= 3.5 * Math.abs(Math.sin(t * 20)) * env;
          tR.x = lerp(tR.x, 10 * Math.sin(t * 24), env); tR.z = lerp(tR.z, -16, env);
          tL.x = lerp(tL.x, 10 * Math.sin(t * 24 + 1), env); tL.z = lerp(tL.z, 16, env);
        }
      }
      const kH = 1 - Math.exp(-dt * 9), kA = 1 - Math.exp(-dt * 14);
      S.yaw = lerp(S.yaw, tYaw, kH); S.pitch = lerp(S.pitch, tPitch, kH);
      S.aR = { x: lerp(S.aR.x, tR.x, kA), z: lerp(S.aR.z, tR.z, kA) };
      S.aL = { x: lerp(S.aL.x, tL.x, kA), z: lerp(S.aL.z, tL.z, kA) };
      apply(S.yaw, S.pitch, lift, S.aR, S.aL);

      // ── ojos: la pupila se mueve de a medio píxel (7 unidades = un píxel de la pantalla) ──
      const eyeDy = dy + 0.9 * ty;
      const snap = (v) => Math.round(v / 3.5) * 3.5;
      S.px = lerp(S.px, snap(clamp(dx * 1.4, -1, 1) * 7), 1 - Math.exp(-dt * 12));
      S.py = lerp(S.py, snap(clamp(eyeDy * 1.4, -1, 1) * 7), 1 - Math.exp(-dt * 12));
      S.ex = lerp(S.ex, dx * 4, kH); S.ey = lerp(S.ey, eyeDy * 3, kH);
      setEyes(S.ex, S.ey, S.px, S.py);

      // ── expresión: la acción manda; luego teclear; luego el parpadeo ──
      if (!act && now > S.nextBlink) { S.blinkUntil = now + 140; S.nextBlink = now + 2600 + Math.random() * 3400; }
      setE(act ? ACT_EXPR[act.type] : ty > 0.5 ? 'focus' : now < S.blinkUntil ? 'blink' : 'idle');

      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && animated && visible && !document.hidden && !props.current.paused) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    // Reacción al clic o a Intro: se asusta o se ríe (alterna). Sin animación solo cambia la cara un momento.
    api.current.start = start;
    api.current.react = () => {
      S.clicks += 1;
      const type = S.clicks % 2 ? 'startle' : 'laugh';
      S.lastMove = performance.now();
      props.current.onAct?.(type);
      if (animated) { S.act = { type, t0: performance.now(), dur: ACT[type] }; start(); return; }
      setE(ACT_EXPR[type]);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setE('idle'), 1200);
    };

    rest();
    if (animated && props.current.variant !== 'mini') {
      let seen = false;
      try { seen = !!sessionStorage.getItem('mascota-saludo'); } catch { /* sin almacenamiento: saluda cada vez */ }
      // Se marca como visto cuando el saludo empieza de verdad (ver el bucle), no aquí: React en desarrollo monta dos veces
      if (!seen) S.act = { type: 'wave', t0: now0 + 600, dur: ACT.wave };
    }
    if (animated && props.current.greet) S.act = { type: 'hi', t0: now0 + 120, dur: ACT.hi };
    start();

    const onMotion = () => {
      animated = mqMotion.matches;
      if (animated) start();
      else { rest(); setE('idle'); root.classList.remove('is-typing'); typingClass = false; link.current.typing?.(false); }
    };
    mqMotion.addEventListener?.('change', onMotion);
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    const onScroll = () => { S.lastScroll = performance.now(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((list) => { visible = list[list.length - 1].isIntersecting; start(); }) : null;
    io?.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      delete link.current.wake;
      mqMotion.removeEventListener?.('change', onMotion);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, [ptr, faceRefs]);

  // Pausada (p. ej. la grande mientras la pequeña pasea): el bucle no corre; al reanudar, arranca de nuevo
  useEffect(() => { if (!paused) api.current.start?.(); }, [paused]);

  const onKey = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); api.current.react(); } };

  return (
    <div
      ref={rootRef}
      className={`mascot mascot--${variant}`}
      role="button"
      tabIndex={0}
      aria-label={`${profile.mascot}, la mascota robot. Pulsa para que reaccione.`}
      onClick={() => api.current.react()}
      onKeyDown={onKey}
    >
      <div className="mascot__fit">
        <div className="mascot__stage">
          <div ref={worldRef} className="mascot__world">
            <Body variant={variant} link={link} />
            <div ref={headRef} className="mg" style={{ transform: `translate3d(0,${NECK_Y}px,0)` }}>
              <div className="mg" style={{ transform: `translateY(${HEAD.y}px)` }}>
                <HeadShell />
                <Face expr={expr} refs={faceRefs} z={HEAD.D / 2} />
              </div>
            </div>
            <div ref={armRRef} className="mg" style={{ transform: `translate3d(${ARM.x}px,${ARM.y}px,0)` }}><Arm /></div>
            <div ref={armLRef} className="mg" style={{ transform: `translate3d(${-ARM.x}px,${ARM.y}px,0)` }}><Arm /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
