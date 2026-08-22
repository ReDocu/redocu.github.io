---
layout : main
title : main
---

<style>
  .cc-track-page {
    width: min(calc(100% - 32px), var(--container));
    margin: 0 auto;
    padding: 64px 0 96px;
  }

  /* ── 페이지 헤더 ── */
  .cc-hero { max-width: 760px; }
  .cc-hero .section-label {
    font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 10px;
  }
  .cc-hero h1 { margin: 0; font-size: clamp(1.9rem, 3.4vw, 2.8rem); line-height: 1.15; }
  .cc-hero__copy { margin: 16px 0 0; color: var(--muted); font-size: 1.03rem; }
  .cc-jump { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
  .cc-jump a {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 999px; font-weight: 700; font-size: 0.9rem;
    color: var(--text); background: var(--bg-soft); border: 1px solid var(--line);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .cc-jump a:hover { transform: translateY(-2px); border-color: var(--track-c); }
  .cc-jump a .dot { width: 9px; height: 9px; border-radius: 50%; }

  /* ── 트랙 ── */
  .cc-track {
    margin-top: 40px; padding: 30px; border-radius: var(--radius);
    background: var(--bg-elev); border: 1px solid var(--line); box-shadow: var(--shadow);
    border-top: 4px solid var(--track);
    scroll-margin-top: 96px;
  }
  .cc-track__head { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
  .cc-track__badge {
    flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px;
    display: grid; place-items: center; font-weight: 800; font-size: 1.1rem;
    color: var(--track); background: color-mix(in srgb, var(--track) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--track) 35%, transparent);
  }
  .cc-track__head h2 { margin: 0; font-size: 1.55rem; line-height: 1.2; }
  .cc-track__head h2 span { color: var(--muted); font-size: 0.95rem; font-weight: 600; }
  .cc-track__tag { margin: 4px 0 0; color: var(--muted); font-size: 0.95rem; }

  .cc-track__grid {
    display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    gap: 28px; margin-top: 26px; align-items: start;
  }

  .cc-track__summary { margin: 0; color: var(--muted); font-size: 0.95rem; line-height: 1.7; }
  .cc-track__summary b { color: var(--text); }
  .cc-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 16px; }
  .cc-tags .tag {
    font-size: 0.76rem; font-weight: 700; padding: 3px 10px; border-radius: 999px;
    color: var(--track); background: color-mix(in srgb, var(--track) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--track) 28%, transparent);
  }
  /* 과정을 관통하는 한마디 */
  .cc-motto {
    margin: 16px 0 0; padding: 12px 16px; border-radius: 10px; font-size: 0.88rem;
    color: var(--muted); background: color-mix(in srgb, var(--track) 8%, transparent);
    border-left: 3px solid var(--track);
  }
  .cc-motto b { color: var(--track); }

  /* ── 결과물 카드 ── */
  .cc-project {
    display: grid; grid-template-columns: 130px 1fr; gap: 16px;
    padding: 14px; border-radius: calc(var(--radius) - 2px);
    background: var(--bg-soft); border: 1px solid var(--line);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .cc-project:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  .cc-project__thumb {
    align-self: start;
    aspect-ratio: 4 / 3; border-radius: 8px; overflow: hidden;
    display: grid; place-items: center; text-align: center;
    background: color-mix(in srgb, var(--track) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--track) 25%, transparent);
    color: var(--track); font-weight: 800; font-size: 1.5rem; letter-spacing: 0.02em;
  }
  .cc-project__thumb small { display: block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; opacity: 0.8; }
  .cc-project__body { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .cc-project__kind {
    align-self: flex-start; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em;
    padding: 2px 8px; border-radius: 6px; color: var(--muted); background: var(--bg-elev); border: 1px solid var(--line);
  }
  .cc-project__body h4 { margin: 0; font-size: 1.05rem; line-height: 1.25; }
  .cc-project__body p { margin: 0; font-size: 0.87rem; color: var(--muted); }
  .cc-project__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 6px; }
  .cc-project__actions .btn { min-height: 38px; padding: 8px 14px; font-size: 0.85rem; }
  .btn--soft {
    background: transparent; color: var(--text);
    border: 1px solid var(--line);
  }
  .btn--soft:hover { background: var(--bg-elev); transform: scale(1.02); }

  /* ── 반응형 ── */
  @media (max-width: 860px) {
    .cc-track__grid { grid-template-columns: 1fr; gap: 24px; }
    .cc-track { padding: 24px 20px; }
  }
  @media (max-width: 520px) {
    .cc-project { grid-template-columns: 1fr; }
    .cc-project__thumb { aspect-ratio: 16 / 9; }
  }
