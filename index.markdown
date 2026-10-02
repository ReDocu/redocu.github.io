---
layout: main
intro: true
css: [home]
js: [home]
portfolio: [eqmux, spm, resume-sim]   # 메인 소프트웨어 카드 고정 목록
description: C/C++ · Unity · Unreal · Full Stack · AI Agent — AX 개발자 DOCU의 포트폴리오
# 학습 위키 그리드 (PRD 4.6). 문서 수는 수동 입력 — 과정 추가 시 SITE_SPEC 7장 절차에 포함
courses:
  - { slug: game-to-unity,  name: 게임 개발 24주,      docs: 125 }
  - { slug: data-to-vision, name: 비전 AI 36주,        docs: 191 }
  - { slug: git,            name: Git 15주,            docs: 35 }
  - { slug: mlops,          name: MLOps 32주,          docs: 174 }
  - { slug: aws,            name: AWS 16주,            docs: 44 }
  - { slug: info-engineer,  name: 정보처리기사 8주,    docs: 38 }
# 학원 교육 카드 (PRD 4.7) — _includes/card.html 형식
academies:
  - title: 게임 클라이언트/콘텐츠 개발 커리큘럼
    url: /academy/kyungil/
    status: complete
    meta: 디벨로퍼로켓 · 2019.09 – 2020.03
    desc: C/C++ 콘솔 → WinAPI 프레임워크 → Unity 엔진 순서로 게임 클라이언트 개발을 배우고, 단계마다 슈팅·SRPG·턴제 전략 게임을 직접 제작했습니다.
    tags: [C/C++, WinAPI, Unity, 게임 개발]
    thumb: /assets/thumbs/academy-kyungil.png
    actions:
      - { label: 상세문서, url: /academy/kyungil/ }
      - { label: GitHub, url: "https://github.com/ReDocu/KYGameAcademy" }
      - { label: 학습문서, url: /academy/kyungil/study-notes.html }
  - title: 비전 기반 AI 모델 생성 커리큘럼
    url: /academy/mbc/
    status: complete
    meta: MBC컴퓨터아카데미 · 2023.09 – 2024.05
    desc: Python 게임 제작에서 시작해 데이터 분석과 CNN 딥러닝, Object Detection 라벨링을 거쳐, 학습시킨 모델을 실시간 CCTV 웹 서비스로 배포했습니다.
    tags: [Python, Pandas, TensorFlow, Flask]
    thumb: /assets/thumbs/academy-mbc.png
    actions:
      - { label: 상세문서, url: /academy/mbc/ }
      - { label: 학습문서, url: /academy/mbc/study-notes.html }
  - title: 웹 기반 바이브 코딩 커리큘럼
    url: /academy/codecamp/
    status: complete
    meta: 코드캠프(딩코) · 2026.06 – 2026.09
    desc: Claude Code 중심의 바이브 코딩 과정. PRD 문서 작성부터 Supabase·Vercel 배포, 포트원 결제 연동까지 익히며 소개 페이지·미니 노션·맛집 커뮤니티를 제작했습니다.
    tags: [Claude Code, Supabase, Vercel, Portone]
    thumb: /assets/thumbs/academy-codecamp.png
    actions:
      - { label: 상세문서, url: /academy/codecamp/ }
      - { label: GitHub, url: "https://github.com/ReDocu/Sesac_CC_ClaudeCode" }
---
{%- comment -%} 메인 포트폴리오는 page.portfolio 에 적은 slug 만, 그 순서대로 {%- endcomment -%}
{%- assign software = "" | split: "" -%}{%- for s in page.portfolio -%}{%- assign item = site.data.projects | where: "slug", s | first -%}{%- assign software = software | push: item -%}{%- endfor -%}
{%- assign games = site.data.projects | where: "kind", "game" | sort: "order" -%}

