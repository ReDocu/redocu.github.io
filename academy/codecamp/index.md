---
layout: academy
title: 코드캠프(딩코)
description: Claude Code 중심의 웹 기반 바이브 코딩 과정. PRD 작성부터 Supabase·Vercel 배포, 결제 연동까지 Part별 학습과 결과물을 정리했습니다.
crumb: CODECAMP
label: ACADEMY 03 — CODECAMP · 2026.06.29 – 2026.09.11
heading: Part별 학습 & 결과물
copy: 코드캠프(딩코) 새싹 클로드코드 과정. 문서(PRD) 먼저, 코드는 그다음. 혼자 만들고 배포하는 기본기(Part 1)에서 실무형 협업 구조(Part 2), 내 서비스 MVP 출시(Part 3), 결제의 전 생애(Part 4)까지 확장합니다.
tracks:
  - id: part-1
    badge: P1
    jump: PART 1
    title: Part 1
    sub: 혼자서 만들고, 세상에 띄우기
    tag: PRD → 웹의 구조 → 클로드코드 다루기 → Supabase·MCP → 배포 (Day 1–5)
    summary: 아이디어를 <b>PRD 문서로 먼저</b> 정리하고, 클로드코드로 소개 페이지를 만들어 Supabase·MCP를 연결한 뒤 <b>Git·GitHub·Vercel로 실제 인터넷 주소에 배포</b>했습니다.
    motto: 문서 먼저, 코드는 그다음. 비밀(.env)은 저장소 밖에.
    tags: [Claude Code, PRD, Supabase, MCP, Git · GitHub, Vercel]
    outputs:
      - title: 소개 페이지
        kind: 개인 · 웹 페이지
        desc: PRD에서 시작해 실제 인터넷 주소로 배포까지 완주한 자기소개 페이지.
        focus: PRD → 클로드코드 → Vercel 배포
        actions:
          - [Part 1 학습 북, /academy/codecamp/part1.html]
          - [체험하기, /academy/codecamp/part1-intro/demo-intro.html]
          - [학습 로드맵, /academy/codecamp/part1-intro/01-part1-guide.html]
          - [E-Book PDF, /academy/codecamp/part1-intro/claude-code-part1.pdf]
  - id: part-2
    badge: P2
    jump: PART 2
    title: Part 2
    sub: 팀처럼, 통제하며, 지키면서 만들기
    tag: 기획(PM-Skills) → 디자인(클로드 디자인) → 개발(하네스 엔지니어링) 핸드오프 (Day 6–15)
    summary: 기획 → 디자인 → 개발을 <b>핸드오프로 잇는 역할 분리형 구조</b>로 미니 노션 웹서비스를 만들었습니다. UUID 기반 DB 설계, 구글로그인, <b>훅스 안전장치와 Git 워크트리 병렬 구현</b>, 이미지 스토리지까지 확장.
    motto: 모델의 선의에 의존하지 말고, 구조로 강제하라.
    tags: [PM-Skills, Claude Design, 정규화 · UUID, TDD · SDD, OAuth · JWT, Hooks, 워크트리, Storage]
    outputs:
      - title: 미니 노션
        kind: 개인 · 웹 서비스
        desc: 핸드오프로 만든 노션형 웹서비스. 구글로그인과 이미지 업로드까지 동작합니다.
        focus: 역할 분리 핸드오프 · OAuth · 훅스 · 워크트리
        actions:
          - [Part 2 학습 북, /academy/codecamp/part2.html]
          - [체험하기, /academy/codecamp/part2-mini-notion/demo-mini-notion.html]
          - [학습 로드맵, /academy/codecamp/part2-mini-notion/02-part2-guide.html]
          - [E-Book PDF, /academy/codecamp/part2-mini-notion/claude-code-part2.pdf]
  - id: part-3
    badge: P3
    jump: PART 3
    title: Part 3
    sub: 내 서비스를, 시스템으로 만들어, 세상에 내놓기
    tag: PRD → 디자인 시스템 → 컴포넌트·스토리북 핸드오프 → DB·BFF → 네이버 API → 배포·도메인·PWA (Day 17–29)
    summary: 솔로프리너의 기획(PRD)에서 시작해 <b>디자인 토큰 → UI 컴포넌트 23종 → 스토리북 SSOT 핸드오프</b>로 시스템을 쌓고, 정규화 DB와 <b>BFF</b> 위에 네이버 검색/지도 API를 연동해 <b>도메인·로고·PWA로 출시</b>까지 완주했습니다.
    motto: 구현이 아니라 수정이 문제다. 컴포넌트는 복사가 아니라 연결이다.
    tags: [디자인 토큰, UI 컴포넌트 23종, 스토리북 · SSOT, DB 정규화, BFF, 네이버 검색/지도 API, PWA]
    outputs:
      - title: 맛집커뮤니티
        kind: 개인 · 모바일 MVP
        desc: 360 반응형 화면 8장과 디자인 시스템으로 이루어진 맛집커뮤니티 MVP 목업.
        focus: 디자인 시스템 · 컴포넌트 핸드오프 · BFF
        actions:
          - [Part 3 학습 북, /academy/codecamp/part3.html]
          - [체험하기, /academy/codecamp/part3-food-community/demo-food-community.html]
          - [학습 로드맵, /academy/codecamp/part3-food-community/03-part3-guide.html]
          - [디자인 시스템, /academy/codecamp/part3-food-community/demo-design-system.html]
  - id: part-4
    badge: P4
    jump: PART 4
    title: Part 4
    sub: 다 만든 제품에 결제를 얹기
    tag: PRD 업데이트 → 카피·CTA 배너 → 정산·결제 링크 → insert-only 원장 → 포트원 · 웹훅 (Day 30–34)
    summary: Part 3에서 출시한 맛집커뮤니티에 <b>결제의 전 생애</b>를 얹었습니다. <b>insert-only 원장</b>(취소 = 음수 행 · 스냅샷 · 트랜잭션키) 위에 포트원을 실연동해 <b>웹훅 → 내역 조회 → 취소 → 취소 웹훅</b>까지 완성했습니다.
    motto: 결제 데이터는 고치지 않고 쌓는다. 그리고 웹훅은 localhost에 오지 않는다.
    tags: [PRD 업데이트, 카피 · CTA, insert-only 원장, Portone, 웹훅, 결제 SSOT]
    outputs:
      - title: 맛집커뮤니티 어드밴스
        kind: 개인 · 결제 확장
        desc: 한 상품이 배너부터 취소 내역까지 5화면을 관통하는 결제 플로우 목업.
        focus: insert-only 원장 · 포트원 웹훅 · 결제 SSOT
        actions:
          - [Part 4 학습 북, /academy/codecamp/part4.html]
          - [체험하기, /academy/codecamp/part4-food-community-advance/demo-food-payment.html]
          - [학습 로드맵, /academy/codecamp/part4-food-community-advance/04-part4-guide.html]
          - [원장 시뮬레이터, /academy/codecamp/part4-food-community-advance/demo-payment-ledger.html]
          - [모바일 배너, /academy/codecamp/part4-food-community-advance/demo-mobile-banner.html]
---
<p class="academy__foot mono">// 과정 저장소: <a href="https://github.com/ReDocu/Sesac_CC_ClaudeCode" target="_blank" rel="noopener">ReDocu/Sesac_CC_ClaudeCode</a></p>
