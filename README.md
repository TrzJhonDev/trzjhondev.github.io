# Portafolio — Jhon (TrzJhonDev)

Portafolio de un estudiante de Ingeniería de Sistemas, hecho con **Astro** (páginas en HTML estático) y **React** solo donde hace falta interacción. Lo presenta una **mascota robot** modelada en **Blender** y dibujada con **Three.js**. Los proyectos son los protagonistas: cada uno tiene su propia página.

- **Paleta "Cielo sereno":** azul cielo solo en lo que se pulsa y en los enlaces; el resto, neutros. Modo oscuro (casi negro azulado) y claro (blanco cálido), con un fundido al cambiar. Detalles en `PLAN-COLORES.md`.
- **Tipografía:** IBM Plex (Sans Condensed en los títulos, Sans en el texto y Mono en los detalles de consola).
- **Scroll suave:** inercia con Lenis (ratón y touchpad), una vitrina de proyectos que cambia mientras bajas (GSAP + ScrollTrigger), apariciones con CSS y transiciones entre la portada y cada proyecto (View Transitions).
- **Accesible y ligera:** contraste AA, todo con teclado, respeta "reducir movimiento"; la portada carga unos 56 KB antes de la mascota.
- **Sin sonido** y sin usar micrófono ni cámara.

> El plan de la reescritura y su estado están en `PLAN-REESCRITURA.md`. Las reglas técnicas, en `CLAUDE.md`.

## Cómo arrancarlo

Necesitas [Node.js](https://nodejs.org) 22.23 o superior.

```bash
npm install            # dependencias (solo la primera vez)
npm run dev            # http://localhost:5173 con recarga en vivo
npm run dev -- --host  # lo mismo, visible desde tu móvil en el mismo Wi‑Fi (abre la dirección "Network")
npm run build          # versión final en /dist (debe pasar sin errores)
npm run preview        # sirve /dist para probar la versión final
```

## Las páginas

1. **Portada (`/`).**
   - **Inicio:** "> sesión iniciada · Sistema listo. Usuario: Jhon.", tu presentación y la mascota, que empieza dormida, despierta y saluda. Sigue el puntero y con un clic se asusta o se ríe.
   - **Proyectos:** en escritorio, una ventana de navegador fija con la captura que cambia mientras bajas (contador 01/03 y barra de progreso); en móvil, cada proyecto con su captura. Cada uno abre su caso de estudio.
   - **Habilidades:** por áreas; cada una dice en cuántos de tus proyectos aparece.
   - **Formación:** línea de tiempo que se dibuja con el scroll; al final, "Prácticas pre‑profesionales".
   - **Contacto:** copiar el correo, un formulario que abre tu programa de correo y tus enlaces.
   - **La mascota pequeña** aparece en la esquina al salir de la portada y cambia de pose según la sección.
2. **Caso de estudio (`/proyectos/<nombre>/`):** contexto, problema, qué hiciste, decisiones, resultado y aprendizajes, con índice lateral, barra de lectura y anterior/siguiente.
3. **Laboratorio (`/lab/`):** el portátil 3D (girar, tapa, teclas de skills, terminal, despiece y rompecabezas, cargador), la consola de la mascota con 3 juegos (Serpiente, Salto, Ladrillos) y el switch de puertos con cable.

## Personalizar

| Qué | Dónde |
|---|---|
| Tus datos (nombre, apellido, correo, redes, CV, formación) | `src/data/profile.js` (completa lo que está entre `[CORCHETES]`; lo pendiente se ve como "pendiente") |
| **Proyectos** | Un archivo por proyecto en `src/content/proyectos/` (`proyecto-1.md`…). Arriba: título, resumen, rol, año, tecnologías, captura y enlaces; abajo, el texto del caso de estudio. El nombre del archivo es su dirección. |
| Capturas | `public/proyectos/` (mejor en 16:10) e `image: "/proyectos/mi-app.png"` en el archivo del proyecto |
| CV | El PDF en `public/` y `cvUrl: '/cv.pdf'` en `profile.js` |
| Habilidades | `src/data/skills.js` |
| Frases de la mascota y datos de su consola | `src/data/mascot.js` y `src/data/tips.js` |
| Colores | Tokens en `src/styles/global.css`; mascota en `Mascot/Mascot.css` (`--m-*`) y `THEMES` de `Mascot3D/engine.js` |

## Imágenes que se generan

Con `npm run dev` en marcha:

- **Tarjeta para compartir** (`public/og.jpg`): `node tools/og.mjs`. Vuelve a lanzarlo si cambian los textos de la portada o la mascota.
- **Mascota dormida** (`public/img/mascota-dormida-*.webp`): `node scrollcraft/builds/portafolio/lab/poster.mjs`.
- **Cabeza de la mascota** (`public/img/mascota-cabeza-*.webp`): `node scrollcraft/builds/portafolio/lab/cabeza.mjs`.
- **Iconos del sitio**: `node tools/iconos.mjs`.

Usan la página de herramientas `/posar/`, que pinta la mascota sola con fondo transparente.

## Modelos 3D (Blender)

- Fuentes en `blender/` (Blender 5.2; 1 unidad = 1 cm): `mascota.blend`, `portatil.blend` y `servidor.blend` (este último se usa como imagen renderizada).
- Se exportan a `public/models/*.glb` con compresión meshopt. Las URL llevan la huella del archivo, así que un modelo reexportado nunca se sirve viejo.

## Dónde está cada cosa

```
src/
├── pages/          index.astro (portada) · proyectos/[id].astro · lab/ · posar.astro (herramientas)
├── layouts/        Base.astro (cabeza, barra y pie)
├── astro/          Nav · Footer · Showcase (vitrina de proyectos)
├── content/        proyectos/*.md (y el esquema en content.config.js)
├── components/     HeroMascot · MiniMascot · LabApp · Mascot3D (motor 3D) · Mascot (consola y guía) · Laptop3D · Contact (switch)
├── data/           profile.js · skills.js · mascot.js · tips.js
├── lib/            smoothScroll · boot (descarga del modelo) · links · contactStage · math3d
└── styles/         global.css (tokens y base) · lab.css (estilos de /lab)
public/             modelos, imágenes, og.jpg e iconos
blender/            modelos fuente
legacy/             entrada de la web anterior (Vite), solo como referencia
```

## Publicar

Se publica en **https://trzjhondev.github.io/** con GitHub Pages: cada `git push` a `main` compila y publica solo (`.github/workflows/deploy.yml`, Node 24).

- Si cambias de dominio, cambia `site` en `astro.config.mjs`.
- No subas `tools/fuente/` (fotos personales), los vídeos ni `.claude/skills/`: ya están en `.gitignore`.
