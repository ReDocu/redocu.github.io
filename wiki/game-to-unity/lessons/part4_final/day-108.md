# Day 108 · UI 전체 연결

> **Week 22 · 알파** — "다 되나?"
> 선수: Day 107 (서브 시스템), Day 076~077 (UGUI), Day 075 (씬 전환)

---

## 1. 오늘의 목표

**타이틀부터 결과까지 화면 흐름이 끊기지 않는다.** 마우스만으로 한 판을 마칠 수 있다.

```
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
   │   ONE  FLOOR     │   │ 층 3/6  ⚔ 장검   │   │    GAME OVER     │
   │                  │   │ HP ████████░ 72  │   │                  │
   │   [  시작  ]     │──▶│ 💰 245   적 4    │──▶│  도달 층   3/6   │
   │   [  설정  ]     │   │                  │   │  처치      18    │
   │   [  종료  ]     │   │      ▲           │   │  시간    2:47    │
   │                  │   │     ╱█╲ ▣ ▣      │   │  골드     245    │
   │  최고 기록 5층   │   │  ▓▓▓▓▓▓▓▓▓▓▓▓    │   │                  │
   └──────────────────┘   └────────┬─────────┘   │ [재시작] [타이틀] │
                                    │ Esc         └──────────────────┘
                          ┌─────────▼────────┐
                          │    일시정지      │
                          │   [  계속  ]     │
                          │   [  설정  ]     │
                          │   [ 타이틀 ]     │
                          └──────────────────┘
```

<!-- SHOT: Day 108 화면 흐름 -->

---

## 2. 오늘이 중요한 이유

```
   ★ 지금까지의 UI

   OnGUI로 임시 표시
   → 프로토타입에는 충분했다
   → 하지만 게임이 아니다
```

```
   ★ Day 110 알파의 조건

   "타이틀 → 인게임 → 결과 → 타이틀 흐름이 완결되는가"
   → 오늘 만든다
```

```
   ⚠️ UI를 마지막에 미루면

   ① 시스템과 안 맞는 것을 뒤늦게 발견
   ② 씬 전환 시 데이터 소실
   ③ 해상도 문제
   → 3주차에 큰 작업이 된다
```

```
   ★ 오늘의 검증

   "키보드를 안 쓰고 마우스만으로
    타이틀에서 시작해 한 판을 마치고 돌아올 수 있는가?"
```

---

## 3. 개념

### 3-1. 화면 흐름 설계

**왜 필요한가** — 빠진 경로를 찾는다.

```
   ┌──────────┐
   │  Title   │◀──────────────────────┐
   └────┬─────┘                       │
        │ 시작                         │ 타이틀로
        ▼                             │
   ┌──────────┐   Esc    ┌──────────┐ │
   │  Game    │◀────────▶│  Pause   │─┤
   └────┬─────┘   계속    └────┬─────┘ │
        │                      │ 재시작 │
        │ 승/패                 │       │
        ▼                      ▼       │
   ┌──────────┐          ┌──────────┐ │
   │  Result  │─────────▶│  Game    │ │
   └────┬─────┘  재시작   └──────────┘ │
        │                              │
        └──────────────────────────────┘
```

```
   ★ 확인할 것

   [ ] 모든 화면에서 나가는 경로가 있나
   [ ] 막다른 화면이 없나
   [ ] 종료 경로가 있나
```

```
   ⚠️ 흔한 누락

   ① 설정에서 돌아가는 버튼 없음
   ② 결과 화면에서 타이틀로 못 감
   ③ 일시정지에서 종료 못 함
```

### 3-2. 단일 씬 vs 다중 씬

**왜 필요한가** — 구조를 정한다.

| | 단일 씬 | 다중 씬 |
|---|---|---|
| 화면 전환 | 패널 활성/비활성 | `LoadScene` |
| 데이터 전달 | **불필요** ★ | static / DontDestroyOnLoad |
| 로딩 | 없음 | 있음 |
| 메모리 | 전부 로드 | 필요한 것만 |
| 씬 충돌 | 한 파일 | 분산 ★ |
| 재시작 | 수동 초기화 | 씬 재로드 ★ |

```
   ★ 4주 프로젝트 권장

   Title.unity  +  Game.unity  (2개)

   → 타이틀은 가볍고, 게임 씬 재로드로 확실한 초기화
   → 데이터 전달은 static 하나로 충분
```

```
   ★ 단일 씬이 나은 경우

   ① 로딩이 거슬릴 만큼 게임이 짧다
   ② 씬 전환 연출을 정교하게 하고 싶다
```

```csharp
    // 씬 간 데이터 전달 (Day 75)
    public static class GameResult
    {
        public static int ReachedFloor;
        public static int TotalKills;
        public static float PlayTime;
        public static int Gold;
        public static bool IsWin;

        public static void Clear()
        {
            ReachedFloor = 0; TotalKills = 0;
            PlayTime = 0; Gold = 0; IsWin = false;
        }
    }
```

