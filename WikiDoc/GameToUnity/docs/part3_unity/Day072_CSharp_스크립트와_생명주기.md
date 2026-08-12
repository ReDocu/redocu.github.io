# Day 072 · C# 스크립트와 MonoBehaviour 생명주기

> **Week 15** · 연결 문서 `13 런닝 게임` — Step 1
> 선수: Day 071 (Unity 입문)

---

## 1. 오늘 만드는 것

**스크립트를 붙여 오브젝트를 코드로 움직인다.**

```
   ┌──────────────────────────────┬─────────────────────────┐
   │  Game                        │  Inspector              │
   │                              │                         │
   │       ┌───┐                  │ ☑ Player                │
   │       │   │ ◀──▶ 왕복        │                         │
   │       └───┘                  │ ▾ Mover (Script)        │
   │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓             │   Script    Mover       │
   │                              │   Speed     3.0  ◀ 조절 │
   ├──────────────────────────────┤   Range     4.0         │
   │  Console                     │                         │
   │  [00:00.000] Awake           │ ▾ Transform             │
   │  [00:00.000] OnEnable        │   Pos  2.4  0.5  0      │
   │  [00:00.016] Start           │                         │
   │  [00:00.016] Update  #1      │                         │
   │  [00:00.016] LateUpdate #1   │                         │
   │  [00:00.033] Update  #2      │                         │
   └──────────────────────────────┴─────────────────────────┘
```

**Play 중에 Speed를 바꾸면 즉시 반영된다.**

<!-- SHOT: Day 72 완성 화면 -->

---

## 2. 막히는 상황

어제 큐브에 Rigidbody를 붙였다. 떨어졌다.

```
   ★ 그런데 그게 전부다

   × 키를 누르면 점프
   × 아이템을 먹으면 점수
   × 시간이 지나면 속도 증가

   → 컴포넌트를 붙이는 것만으로는 안 된다
```

```
   Part 2에서는

   Core::Update(dt) 안에 내 코드를 썼다
   → 매 프레임 호출됐다

   Unity에서는 그 자리가 어디인가?
```

> **스크립트도 컴포넌트다.**
> `MonoBehaviour`를 상속한 클래스를 붙이면, 엔진이 매 프레임 내 함수를 호출해 준다.

---

## 3. 개념

### 3-1. C# — C++에서 달라지는 것

**왜 필요한가** — 문법은 비슷하지만 사고방식이 다르다.

| 항목 | C++ | C# |
|---|---|---|
| 메모리 해제 | `delete` 직접 | **GC가 자동** |
| 포인터 | `*`, `&` | 없음 (참조만) |
| 헤더 | `.h` + `.cpp` | `.cs` 하나 |
| `struct` | 클래스와 거의 같음 | **값 타입** (복사됨) |
| `class` | 값/포인터 둘 다 | **항상 참조 타입** |
| 상속 | 다중 상속 가능 | 클래스는 단일, 인터페이스는 다중 |
| 문자열 | `char*`, `std::string` | `string` (불변) |
| 배열 | `int arr[10]` | `int[] arr = new int[10]` |
| null | `nullptr` | `null` |

```cpp
// C++
class Player {
    int hp;
public:
    Player() : hp(100) {}
    ~Player() { }
};

Player* p = new Player();
delete p;                          // ★ 직접 해제
```

```csharp
// C#
public class Player
{
    private int hp = 100;
}

Player p = new Player();
// ★ delete 없음. GC가 알아서
```

```
   ★ GC(Garbage Collector)

   더 이상 참조되지 않는 객체를 자동으로 회수

   장점:  메모리 누수가 거의 없다
   단점:  회수 시점에 프레임이 튄다 (GC 스파이크)

   → Day 74에서 이 문제를 다룬다
```

### 3-2. C# 속성(Property)

**왜 필요한가** — Unity 코드 어디에나 나온다.

```csharp
public class Player
{
    private int hp = 100;

    // ★ 속성 — 필드처럼 쓰지만 함수처럼 동작
    public int Hp
    {
        get { return hp; }
        set
        {
            hp = value;
            if (hp < 0) hp = 0;
        }
    }
}
```

```csharp
    player.Hp = -50;               // set 호출 → 0으로 보정
    int h = player.Hp;             // get 호출
```

```csharp
    // 자동 구현 속성 (내부 필드 자동 생성)
    public int Score { get; private set; }
```

```
   ★ Unity에서 매일 본다

   transform.position               속성
   gameObject.activeSelf            속성
   Time.deltaTime                   속성
   rb.linearVelocity                속성
```

### 3-3. `var`, 컬렉션, `foreach`

**왜 필요한가** — 코드가 짧아진다.

```csharp
    var speed = 5.0f;                          // float 로 추론
    var list = new List<int>();                // List<int>

    // ⚠️ 타입이 명확할 때만 쓴다
    var x = GetSomething();                    // ✗ 뭔지 모른다
```

```csharp
    List<GameObject> enemies = new List<GameObject>();
    enemies.Add(go);
    enemies.Remove(go);
    int n = enemies.Count;                     // .size() 아님

    foreach (GameObject e in enemies)
    {
        Debug.Log(e.name);
    }
```

