# PRD · Redocu 포트폴리오 사이트 (Sci-Fi 개편)

작성일: 2026-10-02 · 버전: v1.0 (최종)
디자인 원본: `home.pen` → `Home · Sci-Fi` (`PQ0J7`, 1440×3618)
구현 구조: `_docs/SITE_SPEC.md` · 게시 안 됨 (`_docs/`)

> 이 문서가 사이트 제품 요구사항의 단일 기준이다. 페이지 확장은 `_docs/PRD_NEXT.md`에서 이어진다. 이전 `PRD-intro-sound.md`는 5·6장으로 합쳤다.

---

## 1. 개요

### 1.1 목적

게임 클라이언트 → 비전 AI → 웹 서비스로 넓혀 온 경력과, 직접 만든 도구·게임·학습 문서를 한곳에서 보여 주는 개인 포트폴리오. 이번 개편은 메인을 **Sci-Fi HUD 디자인**(`home.pen`)으로 바꾸고, **인트로 부팅 연출**과 **배경음악 플레이어**를 더한다.

### 1.2 방문자와 기대

| 방문자 | 알고 싶은 것 | 사이트에서 가는 곳 |
| --- | --- | --- |
| 채용 담당자·헤드헌터 | 무엇을 만들었고 지금 어떤 개발자인가 | Hero → 소프트웨어·게임 카드 → 포트폴리오 PDF → Contact |
| 교육 기관·수강생 | 무엇을 가르칠 수 있는가 | 학습 위키 → 학원 교육 → Contact(강의 제안) |
| 개발자·협업자 | 도구를 써 볼 수 있는가 | 소프트웨어 카드 → 다운로드·GitHub |

### 1.3 목표

1. 첫 화면 3~5초 안에 정체성(DOCU · 콘텐츠/메타버스 개발자)을 인식시킨다.
2. 어느 방문자든 두 번 이내 클릭으로 원하는 결과물(문서·다운로드·GitHub·문의)에 닿는다.
3. 메인 전체가 하나의 HUD 시스템처럼 일관된 시각 언어를 가진다.
4. 음악은 선택했을 때만 들리고, 페이지를 옮겨도 이어진다.

### 1.4 비목표

블로그·댓글, 방문 분석 도구, 다국어 전환(문의 폼 KO/EN 외), CMS, 하위 페이지(위키 본문·학원·프로젝트 상세) 본문 디자인 개편, 부팅 효과음, 셔플·시각화.

## 2. 결정 사항

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 테마 | **Sci-Fi 다크 단일 테마**. 다크모드 토글 제거 | home.pen에 토글 없음, 자리에 `SYS.ONLINE` 상태 표시 |
| 메인 메뉴 | `Home` → `소개` | home.pen `Nav` |
| 위키 섹션 | 썸네일 카드 슬라이더 → **6칸 코스 그리드** | home.pen `Wiki/Grid` |
| 슬라이더 조작 | 좌우 화살표 → 헤더 우측 `◀ 01 / 05 ▶` 카운터 | home.pen 각 섹션 `Head` |
| 웹폰트 | Google Fonts 도입 (Orbitron, Exo 2, JetBrains Mono) + 한글 대체 Noto Sans KR | Exo 2는 한글을 지원하지 않음 |
| 인트로 | 홈 첫 방문만, 사용자 입력 대기, `MUTE ENTER` 제공 | 5장 |
| 음원 | `sound/` → `assets/audio/`, 첫 곡 `metaverse-edm-techno-01`, 기본 음량 40% | 6장 |
| 곡 제목 | 임시 제목 (부록 A). `playlist.yml`만 고쳐 교체 | |
| 하위 페이지 | 이번에는 Nav·Footer·토큰만 상속 | 범위 관리 |

**확인 필요** (결정 전까지 위 기본값으로 진행)

