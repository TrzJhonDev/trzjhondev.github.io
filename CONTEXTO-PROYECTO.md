# Contexto del proyecto (traspaso a otra cuenta de Claude)

Actualizado el **26/11/2026**. Sirve para que un Claude nuevo, sin acceso a las conversaciones ni a la memoria de la cuenta anterior, sepa:
- qué es el proyecto y en qué estado está;
- cómo trabaja Jhon y qué decisiones no hay que pisar;
- qué falta y cómo verificar los cambios.

## 0. Cómo usar este documento

**Prompt de arranque** (primer mensaje en la cuenta nueva):

> Lee `CONTEXTO-PROYECTO.md` completo y luego `CLAUDE.md`, `PLAN-COLORES.md` y el `README.md`. Es el portafolio de Jhon (React + Vite, mascota y portátil modelados en Blender con Three.js). No cambies nada todavía: resúmeme en 10 líneas qué entendiste, qué está pendiente y qué decisiones no debes pisar.

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | **Fuente de verdad técnica** y de decisiones. Claude Code lo carga solo. Es muy denso: léelo entero antes de tocar algo. |
| `PLAN-COLORES.md` | **Fuente de verdad de colores** (paleta azul cielo, tokens, contrastes). |
| `PLAN-MASCOTA-3D.md`, `PLAN-PORTATIL-3D.md`, `PLAN-PANTALLA-CARGA.md` | Planes de la migración a Blender y de la pantalla de carga, con su estado. |
| `scrollcraft/builds/portafolio/BRIEF.md` y `SCORE.md` | Guion de la experiencia de scroll (entrevista con Jhon del 25/11/2026). |
| `README.md` | Manual de uso del sitio (actualizado el 26/11/2026). |
| Este archivo | Lo que no está en el repositorio: cómo trabaja Jhon, historia, pendientes, trucos y memoria. |

Si algo de aquí contradice a `CLAUDE.md` o a los planes, **ganan ellos**: se actualizan con el código.

## 1. Quién es Jhon y cómo prefiere trabajar

- Estudiante de Ingeniería de Sistemas (Universidad Nacional Toribio Rodríguez de Mendoza, Amazonas). Marca: **TrzJhonDev**. Todo en **español**.
- **Muy iterativo y visual.** Manda capturas y vídeos cortos de lo que no le gusta ("se ve pixelado", "parece que da lag", "la cabeza se mueve como con parpadeos"). Hay que leer con precisión qué señala.
- **No quiere suposiciones.** Para decidir diseño pide **propuestas con ejemplos visuales** (unas 4) y que vengan **razonadas** (le gustó una crítica "como experto en teoría del color"). Si nada le convence, pide más ideas: no hay que insistir.
- Quiere una página **viva, limpia, formal, moderna, llamativa, interactiva y fluida**, que no vaya lenta en ningún dispositivo.
- Prefiere **interacción directa sobre el 3D** antes que listas o paneles.
- **Privacidad:**
  - no quiere que se vea su foto ni su cara;
  - nada de micrófono ni de compartir pantalla;
  - sin sonido.
- Los `[MARCADORES]` de `profile.js` los rellena **él**: no inventes datos, enlaces ni cifras.
- Cuando dice "después seguimos con X", espera su confirmación antes de hacerlo.

## 2. El proyecto hoy

**Stack:** React 18 + Vite 5 (JavaScript) y Three.js 0.170. `playwright-core` solo sirve para verificar. Los modelos fuente están en `blender/` (Blender 5.2) y se exportan a `public/models/*.glb` con meshopt.

```
npm run dev    # 5173 (si está ocupado, 5174)
npm run build  # debe pasar sin errores antes de dar algo por terminado
```

**Recorrido de la página:**
1. **Pantalla de carga** (`index.html` + `src/lib/boot.js`): el robot dormido con "CARGANDO" y el progreso real. Despierta y vuela a la portada (FLIP).
2. **Portada:** titular con la voz de la máquina ("> sesión iniciada" / "Sistema listo. Usuario: Jhon.", desde el 26/11/2026; antes era la plantilla "Hola, soy… Construyo <palabra que rota>"). La mascota 3D va a la derecha, con parallax de 3 planos al bajar. Los títulos de sección también hablan así: "Programas instalados", "Historial de versiones", "Abrir conexión".
3. **Proyectos:** en escritorio la sección queda fija ~2,4 pantallas. La mascota pulsa el botón A de su pecho y el scroll enciende el portátil (tapa, BIOS, teclas). A la derecha, una lista quieta de programas (`proyecto-1.app`…): al abrir uno se ve en la pantalla del portátil y la lista despliega sus enlaces.
4. **Formación:** pista de circuito que se enciende con el scroll, con una mini mascota.
5. **Contacto:** escenario donde la mascota 3D pasea y lleva tus tarjetas (mensaje por `mailto:`, copiar correo, GitHub, LinkedIn, CV). Por debajo de 1100 px es una rejilla fija.
6. **Mascota pequeña** en la esquina cuando la portada ya no se ve. Saluda con la mano, sin entrada animada.

