# Day 093 · AI 레이서와 랩 판정

> **Week 19** · 연결 문서 `17 레이싱 게임` — Step 3
> 선수: Day 092 (주행 경로), Day 065 (전투와 AI)

---

## 1. 오늘 만드는 것

**AI 차량이 코너에서 감속하며 3랩을 완주한다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  LAP 2 / 3      순위 2 / 3                             │
   │  현재 랩  0:42.18                                       │
   │  베스트   0:38.94                                       │
   │                                                        │
   │       ╭─────────── 선행 지점                            │
   │      ╱                                                 │
   │   ╱█╲ ← AI (감속 중)      ╱█╲ ← 플레이어                │
   │    │                       │                           │
   │  ▓▓▓▓▓▓▓▓▓ 코너 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                     │
   │                                                        │
   │  ┌─ 순위 ────────────────────────┐                     │
   │  │ 1. AI_A     LAP 2  CP 3  ●    │                     │
   │  │ 2. PLAYER   LAP 2  CP 2  ●    │                     │
   │  │ 3. AI_B     LAP 1  CP 4  ●    │                     │
   │  └───────────────────────────────┘                     │
   │                                                        │
   │  AI 목표속도 96 km/h  현재 112 km/h  → 브레이크          │
   └────────────────────────────────────────────────────────┘
```

<!-- SHOT: Day 93 완성 화면 -->

---

## 2. 막히는 상황

경로는 만들었다. AI를 붙여 보자.

```csharp
    void Update()
    {
        Vector3 target = path.GetPointAtDistance(currentDist + 10f);
        transform.LookAt(target);
        transform.position += transform.forward * speed * Time.deltaTime;
    }
```

```
   ★ 문제

   × 물리를 무시하고 레일 위를 달린다
   × 플레이어와 부딪혀도 밀리지 않는다
   × 코너에서도 같은 속도
   → 경쟁 상대가 아니라 배경이다
```

**Day 91의 `CarController`를 AI가 조종하게 하면?**

```
   ★ 필요한 것

   ① 어디로 조향할지 (선행 지점)
   ② 얼마나 밟을지 (목표 속도)
   ③ 앞차를 어떻게 피할지
```

```
   Day 92에서 이미 준비했다

   GetLookaheadPoint()      → 조향 목표
   GetRecommendedSpeed()    → 목표 속도
```

```
   그리고 또 하나

   × 랩(바퀴 수)을 어떻게 세나
   × 지름길로 가로지르면?
   × 순위는 어떻게 계산하나
```

> **AI 조종과 랩 판정을 만든다.**

---

## 3. 개념

### 3-1. AI = 가상의 플레이어 입력

**왜 필요한가** — 가장 좋은 AI 설계.

```
   ★ 원칙

   AI는 사람과 똑같은 입력을 만든다

   throttle  (-1 ~ 1)
   steer     (-1 ~ 1)
   handbrake (bool)
```

```
   ★ 장점

   ① 물리가 똑같이 적용된다 (공정)
   ② 차량 코드를 그대로 재사용
   ③ 플레이어 ↔ AI 전환이 쉽다
   ④ 리플레이 구현이 쉽다
```

```csharp
    // CarController를 인터페이스화
    public interface ICarInput
    {
        float Throttle { get; }
        float Steer { get; }
        bool Handbrake { get; }
    }

    public class PlayerInput : MonoBehaviour, ICarInput
    {
        public float Throttle => Input.GetAxis("Vertical");
        public float Steer => Input.GetAxis("Horizontal");
        public bool Handbrake => Input.GetKey(KeyCode.Space);
    }

    public class AIInput : MonoBehaviour, ICarInput
    {
        public float Throttle { get; private set; }
        public float Steer { get; private set; }
        public bool Handbrake { get; private set; }

        void Update() { /* 계산 */ }
    }
```

```
   ★ Day 28의 다형성

   CarController는 ICarInput만 알면 된다
```

### 3-2. 조향 — 선행 지점

**왜 필요한가** — Day 92의 `GetLookaheadPoint` 활용.

```
     현재 위치        선행 지점
        ●━━━━━━━━━━━━━━●
        │            ╱
        │ forward  ╱  목표 방향
        │        ╱
        ▼      ╱  ← 이 각도가 조향 입력
```

```csharp
    private float CalculateSteer()
    {
        // ★ 속도에 비례한 선행 거리
        float speed = car.ForwardSpeed;
        float lookDist = Mathf.Lerp(minLookahead, maxLookahead,
                                    Mathf.Clamp01(speed / car.MaxSpeed));

        Vector3 target = path.GetLookaheadPoint(transform.position, lookDist);

        // ★ 로컬 좌표로 변환
        Vector3 local = transform.InverseTransformPoint(target);

        // ★ 좌우 오차를 조향 입력으로
        float steer = Mathf.Clamp(local.x / steerResponse, -1f, 1f);

        return steer;
    }
```

```
   ★ InverseTransformPoint

   월드 점 → 차 기준 로컬 점

   local.x > 0  →  오른쪽에 있다  →  오른쪽으로 조향
   local.x < 0  →  왼쪽
   local.z      →  앞뒤 거리
```

```
   ⚠️ Day 91에서는 TransformDirection을 썼다

   Direction: 방향 (위치 무시)
   Point:     점 (위치 포함)  ★ 여기서는 이것
```

```
   ★ 선행 거리(lookahead)가 핵심

   짧다 (5m)   →  코너를 늦게 인식. 벽에 박는다
   적당 (15m)  →  자연스럽다  ★
   길다 (40m)  →  코너를 잘라먹는다. 라인 이탈
```

```
   ★ 속도 비례가 필요한 이유

   고속에서는 더 멀리 봐야 한다
   → 반응할 시간이 필요
