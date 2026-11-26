# Portafolio 3D — Jhon (TrzJhonDev)

Portafolio personal de un estudiante de Ingeniería de Sistemas. Hecho con **React 18 + Vite 5** (JavaScript). Lo protagonizan una **mascota robot** y un **portátil interactivo**, los dos modelados en **Blender** y dibujados con **Three.js**. Tienen de respaldo una versión hecha solo con CSS 3D, que se ve mientras carga el 3D o si el navegador no tiene WebGL.

- **Paleta:** azul cielo sobre una base limpia, con modo oscuro (casi negro azulado) y claro (blanco cálido). El botón de la barra cambia de modo con un fundido; por defecto sigue al sistema. Los colores están en `PLAN-COLORES.md`.
- **Tipografía:** la familia IBM Plex (Sans Condensed en los títulos, Sans en el texto y Mono en el código y la terminal).
- **Scroll con inercia** (Lenis) con ratón o touchpad: la rueda se desliza en vez de saltar. En móvil y con "reducir movimiento", el scroll normal.
- **Barra flotante:** arriba es la de siempre; al bajar se esconde y al subir vuelve, con una rayita bajo la sección en la que estás.
- **En el móvil se siente como una app:** sin destello al tocar, sin efectos de "pasar el puntero" pegados, sin zoom al escribir y respetando la muesca.
- **Al compartir el enlace** (WhatsApp, LinkedIn…) sale una tarjeta con la mascota y tu título (`public/og.jpg`).
- **Accesible:** contraste AA, todo funciona con teclado y respeta "reducir movimiento".
- **Sin sonido** y sin usar micrófono ni cámara.

> Las reglas técnicas y las decisiones de diseño están en `CLAUDE.md` (lo lee Claude Code en cada sesión) y en los planes `PLAN-*.md`. Este README es el manual de uso.

