---
layout: doc
title: "Adless Puzzle 기술문서"
description: "광고 없는 퍼즐 미니게임 32종 웹앱의 내부 구조 — 정적 빌드, 게임 모듈 계약, 결정론, 레벨 풀이 증명, 무한모드·랭킹, 합성 사운드, 테스트."
permalink: /projects/adless-puzzle/tech/
---

[← 소개]({{ '/projects/adless-puzzle/' | relative_url }}) · [개발 프로세스 →]({{ '/projects/adless-puzzle/process/' | relative_url }})

이 문서는 "어떻게 만들었나"를 다룬다. 기준일은 2026-10-15.

## 1. 한눈에

| 항목 | 값 |
|---|---|
| 게임 | 32종 × 100레벨 = **3,200레벨** (10레벨마다 난이도 1단계, 1~10단계) |
| 무한모드 | 26종 |
| 오늘의 퍼즐 | 하루 한 판, 모두 같은 판 |
| 정적 페이지 | 약 3,260장 (허브 1 · 레벨 선택 32 · 플레이 3,200 · 무한 26 · 오늘 1) |
| 자동 테스트 | 게임 1,849개 + 공용 라이브러리 6개, 실패 0 |
| 그림 | 약 1,800장 (webp·png) |
| 오디오 파일 | **0개** — 모든 소리를 Web Audio로 합성 |
| 런타임 의존성 | next, react, react-dom, matter-js, @supabase/supabase-js 다섯 개 |
| 코드 | 앱 `.ts/.tsx` 약 6만 줄 (그중 레벨 데이터 약 1.6만 줄) |

| 영역 | 사용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack), React 19 |
| 언어 | TypeScript 5 (`strict`, `erasableSyntaxOnly`) |
| 스타일 | Tailwind CSS v4 + CSS Modules |
| 물리 | matter-js (선 그리기 게임 2종). 나머지는 자체 결정론 시뮬레이션 |
| 백엔드 | Supabase — Auth, Postgres + RLS, RPC, Edge Function 1개 |
| 테스트 | Node 24 내장 `node:test` (TS를 그대로 실행, 테스트 패키지 없음) |
| 배포 | Vercel |

## 2. 저장소 구조

```text
AdlessPuzzle/
├── web/                          Next.js 앱
│   ├── app/
│   │   ├── page.tsx              허브 (서버 컴포넌트)
│   │   ├── hub-client.tsx        진행 바 · 이어하기 · 계정 칩 (클라이언트 섬)
│   │   ├── games/[slug]/
│   │   │   ├── page.tsx          레벨 선택 + 랭킹 · 무한 버튼     (SSG 32)
│   │   │   ├── [level]/page.tsx  플레이                         (SSG 3,200)
│   │   │   └── endless/page.tsx  무한모드                       (SSG 26)
│   │   ├── daily/page.tsx        오늘의 퍼즐
│   │   └── dev/sound/            소리 실험실 (운영 빌드에서 404)
│   ├── components/               Player · EndlessPlayer · LevelGrid · Tutorial · Ranking · Auth · Cast
│   ├── games/
│   │   ├── catalog.ts            32종 메타데이터 · 카테고리 · 무한모드 목록
│   │   ├── registry.tsx          slug → 동적 import
│   │   ├── types.ts              GameProps 계약
│   │   ├── art.ts · audio.ts     그림 경로 · 소리 지연 로드
│   │   └── <slug>/ × 32
│   │       ├── Game.tsx          화면
│   │       ├── logic.ts          규칙 (React 없음)
│   │       ├── levels.ts         레벨 100개
│   │       ├── levels.test.ts    100개 전부 풀린다는 증명
│   │       ├── sound.ts · music.ts   전용 효과음 · 배경음악
│   │       └── gen.ts · solver.ts    (일부) 생성기 · 솔버
│   ├── lib/                      progress · endless · daily · ranking · auth · sound · haptics · rng
│   └── public/
│       ├── game-art/<slug>/      배경 10장 + 아이템
│       ├── animals/              캐릭터 포즈
│       └── animal-art/           썸네일 · 아이콘 · 퍼즐 일러스트
├── supabase/
│   ├── migrations/               스키마 · RLS · RPC
│   ├── functions/login/          아이디 → 이메일 변환 로그인
│   └── tests/                    SQL 테스트 · 익명 호출 점검
└── docs/                         기획서(GDD 32개) · 기술명세서 · QA 기록
```

