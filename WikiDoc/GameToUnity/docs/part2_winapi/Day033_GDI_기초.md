# Day 033 · GDI 기초 — 화면에 그리기

> **Week 7** · 연결 문서 `06 별 애니메이션` — Step 2
> 선수: Day 032 (WndProc, 메시지 처리)

---

## 1. 오늘 만드는 것

**창 안에 도형과 글자가 그려진다.** 클릭하면 그 자리에 별이 생기고, 창을 가렸다 열어도 그대로 있다.

```
   ┌──────────────────────────────────────────────────────┐
   │  GDI Test                                    ─    ✕ │
   ├──────────────────────────────────────────────────────┤
   │                                                      │
   │    ┌──────────┐        ╱╲                            │
   │    │          │       ╱  ╲       ★                   │
   │    │  사각형   │      ╱____╲                          │
   │    │          │                        ●              │
   │    └──────────┘                                      │
   │                            ★                          │
   │    ────────────────                                  │
   │                                        ★             │
   │   GDI 기초 — 클릭하면 별이 생깁니다                    │
   │   별 개수: 3                                          │
   └──────────────────────────────────────────────────────┘
```

**조작** — 좌클릭으로 별 추가, 우클릭으로 전체 삭제.

<!-- SHOT: Day 33 완성 화면 -->

---

## 2. 막히는 상황

어제 클릭 좌표는 알아냈다.

```cpp
    case WM_LBUTTONDOWN:
        g_clicks[g_clickCount].x = GET_X_LPARAM(lParam);
        g_clicks[g_clickCount].y = GET_Y_LPARAM(lParam);
        g_clickCount++;
        return 0;
```

**그런데 그 자리에 점을 찍을 방법이 없다.**

콘솔이었다면 이랬을 것이다.

```c
    printf("*");                         // 콘솔
```

창 프로그램에는 이게 없다. `printf`를 불러도 아무 데도 안 나온다.

```
   콘솔                          창(윈도우)

   화면 = 내 것                   화면 = Windows의 것
   printf 로 바로 출력            "어디에, 무엇으로 그릴지"를
                                  Windows에게 알려줘야 한다
```

```
   지금:   그릴 방법이 없다

   필요:   ① 그릴 대상(도화지)을 얻는다
           ② 색과 굵기(붓)를 정한다
           ③ 도형을 그린다
           ④ 도화지를 반납한다
```

> **Windows에서 그림을 그리는 방법이 필요하다.** → **GDI**

---

## 3. 개념

### 3-1. GDI와 HDC — 도화지

**왜 필요한가** — Windows에서 그리기의 출발점.

```
   GDI (Graphics Device Interface)
   = Windows가 제공하는 2D 그리기 시스템

   HDC (Handle to Device Context)
   = "어디에 그릴 것인가"를 나타내는 핸들
```

```
   ┌─────────────────────────────────────────────┐
   │  HDC = 도화지 + 현재 붓 + 현재 물감 + 폰트   │
   │                                              │
   │  ┌────────────────────────────────────┐     │
   │  │  그릴 대상 (창 / 메모리 / 프린터)    │     │
   │  ├────────────────────────────────────┤     │
   │  │  현재 펜   (선 색·굵기)              │     │
   │  │  현재 브러시 (채우기 색)             │     │
   │  │  현재 폰트  (글꼴)                   │     │
   │  │  현재 텍스트 색 / 배경 모드          │     │
   │  └────────────────────────────────────┘     │
   └─────────────────────────────────────────────┘

   ★ 도형 함수들은 "HDC의 현재 설정"으로 그린다
     Rectangle(hdc, ...)  →  hdc에 지금 선택된 펜과 브러시로 그린다
```

**HDC를 얻는 두 가지 방법**

| 상황 | 얻기 | 반납 |
|---|---|---|
| **`WM_PAINT` 안** | `BeginPaint` | `EndPaint` |
| 그 외 (언제든) | `GetDC` | `ReleaseDC` |

```cpp
    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            // ... 그리기 ...

            EndPaint(hWnd, &ps);
        }
        return 0;
```

```cpp
    // WM_PAINT 밖에서
    HDC hdc = GetDC(hWnd);
    // ... 그리기 ...
    ReleaseDC(hWnd, hdc);
```