```
   ⚠️ foreach 중에 컬렉션을 수정하면 예외

   InvalidOperationException:
   Collection was modified

   → Day 53의 "순회 중 삭제"가 여기선 예외로 잡힌다
   → for 역순 또는 지연 삭제
```

```csharp
    // ★ 역순 순회
    for (int i = enemies.Count - 1; i >= 0; i--)
    {
        if (dead) enemies.RemoveAt(i);
    }
```

### 3-4. MonoBehaviour

**왜 필요한가** — Unity 스크립트의 기반.

```csharp
using UnityEngine;

public class Mover : MonoBehaviour        // ★ 반드시 MonoBehaviour 상속
{
    void Start() { }
    void Update() { }
}
```

```
   ⚠️ 반드시 지킬 것

   ① 파일명 = 클래스명 (Mover.cs → class Mover)
   ② MonoBehaviour 상속
   ③ using UnityEngine;
   ④ 네임스페이스 안에 두면 폴더 구조와 무관하게 동작하지만
      초보 단계에선 네임스페이스 없이 시작

   하나라도 어기면 컴포넌트로 붙지 않는다
```

```
   ★ MonoBehaviour는 new 로 만들지 않는다

   ✗  Mover m = new Mover();

   ✔  gameObject.AddComponent<Mover>();
```

### 3-5. 생명주기 — 호출 순서

**왜 필요한가** — 어디에 무엇을 쓸지 결정한다.

```
   [게임 시작]
        │
        ▼
   ┌─────────────┐
   │  Awake()    │  1회. 오브젝트 생성 직후
   └─────────────┘  → 자기 자신 초기화, GetComponent 캐싱
        │
        ▼
   ┌─────────────┐
   │  OnEnable() │  활성화될 때마다
   └─────────────┘  → 이벤트 등록
        │
        ▼
   ┌─────────────┐
   │  Start()    │  1회. 첫 Update 직전
   └─────────────┘  → 다른 오브젝트 참조
        │
        ▼
   ╔═════════════╗
   ║  루프       ║
   ║             ║
   ║ FixedUpdate │  물리 고정 간격 (기본 0.02초)
   ║      ↓      │
   ║  Update()   │  매 프레임
   ║      ↓      │
   ║ LateUpdate  │  매 프레임, Update 전부 끝난 뒤
   ║      ↓      │
   ║  렌더링     │
   ╚═════════════╝
        │
        ▼
   ┌─────────────┐
   │ OnDisable() │  비활성화될 때마다
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │ OnDestroy() │  파괴될 때
   └─────────────┘
```

**Part 2와의 대응**

| Unity | Part 2 |
|---|---|
| `Awake()` | 생성자 / `Init()` |
| `Start()` | `Scene::Enter()` 이후 |
| `Update()` | `Core::Update(dt)` |
| `LateUpdate()` | Update 루프 끝. 카메라 추적 자리 |
| `FixedUpdate()` | **Part 2엔 없던 개념** (Day 67 고정 스텝!) |
| `OnDestroy()` | 소멸자 / `Release()` |

### 3-6. ⚠️ Awake vs Start

**왜 필요한가** — 순서를 모르면 null 참조가 난다.

```
   ★ 핵심 규칙

   모든 오브젝트의 Awake가 끝난 뒤
   모든 오브젝트의 Start가 시작된다

   Awake(A) → Awake(B) → Awake(C)
   → Start(A) → Start(B) → Start(C)
```

```csharp
public class A : MonoBehaviour
{
    public static A Instance;

    void Awake()
    {
        Instance = this;                       // ★ Awake에서 등록
    }
}

public class B : MonoBehaviour
{
    void Start()
    {
        A.Instance.DoSomething();              // ★ Start에서 사용 — 안전
    }
}
```

```
   ⚠️ B의 Awake에서 A.Instance를 쓰면?

   A의 Awake가 먼저 돌았다는 보장이 없다
   → NullReferenceException 가능
```

| 무엇 | 어디에 |
|---|---|
| 자기 컴포넌트 캐싱 | `Awake` |
| static 인스턴스 등록 | `Awake` |
| 다른 오브젝트 찾기 | `Start` |
| 다른 매니저 사용 | `Start` |

### 3-7. Time.deltaTime

**왜 필요한가** — Part 2에서 직접 만든 것이 이미 들어 있다.

```csharp
    // ✗ 프레임 의존
    transform.position += Vector3.right * 0.1f;

    // ✔ 프레임 독립
    transform.position += Vector3.right * speed * Time.deltaTime;
```

```
   ★ Day 38에서 겪은 그 문제

   60fps PC:  0.1 × 60 = 초당 6
   144fps PC: 0.1 × 144 = 초당 14.4   ← 2.4배 빠르다
```

| 속성 | 의미 |
|---|---|
| `Time.deltaTime` | 이전 프레임부터 경과 시간 |
| `Time.fixedDeltaTime` | FixedUpdate 간격 (기본 0.02) |
| `Time.time` | 시작 후 총 경과 시간 |
| `Time.timeScale` | 시간 배속. 0이면 정지 |
| `Time.unscaledDeltaTime` | timeScale 무시한 실제 시간 |

