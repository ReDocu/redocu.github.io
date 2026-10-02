# Day 061 · BFS — 이동 범위 칠하기

> **Week 13** · 연결 문서 `11 택틱스 게임` — Step 0~1
> 선수: Day 060 (맵 로드, 타일 속성)

> ### Week 13 — 길 찾기 3부작
> BFS → 다익스트라 → A\* 순서로 발전시킨다.
> 오늘은 그 출발점이자, **Day 57의 Flood Fill과 같은 알고리즘**이다.

---

## 1. 오늘 만드는 것

**유닛을 클릭하면 이동력만큼의 칸이 파랗게 칠해진다.**

```
   ┌──────────────────────────────────────────────────────────┐
   │  Tactics - BFS                                   ─    ✕ │
   ├──────────────────────────────────────────────────────────┤
   │   . . . # # . . . . .                                     │
   │   . 3 2 # # . . . . .        숫자 = 시작으로부터의 거리    │
   │   3 2 1 2 3 . . . . .                                     │
   │   2 1 ⓟ 1 2 3 . . . .        ⓟ = 유닛 (이동력 3)         │
   │   3 2 1 2 3 . . . . .                                     │
   │   . 3 2 3 # # . . . .        ▒ = 이동 가능 (파랑)         │
   │   . . 3 # # . . . . .        # = 벽                       │
   │   . . . . . . . . . .                                     │
   │                                                          │
   │  ─ BFS ─                                                  │
   │  이동력      3                                            │
   │  탐색 노드   24개                                          │
   │  이동 가능   19칸                                          │
   │  큐 최대     8                                             │
   │  소요 시간   0.012 ms                                      │
   │                                                          │
   │  [클릭] 유닛 선택  [SPACE] 단계 실행  [R] 초기화          │
   └──────────────────────────────────────────────────────────┘
```

**조작** — 유닛 클릭으로 범위 표시, SPACE로 한 단계씩 확장 과정 확인.

<!-- SHOT: Day 61 완성 화면 -->

---

## 2. 막히는 상황

Day 60에서 맵과 이동 비용 데이터를 만들었다. 이제 SRPG를 만든다.

```
   "이 유닛은 이동력이 3이다"

   → 3칸 안에 갈 수 있는 곳을 화면에 칠해야 한다
```

**시도 1 — 사각형으로**

```cpp
    for (int r = unitRow - 3; r <= unitRow + 3; r++)
        for (int c = unitCol - 3; c <= unitCol + 3; c++)
            Highlight(c, r);
```

```
   결과: 7×7 사각형

   ▒ ▒ ▒ ▒ ▒ ▒ ▒
   ▒ ▒ ▒ ▒ ▒ ▒ ▒
   ▒ ▒ ▒ ▒ ▒ ▒ ▒
   ▒ ▒ ▒ ⓟ ▒ ▒ ▒       ✘ 대각선 끝은 6칸 거리인데 포함됨
   ▒ ▒ ▒ ▒ ▒ ▒ ▒       ✘ 벽을 무시함
   ▒ ▒ ▒ ▒ ▒ ▒ ▒
   ▒ ▒ ▒ ▒ ▒ ▒ ▒
```

**시도 2 — 맨해튼 거리로**

```cpp
    if (abs(c - unitCol) + abs(r - unitRow) <= 3)
        Highlight(c, r);
```

```
   결과: 마름모

         ▒
       ▒ ▒ ▒
     ▒ ▒ ▒ ▒ ▒
   ▒ ▒ ▒ ⓟ ▒ ▒ ▒       ✔ 거리는 맞다
     ▒ ▒ ▒ ▒ ▒         ✘ 하지만 벽을 무시한다
       ▒ ▒ ▒
         ▒
```

**벽이 있으면?**

```
   실제 맵                    맨해튼 거리 결과

   . . # . .                  . ▒ # ▒ .        ← 벽 뒤가 칠해진다
   . . # . .                  ▒ ▒ # ▒ ▒        ← 실제로는 못 간다
   . ⓟ # . .                  ▒ ⓟ # ▒ ▒
   . . # . .                  ▒ ▒ # ▒ ▒
   . . # . .                  . ▒ # ▒ .

   ★ 벽을 돌아가야 하므로 실제 거리는 훨씬 멀다
```

