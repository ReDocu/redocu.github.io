# Day 078 · ScriptableObject — 데이터를 코드 밖으로

> **Week 16** · 연결 문서 `14 보드게임` — Step 3
> 선수: Day 077 (레이아웃 그룹), Day 059 (파일 포맷 설계)

---

## 1. 오늘 만드는 것

**에디터에서 카드 수치를 고치면 코드 수정 없이 반영된다.**

```
   ┌──────────────────────────────┬─────────────────────────────┐
   │  Project                     │  Inspector                  │
   │  ▾ Assets/Data/Cards         │  Card_Fireball (Card Data)  │
   │      Card_Fireball    ◆      │                             │
   │      Card_Heal        ◆      │  ─ 기본 정보 ─               │
   │      Card_Shield      ◆      │   Id          fireball      │
   │      Card_Lightning   ◆      │   Display Name  화염구       │
   │      Card_Summon      ◆      │   Art         [🖼 fire]      │
   │      ...                     │   Rarity      Rare ▾        │
   │  ▾ Assets/Data               │                             │
   │      CardDatabase     ▤      │  ─ 수치 ─                   │
   │                              │   Cost        ●───── 3      │
   ├──────────────────────────────┤   Power       ●────── 5     │
   │  Game                        │   Effect      Damage ▾      │
   │                              │   Effect Value  5           │
   │      ╱▣ ▣ ▣╲                │                             │
   │     ▣       ▣               │  ─ 설명 ─                   │
   │   화염구  치유  방패          │   적 하나에게 5의 피해를     │
   │    3⚡    2⚡   1⚡           │   입힌다.                    │
   └──────────────────────────────┴─────────────────────────────┘
```

**우클릭 → Create → Card Data 로 새 카드를 만들면 게임에 바로 등장한다.**

<!-- SHOT: Day 78 완성 화면 -->

---

## 2. 막히는 상황

어제 카드 이름을 코드에 넣었다.

```csharp
    string[] names = { "화염구", "치유", "방패", "벼락", "소환",
                       "독가스", "회복", "강타", "은신", "분노" };
```

**카드를 제대로 만들어 보자.**

```csharp
public struct CardInfo
{
    public string name;
    public int cost;
    public int power;
    public string description;
}

public static class CardTable
{
    public static readonly CardInfo[] Cards = new CardInfo[]
    {
        new CardInfo { name = "화염구", cost = 3, power = 5,
                       description = "적 하나에게 5의 피해" },
        new CardInfo { name = "치유",   cost = 2, power = 0,
                       description = "체력 4 회복" },
        // ... 50종 ...
    };
}
```

```
   ★ 문제가 쌓인다

   ① 카드 이미지는? → 코드에 못 넣는다
   ② 밸런싱 한 번에 재컴파일 (30초~수 분)
   ③ 기획자가 코드를 만져야 한다
   ④ 실수로 다른 코드를 건드릴 위험
   ⑤ 50종이면 파일이 1000줄
```

```
   Part 2에서 같은 문제를 겪었다

   Day 59:  맵 데이터를 코드에 박아 넣을 수 없다
            → .map 바이너리 포맷을 설계했다

   Day 69:  무기 수치를 표(배열)로 분리했다
            const WeaponInfo WEAPONS[] = { ... };
```

```
   ★ 그런데 Unity에는 "이미지 참조"라는 문제가 있다

   파일에 "fire.png" 라고 써도
   → 실행 중에 그 파일을 찾아 로드해야 한다
   → 경로가 바뀌면 깨진다
```

> **ScriptableObject가 이 둘을 동시에 해결한다.**

---

## 3. 개념

### 3-1. ScriptableObject란

**왜 필요한가** — 애셋으로 존재하는 데이터 컨테이너.

```
   MonoBehaviour                 ScriptableObject

   GameObject에 붙는다            애셋 파일로 존재한다
   씬 안에 있다                   Project 창에 있다
   Update가 있다                  Update가 없다
   위치·회전이 있다               데이터만 있다
   씬마다 복사본                  ★ 하나를 여럿이 참조
```

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "Card_", menuName = "Card Game/Card Data")]
public class CardData : ScriptableObject
{
    public string displayName;
    public int cost;
    public int power;
    [TextArea] public string description;
    public Sprite art;                         // ★ 이미지 직접 참조
}
```

```
   Project 우클릭 → Create → Card Game → Card Data
   → Card_.asset 이 생긴다
```

```
   ★ 핵심 이점

   ① 이미지·오디오·프리팹을 직접 참조할 수 있다
   ② 에디터에서 편집. 재컴파일 없음
   ③ 여러 오브젝트가 같은 데이터를 공유 (메모리 절약)
   ④ 기획자가 직접 만들 수 있다
```

### 3-2. `[CreateAssetMenu]`

**왜 필요한가** — 우클릭 메뉴에 등록한다.

```csharp
[CreateAssetMenu(
    fileName = "Card_",                        // 기본 파일명
    menuName = "Card Game/Card Data",          // 메뉴 경로
    order = 0                                  // 메뉴 순서
)]
```

```
   menuName = "Card Game/Card Data"

   Create
   ├─ Folder
   ├─ C# Script
   ├─ ...
   └─ Card Game        ★ 하위 메뉴
       └─ Card Data
