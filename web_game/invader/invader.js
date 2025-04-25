// === Canvas Setup ===
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// === Player ===
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 50,
  width: 50,
  height: 20,
  speed: 5,
  color: 'lime'
};

// === Game State ===
let keys = {};
let score = 0;
let lives = 3;
let stage = 1;
let gameRunning = true;

// === Entities ===
const invaders = [];
const bullets = [];
const alienBullets = [];
const shields = [];
const explosions = [];
const particles = [];

// === Config ===
let invaderRows = 3;
let invaderCols = 10;
const invaderWidth = 40;
const invaderHeight = 20;
const invaderGap = 20;
let invaderDirection = 1;
let invaderSpeed = 1;
const bulletSpeed = 6;
const alienBulletSpeed = 3;

// === Event Handling ===
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.code === 'Space' && gameRunning) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      color: '#ff0'
    });
  }
});

document.addEventListener('keyup', (e) => keys[e.key] = false);

// === Invaders ===
function createInvaders() {
  invaders.length = 0;
  for (let row = 0; row < invaderRows; row++) {
    for (let col = 0; col < invaderCols; col++) {
      invaders.push({
        x: 100 + col * (invaderWidth + invaderGap),
        y: 50 + row * (invaderHeight + invaderGap),
        width: invaderWidth,
        height: invaderHeight,
        color: '#f0f',
        alive: true
      });
    }
  }
}

function updateInvaders() {
  let moveDown = false;
  invaders.forEach(inv => {
    if (!inv.alive) return;
    inv.x += invaderSpeed * invaderDirection;
    if (inv.x + inv.width >= canvas.width || inv.x <= 0) moveDown = true;
  });
  if (moveDown) {
    invaderDirection *= -1;
    invaders.forEach(inv => inv.y += invaderHeight);
  }
}

function drawInvaders() {
  invaders.forEach(inv => {
    if (inv.alive) {
      ctx.fillStyle = inv.color;
      ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
    }
  });
}

// === Bullets ===
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= bulletSpeed;

    invaders.forEach(inv => {
      if (inv.alive && b.x < inv.x + inv.width && b.x + b.width > inv.x && b.y < inv.y + inv.height && b.y + b.height > inv.y) {
        inv.alive = false;
        bullets.splice(i, 1);
        score += 100;
        document.getElementById('score').textContent = `Score: ${score}`;
        createExplosion(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color);
        createParticles(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color);
      }
    });

    shields.forEach(shield => {
      shield.blocks.forEach(block => {
        if (block.alive && b.x < block.x + block.width && b.x + b.width > block.x && b.y < block.y + block.height && b.y + b.height > block.y) {
          block.alive = false;
          bullets.splice(i, 1);
          createExplosion(block.x + block.width / 2, block.y + block.height / 2, '#0ff');
          createParticles(block.x + block.width / 2, block.y + block.height / 2, '#0ff');
        }
      });
    });

    if (b.y + b.height < 0) bullets.splice(i, 1);
  }
}

function drawBullets() {
  bullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
}

// === Alien Bullets ===
function alienFire() {
  const shooters = invaders.filter(inv => inv.alive);
  if (shooters.length === 0) return;
  const shooter = shooters[Math.floor(Math.random() * shooters.length)];
  alienBullets.push({
    x: shooter.x + shooter.width / 2 - 2,
    y: shooter.y + shooter.height,
    width: 4,
    height: 10,
    color: '#f00'
  });
}

function updateAlienBullets() {
  for (let i = alienBullets.length - 1; i >= 0; i--) {
    const b = alienBullets[i];
    b.y += alienBulletSpeed;

    if (b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y) {
      alienBullets.splice(i, 1);
      lives--;
      document.getElementById('lives').textContent = `Lives: ${lives}`;
      createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff0');
      createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff0');
    }

    shields.forEach(shield => {
      shield.blocks.forEach(block => {
        if (block.alive && b.x < block.x + block.width && b.x + b.width > block.x && b.y < block.y + block.height && b.y + b.height > block.y) {
          block.alive = false;
          alienBullets.splice(i, 1);
          createExplosion(block.x + block.width / 2, block.y + block.height / 2, '#0ff');
          createParticles(block.x + block.width / 2, block.y + block.height / 2, '#0ff');
        }
      });
    });

    if (b.y > canvas.height) alienBullets.splice(i, 1);
  }
}

function drawAlienBullets() {
  alienBullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
}

// === Shields ===
function createShields() {
  shields.length = 0;
  const shieldWidth = 80;
  const shieldHeight = 40;
  const gap = 100;
  const startX = (canvas.width - (3 * shieldWidth + 2 * gap)) / 2;
  const y = canvas.height - 150;

  for (let i = 0; i < 3; i++) {
    const shield = {
      x: startX + i * (shieldWidth + gap),
      y,
      width: shieldWidth,
      height: shieldHeight,
      blocks: []
    };

    const blockSize = 8;
    for (let by = 0; by < shieldHeight; by += blockSize) {
      for (let bx = 0; bx < shieldWidth; bx += blockSize) {
        shield.blocks.push({
          x: shield.x + bx,
          y: shield.y + by,
          width: blockSize,
          height: blockSize,
          alive: true
        });
      }
    }
    shields.push(shield);
  }
}

function drawShields() {
  ctx.fillStyle = '#0ff';
  shields.forEach(shield => {
    shield.blocks.forEach(block => {
      if (block.alive) ctx.fillRect(block.x, block.y, block.width, block.height);
    });
  });
}

// === Explosions ===
function createExplosion(x, y, color = '#fff') {
  explosions.push({ x, y, radius: 10, color, life: 15 });
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].life--;
    if (explosions[i].life <= 0) explosions.splice(i, 1);
  }
}

function drawExplosions() {
  explosions.forEach(exp => {
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.fillStyle = exp.color;
    ctx.fill();
    ctx.closePath();
  });
}

// === Particles ===
function createParticles(x, y, color = '#fff') {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: 2 + Math.random() * 2,
      color,
      life: 20
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
}

// === Stage ===
function checkStageClear() {
  if (invaders.every(inv => !inv.alive)) {
    stage++;
    document.getElementById('stage').textContent = `Stage: ${stage}`;

    // 난이도 상승
    if (stage % 2 === 0) {
      invaderSpeed += 0.2;
    }

    createInvaders();
    showStageBanner();
  }
}

function showStageBanner() {
  const banner = document.createElement('div');
  banner.textContent = `STAGE ${stage}`;
  banner.style.position = 'absolute';
  banner.style.top = '40%';
  banner.style.left = '50%';
  banner.style.transform = 'translate(-50%, -50%)';
  banner.style.color = '#fff';
  banner.style.fontSize = '40px';
  banner.style.fontWeight = 'bold';
  banner.style.opacity = '0.8';
  document.body.appendChild(banner);

  setTimeout(() => {
    banner.remove();
  }, 1500);
}

// === Game Loop ===
function update() {
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  updateInvaders();
  updateBullets();
  updateAlienBullets();
  updateExplosions();
  updateParticles();

  checkStageClear();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  drawInvaders();
  drawBullets();
  drawAlienBullets();
  drawShields();
  drawExplosions();
  drawParticles();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// === Game Start ===
createInvaders();
createShields();
gameLoop();
setInterval(alienFire, 1000);
