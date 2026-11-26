/**
 * Hologramas de las skills (elementos que miran a la cámara).
 *  - Hologram: se proyecta sobre la tecla apuntada.
 *  - FlyingHologram: el que vuela de la tecla a la pantalla al hacer clic.
 * transform: posición 3D + billboard, ya calculados por el padre.
 */
export function Hologram({ skill, transform }) {
  return (
    <div className="anchor" aria-hidden="true" style={{ transform, pointerEvents: 'none' }}>
      <div className="holo" style={{ '--hc': skill.color }}>
        <div className="holo__beam" />
        <div className="holo__card">
          <span className="holo__badge">{skill.badge}</span>
          <span className="holo__name">{skill.name}</span>
          <span className="holo__cat">{skill.cat}</span>
          <span className="holo__cta">Clic para cargar</span>
        </div>
      </div>
    </div>
  );
}

export function FlyingHologram({ skill, transform, scale, opacity }) {
  return (
    <div className="anchor" aria-hidden="true" style={{ transform, pointerEvents: 'none' }}>
      <div className="holo holo--flying" style={{ '--hc': skill.color, opacity, transform: `scale(${scale})` }}>
        <div className="holo__card"><span className="holo__badge">{skill.badge}</span></div>
      </div>
    </div>
  );
}