```
   ⚠️ static은 씬 재로드로 초기화되지 않는다

   → 게임 시작 시 명시적으로 Clear()
```

### 3-3. 패널 관리

**왜 필요한가** — 여러 패널이 겹치면 꼬인다.

```csharp
namespace OneFloor.UI
{
    public enum UIScreen { None, Title, HUD, Pause, Result, Settings, WeaponChoice }

    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [SerializeField] private UIPanel titlePanel;
        [SerializeField] private UIPanel hudPanel;
        [SerializeField] private UIPanel pausePanel;
        [SerializeField] private UIPanel resultPanel;
        [SerializeField] private UIPanel settingsPanel;
        [SerializeField] private UIPanel weaponChoicePanel;

        private readonly Dictionary<UIScreen, UIPanel> panels = new();
        private readonly Stack<UIScreen> history = new();

        public UIScreen Current { get; private set; } = UIScreen.None;

        private void Awake()
        {
            Instance = this;

            panels[UIScreen.Title] = titlePanel;
            panels[UIScreen.HUD] = hudPanel;
            panels[UIScreen.Pause] = pausePanel;
            panels[UIScreen.Result] = resultPanel;
            panels[UIScreen.Settings] = settingsPanel;
            panels[UIScreen.WeaponChoice] = weaponChoicePanel;

            foreach (var p in panels.Values) p?.HideImmediate();
        }

        public void Show(UIScreen screen, bool pushHistory = true)
        {
            if (Current == screen) return;

            if (pushHistory && Current != UIScreen.None) history.Push(Current);

            if (panels.TryGetValue(Current, out UIPanel prev)) prev?.Hide();
            if (panels.TryGetValue(screen, out UIPanel next)) next?.Show();

            Current = screen;
        }

        public void Back()
        {
            if (history.Count == 0) return;

            UIScreen prev = history.Pop();
            Show(prev, false);
        }
    }
}
```

```
   ★ 히스토리 스택

   설정 → 뒤로 → 이전 화면
   → 어디서 왔든 돌아간다
```

```
   ⚠️ HUD는 예외

   인게임에서 HUD는 항상 보인다
   → 별도로 관리하거나 Pause와 겹쳐도 되게
```

### 3-4. 패널 컴포넌트

**왜 필요한가** — 페이드 등 공통 동작.

```csharp
namespace OneFloor.UI
{
    [RequireComponent(typeof(CanvasGroup))]
    public class UIPanel : MonoBehaviour
    {
        [SerializeField] private float fadeDuration = 0.18f;
        [SerializeField] private bool blockRaycastWhenHidden = false;
        [SerializeField] private Selectable firstSelected;

        private CanvasGroup group;
        private Coroutine routine;

        public bool IsVisible { get; private set; }

        private void Awake()
        {
            group = GetComponent<CanvasGroup>();
        }

        public void Show()
        {
            gameObject.SetActive(true);
            IsVisible = true;

            if (routine != null) StopCoroutine(routine);
            routine = StartCoroutine(FadeRoutine(1f, true));

            // ★ 게임패드/키보드 대응
            if (firstSelected != null)
                EventSystem.current?.SetSelectedGameObject(firstSelected.gameObject);
        }

        public void Hide()
        {
            IsVisible = false;

            if (routine != null) StopCoroutine(routine);
            routine = StartCoroutine(FadeRoutine(0f, false));
        }

        public void HideImmediate()
        {
            IsVisible = false;
            group.alpha = 0f;
            group.interactable = false;
            group.blocksRaycasts = blockRaycastWhenHidden;
            gameObject.SetActive(false);
        }

        private IEnumerator FadeRoutine(float target, bool interactable)
        {
            group.interactable = interactable;
            group.blocksRaycasts = interactable || blockRaycastWhenHidden;

            float start = group.alpha;
            float t = 0;

            while (t < fadeDuration)
            {
                t += Time.unscaledDeltaTime;   // ★ timeScale 0 대응
                group.alpha = Mathf.Lerp(start, target, t / fadeDuration);
                yield return null;
            }

            group.alpha = target;

            if (target <= 0.01f) gameObject.SetActive(false);

            routine = null;
        }
    }
}
```

```
   ★ unscaledDeltaTime을 쓰는 이유

   일시정지·결과 화면은 timeScale = 0
   → Day 75의 함정
```

```
   ★ CanvasGroup

   alpha / interactable / blocksRaycasts를 한 번에 (Day 80)
```

### 3-5. HUD 구성

**왜 필요한가** — 핵심 수치가 전부 보여야 한다.

```
   ★ 필수 정보

   ① 플레이어 HP
   ② 진행 상태 (층 3/6)
   ③ 자원 (골드)
   ④ 현재 상태 (무기)
   ⑤ 남은 목표 (적 4)
```

