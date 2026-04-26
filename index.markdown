---
layout : main
title : main
---

<section class="hero" id="hero">
  <div class="container hero__inner">
    <div class="hero__media">
      <img src="assets/images/Profile.jpg" alt="대표 캐릭터 또는 프로필 이미지" class="hero__image" />
    </div>
    <div class="hero__content">
      <p class="eyebrow">Frontend Developer · UI/UX Designer</p>
      <h1>DOCU</h1>
      <p class="hero__desc">
        여러가지 콘텐츠 개발자
      </p>
      <div class="hero__tags" aria-label="핵심 키워드">
        <span class="chip">정적 웹사이트</span>
        <span class="chip">UI 구조 설계</span>
        <span class="chip">반응형</span>
        <span class="chip">다크모드</span>
      </div>
      <div class="hero__actions">
        <a class="btn" href="#ebooks">포트폴리오 보기</a>
        <a class="btn btn--ghost" href="#contact">Contact Us 이동</a>
      </div>
    </div>
  </div>
</section>

<section class="section" id="profile">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 02</p>
      <h2>Profile</h2>
      <p class="section-copy">내용.</p>
    </div>
    <div class="profile-grid">
      <article class="panel">
        <h3>About Me</h3>
        <p>1251234</p>
        <p>125125</p>
        <p>125125</p>
      </article>
      <article class="panel">
        <h3>License</h3>
        <!--
        <div class="license-grid">
          <div class="license-card">
            <strong>정보처리기사</strong>
            <span>2025.10</span>
            <span>한국산업인력공단</span>
          </div>
          <div class="license-card">
            <strong>웹디자인기능사</strong>
            <span>2024.08</span>
            <span>한국산업인력공단</span>
          </div>
          <div class="license-card">
            <strong>GTQ 1급</strong>
            <span>2023.05</span>
            <span>한국생산성본부</span>
          </div>
        </div>
        -->
      </article>
      <article class="panel">
        <h3>Skill</h3>
        <!--
        <div class="skill-group">
          <h4>Frontend</h4>
          <div class="tag-list">
            <span class="tag">HTML</span>
            <span class="tag">CSS</span>
            <span class="tag">JavaScript</span>
            <span class="tag">Responsive UI</span>
          </div>
        </div>
        <div class="skill-group">
          <h4>Backend</h4>
          <div class="tag-list">
            <span class="tag">Node.js 개념 이해</span>
            <span class="tag">REST 구조 이해</span>
          </div>
        </div>
        <div class="skill-group">
          <h4>Tool</h4>
          <div class="tag-list">
            <span class="tag">Figma</span>
            <span class="tag">GitHub</span>
            <span class="tag">VS Code</span>
          </div>
        </div>
        <div class="skill-group">
          <h4>Language</h4>
          <div class="tag-list">
            <span class="tag">Korean</span>
            <span class="tag">JavaScript</span>
            <span class="tag">C</span>
            <span class="tag">Java</span>
          </div>
        </div>
        -->
      </article>
    </div>
  </div>
</section>

<section class="section portfolio-section" id="ebooks">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 03</p>
      <h2>전자책 제작</h2>
      <p class="section-copy">카드 hover와 슬라이드 이동이 가능한 공통 포트폴리오 섹션입니다.</p>
    </div>
    <div class="portfolio-slider" data-slider>
      <button class="slider-arrow slider-arrow--left" type="button" aria-label="이전 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="slider-track" tabindex="0">
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-ebook-1.svg" alt="전자책 프로젝트 A 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>전자책 프로젝트 A</h3>
            <p>학습 콘텐츠를 한눈에 읽히도록 정리한 전자책 제작 예시입니다.</p>
            <div class="tag-list"><span class="tag">Layout</span><span class="tag">Typography</span><span class="tag">Editorial</span></div>
            <a class="btn" href="https://example.com/ebook-1" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-ebook-2.svg" alt="전자책 프로젝트 B 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>전자책 프로젝트 B</h3>
            <p>챕터 흐름과 카드형 목차를 활용한 정보 전달형 전자책 구성입니다.</p>
            <div class="tag-list"><span class="tag">UI</span><span class="tag">Card Layout</span><span class="tag">Guide</span></div>
            <a class="btn" href="https://example.com/ebook-2" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-ebook-3.svg" alt="전자책 프로젝트 C 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>전자책 프로젝트 C</h3>
            <p>학습 주제를 빠르게 훑을 수 있도록 구조를 단순화한 작업입니다.</p>
            <div class="tag-list"><span class="tag">Grid</span><span class="tag">UX</span><span class="tag">Content</span></div>
            <a class="btn" href="https://example.com/ebook-3" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
      </div>
      <button class="slider-arrow slider-arrow--right" type="button" aria-label="다음 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>
