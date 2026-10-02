# Day 073 · 입력과 물리 — Rigidbody, Collider, Trigger

> **Week 15** · 연결 문서 `13 런닝 게임` — Step 2
> 선수: Day 072 (MonoBehaviour 생명주기), Day 024 (AABB 충돌)

---

## 1. 오늘 만드는 것

**캐릭터가 달리고 점프하며 바닥에 착지한다.** 코인을 먹고 장애물에 부딪힌다.

```
   ┌──────────────────────────────────────────────────────────┐
   │  Game                                                    │
   │                                                          │
   │                    ◆  ◆  ◆   ← 코인 (Trigger)            │
   │                                                          │
   │       ┌───┐                          ███                 │
   │       │ ● │  ← 점프 중               ███  ← 장애물        │
   │       └───┘                          ███                 │
   │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │
   │                                                          │
   ├──────────────────────────────────────────────────────────┤
   │  Console                                                 │
   │  [코인] 획득! 점수 3                                      │
   │  [착지] 접지 상태 진입                                    │
   │  [점프] 접지 → 공중                                       │
   └──────────────────────────────────────────────────────────┘
```

**조작** — 스페이스로 점프. 공중에서 눌러도 안 뛴다. 코인 위를 지나면 사라지며 점수가 오른다.

<!-- SHOT: Day 73 완성 화면 -->

---

## 2. 막히는 상황

어제 만든 `SimpleJump`로 놀아 보자.

```
   스페이스를 연타한다

   → 계속 위로 올라간다
   → 화면 밖으로 사라진다
```

```
   ★ 무한 점프

   "바닥에 있을 때만 점프" 판정이 없다
```

```
   그리고

   × 코인을 만들어도 아무 일 없다
   × 장애물에 부딪혀도 통과한다
```

```
   Part 2에서는 어떻게 했나

   Day 24:  AABB로 겹침 검사
            if (a.x < b.x + b.w && ...) → 충돌

   Day 22:  겹치면 위치를 보정 + 속도 반사
```

```
   Unity에서는

   Collider 를 붙인다
   → 물리 엔진이 알아서 겹침을 찾고 밀어낸다

   그런데 "밀어내는 것"과 "통과하되 알려주는 것"은 다르다
```

> **Collider와 Trigger의 차이를 배운다.**

---

## 3. 개념

### 3-1. 입력 — Part 2의 3상태

**왜 필요한가** — Day 23에서 만든 것과 완전히 같다.

| Unity | Part 2 | 의미 |
|---|---|---|
| `Input.GetKeyDown(k)` | `IsKeyDown` | 누른 **순간** 1프레임 |
| `Input.GetKey(k)` | `IsKeyPress` | 누르고 **있는 동안** |
| `Input.GetKeyUp(k)` | `IsKeyUp` | 뗀 **순간** 1프레임 |

```
   시간 →

   실제 키:   ░░░████████████░░░░
              ↑              ↑
   GetKeyDown ▮              ·        1프레임만
   GetKey     ░░░████████████░░░
   GetKeyUp   ·              ▮        1프레임만
```

```csharp
    if (Input.GetKeyDown(KeyCode.Space)) Jump();      // 점프 = 순간
    if (Input.GetKey(KeyCode.LeftShift)) Run();       // 달리기 = 지속
    if (Input.GetKeyUp(KeyCode.Space))   ReleaseJump(); // 가변 점프
```

**축(Axis) 입력**

```csharp
    float h = Input.GetAxis("Horizontal");     // -1 ~ 1, 부드럽게
    float v = Input.GetAxis("Vertical");

    float hRaw = Input.GetAxisRaw("Horizontal");  // -1, 0, 1 만
```

```
   GetAxis vs GetAxisRaw

   GetAxis:     키를 떼도 서서히 0으로 (관성)
                → 자동차, 부드러운 이동

   GetAxisRaw:  즉시 0
                → 플랫포머, 정확한 조작
```

```
   ★ 기본 축 이름

   Horizontal   A/D, ←/→
   Vertical     W/S, ↑/↓
   Jump         Space
   Fire1        좌클릭 / Ctrl

   Edit → Project Settings → Input Manager 에서 확인/수정
```

```
   ⚠️ 신 Input System 패키지

   Unity 6에서는 새 Input System도 있다
   → 게임패드/터치 대응이 좋다
   → 하지만 설정이 복잡

   이 커리큘럼은 구 Input Manager로 진행한다
   (개념은 같고, 나중에 옮기기 쉽다)
```

### 3-2. Rigidbody

**왜 필요한가** — 물리 시뮬레이션의 주체.

| 필드 | 의미 | Part 2 대응 |
|---|---|---|
| Mass | 질량 | 없음 (직접 안 만듦) |
| Drag | 공기 저항 | `vx *= 0.98` |
| Angular Drag | 회전 저항 | — |
| **Use Gravity** | 중력 적용 | `vy += g * dt` |
| **Is Kinematic** | 물리 무시, 코드로만 이동 | 직접 위치 제어 |
| Interpolate | 프레임 간 보간 | — |
| **Collision Detection** | 충돌 검출 방식 | Day 22 터널링 |
| Constraints | 위치/회전 고정 | — |

```
   ★ Rigidbody가 있어야 물리가 돈다

   Collider만 있고 Rigidbody가 없으면
   → "움직이지 않는 벽"이 된다
```

**세 종류의 오브젝트**

