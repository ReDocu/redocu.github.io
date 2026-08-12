# Day 079 · JSON 로드와 게임 로직

> **Week 16** · 연결 문서 `14 보드게임` — Step 4
> 선수: Day 078 (ScriptableObject), Day 026·059 (파일 입출력·포맷 설계)

---

## 1. 오늘 만드는 것

**외부 JSON 파일의 덱 구성대로 게임이 시작된다.** 빌드된 실행 파일에서도 JSON만 바꿔 반영된다.

```
   deck.json                              게임
   ┌────────────────────────┐            ┌──────────────────────────────┐
   │ {                      │            │  TURN 3    마나 ⚡⚡⚡○○     │
   │   "name": "화염 덱",   │            │                              │
   │   "cards": [           │   ────▶    │   덱 17  손패 5  버림 8      │
   │     {"id":"fireball",  │            │                              │
   │      "count": 3},      │            │      ╱▣ ▣ ▣ ▣ ▣╲           │
   │     {"id":"strike",     │            │     화염구 강타 치유 ...     │
   │      "count": 4},      │            │                              │
   │     ...                │            │            [ 턴 종료 ]        │
   │   ]                    │            │                              │
   │ }                      │            │  ─ 로그 ─                    │
   └────────────────────────┘            │  [턴 3] 드로우 1장           │
                                          │  [사용] 화염구 (마나 3)       │
   rules.json                             │  [덱] 소진 → 버림 더미 재구성 │
   ┌────────────────────────┐            └──────────────────────────────┘
   │ { "startingHand": 5,   │
   │   "maxHand": 10,       │
   │   "drawPerTurn": 1 }   │
   └────────────────────────┘
```

<!-- SHOT: Day 79 완성 화면 -->

---

## 2. 막히는 상황

어제 만든 ScriptableObject는 좋다. 그런데.

```
   ★ 상황

   게임을 빌드해서 배포했다
   → "화염구가 너무 강하다"는 피드백
   → 코스트를 3 → 4로 올리고 싶다
```

```
   ScriptableObject는 빌드에 박혀 있다

   RunnerGame_Data/
   └─ resources.assets      ← 여기 안에 들어 있다

   → 수정 불가
   → 재빌드 + 재배포 (수백 MB)
```

```
   그리고 또 하나

   × 세이브 데이터는 어디에 저장하나?
   × ScriptableObject에 저장할 수는 없다 (읽기 전용)
```

```
   Part 2에서는 어떻게 했나

   Day 26:  fopen / fwrite 로 세이브 파일
   Day 59:  .map 바이너리 포맷 (매직·버전·검증)

   → 파일로 저장하고 읽었다
```

> **Unity에서도 파일을 쓴다. 형식은 JSON이다.**

---

## 3. 개념

### 3-1. ScriptableObject vs JSON

**왜 필요한가** — 언제 무엇을 쓸지 정한다.

| | ScriptableObject | JSON |
|---|---|---|
| 편집 | Unity 에디터 | 텍스트 에디터 / 외부 툴 |
| **빌드 후 수정** | **불가** | **가능** ★ |
| 애셋 참조(이미지) | **직접 연결** ★ | 경로/ID로 간접 |
| 타입 안전성 | **컴파일 시 검사** ★ | 런타임 파싱 |
| 로드 속도 | 빠름 | 파싱 필요 |
| 버전 관리 diff | YAML (설정 시) | **텍스트** ★ |
| 적합한 곳 | 고정 마스터 데이터 | 밸런스 패치·세이브·외부 연동 |

```
   ★ 실무에서는 둘 다 쓴다

   CardData (SO)      ← 이미지, 프리팹 참조. 구조 정의
        ↑ 오버라이드
   balance.json       ← 수치만 덮어쓴다

   → 이미지는 빌드에, 수치는 밖에
```

### 3-2. JsonUtility

**왜 필요한가** — Unity 내장. 가장 빠르다.

```csharp
    // 객체 → JSON
    string json = JsonUtility.ToJson(obj);
    string pretty = JsonUtility.ToJson(obj, true);      // ★ 들여쓰기

    // JSON → 객체
    SaveData data = JsonUtility.FromJson<SaveData>(json);

    // 기존 객체에 덮어쓰기
    JsonUtility.FromJsonOverwrite(json, existingObj);
```

```csharp
[System.Serializable]                          // ★ 필수
public class SaveData
{
    public int level;
    public string playerName;
    public float playTime;
    public List<string> unlockedCards;
}
```

```
   ⚠️ JsonUtility의 제약

   ① [System.Serializable] 필수
   ② public 필드 또는 [SerializeField] private
   ③ 속성(property)은 직렬화 안 됨  ← 흔한 함정
   ④ Dictionary 지원 안 됨
   ⑤ 최상위 배열 지원 안 됨
   ⑥ null을 기본값으로 만든다
   ⑦ 다형성(상속) 지원 안 됨
```

```csharp
    // ✗ 속성은 저장 안 된다
    public int Level { get; set; }

    // ✔ 필드로
    public int level;
```

### 3-3. ⚠️ 최상위 배열 문제

**왜 필요한가** — 가장 자주 막히는 곳.

```json
[
  { "id": "fireball", "count": 3 },
  { "id": "strike",   "count": 4 }
]
```

```csharp
    // ✗ 동작 안 함
    CardEntry[] entries = JsonUtility.FromJson<CardEntry[]>(json);
```

**해결 — 래퍼 클래스**

```json
{
  "cards": [
    { "id": "fireball", "count": 3 },
    { "id": "strike",   "count": 4 }
  ]
}
```

```csharp
[System.Serializable]
public class DeckConfig
{
    public string name;
    public List<CardEntry> cards = new List<CardEntry>();
}

[System.Serializable]
public class CardEntry
{
    public string id;
    public int count = 1;
}
```

