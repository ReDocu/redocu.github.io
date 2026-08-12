# Day 082 · Animator Controller — 메카님 ★

> **Week 17** · 연결 문서 `15 액션 게임` — Step 1
> 선수: Day 081 (3D 모델 임포트), **Day 046 (유한 상태 머신)**

---

## 1. 오늘 만드는 것

**이동 입력에 따라 대기↔걷기 모션이 전환된다.** 공격 키를 누르면 공격이 끝까지 재생된 뒤 복귀한다.

```
   ┌──────────────────────────────────────────────────────────┐
   │  Animator                                                │
   │                                                          │
   │   ┌───────┐                                              │
   │   │ Entry │───┐                                          │
   │   └───────┘   │                                          │
   │               ▼                                          │
   │          ┌────────┐  Speed > 0.1   ┌────────┐            │
   │          │  Idle  │───────────────▶│  Walk  │            │
   │          │(주황)  │◀───────────────│        │            │
   │          └────────┘  Speed < 0.1   └────────┘            │
   │                │                        │                │
   │                │ Attack (Trigger)       │ Speed > 3      │
   │                ▼                        ▼                │
   │          ┌────────┐               ┌────────┐             │
   │          │ Attack │               │  Run   │             │
   │          └────────┘               └────────┘             │
   │                │ Exit Time                               │
   │                └──▶ Idle                                 │
   │                                                          │
   │  ┌─ Any State ─┐  Hit (Trigger)                          │
   │  └──────┬──────┘──────────────▶ ┌─────┐                  │
   │         │                       │ Hit │                  │
   │         │                       └─────┘                  │
   │  Parameters                                              │
   │   Speed   (Float)   2.4                                  │
   │   Attack  (Trigger)                                      │
   │   Hit     (Trigger)                                      │
   │   IsDead  (Bool)    ☐                                    │
   └──────────────────────────────────────────────────────────┘
```

<!-- SHOT: Day 82 Animator 창 -->

---

## 2. 막히는 상황

어제 캐릭터를 임포트했다. 씬에 놓았다.

```
   ★ T포즈로 굳어 있다

        ●
   ●────┼────●
        │
       ╱ ╲
```

**애니메이션을 재생해 보자.**

```csharp
    // Animation 컴포넌트? Animator?
    GetComponent<Animator>().Play("Walk");
```

```
   ★ Animator 컴포넌트가 없다
     Animator Controller도 없다
```

**그리고 더 큰 문제.**

```
   Play("Walk") 로 재생한다 치자

   ① 걷다가 멈추면?          Play("Idle")
   ② 공격 중에 이동하면?     공격이 끊긴다
   ③ 공격이 끝나면?          언제 끝나는지 알아야 한다
   ④ 피격되면?               어느 상태에서든 가능해야 한다
   ⑤ 전환이 뚝뚝 끊긴다
```

```
   Part 2에서 어떻게 했나

   Day 46:  FSM 전이 표를 만들었다

   struct Transition { State from, to; Condition cond; };

   Transition table[] = {
       { IDLE,   WALK,   COND_MOVE },
       { WALK,   IDLE,   COND_NO_MOVE },
       { IDLE,   ATTACK, COND_ATTACK_KEY },
       { ATTACK, IDLE,   COND_ANIM_END },
   };
```

> **그 표가 Unity에는 GUI로 들어 있다.**

---

## 3. 개념

### 3-1. 메카님 = FSM

**왜 필요한가** — 오늘의 핵심. Day 46과 직접 대응한다.

```
   [Part 2 Day 46 · 손으로 짠 표]        [Unity 메카님]

   IDLE  --이동입력--> WALK              ┌──────┐  Speed > 0.1   ┌──────┐
   WALK  --입력없음--> IDLE              │ Idle │ ─────────────▶ │ Walk │
   IDLE  --공격키--> ATTACK              └──────┘ ◀───────────── └──────┘
   ATTACK --애니끝--> IDLE                   │      Speed < 0.1      │
                                             │ Attack(Trigger)       │
                                             ▼                       │
                                          ┌────────┐                 │
                                          │ Attack │ ◀───────────────┘
                                          └────────┘
                                             │ Exit Time (애니 종료)
                                             └──▶ Idle
```

| Part 2 FSM | 메카님 |
|---|---|
| `enum State` | **State (노드)** |
| `Transition` 배열 | **Transition (화살표)** |
| `Condition` 함수 | **Parameter + Condition** |
| `currentState` | 주황색으로 강조된 노드 |
| 상태 진입 시 애니 시작 | 자동 |
| 애니 종료 감지 | **Has Exit Time** |
| 상태별 코드 | StateMachineBehaviour (선택) |

```
   ★ 무엇이 좋아졌나

   ① 눈으로 보인다
   ② 애니메이션 재생·블렌딩이 자동
   ③ 기획자·애니메이터가 수정 가능

   ★ 무엇이 나빠졌나

   ① 파라미터가 문자열 (오타를 컴파일러가 못 잡는다)
   ② 상태가 많아지면 스파게티
   ③ 디버깅이 어렵다
```

