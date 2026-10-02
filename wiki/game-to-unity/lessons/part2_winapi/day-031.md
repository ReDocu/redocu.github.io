# Day 031 · 창을 띄우다 — WinMain과 메시지 큐

> **Week 7** · 연결 문서 `06 별 애니메이션` — Step 0
> 선수: Day 027~028 (클래스, 상속)

> ### Part 2 시작 — 콘솔을 떠난다
> 6주 동안 글자로 게임을 만들었다. 오늘부터는 **픽셀**로 만든다.
> 그 첫걸음은, 내가 만든 창이 화면에 뜨는 것이다.

---

## 1. 오늘 만드는 것

**창 하나.** 제목 표시줄이 있고, 마우스로 옮길 수 있고, X를 누르면 닫힌다.

```
   ┌─────────────────────────────────────────────┐
   │  Arkanoid Framework              ─  □  ✕   │  ← 제목 표시줄
   ├─────────────────────────────────────────────┤
   │                                             │
   │                                             │
   │                                             │
   │              (빈 클라이언트 영역)             │
   │                                             │
   │                                             │
   │                                             │
   └─────────────────────────────────────────────┘
              800 × 600
```

**조작** — 창을 옮기고, 크기를 바꾸고, X로 닫는다.

> **오늘의 결과물은 초라해 보인다.** 하지만 이 빈 창이 앞으로 8주 동안 만들 모든 게임의 무대다.

<!-- SHOT: Day 31 완성 창 -->

---

## 2. 막히는 상황

콘솔에서 만든 게임의 한계를 정리해 보자.

```
   ✘ 원을 못 그린다              '●' 문자로 흉내낼 뿐
   ✘ 그림을 못 띄운다            캐릭터 스프라이트가 불가능
   ✘ 해상도가 글자 단위          80×25 격자가 전부
   ✘ 색이 16가지                 그라데이션·투명 불가
   ✘ 여전히 깜빡인다             Day 15에서 줄였지만 못 없앴다
```

`printf`로는 여기까지가 한계다. 다른 방법이 필요하다.

그런데 콘솔 프로그램의 시작점을 보자.

```c
int main(void)
{
    printf("Hello\n");
    return 0;
}
```

**이 `main`으로는 창이 안 뜬다.** 창을 만들려면 Windows에게 부탁해야 한다.

```
   콘솔 프로그램                    창(윈도우) 프로그램

   내가 화면을 다 쓴다               화면은 Windows의 것
   내가 순서를 정한다                Windows가 "이런 일이 생겼다"고 알려준다
   main 에서 시작                    WinMain 에서 시작
```

> **Windows에게 창을 만들어 달라고 요청하고, Windows가 보내는 소식을 받는 방법이 필요하다.**

---

## 3. 개념

### 3-1. Windows 프로그램의 구조 — 메시지

**왜 필요한가** — 콘솔과 근본적으로 다른 사고방식이다. 이것부터 이해해야 한다.

```
   [ 콘솔 방식 — 내가 주도한다 ]

   내 코드:  "키를 입력받아라"  →  _getch()  →  "이제 그려라"  →  printf


   [ 윈도우 방식 — Windows가 알려준다 ]

   사용자가 마우스 클릭
        ↓
   Windows:  "야, 네 창에서 왼쪽 버튼이 눌렸다" (메시지)
        ↓
   내 코드:  그 메시지를 받아서 처리
```

```
   ┌──────────┐                    ┌────────────────────┐
   │  사용자   │                    │      Windows        │
   │  키보드   │  ────────────────▶ │  (어느 창에서 무슨   │
   │  마우스   │                    │   일이 났는지 판단)  │
   └──────────┘                    └─────────┬──────────┘
                                              │ 메시지를
                                              ▼ 큐에 넣는다
                                   ┌────────────────────┐
                                   │  내 프로그램의       │
                                   │  메시지 큐          │
                                   │  ┌──┬──┬──┬──┐    │
                                   │  │M1│M2│M3│M4│    │
                                   │  └──┴──┴──┴──┘    │
                                   └─────────┬──────────┘
                                              │ 하나씩 꺼내서
                                              ▼ 처리
                                   ┌────────────────────┐
                                   │  WndProc            │
                                   │  switch(message)    │
                                   └────────────────────┘
```

**메시지의 예**

