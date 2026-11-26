import { memo } from 'react';
import { SKILLS } from '../../data/skills';
import { hexA, readableOn } from '../../lib/math3d';
import { KB, KEYS, SKILL_KEY_INDEX } from './keyLayout';

/**
 * Teclado: letras normales + teclas de skills (botones reales).
 * Está memorizado: solo se vuelve a dibujar cuando cambia algo del teclado
 * (tecla pulsada, skill elegida, color, encendido, tecla apuntada o la altura en el despiece),
 * no en cada fotograma de giro. Por eso onPick y onHover deben ser funciones estables.
 */
// lit: durante el arranque, fracción del teclado ya iluminada (0 a 1, de izquierda a derecha); null = todo.
function Keyboard({ keysY, pressIdx, skillId, color, power, hoverSkill, interactive, onPick, onHover, lit = null }) {
  // Faldón de la tecla (cara frontal) + sombra + retroiluminación del color de la skill
  const keyShadow = `inset 0 1px 0 rgba(255,255,255,0.07), 0 2.5px 0 #070708, 0 3.5px 3px rgba(0,0,0,0.55)${power ? `, 0 0 5px ${hexA(color, 0.16)}` : ''}`;
  const pressedShadow = 'inset 0 1px 2px rgba(0,0,0,0.5), 0 0.5px 0 #070708, 0 0 8px #FFFFFF';
  const darkShadow = 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2.5px 0 #070708, 0 3.5px 3px rgba(0,0,0,0.55)';

  return (
    <div className="keys-layer" style={{ transform: `translateY(${keysY}px) rotateX(90deg)` }}>
      {KEYS.map((k, i) => {
        const si = SKILL_KEY_INDEX.indexOf(i);
        const box = { left: k.x, top: k.y, width: k.w, height: k.h };
        const dark = lit !== null && (k.x + k.w / 2 - KB.x) / KB.w > lit;
        const pressed = i === pressIdx;
        if (si >= 0) {
          const s = SKILLS[si];
          const sel = s.id === skillId;
          return (
            <button
              key={i}
              type="button"
              className={`key key--skill${sel ? ' is-active' : ''}${hoverSkill === si ? ' is-hover' : ''}${dark ? ' is-dark' : ''}${pressed ? ' is-pressed' : ''}`}
              data-hit="skill"
              aria-label={`Cargar ${s.name} (${s.cat}) en el portátil`}
              aria-pressed={sel}
              tabIndex={interactive ? 0 : -1}
              onClick={() => onPick(si)}
              onPointerEnter={() => onHover(si, true)}
              onPointerLeave={() => onHover(si, false)}
              onFocus={() => onHover(si, true)}
              onBlur={() => onHover(si, false)}
              style={{ ...box, '--c': s.color, '--on': readableOn(s.color) }}
            >
              {s.badge}
            </button>
          );
        }
        return (
          <div
            key={i}
            data-hit="keys"
            data-key={i}
            aria-hidden="true"
            className={`key${k.row === 0 ? ' key--fn' : ''}${k.label.length > 1 ? ' key--word' : ''}${pressed ? ' is-pressed' : ''}`}
            style={{ ...box, boxShadow: pressed ? pressedShadow : dark ? darkShadow : keyShadow }}
          >
            {k.label}
          </div>
        );
      })}
    </div>
  );
}

export default memo(Keyboard);
