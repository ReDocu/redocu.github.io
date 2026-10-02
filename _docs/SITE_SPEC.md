# Redocu Portfolio Site Specification

작성일: 2026-05-22 · 개정: 2026-10-02 (폴더 구조 개편 반영)
대상 저장소: `redocu.github.io` (GitHub Pages, 사용자 페이지)

> 이 문서는 `_docs/`에 있어 사이트에 게시되지 않는다. 제품 관점의 요구사항은 `_docs/PRD.md`를 본다.

## 1. 개요

Jekyll 기반 개인 포트폴리오 정적 사이트다. 메인 한 페이지에서 네 개의 콘텐츠 영역으로 갈라진다.

| 영역 | 폴더 | URL | 내용 |
| --- | --- | --- | --- |
| 메인 | `index.markdown` | `/` | Hero, 카드 슬라이더 4개(소프트웨어·게임·학습 위키·학원 교육), Contact |
| 프로젝트 | `projects/` | `/projects/` | 프로젝트 현황판, 기술문서, CSGP 학습 북, 팀 워크스페이스 데모 |
| 학습 위키 | `wiki/` | `/wiki/` | 자체 커리큘럼 6과정, 문서 607편 |
| 학원 교육 | `academy/` | `/academy/<학원>/` | 경일게임아카데미, MBC컴퓨터아카데미, 코드캠프 |
| 미니앱 | `apps/` | `/apps/<앱>/` | 퍼즐 랩(스도쿠·가쿠로) |
| 문서 파일 | `files/` | `/files/…` | 포트폴리오·기술문서 PDF, 이력서 |

## 2. 기술 스택과 실행

- Jekyll `~> 4.3.4`, Ruby 3.3, Bundler. 테마 `minima`는 선언만 있고 레이아웃은 자체 `main`·`wikidoc`을 쓴다.
- 플러그인: `jekyll-optional-front-matter`, `jekyll-relative-links`, `jekyll-titles-from-headings`, `jekyll-readme-index`, `jekyll-feed`
- 프론트엔드: HTML, Markdown, CSS 변수, Vanilla JS. 외부 CDN·프레임워크·웹폰트 없음.

```bash
bundle exec jekyll serve    # http://localhost:4000
bundle exec jekyll build    # _site/ 생성
```

`_config.yml`을 고치면 서버를 재시작해야 한다.

## 3. 디렉터리 구조

```text
.
├── _config.yml            # 사이트 설정, 위키 렌더링 기본값, 게시 제외(exclude)
├── index.markdown         # 메인 페이지
├── 404.html               # 404 + 개편 전 URL 리다이렉트 표 (9장)
├── _layouts/              # main.html(공통), wikidoc.html(위키)
├── _includes/             # nav.html, footer.html, wikidoc_toc.html
├── _docs/                 # 운영 문서 (게시 안 됨)
├── _prompts/              # 학습문서 생성 프롬프트 (게시 안 됨)
├── assets/
│   ├── css/               # styles.css(공통), wikidoc.css(위키)
│   ├── js/main.js         # 다크모드, 모바일 메뉴, 카드 슬라이더
│   ├── images/            # 프로필 이미지
│   └── thumbs/            # 모든 카드 썸네일
├── academy/
│   ├── kyungil/           # index.md + ky16-tech-doc.html, study-notes.html, ZIP
│   ├── mbc/               # index.md + *-notes.html, PDF, study-note.css
│   └── codecamp/          # index.md + part1~4.md, part*/ 가이드·결과물
├── wiki/
│   ├── index.html         # 위키 홈
│   └── <과정>/
│       ├── curriculum/    # README.md(로드맵) + 대단원 문서
│       └── lessons/<파트>/ # 본문 (day-001.md, lesson-01.md …)
├── projects/
│   ├── index.md           # 프로젝트 현황판
│   ├── claude-cockpit/    # tech-doc.html, 배포 ZIP
│   ├── csgp/              # architecture.pdf, study-doc/(학습 북)
│   ├── resume-sim/        # tech-doc.html
│   └── team-workspace/    # index.html(기능 데모), tech-doc.html
├── apps/
│   ├── puzzle-lab/        # 스도쿠·가쿠로를 iframe으로 묶는 허브
│   ├── sudoku/ kakuro/
└── files/                 # portfolio.pdf, resume.html, 게임 기술문서 PDF
```

