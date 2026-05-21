---
layout : main
title : main
---

<style>
  .academy-portfolio {
    width: min(calc(100% - 32px), var(--container));
    margin: 0 auto;
    padding: 72px 0 88px;
  }

  .academy-project-list {
    display: grid;
    gap: 22px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .academy-project {
    display: grid;
    grid-template-columns: minmax(220px, 320px) 1fr;
    gap: 24px;
    align-items: stretch;
    padding: 22px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }

  .academy-project__image {
    display: block;
    height: 100%;
    min-height: 220px;
    overflow: hidden;
    border-radius: calc(var(--radius) - 2px);
    background: var(--bg-soft);
  }

  .academy-project__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .academy-project__content {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 16px;
  }

  .academy-project__content h2,
  .academy-project__content h3,
  .academy-project__content p {
    margin: 0;
  }

  .academy-project__content h2 {
    font-size: clamp(1.35rem, 2vw, 1.9rem);
    line-height: 1.25;
  }

  .academy-project__meta {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .academy-project__meta li {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 10px;
    color: var(--muted);
  }

  .academy-project__meta strong,
  .academy-project__description h3 {
    color: var(--text);
  }

  .academy-project__description {
    display: grid;
    gap: 10px;
  }

  .academy-project__description ul {
    margin: 0;
    padding-left: 20px;
    color: var(--muted);
  }

  @media (max-width: 800px) {
    .academy-portfolio {
      padding: 46px 0 64px;
    }

    .academy-project {
      grid-template-columns: 1fr;
      padding: 18px;
    }

    .academy-project__image {
      min-height: 0;
      aspect-ratio: 16 / 9;
    }
  }

  @media (max-width: 520px) {
    .academy-project__meta li {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }
</style>

<section class="academy-portfolio" aria-label="경일게임아카데미 포트폴리오">
  <ul class="academy-project-list">
    <li class="academy-project">
      <a class="academy-project__image" href="/data/동방플라이트.pdf">
        <img src="/assets/images/portfolio/동방플라이트.png" alt="동방플라이트 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[팀프로젝트] 동방플라이트</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>슈팅게임 프로젝트</span></li>
          <li><strong>분류</strong><span>슈팅게임</span></li>
          <li><strong>날짜</strong><span>2019</span></li>
          <li><strong>플랫폼</strong><span>WINAPI - PC</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>슈팅게임을 구현</p>
          <ul>
            <li>Vector 객체 관리</li>
            <li>게임 프레임워크 구조화 기초</li>
          </ul>
        </div>
      </div>
    </li>

    <li class="academy-project">
      <a class="academy-project__image" href="/data/트릭스터 택틱스 기술문서.pdf">
        <img src="/assets/images/portfolio/트릭스터 택틱스 기술문서.png" alt="트릭스터 택틱스 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[개인프로젝트] 트릭스터 택틱스</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>맵툴 및 택틱스 게임 구현</span></li>
          <li><strong>분류</strong><span>WINAPI 프로젝트</span></li>
          <li><strong>날짜</strong><span>2019</span></li>
          <li><strong>플랫폼</strong><span>WINAPI - PC</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>맵툴 개발 및 택틱스 게임의 기본 요소 개발</p>
          <ul>
            <li>iso matrix 개발</li>
            <li>Z-Order</li>
            <li>A* 알고리즘</li>
          </ul>
        </div>
      </div>
    </li>

    <li class="academy-project">
      <a class="academy-project__image" href="/data/리그레션 기술문서.pdf">
        <img src="/assets/images/portfolio/리그레션 기술문서.png" alt="리그레션 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[팀프로젝트] 리그레션</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>테이블 RPG 게임 [보드게임] 기반 유니티 게임 프로젝트</span></li>
          <li><strong>분류</strong><span>UNITY 프로젝트</span></li>
          <li><strong>날짜</strong><span>2020</span></li>
          <li><strong>플랫폼</strong><span>UNITY - Mobile</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>포스트 아포칼립스 세상 기반으로, 마을을 경영하고 성장시키는 턴제 전략게임</p>
          <ul>
            <li>데이터 관리 파트</li>
            <li>UI 개발</li>
          </ul>
        </div>
      </div>
    </li>

    <li class="academy-project">
      <a class="academy-project__image" href="/data/덕덕 디펜스 기술문서.pdf">
        <img src="/assets/images/portfolio/덕덕 디펜스 기술문서.png" alt="덕덕디펜스 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[개인프로젝트] 덕덕디펜스</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>명일방주 모작 디펜스게임</span></li>
          <li><strong>분류</strong><span>UNITY 프로젝트</span></li>
          <li><strong>날짜</strong><span>2020</span></li>
          <li><strong>플랫폼</strong><span>UNITY - PC</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>명일방주 게임 모작으로 만든 오리 디펜스게임</p>
        </div>
      </div>
    </li>
  </ul>
</section>
