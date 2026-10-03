# PA_ 포트폴리오

PersonalAssistant(PA_)를 소개하는 Jekyll 페이지 묶음. 1인 개발 스튜디오용 업무 앱(React 19 + Cloudflare Workers / D1 / R2)을 3일(2026-09-27 ~ 09-29) 동안 PRD → 사용성 테스트 → 디자인 → 구현 → 배포까지 진행한 기록이다.

## 파일

| 파일 | 경로 (permalink) | 내용 | 읽는 사람 |
|---|---|---|---|
| `index.md` | `/personal-assistant/` | 소개. 왜 만들었나, 사용자·사용 시점, 설계 원칙, 모듈, 눈여겨볼 구현, 만든 과정 | 누구나 (먼저 읽을 것) |
| `spec.md` | `/personal-assistant/spec/` | 기술명세서. 아키텍처, 화면 31개, 기능 ID, 데이터 모델 28테이블, API, 횡단 규칙, 보안, 비기능 요구, 미구현 | 무엇을 만들었는지 확인할 사람 |
| `tech.md` | `/personal-assistant/tech/` | 기술문서. 저장소 구조, 요청 흐름, 서버·프론트 설계, 핵심 알고리즘, 보안·백업 구현, 테스트, 개발 프로세스 | 어떻게 만들었는지 볼 개발자 |
| `demo.md` | `/personal-assistant/demo/` | 체험판 뷰어. `demo/index.html`(단일 파일 빌드, 해시 라우팅)을 iframe으로 띄운다 | 직접 눌러볼 사람 |
| `screens.md` | `/personal-assistant/screens/` | 실제 구현 화면 캡처 갤러리 (`screenshots/`, 모듈별) | 화면을 훑어볼 사람 |
| `img/` | `/personal-assistant/img/` | 디자인 시안 캡처 4장 | — |
| `demo/` | `/projects/spm/demo/` | 체험판 원본 (자체 디자인 유지) | — |
| `screenshots/` | `/projects/spm/screenshots/` | 실제 화면 캡처 33장. 파일명 `NN-n-모듈-화면.png`, NN이 screens.md 절 순서 | — |

### 이미지

| 파일 | 쓰는 곳 | 내용 |
|---|---|---|
| `home.png` | index 상단 | 홈 화면 (1440×900) |
| `outsourcing.png` | index "무엇이 있나" | 외주 목록과 정산대기 절 |
| `mobile-capture.png` | index "무엇이 있나" | 폰 전용 캡처 `/c` |
| `common-ui.png` | index "만든 과정" | 토스트·빈 상태·토큰·단축키 |

## Jekyll 사이트에 올리기

1. 이 폴더(`index.md` · `spec.md` · `tech.md` · `img/`)를 사이트 루트에 `personal-assistant/` 이름으로 복사한다. `README.md`는 빼도 된다.
2. 결과 경로는 `/personal-assistant/`, `/personal-assistant/spec/`, `/personal-assistant/tech/`.
3. 경로를 바꾸려면 세 파일의 `permalink`와 본문의 `/personal-assistant/...` 링크·이미지 경로를 함께 바꾼다.
4. front matter의 `layout: page`는 사이트 테마에 맞게 고친다 (`page` / `default` / `post` 등).

링크와 이미지는 Liquid `relative_url` 필터를 쓰므로 GitHub에서 바로 열면 깨져 보인다. Jekyll로 빌드해야 정상 표시된다.

## 내용 갱신 시

- 수치(화면 수, 테이블 수, API 수, 코드 줄 수)는 index · spec · tech 세 곳에 흩어져 있으니 함께 고친다.
- 캡처를 추가·교체하면 `screens.md`의 목록과 index의 "33장" 표기를 함께 고친다.
- 기능 ID와 미구현 목록의 원본은 `docs/PRD.md`, 운영 상태는 `docs/HANDOVER.md`다.