모든 게임 폴더가 같은 파일 구성을 가진다. 새 사람이 어느 게임을 열어도 어디에 무엇이 있는지 바로 안다.

## 3. 빌드와 배포

```bash
cd web
npm run dev        # 개발 서버
npm test           # 게임 테스트 전체 (약 45초)
npm run lint
npx tsc --noEmit
npm run build      # 정적 페이지 생성
```

- 모든 페이지를 `generateStaticParams`로 **빌드 때 미리 만든다.** 서버 런타임 의존(API 라우트, 서버 데이터 페치)이 없다.
- 서버 호출은 전부 브라우저에서 Supabase로 직접 간다. 그래서 나중에 정적 내보내기로 바꿔 앱(Capacitor)에 그대로 넣을 수 있다.
- 플레이 페이지는 그 게임의 청크만 내려받는다. 게임 컴포넌트는 `next/dynamic({ ssr: false })`라 게임 코드가 `window`·캔버스를 바로 써도 서버 렌더링 오류가 나지 않는다.
- Supabase 환경변수가 없으면 로그인·랭킹 UI가 통째로 숨고 기기 저장만으로 동작한다. 로컬에서 키 없이 바로 돌릴 수 있다.

```text
빌드 시점                               실행 시점 (브라우저)
──────────                              ───────────────────
generateStaticParams                    정적 HTML 수신
  → 정적 HTML 약 3,260장        ──→     하이드레이션
TypeScript · Tailwind                     ├─ 플레이: 그 게임 청크만 로드
  → 게임별 동적 청크 32개 + 소리 청크      ├─ localStorage 진행도 읽기
                                          └─ 로그인 상태면 서버 기록과 맞추기 ──→ Supabase
```

### 3.1 하이드레이션 불일치 피하기

진행도는 브라우저(`localStorage`)에만 있다. 서버 HTML에는 진행도를 모르는 상태로 그리고, 진행도에 따라 달라지는 부분(진행 바, NEW 스티커, 이어하기 카드)만 클라이언트 섬으로 뺐다.

```ts
// lib/progress.ts — useSyncExternalStore로 서버 스냅샷은 null
export const useSave = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => null);
```

`null`이면 아무것도 그리지 않아 서버 HTML과 첫 렌더가 같다. 하이드레이션 뒤에 진짜 값으로 다시 그린다. 다른 탭에서 진행도가 바뀌면 `storage` 이벤트로 다시 읽는다. 저장이 막힌 환경(시크릿 모드 등)에서는 그 세션 메모리에만 둔다.

## 4. 공용 쉘 + 게임 모듈 계약

허브, 레벨 선택, 상단 바, 결과 카드, 저장, 소리, 튜토리얼은 공용이다. 게임 32개는 **props 계약 하나**만 지키는 독립 모듈이다.

```ts
// games/types.ts
export type GameProps = {
  level: number;          // 1~100
  attempt: number;        // 1 = 첫 시도
  tutorial?: boolean;     // 레벨 1 일반 모드
  endless?: boolean;      // 무한모드
  onWin(stars: 1 | 2 | 3, reason?: string): void;  // reason = 별이 깎인 이유
  onLose(reason?: string): void;
  onHold?(): void;        // 결과 확정 후 연출 중 무한모드 시계 멈춤
};
```

| 계약 | 내용 |
|---|---|
| 진입 | `Game.tsx`는 `"use client"` + default export |
| 결과 | 클리어 시 `onWin` 한 번, 실패·막힘 시 `onLose`. 결과가 정해진 뒤 중복 호출은 쉘이 무시 |
| 재시작 | 게임이 직접 초기화하지 않는다. 쉘이 React `key`를 바꿔 **다시 마운트**한다 |
| 규칙 | `logic.ts`는 React 없는 순수 TS. 상대 import에 `.ts` 확장자 포함, `enum`·`namespace` 금지 (Node가 TS를 그대로 실행하도록) |
| 레벨 | `levels.ts`에 정확히 100개, `levels.test.ts`에서 전부 풀림을 증명 |
| 화면 | 360×640 세로에서 스크롤 없이 플레이, 탭 대상 44px·플레이 글씨 14px 이상 |
| 금지 | 광고·하트·에너지·결제 |

