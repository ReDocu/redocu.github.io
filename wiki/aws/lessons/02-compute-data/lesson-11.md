# 11강 · Elastic Load Balancing

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **11강 / 총 32강**
> [← 이전 10강](lesson-10.md) · [목차](README.md) · [다음 → 12강 Route 53과 ACM으로 HTTPS](lesson-12.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- ALB · NLB · GWLB의 차이를 **계층과 용도로 구분**해 선택할 수 있다.
- 리스너 · 규칙 · 대상 그룹의 **3단 구조**를 이해하고 구성할 수 있다.
- ASG를 대상 그룹에 연결해 **트래픽을 2개 AZ로 분산**할 수 있다.
- 헬스 체크로 **비정상 인스턴스가 자동 제외**되는 것을 증명할 수 있다.
- 경로 기반 라우팅과 연결 드레이닝을 **실습으로 확인**할 수 있다.

---

## ② 왜 필요한가

[10강](lesson-10.md)에서 만든 ASG에는 세 가지 문제가 남아 있습니다.

**① 접속할 방법이 없다**
인스턴스는 프라이빗 서브넷에 있고 퍼블릭 IP도 없습니다. 사용자가 어디로 접속해야 하나요?

**② IP를 알려 줄 수도 없다**
설령 퍼블릭 IP를 준다 해도, 인스턴스는 **자동으로 생기고 사라집니다.** 어제의 IP가 오늘은 존재하지 않습니다.

**③ 죽은 서버로도 요청이 간다**
[10강 Step 4](lesson-10.md)에서 확인했듯이, nginx가 죽어도 ASG는 모릅니다. 사용자만 오류를 봅니다.

**로드밸런서가 세 문제를 한 번에 해결합니다.**

```
                         변하지 않는 하나의 주소
   사용자 ──────▶ [ALB] ──┬──▶ 인스턴스 A (정상)  ✅ 트래픽 받음
                         ├──▶ 인스턴스 B (정상)  ✅ 트래픽 받음
                         └──✗  인스턴스 C (비정상) 🚫 자동 제외
```

그리고 하나 더 — **로드밸런서는 TLS를 종료하는 지점**이기도 합니다. 인증서를 서버마다 넣을 필요 없이 ALB에 한 번만 붙이면 됩니다. [12강](lesson-12.md)에서 바로 이어집니다.

---

## ③ 개념 설명

### ELB 3형제 — 선택 기준

| | **ALB** (Application) | **NLB** (Network) | GWLB (Gateway) |
|---|---|---|---|
| 계층 | **L7** (HTTP/HTTPS) | **L4** (TCP/UDP/TLS) | L3 |
| 라우팅 | **경로·호스트·헤더·쿼리 기반** | 포트 기반 | 어플라이언스로 전달 |
| 지연 | 밀리초 | **마이크로초** | — |
| 처리량 | 높음 | **초당 수백만 요청** | — |
| 고정 IP | ❌ (DNS 이름만) | ✅ **AZ당 고정 IP·EIP 가능** | — |
| 대상 | 인스턴스 · IP · **Lambda** | 인스턴스 · IP · ALB | 어플라이언스 |
| WebSocket/HTTP2 | ✅ | (통과) | — |
| 대표 용도 | **웹 서비스, 마이크로서비스** | 게임 서버, IoT, 금융 거래 | 방화벽·IDS 삽입 |

> **선택 한 줄 기준**
> - HTTP 기반 웹 서비스 → **ALB** (이 과정의 기본)
> - 초저지연·고정 IP·비HTTP 프로토콜 → **NLB**
> - 보안 어플라이언스를 트래픽 경로에 끼워야 함 → **GWLB**

### ALB의 3단 구조

```
 ┌─ ALB (course-alb) ────────────────────────────────────┐
 │                                                        │
 │  리스너 :80                                             │
 │    └─ 규칙 1: 경로가 /admin/* → 고정 응답 403           │
 │    └─ 규칙 2: 경로가 /api/*   → 대상 그룹 B             │
 │    └─ 기본 규칙:               → 대상 그룹 A            │
 │                                     │                  │
 │  리스너 :443 (12강에서 추가)          │                  │
 └─────────────────────────────────────┼──────────────────┘
                                        ▼
                        ┌─ 대상 그룹 A (HTTP:80) ──────┐
                        │  헬스 체크: GET /health      │
                        │  ├─ i-aaa (healthy)         │
                        │  ├─ i-bbb (healthy)         │
                        │  └─ i-ccc (unhealthy) 🚫     │
                        └─────────────────────────────┘
```

| 요소 | 역할 |
|---|---|
| **리스너(Listener)** | 어떤 **포트/프로토콜**로 받을지 |
| **규칙(Rule)** | 조건에 따라 **어느 대상 그룹으로** 보낼지 (우선순위 순) |
| **대상 그룹(Target Group)** | 실제 **트래픽을 받을 대상 묶음** + **헬스 체크 설정** |

### 헬스 체크 — ALB의 핵심 기능

| 파라미터 | 기본값 | 의미 |
|---|---|---|
| 경로(Path) | `/` | 어디로 요청을 보낼지 |
| 프로토콜/포트 | HTTP / traffic-port | 대상 포트 |
| 정상 임계값 | 5 | **연속 N번 성공하면 정상** |
| 비정상 임계값 | 2 | **연속 N번 실패하면 비정상** |
| 시간 초과 | 5초 | 응답 대기 시간 |
| **간격(Interval)** | **30초** | 검사 주기 |
| 성공 코드 | 200 | 정상으로 볼 HTTP 코드 |

**장애 감지까지 걸리는 시간 = 간격 × 비정상 임계값**

```
 기본값:  30초 × 2 = 최대 60초 (+ 진행 중 요청 처리 시간)
 빠르게:  10초 × 2 = 최대 20초   ← 실습에서 사용
```

> ⚠️ **너무 빠르게 잡으면** 일시적 지연에도 인스턴스가 빠졌다 들어왔다(flapping) 합니다.
> ⚠️ **헬스 체크 경로는 가볍게** 만듭니다. DB 조회를 넣으면 DB가 느려질 때 모든 서버가 한꺼번에 비정상 판정될 수 있습니다.

### 알아 둘 동작 3가지

| 기능 | 내용 |
|---|---|
| **교차 영역 부하 분산** | ALB는 **항상 켜져 있고 무료**. NLB는 기본 꺼짐이며 켜면 **AZ 간 데이터 전송료 발생** |
| **스티키 세션** | 쿠키로 같은 대상에 고정. **근본 해결이 아님**([10강](lesson-10.md) 참고) |
| **연결 드레이닝(등록 취소 지연)** | 대상을 뺄 때 **진행 중 요청이 끝날 때까지 대기**. 기본 300초 |

> 💡 **연결 드레이닝이 무중단 배포의 열쇠입니다.** 이 값이 0이면 배포 중 사용자 요청이 끊깁니다.

### ALB 비용 구조

```
 ALB 비용 = 시간당 요금 + LCU 요금

 시간당: $0.0225 (서울)  → 월 약 $16.4
 LCU:    $0.008 / LCU-시간
   LCU = max(새 연결 수, 활성 연결 수, 처리 바이트, 규칙 평가) 중 최댓값 기준
```

> 🔴 **ALB는 프리 티어에 포함되지 않습니다.** 만들면 시간당 과금이 시작되고, **켜 두면 월 $16 이상**입니다.
> 실습에서는 만들고 그날 지웁니다.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.2 ~ 0.3** — ALB와 NAT가 대부분입니다.
> ⚠️ [10강](lesson-10.md)의 ASG와 시작 템플릿이 필요합니다.

### Step 1. 환경 복원 (10분)

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh

$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
$ NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ALLOC \
    --query 'NatGateway.NatGatewayId' --output text)
