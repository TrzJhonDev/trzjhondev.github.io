import { useCallback, useEffect, useRef, useState } from 'react';
import { profile, projects, education } from '../../data/profile';
import { CATEGORIES, SKILLS } from '../../data/skills';
import { isReal } from '../../lib/links';
import { applyTheme, currentTheme } from '../../lib/useTheme';

const MAX_LINES = 60;
const C = { cmd: '#E6E8EC', ok: '#8FD8FF', dim: '#8B93A1', err: '#FF6B6B', title: '#8FD8FF', blue: '#5B8DEF', text: '#E6E8EC' };
const line = (text, color = C.text) => ({ text, color });
/** Una línea con varios trozos de distinto color: multi(['texto', color], ['otro']) */
const multi = (...parts) => ({ parts: parts.map(([text, color = C.text]) => ({ text, color })) });
const pending = (v) => (isReal(v) ? v : 'pendiente de completar');
const themeName = (t) => (t === 'dark' ? 'oscuro' : 'claro');

/** Usuario del prompt: el nombre en minúsculas, sin espacios ni tildes. */
export const promptUser = () => `${profile.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')}@portafolio`;

// Lo que muestra "ayuda" (cabe en la pantalla: 14 líneas)
const HELP = [
  ['sobre-mi', 'quién soy'],
  ['neofetch', 'mi ficha, estilo sistema'],
  ['skills', 'mis skills por categoría'],
  ['proyectos', 'lo que he construido'],
  ['formacion', 'estudios y certificados'],
  ['contacto', 'cómo escribirme'],
  ['abrir <skill>', 'carga una skill (abrir react)'],
  ['ir <destino>', 'github, linkedin, correo…'],
  ['tema', 'cambia el tema (claro / oscuro)'],
  ['ejecutar', 'corre el código cargado'],
];
// Para autocompletar con Tab (y sugerir si te equivocas al escribir)
const NAMES = ['ayuda', 'sobre-mi', 'neofetch', 'skills', 'proyectos', 'formacion', 'contacto', 'abrir', 'ir', 'tema', 'ejecutar', 'cv', 'ls', 'fecha', 'limpiar', 'salir'];
const WITH_ARG = ['abrir', 'ir', 'tema'];
const SECTIONS = { inicio: 'inicio', proyectos: 'proyectos', formacion: 'formacion', 'formación': 'formacion', contacto: 'contacto' };

/** Distancia de edición entre dos palabras (para "¿Quisiste decir…?"). */
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}
const closest = (w) => NAMES.map((n) => [n, distance(w, n)]).sort((x, y) => x[1] - y[1]).find(([, dist]) => dist <= 2)?.[0];

const uptime = () => { const s = Math.round(performance.now() / 1000); return s < 90 ? `${s} s` : `${Math.round(s / 60)} min`; };

/** Ficha estilo neofetch: logo a la izquierda y datos a la derecha (todo sale de profile.js y skills.js). */
function neofetch() {
  const logo = [
    '  ┌────────┐  ',
    '  │ J_     │  ',
    '  │  ▌     │  ',
    '  │        │  ',
    '  └────────┘  ',
    '  ╱────────╲  ',
  ];
  const blank = ' '.repeat(14);
  const title = promptUser();
  const info = [
    [[title, C.ok]],
    [['─'.repeat(title.length), C.dim]],
    [['Rol: ', C.title], [profile.role]],
    [['Universidad: ', C.title], [profile.university]],
    [['Ciudad: ', C.title], [profile.city]],
    [['Skills: ', C.title], [`${SKILLS.length} en ${CATEGORIES.length} categorías`]],
    [['Proyectos: ', C.title], [String(projects.length)]],
    [['Tema: ', C.title], [themeName(currentTheme())]],
    [['Activo: ', C.title], [uptime()]],
    [['Estado: ', C.title], [profile.available ? 'disponible para prácticas' : 'no disponible', profile.available ? C.ok : C.dim]],
  ];
  return info.map((parts, i) => multi([logo[i] ?? blank, C.ok], ...parts));
}

const MATRIX = '0123456789ABCDEF@#$%&*+=<>';

/**
 * Terminal del portátil. Se escribe en un <input> real (oculto) para que funcione con el teclado
 * físico, con el teclado del móvil y con lectores de pantalla.
 *  - getSkill(): skill cargada; onPickSkill(skill); onRun(): ejecuta el código en el portátil.
 * Comandos con gracia: neofetch, ir <destino>, cv, tema, ls… y algunos secretos (prueba "sudo").
 */
