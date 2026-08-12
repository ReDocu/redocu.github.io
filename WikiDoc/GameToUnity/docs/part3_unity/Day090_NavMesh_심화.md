# Day 090 · NavMesh 심화 · 문서 16 완성

> **Week 18** · 연결 문서 `16 디펜스 게임` — Step 5~6 (완성)
> 선수: Day 089 (밸런스와 성능), **Day 084 (NavMesh), Day 062 (다익스트라)**

---

## 1. 오늘 만드는 것

**길을 막으면 적이 즉시 우회 경로를 찾는다.** 완전히 막으면 배치가 거부된다.

```
   ┌────────────────────────────────────────────────────────┐
   │  WAVE 7 / 10    라이프 16/20    골드 680               │
   │                                                        │
   │   ▣ 시작                                               │
   │    ╲                                                   │
   │     ◆──╮                                               │
   │        │  ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓     ← 타워가 만든 벽         │
   │        ╰──────────────────╮                            │
   │                            │  ▓ ▓ ▓ ▓ ▓ ▓             │
   │        ╭───────────────────╯                           │
   │        │                                               │
   │        ╰──────────────────────────▶ ▤ 목표             │
   │                                                        │
   │   ░░░ 늪 (이동 비용 3배) ░░░                            │
   │                                                        │
   │  ⚠ 경로를 완전히 막을 수 없습니다                        │
   └────────────────────────────────────────────────────────┘
```

<!-- SHOT: Day 90 완성 화면 -->

---

## 2. 막히는 상황

어제까지 타워는 경로 "옆"에 놓았다.

```
   ★ 타워 디펜스의 진짜 재미는

   길을 막아 미로를 만드는 것
   → 적이 먼 길로 돌아간다
   → 그 긴 경로 내내 두들겨 맞는다
```

**경로 위에 타워를 놓아 본다.**

```csharp
    // Day 87의 배치 검사
    if (Physics.CheckBox(..., pathLayer))
        return PlacementResult.OnPath;         // ✗ 아예 금지
```

```
   ★ 지금은 경로 위에 못 놓는다
```

**금지를 풀어 보면**

```
   ┌────────────────────┐
   │  ◆ ──▶ ▓ ← 타워    │
   │        (그냥 통과)  │
   └────────────────────┘
```

```
   ★ 적이 타워를 뚫고 지나간다

   → NavMesh는 여전히 예전 그대로
   → 타워는 NavMesh에 아무 영향이 없다
```

**Collider를 붙여 보면**

```
   ★ 적이 타워에 부딪혀 멈춘다
   ★ 하지만 경로는 여전히 직선
   → 밀고만 있다
```

> **NavMesh 자체를 바꿔야 한다.**

---

## 3. 개념

### 3-1. NavMeshObstacle Carve

**왜 필요한가** — 오늘의 핵심.

```
   Carve 없이 (물리 충돌만)        Carve 켜면

   ┌──────────┐                    ┌──────────┐
   │  ▓ 타워   │                    │  ▓▓▓▓▓  │  ← NavMesh에 구멍
   └──────────┘                    └──────────┘
   경로:  ●─────▶ (직선)           경로:  ●──╮
   적이 부딪혀 밀림                        ╰───▶ (우회)
```

| 필드 | 의미 |
|---|---|
| **Shape** | Box / Capsule |
| Center / Size | 크기 |
| **Carve** | NavMesh에 구멍을 팔지 |
| **Move Threshold** | 이만큼 움직이면 다시 판다 |
| **Time To Stationary** | 이 시간 멈춰야 정지로 판단 |
| **Carve Only Stationary** | 멈췄을 때만 판다 |

```
   ★ Carve의 동작

   ① 장애물이 놓인다
   ② NavMesh의 그 부분을 "구멍"으로 표시
   ③ 경로 탐색이 그 구멍을 피한다
   ④ 기존 에이전트의 경로가 무효화된다
```

```
   ⚠️ Carve는 비싸다

   NavMesh 타일을 다시 계산한다
   → 여러 개가 동시에 움직이면 프레임이 튄다
```

### 3-2. Carve 갱신 비용

**왜 필요한가** — 성능과 반응의 균형.

| 설정 | 효과 |
|---|---|
| **Carve Only Stationary ✔** | 멈췄을 때만. 기본값 ★ |
| Move Threshold | 값이 크면 덜 자주 갱신 |
| Time To Stationary | 값이 크면 늦게 반영 |

```
   ★ 타워 디펜스에서는

   타워가 안 움직인다
   → Carve Only Stationary ✔
   → 배치 직후 한 번만 갱신
   → 이후엔 비용 0
```

```
   ⚠️ 매 프레임 위치가 미세하게 바뀌면

   Move Threshold를 넘어 계속 재계산
   → 타워를 완전히 고정한다
   → Rigidbody가 있으면 isKinematic
```

```
   ★ 대안 — 정적 장애물은 Bake에 포함

   타워를 놓을 때마다 NavMeshSurface를 다시 Bake
   → 더 정확하지만 훨씬 비싸다
   → 실시간 게임에는 부적합
```

```csharp
    // 부분 재베이크 (AI Navigation 패키지)
    navMeshSurface.UpdateNavMesh(navMeshSurface.navMeshData);
```