```
   ┌─────────────────┬──────────┬──────────┬────────────────┐
   │                 │ Collider │ Rigidbody│ 용도            │
   ├─────────────────┼──────────┼──────────┼────────────────┤
   │ 정적 (Static)    │    ✔     │    ✗     │ 바닥, 벽        │
   │ 동적 (Dynamic)   │    ✔     │    ✔     │ 플레이어, 상자  │
   │ 키네마틱         │    ✔     │ ✔(Kine)  │ 움직이는 플랫폼 │
   └─────────────────┴──────────┴──────────┴────────────────┘
```

```
   ⚠️ 정적 오브젝트를 코드로 움직이면 안 된다

   물리 엔진이 "안 움직인다"고 가정해 최적화한다
   → 움직이면 충돌이 이상해진다

   움직여야 하면 → Is Kinematic Rigidbody를 붙인다
```

### 3-3. 이동 방식 3종

**왜 필요한가** — 상황에 맞는 것을 골라야 한다.

```csharp
    // ① Transform 직접
    transform.position += Vector3.forward * speed * Time.deltaTime;

    // ② 속도 지정
    rb.linearVelocity = new Vector3(x, rb.linearVelocity.y, z);

    // ③ 힘 가하기
    rb.AddForce(Vector3.forward * force);
```

| 방식 | 물리 충돌 | 반응성 | 용도 |
|---|:--:|:--:|---|
| **Transform** | **무시(뚫음)** | 즉각 | UI, 물리 없는 오브젝트 |
| **velocity** | 정상 | 즉각 | **캐릭터 이동** ★ |
| **AddForce** | 정상 | 관성 | 차량, 공, 밀기 |

```
   ⚠️ Rigidbody가 있는데 transform으로 움직이면

   물리 엔진 몰래 순간이동하는 셈
   → 벽을 뚫는다
   → 충돌이 튄다

   Rigidbody가 있으면 velocity/AddForce/MovePosition을 쓴다
```

```csharp
    // ★ Kinematic Rigidbody는 MovePosition
    rb.MovePosition(rb.position + move * Time.fixedDeltaTime);
```

```
   ★ Unity 6에서 이름이 바뀌었다

   rb.velocity          →  rb.linearVelocity
   rb.angularVelocity   →  그대로

   구 이름도 아직 되지만 경고가 뜬다
```

### 3-4. ForceMode

**왜 필요한가** — `AddForce`의 네 가지 해석.

| 모드 | 의미 | 질량 영향 | 용도 |
|---|---|:--:|---|
| `Force` | 지속적인 힘 | ✔ | 바람, 엔진 |
| `Acceleration` | 지속적인 가속 | ✗ | 중력 같은 것 |
| **`Impulse`** | **순간 충격** | ✔ | **점프, 폭발** |
| `VelocityChange` | 순간 속도 변화 | ✗ | 즉각 속도 지정 |

```csharp
    // 점프 — 순간적인 충격
    rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
```

```
   ⚠️ ForceMode.Force로 점프하면

   FixedUpdate 1회 분량의 힘만 들어간다
   → 거의 안 뛴다
```

```
   ★ 점프 높이를 직접 계산하려면

   v = √(2 × g × h)

   h = 2m, g = 9.81  →  v = 6.26
   질량이 1이면 Impulse 6.26
```

```csharp
    [SerializeField] private float jumpHeight = 2f;

    void Jump()
    {
        float g = Mathf.Abs(Physics.gravity.y);
        float v = Mathf.Sqrt(2f * g * jumpHeight);

        // ★ 현재 수직 속도를 지우고 새로 설정 (일정한 높이 보장)
        Vector3 vel = rb.linearVelocity;
        vel.y = v;
        rb.linearVelocity = vel;
    }
```

```
   ★ Day 67의 공식이 그대로 쓰인다

   H = vy² / (2g)   →   vy = √(2gH)
```

### 3-5. Collider

**왜 필요한가** — Part 2의 AABB를 엔진이 대신한다.

| 종류 | 모양 | 비용 | 용도 |
|---|---|:--:|---|
| **Box Collider** | 상자 | 낮음 | 상자, 벽, 대부분 |
| **Sphere Collider** | 구 | **가장 낮음** | 공, 감지 범위 |
| **Capsule Collider** | 캡슐 | 낮음 | **캐릭터** |
| Mesh Collider | 실제 메시 | **높음** | 지형, 복잡한 정적 물체 |

```
   ★ Day 24에서 AABB를 쓴 이유

   "가장 빠른 판정"

   Unity도 같다
   Sphere < Box < Capsule < Mesh  순으로 비싸다
```

```
   ⚠️ Mesh Collider 주의

   ① 매우 비싸다
   ② Convex 체크를 안 하면 다른 Mesh Collider와 충돌 안 함
   ③ 움직이는 물체엔 거의 안 쓴다

   → 캐릭터는 Capsule, 아이템은 Sphere/Box
```

**왜 캐릭터는 캡슐인가**

```
   Box                      Capsule

   ┌─────┐                    ╭───╮
   │     │                    │   │
   │     │                    │   │
   └─────┘                    ╰───╯
   ▓▓▓▓▓▓▓▓                 ▓▓▓▓▓▓▓▓
   모서리가 걸린다            부드럽게 넘어간다
```

### 3-6. Collision vs Trigger

**왜 필요한가** — 오늘의 핵심.

| | Collision | Trigger |
|---|---|---|
| 물리적으로 막나 | **O** | **X (통과)** |
| `isTrigger` | 해제 | **체크** |
| 콜백 | `OnCollisionEnter/Stay/Exit` | `OnTriggerEnter/Stay/Exit` |
| 인자 | `Collision` (접점 정보 포함) | `Collider` |
| 쓰는 곳 | 바닥, 벽, 상자 | 아이템, 감지 범위, 골 지점 |
| **Part 2 대응** | AABB + **위치 보정** | AABB **판정만** |

