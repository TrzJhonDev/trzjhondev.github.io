// Coordinador de la pantalla de precarga de la portada (src/astro/Boot.astro; docs/PLAN-REESCRITURA.md). Sin dependencias.
//
// La pantalla (#boot) es HTML de Boot.astro y se pinta antes que nada. Aquí:
//  - se descarga el modelo de la mascota con fetch, leyendo el cuerpo por partes para saber el progreso real;
//  - se lleva el progreso con pesos: modelo 45 %, Three.js 35 %, fuentes 10 %, página montada 10 %;
//  - se avisa cuando la mascota 3D está lista para despertar ('mascot'), o cuando se agota el tope (maxMs) o el
//    visitante salta la carga (Esc o clic): en esos casos se sigue igual, sin esperar más.
// La barra de #boot y la consola del pecho leen el progreso de aquí.

/** URL de un modelo con su versión (huella del archivo, ver lib/modelVersions.js y Base.astro): un .glb reexportado nunca se sirve viejo. */
export function modelUrl(name) {
  const meta = typeof document !== 'undefined' && document.querySelector('meta[name="model-versions"]')?.content;
  const v = meta && new RegExp(`${name}=([\w]+)`).exec(meta)?.[1];
  return `${import.meta.env.BASE_URL}models/${name}.glb${v ? `?v=${v}` : ''}`;
}
export const MASCOT_URL = modelUrl('mascota');

const WEIGHTS = { model: 0.45, three: 0.35, fonts: 0.1, app: 0.1 };
const MAX_MS = 6000;

const state = { parts: { model: 0, three: 0, fonts: 0, app: 0 }, mascot: false, done: false, skipped: false };
const subs = new Set();
const emit = () => subs.forEach((fn) => fn(boot.progress, state));

export const boot = {
  /** ¿Hay pantalla de carga en esta visita? (index.html pone .is-booting en <html>) */
  get active() { return typeof document !== 'undefined' && document.documentElement.classList.contains('is-booting'); },
  get progress() { return Object.entries(WEIGHTS).reduce((a, [k, w]) => a + w * state.parts[k], 0); },
  get skipped() { return state.skipped; },
  get finished() { return state.done; },
  get timedOut() { return state.timedOut; },
  set(part, v) { state.parts[part] = Math.max(state.parts[part], Math.min(1, v)); emit(); },
  /** La mascota 3D ya está compilada y dibujada (o falló: entonces se sigue con la CSS). */
  mascotReady() { state.mascot = true; emit(); },
  /** fn(progreso 0..1, estado). Devuelve la función para darse de baja. */
  on(fn) { subs.add(fn); fn(boot.progress, state); return () => subs.delete(fn); },
  /** ¿Se puede despertar? Todo cargado, o saltado, o tope agotado. */
  get ready() { return state.skipped || state.timedOut || (state.mascot && boot.progress > 0.999); },
  skip() { state.skipped = true; emit(); },
  /** Fin: quita la marca de carga de <html> (la página se ve y se puede desplazar). */
  finish() {
    if (state.done) return;
    state.done = true;
    document.documentElement.classList.remove('is-booting');
    document.documentElement.removeAttribute('aria-busy');
    emit();
  },
};

// ── Modelo con progreso ───────────────────────────────────────────────────────
const models = {};
/** ArrayBuffer del modelo (la misma descarga para el motor 3D). */
export function modelBuffer(url) {
  return (models[url] ||= (async () => {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`modelo ${res.status}`);
    const total = Number(res.headers.get('content-length')) || 0;
    if (!res.body || !total) { const b = await res.arrayBuffer(); boot.set('model', 1); return b; }
    // El tamaño que da el servidor puede ser el comprimido: se estima con el doble y se corta en 1 al terminar
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      boot.set('model', Math.min(0.95, got / (total * (res.headers.get('content-encoding') ? 3 : 1))));
    }
    const out = new Uint8Array(got);
    let o = 0;
    chunks.forEach((c) => { out.set(c, o); o += c.length; });
    boot.set('model', 1);
    return out.buffer;
  })());
}

/** Arranque: lo llama el script de src/pages/index.astro si hay pantalla de precarga (src/astro/Boot.astro). */
export function startBoot({ modelUrl, importMascot, maxMs = MAX_MS }) {
  if (!boot.active) return;
  document.documentElement.setAttribute('aria-busy', 'true');
  modelBuffer(modelUrl).catch(() => boot.set('model', 1));
  importMascot().then(() => boot.set('three', 1), () => boot.set('three', 1));
  (document.fonts?.ready || Promise.resolve()).then(() => boot.set('fonts', 1));
  window.setTimeout(() => { state.timedOut = true; emit(); }, maxMs);
  // Saltar la carga: Esc o un clic en la pantalla de carga
  const skip = (e) => { if (e.type === 'keydown' && e.key !== 'Escape') return; boot.skip(); };
  window.addEventListener('keydown', skip);
  document.getElementById('boot')?.addEventListener('click', skip);
  // La barra de la pantalla HTML (antes de que la consola 3D tome el relevo), con un avance suave
  const fill = document.querySelector('#boot .boot__bar i');
  const pct = document.querySelector('#boot .boot__pct');
  let shown = 0;
  const paint = () => {
    shown += (boot.progress - shown) * 0.18;
    if (fill) fill.style.transform = `scaleX(${shown.toFixed(3)})`;
    if (pct) pct.textContent = `${Math.round(shown * 100)}%`;
    if (!state.done) requestAnimationFrame(paint);
  };
  requestAnimationFrame(paint);
}
