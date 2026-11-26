import { profile } from '../../data/profile';
import { promptUser } from './useTerminal';
import { highlight, langOf, sliceTokens } from './highlight';
import { isReal } from '../../lib/links';

// Contenido de la pantalla: un editor de código que se escribe solo + su salida.
// También muestra la BIOS (arranque), la terminal interactiva y el cursor del touchpad.
// flash (0→1): destello del color de la skill cuando el holograma llega a la pantalla.
// (El brillo del vidrio lo dibuja la tapa, según la luz.)

/** Indicador de batería de la barra superior: nivel, % y rayo cuando está cargando. */
function Battery({ level, charging }) {
  const pct = Math.round(level);
  const color = charging ? '#8FD8FF' : pct <= 15 ? '#FF6B6B' : '#E6E8EC';
  return (
    <div className="screen__battery" style={{ color }}>
      {charging && (
        <svg width="7" height="9" viewBox="0 0 7 9" aria-hidden="true"><path d="M4 0 0 5h3l-1 4 5-5.5H4z" fill="currentColor" /></svg>
      )}
      <span>{pct}%</span>
      <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true">
        <rect x="0.5" y="0.5" width="13" height="7" rx="1.5" fill="none" stroke="currentColor" />
        <rect x="14" y="2.5" width="1.5" height="3" rx="0.5" fill="currentColor" />
        <rect x="2" y="2" width={(10 * pct) / 100} height="4" rx="0.5" fill="currentColor" />
      </svg>
    </div>
  );
}

// Pantalla de arranque tipo BIOS (durante la animación de entrada). k: fotogramas desde que empezó.
const BIOS_LINES = [
  [0, (b) => `${b} BIOS v1.0`, '#8FD8FF'],
  [5, () => 'Procesador ................ OK', '#E6E6EA'],
  [9, () => 'Memoria ................... OK', '#E6E6EA'],
  [13, () => 'Almacenamiento ............ OK', '#E6E6EA'],
  [17, () => 'Teclado ................... OK', '#E6E6EA'],
];
function Bios({ k, total }) {
  const p = Math.max(0, Math.min(1, (k - 22) / (total - 26)));
  return (
    <div className="screen__bios">
      {BIOS_LINES.filter(([at]) => k >= at).map(([, text, color], i) => <span key={i} style={{ color }}>{text(profile.brand)}</span>)}
      {k >= 22 && (
        <>
          <span>Cargando portafolio de {profile.name}…</span>
          <span className="screen__bios-bar"><i style={{ width: `${Math.round(p * 100)}%` }} /></span>
        </>
      )}
    </div>
  );
}

/** Terminal: últimas líneas + línea de entrada con el cursor. */
function Terminal({ lines, input, blink }) {
  return (
    <div className="screen__shell">
      {lines.slice(-14).map((l, i) => (
        <span key={i} style={{ color: l.color }}>
          {/* una línea puede traer varios trozos de distinto color (p. ej. neofetch: logo + datos) */}
          {l.parts ? l.parts.map((p, k) => <span key={k} style={{ color: p.color }}>{p.text}</span>) : l.text || ' '}
        </span>
      ))}
      <span style={{ color: '#E6E6EA' }}>
        <span style={{ color: '#8FD8FF' }}>{promptUser()}:~$ </span>{input}<span className="shell-caret" style={{ opacity: blink ? 1 : 0 }}>▌</span>
      </span>
    </div>
  );
}

/**
 * Programa abierto desde la lista de Proyectos: captura (o hueco por completar), nombre, descripción, stack y enlaces.
 * Solo se ve; los enlaces de verdad están en la lista (la pantalla 3D no se puede pulsar: un clic abre la terminal).
 */
function Program({ p }) {
  const link = (url) => (isReal(url) ? 'disponible' : 'pendiente');
  return (
    <div className="screen__prog">
      <span className="screen__prog-cmd"><span style={{ color: '#8FD8FF' }}>$</span> abrir {p.file}</span>
      <div className="screen__prog-main">
        {p.image
          ? <img className="screen__prog-shot" src={p.image} alt="" />
          : <div className="screen__prog-shot is-empty">[CAPTURA]</div>}
        <div className="screen__prog-text">
          <b>{p.title}</b>
          <span>{p.description}</span>
        </div>
      </div>
      <span className="screen__prog-row"><i>stack</i>{p.tags.join(' · ')}</span>
      <span className="screen__prog-row"><i>código</i>{link(p.code)}<i className="gap">demo</i>{link(p.demo)}</span>
    </div>
  );
}

