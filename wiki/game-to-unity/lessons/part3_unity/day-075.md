# Day 075 · UI·게임오버·씬 전환 · 문서 13 완성

> **Week 15** · 연결 문서 `13 런닝 게임` — Step 4~5 (완성)
> 선수: Day 074 (프리팹과 오브젝트 풀)

---

## 1. 오늘 만드는 것

**타이틀 → 게임 → 결과의 흐름이 완결되고, 빌드한 실행 파일이 나온다.**

```
   ┌──────────────────────────┐   ┌──────────────────────────┐
   │       ENDLESS RUN        │   │  거리 1,284 m   ◆ 62     │
   │                          │   │                          │
   │      ┌────────────┐      │   │            ◆ ◆           │
   │      │   START    │      │→  │    ┌───┐         ███     │
   │      └────────────┘      │   │    │ ● │                 │
   │      ┌────────────┐      │   │    └───┘                 │
   │      │    QUIT    │      │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
   │                          │   │                          │
   │   최고 기록  2,431 m     │   │                    [Esc] │
   └──────────────────────────┘   └──────────────────────────┘
                                              │ 충돌
                                              ▼
                                  ┌──────────────────────────┐
                                  │       GAME  OVER         │
                                  │                          │
                                  │    거리    1,284 m       │
                                  │    코인       62         │
                                  │    점수    1,904         │
                                  │                          │
                                  │    ★ 신기록!             │
                                  │                          │
                                  │  [RETRY]      [TITLE]    │
                                  └──────────────────────────┘
```

<!-- SHOT: Day 75 세 화면 -->

---

## 2. 막히는 상황

어제까지 만든 것은 잘 돌아간다.

```
   ★ 그런데

   × 점수가 Console에만 찍힌다
   × 죽어도 아무 일이 안 일어난다
   × 다시 하려면 Play를 껐다 켜야 한다
   × 친구에게 보여줄 수가 없다 (Unity 에디터가 있어야 한다)
```

```
   "게임"과 "게임처럼 보이는 씬"의 차이

   ① 시작이 있다
   ② 끝이 있다
   ③ 결과가 남는다
   ④ 다시 할 수 있다
   ⑤ 혼자 실행된다
```

> **오늘 그 다섯 가지를 채운다.**

---

## 3. 개념

### 3-1. Canvas

**왜 필요한가** — UI를 그리는 판.

```
   Hierarchy 우클릭 → UI → Canvas
   → EventSystem 도 자동 생성된다
```

| Render Mode | 설명 | 용도 |
|---|---|---|
| **Screen Space - Overlay** | 항상 화면 맨 위 | **HUD, 메뉴** ★ |
| Screen Space - Camera | 카메라에 종속. 3D 효과 가능 | 연출이 있는 UI |
| World Space | 씬 안의 물체처럼 | 캐릭터 머리 위 체력바, VR |

```
   ★ 오늘은 Overlay 로 충분
   Week 16에서 본격적으로 다룬다
```

```
   ⚠️ EventSystem이 없으면 버튼이 안 눌린다

   실수로 지우면 UI → EventSystem 으로 다시 만든다
```

### 3-2. Canvas Scaler — 해상도 대응

**왜 필요한가** — 창 크기가 바뀌어도 UI가 깨지면 안 된다.

```
   Canvas → Canvas Scaler

   UI Scale Mode: Scale With Screen Size    ★
   Reference Resolution: 1920 × 1080
   Screen Match Mode: Match Width Or Height
   Match: 0.5
```

| Scale Mode | 동작 |
|---|---|
| Constant Pixel Size | UI 크기 고정. 큰 화면에서 작아 보임 |
| **Scale With Screen Size** | 해상도에 비례해 확대/축소 ★ |
| Constant Physical Size | 물리적 크기 유지 |

```
   ★ Match 값

   0    = 너비 기준 (세로가 길어지면 UI가 커진다)
   1    = 높이 기준
   0.5  = 절충 ★

   가로 게임은 0, 세로 게임은 1이 편할 때도 있다
```

```
   ⚠️ Reference Resolution을 정해 두지 않으면

   개발 PC에서만 예쁘고 다른 해상도에서 깨진다
```

### 3-3. TextMeshPro

**왜 필요한가** — 기본 Text보다 훨씬 선명하다.

```
   UI → Text - TextMeshPro
   → 처음 만들면 "TMP Essentials 임포트" 창이 뜬다.  Import 클릭
```

| 항목 | 기존 Text | **TextMeshPro** |
|---|---|---|
| 확대 시 | 흐려짐 | **선명** (SDF) |
| 외곽선/그림자 | 별도 컴포넌트 | 내장 |
| 리치 텍스트 | 제한적 | 풍부 |
| 한글 | 기본 폰트 | **폰트 애셋 생성 필요** |

```
   ⚠️ 한글이 □□□ 로 나오는 경우

   TMP 폰트 애셋에 한글 글리프가 없다

   해결:
   Window → TextMeshPro → Font Asset Creator
   Source Font: 한글 폰트 (예: NotoSansKR-Regular.ttf)
   Character Set: Custom Characters 또는 Unicode Range
   → 필요한 글자만 넣으면 용량이 작다
```

```csharp
using TMPro;

    [SerializeField] private TextMeshProUGUI scoreText;

    scoreText.text = $"점수 {score}";
```

```
   ⚠️ 타입 주의

   TextMeshProUGUI   →  Canvas 안의 UI 텍스트
   TextMeshPro       →  월드 공간의 3D 텍스트
```

### 3-4. Button

**왜 필요한가** — 클릭 처리.

```
   UI → Button - TextMeshPro
```

