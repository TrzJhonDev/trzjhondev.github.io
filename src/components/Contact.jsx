import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { profile } from '../data/profile';
import { mascotLines } from '../data/mascot';
import { externalLink, isReal, localLink } from '../lib/links';
import { ContactStage } from '../lib/contactStage';
import Mascot from './Mascot/Mascot';
import MascotAuto from './Mascot/MascotAuto';
import { useGuide } from './Mascot/Guide';
import './Contact.css';

// "¿Trabajamos juntos?" como un escenario (Jhon, 24/11/2026): la mascota 3D camina, se da la vuelta, se pone de
// espaldas y lleva las tarjetas de contacto de un sitio a otro. Si le quitas (arrastras) la que lleva, se pone triste
// y luego se le pasa. Las tarjetas son botones, enlaces y un formulario de verdad (con teclado funcionan igual).
// El movimiento lo dirige lib/contactStage.js desde el bucle del motor 3D. En pantallas estrechas, con "reducir
// movimiento" o sin WebGL, el bloque es fijo: las mismas tarjetas en una rejilla y la mascota a un lado.
// Mientras este bloque se ve, la mascota pequeña flotante se retira (Guide.jsx observa .cta__stage).

const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));
// Por debajo de 1100 px no queda sitio libre para que la mascota cambie las tarjetas de lugar
const STAGE_MQ = '(min-width: 1100px) and (prefers-reduced-motion: no-preference)';

const T = mascotLines.contacto;
const fill = (s) => s.replace('{name}', profile.name).replace('{email}', profile.email);
const pick = (v) => (Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v);
const hasEmail = isReal(profile.email) && profile.email.includes('@');

const Icon = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const ICONS = {
  copiar: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  github: <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />,
  linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>,
  cv: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  mensaje: <><path d="M4 4h16v12H8l-4 4Z" /><path d="M8 9h8M8 12h5" /></>,
};

const LINKS = [
  { id: 'github', label: 'GitHub', ready: isReal(profile.github), props: externalLink(profile.github) },
  { id: 'linkedin', label: 'LinkedIn', ready: isReal(profile.linkedin), props: externalLink(profile.linkedin) },
  { id: 'cv', label: 'Ver CV', ready: isReal(profile.cvUrl), props: { ...localLink(profile.cvUrl), ...(isReal(profile.cvUrl) ? { target: '_blank', rel: 'noreferrer' } : {}) } },
];

