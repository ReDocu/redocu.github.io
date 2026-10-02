# Day 017 · enum과 상태 관리

> **Week 4** · 연결 문서 `04 갬블 게임` — Step 2
> 선수: Day 016 (난수, 확률 판정)

---

## 1. 오늘 만드는 것

**베팅 → 굴림 → 정산**이 순서대로 진행되는 라운드 구조.

```
╔═══════════════════════════════════╗
║      럭키 다이스   Round 3        ║
╚═══════════════════════════════════╝

  소지금   1,240 G        목표 3,000 G
  전적     2승 0패

───────────────────────── [ 베팅 ]

  1. 홀짝        배당 1.9배   (승률 50%)
  2. 숫자 지정   배당 5.5배   (승률 16.7%)
  3. 하이/로우   배당 2.8배   (승률 33.3%)
  0. 그만하기

  선택 (0~3): 1
  홀(1) / 짝(2): 1
  베팅액 (10~1240): 200

───────────────────────── [ 굴림 ]

      ┌───────┐
      │ ●   ● │
      │   ●   │      >>  5   (홀)
      │ ●   ● │
      └───────┘

───────────────────────── [ 정산 ]

  >> 적중!  200 G  ->  380 G   (+180)

  소지금  1,240  ->  1,420 G
```

**조작** — 베팅 종류, 예측값, 금액을 입력.

<!-- SHOT: Day 17 완성 화면 -->

---

## 2. 막히는 상황

주사위 게임에 라운드 구조를 붙여 보자.

```c
    int state = 0;

    while (running)
    {
        if (state == 0)       { /* 베팅 */  state = 1; }
        else if (state == 1)  { /* 굴림 */  state = 2; }
        else if (state == 2)  { /* 정산 */  state = 0; }
    }
```

3일 뒤에 이 코드를 보면 **`state == 2`가 무슨 단계인지 모른다.**
그리고 단계를 하나 추가하면 숫자를 전부 다시 매겨야 한다.

베팅 종류도 마찬가지다.

```c
    if (betType == 1) { /* 홀짝? 숫자지정? */ }
```

```
   지금:   state = 2       ← 주석을 봐야 안다. 주석이 코드와 어긋나면 끝
           betType = 3

   필요:   state = PHASE_SETTLE      ← 코드 자체가 설명이다
           betType = BET_HIGHLOW
```

> **숫자에 이름을 붙이는 방법이 필요하다.** → **`enum`**

---

## 3. 개념

### 3-1. `enum` — 이름 붙은 정수 집합

**왜 필요한가** — 관련된 상수들을 한 덩어리로 묶고, 자동으로 번호를 매긴다.

```c
enum GamePhase
{
    PHASE_BET,          // 0
    PHASE_ROLL,         // 1
    PHASE_SETTLE,       // 2
    PHASE_GAMEOVER      // 3
};
```

```
   자동으로 0부터 순서대로 번호가 붙는다

   PHASE_BET       = 0
   PHASE_ROLL      = 1
   PHASE_SETTLE    = 2
   PHASE_GAMEOVER  = 3

   ★ 중간에 하나를 끼워 넣어도 나머지가 자동으로 밀린다
```

**사용**

```c
enum GamePhase phase = PHASE_BET;

if (phase == PHASE_SETTLE)
    printf("정산 중\n");
```

**`typedef`로 짧게**

```c
typedef enum
{
    PHASE_BET,
    PHASE_ROLL,
    PHASE_SETTLE,
    PHASE_GAMEOVER
} GamePhase;

GamePhase phase = PHASE_BET;          // enum 키워드 불필요
```

### 3-2. `enum` vs `#define`

**왜 필요한가** — 둘 다 되는데 왜 `enum`을 쓰는가.

```c
// #define 방식
#define PHASE_BET       0
#define PHASE_ROLL      1
#define PHASE_SETTLE    2

// enum 방식
typedef enum { PHASE_BET, PHASE_ROLL, PHASE_SETTLE } GamePhase;
```

