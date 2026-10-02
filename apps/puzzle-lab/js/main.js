(function () {
  "use strict";

  var THEME_KEY = "puzzlelab-theme";
  var themeToggle = document.getElementById("themeToggle");
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".lab-tab"));
  var frames = {
    sudoku: document.getElementById("frameSudoku"),
    kakuro: document.getElementById("frameKakuro")
  };

  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  // 로드된 게임 프레임에 현재 테마를 전파한다
  function broadcastTheme() {
    var theme = currentTheme();
    Object.keys(frames).forEach(function (key) {
      var frame = frames[key];
      if (frame.src && frame.contentWindow) {
        frame.contentWindow.postMessage(
          { type: "puzzlelab:theme", theme: theme },
          window.location.origin
        );
      }
    });
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "라이트모드" : "다크모드";
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) { /* 사생활 보호 모드 등에서 무시 */ }
    broadcastTheme();
  }

  function activate(game) {
    tabs.forEach(function (tab) {
      var active = tab.dataset.game === game;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    Object.keys(frames).forEach(function (key) {
      var frame = frames[key];
      if (key === game && !frame.src) frame.src = frame.dataset.src; // 첫 진입 시에만 로드
      frame.classList.toggle("is-active", key === game);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activate(tab.dataset.game);
    });
  });

  themeToggle.addEventListener("click", function () {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  Object.keys(frames).forEach(function (key) {
    frames[key].addEventListener("load", broadcastTheme);
  });

  var saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch (e) { /* 무시 */ }
  applyTheme(saved === "dark" ? "dark" : "light");

  if (window.location.hash === "#kakuro") activate("kakuro");
})();
