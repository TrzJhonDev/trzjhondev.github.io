# Plan: mascota modelada en Blender (prototipo para decidir)

**Estado (24/11/2026):** prototipo aprobado por Jhon. Migración en marcha: **fase 1 hecha** (portada con `Mascot3D`, consola real conectada a la pantalla del modelo). **Fase 2 hecha** (esquina y Contacto en 3D con `MascotAuto`, modelo compartido) y **fase 3 hecha** (miniatura de Formación = render del modelo). Pendiente: fase 4 (rendimiento en móvil, quitar la versión CSS cuando ya no haga falta como respaldo).

Objetivo: modelar la mascota en Blender, animarla y probarla en la web **sin tocar la mascota actual** (CSS 3D), para comparar y decidir si conviene cambiarla. Si no convence, se descarta sin coste para la página.

## 0. Qué se compara (criterios de decisión)

| Criterio | Mascota actual (CSS 3D) | El prototipo conviene si… |
|---|---|---|
| Aspecto | ~1.700 caras planas, curvas facetadas | se ve más redonda y limpia en oscuro y en claro, y a Jhon le gusta más |
| Animación | solo gira piezas (cabeza, brazos) | camina, salta y saluda con movimientos naturales |
| Fluidez | bucle que recalcula sombras por cara | ≥ 55 fps en escritorio y en un móvil medio |
| Peso | 0 KB extra | ≤ 250 KB comprimidos extra (Three.js + modelo), cargados en diferido |
| Estilo | igual al portátil (CSS) | no desentona con el portátil CSS |

## 1. Preparación
- Blender abierto con el complemento MCP activo y su servidor arrancado (puerto 9876), para que Claude pueda modelar desde aquí.
- Archivo `blender/mascota.blend` (fuera de `src/`). Unidades: 1 unidad de diseño del código = 1 cm (la cabeza mide 1,86 m de ancho en Blender; se escala al exportar).
- Ejes: el código usa Y hacia abajo; en Blender Z es arriba. Se modela de pie sobre el origen y mirando a −Y (frente).

## 2. Blockout con las medidas actuales (`Mascot.jsx`)
| Pieza | Medidas (ancho × alto × fondo, radio de esquina) |
|---|---|
| Cabeza | 186 × 146 × 130, R 40 |
| Cuerpo | 116 × 96 × 88, R 22 (centro 66 bajo el cuello) |
| Cuello | cilindro Ø 40 × 16 |
| Hombros | discos Ø 26 × 12 (a ±61) |
| Brazos | 24 × 64 × 24, R 11, con muñeca 26 × 9 |
| Pies | 44 × 60 × 18, R 9 (a ±30, y 121) |
| Orejas | discos Ø 42 × 12 con botón Ø 22 (color auricular) |
| Diadema | contorno de la cabeza separado 5, grosor 5 |
| Micrófono | varilla por la curva de `BOOM` (4 puntos) con cápsula Ø 13 y tapa Ø 10 |
| Gafas | dos marcos + puente, delante de la pantalla de la cara |
| Pantalla de la cara | 160 × 124 (proporción para la textura) |
| Consola del pecho | pantalla 96 × 54 + cruceta, botones A/B y ecualizador |

## 3. Modelado limpio
- Cubos con *Bevel* (segmentos 6–8) y *Weighted Normal*: curvas suaves sin franjas, pocas caras.
- Meta: ≤ 8.000 triángulos en total. Cada pieza con nombre claro (`cabeza`, `cuerpo`, `brazo.L`…).
- Materiales por papel, no por color: `carcasa`, `articulacion`, `auricular`, `boton`, `pantalla_cara`, `pantalla_consola`, `marco`. La web los recolorea según el tema con `THEMES` de `Mascot3D/engine.js`: marfil y mandarina desde el 26/11/2026, la misma identidad en los dos temas (en claro el marfil va algo más tostado); `orejaL`, `orejaR` y `diadema` usan el material de las articulaciones en el modelo y el motor les pone el del auricular (`ACCENT_PIECES`). Ver `PLAN-COLORES.md`.
- Estilo: acabado satinado y limpio (como la carcasa del portátil), sin bordes de contorno (decisión de Jhon).

## 4. Pantallas (cara y consola)
- La cara y la consola son planos con UV de 0 a 1 y la proporción exacta (160 × 124 y 96 × 54).
- En la web se pintan con texturas de canvas: la cara de píxeles (`Face.jsx`) y la consola con sus 3 juegos (`Console.jsx`, ya es un canvas de 512 × 288). Así se conservan expresiones, datos y juegos.

## 5. Esqueleto (rig)
- Huesos: `raiz` → `cuerpo` → `cuello` → `cabeza` (gafas, orejas, diadema y micrófono cuelgan de la cabeza); `hombro.L/R` → `brazo.L/R` → `mano.L/R`; `pie.L/R`.
- Robot rígido: cada pieza va pegada entera a su hueso (sin deformar), más simple y más "de robot".
- La web mueve el hueso `cabeza` para seguir el puntero, como ahora.

## 6. Animaciones (acciones de Blender)
Mismas acciones y duraciones que la mascota actual (`ACT` en `Mascot.jsx`), más las que hoy no se pueden hacer bien:

| Acción | Duración | Notas |
|---|---|---|
| `reposo` | 3 s en bucle | respiración y balanceo leve |
| `saludo` (wave) | 2,4 s | bienvenida |
| `hola` (hi) | 1,5 s | la pequeña al aparecer |
| `susto` (startle) | 0,9 s | |
| `risa` (laugh) | 1,4 s | |
| `celebrar` (cheer) | 1,1 s | |
| `teclear` | bucle | con el mini teclado |
| `caminar` | bucle | nueva (para probar si aporta) |
| `salto` | 1 s | nueva |

Las expresiones siguen en la textura de la cara, no en el modelo.

## 7. Exportar
- glTF 2.0 binario (`.glb`) con animaciones, modificadores aplicados y Y arriba.
- Compresión meshopt o Draco. Meta: modelo ≤ 400 KB.
- Destino: `public/models/mascota.glb`.

## 8. Prototipo en la web (aislado)
- Página de prueba aparte (por ejemplo `?mascota3d=1`), cargada en diferido: no afecta a la página normal.
- Three.js (con o sin React Three Fiber, lo decide el peso): `AnimationMixer` para las acciones, hueso `cabeza` hacia el puntero, clic = susto o risa, colores de material por tema, texturas de cara y consola.
- Solo la mascota de la portada. Si se adopta, después se decide cómo hacer la de la esquina y la de Contacto (un solo renderizador compartido para no abrir varios contextos WebGL).
- Con "reducir movimiento": pose fija; por debajo de 900 px se mide si aguanta en móvil.

## 9. Evaluación y decisión
1. Captura lado a lado: actual vs. prototipo, en oscuro y en claro.
2. Medir: fps y tiempo por fotograma (Chrome Performance), peso añadido, tiempo de carga.
3. Jhon decide con la tabla del punto 0. Si sí: plan de migración (consola, guía, mini, Contacto, Formación). Si no: se borra el prototipo y queda la mascota actual.

## Riesgos
- Estilo distinto al portátil (que sigue en CSS): se mitiga con materiales limpios y la misma luz desde arriba a la izquierda.
- Tres mascotas = tres contextos WebGL: hay que compartir renderizador si se adopta.
- Más dependencias (Three.js): solo se cargan cuando la mascota está cerca de verse.

## Orden de trabajo
1 y 2 (blockout) → revisión de Jhon con capturas de Blender → 3 a 5 → revisión → 6 y 7 → 8 → 9.
