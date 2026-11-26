import { profile } from '../../data/profile';
import { shade } from '../../lib/math3d';
import { BASE_RIM } from './geometry';

const LED_OFF = '#2C2C31';
const SCREWS =[[14, 14], [459, 14], [14, 299], [459, 299], [236, 14], [236, 299], [150, 156], [323, 156]];

/**
 * Base del portátil: tapa inferior, su cara interior y las paredes con esquinas curvas.
 * L: capas de geometry.layers(); view: { rx, ry, light }.
 */
export default function Base({ L, view, power, ledOn, plugged, battery }) {
  // LED junto al puerto de carga: naranja cargando, verde con la batería llena
  const chargeLed = !plugged ? LED_OFF : battery >= 100 ? '#8FD8FF' : '#BCC2CC';
  const { rx, ry, light } = view;
  return (
    <>
      {/* Cara inferior (se ve inclinando la vista por debajo): rejillas, patas, tornillos y etiqueta */}
      <div className="face base-bottom" aria-hidden="true" style={{ transform: `translateY(${L.bottomY}px) rotateX(-90deg)` }}>
        <i className="base__vent base__vent--l" /><i className="base__vent base__vent--r" />
        <i className="base__foot base__foot--t" /><i className="base__foot base__foot--b" />
        <i className="base__foot base__foot--l" /><i className="base__foot base__foot--r" />
        {SCREWS.map(([l, t], i) => <i key={i} className="base__screw" style={{ left: l, top: t }} />)}
        <div className="base__label">
          <strong>{profile.brand}</strong>
          Portátil 14" · Modelo TJD-14<br />
          Diseñado en {profile.city}
        </div>
        <div className="shade" style={{ opacity: shade([0, 1, 0], rx, ry, light) * 0.45 }} />
      </div>
      {/* cara interior de la carcasa inferior (se ve desde arriba en el despiece) */}
      <div className="face base-inner" aria-hidden="true" style={{ transform: `translateY(${L.bottomY - 1}px) rotateX(90deg)` }}>
        <i /><i /><i />
      </div>
      {BASE_RIM.map((s, i) => (
        <div
          key={i}
          className={`face rim rim--${s.kind}`}
          aria-hidden="true"
          style={{ width: s.w, left: -s.w / 2, transform: `translate3d(${s.x.toFixed(2)}px,0,${s.z.toFixed(2)}px) rotateY(${s.th}deg)`, opacity: L.walls }}
        >
          {s.kind === 'front' && (
            <>
              <div className="rim__notch" />
              <div className="rim__led" style={{ background: ledOn ? '#8FD8FF' : '#0B3A52', boxShadow: power ? '0 0 6px #8FD8FF' : 'none' }} />
            </>
          )}
          {/* Pared izquierda (de atrás hacia delante): LED de carga, USB-C de carga, USB-C, HDMI */}
          {s.kind === 'left' && (
            <>
              <i className="port-led" style={{ background: chargeLed, boxShadow: chargeLed !== LED_OFF ? `0 0 5px ${chargeLed}` : 'none' }} />
              <i className="port port--usbc" style={{ left: 40 }} />
              <i className="port port--usbc" style={{ left: 62 }} />
              <i className="port port--hdmi" style={{ left: 88 }} />
            </>
          )}
          {/* Pared derecha (de atrás hacia delante): USB-A, jack de audio */}
          {s.kind === 'right' && (
            <>
              <i className="port port--usba" style={{ left: 60 }} />
              <i className="port port--jack" style={{ left: 86 }} />
            </>
          )}
          <div className="shade" style={{ opacity: shade(s.n, rx, ry, light) }} />
        </div>
      ))}
    </>
  );
}