1. 다크 단일 테마로 가도 되는가 — 위키 장문 읽기는 라이트를 선호하는 사람이 있다. 대안: 위키 레이아웃만 기존 라이트/다크 유지.
2. 9곡의 실제 제목과 "DK"의 의미.

## 3. 정보 구조

```text
/  (메인)
├── #hero        소개
├── #software    소프트웨어 5
├── #games       게임 2
├── #wiki        학습 위키 6과정 ──▶ /wiki/<과정>/curriculum/
├── #academy     학원 교육 3 ──────▶ /academy/<학원>/
└── #contact     Contact ─────────▶ 구글 폼 KO/EN, 메일, GitHub, PDF
/projects/       프로젝트 현황판 (Hero 버튼 "포트폴리오 요약")
/apps/puzzle-lab/  미니앱 (☰ 기타 메뉴)
/files/portfolio.pdf
```

**Nav**: `REDOCU` 로고(→ `/#hero`) · 소개 · 소프트웨어 · 게임 · 학습 위키 · 학원 교육 · Contact · `SYS.ONLINE` 상태 · ☰ 기타 메뉴. 1080px 이하는 햄버거 메뉴.

## 4. 메인 페이지 요구사항

각 섹션은 home.pen 프레임과 1:1로 대응한다. 섹션 ID는 유지해 기존 앵커 링크를 깨지 않는다.

| 섹션 ID | home.pen 프레임 | 높이(1440) |
| --- | --- | --- |
| (헤더) | `Nav` (`t6BaR7`) | 57 |
| `hero` | `Hero` (`KkVfb`) | 677 |
| `software` | `Software` (`O4HP54`) | 670 |
| `games` | `Games` (`POr2S`) | 670 |
| `wiki` | `Wiki` (`lfSJM`) | 412 |
| `academy` | `Academy` (`I4mGHF`) | 721 |
| `contact` | `Contact Section` (`wiq4A`) | 378 |
| (푸터) | `Footer` (`sfJWk`) | 64 |

### 4.1 Nav

| ID | 요구사항 |
| --- | --- |
| NV-1 | 상단 고정, 배경 `bg` 반투명 + 블러, 하단 1px `line` |
| NV-2 | 로고: 육각형 외곽선(`accent`) + `REDOCU` (Orbitron 15 bold, 자간 4) |
| NV-3 | 메뉴: Exo 2 13 `muted`, hover·현재 섹션은 `text` |
| NV-4 | `SYS.ONLINE` 칩: LED + Orbitron 10, 테두리 `line-accent`. 장식이며 클릭 동작 없음 |
| NV-5 | 스크롤 위치에 따라 현재 섹션 메뉴 강조 (P1) |

### 4.2 Hero

| ID | 요구사항 |
| --- | --- |
| HR-1 | 좌측: `// IDENTIFICATION_` 라벨 → 직함 → `DOCU`(Orbitron 104 bold) → 소개 2문장 → 기술 칩 5 → 버튼 4 |
| HR-2 | 버튼: `포트폴리오 보기`(주, `/files/portfolio.pdf`) · GitHub · Contact · 포트폴리오 요약(`/projects/`) |
| HR-3 | 우측 `HUD Panel`(440폭): `PROFILE.MODULE` / `ID // 0X44OC`, 모서리 브래킷이 있는 프로필 이미지, Readout(ID·NAME·ROLE·STACK·STATUS), 진행 바 |
| HR-4 | Readout 값은 HTML 텍스트(스크린리더가 읽음). STATUS `● BUILDING`은 LED 깜빡임 |
| HR-5 | 1080px 이하: HUD Panel이 텍스트 위로, 720px 이하: 가운데 정렬 |
| HR-6 | 인트로 B3의 프로필 카드와 같은 구조 (5장 IN-8) |

### 4.3 공통 · 섹션 헤더와 카드

