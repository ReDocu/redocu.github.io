# Day 065 · 전투·AI / 문서 11 완성

> **Week 13** · 연결 문서 `11 택틱스 게임` — Step 5~6 (완성)
> 선수: Day 064 (경로 추적, 이동)

---

## 1. 오늘 만드는 것

**턴제 SRPG 완성.** 아군을 움직여 공격하고, 턴을 넘기면 적이 스스로 판단해 움직인다.

```
   ┌──────────────────────────────────────────────────────────┐
   │  TURN 3 - PLAYER                          아군 2 / 적 3   │
   ├──────────────────────────────────────────────────────────┤
   │   . . . # # . . . . .                                     │
   │   . ▓ ▓ # # . . . . .        ▓ = 공격 범위 (빨강)         │
   │   ▒ ▒ ⓟ ▓ ▓ . ⓔ . . .                                     │
   │   ▒ ▒ ▒ ▒ ▓ . . . . .        ⓟ = 아군  ⓔ = 적            │
   │   . ▒ ▒ . . . ⓔ . . .                                     │
   │                                                          │
   │  ┌─ 전투 예측 ────────────────────┐                       │
   │  │ 아군 검사  →  적 궁수          │                       │
   │  │ 데미지  14   명중 92%           │                       │
   │  │ 적 HP   28 → 14                 │                       │
   │  │ 반격    없음 (사거리 밖)         │                       │
   │  │           [Enter] 공격          │                       │
   │  └─────────────────────────────────┘                      │
   │                                                          │
   │  [클릭] 선택  [Enter] 확정  [우클릭] 취소  [E] 턴 종료     │
   └──────────────────────────────────────────────────────────┘
```

**조작** — 유닛 선택 → 이동 → 공격 대상 선택 → 확정. `E`로 턴 종료.

<!-- SHOT: Day 65 완성 화면 -->

---

## 2. 막히는 상황

Day 64까지 유닛이 걸어간다. 그런데 게임이 아니다.

```
   ① 공격할 수 없다
   ② 적이 움직이지 않는다
   ③ 턴 개념이 없다
   ④ 승패가 없다
   ⑤ 유닛이 전부 똑같다
```

```
   지금:   이동만 가능한 산책 시뮬레이터

   필요:   ① 공격 범위와 전투
           ② 턴 진행
           ③ 적 AI
           ④ 승패 판정
           ⑤ 유닛 타입과 상성
```

---

## 3. 개념

### 3-1. 공격 범위

**왜 필요한가** — 이동 범위와 별개로 계산해야 한다.

```
   두 가지 표시

   이동 범위 (파랑)   이번 턴에 갈 수 있는 곳
   공격 범위 (빨강)   이동 후 공격할 수 있는 곳
```

```
   근접(사거리 1) 유닛, 이동력 2

   . . ▓ . .           ▒ = 이동 가능
   . ▓ ▒ ▓ .           ▓ = 공격만 가능
   ▓ ▒ ⓟ ▒ ▓
   . ▓ ▒ ▓ .
   . . ▓ . .

   ★ 공격 범위 = (이동 가능한 모든 칸에서 사거리 안) - 이동 범위
```

```cpp
void PathFinder::CalcAttackRange(const TileMap& map,
                                 int minRange, int maxRange)
{
    // 이동 범위는 이미 계산되어 있다고 가정

    for (int r = 0; r < m_rows; r++)
        for (int c = 0; c < m_cols; c++)
            m_attackable[r * m_cols + c] = false;

    // 이동 가능한 모든 칸에서
    for (int r = 0; r < m_rows; r++)
    {
        for (int c = 0; c < m_cols; c++)
        {
            if (!CanStopAt(c, r)) continue;

            // 그 칸에서 사거리 안의 모든 칸
            for (int dr = -maxRange; dr <= maxRange; dr++)
            {
                for (int dc = -maxRange; dc <= maxRange; dc++)
                {
                    int dist = abs(dc) + abs(dr);       // 맨해튼

                    if (dist < minRange || dist > maxRange) continue;

                    int nc = c + dc, nr = r + dr;
                    if (nc < 0 || nc >= m_cols || nr < 0 || nr >= m_rows) continue;

                    m_attackable[nr * m_cols + nc] = true;
                }
            }
        }
    }
}
```

```
   ★ 사거리 유형

   근접   min=1, max=1     검사, 전사
   중거리 min=1, max=2     창병
   원거리 min=2, max=3     궁수 (인접은 못 쏜다)
   마법   min=1, max=3     자유롭다
```

```
   ★ minRange 가 있는 이유

   궁수는 인접한 적을 쏠 수 없다  →  근접 유닛의 존재 이유
   → 병종 상성이 생긴다
```

### 3-2. 전투 계산

**왜 필요한가** — 데미지 공식이 게임의 밸런스를 만든다.