> ### ⚠️ 반드시 짝을 맞춘다
>
> ```
>   BeginPaint  ↔  EndPaint
>   GetDC       ↔  ReleaseDC
>
>   ★ malloc/free, fopen/fclose 와 같은 원칙이다
>     안 반납하면 리소스가 고갈되어 결국 그리기가 멈춘다
> ```

### 3-2. `WM_PAINT` — 다시 그려야 할 때

**왜 필요한가** — Windows가 "여기 다시 그려 주세요"라고 요청하는 메시지.

```
   WM_PAINT 가 오는 상황

   ① 창이 처음 표시될 때
   ② 다른 창에 가려졌다가 다시 드러날 때
   ③ 창 크기가 바뀔 때
   ④ InvalidateRect 를 호출했을 때  ← 우리가 직접 요청 (Day 34)
```

```
   ┌──────────────────────────────────────────────────────┐
   │  Windows는 창의 내용을 기억하지 않는다                 │
   │                                                       │
   │  다른 창이 가림  →  가려진 부분의 내용이 사라짐        │
   │  다시 드러남     →  "너의 그림이 지워졌다. 다시 그려라"│
   │                     = WM_PAINT                        │
   └──────────────────────────────────────────────────────┘
```

> ### ⚠️ `WM_PAINT` 밖에서 그리면 사라진다
>
> ```cpp
>     case WM_LBUTTONDOWN:
>         {
>             HDC hdc = GetDC(hWnd);
>             Ellipse(hdc, x-5, y-5, x+5, y+5);      // 그려진다
>             ReleaseDC(hWnd, hdc);
>         }
>         return 0;
> ```
>
> 그려지긴 한다. 하지만 창을 가렸다 열면 **사라진다.**
>
> ```
>   ★ 올바른 방식
>
>   WM_LBUTTONDOWN  →  데이터에 좌표를 저장  →  InvalidateRect (다시 그려 달라)
>   WM_PAINT        →  저장된 데이터를 보고 전부 다시 그린다
>
>   = "화면은 데이터의 그림자다"
> ```
>
> 이 원칙이 Day 21의 **Update/Render 분리**와 정확히 같다.

**무효 영역(invalid region)**

```cpp
    InvalidateRect(hWnd, NULL, TRUE);
    //                   ▲      ▲
    //                   │      └── 배경을 지울 것인가 (Day 36의 핵심!)
    //                   └── 어느 영역을 (NULL = 전체)
```

```
   InvalidateRect  →  "이 영역이 더러워졌다"고 표시
                      → Windows가 나중에 WM_PAINT를 보낸다

   ★ 즉시 그려지는 게 아니다. 요청만 하는 것이다
   ★ 즉시 그리려면 UpdateWindow(hWnd) 를 추가로 호출
```

### 3-3. 기본 도형 함수

**왜 필요한가** — 이걸로 게임 화면의 대부분을 만든다.

```cpp
    // 사각형 (테두리 = 펜, 내부 = 브러시)
    Rectangle(hdc, left, top, right, bottom);

    // 타원 (사각형에 내접)
    Ellipse(hdc, left, top, right, bottom);

    // 둥근 사각형
    RoundRect(hdc, left, top, right, bottom, ellipseW, ellipseH);

    // 선
    MoveToEx(hdc, x1, y1, NULL);         // 시작점으로 이동
    LineTo(hdc, x2, y2);                 // 거기까지 선을 긋는다

    // 점 하나
    SetPixel(hdc, x, y, RGB(255, 0, 0));

    // 다각형
    POINT pts[3] = { {100,50}, {150,150}, {50,150} };
    Polygon(hdc, pts, 3);
```

```
   Rectangle(hdc, 100, 50, 300, 200)

   (100,50)
      ┌──────────────────┐
      │                  │      ← 테두리는 현재 펜으로
      │   (브러시로 채움) │
      │                  │
      └──────────────────┘
                    (300,200)

   ★ right, bottom 은 "포함하지 않는다"
     100~299, 50~199 픽셀이 그려진다
```

**`Ellipse`는 사각형에 내접하는 타원**

```
      ┌──────────────────┐
      │    ╱────────╲    │
      │   │          │   │      Ellipse(hdc, 100, 50, 300, 200)
      │   │          │   │      → 이 사각형 안에 딱 맞는 타원
      │    ╲────────╱    │
      └──────────────────┘

   원을 그리려면 정사각형을 넣는다
   Ellipse(hdc, cx-r, cy-r, cx+r, cy+r)
```

