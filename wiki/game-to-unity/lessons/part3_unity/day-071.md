# Day 071 · Unity 입문 — 씬·게임오브젝트·컴포넌트

> **Week 15** · 연결 문서 `13 런닝 게임` — Step 0
> 선수: Day 070 (Part 2 완료)

---

## 1. 오늘 만드는 것

**Unity 씬에 오브젝트를 배치하고 Play 버튼으로 돌린다.**

```
   ┌────────────────────────────────────────────────────────────────┐
   │ File Edit ...            ▶  ⏸  ⏭                     Layout ▾ │
   ├──────────────┬───────────────────────────────┬─────────────────┤
   │ Hierarchy    │  Scene   Game                 │  Inspector      │
   │              │                               │                 │
   │ ▾ SampleScene│      ┌───┐                    │ ☑ Cube          │
   │   Main Camera│      │   │  ← 큐브            │  Tag Untagged   │
   │   Direct.Lig │      └───┘                    │                 │
   │   Ground     │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← 바닥     │ ▾ Transform     │
   │   Cube       │                               │   Pos 0  0.5  0 │
   │              │                               │   Rot 0  0    0 │
   │              │                               │   Scl 1  1    1 │
   ├──────────────┴───────────────────────────────┤ ▾ Mesh Renderer │
   │ Project                                      │   Mat  M_Cube   │
   │ ▾ Assets                                     │ ▾ Box Collider   │
   │   Scenes/  Scripts/  Prefabs/  Materials/    │                 │
   └──────────────────────────────────────────────┴─────────────────┘
```

**Play를 누르면** Game 뷰에 카메라 시점의 장면이 뜬다. 각자 만든 머티리얼 색이 적용돼 있다.

<!-- SHOT: Day 71 완성 씬 -->

---

## 2. 막히는 상황

Part 2에서 8주 동안 만든 것을 떠올려 보자.

```
   창 하나 띄우려면

   WNDCLASS 등록
   RegisterClass
   CreateWindow
   ShowWindow
   메시지 루프
   WndProc 작성

   → 약 60줄
```

```
   화면에 사각형 하나 그리려면

   백버퍼 만들기 (CreateCompatibleDC/Bitmap)
   HBRUSH 만들기
   SelectObject
   Rectangle
   원본 복원
   DeleteObject
   BitBlt

   → 약 30줄 + 프레임워크
```

```
   3D 큐브를 회전시켜 조명을 받게 하려면

   → ...
```

```
   ★ Part 2 방식으로 3D를 하려면

   행렬 변환, 투영, 래스터화, 조명 계산, Z버퍼
   → 수천 줄. 몇 달
```

> **엔진을 쓴다.** 그런데 엔진은 "그리기"만 대신하는 게 아니다.
> **프로그램의 구조 자체가 다르다.**

---

## 3. 개념

### 3-1. 엔진이 대신하는 것

**왜 필요한가** — 무엇이 사라졌는지 알아야 무엇을 배울지 안다.

| Part 2에서 직접 만든 것 | Unity |
|---|---|
| `WinMain` + 메시지 루프 | 없다 (엔진이 돌린다) |
| `WndProc` | 없다 |
| 더블 버퍼링 | 렌더 파이프라인이 처리 |
| `Timer` / 델타 타임 | `Time.deltaTime` |
| `Renderer` | MeshRenderer / SpriteRenderer |
| `Input` 3상태 | `Input.GetKey/Down/Up` |
| `SceneManager` | `UnityEngine.SceneManagement` |
| `GameObject` 기반 클래스 | GameObject + Component |
| AABB 충돌 | Collider |
| 오브젝트 풀 | 프리팹 + `ObjectPool<T>` |
| FSM | Animator Controller |
| A\* | NavMesh |

```
   ★ 하지만 "몰라도 된다"가 아니다

   Rigidbody가 뚫고 지나갈 때
   → Day 22의 터널링을 아는 사람만 원인을 안다

   프레임률에 따라 속도가 다를 때
   → Day 38의 델타 타임을 아는 사람만 원인을 안다

   Instantiate가 렉을 만들 때
   → Day 51의 할당 비용을 아는 사람만 원인을 안다
```

### 3-2. GameObject + Component — 상속이 아니라 조합

**왜 필요한가** — 오늘 배우는 것 중 가장 중요하다.

