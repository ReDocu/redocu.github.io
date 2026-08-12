# Day 113 · UI/UX 정리와 튜토리얼

> **Week 23 · 베타** — "다듬였나?"
> 선수: Day 112 (연출), Day 076~077 (UGUI), Day 105 (관찰)

---

## 1. 오늘의 목표

**처음 보는 사람이 설명 없이 첫 층을 클리어한다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  HP ████████████████░░░░  80/100      층 1/8   💰 0    │
   │                                                        │
   │                                                        │
   │              ▲          ▣                              │
   │             ╱█╲                                        │
   │              │                                         │
   │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │
   │                                                        │
   │          ┌────────────────────────────┐                │
   │          │  좌클릭으로 공격하세요      │  ← 필요한     │
   │          └────────────────────────────┘     순간에      │
   │                                                        │
   │  ⚔ 장검                                    [Esc] 메뉴  │
   └────────────────────────────────────────────────────────┘

   === 튜토리얼 진행 ===
   [1] WASD로 이동        ✔ 완료 (0:04)
   [2] 좌클릭으로 공격    ← 진행 중
   [3] Space로 회피
   [4] 모든 적 처치
   [5] E로 무기 선택
```

<!-- SHOT: Day 113 완료 상태 -->

---

## 2. 오늘이 중요한 이유

```
   ★ Day 105에서 관찰한 것

   0:05  타이틀에서 3초 정지 (뭘 눌러야 할지 모름)
   0:20  좌클릭 5회 (공격인지 확인 중)
   0:45  화면을 두리번 (적을 찾는 중)  ★ 4/5명
```

```
   ★ 이것이 UX 문제다

   ① 게임이 무엇을 원하는지 모른다
   ② 조작을 모른다
   ③ 왜 안 되는지 모른다
```

```
   ⚠️ Day 115가 이틀 뒤다

   외부 테스터 5명이 플레이한다
   → 그때 "뭘 해야 하는지 모르겠다"가 나오면
   → 게임 자체를 평가받지 못한다
```

```
   ★ 오늘의 검증

   "게임을 처음 보는 사람이
    아무 설명 없이 첫 층을 클리어하는가?"
```

---

## 3. 개념

### 3-1. 첫 3분 설계

**왜 필요한가** — 플레이어를 잃는 구간.

```
   ★ 시간별 목표

   0:00~0:15  무엇을 하는 게임인지 감을 잡는다
   0:15~0:45  기본 조작을 익힌다
   0:45~1:30  핵심 루프를 한 바퀴 돈다
   1:30~3:00  "재미있다"를 느낀다
```

```
   ★ 정보 전달 순서

   ① 이동          (가장 먼저)
   ② 공격
   ③ 목표 (적 처치)
   ④ 진행 (다음 층)
   ⑤ 선택 (무기)
   ⑥ 회피 (필요할 때)
```

```
   ⚠️ 한 번에 다 알려주지 않는다

   "WASD 이동, 좌클릭 공격, Space 회피, E 상호작용,
    Esc 메뉴, Shift 달리기..."
   → 아무것도 기억 못 한다
```

```
   ★ 원칙: 필요한 순간에 하나씩

   이동이 필요한 순간 → "WASD로 이동"
   적을 만난 순간     → "좌클릭으로 공격"
   맞기 시작한 순간   → "Space로 회피"
```

### 3-2. 튜토리얼의 3가지 방식

**왜 필요한가** — 상황에 맞는 것을 고른다.

| 방식 | 설명 | 장단점 |
|---|---|---|
| **전면 설명** | 시작 전 조작표 | 빠르지만 안 읽는다 |
| **상황별 안내** | 필요할 때 한 줄 | **효과적** ★ / 구현 필요 |
| **환경 유도** | 레벨 디자인으로 | 최고 / 어렵다 |

```
   ★ 4주 프로젝트 권장

   전면 설명 (타이틀) + 상황별 안내 (인게임)
   → 둘 다 하면 확실하다
```

```
   ★ 환경 유도의 예

   길이 하나뿐 → 자연스럽게 그쪽으로
   적이 멀리서 다가옴 → 준비할 시간
   → 코드 없이 가르친다
```

### 3-3. 상황별 안내 시스템

**왜 필요한가** — Feature Freeze 아래에서 최소 구현.

```csharp
namespace OneFloor.UI
{
    [System.Serializable]
    public class TutorialStep
    {
        public string id;
        public string message;
        public TutorialTrigger trigger;
        public float delay = 0.5f;
        public float duration = 4f;
        public bool onlyFirstPlay = true;
    }

