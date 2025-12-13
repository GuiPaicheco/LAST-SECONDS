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
let startTime = performance.now();
let enemySpeedModifier = 1;

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
let mouseX = 0;
let mouseY = 0;
let lastShot = 0;
const shotDelay = 160;

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape') togglePause();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) * (canvas.width / r.width);
  mouseY = (e.clientY - r.top) * (canvas.height / r.height);
});

canvas.addEventListener('mousedown', () => {
  if (!paused && running) shoot();
});

/* ================= LOOP ================= */
let lastSpawn = 0;
function loop(t) {
  if (!running) return;
  requestAnimationFrame(loop);
  if (paused) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const time = (t - startTime) / 1000;
  document.getElementById('time').textContent = time.toFixed(1);

  const difficulty = 1 + time * 0.05;

  if (t - lastSpawn > 1200 / difficulty) {
    spawnEnemy();
    if (Math.random() < 0.15) spawnPowerup();
    lastSpawn = t;
  }

  movePlayer();
  drawPlayer();
  updateBullets();
  updateEnemies(difficulty);
  updatePowerups();
  drawCrosshair();
}

/* ================= PLAYER ================= */
function movePlayer() {
  let moved = false;

  if (keys['w'] || keys['arrowup']) { player.y -= player.speed; moved = true; }
  if (keys['s'] || keys['arrowdown']) { player.y += player.speed; moved = true; }
  if (keys['a'] || keys['arrowleft']) { player.x -= player.speed; moved = true; }
  if (keys['d'] || keys['arrowright']) { player.x += player.speed; moved = true; }

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
function shoot() {
  const now = performance.now();
  if (now - lastShot < shotDelay) return;
  lastShot = now;

  sndShoot.currentTime = 0;
  sndShoot.play();

  const angle = Math.atan2(mouseY - (player.y + player.size/2), mouseX - (player.x + player.size/2));
  fireBullet(angle);
}

function fireBullet(angle) {
  const px = player.x + player.size / 2;
  const py = player.y + player.size / 2;

  bullets.push({
    x: px,
    y: py,
    dx: Math.cos(angle) * 4,
    dy: Math.sin(angle) * 4
  });
}

function updateBullets() {
  ctx.fillStyle = '#f2d94c';
  bullets.forEach((b, i) => {
    b.x += b.dx;
    b.y += b.dy;
    ctx.fillRect(b.x, b.y, 2, 2);
    if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height)
      bullets.splice(i, 1);
  });
}

/* ================= INIMIGOS ================= */
function spawnEnemy() {
  let type;
  const r = Math.random();
  if (r < 0.6) type = 0;     // 60% normal
  else if (r < 0.85) type = 1; // 25% rápido
  else type = 2;             // 15% pequeno

  let x, y;
  const side = Math.floor(Math.random() * 4);
  if (side === 0) { x = Math.random() * canvas.width; y = -8; }
  if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + 8; }
  if (side === 2) { x = -8; y = Math.random() * canvas.height; }
  if (side === 3) { x = canvas.width + 8; y = Math.random() * canvas.height; }

  let enemy = { x, y, type, size: 6, speedModifier: 1 };

  if (type === 1) enemy.speedModifier = 1.5;
  if (type === 2) { enemy.size = 4; enemy.speedModifier = 0.8; }

  enemies.push(enemy);
}

function updateEnemies(diff) {
  enemies.forEach((e, ei) => {
    const speed = diff * 0.6 * enemySpeedModifier * e.speedModifier;
    e.x += Math.sign(player.x - e.x) * speed;
    e.y += Math.sign(player.y - e.y) * speed;

    if (e.type === 0) ctx.fillStyle = '#e14a4a';
    else if (e.type === 1) ctx.fillStyle = '#2ecc71';
    else ctx.fillStyle = '#3498db';

    ctx.fillRect(e.x, e.y, e.size, e.size);

    if (Math.abs(player.x - e.x) < e.size && Math.abs(player.y - e.y) < e.size) gameOver();

    bullets.forEach((b, bi) => {
      if (b.x > e.x && b.x < e.x + e.size && b.y > e.y && b.y < e.y + e.size) {
        sndExplode.play();
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
      }
    });
  });
}

/* ================= POWERUPS ================= */
function spawnPowerup() {
  powerups.push({
    x: Math.random() * 300 + 10,
    y: Math.random() * 160 + 10,
    type: Math.random() < 0.25 ? 'multi' : Math.random() < 0.5 ? 'slow' : 'double',
    t: performance.now()
  });
}

function updatePowerups() {
  powerups.forEach((p, i) => {
    ctx.fillStyle = p.type === 'double' ? '#9b59b6' : p.type === 'slow' ? '#2ecc71' : '#f39c12';
    ctx.fillRect(p.x, p.y, 6, 6);

    if (Math.abs(player.x - p.x) < 6 && Math.abs(player.y - p.y) < 6) {
      activatePower(p.type);
      powerups.splice(i, 1);
    }
  });
}

function activatePower(type) {
  sndPower.play();
  if (type === 'double') {
    // não muda mais o tiro porque tiramos multiShot
  }
  if (type === 'multi') {
    // agora inútil, mas pode adicionar algum outro efeito
  }
  if (type === 'slow') {
    enemySpeedModifier = 0.5;
    setTimeout(() => enemySpeedModifier = 1, 5000);
  }
}

/* ================= CROSSHAIR ================= */
function drawCrosshair() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(mouseX - 3, mouseY, 6, 1);
  ctx.fillRect(mouseX, mouseY - 3, 1, 6);
}

/* ================= PAUSE ================= */
function togglePause() {
  paused = !paused;
  document.getElementById('pause').style.display = paused ? 'flex' : 'none';
}

/* ================= GAME OVER ================= */
function gameOver() {
  running = false;
  const t = ((performance.now() - startTime) / 1000).toFixed(2);
  document.getElementById('finalTime').textContent = `TIME ${t}`;
  document.getElementById('gameover').style.display = 'flex';

  sndGameOver.currentTime = 0;
  sndGameOver.play();

  if (typeof db !== 'undefined') {
    db.collection('ranking').add({
      nome: localStorage.getItem('playerName') || 'PLAYER',
      tempo: +t,
      data: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

requestAnimationFrame(loop);
