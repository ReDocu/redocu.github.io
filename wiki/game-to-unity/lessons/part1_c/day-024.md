# Day 024 · 블록과 AABB 충돌 판정 ★

> **Week 5** · 연결 문서 `05 알카노이드` — Step 4
> 선수: Day 023 (패들, 입력 3상태)

> ### 오늘 배우는 AABB는 24주 내내 쓴다
> 벽돌깨기, 격투게임 판정박스, 슈팅 총알, 타워 사거리 —
> 2D 게임 충돌의 90%가 오늘 배우는 이 공식 하나로 처리된다.

---

## 1. 오늘 만드는 것

**공이 블록에 닿으면 블록이 사라지고 공이 튕긴다.** 방향까지 정확하게.

```
╔═══════════════════════════════════════════╗
║          A R K A N O I D                   ║
╚═══════════════════════════════════════════╝

  ┌────────────────────────────────────────┐
  │ [==][==][==][==][==][==][==][==][==][==]│
  │ [==][==][  ][==][==][==][==][  ][==][==]│
  │ [--][--][--][  ][--][--][--][--][--][--]│
  │ [--][--][--][--][--][--][  ][--][--][--]│
  │                                        │
  │                @                       │
  │                                        │
  │                                        │
  │                                        │
  │                  ========              │
  └────────────────────────────────────────┘

   남은 블록  35 / 40      SCORE  350
   충돌 방향  세로 반사    LIFE ♥♥♥
```

**조작** — 좌우 키 이동, SPACE 발사.

<!-- SHOT: Day 24 완성 화면 -->

---

## 2. 막히는 상황

블록을 화면 위쪽에 배치하고 공을 날려 보내면 — **그냥 통과한다.**

지금까지 쓴 충돌 판정은 이랬다.

```c
if (b->x < 0)            // 왼쪽 벽
if (b->y > SCREEN_H - 1) // 아래 벽
```

**벽은 화면 끝에 있으니 좌표 하나만 비교하면 됐다.**
그런데 블록은 화면 중간에 떠 있는 **직사각형**이다.

```
   벽:  화면 끝                    블록:  화면 중간의 사각형

   │                              ┌────────┐
   │  ●                           │        │
   │                              │   ●?   │  ← 안에 있나? 밖에 있나?
   │                              └────────┘

   x < 0 하나로 판단              ??? 어떻게 판단하지?
```

패들 충돌은 이렇게 처리했다 (Day 23).

```c
if ((int)b->y != (int)p->y) return 0;
if (b->x < p->x || b->x > p->x + p->width) return 0;
```

**이건 패들이 높이 1칸이라 가능했다.** 블록은 높이도 있고, 개수도 40개다.
그리고 **어느 면에 맞았는지**에 따라 반사 방향이 달라야 한다.

```
   지금:   좌표 하나씩 비교하는 임시방편

   필요:   ① 두 사각형이 겹치는지 판단하는 일반 공식
           ② 어느 방향에서 부딪혔는지 판별
           ③ 블록 40개를 효율적으로 검사
```

> **두 사각형의 겹침을 판단하는 방법이 필요하다.** → **AABB 충돌 판정**

---

## 3. 개념

### 3-1. AABB — Axis-Aligned Bounding Box

**왜 필요한가** — 2D 게임 충돌 판정의 표준. 빠르고 간단하다.

```
   AABB = 축에 나란한(Axis-Aligned) 경계 상자(Bounding Box)

   축에 나란하다 = 기울어지지 않았다

   ┌──────┐        ╱╲
   │      │       ╱  ╲
   │ AABB │      ╱    ╲     ← 이건 AABB가 아니다
   └──────┘      ╲    ╱        (회전한 사각형 = OBB, 훨씬 복잡)
                  ╲  ╱
                   ╲╱
```

**사각형 표현 방법 두 가지**

```c
// ① 좌상단 + 크기 (게임에서 흔함)
typedef struct { double x, y, w, h; } Rect;

// ② 좌상단 + 우하단
typedef struct { double left, top, right, bottom; } RectLTRB;
```

```
   Rect { x=10, y=5, w=8, h=3 }

        x=10          x+w=18
         ├──────────────┤
   y=5   ┌──────────────┐
         │              │
   y+h=8 └──────────────┘

   left   = x        = 10
   top    = y        =  5
   right  = x + w    = 18
   bottom = y + h    =  8
```

