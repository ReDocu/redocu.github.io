# Day 032 · WndProc — 창이 보내오는 말 알아듣기

> **Week 7** · 연결 문서 `06 별 애니메이션` — Step 1
> 선수: Day 031 (WinMain, 메시지 루프)

---

## 1. 오늘 만드는 것

**창이 반응한다.** 클릭한 좌표가 제목에 뜨고, 키를 누르면 어떤 키인지 알려주고, 닫을 때 확인을 묻는다.

```
   ┌──────────────────────────────────────────────────────┐
   │  마우스 (342, 218)   키: SPACE   크기: 800x600  ─  ✕ │
   ├──────────────────────────────────────────────────────┤
   │                                                      │
   │                                                      │
   │                      ● ← 클릭한 자리                  │
   │                                                      │
   │                                                      │
   └──────────────────────────────────────────────────────┘

   X를 누르면:
   ┌───────────────────────────────┐
   │  종료하시겠습니까?      [예][아니오] │
   └───────────────────────────────┘
```

**조작** — 마우스를 움직이고, 클릭하고, 키를 누른다.

<!-- SHOT: Day 32 완성 화면 -->

---

## 2. 막히는 상황

어제 만든 창을 실행하고 이것저것 해 보자.

```
   마우스 클릭    →  아무 일 없음
   키 입력        →  아무 일 없음
   창 크기 조절   →  (막아뒀지만) 반응 확인 불가
   X 클릭         →  바로 닫힘 (확인 없이)
```

우리의 `WndProc`은 이렇게 생겼다.

```cpp
LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    switch (message)
    {
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }

    return DefWindowProc(hWnd, message, wParam, lParam);
}
```

**메시지를 딱 하나만 받고 있다.** 나머지는 전부 `DefWindowProc`에 넘긴다.

```
   Windows가 보내는 메시지 (창 하나에 초당 수십~수백 개)

   WM_CREATE       WM_SIZE        WM_MOVE        WM_PAINT
   WM_MOUSEMOVE    WM_LBUTTONDOWN WM_KEYDOWN     WM_KEYUP
   WM_SETFOCUS     WM_KILLFOCUS   WM_ACTIVATE    WM_TIMER
   ...
        ▲
        └── 지금은 전부 그냥 흘려보내고 있다
```

```
   지금:   메시지가 뭐가 오는지도 모른다

   필요:   ① 어떤 메시지가 언제 오는지 확인
           ② 필요한 것만 골라서 처리
           ③ wParam / lParam 에서 정보 꺼내기
```

> **창이 보내오는 말을 알아듣는 방법이 필요하다.**

---

## 3. 개념

### 3-1. `WndProc`의 네 인자

**왜 필요한가** — 메시지의 모든 정보가 이 네 개에 담겨 있다.

```cpp
LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
```

| 인자 | 뜻 |
|---|---|
| `hWnd` | **어느 창**에서 일어난 일인가 |
| `message` | **무슨 일**인가 (`WM_KEYDOWN` 등) |
| `wParam` | 부가 정보 1 (메시지마다 뜻이 다르다) |
| `lParam` | 부가 정보 2 (메시지마다 뜻이 다르다) |

```
   ★ wParam / lParam 의 의미는 메시지마다 완전히 다르다

   WM_KEYDOWN      wParam = 가상 키 코드
   WM_LBUTTONDOWN  lParam = 마우스 좌표 (하위 16비트 x, 상위 16비트 y)
   WM_SIZE         lParam = 새 클라이언트 크기
   WM_CHAR         wParam = 문자 코드

   → MSDN이나 문서를 봐야 한다. 외우는 게 아니다.
```

**`CALLBACK`이란**

```cpp
#define CALLBACK __stdcall
```

```
   내가 부르는 함수가 아니라, Windows가 나를 대신 불러 주는 함수
   → 콜백(callback) 함수

   그래서 호출 규약(__stdcall)을 Windows가 기대하는 대로 맞춰야 한다
```

### 3-2. 반환값의 의미

**왜 필요한가** — `return 0`과 `return DefWindowProc(...)`은 다른 뜻이다.

