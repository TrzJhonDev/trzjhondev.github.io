# Plan: portátil modelado en Blender

**Estado (24/11/2026):** fases 1 a 4 modeladas en `blender/portatil.blend` (colección `Portatil`, interior en `Interior`; ~38.500 triángulos), pendientes de revisión de Jhon (renders `blender/portatil_*.png`). Fase 5 hecha: exportado a `public/models/portatil.glb` (1,3 MB, 264 KB con gzip; 218 mallas) y página de prueba `?portatil3d` (`src/proto/ProtoLaptop.jsx` + `laptop3d.js`: girar arrastrando, teclas de skill con textura de canvas, pantalla con el código coloreado, abrir/cerrar la tapa, despiece, ventilador girando, fps). Fase 6 hecha (24/11/2026): el modelo ya se ve en la página con toda la interacción de antes (método híbrido, ver CLAUDE.md). Pendiente: unir mallas fijas por material para bajar llamadas de dibujo y medir en móvil. Al migrar conviene unir las mallas fijas por material (218 llamadas de dibujo ahora). Ojo: Three.js quita los puntos de los nombres (`bisagra.L` → `bisagraL`).

Notas del archivo: la base es una bandeja hueca (fondo de 2,5 cm + paredes) para que se vea la placa; la tapa (`tapa`) tiene el origen en el eje de la bisagra y gira en X (0 = de pie; −20° = abierta como en la web; +90° = cerrada); la pantalla, la webcam, el logo y la marca cuelgan de ella. Cada tecla es `tecla_<fila>_<col>` con la propiedad `label` y UV de vista superior sobre la capa de 480 × 320. Las piezas del despiece son `pieza_<id>` (los mismos id que `PARTS` de `skills.js`, la gemela del altavoz es `pieza_spk-2`) con el origen en su cara de abajo, a ras de la placa: la web las sube con su `lift`. Las aspas del ventilador (`fan_aspas`) son un objeto aparte para girarlas. El conector (`conector`) tiene el origen en la punta y apunta a +X; el cable de muestra (`cable`) es una curva: en la web se dibuja con un tubo.

Objetivo: rehacer el portátil 3D de Proyectos (hoy CSS 3D, ~2.900 líneas en `src/components/Laptop3D/`) como un modelo de Blender con más detalle, **sin perder nada de lo que hace hoy**: teclas con skills (pulsables y con el teclado físico), pantalla con código y terminal, tapa que se abre y se cierra, despiece con la placa y el rompecabezas, touchpad, botón de encendido, cargador que se arrastra hasta el puerto y batería portátil. Como con la mascota, la CSS se queda de respaldo hasta que la 3D lo haga todo.

## 1. Medidas (de `geometry.js` y `Laptop3D.css`)
1 px de la escena = 1 cm en Blender (igual que la mascota). La CSS tiene Y hacia abajo y Z hacia el espectador; en Blender: `(x, y, z)` → `(x, −z, 14 − y)` cm, con la base apoyada en z = 0 y el frente hacia −Y.

| Pieza | Medida (px) |
|---|---|
| Base | 480 × 320 × 14, esquinas R 14 |
| Hueco del teclado | 396 × 139, R 10 (a 42, 56 de la esquina) |
| Teclado | 6 filas de `keyLayout.js` (ancho 384, separación 3); 15 teclas con skill |
| Touchpad | 170 × 92, R 10 (a 155, 207) |
| Botón de encendido | Ø 16 (a 428, 30) |
| Altavoz | ranura 380 × 4 (a 40, 36) |
| Tapa | 480 × 316, R 16 arriba y 6 abajo, ~6 de grosor; bisagra en z = −158 |
| Pantalla | marco de 14 px (22 abajo), esquinas R 6; webcam arriba |
| Bisagras | dos cilindros R 6 × 96 a x = ±150 |
| Puertos | izquierda: LED, USB-C (carga), USB-C, HDMI; derecha: USB-A, jack |
| Placa (despiece) | 440 × 290, verde `#17402F`, trazas doradas, tubo de cobre, ventiladores |
| Batería portátil | 54 × 22 × 110 con 4 LED; cable al USB-C de carga |

## 2. Modelado
- Piezas separadas y con nombre (`base`, `carcasa_sup`, `tecla_<fila>_<col>`, `touchpad`, `tapa`, `pantalla`, `bisagra.L/R`, …), con biselado suave (acabado satinado y liso, sin texturas de aluminio cepillado ni rejillas de puntos).
- Materiales por papel: `carcasa`, `pared`, `fondo`, `tecla`, `touchpad`, `marco`, `pantalla`, `bisagra`, `puerto`, `led`, `placa`, `cobre`. Colores físicos fijos (no cambian con el tema), los de `--lap-*`.
- Las caras de arriba de las teclas comparten una textura (UV de vista superior en la capa de 480 × 320): en la web se pinta en un canvas con las letras y el color de cada skill.
- La pantalla es un plano con UV 0–1: en la web se pinta con el mismo contenido de `Screen.jsx` (código, terminal, BIOS…).
- La tapa gira sobre el eje de la bisagra (origen del objeto en el eje): la web la abre y la cierra.

## 3. Fases
1. **Blockout** de base, tapa, bisagras, teclado, touchpad y pantalla → revisión de Jhon con capturas.
2. **Detalle**: puertos, LED, webcam, ranuras, tornillos y patas de abajo, etiqueta, marca de la tapa.
3. **Interior** para el despiece: placa verde, CPU, RAM, SSD, batería, ventiladores, tubo de cobre, altavoces.
4. **Cargador**: conector USB-C, cable flexible (huesos) y batería portátil.
5. **Exportar** a `public/models/portatil.glb` y prototipo en la web (página aparte) antes de sustituir nada.
6. **Migración** pieza a pieza manteniendo toda la interacción (teclas, terminal, despiece, rompecabezas, cargador).

## Riesgos
- Es la pieza más interactiva de la página: la migración es larga. Se hace por fases y la CSS sigue mientras tanto.
- Rendimiento: un solo contexto WebGL para el portátil; se para fuera de pantalla como ahora.