```csharp
    DeckConfig deck = JsonUtility.FromJson<DeckConfig>(json);   // ✔
```

```
   ★ 최상위는 항상 객체 { } 로 감싼다

   나중에 필드를 추가하기도 쉽다
```

**어쩔 수 없이 배열이 최상위라면**

```csharp
public static class JsonHelper
{
    [System.Serializable]
    private class Wrapper<T> { public T[] items; }

    public static T[] FromJsonArray<T>(string json)
    {
        // ★ 배열을 객체로 감싸서 파싱
        string wrapped = "{\"items\":" + json + "}";
        return JsonUtility.FromJson<Wrapper<T>>(wrapped).items;
    }

    public static string ToJsonArray<T>(T[] array, bool pretty = false)
    {
        Wrapper<T> w = new Wrapper<T> { items = array };
        string json = JsonUtility.ToJson(w, pretty);

        // {"items":[...]} → [...]
        int start = json.IndexOf('[');
        int end = json.LastIndexOf(']');
        return json.Substring(start, end - start + 1);
    }
}
```

### 3-4. Newtonsoft.Json

**왜 필요한가** — JsonUtility로 안 되는 것들.

```
   Package Manager → + → Add package by name
   com.unity.nuget.newtonsoft-json
```

```csharp
using Newtonsoft.Json;

    string json = JsonConvert.SerializeObject(obj, Formatting.Indented);
    var data = JsonConvert.DeserializeObject<SaveData>(json);
```

| | JsonUtility | Newtonsoft |
|---|---|---|
| 속도 | **빠름** | 보통 |
| Dictionary | ✗ | **✔** |
| 최상위 배열 | ✗ | **✔** |
| 다형성 | ✗ | **✔** (설정 시) |
| null 처리 | 기본값 | **null 유지** |
| 속성(property) | ✗ | **✔** |
| 빌드 크기 | 없음 | +약 500KB |

```
   ★ 선택 기준

   단순한 세이브·설정        →  JsonUtility
   복잡한 구조·Dictionary    →  Newtonsoft
```

```csharp
    // Newtonsoft 옵션
    var settings = new JsonSerializerSettings
    {
        Formatting = Formatting.Indented,
        NullValueHandling = NullValueHandling.Ignore,
        DefaultValueHandling = DefaultValueHandling.Include,
    };
```

### 3-5. 파일 경로 — 어디에 저장하나

**왜 필요한가** — Part 2에서는 실행 파일 옆에 저장했다. Unity는 다르다.

| 경로 | 읽기 | 쓰기 | 용도 |
|---|:--:|:--:|---|
| `Application.dataPath` | ✔ | ✗ | 빌드 내부 (에디터에선 Assets) |
| **`Application.streamingAssetsPath`** | ✔ | ✗* | **배포용 원본 데이터** |
| **`Application.persistentDataPath`** | ✔ | **✔** | **세이브 데이터** ★ |
| `Application.temporaryCachePath` | ✔ | ✔ | 임시 파일 |

```
   ★ persistentDataPath (Windows)

   C:\Users\<사용자>\AppData\LocalLow\<회사명>\<제품명>\

   ★ StreamingAssets (빌드 후)

   <제품명>_Data\StreamingAssets\
   → 탐색기에서 보이고 수정할 수 있다  ★ 밸런스 패치에 적합
```

```
   ⚠️ StreamingAssets는 플랫폼마다 다르다

   Windows/Mac:  일반 파일 (File.ReadAllText 가능)
   Android:      APK 안에 압축 (UnityWebRequest 필요)
   WebGL:        URL (UnityWebRequest 필요)
```

```csharp
    // ★ 플랫폼 안전한 읽기
    public static string ReadStreamingAsset(string fileName)
    {
        string path = Path.Combine(Application.streamingAssetsPath, fileName);

#if UNITY_ANDROID && !UNITY_EDITOR
        UnityWebRequest req = UnityWebRequest.Get(path);
        req.SendWebRequest();
        while (!req.isDone) { }                // ⚠️ 동기 대기. 실제로는 코루틴
        return req.downloadHandler.text;
#else
        return File.Exists(path) ? File.ReadAllText(path) : null;
#endif
    }
```

```
   ★ 이 커리큘럼은 Windows 빌드이므로 File API로 진행한다
```

### 3-6. 안전한 저장 (Day 59의 재현)

**왜 필요한가** — 저장 중에 전원이 나가면?

```
   ★ Day 59에서 만든 안전 저장

   ① 임시 파일에 쓴다
   ② 성공하면 기존 파일을 백업
   ③ 임시 파일을 정식 이름으로 바꾼다

   → 어느 시점에 죽어도 온전한 파일이 남는다
```