### 3-2. Animator Controller 만들기

**왜 필요한가** — 상태 기계를 담는 애셋.

```
   Project 우클릭 → Create → Animation → Animator Controller
   이름: AC_Hero
```

```
   캐릭터에 Animator 컴포넌트
   Controller: AC_Hero
   Avatar:     Hero_Avatar
   Apply Root Motion: ✗ (오늘은 코드 이동)
   Update Mode: Normal
   Culling Mode: Cull Update Transforms
```

| Update Mode | 의미 |
|---|---|
| **Normal** | Update와 함께. `Time.timeScale` 영향 |
| Animate Physics | FixedUpdate와 함께 (물리 연동 캐릭터) |
| **Unscaled Time** | timeScale 무시 (UI, 일시정지 중 연출) |

| Culling Mode | 의미 |
|---|---|
| Always Animate | 항상 계산 |
| **Cull Update Transforms** | 안 보이면 트랜스폼 갱신 생략 ★ |
| Cull Completely | 안 보이면 완전 중지 |

```
   ⚠️ Cull Completely 주의

   보이지 않을 때 애니메이션이 멈춘다
   → 다시 보이면 멈췄던 지점부터
   → 애니메이션 이벤트도 안 불린다
```

### 3-3. State (상태)

**왜 필요한가** — 각 노드가 하나의 애니메이션.

```
   Animator 창 (Window → Animation → Animator)
   → 빈 공간 우클릭 → Create State → Empty
   → 또는 클립을 창으로 드래그
```

| 노드 색 | 의미 |
|---|---|
| **주황** | 기본 상태 (Default State) |
| 회색 | 일반 상태 |
| 초록 (Entry) | 진입점 |
| 빨강 (Exit) | 종료점 (서브 스테이트 머신에서) |
| 파랑 (Any State) | 어느 상태에서든 |

**State Inspector**

| 필드 | 의미 |
|---|---|
| **Motion** | 재생할 클립 |
| **Speed** | 재생 속도 배율 |
| Multiplier | Speed를 파라미터로 제어 |
| **Foot IK** | 발 위치 보정 |
| Write Defaults | 미지정 프로퍼티를 기본값으로 |
| Transitions | 나가는 전이 목록 |

```
   ⚠️ Write Defaults

   기본은 ✔ 이지만, 레이어를 쓰면 문제가 생긴다
   → 프로젝트 전체에서 일관되게 (보통 전부 ✗)
```

### 3-4. Parameter (파라미터)

**왜 필요한가** — 전이 조건의 재료.

| 타입 | 용도 | 코드 |
|---|---|---|
| **Float** | 속도, 방향 | `SetFloat("Speed", v)` |
| **Int** | 콤보 단계, 무기 종류 | `SetInteger("Combo", 2)` |
| **Bool** | 지속 상태 (공중, 사망) | `SetBool("IsGrounded", true)` |
| **Trigger** | 일회성 이벤트 (공격, 피격) | `SetTrigger("Attack")` |

```
   ★ Bool vs Trigger — 오늘 가장 헷갈리는 것

   Bool:     내가 켜고 내가 꺼야 한다
             "공중에 있는 동안" 같은 지속 상태

   Trigger:  전이가 소비하면 자동으로 꺼진다
             "공격 버튼을 눌렀다" 같은 일회성
```

```
   Bool로 공격을 만들면

   SetBool("Attack", true);
   → Attack 상태로 전이
   → 여전히 true
   → Attack이 끝나고 Idle로 갔다가 다시 Attack
   → 무한 반복  ✗

   ★ 반드시 SetBool("Attack", false) 를 해줘야 한다
     언제? 타이밍 잡기가 어렵다
```

```
   Trigger로 만들면

   SetTrigger("Attack");
   → 전이가 소비 → 자동으로 false
   → 한 번만 실행  ✔
```

```
   ⚠️ Trigger가 소비되지 않는 경우

   전이 조건이 만족되지 않으면 Trigger가 계속 남아 있다
   → 나중에 엉뚱한 타이밍에 발동

   ★ ResetTrigger()로 명시적으로 지운다
```

```csharp
    animator.ResetTrigger("Attack");
```

### 3-5. ⚠️ 문자열 대신 해시

**왜 필요한가** — 오타를 못 잡고, 느리다.

```csharp
    animator.SetFloat("Speed", v);             // ★ 매번 문자열 → 해시 변환
    animator.SetFloat("Sped", v);              // ✗ 오타. 컴파일 오류 없음
```

```csharp
public class PlayerAnimator : MonoBehaviour
{
    // ★ 정적 해시 (한 번만 계산)
    private static readonly int HashSpeed  = Animator.StringToHash("Speed");
    private static readonly int HashAttack = Animator.StringToHash("Attack");
    private static readonly int HashHit    = Animator.StringToHash("Hit");
    private static readonly int HashIsDead = Animator.StringToHash("IsDead");

    private Animator animator;

    void Awake() { animator = GetComponent<Animator>(); }

    public void SetSpeed(float v) => animator.SetFloat(HashSpeed, v);
    public void TriggerAttack()   => animator.SetTrigger(HashAttack);
}
```