**섹션 헤더 (`Head`)**: `SECTION 0n — ENGLISH` 라벨(Orbitron 10, `accent`) → 한글 제목(Orbitron/Noto 34 bold) → 한 줄 설명, 우측에 `◀ 01 / 05 ▶` 카운터. 아래 1px `Rule`.

**카드 (`Card`)**: 432×~380, 테두리 1px `line`, 모서리 2px.

| 영역 | 내용 |
| --- | --- |
| `Thumb` (180h) | 썸네일 이미지 + 좌상단 `MOD.0n`, 우상단 상태 배지 |
| `Body` | 제목(Exo 2 15 bold) → 설명 2줄(넘치면 말줄임) → 태그 → 액션 링크 |

상태 배지 매핑 (한글 상태 → 표시):

| 현재 표기 | 배지 | 색 |
| --- | --- | --- |
| 운영중·사용중 | `● ACTIVE` | `accent` |
| 완료 | `● COMPLETE` | `muted` |
| 개발중 | `● IN DEV` | `warn` |
| 진행중 | `● IN PROGRESS` | `warn` |

**슬라이더**: 데스크톱 3장 / 1080px 이하 2장 / 720px 이하 1장(기존 유지). 카운터는 첫 보이는 카드 번호 / 전체. `◀ ▶`는 카드 한 장씩 이동, 끝에서 비활성. 터치 스와이프 유지.

### 4.4 소프트웨어 (`#software`)

카드 5장: EQMUX · ClaudeCockpit · 팀 워크스페이스 · 가상 이력서 시뮬레이션 · EduCraft. home.pen에는 앞 3장만 그려져 있으니 나머지 2장은 같은 카드로 채운다. 문구·링크는 현재 `index.markdown`을 따른다.

### 4.5 게임 (`#games`)

카드 2장: CSGP 프레임워크(COMPLETE) · 학원 운영 시뮬레이션(IN DEV). 2장이라 데스크톱에서는 카운터를 숨긴다.

### 4.6 학습 위키 (`#wiki`)

| ID | 요구사항 |
| --- | --- |
| WK-1 | 6칸 그리드(1080 이하 3칸, 720 이하 2칸). 칸마다 번호 · `125 DOCS` · 과정명 · 폴더명 · 하단 진행 바 |
| WK-2 | 칸 전체가 링크 → `/wiki/<과정>/curriculum/` |
| WK-3 | 문서 수는 수동 입력. 과정 추가 시 `SITE_SPEC.md` 7장 절차에 이 그리드를 포함 |
| WK-4 | 메인에서 위키 썸네일을 쓰지 않는다 → `assets/thumbs/wiki-*.png`는 `/wiki/` 홈에서만 사용 |

### 4.7 학원 교육 (`#academy`)

카드 3장. 제목 아래 `기관 · 기간` 메타 줄(JetBrains Mono 12 `muted`)을 추가한다. 링크는 `/academy/<학원>/`(상세문서) 외 기존 유지.

### 4.8 Contact (`#contact`)

| ID | 요구사항 |
| --- | --- |
| CT-1 | 좌측: `CONTACT — OPEN CHANNEL` → `CONTACT US` → 안내 문구 → 이메일·GitHub·portfolio.pdf 링크 |
| CT-2 | 우측 `FORM.MODULE` 박스(520폭): `KO / EN` 라벨, 설명, `문의 폼 작성하기`(주) · `Contact form (English)` |
| CT-3 | `_config.yml`의 `contact_form_url(_en)`이 비면 해당 버튼 대신 `FORM.OFFLINE` 표시 (기존 '준비 중' 동작 유지) |

### 4.9 Footer

한 줄: `CONTACT // 문의 폼 KO · EN // GITHUB.COM/REDOCU // PORTFOLIO.PDF` 각 항목 링크 + 우측 `© 2026 REDOCU`. 720px 이하 두 줄.

## 5. 인트로 부팅

### 5.1 흐름

