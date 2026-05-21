(function (global) {
  "use strict";

  var Solver = global.SudokuSolver;

  var DIFFICULTIES = {
    easy: { label: "쉬움", blanks: 35, tolerance: 2, maxAttempts: 12 },
    medium: { label: "보통", blanks: 45, tolerance: 2, maxAttempts: 16 },
    hard: { label: "어려움", blanks: 52, tolerance: 3, maxAttempts: 22 },
    expert: { label: "전문가", blanks: 58, tolerance: 4, maxAttempts: 30 }
  };

  function pattern(row, col) {
    return (3 * (row % 3) + Math.floor(row / 3) + col) % 9;
  }

  function shuffledUnitIndexes() {
    var groups = Solver.shuffle([0, 1, 2]);
    var result = [];

    groups.forEach(function (group) {
      Solver.shuffle([0, 1, 2]).forEach(function (item) {
        result.push(group * 3 + item);
      });
    });

    return result;
  }

  function createSolvedGrid() {
    var rows = shuffledUnitIndexes();
    var cols = shuffledUnitIndexes();
    var nums = Solver.shuffle(Solver.numbers());

    return rows.map(function (row) {
      return cols.map(function (col) {
        return nums[pattern(row, col)];
      });
    });
  }

  function allPositions() {
    var positions = [];

    for (var row = 0; row < 9; row += 1) {
      for (var col = 0; col < 9; col += 1) {
        positions.push({ row: row, col: col });
      }
    }

    return Solver.shuffle(positions);
  }

  function removeCellsWithUniqueSolution(solution, targetBlanks) {
    var puzzle = Solver.cloneGrid(solution);
    var blanks = 0;
    var positions = allPositions();

    for (var i = 0; i < positions.length && blanks < targetBlanks; i += 1) {
      var row = positions[i].row;
      var col = positions[i].col;
      var value = puzzle[row][col];

      puzzle[row][col] = 0;

      if (Solver.countSolutions(puzzle, 2) === 1) {
        blanks += 1;
      } else {
        puzzle[row][col] = value;
      }
    }

    return {
      puzzle: puzzle,
      blanks: blanks
    };
  }

  function getDifficulty(key) {
    return DIFFICULTIES[key] ? key : "easy";
  }

  function generatePuzzle(difficultyKey) {
    var difficulty = getDifficulty(difficultyKey);
    var config = DIFFICULTIES[difficulty];
    var best = null;

    for (var attempt = 0; attempt < config.maxAttempts; attempt += 1) {
      var solution = createSolvedGrid();
      var removed = removeCellsWithUniqueSolution(solution, config.blanks);
      var result = {
        puzzle: removed.puzzle,
        solution: solution,
        difficulty: difficulty,
        blanks: removed.blanks,
        generatedAt: new Date().toISOString()
      };

      if (!best || result.blanks > best.blanks) {
        best = result;
      }

      if (result.blanks >= config.blanks - config.tolerance) {
        return result;
      }
    }

    return best;
  }

  global.SudokuGenerator = {
    DIFFICULTIES: DIFFICULTIES,
    createSolvedGrid: createSolvedGrid,
    generatePuzzle: generatePuzzle
  };
})(window);
