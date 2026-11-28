// Portafolio en Astro (reescritura del 27/11/2026, ver PLAN-REESCRITURA.md): páginas en HTML estático y solo la mascota
// 3D (y, en /lab, el portátil y los juegos) como islas de React.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://trzjhondev.github.io',
  integrations: [react()],
  devToolbar: { enabled: false },
  server: { port: 5173 }, // el mismo puerto que antes (lo usan .claude/launch.json y los scripts de lab/)
});