### 3-2. 겹침 조건 — 공식 유도

**왜 필요한가** — 외우지 말고 유도할 수 있어야 한다. 그래야 안 헷갈린다.

**먼저 1차원(x축)만 생각한다.**

```
   두 선분이 겹치는가?

   [ 겹침 X — A가 왼쪽 ]
   A: ├────┤
   B:            ├────┤
      A.right < B.left   ← 이러면 안 겹친다

   [ 겹침 X — A가 오른쪽 ]
   A:            ├────┤
   B: ├────┤
      A.left > B.right   ← 이러면 안 겹친다

   [ 겹침 O ]
   A: ├────────┤
   B:      ├────────┤
      위 두 조건이 모두 거짓
```

```
   x축에서 겹침  =  A.right > B.left  AND  A.left < B.right
```

**y축도 똑같다.**

```
   y축에서 겹침  =  A.bottom > B.top  AND  A.top < B.bottom
```

**2차원에서는 두 축이 모두 겹쳐야 한다.**

```
   ★ AABB 겹침 조건

   A.left   < B.right  &&
   A.right  > B.left   &&
   A.top    < B.bottom &&
   A.bottom > B.top
```

```
   왜 두 축 모두 필요한가?

   [ x축만 겹침 → 실제로는 안 겹침 ]

        ┌──────┐
        │  A   │
        └──────┘
        ┌──────┐        ← x 범위는 겹치지만
        │  B   │            y가 떨어져 있다
        └──────┘

   ★ 한 축이라도 어긋나면 겹치지 않는다
```

```c
int IsOverlap(const Rect* a, const Rect* b)
{
    if (a->x >= b->x + b->w) return 0;      // A가 B 오른쪽
    if (a->x + a->w <= b->x) return 0;      // A가 B 왼쪽
    if (a->y >= b->y + b->h) return 0;      // A가 B 아래
    if (a->y + a->h <= b->y) return 0;      // A가 B 위

    return 1;                                // 네 조건 다 통과 → 겹침
}
```

> **"안 겹치는 경우를 먼저 걸러낸다"**는 early return 방식(Day 14)이 읽기 쉽다.
> 그리고 대부분의 경우 첫 번째 조건에서 바로 끝나므로 **빠르다.**

### 3-3. ⚠️ `<` 인가 `<=` 인가

**왜 필요한가** — 딱 붙어 있을 때를 겹침으로 볼 것인가. 결과가 달라진다.

```
   A: ├────┤
   B:      ├────┤
           ▲
           A.right == B.left  (딱 붙음)

   <  사용:  겹침 아님   ← 대부분 이게 자연스럽다
   <= 사용:  겹침
```

> 게임에서는 보통 **`<` (딱 붙은 건 겹침 아님)** 을 쓴다.
> 벽에 딱 붙어 서 있는 캐릭터가 계속 충돌 판정되면 곤란하기 때문이다.
>
> **중요한 건 프로젝트 전체에서 일관되게 하나만 쓰는 것이다.**

### 3-4. 충돌 방향 판별 — 어느 면에 맞았나

**왜 필요한가** — `vy`만 뒤집으면 옆에서 맞았을 때 이상해진다.

```
   [ 위/아래에서 충돌 ]        [ 옆에서 충돌 ]

        ●                          ┌────────┐
        ↓                       ●→ │  블록   │
   ┌────────┐                      └────────┘
   │  블록   │
   └────────┘                   vx = -vx  (좌우 반사)

   vy = -vy  (상하 반사)
```

**판별 방법 — 겹친 깊이를 비교한다**

```
   겹침 영역의 가로 깊이와 세로 깊이를 잰다

   ┌──────────────┐
   │    블록       │
   │         ┌────┼────┐
   │         │▓▓▓▓│    │       ▓ = 겹친 영역
   └─────────┼────┘    │
             │   공     │
             └─────────┘

   가로 깊이(overlapX) 와 세로 깊이(overlapY) 중
   ★ 더 작은 쪽이 "방금 뚫고 들어온 방향"이다
```