```csharp
using UnityEngine;
using UnityEngine.UI;

public class TitleUI : MonoBehaviour
{
    [SerializeField] private Button startButton;
    [SerializeField] private Button quitButton;

    void Start()
    {
        // ★ 코드로 연결 (Inspector 연결보다 추적이 쉽다)
        startButton.onClick.AddListener(OnStart);
        quitButton.onClick.AddListener(OnQuit);
    }

    void OnDestroy()
    {
        startButton.onClick.RemoveListener(OnStart);   // ★ 정리
        quitButton.onClick.RemoveListener(OnQuit);
    }

    private void OnStart() { SceneLoader.Load("Game"); }
    private void OnQuit()  { GameApp.Quit(); }
}
```

```
   ★ Inspector 연결 vs 코드 연결

   Inspector:  드래그로 간단. 하지만 "누가 부르는지" 코드에서 안 보인다
   코드:       추적 가능. 리팩터링에 안전  ★ 권장
```

```
   ⚠️ AddListener를 여러 번 하면 여러 번 호출된다

   Start에서 한 번만. 또는 RemoveAllListeners() 후 추가
```

### 3-5. PlayerPrefs — 간단한 저장

**왜 필요한가** — 최고 기록을 남긴다.

```csharp
    // 저장
    PlayerPrefs.SetInt("BestDistance", 1284);
    PlayerPrefs.SetFloat("Volume", 0.8f);
    PlayerPrefs.SetString("PlayerName", "KY");
    PlayerPrefs.Save();                        // ★ 명시적 저장

    // 읽기 (없으면 기본값)
    int best = PlayerPrefs.GetInt("BestDistance", 0);

    // 존재 확인 / 삭제
    if (PlayerPrefs.HasKey("BestDistance")) { }
    PlayerPrefs.DeleteKey("BestDistance");
    PlayerPrefs.DeleteAll();
```

```
   ★ 저장 위치

   Windows:  레지스트리
             HKCU\Software\<회사명>\<제품명>

   회사명/제품명은 Project Settings → Player 에서 설정
```

```
   ⚠️ PlayerPrefs의 한계

   ① 암호화 없음 — 누구나 고칠 수 있다
   ② 구조화된 데이터에 부적합
   ③ 용량 제한 (플랫폼별)

   → 설정값·최고기록 정도만
   → 세이브 데이터는 JSON 파일 (Day 79)
```

```
   ★ Part 2 Day 26·59와의 비교

   Part 2:  fopen/fwrite 로 직접 바이너리 저장
   Unity:   PlayerPrefs 한 줄

   대신 포맷 검증·버전 관리를 직접 못 한다
```

### 3-6. Time.timeScale

**왜 필요한가** — 일시정지와 게임오버.

```csharp
    Time.timeScale = 0f;                       // 정지
    Time.timeScale = 1f;                       // 정상
    Time.timeScale = 0.3f;                     // 슬로우 모션
```

```
   ★ timeScale = 0 일 때

   Time.deltaTime          →  0
   Update                  →  계속 호출됨 (dt가 0일 뿐)
   FixedUpdate             →  호출 안 됨
   Time.unscaledDeltaTime  →  정상값  ★
   코루틴 WaitForSeconds   →  멈춤
   WaitForSecondsRealtime  →  진행  ★
```

```csharp
    // ★ UI 애니메이션은 unscaled를 써야 한다
    void Update()
    {
        float dt = Time.unscaledDeltaTime;
        panelAlpha = Mathf.MoveTowards(panelAlpha, 1f, dt * 3f);
    }
```

```
   ⚠️ timeScale을 1로 되돌리는 것을 잊지 말 것

   씬을 다시 로드해도 timeScale은 유지된다
   → 재시작했는데 멈춰 있다
```

```csharp
    public static void Load(string sceneName)
    {
        Time.timeScale = 1f;                   // ★ 반드시
        SceneManager.LoadScene(sceneName);
    }
```

### 3-7. 씬 전환

**왜 필요한가** — 타이틀 ↔ 게임 ↔ 결과.

```csharp
using UnityEngine.SceneManagement;

    SceneManager.LoadScene("Game");                    // 즉시 (동기)
    SceneManager.LoadScene(1);                         // 빌드 인덱스로
    SceneManager.LoadScene("UI", LoadSceneMode.Additive);   // 추가 로드

    // 현재 씬 다시 로드
    SceneManager.LoadScene(SceneManager.GetActiveScene().name);
```

```
   ⚠️ Build Settings에 등록하지 않으면

   "Scene 'Game' couldn't be loaded because it has not been added
    to the build settings"

   File → Build Settings → Add Open Scenes
```

**비동기 로드 (로딩 화면)**

```csharp
    IEnumerator LoadAsync(string sceneName)
    {
        AsyncOperation op = SceneManager.LoadSceneAsync(sceneName);
        op.allowSceneActivation = false;       // ★ 준비만 하고 대기

        while (op.progress < 0.9f)
        {
            progressBar.value = op.progress / 0.9f;
            yield return null;
        }

        progressBar.value = 1f;
        yield return new WaitForSecondsRealtime(0.3f);

        op.allowSceneActivation = true;        // ★ 전환
    }
```

```
   ★ progress가 0.9에서 멈추는 이유

   0.0 ~ 0.9  =  로딩
   0.9 ~ 1.0  =  활성화 (allowSceneActivation을 기다림)
```

### 3-8. 씬 간 데이터 전달

**왜 필요한가** — 게임 씬의 점수를 결과 씬에서 써야 한다.

**방법 1 — static (가장 단순)**

```csharp
public static class GameResult
{
    public static int Distance;
    public static int Coins;
    public static int Score;
    public static bool IsNewRecord;
}
```

```
   ★ static은 씬을 넘어 살아남는다

   장점:  가장 단순
   단점:  전역 상태. 남용하면 추적이 어렵다
```

**방법 2 — DontDestroyOnLoad**

```csharp
public class GameData : MonoBehaviour
{
    public static GameData Instance { get; private set; }

    public int LastScore;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }

        Instance = this;
        DontDestroyOnLoad(gameObject);         // ★ 씬 전환에도 파괴 안 됨
    }
}
```

