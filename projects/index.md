---
layout: main
title: 프로젝트 현황판
description: 이 사이트에 등록된 프로젝트의 저장소와 진행 상태를 한 화면에서 확인합니다.
css: [project]
# 상태: active | complete | dev | progress (PRD 4.3). slug가 있으면 상태는 _data/projects.yml을 따르고 이름이 상세로 링크된다.
groups:
  - title: 소프트웨어
    head: PROJECT
    rows:
      - { name: 가상 이력서 시뮬레이션, slug: resume-sim, desc: 이력서로 성향 근접도를 계산해 팀 배치를 시뮬레이션 · 개인 프로젝트, note: 완료, repo: ReDocu/ResumeAnalyze, link: { label: 기술문서, url: /projects/resume-sim/tech-doc.html } }
      - { name: 소프트웨어 자동화 툴, desc: 반복 작업 과정을 자동화하는 툴 프로그램 · 개인 프로젝트, status: dev, note: 개발중, repo: ReDocu/ProcessingAuto }
      - { name: 에셋 및 데이터 관리자, desc: 프로젝트 에셋·데이터 통합 관리 도구 · 개인 프로젝트, status: dev, note: 개발중, repo: ReDocu/AssetManager }
      - { name: 사전 프로젝트, desc: 용어·지식을 정리하고 검색하는 사전 서비스 · 개인 프로젝트, status: dev, note: 개발중, repo: ReDocu/DictionaryProject }
      - { name: 팀 워크스페이스, slug: team-workspace, desc: 메뉴얼·간트·일일 업데이트·게시판·채팅·참조 자료를 모은 팀 운영 허브, note: 사용중, link: { label: 서비스 방문, url: "https://team-workspace-zeta.vercel.app" } }
      - { name: ClaudeCockpit, slug: claude-cockpit, desc: Claude Code 세션 관리·모니터링 로컬 대시보드, note: v0.3 배포, repo: ReDocu/ClaudeCodeTemplate, link: { label: 기술문서, url: /projects/claude-cockpit/tech-doc.html } }
      - { name: 지식 나눔터, desc: 문서·게시판·노트·일정·채팅 통합 지식 공유 공간, status: active, note: 운영중, repo: ReDocu/CompanyProcess, link: { label: 서비스 방문, url: "https://company-process.vercel.app/" } }
      - { name: EduCraft, slug: educraft, desc: BookCraft · LMSCraft · LecView · 미니게임 학습 플랫폼, note: 운영중, repo: ReDocu/EduCraft, link: { label: 서비스 방문, url: "http://www.eqment.store/" } }
      - { name: EQMUX, slug: eqmux, desc: AI 에이전트 팀 관제 Windows 데스크톱 앱, note: v0.3.0 배포, repo: ReDocu/EQMUX, link: { label: 소개 사이트, url: "https://eqmux-web-site.vercel.app/ko/" } }
  - title: 게임 소프트웨어
    head: PROJECT
    rows:
      - { name: CSGP, slug: csgp, desc: Win32 API 기반 C++ 콘솔 게임 프레임워크 · 콘솔 게임 9종, note: 완료, repo: ReDocu/CSGPProject, link: { label: 학습문서, url: /projects/csgp/study-doc/index.html } }
      - { name: 게임 개발 운영 툴, desc: 게임 개발·라이브 운영 자동화 툴 · 개인 프로젝트, status: dev, note: 개발중, repo: ReDocu/GameDevAuto }
      - { name: 동물 수호대, desc: 동물들을 지켜내는 디펜스 게임 · 개인 프로젝트, status: dev, note: 개발중, repo: ReDocu/AnimalDeffence }
      - { name: 학원 운영 시뮬레이션, slug: academy-sim, desc: 커리큘럼·수강생을 관리하는 경영 시뮬레이션 · 팀 프로젝트, note: 개발중, repo: ReDocu/Project_Academy_Ops }
      - { name: Puzzle Lab, desc: 스도쿠·가쿠로 통합 퍼즐 생성기 · 인쇄 지원 웹 게임, status: complete, note: 완료, repo: ReDocu/redocu.github.io, link: { label: 플레이, url: /apps/puzzle-lab/index.html } }
  - title: 교육 과정 저장소
    head: COURSE
    rows:
      - { name: 경일게임아카데미, href: /academy/kyungil/, desc: 게임 클라이언트/콘텐츠 개발 커리큘럼 (2019-09 ~ 2020-03), status: complete, note: 수료, repo: ReDocu/KYGameAcademy, link: { label: 학습문서, url: /academy/kyungil/study-notes.html } }
      - { name: MBC컴퓨터아카데미, href: /academy/mbc/, desc: 비전 기반 AI 모델 생성 커리큘럼 (2023-09 ~ 2024-05), status: complete, note: 수료, link: { label: 학습문서, url: /academy/mbc/study-notes.html } }
      - { name: 코드캠프(딩코), href: /academy/codecamp/, desc: 웹 기반 바이브 코딩 커리큘럼 (2026-06 ~ 2026-09), status: progress, note: 진행중, repo: ReDocu/Sesac_CC_ClaudeCode, link: { label: 체험하기, url: /academy/codecamp/ } }
