import Mascot3D from './Mascot3D/Mascot3D';

// /posar/: la mascota 3D en una caja de 3 × 4 con fondo transparente, con el MISMO motor, luz y encuadre que el 3D.
//   /posar/            dormida y con el pecho vacío: imagen de la pantalla de precarga (tools/poster.mjs)
//   /posar/?despierta  despierta y quieta (con "reducir movimiento"): la tarjeta para compartir (tools/og.mjs)
export default function Pose() {
  const params = new URLSearchParams(window.location.search);
  const size = Number(params.get('w')) || 680;
  const awake = params.has('despierta');
  return (
    <div className="pose" style={{ position: 'relative', width: size, height: Math.round((size * 4) / 3), background: 'transparent' }}>
      <Mascot3D games={false} sleeping={!awake} onReady={(e) => {
        // Dormida, el pecho va vacío: el CARGANDO lo pone el HTML de la pantalla de carga encima de la imagen
        if (!awake) e.o.consoleEls = () => null;
        e.renderOnce(); window.__poseReady = true;
      }} />
    </div>
  );
}
