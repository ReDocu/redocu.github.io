
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const mobileNavToggle = document.getElementById('mobileNavToggle');
const mobileNavPanel = document.getElementById('mobileNavPanel');
const moreMenuToggle = document.getElementById('moreMenuToggle');
const moreMenuPanel = document.getElementById('moreMenuPanel');

const STORAGE_KEY = 'portfolio-theme';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  body.classList.toggle('dark-mode', isDark);
  themeToggle.setAttribute('aria-pressed', String(isDark));
  const icon = themeToggle.querySelector('.theme-toggle__icon');
  if (icon) icon.textContent = isDark ? '☀' : '☾';
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  applyTheme(saved === 'dark' ? 'dark' : 'light');
}

function closeMoreMenu() {
  if (!moreMenuToggle || !moreMenuPanel) return;
  moreMenuToggle.setAttribute('aria-expanded', 'false');
  moreMenuPanel.hidden = true;
}

function openMoreMenu() {
  if (!moreMenuToggle || !moreMenuPanel) return;
  moreMenuToggle.setAttribute('aria-expanded', 'true');
  moreMenuPanel.hidden = false;
}

function toggleMoreMenu() {
  const isOpen = moreMenuToggle.getAttribute('aria-expanded') === 'true';
  if (isOpen) closeMoreMenu();
  else openMoreMenu();
}

function closeMobileNav() {
  if (!mobileNavToggle || !mobileNavPanel) return;
  mobileNavToggle.setAttribute('aria-expanded', 'false');
  mobileNavPanel.hidden = true;
}

function toggleMobileNav() {
  const isOpen = mobileNavToggle.getAttribute('aria-expanded') === 'true';
  mobileNavToggle.setAttribute('aria-expanded', String(!isOpen));
  mobileNavPanel.hidden = isOpen;
}

themeToggle?.addEventListener('click', () => {
  const next = body.classList.contains('dark-mode') ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
});

mobileNavToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleMobileNav();
});

moreMenuToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleMoreMenu();
});

moreMenuPanel?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    closeMoreMenu();
  });
});

document.querySelectorAll('.mobile-nav a, .main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    closeMobileNav();
    closeMoreMenu();
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1080) {
    closeMobileNav();
  }
  closeMoreMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMoreMenu();
    closeMobileNav();
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.more-menu')) {
    closeMoreMenu();
  }
  if (window.innerWidth <= 1080 && !event.target.closest('.site-header')) {
    closeMobileNav();
  }
});

document.querySelectorAll('[data-slider]').forEach((slider) => {
  const track = slider.querySelector('.slider-track');
  const leftArrow = slider.querySelector('.slider-arrow--left');
  const rightArrow = slider.querySelector('.slider-arrow--right');
  if (!track || !leftArrow || !rightArrow) return;

  const firstCard = track.querySelector('.portfolio-card');

  // 진행 중인 스크롤의 목표 지점. 애니메이션 도중 화살표를 연타해도
  // 중간 위치가 아니라 직전 목표를 기준으로 다음 페이지를 계산한다.
  let pendingLeft = null;
  let settleTimer = 0;

  // offsetWidth는 hover scale 같은 transform의 영향을 받지 않는다
  const metrics = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const unit = firstCard ? firstCard.offsetWidth + gap : track.clientWidth;
    const perView = Math.max(1, Math.round((track.clientWidth + gap) / unit));
    return { unit, perView };
  };

  const maxScroll = () => track.scrollWidth - track.clientWidth;

  // 넘길 카드가 남아 있는 쪽 화살표만 표시 (이동 중에는 목표 지점 기준으로 판단)
  const updateArrows = () => {
    const pos = pendingLeft ?? track.scrollLeft;
    const overflowing = track.scrollWidth > track.clientWidth + 1;
    leftArrow.classList.toggle('is-visible', overflowing && pos > 1);
    rightArrow.classList.toggle('is-visible', overflowing && pos < maxScroll() - 1);
  };

  // 화면에 보이는 카드 수만큼(데스크톱 3 / 태블릿 2 / 모바일 1) 카드 경계에 맞춰 이동
  const page = (direction) => {
    const { unit, perView } = metrics();
    const from = pendingLeft ?? track.scrollLeft;
    const targetCard = Math.round(from / unit) + direction * perView;
    const left = Math.min(Math.max(targetCard, 0) * unit, maxScroll());
    pendingLeft = left;
    track.scrollTo({ left, behavior: 'smooth' });
    updateArrows();
  };

  leftArrow.addEventListener('click', () => page(-1));
  rightArrow.addEventListener('click', () => page(1));

  // 사용자가 직접 스와이프·휠 스크롤을 시작하면 예약된 목표 지점을 버린다
  ['wheel', 'touchstart', 'pointerdown'].forEach((type) => {
    track.addEventListener(type, () => { pendingLeft = null; }, { passive: true });
  });

  // 스크롤이 멎으면 목표 지점을 해제해 실제 위치와 다시 동기화한다
  track.addEventListener('scroll', () => {
    updateArrows();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      pendingLeft = null;
      updateArrows();
    }, 150);
  }, { passive: true });

  window.addEventListener('resize', updateArrows);
  updateArrows();
});

initTheme();