### 3-4. 색상 — `RGB` 매크로

**왜 필요한가** — Windows의 색 표현 방식.

```cpp
    COLORREF color = RGB(255, 128, 0);        // 주황
    //                    R    G    B         // 각 0~255
```

```
   COLORREF (32비트)

   ┌────────┬────────┬────────┬────────┐
   │  0x00  │   B    │   G    │   R    │
   └────────┴────────┴────────┴────────┘
     안 씀    파랑     초록     빨강

   ★ 순서가 BGR이다 (RGB 매크로가 알아서 처리해 준다)
```

| 색 | RGB |
|---|---|
| 검정 | `RGB(0, 0, 0)` |
| 흰색 | `RGB(255, 255, 255)` |
| 빨강 | `RGB(255, 0, 0)` |
| 초록 | `RGB(0, 255, 0)` |
| 파랑 | `RGB(0, 0, 255)` |
| 노랑 | `RGB(255, 255, 0)` |
| 마젠타 | `RGB(255, 0, 255)` ← **투명색으로 자주 쓴다** (Day 41) |

### 3-5. GDI 오브젝트 — 펜과 브러시

**왜 필요한가** — 색과 굵기를 바꾸려면 도구를 만들어 HDC에 끼워야 한다.

```cpp
    // 펜 만들기 (선)
    HPEN pen = CreatePen(PS_SOLID, 3, RGB(255, 0, 0));
    //                   스타일    굵기   색

    // 브러시 만들기 (채우기)
    HBRUSH brush = CreateSolidBrush(RGB(0, 128, 255));
```

**펜 스타일**

| 스타일 | 모양 |
|---|---|
| `PS_SOLID` | ──────── |
| `PS_DASH` | ─ ─ ─ ─ |
| `PS_DOT` | · · · · |
| `PS_DASHDOT` | ─ · ─ · |
| `PS_NULL` | (안 그림 — 테두리 없는 도형에 쓴다) |

### 3-6. ⚠️ `SelectObject` 패턴 — 반드시 지키는 절차

**왜 필요한가** — 잘못 쓰면 리소스가 새고, 오래 실행하면 그리기가 아예 멈춘다.

```cpp
    // ① 만든다
    HPEN pen = CreatePen(PS_SOLID, 3, RGB(255, 0, 0));

    // ② HDC에 끼우고, 원래 있던 것을 받아 둔다
    HPEN oldPen = (HPEN)SelectObject(hdc, pen);

    // ③ 그린다
    Rectangle(hdc, 100, 50, 300, 200);

    // ④ 원래 것으로 되돌린다
    SelectObject(hdc, oldPen);

    // ⑤ 삭제한다
    DeleteObject(pen);
```

```
   ┌────────────────────────────────────────────────┐
   │  Create  →  Select(이전 것 보관)  →  그리기      │
   │              →  Select(이전 것 복구)  →  Delete │
   └────────────────────────────────────────────────┘

   ★ ④를 안 하면?
     HDC가 아직 pen을 쓰고 있는 상태에서 DeleteObject를 하는 셈
     → 삭제가 무시되거나 예측 불가 동작

   ★ ⑤를 안 하면?
     GDI 오브젝트가 계속 쌓인다 (GDI 누수)
     → 프로세스당 기본 한도 10,000개
     → 넘으면 CreatePen이 NULL을 반환하고 아무것도 안 그려진다
```

**GDI 누수 확인 방법**

```
   작업 관리자 → 세부 정보 → 열 선택 → "GDI 개체" 체크

   정상:  일정하게 유지 (수십~수백)
   누수:  계속 증가 → 10,000에서 그리기가 멈춘다
```

**스톡 오브젝트 — 삭제할 필요 없는 것**

```cpp
    HBRUSH nullBrush = (HBRUSH)GetStockObject(NULL_BRUSH);   // 투명
    HPEN   whitePen  = (HPEN)GetStockObject(WHITE_PEN);

    // ★ GetStockObject 로 얻은 것은 DeleteObject 하지 않는다
```

| 스톡 오브젝트 | 용도 |
|---|---|
| `NULL_BRUSH` | 채우지 않음 (테두리만) |
| `NULL_PEN` | 테두리 없음 |
| `WHITE_BRUSH` `BLACK_BRUSH` `GRAY_BRUSH` | 기본 색 |
| `DEFAULT_GUI_FONT` | 기본 폰트 |