```
   ★ 배치 원칙

   좌상단:  플레이어 정보 (HP)       ← 시선이 먼저 가는 곳
   우상단:  자원·진행
   좌하단:  현재 무기·스킬
   우하단:  보조 정보
   중앙:    비운다  ★ 플레이 영역
```

```
   ⚠️ 중앙에 UI를 두지 않는다

   플레이를 가린다
```

```csharp
namespace OneFloor.UI
{
    public class HudUI : MonoBehaviour
    {
        [Header("HP")]
        [SerializeField] private Image hpFill;
        [SerializeField] private Image hpDelayed;
        [SerializeField] private TextMeshProUGUI hpText;

        [Header("진행")]
        [SerializeField] private TextMeshProUGUI floorText;
        [SerializeField] private TextMeshProUGUI enemyText;

        [Header("자원")]
        [SerializeField] private TextMeshProUGUI goldText;

        [Header("무기")]
        [SerializeField] private Image weaponIcon;
        [SerializeField] private TextMeshProUGUI weaponNameText;

        // ★ 캐싱 (Day 89)
        private int cachedHp = -1, cachedGold = -1, cachedEnemies = -1;

        private void OnEnable()
        {
            playerHealth.OnHpChanged += HandleHp;
            gameManager.OnGoldChanged += HandleGold;
            weaponHolder.OnWeaponChanged += HandleWeapon;
            floorManager.OnFloorStarted += HandleFloor;
        }

        private void OnDisable()
        {
            playerHealth.OnHpChanged -= HandleHp;
            gameManager.OnGoldChanged -= HandleGold;
            weaponHolder.OnWeaponChanged -= HandleWeapon;
            floorManager.OnFloorStarted -= HandleFloor;
        }

        private void Update()
        {
            // ★ 이벤트가 없는 값만 폴링
            int alive = floorManager.AliveCount;

            if (alive != cachedEnemies)
            {
                cachedEnemies = alive;
                enemyText.text = $"적 {alive}";
            }
        }

        private void HandleHp(int cur, int max)
        {
            hpFill.fillAmount = max > 0 ? (float)cur / max : 0f;

            if (cur != cachedHp)
            {
                cachedHp = cur;
                hpText.text = $"{cur} / {max}";
            }

            // 지연 게이지 (Day 48·76)
            if (hpDelayed.fillAmount < hpFill.fillAmount)
                hpDelayed.fillAmount = hpFill.fillAmount;
            else
                delayTimer = 0.4f;
        }
    }
}
```

```
   ★ 이벤트 + 캐싱

   ① 값이 바뀔 때만 갱신 (이벤트)
   ② 문자열은 변경 시에만 (캐싱)
   → GC 0
```

### 3-6. 지연 HP 게이지

**왜 필요한가** — Day 48·76의 재사용.

```csharp
    [SerializeField] private float delaySpeed = 0.4f;
    private float delayTimer;

    private void Update()
    {
        if (delayTimer > 0) { delayTimer -= Time.deltaTime; return; }

        if (hpDelayed.fillAmount > hpFill.fillAmount)
        {
            hpDelayed.fillAmount = Mathf.MoveTowards(
                hpDelayed.fillAmount, hpFill.fillAmount, delaySpeed * Time.deltaTime);
        }
    }
```

```
   ★ 효과

   피해량이 빨간 잔상으로 보인다
   → "얼마나 아팠는지"가 전달된다
```

### 3-7. 화면 전환 (페이드)

**왜 필요한가** — 뚝 끊기지 않게.

```csharp
namespace OneFloor.UI
{
    public class ScreenFader : MonoBehaviour
    {
        public static ScreenFader Instance { get; private set; }

        [SerializeField] private CanvasGroup group;
        [SerializeField] private float defaultDuration = 0.35f;

        private void Awake()
        {
            Instance = this;
            group.alpha = 0f;
            group.blocksRaycasts = false;
        }

        public IEnumerator FadeOut(float duration = -1f)
        {
            yield return Fade(1f, duration < 0 ? defaultDuration : duration);
            group.blocksRaycasts = true;
        }

        public IEnumerator FadeIn(float duration = -1f)
        {
            group.blocksRaycasts = false;
            yield return Fade(0f, duration < 0 ? defaultDuration : duration);
        }

        private IEnumerator Fade(float target, float duration)
        {
            float start = group.alpha;
            float t = 0;

            while (t < duration)
            {
                t += Time.unscaledDeltaTime;
                group.alpha = Mathf.Lerp(start, target, t / duration);
                yield return null;
            }

            group.alpha = target;
        }
    }
}
```

