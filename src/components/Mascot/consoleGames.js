// Minijuegos de la consola del pecho de la mascota.
// La pantalla lógica mide W×H píxeles: S veces la resolución original de 64×36 (Jhon pidió subirla). Las primeras TOP filas
// son del marcador (HUD, en el DOM). Todas las medidas de los juegos son múltiplos de S, así que cambiar S los reescala solos.
// Cada juego es una fábrica que devuelve { score, over, step(dt, io), draw(g, pal) }:
//   io = { held: Set, pressed: Set } con 'left' | 'right' | 'up' | 'down' | 'action' (pressed = pulsado en este fotograma).
//   pal = { lit, mid, hot, silver } colores leídos de las variables --m-* de la mascota.

export const S = 4;
export const W = 64 * S, H = 36 * S, TOP = 6 * S;

const rand = (n) => Math.floor(Math.random() * n);
const rect = (g, x, y, w, h) => g.fillRect(Math.round(x), Math.round(y), w, h);

/** Serpiente: flechas o WASD. Comer acelera; chocar con la pared o contigo termina. */
function snake() {
  const C = 2 * S, cols = W / C, rows = (H - TOP) / C; // 32 × 15 casillas (más finas se veían diminutas en la pantallita)
  let body, dir, next, food, acc, stepMs, score, over;
  const place = () => {
    do { food = [rand(cols), rand(rows)]; } while (body.some(([x, y]) => x === food[0] && y === food[1]));
  };
  body = [[10, 7], [9, 7], [8, 7]]; dir = [1, 0]; next = [1, 0]; acc = 0; stepMs = 130; score = 0; over = false;
  place();
  return {
    get score() { return score; },
    get over() { return over; },
    step(dt, io) {
      if (over) return;
      if (io.pressed.has('up') && dir[1] === 0) next = [0, -1];
      else if (io.pressed.has('down') && dir[1] === 0) next = [0, 1];
      else if (io.pressed.has('left') && dir[0] === 0) next = [-1, 0];
      else if (io.pressed.has('right') && dir[0] === 0) next = [1, 0];
      acc += dt * 1000;
      while (acc >= stepMs && !over) {
        acc -= stepMs;
        dir = next;
        const h = [body[0][0] + dir[0], body[0][1] + dir[1]];
        if (h[0] < 0 || h[0] >= cols || h[1] < 0 || h[1] >= rows || body.some((s) => s[0] === h[0] && s[1] === h[1])) { over = true; break; }
        body.unshift(h);
        if (h[0] === food[0] && h[1] === food[1]) { score += 1; stepMs = Math.max(70, 130 - score * 4); place(); } else body.pop();
      }
    },
    draw(g, pal) {
      g.fillStyle = pal.hot; rect(g, food[0] * C + 1, TOP + food[1] * C + 1, C - 2, C - 2);
      body.forEach(([x, y], i) => { g.fillStyle = i === 0 ? pal.lit : pal.mid; rect(g, x * C, TOP + y * C, C - 1, C - 1); });
    },
  };
}

/** Salto: espacio, flecha arriba o W. Esquiva los obstáculos; cada vez va más rápido. */
function runner() {
  const GROUND = 31 * S, PW = 4 * S, PH = 6 * S, PX = 10 * S;
  let py, vy, obs, speed, dist, nextIn, over;
  py = GROUND - PH; vy = 0; obs = []; speed = 30 * S; dist = 0; nextIn = 24 * S; over = false;
  return {
    get score() { return Math.floor(dist / (6 * S)); },
    get over() { return over; },
    step(dt, io) {
      if (over) return;
      const onGround = py >= GROUND - PH - 0.01;
      if (onGround && (io.pressed.has('action') || io.pressed.has('up'))) vy = -95 * S;
      vy += 260 * S * dt; py += vy * dt;
      if (py >= GROUND - PH) { py = GROUND - PH; vy = 0; }
      dist += speed * dt; speed = Math.min(60 * S, speed + dt * 1.2 * S);
      nextIn -= speed * dt;
      if (nextIn <= 0) { obs.push({ x: W, w: (2 + rand(3)) * S, h: (4 + rand(5)) * S }); nextIn = (26 + rand(26)) * S + speed * 0.4; }
      obs.forEach((o) => { o.x -= speed * dt; });
      obs = obs.filter((o) => o.x + o.w > 0);
      if (obs.some((o) => PX + PW - S / 2 > o.x && PX + S / 2 < o.x + o.w && py + PH - S / 2 > GROUND - o.h)) over = true;
    },
    draw(g, pal) {
      g.fillStyle = pal.silver; rect(g, 0, GROUND, W, 2);
      for (let x = -((dist | 0) % (8 * S)); x < W; x += 8 * S) rect(g, x, GROUND + 2 * S, 3 * S, 2);
      g.fillStyle = pal.hot; obs.forEach((o) => rect(g, o.x, GROUND - o.h, o.w, o.h));
      g.fillStyle = pal.lit; rect(g, PX, py, PW, PH);
      g.fillStyle = '#061016'; rect(g, PX + 2 * S, py + S, S, 2 * S); // el ojo
    },
  };
}

