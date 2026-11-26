import { useMemo } from 'react';
import { DEG, rotX, rotY, shade } from '../../lib/math3d';

// Inclinación de la escena de la mascota (grados): igual que el rotateX de .mascot__world en el CSS
export const TILT = 6;

export const rotZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
const f2 = (v) => v.toFixed(2);

/**
 * Caras de un prisma de esquinas redondeadas: un rectángulo de W×H con radio R, extruido D en z.
 * Tapas delantera y trasera (rectángulos redondeados) + una tira plana por cada lado recto
 * + k tiras por esquina (el arco se aproxima con facetas, como los biseles del portátil).
 * Con R = W/2 = H/2 sale un cilindro (eje z). n: normal local; t: transformación que coloca la cara.
 */
export function prismFaces({ W, H, D, R = 0, k = 3, caps = true }) {
  // caps = false: sin tapas (tubos hechos de varios tramos, donde las tapas quedan escondidas dentro; cada cara de más cuesta rendimiento)
  const faces = caps ? [
    { key: 'front', cap: true, n: [0, 0, 1], w: W, h: H, t: `translateZ(${f2(D / 2)}px)` },
    { key: 'back', cap: true, n: [0, 0, -1], w: W, h: H, t: `rotateY(180deg) translateZ(${f2(D / 2)}px)` },
  ] : [];
  const hw = W / 2 - R, hh = H / 2 - R;
  // Tira de largo `len` centrada en (mx, my) cuya normal exterior es (nx, ny). rotateX(90°) la pone "de pie" a lo largo de z.
  const strip = (key, mx, my, len, nx, ny) => {
    const phi = Math.atan2(nx, -ny) / DEG;
    faces.push({ key, n: [nx, ny, 0], w: len * 1.03 + 0.3, h: D, t: `translate3d(${f2(mx)}px,${f2(my)}px,0) rotateZ(${f2(phi)}deg) rotateX(90deg)` });
  };
  const arc = (name, cx, cy, a0) => {
    const step = Math.PI / 2 / k;
    for (let i = 0; i < k; i += 1) {
      const a = a0 + (i + 0.5) * step;
      const nx = Math.cos(a), ny = Math.sin(a), rr = R * Math.cos(step / 2);
      strip(`${name}${i}`, cx + nx * rr, cy + ny * rr, 2 * R * Math.sin(step / 2), nx, ny);
    }
  };
  if (hw > 0.01) strip('top', 0, -H / 2, 2 * hw, 0, -1);
  if (R > 0.01) arc('tr', hw, -hh, -Math.PI / 2);
  if (hh > 0.01) strip('right', W / 2, 0, 2 * hh, 1, 0);
  if (R > 0.01) arc('br', hw, hh, 0);
  if (hw > 0.01) strip('bottom', 0, H / 2, 2 * hw, 0, 1);
  if (R > 0.01) arc('bl', -hw, hh, Math.PI / 2);
  if (hh > 0.01) strip('left', -W / 2, 0, 2 * hh, -1, 0);
  if (R > 0.01) arc('tl', -hw, -hh, Math.PI);
  return faces;
}

/**
 * Pieza 3D: prisma redondeado con cada cara sombreada según la luz fija (shade). Se coloca en `at` y se gira (rx, ry, rz, grados;
 * CSS los aplica en el orden rotateZ · rotateY · rotateX). `data-n` guarda la normal en el sistema del grupo que la mueve,
 * para volver a sombrearla cuando ese grupo gira (ver reshade).
 * soft: cuánto contraste de sombra lleva (1 = normal). Las piezas cilíndricas usan menos para que sus facetas no se vean en bandas.
 * details: contenido extra por cara, p. ej. { front: <i /> }.
 */
export function Prism({ at = [0, 0, 0], rx = 0, ry = 0, rz = 0, W, H, D, R = 0, k = 3, caps = true, soft = 1, color, details, className = '' }) {
  const faces = useMemo(() => prismFaces({ W, H, D, R, k, caps }), [W, H, D, R, k, caps]);
  const orient = (n) => rotZ(rotY(rotX(n, rx * DEG), ry * DEG), rz * DEG);
  return (
    <div
      className={`mp ${className}`}
      style={{ transform: `translate3d(${at[0]}px,${at[1]}px,${at[2]}px) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg)`, '--pc': color }}
    >
      {faces.map((f) => {
        const n = orient(f.n);
        return (
          <div
            key={f.key}
            className={`mf${f.cap ? ' mf--cap' : ''}`}
            data-n={n.map((v) => v.toFixed(4)).join(',')}
            data-soft={soft}
            style={{ width: f.w, height: f.h, left: -f.w / 2, top: -f.h / 2, transform: f.t, borderRadius: f.cap ? R : undefined }}
          >
            {details?.[f.key]}
            <i className="ms" style={{ opacity: (shade(n, TILT, 0) * soft).toFixed(3) }} />
          </div>
        );
      })}
    </div>
  );
}

/** Lista las caras de un grupo y sus normales (se llama una vez, al montar). */
export function collectShades(root) {
  return Array.from(root.querySelectorAll('.mf')).map((el) => ({
    s: el.lastElementChild,
    n: el.dataset.n.split(',').map(Number),
    k: el.dataset.soft ? Number(el.dataset.soft) : 1,
  }));
}

/** Vuelve a sombrear las caras de un grupo que gira: orient lleva la normal local al sistema de la escena. */
export function reshade(list, orient) {
  for (let i = 0; i < list.length; i += 1) list[i].s.style.opacity = (shade(orient(list[i].n), TILT, 0) * list[i].k).toFixed(3);
}
