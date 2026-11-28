// Versión de cada modelo 3D = huella de su contenido (solo en el build, con Node). La lee Base.astro para escribir
// <meta name="model-versions">, y modelUrl() de lib/boot.js la añade a la URL: un .glb reexportado nunca se sirve viejo.
import { createHash } from 'node:crypto';
import fs from 'node:fs';

export const modelVersion = (name) => {
  try { return createHash('md5').update(fs.readFileSync(`public/models/${name}.glb`)).digest('hex').slice(0, 8); } catch { return '0'; }
};