```

### 3-3. 조향 지그재그 방지

**왜 필요한가** — AI가 좌우로 흔들린다.

```
   ★ 원인

   ① 선행 거리가 짧다
   ② 조향 입력이 급격하다
   ③ 오버슈트 후 반대로 꺾는다
```

```csharp
    // ★ ① 조향 보간
    steerOutput = Mathf.MoveTowards(steerOutput, targetSteer,
                                     steerSmoothSpeed * Time.deltaTime);

    // ★ ② 데드존
    if (Mathf.Abs(steerOutput) < 0.03f) steerOutput = 0;

    // ★ ③ 미분 제어 (D항) — 진동 억제
    float derivative = (targetSteer - lastTargetSteer) / Time.deltaTime;
    steerOutput = targetSteer + derivative * derivativeGain;

    lastTargetSteer = targetSteer;
```

```
   ★ PD 제어

   P (Proportional): 오차에 비례
   D (Derivative):   오차 변화율에 비례 → 진동을 억제

   출력 = Kp × 오차 + Kd × 오차변화율
```

```
   ⚠️ Kd가 너무 크면 반응이 둔해진다

   0.02 ~ 0.1 정도에서 시작
```

### 3-4. 속도 제어

**왜 필요한가** — 코너에서 감속.

```csharp
    private float CalculateThrottle()
    {
        PathSample s = path.Sample(transform.position);

        // ★ Day 92의 권장 속도
        float targetSpeed = path.GetRecommendedSpeed(s.index, maxSpeed) * skillFactor;

        float current = car.ForwardSpeed;
        float diff = targetSpeed - current;

        if (diff > 1f)
        {
            // 가속
            return Mathf.Clamp01(diff / accelResponse);
        }
        else if (diff < -2f)
        {
            // ★ 브레이크
            return Mathf.Clamp(diff / brakeResponse, -1f, 0f);
        }

        return 0.1f;                           // 유지
    }
```

```
   ★ 히스테리시스

   가속 임계 +1, 브레이크 임계 -2
   → 경계에서 떨리지 않는다 (Day 82)
```

```
   ★ 코너 진입 감속 타이밍

   Day 92에서 lookaheadForSpeed로 앞을 미리 봤다
   → 여기서 그 값이 감속 시점을 결정
```

```
   ★ 제동 거리 계산 (더 정확한 방법)

   v² = v₀² + 2ad
   → d = (v² - v₀²) / (2a)

   현재 속도에서 목표 속도까지 필요한 거리
   → 그 거리 안에 코너가 있으면 감속 시작
```

```csharp
    private float GetBrakingDistance(float current, float target, float decel)
    {
        if (current <= target) return 0;

        return (current * current - target * target) / (2f * decel);
    }

    private float FindSpeedLimitAhead()
    {
        PathSample s = path.Sample(transform.position);
        float current = car.ForwardSpeed;

        // ★ 앞쪽 구간을 훑으며 "지금 감속해야 하는지" 확인
        for (float d = 0; d < scanDistance; d += scanStep)
        {
            int idx = path.GetIndexAtDistance(s.distanceAlongPath + d);
            float limit = path.GetRecommendedSpeed(idx, maxSpeed) * skillFactor;

            if (limit >= current) continue;

            float needed = GetBrakingDistance(current, limit, brakeDecel);

            if (needed >= d) return limit;     // ★ 지금 감속해야 한다
        }

        return maxSpeed * skillFactor;
    }
```

```
   ★ Day 67의 물리 공식이 여기서 쓰인다

   v² = v₀² + 2ad
```

### 3-5. AI 난이도

**왜 필요한가** — Day 65에서 배운 설계.

```
   ★ Day 65의 원칙

   "완벽하게 만든 뒤 일부러 틀리게 한다"
```

| 난이도 | skillFactor | 반응 속도 | 실수 확률 | 라인 오차 |
|---|:--:|:--:|:--:|:--:|
| 쉬움 | 0.72 | 0.35s | 8% | 2.5m |
| 보통 | 0.85 | 0.20s | 4% | 1.5m |
| 어려움 | 0.94 | 0.10s | 1.5% | 0.6m |
| 최상 | 1.00 | 0.05s | 0% | 0.0m |

```csharp
    [System.Serializable]
    public class AIDifficulty
    {
        public string name = "보통";
        [Range(0.5f, 1.1f)] public float skillFactor = 0.85f;
        public float reactionDelay = 0.2f;
        [Range(0f, 0.2f)] public float mistakeChance = 0.04f;
        public float lineOffsetRange = 1.5f;
        public float rubberBandStrength = 0.15f;
    }
```

```csharp
    // ★ 라인 오프셋 — AI마다 다른 라인
    private float lineOffset;
    private float offsetChangeTimer;

    private void UpdateLineOffset(float dt)
    {
        offsetChangeTimer -= dt;

        if (offsetChangeTimer <= 0)
        {
            offsetChangeTimer = Random.Range(3f, 7f);
            targetOffset = Random.Range(-difficulty.lineOffsetRange,
                                         difficulty.lineOffsetRange);
        }

        lineOffset = Mathf.MoveTowards(lineOffset, targetOffset, dt);
    }
```

```
   ★ 라인 오프셋의 효과

   ① AI마다 조금씩 다른 라인 → 자연스럽다
   ② 완벽하지 않아 실수 여지가 생긴다
   ③ 추월 기회가 생긴다
```

### 3-6. 고무줄 효과 (Rubber Banding)

**왜 필요한가** — 경기가 늘어지지 않게.

```
   ★ 플레이어가 너무 앞서면 AI를 빠르게
     플레이어가 너무 뒤처지면 AI를 느리게

   → 항상 접전
