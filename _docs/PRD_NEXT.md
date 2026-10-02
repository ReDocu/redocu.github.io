# PRD NEXT · 방문자 맥락별 페이지 확장

작성일: 2026-10-03 · 버전: v1.0
기준 문서: `_docs/PRD.md` (메인 개편·인트로·플레이어·디자인 시스템). 이 문서는 그 위에 **페이지 단위**로 무엇을 더 만들지 정의한다.
디자인 원본: `home.pen`

---

## 1. 왜 페이지를 더 만드는가

지금 사이트는 메인 카드에서 바로 외부(GitHub·배포 사이트·ZIP·PDF)로 나간다. 방문자는 "이게 무엇이고, 내가 왜 봐야 하는지"를 알기 전에 사이트를 떠난다. 방문자마다 확인하고 싶은 것이 다르므로, 그 맥락에 맞는 **머무는 페이지**를 만든다.

| 방문자 | 지금 막히는 지점 | 필요한 페이지 |
| --- | --- | --- |
| 채용 담당자·헤드헌터 | 경력 흐름과 역할이 메인 소개 2문장뿐. 프로젝트는 외부 링크로 흩어짐 | **소개(About)**, **프로젝트 상세**, **이력서** |
| 교육 기관·강의 담당자 | 무엇을 가르칠 수 있는지, 교안 수준이 어떤지 한눈에 안 보임 | **강의·교육 제안(Teaching)**, **위키 커리큘럼** |
| 수강생·학습자 | 607편 문서에서 원하는 걸 찾기 어려움 | **위키 커리큘럼**, **위키 검색**(P2) |
| 개발자·협업자 | 도구를 받기 전에 기능·구조·요구 환경을 확인할 곳이 없음 | **프로젝트 상세**, **미니앱 허브** |
| 재방문자 | 무엇이 새로 바뀌었는지 모름 | 프로젝트 상세의 **릴리스 기록**, 현황판 |

## 2. 페이지 목록

상태: ✅ 있음 · 🎨 pen 시안 있음 · 🆕 새로 만듦
우선순위: **P0** 다음 릴리스 필수 · **P1** 다음 릴리스 포함 · **P2** 이후

| # | 페이지 | URL | 방문자 | 사이트 | pen | 우선 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 메인 | `/` | 전체 | ✅ | 🎨 Home · Sci-Fi / Tablet / Mobile | — |
| 2 | 인트로 | `/` 오버레이 | 첫 방문 | ✅ v1 | 🎨 Intro · B0~B3 | — |
| 3 | **소프트웨어 상세** ×5 | `/projects/<slug>/` | 채용·개발자 | 🆕 | 🎨 `Software · EQMUX` | P0 |
| 4 | **게임 상세** ×2 | `/projects/<slug>/` | 채용·개발자 | 🆕 | 🎨 `Game · CSGP` | P0 |
| 5 | **소개 (About)** | `/about/` | 채용 | 🆕 | 🎨 `About` | P0 |
| 6 | 학원 상세 · 경일 | `/academy/kyungil/` | 채용·교육 | ✅ | 🎨 Academy · Kyungil | — |
| 7 | **학원 상세 · MBC** | `/academy/mbc/` | 채용·교육 | ✅ | 🎨 `Academy · MBC` | P0 |
| 8 | **학원 상세 · 코드캠프** (+ Part 1~4) | `/academy/codecamp/` | 교육 | ✅ | 🎨 `Academy · CodeCamp`, `Academy · CodeCamp Part` | P0 |
| 9 | 프로젝트 현황판 | `/projects/` | 재방문 | ✅ | 🎨 Projects · Dashboard | — |
| 10 | **강의·교육 제안 (Teaching)** | `/teaching/` | 교육 | 🆕 | 🎨 `Teaching` | P1 |
| 11 | 위키 홈 | `/wiki/` | 학습자 | ✅ | 🎨 Wiki · Home | — |
| 12 | **위키 커리큘럼** ×6 | `/wiki/<과정>/curriculum/` | 학습자·교육 | ✅ | 🎨 `Wiki · Curriculum` | P1 |
| 13 | 위키 문서 | `/wiki/<과정>/lessons/…` | 학습자 | ✅ | 🎨 Wiki · Doc | — |
| 14 | **이력서** | `/files/resume.html` | 채용 | ✅ | 🎨 `Resume` (+ 인쇄) | P1 |
| 15 | **미니앱 허브** | `/apps/` | 개발자·학습자 | 🆕 | 🎨 `Apps · Hub` | P1 |
| 16 | 위키 검색 | `/wiki/search/` | 학습자 | 🆕 | 🎨 `Wiki · Search` | P2 |
| 17 | 사운드 크레딧 | `/music/` | 전체 | 🆕 | 🎨 `Music` | P2 |
| 18 | 404 | `/404.html` | 전체 | ✅ | 🎨 404 | — |

