# Day 094 · Shader Graph — 셰이더 기초 ★

> **Week 19** · 연결 문서 `17 레이싱 게임` — Step 4
> 선수: Day 093 (AI 레이서), **Day 068 (지형 파괴와 알파 블렌딩)**

---

## 1. 오늘 만드는 것

**직접 만든 셰이더가 차체와 노면에 적용된다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  Shader Graph — SG_CarBody                             │
   │                                                        │
   │  [Color]────────────╮                                  │
   │                     ├──▶[Lerp]──▶ Base Color           │
   │  [Fresnel]──[Power]─╯       ▲                          │
   │       ▲                     │                          │
   │  [Boost(0~1)]───────────────╯                          │
   │                                                        │
   │  [Metallic]──────────────────▶ Metallic                │
   │  [Smoothness]────────────────▶ Smoothness              │
   │  [Fresnel]×[Emission Color]──▶ Emission                │
   │                                                        │
   ├────────────────────────────────────────────────────────┤
   │  Game                                                  │
   │            ╱‾‾‾‾╲                                      │
   │           │ ▓▓▓▓ │  ← 테두리가 빛난다 (Fresnel)          │
   │          ◯│ ████ │◯                                    │
   │           ╲____╱                                       │
   │  ═══════════════════════════  ← 노면 UV 스크롤          │
   │                                                        │
   │  부스터 [Space]   발광 강도 2.4                          │
   └────────────────────────────────────────────────────────┘
```

<!-- SHOT: Day 94 완성 화면 -->

---

## 2. 막히는 상황

지금까지 머티리얼을 만들어 색을 바꿨다.

```
   Shader: Universal Render Pipeline/Lit
   Base Map: 파란색
   Metallic: 0.8
   Smoothness: 0.9
```

```
   ★ 그런데 원하는 것이 안 된다

   × 부스터를 쓰면 차체 테두리가 빛나게
   × 노면 텍스처가 흘러가게 (속도감)
   × 데미지를 입으면 지글거리게
   × 특정 각도에서만 다른 색으로
```

```
   ★ URP/Lit은 정해진 것만 할 수 있다

   → 셰이더를 직접 만들어야 한다
```

```
   Part 2에서는 어떻게 했나

   Day 68:  픽셀 하나하나를 CPU에서 계산했다

   for (y) for (x)
   {
       BYTE* p = m_bits + y * m_pitch + x * 4;
       p[0] = (BYTE)(p[0] * (1-a) + b * a);
       ...
   }
```

```
   ★ 그때 배운 것

   ① "픽셀의 최종 색을 결정하는 계산"이 있다
   ② 그 계산이 화면 픽셀 수만큼 반복된다
   ③ CPU로는 느리다 (160배 차이)
```

> **그 계산을 GPU에서 한다. 그것이 셰이더다.**

---

## 3. 개념

### 3-1. 렌더링 파이프라인

**왜 필요한가** — 셰이더가 어디에 있는지 알아야 한다.

```
   [Part 2 · 손으로]                    [Unity · GPU 파이프라인]

   백버퍼 DC 준비                        렌더 타겟 준비
   for (오브젝트)                        버텍스 셰이더 (정점 변환)
     TransparentBlt(...)         →      래스터화 (삼각형 → 픽셀)
   BitBlt(화면)                          프래그먼트 셰이더 (픽셀 색 결정)  ← 오늘 만지는 곳
                                        출력 병합 (블렌딩) ← Day 68 AlphaBlend가 여기
```

```
   ★ 단계별로

   ① 버텍스 셰이더
      정점 하나하나를 화면 좌표로 변환
      → 정점 수만큼 실행 (수천~수만 번)

   ② 래스터화
      삼각형을 픽셀로 쪼갠다
      → GPU가 자동으로 (건드릴 수 없다)

   ③ 프래그먼트(픽셀) 셰이더
      각 픽셀의 색을 결정
      → 픽셀 수만큼 실행 (수백만 번)  ★

   ④ 출력 병합
      깊이 검사, 블렌딩
```

```
   ★ 왜 GPU가 빠른가

   CPU:  코어 8~16개.  순차 처리에 강함
   GPU:  코어 수천 개. 같은 계산을 동시에

   픽셀 200만 개 × 같은 계산
   → GPU에 완벽히 맞는 작업
```

```
   ★ Day 68에서 160배 차이를 봤다

   GetPixel/SetPixel:  82 ms
   DIB 직접 접근:      0.5 ms

   GPU 셰이더:         0.05 ms 수준
```

### 3-2. 셰이더와 머티리얼

**왜 필요한가** — 관계를 명확히.

```
   Shader      "계산 방법"        (프로그램)
      ↑
   Material    "그 계산의 입력값"  (색, 텍스처, 수치)
      ↑
   Renderer    "어디에 적용할지"
