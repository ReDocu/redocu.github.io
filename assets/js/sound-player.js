// 배경음악 플레이어 (PRD 6장). 목록은 _data/playlist.yml.
// 곡·위치·재생 여부·음량·음소거를 localStorage 'sound-player'에 저장해 페이지를 옮겨도 이어간다.
(() => {
  const root = document.getElementById('player');
  if (!root) return;
  const tracks = JSON.parse(document.getElementById('playlistData').textContent);
  if (!tracks.length) return;

  const KEY = 'sound-player';
  const panel = document.getElementById('playerPanel');
  const list = root.querySelector('.player__list');
  const all = (sel) => root.querySelectorAll(sel);
  const field = (name, fn) => all(`[data-f="${name}"]`).forEach(fn);
  const mmss = (s) => (s = Math.floor(s || 0), `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);

  const audio = new Audio();
  audio.preload = 'none';
  // iOS는 음량을 코드로 못 바꾼다(항상 1) → 슬라이더를 숨기고 음소거만 (VO-4)
  const fixedVolume = (() => { const a = new Audio(); a.volume = 0.5; return a.volume !== 0.5; })();
  if (fixedVolume) root.classList.add('is-fixed-volume');

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  let index = saved.index >= 0 && saved.index < tracks.length ? saved.index : 0;
  let volume = Number.isFinite(saved.volume) ? saved.volume : 40;
  let lastVolume = volume || 40;
  let failed = 0;
  let dragging = false;

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ index, time: audio.currentTime, playing: !audio.paused, volume, muted: audio.muted }));
    } catch (e) {}
  };

  // ── 곡 목록 (TI-6) ──
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="player__row"><span class="player__num">${String(i + 1).padStart(2, '0')}</span><span class="player__row-title"></span><span class="player__row-group"></span><span class="player__row-dur">${t.dur || ''}</span></button>`;
    li.querySelector('.player__row-title').textContent = t.title;
    li.querySelector('.player__row-group').textContent = (t.group || '').split(' · ').pop().toUpperCase();
    li.firstChild.addEventListener('click', () => { load(i); play(); });
    list.append(li);
  });

  const setRange = (el, v, max) => { el.value = v; el.style.setProperty('--p', `${(v / max) * 100}%`); };

  const load = (i, time = 0) => {
    index = (i + tracks.length) % tracks.length;
    const t = tracks[index];
    audio.src = t.src;
    if (time) audio.addEventListener('loadedmetadata', () => { audio.currentTime = time; }, { once: true });
    field('title', (el) => { el.textContent = t.title; });
    field('group', (el) => { el.textContent = t.group || ''; });
    field('desc', (el) => { el.textContent = t.desc || ''; });
    field('cur', (el) => { el.textContent = mmss(time); });
    field('dur', (el) => { el.textContent = t.dur ? t.dur.padStart(5, '0') : '00:00'; });
    field('seek', (el) => setRange(el, 0, 1000));
    list.querySelectorAll('.player__row').forEach((row, n) => row.classList.toggle('is-current', n === index));
    mark();
  };

  // 현재 곡 표시: 패널 목록 + 페이지 안의 [data-play-index] 버튼(/music/ 등). 일시정지면 .is-paused
  const mark = () => {
    document.querySelectorAll('.player__row, [data-play-index]').forEach((el) => {
      const n = el.dataset.playIndex !== undefined ? Number(el.dataset.playIndex) : [...list.children].indexOf(el.parentNode);
      const cur = n === index;
      if (cur) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
      if (el.dataset.playIndex !== undefined) el.classList.toggle('is-paused', cur && audio.paused);
    });
  };

  const applyVolume = () => {
    audio.volume = volume / 100;
    const silent = audio.muted || volume === 0;
    root.classList.toggle('is-muted', silent);
    all('[data-act="mute"]').forEach((b) => { b.setAttribute('aria-pressed', String(silent)); b.setAttribute('aria-label', silent ? '음소거 해제' : '음소거'); });
    field('vol', (el) => setRange(el, volume, 100));
    field('volv', (el) => { el.textContent = String(volume).padStart(3, '0'); });
  };

  const sync = () => {
    const playing = !audio.paused;
    root.classList.toggle('is-playing', playing);
    mark();
    all('[data-act="toggle"]').forEach((b) => b.setAttribute('aria-label', playing ? '일시정지' : '재생'));
  };

  const play = () => audio.play().catch(() => {});
  const setPanel = (open) => {
    panel.hidden = !open;
    all('[data-act="panel"]').forEach((b) => b.setAttribute('aria-expanded', String(open)));
  };

  const actions = {
    toggle: () => (audio.paused ? play() : audio.pause()),
    next: () => { load(index + 1); play(); },
    prev: () => { if (audio.currentTime > 3) audio.currentTime = 0; else { load(index - 1); play(); } }, // TI-5
    mute: () => {
      if (volume === 0) { volume = lastVolume; audio.muted = false; } // 0에서 해제하면 직전 음량으로 (VO-2)
      else audio.muted = !audio.muted;
      applyVolume();
    },
    panel: () => setPanel(panel.hidden),
    close: () => setPanel(false),
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b) actions[b.dataset.act]();
  });
  // 페이지 안 곡 버튼: 클릭하면 그 곡 재생, 이미 그 곡이면 재생/일시정지
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-play-index]');
    if (!b) return;
    const i = Number(b.dataset.playIndex);
    if (i === index) actions.toggle(); else { load(i); play(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) setPanel(false); });
  document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !root.contains(e.target)) setPanel(false); });

  // 진행 바 (TI-4): 드래그 중에는 timeupdate가 값을 덮어쓰지 않게
  field('seek', (el) => {
    el.addEventListener('input', () => {
      dragging = true;
      setRange(el, el.value, 1000);
      field('cur', (c) => { c.textContent = mmss((el.value / 1000) * (audio.duration || 0)); });
    });
    el.addEventListener('change', () => {
      dragging = false;
      if (audio.duration) audio.currentTime = (el.value / 1000) * audio.duration;
    });
  });
  // 음량 (VO-1)
  field('vol', (el) => el.addEventListener('input', () => {
    volume = Number(el.value);
    if (volume) { lastVolume = volume; audio.muted = false; }
    applyVolume();
  }));

  audio.addEventListener('timeupdate', () => {
    if (dragging || !audio.duration) return;
    field('cur', (el) => { el.textContent = mmss(audio.currentTime); });
    field('seek', (el) => setRange(el, Math.round((audio.currentTime / audio.duration) * 1000), 1000));
  });
  audio.addEventListener('loadedmetadata', () => field('dur', (el) => { el.textContent = mmss(audio.duration); }));
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('playing', () => { failed = 0; });
  audio.addEventListener('ended', actions.next); // PL-2: 마지막 곡 다음은 첫 곡
  // PL-5: 없는/깨진 파일은 건너뛰고, 전부 실패하면 숨긴다
  audio.addEventListener('error', () => {
    if (++failed >= tracks.length) { root.hidden = true; return; }
    load(index + 1);
    play();
  });
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  audio.muted = !!saved.muted;
  applyVolume();
  load(index, saved.time || 0);
  root.hidden = false;

  // PL-4: 듣던 중이면 이어서 재생. 자동재생이 막히면 첫 클릭/키 입력 때 재개
  if (saved.playing) {
    audio.play().catch(() => {
      const resume = (e) => {
        if (!e.target.closest?.('#intro')) play(); // 인트로 입장은 introEnter가 처리
        removeEventListener('pointerdown', resume);
        removeEventListener('keydown', resume);
      };
      addEventListener('pointerdown', resume);
      addEventListener('keydown', resume);
    });
  }

  window.soundPlayer = {
    play,
    // 인트로 입장 (VO-5): MUTE ENTER거나 이전에 음소거했으면 무음으로 입장 = 재생하지 않음
    introEnter: (muted) => { if (!muted && !audio.muted) play(); },
  };
})();