export function useTerminal({ getSkill, onPickSkill, onRun }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState(() => [
    line(`${profile.brand} · terminal v1.0`, C.title),
    line(`Último acceso: ${new Date().toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}`, C.dim),
    line('Escribe "ayuda" y pulsa Intro · Tab autocompleta', C.dim),
  ]);
  const [input, setInput] = useState('');
  const history = useRef([]);
  const hIdx = useRef(-1);
  const inputRef = useRef(null);
  const matrixTimer = useRef(null);

  const print = useCallback((...ls) => setLines((prev) => [...prev, ...ls].slice(-MAX_LINES)), []);
  const stopMatrix = useCallback(() => { clearInterval(matrixTimer.current); matrixTimer.current = null; }, []);
  useEffect(() => stopMatrix, [stopMatrix]);

  /** Abre la terminal y enfoca el campo (debe llamarse dentro del clic, para que el móvil abra su teclado). */
  const openTerminal = useCallback(() => {
    setOpen(true);
    inputRef.current?.focus({ preventScroll: true });
  }, []);
  const close = useCallback(() => { stopMatrix(); setOpen(false); inputRef.current?.blur(); }, [stopMatrix]);

  const run = useCallback((raw) => {
    const cmd = raw.trim();
    print(line(`${promptUser()}:~$ ${cmd}`, C.cmd));
    if (!cmd) return;
    history.current = [cmd, ...history.current].slice(0, 30);
    hIdx.current = -1;
    const [name, ...args] = cmd.toLowerCase().split(/\s+/);
    const arg = args.join(' ');

    switch (name) {
      case 'ayuda': case 'help':
        print(
          line('Comandos:', C.title),
          ...HELP.map(([c, d]) => multi([`  ${c.padEnd(15)}`, C.ok], [d, C.dim])),
          line('También: cv · ls · fecha · limpiar · salir', C.dim),
          line('Hay comandos secretos… prueba "sudo".', C.dim),
        );
        break;
      case 'sobre-mi': case 'sobremi': case 'whoami':
        print(
          line(`${profile.name} ${profile.lastName}`, C.title),
          line(`${profile.role} · ${profile.university} · ${profile.city}`),
          line(profile.bio, C.dim),
        );
        break;
      case 'neofetch': case 'ficha':
        print(...neofetch());
        break;
      case 'skills':
        CATEGORIES.forEach((cat) => print(multi([`${cat}: `, C.title], [SKILLS.filter((s) => s.cat === cat).map((s) => s.name).join(', ')])));
        break;
      case 'proyectos':
        projects.forEach((p) => print(line(`• ${p.title}`, C.title), line(`  ${p.tags.join(' · ')}`, C.dim)));
        break;
      case 'formacion': case 'formación':
        education.forEach((e) => print(line(`• ${e.title}: ${e.place} (${e.date})`)));
        break;
      case 'contacto':
        print(
          line(`correo:   ${isReal(profile.email) && profile.email.includes('@') ? profile.email : 'pendiente de completar'}`),
          line(`github:   ${pending(profile.github)}`),
          line(`linkedin: ${pending(profile.linkedin)}`),
          line(`tiktok:   ${pending(profile.tiktok)}`),
          line(`instagram: ${pending(profile.instagram)}`),
          line(`youtube:  ${pending(profile.youtube)}`),
        );
        break;
      case 'abrir': case 'open': {
        const s = SKILLS.find((k) => k.id === arg || k.name.toLowerCase() === arg || k.name.toLowerCase().startsWith(arg));
        if (!arg) print(line('Uso: abrir <skill>  (p. ej. abrir react)', C.dim));
        else if (s) { onPickSkill(s); print(line(`Cargando ${s.name}…`, C.ok)); }
        else print(line(`No encuentro la skill "${arg}". Escribe "skills" para ver la lista.`, C.err));
        break;
      }
      case 'ir': case 'go': {
        const links = { github: profile.github, linkedin: profile.linkedin, tiktok: profile.tiktok, instagram: profile.instagram, youtube: profile.youtube, correo: isReal(profile.email) && profile.email.includes('@') ? `mailto:${profile.email}` : null };
        if (!arg) print(line('Uso: ir <destino>  (github, linkedin, tiktok, instagram, youtube, correo, proyectos…)', C.dim));
        else if (SECTIONS[arg]) {
          print(line(`Yendo a ${arg}…`, C.ok));
          close();
          window.setTimeout(() => document.getElementById(SECTIONS[arg])?.scrollIntoView({ behavior: 'smooth' }), 60);
        } else if (arg in links) {
          if (isReal(links[arg])) { window.open(links[arg], arg === 'correo' ? '_self' : '_blank', 'noopener'); print(line(`Abriendo ${arg}…`, C.ok)); }
          else print(line(`${arg}: pendiente de completar`, C.dim));
        } else print(line(`No conozco "${arg}". Prueba: github, linkedin, correo, proyectos, contacto.`, C.err));
        break;
      }
      case 'cv':
        if (isReal(profile.cvUrl)) { window.open(profile.cvUrl, '_blank', 'noopener'); print(line('Abriendo el CV…', C.ok)); }
        else print(line('El CV está pendiente de completar.', C.dim));
        break;
      case 'tema': case 'theme': {
        const cur = currentTheme();
        const want = /claro|light/.test(arg) ? 'light' : /oscuro|dark/.test(arg) ? 'dark' : cur === 'dark' ? 'light' : 'dark';
        if (want === cur) print(line(`Ya estás en modo ${themeName(cur)}.`, C.dim));
        else { applyTheme(want); print(line(`Tema: ${themeName(want)}`, C.ok)); }
        break;
      }
      case 'ejecutar': case 'run': {
        const s = getSkill();
        onRun();
        print(...s.out.map((o) => line(o, C.ok)));
        break;
      }
      case 'ls':
        print(multi(['proyectos/', C.blue], ['   '], ['formacion/', C.blue], ['   '], ['contacto.txt'], ['   '], ['skills.json'], ['   '], ['cv.pdf']));
        break;
      case 'pwd':
        print(line('/home/visitante/portafolio'));
        break;
      case 'cd':
        print(line('Este portátil es de solo lectura. Usa "ir <destino>" para moverte.', C.dim));
        break;
      case 'echo':
        print(line(raw.trim().slice(4).trim() || ' '));
        break;
      case 'hola': case 'hello': case 'hi':
        print(line(`¡Hola! Soy ${profile.name}. Escribe "ayuda" para ver qué puedo hacer.`, C.ok));
        break;
      case 'fecha': case 'date':
        print(line(new Date().toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'short' })));
        break;
      case 'sudo':
        print(line('[sudo] contraseña para visitante: ••••••', C.dim));
        if (/\brm\b/.test(arg)) print(line('Buen intento. Este portátil es de solo lectura.', C.err));
        else if (/contratar|hire|jhon/.test(arg)) {
          print(
            line('Permiso concedido.', C.ok),
            line(profile.available ? `${profile.name} está disponible para prácticas. Escribe "contacto".` : `${profile.name} no está disponible ahora mismo.`, C.title),
          );
        } else if (!arg) print(line('Uso: sudo <comando>  (prueba: sudo contratar jhon)', C.dim));
        else print(line('visitante no figura en sudoers. Este incidente será reportado. (es broma)', C.dim));
        break;
      case 'matrix': {
        stopMatrix();
        let n = 0;
        matrixTimer.current = window.setInterval(() => {
          n += 1;
          let s = '';
          for (let i = 0; i < 56; i += 1) s += Math.random() < 0.45 ? ' ' : MATRIX[Math.floor(Math.random() * MATRIX.length)];
          print(line(s, n % 3 ? '#2AB4F4' : '#BFE9FF'));
          if (n >= 16) { stopMatrix(); print(line('Despierta, visitante… escribe "limpiar".', C.dim)); }
        }, 90);
        break;
      }
      case 'limpiar': case 'clear': case 'cls':
        stopMatrix();
        setLines([]);
        break;
      case 'salir': case 'exit':
        close();
        break;
      default: {
        const near = closest(name);
        print(line(`Comando no encontrado: ${name}.${near ? ` ¿Quisiste decir "${near}"?` : ' Escribe "ayuda".'}`, C.err));
      }
    }
  }, [print, close, stopMatrix, getSkill, onPickSkill, onRun]);

  /** Teclas especiales del campo: Intro, Esc, historial (flechas) y autocompletar (Tab). */
  const onKeyDown = useCallback((ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); run(ev.currentTarget.value); setInput(''); }
    else if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    else if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      const h = history.current;
      hIdx.current = Math.max(-1, Math.min(h.length - 1, hIdx.current + (ev.key === 'ArrowUp' ? 1 : -1)));
      setInput(hIdx.current >= 0 ? h[hIdx.current] : '');
    } else if (ev.key === 'Tab') {
      ev.preventDefault();
      const v = ev.currentTarget.value.toLowerCase();
      const match = NAMES.filter((n) => n.startsWith(v));
      if (v && match.length === 1) setInput(match[0] + (WITH_ARG.includes(match[0]) ? ' ' : ''));
      else if (v && match.length > 1) print(line(match.join('   '), C.dim));
    }
  }, [run, close, print]);

  return { open, lines, input, setInput, inputRef, openTerminal, close, onKeyDown };
}