```

```csharp
    private float GetRubberBandFactor()
    {
        if (difficulty.rubberBandStrength <= 0) return 1f;

        RaceParticipant player = RaceManager.Instance.PlayerParticipant;
        if (player == null) return 1f;

        // ★ 진행도 차이
        float diff = player.TotalProgress - participant.TotalProgress;

        // 플레이어가 앞서면 diff > 0 → AI 가속
        float factor = 1f + Mathf.Clamp(diff, -0.5f, 0.5f)
                            * difficulty.rubberBandStrength;

        return factor;
    }
```

```
   ⚠️ 너무 강하면 플레이어가 알아챈다

   "아무리 잘해도 AI가 붙는다"
   → 성취감이 사라진다

   ★ 0.1 ~ 0.2 정도가 적당
   ★ 또는 최상 난이도에서는 끈다
```

```
   ★ 대안 — 캐치업만

   뒤처진 AI만 빠르게, 앞선 AI는 그대로
   → 덜 부자연스럽다
```

### 3-7. 차량 간 회피

**왜 필요한가** — 앞차에 계속 박으면 안 된다.

```csharp
    private float CalculateAvoidance()
    {
        Vector3 origin = transform.position + Vector3.up * 0.5f;

        // ★ 앞쪽 감지
        if (!Physics.SphereCast(origin, avoidRadius, transform.forward,
                                out RaycastHit hit, avoidDistance, carLayer))
            return 0f;

        CarController other = hit.collider.GetComponentInParent<CarController>();
        if (other == null || other == car) return 0f;

        // ★ 앞차가 더 느리면 피한다
        if (other.ForwardSpeed > car.ForwardSpeed - 2f) return 0f;

        // ★ 어느 쪽으로 피할지
        Vector3 local = transform.InverseTransformPoint(hit.point);

        float side = local.x >= 0 ? -1f : 1f;   // 반대쪽으로

        // ★ 가까울수록 강하게
        float strength = 1f - (hit.distance / avoidDistance);

        return side * strength * avoidStrength;
    }
```

```
        ╱█╲ AI
         │
         │ SphereCast
         ▼
        ╱█╲ 앞차 (느림)
       ←   → 어느 쪽으로?

   앞차가 오른쪽에 있으면 → 왼쪽으로
```

```
   ⚠️ 트랙 밖으로 밀려나지 않게

   회피 후 중심선 거리를 확인
   → 트랙 폭을 넘으면 회피를 줄인다
```

```csharp
    // 트랙 폭 제한
    PathSample s = path.Sample(transform.position);
    float widthRatio = s.lateralDistance / trackWidth;

    if (widthRatio > 0.7f)
    {
        // ★ 바깥쪽으로 더 못 가게
        float toCenter = Vector3.Dot(
            (s.closestPoint - transform.position).normalized, transform.right);

        avoidance = Mathf.Lerp(avoidance, toCenter, (widthRatio - 0.7f) / 0.3f);
    }
```

### 3-8. 실수 시뮬레이션

**왜 필요한가** — 완벽한 AI는 재미없다.

```csharp
    private float mistakeTimer;
    private float mistakeSteer;

    private void UpdateMistake(float dt)
    {
        if (mistakeTimer > 0)
        {
            mistakeTimer -= dt;
            return;
        }

        // ★ 코너에서 실수 확률 증가
        PathSample s = path.Sample(transform.position);
        float curve = path.Waypoints[s.index].curvature;

        float chance = difficulty.mistakeChance * (1f + curve / 45f) * dt;

        if (Random.value < chance)
        {
            mistakeTimer = Random.Range(0.3f, 0.9f);
            mistakeSteer = Random.Range(-0.4f, 0.4f);

            Debug.Log($"[AI] {name} 실수!");
        }
        else
        {
            mistakeSteer = 0;
        }
    }
```

```
   ★ 실수의 종류

   ① 조향 오차 (라인 이탈)
   ② 브레이킹 지연 (코너 오버런)
   ③ 가속 지연
```

### 3-9. 랩 판정 — 체크포인트

**왜 필요한가** — 지름길·역주행 방지.

```
   ★ 결승선만 검사하면

   ① 결승선 앞뒤로 왔다갔다 → 랩이 계속 는다
   ② 트랙을 가로질러 결승선으로 → 인정된다
```

```
   ★ 해결 — 순차 체크포인트

   CP0(결승) → CP1 → CP2 → CP3 → CP0
                                   ↑ 여기서 1랩

   반드시 순서대로 통과해야 한다
```

```csharp
public class LapTracker : MonoBehaviour
{
    [SerializeField] private TrackPath path;
    [SerializeField] private int totalLaps = 3;

    public int CurrentLap { get; private set; } = 0;
    public int NextCheckpoint { get; private set; } = 0;
    public bool Finished { get; private set; }

    public float CurrentLapTime { get; private set; }
    public float BestLapTime { get; private set; } = float.MaxValue;
    public float TotalTime { get; private set; }

    private readonly List<float> lapTimes = new List<float>();

    public void PassCheckpoint(int index)
    {
        if (Finished) return;

        // ★ 순서가 맞아야 인정
        if (index != NextCheckpoint) return;

        int count = path.Checkpoints.Count;

        NextCheckpoint = (NextCheckpoint + 1) % count;

        // ★ 0번(결승선)으로 돌아오면 1랩
        if (NextCheckpoint == 0)
        {
            CompleteLap();
        }
    }

    private void CompleteLap()
    {
        CurrentLap++;

        lapTimes.Add(CurrentLapTime);

        if (CurrentLapTime < BestLapTime) BestLapTime = CurrentLapTime;

        Debug.Log($"[랩] {name} LAP {CurrentLap} — {FormatTime(CurrentLapTime)}");

        CurrentLapTime = 0;

        if (CurrentLap >= totalLaps)
        {
            Finished = true;
            RaceManager.Instance.OnFinish(this);
        }
    }

    void Update()
    {
        if (Finished) return;

        CurrentLapTime += Time.deltaTime;
        TotalTime += Time.deltaTime;
    }