```cpp
struct BattleResult
{
    int  damage;
    int  hitRate;                              // 0~100
    bool willKill;

    bool hasCounter;                           // 반격 여부
    int  counterDamage;
    int  counterHitRate;
    bool counterWillKill;
};

BattleResult CalcBattle(const Unit* attacker, const Unit* defender,
                        const TileMap& map)
{
    BattleResult res = {};

    // ── 데미지 ──
    int atk = attacker->GetAttack();
    int def = defender->GetDefense();

    // 지형 방어 보정
    const Tile* t = map.At(1, defender->GetCol(), defender->GetRow());
    int terrainDef = GetTerrainDefense(t);     // 숲 +2, 산 +4

    // 병종 상성
    double typeMul = GetTypeMultiplier(attacker->GetType(), defender->GetType());

    res.damage = (int)((atk - def - terrainDef) * typeMul);
    if (res.damage < 1) res.damage = 1;        // 최소 1

    res.willKill = (res.damage >= defender->GetHp());

    // ── 명중률 ──
    int acc = attacker->GetAccuracy();
    int eva = defender->GetEvasion();
    int terrainEva = GetTerrainEvasion(t);     // 숲 +15%

    res.hitRate = acc - eva - terrainEva;
    if (res.hitRate > 100) res.hitRate = 100;
    if (res.hitRate < 5)   res.hitRate = 5;    // 최소 5%

    // ── 반격 ──
    if (!res.willKill)
    {
        int dist = abs(attacker->GetCol() - defender->GetCol())
                 + abs(attacker->GetRow() - defender->GetRow());

        if (dist >= defender->GetMinRange() && dist <= defender->GetMaxRange())
        {
            res.hasCounter = true;

            const Tile* at = map.At(1, attacker->GetCol(), attacker->GetRow());

            res.counterDamage = defender->GetAttack()
                              - attacker->GetDefense()
                              - GetTerrainDefense(at);
            if (res.counterDamage < 1) res.counterDamage = 1;

            res.counterHitRate = defender->GetAccuracy() - attacker->GetEvasion();
            res.counterWillKill = (res.counterDamage >= attacker->GetHp());
        }
    }

    return res;
}
```

```
   ★ 반격 규칙

   ① 공격을 받고 살아남아야 한다
   ② 사거리 안이어야 한다

   → 궁수가 원거리에서 근접 유닛을 때리면 반격을 안 받는다
   → 근접 유닛은 궁수에게 접근해야 한다
```

### 3-3. 전투 예측 UI

**왜 필요한가** — SRPG의 필수 요소. 결과를 보고 결정한다.

```
   ┌─ 전투 예측 ────────────────────┐
   │ 아군 검사  →  적 궁수          │
   │ 데미지  14   명중 92%           │
   │ 적 HP   28 → 14                 │
   │ 반격    없음 (사거리 밖)         │
   │           [Enter] 공격          │
   └─────────────────────────────────┘
```

```cpp
void RenderBattlePreview(Renderer& r, const Unit* atk, const Unit* def,
                         const BattleResult& res, int x, int y)
{
    const int W = 280, H = 140;

    r.DrawRect(x, y, W, H, RGB(25, 25, 40));
    r.DrawRect(x, y, W, H, RGB(150, 150, 200), false);

    int ty = y + 10;
    const int LH = 20;

    r.DrawTextF(x + 10, ty, RGB(255,220,120),
                "%s → %s", atk->GetName(), def->GetName()); ty += LH + 4;

    COLORREF dmgColor = res.willKill ? RGB(255, 100, 100) : RGB(255,255,255);

    r.DrawTextF(x + 10, ty, dmgColor,
                "데미지 %d   명중 %d%%", res.damage, res.hitRate); ty += LH;

    int afterHp = def->GetHp() - res.damage;
    if (afterHp < 0) afterHp = 0;

    r.DrawTextF(x + 10, ty, RGB(255,255,255),
                "적 HP  %d → %d %s",
                def->GetHp(), afterHp,
                res.willKill ? "(격파!)" : ""); ty += LH;

    if (res.hasCounter)
    {
        COLORREF cColor = res.counterWillKill ? RGB(255, 80, 80) : RGB(255, 200, 120);

        r.DrawTextF(x + 10, ty, cColor,
                    "반격   %d 데미지  %d%% %s",
                    res.counterDamage, res.counterHitRate,
                    res.counterWillKill ? "(위험!)" : "");
    }
    else
    {
        r.DrawTextF(x + 10, ty, RGB(150,200,150), "반격   없음");
    }
    ty += LH + 4;

    r.DrawTextF(x + 60, ty, RGB(200,220,255), "[Enter] 공격");
}
```

```
   ★ 전투 예측이 없으면

   플레이어가 결과를 모르고 공격한다
   → 운에 맡기는 게임이 된다
   → SRPG 의 전략성이 사라진다
```

### 3-4. 병종 상성

**왜 필요한가** — "모든 유닛이 좋은" 상황을 막는다.

```cpp
enum UnitType { UT_SWORD, UT_SPEAR, UT_AXE, UT_ARCHER, UT_MAGE, UT_TYPE_COUNT };

// [공격자][방어자]
const double g_typeChart[UT_TYPE_COUNT][UT_TYPE_COUNT] = {
//         검    창    도끼  궁수  마법
/*검*/  { 1.0,  0.7,  1.3,  1.0,  1.0 },
/*창*/  { 1.3,  1.0,  0.7,  1.0,  1.0 },
/*도끼*/{ 0.7,  1.3,  1.0,  1.0,  1.0 },
/*궁수*/{ 1.0,  1.0,  1.0,  1.0,  1.3 },
/*마법*/{ 1.0,  1.0,  1.0,  0.7,  1.0 },
};
```

