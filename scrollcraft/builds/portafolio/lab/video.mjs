// Graba la carga de la portada como fotogramas (CDP screencast) para revisar el vuelo fotograma a fotograma.
//   node scrollcraft/builds/portafolio/lab/video.mjs --out lab/video [--mobile] [--light]
import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright-core';
const argv = process.argv.slice(2); const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : d; };
const OUT = path.resolve(arg('--out', 'lab/video')); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const mobile = argv.includes('--mobile');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: mobile, hasTouch: mobile, colorScheme: argv.includes('--light') ? 'light' : 'dark' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
let n = 0; const t0 = Date.now();
cdp.on('Page.screencastFrame', async (f) => {
  fs.writeFileSync(path.join(OUT, `f${String(n++).padStart(4, '0')}-${Date.now() - t0}.jpg`), Buffer.from(f.data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
await page.goto(arg('--url', 'http://localhost:4173/'));
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1800);
await cdp.send('Page.stopScreencast');
console.log(n, 'fotogramas');
await browser.close();
