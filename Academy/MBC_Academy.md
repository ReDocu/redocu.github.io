---
layout : main
title : main
---

<style>
  .mbc-track-page {
    width: min(calc(100% - 32px), var(--container));
    margin: 0 auto;
    padding: 64px 0 96px;
  }

  /* ── 페이지 헤더 ── */
  .mbc-hero { max-width: 760px; }
  .mbc-hero .section-label {
    font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 10px;
  }
  .mbc-hero h1 { margin: 0; font-size: clamp(1.9rem, 3.4vw, 2.8rem); line-height: 1.15; }
  .mbc-hero__copy { margin: 16px 0 0; color: var(--muted); font-size: 1.03rem; }
  .mbc-jump { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
  .mbc-jump a {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 999px; font-weight: 700; font-size: 0.9rem;
    color: var(--text); background: var(--bg-soft); border: 1px solid var(--line);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .mbc-jump a:hover { transform: translateY(-2px); border-color: var(--track-c); }
  .mbc-jump a .dot { width: 9px; height: 9px; border-radius: 50%; }

  /* ── 트랙 ── */
  .mbc-track {
    margin-top: 40px; padding: 30px; border-radius: var(--radius);
    background: var(--bg-elev); border: 1px solid var(--line); box-shadow: var(--shadow);
    border-top: 4px solid var(--track);
    scroll-margin-top: 96px;
  }
  .mbc-track__head { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
  .mbc-track__badge {
    flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px;
    display: grid; place-items: center; font-weight: 800; font-size: 1.1rem;
    color: var(--track); background: color-mix(in srgb, var(--track) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--track) 35%, transparent);
  }
  .mbc-track__head h2 { margin: 0; font-size: 1.55rem; line-height: 1.2; }
  .mbc-track__head h2 span { color: var(--muted); font-size: 0.95rem; font-weight: 600; }
  .mbc-track__tag { margin: 4px 0 0; color: var(--muted); font-size: 0.95rem; }

  .mbc-track__grid {
    display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    gap: 28px; margin-top: 26px;
  }

  .mbc-col-title {
    display: flex; align-items: center; gap: 9px; margin: 0 0 14px;
    font-size: 0.82rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--text);
  }
  .mbc-col-title::before { content: ""; width: 6px; height: 16px; border-radius: 3px; background: var(--track); }

  /* ── 학습 요약 ── */
  .mbc-learn__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }
  .mbc-learn__list li { font-size: 0.95rem; }
  .mbc-learn__list li b { display: block; color: var(--text); font-weight: 700; margin-bottom: 2px; }
  .mbc-learn__list li span { color: var(--muted); }
  .mbc-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; }
  .mbc-tags .tag {
    font-size: 0.76rem; font-weight: 700; padding: 3px 10px; border-radius: 999px;
    color: var(--track); background: color-mix(in srgb, var(--track) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--track) 28%, transparent);
  }

  /* ── 제작 프로젝트 카드 ── */
  .mbc-projects { display: grid; gap: 16px; align-content: start; }
  .mbc-project {
    display: grid; grid-template-columns: 130px 1fr; gap: 16px;
    padding: 14px; border-radius: calc(var(--radius) - 2px);
    background: var(--bg-soft); border: 1px solid var(--line);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .mbc-project:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  .mbc-project__thumb {
    align-self: start;
    aspect-ratio: 4 / 3; border-radius: 8px; overflow: hidden; background: var(--bg-elev);
  }
  .mbc-project__thumb img { width: 100%; height: 100%; object-fit: cover; }
  .mbc-project__body { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .mbc-project__kind {
    align-self: flex-start; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em;
    padding: 2px 8px; border-radius: 6px; color: var(--muted); background: var(--bg-elev); border: 1px solid var(--line);
  }
  .mbc-project__body h4 { margin: 0; font-size: 1.05rem; line-height: 1.25; }
  .mbc-project__body p { margin: 0; font-size: 0.87rem; color: var(--muted); }
  .mbc-project__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 6px; }
  .mbc-project__actions .btn { min-height: 38px; padding: 8px 14px; font-size: 0.85rem; }
  .btn--soft {
    background: transparent; color: var(--text);
    border: 1px solid var(--line);
  }
  .btn--soft:hover { background: var(--bg-elev); transform: scale(1.02); }
  /* 프로젝트 설명의 핵심 학습 라인 */
  .mbc-project__focus { margin: 0; font-size: 0.83rem; color: var(--muted); line-height: 1.5; }
  .mbc-project__focus b {
    display: inline-block; margin-right: 6px; color: var(--track); font-weight: 800;
    font-size: 0.72rem; letter-spacing: 0.03em; text-transform: uppercase;
  }

  /* ── 반응형 ── */
  @media (max-width: 860px) {
    .mbc-track__grid { grid-template-columns: 1fr; gap: 24px; }
    .mbc-track { padding: 24px 20px; }
  }
  @media (max-width: 520px) {
    .mbc-project { grid-template-columns: 1fr; }
    .mbc-project__thumb { aspect-ratio: 16 / 9; }
  }
</style>

<section class="mbc-track-page" aria-label="MBC컴퓨터아카데미 과정별 학습 정리">

  <!-- ══ 페이지 헤더 ══ -->
  <header class="mbc-hero" style="--track-c:#38bdf8">
    <p class="section-label">MBC컴퓨터아카데미 · Python &amp; AI 과정</p>
    <h1>과정별 학습 &amp; 팀 프로젝트</h1>
    <p class="mbc-hero__copy">
      <strong>Python → 데이터 분석 → 머신러닝·딥러닝 → Object Detection 적용</strong> 순서로,
      각 단계에서 배운 핵심 개념과 그 결과물로 진행한 팀 프로젝트 정리.
    </p>
    <p class="mbc-hero__copy">각 프로젝트는 PDF와 학습문서로 확인할 수 있습니다.</p>
    <nav class="mbc-jump" aria-label="트랙 바로가기">
      <a href="#track-python"><span class="dot" style="background:#38bdf8"></span>Python</a>
      <a href="#track-data"><span class="dot" style="background:#10b981"></span>데이터 분석</a>
      <a href="#track-ml"><span class="dot" style="background:#8b5cf6"></span>머신러닝 · 딥러닝</a>
      <a href="#track-od"><span class="dot" style="background:#f59e0b"></span>Object Detection</a>
    </nav>
  </header>

  <!-- ══ ① Python ══ -->
  <article class="mbc-track" id="track-python" style="--track:#38bdf8">
    <div class="mbc-track__head">
      <span class="mbc-track__badge">Py</span>
      <div>
        <h2>Python <span>· 게임 프로그래밍</span></h2>
        <p class="mbc-track__tag">파이썬 문법을 게임 제작으로 익히는 첫 단계</p>
      </div>
    </div>

    <div class="mbc-track__grid">
      <!-- 학습 요약 -->
      <div class="mbc-learn">
        <h3 class="mbc-col-title">학습한 내용</h3>
        <ul class="mbc-learn__list">
          <li><b>파이썬 기초 문법</b><span>변수·자료형, 조건/반복문, 함수, 리스트·딕셔너리 활용</span></li>
          <li><b>pygame 게임 제작</b><span>게임 루프·이벤트 처리, 이미지 로드와 알파 처리</span></li>
          <li><b>게임 시스템 구현</b><span>딕셔너리 기반 파일(리소스) 관리, 오브젝트 풀링, 텍스트 애니메이션</span></li>
          <li><b>협업 방식</b><span>초기 구조를 잡고 기능을 점진적으로 추가하는 애자일 방식의 팀 개발</span></li>
        </ul>
        <div class="mbc-tags">
          <span class="tag">Python</span><span class="tag">pygame</span><span class="tag">오브젝트 풀링</span>
          <span class="tag">리소스 관리</span><span class="tag">팀 프로젝트</span>
        </div>
      </div>

      <!-- 제작 프로젝트 -->
      <div>
        <h3 class="mbc-col-title">제작한 프로젝트</h3>
        <div class="mbc-projects">
          <div class="mbc-project">
            <div class="mbc-project__thumb">
              <img src="/assets/images/portfolio/몬스터를 찾아서.png" alt="파이썬 슈팅게임 몬스터를 찾아서 썸네일" loading="lazy">
            </div>
            <div class="mbc-project__body">
              <span class="mbc-project__kind">팀 · 슈팅 게임</span>
              <h4>몬스터를 찾아서</h4>
              <p>Python으로 만든 종스크롤 비행 슈팅 게임. 팀원들이 가져온 이미지를 알파 처리해 게임에 적용할 수 있도록 구조를 설계했습니다.</p>
              <p class="mbc-project__focus"><b>핵심 학습</b>딕셔너리 파일 관리 · 오브젝트 풀링 · 텍스트 애니메이션</p>
              <div class="mbc-project__actions">
                <a class="btn" href="/Academy/MBCAcademy/파이썬 슈팅게임 - 몬스터를 찾아서.pdf" target="_blank" rel="noopener">PDF 보기</a>
                <a class="btn btn--soft" href="/Academy/MBCAcademy/몬스터를 찾아서_학습문서.html" target="_blank" rel="noopener">학습문서</a>
                <a class="btn btn--soft" href="/Academy/MBCAcademy/Shooting.zip" target="_blank" rel="noopener">게임다운로드</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- ══ ② 데이터 분석 ══ -->
  <article class="mbc-track" id="track-data" style="--track:#10b981">
    <div class="mbc-track__head">
      <span class="mbc-track__badge">DA</span>
      <div>
        <h2>데이터 분석 <span>· Pandas / NumPy</span></h2>
        <p class="mbc-track__tag">데이터를 모으고 다듬어 결론을 끌어내는 과정</p>
      </div>
    </div>

    <div class="mbc-track__grid">
      <div class="mbc-learn">
        <h3 class="mbc-col-title">학습한 내용</h3>
        <ul class="mbc-learn__list">
          <li><b>Pandas / NumPy</b><span>DataFrame 조작, 원하는 데이터 추출·집계</span></li>
          <li><b>데이터 수집</b><span>공공데이터 활용, 웹 사이트 크롤링으로 필요한 데이터 확보</span></li>
          <li><b>데이터 전처리</b><span>수집한 데이터를 분석 가능한 형태로 정제</span></li>
          <li><b>분석 도출</b><span>카테고리 분석을 통해 결과를 해석하고 결론 도출</span></li>
        </ul>
        <div class="mbc-tags">
          <span class="tag">Pandas</span><span class="tag">NumPy</span><span class="tag">크롤링</span>
          <span class="tag">공공데이터</span><span class="tag">전처리</span>
        </div>
      </div>

      <div>
        <h3 class="mbc-col-title">제작한 프로젝트</h3>
        <div class="mbc-projects">
          <div class="mbc-project">
            <div class="mbc-project__thumb">
              <img src="/assets/images/portfolio/카테고리 분석에 따른 여행지 추천.png" alt="카테고리 분석에 따른 여행지 추천 썸네일" loading="lazy">
            </div>
            <div class="mbc-project__body">
              <span class="mbc-project__kind">팀 · 데이터 분석</span>
              <h4>카테고리 분석에 따른 여행지 추천</h4>
              <p>공공데이터와 여행지 사이트 크롤링 데이터를 전처리·분석해 카테고리별 여행지를 추천하는 여행 가이드 프로젝트.</p>
              <p class="mbc-project__focus"><b>핵심 학습</b>데이터 크롤링 · 전처리 · 분석 도출</p>
              <div class="mbc-project__actions">
                <a class="btn" href="/Academy/MBCAcademy/카테고리 분석에 따른 여행지 추천.pdf" target="_blank" rel="noopener">PDF 보기</a>
                <a class="btn btn--soft" href="/Academy/MBCAcademy/여행지 추천_학습문서.html" target="_blank" rel="noopener">학습문서</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- ══ ③ 머신러닝 · 딥러닝 ══ -->
  <article class="mbc-track" id="track-ml" style="--track:#8b5cf6">
    <div class="mbc-track__head">
      <span class="mbc-track__badge">AI</span>
      <div>
        <h2>머신러닝 · 딥러닝 <span>· 모델 만들기</span></h2>
        <p class="mbc-track__tag">지도 학습(이미지 분류)과 비지도 학습으로 직접 모델을 만들고 검증</p>
      </div>
    </div>

    <div class="mbc-track__grid">
      <div class="mbc-learn">
        <h3 class="mbc-col-title">학습한 내용</h3>
        <ul class="mbc-learn__list">
          <li><b>지도 학습 · 이미지 분류</b><span>CNN 알고리즘의 구조 이해, 뉴럴 네트워크 구성과 sigmoid 활성화</span></li>
          <li><b>데이터 증강</b><span>이미지 크기 변형·자르기로 데이터를 증폭해 학습 품질 개선</span></li>
          <li><b>비지도 학습 · 예측 모델</b><span>EDA와 전처리(이상치 제거, 원-핫 인코딩, 데이터 분리, 정규화)</span></li>
          <li><b>모델 평가·튜닝</b><span>학습 결과를 그래프로 검증, 회귀 모델 평가와 하이퍼파라미터 튜닝</span></li>
        </ul>
        <div class="mbc-tags">
          <span class="tag">TensorFlow</span><span class="tag">CNN</span><span class="tag">데이터 증강</span>
          <span class="tag">EDA</span><span class="tag">하이퍼파라미터</span>
        </div>
      </div>

      <div>
        <h3 class="mbc-col-title">제작한 프로젝트</h3>
        <div class="mbc-projects">
          <div class="mbc-project">
            <div class="mbc-project__thumb">
              <img src="/assets/images/portfolio/늑대vs허스키 CNN 알고리즘 분석 테스트.png" alt="늑대 vs 허스키 이미지 분류 썸네일" loading="lazy">
            </div>
            <div class="mbc-project__body">
              <span class="mbc-project__kind">팀 · 지도 학습</span>
              <h4>늑대 vs 허스키</h4>
              <p>직접 크롤링한 이미지로 CNN 분류 모델을 구성해 늑대와 허스키를 구분. 학습 결과를 그래프로 검증했습니다.</p>
              <p class="mbc-project__focus"><b>핵심 학습</b>CNN 모델 구성 · 학습 검증 · 데이터 증강</p>
              <div class="mbc-project__actions">
                <a class="btn" href="/Academy/MBCAcademy/늑대vs허스키 CNN 알고리즘 분석 테스트.pdf" target="_blank" rel="noopener">PDF 보기</a>
                <a class="btn btn--soft" href="/Academy/MBCAcademy/늑대vs허스키_학습문서.html" target="_blank" rel="noopener">학습문서</a>
              </div>
            </div>
          </div>
          <div class="mbc-project">
            <div class="mbc-project__thumb">
              <img src="/assets/images/portfolio/스팀의 세일 할인가격 예측.png" alt="스팀 세일 할인가격 예측 썸네일" loading="lazy">
            </div>
            <div class="mbc-project__body">
              <span class="mbc-project__kind">팀 · 비지도 학습</span>
              <h4>스팀 가격 예측하기</h4>
              <p>스팀 데이터를 EDA·전처리한 뒤 세일 할인가격을 예측하는 모델을 만들고, 모델 평가와 튜닝까지 진행했습니다.</p>
              <p class="mbc-project__focus"><b>핵심 학습</b>EDA·전처리 · 모델 평가 · 하이퍼파라미터 튜닝</p>
              <div class="mbc-project__actions">
                <a class="btn" href="/Academy/MBCAcademy/스팀의 세일 할인가격 예측.pdf" target="_blank" rel="noopener">PDF 보기</a>
                <a class="btn btn--soft" href="/Academy/MBCAcademy/스팀 가격 예측_학습문서.html" target="_blank" rel="noopener">학습문서</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- ══ ④ Object Detection ══ -->
  <article class="mbc-track" id="track-od" style="--track:#f59e0b">
    <div class="mbc-track__head">
      <span class="mbc-track__badge">OD</span>
      <div>
        <h2>Object Detection <span>· 라벨링부터 CCTV 적용까지</span></h2>
        <p class="mbc-track__tag">데이터 라벨링을 직접 경험하고, 학습시킨 모델을 실시간 CCTV 웹 서비스로 배포</p>
      </div>
    </div>

    <div class="mbc-track__grid">
      <div class="mbc-learn">
        <h3 class="mbc-col-title">학습한 내용</h3>
        <ul class="mbc-learn__list">
          <li><b>데이터 라벨링 경험 ①</b><span>Object Detection 학습용 데이터 라벨링 — 손흥민 추적하기</span></li>
          <li><b>데이터 라벨링 경험 ②</b><span>다중 대상 라벨링 — 르브론 제임스 · 스테판 커리 추적하기</span></li>
          <li><b>모델 적용·배포</b><span>라벨링한 데이터로 학습시킨 모델을 파일 포맷에 맞게 적용, 탐지 대상 동적 교체</span></li>
          <li><b>웹 서비스 제작</b><span>Flask로 로그인·게시판·댓글·좋아요를 갖춘 SNS 웹사이트 개발, 서버-클라이언트 구조 이해</span></li>
        </ul>
        <div class="mbc-tags">
          <span class="tag">Object Detection</span><span class="tag">데이터 라벨링</span><span class="tag">Flask</span>
          <span class="tag">라즈베리파이</span><span class="tag">실시간 탐지</span>
        </div>
      </div>

      <div>
        <h3 class="mbc-col-title">제작한 프로젝트</h3>
        <div class="mbc-projects">
          <div class="mbc-project">
            <div class="mbc-project__thumb">
              <img src="/assets/images/portfolio/인공지능모델적용웹사이트제작.png" alt="인공지능 모델 적용 웹사이트 제작 썸네일" loading="lazy">
            </div>
            <div class="mbc-project__body">
              <span class="mbc-project__kind">팀 · 최종 프로젝트</span>
              <h4>인공지능 모델 적용 웹사이트 (CCTV)</h4>
              <p>라즈베리파이 웹캠(CCTV)으로 실시간 객체 탐지를 하는 웹사이트. 라벨링해 학습시킨 모델을 적용하고, 원할 때마다 모델을 바꿔 탐지 대상을 동적으로 변경할 수 있습니다.</p>
              <p class="mbc-project__focus"><b>핵심 학습</b>Flask 웹 개발 · 모델 파일 포맷 적용 · 실시간 객체 탐지</p>
              <div class="mbc-project__actions">
                <a class="btn" href="/Academy/MBCAcademy/인공지능모델적용웹사이트제작.pdf" target="_blank" rel="noopener">PDF 보기</a>
                <a class="btn btn--soft" href="/Academy/MBCAcademy/CCTV 모델 적용_학습문서.html" target="_blank" rel="noopener">학습문서</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

</section>