```text
첫 방문 ─▶ B0 암전 ─▶ B1 부팅 로그 ─▶ B2 로딩 ─▶ B3 프로필 대기
                                                    ├─ 아무 키/클릭 ─▶ B4 입장 + 음악 재생
                                                    └─ MUTE ENTER  ─▶ B4 입장 (음소거)
재방문 ───────────────────────────────────────────────▶ 메인 바로 표시
```

### 5.2 요구사항

| ID | 단계 | 요구사항 | 수용 기준 |
| --- | --- | --- | --- |
| IN-1 | B0 (0~0.6s) | `bg` 화면 중앙에 육각형 로고만 깜빡임 | 레이아웃 이동 없음 |
| IN-2 | B1 (0.6~2s) | JetBrains Mono 부팅 로그 5줄을 한 줄씩. 끝의 `OK`만 `accent` | 줄 간격 120~400ms로 불규칙 |
| IN-3 | B2 (2~3.5s) | 4px 진행 바 + Orbitron 퍼센트. 37%·87%에서 멈칫. 바 위에 항목명 | 단조 증가, 마지막 `PROFILE LOADED` |
| IN-4 | B3 | 프로필 HUD 카드(= Hero `HUD Panel`) + `PRESS ANY KEY TO ENTER` 깜빡임 + `MUTE ENTER` | 화면 중앙, 입장 버튼에 포커스 |
| IN-5 | B4 (0.7s) | 흐려지며 사라짐. 스크롤 잠금 해제, 오버레이 DOM 제거 | |
| IN-6 | 스킵 | 입장 시 `intro-seen` 저장, 이후 생략. `?intro`로 강제 | 재방문 시 한 프레임도 안 보임 |
| IN-7 | 모션 줄이기 | `prefers-reduced-motion`이면 B3부터 | |
| IN-8 (P1) | 카드 이어짐 | B4에서 카드가 Hero `HUD Panel` 위치로 축소·이동 | 1080px 초과만 |

부팅 로그:

```text
> BOOT REDOCU.OS v3.0
> PROFILE.MODULE ............ OK
> MOUNT /software /games .... OK
> MOUNT /wiki /academy ...... OK
> AUDIO.MODULE .............. READY
```

B2 항목명: `PROFILE` → `SOFTWARE` → `GAMES` → `LEARNING WIKI` → `ACADEMY` → `PROFILE LOADED`

## 6. 배경음악 플레이어

### 6.1 기본

| ID | 요구사항 | 수용 기준 |
| --- | --- | --- |
| PL-1 | 우하단 고정 `AUDIO` 모듈(접힘): LED · 재생 · 제목 · 레벨 바 · 음소거 · 다음 | 인트로보다 아래, 헤더보다 위 레이어 |
| PL-2 | 목록 순환 | 마지막 곡 → 첫 곡 |
| PL-3 | 이어 듣기 | 곡·위치·재생 여부·음량·음소거를 페이지 이동 후 복원 |
| PL-4 | 자동재생 차단 | 막히면 첫 클릭·키 입력 때 재개 (듣던 경우만) |
| PL-5 | 오류 | 없는/깨진 파일 건너뜀, 전부 실패 시 숨김 |
| PL-6 | 재생 표시 | 재생 중 LED 점등 + 4칸 레벨 바 애니메이션 (모션 줄이기 시 정지) |

### 6.2 음량

| ID | 요구사항 | 수용 기준 |
| --- | --- | --- |
| VO-1 | 슬라이더 0~100 | 드래그·방향키로 즉시 반영, 값 `040` 형식 |
| VO-2 | 음소거 토글 | 해제 시 직전 음량 복귀, 0이면 음소거 아이콘 |
| VO-3 | 기억 | 새로고침·이동 후 유지, 기본 40% |
| VO-4 | iOS | 음량 변경 불가 → 슬라이더 숨기고 음소거만 |
| VO-5 | 인트로 연동 | `MUTE ENTER` 또는 이전 음소거 상태면 무음으로 입장 |