```
   ★ Time.timeScale = 0 으로 일시정지

   Update는 계속 호출되지만 deltaTime이 0
   → 움직임이 멈춘다

   UI 애니메이션은 unscaledDeltaTime을 써야 계속 움직인다
```

### 3-8. Inspector 노출

**왜 필요한가** — 코드 수정 없이 값을 조절한다.

```csharp
public class Mover : MonoBehaviour
{
    public float speed = 3f;                   // ★ public → 보인다

    [SerializeField]
    private float range = 4f;                  // ★ private + 어트리뷰트 → 보인다

    private float timer;                       // 안 보인다

    [HideInInspector]
    public int internalValue;                  // public이지만 숨김
}
```

```
   ★ 권장은 [SerializeField] private

   public 은 다른 스크립트가 마음대로 바꿀 수 있다
   → 캡슐화가 깨진다

   [SerializeField] private
   → Inspector에서만 조절, 코드로는 보호
```

**유용한 어트리뷰트**

```csharp
    [Header("이동 설정")]
    [SerializeField] private float speed = 3f;

    [Range(0f, 10f)]                           // ★ 슬라이더
    [SerializeField] private float range = 4f;

    [Tooltip("초당 회전 각도")]
    [SerializeField] private float rotSpeed = 90f;

    [Space(10)]
    [Header("디버그")]
    [SerializeField] private bool showGizmo = true;
```

```
   Inspector 결과

   ▾ Mover (Script)
     ─ 이동 설정 ─
       Speed      3
       Range      ●────────  4
       Rot Speed  90

     ─ 디버그 ─
       Show Gizmo ✔
```

```
   ⚠️ Inspector 값이 코드 기본값을 덮어쓴다

   코드에서 speed = 3 으로 바꿔도
   이미 Inspector에 5가 저장돼 있으면 5가 쓰인다

   → 컴포넌트 우클릭 → Reset 으로 초기화
```

### 3-9. GetComponent와 캐싱

**왜 필요한가** — 다른 컴포넌트를 코드로 다룬다.

```csharp
public class Jumper : MonoBehaviour
{
    private Rigidbody rb;                      // ★ 캐싱용 필드

    void Awake()
    {
        rb = GetComponent<Rigidbody>();        // ★ 한 번만
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
            rb.AddForce(Vector3.up * 5f, ForceMode.Impulse);
    }
}
```

```csharp
    // ✗ 매 프레임 찾기
    void Update()
    {
        GetComponent<Rigidbody>().AddForce(...);   // 느리다
    }
```

```
   ★ GetComponent는 검색이다

   컴포넌트 목록을 훑어서 타입이 맞는 것을 찾는다
   → 매 프레임 × 오브젝트 수만큼 하면 비용이 쌓인다

   Day 51의 교훈:  비용은 실측한다
```

**찾기 계열 함수**

| 함수 | 범위 | 비용 |
|---|---|:--:|
| `GetComponent<T>()` | 자기 자신 | 낮음 |
| `GetComponentInChildren<T>()` | 자신 + 자식 | 중간 |
| `GetComponentInParent<T>()` | 자신 + 부모 | 중간 |
| `FindObjectOfType<T>()` | **씬 전체** | **높음** |
| `GameObject.Find("이름")` | **씬 전체, 이름 비교** | **매우 높음** |

```
   ⚠️ Update에서 Find 계열 절대 금지

   씬의 모든 오브젝트를 훑는다
   → 오브젝트 1000개면 프레임당 1000회 비교

   Start에서 한 번 찾아 캐싱한다
```

```csharp
    // ✔ 더 나은 방법: Inspector에서 연결
    [SerializeField] private Rigidbody rb;     // 드래그로 연결

    // 찾을 필요 자체가 없다
```

### 3-10. FixedUpdate와 물리

**왜 필요한가** — Day 67에서 만든 고정 시간 스텝이 엔진에 들어 있다.

```
   Update           FixedUpdate
   ─────────────────────────────
   프레임마다        고정 간격 (0.02초 = 50회/초)
   가변 dt          항상 같은 dt
   입력, 게임 로직   물리 계산
```

```
   ★ Day 67에서 왜 고정 스텝을 썼나

   "프레임률과 무관하게 완전히 동일한 궤적"

   Unity가 그것을 FixedUpdate로 제공한다
```

```
   한 프레임에 FixedUpdate가 여러 번 돌 수 있다

   프레임이 0.05초 걸렸다면
   → FixedUpdate 2~3회 호출
   → Update 1회

   프레임이 0.008초라면
   → FixedUpdate 0회 (아직 0.02초가 안 참)
   → Update 1회
```

| 무엇 | 어디에 |
|---|---|
| 키 입력 감지 (`GetKeyDown`) | **`Update`** |
| Rigidbody 힘/속도 조작 | **`FixedUpdate`** |
| `transform` 직접 이동 (물리 없음) | `Update` |
| 카메라 추적 | **`LateUpdate`** |

