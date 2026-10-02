# Day 063 · A\* — 목표를 알면 덜 뒤진다 ★

> **Week 13** · 연결 문서 `11 택틱스 게임` — Step 3
> 선수: Day 062 (다익스트라, 우선순위 큐)

> ### 길 찾기 3부작의 완성
> BFS(비용 없음) → 다익스트라(비용) → **A\*(비용 + 방향)**
> 게임에서 가장 널리 쓰이는 길 찾기 알고리즘이다.

---

## 1. 오늘 만드는 것

**같은 경로를 찾으면서 탐색 노드가 1/4로 줄어든다.**

```
   ┌──────────────────────────────────────────────────────────┐
   │  Pathfinding Compare                             ─    ✕ │
   ├──────────────────────────────────────────────────────────┤
   │  다익스트라 (398 노드)          A* (97 노드)              │
   │  ▒▒▒▒▒▒▒▒▒▒▒▒▒                  ░░░░                      │
   │  ▒▒▒▒▒S▒▒▒▒▒▒                  ░░S▒▒                      │
   │  ▒▒▒▒▒▒▒▒▒▒▒▒▒                    ▒▒▒▒▒                   │
   │  ▒▒▒▒▒▒▒▒▒▒▒▒▒                      ▒▒▒▒▒                 │
   │  ▒▒▒▒▒▒▒▒G▒▒▒▒                        ▒▒▒G                │
   │  ▒▒▒▒▒▒▒▒▒▒▒▒▒                                            │
   │   사방으로 퍼진다                목표 쪽으로만              │
   │                                                          │
   │  ─ 비교 ─                              [1][2][3] 알고리즘  │
   │  알고리즘      탐색노드   경로길이   시간      최단보장    │
   │  BFS             412        18      0.031ms    비용균일만  │
   │  다익스트라       398        16      0.052ms    O          │
   │  A* (h×1.0)       97        16      0.014ms    O   ★      │
   │  A* (h×2.0)       41        17      0.006ms    X (근사)   │
   └──────────────────────────────────────────────────────────┘
```

**조작** — 시작/목표를 클릭으로 지정, 숫자 키로 알고리즘 전환.

<!-- SHOT: Day 63 완성 화면 -->

---

## 2. 막히는 상황

다익스트라로 "A지점에서 B지점까지의 경로"를 찾아 보자.

```
   맵 100 × 100, 시작 (10,50), 목표 (90,50)

   다익스트라의 탐색 영역

   ┌─────────────────────────────────────┐
   │        ▒▒▒▒▒▒▒▒▒▒▒▒▒                │
   │      ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒              │
   │    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒            │
   │  ▒▒▒▒▒▒S▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒     G   │
   │    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒            │
   │      ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒              │
   │        ▒▒▒▒▒▒▒▒▒▒▒▒▒                │
   └─────────────────────────────────────┘
             ▲
        목표와 반대 방향도 전부 탐색한다
```

```
   ★ 다익스트라는 목표를 모른다

   "시작점에서 모든 곳까지의 최단 거리"를 구하는 알고리즘
   → 특정 목표만 필요해도 사방으로 퍼진다

   맵 100×100 에서 목표까지 80칸이면
   → 약 20,000 노드를 탐색한다
   → 실제 경로는 80칸인데
```

```
   지금:   목표를 모르고 사방으로 퍼진다

   필요:   목표 방향을 우선 탐색한다
```

> **목표까지의 "예상 거리"를 이용하는 방법이 필요하다.** → **A\***

---

## 3. 개념

### 3-1. A\*의 핵심 아이디어

**왜 필요한가** — 한 문장으로 요약된다.

```
   ┌──────────────────────────────────────────────────────────┐
   │  다익스트라:  "지금까지 온 비용이 가장 작은 것부터"        │
   │                                                           │
   │  A*:         "지금까지 온 비용 + 앞으로 갈 예상 비용이     │
   │               가장 작은 것부터"                            │
   └──────────────────────────────────────────────────────────┘
```

```
   ★ f = g + h

   g  =  시작점에서 현재까지의 실제 비용     (다익스트라의 그것)
   h  =  현재에서 목표까지의 예상 비용       (휴리스틱, 추정치)
   f  =  이 노드를 지나는 전체 예상 비용
```

```
   예)  시작 (0,0), 목표 (10,0), 현재 (3,0)

   g = 3       (실제로 3칸 왔다)
   h = 7       (앞으로 7칸 남았을 것 같다)
   f = 10      (전체 10칸 예상)


   같은 g=3 이지만 (0,3) 에 있다면

   g = 3
   h = 10.4    (목표까지 대각선으로 멀다)
   f = 13.4    ← f 가 크므로 나중에 탐색
```