</style>

<section class="cc-track-page" aria-label="코드캠프 새싹 클로드코드 과정 학습 정리">
  <!-- ══ 페이지 헤더 ══ -->
  <header class="cc-hero" style="--track-c:#10b981">
    <p class="section-label">코드캠프(딩코) · 새싹 클로드코드 과정 · 2026-06-29 ~ 2026-09-11</p>
    <h1>Part별 학습 &amp; 결과물</h1>
    <p class="cc-hero__copy">
      <strong>문서(PRD) 먼저, 코드는 그다음.</strong> 혼자 만들고 배포하는 기본기(Part 1)에서
      실무형 협업 구조(Part 2), 내 서비스 MVP 출시(Part 3), 그리고 결제의 전 생애(Part 4)까지
      확장하는 웹 기반 바이브 코딩 커리큘럼. 자세한 내용은 각 Part의 학습 로드맵에서 확인할 수 있습니다.
    </p>
    <nav class="cc-jump" aria-label="Part 바로가기">
      <a href="#part-1"><span class="dot" style="background:#10b981"></span>Part 1 · 소개 페이지</a>
      <a href="#part-2"><span class="dot" style="background:#8b5cf6"></span>Part 2 · 미니 노션</a>
      <a href="#part-3"><span class="dot" style="background:#4F7A3D"></span>Part 3 · 맛집커뮤니티</a>
      <a href="#part-4"><span class="dot" style="background:#D0961F"></span>Part 4 · 결제 얹기</a>
    </nav>
  </header>

  <!-- ══ ① Part 1 ══ -->
  <article class="cc-track" id="part-1" style="--track:#10b981">
    <div class="cc-track__head">
      <span class="cc-track__badge">P1</span>
      <div>
        <h2>Part 1 <span>· 혼자서 만들고, 세상에 띄우기 (Day 1–5)</span></h2>
        <p class="cc-track__tag">PRD → 웹의 구조 → 클로드코드 다루기 → Supabase·MCP → 배포</p>
      </div>
    </div>
    <div class="cc-track__grid">
      <div>
        <p class="cc-track__summary">
          아이디어를 <b>PRD 문서로 먼저</b> 정리하고, 클로드코드로 소개 페이지를 만들어
          Supabase·MCP를 연결한 뒤 <b>Git·GitHub·Vercel로 실제 인터넷 주소에 배포</b>했습니다.
        </p>
        <div class="cc-tags">
          <span class="tag">Claude Code</span><span class="tag">PRD</span><span class="tag">Supabase</span>
          <span class="tag">MCP</span><span class="tag">Git · GitHub</span><span class="tag">Vercel</span>
        </div>
        <p class="cc-motto">한 문장 — <b>"문서 먼저, 코드는 그다음. 비밀(.env)은 저장소 밖에."</b></p>
      </div>
      <div class="cc-project">
        <div class="cc-project__thumb"><span>P1<small>INTRO PAGE</small></span></div>
        <div class="cc-project__body">
          <span class="cc-project__kind">개인 · 웹 페이지</span>
          <h4>소개 페이지</h4>
          <p>PRD에서 시작해 실제 인터넷 주소로 배포까지 완주한 자기소개 페이지.</p>
          <div class="cc-project__actions">
            <a class="btn" href="/Academy/CodeCampAcademy/part1_IntroducePage/intro.html" target="_blank" rel="noopener">체험하기</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part1_IntroducePage/01-part1-guide.html" target="_blank" rel="noopener">학습 로드맵</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part1_IntroducePage/클로드코드_Part_1.pdf" target="_blank" rel="noopener">E-Book</a>
          </div>
        </div>
      </div>
    </div>
  </article>
  <!-- ══ ② Part 2 ══ -->
  <article class="cc-track" id="part-2" style="--track:#8b5cf6">
    <div class="cc-track__head">
      <span class="cc-track__badge">P2</span>
      <div>
        <h2>Part 2 <span>· 팀처럼, 통제하며, 지키면서 만들기 (Day 6–15)</span></h2>
        <p class="cc-track__tag">기획(PM-Skills) → 디자인(클로드 디자인) → 개발(하네스 엔지니어링) 핸드오프</p>
      </div>
    </div>
    <div class="cc-track__grid">
      <div>
        <p class="cc-track__summary">
          기획 → 디자인 → 개발을 <b>핸드오프로 잇는 역할 분리형 구조</b>로 미니 노션 웹서비스를 만들었습니다.
          UUID 기반 DB 설계, 구글로그인, <b>훅스 안전장치와 Git 워크트리 병렬 구현</b>, 이미지 스토리지까지 확장.
        </p>
        <div class="cc-tags">
          <span class="tag">PM-Skills</span><span class="tag">Claude Design</span><span class="tag">정규화 · UUID</span>
          <span class="tag">TDD · SDD</span><span class="tag">OAuth · JWT</span><span class="tag">Hooks</span>
          <span class="tag">워크트리</span><span class="tag">Storage</span>
        </div>
        <p class="cc-motto">한 문장 — <b>"모델의 선의에 의존하지 말고, 구조로 강제하라."</b></p>
      </div>
      <div class="cc-project">
        <div class="cc-project__thumb"><span>P2<small>MINI NOTION</small></span></div>
        <div class="cc-project__body">
          <span class="cc-project__kind">개인 · 웹 서비스</span>
          <h4>미니 노션</h4>
          <p>핸드오프로 만든 노션형 웹서비스. 구글로그인과 이미지 업로드까지 동작합니다.</p>
          <div class="cc-project__actions">
            <a class="btn" href="/Academy/CodeCampAcademy/part2_MiniNotion/02-mini-notion.html" target="_blank" rel="noopener">체험하기</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part2_MiniNotion/02-part2-guide.html" target="_blank" rel="noopener">학습 로드맵</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part2_MiniNotion/클로드코드_Part_2.pdf" target="_blank" rel="noopener">E-Book</a>
          </div>
        </div>
      </div>
    </div>
  </article>
  <!-- ══ ③ Part 3 ══ -->
  <article class="cc-track" id="part-3" style="--track:#4F7A3D">
    <div class="cc-track__head">
      <span class="cc-track__badge">P3</span>
      <div>
        <h2>Part 3 <span>· 내 서비스를, 시스템으로 만들어, 세상에 내놓기 (Day 17–29)</span></h2>
        <p class="cc-track__tag">PRD → 디자인 시스템 → 컴포넌트·스토리북 핸드오프 → DB·BFF → 네이버 API → 배포·도메인·PWA</p>
      </div>
    </div>
    <div class="cc-track__grid">
      <div>
        <p class="cc-track__summary">
          솔로프리너의 기획(PRD)에서 시작해 <b>디자인 토큰 → UI 컴포넌트 23종 → 스토리북 SSOT 핸드오프</b>로 시스템을 쌓고,
          정규화 DB와 <b>BFF</b> 위에 네이버 검색/지도 API를 연동해 <b>도메인·로고·PWA로 출시</b>까지 완주했습니다.
        </p>
        <div class="cc-tags">
          <span class="tag">솔로프리너</span><span class="tag">디자인 토큰</span><span class="tag">UI 컴포넌트 23종</span>
          <span class="tag">스토리북 · SSOT</span><span class="tag">DB 정규화</span><span class="tag">BFF</span>
          <span class="tag">네이버 검색/지도 API</span><span class="tag">배포 · 도메인</span><span class="tag">PWA</span>
        </div>
        <p class="cc-motto">한 문장 — <b>"구현이 아니라 수정이 문제다. 컴포넌트는 복사가 아니라 연결이다."</b></p>
      </div>
      <div class="cc-project">
        <div class="cc-project__thumb"><span>P3<small>FOOD COMMUNITY</small></span></div>
        <div class="cc-project__body">
          <span class="cc-project__kind">개인 · 모바일 MVP</span>
          <h4>맛집커뮤니티</h4>
          <p>360 반응형 화면 8장과 디자인 시스템으로 이루어진 맛집커뮤니티 MVP 목업.</p>
          <div class="cc-project__actions">
            <a class="btn" href="/Academy/CodeCampAcademy/part3_FoodCommunity/03-food-community.html" target="_blank" rel="noopener">체험하기</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part3_FoodCommunity/03-part3-guide.html" target="_blank" rel="noopener">학습 로드맵</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part3_FoodCommunity/03-design-system.html" target="_blank" rel="noopener">디자인 시스템</a>
          </div>
        </div>
      </div>
    </div>
  </article>
  <!-- ══ ④ Part 4 ══ -->
  <article class="cc-track" id="part-4" style="--track:#D0961F">
    <div class="cc-track__head">
      <span class="cc-track__badge">P4</span>
      <div>
        <h2>Part 4 <span>· 다 만든 제품에 결제를 얹기 (Day 30–34)</span></h2>
        <p class="cc-track__tag">PRD 업데이트 → 카피·CTA 배너 → 정산·결제 링크 → insert-only 원장 → 포트원 · 웹훅</p>
      </div>
    </div>
    <div class="cc-track__grid">
      <div>
        <p class="cc-track__summary">
          Part 3에서 출시한 맛집커뮤니티에 <b>결제의 전 생애</b>를 얹었습니다.
          PRD 3단계 업데이트와 카피·CTA 배너로 팔 준비를 하고, <b>insert-only 원장</b>(취소 = 음수 행 · 스냅샷 · 트랜잭션키) 위에
          포트원을 실연동해 <b>웹훅 → 내역 조회 → 취소 → 취소 웹훅</b>까지 완성했습니다.
        </p>
        <div class="cc-tags">
          <span class="tag">PRD 업데이트</span><span class="tag">카피 · CTA</span><span class="tag">정산</span>
          <span class="tag">insert-only 원장</span><span class="tag">결제스냅샷</span><span class="tag">트랜잭션키</span>
          <span class="tag">PortoneMCP</span><span class="tag">웹훅</span><span class="tag">결제 SSOT</span>
        </div>
        <p class="cc-motto">한 문장 — <b>"결제 데이터는 고치지 않고 쌓는다. 그리고 웹훅은 localhost에 오지 않는다."</b></p>
      </div>
      <div class="cc-project">
        <div class="cc-project__thumb"><span>P4<small>PAYMENT</small></span></div>
        <div class="cc-project__body">
          <span class="cc-project__kind">개인 · 결제 확장</span>
          <h4>맛집커뮤니티 어드밴스</h4>
          <p>한 상품이 배너부터 취소 내역까지 5화면을 관통하는 결제 플로우 목업.</p>
          <div class="cc-project__actions">
            <a class="btn" href="/Academy/CodeCampAcademy/part4_food_community_advance/04-food-payment.html" target="_blank" rel="noopener">체험하기</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part4_food_community_advance/04-part4-guide.html" target="_blank" rel="noopener">학습 로드맵</a>
            <a class="btn btn--soft" href="/Academy/CodeCampAcademy/part4_food_community_advance/04-payment-ledger.html" target="_blank" rel="noopener">원장 시뮬레이터</a>
          </div>
        </div>
      </div>
    </div>
  </article>
</section>