$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID

$ LT_ID=$(aws ec2 describe-launch-templates --launch-template-names course-web-template \
    --query 'LaunchTemplates[0].LaunchTemplateId' --output text)
$ aws ec2 create-launch-template-version --launch-template-id $LT_ID \
    --source-version '$Latest' --version-description "sg update" \
    --launch-template-data "{\"SecurityGroupIds\":[\"$SG_APP\"]}" \
    --query 'LaunchTemplateVersion.VersionNumber' --output text
$ aws ec2 modify-launch-template --launch-template-id $LT_ID --default-version '$Latest'
```

**ALB용 보안 그룹 규칙 확인** — [07강](../01-cloud-foundation/lesson-07.md)에서 만든 구조를 그대로 씁니다.

```bash
$ aws ec2 describe-security-groups --group-ids $SG_APP \
    --query 'SecurityGroups[0].IpPermissions[*].{포트:FromPort,소스SG:UserIdGroupPairs[0].GroupId}' \
    --output table
--------------------------------
|  80  |  sg-0web1234567890    |    ← 웹(ALB) SG에서 오는 80만 허용
--------------------------------
```

> ⭐ **이 구조가 핵심입니다.** 앱 인스턴스는 인터넷에서 직접 못 오고, **ALB를 거친 트래픽만** 받습니다.

### Step 2. 대상 그룹 만들기 (10분)

```bash
$ TG_ARN=$(aws elbv2 create-target-group \
    --name course-tg-web \
    --protocol HTTP --port 80 --vpc-id $VPC_ID \
    --target-type instance \
    --health-check-protocol HTTP \
    --health-check-path /health/ \
    --health-check-interval-seconds 10 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2 \
    --matcher HttpCode=200 \
    --query 'TargetGroups[0].TargetGroupArn' --output text)