```
   ★ 결과

   목표 방향의 노드가 f 가 작아진다
   → 우선순위 큐에서 먼저 나온다
   → 목표 쪽으로 집중 탐색
```

### 3-2. 휴리스틱 (h)

**왜 필요한가** — "앞으로 얼마나 남았을까"의 추정치.

```
   조건: 실제 비용보다 크면 안 된다 (admissible)

   h ≤ 실제 남은 비용     →  최단 경로 보장  ✔
   h > 실제 남은 비용     →  최단 보장 X (하지만 빠름)
```

**맨해튼 거리 — 4방향 이동에 적합**

```cpp
int HeuristicManhattan(int c1, int r1, int c2, int r2)
{
    return abs(c1 - c2) + abs(r1 - r2);
}
```

```
   (2,1) 에서 (5,4) 까지

   |5-2| + |4-1| = 3 + 3 = 6

        c2  c3  c4  c5
   r1   S ─ ─ ─ ─ ┐
   r2             │
   r3             │
   r4             └─ G

   ★ 4방향으로만 가면 최소 6칸. 정확한 하한이다
```

**유클리드 거리 — 8방향/자유 이동에 적합**

```cpp
double HeuristicEuclidean(int c1, int r1, int c2, int r2)
{
    double dc = c1 - c2, dr = r1 - r2;
    return sqrt(dc*dc + dr*dr);
}
```

**대각선 거리 — 8방향에 정확**

```cpp
double HeuristicDiagonal(int c1, int r1, int c2, int r2)
{
    int dc = abs(c1 - c2), dr = abs(r1 - r2);
    int diag = min(dc, dr);
    int straight = dc + dr - 2 * diag;

    return diag * 1.414 + straight * 1.0;
}
```

| 휴리스틱 | 적합한 이동 | 4방향에서 |
|---|---|---|
| **맨해튼** | 4방향 | **정확** |
| 유클리드 | 자유 | 과소평가 (느리지만 정확) |
| 대각선 | 8방향 | 과소평가 |
| 0 (h 없음) | — | **다익스트라와 동일** |

```
   ★ h = 0 이면 A* = 다익스트라

   f = g + 0 = g
   → 다익스트라와 완전히 같아진다

   ★ 즉, 다익스트라는 A*의 특수한 경우다
```

### 3-3. ⚠️ 휴리스틱과 이동 비용의 단위

**왜 필요한가** — 단위가 안 맞으면 최단 경로가 안 나온다.

```
   이동 비용: 평지 1, 숲 2, 늪 3
   휴리스틱:  맨해튼 거리 (칸 수)

   → 최소 이동 비용이 1이므로 h = 칸 수 는 안전하다  ✔
```

```
   ★ 만약 최소 이동 비용이 1보다 작다면?

   도로 비용 0.5 (정수로는 못 하니 전부 2배: 평지 2, 도로 1)
   → h 도 2배 해야 한다
   → h = 맨해튼 거리 × 최소이동비용
```

```cpp
    const int MIN_MOVE_COST = 1;

    int h = HeuristicManhattan(c, r, goalC, goalR) * MIN_MOVE_COST;
```

```
   ★ h 가 실제보다 크면 (과대평가)

   최단 경로를 놓칠 수 있다
   대신 탐색이 빨라진다

   → "빠르지만 근사" 트레이드오프
```

### 3-4. 오픈 리스트와 클로즈 리스트

**왜 필요한가** — A\*의 전통적 설명 방식.

```
   오픈 리스트 (Open)    아직 탐색하지 않은 후보
   클로즈 리스트 (Closed) 이미 확정된 노드
```

```
   ┌──────────────────────────────────────────────────────────┐
   │  ① 시작 노드를 오픈에 넣는다                              │
   │  ② 오픈에서 f 가 가장 작은 노드를 꺼낸다                  │
   │  ③ 목표면 종료                                            │
   │  ④ 클로즈에 넣는다                                        │
   │  ⑤ 이웃마다:                                              │
   │       - 클로즈에 있으면 건너뛴다                          │
   │       - 새 g 가 더 작으면 갱신하고 오픈에 넣는다          │
   │  ⑥ ②로 돌아간다                                           │
   └──────────────────────────────────────────────────────────┘
```

