# Day 076 · Canvas와 RectTransform

> **Week 16** · 연결 문서 `14 보드게임` — Step 0~1
> 선수: Day 075 (UI 기초)

---

## 1. 오늘 만드는 것

**창 크기를 자유롭게 바꿔도 UI가 제자리를 지킨다.**

```
   1920 × 1080                          1280 × 720
   ┌────────────────────────────┐       ┌──────────────────┐
   │▓▓▓▓▓▓▓▓▓ HEADER ▓▓▓▓▓▓▓▓▓▓│       │▓▓▓▓ HEADER ▓▓▓▓▓│  ← 폭에 맞춰 늘어남
   │ HP ████████░░  62          │       │ HP ██████░  62   │  ← 좌상단 고정
   │                            │       │                  │
   │      ┌──── 상대 ────┐       │       │  ┌── 상대 ──┐    │
   │      │ ▢ ▢ ▢ ▢ ▢  │       │       │  │ ▢ ▢ ▢ ▢ │    │
   │      └──────────────┘       │       │  └──────────┘    │
   │      ┌──── 필드 ────┐       │       │  ┌── 필드 ──┐    │
   │      │              │       │       │  │          │    │
   │      └──────────────┘       │       │  └──────────┘    │
   │      ┌── 내 손패 ───┐       │       │  ┌─ 손패 ──┐    │
   │      │ ▣ ▣ ▣ ▣ ▣  │       │       │  │ ▣ ▣ ▣ ▣ │    │
   │      └──────────────┘       │       │  └──────────┘    │
   │                    [ 턴종료 ]│       │         [턴종료] │  ← 우하단 고정
   └────────────────────────────┘       └──────────────────┘
```

<!-- SHOT: Day 76 두 해상도 비교 -->

---

## 2. 막히는 상황

어제 만든 러너 게임의 UI를 다시 본다.

```
   Game 뷰 해상도를 1920×1080 → 1280×720 으로 바꾼다
```

```
   ★ 결과

   × 우하단 버튼이 화면 밖으로 나갔다
   × 좌상단 텍스트만 겨우 남았다
   × 중앙 정렬한 패널이 왼쪽으로 치우쳤다
```

```
   왜 이런가

   UI 요소가 "화면 좌표 (100, 50)" 같은 절대 위치를 쓰면
   → 화면이 커지면 상대적으로 왼쪽 위로 몰린다
   → 화면이 작아지면 밖으로 나간다
```

```
   Part 2에서는 어떻게 했나

   Day 33~34:  r.DrawText(20, 60, ...)   절대 좌표
               창 크기 고정이라 문제없었다

   Day 60:     r.GetWidth() - 226        오른쪽 정렬을 직접 계산
```

```
   ★ 요소가 100개면?

   전부 직접 계산할 수는 없다
```

> **앵커(Anchor)와 피벗(Pivot)이 필요하다.**

---

## 3. 개념

### 3-1. RectTransform — UI 전용 Transform

**왜 필요한가** — 일반 Transform으로는 "화면에 붙이기"를 표현할 수 없다.

```
   Transform (3D)            RectTransform (UI)

   Position                  Anchors (Min / Max)
   Rotation                  Anchored Position
   Scale                     Size Delta (Width / Height)
                             Pivot
                             Rotation
                             Scale
```

```
   ★ RectTransform은 Transform을 상속한다

   → 3D 좌표도 여전히 있다
   → 하지만 위치는 앵커 기준으로 계산된다
```

| 필드 | 의미 |
|---|---|
| **Anchor Min / Max** | 부모의 어느 지점에 붙을지 (0~1 비율) |
| **Pivot** | 자기 자신의 어느 점이 기준인지 (0~1 비율) |
| **Anchored Position** | 앵커로부터의 오프셋 (픽셀) |
| Size Delta | 앵커 사각형 대비 크기 차이 |
| Left/Right/Top/Bottom | 늘어난 앵커일 때 여백 |

### 3-2. 앵커 — 부모의 어디에 붙을 것인가

**왜 필요한가** — 오늘의 핵심 절반.

```
   앵커는 부모 사각형 위의 "점" 또는 "사각형"이다
   비율(0~1)로 표현한다

   (0,1) ┌───────────────┐ (1,1)
         │               │
         │  (0.5, 0.5)   │      ← 중앙
         │       ●       │
         │               │
   (0,0) └───────────────┘ (1,0)

   ⚠️ Unity UI는 y가 위로 + 다 (좌하단이 0,0)
```

**앵커가 한 점일 때 (Min == Max)**

```
   앵커 = 좌상단 (0, 1)

   ┌─────────────────────────┐    창을 넓히면    ┌───────────────────────────────┐
   │ ▣                       │    ────────▶     │ ▣                             │
   │                         │                  │                               │
   │                         │                  │                               │
   └─────────────────────────┘                  └───────────────────────────────┘

   ★ 좌상단에서의 거리가 유지된다
```

```
   앵커 = 우하단 (1, 0)

   ┌─────────────────────────┐                  ┌───────────────────────────────┐
   │                         │    ────────▶     │                               │
   │                         │                  │                               │
   │                    ▣    │                  │                            ▣  │
   └─────────────────────────┘                  └───────────────────────────────┘

   ★ 우하단을 따라간다
```

