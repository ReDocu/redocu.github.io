---
layout: doc
title: "PA_ 기술명세서"
description: "PersonalAssistant(PA_) 시스템 구성, 화면·기능·데이터·API 명세, 횡단 규칙, 보안, 비기능 요구."
permalink: /personal-assistant/spec/
---

[← 소개]({{ '/personal-assistant/' | relative_url }}) · [기술문서 →]({{ '/personal-assistant/tech/' | relative_url }})

| 항목 | 내용 |
|---|---|
| 대상 | PersonalAssistant (앱 이름 `PA_`), Worker 이름 `spm` |
| 기준 | PRD v0.5 (2026-09-28) · 구현 범위 v0.1 전체 + v0.2 대부분 · 기준일 2026-09-29 |
| 사용자 | 1인 (개인사업자 · 1인 개발 스튜디오) |
| 비목표 | 다중 사용자·협업, 은행 API 연동, 자동 환율 변환, 모바일 네이티브 앱, 게이미피케이션, 세금 신고 대행 |

## 1. 시스템 개요

### 1-1. 목표 지표

| 목표 | 지표 |
|---|---|
| 아침 30초 파악 | 홈 1화면에 5개 역할 신호 모두 노출, 1440×900에서 스크롤 없이 |
| 캡처 5초 | 단축키 + Enter, 확인 0단계. 모바일에서도 동일 |
| 미수금 누락 0 | 정산대기 건이 홈 상단에 상시 노출 |
| 만료 누락 0 | D-30 이내 도메인·SSL·구독·라이선스 달력, D-7 홈 노출 |
| 손익 파악 | 월별 매출·비용·순이익 1페이지 |
| 중복 0 | 같은 결제가 장부에 2행 이상 생기지 않음 |
| 데이터 유실 0 | JSON 전체 내보내기 + 첨부 포함 ZIP + 일일 자동 백업(별도 버킷) |

### 1-2. 기능 트리

```text
PA_
├── 0. 캡처 / 인박스     모든 입력의 관문 (데스크톱 Ctrl+K · 모바일 /c)
├── 1. 홈 (오늘)
├── 2. 일정              달별 현황판 · 일별 기록지
├── 3. 프로젝트          메이커
├── 4. 외주              프리랜서
├── 5. 배포·운영         운영자
├── 6. 장부              사업자
├── 7. 지식              학습자: 자료수집 · 위키
├── 8. 툴                만든 툴 · 쓰는 툴 · 후보
├── 9. 통계
└── 10. 설정 / 공통
```

## 2. 아키텍처

```text
 브라우저 (데스크톱 1440 기준 · 폰은 /c)
 ┌──────────────────────────────────────────────┐
 │ React 19 SPA  (react-router 8, Tailwind v4)   │
 │   src/pages/<모듈>/   routes · bare(/c, /lock)│
 │   src/lib/api.ts      fetch('/api/…')         │
 └───────────────┬──────────────────────────────┘
                 │ HTTPS (same-origin)
 ┌───────────────▼──────────────────────────────┐
 │ Cloudflare Worker  "spm"                     │
 │   정적 자산: dist/client (SPA fallback)       │
 │   /api/* → Hono (run_worker_first)            │
 │     auth 미들웨어 (PIN 세션)                  │
 │     /api/<모듈>/…   도메인 로직               │
 │     /api/t/:table   범용 CRUD                 │
 │     /api/files      첨부 업로드/다운로드      │
 │   scheduled(): 매일 22:00 UTC (07:00 KST)     │
 └──────┬──────────────┬───────────────┬────────┘
        │ 바인딩 DB    │ FILES         │ BACKUP
 ┌──────▼─────┐ ┌──────▼──────┐ ┌──────▼───────┐
 │ D1  "pa"   │ │ R2 pa-files │ │ R2 pa-backup │
 │ SQLite 28표│ │ 첨부·툴 파일│ │ 일일 JSON +  │
 │            │ │             │ │ 첨부 사본    │
 └────────────┘ └─────────────┘ └──────────────┘
        외부: Discord Webhook(아침 요약) · 링크 메타 조회 · Cloudflare Access JWKS
```

| 구성요소 | 이름 | 바인딩 | 역할 |
|---|---|---|---|
| Worker | `spm` | — | `worker/index.ts`. 정적 자산 서빙 + API + 크론 |
| D1 | `pa` | `DB` | SQLite. 스키마 `migrations/0001_init.sql` |
| R2 | `pa-files` | `FILES` | 첨부(`att/…`), 툴 배포 파일(`tools/<toolId>/…`) |
| R2 | `pa-backup` | `BACKUP` | 매일 `backup-YYYY-MM-DD.json` + `files/<key>` 사본. 앱은 삭제하지 않음 |
| Cron | `0 22 * * *` | — | 백업 · 아침 알림 · 고정비 자동 거래 · 세션 정리 · 파일 정리 |
| Access (선택) | — | `ACCESS_TEAM`, `ACCESS_AUD` 시크릿 | 사이트 앞 이메일 OTP 관문. PIN 분실 재설정의 본인 확인 |

외부 호출은 키가 필요 없는 것뿐이다. DB·R2는 바인딩으로 접근하므로 별도 비밀번호·API 키가 없다.

## 3. 기술 스택