```

```
   ★ 하나의 셰이더 + 여러 머티리얼

   SG_CarBody (셰이더)
   ├─ M_Car_Red    (Color = 빨강)
   ├─ M_Car_Blue   (Color = 파랑)
   └─ M_Car_Yellow (Color = 노랑)

   → 셰이더는 하나만 컴파일된다
```

```
   ⚠️ 셰이더 컴파일

   빌드 시 또는 첫 사용 시 컴파일된다
   → 첫 프레임에 렉이 생길 수 있다
   → Shader Variant Collection으로 미리 워밍업
```

### 3-3. Shader Graph 기본

**왜 필요한가** — 코드 없이 셰이더를 만든다.

```
   Package Manager → Shader Graph (URP에는 기본 포함)

   Create → Shader Graph → URP → Lit Shader Graph
```

```
   ★ 마스터 스택

   ┌─────────────────┐
   │  Vertex         │
   │   Position      │   ← 정점 변환 (버텍스 셰이더)
   │   Normal        │
   │   Tangent       │
   ├─────────────────┤
   │  Fragment       │
   │   Base Color    │   ← 픽셀 색 (프래그먼트 셰이더)  ★
   │   Normal        │
   │   Metallic      │
   │   Smoothness    │
   │   Emission      │
   │   Alpha         │
   └─────────────────┘
```

```
   ★ 노드 = 계산 하나

   Multiply, Add, Lerp, Sample Texture 2D ...
   → 노드를 연결해 계산식을 만든다
```

```
   ★ 코드로 쓰면

   float3 baseColor = lerp(colorA, colorB, t);

   ★ 노드로 그리면

   [Color A]──╮
   [Color B]──┼──[Lerp]──▶ Base Color
   [t]────────╯
```

### 3-4. Property — 외부 노출

**왜 필요한가** — 머티리얼에서 조절한다.

```
   Blackboard(좌측 패널) → + → 타입 선택

   Color, Float, Vector2/3/4, Texture2D, Boolean ...
```

| 항목 | 의미 |
|---|---|
| **Name** | Inspector에 보이는 이름 |
| **Reference** | 코드에서 쓰는 내부 이름 ★ |
| Default | 기본값 |
| Mode | Default / Slider / Color HDR |
| Exposed | Inspector 노출 여부 |

```
   ⚠️ Reference 이름

   Name:      "Boost Amount"
   Reference: "_BoostAmount"     ← 코드에서 이걸 쓴다

   material.SetFloat("_BoostAmount", 0.8f);
```

```
   ★ 관례

   Reference는 언더스코어로 시작
   _BaseColor, _MainTex, _BoostAmount
```

```
   ⚠️ Name으로 SetFloat하면 조용히 실패한다

   오류도 경고도 없다
   → Day 82의 Animator 파라미터와 같은 함정
```

### 3-5. 기본 노드

**왜 필요한가** — 오늘 쓸 도구.

| 노드 | 역할 |
|---|---|
| **Sample Texture 2D** | 텍스처에서 색 읽기 |
| **Multiply** | 곱하기 (색 조절, 마스킹) |
| **Add** | 더하기 (밝기, 오프셋) |
| **Lerp** | 두 값 사이 보간 |
| **Time** | 시간 (애니메이션) |
| **UV** | 텍스처 좌표 |
| **Tiling And Offset** | UV 반복·이동 |
| **Fresnel Effect** | 가장자리 강조 |
| **Step / Smoothstep** | 경계 만들기 |
| **Saturate** | 0~1로 자르기 |
| **Normal Vector** | 표면 법선 |
| **Position** | 정점/픽셀 위치 |
| **Dot Product** | 내적 |
| **Remap** | 값 범위 변환 |

```
   ★ Lerp가 가장 많이 쓰인다

   Lerp(A, B, t)  =  A × (1-t) + B × t

   ⚠️ 이것이 Day 68의 알파 블렌딩 공식이다

   결과 = 배경 × (1-α) + 색 × α
```

```
   ★ Day 68에서 손으로 쓴 것

   p[0] = (BYTE)(p[0] * (1-a) + b * a);

   ★ Shader Graph에서는

   [배경색]──╮
   [새 색]───┼──[Lerp]──▶
   [알파]────╯
```

### 3-6. Fresnel Effect

**왜 필요한가** — 가장자리 발광의 기본.

```
   ★ 프레넬 효과

   표면을 비스듬히 볼수록 반사가 강해지는 현상
   → 물, 유리, 자동차 도장

   ┌────────────────┐
   │   ░░░░░░░░░░   │  정면 = 어둡다
   │ ▓░░░░░░░░░░░▓  │
   │▓▓░░░░░░░░░░░▓▓ │  가장자리 = 밝다
   │ ▓░░░░░░░░░░░▓  │
   │   ░░░░░░░░░░   │
   └────────────────┘