| 메시지 | 언제 오나 |
|---|---|
| `WM_CREATE` | 창이 만들어질 때 |
| `WM_PAINT` | 창을 다시 그려야 할 때 |
| `WM_KEYDOWN` | 키를 누를 때 |
| `WM_LBUTTONDOWN` | 마우스 왼쪽 버튼 클릭 |
| `WM_SIZE` | 창 크기가 바뀔 때 |
| `WM_DESTROY` | 창이 없어질 때 |

> **이 구조를 "이벤트 드리븐(event-driven)"이라고 한다.**
> Day 23에서 배운 "이벤트 기반 입력"과 같은 발상이 프로그램 전체로 확대된 것이다.

### 3-2. `WinMain` — 윈도우 프로그램의 시작점

**왜 필요한가** — `main` 대신 이것이 시작점이 된다.

```cpp
#include <windows.h>

int APIENTRY WinMain(HINSTANCE hInstance,
                     HINSTANCE hPrevInstance,
                     LPSTR     lpCmdLine,
                     int       nCmdShow)
{
    // ...
    return 0;
}
```

| 인자 | 뜻 | 쓰임 |
|---|---|---|
| `hInstance` | 이 프로그램의 인스턴스 핸들 | **창 생성에 필요** |
| `hPrevInstance` | 이전 인스턴스 (Win16 유물) | **항상 NULL. 안 쓴다** |
| `lpCmdLine` | 명령줄 인자 | 거의 안 씀 |
| `nCmdShow` | 창을 어떻게 표시할지 | `ShowWindow`에 넘김 |

**유니코드 버전**

```cpp
int APIENTRY wWinMain(HINSTANCE hInstance, HINSTANCE hPrev,
                      LPWSTR lpCmdLine, int nCmdShow)
```

> **프로젝트 설정에 따라 `WinMain` 또는 `wWinMain`을 써야 한다.**
> 이 과정에서는 **멀티바이트(ANSI)** 로 설정하고 `WinMain`을 쓴다.
> (설정 방법은 4절 Step 0)

### 3-3. 핸들(HANDLE) — Windows의 자원 식별자

**왜 필요한가** — `HINSTANCE`, `HWND`, `HDC`... 앞으로 `H`로 시작하는 것이 계속 나온다.

```
   핸들 = Windows가 관리하는 자원을 가리키는 번호표

   ┌──────────────────────────────────────────┐
   │  Windows 내부 (우리는 못 본다)             │
   │                                           │
   │  창 정보:  [위치, 크기, 제목, 스타일...]   │
   │              ▲                            │
   └──────────────┼───────────────────────────┘
                  │
              HWND (번호표)
                  │
   ┌──────────────┴───────────────────────────┐
   │  내 프로그램                               │
   │  HWND hWnd = 0x00050A3C;                  │
   │  ★ 실제 내용은 모른다. 번호표만 들고 있다  │
   └──────────────────────────────────────────┘
```

| 핸들 | 무엇을 가리키나 |
|---|---|
| `HINSTANCE` | 프로그램 인스턴스 |
| `HWND` | 창 (Window Handle) |
| `HDC` | 그리기 대상 (Day 33) |
| `HBITMAP` | 비트맵 이미지 (Day 37) |
| `HPEN` / `HBRUSH` | 펜 / 브러시 (Day 33) |

> **핸들은 포인터와 비슷하지만 다르다.**
> 포인터는 내가 직접 역참조하지만, 핸들은 **Windows API 함수에 넘겨서 쓴다.**
> 그리고 다 쓰면 반납해야 하는 것들이 있다 (Day 33의 `DeleteObject`).

### 3-4. 창을 만드는 3단계

**왜 필요한가** — 순서가 정해져 있다. 하나라도 빠지면 창이 안 뜬다.

```
   ┌──────────────────────────────────────────────┐
   │  ① 윈도우 클래스 등록   RegisterClass         │
   │     "이런 종류의 창을 만들 거다"               │
   │           ▼                                   │
   │  ② 창 생성             CreateWindow           │
   │     "그 종류로 실제 창 하나 만들어 줘"          │
   │           ▼                                   │
   │  ③ 창 표시             ShowWindow             │
   │     "화면에 보여 줘"                           │
   └──────────────────────────────────────────────┘
```

**① 윈도우 클래스 등록**

