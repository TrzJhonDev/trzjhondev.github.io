import { glint, hexA, shade, sheen } from '../../lib/math3d';
import Sheen from './Sheen';

const UP = [0, -1, 0];
// Biseles del borde de la carcasa superior: frente, fondo, izquierda, derecha
const BEVELS = [[0, -1, 1], [0, -1, -1], [-1, -1, 0], [1, -1, 0]];
const chamferRGBA = (g) => `rgba(255,255,255,${(0.07 + 0.55 * g).toFixed(3)})`;

/**
 * Carcasa superior: rejilla, botón de encendido, hueco del teclado y touchpad.
 * El elemento está girado 90° en X: su eje x local es X y su eje y local es Z.
 */
export default function Deck({ L, view, color, power, glow }) {
  const { rx, ry, light } = view;
  const [gF, gB, gL, gR] = glint(BEVELS, rx, ry, light);
  const sh = sheen(UP, [1, 0, 0], [0, 0, 1], rx, ry, light);

  return (
    <div className="face deck" aria-hidden="true" style={{ transform: `translateY(${L.deckY}px) rotateX(90deg)`, opacity: L.deckOp }}>
      <div className="deck__glow" style={{ opacity: glow, background: `linear-gradient(to bottom, ${hexA(color, 0.42)}, transparent 70%)` }} />
      <div className="deck__grill" />
      <div
        className={`deck__power${power ? ' is-on' : ''}`}
        data-hit="power"
        style={{ boxShadow: power ? `0 0 0 2px var(--lap-well), 0 0 10px ${hexA(color, 0.8)}` : '0 0 0 2px var(--lap-well)' }}
      />
      <div className="deck__well" />
      {/* 0,6 px por encima de la carcasa: si estuviera en el mismo plano, el clic a veces caería en la carcasa */}
      <div className="deck__pad" data-hit="pad" style={{ transform: `translateZ(${0.6 + L.padLift}px)` }}>
        {/* marcas invisibles en tres esquinas: sirven para saber dónde está el touchpad en pantalla */}
        <i className="pad-mark" style={{ left: 0, top: 0 }} /><i className="pad-mark" style={{ right: 0, top: 0 }} /><i className="pad-mark" style={{ left: 0, bottom: 0 }} />
      </div>
      <div className="deck__sticker" />
      <div className="shade" style={{ opacity: shade(UP, rx, ry, light) }} />
      <Sheen s={sh} strength={0.7} />
      {/* chaflán brillante: cada borde brilla según cuánto mira hacia la luz */}
      <div
        className="chamfer"
        style={{ boxShadow: `inset 0 -1.5px 0 ${chamferRGBA(gF)}, inset 0 1.5px 0 ${chamferRGBA(gB)}, inset 1.5px 0 0 ${chamferRGBA(gL)}, inset -1.5px 0 0 ${chamferRGBA(gR)}` }}
      />
    </div>
  );
}