새로 만드는 것: 사이트 페이지 7종(상세 템플릿 2종 포함 실제 URL 19개), pen 프레임 10개.

## 3. 내비게이션 변경

| 위치 | 지금 | 변경 |
| --- | --- | --- |
| Nav `소개` | `/#hero` | `/about/` |
| 메인 카드 제목·썸네일 | 링크 없음 | 프로젝트 상세(`/projects/<slug>/`)로 |
| 메인 카드 액션 버튼 | 외부 링크 | 그대로 (다운로드·GitHub로 바로 가는 사람용) |
| ☰ 기타 메뉴 | 퍼즐 게임 생성기 | 미니앱 허브 · 강의·교육 제안 · 이력서 |
| 학원 교육 섹션 헤더 | — | `강의 제안 보기 ▶` 링크 → `/teaching/` |
| Contact | 폼·메일·GitHub·PDF | 이력서 링크 추가 |
| 푸터 | 링크 4개 | `ABOUT // TEACHING // RESUME` 추가 |

메인 메뉴는 6개를 유지한다(늘리지 않음). Teaching·Apps·Resume는 맥락 안 링크와 ☰ 메뉴로 들어간다.

## 4. 페이지별 요구사항

### 4.1 프로젝트 상세 — 공통 (P0)

소프트웨어와 게임은 **하나의 레이아웃**(`_layouts/project.html`)과 **하나의 데이터 파일**(`_data/projects.yml`)로 만든다. 메인 카드도 같은 데이터에서 그려, 카드와 상세의 내용이 어긋나지 않게 한다.

| 블록 | 내용 | 소프트웨어 | 게임 |
| --- | --- | --- | --- |
| Breadcrumb | `HOME / SOFTWARE / EQMUX` | ● | ● |
| Hero | `MOD.0n — 분류`, 상태 배지, 버전 · 제목 · 한 줄 요약 · 설명 · 태그 · 버튼(주 1 + 보조 2) · 대표 캡처 | ● | ● |
| Spec Readout | 6칸 키-값 | PLATFORM · STACK · VERSION · STATUS · DISTRIBUTION · SITE | LANGUAGE · PLATFORM · GAMES · STRUCTURE · DOCS · STATUS |
| 섹션 1 | | 핵심 기능 (FEAT ×4) | 단계별 게임 (STAGE 그리드) |
| 섹션 2 | | 작동 방식 (흐름도 + 개입 루프) | 구조 (엔진 ↔ 콘텐츠 레이어) |
| 섹션 3 | | 화면 (캡처 ×3, 클릭 시 원본) | 학습 북 (Part 별 목차 + 문서 버튼) |
| 섹션 4 (P1) | 릴리스 기록 (버전 · 날짜 · 한 줄) | ○ | ○ |
| Pager | `◀ BACK TO LIST` · `NEXT 0n / 0N ▶` (같은 분류 안에서 순환) | ● | ● |

● 필수 · ○ 데이터가 있으면 표시. 섹션 1~3은 데이터 키가 있을 때만 그린다. 내용이 부족한 프로젝트는 Hero + Spec만으로도 페이지가 성립한다.

```yaml
# _data/projects.yml (발췌)
- slug: eqmux
  kind: software            # software | game
  order: 1
  title: EQMUX
  status: active            # active | complete | dev | progress → PRD.md 4.3 배지
  version: v0.3.0
  tagline: AI 에이전트 팀이 함께 작업하고, 사람이 관제합니다.
  desc: …
  tags: [Tauri 2, Rust, SolidJS, Windows]
  thumb: /assets/thumbs/eqmux.png
  actions:
    - { label: 다운로드 v0.3.0, url: https://github.com/ReDocu/EQMUX/releases/latest, primary: true }
    - { label: 소개 사이트, url: https://eqmux-web-site.vercel.app/ko/ }
    - { label: GitHub, url: https://github.com/ReDocu/EQMUX }
  spec: { PLATFORM: Windows 데스크톱, STACK: Tauri 2 · Rust · SolidJS, … }
  features: [ { icon: columns-3, title: 분할 터미널 · 병렬 세션, desc: … } ]
  flow: [ { key: OPERATOR, title: 사람, desc: … } ]
  screens: [ { src: …, caption: 관제 대시보드 } ]
  stages: [ … ]             # 게임 전용
  layers: { engine: [ … ], content: [ … ] }
  book: [ { part: PART 1, title: …, chapters: [ … ] } ]
  releases: [ { version: v0.3.0, date: 2026-09, note: … } ]
```