```
   ⚠️ DontDestroyOnLoad 주의

   ① 씬을 다시 로드하면 중복 생성될 수 있다 → Instance 검사 필수
   ② 계속 살아 있으므로 상태 초기화를 잊기 쉽다
   ③ 자식 오브젝트도 함께 유지된다
```

**방법 3 — 결과를 별도 씬으로 안 만들기 (오늘 채택)**

```
   ★ 게임 씬 안에 결과 패널을 둔다

   장점:  데이터 전달이 필요 없다. 로딩도 없다
   단점:  씬이 복잡해진다

   → 러너 게임 정도 규모에는 이게 편하다
```

### 3-9. AudioSource와 AudioClip

**왜 필요한가** — 소리가 있으면 완성도가 확 오른다.

| 구성 | 역할 |
|---|---|
| **AudioListener** | 귀. 보통 Main Camera에 하나 |
| **AudioSource** | 스피커. 소리를 내는 오브젝트 |
| **AudioClip** | 음원 파일 |

```csharp
    [SerializeField] private AudioSource bgmSource;
    [SerializeField] private AudioSource sfxSource;
    [SerializeField] private AudioClip coinClip;

    // BGM — 루프
    bgmSource.clip = bgmClip;
    bgmSource.loop = true;
    bgmSource.Play();

    // 효과음 — 겹쳐 재생
    sfxSource.PlayOneShot(coinClip, 0.7f);     // ★ 여러 개 동시 가능
```

```
   ★ Play vs PlayOneShot

   Play:         현재 clip을 재생. 이전 것이 끊긴다
   PlayOneShot:  겹쳐서 재생. 효과음에 적합  ★
```

```
   ⚠️ AudioListener가 2개면 경고가 뜬다

   "There are 2 audio listeners in the scene"
   → 하나만 남긴다
```

```csharp
    // ★ 피치 랜덤으로 단조로움 줄이기
    sfxSource.pitch = Random.Range(0.95f, 1.05f);
    sfxSource.PlayOneShot(coinClip);
```

**임포트 설정**

| 용도 | Load Type | Compression |
|---|---|---|
| BGM (긴 음원) | Streaming | Vorbis |
| 효과음 (짧음) | **Decompress On Load** | PCM 또는 ADPCM |

```
   ⚠️ 짧은 효과음을 Compressed In Memory로 두면

   재생할 때마다 압축 해제 → 미세한 지연
```

### 3-10. 게임 상태 관리

**왜 필요한가** — Day 69의 턴 FSM과 같은 구조.

```csharp
public enum GameState
{
    Ready,          // 시작 대기
    Playing,
    Paused,
    GameOver
}
```

```
   상태 흐름

   ┌────────┐  아무 키   ┌─────────┐  충돌   ┌──────────┐
   │ Ready  │ ─────────▶│ Playing │ ──────▶│ GameOver │
   └────────┘           └─────────┘        └──────────┘
                          ▲     │               │
                    Esc   │     │ Esc           │ Retry
                          │     ▼               ▼
                       ┌─────────┐         (씬 재로드)
                       │ Paused  │
                       └─────────┘
```

```csharp
    public void SetState(GameState s)
    {
        if (state == s) return;

        state = s;

        switch (s)
        {
        case GameState.Ready:    Time.timeScale = 1f; break;
        case GameState.Playing:  Time.timeScale = 1f; break;
        case GameState.Paused:   Time.timeScale = 0f; break;
        case GameState.GameOver: Time.timeScale = 0f; break;
        }

        OnStateChanged?.Invoke(s);             // ★ 이벤트
    }

    public event System.Action<GameState> OnStateChanged;
```

```
   ★ C# 이벤트

   상태가 바뀌면 등록된 함수들이 자동 호출된다
   → UI가 GameManager를 매 프레임 확인할 필요가 없다
```

```csharp
    // 구독하는 쪽
    void OnEnable()  { GameManager.Instance.OnStateChanged += HandleState; }
    void OnDisable() { GameManager.Instance.OnStateChanged -= HandleState; }
```

```
   ⚠️ 구독하면 반드시 해제한다

   빠뜨리면
   → 파괴된 오브젝트가 계속 호출됨 → 예외
   → 메모리 누수
```

### 3-11. 빌드

**왜 필요한가** — 실행 파일이 나와야 게임이다.

```
   File → Build Settings (Unity 6: Build Profiles)

   ① Scenes In Build 에 씬 등록 (순서 = 인덱스)
   ② Platform: Windows
   ③ Architecture: x86_64
   ④ Build 클릭 → 폴더 선택
```

| 옵션 | 의미 |
|---|---|
| **Development Build** | 프로파일러 연결 가능. 느림 |
| Autoconnect Profiler | 실행 시 프로파일러 자동 연결 |
| Script Debugging | 브레이크포인트 가능 |
| **Compression Method** | LZ4 (빠름) / LZ4HC (작음) |

```
   ★ 배포용은 Development Build 해제

   디버그 기능이 빠져 더 빠르고 작다
```

**Player Settings**

```
   Edit → Project Settings → Player

   Company Name:  스튜디오 이름
   Product Name:  게임 이름       ← 실행 파일 이름
   Version:       0.1.0
   Icon:          아이콘 이미지
   Resolution:    Fullscreen Mode, Default Resolution
```

```
   ⚠️ 빌드 결과 폴더 구조

   Build/
   ├─ RunnerGame.exe          ← 실행 파일
   ├─ UnityPlayer.dll
   ├─ RunnerGame_Data/        ← 이게 없으면 실행 안 된다
   └─ MonoBleedingEdge/

   ★ 배포할 때는 폴더 전체를 압축한다
     exe만 보내면 안 된다
```

### 3-12. 빌드에서만 생기는 문제

**왜 필요한가** — "에디터에서는 됐는데" 는 흔한 일이다.