```
   ★ 이점

   ① 오타가 한 곳에만 (그리고 눈에 띈다)
   ② 문자열 해싱 비용 제거
   ③ IDE 자동완성
```

```
   ⚠️ 해시는 컨트롤러마다 같다

   "Speed"의 해시는 어느 컨트롤러에서든 동일
   → 정적으로 캐싱해도 안전
```

### 3-6. Transition (전이)

**왜 필요한가** — 상태 사이의 화살표.

```
   상태 우클릭 → Make Transition → 대상 클릭
```

**Transition Inspector**

| 필드 | 의미 |
|---|---|
| **Has Exit Time** | 현재 애니가 특정 지점까지 재생돼야 전이 |
| **Exit Time** | 정규화된 시간 (0.9 = 90% 지점) |
| Fixed Duration | Duration을 초 단위로 |
| **Transition Duration** | 블렌딩 시간 |
| Transition Offset | 대상 애니의 시작 지점 |
| **Interruption Source** | 전이 중 중단 허용 |
| **Conditions** | 파라미터 조건 |

```
   ★ Has Exit Time

   체크 ✔ = "애니가 끝날 때까지 기다린다"
            → Attack → Idle 에 적합

   체크 ✗ = "조건만 맞으면 즉시"
            → Idle ↔ Walk 에 적합
```

```
   ⚠️ 조건이 없는데 Has Exit Time도 ✗ 이면

   → 즉시 무조건 전이
   → 상태에 머물 수 없다
```

```
   ★ Transition Duration

   0     →  뚝 끊긴다
   0.1~0.25 →  자연스럽다  ★
   0.5+  →  흐물흐물하다

   ⚠️ 공격 같은 즉각적인 동작은 짧게 (0.05~0.1)
```

**전이 그래프 읽기**

```
   Idle ─────────────────────▶ Walk
        ├──────┤
        Exit Time    Duration

   Idle 재생 ████████████░░░░
   Walk 재생          ░░░░████████
                      ↑ 겹치는 구간 = 블렌딩
```

### 3-7. Any State

**왜 필요한가** — 어느 상태에서든 갈 수 있는 전이.

```
   피격은 Idle에서도, Walk에서도, Attack 중에도 가능해야 한다

   ✗ 모든 상태에서 Hit으로 화살표를 그린다 (5개 상태면 5개)
   ✔ Any State → Hit 하나
```

```
   ┌─ Any State ─┐
   └──────┬──────┘
          │ Hit (Trigger)
          ▼
      ┌───────┐
       │  Hit  │
      └───────┘
```

```
   ⚠️ Any State 주의점

   ① 자기 자신에게도 전이한다
      → "Can Transition To Self" 체크 해제 필수

   ② 우선순위가 높다
      → 남용하면 다른 전이가 무시된다

   ③ Has Exit Time을 켜면 안 된다 (의미가 없다)
```

```
   ★ 언제 Any State를 쓰나

   ○ 피격, 사망, 스턴 (어디서든 발생)
   ✗ 일반적인 상태 전환
```

### 3-8. Interruption Source

**왜 필요한가** — 전이 중에 다른 전이가 끼어들 수 있게.

```
   상황

   Idle → Walk 전이 중(0.2초)에 공격 키를 눌렀다
   → 기본값(None)이면 무시된다
   → 0.2초 뒤에야 반응
```

| 값 | 의미 |
|---|---|
| **None** | 전이 중 중단 불가 |
| Current State | 현재 상태의 전이가 끼어들 수 있음 |
| Next State | 대상 상태의 전이가 끼어들 수 있음 |
| Current State Then Next State | 둘 다 (현재 우선) |
| Next State Then Current State | 둘 다 (대상 우선) |

```
   ★ 액션 게임에서는 보통

   Idle ↔ Walk:  Current State
   → 이동 전환 중에도 공격을 받아들인다
```

### 3-9. Layer와 Avatar Mask

**왜 필요한가** — 상체와 하체를 따로 제어한다.

```
   원하는 것

   "달리면서 총을 쏜다"
   → 하체는 Run, 상체는 Shoot

   상태 하나로는 불가능
   → 레이어를 나눈다
```

```
   Layer 0 (Base):     Idle / Walk / Run          전신
   Layer 1 (Upper):    Empty / Shoot / Reload     상체만
                       Mask: UpperBody
                       Blending: Override
                       Weight: 0 ~ 1
```

| Blending | 의미 |
|---|---|
| **Override** | 마스크 부위를 덮어쓴다 |
| Additive | 기존 포즈에 더한다 (호흡, 조준 흔들림) |

```
   Avatar Mask 만들기

   Create → Avatar Mask
   Humanoid 섹션에서 사용할 부위를 초록으로
```