### 3-7. 텍스트 출력

**왜 필요한가** — 점수와 디버그 정보를 화면에 표시한다.

```cpp
    SetTextColor(hdc, RGB(255, 255, 255));    // 글자색
    SetBkMode(hdc, TRANSPARENT);               // ★ 배경 투명

    TextOut(hdc, 10, 10, "SCORE: 1200", 11);
    //                    문자열        길이
```

```cpp
    // 길이를 자동으로
    char buf[64];
    sprintf_s(buf, "SCORE: %d", score);
    TextOut(hdc, 10, 10, buf, (int)strlen(buf));
```

**`SetBkMode`**

```
   OPAQUE (기본)          TRANSPARENT

   ███SCORE███            SCORE
   ▲ 글자 뒤에 배경색      ▲ 뒤가 비친다

   ★ 게임에서는 거의 항상 TRANSPARENT
```

**정렬된 출력 — `DrawText`**

```cpp
    RECT rc = { 0, 0, 800, 600 };

    DrawText(hdc, "가운데 정렬", -1, &rc,
             DT_CENTER | DT_VCENTER | DT_SINGLELINE);
```

| 플래그 | 뜻 |
|---|---|
| `DT_LEFT` `DT_CENTER` `DT_RIGHT` | 가로 정렬 |
| `DT_TOP` `DT_VCENTER` `DT_BOTTOM` | 세로 정렬 |
| `DT_SINGLELINE` | 한 줄 (세로 정렬에 필수) |
| `DT_WORDBREAK` | 자동 줄바꿈 |

**폰트 만들기**

```cpp
    HFONT font = CreateFont(
        32,                          // 높이 (픽셀)
        0,                           // 폭 (0 = 자동)
        0, 0,                        // 각도
        FW_BOLD,                     // 굵기 (FW_NORMAL, FW_BOLD)
        FALSE, FALSE, FALSE,         // 이탤릭, 밑줄, 취소선
        DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY,         // 안티에일리어싱
        DEFAULT_PITCH,
        "맑은 고딕");

    HFONT oldFont = (HFONT)SelectObject(hdc, font);
    // ... 텍스트 출력 ...
    SelectObject(hdc, oldFont);
    DeleteObject(font);
```

> **폰트도 GDI 오브젝트다.** 같은 패턴으로 관리한다.

### 3-8. 좌표계 — y가 아래로

**왜 필요한가** — Day 12에서 배운 그것. 픽셀 단위로 바뀌었을 뿐이다.

```
   클라이언트 좌표계

   (0,0) ─────────────────────────▶ x 증가
     │
     │        ● (150, 80)
     │
     │
     ▼ y 증가

   ★ Day 12의 map[y][x] 와 같은 방향
   ★ 수학 좌표계와 y축이 반대
```

```cpp
    // 화면 중앙
    RECT rc;
    GetClientRect(hWnd, &rc);

    int cx = (rc.right - rc.left) / 2;
    int cy = (rc.bottom - rc.top) / 2;
```

---

## 4. 따라 만들기

### Step 1 — `WM_PAINT`에서 첫 도형

```cpp
    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            Rectangle(hdc, 100, 50, 300, 200);
            Ellipse(hdc, 350, 50, 550, 200);

            EndPaint(hWnd, &ps);
        }
        return 0;
```

**✅ 여기까지 실행하면** — 흰 사각형과 흰 타원이 검은 테두리로 그려진다.
**다른 창으로 가렸다가 다시 열어도 그대로 있다.**

<!-- SHOT: Step 1 첫 도형 -->

### Step 2 — `WM_PAINT` 밖에서 그려 보기 (실패 확인)

```cpp
    case WM_LBUTTONDOWN:
        {
            int x = GET_X_LPARAM(lParam);
            int y = GET_Y_LPARAM(lParam);

            HDC hdc = GetDC(hWnd);
            Ellipse(hdc, x - 10, y - 10, x + 10, y + 10);
            ReleaseDC(hWnd, hdc);
        }
        return 0;
```

**✅ 여기까지 실행하면** — 클릭하면 원이 그려진다.
**그런데 다른 창으로 가렸다가 다시 열면 전부 사라진다.**

> 3-2절에서 설명한 그 문제다. 이제 올바른 방식으로 고친다.

### Step 3 — 데이터 → `InvalidateRect` → `WM_PAINT`