```
   지금:   직선 거리로 계산

   필요:   벽을 피해 실제로 갈 수 있는 경로의 거리
```

> **맵을 따라 퍼져 나가는 방법이 필요하다.** → **BFS**

---

## 3. 개념

### 3-1. 맵을 그래프로 보기

**왜 필요한가** — 길 찾기는 그래프 탐색 문제다.

```
   타일맵                        그래프

   ┌──┬──┬──┐                   ●───●───●
   │A │B │C │                   │   │   │
   ├──┼──┼──┤        →          ●───●───●
   │D │E │F │                   │   │   │
   ├──┼──┼──┤                   ●───●───●
   │G │H │I │
   └──┴──┴──┘

   노드(node) = 타일
   간선(edge) = 인접한 타일로 이동할 수 있음
```

```
   ★ 벽이 있으면 간선이 끊긴다

   . . # . .                    ●───●   ●───●
   . . # . .                    │   │   │   │
   . ⓟ # . .          →         ●───●   ●───●
                                     ▲
                                간선 없음 (벽)
```

| 게임 용어 | 그래프 용어 |
|---|---|
| 타일 | 노드 (정점) |
| 인접 이동 | 간선 |
| 이동 비용 | 간선 가중치 |
| 이동력 | 최대 거리 |

### 3-2. BFS — 너비 우선 탐색

**왜 필요한가** — 가까운 곳부터 물결처럼 퍼진다.

```
   Breadth-First Search (너비 우선 탐색)

   "시작점에서 1칸 거리를 전부 → 2칸 거리를 전부 → 3칸..."
```

```
   확장 과정 (이동력 3, # = 벽)

   초기          1단계         2단계         3단계
   . . . . .     . . . . .     . 2 . . .     3 2 3 . .
   . . # . .     . 1 # . .     2 1 # . .     2 1 # 3 .
   . . ⓟ . .     . 1 0 1 .     2 1 0 1 2     2 1 0 1 2
   . . # . .     . 1 # . .     2 1 # . .     2 1 # 3 .
   . . . . .     . . . . .     . 2 . . .     3 2 3 . .

   ★ 벽(#)은 큐에 넣지 않는다
   ★ 벽 뒤로는 돌아서 도달한다
```

```
   ★ BFS 의 핵심 성질

   먼저 방문한 칸이 항상 더 가깝다
   → 처음 도달했을 때의 거리가 최단 거리
   → 나중에 다시 와도 갱신할 필요가 없다

   (단, 모든 간선의 비용이 같을 때만)
```

### 3-3. 큐 (Queue)

**왜 필요한가** — BFS는 큐로 구현한다. **먼저 넣은 것이 먼저 나온다.**

```
   큐 (FIFO — First In First Out)

   넣기(enqueue) →  [ A ][ B ][ C ]  → 꺼내기(dequeue)
                     ▲              ▲
                    tail           head
```

```cpp
struct Point { int col, row; };

class SimpleQueue
{
public:
    void Init(int capacity)
    {
        m_data = new Point[capacity];
        m_capacity = capacity;
        Clear();
    }

    void Clear() { m_head = m_tail = 0; }

    bool IsEmpty() const { return m_head == m_tail; }

    bool Push(Point p)
    {
        if (m_tail >= m_capacity) return false;    // 넘침
        m_data[m_tail++] = p;
        if (m_tail > m_maxUsed) m_maxUsed = m_tail;
        return true;
    }

    Point Pop()
    {
        return m_data[m_head++];
    }

    int GetMaxUsed() const { return m_maxUsed; }

private:
    Point* m_data = nullptr;
    int    m_capacity = 0;
    int    m_head = 0, m_tail = 0;
    int    m_maxUsed = 0;
};
```

```
   ★ 이 구현의 특징

   head 와 tail 이 계속 앞으로만 간다
   → 배열 크기가 "총 방문 노드 수" 이상이면 된다
   → 맵 크기(cols × rows)면 충분하다

   ★ 순환 큐(ring buffer)로 만들면 메모리를 아낄 수 있지만
     한 번 탐색에 노드를 두 번 방문하지 않으므로 불필요하다
```

> **Day 57의 Flood Fill에서 이미 같은 큐를 썼다.**

### 3-4. BFS 구현

