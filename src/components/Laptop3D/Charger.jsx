import { Fragment } from 'react';
import { rotY, shade, toView } from '../../lib/math3d';
import { BANK, CABLE_ANCHOR, PLUG_LEN, plugTip } from './geometry';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (v) => Math.hypot(v[0], v[1], v[2]);
const rotZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
const px = (v) => `${v.toFixed(1)}px`;
const along = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];

// ── Cable ────────────────────────────────────────────────────────
const SEGMENTS = 18;
const CABLE_W = 8; // diámetro del cable
const FLOOR_Y = 12; // altura del centro del cable apoyado en el suelo (el suelo está en y = 16)
const RIBBONS = [0, 45, 90, 135]; // cintas que se cruzan alrededor del eje: vista desde cualquier lado parece un tubo redondo

/**
 * Puntos del cable: sale recto de la funda del conector, descansa en el suelo y entra por el puerto de la batería
 * (siempre de frente a su cara). Si el conector está cerca de la batería el cable es corto y casi recto.
 */
export function cablePoints(tail, dir) {
  const p0 = tail;
  const p3 = CABLE_ANCHOR;
  const d = Math.hypot(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]);
  const p1 = along(tail, dir, -Math.min(46, d * 0.35)); // sigue recto un trecho, como un cable con funda
  const p2 = [p3[0] + Math.min(60, d * 0.4), FLOOR_Y, p3[2]]; // llega al puerto de frente (entrando hacia −x)
  // la altura del arranque sigue al conector (si lo levantas, el cable cuelga y baja al suelo); acaba a la altura del puerto
  const ys = [p0[1], p0[1], FLOOR_Y, p3[1]];
  return Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    const t = i / SEGMENTS, u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const P = [p0, p1, p2, p3];
    return [
      P.reduce((a, p, k) => a + p[0] * w[k], 0),
      Math.min(FLOOR_Y, ys.reduce((a, y, k) => a + y * w[k], 0)),
      P.reduce((a, p, k) => a + p[2] * w[k], 0),
    ];
  });
}

/**
 * Tubo del cable: cada tramo son 4 cintas cruzadas (a 0°, 45°, 90° y 135° alrededor de su eje), cada una
 * sombreada según la luz; así parece redondo desde cualquier lado. Debajo, una sombra de contacto.
 * Se dibuja con --sh (cuánto se oscurece) y color-mix en el CSS, sin elementos extra por cinta.
 */
function Tube({ pts, view }) {
  return pts.slice(1).map((b, i) => {
    const a = pts[i];
    const d = sub(b, a);
    const l = len(d);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const yaw = Math.atan2(-d[2], d[0]);
    const pitch = Math.atan2(d[1], Math.hypot(d[0], d[2]));
    const base = `translate3d(${px(mid[0])},${px(mid[1])},${px(mid[2])}) rotateY(${yaw}rad) rotateZ(${pitch}rad)`;
    const lift = Math.max(0, FLOOR_Y - mid[1]);
    return (
      <Fragment key={i}>
        {RIBBONS.map((deg) => {
          const r = (deg * Math.PI) / 180;
          // normal de la cinta en la escena; se elige el lado que mira a la cámara porque la cinta se ve por las dos caras
          let n = rotY(rotZ([0, -Math.sin(r), Math.cos(r)], pitch), yaw);
          if (toView(n, view.rx, view.ry)[2] < 0) n = [-n[0], -n[1], -n[2]];
          return (
            <div
              key={deg}
              className="cable"
              style={{
                width: l + 4, height: CABLE_W, left: -(l + 4) / 2, top: -CABLE_W / 2,
                transform: `${base} rotateX(${deg}deg)`,
                '--sh': shade(n, view.rx, view.ry, view.light).toFixed(3),
              }}
            />
          );
        })}
        <div
          className="cable-shadow"
          style={{
            width: l + 4, height: CABLE_W + 4, left: -(l + 4) / 2, top: -(CABLE_W + 4) / 2,
            opacity: 0.5 * Math.max(0, 1 - lift / 30),
            transform: `translate3d(${px(mid[0])},15.6px,${px(mid[2])}) rotateY(${yaw}rad) rotateX(90deg)`,
          }}
        />
      </Fragment>
    );
  });
}