    public static string FormatTime(float t)
    {
        int min = Mathf.FloorToInt(t / 60f);
        float sec = t - min * 60f;

        return $"{min}:{sec:00.00}";
    }
}
```

```
   ⚠️ 첫 랩 처리

   시작 시 CP0을 이미 통과한 상태
   → NextCheckpoint = 1 로 시작하거나
   → 첫 CP0 통과는 무시
```

### 3-10. 체크포인트 트리거

**왜 필요한가** — 통과를 감지한다.

```csharp
public class CheckpointTrigger : MonoBehaviour
{
    [SerializeField] private int index;

    void OnTriggerEnter(Collider other)
    {
        LapTracker tracker = other.GetComponentInParent<LapTracker>();
        tracker?.PassCheckpoint(index);
    }

#if UNITY_EDITOR
    void OnDrawGizmos()
    {
        BoxCollider box = GetComponent<BoxCollider>();
        if (box == null) return;

        Gizmos.color = index == 0
            ? new Color(1f, 0.9f, 0.2f, 0.4f)
            : new Color(0.4f, 0.8f, 1f, 0.25f);

        Gizmos.matrix = transform.localToWorldMatrix;
        Gizmos.DrawCube(box.center, box.size);

        UnityEditor.Handles.Label(transform.position + Vector3.up * 3f,
                                  index == 0 ? "FINISH" : $"CP {index}");
    }
#endif
}
```

```
   ⚠️ 고속 차량이 트리거를 통과 못 할 수 있다

   ① Collider를 두껍게 (Z 두께 3~5m)
   ② Rigidbody Collision Detection: Continuous
   ③ 또는 진행도 기반 판정 (3-11)
```

### 3-11. 진행도 기반 판정 (대안)

**왜 필요한가** — 트리거 없이.

```csharp
    private float lastProgress;

    void Update()
    {
        PathSample s = path.Sample(transform.position);
        float progress = s.progress;

        // ★ 0.9 이상에서 0.1 이하로 넘어가면 한 바퀴
        if (lastProgress > 0.85f && progress < 0.15f)
        {
            CompleteLap();
        }
        // ★ 역주행 감지
        else if (lastProgress < 0.15f && progress > 0.85f)
        {
            CurrentLap--;
            Debug.LogWarning("[랩] 역주행 감지");
        }

        lastProgress = progress;
    }
```

| | 트리거 | 진행도 |
|---|---|---|
| 정확성 | 높음 | 중간 |
| 고속 누락 | 가능 | **없음** ★ |
| 지름길 방지 | **강함** | 약함 |
| 설치 | 오브젝트 필요 | 불필요 |

```
   ★ 실무에서는 둘 다 쓴다

   진행도로 순위 계산
   트리거로 랩 확정
```

### 3-12. 순위 계산

**왜 필요한가** — 실시간 순위.

```
   ★ 비교 순서

   ① 완주 여부 (완주자가 앞)
   ② 랩 수
   ③ 통과한 체크포인트 수
   ④ 다음 체크포인트까지의 거리 (가까울수록 앞)
```

```csharp
    public float TotalProgress
    {
        get
        {
            PathSample s = path.Sample(transform.position);
            return CurrentLap + s.progress;    // 예: 2.47 = 2랩 + 47%
        }
    }
```

```csharp
public class RaceManager : MonoBehaviour
{
    private readonly List<LapTracker> participants = new List<LapTracker>();
    private readonly List<LapTracker> sorted = new List<LapTracker>();

    private float sortTimer;

    void Update()
    {
        sortTimer -= Time.deltaTime;
        if (sortTimer > 0) return;

        sortTimer = 0.2f;                      // ★ 5회/초면 충분
        UpdateRanking();
    }

    private void UpdateRanking()
    {
        sorted.Clear();
        sorted.AddRange(participants);

        // ★ 수동 정렬 (LINQ 회피 — Day 89)
        sorted.Sort(CompareRank);

        for (int i = 0; i < sorted.Count; i++)
            sorted[i].Rank = i + 1;
    }

    private static int CompareRank(LapTracker a, LapTracker b)
    {
        // ① 완주자 우선
        if (a.Finished != b.Finished) return a.Finished ? -1 : 1;

        // ② 완주자끼리는 완주 시간
        if (a.Finished && b.Finished) return a.TotalTime.CompareTo(b.TotalTime);

        // ③ 진행도 (내림차순)
        return b.TotalProgress.CompareTo(a.TotalProgress);
    }
}
```

```
   ⚠️ 매 프레임 정렬은 낭비다

   0.2초 간격이면 충분
   → Day 87의 탐지 주기와 같은 발상
```

### 3-13. 리스폰

**왜 필요한가** — 뒤집히거나 이탈했을 때.

```csharp
    public void Respawn()
    {
        PathSample s = path.Sample(transform.position);

        // ★ 살짝 뒤로 (다음 코너 진입 전)
        float backDist = s.distanceAlongPath - 5f;
        Vector3 pos = path.GetPointAtDistance(backDist) + Vector3.up * 1.2f;

        Vector3 forward = path.GetForwardAtDistance(backDist);

        car.ResetCar(pos, Quaternion.LookRotation(forward));

        // ★ 페널티 (선택)
        respawnPenalty += 2f;

        Debug.Log("[리스폰]");
    }
```

```
   ⚠️ 리스폰이 유리하면 안 된다

   지름길을 가로지른 뒤 리스폰 → 앞으로 순간이동?
   → 리스폰 위치는 "마지막 통과 체크포인트 이후"로 제한
```

---

## 4. 따라 만들기

### Step 1 — 입력 인터페이스 분리

3-1절의 `ICarInput`을 만들고 `CarController`를 수정한다.

```csharp
    // CarController
    private ICarInput input;

    void Awake()
    {
        // ...
        input = GetComponent<ICarInput>();
    }

    void Update()
    {
        if (input != null)
        {
            inputThrottle = input.Throttle;
            inputSteer = input.Steer;
            inputHandbrake = input.Handbrake;
        }

        UpdateWheelVisuals(Time.deltaTime);
    }