```
   ★ 구현에서는

   오픈 리스트   =  우선순위 큐 (f 기준)
   클로즈 리스트 =  visited 플래그

   → 다익스트라와 자료구조가 같다
```

### 3-5. 추적표 (PRD 6절 권장 표현)

**왜 필요한가** — 알고리즘의 진행을 표로 따라가면 확실히 이해된다.

```
   맵 (모두 평지, 비용 1)

        c1  c2  c3  c4
   r1   S   .   .   .
   r2   .   #   .   .
   r3   .   #   .   G

   시작 (1,1), 목표 (4,3), 4방향, h = 맨해튼
```

| 단계 | 확정 노드 | g | h | f | 오픈 리스트 (f 오름차순) |
|:--:|:--:|:--:|:--:|:--:|---|
| 0 | — | — | — | — | (1,1) f=5 |
| 1 | (1,1) | 0 | 5 | 5 | (2,1) f=5, (1,2) f=5 |
| 2 | (2,1) | 1 | 4 | 5 | (1,2) f=5, (3,1) f=5, (2,2)✘벽 |
| 3 | (3,1) | 2 | 3 | 5 | (1,2) f=5, (4,1) f=5, (3,2) f=5 |
| 4 | (4,1) | 3 | 2 | 5 | (1,2) f=5, (3,2) f=5, (4,2) f=5 |
| 5 | (4,2) | 4 | 1 | 5 | (1,2) f=5, (3,2) f=5, (4,3) f=5 |
| 6 | **(4,3)** | 5 | 0 | **5** | **목표 도달!** |

```
   ★ 탐색 노드 6개

   다익스트라라면 (1,2), (1,3) 방향도 탐색했을 것이다
   → h 덕분에 목표 쪽으로만 갔다
```

**비교 — 같은 맵에서 다익스트라**

| 단계 | 확정 노드 | g | 오픈 리스트 |
|:--:|:--:|:--:|---|
| 1 | (1,1) | 0 | (2,1)=1, (1,2)=1 |
| 2 | (2,1) | 1 | (1,2)=1, (3,1)=2 |
| 3 | (1,2) | 1 | (3,1)=2, (1,3)=2 |
| 4 | (3,1) | 2 | (1,3)=2, (4,1)=3, (3,2)=3 |
| 5 | (1,3) | 2 | (4,1)=3, (3,2)=3 |
| ... | ... | ... | ... |

```
   ★ (1,2), (1,3) 은 목표와 반대 방향인데도 탐색한다
     g 만 보기 때문이다
```

### 3-6. A\* 구현

**왜 필요한가** — 다익스트라 코드에서 두 줄만 바뀐다.

```cpp
struct PathNode
{
    int  g;                                    // 실제 비용
    int  h;                                    // 휴리스틱
    int  f;                                    // g + h
    bool visited;                              // 클로즈 리스트
    int  parentCol, parentRow;
};

bool PathFinder::FindPathAStar(const TileMap& map,
                               int startC, int startR,
                               int goalC,  int goalR,
                               double hWeight)
{
    Reset();
    m_visitedCount = 0;

    m_goalCol = goalC;
    m_goalRow = goalR;

    PathNode* start = At(startC, startR);
    if (!start) return false;

    start->g = 0;
    start->h = (int)(Heuristic(startC, startR, goalC, goalR) * hWeight);
    start->f = start->g + start->h;

    m_pq.Clear();
    m_pq.Push({ startC, startR, start->f });   // ★ f 기준으로 정렬

    const int dc[] = { 0, 0, -1, 1 };
    const int dr[] = { -1, 1, 0, 0 };

    while (!m_pq.IsEmpty())
    {
        PQNode cur = m_pq.Pop();

        PathNode* curNode = At(cur.col, cur.row);

        if (curNode->visited) continue;
        if (cur.cost > curNode->f) continue;   // 지연 삭제

        curNode->visited = true;
        m_visitedCount++;

        // ★ 목표 도달
        if (cur.col == goalC && cur.row == goalR)
        {
            m_pathFound = true;
            return true;
        }

        for (int i = 0; i < 4; i++)
        {
            int nc = cur.col + dc[i];
            int nr = cur.row + dr[i];

            if (nc < 0 || nc >= m_cols || nr < 0 || nr >= m_rows) continue;

            PathNode* next = At(nc, nr);
            if (next->visited) continue;

            const Tile* t = map.At(1, nc, nr);
            int moveCost = GetMoveCost(t);
            if (moveCost < 0) continue;

            int newG = curNode->g + moveCost;

            if (newG < next->g)
            {
                next->g = newG;
                next->h = (int)(Heuristic(nc, nr, goalC, goalR) * hWeight);
                next->f = next->g + next->h;   // ★

                next->parentCol = cur.col;
                next->parentRow = cur.row;

                m_pq.Push({ nc, nr, next->f });  // ★ f 로 정렬
            }
        }
    }

    m_pathFound = false;
    return false;                              // 경로 없음
}
```

