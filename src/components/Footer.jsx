import { profile } from '../data/profile';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {new Date().getFullYear()} {profile.name} {profile.lastName}</span>
        <span className="mono">compilado con React, Three.js y Blender · exit 0</span>
      </div>
    </footer>
  );
}