```
   ⚠️ UpdateNavMesh는 전체를 다시 계산한다

   맵이 크면 수백 ms
   → Carve가 훨씬 낫다
```

### 3-3. 경로 재계산

**왜 필요한가** — Carve 후 기존 적이 경로를 갱신해야 한다.

```
   ★ Unity는 자동으로 재계산하지 않는다

   Carve로 경로가 막혀도
   → 기존 Agent는 이전 경로를 따라간다
   → 벽에 부딪힌다
```

```csharp
    // 타워 배치 시 전체 적에게 알린다
    public void NotifyPathChanged()
    {
        var enemies = EnemyManager.Instance.Active;

        for (int i = 0; i < enemies.Count; i++)
            enemies[i]?.RecalculatePath();
    }
```

```csharp
    // GroundMovement
    public void RecalculatePath()
    {
        if (!agent.enabled || !agent.isOnNavMesh) return;

        agent.SetDestination(goal.position);   // ★ 다시 계산
    }
```

```
   ⚠️ 적 200기가 동시에 재계산하면 프레임이 튄다

   ★ 해결 — 여러 프레임에 나눈다
```

```csharp
    private IEnumerator RecalculateStaggered()
    {
        var enemies = EnemyManager.Instance.Active;

        const int PER_FRAME = 10;

        for (int i = 0; i < enemies.Count; i++)
        {
            enemies[i]?.RecalculatePath();

            if ((i + 1) % PER_FRAME == 0) yield return null;
        }
    }
```

```
   ★ 또는 자동 감지

   Day 86의 GroundMovement.Tick에서
   pathStatus가 Invalid면 자동 재계산
```

### 3-4. 완전 차단 정책

**왜 필요한가** — 막아버리면 게임이 성립하지 않는다.

| 정책 | 구현 | 게임성 |
|---|---|---|
| **배치 금지** | 배치 전 경로 존재 확인 | 미로 만들기 재미 O, 규칙 명확 ★ |
| 타워 공격 | 경로 없으면 타워를 부순다 | 긴장감 O, 구현 복잡 |
| 통과 허용 | 막혀도 직선으로 통과 | 미로 의미 없음 ✗ |

```
   ★ 대부분의 게임은 "배치 금지"

   Bloons TD, Kingdom Rush → 경로 고정 (아예 못 놓음)
   Dungeon Warfare, Defense Grid → 미로 가능 + 완전 차단 금지
   They Are Billions → 타워를 부순다
```

### 3-5. 경로 존재 검사

**왜 필요한가** — 배치 금지 정책의 구현.

```csharp
using UnityEngine.AI;

    public bool HasValidPath(Vector3 from, Vector3 to)
    {
        NavMeshPath path = new NavMeshPath();

        bool found = NavMesh.CalculatePath(from, to, NavMesh.AllAreas, path);

        return found && path.status == NavMeshPathStatus.PathComplete;
    }
```

```
   ⚠️ CalculatePath는 "현재" NavMesh 기준

   타워를 놓기 전에 검사하면
   → 아직 Carve가 안 됐으므로 항상 경로가 있다
```

```
   ★ 해결 — 임시로 Carve한 뒤 검사

   ① 임시 Obstacle을 생성
   ② 한 프레임 대기 (Carve 반영)
   ③ 경로 검사
   ④ 실패하면 취소
```

```csharp
    private IEnumerator ValidateAndPlace(Vector2Int cell, TowerData data)
    {
        Vector3 pos = GridSystem.Instance.CellToWorld(cell);

        // ★ ① 임시 장애물
        GameObject temp = new GameObject("TempObstacle");
        temp.transform.position = pos;

        NavMeshObstacle obs = temp.AddComponent<NavMeshObstacle>();
        obs.shape = NavMeshObstacleShape.Box;
        obs.size = new Vector3(cellSize * 0.9f, 2f, cellSize * 0.9f);
        obs.carving = true;
        obs.carveOnlyStationary = false;       // ★ 즉시 판다

        // ★ ② Carve 반영 대기
        yield return null;
        yield return new WaitForFixedUpdate();

        // ★ ③ 경로 검사
        bool ok = HasValidPath(spawnPoint.position, goal.position);

        // ★ ④ 임시 제거
        Destroy(temp);

        if (!ok)
        {
            ShowMessage("경로를 완전히 막을 수 없습니다");
            yield break;
        }

        PlaceTower(cell, data);
    }
```

```
   ⚠️ 이 방식은 한 프레임 이상 걸린다

   클릭 반응이 살짝 느려진다
   → 대안: 자체 격자 기반 BFS로 미리 검사
```

### 3-6. 격자 기반 사전 검사 (더 빠름)

**왜 필요한가** — NavMesh를 건드리지 않고 즉시 판정.

```
   ★ Day 61의 BFS를 다시 쓴다

   격자 위에서
   ① 타워가 놓일 셀을 막힘으로 표시
   ② 시작 → 목표 BFS
   ③ 도달 못 하면 배치 금지
```

