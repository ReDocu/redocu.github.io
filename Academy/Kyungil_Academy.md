---
layout : main
title : main
---

<style>
  .ky-track-page {
    width: min(calc(100% - 32px), var(--container));
    margin: 0 auto;
    padding: 64px 0 96px;
  }

  /* ── 페이지 헤더 ── */
  .ky-hero { max-width: 760px; }
  .ky-hero .section-label {
    font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 10px;
  }
  .ky-hero h1 { margin: 0; font-size: clamp(1.9rem, 3.4vw, 2.8rem); line-height: 1.15; }
  .ky-hero__copy { margin: 16px 0 0; color: var(--muted); font-size: 1.03rem; }
  .ky-jump { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
  .ky-jump a {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 999px; font-weight: 700; font-size: 0.9rem;
    color: var(--text); background: var(--bg-soft); border: 1px solid var(--line);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .ky-jump a:hover { transform: translateY(-2px); border-color: var(--track-c); }
  .ky-jump a .dot { width: 9px; height: 9px; border-radius: 50%; }

  /* ── 트랙 ── */
  .ky-track {
    margin-top: 40px; padding: 30px; border-radius: var(--radius);
    background: var(--bg-elev); border: 1px solid var(--line); box-shadow: var(--shadow);
    border-top: 4px solid var(--track);
    scroll-margin-top: 96px;
  }
  .ky-track__head { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
  .ky-track__badge {
    flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px;
    display: grid; place-items: center; font-weight: 800; font-size: 1.1rem;
    color: var(--track); background: color-mix(in srgb, var(--track) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--track) 35%, transparent);
  }
  .ky-track__head h2 { margin: 0; font-size: 1.55rem; line-height: 1.2; }
  .ky-track__head h2 span { color: var(--muted); font-size: 0.95rem; font-weight: 600; }
  .ky-track__tag { margin: 4px 0 0; color: var(--muted); font-size: 0.95rem; }

  .ky-track__grid {
    display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    gap: 28px; margin-top: 26px;
  }

  .ky-col-title {
    display: flex; align-items: center; gap: 9px; margin: 0 0 14px;
    font-size: 0.82rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--text);
  }
  .ky-col-title::before { content: ""; width: 6px; height: 16px; border-radius: 3px; background: var(--track); }

  /* ── 학습 요약 ── */
  .ky-learn__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }
  .ky-learn__list li { font-size: 0.95rem; }
  .ky-learn__list li b { display: block; color: var(--text); font-weight: 700; margin-bottom: 2px; }
  .ky-learn__list li span { color: var(--muted); }
  .ky-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; }
  .ky-tags .tag {
    font-size: 0.76rem; font-weight: 700; padding: 3px 10px; border-radius: 999px;
    color: var(--track); background: color-mix(in srgb, var(--track) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--track) 28%, transparent);
  }

  /* ── 제작 게임 카드 ── */
  .ky-games { display: grid; gap: 16px; align-content: start; }
  .ky-game {
    display: grid; grid-template-columns: 130px 1fr; gap: 16px;
    padding: 14px; border-radius: calc(var(--radius) - 2px);
    background: var(--bg-soft); border: 1px solid var(--line);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .ky-game:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  .ky-game__thumb {
    align-self: start;
    aspect-ratio: 4 / 3; border-radius: 8px; overflow: hidden; background: var(--bg-elev);
  }
  .ky-game__thumb img { width: 100%; height: 100%; object-fit: cover; }
  .ky-game__body { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .ky-game__kind {
    align-self: flex-start; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em;
    padding: 2px 8px; border-radius: 6px; color: var(--muted); background: var(--bg-elev); border: 1px solid var(--line);
  }
  .ky-game__body h4 { margin: 0; font-size: 1.05rem; line-height: 1.25; }
  .ky-game__body p { margin: 0; font-size: 0.87rem; color: var(--muted); }
  .ky-game__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 6px; }
  .ky-game__actions .btn { min-height: 38px; padding: 8px 14px; font-size: 0.85rem; }
  .btn--soft {
    background: transparent; color: var(--text);
    border: 1px solid var(--line);
  }
  .btn--soft:hover { background: var(--bg-elev); transform: scale(1.02); }
  /* 게임 설명의 핵심 학습 라인 */
  .ky-game__focus { margin: 0; font-size: 0.83rem; color: var(--muted); line-height: 1.5; }
  .ky-game__focus b {
    display: inline-block; margin-right: 6px; color: var(--track); font-weight: 800;
    font-size: 0.72rem; letter-spacing: 0.03em; text-transform: uppercase;
  }

  /* ── 반응형 ── */
  @media (max-width: 860px) {
    .ky-track__grid { grid-template-columns: 1fr; gap: 24px; }
    .ky-track { padding: 24px 20px; }
  }
  @media (max-width: 520px) {
    .ky-game { grid-template-columns: 1fr; }
    .ky-game__thumb { aspect-ratio: 16 / 9; }
  }
</style>

<section class="ky-track-page" aria-label="경일게임아카데미 기술 스택별 학습 정리">

  <!-- ══ 페이지 헤더 ══ -->
  <header class="ky-hero" style="--track-c:#38bdf8">
    <p class="section-label">경일게임아카데미 · 2019 – 2020</p>
    <h1>언어별 학습 &amp; 제작 게임</h1>
    <p class="ky-hero__copy">
      <strong>C → WINAPI → Unity</strong> 순서로, 각 단계에서 배운 핵심 개념과 그 결과물로 직접 만든 게임 정리.     
    </p>
    <p class="ky-hero__copy"> 각 게임은 실행 파일 또는 기술문서로 확인할 수 있습니다.</p>
    <nav class="ky-jump" aria-label="트랙 바로가기">
      <a href="#track-c"><span class="dot" style="background:#38bdf8"></span>C / C++</a>
      <a href="#track-winapi"><span class="dot" style="background:#f59e0b"></span>WINAPI</a>
      <a href="#track-unity"><span class="dot" style="background:#6366f1"></span>Unity</a>
    </nav>
  </header>

  <!-- ══ ① C / C++ ══ -->
  <article class="ky-track" id="track-c" style="--track:#38bdf8">
    <div class="ky-track__head">
      <span class="ky-track__badge">C++</span>
      <div>
        <h2>C / C++ <span>· 콘솔 프로그래밍</span></h2>
        <p class="ky-track__tag">문법 → 절차적 → 객체지향으로 이어지는 한 달간의 C++ 여정</p>
      </div>
    </div>

    <div class="ky-track__grid">
      <!-- 학습 요약 -->
      <div class="ky-learn">
        <h3 class="ky-col-title">학습한 내용</h3>
        <ul class="ky-learn__list">
          <li><b>기초 문법</b><span>변수·형변환, 조건/중첩 반복, 배열(1D·2D)·구조체, 함수 오버로딩, 포인터·참조, 템플릿</span></li>
          <li><b>절차적 프로그래밍</b><span>게임 루프·상태머신, 2D 타일맵 이동, 실시간 입력(<code>_kbhit</code>/<code>_getch</code>)</span></li>
          <li><b>객체지향(OOP)</b><span>클래스·캡슐화, 상속·다형성(부모 포인터), 헤더/구현 분리, 동적 할당 <code>new</code>/<code>delete</code></span></li>
          <li><b>게임 시스템</b><span>프레임 제어(<code>clock</code>·FPS), WinAPI 콘솔 제어·더블 버퍼링, 파일 입출력 세이브</span></li>
        </ul>
        <div class="ky-tags">
          <span class="tag">C/C++</span><span class="tag">포인터·참조</span><span class="tag">구조체</span>
          <span class="tag">OOP</span><span class="tag">게임 루프</span><span class="tag">파일 I/O</span>
        </div>
      </div>

      <!-- 제작 게임 -->
      <div>
        <h3 class="ky-col-title">제작한 게임</h3>
        <div class="ky-games">
          <div class="ky-game">
            <div class="ky-game__thumb">
              <img src="/assets/images/portfolio/Kyungil_Academy.png" alt="KY16 콘솔 게임 팩 썸네일" loading="lazy">
            </div>
            <div class="ky-game__body">
              <span class="ky-game__kind">콘솔 게임 팩</span>
              <h4>KY16 Console Game Pack</h4>
              <p>메뉴에서 번호를 골라 실행하는 콘솔 게임 모음. <strong>문법 학습 → 절차적 게임 → 객체지향 게임</strong> 순으로 난이도가 올라가며, 게임마다 습득하는 기술이 뚜렷이 구분됩니다.</p>
              <p><b>01 영웅은 절차적</b> — HeroIsProcedural · 텍스트 RPG</p>
              <p><b>02 탈출 루프</b> — DirectRope · 격자 이동</p>
              <p><b>03 미로 탈출</b> — EscapeMirror · 채굴 어드벤처</p>
              <p><b>04 겜블 게임</b> — Gamble · 절차 → OOP 전환</p>
              <p><b>05 알카노이드</b> — Alcanoid · 벽돌깨기 (최종)</p>


              <div class="ky-game__actions">
                <a class="btn" href="/Academy/KYGameAcademy/KY16Project_v1.0.zip">게임 다운로드</a>
                <a class="btn btn--soft" href="/Academy/KYGameAcademy/KY16Project_기술문서.html" target="_blank" rel="noopener">기술문서</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- ══ ② WINAPI ══ -->
  <article class="ky-track" id="track-winapi" style="--track:#f59e0b">
    <div class="ky-track__head">
      <span class="ky-track__badge">API</span>
      <div>
        <h2>WINAPI <span>· 2D 게임 프레임워크</span></h2>
        <p class="ky-track__tag">엔진 없이 직접 만든 게임 루프·렌더링 파이프라인</p>
      </div>
    </div>

    <div class="ky-track__grid">
      <div class="ky-learn">
        <h3 class="ky-col-title">학습한 내용</h3>
        <ul class="ky-learn__list">
          <li><b>게임 프레임워크 구조화</b><span>초기화 → 입력 → 갱신 → 렌더 루프를 직접 설계</span></li>
          <li><b>더블 버퍼링</b><span>백버퍼에 그린 뒤 한 번에 출력해 깜빡임 제거</span></li>
          <li><b>다수 객체 관리</b><span>STL <code>Vector</code>로 탄막·적의 생성·소멸을 동적으로 관리</span></li>
          <li><b>아이소메트릭 · 길찾기</b><span>ISO Matrix 좌표 변환, Z-Order 정렬, A* 길찾기</span></li>
          <li><b>맵툴 제작</b><span>타일 기반 MapTool로 스테이지 데이터 편집</span></li>
        </ul>
        <div class="ky-tags">
          <span class="tag">WINAPI</span><span class="tag">더블 버퍼링</span><span class="tag">STL Vector</span>
          <span class="tag">ISO / Z-Order</span><span class="tag">A*</span><span class="tag">MapTool</span>
        </div>
      </div>

      <div>
        <h3 class="ky-col-title">제작한 게임</h3>
        <div class="ky-games">
          <div class="ky-game">
            <div class="ky-game__thumb">
              <img src="/assets/images/portfolio/동방플라이트.png" alt="동방플라이트 썸네일" loading="lazy">
            </div>
            <div class="ky-game__body">
              <span class="ky-game__kind">팀 · 슈팅</span>
              <h4>동방플라이트</h4>
              <p>종스크롤 탄막 슈팅 게임.</p>
              <p class="ky-game__focus"><b>핵심 학습</b>STL Vector 다수 객체 관리 · 게임 프레임워크 구조화 · 더블 버퍼링</p>
              <div class="ky-game__actions">
                <a class="btn" href="/data/games/동방플라이트.zip">게임 다운로드</a>
                <a class="btn btn--soft" href="/data/동방플라이트.pdf" target="_blank" rel="noopener">기술문서</a>
              </div>
            </div>
          </div>
          <div class="ky-game">
            <div class="ky-game__thumb">
              <img src="/assets/images/portfolio/트릭스터 택틱스 기술문서.png" alt="트릭스터 택틱스 썸네일" loading="lazy">
            </div>
            <div class="ky-game__body">
              <span class="ky-game__kind">개인 · SRPG</span>
              <h4>트릭스터 택틱스</h4>
              <p>아이소메트릭 택틱스 게임 + 자체 맵툴.</p>
              <p class="ky-game__focus"><b>핵심 학습</b>ISO Matrix 좌표 변환 · Z-Order 정렬 · A* 길찾기 · MapTool 제작</p>
              <div class="ky-game__actions">
                <a class="btn" href="/data/games/트릭스터 택틱스.zip">게임 다운로드</a>
                <a class="btn btn--soft" href="/data/트릭스터 택틱스 기술문서.pdf" target="_blank" rel="noopener">기술문서</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- ══ ③ Unity ══ -->
  <article class="ky-track" id="track-unity" style="--track:#6366f1">
    <div class="ky-track__head">
      <span class="ky-track__badge">U</span>
      <div>
        <h2>Unity <span>· 상용 엔진 콘텐츠</span></h2>
        <p class="ky-track__tag">엔진 워크플로우와 데이터·UI 중심 개발로의 전환</p>
      </div>
    </div>

    <div class="ky-track__grid">
      <div class="ky-learn">
        <h3 class="ky-col-title">학습한 내용</h3>
        <ul class="ky-learn__list">
          <li><b>엔진 기초</b><span>씬·프리팹·컴포넌트 구조와 라이프사이클 이해</span></li>
          <li><b>UI · 카메라</b><span>uGUI 기반 화면 설계와 카메라 제어</span></li>
          <li><b>데이터 관리</b><span>CSV 파일 기반 밸런스 데이터 관리·정규화</span></li>
          <li><b>상호작용</b><span>RayCast로 오브젝트 선택·클릭 처리, UI 디자인 연구</span></li>
          <li><b>게임 로직</b><span>턴제 전략·디펜스 규칙 구현</span></li>
        </ul>
        <div class="ky-tags">
          <span class="tag">Unity</span><span class="tag">uGUI</span><span class="tag">CSV DB</span>
          <span class="tag">RayCast</span><span class="tag">턴제</span><span class="tag">디펜스</span>
        </div>
      </div>

      <div>
        <h3 class="ky-col-title">제작한 게임</h3>
        <div class="ky-games">
          <div class="ky-game">
            <div class="ky-game__thumb">
              <img src="/assets/images/portfolio/리그레션 기술문서.png" alt="리그레션 썸네일" loading="lazy">
            </div>
            <div class="ky-game__body">
              <span class="ky-game__kind">팀 · 턴제 전략</span>
              <h4>리그레션</h4>
              <p>포스트 아포칼립스 세계에서 마을을 경영·성장시키는 보드게임 기반 턴제 전략. 데이터·UI 파트 담당.</p>
              <p class="ky-game__focus"><b>핵심 학습</b>CSV 데이터 관리·정규화 · uGUI 설계 · 카메라 제어</p>
              <div class="ky-game__actions">
                <a class="btn" href="/data/games/리그레션.zip">게임 다운로드</a>
                <a class="btn btn--soft" href="/data/리그레션 기술문서.pdf" target="_blank" rel="noopener">기술문서</a>
              </div>
            </div>
          </div>
          <div class="ky-game">
            <div class="ky-game__thumb">
              <img src="/assets/images/portfolio/덕덕 디펜스 기술문서.png" alt="덕덕 디펜스 썸네일" loading="lazy">
            </div>
            <div class="ky-game__body">
              <span class="ky-game__kind">개인 · 디펜스</span>
              <h4>덕덕 디펜스</h4>
              <p>명일방주를 모작한 오리 디펜스 게임.</p>
              <p class="ky-game__focus"><b>핵심 학습</b>RayCast 상호작용 · UI 디자인 연구</p>
              <div class="ky-game__actions">
                <a class="btn" href="/data/games/덕덕 디펜스.zip">게임 다운로드</a>
                <a class="btn btn--soft" href="/data/덕덕 디펜스 기술문서.pdf" target="_blank" rel="noopener">기술문서</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

</section>