```
   검 → 도끼 → 창 → 검     (가위바위보)

   궁수 → 마법
   마법 → 궁수 (약함)
```

```
   ★ 상성 배율 1.3 / 0.7

   너무 크면 (2.0 / 0.5)  →  상성이 전부다. 다른 요소가 무의미
   너무 작으면 (1.1 / 0.9) →  체감이 안 된다

   1.3 / 0.7 이 적당하다
```

### 3-5. 턴 진행

**왜 필요한가** — 턴제 게임의 뼈대. Day 46의 FSM이 또 나온다.

```
   ┌───────────────┐
   │  TURN_START   │  턴 시작 연출
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ PLAYER_TURN   │  모든 아군이 행동할 때까지
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ ENEMY_TURN    │  적 AI 순차 실행
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │  TURN_END     │  상태 갱신, 승패 판정
   └───────┬───────┘
           │
           └──▶ TURN_START (다음 턴)
```

```cpp
class Unit
{
    bool m_hasMoved = false;
    bool m_hasActed = false;

public:
    void BeginTurn()  { m_hasMoved = false; m_hasActed = false; }
    void EndTurn()    { m_hasMoved = true;  m_hasActed = true;  }

    bool IsDone() const { return m_hasActed; }
};
```

```cpp
bool TacticsScene::AllUnitsDone(int team)
{
    for (int i = 0; i < m_unitCount; i++)
    {
        Unit* u = m_units[i];
        if (!u->IsAlive() || u->GetTeam() != team) continue;
        if (!u->IsDone()) return false;
    }
    return true;
}
```

```cpp
    // PLAYER_TURN 에서
    if (AllUnitsDone(TEAM_PLAYER))
        ChangeTurnState(TURN_ENEMY);
```

```
   ★ 턴 종료 조건

   ① 모든 유닛이 행동 완료
   ② 플레이어가 강제 종료 (E 키)

   → 행동 안 한 유닛도 대기 상태로 넘긴다
```

### 3-6. 적 AI — 판단 절차

**왜 필요한가** — 적이 스스로 움직여야 게임이 된다.

```
   ┌──────────────────────────────────────────────────────────┐
   │  ① 이동 범위 계산                                         │
   │  ② 공격 가능한 적(아군) 목록 만들기                       │
   │  ③ 목록이 있으면:                                         │
   │       - 가장 좋은 대상 선택                               │
   │       - 그 대상을 칠 수 있는 최적 위치 선택               │
   │       - 이동 후 공격                                      │
   │  ④ 목록이 없으면:                                         │
   │       - 가장 가까운 적을 향해 최대한 접근                 │
   └──────────────────────────────────────────────────────────┘
```

```cpp
struct AiAction
{
    bool  hasAction;
    int   moveCol, moveRow;                    // 이동 목표
    Unit* target;                              // 공격 대상 (nullptr = 이동만)
    int   score;
};

AiAction TacticsScene::DecideAiAction(Unit* ai)
{
    AiAction best = {};
    best.score = INT_MIN;

    // 이동 범위 계산
    m_pathFinder.CalcMoveRangeDijkstra(m_map, ai->GetCol(), ai->GetRow(),
                                       ai->GetMoveRange());

    // 이동 가능한 모든 칸에 대해
    for (int r = 0; r < m_map.GetRows(); r++)
    {
        for (int c = 0; c < m_map.GetCols(); c++)
        {
            if (!m_pathFinder.CanStopAt(c, r)) continue;

            // 그 위치에서 공격 가능한 대상들
            for (int i = 0; i < m_unitCount; i++)
            {
                Unit* target = m_units[i];
                if (!target->IsAlive()) continue;
                if (target->GetTeam() == ai->GetTeam()) continue;

                int dist = abs(c - target->GetCol()) + abs(r - target->GetRow());

                if (dist < ai->GetMinRange() || dist > ai->GetMaxRange()) continue;

                // 점수 계산
                int score = EvaluateAttack(ai, target, c, r);

                if (score > best.score)
                {
                    best.hasAction = true;
                    best.moveCol = c;
                    best.moveRow = r;
                    best.target  = target;
                    best.score   = score;
                }
            }
        }
    }

    // 공격할 수 없으면 접근
    if (!best.hasAction)
    {
        Unit* nearest = FindNearestEnemy(ai);

        if (nearest)
        {
            FindApproachPosition(ai, nearest, &best.moveCol, &best.moveRow);
            best.hasAction = true;
            best.target = nullptr;
        }
    }

    return best;
}
```

**평가 함수**

```cpp
int TacticsScene::EvaluateAttack(Unit* ai, Unit* target, int fromCol, int fromRow)
{
    // 가상으로 이동한 상태로 전투 계산
    int oldC = ai->GetCol(), oldR = ai->GetRow();
    ai->SetTileSilent(fromCol, fromRow);

    BattleResult res = CalcBattle(ai, target, m_map);

    ai->SetTileSilent(oldC, oldR);

    int score = 0;

    // 데미지가 클수록 좋다
    score += res.damage * 10;

    // 격파하면 큰 보너스
    if (res.willKill) score += 500;

    // 명중률
    score = score * res.hitRate / 100;

    // 반격을 받으면 감점
    if (res.hasCounter)
    {
        score -= res.counterDamage * 8;
        if (res.counterWillKill) score -= 1000;     // 자살은 피한다
    }

    // 체력이 적은 대상 우선
    score += (100 - target->GetHp() * 100 / target->GetMaxHp()) * 2;

    // 지형 보정 (숲에 서면 유리)
    const Tile* t = m_map.At(1, fromCol, fromRow);
    score += GetTerrainDefense(t) * 5;

    return score;
}
```

