# Plan de colores: azul cielo (base limpia + azul vivo)

Estado (24/11/2026): **aplicado en toda la página** (tokens de `index.css`, portátil, mascota, skills, resaltado de código, terminal y consola de la mascota). Sustituye por completo al plan anterior "purple gothic" (morado vino ciruela, 20/11/2026), que Jhon descartó: "el morado se ve muy triste, apagado, la página se ve muerta".

## 1. Cómo se eligió

Jhon probó varias rondas de propuestas (paletas formales, mezclas con fondos tintados, combinaciones de la web, de marcas conocidas y de temas de editor) en un probador con contraste. Eligió:

> «Azul y naranja · Figma (ajustada)»: principal 199°, apoyo 207°, intensidad 90 %, fondo oscuro 6 %, fondo claro `#FAF8F4`.

Es decir: **un azul cielo vivo** como protagonista y **un azul algo más profundo** de apoyo (el naranja de la combinación original lo cambió él mismo por azul), sobre una base limpia: casi negro con un toque azul en oscuro y blanco cálido en claro. Lo que pidió: que se vea viva, limpia y formal, sin ser chillona ni cansar la vista.

## 2. Paleta

### Cruda (`index.css`)
`--sky-200 #8FD8FF` · `--sky-300 #5CC6F7` · `--sky-400 #2AB4F4` · `--sky-600 #097AAE` · `--sky-700 #0973A5` · `--sky-800 #075F88` · `--sky-900 #05405C` · `--sky-650 #0879B8` · `--sky-750 #0A70B4` · `--azure-400 #2A99F4` · `--azure-700 #0968B6` · `--indigo-400 #4C8DF6` · `--indigo-700 #2F63D6`

### Tokens
| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0C0E13` | `#FAF8F4` | Fondo |
| `--surface` / `--surface-2` | `#12151B` / `#181C24` | `#FFFFFF` / `#F1EEE8` | Tarjetas |
| `--line` / `--line-2` | `#222731` / `#343A46` | `#E3DFD7` / `#CFCAC0` | Bordes |
| `--text` | `#F2F4F7` | `#1A1D24` | Texto |
| `--muted` / `--muted-2` | `#B4BAC6` / `#8B93A1` | `#4A505C` / `#5E6470` | Texto secundario |
| `--accent` | `#2AB4F4` | `#0879B8` | Relleno de botones |
| `--on-accent` | `#0C0E13` (oscuro sobre el azul) | `#FFFFFF` | Texto sobre el botón |
| `--accent-hover` | `#5CC6F7` | `#075F88` | |
| `--accent-ink` | `#2AB4F4` | `#0A70B4` | Texto de color, enlaces, titular |
| `--accent-2` | `#4C8DF6` (217°) | `#2F63D6` (221°) | Apoyo: `// kicker` y etiquetas (nunca en lo que se pulsa) |
| `--accent-rgb` | `42, 180, 244` | `8, 121, 184` | Brillos |
| `--haze-rgb` | `42, 180, 244` | `96, 178, 240` | Luces de ambiente: halo, niebla, aura de la mascota |
| `--link-hover` / `--focus` | `#8FD8FF` | `#05405C` / `#075F88` | |
| `--silver` | `#BCC2CC` | `#868C97` | Único gris de apoyo (filete al pasar el puntero) |
| `--ok` | `#5FD39A` | `#1F8A5B` | Solo el punto de "disponible" |
| `--danger` | `#FF6B6B` | `#C62828` | Errores: siempre con icono, borde de 2 px y mensaje |
| `--cta-*` | `--surface` / `--text` / `--muted` | `--surface` / `--text` / `--muted` | Bloque "¿Trabajamos juntos?" (sigue el tema) |

### Revisión de color (25/11/2026, aprobada por Jhon)
1. Azul del modo claro más vivo (`#0879B8` / `#0A70B4`), más cerca del cielo del oscuro: antes se veía "corporativo" y apagado.
2. Azul de apoyo separado hacia el índigo (217–222°): a 8° del principal (199° frente a 207°) no se distinguía.
3. En la portada solo un renglón del titular en azul (la palabra que rota); "Construyo" va en el color del texto. El azul saturado se reserva para lo que destaca o se pulsa.
4. Luces de ambiente del claro con `--haze-rgb` (azul más claro y saturado): el azul de texto a poca opacidad sobre el crema se veía como una mancha gris verdosa.
5. Contacto: lo pendiente (dato de `profile.js` aún marcador) va con borde discontinuo, texto gris y la palabra "pendiente", no con el azul a medio apagar (parecía un fallo).