**앵커가 사각형일 때 (Min != Max) — 늘어남(stretch)**

```
   앵커 Min (0, 1), Max (1, 1)   →  가로로 늘어남

   ┌─────────────────────────┐                  ┌───────────────────────────────┐
   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    ────────▶     │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
   │                         │                  │                               │
   └─────────────────────────┘                  └───────────────────────────────┘

   ★ 부모 폭에 맞춰 늘어난다
     이때 Width 대신 Left / Right (여백)를 지정한다
```

```
   앵커 Min (0, 0), Max (1, 1)   →  전체 늘어남

   → 배경 패널, 반투명 오버레이에 사용
```

### 3-3. 피벗 — 자기 자신의 기준점

**왜 필요한가** — 오늘의 핵심 나머지 절반.

```
   피벗은 "이 오브젝트의 어느 점이 위치 기준인가"

   Pivot (0, 0)          Pivot (0.5, 0.5)       Pivot (1, 1)

   ●───────┐              ┌───────┐              ┌───────●
   │       │              │   ●   │              │       │
   └───────┘              └───────┘              └───────┘
   좌하단 기준            중앙 기준               우상단 기준
```

```
   ★ 피벗은 회전·크기의 중심이기도 하다

   Pivot (0.5, 0.5) 에서 회전  →  제자리에서 돈다
   Pivot (0, 0.5)   에서 회전  →  왼쪽 끝을 축으로 돈다

              중앙 피벗                 좌측 피벗
              ┌─────┐                  ┌─────┐
              │  ●  │                  ●     │
              └─────┘                  └─────┘
                 ↓ 30도 회전              ↓ 30도 회전
               ╱─────╲                  ╱─────╲
              │   ●   │                ●       ╲
               ╲─────╱                  ╲───────╲
```

```
   ★ 실전 사용 예

   체력바:      Pivot (0, 0.5) + Scale X 조절
                → 왼쪽에서 오른쪽으로 줄어든다

   카드 확대:   Pivot (0.5, 0) 
                → 아래를 고정하고 위로 커진다

   툴팁:        Pivot (0, 1)
                → 마우스 우하단에 나타난다
```

### 3-4. ⚠️ 앵커와 피벗을 혼동하면

**왜 필요한가** — 가장 흔한 좌절.

```
   ★ 한 문장으로

   앵커 = "부모의 어디에"
   피벗 = "나의 어디를"
```

```
   예)  버튼을 화면 오른쪽 아래에 붙이고 싶다

   앵커 (1, 0)  →  부모의 우하단에 붙는다
   피벗 (1, 0)  →  버튼의 우하단이 기준

   Anchored Position (-20, 20)
   →  우하단에서 왼쪽 20, 위로 20

   ┌─────────────────────────┐
   │                         │
   │                         │
   │                  ┌────┐ │
   │                  │버튼│ │ ↑ 20
   │                  └────┘ │
   └─────────────────────────┘
                        ← 20
```

```
   ⚠️ 피벗만 (0.5, 0.5)로 두면

   버튼 중앙이 우하단 모서리에 온다
   → 절반이 화면 밖으로 나간다

   ┌─────────────────────────┐
   │                         │
   │                    ┌────┼──┐
   │                    │ 버튼│  │  ← 절반이 밖
   └────────────────────┴────┼──┘
```

**앵커 프리셋과 단축키**

```
   Inspector 좌상단의 사각형 아이콘 클릭
   → 프리셋 격자
```

| 조합 | 효과 |
|---|---|
| 클릭 | 앵커만 설정 |
| **Alt + 클릭** | 앵커 설정 + **위치도 맞춤** |
| **Shift + 클릭** | 앵커 설정 + **피벗도 함께** |
| **Alt + Shift + 클릭** | 앵커 + 피벗 + 위치 전부 |

```
   ★ Alt+Shift+클릭 을 익힌다

   대부분의 경우 이게 원하는 동작이다
```

### 3-5. Canvas Render Mode 3종

**왜 필요한가** — 용도에 따라 고른다.

```
   ① Screen Space - Overlay

   ┌──────────────────────┐
   │  [UI]                │  ← 항상 3D 위에
   │       🎮 3D 씬        │
   │              [UI]    │
   └──────────────────────┘

   카메라와 무관. 가장 단순. HUD·메뉴 ★
```

```
   ② Screen Space - Camera

   Canvas가 카메라 앞 일정 거리에 놓인다
   → 3D 오브젝트가 UI 앞에 올 수 있다
   → 원근·회전 효과 가능
   → 파티클을 UI 위에 얹을 수 있다
```

```
   ③ World Space

   Canvas가 씬 안의 물체가 된다
   → 캐릭터 머리 위 이름표
   → 3D 공간의 조작 패널
   → VR
```

| 모드 | 카메라 필요 | 3D와 섞임 | 용도 |
|---|:--:|:--:|---|
| **Overlay** | ✗ | ✗ | HUD, 메뉴 ★ |
| Camera | ✔ | ✔ | 연출 있는 UI |
| World Space | ✔ | ✔ | 씬 안의 UI |