```
   ★ 점수 기반 AI 의 장점

   규칙을 if 로 나열하지 않는다
   → 새 판단 기준을 "점수 항목"으로 추가하면 된다

   ★ 가중치가 AI 의 성격을 만든다

   공격적:  데미지 가중치 ↑, 반격 감점 ↓
   신중함:  반격 감점 ↑, 자살 회피 ↑
   암살자:  격파 보너스 ↑↑, 체력 낮은 대상 우선 ↑↑
```

### 3-7. AI 성격

**왜 필요한가** — 적이 전부 똑같이 움직이면 지루하다.

```cpp
enum AiType { AI_AGGRESSIVE, AI_DEFENSIVE, AI_GUARD, AI_HEALER };

struct AiWeights
{
    int damageWeight;
    int killBonus;
    int counterPenalty;
    int suicidePenalty;
    int approachRange;                         // 이 거리 안에서만 접근
};

const AiWeights g_aiWeights[] = {
//                dmg  kill  counter  suicide  approach
/*AGGRESSIVE*/  {  12,  600,       4,     500,   99 },
/*DEFENSIVE*/   {   8,  400,      15,    2000,   99 },
/*GUARD*/       {  10,  500,       8,    1000,    3 },   // ★ 3칸 밖으론 안 나간다
/*HEALER*/      {   4,  200,      20,    3000,   99 },
};
```

```
   ★ GUARD 타입

   지정된 위치에서 approachRange 이내에만 반응한다
   → 보스방을 지키는 경비병
   → 플레이어가 안 건드리면 안 움직인다

   ★ 이것 하나로 스테이지 설계의 폭이 크게 넓어진다
```

### 3-8. AI 실행 순서

**왜 필요한가** — 적이 동시에 움직이면 무슨 일이 일어나는지 알 수 없다.

```cpp
void TacticsScene::UpdateEnemyTurn(double dt)
{
    switch (m_aiPhase)
    {
    case AI_SELECT_UNIT:
        m_currentAi = FindNextAiUnit();

        if (!m_currentAi)
        {
            ChangeTurnState(TURN_END);
            return;
        }

        // 카메라를 그 유닛으로
        m_camera.MoveTo(m_currentAi->GetWorldX(), m_currentAi->GetWorldY());

        m_aiPhase = AI_THINKING;
        m_aiTimer = 0.4;                       // ★ 생각하는 시간
        break;

    case AI_THINKING:
        m_aiTimer -= dt;
        if (m_aiTimer <= 0)
        {
            m_aiAction = DecideAiAction(m_currentAi);
            m_aiPhase = AI_MOVING;

            // 경로 계산 후 이동 시작
            PathPoint path[MAX_PATH_LEN];
            int len;
            m_pathFinder.BuildPath(m_aiAction.moveCol, m_aiAction.moveRow,
                                   path, MAX_PATH_LEN, &len);
            m_currentAi->StartMove(path, len);
        }
        break;

    case AI_MOVING:
        if (!m_currentAi->IsMoving())
        {
            m_aiPhase = m_aiAction.target ? AI_ATTACKING : AI_DONE;
            m_aiTimer = 0.3;
        }
        break;

    case AI_ATTACKING:
        m_aiTimer -= dt;
        if (m_aiTimer <= 0)
        {
            ExecuteBattle(m_currentAi, m_aiAction.target);
            m_aiPhase = AI_DONE;
            m_aiTimer = 0.6;
        }
        break;

    case AI_DONE:
        m_aiTimer -= dt;
        if (m_aiTimer <= 0)
        {
            m_currentAi->EndTurn();
            m_aiPhase = AI_SELECT_UNIT;
        }
        break;
    }
}
```

```
   ★ 각 단계 사이에 대기 시간을 둔다

   대기 없이 즉시 실행하면
   → 적 5기가 한 프레임에 전부 움직인다
   → 무슨 일이 일어났는지 알 수 없다

   0.3~0.6초의 여유가 필요하다
```

```
   ★ 카메라를 행동하는 유닛으로 옮긴다

   화면 밖에서 일어난 일은 없는 일이나 마찬가지다
```

### 3-9. 승패 판정

**왜 필요한가** — 끝이 있어야 게임이다.