```
   Collision                    Trigger

   ┌───┐                        ┌───┐
   │ ● │→  ███                  │ ● │→ ░░░
   └───┘   ███                  └───┘  ░░░
           벽                          아이템

   ┌───┐                             ┌───┐
   │ ● │███                     ░░░░░│ ● │
   └───┘███                     ░░░░░└───┘
   막힌다                        통과 + 콜백
```

```csharp
    // 물리적 충돌
    void OnCollisionEnter(Collision col)
    {
        Debug.Log($"부딪힘: {col.gameObject.name}");

        // ★ 접점 정보를 쓸 수 있다
        ContactPoint cp = col.contacts[0];
        Debug.Log($"접점 {cp.point}, 법선 {cp.normal}");
    }

    // 트리거
    void OnTriggerEnter(Collider other)
    {
        Debug.Log($"진입: {other.gameObject.name}");
    }
```

### 3-7. ⚠️ 콜백이 안 불리는 이유

**왜 필요한가** — 가장 흔한 좌절.

```
   ★ 충돌 콜백이 불리는 조건

   ① 양쪽 모두 Collider가 있다
   ② 둘 중 최소 하나에 Rigidbody가 있다
   ③ 레이어 충돌 매트릭스가 허용한다
   ④ 둘 다 활성 상태다
```

```
   ⚠️ ②가 핵심이다

   벽(Collider만) + 코인(Collider만)
   → 아무리 겹쳐도 콜백 없음

   플레이어(Collider + Rigidbody) + 코인(Collider)
   → 콜백 호출됨  ✔
```

**충돌 매트릭스**

```
              Rigidbody   Kinematic   정적
              +Collider   +Collider   Collider
   ─────────────────────────────────────────────
   Rigidbody      ✔          ✔          ✔
   Kinematic      ✔          ✗          ✗
   정적           ✔          ✗          ✗

   ✔ = 콜백 호출됨
```

```
   ★ 정적끼리는 절대 콜백이 없다

   "코인이 벽에 닿았는지"를 알고 싶다면
   둘 중 하나에 Kinematic Rigidbody를 붙인다
```

```
   ⚠️ Trigger는 예외 규칙이 조금 다르다

   Kinematic ↔ 정적Trigger  → 호출됨
   정적 ↔ 정적              → 호출 안 됨
```

### 3-8. 바닥 판정 (접지 검사)

**왜 필요한가** — 무한 점프를 막는다.

**방법 1 — Raycast (권장)**

```csharp
    [SerializeField] private float groundCheckDist = 0.15f;
    [SerializeField] private LayerMask groundLayer;

    private bool IsGrounded()
    {
        // ★ 발밑으로 짧은 광선을 쏜다
        Vector3 origin = transform.position + Vector3.up * 0.05f;

        return Physics.Raycast(origin, Vector3.down,
                               groundCheckDist + 0.05f, groundLayer);
    }
```

```
        ┌───┐
        │ ● │
        └─┬─┘
          │  ← Raycast (짧게 아래로)
       ▓▓▓▓▓▓▓
       맞으면 접지
```

**방법 2 — SphereCast (모서리에 강함)**

```csharp
    private bool IsGrounded()
    {
        Vector3 origin = transform.position + Vector3.up * 0.3f;

        return Physics.SphereCast(origin, 0.25f, Vector3.down,
                                  out RaycastHit hit, 0.2f, groundLayer);
    }
```

```
   Raycast              SphereCast

        │                   ○
        │                 (구가 내려간다)
     ▓▓▓ ▓▓▓            ▓▓▓ ▓▓▓
     틈에 빠지면 실패      틈을 건너뛴다
```

**방법 3 — OnCollisionStay + 법선 검사**

```csharp
    private bool grounded;

    void OnCollisionStay(Collision col)
    {
        foreach (ContactPoint cp in col.contacts)
        {
            // ★ 접점의 법선이 위를 향하면 바닥
            if (Vector3.Dot(cp.normal, Vector3.up) > 0.6f)
            {
                grounded = true;
                return;
            }
        }
    }

    void OnCollisionExit(Collision col) { grounded = false; }
```

```
   법선(normal) = 표면이 향하는 방향

   바닥:  normal = (0, 1, 0)      위를 향함  → Dot = 1
   벽:    normal = (1, 0, 0)      옆을 향함  → Dot = 0
   천장:  normal = (0, -1, 0)     아래       → Dot = -1

   ★ Dot > 0.6 이면 "충분히 평평한 바닥"
     (경사 약 53도까지 허용)
```

| 방법 | 장점 | 단점 |
|---|---|---|
| Raycast | 단순, 빠름 | 발 끝만 검사 |
| **SphereCast** | 모서리·틈에 강함 | 약간 비쌈 |
| Collision 법선 | 정확 | Exit 타이밍 문제 |

### 3-9. LayerMask

**왜 필요한가** — Day 54의 "그룹별 충돌"이 설정으로 존재한다.

```
   레이어 만들기

   Inspector 상단 Layer 드롭다운 → Add Layer
   → User Layer 6: Ground
   → User Layer 7: Player
   → User Layer 8: Obstacle
   → User Layer 9: Coin
```

```
   충돌 매트릭스

   Edit → Project Settings → Physics
   → Layer Collision Matrix

              Def  Grd  Ply  Obs  Coin
   Default     ✔    ✔    ✔    ✔    ✔
   Ground      ✔    ✗    ✔    ✗    ✗
   Player      ✔    ✔    ✗    ✔    ✔
   Obstacle    ✔    ✗    ✔    ✗    ✗
   Coin        ✔    ✗    ✔    ✗    ✗
```