$ echo $TG_ARN
arn:aws:elasticloadbalancing:ap-northeast-2:123456789012:targetgroup/course-tg-web/a1b2c3d4e5f60718
```

**연결 드레이닝 시간 조정** — 실습에서는 짧게 둡니다.

```bash
$ aws elbv2 modify-target-group-attributes --target-group-arn $TG_ARN \
    --attributes Key=deregistration_delay.timeout_seconds,Value=30
```

> 📌 `/health/` 의 마지막 슬래시에 주의하세요. [09강](lesson-09.md) 사용자 데이터에서 `/usr/share/nginx/html/health/index.html` 로 만들었으므로 디렉터리 인덱스 방식입니다.

### Step 3. ALB 만들기 (15분)

```bash
$ ALB_ARN=$(aws elbv2 create-load-balancer \
    --name course-alb \
    --type application --scheme internet-facing \
    --subnets $PUB_A $PUB_C \
    --security-groups $SG_WEB \
    --tags Key=Project,Value=aws-course Key=Week,Value=W06 \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

$ aws elbv2 wait load-balancer-available --load-balancer-arns $ALB_ARN
```

> 🔴 **여기서 시간당 과금이 시작됩니다.** 시각을 기록하세요.
> ⚠️ **ALB는 최소 2개 AZ의 서브넷**을 요구합니다. 하나만 주면 오류가 납니다.

**리스너 생성**

```bash
$ LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --query 'Listeners[0].ListenerArn' --output text)
```

**ALB의 DNS 이름 확인** — 이것이 **변하지 않는 주소**입니다.

```bash
$ ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)
$ echo $ALB_DNS
course-alb-1234567890.ap-northeast-2.elb.amazonaws.com
```

**보안 그룹에 내 IP 허용** (실습 중 접속용)

```bash
$ MY_IP=$(curl -s https://checkip.amazonaws.com)
$ aws ec2 authorize-security-group-ingress --group-id $SG_WEB \
    --protocol tcp --port 80 --cidr ${MY_IP}/32
```

### Step 4. ASG를 대상 그룹에 연결 ⭐ (10분)

```bash
$ aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name course-asg \
    --launch-template "LaunchTemplateId=$LT_ID,Version=\$Default" \
    --min-size 2 --max-size 4 --desired-capacity 2 \
    --vpc-zone-identifier "$APP_A,$APP_C" \
    --target-group-arns $TG_ARN \
    --health-check-type ELB \
    --health-check-grace-period 300 \
    --tags "Key=Name,Value=course-web,PropagateAtLaunch=true" \
           "Key=Project,Value=aws-course,PropagateAtLaunch=true"
```

**두 가지가 [10강](lesson-10.md)과 달라졌습니다.**

| 옵션 | 의미 |
|---|---|
| `--target-group-arns $TG_ARN` | 새로 생기는 인스턴스가 **자동으로 대상 그룹에 등록** |
| `--health-check-type ELB` ⭐ | **애플리케이션 수준 장애도 감지** ([10강 Step 4](lesson-10.md)의 한계 해결) |

> ⚠️ **유예 기간을 300초로** 늘렸습니다. ELB 헬스 체크는 부팅 직후 실패할 수밖에 없으므로, 유예가 짧으면 **무한 교체 루프**에 빠집니다.

**대상 등록 상태 확인** (2~3분 기다립니다)

```bash
$ aws elbv2 describe-target-health --target-group-arn $TG_ARN \
    --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason]' \
    --output table
------------------------------------------------------------------
|  i-0a1b2c3d4e5f60718 |  initial  |  Elb.RegistrationInProgress  |
|  i-0f9e8d7c6b5a40312 |  initial  |  Elb.RegistrationInProgress  |
------------------------------------------------------------------
```

잠시 후:

```bash
$ aws elbv2 describe-target-health --target-group-arn $TG_ARN \
    --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]' --output table