```csharp
    // 씬 전환에 사용
    public static IEnumerator LoadSceneWithFade(string sceneName)
    {
        yield return ScreenFader.Instance.FadeOut();

        Time.timeScale = 1f;                   // ★ Day 75

        AsyncOperation op = SceneManager.LoadSceneAsync(sceneName);
        while (!op.isDone) yield return null;

        yield return ScreenFader.Instance.FadeIn();
    }
```

```
   ★ 페이드 오브젝트는 DontDestroyOnLoad

   씬이 바뀌어도 유지되어야 한다
```

```csharp
    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }

        Instance = this;
        DontDestroyOnLoad(transform.root.gameObject);
    }
```

### 3-8. 설정 화면

**왜 필요한가** — 최소한의 접근성.

```
   ★ 4주 프로젝트의 최소 설정

   ① BGM 볼륨
   ② 효과음 볼륨
   ③ 마우스 감도
   ④ 조작 안내
   ⑤ (선택) 화면 흔들림 강도
```

```csharp
namespace OneFloor.UI
{
    public class SettingsUI : MonoBehaviour
    {
        [SerializeField] private Slider bgmSlider;
        [SerializeField] private Slider sfxSlider;
        [SerializeField] private Slider sensitivitySlider;
        [SerializeField] private Toggle screenShakeToggle;
        [SerializeField] private Button backButton;

        private void Start()
        {
            // ★ 저장된 값 로드 (Day 75)
            bgmSlider.value = PlayerPrefs.GetFloat(SaveKeys.BgmVolume, 0.5f);
            sfxSlider.value = PlayerPrefs.GetFloat(SaveKeys.SfxVolume, 0.8f);
            sensitivitySlider.value = PlayerPrefs.GetFloat(SaveKeys.Sensitivity, 1f);
            screenShakeToggle.isOn = PlayerPrefs.GetInt(SaveKeys.ScreenShake, 1) == 1;

            bgmSlider.onValueChanged.AddListener(OnBgmChanged);
            sfxSlider.onValueChanged.AddListener(OnSfxChanged);
            sensitivitySlider.onValueChanged.AddListener(OnSensitivityChanged);
            screenShakeToggle.onValueChanged.AddListener(OnShakeChanged);
            backButton.onClick.AddListener(() => UIManager.Instance.Back());
        }

        private void OnBgmChanged(float v)
        {
            AudioManager.Instance.SetBgmVolume(v);
            PlayerPrefs.SetFloat(SaveKeys.BgmVolume, v);
        }

        // ...

        private void OnDisable() => PlayerPrefs.Save();
    }
}
```

```
   ★ 접근성 고려 (Day 95)

   화면 흔들림은 끌 수 있게
   → 멀미를 유발할 수 있다
```

### 3-9. 조작 안내

**왜 필요한가** — Day 113의 준비.

```
   ★ 최소한: 타이틀에 조작표

   WASD    이동
   마우스  시점
   좌클릭  공격
   Space   회피
   Esc     일시정지
```

```
   ★ 더 나은 방법 (Day 113)

   필요한 순간에 한 줄씩
   "Space로 회피"  ← 처음 적을 만났을 때
```

```
   ★ 오늘은 정적 표시로 충분
```

### 3-10. 해상도 대응

**왜 필요한가** — Day 76의 앵커·Canvas Scaler.

```
   Canvas Scaler
   UI Scale Mode: Scale With Screen Size
   Reference Resolution: 1920 × 1080
   Match: 0.5
```

```
   ★ 앵커 배치 (Day 76)

   HP 바:     좌상단 앵커
   골드:      우상단 앵커
   무기:      좌하단 앵커
   버튼:      중앙 앵커
   배경:      전체 stretch
```

```
   ★ 테스트할 해상도

   1920×1080  (기준)
   1280×720   (작은 16:9)
   2560×1080  (울트라와이드)
   1366×768   (노트북)
```

```
   ⚠️ 울트라와이드에서 확인할 것

   중앙 요소가 너무 멀어지지 않는지
   → Content의 최대 폭을 제한
```

### 3-11. 마우스 전용 조작 검증

**왜 필요한가** — 오늘의 핵심 검증.

```
   ★ 검증 절차

   ① 키보드에서 손을 뗀다
   ② 마우스만으로 타이틀 → 시작
   ③ (게임 중에는 키보드 필요 — 예외)
   ④ 일시정지는? → Esc가 필요하다면 UI 버튼도 제공
   ⑤ 결과 → 재시작 → 타이틀
```

```
   ★ 인게임 조작은 예외

   게임 자체는 WASD가 필요하다
   → 하지만 "화면 흐름"은 마우스만으로
```

```
   ★ 추가할 것

   인게임에 일시정지 버튼 (우상단)
   → Esc를 모르는 사람도 나갈 수 있다
```

### 3-12. UI 성능

**왜 필요한가** — Day 76·89의 교훈.

