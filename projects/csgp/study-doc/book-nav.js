/* book-nav.js — CSGP 웹 원고 공통 스크립트
   테마 토글 · 오버레이 드로어 · 진행률 · 목차 검색 · 스크롤스파이
   (index.html 및 모든 챕터 페이지가 공유) */
(function () {
  var root = document.documentElement;

  /* ---- 테마 토글 ---- */
  var tbtn = document.getElementById('themeToggle');
  function pref() { try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; } }
  function curTheme() { return root.getAttribute('data-theme') || pref(); }
  function syncTheme() { if (tbtn) tbtn.textContent = curTheme() === 'dark' ? '☀️' : '🌙'; }
  syncTheme();
  if (tbtn) tbtn.addEventListener('click', function () {
    var n = curTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n);
    try { localStorage.setItem('csgp-theme', n); } catch (e) {}
    syncTheme();
  });

  /* ---- 오버레이 드로어 열기/닫기 ---- */
  var drawer = document.getElementById('drawer'),
      backdrop = document.getElementById('backdrop'),
      toggle = document.getElementById('drawerToggle');
  function setOpen(v) {
    if (!drawer) return;
    drawer.classList.toggle('open', v);
    if (backdrop) backdrop.classList.toggle('show', v);
    if (toggle) toggle.setAttribute('aria-expanded', v ? 'true' : 'false');
  }
  if (toggle) toggle.addEventListener('click', function () { setOpen(!drawer.classList.contains('open')); });
  if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

  /* ---- 진행률 (현재 챕터 / 전체) ---- */
  var links = drawer ? drawer.querySelectorAll('.booknav-list > li > a') : [];
  var bar = document.getElementById('dashBar'), pct = document.getElementById('dashPct');
  if (links.length && bar && pct) {
    var total = links.length, idx = -1;
    for (var i = 0; i < links.length; i++) {
      if (links[i].parentNode.classList.contains('active')) { idx = i; break; }
    }
    if (idx >= 0) { bar.style.width = Math.round((idx + 1) / total * 100) + '%'; pct.textContent = (idx + 1) + ' / ' + total; }
    else { bar.style.width = '0%'; pct.textContent = total + '개 챕터'; }
  } else if (pct) { pct.textContent = ''; }

  /* ---- 목차 검색 필터 ---- */
  var search = document.getElementById('drawerSearch');
  if (search && drawer) {
    var lis = drawer.querySelectorAll('.booknav-list > li');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var grp = null, shown = 0;
      [].forEach.call(lis, function (li) {
        if (li.classList.contains('grp')) {
          if (grp) grp.style.display = shown ? '' : 'none';
          grp = li; shown = 0; return;
        }
        var a = li.querySelector('a'); var t = a ? a.textContent.toLowerCase() : '';
        var vis = !q || t.indexOf(q) >= 0;
        li.style.display = vis ? '' : 'none';
        if (vis) shown++;
      });
      if (grp) grp.style.display = shown ? '' : 'none';
    });
  }

  /* ---- 스크롤스파이: 현재 보이는 섹션을 드로어 목차에서 강조 ---- */
  var sub = drawer ? drawer.querySelectorAll('.booknav .sections a') : [];
  if (sub.length && ('IntersectionObserver' in window)) {
    var map = {}, heads = [];
    [].forEach.call(sub, function (a) {
      var h = a.getAttribute('href');
      if (h && h.charAt(0) === '#') { var el = document.getElementById(h.slice(1)); if (el) { map[h.slice(1)] = a; heads.push(el); } }
    });
    var cur = null;
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) {
          if (cur) cur.classList.remove('current');
          cur = map[e.target.id]; if (cur) cur.classList.add('current');
        }
      });
    }, { rootMargin: '0px 0px -72% 0px', threshold: 0 });
    heads.forEach(function (h) { obs.observe(h); });
  }
})();