```

```csharp
    public class PlayerInput : MonoBehaviour, ICarInput
    {
        public float Throttle => Input.GetAxis("Vertical");
        public float Steer => Input.GetAxis("Horizontal");
        public bool Handbrake => Input.GetKey(KeyCode.Space);
    }
```

**Car에 `PlayerInput`을 붙인다.**

**✅ 여기까지 실행하면** — 이전과 동일하게 동작한다.

### Step 2 — AI 차량 준비

```
   Car를 프리팹으로 → P_Car
   복제해 P_Car_AI 만들기
   → PlayerInput 제거, AIInput 추가
```

```
   Layer: Car (새로 만들기)
```

### Step 3 — AI 기본 조향

```csharp
using UnityEngine;

[RequireComponent(typeof(CarController))]
public class AIInput : MonoBehaviour, ICarInput
{
    [Header("참조")]
    [SerializeField] private TrackPath path;

    [Header("조향")]
    [SerializeField] private float minLookahead = 8f;
    [SerializeField] private float maxLookahead = 24f;
    [SerializeField] private float steerResponse = 6f;
    [SerializeField] private float steerSmoothSpeed = 8f;

    [Header("속도")]
    [SerializeField] private float accelResponse = 8f;
    [SerializeField] private float brakeResponse = 10f;

    [Header("난이도")]
    [SerializeField] private AIDifficulty difficulty;

    private CarController car;

    public float Throttle { get; private set; }
    public float Steer { get; private set; }
    public bool Handbrake { get; private set; }

    // 디버그
    public Vector3 LookaheadPoint { get; private set; }
    public float TargetSpeed { get; private set; }

    private float steerOutput;

    void Awake() { car = GetComponent<CarController>(); }

    void Update()
    {
        float dt = Time.deltaTime;

        Steer = CalculateSteer(dt);
        Throttle = CalculateThrottle();
    }

    private float CalculateSteer(float dt)
    {
        float speedRatio = Mathf.Clamp01(car.ForwardSpeed / car.MaxSpeed);
        float lookDist = Mathf.Lerp(minLookahead, maxLookahead, speedRatio);

        Vector3 target = path.GetLookaheadPoint(transform.position, lookDist);
        LookaheadPoint = target;

        Vector3 local = transform.InverseTransformPoint(target);

        float raw = Mathf.Clamp(local.x / steerResponse, -1f, 1f);

        steerOutput = Mathf.MoveTowards(steerOutput, raw, steerSmoothSpeed * dt);

        return steerOutput;
    }

    private float CalculateThrottle()
    {
        PathSample s = path.Sample(transform.position);

        float target = path.GetRecommendedSpeed(s.index, car.MaxSpeed)
                       * difficulty.skillFactor;

        TargetSpeed = target;

        float diff = target - car.ForwardSpeed;

        if (diff > 1f)  return Mathf.Clamp01(diff / accelResponse);
        if (diff < -2f) return Mathf.Clamp(diff / brakeResponse, -1f, 0f);

        return 0.15f;
    }

    void OnDrawGizmos()
    {
        if (!Application.isPlaying) return;

        Gizmos.color = Color.magenta;
        Gizmos.DrawLine(transform.position, LookaheadPoint);
        Gizmos.DrawWireSphere(LookaheadPoint, 0.8f);
    }
}
```

**✅ 여기까지 실행하면**

```
   ★ AI가 트랙을 따라 달린다
   ★ 코너에서 감속한다
```

<!-- SHOT: Step 3 AI 주행 -->

### Step 4 — 선행 거리 실험

**`minLookahead`/`maxLookahead`를 3/5로.**

```
   ★ AI가 벽에 박는다
   → 코너를 너무 늦게 인식
```

**40/80으로.**

```
   ★ 코너를 크게 잘라먹는다
   → 트랙 밖으로 나간다
```

> **8/24로 되돌린다.**

> ### ★ 3-2절의 핵심

### Step 5 — 지그재그 확인

**`steerSmoothSpeed`를 100으로 (거의 즉시).**

```
   ★ AI가 좌우로 흔들린다
```

**PD 제어를 추가한다.**

```csharp
    [SerializeField] private float derivativeGain = 0.05f;

    private float lastRaw;

    private float CalculateSteer(float dt)
    {
        // ...
        float raw = Mathf.Clamp(local.x / steerResponse, -1f, 1f);

        // ★ D항
        float derivative = (raw - lastRaw) / Mathf.Max(dt, 0.0001f);
        lastRaw = raw;

        float pd = raw + derivative * derivativeGain;
        pd = Mathf.Clamp(pd, -1f, 1f);

        steerOutput = Mathf.MoveTowards(steerOutput, pd, steerSmoothSpeed * dt);

        return steerOutput;
    }
```

**✅ 고치면** — 진동이 줄어든다.

### Step 6 — 제동 거리 계산

3-4절의 `FindSpeedLimitAhead`를 구현한다.

```csharp
    [SerializeField] private float scanDistance = 60f;
    [SerializeField] private float scanStep = 5f;
    [SerializeField] private float brakeDecel = 18f;

    private float CalculateThrottle()
    {
        float limit = FindSpeedLimitAhead();
        TargetSpeed = limit;

        float diff = limit - car.ForwardSpeed;

        if (diff > 1f)  return Mathf.Clamp01(diff / accelResponse);
        if (diff < -2f) return Mathf.Clamp(diff / brakeResponse, -1f, 0f);

        return 0.15f;
    }