### 6.3 곡 정보 · 목록

| ID | 요구사항 | 수용 기준 |
| --- | --- | --- |
| TI-1 | 메타데이터 `title`, `src`, `group`, `desc` | `_data/playlist.yml` |
| TI-2 | 펼침 패널 | 제목 클릭으로 열림, ESC·바깥 클릭으로 닫힘 |
| TI-3 | 현재 곡 | 그룹 · 제목 · 소개 · `01:23 / 03:00` |
| TI-4 | 진행 바 | 표시 + 클릭·드래그 이동 |
| TI-5 | 이전/다음 | 이전은 3초 넘게 재생됐으면 처음으로 |
| TI-6 (P1) | 곡 목록 | 그룹별, 현재 곡 강조, 클릭 재생 |

저장 키: `intro-seen` = `"1"`, `sound-player` = `{ index, time, playing, volume, muted }`

## 7. 하위 페이지

| 경로 | 이번 개편 범위 |
| --- | --- |
| `/projects/`, `/academy/*`, `/wiki/*` | 새 Nav·Footer·플레이어·토큰 상속. 본문 구조는 유지. 디자인은 8.3 하위 페이지 표 |
| `/wiki/*` 본문 | 장문 가독성을 위해 본문 폰트는 Noto Sans KR 16px 유지, 코드 블록만 JetBrains Mono |
| `/apps/*` | 독립 앱이라 변경 없음 (플레이어 없음) |
| `404.html` | 토큰만 적용. 리다이렉트 스크립트 유지 |

## 8. 디자인 시스템

### 8.1 토큰 (home.pen 실측)

home.pen에 아래 10개가 pen 변수로 등록되어 있다(2026-10-02). CSS 변수(`--bg` …)도 **같은 이름**으로 만들고, 기존 `styles.css`의 민트 `--primary` 체계를 대체한다.

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `bg` | `#050709` | 페이지·인트로 배경 |
| `surface` | `#0B0F15` | 카드, 플레이어, 폼 박스 |
| `line` | `#1A2430` | 테두리, 구분선, 진행 바 트랙 |
| `line-accent` | `#1B5A6E` | 강조 테두리 (상태 칩, 플레이어) |
| `accent` | `#5FE3FF` | 라벨, LED, 주 버튼, 진행 채움 |
| `accent-soft` | `#5FE3FF0F` | 강조 배경 (현재 곡, hover) |
| `text` | `#E8F4FF` | 제목·본문 |
| `muted` | `#8AA4C2` | 보조 문구, 메뉴 (bg 대비 7.85:1) |
| `frame` | `#C9D6E3` | HUD 프레임 테두리 |
| `warn` | `#FF9A3C` | IN DEV / IN PROGRESS, 오류 |

| 글꼴 | 용도 | 크기 |
| --- | --- | --- |
| Orbitron | 영문 라벨·모듈명·숫자 (대문자, 자간 3) | 10 · 11 · 15~18 · 34 · 104 |
| Exo 2 → Noto Sans KR | 본문·제목·메뉴 (한글은 Noto로 대체) | 11~16 |
| JetBrains Mono | 로그, 시간, ID, 메타 | 11~13 |

모서리 2px(기본)·4px(패널 상단). 그림자 없음, 1px 테두리로 구분. 한글 제목은 Orbitron이 한글을 지원하지 않으므로 Noto Sans KR bold로 표시된다 — pen에서도 한글 제목의 실제 렌더링을 확인한다.

### 8.2 pen 컴포넌트 (신규, `reusable: true`)

home.pen 상단(y −760) 행에 12개 컴포넌트가 있고, 모든 화면은 이 인스턴스로 구성된다. 상태(variant)는 별도 컴포넌트가 아니라 인스턴스의 `descendants` 오버라이드로 표현한다.