--------------------------------------------
|  i-0a1b2c3d4e5f60718 |  healthy          |
|  i-0f9e8d7c6b5a40312 |  healthy          |
--------------------------------------------
```

### Step 5. 🔍 부하 분산 증명 (10분)

```bash
$ curl -s http://$ALB_DNS | grep instance
<tr><td>instance</td><td><b>i-0a1b2c3d4e5f60718</b></td></tr>

$ curl -s http://$ALB_DNS | grep instance
<tr><td>instance</td><td><b>i-0f9e8d7c6b5a40312</b></td></tr>
```

**10번 호출해 분포 확인**

```bash
$ for i in $(seq 1 10); do
    curl -s http://$ALB_DNS | grep -oP '(?<=<b>)i-[a-z0-9]+' | head -1
  done | sort | uniq -c
      5 i-0a1b2c3d4e5f60718
      5 i-0f9e8d7c6b5a40312
```

**AZ 분포도 확인**

```bash
$ for i in $(seq 1 10); do
    curl -s http://$ALB_DNS | grep -oP '(?<=<b>)ap-northeast-2[a-d]'
  done | sort | uniq -c
      5 ap-northeast-2a
      5 ap-northeast-2c
```

> ✅ **두 AZ에 고르게 분산**되고 있습니다. 이것이 **교차 영역 부하 분산**의 효과입니다.
> 브라우저에서 `http://<ALB_DNS>` 를 새로고침하면 카드의 instance 값이 번갈아 바뀝니다.

### Step 6. 🔍 헬스 체크 증명 — 애플리케이션 장애 감지 (20분)

[10강](lesson-10.md)에서 실패했던 실험을 다시 합니다.

```bash
$ TARGET=$(aws elbv2 describe-target-health --target-group-arn $TG_ARN \
    --query 'TargetHealthDescriptions[0].Target.Id' --output text)
$ echo "대상: $TARGET"

$ date
Thu Aug 13 16:40:02 UTC 2026

$ aws ssm send-command --instance-ids $TARGET \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["systemctl stop nginx"]' \
    --query 'Command.CommandId' --output text
```

**20~40초 뒤 대상 그룹 상태**

```bash
$ aws elbv2 describe-target-health --target-group-arn $TG_ARN \
    --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason,TargetHealth.Description]' \
    --output json
[
  ["i-0a1b2c3d4e5f60718", "unhealthy", "Target.FailedHealthChecks",
   "Health checks failed with these codes: [502]"],
  ["i-0f9e8d7c6b5a40312", "healthy", null, null]
]
```

> ✅ **비정상으로 판정됐습니다.** 간격 10초 × 임계값 2 = 약 20초 만에 감지했습니다.

**이제 트래픽이 정상 인스턴스로만 갑니다.**

```bash
$ for i in $(seq 1 10); do
    curl -s http://$ALB_DNS | grep -oP '(?<=<b>)i-[a-z0-9]+' | head -1
  done | sort | uniq -c
     10 i-0f9e8d7c6b5a40312
```

**사용자는 오류를 하나도 보지 않았습니다.**

```bash
$ for i in $(seq 1 20); do
    curl -s -o /dev/null -w "%{http_code} " http://$ALB_DNS
  done; echo
200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200
```

**그리고 ASG가 교체합니다** (헬스 체크 유형이 `ELB` 이므로)

```bash
$ aws autoscaling describe-scaling-activities --auto-scaling-group-name course-asg \
    --max-items 2 --query 'Activities[*].[StartTime,Description,Cause]' --output json
[
  ["2026-08-13T16:44:12Z", "Launching a new EC2 instance: i-0d4e5f6a7b8c91023",
   "...an instance was taken out of service in response to an ELB system health check failure."]
]
```

> 🎉 **[10강](lesson-10.md)에서 해결하지 못했던 문제가 해결됐습니다.**
> `EC2` 헬스 체크였다면 이 인스턴스는 영원히 "정상"이었을 것입니다.

### Step 7. 경로 기반 라우팅 규칙 (15분)

```bash
# /admin/* 은 차단
$ aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 10 \
    --conditions '[{"Field":"path-pattern","Values":["/admin/*"]}]' \
    --actions '[{"Type":"fixed-response","FixedResponseConfig":{"StatusCode":"403","ContentType":"text/plain","MessageBody":"Forbidden - admin access is restricted"}}]' \
    --query 'Rules[0].RuleArn' --output text

# /status 는 ALB가 직접 응답 (백엔드 부담 없음)
$ aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 20 \
    --conditions '[{"Field":"path-pattern","Values":["/status"]}]' \
    --actions '[{"Type":"fixed-response","FixedResponseConfig":{"StatusCode":"200","ContentType":"text/plain","MessageBody":"alb-ok"}}]' \
    --query 'Rules[0].RuleArn' --output text
```

