---
layout: doc
title: "PA_ 기술문서"
description: "PersonalAssistant(PA_) 내부 구조 — 저장소, 요청 흐름, 서버·프론트 설계, 핵심 알고리즘, 보안, 백업, 테스트, 개발 프로세스."
permalink: /personal-assistant/tech/
---

[← 소개]({{ '/personal-assistant/' | relative_url }}) · [← 기술명세서]({{ '/personal-assistant/spec/' | relative_url }})

이 문서는 "어떻게 만들었나"를 다룬다. "무엇을 만들었나"는 [기술명세서]({{ '/personal-assistant/spec/' | relative_url }})에 있다.

## 1. 저장소 구조

```text
PersonalAssistant/
├── index.html                 SPA 진입 (폰트, manifest)
├── vite.config.ts             react + tailwindcss + cloudflare 플러그인 3줄
├── wrangler.jsonc             Worker · D1 · R2 · Cron · SPA fallback
├── tsconfig.json              strict, noEmit, include [src, worker]
├── migrations/
│   └── 0001_init.sql          테이블 28개 + 플랫폼 시드 (85줄)
├── public/manifest.webmanifest   PWA, start_url /c
├── src/                       프론트 (React)
│   ├── main.tsx               모듈 routes 합성, 오류 화면
│   ├── ui.tsx                 Nav · PageHead · Bar · Badge · Empty · toast · removeWithUndo · 전역 단축키 · Layout
│   ├── styles.css             Tailwind v4 @theme 토큰 + 유틸리티 7개
│   ├── lib/
│   │   ├── api.ts             fetch 래퍼, 범용 CRUD 클라이언트, useApi, 날짜·돈 포맷
│   │   ├── parse.ts           캡처 텍스트 해석 (클라이언트·워커 공용)
│   │   └── parse.test.ts
│   └── pages/<모듈>/          home · capture · settings · schedule · projects · outsourcing · ledger · ops · knowledge · tools · stats
│       └── index.tsx          routes(네비 안) · bare(네비 밖) export
├── worker/                    서버 (Hono on Workers)
│   ├── index.ts               auth → 모듈 라우트 → 범용 CRUD → 첨부 → scheduled()
│   ├── db.ts                  D1 헬퍼 (insert/update/get/all/softDelete, KST)
│   ├── zip.ts                 스트리밍 ZIP 라이터
│   ├── zip.test.ts
│   └── routes/<모듈>.ts       settings · home · capture · schedule · project · outsourcing · ledger · ops · knowledge · tool · stats
└── docs/                      PRD · UsabilityTest · WORK(작업 배분) · HANDOVER · design/*.png
```

| 구역 | 파일 | 줄 수 |
|---|---|---|
| 프론트 `src/` | 22 | 약 3,900 |
| 서버 `worker/` | 15 | 약 2,100 |
| 스키마 | 1 | 85 |

의도적으로 얇다. 상태 관리 라이브러리·ORM·폼 라이브러리·UI 킷이 없다. 런타임 의존성은 hono, react, react-dom, react-router 넷뿐이다.

## 2. 빌드·실행·배포

```bash
npm run dev                                   # vite + 워커 + 로컬 D1/R2 시뮬레이션 (HMR, 워커 자동 리로드)
npm run db:local                              # 로컬 D1 마이그레이션
npx wrangler d1 migrations apply DB --remote  # 운영 D1 마이그레이션 (새 migrations/*.sql 추가 시)
npm run build                                 # tsc -b (타입 검사) && vite build → dist/client, dist/spm
npm run deploy                                # build + wrangler deploy
npx wrangler tail spm                         # 운영 로그
```

- 배포 순서: 마이그레이션이 있으면 **먼저 `--remote` 적용 → 그다음 deploy**.
- 스키마 변경은 `0001`을 고치지 않고 `migrations/000N_<모듈>.sql`을 추가한다.
- 로컬 D1은 파일 잠금이 있어 개발 서버는 한 개만 띄운다.
- `@cloudflare/vite-plugin`이 Vite 개발 서버 안에서 워커를 실제 Workers 런타임(workerd)으로 실행하므로 로컬과 운영의 동작 차이가 거의 없다.

## 3. 요청 처리 흐름