| 컴포넌트 | id | 상태 표현 |
| --- | --- | --- |
| `Card/Module` | `X5VYS` | `Status` 문구·색 오버라이드 (`● ACTIVE` accent / `● COMPLETE` muted / `● IN DEV`·`● IN PROGRESS` warn). 안 쓰는 `Tag n`·`Act n`·`Meta`는 `enabled: false` |
| `Section/Head` | `oZfjx` | `Counter` `enabled: false`로 카운터 없음 |
| `Wiki/Course` | `qQhZD` | hover는 코드에서만 |
| `Chip/Tag` | `aqZPA` | — |
| `Button/Primary` · `Button/Ghost` | `cG8TB` · `mmIBf` | 두 컴포넌트 |
| `HUD/Panel` | `c7ybl` | hero·intro 동일. 모바일은 `width: 358` + 마스코트 `x: 23` |
| `Audio/Pill` | `xWSpL` | LED·Play 아이콘 오버라이드로 playing / paused / muted |
| `Audio/Volume` | `rDsbU` | `Fill` 폭·`Value` 문구 |
| `Audio/Progress` | `E2zqV3` | — |
| `Audio/Track Row` | `EmDQO` | current = `fill: $accent-soft` + Num·Title accent |
| `Boot/Log Line` | `GKUcw` | pending = `Result` `enabled: false` |

### 8.3 pen 화면 (완료, 2026-10-02)

| 프레임 | id | 크기 | 내용 |
| --- | --- | --- | --- |
| `Home · Sci-Fi` | `PQ0J7` | 1440×3649 | 컴포넌트 인스턴스로 재구성, 소프트웨어 카드 5장 (슬라이더 트랙은 `clip`이라 3장만 보임) |
| `Home · Tablet` | `dn0iT` | 1024×3967 | 카드 2장, 위키 3칸, Hero 세로(HUD 위) |
| `Home · Mobile` | `nZQcM` | 390×4539 | 카드 1장, 위키 2칸, 햄버거 메뉴, 버튼 2×2 |
| `Intro · B1 Boot Log` | `ZqSaz` | 1440×900 | 로고 + 로그 3줄 |
| `Intro · B2 Loading` | `NMndX` | 1440×900 | 로그 5줄 + `LOADING // SOFTWARE` 37% |
| `Intro · B3 Standby` | `n1kGlQ` | 1440×900 | `HUD/Panel` + `PRESS ANY KEY TO ENTER` + `MUTE ENTER` |
| `Intro · B3 · Mobile` | `WlFTO` | 390×844 | 카드 폭 358, `TAP TO ENTER` |
| `Home · Audio Expanded` | `UYOP2` | 1440×900 | 첫 화면 + 우하단 320폭 패널 |
| `Home · Audio · Mobile` | `JL1Kh` | 390×844 | 하단 시트(핸들, 상단 모서리 12) |

하위 페이지·보조 상태 (7장, 5장 B0 · 2026-10-02 추가, y 7000 행). 데스크톱 1440만 그렸고 본문 구조는 기존 페이지를 따른다.

| 프레임 | id | 크기 | 대응 경로 | 내용 |
| --- | --- | --- | --- | --- |
| `Projects · Dashboard` | `xqgvh` | 1440×1978 | `/projects/` | 요약 타일 4 + 상태 표 3개(소프트웨어 8 · 게임 5 · 교육 3). 배지는 4.3 매핑 |
| `Academy · Kyungil` | `Jva8c` | 1440×1911 | `/academy/kyungil/` | 트랙 점프 칩 + 트랙 패널 3개(학습한 내용 / 제작한 게임 2단). MBC·코드캠프도 같은 구조 |
| `Wiki · Home` | `ylbEs` | 1440×1229 | `/wiki/` | `Card/Module` 6장(COURSE 0n · n DOCS · 커리큘럼/학습문서). 썸네일은 여기서만 사용(WK-4) |
| `Wiki · Doc` | `DvcuP` | 1440×993 | `/wiki/<과정>/lessons/…` | 좌측 TOC 280(파트 접기, 현재 문서 강조) + 크럼 + 본문(Noto Sans KR 16, 코드 JetBrains Mono 13) + 이전/다음 |
| `404` | `sv4o8` | 1440×900 | `404.html` | `ERROR // SIGNAL LOST` + 리다이렉트 로그(`Boot/Log Line`) + 홈/학습 위키 버튼. 스크립트 유지 |
| `Intro · B0 Blackout` | `bCTIX` | 1440×900 | 인트로 IN-1 | 육각 로고(opacity 0.6) + 커서만 |

