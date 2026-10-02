// ── 내비 · 기타 메뉴 ──
const mobileNavToggle = document.getElementById('mobileNavToggle');
const mobileNavPanel = document.getElementById('mobileNavPanel');
const moreMenuToggle = document.getElementById('moreMenuToggle');
const moreMenuPanel = document.getElementById('moreMenuPanel');

function setOpen(toggle, panel, open) {
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
}
const isOpen = (toggle) => toggle?.getAttribute('aria-expanded') === 'true';

mobileNavToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  setOpen(mobileNavToggle, mobileNavPanel, !isOpen(mobileNavToggle));
});
moreMenuToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  setOpen(moreMenuToggle, moreMenuPanel, !isOpen(moreMenuToggle));
});
document.querySelectorAll('.mobile-nav a, .main-nav a, .more-menu__panel a').forEach((a) =>
  a.addEventListener('click', () => {
    setOpen(mobileNavToggle, mobileNavPanel, false);
    setOpen(moreMenuToggle, moreMenuPanel, false);
  })
);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  setOpen(mobileNavToggle, mobileNavPanel, false);
  setOpen(moreMenuToggle, moreMenuPanel, false);
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.more-menu')) setOpen(moreMenuToggle, moreMenuPanel, false);
  if (!e.target.closest('.site-header')) setOpen(mobileNavToggle, mobileNavPanel, false);
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 1080) setOpen(mobileNavToggle, mobileNavPanel, false);
});

// ── 모션 API ──
// data-reveal[=up|fade|left|right|scale|clip] : 화면에 들어오면 .is-in
// data-stagger (부모)                          : 자식 data-reveal 에 --i 순번 → 순차 지연
// data-count="607"                             : 화면에 들어오면 0부터 카운트업
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  if (reduceMotion || Number.isNaN(target)) { el.textContent = el.dataset.count; return; }
  const pad = el.dataset.count.length; // "07" 같은 자리수 유지
  const start = performance.now();
  const dur = 1200;
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const v = Math.round(target * (1 - Math.pow(1 - t, 3)));
    el.textContent = String(v).padStart(pad, '0');
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const reveal = (el) => {
  el.classList.add('is-in');
  if (el.dataset.count) countUp(el);
};

// 페이지마다 할 일. 본문만 바꿔 끼우는 이동(sound-player.js) 뒤에도 'page:load'로 다시 돈다
function initPage() {
  // 현재 페이지 메뉴 강조 (서브 페이지)
  document.querySelectorAll('.main-nav a').forEach((a) => {
    const path = new URL(a.href).pathname;
    if (path !== '/' && location.pathname.startsWith(path)) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  document.querySelectorAll('[data-stagger]').forEach((parent) => {
    [...parent.children].forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', parent.dataset.stagger || '');
      child.style.setProperty('--i', i);
    });
  });

  const revealTargets = document.querySelectorAll('[data-reveal]:not(.is-in), [data-count]:not(.is-in)');
  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(reveal);
    return;
  }
  // clip 은 시작 시 면적이 0이라 IO가 교차를 못 본다 → 부모를 대신 관찰한다
  const watchers = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      watchers.get(entry.target).forEach(reveal);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 }); // 비율 기준은 아주 긴 요소(부모 main 등)에서 영영 안 걸린다
  revealTargets.forEach((el) => {
    const target = el.dataset.reveal === 'clip' ? el.parentElement : el;
    if (!watchers.has(target)) { watchers.set(target, []); io.observe(target); }
    watchers.get(target).push(el);
  });
}
initPage();
document.addEventListener('page:load', initPage);