```text
GET /projects/abc          GET /api/project/abc
      │                            │
      ▼                            ▼
 정적 자산 (dist/client)     run_worker_first: ["/api/*"]
 없으면 index.html (SPA)            │
                                    ▼
                         Hono app.basePath('/api')
                           ├─ onError → { error } 500
                           ├─ use('*', auth)          PIN 세션 검사
                           ├─ route('/settings'…)     모듈 라우트 11개 (먼저 매칭)
                           ├─ on(PATCH|DELETE, '/t/transactions/:id')  payment 행 보호
                           ├─ post('/files') · get('/files/att/:name')
                           └─ /t/:table …             범용 CRUD (허용 테이블만)
```

- 모듈 라우트가 범용 CRUD보다 먼저 등록되므로 같은 테이블이라도 도메인 규칙이 필요한 경로는 모듈이 가로챈다.
- 클라이언트는 `api()` 한 함수로만 호출하며 401을 받으면 `/lock`으로 이동한다.

## 4. 서버 설계

### 4-1. DB 헬퍼 (`worker/db.ts`)

| 함수 | 동작 |
|---|---|
| `columns(db, table)` | `PRAGMA table_info` 결과를 테이블별로 캐시. 이후 모든 입력 검증의 기준 |
| `clean()` | 입력 객체에서 **실제 컬럼이 아닌 키와 `id·createdAt·updatedAt·deletedAt`을 조용히 버린다**. 클라이언트 신뢰 경계가 이 한 곳이다 |
| `insert()` | `clean` + id(UUID)·시각 자동 + `RETURNING *` |
| `update()` | `clean` + `updatedAt` + `RETURNING *` |
| `get()` | `deletedAt IS NULL` 단건 |
| `all(db, sql, ...params)` | 바인딩 쿼리 + `decode` |
| `softDelete()` | `deletedAt = now` |
| `enc / decode` | JSON 컬럼(`exceptions · stack · attachments · checklist · tags · currencies · categories`)은 문자열 ↔ 객체 자동 변환, boolean → 0/1 |
| `kstNow / kstToday` | 워커는 UTC로 돌므로 KST "지금·오늘"을 여기서만 계산 |

### 4-2. 범용 CRUD (`/api/t/:table`)

- 허용 테이블은 `Set` 26개. 없는 테이블은 404.
- 목록 필터는 쿼리스트링을 컬럼 집합과 대조해 **존재하는 컬럼만** `WHERE "col"=?`로 만든다. 값 `null`은 `IS NULL`.
- 단순 목록·폼은 전부 이것으로 끝난다. 도메인 로직(자동 생성·집계·병합·전이)이 필요할 때만 모듈 라우트를 만든다.
- 외주 입금으로 생긴 장부 행(`origin='payment'`)은 PATCH/DELETE를 403으로 막는다. 수정·삭제는 외주 라우트에서 입금과 함께만.

### 4-3. 모듈 간 계약

모듈은 서로의 테이블을 직접 읽되, 계산이 들어가는 값은 **함수 export**로 고정했다. 병렬 개발에서 충돌을 막은 지점이다.

| 제공 | 함수 | 소비 |
|---|---|---|
| outsourcing | `receivables(db)` — 납품 + 미수금 > 0 | home, ledger(거래처) |
| ledger | `monthSummary(db, 'YYYY-MM')` — 통화별 손익·고정비·다음 결제·다음 세금 | home, stats, ledger(리포트) |
| ledger | `addExpense(db, e)` — 비용 1건 + 병합 | capture(인박스 → 장부), ledger |
| ledger | `taxSchedule(taxType, from)` | schedule(달력), home |
| capture | `resolveTag(db, text)` — 첫 `#태그` → projectId | 인박스 이동 |
| capture / project | `uniqueTag()` — 공백 제거 + 충돌 시 `-2` | 씨앗 등록 |
| schedule | `expand(event, from, to)` — 반복 펼치기, `addDays` | project, 달력·기록지 |
| tool | `syncFixed(db, ownerType, id)` — 구독 ↔ 고정비 | tools·ops 화면 |
| project | `projectStats(db)` — 칸반 수·시간·마감·연결·배포 | 목록 |
| settings | `auth` 미들웨어, `cron(env)` | index |

