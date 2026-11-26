// Mide y fotografía la carga de la portada (PLAN-PANTALLA-CARGA.md): red 4G simulada, caché fría y caliente.
//   node scrollcraft/builds/portafolio/lab/carga.mjs --url http://localhost:4173/ --out lab/carga-antes [--mobile] [--reduced] [--nowebgl]
// Apunta en el tiempo: primer pintado, cuándo se ve la mascota CSS, cuándo está la 3D y cuándo termina la carga
// (si existe #boot). Hace capturas cada 150 ms durante los primeros 3 s.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);
const URL = arg('--url', 'http://localhost:4173/');
const OUT = path.resolve(arg('--out', 'lab/carga'));
const mobile = has('--mobile');
fs.mkdirSync(OUT, { recursive: true });

const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
if (has('--nowebgl')) args.push('--disable-webgl', '--disable-3d-apis');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args });

async function run(label, ctx) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  // 4G: 9 Mbps de bajada, 40 ms de latencia
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const t0 = Date.now();
  page.goto(URL).catch(() => {});
  const marks = {};
  const shots = [];
  for (let i = 0; i < 40; i++) {
    const t = Date.now() - t0;
    const s = await page.evaluate(() => ({
      paint: performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint')?.startTime ?? null,
      css: !!document.querySelector('.portrait .mascot:not(.mascot3d__ghost)'),
      gl: !!document.querySelector('.portrait .mascot3d__canvas') && !document.querySelector('.portrait .mascot:not(.mascot3d__ghost)'),
      boot: !!document.getElementById('boot'),
      booting: document.documentElement.classList.contains('is-booting'),
    })).catch(() => null);
    if (s) {
      if (s.paint != null && marks.fcp == null) marks.fcp = Math.round(s.paint);
      if (s.css && marks.css == null) marks.css = t;
      if (s.gl && marks.gl == null) marks.gl = t;
      if (s.boot && marks.boot == null) marks.boot = t;
      if (marks.boot != null && !s.boot && !s.booting && marks.bootEnd == null) marks.bootEnd = t;
    }
    if (i % 2 === 0 && i < 30) {
      const f = path.join(OUT, `${label}-${String(t).padStart(5, '0')}.png`);
      await page.screenshot({ path: f }).catch(() => {});
      shots.push(path.basename(f));
    }
    await page.waitForTimeout(150);
  }
  await page.close();
  return { label, marks, errors: errors.slice(0, 3), shots: shots.length };
}

const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1,
  reducedMotion: has('--reduced') ? 'reduce' : 'no-preference',
  colorScheme: has('--light') ? 'light' : 'dark',
});
const cold = await run('fria', ctx);
const warm = await run('caliente', ctx);
const res = { cold, warm };
fs.writeFileSync(path.join(OUT, 'tiempos.json'), JSON.stringify(res, null, 2));
console.log(JSON.stringify(res));
await browser.close();