```

```
   ⚠️ 메뉴에 안 나오는 경우

   ① 어트리뷰트 오타
   ② 클래스명 ≠ 파일명
   ③ ScriptableObject 미상속
   ④ 컴파일 오류 (Console 확인)
```

### 3-3. ⚠️ 값 변경의 지속성

**왜 필요한가** — 가장 헷갈리는 부분.

```
   ★ 에디터에서 Play 중 ScriptableObject 값을 바꾸면

   → Play를 정지해도 값이 유지된다  ★ MonoBehaviour와 반대!

   ★ 빌드에서 Play 중 값을 바꾸면

   → 종료하면 사라진다 (원본 애셋은 읽기 전용)
```

| | 에디터 | 빌드 |
|---|---|---|
| MonoBehaviour 필드 | Play 후 **되돌아감** | 세션 동안 유지 |
| ScriptableObject 필드 | **유지됨** ⚠️ | 세션 동안 유지 |

```
   ⚠️ 이것 때문에 생기는 버그

   런타임에 카드의 hp를 깎았는데
   → 에디터에서 원본 애셋이 깎인 채로 남는다
   → 다음 실행 때 이미 체력이 깎여 있다
```

```
   ★ 해결 — 마스터 데이터와 런타임 상태를 분리한다

   CardData (ScriptableObject)  =  변하지 않는 설계값
   CardInstance (일반 class)    =  게임 중 변하는 상태
```

```csharp
public class CardInstance
{
    public CardData Data { get; }              // ★ 읽기 전용 참조
    public int CurrentPower { get; set; }      // ★ 런타임 상태
    public bool IsExhausted { get; set; }

    public CardInstance(CardData data)
    {
        Data = data;
        CurrentPower = data.power;             // 복사
    }
}
```

```
   ★ 이 분리가 오늘의 가장 중요한 설계다

   Part 2 Day 40에서 배운 것과 같다
   "설계도(클래스)와 인스턴스(객체)를 나눈다"
```

### 3-4. 데이터 설계

**왜 필요한가** — 나중에 바꾸기 어렵다.

```csharp
using UnityEngine;

public enum CardRarity { Common, Uncommon, Rare, Epic, Legendary }

public enum CardType { Attack, Skill, Power }

public enum EffectType
{
    None,
    Damage,             // 피해
    Heal,               // 회복
    Shield,             // 방어막
    Draw,               // 카드 드로우
    ManaGain,           // 마나 획득
    Summon,             // 소환
}

[CreateAssetMenu(fileName = "Card_", menuName = "Card Game/Card Data")]
public class CardData : ScriptableObject
{
    [Header("기본 정보")]
    [Tooltip("코드에서 참조할 고유 ID. 영문 소문자 권장")]
    public string id;

    public string displayName;

    [Tooltip("카드 일러스트")]
    public Sprite art;

    public CardRarity rarity = CardRarity.Common;
    public CardType type = CardType.Attack;

    [Header("수치")]
    [Range(0, 10)]
    public int cost = 1;

    [Range(0, 30)]
    public int power = 0;

    [Header("효과")]
    public EffectType effect = EffectType.Damage;

    [Range(0, 30)]
    public int effectValue = 0;

    [Tooltip("대상을 지정해야 하는 카드인가")]
    public bool needsTarget = true;

    [Header("설명")]
    [TextArea(3, 6)]
    public string description;

    // ─── 파생 값 ───

    public string RarityColorHex => rarity switch
    {
        CardRarity.Common    => "#B0B0B0",
        CardRarity.Uncommon  => "#4CAF50",
        CardRarity.Rare      => "#2196F3",
        CardRarity.Epic      => "#9C27B0",
        CardRarity.Legendary => "#FF9800",
        _ => "#FFFFFF"
    };

    // ─── 검증 ───

    void OnValidate()                          // ★ Inspector에서 값이 바뀔 때 호출
    {
        if (string.IsNullOrEmpty(id))
            id = name.Replace("Card_", "").ToLower();

        if (string.IsNullOrEmpty(displayName))
            displayName = id;

        if (effect == EffectType.None && effectValue > 0)
            Debug.LogWarning($"[{name}] 효과가 None인데 값이 있다", this);
    }
}
```

```
   ★ OnValidate

   Inspector에서 값을 바꿀 때마다 호출된다
   → 자동 채우기, 검증에 유용
   → 에디터에서만 동작 (빌드에는 없음)
