# Day 084 · NavMesh — A\*가 엔진 기능으로 ★

> **Week 17** · 연결 문서 `15 액션 게임` — Step 3
> 선수: Day 083 (블렌드 트리), **Day 061~063 (BFS·다익스트라·A\*)**

---

## 1. 오늘 만드는 것

**적이 장애물을 피해 플레이어를 추격한다.** 사거리에 들어오면 멈춰 공격한다.

```
   ┌────────────────────────────────────────────────────────┐
   │  Scene (베이크된 NavMesh = 파란 면)                     │
   │                                                        │
   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░░░░░░░░░┌────────┐░░░░░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░  ◆ ────┤ 기둥   ├──╮ ░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░  적1   └────────┘  ╰──▶ ● 플레이어 ░░░░░░       │
   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ╱│╲ ░░░░░░░░░░░░       │
   │  ░░░░  ◆ ──────────╮░░░░░░░░░░  │  ░░░░░░░░░░░░       │
   │  ░░░░  적2         ╰────────────╯ ░░░░░░░░░░░░░       │
   │  ░░░░░░░░░░┌──────────┐░░░░░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░  ◆ ──┤   벽     ├─────────╮░░░░░░░░░░░░░       │
   │  ░░░░  적3 └──────────┘         ╰──▶ ░░░░░░░░░       │
   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
   ├────────────────────────────────────────────────────────┤
   │  적1  Chase   거리 4.2   경로 3점                       │
   │  적2  Attack  거리 1.8   쿨다운 0.6                     │
   │  적3  Patrol  거리 12.4                                 │
   └────────────────────────────────────────────────────────┘
```

<!-- SHOT: Day 84 완성 화면 -->

---

## 2. 막히는 상황

적이 플레이어를 향해 오게 해 보자.

```csharp
    void Update()
    {
        Vector3 dir = (player.position - transform.position).normalized;
        transform.position += dir * speed * Time.deltaTime;
    }
```

```
   ★ 결과

   ▓▓▓▓▓▓▓▓▓▓
   ▓  벽    ▓
   ▓▓▓▓▓▓▓▓▓▓
       ◆ ← 벽에 붙어서 계속 밀고 있다
       │
       ▼ (플레이어는 벽 너머)
```

```
   ★ 직선으로만 간다
   ★ 장애물을 못 피한다
```

```
   Part 2에서는 어떻게 했나

   Day 61:  BFS로 최단 경로
   Day 62:  다익스트라 (가중치)
   Day 63:  A* (휴리스틱)

   → 격자를 만들고, 노드를 잇고, 우선순위 큐를 돌렸다
   → 약 300줄
```

```
   ★ 그런데 3D는 격자가 아니다

   × 지형에 높낮이가 있다
   × 경사면이 있다
   × 격자로 나누면 노드가 수만 개
   × 계단, 다리, 좁은 통로
```

> **NavMesh는 "걸을 수 있는 면"을 폴리곤으로 표현한다.**

---

## 3. 개념

### 3-1. 격자 A\* vs NavMesh

**왜 필요한가** — 오늘의 핵심 비교.

```
   [Part 2 · 타일 격자]              [Unity · NavMesh]

   □□□□■■□□□□                      ┌────────────┐
   □□□□■■□□□□                      │            │  ← 걸을 수 있는 면을
   □□□□□□□□□□     노드 = 타일       │   ┌────┐   │     폴리곤으로 표현
   □□■■■■□□□□     간선 = 인접       │   │장애│   │
   □□■■■■□□□□                      │   └────┘   │  노드 = 폴리곤
   □□□□□□□□□□                      └────────────┘  경로 = 폴리곤 통과 후
                                                     직선화(String Pulling)

   장점: 구현이 단순              장점: 자유로운 지형, 노드 수가 적음
```

| | 격자 A\* | NavMesh |
|---|---|---|
| 노드 수 (100×100 맵) | 10,000 | **20~50** |
| 지형 자유도 | 격자에 제한 | **자유** |
| 높낮이 | 표현 어려움 | **자연스럽다** |
| 경로 모양 | 계단식 | **직선화** |
| 동적 변경 | 즉시 | 재베이크 필요 |
| 구현 | 직접 | 엔진 제공 |

```
   ★ 노드 수가 적은 이유

   격자:    빈 공간도 타일 하나하나
   NavMesh: 넓은 빈 공간 = 큰 폴리곤 하나
```

```
   ★ 내부적으로는 여전히 A*다

   Day 63에서 배운 f = g + h
   → 노드가 타일이 아니라 폴리곤일 뿐
```

### 3-2. String Pulling (경로 직선화)

**왜 필요한가** — 격자 A\*의 계단식 경로 문제.

```
   격자 A* 원본 경로              직선화 후

   ●─┐                            ●
     └─┐                           ╲
       └─┐                          ╲
         └─┐                         ╲
           └─● 목표                    ●

   지그재그로 움직인다              자연스럽다
```

```
   ★ NavMesh는 폴리곤을 통과한 뒤
     "코리도(corridor)" 안에서 최단 직선을 구한다

   ┌─────┬─────┬─────┐
   │  ●  │     │     │
   │   ╲ │     │     │      각 폴리곤의 공유 변(portal)을
   │    ╲│     │     │      통과하는 최단 경로
   │     ╲─────┼─────┤
   │      ╲    │     │
   │       ╲   │  ●  │
   └────────╲──┴─────┘
```

```
   ★ Part 2에서 이 문제를 어떻게 다뤘나

   Day 64:  경로 점 사이를 선형 보간으로 부드럽게
   → 완전한 직선화는 아니었다

   NavMesh는 알고리즘 차원에서 해결한다
```

### 3-3. AI Navigation 패키지

**왜 필요한가** — Unity 6에서는 별도 패키지다.

```
   Window → Package Manager
   → Unity Registry → "AI Navigation" 검색 → Install
```

```
   ⚠️ 구버전과의 차이

   기존 (Navigation 창):
     Navigation Static 체크 + Bake 버튼

   AI Navigation 패키지 (Unity 6):
     NavMeshSurface 컴포넌트 + Bake 버튼
     → 여러 개의 NavMesh를 만들 수 있다
     → 런타임 베이크가 쉽다
```