`CLAUDE.md`, `README.md`, `*.pen`은 저장소에만 두고 `exclude`로 빌드에서 뺀다.

## 4. 이름 규칙

- 공개 URL이 되는 폴더·파일은 소문자 영문 kebab-case로 짓는다. 한글·공백·대문자를 쓰지 않는다.
- 페이지가 하나뿐인 폴더는 `index.md`(또는 위키의 `README.md`)로 두어 URL을 `/폴더/`로 끝낸다.
- 썸네일은 `assets/thumbs/`에 모으고 접두어로 출처를 나타낸다: `wiki-*`, `academy-*`, `ky-*`(경일 프로젝트), `mbc-*`(MBC 프로젝트), 그 외는 프로젝트명.
- 게시하면 안 되는 파일은 밑줄로 시작하는 폴더(`_docs/` 등)에 둔다. Jekyll은 밑줄 폴더를 게시하지 않는다.
- 배포 바이너리는 GitHub Releases에 올리는 것이 원칙이다(`.gitignore`의 `projects/**/*.zip`).

## 5. 메인 페이지 (`index.markdown`)

| 섹션 ID | 내용 |
| --- | --- |
| `hero` | 프로필 이미지, 직함, 소개, 기술 칩 5개, 버튼 4개(`/files/portfolio.pdf`, GitHub, `#contact`, `/projects/`) |
| `software` | 소프트웨어 카드 5장 |
| `games` | 게임 카드 2장 |
| `wiki` | 학습 위키 카드 6장 (커리큘럼·학습문서 버튼) |
| `academy` | 학원 교육 카드 3장 (`/academy/<학원>/`) |
| `contact` | 구글 문의 폼(한/영) + 이메일·GitHub·포트폴리오 PDF |

카드 슬라이더(`.portfolio-slider[data-slider]`)는 데스크톱 3장, 1080px 이하 2장, 720px 이하 1장을 보여 준다. 화살표는 카드 한 장씩 이동하며 넘칠 때만 보인다.

Contact의 문의 폼 버튼은 `_config.yml`의 `contact_form_url`(한국어)·`contact_form_url_en`(영문)이 채워졌을 때만 나타나고, 둘 다 비면 `문의 폼 준비 중`이 표시된다. 응답용 URL(`보내기 > 링크`)을 넣고 편집용 `/edit` URL은 넣지 않는다. 문항 정의는 `_docs/CONTACT_FORM.md`, `_docs/CONTACT_FORM.en.md`에 있다.

## 6. 공통 레이아웃

- `main.html`: 모든 일반 페이지의 골격. `nav.html`, `footer.html`, `/assets/js/main.js`를 포함한다.
- `nav.html`: 로고(`/#hero`) + 메뉴 6개(전부 메인 앵커) + 다크모드 토글 + ☰ 기타 메뉴(퍼즐 게임 생성기, `/apps/puzzle-lab/`) + 1080px 이하 모바일 메뉴.
- `main.js`: 다크모드(`localStorage` 키 `portfolio-theme`), 메뉴 열기·닫기(ESC·외부 클릭), 카드 슬라이더.

## 7. 학습 위키 (`wiki/`)

- `_config.yml`의 `defaults`가 `wiki/` 아래 모든 페이지에 `layout: wikidoc`, `render_with_liquid: false`를 건다. 코드 예제의 `{{ }}`·`{% %}`가 Liquid로 해석되지 않는다.
- md 파일은 front matter 없이 그대로 페이지가 되고(`optional-front-matter`), 첫 `#` 헤딩이 제목이 되며(`titles-from-headings`), 문서 사이의 상대 `.md` 링크는 `.html`로 바뀐다(`relative-links`).
- 왼쪽 목차(`wikidoc_toc.html`)는 같은 과정의 페이지를 모아 폴더 단위로 묶는다. 문서를 추가하면 목차에 자동으로 붙는다.

| 과정 폴더 | 이름 | 분량 |
| --- | --- | --- |
| `game-to-unity` | 게임 개발 24주 · C에서 Unity까지 | 120일, 125편 |
| `data-to-vision` | 비전 AI 36주 · 데이터에서 Object Detection까지 | 180일, 191편 |
| `git` | Git 15주 · 혼자서, 팀으로, 자동화까지 | 30강, 35편 |
| `mlops` | MLOps 32주 · 엔지니어 양성과정 | 160일, 174편 |
| `aws` | AWS 16주 · 인프라부터 서버리스까지 | 32강, 44편 |
| `info-engineer` | 정보처리기사 실기 8주 | 16강, 38편 |