    public enum TutorialTrigger
    {
        GameStart,
        EnemySpotted,
        FirstDamageTaken,
        FloorCleared,
        WeaponChoiceOpened,
        LowHealth,
    }

    public class TutorialManager : MonoBehaviour
    {
        [SerializeField] private List<TutorialStep> steps = new();
        [SerializeField] private CanvasGroup group;
        [SerializeField] private TextMeshProUGUI messageText;

        private readonly HashSet<string> shown = new();
        private Coroutine current;

        public void Trigger(TutorialTrigger trigger)
        {
            foreach (TutorialStep step in steps)
            {
                if (step.trigger != trigger) continue;
                if (shown.Contains(step.id)) continue;

                // ★ 첫 플레이만 표시
                if (step.onlyFirstPlay && HasSeenBefore(step.id)) continue;

                Show(step);
                return;
            }
        }

        private void Show(TutorialStep step)
        {
            shown.Add(step.id);
            MarkAsSeen(step.id);

            if (current != null) StopCoroutine(current);
            current = StartCoroutine(ShowRoutine(step));
        }

        private IEnumerator ShowRoutine(TutorialStep step)
        {
            yield return new WaitForSeconds(step.delay);

            messageText.text = step.message;

            yield return UITween.Fade(group, 1f, 0.2f);
            yield return new WaitForSeconds(step.duration);
            yield return UITween.Fade(group, 0f, 0.3f);

            current = null;
        }

        private bool HasSeenBefore(string id)
            => PlayerPrefs.GetInt($"tut_{id}", 0) == 1;

        private void MarkAsSeen(string id)
            => PlayerPrefs.SetInt($"tut_{id}", 1);
    }
}
```

```
   ★ 트리거 호출

   // GameManager.StartGame
   tutorial.Trigger(TutorialTrigger.GameStart);

   // Enemy가 플레이어를 발견
   tutorial.Trigger(TutorialTrigger.EnemySpotted);

   // 플레이어 피격
   tutorial.Trigger(TutorialTrigger.FirstDamageTaken);
```

```
   ★ 첫 플레이만 표시

   두 번째부터는 방해가 된다
   → PlayerPrefs로 기록
```

```
   ⚠️ 이것은 새 기능인가?

   → UI 개선이므로 W23 허용 범위
   → 하지만 최소한으로
```

### 3-4. 메시지 작성 원칙

**왜 필요한가** — 짧고 명확하게.

```
   ★ 좋은 메시지

   ✔ "WASD로 이동"
   ✔ "좌클릭으로 공격"
   ✔ "Space로 회피"
   ✔ "모든 적을 처치하세요"
```

```
   ★ 나쁜 메시지

   ✗ "W, A, S, D 키를 사용하여 캐릭터를 이동시킬 수 있습니다"
      → 길다

   ✗ "이동하세요"
      → 어떻게?

   ✗ "적을 처치하고 다음 층으로 진행하여 보스를 물리치세요"
      → 한 번에 너무 많다
```

```
   ★ 형식

   [키] + [동사]
   또는
   [목표] 한 문장
```

```
   ★ 길이 기준

   한글 15자 이내
   → 한눈에 읽힌다
```

### 3-5. UI 가독성

**왜 필요한가** — 안 보이면 없는 것과 같다.

| 항목 | 기준 |
|---|---|
| **폰트 크기** | 최소 18px (1080p 기준) |
| **대비** | 배경과 4.5:1 이상 |
| 외곽선 | 밝은 배경에도 읽히게 |
| 위치 | 중요할수록 시선 중심에 가깝게 |
| 여백 | 요소 간 최소 8px |

```
   ★ 대비 확보 방법

   ① 텍스트에 외곽선 (TMP Outline)
   ② 반투명 배경 박스
   ③ 그림자
```

```
   ⚠️ 흰 글씨 + 밝은 배경

   가장 흔한 실수
   → 밝은 곳에서 안 보인다
```

```
   ★ 확인 방법

   ① 게임 화면을 스크린샷
   ② 흑백으로 변환
   ③ 여전히 읽히는가?
```

```
   ★ 시선의 흐름

   좌상단 → 우상단 → 중앙 → 하단

   HP는 좌상단   ★ 가장 중요
   진행은 우상단
   중앙은 비운다
