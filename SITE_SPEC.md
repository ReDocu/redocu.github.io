# Redocu GitHub Blog / Portfolio Site Specification

작성일: 2026-05-22  
대상 저장소: `redocu.github.io` 계열 GitHub Pages 정적 사이트

## 1. 프로젝트 개요

이 저장소는 Jekyll 기반의 개인 포트폴리오형 정적 웹사이트이다. 현재 구조상 일반적인 블로그 글 목록보다는 메인 포트폴리오 페이지, 학원별 포트폴리오 상세 페이지, 별도 학습/도구형 정적 웹앱을 함께 배포하는 형태에 가깝다.

주요 목적은 다음과 같다.

- 프로필, 기술 키워드, 포트폴리오 PDF를 첫 화면에서 노출한다.
- 학원별 포트폴리오 정리 페이지로 이동할 수 있는 카드형 섹션을 제공한다.
- PDF 기술문서와 썸네일 이미지를 정적 파일로 제공한다.
- `web_page` 하위에 독립 실행형 학습/도구 페이지를 함께 호스팅한다.

현재 활성화된 메인 페이지 섹션은 `Hero`, `학원 포트폴리오 정리`, `Contact`이다. `Profile`, `학습 웹사이트`, `게임`, `프로젝트`, `기타` 섹션은 `index.markdown` 안에 주석으로 보관되어 있어 필요할 때 재활성화할 수 있다.

## 2. 기술 스택

- 정적 사이트 생성기: Jekyll `~> 4.3.4`
- Ruby 패키지 관리: Bundler, `Gemfile`, `Gemfile.lock`
- Jekyll 테마: `minima ~> 2.5`
- Jekyll 플러그인: `jekyll-feed`
- 프론트엔드: HTML, Markdown, CSS, Vanilla JavaScript
- 배포 예상 환경: GitHub Pages
- 추가 앱: 외부 프레임워크 없이 정적 HTML/CSS/JS로 구성된 미니 앱

## 3. 실행 및 빌드

로컬 개발 서버:

```bash
bundle exec jekyll serve
```

정적 빌드:

```bash
bundle exec jekyll build
```

빌드 결과물은 `_site/`에 생성된다. `_site/`, `.jekyll-cache/`, `.sass-cache/`, `.jekyll-metadata`, `vendor/`는 `.gitignore`에 포함되어 있으므로 소스 관리 대상이 아니다.

`_config.yml`을 수정한 경우 Jekyll 서버를 재시작해야 한다. Jekyll은 설정 파일 변경을 자동 반영하지 않는다.

## 4. 디렉터리 구조

```text
.
├── _config.yml
├── Gemfile
├── index.markdown
├── 404.html
├── _layouts/
│   └── main.html
├── _includes/
│   ├── nav.html
│   └── footer.html
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   ├── images/
│   ├── images/portfolio/
│   ├── temp/
│   └── webfonts/
├── data/
│   └── PDF 포트폴리오/기술문서
├── portfolio/
│   ├── Kyungil_Academy.md
│   └── MBC_Academy.md
└── web_page/
    ├── PythonArchive/
    └── Sudoku/
```

각 영역의 역할은 다음과 같다.

| 경로 | 역할 |
| --- | --- |
| `_config.yml` | 사이트 제목, 이메일, 설명, GitHub 사용자명, Jekyll 플러그인 설정 |
| `_layouts/main.html` | 모든 Jekyll 페이지가 사용하는 기본 HTML 골격 |
| `_includes/nav.html` | 상단 고정 네비게이션, 다크모드 버튼, 기타 링크 메뉴, 모바일 메뉴 |
| `_includes/footer.html` | 공통 하단 푸터 |
| `index.markdown` | 루트 메인 페이지 콘텐츠 |
| `assets/css/styles.css` | 메인 사이트 공통 스타일 |
| `assets/js/main.js` | 메인 사이트 다크모드, 모바일 메뉴, 카드 슬라이더 동작 |
| `portfolio/*.md` | 학원별 포트폴리오 상세 페이지 |
| `data/*.pdf` | 포트폴리오 보기와 상세 페이지에서 연결되는 PDF 문서 |
| `web_page/PythonArchive` | 파이썬 알고리즘 아카이브 정적 앱 |
| `web_page/Sudoku` | 스도쿠 자동 생성 정적 앱 |