**동작 확인**

```bash
$ curl -s -o /dev/null -w "%{http_code}\n" http://$ALB_DNS/
200
$ curl -s -w "\n[%{http_code}]\n" http://$ALB_DNS/admin/users
Forbidden - admin access is restricted
[403]
$ curl -s -w "\n[%{http_code}]\n" http://$ALB_DNS/status
alb-ok
[200]
```

**규칙 목록과 우선순위**

```bash
$ aws elbv2 describe-rules --listener-arn $LISTENER_ARN \
    --query 'Rules[*].[Priority,Conditions[0].Values[0],Actions[0].Type]' --output table
--------------------------------------------------------
|  10       |  /admin/*   |  fixed-response            |
|  20       |  /status    |  fixed-response            |
|  default  |  None       |  forward                   |
--------------------------------------------------------
```

> 💡 **규칙은 우선순위 숫자가 작은 것부터 평가**되고, **첫 번째로 일치하는 규칙에서 멈춥니다.** 기본 규칙은 항상 마지막입니다.

### Step 8. 액세스 로그 켜 보기 (선택, 10분)

```bash
$ LOG_BUCKET=course-alb-logs-hong-$(date +%s)
$ aws s3 mb s3://$LOG_BUCKET --region ap-northeast-2

# 서울 리전 ELB 계정에 쓰기 권한 부여
$ cat > alb-log-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "logdelivery.elasticloadbalancing.amazonaws.com" },
    "Action": "s3:PutObject",
    "Resource": "arn:aws:s3:::$LOG_BUCKET/*"
  }]
}
EOF
$ aws s3api put-bucket-policy --bucket $LOG_BUCKET --policy file://alb-log-policy.json

$ aws elbv2 modify-load-balancer-attributes --load-balancer-arn $ALB_ARN \
    --attributes Key=access_logs.s3.enabled,Value=true \
                 Key=access_logs.s3.bucket,Value=$LOG_BUCKET
```

> ⏱ 로그는 **5분마다 배치로** 전송됩니다. 확인 후 반드시 끄고 버킷을 지우세요(S3 비용).
> 📌 로그 전송 권한 주체는 리전과 로그 형식에 따라 다를 수 있습니다. 실패하면 콘솔에서 **속성 → 액세스 로그 활성화**를 쓰면 정책을 자동 생성해 줍니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| **ALB** | ❌ **미포함** | 약 **$0.14** + LCU | 🔴 **약 $16.4 +** |
| 대상 그룹 | 무료 | $0 | $0 |
| EC2 t3.micro × 2~3 | ✅ 750h 합산 | $0 ~ 0.1 | 약 $19~28 |
| **NAT Gateway** | ❌ | 약 $0.36 | 🔴 약 $42 |
| 탄력적 IP | ❌ | 약 $0.03 | 약 $3.6 |
| S3 액세스 로그(선택) | ✅ 5GB | $0 | 트래픽 비례 |
| **합계** | | **약 $0.6** | **약 $81** |

> 🔴 **오늘부터 잔존 비용 1위가 ALB입니다.** 인스턴스를 다 지워도 ALB만 남아 있으면 월 $16이 나갑니다.
> 정리 시 **가장 먼저** 확인하세요.

### 🧹 리소스 정리 체크리스트

```bash
# 1) ASG 삭제 (인스턴스 함께 종료)
$ aws autoscaling delete-auto-scaling-group --auto-scaling-group-name course-asg --force-delete

# 2) 🔴 ALB 삭제 — 리스너/규칙은 함께 삭제됨
$ aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
$ sleep 30

# 3) 대상 그룹 삭제 (ALB 삭제 후에 가능)
$ aws elbv2 delete-target-group --target-group-arn $TG_ARN

# 4) 액세스 로그 버킷 (만들었다면)
$ aws s3 rb s3://$LOG_BUCKET --force

# 5) NAT + EIP
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 6) 확인 — 전부 빈 출력이어야 함
$ aws elbv2 describe-load-balancers --query 'LoadBalancers[*].LoadBalancerName' --output text
$ aws elbv2 describe-target-groups --query 'TargetGroups[*].TargetGroupName' --output text
$ aws autoscaling describe-auto-scaling-groups --query 'AutoScalingGroups[*].AutoScalingGroupName' --output text
$ aws ec2 describe-nat-gateways --filter "Name=state,Values=available,pending" --query 'NatGateways[*].NatGatewayId' --output text
```

