# redocu.github.io

Jekyll 기반 개인 포트폴리오 정적 사이트입니다. 메인 포트폴리오 페이지, 학원별 학습 정리 페이지,
독립 실행형 웹 미니앱(스도쿠·카쿠로)을 GitHub Pages로 함께 배포합니다.

## 기술 스택

- **Jekyll** `~> 4.3.4` (테마: minima, 플러그인: jekyll-feed)
- **Bundler** 로 Ruby 의존성 관리 (`Gemfile` / `Gemfile.lock`)
- 프론트엔드: HTML / Markdown / CSS / Vanilla JavaScript (외부 프레임워크 없음)
- 배포: GitHub Pages

## 로컬 실행

```bash
bundle install              # 최초 1회, 의존성 설치
bundle exec jekyll serve    # 개발 서버 실행 → http://localhost:4000
bundle exec jekyll build    # 정적 빌드 → _site/ 에 생성
```

> `_config.yml` 수정 후에는 서버를 재시작해야 반영됩니다.
> `_site/`, `.jekyll-cache/` 등 빌드 산출물은 `.gitignore`로 제외되어 있습니다.

## 디렉터리 구조

```text
.
├── _config.yml            # 사이트 설정 (제목, 연락처, 위키 렌더링, 게시 제외 목록)
├── index.markdown         # 메인 페이지 (인트로 · Hero · 카드 슬라이더 · 위키 · 학원 · Contact)
├── home.pen               # 디자인 원본 (pen.dev, 게시 안 됨)
├── 404.html               # 404 + 개편 전 URL 리다이렉트 표
├── _data/                 # projects.yml(카드·상세) · courses.yml(위키 6과정) · wiki_parts.yml(파트명) · playlist.yml(배경음악)
├── _layouts/              # main · project · academy · academy-part · wikidoc
├── _includes/             # nav · footer · player · intro · card · cta · timeline · wiki_curriculum · wikidoc_toc
├── _docs/                 # 운영 문서 (게시 안 됨): SITE_SPEC, CONTACT_FORM, PROFILE_README, kakuro-gdd
├── _prompts/              # 학습문서 생성용 프롬프트 (게시 안 됨)
├── assets/
│   ├── css/               # styles.css(토큰·공통 컴포넌트·모션) + 페이지별 css (front matter `css:`)
│   ├── js/                # main.js(내비·모션 API) + 페이지별 js (front matter `js:`)
│   ├── audio/             # 배경음악 (_data/playlist.yml)
│   ├── images/            # 프로필 이미지
│   └── thumbs/            # 모든 카드 썸네일 (wiki-* · academy-* · ky-* · mbc-* · 프로젝트명)
├── academy/               # 학원 교육 → /academy/<학원>/
│   ├── kyungil/               # 경일게임아카데미: index.md + KY16 기술문서·학습정리·ZIP
│   ├── mbc/                   # MBC컴퓨터아카데미: index.md + 학습문서 HTML·PDF
│   └── codecamp/              # 코드캠프: index.md + part1~4 가이드와 결과물
├── wiki/                  # 학습 위키 → /wiki/
│   └── <과정>/curriculum/ · lessons/   # game-to-unity · data-to-vision · git · mlops · aws · info-engineer
├── projects/              # 프로젝트 → /projects/ (현황판) · /projects/<slug>/ 상세 7개
├── about/ teaching/ music/ # 소개 · 강의 제안 · 사운드 크레딧
├── apps/                  # 미니앱 허브(index.html) + 독립 실행형 웹앱 (순수 HTML/CSS/JS)
│   ├── puzzle-lab/ sudoku/ kakuro/
└── files/                 # 포트폴리오·기술문서 PDF, 이력서 (영문 파일명)
```

## 이름 규칙

- 공개 URL이 되는 폴더·파일은 **소문자 영문 + 하이픈**(`kebab-case`)으로 짓습니다. 한글·공백은 쓰지 않습니다.
- 썸네일은 위치와 상관없이 `assets/thumbs/`에 모읍니다.
- 게시하면 안 되는 문서는 `_docs/`처럼 밑줄로 시작하는 폴더에 둡니다.

## 콘텐츠 추가 가이드

- **프로젝트**: `_data/projects.yml`에 항목을 추가하고 `projects/<slug>/index.md`(layout: project)를 만들면 메인 카드와 상세 페이지가 함께 생깁니다. 썸네일은 `assets/thumbs/`(WebP).
- **모션**: 요소에 `data-reveal`(up·fade·left·right·scale·clip), 부모에 `data-stagger`, 숫자에 `data-count`. 모션 줄이기 설정을 자동으로 따릅니다.
- **학원 학습문서**: 원본 HTML/PDF를 `academy/<학원>/`에 넣고, 같은 폴더의 `index.md`에서 링크합니다.
  학습문서 스타일은 `academy/mbc/study-note.css`(노트북 스타일)를 사용하고,
  생성 프롬프트는 `_prompts/`에 보관합니다.
- **학습 위키**: `wiki/<과정>/lessons/<파트>/`에 md 파일을 추가하면 목차에 자동으로 붙습니다.
  새 과정은 `_data/courses.yml`에, 새 파트 폴더 이름은 `_data/wiki_parts.yml`에 등록합니다. 커리큘럼 로드맵·검색 색인(`/wiki/search.json`)은 자동 생성됩니다.
- **웹 미니앱**: `apps/<앱이름>/`에 독립 폴더로 추가하면 별도 빌드 없이 그대로 서빙됩니다.

자세한 페이지·섹션 명세는 [SITE_SPEC.md](_docs/SITE_SPEC.md)를 참고하세요.