<section class="hero" id="hero">
  <div class="container hero__inner">
    <div class="hero__text">
      <p class="hero__ident" aria-hidden="true">// IDENTIFICATION_</p>
      <p class="hero__eyebrow"><span class="hero__line" aria-hidden="true"></span>AX 개발자</p>
      <h1 class="hero__title" data-text="DOCU">DOCU</h1>
      <p class="hero__desc">게임 클라이언트 개발에서 시작해 비전 AI 모델 학습, 웹 서비스 개발까지 영역을 넓혀 온 개발자입니다. 지금은 Claude Code를 중심으로 개발 도구와 웹 게임을 만들고, 배운 것을 문서로 정리해 나누고 있습니다.</p>
      <div class="chips hero__chips" aria-label="핵심 기술">
        <span class="chip">C/C++</span><span class="chip">Unity</span><span class="chip">Unreal</span><span class="chip">Full Stack</span><span class="chip">AI Agent</span>
      </div>
      <div class="hero__actions">
        <a class="btn" href="/files/portfolio.pdf">포트폴리오 보기</a>
        <a class="btn btn--ghost" href="https://github.com/redocu" target="_blank" rel="noopener">GitHub</a>
        <a class="btn btn--ghost" href="#contact">Contact</a>
        <a class="btn btn--ghost" href="/projects/">포트폴리오 요약</a>
      </div>
    </div>
    <div class="hud hero__hud">
      <div class="hud__top"><span>PROFILE.MODULE</span><span>ID // 0X44OC</span></div>
      <div class="hud__frame"><div class="hud__view"><img src="/assets/images/hud-fox.webp" alt="노트북을 든 여우 마스코트" width="300" height="280" /></div></div>
      <dl class="hud__readout">
        <div><dt>ID</dt><dd data-type>0x44OC-2026</dd></div>
        <div><dt>NAME</dt><dd data-type>DOCU</dd></div>
        <div><dt>ROLE</dt><dd data-type>AX DEVELOPER</dd></div>
        <div><dt>STACK</dt><dd data-type>C++ / UNITY / UNREAL / FULL STACK / AI AGENT</dd></div>
        <div><dt>STATUS</dt><dd class="warn" data-type><span class="hud__led" aria-hidden="true">●</span> BUILDING</dd></div>
      </dl>
      <div class="hud__progress" style="--p:67%"><span></span></div>
    </div>
  </div>
</section>

<section class="section home-sec" id="software" data-slider>
  <div class="container">
    <header class="section-head" data-reveal>
      <div class="section-head__row">
        <div class="section-head__left">
          <p class="label">SECTION 01 — SOFTWARE</p>
          <h2 class="section-head__title">소프트웨어</h2>
          <p class="section-head__desc">웹 서비스와 개발 도구 등 아이디어를 실제 코드로 완성해 온 소프트웨어 프로젝트 모음입니다.</p>
        </div>
        {% include slider-nav.html total=software.size %}
      </div>
      <div class="rule"></div>
    </header>
    <div class="slider-track" tabindex="0" aria-label="소프트웨어 카드 목록" data-stagger>
      {%- for p in software %}{% include card.html c=p n=forloop.index %}{% endfor %}
    </div>
  </div>
</section>

<section class="section home-sec" id="games" data-slider>
  <div class="container">
    <header class="section-head" data-reveal>
      <div class="section-head__row">
        <div class="section-head__left">
          <p class="label">SECTION 02 — GAMES</p>
          <h2 class="section-head__title">게임 소프트웨어</h2>
          <p class="section-head__desc">직접 설계하고 구현한 게임과 게임 개발 프레임워크 모음입니다.</p>
        </div>
        {% include slider-nav.html total=games.size %}
      </div>
      <div class="rule"></div>
    </header>
    <div class="slider-track" tabindex="0" aria-label="게임 카드 목록" data-stagger>
      {%- for p in games %}{% include card.html c=p n=forloop.index %}{% endfor %}
    </div>
  </div>
</section>

<section class="section home-sec" id="wiki">
  <div class="container">
    <header class="section-head" data-reveal>
      <div class="section-head__row">
        <div class="section-head__left">
          <p class="label">SECTION 03 — KNOWLEDGE BASE</p>
          <h2 class="section-head__title">학습 위키</h2>
          <p class="section-head__desc">직접 설계한 커리큘럼을 하루 단위 위키형 학습 문서로 정리했습니다.</p>
        </div>
        <div class="section-head__side"><a href="/wiki/">ALL COURSES ▶</a></div>
      </div>
      <div class="rule"></div>
    </header>
    <ul class="course-grid" data-stagger>
      {%- for c in page.courses %}
      <li><a class="course" href="/wiki/{{ c.slug }}/curriculum/">
        <span class="course__top"><span class="course__num">{{ forloop.index | prepend: "0" | slice: -2, 2 }}</span><span class="course__docs"><span data-count="{{ c.docs }}">{{ c.docs }}</span> DOCS</span></span>
        <span class="course__name">{{ c.name }}</span>
        <span class="course__slug">{{ c.slug }}</span>
        <span class="course__bar" aria-hidden="true"></span>
      </a></li>
      {%- endfor %}
    </ul>
  </div>