/** Zona invisible, más grande que el conector, para agarrarlo con facilidad (también con el dedo). */
function Grab({ a, b, width }) {
  const d = sub(b, a);
  const l = len(d);
  const yaw = Math.atan2(-d[2], d[0]);
  const pitch = Math.atan2(d[1], Math.hypot(d[0], d[2]));
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return (
    <div
      className="plug--grab"
      data-hit="plug"
      style={{
        width: l, height: width, left: -l / 2, top: -width / 2,
        transform: `translate3d(${px(mid[0])},${px(mid[1])},${px(mid[2])}) rotateY(${yaw}rad) rotateZ(${pitch}rad) rotateX(90deg)`,
      }}
    />
  );
}

// Caras de una caja de largo L (eje x local, la dirección del conector), alto H (y) y ancho W (z).
// n: normal local; t: transformación que coloca la cara; w, h: tamaño de la cara.
const faces = (L, H, W) => [
  { k: 'front', n: [0, 0, 1], w: L, h: H, t: `translateZ(${W / 2}px)` },
  { k: 'back', n: [0, 0, -1], w: L, h: H, t: `rotateY(180deg) translateZ(${W / 2}px)` },
  { k: 'top', n: [0, -1, 0], w: L, h: W, t: `rotateX(90deg) translateZ(${H / 2}px)` },
  { k: 'bottom', n: [0, 1, 0], w: L, h: W, t: `rotateX(-90deg) translateZ(${H / 2}px)` },
  { k: 'nose', n: [1, 0, 0], w: W, h: H, t: `rotateY(90deg) translateZ(${L / 2}px)` },
  { k: 'tail', n: [-1, 0, 0], w: W, h: H, t: `rotateY(-90deg) translateZ(${L / 2}px)` },
];

/**
 * Caja 3D de seis caras, orientada según `dir`, con cada cara sombreada según la luz.
 * Así el conector tiene volumen real y se ve bien desde cualquier ángulo.
 * details: contenido extra por cara, p. ej. { top: <i /> }.
 */