### 4-4. 시간 규약

- 사용자 시각은 KST 로컬 `YYYY-MM-DDTHH:mm`(Z 없음)으로 저장한다. 문자열 비교가 곧 시간 비교라 SQL에서 `substr(startAt,1,10)=?`, `BETWEEN`이 그대로 동작한다.
- 분 계산이 필요하면 `Date.parse(s + 'Z')`처럼 UTC로 취급해 시간대 영향을 제거한다.
- `createdAt · updatedAt · deletedAt`만 UTC ISO.

## 5. 프론트 설계

### 5-1. 모듈 규약

각 `src/pages/<모듈>/index.tsx`는 `routes: RouteObject[]`를, 필요하면 `bare`를 export 한다. `main.tsx`는 이를 `flatMap`으로 합쳐 라우터를 만든다.

```tsx
const router = createBrowserRouter([
  { path: '/', element: <Layout overlay={<capture.Overlay />} />, errorElement: <Oops />, children: mods.flatMap(m => m.routes) },
  ...mods.flatMap(m => m.bare ?? []),      // /c (모바일 캡처), /lock (PIN)
])
```

모듈 추가 = 폴더 하나 + `mods` 배열에 한 줄.

### 5-2. 공용 UI (`src/ui.tsx`)

| 요소 | 역할 |
|---|---|
| `Layout` | Nav + Outlet + 캡처 오버레이 + 토스트. 전역 단축키 등록 |
| `Nav` | 메뉴 9개, 오늘 날짜, 설정 톱니 |
| `PageHead` | 브레드크럼 + 큰 제목 + 오른쪽 액션, 아래 4px 선 |
| `Bar` | 검은 띠 섹션 머리 (`tone='alert'`면 빨강) |
| `Badge · Empty` | 배지, 빈 상태(아이콘·제목·힌트) |
| `toast(text, undo?, tone?)` | 5초 토스트. 모듈 전역 `push` 함수에 주입하는 방식이라 어디서든 호출 |
| `removeWithUndo(table, id, label, reload)` | `db.remove` → 토스트 → 되돌리기 시 `db.restore`. **모든 삭제는 이 함수를 거친다** |
| `useGlobalKeys` | Ctrl+Z(마지막 되돌리기), `G`+`H/P/L/I`, `T`. 입력 중이면 무시 |

### 5-3. API 클라이언트 (`src/lib/api.ts`)

```ts
api(path, { method?, body? })      // body 있으면 POST 기본, JSON 직렬화, 401 → /lock
db.list / get / create / update / remove / restore   // /api/t/:table
useApi<T>(path)                     // { data, error, reload, setData } — GET 한 번 + 수동 reload
today() · dday(date) · money(n, cur)
```

화면 데이터는 서버가 한 번에 합성해 주므로 클라이언트에는 캐시·상태 라이브러리가 없다. `useApi` 하나와 `reload()`로 충분하다.

### 5-4. 스타일

- Tailwind v4 `@theme`에 디자인 파일의 토큰을 그대로 선언한다: `--color-bg/ink/paper/acid/alert/sky/violet/mint/muted`, `--font-display/body/mono`, `--shadow-brut`.
- 커스텀 유틸리티 7개: `box · btn · btn-ink · badge · label · input · kbd`. 브루탈리즘 규칙(테두리 2, 라운드 없음, 그림자 5×5 blur 0)을 여기서 고정한다.
- 화면 코드는 유틸리티 클래스만 쓴다. CSS 파일은 `styles.css` 하나.

## 6. 핵심 알고리즘

### 6-1. 캡처 파서 (`src/lib/parse.ts`)

순수 함수 `parse(raw, today)`. 클라이언트는 배지 미리보기에, 워커는 인박스 이동에 같은 코드를 쓴다(워커가 `src/lib/parse`를 직접 import).

| 토큰 | 정규식 요지 | 결과 |
|---|---|---|
| URL | `https?://\S+` | `url` |
| 날짜 | `2026-10-02`, `2026.10.2`, `10.02`, `10/2` | `date` (연도 없으면 60일 이상 과거면 내년) |
| 시각 | `14:00` | `time` |
| 길이 | `2h`, `1.5h`, `30m`, `2시간`, `30분` | `minutes` |
| 금액 | `₩28,000`, `$35`, `12900원`, `20달러` | `amount`, `currency` |
| 태그 | `#태그` (공백 없는 문자열) | `tags[]` |

