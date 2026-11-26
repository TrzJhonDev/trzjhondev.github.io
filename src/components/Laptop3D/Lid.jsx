import { profile } from '../../data/profile';
import { DEG, glint, hexA, rotX, shade, sheen } from '../../lib/math3d';
import { LID_RIM } from './geometry';
import Screen from './Screen';
import Sheen from './Sheen';

const chamferRGBA = (g) => `rgba(255,255,255,${(0.06 + 0.5 * g).toFixed(3)})`;

/**
 * Tapa con bisagra: pantalla (cara delantera), carcasa con el logo (cara trasera) y canto
 * con esquinas curvas. Se abre girando en X alrededor de la bisagra.
 * screen: props para <Screen />; view: { rx, ry, light }.
 */
export default function Lid({ L, open, view, skill, power, camOn, screen, zoom = 1 }) {
  const { rx, ry, light } = view;
  const a = (open - 90) * DEG;
  const up = rotX([0, 1, 0], a); // eje y local de la tapa en la escena
  const front = rotX([0, 0, 1], a);
  const back = rotX([0, 0, -1], a);

  const glass = sheen(front, [1, 0, 0], up, rx, ry, light, 14); // vidrio: brillo más concentrado
  const shell = sheen(back, [-1, 0, 0], up, rx, ry, light);
  // Biseles del borde de la carcasa trasera: arriba, lado +X, lado -X
  const [gT, gPX, gNX] = glint([rotX([0, -1, -1], a), rotX([1, 0, -1], a), rotX([-1, 0, -1], a)], rx, ry, light);

  return (
    <div className="lid" aria-hidden="true" style={{ transform: `translate3d(0,${L.lidY}px,${L.lidZ}px) rotateX(${open - 90}deg)` }}>
      <div className="panel" data-hit="screen" style={{ transform: `translateZ(${L.screenZ}px)` }}>
        <div className="webcam">
          <i className="webcam__lens" />
          <i className="webcam__led" style={{ background: camOn ? '#8FD8FF' : '#12202B', boxShadow: camOn ? '0 0 4px #8FD8FF' : 'none' }} />
        </div>
        <Screen skill={skill} {...screen} />
        <div className="panel__brand">{profile.brand}</div>
        {/* reflejo del entorno en el vidrio: se desplaza al girar el portátil */}
        <div className="glass-env" style={{ backgroundPosition: `${(ry * 0.6).toFixed(1)}px ${(rx * 1.5).toFixed(1)}px` }} />
        {/* rejilla de píxeles: solo se nota con mucho zoom */}
        {zoom > 1.25 && <div className="pixels" style={{ opacity: Math.min(1, (zoom - 1.25) / 0.5) * 0.55 }} />}
        <Sheen s={glass} strength={0.6} className="sheen--glass" />
      </div>
      <div className="lid-shell" data-hit="lid">
        <span
          className="lid-shell__logo"
          style={{ color: power ? skill.color : 'var(--lap-logo-off)', textShadow: power ? `0 0 14px ${hexA(skill.color, 0.45)}` : 'none' }}
        >
          {profile.brand}
          {/* cursor de terminal: la firma "_" de la marca (decorativo) */}
          <span className="cursor-blink" aria-hidden="true">_</span>
        </span>
        <div className="shade" style={{ opacity: shade(back, rx, ry, light) }} />
        <Sheen s={shell} strength={0.75} />
        {/* la carcasa está girada 180°: su borde izquierdo es el lado +X */}
        <div className="chamfer" style={{ boxShadow: `inset 0 1.5px 0 ${chamferRGBA(gT)}, inset 1.5px 0 0 ${chamferRGBA(gPX)}, inset -1.5px 0 0 ${chamferRGBA(gNX)}` }} />
      </div>
      {LID_RIM.map((s, i) => (
        <div
          key={i}
          className="lid-rim"
          data-hit="lid"
          style={{ width: s.w, left: -s.w / 2, transform: `translate3d(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px,0) rotateZ(${s.ph}deg) rotateX(90deg)` }}
        >
          <div className="shade" style={{ opacity: shade(rotX(s.n, a), rx, ry, light) }} />
        </div>
      ))}
    </div>
  );
}