```cpp
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;                 // "처리했다. 기본 처리 필요 없음"

    // switch 밖
    return DefWindowProc(hWnd, message, wParam, lParam);
                                  // "안 처리했다. 기본대로 해라"
```

```
   ┌──────────────────────────────────────────────────┐
   │  내가 완전히 처리함        →  return 0            │
   │  기본 처리도 필요함        →  break; 후 DefWindowProc │
   │  전혀 관심 없음            →  case를 안 쓴다       │
   └──────────────────────────────────────────────────┘
```

> 일부 메시지는 반환값이 특별한 의미를 갖는다 (예: `WM_ERASEBKGND`는 Day 36).
> 대부분은 `return 0`이면 된다.

### 3-3. 창 생명주기 메시지

**왜 필요한가** — 초기화와 정리를 어디서 할지 정해진다.

| 메시지 | 언제 | 무엇을 하나 |
|---|---|---|
| `WM_CREATE` | 창이 만들어질 때 (1회) | 리소스 로드, 초기화 |
| `WM_SIZE` | 크기가 바뀔 때 | 백버퍼 재생성 (Day 37) |
| `WM_CLOSE` | X를 누를 때 | 종료 확인 |
| `WM_DESTROY` | 창이 파괴될 때 (1회) | 리소스 해제, `PostQuitMessage` |

```
   CreateWindow 호출
        ↓
   WM_CREATE          ← ★ CreateWindow가 반환되기 "전"에 온다
        ↓
   ShowWindow
        ↓
   WM_SIZE, WM_PAINT ...
        ↓
   (사용자가 X 클릭)
        ↓
   WM_CLOSE           ← 여기서 막을 수 있다
        ↓ (DefWindowProc이 DestroyWindow 호출)
   WM_DESTROY
        ↓
   PostQuitMessage(0)
```

```cpp
    case WM_CREATE:
        // 여기서 초기화. hWnd는 이미 유효하다
        return 0;

    case WM_CLOSE:
        if (MessageBox(hWnd, "종료하시겠습니까?", "확인",
                       MB_YESNO | MB_ICONQUESTION) == IDYES)
        {
            DestroyWindow(hWnd);          // ★ 직접 호출해야 한다
        }
        return 0;                          // 아니오면 아무 일도 안 일어남

    case WM_DESTROY:
        // 리소스 해제
        PostQuitMessage(0);
        return 0;
```

> ### ⚠️ `WM_CLOSE`를 처리하면 `DestroyWindow`를 직접 불러야 한다
>
> `DefWindowProc`이 `WM_CLOSE`를 받으면 `DestroyWindow`를 호출한다.
> 우리가 `WM_CLOSE`를 `return 0`으로 가로채면 그 기본 동작이 안 일어나서 **창이 안 닫힌다.**

### 3-4. 키보드 메시지

**왜 필요한가** — 어떤 키가 눌렸는지 안다.

```cpp
    case WM_KEYDOWN:
        // wParam = 가상 키 코드 (VK_LEFT, 'A', VK_SPACE ...)
        if (wParam == VK_ESCAPE)
            DestroyWindow(hWnd);
        return 0;

    case WM_KEYUP:
        return 0;

    case WM_CHAR:
        // wParam = 실제 문자 ('a', 'A', '가' ...)
        return 0;
```

**`WM_KEYDOWN` vs `WM_CHAR`**

```
   'A' 키를 Shift와 함께 누르면

   WM_KEYDOWN  wParam = VK_SHIFT  (0x10)
   WM_KEYDOWN  wParam = 'A'       (0x41)   ← 물리적인 키
   WM_CHAR     wParam = 'A'       (0x41)   ← 실제 문자
   WM_KEYUP    ...

   'a' 를 Shift 없이 누르면

   WM_KEYDOWN  wParam = 'A'       (0x41)   ← 여전히 대문자 코드!
   WM_CHAR     wParam = 'a'       (0x61)   ← 여기서 소문자
```

| | `WM_KEYDOWN` | `WM_CHAR` |
|---|---|---|
| 의미 | 물리적 키 | 입력된 문자 |
| 대소문자 구분 | **X** (항상 대문자 코드) | O |
| 방향키·F키 | O | X (문자가 아님) |
| 한글 조합 | X | O |
| 쓰는 곳 | **게임 조작** | 이름 입력, 채팅 |