```cpp
WNDCLASS wc = { 0 };

wc.style         = CS_HREDRAW | CS_VREDRAW;      // 크기 바뀌면 다시 그림
wc.lpfnWndProc   = WndProc;                       // ★ 메시지 처리 함수
wc.hInstance     = hInstance;
wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);   // 배경색
wc.lpszClassName = "MyGameWindowClass";           // 클래스 이름 (내가 정함)

if (!RegisterClass(&wc))
{
    MessageBox(NULL, "윈도우 클래스 등록 실패", "오류", MB_OK);
    return 0;
}
```

> **`WNDCLASS`의 "클래스"는 C++의 클래스와 무관하다.**
> "창의 종류"라는 뜻이다. 붕어빵 틀에 가깝다.

**② 창 생성**

```cpp
HWND hWnd = CreateWindow(
    "MyGameWindowClass",         // 클래스 이름 (①에서 등록한 것)
    "Arkanoid Framework",        // 제목 표시줄 텍스트
    WS_OVERLAPPEDWINDOW,         // 스타일 (제목줄+테두리+최소화/최대화/닫기)
    CW_USEDEFAULT, CW_USEDEFAULT,// 위치 x, y (기본값)
    800, 600,                    // 크기 w, h
    NULL,                        // 부모 창 (없음)
    NULL,                        // 메뉴 (없음)
    hInstance,                   // 인스턴스
    NULL                         // 추가 데이터
);

if (hWnd == NULL)
{
    MessageBox(NULL, "창 생성 실패", "오류", MB_OK);
    return 0;
}
```

**③ 창 표시**

```cpp
ShowWindow(hWnd, nCmdShow);
UpdateWindow(hWnd);              // 즉시 다시 그리기 요청
```

### 3-5. ⚠️ 클라이언트 영역과 전체 창 크기

**왜 필요한가** — 800×600을 원했는데 그릴 수 있는 영역은 784×561이다.

```
   CreateWindow(..., 800, 600, ...)  →  창 "전체"가 800×600

   ┌─────────────────────────────────────┐  ┐
   │  제목 표시줄                  ─ □ ✕ │  │ 약 31px
   ├─────────────────────────────────────┤  ┤
   │                                     │  │
   │      클라이언트 영역                 │  │ 실제로 그릴 수 있는 곳
   │      784 × 561                      │  │ = 800 - 테두리
   │                                     │  │   600 - 제목줄 - 테두리
   │                                     │  │
   └─────────────────────────────────────┘  ┘
   ├─────────────── 800 ────────────────┤
```

**해결 — `AdjustWindowRect`**

```cpp
RECT rc = { 0, 0, 800, 600 };                    // 원하는 클라이언트 크기

AdjustWindowRect(&rc, WS_OVERLAPPEDWINDOW, FALSE);
// rc가 { -8, -39, 808, 569 } 처럼 조정된다

int winW = rc.right - rc.left;                   // 816
int winH = rc.bottom - rc.top;                   // 608

HWND hWnd = CreateWindow(..., winW, winH, ...);
```

> **게임에서는 클라이언트 크기가 중요하다.** 그 안에 그리기 때문이다.
> 이 처리를 안 하면 화면 오른쪽·아래가 잘린다.

### 3-6. 메시지 루프

**왜 필요한가** — 큐에 쌓인 메시지를 꺼내 처리하는 것이 프로그램의 본체다.

```cpp
MSG msg;

while (GetMessage(&msg, NULL, 0, 0))
{
    TranslateMessage(&msg);      // 키 메시지를 문자 메시지로 변환
    DispatchMessage(&msg);       // WndProc 으로 전달
}

return (int)msg.wParam;
```

```
   ┌─────────────────────────────────────────────────────┐
   │  GetMessage      큐에서 메시지를 하나 꺼낸다          │
   │                  ★ 큐가 비어 있으면 여기서 기다린다   │
   │        ▼                                             │
   │  TranslateMessage  WM_KEYDOWN → WM_CHAR 변환         │
   │        ▼                                             │
   │  DispatchMessage   Windows가 WndProc을 호출해 준다    │
   └─────────────────────────────────────────────────────┘
```

**`GetMessage`의 반환값**

| 반환값 | 뜻 |
|:--:|---|
| 0이 아님 | 메시지를 꺼냈다 → 루프 계속 |
| **0** | `WM_QUIT` 메시지 → **루프 종료** |
| -1 | 오류 |

