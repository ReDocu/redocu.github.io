새싹 클로드코드 과정 · Phase 2 · Day 6 – 15

# 미니 노션 — 팀처럼, 통제하며, 지키면서 만들기

**기획(PM-Skills) → 디자인(클로드 디자인) → 개발(하네스 엔지니어링)** 을 핸드오프로 잇는 역할 분리형 구조로 미니 노션 웹서비스를 만들고, 외부 API 연동 · 인증/보안 · 구글로그인 · 자동 안전장치(훅스) · 워크트리 병렬 구현 · 이미지 스토리지까지 확장합니다.

결과물은 이 폴더의 [`02-mini-notion.html`](./02-mini-notion.html)(미니 노션)로 확인할 수 있습니다.

`● PM-Skills` `● Claude Design` `● DB 설계` `● TDD · SDD` `● API · CORS` `● 인증 · 보안` `● OAuth · JWT` `● Hooks` `● Git 워크트리` `● Supabase Storage`

---

## Phase 2의 한마디 — "팀처럼 만들고, 구조로 강제하라"

Phase 1이 "혼자서 만들 수 있다"였다면, Phase 2는 두 걸음 더 나아갑니다.

- **Week 2 (Day 6–10)** — 기획 → 디자인 → 개발을 **핸드오프**로 잇는 실무형 협업 구조. 뼈대는 **데이터베이스 설계**(정규화·UUID)와 **LLM 엔지니어링 4단계**(프롬프트→컨텍스트→하네스→루프).
- **Week 3+ (Day 11–15)** — **바깥세상과 연결하고, 지키면서 만든다.** 외부 API(CORS·프록시), 인증·인가와 암호화, 구글로그인(JWT), 훅과 Git 워크트리, 그리고 워크트리 병렬 실전과 이미지 스토리지 분리 저장.

> 반복되는 한 문장 — **모델의 선의에 의존하지 말고, 구조로 강제하라.**

## 학습 로드맵

| Day | 단계 | 주제 | 핵심 키워드 | 원문 |
|:---:|:---|:---|:---|:---|
| 6 | 기획 | 실무형 협업 구조와 기획 | 통합형 vs 분리형 · PM-Skills · 기획/인터뷰 7단계 | [book-day06.md](../result_doc/book_days/book-day06.md) |
| 7 | 디자인 | 클로드 디자인 | 디자인 시스템 · 하이파이 디자인 · 핸드오프 | [book-day07.md](../result_doc/book_days/book-day07.md) |
| 8 | 핸드오프·DB | 디자인을 코드로, DB 설계 기초 | DESIGN.md · 메타프롬프트 · 정규화 · PK/FK/ERD | [book-day08.md](../result_doc/book_days/book-day08.md) |
| 9 | DB·개발 | DB 실전과 LLM 엔지니어링 | Supabase 테이블 · UUID · LLM 4단계 · TDD/SDD | [book-day09.md](../result_doc/book_days/book-day09.md) |
| 10 | 개발 | 하네스 플러그인과 API·JSON | Superpowers/Speckit · 오픈 API · Postman · 상태코드 | [book-day10.md](../result_doc/book_days/book-day10.md) |
| 11 | 외부 연동 | 스켈레톤 UI와 CORS·프록시 | 스켈레톤 UI · SOP · CORS · 프록시 서버 | [book-day11.md](../result_doc/book_days/book-day11.md) |
| 12 | 보안 | 인증·인가와 암호화 | 인증 vs 인가 · 해시+SALT · 세션 vs 토큰 · OAuth | [book-day12.md](../result_doc/book_days/book-day12.md) |
| 13 | 보안 | 구글로그인 실습 | GCP·Supabase 연동 · JWT=인코딩 · Bearer 인가 | [book-day13.md](../result_doc/book_days/book-day13.md) |
| 14 | 자동화 | 훅스와 기능 병렬 구현 | PreToolUse/Stop · 토크노믹스 · Git 워크트리 | [book-day14.md](../result_doc/book_days/book-day14.md) |
| 15 | 실전·확장 | 워크트리 병렬 실전과 이미지 프로세스 | 기능 그룹화·병렬 통합 · 픽셀/RGB · Storage 분리 저장 | [book-day15.md](../result_doc/book_days/book-day15.md) |

