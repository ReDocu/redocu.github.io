/* 보드 렌더링·입력 처리·보조 패널 — GDD §5·§7 */
(function () {
  "use strict";

  var SAVE_KEY = "kakuroSaveV1";
  var THEME_KEY = "kakuroTheme";
  var PRESET_LABEL = { 6: "입문", 8: "초급", 10: "중급", 12: "고급", 16: "전문가" };

  var els = {};
  var puzzle = null;
  var values = null; // Uint8Array — whites 순서, 0 = 빈 칸
  var notes = null; // whites 순서, 각 원소는 숫자 배열
  var cellEls = null; // [r][c] → DOM
  var selected = -1; // white idx
  var noteMode = false;
  var autoCand = false;
  var autoCandMap = null;
  var history = [];
  var hintsUsed = 0;
  var elapsed = 0;
  var timerId = null;
  var finished = false;
  var generating = false;

  /* ── 유틸 ── */

  function $(id) {
    return document.getElementById(id);
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function setStatus(msg) {
    els.status.textContent = msg;
  }

  /* ── 타이머 ── */

  function startTimer() {
    stopTimer();
    timerId = setInterval(function () {
      elapsed++;
      els.timer.textContent = formatTime(elapsed);
      if (elapsed % 5 === 0) save();
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  /* ── 저장/복원 (GDD §5.4) ── */

  function save() {
    if (!puzzle) return;
    var data = {
      n: puzzle.n,
      block: puzzle.block.map(function (row) {
        return row.map(function (b) { return b ? "1" : "0"; }).join("");
      }),
      solution: puzzle.solution.map(function (row) { return row.join(""); }),
      values: Array.from(values),
      notes: notes.map(function (set) { return set.slice(); }),
      elapsed: elapsed,
      hintsUsed: hintsUsed,
      finished: finished
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* 저장 불가 환경은 무시 */ }
  }

  function tryLoad() {
    var raw = null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (e) { return false; }
    if (!raw) return false;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) { return false; }
    if (!data || data.finished || !data.block || !data.solution) return false;

    var block = data.block.map(function (row) {
      return row.split("").map(function (ch) { return ch === "1"; });
    });
    var solution = data.solution.map(function (row) {
      return row.split("").map(Number);
    });
    var loaded = window.KakuroGenerator.buildPuzzle(block, data.n, solution);
    if (loaded.whites.length !== data.values.length) return false;

    puzzle = loaded;
    values = Uint8Array.from(data.values);
    notes = data.notes.map(function (arr) { return arr.slice(); });
    elapsed = data.elapsed || 0;
    hintsUsed = data.hintsUsed || 0;
    finished = false;
    history = [];
    els.difficulty.value = String(data.n);
    afterPuzzleReady("저장된 판을 이어서 진행합니다.");
    return true;
  }

  /* ── 새 퍼즐 ── */

  function newGame() {
    if (generating) return;
    var n = parseInt(els.difficulty.value, 10);
    generating = true;
    finished = false;
    stopTimer();
    els.genOverlay.hidden = false;
    els.winOverlay.hidden = true;
    els.newBtn.disabled = true;
    setStatus("퍼즐 생성 중…");

    window.KakuroGenerator.generateAsync(n, function (result) {
      generating = false;
      els.genOverlay.hidden = true;
      els.newBtn.disabled = false;
      if (!result) {
        setStatus("퍼즐 생성에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      puzzle = result.puzzle;
      values = new Uint8Array(puzzle.whites.length);
      notes = puzzle.whites.map(function () { return []; });
      elapsed = 0;
      hintsUsed = 0;
      history = [];
      var note = result.logical
        ? "논리 풀이 검증됨"
        : result.unique ? "유일해 검증됨" : "주의: 유일해 검증 실패";
      afterPuzzleReady("새 퍼즐이 준비되었습니다 · " + note);
      save();
    }, function (attempts) {
      els.genOverlayText.textContent = "퍼즐 생성 중… (시도 " + attempts + ")";
    });
  }

  function afterPuzzleReady(message) {
    selected = -1;
    autoCandMap = null;
    els.badge.textContent =
      (PRESET_LABEL[puzzle.n] || "커스텀") + " · " + puzzle.n + "×" + puzzle.n;
    els.timer.textContent = formatTime(elapsed);
    els.hintCount.textContent = String(hintsUsed);
    renderBoard();
    refresh();
    setStatus(message);
    startTimer();
  }

  /* ── 보드 렌더링 (GDD §7) ── */

  function renderBoard() {
    var t = puzzle.t;
    els.board.innerHTML = "";
    els.board.style.gridTemplateColumns = "repeat(" + t + ", 1fr)";
    cellEls = [];

    for (var r = 0; r < t; r++) {
      cellEls.push([]);
      for (var c = 0; c < t; c++) {
        var cell = document.createElement("div");
        var isBlock = r >= puzzle.block.length || puzzle.block[r][c];
        if (!isBlock) {
          cell.className = "cell white";
          cell.dataset.w = String(puzzle.whiteAt[r][c]);
          var val = document.createElement("span");
          val.className = "value";
          cell.appendChild(val);
          var noteEl = document.createElement("div");
          noteEl.className = "notes";
          cell.appendChild(noteEl);
        } else {
          var a = puzzle.clueA[r] ? puzzle.clueA[r][c] : 0;
          var d = puzzle.clueD[r] ? puzzle.clueD[r][c] : 0;
          if (a || d) {
            cell.className = "cell clue";
            if (a) {
              var sa = document.createElement("span");
              sa.className = "clue-a";
              sa.textContent = a;
              cell.appendChild(sa);
            }
            if (d) {
              var sd = document.createElement("span");
              sd.className = "clue-d";
              sd.textContent = d;
              cell.appendChild(sd);
            }
          } else {
            cell.className = "cell block";
          }
        }
        els.board.appendChild(cell);
        cellEls[r].push(cell);
      }
    }
    adjustFonts();
  }

  function adjustFonts() {
    if (!puzzle) return;
    var px = els.board.clientWidth / puzzle.t;
    els.board.style.setProperty("--cell-font", Math.max(11, px * 0.48) + "px");
    els.board.style.setProperty("--clue-font", Math.max(7, px * 0.27) + "px");
    els.board.style.setProperty("--note-font", Math.max(6, px * 0.2) + "px");
  }

  /* ── 상태 계산 ── */

  /* 런 규칙 위반(중복·합 초과·합 불일치) 검사 — GDD §5.2 오류 표시 ① */
  function computeErrors() {
    var cellErr = {};
    var runErr = {};
    for (var ri = 0; ri < puzzle.runs.length; ri++) {
      var run = puzzle.runs[ri];
      var seen = {};
      var sum = 0;
      var empty = 0;
      var i;
      for (i = 0; i < run.cells.length; i++) {
        var v = values[run.cells[i]];
        if (!v) { empty++; continue; }
        sum += v;
        if (seen[v] !== undefined) {
          cellErr[run.cells[i]] = true;
          cellErr[seen[v]] = true;
          runErr[ri] = true;
        }
        seen[v] = run.cells[i];
      }
      if (!empty && sum !== run.sum) {
        runErr[ri] = true;
        for (i = 0; i < run.cells.length; i++) cellErr[run.cells[i]] = true;
      } else if (empty && sum >= run.sum) {
        runErr[ri] = true; // 빈 칸이 남았는데 합이 이미 목표 이상
      }
    }
    return { cellErr: cellErr, runErr: runErr };
  }

  function isComplete() {
    for (var w = 0; w < values.length; w++) {
      if (!values[w]) return false;
    }
    var err = computeErrors();
    for (var key in err.runErr) {
      if (Object.prototype.hasOwnProperty.call(err.runErr, key)) return false;
    }
    return true;
  }

  /* ── 화면 갱신 ── */

  function refresh() {
    if (!puzzle) return;
    var err = computeErrors();
    var inRun = {};
    if (selected >= 0) {
      var wsel = puzzle.whites[selected];
      puzzle.runs[wsel.a].cells.forEach(function (w) { inRun[w] = true; });
      puzzle.runs[wsel.d].cells.forEach(function (w) { inRun[w] = true; });
    }
    if (autoCand) {
      var res = window.KakuroSolver.candidatesFor(puzzle, values);
      autoCandMap = res.ok ? res.cand : null;
    } else {
      autoCandMap = null;
    }

    var emptyCount = 0;
    for (var w = 0; w < puzzle.whites.length; w++) {
      var info = puzzle.whites[w];
      var cell = cellEls[info.r][info.c];
      var v = values[w];
      if (!v) emptyCount++;

      cell.className = "cell white" +
        (w === selected ? " selected" : "") +
        (inRun[w] && w !== selected ? " in-run" : "") +
        (err.cellErr[w] ? " error" : "");
      cell.querySelector(".value").textContent = v ? String(v) : "";

      var noteEl = cell.querySelector(".notes");
      if (v) {
        noteEl.textContent = "";
      } else if (notes[w].length) {
        noteEl.className = "notes";
        noteEl.textContent = notes[w].join(" ");
      } else if (autoCandMap) {
        noteEl.className = "notes auto";
        noteEl.textContent =
          window.KakuroCombos.maskToDigits(autoCandMap[w]).join(" ");
      } else {
        noteEl.textContent = "";
      }
    }

    for (var ri = 0; ri < puzzle.runs.length; ri++) {
      var run = puzzle.runs[ri];
      var clueCell = cellEls[run.clueR][run.clueC];
      var span = clueCell.querySelector(run.dir === "a" ? ".clue-a" : ".clue-d");
      if (span) span.classList.toggle("error", !!err.runErr[ri]);
    }

    els.empty.textContent = String(emptyCount);
    els.hintCount.textContent = String(hintsUsed);
    renderRunInfo();
  }

  /* 선택 칸의 가로/세로 런 조합 도우미 — GDD §5.2 */
  function renderRunInfo() {
    var box = els.runInfo;
    box.innerHTML = "";
    if (selected < 0) {
      box.innerHTML = "<p class=\"placeholder\">칸을 선택하면 들어갈 수 있는 조합이 표시됩니다.</p>";
      return;
    }
    var info = puzzle.whites[selected];
    [puzzle.runs[info.a], puzzle.runs[info.d]].forEach(function (run) {
      var placedMask = 0;
      run.cells.forEach(function (w) {
        if (values[w]) placedMask |= 1 << (values[w] - 1);
      });

      var head = document.createElement("p");
      head.className = "run-head";
      head.textContent = (run.dir === "a" ? "가로 " : "세로 ") +
        run.sum + " · " + run.cells.length + "칸";
      box.appendChild(head);

      var list = document.createElement("div");
      list.className = "combo-list";
      var combos = window.KakuroCombos.combos(run.cells.length, run.sum);
      combos.forEach(function (mask) {
        var chip = document.createElement("span");
        chip.className = "combo" +
          ((mask & placedMask) === placedMask ? "" : " dead");
        chip.textContent = window.KakuroCombos.maskToDigits(mask).join("");
        list.appendChild(chip);
      });
      box.appendChild(list);
    });
  }

  /* ── 입력 ── */

  function pushHistory(w) {
    history.push({ w: w, value: values[w], notes: notes[w].slice() });
    if (history.length > 500) history.shift();
  }

  function undo() {
    if (finished || !history.length) return;
    var last = history.pop();
    values[last.w] = last.value;
    notes[last.w] = last.notes;
    refresh();
    save();
  }

  function inputDigit(d) {
    if (finished || generating || selected < 0) return;
    pushHistory(selected);
    if (noteMode && !values[selected]) {
      var idx = notes[selected].indexOf(d);
      if (idx >= 0) notes[selected].splice(idx, 1);
      else {
        notes[selected].push(d);
        notes[selected].sort();
      }
    } else {
      values[selected] = d;
      notes[selected] = [];
    }
    refresh();
    save();
    checkWin();
  }

  function eraseCell() {
    if (finished || generating || selected < 0) return;
    if (!values[selected] && !notes[selected].length) return;
    pushHistory(selected);
    values[selected] = 0;
    notes[selected] = [];
    refresh();
    save();
  }

  function moveSelection(dr, dc) {
    if (!puzzle) return;
    var start = selected >= 0 ? puzzle.whites[selected] : { r: 1, c: 0 };
    var r = start.r;
    var c = start.c;
    for (var step = 0; step < puzzle.t; step++) {
      r += dr;
      c += dc;
      if (r < 1 || r > puzzle.n || c < 1 || c > puzzle.n) return;
      if (puzzle.whiteAt[r][c] >= 0) {
        selected = puzzle.whiteAt[r][c];
        refresh();
        return;
      }
    }
  }

  /* ── 힌트 (GDD §5.2) ── */

  function giveHint() {
    if (finished || generating || !puzzle) return;
    var res = window.KakuroSolver.candidatesFor(puzzle, values);
    if (!res.ok) {
      setStatus("현재 입력에 모순이 있습니다. 빨간 표시를 먼저 확인해 주세요.");
      return;
    }
    var target = -1;
    if (selected >= 0 && !values[selected] &&
        window.KakuroCombos.popcount(res.cand[selected]) === 1) {
      target = selected;
    }
    if (target < 0) {
      for (var w = 0; w < values.length; w++) {
        if (!values[w] && window.KakuroCombos.popcount(res.cand[w]) === 1) {
          target = w;
          break;
        }
      }
    }
    var reason;
    var digit;
    if (target >= 0) {
      digit = window.KakuroCombos.maskToDigits(res.cand[target])[0];
      var info = puzzle.whites[target];
      var ra = puzzle.runs[info.a];
      var rd = puzzle.runs[info.d];
      reason = "가로 " + ra.sum + "(" + ra.cells.length + "칸) × 세로 " +
        rd.sum + "(" + rd.cells.length + "칸) 조합상 " + digit + "만 가능합니다.";
    } else {
      // 단순 전파로 확정 칸이 없으면 후보가 가장 적은 칸을 공개
      var best = -1;
      var bestCount = 10;
      for (var w2 = 0; w2 < values.length; w2++) {
        if (values[w2]) continue;
        var pc = window.KakuroCombos.popcount(res.cand[w2]);
        if (pc < bestCount) { bestCount = pc; best = w2; }
      }
      if (best < 0) return;
      target = best;
      var t2 = puzzle.whites[target];
      digit = puzzle.solution[t2.r][t2.c];
      reason = "후보가 가장 적은 칸을 공개했습니다.";
    }

    pushHistory(target);
    values[target] = digit;
    notes[target] = [];
    hintsUsed++;
    selected = target;
    var pos = puzzle.whites[target];
    setStatus("힌트: " + pos.r + "행 " + pos.c + "열 = " + digit + " — " + reason);
    refresh();
    save();
    checkWin();
  }

  /* ── 클리어 ── */

  function checkWin() {
    if (finished || !isComplete()) return;
    finished = true;
    stopTimer();
    save();
    els.winTime.textContent = formatTime(elapsed);
    els.winHints.textContent = String(hintsUsed);
    els.winSize.textContent =
      (PRESET_LABEL[puzzle.n] || "커스텀") + " " + puzzle.n + "×" + puzzle.n;
    els.winOverlay.hidden = false;
    setStatus("클리어! 축하합니다.");
  }

  /* ── 이벤트 바인딩 ── */

  function bindEvents() {
    els.board.addEventListener("click", function (e) {
      var cell = e.target.closest(".cell.white");
      if (!cell || generating) return;
      selected = parseInt(cell.dataset.w, 10);
      refresh();
    });

    els.pad.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.number) inputDigit(parseInt(btn.dataset.number, 10));
      else if (btn.dataset.action === "erase") eraseCell();
    });

    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key >= "1" && e.key <= "9") inputDigit(parseInt(e.key, 10));
      else if (e.key === "Delete" || e.key === "Backspace" || e.key === "0") eraseCell();
      else if (e.key === "ArrowUp") { e.preventDefault(); moveSelection(-1, 0); }
      else if (e.key === "ArrowDown") { e.preventDefault(); moveSelection(1, 0); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); moveSelection(0, -1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); moveSelection(0, 1); }
      else if (e.key.toLowerCase() === "n") toggleNoteMode();
    });

    els.newBtn.addEventListener("click", newGame);
    els.winNewBtn.addEventListener("click", function () {
      els.winOverlay.hidden = true;
      newGame();
    });
    els.undoBtn.addEventListener("click", undo);
    els.hintBtn.addEventListener("click", giveHint);
    els.noteBtn.addEventListener("click", toggleNoteMode);

    els.autoCandChk.addEventListener("change", function () {
      autoCand = els.autoCandChk.checked;
      refresh();
    });

    els.themeToggle.addEventListener("click", function () {
      var dark = document.documentElement.dataset.theme === "dark";
      applyTheme(dark ? "light" : "dark");
    });

    window.addEventListener("resize", adjustFonts);
  }

  function toggleNoteMode() {
    noteMode = !noteMode;
    els.noteBtn.setAttribute("aria-pressed", String(noteMode));
    els.noteBtn.classList.toggle("active", noteMode);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    els.themeToggle.textContent = theme === "dark" ? "라이트모드" : "다크모드";
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) { /* 무시 */ }
  }

  /* ── 진입점 ── */

  function init() {
    els = {
      board: $("kakuroBoard"),
      pad: $("numberPad"),
      status: $("statusMessage"),
      badge: $("difficultyBadge"),
      timer: $("timerValue"),
      empty: $("emptyCount"),
      hintCount: $("hintCount"),
      difficulty: $("difficultySelect"),
      newBtn: $("newPuzzleBtn"),
      undoBtn: $("undoBtn"),
      hintBtn: $("hintBtn"),
      noteBtn: $("noteModeBtn"),
      autoCandChk: $("autoCandChk"),
      runInfo: $("runInfo"),
      genOverlay: $("genOverlay"),
      genOverlayText: $("genOverlayText"),
      winOverlay: $("winOverlay"),
      winTime: $("winTime"),
      winHints: $("winHints"),
      winSize: $("winSize"),
      winNewBtn: $("winNewBtn"),
      themeToggle: $("themeToggle")
    };

    var savedTheme = null;
    try {
      savedTheme = localStorage.getItem(THEME_KEY);
    } catch (e) { /* 무시 */ }
    applyTheme(savedTheme === "dark" ? "dark" : "light");

    bindEvents();
    if (!tryLoad()) newGame();
  }

  window.KakuroUI = { init: init };
})();
