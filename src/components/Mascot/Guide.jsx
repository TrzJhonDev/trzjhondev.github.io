import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { profile } from '../../data/profile';
import { mascotLines } from '../../data/mascot';
import { DESKTOP } from '../Laptop3D/useLayout';
import { Bubble } from './Bubble';
import MascotAuto from './MascotAuto';

/**
 * Guía de la página. Reparte los mensajes de la mascota y decide cuál de las dos está a la vista:
 *  - la grande de la portada (Portrait) mientras se ve;
 *  - una pequeña, fija abajo a la derecha, cuando la portada ya no está a la vista.
 * Cuándo habla: saludo (lo pide la propia mascota), un comentario por sección (una vez por sesión, sin prisa),
 * los chistes al hacer clic y, como compañera del portátil, al elegir una skill, ejecutar código, abrir el despiece
 * o dejar el portátil inclinado (entonces ofrece enderezarlo; nunca lo toca sin permiso).
 * Máximo un mensaje automático cada COOLDOWN ms; se puede callar (se recuerda) y cerrar.
 * Al cambiar de sección o de skill la mascota mira hacia el contenido.
 */
const GuideCtx = createContext(null);
export const useGuide = () => useContext(GuideCtx);

// Contacto no está aquí: allí la mascota "atiende" dentro del bloque (Contact.jsx) con su propio globo,
// y la pequeña flotante se esconde mientras ese bloque se ve (contactVisible), para que no haya dos.
const SECTIONS = ['proyectos', 'formacion'];
const GLANCE = { proyectos: [-0.7, -0.2], formacion: [-0.6, 0.1] }; // hacia dónde mira (−1..1)
const LAPTOP_GLANCE = [-0.7, -0.15];
const COOLDOWN = 6000;        // entre mensajes automáticos
const REACT_COOLDOWN = 2500;  // entre reacciones a algo que acaba de hacer el usuario en el portátil
const DWELL = 1400;           // tiempo mínimo en una sección antes de comentarla
const TILT_RETRY = 45000;     // entre ofertas de enderezar
const TILT_MAX_OFFERS = 3;    // por sesión

const fill = (s) => s.replace('{name}', profile.name);
const read = (area, key) => { try { return window[area].getItem(key); } catch { return null; } };
const write = (area, key, v) => { try { window[area].setItem(key, v); } catch { /* sin almacenamiento: solo esta visita */ } };
const readSet = (key) => { try { return new Set(JSON.parse(read('sessionStorage', key) || '[]')); } catch { return new Set(); } };
const saveSet = (key, set) => write('sessionStorage', key, JSON.stringify([...set]));