> `WM_CHAR`는 `TranslateMessage`가 `WM_KEYDOWN`을 변환해서 만들어 준다.
> 그래서 메시지 루프에 `TranslateMessage`가 필요했던 것이다 (Day 31).

**키 반복(auto-repeat) 구분**

```cpp
    case WM_KEYDOWN:
        {
            bool isRepeat = (lParam & 0x40000000) != 0;    // bit 30

            if (!isRepeat)
            {
                // 처음 눌린 순간에만
            }
        }
        return 0;
```

> Day 23에서 겪은 그 반복 지연이 여기 있다.
> **게임에서는 메시지 대신 `GetAsyncKeyState`를 쓴다** (Day 44).
> 오늘은 메시지 구조를 이해하는 것이 목적이다.

### 3-5. 마우스 메시지

**왜 필요한가** — 마우스 좌표는 `lParam`에 압축되어 온다.

```cpp
    case WM_MOUSEMOVE:
    case WM_LBUTTONDOWN:
        {
            int x = LOWORD(lParam);       // 하위 16비트
            int y = HIWORD(lParam);       // 상위 16비트
        }
        return 0;
```

```
   lParam (32비트)

   ┌───────────────────┬───────────────────┐
   │   상위 16비트 y    │   하위 16비트 x    │
   └───────────────────┴───────────────────┘
          HIWORD              LOWORD

   예) lParam = 0x00DA0156
       LOWORD = 0x0156 = 342   (x)
       HIWORD = 0x00DA = 218   (y)
```

> ### ⚠️ 음수 좌표 문제
>
> 창 밖으로 마우스가 나가면 좌표가 음수가 될 수 있는데,
> `LOWORD`는 `unsigned`라 65000 같은 큰 값이 된다.
>
> ```cpp
> #include <windowsx.h>
>
> int x = GET_X_LPARAM(lParam);     // ✔ 부호를 올바르게 처리
> int y = GET_Y_LPARAM(lParam);
> ```
>
> **`windowsx.h`의 매크로를 쓴다.**

**주요 마우스 메시지**

| 메시지 | 언제 |
|---|---|
| `WM_MOUSEMOVE` | 마우스가 움직일 때 |
| `WM_LBUTTONDOWN` / `UP` | 왼쪽 버튼 |
| `WM_RBUTTONDOWN` / `UP` | 오른쪽 버튼 |
| `WM_LBUTTONDBLCLK` | 더블클릭 (클래스에 `CS_DBLCLKS` 필요) |
| `WM_MOUSEWHEEL` | 휠 (`wParam`의 상위 워드가 델타) |

**`wParam`으로 동시 눌린 키 확인**

```cpp
    case WM_LBUTTONDOWN:
        if (wParam & MK_SHIFT)    { /* Shift + 클릭 */ }
        if (wParam & MK_CONTROL)  { /* Ctrl + 클릭 */ }
        if (wParam & MK_RBUTTON)  { /* 양쪽 버튼 */ }
        return 0;
```

### 3-6. 좌표계 — 클라이언트 vs 화면

**왜 필요한가** — 두 좌표를 섞으면 클릭 위치가 어긋난다.

```
   화면 좌표 (screen coordinates)          클라이언트 좌표 (client)
   모니터 왼쪽 위가 (0,0)                   창 안쪽 왼쪽 위가 (0,0)

   (0,0)                                    ┌─────────────────┐
     ┌────────────────────────┐             │ 제목 표시줄      │
     │  모니터                 │             ├─────────────────┤
     │    ┌─────────────┐     │             │(0,0)            │
     │    │  창         │     │             │                 │
     │    │             │     │             │      ● (150,80) │
     │    └─────────────┘     │             │                 │
     └────────────────────────┘             └─────────────────┘
```

| 메시지 | 좌표계 |
|---|---|
| `WM_MOUSEMOVE`, `WM_LBUTTONDOWN` 등 | **클라이언트** |
| `WM_NCMOUSEMOVE` (비클라이언트 영역) | 화면 |
| `GetCursorPos` | 화면 |

**변환**