유형 추정은 **우선순위 체인** 하나다:

```text
url → 자료
코드블록(백틱 3개) 포함 → 아이디어
date && time → 일정
minutes && !date → 타임로그
date → 할 일
amount && (태그 뺀 본문 있음) → 장부 비용
그 외 → 아이디어
```

해석된 토큰은 본문에서 제거해 표시용 `text`를 만든다(`2h #X 렌더 정리` → `#X 렌더 정리`).

### 6-2. 인박스 이동과 되돌리기 (`worker/routes/capture.ts`)

`POST /capture/move { id, dest }`는 목적지 9개를 `switch`로 처리하고 `{ target: { table, id, prev? } }`를 돌려준다.

- 일정: `date ?? today` + `time ?? 09:00`, 1시간, 시각 없으면 종일.
- 할 일: `#프로젝트`가 있으면 칸반 `todo`로.
- 타임로그: 아래 6-3 배치 규칙.
- 프로젝트: 제목 → 씨앗, 둘째 줄부터 메모.
- 자료: URL이면 URL을 뺀 나머지가 제목.
- 장부: `addExpense` → 병합이면 `prev`(병합 전 값) 동봉.
- 배포: 본문에서 `v1.2.3` 패턴을 버전으로, 나머지를 요약으로. 현재 버전 갱신.

`POST /capture/unmove`는 `prev`가 있으면 거래를 병합 전으로 PATCH, 없으면 생성 행을 soft delete 하고 인박스를 다시 연다. 두 작업은 `DB.batch`로 묶는다.

### 6-3. 타임로그 배치

시작 시각이 없는 `2h #X`를 기록지에 놓는 규칙:

```text
start = 오늘 마지막 블록의 endAt, 없으면 now − minutes
start < 00:00 이면 00:00
기존 블록과 겹치면 start = 그 블록의 endAt  (앞에서부터 한 번 훑는다)
```

### 6-4. 반복 일정 펼치기 (`expand`)

`rrule`은 `daily · weekly · monthly` 셋뿐이다. 범위 `[from, to]`에 대해:

1. 범위 앞뒤 31일을 더 훑는다(회차 이동으로 범위 안에 들어올 수 있으므로).
2. 매일 / 같은 요일 / 같은 날짜(`DD`)로 매치.
3. `exceptions[]`에서 `skip`이면 건너뛰고, `startAt`이 있으면 그 회차만 이동.
4. 원래 회차 날짜를 `occurrence`로 붙여 돌려준다(예외 편집의 키).

### 6-5. 고정비 자동 거래 + 병합 (`worker/routes/ledger.ts`)

"같은 돈은 한 번만"의 구현. 경로가 둘이다.

**경로 A — 크론(매일)**: 이번 달 결제일이 지난 고정비마다

```text
d = billingDate(fc, 이번 달)           연 결제면 결제월만, 기간(startAt~endAt) 안만
if 이미 fixedCostId=fc 인 행이 d±3일에 있음(삭제 행 포함) → skip
early = d±3일의 fixedCostId 없는 비용 행 중 matches(fc, memo, amount, currency)
if early → 그 행에 fixedCostId·status=confirmed 연결        (사용자가 먼저 입력한 경우)
else     → 자동 행 insert (origin=fixedCost, status=auto)
```

**경로 B — 비용 입력(`addExpense`)**: 캡처·수동·CSV 공용

```text
auto = date±3일의 status=auto 자동 행 중 matches(해당 고정비, memo, amount, currency, 자동 행 금액·통화)
if auto → 병합: status=confirmed, method 갱신
          같은 통화면 amount 교체, KRW 입력이고 자동 행이 외화면 krwAmount 저장
          prev(바뀐 필드의 이전 값) 반환 → 되돌리기용
else   → 결제일 ±3일 안이고 키워드가 맞고 아직 행이 없는 고정비가 있으면 그 고정비에 연결해 새 행 (status=confirmed)
else   → 보통 비용 행
```