```

```
   ★ switch 식 (C# 8+)

   rarity switch { A => x, B => y, _ => z }

   기존 switch 문보다 간결
```

### 3-5. 유용한 어트리뷰트

**왜 필요한가** — Inspector를 읽기 좋게.

| 어트리뷰트 | 효과 |
|---|---|
| `[Header("제목")]` | 구분선 + 제목 |
| `[Space(10)]` | 여백 |
| `[Tooltip("설명")]` | 마우스 오버 시 설명 |
| `[Range(0, 10)]` | 슬라이더 |
| `[TextArea(3, 6)]` | 여러 줄 텍스트 |
| `[Multiline(3)]` | 여러 줄 (고정) |
| `[SerializeField]` | private 노출 |
| `[HideInInspector]` | public 숨김 |
| `[ContextMenu("이름")]` | 컴포넌트 우클릭 메뉴 |
| `[ContextMenuItem("이름","메서드")]` | 필드 우클릭 메뉴 |

```csharp
    [ContextMenu("ID 자동 생성")]
    private void GenerateId()
    {
        id = name.Replace("Card_", "").ToLower();
        Debug.Log($"ID: {id}");
    }
```

```
   ★ 컴포넌트 헤더 우클릭 → "ID 자동 생성" 이 나온다
```

### 3-6. Database — 목록을 담는 ScriptableObject

**왜 필요한가** — 카드들을 한곳에 모은다.

```csharp
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "CardDatabase", menuName = "Card Game/Card Database")]
public class CardDatabase : ScriptableObject
{
    [SerializeField] private List<CardData> cards = new List<CardData>();

    private Dictionary<string, CardData> lookup;

    public IReadOnlyList<CardData> All => cards;
    public int Count => cards.Count;

    public void BuildLookup()
    {
        lookup = new Dictionary<string, CardData>();

        foreach (CardData c in cards)
        {
            if (c == null) continue;

            if (string.IsNullOrEmpty(c.id))
            {
                Debug.LogError($"[DB] ID 없음: {c.name}", c);
                continue;
            }

            if (lookup.ContainsKey(c.id))
            {
                Debug.LogError($"[DB] ID 중복: {c.id}", c);
                continue;
            }

            lookup[c.id] = c;
        }
    }

    public CardData GetById(string id)
    {
        if (lookup == null) BuildLookup();

        if (lookup.TryGetValue(id, out CardData c)) return c;

        Debug.LogError($"[DB] '{id}' 없음");
        return null;
    }

    public CardData GetRandom()
    {
        if (cards.Count == 0) return null;
        return cards[Random.Range(0, cards.Count)];
    }

    public List<CardData> GetByRarity(CardRarity r)
    {
        List<CardData> result = new List<CardData>();
        foreach (CardData c in cards)
            if (c != null && c.rarity == r) result.Add(c);
        return result;
    }
}
```

```
   ★ Dictionary로 O(1) 조회

   Day 63의 A*에서 우선순위 큐를 쓴 것과 같은 발상
   → 자료구조 선택이 성능을 만든다

   리스트 선형 검색:  O(n)
   Dictionary:        O(1)
```

```
   ⚠️ ScriptableObject는 Dictionary를 직렬화하지 못한다

   → List로 저장하고, 런타임에 Dictionary를 만든다
```

### 3-7. 에디터 자동 수집

**왜 필요한가** — 카드 50장을 손으로 등록할 수는 없다.

```csharp
#if UNITY_EDITOR
using UnityEditor;
#endif

public class CardDatabase : ScriptableObject
{
    // ...

#if UNITY_EDITOR
    [ContextMenu("모든 카드 자동 수집")]
    private void CollectAll()
    {
        cards.Clear();

        // ★ 프로젝트 전체에서 CardData 타입 애셋을 찾는다
        string[] guids = AssetDatabase.FindAssets("t:CardData");

        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            CardData c = AssetDatabase.LoadAssetAtPath<CardData>(path);
            if (c != null) cards.Add(c);
        }

        // 이름순 정렬
        cards.Sort((a, b) => string.Compare(a.name, b.name));

        EditorUtility.SetDirty(this);          // ★ 변경됨 표시
        AssetDatabase.SaveAssets();

        Debug.Log($"[DB] {cards.Count}장 수집 완료");
    }
#endif
}
```

```
   ★ #if UNITY_EDITOR

   AssetDatabase는 에디터 전용 API
   빌드에 포함되면 컴파일 오류가 난다
```

```
   ⚠️ 자동 수집의 함정

   테스트용 임시 카드까지 들어온다
   → 폴더를 지정해 범위를 좁힌다
```

```csharp
        string[] guids = AssetDatabase.FindAssets("t:CardData",
                                                  new[] { "Assets/Data/Cards" });
```

### 3-8. 프리팹과 데이터 연결

**왜 필요한가** — 데이터를 화면에 표시한다.

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class CardView : MonoBehaviour
{
    [Header("참조")]
    [SerializeField] private Image frame;
    [SerializeField] private Image art;
    [SerializeField] private TextMeshProUGUI nameText;
    [SerializeField] private TextMeshProUGUI costText;
    [SerializeField] private TextMeshProUGUI powerText;
    [SerializeField] private TextMeshProUGUI descText;
    [SerializeField] private Image rarityBand;

    [Header("색")]
    [SerializeField] private Color affordableColor = Color.white;
    [SerializeField] private Color unaffordableColor = new Color(1f, 0.4f, 0.4f);

    public CardInstance Instance { get; private set; }

    public void Setup(CardInstance instance)
    {
        Instance = instance;
        CardData d = instance.Data;

        nameText.text = d.displayName;
        costText.text = d.cost.ToString();
        descText.text = d.description;

        // 파워가 0이면 숨긴다
        powerText.gameObject.SetActive(d.power > 0);
        if (d.power > 0) powerText.text = instance.CurrentPower.ToString();

        art.sprite = d.art;
        art.enabled = (d.art != null);         // ★ null 처리

        if (ColorUtility.TryParseHtmlString(d.RarityColorHex, out Color c))
            rarityBand.color = c;

        gameObject.name = $"Card_{d.id}";      // ★ Hierarchy에서 찾기 쉽게
    }

    public void UpdateAffordable(int currentMana)
    {
        bool ok = Instance != null && currentMana >= Instance.Data.cost;
        frame.color = ok ? affordableColor : unaffordableColor;
    }
}
```

