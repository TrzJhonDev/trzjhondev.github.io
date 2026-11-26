// ─────────────────────────────────────────────────────────────
//  DATOS QUE "ESCRIBE" LA MASCOTA EN LA PANTALLITA DEL PECHO cuando no mueves el ratón un rato.
//  Cada dato son hasta 4 líneas de 17 caracteres como máximo (la pantalla es pequeña y la letra grande para que se lea
//  bien; una línea más larga se parte sola por las palabras, pero así queda más limpio). La primera línea que
//  empieza por // se pinta atenuada, como un comentario. Son datos generales, útiles y ciertos: no dicen nada de ti.
//  Edítalos, quítalos o añade los tuyos.
// ─────────────────────────────────────────────────────────────

export const TIPS = [
  ['// Git', 'git switch -c rama', 'crea y cambia'],
  ['// Git', 'git stash', 'guarda tu trabajo', 'sin hacer commit'],
  ['// Git', 'git log --oneline', 'historial corto'],
  ['// Git', 'git diff --staged', 'muestra lo preparado'],
  ['// VS Code', 'Ctrl+P: abre un', 'archivo al vuelo'],
  ['// VS Code', 'Ctrl+Shift+P: la', 'paleta de comandos'],
  ['// terminal', 'Ctrl+R busca en', 'tus comandos viejos'],
  ['// terminal', 'Ctrl+C corta un', 'proceso en curso'],
  ['// Linux', 'chmod +x f.sh', 'da permiso de', 'ejecución'],
  ['// Docker', 'docker ps -a', 'lista contenedores'],
  ['// JavaScript', 'const por defecto', 'let si cambia'],
  ['// JavaScript', '=== compara tipo', 'y valor'],
  ['// Python', 'enumerate(lista)', 'da índice y valor'],
  ['// Python', 'venv aísla las', 'dependencias'],
  ['// React', 'key única en cada', 'elemento de lista'],
  ['// CSS', 'gap en vez de', 'margin en flex/grid'],
  ['// CSS', 'min-height:100svh', 'evita el salto', 'de la barra móvil'],
  ['// SQL', 'WHERE filtra filas;', 'HAVING, grupos'],
  ['// SQL', 'los índices dan', 'lecturas rápidas,', 'escrituras lentas'],
  ['// HTTP', '200 ok, 201 creado,', '204 sin contenido'],
  ['// HTTP', '404: no existe', '500: falló el server'],
  ['// Redes', 'puerto 443: HTTPS', 'puerto 80: HTTP'],
  ['// Big O', 'búsqueda binaria:', 'O(log n)'],
  ['// bits', '1 byte = 8 bits', '1 KiB = 1024 B'],
  ['// ASCII', "'A' = 65", "'a' = 97"],
  ['// a11y', 'contraste AA:', '4,5:1 en texto'],
];