```
   [ 세로로 얕게 겹침 ]  →  위에서 왔다  →  vy 반사

   ┌──────────────┐
   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← overlapY 작다
   └──────────────┘
        공

   [ 가로로 얕게 겹침 ]  →  옆에서 왔다  →  vx 반사

   ┌─┬────────────┐
   │▓│            │
   │▓│   블록      │     ← overlapX 작다
   │▓│            │
   └─┴────────────┘
   공
```

```c
void ResolveCollision(Ball* b, const Rect* block)
{
    Rect ballRect = { b->x, b->y, BALL_SIZE, BALL_SIZE };

    // 각 축의 겹친 깊이 계산
    double overlapLeft   = (ballRect.x + ballRect.w) - block->x;
    double overlapRight  = (block->x + block->w) - ballRect.x;
    double overlapTop    = (ballRect.y + ballRect.h) - block->y;
    double overlapBottom = (block->y + block->h) - ballRect.y;

    // 각 축에서 더 작은 쪽
    double overlapX = (overlapLeft < overlapRight) ? overlapLeft : overlapRight;
    double overlapY = (overlapTop < overlapBottom) ? overlapTop : overlapBottom;

    if (overlapX < overlapY)
    {
        b->vx = -b->vx;                          // 좌우 반사
        b->x += (overlapLeft < overlapRight) ? -overlapX : overlapX;   // 위치 보정
    }
    else
    {
        b->vy = -b->vy;                          // 상하 반사
        b->y += (overlapTop < overlapBottom) ? -overlapY : overlapY;
    }
}
```

> **위치 보정을 잊지 않는다.** (Day 22의 그 원칙)
> 반사만 하고 겹친 채로 두면 다음 프레임에 또 충돌 판정되어 진동한다.

### 3-5. 블록 관리 — 2차원 배열

**왜 필요한가** — 블록 40개를 개별 변수로 관리할 수 없다. (Day 12의 맵과 같은 발상)

```c
#define BLOCK_ROWS  4
#define BLOCK_COLS 10

typedef struct
{
    int hp;              // 0 = 파괴됨, 1 이상 = 남은 내구도
    int score;           // 파괴 시 점수
} Block;

Block g_blocks[BLOCK_ROWS][BLOCK_COLS];
```

```
   g_blocks[y][x]        (Day 12의 map[y][x]와 같은 구조)

        x=0   1   2   3   4   5   6   7   8   9
   y=0  [2] [2] [2] [2] [2] [2] [2] [2] [2] [2]    ← 위쪽은 단단한 블록
   y=1  [2] [2] [0] [2] [2] [2] [2] [0] [2] [2]    ← 0 = 이미 깨짐
   y=2  [1] [1] [1] [0] [1] [1] [1] [1] [1] [1]
   y=3  [1] [1] [1] [1] [1] [1] [0] [1] [1] [1]
```

**블록의 화면 좌표 계산**

```c
#define BLOCK_W  4
#define BLOCK_H  1
#define BLOCK_OFFSET_X  0
#define BLOCK_OFFSET_Y  0

Rect GetBlockRect(int row, int col)
{
    Rect r;
    r.x = BLOCK_OFFSET_X + col * BLOCK_W;
    r.y = BLOCK_OFFSET_Y + row * BLOCK_H;
    r.w = BLOCK_W;
    r.h = BLOCK_H;
    return r;
}
```

```
   블록 인덱스 → 화면 좌표

   col=0    col=1    col=2
   ├────────┼────────┼────────┤
   x=0      x=4      x=8

   x = col × BLOCK_W

   ★ Day 56(맵툴)의 그리드 좌표 변환과 완전히 같은 계산이다
```

### 3-6. ⚠️ 한 프레임에 여러 블록 충돌

**왜 필요한가** — 처리를 안 하면 블록 하나를 치는데 세 개가 사라진다.

```
   공이 블록 경계에 맞으면

   ┌────┬────┐
   │ A  │ B  │
   └────┴────┘
       ●          ← A와 B 둘 다와 겹친다

   순진하게 처리하면:  A 파괴 + vy 뒤집기
                       B 파괴 + vy 또 뒤집기   ← 원래대로 돌아간다!
```

**해결 방법 3가지**

