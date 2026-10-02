(function (global) {
  "use strict";

  var Solver = global.SudokuSolver;
  var Generator = global.SudokuGenerator;
  var STORAGE_KEY = "vanilla-sudoku-current-game-v1";
  var THEME_KEY = "vanilla-sudoku-theme-v1";

  var state = null;
  var elements = {};
  var timerId = null;
  var saveTicker = 0;
  var printItemsCache = null;

  function emptyMarks(value) {
    return Array.from({ length: 9 }, function () {
      return Array(9).fill(value);
    });
  }

  function emptyNotes() {
    return Array.from({ length: 9 }, function () {
      return Array.from({ length: 9 }, function () {
        return [];
      });
    });
  }

  function isGrid(grid) {
    return Array.isArray(grid) &&
      grid.length === 9 &&
      grid.every(function (row) {
        return Array.isArray(row) &&
          row.length === 9 &&
          row.every(function (value) {
            return Number.isInteger(value) && value >= 0 && value <= 9;
          });
      });
  }

  function normalizeNotes(notes) {
    if (!Array.isArray(notes) || notes.length !== 9) {
      return emptyNotes();
    }

    return notes.map(function (row) {
      if (!Array.isArray(row) || row.length !== 9) {
        return Array.from({ length: 9 }, function () {
          return [];
        });
      }

      return row.map(function (cell) {
        if (!Array.isArray(cell)) {
          return [];
        }

        return cell
          .map(function (value) { return Number(value); })
          .filter(function (value, index, arr) {
            return Number.isInteger(value) && value >= 1 && value <= 9 && arr.indexOf(value) === index;
          })
          .sort(function (a, b) { return a - b; });
      });
    });
  }

  function normalizeMarks(marks) {
    if (!Array.isArray(marks) || marks.length !== 9) {
      return emptyMarks(false);
    }

    return marks.map(function (row) {
      if (!Array.isArray(row) || row.length !== 9) {
        return Array(9).fill(false);
      }

      return row.map(Boolean);
    });
  }

  function normalizePrintPerPage(value) {
    return Number(value) === 2 ? 2 : 1;
  }

  function makeState(bundle) {
    return {
      puzzle: Solver.cloneGrid(bundle.puzzle),
      solution: Solver.cloneGrid(bundle.solution),
      userGrid: Solver.cloneGrid(bundle.puzzle),
      notes: emptyNotes(),
      errorGrid: emptyMarks(false),
      difficulty: bundle.difficulty,
      blanks: bundle.blanks,
      generatedAt: bundle.generatedAt,
      mistakes: 0,
      elapsedTime: 0,
      noteMode: false,
      showPrintSolution: false,
      printPerPage: 1,
      completed: false,
      selectedCell: null
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      var saved = JSON.parse(raw);

      if (!isGrid(saved.puzzle) || !isGrid(saved.solution) || !isGrid(saved.userGrid)) {
        return null;
      }

      return {
        puzzle: Solver.cloneGrid(saved.puzzle),
        solution: Solver.cloneGrid(saved.solution),
        userGrid: Solver.cloneGrid(saved.userGrid),
        notes: normalizeNotes(saved.notes),
        errorGrid: normalizeMarks(saved.errorGrid),
        difficulty: Generator.DIFFICULTIES[saved.difficulty] ? saved.difficulty : "easy",
        blanks: Number.isInteger(saved.blanks) ? saved.blanks : countEmpty(saved.puzzle),
        generatedAt: saved.generatedAt || new Date().toISOString(),
        mistakes: Number.isInteger(saved.mistakes) ? saved.mistakes : 0,
        elapsedTime: Number.isInteger(saved.elapsedTime) ? saved.elapsedTime : 0,
        noteMode: Boolean(saved.noteMode),
        showPrintSolution: Boolean(saved.showPrintSolution),
        printPerPage: normalizePrintPerPage(saved.printPerPage),
        completed: Boolean(saved.completed),
        selectedCell: null
      };
    } catch (error) {
      return null;
    }
  }

  function saveState(force) {
    if (!state) {
      return;
    }

    if (!force) {
      saveTicker += 1;

      if (saveTicker % 5 !== 0) {
        return;
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        puzzle: state.puzzle,
        solution: state.solution,
        userGrid: state.userGrid,
        notes: state.notes,
        errorGrid: state.errorGrid,
        difficulty: state.difficulty,
        blanks: state.blanks,
        generatedAt: state.generatedAt,
        mistakes: state.mistakes,
        elapsedTime: state.elapsedTime,
        noteMode: state.noteMode,
        showPrintSolution: state.showPrintSolution,
        printPerPage: state.printPerPage,
        completed: state.completed
      }));
    } catch (error) {
      setStatus("저장 공간을 사용할 수 없습니다.");
    }
  }

  function countEmpty(grid) {
    var count = 0;

    for (var row = 0; row < 9; row += 1) {
      for (var col = 0; col < 9; col += 1) {
        if (grid[row][col] === 0) {
          count += 1;
        }
      }
    }

    return count;
  }

  function formatTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function formatDate(isoString) {
    var date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      date = new Date();
    }

    return date.getFullYear() + "." +
      String(date.getMonth() + 1).padStart(2, "0") + "." +
      String(date.getDate()).padStart(2, "0");
  }

  function cacheElements() {
    elements.board = document.getElementById("sudokuBoard");
    elements.numberPad = document.getElementById("numberPad");
    elements.difficultySelect = document.getElementById("difficultySelect");
    elements.newPuzzleBtn = document.getElementById("newPuzzleBtn");
    elements.resetInputBtn = document.getElementById("resetInputBtn");
    elements.checkBtn = document.getElementById("checkBtn");
    elements.hintBtn = document.getElementById("hintBtn");
    elements.noteModeBtn = document.getElementById("noteModeBtn");
    elements.answerBtn = document.getElementById("answerBtn");
    elements.printBtn = document.getElementById("printBtn");
    elements.printPuzzleOnly = document.getElementById("printPuzzleOnly");
    elements.printWithAnswer = document.getElementById("printWithAnswer");
    elements.printOnePerPage = document.getElementById("printOnePerPage");
    elements.printTwoPerPage = document.getElementById("printTwoPerPage");
    elements.clearStorageBtn = document.getElementById("clearStorageBtn");
    elements.themeToggle = document.getElementById("themeToggle");
    elements.timerValue = document.getElementById("timerValue");
    elements.emptyCount = document.getElementById("emptyCount");
    elements.mistakeCount = document.getElementById("mistakeCount");
    elements.difficultyBadge = document.getElementById("difficultyBadge");
    elements.statusMessage = document.getElementById("statusMessage");
    elements.printRoot = document.getElementById("printRoot");
  }

  function bindEvents() {
    elements.board.addEventListener("click", function (event) {
      var cell = event.target.closest(".cell");

      if (!cell) {
        return;
      }

      selectCell(Number(cell.dataset.row), Number(cell.dataset.col));
    });

    elements.numberPad.addEventListener("click", function (event) {
      var button = event.target.closest("button");

      if (!button) {
        return;
      }

      if (button.dataset.action === "erase") {
        clearSelectedCell();
        return;
      }

      var number = Number(button.dataset.number);

      if (number >= 1 && number <= 9) {
        enterNumber(number);
      }
    });

    document.addEventListener("keydown", handleKeyboardInput);
    elements.newPuzzleBtn.addEventListener("click", function () {
      generateNewPuzzle(elements.difficultySelect.value, true);
    });
    elements.resetInputBtn.addEventListener("click", resetInput);
    elements.checkBtn.addEventListener("click", function () {
      validateCurrent(true);
    });
    elements.hintBtn.addEventListener("click", giveHint);
    elements.noteModeBtn.addEventListener("click", toggleNoteMode);
    elements.answerBtn.addEventListener("click", revealSolution);
    elements.printBtn.addEventListener("click", printPuzzle);
    elements.clearStorageBtn.addEventListener("click", clearStorage);
    elements.themeToggle.addEventListener("click", toggleTheme);
    elements.printPuzzleOnly.addEventListener("change", updatePrintMode);
    elements.printWithAnswer.addEventListener("change", updatePrintMode);
    elements.printOnePerPage.addEventListener("change", updatePrintMode);
    elements.printTwoPerPage.addEventListener("change", updatePrintMode);

    window.addEventListener("beforeunload", function () {
      saveState(true);
    });
  }

  function handleKeyboardInput(event) {
    if (!state || !state.selectedCell) {
      return;
    }

    var tag = event.target.tagName;

    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      enterNumber(Number(event.key));
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      event.preventDefault();
      clearSelectedCell();
      return;
    }

    if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      toggleNoteMode();
    }
  }

  function setStatus(message) {
    elements.statusMessage.textContent = message;
  }

  function selectCell(row, col) {
    state.selectedCell = { row: row, col: col };
    renderBoard();
  }

  function isGiven(row, col) {
    return state.puzzle[row][col] !== 0;
  }

  function isSameBox(aRow, aCol, bRow, bCol) {
    return Math.floor(aRow / 3) === Math.floor(bRow / 3) &&
      Math.floor(aCol / 3) === Math.floor(bCol / 3);
  }

  function enterNumber(number) {
    if (!state || !state.selectedCell || state.completed) {
      return;
    }

    var row = state.selectedCell.row;
    var col = state.selectedCell.col;

    if (isGiven(row, col)) {
      return;
    }

    if (state.noteMode) {
      toggleNote(row, col, number);
      return;
    }

    var previous = state.userGrid[row][col];
    state.userGrid[row][col] = number;
    state.notes[row][col] = [];

    if (number !== state.solution[row][col]) {
      state.errorGrid[row][col] = true;

      if (previous !== number) {
        state.mistakes += 1;
      }

      setStatus("틀린 숫자입니다.");
    } else {
      state.errorGrid[row][col] = false;
      setStatus("입력했습니다.");
    }

    renderAll();
    checkCompletion();
    saveState(true);
  }

  function toggleNote(row, col, number) {
    if (state.userGrid[row][col] !== 0) {
      setStatus("메모는 빈칸에만 사용할 수 있습니다.");
      return;
    }

    var notes = state.notes[row][col].slice();
    var index = notes.indexOf(number);

    if (index >= 0) {
      notes.splice(index, 1);
    } else {
      notes.push(number);
    }

    state.notes[row][col] = notes.sort(function (a, b) { return a - b; });
    state.errorGrid[row][col] = false;
    setStatus("메모를 변경했습니다.");
    renderBoard();
    saveState(true);
  }

  function clearSelectedCell() {
    if (!state || !state.selectedCell || state.completed) {
      return;
    }

    var row = state.selectedCell.row;
    var col = state.selectedCell.col;

    if (isGiven(row, col)) {
      return;
    }

    state.userGrid[row][col] = 0;
    state.notes[row][col] = [];
    state.errorGrid[row][col] = false;
    setStatus("지웠습니다.");
    renderAll();
    saveState(true);
  }

  function validateCurrent(showMessage) {
    var wrong = 0;
    var empty = 0;

    for (var row = 0; row < 9; row += 1) {
      for (var col = 0; col < 9; col += 1) {
        var value = state.userGrid[row][col];

        if (value === 0) {
          empty += 1;
          state.errorGrid[row][col] = false;
        } else if (value !== state.solution[row][col]) {
          wrong += 1;
          state.errorGrid[row][col] = true;
        } else {
          state.errorGrid[row][col] = false;
        }
      }
    }

    if (wrong === 0 && empty === 0) {
      state.completed = true;
      stopTimer();
      setStatus("완성했습니다.");
    } else if (showMessage && wrong > 0) {
      setStatus("틀린 칸 " + wrong + "개를 표시했습니다.");
    } else if (showMessage) {
      setStatus("현재까지 맞습니다. 빈칸 " + empty + "개가 남았습니다.");
    }

    renderAll();
    saveState(true);

    return {
      wrong: wrong,
      empty: empty
    };
  }

  function checkCompletion() {
    if (countEmpty(state.userGrid) > 0) {
      return;
    }

    validateCurrent(false);
  }

  function giveHint() {
    if (!state || state.completed) {
      return;
    }

    var target = findHintTarget();

    if (!target) {
      validateCurrent(true);
      return;
    }

    state.userGrid[target.row][target.col] = state.solution[target.row][target.col];
    state.notes[target.row][target.col] = [];
    state.errorGrid[target.row][target.col] = false;
    state.selectedCell = { row: target.row, col: target.col };
    setStatus("힌트를 적용했습니다.");
    renderAll();
    checkCompletion();
    saveState(true);
  }

  function findHintTarget() {
    if (state.selectedCell && !isGiven(state.selectedCell.row, state.selectedCell.col)) {
      var selectedValue = state.userGrid[state.selectedCell.row][state.selectedCell.col];

      if (selectedValue === 0 || selectedValue !== state.solution[state.selectedCell.row][state.selectedCell.col]) {
        return state.selectedCell;
      }
    }

    for (var row = 0; row < 9; row += 1) {
      for (var col = 0; col < 9; col += 1) {
        if (!isGiven(row, col) && state.userGrid[row][col] === 0) {
          return { row: row, col: col };
        }
      }
    }

    for (var r = 0; r < 9; r += 1) {
      for (var c = 0; c < 9; c += 1) {
        if (!isGiven(r, c) && state.userGrid[r][c] !== state.solution[r][c]) {
          return { row: r, col: c };
        }
      }
    }

    return null;
  }

  function toggleNoteMode() {
    state.noteMode = !state.noteMode;
    elements.noteModeBtn.setAttribute("aria-pressed", String(state.noteMode));
    setStatus(state.noteMode ? "메모 모드입니다." : "일반 입력 모드입니다.");
    saveState(true);
  }

  function revealSolution() {
    if (!state || state.completed) {
      return;
    }

    if (!window.confirm("정답을 표시하면 현재 풀이가 종료됩니다. 계속할까요?")) {
      return;
    }

    state.userGrid = Solver.cloneGrid(state.solution);
    state.notes = emptyNotes();
    state.errorGrid = emptyMarks(false);
    state.completed = true;
    stopTimer();
    setStatus("정답을 표시했습니다.");
    renderAll();
    saveState(true);
  }

  function resetInput() {
    if (!state) {
      return;
    }

    state.userGrid = Solver.cloneGrid(state.puzzle);
    state.notes = emptyNotes();
    state.errorGrid = emptyMarks(false);
    state.mistakes = 0;
    state.elapsedTime = 0;
    state.completed = false;
    state.selectedCell = null;
    setStatus("입력을 초기화했습니다.");
    startTimer();
    renderAll();
    saveState(true);
  }

  function generateNewPuzzle(difficulty, asyncMode) {
    var run = function () {
      setGenerating(true);

      try {
        var bundle = Generator.generatePuzzle(difficulty);
        state = makeState(bundle);
        state.showPrintSolution = elements.printWithAnswer.checked;
        state.printPerPage = getSelectedPrintPerPage();
        invalidatePrintCache();
        elements.difficultySelect.value = state.difficulty;
        setStatus("새 퍼즐을 생성했습니다.");
        startTimer();
        renderAll();
        saveState(true);
      } catch (error) {
        setStatus("퍼즐 생성에 실패해 다시 시도합니다.");
        window.setTimeout(function () {
          generateNewPuzzle(difficulty, true);
        }, 60);
      } finally {
        setGenerating(false);
      }
    };

    if (asyncMode) {
      setStatus("퍼즐을 생성하는 중입니다.");
      setGenerating(true);
      window.setTimeout(run, 30);
    } else {
      run();
    }
  }

  function setGenerating(isGenerating) {
    [
      elements.newPuzzleBtn,
      elements.resetInputBtn,
      elements.checkBtn,
      elements.hintBtn,
      elements.answerBtn,
      elements.printBtn
    ].forEach(function (button) {
      button.disabled = isGenerating;
    });
  }

  function clearStorage() {
    if (!window.confirm("저장된 진행 기록을 삭제하고 새 퍼즐을 만들까요?")) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      setStatus("저장 기록을 삭제할 수 없습니다.");
      return;
    }

    generateNewPuzzle(elements.difficultySelect.value, true);
  }

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
      return "light";
    }
  }

  function applyTheme(theme) {
    var nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    elements.themeToggle.textContent = nextTheme === "dark" ? "라이트모드" : "다크모드";

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      return;
    }
  }

  function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  }

  function getSelectedPrintPerPage() {
    return elements.printTwoPerPage.checked ? 2 : 1;
  }

  function invalidatePrintCache() {
    printItemsCache = null;
  }

  function updatePrintMode() {
    state.showPrintSolution = elements.printWithAnswer.checked;
    var nextPrintPerPage = getSelectedPrintPerPage();

    if (state.printPerPage !== nextPrintPerPage) {
      state.printPerPage = nextPrintPerPage;
      invalidatePrintCache();
    }

    updatePrintRoot();
    saveState(true);
  }

  function printPuzzle() {
    updatePrintMode();
    window.print();
  }

  function renderAll() {
    renderBoard();
    renderStats();
    renderControls();
    updatePrintRoot();
  }

  function renderStats() {
    var difficulty = Generator.DIFFICULTIES[state.difficulty];
    elements.timerValue.textContent = formatTime(state.elapsedTime);
    elements.emptyCount.textContent = String(countEmpty(state.userGrid));
    elements.mistakeCount.textContent = String(state.mistakes);
    elements.difficultyBadge.textContent = difficulty.label + " · 빈칸 " + state.blanks + "개";
  }

  function renderControls() {
    elements.difficultySelect.value = state.difficulty;
    elements.noteModeBtn.setAttribute("aria-pressed", String(state.noteMode));
    elements.printWithAnswer.checked = state.showPrintSolution;
    elements.printPuzzleOnly.checked = !state.showPrintSolution;
    elements.printTwoPerPage.checked = state.printPerPage === 2;
    elements.printOnePerPage.checked = state.printPerPage !== 2;
  }

  function renderBoard() {
    var fragment = document.createDocumentFragment();
    var selected = state.selectedCell;
    var selectedValue = selected ? state.userGrid[selected.row][selected.col] : 0;

    elements.board.innerHTML = "";

    for (var row = 0; row < 9; row += 1) {
      for (var col = 0; col < 9; col += 1) {
        var value = state.userGrid[row][col];
        var cell = document.createElement("button");
        var classes = ["cell"];

        if (isGiven(row, col)) {
          classes.push("given");
        }

        if ((col + 1) % 3 === 0 && col !== 8) {
          classes.push("box-right");
        }

        if ((row + 1) % 3 === 0 && row !== 8) {
          classes.push("box-bottom");
        }

        if (state.errorGrid[row][col]) {
          classes.push("error");
        }

        if (selected) {
          if (row === selected.row && col === selected.col) {
            classes.push("selected");
          } else if (row === selected.row || col === selected.col || isSameBox(row, col, selected.row, selected.col)) {
            classes.push("peer");
          }

          if (selectedValue !== 0 && value === selectedValue) {
            classes.push("same-number");
          }
        }

        cell.type = "button";
        cell.className = classes.join(" ");
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", (row + 1) + "행 " + (col + 1) + "열");

        if (value !== 0) {
          cell.textContent = String(value);
        } else if (state.notes[row][col].length > 0) {
          cell.appendChild(createNoteGrid(state.notes[row][col]));
        }

        fragment.appendChild(cell);
      }
    }

    elements.board.appendChild(fragment);
  }

  function createNoteGrid(notes) {
    var grid = document.createElement("span");
    grid.className = "note-grid";

    for (var number = 1; number <= 9; number += 1) {
      var slot = document.createElement("span");
      slot.textContent = notes.indexOf(number) >= 0 ? String(number) : "";
      grid.appendChild(slot);
    }

    return grid;
  }

  function updatePrintRoot() {
    if (!state) {
      return;
    }

    var items = getPrintItems();

    elements.printRoot.innerHTML = "";
    elements.printRoot.appendChild(createPrintPage("문제", items, false));

    if (state.showPrintSolution) {
      elements.printRoot.appendChild(createPrintPage("정답", items, true));
    }
  }

  function getCurrentPrintItem() {
    return {
      puzzle: state.puzzle,
      solution: state.solution,
      difficulty: state.difficulty,
      blanks: state.blanks,
      generatedAt: state.generatedAt
    };
  }

  function bundleToPrintItem(bundle) {
    return {
      puzzle: bundle.puzzle,
      solution: bundle.solution,
      difficulty: bundle.difficulty,
      blanks: bundle.blanks,
      generatedAt: bundle.generatedAt
    };
  }

  function getPrintItems() {
    var count = normalizePrintPerPage(state.printPerPage);
    var needsRefresh = !printItemsCache ||
      printItemsCache.length !== count ||
      printItemsCache[0].generatedAt !== state.generatedAt;

    if (!needsRefresh) {
      return printItemsCache;
    }

    printItemsCache = [getCurrentPrintItem()];

    while (printItemsCache.length < count) {
      printItemsCache.push(bundleToPrintItem(Generator.generatePuzzle(state.difficulty)));
    }

    return printItemsCache;
  }

  function createPrintPage(type, items, isAnswer) {
    var page = document.createElement("article");
    var title = document.createElement("h2");
    var sheet = document.createElement("div");
    var layoutClass = items.length === 2 ? "two-up" : "one-up";

    page.className = "print-page " + layoutClass;
    title.className = "print-title";
    title.textContent = "스도쿠 " + type;
    sheet.className = "print-sheet";

    items.forEach(function (item, index) {
      sheet.appendChild(createPrintItem(type, item, index + 1, isAnswer));
    });

    page.appendChild(title);
    page.appendChild(sheet);
    return page;
  }

  function createPrintItem(type, item, number, isAnswer) {
    var wrapper = document.createElement("section");
    var heading = document.createElement("h3");
    var meta = document.createElement("div");
    var board = document.createElement("div");
    var difficulty = Generator.DIFFICULTIES[item.difficulty];
    var grid = isAnswer ? item.solution : item.puzzle;

    wrapper.className = "print-item";
    heading.className = "print-item-title";
    heading.textContent = type + " " + number;
    meta.className = "print-meta";
    meta.innerHTML = "<span>난이도 " + difficulty.label + "</span>" +
      "<span>생성일 " + formatDate(item.generatedAt) + "</span>";
    board.className = "print-grid";

    for (var row = 0; row < 9; row += 1) {
      for (var col = 0; col < 9; col += 1) {
        var value = grid[row][col];
        var cell = document.createElement("div");
        var classes = ["print-cell"];

        if ((col + 1) % 3 === 0 && col !== 8) {
          classes.push("box-right");
        }

        if ((row + 1) % 3 === 0 && row !== 8) {
          classes.push("box-bottom");
        }

        if (isAnswer) {
          classes.push("answer");
        } else if (value !== 0) {
          classes.push("clue");
        }

        cell.className = classes.join(" ");
        cell.textContent = value === 0 ? "" : String(value);
        board.appendChild(cell);
      }
    }

    wrapper.appendChild(heading);
    wrapper.appendChild(meta);
    wrapper.appendChild(board);
    return wrapper;
  }

  function startTimer() {
    stopTimer();

    if (!state || state.completed) {
      return;
    }

    timerId = window.setInterval(function () {
      state.elapsedTime += 1;
      elements.timerValue.textContent = formatTime(state.elapsedTime);
      saveState(false);
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function init() {
    cacheElements();
    bindEvents();
    applyTheme(getTheme());
    state = loadState();

    if (!state) {
      generateNewPuzzle("easy", false);
      return;
    }

    elements.difficultySelect.value = state.difficulty;
    setStatus("저장된 퍼즐을 불러왔습니다.");
    renderAll();
    startTimer();
  }

  global.SudokuUI = {
    init: init
  };
})(window);