```
   [Part 2 · 상속]                    [Unity · 조합]

        GameObject                      GameObject "Player"
             ▲                            ├─ Transform
      ┌──────┼──────┐                     ├─ MeshRenderer
   Player  Enemy  Bullet                  ├─ Rigidbody
                                          ├─ Collider
   "무엇인가"로 분류                       └─ PlayerController (내 스크립트)

                                       "무엇을 가지고 있는가"로 조립
```

**상속의 한계 — 클래스 폭발**

```
   요구사항이 늘어나면

   Enemy
   ├─ FlyingEnemy
   ├─ ShootingEnemy
   ├─ FlyingShootingEnemy        ← 조합 폭발
   ├─ ExplodingEnemy
   ├─ FlyingExplodingEnemy
   └─ FlyingShootingExplodingEnemy

   기능 n개 → 클래스 2ⁿ개
```

**조합의 해법**

```
   GameObject "Enemy"
   ├─ Transform
   ├─ Health
   ├─ FlyMovement      ← 붙이면 난다
   ├─ Shooter          ← 붙이면 쏜다
   └─ Exploder         ← 붙이면 터진다

   기능 n개 → 컴포넌트 n개.  끝
```

```
   ★ "is-a"가 아니라 "has-a"

   Part 2:  Player is a GameObject
   Unity:   Player has a Rigidbody, has a Collider, ...
```

```
   ⚠️ Part 2 사고방식으로 Unity를 쓰면

   "적 클래스를 만들고 상속받아야지"
   → MonoBehaviour를 상속한 거대한 EnemyBase
   → 컴포넌트의 이점을 못 쓴다

   Unity에서 상속은 "같은 종류의 컴포넌트"에만 쓴다
```

### 3-3. Transform — 모든 GameObject의 필수 컴포넌트

**왜 필요한가** — 위치·회전·크기. 유일하게 제거할 수 없는 컴포넌트.

| 필드 | 의미 |
|---|---|
| Position | 위치 (x, y, z) |
| Rotation | 회전 (도 단위 오일러 각) |
| Scale | 크기 배율 |

```
   ★ Unity 좌표계 (왼손 좌표계)

        Y (위)
        │
        │
        └───── X (오른쪽)
       ╱
      Z (앞)

   ⚠️ Part 2 화면 좌표와 다르다

   Part 2:  y가 아래로 +
   Unity:   y가 위로 +      ← 수학 좌표계와 같다

   Day 66의 "y축 반전"이 필요 없어진다
```

**부모-자식 관계**

```
   Hierarchy

   ▾ Car                      (부모)
     ├─ Body
     ├─ Wheel_FL
     ├─ Wheel_FR
     ├─ Wheel_RL
     └─ Wheel_RR

   ★ 부모를 움직이면 자식도 함께 움직인다
```

| 좌표 | 코드 | 기준 |
|---|---|---|
| 로컬 | `transform.localPosition` | **부모** 기준 |
| 월드 | `transform.position` | **씬 원점** 기준 |

```
   예)  Car가 (100, 0, 0)에 있고
        Wheel_FL의 localPosition이 (-1, 0, 2)이면

        Wheel_FL의 position = (99, 0, 2)
```

```
   ★ Day 56의 좌표 변환이 여기서도 나온다

   Part 2:  화면 / 월드 / 타일
   Unity:   로컬 / 월드 / 화면(뷰포트)
```

### 3-4. Scene

**왜 필요한가** — 게임의 한 화면(또는 한 단계) 단위.

```
   Scenes/
   ├─ Title.unity
   ├─ Game.unity
   └─ Result.unity
```

```
   ★ Part 2의 Scene 클래스와 개념은 같다

   Part 2:  코드로 만든 씬 객체
   Unity:   에디터에서 편집하는 애셋 파일

   차이:  Unity 씬은 "저장된 배치"다
          코드 없이 오브젝트를 놓고 저장한다
```

```
   ⚠️ 씬을 저장하지 않으면 Play 중 만든 변경이 사라진다

   Ctrl+S 를 습관화한다
```

### 3-5. 에디터 창

**왜 필요한가** — 매일 쓴다.

| 창 | 역할 |
|---|---|
| **Hierarchy** | 현재 씬의 GameObject 목록(트리) |
| **Scene** | 3D 편집 뷰. 여기서 배치한다 |
| **Game** | 실제 카메라 시점. 플레이어가 보는 것 |
| **Inspector** | 선택한 오브젝트의 컴포넌트 목록/설정 |
| **Project** | 프로젝트의 모든 애셋(파일) |
| **Console** | 로그·경고·오류 |