재시작을 "다시 마운트"로 처리한 덕분에 모든 게임은 **"마운트 = 레벨 시작"** 하나만 구현하면 된다. 재시작 버그가 생길 자리가 없다.

```text
Player (쉘)
  ├─ 상단 바 · 배경 · 소리 버튼
  ├─ <Game key={run} level attempt onWin onLose />   ← registry에서 동적 로드
  └─ ResultCard (CLEAR! / 다시! 도장 · 별 · 캐릭터)

  onWin  → recordClear(기기) → pushClear(서버, 로그인 시, 실패 무시) → 결과 카드
  onLose → 결과 카드 → "다시 하기" → run + 1 → 새 key로 다시 마운트 (attempt = run + 1)
```

## 5. 규칙 · 화면 · 생성기 분리

```text
games/<slug>/
  logic.ts    init(level) → State
              step(level, state, move) → State     같은 입력 = 같은 결과
              isWon / isStuck / starsFor
  solver.ts   solve(level) → Move[] | null         logic.ts와 같은 규칙으로 탐색
  gen.ts      시드 난수로 후보 생성 → 솔버로 선별 → levels.ts 출력   (오프라인 전용)
  Game.tsx    State 히스토리(되돌리기) · 애니메이션 · Pointer Events · 효과음
```

- 규칙이 React 밖에 있어서 Node에서 화면 없이 바로 테스트한다.
- 화면은 `State`를 그리기만 한다. 되돌리기는 이전 `State`로 돌아가는 것뿐이라 공짜이고 무제한이다.
- 생성기는 개발 중에만 돌린다. 출력물 `levels.ts`가 저장소에 들어가고, 테스트가 "생성기를 다시 돌리면 같은 레벨이 나온다"를 확인한다.
- 레벨 1~50은 처음 만든 그대로 고정하고, 51~100을 덧붙였다. 생성기를 고쳐도 1~50은 바뀌면 안 된다.

## 6. 결정론

**같은 입력이면 항상 같은 결과.** 이 프로젝트에서 가장 많은 것을 가능하게 한 원칙이다.

| 장치 | 내용 |
|---|---|
| 시드 고정 난수 | `Math.random` 대신 `lib/rng.ts`만 쓴다. 생성기·무한모드 순서·오늘의 퍼즐 모두 시드로 정해진다 |
| 고정 타임스텝 | 실시간 게임은 프레임 속도와 무관하게 같은 간격으로 `step`한다 |
| 랜덤 리필 없음 | 매치3·블록 게임도 다음 조각이 정해져 있다. "운"이 없다 |

```ts
// 물리·시뮬레이션 게임의 루프 (개념)
function frame(now: number) {
  acc += Math.min(MAX_FRAME, now - last);   // 저사양에서 한 번에 너무 많이 돌지 않게 상한
  last = now;
  while (acc >= DT) { step(sim); acc -= DT; }
  draw(sim);
  if (sim.status === "running") requestAnimationFrame(frame);
}
```

결정론 덕분에 된 것:

1. **되돌리기 무제한** — 이전 상태를 그대로 복원.
2. **정답 재생 테스트** — 저장한 정답 수순을 화면 없이 돌려 이기는지 확인.
3. **솔버 검증** — 같은 `logic.ts`로 탐색하므로 솔버가 찾은 해는 실제 게임에서도 통한다.
4. **서버 재검증** — 무한모드 점수의 상한을 서버가 같은 식으로 계산해 거른다 (§8).

## 7. 3,200레벨이 전부 풀린다는 증명

모든 게임의 `levels.test.ts`가 100레벨을 하나씩 검증한다. 게임 성격에 따라 방법이 다르다.

```text
시드 난수 ─→ 생성기(gen.ts) ─→ 후보 레벨 ─→ 솔버 ─→ 난이도·함정 기준 통과? ─→ levels.ts
수작업 레벨(지도·시나리오·픽셀 그림) ──────────────┘          │ 아니오 → 다시 생성
                                                              
npm test:  개수 = 100 · 정답 재생 → 승리 · 솔버 독립 재풀이 · 함정 존재 · 결정론
```