```

```
   ★ 계산 원리

   fresnel = pow(1 - dot(normal, viewDir), power)

   normal   = 표면 방향
   viewDir  = 카메라 방향

   두 방향이 같으면(정면)   dot = 1  →  fresnel = 0
   두 방향이 수직이면(측면) dot = 0  →  fresnel = 1
```

```
   ★ Power 값

   1   →  넓게 퍼진다
   3   →  적당  ★
   8   →  가장자리에만 얇게
```

```
   ★ Day 84의 Vector3.Dot이 여기서도 쓰인다
```

### 3-7. UV와 텍스처 좌표

**왜 필요한가** — 텍스처를 어디에서 읽을지.

```
   ★ UV 좌표계

   (0,1) ┌───────────┐ (1,1)
         │           │
         │  텍스처    │
         │           │
   (0,0) └───────────┘ (1,0)

   메시의 각 정점이 UV 값을 가진다
   → 픽셀마다 보간된 UV로 텍스처를 읽는다
```

```
   ★ Tiling And Offset

   Tiling (2, 2)  →  텍스처가 4번 반복
   Offset (0.5, 0) →  오른쪽으로 절반 이동
```

```
   ★ UV 스크롤 (애니메이션)

   [Time]──[Multiply(속도)]──▶ Offset
                                 ↓
   [UV]───────────────[Tiling And Offset]──▶ Sample Texture 2D
```

```
   ⚠️ Time을 그대로 쓰면 계속 커진다

   float 정밀도 문제로 오래 실행 시 끊긴다
   → Fraction 노드로 0~1 반복
```

```
   ★ Day 88의 Simulation Space와 비슷한 함정

   "시간이 계속 흐른다"는 것을 의식해야 한다
```

### 3-8. Blend 모드와 알파

**왜 필요한가** — Day 68의 블렌딩이 여기 있다.

```
   Graph Settings (그래프 상단 톱니)

   Surface Type:   Opaque / Transparent
   Blending Mode:  Alpha / Premultiply / Additive / Multiply
   Render Face:    Front / Back / Both
   Alpha Clipping: ✔ 이면 Alpha Threshold 사용
```

| Blending Mode | 계산 | Day 68 대응 |
|---|---|---|
| **Alpha** | `dst×(1-α) + src×α` | `BlendPixel` |
| **Additive** | `dst + src×α` | Day 88 Additive |
| Premultiply | `dst×(1-α) + src` | — |
| Multiply | `dst × src` | — |

```
   ★ Day 68의 공식이 그대로다

   Alpha:     결과 = 배경×(1-α) + 색×α
   Additive:  결과 = 배경 + 색×α
```

```
   ★ Alpha Clipping

   알파가 임계값 미만이면 픽셀을 아예 버린다
   → 나뭇잎, 철망 등
   → Transparent보다 빠르다 (정렬 불필요)
```

```
   ⚠️ Transparent의 비용

   ① 정렬이 필요하다 (뒤에서 앞으로)
   ② 오버드로우 (Day 88)
   ③ 깊이 쓰기 안 함

   → 꼭 필요할 때만
```

### 3-9. 코드에서 제어

**왜 필요한가** — 게임 로직과 연결.

```csharp
    // ★ Reference 이름을 쓴다
    private static readonly int BoostId = Shader.PropertyToID("_BoostAmount");
    private static readonly int ColorId = Shader.PropertyToID("_BaseColor");

    private Renderer rend;
    private MaterialPropertyBlock block;

    void Awake()
    {
        rend = GetComponent<Renderer>();
        block = new MaterialPropertyBlock();
    }

    public void SetBoost(float amount)
    {
        rend.GetPropertyBlock(block);
        block.SetFloat(BoostId, amount);
        rend.SetPropertyBlock(block);          // ★ 머티리얼 복제 없음
    }
```

```
   ★ Shader.PropertyToID

   문자열 → 정수 ID
   → 매번 문자열 해싱을 피한다
   → Day 82의 Animator.StringToHash와 같은 원리
```

```
   ★ MaterialPropertyBlock (Day 85)

   material.SetFloat()  →  머티리얼 인스턴스 생성. 배칭 깨짐
   PropertyBlock        →  복제 없음. 배칭 유지  ★
```

```
   ⚠️ PropertyBlock의 한계

   ① 셰이더 키워드는 못 바꾼다
   ② SRP Batcher와 함께 쓰면 배칭이 깨질 수 있다
      → GPU Instancing 대응 셰이더를 쓰거나
      → 머티리얼을 나눈다
```

### 3-10. Sub Graph

**왜 필요한가** — 재사용.

```
   Create → Shader Graph → Sub Graph
```

```
   ★ 여러 셰이더에서 쓰는 계산을 묶는다

   SG_Fresnel_Glow (Sub Graph)
   ├─ 입력: Power, Intensity, Color
   └─ 출력: Emission

   → SG_CarBody, SG_Enemy, SG_Shield 에서 재사용
