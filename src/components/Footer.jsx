import { profile } from '../data/profile';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {new Date().getFullYear()} {profile.name} {profile.lastName}</span>
        <span className="mono">hecho con React, CSS 3D y café</span>
      </div>
    </footer>
  );
}
