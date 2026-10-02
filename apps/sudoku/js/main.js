(function () {
  "use strict";

  // PuzzleLab 허브에 임베드된 경우: 자체 헤더를 숨기고 허브의 테마를 따른다
  if (new URLSearchParams(window.location.search).has("embed")) {
    document.documentElement.classList.add("embedded");
    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      var data = event.data || {};
      if (data.type === "puzzlelab:theme") {
        document.documentElement.dataset.theme = data.theme === "dark" ? "dark" : "light";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.SudokuUI.init();
  });
})();