```
   ★ Setup(데이터) 패턴

   프리팹은 "빈 껍데기"
   데이터를 받아 자기를 채운다

   → 카드 종류마다 프리팹을 만들 필요가 없다
   → 프리팹 1개 + 데이터 50개
```

```
   ⚠️ art가 null이면

   Image가 흰 사각형으로 보인다
   → enabled를 끄거나 기본 스프라이트를 지정
```

### 3-9. 스프라이트 임포트

**왜 필요한가** — 이미지가 안 나오는 흔한 원인.

```
   이미지 파일 선택 → Inspector

   Texture Type:  Sprite (2D and UI)     ★ 중요
   Sprite Mode:   Single / Multiple
   Pixels Per Unit: 100
   Filter Mode:   Bilinear (또는 Point — 픽셀아트)
   Compression:   Normal Quality
   Max Size:      2048
```

```
   ⚠️ Texture Type이 Default면

   Sprite 필드에 드래그가 안 된다
   → Sprite (2D and UI) 로 변경
```

```
   ★ 픽셀아트라면

   Filter Mode: Point (no filter)
   Compression: None

   → 흐려지지 않는다
```

### 3-10. ScriptableObject의 다른 용도

**왜 필요한가** — 데이터 저장 말고도 쓸모가 많다.

**① 설정 애셋**

```csharp
[CreateAssetMenu(menuName = "Card Game/Game Config")]
public class GameConfig : ScriptableObject
{
    [Header("규칙")]
    public int startingHandSize = 5;
    public int maxHandSize = 10;
    public int drawPerTurn = 1;
    public int startingMana = 3;
    public int maxMana = 10;
    public int startingHp = 30;

    [Header("연출")]
    public float drawAnimTime = 0.3f;
    public float playAnimTime = 0.25f;
}
```

```
   ★ Day 69의 밸런싱 상수들이 여기로 온다

   Part 2:  const double GRAVITY = 400.0;   → 코드 수정 + 재빌드
   Unity:   GameConfig 애셋            → 클릭 몇 번
```

**② 이벤트 채널**

```csharp
[CreateAssetMenu(menuName = "Card Game/Event/Void Event")]
public class VoidEventChannel : ScriptableObject
{
    public event System.Action OnRaised;

    public void Raise() => OnRaised?.Invoke();
}
```

```
   ★ 씬 간 참조 없이 통신

   A가 이벤트 애셋을 Raise
   B가 그 애셋을 구독

   → A와 B가 서로를 몰라도 된다
```

```
   ⚠️ 이벤트 채널은 구독 해제를 꼭 해야 한다

   ScriptableObject는 씬 전환에도 살아남는다
   → 파괴된 오브젝트가 구독한 채로 남으면 예외
```

**③ 런타임 세트 (활성 오브젝트 목록)**

```csharp
[CreateAssetMenu(menuName = "Card Game/Runtime Set/Enemy")]
public class EnemyRuntimeSet : ScriptableObject
{
    private readonly List<Enemy> items = new List<Enemy>();

    public IReadOnlyList<Enemy> Items => items;

    public void Add(Enemy e)    { if (!items.Contains(e)) items.Add(e); }
    public void Remove(Enemy e) { items.Remove(e); }

    void OnDisable() => items.Clear();         // ★ 플레이 종료 시 정리
}
```

```
   ★ FindObjectsOfType 대신 쓴다

   Day 72에서 배운 것 — Find는 매우 느리다
```

### 3-11. ScriptableObject vs 다른 방식

**왜 필요한가** — 언제 무엇을 쓸지.

| | 코드 상수 | **ScriptableObject** | JSON |
|---|---|---|---|
| 편집 | 코드 | **에디터** | 텍스트 |
| 재컴파일 | 필요 | **불필요** | 불필요 |
| 애셋 참조 | 불가 | **직접 가능** | 경로/ID |
| 빌드 후 수정 | 불가 | 불가 | **가능** |
| 버전 관리 | 텍스트 diff | 바이너리/YAML | **텍스트 diff** |
| 기획자 편집 | 어려움 | **쉬움** | 보통 |
| 외부 툴 연동 | 불가 | 어려움 | **쉬움** |

```
   ★ 실무 조합

   마스터 데이터 (카드, 아이템)  →  ScriptableObject
   밸런스 패치                    →  JSON (Day 79)
   세이브 데이터                  →  JSON
   설정                           →  ScriptableObject + PlayerPrefs
```