| 방법 | 설명 | 난이도 |
|---|---|---|
| **첫 충돌만 처리하고 `break`** | 가장 간단. 대부분 충분하다 ← **오늘은 이걸로** |
| 가장 깊이 겹친 것 하나만 | 더 정확 | 중간 |
| 전부 파괴하되 반사는 한 번 | 시원한 손맛 | 중간 |

```c
void CheckBlockCollision(Ball* b)
{
    for (int row = 0; row < BLOCK_ROWS; row++)
    {
        for (int col = 0; col < BLOCK_COLS; col++)
        {
            if (g_blocks[row][col].hp <= 0) continue;      // 이미 깨짐

            Rect blockRect = GetBlockRect(row, col);
            Rect ballRect  = { b->x, b->y, BALL_SIZE, BALL_SIZE };

            if (!IsOverlap(&ballRect, &blockRect)) continue;

            // 충돌!
            g_blocks[row][col].hp--;

            if (g_blocks[row][col].hp <= 0)
            {
                g_score += g_blocks[row][col].score;
                g_remainBlocks--;
            }

            ResolveCollision(b, &blockRect);

            return;                        // ★ 이번 프레임은 여기까지
        }
    }
}
```

> `return` (또는 이중 `break`) 이 핵심이다.
> 없으면 나머지 블록도 계속 검사해서 위의 문제가 생긴다.

### 3-7. 성능 — 검사 횟수 줄이기

**왜 필요한가** — 지금은 40개라 괜찮지만, 개수가 늘면 문제가 된다.

```
   공 1개 × 블록 40개 = 40회/프레임        →  괜찮다
   공 5개 × 블록 200개 = 1,000회/프레임    →  슬슬 부담
   총알 200개 × 적 500개 = 100,000회/프레임 →  느려진다  (Day 54)
```

**간단한 최적화 — 영역 밖이면 건너뛰기**

```c
    // 공이 블록 영역 아래에 있으면 검사할 필요 없다
    double blockAreaBottom = BLOCK_OFFSET_Y + BLOCK_ROWS * BLOCK_H;

    if (b->y > blockAreaBottom + 1)
        return;                            // 40회 검사를 통째로 생략
```

**더 나은 방법 — 공 근처 블록만 계산으로 찾기**

```c
    // 공 위치에서 블록 인덱스를 역산 (Day 56의 역변환과 같은 발상)
    int col = (int)((b->x - BLOCK_OFFSET_X) / BLOCK_W);
    int row = (int)((b->y - BLOCK_OFFSET_Y) / BLOCK_H);

    // 그 주변 3×3만 검사 → 40회가 9회로
    for (int r = row - 1; r <= row + 1; r++)
        for (int c = col - 1; c <= col + 1; c++)
        {
            if (r < 0 || r >= BLOCK_ROWS) continue;
            if (c < 0 || c >= BLOCK_COLS) continue;
            // ... 검사 ...
        }
```

> 이것을 **공간 분할(spatial partitioning)** 이라고 한다.
> **Day 54**에서 슈팅게임의 충돌 최적화로 다시 나온다.
> 오늘은 개념만 알고, 구현은 단순 순회로 해도 된다.

---

## 4. 따라 만들기

### Step 1 — Rect 구조체와 AABB 함수

```c
typedef struct
{
    double x, y, w, h;
} Rect;

int IsOverlap(const Rect* a, const Rect* b)
{
    if (a->x >= b->x + b->w) return 0;
    if (a->x + a->w <= b->x) return 0;
    if (a->y >= b->y + b->h) return 0;
    if (a->y + a->h <= b->y) return 0;
    return 1;
}
```

**테스트**

```c
    Rect A = {  0,  0, 10, 10 };
    Rect B = {  5,  5, 10, 10 };     // 겹침
    Rect C = { 20, 20, 10, 10 };     // 안 겹침
    Rect D = { 10,  0, 10, 10 };     // 딱 붙음

    printf("A-B: %d (기대 1)\n", IsOverlap(&A, &B));
    printf("A-C: %d (기대 0)\n", IsOverlap(&A, &C));
    printf("A-D: %d (기대 0)\n", IsOverlap(&A, &D));
```

**✅ 여기까지 실행하면** — 세 결과가 기대대로 나온다. AABB 공식이 검증됐다.

### Step 2 — 블록 배열과 초기화