## 5. 사이트 라우팅

현재 주요 URL 구조는 다음과 같다.

| 소스 파일 | 빌드 후 예상 URL | 설명 |
| --- | --- | --- |
| `index.markdown` | `/` | 메인 포트폴리오 페이지 |
| `404.html` | `/404.html` | 기본 404 페이지 |
| `portfolio/Kyungil_Academy.md` | `/portfolio/Kyungil_Academy.html` | 경일게임아카데미 포트폴리오 상세 |
| `portfolio/MBC_Academy.md` | `/portfolio/MBC_Academy.html` | MBC 컴퓨터 아카데미 포트폴리오 상세 |
| `web_page/PythonArchive/index.html` | `/web_page/PythonArchive/index.html` | 파이썬 알고리즘 아카이브 |
| `web_page/Sudoku/index.html` | `/web_page/Sudoku/index.html` | 스도쿠 자동 생성기 |
| `data/포트폴리오.pdf` | `/data/포트폴리오.pdf` | 대표 포트폴리오 PDF |

주의: 현재 메인 페이지 카드 링크는 `/portfolio/Kyungil_Academy`, `/portfolio/MBC_Academy`처럼 확장자 없는 경로를 사용한다. 기본 Jekyll 빌드 결과는 `.html` 파일이므로 GitHub Pages에서 확장자 없는 URL이 404가 될 수 있다. 안정적으로 관리하려면 상세 페이지에 `permalink`를 지정하거나 링크를 `.html` 포함 경로로 통일하는 것이 좋다.

## 6. 메인 페이지 명세

파일: `index.markdown`

### 6.1 Hero

- 섹션 ID: `hero`
- 프로필 이미지: `assets/images/Profile.jpg`
- 문구: 콘텐츠 개발자 / 메타버스 개발자
- 타이틀: `DOCU`
- 기술 태그: `UNITY`, `Unreal Engine`, `Python`, `ETC`
- 주요 버튼:
  - `/data/포트폴리오.pdf`
  - `#contact`

### 6.2 학원 포트폴리오 정리

- 섹션 ID: `ebooks`
- 카드 슬라이더 구조: `.portfolio-slider[data-slider]`
- 활성 카드:
  - 경일게임아카데미
  - MBC 컴퓨터 아카데미
- 카드 썸네일 위치:
  - `assets/images/portfolio/Kyungil_Academy.png`
  - `assets/images/portfolio/MBC_Academy.png`
- 카드 이동 버튼은 `assets/js/main.js`에서 `scrollBy`로 처리한다.

### 6.3 Contact

- 섹션 ID: `contact`
- 레이아웃: `.contact-box` 2단 그리드. 왼쪽은 구글 문의 폼 CTA, 오른쪽은 이메일/채널 정보. `1080px` 이하에서 1단으로 전환된다.
- 구글 문의 폼: `_config.yml`의 `contact_form_url`로 연결한다. 임베드가 아니라 새 탭 링크 방식이다.
  - 폼의 문항 구성은 `CONTACT_FORM.md`에 정의되어 있다. 폼을 수정하면 그 문서도 함께 갱신한다.
  - 채용·헤드헌팅·강의·협업·버그제보를 문의 유형으로 분기시키는 구조라 문항 수가 많다. 반드시 정의서를 먼저 본다.
  - 값이 비어 있으면 버튼 대신 `문의 폼 준비 중` 상태(`.contact-form-pending`)가 표시되므로 죽은 링크가 배포되지 않는다.
  - 구글 폼의 `보내기 > 링크`에서 복사한 응답용 URL을 넣는다. 편집용 URL(`/edit`)을 넣으면 방문자가 폼을 수정할 수 있으므로 주의한다.
- 이메일: `_config.yml`의 `contact_email`을 참조한다. 페이지에 값을 직접 쓰지 않는다.
- GitHub 링크: `https://github.com/redocu`
- 포트폴리오 PDF 링크: `/data/포트폴리오.pdf`

임베드 대신 링크 방식을 쓰는 이유: 구글 폼 iframe은 사이트의 다크모드(`body.dark-mode`)를 따르지 않아 흰 배경이 그대로 노출되고, 높이를 하드코딩해야 해서 스크롤이 이중으로 생긴다.

## 7. 공통 레이아웃 및 UI 동작

### 7.1 레이아웃