```
   ⚠️ ScriptableObject의 버전 관리

   기본은 바이너리라 diff가 안 보인다

   Edit → Project Settings → Editor
   → Asset Serialization: Force Text

   → YAML로 저장되어 Git diff가 읽힌다  ★ 권장
```

---

## 4. 따라 만들기

### Step 1 — 폴더 준비

```
   Assets/Data/
   ├─ Cards/
   ├─ Config/
   └─ Sprites/
```

**✅ 여기까지 하면** — 구조가 잡힌다.

### Step 2 — CardData 작성

3-4절의 `CardData.cs`를 `Scripts/Data/` 에 만든다.

```
   ⚠️ 파일명은 반드시 CardData.cs
```

**✅ 여기까지 하면** — 컴파일이 끝나면 메뉴가 생긴다.

### Step 3 — 첫 카드 만들기

```
   Assets/Data/Cards 우클릭
   → Create → Card Game → Card Data
   → 이름: Card_Fireball
```

```
   Inspector 입력
   Id:            fireball
   Display Name:  화염구
   Rarity:        Rare
   Type:          Attack
   Cost:          3
   Power:         5
   Effect:        Damage
   Effect Value:  5
   Needs Target:  ✔
   Description:   적 하나에게 5의 피해를 입힌다.
```

**✅ 여기까지 하면** — 카드 애셋 하나 완성.

<!-- SHOT: Step 3 첫 카드 애셋 -->

### Step 4 — OnValidate 확인

**새 카드를 만들고 Id를 비워 둔다.**

```
   Card_Heal 로 이름을 바꾸면
   → Id가 자동으로 "heal" 이 된다
```

**Effect를 None으로 두고 Effect Value를 5로 준다.**

```
   Console: [Card_Heal] 효과가 None인데 값이 있다
```

```
   ★ 로그를 클릭하면 해당 애셋이 선택된다
     (Debug.Log의 두 번째 인자 this 덕분)
```

### Step 5 — 카드 10종 만들기

| 파일명 | ID | 이름 | 코스트 | 파워 | 효과 | 값 |
|---|---|---|:--:|:--:|---|:--:|
| Card_Fireball | fireball | 화염구 | 3 | 5 | Damage | 5 |
| Card_Strike | strike | 강타 | 1 | 3 | Damage | 3 |
| Card_Lightning | lightning | 벼락 | 5 | 9 | Damage | 9 |
| Card_Heal | heal | 치유 | 2 | 0 | Heal | 4 |
| Card_GreatHeal | great_heal | 대치유 | 4 | 0 | Heal | 10 |
| Card_Shield | shield | 방패 | 1 | 0 | Shield | 5 |
| Card_IronWall | iron_wall | 철벽 | 3 | 0 | Shield | 12 |
| Card_Insight | insight | 통찰 | 1 | 0 | Draw | 2 |
| Card_Mana | mana | 마력 | 0 | 0 | ManaGain | 2 |
| Card_Summon | summon | 소환 | 4 | 6 | Summon | 1 |

```
   ⚠️ 하나씩 만드는 게 지루하다면

   Card_Fireball 선택 → Ctrl+D 복제 → 값 수정
```

**✅ 여기까지 하면** — 카드 10장.

### Step 6 — 스프라이트 준비

```
   무료 아이콘을 Assets/Data/Sprites/ 에 넣는다
   (game-icons.net, Kenney 등)

   각 이미지 선택 → Texture Type: Sprite (2D and UI) → Apply
```

**각 카드의 Art 필드에 드래그한다.**

**✅ 여기까지 하면** — 카드에 이미지가 연결된다.

```
   ⚠️ 드래그가 안 되면

   Texture Type이 Sprite인지 확인
```

### Step 7 — CardDatabase

3-6·3-7절의 `CardDatabase.cs`를 만든다.

```
   Assets/Data 우클릭
   → Create → Card Game → Card Database
   → 이름: CardDatabase
```

**컴포넌트 헤더 우클릭 → "모든 카드 자동 수집"**

**✅ 여기까지 하면**

```
   Console: [DB] 10장 수집 완료
```

<!-- SHOT: Step 7 데이터베이스 -->

### Step 8 — ID 중복 검사

**두 카드의 Id를 똑같이 만들어 본다.**

```csharp
    // 실행 시 BuildLookup이 호출되면
    Console: [DB] ID 중복: fireball
```

```
   ★ 로그를 클릭하면 문제의 애셋이 선택된다
```

> **되돌린다.**

### Step 9 — CardInstance

3-3절의 `CardInstance`를 만든다.

```csharp
public class CardInstance
{
    private static int nextUid = 1;

    public int Uid { get; }                    // ★ 같은 카드 2장을 구분
    public CardData Data { get; }

    public int CurrentPower { get; set; }
    public int TempCostModifier { get; set; }
    public bool IsExhausted { get; set; }

    public int CurrentCost => Mathf.Max(0, Data.cost + TempCostModifier);

    public CardInstance(CardData data)
    {
        Uid = nextUid++;
        Data = data;
        CurrentPower = data.power;
    }

    public void ResetTurnState()
    {
        TempCostModifier = 0;
    }

    public override string ToString()
        => $"{Data.displayName}#{Uid}(cost {CurrentCost})";
}
```

