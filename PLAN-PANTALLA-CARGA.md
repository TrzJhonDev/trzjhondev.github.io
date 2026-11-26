# Plan: pantalla de carga con el robot dormido

**Estado (25/11/2026):** HECHO (pasos 1 a 10). Decisiones tomadas con lo recomendado: en cada recarga (corta si ya está en caché), deslizamiento directo sin rebote, con "z" y sin duración mínima. Medido con Chrome sin GPU (gráficos por software, más lento que un equipo real) y red 4G: primer pintado 1,72 s → 0,64 s en frío y 1,51 s → 0,23 s con caché; la mascota CSS ya no aparece nunca (salvo sin WebGL). Capturas y vídeo en `scrollcraft/builds/portafolio/lab/` (`carga-*`, `video-*`, `casos.png`). Pedido de Jhon: "una pantalla de carga, solo el robot como dormido, que el pecho diga cargando, y cuando carga se vaya a su lugar en la landing page". Objetivo general: una página moderna, llamativa, interactiva y fluida, sin el cambio brusco de la mascota CSS a la de Blender al recargar.

## 0. El problema de hoy (medido en el build)

Al recargar pasa esto en cadena, cada paso esperando al anterior:

1. **Página** (`index-*.js`, 97 KB con gzip): se pinta la portada con la mascota CSS.
2. **Three.js** (`GLTFLoader-*.js`, 154 KB): no se pide hasta que React monta la portada.
3. **Modelo** (`mascota.glb`, 162 KB): no se pide hasta que llega Three.js.
4. **Interpretar, compilar y primer dibujo**: entonces la mascota CSS se cambia de golpe por la 3D.

Son unos 420 KB en serie. Encima, las dos mascotas no son idénticas, así que el relevo se nota.

## 1. La experiencia, segundo a segundo

| Momento | Qué se ve | Qué pasa por debajo |
|---|---|---|
| 0 ms (primer pintado) | Fondo del tema y, en el centro, el robot dormido: cabeza gacha, ojos cerrados y unas "z" que suben despacio. En la pantalla del pecho, `CARGANDO` con una barra fina | Es HTML puro que viene en `index.html` (sin esperar a React), con una imagen fija del robot dormido. Se piden a la vez la página, Three.js, el modelo y las fuentes |
| ~0,3–1 s | El robot "respira" (sube y baja muy poco) y la barra avanza con el progreso real | Cuando el 3D está listo, sustituye a la imagen con un fundido invisible (mismo encuadre y misma pose) y la pantalla del pecho pasa a ser la consola real en modo `cargando` |
| Todo listo | La barra llega al 100 %, el pecho dice `LISTO`, el robot abre los ojos (parpadeo), se estira y sonríe | Las fuentes, la página montada, el modelo y los gráficos están compilados |
| +0,9 s | El robot se desliza a su sitio en la portada (se mueve y se encoge a la vez). El fondo de la pantalla de carga se funde y deja ver la página, cuyos titulares entran por renglones | El mismo canvas WebGL se mueve a la portada (técnica FLIP): ni segunda descarga ni segunda mascota |
| Al aterrizar | Saluda con la mano y sale el globo de bienvenida (una vez por sesión, como ahora) | La pantalla de carga se quita del DOM y empiezan los bucles normales |

## 2. Recursos nuevos

### 2.1 En Blender (`blender/mascota.blend`)
1. **Acción `dormir`** (bucle de 3 s): cabeza 15° hacia abajo y algo ladeada, cuerpo que respira (baja 1 cm), brazos caídos y un balanceo muy leve. Con el esqueleto en reposo antes de crearla (regla de `CLAUDE.md`).
2. **Acción `despertar`** (1,2 s, una vez): levanta la cabeza, se estira con los brazos hacia arriba y hacia fuera, un pequeño rebote del cuerpo y vuelve al reposo.
3. **Reexportar** `public/models/mascota.glb` y comprobar la altura (~2,86 m) y los 15 clips.
4. **Renders del robot dormido**: cámara con el MISMO encuadre que la pantalla de carga (el mismo `fit()` del motor), en oscuro y en claro, con la pantalla del pecho vacía. Se guardan en `public/img/mascota-dormida-oscuro.webp` y `-claro.webp`, unos 15–25 KB cada uno (el doble del tamaño en pantalla para que se vean nítidos).

