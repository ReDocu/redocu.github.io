---
layout : main
title : Project Dashboard
---

<style>
  .dash-page {
    width: min(calc(100% - 32px), var(--container));
    margin: 0 auto;
    padding: 64px 0 96px;
  }

  /* ── 페이지 헤더 ── */
  .dash-hero .section-label {
    font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 10px;
  }
  .dash-hero h1 { margin: 0; font-size: clamp(1.9rem, 3.4vw, 2.6rem); line-height: 1.15; }
  .dash-hero__copy { margin: 14px 0 0; color: var(--muted); font-size: 1.02rem; }

  /* ── 요약 타일 ── */
  .dash-stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
    margin: 28px 0 40px;
  }
  .dash-stat {
    padding: 18px 20px; background: var(--bg-elev);
    border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow);
  }
  .dash-stat strong { display: block; font-size: 1.8rem; line-height: 1.2; }
  .dash-stat span { color: var(--muted); font-size: 0.9rem; font-weight: 600; }

  /* ── 섹션/테이블 ── */
  .dash-section { margin-top: 36px; }
  .dash-section h2 { margin: 0 0 14px; font-size: 1.25rem; }
  .dash-table-wrap {
    overflow-x: auto; background: var(--bg-elev);
    border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow);
  }
  table.dash-table { width: 100%; border-collapse: collapse; min-width: 640px; }
  .dash-table th, .dash-table td {
    padding: 13px 16px; text-align: left; vertical-align: middle;
    border-bottom: 1px solid var(--line); font-size: 0.95rem;
  }
  .dash-table thead th {
    color: var(--muted); font-size: 0.82rem; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase; background: var(--bg-soft);
  }
  .dash-table tbody tr:last-child td { border-bottom: 0; }
  .dash-table .name { font-weight: 700; white-space: nowrap; }
  .dash-table .desc { color: var(--muted); font-size: 0.88rem; margin-top: 3px; }
  .dash-table a { font-weight: 600; }

  /* ── 상태 배지 ── */
  .st {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 999px;
    font-size: 0.82rem; font-weight: 700; white-space: nowrap;
  }
  .st::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .st--live { color: #12805c; background: rgba(18, 128, 92, 0.12); }
  .st--wip  { color: #b45309; background: rgba(180, 83, 9, 0.12); }
  .st--done { color: #2563eb; background: rgba(37, 99, 235, 0.12); }
  body.dark-mode .st--live { color: #54d49d; background: rgba(84, 212, 157, 0.14); }
  body.dark-mode .st--wip  { color: #fbbf24; background: rgba(251, 191, 36, 0.14); }
  body.dark-mode .st--done { color: #7bb0ff; background: rgba(123, 176, 255, 0.14); }

  .dash-note { margin: 18px 4px 0; color: var(--muted); font-size: 0.85rem; }

  @media (max-width: 900px) {
    .dash-stats { grid-template-columns: repeat(2, 1fr); }
  }
</style>

<div class="dash-page">
  <header class="dash-hero">
    <p class="section-label">Project Dashboard</p>
    <h1>프로젝트 현황판</h1>
    <p class="dash-hero__copy">이 사이트에 등록된 프로젝트의 저장소와 진행 상태를 한 화면에서 확인합니다.</p>
  </header>

  <div class="dash-stats">
    <div class="dash-stat"><strong>15</strong><span>전체 프로젝트</span></div>
    <div class="dash-stat"><strong>4</strong><span>운영 · 배포</span></div>
    <div class="dash-stat"><strong>8</strong><span>개발 · 진행중</span></div>
    <div class="dash-stat"><strong>3</strong><span>완료</span></div>
  </div>

  <section class="dash-section">
    <h2>소프트웨어</h2>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead>
          <tr><th>프로젝트</th><th>상태</th><th>GitHub</th><th>바로가기</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><div class="name">가상 이력서 시뮬레이션</div><div class="desc">가상 인물의 이력서 생성·평가 시뮬레이션 · 개인 프로젝트</div></td>
            <td><span class="st st--wip">개발중</span></td>
            <td><a href="https://github.com/ReDocu/ResumeAnalyze" target="_blank" rel="noopener">ReDocu/ResumeAnalyze</a></td>
            <td>—</td>
          </tr>
          <tr>
            <td><div class="name">소프트웨어 자동화 툴</div><div class="desc">반복 작업 과정을 자동화하는 툴 프로그램 · 개인 프로젝트</div></td>
            <td><span class="st st--wip">개발중</span></td>
            <td><a href="https://github.com/ReDocu/ProcessingAuto" target="_blank" rel="noopener">ReDocu/ProcessingAuto</a></td>
            <td>—</td>
          </tr>
          <tr>
            <td><div class="name">에셋 및 데이터 관리자</div><div class="desc">프로젝트 에셋·데이터 통합 관리 도구 · 개인 프로젝트</div></td>
            <td><span class="st st--wip">개발중</span></td>
            <td><a href="https://github.com/ReDocu/AssetManager" target="_blank" rel="noopener">ReDocu/AssetManager</a></td>
            <td>—</td>
          </tr>
          <tr>
            <td><div class="name">사전 프로젝트</div><div class="desc">용어·지식을 정리하고 검색하는 사전 서비스 · 개인 프로젝트</div></td>
            <td><span class="st st--wip">개발중</span></td>
            <td><a href="https://github.com/ReDocu/DictionaryProject" target="_blank" rel="noopener">ReDocu/DictionaryProject</a></td>
            <td>—</td>
          </tr>
          <tr>
            <td><div class="name">ClaudeCockpit</div><div class="desc">Claude Code 세션 관리·모니터링 로컬 대시보드</div></td>
            <td><span class="st st--live">v0.3 배포</span></td>
            <td><a href="https://github.com/ReDocu/ClaudeCodeTemplate" target="_blank" rel="noopener">ReDocu/ClaudeCodeTemplate</a></td>
            <td><a href="/project/ClaudeCockpit/Tech_document.html" target="_blank" rel="noopener">기술문서</a></td>
          </tr>
          <tr>
            <td><div class="name">지식 나눔터</div><div class="desc">문서·게시판·노트·일정·채팅 통합 지식 공유 공간</div></td>
            <td><span class="st st--live">운영중</span></td>
            <td><a href="https://github.com/ReDocu/CompanyProcess" target="_blank" rel="noopener">ReDocu/CompanyProcess</a></td>
            <td><a href="https://company-process.vercel.app/" target="_blank" rel="noopener">서비스 방문</a></td>
          </tr>
          <tr>
            <td><div class="name">EduCraft</div><div class="desc">책 제작·학습 관리·강의 리뷰·미니게임 네 공방을 묶은 학습 플랫폼</div></td>
            <td><span class="st st--live">운영중</span></td>
            <td><a href="https://github.com/ReDocu/EduCraft" target="_blank" rel="noopener">ReDocu/EduCraft</a></td>
            <td><a href="http://www.eqment.store/" target="_blank" rel="noopener">서비스 방문</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dash-section">
    <h2>게임 소프트웨어</h2>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead>
          <tr><th>프로젝트</th><th>상태</th><th>GitHub</th><th>바로가기</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><div class="name">CSGP</div><div class="desc">Win32 API 기반 C++ 콘솔 게임 프레임워크 · 콘솔 게임 9종</div></td>
            <td><span class="st st--done">완료</span></td>
            <td><a href="https://github.com/ReDocu/CSGPProject" target="_blank" rel="noopener">ReDocu/CSGPProject</a></td>
            <td><a href="/project/CSGP/study_doc/index.html" target="_blank" rel="noopener">학습문서</a></td>
          </tr>
          <tr>
            <td><div class="name">게임 개발 운영 툴</div><div class="desc">게임 개발·라이브 운영 자동화 툴 · 개인 프로젝트</div></td>
            <td><span class="st st--wip">개발중</span></td>
            <td><a href="https://github.com/ReDocu/GameDevAuto" target="_blank" rel="noopener">ReDocu/GameDevAuto</a></td>
            <td>—</td>
          </tr>
          <tr>
            <td><div class="name">동물 수호대</div><div class="desc">동물들을 지켜내는 디펜스 게임 · 개인 프로젝트</div></td>
            <td><span class="st st--wip">개발중</span></td>
            <td><a href="https://github.com/ReDocu/AnimalDeffence" target="_blank" rel="noopener">ReDocu/AnimalDeffence</a></td>
            <td>—</td>
          </tr>
          <tr>
            <td><div class="name">학원 운영 시뮬레이션</div><div class="desc">커리큘럼·수강생을 관리하는 경영 시뮬레이션 · 팀 프로젝트</div></td>
            <td><span class="st st--wip">개발중</span></td>
            <td><a href="https://github.com/ReDocu/Project_Academy_Ops" target="_blank" rel="noopener">ReDocu/Project_Academy_Ops</a></td>
            <td>—</td>
          </tr>
          <tr>
            <td><div class="name">Puzzle Lab</div><div class="desc">스도쿠·가쿠로 통합 퍼즐 생성기 · 인쇄 지원 웹 게임</div></td>
            <td><span class="st st--done">완료</span></td>
            <td><a href="https://github.com/ReDocu/redocu.github.io" target="_blank" rel="noopener">ReDocu/redocu.github.io</a></td>
            <td><a href="/web_page/PuzzleLab/index.html" target="_blank" rel="noopener">플레이</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="dash-section">
    <h2>교육 과정 저장소</h2>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead>
          <tr><th>과정</th><th>상태</th><th>GitHub</th><th>바로가기</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><div class="name">경일게임아카데미</div><div class="desc">게임 클라이언트/콘텐츠 개발 커리큘럼 (2019-09 ~ 2020-03)</div></td>
            <td><span class="st st--done">수료</span></td>
            <td><a href="https://github.com/ReDocu/KYGameAcademy" target="_blank" rel="noopener">ReDocu/KYGameAcademy</a></td>
            <td><a href="/Academy/KYGameAcademy/학습정리.html" target="_blank" rel="noopener">학습문서</a></td>
          </tr>
          <tr>
            <td><div class="name">MBC컴퓨터아카데미</div><div class="desc">비전 기반 AI 모델 생성 커리큘럼 (2023-09 ~ 2024-05)</div></td>
            <td><span class="st st--done">수료</span></td>
            <td>—</td>
            <td><a href="/Academy/MBCAcademy/학습정리.html" target="_blank" rel="noopener">학습문서</a></td>
          </tr>
          <tr>
            <td><div class="name">코드캠프(딩코)</div><div class="desc">웹 기반 바이브 코딩 커리큘럼 (2026-06 ~ 2026-09)</div></td>
            <td><span class="st st--wip">진행중</span></td>
            <td><a href="https://github.com/ReDocu/Sesac_CC_ClaudeCode" target="_blank" rel="noopener">ReDocu/Sesac_CC_ClaudeCode</a></td>
            <td><a href="/Academy/CodeCamp_Academy" target="_blank" rel="noopener">체험하기</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <p class="dash-note">상태는 수동으로 관리됩니다 — 프로젝트 상태가 바뀌면 이 문서(project/Dashboard.md)를 갱신해 주세요.</p>
</div>
