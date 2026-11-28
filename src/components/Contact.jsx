import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { profile } from '../data/profile';
import { mascotLines } from '../data/mascot';
import { externalLink, isReal, localLink } from '../lib/links';
import { ContactStage } from '../lib/contactStage';
import Mascot from './Mascot/Mascot';
import MascotAuto from './Mascot/MascotAuto';
import { useGuide } from './Mascot/Guide';
import Footer from './Footer';
import './Contact.css';

// "Abrir conexión" como un panel de puertos con cable (Jhon, 26/11/2026, opción C; sustituye a las tarjetas que la
// mascota llevaba de un sitio a otro). El mensaje va arriba, junto al título. En el escenario, la mascota 3D pasea con
// un conector en la mano y lo enchufa en los puertos (Copiar correo, GitHub, LinkedIn, CV: botones y enlaces reales);
// si señalas uno, va y lo conecta; el conector se puede arrastrar (si se lo quitas, se pone triste).
// El movimiento lo dirige lib/contactStage.js desde el bucle del motor 3D. En pantallas estrechas, con "reducir
// movimiento" o sin WebGL, el bloque es fijo: el mismo panel y la mascota a un lado.
// Mientras este bloque se ve, la mascota pequeña flotante se retira (Guide.jsx observa .cta__stage).

const Mascot3D = lazy(() => import('./Mascot3D/Mascot3D'));
// Por debajo de 1100 px no queda sitio libre para que la mascota cambie las tarjetas de lugar
const BASE = import.meta.env.BASE_URL;
// Servidor: posiciones (% de la imagen de 338 × 518) de sus luces, proyectadas desde la cámara de blender/servidor.blend.
// Si cambias el modelo o la cámara, vuelve a renderizar y a proyectarlas (world_to_camera_view).
const SRV = { power: [31.74, 22.83], ledX: [34.69, 38.8], units: [32.97, 48.41, 63.85, 79.29], delays: [0, -0.7, -1.5, -0.3] };

const STAGE_MQ ='(min-width: 1100px) and (prefers-reduced-motion: no-preference)';

const T = mascotLines.contacto;
const fill = (s) => s.replace('{name}', profile.name).replace('{email}', profile.email);
const pick = (v) => (Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v);
const hasEmail = isReal(profile.email) && profile.email.includes('@');

const Icon = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
// Icono del formulario (los puertos llevan logotipos: GLYPHS y Logo, más abajo)
const ICONS = {
  mensaje: <><path d="M4 4h16v12H8l-4 4Z" /><path d="M8 9h8M8 12h5" /></>,
};

const LINKS = [
  { id: 'github', label: 'GitHub', ready: isReal(profile.github), props: externalLink(profile.github) },
  { id: 'linkedin', label: 'LinkedIn', ready: isReal(profile.linkedin), props: externalLink(profile.linkedin) },
  { id: 'tiktok', label: 'TikTok', ready: isReal(profile.tiktok), props: externalLink(profile.tiktok) },
  { id: 'instagram', label: 'Instagram', ready: isReal(profile.instagram), props: externalLink(profile.instagram) },
  { id: 'youtube', label: 'YouTube', ready: isReal(profile.youtube), props: externalLink(profile.youtube) },
  { id: 'cv', label: 'CV', ready: isReal(profile.cvUrl), props: { ...localLink(profile.cvUrl), ...(isReal(profile.cvUrl) ? { target: '_blank', rel: 'noreferrer' } : {}) } },
];

/** Interior de un puerto: el nombre, el estado en palabras (no solo con la luz) y el enchufe con su luz. */
// Marcas de cada puerto, rellenas, en una caja de 24: GitHub y LinkedIn con sus marcas; TikTok, Instagram y YouTube
// con su forma conocida; correo y CV, iconos propios. Se pintan con currentColor (la ficha en blanco y negro) y en la
// cara de color con los colores de cada marca (Contact.css). Solo enlazan a los perfiles de Jhon.
const GLYPHS = {
  copiar: <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Zm2.4.6 5.6 4.3 5.6-4.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  github: <path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />,
  linkedin: <path fill="currentColor" d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5ZM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1Zm1.8 13.1H3.6V9h3.5Z" />,
  tiktok: <path fill="currentColor" d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.4 6.4 0 1 0 5.4 6.3V8.6a8.2 8.2 0 0 0 4.8 1.5V6.7a4.8 4.8 0 0 1-4.8-4.7Z" />,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3.9" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" /></>,
  youtube: <path fill="currentColor" d="M9.6 8.2c0-.8.9-1.3 1.6-.9l5.5 3.4c.7.4.7 1.4 0 1.8l-5.5 3.4c-.7.4-1.6-.1-1.6-.9Z" />,
  cv: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M14 3v5h5M8.5 13h7M8.5 17h4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
};

