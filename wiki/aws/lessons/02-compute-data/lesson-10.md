# 10강 · Auto Scaling 그룹

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **10강 / 총 32강**
> [← 이전 09강](lesson-09.md) · [목차](README.md) · [다음 → 11강 Elastic Load Balancing](lesson-11.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- Auto Scaling 그룹의 **세 가지 역할**(용량 조절 · 자동 복구 · AZ 분산)을 설명할 수 있다.
- 시작 템플릿으로 ASG를 만들어 **2개 AZ에 인스턴스를 자동 분산**할 수 있다.
- 인스턴스를 강제로 종료해도 **서비스가 스스로 복구**되는 것을 증명할 수 있다.
- 타깃 추적 정책으로 **부하에 따라 자동 확장**되게 만들 수 있다.
- **인스턴스 새로 고침**으로 무중단 롤링 교체를 수행할 수 있다.

---

## ② 왜 필요한가

[09강](lesson-09.md)에서 "부팅만 하면 서비스가 뜨는" 시작 템플릿을 만들었습니다. 이제 **누가 그 부팅을 시켜 줄 것인가**의 문제가 남습니다.

**상황 1 — 새벽 3시에 인스턴스가 죽는다**

```
 03:12  인스턴스 하드웨어 장애로 중단
 03:12  서비스 중단 시작
 07:30  출근한 담당자가 알아차림
 07:45  수동으로 새 인스턴스 시작
 ─────────────────────────────────
 총 다운타임: 4시간 33분
```

**상황 2 — 이벤트 페이지에 트래픽이 몰린다**

```
 14:00  이벤트 오픈, 평소의 8배 트래픽
 14:01  서버 2대가 CPU 100%
 14:02  응답 지연 → 타임아웃 → 사용자 이탈
 14:20  담당자가 서버 6대를 수동 추가
 ─────────────────────────────────
 놓친 시간: 20분 (이벤트 초반이 가장 중요한 시간)
```

**Auto Scaling은 이 두 상황을 사람 없이 처리합니다.**

```
 03:12  인스턴스 중단
 03:13  ASG가 비정상 감지 → 새 인스턴스 시작
 03:15  시작 템플릿의 사용자 데이터로 서비스 자동 기동
 ─────────────────────────────────
 총 다운타임: 약 3분 (그리고 아무도 깨지 않았다)
```

여기서 중요한 점 — **09강의 자동화가 없으면 ASG는 무용지물입니다.** 새 인스턴스가 부팅만 하고 nginx가 없으면 여전히 서비스는 안 됩니다. 오늘은 그 조각들이 맞물리는 시간입니다.

---

## ③ 개념 설명

### Auto Scaling의 세 가지 역할

대부분 "자동 확장"만 생각하지만, 실무에서 더 자주 쓰이는 것은 **두 번째와 세 번째**입니다.

| # | 역할 | 설명 |
|---|---|---|
| 1 | **용량 자동 조절** | 부하에 따라 인스턴스를 늘리고 줄임 |
| 2 | **자동 복구(self-healing)** ⭐ | 비정상 인스턴스를 종료하고 새로 만들어 **원하는 용량을 유지** |
| 3 | **AZ 간 균등 분산** ⭐ | 여러 AZ에 골고루 배치 · AZ 장애 시 다른 AZ에서 보충 |

> 💡 **용량을 고정(min=max=2)해서 쓰는 ASG도 흔합니다.** 확장은 필요 없어도 **자동 복구와 AZ 분산** 때문에 씁니다.

### 세 가지 용량 값

```
      최대 용량 (max)        4  ──────────────────  ← 비용 상한선이기도 하다
                                     ▲ 스케일 아웃
      원하는 용량 (desired)  2  ━━━━━━━━━━━━━━━━━━  ← ASG가 유지하려는 수
                                     ▼ 스케일 인
      최소 용량 (min)        2  ──────────────────  ← 아무리 한가해도 이 밑으론 안 줄임
```

| 값 | 의미 | 실무 설정 팁 |
|---|---|---|
| **최소(min)** | 가용성 하한 | **2 이상** (AZ 분산을 위해) |
| **원하는(desired)** | 현재 유지 대수 | 정책이 자동으로 조정 |
| **최대(max)** | 확장 상한 | **비용 상한**. 실습에서는 4 |

> 🔴 **최대 용량은 비용 방어선입니다.** 부하 테스트 중 max를 20으로 두면 몇 시간 만에 예산을 넘길 수 있습니다.

### 헬스 체크 유형 — 무엇을 "정상"으로 볼 것인가

| 유형 | 판정 기준 | 놓치는 것 |
|---|---|---|
| **EC2**(기본) | 인스턴스 상태 검사 · 시스템 상태 검사 | **OS는 살아 있는데 앱이 죽은 경우** 🔴 |
| **ELB** | 대상 그룹 헬스 체크(HTTP 응답) | — |

```
  상황: nginx 프로세스가 죽었다. OS는 정상.

  EC2 헬스 체크  →  "정상"으로 판정  →  교체 안 함  →  🚫 사용자는 502를 계속 봄
  ELB 헬스 체크  →  "비정상" 판정    →  교체        →  ✅ 자동 복구
```

> ⭐ **실무에서는 거의 항상 ELB 헬스 체크를 씁니다.** [11강](lesson-11.md)에서 ALB를 붙이면서 전환합니다.
> 오늘은 ALB가 없으므로 EC2 헬스 체크로 시작하고, 그 한계를 직접 확인합니다.

### 조정 정책 3종

| 정책 | 동작 | 언제 |
|---|---|---|
| **타깃 추적(Target Tracking)** ⭐ | "평균 CPU 50% 유지" — 알아서 조절 | **거의 모든 경우. 권장** |
| 단계 조정(Step Scaling) | "CPU 70% 넘으면 2대 추가, 90% 넘으면 4대" | 세밀한 제어가 필요할 때 |
| 예약 조정(Scheduled) | "매일 09시에 4대, 20시에 2대" | 패턴이 명확할 때 |

**타깃 추적의 대표 지표**

| 지표 | 의미 |
|---|---|
| `ASGAverageCPUUtilization` | 그룹 평균 CPU |
| `ALBRequestCountPerTarget` | 대상당 요청 수 ([11강](lesson-11.md) 이후) |
| `ASGAverageNetworkIn/Out` | 네트워크 처리량 |

### 확장이 늦는 이유 — 워밍업과 쿨다운

```
 14:00:00  CPU 80% 돌파
 14:01:00  CloudWatch 지표 수집 (기본 5분 → 세부 모니터링이면 1분)
 14:02:00  알람 상태 변경 (평가 기간)
 14:02:10  ASG가 인스턴스 시작
 14:04:00  부팅 + 사용자 데이터 실행 완료
 14:04:30  헬스 체크 통과 → 트래픽 수신 시작
 ─────────────────────────────────────────
 실제 대응까지: 약 4분 30초
```

| 설정 | 역할 |
|---|---|
| **인스턴스 워밍업(warmup)** | 새 인스턴스가 지표에 반영되기까지 기다리는 시간. 이 시간 동안 추가 확장을 억제 |
| **쿨다운(cooldown)** | 조정 후 다음 조정까지의 최소 간격 (단계 조정용) |

> 💡 **확장이 느린 것을 정책 탓으로 돌리기 전에** 부팅 시간을 먼저 줄여야 합니다. [09강](lesson-09.md)에서 골든 AMI를 배운 이유입니다.

### 상태를 인스턴스에 두면 안 되는 이유

ASG는 **언제든 인스턴스를 지웁니다.** 그 안의 데이터도 함께 사라집니다.

| 인스턴스에 두면 안 되는 것 | 어디에 둬야 하나 |
|---|---|
| 세션 정보 | **ElastiCache**, DynamoDB ([17강](../03-serverless-automation/lesson-17.md)) |
| 업로드 파일 | **S3**, EFS ([13·14강](lesson-13.md)) |
| 로그 | **CloudWatch Logs** ([22강](../03-serverless-automation/lesson-22.md)) |
| 데이터베이스 | **RDS** ([15강](lesson-15.md)) |

### 인스턴스 새로 고침(Instance Refresh)

시작 템플릿을 바꿨을 때 **기존 인스턴스를 순차적으로 교체**하는 기능입니다.

```
 [최소 정상 비율 50%, 인스턴스 4대]
   1단계: 2대 종료 → 2대 신규(새 버전) 시작 → 헬스 체크 통과 대기
   2단계: 나머지 2대 종료 → 2대 신규 시작
   → 항상 최소 2대가 서비스 중 = 무중단
```

| 설정 | 의미 |
|---|---|
| **최소 정상 비율** | 교체 중 유지할 정상 인스턴스 비율(%) |
| 인스턴스 워밍업 | 새 인스턴스를 정상으로 간주하기까지 대기 시간 |
| 체크포인트 | 단계별로 멈춰 확인 후 진행 |

> [24강 CI/CD](../03-serverless-automation/lesson-24.md)에서 이것이 **배포 방식**이 됩니다.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.1 ~ 0.2** — EC2는 프리 티어(합산 주의), NAT가 대부분입니다.
> ⚠️ [09강](lesson-09.md)의 **시작 템플릿(`course-web-template`)** 이 필요합니다.

### Step 1. 환경 복원 (5분)

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh

# NAT 생성 (패키지 설치용)
$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
$ NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ALLOC \
    --query 'NatGateway.NatGatewayId' --output text)