| | `#define` | `enum` |
|---|---|---|
| 번호 매기기 | **직접** (실수 가능) | **자동** |
| 자료형 | 없음 (단순 치환) | 있음 (`GamePhase`) |
| 디버거에서 | `2`로 보임 | **`PHASE_SETTLE`로 보임** |
| 그룹으로 묶임 | X | **O** |
| 개수 세기 | 직접 | `PHASE_COUNT` 트릭 가능 |

**개수 세기 트릭**

```c
typedef enum
{
    BET_ODDEVEN,        // 0
    BET_NUMBER,         // 1
    BET_HIGHLOW,        // 2

    BET_COUNT           // 3  ← 자동으로 개수가 된다!
} BetType;

const char* g_betNames[BET_COUNT] = { "홀짝", "숫자 지정", "하이/로우" };
//                        ▲ 항목을 추가하면 배열 크기도 자동으로 맞춰진다
```

> 이 트릭을 쓰면 **항목을 추가할 때 개수를 손으로 고칠 필요가 없다.**
> 앞으로 자주 쓰게 된다.

### 3-3. 값 직접 지정

**왜 필요한가** — 특정 값을 강제해야 할 때 (파일 포맷, 키 코드 등).

```c
typedef enum
{
    KEY_UP    = 72,
    KEY_DOWN  = 80,
    KEY_LEFT  = 75,
    KEY_RIGHT = 77
} KeyCode;
```

```c
typedef enum
{
    LEVEL_EASY   = 1,
    LEVEL_NORMAL,        // 2 (앞 값 + 1)
    LEVEL_HARD,          // 3
    LEVEL_EXPERT = 10    // 10
} Level;
```

### 3-4. 상태 머신 — 단계가 순서대로 흐르는 구조

**왜 필요한가** — 게임의 진행을 명확한 단계로 나눈다.

```
   ┌───────────┐   베팅 완료   ┌───────────┐   굴림 완료   ┌────────────┐
   │ PHASE_BET │ ────────────▶ │PHASE_ROLL │ ────────────▶ │PHASE_SETTLE│
   └───────────┘               └───────────┘               └─────┬──────┘
        ▲                                                        │
        │                    다음 라운드                          │
        └────────────────────────────────────────────────────────┤
                                                                 │ 파산 / 목표 달성
                                                                 ▼
                                                        ┌────────────────┐
                                                        │ PHASE_GAMEOVER │
                                                        └────────────────┘
```

```c
GamePhase phase = PHASE_BET;

while (running)
{
    switch (phase)
    {
    case PHASE_BET:
        DoBetting();
        phase = PHASE_ROLL;              // ★ 다음 단계로
        break;

    case PHASE_ROLL:
        DoRoll();
        phase = PHASE_SETTLE;
        break;

    case PHASE_SETTLE:
        DoSettle();
        phase = CheckGameOver() ? PHASE_GAMEOVER : PHASE_BET;
        break;

    case PHASE_GAMEOVER:
        running = 0;
        break;
    }
}
```

> **이것이 유한 상태 머신(FSM)의 가장 단순한 형태다.**
>
> | 나중에 | 형태 |
> |---|---|
> | **Day 46** | 격투게임 캐릭터 FSM (IDLE / WALK / ATTACK / HIT) |
> | Day 82 | Unity Animator — 같은 것을 GUI로 |
> | Day 106 | 파이널 프로젝트의 게임 진행 관리 |
>
> 오늘 배우는 이 `switch` 구조가 그대로 확장된다.

### 3-5. 게임 상태를 구조체로 묶기

**왜 필요한가** — 상태 변수가 늘어난다. 함수에 넘길 때 매개변수 지옥이 된다. (Day 5의 그 문제)