```cpp
enum VictoryCondition
{
    VC_DEFEAT_ALL,         // 전멸
    VC_DEFEAT_BOSS,        // 보스 격파
    VC_REACH_POINT,        // 지점 도달
    VC_SURVIVE_TURNS,      // N턴 생존
    VC_PROTECT_UNIT,       // 특정 유닛 보호
};

int TacticsScene::CheckVictory()
{
    int playerAlive = CountAlive(TEAM_PLAYER);
    int enemyAlive  = CountAlive(TEAM_ENEMY);

    if (playerAlive == 0) return RESULT_DEFEAT;

    switch (m_victoryCondition)
    {
    case VC_DEFEAT_ALL:
        if (enemyAlive == 0) return RESULT_VICTORY;
        break;

    case VC_DEFEAT_BOSS:
        if (m_bossUnit && !m_bossUnit->IsAlive()) return RESULT_VICTORY;
        break;

    case VC_SURVIVE_TURNS:
        if (m_turnCount > m_targetTurns) return RESULT_VICTORY;
        break;

    case VC_REACH_POINT:
        for (int i = 0; i < m_unitCount; i++)
        {
            Unit* u = m_units[i];
            if (u->GetTeam() != TEAM_PLAYER || !u->IsAlive()) continue;

            if (u->GetCol() == m_goalCol && u->GetRow() == m_goalRow)
                return RESULT_VICTORY;
        }
        break;

    case VC_PROTECT_UNIT:
        if (m_protectUnit && !m_protectUnit->IsAlive()) return RESULT_DEFEAT;
        if (enemyAlive == 0) return RESULT_VICTORY;
        break;
    }

    return RESULT_NONE;
}
```

```
   ★ 승리 조건이 다양하면 스테이지가 다양해진다

   전멸        기본
   보스 격파    잡몹은 무시하고 돌파
   지점 도달    도망치는 시나리오
   N턴 생존     방어전
   유닛 보호    호위 임무
```

---

## 4. 따라 만들기

### Step 1 — 유닛 스탯

```cpp
struct UnitStats
{
    const char* name;
    UnitType    type;

    int maxHp;
    int attack, defense;
    int accuracy, evasion;
    int moveRange;
    int minRange, maxRange;
};

const UnitStats g_unitStats[] = {
//    이름      타입        HP  atk def  acc eva mv min max
    { "검사",   UT_SWORD,   32,  12,  6,  95, 10,  4,  1,  1 },
    { "창병",   UT_SPEAR,   34,  11,  8,  90,  8,  4,  1,  1 },
    { "도끼병", UT_AXE,     38,  14,  5,  80,  5,  4,  1,  1 },
    { "궁수",   UT_ARCHER,  26,  10,  4,  92, 14,  4,  2,  3 },
    { "마법사", UT_MAGE,    24,  13,  3,  88, 12,  4,  1,  3 },
};
```

**✅ 여기까지 하면** — 유닛 종류가 준비된다.

### Step 2 — 공격 범위 계산

3-1절의 `CalcAttackRange`를 구현한다.

```cpp
    // Render
    for (모든 칸)
    {
        if (m_pathFinder.CanStopAt(c, r))
            r.DrawRect(..., RGB(60, 120, 220), false);     // 이동 범위
        else if (m_pathFinder.IsAttackable(c, r))
            r.DrawRect(..., RGB(220, 60, 60), false);      // 공격 범위
    }
```

**✅ 여기까지 실행하면** — 이동 범위(파랑)와 공격 범위(빨강)가 구분된다.

<!-- SHOT: Step 2 공격 범위 -->

> **궁수는 공격 범위가 넓고, 인접 칸은 비어 있는지 확인한다.**

### Step 3 — 전투 계산

3-2절의 `CalcBattle`을 구현한다.

```cpp
int GetTerrainDefense(const Tile* t)
{
    if (!t) return 0;
    if (t->attribute & ATTR_FOREST) return 2;
    if (t->attribute & ATTR_MOUNTAIN) return 4;
    return 0;
}

int GetTerrainEvasion(const Tile* t)
{
    if (!t) return 0;
    if (t->attribute & ATTR_FOREST) return 15;
    if (t->attribute & ATTR_MOUNTAIN) return 25;
    return 0;
}
```

**✅ 여기까지 하면** — 전투 결과를 계산할 수 있다.

### Step 4 — 전투 예측 UI

3-3절의 `RenderBattlePreview`를 구현한다.

```cpp
    // PHASE_ACTION 에서 적 위에 커서를 올리면
    Unit* target = FindUnitAt(m_hoverCol, m_hoverRow);

    if (target && target->GetTeam() != m_selectedUnit->GetTeam())
    {
        m_previewResult = CalcBattle(m_selectedUnit, target, m_map);
        m_showPreview = true;
    }
```

**✅ 여기까지 실행하면** — 적 위에 커서를 올리면 전투 예측이 뜬다.

### Step 5 — 전투 실행

```cpp
void TacticsScene::ExecuteBattle(Unit* attacker, Unit* defender)
{
    BattleResult res = CalcBattle(attacker, defender, m_map);

    // 명중 판정
    bool hit = (rand() % 100) < res.hitRate;

    if (hit)
    {
        defender->TakeDamage(res.damage);
        ShowDamageNumber(defender, res.damage);
        m_camera.Shake(4.0, 0.15);
    }
    else
    {
        ShowMissText(defender);
    }

    // 반격
    if (res.hasCounter && defender->IsAlive())
    {
        bool cHit = (rand() % 100) < res.counterHitRate;

        if (cHit)
        {
            attacker->TakeDamage(res.counterDamage);
            ShowDamageNumber(attacker, res.counterDamage);
        }
    }

    attacker->EndTurn();
}
```

**데미지 숫자 표시**