```

```csharp
    // TrackPath에 추가
    public int GetIndexAtDistance(float dist)
    {
        dist = Mathf.Repeat(dist, TotalLength);

        int lo = 0, hi = waypoints.Count - 1;

        while (lo < hi)
        {
            int mid = (lo + hi + 1) / 2;
            if (waypoints[mid].distanceFromStart <= dist) lo = mid;
            else hi = mid - 1;
        }

        return lo;
    }
```

**✅ 여기까지 실행하면**

```
   ★ 코너 한참 전부터 감속을 시작한다
   ★ 코너에서 안정적으로 돈다
```

**`scanDistance`를 10으로 줄여 본다.**

```
   → 코너 직전에야 브레이크
   → 오버런
```

> **60으로 되돌린다.**

### Step 7 — 난이도

3-5절의 `AIDifficulty`를 만들고 프리셋 4종을 준비한다.

```csharp
    [SerializeField] private AIDifficulty[] presets;
    [SerializeField] private int difficultyIndex = 1;

    void Start()
    {
        difficulty = presets[Mathf.Clamp(difficultyIndex, 0, presets.Length - 1)];
    }
```

**각 난이도로 랩 타임을 비교한다.**

**✅ 여기까지 하면**

```
   쉬움    0:52.4
   보통    0:45.1
   어려움  0:40.8
   최상    0:38.2
```

### Step 8 — 라인 오프셋

3-5절의 `UpdateLineOffset`을 구현한다.

```csharp
    private float lineOffset, targetOffset, offsetTimer;

    private void UpdateLineOffset(float dt)
    {
        offsetTimer -= dt;

        if (offsetTimer <= 0)
        {
            offsetTimer = Random.Range(3f, 7f);
            targetOffset = Random.Range(-difficulty.lineOffsetRange,
                                         difficulty.lineOffsetRange);
        }

        lineOffset = Mathf.MoveTowards(lineOffset, targetOffset, dt * 1.5f);
    }
```

```csharp
    // 조향에 반영
    Vector3 target = path.GetLookaheadPoint(transform.position, lookDist);

    PathSample s = path.Sample(transform.position);
    Vector3 right = Vector3.Cross(Vector3.up, s.forward);

    target += right * lineOffset;              // ★ 옆으로 밀기
```

**AI 2대를 배치한다.**

**✅ 여기까지 실행하면**

```
   ★ 두 AI가 서로 다른 라인을 그린다
   ★ 나란히 달려도 겹치지 않는다
```

<!-- SHOT: Step 8 서로 다른 라인 -->

### Step 9 — 회피

3-7절의 `CalculateAvoidance`를 구현한다.

```csharp
    [Header("회피")]
    [SerializeField] private float avoidDistance = 14f;
    [SerializeField] private float avoidRadius = 1.4f;
    [SerializeField] private float avoidStrength = 0.6f;
    [SerializeField] private LayerMask carLayer;

    private float CalculateSteer(float dt)
    {
        // ... 기본 조향 ...

        float avoid = CalculateAvoidance();

        float combined = Mathf.Clamp(pd + avoid, -1f, 1f);

        steerOutput = Mathf.MoveTowards(steerOutput, combined, steerSmoothSpeed * dt);

        return steerOutput;
    }
```

**AI 뒤에 느린 차를 놓아 본다.**

**✅ 여기까지 실행하면**

```
   ★ 앞차를 옆으로 피해 지나간다
```

**회피 강도를 2.0으로.**

```
   → 트랙 밖으로 나간다
```

**트랙 폭 제한을 추가한다.**

**✅ 고치면** — 트랙 안에서 피한다.

### Step 10 — 실수

3-8절의 코드를 구현한다.

```csharp
    // 조향에 더한다
    float combined = Mathf.Clamp(pd + avoid + mistakeSteer, -1f, 1f);
```

**쉬움 난이도로 여러 랩을 돌린다.**

**✅ 여기까지 하면**

```
   [AI] AI_B 실수!
   → 라인을 벗어났다가 복구한다
   → 추월 기회가 생긴다
```

### Step 11 — 체크포인트 배치

```
   Day 92의 checkpointIndices 위치에
   빈 오브젝트 + Box Collider (Is Trigger ✔) 배치

   Size: (트랙폭 × 2, 5, 4)
   ★ Z 두께를 4m 이상으로 (고속 통과 대비)
```

```
   CheckpointTrigger 스크립트 붙이고 index 지정
   CP0 = 결승선
```

**✅ 여기까지 하면** — Scene 뷰에 체크포인트가 보인다.

<!-- SHOT: Step 11 체크포인트 -->

### Step 12 — LapTracker

3-9절의 코드를 구현하고 모든 차량에 붙인다.

```csharp
    // 첫 랩 처리
    void Start()
    {
        NextCheckpoint = 1;                    // ★ CP0은 이미 통과한 것으로
        CurrentLap = 0;
    }
```

**✅ 여기까지 실행하면**

```
   [랩] Player LAP 1 — 0:41.28
   [랩] AI_A LAP 1 — 0:39.84
```

### Step 13 — 지름길 방지 확인

**트랙을 가로질러 결승선으로 간다.**

**✅ 이렇게 하면**

```
   ★ 랩이 인정되지 않는다
   → CP1, CP2, CP3을 안 지났다
```

**`if (index != NextCheckpoint) return;` 을 제거한다.**

```
   ★ 지름길로 랩이 인정된다
   ★ 결승선 앞뒤로 왔다갔다 하면 랩이 계속 는다
```

> ### ★ 3-9절의 핵심
>
> **되돌린다.**

### Step 14 — 고속 통과 누락 확인

**체크포인트 두께를 0.2m로 줄인다.**

**최고 속도로 통과한다.**

**✅ 이렇게 하면**

```
   ★ 가끔 체크포인트를 놓친다
   → 랩이 인정되지 않는다
```

```
   45 m/s × (1/50초) = 0.9m
   → 0.2m 두께는 확실히 뚫린다