### 2.2 En el código
1. **Cara `sleep`** en `faceData.js`: ojos cerrados en arco hacia abajo (dos líneas finas) y boca pequeña. La usan la cara SVG y la textura 3D.
2. **Modo `cargando` en la consola** (`Console.jsx`): `CARGANDO` en 2 líneas, una barra de progreso de píxeles y el porcentaje. Al terminar dice `LISTO` con el cursor `_`. Lo pinta el mismo canvas que ya se copia al pecho del modelo.
3. **Las "z"**: tres letras HTML que suben y se desvanecen junto a la cabeza (CSS, solo `transform` y `opacity`). Fuera del 3D: en la imagen y en el modelo se ven igual.

## 3. Arquitectura

### 3.1 Pantalla de carga en `index.html`
- Un `<div id="boot">` en el `<body>` con fondo `--bg`, la imagen dormida (`fetchpriority="high"`, la del tema según `data-theme`, que ya se pone antes de pintar), las "z" y un HTML encima de la pantalla del pecho con `CARGANDO` y la barra. Se sitúa en porcentaje del render, así coincide en cualquier tamaño.
- CSS mínimo en línea en `index.html` (no espera a la hoja de estilos de la página).
- `role="status"` con el texto "Cargando el portafolio" y `aria-busy="true"` en la página mientras dura. Se puede saltar con Esc o con un clic: la página aparece al momento y el robot va a su sitio sin animación.

### 3.2 Carga en paralelo y progreso real (`src/lib/boot.js`)
- `<link rel="preload" as="fetch" crossorigin href="models/mascota.glb">` y `<link rel="preload">` de la imagen dormida en `index.html`.
- Lo primero que hace `main.jsx`, antes de montar React, es lanzar `import('./components/Mascot3D/Mascot3D')` (Three.js) para que no espere a la portada.
- El modelo se descarga con `fetch` leyendo el cuerpo por partes (`ReadableStream`) para saber los bytes recibidos. Se guarda en el `SHARED` de `engine.js`, así el motor no lo vuelve a pedir.
- Progreso con pesos: modelo 45 %, Three.js 35 %, fuentes 10 %, página montada 10 %. Se publica en un pequeño almacén (`boot.progress`, `boot.onReady`) que leen la barra HTML y la consola.
- Tope de seguridad: a los 6 s se sigue aunque falte algo. Si falla WebGL, se va con la mascota CSS de siempre.

### 3.3 Un solo motor, que viaja
- El `Mascot3D` de la portada se crea al principio dentro de una caja fija en la pantalla de carga (portal de React a `#boot`), con la variante `hero` y una nueva prop `sleeping`.
- Al estar listo: `compileAsync` y un primer fotograma oculto. Después, fundido de 250 ms de la imagen al canvas (mismo encuadre: no se nota).
- **El vuelo (FLIP):**
  1. medir la caja de la carga (rectángulo A) y el sitio de la portada (rectángulo B);
  2. mover el canvas a la caja de la portada (el contexto WebGL sobrevive al moverlo en el DOM);
  3. aplicarle una transformación inversa para que parezca seguir en A;
  4. animarla a cero en 0,9 s con `cubic-bezier(0.2, 0.8, 0.2, 1)`.

  Es solo `transform`: fluido incluso en móvil. Por eso el robot se dibuja ya al tamaño final y la carga lo muestra escalado.
- La mascota CSS deja de verse al recargar: solo queda como respaldo sin WebGL.

### 3.4 Cómo entra la página
- La página está montada y maquetada por debajo desde el principio (sin saltos de diseño, CLS 0), con `visibility` controlada por la clase `is-booting` en `<html>`.
- Al empezar el vuelo se quita `is-booting`. Entonces el fondo de la carga se funde (0,5 s), la barra superior baja 12 px y los renglones del titular entran (la animación `line-in` de hoy pasa a dispararse con esta clase, no al cargar) y los botones aparecen al final.
- El saludo (`saludo`, una vez por sesión) empieza al aterrizar, no antes.

## 4. Casos especiales

