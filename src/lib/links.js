// Ayudas para enlaces que todavía pueden ser marcadores ('#', '[TU CORREO]', ...).

/** true si la URL ya es un dato real y no un marcador por completar. */
export const isReal = (url) => typeof url === 'string' && url.trim() !== '' && url !== '#' && !url.includes('[');

const pending = { 'aria-disabled': 'true', title: 'Pendiente de completar en src/data/profile.js' };

/** Props para un enlace externo: abre en otra pestaña solo si la URL es real. */
export const externalLink = (url) => (isReal(url) ? { href: url, target: '_blank', rel: 'noreferrer' } : pending);

/** Props para un enlace interno o de descarga (sin pestaña nueva). */
export const localLink = (url) => (isReal(url) ? { href: url } : pending);

/** Props para un enlace mailto. */
export const mailLink = (email) => (isReal(email) && email.includes('@') ? { href: `mailto:${email}` } : pending);