```

```
   ★ Day 40에서 배운 것

   "반복되는 코드는 함수로"
   → 셰이더에서는 Sub Graph
```

### 3-11. Custom Function

**왜 필요한가** — 노드로 안 되는 것.

```
   Custom Function 노드

   Type: File (HLSL 파일) 또는 String (인라인)
```

```hlsl
// Fresnel.hlsl
void MyFresnel_float(float3 Normal, float3 ViewDir, float Power, out float Out)
{
    Out = pow(1.0 - saturate(dot(normalize(Normal), normalize(ViewDir))), Power);
}
```

```
   ⚠️ 함수 이름 규칙

   이름_float  (또는 _half)
   → Shader Graph가 정밀도에 따라 자동 선택
```

```
   ★ 언제 필요한가

   ① 반복문 (노드로 불가)
   ② 복잡한 수학
   ③ 성능 최적화

   → 대부분은 노드로 충분하다
```

### 3-12. 성능 고려

**왜 필요한가** — 픽셀 수만큼 실행된다.

```
   ★ 비용의 감각

   1920×1080 = 200만 픽셀
   → 프래그먼트 셰이더가 초당 1억 2천만 번 실행 (60fps)
```

| 비싼 것 | 대안 |
|---|---|
| 텍스처 샘플링 다수 | 채널에 여러 정보 패킹 (RGBA) |
| `pow`, `sin`, `sqrt` | 룩업 텍스처 또는 근사 |
| 분기(if) | `lerp`, `step`으로 대체 |
| Transparent | Opaque + Alpha Clip |
| 큰 텍스처 | 압축, mip |

```
   ★ 분기가 비싼 이유

   GPU는 여러 픽셀을 동시에 처리한다
   → 일부만 if를 타면 둘 다 실행하고 하나를 버린다
   → 결국 둘 다 계산한 비용
```

```
   ★ 대신 lerp

   if (t > 0.5) c = A; else c = B;    ✗
   c = lerp(B, A, step(0.5, t));      ✔
```

```
   ★ Day 89에서 배운 것

   측정 → 병목 → 개선
   Frame Debugger로 셰이더 비용을 확인한다
```

---

## 4. 따라 만들기

### Step 1 — 첫 Shader Graph

```
   Create → Shader Graph → URP → Lit Shader Graph
   이름: SG_CarBody
   더블클릭해 연다
```

```
   ★ 화면 구성

   좌측  Blackboard (Property 목록)
   중앙  그래프 캔버스
   우측  Graph Inspector (설정)
   하단  Main Preview (미리보기)
```

**✅ 여기까지 하면** — 빈 그래프가 열린다.

<!-- SHOT: Step 1 Shader Graph 창 -->

### Step 2 — 기본 색

```
   Blackboard → + → Color
   Name: Base Color
   Reference: _BaseColor
   Default: 파란색
```

```
   Property를 캔버스로 드래그
   → Base Color 노드가 생긴다

   그 노드의 출력을 Fragment의 Base Color에 연결
```

```
   Save Asset 클릭
```

**머티리얼을 만들어 차체에 적용한다.**

```
   Create → Material → M_Car_Blue
   Shader: Shader Graphs/SG_CarBody
```

**✅ 여기까지 실행하면** — 차가 파랗다. Inspector에서 색을 바꿀 수 있다.

### Step 3 — 금속·광택

```
   Blackboard에 Float 2개 추가

   Metallic     Reference _Metallic     Mode Slider (0~1)  Default 0.8
   Smoothness   Reference _Smoothness   Mode Slider (0~1)  Default 0.85
```

**각각 Fragment의 Metallic / Smoothness에 연결한다.**

**✅ 여기까지 하면** — 금속 광택이 조절된다.

### Step 4 — Fresnel

```
   캔버스 우클릭 → Create Node → "Fresnel"
   → Fresnel Effect 노드

   Power: 3
```

```
   Blackboard에 Float 추가
   Fresnel Power   Reference _FresnelPower   Default 3

   → Fresnel Effect의 Power에 연결
```

```
   임시로 Fresnel 출력을 Base Color에 연결해 본다
```

**✅ 여기까지 하면**

```
   ★ Main Preview에서 구의 가장자리가 하얗게 빛난다
```

<!-- SHOT: Step 4 Fresnel -->

**Power를 1, 8로 바꿔 본다.**

```
   1  →  넓게 퍼진다
   8  →  가장자리에만 얇게
```

### Step 5 — Fresnel 발광

```
   Blackboard에 추가
   Emission Color   Color   Mode HDR   Reference _EmissionColor
   Boost Amount     Float   Slider 0~1  Reference _BoostAmount
```

```
   노드 연결

   [Fresnel Effect]──╮
                     ├──[Multiply]──╮
   [Emission Color]──╯               ├──[Multiply]──▶ Emission
                                     │
   [Boost Amount]───────────────────╯