```
   ★ Day 54에서 직접 만든 그것

   Part 2:  if (a.group == GROUP_PLAYER && b.group == GROUP_ENEMY)
   Unity:   체크박스

   효과도 같다 — 불필요한 검사를 아예 안 한다
```

```csharp
    [SerializeField] private LayerMask groundLayer;    // Inspector에서 선택

    // 코드로 만들려면
    int mask = 1 << LayerMask.NameToLayer("Ground");
    int multi = LayerMask.GetMask("Ground", "Platform");
```

```
   ★ LayerMask는 비트 마스크다

   레이어 6  →  1 << 6  →  0100 0000

   Day 17의 enum·비트 플래그가 여기서 쓰인다
```

### 3-10. 터널링과 Collision Detection

**왜 필요한가** — Day 22, Day 67에서 만난 그 문제.

```
   빠른 오브젝트가 얇은 벽을 통과한다

   프레임 N   : 벽 앞
   프레임 N+1 : 벽 뒤

   → 겹친 순간이 없어서 검출 실패
```

| 모드 | 방식 | 비용 |
|---|---|:--:|
| **Discrete** | 매 스텝 위치에서만 검사 | 낮음 (기본) |
| **Continuous** | 이동 경로를 따라 검사 | 중간 |
| **Continuous Dynamic** | 움직이는 물체끼리도 | 높음 |
| Continuous Speculative | 예측 기반 | 중간 |

```
   ★ Day 67에서 직접 만든 "이동 분할"

   Part 2:  for (i < steps) StepPhysics(dt/steps);
   Unity:   Collision Detection 드롭다운 하나
```

```
   ⚠️ 무조건 Continuous로 두지 않는다

   비용이 든다
   → 빠른 물체(총알, 낙하체)만 켠다
```

### 3-11. Constraints

**왜 필요한가** — 캐릭터가 넘어지는 것을 막는다.

```
   Rigidbody → Constraints

   Freeze Position   X ☐  Y ☐  Z ☐
   Freeze Rotation   X ☑  Y ☐  Z ☑    ← 앞뒤/좌우로 안 넘어짐
```

```
   ★ 런닝 게임 캐릭터

   Freeze Rotation X, Z  체크
   → 넘어지지 않고 서 있는다
   → Y 회전은 남겨 방향 전환 가능
```

```
   ★ 3레인 러너라면

   Freeze Position Z 도 체크 (앞으로만 이동)
```

### 3-12. Physics Material

**왜 필요한가** — 마찰과 탄성.

```
   Project → Create → Physics Material
```

| 필드 | 의미 |
|---|---|
| Dynamic Friction | 움직일 때 마찰 |
| Static Friction | 정지 시 마찰 |
| **Bounciness** | 탄성 (0 = 안 튐, 1 = 완전 반사) |
| Friction Combine | 두 물체 마찰 합성 방식 |
| Bounce Combine | 탄성 합성 방식 |

```
   ★ Day 22에서 만든 반사

   Part 2:  if (충돌) vy = -vy * 0.8;
   Unity:   Bounciness = 0.8
```

```
   ⚠️ 벽에 붙어서 안 떨어질 때

   마찰이 원인
   → Friction 0, Combine = Minimum 인 머티리얼을 캐릭터에
```

---

## 4. 따라 만들기

### Step 1 — 레이어 준비

```
   Layer 추가
   6: Ground
   7: Player
   8: Obstacle
   9: Coin
```

```
   Ground → Layer: Ground
   Player → Layer: Player
```

**✅ 여기까지 하면** — Inspector 상단에서 레이어가 지정된다.

### Step 2 — 플레이어 준비

```
   Player 선택
   ① Box Collider 제거 → Capsule Collider 추가
      Height 2, Radius 0.5, Center (0, 0, 0)
   ② Rigidbody
      Mass 1, Use Gravity ✔
      Constraints: Freeze Rotation X ✔ Z ✔
   ③ Mesh를 Capsule로 바꾸거나 Cube 그대로 둔다
```

```
   Position (0, 1, 0)                       ← 캡슐 높이 2의 절반
```

**어제 만든 `Mover`는 제거한다.**

**✅ 여기까지 실행하면** — Play 시 캡슐이 바닥에 서 있고 넘어지지 않는다.

### Step 3 — 이동

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PlayerController : MonoBehaviour
{
    [Header("이동")]
    [SerializeField] private float moveSpeed = 6f;

    private Rigidbody rb;
    private float inputH;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        inputH = Input.GetAxisRaw("Horizontal");   // ★ 입력은 Update
    }

    void FixedUpdate()
    {
        // ★ 물리는 FixedUpdate
        Vector3 v = rb.linearVelocity;
        v.x = inputH * moveSpeed;
        rb.linearVelocity = v;                     // ★ y는 건드리지 않는다
    }
}
```

```
   ⚠️ v.y 를 건드리면 안 된다

   rb.linearVelocity = new Vector3(x, 0, z);      ✗ 중력이 무효화된다
   rb.linearVelocity = new Vector3(x, v.y, z);    ✔
```

**✅ 여기까지 실행하면** — A/D 또는 ←/→ 로 좌우 이동한다.

### Step 4 — 무한 점프 재현

```csharp
    [Header("점프")]
    [SerializeField] private float jumpHeight = 2f;

    private bool jumpPressed;

    void Update()
    {
        inputH = Input.GetAxisRaw("Horizontal");

        if (Input.GetKeyDown(KeyCode.Space))
            jumpPressed = true;
    }

    void FixedUpdate()
    {
        Vector3 v = rb.linearVelocity;
        v.x = inputH * moveSpeed;

        if (jumpPressed)
        {
            jumpPressed = false;

            float g = Mathf.Abs(Physics.gravity.y);
            v.y = Mathf.Sqrt(2f * g * jumpHeight);
        }

        rb.linearVelocity = v;
    }