$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID

# 시작 템플릿의 보안 그룹을 새 VPC의 것으로 갱신
$ LT_ID=$(aws ec2 describe-launch-templates --launch-template-names course-web-template \
    --query 'LaunchTemplates[0].LaunchTemplateId' --output text)
$ aws ec2 create-launch-template-version --launch-template-id $LT_ID \
    --source-version '$Latest' --version-description "sg update" \
    --launch-template-data "{\"SecurityGroupIds\":[\"$SG_APP\"]}" \
    --query 'LaunchTemplateVersion.VersionNumber' --output text
3
$ aws ec2 modify-launch-template --launch-template-id $LT_ID --default-version 3
```

> 💡 **VPC를 새로 만들면 보안 그룹 ID가 바뀝니다.** 템플릿의 SG를 갱신해야 합니다.
> 이 번거로움이 [23강 IaC](../03-serverless-automation/lesson-23.md)를 배우는 동기가 됩니다.

### Step 2. Auto Scaling 그룹 만들기 ⭐ (20분)

```bash
$ aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name course-asg \
    --launch-template "LaunchTemplateId=$LT_ID,Version=\$Default" \
    --min-size 2 --max-size 4 --desired-capacity 2 \
    --vpc-zone-identifier "$APP_A,$APP_C" \
    --health-check-type EC2 \
    --health-check-grace-period 180 \
    --tags "Key=Name,Value=course-asg-web,PropagateAtLaunch=true" \
           "Key=Project,Value=aws-course,PropagateAtLaunch=true" \
           "Key=Week,Value=W05,PropagateAtLaunch=true"