```

```
   ★ HDR 색

   Mode를 HDR로 하면 1을 넘는 밝기를 지정할 수 있다
   → Bloom(Day 95)과 함께 강하게 빛난다
```

**Base Color를 원래대로 되돌린다.**

**✅ 여기까지 실행하면**

```
   ★ Boost Amount를 올리면 테두리가 빛난다
```

<!-- SHOT: Step 5 발광 -->

### Step 6 — 코드 연결

```csharp
using UnityEngine;

public class CarBodyEffect : MonoBehaviour
{
    [SerializeField] private Renderer[] bodyRenderers;
    [SerializeField] private CarController car;
    [SerializeField] private float boostFadeSpeed = 3f;

    // ★ Reference 이름 (3-4절)
    private static readonly int BoostId = Shader.PropertyToID("_BoostAmount");

    private MaterialPropertyBlock block;
    private float currentBoost;

    void Awake()
    {
        block = new MaterialPropertyBlock();

        if (bodyRenderers == null || bodyRenderers.Length == 0)
            bodyRenderers = GetComponentsInChildren<Renderer>();
    }

    void Update()
    {
        // ★ 속도 비율에 따라 발광
        float target = Mathf.Clamp01(car.ForwardSpeed / car.MaxSpeed);

        // 부스터 중이면 최대
        if (Input.GetKey(KeyCode.LeftShift)) target = 1f;

        currentBoost = Mathf.MoveTowards(currentBoost, target,
                                          boostFadeSpeed * Time.deltaTime);

        SetBoost(currentBoost);
    }

    private void SetBoost(float amount)
    {
        foreach (Renderer r in bodyRenderers)
        {
            if (r == null) continue;

            r.GetPropertyBlock(block);
            block.SetFloat(BoostId, amount);
            r.SetPropertyBlock(block);
        }
    }
}
```

**✅ 여기까지 실행하면** — 속도가 오르면 차체가 빛난다.

### Step 7 — Reference 이름 실험

```csharp
    // ✗ Name을 사용
    private static readonly int BoostId = Shader.PropertyToID("Boost Amount");
```

**✅ 이렇게 하면**

```
   ★ 아무 일도 안 일어난다
   ★ 오류도 경고도 없다
```

```
   ⚠️ Day 82의 Animator 파라미터와 같은 함정
```

> **되돌린다.**

### Step 8 — MaterialPropertyBlock vs material

```csharp
    // 비교용
    r.material.SetFloat(BoostId, amount);      // ✗
```

**Stats 창의 Batches를 비교한다.**

**✅ 여기까지 하면**

```
   material:               Batches 34
   MaterialPropertyBlock:  Batches 21
```

```
   ★ Day 85에서 본 것과 같다
```

> **PropertyBlock으로 되돌린다.**

### Step 9 — 노면 UV 스크롤

```
   Create → Shader Graph → URP → Unlit Shader Graph
   이름: SG_RoadScroll
```

```
   Blackboard
   Main Texture   Texture2D   Reference _MainTex
   Scroll Speed   Vector2     Reference _ScrollSpeed   Default (0, 1)
   Tiling         Vector2     Reference _Tiling        Default (1, 10)
   Tint           Color       Reference _Tint
```

```
   노드 연결

   [Time]──[Multiply]──▶ Offset
              ▲              ↓
   [Scroll Speed]     [Tiling And Offset]──▶ UV
                             ▲                 ↓
                        [Tiling]      [Sample Texture 2D]
                                              ↓
                                        [Multiply]──▶ Base Color
                                              ▲
                                          [Tint]
```

```
   ★ Time 노드의 출력

   Time            누적 시간
   Sine Time       sin(t)
   Cosine Time     cos(t)
   Delta Time      프레임 간격
   Smooth Delta    평활화된 간격
```

**노면 Plane에 적용한다.**

**✅ 여기까지 실행하면**

```
   ★ 노면 텍스처가 흘러간다
   → 정지 상태에서도 움직이는 것처럼 보인다
```

<!-- SHOT: Step 9 UV 스크롤 -->

### Step 10 — 속도 연동 스크롤

```csharp
    private static readonly int ScrollId = Shader.PropertyToID("_ScrollSpeed");

    void Update()
    {
        float speedRatio = car.ForwardSpeed / car.MaxSpeed;

        block.SetVector(ScrollId, new Vector2(0, speedRatio * maxScroll));
        // ...
    }
```

```
   ⚠️ 실제 레이싱에서는 노면이 정적이다

   차가 움직이므로 스크롤이 불필요
   → 이 기법은 무한 러너, 배경 하늘에 적합
```

```
   ★ 대신 이렇게 쓴다

   ① 하늘 배경 흐름
   ② 터널 벽면 라인
   ③ 부스터 패드의 화살표