```cpp
class DamageText : public GameObject
{
public:
    void Setup(double x, double y, int damage, COLORREF color)
    {
        m_x = x; m_y = y;
        m_damage = damage;
        m_color = color;
        m_life = 1.0;
        m_vy = -50.0;
    }

    void Update(double dt) override
    {
        m_y += m_vy * dt;
        m_vy += 80.0 * dt;                     // 중력
        m_life -= dt;
        if (m_life <= 0) Destroy();
    }

    void Render(Renderer& r) const override
    {
        double sx, sy;
        WorldToScreen(m_x, m_y, &sx, &sy);
        r.DrawTextF((int)sx, (int)sy, m_color, "%d", m_damage);
    }
};
```

**✅ 여기까지 실행하면** — 공격이 실행되고 데미지 숫자가 튀어 오른다.

### Step 6 — 턴 시스템

3-5절의 코드를 구현한다.

```cpp
void TacticsScene::ChangeTurnState(TurnState s)
{
    m_turnState = s;
    m_turnTimer = 0.0;

    switch (s)
    {
    case TURN_START:
        m_turnCount++;
        for (int i = 0; i < m_unitCount; i++)
            m_units[i]->BeginTurn();
        break;

    case TURN_PLAYER:
        m_selectedUnit = nullptr;
        m_phase = PHASE_SELECT;
        break;

    case TURN_ENEMY:
        m_aiPhase = AI_SELECT_UNIT;
        break;

    case TURN_END:
        {
            int result = CheckVictory();
            if (result != RESULT_NONE)
            {
                m_gameResult = result;
                ChangeTurnState(TURN_GAMEOVER);
                return;
            }
            ChangeTurnState(TURN_START);
        }
        break;
    }
}
```

**✅ 여기까지 실행하면** — 턴이 진행된다.

### Step 7 — 행동 완료 표시

```cpp
    // 행동한 유닛은 회색으로
    void Unit::Render(Renderer& r) const
    {
        COLORREF c = m_hasActed ? RGB(100, 100, 110)
                   : (m_team == TEAM_PLAYER ? RGB(80, 160, 255)
                                            : RGB(255, 100, 100));

        r.DrawCircle((int)sx, (int)sy, 14, c);
    }
```

**✅ 여기까지 실행하면** — 행동한 유닛이 회색이 된다.

### Step 8 — 적 AI 판단

3-6절의 `DecideAiAction`과 `EvaluateAttack`을 구현한다.

**✅ 여기까지 하면** — AI가 판단을 내린다. (아직 실행 안 됨)

**판단 로그**

```cpp
    DebugLog("[AI] %s: 이동 (%d,%d), 대상 %s, 점수 %d\n",
             ai->GetName(), best.moveCol, best.moveRow,
             best.target ? best.target->GetName() : "(없음)",
             best.score);
```

### Step 9 — 접근 위치 찾기

```cpp
void TacticsScene::FindApproachPosition(Unit* ai, Unit* target,
                                        int* outCol, int* outRow)
{
    // 목표까지의 경로를 A* 로 찾는다
    m_pathFinder.FindPathAStar(m_map, ai->GetCol(), ai->GetRow(),
                               target->GetCol(), target->GetRow(), 1.0);

    PathPoint path[MAX_PATH_LEN];
    int len;

    if (!m_pathFinder.BuildPath(target->GetCol(), target->GetRow(),
                                path, MAX_PATH_LEN, &len))
    {
        // 경로 없음 — 제자리
        *outCol = ai->GetCol();
        *outRow = ai->GetRow();
        return;
    }

    // 이동 범위 계산
    m_pathFinder.CalcMoveRangeDijkstra(m_map, ai->GetCol(), ai->GetRow(),
                                       ai->GetMoveRange());

    // 경로를 따라가며 갈 수 있는 가장 먼 지점
    *outCol = ai->GetCol();
    *outRow = ai->GetRow();

    for (int i = len - 1; i >= 0; i--)
    {
        if (m_pathFinder.CanStopAt(path[i].col, path[i].row))
        {
            *outCol = path[i].col;
            *outRow = path[i].row;
            break;
        }
    }
}
```

```
   ★ 두 번의 길찾기

   ① A* 로 목표까지의 전체 경로 (이동력 무시)
   ② 다익스트라로 이번 턴의 이동 범위

   → 경로 중 이번 턴에 갈 수 있는 가장 먼 지점
```

**✅ 여기까지 실행하면** — AI가 공격할 수 없으면 접근한다.

### Step 10 — AI 실행

3-8절의 `UpdateEnemyTurn`을 구현한다.

**✅ 여기까지 실행하면** — **적이 스스로 움직이고 공격한다!**

<!-- SHOT: Step 10 적 AI -->

> **한 유닛씩 순서대로 움직이는지, 카메라가 따라가는지 확인한다.**

### Step 11 — AI 성격

3-7절의 `AiWeights`를 구현한다.

```cpp
int TacticsScene::EvaluateAttack(Unit* ai, Unit* target, int c, int r)
{
    const AiWeights& w = g_aiWeights[ai->GetAiType()];

    // ...
    score += res.damage * w.damageWeight;
    if (res.willKill) score += w.killBonus;
    if (res.hasCounter)
    {
        score -= res.counterDamage * w.counterPenalty;
        if (res.counterWillKill) score -= w.suicidePenalty;
    }
    // ...
}
```

**✅ 여기까지 실행하면** — 적마다 다르게 행동한다.