### 8.4 pen → 코드 매핑

| pen | 파일 | 클래스/ID |
| --- | --- | --- |
| `Nav` | `_includes/nav.html` | `.site-header`, `.nav-status` (신규) |
| `Hero`, `HUD/Panel` | `index.markdown` | `.hero`, `.hud-panel` (신규) |
| `Section/Head` | `index.markdown` | `.section-head`, `.slider-counter` (신규) |
| `Card/Module` | `index.markdown` | `.portfolio-card`, `.card-badge--{active,complete,dev}` |
| `Wiki/Course` | `index.markdown` | `.course-grid`, `.course` (신규) |
| `Contact Section` | `index.markdown` | `.section--contact`, `.form-module` |
| `Footer` | `_includes/footer.html` | `.site-footer` |
| `Intro · *`, `Boot/Log Line` | `_includes/intro.html`, `assets/js/intro.js` | `.intro`, `.intro__log` |
| `Audio/*` | `_includes/footer.html`, `assets/js/sound-player.js` | `.sound-player`, `__volume`, `__progress`, `__list` |
| 토큰 8.1 | `assets/css/styles.css` | `:root` 변수 |

프레임·컴포넌트 이름을 바꾸면 이 표도 같이 고친다.

## 9. 비기능 요구사항

| 항목 | 기준 |
| --- | --- |
| 성능 | 썸네일(`assets/thumbs/` 23MB, 메인 약 18MB) → WebP·폭 864px 이하로 변환해 3MB 이하, `loading="lazy"`. 웹폰트 `display=swap`, 필요한 굵기만 |
| 접근성 | `<html lang="ko">`, skip-link 대상 `#main` 추가, 페이지별 `<title>`. 텍스트 대비 4.5:1 이상. 장식 문구(`MOD.01`, 브래킷)는 `aria-hidden` |
| 모션 | `prefers-reduced-motion`에서 부팅·깜빡임·레벨 바 정지 |
| 반응형 | 1440 / 1080 / 720 / 390 기준. 390에서 가로 스크롤 없음, 좌우 16px 여백 |
| 브라우저 | 최신 Chrome·Edge·Safari·Firefox, iOS Safari |
| 저장소 | `localStorage`는 모두 `try/catch`. 막혀도 기능 동작(기억만 안 됨) |
| 호환 | 섹션 ID·URL·`404.html` 리다이렉트 유지. 기존 `portfolio-theme` 키는 무시 |

## 10. 작업 순서

| 단계 | 내용 | 완료 기준 |
| --- | --- | --- |
| 1 디자인 ✅ | pen 토큰 → 컴포넌트(8.2) → 화면(8.3) | 9개 프레임 완료(2026-10-02). 한글은 Noto Sans KR로 렌더링 확인 |
| 2 기반 | 토큰·웹폰트·`lang`·`#main`·title, 테마 토글 제거 | 기존 페이지가 새 토큰으로 깨짐 없이 보임 |
| 3 메인 | Nav → Hero → 카드·슬라이더 → 위키 그리드 → Contact → Footer | 4장 요구사항 |
| 4 썸네일 | WebP 변환, lazy | 9장 성능 |
| 5 인트로 | v1(구현됨)을 Sci-Fi로 교체, `MUTE ENTER` | 5장 |
| 6 플레이어 | 음원 이동, 음량·곡 정보·진행 바 | 6장 P0 |
| 7 P1 | 섹션 강조(NV-5), 카드 이어짐(IN-8), 곡 목록(TI-6) | |
| 8 문서 | `SITE_SPEC.md` 갱신 (구조·저장 키·알려진 이슈) | |

