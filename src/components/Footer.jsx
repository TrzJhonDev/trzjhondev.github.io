import { profile } from '../data/profile';

/**
 * Pie de la página como barra de estado del escenario de "Abrir conexión" (Jhon, 26/11/2026: "se ve demasiado vacío";
 * eligió subir el pie al suelo del escenario, debajo de la mascota y del servidor). Lo pinta Contact.jsx al final de
 * su bloque, así la página termina en la escena y no en un pie suelto con un hueco encima.
 * "> sesión cerrada" cierra el "> sesión iniciada" de la portada.
 */
export default function Footer() {
  return (
    <footer className="cta__foot">
      <span>© {new Date().getFullYear()} {profile.name} {profile.lastName}</span>
      <span className="cta__foot-build">compilado con React, Three.js y Blender</span>
      <span className="cta__foot-exit">&gt; sesión cerrada · exit 0</span>
    </footer>
  );
}
