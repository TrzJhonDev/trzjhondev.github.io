// ─────────────────────────────────────────────────────────────
//  SKILLS. Cada skill es una tecla de color del teclado del portátil 3D
//  (orden en Laptop3D/keyLayout.js). Al elegirla, el portátil escribe su `code` y al
//  ejecutar el código (botón, touchpad o clic en la pantalla) muestra su `out`.
//
//  El color de la tecla, el holograma y el brillo sale de la categoría (CATEGORY_COLORS, abajo).
//
//  Para agregar una skill: copia un bloque, cambia el id (único),
//  el nombre, la categoría (una de CATEGORIES), el `badge` (texto corto
//  del icono), el lenguaje para colorear el código (lang: py, js, jsx, java, cpp, html,
//  sql, sh, docker, asm) y el código.
//  explode: true → al elegirla se abre la vista despiece.
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = ['Lenguajes', 'Web', 'Datos', 'Herramientas', 'Fundamentos'];

const RAW_SKILLS = [
  {
    id: 'py', lang: 'py', name: 'Python', cat: 'Lenguajes', file: 'fibonacci.py', badge: 'py',
    code: ['def fibonacci(n):', '    a, b = 0, 1', '    for _ in range(n):', '        a, b = b, a + b', '    return a', '', 'print(fibonacci(10))'],
    out: ['$ python fibonacci.py', '55'],
  },
  {
    id: 'java', lang: 'java', name: 'Java', cat: 'Lenguajes', file: 'Main.java', badge: 'java',
    code: ['public class Main {', '  public static void main(String[] args) {', '    System.out.println("Hola, mundo");', '  }', '}'],
    out: ['$ java Main', 'Hola, mundo'],
  },
  {
    id: 'js', lang: 'js', name: 'JavaScript', cat: 'Lenguajes', file: 'app.js', badge: 'JS',
    code: ["const skills = ['js', 'react', 'node'];", '', 'skills.forEach((s) => {', "  console.log('Aprendiendo ' + s);", '});'],
    out: ['$ node app.js', 'Aprendiendo js', 'Aprendiendo react', 'Aprendiendo node'],
  },
  {
    id: 'cpp', lang: 'cpp', name: 'C++', cat: 'Lenguajes', file: 'main.cpp', badge: 'C++',
    code: ['#include <iostream>', '', 'int main() {', '  std::cout << "Hola, mundo";', '  return 0;', '}'],
    out: ['$ g++ main.cpp && ./a.out', 'Hola, mundo'],
  },
  {
    id: 'html', lang: 'html', name: 'HTML y CSS', cat: 'Web', file: 'index.html', badge: '</>',
    code: ['<section class="hero">', '  <h1>Hola, soy Jhon</h1>', '</section>', '', '<style>', '  .hero { display: grid; }', '</style>'],
    out: ['Página renderizada en el navegador'],
  },
  {
    id: 'react', lang: 'jsx', name: 'React', cat: 'Web', file: 'Card.jsx', badge: 'Re',
    code: ['export function Card({ title }) {', '  return (', '    <article className="card">', '      <h2>{title}</h2>', '    </article>', '  );', '}'],
    out: ['$ npm run dev', 'Componente <Card /> montado'],
  },
  {
    id: 'node', lang: 'js', name: 'Node.js', cat: 'Web', file: 'server.js', badge: 'node',
    code: ["import express from 'express';", '', 'const app = express();', "app.get('/', (req, res) => res.send('ok'));", 'app.listen(3000);'],
    out: ['$ node server.js', 'Servidor escuchando en :3000'],
  },
  {
    id: 'sql', lang: 'sql', name: 'SQL', cat: 'Datos', file: 'consulta.sql', badge: 'SQL',
    code: ['SELECT nombre, nota', 'FROM estudiantes', 'WHERE nota >= 14', 'ORDER BY nota DESC;'],
    out: ['nombre | nota', 'Ana    | 18', 'Luis   | 16', '(2 filas)'],
  },
  {
    id: 'mongo', lang: 'js', name: 'MongoDB', cat: 'Datos', file: 'proyectos.js', badge: '{ }',
    code: ['db.proyectos', "  .find({ estado: 'activo' })", '  .sort({ fecha: -1 })', '  .limit(5);'],
    out: ["[ { nombre: 'portafolio', estado: 'activo' } ]"],
  },
  {
    id: 'git', lang: 'sh', name: 'Git', cat: 'Herramientas', file: 'terminal', badge: 'git',
    code: ['$ git checkout -b feature/login', '$ git add .', '$ git commit -m "feat: login"', '$ git push origin feature/login'],
    out: ['[feature/login 3f2a1c9] feat: login', 'Rama enviada a origin'],
  },
  {
    id: 'linux', lang: 'sh', name: 'Linux', cat: 'Herramientas', file: 'bash', badge: '$_',
    code: ['$ ls -la ~/proyectos', '$ chmod +x deploy.sh', '$ ./deploy.sh'],
    out: ['Permisos actualizados', 'Despliegue completado'],
  },
  {
    id: 'docker', lang: 'docker', name: 'Docker', cat: 'Herramientas', file: 'Dockerfile', badge: 'dock',
    code: ['FROM node:20-alpine', 'WORKDIR /app', 'COPY . .', 'RUN npm install', 'CMD ["npm", "start"]'],
    out: ['$ docker build -t portafolio .', 'Imagen construida', 'Contenedor en marcha'],
  },
  {
    id: 'eda', lang: 'py', name: 'Estructuras de datos', cat: 'Fundamentos', file: 'lista.py', badge: '[ ]',
    code: ['class Nodo:', '    def __init__(self, valor):', '        self.valor = valor', '        self.siguiente = None', '', 'n = Nodo(5)'],
    out: ['Nodo creado: valor = 5'],
  },
  {
    id: 'redes', lang: 'sh', name: 'Redes', cat: 'Fundamentos', file: 'terminal', badge: 'IP',
    code: ['$ ping -c 3 192.168.1.1'],
    out: ['64 bytes desde 192.168.1.1: tiempo=2 ms', '3 enviados, 3 recibidos'],
  },
  {
    id: 'arq', lang: 'asm', name: 'Arquitectura de computadoras', cat: 'Fundamentos', file: 'suma.asm', badge: 'CPU', explode: true,
    code: ['; suma dos números', 'MOV  AX, 5', 'ADD  AX, 3', 'HLT'],
    out: ['AX = 8'],
  },
];

