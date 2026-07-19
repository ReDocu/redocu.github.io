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

<section class="academy-portfolio" aria-label="MBC 컴퓨터 아카데미 포트폴리오">
  <ul class="academy-project-list">
    <li class="academy-project">
      <a class="academy-project__image" href="/data/파이썬 슈팅게임 - 몬스터를 찾아서.pdf">
        <img src="/assets/images/portfolio/몬스터를 찾아서.png" alt="파이썬 슈팅게임 몬스터를 찾아서 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[팀프로젝트] 파이썬 슈팅게임 - 몬스터를 찾아서</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>파이썬 문법 학습을 위한 팀 게임 프로젝트</span></li>
          <li><strong>분류</strong><span>파이썬 게임 프로그래밍</span></li>
          <li><strong>기간</strong><span>3주</span></li>
          <li><strong>라이브러리</strong><span>pygame</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>Python으로 종 스크롤 비행 슈팅 게임을 만들었습니다. 팀원들이 원하는 이미지를 직접 인터넷에서 가져와서, 알파처리 및 게임에 적용할 수 있도록 코드를 구현하였으며, 에자일 방식을 위해 초기 구조를 잡고 기능들을 추가하였습니다.</p>
          <ul>
            <li>딕셔너리를 활용한 파일 관리</li>
            <li>오브젝트 풀링 구현</li>
            <li>텍스트 애니메이션 구현</li>
          </ul>
        </div>
      </div>
    </li>

    <li class="academy-project">
      <a class="academy-project__image" href="/data/카테고리 분석에 따른 여행지 추천.pdf">
        <img src="/assets/images/portfolio/카테고리 분석에 따른 여행지 추천.png" alt="데이터 분석 여행지 추천 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[팀프로젝트] 데이터 분석 - 여행지 추천</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>데이터 분석 및 크롤링 연습을 위한 팀 프로젝트</span></li>
          <li><strong>분류</strong><span>데이터 분석</span></li>
          <li><strong>기간</strong><span>1주</span></li>
          <li><strong>라이브러리</strong><span>Numpy / Pandas</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>판다스를 이용한 데이터 분석을 통해, 원하는 데이터를 추출하는 방법을 학습 및 적용하였습니다. 이를 위한 공공데이터를 받아서 사용하는 법, 인터넷에서 필요한 데이터를 크롤링하는 법등을 추가적으로 학습하였습니다.</p>
          <ul>
            <li>여행지 관련 사이트에서 데이터 크롤링</li>
            <li>데이터 전처리</li>
            <li>분석 도출</li>
          </ul>
        </div>
      </div>
    </li>

    <li class="academy-project">
      <a class="academy-project__image" href="/data/늑대vs허스키 CNN 알고리즘 분석 테스트.pdf">
        <img src="/assets/images/portfolio/늑대vs허스키 CNN 알고리즘 분석 테스트.png" alt="이미지 분류 늑대VS허스키 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[팀프로젝트] 이미지 분류 - 늑대VS허스키</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>AI 모델 학습 및 적용</span></li>
          <li><strong>분류</strong><span>딥러닝</span></li>
          <li><strong>기간</strong><span>4일</span></li>
          <li><strong>라이브러리</strong><span>tensorflow</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>CNN 알고리즘에 대한 이해 sigmod와 뉴럴을 만드는 과정에 대하여 학습하고 이를 적용하는 것을 테스팅 해보았습니다.</p>
          <ul>
            <li>이미지 크롤링 해보기</li>
            <li>모델 구성하여 CNN 알고리즘 적용하기 [분류 알고리즘]</li>
            <li>AI 학습시켜 그래프로 확인 및 검증해보기</li>
            <li>데이터 증폭시켜서 작업해보기 [이미지 크기 변형 및 자르기]</li>
          </ul>
        </div>
      </div>
    </li>

    <li class="academy-project">
      <a class="academy-project__image" href="/data/스팀의 세일 할인가격 예측.pdf">
        <img src="/assets/images/portfolio/스팀의 세일 할인가격 예측.png" alt="스팀 세일 할인가격 예측 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[팀프로젝트] 머신러닝 - 스팀 세일 할인가격 예측</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>스팀 데이터 기반 세일 할인가격 예측</span></li>
          <li><strong>분류</strong><span>머신러닝</span></li>
          <li><strong>기간</strong><span>1주</span></li>
          <li><strong>라이브러리</strong><span>a b c</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>EDA/전처리 작업과 머신러닝 학습 및 이를 확인하는 방법, 하이퍼파라미터 튜닝하는 방법 등을 작업하기 위해 팀프로젝트를 진행하였습니다.</p>
          <ul>
            <li>탐색적 데이터 분석 및 각각의 데이터에 대한 전처리[이상치 제거 / 원-핫 인코딩 / 데이터 분리 / 정규화]</li>
            <li>회귀 알고리즘 적용</li>
            <li>회귀 모델 평가하기</li>
            <li>하이퍼 파라미터 적용하기</li>
          </ul>
        </div>
      </div>
    </li>

    <li class="academy-project">
      <a class="academy-project__image" href="/data/인공지능모델적용웹사이트제작.pdf">
        <img src="/assets/images/portfolio/인공지능모델적용웹사이트제작.png" alt="인공지능 모델 적용 웹사이트 제작 포트폴리오 이미지">
      </a>
      <div class="academy-project__content">
        <h2>[팀프로젝트] 인공지능 모델 적용 웹사이트 제작</h2>
        <ul class="academy-project__meta">
          <li><strong>내용</strong><span>CCTV[라즈베리파이]를 활용한 학습시킨 모델을 웹사이트로 배포하기</span></li>
          <li><strong>분류</strong><span>Flask 및 파일 포멧 적용</span></li>
          <li><strong>날짜</strong><span>5주</span></li>
          <li><strong>라이브러리</strong><span>Flask</span></li>
        </ul>
        <div class="academy-project__description">
          <h3>부가설명</h3>
          <p>라즈베리 파이로 연결한 웹캠을 통해 실시간으로 객체탐지를 할 수 있는 웹 사이트 제작, 모델을 적용시키고, 원할 때마다 모델을 바꿔가며 탐지할 객체를 동적으로 변경할 수 있도록 제작</p>
          <ul>
            <li>Flask를 활용하여 SNS 웹사이트 개발[로그인, 게시판, 댓글, 좋아요 기능 구현]</li>
            <li>다양한 모델을 DB에 적용하여 서버-클라이언트에 대한 기본적인 이해</li>
            <li>다양하게 학습시킨 모델을 파일 포멧에 맞게 적용시키는 방안 연구 및 적용</li>
          </ul>
        </div>
      </div>
    </li>
  </ul>
</section>