function useMedia(query) {
  const [on, setOn] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setOn(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return on;
}

export default function Contact() {
  const { contact } = useGuide();
  const wide = useMedia(STAGE_MQ);
  const [failed, setFailed] = useState(false);
  const staged = wide && !failed;
  const [live, setLive] = useState(false); // el director ya mueve las tarjetas (y la mascota 3D está lista)
  const [line, setLine] = useState(fill(T.pregunta));
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');
  const stageRef = useRef(null);
  const botRef = useRef(null);
  const director = useRef(null);
  const holdUntil = useRef(0); // un aviso ("copiado", "triste"…) se queda un momento aunque el puntero pase por otra tarjeta
  const timer = useRef(0);
  const jokes = useRef({});
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sayFor = useCallback((text, ms = 0) => {
    setLine(text);
    window.clearTimeout(timer.current);
    if (ms) {
      holdUntil.current = performance.now() + ms;
      timer.current = window.setTimeout(() => setLine(fill(T.pregunta)), ms);
    }
  }, []);
  const sayKey = useCallback((key, ms = 2800) => sayFor(fill(pick(T[key])), ms), [sayFor]);

  // Escenario: el director nace cuando la mascota 3D está lista y muere con ella (o al pasar a la versión fija)
  const onReady = useCallback((engine) => {
    if (!stageRef.current) return;
    director.current?.dispose();
    const d = new ContactStage(stageRef.current, { say: sayKey });
    d.attach(engine);
    director.current = d;
    setLive(true);
  }, [sayKey]);
  const onFrame = useCallback((dt) => director.current?.update(dt), []);
  useEffect(() => () => { director.current?.dispose(); director.current = null; setLive(false); }, [staged]);

  // Versión fija: la mascota mira la tarjeta (−1..1 respecto de su centro)
  const lookAt = useCallback((el) => {
    const bot = botRef.current?.getBoundingClientRect();
    if (!bot || !el) return;
    const r = el.getBoundingClientRect();
    const dx = (r.left + r.width / 2 - (bot.left + bot.width / 2)) / 260;
    const dy = (r.top + r.height / 2 - (bot.top + bot.height * 0.3)) / 260;
    contact.glance(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, dy)), 1600);
  }, [contact]);

  const hint = (id, ready) => (ev) => {
    if (director.current) director.current.attend(id); else lookAt(ev.currentTarget);
    if (performance.now() < holdUntil.current) return;
    setLine(ready ? T.pista[id] : T.pendiente);
  };
  const unhint = (ev) => {
    // El foco sigue dentro de la tarjeta (del texto al botón de enviar): no cuenta como salir
    if (ev.type === 'blur' && ev.currentTarget.contains(ev.relatedTarget)) return;
    director.current?.attend(null);
    if (performance.now() >= holdUntil.current) setLine(fill(T.pregunta));
  };
  const hover = (id, ready) => ({
    onPointerEnter: hint(id, ready), onPointerLeave: unhint, onFocus: hint(id, ready), onBlur: unhint,
  });

  const copy = async () => {
    if (!hasEmail) { sayFor(T.pendiente, 2500); return; }
    try {
      await navigator.clipboard.writeText(profile.email);
      sayFor(T.copiado, 3500);
      setStatus(T.copiado);
      contact.command('cheer');
    } catch {
      sayFor(fill(T.sinCopiar), 8000);
      setStatus(fill(T.sinCopiar));
    }
  };

  // Mensaje: se abre el correo del visitante con el texto ya puesto (sin servidor)
  const send = (ev) => {
    ev.preventDefault();
    if (!hasEmail) { sayFor(T.pendiente, 2500); return; }
    const text = msg.trim();
    if (!text) { sayFor(T.vacio, 2600); return; }
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(T.asunto)}&body=${encodeURIComponent(text)}`;
    sayFor(T.enviado, 4000);
    setStatus(T.enviado);
    contact.command('cheer');
  };

  // Clic en la mascota: el chiste sale en este globo (no en el de la guía, que aquí no se ve)
  const onAct = useCallback((type) => {
    const list = mascotLines.clic[type];
    if (!list) return;
    const j = jokes.current;
    j[type] = ((j[type] ?? Math.floor(Math.random() * list.length)) + 1) % list.length;
    sayFor(list[j[type]], 3000);
  }, [sayFor]);

  const pending = { 'aria-disabled': 'true', title: 'Pendiente de completar en src/data/profile.js' };
  const mascotProps = { ptr: contact.ptr, look: contact.look, cmd: contact.cmd, onAct };

  return (
    <section id="contacto" className="container section section--tight">
      <div className="cta">
        <div className="cta__head">
          <h2>¿Trabajamos juntos?</h2>
          <p>Busco prácticas pre‑profesionales y proyectos donde aprender. Escríbeme.</p>
        </div>

        <div ref={stageRef} className={`cta__stage${staged ? '' : ' cta__stage--static'}`}>
          <div className="cta__bubble">{line}</div>
          {staged && <span className="cta__shadow" aria-hidden="true" />}
          {staged && <p className="cta__tip">Puedes arrastrar las tarjetas</p>}

          <div className="cta__cards">
            <form className="cta__card cta__msg" data-card="mensaje" data-big="" onSubmit={send} {...hover('mensaje', hasEmail)}>
              <label htmlFor="cta-msg" className="cta__msg-head"><Icon d={ICONS.mensaje} />Escríbele un mensaje</label>
              <textarea
                id="cta-msg" rows={4} maxLength={1500} value={msg} onChange={(e) => setMsg(e.target.value)}
                placeholder={`Hola ${profile.name}, me gustaría…`}
              />
              <button type="submit" className="btn btn--accent cta__send" {...(hasEmail ? {} : pending)}>
                Enviar por correo
              </button>
            </form>

            <button type="button" className="cta__card cta__chip cta__chip--accent" data-card="copiar" onClick={copy} {...(hasEmail ? {} : pending)} {...hover('copiar', hasEmail)}>
              <Icon d={ICONS.copiar} />Copiar correo
            </button>
            {LINKS.map((l) => (
              <a key={l.id} {...l.props} className="cta__card cta__chip" data-card={l.id} draggable={false} {...hover(l.id, l.ready)}>
                <Icon d={ICONS[l.id]} />{l.label}
              </a>
            ))}
          </div>

          {/* Mascota: en el escenario, la CSS hasta que la 3D está lista; en la versión fija, la automática */}
          {!live && (
            <div className="cta__bot" ref={botRef}>
              {staged ? <Mascot variant="mini" {...mascotProps} /> : <MascotAuto variant="mini" {...mascotProps} />}
            </div>
          )}
          {staged && (
            <Suspense fallback={null}>
              <Mascot3D variant="mini" stage {...mascotProps} onFrame={onFrame} onReady={onReady} onError={() => setFailed(true)} />
            </Suspense>
          )}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{status}</p>
      </div>
    </section>
  );
}