| 문제 | 원인 | 해결 |
|---|---|---|
| 씬이 안 열림 | Build Settings 미등록 | 등록 |
| 폰트가 □□□ | TMP 폰트 애셋 누락 | 폰트 애셋 생성·연결 |
| 리소스를 못 찾음 | 절대 경로 사용 | `Resources`/`Addressables` |
| 첫 실행이 느림 | 셰이더 컴파일 | 셰이더 워밍업 |
| 해상도가 이상함 | Player Settings | Default Resolution 설정 |
| `Debug.Log`가 안 보임 | 로그 파일 | `%USERPROFILE%\AppData\LocalLow\<회사>\<제품>\Player.log` |
| 스크립트 오류로 멈춤 | Development Build 아님 | 로그 파일 확인 |

```
   ★ 빌드 로그 위치 (Windows)

   %USERPROFILE%\AppData\LocalLow\<CompanyName>\<ProductName>\Player.log

   에디터의 Console 대신 이 파일을 본다
```

```csharp
    // 빌드에서도 화면에 로그를 보고 싶다면
    void OnEnable()  { Application.logMessageReceived += HandleLog; }
    void OnDisable() { Application.logMessageReceived -= HandleLog; }

    private void HandleLog(string msg, string stack, LogType type)
    {
        if (type == LogType.Error || type == LogType.Exception)
            errorText.text += msg + "\n";
    }
```

---

## 4. 따라 만들기

### Step 1 — 씬 준비

```
   Scenes/
   ├─ Title.unity      (새로 만들기: File → New Scene → Basic URP)
   └─ Game.unity       (기존 Main.unity 이름 변경)
```

```
   File → Build Settings → Add Open Scenes
   순서:  0 = Title,  1 = Game
```

**✅ 여기까지 하면** — Scenes In Build에 2개가 등록된다.

### Step 2 — SceneLoader

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public static class SceneLoader
{
    public const string Title = "Title";
    public const string Game  = "Game";

    public static void Load(string sceneName)
    {
        Time.timeScale = 1f;                   // ★ 반드시 복구
        SceneManager.LoadScene(sceneName);
    }

    public static void Reload()
    {
        Load(SceneManager.GetActiveScene().name);
    }
}

public static class GameApp
{
    public static void Quit()
    {
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;   // ★ 에디터에서는 Play 정지
#else
        Application.Quit();
#endif
    }
}
```

```
   ★ #if UNITY_EDITOR

   에디터에서만 컴파일되는 코드
   Application.Quit()은 에디터에서 아무 일도 안 한다
```

**✅ 여기까지 하면** — 빌드된다.

### Step 3 — 타이틀 UI

```
   Title 씬에서

   Canvas 생성 (UI → Canvas)
   Canvas Scaler:  Scale With Screen Size, 1920×1080, Match 0.5

   Canvas 아래에
   ├─ TitleText (TMP)      "ENDLESS RUN"
   ├─ StartButton
   ├─ QuitButton
   └─ BestText (TMP)       "최고 기록  0 m"
```

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class TitleUI : MonoBehaviour
{
    [SerializeField] private Button startButton;
    [SerializeField] private Button quitButton;
    [SerializeField] private TextMeshProUGUI bestText;

    void Start()
    {
        startButton.onClick.AddListener(OnStart);
        quitButton.onClick.AddListener(OnQuit);

        int best = PlayerPrefs.GetInt(SaveKeys.BestDistance, 0);
        int bestCoin = PlayerPrefs.GetInt(SaveKeys.BestCoins, 0);

        bestText.text = best > 0
            ? $"최고 기록  {best:N0} m   ◆ {bestCoin}"
            : "첫 도전!";
    }

    void OnDestroy()
    {
        startButton.onClick.RemoveListener(OnStart);
        quitButton.onClick.RemoveListener(OnQuit);
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return))
            OnStart();
    }

    private void OnStart() => SceneLoader.Load(SceneLoader.Game);
    private void OnQuit()  => GameApp.Quit();
}
```

```csharp
public static class SaveKeys
{
    public const string BestDistance = "BestDistance";
    public const string BestCoins    = "BestCoins";
    public const string BestScore    = "BestScore";
    public const string BgmVolume    = "BgmVolume";
    public const string SfxVolume    = "SfxVolume";
}
```

```
   ★ 키를 상수로 모아 둔다

   문자열 오타 하나로 "저장이 안 되는" 버그가 생긴다
```

**✅ 여기까지 실행하면** — 타이틀에서 Start를 누르면 게임 씬으로 간다.

<!-- SHOT: Step 3 타이틀 -->

### Step 4 — 한글 폰트

```
   1. 한글 TTF 준비 (예: NotoSansKR-Regular.ttf)
      → Assets/Art/Fonts/ 에 넣는다

   2. Window → TextMeshPro → Font Asset Creator
      Source Font File:  NotoSansKR-Regular
      Sampling Point Size: Auto Sizing
      Atlas Resolution:  1024 × 1024
      Character Set:     Unicode Range (Hex)
      Character Sequence:
        20-7E,AC00-D7A3,3131-3163
      → Generate Font Atlas → Save

   3. TMP 텍스트의 Font Asset에 연결
```

```
   ★ Unicode 범위

   20-7E       ASCII (영문·숫자·기호)
   AC00-D7A3   한글 완성형 11,172자
   3131-3163   한글 자모
```

```
   ⚠️ 완성형 전체를 넣으면 아틀라스가 커진다

   실제로 쓰는 글자만 넣으면 훨씬 작다
   → Character Set: Characters from File 로 텍스트 파일 지정
```

**✅ 여기까지 하면** — 한글이 제대로 보인다.

### Step 5 — 게임 상태 관리

