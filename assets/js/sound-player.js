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

  // ── 사이트 안 이동: 페이지를 새로 읽지 않고 <main>만 바꿔 끼운다 → 플레이어가 살아 있어 음악이 안 끊긴다 ──
  // 플레이어가 없는 페이지(학습 문서 원본 HTML 등)·파일·실패는 일반 이동. 인트로는 첫 진입에만 쓰므로 가져오지 않는다.
  const FILE = /\.(pdf|zip|png|jpe?g|gif|svg|webp|mp3|mp4)$/i;
  const here = () => location.pathname + location.search;
  let shown = here();
  let navId = 0;
  const sheets = (doc) => [...doc.head.querySelectorAll('link[rel="stylesheet"]')];
  // DOMParser로 만든 <script>는 실행되지 않는다 → 새로 만들어 끼우고, 외부 파일이면 다 읽을 때까지 기다린다
  const run = (old) => new Promise((done) => {
    const s = document.createElement('script');
    [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
    s.textContent = old.textContent;
    if (s.src) s.onload = s.onerror = done;
    old.replaceWith(s);
    if (!s.src) done();
  });

  const go = async (url, push) => {
    const id = ++navId;
    const fallback = () => (push ? location.assign(url) : location.reload());
    let doc;
    try {
      const res = await fetch(url);
      if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) throw 0;
      doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    } catch (e) { if (id === navId) fallback(); return; }
    if (id !== navId) return; // 그새 다른 링크를 눌렀다
    const next = doc.getElementById('main');
    if (!next || !doc.getElementById('player')) { fallback(); return; }

    // CSS: 새 페이지 순서대로 맞추고(있는 건 재사용), 새로 받는 파일은 다 읽은 뒤 바꿔 끼워 깜빡임을 막는다
    const old = new Map(sheets(document).map((l) => [l.href, l]));
    const links = sheets(doc).map((l) => {
      const href = new URL(l.getAttribute('href'), url).href;
      return old.get(href) || Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
    });
    await Promise.all(links.filter((l) => !l.isConnected).map((l) => new Promise((done) => {
      l.onload = l.onerror = done;
      document.head.append(l);
    })));
    if (id !== navId) return;
    old.forEach((l) => { if (!links.includes(l)) l.remove(); });
    document.head.append(...links);

    document.title = doc.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', doc.querySelector('meta[name="description"]')?.content || '');
    if (push) {
      history.replaceState({ y: scrollY }, ''); // 뒤로 가기 때 돌아올 위치
      history.pushState({}, '', url);
    }
    shown = here();
    document.getElementById('main').replaceWith(next);
    document.querySelectorAll('script[data-page]').forEach((s) => s.remove());

    // 원래 페이지 순서대로: 본문 인라인 스크립트 → main.js 페이지 처리 → 페이지 전용 스크립트(home.js 등)
    for (const s of next.querySelectorAll('script')) await run(s);
    document.dispatchEvent(new Event('page:load'));
    for (const s of doc.querySelectorAll('script[data-page]')) {
      document.body.append(s);
      await run(s);
    }

    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else scrollTo({ top: push ? 0 : history.state?.y || 0, behavior: 'instant' });
    next.tabIndex = -1;
    next.focus({ preventScroll: true }); // 스크린리더가 새 본문부터 읽게
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.origin !== location.origin) return;
    const url = new URL(a.href);
    if (FILE.test(url.pathname)) return;
    if (url.pathname + url.search === here() && url.hash) return; // 같은 페이지 앵커는 브라우저가 처리
    e.preventDefault();
    go(url.href, true);
  });
  // 앵커만 바뀐 뒤로/앞으로는 같은 페이지라 무시
  addEventListener('popstate', () => { if (here() !== shown) go(location.href, false); });
  document.addEventListener('page:load', mark); // /music/ 곡 버튼 현재 곡 표시

  window.soundPlayer = {
    play,
    // 인트로 입장 (VO-5): MUTE ENTER거나 이전에 음소거했으면 무음으로 입장 = 재생하지 않음
    introEnter: (muted) => { if (!muted && !audio.muted) play(); },
  };
})();