```
   ⚠️ World Space Canvas 주의

   Scale을 1로 두면 매우 크다
   → 보통 0.01 정도로 줄인다
   → 또는 Canvas의 Width/Height를 작게
```

### 3-6. Canvas Scaler 심화

**왜 필요한가** — 해상도 대응의 핵심.

```
   UI Scale Mode: Scale With Screen Size
   Reference Resolution: 1920 × 1080
   Screen Match Mode: Match Width Or Height
   Match: 0 ←────●────→ 1
```

```
   ★ Match 값이 하는 일

   Match = 0  (Width 기준)
   → 화면 폭 / 1920 배율로 전체 확대
   → 세로가 길어지면 위아래 여백이 생긴다

   Match = 1  (Height 기준)
   → 화면 높이 / 1080 배율
   → 가로가 길어지면 좌우 여백

   Match = 0.5
   → 절충 (로그 평균)
```

**실제 배율 계산**

```
   기준 1920×1080, 실제 1280×720

   Width 배율  = 1280/1920 = 0.667
   Height 배율 = 720/1080  = 0.667
   → 비율이 같으면 Match 값과 무관하게 동일
```

```
   기준 1920×1080, 실제 1920×1200  (더 세로로 김)

   Width 배율  = 1.0
   Height 배율 = 1.111

   Match=0   →  배율 1.0     (UI가 상대적으로 작아 보임)
   Match=1   →  배율 1.111   (UI가 커짐)
   Match=0.5 →  배율 1.054
```

```
   ★ 실무 선택

   가로 고정 게임 (모바일 가로)  →  Match 0 또는 0.5
   세로 고정 게임 (모바일 세로)  →  Match 0
   PC (다양한 비율)              →  Match 0.5
```

```
   ⚠️ Reference Pixels Per Unit

   Image의 스프라이트가 어떤 크기로 보일지 결정
   기본 100.  스프라이트 임포트 설정의 PPU와 맞춘다
```

### 3-7. Safe Area (모바일)

**왜 필요한가** — 노치·둥근 모서리를 피한다.

```
   ┌─────────────────┐
   │  ╭───╮          │  ← 노치
   │  ╰───╯          │
   │ ┌─────────────┐ │
   │ │  Safe Area  │ │
   │ │             │ │
   │ └─────────────┘ │
   │      ▁▁▁▁       │  ← 홈 인디케이터
   └─────────────────┘
```

```csharp
public class SafeAreaFitter : MonoBehaviour
{
    private RectTransform rt;
    private Rect lastSafeArea;

    void Awake()
    {
        rt = GetComponent<RectTransform>();
        Apply();
    }

    void Update()
    {
        if (Screen.safeArea != lastSafeArea) Apply();
    }

    private void Apply()
    {
        Rect safe = Screen.safeArea;
        lastSafeArea = safe;

        // ★ 화면 픽셀 → 앵커 비율(0~1)
        Vector2 min = safe.position;
        Vector2 max = safe.position + safe.size;

        min.x /= Screen.width;  min.y /= Screen.height;
        max.x /= Screen.width;  max.y /= Screen.height;

        rt.anchorMin = min;
        rt.anchorMax = max;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
    }
}
```

```
   ★ 구조

   Canvas
   └─ SafeAreaRoot   (SafeAreaFitter, 전체 stretch)
       ├─ HUD
       └─ Panels

   → 모든 UI를 SafeAreaRoot 안에 둔다
```

### 3-8. UI 컴포넌트

**왜 필요한가** — 오늘 쓸 도구들.

| 컴포넌트 | 역할 |
|---|---|
| **Image** | 그림·색 사각형. UI의 기본 |
| **TextMeshProUGUI** | 텍스트 |
| **Button** | 클릭 |
| Slider | 값 조절·진행 표시 |
| Toggle | 체크박스 |
| Dropdown | 목록 선택 |
| Input Field | 텍스트 입력 |
| **Raw Image** | Texture 직접 표시 (Sprite 아님) |

**Image의 Type**

| Type | 동작 | 용도 |
|---|---|---|
| Simple | 그대로 늘림 | 아이콘 |
| **Sliced** | 9분할. 모서리 유지 | **패널, 버튼 배경** ★ |
| Tiled | 반복 | 패턴 배경 |
| **Filled** | 비율만큼 채움 | **체력바, 쿨다운** |

```
   ★ Sliced (9-slice)

   ┌─┬─────┬─┐        ┌─┬───────────┬─┐
   │╱│─────│╲│        │╱│───────────│╲│
   ├─┼─────┼─┤   →    ├─┼───────────┼─┤
   │││     │││        │││           │││
   ├─┼─────┼─┤        ├─┼───────────┼─┤
   │╲│─────│╱│        │╲│───────────│╱│
   └─┴─────┴─┘        └─┴───────────┴─┘

   모서리는 그대로, 가운데만 늘어난다
   → 크기가 달라도 테두리가 안 뭉개진다
```

```
   스프라이트 임포트 설정에서
   Sprite Editor → Border 를 설정해야 Sliced가 동작한다
```