```c
#define BLOCK_ROWS  4
#define BLOCK_COLS 10
#define BLOCK_W     4
#define BLOCK_H     1

typedef struct
{
    int hp;
    int score;
} Block;

Block g_blocks[BLOCK_ROWS][BLOCK_COLS];
int   g_remainBlocks = 0;
int   g_score = 0;

void InitBlocks(void)
{
    g_remainBlocks = 0;

    for (int row = 0; row < BLOCK_ROWS; row++)
    {
        for (int col = 0; col < BLOCK_COLS; col++)
        {
            // 위쪽 줄일수록 단단하고 점수가 높다
            g_blocks[row][col].hp    = (row < 2) ? 2 : 1;
            g_blocks[row][col].score = (row < 2) ? 20 : 10;

            g_remainBlocks++;
        }
    }
}
```

**✅ 여기까지 실행하면** — 블록 데이터가 준비된다. (아직 안 보인다)

### Step 3 — 블록 렌더링

```c
Rect GetBlockRect(int row, int col)
{
    Rect r;
    r.x = col * BLOCK_W;
    r.y = row * BLOCK_H;
    r.w = BLOCK_W;
    r.h = BLOCK_H;
    return r;
}

void RenderBlocks(char screen[][SCREEN_W + 1])
{
    for (int row = 0; row < BLOCK_ROWS; row++)
    {
        for (int col = 0; col < BLOCK_COLS; col++)
        {
            Rect r = GetBlockRect(row, col);
            int sx = (int)r.x;
            int sy = (int)r.y;

            if (sy < 0 || sy >= SCREEN_H) continue;

            const char* pattern;

            if      (g_blocks[row][col].hp >= 2) pattern = "[==]";
            else if (g_blocks[row][col].hp == 1) pattern = "[--]";
            else                                  pattern = "    ";

            for (int i = 0; i < BLOCK_W && sx + i < SCREEN_W; i++)
                screen[sy][sx + i] = pattern[i];
        }
    }
}
```

**✅ 여기까지 실행하면** — 화면 위쪽에 블록 40개가 그려진다.
단단한 블록은 `[==]`, 약한 블록은 `[--]` 로 보인다.

<!-- SHOT: Step 3 블록 배치 -->

### Step 4 — 충돌 검사 (반사 방향 없이)

```c
void CheckBlockCollision(Ball* b)
{
    Rect ballRect = { b->x, b->y, 1.0, 1.0 };

    for (int row = 0; row < BLOCK_ROWS; row++)
    {
        for (int col = 0; col < BLOCK_COLS; col++)
        {
            if (g_blocks[row][col].hp <= 0) continue;

            Rect blockRect = GetBlockRect(row, col);

            if (!IsOverlap(&ballRect, &blockRect)) continue;

            // 충돌 처리 (임시: vy만 뒤집기)
            g_blocks[row][col].hp = 0;
            g_score += g_blocks[row][col].score;
            g_remainBlocks--;

            b->vy = -b->vy;

            return;
        }
    }
}
```

**✅ 여기까지 실행하면** — **공이 블록을 부순다!**
다만 옆에서 맞아도 위아래로만 튕겨서 어색하다.

### Step 5 — 충돌 방향 판별

```c
void ResolveCollision(Ball* b, const Rect* block)
{
    Rect ball = { b->x, b->y, 1.0, 1.0 };

    double overlapLeft   = (ball.x + ball.w) - block->x;
    double overlapRight  = (block->x + block->w) - ball.x;
    double overlapTop    = (ball.y + ball.h) - block->y;
    double overlapBottom = (block->y + block->h) - ball.y;

    double overlapX = (overlapLeft < overlapRight) ? overlapLeft : overlapRight;
    double overlapY = (overlapTop  < overlapBottom) ? overlapTop  : overlapBottom;

    if (overlapX < overlapY)
    {
        b->vx = -b->vx;
        b->x += (overlapLeft < overlapRight) ? -overlapX : overlapX;
        g_lastHitDir = 0;                    // 가로 반사
    }
    else
    {
        b->vy = -b->vy;
        b->y += (overlapTop < overlapBottom) ? -overlapY : overlapY;
        g_lastHitDir = 1;                    // 세로 반사
    }
}
```

