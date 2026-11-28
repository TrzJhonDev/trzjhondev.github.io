import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { MASCOT_URL, boot, startBoot } from './lib/boot';
import { startSmoothScroll } from './lib/smoothScroll';

// ?mascota3d abre la página de prueba de la mascota modelada en Blender (PLAN-MASCOTA-3D.md).
// Se carga aparte (import dinámico): la página normal no descarga Three.js.
// ?portatil3d abre la del portátil (PLAN-PORTATIL-3D.md).
const Proto3D = lazy(() => import('./proto/Proto3D'));
const ProtoLaptop = lazy(() => import('./proto/ProtoLaptop'));
const Pose = lazy(() => import('./proto/Pose'));
const params = new URLSearchParams(window.location.search);
const Page = params.has('mascota3d') ? Proto3D : params.has('portatil3d') ? ProtoLaptop : params.has('posar') ? Pose : null;

// Pantalla de carga (index.html, PLAN-PANTALLA-CARGA.md): se empieza a descargar todo a la vez antes de montar React.
// El mismo import() de la mascota 3D lo reutiliza Portrait.jsx (el navegador no lo pide dos veces).
if (Page) { document.getElementById('boot')?.remove(); boot.finish(); }
else {
  startBoot({ modelUrl: MASCOT_URL, importMascot: () => import('./components/Mascot3D/Mascot3D') });
  startSmoothScroll(); // scroll con inercia (lib/smoothScroll.js): se activa al terminar la carga
}

// Caché local (public/sw.js): solo en producción; en desarrollo estorbaría a la recarga en caliente
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {Page ? <Suspense fallback={null}><Page /></Suspense> : <App />}
  </React.StrictMode>
);