```

**옵션 해설**

| 옵션 | 의미 |
|---|---|
| `Version=$Default` | 템플릿의 **기본 버전**을 따라감 (`$Latest` 도 가능) |
| `--vpc-zone-identifier "$APP_A,$APP_C"` | **2개 AZ의 서브넷** → 자동 분산 |
| `--health-check-grace-period 180` | 시작 후 3분간은 헬스 체크를 유예 (부팅 시간 고려) |
| `PropagateAtLaunch=true` | ASG가 만드는 **인스턴스에도 태그 전파** |

**인스턴스가 만들어지는 것 확인**

```bash
$ aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].Instances[*].[InstanceId,AvailabilityZone,LifecycleState,HealthStatus]' \
    --output table
------------------------------------------------------------------------
|  i-0a1b2c3d4e5f60718 |  ap-northeast-2a |  InService    |  Healthy    |
|  i-0f9e8d7c6b5a40312 |  ap-northeast-2c |  InService    |  Healthy    |
------------------------------------------------------------------------
```

> ✅ **AZ에 1대씩 자동 분산**됐습니다. 우리가 어느 AZ에 몇 대를 둘지 지정하지 않았는데도 ASG가 **균등 분산**했습니다.

**활동 기록 보기** — ASG가 무슨 일을 했는지 보여 주는 화면입니다. 앞으로 계속 씁니다.

```bash
$ aws autoscaling describe-scaling-activities --auto-scaling-group-name course-asg \
    --max-items 3 --query 'Activities[*].[StartTime,StatusCode,Description]' --output table
-------------------------------------------------------------------------------------
|  2026-08-13T15:40:02  |  Successful  |  Launching a new EC2 instance: i-0f9e8d7... |
|  2026-08-13T15:40:01  |  Successful  |  Launching a new EC2 instance: i-0a1b2c3... |
-------------------------------------------------------------------------------------
```

### Step 3. 🔍 자동 복구 증명 — 인스턴스를 일부러 죽이기 (20분)

**오늘의 핵심 실험입니다.**

```bash
$ VICTIM=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].Instances[0].InstanceId' --output text)
$ echo "희생자: $VICTIM"
희생자: i-0a1b2c3d4e5f60718

$ date && aws ec2 terminate-instances --instance-ids $VICTIM
Thu Aug 13 15:52:10 UTC 2026
```

> ⏱ **지금 시각을 기록하세요.** 복구 시간을 측정합니다.

**1~2분마다 상태 확인**

```bash
$ aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].Instances[*].[InstanceId,LifecycleState,HealthStatus]' \
    --output table
------------------------------------------------------------------
|  i-0a1b2c3d4e5f60718 |  Terminating  |  Unhealthy             |
|  i-0f9e8d7c6b5a40312 |  InService    |  Healthy               |
|  i-0c3d4e5f6a7b81920 |  Pending      |  Healthy               |   ← 새로 생겼다!
------------------------------------------------------------------
```

**활동 기록에 전 과정이 남습니다.**

```bash
$ aws autoscaling describe-scaling-activities --auto-scaling-group-name course-asg \
    --max-items 4 --query 'Activities[*].[StartTime,StatusCode,Description,Cause]' --output json
