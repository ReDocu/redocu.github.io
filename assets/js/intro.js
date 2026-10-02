// 인트로 부팅 (PRD 5장): B0 로고 → B1 부팅 로그 → B2 로딩 → B3 프로필 대기 → B4 입장
// 입장 시 'intro:done' 이벤트 (detail.flip = 카드가 Hero HUD 자리로 날아가는 중) — home.js가 Hero 연출을 시작한다.
(() => {
  const intro = document.getElementById('intro');
  if (!intro) return;

  const $ = (s) => intro.querySelector(s);
  const log = $('.intro__log');
  const load = $('.intro__load');
  const item = $('.intro__item');
  const pct = $('.intro__pct');
  const fill = $('.intro__fill');
  const standby = $('.intro__standby');
  const enterBtn = $('#introEnter');
  const muteBtn = $('#introMute');
  const heroHud = document.querySelector('.hero__hud');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const stage = (n) => { if (!ready && !done) intro.dataset.stage = n; }; // B3로 건너뛴 뒤엔 남은 부팅 루프가 덮어쓰지 않게

  // Hero HUD를 복제해 B3 카드로 쓴다 (IN-8: 같은 구조)
  const hud = heroHud?.cloneNode(true);
  if (hud) {
    hud.classList.remove('hero__hud');
    standby.prepend(hud);
  }

  const LINES = [
    ['> BOOT REDOCU.OS v3.0', ''],
    ['> PROFILE.MODULE ............', 'OK'],
    ['> MOUNT /software /games ....', 'OK'],
    ['> MOUNT /wiki /academy ......', 'OK'],
    ['> AUDIO.MODULE ..............', 'READY'],
  ];
  // [도달 %, 걸리는 ms, 항목명] — 37%·87%에서 멈칫
  const LOAD = [
    [18, 220, 'PROFILE'], [37, 260, 'SOFTWARE'], [37, 240, 'SOFTWARE'], [55, 200, 'GAMES'],
    [72, 220, 'LEARNING WIKI'], [87, 180, 'ACADEMY'], [87, 220, 'ACADEMY'], [100, 160, 'ACADEMY'],
  ];

  let ready = false;
  let done = false;

  const showStandby = () => {
    if (ready || done) return;
    stage(3);
    $('.intro__boot').hidden = true;
    standby.hidden = false;
    hud?.classList.add('is-in');
    enterBtn.focus({ preventScroll: true });
    ready = true;
  };

  const tween = (from, to, ms) => new Promise((resolve) => {
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min((now - t0) / ms, 1);
      const v = from + (to - from) * t;
      pct.textContent = Math.floor(v) + '%';
      fill.style.setProperty('--p', v / 100);
      if (t < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });

  const boot = async () => {
    await wait(600); // B0
    stage(1);
    for (const [text, result] of LINES) { // B1: 줄 간격 120~400ms 불규칙
      const li = document.createElement('li');
      li.textContent = text;
      log.append(li);
      await wait(120 + Math.random() * 180);
      if (result) li.insertAdjacentHTML('beforeend', `<b>${result}</b>`);
      await wait(Math.random() * 100);
    }
    stage(2);
    load.hidden = false;
    let at = 0;
    for (const [to, ms, name] of LOAD) { // B2
      item.textContent = 'LOADING // ' + name;
      await tween(at, to, ms);
      at = to;
    }
    item.textContent = 'PROFILE LOADED';
    await wait(350);
    showStandby();
  };

  const enter = (muted) => {
    if (!ready) return;
    ready = false;
    done = true;
    try { localStorage.setItem('intro-seen', '1'); } catch (e) {}
    // 사용자 입력 직후라 자동재생 차단에 걸리지 않는다. 이전에 음소거했으면 player가 무음 입장 처리
    window.soundPlayer?.introEnter(muted);

    // IN-8: 1080px 초과면 카드가 Hero HUD 자리로 축소·이동
    const flip = !reduced && hud && heroHud && innerWidth > 1080;
    if (flip) {
      const a = hud.getBoundingClientRect();
      const b = heroHud.getBoundingClientRect();
      heroHud.style.visibility = 'hidden';
      intro.classList.add('is-flip');
      hud.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})`;
    }
    intro.classList.add('is-leaving');
    document.documentElement.classList.remove('intro-lock');
    document.dispatchEvent(new CustomEvent('intro:done', { detail: { flip } }));
    setTimeout(() => {
      intro.remove();
      if (flip) heroHud.style.visibility = '';
    }, reduced ? 0 : 720);
  };

  muteBtn.addEventListener('click', (e) => { e.stopPropagation(); enter(true); });
  intro.addEventListener('click', () => (ready ? enter(false) : showStandby()));
  document.addEventListener('keydown', (e) => {
    if (done || ['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    if (e.target === muteBtn && (e.key === 'Enter' || e.key === ' ')) return; // 버튼 click이 처리
    e.preventDefault();
    if (ready) enter(false); else showStandby(); // 부팅 중 키 입력은 B3로 건너뜀
  });

  if (reduced) showStandby(); // IN-7
  else boot();
})();