```

**✅ 여기까지 실행하면** — 스페이스를 연타하면 **끝없이 올라간다.**

<!-- SHOT: Step 4 무한 점프 -->

> ### ★ 이 문제를 고치는 것이 오늘의 핵심이다

### Step 5 — 접지 판정 (Raycast)

```csharp
    [Header("접지 판정")]
    [SerializeField] private LayerMask groundLayer;
    [SerializeField] private float groundCheckDist = 0.2f;
    [SerializeField] private bool showGizmo = true;

    private bool grounded;

    void FixedUpdate()
    {
        grounded = CheckGrounded();                // ★

        Vector3 v = rb.linearVelocity;
        v.x = inputH * moveSpeed;

        if (jumpPressed && grounded)               // ★ 접지 시에만
        {
            jumpPressed = false;
            float g = Mathf.Abs(Physics.gravity.y);
            v.y = Mathf.Sqrt(2f * g * jumpHeight);
        }
        else
        {
            jumpPressed = false;                   // ★ 버퍼 소비
        }

        rb.linearVelocity = v;
    }

    private bool CheckGrounded()
    {
        Vector3 origin = transform.position + Vector3.up * 0.1f;

        return Physics.Raycast(origin, Vector3.down,
                               groundCheckDist + 0.1f, groundLayer);
    }

    void OnDrawGizmos()
    {
        if (!showGizmo) return;

        Vector3 origin = transform.position + Vector3.up * 0.1f;

        Gizmos.color = grounded ? Color.green : Color.red;
        Gizmos.DrawLine(origin, origin + Vector3.down * (groundCheckDist + 0.1f));
    }
```

**Inspector에서 Ground Layer를 `Ground`로 설정한다.**

**✅ 여기까지 실행하면**

```
   ① 스페이스로 한 번 뛴다
   ② 공중에서 눌러도 안 뛴다
   ③ 착지하면 다시 뛴다
   ④ Scene 뷰에 초록/빨강 선이 보인다
```

<!-- SHOT: Step 5 접지 기즈모 -->

```
   ★ OnDrawGizmos

   Scene 뷰에만 그려지는 디버그 그림
   → Part 2에서 디버그 사각형을 그리던 것과 같다
```

### Step 6 — 접지 판정 실패 실험

**Inspector에서 Ground Layer를 `Nothing`으로 바꾼다.**

```
   → 아예 점프가 안 된다 (항상 grounded = false)
```

**Ground Layer를 `Everything`으로 바꾼다.**

```
   → 자기 자신의 Collider에 맞아 항상 grounded = true
   → 다시 무한 점프
```

```
   ★ 레이어를 정확히 지정해야 한다

   Ground만 체크
```

> **되돌린다.**

### Step 7 — SphereCast로 개선

**바닥에 좁은 틈을 만든다.** (Ground를 두 개로 나누고 사이를 벌린다)

```
   Raycast 방식에서 틈 위에 서면
   → grounded = false
   → 점프가 안 된다
```

```csharp
    private bool CheckGrounded()
    {
        Vector3 origin = transform.position + Vector3.up * 0.4f;

        return Physics.SphereCast(origin, 0.35f, Vector3.down,
                                  out RaycastHit hit,
                                  0.25f, groundLayer);
    }
```

**✅ 여기까지 실행하면** — 좁은 틈 위에서도 점프가 된다.

### Step 8 — 점프 버퍼와 코요테 타임

```csharp
    [Header("조작감")]
    [SerializeField] private float jumpBuffer = 0.12f;
    [SerializeField] private float coyoteTime = 0.1f;

    private float jumpBufferTimer;
    private float coyoteTimer;

    void Update()
    {
        inputH = Input.GetAxisRaw("Horizontal");

        if (Input.GetKeyDown(KeyCode.Space))
            jumpBufferTimer = jumpBuffer;          // ★ 입력을 잠시 기억
        else
            jumpBufferTimer -= Time.deltaTime;
    }

    void FixedUpdate()
    {
        grounded = CheckGrounded();

        if (grounded) coyoteTimer = coyoteTime;    // ★ 발판을 떠나도 잠시 유지
        else          coyoteTimer -= Time.fixedDeltaTime;

        Vector3 v = rb.linearVelocity;
        v.x = inputH * moveSpeed;

        if (jumpBufferTimer > 0 && coyoteTimer > 0)
        {
            jumpBufferTimer = 0;
            coyoteTimer = 0;

            float g = Mathf.Abs(Physics.gravity.y);
            v.y = Mathf.Sqrt(2f * g * jumpHeight);
        }

        rb.linearVelocity = v;
    }
```

```
   ★ 두 가지 관용

   점프 버퍼:  착지 직전에 눌러도 착지하면 뛴다
               ┌───┐
               │ ● │ 스페이스!
               └───┘
                 ↓  아직 공중
              ▓▓▓▓▓  착지 → 바로 점프  ✔

   코요테 타임: 발판을 떠난 직후에도 잠깐 뛸 수 있다
              ▓▓▓┐  ┌───┐
                 │  │ ● │ 스페이스!
                 └  └───┘
              떨어지기 시작한 직후에도 허용  ✔
```

```
   ★ 이 두 가지가 "조작감"을 만든다

   물리적으로는 부정확하지만
   플레이어의 의도에 맞다