```
   ★ 문서·튜토리얼을 볼 때 주의

   "Navigation 창을 열고..."  → 구버전
   "NavMeshSurface를 추가..." → 신버전 ★
```

### 3-4. NavMeshSurface

**왜 필요한가** — 어디를 걸을 수 있는지 계산한다.

```
   빈 오브젝트 생성 → NavMeshSurface 추가
```

| 필드 | 의미 |
|---|---|
| **Agent Type** | 어느 에이전트용 NavMesh인지 |
| **Collect Objects** | All / Volume / Children |
| **Include Layers** | 어떤 레이어를 지형으로 볼지 |
| **Use Geometry** | Render Meshes / **Physics Colliders** |
| Default Area | Walkable / Not Walkable / Jump |
| Override Voxel Size | 정밀도 |

```
   ★ Use Geometry

   Render Meshes:      보이는 메시 기준 (정확하지만 느림)
   Physics Colliders:  Collider 기준 (빠름) ★ 권장
```

```
   ★ Collect Objects

   All:       씬 전체
   Volume:    지정한 박스 안만  ★ 큰 맵에서
   Children:  이 오브젝트의 자식만
```

### 3-5. Agent Type과 Bake 설정

**왜 필요한가** — 캐릭터 크기에 맞는 통로를 계산한다.

```
   Window → AI → Navigation → Agents 탭
   (또는 NavMeshSurface의 Agent Type → Open Agent Settings)
```

| 필드 | 의미 |
|---|---|
| **Radius** | 에이전트 반지름. 벽에서 이만큼 떨어진다 |
| **Height** | 키. 이보다 낮은 곳은 못 지나간다 |
| **Step Height** | 오를 수 있는 턱 높이 |
| **Max Slope** | 오를 수 있는 경사각 |

```
        Height
          ↕        ┌─────┐
         ┌─┐       │     │  ← 이 아래는 못 지나감
         │●│       └─────┘
         │ │
        ─┴─┴─  ← Step Height (턱)
       ←Radius→
```

```
   ★ Radius가 중요한 이유

   Radius 0.5 인 에이전트는
   폭 1.0 미만의 통로를 지나갈 수 없다

   ┌────┐   ┌────┐
   │벽  │0.8│ 벽 │      Radius 0.5 → 통과 불가
   └────┘   └────┘      → NavMesh가 아예 안 생긴다
```

```
   ⚠️ 통로가 막혀 보인다면

   ① Agent Radius를 줄인다
   ② 또는 통로를 넓힌다
   ③ Voxel Size를 줄여 정밀도를 높인다
```

```
   ★ 여러 Agent Type

   Humanoid  Radius 0.5, Height 2.0
   Small     Radius 0.2, Height 0.6    (쥐, 드론)
   Large     Radius 1.2, Height 3.0    (거인)

   → 각각 별도의 NavMeshSurface를 베이크한다
```

### 3-6. NavMeshAgent

**왜 필요한가** — 실제로 움직이는 컴포넌트.

| 필드 | 의미 |
|---|---|
| **Speed** | 최대 이동 속도 |
| **Angular Speed** | 회전 속도 (도/초) |
| **Acceleration** | 가속도 |
| **Stopping Distance** | 목표에서 이만큼 남으면 멈춤 |
| Auto Braking | 목표 근처에서 감속 |
| **Radius / Height** | 회피 계산용 |
| **Obstacle Avoidance** | 다른 에이전트 회피 품질 |
| **Priority** | 낮을수록 우선 (0~99) |
| **Auto Traverse Off Mesh Link** | 점프·사다리 자동 통과 |

```csharp
    agent.SetDestination(player.position);     // ★ 목표 설정
    agent.isStopped = true;                    // 일시 정지
    agent.ResetPath();                         // 경로 취소

    // 상태 조회
    float remaining = agent.remainingDistance;
    bool arrived = !agent.pathPending && agent.remainingDistance <= agent.stoppingDistance;
    Vector3 vel = agent.velocity;
    NavMeshPathStatus status = agent.pathStatus;
```

```
   ⚠️ pathPending 확인 필수

   SetDestination 직후에는 경로 계산이 안 끝났다
   → remainingDistance가 무한대(Infinity)
   → 도착했다고 오판한다
```

```csharp
    // ✔ 올바른 도착 판정
    bool HasArrived()
    {
        if (agent.pathPending) return false;
        if (agent.remainingDistance > agent.stoppingDistance) return false;

        return !agent.hasPath || agent.velocity.sqrMagnitude < 0.01f;
    }
```

### 3-7. 경로 상태

**왜 필요한가** — 갈 수 없는 곳을 판별한다.

| `pathStatus` | 의미 |
|---|---|
| **Complete** | 목표까지 경로 있음 |
| **Partial** | 도중까지만 갈 수 있음 |
| **Invalid** | 경로 없음 |

```csharp
    if (agent.pathStatus == NavMeshPathStatus.PathPartial)
        Debug.LogWarning("[AI] 목표에 도달할 수 없다 — 중간까지만");
```

```
   ★ 경로를 미리 계산해 볼 수도 있다

   NavMeshPath path = new NavMeshPath();
   bool ok = NavMesh.CalculatePath(from, to, NavMesh.AllAreas, path);

   → 이동하지 않고 "갈 수 있나"만 확인
```

```
   ★ Day 63의 A* 반환값과 같다

   Part 2:  bool FindPath(...)  →  실패 시 false
   Unity:   NavMeshPathStatus
```

### 3-8. NavMesh 위에 올리기

**왜 필요한가** — 에이전트가 안 움직이는 1위 원인.

```
   "SetDestination" can only be called on an active agent
   that has been placed on a NavMesh.
```

```csharp
    // ★ 가까운 NavMesh 지점을 찾아 올린다
    if (NavMesh.SamplePosition(transform.position, out NavMeshHit hit,
                               2f, NavMesh.AllAreas))
    {
        agent.Warp(hit.position);              // ★ Warp = 순간이동
    }
    else
    {
        Debug.LogError("[AI] NavMesh 위가 아니다");
    }
```

