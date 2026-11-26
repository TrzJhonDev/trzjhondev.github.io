/**
 * Brillo especular sobre una cara (resultado de `sheen()` en math3d).
 * strength: cuánto brilla como máximo (0–1).
 */
export default function Sheen({ s, strength = 0.5, className = '' }) {
  return (
    <div
      className={`sheen ${className}`}
      style={{ opacity: s.o * strength, '--sx': `${s.x.toFixed(1)}%`, '--sy': `${s.y.toFixed(1)}%` }}
    />
  );
}