export function GuideProvider({ children }) {
  const [bubble, setBubble] = useState(null); // { text, action }
  const [heroVisible, setHeroVisible] = useState(true);
  const [contactVisible, setContactVisible] = useState(false);
  const [muted, setMuted] = useState(() => read('localStorage', 'mascota-muda') === '1');
  const lookRef = useRef({ dx: 0, dy: 0, until: 0 });
  const cmdRef = useRef(null); // orden para la mascota: { type, n, t }
  const sectionRef = useRef(null); // sección que tienes delante (franja central): la pequeña cambia de pose según ella
  const ptrMini = useRef({ x: 0, y: 0, mx: -1e4, my: -1e4 });
  const heroShown = heroVisible;
  const R = useRef({
    lastSay: -1e9, seen: readSet('mascota-vistas'), skillsSeen: readSet('mascota-skills'), current: null, muted, hero: true,
    timer: 0, retry: 0, jokes: {}, runs: -1, cmdN: 0, tiltNext: 0, tiltOffers: 0, exploded: false, laptop: null,
  });
  R.current.muted = muted;
  R.current.hero = heroShown;

  const hide = useCallback(() => { window.clearTimeout(R.current.timer); R.current.bubbleSection = null; setBubble(null); }, []);
  const arm = useCallback((ms) => {
    window.clearTimeout(R.current.timer);
    R.current.timer = window.setTimeout(() => { R.current.bubbleSection = null; setBubble(null); }, ms);
  }, []);

  // force: lo pide el usuario (un clic); si no, respeta que esté callada y el tiempo entre mensajes.
  // section: si el mensaje comenta una sección, se cierra al salir de ella (en móvil se llegaba a ver el comentario
  // del portátil encima de Formación, tapando la pista).
  const say = useCallback((text, force = false, action = null, cooldown = COOLDOWN, section = null) => {
    const r = R.current, now = performance.now();
    if (!force && (r.muted || now - r.lastSay < cooldown)) return false;
    r.lastSay = now;
    r.bubbleSection = section;
    setBubble({ text, action });
    // En móvil el globo tapa más contenido: dura algo menos
    const narrow = window.innerWidth < DESKTOP;
    arm(action ? 12000 : narrow ? Math.max(3500, text.length * 55) : Math.max(4200, text.length * 70));
    return true;
  }, [arm]);

  const glance = useCallback((dx, dy, ms = 2200) => { lookRef.current = { dx, dy, until: performance.now() + ms }; }, []);
  const command = useCallback((type) => { R.current.cmdN += 1; cmdRef.current = { type, n: R.current.cmdN, t: performance.now() }; }, []);

  // Lo que hace la mascota por su cuenta (saludo) o por un clic (susto o risa)
  const onAct = useCallback((type) => {
    if (type === 'wave') { say(fill(mascotLines.saludo)); return; }
    const list = mascotLines.clic[type];
    if (!list) return;
    const j = R.current.jokes;
    j[type] = ((j[type] ?? Math.floor(Math.random() * list.length)) + 1) % list.length; // en orden, sin repetir seguida
    say(list[j[type]], true);
  }, [say]);

  const toggleMute = useCallback(() => {
    const next = !R.current.muted;
    R.current.muted = next;
    setMuted(next);
    write('localStorage', 'mascota-muda', next ? '1' : '0');
    if (next) hide();
  }, [hide]);

  const hold = useCallback((on) => { if (on) window.clearTimeout(R.current.timer); else arm(2500); }, [arm]);

  // ── Compañera del portátil: Laptop3D avisa de lo que pasa y registra cómo enderezarlo ──
  const laptop = useMemo(() => ({
    register: (api) => { R.current.laptop = api; return () => { if (R.current.laptop === api) R.current.laptop = null; }; },

    // Eligió una skill: la mascota mira al portátil y la comenta (una vez por skill y sesión)
    skill: (skill) => {
      const r = R.current;
      glance(LAPTOP_GLANCE[0], LAPTOP_GLANCE[1], 1800);
      const line = mascotLines.skills[skill.id];
      if (!line || r.skillsSeen.has(skill.id)) return;
      if (say(line, false, null, REACT_COOLDOWN)) { r.skillsSeen.add(skill.id); saveSet('mascota-skills', r.skillsSeen); }
    },

    // Encendido (el pico de la página, scroll-craft 25/11/2026): la mascota pulsa el botón A de su pecho y el portátil
    // arranca con el scroll. Una vez por visita a la sección (lo decide Laptop3D).
    press: () => {
      command('press');
      glance(LAPTOP_GLANCE[0], LAPTOP_GLANCE[1], 2400);
      say(mascotLines.encender, false, null, REACT_COOLDOWN);
    },

    // Ejecutó el código: celebra y comenta (en orden)
    run: () => {
      const r = R.current, list = mascotLines.ejecutar;
      glance(LAPTOP_GLANCE[0], LAPTOP_GLANCE[1], 1500);
      r.runs = (r.runs + 1) % list.length;
      if (say(list[r.runs], false, null, REACT_COOLDOWN)) command('cheer');
    },

    // Abrió el despiece (una vez por sesión)
    exploded: () => {
      const r = R.current;
      if (r.exploded) return;
      glance(LAPTOP_GLANCE[0], LAPTOP_GLANCE[1], 1800);
      if (say(mascotLines.despiece, false, null, REACT_COOLDOWN)) r.exploded = true;
    },

    // Lo dejó inclinado un rato: ofrece enderezarlo (perfeccionista). Solo si ella es la que se ve, en Proyectos.
    tilted: () => {
      const r = R.current, now = performance.now();
      if (r.muted || r.hero || r.current !== 'proyectos' || r.tiltOffers >= TILT_MAX_OFFERS || now < r.tiltNext) return;
      const accept = () => {
        r.laptop?.straighten?.();
        command('cheer');
        say(mascotLines.torcido.listo, true);
      };
      if (say(mascotLines.torcido.oferta, false, { label: mascotLines.torcido.boton, onClick: accept })) {
        r.tiltOffers += 1; r.tiltNext = now + TILT_RETRY;
        glance(LAPTOP_GLANCE[0], LAPTOP_GLANCE[1], 2200);
      }
    },
  }), [say, glance, command]);

  // ¿Se ve la portada? Si no, aparece la pequeña en la esquina, sin salto ni entrada animada: solo saluda con la mano
  // (greet). Jhon probó un paseo ligado al scroll y un salto en arco y prefirió esto: "se verá más fluido". No los vuelvas a poner.
  useEffect(() => {
    const el = document.querySelector('.portrait');
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((list) => setHeroVisible(list[list.length - 1].isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ¿Se ve el bloque de contacto? Entonces atiende la mascota de dentro y la pequeña flotante se retira.
  // En cuanto asoma cualquier parte (threshold 0): en móvil el bloque es muy alto (tarjetas apiladas) y con un 25 %
  // la mascota de Contacto ya estaba en pantalla y las dos se solapaban.
  useEffect(() => {
    const el = document.querySelector('.cta__stage');
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((list) => setContactVisible(list[list.length - 1].isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => { if (contactVisible) hide(); }, [contactVisible, hide]);

  // Comenta cada sección una vez por sesión, cuando llega al centro de la pantalla y se queda un momento
  useEffect(() => {
    const announce = (id) => {
      const r = R.current;
      window.clearTimeout(r.retry);
      if (r.current !== id || r.seen.has(id) || r.muted) return;
      const wait = COOLDOWN - (performance.now() - r.lastSay);
      if (wait > 0) { r.retry = window.setTimeout(() => announce(id), wait + 100); return; }
      // En móvil los proyectos van debajo y no hay puntero: texto propio (seccionesMovil), si lo hay
      const narrow = !window.matchMedia(`(min-width: ${DESKTOP}px)`).matches;
      const text = (narrow && mascotLines.seccionesMovil?.[id]) || mascotLines.secciones[id];
      if (!text) return;
      r.seen.add(id);
      saveSet('mascota-vistas', r.seen);
      say(fill(text), false, null, COOLDOWN, id);
      if (GLANCE[id]) glance(GLANCE[id][0], GLANCE[id][1]);
    };
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const id = e.target.id, r = R.current;
        if (!e.isIntersecting) {
          // Salió de la franja central: su comentario ya no viene a cuento
          if (sectionRef.current === id) sectionRef.current = null;
          if (r.current === id) { r.current = null; window.clearTimeout(r.retry); }
          if (r.bubbleSection === id) hide();
          return;
        }
        if (r.bubbleSection && r.bubbleSection !== id) hide();
        R.current.current = id;
        sectionRef.current = id;
        window.clearTimeout(R.current.retry);
        R.current.retry = window.setTimeout(() => announce(id), DWELL);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    els.forEach((el) => io.observe(el));
    return () => { io.disconnect(); window.clearTimeout(R.current.retry); };
  }, [say, glance, hide]);

  // Puntero para la mascota pequeña (la grande usa el de la portada). Solo ratón y escritorio.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP}px) and (prefers-reduced-motion: no-preference)`);
    const move = (ev) => { if (ev.pointerType === 'mouse' && mq.matches) { ptrMini.current.mx = ev.clientX; ptrMini.current.my = ev.clientY; } };
    const leave = () => { ptrMini.current.mx = -1e4; ptrMini.current.my = -1e4; };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('mouseleave', leave); };
  }, []);

  useEffect(() => () => { window.clearTimeout(R.current.timer); window.clearTimeout(R.current.retry); }, []);

  const bubbleProps = useMemo(
    () => (bubble ? { text: bubble.text, action: bubble.action, muted, onClose: hide, onMute: toggleMute, onHold: hold } : null),
    [bubble, muted, hide, toggleMute, hold],
  );
  // contact: lo que necesita la mascota del bloque de contacto (mismo puntero, mirada y órdenes que la pequeña)
  const contact = useMemo(() => ({ ptr: ptrMini, look: lookRef, cmd: cmdRef, glance, command }), [glance, command]);
  // heroVisible (para Portrait): la grande se ve en la portada; mientras pasea, la que se ve es la pequeña
  const value = useMemo(() => ({ lookRef, onAct, heroVisible: heroShown, bubbleProps, laptop, contact }), [onAct, heroShown, bubbleProps, laptop, contact]);
  const showMini = !heroShown && !contactVisible;

  return (
    <GuideCtx.Provider value={value}>
      {children}
      <p className="sr-only" role="status" aria-live="polite">{bubble ? bubble.text : ''}</p>
      {showMini && (
        <div className="mascot-mini">
          {/* 3D (Blender) cuando está lista; CSS mientras carga o sin WebGL */}
          <MascotAuto variant="mini" greet ptr={ptrMini} look={lookRef} cmd={cmdRef} section={sectionRef} onAct={onAct} />
          {bubbleProps && <Bubble where="mini" {...bubbleProps} />}
        </div>
      )}
    </GuideCtx.Provider>
  );
}