/**
 * Logotipo en 3D (ficha con grosor, brillo y algo de inclinación). Dos caras: en blanco y negro con los tonos de la
 * página y la de color de la marca encima, que se "pinta" de abajo arriba al enchufar (data-link en el puerto).
 * TikTok lleva su efecto de dos colores desplazados (cian y rojo) debajo del glifo blanco.
 */
function Logo({ id }) {
  const glyph = (cls) => <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">{GLYPHS[id]}</svg>;
  return (
    <span className={`cta__logo cta__logo--${id}`} aria-hidden="true">
      <span className="cta__face cta__face--mono">{glyph('cta__glyph')}</span>
      <span className="cta__face cta__face--brand">
        {id === 'tiktok' && <>{glyph('cta__glyph cta__glyph--cyan')}{glyph('cta__glyph cta__glyph--red')}</>}
        {glyph('cta__glyph')}
      </span>
    </span>
  );
}

function PortBody({ id, label, ready }) {
  return (
    <>
      <Logo id={id} />
      <span className="cta__port-name">{label}</span>
      <span className="cta__port-state">
        {ready ? <><span className="st-idle">listo</span><span className="st-on">en línea</span></> : 'pendiente'}
      </span>
      {/* Enchufe abajo: el conector cuelga por debajo del panel y no tapa el nombre */}
      <span className="cta__socket" aria-hidden="true"><i className="cta__led" /></span>
    </>
  );
}

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