```csharp
using UnityEngine;

public enum GameState { Ready, Playing, Paused, GameOver }

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [SerializeField] private Transform player;

    public GameState State { get; private set; } = GameState.Ready;
    public int Coins { get; private set; }
    public float Distance { get; private set; }

    public int Score => Mathf.RoundToInt(Distance) + Coins * 10;

    public bool IsGameOver => State == GameState.GameOver;
    public bool IsPlaying  => State == GameState.Playing;

    public event System.Action<GameState> OnStateChanged;
    public event System.Action<int> OnCoinChanged;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;

        Time.timeScale = 1f;                   // ★ 씬 진입 시 복구
    }

    void Update()
    {
        if (State == GameState.Ready)
        {
            if (Input.anyKeyDown) SetState(GameState.Playing);
            return;
        }

        if (State == GameState.Playing)
        {
            Distance = Mathf.Max(Distance, player.position.z);

            if (Input.GetKeyDown(KeyCode.Escape)) SetState(GameState.Paused);
        }
        else if (State == GameState.Paused)
        {
            if (Input.GetKeyDown(KeyCode.Escape)) SetState(GameState.Playing);
        }
    }

    public void SetState(GameState s)
    {
        if (State == s) return;

        State = s;

        Time.timeScale = (s == GameState.Paused || s == GameState.GameOver) ? 0f : 1f;

        if (s == GameState.GameOver) SaveRecord();

        OnStateChanged?.Invoke(s);
    }

    public void AddCoin(int v)
    {
        if (State != GameState.Playing) return;

        Coins += v;
        OnCoinChanged?.Invoke(Coins);
    }

    public void GameOver() => SetState(GameState.GameOver);

    // ─── 기록 ───

    public bool IsNewRecord { get; private set; }

    private void SaveRecord()
    {
        int dist = Mathf.RoundToInt(Distance);
        int best = PlayerPrefs.GetInt(SaveKeys.BestDistance, 0);

        IsNewRecord = dist > best;

        if (IsNewRecord)
        {
            PlayerPrefs.SetInt(SaveKeys.BestDistance, dist);
            PlayerPrefs.SetInt(SaveKeys.BestCoins, Coins);
            PlayerPrefs.SetInt(SaveKeys.BestScore, Score);
            PlayerPrefs.Save();                // ★ 명시적 저장

            Debug.Log($"[기록] 신기록 {dist} m");
        }
    }
}
```

**✅ 여기까지 하면** — 상태가 관리된다.

### Step 6 — 게임 HUD

```
   Game 씬의 Canvas 아래

   ├─ HUD
   │   ├─ DistanceText (TMP)   좌상단  "거리 0 m"
   │   ├─ CoinText (TMP)       우상단  "◆ 0"
   │   └─ HintText (TMP)       우하단  "[Esc] 일시정지"
```

```csharp
using TMPro;
using UnityEngine;

public class HudUI : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI distanceText;
    [SerializeField] private TextMeshProUGUI coinText;
    [SerializeField] private GameObject readyPanel;

    private int cachedDistance = -1;

    void OnEnable()
    {
        GameManager.Instance.OnCoinChanged += HandleCoin;
        GameManager.Instance.OnStateChanged += HandleState;
    }

    void OnDisable()
    {
        if (GameManager.Instance == null) return;

        GameManager.Instance.OnCoinChanged -= HandleCoin;    // ★ 해제
        GameManager.Instance.OnStateChanged -= HandleState;
    }

    void Start()
    {
        HandleCoin(0);
        HandleState(GameManager.Instance.State);
    }

    void Update()
    {
        int d = Mathf.RoundToInt(GameManager.Instance.Distance);

        // ★ 값이 바뀔 때만 문자열 생성 (GC 절약)
        if (d != cachedDistance)
        {
            cachedDistance = d;
            distanceText.text = $"거리 {d:N0} m";
        }
    }

    private void HandleCoin(int c) => coinText.text = $"◆ {c}";

    private void HandleState(GameState s)
    {
        readyPanel.SetActive(s == GameState.Ready);
    }
}
```

```
   ★ cachedDistance 비교

   매 프레임 문자열을 만들면 초당 60개의 쓰레기
   → 값이 바뀔 때만 만든다
```

**✅ 여기까지 실행하면** — 거리와 코인이 화면에 표시된다.

<!-- SHOT: Step 6 HUD -->

### Step 7 — GC 확인

**프로파일러로 확인한다.**

```
   캐싱 없이 매 프레임 생성:  약 60 B/frame
   캐싱 후:                   0 B/frame (값이 안 바뀌는 프레임)
```

```
   ⚠️ 거리는 매 프레임 바뀐다

   정수로 반올림하면 초당 몇 번만 바뀐다
   → 대부분의 프레임에서 할당 0
```

### Step 8 — 준비 화면

```
   ReadyPanel (Panel)
   └─ ReadyText (TMP)   "아무 키나 눌러 시작"
```

```csharp
    // GameManager.Update의 Ready 분기가 이미 처리
```

**PlayerController와 TerrainGenerator가 Ready 상태에서 멈추도록 한다.**

```csharp
    void FixedUpdate()
    {
        if (!GameManager.Instance.IsPlaying) return;   // ★
        // ...
    }
```

**✅ 여기까지 실행하면** — 시작 전에 대기하고, 키를 누르면 달린다.

### Step 9 — 일시정지

```
   PausePanel
   ├─ 반투명 배경 (Image, 검정 alpha 0.7)
   ├─ PauseTitle (TMP)   "PAUSED"
   ├─ ResumeButton
   ├─ RetryButton
   └─ TitleButton
```

```csharp
using UnityEngine;
using UnityEngine.UI;

public class PauseUI : MonoBehaviour
{
    [SerializeField] private GameObject panel;
    [SerializeField] private Button resumeButton;
    [SerializeField] private Button retryButton;
    [SerializeField] private Button titleButton;

    void Start()
    {
        resumeButton.onClick.AddListener(() => GameManager.Instance.SetState(GameState.Playing));
        retryButton.onClick.AddListener(SceneLoader.Reload);
        titleButton.onClick.AddListener(() => SceneLoader.Load(SceneLoader.Title));

        panel.SetActive(false);
    }

    void OnEnable()
    {
        GameManager.Instance.OnStateChanged += HandleState;
    }

    void OnDisable()
    {
        if (GameManager.Instance != null)
            GameManager.Instance.OnStateChanged -= HandleState;
    }

    private void HandleState(GameState s)
    {
        panel.SetActive(s == GameState.Paused);
    }
}
```