/** Ladrillos: flechas izquierda y derecha o A y D mueven la pala; espacio lanza la bola. Tres vidas. */
function bricks() {
  const COLS = 16, ROWS = 6, BX = 4 * S, BY = 2 * S, Y0 = TOP + 2 * S, PY = 33 * S - S, PWID = 12 * S, BALL = 2 * S;
  let grid, px, ball, lives, speed, score, over, stuck;
  const build = () => { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(true)); };
  const serve = () => { stuck = true; ball = { x: px + PWID / 2 - BALL / 2, y: PY - BALL, vx: 0, vy: 0 }; };
  px = 26 * S; lives = 3; speed = 34 * S; score = 0; over = false; build(); serve();
  return {
    get score() { return score; },
    get over() { return over; },
    get lives() { return lives; },
    step(dt, io) {
      if (over) return;
      const dir = (io.held.has('right') ? 1 : 0) - (io.held.has('left') ? 1 : 0);
      px = Math.max(0, Math.min(W - PWID, px + dir * 52 * S * dt));
      if (stuck) {
        ball.x = px + PWID / 2 - BALL / 2; ball.y = PY - BALL;
        if (io.pressed.has('action') || io.pressed.has('up')) { stuck = false; ball.vx = (rand(2) ? 1 : -1) * speed * 0.5; ball.vy = -speed * 0.87; }
        return;
      }
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(ball.vx), Math.abs(ball.vy)) * dt / S));
      for (let i = 0; i < n; i += 1) {
        ball.x += (ball.vx * dt) / n; ball.y += (ball.vy * dt) / n;
        if (ball.x <= 0) { ball.x = 0; ball.vx = Math.abs(ball.vx); }
        if (ball.x + BALL >= W) { ball.x = W - BALL; ball.vx = -Math.abs(ball.vx); }
        if (ball.y <= TOP) { ball.y = TOP; ball.vy = Math.abs(ball.vy); }
        if (ball.vy > 0 && ball.y + BALL >= PY && ball.y < PY + 2 * S && ball.x + BALL > px && ball.x < px + PWID) {
          const off = (ball.x + BALL / 2 - (px + PWID / 2)) / (PWID / 2);
          ball.vx = off * speed * 0.9;
          ball.vy = -Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, (speed * 0.4) ** 2));
          ball.y = PY - BALL;
        }
        const cx = ball.x + BALL / 2, cy = ball.y + BALL / 2 - Y0, c = Math.floor(cx / BX), r = Math.floor(cy / BY);
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] && cx - c * BX < BX - 1 && cy - r * BY < BY - 1) {
          grid[r][c] = false; score += 10; ball.vy = -ball.vy; speed = Math.min(60 * S, speed + 0.6 * S);
          if (grid.every((row) => row.every((v) => !v))) { build(); speed += 5 * S; serve(); return; }
        }
        if (ball.y > H) {
          lives -= 1;
          if (lives <= 0) over = true; else serve();
          return;
        }
      }
    },
    draw(g, pal) {
      const cols = [pal.hot, pal.hot, pal.lit, pal.lit, pal.mid, pal.silver];
      grid.forEach((row, r) => row.forEach((on, c) => { if (on) { g.fillStyle = cols[r]; rect(g, c * BX, Y0 + r * BY, BX - 1, BY - 1); } }));
      g.fillStyle = pal.lit; rect(g, px, PY, PWID, 2 * S - 2);
      g.fillStyle = '#FFFFFF'; rect(g, ball.x, ball.y, BALL, BALL);
    },
  };
}

export const GAMES = [
  { id: 'serpiente', name: 'SERPIENTE', make: snake, keys: 'FLECHAS / WASD' },
  { id: 'salto', name: 'SALTO', make: runner, keys: 'ESPACIO' },
  { id: 'ladrillos', name: 'LADRILLOS', make: bricks, keys: 'A D + ESPACIO' },
];