```cpp
#define MAX_STARS 100

POINT g_stars[MAX_STARS];
int   g_starCount = 0;

    case WM_LBUTTONDOWN:
        if (g_starCount < MAX_STARS)
        {
            g_stars[g_starCount].x = GET_X_LPARAM(lParam);
            g_stars[g_starCount].y = GET_Y_LPARAM(lParam);
            g_starCount++;

            InvalidateRect(hWnd, NULL, TRUE);      // ★ 다시 그려 달라
        }
        return 0;

    case WM_RBUTTONDOWN:
        g_starCount = 0;
        InvalidateRect(hWnd, NULL, TRUE);
        return 0;

    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            for (int i = 0; i < g_starCount; i++)
                Ellipse(hdc, g_stars[i].x - 5, g_stars[i].y - 5,
                             g_stars[i].x + 5, g_stars[i].y + 5);

            EndPaint(hWnd, &ps);
        }
        return 0;
```

**✅ 여기까지 실행하면** — 클릭하면 원이 그려지고, **창을 가렸다 열어도 그대로 남아 있다.**

> **"데이터가 진짜고, 화면은 그림자다."**
> 이 원칙이 Day 21의 Update/Render 분리와 같은 것이다.

### Step 4 — 펜과 브러시

```cpp
    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            // 빨간 굵은 테두리 + 파란 채우기
            HPEN   pen   = CreatePen(PS_SOLID, 3, RGB(255, 0, 0));
            HBRUSH brush = CreateSolidBrush(RGB(0, 128, 255));

            HPEN   oldPen   = (HPEN)SelectObject(hdc, pen);
            HBRUSH oldBrush = (HBRUSH)SelectObject(hdc, brush);

            Rectangle(hdc, 100, 50, 300, 200);

            SelectObject(hdc, oldPen);
            SelectObject(hdc, oldBrush);
            DeleteObject(pen);
            DeleteObject(brush);

            EndPaint(hWnd, &ps);
        }
        return 0;
```

**✅ 여기까지 실행하면** — 사각형이 빨간 테두리에 파란 속을 갖는다.

### Step 5 — 테두리만 / 채우기만

```cpp
    // 테두리만 (속 비우기)
    HBRUSH oldBrush = (HBRUSH)SelectObject(hdc, GetStockObject(NULL_BRUSH));
    Rectangle(hdc, 100, 50, 300, 200);
    SelectObject(hdc, oldBrush);

    // 채우기만 (테두리 없음)
    HPEN oldPen = (HPEN)SelectObject(hdc, GetStockObject(NULL_PEN));
    Rectangle(hdc, 350, 50, 550, 200);
    SelectObject(hdc, oldPen);
```

**✅ 여기까지 실행하면** — 왼쪽은 속이 빈 사각형, 오른쪽은 테두리 없는 사각형이 나온다.

### Step 6 — 별 그리기 함수

```cpp
void DrawStar(HDC hdc, int cx, int cy, int radius, COLORREF color)
{
    const double PI = 3.14159265358979;
    POINT pts[10];

    for (int i = 0; i < 10; i++)
    {
        double angle = -PI / 2 + i * PI / 5;          // 위쪽부터 시작
        int    r     = (i % 2 == 0) ? radius : radius / 2;   // 바깥/안쪽 교대

        pts[i].x = cx + (int)(cos(angle) * r);
        pts[i].y = cy + (int)(sin(angle) * r);
    }

    HBRUSH brush    = CreateSolidBrush(color);
    HBRUSH oldBrush = (HBRUSH)SelectObject(hdc, brush);
    HPEN   oldPen   = (HPEN)SelectObject(hdc, GetStockObject(NULL_PEN));

    Polygon(hdc, pts, 10);

    SelectObject(hdc, oldPen);
    SelectObject(hdc, oldBrush);
    DeleteObject(brush);
}
```

```
   별 그리기 원리

   10개의 점을 번갈아 배치한다

           0 (바깥)
       9  ╱ ╲  1 (안쪽)
        ╲╱   ╲╱
   8 ────      ──── 2
        ╱╲   ╱╲
       7  ╲ ╱  3
           ╲╱
           5

   각도:  -90도에서 시작, 36도(π/5)씩 증가
   반지름: 짝수 인덱스는 R, 홀수는 R/2
```

> `cos`/`sin`으로 원 위의 점을 구하는 이 계산은
> **Day 66(포탄 발사 각도)** 에서 본격적으로 다룬다. 오늘은 형태만 쓴다.