```
   ★ 체크리스트

   [ ] Raycast Target을 불필요한 곳에서 껐나
   [ ] 매 프레임 문자열을 만들지 않나
   [ ] Canvas를 정적/동적으로 나눴나
   [ ] Layout Group 안에서 매 프레임 크기를 바꾸지 않나
   [ ] Mask 대신 RectMask2D를 쓰나
```

```
   ★ Canvas 분리

   Canvas_Static   배경, 프레임      Sort Order 0
   Canvas_HUD      HP, 골드, 무기    Sort Order 1
   Canvas_Popup    일시정지, 결과    Sort Order 10
   Canvas_Fade     페이드            Sort Order 100
```

```
   ⚠️ 너무 잘게 나누면 드로우 콜이 는다

   3~5개가 적당
```

---

## 4. 진행 순서

### Step 1 — 화면 흐름 그리기

3-1절의 다이어그램을 팀이 함께 그린다.

```
   ★ 확인

   [ ] 모든 화면에 나가는 경로가 있다
   [ ] 막다른 화면이 없다
   [ ] 종료 경로가 있다
```

**✅ 여기까지 하면** — 빠진 경로 발견.

### Step 2 — 씬 구조 결정

```
   ★ 우리 게임: 2씬

   Title.unity   타이틀 + 설정
   Game.unity    인게임 + 일시정지 + 결과
```

```
   Build Settings
   0: Title
   1: Game
```

**✅ 여기까지 하면** — 구조 확정.

### Step 3 — GameResult (데이터 전달)

3-2절의 static 클래스를 만든다.

```csharp
    // 게임 시작 시
    GameResult.Clear();

    // 게임 종료 시
    GameResult.ReachedFloor = floorManager.CurrentFloorIndex + 1;
    GameResult.TotalKills = totalKills;
    GameResult.PlayTime = playTime;
    GameResult.Gold = Gold;
    GameResult.IsWin = win;
```

**✅ 여기까지 하면** — 데이터 전달 준비.

### Step 4 — UIPanel

3-4절의 코드를 만든다.

```
   각 패널 오브젝트에
   ① CanvasGroup 추가
   ② UIPanel 추가
```

**✅ 여기까지 하면** — 공통 동작.

### Step 5 — UIManager

3-3절의 코드를 만든다.

**✅ 여기까지 하면** — 패널 관리.

### Step 6 — 타이틀 화면

```
   Title.unity

   Canvas
   └─ TitlePanel
       ├─ Background (전체 stretch)
       ├─ LogoText (중앙 상단)   "ONE FLOOR"
       ├─ ButtonGroup (중앙, Vertical Layout Group)
       │   ├─ StartButton
       │   ├─ SettingsButton
       │   └─ QuitButton
       ├─ BestRecordText (하단)
       └─ ControlsPanel (우하단, 조작 안내)
   └─ SettingsPanel (비활성)
```

```csharp
namespace OneFloor.UI
{
    public class TitleUI : MonoBehaviour
    {
        [SerializeField] private Button startButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button quitButton;
        [SerializeField] private TextMeshProUGUI bestRecordText;

        private void Start()
        {
            startButton.onClick.AddListener(OnStart);
            settingsButton.onClick.AddListener(
                () => UIManager.Instance.Show(UIScreen.Settings));
            quitButton.onClick.AddListener(GameApp.Quit);

            int best = PlayerPrefs.GetInt(SaveKeys.BestFloor, 0);
            bestRecordText.text = best > 0 ? $"최고 기록  {best}층" : "첫 도전";

            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }

        private void OnStart()
        {
            StartCoroutine(SceneLoader.LoadSceneWithFade("Game"));
        }
    }
}
```

**✅ 여기까지 실행하면** — 타이틀에서 게임으로.

<!-- SHOT: Step 6 타이틀 -->

### Step 7 — HUD

3-5절의 코드를 만든다.

```
   Canvas_HUD
   ├─ TopLeft (앵커 좌상단)
   │   ├─ HpBarBg
   │   │   ├─ HpDelayed (Filled, 빨강)
   │   │   ├─ HpFill (Filled, 초록)
   │   │   └─ HpText
   ├─ TopRight (앵커 우상단)
   │   ├─ FloorText     "층 3/6"
   │   ├─ GoldText      "💰 245"
   │   └─ EnemyText     "적 4"
   ├─ BottomLeft (앵커 좌하단)
   │   ├─ WeaponIcon
   │   └─ WeaponNameText
   └─ TopRightCorner
       └─ PauseButton   ★ 마우스 전용 대응
```

**✅ 여기까지 실행하면** — 상태가 보인다.

<!-- SHOT: Step 7 HUD -->

### Step 8 — 지연 게이지

3-6절의 코드를 구현한다.

**적에게 맞아 본다.**

```
   ★ 확인

   빨간 잔상이 남았다가 서서히 줄어든다
```

**✅ 여기까지 하면** — 타격 전달.

### Step 9 — GC 확인

