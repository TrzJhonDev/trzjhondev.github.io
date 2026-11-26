import { Suspense, lazy, useState } from 'react';
import Mascot from './Mascot';

// Mascota "automática": la 3D (Blender + Three.js) cuando está lista y, mientras carga o si no hay WebGL, la CSS.
// Mismas props que Mascot. La usan la mascota pequeña de la esquina (Guide.jsx) y la de Contacto (Contact.jsx);
// la portada lo hace a su manera en Portrait.jsx porque la CSS vive dentro de su escena inclinada.
const Mascot3D = lazy(() => import('../Mascot3D/Mascot3D'));

export default function MascotAuto(props) {
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'failed'
  return (
    <>
      {state !== 'ready' && <Mascot {...props} />}
      {state !== 'failed' && (
        <Suspense fallback={null}>
          <Mascot3D {...props} onReady={() => setState('ready')} onError={() => setState('failed')} />
        </Suspense>
      )}
    </>
  );
}
