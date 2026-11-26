// Resaltado de sintaxis para el código que se escribe en la pantalla del portátil.
// Cada lenguaje es una lista ordenada de [clase, expresión]; en cada posición gana la primera que encaje.
// Las clases (keyword, string, number, comment, func, type, const, tag, attr, prompt, punct) se colorean
// en Laptop3D.css como .tk--clase. Para soportar un lenguaje nuevo basta con añadir sus reglas aquí.

const PUNCT = [['punct', /[{}()[\],.:;=+\-*/<>!&|%^~?]+/y]];
const STR = ['string', /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/y];
const NUM = ['number', /\b\d+(?:\.\d+)?\b/y];
const FUNC = ['func', /\b[A-Za-z_]\w*(?=\()/y];
const word = (words, cls, flags = 'y') => [cls, new RegExp(`\\b(?:${words.join('|')})\\b`, flags)];

const RULES = {
  py: [
    ['comment', /#.*/y], STR, NUM,
    word(['def', 'return', 'for', 'in', 'if', 'elif', 'else', 'while', 'class', 'import', 'from', 'as', 'not', 'and', 'or', 'pass', 'lambda', 'with', 'try', 'except', 'yield'], 'keyword'),
    word(['None', 'True', 'False', 'self'], 'const'),
    FUNC, ...PUNCT,
  ],
  js: [
    ['comment', /\/\/.*/y], STR, NUM,
    word(['const', 'let', 'var', 'function', 'return', 'import', 'from', 'export', 'default', 'if', 'else', 'for', 'while', 'new', 'class', 'async', 'await', 'of', 'in', 'typeof'], 'keyword'),
    word(['true', 'false', 'null', 'undefined', 'this'], 'const'),
    FUNC, ['type', /\b[A-Z]\w*/y], ...PUNCT,
  ],
  // JSX: lo mismo que JS más etiquetas y atributos
  jsx: [
    ['comment', /\/\/.*/y], STR, ['tag', /<\/?[A-Za-z][\w.]*/y], NUM,
    word(['const', 'let', 'var', 'function', 'return', 'import', 'from', 'export', 'default', 'if', 'else', 'for', 'while', 'new', 'class', 'async', 'await', 'of', 'in'], 'keyword'),
    word(['true', 'false', 'null', 'undefined', 'this'], 'const'),
    ['attr', /\b[A-Za-z-]+(?==)/y], FUNC, ['type', /\b[A-Z]\w*/y], ...PUNCT,
  ],
  java: [
    ['comment', /\/\/.*/y], STR, NUM,
    word(['public', 'private', 'protected', 'class', 'static', 'void', 'int', 'double', 'boolean', 'char', 'long', 'float', 'new', 'return', 'if', 'else', 'for', 'while', 'import', 'package', 'final', 'extends', 'implements'], 'keyword'),
    word(['true', 'false', 'null', 'this'], 'const'),
    FUNC, ['type', /\b[A-Z]\w*/y], ...PUNCT,
  ],
  cpp: [
    ['comment', /\/\/.*/y], ['keyword', /#(?:include|define|pragma)\b/y], ['string', /<[\w./]+>|"(?:[^"\\]|\\.)*"/y], NUM,
    word(['int', 'void', 'char', 'double', 'float', 'bool', 'long', 'auto', 'const', 'return', 'if', 'else', 'for', 'while', 'class', 'struct', 'namespace', 'using', 'new', 'delete'], 'keyword'),
    word(['true', 'false', 'nullptr', 'NULL'], 'const'),
    word(['std', 'cout', 'cin', 'endl', 'string', 'vector'], 'type'),
    FUNC, ...PUNCT,
  ],
  html: [
    ['comment', /<!--.*?-->/y], STR, ['tag', /<\/?[A-Za-z][\w-]*/y],
    ['attr', /[A-Za-z-]+(?==)/y],
    ['type', /\.[A-Za-z][\w-]*(?=\s*\{)/y], // selector CSS
    ['attr', /[a-z-]+(?=\s*:)/y], // propiedad CSS
    NUM, ...PUNCT,
  ],
  sql: [
    ['comment', /--.*/y], STR, NUM,
    word(['SELECT', 'FROM', 'WHERE', 'ORDER', 'BY', 'DESC', 'ASC', 'AND', 'OR', 'NOT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN', 'LEFT', 'ON', 'GROUP', 'LIMIT', 'AS', 'DISTINCT', 'COUNT'], 'keyword', 'iy'),
    FUNC, ...PUNCT,
  ],
  docker: [
    ['comment', /#.*/y], ['keyword', /[A-Z]{2,}\b/y], STR, ['const', /[\w.-]+:[\w.-]+/y], NUM, ...PUNCT,
  ],
  asm: [
    ['comment', /;.*/y],
    word(['MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'JMP', 'CMP', 'PUSH', 'POP', 'CALL', 'RET', 'HLT', 'INT', 'INC', 'DEC', 'LOOP', 'AND', 'OR', 'XOR'], 'keyword', 'iy'),
    word(['AX', 'BX', 'CX', 'DX', 'SI', 'DI', 'SP', 'BP', 'AL', 'AH', 'EAX', 'EBX', 'ECX', 'EDX'], 'const', 'iy'),
    ['number', /\b(?:0x[\da-f]+|\d+h?)\b/iy], ...PUNCT,
  ],
  // Reglas de lo que va detrás del comando en una línea de terminal
  shellArgs: [
    ['comment', /#.*/y], STR, ['attr', /--?[A-Za-z][\w-]*/y], ['const', /\.{0,2}\/[\w./-]*/y], NUM, ...PUNCT,
  ],
};

/** Lenguaje de una skill: su campo `lang` o, si falta, se deduce de la extensión del archivo. */
export function langOf(skill) {
  if (skill.lang) return skill.lang;
  const f = skill.file || '';
  if (/\.py$/.test(f)) return 'py';
  if (/\.jsx$/.test(f)) return 'jsx';
  if (/\.(js|ts)$/.test(f)) return 'js';
  if (/\.java$/.test(f)) return 'java';
  if (/\.(cpp|cc|h)$/.test(f)) return 'cpp';
  if (/\.html?$/.test(f)) return 'html';
  if (/\.sql$/.test(f)) return 'sql';
  if (/\.asm$/.test(f)) return 'asm';
  if (/dockerfile/i.test(f)) return 'docker';
  return 'plain';
}

function scan(line, rules) {
  const tokens = [];
  let plain = '';
  const flush = () => { if (plain) { tokens.push({ text: plain, cls: 'plain' }); plain = ''; } };
  let pos = 0;
  while (pos < line.length) {
    let hit = null;
    for (const [cls, re] of rules) {
      re.lastIndex = pos;
      const m = re.exec(line);
      if (m && m.index === pos && m[0].length) { hit = { text: m[0], cls }; break; }
    }
    if (hit) { flush(); tokens.push(hit); pos += hit.text.length; } else { plain += line[pos]; pos += 1; }
  }
  flush();
  return tokens;
}

function shell(line) {
  const m = /^(\$)(\s+)(\S+)(.*)$/.exec(line);
  if (!m) return [{ text: line, cls: 'plain' }];
  return [
    { text: m[1], cls: 'prompt' }, { text: m[2], cls: 'plain' }, { text: m[3], cls: 'func' },
    ...scan(m[4], RULES.shellArgs),
  ];
}

const cache = new Map();

/** Divide una línea de código en trozos { text, cls }. El resultado se guarda para no recalcularlo en cada fotograma. */
export function highlight(line, lang) {
  const key = `${lang}\u0000${line}`;
  let t = cache.get(key);
  if (!t) {
    t = lang === 'sh' ? shell(line) : RULES[lang] ? scan(line, RULES[lang]) : [{ text: line, cls: 'plain' }];
    cache.set(key, t);
  }
  return t;
}

/** Se queda con los primeros n caracteres de una lista de trozos (para el efecto de tecleo). */
export function sliceTokens(tokens, n) {
  const out = [];
  let left = n;
  for (const t of tokens) {
    if (left <= 0) break;
    out.push(left >= t.text.length ? t : { ...t, text: t.text.slice(0, left) });
    left -= t.text.length;
  }
  return out;
}