```

**✅ 여기까지 실행하면** — 점프가 훨씬 부드럽게 느껴진다.

### Step 9 — 가변 점프 높이

```csharp
    [SerializeField] private float lowJumpMultiplier = 2.5f;
    [SerializeField] private float fallMultiplier = 2f;

    void FixedUpdate()
    {
        // ... 기존 코드 ...

        // ★ 떨어질 때 더 빠르게
        if (v.y < 0)
        {
            v.y += Physics.gravity.y * (fallMultiplier - 1f) * Time.fixedDeltaTime;
        }
        // ★ 올라가는 중에 키를 뗐으면 빨리 감속
        else if (v.y > 0 && !Input.GetKey(KeyCode.Space))
        {
            v.y += Physics.gravity.y * (lowJumpMultiplier - 1f) * Time.fixedDeltaTime;
        }

        rb.linearVelocity = v;
    }
```

**✅ 여기까지 실행하면**

```
   짧게 누름  →  낮게 점프
   길게 누름  →  높게 점프

   ★ 마리오식 점프
```

### Step 10 — 코인 (Trigger)

```
   Hierarchy → 3D Object → Sphere
   이름: Coin
   Layer: Coin
   Scale (0.4, 0.4, 0.4)
   Sphere Collider → Is Trigger ✔
```

```csharp
using UnityEngine;

public class Coin : MonoBehaviour
{
    [SerializeField] private int value = 1;
    [SerializeField] private float rotSpeed = 120f;

    void Update()
    {
        transform.Rotate(Vector3.up, rotSpeed * Time.deltaTime);
    }

    void OnTriggerEnter(Collider other)
    {
        // ★ 플레이어만 반응
        if (!other.CompareTag("Player")) return;

        GameManager.Instance.AddScore(value);

        Debug.Log($"[코인] 획득! 점수 {GameManager.Instance.Score}");

        Destroy(gameObject);
    }
}
```

```
   ⚠️ CompareTag를 쓴다

   other.tag == "Player"      →  문자열 비교 + GC 할당
   other.CompareTag("Player") →  더 빠르고 할당 없음
```

```
   Player의 Tag를 "Player"로 설정
   (Inspector 상단 Tag 드롭다운)
```

### Step 11 — GameManager

```csharp
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public int Score { get; private set; }
    public bool IsGameOver { get; private set; }

    void Awake()
    {
        // ★ Awake에서 등록 (Day 72)
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    public void AddScore(int v)
    {
        if (IsGameOver) return;
        Score += v;
    }

    public void GameOver()
    {
        if (IsGameOver) return;

        IsGameOver = true;
        Debug.Log($"[게임오버] 최종 점수 {Score}");

        Time.timeScale = 0f;                   // ★ 시간 정지
    }
}
```

**빈 오브젝트 `GameManager`를 만들어 붙인다.**

**✅ 여기까지 실행하면** — 코인 위를 지나면 사라지고 Console에 점수가 찍힌다.

<!-- SHOT: Step 11 코인 획득 -->

### Step 12 — 장애물 (Collision)

```
   Cube 생성
   이름: Obstacle
   Layer: Obstacle
   Is Trigger ✗ (해제 상태)
```

```csharp
using UnityEngine;

public class Obstacle : MonoBehaviour
{
    void OnCollisionEnter(Collision col)
    {
        if (!col.gameObject.CompareTag("Player")) return;

        // ★ 접점 정보 활용
        ContactPoint cp = col.contacts[0];

        Debug.Log($"[충돌] 접점 {cp.point}, 법선 {cp.normal}, " +
                  $"상대속도 {col.relativeVelocity.magnitude:F1}");

        // 위에서 밟은 경우는 통과 (법선이 위를 향함)
        if (Vector3.Dot(cp.normal, Vector3.up) > 0.6f)
        {
            Debug.Log("→ 위에서 밟음. 안전");
            return;
        }

        GameManager.Instance.GameOver();
    }
}
```

**✅ 여기까지 실행하면**

```
   옆에서 부딪힘  →  막히고 게임오버
   위에서 밟음    →  올라선다 (안전)
```

### Step 13 — Trigger로 바꿔 보기

**Obstacle의 Box Collider에서 Is Trigger를 체크한다.**

**`OnCollisionEnter`는 더 이상 호출되지 않는다.**

```csharp
    void OnTriggerEnter(Collider other)        // ★ 이걸로 바꿔야 한다
    {
        if (!other.CompareTag("Player")) return;
        GameManager.Instance.GameOver();
    }
```

**✅ 이렇게 하면**

```
   장애물을 통과하면서 게임오버
   → 막히지 않는다
```

> ### ★ 이것이 Collision과 Trigger의 차이다
>
> **되돌린다** (Is Trigger 해제, `OnCollisionEnter` 사용).

### Step 14 — 콜백이 안 불리는 실험

**Player의 Rigidbody를 제거한다.**

**✅ 이렇게 하면**

```
   ① 중력이 사라진다 (공중에 뜬다)
   ② 코인 Trigger가 호출되지 않는다
   ③ 장애물 Collision도 호출되지 않는다
```

```
   ★ 3-7절의 조건 ②

   "둘 중 최소 하나에 Rigidbody"
```

**코인에 Rigidbody를 붙이고 Is Kinematic을 체크해 본다.**

```
   → Trigger가 다시 호출된다
```

> **되돌린다** (Player에 Rigidbody 복구).

### Step 15 — 충돌 매트릭스

```
   Edit → Project Settings → Physics
   → Layer Collision Matrix

   Coin 행에서 Obstacle 체크 해제
   Ground 행에서 Coin, Obstacle 체크 해제
```

```
   ★ Day 54의 그룹별 충돌

   불필요한 조합을 아예 검사하지 않는다
   → 오브젝트가 많아질수록 이득