**왜 필요한가** — 오늘의 핵심 코드.

```cpp
struct PathNode
{
    int  distance;                             // 시작점으로부터의 거리
    bool visited;
    int  parentCol, parentRow;                 // 어디서 왔는가 (Day 64)
};

class PathFinder
{
public:
    bool Init(int cols, int rows)
    {
        m_cols = cols; m_rows = rows;
        m_nodes = new PathNode[cols * rows];
        m_queue.Init(cols * rows);
        return true;
    }

    // 이동 범위 계산
    void CalcMoveRange(const TileMap& map, int startCol, int startRow, int moveRange)
    {
        Reset();

        m_visitedCount = 0;

        // 시작점
        PathNode* start = At(startCol, startRow);
        if (!start) return;

        start->distance = 0;
        start->visited  = true;

        m_queue.Clear();
        m_queue.Push({ startCol, startRow });

        // 4방향
        const int dc[] = { 0, 0, -1, 1 };
        const int dr[] = { -1, 1, 0, 0 };

        while (!m_queue.IsEmpty())
        {
            Point cur = m_queue.Pop();
            m_visitedCount++;

            PathNode* curNode = At(cur.col, cur.row);
            int curDist = curNode->distance;

            if (curDist >= moveRange) continue; // ★ 이동력 초과

            for (int i = 0; i < 4; i++)
            {
                int nc = cur.col + dc[i];
                int nr = cur.row + dr[i];

                // 맵 범위
                if (nc < 0 || nc >= m_cols || nr < 0 || nr >= m_rows) continue;

                // 이미 방문
                PathNode* next = At(nc, nr);
                if (next->visited) continue;

                // 통과 가능?
                const Tile* t = map.At(1, nc, nr);
                if (!t || (t->attribute & ATTR_WALL)) continue;

                // 방문 처리
                next->visited    = true;
                next->distance   = curDist + 1;
                next->parentCol  = cur.col;
                next->parentRow  = cur.row;

                m_queue.Push({ nc, nr });
            }
        }
    }

    bool IsReachable(int col, int row) const
    {
        const PathNode* n = At(col, row);
        return n && n->visited;
    }

    int GetDistance(int col, int row) const
    {
        const PathNode* n = At(col, row);
        return n ? n->distance : -1;
    }

private:
    void Reset()
    {
        for (int i = 0; i < m_cols * m_rows; i++)
        {
            m_nodes[i].distance = -1;
            m_nodes[i].visited  = false;
            m_nodes[i].parentCol = -1;
            m_nodes[i].parentRow = -1;
        }
    }

    PathNode*       At(int c, int r)       { return Valid(c,r) ? &m_nodes[r*m_cols+c] : nullptr; }
    const PathNode* At(int c, int r) const { return Valid(c,r) ? &m_nodes[r*m_cols+c] : nullptr; }
    bool Valid(int c, int r) const { return c>=0 && c<m_cols && r>=0 && r<m_rows; }

    PathNode*   m_nodes = nullptr;
    SimpleQueue m_queue;
    int m_cols = 0, m_rows = 0;
    int m_visitedCount = 0;
};
```

```
   ★ 순서가 중요하다

   ① 맵 범위 검사      (배열 범위 밖 접근 방지)
   ② 방문 여부 검사    (무한 루프 방지)
   ③ 통과 가능 검사    (게임 규칙)

   Day 14의 "안전 먼저, 의미 나중"과 같은 원칙
```

### 3-5. ⚠️ 방문 표시가 없으면

**왜 필요한가** — 무한 루프의 원인.

```
   방문 표시 없이 BFS 를 돌리면

   A → B → A → B → A → ...

   서로를 계속 큐에 넣는다  →  무한 루프
```

```
   ★ 방문 표시를 "큐에 넣을 때" 한다

   ✘ 큐에서 꺼낼 때 표시
      → 같은 칸이 큐에 여러 번 들어간다
      → 느려지고 메모리를 낭비한다

   ✔ 큐에 넣을 때 표시
      → 한 칸은 큐에 한 번만 들어간다
```

### 3-6. 4방향 vs 8방향

**왜 필요한가** — 대각선 이동을 허용할지 정해야 한다.