```
   ★ Filled 로 체력바 만들기

   Image Type: Filled
   Fill Method: Horizontal
   Fill Origin: Left
   Fill Amount: 0 ~ 1

   hpImage.fillAmount = (float)hp / maxHp;
```

### 3-9. Raycast Target과 성능

**왜 필요한가** — UI가 많아지면 느려진다.

```
   ★ 모든 Graphic(Image, Text)은 기본으로 Raycast Target이 켜져 있다

   → 마우스가 움직일 때마다 전부 검사한다
   → 클릭할 필요 없는 요소는 꺼야 한다
```

```
   끄면 좋은 것

   × 장식용 이미지
   × 대부분의 텍스트
   × 배경 패널 (클릭 막을 목적이 아니라면)
```

```
   ⚠️ 반대로 켜야 하는 것

   ○ 버튼
   ○ 드래그 대상
   ○ "뒤를 클릭 못 하게 막는" 오버레이
```

```csharp
    // 코드로
    image.raycastTarget = false;
```

**드로우 콜과 배칭**

```
   ★ Canvas는 하나의 메시로 합쳐진다 (배칭)

   → 요소 하나가 바뀌면 Canvas 전체가 다시 만들어진다

   ⚠️ 자주 바뀌는 UI와 안 바뀌는 UI를
     별도 Canvas로 분리한다

   Canvas (정적: 배경, 프레임)
   Canvas (동적: 점수, 체력바)
```

### 3-10. 좌표 변환

**왜 필요한가** — Day 56의 좌표계 변환이 UI에도 있다.

```
   ★ UI에서의 3개 좌표계

   ① 스크린 좌표    Input.mousePosition   (픽셀, 좌하단 0,0)
   ② 캔버스 로컬    RectTransform 기준
   ③ 월드 좌표      3D 공간
```

```csharp
    // 스크린 → 캔버스 로컬
    RectTransformUtility.ScreenPointToLocalPointInRectangle(
        canvasRect,                    // 기준 RectTransform
        Input.mousePosition,           // 스크린 좌표
        canvas.worldCamera,            // Overlay면 null
        out Vector2 localPoint);

    draggedCard.anchoredPosition = localPoint;
```

```csharp
    // 월드 → 스크린 (3D 오브젝트 위에 UI 띄우기)
    Vector3 screenPos = Camera.main.WorldToScreenPoint(target.position);

    RectTransformUtility.ScreenPointToLocalPointInRectangle(
        canvasRect, screenPos, null, out Vector2 local);

    nameplate.anchoredPosition = local;
```

```
   ⚠️ 카메라 뒤에 있으면 z < 0

   화면 반대편에 UI가 나타난다

   if (screenPos.z < 0) { 숨긴다 }
```

```
   ⚠️ Render Mode에 따라 camera 인자가 다르다

   Overlay          →  null
   Screen Space-Cam →  canvas.worldCamera
   World Space      →  해당 카메라
```

### 3-11. 레이아웃 계층 설계

**왜 필요한가** — 처음부터 잘 짜면 나중이 편하다.

```
   Canvas (Scale With Screen Size, 1920×1080)
   └─ SafeAreaRoot           (전체 stretch, SafeAreaFitter)
       ├─ Background         (전체 stretch, Image)
       ├─ Header             (상단 stretch, 높이 80)
       │   ├─ HpBar          (좌측 앵커)
       │   └─ TurnText       (중앙 앵커)
       ├─ Content            (중앙 stretch, 상하 여백)
       │   ├─ OpponentArea   (상단)
       │   ├─ FieldArea      (중앙)
       │   └─ HandArea       (하단)
       ├─ Footer             (하단 stretch, 높이 100)
       │   └─ EndTurnButton  (우측 앵커)
       └─ Popups             (전체 stretch, 최상위)
           ├─ PausePanel
           └─ ResultPanel
```

```
   ★ 원칙

   ① 영역(Area)을 먼저 나눈다 — 빈 오브젝트 + RectTransform
   ② 각 영역 안에서 다시 배치한다
   ③ 팝업은 항상 마지막 자식 (= 맨 위에 그려짐)
```

```
   ★ UI의 그리기 순서 = Hierarchy 순서

   위에 있는 것이 먼저 그려진다 (= 아래에 깔린다)
   아래에 있는 것이 나중에 그려진다 (= 위에 보인다)

   → 팝업을 맨 위로 올리려면 SetAsLastSibling()
```

---

## 4. 따라 만들기

### Step 1 — 새 씬과 Canvas

```
   File → New Scene → Basic (URP)
   Scenes/CardGame.unity 로 저장
   Build Settings에 추가
```

```
   UI → Canvas
   Canvas Scaler:
     UI Scale Mode: Scale With Screen Size
     Reference Resolution: 1920 × 1080
     Screen Match Mode: Match Width Or Height
     Match: 0.5
```

**✅ 여기까지 하면** — Canvas와 EventSystem이 생긴다.

### Step 2 — Constant Pixel Size 문제 재현

**Canvas Scaler를 `Constant Pixel Size`로 되돌린다.**

```
   UI → Image 를 만들고 크기 300×100
   Game 뷰 해상도를 1920×1080 → 640×360 으로 바꾼다
```