**✅ 여기까지 실행하면** — Esc로 멈추고 재개된다.

**멈춘 상태에서 확인한다.**

```
   ① 캐릭터가 멈춘다             ✔
   ② 코인 회전이 멈춘다          ✔  (Time.deltaTime = 0)
   ③ 버튼은 눌린다               ✔  (UI는 timeScale과 무관)
```

### Step 10 — 게임오버 패널

```
   GameOverPanel
   ├─ 반투명 배경
   ├─ Title (TMP)         "GAME OVER"
   ├─ DistanceRow (TMP)   "거리    0 m"
   ├─ CoinRow (TMP)       "코인    0"
   ├─ ScoreRow (TMP)      "점수    0"
   ├─ RecordText (TMP)    "★ 신기록!"
   ├─ RetryButton
   └─ TitleButton
```

```csharp
using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class GameOverUI : MonoBehaviour
{
    [SerializeField] private GameObject panel;
    [SerializeField] private CanvasGroup group;
    [SerializeField] private TextMeshProUGUI distanceRow;
    [SerializeField] private TextMeshProUGUI coinRow;
    [SerializeField] private TextMeshProUGUI scoreRow;
    [SerializeField] private TextMeshProUGUI recordText;
    [SerializeField] private Button retryButton;
    [SerializeField] private Button titleButton;

    void Start()
    {
        retryButton.onClick.AddListener(SceneLoader.Reload);
        titleButton.onClick.AddListener(() => SceneLoader.Load(SceneLoader.Title));

        panel.SetActive(false);
    }

    void OnEnable()  { GameManager.Instance.OnStateChanged += HandleState; }
    void OnDisable()
    {
        if (GameManager.Instance != null)
            GameManager.Instance.OnStateChanged -= HandleState;
    }

    private void HandleState(GameState s)
    {
        if (s != GameState.GameOver) return;

        panel.SetActive(true);
        StartCoroutine(ShowSequence());
    }

    private IEnumerator ShowSequence()
    {
        GameManager gm = GameManager.Instance;

        group.alpha = 0f;
        distanceRow.text = coinRow.text = scoreRow.text = "";
        recordText.gameObject.SetActive(false);

        // ★ 페이드 인 — unscaled 사용 (timeScale = 0)
        float t = 0;
        while (t < 0.3f)
        {
            t += Time.unscaledDeltaTime;
            group.alpha = t / 0.3f;
            yield return null;
        }
        group.alpha = 1f;

        yield return new WaitForSecondsRealtime(0.15f);   // ★ Realtime

        // 숫자 카운트업
        yield return CountUp(distanceRow, "거리", Mathf.RoundToInt(gm.Distance), " m");
        yield return CountUp(coinRow,     "코인", gm.Coins, "");
        yield return CountUp(scoreRow,    "점수", gm.Score, "");

        if (gm.IsNewRecord)
        {
            recordText.gameObject.SetActive(true);
            recordText.text = "★ 신기록!";
        }
    }

    private IEnumerator CountUp(TextMeshProUGUI label, string title, int target, string suffix)
    {
        const float DURATION = 0.5f;
        float t = 0;

        while (t < DURATION)
        {
            t += Time.unscaledDeltaTime;
            int v = Mathf.RoundToInt(Mathf.Lerp(0, target, t / DURATION));
            label.text = $"{title}    {v:N0}{suffix}";
            yield return null;
        }

        label.text = $"{title}    {target:N0}{suffix}";
        yield return new WaitForSecondsRealtime(0.1f);
    }
}
```

```
   ⚠️ timeScale = 0 에서 코루틴

   yield return null                  →  진행됨 (다음 프레임)
   WaitForSeconds(t)                  →  ★ 영원히 안 끝남
   WaitForSecondsRealtime(t)          →  진행됨  ✔
   Time.deltaTime                     →  0
   Time.unscaledDeltaTime             →  정상  ✔
```

**✅ 여기까지 실행하면** — 게임오버 시 패널이 페이드 인하고 숫자가 올라간다.

<!-- SHOT: Step 10 게임오버 -->

### Step 11 — WaitForSeconds 함정 실험

**`WaitForSecondsRealtime`을 `WaitForSeconds`로 바꿔 본다.**

**✅ 이렇게 하면**

```
   패널이 나타나지만
   → 숫자가 영원히 0에서 멈춘다
   → 코루틴이 진행되지 않는다
```

> ### ★ 이것이 timeScale = 0 의 함정이다
>
> **되돌린다.**

### Step 12 — 사운드

```
   빈 오브젝트 AudioManager
   ├─ AudioSource (BGM)   Loop ✔, Play On Awake ✔
   └─ AudioSource (SFX)   Loop ✗, Play On Awake ✗
```

```csharp
using UnityEngine;

public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }

    [Header("소스")]
    [SerializeField] private AudioSource bgmSource;
    [SerializeField] private AudioSource sfxSource;

    [Header("클립")]
    [SerializeField] private AudioClip bgmClip;
    [SerializeField] private AudioClip coinClip;
    [SerializeField] private AudioClip jumpClip;
    [SerializeField] private AudioClip hitClip;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;

        float bgmVol = PlayerPrefs.GetFloat(SaveKeys.BgmVolume, 0.5f);
        float sfxVol = PlayerPrefs.GetFloat(SaveKeys.SfxVolume, 0.8f);

        bgmSource.volume = bgmVol;
        sfxSource.volume = sfxVol;

        if (bgmClip != null)
        {
            bgmSource.clip = bgmClip;
            bgmSource.loop = true;
            bgmSource.Play();
        }
    }

    public void PlayCoin() => PlaySfx(coinClip, 1.0f, 0.06f);
    public void PlayJump() => PlaySfx(jumpClip, 0.8f, 0.04f);
    public void PlayHit()  => PlaySfx(hitClip,  1.0f, 0f);

    private void PlaySfx(AudioClip clip, float vol, float pitchVar)
    {
        if (clip == null) return;

        // ★ 피치를 살짝 흔들어 단조로움 줄이기
        sfxSource.pitch = 1f + Random.Range(-pitchVar, pitchVar);
        sfxSource.PlayOneShot(clip, vol);
    }

    public void SetBgmVolume(float v)
    {
        bgmSource.volume = v;
        PlayerPrefs.SetFloat(SaveKeys.BgmVolume, v);
    }
}
```