```csharp
using System.Collections.Generic;
using UnityEngine;

public class PathValidator : MonoBehaviour
{
    [SerializeField] private Vector2Int gridMin = new Vector2Int(-10, -10);
    [SerializeField] private Vector2Int gridMax = new Vector2Int(10, 10);

    private static readonly Vector2Int[] Dirs =
    {
        new Vector2Int( 1, 0), new Vector2Int(-1, 0),
        new Vector2Int( 0, 1), new Vector2Int( 0,-1),
    };

    private readonly Queue<Vector2Int> queue = new Queue<Vector2Int>();
    private readonly HashSet<Vector2Int> visited = new HashSet<Vector2Int>();

    // ★ Day 61의 BFS
    public bool CanReach(Vector2Int start, Vector2Int goal, Vector2Int extraBlocked)
    {
        queue.Clear();
        visited.Clear();

        if (start == extraBlocked || goal == extraBlocked) return false;

        queue.Enqueue(start);
        visited.Add(start);

        while (queue.Count > 0)
        {
            Vector2Int cur = queue.Dequeue();

            if (cur == goal) return true;

            for (int i = 0; i < Dirs.Length; i++)
            {
                Vector2Int next = cur + Dirs[i];

                if (visited.Contains(next)) continue;
                if (!IsInBounds(next)) continue;
                if (next == extraBlocked) continue;             // ★ 놓을 자리
                if (GridSystem.Instance.IsOccupied(next)) continue;
                if (IsWall(next)) continue;

                visited.Add(next);
                queue.Enqueue(next);
            }
        }

        return false;
    }

    private bool IsInBounds(Vector2Int c)
        => c.x >= gridMin.x && c.x <= gridMax.x
        && c.y >= gridMin.y && c.y <= gridMax.y;

    private bool IsWall(Vector2Int c)
    {
        Vector3 world = GridSystem.Instance.CellToWorld(c);

        return Physics.CheckBox(world + Vector3.up * 0.5f,
                                Vector3.one * 0.4f,
                                Quaternion.identity, wallLayer);
    }
}
```

```
   ★ 장점

   ① 즉시 판정 (프레임 대기 없음)
   ② 미리보기에서 실시간으로 표시 가능
   ③ NavMesh를 건드리지 않는다

   ★ 단점

   ① 격자와 NavMesh가 완전히 일치하지 않을 수 있다
   ② 대각선 이동을 고려하려면 8방향으로
```

```
   ★ 실무 조합

   미리보기: 격자 BFS (즉시)
   최종 배치: NavMesh 검증 (정확)
```

```
   ⚠️ HashSet / Queue를 매번 new 하면 GC

   → 필드로 재사용하고 Clear() (Day 89)
```

### 3-7. Area와 Cost — 다익스트라의 재현

**왜 필요한가** — Day 62에서 배운 가중치 그래프.

```
   Window → AI → Navigation → Areas 탭
```

| Area | Cost | 의미 |
|---|:--:|---|
| Walkable | 1 | 기본 |
| Not Walkable | — | 통행 불가 |
| Jump | 2 | 점프 구간 |
| **Swamp (사용자 정의)** | **3** | 늪 — 되도록 피한다 |
| **Road (사용자 정의)** | **0.5** | 길 — 선호 |

```
   ★ Day 62의 다익스트라

   Part 2:  간선마다 비용이 다르다
            dist[next] = dist[cur] + cost(cur, next)

   Unity:   Area마다 비용이 다르다
            NavMesh가 내부적으로 같은 계산을 한다
```

```
   ★ 경로 선택 예

   ┌──────────────────────────┐
   │  ●───── 늪 (10칸 × 3) ───▶│  비용 30
   │   ╲                      │
   │    ╲── 우회 (20칸 × 1) ──▶│  비용 20   ★ 이쪽 선택
   └──────────────────────────┘
```

**설정 방법**

```
   ① Areas 탭에서 Area 추가 (이름 + Cost)
   ② 늪 오브젝트에 NavMeshModifier 추가
      Override Area ✔ → Swamp
   ③ NavMeshSurface 다시 Bake
```

```csharp
    // 에이전트별 비용 조정
    agent.SetAreaCost(NavMesh.GetAreaFromName("Swamp"), 5f);
```

```
   ★ 적 종류별로 다르게

   일반 적:  늪 비용 3 (피한다)
   수생 적:  늪 비용 0.8 (선호한다)
```

```
   ⚠️ Area Cost는 "경로 선택"에만 영향

   실제 이동 속도는 안 바뀐다
   → 감속은 별도로 구현
```

```csharp
    // 늪 위에서 감속
    void OnTriggerStay(Collider other)
    {
        if (other.CompareTag("Swamp"))
            enemy.ApplySlow(0.5f, 0.2f, 0);    // 짧게 갱신
    }
```

### 3-8. Area Mask — 통행 가능 영역

**왜 필요한가** — 특정 적만 지나갈 수 있는 길.

```csharp
    // 이 에이전트가 갈 수 있는 영역
    agent.areaMask = NavMesh.AllAreas;

    // ★ 늪을 제외
    int swampBit = 1 << NavMesh.GetAreaFromName("Swamp");
    agent.areaMask = NavMesh.AllAreas & ~swampBit;
```

```
   ★ 비트 마스크 (Day 17의 enum·비트 플래그)

   Area 0 → 1 << 0 = 0001
   Area 3 → 1 << 3 = 1000

   AllAreas = 0xFFFFFFFF
   제외:  & ~bit
```

```
   ★ 게임 디자인 활용

   "물길은 수생 적만 통과"
   "다리는 소형 적만"
```

### 3-9. 여러 Agent Type

**왜 필요한가** — 크기가 다른 적.