**Mascota:** robot con gafas, orejas, headset y micrófono, y una **consola en el pecho** con 3 juegos (Serpiente, Salto, Ladrillos). Si el ratón está quieto 8 s, escribe datos útiles (`tips.js`). Guía con globos (`mascot.js`). Aún **sin nombre**. Hay una versión CSS 3D de respaldo (sin WebGL o mientras carga).

**Portátil:** modelo de Blender dibujado con WebGL sobre las piezas CSS invisibles, que siguen recibiendo los clics (método híbrido). Conserva todo:
- teclas-skill con hologramas;
- terminal con comandos;
- despiece con rompecabezas;
- cargador arrastrable desde una batería portátil;
- temperatura, zoom y vista inferior.

## 3. Estado (26/11/2026)

**Hecho y verificado**
- Build sin errores.
- Recorrido automático en escritorio oscuro y móvil claro: 0 errores de consola y sin desbordes horizontales.
- Peso con gzip: ~100 KB la página, ~14 KB los estilos, ~170 KB Three.js y los motores, ~232 KB los dos modelos.
- 26/11/2026: arreglados dos fallos de móvil:
  - la mascota flotante se solapaba con la de Contacto;
  - los globos se quedaban abiertos encima de otra sección y tenían textos de escritorio ("pasa el puntero", "a la derecha").

**Pendiente**
1. **Datos de `profile.js`** (los pone Jhon): apellido (se ve "[APELLIDO]" en el pie), correo, GitHub, LinkedIn, CV (PDF en `public/`), los **3 proyectos** con capturas (`public/proyectos/`), el ciclo, los años y los 2 certificados. La universidad ya está.
2. **Nombre de la mascota.** Propuestos: Cron, Nodo, Trazo, Bitzy, Trizo.
3. **Rendimiento en móvil real.** Medir en un teléfono. Los planes dejan pendiente unir las mallas fijas del portátil (218 llamadas de dibujo) y decidir si se retira la mascota CSS de respaldo (hoy obliga a mantener dos versiones).
4. **Antes de publicar:**
   - quitar o dejar las páginas de prueba (`?mascota3d`, `?portatil3d`, `?posar`), que van en el build;
   - corregir el pie, que dice "hecho con React, CSS 3D y café" y ahora también usa Three.js;
   - decidir Vercel, Netlify o GitHub Pages.
5. **Orden:** desde el 26/11/2026 hay repositorio git local (sin remoto). El `.gitignore` deja fuera las fotos de `tools/fuente/`, los vídeos, las copias `.blend1` y las capturas de `scrollcraft/…/lab/`.

## 4. Decisiones que no hay que pisar (resumen; el detalle está en `CLAUDE.md`)

- **Paleta azul cielo** desde el 24/11/2026. El morado "purple gothic" se descartó ("se ve muy triste, apagado, la página se ve muerta"): **no volver a proponerlo**.
  - En oscuro, el texto sobre el botón azul es oscuro, por contraste.
  - En claro, la mascota es lo opuesto: blanco perla con detalles azules, nunca gris ni plata.
- **Portátil:**
  - colores físicos fijos (grafito);
  - **placa base verde con trazas doradas y tubo de cobre**;
  - acabado liso, sin aluminio cepillado ni rejillas de puntos;
  - el cable del cargador nunca "sale de la nada" ni da rodeos.
- **Mascota:**
  - sin bordes de contorno;
  - orejas y headset, nunca auriculares de cubo;
  - sin tarjetas de cristal alrededor;
  - en la consola, sin contorno que parpadee ni anillo de foco al jugar;
  - el ecualizador es solo de adorno;
  - no teclea mientras se juega.
- **Descartado por Jhon (no repetir):**
  - el paseo de la mascota ligado al scroll y el salto en arco ("se ve raro, da lag");
  - el cable de circuito de la mascota al portátil (`Bridge.jsx`);
  - la "terminal que carga" en la portada (`HeroLoader.jsx`);
  - el carrusel de tarjetas que bajaba solo (y su botón de Pausar);
  - la etiqueta "Disponible para prácticas" en la portada;
  - el kicker `// proyectos`;
  - las pistas de scroll ("Bajar a…", "Más abajo hay…").
- **Animaciones 3D sin tirones:** las acciones sueltas usan `clampWhenFinished`. En reposo la cabeza no se mueve y la mirada de la cara va ajustada a la rejilla de píxeles. Iluminación sin tono de cine, sin entorno ni luces de color.
- **Rendimiento:**
  - nada de `filter: blur()` en capas grandes o que se mueven;
  - todo bucle se para fuera de pantalla;
  - nunca variables CSS que cambien cada fotograma en un contenedor con muchos descendientes;
  - cuenta las caras 3D antes de añadir piezas.

## 5. Historia