```
   ★ Uid가 필요한 이유

   덱에 화염구가 3장 있을 때
   "이 화염구"를 특정해야 한다

   Part 2 Day 52의 오브젝트 풀 인덱스와 같은 역할
```

### Step 10 — CardView

3-8절의 `CardView.cs`를 만들고 `P_Card` 프리팹에 붙인다.

```
   Inspector에서 자식 요소들을 연결
   Frame, Art, NameText, CostText, PowerText, DescText, RarityBand
```

**✅ 여기까지 하면** — 프리팹이 준비된다.

### Step 11 — 데이터로 카드 생성

```csharp
using System.Collections.Generic;
using UnityEngine;

public class DeckTest : MonoBehaviour
{
    [SerializeField] private CardDatabase database;
    [SerializeField] private GameObject cardPrefab;
    [SerializeField] private HandLayout hand;
    [SerializeField] private int currentMana = 3;

    private readonly List<CardInstance> deck = new List<CardInstance>();

    void Start()
    {
        database.BuildLookup();
        BuildDeck();

        Debug.Log($"[덱] {deck.Count}장 구성");
    }

    private void BuildDeck()
    {
        deck.Clear();

        // ★ 각 카드를 2장씩
        foreach (CardData d in database.All)
        {
            deck.Add(new CardInstance(d));
            deck.Add(new CardInstance(d));
        }

        Shuffle(deck);
    }

    private void Shuffle<T>(List<T> list)
    {
        // ★ Fisher-Yates
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = Random.Range(0, i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.D)) Draw();
        if (Input.GetKeyDown(KeyCode.F)) DiscardRandom();

        if (Input.GetKeyDown(KeyCode.Equals)) ChangeMana(+1);
        if (Input.GetKeyDown(KeyCode.Minus))  ChangeMana(-1);
    }

    private void Draw()
    {
        if (deck.Count == 0) { Debug.Log("[덱] 소진"); return; }
        if (hand.Count >= 10) { Debug.Log("[손패] 상한"); return; }

        CardInstance inst = deck[0];
        deck.RemoveAt(0);

        GameObject go = Instantiate(cardPrefab);
        CardView view = go.GetComponent<CardView>();

        view.Setup(inst);                      // ★ 데이터 주입
        view.UpdateAffordable(currentMana);

        hand.Add(go.GetComponent<RectTransform>());

        Debug.Log($"[드로우] {inst}  남은 덱 {deck.Count}");
    }

    private void ChangeMana(int delta)
    {
        currentMana = Mathf.Clamp(currentMana + delta, 0, 10);
        RefreshAffordable();
        Debug.Log($"[마나] {currentMana}");
    }

    private void RefreshAffordable()
    {
        foreach (RectTransform rt in hand.Cards)
        {
            CardView v = rt.GetComponent<CardView>();
            if (v != null) v.UpdateAffordable(currentMana);
        }
    }
}
```

```csharp
    // HandLayout에 추가
    public IReadOnlyList<RectTransform> Cards => cards;
```

```
   ★ Fisher-Yates 셔플

   for i from n-1 downto 1:
       j = random(0, i)
       swap(a[i], a[j])

   → 모든 순열이 같은 확률
```

```
   ⚠️ 잘못된 셔플

   for (int i = 0; i < n; i++)
       swap(a[i], a[random(0, n)]);           // ✗ 편향된다

   Day 16에서 배운 난수의 함정
```

**✅ 여기까지 실행하면** — D를 누르면 실제 카드 데이터로 카드가 만들어진다.

<!-- SHOT: Step 11 데이터 기반 카드 -->

### Step 12 — 코드 수정 없이 카드 추가

**게임을 정지하고 새 카드를 만든다.**

```
   Card_Poison
   Id: poison,  이름: 독가스,  Cost 2,  Power 2
   Effect: Damage,  Value 2
   Description: 적에게 2의 피해. 3턴간 지속.
```

**CardDatabase에서 "모든 카드 자동 수집" 실행.**

**Play.**

**✅ 여기까지 하면**

```
   ★ 스크립트를 한 줄도 안 건드렸는데
     새 카드가 덱에 등장한다
```

> ### ★ 이것이 오늘의 핵심 확인이다

### Step 13 — 밸런싱 실습

**Play 중에 `Card_Fireball`의 Cost를 3 → 1로 바꾼다.**

```
   ★ 다음에 뽑는 화염구부터 코스트 1
   ★ 재컴파일 없음
```

```
   ⚠️ 이미 손패에 있는 카드는?

   CardInstance가 생성 시점의 값을 복사했다면 안 바뀐다
   Data를 참조한다면 바뀐다

   → CurrentCost => Data.cost + modifier 이므로 바뀐다
```

**Play를 정지한다.**

```
   ★ Cost가 1로 유지된다 (3-3절)

   → 실수로 바꾼 값이 남을 수 있다.  주의
```

