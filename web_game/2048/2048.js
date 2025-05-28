const grid = document.getElementById("grid");
const scoreDisplay = document.getElementById("score-value");
let tiles = [];
let board = [...Array(4)].map(() => Array(4).fill(null));
let score = 0;

function createBoard() {
  for (let i = 0; i < 16; i++) {
    let tile = document.createElement("div");
    tile.classList.add("tile");
    tile.textContent = "";
    tiles.push(tile);
    grid.appendChild(tile);
  }
  generate();
  generate();
}

function generate() {
  let emptyTiles = tiles.filter(t => t.textContent === "");
  if (emptyTiles.length === 0) return;
  let randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  randomTile.textContent = Math.random() < 0.9 ? "2" : "4";
  updateTileStyle(randomTile);
}

function updateTileStyle(tile) {
  const colors = {
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
  };
  let value = tile.textContent;
  tile.style.backgroundColor = colors[value] || "#cdc1b4";
  tile.style.color = value <= 4 ? "#776e65" : "#f9f6f2";
}

function move(direction) {
  let moved = false;

  const getIndex = (row, col) => row * 4 + col;

  for (let r = 0; r < 4; r++) {
    let line = [];
    for (let c = 0; c < 4; c++) {
      let index = direction === "left" || direction === "right" ? getIndex(r, c) : getIndex(c, r);
      let val = parseInt(tiles[index].textContent) || 0;
      line.push(val);
    }

    if (direction === "right" || direction === "down") line.reverse();

    let merged = mergeLine(line);

    if (direction === "right" || direction === "down") merged.reverse();

    for (let c = 0; c < 4; c++) {
      let index = direction === "left" || direction === "right" ? getIndex(r, c) : getIndex(c, r);
      if (tiles[index].textContent != merged[c]) {
        tiles[index].textContent = merged[c] === 0 ? "" : merged[c];
        updateTileStyle(tiles[index]);
        moved = true;
      }
    }
  }

  if (moved) {
    generate();
    checkGameOver();
  }
}

function mergeLine(line) {
  let filtered = line.filter(n => n !== 0);
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered[i + 1] = 0;
    }
  }
  scoreDisplay.textContent = score;
  return [...filtered.filter(n => n !== 0), ...Array(4 - filtered.filter(n => n !== 0).length).fill(0)];
}

function checkGameOver() {
  const getIndex = (row, col) => row * 4 + col;

  // 빈 칸이 있는지 확인
  for (let i = 0; i < 16; i++) {
    if (tiles[i].textContent === "") return;
  }

  // 인접한 타일끼리 합칠 수 있는지 확인
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let currIndex = getIndex(row, col);
      let currVal = parseInt(tiles[currIndex].textContent);

      // 오른쪽
      if (col < 3) {
        let rightVal = parseInt(tiles[getIndex(row, col + 1)].textContent);
        if (currVal === rightVal) return;
      }

      // 아래쪽
      if (row < 3) {
        let downVal = parseInt(tiles[getIndex(row + 1, col)].textContent);
        if (currVal === downVal) return;
      }
    }
  }

  // 여기까지 오면 게임 오버!
  document.getElementById("game-over").classList.remove("hidden");
}

function restartGame() {
  // 모든 타일 초기화
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].textContent = "";
    updateTileStyle(tiles[i]);
  }

  // 점수 초기화
  score = 0;
  scoreDisplay.textContent = 0;

  // 게임오버 숨기기
  document.getElementById("game-over").classList.add("hidden");

  // 새 게임 시작
  generate();
  generate();
}

document.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft": move("left"); break;
    case "ArrowRight": move("right"); break;
    case "ArrowUp": move("up"); break;
    case "ArrowDown": move("down"); break;
  }
});

function createTile(x, y, value) {
  const container = document.createElement("div");
  container.classList.add("tile-container");

  const tile = document.createElement("div");
  tile.classList.add("tile");
  tile.textContent = value;
  updateTileStyle(tile);

  container.appendChild(tile);
  grid.appendChild(container);

  setTilePosition(container, x, y);
  return { container, tile, x, y, value };
}

function setTilePosition(container, x, y) {
  container.style.transform = `translate(${y * 110}px, ${x * 110}px)`;
}

createBoard();