```
        ┌─┐  Head       ✔
        └┬┘
     ●──┼──●  Arms      ✔
        │     Body      ✔
       ╱ ╲    Legs      ✗
              (하체는 Base 레이어가 담당)
```

```csharp
    animator.SetLayerWeight(1, 1f);            // 상체 레이어 켜기
    animator.SetLayerWeight(1, 0f);            // 끄기
```

```
   ⚠️ 레이어를 쓸 때는 Write Defaults를 전부 ✗ 로

   섞이면 예측 불가능한 결과가 나온다
```

### 3-10. 상태 확인 API

**왜 필요한가** — 코드에서 현재 상태를 안다.

```csharp
    AnimatorStateInfo info = animator.GetCurrentAnimatorStateInfo(0);

    // ★ 현재 상태가 Attack인가
    if (info.IsName("Attack")) { }
    if (info.shortNameHash == HashAttackState) { }

    // ★ 재생 진행도 (0~1, 루프면 1을 넘어간다)
    float progress = info.normalizedTime;

    // ★ 전이 중인가
    if (animator.IsInTransition(0)) { }
```

```
   ⚠️ normalizedTime은 루프에서 계속 증가한다

   1.0 → 2.0 → 3.0 ...
   → 현재 사이클 진행도는 normalizedTime % 1f
```

```csharp
    // ★ 공격이 끝났는지 확인
    bool attackFinished =
        info.IsName("Attack") &&
        info.normalizedTime >= 0.95f &&
        !animator.IsInTransition(0);
```

```
   ⚠️ 이 방식은 취약하다

   전이 타이밍, 재생 속도에 따라 놓칠 수 있다
   → Day 83의 애니메이션 이벤트가 더 확실하다
```

### 3-11. StateMachineBehaviour

**왜 필요한가** — 상태 진입·종료 시 코드 실행.

```csharp
using UnityEngine;

public class AttackStateBehaviour : StateMachineBehaviour
{
    public override void OnStateEnter(Animator animator,
        AnimatorStateInfo stateInfo, int layerIndex)
    {
        PlayerController p = animator.GetComponent<PlayerController>();
        p?.SetAttacking(true);
    }

    public override void OnStateExit(Animator animator,
        AnimatorStateInfo stateInfo, int layerIndex)
    {
        PlayerController p = animator.GetComponent<PlayerController>();
        p?.SetAttacking(false);
    }
}
```

```
   State 선택 → Inspector 하단 Add Behaviour
```

```
   ★ Part 2 Day 46과의 대응

   Part 2:  OnEnterState(state) / OnExitState(state)
   Unity:   OnStateEnter / OnStateExit
```

```
   ⚠️ 주의

   ① 인스턴스가 컨트롤러에 공유된다 (기본)
      → 필드에 상태를 저장하면 여러 캐릭터가 공유
   ② GetComponent를 매번 하면 느리다
   ③ 디버깅이 어렵다 (어디서 호출되는지 추적이 힘들다)

   ★ 간단한 것만. 복잡하면 일반 스크립트로
```

### 3-12. 흔한 실수 정리

**왜 필요한가** — 미리 알면 시간을 아낀다.

```
   ⚠️ ① 파라미터 이름 오타

   "Speed" vs "speed" vs "Sped"
   → 컴파일 오류 없음. 조용히 동작 안 함
   → Animator 창의 파라미터 목록과 대조
```

```
   ⚠️ ② Trigger를 Bool처럼 사용

   SetBool("Attack", true) → 무한 반복
```

```
   ⚠️ ③ Has Exit Time 오해

   Idle → Walk 에 Has Exit Time ✔ 이면
   → Idle이 한 바퀴 돌 때까지 안 움직인다
   → 반응이 느리다
```

```
   ⚠️ ④ 전이가 너무 많다

   상태 6개에 모든 전이를 그리면 30개
   → Any State + 서브 스테이트 머신으로 정리
```

```
   ⚠️ ⑤ Apply Root Motion 중복

   Animator의 Root Motion ✔ + 코드로도 이동
   → 두 배로 움직이거나 싸운다
```

---

## 4. 따라 만들기

### Step 1 — Animator Controller 생성

```
   Assets/Animations/ 폴더 생성
   우클릭 → Create → Animation → Animator Controller
   이름: AC_Hero
```

```
   Player 오브젝트(또는 Model)에 Animator 컴포넌트
   Controller: AC_Hero
   Avatar:     Hero_Avatar
   Apply Root Motion: ✗
```

```
   ⚠️ Animator는 Model 오브젝트에 붙인다

   Player (부모)
   └─ Model  ← 여기에 Animator
```

**✅ 여기까지 하면** — 여전히 T포즈 (상태가 없다).

### Step 2 — Idle 상태

```
   Window → Animation → Animator 창 열기

   Hero@Idle.fbx 를 펼쳐 Idle 클립을 Animator 창으로 드래그
```