```
   Agents 탭

   Small   Radius 0.25  Height 1.0
   Normal  Radius 0.45  Height 1.8
   Large   Radius 0.9   Height 2.6
```

```
   ★ Agent Type마다 별도의 NavMeshSurface가 필요하다

   NavMeshSurface_Small   (Agent Type: Small)
   NavMeshSurface_Normal
   NavMeshSurface_Large
```

```
   ★ 게임 디자인 활용

   좁은 통로 = 소형만 통과
   → "이 길은 대형을 막는다"
   → 전략이 생긴다
```

```
   ⚠️ Surface가 늘면 메모리와 베이크 시간이 는다

   3종 정도가 실용적
```

### 3-10. 부분 경로 처리

**왜 필요한가** — 경로가 완전히 막혔을 때.

```csharp
    public void Tick(float dt)
    {
        if (!agent.enabled) return;

        if (agent.pathPending) return;

        switch (agent.pathStatus)
        {
        case NavMeshPathStatus.PathComplete:
            // 정상
            break;

        case NavMeshPathStatus.PathPartial:
            // ★ 도중까지만 갈 수 있다
            HandleBlocked();
            break;

        case NavMeshPathStatus.PathInvalid:
            // ★ 경로 없음 — 재계산 시도
            agent.SetDestination(goal.position);
            break;
        }
    }

    private void HandleBlocked()
    {
        blockedTimer += Time.deltaTime;

        if (blockedTimer < 1f) return;         // 잠깐은 기다린다

        blockedTimer = 0;

        // ★ 정책에 따라
        switch (blockPolicy)
        {
        case BlockPolicy.Wait:
            agent.SetDestination(goal.position);    // 계속 재시도
            break;

        case BlockPolicy.AttackTower:
            AttackNearestTower();
            break;
        }
    }
```

```
   ★ 배치 금지 정책을 쓰면 이 상황이 거의 안 생긴다

   하지만 안전장치는 필요하다
   → 예외적인 경우(버그, 타이밍)에 대비
```

### 3-11. 타워 공격 정책 (선택)

**왜 필요한가** — 대안 설계.

```csharp
    private void AttackNearestTower()
    {
        Tower nearest = null;
        float bestSq = float.MaxValue;

        var towers = TowerManager.Instance.Towers;

        for (int i = 0; i < towers.Count; i++)
        {
            Tower t = towers[i];
            if (t == null) continue;

            float sq = (t.transform.position - transform.position).sqrMagnitude;
            if (sq < bestSq) { bestSq = sq; nearest = t; }
        }

        if (nearest == null) return;

        // 사거리 안이면 공격
        if (bestSq < attackRange * attackRange)
        {
            nearest.TakeDamage(attackDamage);
        }
        else
        {
            agent.SetDestination(nearest.transform.position);
        }
    }
```

```
   ★ 이 정책의 장점

   완전히 막아도 게임이 진행된다
   "막고 버티기" 전략이 생긴다

   ★ 단점

   타워에 HP를 부여해야 한다
   수리 시스템이 필요할 수도
   구현이 복잡하다
```

### 3-12. Off-Mesh Link

**왜 필요한가** — 끊긴 지점 연결.

```
   NavMeshLink 컴포넌트

   Start Point / End Point
   Width:          링크의 폭
   Cost Modifier:  이 링크의 비용
   Bidirectional:  양방향
   Area Type:      Jump 등
```

```
   ★ 타워 디펜스 활용

   "점프 유닛"이 벽을 넘는다
   → 미로가 통하지 않는 적
   → 다른 전략을 요구
```

```csharp
    // 특정 Area만 통과 가능하게
    int jumpBit = 1 << NavMesh.GetAreaFromName("Jump");

    // 점프 유닛
    agent.areaMask = NavMesh.AllAreas;

    // 일반 유닛
    agent.areaMask = NavMesh.AllAreas & ~jumpBit;
```

---

## 4. 따라 만들기

### Step 1 — 타워에 Obstacle 추가

```
   P_Tower_Basic → Add Component → Nav Mesh Obstacle

   Shape: Box
   Center: (0, 1, 0)
   Size: (1.8, 2, 1.8)          ★ 셀 크기보다 살짝 작게
   Carve: ✔                     ★
   Move Threshold: 0.1
   Time To Stationary: 0.1
   Carve Only Stationary: ✔
```

```
   ⚠️ Size가 셀 크기와 같으면

   인접 타워 사이에 틈이 없어져
   격자 계산과 어긋날 수 있다
   → 90% 정도로
```

**✅ 여기까지 실행하면**

```
   ★ 타워를 놓으면 NavMesh에 구멍이 생긴다
   ★ Scene 뷰에서 파란 면이 사라지는 것이 보인다
```

<!-- SHOT: Step 1 Carve -->

### Step 2 — 경로 위 배치 허용

```csharp
    // Day 87의 검사에서 OnPath 제거
    private PlacementResult CheckPlacement(Vector2Int cell, TowerData data)
    {
        if (!GridSystem.Instance.IsInBounds(cell)) return PlacementResult.OutOfBounds;
        if (GridSystem.Instance.IsOccupied(cell))  return PlacementResult.Occupied;

        // ★ 벽(고정 지형)만 금지
        if (IsWallCell(cell)) return PlacementResult.OutOfBounds;

        if (WaveManager.Instance.Gold < data.cost) return PlacementResult.NotEnoughGold;

        return PlacementResult.Valid;
    }
```

