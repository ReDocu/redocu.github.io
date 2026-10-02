# 29강 · 관측성과 부하 검증

> **AWS 학습 매뉴얼** · 🔴 대단원 04 · **29강 / 총 32강**
> [← 이전 28강](lesson-28.md) · [목차](README.md) · [다음 → 30강 게임데이 — 장애 주입과 복구](lesson-30.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 서비스의 **SLI(서비스 수준 지표)를 4대 골든 시그널로** 정의할 수 있다.
- 대시보드를 구축하고 **측정 기반으로 알람 임계값**을 정할 수 있다.
- 부하 테스트를 **설계·실행**하고 자동 확장이 실제로 작동하는지 수치로 검증한다.
- 부하 결과에서 **병목을 찾아** 개선안을 도출할 수 있다.
- **M1의 비기능 목표(성능·확장성)를 실측으로 검증**한다.

---

## ② 왜 필요한가

M2에서 서비스가 배포됐습니다. 그런데 이렇게 물으면 답할 수 있나요?

> "지금 잘 돌아가나요?" — "네, 접속되던데요."
> "**얼마나** 잘 돌아가나요?" — "..."

"접속된다"는 관측이 아닙니다. M1에서 우리는 비기능 목표를 **숫자로** 정했습니다(p95 300ms, 피크 시 2→4대 확장). 지금은 그것을 **증명**할 차례입니다.

```
 [관측 없는 서비스]
  느려진다 → 아무도 모름 → 사용자 이탈 → "왜 사람이 안 오지?"

 [관측 있는 서비스]
  p95가 250ms→400ms로 상승 → 알람 → 원인(DB 연결 포화) 파악 → 대응
```

그리고 부하 테스트 — **"자동 확장됩니다"** 를 말이 아니라 그래프로 보여야 합니다. [16강](../02-compute-data/lesson-16.md)에서 스케일 아웃을 확인했지만, 이번엔 **M1 목표 대비** 검증합니다: "피크 트래픽에서 p95가 300ms를 지키는가? 확장이 제때 일어나는가?"

이 검증이 M3(30강 완료)의 절반입니다. 그리고 [22강](../03-serverless-automation/lesson-22.md)에서 배운 CloudWatch를 **팀 서비스 전체에** 적용하는 시간입니다.

---

## ③ 워크숍 가이드 — SLI·대시보드·부하 설계

### 4대 골든 시그널 — 무엇을 볼 것인가

수십 개 지표에 파묻히지 말고 **네 가지**부터.

| 시그널 | 질문 | 우리 서비스 지표 |
|---|---|---|
| **지연 시간(Latency)** | 얼마나 빠른가 | ALB `TargetResponseTime` p95 |
| **트래픽(Traffic)** | 얼마나 오는가 | ALB `RequestCount` |
| **오류(Errors)** | 얼마나 실패하나 | ALB `HTTPCode_Target_5XX_Count` |
| **포화도(Saturation)** | 얼마나 꽉 찼나 | ECS CPU/메모리, RDS 연결 수 |

> 🔑 **p95를 평균 대신** 봅니다. 평균 100ms여도 상위 5%가 2초면 그 사용자들은 이탈합니다. 평균은 거짓말을 하고 p95/p99가 진실을 말합니다.

### SLI → SLO — 지표에 목표선을 긋기

```
 SLI(지표):  p95 응답 시간
 SLO(목표):  95%의 요청이 300ms 이내  ← M1 비기능 N2
 알람:       p95 > 300ms 가 5분 지속되면
```

M1의 비기능 요구가 그대로 SLO가 되고, SLO가 알람 임계값이 됩니다. **설계-측정-알람이 한 줄로** 이어집니다.

### 알람 임계값은 측정에서 나온다

[22강](../03-serverless-automation/lesson-22.md)에서 배운 원칙 — **감으로 정하지 않습니다.**

```
 ① 정상 상태를 며칠(최소 몇 시간) 측정 → 평소 p95 = 80ms
 ② SLO(300ms)와 평소(80ms) 사이에 선 → 예: 250ms
 ③ 평가 기간으로 스파이크 흡수 → "5분 중 3회 초과"
```

### 대시보드 구성 — 알람이 먼저, 대시보드는 조사용

| 위젯 | 지표 |
|---|---|
| 트래픽·오류 | ALB RequestCount, 4XX, 5XX |
| 지연 | ALB TargetResponseTime (p50/p95/p99) |
| 컴퓨팅 포화 | ECS CPUUtilization, MemoryUtilization |
| DB 포화 | RDS CPUUtilization, DatabaseConnections |
| 확장 상태 | ECS RunningTaskCount |

> [22강](../03-serverless-automation/lesson-22.md) 원칙 재확인 — **대시보드는 사람이 볼 때만 동작**합니다. 새벽 장애는 알람이 잡습니다. 알람을 먼저 만들고 대시보드는 알람이 울린 뒤 원인을 좁히는 화면으로 씁니다.

### 부하 테스트 설계

```
 ① 목표 정하기      M1 용량 산정의 피크 = 초당 N 요청
 ② 램프업          0 → 목표까지 서서히(급격히 X, 워밍업 필요)
 ③ 지속            목표에서 N분 유지 (확장이 일어날 시간)
 ④ 성공 기준       p95 < 300ms AND 오류율 < 1% (M1 SLO)
 ⑤ 관찰            스케일 아웃 시점·소요·병목
```

**도구** — `k6`, `Artillery`, `ab`(간단). 이 과정은 `k6`(스크립트가 명확) 또는 `ab`(설치 간단)를 씁니다.

### 부하 테스트 3대 안전 수칙 🔴

| 수칙 | 이유 |
|---|---|
| **자기 팀 리소스만** | 타 팀·외부 대상은 공격 — 감점·계정 정지 |
| **최대 용량 상한 확인** | max=20에 부하 걸면 몇 시간 만에 예산 초과 |
| **예산 알림 재확인** | 확장이 곧 비용 |

> AWS 자체 리소스에 대한 일반 부하 테스트는 허용되지만, **침투 테스트는 별도 규정**입니다. 이 과정은 부하 테스트만 합니다.

---

## ④ 스프린트 작업 — 관측성 구축과 부하 검증

> 💰 **예상 비용 $0.5 ~ 1.0/팀·주** — 서비스 상시 + 부하로 인한 일시 확장. **부하 후 용량 원복·서비스 정리.**
> 28강 배포된 서비스(app 스택)가 살아 있어야 합니다.

### Step 1. SLI/SLO 정의 (팀, 20분)

M1 비기능 요구를 SLI/SLO 표로 확정합니다.

| SLI | SLO(목표) | 근거(M1) |
|---|---|---|
| 가용성 | 월 99.9% | N1 |
| p95 응답 시간 | < 300ms | N2 |
| 오류율(5XX) | < 1% | N5 |
| 확장 반응 | 피크 시 4~5분 내 2→4 | N3 |

### Step 2. 대시보드 구축 (운영/보안, 25분)

[22강](../03-serverless-automation/lesson-22.md) 방식으로 팀 서비스 지표를 모읍니다. app 스택 리소스 이름은 배포 출력에서 가져옵니다.

```bash
$ ALB_ARN=$(aws elbv2 describe-load-balancers --names course-app-alb \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null)
# 대시보드 body에 ALB·ECS·RDS 지표 위젯 배치 (22강 put-dashboard 참고)
$ aws cloudwatch put-dashboard --dashboard-name course-final-dash \
    --dashboard-body file://dashboard.json
```

주요 위젯: ALB TargetResponseTime(p95), 5XX Count, ECS CPU/RunningTaskCount, RDS DatabaseConnections.

### Step 3. 알람 5개 (운영/보안, 30분)

측정 기반 임계값으로 SLO를 지키는 알람을 겁니다.

```bash
$ TOPIC=$(aws sns create-topic --name course-final-alarms --query TopicArn --output text)
$ aws sns subscribe --topic-arn $TOPIC --protocol email --notification-endpoint 팀메일@example.com
# 📧 확인 링크 클릭 필수
```

| # | 알람 | 지표·임계값 | SLO 연결 |
|---|---|---|---|
| 1 | p95 지연 초과 | TargetResponseTime > 0.25s, 5분 | N2 |
| 2 | 5XX 급증 | HTTPCode_Target_5XX > 5, 1분 | N5 |
| 3 | ECS CPU 포화 | CPUUtilization > 80%, 5분 | N3(확장 트리거 확인) |
| 4 | RDS 연결 급증 | DatabaseConnections > 임계, 5분 | 포화도 |
| 5 | 정상 태스크 부족 | HealthyHostCount < 2, 1분 | N1 |

```bash
$ aws cloudwatch put-metric-alarm --alarm-name course-p95-latency \
    --namespace AWS/ApplicationELB --metric-name TargetResponseTime \
    --dimensions Name=LoadBalancer,Value=<alb-suffix> \
    --statistic p95 --period 300 --evaluation-periods 1 --threshold 0.25 \
    --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching \
    --alarm-actions $TOPIC --ok-actions $TOPIC
# 2~5번 동일 패턴
```

### Step 4. 정상 상태 기준선 측정 (운영/보안, 15분)

부하 전에 **평소 값**을 기록합니다 — 임계값의 근거이자 부하 후 비교 기준.

```bash
$ DOMAIN=app.<팀도메인>
$ for i in $(seq 1 30); do
    curl -s -o /dev/null -w "%{time_total}\n" https://$DOMAIN/
  done | sort -n | awk '{a[NR]=$1} END{print "p50="a[int(NR*0.5)]" p95="a[int(NR*0.95)]}'
p50=0.082 p95=0.118
```

> 평소 p95 118ms → SLO 300ms 사이가 여유. 알람 250ms는 그 안에 위치합니다.

### Step 5. 부하 테스트 실행 ⭐ (인프라, 30분)

**최대 용량 확인 먼저** (안전 수칙).

```bash
$ aws ecs describe-services --cluster course-app-cluster --services course-app-svc \
    --query 'services[0].[desiredCount]' --output text    # 확장 정책 상한도 확인
```

**k6 스크립트** (또는 ab):

```javascript
// load.js
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // 램프업
    { duration: '5m', target: 20 },   // 지속
    { duration: '1m', target: 0 },    // 램프다운
  ],
  thresholds: { http_req_duration: ['p(95)<300'] },  // SLO를 테스트에 내장
};
export default function () {
  const r = http.get('https://app.<팀도메인>/');
  check(r, { 'status 200': (x) => x.status === 200 });
}
```

```bash
$ k6 run load.js
# 또는 ab: ab -n 5000 -c 20 https://app.<도메인>/
```

**부하 중 확장 관찰** (다른 터미널):

```bash
$ watch -n 30 'aws ecs describe-services --cluster course-app-cluster \
    --services course-app-svc --query "services[0].[runningCount,desiredCount]"'
# 2 2 → CPU 80% 돌파 → 3 3 → 4 4
```

### Step 6. 결과 분석과 병목 찾기 (팀, 25분)

```bash
# 부하 구간의 p95 지연 추이
$ aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB --metric-name TargetResponseTime \
    --dimensions Name=LoadBalancer,Value=<alb-suffix> \
    --start-time $(date -u -d '30 min ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 --statistics p95 \
    --query 'sort_by(Datapoints,&Timestamp)[*].[Timestamp,p95]' --output table
```

**분석 항목**

| 관찰 | 판정 |
|---|---|
| 스케일 아웃 시점·소요 | M1의 "4~5분" 목표 달성? |
| 확장 중 p95 스파이크 | 새 태스크 준비 전 기존 태스크 포화 → 유예/워밍업 조정 |
| RDS 연결 수 | 병목 후보 — 커넥션 풀·읽기 복제본 필요? |
| 오류율 | 1% 넘으면 SLO 위반 |

**병목 1개 식별 + 개선안** — 예: "부하 시 RDS 연결이 상한 근접 → 애플리케이션 커넥션 풀 도입 또는 캐시(ElastiCache) 추가."

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 작업(6h) | 비고 |
|---|---|---|---|
| 부하로 인한 스케일 아웃 | ❌ | $0.3~1.0 | **max 상한 4 확인** |
| ALB LCU(부하 시 증가) | ❌ | $0.1~0.3 | — |
| CloudWatch 지표·알람 | ✅ 10개 무료 | $0~0.5 | 초과분 과금 |
| CloudWatch Logs | ✅ 5GB | $0~0.5 | 부하 중 로그 폭증 — 보존 7일 |
| **합계(팀·주)** | | **약 $1** | — |

> 🔴 **부하 후 반드시**: 확장된 용량 원복 확인, 부하 로그 정리, 임시 켠 것 정리. max=20 같은 실수가 없었는지 재확인.

### 🧹 리소스 정리 체크리스트

```bash
# 부하 종료 후 용량 원복 확인 (스케일 인)
$ aws ecs describe-services --cluster course-app-cluster --services course-app-svc \
    --query 'services[0].runningCount'

# 작업 종료 시: app 스택 삭제 + RDS 중지
$ aws cloudformation delete-stack --stack-name course-app
$ aws rds stop-db-instance --db-instance-identifier course-data-mysql
```

- [ ] 부하 후 용량 원복(스케일 인) 확인
- [ ] 부하 로그 정리 + 보존 7일
- [ ] ⭐ **대시보드·알람 유지** — 30강 게임데이에서 사용
- [ ] app 스택 삭제 or ECS 0 + RDS 중지
- [ ] 팀 주간 비용 확인

---

## ⑤ 자주 하는 실수

### 평균만 보고 "빠르다"고 판단한다

**증상** — 평균 100ms라 만족하는데 상위 5% 사용자는 2초를 기다립니다.
**해결** — **p95/p99** 를 봅니다. 평균은 소수의 느린 요청을 희석해 숨깁니다. SLO도 "평균"이 아니라 "95%가 300ms 이내"로 씁니다.

### 알람 임계값을 감으로 정한다

**증상** — "CPU 90%"를 근거 없이 걸어 놓고, 알람이 안 울리거나 너무 자주 울립니다.
**해결** — **정상 상태를 먼저 측정**(Step 4)하고 그 위에 선을 긋습니다. 그리고 [22강](../03-serverless-automation/lesson-22.md)대로 "울리면 행동할 것만" 알람으로, 나머지는 대시보드로.

### 부하를 급격히 걸어 확장이 못 따라간다

**증상** — 0→목표를 순간에 걸어 첫 몇 분간 오류 폭증.
**원인** — 확장은 지표 수집(수 분) + 태스크 준비 시간이 걸립니다. 급격한 부하는 확장보다 빠릅니다.
**해결** — 램프업을 둡니다(Step 5의 2분). 실제 트래픽도 대개 서서히 오릅니다. 순간 폭주 대비가 필요하면 **예약 확장**이나 최소 용량 상향.

### max 용량을 크게 두고 부하를 걸어 예산이 터진다

**원인** — 확장 상한이 20인데 부하로 20대까지 늘어남.
**해결** — 부하 전 **max 확인·제한**(4~5). 부하 도구에 시간 제한. 예산 알림 확인. [16강](../02-compute-data/lesson-16.md)·[10강](../02-compute-data/lesson-10.md)에서 반복된 경고입니다.

### 타 팀·외부 서비스에 부하를 건다

**금지** — 자기 팀 리소스만. 타 대상은 공격으로 간주되어 계정 정지·감점.
**해결** — 부하 스크립트의 대상 URL이 **내 팀 도메인**인지 세 번 확인. 공용 인프라(강사 도메인 apex 등)도 대상 금지.

### 헬스 체크가 부하 중 실패해 확장이 꼬인다

**증상** — 부하로 태스크가 포화 → 헬스 체크 응답 지연 → unhealthy 판정 → 교체 → 더 불안정.
**원인** — 헬스 체크가 무겁거나 유예/타임아웃이 빡빡.
**해결** — `/health` 를 가볍게(28강), 헬스 체크 타임아웃·임계값을 부하 상황에 맞게. 근본은 용량이 부하를 감당하는가입니다.

---

## ⑥ 마일스톤 점검 (M3 진행 중)

오늘은 M3(30강 완료)의 절반 — 관측성·부하 검증입니다.

**오늘 완료 확인**

- [ ] SLI/SLO 정의(M1 비기능과 연결)
- [ ] 대시보드 + 알람 5개(측정 기반 임계값, 실제 수신 확인)
- [ ] 정상 기준선 측정
- [ ] 부하 테스트 실행 + 확장 관찰
- [ ] 병목 1개 식별 + 개선안

**스스로 점검하는 질문 3개**

<details>
<summary>1. 우리 서비스의 SLO를 지키고 있다는 것을 무엇으로 증명하나요?</summary>

**측정한 지표와 SLO의 대조**입니다. 예: "SLO는 p95 300ms인데, 정상 상태 p95는 118ms, 부하(초당 20요청) 시에도 p95 240ms로 SLO 안." 이 수치가 대시보드와 부하 테스트 리포트에 있어야 합니다. "잘 되던데요"가 아니라 그래프로 답합니다.
</details>

<details>
<summary>2. 알람 임계값 250ms는 어떻게 정했나요?</summary>

**정상 상태 측정(118ms)과 SLO(300ms) 사이**에 뒀습니다. 평소보다 확실히 나빠졌지만 SLO를 위반하기 전에 알리도록 — 조기 경보입니다. 감으로 정한 임계값은 너무 민감(알람 피로)하거나 둔감(장애 놓침)해집니다. 근거를 댈 수 있어야 [31강](lesson-31.md) WA 리뷰의 운영 우수성 기둥을 통과합니다.
</details>

<details>
<summary>3. 부하 테스트에서 찾은 병목은 무엇이고, 어떻게 개선할 건가요?</summary>

팀마다 다릅니다. 흔한 것: RDS 연결 포화(→ 커넥션 풀·읽기 복제본·캐시), 단일 태스크 CPU(→ 태스크 크기·수), 확장 지연(→ 유예/워밍업 조정). 중요한 건 **수치 근거**입니다 — "RDS 연결이 부하 시 최대 55(상host 66)까지 상승" 같은. 개선을 실제로 적용할지는 비용·시간 trade-off로 판단하고 [31강](lesson-31.md) WA 리뷰에 위험으로 기록합니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 4대 골든 시그널 | 지연·트래픽·오류·포화도 |
| **p95** | 평균 대신 — 평균은 느린 요청을 숨김 |
| SLI→SLO→알람 | M1 비기능이 목표선이 되고 임계값이 됨 |
| 임계값 | **측정 기반** — 정상 상태 위에 선 |
| 부하 설계 | 램프업 → 지속 → 성공 기준(SLO) → 관찰 |
| 안전 수칙 | 자기 리소스만·max 상한·예산 |
| 병목 | 수치 근거로 찾고 개선안 도출 |

**한 장 요약**

```
  M1 비기능(p95 300ms) → SLO → 알람(250ms, 측정 기반)
                                    │
  정상 기준선(118ms) → 부하 테스트(램프업→지속) → 확장 관찰
                                    ▼
        p95·확장 시점·병목 → 리포트 → M3(절반) + 31강 WA 리뷰 근거
```

**오늘 반드시 기억할 한 가지**
> **"잘 된다"는 관측이 아닙니다. p95와 SLO 대조가 관측입니다.**
> 그리고 알람 임계값은 감이 아니라 측정에서 나옵니다.

**과제 (팀)**
1. SLI/SLO 표(M1 비기능 연결) + 대시보드 캡처.
2. 알람 5개 목록·임계값·근거 + 실제 수신 증빙 1건.
3. 부하 테스트 리포트 — 목표·방법·p95 추이 그래프·확장 시점·오류율.
4. 병목 1개 식별(수치 근거) + 개선안.
5. (개인) "우리 SLO를 지키지 못하게 만드는 요인 하나"를 부하 결과로 3줄.

---

[← 이전 28강](lesson-28.md) · [목차](README.md) · [다음 → 30강 게임데이 — 장애 주입과 복구](lesson-30.md)