**✅ 여기까지 실행하면** — **캐릭터가 숨을 쉰다.**

```
   ★ 첫 상태는 자동으로 주황(기본 상태)이 된다
```

<!-- SHOT: Step 2 Idle 재생 -->

### Step 3 — Walk / Run / Attack 추가

```
   각 클립을 Animator 창으로 드래그
   노드 위치를 정리한다
```

```
              ┌───────┐
              │ Entry │
              └───┬───┘
                  ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │ Attack │  │  Idle  │  │  Walk  │
   └────────┘  └────────┘  └────────┘
                            ┌────────┐
                            │  Run   │
                            └────────┘
```

**✅ 여기까지 실행하면** — 여전히 Idle만 재생된다 (전이가 없다).

### Step 4 — 파라미터 추가

```
   Animator 창 좌측 Parameters 탭 → +

   Speed    (Float)
   Attack   (Trigger)
   Hit      (Trigger)
   IsDead   (Bool)
```

**✅ 여기까지 하면** — 파라미터 4개.

### Step 5 — Idle ↔ Walk 전이

```
   Idle 우클릭 → Make Transition → Walk 클릭
   그 화살표 선택 → Inspector

   Has Exit Time:       ✗                    ★
   Transition Duration: 0.15
   Conditions:          Speed  Greater  0.1
```

```
   Walk 우클릭 → Make Transition → Idle

   Has Exit Time:       ✗
   Transition Duration: 0.15
   Conditions:          Speed  Less  0.1
```

**✅ 여기까지 하면** — Animator 창에서 Speed 슬라이더를 움직이면 전환된다.

```
   ★ Play 중에 Animator 창의 파라미터를 직접 조작할 수 있다
     → 코드 없이 테스트
```

<!-- SHOT: Step 5 전이 화살표 -->

### Step 6 — Has Exit Time 실험

**Idle → Walk 의 Has Exit Time을 체크한다.**

**✅ 이렇게 하면**

```
   Speed를 올려도 즉시 안 움직인다
   → Idle 클립이 끝날 때까지 기다린다
   → 최대 2~3초 지연
```

```
   ★ 조작 반응이 죽는다
```

> **되돌린다 (해제).**

### Step 7 — Transition Duration 실험

**Duration을 0으로 바꾼다.**

```
   → 뚝 끊긴다. 포즈가 순간이동한다
```

**Duration을 0.8로 바꾼다.**

```
   → 흐물흐물하다. 반응이 느껴진다
```

> **0.15로 되돌린다.**

### Step 8 — Walk ↔ Run 전이

```
   Walk → Run:  Has Exit Time ✗, Duration 0.2, Speed Greater 3
   Run → Walk:  Has Exit Time ✗, Duration 0.2, Speed Less 3
```

```
   ⚠️ 경계값에서 떨림(chattering)

   Speed가 정확히 3 근처면 Walk↔Run이 반복 전환

   ★ 해결 — 히스테리시스
   Walk → Run:  Speed > 3.2
   Run → Walk:  Speed < 2.8
```

**✅ 여기까지 하면** — 3단계 이동이 된다.

### Step 9 — Attack 전이

```
   Idle → Attack:   Has Exit Time ✗, Duration 0.08, Attack (Trigger)
   Walk → Attack:   Has Exit Time ✗, Duration 0.08, Attack
   Run  → Attack:   Has Exit Time ✗, Duration 0.08, Attack

   Attack → Idle:   Has Exit Time ✔, Exit Time 0.85, Duration 0.15
                    Conditions 없음
```

```
   ★ Attack → Idle 에만 Has Exit Time을 켠다

   "공격 애니가 85% 재생되면 Idle로"
```

**✅ 여기까지 하면** — Animator 창에서 Attack 트리거를 눌러 확인한다.

<!-- SHOT: Step 9 공격 전이 -->

### Step 10 — Trigger vs Bool 실험

**Attack 파라미터를 Bool로 바꾸고 조건도 `Attack == true`로.**

```csharp
    if (Input.GetKeyDown(KeyCode.Mouse0)) animator.SetBool("Attack", true);
```

**✅ 이렇게 하면**

```
   ★ 공격이 무한 반복된다

   Attack → Idle → (Attack이 여전히 true) → Attack → ...
```

> ### ★ 3-4절의 함정
>
> **Trigger로 되돌린다.**

### Step 11 — Any State → Hit

```
   Hero@Hit.fbx 를 받아 임포트 (없으면 Attack을 복제해 사용)
   Hit 클립을 Animator에 드래그

   Any State 우클릭 → Make Transition → Hit

   Has Exit Time:            ✗
   Duration:                 0.05
   Can Transition To Self:   ✗                    ★
   Conditions:               Hit (Trigger)

   Hit → Idle:  Has Exit Time ✔, Exit Time 0.9, Duration 0.15
```

**✅ 여기까지 하면** — 어느 상태에서든 Hit 트리거로 피격 모션이 나온다.

**"Can Transition To Self"를 체크해 본다.**