**✅ 이렇게 하면**

```
   1920×1080:  이미지가 화면의 약 1/6

   640×360:    이미지가 화면의 절반
   → 상대적으로 훨씬 커 보인다
```

> **Scale With Screen Size로 되돌린다.**

```
   ✅ 이제 어떤 해상도에서도 비율이 유지된다
```

<!-- SHOT: Step 2 스케일 모드 비교 -->

### Step 3 — 앵커 실험

```
   Image 3개를 만든다:  A, B, C
```

```
   A:  앵커 좌상단 (0, 1),  피벗 (0, 1),  Pos (20, -20)
   B:  앵커 중앙   (0.5, 0.5), 피벗 (0.5, 0.5), Pos (0, 0)
   C:  앵커 우하단 (1, 0),  피벗 (1, 0),  Pos (-20, 20)
```

```
   ★ Alt + Shift + 클릭 으로 프리셋을 적용하면
     앵커·피벗·위치가 한 번에 맞춰진다
```

**Game 뷰 해상도를 여러 번 바꿔 본다.**

**✅ 여기까지 하면**

```
   1920×1080                    1280×720

   ┌──────────────────────┐     ┌──────────────┐
   │ A                    │     │ A            │
   │                      │     │              │
   │          B           │     │      B       │
   │                      │     │              │
   │                    C │     │            C │
   └──────────────────────┘     └──────────────┘

   ★ 셋 다 제자리를 지킨다
```

<!-- SHOT: Step 3 앵커 동작 -->

### Step 4 — 늘어나는 앵커

```
   Image D 를 만든다

   앵커 프리셋에서 "stretch horizontal + top" 선택
   (Alt+Shift 클릭)

   Left 0, Right 0, Height 80, Top 0
```

**✅ 여기까지 하면**

```
   ┌──────────────────────┐     ┌──────────────┐
   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│     │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
   │                      │     │              │
   └──────────────────────┘     └──────────────┘

   ★ 폭에 맞춰 늘어난다
   ★ Inspector에서 Width가 아니라 Left/Right가 보인다
```

```
   ⚠️ 늘어난 앵커에서는

   Width/Height 대신 Left/Right/Top/Bottom (여백)을 지정한다
```

### Step 5 — 피벗 실험

```
   Image E 를 만든다.  크기 200×200, 중앙 배치
   Rotation Z 를 45도로
```

**피벗을 (0.5, 0.5) → (0, 0) 으로 바꾼다.**

**✅ 여기까지 하면**

```
   피벗 (0.5, 0.5)          피벗 (0, 0)

      ╱─────╲                    ╱───╲
     │   ●   │                  ╱     ╲
      ╲─────╱                  ●───────╲
   제자리에서 회전            좌하단을 축으로 회전
```

```
   ★ 위치도 함께 튄다

   피벗이 바뀌면 "기준점"이 바뀌므로
   같은 anchoredPosition이라도 다른 위치가 된다
```

### Step 6 — 체력바 (Filled)

```
   Image 를 만든다.  이름 HpFill
   Image Type: Filled
   Fill Method: Horizontal
   Fill Origin: Left
   색: 초록
```

```
   구조

   HpBar (Image, 배경 회색, 앵커 좌상단)
   ├─ HpDelayed (Image, 빨강, Filled)      ← 지연 게이지 (Day 48!)
   ├─ HpFill    (Image, 초록, Filled)
   └─ HpText    (TMP, "62 / 100")
```

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class HpBar : MonoBehaviour
{
    [SerializeField] private Image fill;
    [SerializeField] private Image delayed;
    [SerializeField] private TextMeshProUGUI label;
    [SerializeField] private float delaySpeed = 0.5f;
    [SerializeField] private float delayWait = 0.4f;

    private int hp, maxHp;
    private float waitTimer;

    public void Set(int current, int max)
    {
        hp = current; maxHp = max;

        float ratio = max > 0 ? (float)current / max : 0f;

        fill.fillAmount = ratio;

        if (delayed.fillAmount < ratio) delayed.fillAmount = ratio;  // 회복은 즉시
        else                            waitTimer = delayWait;

        label.text = $"{current} / {max}";
    }

    void Update()
    {
        if (waitTimer > 0) { waitTimer -= Time.deltaTime; return; }

        if (delayed.fillAmount > fill.fillAmount)
        {
            delayed.fillAmount = Mathf.MoveTowards(
                delayed.fillAmount, fill.fillAmount, delaySpeed * Time.deltaTime);
        }
    }
}
```

```
   ★ Day 48에서 만든 지연 게이지

   Part 2:  DrawRect 두 번
   Unity:   Image 두 개 + fillAmount
```

**✅ 여기까지 실행하면** — 체력을 깎으면 빨간 잔상이 남았다가 줄어든다.

<!-- SHOT: Step 6 체력바 -->

### Step 7 — Sliced 패널

```
   9-slice 스프라이트 준비 (없으면 Unity 기본 UISprite 사용)

   Image 생성
   Source Image: UISprite (또는 준비한 것)
   Image Type: Sliced