## Cómo arrancarlo

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install      # dependencias (solo la primera vez)
npm run dev      # http://localhost:5173 con recarga en vivo
npm run build    # versión final en /dist (debe pasar sin errores)
npm run preview  # sirve /dist para probar la versión final
```

## La página, de arriba abajo

1. **Pantalla de carga.** Al abrir se ve el robot dormido con "CARGANDO" y una barra con el progreso real en el pecho. Cuando todo está listo despierta y vuela a su sitio en la portada. Esc o un clic la saltan. Con "reducir movimiento" no hay vuelo.
2. **Portada.**
   - El titular habla como la máquina: una línea de consola ("> sesión iniciada") y "Sistema listo. Usuario: Jhon.", que entra por renglones. Se edita en `hero` de `profile.js`.
   - La mascota (marfil con detalles mandarina, igual en los dos temas) sigue el puntero, parpadea, saluda una vez por sesión, y con un clic (o Intro) se asusta o se ríe. De vez en cuando se acomoda las gafas, su gesto propio.
   - Si no mueves el ratón 8 s, saca un teclado del pecho y escribe datos útiles en su consola.
   - **La consola de su pecho tiene 3 minijuegos:** Serpiente, Salto y Ladrillos. Haz clic en la pantallita y juega con las flechas o WASD, espacio, y Esc para salir.
3. **Proyectos.**
   - En escritorio la sección queda fija mientras bajas (1,6 pantallas): la mascota pulsa el botón de su pecho y, con el scroll, el portátil abre la tapa, arranca la BIOS y enciende las teclas. Al terminar el encendido la sección se suelta y, desde ahí, pasa como cualquier otra (no vuelve a fijarse).
   - A la derecha, la lista de programas (`proyecto-1.app`…). Al abrir uno se ve en la pantalla del portátil (captura, descripción y stack) y en la lista aparecen sus enlaces. Elegir una skill vuelve al código.
   - En móvil el portátil arranca al entrar en pantalla y la lista va debajo, con la descripción a la vista.
4. **Formación ("Historial de versiones").** Un mapa de niveles, como el de un videojuego: cada etapa es una ficha con volumen sobre un camino que serpentea. Los certificados son niveles **superados**, la carrera el **nivel actual** y las prácticas el siguiente, **bloqueado**. La línea azul avanza con tu scroll y la cabeza de la mascota salta de nivel en nivel; al aterrizar, la ficha se hunde con un pulso.
5. **Contacto ("Abrir conexión").**
   - Arriba, el título y el mensaje: abre tu programa de correo con el texto listo; no hay servidor.
   - Debajo, un panel de puertos (Copiar correo, GitHub, LinkedIn, TikTok, Instagram, YouTube y CV): cajas con volumen, cada una con su logotipo (en blanco y negro hasta que se enchufa, entonces se pinta con los colores de la marca) y su puerto integrado en la propia caja. En escritorio ancho la mascota pasea con un conector cuyo cable sale de un servidor del suelo (modelado en Blender), salta y lo enchufa; si señalas un puerto, va a conectarlo. El cable cae con naturalidad y nunca la atraviesa.
   - Puedes arrastrar el conector y enchufarlo tú; si se lo quitas de la mano, se pone triste.
   - En pantallas más estrechas, el mismo panel en una rejilla fija.

**La guía.** La mascota comenta cada sección una vez por sesión con globos cortos, que se pueden callar (se recuerda). Cuando la portada ya no se ve, aparece una versión pequeña abajo a la derecha que cambia de pose según la sección (concentrada mirando el portátil en Proyectos, contenta en Formación, saludando en Contacto). Sus frases están en `src/data/mascot.js`.

## Cómo se usa el portátil

Todo se hace sobre el 3D, sin paneles de botones.

- **Girar:** arrastra el fondo o la base (con inercia). Doble clic: vista frontal. Arrastra hacia arriba (o flecha abajo) para verlo por debajo.
- **Tapa:** arrástrala para abrir o cerrar; clic en la tapa cerrada la abre.
- **Teclas de colores = skills:** al pasar el puntero se proyecta un holograma; al hacer clic la skill se carga en la pantalla y se escribe su código coloreado por lenguaje (`lang` en `skills.js`). En el móvil, tócalas.
- **Ejecutar:** clic en el touchpad o Enter. Suben partículas con palabras del código y la CPU se calienta (lo ves en "CPU °C" de la pantalla y, en el despiece, en el ventilador).
- **Terminal:** clic en la pantalla (o tecla `T`). Comandos: `ayuda`, `sobre-mi`, `neofetch`, `skills`, `proyectos`, `formacion`, `contacto`, `abrir <skill>`, `ir <destino>`, `cv`, `tema [claro|oscuro]`, `ejecutar`, `ls`, `fecha`, `limpiar`, `salir` y algún secreto. Tab autocompleta, las flechas recorren el historial y Esc sale.
- **Despiece:** elige "Arquitectura de computadoras". Las capas se separan y cada pieza de la placa se puede pulsar. Con "Armar rompecabezas" las 9 piezas se dispersan y hay que devolverlas a su hueco (también con teclado).
- **Cargador:** arrastra el conector desde la batería portátil del suelo hasta el puerto USB-C de la izquierda (o haz clic). Los LED de la batería se encienden y la batería de la pantalla sube.
- **Botón de encendido:** apaga o enciende la pantalla. **Zoom:** `Ctrl` + rueda, pellizcar, o `+` y `-`.
- **Teclado:** con el escenario enfocado, las flechas giran, espacio abre o cierra, Enter ejecuta.

## Personalizar

| Qué | Dónde |
|---|---|
| Tus datos, enlaces, proyectos y formación | `src/data/profile.js` (completa todo lo que está entre `[CORCHETES]`; los enlaces que siguen como marcador salen como "pendiente") |
| CV | Pon el PDF en `public/` (p. ej. `public/cv.pdf`) y en `profile.js` usa `cvUrl: './cv.pdf'` |
| Capturas de proyectos | `public/proyectos/` y `image: './proyectos/mi-app.png'` |
| Skills del portátil | `src/data/skills.js` (el color sale de la categoría, `CATEGORY_COLORS`; `explode: true` abre el despiece) |
| Frases de la mascota | `src/data/mascot.js` |
| Datos que escribe la consola | `src/data/tips.js` (hasta 4 líneas de 17 caracteres) |
| Colores | Tokens en `src/index.css`; mascota en `Mascot/Mascot.css` (`--m-*`) y en `THEMES` de `Mascot3D/engine.js` |
| Logo de la tapa y de la barra | `brand` en `profile.js` |
| Tarjeta para compartir | Se genera con `node tools/og.mjs` (con `npm run dev` en marcha) a partir de la portada; vuelve a lanzarlo si cambias esos textos o la mascota |

## Modelos 3D (Blender)

- Fuentes: `blender/mascota.blend` y `blender/portatil.blend` (Blender 5.2; 1 unidad = 1 cm), y `blender/servidor.blend` (el servidor de Contacto, que va como imagen renderizada: `public/img/servidor.webp`).
- Se exportan a `public/models/mascota.glb` y `public/models/portatil.glb` (glTF con compresión meshopt).
- Las URL llevan la huella del archivo (plugin de `vite.config.js`), así que un modelo reexportado nunca se sirve viejo: basta con recargar.
- Si cambias el modelo, sus colores o la luz, vuelve a sacar las imágenes (todas con `npm run dev` en marcha):
  - robot dormido de la carga: `node scrollcraft/builds/portafolio/lab/poster.mjs`;
  - cabeza de Formación (fondo transparente): `node scrollcraft/builds/portafolio/lab/cabeza.mjs`;
  - tarjeta para compartir: `node tools/og.mjs`;
  - iconos del sitio: `node tools/iconos.mjs`.
- **Páginas de prueba:** `?mascota3d` (la mascota sola), `?portatil3d` (el portátil solo) y `?posar` (para sacar imágenes).

## Dónde está cada cosa

```
src/
├── data/            profile.js · skills.js · mascot.js · tips.js
├── components/
│   ├── Navbar · Hero · Portrait (portada) · Projects · Education · Contact · Footer
│   ├── Mascot/      mascota CSS (respaldo), guía y globos, consola del pecho y sus juegos, caras (faceData.js)
│   ├── Mascot3D/    mascota de Blender con Three.js (engine.js)
│   └── Laptop3D/    portátil: estado e interacción (useLaptop, useTerminal, usePuzzle), piezas CSS y gl/ (dibujo WebGL)
├── lib/             boot.js (pantalla de carga) · contactStage.js · math3d.js · useTheme.js · links.js
├── proto/           páginas de prueba (?mascota3d, ?portatil3d, ?posar)
└── index.css        tokens de color de los dos temas
public/              modelos .glb, imágenes, og.jpg (tarjeta para compartir) y sw.js (caché local, solo en producción)
tools/               og.mjs (tarjeta para compartir) · iconos.mjs (iconos del sitio)
blender/             modelos fuente
scrollcraft/         guion de la experiencia de scroll (BRIEF, SCORE) y herramientas de verificación (lab/*.mjs)
```

## Verificar

```bash
npm run dev
node scrollcraft/builds/portafolio/lab/walk.mjs --out scrollcraft/builds/portafolio/lab/desktop            # escritorio
node scrollcraft/builds/portafolio/lab/walk.mjs --out scrollcraft/builds/portafolio/lab/movil --mobile     # móvil (--dark, --reduced)
```

Recorre la página con Chrome (sin ventana), hace una captura por paso, junta una hoja de contactos y apunta los errores de consola. Necesita Google Chrome instalado. Si Vite usa otro puerto, añade `--url http://localhost:5174/`.

**En tu móvil:** arranca el servidor para la red local con `npm run dev -- --host` y abre en el móvil (en el mismo Wi‑Fi) la dirección que sale como `Network:`. Si Windows pregunta por el firewall, permite solo redes privadas. La tarjeta para compartir solo se puede probar con la página publicada.

## Publicar

Está publicado en **https://trzjhondev.github.io/** con GitHub Pages. Cada `git push` a `main` lo construye y lo publica solo (`.github/workflows/deploy.yml`); tarda uno o dos minutos.

- Si cambias de dominio, cambia también las URL absolutas de la tarjeta para compartir (`og:url` y `og:image` en `index.html`).
- No subas `tools/fuente/` (fotos personales), los vídeos ni `.claude/skills/`: ya están en `.gitignore`.
- Antes de enseñarlo a nadie, completa los `[CORCHETES]` de `profile.js`.