```

**✅ 여기까지 하면** — 동작은 같지만 물리 계산량이 줄어든다.

### Step 16 — 터널링 실험

```csharp
    // 임시: 매우 빠른 낙하 테스트
    if (Input.GetKeyDown(KeyCode.T))
        rb.linearVelocity = new Vector3(0, -200f, 0);
```

**얇은 바닥(Scale Y = 0.05)을 만들고 T를 누른다.**

**✅ 이렇게 하면** — **바닥을 뚫고 떨어진다.**

```
   Rigidbody → Collision Detection → Continuous
```

**✅ 고치면** — 뚫지 않는다.

```
   ★ Day 22, Day 67에서 만난 터널링

   Part 2:  이동 분할 코드를 직접 작성
   Unity:   드롭다운 하나
```

### Step 17 — Physics Material

```
   Create → Physics Material
   이름: PM_NoFriction
   Dynamic Friction 0
   Static Friction 0
   Friction Combine: Minimum
```

**Player의 Capsule Collider → Material에 지정한다.**

**✅ 여기까지 실행하면** — 벽에 붙어서 안 떨어지는 현상이 사라진다.

**탄성 테스트용으로 `PM_Bouncy` (Bounciness 0.8)를 만들어 공에 적용해 본다.**

```
   ★ Day 22에서 만든 반사가 설정 하나로
```

### Step 18 — 정리

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PlayerController : MonoBehaviour
{
    [Header("이동")]
    [SerializeField] private float moveSpeed = 6f;

    [Header("점프")]
    [SerializeField] private float jumpHeight = 2f;
    [SerializeField] private float fallMultiplier = 2f;
    [SerializeField] private float lowJumpMultiplier = 2.5f;

    [Header("조작감")]
    [SerializeField] private float jumpBuffer = 0.12f;
    [SerializeField] private float coyoteTime = 0.1f;

    [Header("접지 판정")]
    [SerializeField] private LayerMask groundLayer;
    [SerializeField] private float groundCheckRadius = 0.35f;
    [SerializeField] private float groundCheckDist = 0.25f;
    [SerializeField] private bool showGizmo = true;

    private Rigidbody rb;
    private float inputH;
    private float jumpBufferTimer;
    private float coyoteTimer;
    private bool grounded;
    private bool wasGrounded;

    public bool IsGrounded => grounded;        // ★ 읽기 전용 속성

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        if (GameManager.Instance.IsGameOver) return;

        inputH = Input.GetAxisRaw("Horizontal");

        if (Input.GetKeyDown(KeyCode.Space)) jumpBufferTimer = jumpBuffer;
        else                                 jumpBufferTimer -= Time.deltaTime;
    }

    void FixedUpdate()
    {
        if (GameManager.Instance.IsGameOver) return;

        wasGrounded = grounded;
        grounded = CheckGrounded();

        if (grounded && !wasGrounded) Debug.Log("[착지] 접지 상태 진입");

        if (grounded) coyoteTimer = coyoteTime;
        else          coyoteTimer -= Time.fixedDeltaTime;

        Vector3 v = rb.linearVelocity;
        v.x = inputH * moveSpeed;

        if (jumpBufferTimer > 0 && coyoteTimer > 0)
        {
            jumpBufferTimer = 0;
            coyoteTimer = 0;

            float g = Mathf.Abs(Physics.gravity.y);
            v.y = Mathf.Sqrt(2f * g * jumpHeight);

            Debug.Log("[점프] 접지 → 공중");
        }

        if (v.y < 0)
            v.y += Physics.gravity.y * (fallMultiplier - 1f) * Time.fixedDeltaTime;
        else if (v.y > 0 && !Input.GetKey(KeyCode.Space))
            v.y += Physics.gravity.y * (lowJumpMultiplier - 1f) * Time.fixedDeltaTime;

        rb.linearVelocity = v;
    }

    private bool CheckGrounded()
    {
        Vector3 origin = transform.position + Vector3.up * (groundCheckRadius + 0.05f);

        return Physics.SphereCast(origin, groundCheckRadius, Vector3.down,
                                  out RaycastHit hit, groundCheckDist, groundLayer);
    }

    void OnDrawGizmos()
    {
        if (!showGizmo) return;

        Vector3 origin = transform.position + Vector3.up * (groundCheckRadius + 0.05f);
        Vector3 end = origin + Vector3.down * groundCheckDist;

        Gizmos.color = grounded ? Color.green : Color.red;
        Gizmos.DrawWireSphere(end, groundCheckRadius);
        Gizmos.DrawLine(origin, end);
    }
}
```

**✅ 최종** — 1절의 화면.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────────────────────────────────┐
   │  Game                                                    │
   │                    ◆  ◆  ◆                                │
   │                                                          │
   │       ┌───┐                          ███                 │
   │       │ ● │                          ███                 │
   │       └───┘                          ███                 │
   │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │
   ├──────────────────────────────────────────────────────────┤
   │  Console                                                 │
   │  [점프] 접지 → 공중                                       │
   │  [코인] 획득! 점수 1                                      │
   │  [착지] 접지 상태 진입                                    │
   │  [충돌] 접점 (5.0, 1.0, 0.0), 법선 (-1.0, 0.0, 0.0)      │
   │  [게임오버] 최종 점수 3                                   │
   └──────────────────────────────────────────────────────────┘
