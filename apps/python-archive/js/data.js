(function () {
  const ALGORITHM_CATEGORIES = [
    "기초문법", "조건문", "반복문", "배열", "문자열", "함수",
    "정렬", "탐색", "완전탐색", "재귀",
    "스택", "큐", "덱", "해시", "집합",
    "그리디", "이분탐색",
    "BFS", "DFS", "그래프",
    "DP", "구현", "수학", "시뮬레이션"
  ];

  const DIFFICULTIES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Unrated"];
  const STATUSES = ["미풀이", "풀이중", "정답", "오답", "복습필요"];
  const RESULTS = ["Accepted", "Wrong Answer", "TLE", "Runtime Error", "Not Submitted"];

  const STORAGE_KEYS = {
    problems: "algoArchive.localProblems",
    deletedProblems: "algoArchive.deletedProblems",
    contests: "algoArchive.localContests",
    deletedContests: "algoArchive.deletedContests",
    theme: "algoArchive.theme"
  };

  const SEED_DATA = {
    problems: [
      {
        id: "py_algo_001",
        language: "python",
        title: "두 수의 합",
        summary: "두 정수를 입력받아 합을 출력하는 가장 기본적인 입출력 문제",
        description: "공백으로 구분된 두 정수 A와 B를 입력받고, 두 수의 합을 출력한다. 파이썬의 표준 입력 처리와 정수 변환을 확인하기 좋은 문제다.",
        category: "기초문법",
        algorithm: ["입출력", "기초문법"],
        difficulty: "Bronze",
        input: "첫째 줄에 정수 A와 B가 공백으로 구분되어 주어진다.",
        output: "A+B를 출력한다.",
        exampleInput: "3 5",
        exampleOutput: "8",
        idea: "input().split()으로 문자열을 나눈 뒤 map(int, ...)로 정수로 바꾼다.",
        code: "a, b = map(int, input().split())\nprint(a + b)",
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)",
        learned: "입력은 문자열로 들어오므로 계산 전에 정수 변환이 필요하다.",
        tags: ["Python", "입출력"],
        createdAt: "2026-04-28",
        updatedAt: "2026-04-28"
      },
      {
        id: "py_algo_002",
        language: "python",
        title: "문자열 뒤집기",
        summary: "문자열을 입력받아 거꾸로 출력한다.",
        description: "주어진 문자열 S를 뒤에서부터 앞으로 읽은 결과를 출력한다. 슬라이싱과 반복문 풀이를 모두 연습할 수 있다.",
        category: "문자열",
        algorithm: ["문자열", "배열"],
        difficulty: "Bronze",
        input: "첫째 줄에 문자열 S가 주어진다.",
        output: "S를 뒤집은 문자열을 출력한다.",
        exampleInput: "python",
        exampleOutput: "nohtyp",
        idea: "파이썬 슬라이싱 s[::-1]을 사용하면 간단하게 뒤집을 수 있다.",
        code: "s = input().strip()\nprint(s[::-1])",
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
        learned: "슬라이싱은 새 문자열을 만들기 때문에 공간복잡도도 문자열 길이에 비례한다.",
        tags: ["Python", "슬라이싱"],
        createdAt: "2026-04-28",
        updatedAt: "2026-04-28"
      },
      {
        id: "py_algo_003",
        language: "python",
        title: "회의실 배정",
        summary: "가장 많은 회의를 배정하기 위한 그리디 정렬 문제",
        description: "각 회의의 시작 시간과 종료 시간이 주어진다. 한 회의가 끝난 뒤 바로 다음 회의를 시작할 수 있을 때, 사용할 수 있는 회의의 최대 개수를 구한다.",
        category: "그리디",
        algorithm: ["그리디", "정렬"],
        difficulty: "Silver",
        input: "첫째 줄에 회의 수 N이 주어진다. 다음 N개의 줄에 시작 시간과 종료 시간이 주어진다.",
        output: "배정할 수 있는 회의의 최대 개수를 출력한다.",
        exampleInput: "4\n1 3\n2 4\n3 5\n0 6",
        exampleOutput: "2",
        idea: "끝나는 시간이 빠른 회의부터 선택한다. 종료 시간이 같으면 시작 시간이 빠른 순서로 정렬한다.",
        code: "import sys\n\ninput = sys.stdin.readline\nn = int(input())\nmeetings = [tuple(map(int, input().split())) for _ in range(n)]\nmeetings.sort(key=lambda x: (x[1], x[0]))\n\nanswer = 0\nend_time = 0\nfor start, end in meetings:\n    if start >= end_time:\n        answer += 1\n        end_time = end\n\nprint(answer)",
        timeComplexity: "O(N log N)",
        spaceComplexity: "O(N)",
        learned: "그리디 선택 기준은 '현재 가장 빨리 끝나는 선택'처럼 이후 선택지를 최대한 남기는 방향으로 잡는다.",
        tags: ["Baekjoon", "Greedy"],
        createdAt: "2026-04-28",
        updatedAt: "2026-04-28"
      },
      {
        id: "py_algo_004",
        language: "python",
        title: "미로 탐색",
        summary: "격자 미로에서 최단 거리를 찾는 BFS 문제",
        description: "N x M 크기의 미로에서 1은 이동 가능한 칸, 0은 벽이다. 왼쪽 위에서 오른쪽 아래까지 이동하는 최단 칸 수를 구한다.",
        category: "BFS",
        algorithm: ["BFS", "그래프", "탐색"],
        difficulty: "Silver",
        input: "첫째 줄에 N과 M이 주어진다. 다음 N개의 줄에 미로 정보가 주어진다.",
        output: "목적지까지 이동하는 최소 칸 수를 출력한다.",
        exampleInput: "4 6\n101111\n101010\n101011\n111011",
        exampleOutput: "15",
        idea: "간선 가중치가 모두 1이므로 BFS로 처음 도착한 거리가 최단 거리다.",
        code: "from collections import deque\nimport sys\n\ninput = sys.stdin.readline\nn, m = map(int, input().split())\ngrid = [list(map(int, input().strip())) for _ in range(n)]\n\ndx = [1, -1, 0, 0]\ndy = [0, 0, 1, -1]\nqueue = deque([(0, 0)])\n\nwhile queue:\n    x, y = queue.popleft()\n    for i in range(4):\n        nx = x + dx[i]\n        ny = y + dy[i]\n        if 0 <= nx < n and 0 <= ny < m and grid[nx][ny] == 1:\n            grid[nx][ny] = grid[x][y] + 1\n            queue.append((nx, ny))\n\nprint(grid[n - 1][m - 1])",
        timeComplexity: "O(NM)",
        spaceComplexity: "O(NM)",
        learned: "방문 배열을 따로 두지 않고 거리 값을 격자에 직접 저장할 수 있다.",
        tags: ["Baekjoon", "BFS", "격자"],
        createdAt: "2026-04-28",
        updatedAt: "2026-04-28"
      },
      {
        id: "py_algo_005",
        language: "python",
        title: "1로 만들기",
        summary: "정수를 1로 만드는 최소 연산 횟수를 구하는 DP 문제",
        description: "정수 X에 대해 3으로 나누어 떨어지면 3으로 나누고, 2로 나누어 떨어지면 2로 나누고, 1을 뺄 수 있다. X를 1로 만들기 위한 최소 연산 횟수를 구한다.",
        category: "DP",
        algorithm: ["DP", "수학"],
        difficulty: "Silver",
        input: "첫째 줄에 정수 X가 주어진다.",
        output: "X를 1로 만들기 위한 연산 횟수의 최솟값을 출력한다.",
        exampleInput: "10",
        exampleOutput: "3",
        idea: "dp[i]를 i를 1로 만드는 최소 횟수로 정의하고 작은 수부터 채운다.",
        code: "x = int(input())\ndp = [0] * (x + 1)\n\nfor i in range(2, x + 1):\n    dp[i] = dp[i - 1] + 1\n    if i % 2 == 0:\n        dp[i] = min(dp[i], dp[i // 2] + 1)\n    if i % 3 == 0:\n        dp[i] = min(dp[i], dp[i // 3] + 1)\n\nprint(dp[x])",
        timeComplexity: "O(X)",
        spaceComplexity: "O(X)",
        learned: "최소 횟수 문제는 상태 정의와 이전 상태 후보를 명확히 적으면 점화식이 자연스럽게 나온다.",
        tags: ["Baekjoon", "DP"],
        createdAt: "2026-04-28",
        updatedAt: "2026-04-28"
      },
      {
        id: "py_algo_006",
        language: "python",
        title: "수 찾기",
        summary: "정렬된 배열에서 특정 수가 존재하는지 확인한다.",
        description: "N개의 정수와 M개의 질의가 주어진다. 각 질의 숫자가 N개의 정수 안에 존재하면 1, 아니면 0을 출력한다.",
        category: "이분탐색",
        algorithm: ["이분탐색", "정렬", "탐색"],
        difficulty: "Silver",
        input: "첫째 줄에 N, 둘째 줄에 N개의 정수, 셋째 줄에 M, 넷째 줄에 M개의 질의 정수가 주어진다.",
        output: "각 질의마다 존재 여부를 한 줄에 하나씩 출력한다.",
        exampleInput: "5\n4 1 5 2 3\n5\n1 3 7 9 5",
        exampleOutput: "1\n1\n0\n0\n1",
        idea: "배열을 정렬한 뒤 각 질의에 대해 이분탐색을 수행한다. 파이썬에서는 set으로도 풀 수 있지만 이분탐색 연습용으로 작성한다.",
        code: "import sys\n\ninput = sys.stdin.readline\nn = int(input())\narr = sorted(map(int, input().split()))\nm = int(input())\nqueries = list(map(int, input().split()))\n\ndef exists(target):\n    left, right = 0, n - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return 1\n        if arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return 0\n\nprint(\"\\n\".join(str(exists(q)) for q in queries))",
        timeComplexity: "O((N + M) log N)",
        spaceComplexity: "O(N)",
        learned: "탐색 범위를 절반씩 줄이는 left/right 갱신 조건을 실수하지 않는 것이 중요하다.",
        tags: ["Baekjoon", "Binary Search"],
        createdAt: "2026-04-28",
        updatedAt: "2026-04-28"
      }
    ],
    contests: [
      {
        id: "contest_001",
        title: "Python Contest",
        platform: "Baekjoon",
        date: "2026-04-28",
        description: "입출력, 문자열, 그리디를 빠르게 복습하기 위해 구성한 개인 연습 대회.",
        tags: ["구현", "그리디"],
        problems: [
          {
            id: "c1_p1",
            number: "A",
            title: "빠른 합계",
            difficulty: "Bronze",
            category: "기초문법",
            algorithm: ["입출력"],
            status: "정답",
            result: "Accepted",
            solveTime: "5분",
            summary: "여러 줄의 정수를 빠르게 합산한다.",
            description: "입력량이 많은 상황에서 sys.stdin.readline을 사용해 합계를 구한다.",
            code: "import sys\n\ninput = sys.stdin.readline\nn = int(input())\ntotal = 0\nfor _ in range(n):\n    total += int(input())\nprint(total)",
            failReason: "",
            improvement: "입력량이 많을 때 input보다 sys.stdin.readline을 우선 떠올리기.",
            reviewNeeded: false,
            memo: "A번은 워밍업용으로 좋았다."
          },
          {
            id: "c1_p2",
            number: "B",
            title: "단어 정렬",
            difficulty: "Silver",
            category: "정렬",
            algorithm: ["정렬", "문자열"],
            status: "정답",
            result: "Accepted",
            solveTime: "18분",
            summary: "중복 단어를 제거하고 길이, 사전순으로 정렬한다.",
            description: "단어 집합을 만든 뒤 key=(길이, 문자열) 기준으로 정렬한다.",
            code: "import sys\n\ninput = sys.stdin.readline\nwords = {input().strip() for _ in range(int(input()))}\nfor word in sorted(words, key=lambda x: (len(x), x)):\n    print(word)",
            failReason: "",
            improvement: "set으로 중복 제거 후 정렬하면 로직이 단순하다.",
            reviewNeeded: false,
            memo: ""
          },
          {
            id: "c1_p3",
            number: "C",
            title: "강의실 선택",
            difficulty: "Silver",
            category: "그리디",
            algorithm: ["그리디", "정렬"],
            status: "오답",
            result: "Wrong Answer",
            solveTime: "35분",
            summary: "겹치지 않는 강의를 최대한 많이 선택한다.",
            description: "종료 시간이 빠른 순서로 선택해야 하는데 시작 시간 기준으로 먼저 정렬해 반례가 생겼다.",
            code: "n = int(input())\nclasses = [tuple(map(int, input().split())) for _ in range(n)]\nclasses.sort()\n\ncount = 0\nend = 0\nfor start, finish in classes:\n    if start >= end:\n        count += 1\n        end = finish\nprint(count)",
            failReason: "정렬 기준을 시작 시간으로 잡아 최적 선택이 깨졌다.",
            improvement: "종료 시간, 시작 시간 순서로 정렬해야 한다.",
            reviewNeeded: true,
            memo: "회의실 배정 유형 다시 풀기"
          },
          {
            id: "c1_p4",
            number: "D",
            title: "격자 탈출",
            difficulty: "Gold",
            category: "BFS",
            algorithm: ["BFS", "그래프"],
            status: "풀이중",
            result: "TLE",
            solveTime: "60분+",
            summary: "격자에서 상태를 포함한 최단 거리를 구한다.",
            description: "위치뿐 아니라 열쇠 보유 상태를 함께 방문 상태로 관리해야 한다.",
            code: "",
            failReason: "방문 상태를 좌표만으로 관리해서 같은 칸을 다른 상태로 재방문하지 못했다.",
            improvement: "visited[x][y][state] 구조로 바꾸기.",
            reviewNeeded: true,
            memo: "비트마스크 BFS 복습"
          }
        ]
      },
      {
        id: "contest_002",
        title: "주말 구현 챌린지",
        platform: "Programmers",
        date: "2026-04-20",
        description: "구현과 시뮬레이션 감각을 유지하기 위한 짧은 주말 셋.",
        tags: ["구현", "시뮬레이션"],
        problems: [
          {
            id: "c2_p1",
            number: "1",
            title: "문자열 압축",
            difficulty: "Silver",
            category: "문자열",
            algorithm: ["문자열", "완전탐색"],
            status: "정답",
            result: "Accepted",
            solveTime: "28분",
            summary: "가능한 단위 길이를 모두 시험해 가장 짧은 압축 길이를 찾는다.",
            description: "문자열 길이가 크지 않아 단위 길이별 시뮬레이션이 가능하다.",
            code: "def solution(s):\n    answer = len(s)\n    for size in range(1, len(s) // 2 + 1):\n        compressed = ''\n        prev = s[:size]\n        count = 1\n        for i in range(size, len(s), size):\n            cur = s[i:i + size]\n            if cur == prev:\n                count += 1\n            else:\n                compressed += (str(count) if count > 1 else '') + prev\n                prev = cur\n                count = 1\n        compressed += (str(count) if count > 1 else '') + prev\n        answer = min(answer, len(compressed))\n    return answer",
            failReason: "",
            improvement: "마지막 묶음 처리 코드를 루프 밖에 꼭 둔다.",
            reviewNeeded: false,
            memo: ""
          },
          {
            id: "c2_p2",
            number: "2",
            title: "로봇 청소기",
            difficulty: "Gold",
            category: "시뮬레이션",
            algorithm: ["시뮬레이션", "구현"],
            status: "복습필요",
            result: "Runtime Error",
            solveTime: "50분",
            summary: "방향 전환과 후진 조건을 정확히 구현한다.",
            description: "방향 인덱스와 좌표 갱신 조건이 많아 작은 함수로 분리하면 실수를 줄일 수 있다.",
            code: "",
            failReason: "후진 좌표 계산에서 행과 열을 반대로 더했다.",
            improvement: "방향 배열과 테스트 케이스를 먼저 적고 구현하기.",
            reviewNeeded: true,
            memo: "좌표계 검증 루틴 만들기"
          },
          {
            id: "c2_p3",
            number: "3",
            title: "할 일 카드 정렬",
            difficulty: "Bronze",
            category: "정렬",
            algorithm: ["정렬"],
            status: "미풀이",
            result: "Not Submitted",
            solveTime: "",
            summary: "마감일과 우선순위 기준으로 카드를 정렬한다.",
            description: "복합 키 정렬 연습용 문제.",
            code: "",
            failReason: "",
            improvement: "",
            reviewNeeded: false,
            memo: "다음 복습 때 풀기"
          }
        ]
      },
      {
        id: "contest_003",
        title: "그래프 집중 연습",
        platform: "AtCoder",
        date: "2026-04-14",
        description: "BFS, DFS, 연결 요소, 최단거리 패턴을 묶어서 복습한 셋.",
        tags: ["BFS", "DFS", "그래프"],
        problems: [
          {
            id: "c3_p1",
            number: "A",
            title: "연결 확인",
            difficulty: "Bronze",
            category: "그래프",
            algorithm: ["DFS", "그래프"],
            status: "정답",
            result: "Accepted",
            solveTime: "12분",
            summary: "두 정점이 같은 연결 요소인지 확인한다.",
            description: "인접 리스트를 만들고 시작점에서 DFS를 수행한다.",
            code: "import sys\nsys.setrecursionlimit(10 ** 6)\n\nn, m = map(int, input().split())\ngraph = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    a, b = map(int, input().split())\n    graph[a].append(b)\n    graph[b].append(a)\n\ns, t = map(int, input().split())\nvisited = [False] * (n + 1)\n\ndef dfs(node):\n    visited[node] = True\n    for nxt in graph[node]:\n        if not visited[nxt]:\n            dfs(nxt)\n\ndfs(s)\nprint('Yes' if visited[t] else 'No')",
            failReason: "",
            improvement: "재귀 DFS는 recursionlimit 설정을 확인한다.",
            reviewNeeded: false,
            memo: ""
          },
          {
            id: "c3_p2",
            number: "B",
            title: "최단 이동",
            difficulty: "Silver",
            category: "BFS",
            algorithm: ["BFS", "그래프"],
            status: "정답",
            result: "Accepted",
            solveTime: "24분",
            summary: "무가중치 그래프에서 최단 간선 수를 구한다.",
            description: "BFS 거리 배열을 -1로 초기화하고 시작점 거리를 0으로 둔다.",
            code: "from collections import deque\n\nn, m = map(int, input().split())\ngraph = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    a, b = map(int, input().split())\n    graph[a].append(b)\n    graph[b].append(a)\n\nstart = 1\ndist = [-1] * (n + 1)\ndist[start] = 0\nqueue = deque([start])\n\nwhile queue:\n    cur = queue.popleft()\n    for nxt in graph[cur]:\n        if dist[nxt] == -1:\n            dist[nxt] = dist[cur] + 1\n            queue.append(nxt)\n\nprint(dist[n])",
            failReason: "",
            improvement: "거리 배열은 방문 여부와 거리 정보를 동시에 담을 수 있다.",
            reviewNeeded: false,
            memo: ""
          },
          {
            id: "c3_p3",
            number: "C",
            title: "섬의 개수",
            difficulty: "Silver",
            category: "DFS",
            algorithm: ["DFS", "BFS", "그래프"],
            status: "풀이중",
            result: "Not Submitted",
            solveTime: "40분",
            summary: "격자에서 연결된 땅 덩어리의 개수를 센다.",
            description: "8방향 또는 4방향 조건을 문제에서 정확히 확인해야 한다.",
            code: "",
            failReason: "",
            improvement: "방향 배열을 문제 조건에 맞게 먼저 정의하기.",
            reviewNeeded: true,
            memo: "8방향 조건 주의"
          },
          {
            id: "c3_p4",
            number: "D",
            title: "경로 복원",
            difficulty: "Gold",
            category: "그래프",
            algorithm: ["BFS", "그래프"],
            status: "미풀이",
            result: "Not Submitted",
            solveTime: "",
            summary: "최단거리뿐 아니라 실제 경로를 복원한다.",
            description: "parent 배열을 유지하면서 BFS를 수행하고 목적지에서 시작점으로 역추적한다.",
            code: "",
            failReason: "",
            improvement: "",
            reviewNeeded: false,
            memo: ""
          }
        ]
      }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function createId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function arrayify(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      console.warn(`Failed to read ${key}`, error);
      return clone(fallback);
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeProblem(problem) {
    const source = problem || {};
    const now = today();
    return {
      id: source.id || createId("py_algo"),
      language: source.language || "python",
      title: source.title || "제목 없음",
      summary: source.summary || "",
      description: source.description || "",
      category: source.category || "",
      algorithm: arrayify(source.algorithm),
      difficulty: source.difficulty || "Unrated",
      input: source.input || "",
      output: source.output || "",
      exampleInput: source.exampleInput || "",
      exampleOutput: source.exampleOutput || "",
      idea: source.idea || "",
      code: source.code || "",
      timeComplexity: source.timeComplexity || "",
      spaceComplexity: source.spaceComplexity || "",
      learned: source.learned || "",
      tags: arrayify(source.tags),
      createdAt: source.createdAt || now,
      updatedAt: source.updatedAt || now
    };
  }

  function normalizeContestProblem(problem) {
    const source = problem || {};
    return {
      id: source.id || createId("contest_problem"),
      number: source.number || "",
      title: source.title || "제목 없음",
      difficulty: source.difficulty || "Unrated",
      category: source.category || "",
      algorithm: arrayify(source.algorithm),
      status: source.status || "미풀이",
      result: source.result || "Not Submitted",
      solveTime: source.solveTime || "",
      summary: source.summary || "",
      description: source.description || "",
      input: source.input || "",
      output: source.output || "",
      exampleInput: source.exampleInput || "",
      exampleOutput: source.exampleOutput || "",
      idea: source.idea || "",
      code: source.code || "",
      timeComplexity: source.timeComplexity || "",
      spaceComplexity: source.spaceComplexity || "",
      learned: source.learned || "",
      failReason: source.failReason || "",
      improvement: source.improvement || "",
      reviewNeeded: Boolean(source.reviewNeeded),
      memo: source.memo || ""
    };
  }

  function normalizeContest(contest) {
    const source = contest || {};
    return {
      id: source.id || createId("contest"),
      title: source.title || "제목 없음",
      platform: source.platform || "",
      date: source.date || today(),
      description: source.description || "",
      tags: arrayify(source.tags),
      problems: Array.isArray(source.problems) ? source.problems.map(normalizeContestProblem) : []
    };
  }

  function mergeById(seedItems, localItems, deletedIds, normalizer) {
    const deleted = new Set(deletedIds || []);
    const map = new Map();
    seedItems.forEach((item) => {
      if (!deleted.has(item.id)) map.set(item.id, normalizer(item));
    });
    localItems.forEach((item) => {
      if (!item || !item.id || deleted.has(item.id)) return;
      map.set(item.id, normalizer(item));
    });
    return Array.from(map.values());
  }

  function seedHas(collection, id) {
    return SEED_DATA[collection].some((item) => item.id === id);
  }

  function upsertLocal(key, item, normalizer) {
    const normalized = normalizer(item);
    const items = readJSON(key, []).filter((candidate) => candidate.id !== normalized.id);
    items.push(normalized);
    writeJSON(key, items);
    return normalized;
  }

  function removeDeletedId(key, id) {
    const ids = readJSON(key, []).filter((candidate) => candidate !== id);
    writeJSON(key, ids);
  }

  function markDeleted(key, id) {
    const ids = readJSON(key, []);
    if (!ids.includes(id)) ids.push(id);
    writeJSON(key, ids);
  }

  function getProblems() {
    return mergeById(
      SEED_DATA.problems,
      readJSON(STORAGE_KEYS.problems, []),
      readJSON(STORAGE_KEYS.deletedProblems, []),
      normalizeProblem
    ).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }

  function getContests() {
    return mergeById(
      SEED_DATA.contests,
      readJSON(STORAGE_KEYS.contests, []),
      readJSON(STORAGE_KEYS.deletedContests, []),
      normalizeContest
    ).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }

  function saveProblem(problem) {
    const normalized = normalizeProblem({
      ...problem,
      updatedAt: problem.updatedAt || today()
    });
    const saved = upsertLocal(STORAGE_KEYS.problems, normalized, normalizeProblem);
    removeDeletedId(STORAGE_KEYS.deletedProblems, saved.id);
    return saved;
  }

  function deleteProblem(id) {
    const local = readJSON(STORAGE_KEYS.problems, []).filter((problem) => problem.id !== id);
    writeJSON(STORAGE_KEYS.problems, local);
    if (seedHas("problems", id)) markDeleted(STORAGE_KEYS.deletedProblems, id);
  }

  function saveContest(contest) {
    const saved = upsertLocal(STORAGE_KEYS.contests, normalizeContest(contest), normalizeContest);
    removeDeletedId(STORAGE_KEYS.deletedContests, saved.id);
    return saved;
  }

  function deleteContest(id) {
    const local = readJSON(STORAGE_KEYS.contests, []).filter((contest) => contest.id !== id);
    writeJSON(STORAGE_KEYS.contests, local);
    if (seedHas("contests", id)) markDeleted(STORAGE_KEYS.deletedContests, id);
  }

  function resetAll() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.theme) localStorage.removeItem(key);
    });
  }

  function progressOf(contest) {
    const total = contest.problems.length;
    const solved = contest.problems.filter((problem) => problem.status === "정답").length;
    const wrong = contest.problems.filter((problem) => problem.status === "오답").length;
    const inProgress = contest.problems.filter((problem) => problem.status === "풀이중").length;
    const review = contest.problems.filter((problem) => problem.status === "복습필요").length;
    const unsolved = contest.problems.filter((problem) => problem.status === "미풀이").length;
    const progress = total ? Math.round((solved / total) * 100) : 0;
    return { total, solved, wrong, inProgress, review, unsolved, progress };
  }

  function exportArchive() {
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      problems: getProblems(),
      contests: getContests()
    };
  }

  function importArchive(payload) {
    const data = Array.isArray(payload) ? { problems: payload } : payload;
    if (!data || typeof data !== "object") {
      throw new Error("JSON 객체 또는 배열만 가져올 수 있습니다.");
    }

    let problems = 0;
    let contests = 0;

    const looksLikeSingleContest = data.id && Array.isArray(data.problems) && (data.platform || data.date || data.description || data.tags);

    if (looksLikeSingleContest) {
      saveContest(normalizeContest(data));
      contests = 1;
      return { problems, contests };
    }

    if (Array.isArray(data.problems)) {
      data.problems.forEach((problem) => {
        saveProblem(normalizeProblem(problem));
        problems += 1;
      });
    }

    if (Array.isArray(data.contests)) {
      data.contests.forEach((contest) => {
        saveContest(normalizeContest(contest));
        contests += 1;
      });
    }

    return { problems, contests };
  }

  function downloadJSON(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function compactDate(value) {
    return value || "-";
  }

  function difficultyClass(value) {
    return String(value || "Unrated").toLowerCase();
  }

  function statusClass(value) {
    if (value === "정답") return "solved";
    if (value === "오답") return "wrong";
    if (value === "복습필요") return "review";
    return "";
  }

  function resultClass(value) {
    if (value === "Accepted") return "accepted";
    if (["Wrong Answer", "TLE", "Runtime Error"].includes(value)) return "failed";
    return "pending";
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.querySelectorAll("[data-theme-icon]").forEach((icon) => {
      icon.textContent = theme === "dark" ? "☀" : "☾";
    });
  }

  function initThemeToggle() {
    const theme = document.documentElement.dataset.theme || "light";
    setTheme(theme);
    document.querySelectorAll("#themeToggle").forEach((button) => {
      button.addEventListener("click", () => {
        setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
      });
    });
  }

  function textIncludes(target, keyword) {
    return String(target || "").toLowerCase().includes(String(keyword || "").toLowerCase());
  }

  window.ArchiveSeed = clone(SEED_DATA);
  window.ArchiveStore = {
    categories: ALGORITHM_CATEGORIES,
    difficulties: DIFFICULTIES,
    statuses: STATUSES,
    results: RESULTS,
    today,
    createId,
    arrayify,
    normalizeProblem,
    normalizeContest,
    normalizeContestProblem,
    getProblems,
    getContests,
    saveProblem,
    deleteProblem,
    saveContest,
    deleteContest,
    resetAll,
    progressOf,
    exportArchive,
    importArchive,
    downloadJSON
  };
  window.ArchiveUI = {
    escapeHTML,
    compactDate,
    difficultyClass,
    statusClass,
    resultClass,
    initThemeToggle,
    textIncludes
  };
})();