/** Cursor del touchpad (flecha). */
function Cursor({ u, v }) {
  return (
    <svg className="screen__cursor" style={{ left: `${u * 100}%`, top: `${v * 100}%` }} width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
      <path d="M0 0v11l3-3 2 5 2-1-2-5h4z" fill="#FFFFFF" stroke="#0A0A0B" strokeWidth="0.8" />
    </svg>
  );
}

export default function Screen({ skill, typed, running, runT, t, on, flash = 0, battery = 100, charging = false, temp = 0.2, bios = null, terminal = null, project = null, cursor = null }) {
  // Prioridad de lo que se ve: arranque > terminal > programa abierto > editor de la skill
  const prog = !bios && !terminal ? project : null;
  const totalLen = skill.code.join('\n').length;
  const done = typed >= totalLen;
  const blink = Math.floor(t / 15) % 2 === 0;

  // Colorear cada línea según el lenguaje de la skill y cortarla según cuántos caracteres se han "tecleado"
  const lang = langOf(skill);
  const lines = [];
  let rem = typed;
  skill.code.forEach((full, i) => {
    if (rem < 0) return;
    const typingHere = !done && rem <= full.length;
    lines.push({ n: i + 1, parts: sliceTokens(highlight(full, lang), Math.max(0, rem)), typing: typingHere });
    rem -= full.length + 1;
  });

  const outCount = running ? Math.min(skill.out.length, Math.floor(runT / 10)) : 0;
  const runDone = running && outCount >= skill.out.length;

  return (
    <div className={`screen${on ? '' : ' is-off'}`}>
      <div className="screen__bar">
        <div className="dots"><i style={{ background: '#8C8C92' }} /><i style={{ background: '#BDBBC6' }} /><i style={{ background: '#2AB4F4' }} /></div>
        <div className="screen__tab" style={{ borderTopColor: terminal || prog ? '#8FD8FF' : skill.color }}>{bios ? 'arranque' : terminal ? 'terminal' : prog ? prog.file : skill.file}</div>
        {running && !prog && (
          <div className="screen__status" style={{ color: runDone ? '#8FD8FF' : '#BCC2CC' }}>
            {runDone ? '✓ listo' : 'ejecutando…'}
          </div>
        )}
        <span className={`screen__temp${temp > 0.85 ? ' is-max' : temp > 0.55 ? ' is-hot' : ''}`}>CPU {Math.round(36 + 42 * temp)}°C</span>
        <Battery level={battery} charging={charging} />
      </div>

      {bios ? <Bios k={bios.k} total={bios.total} /> : terminal ? <Terminal lines={terminal.lines} input={terminal.input} blink={blink} /> : prog ? <Program key={prog.file} p={prog} /> : (
      <div className="screen__code">
        {lines.map((ln) => (
          <div key={ln.n} className="code-line">
            <span className="code-line__n">{ln.n}</span>
            <span>
              {ln.parts.map((p, k) => <span key={k} className={`tk tk--${p.cls}`}>{p.text}</span>)}
              {ln.parts.length === 0 && ' '}
              {ln.typing && <span className="tk tk--caret">▌</span>}
            </span>
          </div>
        ))}
        <div className="code-line">
          <span className="code-line__n">{lines.length + 1}</span>
          <span className="caret" style={{ background: done && blink ? skill.color : 'transparent' }} />
        </div>
      </div>
      )}

      {running && !bios && !terminal && !prog && (
        <div className="screen__term">
          <span className="screen__term-label">TERMINAL</span>
          {skill.out.slice(0, outCount).map((o, i) => <span key={i}>{o}</span>)}
        </div>
      )}

      <div className="screen__foot" style={{ background: prog ? '#8FD8FF' : skill.color }}>
        <span>{promptUser()}</span>
        <span>{terminal ? 'Esc para salir · ayuda' : prog ? 'programa · enlaces en la lista' : `${skill.cat} · ${skill.name}`}</span>
      </div>

      {cursor && <Cursor u={cursor.u} v={cursor.v} />}
      {flash > 0 && (
        <div className="screen__flash" style={{ opacity: flash, background: `radial-gradient(circle at 50% 50%, ${skill.color}, transparent 75%)` }} />
      )}
    </div>
  );
}

export function isRunning(running, runT, skill) {
  return running && Math.floor(runT / 10) < skill.out.length;
}
