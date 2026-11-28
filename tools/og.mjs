// Tarjeta para compartir (Open Graph, 1200 × 630): la imagen que sale al mandar el enlace por WhatsApp, LinkedIn, etc.
// Mascota despierta sacada del MISMO motor 3D (?posar&despierta, fondo transparente) y los textos de la portada
// (profile.js), en el tema oscuro y con IBM Plex. Genera public/og.jpg. Si cambian la mascota, sus colores o los
// textos de la portada, vuelve a lanzarlo con el servidor de desarrollo en marcha:
//   node tools/og.mjs --url http://localhost:5173/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { profile } from '../src/data/profile.js';

const URL = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1] : 'http://localhost:5173/';
const OUT = path.resolve('public');
const tmp = path.join(OUT, '_og-mascota.png');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

// 1) La mascota, despierta y de cuerpo entero, con fondo transparente
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1300 }, reducedMotion: 'reduce' });
await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); } catch { /* sin almacenamiento */ } });
const pose = await ctx.newPage();
await pose.goto(`${URL}posar/?despierta&w=900`, { waitUntil: 'networkidle' });
await pose.waitForFunction(() => window.__poseReady === true, null, { timeout: 30000 });
await pose.waitForTimeout(800);
await pose.addStyleTag({ content: 'html, body, #root, main { background: transparent !important; } body::before, body::after { display: none !important; }' });
await pose.locator('.pose').screenshot({ path: tmp, omitBackground: true });
await ctx.close();
const mascot = `data:image/png;base64,${fs.readFileSync(tmp).toString('base64')}`;
fs.unlinkSync(tmp);

// 2) La tarjeta (colores del tema oscuro de index.css)
const accent = profile.hero.accent.replace('{name}', profile.name);
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@700&family=IBM+Plex+Sans:wght@400;500&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #0C0E13; color: #F2F4F7; font-family: 'IBM Plex Sans', sans-serif; position: relative; }
  .halo { position: absolute; right: -120px; top: -60px; width: 820px; height: 820px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(42, 180, 244, 0.22), rgba(42, 180, 244, 0.06) 55%, transparent); }
  .floor { position: absolute; right: 70px; bottom: 34px; width: 420px; height: 46px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0, 0, 0, 0.55), transparent); }
  .bot { position: absolute; right: 60px; bottom: 44px; height: 590px; }
  .text { position: absolute; left: 84px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; gap: 20px; }
  .kicker { font: 500 26px 'IBM Plex Mono', monospace; color: #4C8DF6; }
  h1 { font: 700 92px/1.02 'IBM Plex Sans Condensed', sans-serif; letter-spacing: -0.015em; }
  h1 span { display: block; } h1 .a { color: #2AB4F4; }
  .role { font-size: 30px; color: #B4BAC6; }
  .brand { position: absolute; left: 84px; bottom: 52px; display: flex; align-items: center; gap: 14px; font: 500 24px 'IBM Plex Mono', monospace; color: #8B93A1; }
  .brand b { font: 700 30px 'IBM Plex Sans Condensed', sans-serif; color: #F2F4F7; letter-spacing: -0.005em; }
  .brand i { font-style: normal; color: #2AB4F4; }
</style></head><body>
  <div class="halo"></div><div class="floor"></div>
  <img class="bot" src="${mascot}" alt="">
  <div class="text">
    <p class="kicker">${esc(profile.hero.kicker)}</p>
    <h1><span>${esc(profile.hero.title)}</span><span class="a">${esc(accent)}</span></h1>
    <p class="role">${esc(profile.role)}</p>
  </div>
  <p class="brand"><b>${esc(profile.brand)}<i>_</i></b></p>
</body></html>`;
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const png = path.join(OUT, '_og.png');
await page.screenshot({ path: png });
await browser.close();
spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-q:v', '3', path.join(OUT, 'og.jpg')]);
fs.unlinkSync(png);
console.log('og.jpg', fs.statSync(path.join(OUT, 'og.jpg')).size);
