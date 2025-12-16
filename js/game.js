/* ================= CANVAS ================= */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 320;
canvas.height = 180;
ctx.imageSmoothingEnabled = false;

/* ================= AUDIO ================= */
const sndShoot = new Audio('../assets/sounds/ShootingSound.mp3');
const sndExplode = new Audio('../assets/sounds/ExplosionSound.mp3');
const sndPower = new Audio('../assets/sounds/PowerUpSound.mp3');
const sndStep = new Audio('../assets/sounds/FootstepSound.mp3');
const sndGameOver = new Audio('../assets/sounds/GameOverSound.mp3');
[sndShoot, sndExplode, sndGameOver, sndPower, sndStep].forEach(a => a.volume = 0.5);

/* ================= ESTADO ================= */
let running = true;
let paused = false;

/* ===== TEMPO CORRIGIDO ===== */
let startTime = performance.now();
let pauseStart = 0;
let totalPausedTime = 0;

/* ================= PLAYER ================= */
const player = {
  x: 160,
  y: 90,
  size: 6,
  speed: 2,
  lastStep: 0
};

/* ================= ENTIDADES ================= */
const bullets = [];
const enemies = [];
const powerups = [];

/* ================= INPUT ================= */
const keys = {};
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

let lastShot = 0;
const shotDelay = 160;

/* ================= EVENTOS ================= */
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape') togglePause();
});

addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) * (canvas.width / r.width);
  mouseY = (e.clientY - r.top) * (canvas.height / r.height);
});

canvas.addEventListener('mousedown', () => {
  if (!paused && running) shootToMouse();
});

/* ================= LOOP ================= */
let lastSpawn = 0;

function loop(t) {
  if (!running) return;
  requestAnimationFrame(loop);

  /* ===== TEMPO SEMPRE ATUALIZA ===== */
  const time = (t - startTime - totalPausedTime) / 1000;
  document.getElementById('time').textContent = time.toFixed(1);

  if (paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const difficulty = 1 + time * 0.03;

  if (t - lastSpawn > 1400 / difficulty) {
    spawnEnemy();
    if (Math.random() < 0.12) spawnPowerup();
    lastSpawn = t;
  }

  movePlayer();
  handleShooting();
  updateBullets();
  updateEnemies(difficulty);
  updatePowerups();
  drawPlayer();
  drawCrosshair();
}

requestAnimationFrame(loop);

/* ================= PLAYER ================= */
function movePlayer() {
  let dx = 0, dy = 0;
  let moved = false;

  if (keys['w']) dy--;
  if (keys['s']) dy++;
  if (keys['a']) dx--;
  if (keys['d']) dx++;

  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * player.speed;
    player.y += (dy / len) * player.speed;
    moved = true;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  if (moved && performance.now() - player.lastStep > 300) {
    sndStep.currentTime = 0;
    sndStep.play();
    player.lastStep = performance.now();
  }
}

function drawPlayer() {
  ctx.fillStyle = '#4fa4ff';
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

/* ================= TIRO ================= */
function handleShooting() {
  const now = performance.now();
  if (now - lastShot < shotDelay) return;

  let angle = null;

  if (keys['arrowup']) angle = -Math.PI / 2;
  else if (keys['arrowdown']) angle = Math.PI / 2;
  else if (keys['arrowleft']) angle = Math.PI;
  else if (keys['arrowright']) angle = 0;
  else if (keys[' ']) {
    shootToMouse();
    return;
  }

  if (angle !== null) {
    lastShot = now;
    fireBullet(angle);
  }
}

function shootToMouse() {
  const now = performance.now();
  if (now - lastShot < shotDelay) return;
  lastShot = now;

  const px = player.x + player.size / 2;
  const py = player.y + player.size / 2;
  const angle = Math.atan2(mouseY - py, mouseX - px);
  fireBullet(angle);
}

function fireBullet(angle) {
  sndShoot.currentTime = 0;
  sndShoot.play();

  bullets.push({
    x: player.x + player.size / 2,
    y: player.y + player.size / 2,
    dx: Math.cos(angle) * 4,
    dy: Math.sin(angle) * 4
  });
}

function updateBullets() {
  ctx.fillStyle = '#f2d94c';
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx;
    b.y += b.dy;
    ctx.fillRect(b.x, b.y, 2, 2);

    if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height)
      bullets.splice(i, 1);
  }
}

/* ================= INIMIGOS ================= */
function spawnEnemy() {
  const r = Math.random();
  let type = r < 0.6 ? 0 : r < 0.85 ? 1 : 2;

  let x, y;
  const side = Math.floor(Math.random() * 4);
  if (side === 0) { x = Math.random() * canvas.width; y = -8; }
  if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + 8; }
  if (side === 2) { x = -8; y = Math.random() * canvas.height; }
  if (side === 3) { x = canvas.width + 8; y = Math.random() * canvas.height; }

  enemies.push({
    x, y,
    type,
    size: type === 2 ? 4 : 6,
    speed: type === 1 ? 0.55 : type === 2 ? 0.4 : 0.45
  });
}

function updateEnemies(diff) {
  enemies.forEach((e, i) => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    e.x += (dx / dist) * e.speed * diff;
    e.y += (dy / dist) * e.speed * diff;

    ctx.fillStyle = e.type === 0 ? '#e14a4a' : e.type === 1 ? '#2ecc71' : '#3498db';
    ctx.fillRect(e.x, e.y, e.size, e.size);

    if (Math.abs(player.x - e.x) < e.size && Math.abs(player.y - e.y) < e.size)
      gameOver();

    bullets.forEach((b, bi) => {
      if (b.x > e.x && b.x < e.x + e.size && b.y > e.y && b.y < e.y + e.size) {
        sndExplode.play();
        enemies.splice(i, 1);
        bullets.splice(bi, 1);
      }
    });
  });
}

/* ================= POWERUPS ================= */
function spawnPowerup() {
  powerups.push({
    x: Math.random() * 300 + 10,
    y: Math.random() * 160 + 10
  });
}

function updatePowerups() {
  powerups.forEach((p, i) => {
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(p.x, p.y, 6, 6);

    if (Math.abs(player.x - p.x) < 6 && Math.abs(player.y - p.y) < 6) {
      sndPower.play();
      enemies.forEach(e => e.speed *= 0.5);
      setTimeout(() => enemies.forEach(e => e.speed *= 2), 5000);
      powerups.splice(i, 1);
    }
  });
}

/* ================= CROSSHAIR ================= */
function drawCrosshair() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(mouseX - 3, mouseY, 6, 1);
  ctx.fillRect(mouseX, mouseY - 3, 1, 6);
}

/* ================= PAUSE / GAME OVER ================= */
function togglePause() {
  paused = !paused;

  if (paused) {
    pauseStart = performance.now();
  } else {
    totalPausedTime += performance.now() - pauseStart;
  }

  document.getElementById('pause').style.display = paused ? 'flex' : 'none';
}

function gameOver() {
  running = false;

  const finalTime = ((performance.now() - startTime - totalPausedTime) / 1000).toFixed(2);
  document.getElementById('finalTime').textContent = `TIME ${finalTime}`;
  document.getElementById('gameover').style.display = 'flex';

  sndGameOver.currentTime = 0;
  sndGameOver.play();
}
