# Plan de la reescritura (Astro)

Decidido por Jhon el 27/11/2026, tras el análisis "Rumbo del portafolio" (https://claude.ai/artifact/RLV5cW8tCsE2M33KMvzW7X).
Se trabajó en la rama `reescritura-astro` y ya está publicada en `main`.

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

## Cómo está hoy (28/11/2026)

Publicada en https://trzjhondev.github.io/. Lo que se ve, de arriba abajo (el detalle y el porqué de cada cambio, en las secciones de abajo):

1. **Precarga**: Bonu dormido con CARGANDO y el % real en el pecho; LISTO, un círculo de luz abre la portada desde el pecho y vuela a su panel, donde despierta sin tirones.
2. **Portada**: "> sesión iniciada · Sistema listo. Usuario: Jhon.", dos botones y Bonu sobre su panel; su pecho dice BONU. La barra solo lleva el nombre TrzJhonDev.
3. **Proyectos**: vitrina con la captura fija que cambia al bajar; cada proyecto abre su caso de estudio.
4. **Habilidades**: dos cintas de logos que se mueven solo con el scroll.
5. **Formación**: tarjetas (carrera con avance por ciclos, certificados, prácticas bloqueadas).
6. **Contacto**: formulario `mailto:` con Bonu, que celebra al enviar, y las redes.
7. **/proyectos/[id]**, **/lab** (ventana con pestañas Portátil · Consola · Switch, controles primero) y **404** (Bonu, triste y con la cabeza gacha).

## Página nueva (plan inicial)

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
3. **Hecha (27/11/2026); Formación y Habilidades se sustituyeron después** (ver "Habilidades en cintas" y "Formación y Contacto nuevos"). Formación: la línea azul se dibuja mientras la lista cruza la pantalla y cada punto se enciende al pasar (CSS scroll-driven con `view-timeline` `--tl`/`--tl-item`, dentro de `@supports` y sin "reducir movimiento"; sin soporte se ve completa). Habilidades: las tarjetas suben un poco al entrar (CSS) y cada habilidad muestra en cuántos proyectos REALES aparece (los de plantilla, con [CORCHETES], no cuentan). Contacto: formulario que abre el correo (`mailto:` con asunto y texto, aviso junto al campo si está vacío; textarea a 16 px). Mascota pequeña de la esquina (`src/components/MiniMascot.jsx`): aparece sin animación cuando la portada sale de la vista, saluda y cambia de pose por sección (`SECTION_POSE` ahora incluye `habilidades`); no se puede ocultar. Barra: menú del móvil (botón con `aria-expanded`, se cierra con Esc o al elegir) con todas las secciones, Lab y Contacto.
4. **Hecha y publicada (27/11/2026).** `/lab` (`src/pages/lab/index.astro` + `src/components/LabApp.jsx`, una isla de React dentro de `GuideProvider`): el portátil 3D con su lista de programas (los proyectos de la colección; `Projects` con `lab`: sin pista fijada, arranca solo), la consola de la mascota con sus 3 juegos y el switch de puertos (`Contact` con `lab`: sin formulario ni pie; su globo usa `preguntaLab`). Sus estilos salen de la app vieja en `src/styles/lab.css` (solo lo necesario, sin las reglas globales). Página de herramientas `/posar/` (sustituye al `?posar` de Vite; la usan `tools/poster.mjs` y `tools/og.mjs`; pecho sin "clic: jugar"). Tarjeta para compartir regenerada. `public/sw.js` ahora se da de baja solo y borra la caché de quien visitó la web anterior. Peso inicial (JS + CSS con gzip): portada ~56 KB más la isla de la mascota (Three.js, ~160 KB, en diferido), caso de estudio ~8 KB, /lab ~21 KB más sus islas.

## Pulido tras publicar (27/11/2026, elegido por Jhon)

- **Formación** (sustituida por las tarjetas): la próxima versión (Prácticas) iba fuera de la lista (`.tl-next`), así la línea azul se para en la última etapa y el último tramo es punteado, con la palabra "bloqueada".
- **Página 404 propia** (`src/pages/404.astro` + `src/components/SadMascot.jsx`): la mascota 3D triste y QUIETA (opción `still` del motor: no teclea, no se acomoda las gafas ni reacciona al scroll; su bucle de reposo es la acción `triste_reposo`, hecha en Blender para esto el 27/11/2026 a petición de Jhon: cabeza 17° hacia delante, brazos caídos como en `triste` y solo la respiración del cuerpo, con el primer y el último fotograma iguales; cara `sad` también en reposo; NO la acción `triste`, que en bucle daba tirones de ~9° cada segundo: Jhon vio la cabeza "parpadear raro"; medido después: 0° por fotograma en 11 s), "> error 404 · archivo no encontrado", botones para volver y "exit 1". GitHub Pages la sirve sola.
- **Portada:** entrada escalonada al cargar (línea de consola, cada renglón del titular, texto y botones; el panel y la mascota a la vez) y salida con el scroll (CSS scroll-driven): el texto sube y se apaga, la mascota se aleja más despacio. Solo transform y opacity.
- **Vitrina:** la captura nueva entra con una cortinilla (desde abajo al bajar, desde arriba al subir) encima de la anterior; el número del contador rueda; el texto del proyecto llega escalonado; al pasar el puntero la captura se acerca un 2 % (propiedad `scale`, que no pisa el transform de GSAP).
- **Títulos que se revelan** (`data-reveal`): la línea de consola se escribe, el título sube descubriéndose y el texto llega después, una vez (IntersectionObserver en index.astro, estilos en global.css; sin JavaScript o con "reducir movimiento" se ve todo).
- **Microinteracciones:** flecha en "Ver proyectos" y "Ver caso de estudio" que se desliza; los enlaces de texto dibujan su subrayado al pasar el puntero.

## Habilidades con logos (27/11/2026, opción D de 4; las filas se sustituyeron por las cintas, siguen los logos y `STACK`)

`src/astro/SkillLogos.astro`: una fila por área (nombre y cuántas habilidades) con una ficha por habilidad: logo real de `simple-icons` 16.37.0 (CC0; Java = OpenJDK, con el naranja de Java porque su color es negro; "HTML y CSS" lleva los dos) o un icono propio de trazo para lo que no es una marca (SQL y Fundamentos). Gris en reposo; al pasar el puntero, el color de la marca (mezclado con el texto para que se vea en los dos temas), la ficha se tiñe y sube 2 px (propiedad `translate`, que no choca con la animación de entrada); en táctil, en color desde el principio. Cada ficha sube al asomar (CSS scroll-driven). La insignia "N proy." cuenta solo proyectos reales. El logo de cada habilidad se elige en `logo` de `src/data/skills.js`. El stack de esta web (TypeScript, Astro, Vite, Three.js, GSAP y Blender; pedido por Jhon) va en `STACK` de `skills.js`, aparte de `SKILLS` porque no son teclas del portátil (cada tecla necesita su fragmento de código); el área nueva "3D y animación" está en `AREAS_EXTRA`. Las marcas negras (Three.js) toman el color del texto.

## Despertar sin tirón (28/11/2026)

Jhon: al despertar, "solo la cabeza cambia de posición, la animación se traba". Causa: cada fotograma el motor ponía la cabeza en su pose de fábrica antes de la animación, y el mezclador de Three.js solo reescribe un hueso cuando su valor cambia; en `dormir` la cabeza está quieta (inclinada 22°), así que la 3D dormía con la cabeza RECTA mientras la imagen de la precarga la tiene inclinada: al relevo y al despertar la cabeza saltaba. Ahora la cabeza parte de la última pose de la animación (`headMix` en engine.js). Medido: ningún salto mayor de 1,2° por fotograma (antes 22° al empezar). Efecto también en la 404: `triste_reposo` ya se ve cabizbaja (18°), como se hizo en Blender.

## Nombre de la mascota y barra (28/11/2026)

La mascota se llama **Bonu** (Jhon). El nombre vive en `profile.mascot` y sale en la etiqueta accesible de las mascotas, el saludo de la guía (`{mascot}` en `mascot.js`), Contacto del laboratorio, las pestañas Consola y Switch, la 404, la descripción de /lab y la pantalla del pecho en reposo, que dice BONU quieto (antes "TRZ_" con cursor que parpadeaba; `LOGO` en Console.jsx). La tarjeta para compartir (`og.jpg`) se rehízo con BONU en el pecho. En la barra se quitó el cuadrito "J_" con el cursor que parpadeaba: solo queda el nombre TrzJhonDev.

## Pantalla de precarga (27/11/2026, opción B "la mascota despierta")

Jhon: "falta la pantalla de precarga". `src/astro/Boot.astro` (lo primero del body de la portada, por el slot `before` de Base): el robot dormido (`mascota-dormida-*.webp`) con CARGANDO, barra y % en el pecho y unas "z". Progreso real con `lib/boot.js` (modelo, Three.js, fuentes; `startBoot` acepta `maxMs`). Mínimo 1,2 s (lo eligió Jhon tras probar 2 y 1,6 s), tope 3,2 s; clic o Esc la saltan. Al terminar (Jhon eligió la opción C, "encendido desde el pecho"): el pecho se enciende con LISTO y 100 %, un círculo de luz (`.boot__ring`) crece desde el pecho mientras el fondo se abre por dentro con una máscara radial (la mueve el script de index.astro) y deja ver la portada, que hace su entrada; a mitad, el robot vuela por FLIP a `.hero__stage`; al aterrizar se quita (`boot:fin`) y la mascota 3D, que ya estaba lista y dormida (`mascota:lista`), se funde con la imagen y despierta (HeroMascot.jsx). Sale al entrar desde fuera y al recargar; no al volver desde otra página de la web ni con un #ancla. Con "reducir movimiento" también sale (Windows con las animaciones apagadas lo pide y Jhon no la veía), pero quieta: "z" fijas, sin círculo ni vuelo, y se funde. Lenis espera a que termine. Las imágenes `mascota-dormida-*.webp` tienen fondo TRANSPARENTE (antes eran opacas y durante el vuelo y el relevo al 3D se veía un rectángulo negro o crema sobre el panel; `poster.mjs` quita el fondo de html/body y guarda el alfa con `yuva420p`), y tras la precarga el panel azul ya está quieto en su sitio esperando a la mascota.

## Laboratorio como ventana con pestañas (27/11/2026, opción L1)

Jhon: "interactivo pero limpio, organizado, con buena estructura y buen espaciado". `LabApp.jsx`: pestañas Portátil · Consola · Switch (patrón de ARIA: flechas, Inicio y Fin; enlace propio #portatil, #consola, #switch) y UNA ventana con barra de título (`~/lab/<pieza>`), la pieza a todo el ancho (solo se monta la activa) y, debajo, la misma franja en las tres: qué es, controles (cada uno como una tecla) y "hecho con" (logos de simple-icons). El portátil conserva su lista de programas (sin el título viejo) y el switch se ve sin el marco de Contacto. Estilos en `src/pages/lab/index.astro`.

Revisión del mismo día (Jhon: "no sé qué hacen, es texto en cajitas, se ve plano, sin vida"): arriba "qué es" y "hecho con" (fichas que toman el borde de su marca al pasar); debajo, a todo el ancho, los controles como TARJETAS (3 / 2 / 1 columnas): primero qué consigues en negrita y debajo cómo, con las teclas como teclas, y un icono del gesto (`Gesture` en LabApp.jsx: cursor que arrastra, onda de clic, tecla que baja, rueda, flechas, cruceta, señalar). Las tarjetas entran escalonadas al abrir la pestaña y cada icono hace su gesto una vez; con el puntero encima la tarjeta sube 2 px y el gesto se repite. Nada se mueve con "reducir movimiento". En el portátil del laboratorio ya no sale la etiqueta de la habilidad (`.stage__skill` oculta). Después ("desplaza mucho la página y se ve vacía"; "los controles deberían ir primero"): cabecera compacta sin el "~/lab" (título y texto en una fila en escritorio), los controles PRIMERO bajo la pieza y debajo "qué es" y "hecho con"; el pie a 56 px de la ventana.

## Habilidades en cintas (27/11/2026, opción S1)

Jhon: "ocupa mucho espacio … que reaccione al scroll". `SkillLogos.astro` ahora pinta todas las habilidades (SKILLS + STACK) en dos cintas que se mueven en sentidos opuestos SOLO con la velocidad del scroll (suavizada por tiempo; se paran al parar; cambian de sentido al subir), con el contenido duplicado para dar la vuelta sin corte (la copia es aria-hidden) y bordes que se desvanecen. Al pasar el puntero la cinta se detiene y el logo toma su color; en táctil, en color. Bucle rAF solo con la sección a la vista. Con "reducir movimiento" o sin JavaScript: quietas, en filas que se parten. La sección mide ~500 px en escritorio (antes ~1.100).

## Formación y Contacto nuevos (27/11/2026)

- **Formación con tarjetas (F1):** `src/astro/Formacion.astro`. La carrera en una tarjeta grande con barra de avance por ciclos (`cycle` y `totalCycles` en `education` de `profile.js`; se llena al entrar en pantalla; sin datos, punteada y "avance: pendiente"). Cada certificado en una ficha con el logo de quien lo emite (`issuerLogo`, nombre de simple-icons) y "Ver credencial" (`url`); sin logo, un icono de certificado. Al final, Prácticas como próxima versión bloqueada. Sustituye a la línea de tiempo.
- **Contacto con la mascota cartera (C1):** formulario a la izquierda y, a la derecha, la mascota 3D en su panel (`src/components/ContactMascot.jsx`, isla `client:visible`): saluda con `hola`, sigue el puntero y celebra al enviar (evento `mascota:celebrar`). La mascota pequeña de la esquina se aparta mientras se ve (`[data-contact-bot]`). Debajo, las redes en fichas con su logo (simple-icons; LinkedIn y el CV, dibujados); lo pendiente con borde discontinuo y la palabra.

## Limpieza (28/11/2026)

Se borraron la app de Vite (`legacy/`), los componentes que solo usaba ella (`App`, `Hero`, `Navbar`, `Portrait`, `Education`, `index.css`), los prototipos de `src/proto/` (`Pose.jsx` pasó a `components/`), las cabezas de la mascota del mapa viejo, los scripts de pruebas del sitio anterior y la lista `projects` de `profile.js` (la terminal del portátil ya lee los proyectos de Markdown). Los planes viejos están en `docs/historial/` y `CLAUDE.md` se reescribió para la web actual. La mascota CSS se queda: la usan las piezas de /lab mientras carga la 3D.

## Pendiente

- Probar en un móvil real (con `npm run dev -- --host`).
- Jhon: capturas y textos de cada proyecto en `src/content/proyectos/`, y los datos de `profile.js`.
