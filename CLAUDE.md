# CLAUDE.md

Portafolio de Jhon (TrzJhonDev), estudiante de Ingeniería de Sistemas. **Astro 7** (páginas en HTML estático) con
islas de **React 18** solo donde hay interacción; JavaScript, sin TypeScript (los `<script>` de Astro pueden usar TS).
Todo el texto de la interfaz está en español. Publicado en https://trzjhondev.github.io/ (GitHub Pages).

- Plan, decisiones de Jhon y estado de cada parte: `docs/PLAN-REESCRITURA.md` (léelo antes de cambiar una sección).
- Historial de la web anterior (Vite): `docs/historial/`. `CLAUDE-web-anterior.md` sigue siendo la referencia
  detallada de las piezas que viven en `/lab` (portátil 3D, switch con cable, consola y motor de la mascota).

## Comandos
- `npm run dev`: servidor de desarrollo en http://localhost:5173 (`.claude/launch.json` lo arranca como `dev`).
- `npm run build`: build a `dist/`. Debe pasar sin errores antes de dar algo por terminado.
- `npm run preview`: sirve `dist/` para probar la versión final.

## Estructura
```
src/
├── pages/        index.astro (portada) · proyectos/[id].astro (caso de estudio) · lab/index.astro · 404.astro
│                 · posar.astro (herramienta: la mascota sola, fondo transparente)
├── layouts/      Base.astro: cabeza (SEO, OG, fuentes, tema), barra, pie y Lenis; slot "before" para la precarga
├── astro/        piezas de Astro: Nav · Footer · Boot (precarga) · Showcase (vitrina) · SkillLogos (cintas)
│                 · Formacion (tarjetas)
├── content/      proyectos/*.md (un archivo por proyecto; esquema en content.config.js)
├── components/   islas de React
│   ├── HeroMascot · MiniMascot · ContactMascot · SadMascot · Pose   mascotas de cada página
│   ├── Mascot3D/   motor 3D de la mascota (engine.js) y su componente
│   ├── LabApp      /lab: ventana con pestañas Portátil · Consola · Switch
│   ├── Projects · Laptop3D/   portátil 3D del laboratorio (CSS 3D + WebGL)
│   ├── Contact · Footer      switch de puertos con cable del laboratorio (y su pie)
│   └── Mascot/     mascota CSS, consola del pecho y sus juegos, guía y globos (las usan las piezas del lab)
├── data/         profile.js · skills.js · mascot.js (frases) · tips.js (datos de la consola)
├── lib/          boot (precarga y descarga del modelo) · smoothScroll (Lenis) · links · useTheme · math3d
│                 · contactStage (director del switch) · modelVersions (huella de los .glb)
└── styles/       global.css (tokens y base de toda la web) · lab.css (solo lo que necesitan las piezas de /lab)
public/           models/*.glb · img/ (mascota dormida, servidor) · og.jpg · iconos · sw.js (solo se da de baja)
blender/          mascota.blend · portatil.blend · servidor.blend (fuentes de los modelos)
tools/            og.mjs (tarjeta para compartir) · poster.mjs (mascota dormida) · iconos.mjs (favicon)
docs/             PLAN-REESCRITURA.md (vigente) · historial/ (planes y notas de la web anterior)
```

## Convenciones
- **Datos** en `src/data/` y **proyectos** en `src/content/proyectos/`: los componentes leen de ahí; no escribas datos
  personales dentro de los componentes. Los marcadores `[ASÍ]` los completa Jhon: no inventes cifras, nombres ni enlaces.
  Lo pendiente se ve como "pendiente" (borde discontinuo y la palabra), nunca solo con opacidad.
- **Colores**: paleta B "Cielo sereno" con tokens en `src/styles/global.css` (`--accent`, `--accent-ink`, `--accent-2`,
  `--surface`, `--line`, `--muted`, `--stage-panel`…). Usa tokens, no hex nuevos. El azul cielo va solo en lo que se
  pulsa, los enlaces y el renglón "Usuario: Jhon."; lo demás, neutros. Contraste AA en los dos temas. El morado está
  descartado ("se ve triste"): no lo propongas.
- **Tema**: `applyTheme()` / `toggleTheme()` de `lib/useTheme.js`; no toques `data-theme` a mano.
- **Tipografía**: IBM Plex (Sans Condensed en títulos, Sans en texto, Mono en detalles de consola). Los canvas
  (teclas del portátil, pantallas de la mascota) también usan "IBM Plex Mono".
- **Estilos**: CSS plano. Lo de Astro en el `<style>` de cada página o pieza (con `:global()` para las islas); lo de las
  piezas del laboratorio en `lab.css` y sus propios CSS.
- **Accesibilidad**: botones reales, `aria-label` en los que solo llevan icono, teclado en todo, ningún estado
  comunicado solo con color. Sin emojis: iconos SVG (logos de `simple-icons`, CC0; LinkedIn dibujado a mano).
- **Movimiento**: todo lo animado respeta `prefers-reduced-motion`; solo `transform` y `opacity`; nada de
  `filter: blur()` en capas grandes; todo bucle rAF se para fuera de pantalla (`IntersectionObserver`, leyendo el
  ÚLTIMO aviso de la lista). Los `:hover` que mueven algo van en `@media (hover: hover)`.
- **Móvil**: `viewport-fit=cover` y márgenes con `env(safe-area-inset-*)`; `touch-action: manipulation` y
  `user-select: none` en botones; inputs a 16 px en táctil.
- **Sin audio**: nada de `getUserMedia`, `getDisplayMedia` ni sonido.
- **Windows**: los nombres de archivo no distinguen mayúsculas (no crees `x.js` y `X.jsx`); muchos archivos van con
  CRLF: si editas con scripts, respétalo.