> **3으로 되돌린다.**

### Step 14 — 런타임 오염 실험

```csharp
    // ✗ 일부러 잘못된 코드
    private void DamageCard(CardInstance inst)
    {
        inst.Data.power -= 1;                  // ★ 원본 애셋을 수정!
    }
```

**여러 번 호출하고 Play를 정지한다.**

**✅ 이렇게 하면**

```
   ★ 원본 카드의 Power가 영구히 깎였다

   Card_Fireball  Power 5 → 1
```

```
   ★ 3-3절에서 경고한 그 문제
```

```csharp
    // ✔ 올바른 코드
    private void DamageCard(CardInstance inst)
    {
        inst.CurrentPower -= 1;                // 런타임 상태만
    }
```

> **되돌리고 Power를 5로 복구한다.**

### Step 15 — GameConfig

3-10절의 `GameConfig`를 만들고 애셋을 생성한다.

```csharp
    // DeckTest에서 사용
    [SerializeField] private GameConfig config;

    void Start()
    {
        currentMana = config.startingMana;

        for (int i = 0; i < config.startingHandSize; i++)
            Draw();
    }
```

**✅ 여기까지 실행하면** — 시작 시 설정대로 5장을 뽑는다.

**Inspector에서 `startingHandSize`를 3으로 바꾸고 재실행.**

```
   → 3장만 뽑는다.  재컴파일 없음
```

### Step 16 — 텍스트 직렬화 설정

```
   Edit → Project Settings → Editor
   → Asset Serialization → Mode: Force Text
```

**`Card_Fireball.asset`을 메모장으로 열어 본다.**

```yaml
%YAML 1.1
--- !u!114 &11400000
MonoBehaviour:
  m_Script: {fileID: 11500000, guid: a1b2c3..., type: 3}
  m_Name: Card_Fireball
  id: fireball
  displayName: "화염구"
  cost: 3
  power: 5
  effect: 1
  effectValue: 5
  description: "..."
```

```
   ★ 이제 Git diff로 무엇이 바뀌었는지 보인다

   Day 96(Git)에서 중요해진다
```

### Step 17 — 희귀도별 통계

```csharp
#if UNITY_EDITOR
    [ContextMenu("통계 출력")]
    private void PrintStats()
    {
        int[] byRarity = new int[5];
        int totalCost = 0;

        foreach (CardData c in cards)
        {
            if (c == null) continue;
            byRarity[(int)c.rarity]++;
            totalCost += c.cost;
        }

        Debug.Log($"[DB] 총 {cards.Count}장, 평균 코스트 {(float)totalCost/cards.Count:F2}");

        string[] names = { "Common", "Uncommon", "Rare", "Epic", "Legendary" };
        for (int i = 0; i < 5; i++)
            Debug.Log($"  {names[i],-10} {byRarity[i]}장");
    }
#endif
```

**✅ 여기까지 하면**

```
   [DB] 총 11장, 평균 코스트 2.36
     Common     5장
     Uncommon   2장
     Rare       3장
     Epic       1장
     Legendary  0장
```

```
   ★ 밸런싱 지표를 에디터에서 바로 본다
```

### Step 18 — 정리

```
   최종 구조

   Assets/Data/
   ├─ Cards/           CardData 애셋 11개
   ├─ Config/          GameConfig
   ├─ Sprites/         카드 아트
   └─ CardDatabase.asset

   Assets/Scripts/
   ├─ Data/
   │   ├─ CardData.cs
   │   ├─ CardDatabase.cs
   │   └─ GameConfig.cs
   ├─ Runtime/
   │   └─ CardInstance.cs
   └─ UI/
       ├─ CardView.cs
       └─ HandLayout.cs
```

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌──────────────────────────────┬─────────────────────────────┐
   │  Project                     │  Inspector                  │
   │  ▾ Assets/Data/Cards         │  Card_Fireball (Card Data)  │
   │      Card_Fireball    ◆      │  ─ 기본 정보 ─               │
   │      Card_Heal        ◆      │   Id          fireball      │
   │      Card_Shield      ◆      │   Display Name  화염구       │
   │      Card_Lightning   ◆      │   Rarity      Rare ▾        │
   │      ...  (11개)             │  ─ 수치 ─                   │
   ├──────────────────────────────┤   Cost        ●───── 3      │
   │  Game                        │   Power       ●────── 5     │
   │      ╱▣ ▣ ▣╲                │  ─ 효과 ─                   │
   │     ▣       ▣               │   Effect      Damage ▾      │
   │   화염구  치유  방패          │   Effect Value  5           │
   │    3⚡    2⚡   1⚡           │  ─ 설명 ─                   │
   │                              │   적 하나에게 5의 피해를     │
   │  마나 3   덱 17              │   입힌다.                    │
   └──────────────────────────────┴─────────────────────────────┘