```csharp
using System;
using System.IO;
using UnityEngine;

public static class SaveSystem
{
    private static string Dir => Application.persistentDataPath;

    public static string GetPath(string fileName)
        => Path.Combine(Dir, fileName);

    public static bool Save<T>(string fileName, T data)
    {
        string path = GetPath(fileName);
        string temp = path + ".tmp";
        string backup = path + ".bak";

        try
        {
            string json = JsonUtility.ToJson(data, true);

            File.WriteAllText(temp, json);     // ★ ① 임시 파일

            if (File.Exists(path))
            {
                if (File.Exists(backup)) File.Delete(backup);
                File.Move(path, backup);       // ★ ② 백업
            }

            File.Move(temp, path);             // ★ ③ 교체

            Debug.Log($"[저장] {fileName} ({json.Length} bytes)");
            return true;
        }
        catch (Exception e)
        {
            Debug.LogError($"[저장 실패] {fileName}: {e.Message}");

            if (File.Exists(temp))
            {
                try { File.Delete(temp); } catch { }
            }
            return false;
        }
    }

    public static T Load<T>(string fileName) where T : class
    {
        string path = GetPath(fileName);

        T result = TryLoad<T>(path);
        if (result != null) return result;

        // ★ 실패하면 백업 시도
        string backup = path + ".bak";
        result = TryLoad<T>(backup);

        if (result != null)
        {
            Debug.LogWarning($"[로드] 백업에서 복구: {fileName}");
            return result;
        }

        Debug.Log($"[로드] {fileName} 없음");
        return null;
    }

    private static T TryLoad<T>(string path) where T : class
    {
        if (!File.Exists(path)) return null;

        try
        {
            string json = File.ReadAllText(path);

            if (string.IsNullOrWhiteSpace(json)) return null;

            return JsonUtility.FromJson<T>(json);
        }
        catch (Exception e)
        {
            Debug.LogError($"[로드 실패] {path}: {e.Message}");
            return null;
        }
    }

    public static bool Exists(string fileName) => File.Exists(GetPath(fileName));

    public static void Delete(string fileName)
    {
        string path = GetPath(fileName);
        if (File.Exists(path)) File.Delete(path);
    }

    public static void OpenFolder()
    {
#if UNITY_EDITOR
        UnityEditor.EditorUtility.RevealInFinder(Dir);
#endif
    }
}
```

```
   ★ Day 59와 비교

   Part 2:  fopen("temp", "wb") → fwrite → rename
   Unity:   File.WriteAllText → File.Move

   원리는 완전히 같다
```

### 3-7. 버전 관리 (Day 59의 재현)

**왜 필요한가** — 나중에 데이터 구조가 바뀐다.

```csharp
[System.Serializable]
public class SaveData
{
    public const int CURRENT_VERSION = 2;

    public int version = CURRENT_VERSION;      // ★ Day 59의 버전 필드
    public string magic = "CARDSAVE";          // ★ Day 59의 매직

    public int highScore;
    public int gamesPlayed;
    public List<string> unlockedCardIds = new List<string>();

    // v2에서 추가된 필드
    public int totalTurns;

    public bool Validate()
    {
        if (magic != "CARDSAVE")
        {
            Debug.LogError($"[세이브] 매직 불일치: {magic}");
            return false;
        }

        if (version > CURRENT_VERSION)
        {
            Debug.LogError($"[세이브] 미래 버전 {version} (현재 {CURRENT_VERSION})");
            return false;
        }

        return true;
    }

    public void Migrate()
    {
        if (version < 2)
        {
            // ★ v1 → v2 변환
            totalTurns = gamesPlayed * 10;     // 추정값
            Debug.Log("[세이브] v1 → v2 마이그레이션");
        }

        version = CURRENT_VERSION;
    }
}
```

```
   ★ Day 59에서 배운 그대로

   ① 매직으로 "우리 파일인가" 확인
   ② 버전으로 "읽을 수 있나" 확인
   ③ 구버전이면 변환
```

```
   ⚠️ 미래 버전은 읽으면 안 된다

   v3 파일을 v2 코드로 읽으면
   → 모르는 필드가 사라진다
   → 저장하면 데이터 손실
```

### 3-8. 밸런스 오버라이드

**왜 필요한가** — 빌드 후 수치 조정.

```json
{
  "version": 1,
  "overrides": [
    { "id": "fireball", "cost": 4 },
    { "id": "strike",   "cost": 1, "power": 4 },
    { "id": "lightning","cost": 6 }
  ]
}
```

```csharp
[System.Serializable]
public class BalanceOverride
{
    public string id;
    public int cost = -1;                      // ★ -1 = 변경 안 함
    public int power = -1;
    public int effectValue = -1;
}

[System.Serializable]
public class BalancePatch
{
    public int version = 1;
    public List<BalanceOverride> overrides = new List<BalanceOverride>();
}
```

```csharp
public class BalanceLoader : MonoBehaviour
{
    [SerializeField] private CardDatabase database;

    private readonly Dictionary<string, BalanceOverride> applied
        = new Dictionary<string, BalanceOverride>();

    public void LoadAndApply()
    {
        string path = Path.Combine(Application.streamingAssetsPath, "balance.json");

        if (!File.Exists(path))
        {
            Debug.Log("[밸런스] 패치 파일 없음. 기본값 사용");
            return;
        }

        try
        {
            string json = File.ReadAllText(path);
            BalancePatch patch = JsonUtility.FromJson<BalancePatch>(json);

            int count = 0;

            foreach (BalanceOverride o in patch.overrides)
            {
                CardData card = database.GetById(o.id);
                if (card == null) continue;

                applied[o.id] = o;
                count++;
            }

            Debug.Log($"[밸런스] {count}개 오버라이드 적용");
        }
        catch (Exception e)
        {
            Debug.LogError($"[밸런스] 로드 실패: {e.Message}");
        }
    }

    public int GetCost(CardData d)
    {
        if (applied.TryGetValue(d.id, out var o) && o.cost >= 0) return o.cost;
        return d.cost;
    }

    public int GetPower(CardData d)
    {
        if (applied.TryGetValue(d.id, out var o) && o.power >= 0) return o.power;
        return d.power;
    }
}
```

```
   ⚠️ ScriptableObject를 직접 수정하지 않는다

   card.cost = o.cost;                        ✗ 원본 오염 (Day 78)
   별도 Dictionary에 보관                      ✔
```

```
   ★ 더 나은 방법 — CardInstance에서 조회

   CardInstance 생성 시 오버라이드된 값을 복사
   → 게임 로직은 오버라이드 존재를 몰라도 된다
```

### 3-9. 게임 로직 — 덱·손패·버림 더미

**왜 필요한가** — 카드 게임의 기본 구조.

