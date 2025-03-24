const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 20;

const COLORS = [
    null,           // 0은 빈칸
    'cyan',         // 1: I
    'yellow',       // 2: O
    'purple',       // 3: T
    'green',        // 4: S
    'red',          // 5: Z
    'blue',         // 6: J
    'orange'        // 7: L
  ];


const SHAPES = [
  // I
  {
    type: 1,
    shape: [
      [1, 1, 1, 1],
    ]
  },
  // O
  {
    type: 2,
    shape: [
      [1, 1],
      [1, 1],
    ]
  },
  // T
  {
    type: 3,
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ]
  },
  // S
  {
    type: 4,
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ]
  },
  // Z
  {
    type: 5,
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ]
  },
  // J
  {
    type: 6,
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ]
  },
  // L
  {
    type: 7,
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ]
  }
];


const cols = 12;
const rows = 20;

// 보드 생성 (0은 빈칸)
const board = Array.from({ length: rows }, () => Array(cols).fill(0));

let score = 0;

let piece = createRandomPiece();

function updateScoreDisplay() {
  document.getElementById('score').textContent = `Score: ${score}`;
}

function createRandomPiece() {
    const random = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  
    // 블록 내부 숫자를 해당 type 값으로 설정
    const shape = random.shape.map(row => row.map(cell => cell ? random.type : 0));
  
    return {
      x: Math.floor((cols - shape[0].length) / 2),
      y: 0,
      shape,
      type: random.type,
    };
  }

  function resetPiece() {
    piece = createRandomPiece();
  
    if (collide(board, piece)) {
      alert("Game Over!");
      board.forEach(row => row.fill(0));
      score = 0;
      updateScoreDisplay();
    }
  }

// 그려주기 코드
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  
    // 고정된 블록 그리기
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = board[y][x];
        if (cell !== 0) {
          context.fillStyle = COLORS[cell];
          context.fillRect(x * grid, y * grid, grid, grid);
        }
      }
    }
  
    // 현재 블록 그리기
    piece.shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value) {
          context.fillStyle = COLORS[value];
          context.fillRect((piece.x + dx) * grid, (piece.y + dy) * grid, grid, grid);
        }
      });
    });
  }

// 회전하기
function rotate(matrix) {
    // 시계 방향 90도 회전: 행 → 열로, 역순
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

// 충돌체크
function collide(board, piece) {
    const { shape, x, y } = piece;
  
    for (let dy = 0; dy < shape.length; dy++) {
      for (let dx = 0; dx < shape[dy].length; dx++) {
        if (shape[dy][dx]) {
          const px = x + dx;
          const py = y + dy;
  
          // 1. 보드 경계 바깥이면 충돌
          if (px < 0 || px >= cols || py >= rows) {
            return true;
          }
  
          // 2. 보드 내부인데 이미 차있으면 충돌
          if (py >= 0 && board[py][px]) {
            return true;
          }
        }
      }
    }
  
    return false;
  }

// 키 입력 코드
document.addEventListener('keydown', (event) => {
    const prevX = piece.x;
    const prevY = piece.y;
    const prevShape = piece.shape;
  
    switch (event.key) {
      case 'ArrowLeft':
        piece.x--;
        if (collide(board, piece)) piece.x = prevX;
        break;
      case 'ArrowRight':
        piece.x++;
        if (collide(board, piece)) piece.x = prevX;
        break;
      case 'ArrowDown':
        piece.y++;
        if (collide(board, piece)) piece.y = prevY;
        break;
      case 'ArrowUp':
        piece.shape = rotate(piece.shape);
        if (collide(board, piece)) piece.shape = prevShape;
        break;
    }
    draw();
});

function clearLines() {
    let linesCleared = 0;

  for (let y = rows - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);                 // 줄 제거
      board.unshift(Array(cols).fill(0)); // 위에 빈 줄 삽입
      y++; // 같은 줄 다시 검사
      linesCleared++;
    }
  }

  // 점수 계산
  if (linesCleared > 0) {
    const points = [0, 100, 300, 500, 800];
    score += points[linesCleared];
    updateScoreDisplay();
  }
}

// 블록을 보드에 고정하는 함수
function merge(board, piece) {
    piece.shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value) {
          const px = piece.x + dx;
          const py = piece.y + dy;
          if (py >= 0) {
            board[py][px] = value; // value는 이제 1~7
          }
        }
      });
    });
  }


function update() {
    piece.y++;
  
    if (collide(board, piece)) {
      piece.y--;
      merge(board, piece);
      clearLines();       // ✅ 줄 제거!
      resetPiece();
    }
  
    draw();
  }


setInterval(update, 500);