주차 요약본: [book_week2.md](../result_doc/book_week/book_week2.md) · [book_week3.md](../result_doc/book_week/book_week3.md)
공용 가이드: [google-login-guide](../docs/google-login-guide.md) · [secrets-and-visibility-guide](../docs/secrets-and-visibility-guide.md) · [claude-code-parallel-guide](../docs/claude-code-parallel-guide.md) · [token-efficiency-guide](../docs/token-efficiency-guide.md)

---

## Day 6 · 실무형 협업 구조와 기획 (PM)

**배우는 것**

- AI 활용 구축 방식: **역할 통합형 vs 역할 분리형** — 실무에서 분리형을 선택하는 이유
- 역할별 AI 도구: 기획(**PM-Skills**) · 디자인(클로드 디자인) · 개발(클로드 코드)과 **핸드오프** 흐름
- PM의 세 가지 역할과 **기획/인터뷰 7단계 프로세스** (예시: 1인 여행 숙소 예약 앱)
- 클로드 코드에서 PM-Skills를 명령어로 실행하기

**실습·과제** — 나만의 **미니 노션 PRD** 만들기 (PM-Skills 사용).

**이걸 할 수 있으면 통과**

- [ ] 통합형과 분리형의 차이, 분리형이 선택되는 이유를 말할 수 있다
- [ ] PM-Skills로 기획/인터뷰 7단계를 거쳐 PRD를 뽑을 수 있다

## Day 7 · 클로드 디자인 — 디자인 시스템과 하이파이

**배우는 것**

- 미니 노션 PRD 리뷰(노션 웹서비스의 핵심 요소)
- **디자인 프로세스** 두 가지 방식과 단계별 상세 — 오늘 우리가 서 있는 위치
- **클로드 디자인**으로 ① 디자인 시스템 만들기 ② PRD로부터 **하이파이 디자인** 생성 ③ 개발 단계로 **핸드오프**

**실습·과제** — 디자인 샘플 3종을 참고해 디자인 시스템을 설정하고 하이파이 결과물을 만든다.

**이걸 할 수 있으면 통과**

- [ ] 디자인 시스템(컬러·타이포·컴포넌트)이 왜 필요한지 설명할 수 있다
- [ ] PRD → 하이파이 디자인 → 개발 핸드오프 흐름을 직접 수행할 수 있다

## Day 8 · 디자인을 코드로 넘기고, DB를 설계하기

**배우는 것**

- 디자인을 문서로 굳히기 — **DESIGN.md**(디자인의 단일 원본, source of truth)
- **메타프롬프트**("프롬프트를 만드는 프롬프트")로 DESIGN.md를 **CLAUDE.md에 등록** — 트리거/강제 행동/적용 방식
- DB 설계 기초: NoSQL vs SQL, **데이터 정규화**, 관계 3유형(**1:1 · 1:N · N:M**), **PK · FK · Join · ERD**

**실습·과제** — DESIGN.md 생성 & CLAUDE.md 등록 · 게시판 DB 정규화 · (과제) 상품 테이블 정규화.

**이걸 할 수 있으면 통과**

- [ ] 새 화면을 추가해도 톤앤매너가 유지되는 구조(DESIGN.md + CLAUDE.md)를 만들 수 있다
- [ ] 중복이 있는 테이블을 정규화하고 ERD로 그릴 수 있다

## Day 9 · DB 실전(Supabase)과 LLM 엔지니어링 4단계

**배우는 것**

- 하나의 큰 Page 테이블 → **정규화로 분리**, Supabase 기본 제공 **auth.users**와 Profile 테이블
- **auto_increment vs UUID** — 쿠팡 개인정보 유출 사례가 남긴 교훈, UUID 기반 최종 설계
- **LLM 엔지니어링 4단계**: 프롬프트 → 컨텍스트 → **하네스** → 루프
- 하네스 심화: **TDD vs SDD**, 회귀 방지, Superpowers vs Speckit 명령어, TDD+SDD 전개도

**실습·과제** — Supabase에서 Page 테이블 생성(스키마·FK 설정) · Speckit로 글자 수 계산 기능 구현.

**이걸 할 수 있으면 통과**

- [ ] PK를 UUID로 쓰는 이유를 사례로 설명할 수 있다
- [ ] TDD와 SDD가 각각 무엇을 강제하는지 구분할 수 있다