```cpp
    POINT pt;
    GetCursorPos(&pt);                    // 화면 좌표
    ScreenToClient(hWnd, &pt);            // → 클라이언트 좌표

    ClientToScreen(hWnd, &pt);            // 반대 방향
```

### 3-7. 창 상태 메시지

**왜 필요한가** — 게임에서 중요한 처리가 걸린다.

```cpp
    case WM_SIZE:
        {
            int w = LOWORD(lParam);       // 새 클라이언트 폭
            int h = HIWORD(lParam);       // 새 클라이언트 높이

            if (wParam == SIZE_MINIMIZED) { /* 최소화됨 */ }

            // ★ Day 37: 여기서 백버퍼를 다시 만든다
        }
        return 0;

    case WM_SETFOCUS:
        // 창이 활성화됨 → 게임 재개
        return 0;

    case WM_KILLFOCUS:
        // 창이 비활성화됨 → 게임 일시정지 (Day 44에서 쓴다)
        return 0;

    case WM_ACTIVATE:
        if (LOWORD(wParam) == WA_INACTIVE) { /* 비활성 */ }
        else                                { /* 활성 */ }
        return 0;
```

> `WM_KILLFOCUS` 처리가 없으면, 다른 창을 쓰는 동안에도 게임 캐릭터가 움직인다.
> Day 23에서 언급한 `GetAsyncKeyState`의 문제가 여기서 해결된다.

### 3-8. `SetWindowText` / `MessageBox` — 간단한 출력

**왜 필요한가** — 아직 그리기를 안 배웠으니, 이걸로 상태를 확인한다.

```cpp
    char buf[128];
    sprintf_s(buf, "마우스 (%d, %d)", x, y);
    SetWindowText(hWnd, buf);             // 제목 표시줄에 출력
```

```cpp
    int result = MessageBox(hWnd,
        "종료하시겠습니까?",              // 내용
        "확인",                           // 제목
        MB_YESNO | MB_ICONQUESTION);      // 버튼 + 아이콘

    if (result == IDYES) { /* ... */ }
```

| 플래그 | 버튼 |
|---|---|
| `MB_OK` | 확인 |
| `MB_OKCANCEL` | 확인 / 취소 |
| `MB_YESNO` | 예 / 아니오 |
| `MB_YESNOCANCEL` | 예 / 아니오 / 취소 |

| 반환값 | 뜻 |
|---|---|
| `IDOK` `IDCANCEL` `IDYES` `IDNO` | 누른 버튼 |

> ### ⚠️ 게임 루프 안에서 `MessageBox`를 부르면 게임이 멈춘다
>
> `MessageBox`는 사용자가 버튼을 누를 때까지 반환하지 않는다.
> **오류 알림이나 종료 확인처럼 진짜 멈춰야 할 때만 쓴다.**

### 3-9. 디버그 출력 — `OutputDebugString`

**왜 필요한가** — 창 프로그램에는 `printf`할 콘솔이 없다.

```cpp
#include <stdio.h>

void DebugLog(const char* format, ...)
{
    char buf[512];
    va_list args;
    va_start(args, format);
    vsprintf_s(buf, sizeof(buf), format, args);
    va_end(args);

    OutputDebugStringA(buf);
}
```

```cpp
    DebugLog("메시지: 0x%04X  wParam: 0x%08X\n", message, (unsigned)wParam);
```

```
   출력 위치:  Visual Studio → 디버그 실행(F5) → "출력" 창

   ★ Ctrl+Alt+O 로 출력 창을 연다
```

> **이것이 앞으로 8주간의 주 디버깅 도구다.**
> Day 33에서 화면에 텍스트를 그릴 수 있게 되지만, 로그는 이쪽이 편하다.

---

## 4. 따라 만들기

### Step 1 — 오는 메시지 관찰하기

```cpp
#include <windows.h>
#include <stdio.h>

void DebugLog(const char* format, ...)
{
    char buf[512];
    va_list args;
    va_start(args, format);
    vsprintf_s(buf, sizeof(buf), format, args);
    va_end(args);
    OutputDebugStringA(buf);
}

LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    DebugLog("MSG 0x%04X  w=0x%08X  l=0x%08X\n",
             message, (unsigned)wParam, (unsigned)lParam);

    switch (message)
    {
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }

    return DefWindowProc(hWnd, message, wParam, lParam);
}
```

