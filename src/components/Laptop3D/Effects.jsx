// Partículas de código que miran a la cámara. Se animan con CSS (no con React),
// así no cuestan nada en cada fotograma.

const GLYPH_COUNT = 16;

// Aleatoriedad determinista (los mismos valores en cada render)
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** Palabras del código de la skill (de 3 a 12 caracteres) para lanzarlas como partículas. */
function tokens(skill) {
  const words = skill.code.join(' ').split(/\s+/).filter((w) => w.length >= 3 && w.length <= 12 && /[a-zA-Z]/.test(w));
  return words.length ? words : ['{ }', '</>', '01'];
}

/**
 * Partículas de código: suben desde la pantalla durante unos 3 s después de ejecutar.
 * runs sirve de key: cada ejecución reinicia la animación. transform: centro de la pantalla + giro de cámara.
 */
export function CodeGlyphs({ skill, runs, transform }) {
  const words = tokens(skill);
  return (
    <div className="anchor" aria-hidden="true" style={{ transform, pointerEvents: 'none' }}>
      <div key={runs} className="glyphs">
        {Array.from({ length: GLYPH_COUNT }, (_, i) => (
          <span
            key={i}
            className="glyph"
            style={{
              left: `${((rnd(i, 2) - 0.5) * 300).toFixed(0)}px`,
              animationDelay: `${(rnd(i, 3) * 1.1).toFixed(2)}s`,
              animationDuration: `${(1.5 + rnd(i, 4) * 1).toFixed(2)}s`,
              color: i % 3 === 0 ? '#FFFFFF' : skill.color,
              fontSize: `${(10 + rnd(i, 5) * 5).toFixed(0)}px`,
            }}
          >
            {words[Math.floor(rnd(i, 6) * words.length)]}
          </span>
        ))}
      </div>
    </div>
  );
}