**대상 7건**

| slug | 분류 | 섹션 구성 | 채워야 할 내용 |
| --- | --- | --- | --- |
| `eqmux` | 소프트웨어 | 기능 · 흐름 · 화면 | 캡처 3장 |
| `claude-cockpit` | 소프트웨어 | 기능 · 화면 | 기능 4개, 캡처 (기술문서에서 발췌 가능) |
| `team-workspace` | 소프트웨어 | 기능 · 화면 | 메뉴 6종(매뉴얼·간트·일일 업데이트·게시판·채팅·참조)을 기능으로, 캡처 |
| `resume-sim` | 소프트웨어 | 기능 · 흐름 | 분석 흐름(이력서 → 성향 근접도 → 팀 배치), 캡처 |
| `educraft` | 소프트웨어 | 기능(공방 4개) · 화면 | BookCraft · LMSCraft · LecView · 미니게임 |
| `csgp` | 게임 | 단계 · 구조 · 학습 북 | 완료 (시안 기준) |
| `academy-sim` | 게임 | 기능 · 화면 | 개발 중 — Hero + Spec + 개발 현황만으로 시작 |

### 4.2 소개 (About) — P0

채용 담당자가 **1분 안에 경력의 흐름과 지금의 강점**을 파악하는 페이지.

| 블록 | 내용 |
| --- | --- |
| Hero | `HUD/Panel` + "게임 클라이언트에서 비전 AI, 웹 서비스까지" 한 줄 + 이력서·포트폴리오 PDF 버튼 |
| 경력 타임라인 | 세로 타임라인. 2019–20 게임 클라이언트(경일) → 2023–24 비전 AI(MBC) → 2026 웹·바이브 코딩(코드캠프) → 현재 Claude Code 도구 개발. 각 지점에서 대표 프로젝트 상세로 링크 |
| 역량 매트릭스 | 분야(게임 · AI · 웹 · 도구 · 교육) × 기술. 각 칸은 근거 프로젝트 링크. 숙련도 막대는 쓰지 않는다(근거 없는 수치) |
| 일하는 방식 | 3항목: 문서로 정리한다(위키 607편) · 도구를 만든다(EQMUX, ClaudeCockpit) · 가르친다(학원·코드캠프) |
| 연락 | Contact로 이어지는 CTA |

### 4.3 학원 상세 · MBC / 코드캠프 — P0

사이트에는 있으나 pen 시안이 없다. `Academy · Kyungil`의 트랙 카드(학습한 내용 / 제작한 결과물 2단)를 그대로 재사용한다.

| 페이지 | 트랙 | 결과물 |
| --- | --- | --- |
| MBC | Python · 데이터 분석 · 딥러닝 · Object Detection · 웹 배포 | Monster Hunt, Steam 가격, 여행 추천, Wolf vs Husky, CCTV 웹 (각 PDF·학습노트) |
| 코드캠프 | Part 1~4 | 소개 페이지, 미니 노션, 맛집 커뮤니티, 맛집 커뮤니티 심화 |
| 코드캠프 Part | 가이드 · 결과물 · PDF | Part별 페이지 공통 템플릿 1장 |

### 4.4 강의·교육 제안 (Teaching) — P1

교육 기관이 **"이 사람에게 어떤 강의를 맡길 수 있나"**에 답하는 페이지. 사이트 설명(`프로그래밍 강사 지망생`)과 직접 맞닿는다.

| 블록 | 내용 |
| --- | --- |
| Hero | 강의 가능 분야 요약 + `강의 제안하기`(문의 폼, 유형 '강의·교육' 선택 안내) |
| 강의 메뉴 | 위키 6과정을 강의 상품처럼: 기간 · 대상 · 선수 지식 · 산출물 · 커리큘럼 링크 |
| 교안 샘플 | 위키 문서 2~3편, CSGP 학습 북, 코드캠프 가이드로 바로가기 |
| 수강·교육 이력 | 학원 3곳의 기간·과정 (학원 상세로 링크) |
| 진행 방식 | 실습 중심 · 문서 제공 · 결과물 기반 평가 (3항목) |

### 4.5 위키 커리큘럼 — P1