```
   ★ agent.Warp() vs transform.position

   Warp:              NavMesh 상태를 함께 갱신  ✔
   transform.position: 에이전트가 혼란스러워한다  ✗
```

```
   ⚠️ NavMeshAgent가 있으면 transform으로 이동하지 않는다

   Day 73에서 Rigidbody에 대해 배운 것과 같은 원리
```

### 3-9. Obstacle Avoidance

**왜 필요한가** — 적 여럿이 서로 밀지 않게.

| Quality | 비용 | 품질 |
|---|:--:|---|
| None | 최저 | 회피 안 함 |
| Low Quality | 낮음 | 4방향 |
| Medium Quality | 보통 | 8방향 |
| **Good Quality** | 높음 | 16방향 ★ |
| High Quality | 최고 | 32방향 |

```
   ★ Priority (0~99)

   낮은 값 = 높은 우선순위 = 안 비켜준다

   보스     Priority 10
   일반 적  Priority 50
   잡몹     Priority 80
```

```
   ⚠️ 모두 같은 Priority면

   서로 비키려다 교착 상태에 빠질 수 있다
   → 값을 조금씩 다르게 준다
```

```csharp
    agent.avoidancePriority = 50 + Random.Range(-10, 10);
```

```
   ⚠️ 회피는 만능이 아니다

   좁은 통로에서 여럿이 몰리면 여전히 막힌다
   → 포메이션(대형) 이동이나 목표 지점 분산이 필요
```

### 3-10. 목표 지점 분산

**왜 필요한가** — 적 3기가 모두 플레이어 발밑을 노리면 겹친다.

```
   ✗ 전부 같은 지점              ✔ 원형으로 분산

        ◆◆◆                        ◆
         ●                       ◆ ● ◆
   (서로 밀어낸다)              (둘러싼다)
```

```csharp
    // ★ 플레이어 주변 원형 배치
    Vector3 GetAttackPosition(int index, int total, float radius)
    {
        float angle = (index / (float)total) * Mathf.PI * 2f;

        Vector3 offset = new Vector3(
            Mathf.Cos(angle) * radius, 0, Mathf.Sin(angle) * radius);

        Vector3 target = player.position + offset;

        // ★ NavMesh 위로 보정
        if (NavMesh.SamplePosition(target, out NavMeshHit hit, 2f, NavMesh.AllAreas))
            return hit.position;

        return player.position;
    }
```

```
   ★ Day 66의 삼각함수가 여기서 쓰인다

   cos = x, sin = z (3D에서는 y가 위)
```

### 3-11. NavMesh Obstacle

**왜 필요한가** — 움직이는 장애물.

```
   NavMeshObstacle 컴포넌트

   Shape:    Box / Capsule
   Carve:    ✔ 이면 NavMesh에 구멍을 판다
   Move Threshold:  이만큼 움직이면 다시 계산
   Carve Only Stationary: 멈췄을 때만 파기
```

| Carve | 동작 | 비용 |
|:--:|---|:--:|
| ✗ | 에이전트가 물리적으로 밀림 | 낮음 |
| ✔ | NavMesh에 구멍 → 경로 자체가 우회 | **높음** |

```
   ★ Carve 없이

   ┌──────────┐
   │  ▨ 장애물 │      경로는 직선
   └──────────┘      에이전트가 부딪혀 밀림
        ◆──────▶

   ★ Carve 켜면

   ┌──────────┐
   │  ▨▨▨▨▨  │      NavMesh에 구멍
   └──────────┘      경로가 우회
        ◆──╮
            ╰───▶
```

```
   ⚠️ Carve는 비싸다

   장애물이 움직일 때마다 NavMesh 일부를 다시 계산
   → 많으면 프레임이 튄다
   → Carve Only Stationary 로 완화
```

```
   ★ Week 18(디펜스)에서 심화한다

   타워를 놓으면 적의 경로가 바뀌는 게임
   → Carve의 대표적인 용도
```

### 3-12. Off-Mesh Link

**왜 필요한가** — 끊긴 곳을 잇는다.

```
   ┌──────┐        ┌──────┐
   │      │  갭    │      │
   │  A   │◀──────▶│  B   │
   └──────┘        └──────┘

   NavMesh가 끊겨 있다
   → 점프하거나 사다리를 타야 한다
```

```
   NavMeshLink 컴포넌트 (AI Navigation 패키지)

   Start Point / End Point
   Bidirectional:  양방향
   Area Type:      Jump 등
   Cost Modifier:  이 링크의 비용
```

```
   ★ Area Type과 Cost

   Day 62의 다익스트라 가중치가 여기 있다

   Walkable  Cost 1
   Jump      Cost 2       (되도록 피한다)
   Water     Cost 5       (매우 피한다)
```

```csharp
    // 자동 통과 대신 직접 처리
    agent.autoTraverseOffMeshLink = false;

    IEnumerator TraverseJump()
    {
        OffMeshLinkData data = agent.currentOffMeshLinkData;

        Vector3 start = agent.transform.position;
        Vector3 end = data.endPos + Vector3.up * agent.baseOffset;

        animator.SetTrigger("Jump");

        float t = 0;
        while (t < 1f)
        {
            t += Time.deltaTime / jumpDuration;

            // ★ 포물선 (Day 67)
            Vector3 pos = Vector3.Lerp(start, end, t);
            pos.y += jumpHeight * Mathf.Sin(t * Mathf.PI);

            agent.transform.position = pos;
            yield return null;
        }

        agent.CompleteOffMeshLink();
    }
```

```
   ★ Day 67의 포물선이 여기서 쓰인다
```

### 3-13. Agent와 애니메이션 연결

**왜 필요한가** — 이동 속도에 맞는 모션.

```csharp
    void Update()
    {
        // ★ Agent의 실제 속도를 애니메이터로
        float speed = agent.velocity.magnitude;

        animator.SetFloat(HashSpeed, speed, 0.1f, Time.deltaTime);
    }
```

```
   ⚠️ 흔한 실수

   agent.speed  →  설정값(최대 속도). 항상 같다  ✗
   agent.velocity.magnitude  →  실제 속도  ✔
```