- [ ] ASG 삭제 (`--force-delete`)
- [ ] 🔴 **ALB 삭제 확인**
- [ ] 대상 그룹 삭제
- [ ] 액세스 로그 S3 버킷 정리
- [ ] NAT Gateway 삭제 + EIP 반환
- [ ] ⭐ 시작 템플릿 유지 ([12강](lesson-12.md)에서 사용)
- [ ] 다음 날 Cost Explorer에서 **ELB 항목이 멈췄는지** 확인

---

## ⑤ 자주 하는 실수

### ALB 생성이 실패한다

```
An error occurred (ValidationError) when calling the CreateLoadBalancer operation:
At least two subnets in two different Availability Zones must be specified
```

**원인** — ALB는 **최소 2개 AZ**의 서브넷이 필요합니다.
**해결** — 퍼블릭 서브넷 2개를 지정합니다. (`--subnets $PUB_A $PUB_C`)

```
An error occurred (InvalidSubnet) ... requires at least 8 free IP addresses
```

**원인** — 서브넷에 여유 IP가 부족합니다. ALB는 노드용 IP를 여러 개 씁니다.
**해결** — `/24` 이상의 서브넷을 사용합니다. (이 과정은 `/24`라 문제없음)

### 대상이 계속 unhealthy 다

**가장 자주 막히는 지점입니다.** 원인을 순서대로 확인하세요.

```bash
$ aws elbv2 describe-target-health --target-group-arn $TG_ARN \
    --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason,TargetHealth.Description]' \
    --output json
```

| Reason | 뜻 | 해결 |
|---|---|---|
| `Target.Timeout` | 응답이 없음 | **보안 그룹** — 앱 SG가 ALB SG로부터 80을 허용하는지 |
| `Target.FailedHealthChecks` + `[404]` | 경로가 없음 | 헬스 체크 **경로** 확인 (`/health/`) |
| `Target.FailedHealthChecks` + `[502]` | 서비스가 안 뜸 | 인스턴스에서 `systemctl status nginx` |
| `Elb.InitialHealthChecking` | 아직 검사 중 | 기다립니다 |
| `Target.NotInUse` | 대상 그룹이 LB에 연결 안 됨 | 리스너의 기본 동작 확인 |

**직접 확인하는 방법**

```bash
$ aws ssm start-session --target $TARGET
sh-5.2$ curl -s -o /dev/null -w "%{http_code}\n" localhost/health/
200          ← 200이면 서버는 정상. 그럼 보안 그룹 문제
```

### 보안 그룹 때문에 타임아웃이 난다

**증상** — 인스턴스에서 `curl localhost/health/` 는 200인데 대상 그룹은 `Target.Timeout`.
**원인** — 앱 보안 그룹이 **ALB 보안 그룹으로부터의 인바운드**를 허용하지 않습니다.
**해결**

```bash
$ aws ec2 authorize-security-group-ingress --group-id $SG_APP \
    --protocol tcp --port 80 --source-group $SG_WEB
```

> 💡 **소스를 IP가 아니라 보안 그룹으로** 지정해야 합니다. ALB의 IP는 계속 바뀝니다.

### 브라우저 접속이 안 된다 (ALB 자체에 도달 못 함)

**확인 순서**

| # | 확인 | 방법 |
|---|---|---|
| 1 | **ALB 보안 그룹**이 내 IP에서 80을 허용하나 | `describe-security-groups` |
| 2 | ALB가 `internet-facing` 인가 | `--scheme` 확인 |
| 3 | 퍼블릭 서브넷에 있나 | 라우팅에 IGW 경로 |
| 4 | ALB 상태가 `active` 인가 | `describe-load-balancers` |

```bash
$ aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].[State.Code,Scheme,Type]' --output text
active   internet-facing   application
```

### 502 Bad Gateway가 뜬다

```
502 Bad Gateway
```

ALB까지는 도달했지만 **백엔드에서 유효한 응답을 못 받은** 상태입니다.

| 원인 | 확인 |
|---|---|
| 대상이 전부 unhealthy | `describe-target-health` |
| 애플리케이션이 응답 중 죽음 | 인스턴스 로그 |
| 응답 헤더가 잘못됨 | `curl -v` 로 직접 확인 |

**503 Service Unavailable** 이라면 **등록된 대상이 하나도 없는** 경우입니다.

### ASG 인스턴스가 대상 그룹에 등록되지 않는다