```
   Profiler → CPU Usage → GC Alloc 정렬
```

```
   ★ HudUI.Update의 GC가 0에 가까운가

   아니라면 문자열 캐싱 확인 (Day 89)
```

**✅ 여기까지 하면** — 성능 확보.

### Step 10 — 일시정지

```
   Canvas_Popup
   └─ PausePanel
       ├─ Background (반투명 검정, 전체 stretch)
       ├─ TitleText  "일시정지"
       └─ ButtonGroup
           ├─ ResumeButton
           ├─ SettingsButton
           ├─ RestartButton
           └─ TitleButton
```

```csharp
    private void Start()
    {
        resumeButton.onClick.AddListener(
            () => GameManager.Instance.SetState(GameState.Playing));

        settingsButton.onClick.AddListener(
            () => UIManager.Instance.Show(UIScreen.Settings));

        restartButton.onClick.AddListener(
            () => StartCoroutine(SceneLoader.ReloadWithFade()));

        titleButton.onClick.AddListener(
            () => StartCoroutine(SceneLoader.LoadSceneWithFade("Title")));
    }
```

```csharp
    // GameManager
    private void HandleStateChanged(GameState s)
    {
        switch (s)
        {
        case GameState.Playing:
            UIManager.Instance.Show(UIScreen.HUD, false);
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            break;

        case GameState.Paused:
            UIManager.Instance.Show(UIScreen.Pause);
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
            break;

        case GameState.Result:
            UIManager.Instance.Show(UIScreen.Result);
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
            break;
        }
    }
```

```
   ★ 커서 잠금 전환

   인게임: 잠금 (시점 회전)
   UI:     해제 (클릭)
```

**✅ 여기까지 실행하면** — Esc 또는 버튼으로 일시정지.

### Step 11 — 결과 화면

```
   Canvas_Popup
   └─ ResultPanel
       ├─ Background
       ├─ TitleText     "GAME OVER" / "CLEAR!"
       ├─ StatsGroup (Vertical Layout Group)
       │   ├─ FloorRow    "도달 층   3 / 6"
       │   ├─ KillRow     "처치      18"
       │   ├─ TimeRow     "시간    2:47"
       │   └─ GoldRow     "골드     245"
       ├─ NewRecordText  "★ 신기록!"
       └─ ButtonGroup
           ├─ RestartButton
           └─ TitleButton
```

```csharp
namespace OneFloor.UI
{
    public class ResultUI : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI floorText;
        [SerializeField] private TextMeshProUGUI killText;
        [SerializeField] private TextMeshProUGUI timeText;
        [SerializeField] private TextMeshProUGUI goldText;
        [SerializeField] private GameObject newRecordObject;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button titleButton;

        private void Start()
        {
            restartButton.onClick.AddListener(
                () => StartCoroutine(SceneLoader.ReloadWithFade()));

            titleButton.onClick.AddListener(
                () => StartCoroutine(SceneLoader.LoadSceneWithFade("Title")));
        }

        public void Show(bool win, int floor, int kills, float time, int gold)
        {
            titleText.text = win ? "CLEAR!" : "GAME OVER";
            titleText.color = win ? new Color(1f, 0.85f, 0.3f)
                                  : new Color(0.9f, 0.35f, 0.35f);

            StartCoroutine(ShowSequence(floor, kills, time, gold));

            // ★ 기록 저장 (Day 75)
            int best = PlayerPrefs.GetInt(SaveKeys.BestFloor, 0);

            if (floor > best)
            {
                PlayerPrefs.SetInt(SaveKeys.BestFloor, floor);
                PlayerPrefs.Save();
                newRecordObject.SetActive(true);
            }
            else
            {
                newRecordObject.SetActive(false);
            }
        }

        private IEnumerator ShowSequence(int floor, int kills, float time, int gold)
        {
            floorText.text = killText.text = timeText.text = goldText.text = "";

            yield return new WaitForSecondsRealtime(0.3f);   // ★ Day 75

            yield return CountUp(floorText, "도달 층", floor, $" / {totalFloors}");
            yield return CountUp(killText,  "처치",    kills, "");
            timeText.text = $"시간      {FormatTime(time)}";
            yield return new WaitForSecondsRealtime(0.1f);
            yield return CountUp(goldText,  "골드",    gold, "");
        }
    }
}
```

```
   ★ 카운트업 연출 (Day 75)

   숫자가 올라가면 성취감이 있다
```

**✅ 여기까지 실행하면** — 결과 화면.

<!-- SHOT: Step 11 결과 화면 -->

### Step 12 — WaitForSeconds 함정 확인

**`WaitForSecondsRealtime`을 `WaitForSeconds`로 바꿔 본다.**

```
   ★ 결과 화면에서 숫자가 영원히 0
   → timeScale = 0이므로
```

> ### ★ Day 75에서 배운 함정
>
> **되돌린다.**