**✅ 여기까지 실행하면 (F5로 디버그 실행)** — 출력 창에 메시지가 **폭포처럼 쏟아진다.**
마우스를 움직이면 `0x0200`(`WM_MOUSEMOVE`)이 계속 찍힌다.

```
MSG 0x0024  w=0x00000000  l=0x00DFF6A8
MSG 0x0081  w=0x00000000  l=0x00DFF5B8
MSG 0x0083  w=0x00000001  l=0x00DFF534
MSG 0x0001  w=0x00000000  l=0x00DFF5B8    ← WM_CREATE
MSG 0x0005  w=0x00000000  l=0x02580320    ← WM_SIZE
...
```

> **얼마나 많은 메시지가 오는지 눈으로 보는 것이 오늘의 첫 목표다.**

### Step 2 — 메시지 이름 표시

```cpp
const char* GetMessageName(UINT msg)
{
    switch (msg)
    {
    case WM_CREATE:        return "WM_CREATE";
    case WM_DESTROY:       return "WM_DESTROY";
    case WM_CLOSE:         return "WM_CLOSE";
    case WM_SIZE:          return "WM_SIZE";
    case WM_MOVE:          return "WM_MOVE";
    case WM_PAINT:         return "WM_PAINT";
    case WM_KEYDOWN:       return "WM_KEYDOWN";
    case WM_KEYUP:         return "WM_KEYUP";
    case WM_CHAR:          return "WM_CHAR";
    case WM_MOUSEMOVE:     return "WM_MOUSEMOVE";
    case WM_LBUTTONDOWN:   return "WM_LBUTTONDOWN";
    case WM_LBUTTONUP:     return "WM_LBUTTONUP";
    case WM_RBUTTONDOWN:   return "WM_RBUTTONDOWN";
    case WM_SETFOCUS:      return "WM_SETFOCUS";
    case WM_KILLFOCUS:     return "WM_KILLFOCUS";
    case WM_TIMER:         return "WM_TIMER";
    default:               return NULL;
    }
}
```

```cpp
    const char* name = GetMessageName(message);

    if (name != NULL && message != WM_MOUSEMOVE)      // 마우스 이동은 너무 많다
        DebugLog("%-18s w=0x%08X  l=0x%08X\n", name, (unsigned)wParam, (unsigned)lParam);
```

**✅ 여기까지 실행하면** — 읽을 수 있는 로그가 나온다.

```
WM_CREATE          w=0x00000000  l=0x00DFF5B8
WM_SIZE            w=0x00000000  l=0x02580320
WM_PAINT           w=0x00000000  l=0x00000000
WM_SETFOCUS        w=0x00000000  l=0x00000000
WM_KEYDOWN         w=0x00000041  l=0x001E0001    ← 'A' 키
WM_CHAR            w=0x00000061  l=0x001E0001    ← 'a' 문자
WM_KEYUP           w=0x00000041  l=0xC01E0001
```

<!-- SHOT: Step 2 메시지 로그 -->

### Step 3 — 마우스 좌표 표시

```cpp
#include <windowsx.h>          // ← GET_X_LPARAM

int g_mouseX = 0, g_mouseY = 0;

void UpdateTitle(HWND hWnd);

// WndProc 안
    case WM_MOUSEMOVE:
        g_mouseX = GET_X_LPARAM(lParam);
        g_mouseY = GET_Y_LPARAM(lParam);
        UpdateTitle(hWnd);
        return 0;
```

```cpp
void UpdateTitle(HWND hWnd)
{
    RECT rc;
    GetClientRect(hWnd, &rc);

    char buf[256];
    sprintf_s(buf, "마우스 (%d, %d)   키: %s   크기: %dx%d",
              g_mouseX, g_mouseY, g_lastKeyName,
              rc.right - rc.left, rc.bottom - rc.top);

    SetWindowText(hWnd, buf);
}
```

**✅ 여기까지 실행하면** — 마우스를 움직이면 제목 표시줄에 좌표가 실시간으로 표시된다.

