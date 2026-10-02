/* 단계형 솔버 — GDD §5.3
 * 사람의 풀이를 모사한 전파(유일 조합 → 교차 교집합 → 후보 소거)와
 * 백트래킹 탐색으로 유일해 검증·난이도 측정·힌트 근거 산출에 재사용된다. */
(function () {
  "use strict";

  var C = null; // KakuroCombos (defer 로딩 순서 보장 후 참조)

  function lib() {
    if (!C) C = window.KakuroCombos;
    return C;
  }

  /* 한 런에 대해 남은 조합의 합집합으로 각 빈 칸의 후보를 깎는다.
   * 반환: 계속 진행 가능하면 rounds(>=1), 모순이면 -1 */
  function propagate(puzzle, cand, value) {
    lib();
    var runs = puzzle.runs;
    var changed = true;
    var rounds = 0;

    while (changed) {
      changed = false;
      rounds++;

      for (var ri = 0; ri < runs.length; ri++) {
        var run = runs[ri];
        var placedMask = 0;
        var placedSum = 0;
        var unfilled = [];

        for (var i = 0; i < run.cells.length; i++) {
          var w = run.cells[i];
          var v = value[w];
          if (v) {
            var bit = 1 << (v - 1);
            if (placedMask & bit) return -1; // 런 내 중복
            placedMask |= bit;
            placedSum += v;
          } else {
            unfilled.push(w);
          }
        }

        if (!unfilled.length) {
          if (placedSum !== run.sum) return -1; // 완성됐는데 합 불일치
          continue;
        }

        var list = C.combos(run.cells.length, run.sum);
        var allowed = 0;
        for (var ci = 0; ci < list.length; ci++) {
          var m = list[ci];
          if ((m & placedMask) !== placedMask) continue; // 이미 놓인 숫자 미포함
          var rem = m ^ placedMask;
          var usable = true;
          for (var u = 0; u < unfilled.length; u++) {
            if (!(cand[unfilled[u]] & rem)) {
              usable = false;
              break;
            }
          }
          if (usable) allowed |= rem;
        }
        if (!allowed) return -1;

        for (var u2 = 0; u2 < unfilled.length; u2++) {
          var w2 = unfilled[u2];
          var next = cand[w2] & allowed;
          if (!next) return -1;
          if (next !== cand[w2]) {
            cand[w2] = next;
            changed = true;
          }
          if (!(next & (next - 1))) {
            // 후보가 하나뿐 → 값 확정 (naked single)
            value[w2] = C.maskToDigits(next)[0];
            changed = true;
          }
        }
      }
    }
    return rounds;
  }

  function freshState(puzzle) {
    var W = puzzle.whites.length;
    var cand = new Uint16Array(W);
    cand.fill(511);
    return { cand: cand, value: new Uint8Array(W) };
  }

  function search(puzzle, cand, value, limit, budget, out) {
    if (budget.nodes-- < 0) return limit; // 탐색 폭주 → 비유일 취급하고 버림
    if (propagate(puzzle, cand, value) < 0) return 0;

    var best = -1;
    var bestCount = 10;
    for (var w = 0; w < value.length; w++) {
      if (value[w]) continue;
      var pc = lib().popcount(cand[w]);
      if (pc < bestCount) {
        bestCount = pc;
        best = w;
        if (pc === 2) break;
      }
    }
    if (best < 0) {
      if (out) out.push(value.slice()); // 완성 해 수집 (모호 영역 진단용)
      return 1;
    }

    var total = 0;
    var digits = lib().maskToDigits(cand[best]);
    for (var i = 0; i < digits.length; i++) {
      var c2 = cand.slice();
      var v2 = value.slice();
      v2[best] = digits[i];
      c2[best] = 1 << (digits[i] - 1);
      var got = search(puzzle, c2, v2, limit - total, budget, out);
      total += got;
      if (total >= limit) return total;
    }
    return total;
  }

  function nodeBudget(puzzle) {
    return 3000 + puzzle.whites.length * 120; // 큰 보드일수록 탐색 여유를 준다
  }

  /* 해의 개수를 limit까지 센다 (유일해 검증: limit=2) */
  function countSolutions(puzzle, limit) {
    var s = freshState(puzzle);
    return search(puzzle, s.cand, s.value, limit, { nodes: nodeBudget(puzzle) }, null);
  }

  /* 해를 수집하며 센다 — 생성기의 국소 수리(모호 영역 재채움)에 쓰인다 */
  function countSolutionsDetailed(puzzle, limit) {
    var s = freshState(puzzle);
    var out = [];
    var count = search(puzzle, s.cand, s.value, limit, { nodes: nodeBudget(puzzle) }, out);
    return { count: count, solutions: out };
  }

  /* 전파만으로 풀리는지 검사 → 난이도 판정 (GDD §5.3 5단계) */
  function solveLogical(puzzle) {
    var s = freshState(puzzle);
    var rounds = propagate(puzzle, s.cand, s.value);
    if (rounds < 0) return { solved: false, rounds: 0 };
    for (var w = 0; w < s.value.length; w++) {
      if (!s.value[w]) return { solved: false, rounds: rounds };
    }
    return { solved: true, rounds: rounds };
  }

  /* 현재 입력 상태에서의 후보 계산 — 자동 후보 표시·힌트 근거용.
   * userValues: whites 순서의 값 배열(0 = 빈 칸) */
  function candidatesFor(puzzle, userValues) {
    var s = freshState(puzzle);
    for (var w = 0; w < userValues.length; w++) {
      var v = userValues[w];
      if (v) {
        s.value[w] = v;
        s.cand[w] = 1 << (v - 1);
      }
    }
    var rounds = propagate(puzzle, s.cand, s.value);
    return { ok: rounds >= 0, cand: s.cand, value: s.value };
  }

  window.KakuroSolver = {
    countSolutions: countSolutions,
    countSolutionsDetailed: countSolutionsDetailed,
    solveLogical: solveLogical,
    candidatesFor: candidatesFor
  };
})();
