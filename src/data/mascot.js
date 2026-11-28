// ─────────────────────────────────────────────────────────────
//  TEXTOS DE LA MASCOTA. Edítalos a tu gusto.
//  {name} se reemplaza por el nombre de profile.js. Frases cortas (unos 110 caracteres como máximo)
//  y sin datos que no sean ciertos: la mascota habla de la página, no inventa nada de ti.
//  Tono: amistoso al saludar, serio en proyectos y bromista con los clics.
// ─────────────────────────────────────────────────────────────

export const mascotLines = {
  // Al llegar (una vez por sesión)
  saludo: '¡Hola! Soy la mascota de {name}. Si quieres, te acompaño por la página.',

  // Una vez por sesión, cuando la sección llega a la mitad de la pantalla. Las claves son los id de las secciones.
  secciones: {
    proyectos: 'Portátil interactivo: sus teclas son skills. A la derecha, mis programas: ábrelos y salen en su pantalla.',
    formacion: 'Cada etapa es un nivel. Voy saltando de uno en uno; el último aún está bloqueado.',
  },
  // Lo mismo en móvil (por debajo de 900 px), donde los proyectos van debajo del portátil y no hay puntero.
  // Si falta una clave, se usa la de `secciones`.
  seccionesMovil: {
    proyectos: 'Portátil interactivo: toca sus teclas, son skills. Debajo, mis programas: ábrelos y salen en su pantalla.',
  },

  // Bloque "¿Trabajamos juntos?": la mascota pasea por el escenario y lleva las tarjetas de un lado a otro.
  // Al pasar el puntero por una tarjeta se para, la mira y explica qué hace; si el enlace aún es un marcador de
  // profile.js, lo dice. {email} = el correo de profile.js. Las listas se eligen al azar.
  contacto: {
    pregunta: '¿Le dejo un mensaje a {name}? Escríbelo arriba o elige un puerto.',
    preguntaLab: 'Elige un puerto y lo conecto, o arrastra tú el conector.', // en /lab no hay formulario arriba
    pista: {
      mensaje: 'Escribe tu mensaje y lo abro en tu correo, listo para enviar.',
      copiar: 'Copio su correo y lo pegas donde quieras.',
      github: 'Su GitHub: ahí está su código.',
      linkedin: 'Su perfil de LinkedIn.',
      cv: 'Su CV en PDF.',
      tiktok: 'Su TikTok: videos cortos.',
      instagram: 'Su Instagram.',
      youtube: 'Su canal de YouTube.',
    },
    pendiente: 'Ese puerto aún no tiene señal: falta su enlace.',
    copiado: '¡Copiado! El correo ya está en tu portapapeles.',
    sinCopiar: 'No pude copiarlo. Aquí lo tienes: {email}',
    vacio: 'Escribe algo primero y te lo preparo.',
    enviado: 'Abrí tu correo con el mensaje. Solo falta pulsar enviar.',
    asunto: 'Contacto desde tu portafolio',
    // Panel de puertos (26/11/2026): cuando prueba un puerto por su cuenta (no siempre habla)
    conectar: ['Pruebo este puerto…', 'Conectando…', 'A ver si hay señal aquí.'],
    // Si se enchufa en un puerto cuyo dato aún es un marcador
    sinSenal: ['Sin señal… a este puerto le falta su enlace.', 'Nada. Este aún no está conectado a nada.'],
    // Si le quitas el conector de la mano
    triste: ['¡Oye! Ese cable lo llevaba yo…', 'Vaya… me quitaste el conector.', 'Snif. Era mi cable favorito.'],
    recupera: ['Vale, conéctalo tú.', 'Bueno, ya se me pasó.', 'Está bien, tú mandas.'],
    // Una sola vez (la primera visita): el conector se puede arrastrar
    arrastrar: 'Este cable se puede arrastrar: llévalo tú a un puerto.',
  },

  // Cuando pulsa el botón de su pecho y el portátil arranca con el scroll (Proyectos)
  encender: '¡Clic! Lo enciendo.',

  // Compañera del portátil. Al elegir una skill (una vez por skill y sesión). Las claves son los id de skills.js.
  // Son datos generales de cada tecnología, no afirmaciones sobre ti.
  skills: {
    py: 'Python: poco ruido y mucha automatización.',
    java: 'Java: public static void main… y un café.',
    js: 'JavaScript: lo que da vida a la web.',
    cpp: 'C++: potencia, y punteros con cuidado.',
    html: 'HTML y CSS: la estructura y el estilo de todo sitio.',
    react: 'React: la interfaz hecha de piezas reutilizables.',
    node: 'Node.js: JavaScript también en el servidor.',
    sql: 'SQL: preguntarle cosas a los datos.',
    mongo: 'MongoDB: datos en documentos, sin tablas rígidas.',
    git: 'Git: la máquina del tiempo del código.',
    linux: 'Linux: la terminal como casa.',
    docker: 'Docker: que funcione en mi máquina… y en cualquiera.',
    eda: 'Estructuras de datos: ordenar es media programación.',
    redes: 'Redes: así viajan los datos de un equipo a otro.',
    arq: 'Arquitectura de computadoras: mira cómo se abre el portátil por dentro.',
  },
  // Al ejecutar código en el portátil (en orden)
  ejecutar: [
    'Ejecutando… cruzo los dedos.',
    'Sin errores a la primera. Sospechoso.',
    '¡Compiló! Hoy es buen día.',
    'Funciona en el portátil… y en el mío.',
  ],
  // Al abrir el despiece (una vez por sesión)
  despiece: 'Así es el portátil por dentro. Toca una pieza o arma el rompecabezas.',
  // Perfeccionista: si dejas el portátil inclinado un rato, ofrece enderezarlo (nunca lo toca sin tu permiso)
  torcido: {
    oferta: 'Ese portátil está torcido. ¿Lo enderezo? Es que soy perfeccionista.',
    boton: 'Enderezar',
    listo: 'Mucho mejor. Ahora sí.',
  },

  // Al hacer clic en la mascota: según se asuste o se ría
  clic: {
    startle: [
      '¡Ay! Casi borro el repositorio.',
      '¡Eso no estaba en los tests!',
      'Me has pillado en pleno despliegue.',
    ],
    laugh: [
      'Jaja, en mi máquina funciona.',
      'He automatizado esta risa.',
      'Eso merece un commit.',
      'Ctrl + Z no deshace las cosquillas.',
    ],
  },
};