```
   ┌──────────┐  드로우   ┌──────────┐  사용    ┌──────────┐
   │   덱     │ ────────▶│   손패   │ ───────▶│ 버림 더미 │
   │ (Deck)   │          │ (Hand)   │         │(Discard) │
   └──────────┘          └──────────┘         └──────────┘
        ▲                      │                    │
        │                      │ 턴 종료 시 버림     │
        │                      └────────────────────┘
        │
        └──── 덱 소진 시 셔플해서 되돌림 ────────────┘
```

```csharp
using System.Collections.Generic;
using UnityEngine;

public class DeckSystem
{
    private readonly List<CardInstance> deck = new List<CardInstance>();
    private readonly List<CardInstance> hand = new List<CardInstance>();
    private readonly List<CardInstance> discard = new List<CardInstance>();

    public IReadOnlyList<CardInstance> Hand => hand;
    public int DeckCount => deck.Count;
    public int HandCount => hand.Count;
    public int DiscardCount => discard.Count;

    public event System.Action<CardInstance> OnDrawn;
    public event System.Action<CardInstance> OnDiscarded;
    public event System.Action OnReshuffled;

    public void Initialize(List<CardInstance> cards)
    {
        deck.Clear(); hand.Clear(); discard.Clear();
        deck.AddRange(cards);
        Shuffle(deck);
    }

    public CardInstance Draw(int maxHand)
    {
        if (hand.Count >= maxHand)
        {
            Debug.Log("[손패] 상한 도달 — 드로우 무효");
            return null;
        }

        if (deck.Count == 0)
        {
            if (discard.Count == 0)
            {
                Debug.Log("[덱] 완전 소진");
                return null;
            }

            Reshuffle();                       // ★ 버림 더미를 덱으로
        }

        CardInstance c = deck[0];
        deck.RemoveAt(0);
        hand.Add(c);

        OnDrawn?.Invoke(c);
        return c;
    }

    public int DrawMultiple(int count, int maxHand)
    {
        int drawn = 0;
        for (int i = 0; i < count; i++)
            if (Draw(maxHand) != null) drawn++;
        return drawn;
    }

    public bool PlayCard(CardInstance c)
    {
        if (!hand.Remove(c)) return false;

        discard.Add(c);
        OnDiscarded?.Invoke(c);
        return true;
    }

    public void DiscardHand()
    {
        // ★ 역순 (Day 53)
        for (int i = hand.Count - 1; i >= 0; i--)
        {
            discard.Add(hand[i]);
            OnDiscarded?.Invoke(hand[i]);
        }
        hand.Clear();
    }

    private void Reshuffle()
    {
        deck.AddRange(discard);
        discard.Clear();
        Shuffle(deck);

        OnReshuffled?.Invoke();
        Debug.Log($"[덱] 재구성 — {deck.Count}장");
    }

    private void Shuffle(List<CardInstance> list)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = Random.Range(0, i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
    }
}
```

```
   ⚠️ 무한 루프 주의

   덱이 비었는데 버림 더미도 비었으면
   → Reshuffle 해도 여전히 0
   → 무한 루프

   ★ 반드시 discard.Count == 0 검사
```

### 3-10. 턴 구조 — FSM 재사용

**왜 필요한가** — Day 46·69에서 만든 그 구조.

```csharp
public enum TurnPhase
{
    TurnStart,      // 마나 회복, 드로우
    Main,           // 카드 사용
    TurnEnd,        // 손패 버림
    EnemyTurn,      // 상대 행동
    GameOver
}
```

```
   ┌────────────┐          ┌────────┐         ┌──────────┐
   │ TurnStart  │ ───────▶│  Main  │ ──────▶ │ TurnEnd  │
   └────────────┘          └────────┘         └──────────┘
        ▲                                           │
        │                                           ▼
        │                                    ┌────────────┐
        └────────────────────────────────────│ EnemyTurn  │
                                             └────────────┘
```

```csharp
    private IEnumerator RunTurn()
    {
        // ─── 턴 시작 ───
        SetPhase(TurnPhase.TurnStart);

        turnNumber++;
        maxMana = Mathf.Min(maxMana + 1, config.maxMana);
        currentMana = maxMana;

        int drawn = deckSystem.DrawMultiple(config.drawPerTurn, config.maxHandSize);
        Log($"[턴 {turnNumber}] 드로우 {drawn}장, 마나 {currentMana}/{maxMana}");

        yield return new WaitForSeconds(config.drawAnimTime * drawn);

        // ─── 메인 ───
        SetPhase(TurnPhase.Main);

        while (phase == TurnPhase.Main)
            yield return null;                 // ★ 플레이어 입력 대기

        // ─── 턴 종료 ───
        SetPhase(TurnPhase.TurnEnd);

        deckSystem.DiscardHand();
        yield return new WaitForSeconds(0.3f);

        // ─── 상대 턴 ───
        SetPhase(TurnPhase.EnemyTurn);
        yield return EnemyAction();

        if (CheckGameOver()) { SetPhase(TurnPhase.GameOver); yield break; }

        StartCoroutine(RunTurn());             // ★ 다음 턴
    }
```

```
   ★ 코루틴으로 턴을 표현

   Day 72에서 배운 것 — 순차적 흐름은 코루틴이 읽기 쉽다
   Part 2 Day 69에서는 상태 변수 + switch 로 했다
```

```
   ⚠️ StartCoroutine 재귀

   깊이가 쌓이지는 않는다 (코루틴은 스택 프레임이 아님)
   하지만 while 루프로 바꾸는 것이 더 명확할 수 있다
```

### 3-11. 마나와 코스트

**왜 필요한가** — 카드 게임의 자원 관리.

