# Plan de la reescritura (Astro)

Decidido por Jhon el 27/11/2026, tras el análisis "Rumbo del portafolio" (https://claude.ai/artifact/RLV5cW8tCsE2M33KMvzW7X).
Rama de trabajo: `reescritura-astro`. La web publicada (rama `main`) no cambia hasta que la nueva esté lista y Jhon lo apruebe.

## Objetivo

Una web **formal e interactiva** donde los **proyectos son los protagonistas**, que reacciona al scroll de forma suave
y fluida, informa sin saturar y **conserva a la mascota** como anfitriona.

## Decisiones

| Tema | Decisión |
|---|---|
| Paleta | **B · Cielo sereno**: la paleta azul cielo actual con disciplina. El azul cielo solo en lo que se pulsa, los enlaces y el renglón "Usuario: Jhon."; todo lo demás en neutros. La mandarina se queda en la mascota. En modo claro la mascota lleva un escenario azul oscuro detrás (marfil sobre crema = contraste 1,1). |
| Marco | **Astro** (HTML estático) con islas de React solo donde hace falta. La mascota de Three.js (`engine.js`, modelos de Blender) se reutiliza tal cual. |
| Scroll | Lenis (inercia), GSAP + ScrollTrigger solo para el tramo fijado de Proyectos, CSS scroll-driven animations para las apariciones (con `@supports`), View Transitions entre la portada y cada proyecto. |
| Portátil, consola y switch | Pasan a una página **`/lab`** ("Laboratorio") enlazada desde la barra. La portada queda para el trabajo. |
| Contenido | Jhon prepara después, por proyecto, una captura y 4–6 frases (problema, qué hizo, resultado). Mientras, plantillas con marcadores claros. |
| Se conserva | Mascota y sus gestos, voz "> sesión iniciada / sesión cerrada", IBM Plex, `profile.js`, accesibilidad y reglas de rendimiento. |

## Página nueva

1. **Portada**: nombre, qué hace en una línea, dos botones y la mascota grande.
2. **Proyectos**: un único tramo fijado; captura fija en una ventana de navegador que cambia con un fundido mientras bajan los bloques de texto (contador 1/3…). Cada proyecto abre su página.
3. **Habilidades**: rejilla breve por categorías.
4. **Formación**: línea de tiempo que se dibuja con el scroll.
5. **Contacto**: frase, correo con copiar, enlaces, formulario `mailto:`.
6. **/proyectos/[slug]**: caso de estudio en Markdown (contexto, problema, decisiones, capturas, resultado, aprendizaje, enlaces).
7. **/lab**: portátil 3D, consola de juegos y switch de puertos.

## Fases

1. **Hecha (27/11/2026).** Base Astro: dependencias, configuración, tokens, tipografía, estructura, portada con la mascota como isla, secciones estáticas desde `profile.js`.
2. **Hecha (27/11/2026).** Proyectos: colección `src/content/proyectos/*.md` (plantilla con marcadores; `src/content.config.js`), vitrina `src/astro/Showcase.astro` (captura fija en una ventana que cambia con un fundido cuando cada bloque cruza el 55 % de la ventana, contador, barra de progreso y un leve desplazamiento de la captura, con GSAP + ScrollTrigger dentro de `gsap.matchMedia`: solo escritorio y con movimiento; en móvil y con "reducir movimiento", cada proyecto con su captura encima) y caso de estudio `src/pages/proyectos/[id].astro` (cabecera con rol, año, tecnologías y enlaces; captura; índice lateral que marca la sección; barra de lectura con CSS scroll-driven; anterior/siguiente). View Transitions entre documentos: `shot-<id>` y `title-<id>` vuelan de la portada al caso de estudio; la barra (`nav`) no se mueve.
3. **Hecha (27/11/2026).** Formación: la línea azul se dibuja mientras la lista cruza la pantalla y cada punto se enciende al pasar (CSS scroll-driven con `view-timeline` `--tl`/`--tl-item`, dentro de `@supports` y sin "reducir movimiento"; sin soporte se ve completa). Habilidades: las tarjetas suben un poco al entrar (CSS) y cada habilidad muestra en cuántos proyectos REALES aparece (los de plantilla, con [CORCHETES], no cuentan). Contacto: formulario que abre el correo (`mailto:` con asunto y texto, aviso junto al campo si está vacío; textarea a 16 px). Mascota pequeña de la esquina (`src/components/MiniMascot.jsx`): aparece sin animación cuando la portada sale de la vista, saluda y cambia de pose por sección (`SECTION_POSE` ahora incluye `habilidades`); no se puede ocultar. Barra: menú del móvil (botón con `aria-expanded`, se cierra con Esc o al elegir) con todas las secciones, Lab y Contacto.
4. **Hecha salvo publicar y probar en un móvil real (27/11/2026).** `/lab` (`src/pages/lab/index.astro` + `src/components/LabApp.jsx`, una isla de React dentro de `GuideProvider`): el portátil 3D con su lista de programas (los proyectos de la colección; `Projects` con `lab`: sin pista fijada, arranca solo), la consola de la mascota con sus 3 juegos y el switch de puertos (`Contact` con `lab`: sin formulario ni pie; su globo usa `preguntaLab`). Sus estilos salen de la app vieja en `src/styles/lab.css` (solo lo necesario, sin las reglas globales). Página de herramientas `/posar/` (sustituye al `?posar` de Vite; la usan `lab/poster.mjs`, `lab/cabeza.mjs` y `tools/og.mjs`; pecho sin "clic: jugar"). Tarjeta para compartir regenerada. `public/sw.js` ahora se da de baja solo y borra la caché de quien visitó la web anterior. Peso inicial (JS + CSS con gzip): portada ~56 KB más la isla de la mascota (Three.js, ~160 KB, en diferido), caso de estudio ~8 KB, /lab ~21 KB más sus islas.

## Pendiente

- Publicar: unir la rama `reescritura-astro` con `main` y subirla (GitHub Actions ya compila con Astro y Node 24). Solo con el visto bueno de Jhon.
- Probar en un móvil real (con `npm run dev -- --host`).
- Jhon: capturas y textos de cada proyecto en `src/content/proyectos/`, y los datos de `profile.js`.
- Más adelante: borrar de `src/components/` lo que ya no usa nadie (`Portrait`, `Hero`, `Navbar`, `Footer`, `Education` y la mascota CSS de respaldo, si se confirma que /lab no la necesita) y reescribir `CLAUDE.md` para la web nueva.