```

- [ ] A/D로 좌우 이동한다
- [ ] 스페이스로 점프한다
- [ ] **공중에서 눌러도 안 뛴다**
- [ ] 착지하면 다시 뛴다
- [ ] Scene 뷰에 접지 기즈모(초록/빨강)가 보인다
- [ ] 짧게 누르면 낮게, 길게 누르면 높게 뛴다
- [ ] 점프 버퍼·코요테 타임이 적용돼 조작이 부드럽다
- [ ] 코인이 회전하고, 지나가면 사라진다
- [ ] Console에 점수가 찍힌다
- [ ] 장애물에 옆에서 부딪히면 막히고 게임오버
- [ ] 위에서 밟으면 안전하다
- [ ] Rigidbody를 빼면 콜백이 안 불린다는 것을 확인했다
- [ ] Is Trigger를 켜면 통과한다는 것을 확인했다
- [ ] 매우 빠를 때 뚫는 것과 Continuous로 고쳐지는 것을 확인했다
- [ ] 레이어 충돌 매트릭스를 설정했다
- [ ] Physics Material로 벽 붙음이 해결됐다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **트리거가 안 불림** | 양쪽 다 Rigidbody 없음 | 하나에 Rigidbody |
| 트리거가 안 불림 | `isTrigger` 미체크 | 체크 |
| 트리거가 안 불림 | 레이어 매트릭스 차단 | 매트릭스 확인 |
| **무한 점프** | 접지 판정 없음 | Raycast/SphereCast |
| 항상 접지 상태 | 레이어에 자기 자신 포함 | Ground만 지정 |
| 절대 접지 안 됨 | LayerMask가 Nothing | 레이어 지정 |
| 캐릭터가 넘어짐 | 회전 미고정 | Constraints Freeze Rotation X, Z |
| 벽에 붙어 안 떨어짐 | 마찰 | Physics Material 마찰 0 |
| **물체를 뚫음** | Discrete + 고속 | Collision Detection Continuous |
| 물체를 뚫음 | `transform`으로 이동 | `linearVelocity`/`MovePosition` |
| 중력이 안 먹음 | `velocity` 통째 대입 | `v.y` 보존 |
| 점프가 거의 안 됨 | `ForceMode.Force` | `Impulse` |
| 점프 높이가 매번 다름 | 기존 y속도 누적 | `v.y =` 로 대입 |
| 입력이 씹힘 | `GetKeyDown`을 FixedUpdate에 | Update에서 감지 |
| `Instance` null | 실행 순서 | `Awake` 등록, `Start` 사용 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| 입력 3상태 | `GetKeyDown/GetKey/GetKeyUp` — Day 23과 동일 |
| `GetAxis` vs `Raw` | 관성 있음 / 즉시 |
| **Rigidbody** | 물리의 주체. 없으면 콜백도 없다 |
| 이동 3종 | transform(뚫음) / **velocity(권장)** / AddForce |
| `ForceMode.Impulse` | 점프는 순간 충격 |
| 점프 높이 공식 | `v = √(2gh)` — Day 67 |
| Collider 종류 | Sphere < Box < Capsule < Mesh (비용순) |
| **Collision vs Trigger** | 막힘 / 통과 + 콜백 |
| **콜백 조건** | 둘 다 Collider + 하나는 Rigidbody |
| 접지 판정 | Raycast / **SphereCast** / 법선 검사 |
| `Vector3.Dot` | 법선이 위를 향하면 바닥 |
| **LayerMask** | Day 54 그룹 충돌이 설정으로 |
| 점프 버퍼 / 코요테 | 조작감을 만드는 관용 |
| Collision Detection | Day 22·67의 터널링 해결 |
| Physics Material | 마찰·탄성 |
| `CompareTag` | `tag ==` 보다 빠르다 |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| Day 23 입력 3상태 | `GetKeyDown/GetKey/GetKeyUp` |
| Day 24 AABB 판정 | Collider + `OnTriggerEnter` |
| Day 22 위치 보정 | Collision (물리 엔진이 처리) |
| Day 22·67 터널링 | Collision Detection: Continuous |
| Day 44 점프 | `AddForce(Impulse)` / `v.y =` |
| Day 54 그룹 충돌 | Layer Collision Matrix |
| Day 67 `v = √(2gh)` | 그대로 사용 |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 74** | 프리팹으로 코인/장애물 대량 생성 |
| Day 75 | 게임오버 → 결과 화면 |
| Day 81 | 액션 게임 공격 판정 (Trigger) |
| Day 86 | 디펜스 적 감지 범위 (Sphere Trigger) |
| Day 91 | 차량 물리 (AddForce) |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 이단 점프 | `jumpCount` 변수, 착지 시 리셋 |
| ★★ | 슬라이딩 (Collider 높이 줄이기) | `capsule.height` 변경 + 복구 |
| ★★ | 점프대 (닿으면 위로 튕김) | Trigger + `v.y` 대입 |
| ★★★ | 움직이는 플랫폼 위에서 같이 이동 | Kinematic Rigidbody + `transform.parent` |
| ★★★ | 벽 점프 | 벽 감지 Raycast + 반대 방향 속도 |

### 다음 시간

> 점프한다. 코인을 먹는다. 그런데 **바닥이 끝나면 그걸로 끝이다.**
>
> ```
>   런닝 게임에 필요한 것

>   ① 지형이 끝없이 이어진다
>   ② 지나간 조각은 회수한다
>   ③ 코인과 장애물이 계속 생성된다
> ```
>
> 매번 `Instantiate`/`Destroy` 하면 어떻게 될까?
> **Day 51에서 겪은 그 문제**가 GC라는 이름으로 다시 나타난다.
>
> Day 52에서 만든 **오브젝트 풀**을 Unity에서 다시 만든다.
>
> → **Day 74, 프리팹과 오브젝트 풀 — 무한 지형 생성**
