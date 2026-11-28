// ─────────────────────────────────────────────────────────────
//  TUS DATOS. Edita este archivo para personalizar el portafolio.
//  Todo lo que está entre [CORCHETES] es un marcador por completar.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Jhon',
  lastName: '[APELLIDO]',
  mascot: 'Bonu', // nombre de la mascota robot (Jhon, 28/11/2026); en los textos de mascot.js es {mascot}
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

// Los PROYECTOS no van aquí: cada uno es un archivo Markdown en src/content/proyectos/ (los usan la portada, los
// casos de estudio y, en /lab, la lista de programas y la terminal del portátil).

// Formación: tarjetas en la portada (src/astro/Formacion.astro), en este orden.
// type: 'carrera' o 'certificado' (cambia el icono). Si date dice "presente", se marca "En curso".
// Para agregar un certificado, copia una línea y cambia los datos.
// Campos de las tarjetas:
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