```
   ★ 다익스트라에서 바뀐 것

   ① 우선순위 큐 정렬 기준:  g  →  f
   ② h 계산 추가
   ③ 목표 도달 시 조기 종료

   → 세 곳만 바뀌었다
```

### 3-7. 휴리스틱 가중치

**왜 필요한가** — 속도와 정확성의 트레이드오프.

```cpp
    f = g + h * weight;
```

| weight | 동작 | 최단 보장 | 속도 |
|:--:|---|:--:|:--:|
| 0.0 | 다익스트라 | O | 느림 |
| **1.0** | **표준 A\*** | **O** | 빠름 |
| 1.5 | 가중 A\* | X | 더 빠름 |
| 2.0 | 탐욕적 | X | 매우 빠름 |
| ∞ | Greedy Best-First | X | 가장 빠름 (경로가 나쁨) |

```
   ★ weight 를 올리면

   h 의 영향이 커진다
   → 목표 방향으로 더 집중
   → 탐색은 줄지만 최단이 아닐 수 있다

   실측 (100×100 맵)

   weight 1.0:  97 노드, 경로 16
   weight 1.5:  62 노드, 경로 16     ← 운 좋게 최단
   weight 2.0:  41 노드, 경로 17     ← 1 길어짐
   weight 5.0:  28 노드, 경로 23     ← 많이 길어짐
```

```
   ★ 언제 weight > 1 을 쓰나

   - 유닛이 아주 많아 성능이 중요할 때
   - 경로가 조금 길어도 상관없을 때
   - 실시간 게임 (SRPG는 턴제라 여유가 있다)
```

### 3-8. 경로가 없을 때

**왜 필요한가** — 목표에 도달할 수 없는 경우를 처리해야 한다.

```
   . . # . .
   . . # . .
   . S # G .        ← 완전히 막혀 있다
   . . # . .
   . . # . .
```

```cpp
    if (!FindPathAStar(...))
    {
        // 경로 없음
        // ① 아무것도 안 한다
        // ② 가장 가까운 도달 가능 지점으로 간다   ★
        // ③ 벽을 부순다
    }
```

**가장 가까운 지점 찾기**

```cpp
void PathFinder::FindClosestReachable(int goalC, int goalR,
                                      int* outC, int* outR)
{
    int bestDist = INT_MAX;
    *outC = -1; *outR = -1;

    for (int r = 0; r < m_rows; r++)
    {
        for (int c = 0; c < m_cols; c++)
        {
            const PathNode* n = At(c, r);
            if (!n->visited) continue;         // 도달 못 함

            int d = Heuristic(c, r, goalC, goalR);

            if (d < bestDist)
            {
                bestDist = d;
                *outC = c; *outR = r;
            }
        }
    }
}
```

```
   ★ A* 가 실패하면 탐색한 모든 노드가 클로즈에 있다
     그중 목표에 가장 가까운 것을 고른다

   → "최대한 접근" 동작
```

> **Day 65의 적 AI에서 이 처리가 필요하다.**

### 3-9. 성능 비교

**왜 필요한가** — 세 알고리즘의 특성을 정확히 안다.

```
   맵 100×100, 시작 (10,50), 목표 (90,50), 벽 20%
```

| 알고리즘 | 탐색 노드 | 경로 길이 | 시간 | 최단 |
|---|:--:|:--:|:--:|:--:|
| BFS | 8,412 | 96 (칸) | 0.42 ms | 비용 균일만 |
| 다익스트라 | 8,398 | 118 (비용) | 0.71 ms | O |
| **A\* (1.0)** | **1,240** | **118** | **0.13 ms** | **O** |
| A\* (2.0) | 386 | 124 | 0.05 ms | X |

```
   ★ A* 가 다익스트라보다 5배 빠르면서 결과가 같다

   벽이 많고 미로 같으면 차이가 줄어든다
   (h 가 실제 거리와 많이 다르므로)

   벽이 적고 열린 지형이면 차이가 크다
```

---

## 4. 따라 만들기

### Step 1 — `PathNode` 확장