// El color de cada skill sale de su categoría (un tono por categoría dentro de la familia azul, más un turquesa para Datos y plata para Herramientas)
export const CATEGORY_COLORS = {
  Lenguajes: '#2AB4F4',
  Web: '#8FD8FF',
  Datos: '#4FD1C5',
  Herramientas: '#BDBBC6',
  Fundamentos: '#5B8DEF',
};
export const SKILLS = RAW_SKILLS.map((s) => ({ ...s, color: CATEGORY_COLORS[s.cat] }));

// Piezas internas del portátil (vista despiece). Coordenadas en px sobre la placa base de 440×290.
// lift: cuánto se eleva la pieza sobre la placa en el despiece (px).
// mirror: true → se dibuja también su gemela al otro lado de la placa.
export const PARTS = [
  { id: 'bat', name: 'Batería', short: 'BATERÍA', l: 48, t: 168, w: 344, h: 100, r: '10px', bg: '#2B2E35', lift: 26,
    info: 'Alimenta todos los componentes cuando el portátil no está enchufado. Su capacidad se mide en Wh.' },
  { id: 'spk', name: 'Altavoces', short: '', speaker: true, mirror: true, l: 12, t: 24, w: 22, h: 130, r: '6px', bg: '#1E2026', lift: 34,
    info: 'Convierten la señal eléctrica en sonido. Van a los lados para que el audio salga hacia el usuario.' },
  { id: 'wifi', name: 'Tarjeta Wi-Fi', short: 'Wi-Fi', l: 44, t: 98, w: 56, h: 40, r: '4px', bg: '#2A3A33', lift: 44,
    info: 'Conecta el equipo a redes inalámbricas y Bluetooth. Sus antenas suelen ir por el marco de la pantalla.' },
  { id: 'ram', name: 'Memoria RAM', short: 'RAM', l: 110, t: 40, w: 84, h: 40, r: '4px', bg: '#22324A', lift: 52,
    info: 'Guarda los datos que los programas están usando ahora mismo. Es muy rápida, pero se borra al apagar el equipo.' },
  { id: 'ssd', name: 'Almacenamiento SSD', short: 'SSD', l: 110, t: 96, w: 84, h: 30, r: '4px', bg: '#2A2D34', lift: 44,
    info: 'Guarda de forma permanente el sistema operativo, tus proyectos y archivos. No tiene partes móviles, por eso es rápido.' },
  { id: 'cpu', name: 'Procesador (CPU)', short: 'CPU', l: 222, t: 50, w: 64, h: 64, r: '6px', bg: '#2A2D34', lift: 60,
    info: 'Ejecuta las instrucciones de los programas, una tras otra, miles de millones de veces por segundo. Es donde corre tu código.' },
  { id: 'pipe', name: 'Tubo de calor', short: '', pipe: true, l: 250, t: 76, w: 100, h: 12, r: '6px', bg: '#B87333', lift: 92,
    info: 'Tubo de cobre con un líquido dentro que se evapora con el calor de la CPU y lo lleva hasta el ventilador.' },
  { id: 'fan', name: 'Ventilador', short: '', fan: true, l: 322, t: 36, w: 72, h: 72, r: '50%', bg: '#1B1D22', lift: 70,
    info: 'Saca el calor del procesador. Si la CPU se calienta demasiado, baja su velocidad para protegerse.' },
];