```
   ★ Scene 뷰와 Game 뷰의 차이

   Scene:  편집용. 자유 시점. 기즈모 보임
   Game:   Main Camera가 찍는 화면. 실제 결과

   Game 뷰가 검다  →  카메라 문제 (3-9)
```

**씬 뷰 조작**

| 조작 | 키 |
|---|---|
| 궤도 회전 | Alt + 좌클릭 드래그 |
| 팬(이동) | 휠 클릭 드래그 (또는 Alt + 중클릭) |
| 줌 | 휠 스크롤 |
| **선택 오브젝트로 포커스** | 오브젝트 선택 후 **F** |
| 비행 모드 | 우클릭 유지 + WASD |

```
   ★ F 키를 반드시 익힌다

   "오브젝트를 만들었는데 안 보인다"
   → 대부분 화면 밖에 있다.  선택 후 F
```

**변환 도구**

| 도구 | 단축키 |
|---|:--:|
| 손(뷰 이동) | Q |
| 이동 | **W** |
| 회전 | **E** |
| 크기 | **R** |
| 사각 변환 | T |

### 3-6. 애셋과 Project 폴더

**왜 필요한가** — 규칙이 없으면 3주 뒤에 아무것도 못 찾는다.

```
   Assets/
   ├─ Scenes/          씬 파일
   ├─ Scripts/         C# 스크립트
   ├─ Prefabs/         프리팹
   ├─ Materials/       머티리얼
   ├─ Art/
   │   ├─ Models/
   │   ├─ Textures/
   │   └─ Animations/
   ├─ Audio/
   └─ Settings/        URP 설정 등
```

```
   ★ 규칙 세 가지

   ① 한글 폴더명·파일명 금지 (빌드에서 문제)
   ② 공백 대신 언더스코어 (My Cube → MyCube)
   ③ 접두사로 종류 표시 (M_ 머티리얼, T_ 텍스처, P_ 프리팹)
```

```
   ⚠️ .meta 파일을 지우면 안 된다

   Unity가 애셋마다 만드는 ID 파일
   → 지우면 참조가 전부 끊긴다
   → Git에 반드시 함께 커밋한다
```

### 3-7. 머티리얼과 URP

**왜 필요한가** — 색과 질감. Part 2의 `COLORREF`에 해당한다.

```
   Mesh          "모양"      (큐브, 구, 캐릭터)
   Material      "표면"      (색, 광택, 텍스처)
   Shader        "계산법"    (빛을 어떻게 계산할지)

   MeshRenderer 가 이 셋을 묶어 화면에 그린다
```

```
   ★ URP (Universal Render Pipeline)

   Unity의 표준 렌더 파이프라인
   → 모바일~PC를 하나로 커버
   → Shader Graph 사용 가능 (Day 94)
```

```
   ⚠️ URP 프로젝트에서 Built-in 셰이더를 쓰면 분홍색이 된다

   분홍색 = "셰이더를 못 찾음"

   해결:  머티리얼의 Shader를
          Universal Render Pipeline/Lit 로 변경
```

**머티리얼 만들기**

```
   Project 창 → 우클릭 → Create → Material
   이름: M_Cube
   Inspector에서 Base Map 옆 색상 클릭 → 색 선택
   Cube에 드래그 앤 드롭
```

### 3-8. 조명

**왜 필요한가** — 없으면 안 보인다.

| 종류 | 설명 |
|---|---|
| **Directional Light** | 태양광. 방향만 중요, 위치 무관 |
| Point Light | 전구. 한 점에서 사방으로 |
| Spot Light | 손전등. 원뿔형 |
| Area Light | 면광원 (베이크 전용) |

```
   ★ 새 씬에는 Directional Light가 기본으로 있다

   지우면 화면이 어두워진다
```

```
   ⚠️ Part 2에는 조명이 없었다

   2D에서는 색을 직접 지정했다
   3D에서는 "빛 × 재질 = 보이는 색"
```

### 3-9. 카메라

**왜 필요한가** — Game 뷰에 보이는 것을 결정한다.

| 필드 | 의미 |
|---|---|
| Projection | Perspective(원근) / Orthographic(직교) |
| Field of View | 시야각 (원근일 때) |
| Clipping Planes | Near / Far. 이 범위 밖은 안 그림 |
| Clear Flags | 배경 처리 방식 |