**✅ 여기까지 실행하면** — 클릭한 자리에 노란 별이 그려진다.

<!-- SHOT: Step 6 별 그리기 -->

### Step 7 — 텍스트 출력

```cpp
    // WM_PAINT 안
    SetTextColor(hdc, RGB(255, 255, 255));
    SetBkMode(hdc, TRANSPARENT);

    char buf[128];
    sprintf_s(buf, "GDI 기초 — 클릭하면 별이 생깁니다");
    TextOut(hdc, 20, 500, buf, (int)strlen(buf));

    sprintf_s(buf, "별 개수: %d", g_starCount);
    TextOut(hdc, 20, 525, buf, (int)strlen(buf));
```

**✅ 여기까지 실행하면** — 화면 아래에 안내문과 별 개수가 표시된다.

> 배경이 검정(`BLACK_BRUSH`)인데 글자가 안 보인다면 `SetTextColor`를 확인한다.

### Step 8 — 폰트 만들기

```cpp
    HFONT font = CreateFont(
        28, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY, DEFAULT_PITCH, "맑은 고딕");

    HFONT oldFont = (HFONT)SelectObject(hdc, font);

    SetTextColor(hdc, RGB(255, 220, 0));
    TextOut(hdc, 20, 20, "GDI TEST", 8);

    SelectObject(hdc, oldFont);
    DeleteObject(font);
```

**✅ 여기까지 실행하면** — 큰 노란색 굵은 글씨가 나온다.

### Step 9 — GDI 누수 실험

```cpp
    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            for (int i = 0; i < 100; i++)
            {
                HPEN pen = CreatePen(PS_SOLID, 1, RGB(i * 2, 0, 0));
                SelectObject(hdc, pen);
                MoveToEx(hdc, 0, i * 5, NULL);
                LineTo(hdc, 800, i * 5);

                // DeleteObject(pen);        // ← 주석 처리
            }

            EndPaint(hWnd, &ps);
        }
        return 0;
```

**작업 관리자를 열고 "GDI 개체" 열을 보면서 창을 계속 가렸다 열어 본다.**

**✅ 여기까지 실행하면** — GDI 개체 수가 계속 올라가고, 10,000에 가까워지면 **선이 안 그려진다.**

> 확인 후 `DeleteObject`를 되살린다. **이 실험을 반드시 해 본다.**
> 3주 뒤 "왜 갑자기 안 그려지지?" 할 때 이 기억이 문제를 해결해 준다.

### Step 10 — 렌더 함수 분리

```cpp
void Render(HDC hdc, int width, int height)
{
    // 배경
    HBRUSH bg = CreateSolidBrush(RGB(20, 20, 40));
    RECT rc = { 0, 0, width, height };
    FillRect(hdc, &rc, bg);
    DeleteObject(bg);

    // 도형들
    DrawDemoShapes(hdc);

    // 별들
    for (int i = 0; i < g_starCount; i++)
        DrawStar(hdc, g_stars[i].x, g_stars[i].y, 15, RGB(255, 220, 0));

    // UI
    DrawUI(hdc, width, height);
}

    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            RECT rc;
            GetClientRect(hWnd, &rc);

            Render(hdc, rc.right, rc.bottom);

            EndPaint(hWnd, &ps);
        }
        return 0;
```

**✅ 여기까지 하면** — 그리기 코드가 `Render` 함수 하나로 모인다.

> **이 `Render(HDC, w, h)` 형태를 기억해 둔다.**
> **Day 37**에서 `hdc`를 백버퍼 DC로 바꾸기만 하면 더블버퍼링이 완성된다.
> **Day 39**에서는 `Core::Render()`가 된다.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────────────────────────────┐
   │  GDI Test                                    ─    ✕ │
   ├──────────────────────────────────────────────────────┤
   │  GDI TEST                                            │
   │                                                      │
   │    ┏━━━━━━━━━━┓        ╱╲                            │
   │    ┃          ┃       ╱  ╲       ★                   │
   │    ┃          ┃      ╱____╲                          │
   │    ┗━━━━━━━━━━┛                     ●                │
   │                            ★                          │
   │   ─────────────────                                  │
   │                                        ★             │
   │  GDI 기초 — 클릭하면 별이 생깁니다                     │
   │  별 개수: 3                                           │
   └──────────────────────────────────────────────────────┘