```

**두께를 4m로 되돌리고, Rigidbody를 Continuous로.**

```
   ★ Day 22·73의 터널링
```

### Step 15 — RaceManager와 순위

3-12절의 코드를 구현한다.

```csharp
    void Start()
    {
        // 모든 참가자 등록
        var trackers = FindObjectsByType<LapTracker>(FindObjectsSortMode.None);
        participants.AddRange(trackers);
    }
```

```csharp
    // LapTracker에 추가
    public int Rank { get; set; }
    public string DisplayName;
    public bool IsPlayer;
```

**✅ 여기까지 실행하면** — 순위가 계산된다.

### Step 16 — 고무줄 효과

3-6절의 `GetRubberBandFactor`를 구현한다.

```csharp
    private float CalculateThrottle()
    {
        float limit = FindSpeedLimitAhead() * GetRubberBandFactor();
        // ...
    }
```

**플레이어가 크게 앞서 본다.**

**✅ 여기까지 하면**

```
   rubberBandStrength 0     →  AI가 계속 뒤처진다
   rubberBandStrength 0.15  →  AI가 조금씩 따라온다  ★
   rubberBandStrength 0.5   →  아무리 잘해도 AI가 붙는다  ✗
```

### Step 17 — 레이스 UI

```csharp
using System.Collections.Generic;
using System.Text;
using TMPro;
using UnityEngine;

public class RaceUI : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI lapText;
    [SerializeField] private TextMeshProUGUI rankText;
    [SerializeField] private TextMeshProUGUI timeText;
    [SerializeField] private TextMeshProUGUI bestText;
    [SerializeField] private TextMeshProUGUI standingsText;
    [SerializeField] private LapTracker player;

    private readonly StringBuilder sb = new StringBuilder();
    private float refreshTimer;

    void Update()
    {
        // ★ 매 프레임 문자열 생성 금지 (Day 89)
        lapText.text = $"LAP {Mathf.Min(player.CurrentLap + 1, player.TotalLaps)} / {player.TotalLaps}";
        rankText.text = $"순위 {player.Rank} / {RaceManager.Instance.Count}";
        timeText.text = LapTracker.FormatTime(player.CurrentLapTime);

        bestText.text = player.BestLapTime < float.MaxValue
            ? LapTracker.FormatTime(player.BestLapTime) : "--:--.--";

        refreshTimer -= Time.deltaTime;
        if (refreshTimer > 0) return;

        refreshTimer = 0.25f;
        RefreshStandings();
    }

    private void RefreshStandings()
    {
        sb.Clear();

        IReadOnlyList<LapTracker> sorted = RaceManager.Instance.Standings;

        for (int i = 0; i < sorted.Count; i++)
        {
            LapTracker t = sorted[i];

            string mark = t.IsPlayer ? "▶" : " ";

            sb.AppendLine($"{mark}{i + 1}. {t.DisplayName,-9} " +
                          $"LAP {t.CurrentLap + 1}  CP {t.NextCheckpoint}");
        }

        standingsText.text = sb.ToString();
    }
}
```

```
   ★ StringBuilder

   문자열을 여러 번 이어붙일 때 GC를 줄인다
   → Day 89에서 배운 것
```

**✅ 여기까지 실행하면** — 1절의 UI가 나온다.

<!-- SHOT: Step 17 레이스 UI -->

### Step 18 — 리스폰

3-13절의 코드를 구현한다.

```csharp
    // TrackPath에 추가
    public Vector3 GetForwardAtDistance(float dist)
    {
        int i = GetIndexAtDistance(dist);
        return waypoints[i].forward;
    }
```

```csharp
    // 이탈 3초 또는 R 키
    if (Input.GetKeyDown(KeyCode.R)) Respawn();
```

**✅ 여기까지 실행하면** — 트랙 위로 복귀한다.

### Step 19 — 완주 처리

```csharp
    public void OnFinish(LapTracker t)
    {
        finishOrder.Add(t);

        Debug.Log($"[완주] {t.DisplayName} — {t.Rank}위, " +
                  $"총 {LapTracker.FormatTime(t.TotalTime)}");

        if (t.IsPlayer) ShowResult();
    }

    private void ShowResult()
    {
        resultPanel.SetActive(true);

        sb.Clear();
        sb.AppendLine("=== 레이스 결과 ===");

        for (int i = 0; i < Standings.Count; i++)
        {
            LapTracker t = Standings[i];

            sb.AppendLine($"{i + 1}위  {t.DisplayName,-9}  " +
                          $"{LapTracker.FormatTime(t.TotalTime)}  " +
                          $"베스트 {LapTracker.FormatTime(t.BestLapTime)}");
        }

        resultText.text = sb.ToString();
    }
```

**✅ 여기까지 실행하면**

```
   === 레이스 결과 ===
   1위  AI_A       2:01.44  베스트 0:39.84
   2위  PLAYER     2:04.82  베스트 0:40.12
   3위  AI_B       2:09.16  베스트 0:42.51
```

### Step 20 — 3랩 완주 테스트

**AI 2대와 3랩을 돌린다.**

**✅ 여기까지 하면**

```
   ★ AI가 안정적으로 완주한다
   ★ 코너에서 감속하고 직선에서 가속한다
   ★ 서로 부딪히지 않고 피한다
   ★ 순위가 실시간으로 바뀐다
```

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  LAP 2 / 3      순위 2 / 3                             │
   │  현재 랩  0:42.18                                       │
   │  베스트   0:38.94                                       │
   │                                                        │
   │       ╭─────────── 선행 지점(보라)                       │
   │      ╱                                                 │
   │   ╱█╲ ← AI (감속 중)      ╱█╲ ← 플레이어                │
   │    │                       │                           │
   │  ▓▓▓▓▓▓▓▓▓ 코너 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                     │
   │                                                        │
   │  ┌─ 순위 ────────────────────────┐                     │
   │  │  1. AI_A     LAP 2  CP 3      │                     │
   │  │ ▶2. PLAYER   LAP 2  CP 2      │                     │
   │  │  3. AI_B     LAP 1  CP 4      │                     │
   │  └───────────────────────────────┘                     │
   │                                                        │
   │  AI 목표속도 96 km/h  현재 112 km/h  → 브레이크          │
   └────────────────────────────────────────────────────────┘
```