> ### ⚠️ `GetMessage`는 메시지가 없으면 멈춰 선다
>
> 이것이 문제다. 게임은 메시지가 없어도 계속 돌아야 한다.
>
> ```
>   문서 편집기:  아무것도 안 하면 아무것도 안 해도 된다  →  GetMessage OK
>   게임:        아무것도 안 해도 공은 날아가야 한다      →  ✘
> ```
>
> **Day 38에서 `PeekMessage`로 바꾼다.** 오늘은 일단 이걸로 창을 띄운다.

### 3-7. `WndProc` — 메시지 처리 함수

**왜 필요한가** — Windows가 우리 대신 호출해 주는 함수. 여기서 모든 반응이 일어난다.

```cpp
LRESULT CALLBACK WndProc(HWND hWnd, UINT message,
                         WPARAM wParam, LPARAM lParam)
{
    switch (message)
    {
    case WM_DESTROY:
        PostQuitMessage(0);          // ★ WM_QUIT 을 큐에 넣는다
        return 0;
    }

    return DefWindowProc(hWnd, message, wParam, lParam);   // ★ 나머지는 기본 처리
}
```

```
   ┌──────────────────────────────────────────────────┐
   │  내가 처리할 메시지   →  case 로 잡아서 처리       │
   │  나머지 전부         →  DefWindowProc 에 넘긴다   │
   │                          ▲                        │
   │                          └── 창 이동, 크기 조절,  │
   │                              최소화 등을 대신 처리 │
   └──────────────────────────────────────────────────┘
```

> ### ⚠️ `DefWindowProc`을 빼먹으면 창이 먹통이 된다
>
> 창을 못 옮기고, 크기도 못 바꾸고, X를 눌러도 안 닫힌다.
> **처리하지 않은 메시지는 반드시 `DefWindowProc`에 넘긴다.**

### 3-8. 종료 흐름

**왜 필요한가** — X를 눌러도 프로세스가 안 죽는 사고를 막는다.

```
   [X] 클릭
      ↓
   WM_CLOSE      "창을 닫아도 될까?"     (기본 처리: DestroyWindow 호출)
      ↓
   WM_DESTROY    "창이 파괴된다"
      ↓
   PostQuitMessage(0)                    ← ★ 여기서 우리가 호출해야 한다
      ↓
   WM_QUIT 이 큐에 들어감
      ↓
   GetMessage 가 0 을 반환
      ↓
   메시지 루프 종료
      ↓
   WinMain 종료 → 프로세스 종료
```

```cpp
    case WM_DESTROY:
        PostQuitMessage(0);          // 이게 없으면 창은 사라져도 프로세스가 남는다
        return 0;
```

> **`PostQuitMessage(0)` 누락은 입문자 오류 1위다.**
> 창은 사라지는데 작업 관리자에 프로세스가 남아 있으면 이걸 의심한다.

---

## 4. 따라 만들기

### Step 0 — 프로젝트 생성과 설정

```
   1. Visual Studio 2022 → 새 프로젝트 만들기
   2. "Windows 데스크톱 애플리케이션" 선택
      (또는 빈 프로젝트 후 설정 변경 — 아래 참고)
   3. 이름: 06_star_anim
   4. 위치: KY/src/
```

**빈 프로젝트로 시작하는 경우 (권장 — 생성 코드가 없어 깔끔하다)**

```
   프로젝트 속성 (Alt+F7)

   구성 속성 → 고급 → 문자 집합            →  "멀티바이트 문자 집합 사용"
   링커 → 시스템 → 하위 시스템             →  "창(/SUBSYSTEM:WINDOWS)"
```

```
   ★ 하위 시스템을 "창"으로 하지 않으면
     error LNK2019: _main 함수를 찾을 수 없습니다  ← WinMain을 못 찾는다
```

**✅ 여기까지 하면** — 빈 프로젝트가 준비된다.

### Step 1 — 최소한의 창