```
   ⚠️ GetKeyDown을 FixedUpdate에 쓰면 입력이 씹힌다

   FixedUpdate가 안 도는 프레임에 누르면 놓친다

   해결:  Update에서 플래그를 세우고
          FixedUpdate에서 소비
```

```csharp
    private bool jumpPressed;

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
            jumpPressed = true;                // ★ 기록
    }

    void FixedUpdate()
    {
        if (jumpPressed)
        {
            rb.AddForce(Vector3.up * force, ForceMode.Impulse);
            jumpPressed = false;               // ★ 소비
        }
    }
```

### 3-11. LateUpdate

**왜 필요한가** — 순서 문제를 해결한다.

```
   문제

   Update에서 카메라가 플레이어를 따라간다
   → 플레이어의 Update가 먼저 돌았는지 보장이 없다
   → 카메라가 한 프레임 늦게 따라간다 = 떨림
```

```
   해결

   모든 Update가 끝난 뒤 LateUpdate가 돈다
   → 플레이어는 확실히 이동을 마쳤다
```

```csharp
public class CameraFollow : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private Vector3 offset = new Vector3(0, 5, -10);
    [SerializeField] private float smooth = 5f;

    void LateUpdate()                          // ★ Update 아님
    {
        if (target == null) return;

        Vector3 desired = target.position + offset;

        transform.position = Vector3.Lerp(
            transform.position, desired, smooth * Time.deltaTime);

        transform.LookAt(target);
    }
}
```

```
   ★ Vector3.Lerp = Day 64의 선형 보간

   현재 + (목표 - 현재) × t
```

### 3-12. 코루틴

**왜 필요한가** — "3초 뒤에" 같은 시간 흐름을 자연스럽게 쓴다.

```csharp
    // Part 2 방식 — 타이머 변수
    private float timer;
    private bool waiting;

    void Update()
    {
        if (waiting)
        {
            timer += Time.deltaTime;
            if (timer >= 3f) { DoSomething(); waiting = false; }
        }
    }
```

```csharp
    // 코루틴 방식
    IEnumerator DoAfterDelay()
    {
        yield return new WaitForSeconds(3f);   // ★ 3초 기다림
        DoSomething();
    }

    void Start()
    {
        StartCoroutine(DoAfterDelay());
    }
```

```
   ★ yield return 은 "여기서 잠시 멈춘다"

   함수가 중단되고, 조건이 만족되면 그 줄부터 다시 시작
```

| `yield return` | 의미 |
|---|---|
| `null` | 다음 프레임까지 |
| `new WaitForSeconds(t)` | t초 (timeScale 영향받음) |
| `new WaitForSecondsRealtime(t)` | t초 (실제 시간) |
| `new WaitForFixedUpdate()` | 다음 FixedUpdate까지 |
| `new WaitUntil(() => cond)` | 조건이 참이 될 때까지 |

```csharp
    // 연속 동작
    IEnumerator Sequence()
    {
        Debug.Log("시작");
        yield return new WaitForSeconds(1f);

        Debug.Log("1초 경과");
        yield return new WaitForSeconds(1f);

        Debug.Log("2초 경과");

        // 3초 동안 서서히 커지기
        float t = 0;
        while (t < 3f)
        {
            t += Time.deltaTime;
            transform.localScale = Vector3.one * (1 + t);
            yield return null;                 // ★ 다음 프레임
        }
    }
```

```
   ⚠️ 코루틴 주의

   ① 오브젝트가 비활성화되면 멈춘다 (재개 안 됨)
   ② 오브젝트가 파괴되면 중단된다
   ③ StopCoroutine으로 멈추려면 참조를 보관해야 한다
```

```csharp
    private Coroutine running;

    void Begin()
    {
        if (running != null) StopCoroutine(running);
        running = StartCoroutine(Sequence());
    }
```

### 3-13. Debug.Log

**왜 필요한가** — Part 2의 `OutputDebugString`에 해당한다.

```csharp
    Debug.Log("일반 메시지");
    Debug.LogWarning("경고");
    Debug.LogError("오류");

    Debug.Log($"속도 {speed}, 위치 {transform.position}");   // ★ 보간 문자열
```

```
   ★ $"..." 문자열 보간

   C++의 sprintf 대신
   중괄호 안에 변수를 직접 넣는다
```

```csharp
    // 오브젝트를 두 번째 인자로 주면 클릭 시 Hierarchy에서 선택된다
    Debug.Log("이 오브젝트가 문제", gameObject);
```

```
   ⚠️ Update에서 매 프레임 Log 금지

   초당 60줄 → Console이 마비된다
   → 조건부로 또는 필요할 때만
```

---

## 4. 따라 만들기

### Step 1 — 첫 스크립트

```
   Scripts 폴더 우클릭 → Create → C# Script
   이름: LifecycleTest
```