```
   4방향 (상하좌우)              8방향 (대각선 포함)

        ↑                         ↖ ↑ ↗
      ← ● →                       ← ● →
        ↓                         ↙ ↓ ↘

   맨해튼 거리                   체비쇼프 거리
```

```
   ★ 대각선의 문제

   대각선 이동 거리 = √2 ≈ 1.414
   직선 이동 거리 = 1

   같은 비용 1로 치면?
   → 대각선이 유리해져서 계단식 이동이 없어진다
   → 이동 범위가 사각형이 된다
```

```
   4방향 이동력 3              8방향 이동력 3 (비용 동일)

         ▒                     ▒ ▒ ▒ ▒ ▒ ▒ ▒
       ▒ ▒ ▒                   ▒ ▒ ▒ ▒ ▒ ▒ ▒
     ▒ ▒ ▒ ▒ ▒                 ▒ ▒ ▒ ▒ ▒ ▒ ▒
   ▒ ▒ ▒ ⓟ ▒ ▒ ▒               ▒ ▒ ▒ ⓟ ▒ ▒ ▒
     ▒ ▒ ▒ ▒ ▒                 ▒ ▒ ▒ ▒ ▒ ▒ ▒
       ▒ ▒ ▒                   ▒ ▒ ▒ ▒ ▒ ▒ ▒
         ▒                     ▒ ▒ ▒ ▒ ▒ ▒ ▒

   마름모                      정사각형
```

| | 4방향 | 8방향 |
|---|---|---|
| 이동 범위 모양 | 마름모 | 정사각형 |
| SRPG | **표준** | 드묾 |
| 대각선 비용 | — | 1 또는 1.414 |
| 벽 모서리 통과 | 불가 | 처리 필요 |

> **이 과정에서는 4방향을 쓴다.** SRPG의 표준이고 계산이 명확하다.

**8방향의 모서리 문제**

```
   . #
   # ⓟ        ← 대각선으로 나갈 수 있어야 하나?

   대부분의 게임: 양쪽이 다 벽이면 대각선 이동 불가
```

### 3-7. 다른 유닛 처리

**왜 필요한가** — 아군은 통과하되 그 자리에 멈출 수는 없다.

```cpp
enum PassResult { PASS_NO, PASS_THROUGH, PASS_STOP };

PassResult CheckUnit(int col, int row, const Unit* mover)
{
    Unit* u = FindUnitAt(col, row);

    if (!u) return PASS_STOP;                  // 빈 칸 — 통과·정지 모두 가능

    if (u->GetTeam() == mover->GetTeam())
        return PASS_THROUGH;                   // 아군 — 통과만

    return PASS_NO;                            // 적 — 통과 불가
}
```

```cpp
    // BFS 안에서
    PassResult pr = CheckUnit(nc, nr, mover);

    if (pr == PASS_NO) continue;               // 적 유닛 — 아예 못 감

    next->visited   = true;
    next->distance  = curDist + 1;
    next->canStop   = (pr == PASS_STOP);       // ★ 정지 가능 여부

    m_queue.Push({ nc, nr });
```

```
   ★ 이동 범위 표시와 실제 이동 가능 칸이 다르다

   탐색 범위:  아군 위도 지나갈 수 있다
   정지 가능:  빈 칸만

   → 화면에는 "정지 가능"만 칠한다
```

### 3-8. 성능

**왜 필요한가** — 맵이 커지면 느려질 수 있다.

```
   BFS 의 복잡도

   O(V + E)     V = 노드 수, E = 간선 수

   4방향 격자에서:
     V = cols × rows
     E ≈ 4V

   → O(V) = O(cols × rows)
```

```
   맵 크기별 최악 시간 (이동 범위 제한 없을 때)

     20 × 15  =    300 노드   약 0.01 ms
    100 × 100 = 10,000 노드   약 0.3 ms
    500 × 500 = 250,000 노드  약 8 ms       ← 프레임 예산의 절반
   1000 × 1000 = 1,000,000    약 35 ms      ← 너무 느리다
```

```
   ★ 이동력 제한이 있으면 훨씬 빠르다

   이동력 3 → 최대 25칸 정도만 탐색
   → 맵 크기와 무관하게 빠르다

   ★ 문제는 "특정 지점까지의 경로"를 찾을 때다
     Day 63의 A* 가 이 문제를 푼다
```

**최적화 — 매 프레임 계산하지 않기**