```

### 3-6. 오류 상황 안내

**왜 필요한가** — "왜 안 되는지" 알려준다.

```
   ⚠️ 최악의 UX

   버튼을 눌렀는데 아무 일도 안 일어난다
   → 버그인지 조건 미달인지 모른다
```

```
   ★ 반드시 알려야 하는 상황

   ① 자원 부족       "골드가 부족합니다"
   ② 쿨다운 중       (게이지 표시)
   ③ 조건 미달       "적을 모두 처치하세요"
   ④ 배치 불가       "여기에 놓을 수 없습니다"
   ⑤ 최대치 도달     "더 이상 강화할 수 없습니다"
```

```
   ★ 전달 방법 3가지

   ① 텍스트 메시지
   ② 시각 (붉게, 흔들림)
   ③ 청각 (거부음)

   → 최소 2가지를 함께
```

```csharp
    private void OnRerollClicked()
    {
        if (!GameManager.Instance.TrySpendGold(cost))
        {
            // ★ 3가지 피드백
            MessageUI.Instance.Show("골드가 부족합니다", MessageType.Warning);
            StartCoroutine(ShakeRoutine(goldText.rectTransform));
            AudioManager.Instance.PlaySfx(SfxType.UIDenied);
            return;
        }
        // ...
    }
```

```
   ★ 사전 방지가 더 좋다

   ① 조건 미달 시 버튼을 회색으로
   ② 비용을 미리 표시
   → 누르기 전에 알 수 있다
```

### 3-7. 메시지 UI

**왜 필요한가** — 일관된 알림.

```csharp
namespace OneFloor.UI
{
    public enum MessageType { Info, Warning, Success }

    public class MessageUI : MonoBehaviour
    {
        public static MessageUI Instance { get; private set; }

        [SerializeField] private CanvasGroup group;
        [SerializeField] private TextMeshProUGUI text;
        [SerializeField] private Image background;
        [SerializeField] private float duration = 1.6f;

        [SerializeField] private Color infoColor = Color.white;
        [SerializeField] private Color warningColor = new Color(1f, 0.6f, 0.3f);
        [SerializeField] private Color successColor = new Color(0.4f, 1f, 0.5f);

        private Coroutine routine;

        private void Awake() { Instance = this; group.alpha = 0; }

        public void Show(string message, MessageType type = MessageType.Info)
        {
            text.text = message;
            text.color = type switch
            {
                MessageType.Warning => warningColor,
                MessageType.Success => successColor,
                _ => infoColor
            };

            if (routine != null) StopCoroutine(routine);
            routine = StartCoroutine(ShowRoutine());
        }

        private IEnumerator ShowRoutine()
        {
            group.alpha = 1f;

            yield return new WaitForSecondsRealtime(duration);   // ★ Day 75

            float t = 0;
            while (t < 0.3f)
            {
                t += Time.unscaledDeltaTime;
                group.alpha = 1f - t / 0.3f;
                yield return null;
            }

            group.alpha = 0;
            routine = null;
        }
    }
}
```

```
   ★ 위치

   화면 중앙 하단 또는 중앙 상단
   → 플레이를 가리지 않는 곳
```

### 3-8. 목표 표시

**왜 필요한가** — "지금 뭘 해야 하나".

```
   ★ 항상 보여야 하는 것

   ① 현재 목표     "적 4마리 남음"
   ② 진행도        "층 3/8"
   ③ 자기 상태     HP, 무기
```

```
   ★ 목표를 못 찾는 문제 (Day 105)

   "적이 어디 있는지 모르겠다" 4/5명
```

```
   ★ 해결 3가지

   ① 스폰 범위 축소       (Day 105에 반영)
   ② 화면 밖 적 방향 표시  ★
   ③ 미니맵
```

```csharp
namespace OneFloor.UI
{
    public class OffScreenIndicator : MonoBehaviour
    {
        [SerializeField] private RectTransform arrowPrefab;
        [SerializeField] private RectTransform canvasRect;
        [SerializeField] private float edgeMargin = 60f;

        private readonly List<RectTransform> arrows = new();