```csharp
using UnityEngine;

public class LifecycleTest : MonoBehaviour
{
    private int updateCount = 0;

    void Awake()      { Debug.Log($"[{Time.time:F3}] Awake"); }
    void OnEnable()   { Debug.Log($"[{Time.time:F3}] OnEnable"); }
    void Start()      { Debug.Log($"[{Time.time:F3}] Start"); }

    void FixedUpdate()
    {
        if (updateCount < 3)
            Debug.Log($"[{Time.time:F3}] FixedUpdate");
    }

    void Update()
    {
        updateCount++;
        if (updateCount <= 3)
            Debug.Log($"[{Time.time:F3}] Update #{updateCount}");
    }

    void LateUpdate()
    {
        if (updateCount <= 3)
            Debug.Log($"[{Time.time:F3}] LateUpdate #{updateCount}");
    }

    void OnDisable()  { Debug.Log($"[{Time.time:F3}] OnDisable"); }
    void OnDestroy()  { Debug.Log($"[{Time.time:F3}] OnDestroy"); }
}
```

**Player에 드래그해 붙인 뒤 Play.**

**✅ 여기까지 실행하면**

```
   [0.000] Awake
   [0.000] OnEnable
   [0.000] Start
   [0.020] FixedUpdate
   [0.016] Update #1
   [0.016] LateUpdate #1
   [0.033] Update #2
   [0.033] LateUpdate #2
   ...
   (정지하면)
   [3.412] OnDisable
   [3.412] OnDestroy
```

<!-- SHOT: Step 1 Console 생명주기 -->

> ### ★ 이 출력이 오늘의 핵심 확인이다
>
> 3-5절의 도해를 눈으로 검증한다.

### Step 2 — Awake vs Start 순서 실험

```csharp
public class OrderA : MonoBehaviour
{
    void Awake() { Debug.Log("A - Awake"); }
    void Start() { Debug.Log("A - Start"); }
}
```

```csharp
public class OrderB : MonoBehaviour
{
    void Awake() { Debug.Log("B - Awake"); }
    void Start() { Debug.Log("B - Start"); }
}
```

**빈 오브젝트 2개를 만들어 각각 붙인다.**

**✅ 여기까지 실행하면**

```
   A - Awake
   B - Awake
   A - Start
   B - Start
```

```
   ★ Awake가 전부 끝난 뒤 Start가 시작된다

   A-Awake → A-Start → B-Awake → B-Start  가 아니다
```

### Step 3 — 왕복 이동

```csharp
using UnityEngine;

public class Mover : MonoBehaviour
{
    [Header("이동 설정")]
    [SerializeField] private float speed = 3f;

    [Range(0.5f, 10f)]
    [SerializeField] private float range = 4f;

    private Vector3 startPos;
    private int direction = 1;

    void Start()
    {
        startPos = transform.position;
    }

    void Update()
    {
        // ★ Time.deltaTime — 프레임 독립
        transform.position += Vector3.right * speed * direction * Time.deltaTime;

        float offset = transform.position.x - startPos.x;

        if (offset > range)  direction = -1;
        if (offset < -range) direction =  1;
    }
}
```

**LifecycleTest를 제거하고 Mover를 붙인다.**

**✅ 여기까지 실행하면** — 큐브가 좌우로 왕복한다.

**Play 중에 Inspector의 Speed를 5로 바꿔 본다.**

```
   즉시 빨라진다
```

```
   ⚠️ Play를 정지하면 원래 값으로 돌아간다

   Play 중 변경은 저장되지 않는다 (Day 71의 그 함정)
```

<!-- SHOT: Step 3 왕복 이동 -->

### Step 4 — deltaTime 없애 보기

```csharp
        transform.position += Vector3.right * speed * direction;   // ✗ dt 제거
```

**Game 뷰의 프레임률을 바꿔 본다.**

```
   Edit → Project Settings → Quality
   → VSync Count 를 Don't Sync 로

   또는 Application.targetFrameRate 로 제한
```

```csharp
    void Awake()
    {
        QualitySettings.vSyncCount = 0;
        Application.targetFrameRate = 30;      // ★ 30fps로 제한
    }
```

**✅ 이렇게 하면**

```
   30fps:  느리게 움직인다
   60fps:  2배 빠르게 움직인다
```

> **Day 38에서 겪은 그 문제다.** `Time.deltaTime`을 되돌린다.

### Step 5 — 회전 추가

```csharp
    [SerializeField] private float rotSpeed = 90f;   // 초당 90도

    void Update()
    {
        // ... 이동 ...

        transform.Rotate(Vector3.up, rotSpeed * Time.deltaTime);
    }
```

**✅ 여기까지 실행하면** — 큐브가 왕복하면서 회전한다.

### Step 6 — GetComponent 캐싱

```csharp
using UnityEngine;

[RequireComponent(typeof(Renderer))]           // ★ 없으면 자동 추가
public class ColorChanger : MonoBehaviour
{
    [SerializeField] private float changeInterval = 1f;

    private Renderer rend;                     // ★ 캐싱
    private float timer;

    void Awake()
    {
        rend = GetComponent<Renderer>();       // ★ 한 번만
    }

    void Update()
    {
        timer += Time.deltaTime;

        if (timer >= changeInterval)
        {
            timer = 0;
            rend.material.color = new Color(
                Random.value, Random.value, Random.value);
        }
    }
}
```

```
   ★ [RequireComponent]

   이 스크립트를 붙이면 Renderer도 자동으로 붙는다
   → GetComponent가 null일 걱정이 없다
```