### Step 4 — 클릭 위치 기록

```cpp
#define MAX_CLICKS 20

POINT g_clicks[MAX_CLICKS];
int   g_clickCount = 0;

    case WM_LBUTTONDOWN:
        {
            int x = GET_X_LPARAM(lParam);
            int y = GET_Y_LPARAM(lParam);

            if (g_clickCount < MAX_CLICKS)
            {
                g_clicks[g_clickCount].x = x;
                g_clicks[g_clickCount].y = y;
                g_clickCount++;
            }

            DebugLog("클릭 (%d, %d)  총 %d개\n", x, y, g_clickCount);

            InvalidateRect(hWnd, NULL, TRUE);      // 다시 그리기 요청 (Day 34)
        }
        return 0;

    case WM_RBUTTONDOWN:
        g_clickCount = 0;                          // 초기화
        InvalidateRect(hWnd, NULL, TRUE);
        return 0;
```

**✅ 여기까지 실행하면** — 클릭할 때마다 출력 창에 좌표가 기록된다.
(화면에 점을 그리는 것은 내일 배운다)

### Step 5 — 키 입력 처리

```cpp
char g_lastKeyName[32] = "-";

const char* GetKeyName(WPARAM vk)
{
    switch (vk)
    {
    case VK_LEFT:   return "LEFT";
    case VK_RIGHT:  return "RIGHT";
    case VK_UP:     return "UP";
    case VK_DOWN:   return "DOWN";
    case VK_SPACE:  return "SPACE";
    case VK_RETURN: return "ENTER";
    case VK_ESCAPE: return "ESC";
    case VK_SHIFT:  return "SHIFT";
    case VK_CONTROL:return "CTRL";
    default:        return NULL;
    }
}

    case WM_KEYDOWN:
        {
            bool isRepeat = (lParam & 0x40000000) != 0;

            const char* name = GetKeyName(wParam);

            if (name)
                strcpy_s(g_lastKeyName, sizeof(g_lastKeyName), name);
            else if (wParam >= 'A' && wParam <= 'Z')
                sprintf_s(g_lastKeyName, sizeof(g_lastKeyName), "%c", (char)wParam);
            else if (wParam >= '0' && wParam <= '9')
                sprintf_s(g_lastKeyName, sizeof(g_lastKeyName), "%c", (char)wParam);
            else
                sprintf_s(g_lastKeyName, sizeof(g_lastKeyName), "0x%02X", (unsigned)wParam);

            DebugLog("KEYDOWN: %s %s\n", g_lastKeyName, isRepeat ? "(repeat)" : "");

            if (wParam == VK_ESCAPE)
                PostMessage(hWnd, WM_CLOSE, 0, 0);      // 종료 요청

            UpdateTitle(hWnd);
        }
        return 0;
```

**✅ 여기까지 실행하면** — 키를 누르면 제목에 키 이름이 뜬다.
**키를 꾹 누르면 `(repeat)` 로그가 찍히는 것**을 확인한다. (Day 23의 그 문제)

### Step 6 — `WM_KEYDOWN` vs `WM_CHAR` 비교

```cpp
    case WM_KEYDOWN:
        DebugLog("KEYDOWN  wParam=0x%02X ('%c')\n",
                 (unsigned)wParam, (char)wParam);
        return 0;

    case WM_CHAR:
        DebugLog("CHAR     wParam=0x%02X ('%c')\n",
                 (unsigned)wParam, (char)wParam);
        return 0;
```

`a`를 누르고, `Shift+a`를 눌러 본다.

**✅ 여기까지 실행하면**

```
   'a' 입력:
   KEYDOWN  wParam=0x41 ('A')      ← 항상 대문자
   CHAR     wParam=0x61 ('a')      ← 실제 문자

   'Shift+a' 입력:
   KEYDOWN  wParam=0x10 ('?')      ← Shift
   KEYDOWN  wParam=0x41 ('A')
   CHAR     wParam=0x41 ('A')      ← 대문자
```

> 3-4절에서 설명한 차이를 눈으로 확인한다.

### Step 7 — 종료 확인 대화상자