새 과정을 추가하려면:

1. `wiki/<과정>/curriculum/README.md`와 `wiki/<과정>/lessons/<파트>/` 문서를 만든다.
2. `_layouts/wikidoc.html`의 과정 분기(`course_prefix`·`course_name`·`course_url`)에 한 블록을 추가한다.
3. `_includes/wikidoc_toc.html`의 `case`에 파트 폴더명 → 표시명을 추가한다.
4. `wiki/index.html`과 메인 `#wiki` 섹션에 카드를 추가하고, 썸네일은 `assets/thumbs/wiki-<과정>.png`로 둔다.

## 8. 학원·프로젝트·미니앱

**학원 (`academy/<학원>/index.md`)** — 페이지마다 자체 `<style>`과 트랙 앵커 칩, 트랙별 '학습한 내용 / 제작한 결과물' 2단 구성. 학습문서 HTML은 `_prompts/학습문서-생성-프롬프트.md`로 만들고 `academy/mbc/study-note.css`를 공유한다.

**프로젝트 (`projects/`)** — `index.md`는 프로젝트 16건의 상태 현황판이다. 요약 수치와 상태는 직접 입력하므로 메인 카드의 상태와 함께 고친다.

**미니앱 (`apps/`)** — Jekyll 레이아웃을 쓰지 않는 독립 정적 앱이다.

| 앱 | 기능 | 브라우저 저장 키 |
| --- | --- | --- |
| `puzzle-lab` | 스도쿠·가쿠로 탭 허브 (`../sudoku/`, `../kakuro/`를 iframe으로 로드) | `puzzlelab-theme` |
| `sudoku` | 난이도별 생성, 검증, 힌트, 메모, 정답, 인쇄 | `vanilla-sudoku-current-game-v1`, `vanilla-sudoku-theme-v1` |
| `kakuro` | 생성·유일해 검증, 조합표, 메모, 인쇄 (설계: `_docs/kakuro-gdd.md`) | `kakuroSaveV1`, `kakuroTheme` |

파이썬 아카이브(`python-archive`)는 2026-10에 제거했다. 새 앱으로 개편할 예정이다.

## 9. 개편 전 URL 리다이렉트

2026-10 개편으로 `/WikiDoc/`→`/wiki/`, `/Academy/`→`/academy/`, `/project/`→`/projects/`, `/web_page/`→`/apps/`, `/data/`→`/files/`로 URL이 바뀌었다. 옛 주소는 GitHub Pages가 `404.html`을 보여 줄 때 그 안의 스크립트가 새 주소로 보낸다.

- `EXACT`: 파일 이름까지 바뀐 경로(한글 파일명, `Tech_document.html` 등)의 1:1 표
- `PREFIX`: 폴더만 바뀐 경로의 접두어 표
- 게임 개발 위키의 `Day001_제목.html`은 `day-001.html`로 변환한다.

JS 리다이렉트라 HTTP 301은 아니다. 새로 만드는 페이지는 처음부터 새 구조에 두고, 이 표에는 항목을 추가하지 않는다.

## 10. 배포

`main`에 push하면 `.github/workflows/jekyll.yml`이 Ruby 3.3으로 `jekyll build`를 실행해 GitHub Pages에 배포한다. `_site/`는 커밋하지 않는다.

배포 후 확인할 것: 메인 카드 링크, `/wiki/` 목차, `/academy/<학원>/`, `/files/portfolio.pdf`, 모바일 메뉴, 옛 주소 한두 개(`/WikiDoc/`, `/project/Dashboard`)의 리다이렉트.

## 11. 알려진 이슈

- 문의 폼 URL이 비어 있어 Contact가 `문의 폼 준비 중` 상태다.
- `academy/kyungil/` 게임 ZIP 4건(`/files/games/*.zip`)은 파일이 없다.
- 메인 썸네일이 약 18MB이고 `loading="lazy"`가 없다.
- `main.html`의 title이 모든 페이지에서 같고, `lang` 속성과 skip-link 대상 `#main`이 없다.
- 원래부터 없는 파일을 가리키는 링크가 위키(약 240건, 대부분 `git` 과정)와 코드캠프 Part 문서(약 75건, `result_doc/` 등)에 있다. 개편과 무관하다.