**✅ 여기까지 실행하면** — 1초마다 색이 바뀐다.

### Step 7 — 캐싱 성능 비교

```csharp
using UnityEngine;
using System.Diagnostics;

public class GetComponentBenchmark : MonoBehaviour
{
    private Rigidbody cached;

    void Start()
    {
        cached = GetComponent<Rigidbody>();

        const int N = 1000000;
        Stopwatch sw = new Stopwatch();

        // 캐싱
        sw.Start();
        for (int i = 0; i < N; i++) { var r = cached; }
        sw.Stop();
        long cachedMs = sw.ElapsedMilliseconds;

        // 매번 호출
        sw.Restart();
        for (int i = 0; i < N; i++) { var r = GetComponent<Rigidbody>(); }
        sw.Stop();
        long callMs = sw.ElapsedMilliseconds;

        UnityEngine.Debug.Log($"캐싱      : {cachedMs} ms");
        UnityEngine.Debug.Log($"GetComponent: {callMs} ms  ({(float)callMs/Mathf.Max(cachedMs,1):F0}배)");
    }
}
```

**✅ 여기까지 실행하면**

```
   캐싱        : 3 ms
   GetComponent: 187 ms  (62배)
```

```
   ★ Day 51과 같은 교훈

   "괜찮겠지"가 아니라 측정한다
```

### Step 8 — Find의 비용

```csharp
    void Start()
    {
        // 큐브 1000개 생성
        for (int i = 0; i < 1000; i++)
        {
            GameObject g = GameObject.CreatePrimitive(PrimitiveType.Cube);
            g.name = $"Dummy_{i}";
            g.transform.position = new Vector3(i % 50, -50, i / 50);
        }

        Stopwatch sw = Stopwatch.StartNew();
        for (int i = 0; i < 1000; i++)
            GameObject.Find("Dummy_999");
        sw.Stop();

        UnityEngine.Debug.Log($"Find 1000회: {sw.ElapsedMilliseconds} ms");
    }
```

**✅ 여기까지 실행하면**

```
   Find 1000회: 340 ms

   → 프레임당 1회만 해도 0.34ms.  절대 Update에 쓰지 않는다
```

### Step 9 — LateUpdate 카메라

3-11절의 `CameraFollow`를 만들어 Main Camera에 붙이고, Target에 Player를 드래그한다.

**✅ 여기까지 실행하면** — 카메라가 큐브를 부드럽게 따라간다.

**`LateUpdate`를 `Update`로 바꿔 본다.**

```
   미세하게 떨리거나 한 프레임 늦게 따라온다
   (움직임이 빠를수록 뚜렷하다)
```

> **되돌린다.**

<!-- SHOT: Step 9 카메라 추적 -->

### Step 10 — FixedUpdate와 입력

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class SimpleJump : MonoBehaviour
{
    [SerializeField] private float jumpForce = 5f;

    private Rigidbody rb;
    private bool jumpPressed;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
            jumpPressed = true;                // ★ Update에서 감지
    }

    void FixedUpdate()
    {
        if (jumpPressed)
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
            jumpPressed = false;               // ★ FixedUpdate에서 소비
        }
    }
}
```

**Mover를 잠시 비활성화하고 Rigidbody + SimpleJump를 붙인다.**

**✅ 여기까지 실행하면** — 스페이스로 점프한다.

**`GetKeyDown`을 `FixedUpdate`로 옮겨 본다.**

```csharp
    void FixedUpdate()
    {
        if (Input.GetKeyDown(KeyCode.Space))   // ✗
            rb.AddForce(...);
    }
```

**✅ 이렇게 하면** — 빠르게 연타하면 가끔 씹힌다.

> **되돌린다.**

### Step 11 — FixedUpdate 호출 횟수

```csharp
public class FixedCounter : MonoBehaviour
{
    private int fixedCount, updateCount;
    private float timer;

    void FixedUpdate() { fixedCount++; }

    void Update()
    {
        updateCount++;
        timer += Time.deltaTime;

        if (timer >= 1f)
        {
            Debug.Log($"1초간  Update {updateCount}회,  FixedUpdate {fixedCount}회");
            timer = 0; updateCount = 0; fixedCount = 0;
        }
    }
}
```

**✅ 여기까지 실행하면**

```
   1초간  Update 60회,  FixedUpdate 50회
```

**`Application.targetFrameRate = 20;` 으로 낮춰 본다.**

```
   1초간  Update 20회,  FixedUpdate 50회

   ★ FixedUpdate는 프레임률과 무관하게 50회
```

```
   Edit → Project Settings → Time → Fixed Timestep
   0.02 → 0.01 로 바꾸면 100회
```

### Step 12 — 코루틴

```csharp
using System.Collections;
using UnityEngine;

public class CoroutineDemo : MonoBehaviour
{
    private Coroutine running;

    void Start()
    {
        running = StartCoroutine(Sequence());
    }