```cpp
struct PathNode
{
    int  g, h, f;
    bool visited;
    int  parentCol, parentRow;
};

void PathFinder::Reset()
{
    for (int i = 0; i < m_cols * m_rows; i++)
    {
        m_nodes[i].g = INT_MAX;
        m_nodes[i].h = 0;
        m_nodes[i].f = INT_MAX;
        m_nodes[i].visited = false;
        m_nodes[i].parentCol = m_nodes[i].parentRow = -1;
    }
}
```

**✅ 여기까지 하면** — 자료구조가 준비된다.

### Step 2 — 휴리스틱 함수

```cpp
enum HeuristicType { HEUR_MANHATTAN, HEUR_EUCLIDEAN, HEUR_DIAGONAL, HEUR_ZERO };

int PathFinder::Heuristic(int c1, int r1, int c2, int r2) const
{
    switch (m_heurType)
    {
    case HEUR_MANHATTAN:
        return abs(c1 - c2) + abs(r1 - r2);

    case HEUR_EUCLIDEAN:
        {
            double dc = c1 - c2, dr = r1 - r2;
            return (int)sqrt(dc*dc + dr*dr);
        }

    case HEUR_DIAGONAL:
        {
            int dc = abs(c1-c2), dr = abs(r1-r2);
            int diag = min(dc, dr);
            return (int)(diag * 1.414 + (dc + dr - 2*diag));
        }

    case HEUR_ZERO:
    default:
        return 0;                              // 다익스트라와 동일
    }
}
```

**✅ 여기까지 하면** — 휴리스틱을 바꿔 실험할 수 있다.

### Step 3 — A\* 구현

3-6절의 코드를 구현한다.

**✅ 여기까지 실행하면** — 경로를 찾는다. (아직 표시 안 됨)

### Step 4 — 시작/목표 지정

```cpp
    if (in.IsKeyDown(VK_LBUTTON))
    {
        int c, r;
        ScreenToTile(mouse.x, mouse.y, &c, &r);

        if (in.IsKeyPress(VK_SHIFT))
        {
            m_goalCol = c; m_goalRow = r;
        }
        else
        {
            m_startCol = c; m_startRow = r;
        }

        RunPathfinding();
    }
```

**✅ 여기까지 실행하면** — 클릭으로 시작점, Shift+클릭으로 목표를 지정한다.

### Step 5 — 탐색 영역 시각화 ★

```cpp
void TacticsScene::RenderSearchArea(Renderer& r)
{
    for (int row = 0; row < m_map.GetRows(); row++)
    {
        for (int col = 0; col < m_map.GetCols(); col++)
        {
            const PathNode* n = m_pathFinder.GetNode(col, row);
            if (!n || !n->visited) continue;

            double sx, sy;
            TileToScreen(col, row, &sx, &sy);
            int size = (int)(m_map.GetTileW() * m_camera.GetZoom());

            // 알고리즘별 색
            COLORREF c = (m_algo == ALGO_BFS)      ? RGB( 80, 140, 200)
                       : (m_algo == ALGO_DIJKSTRA) ? RGB(200, 140,  80)
                                                   : RGB( 80, 200, 120);

            r.DrawRect((int)sx+3, (int)sy+3, size-6, size-6, c, false);
        }
    }
}
```

**✅ 여기까지 실행하면** — **탐색한 영역이 색으로 보인다.**

<!-- SHOT: Step 5 탐색 영역 -->

> ### ★ 이 시각화가 오늘의 핵심이다
>
> ```
>   다익스트라:  시작점 중심의 원처럼 퍼진다
>   A*:         시작 → 목표를 잇는 타원처럼 퍼진다
> ```

### Step 6 — 알고리즘 전환

```cpp
    if (in.IsKeyDown('1')) { m_algo = ALGO_BFS;      RunPathfinding(); }
    if (in.IsKeyDown('2')) { m_algo = ALGO_DIJKSTRA; RunPathfinding(); }
    if (in.IsKeyDown('3')) { m_algo = ALGO_ASTAR;    RunPathfinding(); }
```

**✅ 여기까지 실행하면** — 숫자 키로 세 알고리즘의 탐색 영역을 비교할 수 있다.

```
   같은 시작/목표에서

   [1] BFS         넓게 퍼짐, 파랑
   [2] 다익스트라   넓게 퍼짐, 주황
   [3] A*          목표 쪽으로 좁게, 초록   ★
```

### Step 7 — h = 0 확인

