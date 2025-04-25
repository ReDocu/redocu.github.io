const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 20;

const COLORS = [
  null,
  'cyan', 'yellow', 'purple', 'green', 'red', 'blue', 'orange'
];

const SHAPES = [
  { type: 1, shape: [[1, 1, 1, 1]] },
  { type: 2, shape: [[1, 1], [1, 1]] },
  { type: 3, shape: [[1, 1, 1], [0, 1, 0]] },
  { type: 4, shape: [[0, 1, 1], [1, 1, 0]] },
  { type: 5, shape: [[1, 1, 0], [0, 1, 1]] },
  { type: 6, shape: [[1, 0, 0], [1, 1, 1]] },
  { type: 7, shape: [[0, 0, 1], [1, 1, 1]] }
];

const cols = 12;
const rows = 20;
const board = Array.from({ length: rows }, () => Array(cols).fill(0));

let score = 0;
let level = 1;
let linesClearedTotal = 0;
let dropInterval = 500;
let dropTimer = null;
let gameRunning = false;

let piece = createRandomPiece();
let nextPiece = createRandomPiece();

document.getElementById('start-button').addEventListener('click', () => {
  document.getElementById('title-screen').style.display = 'none';
  startGame();
});

function startGame() {
  if (dropTimer) clearInterval(dropTimer);
  board.forEach(row => row.fill(0));
  score = 0;
  level = 1;
  linesClearedTotal = 0;
  updateScoreDisplay();
  updateSpeedByLevel();
  piece = createRandomPiece();
  nextPiece = createRandomPiece();
  draw();
  gameRunning = true;
}

function restartGame() {
  const banner = document.getElementById('game-over-banner');
  if (banner) banner.remove();
  document.getElementById('game-wrapper').classList.remove('game-over');
  startGame();
}

function updateScoreDisplay() {
  document.getElementById('score').innerHTML = `<span>Score:</span><span>${score}</span>`;
  document.getElementById('level').innerHTML = `<span>Level:</span><span>${level}</span>`;
}

function updateSpeedByLevel() {
  dropInterval = Math.max(100, 500 - (level - 1) * 10);
  if (dropTimer) clearInterval(dropTimer);
  dropTimer = setInterval(update, dropInterval);
}

function createRandomPiece() {
  const random = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const shape = random.shape.map(row => row.map(cell => cell ? random.type : 0));
  return {
    x: Math.floor((cols - shape[0].length) / 2),
    y: 0,
    shape,
    type: random.type,
  };
}

function resetPiece() {
  piece = nextPiece;
  nextPiece = createRandomPiece();
  if (collide(board, piece)) {
    showGameOverBanner();
    gameRunning = false;
    clearInterval(dropTimer);
  }
}

function showScoreFx(amount) {
  const fx = document.createElement('span');
  fx.className = 'score-fx';
  fx.textContent = `+${amount}`;
  const scoreCard = document.getElementById('score');
  scoreCard.style.position = 'relative';
  fx.style.left = '50%';
  fx.style.top = '0';
  fx.style.transform = 'translateX(-50%)';
  scoreCard.appendChild(fx);
  setTimeout(() => fx.remove(), 800);
}

function showLevelUpBanner() {
  const banner = document.createElement('div');
  banner.id = 'level-up-banner';
  banner.textContent = 'LEVEL UP!';
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 1000);
}

function showGameOverBanner() {
  const wrapper = document.getElementById('game-wrapper');
  wrapper.classList.add('game-over');
  const banner = document.createElement('div');
  banner.id = 'game-over-banner';
  banner.innerHTML = `GAME OVER<br><button id="retry-button">Retry</button>`;
  wrapper.appendChild(banner);
  document.getElementById('retry-button').addEventListener('click', () => restartGame());
}

function drawGhostPiece() {
  let ghostY = piece.y;
  while (!collide(board, { ...piece, y: ghostY })) ghostY++;
  ghostY--;
  piece.shape.forEach((row, dy) => {
    row.forEach((value, dx) => {
      if (value) {
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect((piece.x + dx) * grid, (ghostY + dy) * grid, grid, grid);
      }
    });
  });
}

function drawNextPiece() {
  const canvas = document.getElementById('next');
  const nextContext = canvas.getContext('2d');
  nextContext.clearRect(0, 0, canvas.width, canvas.height);
  const shape = nextPiece.shape;
  const shapeWidth = shape[0].length * grid;
  const shapeHeight = shape.length * grid;
  const offsetX = Math.floor((canvas.width - shapeWidth) / 2);
  const offsetY = Math.floor((canvas.height - shapeHeight) / 2);
  shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        nextContext.fillStyle = COLORS[value];
        nextContext.fillRect(offsetX + x * grid, offsetY + y * grid, grid, grid);
      }
    });
  });
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = board[y][x];
      if (cell !== 0) {
        context.fillStyle = COLORS[cell];
        context.fillRect(x * grid, y * grid, grid, grid);
      }
    }
  }
  piece.shape.forEach((row, dy) => {
    row.forEach((value, dx) => {
      if (value) {
        context.fillStyle = COLORS[value];
        context.fillRect((piece.x + dx) * grid, (piece.y + dy) * grid, grid, grid);
      }
    });
  });
  drawGhostPiece();
  drawNextPiece();
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function collide(board, piece) {
  const { shape, x, y } = piece;
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx]) {
        const px = x + dx;
        const py = y + dy;
        if (px < 0 || px >= cols || py >= rows || (py >= 0 && board[py][px])) {
          return true;
        }
      }
    }
  }
  return false;
}

document.addEventListener('keydown', (event) => {
  if (!gameRunning) return;
  const prevX = piece.x;
  const prevY = piece.y;
  const prevShape = piece.shape;
  switch (event.key) {
    case 'ArrowLeft': piece.x--; if (collide(board, piece)) piece.x = prevX; break;
    case 'ArrowRight': piece.x++; if (collide(board, piece)) piece.x = prevX; break;
    case 'ArrowDown': piece.y++; if (collide(board, piece)) piece.y = prevY; break;
    case 'ArrowUp': piece.shape = rotate(piece.shape); if (collide(board, piece)) piece.shape = prevShape; break;
    case ' ': hardDrop(); break;
  }
  draw();
});

function clearLines() {
  let linesCleared = 0;
  for (let y = rows - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(cols).fill(0));
      y++;
      linesCleared++;
    }
  }
  if (linesCleared > 0) {
    const points = [0, 100, 300, 500, 800];
    score += points[linesCleared];
    showScoreFx(points[linesCleared]);
    linesClearedTotal += linesCleared;
    const newLevel = Math.floor(linesClearedTotal / 5) + 1;
    if (newLevel > level) {
      level = newLevel;
      updateSpeedByLevel();
      showLevelUpBanner();
    }
    updateScoreDisplay();
  }
}

function merge(board, piece) {
  piece.shape.forEach((row, dy) => {
    row.forEach((value, dx) => {
      if (value) {
        const px = piece.x + dx;
        const py = piece.y + dy;
        if (py >= 0) board[py][px] = value;
      }
    });
  });
}

function hardDrop() {
  while (!collide(board, piece)) piece.y++;
  piece.y--;
  merge(board, piece);
  clearLines();
  resetPiece();
  draw();
}

function update() {
  if (!gameRunning) return;
  piece.y++;
  if (collide(board, piece)) {
    piece.y--;
    merge(board, piece);
    clearLines();
    resetPiece();
  }
  draw();
}

window.onload = () => {
  document.body.setAttribute('tabindex', '-1');
  document.body.focus();
  updateScoreDisplay();
  draw();
};