## 11. 출시 전 확인

- [ ] 1440 / 1080 / 720 / 390에서 home.pen 프레임과 비교해 레이아웃 일치
- [ ] Nav 메뉴·Hero 버튼·카드 링크·위키 그리드 링크 전부 동작
- [ ] 슬라이더 카운터가 이동에 맞게 바뀌고 끝에서 비활성
- [ ] 문의 폼 URL이 비었을 때 `FORM.OFFLINE` 표시
- [ ] 첫 방문 인트로 B0→B3, 키 입장 시 첫 곡 재생 / `MUTE ENTER` 무음
- [ ] 재방문 인트로 미표시, `?intro`로 재생
- [ ] 홈 → 위키 → 홈 이동 시 곡·위치·음량 유지
- [ ] 음량 0~100, 음소거 복귀, iOS 슬라이더 숨김
- [ ] 모션 줄이기: 인트로 B3 바로, 애니메이션 정지
- [ ] 키보드만으로 메뉴·슬라이더·입장·플레이어 조작
- [ ] 옛 주소(`/WikiDoc/`, `/project/Dashboard`) 리다이렉트 유지
- [ ] 메인 전송량 5MB 이하 (음원 제외)

---

## 부록 A. 플레이리스트 (`_data/playlist.yml`, 재생 순서)

| # | 파일 (`assets/audio/`) | 그룹 | 임시 제목 | 소개 | 길이 |
| --- | --- | --- | --- | --- | --- |
| 1 | `metaverse-edm-techno-01.mp3` | Metaverse · EDM | Neon Boot | 시스템이 깨어나는 비트 | 3:13 |
| 2 | `metaverse-edm-techno-02.mp3` | Metaverse · EDM | Grid Runner | 가상 도시를 달리는 테크노 | 2:49 |
| 3 | `metaverse-jazz-01.mp3` | Metaverse · Jazz | Virtual Lounge Groove | 가상 라운지에서 흐르는 재즈 | 2:40 |
| 4 | `metaverse-jazz-02.mp3` | Metaverse · Jazz | Lounge After Hours | 늦은 밤 라운지의 재즈 | 3:00 |
| 5 | `metaverse-classical-01.mp3` | Metaverse · Classical | Digital Nocturne | 디지털 공간의 야상곡 | 2:59 |
| 6 | `metaverse-classical-02.mp3` | Metaverse · Classical | Pixel Sonata | 픽셀로 그린 소나타 | 2:40 |
| 7~10 | `bgm-for-dk-01~04.mp3` | DK BGM | DK Theme 01~04 | DK 배경음악 | 3:00 |

```yaml
- title: "Neon Boot"
  src: /assets/audio/metaverse-edm-techno-01.mp3
  group: "Metaverse · EDM"
  desc: "시스템이 깨어나는 비트"
```

## 부록 B. 현재 구현 상태 (2026-10-02)

| 항목 | 상태 |
| --- | --- |
| 인트로 v1 (macOS식, 입력 대기, 재방문 스킵) | 구현됨, 커밋 전. 5장 기준으로 교체 예정 |
| 플레이어 v1 (재생/다음/이어 듣기, 음량 40% 고정) | 구현됨, 커밋 전. 6장 기준으로 확장 예정 |
| 음원 10곡 | `sound/`에 있음, 미이동 |
| home.pen | 변수 10개, 컴포넌트 12개, 화면 9장(8.3) 완료. 썸네일 자리는 그라데이션 플레이스홀더 |