```

**크기를 크게/작게 바꿔 본다.**

**✅ 여기까지 하면** — 모서리가 늘어나지 않고 유지된다.

**Image Type을 Simple로 바꿔 본다.**

```
   → 모서리가 늘어나 뭉개진다
```

> **Sliced로 되돌린다.**

### Step 8 — SafeAreaRoot

3-7절의 `SafeAreaFitter`를 만든다.

```
   Canvas 아래에 빈 오브젝트 SafeAreaRoot
   RectTransform: 전체 stretch (Alt+Shift+우하단 프리셋)
   SafeAreaFitter 붙이기
```

**✅ 여기까지 하면** — PC에서는 변화가 없다 (safeArea = 전체 화면). 모바일 빌드에서 효과가 있다.

### Step 9 — 카드 게임 레이아웃 뼈대

```
   SafeAreaRoot
   ├─ Background          전체 stretch, Image (어두운 초록)
   │
   ├─ Header              상단 stretch, Height 80
   │   ├─ HpBar           좌측 앵커 (0,0.5), Pos (24, 0)
   │   ├─ TurnText        중앙 앵커, "TURN 1"
   │   └─ ManaText        우측 앵커 (1,0.5), Pos (-24, 0)
   │
   ├─ Content             전체 stretch, Top 90, Bottom 110
   │   ├─ OpponentArea    상단 stretch, Height 200
   │   ├─ FieldArea       중앙 stretch, Top 210, Bottom 260
   │   └─ HandArea        하단 stretch, Height 250
   │
   ├─ Footer              하단 stretch, Height 100
   │   ├─ DeckCountText   좌측 앵커
   │   └─ EndTurnButton   우측 앵커 (1, 0.5), Pos (-30, 0)
   │
   └─ Popups              전체 stretch
       ├─ PausePanel      (비활성)
       └─ ResultPanel     (비활성)
```

```
   ★ 각 영역에 임시로 반투명 Image를 넣어 경계를 확인한다
     나중에 지우거나 alpha를 0으로
```

**✅ 여기까지 하면** — 1절의 레이아웃이 나온다.

<!-- SHOT: Step 9 레이아웃 뼈대 -->

### Step 10 — 해상도 테스트

```
   Game 뷰 해상도 드롭다운 → +

   추가할 해상도
   1920 × 1080   (기준)
   1280 × 720    (작은 16:9)
   2560 × 1080   (울트라와이드 21:9)
   1080 × 1920   (세로)
   1366 × 768    (노트북)
```

**각각 확인한다.**

**✅ 여기까지 하면**

| 해상도 | 확인 |
|---|---|
| 1920×1080 | 기준. 정상 |
| 1280×720 | 전체가 균등 축소 |
| 2560×1080 | 좌우가 넓어짐. 헤더가 늘어남 |
| 1080×1920 | 세로. Match 0.5 효과 확인 |
| 1366×768 | 정상 |

```
   ⚠️ 울트라와이드에서 확인할 것

   중앙 앵커 요소들이 너무 멀어지지 않는지
   → 필요하면 Content의 최대 폭을 제한한다
```

### Step 11 — Match 값 비교

**Match를 0, 0.5, 1로 바꾸며 1080×1920(세로)를 본다.**

```
   Match = 0  (Width 기준)
   ┌──────────┐
   │  작은 UI │      가로 폭에 맞춰 축소
   │          │      → 세로 여백이 많다
   │          │
   └──────────┘

   Match = 1  (Height 기준)
   ┌──────────┐
   │ 큰 UI ▓▓▓│      세로에 맞춰 확대
   │▓▓▓▓▓▓▓▓▓▓│      → 좌우가 잘린다
   └──────────┘
```

```
   ★ 대부분 0.5가 무난하다
```

### Step 12 — Raycast Target 정리

```
   모든 텍스트와 장식 Image를 선택
   → Raycast Target 체크 해제
```

```
   Window → Analysis → Frame Debugger 로
   드로우 콜을 확인할 수도 있다
```

```csharp
    // 일괄 처리 에디터 스크립트 (선택)
#if UNITY_EDITOR
    [UnityEditor.MenuItem("Tools/UI/Disable Raycast on Texts")]
    static void DisableRaycastOnTexts()
    {
        var texts = Object.FindObjectsByType<TMPro.TextMeshProUGUI>(
            FindObjectsSortMode.None);

        foreach (var t in texts)
        {
            UnityEditor.Undo.RecordObject(t, "Disable Raycast");
            t.raycastTarget = false;
        }

        Debug.Log($"{texts.Length}개 처리");
    }
#endif
```

**✅ 여기까지 하면** — 불필요한 레이캐스트가 사라진다.

### Step 13 — 좌표 변환 실습

```csharp
using UnityEngine;

public class MouseFollower : MonoBehaviour
{
    [SerializeField] private RectTransform canvasRect;
    [SerializeField] private Canvas canvas;

    private RectTransform rt;

    void Awake() { rt = GetComponent<RectTransform>(); }