```

- [ ] `Create → Card Game → Card Data` 메뉴가 나온다
- [ ] 카드 애셋 10종 이상을 만들었다
- [ ] `OnValidate`가 Id를 자동 채운다
- [ ] 경고 로그를 클릭하면 해당 애셋이 선택된다
- [ ] 스프라이트가 카드에 연결된다
- [ ] CardDatabase가 자동 수집된다
- [ ] ID 중복이 검출된다
- [ ] `Setup(데이터)`로 프리팹 하나가 모든 카드를 표현한다
- [ ] 마나가 부족하면 카드가 붉게 표시된다
- [ ] Fisher-Yates로 셔플된다
- [ ] **스크립트 수정 없이 새 카드가 게임에 등장한다**
- [ ] Play 중 수치를 바꾸면 즉시 반영된다
- [ ] Play 정지 후에도 값이 유지된다는 것을 확인했다
- [ ] `Data`를 직접 수정하면 원본이 오염된다는 것을 확인했다
- [ ] `CardInstance`로 런타임 상태를 분리했다
- [ ] GameConfig로 규칙을 조절할 수 있다
- [ ] Force Text로 YAML diff가 보인다
- [ ] 통계가 출력된다

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 메뉴에 안 나옴 | `[CreateAssetMenu]` 누락 | 어트리뷰트 확인 |
| 메뉴에 안 나옴 | 클래스명 ≠ 파일명 | 이름 일치 |
| 메뉴에 안 나옴 | 컴파일 오류 | Console 확인 |
| Sprite 드래그 안 됨 | Texture Type | Sprite (2D and UI) |
| 이미지가 흰 사각형 | art가 null | `enabled` 처리 |
| **원본 값이 오염됨** | `Data` 직접 수정 | `CardInstance` 사용 |
| Play 후 값이 남음 | SO의 특성 | 정상. 주의해서 편집 |
| Dictionary가 비어 있음 | `BuildLookup` 미호출 | Start에서 호출 |
| Dictionary가 직렬화 안 됨 | Unity 제약 | List로 저장 후 변환 |
| 빌드 오류 (AssetDatabase) | 에디터 전용 API | `#if UNITY_EDITOR` |
| 자동 수집에 테스트 카드 | 검색 범위 | 폴더 지정 |
| 셔플이 편향됨 | 잘못된 알고리즘 | Fisher-Yates |
| Git diff가 안 보임 | 바이너리 직렬화 | Force Text |
| SO 참조가 null | 씬에서 연결 안 함 | Inspector 드래그 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **ScriptableObject** | 애셋으로 존재하는 데이터. Update 없음 |
| `[CreateAssetMenu]` | 우클릭 생성 메뉴 등록 |
| **값 지속성** | 에디터에서 Play 후에도 **유지된다** |
| **마스터 vs 런타임** | `CardData` / `CardInstance` 분리 필수 |
| `OnValidate` | Inspector 변경 시 자동 검증 |
| `[TextArea]`, `[Range]` 등 | Inspector 가독성 |
| `[ContextMenu]` | 우클릭 유틸리티 |
| Database 패턴 | List 저장 + 런타임 Dictionary |
| 자동 수집 | `AssetDatabase.FindAssets` (에디터 전용) |
| `Setup(데이터)` | 프리팹 1개 + 데이터 N개 |
| Fisher-Yates | 편향 없는 셔플 |
| Force Text | YAML 직렬화. Git diff |
| SO의 다른 용도 | 설정 / 이벤트 채널 / 런타임 세트 |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| Day 59 `.map` 파일 포맷 | ScriptableObject 애셋 |
| Day 59 매직/버전 검증 | `OnValidate` |
| Day 69 `WEAPONS[]` 상수 표 | CardData 애셋들 |
| Day 40 클래스와 인스턴스 | CardData / CardInstance |
| Day 63 우선순위 큐 | Dictionary O(1) 조회 |
| Day 16 난수 편향 | Fisher-Yates |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 79** | JSON과 조합 — 빌드 후 수정 가능한 데이터 |
| Day 86 | 타워/적 데이터 |
| Day 91 | 차량 스펙 |
| Day 101+ | 파이널 프로젝트 마스터 데이터 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 카드 5종 추가 (스크립트 수정 없이) | Ctrl+D 복제 |
| ★★ | 희귀도별 등장 확률 (가중 랜덤) | 누적 확률 |
| ★★ | 적 데이터 SO 만들기 | `EnemyData : ScriptableObject` |
| ★★★ | 카드 효과를 SO로 분리 (전략 패턴) | `abstract class CardEffect : SO` |
| ★★★ | 에디터 창으로 카드 일괄 편집 | `EditorWindow` |
| ★★★★ | CSV → ScriptableObject 자동 생성 | `AssetDatabase.CreateAsset` |

### 다음 시간

> 카드 데이터가 애셋이 됐다. 그런데 **빌드하고 나면 못 고친다.**
>
> ```
>   상황

>   게임을 배포했다
>   → 화염구가 너무 강하다는 피드백
>   → 코스트를 4로 올리고 싶다
>   → ScriptableObject는 빌드에 박혀 있다
>   → 재빌드 + 재배포
> ```
>
> **밸런스 패치는 JSON으로 한다.**
> 그리고 Day 26·59에서 만든 세이브/로드가 Unity에서는 어떻게 되는지 본다.
>
> → **Day 79, JSON 로드와 게임 로직**