```
   ⚠️ Root Motion과 충돌

   Apply Root Motion ✔ + NavMeshAgent
   → 둘 다 이동을 시도 → 싸운다

   ★ 선택지
   ① Root Motion ✗, Agent가 이동  ← 단순. 오늘은 이것
   ② Root Motion ✔, Agent는 경로만 (updatePosition = false)
```

```csharp
    // 방식 ② — 루트 모션 우선
    void Start()
    {
        agent.updatePosition = false;
        agent.updateRotation = false;
    }

    void OnAnimatorMove()
    {
        transform.position = animator.rootPosition;
        agent.nextPosition = transform.position;   // ★ Agent에게 알린다
    }
```

### 3-14. 적 AI FSM

**왜 필요한가** — Day 46·82의 상태 기계를 다시.

```
   ┌────────┐  플레이어 발견   ┌────────┐  사거리 진입  ┌────────┐
   │ Patrol │ ───────────────▶│ Chase  │ ────────────▶│ Attack │
   └────────┘                 └────────┘              └────────┘
        ▲                          │                       │
        │      시야에서 사라짐      │      사거리 이탈       │
        └──────────────────────────┴───────────────────────┘
```

```csharp
public enum EnemyState { Idle, Patrol, Chase, Attack, Hit, Dead }
```

```
   ★ Part 2 Day 65의 전투 AI와 같은 구조

   Part 2:  switch (m_state) { case AI_CHASE: ... }
   Unity:   switch (state) { case EnemyState.Chase: ... }

   차이는 "이동"을 NavMeshAgent가 대신한다는 것뿐
```

### 3-15. 시야 판정

**왜 필요한가** — "발견"의 조건.

```csharp
    private bool CanSeePlayer()
    {
        if (player == null) return false;

        Vector3 toPlayer = player.position - transform.position;
        float dist = toPlayer.magnitude;

        // ① 거리
        if (dist > detectRange) return false;

        // ② 각도 (시야각)
        float angle = Vector3.Angle(transform.forward, toPlayer);
        if (angle > viewAngle * 0.5f) return false;

        // ③ 장애물 (Raycast)
        Vector3 origin = transform.position + Vector3.up * eyeHeight;
        Vector3 target = player.position + Vector3.up * 1f;

        if (Physics.Raycast(origin, (target - origin).normalized,
                            out RaycastHit hit, dist, obstacleLayer))
        {
            return false;                      // ★ 벽에 가림
        }

        return true;
    }
```

```
        시야각 90도

          ╲   ╱
           ╲ ╱
            ◆ ──────▶ forward
           ╱ ╲
          ╱   ╲

   ● 안에 있고 각도 안이고 가려지지 않으면 발견
```

```
   ★ Vector3.Angle

   두 벡터 사이 각도(0~180도)
   → Day 66의 삼각함수를 엔진이 대신
```

```
   ★ 발견 후에는 시야각을 무시하기도 한다

   "한 번 발견하면 잠시 추적" → 자연스럽다
```

---

## 4. 따라 만들기

### Step 1 — 패키지 설치

```
   Window → Package Manager
   → Unity Registry
   → "AI Navigation" 검색 → Install
```

**✅ 여기까지 하면** — Window → AI 메뉴가 생긴다.

### Step 2 — 맵 구성

```
   Ground (Plane, Scale 5)         Layer: Ground
   Wall_1 (Cube, 8×3×1)            Layer: Ground
   Wall_2 (Cube, 1×3×10)
   Pillar_1~3 (Cylinder, 1×3×1)
   Ramp (Cube, 회전 20도)
```

```
   ┌──────────────────────────────┐
   │                              │
   │   ▨      ┌────────┐          │
   │          │ Wall_1 │      ▨   │
   │          └────────┘          │
   │   ┌┐                    ┌┐   │
   │   ││ Wall_2        ▨    ││   │
   │   └┘                    └┘   │
   │            ╱ Ramp            │
   └──────────────────────────────┘
```

**✅ 여기까지 하면** — 장애물이 있는 맵.

### Step 3 — NavMeshSurface

```
   빈 오브젝트 생성 → 이름 NavMeshSurface
   Add Component → NavMeshSurface

   Agent Type:       Humanoid
   Collect Objects:  All
   Include Layers:   Ground (또는 Everything)
   Use Geometry:     Physics Colliders
```

**Bake 버튼을 누른다.**

**✅ 여기까지 하면**

```
   ★ Scene 뷰에 파란 면이 생긴다

   장애물 주변은 비어 있다
```

<!-- SHOT: Step 3 베이크 결과 -->

```
   ⚠️ 안 보이면

   Scene 뷰 우상단 Gizmos → Navigation 항목 확인
   또는 Window → AI → Navigation 창을 열어 둔다
```

### Step 4 — Agent 설정 실험

```
   Window → AI → Navigation → Agents 탭
   Humanoid의 Radius를 0.5 → 1.5 로
   → 다시 Bake
```

**✅ 이렇게 하면**

```
   ★ 좁은 통로의 NavMesh가 사라진다
   ★ 벽에서 더 멀리 떨어진다
```

**Max Slope를 45 → 10 으로 바꿔 Bake.**

```
   ★ 경사로(Ramp) 위의 NavMesh가 사라진다
   → 못 올라간다
```

> **원래대로 되돌린다 (Radius 0.5, Max Slope 45).**

### Step 5 — Step Height 실험

```
   높이 0.4 인 계단(Cube)을 만든다
   Step Height 0.75 → Bake
   → 계단이 이어진다  ✔

   Step Height 0.2 → Bake
   → 계단이 끊긴다   ✗
```

**✅ 여기까지 하면** — Step Height의 의미를 확인했다.

### Step 6 — 적 오브젝트

```
   Enemy (빈 오브젝트)
   ├─ Model (캐릭터 FBX 또는 Capsule)
   │   └─ Animator (AC_Enemy)
   ├─ NavMeshAgent
   ├─ Capsule Collider
   └─ EnemyController
```

```
   NavMeshAgent 설정
   Speed:              3.5
   Angular Speed:      360
   Acceleration:       12
   Stopping Distance:  1.8
   Auto Braking:       ✔
   Radius:             0.4
   Height:             1.8
   Obstacle Avoidance: Good Quality
   Priority:           50
```

**✅ 여기까지 하면** — 적이 놓인다.