| 검증 방법 | 하는 일 | 쓰는 게임 (예) |
|---|---|---|
| 정답 수순 재생 | 저장된 정답을 `step`으로 재생해 승리 확인 | 핀 뽑기, 땅 파기, 주차장 탈출, 트리플 매치, 짝 잇기 등 |
| 독립 솔버 재풀이 | 생성 때와 별개인 솔버로 다시 품 | 물 정렬(A*로 최소 수), 주차장(BFS), 파이프, 미끄러져 칠하기(BFS, 기준 = 최단) |
| 유일해 | 답이 하나뿐인지 확인 | 그림 로직(줄 단위 DP 제약 전파), 스도쿠(논리 솔버 + 허용 기법 단계), 정리·채우기 81~100 |
| 최적성 | 기준 수가 정말 최소인지 (기준 − 1로는 못 풂) | 엉킨 줄 풀기, 파이프 회전 |
| 입력 오차 허용 | 사람 손떨림 범위에서도 이기는지 | 줄 자르기(±12프레임), 선 그려 길 만들기(±8px 25곳 중 18곳), 물길(8방향 1칸), 반사 사격(각도) |
| 함정 존재 | 생각 없이 하면 진다 | 수치 게이트(탐욕 정책이 51~100에서 전패), 묶음 터뜨리기(탐욕 봇 31레벨부터 실패), 숫자 합치기(무작위 승률 97% 미만) |
| 결정론 | 같은 시드 = 같은 레벨, 원래 상태는 안 바뀜 | 전체 |

"공짜 판이 아니다"도 테스트한다. 예를 들어 수치 게이트 러너는 "광고처럼 × 게이트부터 고르는" 탐욕 정책을 따로 만들어, 그 정책이 이기는 레벨이 5개 이하이고 51~100에서는 하나도 없는지 확인한다.

```ts
// 테스트 모양 (개념)
test("100레벨 전부 정답 수순으로 이긴다", () => {
  assert.equal(levels.length, 100);
  for (const [i, L] of levels.entries()) {
    let s = init(L);
    for (const m of L.solution) s = step(L, s, m);
    assert.ok(isWon(s), `level ${i + 1}`);
  }
});
```

## 8. 무한모드 · 오늘의 퍼즐 · 랭킹

### 8.1 무한모드

실행 중에 레벨을 만들지 않고 **기존 100레벨을 난이도 순으로 섞어 재사용**한다. 생성기가 있는 게임 + 일부 수작업 게임, 26종.

| 규칙 | 값 |
|---|---|
| 시작 시간 | 90초 (게임별 배율) |
| 난이도 | 판 3개마다 1단계, 최대 10단계 |
| 나오는 레벨 | 그 단계의 10개를 시드로 섞은 순서. 레벨 1(튜토리얼)은 뺌 |
| 점수 | 클리어마다 난이도 × 별 × 100 |
| 보너스 시간 | 클리어마다 max(10초, 45초 − 판 번호 × 2초) |
| 실패 | 같은 판 재시작, 시간만 잃음 |

```text
Ready ──시작(시드 고정)──→ Play ──onWin──→ Clear ──다음 판──→ Play
                            │ ↺ onLose (같은 판)
                            └──시간 0──→ Over → 최고 기록 저장 · 랭킹
```

### 8.2 오늘의 퍼즐

```ts
// lib/daily.ts — 서울 날짜마다 모두 같은 한 판
export const todayNumber = (now = Date.now()) => Math.floor((now + 9 * 3_600_000) / DAY);
// 게임: (n × 7) mod 32 → 7과 32는 서로소라 32일에 한 번씩 모든 게임이 돈다
// 레벨: 무한모드 순서표에서 5단계(41~50) 중 하나
```

정적 빌드라 날짜는 브라우저가 정한다. 클리어 시간은 클라이언트 시계를 믿지 않고 **서버 시각**으로 잰다 (판 시작을 서버에 기록).

### 8.3 서버 설계

| 테이블 | 접근 |
|---|---|
| `profiles` | 본인 행만 읽기. 가입 트리거가 채움 |
| `level_clears` | 본인 행만 읽기. **쓰기 권한 회수** |
| `endless_bests` | 같음 |
| `runs` · `daily_clears` | 판 시작 시각 · 오늘 기록. 같음 |

쓰기는 RPC(security definer) 한 곳으로만 한다.

| RPC | 검증 |
|---|---|
| `submit_clears` | 레벨마다 큰 별만 남김. 레벨 n은 n−1이 있어야 받음 (건너뛰기 차단) |
| `start_run` | 판 시작 시각을 서버가 기록 |
| `submit_endless` | 그 판 수로 가능한 최대 점수를 넘으면 거부, 판당 최소 3초가 지나야 받음 |
| `submit_daily` | 오늘(서울) 시작한 판만, 시간 = 서버 시각 차이 |
| `get_ranking` | 상위 N명 + 순위 밖이면 내 행. 동점은 먼저 달성한 사람이 위 |