```
   Perspective (원근)        Orthographic (직교)

        ╱────╲                  ┌──────┐
       ╱      ╲                 │      │
      ╱        ╲                │      │
     ╱__________╲               └──────┘

   멀수록 작다 (3D)          크기가 일정 (2D, 아이소메트릭)
```

```
   ★ Day 58의 아이소메트릭을 Unity로 하려면

   Camera를 Orthographic으로 두고
   Rotation을 (30, 45, 0)으로

   → 직접 만든 변환 공식을 카메라 설정으로 대체
```

```
   ⚠️ Game 뷰가 검을 때 확인 순서

   ① 씬에 Camera가 있나
   ② Camera가 오브젝트 쪽을 보고 있나 (Scene 뷰에서 확인)
   ③ Clipping Planes 범위 안에 있나
   ④ 조명이 있나
   ⑤ 오브젝트가 카메라 뒤에 있진 않나
```

---

## 4. 따라 만들기

### Step 1 — Unity Hub 설치와 버전 확인

```
   ① unity.com/download 에서 Unity Hub 설치
   ② Hub → Installs → Install Editor
   ③ Unity 6 LTS (6000.0.x) 선택
   ④ 모듈: Microsoft Visual Studio (또는 이미 있으면 생략)
   ⑤ 모듈: Windows Build Support (IL2CPP)
```

> ### ⚠️ 전원 같은 버전이어야 한다
>
> ```
>    버전이 다르면
>    ① 상위 버전에서 저장한 프로젝트를 하위에서 못 연다
>    ② UGUI, NavMesh, Shader Graph의 UI가 다르다
>    ③ 문서의 메뉴 경로가 안 맞는다
> ```
>
> **지금 옆 사람과 버전을 확인한다.**

**✅ 여기까지 하면** — Hub의 Installs에 `6000.0.xx` 가 보인다.

<!-- SHOT: Unity Hub Installs -->

### Step 2 — 프로젝트 생성

```
   Hub → Projects → New project
   템플릿: Universal 3D  (URP)
   이름:   RunnerGame
   위치:   D:\UnityProjects\  (경로에 한글·공백 없이)
```

```
   ⚠️ 프로젝트 경로에 한글이 있으면

   일부 패키지·빌드에서 오류가 난다
   → 영문 경로로
```

**✅ 여기까지 하면** — 에디터가 열리고 `SampleScene`이 보인다. 첫 로딩은 1~3분 걸린다.

### Step 3 — 에디터 둘러보기

```
   ① Hierarchy에서 Main Camera 클릭  →  Inspector 확인
   ② Scene 뷰에서 Alt+드래그로 회전
   ③ 휠로 줌
   ④ Main Camera 선택 후 F  →  카메라로 포커스
   ⑤ Game 탭 클릭  →  카메라 시점 확인
   ⑥ Play 버튼  →  아무 일도 안 일어남 (정상)
   ⑦ Play 다시 눌러 정지
```

```
   ⚠️ Play 중에 한 변경은 정지하면 사라진다

   Unity 초보자가 가장 많이 겪는 좌절
   → Play 버튼이 눌려 있는지 항상 확인
```

**Play 중임을 눈에 띄게 하기**

```
   Edit → Preferences → Colors
   → Playmode tint 를 눈에 띄는 색으로 (예: 옅은 주황)
```

**✅ 여기까지 하면** — Play 중에 에디터 전체가 색이 변한다.

### Step 4 — 폴더 구조 만들기

```
   Project 창 → Assets 우클릭 → Create → Folder

   Scenes
   Scripts
   Prefabs
   Materials
   Art
   Audio
```

```
   SampleScene을 Scenes/ 로 드래그
   이름을 Main 으로 변경 (F2)
```

**✅ 여기까지 하면** — `Assets/Scenes/Main.unity` 가 된다.

### Step 5 — 바닥 만들기

```
   Hierarchy 우클릭 → 3D Object → Plane
   이름: Ground
```

```
   Inspector → Transform
   Position  (0, 0, 0)
   Scale     (5, 1, 5)          ← Plane은 기본 10×10이므로 50×50이 된다
```

```
   ★ Plane vs Cube 바닥

   Plane:  한 면만. 아래에서 보면 안 보인다
   Cube:   6면. 두께가 있다

   런닝 게임 바닥은 Plane으로 충분
```