**원인** — ASG 생성 시 `--target-group-arns` 를 빠뜨렸습니다.
**해결** — 나중에 붙일 수 있습니다.

```bash
$ aws autoscaling attach-load-balancer-target-groups \
    --auto-scaling-group-name course-asg --target-group-arns $TG_ARN
```

### 무한 교체 루프에 빠진다

**증상** — 인스턴스가 생겼다 죽었다를 반복합니다.
**원인** — 헬스 체크 유형을 `ELB` 로 바꿨는데 **유예 기간이 짧습니다.** 부팅이 끝나기 전에 비정상 판정되어 교체되고, 새 인스턴스도 같은 일을 겪습니다.
**해결**

```bash
$ aws autoscaling update-auto-scaling-group --auto-scaling-group-name course-asg \
    --health-check-grace-period 300
```

> **유예 기간은 "부팅 + 사용자 데이터 실행 + 서비스 기동" 시간보다 넉넉히** 잡습니다. [09강](lesson-09.md)에서 측정한 부팅 시간(약 120초)의 2배 이상이 안전합니다.

### 배포 중 사용자 요청이 끊긴다

**원인** — **등록 취소 지연(연결 드레이닝)** 이 0이거나 너무 짧습니다. 진행 중인 요청이 있는데 대상을 즉시 제거해 버립니다.
**해결**

```bash
$ aws elbv2 modify-target-group-attributes --target-group-arn $TG_ARN \
    --attributes Key=deregistration_delay.timeout_seconds,Value=60
```

> **운영 기준** — 가장 긴 요청 처리 시간보다 길게 설정합니다. 파일 업로드가 있으면 300초 이상이 필요할 수 있습니다.

---

## ⑥ 확인 문제

**1.** 대상 그룹에 인스턴스가 등록됐는데 계속 `unhealthy` 이고 사이트는 502를 반환합니다. 확인할 항목 3가지를 순서대로 쓰세요.

<details>
<summary>답 보기</summary>

**① 인스턴스 보안 그룹이 ALB 보안 그룹으로부터의 인바운드를 허용하는가**

```bash
$ aws ec2 describe-security-groups --group-ids $SG_APP \
    --query 'SecurityGroups[0].IpPermissions'
```

가장 흔한 원인입니다. `Target.Timeout` 이면 거의 확실히 이 문제입니다.

**② 애플리케이션이 그 포트에서 실제로 응답하는가**

```bash
$ aws ssm start-session --target i-xxx
sh-5.2$ curl -s -o /dev/null -w "%{http_code}\n" localhost/health/
```

`Connection refused` 면 서비스가 안 떠 있는 것이고, 502면 애플리케이션 오류입니다.

**③ 헬스 체크 경로가 200을 반환하는가**

```bash
$ aws elbv2 describe-target-groups --target-group-arns $TG_ARN \
    --query 'TargetGroups[0].[HealthCheckPath,Matcher.HttpCode]' --output text
/health/    200
```

경로 오타(`/health` vs `/health/`)나 리다이렉트(301)를 200으로 기대하는 경우가 흔합니다.

> **진단 요령** — `TargetHealth.Reason` 과 `Description` 이 답을 거의 알려 줍니다.
> `Target.Timeout` → 보안 그룹 · `[404]` → 경로 · `[502]` → 애플리케이션
</details>

**2.** 초당 수백만 건의 TCP 요청을 처리해야 하고, 방화벽 화이트리스트를 위해 **고정 IP**가 필요합니다. ALB와 NLB 중 무엇을 골라야 하나요?

<details>
<summary>답 보기</summary>

**NLB(Network Load Balancer)** 입니다.

| 요구 | ALB | NLB |
|---|---|---|
| 초당 수백만 요청 | 가능하지만 워밍업 필요 | ✅ **설계 목적** |
| **고정 IP** | ❌ DNS 이름만 (IP가 바뀜) | ✅ **AZ당 고정 IP, EIP 지정 가능** |
| TCP(비HTTP) | ❌ HTTP/HTTPS만 | ✅ TCP/UDP/TLS |
| 지연 시간 | 밀리초 | **마이크로초** |

**고정 IP가 중요한 이유** — 상대방 방화벽에 IP를 등록해야 하는 B2B 연동, 금융권 시스템 등에서 자주 요구됩니다. ALB는 IP가 동적으로 바뀌므로 등록이 불가능합니다.

**대신 포기하는 것**
- 경로/호스트 기반 라우팅 (L4라 HTTP를 모름)
- WAF 직접 연결 (NLB 앞에는 못 붙임)
- Lambda 대상 지정