```

### Step 11 — Time 누적 문제

**게임을 오래 켜 둔다 (또는 Time을 큰 값으로 곱한다).**

```
   ★ 몇 시간 뒤 텍스처가 끊기거나 떨린다

   float 정밀도 한계
   Time이 100,000을 넘으면 소수점 정밀도가 떨어진다
```

```
   ★ 해결 — Fraction 노드

   [Time]──[Multiply]──[Fraction]──▶ Offset

   Fraction: 소수부만 (0~1 반복)
```

```
   ⚠️ Tiling이 1이 아니면 Fraction만으로 부족하다

   Tiling 10이면 0~10 반복이 필요
   → Modulo 노드 사용
```

### Step 12 — Sub Graph

```
   Create → Shader Graph → Sub Graph
   이름: SG_Sub_FresnelGlow
```

```
   Blackboard (Sub Graph의 입력)
   Power       Float
   Intensity   Float
   Glow Color  Color

   Output (Sub Graph Output 노드)
   Emission    Vector3
```

```
   그래프

   [Fresnel Effect]──[Multiply]──[Multiply]──▶ Emission
        ▲ Power          ▲            ▲
                    [Glow Color]  [Intensity]
```

**`SG_CarBody`에서 이 Sub Graph를 사용한다.**

```
   Create Node → 검색 "SG_Sub_FresnelGlow"
```

**✅ 여기까지 하면**

```
   ★ 그래프가 훨씬 깔끔해진다
   ★ 다른 셰이더에서도 재사용 가능
```

<!-- SHOT: Step 12 Sub Graph -->

### Step 13 — 알파 블렌딩 셰이더

```
   Create → Shader Graph → URP → Unlit Shader Graph
   이름: SG_Ghost
```

```
   Graph Settings (톱니 아이콘)
   Surface Type:  Transparent
   Blending Mode: Alpha
```

```
   Blackboard
   Ghost Color   Color   HDR
   Alpha         Float   Slider 0~1   Default 0.4
   Fresnel Power Float   Default 2

   연결
   [Ghost Color]──▶ Base Color

   [Fresnel]──[Add(Alpha)]──[Saturate]──▶ Alpha
```

```
   ★ 프레넬을 알파에 쓰면

   정면은 투명, 가장자리는 불투명
   → 홀로그램 느낌
```

**Day 87의 배치 고스트에 적용한다.**

**✅ 여기까지 하면** — 반투명 홀로그램 고스트.

```
   ★ Day 68의 알파 블렌딩이 GPU에서

   Part 2:  p[0] = p[0]*(1-a) + b*a;  (CPU, 픽셀당)
   Unity:   Blending Mode: Alpha      (GPU, 자동)
```

### Step 14 — Blending Mode 비교

**`SG_Ghost`의 Blending Mode를 Additive로 바꾼다.**

**✅ 이렇게 하면**

```
   Alpha:     배경을 가린다. 어두운 색은 어둡게
   Additive:  배경에 더한다. 검은색은 투명. 밝게 빛난다
```

```
   ★ Day 88에서 파티클로 본 것과 같다
```

### Step 15 — Step으로 경계 만들기

```
   SG_RoadScroll 에 추가

   [UV]──[Split]──[R]──[Fraction]──[Step(0.5)]──▶ 마스크
```

```
   ★ Step(edge, x)

   x < edge  →  0
   x >= edge →  1

   → 부드러운 값을 딱딱한 경계로
```

```
   ★ 활용

   ① 줄무늬 노면
   ② 체크무늬 결승선
   ③ 진행 바
```

```csharp
   // Smoothstep은 부드러운 경계
   Smoothstep(edge0, edge1, x)
```

**✅ 여기까지 하면** — 노면에 줄무늬가 생긴다.

### Step 16 — 분기 vs lerp 실험

**Custom Function으로 두 버전을 만들어 비교한다.**

```hlsl
// ✗ 분기
void BranchVersion_float(float t, float3 A, float3 B, out float3 Out)
{
    if (t > 0.5) Out = A;
    else         Out = B;
}

// ✔ lerp
void LerpVersion_float(float t, float3 A, float3 B, out float3 Out)
{
    Out = lerp(B, A, step(0.5, t));
}
```

```
   ★ 간단한 셰이더에서는 차이가 미미하다

   하지만 무거운 계산이 분기 안에 있으면 큰 차이
   → 둘 다 실행되기 때문
```

### Step 17 — 부스터 셰이더 완성

```
   SG_CarBody 최종

   Base Color
     [Base Color Property] ──╮
                             ├──[Lerp]──▶ Base Color
     [Boost Color]───────────╯      ▲
                                     │
     [Boost Amount]──────────────────╯

   Emission
     [SG_Sub_FresnelGlow] ──[Multiply]──▶ Emission
                                 ▲
                          [Boost Amount]

   Metallic / Smoothness
     Property 직결