### Step 7 — 최소 추격

```csharp
using UnityEngine;
using UnityEngine.AI;

[RequireComponent(typeof(NavMeshAgent))]
public class EnemySimpleChase : MonoBehaviour
{
    [SerializeField] private Transform target;

    private NavMeshAgent agent;

    void Awake() { agent = GetComponent<NavMeshAgent>(); }

    void Update()
    {
        if (target == null) return;
        agent.SetDestination(target.position);
    }
}
```

**✅ 여기까지 실행하면**

```
   ★ 적이 벽을 돌아서 온다

   → Day 61~63에서 300줄로 만든 것이
     SetDestination 한 줄
```

<!-- SHOT: Step 7 우회 이동 -->

> ### ★ 이것이 오늘의 첫 확인이다

### Step 8 — NavMesh 밖 실험

**적을 공중으로 올린다 (y = 5).**

**✅ 이렇게 하면**

```
   "SetDestination" can only be called on an active agent
   that has been placed on a NavMesh.

   → 에이전트가 안 움직인다
```

**3-8절의 `SamplePosition` + `Warp`를 추가한다.**

```csharp
    void Start()
    {
        if (NavMesh.SamplePosition(transform.position, out NavMeshHit hit,
                                   5f, NavMesh.AllAreas))
        {
            agent.Warp(hit.position);
            Debug.Log($"[AI] NavMesh 위로 보정: {hit.position}");
        }
        else
        {
            Debug.LogError("[AI] 근처에 NavMesh가 없다");
        }
    }
```

**✅ 고치면** — 자동으로 바닥에 내려와 움직인다.

### Step 9 — 경로 시각화

```csharp
    void OnDrawGizmos()
    {
        if (agent == null || !agent.hasPath) return;

        Vector3[] corners = agent.path.corners;

        Gizmos.color = Color.cyan;

        for (int i = 0; i < corners.Length - 1; i++)
        {
            Gizmos.DrawLine(corners[i] + Vector3.up * 0.1f,
                            corners[i + 1] + Vector3.up * 0.1f);
            Gizmos.DrawSphere(corners[i] + Vector3.up * 0.1f, 0.12f);
        }
    }
```

**✅ 여기까지 실행하면**

```
   ★ Scene 뷰에 경로가 하늘색 선으로 보인다
   ★ 꺾이는 지점(corner)에 구슬

   → Day 63에서 경로를 화면에 그렸던 것과 같다
```

<!-- SHOT: Step 9 경로 표시 -->

```
   ★ corners의 개수를 보면 직선화 효과를 알 수 있다

   격자 A*였다면 수십 개
   NavMesh는 3~5개
```

### Step 10 — 도착 판정 실험

```csharp
    // ✗ 틀린 판정
    if (agent.remainingDistance <= agent.stoppingDistance)
        Debug.Log("도착!");
```

**✅ 이렇게 하면**

```
   ★ SetDestination 직후에 "도착!"이 찍힌다

   경로 계산이 안 끝나 remainingDistance가 0 또는 Infinity
```

**3-6절의 `HasArrived()`로 고친다.**

**✅ 고치면** — 실제로 도착했을 때만 찍힌다.

### Step 11 — 경로 없음 처리

**NavMesh와 완전히 분리된 섬(Plane)을 만들고, 플레이어를 그 위로 옮긴다.**

```csharp
    if (agent.pathStatus == NavMeshPathStatus.PathPartial)
        Debug.LogWarning("[AI] 부분 경로 — 도달 불가");

    if (agent.pathStatus == NavMeshPathStatus.PathInvalid)
        Debug.LogError("[AI] 경로 없음");
```

**✅ 여기까지 하면** — 갈 수 없는 곳을 감지한다.

```
   ★ Day 63에서 FindPath가 false를 반환한 그 상황
```

### Step 12 — 적 AI FSM