`CheckBlockCollision`에서 `b->vy = -b->vy;` 를 `ResolveCollision(b, &blockRect);` 로 교체한다.

**✅ 여기까지 실행하면** — 블록 옆면에 맞으면 좌우로, 위아래에 맞으면 상하로 튕긴다.
화면의 `충돌 방향` 표시로 확인할 수 있다.

<!-- SHOT: Step 5 방향 판별 -->

### Step 6 — 내구도 블록

```c
            // 충돌 처리
            g_blocks[row][col].hp--;                   // ★ 0으로 만들지 않고 감소

            if (g_blocks[row][col].hp <= 0)
            {
                g_score += g_blocks[row][col].score;
                g_remainBlocks--;
            }
            else
            {
                g_score += 5;                          // 부분 타격 점수
            }

            ResolveCollision(b, &blockRect);
            return;
```

**✅ 여기까지 실행하면** — `[==]` 블록은 한 번 맞으면 `[--]` 로 바뀌고, 두 번째에 사라진다.

### Step 7 — 여러 블록 동시 충돌 확인

`return`을 주석 처리하고 실행해 본다.

```c
            ResolveCollision(b, &blockRect);
            // return;                       // ← 주석 처리
```

**✅ 여기까지 실행하면** — 블록 경계에 맞으면 **여러 개가 한꺼번에 사라지거나 공이 이상하게 튄다.**

> 확인했으면 `return`을 되살린다. 3-6절에서 설명한 그 문제다.

### Step 8 — 클리어 판정

```c
        // Update 안에서
        if (g_remainBlocks <= 0)
        {
            g_stageClear = 1;
            g_running = 0;
        }
```

```c
void RenderResult(void)
{
    printf("\n\n");
    if (g_stageClear)
    {
        printf("   ╔═══════════════════════════════╗\n");
        printf("   ║       S T A G E   C L E A R    ║\n");
        printf("   ╚═══════════════════════════════╝\n\n");
    }
    else
    {
        printf("   ╔═══════════════════════════════╗\n");
        printf("   ║        G A M E   O V E R      ║\n");
        printf("   ╚═══════════════════════════════╝\n\n");
    }

    printf("      SCORE  %d\n", g_score);
    printf("      남은 블록  %d\n", g_remainBlocks);
}
```

**✅ 여기까지 실행하면** — 블록을 다 깨면 클리어 화면이 나온다.

### Step 9 — HUD

```c
void RenderInfo(void)
{
    printf("\n   남은 블록  %2d / %2d      SCORE  %-6d\n",
           g_remainBlocks, BLOCK_ROWS * BLOCK_COLS, g_score);

    printf("   충돌 방향  %-10s   LIFE ",
           g_lastHitDir == 0 ? "가로 반사" : "세로 반사");

    for (int i = 0; i < MAX_LIFE; i++)
        printf("%s", i < g_life ? "♥" : "♡");
    printf("      \n");
}
```

**✅ 여기까지 실행하면** — 1절의 완성 화면이 나온다.

### Step 10 — 영역 최적화 (선택)

```c
void CheckBlockCollision(Ball* b)
{
    double blockAreaBottom = BLOCK_ROWS * BLOCK_H;

    if (b->y > blockAreaBottom + 1)
    {
        g_checkCount = 0;                    // 검사 안 함
        return;
    }

    g_checkCount = 0;

    for (int row = 0; row < BLOCK_ROWS; row++)
        for (int col = 0; col < BLOCK_COLS; col++)
        {
            g_checkCount++;                  // 검사 횟수 측정
            // ...
        }
}
```

HUD에 `검사 횟수: %d` 를 추가한다.

**✅ 여기까지 실행하면** — 공이 아래쪽에 있을 때 검사 횟수가 **0**이 되는 것을 확인할 수 있다.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
╔═══════════════════════════════════════════╗
║          A R K A N O I D                   ║
╚═══════════════════════════════════════════╝

  ┌────────────────────────────────────────┐
  │[==][==][==][==][==][==][==][==][==][==] │
  │[==][==][  ][==][==][==][==][  ][==][==] │
  │[--][--][--][  ][--][--][--][--][--][--] │
  │[--][--][--][--][--][--][  ][--][--][--] │
  │                                        │
  │                @                       │
  │                                        │
  │                                        │
  │                                        │
  │                  ========              │
  └────────────────────────────────────────┘

   남은 블록  35 / 40      SCORE  350
   충돌 방향  세로 반사     LIFE ♥♥♥
   검사 횟수  40