```cpp
    // ✘ 매 프레임 계산
    void Update(double dt)
    {
        m_pathFinder.CalcMoveRange(...);       // 60회/초
    }

    // ✔ 필요할 때만
    void OnUnitSelected(Unit* u)
    {
        m_pathFinder.CalcMoveRange(...);       // 클릭할 때만
        m_rangeDirty = false;
    }
```

---

## 4. 따라 만들기

새 프로젝트 `11_tactics`를 만들고 `Engine/`, `Common/`을 복사해 온다.

### Step 1 — 맵 로드와 유닛

```cpp
class Unit : public GameObject
{
public:
    bool Init(Core* core) override;

    int GetCol() const { return m_col; }
    int GetRow() const { return m_row; }
    void SetTile(int c, int r) { m_col = c; m_row = r; UpdateWorldPos(); }

    int GetMoveRange() const { return m_moveRange; }
    int GetTeam() const { return m_team; }

private:
    int m_col = 0, m_row = 0;
    int m_moveRange = 3;
    int m_team = 0;                            // 0=아군, 1=적
};
```

```cpp
    // TacticsScene::Init
    LoadMapFile("assets/maps/tactics_test1.map", m_map);

    SpawnUnit(3, 4, 0, 3);                     // 아군, 이동력 3
    SpawnUnit(5, 6, 0, 4);
    SpawnUnit(12, 8, 1, 3);                    // 적
```

**✅ 여기까지 실행하면** — 맵 위에 유닛이 놓인다.

### Step 2 — 유닛 선택

```cpp
    if (in.IsKeyDown(VK_LBUTTON))
    {
        int col, row;
        ScreenToTile(mouse.x, mouse.y, &col, &row);

        Unit* u = FindUnitAt(col, row);

        if (u && u->GetTeam() == 0)
        {
            m_selectedUnit = u;
            CalcMoveRange();                   // ★ 여기서만 계산
        }
        else
        {
            m_selectedUnit = nullptr;
        }
    }
```

**✅ 여기까지 실행하면** — 유닛을 클릭하면 선택된다.

### Step 3 — 큐 구현

3-3절의 `SimpleQueue`를 구현한다.

**✅ 여기까지 하면** — 자료구조가 준비된다.

### Step 4 — BFS 구현

3-4절의 `CalcMoveRange`를 구현한다.

```cpp
void TacticsScene::CalcMoveRange()
{
    if (!m_selectedUnit) return;

    LARGE_INTEGER t0, t1, freq;
    QueryPerformanceFrequency(&freq);
    QueryPerformanceCounter(&t0);

    m_pathFinder.CalcMoveRange(m_map,
                               m_selectedUnit->GetCol(),
                               m_selectedUnit->GetRow(),
                               m_selectedUnit->GetMoveRange());

    QueryPerformanceCounter(&t1);
    m_lastCalcMs = (t1.QuadPart - t0.QuadPart) * 1000.0 / freq.QuadPart;
}
```

**✅ 여기까지 하면** — 탐색이 실행된다. (아직 화면에 안 보인다)

### Step 5 — 범위 표시

```cpp
void TacticsScene::RenderMoveRange(Renderer& r)
{
    if (!m_selectedUnit) return;

    for (int row = 0; row < m_map.GetRows(); row++)
    {
        for (int col = 0; col < m_map.GetCols(); col++)
        {
            if (!m_pathFinder.IsReachable(col, row)) continue;

            double sx, sy;
            TileToScreen(col, row, &sx, &sy);

            int size = (int)(m_map.GetTileW() * m_camera.GetZoom());

            // 반투명 파란 사각형 (테두리만으로 대체 가능)
            r.DrawRect((int)sx + 2, (int)sy + 2, size - 4, size - 4,
                       RGB(60, 120, 220), false);
            r.DrawRect((int)sx + 3, (int)sy + 3, size - 6, size - 6,
                       RGB(60, 120, 220), false);
        }
    }
}
```

**✅ 여기까지 실행하면** — **유닛 주변이 파랗게 칠해진다!**

<!-- SHOT: Step 5 이동 범위 -->

> **벽 뒤로는 안 칠해지고, 벽을 돌아간 곳은 칠해지는지 확인한다.**

### Step 6 — 거리 숫자 표시