```c
typedef struct
{
    int       money;         // 소지금
    int       round;         // 라운드 수
    int       wins;          // 승
    int       losses;        // 패
    GamePhase phase;         // 현재 단계

    BetType   betType;       // 이번 베팅 종류
    int       betAmount;     // 베팅액
    int       prediction;    // 예측값
    int       diceResult;    // 굴림 결과
} GameState;
```

```
   ┌──────────── GameState ────────────┐
   │  money       1240                  │  ← 라운드가 바뀌어도 유지
   │  round          3                  │
   │  wins           2                  │
   │  losses         0                  │
   │  phase       PHASE_BET             │
   ├────────────────────────────────────┤
   │  betType     BET_ODDEVEN           │  ← 매 라운드 초기화
   │  betAmount    200                  │
   │  prediction     1                  │
   │  diceResult     5                  │
   └────────────────────────────────────┘

   ★ "유지되는 값"과 "라운드마다 초기화되는 값"을 구분해 둔다
```

### 3-6. 배당 테이블 — 데이터로 관리

**왜 필요한가** — 배당률을 코드 여기저기 박아 두면 밸런싱이 불가능하다. (Day 20에서 조정한다)

```c
typedef struct
{
    const char* name;        // 이름
    int         payoutX10;   // 배당 × 10 (1.9배 → 19)
    int         winPercent;  // 이론 승률
} BetInfo;

const BetInfo g_betTable[BET_COUNT] = {
    { "홀짝",      19, 50 },       // 1.9배
    { "숫자 지정", 55, 17 },       // 5.5배
    { "하이/로우", 28, 33 }        // 2.8배
};
```

> **왜 `1.9` 대신 `19`를 쓰나?**
> 실수(`float`) 연산은 오차가 생긴다. 돈 계산에서 오차는 곧 버그다.
> **정수로 10배 해서 계산하고, 마지막에 10으로 나눈다.**
>
> ```c
> int payout = betAmount * g_betTable[type].payoutX10 / 10;
> //           200        *  19                       / 10  = 380
> ```
>
> 이 기법을 **고정소수점(fixed point)** 이라고 한다. 게임에서 자주 쓴다.

---

## 4. 따라 만들기

### Step 1 — enum 정의

```c
typedef enum
{
    PHASE_BET,
    PHASE_ROLL,
    PHASE_SETTLE,
    PHASE_GAMEOVER
} GamePhase;

typedef enum
{
    BET_ODDEVEN,
    BET_NUMBER,
    BET_HIGHLOW,

    BET_COUNT               // ★ 자동 개수
} BetType;

typedef enum
{
    RESULT_NONE,
    RESULT_WIN,
    RESULT_LOSE
} RoundResult;
```

**✅ 여기까지 실행하면** — 변화 없음. 준비 작업이다.

### Step 2 — 배당 테이블

```c
typedef struct
{
    const char* name;
    int         payoutX10;
    int         winPercent;
} BetInfo;

const BetInfo g_betTable[BET_COUNT] = {
    { "홀짝",      19, 50 },
    { "숫자 지정", 55, 17 },
    { "하이/로우", 28, 33 }
};
```

메뉴 출력이 반복문 한 줄이 된다:

```c
void PrintBetMenu(void)
{
    printf("\n───────────────────────── [ 베팅 ]\n\n");

    for (int i = 0; i < BET_COUNT; i++)
    {
        printf("  %d. %-10s 배당 %d.%d배   (승률 %d%%)\n",
               i + 1,
               g_betTable[i].name,
               g_betTable[i].payoutX10 / 10,
               g_betTable[i].payoutX10 % 10,
               g_betTable[i].winPercent);
    }
    printf("  0. 그만하기\n");
}
```

**✅ 여기까지 실행하면** — 베팅 메뉴가 테이블 데이터대로 출력된다.
**베팅 종류를 추가하려면 테이블에 줄 하나만 추가**하면 된다.

### Step 3 — 게임 상태 구조체