```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

public enum EnemyState { Idle, Patrol, Chase, Attack, Hit, Dead }

[RequireComponent(typeof(NavMeshAgent))]
public class EnemyController : MonoBehaviour, IDamageable
{
    [Header("참조")]
    [SerializeField] private Transform player;
    [SerializeField] private Animator animator;

    [Header("감지")]
    [SerializeField] private float detectRange = 12f;
    [SerializeField] private float viewAngle = 110f;
    [SerializeField] private float eyeHeight = 1.6f;
    [SerializeField] private LayerMask obstacleLayer;
    [SerializeField] private float loseInterest = 4f;

    [Header("전투")]
    [SerializeField] private float attackRange = 2f;
    [SerializeField] private float attackCooldown = 1.6f;
    [SerializeField] private int attackDamage = 8;

    [Header("순찰")]
    [SerializeField] private Transform[] patrolPoints;
    [SerializeField] private float patrolWait = 2f;

    [Header("체력")]
    [SerializeField] private int maxHp = 50;

    private static readonly int HashSpeed  = Animator.StringToHash("Speed");
    private static readonly int HashAttack = Animator.StringToHash("Attack");
    private static readonly int HashHit    = Animator.StringToHash("Hit");
    private static readonly int HashDead   = Animator.StringToHash("IsDead");

    private NavMeshAgent agent;
    private EnemyState state = EnemyState.Idle;

    private int hp;
    private float cooldownTimer;
    private float lostTimer;
    private int patrolIndex;
    private float waitTimer;

    public bool IsAlive => hp > 0;
    public EnemyState State => state;
    public float DistanceToPlayer =>
        player != null ? Vector3.Distance(transform.position, player.position) : 999f;

    void Awake()
    {
        agent = GetComponent<NavMeshAgent>();
        hp = maxHp;

        if (animator == null) animator = GetComponentInChildren<Animator>();

        // ★ 우선순위 분산 (3-9)
        agent.avoidancePriority = 50 + Random.Range(-15, 15);
    }

    void Start()
    {
        // ★ NavMesh 위로 보정
        if (NavMesh.SamplePosition(transform.position, out NavMeshHit hit,
                                   5f, NavMesh.AllAreas))
            agent.Warp(hit.position);

        SetState(patrolPoints != null && patrolPoints.Length > 0
                 ? EnemyState.Patrol : EnemyState.Idle);
    }

    void Update()
    {
        if (state == EnemyState.Dead) return;

        cooldownTimer -= Time.deltaTime;

        // ★ 애니메이션 연동 (3-13)
        animator.SetFloat(HashSpeed, agent.velocity.magnitude, 0.1f, Time.deltaTime);

        switch (state)
        {
        case EnemyState.Idle:   UpdateIdle();   break;
        case EnemyState.Patrol: UpdatePatrol(); break;
        case EnemyState.Chase:  UpdateChase();  break;
        case EnemyState.Attack: UpdateAttack(); break;
        case EnemyState.Hit:    /* 애니 대기 */ break;
        }
    }

    // ─── 상태별 ───

    private void UpdateIdle()
    {
        if (CanSeePlayer()) SetState(EnemyState.Chase);
    }

    private void UpdatePatrol()
    {
        if (CanSeePlayer()) { SetState(EnemyState.Chase); return; }

        if (HasArrived())
        {
            waitTimer -= Time.deltaTime;

            if (waitTimer <= 0)
            {
                patrolIndex = (patrolIndex + 1) % patrolPoints.Length;
                agent.SetDestination(patrolPoints[patrolIndex].position);
                waitTimer = patrolWait;
            }
        }
    }

    private void UpdateChase()
    {
        if (CanSeePlayer()) lostTimer = loseInterest;
        else                lostTimer -= Time.deltaTime;

        if (lostTimer <= 0)
        {
            SetState(patrolPoints.Length > 0 ? EnemyState.Patrol : EnemyState.Idle);
            return;
        }

        if (DistanceToPlayer <= attackRange)
        {
            SetState(EnemyState.Attack);
            return;
        }

        agent.SetDestination(player.position);
    }

    private void UpdateAttack()
    {
        // ★ 플레이어를 바라본다
        Vector3 dir = player.position - transform.position;
        dir.y = 0;

        if (dir.sqrMagnitude > 0.01f)
        {
            transform.rotation = Quaternion.Slerp(
                transform.rotation, Quaternion.LookRotation(dir),
                8f * Time.deltaTime);
        }

        if (DistanceToPlayer > attackRange * 1.3f)
        {
            SetState(EnemyState.Chase);
            return;
        }

        if (cooldownTimer <= 0)
        {
            animator.SetTrigger(HashAttack);
            cooldownTimer = attackCooldown;
        }
    }

    // ─── 상태 전환 ───

    private void SetState(EnemyState s)
    {
        if (state == s) return;

        state = s;

        switch (s)
        {
        case EnemyState.Idle:
            agent.isStopped = true;
            agent.ResetPath();
            break;

        case EnemyState.Patrol:
            agent.isStopped = false;
            if (patrolPoints.Length > 0)
                agent.SetDestination(patrolPoints[patrolIndex].position);
            break;

        case EnemyState.Chase:
            agent.isStopped = false;
            lostTimer = loseInterest;
            break;

        case EnemyState.Attack:
            agent.isStopped = true;            // ★ 멈춰서 공격
            agent.ResetPath();
            break;

        case EnemyState.Hit:
            agent.isStopped = true;
            break;

        case EnemyState.Dead:
            agent.isStopped = true;
            agent.enabled = false;
            animator.SetBool(HashDead, true);
            GetComponent<Collider>().enabled = false;
            Destroy(gameObject, 4f);
            break;
        }
    }

    // ─── 감지 ───

    private bool CanSeePlayer()
    {
        if (player == null) return false;

        Vector3 toPlayer = player.position - transform.position;
        float dist = toPlayer.magnitude;

        if (dist > detectRange) return false;

        float angle = Vector3.Angle(transform.forward, toPlayer);
        if (angle > viewAngle * 0.5f) return false;

        Vector3 origin = transform.position + Vector3.up * eyeHeight;
        Vector3 target = player.position + Vector3.up * 1f;
        Vector3 dir = (target - origin).normalized;

        if (Physics.Raycast(origin, dir, dist, obstacleLayer)) return false;

        return true;
    }

    private bool HasArrived()
    {
        if (agent.pathPending) return false;
        if (agent.remainingDistance > agent.stoppingDistance) return false;
        return !agent.hasPath || agent.velocity.sqrMagnitude < 0.01f;
    }

    // ─── 피격 ───

    public void TakeDamage(DamageInfo info)
    {
        if (!IsAlive) return;

        hp -= info.amount;

        if (hp <= 0) { SetState(EnemyState.Dead); return; }

        animator.SetTrigger(HashHit);
        StartCoroutine(HitRoutine(info));
    }

    private IEnumerator HitRoutine(DamageInfo info)
    {
        EnemyState prev = state;
        SetState(EnemyState.Hit);

        // ★ 넉백 (Day 48)
        float t = 0;
        while (t < 0.2f)
        {
            t += Time.deltaTime;
            agent.Move(info.direction * info.knockback * Time.deltaTime);
            yield return null;
        }

        yield return new WaitForSeconds(0.2f);

        if (IsAlive) SetState(EnemyState.Chase);
    }

    // ─── 기즈모 ───

    void OnDrawGizmosSelected()
    {
        // 감지 범위
        Gizmos.color = new Color(1f, 1f, 0f, 0.25f);
        Gizmos.DrawWireSphere(transform.position, detectRange);

        // 공격 범위
        Gizmos.color = new Color(1f, 0f, 0f, 0.4f);
        Gizmos.DrawWireSphere(transform.position, attackRange);

        // ★ 시야각
        Vector3 left = Quaternion.Euler(0, -viewAngle * 0.5f, 0) * transform.forward;
        Vector3 right = Quaternion.Euler(0, viewAngle * 0.5f, 0) * transform.forward;

        Gizmos.color = Color.yellow;
        Gizmos.DrawRay(transform.position + Vector3.up * eyeHeight, left * detectRange);
        Gizmos.DrawRay(transform.position + Vector3.up * eyeHeight, right * detectRange);
    }
}
```

**✅ 여기까지 실행하면** — 적이 순찰하다가 발견하면 추격하고 사거리에서 공격한다.

<!-- SHOT: Step 12 AI 동작 -->

### Step 13 — 시야 확인

**적 뒤로 돌아가 본다.**

