// Saca la miniatura de la cabeza de la mascota para la pista de Formación (public/img/mascota-cabeza-oscuro|claro.webp,
// 320 × 272, fondo transparente) con el MISMO motor 3D (?posar&despierta). Si cambias el modelo o sus colores, vuelve a
// lanzarlo con el servidor de desarrollo en marcha:
//   node scrollcraft/builds/portafolio/lab/cabeza.mjs --url http://localhost:5173/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const URL = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1] : 'http://localhost:5173/';
const OUT = path.resolve('public/img');
const HEAD = ['cabeza_1', 'orejaL', 'orejaR', 'auricularL', 'auricularR', 'diadema', 'microfono', 'micro_capsula', 'micro_tapa'];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const theme of ['oscuro', 'claro']) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch { /* sin almacenamiento */ } }, theme === 'oscuro' ? 'dark' : 'light');
  const page = await ctx.newPage();
  await page.goto(`${URL}posar/?despierta&w=900`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__poseReady === true, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  // Rectángulo de la cabeza (con orejas y micrófono) proyectado a la imagen, en px
  const box = await page.evaluate((names) => {
    const e = [...window.__mascots][0];
    const el = document.querySelector('.pose').getBoundingClientRect();
    e.model.updateMatrixWorld(true);
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
    e.model.traverse((o) => {
      if (!o.isMesh || !names.includes(o.name)) return;
      const g = o.geometry; g.computeBoundingBox();
      const b = g.boundingBox;
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
        const v = b.min.clone().set(x, y, z).applyMatrix4(o.matrixWorld).project(e.camera);
        const px = (v.x + 1) / 2, py = (1 - v.y) / 2;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
    });
    return { x: x0 * el.width, y: y0 * el.height, w: (x1 - x0) * el.width, h: (y1 - y0) * el.height };
  }, HEAD);
  const png = path.join(OUT, `_cabeza-${theme}.png`);
  // omitBackground solo deja transparente lo que no tiene fondo: la página pinta --bg en html/body, y sin esto la
  // miniatura salía con un cuadrado opaco del color de la página (Jhon lo vio en el mapa de niveles)
  await page.addStyleTag({ content: 'html, body, #root, main { background: transparent !important; } body::before, body::after { display: none !important; }' });
  await page.locator('.pose').screenshot({ path: png, omitBackground: true });
  const pad = 6;
  const crop = `crop=${Math.round(box.w + pad * 2)}:${Math.round(box.h + pad * 2)}:${Math.round(box.x - pad)}:${Math.round(box.y - pad)}`;
  const fit = 'scale=320:272:force_original_aspect_ratio=decrease,pad=320:272:(ow-iw)/2:(oh-ih)/2:color=0x00000000';
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', `${crop},${fit}`, '-c:v', 'libwebp', '-quality', '88', '-pix_fmt', 'yuva420p', path.join(OUT, `mascota-cabeza-${theme}.webp`)]);
  fs.unlinkSync(png);
  await ctx.close();
  console.log(theme, fs.statSync(path.join(OUT, `mascota-cabeza-${theme}.webp`)).size, JSON.stringify(box));
}
await browser.close();