```

- [ ] 도형이 그려진다
- [ ] 창을 가렸다 열어도 그림이 그대로 있다
- [ ] 클릭한 자리에 별이 생긴다
- [ ] 우클릭하면 별이 전부 사라진다
- [ ] 펜과 브러시 색이 적용된다
- [ ] 텍스트가 배경 없이 출력된다
- [ ] `WM_PAINT` 밖에서 그리면 사라지는 것을 확인했다
- [ ] `DeleteObject`를 빼면 GDI 개체가 늘어나는 것을 확인했다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 창을 가렸다 열면 그림이 사라짐 | `WM_PAINT` 밖에서 그림 | 데이터 저장 → `InvalidateRect` → `WM_PAINT`에서 그리기 |
| 클릭해도 화면이 안 바뀜 | `InvalidateRect` 누락 | 추가 |
| 오래 실행하면 안 그려짐 | **GDI 누수** | `DeleteObject` 확인 |
| `DeleteObject`가 안 먹힘 | HDC가 아직 사용 중 | 먼저 `SelectObject`로 원래 것 복구 |
| 텍스트가 안 보임 | 배경색과 글자색이 같음 | `SetTextColor` |
| 텍스트 뒤에 사각형 | `SetBkMode` 기본값 | `SetBkMode(hdc, TRANSPARENT)` |
| 한글이 깨짐 | 문자 집합 설정 | 프로젝트를 멀티바이트로 (Day 31) |
| 도형 크기가 예상과 다름 | `right`/`bottom`은 미포함 | `x, y, x+w, y+h` |
| `cos`/`sin` 오류 | `<cmath>` 누락 | 포함 |
| `BeginPaint` 없이 `EndPaint` | 짝 안 맞음 | 반드시 짝 |
| 배경이 안 지워짐 | `FillRect` 누락 | 배경을 직접 칠하거나 클래스 브러시 사용 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **HDC** | "어디에 그릴 것인가" + 현재 펜·브러시·폰트 |
| `BeginPaint`/`EndPaint` | `WM_PAINT` 안에서 HDC 얻기. **짝을 맞춘다** |
| **`WM_PAINT`** | Windows가 "다시 그려라"고 요청. 여기서만 그린다 |
| `InvalidateRect` | "다시 그려 달라"고 요청. 즉시 그려지는 게 아니다 |
| 도형 함수 | `Rectangle` `Ellipse` `LineTo` `Polygon` `SetPixel` |
| `RGB` | 색상 지정 |
| **`SelectObject` 패턴** | Create → Select(보관) → 그리기 → Select(복구) → Delete |
| GDI 누수 | `DeleteObject` 누락 시 10,000개에서 그리기가 멈춘다 |
| 텍스트 | `TextOut` + `SetTextColor` + `SetBkMode(TRANSPARENT)` |

### 콘솔과의 대응

| 콘솔 (Part 1) | WINAPI (오늘) |
|---|---|
| `printf("*")` | `Ellipse` / `SetPixel` |
| 화면 배열에 문자 채우기 | HDC에 도형 그리기 |
| `system("cls")` | `FillRect`로 배경 칠하기 |
| 화면 배열 → 일괄 출력 | (Day 37 더블버퍼링) |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 34** | 타이머로 좌표를 바꾸고 `InvalidateRect` |
| **Day 37** | `Render(hdc, ...)` 의 `hdc`를 백버퍼로 교체 |
| Day 41 | `BitBlt`로 이미지 그리기 |
| Day 47 | 판정 박스를 `Rectangle`로 디버그 표시 |
| Day 68 | `AlphaBlend`로 반투명 이펙트 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 클릭할 때마다 다른 색 별이 나오게 | `rand()`로 `RGB` 값 생성 |
| ★★ | 격자(그리드) 그리기 — 50픽셀 간격 선 | `MoveToEx` + `LineTo` 반복 |
| ★★★ | 클릭한 두 점을 잇는 선을 계속 이어 그리기 (선 그리기 도구) | 점 배열 + `Polyline` |

### 다음 시간

> 그림은 그린다. 그런데 **움직이지 않는다.**
> 별을 옮기려면 좌표를 바꾸고 다시 그려야 하는데,
> 누군가 그 일을 주기적으로 시켜 줘야 한다.
>
> **시간이 흐르게 만드는 방법**이 필요하다.
>
> → **Day 34, 2D 좌표계와 타이머**
