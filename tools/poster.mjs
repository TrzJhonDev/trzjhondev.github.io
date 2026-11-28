// Saca la imagen fija de la pantalla de carga con el motor 3D real (?posar): mascota dormida, fondo transparente,
// en oscuro y en claro, a 680 × 907 (el doble de la caja de carga). Apunta también dónde cae la pantalla del pecho
// (en % de la imagen) para colocar encima el CARGANDO de HTML.
//   node tools/poster.mjs --url http://localhost:5173/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const URL = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1] : 'http://localhost:5173/';
const OUT = path.resolve('public/img');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const info = {};
for (const theme of ['oscuro', 'claro']) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} }, theme === 'oscuro' ? 'dark' : 'light');
  const page = await ctx.newPage();
  await page.goto(`${URL}posar/?w=680`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__poseReady === true, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const box = await page.evaluate(() => {
    const e = [...window.__mascots][0];
    const el = document.querySelector('.pose').getBoundingClientRect();
    // Esquinas de la pantalla del pecho proyectadas a la imagen
    const THREE = e.camera.constructor; // (no hace falta Three aquí: se usa la geometría del motor)
    e.model.updateMatrixWorld(true);
    const g = e.consoleMesh.geometry; g.computeBoundingBox();
    const b = g.boundingBox, pts = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
      const v = b.min.clone().set(x, y, z).applyMatrix4(e.consoleMesh.matrixWorld).project(e.camera);
      pts.push([(v.x + 1) / 2, (1 - v.y) / 2]);
    }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return { w: el.width, h: el.height, chest: { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) } };
  });
  info[theme] = box.chest;
  // Fondo TRANSPARENTE de verdad: global.css pinta --bg en html y body (con fondo opaco, en la portada se veía un
  // rectángulo negro o crema sobre el panel azul mientras la mascota volaba; Jhon, 28/11/2026)
  await page.evaluate(() => { for (const el of [document.documentElement, document.body]) el.style.setProperty('background', 'transparent', 'important'); });
  const png = path.join(OUT, `_dormida-${theme}.png`);
  await page.locator('.pose').screenshot({ path: png, omitBackground: true });
  // yuva420p: conserva el canal alfa en el WebP
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '86', '-lossless', '0', path.join(OUT, `mascota-dormida-${theme}.webp`)]);
  fs.unlinkSync(png);
  await ctx.close();
}
console.log(JSON.stringify(info));
for (const t of ['oscuro', 'claro']) console.log(t, fs.statSync(path.join(OUT, `mascota-dormida-${t}.webp`)).size);
await browser.close();