**✅ 여기까지 실행하면** — Scene 뷰에 회색 바닥이 넓게 깔린다.

### Step 6 — 큐브 배치

```
   Hierarchy 우클릭 → 3D Object → Cube
   이름: Player
```

```
   Position  (0, 0.5, 0)
```

```
   ⚠️ 왜 y = 0.5 인가

   Cube의 기본 크기는 1×1×1
   원점(피벗)은 중심

   y=0 이면 절반이 바닥에 묻힌다

        y=0                y=0.5
      ┌─────┐            ┌─────┐
      │  ●  │            │  ●  │
   ▓▓▓┴─────┴▓▓▓      ▓▓▓└─────┘▓▓▓
      묻힘                올라섬
```

**✅ 여기까지 실행하면** — 바닥 위에 흰 큐브가 놓인다.

<!-- SHOT: Step 6 바닥과 큐브 -->

### Step 7 — 머티리얼 만들기

```
   Materials 폴더 우클릭 → Create → Material
   이름: M_Player
```

```
   Inspector에서
   Shader:  Universal Render Pipeline/Lit    (기본값 확인)
   Base Map 옆 색상 상자 클릭 → 원하는 색
```

```
   M_Player 를 Hierarchy의 Player 로 드래그
```

**같은 방법으로 `M_Ground`를 만들어 Ground에 적용한다.**

**✅ 여기까지 실행하면** — 큐브와 바닥에 색이 입혀진다.

**분홍색이 나오면**

```
   Shader 드롭다운에서
   Universal Render Pipeline → Lit 선택
```

### Step 8 — 부모-자식 실험

```
   Hierarchy 우클릭 → Create Empty
   이름: PlayerRoot
   Position (0, 0, 0)

   Player를 PlayerRoot 위로 드래그  →  자식이 된다
```

```
   Hierarchy

   ▾ PlayerRoot
     └─ Player
```

**PlayerRoot의 Position을 (3, 0, 0)으로 바꾼다.**

**✅ 여기까지 실행하면**

```
   Player의 Inspector

   Position (0, 0.5, 0)          ← localPosition. 안 변했다

   그런데 Scene 뷰에서는 (3, 0.5, 0)에 있다
```

```
   ★ Inspector의 Position은 로컬 좌표다

   월드 좌표를 코드로 얻으려면 transform.position
```

**PlayerRoot를 회전시켜 본다 (Rotation Y = 45).**

```
   자식도 함께 돈다
```

**✅ 확인 후** — PlayerRoot의 Transform을 원래대로 되돌린다.

### Step 9 — 조명 실험

```
   Directional Light 선택
   Rotation을 (50, -30, 0) 근처로 조절
```

**✅ 여기까지 실행하면** — 그림자 방향이 바뀐다.

**Directional Light를 비활성화해 본다** (Inspector 맨 위 체크박스 해제)

```
   화면이 어두워진다 (완전히 검지는 않다 — 환경광 때문)
```

```
   ★ 환경광 (Ambient)

   Window → Rendering → Lighting
   → Environment 탭에서 조절
```

**✅ 확인 후** — 조명을 다시 켠다.

### Step 10 — 카메라 배치

```
   Main Camera 선택
   Position  (0, 5, -10)
   Rotation  (20, 0, 0)
```

```
   ★ 조준 요령

   ① Scene 뷰에서 원하는 시점을 만든다
   ② Main Camera 선택
   ③ GameObject → Align With View  (Ctrl+Shift+F)

   → 카메라가 현재 Scene 뷰 시점으로 이동
```

**✅ 여기까지 실행하면** — Game 뷰에 바닥과 큐브가 적당한 각도로 보인다.

<!-- SHOT: Step 10 Game 뷰 -->

### Step 11 — Perspective vs Orthographic

```
   Main Camera → Projection → Orthographic
   Size: 6
```

**✅ 여기까지 실행하면**

```
   원근감이 사라진다
   → 멀리 있는 것도 같은 크기
```

**큐브를 여러 개 복제해 앞뒤로 놓고 비교한다.**

```
   Ctrl+D 로 복제, W로 이동
```

```
   Perspective            Orthographic

     ┌──┐                   ┌──┐
     │  │  가까운 것         │  │
     └──┘                   └──┘
      ┌┐   먼 것            ┌──┐
      └┘                    └──┘
                            같은 크기
```

