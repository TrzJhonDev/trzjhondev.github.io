// ─────────────────────────────────────────────────────────────
//  TUS DATOS. Edita este archivo para personalizar el portafolio.
//  Todo lo que está entre [CORCHETES] es un marcador por completar.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Jhon',
  lastName: '[APELLIDO]',
  brand: 'TrzJhonDev', // nombre de la barra de arriba y logo de la tapa del portátil 3D
  role: 'Estudiante de Ingeniería de Sistemas',
  university: 'Universidad Nacional Toribio Rodríguez de Mendoza',
  city: 'Amazonas',
  available: true, // "Prácticas pre-profesionales" al final de Formación y el estado en la terminal del portátil
  // Titular de la portada, con la voz de la máquina (elegido por Jhon el 26/11/2026). {name} = name.
  // kicker: la línea de consola de encima; title: primer renglón; accent: el renglón en azul.
  hero: { kicker: '> sesión iniciada', title: 'Sistema listo.', accent: 'Usuario: {name}.' },
  bio: 'Escribo web, ordeno bases de datos y automatizo lo que se repite.',
  cvUrl: '#', // p. ej. '/cv-jhon.pdf' (pon el PDF en la carpeta /public)
  email: '[TU CORREO]',
  github: '#',
  linkedin: '#',
};

// Para agregar un proyecto, copia un bloque { ... } y cambia los datos.
// image: ruta a una captura en /public (p. ej. '/proyectos/tienda.png') o null.
export const projects = [
  {
    title: '[PROYECTO 1]',
    description: '[Qué problema resuelve y qué hiciste tú, en una o dos frases.]',
    tags: ['React', 'Node.js', 'SQL'],
    image: null,
    code: '#',
    demo: '#',
  },
  {
    title: '[PROYECTO 2]',
    description: '[Qué problema resuelve y qué hiciste tú, en una o dos frases.]',
    tags: ['Python', 'MongoDB'],
    image: null,
    code: '#',
    demo: '#',
  },
  {
    title: '[PROYECTO 3]',
    description: '[Qué problema resuelve y qué hiciste tú, en una o dos frases.]',
    tags: ['Java', 'Docker'],
    image: null,
    code: '#',
    demo: '#',
  },
];

// Formación: se dibuja como una pista de circuito, en este orden (de arriba abajo).
// type: 'carrera' o 'certificado' (cambia el icono). Si date dice "presente", se marca "En curso".
// Para agregar un certificado, copia una línea y cambia los datos.
export const education = [
  { type: 'carrera', title: 'Ingeniería de Sistemas', place: 'Universidad Nacional Toribio Rodríguez de Mendoza · [CICLO] ciclo', date: '[AÑO] - presente' },
  { type: 'certificado', title: '[CERTIFICADO 1]', place: '[ENTIDAD]', date: '[AÑO]' },
  { type: 'certificado', title: '[CERTIFICADO 2]', place: '[ENTIDAD]', date: '[AÑO]' },
];
