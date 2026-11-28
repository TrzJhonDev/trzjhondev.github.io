import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

// Versión de cada modelo 3D = huella de su contenido. Se escribe en index.html (preload y <meta name="model-versions">)
// en cada petición, así que al reexportar un .glb desde Blender el navegador (y la caché del service worker) piden el
// nuevo sin tocar nada a mano. Antes, una página abierta seguía con el modelo viejo en memoria.
const modelVersion = (name) => {
  try { return createHash('md5').update(fs.readFileSync(`public/models/${name}.glb`)).digest('hex').slice(0, 8); } catch { return '0'; }
};
const modelVersions = {
  name: 'model-versions',
  // order 'pre': antes de que Vite procese los href (un % suelto rompe su decodeURI)
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replaceAll('%MASCOTA_V%', modelVersion('mascota')).replaceAll('%PORTATIL_V%', modelVersion('portatil')),
  },
};

// base: './' permite publicar en GitHub Pages o abrir el build desde cualquier carpeta
export default defineConfig({
  plugins: [react(), modelVersions],
  base: './',
});