```csharp
    public bool CanPlay(CardInstance c)
    {
        if (phase != TurnPhase.Main) return false;
        if (c.IsExhausted) return false;
        return currentMana >= c.CurrentCost;
    }

    public bool TryPlayCard(CardInstance c, object target = null)
    {
        if (!CanPlay(c))
        {
            Log($"[사용 불가] {c.Data.displayName} (마나 {currentMana}/{c.CurrentCost})");
            return false;
        }

        currentMana -= c.CurrentCost;

        deckSystem.PlayCard(c);
        ApplyEffect(c, target);

        Log($"[사용] {c.Data.displayName} (마나 -{c.CurrentCost} → {currentMana})");

        OnManaChanged?.Invoke(currentMana, maxMana);
        return true;
    }
```

### 3-12. 카드 효과 처리

**왜 필요한가** — 효과가 늘어나도 관리 가능하게.

**방법 1 — switch 분기 (단순)**

```csharp
    private void ApplyEffect(CardInstance c, object target)
    {
        CardData d = c.Data;

        switch (d.effect)
        {
        case EffectType.Damage:
            DealDamage(target, d.effectValue);
            break;

        case EffectType.Heal:
            playerHp = Mathf.Min(playerHp + d.effectValue, config.startingHp);
            break;

        case EffectType.Shield:
            playerShield += d.effectValue;
            break;

        case EffectType.Draw:
            deckSystem.DrawMultiple(d.effectValue, config.maxHandSize);
            break;

        case EffectType.ManaGain:
            currentMana += d.effectValue;
            break;

        case EffectType.Summon:
            SpawnMinion(d.effectValue);
            break;
        }
    }
```

```
   ★ 효과가 10종 이하면 이걸로 충분하다

   Day 46에서 배운 것 — 상태가 적으면 switch가 명확
```

**방법 2 — ScriptableObject 전략 패턴 (확장)**

```csharp
public abstract class CardEffectSO : ScriptableObject
{
    public abstract void Execute(GameContext ctx, CardInstance card, object target);
    public abstract string GetDescription(int value);
}

[CreateAssetMenu(menuName = "Card Game/Effect/Damage")]
public class DamageEffect : CardEffectSO
{
    public override void Execute(GameContext ctx, CardInstance card, object target)
    {
        ctx.DealDamage(target, card.Data.effectValue);
    }

    public override string GetDescription(int v) => $"적에게 {v}의 피해를 입힌다.";
}
```

```
   ★ 새 효과를 추가할 때

   switch 방식:   enum 추가 + case 추가 + 재컴파일
   SO 방식:       새 SO 클래스 하나 (다른 코드 수정 없음)

   → Day 28의 가상 함수·다형성이 여기서 쓰인다
```

```
   ⚠️ 처음부터 SO 방식으로 가면 과설계일 수 있다

   효과 3종으로 시작 → switch
   10종을 넘으면 → SO로 리팩터링
```

---

## 4. 따라 만들기

### Step 1 — StreamingAssets 폴더

```
   Assets/StreamingAssets/     ← 이름 정확히
```

```
   ⚠️ 이름이 다르면 특별 취급을 안 받는다
     StreamingAssets 정확히
```

### Step 2 — deck.json 작성

```json
{
  "version": 1,
  "name": "화염 덱",
  "cards": [
    { "id": "fireball",   "count": 3 },
    { "id": "strike",     "count": 4 },
    { "id": "lightning",  "count": 2 },
    { "id": "heal",       "count": 2 },
    { "id": "great_heal", "count": 1 },
    { "id": "shield",     "count": 3 },
    { "id": "iron_wall",  "count": 1 },
    { "id": "insight",    "count": 2 },
    { "id": "mana",       "count": 2 }
  ]
}
```

```
   Assets/StreamingAssets/deck.json 으로 저장
```

**✅ 여기까지 하면** — Project 창에 보인다.

### Step 3 — rules.json

```json
{
  "version": 1,
  "startingHandSize": 5,
  "maxHandSize": 10,
  "drawPerTurn": 1,
  "startingMana": 1,
  "maxMana": 10,
  "startingHp": 30,
  "winCondition": "reduce_enemy_hp",
  "drawAnimTime": 0.25,
  "playAnimTime": 0.2
}
```

### Step 4 — 데이터 클래스

```csharp
using System.Collections.Generic;

[System.Serializable]
public class DeckConfig
{
    public int version = 1;
    public string name = "기본 덱";
    public List<CardEntry> cards = new List<CardEntry>();

    public int TotalCount
    {
        get
        {
            int n = 0;
            foreach (CardEntry e in cards) n += e.count;
            return n;
        }
    }
}

[System.Serializable]
public class CardEntry
{
    public string id;
    public int count = 1;
}
```

```csharp
[System.Serializable]
public class RulesConfig
{
    public int version = 1;
    public int startingHandSize = 5;
    public int maxHandSize = 10;
    public int drawPerTurn = 1;
    public int startingMana = 1;
    public int maxMana = 10;
    public int startingHp = 30;
    public string winCondition = "reduce_enemy_hp";
    public float drawAnimTime = 0.25f;
    public float playAnimTime = 0.2f;
}
```

### Step 5 — 로더

```csharp
using System.IO;
using UnityEngine;

public static class ConfigLoader
{
    public static T LoadFromStreamingAssets<T>(string fileName, T fallback)
        where T : class
    {
        string path = Path.Combine(Application.streamingAssetsPath, fileName);

        if (!File.Exists(path))
        {
            Debug.LogWarning($"[설정] {fileName} 없음. 기본값 사용");
            return fallback;
        }

        try
        {
            string json = File.ReadAllText(path);

            if (string.IsNullOrWhiteSpace(json))
            {
                Debug.LogWarning($"[설정] {fileName} 비어 있음");
                return fallback;
            }

            T result = JsonUtility.FromJson<T>(json);

            if (result == null)
            {
                Debug.LogError($"[설정] {fileName} 파싱 실패");
                return fallback;
            }

            Debug.Log($"[설정] {fileName} 로드 완료");
            return result;
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[설정] {fileName} 오류: {e.Message}");
            return fallback;
        }
    }
}
```

