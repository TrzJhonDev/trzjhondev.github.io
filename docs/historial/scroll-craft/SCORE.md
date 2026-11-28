# Gramática, gesto propio y partitura

## Gramática: "Anfitrión" (nueva)

Escenas distintas presentadas por una anfitriona que está en toda la página: la mascota.

- **Qué es una sección:** una escena que la anfitriona presenta. Cada una tiene su propio truco.
- **Navegación:** la barra fija (marca y "Contáctame"), más la anfitriona. La mascota de la esquina comenta cada escena, mira lo que importa y reacciona a cómo haces scroll. Es la que te dice dónde estás, no un índice ni un contador.
- **Secuencia:** se presenta, enciende la herramienta, enseña el camino y atiende.
- **Final:** una conversación. La anfitriona atiende en persona y las tarjetas son objetos que ella mueve. No hay una isla de botón.
- **Prohíbe:**
  - contadores de sección e indicaciones de "baja";
  - un vuelo de cámara continuo y escenas donde la anfitriona no tenga papel;
  - que la anfitriona camine o salte ligada al scroll (lo descartó Jhon);
  - titulares cinéticos sobre vídeo y vídeo de fondo (`scrub`).

**Por qué no las otras siete:**
- **Película de un plano:** Jhon pidió escenas distintas, no un vuelo continuo.
- **Mundo continuo:** igual que la anterior; además, la mascota tendría que viajar con el scroll.
- **Editorial por capítulos:** el ambiente pedido es juguetón, no el de una revista.
- **Superficie viva:** el portátil sí es una superficie real, pero la gramática prohíbe el titular y la portada con la mascota, que Jhon aprobó.
- **Póster tipográfico:** aquí la imagen es la mascota, no la letra.
- **Galería o catálogo:** prohíbe un titular principal y obliga a etiquetas de museo; el portafolio cuenta una historia con anfitriona.
- **Escenario partido:** no hay dos lados que comparar.
- **Lista rítmica de cortes:** prohíbe fijar escenas, y el pico necesita una escena fijada.

## Gesto propio

**La cara de la mascota sigue tu scroll.** Si bajas rápido se marea (ojos en espiral y la cabeza le da vueltas), si subes rápido se sorprende y mira hacia arriba, y cuando paras te mira y sonríe un momento. Está programado en el motor de la mascota (`engine.js`), en la página. No es un parámetro del kit.

## Filtro de huellas

El registro (`scrollcraft/FINGERPRINTS.md`) está vacío: es la primera construcción y no hay filas con las que chocar.

## Partitura

| Ritmo | Acto | Dispositivo | Por qué |
|---|---|---|---|
| Reconocimiento | 1. Portada | `kinetic` (titular por renglones al cargar) + `parallax` (luz, mascota y suelo en tres planos al salir) | Saludo con impacto; la profundidad viene de capas que se separan, no de un fondo plano |
| Giro (pico) | 2. Encendido | `pin` con su estado movido por el scroll (span ~2,4) | El cuadro se queda quieto y lo que avanza es el portátil: se abre la tapa, corre la BIOS y se encienden las teclas. Es el acto con más recorrido |
| Sustancia | 3. Formación | `reveal` (cortinilla por tarjeta) sobre la pista que se dibuja sola | Calma: cada etapa se descubre cuando la luz llega a ella |
| Compromiso | 4. Contacto | Puntero (la mascota mueve tarjetas reales que puedes arrastrar) | El cierre responde a ti, no al scroll; termina y se queda |

**Comprobaciones:**
- Hay 5 familias de dispositivos (kinetic, parallax, pin, reveal y puntero) y ninguna se repite seguida.
- No hay `scrub` de vídeo.
- El pico tiene el mayor recorrido.
- El acto anterior al pico (el final de la portada) es más tranquilo.
- Son 4 actos y unas 8,5 pantallas en total: fuera de la franja de 6–7 actos y 13,6–13,8 pantallas.

## Actualización (26/11/2026, después de este guion)

Lo que cambió en la página desde la entrevista; el resto del guion sigue valiendo. El detalle está en `CLAUDE.md`.

- **Acto 2 (Encendido):** la pista fijada es de 1,6 pantallas (no 2,4) y, al terminar el encendido, se quita para siempre sin salto: al volver a pasar, Proyectos ya no se fija ("el scroll no hace nada"). El encendido con el scroll va a 60 fps.
- **Acto 3 (Formación):** la "pista de circuito" se sustituyó por un **mapa de niveles** (fichas con volumen sobre un camino que serpentea). La línea azul sigue al scroll y la cabeza de la mascota salta de nivel en nivel, uno a uno y por tiempo; cada tarjeta se descubre al asomar.
- **Acto 4 (Contacto):** switch de puertos con cable (la mascota enchufa el conector), servidor renderizado en Blender y pie de página en el suelo del escenario.
- **Todo el recorrido:** scroll con inercia (Lenis) y barra flotante que se esconde al bajar y subraya la sección activa.