| 영역 | 선택 | 버전 | 비고 |
|---|---|---|---|
| UI | React | 19.3 | 함수 컴포넌트, 훅만 사용 |
| 라우팅 | react-router | 8.4 | `createBrowserRouter`, 모듈별 `routes` 배열 합성 |
| 스타일 | Tailwind CSS | 4.3 | `@theme` 토큰 = 디자인 파일 변수 그대로. 커스텀 유틸리티 7개 |
| 번들 | Vite | 8.3 | `@cloudflare/vite-plugin` 1.61로 워커·로컬 D1/R2 시뮬레이션 동시 구동 |
| 언어 | TypeScript | 7.0 | `strict`, `noEmit`, `tsc -b` 로 타입 검사만 |
| 서버 | Hono | 4.13 | `basePath('/api')`, 쿠키 헬퍼 |
| 런타임 | Cloudflare Workers | compat 2026-09-01 | `wrangler` 4.142 |
| 데이터 | Cloudflare D1 (SQLite) | — | 마이그레이션 디렉터리 `migrations/` |
| 파일 | Cloudflare R2 | — | 버킷 2개 (앱 / 백업) |
| 폰트 | Archivo · Archivo Black · Space Mono | Google Fonts | 본문 / 제목 / 숫자·라벨 |
| 의존성 정책 | 런타임 의존성 4개 | — | hono, react, react-dom, react-router. ZIP·CRC·파서 등은 직접 구현 |

## 4. 화면 명세

네비 레이아웃(상단 검은 바, 메뉴 9개, 날짜, 설정 톱니) 안의 화면과 레이아웃 밖 화면(`bare`)으로 나뉜다.

| 경로 | 화면 | 모듈 | 내용 |
|---|---|---|---|
| `/` | 홈 | home | HOME-01~06 |
| `/inbox` | 인박스 | capture | 미처리 항목, 목적지 9개, 단축키 1~9 |
| `/c` (bare) | 모바일 캡처 | capture | 폰 폭 전용. 입력창 + 최근 인박스 5건. PWA `start_url` |
| `/lock` (bare) | PIN 잠금 | settings | PIN 입력, 실패 횟수, 잠금 해제 시각 |
| `/settings` | 설정 | settings | PIN, 과세 유형, 통화, 카테고리, 테마, Webhook, 내보내기 |
| `/schedule` | 달별 현황판 | schedule | 월 캘린더, 일정 CRUD, 자동 표시, 기록 띠, 노트 첫 줄 |
| `/schedule/:date` | 일별 기록지 | schedule | 타임라인 블록, 할 일, 백로그, 데일리 노트, 그날 일정 |
| `/projects` | 프로젝트 목록 | projects | 상태별 그룹, 진행률, 이번 주 시간, 다음 마감, 연결 표시 |
| `/projects/board` | 보드 | projects | 전체 프로젝트 칸반 뷰 |
| `/projects/:id` | 프로젝트 상세 | projects | 칸반, 마일스톤, 회고, 시간, 연결 탭 |
| `/projects/:id/gate` | 게이트 | projects | G0~G4 입력 |
| `/outsourcing` | 외주 목록 | outsourcing | 상단 카드 3, 정산대기 절, 단계 필터 |
| `/outsourcing/:id` | 외주 상세 | outsourcing | 단계 전이, 입금 기록, 발주처, 첨부, 메모, 복제 |
| `/ops` | 운영 대시보드 | ops | 배포물 상태, 만료 D-30, 월 비용, 미해결 장애, 최근 배포 |
| `/ops/platforms` | 플랫폼 카탈로그 | ops | 기본 6 + 직접 추가 |
| `/ops/:id` | 배포물 상세 | ops | 환경, 배포 이력·롤백, 심사, 장애, 공유 비용 |
| `/ledger` | 장부 | ledger | 월 요약, 거래 목록, 고정비, 세금 일정 3건 |
| `/ledger/tx/:id` | 거래 편집 | ledger | 공급가·부가세·공제·원화 청구액, 증빙 첨부 |
| `/ledger/fixed/:id` | 고정비 편집 | ledger | 주기, 결제일, 시작·종료일, 매칭 키워드, 최근 거래 12건 |
| `/ledger/clients` | 거래처 | ledger | 클라이언트/공급처, 올해 합계, 미수금 |
| `/ledger/clients/:id` | 거래처 편집 | ledger | 세금 방식, 결제 조건 일수 |
| `/ledger/tax` | 세금 | ledger | 과세 유형별 일정, 매출·매입세액, 원천징수, 영세율 |
| `/ledger/report` | 리포트 | ledger | 월별 손익, 프로젝트별 수익성, 클라이언트별, 카테고리 추이 |
| `/knowledge` | 자료수집 | knowledge | 카테고리, 읽음 상태, 썸네일 |
| `/knowledge/r/:id` | 자료 상세 | knowledge | 본문, 위키 승격 |
| `/knowledge/wiki` | 위키 목록 | knowledge | 최근 수정순, 폴더·태그 |
| `/knowledge/wiki/:id` | 위키 페이지 | knowledge | 마크다운, `[[링크]]`, 백링크 |
| `/tools` | 툴 | tools | 만든 툴(파일·용량 게이지) / 쓰는 툴(구독 D-day) |
| `/tools/candidates` | 후보 툴 | tools | 검토 중, 비교 메모 |
| `/tools/:id` | 툴 상세 | tools | 파일 업로드, 라이선스·구독, 환경 메모 |
| `/stats` | 통계 | stats | 주/월/년 전환 |
| (전역) | 캡처 오버레이 | capture | Ctrl+K 토글. 어느 화면에서나 |
| (전역) | 오류 화면 | main | 404 "없는 화면" / 런타임 오류 |

## 5. 기능 명세

PRD의 기능 ID를 그대로 쓴다. 우선순위 Must/Should/Could 중 구현된 것을 적고, 미구현은 15장에 모았다.

### 5-0. 캡처 / 인박스