`/wiki/<과정>/curriculum/README.md` 페이지를 로드맵으로 보여 준다(현재는 일반 문서 모양).

| 블록 | 내용 |
| --- | --- |
| Head | 과정명 · 기간 · 문서 수 · 대상 |
| 로드맵 | 대단원을 가로 단계(STAGE 01…)로, 각 단계에 주차 범위와 문서 수 |
| 대단원 목록 | 대단원 → 차시 목록(접기/펼치기), 각 차시는 문서 링크 |
| 진도 표시 (P2) | 읽은 문서를 브라우저에 저장해 체크 표시 |

### 4.6 이력서 — P1

`/files/resume.html`을 Sci-Fi 토큰으로 맞추되, **인쇄는 흰 바탕 흑백**으로 전환(`@media print`). 상단에 PDF 저장 안내. 내용은 기존 유지.

### 4.7 미니앱 허브 — P1

`/apps/`에 카드 3장: 퍼즐 랩(스도쿠·가쿠로) · 파이썬 아카이브(현재 어디서도 링크 없음) · (예정 슬롯). 각 카드에 "브라우저에서 바로 실행" 표시와 저장 방식(브라우저 저장) 안내.

### 4.8 위키 검색 — P2

빌드 때 문서 제목·헤딩을 JSON 하나로 만들고(`/wiki/search.json`, Liquid), 브라우저에서 제목·헤딩만 필터한다. 본문 전문 검색과 외부 검색 라이브러리는 도입하지 않는다.

### 4.9 사운드 크레딧 — P2

플레이리스트 10곡 목록, "Made with SUNO" 표기, 곡별 바로 재생(플레이어와 연동).

## 5. pen 작업 목록

모두 완료(2026-10-03). 캔버스 05~07행에 방문자 맥락별로 배치했다. 상세 템플릿 두 시안은 승격한 컴포넌트의 인스턴스로 바뀌었다(화면은 동일).

| 행 | 프레임 | id | 크기 | 비고 |
| --- | --- | --- | --- | --- |
| 05 채용 | `Software · EQMUX` | `rkFGw` | 1440×2317 | 소프트웨어 상세 템플릿 |
| 05 | `Game · CSGP` | `kIzOw` | 1440×2749 | 게임 상세 템플릿 |
| 05 | `Project · Mobile` | `xALGi` | 390×3827 | 상세 공통. Hero 세로, Spec 2열, FEAT 1열, 흐름도 세로(아래 화살표) |
| 05 | `About` | `ByX4f` | 1440×2925 | Hero(HUD) → 타임라인 4 → 역량 매트릭스(근거 링크) → 일하는 방식 3 → CTA |
| 05 | `About · Mobile` | `rGsuc` | 390×4226 | 매트릭스는 행마다 세로 카드 |
| 05 | `Resume` | `kvk4D` | 1440×2274 | 상단 인쇄 바 + 기존 이력서 내용 |
| 05 | `Resume · Print A4` | `p72NX` | 794×1151 | 흰 바탕 흑백. 1123 기준 1쪽 약간 초과 → 코드에서 여백 조정 |
| 06 교육 | `Teaching` | `OqMni` | 1440×3407 | Hero + 수치 4 → 강의 메뉴 6(`Course/Offer`) → 교안 샘플 3 → 이력 타임라인 4 → 진행 방식 3 → CTA |
| 06 | `Academy · MBC` | `z3zNcr` | 1440×2212 | 경일과 같은 트랙 패널 4개(Python · 데이터 분석 · ML/DL · OD) |
| 06 | `Academy · CodeCamp` | `IfXJY` | 1440×2133 | Part 1~4 트랙 패널, Part 4는 IN PROGRESS |
| 06 | `Academy · CodeCamp Part` | `CsGvy` | 1440×1157 | 좌측 Day 1~5 TOC + 리소스, 본문, `Pager` |
| 06 | `Wiki · Curriculum` | `C82tdg` | 1440×1612 | 과정 헤드 + 수치 4 → 로드맵 4단계(`Stage/Tile`) → 대단원 접기(Unit 01 펼침) |
| 07 개발자 | `Apps · Hub` | `VL1h4` | 1440×908 | `Card/Module` 3장(퍼즐 랩 · 파이썬 아카이브 · 예정 슬롯) + 저장 방식 안내 |
| 07 | `Wiki · Search` | `pky9U` | 1440×1069 | 검색 박스 · 과정 필터 · 결과 6행(헤딩 레벨 표시) |
| 07 | `Music` | `KeKji` | 1440×803 | 현재 곡 바(`Audio/Pill` + `Progress` + `Volume`) + 그룹 4개 10곡 + SUNO 크레딧 |

