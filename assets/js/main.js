
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

  const scrollAmount = () => Math.min(track.clientWidth * 0.9, 420);

  leftArrow.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });

  rightArrow.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });

  slider.addEventListener('mousemove', (event) => {
    const rect = slider.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const edgeZone = Math.min(120, rect.width * 0.18);
    const nearLeft = x <= edgeZone;
    const nearRight = x >= rect.width - edgeZone;

    leftArrow.classList.toggle('is-visible', nearLeft);
    rightArrow.classList.toggle('is-visible', nearRight);
  });

  slider.addEventListener('mouseleave', () => {
    leftArrow.classList.remove('is-visible');
    rightArrow.classList.remove('is-visible');
  });
});

initTheme();