```cpp
    if (in.IsKeyDown('H'))
        m_heurType = (HeuristicType)((m_heurType + 1) % 4);
```

**`HEUR_ZERO`로 바꿔 본다.**

**✅ 여기까지 실행하면** — **A\*의 탐색 영역이 다익스트라와 똑같아진다.**

```
   ★ h = 0 이면 A* = 다익스트라

   3-2절에서 설명한 것을 눈으로 확인한다
```

### Step 8 — 가중치 조절

```cpp
    if (in.IsKeyDown(VK_ADD))      { m_hWeight += 0.25; RunPathfinding(); }
    if (in.IsKeyDown(VK_SUBTRACT)) { m_hWeight -= 0.25; RunPathfinding(); }

    if (m_hWeight < 0.0) m_hWeight = 0.0;
    if (m_hWeight > 5.0) m_hWeight = 5.0;
```

**✅ 여기까지 실행하면** — 가중치를 올릴수록 탐색이 좁아진다.

**측정표를 채운다.**

| weight | 탐색 노드 | 경로 비용 | 시간 |
|:--:|:--:|:--:|:--:|
| 0.0 | | | |
| 0.5 | | | |
| 1.0 | | | |
| 1.5 | | | |
| 2.0 | | | |
| 5.0 | | | |

```
   ★ weight 1.0 을 넘으면 경로 비용이 늘기 시작한다
```

### Step 9 — 단계별 실행

```cpp
bool PathFinder::StepAStar()
{
    if (m_pq.IsEmpty()) return false;

    PQNode cur = m_pq.Pop();
    PathNode* curNode = At(cur.col, cur.row);

    if (curNode->visited) return true;
    if (cur.cost > curNode->f) return true;

    curNode->visited = true;
    m_visitedCount++;
    m_lastConfirmed = { cur.col, cur.row };

    if (cur.col == m_goalCol && cur.row == m_goalRow)
    {
        m_pathFound = true;
        return false;                          // 완료
    }

    // 이웃 확장
    // ...

    return true;
}
```

**✅ 여기까지 실행하면** — SPACE로 한 노드씩 확정 과정을 볼 수 있다.

### Step 10 — 추적표 표시

```cpp
struct TraceEntry { int step, col, row, g, h, f, openCount; };

    TraceEntry m_trace[32];
    int        m_traceCount = 0;
```

```cpp
    // StepAStar 안에서
    if (m_traceCount < 32)
    {
        m_trace[m_traceCount++] = {
            m_traceCount, cur.col, cur.row,
            curNode->g, curNode->h, curNode->f,
            m_pq.GetSize()
        };
    }
```

```cpp
void RenderTrace(Renderer& r, int x, int y)
{
    r.DrawTextF(x, y, RGB(255,220,120),
                "단계  노드      g    h    f   오픈"); y += 18;

    int start = max(0, m_traceCount - 10);     // 최근 10개

    for (int i = start; i < m_traceCount; i++)
    {
        const TraceEntry& e = m_trace[i];

        r.DrawTextF(x, y, RGB(220,220,240),
                    "%3d  (%2d,%2d) %4d %4d %4d %5d",
                    e.step, e.col, e.row, e.g, e.h, e.f, e.openCount);
        y += 16;
    }
}
```

**✅ 여기까지 실행하면** — 3-5절의 추적표가 화면에 실시간으로 나온다.

<!-- SHOT: Step 10 추적표 -->

> ### ★ 이 표가 PRD 6절이 요구한 표현 방식이다
>
> 알고리즘의 진행을 이미지 없이 표로 보여준다.

### Step 11 — 성능 벤치마크

```cpp
void TacticsScene::Benchmark()
{
    LARGE_INTEGER freq, t0, t1;
    QueryPerformanceFrequency(&freq);

    const int ITER = 200;

    struct Result { const char* name; int nodes; int cost; double ms; };
    Result results[4];

    // BFS
    QueryPerformanceCounter(&t0);
    for (int i = 0; i < ITER; i++)
        m_pathFinder.FindPathBFS(m_map, sc, sr, gc, gr);
    QueryPerformanceCounter(&t1);
    results[0] = { "BFS", m_pathFinder.GetVisitedCount(),
                   m_pathFinder.GetPathCost(),
                   (t1.QuadPart-t0.QuadPart)*1000.0/freq.QuadPart/ITER };

    // 다익스트라, A*(1.0), A*(2.0) 도 동일하게
    // ...

    for (int i = 0; i < 4; i++)
        DebugLog("%-14s 노드 %5d  비용 %4d  %.4f ms\n",
                 results[i].name, results[i].nodes,
                 results[i].cost, results[i].ms);
}
```

