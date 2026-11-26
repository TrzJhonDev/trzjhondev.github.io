// Recorrido de verificación del portafolio (la versión React no usa el motor de scroll-craft, así que su shoot.mjs no
// sirve tal cual). Misma idea: baja la página en pasos de media pantalla, espera a que se asiente, hace una captura por
// paso, apunta el estado del encendido y los errores de consola, y junta las capturas en una hoja de contactos.
//   node scrollcraft/builds/portafolio/lab/walk.mjs --out lab/desktop [--width 1440 --height 900] [--mobile] [--reduced]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);
const URL = arg('--url', 'http://localhost:5173/');
const OUT = path.resolve(arg('--out', 'lab/desktop'));
const W = +arg('--width', has('--mobile') ? 390 : 1440), H = +arg('--height', has('--mobile') ? 844 : 900);
const STEP = +arg('--step', 0.5);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: 1,
  isMobile: has('--mobile'), hasTouch: has('--mobile'),
  reducedMotion: has('--reduced') ? 'reduce' : 'no-preference',
  colorScheme: has('--dark') ? 'dark' : 'light',
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const report = [];
let i = 0;
for (let y = 0; ; y += STEP * H) {
  const top = Math.min(y, total);
  // scroll suave real en pasos pequeños (las animaciones ligadas al scroll lo necesitan)
  await page.evaluate(async (t) => {
    const from = scrollY, n = 8;
    for (let k = 1; k <= n; k++) { window.scrollTo({ top: from + ((t - from) * k) / n, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)); }
  }, top);
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => ({
    y: Math.round(scrollY),
    boot: document.querySelector('.boot-runway')?.dataset.scVerifyState || '',
    gl: !!document.querySelector('.stage.is-gl'),
    hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
  }));
  const file = path.join(OUT, `f${String(i).padStart(2, '0')}.png`);
  await page.screenshot({ path: file });
  report.push({ i, ...st });
  i += 1;
  if (top >= total) break;
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ W, H, total, report, errors }, null, 2));
// Hoja de contactos: 4 columnas
const cols = 4, rows = Math.ceil(i / cols);
spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(OUT, 'f%02d.png'),
  '-vf', `scale=${Math.round(W / (W > 800 ? 4 : 2.5))}:-1,tile=${cols}x${rows}:padding=6:color=0x222222`, '-frames:v', '1', path.join(OUT, 'sheet.png')]);
console.log(JSON.stringify({ frames: i, total, errors: errors.slice(0, 5), overflow: report.some((r) => r.hOverflow), boot: report.map((r) => r.boot).filter(Boolean) }));
await browser.close();