// lab = true (página /lab de la web de Astro): solo el escenario del switch, sin el formulario ni el pie (ya están en la web)
export default function Contact({ lab = false }) {
  const { contact } = useGuide();
  const wide = useMedia(STAGE_MQ);
  const [failed, setFailed] = useState(false);
  const staged = wide && !failed;
  const [live, setLive] = useState(false); // el director ya mueve las tarjetas (y la mascota 3D está lista)
  const ask = lab ? T.preguntaLab : T.pregunta; // en /lab no hay formulario: la pregunta no habla de "arriba"
  const [line, setLine] = useState(fill(ask));
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
      timer.current = window.setTimeout(() => setLine(fill(ask)), ms);
    }
  }, []);
  const sayKey = useCallback((key, ms = 2800) => sayFor(fill(pick(T[key])), ms), [sayFor]);

  // Escenario: el director nace cuando la mascota 3D está lista y muere con ella (o al pasar a la versión fija)
  const onReady = useCallback((engine) => {
    if (!stageRef.current) return;
    director.current?.dispose();
    const d = new ContactStage(stageRef.current, {
      say: sayKey,
      // Al enchufarse sola en un puerto, a veces dice para qué sirve (sin pisar un aviso como "copiado")
      hint: (id) => { if (performance.now() >= holdUntil.current) sayFor(T.pista[id], 2600); },
    });
    d.attach(engine);
    director.current = d;
    if (import.meta.env.DEV) window.__contactStage = d; // para depurar desde la consola
    setLive(true);
  }, [sayKey, sayFor]);
  const onFrame = useCallback((dt) => director.current?.update(dt), []);
  useEffect(() => () => { director.current?.dispose(); director.current = null; setLive(false); }, [staged]);

  // Pista del conector (Jhon eligió "pista integrada", 26/11/2026; antes era el texto "Puedes arrastrar el conector"):
  // la PRIMERA vez que el escenario se ve de verdad (en este navegador), el conector brilla con unos anillos suaves y la
  // mascota lo dice una vez en su globo. Se recuerda en localStorage (mascota-conector) y no vuelve a salir.
  // OJO: la clase .hint-plug se pone en el DOM, no con estado de React: si React reescribe el className del escenario,
  // borra .is-live e .is-behind, que pone el director, y el globo y el conector se descolocan.
  useEffect(() => {
    const el = stageRef.current;
    if (!live || !el) return undefined;
    try { if (localStorage.getItem('mascota-conector')) return undefined; } catch { /* sin almacenamiento */ }
    let off = 0;
    const io = new IntersectionObserver((list) => {
      if (!list[list.length - 1].isIntersecting) return;
      io.disconnect();
      try { localStorage.setItem('mascota-conector', '1'); } catch { /* sin almacenamiento */ }
      off = window.setTimeout(() => {
        el.classList.add('hint-plug');
        if (performance.now() >= holdUntil.current) sayFor(T.arrastrar, 4600);
        off = window.setTimeout(() => el.classList.remove('hint-plug'), 4800);
      }, 1200);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(off); el.classList.remove('hint-plug'); };
  }, [live, sayFor]);

  // Versión fija: la mascota mira el puerto (−1..1 respecto de su centro)
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
    // El foco sigue dentro del formulario (del texto al botón de enviar): no cuenta como salir
    if (ev.type === 'blur' && ev.currentTarget.contains(ev.relatedTarget)) return;
    // El conector acaba de enchufarse bajo el puntero: sigues en el puerto
    if (ev.type === 'pointerleave' && ev.relatedTarget?.closest?.('.cta__plug')) return;
    director.current?.attend(null);
    if (performance.now() >= holdUntil.current) setLine(fill(ask));
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
    <section id={lab ? 'switch' : 'contacto'} className="container section section--tight">
      <div className="cta">
        {!lab && <div className="cta__top">
          <div className="cta__head">
            {/* Voz de la máquina (26/11/2026): antes "¿Trabajamos juntos? … Escríbeme." */}
            <h2>Abrir conexión</h2>
            <p>Busco prácticas y proyectos donde aprender. Deja tu mensaje y la mascota se lo lleva.</p>
          </div>
          <form className="cta__msg" onSubmit={send} {...hover('mensaje', hasEmail)}>
            <label htmlFor="cta-msg" className="cta__msg-head"><Icon d={ICONS.mensaje} />Escríbele un mensaje</label>
            <textarea
              data-lenis-prevent
              id="cta-msg" rows={3} maxLength={1500} value={msg} onChange={(e) => setMsg(e.target.value)}
              placeholder={`Hola ${profile.name}, me gustaría…`}
            />
            <button type="submit" className="btn btn--accent cta__send" {...(hasEmail ? {} : pending)}>
              Enviar por correo
            </button>
          </form>
        </div>}

        <div ref={stageRef} className={`cta__stage${staged ? '' : ' cta__stage--static'}`}>
          <div className="cta__bubble">{line}</div>
          {staged && <span className="cta__shadow" aria-hidden="true" />}

          {/* Panel de puertos (pared del fondo): cada puerto es un botón o un enlace de verdad */}
          <div className="cta__panel" role="group" aria-label="Conexiones">
            <p className="cta__panel-name" aria-hidden="true"><span>{profile.brand.toLowerCase()}-sw01</span><span>{1 + LINKS.length} puertos</span></p>
            <div className="cta__ports">
              <button type="button" className="cta__port" data-port="copiar" onClick={copy} {...(hasEmail ? {} : pending)} {...hover('copiar', hasEmail)}>
                <PortBody id="copiar" label="Copiar correo" ready={hasEmail} />
              </button>
              {LINKS.map((l) => (
                <a key={l.id} {...l.props} className="cta__port" data-port={l.id} draggable={false} {...hover(l.id, l.ready)}>
                  <PortBody id={l.id} label={l.label} ready={l.ready} />
                </a>
              ))}
            </div>
          </div>

          {/* Servidor del suelo (base del cable), cable y conector (solo en el escenario; los mueve lib/contactStage.js) */}
          {staged && (
            <>
              {/* Servidor renderizado en Blender (blender/servidor.blend → public/img/servidor.webp), con su sombra en el
                  suelo; las luces y el puerto del cable van encima, en las posiciones que da la cámara de Blender (SRV). */}
              <span className="cta__server" aria-hidden="true">
                <img className="cta__server-img" src={`${BASE}img/servidor.webp`} width="132" height="202" alt="" decoding="async" draggable="false" />
                <i className="cta__srv-led cta__srv-led--power" style={{ left: `${SRV.power[0]}%`, top: `${SRV.power[1]}%` }} />
                {SRV.units.map((y, u) => (
                  <span key={u} className="cta__unit">
                    <i className="cta__srv-led cta__srv-led--act" style={{ left: `${SRV.ledX[0]}%`, top: `${y}%`, animationDelay: `${SRV.delays[u]}s` }} />
                    <i className="cta__srv-led cta__srv-led--link" style={{ left: `${SRV.ledX[1]}%`, top: `${y - 0.22}%` }} />
                  </span>
                ))}
                <span className="cta__server-port" />
              </span>
              <svg className="cta__cable" aria-hidden="true" preserveAspectRatio="none"><path /></svg>
              <span className="cta__plug" aria-hidden="true" title="Arrastra el conector a un puerto"><i /><b className="cta__plug-ring" /></span>
            </>
          )}

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
        {!lab && <Footer />}
      </div>
    </section>
  );
}