```cpp
#include <windows.h>

LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);

int APIENTRY WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance,
                     LPSTR lpCmdLine, int nCmdShow)
{
    // ── ① 윈도우 클래스 등록 ──
    WNDCLASS wc = { 0 };

    wc.style         = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc   = WndProc;
    wc.hInstance     = hInstance;
    wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.lpszClassName = "MyGameWindowClass";

    if (!RegisterClass(&wc))
    {
        MessageBox(NULL, "윈도우 클래스 등록 실패", "오류", MB_OK);
        return 0;
    }

    // ── ② 창 생성 ──
    HWND hWnd = CreateWindow(
        "MyGameWindowClass",
        "Arkanoid Framework",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        800, 600,
        NULL, NULL, hInstance, NULL);

    if (hWnd == NULL)
    {
        MessageBox(NULL, "창 생성 실패", "오류", MB_OK);
        return 0;
    }

    // ── ③ 창 표시 ──
    ShowWindow(hWnd, nCmdShow);
    UpdateWindow(hWnd);

    // ── ④ 메시지 루프 ──
    MSG msg;

    while (GetMessage(&msg, NULL, 0, 0))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return (int)msg.wParam;
}

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

**✅ 여기까지 실행하면** — **창이 뜬다!**
제목 표시줄에 `Arkanoid Framework`가 보이고, 마우스로 옮길 수 있고, X를 누르면 닫힌다.

<!-- SHOT: Step 1 첫 창 -->

> **이 40줄이 앞으로 8주간 모든 프로젝트의 시작점이다.**

### Step 2 — `PostQuitMessage` 빼 보기

```cpp
    case WM_DESTROY:
        // PostQuitMessage(0);          // ← 주석 처리
        return 0;
```

**✅ 여기까지 실행하면** — X를 눌러 창은 사라지는데 **프로그램이 안 끝난다.**
Visual Studio의 정지 버튼(■)이 계속 활성 상태이거나, 작업 관리자에 프로세스가 남는다.

> 확인 후 반드시 되살린다. 3-8절에서 설명한 그 문제다.

### Step 3 — `DefWindowProc` 빼 보기

```cpp
    switch (message)
    {
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }

    return 0;                          // ✘ DefWindowProc 대신
```

**✅ 여기까지 실행하면** — 창이 뜨긴 하는데
- 마우스로 못 옮긴다
- 크기를 못 바꾼다
- X를 눌러도 안 닫힌다

> 확인 후 되살린다. **Windows가 대신 해주던 일들이 전부 사라진 것**이다.

### Step 4 — 클라이언트 크기 정확히 맞추기

```cpp
    // ── ② 창 생성 (수정) ──
    const int CLIENT_W = 800;
    const int CLIENT_H = 600;

    RECT rc = { 0, 0, CLIENT_W, CLIENT_H };
    AdjustWindowRect(&rc, WS_OVERLAPPEDWINDOW, FALSE);

    int winW = rc.right - rc.left;
    int winH = rc.bottom - rc.top;

    HWND hWnd = CreateWindow(
        "MyGameWindowClass",
        "Arkanoid Framework",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        winW, winH,                    // ← 조정된 크기
        NULL, NULL, hInstance, NULL);
```

**확인 코드**

```cpp
    RECT client;
    GetClientRect(hWnd, &client);

    char buf[128];
    sprintf_s(buf, "클라이언트: %d x %d",
              client.right - client.left,
              client.bottom - client.top);
    SetWindowText(hWnd, buf);
```

**✅ 여기까지 실행하면** — 제목 표시줄에 `클라이언트: 800 x 600` 이 정확히 표시된다.
조정 전에는 `784 x 561` 처럼 나온다.

### Step 5 — 창 위치를 화면 중앙으로

```cpp
    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);

    int posX = (screenW - winW) / 2;
    int posY = (screenH - winH) / 2;

    HWND hWnd = CreateWindow(
        "MyGameWindowClass", "Arkanoid Framework",
        WS_OVERLAPPEDWINDOW,
        posX, posY,                    // ← 중앙
        winW, winH,
        NULL, NULL, hInstance, NULL);
```

**✅ 여기까지 실행하면** — 창이 화면 정중앙에 뜬다.

### Step 6 — 크기 조절 막기 (게임에서 흔한 설정)

```cpp
#define GAME_WINDOW_STYLE  (WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX)
```

```cpp
    RECT rc = { 0, 0, CLIENT_W, CLIENT_H };
    AdjustWindowRect(&rc, GAME_WINDOW_STYLE, FALSE);      // ← 스타일 일치

    HWND hWnd = CreateWindow(
        "MyGameWindowClass", "Arkanoid Framework",
        GAME_WINDOW_STYLE,                                 // ← 스타일 적용
        posX, posY, winW, winH,
        NULL, NULL, hInstance, NULL);