**✅ 확인 후** — Perspective로 되돌린다.

### Step 12 — 씬 저장과 Build Settings

```
   Ctrl+S 로 저장

   File → Build Settings (또는 Build Profiles)
   → Add Open Scenes
```

```
   ⚠️ 여기에 등록하지 않으면 빌드에 씬이 안 들어간다

   Day 75에서 빌드할 때 이 실수가 가장 많다
```

**✅ 여기까지 하면** — Scenes In Build에 `Scenes/Main` 이 보인다.

### Step 13 — 컴포넌트 조합 체험

```
   Player 선택 → Inspector 맨 아래 Add Component
   → Physics → Rigidbody
```

**Play를 누른다.**

**✅ 여기까지 실행하면** — **큐브가 떨어져 바닥에 착지한다.**

```
   ★ 코드 한 줄도 안 썼다

   Rigidbody 컴포넌트를 "붙인" 것뿐

   Part 2였다면
   → 중력 변수, 속도 적분, 지면 충돌, 위치 보정
   → 최소 50줄
```

**Rigidbody의 Use Gravity를 끄고 Play.**

```
   떨어지지 않는다
```

**Rigidbody를 제거하고 Play.**

```
   아무 일도 안 일어난다
```

> ### ★ 이 실험이 오늘의 핵심이다
>
> **오브젝트의 능력 = 붙어 있는 컴포넌트의 합**
>
> Part 2에서는 클래스가 무엇인지가 능력을 정했다.
> Unity에서는 무엇을 가졌는지가 능력을 정한다.

### Step 14 — 컴포넌트 조합 연습

**다음을 각각 만들어 본다.**

| 오브젝트 | 컴포넌트 조합 |
|---|---|
| 떨어지는 상자 | Cube + Rigidbody |
| 고정된 벽 | Cube (Rigidbody 없음) |
| 통과하는 아이템 | Sphere + Box Collider(isTrigger ✔) |
| 물리 없는 장식 | Cylinder + Collider 제거 |

```
   ★ Collider를 제거하면 통과한다
     Rigidbody가 없으면 안 움직인다
```

**✅ 여기까지 실행하면** — Play 시 상자는 떨어지고, 벽은 그대로, 아이템은 통과한다.

### Step 15 — 정리

```
   Ctrl+S
   실험용 큐브 정리
   Ground, Player, Main Camera, Directional Light 만 남긴다
```

**✅ 최종** — 1절의 화면.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌────────────────────────────────────────────────────────────────┐
   │ File Edit ...            ▶  ⏸  ⏭                     Layout ▾ │
   ├──────────────┬───────────────────────────────┬─────────────────┤
   │ Hierarchy    │  Scene   Game                 │  Inspector      │
   │              │                               │                 │
   │ ▾ Main       │      ┌───┐                    │ ☑ Player        │
   │   Main Camera│      │   │                    │                 │
   │   Direct.Lig │      └───┘                    │ ▾ Transform     │
   │   Ground     │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓             │   Pos 0  0.5  0 │
   │   Player     │                               │ ▾ Mesh Renderer │
   │              │                               │   Mat  M_Player │
   ├──────────────┴───────────────────────────────┤ ▾ Box Collider  │
   │ Project                                      │ ▾ Rigidbody     │
   │ ▾ Assets                                     │   Mass 1        │
   │   Scenes/ Scripts/ Prefabs/ Materials/ Art/  │   Use Gravity ✔ │
   └──────────────────────────────────────────────┴─────────────────┘