```

- [ ] `IsOverlap` 테스트 3종이 기대대로 나온다
- [ ] 공이 블록에 닿으면 블록이 사라진다
- [ ] **블록 옆면**에 맞으면 좌우로 튕긴다
- [ ] **블록 위아래**에 맞으면 상하로 튕긴다
- [ ] 단단한 블록은 두 번 맞아야 깨진다
- [ ] `return`을 빼면 여러 블록이 한꺼번에 사라지는 것을 확인했다
- [ ] 공이 블록에 끼이지 않는다
- [ ] 블록을 다 깨면 클리어 화면이 나온다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 공이 블록을 통과 | 판정 크기 오류 | 블록 `Rect`의 `w`, `h` 확인 |
| 블록 하나 치면 여러 개 사라짐 | 순회 계속 진행 | 충돌 후 `return` |
| 반사 방향이 항상 세로 | `vy`만 뒤집음 | 겹침 깊이 비교로 방향 판별 |
| 공이 블록에 끼임 | 위치 보정 누락 | `ResolveCollision`에서 위치도 밀어낸다 |
| 딱 붙었는데 충돌 판정 | `<=` 사용 | `<` 로 통일 |
| 블록이 화면에 안 보임 | 좌표 계산 오류 | `col * BLOCK_W` 확인 |
| 클리어가 안 됨 | 비활성 블록까지 셈 | `hp <= 0`은 카운트에서 제외 |
| 빠른 공이 블록을 뚫음 | 터널링 (Day 22) | 속도 상한 또는 이동 분할 |
| 프레임 저하 | 검사 횟수 과다 | 영역 필터링 또는 근처만 검사 |
| 점수가 두 번 오름 | 내구도 처리 시 중복 가산 | 파괴 시에만 본 점수 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **AABB** | 축에 나란한 사각형. 2D 충돌의 표준 |
| **겹침 조건** | 두 축 **모두** 겹쳐야 겹침. 한 축이라도 어긋나면 아니다 |
| `<` vs `<=` | 딱 붙은 것을 겹침으로 볼지. **일관되게** 하나만 |
| **충돌 방향** | 겹친 깊이가 **작은 축**이 뚫고 들어온 방향 |
| 위치 보정 | 반사와 항상 세트. 겹친 채 두면 진동 |
| 다중 충돌 | 첫 충돌만 처리하고 `return` |
| 성능 | 영역 필터링 / 근처만 검사 (공간 분할) |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 47** | 격투게임 hitbox / hurtbox — 같은 AABB |
| Day 54 | 슈팅 총알-적 충돌 + 그룹별 최적화 |
| Day 57 | 맵툴 마우스-타일 판정 |
| Day 65 | 택틱스 공격 범위 |
| Day 73 | Unity `Collider` — 엔진이 대신 해준다. **원리는 같다** |
| Day 87 | 타워 배치 가능 판정 |

### Week 5 회수 — "배우는 기능"이 다 나왔나

| Week 5 학습 목표 | 어디서 | 확인 |
|---|---|:--:|
| 게임 루프 | Day 21 | ☑ |
| 프레임 개념 | Day 21 | ☑ |
| 충돌 판정 | Day 24 | ☑ |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 블록 배치 패턴을 2차원 배열 데이터로 분리 | Day 12의 맵 데이터 방식 |
| ★★ | 아이템 블록 — 깨지면 아이템이 떨어지고 받으면 효과 | 떨어지는 아이템도 AABB로 패들과 판정 |
| ★★★ | 원-사각형 충돌 판정 (공을 진짜 원으로) | 사각형에서 원 중심에 가장 가까운 점을 구해 거리 비교 |

### 다음 시간

> 게임의 뼈대가 완성됐다. 이제 **게임답게 만든다.**
> 점수, 라이프, 스테이지, 타이틀 화면, 결과 화면.
>
> 그리고 Part 1의 콘솔 구간이 여기서 끝난다.
>
> → **Day 25, 점수·라이프 · 문서 05 완성**