**✅ 여기까지 실행하면** — 정확한 비교 데이터가 나온다.

### Step 12 — 경로 없음 처리

3-8절의 `FindClosestReachable`을 구현한다.

**완전히 막힌 맵을 만들어 테스트한다.**

**✅ 여기까지 실행하면** — 경로가 없으면 "가장 가까운 지점"이 표시된다.

```
   [Path] 경로 없음 — 가장 가까운 지점 (7, 5) 로 대체
```

### Step 13 — 비교 패널

```cpp
void TacticsScene::RenderCompareTable(Renderer& r)
{
    int x = 20, y = r.GetHeight() - 160;
    const int LH = 18;

    r.DrawRect(x - 8, y - 8, 500, 150, RGB(20, 20, 32));

    r.DrawTextF(x, y, RGB(255,220,120), "─ 비교 ─"); y += LH;

    r.DrawTextF(x, y, RGB(200,200,220),
                "알고리즘        탐색노드  경로비용   시간      최단"); y += LH;

    struct Row { const char* name; int nodes; int cost; double ms; const char* opt; COLORREF c; };

    Row rows[] = {
        { "BFS",         m_bfsNodes,  m_bfsCost,  m_bfsMs,  "균일만", RGB( 80,140,200) },
        { "다익스트라",   m_dijNodes,  m_dijCost,  m_dijMs,  "O",      RGB(200,140, 80) },
        { "A* (h x1.0)", m_a1Nodes,   m_a1Cost,   m_a1Ms,   "O",      RGB( 80,200,120) },
        { "A* (h x2.0)", m_a2Nodes,   m_a2Cost,   m_a2Ms,   "X",      RGB(200,200, 80) },
    };

    for (int i = 0; i < 4; i++)
    {
        bool cur = (i == m_algoIndex);

        r.DrawTextF(x, y, cur ? RGB(255,255,255) : rows[i].c,
                    "%s%-13s %6d   %6d   %.4fms   %s",
                    cur ? ">" : " ",
                    rows[i].name, rows[i].nodes, rows[i].cost,
                    rows[i].ms, rows[i].opt);
        y += LH;
    }

    y += 6;
    const char* heurNames[] = { "맨해튼", "유클리드", "대각선", "없음(0)" };

    r.DrawTextF(x, y, RGB(180,200,255),
                "[1][2][3] 알고리즘  [H] 휴리스틱 %s  [+/-] 가중치 %.2f",
                heurNames[m_heurType], m_hWeight);
}
```

**✅ 여기까지 실행하면** — 1절의 완성 화면이 나온다.

### Step 14 — 최단 경로 검증

```cpp
void TacticsScene::VerifyOptimality()
{
    // 무작위 시작/목표 100쌍
    int mismatch = 0;

    for (int t = 0; t < 100; t++)
    {
        int sc = rand() % m_map.GetCols();
        int sr = rand() % m_map.GetRows();
        int gc = rand() % m_map.GetCols();
        int gr = rand() % m_map.GetRows();

        bool dijOk = m_pathFinder.FindPathDijkstra(m_map, sc, sr, gc, gr);
        int  dijCost = m_pathFinder.GetPathCost();

        bool aOk = m_pathFinder.FindPathAStar(m_map, sc, sr, gc, gr, 1.0);
        int  aCost = m_pathFinder.GetPathCost();

        if (dijOk != aOk) { mismatch++; continue; }
        if (dijOk && dijCost != aCost)
        {
            DebugLog("[검증 실패] (%d,%d)→(%d,%d) 다익 %d, A* %d\n",
                     sc, sr, gc, gr, dijCost, aCost);
            mismatch++;
        }
    }

    DebugLog("[검증] 100쌍 중 불일치 %d개\n", mismatch);
}
```

**✅ 여기까지 실행하면** — `weight = 1.0`에서 불일치가 **0개**여야 한다.