| ID | 기능 | 규칙 |
|---|---|---|
| CAP-01 | 전역 캡처 | Ctrl+K 토글. Enter 한 번에 인박스 저장, 확인 없음 |
| CAP-02 | 유형 자동 추정 | URL → 자료 / 코드블록 → 아이디어 / 날짜+시간 → 일정 / 시간만(2h) → 타임로그 / 날짜만 → 할 일 / 금액+메모 → 장부 비용 / 그 외 → 아이디어. 배지로 미리 표시 |
| CAP-03 | #프로젝트 연결 | 텍스트 속 첫 `#태그`가 존재하는 프로젝트 태그면 projectId로 연결. 없으면 "미지정" |
| CAP-04 | 인박스 분류 | 목적지 9개: 일정 · 할 일 · 타임로그 · 프로젝트(씨앗) · 자료 · 위키 · 외주 · 장부 · 배포. 단축키 1~9. 이동 되돌리기 |
| CAP-06 | 모바일 캡처 | `/c`. PWA 매니페스트(`display: standalone`) |
| 규칙 | 캡처 타임로그 배치 | 시작 시각이 없으면 오늘 마지막 블록 끝(없으면 현재 시각 − 길이)부터. 겹치면 뒤로 민다 |

### 5-1. 홈

| ID | 블록 | 규칙 |
|---|---|---|
| HOME-01 | 캡처 바 | 입력창 + 인박스 미처리 수. 항상 최상단 |
| HOME-02 | 지금 봐야 할 것 | ① 미해결 장애 ② 정산대기 미수금 ③ 정산 예정일 경과 ④ D-7 만료(도메인·SSL·구독) ⑤ 지난 마감(마일스톤·태스크·외주) ⑥ 심사 반려. 이 순서. 최대 3줄 + "+N 더". 비면 블록 숨김 |
| HOME-03 | 오늘 | 오늘 일정, 기한 오늘 이하 미완료 태스크, 14일 내 마감 D-day, 어제 기록 띠(수면 제외, 프로젝트 색) |
| HOME-04 | 프로젝트·운영 | 좌: 상태 "진행" 프로젝트 진행률(최근 활동순) / 우: 라이브·점검·장애·심사중 배포물(장애 → 점검 → 나머지 순) |
| HOME-05 | 이번 달 | 통화별 매출·비용·순이익, 월 고정비(연 결제 ÷12), 다음 결제 D-day, 다음 세금 D-day |
| HOME-06 | 읽을 것 | 미읽음 수, 정리 대기(읽음) 수 |

### 5-2. 일정

| ID | 기능 | 규칙 |
|---|---|---|
| MON-01 | 월 캘린더 | 셀 클릭 → 일별 기록지 |
| MON-02 | 일정 CRUD | 반복 daily / weekly / monthly, 회차 예외(건너뜀·이동), 메모, 프로젝트·외주 연결 |
| MON-03 | 자동 표시 | 태스크 기한, ◆마일스톤, 외주 납품·정산 예정일, 도메인·SSL 만료(D-30부터), 툴 갱신일, 고정비 결제일, 세금 일정 |
| MON-04 | 셀 레이어 | 컨디션 / 기록 띠(프로젝트 색 비율) / 일정 / 자동 표시 / 노트 첫 줄 |
| DAY-01 | 타임라인 블록 | 빈 슬롯 클릭 → 입력 → Enter. 30분 스냅 |
| DAY-02 | 프로젝트 색 | `#프로젝트` 포함 시 색 표시, 통계 집계 |
| DAY-03 | 활동 분류 | 학습 / 작업 / 휴식 / 수면 / 이벤트 / 기타. 기본 기타 |
| DAY-04 | 자동 백로그 | 프로젝트 없는 미완료 태스크, 기한(없으면 생성일) +7일 경과 시 `backlogAt` 기록 |
| DAY-05 | 일정 → 기록 복사 | 지난 시간 일정을 타임로그(활동 "이벤트")로. 이미 있으면 건너뜀 |
| DAY-06 | 데일리 노트·컨디션 | 날짜당 1행 upsert. 첫 줄은 달력 셀에 표시 |
| DAY-07 | 어제 블록 복사 | 같은 시각·텍스트가 있으면 건너뜀 |
| 규칙 | 시간 집계 | 수면 제외 모든 블록. 프로젝트 시간은 연결 블록만. 주는 월요일 시작 |

### 5-3. 프로젝트

| ID | 기능 | 규칙 |
|---|---|---|
| PRJ-01 | 씨앗 등록 | 제목만 필수. 태그는 제목에서 공백 제거, 전체 유일(충돌 시 `-2`, `-3`). 색 6종 순환 |
| PRJ-02 | 상태 | 대기 / 진행 / 운영 / 업데이트 / 완료 / 폐기 |
| PRJ-03 | 게이트 | G0 아이디어 / G1 킥오프(목적·타겟·범위 In/Out) / G2 개발(스택·저장소) / G3 출시 / G4 회고. 순서 강제 없음 |
| PRJ-04 | 칸반 | todo / doing / done. 진행률 = done ÷ 전체 |
| PRJ-06 | 마일스톤 | 달력 ◆, 홈 마감 D-day |
| PRJ-07 | 시간 집계 | 누계, 이번 주, 최근 5일 |
| PRJ-08 | 연결 탭 | 배포물 / 외주 / 장부 거래(kind·통화별 합) / 위키 / 자료 / 툴 |
| PRJ-10 | 회고 미작성 | G4 네 칸이 모두 비면 미작성 표시 |
| 규칙 | 태스크 통합 | 할 일과 칸반 카드는 같은 `task`. 프로젝트 없는 태스크 = 할 일. `#프로젝트` 붙은 태스크 = 칸반 todo. 홈 "할 일 N" = 기한 오늘 이하 미완료 전부 |

### 5-4. 외주

