/* 족보(조합표) 모듈 — GDD §4.3
 * 합·칸수별 가능한 숫자 조합을 비트마스크로 생성·캐싱한다.
 * mask: bit(d-1) = 숫자 d 포함 여부 (1~9 → 9비트) */
(function () {
  "use strict";

  var byLenSum = null; // byLenSum[len][sum] = [mask, ...]

  function build() {
    byLenSum = [];
    for (var l = 0; l <= 9; l++) byLenSum.push({});
    for (var mask = 1; mask < 512; mask++) {
      var len = 0;
      var sum = 0;
      for (var d = 1; d <= 9; d++) {
        if (mask & (1 << (d - 1))) {
          len++;
          sum += d;
        }
      }
      var bucket = byLenSum[len];
      if (!bucket[sum]) bucket[sum] = [];
      bucket[sum].push(mask);
    }
  }

  function combos(len, sum) {
    if (!byLenSum) build();
    var bucket = byLenSum[len];
    return (bucket && bucket[sum]) || [];
  }

  function maskToDigits(mask) {
    var out = [];
    for (var d = 1; d <= 9; d++) {
      if (mask & (1 << (d - 1))) out.push(d);
    }
    return out;
  }

  function digitBit(d) {
    return 1 << (d - 1);
  }

  function popcount(mask) {
    var c = 0;
    while (mask) {
      mask &= mask - 1;
      c++;
    }
    return c;
  }

  window.KakuroCombos = {
    combos: combos,
    maskToDigits: maskToDigits,
    digitBit: digitBit,
    popcount: popcount
  };
})();