        private void LateUpdate()
        {
            var enemies = EnemyManager.Instance.Active;

            EnsureArrowCount(enemies.Count);

            for (int i = 0; i < arrows.Count; i++)
            {
                if (i >= enemies.Count || enemies[i] == null)
                {
                    arrows[i].gameObject.SetActive(false);
                    continue;
                }

                Vector3 vp = Camera.main.WorldToViewportPoint(enemies[i].transform.position);

                bool onScreen = vp.z > 0 && vp.x > 0 && vp.x < 1 && vp.y > 0 && vp.y < 1;

                arrows[i].gameObject.SetActive(!onScreen);

                if (onScreen) continue;

                // ★ 화면 가장자리로 투영
                Vector2 dir = new Vector2(vp.x - 0.5f, vp.y - 0.5f);
                if (vp.z < 0) dir = -dir;

                dir.Normalize();

                Vector2 size = canvasRect.rect.size;
                Vector2 half = size * 0.5f - Vector2.one * edgeMargin;

                float scale = Mathf.Min(
                    Mathf.Abs(half.x / dir.x), Mathf.Abs(half.y / dir.y));

                arrows[i].anchoredPosition = dir * scale;
                arrows[i].localRotation = Quaternion.Euler(
                    0, 0, Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg - 90f);
            }
        }
    }
}
```

```
   ★ Day 95의 미니맵 좌표 변환과 같은 원리
```

```
   ⚠️ 적이 많으면 화살표가 도배된다

   → 최대 5개로 제한
   → 또는 가장 가까운 것만
```

### 3-9. 색 이외의 구분

**왜 필요한가** — 접근성.

```
   ⚠️ 색만으로 정보를 전달하면

   색맹(남성 8%)이 구분 못 한다
```

```
   ★ 우리 게임의 색 의존

   적 3종:  회색 / 노랑 / 파랑
   → 색맹도 크기로 구분 가능  ✔

   HP 바:   초록 → 노랑 → 빨강
   → 길이로도 알 수 있다  ✔

   버튼:    활성 흰색 / 비활성 회색
   → 명도 차이만으로 구분 가능  ✔
```

```
   ★ 추가 안전장치

   ① 아이콘·모양 병행
   ② 텍스트 병행
   ③ 명도 차이 확보
```

### 3-10. 조작 안내 (정적)

**왜 필요한가** — 언제든 확인할 수 있게.

```
   ★ 3곳에 둔다

   ① 타이틀 화면      (시작 전)
   ② 일시정지 화면    (플레이 중)
   ③ 인게임 구석      (최소 힌트)
```

```
   ★ 타이틀의 조작표

   ┌─── 조작 ──────────────┐
   │  WASD     이동         │
   │  마우스   시점         │
   │  좌클릭   공격         │
   │  Space    회피         │
   │  E        무기 선택    │
   │  Esc      메뉴         │
   └────────────────────────┘
```

```
   ★ 인게임 최소 힌트

   우하단에 작게
   "[Esc] 메뉴"
```

### 3-11. 첫 플레이 흐름

**왜 필요한가** — 오늘 설계할 것.

```
   ★ 우리 게임의 첫 3분

   0:00  타이틀
         → 조작표가 보인다
         → "시작" 버튼

   0:05  1층 시작 (적 2마리, 멀리)
         → [튜토리얼] "WASD로 이동"

   0:12  적에게 접근
         → [튜토리얼] "좌클릭으로 공격"

   0:25  적 처치
         → 이펙트 + 사운드 (성취감)

   0:40  두 번째 적, 피격
         → [튜토리얼] "Space로 회피"

   1:00  1층 클리어
         → 플래시 + 팡파레
         → [튜토리얼] "무기를 선택하세요"

   1:10  무기 선택 화면
         → 카드에 스탯 표시
         → 선택

   1:20  2층 시작
         → 이제 루프를 안다
```

```
   ★ 설계 원칙

   ① 첫 층은 쉽게 (적 2마리)
   ② 적을 멀리 배치 (준비 시간)
   ③ 한 번에 하나씩 알려준다
   ④ 성공 경험을 빨리 준다
```

### 3-12. 관찰 테스트

**왜 필요한가** — Day 105의 방식.

```
   ★ 오늘의 테스트

   팀원이 아닌 사람 1~2명
   → 설명 없이 플레이
   → 관찰만
```

```
   ★ 확인 목표

   "첫 층을 클리어하는가?"