[
  ["2026-08-13T15:52:41Z", "Successful", "Launching a new EC2 instance: i-0c3d4e5f6a7b81920",
   "At 2026-08-13T15:52:38Z an instance was taken out of service in response to a
    difference between desired and actual capacity, increasing the capacity from 1 to 2."],
  ["2026-08-13T15:52:20Z", "Successful", "Terminating EC2 instance: i-0a1b2c3d4e5f60718",
   "At 2026-08-13T15:52:15Z instance i-0a1b2c3d4e5f60718 was taken out of service in
    response to an EC2 health check indicating it has been terminated or stopped."]
]
```

**복구 시간 측정**

```bash
$ aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].Instances[?LifecycleState==`InService`].InstanceId' --output text
i-0f9e8d7c6b5a40312    i-0c3d4e5f6a7b81920
$ date
Thu Aug 13 15:55:47 UTC 2026
```

| 항목 | 값 |
|---|---|
| 종료 시각 | 15:52:10 |
| ASG 감지 | 15:52:15 (**5초**) |
| 새 인스턴스 시작 | 15:52:41 |
| InService 도달 | 15:55:47 |
| **총 복구 시간** | **약 3분 37초** |

> ✅ **사람이 아무것도 하지 않았는데 서비스가 원래 대수로 돌아왔습니다.** 이 표를 과제로 제출합니다.

### Step 4. EC2 헬스 체크의 한계 확인 (10분)

이번엔 **인스턴스는 살려 두고 nginx만 죽여** 봅니다.

```bash
$ TARGET=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].Instances[0].InstanceId' --output text)

$ aws ssm start-session --target $TARGET
sh-5.2$ sudo systemctl stop nginx
sh-5.2$ curl -m 3 localhost
curl: (7) Failed to connect to localhost port 80: Connection refused
sh-5.2$ exit
```

**5분 뒤 ASG 상태를 봅니다.**

```bash
$ aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].Instances[*].[InstanceId,HealthStatus]' --output table
------------------------------------------------------
|  i-0f9e8d7c6b5a40312 |  Healthy                    |   ← nginx가 죽었는데도 "Healthy"
|  i-0c3d4e5f6a7b81920 |  Healthy                    |
------------------------------------------------------
```

> 🔴 **ASG는 이 인스턴스를 정상으로 봅니다.** OS는 멀쩡하기 때문입니다.
> **사용자는 서비스를 못 쓰는데 ASG는 아무 일도 하지 않습니다.**
>
> ✅ **해결은 [11강](lesson-11.md)에서** — ALB를 붙이고 헬스 체크 유형을 `ELB` 로 바꾸면 애플리케이션 수준 장애도 감지합니다.

nginx를 다시 켜 둡니다.

```bash
$ aws ssm start-session --target $TARGET
sh-5.2$ sudo systemctl start nginx && exit
```

### Step 5. 타깃 추적 정책과 부하 테스트 (30분)

**① 크레딧 모드를 standard로 — 예상 밖 과금 방지**

```bash
$ for I in $(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
      --query 'AutoScalingGroups[0].Instances[*].InstanceId' --output text); do
    aws ec2 modify-instance-credit-specification \
      --instance-credit-specification "InstanceId=$I,CpuCredits=standard"
  done
```

**② 타깃 추적 정책 추가**

```bash
$ cat > tt-policy.json <<'EOF'
{
  "TargetValue": 50.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ASGAverageCPUUtilization"
  }
}
EOF

$ aws autoscaling put-scaling-policy \
    --auto-scaling-group-name course-asg \
    --policy-name cpu-target-50 \
    --policy-type TargetTrackingScaling \
    --target-tracking-configuration file://tt-policy.json \
    --estimated-instance-warmup 180 \
    --query 'PolicyARN' --output text
arn:aws:autoscaling:ap-northeast-2:123456789012:scalingPolicy:...:policyName/cpu-target-50
```

> 💡 이 명령 하나로 **CloudWatch 알람 2개(확장용·축소용)가 자동 생성**됩니다.

```bash
$ aws cloudwatch describe-alarms --alarm-name-prefix TargetTracking \
    --query 'MetricAlarms[*].[AlarmName,Threshold,ComparisonOperator]' --output table
--------------------------------------------------------------------------------
| TargetTracking-course-asg-AlarmHigh-...  |  50.0  |  GreaterThanThreshold     |
| TargetTracking-course-asg-AlarmLow-...   |  35.0  |  LessThanThreshold        |
--------------------------------------------------------------------------------
```

**③ 부하 발생**

모든 인스턴스에서 CPU를 태웁니다.

```bash
$ for I in $(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
      --query 'AutoScalingGroups[0].Instances[*].InstanceId' --output text); do
    aws ssm send-command --instance-ids $I \
      --document-name "AWS-RunShellScript" \
      --parameters 'commands=["nohup timeout 900 bash -c \"while :; do :; done\" &","nohup timeout 900 bash -c \"while :; do :; done\" &"]' \
      --query 'Command.CommandId' --output text
  done