**절충안** — **NLB 뒤에 ALB를 두는 구성**도 가능합니다. 고정 IP는 NLB가 제공하고 L7 라우팅은 ALB가 담당합니다.
</details>

**3.** 배포할 때마다 사용자 일부가 "요청이 끊겼다"고 합니다. ALB 설정에서 무엇을 조정해야 하나요?

<details>
<summary>답 보기</summary>

**대상 그룹의 등록 취소 지연(deregistration_delay = 연결 드레이닝)** 을 늘립니다.

```bash
$ aws elbv2 modify-target-group-attributes --target-group-arn $TG_ARN \
    --attributes Key=deregistration_delay.timeout_seconds,Value=120
```

**동작 원리**

```
 [지연 0초]
   대상 제거 → 진행 중이던 요청 즉시 끊김 → 사용자가 오류를 봄

 [지연 120초]
   대상 제거 요청 → 새 요청은 안 보냄(draining)
                 → 진행 중 요청이 끝날 때까지 최대 120초 대기
                 → 그 후 완전히 제거 → 사용자는 아무것도 못 느낌
```

**적정값 정하기** — **가장 긴 요청의 처리 시간**보다 길게.

| 서비스 유형 | 권장 |
|---|---|
| 일반 API (수백 ms) | 30~60초 |
| 파일 업로드/다운로드 | 300초 이상 |
| 장기 실행 작업 | 큐로 분리 권장 ([20강](../03-serverless-automation/lesson-20.md)) |

**함께 볼 설정 2가지**
1. **ASG 인스턴스 새로 고침의 최소 정상 비율** — 교체 중 서비스 용량 유지
2. **헬스 체크 유예 기간** — 새 인스턴스가 준비되기 전에 트래픽을 받지 않도록

> 이 세 가지가 맞물려야 **진짜 무중단 배포**가 됩니다. [24강 CI/CD](../03-serverless-automation/lesson-24.md)에서 다시 다룹니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| ALB / NLB | L7 HTTP·경로 라우팅 / L4·**고정 IP**·초저지연 |
| 3단 구조 | 리스너(포트) → 규칙(조건) → 대상 그룹(대상+헬스 체크) |
| 헬스 체크 | 감지 시간 = **간격 × 비정상 임계값** |
| ASG 연결 | `--target-group-arns` + **`--health-check-type ELB`** ⭐ |
| 유예 기간 | 부팅 시간의 2배 이상. 짧으면 **무한 교체 루프** |
| 교차 영역 분산 | ALB는 항상 켜짐·무료 |
| 등록 취소 지연 | **무중단 배포의 열쇠**. 기본 300초 |
| 비용 | 🔴 **ALB는 프리 티어 없음.** 월 약 $16 + LCU |

**한 장 요약**

```
  사용자 ──▶ ALB (변하지 않는 DNS 이름)
              ├─ 규칙: /admin/* → 403
              └─ 기본  →  대상 그룹 ──┬─ i-aaa (healthy)
                          (헬스체크)   ├─ i-bbb (healthy)
                                      └─ i-ccc (unhealthy) 🚫 자동 제외
                                            ▲
                                        ASG가 교체 (health-check-type=ELB)
```

**오늘 반드시 기억할 한 가지**
> **ALB + `health-check-type ELB` 조합이 진짜 자가 치유를 완성합니다.**
> 10강까지는 "OS가 살아 있으면 정상"이었지만, 이제 **"응답하지 않으면 비정상"** 입니다.

**과제**
1. **부하 분산 증명** — 20회 호출해 인스턴스별·AZ별 분포를 표로 만들고 제출하세요.
2. **헬스 체크 실패 실험** — nginx 중지 시각 / `unhealthy` 전환 시각 / 트래픽 제외 확인 / ASG 교체 시각을 표로 정리하고, **감지 시간이 헬스 체크 파라미터와 어떻게 맞아떨어지는지** 설명하세요.
3. **무중단 확인** — 인스턴스 하나를 죽이는 동안 20회 요청을 보내 **전부 200**임을 보여 주는 출력.
4. **ALB vs NLB 비교표**를 직접 작성하고, 이 서비스에 ALB를 택한 근거 5줄.
5. 경로 기반 규칙 3개(`/`, `/admin/*`, `/status`)의 응답 결과 캡처.
6. 정리 확인 — ALB·대상 그룹·ASG·NAT가 모두 0개인 출력.

---

[← 이전 10강](lesson-10.md) · [목차](README.md) · [다음 → 12강 Route 53과 ACM으로 HTTPS](lesson-12.md)