## Day 10 · 하네스 플러그인과 API·JSON

**배우는 것**

- 외부 플러그인 설치와 플러그인별 주요 명령어, TDD(Superpowers)+SDD(Speckit) 전개도 복습
- **API 엔드포인트**의 두 종류, HTTP 메서드(조회 vs 등록/수정/삭제), **JSON vs XML**
- **오픈 API**(공공데이터포털 등)와 API-Docs 읽는 법, **Postman**으로 요청 연습, **HTTP 상태코드**

**실습·과제** — 하네스 플러그인 설치 & 기능 구현 · 오픈 API로 고양이 사진 가져오기.

**이걸 할 수 있으면 통과**

- [ ] API 문서를 읽고 Postman으로 요청을 보내 응답(JSON)을 해석할 수 있다
- [ ] 상태코드(2xx/4xx/5xx)로 문제의 위치를 짚을 수 있다

## Day 11 · 스켈레톤 UI 로딩과 CORS, 그리고 프록시

**배우는 것**

- **스피너 vs 스켈레톤 UI** — 로딩 화면에 스켈레톤을 선택하는 이유
- 브라우저의 보안 규칙: **SOP**(동일 출처 정책)와 **CORS**, 간단한 요청 vs 복잡한 요청의 차단 방식 차이
- CORS가 막힌 외부 API를 우회하는 **프록시 서버**(프론트엔드 서버 또는 Supabase Edge Function)

**실습·과제** — `/speckit-specify`로 커버 이미지 API 연동 스펙 작성 → 구현 · "오리 불러오기"로 CORS 에러 직접 겪어보기.

**이걸 할 수 있으면 통과**

- [ ] 콘솔의 CORS 에러 메시지를 읽고 원인(SOP)을 설명할 수 있다
- [ ] 프록시가 필요한 경우를 판별하고 구조를 그릴 수 있다

## Day 12 · 보안 기초 — 인증·인가, 암호화·해시, 세션 vs 토큰

**배우는 것**

- 회원가입(테이블에 1줄 등록)과 로그인(등록된 회원임을 증명)의 본질
- **인증(Authentication) vs 인가(Authorization)** — 증표를 받는 일과 증표로 증명하는 일
- 개인정보는 **양방향 암호화**, 비밀번호는 **단방향 해시 + SALT**(레인보우 테이블 방어)
- 로그인 상태 유지: **세션 방식 vs 토큰 방식(JWT)**, 소셜로그인과 **OAuth**

**이걸 할 수 있으면 통과**

- [ ] 인증과 인가를 데이터 흐름으로 구분해 그릴 수 있다
- [ ] 개인정보와 비밀번호에 각각 어떤 암호화를 써야 하는지 판단할 수 있다

## Day 13 · 구글로그인 실습 — GCP·Supabase 연동과 JWT의 정체

**배우는 것**

- 소셜로그인 3단계(페이지 불러오기 → 인증 → 인가)와 세 가지 토큰(비밀 CODE · 구글 전용 · Supabase 전용)
- 연동 설정 = **서로의 값을 맞바꾸는 일**: GCP의 Client ID/Secret ↔ Supabase의 Callback URL
- ★ **JWT는 암호화가 아니라 인코딩** — 누구나 열어볼 수 있으므로 넣으면 안 되는 것들
- Network 탭에서 `Authorization: Bearer <토큰>` 헤더로 **인가 프로세스 실물 확인**, Users의 UID(PK)를 참조하는 FK 구조

**실습·과제** — 실습 A: 구글로그인 연동과 토큰 확인(8단계) · 실습 B: 프로필 수정과 인가 검증(6단계). 참고: [google-login-guide](../docs/google-login-guide.md)

**이걸 할 수 있으면 통과**

- [ ] GCP ↔ Supabase 연동 설정을 스스로 완료할 수 있다
- [ ] 토큰을 지우거나 빼고 요청해 인가가 실제로 작동함을 검증할 수 있다

## Day 14 · 훅스와 기능 병렬 구현 — 자동 안전장치와 Git 워크트리

**배우는 것**