```

**✅ 여기까지 실행하면** — 창 테두리를 잡아당겨도 크기가 안 바뀌고, 최대화 버튼이 사라진다.

> `AdjustWindowRect`에 넘기는 스타일과 `CreateWindow`의 스타일이 **같아야 한다.**
> 다르면 크기 계산이 어긋난다.

### Step 7 — 여러 창 띄워 보기

```cpp
    HWND hWnd1 = CreateWindow("MyGameWindowClass", "창 1", WS_OVERLAPPEDWINDOW,
                              100, 100, 400, 300, NULL, NULL, hInstance, NULL);

    HWND hWnd2 = CreateWindow("MyGameWindowClass", "창 2", WS_OVERLAPPEDWINDOW,
                              550, 100, 400, 300, NULL, NULL, hInstance, NULL);

    ShowWindow(hWnd1, nCmdShow);
    ShowWindow(hWnd2, nCmdShow);
```

**✅ 여기까지 실행하면** — 창이 두 개 뜬다.

> **하나의 윈도우 클래스로 창을 여러 개 만들 수 있다.**
> 클래스는 "종류"이고 창은 "개체"다. C++의 클래스와 객체 관계와 비슷하다.
>
> 다만 지금은 창 하나가 닫히면 프로그램이 끝난다 (`WM_DESTROY` → `PostQuitMessage`).
> 확인 후 창 하나로 되돌린다.

### Step 8 — 창 생성 함수로 정리

```cpp
HWND CreateGameWindow(HINSTANCE hInstance, const char* title,
                      int clientW, int clientH, int nCmdShow)
{
    static const char* CLASS_NAME = "MyGameWindowClass";
    static bool registered = false;

    if (!registered)
    {
        WNDCLASS wc = { 0 };
        wc.style         = CS_HREDRAW | CS_VREDRAW;
        wc.lpfnWndProc   = WndProc;
        wc.hInstance     = hInstance;
        wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
        wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
        wc.lpszClassName = CLASS_NAME;

        if (!RegisterClass(&wc)) return NULL;
        registered = true;
    }

    DWORD style = WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX;

    RECT rc = { 0, 0, clientW, clientH };
    AdjustWindowRect(&rc, style, FALSE);

    int winW = rc.right - rc.left;
    int winH = rc.bottom - rc.top;
    int posX = (GetSystemMetrics(SM_CXSCREEN) - winW) / 2;
    int posY = (GetSystemMetrics(SM_CYSCREEN) - winH) / 2;

    HWND hWnd = CreateWindow(CLASS_NAME, title, style,
                             posX, posY, winW, winH,
                             NULL, NULL, hInstance, NULL);

    if (hWnd == NULL) return NULL;

    ShowWindow(hWnd, nCmdShow);
    UpdateWindow(hWnd);

    return hWnd;
}
```

```cpp
int APIENTRY WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int nCmdShow)
{
    HWND hWnd = CreateGameWindow(hInstance, "Arkanoid Framework", 800, 600, nCmdShow);

    if (hWnd == NULL)
    {
        MessageBox(NULL, "창 생성 실패", "오류", MB_OK);
        return 0;
    }

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return (int)msg.wParam;
}
```

**✅ 여기까지 실행하면** — `WinMain`이 15줄로 줄어든다. 동작은 동일하다.

> **이 함수가 Day 39에서 `Core::Init()` 안으로 들어간다.**
> 지금 정리해 두면 그때 그대로 옮기기만 하면 된다.

### Step 9 — 배경색 확인

```cpp
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);    // 검정
    // wc.hbrBackground = (HBRUSH)GetStockObject(WHITE_BRUSH); // 흰색
    // wc.hbrBackground = CreateSolidBrush(RGB(30, 30, 60));   // 짙은 남색
```

**✅ 여기까지 실행하면** — 창 안쪽 색이 바뀐다.

> `CreateSolidBrush`로 만든 것은 **`DeleteObject`로 반납해야 한다** (Day 33).
> `GetStockObject`로 얻은 것은 반납할 필요가 없다.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   화면 중앙에

   ┌─────────────────────────────────────────────┐
   │  Arkanoid Framework              ─       ✕ │
   ├─────────────────────────────────────────────┤
   │                                             │
   │                                             │
   │              (검은 화면)                     │
   │                                             │
   │                                             │
   └─────────────────────────────────────────────┘
```