    void Update()
    {
        Camera cam = canvas.renderMode == RenderMode.ScreenSpaceOverlay
                     ? null : canvas.worldCamera;

        if (RectTransformUtility.ScreenPointToLocalPointInRectangle(
                canvasRect, Input.mousePosition, cam, out Vector2 local))
        {
            rt.anchoredPosition = local;
        }
    }
}
```

**작은 Image를 만들어 붙인다.**

**✅ 여기까지 실행하면** — 이미지가 마우스를 정확히 따라온다.

```
   ⚠️ 부모의 앵커/피벗에 따라 local 값의 의미가 다르다

   부모가 중앙 앵커(0.5,0.5) + 중앙 피벗이면
   → local이 그대로 anchoredPosition
```

**canvasRect를 다른 영역(예: HandArea)으로 바꿔 본다.**

```
   → 그 영역 기준 좌표가 나온다
```

### Step 14 — 월드 → 스크린 (이름표)

```csharp
using TMPro;
using UnityEngine;

public class WorldNameplate : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private RectTransform canvasRect;
    [SerializeField] private Vector3 worldOffset = new Vector3(0, 2.2f, 0);
    [SerializeField] private TextMeshProUGUI label;
    [SerializeField] private CanvasGroup group;

    private RectTransform rt;

    void Awake() { rt = GetComponent<RectTransform>(); }

    void LateUpdate()                          // ★ 대상 이동 후 (Day 72)
    {
        if (target == null) { group.alpha = 0; return; }

        Vector3 sp = Camera.main.WorldToScreenPoint(target.position + worldOffset);

        // ★ 카메라 뒤면 숨긴다
        if (sp.z < 0) { group.alpha = 0; return; }

        group.alpha = 1;

        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            canvasRect, sp, null, out Vector2 local);

        rt.anchoredPosition = local;
    }
}
```

**3D 큐브를 하나 놓고 그 위에 이름표를 띄운다.**

**✅ 여기까지 실행하면** — 큐브를 움직이면 이름표가 따라온다. 카메라 뒤로 가면 사라진다.

<!-- SHOT: Step 14 이름표 -->

### Step 15 — Canvas 분리

```
   Canvas_Static     (배경, 프레임 — 거의 안 바뀜)
   Canvas_Dynamic    (체력바, 점수, 손패 — 자주 바뀜)
   Canvas_Popup      (팝업 — Sort Order 높게)
```

```
   각 Canvas의 Sort Order
   Static  = 0
   Dynamic = 1
   Popup   = 10
```

```
   ★ 왜 분리하나

   Canvas는 요소 하나만 바뀌어도 전체를 다시 만든다(rebuild)
   → 정적/동적을 나누면 rebuild 범위가 줄어든다
```

```
   ⚠️ 너무 잘게 나누면 오히려 손해

   Canvas마다 드로우 콜이 생긴다
   → 3~5개 정도가 적당
```

**✅ 여기까지 하면** — 구조가 정리된다.

### Step 16 — 팝업 순서

```csharp
public class PopupBase : MonoBehaviour
{
    public void Show()
    {
        gameObject.SetActive(true);
        transform.SetAsLastSibling();          // ★ 맨 위로
    }

    public void Hide() => gameObject.SetActive(false);
}
```

**팝업 2개를 만들어 번갈아 열어 본다.**

**✅ 여기까지 하면** — 나중에 연 것이 위에 온다.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   1920 × 1080                          2560 × 1080 (울트라와이드)
   ┌────────────────────────────┐       ┌──────────────────────────────────┐
   │▓▓▓▓▓▓▓▓▓ HEADER ▓▓▓▓▓▓▓▓▓▓│       │▓▓▓▓▓▓▓▓▓▓▓ HEADER ▓▓▓▓▓▓▓▓▓▓▓▓▓│
   │ HP ████████░░ 62    ◆ 3/10 │       │ HP ████████░░ 62        ◆ 3/10  │
   │      ┌──── 상대 ────┐       │       │        ┌──── 상대 ────┐         │
   │      │ ▢ ▢ ▢ ▢ ▢  │       │       │        │ ▢ ▢ ▢ ▢ ▢  │         │
   │      └──────────────┘       │       │        └──────────────┘         │
   │      ┌──── 필드 ────┐       │       │        ┌──── 필드 ────┐         │
   │      └──────────────┘       │       │        └──────────────┘         │
   │      ┌── 내 손패 ───┐       │       │        ┌── 내 손패 ───┐         │
   │      │ ▣ ▣ ▣ ▣ ▣  │       │       │        │ ▣ ▣ ▣ ▣ ▣  │         │
   │      └──────────────┘       │       │        └──────────────┘         │
   │ 덱 24              [턴종료] │       │ 덱 24                  [턴종료] │
   └────────────────────────────┘       └──────────────────────────────────┘
```