```

> 💡 `timeout 900` 으로 **15분 뒤 자동 종료**되게 했습니다. 부하를 끄는 것을 잊어도 안전합니다.

**④ 지표와 확장 관찰** (5~10분)

```bash
$ watch -n 30 'aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names course-asg \
    --query "AutoScalingGroups[0].{원하는:DesiredCapacity,인스턴스:Instances[*].[InstanceId,LifecycleState]}"'
```

CPU가 50%를 넘으면 알람이 울리고 `DesiredCapacity` 가 올라갑니다.

```bash
$ aws autoscaling describe-scaling-activities --auto-scaling-group-name course-asg \
    --max-items 2 --query 'Activities[*].[StartTime,Description,Cause]' --output json
[
  ["2026-08-13T16:14:33Z", "Launching a new EC2 instance: i-0e5f6a7b8c9d01234",
   "At 2026-08-13T16:14:28Z a monitor alarm TargetTracking-course-asg-AlarmHigh-...
    in state ALARM triggered policy cpu-target-50 changing the desired capacity
    from 2 to 3."]
]
```

**CPU 지표 확인**

```bash
$ aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 --metric-name CPUUtilization \
    --dimensions Name=AutoScalingGroupName,Value=course-asg \
    --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 --statistics Average \
    --query 'sort_by(Datapoints,&Timestamp)[*].[Timestamp,Average]' --output table
------------------------------------------------------
|  2026-08-13T15:50:00Z  |  1.4                      |
|  2026-08-13T15:55:00Z  |  2.1                      |
|  2026-08-13T16:00:00Z  |  68.3                     |   ← 부하 시작
|  2026-08-13T16:05:00Z  |  97.5                     |
|  2026-08-13T16:10:00Z  |  98.1                     |
|  2026-08-13T16:15:00Z  |  71.2                     |   ← 3대로 확장되어 평균 하락
|  2026-08-13T16:20:00Z  |  52.6                     |   ← 4대
------------------------------------------------------
```

> ✅ **평균 CPU가 목표값 50%를 향해 수렴하는 것**이 타깃 추적의 동작입니다. 이 표를 과제로 제출합니다.

**⑤ 부하 종료 후 스케일 인 확인**

부하는 15분 뒤 자동으로 멈춥니다. 그 후 CPU가 35% 아래로 내려가면 축소가 시작됩니다.

> ⏱ **스케일 인은 스케일 아웃보다 훨씬 보수적입니다.** 기본적으로 **15분간 낮은 상태가 지속**되어야 줄입니다. 성급하게 줄였다가 다시 늘리는 것을 막기 위해서입니다.

### Step 6. 인스턴스 새로 고침 — 무중단 롤링 교체 (15분)

시작 템플릿에 새 버전을 만들고 순차 교체합니다.

```bash
$ sed -i 's|<h1>AWS Course Web</h1>|<h1>AWS Course Web v2</h1>|' user-data.sh
$ B64=$(base64 -w 0 user-data.sh)
$ aws ec2 create-launch-template-version --launch-template-id $LT_ID \
    --source-version '$Default' --version-description "v2 title" \
    --launch-template-data "{\"UserData\":\"$B64\"}" \
    --query 'LaunchTemplateVersion.VersionNumber' --output text
4
$ aws ec2 modify-launch-template --launch-template-id $LT_ID --default-version 4
```

**새로 고침 시작**

```bash
$ aws autoscaling start-instance-refresh \
    --auto-scaling-group-name course-asg \
    --preferences '{"MinHealthyPercentage":50,"InstanceWarmup":180}' \
    --query 'InstanceRefreshId' --output text
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**진행 상황 확인**

```bash
$ aws autoscaling describe-instance-refreshes --auto-scaling-group-name course-asg \
    --query 'InstanceRefreshes[0].[Status,PercentageComplete,InstancesToUpdate]' --output table
------------------------------------------
|  InProgress  |  50   |  1              |
------------------------------------------
```

> 💡 **`MinHealthyPercentage: 50`** 이므로 항상 절반 이상이 서비스 중입니다. 사용자 입장에서는 중단이 없습니다.
> 완료까지 몇 분 걸립니다. `Successful` 이 되면 모든 인스턴스가 v2로 교체된 것입니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| EC2 t3.micro × 2~4대 | ✅ 750h **합산** | $0 ~ 0.3 | 4대 약 $37 |
| **NAT Gateway** | ❌ | 약 $0.36 | 🔴 약 $42 |
| 탄력적 IP | ❌ | 약 $0.03 | 약 $3.6 |
| CloudWatch 알람(타깃 추적 2개) | ✅ 10개 무료 | $0 | 초과 시 개당 $0.10 |
| Auto Scaling 자체 | **무료** | $0 | $0 |
| **합계** | | **약 $0.4** | **약 $83** |

> 🔴 **이번 강 최대 사고 유형 — ASG를 지우지 않고 인스턴스만 지우는 것.**
> ASG는 원하는 용량을 유지하려고 **계속 새 인스턴스를 만듭니다.** 지워도 지워도 다시 생깁니다.
> **반드시 ASG를 먼저 삭제**하세요.

### 🧹 리소스 정리 체크리스트

```bash
# 1) ⭐ ASG를 먼저 삭제 (인스턴스도 함께 종료됨)
$ aws autoscaling delete-auto-scaling-group \
    --auto-scaling-group-name course-asg --force-delete

# 2) 인스턴스가 전부 사라졌는지 확인 (1~2분 소요)
$ aws ec2 describe-instances \
    --filters "Name=tag:Project,Values=aws-course" "Name=instance-state-name,Values=running,pending" \
    --query 'Reservations[*].Instances[*].InstanceId' --output text

# 3) NAT Gateway + EIP
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 4) 타깃 추적이 만든 CloudWatch 알람 확인 (ASG 삭제 시 자동 정리되지만 확인)
$ aws cloudwatch describe-alarms --alarm-name-prefix TargetTracking \
    --query 'MetricAlarms[*].AlarmName' --output text

# 5) VPC 정리 (07강 스크립트)
```

- [ ] 🔴 **ASG 먼저 삭제** (`--force-delete`)
- [ ] 인스턴스 0개 확인
- [ ] NAT Gateway 삭제 + EIP 반환
- [ ] CloudWatch 알람 정리
- [ ] ⭐ **시작 템플릿은 유지** ([11강](lesson-11.md)에서 사용)
- [ ] VPC 삭제 또는 유지
- [ ] 다음 날 Cost Explorer 확인

---

## ⑤ 자주 하는 실수

### 인스턴스를 지워도 계속 새로 생긴다

**증상** — `terminate-instances` 로 지웠는데 몇 초 뒤 새 인스턴스가 생깁니다.
**원인** — **의도된 동작입니다.** ASG가 원하는 용량을 유지하고 있습니다.
**해결** — 정리할 때는 순서를 지킵니다.

```bash
# 방법 1: 한 번에
$ aws autoscaling delete-auto-scaling-group --auto-scaling-group-name course-asg --force-delete

# 방법 2: 단계적으로 (운영 환경 권장)
$ aws autoscaling update-auto-scaling-group --auto-scaling-group-name course-asg \
    --min-size 0 --desired-capacity 0
$ aws autoscaling delete-auto-scaling-group --auto-scaling-group-name course-asg
```

### ASG가 인스턴스를 만들었다 죽였다 반복한다

```bash
$ aws autoscaling describe-scaling-activities --auto-scaling-group-name course-asg \
    --max-items 5 --query 'Activities[*].[StatusCode,Description]' --output text
Successful    Terminating EC2 instance: i-0abc...
Successful    Launching a new EC2 instance: i-0def...
Successful    Terminating EC2 instance: i-0ghi...
```

**원인** — 새 인스턴스가 **헬스 체크를 통과하지 못하고** 계속 교체됩니다.

| 원인 | 확인 |
|---|---|
| 유예 기간이 짧다 | `--health-check-grace-period` 를 부팅 시간보다 길게 (180~300초) |
| 사용자 데이터 실패 | 인스턴스에 접속해 `/var/log/cloud-init-output.log` |
| **NAT/라우팅이 없어 부팅 실패** | 패키지 설치 타임아웃 |
| ELB 헬스 체크 경로 오류 | `/health` 가 200을 반환하는지 |

**디버깅 요령** — 교체되기 전에 인스턴스를 **대기(standby)** 로 빼면 조사 시간을 벌 수 있습니다.

```bash
$ aws autoscaling enter-standby --instance-ids i-0abc... \
    --auto-scaling-group-name course-asg --should-decrement-desired-capacity
```

### 인스턴스가 한 AZ에만 몰린다

**원인 후보**

| 원인 | 해결 |
|---|---|
| `--vpc-zone-identifier` 에 서브넷 1개만 지정 | 2개 이상 지정 |
| 한 AZ의 인스턴스 타입 재고 부족 | 다른 타입도 허용(혼합 인스턴스 정책) |
| 서브넷 IP 고갈 | `AvailableIpAddressCount` 확인 |

```bash
$ aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].VPCZoneIdentifier' --output text
subnet-0app2a...,subnet-0app2c...     ← 2개여야 정상
```

### 부하를 걸었는데 확장되지 않는다

**확인 순서**

```bash
# ① 정책이 있나
$ aws autoscaling describe-policies --auto-scaling-group-name course-asg \
    --query 'ScalingPolicies[*].[PolicyName,PolicyType]' --output table

# ② 알람이 ALARM 상태인가
$ aws cloudwatch describe-alarms --alarm-name-prefix TargetTracking \
    --query 'MetricAlarms[*].[AlarmName,StateValue]' --output table

# ③ 최대 용량에 걸린 건 아닌가
$ aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names course-asg \
    --query 'AutoScalingGroups[0].[MinSize,MaxSize,DesiredCapacity]' --output text
2   4   4      ← 이미 최대치면 더 못 늘린다
```

**시간 문제일 수도 있습니다.** 기본 지표 수집은 **5분 간격**이라 반응까지 최소 5~10분이 걸립니다. 급하다면 **세부 모니터링(1분)** 을 켜지만 인스턴스당 월 약 $2.10이 추가됩니다.

### 스케일 인이 안 일어난다

**원인** — 스케일 인은 매우 보수적입니다.

| 요인 | 기본값 |
|---|---|
| 낮은 상태 지속 시간 | **15분** |
| 최소 용량 | min 아래로는 절대 안 줄임 |
| 축소 보호(scale-in protection) | 켜져 있으면 해당 인스턴스는 제외 |

**해결** — 실습에서는 기다리거나 `--desired-capacity` 를 직접 낮춥니다.

```bash
$ aws autoscaling set-desired-capacity --auto-scaling-group-name course-asg --desired-capacity 2
```

### 세션이 끊기고 로그인이 풀린다

**원인** — 스케일 인으로 인스턴스가 사라졌고, 그 안에 **세션이 저장**되어 있었습니다.
**해결** — 상태를 인스턴스 밖으로 뺍니다.

| 상태 | 이동할 곳 |
|---|---|
| 세션 | ElastiCache / DynamoDB ([17강](../03-serverless-automation/lesson-17.md)) |
| 업로드 파일 | S3 / EFS ([13·14강](lesson-13.md)) |
| 로그 | CloudWatch Logs ([22강](../03-serverless-automation/lesson-22.md)) |

**임시 방편**으로 ALB 스티키 세션을 쓸 수 있지만([11강](lesson-11.md)), 인스턴스가 사라지면 여전히 세션이 사라집니다. **근본 해결이 아닙니다.**

### 시작 템플릿을 고쳤는데 기존 인스턴스가 안 바뀐다

**원인** — **의도된 동작입니다.** 템플릿 변경은 **새로 만들어지는 인스턴스**에만 적용됩니다.
**해결** — **인스턴스 새로 고침**으로 교체합니다.

```bash
$ aws autoscaling start-instance-refresh --auto-scaling-group-name course-asg \
    --preferences '{"MinHealthyPercentage":50,"InstanceWarmup":180}'
```

**주의** — ASG가 `Version=$Default` 를 참조한다면 **기본 버전을 바꿔야** 새 버전이 적용됩니다.

---

## ⑥ 확인 문제

**1.** 인스턴스의 nginx 프로세스만 죽었습니다. OS는 정상입니다. 헬스 체크 유형이 `EC2` 일 때와 `ELB` 일 때 각각 어떻게 되나요?

<details>
<summary>답 보기</summary>

| 헬스 체크 유형 | 판정 | 결과 |
|---|---|---|
| **EC2** | **Healthy** (OS 정상) | 🚫 교체하지 않음 → **사용자는 계속 오류를 봄** |
| **ELB** | **Unhealthy** (HTTP 응답 없음) | ✅ 종료 후 새 인스턴스로 교체 |

**EC2 헬스 체크가 보는 것**
- 시스템 상태 검사: AWS 인프라(호스트·네트워크) 문제
- 인스턴스 상태 검사: OS 커널 패닉, 파일 시스템 손상 등

**애플리케이션은 보지 않습니다.**

**따라서 실무 원칙** — 웹 서비스라면 **반드시 ELB 헬스 체크**를 씁니다.

```bash
$ aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name course-asg \
    --health-check-type ELB --health-check-grace-period 300
```

> ⚠️ **유예 기간을 충분히** 주어야 합니다. 부팅 중인 인스턴스가 아직 응답하지 못할 때 비정상으로 판정되면 **무한 교체 루프**에 빠집니다.
> [11강](lesson-11.md)에서 ALB를 붙이며 이 설정으로 전환합니다.
</details>

**2.** ASG의 최대 용량(max)을 20으로 설정하고 부하 테스트를 돌렸습니다. 어떤 위험이 있나요?

<details>
<summary>답 보기</summary>

**비용이 통제되지 않습니다.** 최대 용량은 성능 상한이자 **비용 상한**입니다.

**계산 (t3.micro, 서울, 시간당 $0.0130)**

| 대수 | 시간당 | 하루 | 한 달 |
|---|---|---|---|
| 4대 | $0.052 | $1.25 | 약 $38 |
| **20대** | **$0.26** | **$6.24** | **약 $190** |

여기에 EBS·데이터 전송·ALB LCU가 더해집니다. **프리 티어 750시간은 20대면 1.5일 만에 소진**됩니다.

**추가 위험**
- 부하 테스트 스크립트에 버그가 있어 부하가 안 멈추면 계속 확장됩니다
- 스케일 인은 15분 이상 걸리므로 **끄고 나서도 한동안 20대가 유지**됩니다

**안전 장치**

| 수단 | 내용 |
|---|---|
| 최대 용량 제한 | 실습은 **4 이하** |
| 예산 알림 | [02강](../01-cloud-foundation/lesson-02.md)의 $5/$10/$20 |
| 부하 도구에 시간 제한 | `timeout 900` 처럼 자동 종료 |
| 테스트 후 즉시 확인 | `describe-auto-scaling-groups` 로 대수 확인 |

> [29강 부하 테스트](../04-final-project/lesson-29.md)에서도 같은 주의가 반복됩니다.
</details>

**3.** 스케일 인이 발생하자 일부 사용자의 로그인이 풀렸습니다. 원인과 근본 해결책은?

<details>
<summary>답 보기</summary>

**원인** — **세션 정보가 인스턴스 메모리(또는 로컬 디스크)에 저장**되어 있었고, 그 인스턴스가 종료되면서 함께 사라졌습니다.

```
 사용자 A ── 로그인 ──▶ 인스턴스 1 (세션 저장)
 스케일 인으로 인스턴스 1 종료
 사용자 A ── 다음 요청 ──▶ 인스턴스 2 (세션 없음) → 로그아웃
```

**근본 해결 — 상태를 인스턴스 밖으로**

| 상태 | 이동할 곳 |
|---|---|
| 세션 | **ElastiCache(Redis)** 또는 DynamoDB |
| 업로드 파일 | **S3** (또는 공유가 필요하면 EFS) |
| 로그 | **CloudWatch Logs** |
| 데이터 | **RDS** |

**임시 방편과 그 한계**

| 방법 | 한계 |
|---|---|
| ALB 스티키 세션 | 같은 인스턴스로 보내 주지만, **그 인스턴스가 사라지면 세션도 사라짐** |
| 종료 보호 | 확장 자체가 무의미해짐 |

**핵심 원칙** — **무상태(stateless) 애플리케이션.**
"어느 인스턴스가 요청을 받아도 결과가 같다"가 되어야 Auto Scaling·컨테이너·서버리스가 전부 성립합니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| ASG 3역할 | 용량 조절 · **자동 복구** · **AZ 분산** |
| 용량 3값 | min(가용성 하한) · desired(현재) · **max(비용 상한)** |
| 헬스 체크 | EC2는 OS만, **ELB는 애플리케이션까지** |
| 유예 기간 | 부팅 시간보다 길게(180~300초). 짧으면 **무한 교체 루프** |
| 타깃 추적 | "평균 CPU 50% 유지" — 알람 2개 자동 생성 |
| 확장 지연 | 지표 5분 + 부팅 2분 ≈ **4~5분**. 부팅 시간을 줄이는 게 핵심 |
| 스케일 인 | **보수적(15분)**. 급하면 desired 직접 조정 |
| 인스턴스 새로 고침 | 최소 정상 비율로 무중단 롤링 교체 |
| 정리 | 🔴 **ASG를 먼저 삭제** |

**한 장 요약**

```
  시작 템플릿(09강) ──▶ ASG ──▶ 2개 AZ에 자동 배치
                        │
                        ├─ 죽으면 자동 복구 (3~4분)
                        ├─ 부하 오면 자동 확장 (타깃 추적)
                        └─ 템플릿 바뀌면 롤링 교체

  단, 상태는 인스턴스 밖에!  (세션→캐시, 파일→S3, 로그→CloudWatch)
```

**오늘 반드시 기억할 한 가지**
> **ASG는 "원하는 용량"을 지키는 기계입니다.**
> 그래서 인스턴스를 지워도 다시 만들고, 그래서 정리할 때는 ASG를 먼저 지웁니다.

**과제**
1. **자동 복구 실험 기록** — 종료 시각 / ASG 감지 시각 / 새 인스턴스 InService 시각 / **총 복구 시간**을 표로. 활동 기록(`describe-scaling-activities`) 출력도 함께.
2. **EC2 헬스 체크의 한계 증명** — nginx를 죽였는데도 `Healthy` 로 남는 화면과, 이것이 왜 문제인지 3줄.
3. **부하 테스트 그래프** — CPU 지표 시계열(`get-metric-statistics`)과 그에 따른 `DesiredCapacity` 변화.
4. 인스턴스 새로 고침 실행 기록 — 진행률과 완료 상태, 그리고 **교체 중에도 서비스가 유지됐는지** 확인 방법.
5. "우리 서비스의 세션을 어디에 둘 것인가"를 근거와 함께 5줄로 쓰세요.
6. 정리 확인 — ASG 0개, 인스턴스 0개, NAT 0개 출력.

---

[← 이전 09강](lesson-09.md) · [목차](README.md) · [다음 → 11강 Elastic Load Balancing](lesson-11.md)