- [ ] `ICarInput`으로 플레이어/AI를 분리했다
- [ ] AI가 선행 지점을 향해 조향한다
- [ ] 선행 거리가 짧으면 벽에 박는다
- [ ] 선행 거리가 길면 코너를 잘라먹는다
- [ ] 조향 보간·PD 제어로 지그재그가 줄었다
- [ ] **AI가 코너 전에 미리 감속한다**
- [ ] 제동 거리 계산으로 타이밍이 정확하다
- [ ] `scanDistance`가 짧으면 오버런한다
- [ ] 난이도 4종의 랩 타임이 다르다
- [ ] AI마다 다른 라인을 그린다
- [ ] 앞차를 옆으로 피한다
- [ ] 회피가 강하면 트랙을 벗어난다
- [ ] 트랙 폭 제한으로 안에서 피한다
- [ ] 실수 확률이 동작한다
- [ ] 체크포인트를 배치했다
- [ ] **순서대로 통과해야 랩이 인정된다**
- [ ] 지름길로 가면 인정되지 않는다
- [ ] 얇은 체크포인트는 고속에서 뚫린다
- [ ] 순위가 실시간으로 계산된다
- [ ] 고무줄 효과가 조절된다
- [ ] 랩 타임과 베스트가 기록된다
- [ ] R로 리스폰된다
- [ ] **3랩 완주 후 결과가 표시된다**

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **AI가 벽에 박음** | 선행 거리 짧음 | 속도 비례로 늘리기 |
| AI가 코너를 자름 | 선행 거리 김 | 줄이기 |
| **AI가 지그재그** | 조향 급변 | 보간 + PD 제어 |
| AI가 코너에서 오버런 | 감속 늦음 | `scanDistance` 늘리기 |
| AI가 너무 느림 | `skillFactor` 낮음 | 조정 |
| AI끼리 계속 부딪힘 | 회피 없음 | SphereCast 회피 |
| AI가 트랙 밖으로 | 회피 강도 과다 | 트랙 폭 제한 |
| **랩이 중복 인정** | 순서 검사 없음 | `NextCheckpoint` 확인 |
| 랩이 인정 안 됨 | 첫 CP 처리 | `NextCheckpoint = 1`로 시작 |
| **체크포인트 누락** | 두께 부족 + 고속 | 4m 이상 + Continuous |
| 순위가 요동침 | 매 프레임 정렬 | 0.2초 간격 |
| 순위가 틀림 | 진행도 계산 | `CurrentLap + progress` |
| 리스폰이 유리 | 위치 제한 없음 | 마지막 CP 이후로 |
| GC 발생 | 매 프레임 문자열 | `StringBuilder` + 주기 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| **`ICarInput`** | AI = 가상의 플레이어 입력 |
| **선행 지점 조향** | `InverseTransformPoint().x`를 조향으로 |
| 속도 비례 lookahead | 고속에서 멀리 본다 |
| PD 제어 | 진동 억제 |
| **제동 거리** | `d = (v² - v₀²) / 2a` (Day 67) |
| 앞을 스캔 | 코너 전 감속 타이밍 |
| AI 난이도 | 완벽 + 의도적 오차 (Day 65) |
| 라인 오프셋 | AI마다 다른 라인 |
| 고무줄 효과 | 접전 유지. 과하면 역효과 |
| **회피** | SphereCast + 반대 방향 |
| 실수 시뮬레이션 | 코너에서 확률 증가 |
| **순차 체크포인트** | 지름길·역주행 방지 |
| 트리거 두께 | 고속 통과 대비 (Day 22 터널링) |
| **순위 계산** | 완주 → 랩 → 진행도 |
| `StringBuilder` | 문자열 GC 절약 |

### Part 2와의 대응

| Part 2 | Unity |
|---|---|
| Day 64 경로 추적 | 선행 지점 조향 |
| **Day 65 AI 난이도** | `skillFactor` + 오차 |
| Day 67 물리 공식 | 제동 거리 |
| Day 22 터널링 | 체크포인트 두께 |
| Day 82 히스테리시스 | 가속/브레이크 임계 |
| Day 89 GC 절약 | `StringBuilder` + 주기 갱신 |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 94** | Shader Graph (차체·노면) |
| Day 95 | 미니맵에 순위 표시 |
| Day 101+ | 파이널 프로젝트 AI |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 난이도를 UI에서 선택 | 프리셋 배열 |
| ★★ | 슬립스트림 (앞차 뒤에서 가속) | 뒤쪽 SphereCast |
| ★★ | 섹터 타임 (구간별 기록) | 체크포인트마다 시간 |
| ★★★ | 고스트 리플레이 (베스트 랩 재생) | 위치·회전 기록/재생 |
| ★★★ | AI가 추월 라인을 선택 | 경로 2개 + 판단 |
| ★★★★ | 강화학습 없이 자기 개선 AI | 랩마다 라인 미세 조정 |

### 다음 시간

> 레이스가 성립한다. 그런데 **화면이 밋밋하다.**
>
> ```
>   지금까지

>   × 엔진이 주는 셰이더를 "썼다"
>   × 색과 광택을 조절했을 뿐
> ```
>
> 이제 **셰이더를 만든다.**
>
> Part 2 Day 68에서 픽셀을 하나씩 블렌딩했던 그 계산을,
> 이번엔 **GPU 위에서 노드로 조립한다.**
>
> → **Day 94, Shader Graph — 셰이더 기초**