```cpp
    case WM_CLOSE:
        if (MessageBox(hWnd, "종료하시겠습니까?", "확인",
                       MB_YESNO | MB_ICONQUESTION) == IDYES)
        {
            DestroyWindow(hWnd);      // ★ 직접 호출
        }
        return 0;                      // "아니오"면 아무 일도 안 일어난다
```

**✅ 여기까지 실행하면** — X를 누르면 확인 대화상자가 뜬다. "아니오"를 누르면 창이 안 닫힌다.

**`DestroyWindow`를 빼 보기**

```cpp
    case WM_CLOSE:
        if (MessageBox(...) == IDYES)
        {
            // DestroyWindow(hWnd);      // ← 주석
        }
        return 0;
```

**✅ 여기까지 실행하면** — "예"를 눌러도 **창이 안 닫힌다.** 3-3절의 함정이다.

### Step 8 — 포커스 처리

```cpp
bool g_hasFocus = true;

    case WM_SETFOCUS:
        g_hasFocus = true;
        DebugLog("포커스 획득 — 게임 재개\n");
        return 0;

    case WM_KILLFOCUS:
        g_hasFocus = false;
        DebugLog("포커스 상실 — 게임 일시정지\n");
        return 0;
```

**✅ 여기까지 실행하면** — 다른 창을 클릭하면 "포커스 상실"이, 다시 돌아오면 "포커스 획득"이 찍힌다.

> **Day 44에서 이 플래그로 입력을 차단한다.**

### Step 9 — `WM_SIZE` 처리 (크기 조절 허용 시)

Day 31 Step 6에서 크기 조절을 막았다면, 잠시 `WS_OVERLAPPEDWINDOW`로 되돌려 확인한다.

```cpp
int g_clientW = 800;
int g_clientH = 600;

    case WM_SIZE:
        g_clientW = LOWORD(lParam);
        g_clientH = HIWORD(lParam);

        DebugLog("크기 변경: %d x %d\n", g_clientW, g_clientH);

        if (wParam == SIZE_MINIMIZED)
            DebugLog("  (최소화)\n");

        UpdateTitle(hWnd);
        return 0;
```

**✅ 여기까지 실행하면** — 창 크기를 바꾸면 실시간으로 크기가 표시된다.

> **Day 37에서 여기에 백버퍼 재생성 코드가 들어간다.**

### Step 10 — `WndProc` 정리

```cpp
LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    switch (message)
    {
    case WM_CREATE:      return OnCreate(hWnd);
    case WM_SIZE:        return OnSize(hWnd, LOWORD(lParam), HIWORD(lParam), wParam);
    case WM_KEYDOWN:     return OnKeyDown(hWnd, wParam, lParam);
    case WM_CHAR:        return OnChar(hWnd, wParam);
    case WM_MOUSEMOVE:   return OnMouseMove(hWnd, GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam));
    case WM_LBUTTONDOWN: return OnLButtonDown(hWnd, GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam));
    case WM_SETFOCUS:    g_hasFocus = true;  return 0;
    case WM_KILLFOCUS:   g_hasFocus = false; return 0;
    case WM_CLOSE:       return OnClose(hWnd);
    case WM_DESTROY:     OnDestroy(hWnd); PostQuitMessage(0); return 0;
    }

    return DefWindowProc(hWnd, message, wParam, lParam);
}
```

**✅ 여기까지 하면** — `WndProc`이 짧아지고, 각 처리가 함수로 분리된다.

> **Day 39에서 이 핸들러들이 `Core` 클래스의 멤버 함수가 된다.**

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   제목 표시줄:
   마우스 (342, 218)   키: SPACE   크기: 800x600

   출력 창 (Ctrl+Alt+O):
   WM_CREATE          w=0x00000000
   WM_SIZE            w=0x00000000
   WM_SETFOCUS        w=0x00000000
   KEYDOWN: SPACE
   클릭 (342, 218)  총 1개
   KEYDOWN: A
   포커스 상실 — 게임 일시정지
   포커스 획득 — 게임 재개