### Step 13 — 페이드

3-7절의 `ScreenFader`를 만든다.

```
   Canvas_Fade (Sort Order 100)
   └─ FadeImage (검정, 전체 stretch)

   ★ DontDestroyOnLoad
```

**씬 전환을 확인한다.**

**✅ 여기까지 하면** — 부드러운 전환.

### Step 14 — 설정 화면

3-8절의 코드를 만든다.

```
   SettingsPanel
   ├─ TitleText
   ├─ BgmRow    (Label + Slider)
   ├─ SfxRow
   ├─ SensitivityRow
   ├─ ShakeRow  (Label + Toggle)
   └─ BackButton
```

```
   ★ 타이틀과 일시정지 양쪽에서 열린다
   → UIManager.Back()으로 돌아간다
```

**✅ 여기까지 실행하면** — 설정 저장·복원.

### Step 15 — 조작 안내

```
   TitlePanel/ControlsPanel

   WASD    이동
   마우스  시점
   좌클릭  공격
   Space   회피
   Esc     일시정지
```

```
   ★ 인게임에도 작게

   우하단에 "[Esc] 메뉴"
```

**✅ 여기까지 하면** — 최소 안내.

### Step 16 — 마우스 전용 검증

```
   ★ 절차

   ① 키보드에서 손을 뗀다
   ② 타이틀 → 시작 버튼
   ③ (게임 플레이는 키보드 사용)
   ④ 우상단 일시정지 버튼
   ⑤ 타이틀 버튼
   ⑥ 종료 버튼
```

```
   ★ 확인

   [ ] 모든 화면 전환이 마우스로 가능한가
   [ ] 막히는 곳이 없는가
```

```
   ⚠️ 인게임 일시정지 버튼이 없으면

   Esc를 모르는 사람은 못 나간다
   → 추가한다
```

**✅ 여기까지 하면** — 흐름 완결.

### Step 17 — 해상도 테스트

**4가지 해상도에서 확인한다.**

```
   1920×1080  기준
   1280×720   축소
   2560×1080  울트라와이드
   1366×768   노트북
```

```
   ★ 확인

   [ ] HP 바가 좌상단에 붙어 있나
   [ ] 골드가 우상단에 있나
   [ ] 버튼이 중앙에 있나
   [ ] 텍스트가 잘리지 않나
   [ ] 울트라와이드에서 요소가 너무 멀지 않나
```

**✅ 여기까지 하면** — 해상도 대응.

<!-- SHOT: Step 17 해상도 비교 -->

### Step 18 — Canvas 분리와 성능

3-12절의 체크리스트를 확인한다.

```
   ★ Raycast Target 정리

   모든 TMP 텍스트 → 해제
   장식 Image → 해제
   버튼·드래그 대상 → 유지
```

```
   Stats 창에서 Batches 확인
```

**✅ 여기까지 하면** — 성능 확보.

### Step 19 — 전체 흐름 테스트

```
   ★ 5회 반복

   타이틀 → 시작 → 플레이 → 일시정지 → 계속
        → 승리 → 결과 → 재시작 → 패배 → 결과 → 타이틀 → 종료
```

```
   ★ 확인

   [ ] 어디서도 막히지 않는다
   [ ] 데이터가 정확히 전달된다
   [ ] 재시작 후 초기화된다
   [ ] 최고 기록이 저장된다
   [ ] 커서 상태가 맞다
```

**✅ 여기까지 하면** — 흐름 완결.

### Step 20 — 커밋과 기록

```bash
   git add .
   git commit -m "feat: UIManager, 패널 시스템, 페이드"
   git commit -m "feat: 타이틀/HUD/일시정지/결과/설정 화면"
   git commit -m "feat: 해상도 대응, 마우스 전용 흐름"
   git push
```

```markdown
| 108 | UI 전체 연결 | 5개 화면 + 페이드 + 해상도 대응 | ✔ | ✔ | 마우스 전용 흐름 확인 |
```

---

## 5. 완료 확인

```
   ┌────────────────────────────────────────────────────────┐
   │  === Day 108 완료 ===                                   │
   │                                                        │
   │  화면 (5개)                                             │
   │    ✔ 타이틀 (시작/설정/종료 + 최고 기록)                │
   │    ✔ HUD (HP/층/골드/무기/적)                           │
   │    ✔ 일시정지 (계속/설정/재시작/타이틀)                 │
   │    ✔ 결과 (수치 카운트업 + 신기록)                      │
   │    ✔ 설정 (BGM/SFX/감도/흔들림)                         │
   │                                                        │
   │  구조                                                   │
   │    ✔ UIManager + 히스토리 스택                          │
   │    ✔ UIPanel (페이드, unscaledDeltaTime)                │
   │    ✔ ScreenFader (씬 전환)                              │
   │    ✔ GameResult (씬 간 데이터)                          │
   │                                                        │
   │  검증                                                   │
   │    ✔ 마우스만으로 화면 흐름 완결                        │
   │    ✔ 4개 해상도 대응                                    │
   │    ✔ HUD GC 0                                          │
   │                                                        │
   │  커밋 3개                                               │
   └────────────────────────────────────────────────────────┘
```