```

```
   ★ 기록

   [시각]  [행동]                [문제?]

   0:03  타이틀 조작표 읽음      ✔
   0:08  시작 클릭               ✔
   0:11  WASD 시도               ✔ (튜토리얼 효과)
   0:19  적 발견, 접근           ✔
   0:24  좌클릭 (튜토리얼 보고)  ✔
   0:38  적 1 처치               ✔
   0:55  적 2 처치, 층 클리어    ✔
   1:02  무기 선택 화면에서 정지  ⚠ 6초 (뭘 봐야 할지)
   1:08  선택                    ✔
```

```
   ★ 1:02의 문제

   무기 카드에 정보가 많아 판단이 어렵다
   → "DPS"를 강조하거나
   → 추천 표시
```

```
   ⚠️ 개입하지 않는다 (Day 105)
```

---

## 4. 진행 순서

### Step 1 — 첫 3분 설계

3-11절의 형식으로 우리 게임의 첫 3분을 시각별로 쓴다.

```
   ★ 각 시점에 무엇을 알려줄지 정한다
```

**✅ 여기까지 하면** — 설계 완료.

### Step 2 — 튜토리얼 메시지 작성

3-4절의 원칙으로 5~6개를 쓴다.

| ID | 트리거 | 메시지 |
|---|---|---|
| move | GameStart | WASD로 이동 |
| attack | EnemySpotted | 좌클릭으로 공격 |
| dodge | FirstDamageTaken | Space로 회피 |
| clear | FloorCleared | 모든 적을 처치했습니다 |
| weapon | WeaponChoiceOpened | 무기를 선택하세요 |
| lowhp | LowHealth | 체력이 부족합니다 |

```
   ★ 각 15자 이내
```

**✅ 여기까지 하면** — 문구 확정.

### Step 3 — TutorialManager

3-3절의 코드를 만든다.

```
   Canvas_HUD
   └─ TutorialPanel
       ├─ Background (반투명 박스)
       └─ MessageText (중앙 하단)
```

**Inspector에 6개 스텝을 등록한다.**

**✅ 여기까지 하면** — 시스템 준비.

### Step 4 — 트리거 연결

```csharp
    // GameManager.StartGame
    tutorial.Trigger(TutorialTrigger.GameStart);

    // Enemy가 Chase 상태 진입 시 (한 번만)
    if (!hasSpottedPlayer)
    {
        hasSpottedPlayer = true;
        TutorialManager.Instance.Trigger(TutorialTrigger.EnemySpotted);
    }

    // Health.OnDamaged (플레이어)
    tutorial.Trigger(TutorialTrigger.FirstDamageTaken);

    // FloorManager.OnFloorCleared
    tutorial.Trigger(TutorialTrigger.FloorCleared);

    // WeaponChoiceUI.Show
    tutorial.Trigger(TutorialTrigger.WeaponChoiceOpened);

    // Health.OnHpChanged (25% 이하)
    if (cur <= max * 0.25f) tutorial.Trigger(TutorialTrigger.LowHealth);
```

**✅ 여기까지 실행하면** — 안내가 나온다.

<!-- SHOT: Step 4 튜토리얼 -->

### Step 5 — 첫 플레이만 표시 확인

**한 판 플레이한 뒤 재시작한다.**

```
   ★ 두 번째부터는 안 나온다  ✔
```

```
   ★ 다시 보고 싶다면

   설정에 "튜토리얼 초기화" 버튼
   → PlayerPrefs 삭제
```

```csharp
#if UNITY_EDITOR || DEVELOPMENT_BUILD
    // 치트: 튜토리얼 초기화
    if (Input.GetKeyDown(KeyCode.F9)) ResetTutorial();
#endif
```

**✅ 여기까지 하면** — 반복 방해 없음.

### Step 6 — 1층 난이도 조정

```
   ★ 첫 층은 쉽게

   적 2마리 (기본만)
   HP 배율 1.0
   플레이어에게서 멀리 배치
```

```csharp
    // 1층은 스폰 반경을 넓게
    float radius = (floorIndex == 0) ? 10f : 6f;
```

```
   ★ 이유

   ① 준비할 시간
   ② 첫 성공 경험
```

**✅ 여기까지 하면** — 진입 장벽 완화.

### Step 7 — MessageUI

3-7절의 코드를 만든다.

**✅ 여기까지 하면** — 알림 시스템.

### Step 8 — 오류 상황 안내

3-6절의 목록을 각각 처리한다.

```csharp
    // 골드 부족
    MessageUI.Instance.Show("골드가 부족합니다", MessageType.Warning);
    ShakeGoldText();
    AudioManager.Instance.PlaySfx(SfxType.UIDenied);

    // 회피 쿨다운 (게이지로 표시)
    dodgeCooldownFill.fillAmount = 1f - (cooldownTimer / cooldownTime);