| ID | 기능 | 규칙 |
|---|---|---|
| OUT-01 | 등록 | 제목만으로 저장 |
| OUT-02 | 단계 | 문의 / 견적 / 계약 / 작업중 / 납품 / 정산완료 / 무산 |
| OUT-03 | 발주처·계약금·통화 | 계약금은 공급가. KRW / USD / EUR / JPY 통화별 합산, 환산 없음 |
| OUT-04 | 입금 기록 | 1건씩(라벨, 날짜, 금액). 세금 방식에 따라 공급가·부가세·공제액 자동 분리. 음수 = 환불 |
| OUT-05 | 정산대기 절 | 납품 단계 + 미수금 > 0. 홈 HOME-02 |
| OUT-07 | 상단 카드 | 진행 중 계약액(계약·작업중) / 미수금 / 올해 정산(입금 합, 통화별) |
| OUT-08 | 정산일 자동 기록 | 정산완료로 넘긴 날 `settledAt`. 미수금 0일 때만 허용. 되돌리면 삭제 |
| OUT-10 | 장부 연동 | 입금 1건 → 장부 매출 거래 1건(origin `payment`). 장부에서 수정·삭제 403 |
| OUT-11 | 정산 예정일 | 납품 시 납품일 + 발주처 결제 조건 일수(기본 7) 자동. 경과 시 HOME-02 |
| OUT-12 | 계약서·메모 | 첨부 N개, 마크다운 메모 |
| OUT-13 | 다음 달 복제 | 제목의 "N월" +1, 발주처·계약금·통화·세금 방식·프로젝트 복사, 계약 단계 |
| OUT-14 | 무산 처리 | 언제든 가능. 받은 입금 유지 |

**미수금 계산** (세금 방식은 외주 건 → 발주처 → 기본 `세금계산서` 순으로 결정):

| 세금 방식 | 청구 총액 | 입금 입력값 | 자동 분리 | 미수금 |
|---|---|---|---|---|
| 세금계산서 `invoice` | 공급가 × 1.1 | 받은 금액 | 공급가 = ÷1.1, 부가세 = 나머지 | 청구 총액 − Σ(공급가 + 부가세) |
| 3.3% 원천징수 `withholding` | 공급가 | 공급가 기준 | 공제 = 3.3%, 실수령 = 나머지 | 공급가 − Σ공급가 (공제분을 입금으로 간주) |
| 없음 `none` | 공급가 | 받은 금액 (+ 원화 실수령액 선택) | 없음 | 공급가 − Σ입금 |

### 5-5. 배포·운영

| ID | 기능 | 규칙 |
|---|---|---|
| OPS-01 | 대시보드 | 배포물 상태, 만료 D-30(도메인·SSL·툴 구독), 월 비용(환경 전용 비용, 통화별), 미해결 장애, 최근 배포 5건 |
| OPS-02 | 배포물 | 유형 web / game / url, 플랫폼, URL, 현재 버전, 소속 프로젝트 |
| OPS-03 | 상태 | 개발 / 심사중 / 라이브 / 점검 / 장애 / 종료 |
| OPS-04 | 플랫폼 카탈로그 | 기본: Vercel, Cloudflare, Netlify, GitHub Pages, itch.io, Steam + 직접 추가 |
| OPS-05 | 환경 | prod / staging, 도메인, 도메인·SSL 만료일, 전용 비용·주기 |
| OPS-06 | 배포 이력 | 버전, 배포일, 요약, 체크리스트(빌드·마이그레이션·스모크·롤백 준비·공지). 새 배포 → 현재 버전 갱신. 롤백 → 직전 유효 배포 버전으로 |
| OPS-07 | 심사 | 제출일, 버전, 상태(심사중 → 배포물 심사중 / 승인 → 라이브 / 반려 → HOME-02), 반려 사유 |
| OPS-08 | 장애 | 발생 → 원인 → 조치 → 재발방지. 기록 시 직전 상태 저장 후 "장애". 해결은 조치 입력 후만, 미해결 장애가 없어지면 직전 상태 복귀 |
| OPS-09 | 비용 소유자 | 배포물 전용 비용(도메인 등)만 환경에. 플랫폼 계정 구독은 툴에서 입력하고 배포물 화면엔 "공유 비용"으로 참조만 |

### 5-6. 장부

| ID | 기능 | 규칙 |
|---|---|---|
| LED-01 | 거래 | 날짜, 금액, 통화, 원화 청구액, 공급가·부가세·공제, 매출/비용, 카테고리, 결제수단, 메모, 거래처·프로젝트·외주 연결, 출처(manual / payment / fixedCost / csv), 상태(auto / confirmed) |
| LED-02 | 카테고리 | 장비 / SW구독 / 서버·인프라 / 통신 / 외주비 / 교육 / 접대 / 기타. 이름 변경은 거래·고정비·예산에 일괄 적용 |
| LED-03 | 결제수단 | 사업자 카드 / 계좌 / 현금 |
| LED-04 | 고정비 | 월/연 주기, 결제일(연은 결제월), 시작·종료일(해지 = 종료일), 매칭 키워드(쉼표 구분), 소유자(tool / environment / manual). 결제일에 거래 자동 생성 |
| LED-05 | 거래처 | 클라이언트 / 공급처, 이메일·전화, 세금 방식, 결제 조건 일수, 올해 합계·미수금 |
| LED-06 | 세금 | 아래 표. 매출세액 = 세금계산서 방식 매출의 부가세, 매입세액 = 증빙 있는 비용의 부가세, 원천징수 기납부 합계, 해외 매출 영세율(원화 미입력 목록) |
| LED-07 | 증빙 | 거래 1건에 첨부 N개. `hasEvidence` |
| LED-08 | 리포트 | 월별 손익 / 프로젝트별 수익성 / 클라이언트별 매출 / 카테고리 추이 / 고정비 현황 |

**세금 일정** (설정 `taxType`, 기본 일반과세):

| 항목 | 일반과세 `general` | 간이과세 `simple` |
|---|---|---|
| 부가세 확정신고 | 1월 25일 (2기), 7월 25일 (1기) | 1월 25일 |
| 부가세 예정고지 납부 | 4월 25일, 10월 25일 — "신고"가 아니라 "고지서 납부"로 표시 | 7월 25일 예정부과 납부 |
| 종합소득세 | 5월 31일 | 5월 31일 |

### 5-7. 지식