| Fecha | Qué pasó |
|---|---|
| Antes del 19/11 | Otros proyectos (cuarto en Blender, vídeo con scroll, clips con IA). No existen aquí. |
| 19/11 | Reinicio de cero: portátil 3D hecho solo con CSS. |
| 20/11 | Nace la mascota robot (CSS 3D) con guía y compañera del portátil. Plan de color "purple gothic", fases 1–3. Placa verde y cobre; batería para el cargador. |
| 21/11 | Fases 4–5 del morado. Orejas y headset. Consola del pecho con 3 juegos (el ecualizador real con micrófono y después con pantalla compartida, ambos descartados). Arreglo de retraso al seguir el ratón. Skills de Emil Kowalski e Impeccable (solo texto). |
| 24/11 | **Paleta azul cielo**. **Mascota y portátil modelados en Blender** y llevados a la página con Three.js. Nueva Formación (pista de circuito). Contacto rediseñado con escenario. Aparición de la mascota pequeña sin animación. Reglas de rendimiento. |
| 25/11 | Revisión de color razonada (aprobada). **Experiencia de scroll** (skill scroll-craft: el pico "Encendido"). **Pantalla de carga** con el robot dormido. |
| 26/11 | Puente de las gafas rehecho. URLs de modelos con versión. Análisis del proyecto y arreglos de móvil. README y este documento actualizados. Repositorio git creado. |

## 6. Cómo verificar (trucos)

- **Entorno:** Windows 11, Git Bash y PowerShell. **Sin Python** (usa Node; para importar módulos ES usa URLs `file:///C:/...`).
- **Recorrido automático:** `node scrollcraft/builds/portafolio/lab/walk.mjs --url http://localhost:5173/ --out <carpeta> [--mobile] [--dark] [--reduced]`. Usa el Chrome instalado sin ventana y gráficos por software, así que la fluidez real es mejor que lo que mide. Saca capturas por paso, una hoja de contactos y los errores de consola. Guarda las capturas fuera del repositorio o en `lab/`, que está ignorada.
- **Otras herramientas de `lab/`:** `carga.mjs` (pantalla de carga), `poster.mjs` (imágenes del robot con `?posar`) y `video.mjs`.
- **El navegador integrado de Claude** a veces se niega a abrir `localhost`; entonces usa `walk.mjs`. Si funciona, recuerda que va estrangulado (casi no anima) y que hay que restaurar el tamaño de ventana y el tema al terminar.
- **Vite** a veces deja en caché versiones intermedias (`... is not defined`): haz `touch` al archivo que importa y recarga.
- **Blender:** para modelar desde Claude hace falta Blender abierto con el complemento MCP (puerto 9876). Antes de reexportar, compara los nodos con el `.glb` anterior y comprueba la altura de la mascota (~2,86 m). Si cambias el modelo, vuelve a sacar las imágenes de `public/img/`.

## 7. Skills instaladas (`.claude/skills/`)

**No se suben a GitHub** (decisión de Jhon, 26/11/2026): la carpeta está en `.gitignore` y solo existe en su equipo. Si el proyecto se abre en otro equipo, hay que reinstalarlas con los pasos de `CLAUDE.md`. Además de las de abajo, el 26/11/2026 se instaló **taste-skill** (`design-taste-frontend`, de Leonxlnx/taste-skill) y se actualizó Impeccable a la 4.11.1.

- **Emil Kowalski** (20, solo texto): animación y pulido (`animate`, `review-animations`, `improve-animations`, `animation-performance`, `emil-design-eng`, `mobile-native`, `break-ui`…).
- **Impeccable** (solo `SKILL.md` y `reference/`). Jhon eligió no instalar su lanzador ni sus hooks: no los añadas sin su permiso.
- **scroll-craft** (completa, 25/11/2026). Su `kie.mjs` usa una API de pago: solo con la clave de Jhon y su permiso para cada gasto. No hay clave configurada.
- Ninguna manda sobre las decisiones de Jhon.

## 8. Memoria de la cuenta anterior

La cuenta anterior guardaba estas notas. Recréalas si quieres; el contenido está resumido arriba.
- **Vigentes:** *Paleta azul cielo* (y la revisión de color del 25/11), *Mascota robot* (ficha y decisiones; sin nombre), *Proyecto reiniciado* (de cero el 19/11; prefiere interacción directa en el 3D; modo claro y oscuro).
- **Obsoletas:** *Paleta purple gothic* (sustituida), *Referencia espacial* y *Vídeo con scroll-craft* (de proyectos anteriores). De la referencia espacial queda una pista útil: traducir sus palabras de posición a ejes antes de tocar y, si es ambiguo, enseñar un croquis con dos opciones.

## 9. Siguientes pasos sugeridos

1. Que Jhon complete los datos de `profile.js` y elija el nombre de la mascota.
2. Probar en su teléfono y en su navegador con teclado y ratón reales, y recoger capturas.
3. Medir el rendimiento en móvil y, si hace falta, unir las mallas del portátil.
4. Preparar la publicación: pie de página, páginas de prueba, despliegue y un remoto de git (GitHub) si lo quiere.