```cpp
            int dist = m_pathFinder.GetDistance(col, row);

            r.DrawTextF((int)sx + size/2 - 5, (int)sy + size/2 - 7,
                        RGB(200, 230, 255), "%d", dist);
```

**✅ 여기까지 실행하면** — 각 칸의 거리가 숫자로 보인다.

```
   . . . # # . .
   . 3 2 # # . .
   3 2 1 2 3 . .
   2 1 ⓟ 1 2 3 .
   3 2 1 2 3 . .
```

> **벽을 돌아간 칸의 거리가 직선 거리보다 큰지 확인한다.**

### Step 7 — 사각형/맨해튼과 비교

```cpp
enum RangeMode { RANGE_SQUARE, RANGE_MANHATTAN, RANGE_BFS };

    if (in.IsKeyDown('M'))
        m_rangeMode = (RangeMode)((m_rangeMode + 1) % 3);
```

```cpp
    bool reachable = false;

    switch (m_rangeMode)
    {
    case RANGE_SQUARE:
        reachable = (abs(col - uc) <= mr && abs(row - ur) <= mr);
        break;

    case RANGE_MANHATTAN:
        reachable = (abs(col - uc) + abs(row - ur) <= mr);
        break;

    case RANGE_BFS:
        reachable = m_pathFinder.IsReachable(col, row);
        break;
    }
```

**✅ 여기까지 실행하면** — `M`으로 세 방식을 비교할 수 있다.

```
   벽이 있는 곳에서 차이가 명확하다

   SQUARE     벽 뒤도 칠해진다
   MANHATTAN  벽 뒤도 칠해진다
   BFS        벽 뒤는 안 칠해진다   ✔
```

### Step 8 — 단계별 실행 (시각화)

```cpp
class PathFinder
{
public:
    // 한 단계만 실행
    bool StepBFS();

    void BeginStepMode(const TileMap& map, int sc, int sr, int range);

private:
    bool m_stepMode = false;
    int  m_currentStep = 0;
};
```

```cpp
bool PathFinder::StepBFS()
{
    if (m_queue.IsEmpty()) return false;       // 완료

    Point cur = m_queue.Pop();
    m_visitedCount++;

    PathNode* curNode = At(cur.col, cur.row);
    if (curNode->distance >= m_maxRange) return true;

    for (int i = 0; i < 4; i++)
    {
        // ... 확장 ...
    }

    m_currentStep++;
    return true;
}
```

```cpp
    if (in.IsKeyDown(VK_SPACE))
    {
        if (!m_stepping)
        {
            m_pathFinder.BeginStepMode(m_map, uc, ur, mr);
            m_stepping = true;
        }
        else
        {
            if (!m_pathFinder.StepBFS())
            {
                m_stepping = false;
                DebugLog("[BFS] 완료\n");
            }
        }
    }
```

**✅ 여기까지 실행하면** — SPACE를 누를 때마다 **한 칸씩 퍼져 나가는 것이 보인다.**

<!-- SHOT: Step 8 단계별 확장 -->

> ### ★ 이 시각화가 오늘의 핵심 학습 도구다
>
> BFS가 "물결처럼 퍼진다"는 것을 눈으로 확인한다.

### Step 9 — 큐 상태 시각화

```cpp
void RenderQueueState(Renderer& r, const PathFinder& pf)
{
    // 큐에 있는 칸을 노란색으로
    for (int i = pf.GetQueueHead(); i < pf.GetQueueTail(); i++)
    {
        Point p = pf.GetQueueAt(i);

        double sx, sy;
        TileToScreen(p.col, p.row, &sx, &sy);

        int size = (int)(m_map.GetTileW() * m_camera.GetZoom());

        r.DrawRect((int)sx + 6, (int)sy + 6, size - 12, size - 12,
                   RGB(255, 220, 60), false);
    }
}
```

**✅ 여기까지 실행하면** — 큐에 대기 중인 칸이 노란색으로 보인다.

```
   ★ 큐의 내용이 "다음에 확장할 경계선"이라는 것이 보인다
```

### Step 10 — 방문 표시 없이 해 보기

```cpp
                // if (next->visited) continue;       // ← 주석
```

**✅ 여기까지 실행하면** — **프로그램이 멈춘다.** (무한 루프)