- [ ] Canvas Scaler가 Scale With Screen Size다
- [ ] Constant Pixel Size의 문제를 확인했다
- [ ] 좌상단/중앙/우하단 앵커가 각각 제자리를 지킨다
- [ ] 늘어나는 앵커(stretch)로 헤더가 폭에 맞춰진다
- [ ] 늘어난 앵커에서 Left/Right가 표시된다
- [ ] 피벗을 바꾸면 회전 축이 바뀐다
- [ ] Filled Image로 체력바를 만들었다
- [ ] 지연 게이지(빨간 잔상)가 동작한다
- [ ] Sliced Image의 모서리가 유지된다
- [ ] Simple로 바꾸면 뭉개지는 것을 확인했다
- [ ] 5가지 해상도에서 레이아웃이 유지된다
- [ ] Match 값의 차이를 확인했다
- [ ] 불필요한 Raycast Target을 껐다
- [ ] 마우스를 정확히 따라오는 UI를 만들었다
- [ ] 3D 오브젝트 위 이름표가 동작한다
- [ ] 카메라 뒤에서 이름표가 사라진다
- [ ] Canvas를 정적/동적/팝업으로 분리했다
- [ ] 팝업이 `SetAsLastSibling`으로 맨 위에 온다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 해상도 바꾸면 다 어긋남 | Constant Pixel Size | Scale With Screen Size |
| **앵커 옮겼는데 위치가 튐** | 피벗과 혼동 | 앵커=부모의 어디, 피벗=나의 어디 |
| 프리셋 눌러도 위치 그대로 | 앵커만 바뀜 | **Alt+Shift+클릭** |
| Width를 못 바꿈 | 늘어난 앵커 | Left/Right로 조절 |
| 한글이 □□□ | TMP 폰트 애셋 | Font Asset Creator |
| 버튼이 안 눌림 | EventSystem 없음 | UI → EventSystem |
| 버튼이 안 눌림 | 위에 투명 Image | Raycast Target 해제 |
| 팝업이 뒤에 가림 | Hierarchy 순서 | `SetAsLastSibling` |
| 마우스 따라가기 어긋남 | 좌표 변환 누락 | `ScreenPointToLocalPointInRectangle` |
| 좌표 변환이 이상함 | camera 인자 | Overlay면 null |
| 이름표가 반대편에 | 카메라 뒤 | `sp.z < 0` 검사 |
| World Space Canvas가 거대 | Scale 1 | 0.01 정도로 |
| UI가 느림 | Raycast Target 과다 | 불필요한 것 끄기 |
| UI가 느림 | Canvas rebuild | 정적/동적 분리 |
| Sliced가 안 먹힘 | Border 미설정 | Sprite Editor에서 Border |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **RectTransform** | UI 전용. 앵커·피벗·크기 |
| **앵커** | **부모의 어디에** 붙을 것인가 (0~1) |
| **피벗** | **나의 어디를** 기준으로 할 것인가 (0~1) |
| stretch 앵커 | Min≠Max. 부모 크기에 맞춰 늘어남 |
| Alt+Shift+클릭 | 앵커+피벗+위치 한 번에 |
| Canvas 3모드 | Overlay / Camera / World Space |
| **Canvas Scaler** | Scale With Screen Size + Reference Resolution |
| Match 값 | 0=폭 기준, 1=높이 기준, 0.5=절충 |
| Safe Area | 노치 대응. `Screen.safeArea` |
| Image Type | Simple / **Sliced** / Tiled / **Filled** |
| Filled | 체력바·쿨다운. `fillAmount` |
| Raycast Target | 안 쓰면 끈다 |
| Canvas rebuild | 정적/동적 분리 |
| 좌표 변환 | `ScreenPointToLocalPointInRectangle` |
| 그리기 순서 | Hierarchy 순서. `SetAsLastSibling` |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| Day 33 절대 좌표 그리기 | 앵커 기반 배치 |
| Day 60 `GetWidth() - 226` | 우측 앵커 |
| Day 48 지연 HP 게이지 | Image 2개 + `fillAmount` |
| Day 56 좌표계 3종 | 스크린/캔버스로컬/월드 |
| Day 57 화면↔월드 변환 | `ScreenPointToLocalPointInRectangle` |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 77** | 레이아웃 그룹으로 자동 배치 |
| Day 80 | 드래그&드롭 좌표 변환 |
| Day 85 | 디펜스 게임 HUD |
| Day 101+ | 파이널 프로젝트 UI 전반 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 4모서리 + 4변 중앙에 아이콘 배치 | 앵커 프리셋 9종 |
| ★★ | 원형 쿨다운 게이지 | Filled + Radial 360 |
| ★★ | 툴팁 (마우스 근처, 화면 밖으로 안 나감) | 피벗 동적 변경 |
| ★★★ | 미니맵 (World → UI 좌표) | `WorldToViewportPoint` |
| ★★★ | 해상도 변경 시 자동 재배치 확인 도구 | `Screen.SetResolution` |

### 다음 시간

> 레이아웃 뼈대가 잡혔다. 그런데 **손패가 문제다.**
>
> ```
>   카드가 3장일 때        카드가 7장일 때

>   ┌─────────────┐        ┌─────────────┐
>   │  ▣  ▣  ▣    │        │▣▣▣▣▣▣▣    │
>   └─────────────┘        └─────────────┘
>     넓게 배치              좁게, 겹쳐서
> ```
>
> 카드를 뽑고 낼 때마다 위치를 직접 계산할 수는 없다.
>
> **레이아웃 그룹**이 자동으로 재정렬한다.
>
> → **Day 77, 레이아웃 그룹과 스크롤 뷰**
