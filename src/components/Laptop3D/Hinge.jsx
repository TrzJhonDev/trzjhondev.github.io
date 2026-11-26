import { shade } from '../../lib/math3d';

// Dos cilindros (izquierda y derecha) sobre el eje de giro de la tapa
const BARRELS = [-150, 150];
const LEN = 96, R = 6, FACETS = 8;
const FACET_H = 2 * R * Math.tan(Math.PI / FACETS) + 0.5;
const FACET_ANGLES = Array.from({ length: FACETS }, (_, i) => (i * 360) / FACETS);

/**
 * Bisagra en dos piezas cilíndricas. Cada cilindro se arma con facetas alrededor del eje X
 * (sombreadas según la luz) y dos tapas circulares en los extremos.
 * L: capas de geometry.layers() (lidY / lidZ es el eje de la tapa); view: { rx, ry, light }.
 */
export default function Hinge({ L, view }) {
  const { rx, ry, light } = view;
  const y = L.lidY - 1, z = L.lidZ;

  return (
    <>
      {BARRELS.map((x) => (
        <div key={x} className="hinge-part" aria-hidden="true">
          {FACET_ANGLES.map((a) => {
            const r = (a * Math.PI) / 180;
            return (
              <div
                key={a}
                className="face hinge__facet"
                style={{
                  width: LEN, height: FACET_H, left: -LEN / 2, top: -FACET_H / 2,
                  transform: `translate3d(${x}px,${y}px,${z}px) rotateX(${a}deg) translateZ(${R}px)`,
                }}
              >
                <div className="shade" style={{ opacity: shade([0, -Math.sin(r), Math.cos(r)], rx, ry, light) * 1.1 }} />
              </div>
            );
          })}
          {[-1, 1].map((side) => (
            <div
              key={side}
              className="face hinge__cap"
              style={{ width: R * 2, height: R * 2, left: -R, top: -R, transform: `translate3d(${x + (side * LEN) / 2}px,${y}px,${z}px) rotateY(${side * 90}deg)` }}
            >
              <div className="shade" style={{ opacity: shade([side, 0, 0], rx, ry, light) }} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
