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
      <p class="eyebrow">콘텐츠 개발자 / 메타버스 개발자</p>
      <h1>DOCU</h1>
      <p class="hero__desc">
      </p>
      <div class="hero__tags" aria-label="핵심 키워드">
        <span class="chip">UNITY</span>
        <span class="chip">Unreal Engine</span>
        <span class="chip">Python</span>
        <span class="chip">ETC</span>
      </div>
      <div class="hero__actions">
        <a class="btn" href="/data/포트폴리오.pdf">포트폴리오 보기</a>
        <a class="btn btn--ghost" href="#contact">Contact Us 이동</a>
      </div>
    </div>
  </div>
</section>
<!-- 학원 관련 페이지 -->
<section class="section portfolio-section" id="projects">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 01</p>
      <h2>포트폴리오</h2>
      <p class="section-copy">아이디어를 실제 코드로 완성해 온 개인 개발 프로젝트 모음입니다.</p>
    </div>
    <div class="portfolio-slider" data-slider>
      <button class="slider-arrow slider-arrow--left" type="button" aria-label="이전 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="slider-track" tabindex="0">
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="project/ClaudeCockpit/banner.png" alt="ClaudeCockpit 프로젝트 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>ClaudeCockpit</h3>
            <p>여러 프로젝트의 Claude Code 세션을 한 화면에서 관리·모니터링하는 로컬 대시보드입니다. 세션 상태 확인과 빠른 전환을 지원합니다.</p>
            <div class="tag-list"><span class="tag">Claude Code</span><span class="tag">Node.js</span><span class="tag">wmux</span><span class="tag">v0.1</span></div>
            <div class="card-actions">
              <a class="btn" href="project/ClaudeCockpit/ClaudeCockpit-v0.3.0.zip" target="_blank" rel="noopener">다운로드</a>
              <a class="btn" href="https://github.com/ReDocu/ClaudeCodeTemplate" target="_blank" rel="noopener">GitHub</a>
              <a class="btn" href="project/ClaudeCockpit/Tech_document.html" target="_blank" rel="noopener">기술문서</a>
            </div>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="project/KnowledgeSharingCenter/banner.png" alt="지식 나눔터 프로젝트 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>지식 나눔터</h3>
            <p>문서·게시판·노트·일정·채팅을 한 자리에 모아 함께 읽고 나누는 지식 공유 공간입니다. 리서치 문서와 학습 자료를 자동 색인해 함께 관리합니다.</p>
            <div class="tag-list"><span class="tag">Node.js</span><span class="tag">Vercel</span><span class="tag">Upstash Redis</span><span class="tag">운영중</span></div>
            <div class="card-actions">
              <a class="btn" href="https://company-process.vercel.app/" target="_blank" rel="noopener">방문</a>
              <a class="btn" href="https://github.com/ReDocu/CompanyProcess" target="_blank" rel="noopener">GitHub</a>
              <a class="btn" href="https://github.com/ReDocu/CompanyProcess#readme" target="_blank" rel="noopener">기술문서</a>
            </div>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/images/portfolio/EduCraft.svg" alt="Educraft 프로젝트 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>ResumeAnalyze</h3>
            <p>현재 개발이 진행 중인 프로젝트입니다.</p>
            <div class="tag-list"><span class="tag">개발중</span><span class="tag">GitHub</span></div>
            <div class="card-actions">
              <a class="btn" href="https://github.com/ReDocu/ResumeAnalyze" target="_blank" rel="noopener">개요</a>
              <a class="btn" href="https://github.com/ReDocu/ResumeAnalyze" target="_blank" rel="noopener">GitHub</a>
              <a class="btn" href="https://github.com/ReDocu/ResumeAnalyze" target="_blank" rel="noopener">기술문서</a>
            </div>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/images/portfolio/EduCraft.svg" alt="Educraft 프로젝트 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>Educraft</h3>
            <p>현재 개발이 진행 중인 프로젝트입니다.</p>
            <div class="tag-list"><span class="tag">개발중</span><span class="tag">GitHub</span></div>
            <div class="card-actions">
              <a class="btn" href="https://github.com/ReDocu/EduCraft" target="_blank" rel="noopener">GitHub 바로가기</a>
            </div>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="project/CSGP/banner.png" alt="CSGP 프로젝트 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>CSGP 게임 개발 C언어 학습용 프레임워크</h3>
            <p>Win32 API 기반 C++ 콘솔 게임 프레임워크. 엔진과 콘텐츠를 분리한 구조로 9종의 콘솔 게임을 단계적으로 개발하며 학습하는 프로젝트입니다.</p>
            <div class="tag-list"><span class="tag">C++</span><span class="tag">Win32 API</span><span class="tag">콘솔게임</span><span class="tag">교육</span><span class="tag">완료</span></div>
            <div class="card-actions">
              <a class="btn" href="project/CSGP/CSGP.zip" target="_blank" rel="noopener">다운로드</a>
              <a class="btn" href="https://github.com/ReDocu/CSGPProject" target="_blank" rel="noopener">GitHub</a>
              <a class="btn" href="project/CSGP/study_doc/index.html" target="_blank" rel="noopener">학습문서</a>
            </div>
          </div>
        </article>
      </div>
      <button class="slider-arrow slider-arrow--right" type="button" aria-label="다음 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>