```
   → Hit 중에 다시 Hit을 받으면 처음부터 재생
   → 상황에 따라 원할 수도 있다 (연속 피격)
   → 하지만 대부분은 해제
```

### Step 12 — 컨트롤 스크립트

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PlayerController : MonoBehaviour
{
    [Header("이동")]
    [SerializeField] private float walkSpeed = 2f;
    [SerializeField] private float runSpeed = 5.5f;
    [SerializeField] private float rotationSpeed = 12f;
    [SerializeField] private float acceleration = 12f;

    [Header("참조")]
    [SerializeField] private Animator animator;

    // ★ 해시 캐싱 (3-5절)
    private static readonly int HashSpeed  = Animator.StringToHash("Speed");
    private static readonly int HashAttack = Animator.StringToHash("Attack");
    private static readonly int HashHit    = Animator.StringToHash("Hit");
    private static readonly int HashIsDead = Animator.StringToHash("IsDead");

    private Rigidbody rb;
    private Vector3 inputDir;
    private float currentSpeed;
    private bool attackQueued;

    public bool IsAttacking { get; private set; }

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        if (animator == null) animator = GetComponentInChildren<Animator>();
    }

    void Update()
    {
        // ─── 입력 ───
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");

        inputDir = new Vector3(h, 0, v).normalized;

        bool running = Input.GetKey(KeyCode.LeftShift);
        float targetSpeed = inputDir.sqrMagnitude > 0.01f
                            ? (running ? runSpeed : walkSpeed)
                            : 0f;

        // ★ 부드러운 가감속
        currentSpeed = Mathf.MoveTowards(currentSpeed, targetSpeed,
                                          acceleration * Time.deltaTime);

        animator.SetFloat(HashSpeed, currentSpeed);

        // ─── 공격 ───
        if (Input.GetMouseButtonDown(0)) attackQueued = true;

        if (attackQueued && !IsAttacking)
        {
            attackQueued = false;
            animator.SetTrigger(HashAttack);
        }

        // ─── 테스트용 ───
        if (Input.GetKeyDown(KeyCode.H)) animator.SetTrigger(HashHit);
    }

    void FixedUpdate()
    {
        if (IsAttacking)                       // ★ 공격 중 이동 금지
        {
            rb.linearVelocity = new Vector3(0, rb.linearVelocity.y, 0);
            return;
        }

        // 이동
        Vector3 move = inputDir * currentSpeed;
        rb.linearVelocity = new Vector3(move.x, rb.linearVelocity.y, move.z);

        // 회전
        if (inputDir.sqrMagnitude > 0.01f)
        {
            Quaternion target = Quaternion.LookRotation(inputDir);
            transform.rotation = Quaternion.Slerp(
                transform.rotation, target, rotationSpeed * Time.deltaTime);
        }
    }

    public void SetAttacking(bool v) => IsAttacking = v;
}
```

```
   ★ Quaternion.Slerp

   구면 선형 보간. 회전에 쓴다
   → Vector3.Lerp의 회전판
```

```
   ★ Mathf.MoveTowards vs Lerp

   MoveTowards:  일정한 속도로 접근. 정확히 도달
   Lerp:         남은 거리에 비례. 영원히 도달 안 함(근사)

   가감속에는 MoveTowards가 예측 가능하다
```

**✅ 여기까지 실행하면** — WASD로 걷고, Shift로 뛰고, 클릭으로 공격한다.

<!-- SHOT: Step 12 조작 확인 -->

### Step 13 — StateMachineBehaviour

3-11절의 `AttackStateBehaviour`를 만들고 Attack 상태에 붙인다.

```csharp
using UnityEngine;

public class AttackStateBehaviour : StateMachineBehaviour
{
    private PlayerController cached;

    public override void OnStateEnter(Animator animator,
        AnimatorStateInfo stateInfo, int layerIndex)
    {
        if (cached == null)
            cached = animator.GetComponentInParent<PlayerController>();

        cached?.SetAttacking(true);
    }

    public override void OnStateExit(Animator animator,
        AnimatorStateInfo stateInfo, int layerIndex)
    {
        cached?.SetAttacking(false);
    }
}
```

**✅ 여기까지 실행하면** — 공격 중에는 이동이 멈춘다.

```
   ⚠️ cached를 필드에 두면

   여러 캐릭터가 같은 컨트롤러를 쓸 때 공유된다
   → 캐릭터가 하나면 괜찮지만, 여럿이면 매번 GetComponent
   → 또는 일반 스크립트로 상태를 판정
```

### Step 14 — 파라미터 오타 실험

```csharp
    animator.SetFloat("Sped", currentSpeed);   // ✗ 오타
```

**✅ 이렇게 하면**

```
   ★ 컴파일 오류 없음
   ★ 경고도 없음
   ★ 그냥 안 움직인다

   → 원인을 찾는 데 오래 걸린다
```

```
   ★ 해시 캐싱이 이 문제를 줄인다

   오타가 있어도 한 곳에만
   그리고 상수명이 IDE에서 자동완성된다