| ID | 기능 | 규칙 |
|---|---|---|
| RES-01 | URL 자료 | og:title / og:image / og:description 자동(5초 타임아웃, 실패 시 호스트명). 설명은 본문 첫 줄 인용으로 |
| RES-02 | 아이디어 자료 | 마크다운 본문 |
| RES-03 | 카테고리 | 디자인 / 개발 / 기획 / 기타 |
| RES-04 | 읽음 상태 | 미읽음 / 읽음 / 정리완료. 홈 HOME-06 |
| RES-05 | 위키 승격 | 출처 링크를 본문 머리에 유지, 자료는 정리완료로 |
| WIKI-01 | 마크다운 페이지 | 최근 수정순, 5초 되돌리기 |
| WIKI-02 | 폴더·태그 | 일반 태그는 자료·툴과 공유(`tag` 테이블) |
| WIKI-05 | 링크·백링크 | `[[제목]]` 클릭 시 없으면 생성. 백링크 = 본문에 `[[제목]]`을 가진 페이지 |

### 5-8. 툴

| ID | 기능 | 규칙 |
|---|---|---|
| TOOL-01 | 등록 | 이름, 메모, 구분(made / used), 카테고리(IDE·디자인·인프라·AI·게임엔진·유틸), 사용 프로젝트, 태그 |
| TOOL-02 | 배포 파일 | R2 업로드(다중), 용량 게이지(5 GB 기준), 삭제 5초 되돌리기, 1일 뒤 R2 객체 정리 |
| TOOL-03 | 구독 | 무료 / 월 / 연 / 영구, 갱신일, 비용·통화. 월·연 구독은 장부 고정비 자동 동기화(소유자 tool). 비용 제거·삭제 시 고정비는 지우지 않고 종료일만 |
| TOOL-05 | 후보 | `candidate` 플래그. 고정비·만료 집계에서 제외 |

### 5-9. 통계

| ID | 기능 | 규칙 |
|---|---|---|
| STAT-01 | 시간 | 주(월요일 시작) / 월 / 년(월별 버킷). 수면 제외 |
| STAT-02 | 프로젝트 배분 | 미지정 시간은 따로 표시 |
| STAT-03 | 장부 요약 | 최근 6개월 월 요약 |
| STAT-04 | 활동 분포 | 여기만 수면 포함 |
| STAT-07 | "다시는" 모음 | G4 회고 최근 10건 |

### 5-10. 설정 / 공통

| ID | 기능 | 규칙 |
|---|---|---|
| SET-01 | 접근 보호 | 10장 |
| SET-02 | 카테고리 관리 | `settings.categories` JSON |
| SET-03 | 내보내기 | JSON 전체(파일 제외, PIN 해시 제외) + ZIP(첨부 포함, 스트리밍) |
| SET-04 | 삭제 규칙 | 묻지 않음, soft delete, 5초 토스트 되돌리기, Ctrl+Z |
| SET-05 | 통화 | KRW / USD / EUR / JPY, 자동 변환 없음 |
| SET-07 | 알림 | 매일 07:00 KST Discord Webhook 아침 요약(일정·할 일·장애·만료 D-7·월초 백업 안내). 테스트 전송 |
| SET-08 | 자동 백업 | 11장 |
| SET-10 | 과세 유형 | 일반 / 간이 |
| SET-11 | 단축키 | 13장 |

## 6. 데이터 모델

28개 테이블. `id`는 UUID 텍스트, 시각은 ISO 텍스트, 배열·객체 컬럼은 JSON 텍스트. 모든 업무 테이블에 `createdAt · updatedAt · deletedAt` 공통.

| 그룹 | 테이블 | 주요 컬럼 |
|---|---|---|
| 기록 | `inbox` | raw, guessedType, status(open/done), processedAt |
| | `event` | title, startAt, endAt, allDay, rrule(daily/weekly/monthly), exceptions[], memo, projectId, outsourcingId |
| | `timelog` | date, startAt, endAt, text, projectId, taskId, activity |
| | `daily_note` | date(UNIQUE), text, mood |
| 메이커 | `project` | title, tag(UNIQUE), memo, status, gate, purpose, target, scopeIn, scopeOut, stack[], repoUrl, color |
| | `task` | projectId, title, column, dueDate, done, estimateMin, backlogAt |
| | `milestone` | projectId, title, date |
| | `retro` | projectId(UNIQUE), good, bad, learned, never |
| 프리랜서 | `client` | name, kind(client/supplier), email, phone, memo, taxMode(invoice/withholding/none), paymentTermDays |
| | `outsourcing` | title, clientId, stage, currency, contractAmount(공급가), taxMode, dueDate, deliveredAt, expectedSettleAt, settledAt, projectId, memo, attachments[] |
| | `payment` | outsourcingId, amount(실수령), supplyAmount, vatAmount, withheldAmount, krwAmount, paidAt, label, transactionId |
| 운영자 | `platform` | name, kind(web/game/url), builtin |
| | `deployable` | name, projectId, type, platformId, url, version, status |
| | `environment` | deployableId, name, domain, domainExpiresAt, sslExpiresAt, cost, currency, costCycle |
| | `deployment` | deployableId, version, deployedAt, summary, checklist[], rolledBack |
| | `review` | deployableId, version, submittedAt, status, rejectReason |
| | `incident` | deployableId, title, occurredAt, cause, action, prevention, prevStatus, resolvedAt |
| 사업자 | `transactions` | date, amount, currency, krwAmount, supplyAmount, vatAmount, withheldAmount, kind(income/expense), category, method, memo, clientId, projectId, outsourcingId, fixedCostId, origin, status, hasEvidence, attachments[] |
| | `fixed_cost` | name, amount, currency, cycle(monthly/yearly), billingDay, billingMonth, startAt, endAt, matchKeyword, category, method, ownerType(tool/environment/manual), ownerId |
| | `budget` | category, month, limit (v0.3용, UI 없음) |
| | `tax_record` | year, period, type, amount, status (v0.3용, UI 없음) |
| 학습자 | `resource` | url, title, thumb, body, category, readState, projectId, tags[] |
| | `wiki_page` | title, body, folder, projectId, tags[], sourceResourceId |
| | `tool` | name, memo, kind(made/used), category, projectId, license, cycle, renewAt, cost, currency, versionMemo, candidate, tags[] |
| | `tool_file` | toolId, name, storageKey, size, uploadedAt |
| | `tag` | name(UNIQUE) |
| 공통 | `settings` | 단일 행(id=1). pinHash, pinFailCount, lockedUntil, taxType, currencies[], theme, webhookUrl, categories{} |
| | `session` | id, expiresAt |

