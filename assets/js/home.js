// 메인 페이지: Hero 등장 + 섹션 슬라이더(◀ 01 / 05 ▶)

// ── Hero ── 인트로가 있으면 입장(intro:done) 뒤에, 없으면 바로 등장 연출
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  hero.querySelectorAll('[data-type]').forEach((el, i) => {
    el.style.setProperty('--n', el.textContent.trim().length);
    el.style.setProperty('--i', i);
  });
  const start = (flip) => {
    hero.classList.add('is-on');
    if (flip) hero.classList.add('from-intro'); // 인트로 카드가 HUD 자리로 날아왔으니 HUD 연출은 생략
    else hero.querySelector('.hud')?.classList.add('is-in');
  };
  if (document.getElementById('intro')) document.addEventListener('intro:done', (e) => start(e.detail?.flip), { once: true });
  else start(false);
})();

// ── 슬라이더 ── 카드 한 장씩 이동, 카운터는 첫 보이는 카드 번호, 끝에서 비활성. 넘칠 게 없으면 카운터 숨김
document.querySelectorAll('[data-slider]').forEach((section) => {
  const track = section.querySelector('.slider-track');
  const nav = section.querySelector('.slider-nav');
  if (!track || !nav) return;
  const prev = nav.querySelector('[data-prev]');
  const next = nav.querySelector('[data-next]');
  const pos = nav.querySelector('[data-pos]');
  const count = track.children.length;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 진행 중인 스크롤의 목표 카드. 연타해도 중간 위치가 아니라 직전 목표 기준으로 계산한다
  let target = null;
  let settle = 0;
  let shown = -1;

  const unit = () => track.children[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  const last = () => Math.max(0, count - Math.round((track.clientWidth + 1) / unit())); // 마지막 시작 카드
  const current = () => Math.round(track.scrollLeft / unit());

  const update = () => {
    const i = Math.min(target ?? current(), last());
    nav.classList.toggle('is-static', last() === 0);
    prev.disabled = i <= 0;
    next.disabled = i >= last();
    if (i === shown) return;
    shown = i;
    pos.textContent = String(i + 1).padStart(2, '0');
    pos.classList.remove('is-tick');
    void pos.offsetWidth; // 애니메이션 재시작
    pos.classList.add('is-tick');
  };

  const go = (d) => {
    target = Math.min(Math.max((target ?? current()) + d, 0), last());
    track.scrollTo({ left: target * unit(), behavior: reduced ? 'auto' : 'smooth' });
    update();
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  ['wheel', 'touchstart', 'pointerdown'].forEach((t) => track.addEventListener(t, () => { target = null; }, { passive: true }));
  track.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => { target = null; update(); }, 150);
    if (target === null) update();
  }, { passive: true });
  addEventListener('resize', update);
  update();
});