```

> **되돌린다.**

### Step 15 — Interruption Source

```
   Idle → Walk 전이 선택
   Interruption Source: Current State
```

**걷기 시작 직후(전이 중)에 클릭해 본다.**

**✅ 여기까지 하면**

```
   None:           전이가 끝나야 공격이 나간다 (0.15초 지연)
   Current State:  즉시 공격  ✔
```

### Step 16 — 상체 레이어 (선택)

```
   Create → Avatar Mask → 이름 Mask_UpperBody
   Humanoid 섹션에서
   Head ✔, Left Arm ✔, Right Arm ✔, Body ✔
   Left Leg ✗, Right Leg ✗
```

```
   Animator 창 → Layers 탭 → +
   이름: UpperBody
   Weight: 1
   Mask: Mask_UpperBody
   Blending: Override
```

```
   UpperBody 레이어에
   ├─ Empty (기본, Motion 없음)
   └─ Attack

   Any State → Attack (Attack Trigger)
   Attack → Empty (Exit Time 0.9)
```

```
   ⚠️ Base 레이어의 Attack 전이는 제거한다
     (중복 재생 방지)
```

**✅ 여기까지 실행하면** — **달리면서 공격한다.**

```
   하체: Run
   상체: Attack
```

<!-- SHOT: Step 16 상체 레이어 -->

```
   ⚠️ Write Defaults

   레이어를 쓰면 모든 상태의 Write Defaults를 ✗ 로
   → 안 그러면 하체가 이상해진다
```

### Step 17 — 레이어 가중치 제어

```csharp
    [SerializeField] private float upperLayerBlend = 10f;
    private float upperWeight;

    void Update()
    {
        // ...

        float target = IsAttacking ? 1f : 0f;
        upperWeight = Mathf.MoveTowards(upperWeight, target,
                                        upperLayerBlend * Time.deltaTime);
        animator.SetLayerWeight(1, upperWeight);
    }
```

**✅ 여기까지 하면** — 상체 애니메이션이 부드럽게 섞인다.

### Step 18 — 디버그 표시

```csharp
    void OnGUI()
    {
        if (animator == null) return;

        AnimatorStateInfo info = animator.GetCurrentAnimatorStateInfo(0);

        GUIStyle s = new GUIStyle(GUI.skin.label) { fontSize = 16 };
        int y = 10;

        string stateName = "?";
        if (info.IsName("Idle"))   stateName = "Idle";
        if (info.IsName("Walk"))   stateName = "Walk";
        if (info.IsName("Run"))    stateName = "Run";
        if (info.IsName("Attack")) stateName = "Attack";
        if (info.IsName("Hit"))    stateName = "Hit";

        GUI.Label(new Rect(10, y, 400, 24), $"State      {stateName}", s); y += 22;
        GUI.Label(new Rect(10, y, 400, 24),
                  $"Progress   {info.normalizedTime % 1f:F2}", s); y += 22;
        GUI.Label(new Rect(10, y, 400, 24),
                  $"Speed      {animator.GetFloat(HashSpeed):F2}", s); y += 22;
        GUI.Label(new Rect(10, y, 400, 24),
                  $"Transition {animator.IsInTransition(0)}", s); y += 22;
        GUI.Label(new Rect(10, y, 400, 24),
                  $"Attacking  {IsAttacking}", s);
    }
```

**✅ 최종** — 1절의 상태 기계가 완성된다.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────────────────────────────────┐
   │  Animator                                    Game        │
   │                                                          │
   │      ┌────────┐  Speed>0.1  ┌────────┐   State  Walk    │
   │      │  Idle  │────────────▶│ [Walk] │   Progress 0.42  │
   │      └────────┘◀────────────└────────┘   Speed   2.00   │
   │           │      Speed<0.1       │        Transition F   │
   │           │ Attack               │Speed>3.2 Attacking F  │
   │           ▼                      ▼                       │
   │      ┌────────┐            ┌────────┐         ●         │
   │      │ Attack │            │  Run   │        ╱│╲        │
   │      └────────┘            └────────┘       ─┤ ├─       │
   │           │ ExitTime 0.85       │            ╱ ╲        │
   │           └──────▶ Idle ◀───────┘     ▓▓▓▓▓▓▓▓▓▓▓▓     │
   │                                                          │
   │  Parameters                                              │
   │   Speed   ●────────  2.00                                │
   │   Attack  (Trigger)                                      │
   │   Hit     (Trigger)                                      │
   │   IsDead  ☐                                              │
   └──────────────────────────────────────────────────────────┘
```