**`matches`**: 메모(소문자)가 `matchKeyword`(쉼표 구분, 기본 이름) 중 하나를 포함하고, 같은 통화면 `|amount − ref| ≤ 5%`, 다른 통화면 금액 조건 없음.

`billingDate`는 결제일이 그 달 말일보다 크면 말일로 당긴다(31일 결제, 2월). `nextBilling`은 오늘부터 13개월 안의 첫 결제일을 찾는다.

### 6-6. 외주 미수금과 입금 분리 (`worker/routes/outsourcing.ts`)

목록 쿼리 한 번에 파생값을 만든다:

```sql
mode     = COALESCE(o.taxMode, c.taxMode, 'invoice')
paid     = SUM(COALESCE(supplyAmount, amount) + COALESCE(vatAmount, 0))   -- 입금 크레딧 = 공급가 + 부가세
billed   = mode = 'invoice' ? round(contractAmount × 1.1) : contractAmount
receivable = billed − paid
```

3.3% 방식에서 `supplyAmount`가 공급가 기준이므로 공제액이 자연히 입금으로 간주되고 미수금이 0에 도달한다.

`splitPayment(mode, input)`:

| mode | input 의미 | amount(실수령) | supply | vat | withheld |
|---|---|---|---|---|---|
| invoice | 받은 총액 | input | round(input ÷ 1.1) | input − supply | 0 |
| withholding | 공급가 | input − w | input | 0 | w = round(input × 0.033) |
| none | 받은 금액 | input | input | 0 | 0 |

입금 1건은 `transactions`(kind income, category 외주, origin payment, amount = supply + vat, memo "발주처 · 제목 라벨")를 먼저 만들고 `payment.transactionId`로 연결한다. 음수 입력은 환불.

단계 전이 `PATCH /:id/stage`: 정산완료는 `receivable > 0`이면 400. 납품·정산완료로 가면 `deliveredAt`·`expectedSettleAt`(납품일 + 발주처 결제 조건 일수, 기본 7)을 채우고, 납품 이전 단계로 돌아가면 비운다.

다음 달 복제: 제목의 `N월`을 `(N % 12) + 1월`로 바꾸고 계약 단계로 생성.

### 6-7. 세금 일정 (`taxSchedule`)

과세 유형별 고정 날짜 배열을 올해·내년 두 해 만들어 `from` 이후만 D-day와 함께 돌려준다. 일반과세는 1·7월 확정신고, 4·10월 **예정고지 납부**(신고가 아님), 5월 종소세. 간이과세는 1월 확정, 7월 예정부과 납부, 5월 종소세.

세금 화면은 기간별로 `salesVat`(세금계산서 매출 부가세) − `buyVat`(증빙 있는 비용 부가세)를 납부 예상으로, 원천징수 합계를 기납부로, 외화 매출 중 `krwAmount` 없는 행을 "원화 미입력" 목록으로 낸다. 종소세 세율 구간은 참고용이다.

### 6-8. 홈 집계 (`worker/routes/home.ts`)

`GET /home` 하나가 쿼리 15개를 `Promise.all`로 돌리고 합성한다. "지금 봐야 할 것"은 배열 순서가 곧 우선순위다:

```text
장애(미해결) → 미수금(receivables) → 정산 예정일 경과 → 만료 D-7(도메인·SSL·구독)
→ 지난 마감(마일스톤 → 태스크 → 외주) → 심사 반려
```

어제 기록 띠는 블록별 분을 날짜 차이 × 1440 + 시:분 차로 계산해 프로젝트 색과 함께 돌려준다.

### 6-9. 운영 규칙 (`worker/routes/ops.ts`, `tool.ts`)