## Decisiones de Jhon que no se deben deshacer
Detalle y fechas en `docs/PLAN-REESCRITURA.md`.
- **Portada**: "> sesión iniciada", "Sistema listo." / "Usuario: Jhon." y la mascota grande sobre su panel; entrada
  escalonada y salida con el scroll. Ninguna otra sección lleva línea de consola encima del título salvo Formación
  ("historial de versiones") y Contacto ("> abrir conexión").
- **Precarga** (`Boot.astro` + script de `index.astro` + `lib/boot.js`): robot dormido con CARGANDO y % real en el
  pecho; al terminar, LISTO, un círculo de luz que abre la portada desde el pecho y el robot vuela a su panel, que ya lo
  espera, y despierta (`HeroMascot`, evento `boot:fin`). Mínimo 1,2 s, tope 3,2 s; clic o Esc la saltan. Sale al
  entrar y al recargar (no al volver desde otra página de la web ni con `#ancla`); con "reducir movimiento", quieta.
- **Proyectos**: vitrina con la captura fija que cambia al bajar (`Showcase.astro`, GSAP); cada proyecto abre su caso
  de estudio con View Transitions.
- **Habilidades**: dos cintas de logos que se mueven SOLO con el scroll, en sentidos opuestos (`SkillLogos.astro`).
- **Formación**: tarjetas (carrera con barra de ciclos, certificados con credencial, prácticas bloqueadas).
- **Contacto**: formulario `mailto:` con la mascota (`ContactMascot`, saluda y celebra al enviar) y los logos de redes.
- **404**: mascota triste con la acción `triste_reposo` de Blender, quieta (`SadMascot`, modo `still`).
- **/lab**: una ventana con pestañas (Portátil, Consola, Switch; solo se monta la activa; enlace propio con `#`) y debajo
  primero los controles (tarjetas con el gesto animado), luego "qué es" y "hecho con". Sin la etiqueta de la habilidad
  en el portátil.
- **Mascota**: robot que representa a Jhon (gafas y auriculares son sus rasgos); sin foto ni parecido real y SIN
  NOMBRE todavía. Colores marfil y mandarina (variables `--m-*` en `Mascot/Mascot.css` y `THEMES` en
  `Mascot3D/engine.js`); nada de paletas frías ni grafito/perla. Sin bordes de contorno. Se acomoda las gafas como gesto
  propio. La pequeña de la esquina (`MiniMascot`) no tiene botón para ocultarla.
- **Descartado** (no lo vuelvas a poner): el cable de circuito entre mascota y portátil, la terminal que cargaba en la
  portada, el paseo de la mascota ligado al scroll, la "x" de la mascota pequeña, las tarjetas de cristal flotantes, las
  líneas de consola de Proyectos y Habilidades, el morado.

## Mascota 3D y modelos
- Modelo en `blender/mascota.blend` (Blender 5.2, 1 unidad = 1 cm) → `public/models/mascota.glb`. EXPORTA SIEMPRE con
  `export_scene.gltf(export_format="GLB", use_selection=True, export_apply=True, export_animations=True,
  export_animation_mode="ACTIONS", export_meshopt_compression_enable=True)`, con todo seleccionado salvo boca_prueba,
  ojo_prueba.L/R, Cube y Light. Sin `export_apply` los redondeos (BEVEL) no se aplican y el cuerpo sale con aristas.
  Después compara los vértices por malla con `git show HEAD:public/models/mascota.glb`.
- Las URL de los `.glb` llevan la huella del archivo (`lib/modelVersions.js` → `<meta name="model-versions">`):
  un modelo reexportado nunca se sirve viejo.
- El motor (`engine.js`) carga el glTF una vez y clona por mascota; opciones `games`, `still`, `sleeping`, `pose()`,
  `play()`, `lookHold`, `restFace`. Luz y materiales para que coincida con la versión CSS: sin tono de cine ni entorno.
- Si cambian el modelo o sus colores, rehaz las imágenes con el servidor de desarrollo en marcha:
  `node tools/poster.mjs` (mascota dormida, fondo TRANSPARENTE), `node tools/og.mjs` (tarjeta para compartir) y
  `node tools/iconos.mjs` (iconos).

## Skills de diseño (solo en este equipo)
- `.claude/skills/` está en `.gitignore`: NINGUNA skill se sube a git. Instaladas: las de Emil Kowalski
  (`emilkowalski/skills`), `impeccable` (`pbakaus/impeccable`, solo `SKILL.md` y `reference/`, sin su lanzador),
  `scroll-craft` (`nateherkai/scroll-craft`) y `design-taste-frontend` (`Leonxlnx/taste-skill`). Para reinstalarlas,
  clona esos repositorios y revisa su contenido antes de copiarlo.
- No mandan sobre las decisiones de Jhon: úsalas para pulir, no para rediseñar lo aprobado.
- `scroll-craft/scripts/kie.mjs` usa una API de pago: solo con clave y permiso de Jhon. Los scripts de taste-skill que
  descargan de internet (`icons.mjs`, `photos.mjs`, `fx-map/bake.mjs`) no se lanzan sin decírselo.

## Publicar
- Cada `git push` a `main` compila y publica (`.github/workflows/deploy.yml`). Haz commit y push solo cuando Jhon lo pida.
- No subas `tools/fuente/` (fotos personales), vídeos (`*.mp4`) ni `.claude/skills/`: ya están en `.gitignore`.
- Si cambia el dominio, cambia `site` en `astro.config.mjs`.