```

```
   ★ 사전 방지도 함께

   골드가 부족하면 버튼을 회색으로
```

```csharp
    private void UpdateRerollButton()
    {
        bool canAfford = GameManager.Instance.Gold >= currentRerollCost;

        rerollButton.interactable = canAfford;
        rerollCostText.color = canAfford ? Color.white : new Color(1f, 0.4f, 0.4f);
    }
```

**✅ 여기까지 하면** — 왜 안 되는지 안다.

### Step 9 — UI 가독성 점검

3-5절의 기준으로 확인한다.

```
   ★ 절차

   ① 게임 화면 스크린샷
   ② 이미지 편집기에서 흑백 변환
   ③ 여전히 읽히는가?
```

```
   ★ 발견된 문제

   "골드 텍스트가 밝은 배경에서 안 보인다"
   → TMP Outline 추가 (Width 0.15, 검정)

   "HP 숫자가 작다"
   → 18px → 22px
```

**✅ 여기까지 하면** — 가독성 확보.

<!-- SHOT: Step 9 흑백 변환 확인 -->

### Step 10 — 화면 밖 적 표시

3-8절의 `OffScreenIndicator`를 만든다.

```
   Canvas_HUD
   └─ IndicatorContainer
       └─ ArrowPrefab (화살표 Image)
```

```
   ★ 최대 5개 제한
```

**✅ 여기까지 실행하면**

```
   ★ 적이 화면 밖에 있으면 방향이 보인다
   → Day 105의 "적을 못 찾는 문제" 해결
```

<!-- SHOT: Step 10 방향 표시 -->

### Step 11 — 목표 표시 강화

```csharp
    // 층 시작 시 목표를 명확히
    private void HandleFloorStarted(FloorData floor)
    {
        MessageUI.Instance.Show(
            $"{floor.label} — 적 {floor.TotalEnemyCount}마리",
            MessageType.Info);
    }
```

```
   ★ HUD의 적 카운트도 강조

   적이 1마리 남으면 색 변경
```

**✅ 여기까지 하면** — 목표가 명확.

### Step 12 — 조작 안내 (정적)

3-10절의 3곳에 배치한다.

```
   ★ 타이틀

   ControlsPanel (우하단 또는 중앙)

   ★ 일시정지

   같은 내용을 재사용 (프리팹)

   ★ 인게임

   우하단 "[Esc] 메뉴"
```

**✅ 여기까지 하면** — 언제든 확인 가능.

### Step 13 — 무기 카드 정보 개선

**Day 105·오늘의 관찰에서 나온 문제.**

```
   ⚠️ 정보가 많아 판단이 어렵다

   damage / interval / type / DPS
   → 무엇을 봐야 하나
```

```
   ★ 개선

   ① DPS를 가장 크게
   ② 타입 아이콘으로 (근접/원거리/광역)
   ③ 현재 무기와 비교 표시 (▲▼)
```

```csharp
    public void Setup(WeaponData data, WeaponData current)
    {
        // ...

        if (current != null)
        {
            float diff = data.Dps - current.Dps;

            compareText.text = diff > 0.5f ? $"▲ {diff:F0}"
                             : diff < -0.5f ? $"▼ {-diff:F0}"
                                            : "=";

            compareText.color = diff > 0.5f ? Color.green
                              : diff < -0.5f ? new Color(1f, 0.5f, 0.5f)
                                             : Color.gray;
        }
    }
```

```
   ★ 비교 표시가 있으면

   "이게 더 좋은가?"를 즉시 판단
```

**✅ 여기까지 하면** — 선택이 쉬워진다.

### Step 14 — 색 이외의 구분

3-9절의 항목을 점검한다.

```
   ★ 확인

   [ ] 적 3종이 크기로도 구분되나
   [ ] HP 바가 길이로도 알 수 있나
   [ ] 버튼 활성/비활성이 명도로 구분되나
   [ ] 중요 정보가 색으로만 표시되지 않나
```

```
   ★ 발견된 문제

   "무기 비교의 ▲▼가 색으로만"
   → 기호를 이미 쓰고 있다  ✔