- **장애 기록**: 배포물의 현재 상태를 `prevStatus`에 저장하고 "장애"로. 이미 장애면 `prevStatus`는 null.
- **해결**: `action`이 비면 400. 해결 후 남은 미해결 장애가 없으면 가장 최근 `prevStatus`로 복귀, 없으면 "라이브".
- **롤백**: 해당 배포를 `rolledBack=1`로 표시하고, 그 이전의 롤백되지 않은 배포 중 최신 버전을 현재 버전으로.
- **심사**: 심사중 → 배포물 심사중, 승인 → 라이브. 반려는 상태를 바꾸지 않고 홈에 올린다.
- **구독 ↔ 고정비 `syncFixed`**: 툴(후보 아님, 비용 > 0, 월/연) 또는 환경(비용 > 0, 월/연)이면 `fixed_cost` 1행을 upsert(ownerType·ownerId). 조건이 깨지면 삭제 대신 `endAt = 오늘`(해지)로 과거 리포트를 보존한다.
- **공유 비용**: 배포물 상세는 플랫폼 이름으로 시작하는 쓰는 툴을 찾아 "공유 비용"으로 참조만 보여 준다(고정비 중복 방지).

### 6-10. 지식 (`worker/routes/knowledge.ts`)

- `fetchMeta(url)`: 5초 타임아웃, HTML만, 앞 300 KB만 읽어 `og:title · og:image/twitter:image · og:description/description`을 정규식으로 추출. 실패하면 호스트명만.
- 위키 승격: 본문 머리에 `> 출처: [제목](url) · 자료에서 승격`을 넣고 자료를 정리완료로.
- 백링크: `instr(body, '[[제목]]') > 0`. `[[제목]]` 클릭은 `/wiki/open`이 없으면 만든다.

## 7. 보안 구현 (`worker/routes/settings.ts`)

```text
auth 미들웨어
  path ∈ { /settings/status, /settings/pin/verify, /settings/pin/reset } → 통과
  settings.pinHash 없음 → 통과 (초기 상태)
  쿠키 pa_s 가 session 테이블에 있고 expiresAt > now → 통과
  그 외 → 401 { error: 'locked' }
```

- **PIN 저장**: `PBKDF2(SHA-256, 100,000회, 솔트 16바이트)` → `salt:hash` 문자열. WebCrypto만 사용.
- **검증**: 잠금 중이면 429. 실패 시 `pinFailCount` 증가, 5회째에 `lockedUntil = now + 5분`으로 설정하고 카운트 초기화. 성공 시 세션 발급.
- **세션**: UUID를 `session` 테이블에 12시간으로 넣고 쿠키 `pa_s`(httpOnly, secure, SameSite=Strict, path=/)로 내려준다. 만료 행은 크론이 지운다.
- **Access 재설정**: `Cf-Access-Jwt-Assertion` 헤더의 JWT를 `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`의 JWK로 검증(RSASSA-PKCS1-v1_5 / SHA-256), `aud`에 `ACCESS_AUD` 포함과 `exp` 확인. 시크릿이 없으면 항상 403.
- 설정 PATCH는 허용 키 5개만 반영한다.

## 8. 백업·내보내기 (`worker/zip.ts`, `settings.ts`)

**덤프**: `sqlite_master`에서 테이블 목록을 읽어(세션·마이그레이션·`_cf_` 제외) 테이블별 전체 행을 JSON으로. `settings.pinHash`는 제거.

**ZIP 스트리밍**: 워커 메모리에 파일을 쌓지 않기 위해 직접 작성한 약 60줄의 라이터.

- 압축 없음(STORE). 압축은 CPU 시간을 쓰고 첨부는 대개 이미 압축된 파일이다.
- **data descriptor**(플래그 bit 3): 로컬 헤더에 크기·CRC를 0으로 쓰고, 본문을 흘려보낸 뒤 `CRC · size · size`를 뒤에 붙인다. 그래서 R2 객체의 `ReadableStream`을 그대로 파이프할 수 있다.
- UTF-8 파일명(플래그 bit 11). CRC-32는 256 엔트리 테이블.
- 중앙 디렉터리는 엔트리별 오프셋을 기억했다가 마지막에 쓴다.
- `TransformStream`의 writable에 쓰고 readable을 `Response` 본문으로 반환.
- 한계: ZIP64 미지원이라 단일 파일 또는 합계 4 GB를 넘으면 깨진다. 그 규모가 되면 ZIP64 레코드를 추가한다.

**자동 백업**: 크론이 `backup-YYYY-MM-DD.json`을 `pa-backup`에 쓰고, `pa-files` 객체 중 `files/<key>`로 아직 없는 것만 복사한다(`FixedLengthStream`으로 크기 지정). 앱은 백업을 지우지 않으며 보관 기간은 버킷 수명 주기와 lock이 맡는다.

