---
layout: academy
title: 경일게임아카데미
description: C/C++ 콘솔 → WinAPI 프레임워크 → Unity 엔진 순서로 게임 클라이언트 개발을 배우고 직접 만든 게임을 정리했습니다.
crumb: KYUNGIL
label: ACADEMY 01 — KYUNGIL · 2019.09 – 2020.03
heading: 언어별 학습 & 제작 게임
copy: C/C++ 콘솔 → WinAPI 프레임워크 → Unity 엔진 순서로 게임 클라이언트 개발을 배우고, 단계마다 직접 만든 게임을 실행 파일과 기술문서로 정리했습니다.
out_label: 제작한 게임
tracks:
  - id: track-c
    badge: C++
    jump: C / C++
    title: C / C++
    sub: 콘솔 프로그래밍
    tag: 문법 → 절차적 → 객체지향으로 이어지는 한 달간의 C++ 여정
    learn:
      - [기초 문법, "변수·형변환, 조건/중첩 반복, 배열(1D·2D)·구조체, 함수 오버로딩, 포인터·참조, 템플릿"]
      - [절차적 프로그래밍, "게임 루프·상태머신, 2D 타일맵 이동, 실시간 입력(<code>_kbhit</code>/<code>_getch</code>)"]
      - [객체지향(OOP), "클래스·캡슐화, 상속·다형성(부모 포인터), 헤더/구현 분리, 동적 할당 <code>new</code>/<code>delete</code>"]
      - [게임 시스템, "프레임 제어(<code>clock</code>·FPS), WinAPI 콘솔 제어·더블 버퍼링, 파일 입출력 세이브"]
    tags: [C/C++, 포인터·참조, 구조체, OOP, 게임 루프, 파일 I/O]
    outputs:
      - title: KY16 Console Game Pack
        kind: 콘솔 게임 팩
        desc: 메뉴에서 번호를 골라 실행하는 콘솔 게임 모음. 문법 학습 → 절차적 게임 → 객체지향 게임 순으로 난이도가 올라갑니다.
        list: [01 영웅은 절차적 — 텍스트 RPG, 02 탈출 루프 — 격자 이동, 03 미로 탈출 — 채굴 어드벤처, 04 겜블 게임 — 절차 → OOP 전환, 05 알카노이드 — 벽돌깨기 (최종)]
        focus: 콘솔 게임 16종 · 상태머신 · 더블 버퍼링
        actions:
          - [게임 다운로드, /academy/kyungil/ky16-project-v1.0.zip]
          - [기술문서, /academy/kyungil/ky16-tech-doc.html]
          - [GitHub, "https://github.com/Redocu-Backup-Management/KYGameAcademy"]
  - id: track-winapi
    badge: API
    jump: WINAPI
    title: WINAPI
    sub: 2D 게임 프레임워크
    tag: 엔진 없이 직접 만든 게임 루프·렌더링 파이프라인
    learn:
      - [게임 프레임워크 구조화, 초기화 → 입력 → 갱신 → 렌더 루프를 직접 설계]
      - [더블 버퍼링, 백버퍼에 그린 뒤 한 번에 출력해 깜빡임 제거]
      - [다수 객체 관리, "STL <code>Vector</code>로 탄막·적의 생성·소멸을 동적으로 관리"]
      - [아이소메트릭 · 길찾기, "ISO Matrix 좌표 변환, Z-Order 정렬, A* 길찾기"]
      - [맵툴 제작, 타일 기반 MapTool로 스테이지 데이터 편집]
    tags: [WINAPI, 더블 버퍼링, STL Vector, ISO / Z-Order, A*, MapTool]
    outputs:
      - title: 동방플라이트
        kind: 팀 · 슈팅
        desc: 종스크롤 탄막 슈팅 게임.
        focus: STL Vector 다수 객체 관리 · 게임 프레임워크 구조화 · 더블 버퍼링
        actions:
          - [기술문서, /files/dongbang-flight.pdf]
      - title: 트릭스터 택틱스
        kind: 개인 · SRPG
        desc: 아이소메트릭 택틱스 게임 + 자체 맵툴.
        focus: ISO Matrix 좌표 변환 · Z-Order 정렬 · A* 길찾기 · MapTool 제작
        actions:
          - [기술문서, /files/trickster-tactics.pdf]
  - id: track-unity
    badge: U
    jump: UNITY
    title: Unity
    sub: 상용 엔진 콘텐츠
    tag: 엔진 워크플로우와 데이터·UI 중심 개발로의 전환
    learn:
      - [엔진 기초, 씬·프리팹·컴포넌트 구조와 라이프사이클 이해]
      - [UI · 카메라, uGUI 기반 화면 설계와 카메라 제어]
      - [데이터 관리, CSV 파일 기반 밸런스 데이터 관리·정규화]
      - [상호작용, "RayCast로 오브젝트 선택·클릭 처리, UI 디자인 연구"]
      - [게임 로직, 턴제 전략·디펜스 규칙 구현]
    tags: [Unity, uGUI, CSV DB, RayCast, 턴제, 디펜스]
    outputs:
      - title: 리그레션
        kind: 팀 · 턴제 전략
        desc: 포스트 아포칼립스 세계에서 마을을 경영·성장시키는 보드게임 기반 턴제 전략. 데이터·UI 파트 담당.
        focus: CSV 데이터 관리·정규화 · uGUI 설계 · 카메라 제어
        actions:
          - [기술문서, /files/regression.pdf]
      - title: 덕덕 디펜스
        kind: 개인 · 디펜스
        desc: 명일방주를 모작한 오리 디펜스 게임.
        focus: RayCast 상호작용 · UI 디자인 연구
        actions:
          - [기술문서, /files/duckduck-defense.pdf]
---
<p class="academy__foot mono">// 전체 학습 노트는 <a href="/academy/kyungil/study-notes.html">학습문서</a>에서 볼 수 있습니다.</p>