**✅ 여기까지 실행하면** — 경로 위에도 놓을 수 있다.

### Step 3 — 경로 변화 확인

**적이 이동 중일 때 경로 앞에 타워를 놓는다.**

**✅ 이렇게 하면**

```
   ★ 새로 스폰되는 적은 우회한다
   ⚠️ 이미 이동 중인 적은 타워에 부딪혀 멈춘다
```

```
   → 3-3절의 경로 재계산이 필요하다
```

### Step 4 — 경로 재계산

```csharp
    // Enemy에 추가
    public void RecalculatePath()
    {
        (movement as GroundMovement)?.RecalculatePath();
    }
```

```csharp
    // TowerPlacer.PlaceTower 마지막에
    StartCoroutine(NotifyPathChangedStaggered());
```

```csharp
    private IEnumerator NotifyPathChangedStaggered()
    {
        // ★ Carve가 반영될 때까지 대기
        yield return null;
        yield return new WaitForFixedUpdate();

        var enemies = EnemyManager.Instance.Active;
        const int PER_FRAME = 10;

        for (int i = 0; i < enemies.Count; i++)
        {
            enemies[i]?.RecalculatePath();

            if ((i + 1) % PER_FRAME == 0) yield return null;
        }

        Debug.Log($"[경로] {enemies.Count}기 재계산");
    }
```

**✅ 고치면** — 이동 중인 적도 즉시 우회한다.

<!-- SHOT: Step 4 우회 -->

### Step 5 — 완전 차단 실험

**타워로 통로를 완전히 막는다.**

**✅ 이렇게 하면**

```
   ★ 적이 멈춘다
   ★ 또는 벽에 붙어 밀고 있다
   ★ 게임이 진행되지 않는다
```

```
   Console:
   [AI] 부분 경로 — 도달 불가
```

> ### ★ 이 문제를 푸는 것이 오늘의 핵심이다

### Step 6 — 격자 BFS 검사기

3-6절의 `PathValidator`를 만든다.

```csharp
    // TowerPlacer에서 사용
    private PlacementResult CheckPlacement(Vector2Int cell, TowerData data)
    {
        // ... 기존 검사 ...

        // ★ 경로 차단 검사
        Vector2Int startCell = GridSystem.Instance.WorldToCell(spawnPoint.position);
        Vector2Int goalCell = GridSystem.Instance.WorldToCell(goal.position);

        if (!pathValidator.CanReach(startCell, goalCell, cell))
            return PlacementResult.BlocksPath;

        return PlacementResult.Valid;
    }
```

**✅ 여기까지 실행하면**

```
   ★ 완전히 막는 위치에서 고스트가 붉게 변한다
   ★ 클릭해도 배치되지 않는다
   ★ 실시간으로 판정된다 (프레임 대기 없음)
```

<!-- SHOT: Step 6 차단 금지 -->

### Step 7 — BFS 성능 확인

```csharp
    // 프로파일러로 확인
    // 21×21 격자 = 441셀
```

**✅ 여기까지 하면**

```
   CanReach 1회:  약 0.03 ms
   → 매 프레임 호출해도 문제없다
```

```
   ★ Day 61에서 만든 BFS가 여기서 쓰인다

   Part 2:  이동 범위 계산
   Unity:   경로 차단 검사
```

### Step 8 — 메시지 UI

```csharp
using System.Collections;
using TMPro;
using UnityEngine;

public class MessageUI : MonoBehaviour
{
    public static MessageUI Instance { get; private set; }

    [SerializeField] private CanvasGroup group;
    [SerializeField] private TextMeshProUGUI text;
    [SerializeField] private float duration = 1.6f;

    private Coroutine running;

    void Awake() { Instance = this; group.alpha = 0; }

    public void Show(string msg, Color color)
    {
        text.text = msg;
        text.color = color;

        if (running != null) StopCoroutine(running);
        running = StartCoroutine(ShowRoutine());
    }

    private IEnumerator ShowRoutine()
    {
        group.alpha = 1f;

        yield return new WaitForSeconds(duration);

        float t = 0;
        while (t < 0.3f)
        {
            t += Time.deltaTime;
            group.alpha = 1f - t / 0.3f;
            yield return null;
        }

        group.alpha = 0;
        running = null;
    }
}
```

```csharp
    // 배치 실패 시
    MessageUI.Instance.Show("⚠ 경로를 완전히 막을 수 없습니다",
                            new Color(1f, 0.5f, 0.3f));
```

**✅ 여기까지 실행하면** — 이유가 화면에 표시된다.

### Step 9 — 미로 만들기

**타워로 지그재그 경로를 만들어 본다.**

```
   ┌──────────────────────────┐
   │  ●──╮                    │
   │     │ ▓▓▓▓▓▓▓▓           │
   │     ╰────────────╮       │
   │       ▓▓▓▓▓▓▓▓   │       │
   │  ╭──────────────╯        │
   │  │  ▓▓▓▓▓▓▓▓             │
   │  ╰──────────────────▶ ▤  │
   └──────────────────────────┘
```

**✅ 여기까지 하면**

```
   ★ 경로가 3배 길어진다
   ★ 같은 타워로 3배 오래 때린다
   ★ 실효 DPS가 3배  ← Day 89의 커버리지
```