신규 컴포넌트(컴포넌트 행 오른쪽에 추가):

| 컴포넌트 | id | 출처 | 오버라이드 이름 |
| --- | --- | --- | --- |
| `Spec/Readout` | `FyQrU` | EQMUX `KV PLATFORM` 승격 | `Key`, `Value` |
| `Feature/Card` | `W9MBb` | EQMUX `Feature 01` 승격 | `Num`, `Icon`, `Title`, `Desc` |
| `Flow/Node` | `M92Ur` | EQMUX `Node OPERATOR` 승격 | `Num`, `Title`, `Desc` (강조는 인스턴스 `fill: $accent-soft`) |
| `Stage/Tile` | `b03QS` | CSGP `Stage Tycoon` 승격 | `Num`, `Part`, `Title`, `Desc` |
| `Pager` | `r1jBVr` | EQMUX `Pager` 승격 | `Back Label`, `Back Title`, `Next Label`, `Next Title` |
| `Timeline/Item` | `LSzfN` | 신규 | `Year`, `Title`, `Org`, `Desc`, `Link 1`, `Link 2`, 마지막 항목은 `Line` `enabled: false` |
| `Course/Offer` | `GuTnS` | 신규 | `Num`, `Length`, `Title`, `Target`, `Prereq`, `Output` |

## 6. 콘텐츠 준비 (사용자 작업)

페이지를 채우려면 아래 자료가 필요하다. 없으면 해당 섹션은 숨긴다(4.1 규칙).

| 자료 | 쓰는 곳 | 필수 |
| --- | --- | --- |
| 프로젝트별 캡처 2~3장 (1920×1080 PNG) | 상세 · 화면 | P0 |
| 프로젝트별 기능 3~4개 한 줄씩 | 상세 · 기능 | P0 |
| 경력 타임라인 확인 (기간·역할) | About | P0 |
| 강의 가능 과목·대상·선호 형태 | Teaching | P1 |
| 릴리스 기록 (버전·날짜) | 상세 · 릴리스 | P1 |
| 곡 제목 9개, "DK" 의미 | 플레이어 · Music | P1 |

## 7. 비기능 요구사항

`PRD.md` 9장을 그대로 따른다. 추가:

- 상세 페이지 `<title>`은 `프로젝트명 · REDOCU`, `<meta name="description">`은 `tagline`.
- 상세 페이지 캡처는 WebP, `loading="lazy"`, 클릭 시 원본(새 탭).
- 데이터에 없는 섹션은 HTML을 출력하지 않는다(빈 헤더 금지).
- 모든 새 페이지는 `main` 레이아웃(또는 이를 확장한 `project`)을 써서 Nav·Footer·플레이어를 상속.

## 8. 작업 순서

| 단계 | 내용 | 완료 기준 |
| --- | --- | --- |
| 1 | `_data/projects.yml` 7건 + 메인 카드를 데이터 기반으로 전환 | 메인 화면이 지금과 동일 |
| 2 | `project` 레이아웃 + EQMUX·CSGP 상세 | pen 시안과 일치 |
| 3 | 나머지 상세 5건 (있는 내용만으로) | 7개 URL 동작, Pager 순환 |
| 4 ✅ | pen: About · MBC · CodeCamp · Project Mobile (+ Teaching · Curriculum · Resume · Apps · Search · Music) | 시안 완료 2026-10-03 |
| 5 | About, 학원 MBC·코드캠프 개편 | P0 완료 |
| 6 | Teaching, 위키 커리큘럼, 이력서, 미니앱 허브 | P1 완료 |
| 7 | 위키 검색, 사운드 크레딧 | P2 |

## 9. 출시 전 확인

- [ ] 메인 카드 제목 클릭 → 상세, 버튼은 기존 외부 링크
- [ ] 상세 7개 모두 Breadcrumb · Pager 이동 정상, 같은 분류 안에서 순환
- [ ] 데이터가 없는 섹션이 빈 채로 보이지 않음
- [ ] Nav `소개` → `/about/`, ☰ 메뉴에 허브·Teaching·이력서
- [ ] 이력서 인쇄 미리보기가 흰 바탕 흑백 A4 2쪽 이내
- [ ] 390px에서 상세·About·Teaching 가로 스크롤 없음
- [ ] 새 페이지마다 고유 `<title>`과 description