**연결 규칙**: 외래키 제약은 두지 않는다. 상위(프로젝트 등)를 soft delete 해도 하위 기록은 남고 조회 시 `LEFT JOIN … AND deletedAt IS NULL`로 연결만 끊긴다.

## 7. API 명세

모든 경로는 `/api` 아래. 응답은 JSON, 오류는 `{ error }` + 4xx/5xx. PIN이 설정돼 있으면 세션 쿠키 `pa_s` 필수(401 → 클라이언트가 `/lock`으로 이동).

### 7-1. 범용 CRUD `/api/t/:table`

| 메서드 | 경로 | 동작 |
|---|---|---|
| GET | `/t/:table?col=val&col2=null` | `deletedAt IS NULL` 목록, 존재하는 컬럼만 필터, `null`은 IS NULL, `updatedAt DESC` |
| GET | `/t/:table/:id` | 단건 |
| POST | `/t/:table` | 생성. 알 수 없는 컬럼은 무시, id·시각 자동 |
| PATCH | `/t/:table/:id` | 부분 수정 |
| DELETE | `/t/:table/:id` | soft delete |
| POST | `/t/:table/:id/restore` | 복원 |

허용 테이블 26개(`settings`, `session` 제외). `transactions`의 `origin='payment'` 행은 PATCH/DELETE 403.

### 7-2. 첨부

| 메서드 | 경로 | 동작 |
|---|---|---|
| POST | `/files` | multipart `file` → `{ key, name, size }`. 호출자가 행의 `attachments[]`에 넣는다 |
| GET | `/files/att/:name` | 다운로드(`content-disposition: attachment`) |

### 7-3. 모듈 라우트

| 모듈 | 메서드 · 경로 | 동작 |
|---|---|---|
| settings | GET `/settings/status` | pinSet, lockedUntil, authed (인증 불필요) |
| | POST `/settings/pin/verify` | PIN 검증 → 세션 발급. 5회 실패 시 5분 잠금 (인증 불필요) |
| | POST `/settings/pin` | PIN 설정·변경·해제(null) |
| | POST `/settings/pin/reset` | Access JWT로 본인 확인 후 재설정 (인증 불필요) |
| | GET / PATCH `/settings` | 일반 설정 (taxType, currencies, theme, webhookUrl, categories) |
| | GET `/settings/export` | JSON 전체 |
| | GET `/settings/export.zip` | ZIP 스트리밍 |
| | POST `/settings/webhook/test` | Discord 테스트 전송 |
| home | GET `/home` | HOME-01~06 집계 한 번에 |
| capture | POST `/capture/move` | 인박스 → 목적지. `{ id, dest, deployableId? }` → `{ target: { table, id, prev? } }` |
| | POST `/capture/unmove` | 이동 되돌리기(새 행 삭제 또는 병합 전 상태 복원 + 인박스 재개방) |
| schedule | GET `/schedule/month?from&to` | 반복 펼친 일정 + 자동 표시 + 기록 띠 + 노트 |
| | GET `/schedule/day/:date` | 블록·할 일·백로그·노트·일정·프로젝트 목록 (자동 백로그 갱신 포함) |
| | POST `/schedule/day/:date/from-events` | 지난 일정 → 타임로그 |
| | POST `/schedule/day/:date/from-yesterday` | 어제 블록 복사 |
| | PUT `/schedule/note/:date` | 데일리 노트 upsert |
| project | POST `/project/seed` | 씨앗 등록 |
| | PATCH `/project/:id/tag` | 태그 수정(유일성 보장) |
| | GET `/project/list` | 프로젝트 + 파생값(칸반 수, 주간 시간, 다음 마감, 연결, 회고, 배포물) |
| | GET `/project/:id` | 상세 |
| | PUT `/project/:id/retro` | 회고 upsert |
| outsourcing | GET `/outsourcing` | 목록 + 상단 카드 |
| | GET `/outsourcing/:id` | 상세(입금, 발주처, 프로젝트 시간) |
| | PATCH `/outsourcing/:id/stage` | 단계 전이 규칙 적용 |
| | POST `/outsourcing/:id/payments` | 입금 1건 + 장부 매출 자동 |
| | DELETE `/outsourcing/payments/:pid` · POST `…/restore` | 입금과 연동 장부 행 함께 삭제·복원 |
| | POST `/outsourcing/:id/clone` | 다음 달 복제 |
| ledger | GET `/ledger?month=YYYY-MM` | 월 요약, 거래, 고정비(다음 결제 D-day), 세금 일정 3건 |
| | POST `/ledger/cron` | 고정비 자동 거래 수동 실행(멱등) |
| | POST `/ledger/tx` | 거래 추가. 비용은 병합 규칙 적용, `{ merged, tx, prev? }` |
| | GET `/ledger/tx/:id` | 거래 + 연동 입금 + 같은 거래처 최근 5건 |
| | GET `/ledger/fixed/:id` | 고정비 + 최근 거래 12건 + 다음 결제일 |
| | POST `/ledger/category/rename` | 카테고리 일괄 변경 |
| | GET `/ledger/clients` | 거래처 + 올해 합계 + 미수금 |
| | GET `/ledger/tax?year` | 세금 집계 |
| | GET `/ledger/report` | 리포트 |
| ops | GET `/ops/summary` | 대시보드 |
| | GET `/ops/deployable/:id` | 배포물 상세 + 공유 비용 |
| | POST `/ops/deployable/:id/deploy` | 새 배포 |
| | POST `/ops/deployment/:id/rollback` | 롤백 |
| | POST `/ops/deployable/:id/incident` | 장애 기록 |
| | POST `/ops/incident/:id/resolve` | 해결 |
| | POST `/ops/review/:id` | 심사 상태 변경 → 배포물 상태 |
| knowledge | POST `/knowledge/resource` | 자료 추가(URL 메타 자동) |
| | POST `/knowledge/resource/:id/promote` | 위키 승격 |
| | GET `/knowledge/wiki/:id/backlinks` | 백링크 |
| | POST `/knowledge/wiki/open` | `[[제목]]` → 페이지(없으면 생성) |
| | POST `/knowledge/tags` | 일반 태그 등록 |
| tool | POST `/tool/fixed/:type/:id` | 구독 → 고정비 동기화 (type: tool / environment) |
| | POST `/tool/:id/files` | 파일 업로드(다중) |
| | GET `/tool/files/:fid` | 다운로드 |
| stats | GET `/stats?range=week·month·year` | 시간·프로젝트·활동·회고·최근 6개월 손익 |

