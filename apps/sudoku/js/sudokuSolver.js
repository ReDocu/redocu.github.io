(function (global) {
  "use strict";

  var SIZE = 9;
  var BOX = 3;

  function createEmptyGrid() {
    return Array.from({ length: SIZE }, function () {
      return Array(SIZE).fill(0);
    });
  }

  function cloneGrid(grid) {
    return grid.map(function (row) {
      return row.slice();
    });
  }

  function numbers() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  function shuffle(items) {
    var result = items.slice();

    for (var i = result.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }

    return result;
  }

  function isValidPlacement(grid, row, col, num) {
    if (num < 1 || num > 9) {
      return false;
    }

    for (var i = 0; i < SIZE; i += 1) {
      if (i !== col && grid[row][i] === num) {
        return false;
      }

      if (i !== row && grid[i][col] === num) {
        return false;
      }
    }

    var boxRow = Math.floor(row / BOX) * BOX;
    var boxCol = Math.floor(col / BOX) * BOX;

    for (var r = boxRow; r < boxRow + BOX; r += 1) {
      for (var c = boxCol; c < boxCol + BOX; c += 1) {
        if ((r !== row || c !== col) && grid[r][c] === num) {
          return false;
        }
      }
    }

    return true;
  }

  function getCandidates(grid, row, col, randomized) {
    var list = [];

    for (var num = 1; num <= SIZE; num += 1) {
      if (isValidPlacement(grid, row, col, num)) {
        list.push(num);
      }
    }

    return randomized ? shuffle(list) : list;
  }

  function findBestEmptyCell(grid) {
    var best = null;

    for (var row = 0; row < SIZE; row += 1) {
      for (var col = 0; col < SIZE; col += 1) {
        if (grid[row][col] !== 0) {
          continue;
        }

        var candidates = getCandidates(grid, row, col, false);

        if (!best || candidates.length < best.candidates.length) {
          best = { row: row, col: col, candidates: candidates };
        }

        if (best.candidates.length === 0) {
          return best;
        }
      }
    }

    return best;
  }

  function solveGrid(grid, randomized) {
    var cell = findBestEmptyCell(grid);

    if (!cell) {
      return true;
    }

    var candidates = randomized ? shuffle(cell.candidates) : cell.candidates;

    for (var i = 0; i < candidates.length; i += 1) {
      grid[cell.row][cell.col] = candidates[i];

      if (solveGrid(grid, randomized)) {
        return true;
      }

      grid[cell.row][cell.col] = 0;
    }

    return false;
  }

  function countSolutions(grid, limit) {
    var max = limit || 2;
    var work = cloneGrid(grid);
    var count = 0;

    function backtrack() {
      if (count >= max) {
        return;
      }

      var cell = findBestEmptyCell(work);

      if (!cell) {
        count += 1;
        return;
      }

      if (cell.candidates.length === 0) {
        return;
      }

      for (var i = 0; i < cell.candidates.length; i += 1) {
        work[cell.row][cell.col] = cell.candidates[i];
        backtrack();
        work[cell.row][cell.col] = 0;

        if (count >= max) {
          return;
        }
      }
    }

    backtrack();
    return count;
  }

  function hasNoConflicts(grid) {
    for (var row = 0; row < SIZE; row += 1) {
      for (var col = 0; col < SIZE; col += 1) {
        var value = grid[row][col];

        if (value !== 0 && !isValidPlacement(grid, row, col, value)) {
          return false;
        }
      }
    }

    return true;
  }

  function isComplete(grid) {
    for (var row = 0; row < SIZE; row += 1) {
      for (var col = 0; col < SIZE; col += 1) {
        if (grid[row][col] === 0) {
          return false;
        }
      }
    }

    return hasNoConflicts(grid);
  }

  global.SudokuSolver = {
    SIZE: SIZE,
    BOX: BOX,
    createEmptyGrid: createEmptyGrid,
    cloneGrid: cloneGrid,
    numbers: numbers,
    shuffle: shuffle,
    isValidPlacement: isValidPlacement,
    getCandidates: getCandidates,
    solveGrid: solveGrid,
    countSolutions: countSolutions,
    hasNoConflicts: hasNoConflicts,
    isComplete: isComplete
  };
})(window);