> ### ★ 이것이 타워 디펜스의 핵심 재미다

<!-- SHOT: Step 9 미로 -->

### Step 10 — 경로 시각화

```csharp
    // 현재 경로를 화면에 표시
    public class PathPreview : MonoBehaviour
    {
        [SerializeField] private LineRenderer line;
        [SerializeField] private Transform spawnPoint;
        [SerializeField] private Transform goal;

        private NavMeshPath path;
        private float refreshTimer;

        void Awake() { path = new NavMeshPath(); }

        void Update()
        {
            refreshTimer -= Time.deltaTime;
            if (refreshTimer > 0) return;

            refreshTimer = 0.3f;
            Refresh();
        }

        public void Refresh()
        {
            if (!NavMesh.CalculatePath(spawnPoint.position, goal.position,
                                       NavMesh.AllAreas, path))
            {
                line.positionCount = 0;
                return;
            }

            line.positionCount = path.corners.Length;

            for (int i = 0; i < path.corners.Length; i++)
                line.SetPosition(i, path.corners[i] + Vector3.up * 0.15f);

            // ★ 경로 길이 계산
            float len = 0;
            for (int i = 0; i < path.corners.Length - 1; i++)
                len += Vector3.Distance(path.corners[i], path.corners[i + 1]);

            PathLength = len;
        }

        public float PathLength { get; private set; }
    }
```

**✅ 여기까지 실행하면** — 현재 경로가 선으로 보이고 길이가 표시된다.

```
   ★ 미로를 만들수록 길이가 늘어난다
   → 플레이어가 자기 전략의 효과를 눈으로 본다
```

### Step 11 — 늪 지형 (Area Cost)

```
   Window → AI → Navigation → Areas 탭
   → User Area 3: "Swamp",  Cost 3
```

```
   Plane을 하나 만들어 늪으로
   → Add Component → Nav Mesh Modifier
   → Override Area ✔ → Swamp
   → NavMeshSurface 다시 Bake
```

**✅ 여기까지 실행하면**

```
   ★ 적이 늪을 피해 돌아간다
   ★ 늪을 지나는 게 훨씬 짧아야만 통과한다
```

<!-- SHOT: Step 11 늪 회피 -->

**Cost를 1로 바꿔 Bake.**

```
   → 늪을 그냥 지나간다
```

**Cost를 10으로.**

```
   → 아주 멀리 돌아간다
```

```
   ★ Day 62의 다익스트라 가중치가 그대로다
```

### Step 12 — 늪 감속

```csharp
    // 늪 Plane에 Box Collider (Is Trigger ✔)
    public class SwampZone : MonoBehaviour
    {
        [SerializeField] private float slowMultiplier = 0.5f;

        void OnTriggerStay(Collider other)
        {
            Enemy e = other.GetComponentInParent<Enemy>();
            if (e == null) return;

            // ★ 짧은 지속시간으로 계속 갱신
            e.ApplySlow(slowMultiplier, 0.3f, e.Data.slowResist);
        }
    }
```

```
   ⚠️ Area Cost는 경로 선택만, 속도는 안 바꾼다

   둘 다 필요하다
```

**✅ 여기까지 실행하면** — 늪을 지나는 적이 느려진다.

### Step 13 — Agent Type 3종

```
   Agents 탭
   Small   Radius 0.25  Height 1.0  Step 0.4  Slope 45
   Normal  Radius 0.45  Height 1.8  Step 0.4  Slope 45
   Large   Radius 0.9   Height 2.6  Step 0.6  Slope 30
```

```
   NavMeshSurface를 3개 만든다
   각각 Agent Type을 지정하고 Bake
```

```
   적 프리팹의 NavMeshAgent
   Agent Type을 각각 지정
```

**좁은 통로(폭 1.2)를 만든다.**

**✅ 여기까지 실행하면**

```
   ★ Small은 통과
   ★ Normal, Large는 못 지나가 돌아간다
```

```
   ★ 게임 디자인

   "이 좁은 길은 소형 적만 온다"
   → 그쪽에는 대공/소형 특화 타워를
```

### Step 14 — 부분 경로 안전장치

3-10절의 코드를 `GroundMovement`에 넣는다.

```csharp
    public void Tick(float dt)
    {
        if (goal == null || !agent.enabled) return;
        if (agent.pathPending) return;

        switch (agent.pathStatus)
        {
        case NavMeshPathStatus.PathComplete:
            blockedTimer = 0;
            break;

        case NavMeshPathStatus.PathPartial:
        case NavMeshPathStatus.PathInvalid:
            blockedTimer += dt;

            if (blockedTimer > 1f)
            {
                blockedTimer = 0;
                agent.SetDestination(goal.position);
                Debug.LogWarning("[AI] 경로 막힘 — 재시도");
            }
            break;
        }
    }
```

**✅ 여기까지 하면** — 예외 상황에서도 멈추지 않는다.

### Step 15 — Carve 성능 측정

```csharp
    // 타워를 20개 빠르게 배치하며 프로파일러 확인
```

**✅ 여기까지 하면**

```
   NavMesh.UpdateCarving   배치 순간 4~8 ms 스파이크
   그 외 프레임            0 ms
```

```
   ★ Carve Only Stationary 덕분에
     배치 순간에만 비용이 발생한다
```