파일: `_layouts/main.html`

- `<meta charset="UTF-8">`가 선언되어 있어 한국어 콘텐츠에 적합하다.
- 공통 CSS는 `/assets/css/styles.css`에서 불러온다.
- 공통 JS는 `/assets/js/main.js`에서 불러온다.
- 모든 페이지 상단에 `nav.html`, 하단에 `footer.html`이 포함된다.

주의: `page.content_layout`일 때 `<div>`를 열고 `page.post_layout`일 때 닫는 조건이 서로 다르다. 해당 변수를 실제로 사용할 계획이라면 여는 조건과 닫는 조건을 맞춰야 한다.

### 7.2 네비게이션

파일: `_includes/nav.html`

데스크톱 기본 메뉴:

- `Home` -> `#hero`
- `전자책` -> `#ebooks`
- `Contact` -> `#contact`

기타 메뉴:

- `Sudoku 자동생성` -> `\web_page\Sudoku\index.html`

모바일 메뉴에는 `#profile`, `#learning`, `#games`, `#projects`, `#others` 링크가 남아 있다. 해당 섹션들이 현재 주석 처리되어 있으므로 모바일에서 빈 앵커 이동이 발생할 수 있다.

주의: URL 경로에는 Windows 스타일 역슬래시보다 웹 표준 슬래시(`/web_page/Sudoku/index.html`)를 쓰는 것이 안전하다.

### 7.3 스타일

파일: `assets/css/styles.css`

주요 특징:

- CSS 변수 기반 색상 테마
- 라이트/다크 모드 지원
- sticky header
- 반응형 hero 레이아웃
- 카드형 포트폴리오 슬라이더
- 모바일 분기: `1080px`, `720px`

### 7.4 JavaScript

파일: `assets/js/main.js`

주요 기능:

- 다크모드 토글
- `localStorage` 키: `portfolio-theme`
- 모바일 메뉴 열기/닫기
- 기타 메뉴 열기/닫기
- ESC 및 외부 클릭으로 메뉴 닫기
- 카드 슬라이더 좌우 버튼 노출과 스크롤

## 8. 포트폴리오 상세 페이지 명세

파일:

- `portfolio/Kyungil_Academy.md`
- `portfolio/MBC_Academy.md`

두 파일 모두 front matter로 `layout: main`을 사용한다. 본문은 HTML 카드 구조로 직접 작성되어 있다.

### 8.1 Kyungil Academy

포함 프로젝트:

- 동방플라이트
- 트릭스터 택틱스
- 리그레션
- 덕덕디펜스

주요 연결 PDF:

- `/data/동방플라이트.pdf`
- `/data/트릭스터 택틱스 기술문서.pdf`
- `/data/리그레션 기술문서.pdf`
- `/data/덕덕 디펜스 기술문서.pdf`

### 8.2 MBC Academy

포함 프로젝트:

- 파이썬 슈팅게임 - 몬스터를 찾아서
- 데이터 분석 - 여행지 추천
- 이미지 분류 - 늑대VS허스키
- 머신러닝 - 스팀 세일 할인가격 예측
- 인공지능 모델 적용 웹사이트 제작

주요 연결 PDF:

- `/data/파이썬 슈팅게임 - 몬스터를 찾아서.pdf`
- `/data/카테고리 분석에 따른 여행지 추천.pdf`
- `/data/늑대vs허스키 CNN 알고리즘 분석 테스트.pdf`
- `/data/스팀의 세일 할인가격 예측.pdf`
- `/data/인공지능모델적용웹사이트제작.pdf`

주의: 상세 페이지 일부 이미지 경로가 `/images/portfolio/...`로 되어 있는데 실제 파일은 `assets/images/portfolio/`에 있다. 깨진 이미지가 발생하지 않도록 `/assets/images/portfolio/...`로 통일하는 것이 좋다.

## 9. Python Algorithm Archive 명세

경로: `web_page/PythonArchive/`

이 앱은 Jekyll 레이아웃을 사용하지 않는 독립 정적 앱이다. 알고리즘 문제, 대회 문제, 파이썬 기초 개념을 브라우저에서 조회하고 일부 데이터를 `localStorage`로 관리한다.

### 9.1 주요 페이지