```c
typedef struct
{
    int       money;
    int       round;
    int       wins;
    int       losses;
    GamePhase phase;

    BetType   betType;
    int       betAmount;
    int       prediction;
    int       diceResult;
} GameState;
```

```c
void InitGame(GameState* g)
{
    g->money   = 1000;
    g->round   = 1;
    g->wins    = 0;
    g->losses  = 0;
    g->phase   = PHASE_BET;
    g->betType = BET_ODDEVEN;
    g->betAmount = 0;
    g->prediction = 0;
    g->diceResult = 0;
}
```

> `GameState* g` 와 `g->money` — **Day 18 포인터**의 예고편이다.
> 구조체가 커서 값으로 복사하면 비효율적이고, 함수 안에서 바꾼 값이 밖에 안 남는다.
> 오늘은 형태만 따라 쓰고, 내일 완전히 이해한다.

**✅ 여기까지 실행하면** — 상태가 초기화된다.

### Step 4 — 상태 머신 루프

```c
int main(void)
{
    srand((unsigned int)time(NULL));

    GameState game;
    InitGame(&game);                             // ★ & 로 주소를 넘긴다

    int running = 1;

    while (running)
    {
        switch (game.phase)
        {
        case PHASE_BET:
            PrintHeader(&game);
            if (!DoBetting(&game))               // 0을 고르면 종료
            {
                game.phase = PHASE_GAMEOVER;
                break;
            }
            game.phase = PHASE_ROLL;
            break;

        case PHASE_ROLL:
            DoRoll(&game);
            game.phase = PHASE_SETTLE;
            break;

        case PHASE_SETTLE:
            DoSettle(&game);
            game.round++;

            if (game.money <= 0 || game.money >= GOAL_MONEY)
                game.phase = PHASE_GAMEOVER;
            else
                game.phase = PHASE_BET;
            break;

        case PHASE_GAMEOVER:
            PrintResult(&game);
            running = 0;
            break;
        }
    }

    return 0;
}
```

**✅ 여기까지 실행하면** — 단계가 순서대로 흐른다. 각 함수에 `printf`를 넣어 확인한다.

```
[BET] 단계
[ROLL] 단계
[SETTLE] 단계
[BET] 단계
...
```

### Step 5 — 베팅 단계

```c
// 계속하면 1, 그만두면 0
int DoBetting(GameState* g)
{
    PrintBetMenu();

    int sel = ReadInt("\n  선택", 0, BET_COUNT);     // Day 8의 함수
    if (sel == 0) return 0;

    g->betType = (BetType)(sel - 1);                 // 1~3 → 0~2

    // 베팅 종류별 예측값 입력
    switch (g->betType)
    {
    case BET_ODDEVEN:
        g->prediction = ReadInt("  홀(1) / 짝(2)", 1, 2);
        break;

    case BET_NUMBER:
        g->prediction = ReadInt("  숫자 지정", 1, 6);
        break;

    case BET_HIGHLOW:
        g->prediction = ReadInt("  로우 1-2(1) / 미들 3-4(2) / 하이 5-6(3)", 1, 3);
        break;

    default:
        break;
    }

    int maxBet = g->money;
    g->betAmount = ReadInt("  베팅액", MIN_BET, maxBet);

    return 1;
}
```

**✅ 여기까지 실행하면** — 베팅 종류에 따라 다른 예측값 입력을 받는다.

### Step 6 — 굴림 단계

```c
void DoRoll(GameState* g)
{
    printf("\n───────────────────────── [ 굴림 ]\n\n");

    // 굴리는 연출
    for (int i = 0; i < 8; i++)
    {
        printf("\r      굴리는 중...  %d", RandRange(1, 6));
        // Sleep(80);        ← Day 21에서 배운다
    }
    printf("\r                              \r");

    g->diceResult = RandRange(1, 6);             // Day 16의 함수
    DrawDice(g->diceResult);

    // 부가 정보
    printf("   (%s, %s)\n",
           g->diceResult % 2 == 1 ? "홀" : "짝",
           g->diceResult <= 2 ? "로우" : (g->diceResult <= 4 ? "미들" : "하이"));
}
```

