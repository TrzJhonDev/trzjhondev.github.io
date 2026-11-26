import { memo } from 'react';

import { EYE, EYE_X, EYE_Y, MOUTH, MOUTH_X, MOUTH_Y, P, PUPIL, MIRRORED, mirror } from './faceData';

// Cara de la mascota: una pantalla de píxeles con ojos, boca y las gafas delante.
// Los datos de píxeles están en faceData.js (los comparte con el prototipo 3D).

/** Une los píxeles encendidos de cada fila en tiras (menos elementos SVG). */
function runs(rows) {
  const out = [];
  rows.forEach((r, y) => {
    let x = 0;
    while (x < r.length) {
      if (r[x] !== '#') { x += 1; continue; }
      let e = x;
      while (e < r.length && r[e] === '#') e += 1;
      out.push([x, y, e - x]);
      x = e;
    }
  });
  return out;
}

function Pixels({ rows }) {
  return runs(rows).map(([x, y, w]) => <rect key={`${x}-${y}`} x={x * P} y={y * P} width={w * P} height={P} />);
}

/**
 * Pantalla de la cara (a la altura z de la tapa delantera de la cabeza) y gafas delante.
 * refs: { eyeL, eyeR, pupL, pupR } (los mueve el bucle de animación sin volver a renderizar).
 */
export const Face = memo(function Face({ expr, refs, z }) {
  const e = EYE[expr] ? expr : 'idle';
  const left = EYE[e], right = MIRRORED.has(e) ? mirror(EYE[e]) : EYE[e];
  const m = MOUTH[expr] || MOUTH.idle;
  const pup = PUPIL[e];
  const cheeks = expr === 'happy' || expr === 'laugh';
  return (
    <>
      <div className="mscreen" style={{ transform: `translateZ(${z + 1.5}px)` }}>
        <svg viewBox="0 0 160 124" width="160" height="124" aria-hidden="true" shapeRendering="crispEdges">
          <g className="mface__lit">
            <g ref={refs.eyeL} transform="translate(0 0)">
              <g transform={`translate(${EYE_X[0]} ${EYE_Y})`}>
                <Pixels rows={left} />
                {pup && <rect ref={refs.pupL} className="mpupil" x={pup[0] * P} y={pup[1] * P} width={pup[2] * P} height={pup[3] * P} />}
              </g>
            </g>
            <g ref={refs.eyeR} transform="translate(0 0)">
              <g transform={`translate(${EYE_X[1]} ${EYE_Y})`}>
                <Pixels rows={right} />
                {pup && <rect ref={refs.pupR} className="mpupil" x={pup[0] * P} y={pup[1] * P} width={pup[2] * P} height={pup[3] * P} />}
              </g>
            </g>
            <g transform={`translate(${MOUTH_X} ${MOUTH_Y})`}><Pixels rows={m} /></g>
            {cheeks && (
              <g opacity="0.4">
                <rect x="16" y="76" width="14" height="7" />
                <rect x="130" y="76" width="14" height="7" />
              </g>
            )}
          </g>
        </svg>
        <i className="mscreen__glare" />
      </div>

      {/* Gafas: montura oscura rectangular, a dos alturas para que tenga grosor */}
      <div className="mframes" style={{ transform: `translateZ(${z + 6}px)` }} aria-hidden="true">
        <i className="mframe" style={{ left: -65, top: -46.5 }} />
        <i className="mframe" style={{ left: 7, top: -46.5 }} />
        <i className="mframe__bridge" />
      </div>
      <div className="mframes mframes--hi" style={{ transform: `translateZ(${z + 8}px)` }} aria-hidden="true">
        <i className="mframe" style={{ left: -65, top: -46.5 }} />
        <i className="mframe" style={{ left: 7, top: -46.5 }} />
      </div>
    </>
  );
});