## 8. 횡단 규칙

### 8-1. 태그
- `#`는 **프로젝트 연결 전용**. 저장 시 projectId로 변환되고 텍스트는 표시용으로 남는다.
- 프로젝트 태그는 공백 없는 문자열, 전체(삭제 포함)에서 유일. 제목 중복은 허용.
- 없는 태그를 입력하면 "미지정"으로 저장하고 나중에 연결.
- 일반 태그(자료·위키·툴)는 속성 칸에서 선택/생성. 텍스트 파싱 안 함.

### 8-2. 세금 방식
발주처 단위 3종(`invoice` / `withholding` / `none`), 외주 건에서 덮어쓰기 가능. 세금계산서와 3.3%는 한 건에 공존하지 않는다. 미수금 계산 표는 5-4.

### 8-3. 중복 방지 (같은 돈은 한 번만)
1. 고정비 결제일에 비용 거래를 자동 생성한다(`fixedCostId`, origin `fixedCost`, status `auto`).
2. 캡처·수동 입력으로 비용이 들어올 때 아래를 모두 만족하면 새 행 대신 자동 행에 **병합**(status `confirmed`):
   - 자동 행의 날짜 ±3일
   - 메모가 고정비 매칭 키워드(기본: 고정비 이름, 쉼표로 여러 개) 포함
   - 같은 통화면 금액 ±5%, 다른 통화면 금액 무시(KRW 입력이면 `krwAmount`로 저장)
3. 자동 행이 아직 없는데 결제일 ±3일이고 키워드가 맞으면 새 행을 그 고정비에 연결해 만든다. 이후 크론은 이 행을 보고 자동 행을 만들지 않는다.
4. 사용자가 지운 자동 행은 되살리지 않는다(삭제 행 포함 검사).
5. 구독의 소유자는 하나: SaaS·플랫폼 계정 구독 = 툴, 배포물 전용 비용 = 환경.
6. 병합·자동 생성은 모두 5초 되돌리기 대상.

### 8-4. 시간
- 날짜 `YYYY-MM-DD`. 사용자 시각(일정·타임로그·입금일)은 **KST 로컬 `YYYY-MM-DDTHH:mm`, Z 없음**.
- 워커는 UTC로 돌므로 "오늘"은 서버에서 KST로 계산한다.
- `createdAt · updatedAt · deletedAt`만 UTC ISO(자동).

### 8-5. 삭제
- 모든 삭제는 soft delete(`deletedAt`). 묻지 않고 5초 토스트로 되돌리기, Ctrl+Z.
- 툴 파일은 삭제 1일 뒤 크론이 R2 객체를 지우고 행을 hard delete(백업 버킷 사본은 유지).
- 외주 입금 삭제는 연동 장부 행과 함께. 인박스 이동 되돌리기는 생성 행 삭제 또는 병합 전 값 복원.

### 8-6. 통화
KRW / USD / EUR / JPY. 자동 환산 없음. 집계는 통화별 줄. 원화 집계가 필요한 곳(세금)은 KRW 거래 + `krwAmount` 있는 외화 거래만.

## 9. 모듈 간 연결

| 출발 | 도착 | 규칙 |
|---|---|---|
| 캡처 | 모든 모듈 | 유형 추정 → 인박스 → 목적지 9개 |
| 외주 입금 | 장부 매출 | 1:1 자동 생성, 장부 행 읽기 전용, 공급가·부가세·공제 분리 전달 |
| 쓰는 툴 구독 / 환경 전용 비용 | 장부 고정비 | 1:1 동기화, 소유자 1곳, 해지 = 종료일 |
| 고정비 | 장부 거래 | 결제일 자동 생성 + 병합 |
| 도메인·SSL·구독 만료 | 달력 + 홈 | D-30 달력, D-7 홈 |
| 장애·미수금·정산 지연·지난 마감·심사 반려 | 홈 | 해결 전까지 유지 |
| 세금 일정 | 달력 + 홈 | 과세 유형별 |
| 타임로그 #프로젝트 | 프로젝트 시간 · 통계 | 수면 제외 |
| 태스크 #프로젝트 | 칸반 · 진행률 · 홈 할 일 | 태스크 통합 규칙 |
| 자료 | 위키 | 승격, 출처 유지 |
| 거래처 | 외주 · 장부 | 단일 테이블 |
| 프로젝트 삭제 | 외주 · 장부 · 배포 · 태스크 | 기록 유지, 연결 해제 |

## 10. 보안