- 사람도 AI도 잊는다 → 규칙을 문서가 아니라 **훅으로 강제**: **PreToolUse**(도구 사용 전 차단) · **Stop**(작업 종료 전 검사)
- `/update-config`로 훅 만들기, `/hooks`로 확인, 하드코딩된 설정을 **`.env.example`** 로 분리하고 `.gitignore` 정비
- **토큰맥싱 → 토크노믹스**: "많이 쓰기"가 목표가 될 때의 함정(굿하트의 법칙)
- 기능 병렬 구현의 난관 — **공통 파일 수정 충돌**: 폴더 복사는 합칠 수 없고 **Git 워크트리**만 `.git`을 공유해 통합 가능, 의존 관계 그룹화와 5단계 작업 순서

**실습·과제** — 훅 2개(PreToolUse·Stop) 등록 → env 분리 → `.gitignore` → 최종 커밋 · 기능을 워크트리에 배분해 병렬 구현. 참고: [secrets-and-visibility-guide](../docs/secrets-and-visibility-guide.md) · [claude-code-parallel-guide](../docs/claude-code-parallel-guide.md) · [token-efficiency-guide](../docs/token-efficiency-guide.md)

**이걸 할 수 있으면 통과**

- [ ] `.env` 커밋을 훅으로 차단하는 안전장치를 직접 등록할 수 있다
- [ ] 폴더 복사와 Git 워크트리의 결정적 차이를 설명할 수 있다

## Day 15 · 워크트리 병렬 실전과 이미지 프로세스 — Storage 분리 저장

**배우는 것**

- Day 14의 이론을 실전으로: 노션 기능을 **의존 관계 기준 4그룹**(게시글 CRUD · 다크모드 · 사이드바 접기 · 자기소개)으로 묶어 워크트리 4개에서 `/speckit-specify`로 **병렬 구현** — "DB 테이블 구조는 변경하면 안 돼" 같은 **제약을 스펙에 명시**
- 확인·커밋 후 **"워크트리 모두 통합해줘"** 한마디 → AI의 통합 작업 읽기: 서버 종료 → 워크트리별 diff 파악 → 순차 merge(충돌 처리) → 재기동 검증, 그리고 "네가 로그를 남겨줘" 디버깅 패턴
- **이미지 프로세스**: 사진 = 픽셀의 조합, 픽셀 = RGB 세 숫자(0~255) — 256인 이유는 **8비트 = 2⁸**, 이미지의 DB 저장 타입(BLOB)과 직접 저장의 문제
- **비동기 분리 저장**: 실물은 **Supabase Storage**(버킷 · UUID 파일명 · S3 호환)에, DB에는 **다운로드 주소만** — 스토리지경로는 `.env` · 파일경로는 DB에 나눠 관리

**실습·과제** — 워크트리 4개 병렬 구현 → 통합 · `profile-image` 버킷 생성 → 프로필 테이블에 이미지주소 컬럼 추가 → 프로필 이미지 업로드 기능 연동(uuidv4 파일명) → 환경변수 수동 적용. 참고: [claude-code-parallel-guide](../docs/claude-code-parallel-guide.md)

**이걸 할 수 있으면 통과**

- [ ] 기능을 의존 관계로 그룹화해 워크트리에 배분하고, 충돌 없이 한 코드베이스로 통합할 수 있다
- [ ] 이미지를 DB에 직접 넣지 않는 이유(비동기 프로세스)를 설명하고, Storage 업로드 → 주소를 DB에 저장하는 흐름을 그릴 수 있다

---

## Phase 2 졸업 체크리스트

- [ ] 기획(PRD) → 디자인(디자인 시스템·하이파이) → 개발 핸드오프를 한 사람이 이어서 수행했다
- [ ] 미니 노션이 정규화된 UUID 기반 DB(Supabase) 위에서 동작한다
- [ ] 외부 API를 스켈레톤 UI + 프록시 구조로 연동했다
- [ ] 구글로그인이 붙어 있고, 인가(Bearer 토큰)가 작동함을 검증했다
- [ ] 훅(PreToolUse·Stop)이 등록되어 비밀 값 유출을 구조로 막는다
- [ ] 기능 4그룹을 워크트리로 병렬 구현하고 충돌 없이 한 코드베이스로 통합했다
- [ ] 프로필 이미지가 Storage 버킷(UUID 파일명)에 저장되고, DB에는 다운로드 주소만 남는다

**이전 단계 ←** [Phase 1 · 소개 페이지](../Phase1_IntroducePage/README.md) — 혼자서 만들고 배포하는 기본기.