```

- [ ] 출력 창에 메시지 로그가 나온다
- [ ] 마우스를 움직이면 제목에 좌표가 실시간 표시된다
- [ ] 키를 누르면 제목에 키 이름이 표시된다
- [ ] 키를 꾹 누르면 `(repeat)`이 찍힌다
- [ ] `WM_KEYDOWN`은 대문자, `WM_CHAR`는 실제 문자인 것을 확인했다
- [ ] X를 누르면 확인 대화상자가 뜬다
- [ ] "아니오"를 누르면 창이 안 닫힌다
- [ ] `DestroyWindow`를 빼면 "예"를 눌러도 안 닫히는 것을 확인했다
- [ ] 다른 창을 클릭하면 포커스 상실 로그가 찍힌다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 출력 창에 로그가 없음 | Ctrl+F5(디버깅 없이)로 실행 | **F5**로 디버그 실행 |
| 출력 창을 못 찾음 | 창이 닫혀 있음 | `Ctrl+Alt+O` |
| 마우스 좌표가 65000대 | `LOWORD` 사용 (음수 미처리) | `GET_X_LPARAM` (`windowsx.h`) |
| X를 눌러도 안 닫힘 | `WM_CLOSE`에서 `DestroyWindow` 누락 | 추가 |
| 창이 먹통 | `DefWindowProc` 누락 | `switch` 밖에서 반환 |
| 키가 소문자로 안 옴 | `WM_KEYDOWN`은 물리 키 | `WM_CHAR` 사용 |
| `GET_X_LPARAM` 정의 없음 | `windowsx.h` 누락 | `#include <windowsx.h>` |
| `WM_CREATE`가 안 옴 | `CreateWindow` 전에 로그 시작 | 정상. `CreateWindow` 내부에서 온다 |
| 메시지가 너무 많아 못 읽음 | `WM_MOUSEMOVE` 등 | 필터링해서 출력 |
| `sprintf_s` 경고 | 버퍼 크기 미지정 | `sizeof(buf)` 명시 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| `WndProc` 4인자 | 어느 창(`hWnd`), 무슨 일(`message`), 부가 정보(`wParam`/`lParam`) |
| 반환값 | `return 0`(처리함) vs `DefWindowProc`(기본 처리) |
| 생명주기 | `WM_CREATE` → `WM_SIZE` → ... → `WM_CLOSE` → `WM_DESTROY` |
| `WM_CLOSE` | 가로채면 **`DestroyWindow`를 직접 불러야 한다** |
| `WM_KEYDOWN` vs `WM_CHAR` | 물리 키 vs 실제 문자 |
| 마우스 좌표 | `lParam`에 압축. **`GET_X_LPARAM` 사용** |
| 좌표계 | 마우스 메시지는 클라이언트 좌표 |
| 포커스 | `WM_SETFOCUS`/`WM_KILLFOCUS`로 게임 일시정지 |
| `OutputDebugString` | 창 프로그램의 `printf` |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 33** | `WM_PAINT`에서 그리기 |
| Day 34 | `WM_TIMER`로 애니메이션 |
| **Day 37** | `WM_SIZE`에서 백버퍼 재생성 |
| **Day 39** | 핸들러들이 `Core` 클래스의 멤버로 |
| Day 44 | `WM_KILLFOCUS`로 입력 차단 |
| Day 57 | 맵툴의 마우스 드래그 (`WM_MOUSEMOVE` + 버튼 상태) |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 오른쪽 클릭으로 창 제목을 바꾸기 | `WM_RBUTTONDOWN` + `SetWindowText` |
| ★★ | 마우스 휠로 숫자를 올리고 내리기 | `WM_MOUSEWHEEL`, `GET_WHEEL_DELTA_WPARAM(wParam)` |
| ★★★ | 창 안에서 마우스를 누른 채 드래그하면 창이 따라 움직이게 | `WM_LBUTTONDOWN`에서 시작 좌표 저장, `WM_MOUSEMOVE`에서 `SetWindowPos` |

### 다음 시간

> 메시지는 알아듣는다. 그런데 **화면은 여전히 비어 있다.**
> 클릭한 자리에 점을 찍고 싶은데 `printf`가 없다.
>
> Windows에서 그림을 그리려면 **도화지와 붓**이 필요하다.
> 그 도화지가 `HDC`이고, 붓이 펜과 브러시다.
>
> → **Day 33, GDI 기초 — 화면에 그리기**