- [ ] 창이 화면 중앙에 뜬다
- [ ] 제목 표시줄에 지정한 제목이 보인다
- [ ] 클라이언트 영역이 정확히 800×600이다
- [ ] 마우스로 창을 옮길 수 있다
- [ ] 최대화 버튼이 없고 크기 조절이 안 된다
- [ ] X를 누르면 창이 닫히고 **프로세스도 종료된다**
- [ ] `PostQuitMessage`를 빼면 프로세스가 남는 것을 확인했다
- [ ] `DefWindowProc`을 빼면 창이 먹통이 되는 것을 확인했다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| `error LNK2019: _main을 찾을 수 없습니다` | 하위 시스템이 "콘솔" | 링커 → 시스템 → 하위 시스템 = **창** |
| `error C2664: LPCWSTR 변환 불가` | 문자 집합이 유니코드 | 문자 집합 = **멀티바이트**, 또는 `L"문자열"` |
| 창이 안 뜸 | `RegisterClass` 실패 | 클래스 이름 중복, `hInstance` 확인 |
| 창이 안 뜸 | `ShowWindow` 누락 | 추가 |
| X를 눌러도 프로세스가 남음 | **`PostQuitMessage` 누락** | `WM_DESTROY`에서 호출 |
| 창을 못 옮김 / 안 닫힘 | **`DefWindowProc` 누락** | `switch` 밖에서 반환 |
| 클라이언트가 작음 | `AdjustWindowRect` 미사용 | 추가. 스타일도 일치시킨다 |
| `WNDCLASS` 관련 크래시 | 초기화 안 함 | `WNDCLASS wc = { 0 };` |
| `wc.lpfnWndProc` 오류 | 함수 시그니처 불일치 | `LRESULT CALLBACK WndProc(HWND, UINT, WPARAM, LPARAM)` |
| 창이 하얗게만 보임 | 정상 (아직 아무것도 안 그림) | Day 33에서 그린다 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **메시지** | Windows가 "이런 일이 났다"고 알려주는 방식 |
| `WinMain` | 윈도우 프로그램의 시작점. `hInstance`가 중요 |
| 핸들 | Windows 자원의 번호표. `HWND`, `HDC`, `HBITMAP` |
| 창 만들기 3단계 | `RegisterClass` → `CreateWindow` → `ShowWindow` |
| `AdjustWindowRect` | 클라이언트 크기를 정확히 맞춘다 |
| 메시지 루프 | `GetMessage` → `TranslateMessage` → `DispatchMessage` |
| `WndProc` | 메시지 처리 함수. **나머지는 `DefWindowProc`** |
| `PostQuitMessage` | 없으면 프로세스가 안 죽는다 |

### 콘솔과의 대응

| 콘솔 (Part 1) | WINAPI (오늘) |
|---|---|
| `main` | `WinMain` |
| 콘솔 창 (자동) | `CreateWindow` (직접) |
| `while (running)` | `while (GetMessage(...))` |
| `printf` | (내일부터 GDI) |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 32** | `WndProc`에서 키·마우스 메시지 처리 |
| Day 33 | `WM_PAINT`에서 그리기 |
| **Day 38** | `GetMessage` → `PeekMessage` 로 교체 (게임 루프) |
| **Day 39** | 오늘 만든 `CreateGameWindow`가 `Core::Init()` 안으로 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 창 제목과 크기를 바꿔 보기 | `CreateGameWindow` 인자 |
| ★★ | 창을 화면 우하단에 배치 | `GetSystemMetrics` 활용 |
| ★★★ | 전체 화면 창 만들기 | `WS_POPUP` 스타일 + 화면 크기, 테두리 없음 |

### 다음 시간

> 창은 떴는데 **아무 반응이 없다.**
> 키를 눌러도, 클릭해도, 아무 일도 일어나지 않는다.
>
> Windows는 계속 메시지를 보내고 있는데 우리가 `WM_DESTROY` 하나만 받고
> 나머지는 전부 `DefWindowProc`에 넘기고 있기 때문이다.
>
> **창이 보내오는 말을 알아듣는다.**
>
> → **Day 32, WndProc와 메시지 처리**