</section>

<section class="section portfolio-section" id="learning">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 04</p>
      <h2>학습 웹사이트</h2>
      <p class="section-copy">문제풀이, 개념 정리, 학습 흐름 설계를 보여주는 웹 작업물입니다.</p>
    </div>
    <div class="portfolio-slider" data-slider>
      <button class="slider-arrow slider-arrow--left" type="button" aria-label="이전 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="slider-track" tabindex="0">
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-learning-1.svg" alt="알고리즘 풀이 아카이브 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>알고리즘 풀이 아카이브</h3>
            <p>문제, 해설, 개념을 정적 페이지 구조로 정리한 학습형 웹사이트입니다.</p>
            <div class="tag-list"><span class="tag">HTML</span><span class="tag">CSS</span><span class="tag">Vanilla JS</span></div>
            <a class="btn" href="https://example.com/learning-1" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-learning-2.svg" alt="정보처리기사 학습 사이트 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>정보처리기사 학습 사이트</h3>
            <p>실기 학습을 위한 섹션 구조와 카드형 콘텐츠 흐름을 설계한 예시입니다.</p>
            <div class="tag-list"><span class="tag">Planning</span><span class="tag">UX Flow</span><span class="tag">Static</span></div>
            <a class="btn" href="https://example.com/learning-2" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-learning-3.svg" alt="개념 학습 모듈 페이지 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>개념 학습 모듈 페이지</h3>
            <p>개념 중심 탐색과 문제 연계를 함께 보여주는 학습 UI 샘플입니다.</p>
            <div class="tag-list"><span class="tag">Concept UI</span><span class="tag">Education</span><span class="tag">Grid</span></div>
            <a class="btn" href="https://example.com/learning-3" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
      </div>
      <button class="slider-arrow slider-arrow--right" type="button" aria-label="다음 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>
</section>

<section class="section portfolio-section" id="games">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 05</p>
      <h2>게임 포트폴리오</h2>
      <p class="section-copy">시각적 몰입감과 정보 배치를 함께 고려한 게임 관련 작업물입니다.</p>
    </div>
    <div class="portfolio-slider" data-slider>
      <button class="slider-arrow slider-arrow--left" type="button" aria-label="이전 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="slider-track" tabindex="0">
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-game-1.svg" alt="게임 UI 시안 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>게임 UI 시안</h3>
            <p>HUD와 메뉴 구조를 카드형으로 정리한 게임 화면 시안입니다.</p>
            <div class="tag-list"><span class="tag">Game UI</span><span class="tag">HUD</span><span class="tag">Figma</span></div>
            <a class="btn" href="https://example.com/game-1" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-game-2.svg" alt="캐릭터 소개 페이지 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>캐릭터 소개 페이지</h3>
            <p>캐릭터 성격과 설정을 한 화면에서 읽히게 구성한 작업입니다.</p>
            <div class="tag-list"><span class="tag">Character</span><span class="tag">Landing</span><span class="tag">Visual</span></div>
            <a class="btn" href="https://example.com/game-2" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-game-3.svg" alt="게임 프로젝트 소개 카드 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>게임 프로젝트 소개 카드</h3>
            <p>장르, 핵심 시스템, 분위기를 빠르게 파악하게 만드는 소개 구조입니다.</p>
            <div class="tag-list"><span class="tag">Info Card</span><span class="tag">Branding</span><span class="tag">UX</span></div>
            <a class="btn" href="https://example.com/game-3" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
      </div>
      <button class="slider-arrow slider-arrow--right" type="button" aria-label="다음 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>
</section>