- [ ] 화면 흐름을 그리고 빠진 경로를 확인했다
- [ ] 씬 구조를 결정했다 (Title + Game)
- [ ] `GameResult`로 씬 간 데이터를 전달한다
- [ ] `UIPanel`이 페이드로 전환된다
- [ ] `UIManager`가 패널을 관리한다
- [ ] 히스토리로 뒤로가기가 된다
- [ ] 타이틀 화면이 있다
- [ ] 최고 기록이 표시된다
- [ ] **HUD에 핵심 수치가 전부 보인다**
- [ ] 지연 HP 게이지가 동작한다
- [ ] HUD의 GC가 0에 가깝다
- [ ] 일시정지 화면이 있다
- [ ] 커서 잠금이 상태에 따라 전환된다
- [ ] 결과 화면에 수치가 카운트업된다
- [ ] **`WaitForSeconds` 함정을 확인했다**
- [ ] 신기록이 저장·표시된다
- [ ] 페이드로 씬이 전환된다
- [ ] 설정이 저장·복원된다
- [ ] 조작 안내가 있다
- [ ] **마우스만으로 화면 흐름이 완결된다**
- [ ] 인게임 일시정지 버튼이 있다
- [ ] 4개 해상도에서 UI가 유지된다
- [ ] Raycast Target을 정리했다
- [ ] 전체 흐름을 5회 반복 테스트했다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **씬 전환 시 데이터 소실** | 전달 방식 없음 | static / DontDestroyOnLoad |
| 결과 화면 값이 0 | 저장 시점 오류 | 종료 시 `GameResult`에 기록 |
| **결과 숫자가 안 오름** | `WaitForSeconds` | `WaitForSecondsRealtime` |
| 페이드가 안 보임 | Sort Order | 최상위로 |
| 페이드가 씬 전환 후 사라짐 | DontDestroyOnLoad 없음 | 추가 |
| 커서가 안 보임 | lockState | 상태별 전환 |
| 버튼이 안 눌림 | EventSystem 없음 | 추가 |
| 버튼이 안 눌림 | `blocksRaycasts` false | CanvasGroup 확인 |
| 패널이 겹침 | 관리 부재 | UIManager |
| 해상도 바꾸면 어긋남 | Constant Pixel Size | Scale With Screen Size |
| 요소가 화면 밖 | 앵커 오류 | Alt+Shift+프리셋 |
| GC 발생 | 매 프레임 문자열 | 값 변경 시에만 |
| 재시작 후 멈춤 | `timeScale` 미복구 | `= 1f` |

---

## 7. 오늘의 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **화면 흐름도** | 막다른 화면을 찾는다 |
| 단일 vs 다중 씬 | 2씬(Title+Game)이 4주에 적당 |
| `GameResult` static | 씬 간 데이터. `Clear()` 필수 |
| `UIManager` | 패널 관리 + 히스토리 |
| `UIPanel` | 페이드. **unscaledDeltaTime** |
| CanvasGroup | alpha/interactable/raycast |
| HUD 배치 | 중앙을 비운다 |
| 이벤트 + 캐싱 | GC 0 |
| 지연 HP 게이지 | Day 48·76 |
| `ScreenFader` | DontDestroyOnLoad |
| 커서 잠금 전환 | 인게임/UI |
| **마우스 전용 검증** | 흐름 완결성 |
| 해상도 4종 테스트 | 앵커 확인 |
| Canvas 분리 | 3~5개 |

### Part 2·3에서 가져온 것

| 출처 | 내용 |
|---|---|
| Day 48 | 지연 HP 게이지 |
| Day 75 | 씬 전환, `timeScale`, 결과 카운트업, PlayerPrefs |
| Day 76 | 앵커·피벗, Canvas Scaler, Filled Image |
| Day 77 | Layout Group |
| Day 80 | CanvasGroup, UITween |
| Day 89 | 문자열 캐싱, Raycast Target |

### 내일 (Day 109)

> **데이터 외부화와 저장**
>
> ```
>   목표: 밸런스 수치를 코드 수정 없이 조정할 수 있다

>   오전  남은 하드코딩 수치를 데이터로
>         밸런스 표 작성
>         로드 실패 시 기본값
>   오후  세이브/기록 저장
>         데이터만 바꿔 밸런스 1차 조정
> ```
>
> **"적 체력을 2배로 바꾸고 실행하면 실제로 2배가 된다."**
>
> 빌드된 실행 파일에서도 동작해야 한다.
>
> → **Day 109, 데이터 외부화와 저장**