무한모드 점수 상한은 클라이언트(`lib/endless.ts`)와 서버 SQL이 **같은 식**이어야 한다. `endless.test.ts`가 두 식의 결과가 같은지 확인한다.

### 8.4 로그인과 기록 동기화

- 아이디 + 비밀번호 가입. 이메일은 비밀번호 찾기용. 로그인은 Edge Function이 아이디를 이메일로 바꿔 처리한다 (관리자 키는 함수 안에만).
- **로그인 없이도 전부 플레이할 수 있다.** 로그인은 기록을 서버에 올리고 랭킹에 오르는 용도뿐이다.
- 기기 기록에 주인(`owner` = user id)을 붙인다. 로그인하면:
  - 같은 계정(새로고침) → 기기 기록을 올리고 서버 기록과 합침 (별은 레벨별 큰 값)
  - 손님 기록이나 다른 계정 기록 → 올리지 않고 서버 기록으로 바꿈

마지막 규칙은 "공용 기기에서 남의 손님 기록이 내 계정에 섞이는" 문제를 막으려고 넣었다.

## 9. 소리: 오디오 파일 없이

모든 효과음과 배경음악을 **Web Audio API로 실시간 합성**한다. 저장소에 오디오 파일이 하나도 없다.

```text
AudioContext ─ 컴프레서 ─┬─ 효과음 버스 (음량 따로)
                         └─ 배경음악 버스 (음량 따로, duck 가능)

기본 함수: tone(파형·주파수·엔벨로프) · noise(노이즈 버퍼) · fx · loopOf
배경음악: 스텝 시퀀서 bgm.play(Track) — bpm · 스윙 · 로우패스
```

- 쉘 공용 효과음은 8개(tap·win·lose·star·stamp·paste·flip·ding)만 두고, 나머지는 게임마다 `sound.ts`(효과음 묶음)와 `music.ts`(곡 1개)로 나눴다. 게임에 들어갈 때 지연 로드한다.
- 사용자가 아직 아무것도 누르지 않았으면(`navigator.userActivation`) 효과음을 버린다. 주소로 바로 들어왔을 때 예약된 소리가 첫 탭에 한꺼번에 터지는 것을 막는다.
- 개발 전용 소리 실험실(`/dev/sound`)에서 게임별 소리를 듣고 음량·길이를 측정해 게임끼리 크기를 맞췄다.

얻은 것: 번들에 오디오 자산이 없어 가볍고, 라이선스 걱정이 없고, 음색을 코드 리뷰로 고칠 수 있다.

## 10. 그림 파이프라인

| 위치 | 내용 |
|---|---|
| `public/game-art/<slug>/` | 게임마다 배경 10장(10레벨 단계마다 하나) + 아이템 |
| `public/animals/` | 자체 캐릭터(코코, 레오 등)와 조연의 포즈 |
| `public/animal-art/` | 게임 썸네일·아이콘, 그림 로직·직소용 퍼즐 일러스트 각 100장 |

```text
그림체 기준 문장 + 자리별 프롬프트
  → AI 이미지 생성 (원본 · 시트)
  → 분리 · 자르기 · webp 변환 (게임용 크기)
  → 제작 기록(프롬프트 · 원본 위치)을 파일별로 남김
  → asset-map.json → games/art.ts 생성 (코드는 artSrc(slug, name)으로만 접근)
  → 화면에서 확인: 헤드리스 크롬으로 화면 그림 목록 · 깨진 그림 · 찌그러진 그림 · 남은 이모지 스캔
```

- 그림이 늘어나거나 잘리지 않았는지 스캔 도구가 화면의 실제 그림 비율과 원본 비율을 비교한다.
- 처음엔 그림 자리에 이모지를 썼고, 그림이 들어오면서 32종 모두 **게임 화면 이모지 0개**가 됐다.
- 그림 관리용 정적 페이지(게임별·제작 묶음별 보기, 서버 불필요)를 따로 만들어 수천 장을 사람이 고를 수 있게 했다.

## 11. UI 시스템

콜라주(종이·테이프·도장) 디자인을 공용 토큰과 클래스로 묶었다.