**✅ 여기까지 하면**

```
   ★ 뒤에 있으면 발견하지 않는다 (시야각)
   ★ 벽 뒤에 숨으면 발견하지 않는다 (Raycast)
   ★ 발견 후 숨으면 4초간 쫓아온다 (loseInterest)
```

**`viewAngle`을 360으로 바꿔 본다.**

```
   → 뒤에서도 발견한다
```

### Step 14 — 적 3기 배치

**Enemy를 프리팹으로 만들고 3개 배치한다.**

**✅ 여기까지 실행하면**

```
   ★ 3기가 동시에 추격한다
   ★ 서로 밀치며 겹친다  ⚠️
```

<!-- SHOT: Step 14 겹침 문제 -->

### Step 15 — 회피 설정

```
   Obstacle Avoidance Quality: None → 확인
   → 완전히 겹친다

   Good Quality → 확인
   → 서로 비켜간다
```

```
   Priority를 전부 50으로 → 확인
   → 교착 상태가 생길 수 있다

   Random 분산 → 확인
   → 자연스럽다
```

### Step 16 — 목표 분산

3-10절의 원형 배치를 구현한다.

```csharp
public class EnemyGroupManager : MonoBehaviour
{
    public static EnemyGroupManager Instance { get; private set; }

    [SerializeField] private Transform player;
    [SerializeField] private float ringRadius = 2.5f;

    private readonly List<EnemyController> chasers = new List<EnemyController>();

    void Awake() { Instance = this; }

    public void RegisterChaser(EnemyController e)
    {
        if (!chasers.Contains(e)) chasers.Add(e);
    }

    public void UnregisterChaser(EnemyController e) => chasers.Remove(e);

    public Vector3 GetSlotPosition(EnemyController e)
    {
        int index = chasers.IndexOf(e);
        if (index < 0) return player.position;

        int total = Mathf.Max(1, chasers.Count);
        float angle = (index / (float)total) * Mathf.PI * 2f;

        Vector3 offset = new Vector3(
            Mathf.Cos(angle) * ringRadius, 0, Mathf.Sin(angle) * ringRadius);

        Vector3 target = player.position + offset;

        if (NavMesh.SamplePosition(target, out NavMeshHit hit, 2f, NavMesh.AllAreas))
            return hit.position;

        return player.position;
    }
}
```

```csharp
    // UpdateChase 수정
    Vector3 dest = EnemyGroupManager.Instance != null
                   ? EnemyGroupManager.Instance.GetSlotPosition(this)
                   : player.position;

    agent.SetDestination(dest);
```

**✅ 여기까지 실행하면** — 적들이 플레이어를 둘러싼다.

<!-- SHOT: Step 16 원형 포위 -->

### Step 17 — 동적 장애물

```
   Cube 생성 → NavMeshObstacle
   Shape: Box
   Carve: ✗ 로 먼저 확인
```

**적의 경로 위에 놓아 본다.**

```
   ★ 경로는 그대로 (직선)
   ★ 에이전트가 부딪혀 밀린다
```

**Carve를 체크한다.**

```
   ★ NavMesh에 구멍이 생긴다
   ★ 경로가 우회한다
```

**장애물을 움직여 본다.**

```
   ★ 구멍이 따라 움직인다
   ⚠️ 프레임이 살짝 튄다 (재계산 비용)
```

**Carve Only Stationary를 켠다.**

```
   → 멈췄을 때만 판다. 부하가 준다
```

### Step 18 — 애니메이션 연동 확인

```csharp
    animator.SetFloat(HashSpeed, agent.velocity.magnitude, 0.1f, Time.deltaTime);
```

**`agent.velocity.magnitude`를 `agent.speed`로 바꿔 본다.**

```
   ★ 항상 최대 속도로 표시
   → 멈춰 있어도 뛰는 모션
```

> **되돌린다.**

**Apply Root Motion을 켜 본다.**

```
   ★ 애니메이션과 Agent가 싸운다
   → 떨리거나 제자리걸음
```

> **끈다.**

### Step 19 — 디버그 HUD

```csharp
using UnityEngine;

public class AIDebugHUD : MonoBehaviour
{
    [SerializeField] private EnemyController[] enemies;

    void OnGUI()
    {
        GUIStyle s = new GUIStyle(GUI.skin.label) { fontSize = 15 };
        int y = 10;

        for (int i = 0; i < enemies.Length; i++)
        {
            EnemyController e = enemies[i];
            if (e == null) continue;

            var agent = e.GetComponent<UnityEngine.AI.NavMeshAgent>();

            int corners = (agent != null && agent.hasPath)
                          ? agent.path.corners.Length : 0;

            GUI.Label(new Rect(10, y, 600, 22),
                $"적{i + 1}  {e.State,-7} 거리 {e.DistanceToPlayer:F1}  경로 {corners}점", s);

            y += 22;
        }
    }
}
```

**✅ 최종** — 1절의 화면.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  Scene (NavMesh = 파란 면)                              │
   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░░░░░░░░░┌────────┐░░░░░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░  ◆ ────┤ 기둥   ├──╮ ░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░  적1   └────────┘  ╰──▶ ● 플레이어 ░░░░░░       │
   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ╱│╲ ░░░░░░░░░░░░       │
   │  ░░░░  ◆ ──────────╮░░░░░░░░░░  │  ░░░░░░░░░░░░       │
   │  ░░░░  적2         ╰────────────╯ ░░░░░░░░░░░░░       │
   │  ░░░░░░░░░░┌──────────┐░░░░░░░░░░░░░░░░░░░░░░░░       │
   │  ░░░░  ◆ ──┤   벽     ├─────────╮░░░░░░░░░░░░░       │
   │  ░░░░  적3 └──────────┘         ╰──▶ ░░░░░░░░░       │
   ├────────────────────────────────────────────────────────┤
   │  적1  Chase   거리 4.2  경로 3점                        │
   │  적2  Attack  거리 1.8  경로 0점                        │
   │  적3  Patrol  거리 12.4 경로 2점                        │
   └────────────────────────────────────────────────────────┘