**✅ 여기까지 실행하면** — 주사위가 굴려지고 결과가 그려진다.

### Step 7 — 정산 단계

```c
// 적중했는가?
int IsWin(const GameState* g)
{
    int d = g->diceResult;

    switch (g->betType)
    {
    case BET_ODDEVEN:
        return (d % 2 == 1) ? (g->prediction == 1) : (g->prediction == 2);

    case BET_NUMBER:
        return d == g->prediction;

    case BET_HIGHLOW:
        {
            int zone = (d <= 2) ? 1 : ((d <= 4) ? 2 : 3);
            return zone == g->prediction;
        }

    default:
        return 0;
    }
}

void DoSettle(GameState* g)
{
    printf("\n───────────────────────── [ 정산 ]\n\n");

    int before = g->money;

    if (IsWin(g))
    {
        int payout = g->betAmount * g_betTable[g->betType].payoutX10 / 10;
        int profit = payout - g->betAmount;

        g->money += profit;
        g->wins++;

        printf("  >> 적중!  %d G  ->  %d G   (+%d)\n",
               g->betAmount, payout, profit);
    }
    else
    {
        g->money -= g->betAmount;
        g->losses++;

        printf("  >> 빗나갔다.  -%d G\n", g->betAmount);
    }

    printf("\n  소지금  %d  ->  %d G\n", before, g->money);
}
```

**✅ 여기까지 실행하면** — 1절의 완성 화면대로 한 라운드가 완결된다.

<!-- SHOT: Step 7 실행 화면 -->

### Step 8 — 헤더와 결과 화면

```c
#define GOAL_MONEY  3000
#define MIN_BET       10

void PrintHeader(const GameState* g)
{
    printf("\n╔═══════════════════════════════════╗\n");
    printf("║      럭키 다이스   Round %-8d ║\n", g->round);
    printf("╚═══════════════════════════════════╝\n\n");

    printf("  소지금   %5d G        목표 %d G\n", g->money, GOAL_MONEY);
    printf("  전적     %d승 %d패\n", g->wins, g->losses);
}

void PrintResult(const GameState* g)
{
    printf("\n╔═══════════════════════════════════╗\n");

    if (g->money >= GOAL_MONEY)
        printf("║           목표 달성!              ║\n");
    else if (g->money <= 0)
        printf("║            파  산                 ║\n");
    else
        printf("║         게임 종료                 ║\n");

    printf("╚═══════════════════════════════════╝\n\n");

    printf("    최종 소지금   %d G\n", g->money);
    printf("    플레이 라운드 %d\n", g->round - 1);
    printf("    전적          %d승 %d패", g->wins, g->losses);

    if (g->wins + g->losses > 0)
        printf("  (승률 %.1f%%)", g->wins * 100.0 / (g->wins + g->losses));
    printf("\n");
}
```

**✅ 여기까지 실행하면** — 파산하거나 목표를 달성하면 결과 화면이 나온다.

### Step 9 — enum 값 확인 (이해 점검)

```c
    printf("PHASE_BET      = %d\n", PHASE_BET);       // 0
    printf("PHASE_SETTLE   = %d\n", PHASE_SETTLE);    // 2
    printf("BET_COUNT      = %d\n", BET_COUNT);       // 3
```

**✅ 여기까지 실행하면** — enum이 0부터 자동으로 번호가 매겨지는 것을 확인할 수 있다.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
╔═══════════════════════════════════╗
║      럭키 다이스   Round 3        ║
╚═══════════════════════════════════╝

  소지금    1240 G        목표 3000 G
  전적     2승 0패

───────────────────────── [ 베팅 ]

  1. 홀짝       배당 1.9배   (승률 50%)
  2. 숫자 지정  배당 5.5배   (승률 17%)
  3. 하이/로우  배당 2.8배   (승률 33%)
  0. 그만하기

  선택 (0~3): 1
  홀(1) / 짝(2) (1~2): 1
  베팅액 (10~1240): 200