function Box3D({ at, dir, L, H, W, className, view, details = {}, hit = 'plug' }) {
  const yaw = Math.atan2(-dir[2], dir[0]);
  const pitch = Math.atan2(dir[1], Math.hypot(dir[0], dir[2]));
  return (
    <div className="box3d" style={{ transform: `translate3d(${px(at[0])},${px(at[1])},${px(at[2])}) rotateY(${yaw}rad) rotateZ(${pitch}rad)` }}>
      {faces(L, H, W).map((f) => (
        <div
          key={f.k}
          className={`box3d__face ${className} ${className}--${f.k}`}
          data-hit={hit || undefined}
          style={{ width: f.w, height: f.h, left: -f.w / 2, top: -f.h / 2, transform: f.t }}
        >
          {details[f.k]}
          {/* la normal local pasa a la escena con la misma rotación que lleva la caja: primero Z, luego Y */}
          <div className="shade" style={{ opacity: shade(rotY(rotZ(f.n, pitch), yaw), view.rx, view.ry, view.light) }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Batería portátil: cuerpo de grafito, tira de plata y LEDs en la cara superior, y el puerto USB-C en la cara que mira
 * al portátil (ahí entra el cable). Los LEDs se encienden cuando el conector está enchufado. No se puede arrastrar.
 */
function Bank({ lit, view }) {
  const [x, y, z] = BANK.c;
  return (
    <>
      <div
        className="bank-shadow"
        style={{ transform: `translate3d(${px(x)},15.6px,${px(z)}) rotateX(90deg)` }}
      />
      <Box3D
        at={[x, y, z]} dir={[0, 0, 1]} L={BANK.L} H={BANK.H} W={BANK.W} className="bank" view={view} hit={false}
        details={{
          top: (
            <>
              <span className="bank-leds">
                {[0, 1, 2, 3].map((i) => <i key={i} className={`bank-led${lit ? ' is-on' : ''}`} />)}
              </span>
              <i className="bank-stripe" />
            </>
          ),
          back: <i className="bank-port" />,
        }}
      />
    </>
  );
}

// Tamaños (px de escena) de las piezas, de la cola a la punta
const BOOT_B = 8; // extremo de la funda (el más fino)
const BOOT_A = 8; // funda, más gruesa
const BODY = PLUG_LEN - BOOT_A - BOOT_B; // cuerpo

/**
 * Cargador USB-C: el conector se arrastra hasta el puerto de la pared izquierda; su cable sale de la funda y va corto
 * y directo a la batería portátil que descansa en el suelo.
 * Piezas del conector, de la cola a la punta: extremo de funda, funda acanalada, cuerpo ancho
 * (surcos y LED arriba; franja y rótulos a los lados), collar oscuro y punta metálica con su ranura.
 * plug: 0 (en el suelo) → 1 (enchufado). hidden: en el despiece no se muestra. led: color del LED.
 */
export default function Charger({ plug, hidden, view, led = '#3A3A42' }) {
  if (hidden) return null;
  const tip = plugTip(plug);
  // El conector apunta siempre hacia la pared del portátil (+X): su cola mira a la batería, así el cable va directo
  const dir = [1, 0, 0];
  const tail = along(tip, dir, -PLUG_LEN);
  const metalEnd = along(tip, dir, 9);
  const mid = along(tip, dir, -PLUG_LEN / 2);

  // Sombra de contacto en el suelo: se aclara y se encoge cuando el conector se levanta
  const lift = Math.max(0, 10 - tip[1]);
  const shadow = Math.max(0, 1 - lift / 34);

  return (
    <div className="charger" aria-hidden="true">
      <div
        className="plug-shadow"
        style={{ opacity: 0.55 * shadow, transform: `translate3d(${px(mid[0])},15.6px,${px(mid[2])}) rotateX(90deg) scale(${(0.8 + 0.2 * shadow).toFixed(2)})` }}
      />

      <Bank lit={plug > 0.97} view={view} />
      <Tube pts={cablePoints(tail, dir)} view={view} />

      <Box3D at={along(tail, dir, BOOT_B / 2)} dir={dir} L={BOOT_B} H={7.5} W={12} className="plug-boot" view={view} />
      <Box3D at={along(tail, dir, BOOT_B + BOOT_A / 2)} dir={dir} L={BOOT_A} H={9.5} W={16} className="plug-boot" view={view} />
      <Box3D
        at={along(tail, dir, BOOT_B + BOOT_A + BODY / 2)} dir={dir} L={BODY} H={13} W={24}
        className="plug-body" view={view}
        details={{
          top: (
            <>
              <i className="plug-grip" />
              <i className="plug-led" style={{ background: led, boxShadow: led === '#3A3A42' ? 'none' : `0 0 7px ${led}` }} />
            </>
          ),
          front: <><span className="plug-text">65W</span><i className="plug-stripe" /></>,
          back: <><span className="plug-text">USB-C</span><i className="plug-stripe" /></>,
        }}
      />
      <Box3D at={along(tip, dir, -1)} dir={dir} L={2} H={9} W={18} className="plug-collar" view={view} />
      <Box3D
        at={along(tip, dir, 4.5)} dir={dir} L={9} H={5.5} W={15} className="plug-metal" view={view}
        details={{
          nose: <i className="plug-slot" />,
          front: <i className="plug-notch" />,
          back: <i className="plug-notch" />,
        }}
      />

      <Grab a={tail} b={metalEnd} width={52} />
    </div>
  );
}