**Carve Only Stationary를 끄고 타워를 미세하게 흔들어 본다.**

```
   → 매 프레임 3~5 ms
   → 프레임이 눈에 띄게 떨어진다
```

> **되돌린다.**

### Step 16 — 배치 미리보기에 경로 표시

```csharp
    // 고스트 위치에 임시로 경로를 계산해 보여준다
    private void UpdateGhostPathPreview(Vector2Int cell)
    {
        // ★ 격자 BFS로 우회 경로의 길이를 근사
        int steps = pathValidator.CountSteps(startCell, goalCell, cell);

        if (steps < 0)
        {
            pathLengthText.text = "차단됨";
            pathLengthText.color = Color.red;
        }
        else
        {
            float estimated = steps * GridSystem.Instance.CellSize;
            float delta = estimated - currentPathLength;

            pathLengthText.text = $"경로 {estimated:F0}m  ({delta:+0;-0}m)";
            pathLengthText.color = delta > 0 ? Color.green : Color.white;
        }
    }
```

```csharp
    // PathValidator에 추가 — BFS 거리
    public int CountSteps(Vector2Int start, Vector2Int goal, Vector2Int extraBlocked)
    {
        queue.Clear(); visited.Clear(); dist.Clear();

        if (start == extraBlocked || goal == extraBlocked) return -1;

        queue.Enqueue(start);
        visited.Add(start);
        dist[start] = 0;

        while (queue.Count > 0)
        {
            Vector2Int cur = queue.Dequeue();

            if (cur == goal) return dist[cur];

            for (int i = 0; i < Dirs.Length; i++)
            {
                Vector2Int next = cur + Dirs[i];

                if (visited.Contains(next)) continue;
                if (!IsInBounds(next)) continue;
                if (next == extraBlocked) continue;
                if (GridSystem.Instance.IsOccupied(next)) continue;
                if (IsWall(next)) continue;

                visited.Add(next);
                dist[next] = dist[cur] + 1;
                queue.Enqueue(next);
            }
        }

        return -1;
    }
```

**✅ 여기까지 실행하면**

```
   ★ 타워를 놓기 전에
     "이 위치에 놓으면 경로가 +8m 길어진다"
   → 전략적 선택이 명확해진다
```

<!-- SHOT: Step 16 경로 변화 미리보기 -->

```
   ★ Day 61의 BFS가 거리 계산에도 쓰인다
```

### Step 17 — 결과 화면

**Day 75의 구조를 재사용한다.**

```csharp
    private IEnumerator ShowResult(bool win)
    {
        yield return new WaitForSecondsRealtime(0.8f);

        resultPanel.SetActive(true);

        resultTitle.text = win ? "방어 성공!" : "방어 실패";
        resultTitle.color = win ? new Color(1f, 0.85f, 0.3f)
                                 : new Color(0.9f, 0.3f, 0.3f);

        resultStats.text =
            $"도달 웨이브   {WaveManager.Instance.CurrentWaveNumber}\n" +
            $"남은 라이프   {WaveManager.Instance.Life}\n" +
            $"처치한 적     {totalKills}\n" +
            $"건설한 타워   {totalBuilt}\n" +
            $"최종 경로     {pathPreview.PathLength:F0} m";

        // 기록 저장 (Day 79)
        SaveRecord(win);
    }
```

**✅ 여기까지 실행하면** — 결과 화면.

### Step 18 — 문서 16 완성 점검

```
   Week 18 산출물

   ✔ 타워 디펜스 게임
   ✔ 웨이브 시스템 (ScriptableObject)
   ✔ 타워 3종 + 업그레이드 + 판매
   ✔ 파티클 이펙트
   ✔ 밸런스 검증 도구
   ✔ 성능 최적화 (최악 프레임 4배 개선)
   ✔ NavMesh Carve 미로 만들기
   ✔ 경로 차단 방지 (BFS)
   ✔ Area Cost (늪)
   ✔ Agent Type 3종
   ✔ Windows 빌드
```

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  WAVE 7 / 10    라이프 16/20    골드 680               │
   │                                     경로 88m           │
   │   ▣ 시작                                               │
   │    ╲                                                   │
   │     ◆──╮                                               │
   │        │  ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓                             │
   │        ╰──────────────────╮                            │
   │                            │  ▓ ▓ ▓ ▓ ▓ ▓             │
   │        ╭───────────────────╯                           │
   │        │  ░░░ 늪 ░░░                                   │
   │        ╰──────────────────────────▶ ▤ 목표             │
   │                                                        │
   │            ┌┈┈┈┐  경로 96m (+8m)                       │
   │            ┊ ▓ ┊                                       │
   │            └┈┈┈┘                                       │
   │  ⚠ 경로를 완전히 막을 수 없습니다                        │
   └────────────────────────────────────────────────────────┘
