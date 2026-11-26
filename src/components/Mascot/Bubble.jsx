/**
 * Globo de la mascota: texto corto, un botón de acción opcional (p. ej. "Enderezar"), "Callar" (o "Dejar que hable"
 * si ya está callada) y cerrar. Se pausa mientras tiene el puntero o el foco encima, para poder leerlo.
 * El texto accesible va en una zona `aria-live` aparte (en Guide.jsx), así que aquí el texto se oculta a los
 * lectores de pantalla para no repetirlo.
 */
export function Bubble({ where, text, action, muted, onClose, onMute, onHold }) {
  return (
    <div
      className={`mbubble mbubble--${where}`}
      onMouseEnter={() => onHold(true)}
      onMouseLeave={() => onHold(false)}
      onFocus={() => onHold(true)}
      onBlur={() => onHold(false)}
    >
      <p className="mbubble__text" aria-hidden="true">{text}</p>
      <div className="mbubble__actions">
        {action && <button type="button" className="mbubble__act" onClick={action.onClick}>{action.label}</button>}
        <button type="button" onClick={onMute}>{muted ? 'Dejar que hable' : 'Callar'}</button>
        <button type="button" aria-label="Cerrar mensaje" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