---
{%- assign c_total = 0 -%}{%- assign c_active = 0 -%}{%- assign c_dev = 0 -%}{%- assign c_done = 0 -%}
{%- for g in page.groups -%}{%- for r in g.rows -%}
  {%- assign st = r.status -%}
  {%- if r.slug -%}{%- assign d = site.data.projects | where: "slug", r.slug | first -%}{%- assign st = d.status -%}{%- endif -%}
  {%- assign c_total = c_total | plus: 1 -%}
  {%- case st -%}{%- when "active" -%}{%- assign c_active = c_active | plus: 1 -%}{%- when "complete" -%}{%- assign c_done = c_done | plus: 1 -%}{%- else -%}{%- assign c_dev = c_dev | plus: 1 -%}{%- endcase -%}
{%- endfor -%}{%- endfor -%}

<div class="container dash">
  <header class="section-head" data-reveal>
    <div class="section-head__row"><div class="section-head__left">
      <p class="label">PROJECT DASHBOARD — /projects/</p>
      <h1 class="section-head__title">프로젝트 현황판</h1>
      <p class="section-head__desc">이 사이트에 등록된 프로젝트의 저장소와 진행 상태를 한 화면에서 확인합니다.</p>
    </div></div>
    <div class="rule"></div>
  </header>

  <div class="dash-stats" data-stagger="up">
    {%- assign stats = "TOTAL PROJECTS,ACTIVE · DEPLOYED,IN DEV,COMPLETE" | split: "," %}
    {%- assign vals = c_total | append: "," | append: c_active | append: "," | append: c_dev | append: "," | append: c_done | split: "," %}
    {%- for s in stats %}
    {%- assign v = vals[forloop.index0] %}
    <div class="dash-stat"><strong data-count="{% if v.size < 2 %}0{% endif %}{{ v }}">{% if v.size < 2 %}0{% endif %}{{ v }}</strong><span>{{ s }}</span></div>
    {%- endfor %}
  </div>

  {%- for g in page.groups %}
  <section class="dash-section">
    <h2 class="dash-section__title" data-reveal="left">{{ g.title }}</h2>
    <div class="dash-table-wrap" data-reveal="fade">
      <table class="dash-table">
        <thead><tr><th>{{ g.head }}</th><th>STATUS</th><th>GITHUB</th><th>LINK</th></tr></thead>
        <tbody data-stagger="left">
          {%- for r in g.rows %}
          {%- assign st = r.status %}{%- assign href = r.href %}
          {%- if r.slug %}{%- assign d = site.data.projects | where: "slug", r.slug | first %}{%- assign st = d.status %}{%- assign href = "/projects/" | append: r.slug | append: "/" %}{%- endif %}
          {%- case st %}
            {%- when "active" %}{%- assign bl = "ACTIVE" %}{%- assign bc = "active" %}
            {%- when "complete" %}{%- assign bl = "COMPLETE" %}{%- assign bc = "complete" %}
            {%- when "progress" %}{%- assign bl = "IN PROGRESS" %}{%- assign bc = "dev" %}
            {%- else %}{%- assign bl = "IN DEV" %}{%- assign bc = "dev" %}
          {%- endcase %}
          <tr>
            <td><div class="dash-name">{% if href %}<a href="{{ href }}">{{ r.name }}</a>{% else %}{{ r.name }}{% endif %}</div><div class="dash-desc">{{ r.desc }}</div></td>
            <td><span class="badge badge--{{ bc }}">{{ bl }}</span> <span class="dash-note mono">{{ r.note }}</span></td>
            <td class="mono">{% if r.repo %}<a class="dash-repo" href="https://github.com/{{ r.repo }}" target="_blank" rel="noopener">{{ r.repo }}</a>{% else %}<span class="dash-none">—</span>{% endif %}</td>
            <td class="mono">{% if r.link %}{% assign ext = r.link.url | slice: 0, 4 %}<a class="dash-link" href="{{ r.link.url }}"{% if ext == "http" %} target="_blank" rel="noopener"{% endif %}>{{ r.link.label }} ▶</a>{% else %}<span class="dash-none">—</span>{% endif %}</td>
          </tr>
          {%- endfor %}
        </tbody>
      </table>
    </div>
  </section>
  {%- endfor %}

  <p class="dash-foot mono">// 상태는 수동으로 관리됩니다. 상세 페이지가 있는 프로젝트는 _data/projects.yml, 나머지는 projects/index.md를 고칩니다.</p>
</div>