- [ ] Animator Controller를 만들어 캐릭터에 연결했다
- [ ] Idle 상태가 재생된다 (T포즈 해제)
- [ ] 파라미터 4종을 만들었다
- [ ] Speed로 Idle ↔ Walk가 전환된다
- [ ] Animator 창에서 파라미터를 직접 조작해 테스트했다
- [ ] **Has Exit Time을 켜면 반응이 느려진다**는 것을 확인했다
- [ ] Transition Duration 0과 0.8의 차이를 봤다
- [ ] Walk ↔ Run 히스테리시스를 적용했다
- [ ] **Trigger를 Bool로 바꾸면 무한 반복**된다는 것을 확인했다
- [ ] Any State → Hit이 어느 상태에서든 동작한다
- [ ] Can Transition To Self를 해제했다
- [ ] `Animator.StringToHash`로 캐싱했다
- [ ] 파라미터 오타가 조용히 실패한다는 것을 확인했다
- [ ] WASD 이동, Shift 달리기, 클릭 공격이 된다
- [ ] 공격 중 이동이 멈춘다 (StateMachineBehaviour)
- [ ] Interruption Source로 반응성이 개선됐다
- [ ] (선택) 상체 레이어로 달리며 공격한다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| T포즈 그대로 | Controller 미연결 | Animator에 지정 |
| T포즈 그대로 | Avatar 미지정 | Hero_Avatar |
| **전이가 안 됨** | 파라미터 이름 오타 | 목록과 대조. 해시 캐싱 |
| 전이가 안 됨 | 조건 불충족 | Animator 창에서 값 확인 |
| **공격이 반복 재생** | Trigger를 Bool로 | Trigger 사용 |
| 공격이 반복 재생 | Trigger 미소비 | `ResetTrigger` |
| 반응이 느림 | Has Exit Time ✔ | 해제 |
| 반응이 느림 | Interruption None | Current State |
| **전환이 뚝뚝** | Duration 0 | 0.1~0.25 |
| 흐물흐물함 | Duration 과다 | 줄이기 |
| Walk↔Run 떨림 | 경계값 동일 | 히스테리시스 |
| Any State 무한 루프 | Can Transition To Self | 해제 |
| 두 배로 이동 | Root Motion 중복 | 하나만 사용 |
| 레이어가 이상함 | Write Defaults | 전부 ✗ |
| 상체만 재생 안 됨 | Layer Weight 0 | `SetLayerWeight(1, 1)` |
| 상태가 안 보임 | Animator 창 미선택 | 캐릭터 선택 후 확인 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **메카님 = FSM** | Day 46의 전이 표가 GUI로 |
| State | 노드 하나 = 클립 하나. 주황 = 기본 |
| **Parameter 4종** | Float / Int / **Bool** / **Trigger** |
| **Bool vs Trigger** | 내가 끔 / 전이가 소비 |
| **`StringToHash`** | 오타·성능 대책 |
| Transition | 상태 사이 화살표 |
| **Has Exit Time** | 애니가 끝날 때까지 대기 |
| Transition Duration | 0.1~0.25가 자연스럽다 |
| 히스테리시스 | 경계값 떨림 방지 |
| **Any State** | 어디서든. Self 전이 해제 필수 |
| Interruption Source | 전이 중 끼어들기 |
| Layer + Avatar Mask | 상체/하체 분리 |
| `AnimatorStateInfo` | 현재 상태·진행도 확인 |
| StateMachineBehaviour | OnStateEnter/Exit |
| `Quaternion.Slerp` | 회전 보간 |

### Part 2와의 대응

| Part 2 Day 46 | Unity 메카님 |
|---|---|
| `enum State` | State 노드 |
| `Transition table[]` | 전이 화살표 |
| `Condition` 함수 | Parameter + Condition |
| `OnEnterState` | `OnStateEnter` |
| 애니 종료 감지 코드 | Has Exit Time |
| 상태별 애니 전환 코드 | 자동 블렌딩 |
| 모든 상태 → HIT 전이 | Any State |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 83** | 블렌드 트리 · 애니메이션 이벤트 |
| Day 84 | NavMesh 속도 → Speed 파라미터 |
| Day 85 | 피격·사망 상태 |
| Day 101+ | 파이널 프로젝트 캐릭터 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | Jump 상태 추가 | Bool `IsGrounded` |
| ★★ | 3단 콤보 (클릭 연타) | Int `ComboStep` + Exit Time |
| ★★ | 사망 상태 (`IsDead` Bool, 복귀 없음) | Any State → Death |
| ★★★ | 서브 스테이트 머신으로 공격 계열 묶기 | 우클릭 → Create Sub-State Machine |
| ★★★ | 무기별 애니메이션 세트 전환 | Animator Override Controller |

### 다음 시간

> 걷기와 뛰기가 전환된다. 그런데 **중간이 없다.**
>
> ```
>   Speed 2.9  →  Walk
>   Speed 3.3  →  Run

>   Speed 3.0 은?  →  뚝 끊긴다
> ```
>
> **블렌드 트리**가 여러 클립을 비율로 섞는다.
>
> 그리고 공격 판정. Day 47에서 만든 **히트박스 활성 프레임**을
> Unity에서는 **애니메이션 이벤트**로 처리한다.
>
> → **Day 83, 블렌드 트리·루트 모션·애니메이션 이벤트**