```csharp
    // Coin.cs
    AudioManager.Instance.PlayCoin();

    // PlayerController.cs (점프 시)
    AudioManager.Instance.PlayJump();

    // Obstacle.cs
    AudioManager.Instance.PlayHit();
```

```
   ⚠️ timeScale = 0 에서 소리

   AudioSource는 timeScale과 무관하게 재생된다
   → 게임오버 효과음이 정상 재생됨  ✔

   단, pitch를 timeScale에 연동하고 싶다면 직접 설정
```

**✅ 여기까지 실행하면** — 코인·점프·충돌 소리가 난다.

### Step 13 — 난이도 곡선 마무리

```csharp
    // DifficultyManager
    [SerializeField] private AnimationCurve speedCurve
        = AnimationCurve.EaseInOut(0f, 8f, 240f, 20f);

    void Update()
    {
        if (!GameManager.Instance.IsPlaying) return;

        elapsed += Time.deltaTime;
        CurrentSpeed = speedCurve.Evaluate(elapsed);
    }
```

**Inspector에서 곡선을 조절하며 밸런싱한다.**

```
   ★ 좋은 난이도 곡선

   속도 ↑
        │              ╭─────────  최대치에서 평평
        │          ╭───╯
        │      ╭───╯
        │  ╭───╯
        │──╯
        └────────────────────────▶ 시간
        0   30  60  120  180  240

   초반: 완만 (적응 시간)
   중반: 급상승 (긴장)
   후반: 평평 (숙련도 승부)
```

**✅ 여기까지 실행하면** — 곡선대로 난이도가 오른다.

### Step 14 — 게임오버 연출

```csharp
    // Obstacle.cs
    void OnCollisionEnter(Collision col)
    {
        if (!col.gameObject.CompareTag("Player")) return;
        if (GameManager.Instance.IsGameOver) return;

        ContactPoint cp = col.contacts[0];
        if (Vector3.Dot(cp.normal, Vector3.up) > 0.6f) return;

        AudioManager.Instance.PlayHit();

        StartCoroutine(GameOverSequence());
    }

    private IEnumerator GameOverSequence()
    {
        // ★ 슬로우 모션 (Day 48의 히트스톱)
        Time.timeScale = 0.2f;

        yield return new WaitForSecondsRealtime(0.5f);

        GameManager.Instance.GameOver();       // timeScale = 0
    }
```

```
   ★ Day 48에서 만든 히트스톱

   Part 2:  m_core->SetHitStop(0.12);
   Unity:   Time.timeScale = 0.2f
```

**✅ 여기까지 실행하면** — 충돌 시 슬로우 모션 후 결과가 뜬다.

### Step 15 — 빌드

```
   Edit → Project Settings → Player
   Company Name:  (본인 이름)
   Product Name:  EndlessRun
   Version:       0.1.0
```

```
   File → Build Settings
   Platform: Windows, Mac, Linux
   Target Platform: Windows
   Architecture: x86_64
   Development Build: ✗
   → Build
   → 폴더: 프로젝트 밖에 Builds/v0.1.0/
```

```
   ⚠️ 빌드 폴더를 Assets 안에 만들지 않는다

   Unity가 애셋으로 임포트하려 한다
   → 프로젝트가 무거워진다
```

**✅ 여기까지 하면** — `EndlessRun.exe`가 생긴다.

### Step 16 — 빌드 실행 확인

**Unity를 끄고 exe를 더블클릭한다.**

```
   확인 목록
   ① 타이틀이 뜨는가
   ② Start가 되는가
   ③ 한글이 제대로 보이는가
   ④ 소리가 나는가
   ⑤ Esc 일시정지가 되는가
   ⑥ 게임오버 → 재시작이 되는가
   ⑦ 최고 기록이 저장되는가 (껐다 켜서 확인)
   ⑧ Alt+F4로 종료되는가
```

**✅ 여기까지 하면** — **혼자 실행되는 게임이 완성됐다.**

<!-- SHOT: Step 16 빌드 실행 -->

### Step 17 — 빌드 문제 해결 연습

**일부러 문제를 만들고 고쳐 본다.**

**① Build Settings에서 Title 씬을 제거하고 빌드**

```
   → 게임 씬에서 타이틀로 못 간다
   → Player.log 에 오류
```

**② TMP 폰트를 기본(LiberationSans)으로 바꾸고 빌드**

```
   → 한글이 □□□
```

```
   ★ Player.log 위치

   %USERPROFILE%\AppData\LocalLow\<회사명>\EndlessRun\Player.log

   메모장으로 열어 오류를 확인한다
```

> **되돌린다.**

### Step 18 — 문서 13 완성 점검

```
   Week 15 산출물

   ✔ 무한 러너 게임
   ✔ 타이틀 / 게임 / 결과 흐름
   ✔ 점수·거리·최고 기록
   ✔ 오브젝트 풀링 (GC 0)
   ✔ 난이도 곡선
   ✔ 사운드
   ✔ Windows 빌드
```

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────┐   ┌──────────────────────────┐
   │       ENDLESS RUN        │   │  거리 1,284 m   ◆ 62     │
   │                          │   │            ◆ ◆           │
   │      ┌────────────┐      │   │    ┌───┐         ███     │
   │      │   START    │      │→  │    │ ● │                 │
   │      └────────────┘      │   │    └───┘                 │
   │      ┌────────────┐      │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
   │      │    QUIT    │      │   │                          │
   │                          │   │                    [Esc] │
   │   최고 기록  2,431 m     │   │                          │
   └──────────────────────────┘   └──────────────────────────┘
                                              │
                                              ▼
                                  ┌──────────────────────────┐
                                  │       GAME  OVER         │
                                  │    거리    1,284 m       │
                                  │    코인       62         │
                                  │    점수    1,904         │
                                  │    ★ 신기록!             │
                                  │  [RETRY]      [TITLE]    │
                                  └──────────────────────────┘