</section>

<section class="section home-sec" id="academy" data-slider>
  <div class="container">
    <header class="section-head" data-reveal>
      <div class="section-head__row">
        <div class="section-head__left">
          <p class="label">SECTION 04 — ACADEMY</p>
          <h2 class="section-head__title">학원 교육</h2>
          <p class="section-head__desc">학원 과정별로 배운 내용과 직접 만든 결과물을 정리했습니다.</p>
        </div>
        <div class="section-head__side academy-side">
          <a href="/teaching/">강의 제안 보기 ▶</a>
          {% include slider-nav.html total=page.academies.size %}
        </div>
      </div>
      <div class="rule"></div>
    </header>
    <div class="slider-track" tabindex="0" aria-label="학원 교육 카드 목록" data-stagger>
      {%- for a in page.academies %}{% include card.html c=a n=forloop.index %}{% endfor %}
    </div>
  </div>
</section>

<section class="contact" id="contact">
  <div class="container contact__inner">
    <div class="contact__text" data-reveal="left">
      <p class="label">CONTACT — OPEN CHANNEL</p>
      <h2 class="contact__title" data-text="CONTACT US">CONTACT US</h2>
      <p class="contact__copy">채용 제안과 헤드헌팅, 강의·교육 제안, 프로젝트 협업, 만든 도구에 대한 피드백까지 모두 환영합니다. 문의 폼을 남겨 주시면 가장 빠르게 확인합니다.</p>
      <ul class="contact__links">
        <li><a href="mailto:{{ site.contact_email }}"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="m2 4 6 4.5L14 4"/></svg>이메일</a></li>
        <li><a href="https://github.com/redocu" target="_blank" rel="noopener"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 14v-2.2c-2.6.6-3.1-1.2-3.1-1.2M10 14v-2.4c0-.7-.2-1.1-.5-1.4 1.9-.2 3.5-.9 3.5-3.6 0-.8-.3-1.5-.8-2 .1-.2.3-1-.1-2 0 0-.6-.2-2 .8a7 7 0 0 0-3.6 0c-1.4-1-2-.8-2-.8-.4 1-.2 1.8-.1 2-.5.5-.8 1.2-.8 2 0 2.7 1.6 3.4 3.5 3.6"/></svg>github.com/redocu</a></li>
        <li><a href="/files/portfolio.pdf"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5h6.5L13 5v9.5H3z M9.5 1.5V5H13 M5.5 8.5h5 M5.5 11h5"/></svg>portfolio.pdf</a></li>
        <li><a href="/files/resume.html"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 14c.6-2.8 2.6-4.2 5-4.2s4.4 1.4 5 4.2"/></svg>이력서</a></li>
      </ul>
    </div>
    <div class="form-module" data-reveal="right">
      <div class="form-module__top"><span>FORM.MODULE</span><span>KO / EN</span></div>
      <h3 class="form-module__title">문의 폼 남기기</h3>
      <p class="form-module__desc">문의 유형을 고르시면 그에 필요한 항목만 보여 드립니다. 구글 로그인 없이 바로 작성할 수 있고, 1~2분이면 충분합니다.</p>
      <div class="form-module__actions">
        {%- if site.contact_form_url and site.contact_form_url != "" %}
        <a class="btn" href="{{ site.contact_form_url }}" target="_blank" rel="noopener">문의 폼 작성하기</a>
        {%- else %}
        <span class="form-offline"><span class="led" aria-hidden="true"></span>FORM.OFFLINE</span>
        {%- endif %}
        {%- if site.contact_form_url_en and site.contact_form_url_en != "" %}
        <a class="btn btn--ghost" href="{{ site.contact_form_url_en }}" target="_blank" rel="noopener" hreflang="en" lang="en">Contact form (English)</a>
        {%- endif %}
      </div>
    </div>
  </div>
</section>