    IEnumerator Sequence()
    {
        Debug.Log("① 시작");
        yield return new WaitForSeconds(1f);

        Debug.Log("② 1초 경과 — 커지기 시작");

        float t = 0;
        Vector3 baseScale = transform.localScale;

        while (t < 2f)
        {
            t += Time.deltaTime;
            transform.localScale = baseScale * (1f + t * 0.5f);
            yield return null;                 // ★ 다음 프레임까지
        }

        Debug.Log("③ 커지기 끝 — 색 바꾸기");

        Renderer r = GetComponent<Renderer>();

        for (int i = 0; i < 5; i++)
        {
            r.material.color = new Color(Random.value, Random.value, Random.value);
            yield return new WaitForSeconds(0.3f);
        }

        Debug.Log("④ 완료");
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.R))
        {
            if (running != null) StopCoroutine(running);
            transform.localScale = Vector3.one;
            running = StartCoroutine(Sequence());
        }
    }
}
```

**✅ 여기까지 실행하면** — 순서대로 진행되고, R로 재시작된다.

```
   ① 시작
   (1초)
   ② 1초 경과 — 커지기 시작
   (2초 동안 서서히 커짐)
   ③ 커지기 끝 — 색 바꾸기
   (0.3초씩 5회)
   ④ 완료
```

### Step 13 — 코루틴 vs Update 비교

**같은 동작을 Update로 써 본다.**

```csharp
    private enum Phase { Wait, Grow, Color, Done }
    private Phase phase = Phase.Wait;
    private float timer;
    private int colorCount;

    void Update()
    {
        timer += Time.deltaTime;

        switch (phase)
        {
        case Phase.Wait:
            if (timer >= 1f) { phase = Phase.Grow; timer = 0; }
            break;

        case Phase.Grow:
            transform.localScale = Vector3.one * (1f + timer * 0.5f);
            if (timer >= 2f) { phase = Phase.Color; timer = 0; }
            break;

        case Phase.Color:
            if (timer >= 0.3f)
            {
                GetComponent<Renderer>().material.color =
                    new Color(Random.value, Random.value, Random.value);
                timer = 0;
                if (++colorCount >= 5) phase = Phase.Done;
            }
            break;
        }
    }
```

```
   ★ 비교

   코루틴:  위에서 아래로 읽힌다. 순서가 코드 모양에 드러난다
   Update:  상태 변수 + switch. 흐름이 흩어진다

   → 순차적 연출은 코루틴이 훨씬 읽기 쉽다
```

```
   ⚠️ 하지만 코루틴이 항상 낫진 않다

   ① 매 프레임 도는 로직 → Update
   ② GC 할당이 생긴다 (WaitForSeconds가 객체)
   ③ 디버깅이 조금 어렵다
```

```csharp
    // ★ WaitForSeconds 재사용으로 GC 줄이기
    private readonly WaitForSeconds wait03 = new WaitForSeconds(0.3f);

    // ...
        yield return wait03;                   // 매번 new 하지 않는다
```

### Step 14 — Inspector 어트리뷰트 정리

```csharp
using UnityEngine;

public class Mover : MonoBehaviour
{
    [Header("이동")]
    [Tooltip("초당 이동 거리")]
    [SerializeField] private float speed = 3f;

    [Range(0.5f, 10f)]
    [SerializeField] private float range = 4f;

    [Space(8)]
    [Header("회전")]
    [SerializeField] private float rotSpeed = 90f;
    [SerializeField] private bool rotate = true;

    [Space(8)]
    [Header("디버그")]
    [SerializeField] private bool showLog = false;

    private Vector3 startPos;
    private int direction = 1;

    void Start() { startPos = transform.position; }

    void Update()
    {
        transform.position += Vector3.right * speed * direction * Time.deltaTime;

        float offset = transform.position.x - startPos.x;
        if (offset >  range) direction = -1;
        if (offset < -range) direction =  1;

        if (rotate)
            transform.Rotate(Vector3.up, rotSpeed * Time.deltaTime);

        if (showLog)
            Debug.Log($"x={transform.position.x:F2}  dir={direction}");
    }
}
```

**✅ 여기까지 실행하면** — 1절의 Inspector 화면이 나온다.

<!-- SHOT: Step 14 정리된 Inspector -->

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────┬─────────────────────────┐
   │  Game                        │  Inspector              │
   │                              │                         │
   │       ┌───┐                  │ ☑ Player                │
   │       │   │ ◀──▶             │                         │
   │       └───┘                  │ ▾ Mover (Script)        │
   │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓             │   ─ 이동 ─              │
   │                              │   Speed     3           │
   ├──────────────────────────────┤   Range   ●────── 4     │
   │  Console                     │   ─ 회전 ─              │
   │  [0.000] Awake               │   Rot Speed 90          │
   │  [0.000] OnEnable            │   Rotate    ✔           │
   │  [0.000] Start               │   ─ 디버그 ─            │
   │  [0.020] FixedUpdate         │   Show Log  ☐           │
   │  [0.016] Update #1           │                         │
   │  [0.016] LateUpdate #1       │ ▾ Transform             │
   └──────────────────────────────┴─────────────────────────┘
```