</section>
<!-- 학원 관련 페이지 -->
<section class="section portfolio-section" id="ebooks">
  <div class="container">
    <div class="section-head">
      <p class="section-label">Section 02</p>
      <h2>학원 교육 정리</h2>
      <p class="section-copy">학원 과정별로 배운 내용과 직접 만든 결과물을 정리했습니다.</p>
    </div>
    <div class="portfolio-slider" data-slider>
      <button class="slider-arrow slider-arrow--left" type="button" aria-label="이전 카드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="slider-track" tabindex="0">
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="Academy/KYGame_overview.png" alt="경일게임아카데미 게임 개발 커리큘럼 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>게임 클라이언트/콘텐츠 개발 커리큘럼</h3>
            <p>디벨로퍼로켓(전 경일게임아카데미)</p>
            <p>2019-09-02 ~ 2020-03-23</p>
            <p>C/C++ 콘솔 → WinAPI 프레임워크 → Unity 엔진 순서로 게임 클라이언트 개발을 배우고, 단계마다 슈팅·SRPG·턴제 전략 게임을 직접 제작했습니다.</p>
            <div class="tag-list"><span class="tag">C/C++</span><span class="tag">WinAPI</span><span class="tag">Unity</span><span class="tag">게임 개발</span></div>
            <div class="card-actions">
              <a class="btn" href="/Academy/Kyungil_Academy" target="_blank" rel="noopener">상세문서</a>
              <a class="btn" href="https://github.com/ReDocu/KYGameAcademy" target="_blank" rel="noopener">Github</a>
              <a class="btn" href="/Academy/KYGameAcademy/학습정리.html" target="_blank" rel="noopener">학습문서</a>
            </div>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/images/portfolio/Kyungil_Academy.png" alt="MBC컴퓨터아카데미 AI 커리큘럼 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>비전 기반 AI 모델 생성 커리큘럼</h3>
            <p>MBC컴퓨터아카데미(전 국제컴퓨터아트학원) </p>
            <p>2023-09-13 ~ 2024-05-08 </p>
            <p>Python 게임 제작에서 시작해 데이터 분석과 CNN 딥러닝, Object Detection 라벨링을 거쳐, 학습시킨 모델을 실시간 CCTV 웹 서비스로 배포했습니다.</p>
            <div class="tag-list"><span class="tag">Python</span><span class="tag">Pandas</span><span class="tag">TensorFlow</span><span class="tag">Flask</span></div>
            <div class="card-actions">
              <a class="btn" href="/Academy/MBC_Academy" target="_blank" rel="noopener">상세문서</a>
              <a class="btn" href="/Academy/MBCAcademy/학습정리.html" target="_blank" rel="noopener">학습문서</a>
            </div>
          </div>
        </article>
        <article class="portfolio-card">
          <div class="portfolio-card__thumb">
            <img src="assets/images/portfolio/Kyungil_Academy.png" alt="코드캠프 바이브 코딩 커리큘럼 썸네일" />
          </div>
          <div class="portfolio-card__body">
            <h3>웹 기반 바이브 코딩 커리큘럼</h3>
            <p>코드캠프(딩코)</p>
            <p>2026-06-29 ~ 2026-09-11</p>
            <p>Claude Code 중심의 바이브 코딩 과정. PRD 문서 작성부터 Supabase·Vercel 배포까지 익히며 소개 페이지와 미니 노션 웹서비스를 제작하고 있습니다.</p>
            <div class="tag-list"><span class="tag">Claude Code</span><span class="tag">Supabase</span><span class="tag">Vercel</span><span class="tag">진행중</span></div>
            <div class="card-actions">
              <a class="btn" href="/Academy/CodeCamp_Academy" target="_blank" rel="noopener">체험하기</a>
              <a class="btn" href="https://github.com/ReDocu/Sesac_CC_ClaudeCode" target="_blank" rel="noopener">Github</a>
            </div>
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
      <p class="section-copy"><!--연락 경로는 짧고 직관적으로 정리합니다.--></p>
    </div>
    <div class="contact-box">
      <p><strong>Email</strong></p>
      <a href="mailto:dlehrb103@google.com">dlehrb103@google.com</a>
      <div class="contact-links">
        <a class="btn" href="https://github.com/redocu" target="_blank" rel="noopener">GitHub</a>
        <a class="btn btn--ghost" href="https://example.com/blog" target="_blank" rel="noopener">Blog</a>
      </div>
    </div>
  </div>
</section>