```
   ★ fallback을 반드시 둔다

   파일이 없거나 깨져도 게임이 시작돼야 한다
   → Day 59에서 배운 "검증 실패 시 기본값"
```

### Step 6 — 덱 구성

```csharp
using System.Collections.Generic;
using UnityEngine;

public class GameSetup : MonoBehaviour
{
    [SerializeField] private CardDatabase database;

    public RulesConfig Rules { get; private set; }
    public DeckConfig Deck { get; private set; }

    public List<CardInstance> BuildDeck()
    {
        database.BuildLookup();

        Rules = ConfigLoader.LoadFromStreamingAssets("rules.json", new RulesConfig());
        Deck  = ConfigLoader.LoadFromStreamingAssets("deck.json", CreateDefaultDeck());

        List<CardInstance> result = new List<CardInstance>();
        int missing = 0;

        foreach (CardEntry e in Deck.cards)
        {
            CardData data = database.GetById(e.id);

            if (data == null)
            {
                Debug.LogError($"[덱] 알 수 없는 카드 ID: {e.id}");
                missing++;
                continue;
            }

            for (int i = 0; i < e.count; i++)
                result.Add(new CardInstance(data));
        }

        Debug.Log($"[덱] '{Deck.name}' {result.Count}장 구성" +
                  (missing > 0 ? $" (누락 {missing}종)" : ""));

        return result;
    }

    private DeckConfig CreateDefaultDeck()
    {
        DeckConfig d = new DeckConfig { name = "기본 덱(폴백)" };

        foreach (CardData c in database.All)
            d.cards.Add(new CardEntry { id = c.id, count = 2 });

        return d;
    }
}
```

**✅ 여기까지 실행하면**

```
   [설정] rules.json 로드 완료
   [설정] deck.json 로드 완료
   [덱] '화염 덱' 20장 구성
```

<!-- SHOT: Step 6 덱 로드 로그 -->

### Step 7 — JSON 수정 실습

**`deck.json`에서 `fireball`의 count를 3 → 8로 바꾼다.**

**Play.**

```
   [덱] '화염 덱' 25장 구성
   → 화염구가 훨씬 자주 나온다
```

```
   ★ 스크립트도, ScriptableObject도 안 건드렸다
```

### Step 8 — 잘못된 JSON 실험

**`deck.json`에서 마지막 `}` 를 지운다.**

**✅ 이렇게 하면**

```
   [설정] deck.json 오류: ...
   [덱] '기본 덱(폴백)' 22장 구성

   → 게임은 정상 실행된다  ✔
```

**존재하지 않는 카드 ID를 넣어 본다.**

```json
    { "id": "meteor", "count": 3 },
```

```
   [덱] 알 수 없는 카드 ID: meteor
   [DB] 'meteor' 없음
   [덱] '화염 덱' 20장 구성 (누락 1종)
```

```
   ★ Day 59에서 배운 것

   "검증 없이 읽으면 크래시. 검증하면 복구"
```

> **되돌린다.**

### Step 9 — 최상위 배열 실험

**`deck.json`을 배열로 바꿔 본다.**

```json
[
  { "id": "fireball", "count": 3 }
]
```

**✅ 이렇게 하면**

```
   [설정] deck.json 파싱 실패
   → 폴백 덱 사용
```

```
   ★ 3-3절의 JsonUtility 제약
```

> **되돌린다.**

### Step 10 — DeckSystem 구현

3-9절의 `DeckSystem`을 만든다.

```csharp
    // GameManager
    private DeckSystem deckSystem = new DeckSystem();

    void Start()
    {
        List<CardInstance> cards = setup.BuildDeck();
        deckSystem.Initialize(cards);

        deckSystem.OnDrawn += HandleDrawn;
        deckSystem.OnDiscarded += HandleDiscarded;
        deckSystem.OnReshuffled += () => Log("[덱] 버림 더미 재구성");

        StartCoroutine(RunTurn());
    }
```

**✅ 여기까지 실행하면** — 덱/손패/버림 더미가 동작한다.

### Step 11 — 덱 소진 실험

**카드를 계속 뽑는다.**

**✅ 여기까지 하면**

```
   [덱] 20 → 0
   [덱] 버림 더미 재구성 — 15장
   → 계속 뽑을 수 있다
```

**버림 더미까지 비운다 (전부 손패에).**

```
   [덱] 완전 소진
   → null 반환. 크래시 없음  ✔
```

```
   ⚠️ discard.Count == 0 검사를 빼면

   Reshuffle → 여전히 0 → Draw → Reshuffle → ...
   무한 루프 (Unity가 멈춘다)
```

### Step 12 — 턴 구조

3-10절의 `RunTurn` 코루틴을 구현한다.

```csharp
    public void EndTurn()
    {
        if (phase != TurnPhase.Main) return;
        phase = TurnPhase.TurnEnd;             // ★ while 루프 탈출
    }
```

```csharp
    // 턴 종료 버튼
    endTurnButton.onClick.AddListener(EndTurn);
```

**✅ 여기까지 실행하면** — 턴이 순환한다.

```
   [턴 1] 드로우 5장, 마나 1/1
   [사용] 마력 (마나 -0 → 1)
   ... 턴 종료 ...
   [턴 2] 드로우 1장, 마나 2/2
```