<section class="section portfolio-section" id="projects">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 06</p>
      <h2>프로젝트 웹사이트</h2>
      <p class="section-copy">실제 서비스 소개, 기능 흐름, CTA 구성을 보여주는 웹사이트 작업물입니다.</p>
    </div>
    <div class="portfolio-slider" data-slider>
      <button class="slider-arrow slider-arrow--left" type="button" aria-label="이전 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="slider-track" tabindex="0">
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-project-1.svg" alt="서비스 랜딩 페이지 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>서비스 랜딩 페이지</h3>
            <p>첫 화면에서 핵심 메시지와 버튼 동선을 강하게 보여주는 페이지입니다.</p>
            <div class="tag-list"><span class="tag">Landing</span><span class="tag">CTA</span><span class="tag">Responsive</span></div>
            <a class="btn" href="https://example.com/project-1" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-project-2.svg" alt="포트폴리오 상세 페이지 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>포트폴리오 상세 페이지</h3>
            <p>작업 목표, 역할, 결과를 카드형 섹션으로 풀어낸 구조입니다.</p>
            <div class="tag-list"><span class="tag">Detail Page</span><span class="tag">Storytelling</span><span class="tag">UI</span></div>
            <a class="btn" href="https://example.com/project-2" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-project-3.svg" alt="브랜드 소개 페이지 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>브랜드 소개 페이지</h3>
            <p>소개, 특징, 레퍼런스를 분리해서 읽기 쉬운 구조로 만든 페이지입니다.</p>
            <div class="tag-list"><span class="tag">Brand</span><span class="tag">Sections</span><span class="tag">Web</span></div>
            <a class="btn" href="https://example.com/project-3" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
      </div>
      <button class="slider-arrow slider-arrow--right" type="button" aria-label="다음 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>
</section>

<section class="section portfolio-section" id="others">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 07</p>
      <h2>기타 포트폴리오</h2>
      <p class="section-copy">영상, 이미지, 문서형 작업 등 확장 가능한 포트폴리오 영역입니다.</p>
    </div>
    <div class="portfolio-slider" data-slider>
      <button class="slider-arrow slider-arrow--left" type="button" aria-label="이전 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="slider-track" tabindex="0">
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-other-1.svg" alt="이미지 아카이브 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>이미지 아카이브</h3>
            <p>시각 자료를 유형별로 분류해 보여주는 정적 갤러리 예시입니다.</p>
            <div class="tag-list"><span class="tag">Gallery</span><span class="tag">Archive</span><span class="tag">Static</span></div>
            <a class="btn" href="https://example.com/other-1" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-other-2.svg" alt="영상 기획 노트 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>영상 기획 노트</h3>
            <p>작업 목적과 장면 구성을 카드형 텍스트로 보여주는 페이지입니다.</p>
            <div class="tag-list"><span class="tag">Planning</span><span class="tag">Video</span><span class="tag">Notes</span></div>
            <a class="btn" href="https://example.com/other-2" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/thumb-other-3.svg" alt="문서형 정리 페이지 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>문서형 정리 페이지</h3>
            <p>텍스트 위주 자료를 시각적으로 읽기 쉽게 풀어낸 문서형 결과물입니다.</p>
            <div class="tag-list"><span class="tag">Docs</span><span class="tag">Structure</span><span class="tag">Content</span></div>
            <a class="btn" href="https://example.com/other-3" target="_blank" rel="noopener">바로가기</a>
          </div>
        </article>
      </div>
      <button class="slider-arrow slider-arrow--right" type="button" aria-label="다음 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>
</section>

<section class="section section--contact" id="contact">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 08</p>
      <h2>Contact Us</h2>
      <p class="section-copy">연락 경로는 짧고 직관적으로 정리합니다.</p>
    </div>
    <div class="contact-box">
      <p><strong>Email</strong></p>
      <a href="mailto:your-email@example.com">your-email@example.com</a>
      <div class="contact-links">
        <a class="btn" href="https://github.com/" target="_blank" rel="noopener">GitHub</a>
        <a class="btn btn--ghost" href="https://example.com/blog" target="_blank" rel="noopener">Blog</a>
      </div>
    </div>
  </div>
</section>