```

- [ ] Unity 6 LTS (6000.0.x) 버전이 전원 동일하다
- [ ] URP 3D 템플릿으로 프로젝트를 만들었다
- [ ] 폴더 구조를 만들었다 (Scenes/Scripts/Prefabs/Materials/Art/Audio)
- [ ] 씬을 `Scenes/Main.unity`로 저장했다
- [ ] 바닥(Plane)과 큐브가 놓여 있다
- [ ] 큐브가 바닥에 묻히지 않았다 (y = 0.5)
- [ ] 머티리얼을 만들어 색을 입혔다 (분홍색 아님)
- [ ] Game 뷰에 장면이 보인다
- [ ] Alt+드래그 / 휠 / F 로 씬 뷰를 조작할 수 있다
- [ ] 부모-자식 관계를 만들고 함께 움직이는 것을 봤다
- [ ] Perspective와 Orthographic의 차이를 봤다
- [ ] **Rigidbody를 붙였더니 코드 없이 떨어졌다**
- [ ] Build Settings에 씬을 등록했다
- [ ] Play 중 색상 틴트가 보인다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **버전이 다름** | Hub 설치 버전 상이 | **즉시 통일.** 나중엔 프로젝트를 못 연다 |
| Game 뷰가 검음 | 카메라 방향/조명 | 3-9절 확인 순서 |
| 오브젝트가 분홍색 | Built-in 셰이더 | Shader를 URP/Lit로 |
| 만든 오브젝트가 안 보임 | 화면 밖 | 선택 후 **F** |
| Play 후 변경이 사라짐 | Play 중 편집 | 정지 후 편집. 틴트 설정 |
| 큐브가 바닥에 묻힘 | 피벗이 중심 | y = 크기/2 |
| 씬 저장이 안 됨 | 저장 안 함 | Ctrl+S |
| 프로젝트 로딩이 매우 느림 | 첫 임포트 | 정상. 이후엔 빠르다 |
| 애셋 참조가 끊김 | `.meta` 삭제 | 절대 지우지 않는다 |
| 경로 오류 | 한글/공백 경로 | 영문 경로로 이동 |
| Inspector 값이 안 변함 | 프리팹 모드 혼동 | 어느 것을 편집 중인지 확인 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **GameObject + Component** | 상속이 아니라 조합. "무엇을 가졌나" |
| 클래스 폭발 | 상속의 한계. 컴포넌트가 해결 |
| **Transform** | 유일한 필수 컴포넌트. 위치/회전/크기 |
| 로컬 vs 월드 | Inspector는 로컬, `transform.position`은 월드 |
| Unity 좌표계 | y가 **위로** +. 왼손 좌표계 |
| Scene | 저장된 오브젝트 배치. `.unity` 파일 |
| 에디터 6창 | Hierarchy / Scene / Game / Inspector / Project / Console |
| **F 키** | 선택 오브젝트로 포커스 |
| Material / URP | URP/Lit. 분홍색 = 셰이더 못 찾음 |
| 조명 | 없으면 안 보인다. Directional = 태양 |
| Perspective/Ortho | 원근 / 직교(2D·아이소메트릭) |
| `.meta` | 애셋 ID. 절대 삭제 금지 |

### Part 2와의 대응

| Part 2 | Unity | 오늘 확인 |
|---|---|:--:|
| `WinMain` + 메시지 루프 | 없음 (엔진) | ✔ |
| `GameObject` 상속 트리 | GameObject + Component | ✔ |
| `Scene` 클래스 | `.unity` 애셋 | ✔ |
| 중력 직접 구현 | Rigidbody 체크 하나 | ✔ |
| `COLORREF` | Material | ✔ |
| 화면 좌표 y 반전 | 불필요 (y가 위) | ✔ |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 72** | 스크립트도 컴포넌트다 |
| Day 74 | 프리팹 = 컴포넌트 조합의 저장 |
| Day 76 | RectTransform (UI용 Transform) |
| Day 82 | Animator도 컴포넌트 |
| 전 구간 | 매일 쓴다 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 큐브 5개로 계단 만들기 | Ctrl+D 복제, W 이동 |
| ★★ | 부모 오브젝트를 회전시켜 위성 궤도 만들기 | 빈 오브젝트 + 자식 큐브 |
| ★★★ | Orthographic 카메라 (30, 45, 0)으로 아이소메트릭 뷰 | Day 58과 비교해 보기 |
| ★★★ | Rigidbody 상자 20개를 쌓아 무너뜨리기 | Mass/Drag 조절 |

### 다음 시간

> 큐브가 떨어진다. 그런데 **내가 시킨 게 아니다.**
>
> ```
>   지금:   컴포넌트를 붙이면 정해진 동작만 한다

>   필요:   "스페이스를 누르면 점프"
>           "적을 만나면 죽는다"
>           → 내 규칙을 넣어야 한다
> ```
>
> **스크립트도 컴포넌트다.** `MonoBehaviour`를 붙이면 매 프레임 내 코드가 호출된다.
>
> Part 2의 `Core::Update(dt)` 자리에 무엇이 오는지 확인한다.
>
> → **Day 72, C# 스크립트와 MonoBehaviour 생명주기**