```
   공격적:  반격을 감수하고 돌진
   신중함:  반격 안 받는 위치를 찾는다
   경비:    범위 밖으로 안 나온다
```

### Step 12 — 병종 상성

3-4절의 `g_typeChart`를 구현한다.

```cpp
    // 전투 예측에 표시
    double mul = GetTypeMultiplier(atk->GetType(), def->GetType());

    if (mul > 1.05)
        r.DrawTextF(x + 200, ty, RGB(120, 255, 120), "유리");
    else if (mul < 0.95)
        r.DrawTextF(x + 200, ty, RGB(255, 120, 120), "불리");
```

**✅ 여기까지 실행하면** — 상성이 데미지에 반영되고 UI에 표시된다.

### Step 13 — 승패 판정

3-9절의 `CheckVictory`를 구현한다.

```cpp
void TacticsScene::RenderResult(Renderer& r)
{
    if (m_turnState != TURN_GAMEOVER) return;

    int cx = r.GetWidth() / 2, cy = r.GetHeight() / 2;

    r.DrawRect(cx - 200, cy - 80, 400, 160, RGB(20, 20, 35));
    r.DrawRect(cx - 200, cy - 80, 400, 160, RGB(200, 200, 220), false);

    if (m_gameResult == RESULT_VICTORY)
    {
        r.DrawTextCentered(cx, cy - 40, RGB(255, 240, 120), 40, "V I C T O R Y");
        r.DrawTextCentered(cx, cy + 10, RGB(255,255,255), 20,
                           "%d턴 만에 승리", m_turnCount);
    }
    else
    {
        r.DrawTextCentered(cx, cy - 40, RGB(255, 100, 100), 40, "D E F E A T");
    }

    r.DrawTextCentered(cx, cy + 50, RGB(200,200,220), 18, "[Enter] 계속");
}
```

**✅ 여기까지 실행하면** — 승패가 판정되고 결과가 표시된다.

### Step 14 — 유닛 정보 UI

```cpp
void RenderUnitInfo(Renderer& r, const Unit* u, int x, int y)
{
    const int W = 220, H = 150;

    r.DrawRect(x, y, W, H, RGB(25, 25, 40));
    r.DrawRect(x, y, W, H, RGB(150,150,200), false);

    int ty = y + 10;
    const int LH = 19;

    r.DrawTextF(x + 10, ty, RGB(255,220,120), "%s", u->GetName()); ty += LH + 4;

    // HP 바
    double ratio = (double)u->GetHp() / u->GetMaxHp();
    r.DrawRect(x + 10, ty, 200, 12, RGB(50, 50, 60));
    r.DrawRect(x + 10, ty, (int)(200 * ratio), 12,
               ratio > 0.5 ? RGB(80, 220, 100) :
               ratio > 0.2 ? RGB(230, 200, 60) : RGB(230, 70, 70));
    ty += 18;

    r.DrawTextF(x + 10, ty, RGB(255,255,255),
                "HP  %d / %d", u->GetHp(), u->GetMaxHp()); ty += LH;

    r.DrawTextF(x + 10, ty, RGB(255,255,255),
                "공격 %d   방어 %d", u->GetAttack(), u->GetDefense()); ty += LH;

    r.DrawTextF(x + 10, ty, RGB(255,255,255),
                "이동 %d   사거리 %d~%d",
                u->GetMoveRange(), u->GetMinRange(), u->GetMaxRange()); ty += LH;

    // 현재 지형
    const Tile* t = m_map.At(1, u->GetCol(), u->GetRow());
    r.DrawTextF(x + 10, ty, RGB(180,220,180),
                "지형 방어 +%d  회피 +%d%%",
                GetTerrainDefense(t), GetTerrainEvasion(t));
}
```

**✅ 여기까지 실행하면** — 1절의 완성 화면이 나온다.

### Step 15 — 밸런스 조정

**10판을 해서 측정한다.**

| 항목 | 목표 | 실측 |
|---|---|---|
| 승리 턴 수 | 8~15턴 | |
| 아군 손실 | 0~1기 | |
| 평균 전투 횟수 | 15~25회 | |
| 상성 체감 | 있음 | |
| AI 위협도 | 방심하면 진다 | |

```
   조정
   너무 쉽다  →  적 수↑, 적 스탯↑, 지형 유리하게
   너무 어렵다 →  아군 스탯↑, 지형 보정↑, 적 AI 가중치 완화
```

### Step 16 — 문서 11 완성

```
   KY/src/11_tactics/
     ├─ Engine/
     ├─ Common/          (맵 관련)
     ├─ Game/
     │   ├─ PathFinder.h/.cpp       ← BFS/다익스트라/A*
     │   ├─ Unit.h/.cpp
     │   ├─ Battle.h/.cpp
     │   ├─ AiController.h/.cpp
     │   └─ TacticsScene.h/.cpp
     ├─ assets/maps/
     ├─ docs/
     │   ├─ pathfinding.md          ← 알고리즘 비교
     │   └─ balance.md
     └─ README.md
```