```

```csharp
    // 부스터 시스템
    [SerializeField] private float boostDuration = 2f;
    [SerializeField] private float boostCooldown = 5f;
    [SerializeField] private float boostSpeedMultiplier = 1.35f;

    private float boostTimer;
    private float cooldownTimer;

    void Update()
    {
        cooldownTimer -= Time.deltaTime;

        if (Input.GetKeyDown(KeyCode.LeftShift) && cooldownTimer <= 0)
        {
            boostTimer = boostDuration;
            cooldownTimer = boostCooldown;
            car.SetSpeedMultiplier(boostSpeedMultiplier);
        }

        if (boostTimer > 0)
        {
            boostTimer -= Time.deltaTime;

            if (boostTimer <= 0) car.SetSpeedMultiplier(1f);
        }

        float target = boostTimer > 0 ? 1f
                       : Mathf.Clamp01(car.ForwardSpeed / car.MaxSpeed) * 0.4f;

        currentBoost = Mathf.MoveTowards(currentBoost, target,
                                          boostFadeSpeed * Time.deltaTime);

        SetBoost(currentBoost);
    }
```

**✅ 여기까지 실행하면**

```
   ★ Shift로 부스터
   ★ 차체가 밝게 빛나고 색이 변한다
   ★ 속도도 빨라진다
```

<!-- SHOT: Step 17 부스터 -->

### Step 18 — 분홍색 문제 재현

**빌드 설정에서 Render Pipeline을 Built-in으로 바꿔 본다.**

```
   Project Settings → Graphics → Scriptable Render Pipeline Settings를 None으로
```

**✅ 이렇게 하면**

```
   ★ 모든 오브젝트가 분홍색
   → Shader Graph는 URP 전용
```

> **되돌린다.**

```
   ★ 분홍색의 원인 정리

   ① 파이프라인 불일치 (Built-in ↔ URP)
   ② 셰이더 컴파일 오류
   ③ 셰이더 애셋 누락
   ④ 플랫폼 미지원 기능
```

### Step 19 — Frame Debugger

```
   Window → Analysis → Frame Debugger → Enable
```

**✅ 여기까지 하면**

```
   ★ 드로우 콜을 하나씩 볼 수 있다
   ★ 각 단계에서 화면이 어떻게 그려지는지
   ★ 사용된 셰이더와 프로퍼티 값
```

```
   ★ 유용한 경우

   ① "왜 안 보이지?" → 그려지긴 했는지
   ② "왜 배칭이 안 되지?" → Batch break 이유 표시
   ③ 셰이더 프로퍼티 값 확인
```

<!-- SHOT: Step 19 Frame Debugger -->

### Step 20 — 셰이더 워밍업

```csharp
    // 첫 사용 시 컴파일 렉 방지
    [SerializeField] private ShaderVariantCollection variants;

    void Start()
    {
        variants?.WarmUp();
    }
```

```
   ★ Shader Variant Collection 만들기

   Project Settings → Graphics → Shader Loading
   → Save to asset (플레이 후 사용된 변형이 기록된다)
```

```
   ⚠️ 변형이 너무 많으면 워밍업이 오래 걸린다

   로딩 화면에서 하는 것이 좋다
```

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  Shader Graph — SG_CarBody                             │
   │                                                        │
   │  [Base Color]────────╮                                 │
   │                      ├──▶[Lerp]──▶ Base Color          │
   │  [Boost Color]───────╯       ▲                         │
   │                              │                         │
   │  [Boost Amount]──────────────╯                         │
   │                                                        │
   │  [SG_Sub_FresnelGlow]──[Multiply]──▶ Emission          │
   │                             ▲                          │
   │                      [Boost Amount]                    │
   ├────────────────────────────────────────────────────────┤
   │  Game                                                  │
   │            ╱‾‾‾‾╲                                      │
   │           │ ▓▓▓▓ │  ← 테두리 발광                       │
   │          ◯│ ████ │◯                                    │
   │           ╲____╱                                       │
   │  ═══════════════════════════  ← UV 스크롤               │
   │                                                        │
   │  부스터 [Shift]   발광 1.0   속도 198 km/h              │
   └────────────────────────────────────────────────────────┘
```