| 파일 | 역할 |
| --- | --- |
| `index.html` | 문제 목록, 검색, 알고리즘/난이도 필터 |
| `detail.html` | 문제 상세, 입력/출력/풀이 아이디어/코드 확인 |
| `contest.html` | 대회 목록, 플랫폼 필터, 정렬 |
| `contest-detail.html` | 대회별 문제 진행 현황 |
| `basics.html` | 파이썬 기초 개념 목록 |
| `basic-detail.html` | 기초 개념 상세 |
| `admin.html` | 문제/대회/JSON 관리 |
| `basic-admin.html` | 기초 개념 전체 수정 |

### 9.2 데이터 구조

파일: `web_page/PythonArchive/js/data.js`

주요 상수:

- `ALGORITHM_CATEGORIES`
- `DIFFICULTIES`
- `STATUSES`
- `RESULTS`
- `SEED_DATA`

브라우저 저장소 키:

- `algoArchive.localProblems`
- `algoArchive.deletedProblems`
- `algoArchive.localContests`
- `algoArchive.deletedContests`
- `algoArchive.theme`

`SEED_DATA`는 기본 샘플 데이터이며, 관리자 페이지에서 수정한 내용은 기본적으로 브라우저 `localStorage`에 저장된다. 다른 사용자에게 배포되는 기본 데이터를 바꾸려면 관리자 페이지에서 JSON을 내보낸 뒤 `data.js`의 `SEED_DATA`에 반영해야 한다.

### 9.3 기초 개념 데이터

파일: `web_page/PythonArchive/js/basicConcepts.js`

브라우저 저장소 키:

- `algoArchive.basicConcepts`

기본 데이터는 `SEED_DATA` 안에 있으며, `basic-admin.html`에서 수정한 내용은 브라우저에만 저장된다. 사이트 기본값을 바꾸려면 `basicConcepts.js`의 기본 데이터를 수정해야 한다.

## 10. Sudoku 자동 생성기 명세

경로: `web_page/Sudoku/`

이 앱은 Jekyll 레이아웃을 사용하지 않는 독립 정적 앱이다. 스도쿠 퍼즐 생성, 풀이 검증, 힌트, 메모, 정답 보기, 프린트 기능을 제공한다.

### 10.1 주요 파일

| 파일 | 역할 |
| --- | --- |
| `index.html` | UI 구조, 난이도/키패드/프린트 옵션 |
| `css/style.css` | 스도쿠 전용 스타일 |
| `js/sudokuSolver.js` | 스도쿠 검증/풀이/해답 수 계산 |
| `js/sudokuGenerator.js` | 난이도별 퍼즐 생성 |
| `js/ui.js` | 화면 렌더링, 입력, 저장, 프린트 |
| `js/main.js` | DOMContentLoaded 이후 초기화 |

### 10.2 주요 기능

- 난이도 선택
- 새 퍼즐 생성
- 입력 초기화
- 현재 풀이 검증
- 힌트 제공
- 메모 모드
- 정답 보기
- 프린트 출력
- 한 장/두 장 배치 출력 옵션
- 다크모드
- 기록 초기화

브라우저 저장소는 진행 중인 퍼즐 상태와 테마를 보존하는 데 사용된다.

## 11. 콘텐츠 관리 방법

### 11.1 메인 카드 추가

1. 썸네일 이미지를 `assets/images/portfolio/`에 추가한다.
2. 필요하다면 PDF를 `data/`에 추가한다.
3. 상세 페이지가 필요하면 `portfolio/새페이지.md`를 만든다.
4. `index.markdown`의 `#ebooks` 섹션 안에 `.portfolio-card`를 추가한다.
5. 카드 링크는 실제 빌드 URL과 맞춘다.

권장 상세 페이지 front matter:

```yaml
---
layout: main
title: 새 포트폴리오
permalink: /portfolio/new-portfolio/
---
```

`permalink`를 쓰면 메인 카드 링크를 `/portfolio/new-portfolio/`처럼 확장자 없이 안정적으로 운영할 수 있다.

### 11.2 PDF 교체

1. 같은 파일명으로 `data/`의 PDF를 교체하면 기존 링크를 유지할 수 있다.
2. 파일명을 바꾸는 경우 해당 PDF를 참조하는 `href`를 모두 함께 수정한다.
3. 파일명에 공백과 한글을 사용할 수 있지만, URL 호환성을 고려하면 장기적으로 영문/숫자/하이픈 기반 파일명을 권장한다.