**✅ 여기까지 하면** — **`11 택틱스 게임` 문서가 완성된다.**

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────────────────────────────────┐
   │  TURN 3 - PLAYER                          아군 2 / 적 3   │
   ├──────────────────────────────────────────────────────────┤
   │   . . . # # . . . . .                                     │
   │   . ▓ ▓ # # . . . . .                                     │
   │   ▒ ▒ ⓟ ▓ ▓ . ⓔ . . .                                     │
   │   ▒ ▒ ▒ ▒ ▓ . . . . .                                     │
   │   . ▒ ▒ . . . ⓔ . . .                                     │
   │                                                          │
   │  ┌─ 전투 예측 ────────────────┐  ┌─ 검사 ──────────┐     │
   │  │ 검사 → 궁수         유리   │  │ ████████░░ 24/32│     │
   │  │ 데미지 14   명중 92%       │  │ 공격 12  방어 6 │     │
   │  │ 적 HP  28 → 14             │  │ 이동 4  사거리 1│     │
   │  │ 반격   없음                │  │ 지형 +2  +15%   │     │
   │  │        [Enter] 공격        │  └─────────────────┘     │
   │  └────────────────────────────┘                          │
   └──────────────────────────────────────────────────────────┘
```

- [ ] 이동 범위(파랑)와 공격 범위(빨강)가 구분된다
- [ ] 궁수는 인접 칸을 공격할 수 없다
- [ ] 적 위에 커서를 올리면 전투 예측이 뜬다
- [ ] 데미지·명중률·반격이 정확히 계산된다
- [ ] 지형이 방어와 회피에 반영된다
- [ ] 병종 상성이 데미지에 반영되고 표시된다
- [ ] 공격하면 데미지 숫자가 튀어 오른다
- [ ] 행동한 유닛이 회색이 된다
- [ ] 턴을 넘기면 **적이 스스로 움직이고 공격한다**
- [ ] 적이 한 유닛씩 순서대로 행동한다
- [ ] 카메라가 행동하는 유닛을 따라간다
- [ ] AI 성격에 따라 다르게 행동한다
- [ ] 승패가 판정되고 결과 화면이 나온다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 공격 범위가 이상함 | 이동 범위와 겹침 처리 | 이동 가능 칸은 제외 |
| 궁수가 인접 공격 | `minRange` 미적용 | 거리 하한 검사 |
| 반격이 항상 있음 | 사거리 검사 누락 | 거리 확인 |
| AI가 안 움직임 | `CanStopAt` 결과 없음 | 이동 범위 계산 확인 |
| AI가 자살 | 반격 감점 부족 | `suicidePenalty` 상향 |
| 적이 동시에 움직임 | 대기 시간 없음 | 단계별 타이머 |
| 무슨 일인지 모름 | 카메라 미이동 | 행동 유닛으로 이동 |
| 턴이 안 넘어감 | `EndTurn` 누락 | 행동 후 호출 |
| 승패가 안 남 | `CheckVictory` 미호출 | `TURN_END`에서 |
| AI가 너무 느림 | 모든 칸 × 모든 적 평가 | 후보를 미리 걸러낸다 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| 공격 범위 | 이동 가능 칸에서 사거리 안. 이동 범위와 구분 |
| `minRange` | 궁수가 인접 공격 못 하게. 병종 상성의 근거 |
| 전투 계산 | 데미지·명중·반격. 지형과 상성 반영 |
| **전투 예측** | SRPG 필수. 없으면 운 게임이 된다 |
| 병종 상성 | 1.3 / 0.7 배율이 적당 |
| 턴 FSM | START → PLAYER → ENEMY → END |
| **점수 기반 AI** | 규칙 나열 대신 평가 함수 |
| AI 성격 | 가중치로 만든다 |
| AI 실행 | 순차 + 대기 시간 + 카메라 이동 |
| 승리 조건 | 다양할수록 스테이지가 다양해진다 |

### Week 13 회수

| Day | 배운 것 | 확인 |
|:--:|---|:--:|
| 61 | **BFS** — 이동 범위 | ☑ |
| 62 | **다익스트라** — 비용 반영 | ☑ |
| 63 | **A\*** — 휴리스틱 | ☑ |
| 64 | 경로 역추적, 보간 이동 | ☑ |
| 65 | 전투, 턴, AI | ☑ |

### 프레임워크에 추가된 것

```
   Game/
     ├─ PathFinder       BFS / 다익스트라 / A*
     ├─ PriorityQueue    이진 힙
     └─ AiController     점수 기반 판단
```

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 위협 범위 표시 (적 전체의 이동+공격 범위) | 적마다 계산 후 합집합 |
| ★★ | 회복 유닛 추가 (아군 HP 회복) | 대상이 아군인 행동 |
| ★★★ | AI 2수 앞 예측 (내 행동 후 적의 반응까지) | 미니맥스 축소판 |

### 다음 주 예고 — Week 14

> 지금까지는 **격자 이동**이었다.
>
> ```
>   . . . .
>   . ⓟ . .        칸 단위로 움직인다
>   . . . .
> ```
>
> 다음 주는 다르다.
>
> ```
>            ·  ·  ·
>         ·           ·
>      ·                 ·
>   ▲                       ▼      각도와 힘으로 포탄을 쏜다
> ```
>
> **삼각함수, 중력, 포물선, 지형 파괴, 알파 블렌딩**
>
> → **Day 66, 각도와 발사 벡터** / Week 14는 **포트리스**다.

---

**다음 문서** → `Day066_각도와_발사벡터.md`