| 토큰 | 값 | 용도 |
|---|---|---|
| ink | `#1d1a16` | 글씨·선 |
| paper | `#fffdf6` | 종이 |
| kraft | `#c8a274` | 크라프트지 |
| stamp | `#e2483d` | 도장·경고 |
| tape | `#ffd23f` | 테이프·주요 버튼 |
| pen | `#2f6fd6` | 펜 낙서·강조 |

- 공용 클래스: `c-paper`, `c-torn`, `c-tape`, `c-stamp`, `c-btn`(티켓 버튼), `c-icon-btn`(44px 원형 스티커), 애니메이션 `c-anim-paste`·`c-anim-stamp`·`c-anim-shake`.
- 게임 영역은 `container-type: size`. 게임은 `cqw/cqh` 단위로 보드를 화면에 맞춘다.
- 입력은 Pointer Events 하나로 터치·마우스를 함께 처리하고, 보드에는 `touch-action: none`.
- 높이는 `h-dvh`, 안전 영역은 `env(safe-area-inset-*)`.
- **크기 기준 (390×844)**: 탭·드래그 대상 44×44px 이상, 플레이 글씨 14px 이상. 판이 촘촘해 44px가 안 되는 곳은 판을 화면 폭까지 키우고 터치 영역을 `::after`로 넓혔다.
- 튜토리얼: 레벨 1에서만 뜨는 코치마크. 대상을 CSS 선택자로 밝히고 오버레이는 `pointer-events: none`이라 밝힌 대상을 바로 조작할 수 있다.

### 11.1 접근성

- `prefers-reduced-motion: reduce`이면 공용·게임별 애니메이션을 끈다.
- 아이콘 버튼과 레벨 칸에 `aria-label`, 결과·랭킹·로그인 카드는 `role="dialog"`.
- **색만으로 구분하지 않는다**: 정렬·매치·나사 게임은 색과 모양(동물 얼굴·무늬)을 함께 쓴다.

## 12. 테스트와 품질 도구

| 항목 | 명령 | 결과 (2026-10-15) |
|---|---|---|
| 게임 테스트 | `npm test` (= `node --test "games/**/*.test.ts"`) | **1,849 통과 / 0 실패**, 약 45초 |
| 공용 라이브러리 | `node --test "lib/*.test.ts"` | 6 통과 (진행도 합치기, 무한모드 점수, 오늘의 퍼즐) |
| 타입 · 린트 | `tsc --noEmit`, `eslint` | 오류 0 |
| 서버 | SQL 테스트(트랜잭션 롤백) + 익명 호출 점검 | 통과 |
| 화면 점검 | 헤드리스 크롬 조작 스크립트(이동·탭·드래그·캡처, 390×844) + 크기 스캔 + 그림 스캔 | QA 라운드마다 사용 |

- 테스트 프레임워크를 설치하지 않았다. Node 24가 타입 주석을 지우고 TS를 그대로 실행하므로 `node:test`만으로 충분하다. 그래서 `logic.ts`에 `enum`·`namespace`(지울 수 없는 TS 문법)를 쓰지 않는다.
- 크기 스캔은 화면의 모든 조작 대상과 글씨를 재서 44px·14px 미달 목록을 뽑는다.

## 13. 알려진 제한

| 구분 | 내용 |
|---|---|
| 실기기 | QA는 데스크톱 크롬 390×844 에뮬레이션. 실제 폰 터치감·진동·저사양 성능은 아직 못 봄 |
| 소리 | 헤드리스 QA라 사람 귀로 들은 평가가 부족 |
| 무한모드 | 10단계 이후 같은 레벨 10개를 돌려 씀. 진짜 무한이 필요하면 생성기를 실행 중에 돌리도록 교체 |
| 44px 미달 | 스도쿠 9×9, 주차장 10×10, 그림 로직 18×20처럼 판이 화면 폭을 다 써도 안 되는 곳 |
| 오늘의 퍼즐 | 오늘의 게임·레벨을 클라이언트가 정한다. 다른 판으로 올리는 게 문제가 되면 서버에 날짜별 퍼즐 표를 둔다 |
| 레지스트리 | 32개를 한 파일에서 import해서, 개발 중 한 게임이 깨지면 모든 게임 페이지가 오류 |
| 출시 | 앱 포장(Capacitor), PWA, 후원은 아직 |
