# redocu.github.io

Jekyll 기반 개인 포트폴리오 정적 사이트입니다. 메인 포트폴리오 페이지, 학원별 학습 정리 페이지,
독립 실행형 웹 미니앱(스도쿠·카쿠로·파이썬 아카이브)을 GitHub Pages로 함께 배포합니다.

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
├── _config.yml            # 사이트 설정 (제목, 프로필, 테마)
├── index.markdown         # 메인 페이지 (Hero · 포트폴리오 카드 · Contact)
├── 404.html
├── _layouts/main.html     # 기본 레이아웃
├── _includes/             # nav.html, footer.html
├── _prompts/              # 학습문서 생성용 프롬프트 모음
├── assets/                # css, js, 이미지 (포트폴리오 썸네일 포함)
├── Academy/               # 학원별 학습 정리 페이지
│   ├── MBC_Academy.md         # MBC 아카데미 (AI/데이터 학습문서·PDF)
│   ├── CodeCamp_Academy.md    # 코드캠프 (Phase별 실습 페이지)
│   ├── Kyungil_Academy.md     # 경일게임아카데미 (KY16 프로젝트)
│   ├── MBCAcademy/            # 학습문서 HTML/PDF 원본
│   ├── CodeCampAcademy/       # Phase1 소개 페이지, Phase2 미니노션
│   └── KYGameAcademy/         # KY16 기술문서·학습정리
├── project/               # 개인 프로젝트 자료 (배너, 기술문서, 다운로드)
│   ├── CSGP/                  # C언어 게임 개발 프레임워크 + 학습 문서(study_doc)
│   ├── ClaudeCockpit/         # Claude Code 세션 대시보드
│   └── KnowledgeSharingCenter/# 지식 나눔터
├── web_page/              # 독립 실행형 웹앱 (Jekyll 비의존, 순수 HTML/CSS/JS)
│   ├── Kakuro/                # 카쿠로 퍼즐 게임
│   ├── Sudoku/                # 스도쿠 게임
│   └── PythonArchive/         # 파이썬 문제풀이 아카이브
├── data/                  # 포트폴리오·기술문서 PDF, 이력서
└── SITE_SPEC.md           # 사이트 상세 명세 문서
```

## 콘텐츠 추가 가이드

- **포트폴리오 카드**: `index.markdown`의 `.portfolio-card` 블록을 복사해 추가합니다.
  썸네일은 `project/<이름>/banner.png` 또는 `assets/images/portfolio/`에 둡니다.
- **학원 학습문서**: 원본 HTML/PDF를 `Academy/<학원>/`에 넣고, 해당 학원 `.md` 페이지에서 링크합니다.
  학습문서 스타일은 `Academy/MBCAcademy/study-note.css`(노트북 스타일)를 사용하고,
  생성 프롬프트는 `_prompts/`에 보관합니다.
- **웹 미니앱**: `web_page/<앱이름>/`에 독립 폴더로 추가하면 별도 빌드 없이 그대로 서빙됩니다.

자세한 페이지·섹션 명세는 [SITE_SPEC.md](SITE_SPEC.md)를 참고하세요.
