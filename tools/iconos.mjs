// Iconos del sitio: la carita de la mascota (26/11/2026, pedida por Jhon en lugar de la "J_").
//   node tools/iconos.mjs
// Escribe en public/:
//   favicon.svg           pestaña: versión de 16×16 píxeles (ojos 4×5 con pupila, puente de las gafas, sonrisa),
//                         la única que se lee a 16 px. Con más detalle a ese tamaño todo se emborronaba.
//   favicon-32.png        la misma, para navegadores sin iconos SVG
//   apple-touch-icon.png  180 px, la cara completa como en Face.jsx/Mascot.css (monturas, filo de luz, brillo,
//                         reflejo); ocupa el cuadrado entero porque iOS pone sus propias esquinas
// Los colores son los de --m-* (Mascot.css, tema oscuro) y los píxeles los de faceData.js: si cambia la cara, vuelve a lanzarlo.
// Necesita Google Chrome instalado (usa playwright-core para pasar el SVG a PNG).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const OUT = path.resolve('public');
const LIT = '#8FD8FF', LITRGB = '143,216,255', RIM = '#467087', SHELL = '#5B5E67', S1 = '#0B1A24', S2 = '#061016', PUPIL = '#061016';

// ── Pestaña: rejilla de 16×16, un rect por píxel ──
const px = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const grid = (rows, x0, y0, c) => rows.flatMap((r, j) => [...r].map((ch, i) => (ch === '#' ? px(x0 + i, y0 + j, 1, 1, c) : ''))).join('');
function tab() {
  const EYE4 = ['.##.', '####', '####', '####', '.##.'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${S1}"/><stop offset="1" stop-color="${S2}"/></linearGradient></defs>`
    + `<rect width="16" height="16" rx="3.5" fill="${SHELL}"/><rect x="1" y="1" width="14" height="14" rx="2.5" fill="url(#g)"/>`
    + px(6, 5, 4, 1, RIM) // puente de las gafas
    + grid(EYE4, 2, 3, LIT) + grid(EYE4, 10, 3, LIT) + grid(['#....#', '.####.'], 5, 11, LIT)
    + px(3, 4, 2, 3, PUPIL) + px(11, 4, 2, 3, PUPIL)
    + '</svg>';
}

// ── Pantalla de inicio: la cara real en vector (coordenadas de la pantalla de la cara, 160 × 124) ──
function home() {
  const P = 7;
  const EYE = ['.####.', '######', '######', '######', '######', '######', '.####.'];
  const MOUTH = ['#......#', '.######.'];
  const cells = (rows, x0, y0) => rows.flatMap((r, j) => [...r].map((c, i) => (c === '#' ? `<rect x="${x0 + i * P}" y="${y0 + j * P}" width="${P}" height="${P}"/>` : ''))).join('');
  const EYE_W = 6 * P, EX = [80 - 36 - EYE_W / 2, 80 + 36 - EYE_W / 2], EY = 22, MX = 80 - 4 * P, MY = 90;
  const ecx = EX.map((x) => x + EYE_W / 2), ecy = EY + 3.5 * P;
  const frame = (cx) => `<rect x="${cx - 29.75}" y="${ecy - 31.75}" width="59.5" height="63.5" rx="15.75" fill="none" stroke="rgba(${LITRGB},.45)" stroke-width="1.5"/>`
    + `<rect x="${cx - 26.5}" y="${ecy - 28.5}" width="53" height="57" rx="12.5" fill="rgba(${LITRGB},.06)" stroke="#0A0B0D" stroke-width="5"/>`;
  const by = ecy - 9, gap = ecx[1] - ecx[0];
  const bridge = `<rect x="${ecx[0] + 26}" y="${by - 0.75}" width="${gap - 52}" height="6.5" rx="3.25" fill="rgba(${LITRGB},.45)"/>`
    + `<rect x="${ecx[0] + 27}" y="${by}" width="${gap - 54}" height="5" rx="2.5" fill="#0A0B0D"/>`;
  const lit = cells(EYE, EX[0], EY) + cells(EYE, EX[1], EY) + cells(MOUTH, MX, MY);
  const pupils = EX.map((x) => `<rect x="${x + 2 * P}" y="${EY + 2 * P}" width="${2 * P}" height="${3 * P}"/>`).join('');
  const top = ecy - 32, H = MY + 2 * P - top, N = 176, BZ = 10, IN = N - 2 * BZ, k = 0.9;
  const tx = BZ + (IN - 160 * k) / 2, ty = N / 2 - (top + H / 2) * k;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}"><defs>
<linearGradient id="scr" x1="0" y1="0" x2="1" y2="1.15"><stop offset="0" stop-color="${S1}"/><stop offset="1" stop-color="${S2}"/></linearGradient>
<linearGradient id="glare" x1="0" y1="0" x2="1" y2=".7"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="in" cx=".5" cy=".5" r=".7"><stop offset=".6" stop-color="rgb(${LITRGB})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${LITRGB})" stop-opacity=".12"/></radialGradient>
<linearGradient id="shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A6D77"/><stop offset="1" stop-color="#4C4F57"/></linearGradient>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<clipPath id="clip"><rect x="${BZ}" y="${BZ}" width="${IN}" height="${IN}" rx="30"/></clipPath></defs>
<rect width="${N}" height="${N}" fill="url(#shell)"/>
<rect x="${BZ}" y="${BZ}" width="${IN}" height="${IN}" rx="30" fill="url(#scr)"/><rect x="${BZ}" y="${BZ}" width="${IN}" height="${IN}" rx="30" fill="url(#in)"/>
<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k})">${frame(ecx[0])}${frame(ecx[1])}${bridge}
<g fill="${LIT}" filter="url(#glow)" shape-rendering="crispEdges">${lit}</g><g fill="${PUPIL}" shape-rendering="crispEdges">${pupils}</g></g>
<g clip-path="url(#clip)"><rect x="${BZ}" y="${BZ}" width="${IN}" height="${IN}" fill="url(#glare)"/></g>
<rect x="${BZ + 1}" y="${BZ + 1}" width="${IN - 2}" height="${IN - 2}" rx="29" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2"/></svg>`;
}

const favicon = tab();
fs.writeFileSync(path.join(OUT, 'favicon.svg'), favicon);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const png = async (svg, size, file) => {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const src = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  await page.setContent(`<body style="margin:0;background:transparent"><img src="${src}" width="${size}" height="${size}" style="display:block"></body>`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
};
await png(favicon, 32, 'favicon-32.png');
await png(home(), 180, 'apple-touch-icon.png');
await browser.close();
console.log('Iconos escritos en public/: favicon.svg, favicon-32.png, apple-touch-icon.png');