### Step 13 — 마나 UI

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ManaUI : MonoBehaviour
{
    [SerializeField] private Transform crystalRoot;
    [SerializeField] private GameObject crystalPrefab;
    [SerializeField] private Color filledColor = new Color(0.3f, 0.6f, 1f);
    [SerializeField] private Color emptyColor = new Color(0.2f, 0.2f, 0.3f);

    private readonly List<Image> crystals = new List<Image>();

    public void Refresh(int current, int max)
    {
        // 필요하면 생성
        while (crystals.Count < max)
        {
            GameObject go = Instantiate(crystalPrefab, crystalRoot);
            crystals.Add(go.GetComponent<Image>());
        }

        for (int i = 0; i < crystals.Count; i++)
        {
            crystals[i].gameObject.SetActive(i < max);
            crystals[i].color = (i < current) ? filledColor : emptyColor;
        }
    }
}
```

```
   ⚠️ Layout Group 안에서 Instantiate 후 즉시 위치를 읽으면 0

   Day 77의 갱신 타이밍 문제
```

**✅ 여기까지 실행하면** — 마나 수정이 채워지고 비워진다.

```
   마나 ⚡⚡⚡○○
```

### Step 14 — 세이브 시스템

3-6·3-7절의 `SaveSystem`과 `SaveData`를 만든다.

```csharp
    // 게임 종료 시
    private void SaveProgress()
    {
        SaveData d = SaveSystem.Load<SaveData>("save.json") ?? new SaveData();

        if (!d.Validate()) d = new SaveData();
        d.Migrate();

        d.gamesPlayed++;
        d.totalTurns += turnNumber;
        if (score > d.highScore) d.highScore = score;

        SaveSystem.Save("save.json", d);
    }
```

**✅ 여기까지 실행하면**

```
   [저장] save.json (218 bytes)
```

```
   ★ 파일 확인

   C:\Users\<사용자>\AppData\LocalLow\<회사>\<제품>\save.json
```

```csharp
    // 에디터에서 바로 열기
    [ContextMenu("세이브 폴더 열기")]
    private void OpenSaveFolder() => SaveSystem.OpenFolder();
```

<!-- SHOT: Step 14 세이브 파일 -->

### Step 15 — 안전 저장 실험

**저장 직후 `save.json`을 메모장으로 열어 내용을 망가뜨린다.**

```
   { "version": 2, "magic": "CARD    ← 중괄호 없이 저장
```

**Play.**

**✅ 이렇게 하면**

```
   [로드 실패] ...\save.json: ...
   [로드] 백업에서 복구: save.json

   → .bak 에서 살아난다  ✔
```

```
   ★ Day 59에서 만든 안전 저장의 효과
```

### Step 16 — 버전 마이그레이션 실험

**`save.json`에서 `"version": 2` → `"version": 1` 로 바꾸고, `totalTurns` 줄을 지운다.**

**Play.**

```
   [세이브] v1 → v2 마이그레이션
   → totalTurns가 추정값으로 채워진다
```

**`"version": 99` 로 바꾼다.**

```
   [세이브] 미래 버전 99 (현재 2)
   → 새 세이브로 시작  ✔
```

### Step 17 — 밸런스 패치

**`Assets/StreamingAssets/balance.json` 작성.**

```json
{
  "version": 1,
  "overrides": [
    { "id": "fireball", "cost": 4 },
    { "id": "strike",   "cost": 1, "power": 4 }
  ]
}
```

3-8절의 `BalanceLoader`를 구현하고 `CardInstance` 생성 시 적용한다.

```csharp
    public CardInstance(CardData data, BalanceLoader balance = null)
    {
        Uid = nextUid++;
        Data = data;

        baseCost  = balance != null ? balance.GetCost(data)  : data.cost;
        basePower = balance != null ? balance.GetPower(data) : data.power;

        CurrentPower = basePower;
    }

    public int CurrentCost => Mathf.Max(0, baseCost + TempCostModifier);
```

**✅ 여기까지 실행하면**

```
   [밸런스] 2개 오버라이드 적용
   → 화염구가 4코스트로 나온다
```

### Step 18 — 빌드 후 수정

```
   빌드한다
   → Builds/CardGame/CardGame_Data/StreamingAssets/ 확인
```

```
   ★ balance.json, deck.json, rules.json 이 그대로 있다
```

**메모장으로 `balance.json`을 열어 화염구 코스트를 1로 바꾼다.**

**exe를 다시 실행한다.**

**✅ 여기까지 하면**

```
   ★ 재빌드 없이 밸런스가 바뀌었다
```

> ### ★ 이것이 오늘의 핵심 확인이다
>
> ScriptableObject로는 절대 안 되는 일이다.

### Step 19 — 로그 패널

```csharp
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class GameLogUI : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI logText;
    [SerializeField] private int maxLines = 8;

    private readonly Queue<string> lines = new Queue<string>();

    public void Add(string msg)
    {
        lines.Enqueue(msg);

        while (lines.Count > maxLines) lines.Dequeue();

        logText.text = string.Join("\n", lines);
    }
}
```

```
   ⚠️ string.Join은 GC 할당이 있다

   로그가 자주 갱신되지 않으므로 괜찮다
   매 프레임이라면 StringBuilder
```

**✅ 최종** — 1절의 화면.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────────────────────────────┐
   │  TURN 3          마나 ⚡⚡⚡○○         HP 30/30      │
   │                                                      │
   │   덱 17    손패 5    버림 8                           │
   │                                                      │
   │              ╱▣  ▣  ▣  ▣  ▣╲                        │
   │             화염구 강타 치유 방패 통찰                 │
   │              4⚡  1⚡  2⚡  1⚡  1⚡                   │
   │                                                      │
   │                                    [ 턴 종료 ]        │
   │  ─ 로그 ─                                            │
   │  [설정] deck.json 로드 완료                           │
   │  [덱] '화염 덱' 20장 구성                             │
   │  [밸런스] 2개 오버라이드 적용                          │
   │  [턴 3] 드로우 1장, 마나 3/3                          │
   │  [사용] 강타 (마나 -1 → 2)                            │
   └──────────────────────────────────────────────────────┘
```