### Contraste (WCAG AA)
- Oscuro: `--accent-ink` 8,2:1 sobre el fondo (7,3 sobre `--surface-2`); `--accent-2` 6,4 (5,7); `--muted-2` 6,2 (5,5); `--danger` 7,0; botón 8,2.
- Oscuro, apoyo nuevo: `--accent-2` `#4C8DF6` 5,9:1 sobre el fondo (5,6 sobre `--surface`).
- Claro: `--accent-ink` 5,0:1 sobre el fondo (4,55 sobre `--surface-2`); `--accent-2` 5,1 (4,7); `--muted-2` 5,6 (5,1); `--danger` 5,3; botón 4,7 con blanco (hover 7,0).

## 3. Portátil, mascota, código y terminal

- **Portátil**: carcasa grafito (igual que antes); pantalla casi negra azulada `#08131B`; LED, batería cargando, barra de arranque, prompt y rompecabezas completado en `#8FD8FF`; error/calor máximo/batería baja en `#FF6B6B`; puntos de ventana `#8C8C92`, `#BDBBC6`, `#2AB4F4`. **La placa base sigue verde con trazas doradas y el tubo de calor de cobre** (decisión expresa de Jhon, no cambian con el tema).
- **Skills por categoría** (`CATEGORY_COLORS` en `skills.js`): Lenguajes `#2AB4F4` · Web `#8FD8FF` · Datos `#4FD1C5` (turquesa) · Herramientas `#BCC2CC` (plata) · Fundamentos `#5B8DEF`.
- **Resaltado de código** (`.tk--*`): palabra clave `#5CC6F7`, función `#8FA8E8`, texto `#8FC9A8`, número `#D9A27A`, tipo `#D9B97A`, constante `#F78C6C`, etiqueta `#F07178`, atributo `#8FC7D9`, comentario `#6B7686`. Variado pero sin chillar.
- **Terminal** (`useTerminal.js`): prompt y títulos `#8FD8FF`, error `#FF6B6B`, azul `#5B8DEF`, texto `#E6E8EC`.
- **Mascota** (`--m-*` en `Mascot.css` y `THEMES` en `Mascot3D/engine.js`): MARFIL Y MANDARINA desde el 26/11/2026 (Jhon eligió la opción A de cuatro paletas alegres; las de grafito/perla, marino y acero se veían frías). La misma identidad en los dos temas con la regla 60-30-10: carcasa marfil cálido (60 %; en claro algo más tostada para separarse del crema), articulaciones grafito `#2E3138` (30 %) y acento mandarina `#FF8A3D` / `#F27A2E` en claro (10 %: orejas, auriculares, diadema, micrófono y botones). La mandarina es el complementario del azul cielo, así que la mascota se hace notar sin competir con los botones azules. Ojos y pantallas, azul cielo claro.

- **Objetos físicos de Contacto**: el servidor es un render de Blender (`public/img/servidor.webp`, grafito y metal, una sola imagen para los dos temas) con luces `#8FD8FF`; el conector es grafito y metal salvo su cuerpo, del color del cable (`--muted`). Los módulos del switch y el puerto integrado siguen el tema con `color-mix` de `--text`; al enchufar, el canto toma el color de la marca (`--edge` por puerto) y la luz del puerto es `--accent` (en línea) o `--danger` (sin señal), siempre con la palabra.
- **Formación (mapa de niveles)**: todo con tokens. Camino `--line-2` punteado y la parte recorrida `--accent-ink`; ficha superada `--accent` con `--on-accent`; nivel actual con borde `--accent-ink`; bloqueado con borde discontinuo `--line-2`. Cada estado lleva su palabra ("superado", "nivel actual", "bloqueado").
- **Barra del navegador en el móvil** (`theme-color`): el `--bg` del tema (`#0C0E13` / `#FAF8F4`), lo cambian el script de `index.html` y `applyTheme()`.

## 4. Reglas
- Usa los tokens; no escribas hex nuevos en la página. El portátil, la mascota y los objetos de Contacto tienen sus colores físicos fijos (arriba).
- Ningún estado se comunica solo con color.
- Si cambias un token, vuelve a comprobar el contraste en los dos modos (texto ≥ 4,5:1).