```
   큐 크기 초과 로그가 쏟아진다
```

> 확인 후 되살린다. **3-5절의 문제다.**
> **큐 크기 초과 검사가 있어야 멈추지 않고 로그만 남는다.**

### Step 11 — 8방향 모드

```cpp
    const int dc8[] = { 0, 0, -1, 1, -1, 1, -1, 1 };
    const int dr8[] = { -1, 1, 0, 0, -1, -1, 1, 1 };

    int dirCount = m_use8Dir ? 8 : 4;

    for (int i = 0; i < dirCount; i++)
    {
        int nc = cur.col + (m_use8Dir ? dc8[i] : dc4[i]);
        // ...
    }
```

```cpp
    if (in.IsKeyDown('8')) m_use8Dir = !m_use8Dir;
```

**✅ 여기까지 실행하면** — 4방향은 마름모, 8방향은 사각형이 된다.

> **3-6절에서 설명한 차이를 눈으로 확인한다.**

### Step 12 — 다른 유닛 처리

3-7절의 `CheckUnit`을 구현한다.

```cpp
    // 표시할 때 정지 가능한 칸만
    if (!m_pathFinder.CanStopAt(col, row)) continue;
```

**✅ 여기까지 실행하면** — 아군 위는 지나가지만 그 칸은 안 칠해진다.
적 유닛은 통과할 수 없다.

### Step 13 — 정보 패널

```cpp
void TacticsScene::RenderBfsInfo(Renderer& r)
{
    int x = 20, y = r.GetHeight() - 160;
    const int LH = 18;

    r.DrawRect(x - 8, y - 8, 340, 150, RGB(20, 20, 32));

    r.DrawTextF(x, y, RGB(255,220,120), "─ BFS ─"); y += LH;

    if (m_selectedUnit)
    {
        r.DrawTextF(x, y, RGB(255,255,255),
                    "선택 유닛   (%d, %d)  이동력 %d",
                    m_selectedUnit->GetCol(), m_selectedUnit->GetRow(),
                    m_selectedUnit->GetMoveRange()); y += LH;
    }
    else
    {
        r.DrawTextF(x, y, RGB(160,160,180), "유닛을 클릭하세요"); y += LH;
    }

    r.DrawTextF(x, y, RGB(255,255,255),
                "탐색 노드   %d개", m_pathFinder.GetVisitedCount()); y += LH;

    r.DrawTextF(x, y, RGB(255,255,255),
                "이동 가능   %d칸", CountReachable()); y += LH;

    r.DrawTextF(x, y, RGB(200,200,220),
                "큐 최대     %d", m_pathFinder.GetQueueMaxUsed()); y += LH;

    r.DrawTextF(x, y, RGB(200,255,200),
                "소요 시간   %.3f ms", m_lastCalcMs); y += LH;

    const char* modeNames[] = { "사각형", "맨해튼", "BFS" };
    r.DrawTextF(x, y, RGB(180,200,255),
                "[M] 방식 %s   [8] %d방향   [SPACE] 단계",
                modeNames[m_rangeMode], m_use8Dir ? 8 : 4);
}
```

**✅ 여기까지 실행하면** — 1절의 완성 화면이 나온다.

### Step 14 — 큰 맵 성능 측정

```cpp
    // 이동력 제한 없이 전체 탐색
    if (in.IsKeyDown('F'))
    {
        m_pathFinder.CalcMoveRange(m_map, uc, ur, 9999);
    }
```

**맵 크기별로 측정한다.**

| 맵 크기 | 노드 수 | 시간 |
|:--:|:--:|:--:|
| 20×15 | | ms |
| 100×100 | | ms |
| 300×300 | | ms |

**✅ 여기까지 하면** — BFS의 성능 특성을 안다.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────────────────────────────────┐
   │  Tactics - BFS                                   ─    ✕ │
   ├──────────────────────────────────────────────────────────┤
   │   . . . # # . . . . .                                     │
   │   . 3 2 # # . . . . .                                     │
   │   3 2 1 2 3 . . . . .                                     │
   │   2 1 ⓟ 1 2 3 . . . .                                     │
   │   3 2 1 2 3 . . . . .                                     │
   │   . 3 2 3 # # . . . .                                     │
   │   . . 3 # # . . . . .                                     │
   │                                                          │
   │  ─ BFS ─                                                  │
   │  선택 유닛  (2, 3)  이동력 3                               │
   │  탐색 노드  24개                                           │
   │  이동 가능  19칸                                           │
   │  큐 최대    8                                              │
   │  소요 시간  0.012 ms                                       │
   │  [M] 방식 BFS   [8] 4방향   [SPACE] 단계                   │
   └──────────────────────────────────────────────────────────┘