| 항목 | 규칙 |
|---|---|
| 앞단 | Cloudflare Access(본인 이메일 OTP) 권장. 앱 자체 계정 없음 |
| PIN | 숫자 4~6자리, **서버 검증**. PBKDF2-SHA256 100,000회 + 16바이트 솔트로 저장 |
| 세션 | `session` 테이블 + 쿠키 `pa_s`(httpOnly, secure, SameSite=Strict), 12시간. 만료 세션은 크론이 정리 |
| 잠금 | 5회 실패 시 5분 잠금(`lockedUntil`), 성공 시 카운트 초기화 |
| 예외 경로 | `/settings/status`, `/settings/pin/verify`, `/settings/pin/reset`만 세션 없이 허용 |
| PIN 미설정 | 인증 없이 통과(초기 상태). 운영 전 반드시 설정 |
| PIN 분실 | Access JWT(`Cf-Access-Jwt-Assertion`)를 JWKS로 검증(RS256, aud, exp) 후 재설정. `ACCESS_TEAM`/`ACCESS_AUD` 없으면 비활성 |
| 입력 경계 | 범용 CRUD는 허용 테이블 목록 + 실제 컬럼만 통과. URL 자료는 `https?://` 형식 검증 |
| 내보내기 | PIN 해시는 덤프에서 제외 |

## 11. 백업·내보내기

| 항목 | 규칙 |
|---|---|
| JSON | `GET /settings/export`. 전체 테이블(세션·마이그레이션 제외), 파일 제외 |
| ZIP | `GET /settings/export.zip`. `data.json` + `files/<R2 key>` 전체. 무압축 스트리밍, 워커 메모리에 쌓지 않음. 삭제 대기 파일도 포함(덤프 행과 짝) |
| 자동 백업 | 매일 07:00 KST `pa-backup/backup-YYYY-MM-DD.json` + 신규 첨부 `files/<key>` 증분 복사(빠진 날은 다음 날 따라잡음) |
| 보관 | 앱 코드는 백업을 지우지 않는다. 보관 기간은 R2 수명 주기 규칙(31일 만료) + bucket lock(30일) |
| 복원 | ZIP 가져오기는 미구현. 필요 시 `data.json` 기준 upsert + `files/` 재업로드 |

## 12. 알림·크론

매일 `0 22 * * *` UTC(= 07:00 KST) 한 번, 순서대로:

1. 장부 크론: 이번 달 결제일이 지난 고정비 → 비용 거래 자동 생성(8-3).
2. 설정 크론: 만료 세션 삭제 → JSON 백업 + 첨부 증분 복사 → 삭제 1일 지난 툴 파일 정리 → Discord 아침 요약.

아침 요약 내용: 오늘 일정, 기한 오늘 이하 할 일, 미해결 장애, 만료 D-7 도메인·SSL, 매월 1일 "ZIP 내려받기" 안내. Webhook URL이 없으면 전송하지 않는다.

## 13. 단축키

| 범위 | 키 | 동작 |
|---|---|---|
| 전역 | Ctrl K | 캡처 오버레이 토글 |
| 전역 | Ctrl Z | 5초 내 마지막 삭제 되돌리기 |
| 전역 | Esc | 닫기 |
| 전역 | G H / G P / G L / G I | 홈 / 프로젝트 / 장부 / 인박스 |
| 전역 | T | 오늘 기록지 |
| 화면 공통 | N | 현재 화면의 새 항목 |
| 화면 공통 | Del | 삭제(묻지 않음) |
| 화면 공통 | 1–9 | 현재 화면의 단계·상태·목적지 선택 |
| 인박스 | ↑ ↓ / k j | 항목 이동 |

입력 중(input · textarea · select · contentEditable)에는 전역 키를 무시한다.

## 14. 비기능 요구

| 항목 | 요구 |
|---|---|
| 레이아웃 | 데스크톱 1440 기준. 홈은 네비 포함 900px 이내. 모바일은 `/c`만 보장 |
| 응답 | 홈·대시보드·상세는 **요청 1회**로 화면 전체 데이터(서버에서 병렬 쿼리 후 합성) |
| 번들 | 클라이언트 산출물 약 550 KB(폰트 제외) |
| 가용성 | Cloudflare 엣지. 상태는 D1·R2에만 |
| 비용 | 무료 한도: Workers 10만 요청/일, D1 5 GB · 읽기 500만 행/일 · 쓰기 10만 행/일, R2 10 GB/월. 1인 사용이면 무료. 과금 가능성은 R2 저장량뿐(약 $0.015/GB) |
| 접근성 | 네이티브 폼 요소, 키보드 조작 가능, 아이콘 버튼 `aria-label` |
| 브라우저 | 최신 Chromium·Firefox·Safari. ES2022 |
| 디자인 | 브루탈리즘 토큰 고정: 테두리 2px, 구분선 4px, 그림자 5×5 blur 0, 라운드 없음. 색 9종(bg · ink · paper · acid · alert · sky · violet · mint · muted) |

## 15. 범위 밖·미구현

| 구분 | 항목 |
|---|---|
| v0.3 (계획) | 예산(LED-09), CSV 가져오기(LED-10), 헬스체크 + 즉시 알림(OPS-10), 위키 템플릿(WIKI-04), 전역 검색(SET-09), PWA 공유 대상(CAP-07), 북마클릿(CAP-05), 통계 확장(STAT-05·06) |
| 의도적 생략 | ZIP 가져오기(복원), 다크 팔레트(테마 값만 저장), 아침 요약의 미수금 줄, ZIP64(단일 파일·합계 4 GB 초과 시) |
| 운영 미완 | PIN 설정, Access 설정 + 시크릿, Discord Webhook 입력, 백업 버킷 수명 주기 규칙 |

[← 소개]({{ '/personal-assistant/' | relative_url }}) · [기술문서 →]({{ '/personal-assistant/tech/' | relative_url }})