**파일 정리**: 삭제 1일 지난 `tool_file` 행의 R2 객체를 지우고 행을 hard delete. 백업 버킷 사본은 남는다.

## 9. 크론

`scheduled()`는 `ledgerCron` → `settingsCron` 순으로 돈다. 장부가 먼저인 이유는 자동 생성된 거래가 같은 날 백업에 들어가도록.

아침 요약은 Discord Webhook에 한 메시지로: 오늘 일정(시각 제목), 할 일, 장애(배포물 제목), 만료 D-7 도메인, 매월 1일 ZIP 안내. `POST /ledger/cron`으로 장부 크론을 수동 실행할 수 있다(멱등).

## 10. 테스트

프레임워크 없이 `node:assert`로, 로직이 꼬이면 깨지는 최소 검사만 둔다.

```bash
node src/lib/parse.test.ts     # 캡처 파서 14건 (유형·날짜·시간·금액·태그·연도 추정)
node worker/zip.test.ts        # zipStream 결과를 unzip -t 로 검증 (unzip 필요)
npx tsc -b                     # 타입 검사. 커밋 전 통과 유지
```

Node 22.6+의 타입 스트리핑으로 `.ts`를 바로 실행한다. 통합 테스트는 두지 않았고, PRD의 검증 기준("2주 매일 사용, 아침 30초, 중복 행 0")이 그 자리를 대신한다.

## 11. 개발 프로세스

| 단계 | 기록 | 내용 |
|---|---|---|
| PRD | `docs/PRD.md` v0.5 | 사용자 맥락 → 목표 지표 → 홈 레이아웃(ASCII) → 기능 ID → 횡단 규칙 → 데이터 모델 → 결정 사항 → 열린 질문 0 |
| 사용성 테스트 | `docs/UsabilityTest.md` | PRD v0.4 × 디자인 36화면을 시나리오 9개로 인지적 워크스루. P0 7건·P1 9건·불일치 8건 → v0.5 반영 |
| 디자인 | `untitled.pen` → `docs/design/*.png` | 1440 기준 48장. 노드 ID가 파일명이고 코드 주석이 그 ID를 가리킨다 |
| 작업 배분 | `docs/WORK.md` | 모듈별 **소유 파일** 표. 세션 4개(리드 06 · 86 일정/프로젝트 · da 외주/장부/통계 · e1 운영/지식/툴). 공용 파일은 리드만, 커밋은 리드만, 새 npm 의존성 금지 |
| 모듈 간 계약 | `docs/WORK.md` | 홈이 읽는 컬럼 의미와 export 함수 서명을 미리 고정(4-3) |
| 통합·배포 | `docs/HANDOVER.md` | 리소스 생성, 마이그레이션, `preview_database_id` 제거, 비용·보안 남은 일 |

병렬 구현에서 충돌이 나지 않은 이유는 셋이다. 범용 CRUD가 있어 각 모듈이 공용 코드를 건드릴 일이 적었고, 계약을 함수 export로 고정했고, 스키마는 한 파일로 먼저 확정했다.

## 12. 알려진 제한과 기술 부채

코드에 `ponytail:` 주석으로 남긴 의도적 단순화와 그 상한:

| 위치 | 단순화 | 바꿀 때 |
|---|---|---|
| `worker/zip.ts` | ZIP64 미지원 | 단일 파일·합계 4 GB 초과 시 ZIP64 레코드 추가 |
| `worker/routes/settings.ts` | ZIP 가져오기(복원) 없음 | 필요 시 `data.json` upsert + `files/` 재업로드 |
| `worker/routes/settings.ts` | 아침 요약에 미수금 줄 없음 | `receivables` 연결 |
| `src/pages/settings` | 다크 팔레트 없음(테마 값만 저장) | v0.2 디자인 토큰 추가 시 |

운영 측 미완(배포 직후 상태): PIN 미설정(설정 전까지 인증 없이 통과), Access 미설정, Webhook 미입력, 백업 버킷 수명 주기 규칙 미등록.

[← 소개]({{ '/personal-assistant/' | relative_url }}) · [← 기술명세서]({{ '/personal-assistant/spec/' | relative_url }})