| Caso | Comportamiento |
|---|---|
| Recarga a mitad de página (el navegador recuerda el scroll) | La portada no se ve: no hay vuelo. El robot despierta, la carga se funde y aparece la mascota pequeña de la esquina, como siempre |
| Segunda visita (todo en caché) | Si está listo en menos de 400 ms, la secuencia se acorta: medio segundo dormido, parpadeo y vuelo. Nunca se queda esperando por gusto |
| "Reducir movimiento" | Sin respirar, sin "z" y sin vuelo: fundido de 0,3 s de la carga a la página, con el robot ya en su sitio |
| Sin WebGL o modelo que no carga | La imagen dormida se funde y queda la mascota CSS en la portada |
| Móvil | La misma secuencia. El sitio final de la mascota está debajo del titular; si queda fuera de la pantalla, se funde en vez de volar. Imagen y barra a medida (la caja de carga mide el 70 % del ancho) |
| Conexión muy lenta | La barra avanza con los bytes reales; a los 6 s la página aparece igual y el 3D llega cuando pueda (con el fundido del punto 3.3) |

## 5. Más ligera y fluida en toda la página

1. **Comprimir los modelos con meshopt:**
   - `mascota.glb` de 162 KB a unos 60–80 KB, y `portatil.glb` de 264 KB a unos 100 KB.
   - Three.js ya trae el lector (`MeshoptDecoder`).
   - Se comprime con `gltfpack` o `gltf-transform`, que se instalan como herramienta: se pide permiso antes.
2. **El portátil en un momento libre:** su modelo se pide con `requestIdleCallback` después de aterrizar, no antes, para no competir con la carga.
3. **Caché local (service worker propio, unas 40 líneas):** guarda modelos, imágenes y código con versión. Recargar no los vuelve a descargar.
4. **Fuentes:** `font-display: swap` ya está. Se añade `preload` de las dos fuentes que se ven en la portada.
5. **Presupuesto que hay que cumplir:**

   | Métrica | Objetivo |
   |---|---|
   | Primer pintado | < 0,5 s |
   | Página completa en 4G | < 2 s |
   | Saltos de diseño (CLS) | 0 |
   | Tiempo de respuesta (INP) | < 200 ms |
   | Fluidez | 60 fps en escritorio y ≥ 50 en un móvil medio |
   | Contextos WebGL a la vez | Uno solo cuando se pueda |

## 6. Orden de trabajo

1. **Medición de partida:** grabar la carga actual (fría y con caché) con la red y la CPU ralentizadas.
2. **Blender:** acciones `dormir` y `despertar`, renders del robot dormido y reexportar (requiere Blender abierto con el complemento MCP).
3. **Pantalla de carga HTML en `index.html`:** imagen, "z", pecho con `CARGANDO` y barra.
4. **`boot.js`:** carga en paralelo, progreso real y tope de 6 s.
5. **Motor:** prop `sleeping`, cara `sleep`, modo `cargando` de la consola, `compileAsync` y fundido de la imagen al canvas.
6. **El vuelo:** FLIP del canvas a la portada y entrada de la página con `is-booting`.
7. **Casos especiales** del punto 4.
8. **Ligereza:** meshopt, portátil en momento libre, service worker y preload de fuentes.
9. **Verificación:**
   - qué se prueba: `walk.mjs` ampliado para capturar la carga cada 150 ms, con red lenta, caché fría y caliente, móvil, oscuro, claro, "reducir movimiento" y sin WebGL;
   - qué se comprueba: que no se vea nunca la mascota CSS, que el vuelo acabe exactamente en su sitio, CLS 0 y sin errores;
   - qué se entrega: el antes y el después en tiempos.
10. **Documentar** en `CLAUDE.md` y en este plan.

## 7. Criterios de aceptación
- Al recargar no aparece nunca la mascota CSS (salvo sin WebGL).
- El paso de la imagen al 3D no se nota.
- El robot aterriza exactamente en su sitio, sin salto final.
- La barra muestra el progreso real.
- Nadie espera más de lo necesario y nunca más de 6 s.
- Funciona en móvil, en oscuro y claro, con "reducir movimiento" y con teclado (Esc salta la carga).

## 8. Decisiones de Jhon
1. **Cuándo se ve:** ¿en cada recarga o solo la primera vez por sesión? (Recomendado: en cada recarga, pero corta si ya está en caché.)
2. **El viaje:** ¿deslizamiento directo a su sitio, o con un pequeño rebote al aterrizar? (Ojo: la mascota pequeña ya probó un salto en arco y se descartó; esto es solo un asentamiento al llegar.)
3. **¿Las "z" de dormido sí o no?**
4. **Duración mínima:** ¿el robot debe dormir al menos 1 s aunque todo cargue antes, para que se vea la escena? (Recomendado: no, que nunca haga esperar.)
