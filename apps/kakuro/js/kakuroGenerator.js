/* 퍼즐 생성기 — GDD §5.3
 * ① 검은 칸 패턴 생성(180° 대칭, 길이 1 런·9칸 초과 런 금지)
 * ② 흰 칸에 규칙을 만족하는 정답 채우기(백트래킹)
 * ③ 정답에서 합 힌트 추출
 * ④ 솔버로 유일해 검증 — 실패 시 재시도
 * ⑤ 전파만으로 풀리는(사람이 찍기 없이 풀 수 있는) 퍼즐 우선 채택 */
(function () {
  "use strict";

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /* ── 패턴 ── */

  function blankGrid(t, fillValue) {
    var g = [];
    for (var r = 0; r < t; r++) {
      g.push(new Array(t).fill(fillValue));
    }
    return g;
  }

  function seedPattern(n) {
    var t = n + 1;
    var block = blankGrid(t, false);
    for (var i = 0; i < t; i++) {
      block[0][i] = true;
      block[i][0] = true;
    }
    var p = n <= 8 ? 0.3 : n <= 12 ? 0.32 : 0.34;
    for (var r = 1; r <= n; r++) {
      for (var c = 1; c <= n; c++) {
        var tr = n + 1 - r;
        var tc = n + 1 - c;
        if (r * 100 + c > tr * 100 + tc) continue; // 쌍의 대표만 결정
        var b = Math.random() < p;
        block[r][c] = b;
        block[tr][tc] = b; // 180° 회전 대칭
      }
    }
    return block;
  }

  function runLenAcross(block, r, c) {
    var s = c;
    while (!block[r][s - 1]) s--;
    var e = c;
    while (e + 1 < block.length && !block[r][e + 1]) e++;
    return e - s + 1;
  }

  function runLenDown(block, r, c) {
    var s = r;
    while (!block[s - 1][c]) s--;
    var e = r;
    while (e + 1 < block.length && !block[e + 1][c]) e++;
    return e - s + 1;
  }

  function setBlockPair(block, n, r, c) {
    block[r][c] = true;
    block[n + 1 - r][n + 1 - c] = true;
  }

  /* 길이 1 런은 검은 칸으로 흡수, 9칸 초과 런은 중간에 검은 칸 삽입.
   * 검은 칸은 늘어나기만 하므로 반드시 수렴한다. */
  function repairPattern(block, n) {
    var t = n + 1;
    for (var guard = 0; guard < t * t; guard++) {
      var touched = false;
      for (var r = 1; r <= n && !touched; r++) {
        for (var c = 1; c <= n && !touched; c++) {
          if (block[r][c]) continue;
          if (runLenAcross(block, r, c) < 2 || runLenDown(block, r, c) < 2) {
            setBlockPair(block, n, r, c);
            touched = true;
          }
        }
      }
      if (touched) continue;
      // 규칙상 상한은 9칸이지만, 긴 런은 조합이 폭발해 유일해가 잘 안 나오므로
      // 생성기는 7칸으로 제한한다
      for (var r2 = 1; r2 <= n && !touched; r2++) {
        for (var c2 = 1; c2 <= n && !touched; c2++) {
          if (block[r2][c2]) continue;
          if (runLenAcross(block, r2, c2) > 7) {
            setBlockPair(block, n, r2, c2 + Math.floor(runLenAcross(block, r2, c2) / 2) - 1);
            touched = true;
          } else if (runLenDown(block, r2, c2) > 7) {
            setBlockPair(block, n, r2 + Math.floor(runLenDown(block, r2, c2) / 2) - 1, c2);
            touched = true;
          }
        }
      }
      if (!touched) return;
    }
  }

  function validatePattern(block, n) {
    var whites = [];
    for (var r = 1; r <= n; r++) {
      for (var c = 1; c <= n; c++) {
        if (block[r][c]) continue;
        var a = runLenAcross(block, r, c);
        var d = runLenDown(block, r, c);
        if (a < 2 || a > 7 || d < 2 || d > 7) return false;
        whites.push([r, c]);
      }
    }
    if (whites.length < Math.max(6, Math.floor(n * n * 0.34))) return false;

    // 흰 칸 연결성 (표준 가쿠로는 한 덩어리)
    var seen = {};
    var queue = [whites[0]];
    seen[whites[0][0] + "," + whites[0][1]] = true;
    var count = 0;
    while (queue.length) {
      var cur = queue.pop();
      count++;
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < dirs.length; i++) {
        var nr = cur[0] + dirs[i][0];
        var nc = cur[1] + dirs[i][1];
        if (nr < 1 || nr > n || nc < 1 || nc > n) continue;
        if (block[nr][nc] || seen[nr + "," + nc]) continue;
        seen[nr + "," + nc] = true;
        queue.push([nr, nc]);
      }
    }
    return count === whites.length;
  }

  function genPattern(n) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var block = seedPattern(n);
      repairPattern(block, n);
      if (validatePattern(block, n)) return block;
    }
    return null;
  }

  /* ── 정답 채우기 ── */

  /* 극단 숫자(1·2·8·9) 편향 셔플 — 런 합이 극값에 가까울수록 가능한 조합이
   * 급감해(족보의 매직 넘버) 유일해·논리 풀이 확률이 크게 올라간다 */
  function biasedDigits(mask) {
    var digits = window.KakuroCombos.maskToDigits(mask);
    var scored = digits.map(function (d) {
      return [Math.abs(5 - d) + Math.random() * 5, d];
    });
    scored.sort(function (x, y) { return y[0] - x[0]; });
    return scored.map(function (s) { return s[1]; });
  }

  /* 런 내 중복 금지만 지키며 흰 칸 전체를 백트래킹으로 채운다 */
  function fillPattern(block, n) {
    var t = n + 1;
    var solution = blankGrid(t, 0);
    var aRunOf = blankGrid(t, -1);
    var dRunOf = blankGrid(t, -1);
    var runCount = 0;
    var r;
    var c;

    for (r = 1; r <= n; r++) {
      for (c = 1; c <= n; c++) {
        if (block[r][c]) continue;
        aRunOf[r][c] = block[r][c - 1] ? runCount++ : aRunOf[r][c - 1];
        dRunOf[r][c] = -1;
      }
    }
    for (c = 1; c <= n; c++) {
      for (r = 1; r <= n; r++) {
        if (block[r][c]) continue;
        dRunOf[r][c] = block[r - 1][c] ? runCount++ : dRunOf[r - 1][c];
      }
    }

    var whites = [];
    for (r = 1; r <= n; r++) {
      for (c = 1; c <= n; c++) {
        if (!block[r][c]) whites.push([r, c, aRunOf[r][c], dRunOf[r][c]]);
      }
    }

    var used = new Uint16Array(runCount);
    var budget = 80000;

    function backtrack(idx) {
      if (budget-- < 0) return false;
      if (idx === whites.length) return true;
      var cell = whites[idx];
      var free = ~(used[cell[2]] | used[cell[3]]) & 511;
      if (!free) return false;
      var digits = biasedDigits(free);
      for (var i = 0; i < digits.length; i++) {
        var bit = 1 << (digits[i] - 1);
        used[cell[2]] |= bit;
        used[cell[3]] |= bit;
        solution[cell[0]][cell[1]] = digits[i];
        if (backtrack(idx + 1)) return true;
        used[cell[2]] ^= bit;
        used[cell[3]] ^= bit;
        solution[cell[0]][cell[1]] = 0;
      }
      return false;
    }

    return backtrack(0) ? solution : null;
  }

  /* ── 퍼즐 조립 ── */

  /* 패턴 + 정답에서 런·힌트·색인을 만든다. 저장 데이터 복원에도 쓰인다. */
  function buildPuzzle(block, n, solution) {
    var t = n + 1;
    var whiteAt = blankGrid(t, -1);
    var whites = [];
    var runs = [];
    var clueA = blankGrid(t, 0);
    var clueD = blankGrid(t, 0);
    var r;
    var c;

    for (r = 1; r <= n; r++) {
      for (c = 1; c <= n; c++) {
        if (block[r][c]) continue;
        whiteAt[r][c] = whites.length;
        whites.push({ r: r, c: c, a: -1, d: -1 });
      }
    }

    for (r = 1; r <= n; r++) {
      for (c = 1; c <= n; c++) {
        if (block[r][c] || !block[r][c - 1]) continue;
        var cellsA = [];
        var sumA = 0;
        for (var ca = c; ca <= n && !block[r][ca]; ca++) {
          cellsA.push(whiteAt[r][ca]);
          whites[whiteAt[r][ca]].a = runs.length;
          sumA += solution[r][ca];
        }
        clueA[r][c - 1] = sumA;
        runs.push({ dir: "a", sum: sumA, cells: cellsA, clueR: r, clueC: c - 1 });
      }
    }
    for (c = 1; c <= n; c++) {
      for (r = 1; r <= n; r++) {
        if (block[r][c] || !block[r - 1][c]) continue;
        var cellsD = [];
        var sumD = 0;
        for (var rd = r; rd <= n && !block[rd][c]; rd++) {
          cellsD.push(whiteAt[rd][c]);
          whites[whiteAt[rd][c]].d = runs.length;
          sumD += solution[rd][c];
        }
        clueD[r - 1][c] = sumD;
        runs.push({ dir: "d", sum: sumD, cells: cellsD, clueR: r - 1, clueC: c });
      }
    }

    return {
      n: n,
      t: t,
      block: block,
      clueA: clueA,
      clueD: clueD,
      whites: whites,
      whiteAt: whiteAt,
      runs: runs,
      solution: solution
    };
  }

  /* ── 유일해를 깨는 구조 사전 필터 ──
   * a-b / b-a 사각형(스도쿠의 deadly pattern에 해당): 두 행·두 열의 네 흰 칸이
   * 각 행에서 같은 가로 런, 각 열에서 같은 세로 런에 속하면서 값이 a,b / b,a 꼴이면
   * a↔b 교환이 모든 합·중복 규칙을 유지하므로 해가 2개 이상이 된다.
   * countSolutions보다 훨씬 싸므로 먼저 걸러 해당 네 칸을 돌려준다. */
  function findDeadlyRectangle(puzzle) {
    var n = puzzle.n;
    var s = puzzle.solution;
    for (var r1 = 1; r1 < n; r1++) {
      for (var r2 = r1 + 1; r2 <= n; r2++) {
        var cols = [];
        for (var c = 1; c <= n; c++) {
          var w1 = puzzle.whiteAt[r1][c];
          var w2 = puzzle.whiteAt[r2][c];
          if (w1 >= 0 && w2 >= 0 &&
              puzzle.whites[w1].d === puzzle.whites[w2].d) {
            cols.push(c);
          }
        }
        for (var i = 0; i < cols.length; i++) {
          for (var j = i + 1; j < cols.length; j++) {
            var c1 = cols[i];
            var c2 = cols[j];
            if (puzzle.whites[puzzle.whiteAt[r1][c1]].a !==
                puzzle.whites[puzzle.whiteAt[r1][c2]].a) continue;
            if (puzzle.whites[puzzle.whiteAt[r2][c1]].a !==
                puzzle.whites[puzzle.whiteAt[r2][c2]].a) continue;
            if (s[r1][c1] === s[r2][c2] && s[r1][c2] === s[r2][c1]) {
              return [
                puzzle.whiteAt[r1][c1], puzzle.whiteAt[r1][c2],
                puzzle.whiteAt[r2][c1], puzzle.whiteAt[r2][c2]
              ];
            }
          }
        }
      }
    }
    return null;
  }

  /* 모호 영역(region: white 인덱스 목록)만 지우고 다시 채운다.
   * 그 지점의 런 합(힌트)이 바뀌므로 반복하면 유일해로 수렴한다. */
  function refillRegion(puzzle, region) {
    var solution = puzzle.solution.map(function (row) { return row.slice(); });
    var usedMask = new Uint16Array(puzzle.runs.length);
    var inRegion = {};
    region.forEach(function (w) { inRegion[w] = true; });

    for (var w = 0; w < puzzle.whites.length; w++) {
      var info = puzzle.whites[w];
      if (inRegion[w]) {
        solution[info.r][info.c] = 0;
        continue;
      }
      var bit = 1 << (solution[info.r][info.c] - 1);
      usedMask[info.a] |= bit;
      usedMask[info.d] |= bit;
    }

    var order = region.slice().sort(function (a, b) {
      var wa = puzzle.whites[a];
      var wb = puzzle.whites[b];
      return wa.r - wb.r || wa.c - wb.c;
    });
    var budget = 20000;

    function bt(idx) {
      if (budget-- < 0) return false;
      if (idx === order.length) return true;
      var cell = puzzle.whites[order[idx]];
      var free = ~(usedMask[cell.a] | usedMask[cell.d]) & 511;
      if (!free) return false;
      var digits = biasedDigits(free);
      for (var i = 0; i < digits.length; i++) {
        var bit2 = 1 << (digits[i] - 1);
        usedMask[cell.a] |= bit2;
        usedMask[cell.d] |= bit2;
        solution[cell.r][cell.c] = digits[i];
        if (bt(idx + 1)) return true;
        usedMask[cell.a] ^= bit2;
        usedMask[cell.d] ^= bit2;
        solution[cell.r][cell.c] = 0;
      }
      return false;
    }

    return bt(0) ? solution : null;
  }

  /* ── 생성 루프 ── */

  /* 패턴 하나를 "전파만으로 완전히 풀리는 판"이 될 때까지 국소 수리한다.
   * 전파가 모든 칸을 확정하면 그 자체로 유일해가 증명되므로(결정적 절차),
   * 비싼 해 개수 탐색 없이 유일성과 사람이 풀 수 있는 난이도를 동시에 얻는다.
   * 전파가 멈춘 미확정 칸들만 다시 채워 그 지점 힌트 합을 바꿔가며 수렴시킨다. */
  function attemptOnce(n) {
    var block = genPattern(n);
    if (!block) return { found: null, any: null };
    var solution = fillPattern(block, n);
    if (!solution) return { found: null, any: null };
    var any = null;
    var iters = 30 + n * 6;

    for (var iter = 0; iter < iters && solution; iter++) {
      var puzzle = buildPuzzle(block, n, solution);
      if (!any) any = { puzzle: puzzle, unique: false, logical: false, rounds: 0 };

      var region = findDeadlyRectangle(puzzle);
      if (!region) {
        var res = window.KakuroSolver.candidatesFor(
          puzzle, new Uint8Array(puzzle.whites.length));
        if (res.ok) {
          region = [];
          for (var w = 0; w < res.value.length; w++) {
            if (!res.value[w]) region.push(w);
          }
          if (!region.length) {
            var lg = window.KakuroSolver.solveLogical(puzzle);
            return {
              found: { puzzle: puzzle, unique: true, logical: true, rounds: lg.rounds },
              any: any
            };
          }
        }
      }
      solution = region && region.length
        ? refillRegion(puzzle, region) || fillPattern(block, n)
        : fillPattern(block, n);
    }
    return { found: null, any: any };
  }

  /* UI 블로킹 방지를 위해 시간 조각으로 나눠 시도한다.
   * onDone(result): result = { puzzle, unique, logical, rounds, attempts } */
  function generateAsync(n, onDone, onProgress) {
    var attempts = 0;
    var maxAttempts = n >= 12 ? 80 : 60;
    var lastAny = null;

    function chunk() {
      var started = performance.now();
      while (performance.now() - started < 45 && attempts < maxAttempts) {
        attempts++;
        var res = attemptOnce(n);
        if (res.any) lastAny = res.any;
        if (res.found) {
          res.found.attempts = attempts;
          onDone(res.found);
          return;
        }
      }
      if (attempts >= maxAttempts) {
        if (lastAny) lastAny.attempts = attempts;
        onDone(lastAny);
        return;
      }
      if (onProgress) onProgress(attempts);
      setTimeout(chunk, 0);
    }
    setTimeout(chunk, 0);
  }

  window.KakuroGenerator = {
    generateAsync: generateAsync,
    buildPuzzle: buildPuzzle
  };
})();