```
   weight = 2.0 으로 하면 불일치가 생긴다  →  최단 보장이 깨진 것
```

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────────────────────────────────┐
   │  Pathfinding Compare                             ─    ✕ │
   ├──────────────────────────────────────────────────────────┤
   │  ░░░░                                                     │
   │  ░░S▒▒                                                    │
   │    ▒▒▒▒▒                                                  │
   │      ▒▒▒▒▒                                                │
   │        ▒▒▒G                                               │
   │                                                          │
   │  ─ 비교 ─                                                 │
   │  알고리즘        탐색노드  경로비용   시간      최단        │
   │   BFS              412       18     0.031ms   균일만      │
   │   다익스트라        398       16     0.052ms   O          │
   │  >A* (h x1.0)       97       16     0.014ms   O          │
   │   A* (h x2.0)       41       17     0.006ms   X          │
   │                                                          │
   │  [1][2][3] 알고리즘  [H] 휴리스틱 맨해튼  [+/-] 가중치 1.00│
   └──────────────────────────────────────────────────────────┘
```

- [ ] 클릭으로 시작점, Shift+클릭으로 목표를 지정한다
- [ ] 탐색한 영역이 색으로 표시된다
- [ ] **A\*의 탐색 영역이 다익스트라보다 훨씬 좁다**
- [ ] 숫자 키로 세 알고리즘을 비교할 수 있다
- [ ] `h = 0`으로 하면 A\*가 다익스트라와 같아진다
- [ ] 가중치를 올리면 탐색이 줄고 경로가 길어진다
- [ ] SPACE로 단계별 실행이 된다
- [ ] 추적표가 화면에 표시된다
- [ ] 경로가 없으면 가장 가까운 지점으로 대체된다
- [ ] `weight = 1.0`에서 A\*와 다익스트라의 경로 비용이 같다
- [ ] `weight = 2.0`에서는 다를 수 있다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 최단 경로가 아님 | `weight > 1.0` | 1.0으로 |
| 최단 경로가 아님 | h가 실제보다 큼 | 휴리스틱 재검토 |
| 다익스트라와 같음 | `h = 0` 또는 f에 h 미반영 | `f = g + h` 확인 |
| 큐 정렬이 g 기준 | Push 할 때 g를 넣음 | **f를 넣는다** |
| 목표에 도달 못 함 | 조기 종료 조건 없음 | 확정 시 목표 검사 |
| 느림 | 지연 삭제 미처리 | `cost > node->f` 검사 |
| 경로가 이상함 | h와 이동 비용 단위 불일치 | 최소 비용 곱하기 |
| 8방향인데 맨해튼 | 휴리스틱 불일치 | 대각선 거리 사용 |
| 크래시 | 목표가 벽 | 목표 유효성 검사 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **A\*** | `f = g + h`. 목표 방향을 우선 탐색 |
| g | 시작점에서 현재까지의 **실제** 비용 |
| h | 현재에서 목표까지의 **예상** 비용 |
| **휴리스틱 조건** | 실제보다 크면 안 된다 (admissible) |
| 맨해튼 거리 | 4방향에 정확한 휴리스틱 |
| **h = 0** | A\* = 다익스트라 |
| 오픈/클로즈 | 우선순위 큐 / visited 플래그 |
| 가중치 | 1.0=정확, >1.0=빠르지만 근사 |
| 경로 없음 | 가장 가까운 도달 지점으로 대체 |

### 세 알고리즘 정리

```
   ┌──────────────────────────────────────────────────────────┐
   │  BFS         큐        비용 무시        간단, 균일 비용만  │
   │       ↓                                                   │
   │  다익스트라   우선순위큐  f = g          정확, 사방 탐색    │
   │       ↓                                                   │
   │  A*          우선순위큐  f = g + h      정확 + 빠름  ★     │
   └──────────────────────────────────────────────────────────┘

   ★ 코드는 거의 같다. 정렬 기준만 다르다
```

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 64** | 찾은 경로를 따라 이동 |
| Day 65 | 적 AI의 접근 경로 |
| **Day 84** | Unity NavMesh — 내부적으로 A\* |
| Day 93 | 레이싱 AI 경로 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 8방향 A\* + 대각선 휴리스틱 | `HEUR_DIAGONAL` |
| ★★ | 양방향 A\* (시작과 목표에서 동시에) | 두 탐색이 만나면 종료 |
| ★★★ | JPS (Jump Point Search) — 격자 특화 최적화 | 대칭 경로를 건너뛴다. A\*보다 10배 빠를 수 있다 |

### 다음 시간

> 경로는 찾았다. 그런데 **어느 길로 가는지 모른다.**
>
> ```
>   비용은 16이라고 나오는데
>   실제로 어떤 칸들을 지나는지는?
> ```
>
> `parent`에 기록해 둔 정보를 역추적하면 된다.
> 그리고 유닛이 **실제로 그 길을 걸어가야** 한다.
>
> → **Day 64, 경로 추적과 이동 연출**