```

- [ ] AI Navigation 패키지를 설치했다
- [ ] NavMeshSurface로 베이크했다 (파란 면)
- [ ] Agent Radius를 키우면 통로가 막힌다는 것을 확인했다
- [ ] Max Slope로 경사로 통행이 결정된다
- [ ] Step Height로 계단 통행이 결정된다
- [ ] **`SetDestination` 한 줄로 적이 우회한다**
- [ ] NavMesh 밖이면 오류가 난다는 것을 확인했다
- [ ] `SamplePosition` + `Warp`로 보정했다
- [ ] 경로가 Gizmo로 보인다
- [ ] **corner가 3~5개뿐이다 (직선화)**
- [ ] `pathPending` 없이 도착 판정하면 오판한다
- [ ] `pathStatus`로 도달 불가를 감지한다
- [ ] 적 FSM (Patrol/Chase/Attack)이 동작한다
- [ ] 시야각 밖·벽 뒤에서는 발견하지 않는다
- [ ] 발견 후 일정 시간 추적한다
- [ ] 적 3기가 서로 회피한다
- [ ] Priority를 분산해 교착을 줄였다
- [ ] 목표 분산으로 플레이어를 둘러싼다
- [ ] NavMeshObstacle의 Carve 유무 차이를 확인했다
- [ ] `agent.velocity.magnitude`로 애니메이션이 연동된다
- [ ] Root Motion과 충돌한다는 것을 확인했다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **Agent가 안 움직임** | NavMesh 미베이크 | Bake |
| Agent가 안 움직임 | NavMesh 위가 아님 | `SamplePosition` + `Warp` |
| Agent가 안 움직임 | `isStopped = true` | 확인 |
| **지형이 베이크 안 됨** | Layer 제외 | Include Layers |
| 지형이 베이크 안 됨 | Collider 없음 | Use Geometry 확인 |
| 통로가 막힘 | Agent Radius 과대 | 줄이기 |
| 경사로를 못 오름 | Max Slope | 늘리기 |
| 계단을 못 오름 | Step Height | 늘리기 |
| **도착 오판** | `pathPending` 미확인 | 3-6절 판정 |
| 적이 서로 밀침 | Avoidance 낮음 | Good Quality |
| 적이 교착 | Priority 동일 | 분산 |
| 적이 겹쳐 서 있음 | 같은 목표 | 목표 분산 |
| **애니가 미끄러짐** | Root Motion 중복 | 하나만 사용 |
| 애니 속도가 항상 최대 | `agent.speed` 사용 | `velocity.magnitude` |
| transform 이동이 무시됨 | Agent가 제어 | `Warp` 또는 Agent 사용 |
| 경로가 없다고 나옴 | 분리된 NavMesh | 연결 또는 Off-Mesh Link |
| Carve로 프레임 저하 | 재계산 비용 | Carve Only Stationary |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **NavMesh** | 걸을 수 있는 면을 폴리곤으로. 노드 수가 적다 |
| **String Pulling** | 경로 직선화. 계단식이 아니다 |
| AI Navigation 패키지 | Unity 6는 `NavMeshSurface` |
| Agent Type | Radius / Height / Step / Slope |
| **Radius** | 통로 폭을 결정한다 |
| **NavMeshAgent** | `SetDestination` 한 줄 |
| `pathPending` | 도착 판정 전에 반드시 확인 |
| `pathStatus` | Complete / Partial / Invalid |
| **`SamplePosition` + `Warp`** | NavMesh 위로 보정 |
| Obstacle Avoidance | 서로 비켜가기 |
| Priority | 낮을수록 우선. 분산 필요 |
| 목표 분산 | 원형 배치로 포위 |
| **NavMeshObstacle Carve** | NavMesh에 구멍. 비싸다 |
| Off-Mesh Link | 점프·사다리 |
| 애니 연동 | `agent.velocity.magnitude` |
| 시야 판정 | 거리 + 각도 + Raycast |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| **Day 61 BFS** | NavMesh 내부 |
| **Day 62 다익스트라 가중치** | Area Cost |
| **Day 63 A\*** | **NavMesh 경로 탐색** |
| Day 63 격자 노드 | 폴리곤 노드 |
| Day 64 경로 추적 이동 | `NavMeshAgent` |
| Day 64 선형 보간 | Agent의 가감속 |
| Day 65 전투 AI FSM | `EnemyState` |
| Day 65 시야·사거리 | `CanSeePlayer` |
| Day 66 삼각함수 | 원형 배치 |
| Day 67 포물선 | Off-Mesh Link 점프 |

```
   ★ 300줄이 1줄이 됐다

   하지만 A*를 직접 만들어 본 사람만
   ① 왜 경로가 이상한지
   ② 왜 못 가는지
   ③ 무엇을 조절해야 하는지
   알 수 있다
```

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 85** | 적 AI 완성 + 타격감 |
| Day 86 | 웨이브 스폰 · 경로 이동 |
| Day 88 | NavMesh 심화 (Carve로 미로 만들기) |
| Day 101+ | 파이널 프로젝트 AI |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 순찰 지점을 늘려 순회 경로 만들기 | `patrolPoints` 배열 |
| ★★ | 소리 감지 (플레이어가 뛰면 발각) | 거리 + 플레이어 상태 |
| ★★ | 도망 AI (체력이 낮으면 멀어진다) | 반대 방향 `SamplePosition` |
| ★★★ | Area Cost로 "물길은 피한다" 구현 | Area Type + Cost |
| ★★★ | Off-Mesh Link 점프 (포물선 연출) | Day 67 재사용 |
| ★★★★ | 런타임 NavMesh 베이크 (절차적 맵) | `NavMeshSurface.BuildNavMesh()` |

### 다음 시간

> 적이 쫓아오고 공격한다. 그런데 **때리는 맛이 없다.**
>
> ```
>   지금

>   × 카메라가 고정이라 답답하다
>   × 공격해도 반응이 밋밋하다
>   × 적이 그냥 사라진다
> ```
>
> **Cinemachine**으로 3인칭 카메라를 만들고,
> **Day 48에서 배운 타격감**(히트스톱·셰이크·넉백)을 3D로 옮긴다.
>
> Week 17을 마무리하고 문서 15를 완성한다.
>
> → **Day 85, 카메라·타격감 · 문서 15 완성**
