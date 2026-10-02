---
layout: academy
title: MBC컴퓨터아카데미
description: Python 게임 제작에서 데이터 분석, CNN 딥러닝, Object Detection을 거쳐 CCTV 웹 서비스 배포까지의 학습과 팀 프로젝트를 정리했습니다.
crumb: MBC
label: ACADEMY 02 — MBC · 2023.09 – 2024.05
heading: 과정별 학습 & 팀 프로젝트
copy: Python 게임 제작에서 시작해 데이터 분석과 CNN 딥러닝, Object Detection 라벨링을 거쳐, 학습시킨 모델을 실시간 CCTV 웹 서비스로 배포했습니다. 각 프로젝트는 PDF와 학습노트로 확인할 수 있습니다.
out_label: 제작한 프로젝트
tracks:
  - id: track-python
    badge: PY
    jump: PYTHON
    title: Python
    sub: 게임 제작으로 익히는 첫 단계
    tag: 파이썬 문법을 게임 제작으로 익히는 첫 단계
    learn:
      - [파이썬 기초 문법, "변수·자료형, 조건/반복문, 함수, 리스트·딕셔너리 활용"]
      - [pygame 게임 제작, "게임 루프·이벤트 처리, 이미지 로드와 알파 처리"]
      - [게임 시스템 구현, "딕셔너리 기반 파일(리소스) 관리, 오브젝트 풀링, 텍스트 애니메이션"]
      - [협업 방식, 초기 구조를 잡고 기능을 점진적으로 추가하는 애자일 방식의 팀 개발]
    tags: [Python, pygame, 오브젝트 풀링, 리소스 관리, 팀 프로젝트]
    outputs:
      - title: 몬스터를 찾아서
        kind: 팀 · 슈팅 게임
        desc: Python으로 만든 종스크롤 비행 슈팅 게임. 팀원들이 가져온 이미지를 알파 처리해 게임에 적용할 수 있도록 구조를 설계했습니다.
        focus: 딕셔너리 파일 관리 · 오브젝트 풀링 · 텍스트 애니메이션
        actions:
          - [PDF, /academy/mbc/monster-hunt.pdf]
          - [학습노트, /academy/mbc/monster-hunt-notes.html]
          - [게임 다운로드, /academy/mbc/monster-hunt.zip]
  - id: track-data
    badge: DA
    jump: 데이터 분석
    title: 데이터 분석
    sub: Pandas / NumPy
    tag: 데이터를 모으고 다듬어 결론을 끌어내는 과정
    learn:
      - [Pandas / NumPy, "DataFrame 조작, 원하는 데이터 추출·집계"]
      - [데이터 수집, "공공데이터 활용, 웹 사이트 크롤링으로 필요한 데이터 확보"]
      - [데이터 전처리, 수집한 데이터를 분석 가능한 형태로 정제]
      - [분석 도출, 카테고리 분석을 통해 결과를 해석하고 결론 도출]
    tags: [Pandas, NumPy, 크롤링, 공공데이터, 전처리]
    outputs:
      - title: 카테고리 분석에 따른 여행지 추천
        kind: 팀 · 데이터 분석
        desc: 공공데이터와 여행지 사이트 크롤링 데이터를 전처리·분석해 카테고리별 여행지를 추천하는 여행 가이드 프로젝트.
        focus: 데이터 크롤링 · 전처리 · 분석 도출
        actions:
          - [PDF, /academy/mbc/travel-recommend.pdf]
          - [학습노트, /academy/mbc/travel-recommend-notes.html]
  - id: track-ml
    badge: ML
    jump: 머신러닝 · 딥러닝
    title: 머신러닝 · 딥러닝
    sub: 직접 모델을 만들고 검증
    tag: 지도 학습(이미지 분류)과 비지도 학습으로 직접 모델을 만들고 검증
    learn:
      - [지도 학습 · 이미지 분류, "CNN 알고리즘의 구조 이해, 뉴럴 네트워크 구성과 sigmoid 활성화"]
      - [데이터 증강, 이미지 크기 변형·자르기로 데이터를 증폭해 학습 품질 개선]
      - [비지도 학습 · 예측 모델, "EDA와 전처리(이상치 제거, 원-핫 인코딩, 데이터 분리, 정규화)"]
      - [모델 평가·튜닝, "학습 결과를 그래프로 검증, 회귀 모델 평가와 하이퍼파라미터 튜닝"]
    tags: [TensorFlow, CNN, 데이터 증강, EDA, 하이퍼파라미터]
    outputs:
      - title: 늑대 vs 허스키
        kind: 팀 · 지도 학습
        desc: 직접 크롤링한 이미지로 CNN 분류 모델을 구성해 늑대와 허스키를 구분. 학습 결과를 그래프로 검증했습니다.
        focus: CNN 모델 구성 · 학습 검증 · 데이터 증강
        actions:
          - [PDF, /academy/mbc/wolf-vs-husky.pdf]
          - [학습노트, /academy/mbc/wolf-vs-husky-notes.html]
      - title: 스팀 가격 예측하기
        kind: 팀 · 비지도 학습
        desc: 스팀 데이터를 EDA·전처리한 뒤 세일 할인가격을 예측하는 모델을 만들고, 모델 평가와 튜닝까지 진행했습니다.
        focus: EDA·전처리 · 모델 평가 · 하이퍼파라미터 튜닝
        actions:
          - [PDF, /academy/mbc/steam-price.pdf]
          - [학습노트, /academy/mbc/steam-price-notes.html]
  - id: track-od
    badge: OD
    jump: OBJECT DETECTION
    title: Object Detection
    sub: 라벨링부터 CCTV 적용까지
    tag: 데이터 라벨링을 직접 경험하고, 학습시킨 모델을 실시간 CCTV 웹 서비스로 배포
    learn:
      - [데이터 라벨링 경험 ①, Object Detection 학습용 데이터 라벨링 — 손흥민 추적하기]
      - [데이터 라벨링 경험 ②, 다중 대상 라벨링 — 르브론 제임스 · 스테판 커리 추적하기]
      - [모델 적용·배포, "라벨링한 데이터로 학습시킨 모델을 파일 포맷에 맞게 적용, 탐지 대상 동적 교체"]
      - [웹 서비스 제작, "Flask로 로그인·게시판·댓글·좋아요를 갖춘 SNS 웹사이트 개발, 서버-클라이언트 구조 이해"]
    tags: [Object Detection, 데이터 라벨링, Flask, 라즈베리파이, 실시간 탐지]
    outputs:
      - title: 인공지능 모델 적용 웹사이트 (CCTV)
        kind: 팀 · 최종 프로젝트
        desc: 라즈베리파이 웹캠(CCTV)으로 실시간 객체 탐지를 하는 웹사이트. 라벨링해 학습시킨 모델을 적용하고, 원할 때마다 모델을 바꿔 탐지 대상을 동적으로 변경할 수 있습니다.
        focus: Flask 웹 개발 · 모델 파일 포맷 적용 · 실시간 객체 탐지
        actions:
          - [PDF, /academy/mbc/cctv-web.pdf]
          - [학습노트, /academy/mbc/cctv-web-notes.html]
---
<p class="academy__foot mono">// 전체 학습 노트는 <a href="/academy/mbc/study-notes.html">학습문서</a>에서 볼 수 있습니다.</p>