```

**✅ 여기까지 하면** — 접근성.

### Step 15 — 첫 플레이 시뮬레이션

**팀원이 "처음 보는 사람"인 척 플레이한다.**

```
   ★ 규칙

   ① 아는 것을 잊는다
   ② 화면에 있는 것만 본다
   ③ 헤매는 곳을 기록
```

```
   ★ 발견

   "회피가 있는 줄 몰랐다"
   → 튜토리얼 트리거가 피격 시인데
      피격 전에 클리어해 버렸다
   → 트리거를 "적 접근 시"로 변경
```

**✅ 여기까지 하면** — 문제 발견.

### Step 16 — 외부인 테스트 ★

**팀원이 아닌 사람 1~2명에게 부탁한다.**

```
   ★ 절차 (Day 105와 동일)

   ① 빌드를 준다
   ② 아무 설명도 하지 않는다
   ③ 옆에서 관찰만 한다
   ④ 첫 층 클리어까지 기록
```

```
   ★ 목표

   "첫 층을 클리어하는가?"
```

```
   ★ 기록 예

   테스터 A
   0:03  타이틀 조작표 읽음
   0:09  시작
   0:12  이동 (튜토리얼 보고)
   0:22  공격 (튜토리얼 보고)
   0:41  적 1 처치
   0:58  적 2 처치, 층 클리어  ★ 성공
   1:04  무기 선택 (6초 고민)
   1:12  2층 진입

   → 첫 층 클리어 ✔ (58초)
```

**✅ 여기까지 하면** — 검증 완료.

<!-- SHOT: Step 16 외부 테스트 -->

### Step 17 — 발견 문제 즉시 수정

```
   ★ 나온 지적

   ① "적이 어디 있는지 처음엔 몰랐다"
      → 1층 스폰을 시야 안으로

   ② "무기 카드가 뭘 의미하는지 몰랐다"
      → 비교 표시 추가 (Step 13에서 완료)

   ③ "Esc를 눌러도 되는지 몰랐다"
      → 인게임 힌트 크기 확대
```

```
   ★ 5분 이내 수정 가능한 것은 지금
```

**✅ 여기까지 하면** — 즉시 개선.

### Step 18 — 다시 테스트

**수정 후 다른 사람에게 다시.**

```
   ★ 개선 확인

   테스터 B
   → 첫 층 클리어 0:47 (13초 단축)
   → 헤매는 구간 없음  ✔
```

**✅ 여기까지 하면** — 검증.

### Step 19 — UI 성능 확인

Day 108의 체크리스트를 다시 확인한다.

```
   [ ] Raycast Target 정리
   [ ] 매 프레임 문자열 없음
   [ ] Canvas 분리
   [ ] OffScreenIndicator의 GC
```

```csharp
    // OffScreenIndicator는 매 프레임 돈다
    // → 화살표 오브젝트를 재사용 (Instantiate 금지)
    // → 리스트를 재사용
```

**✅ 여기까지 하면** — 성능 유지.

### Step 20 — 커밋과 기록

```bash
   git add .
   git commit -m "feat: 상황별 튜토리얼 (6단계, 첫 플레이만)"
   git commit -m "feat: MessageUI, 오류 상황 안내"
   git commit -m "feat: 화면 밖 적 방향 표시"
   git commit -m "ux: UI 가독성 개선, 무기 비교 표시"
   git push
```

```markdown
| 113 | UI/UX·튜토리얼 | 외부인 첫 층 클리어 검증 | ✔ | ✔ | A 58초, B 47초 |
```

---

## 5. 완료 확인

```
   ┌────────────────────────────────────────────────────────┐
   │  === Day 113 완료 ===                                   │
   │                                                        │
   │  튜토리얼                                               │
   │    ✔ 상황별 안내 6단계 (첫 플레이만)                    │
   │    ✔ 15자 이내 메시지                                   │
   │    ✔ 트리거 연결                                        │
   │                                                        │
   │  UX 개선                                                │
   │    ✔ MessageUI (Info/Warning/Success)                  │
   │    ✔ 오류 상황 안내 (텍스트+흔들림+소리)                │
   │    ✔ 사전 방지 (버튼 비활성)                            │
   │    ✔ 화면 밖 적 방향 표시                               │
   │    ✔ 무기 카드 비교 표시 (▲▼)                          │
   │    ✔ 1층 난이도 완화                                    │
   │                                                        │
   │  가독성                                                 │
   │    ✔ 흑백 변환 테스트 통과                              │
   │    ✔ 외곽선·크기 조정                                   │
   │    ✔ 색 이외의 구분                                     │
   │                                                        │
   │  ★ 외부인 2명이 첫 층 클리어 (58초 → 47초)              │
   │  커밋 4개                                               │
   └────────────────────────────────────────────────────────┘