- [ ] StreamingAssets에 JSON 3개를 두었다
- [ ] `deck.json` 구성대로 덱이 만들어진다
- [ ] `rules.json`으로 규칙이 바뀐다
- [ ] JSON을 수정하면 재컴파일 없이 반영된다
- [ ] 깨진 JSON에서도 폴백으로 실행된다
- [ ] 없는 카드 ID가 검출된다
- [ ] 최상위 배열이 파싱 안 된다는 것을 확인했다
- [ ] 덱/손패/버림 더미가 순환한다
- [ ] 덱 소진 시 버림 더미가 재구성된다
- [ ] 둘 다 비면 무한 루프 없이 종료된다
- [ ] 손패 상한이 동작한다
- [ ] 턴이 FSM으로 순환한다
- [ ] 마나가 턴마다 1씩 늘어난다
- [ ] 마나가 부족하면 카드를 못 낸다
- [ ] 세이브가 `persistentDataPath`에 저장된다
- [ ] **파일이 깨져도 `.bak`에서 복구된다**
- [ ] 버전 마이그레이션이 동작한다
- [ ] 미래 버전을 거부한다
- [ ] **빌드 후 JSON만 고쳐 밸런스가 바뀐다**

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **최상위 배열 파싱 실패** | JsonUtility 제약 | 래퍼 객체로 감싸기 |
| 필드가 저장 안 됨 | 속성(property) 사용 | public 필드로 |
| 필드가 저장 안 됨 | `[System.Serializable]` 누락 | 추가 |
| Dictionary 저장 안 됨 | JsonUtility 미지원 | List 또는 Newtonsoft |
| 빌드에서 파일 못 찾음 | `dataPath` 사용 | StreamingAssets / persistentDataPath |
| Android에서 못 읽음 | 압축된 APK | UnityWebRequest |
| 저장이 안 됨 | 쓰기 불가 경로 | `persistentDataPath` |
| 파일이 손상됨 | 직접 덮어쓰기 | 임시 파일 → 교체 |
| 구버전 세이브 오류 | 마이그레이션 없음 | 버전 필드 + Migrate |
| **덱 무한 루프** | 재구성 조건 누락 | `discard.Count == 0` 검사 |
| 셔플 편향 | 잘못된 알고리즘 | Fisher-Yates |
| 원본 SO 오염 | 직접 수정 | 별도 저장 또는 Instance |
| 턴이 안 넘어감 | `phase` 미변경 | 버튼에서 `EndTurn` |
| 마나가 안 깎임 | 순서 문제 | 효과 전에 차감 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **SO vs JSON** | 애셋 참조 / **빌드 후 수정** |
| `JsonUtility` | 빠름. 제약 많음 |
| **최상위 배열 불가** | 래퍼 객체로 감싼다 |
| 속성은 직렬화 안 됨 | public 필드로 |
| Newtonsoft | Dictionary·다형성 필요할 때 |
| **`persistentDataPath`** | 세이브 저장 위치 |
| **`streamingAssetsPath`** | 배포 데이터. 빌드 후 수정 가능 |
| **안전 저장** | 임시 → 백업 → 교체 (Day 59) |
| **버전 + 매직** | 검증과 마이그레이션 (Day 59) |
| 폴백 | 실패해도 게임은 돌아야 한다 |
| 밸런스 오버라이드 | SO 위에 JSON을 얹는다 |
| 덱 시스템 | 덱 → 손패 → 버림 → 재구성 |
| 턴 FSM | Day 46·69의 재사용. 코루틴 |
| 효과 처리 | switch(단순) / SO 전략(확장) |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| Day 26 `fopen`/`fwrite` | `File.WriteAllText` |
| Day 59 매직 + 버전 | `magic` + `version` 필드 |
| Day 59 안전 저장 | 임시 파일 → `File.Move` |
| Day 59 검증 실패 시 기본값 | 폴백 객체 |
| Day 46 FSM | `TurnPhase` enum |
| Day 69 턴 교대 | 코루틴 `RunTurn` |
| Day 28 가상 함수 | `CardEffectSO` 다형성 |
| Day 53 역순 순회 | `DiscardHand` |

### Week 16 정리 — 보드게임

| Day | 만든 것 |
|:--:|---|
| Day 76 | Canvas·RectTransform (앵커·피벗) |
| Day 77 | 레이아웃 그룹·스크롤 뷰 |
| Day 78 | ScriptableObject (데이터 분리) |
| **Day 79** | **JSON (빌드 후 수정)** |
| Day 80 | 드래그&드롭·연출 (내일) |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 80** | 카드 사용 → 효과 발동 |
| Day 90 | 레이싱 기록 저장 |
| Day 96 | 빌드 파이프라인·설정 관리 |
| Day 101+ | 파이널 프로젝트 세이브 시스템 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 덱 프리셋 3개 (`deck_fire.json` 등) 만들어 선택 | 파일명을 인자로 |
| ★★ | 세이브 슬롯 3개 | `save_0.json` ~ `save_2.json` |
| ★★ | 통계 저장 (카드별 사용 횟수) | Dictionary → List 변환 |
| ★★★ | Newtonsoft로 교체하고 Dictionary 직접 저장 | 패키지 추가 |
| ★★★ | 세이브 파일 암호화 (간단한 XOR) | Day 26의 바이트 조작 |
| ★★★★ | JSON 스키마 검증기 (필수 필드 확인) | 리플렉션 |

### 다음 시간

> 데이터도 로직도 됐다. 그런데 **카드를 낼 방법이 없다.**
>
> ```
>   지금:  키보드로 인덱스 지정?

>   필요:  카드를 마우스로 끌어다
>          필드에 놓으면 효과가 발동
> ```
>
> Unity 이벤트 시스템으로 **드래그&드롭**을 만들고,
> 코루틴으로 **연출**을 붙여 문서 14를 완성한다.
>
> → **Day 80, 드래그&드롭·연출 · 문서 14 완성**
