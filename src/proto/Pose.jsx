import Mascot3D from '../components/Mascot3D/Mascot3D';

// ?posar: la mascota 3D dormida en una caja de 3 × 4 con fondo transparente. Solo sirve para sacar la imagen fija de la
// pantalla de carga (scrollcraft/builds/portafolio/lab/poster.mjs) con el MISMO motor, luz y encuadre que el 3D.
export default function Pose() {
  const size = Number(new URLSearchParams(window.location.search).get('w')) || 680;
  return (
    <div className="pose" style={{ position: 'relative', width: size, height: Math.round((size * 4) / 3), background: 'transparent' }}>
      <Mascot3D sleeping onReady={(e) => {
        // El pecho, vacío: el CARGANDO lo pone el HTML de la pantalla de carga encima de la imagen
        e.o.consoleEls = () => null; e.renderOnce(); window.__poseReady = true;
      }} />
    </div>
  );
}