```

- [ ] 첫 3분을 시각별로 설계했다
- [ ] 튜토리얼 메시지 6개를 15자 이내로 썼다
- [ ] `TutorialManager`가 트리거로 동작한다
- [ ] 첫 플레이만 표시된다
- [ ] 1층을 쉽게 조정했다
- [ ] `MessageUI`가 있다
- [ ] **오류 상황에 왜 안 되는지 알려준다**
- [ ] 사전 방지도 한다 (버튼 비활성)
- [ ] **UI가 흑백 변환에서도 읽힌다**
- [ ] 폰트 크기·외곽선을 조정했다
- [ ] **화면 밖 적의 방향이 표시된다**
- [ ] 목표가 명확히 보인다
- [ ] 조작 안내가 3곳에 있다
- [ ] 무기 카드에 비교 표시가 있다
- [ ] 색 이외의 구분 수단이 있다
- [ ] 팀원이 "처음 보는 사람"으로 시뮬레이션했다
- [ ] **외부인이 설명 없이 첫 층을 클리어했다**
- [ ] 발견 문제를 즉시 수정했다
- [ ] 수정 후 재검증했다
- [ ] UI 성능을 확인했다
- [ ] 커밋·빌드 확인

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **계속 막힘** | 안내 부재 | 그 지점에 안내 또는 쉽게 |
| 튜토리얼이 길다 | 한 번에 다 설명 | 필요한 순간에 하나씩 |
| 튜토리얼이 방해 | 매번 표시 | 첫 플레이만 |
| 메시지를 못 읽음 | 길거나 짧게 표시 | 15자 + 4초 |
| 목표를 모름 | 표시 부재 | HUD + 층 시작 메시지 |
| 적을 못 찾음 | 시야 밖 | 방향 표시 + 스폰 조정 |
| 왜 안 되는지 모름 | 피드백 부재 | 텍스트+시각+청각 |
| 텍스트가 안 보임 | 대비 부족 | 외곽선 + 크기 |
| 선택이 어려움 | 정보 과다 | 핵심 강조 + 비교 |
| 색맹 구분 불가 | 색 의존 | 모양·크기·텍스트 병행 |
| 화살표가 도배 | 개수 무제한 | 최대 5개 |
| GC 발생 | 매 프레임 Instantiate | 재사용 |

---

## 7. 오늘의 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **첫 3분 설계** | 시각별로 무엇을 알려줄지 |
| 튜토리얼 3방식 | 전면 / **상황별** / 환경 유도 |
| **필요한 순간에 하나씩** | 한 번에 다 알려주지 않는다 |
| 메시지 원칙 | 15자 이내. [키] + [동사] |
| 첫 플레이만 | PlayerPrefs로 기록 |
| **UI 가독성** | 흑백 변환에서도 읽히는가 |
| **오류 안내** | 왜 안 되는지 + 사전 방지 |
| 화면 밖 표시 | 목표를 못 찾는 문제 해결 |
| 비교 표시 | 선택을 쉽게 |
| 색 이외의 구분 | 접근성 |
| **외부인 테스트** | 오늘의 검증 |

### Part 2·3에서 가져온 것

| 출처 | 내용 |
|---|---|
| Day 76 | 앵커, 가독성 |
| Day 80 | UITween, 흔들림 피드백 |
| Day 87 | 배치 불가 안내 |
| Day 95 | 미니맵 좌표 변환, 접근성 |
| Day 105 | 관찰 테스트, 개입 금지 |
| Day 108 | UI 성능 |

### 내일 (Day 114)

> **밸런싱과 버그 수정**
>
> ```
>   목표: 난이도 곡선이 완만하고 알려진 버그가 정리된다

>   오전  밸런싱 (Day 109의 표를 실제 플레이로 검증)
>         난이도 곡선
>         지배 전략 점검
>   오후  버그 목록 + 우선순위 (A/B/C/D)
>         A·B 등급 수정
> ```
>
> ⚠️ **D 등급(있으면 좋은 것)을 고치고 있으면 멈춘다.**
>
> 남은 시간은 A·B에만 쓴다.
>
> → **Day 114, 밸런싱과 버그 수정**