───────────────────────── [ 굴림 ]

      ┌───────┐
      │ ●   ● │
      │   ●   │
      │ ●   ● │
      └───────┘

        >>  5
   (홀, 하이)

───────────────────────── [ 정산 ]

  >> 적중!  200 G  ->  380 G   (+180)

  소지금  1240  ->  1420 G
```

- [ ] 베팅 → 굴림 → 정산이 순서대로 진행된다
- [ ] 베팅 종류에 따라 다른 예측값 입력을 받는다
- [ ] 배당 테이블에 줄 하나를 추가하면 메뉴에 자동으로 나온다
- [ ] 적중/빗나감이 정확히 판정된다
- [ ] 소지금이 0이 되면 파산, 3000이 되면 목표 달성 화면이 나온다
- [ ] `BET_COUNT`가 자동으로 3이 된다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| enum 값이 예상과 다름 | 중간에 값을 직접 지정 | 지정 이후는 그 값 + 1로 이어진다 |
| 배열 크기와 enum 개수 불일치 | 항목 추가 후 배열 크기 미수정 | `BET_COUNT` 트릭 사용 |
| 메뉴 번호와 enum 값이 어긋남 | 메뉴는 1부터, enum은 0부터 | `(BetType)(sel - 1)` |
| `switch`에서 경고 | 처리 안 한 enum 항목 존재 | `default:` 추가 또는 모든 case 처리 |
| 함수에서 바꾼 상태가 안 남음 | 구조체 값 복사 | `GameState*` 로 넘기기 (Day 18) |
| 배당 계산에 소수점 오차 | `float` 사용 | 정수 × 10 방식 (`payoutX10`) |
| 단계가 안 넘어감 | `phase` 갱신 누락 | 각 `case` 끝에 다음 단계 대입 확인 |
| 무한 루프 | `PHASE_GAMEOVER`에서 `running = 0` 누락 | 확인 |
| 베팅액이 소지금 초과 | `ReadInt` 상한 미설정 | `ReadInt(..., MIN_BET, g->money)` |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| `enum` | 이름 붙은 정수 집합. 0부터 자동 번호 |
| `enum` vs `#define` | 자료형이 있고, 그룹이고, 디버거에 이름으로 보인다 |
| `XXX_COUNT` 트릭 | 마지막 항목이 자동으로 개수가 된다 |
| **상태 머신** | 단계를 `enum`으로, 전이를 `switch`로. **Day 46 FSM의 원형** |
| 게임 상태 구조체 | 유지되는 값과 초기화되는 값을 구분 |
| 데이터 테이블 | 배당·이름·확률을 배열로. 추가는 줄 하나 |
| 고정소수점 | 돈 계산은 정수 ×10. 실수 오차 회피 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 베팅 종류 추가 (주사위 2개 합 맞추기) | `BetType`에 항목 + 테이블에 줄 추가 |
| ★★ | `PHASE_BONUS` 단계 추가 — 3연승 시 보너스 라운드 | enum 항목 + `switch` case + 전이 조건 |
| ★★★ | 연승 배수 — 연속 승리 시 배당이 오르게 | `GameState`에 `streak` 추가, 정산에서 반영 |

### 다음 시간

> `InitGame(&game)`, `DoSettle(&game)`, `g->money` —
> 오늘 계속 나온 `&`와 `->`를 **그냥 따라 쓰기만** 했다.
>
> 왜 `&`를 붙여야 하는가? `*`는 무엇인가? 왜 `.`이 아니라 `->`인가?
>
> Day 4에서 미뤄뒀던 "**함수 안에서 바꾼 값이 밖에 안 남는다**"는 문제의 진짜 답이 내일 나온다.
>
> → **Day 18, 포인터** — Part 1에서 가장 중요한 하루
