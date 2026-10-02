(function () {
  const STORAGE_KEY = "algoArchive.basicConcepts";

  const SEED_DATA = {
    page: {
      eyebrow: "Python 기본기",
      title: "처음 볼 때 꼭 잡아야 할 파이썬 개념",
      lead: "문제 풀이 전에 자주 쓰이는 문법과 자료구조를 짧은 설명, 예제 코드, 체크 포인트로 정리했습니다.",
      conceptsTitle: "한눈에 보는 기본 개념",
      examplesTitle: "자주 쓰는 문법 예제",
      templateTitle: "문제 풀이용 기본 템플릿",
      checklistTitle: "복습 체크 포인트",
      stats: [
        { key: "concepts", label: "핵심 개념" },
        { key: "examples", label: "예제 코드" },
        { key: "checks", label: "체크 포인트" }
      ]
    },
    concepts: [
      {
        id: "variables",
        badge: "01",
        cardTitle: "변수와 타입",
        cardSummary: "변수는 값을 담는 이름입니다. 파이썬은 값을 넣는 순간 타입이 정해지며, `int`, `float`, `str`, `bool`을 가장 먼저 익히면 됩니다.",
        detailEyebrow: "Python 기본기",
        detailTitle: "변수와 타입",
        detailSummary: "변수는 값을 기억하기 위해 붙이는 이름이고, 타입은 그 값으로 무엇을 할 수 있는지 결정합니다.",
        sections: [
          {
            title: "변수란?",
            body: "파이썬에서는 `name = value` 형태로 변수를 만듭니다. 변수 자체가 타입을 고정해서 가지는 것이 아니라, 변수에 연결된 값이 타입을 가집니다. 그래서 같은 변수에 문자열을 넣었다가 나중에 숫자를 넣을 수도 있습니다."
          },
          {
            title: "자주 쓰는 타입",
            body: "`int`는 정수, `float`는 실수, `str`은 문자열, `bool`은 참과 거짓입니다. 알고리즘 문제에서는 입력이 대부분 문자열로 들어오기 때문에 필요한 타입으로 바꾸는 습관이 중요합니다."
          }
        ],
        codes: [
          {
            filename: "variables.py",
            code: "count = 3\nname = \"python\"\npassed = True\n\nprint(type(count))\nprint(type(name))\nprint(type(passed))"
          }
        ]
      },
      {
        id: "input-output",
        badge: "02",
        cardTitle: "입력과 출력",
        cardSummary: "`input()`은 문자열을 읽습니다. 숫자 계산을 하려면 `int()` 또는 `map(int, ...)`로 변환한 뒤 사용합니다.",
        detailEyebrow: "Python 기본기",
        detailTitle: "입력과 출력",
        detailSummary: "입력은 문자열로 들어오며, 출력은 `print()`로 확인합니다. 문제 풀이에서는 변환과 빠른 입력이 핵심입니다.",
        sections: [
          {
            title: "input()과 타입 변환",
            body: "`input()`은 한 줄을 문자열로 읽습니다. 숫자 하나는 `int(input())`, 공백으로 나뉜 여러 숫자는 `map(int, input().split())` 패턴을 자주 씁니다."
          },
          {
            title: "빠른 입력",
            body: "입력 줄이 많을 때는 `sys.stdin.readline`을 사용합니다. 줄 끝의 개행이 남을 수 있으므로 문자열을 다룰 때는 `.strip()`을 함께 쓰면 안전합니다."
          }
        ],
        codes: [
          {
            filename: "input_output.py",
            code: "import sys\n\ninput = sys.stdin.readline\nn = int(input())\na, b = map(int, input().split())\nword = input().strip()\n\nprint(n)\nprint(a + b)\nprint(word)"
          }
        ]
      },
      {
        id: "conditions",
        badge: "03",
        cardTitle: "조건문",
        cardSummary: "`if`, `elif`, `else`는 상황에 따라 다른 코드를 실행합니다. 조건식의 결과는 항상 참 또는 거짓으로 판단됩니다.",
        detailEyebrow: "Python 기본기",
        detailTitle: "조건문",
        detailSummary: "`if`, `elif`, `else`로 상황에 따라 실행할 코드를 나눕니다.",
        sections: [
          {
            title: "조건식",
            body: "조건식은 참 또는 거짓으로 판단되는 식입니다. 비교 연산자 `==`, `!=`, `<`, `<=`, `>`, `>=`를 자주 사용합니다."
          },
          {
            title: "범위 조건",
            body: "여러 조건을 함께 확인할 때는 `and`, `or`, `not`을 사용합니다. 파이썬은 `60 <= score < 90`처럼 수학식에 가까운 범위 표현도 지원합니다."
          }
        ],
        codes: [
          {
            filename: "conditions.py",
            code: "score = int(input())\n\nif score >= 90:\n    print(\"A\")\nelif score >= 80:\n    print(\"B\")\nelse:\n    print(\"C\")"
          },
          {
            filename: "range_check.py",
            code: "age = int(input())\n\nif 13 <= age <= 19:\n    print(\"teenager\")\nelse:\n    print(\"not teenager\")"
          }
        ]
      },
      {
        id: "loops",
        badge: "04",
        cardTitle: "반복문",
        cardSummary: "`for`는 정해진 범위를 순회할 때, `while`은 조건이 참인 동안 반복할 때 사용합니다.",
        detailEyebrow: "Python 기본기",
        detailTitle: "반복문",
        detailSummary: "같은 작업을 여러 번 수행할 때 사용합니다. `for`는 순회, `while`은 조건 반복에 어울립니다.",
        sections: [
          {
            title: "for 반복문",
            body: "`for`는 리스트, 문자열, `range()`처럼 순서대로 꺼낼 수 있는 값을 반복합니다. 문제 풀이에서는 `for i in range(n)` 형태가 가장 자주 등장합니다."
          },
          {
            title: "while 반복문",
            body: "`while`은 조건이 참인 동안 계속 실행합니다. 종료 조건을 잘못 만들면 반복이 끝나지 않으므로 변수 갱신 위치를 꼭 확인해야 합니다."
          }
        ],
        codes: [
          {
            filename: "for_loop.py",
            code: "numbers = [2, 4, 6]\nanswer = 0\n\nfor number in numbers:\n    answer += number\n\nprint(answer)"
          },
          {
            filename: "while_loop.py",
            code: "count = 3\n\nwhile count > 0:\n    print(count)\n    count -= 1"
          }
        ]
      },
      {
        id: "data-structures",
        badge: "05",
        cardTitle: "자료구조",
        cardSummary: "리스트는 순서 있는 여러 값을, 딕셔너리는 키와 값을, 집합은 중복 없는 값을 다룰 때 편합니다.",
        detailEyebrow: "자료구조",
        detailTitle: "자료구조 - 리스트",
        detailSummary: "리스트는 여러 값을 순서대로 저장하는 가장 기본적인 자료구조입니다. 값 추가, 삭제, 탐색을 빠르게 연습하기 좋습니다.",
        sections: [
          {
            title: "리스트란?",
            body: "리스트는 `[]`로 만들고, 여러 값을 순서대로 담습니다. 인덱스는 0부터 시작하며 `arr[0]`은 첫 번째 값, `arr[-1]`은 마지막 값을 뜻합니다."
          },
          {
            title: "리스트.append 설명",
            body: "`append(value)`는 리스트의 맨 뒤에 값을 하나 추가합니다. 기존 리스트를 직접 바꾸며, 반환값은 `None`입니다. 그래서 `arr = arr.append(3)`처럼 쓰면 리스트가 사라지는 실수를 하게 됩니다."
          },
          {
            title: "언제 쓰나?",
            body: "입력을 순서대로 모아야 하거나, 반복하면서 결과를 하나씩 쌓아야 할 때 사용합니다. 예를 들어 정답 후보를 저장하거나 방문한 값을 기록할 때 리스트가 편합니다."
          }
        ],
        codes: [
          {
            filename: "list_append.py",
            code: "numbers = []\n\nnumbers.append(10)\nnumbers.append(20)\nnumbers.append(30)\n\nprint(numbers)\nprint(numbers[0])\nprint(numbers[-1])"
          },
          {
            filename: "append_result.py",
            code: "numbers = [1, 2]\nresult = numbers.append(3)\n\nprint(numbers)  # [1, 2, 3]\nprint(result)   # None"
          },
          {
            filename: "collect_even.py",
            code: "arr = [1, 2, 3, 4, 5, 6]\nevens = []\n\nfor value in arr:\n    if value % 2 == 0:\n        evens.append(value)\n\nprint(evens)"
          }
        ]
      },
      {
        id: "functions",
        badge: "06",
        cardTitle: "함수",
        cardSummary: "반복되는 코드를 이름 붙여 묶습니다. 입력값은 매개변수로 받고, 결과는 `return`으로 돌려줍니다.",
        detailEyebrow: "Python 기본기",
        detailTitle: "함수",
        detailSummary: "함수는 반복되는 로직을 이름 붙여 묶는 방법입니다. 코드를 읽기 쉽게 만들고 실수를 줄여줍니다.",
        sections: [
          {
            title: "함수 만들기",
            body: "`def 함수이름(매개변수):` 형태로 시작합니다. 함수 안에서 계산한 결과를 밖으로 돌려주려면 `return`을 사용합니다."
          },
          {
            title: "문제 풀이에서의 함수",
            body: "조건 확인, 거리 계산, 정렬 기준, 탐색 로직처럼 의미가 분명한 코드를 함수로 분리하면 디버깅이 쉬워집니다."
          }
        ],
        codes: [
          {
            filename: "function.py",
            code: "def add(a, b):\n    return a + b\n\nanswer = add(3, 5)\nprint(answer)"
          },
          {
            filename: "is_even.py",
            code: "def is_even(number):\n    return number % 2 == 0\n\nfor value in [1, 2, 3, 4]:\n    if is_even(value):\n        print(value)"
          }
        ]
      }
    ],
    examples: [
      {
        filename: "input_output.py",
        code: "name = input()\nage = int(input())\n\nprint(name, age)\nprint(f\"{name}은 {age}살입니다.\")"
      },
      {
        filename: "condition.py",
        code: "score = int(input())\n\nif score >= 90:\n    grade = \"A\"\nelif score >= 80:\n    grade = \"B\"\nelse:\n    grade = \"C\"\n\nprint(grade)"
      },
      {
        filename: "loop.py",
        code: "numbers = [3, 1, 4, 1, 5]\ntotal = 0\n\nfor number in numbers:\n    total += number\n\nprint(total)"
      },
      {
        filename: "list_dict_set.py",
        code: "names = [\"kim\", \"lee\", \"kim\"]\ncounts = {}\n\nfor name in names:\n    counts[name] = counts.get(name, 0) + 1\n\nunique_names = set(names)\nprint(counts)\nprint(unique_names)"
      }
    ],
    template: {
      filename: "solve.py",
      code: "import sys\n\ninput = sys.stdin.readline\n\nn = int(input())\narr = list(map(int, input().split()))\n\nanswer = 0\nfor value in arr:\n    answer += value\n\nprint(answer)"
    },
    checklist: [
      {
        title: "입력값 타입 확인",
        body: "`input()`으로 받은 값은 문자열입니다. 숫자 연산 전에 변환했는지 확인합니다."
      },
      {
        title: "들여쓰기 확인",
        body: "파이썬은 `{}` 대신 들여쓰기로 코드 블록을 구분합니다. 같은 블록은 같은 칸 수로 맞춥니다."
      },
      {
        title: "인덱스 범위 확인",
        body: "리스트의 마지막 인덱스는 길이보다 1 작습니다. 반복문의 시작과 끝을 다시 봅니다."
      },
      {
        title: "작은 예제로 검증",
        body: "코드를 제출하기 전에 직접 계산 가능한 입력으로 먼저 결과를 확인합니다."
      }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function text(value, fallback = "") {
    return String(value ?? fallback);
  }

  function normalizeBlock(block) {
    return {
      title: text(block?.title),
      body: text(block?.body)
    };
  }

  function normalizeCode(code) {
    return {
      filename: text(code?.filename, "example.py"),
      code: text(code?.code)
    };
  }

  function normalizeConcept(concept, index) {
    const fallback = SEED_DATA.concepts[index] || {};
    return {
      id: text(concept?.id, fallback.id || `concept_${index + 1}`),
      badge: text(concept?.badge, fallback.badge || String(index + 1).padStart(2, "0")),
      cardTitle: text(concept?.cardTitle, fallback.cardTitle || "새 개념"),
      cardSummary: text(concept?.cardSummary, fallback.cardSummary),
      detailEyebrow: text(concept?.detailEyebrow, fallback.detailEyebrow || "Python 기본기"),
      detailTitle: text(concept?.detailTitle, fallback.detailTitle || concept?.cardTitle || "새 개념"),
      detailSummary: text(concept?.detailSummary, fallback.detailSummary),
      sections: Array.isArray(concept?.sections) ? concept.sections.map(normalizeBlock) : clone(fallback.sections || []),
      codes: Array.isArray(concept?.codes) ? concept.codes.map(normalizeCode) : clone(fallback.codes || [])
    };
  }

  function normalizePayload(payload) {
    const source = payload && typeof payload === "object" ? payload : {};
    const page = {
      ...clone(SEED_DATA.page),
      ...(source.page && typeof source.page === "object" ? source.page : {})
    };
    page.stats = Array.isArray(page.stats) && page.stats.length
      ? page.stats.map((stat, index) => ({
          key: text(stat?.key, SEED_DATA.page.stats[index]?.key || "custom"),
          label: text(stat?.label, SEED_DATA.page.stats[index]?.label || "항목")
        }))
      : clone(SEED_DATA.page.stats);

    return {
      page,
      concepts: Array.isArray(source.concepts) ? source.concepts.map(normalizeConcept) : clone(SEED_DATA.concepts),
      examples: Array.isArray(source.examples) ? source.examples.map(normalizeCode) : clone(SEED_DATA.examples),
      template: normalizeCode(source.template || SEED_DATA.template),
      checklist: Array.isArray(source.checklist) ? source.checklist.map(normalizeBlock) : clone(SEED_DATA.checklist)
    };
  }

  function readPayload() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizePayload(raw ? JSON.parse(raw) : SEED_DATA);
    } catch (error) {
      console.warn("Failed to read basic concepts", error);
      return clone(SEED_DATA);
    }
  }

  function savePayload(payload) {
    const normalized = normalizePayload(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function resetPayload() {
    localStorage.removeItem(STORAGE_KEY);
    return clone(SEED_DATA);
  }

  function getConceptById(id) {
    return readPayload().concepts.find((concept) => concept.id === id);
  }

  function statValue(payload, key) {
    if (key === "concepts") return payload.concepts.length;
    if (key === "examples") return payload.examples.length + (payload.template.code ? 1 : 0);
    if (key === "checks") return payload.checklist.length;
    return "-";
  }

  window.BasicConceptStore = {
    getPayload: readPayload,
    savePayload,
    resetPayload,
    getConceptById,
    statValue,
    clone
  };
})();