```

- [ ] 타워에 NavMeshObstacle Carve가 적용됐다
- [ ] **타워를 놓으면 NavMesh에 구멍이 생긴다**
- [ ] 경로 위에도 타워를 놓을 수 있다
- [ ] 새 적이 우회한다
- [ ] **이동 중인 적도 경로를 재계산한다**
- [ ] 재계산이 여러 프레임에 분산된다
- [ ] 완전히 막으면 적이 멈춘다는 것을 확인했다
- [ ] **BFS로 차단을 사전에 검사한다**
- [ ] 차단 위치에서 고스트가 붉게 변한다
- [ ] 메시지가 표시된다
- [ ] **미로를 만들면 경로가 3배 길어진다**
- [ ] 경로가 선으로 시각화된다
- [ ] 배치 전에 경로 변화량이 표시된다
- [ ] 늪(Area Cost 3)을 적이 피해 간다
- [ ] Cost를 바꾸면 행동이 달라진다
- [ ] 늪 위에서 감속된다
- [ ] Agent Type별로 통과 가능한 통로가 다르다
- [ ] 부분 경로 안전장치가 동작한다
- [ ] Carve 비용이 배치 순간에만 발생한다
- [ ] Carve Only Stationary를 끄면 느려진다
- [ ] 결과 화면이 나온다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **Carve가 반영 안 됨** | Carve 미체크 | 체크 |
| Carve가 반영 안 됨 | Obstacle 크기 0 | Size 확인 |
| 기존 적이 안 우회 | 재계산 없음 | `SetDestination` 재호출 |
| 재계산 시 프레임 저하 | 동시 호출 | 여러 프레임 분산 |
| **적이 멈춤** | 경로 완전 차단 | BFS 사전 검사 |
| BFS와 NavMesh 불일치 | 격자 크기 차이 | Obstacle 크기 조정 |
| BFS가 느림 | 매번 new | 필드 재사용 + Clear |
| Area Cost 무시됨 | Bake 안 함 | 다시 Bake |
| Area Cost가 속도에 영향 없음 | 정상 | 감속은 별도 구현 |
| Agent Type이 안 먹힘 | Surface 미생성 | Type별 Surface |
| **Carve로 프레임 저하** | Only Stationary 해제 | 체크 |
| 타워 사이로 지나감 | Obstacle이 작음 | Size 늘리기 |
| 타워가 붙어도 틈 | Obstacle이 큼 | Size 줄이기 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **NavMeshObstacle Carve** | NavMesh에 구멍을 판다 |
| Carve Only Stationary | 멈췄을 때만. 비용 절약 |
| **경로 재계산** | Carve 후 `SetDestination` 재호출 |
| 재계산 분산 | 여러 프레임에 나눈다 |
| **차단 정책** | 배치 금지 ★ / 타워 공격 / 통과 |
| `NavMesh.CalculatePath` | 경로 존재 확인 |
| **격자 BFS 검사** | 즉시 판정. Day 61 재사용 |
| **Area Cost** | Day 62의 다익스트라 가중치 |
| Area Mask | 비트 마스크로 통행 제한 |
| Agent Type | 크기별 별도 Surface |
| 부분 경로 | `PathPartial` 안전장치 |
| Off-Mesh Link | 끊긴 곳 연결 |
| 경로 시각화 | 전략의 피드백 |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| **Day 61 BFS** | 경로 차단 검사 |
| **Day 62 다익스트라 가중치** | **Area Cost** |
| Day 63 A\* | NavMesh 내부 |
| Day 17 비트 플래그 | `areaMask` |
| Day 57 배치 미리보기 | 고스트 + 경로 변화 |

```
   ★ Week 13에서 손으로 만든 세 알고리즘이
     Week 18에서 전부 다시 쓰였다

   BFS      →  차단 검사
   다익스트라 →  Area Cost
   A*       →  NavMesh
```

### Week 18 정리 — 디펜스 게임

| Day | 만든 것 | Part 2 대응 |
|:--:|---|---|
| Day 86 | 웨이브 스폰·경로 이동 | Day 54~55 |
| Day 87 | 타워 배치·타겟팅 | **Day 56~57** |
| Day 88 | 파티클 시스템 | **Day 68** |
| Day 89 | 밸런스·성능 | **Day 70** |
| **Day 90** | **NavMesh 심화** | **Day 61~63** |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 91** | 레이싱 — 주행 경로 |
| Day 96 | 빌드·최적화 |
| Day 101+ | 파이널 프로젝트 AI |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 늪 외에 "길"(Cost 0.5) 추가 | Area 추가 + Modifier |
| ★★ | 점프 유닛 (벽을 넘는 적) | NavMeshLink + areaMask |
| ★★ | 스테이지 3종 (맵 다르게) | 씬 분리 또는 프리팹 |
| ★★★ | 타워 공격 정책 구현 (타워에 HP) | `IDamageable` |
| ★★★ | 미로 효율 점수 (경로 길이 / 타워 수) | 결과 화면에 표시 |
| ★★★★ | 런타임 NavMesh 재베이크 비교 | `UpdateNavMesh` 성능 측정 |

### 다음 시간

> **마지막 주제는 렌더링 자체를 건드린다.**
>
> ```
>   Week 19 · 레이싱 게임

>   Day 91  차량 제어 (WheelCollider)
>   Day 92  트랙·랩 카운트·AI 주행
>   Day 93  카메라·속도감 연출
>   Day 94  Shader Graph ★
>   Day 95  후처리·문서 17 완성
> ```
>
> 지금까지는 엔진이 주는 셰이더를 **썼다.**
> 이제 **만든다.**
>
> Day 68에서 픽셀을 직접 블렌딩했던 그 계산을,
> 이번엔 GPU 위에서 노드로 조립한다.
>
> → **Day 91, 차량 제어**