- [ ] Console에 `Awake → OnEnable → Start → Update` 순서가 찍힌다
- [ ] Awake가 전부 끝난 뒤 Start가 시작된다
- [ ] 큐브가 Inspector 속도로 좌우 왕복한다
- [ ] **Play 중 Speed를 바꾸면 즉시 반영된다**
- [ ] `Time.deltaTime`을 빼면 프레임률에 따라 속도가 달라진다
- [ ] 큐브가 회전한다
- [ ] `[Header]`/`[Range]`/`[Tooltip]`이 Inspector에 반영된다
- [ ] GetComponent 캐싱이 60배 이상 빠르다
- [ ] `Find`가 매우 느리다는 것을 측정했다
- [ ] 카메라가 LateUpdate로 부드럽게 따라간다
- [ ] Update로 바꾸면 떨린다
- [ ] 스페이스로 점프한다 (입력은 Update, 물리는 FixedUpdate)
- [ ] FixedUpdate가 프레임률과 무관하게 초당 50회다
- [ ] 코루틴이 순서대로 진행된다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 스크립트가 안 붙음 | 파일명 ≠ 클래스명 | 이름 일치 |
| 스크립트가 안 붙음 | `MonoBehaviour` 미상속 | 상속 추가 |
| Inspector에 안 보임 | `private`만 있음 | `[SerializeField]` |
| `NullReferenceException` | `Awake`에서 남을 참조 | `Start`로 옮기기 |
| 프레임마다 속도 다름 | `deltaTime` 누락 | 곱하기 |
| 입력이 씹힘 | `GetKeyDown`을 FixedUpdate에 | Update에서 감지 |
| 카메라가 떨림 | `Update`에서 추적 | `LateUpdate` |
| 물리가 이상함 | `Update`에서 힘 적용 | `FixedUpdate` |
| Play 후 값이 원래대로 | Play 중 편집 | 정지 후 편집 |
| 코드 기본값이 무시됨 | Inspector 값이 우선 | 컴포넌트 Reset |
| 코루틴이 멈춤 | 오브젝트 비활성/파괴 | 활성 상태 확인 |
| 프레임이 뚝뚝 끊김 | GC 스파이크 | Day 74에서 다룸 |
| Console이 마비 | Update에서 Log | 조건부 로그 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **MonoBehaviour** | 파일명 = 클래스명. 상속 필수 |
| C# vs C++ | GC, 포인터 없음, `class`는 항상 참조 |
| 속성(Property) | `get`/`set`. Unity API 전반에 등장 |
| **`Awake`** | 자기 초기화, 컴포넌트 캐싱 |
| **`Start`** | 다른 오브젝트 참조 |
| Awake→Start 순서 | 모든 Awake가 끝난 뒤 모든 Start |
| **`Update`** | 매 프레임. 입력·게임 로직 |
| **`FixedUpdate`** | 고정 간격. 물리 (Day 67의 고정 스텝) |
| **`LateUpdate`** | Update 이후. 카메라 추적 |
| `Time.deltaTime` | Part 2에서 만든 것이 내장 |
| `[SerializeField]` | private + Inspector 노출 (권장) |
| **GetComponent 캐싱** | `Awake`에서 한 번. 60배 차이 |
| `Find` 금지 | 씬 전체 탐색. 매우 느림 |
| 코루틴 | `IEnumerator` + `yield return`. 순차 연출 |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| `Core::Update(dt)` | `Update()` |
| `Timer::Tick()` | `Time.deltaTime` |
| Day 67 고정 시간 스텝 | `FixedUpdate` |
| Day 64 선형 보간 | `Vector3.Lerp` |
| Day 53 순회 중 삭제 | `foreach` 중 수정 → 예외 |
| Day 51 비용 측정 | GetComponent/Find 벤치마크 |
| `OutputDebugString` | `Debug.Log` |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 73** | `FixedUpdate`에서 Rigidbody 제어 |
| Day 74 | 코루틴으로 스폰 주기 |
| Day 75 | `Time.timeScale`로 일시정지 |
| Day 81 | `LateUpdate` 카메라 |
| 전 구간 | 매일 쓴다 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 원형으로 도는 오브젝트 | `Mathf.Sin/Cos` + `Time.time` |
| ★★ | 3초마다 색이 변하며 커졌다 작아지는 코루틴 | `Mathf.PingPong` |
| ★★★ | 여러 오브젝트를 순차적으로 등장시키기 | 코루틴 + `WaitForSeconds(i * 0.2f)` |
| ★★★ | `Update`/`FixedUpdate`/`LateUpdate` 호출 횟수를 화면에 실시간 표시 | `OnGUI` 또는 다음 주 UI |

### 다음 시간

> 큐브가 왕복한다. 그런데 **내가 조종하는 게 아니다.**
>
> ```
>   런닝 게임에 필요한 것

>   ① 키를 누르면 점프
>   ② 바닥에 닿으면 다시 점프 가능
>   ③ 코인에 닿으면 획득
>   ④ 장애물에 닿으면 게임오버
> ```
>
> Part 2에서 직접 만든 **AABB 충돌 판정**이 Unity에서는 **Collider**다.
> 물리적으로 막는 것과 통과하는 것(**Trigger**)의 차이를 배운다.
>
> → **Day 73, 입력과 물리 — Rigidbody, Collider, Trigger**