- [ ] Shader Graph를 만들고 머티리얼에 적용했다
- [ ] Property로 색·금속·광택을 노출했다
- [ ] Inspector에서 즉시 반영된다
- [ ] Fresnel로 가장자리가 빛난다
- [ ] Power 값의 차이를 확인했다
- [ ] HDR 색으로 강한 발광을 만들었다
- [ ] **코드에서 `Shader.PropertyToID`로 제어한다**
- [ ] **Name을 쓰면 조용히 실패한다는 것을 확인했다**
- [ ] MaterialPropertyBlock이 배칭을 유지한다
- [ ] UV 스크롤로 노면이 흐른다
- [ ] Time 누적 문제와 Fraction을 이해했다
- [ ] Sub Graph로 재사용 구조를 만들었다
- [ ] Transparent + Alpha 블렌딩 셰이더를 만들었다
- [ ] Alpha와 Additive의 차이를 확인했다
- [ ] Step으로 경계를 만들었다
- [ ] 분기보다 lerp가 나은 이유를 이해했다
- [ ] 부스터 셰이더가 게임과 연동된다
- [ ] 파이프라인 불일치 시 분홍색이 된다
- [ ] Frame Debugger로 드로우 콜을 확인했다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **머티리얼이 분홍** | 파이프라인 불일치 | URP 셰이더 사용 |
| 머티리얼이 분홍 | 컴파일 오류 | 그래프 오류 확인 |
| Shader Graph 메뉴 없음 | 패키지 미설치 | Package Manager |
| **Property가 코드에서 안 먹힘** | Name 사용 | **Reference** 사용 |
| 변경이 반영 안 됨 | Save Asset 안 함 | 저장 |
| 배칭이 깨짐 | `material` 사용 | PropertyBlock |
| 투명이 안 됨 | Surface Type | Transparent |
| 투명 정렬 오류 | 반투명 특성 | Alpha Clip 고려 |
| 발광이 약함 | HDR 아님 | Color Mode HDR |
| 발광이 안 보임 | Bloom 없음 | Day 95 포스트 프로세싱 |
| UV 스크롤이 끊김 | Time 정밀도 | Fraction/Modulo |
| 첫 프레임 렉 | 셰이더 컴파일 | Variant Collection 워밍업 |
| 미리보기와 다름 | 조명 차이 | 실제 씬에서 확인 |
| 성능 저하 | 텍스처 샘플링 과다 | 채널 패킹 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **렌더링 파이프라인** | 버텍스 → 래스터화 → **프래그먼트** → 병합 |
| GPU가 빠른 이유 | 같은 계산을 수천 코어가 동시에 |
| 셰이더/머티리얼 | 계산 방법 / 입력값 |
| **마스터 스택** | Vertex / Fragment 출력 |
| **Property Reference** | 코드에서 쓰는 내부 이름 (`_Name`) |
| **Lerp** | Day 68의 알파 블렌딩 공식 |
| **Fresnel** | `pow(1 - dot(N, V), power)` |
| UV / Tiling And Offset | 텍스처 좌표 조작 |
| Time + Fraction | 애니메이션. 정밀도 주의 |
| **Blending Mode** | Alpha / Additive (Day 68·88) |
| Alpha Clipping | Transparent보다 빠르다 |
| `Shader.PropertyToID` | 문자열 해싱 회피 |
| MaterialPropertyBlock | 배칭 유지 (Day 85) |
| Sub Graph | 재사용 (Day 40의 함수화) |
| Custom Function | HLSL 직접 작성 |
| 분기보다 lerp | GPU는 둘 다 실행한다 |

### Part 2와의 대응

| Part 2 Day 68 | Unity |
|---|---|
| `BlendPixel` 공식 | Lerp 노드 / Blending Mode |
| DIB 직접 접근 (CPU) | 프래그먼트 셰이더 (GPU) |
| `AlphaBlend` API | Surface Type: Transparent |
| Additive 개념 | Blending Mode: Additive |
| 픽셀 루프 | GPU 병렬 실행 |
| 160배 최적화 | 다시 100배 이상 |

```
   ★ Day 68에서 왜 픽셀을 직접 만졌나

   "픽셀의 최종 색을 결정하는 계산"이 무엇인지
   손으로 겪어야 셰이더를 이해할 수 있다

   → 오늘 그 계산을 GPU로 옮겼다
```

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 95** | 포스트 프로세싱 (화면 전체 셰이더) |
| Day 101+ | 파이널 프로젝트 비주얼 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 차체 색을 3종 만들어 AI에 적용 | 머티리얼만 복제 |
| ★★ | 피격 시 흰색 플래시 셰이더 | Lerp + Property |
| ★★ | 디졸브 (노이즈로 사라지는 효과) | Simple Noise + Alpha Clip |
| ★★★ | 홀로그램 (스캔라인 + 글리치) | Sine + UV + Step |
| ★★★ | 물 셰이더 (파도 + 반사) | Vertex Position + Normal |
| ★★★★ | 아웃라인 셰이더 (외곽선) | Render Face Back + 정점 확장 |

### 다음 시간

> 셰이더로 오브젝트를 꾸몄다. 그런데 **화면 전체는?**
>
> ```
>   속도감이 부족하다

>   × 고속인데 느리게 느껴진다
>   × 화면이 밋밋하다
>   × 부스터를 써도 티가 안 난다
> ```
>
> **포스트 프로세싱**은 완성된 화면 전체에 셰이더를 한 번 더 적용한다.
>
> Bloom, Motion Blur, Vignette, FOV 변화로 속도감을 만들고
> Week 19를 마무리한다. **Part 3의 마지막 게임이다.**
>
> → **Day 95, 포스트 프로세싱·연출 · 문서 17 완성**
