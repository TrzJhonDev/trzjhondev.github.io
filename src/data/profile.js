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
  // Redes (26/11/2026): enlaces completos a tus perfiles, p. ej. 'https://www.tiktok.com/@usuario'. Con '#' salen como pendientes.
  tiktok: '#',
  instagram: '#',
  youtube: '#',
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
// Campos de la web nueva (tarjetas de Formación, 27/11/2026):
//   carrera: cycle = el ciclo que cursas y totalCycles = los ciclos de la carrera (números, p. ej. 6 y 10): con los dos
//     se dibuja la barra de avance; con null sale "pendiente".
//   certificado: url = el enlace a la credencial (botón "Ver credencial"); issuerLogo = el logo de quien lo emite, con el
//     nombre de simple-icons (p. ej. 'siCoursera', 'siUdemy', 'siCisco', 'siPlatzi', 'siFreecodecamp', 'siGoogle');
//     sin logo se ve un icono de certificado.
export const education = [
  { type: 'carrera', title: 'Ingeniería de Sistemas', place: 'Universidad Nacional Toribio Rodríguez de Mendoza · [CICLO] ciclo', date: '[AÑO] - presente', cycle: null, totalCycles: null },
  { type: 'certificado', title: '[CERTIFICADO 1]', place: '[ENTIDAD]', date: '[AÑO]', url: '#', issuerLogo: null },
  { type: 'certificado', title: '[CERTIFICADO 2]', place: '[ENTIDAD]', date: '[AÑO]', url: '#', issuerLogo: null },
];