```

- [ ] 유닛을 클릭하면 이동 범위가 파랗게 칠해진다
- [ ] 벽 뒤로는 안 칠해진다
- [ ] 벽을 돌아간 칸은 거리가 더 크다
- [ ] 각 칸의 거리가 숫자로 표시된다
- [ ] `M`으로 사각형/맨해튼/BFS를 비교할 수 있다
- [ ] SPACE로 한 단계씩 확장 과정이 보인다
- [ ] 큐에 대기 중인 칸이 노란색으로 표시된다
- [ ] 방문 표시를 빼면 무한 루프가 되는 것을 확인했다
- [ ] `8`로 4방향/8방향이 전환되고 모양이 다르다
- [ ] 아군은 통과하되 그 칸에 멈출 수 없다
- [ ] 적 유닛은 통과할 수 없다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 무한 루프 | **방문 표시 없음** | 큐에 넣을 때 표시 |
| 큐 넘침 | 방문 표시를 꺼낼 때 함 | 넣을 때로 변경 |
| 벽을 통과 | 통과 검사 누락 | `ATTR_WALL` 확인 |
| 크래시 | 맵 범위 검사 순서 | 범위 검사를 **먼저** |
| 거리가 이상함 | `Reset` 누락 | 매번 초기화 |
| 범위가 사각형 | 맨해튼/사각형 모드 | BFS 모드 확인 |
| 매 프레임 느림 | 계속 재계산 | 선택 시에만 |
| 대각선이 이상함 | 8방향에서 모서리 처리 | 양쪽 벽 검사 추가 |
| 시작점이 포함 안 됨 | 시작점 방문 표시 누락 | `start->visited = true` |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| 맵 = 그래프 | 타일=노드, 인접 이동=간선 |
| **BFS** | 가까운 곳부터 물결처럼 퍼진다 |
| 큐 (FIFO) | 먼저 넣은 것이 먼저 나온다 |
| **방문 표시** | 큐에 **넣을 때** 표시. 없으면 무한 루프 |
| 검사 순서 | 맵 범위 → 방문 → 통과 가능 |
| 4방향 vs 8방향 | 마름모 vs 사각형. SRPG는 4방향 표준 |
| 유닛 처리 | 통과 가능 ≠ 정지 가능 |
| 성능 | O(V). 이동력 제한이 있으면 빠르다 |

### 이미 만난 같은 알고리즘

| Day | 상황 |
|:--:|---|
| **Day 57** | 맵툴의 Flood Fill (채우기 도구) |
| **Day 61** | 이동 범위 |

```
   ★ 완전히 같은 알고리즘이다

   Flood Fill:  "같은 색 영역을 전부 찾기"
   BFS 이동범위: "N칸 안의 모든 칸 찾기"
```

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 62** | 다익스트라 — BFS + 비용 |
| **Day 63** | A\* — 다익스트라 + 휴리스틱 |
| **Day 64** | `parent`로 경로 역추적 |
| Day 84 | Unity NavMesh — 같은 원리를 엔진이 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 공격 범위 표시 (이동 후 사거리) | 이동 범위의 각 칸에서 다시 BFS |
| ★★ | 위협 범위 (적 전체의 이동+공격 범위) | 적마다 계산 후 합집합 |
| ★★★ | 순환 큐로 메모리 절약 | `head`/`tail`을 `% capacity` |

### 다음 시간

> BFS는 **모든 이동 비용이 1일 때만** 정확하다.
>
> ```
>   Day 60에서 만든 이동 비용 데이터

>     평지 1, 숲 2, 늪 3

>   BFS 는 이걸 무시한다
>   → 숲 3칸도 평지 3칸과 같다고 계산한다   ✘
> ```
>
> **비용이 다른 그래프의 최단 경로**를 찾아야 한다.
>
> → **Day 62, 다익스트라 알고리즘**