### 11.3 이미지 교체

1. 메인 이미지: `assets/images/Profile.jpg`
2. 학원 카드 썸네일: `assets/images/portfolio/Kyungil_Academy.png`, `assets/images/portfolio/MBC_Academy.png`
3. 프로젝트 상세 이미지: `assets/images/portfolio/`

경로는 `/assets/images/...` 또는 상대 경로 `assets/images/...`로 통일하는 것이 좋다.

## 12. 배포 관리

GitHub Pages 저장소라면 보통 다음 중 하나로 배포된다.

- 사용자 페이지 저장소: `redocu.github.io`의 기본 브랜치 루트에서 자동 배포
- 프로젝트 페이지 저장소: Pages 설정에서 지정한 브랜치/폴더에서 자동 배포

관리 시 확인할 것:

- GitHub Pages 설정에서 배포 브랜치가 현재 작업 브랜치와 맞는지 확인
- `_site/`는 커밋하지 않음
- 한글 파일명이 URL에서 정상 동작하는지 배포 후 확인
- `baseurl`이 빈 문자열이므로 사용자 페이지 루트 배포에 적합함
- 프로젝트 페이지로 배포한다면 `baseurl` 조정이 필요할 수 있음

## 13. 현재 확인된 관리 이슈

우선순위 높은 항목:

- 포트폴리오 상세 링크가 빌드 결과와 다를 수 있음: `/portfolio/Kyungil_Academy` 대신 `.html` 또는 `permalink` 필요
- 상세 페이지 이미지 경로 일부가 실제 위치와 다름: `/images/portfolio/...` -> `/assets/images/portfolio/...`
- 모바일 메뉴가 비활성 섹션(`#profile`, `#learning`, `#games`, `#projects`, `#others`)을 가리킴
- `nav.html`과 일부 카드 링크에 역슬래시 URL이 있음: `\web_page\...` -> `/web_page/...`
- `_layouts/main.html`의 조건부 wrapper 닫힘 조건이 서로 다름: `content_layout`과 `post_layout` 확인 필요

정리하면 좋은 항목:

- `index.markdown`에 주석 처리된 대형 템플릿이 많아 장기 관리성이 낮음
- `_config.yml`의 `contact_form_url`이 비어 있어 Contact가 `문의 폼 준비 중` 상태임 — 구글 폼 생성 후 채워야 함
- `_config.yml`의 `user_img` 경로가 현재 assets 구조와 맞지 않음
- 이미지/PDF 파일 용량이 큰 편이므로 필요 시 압축 권장
- PythonArchive 관리자에서 수정한 내용은 브라우저 로컬 저장소에만 저장되므로 배포 데이터와 혼동하지 않도록 운영 규칙 필요

## 14. 권장 개선 순서

1. URL 경로 정리: `permalink`, `.html`, `/web_page/...`, `/assets/images/...` 통일
2. 메인 네비게이션과 실제 활성 섹션 일치
3. Contact/설정 정보 일치
4. `index.markdown`의 주석 템플릿을 별도 문서나 컴포넌트 후보로 분리
5. 포트폴리오 데이터를 `_data` 파일로 분리해 카드/상세 페이지 중복 관리 줄이기
6. PythonArchive 데이터 관리 방식을 JSON 파일 기반으로 정리할지, 로컬 편집 도구로 유지할지 결정
7. 배포 후 대표 URL, 상세 페이지, PDF, 이미지, 모바일 메뉴를 체크리스트로 검증

## 15. 관리 가능 범위

이 저장소는 다음 작업을 지속적으로 관리할 수 있는 구조이다.

- 메인 페이지 문구/이미지/카드 수정
- 포트폴리오 상세 페이지 추가/정리
- PDF와 썸네일 교체
- Jekyll 빌드/배포 오류 점검
- 링크 깨짐, 이미지 깨짐, 모바일 메뉴 오류 수정
- PythonArchive와 Sudoku 미니 앱 기능 개선
- GitHub Pages 운영 기준에 맞춘 경로/파일명 정리

현재는 데이터가 HTML 본문과 JS 파일에 직접 들어 있는 부분이 많다. 단기 수정은 빠르지만, 항목이 늘어날수록 `_data` 기반 구조나 JSON 기반 구조로 정리하는 것이 관리 비용을 크게 줄일 수 있다.
