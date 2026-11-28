# BRIEF: portafolio de Jhon (TrzJhonDev)

Entrevistado el 25/11/2026 (respuestas de Jhon elegidas en dos rondas de preguntas). Se transforma la página real (React + Vite), no una página aparte: Jhon eligió "Transformar la actual", conservando la mascota 3D, el portátil, la consola y todas las decisiones de `CLAUDE.md`.

## Las ocho preguntas

1. **Ambiente:** "Juguetón con la mascota". La mascota es la anfitriona: te acompaña, reacciona y hace la visita divertida.
2. **El recorrido, en su orden:** el de la página que ya aprobó. Portada (la mascota saluda), Proyectos (el portátil con sus skills), Formación (la pista de circuito), Contacto (la mascota atiende). *Decisión tomada aquí: no se preguntó otro orden porque es el que Jhon construyó sección a sección.*
3. **Curva de energía:** "Fuerte al inicio y al final". La portada tiene impacto, el centro es tranquilo para leer y Contacto es el gran cierre animado.
4. **El momento a recordar:** "Mascota y portátil". Para hacerlo: "Pulsa un botón en su consola". La mascota pulsa el botón A de su pecho y el portátil arranca, como un mando a distancia. Recordatorio: Jhon descartó antes que la mascota caminara o saltara con el scroll ("se ve raro, da sensación de lag"). Nada de eso vuelve.
5. **Lo que ningún otro sitio hace (gesto propio):** "La mascota reacciona al scroll". Su cara cambia según la velocidad: si bajas rápido se marea, si subes se sorprende y si paras te mira y sonríe.
6. **Distancia del premium-minimal:** juguetona, por la respuesta 1. Se mantiene el suelo técnico (contraste AA, tokens, movimiento con `transform` y `opacity`).
7. **Un mundo o escenas:** "Escenas distintas". Cada sección es su propia escena con su propio truco.
8. **Recursos:** "Solo lo que ya hay". Mascota y portátil de Blender, renders y código. Sin kie.ai, sin gasto y sin fotos (Jhon no quiere que se vea su cara).

## Curva de sensaciones (antes de los actos)

| Acto | Sensación | Qué la provoca en pantalla |
|---|---|---|
| 1. Portada | Simpatía | El titular llega por renglones y la mascota saluda; al bajar, la luz, la mascota y el suelo se separan en tres planos |
| 2. Encendido (Proyectos) | Asombro | Silencio (portátil cerrado y oscuro, solo el logo); la mascota pulsa A en su pecho y, al bajar, la tapa se abre, corre la BIOS y las teclas se encienden de izquierda a derecha |
| 3. Formación | Confianza | La pista se enciende y cada tarjeta se descubre cuando la luz llega a ella; sin prisas |
| 4. Contacto | Complicidad | La mascota pasea, lleva tus tarjetas y se pone triste si se las quitas |

Ningún par de actos vecinos comparte sensación.

## El pico

**"Un robot se pulsa el botón del pecho y, mientras bajas, enciende un portátil: se abre la tapa, arranca y se le iluminan las teclas."** Vive en el acto 2 (Encendido). Es el acto con más recorrido de la página (fijado unas 2,4 pantallas de scroll), y el final de la portada, justo antes, es tranquilo (los planos se separan despacio).

## Frase para un amigo

"Es el sitio donde un robot enciende un portátil con un botón de su pecho mientras bajas, y se marea si haces scroll muy rápido."

## Silencios a propósito

- Al empezar el acto 2: el portátil cerrado y oscuro, con solo el logo encendido, durante el primer tramo del scroll fijado (antes de que la mascota pulse). No es scroll muerto: es la pausa antes del pico.

## Reglas que vienen de Jhon (`CLAUDE.md`)

- La mascota no camina ni salta ligada al scroll; la pequeña aparece en su esquina y saluda.
- Sin audio, sin morado, sin bordes en la mascota; portátil con colores físicos fijos (grafito, placa verde, tubo de cobre).
- Todo bucle se para fuera de pantalla; nada de `filter: blur()` en capas que se mueven.

## Actualización (26/11/2026, después de este guion)

Lo que cambió en la página desde la entrevista; el resto del guion sigue valiendo. El detalle está en `CLAUDE.md`.

- **Acto 2 (Encendido):** la pista fijada es de 1,6 pantallas (no 2,4) y, al terminar el encendido, se quita para siempre sin salto: al volver a pasar, Proyectos ya no se fija ("el scroll no hace nada"). El encendido con el scroll va a 60 fps.
- **Acto 3 (Formación):** la "pista de circuito" se sustituyó por un **mapa de niveles** (fichas con volumen sobre un camino que serpentea). La línea azul sigue al scroll y la cabeza de la mascota salta de nivel en nivel, uno a uno y por tiempo; cada tarjeta se descubre al asomar.
- **Acto 4 (Contacto):** switch de puertos con cable (la mascota enchufa el conector), servidor renderizado en Blender y pie de página en el suelo del escenario.
- **Todo el recorrido:** scroll con inercia (Lenis) y barra flotante que se esconde al bajar y subraya la sección activa.