```

- [ ] 타이틀 씬에서 Start로 게임에 진입한다
- [ ] Canvas Scaler로 창 크기를 바꿔도 UI가 유지된다
- [ ] 한글이 제대로 보인다
- [ ] 거리·코인이 실시간 표시된다
- [ ] 문자열 캐싱으로 GC 할당이 줄었다
- [ ] Ready 상태에서 대기하고 키를 누르면 시작한다
- [ ] Esc로 일시정지·재개된다
- [ ] 일시정지 중 캐릭터가 멈추고 버튼은 눌린다
- [ ] 충돌 시 슬로우 모션 후 게임오버
- [ ] 결과 패널이 페이드 인하고 숫자가 카운트업한다
- [ ] `WaitForSeconds` 함정을 확인했다
- [ ] 신기록이면 표시되고 저장된다
- [ ] 재시작·타이틀 복귀가 된다
- [ ] 코인·점프·충돌 소리가 난다
- [ ] 난이도 곡선대로 빨라진다
- [ ] **빌드한 exe가 단독 실행된다**
- [ ] 껐다 켜도 최고 기록이 남는다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 씬이 안 열림 | Build Settings 미등록 | Add Open Scenes |
| 재시작했는데 멈춰 있음 | `timeScale` 미복구 | 로드 전 `= 1f` |
| **결과 숫자가 안 오름** | `WaitForSeconds` | `WaitForSecondsRealtime` |
| UI 애니메이션이 멈춤 | `Time.deltaTime` | `unscaledDeltaTime` |
| 버튼이 안 눌림 | EventSystem 없음 | UI → EventSystem |
| 버튼이 여러 번 실행 | `AddListener` 중복 | `Start`에서 한 번 |
| 한글이 □□□ | TMP 폰트 애셋 없음 | Font Asset Creator |
| 최고 기록이 안 남음 | `PlayerPrefs.Save()` 누락 | 호출 추가 |
| 창 크기 바꾸면 UI 깨짐 | Canvas Scaler | Scale With Screen Size |
| 소리가 안 남 | AudioListener 없음 | 카메라에 추가 |
| AudioListener 경고 | 2개 이상 | 하나만 |
| 이벤트 예외 | 구독 해제 누락 | `OnDisable`에서 `-=` |
| 빌드 exe 실행 안 됨 | `_Data` 폴더 없음 | 폴더 전체 배포 |
| 빌드에서만 오류 | 로그 못 봄 | `Player.log` 확인 |
| 매 프레임 GC | 문자열 생성 | 값 변경 시에만 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **Canvas** | UI를 그리는 판. Overlay 모드 |
| **Canvas Scaler** | Scale With Screen Size + Reference Resolution |
| **TextMeshPro** | SDF 기반. 한글은 폰트 애셋 생성 필요 |
| Button | `onClick.AddListener`. 코드 연결 권장 |
| **PlayerPrefs** | 간단한 키-값 저장. 암호화 없음 |
| **`Time.timeScale`** | 0 = 정지. `unscaledDeltaTime`으로 UI 유지 |
| `WaitForSecondsRealtime` | timeScale 0에서도 진행 |
| 씬 전환 | `SceneManager.LoadScene`. Build Settings 필수 |
| 씬 간 데이터 | static / `DontDestroyOnLoad` / 같은 씬 |
| C# 이벤트 | `+=` 구독, **`-=` 해제 필수** |
| AudioSource | `Play` vs **`PlayOneShot`** |
| `AnimationCurve` | Inspector에서 난이도 밸런싱 |
| 빌드 | `_Data` 폴더 포함 배포. `Player.log` 확인 |

### Week 15 정리 — 런닝 게임

| Day | 만든 것 | Part 2 대응 |
|:--:|---|---|
| Day 71 | 씬·GameObject·Component | 상속 → 조합 |
| Day 72 | MonoBehaviour 생명주기 | `Core::Update` |
| Day 73 | Rigidbody·Collider·Trigger | AABB 충돌 |
| Day 74 | 프리팹·오브젝트 풀 | Day 51~52 |
| **Day 75** | **UI·게임오버·빌드** | Day 26 파일 I/O |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 76** | UGUI 본격 — 앵커·피벗·레이아웃 |
| Day 79 | ScriptableObject·JSON 저장 |
| Day 96 | 빌드 자동화·버전 관리 |
| Day 101+ | 파이널 프로젝트의 기본 흐름 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 설정 화면 (BGM/SFX 슬라이더) | `Slider.onValueChanged` |
| ★★ | 슬라이딩 동작 추가 | Collider 높이 변경 + 애니메이션 |
| ★★ | 파워업 (일정 시간 무적) | 코루틴 + 레이어 변경 |
| ★★★ | 3레인 이동 (좌우 스와이프/키) | 목표 x를 `Mathf.Lerp`로 |
| ★★★ | 로딩 화면 (비동기 씬 로드) | `LoadSceneAsync` + 진행률 |
| ★★★★ | 랭킹 5위까지 저장·표시 | JSON 직렬화 (Day 79 선행) |

### 다음 시간

> 러너 게임이 완성됐다. 그런데 **UI는 텍스트 몇 개가 전부다.**
>
> ```
>   지금까지의 UI

>   × 앵커를 몰라 해상도가 바뀌면 어긋난다
>   × 목록을 만들려면 하나씩 배치해야 한다
>   × 데이터가 바뀌면 UI를 수동으로 갱신한다
> ```
>
> 다음 주는 **UI 자체가 게임인 장르**로 간다.
> 카드가 곧 UI이고, 손패가 곧 레이아웃이다.
>
> → **Day 76, Canvas와 RectTransform**
