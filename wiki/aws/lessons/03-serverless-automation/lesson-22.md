# 22강 · CloudWatch · CloudTrail · Systems Manager

> **AWS 학습 매뉴얼** · 🔴 대단원 03 · **22강 / 총 32강**
> [← 이전 21강](lesson-21.md) · [목차](README.md) · [다음 → 23강 Infrastructure as Code](lesson-23.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 지표·로그·추적의 차이를 알고 **CloudWatch와 CloudTrail의 역할을 구분**할 수 있다.
- CloudWatch Agent로 **기본 지표에 없는 메모리·디스크**를 수집할 수 있다.
- 로그를 **Logs Insights로 질의**하고, **지표 필터 → 알람 → 메일**까지 연결할 수 있다.
- CloudTrail로 **"누가 무엇을 바꿨는지"** 추적할 수 있다.
- SSM 파라미터 스토어와 Run Command로 **설정과 운영 명령을 중앙화**할 수 있다.

---

## ② 왜 필요한가

지금까지의 실습에서 장애는 항상 **우리가 일으켰기 때문에** 알았습니다. 실제 운영은 반대입니다.

```
 [알람 없는 운영]
  14:02  서비스에 오류 발생
  14:40  사용자 항의 접수            ← 발견자가 "고객"
  15:10  담당자가 로그를 뒤지기 시작
  ────────────────────────────
  발견까지 38분 · 원인 파악은 그 후

 [알람 있는 운영]
  14:02  오류 발생
  14:03  알람 메일 도착              ← 발견자가 "시스템"
  14:05  Logs Insights로 원인 위치 특정
```

그리고 사고 후에는 반드시 이 질문이 나옵니다.

> "이 보안 그룹, **누가 언제 연 거예요?**"

CloudWatch는 답하지 못합니다 — 그건 **CloudTrail**의 일입니다. 두 서비스의 분업이 오늘의 뼈대입니다.

| 질문 | 답하는 서비스 |
|---|---|
| 지금 서버 상태가 어떤가 / **언제 죽었나** | **CloudWatch** (지표·로그·알람) |
| **누가** 설정을 바꿨나 / 키를 썼나 | **CloudTrail** (API 감사 기록) |
| 설정값·운영 명령을 어떻게 중앙 관리하나 | **Systems Manager** |

여기서 만드는 "지표 → 알람 → 알림" 체계가 [29강 관측성](../04-final-project/lesson-29.md)에서 팀 서비스 전체로 확장되고, 최종 프로젝트 필수 요구 8번(로깅·모니터링·알림)의 원형이 됩니다.

---

## ③ 개념 설명

### 관측성 3요소

| 요소 | 질문 | 도구 |
|---|---|---|
| **지표(Metrics)** | 무엇이 **얼마나**? (CPU 80%, 요청 1,200/분) | CloudWatch 지표 |
| **로그(Logs)** | 무슨 **일이**? (이 요청이 왜 500인가) | CloudWatch Logs |
| 추적(Traces) | 어느 **구간이** 느린가? (분산 시스템) | X-Ray (이 과정은 소개만) |

### CloudWatch 지표의 구조

```
 네임스페이스: AWS/EC2
   지표 이름: CPUUtilization
     차원: InstanceId = i-0abc...       ← "누구의" CPU인가
       데이터 포인트: (14:05, 72.3%)
```

| 알아 둘 것 | 내용 |
|---|---|
| 기본 지표 주기 | **5분** (세부 모니터링 켜면 1분 — 인스턴스당 월 약 $2.1) |
| 🔴 **기본 지표에 없는 것** | **메모리 사용률 · 디스크 사용률** — 하이퍼바이저 밖에서 안 보임 → **CloudWatch Agent** 필요 |
| 사용자 지정 지표 | 내 네임스페이스로 직접 게시 (10개까지 무료, 이후 개당 월 $0.30) |

### 알람의 3요소와 3상태

```
 알람 = 지표 + 임계값 + 평가 기간
 예: "Course/nginx404Count 의 1분 합이 5를 초과하면"

 상태:  OK ──────▶ ALARM ──────▶ OK
          └── INSUFFICIENT_DATA (데이터 없음) ── 결측 처리 설정이 중요!
```

| 설정 | 의미 | 흔한 실수 |
|---|---|---|
| 평가 기간 | "N분 중 M번 위반 시" | 1회 스파이크에 울리게 해서 **알람 피로** |
| **결측 데이터 처리** | 데이터 없을 때 어떻게 볼지 | 트래픽 0일 때 INSUFFICIENT_DATA로 방치 → `notBreaching` 지정 |
| 임계값 | 정상 구간을 **먼저 측정**하고 그 위에 | 감으로 정해 너무 민감/둔감 |

> **알람 피로(alarm fatigue)** — 사소한 알람이 잦으면 사람이 무시하기 시작하고, 진짜 장애도 묻힙니다. **"울리면 반드시 행동해야 하는 것"만 알람**으로 만들고, 나머지는 대시보드에 둡니다.

### 로그 파이프라인 — 오늘 만들 것

```
 nginx access.log ──(Agent)──▶ CloudWatch Logs 그룹
                                   │
                     ┌─────────────┼──────────────┐
                     ▼             ▼              ▼
               Logs Insights   지표 필터        보존 7일
               (사후 질의)     (404 개수 지표화)
                                   │
                                   ▼
                                 알람 ──▶ SNS ──▶ 📧
```

### CloudTrail — 감사의 눈

| 구분 | 내용 | 비용 |
|---|---|---|
| **이벤트 기록(90일)** | 모든 **관리 이벤트**(리소스 생성·변경·삭제) 자동 기록 | **무료** |
| 추적(Trail) | S3에 장기 보관 + 조직 전체 | S3 저장비 (+관리 이벤트 사본 1개 무료) |
| 데이터 이벤트 | S3 객체 읽기·Lambda 호출 수준 | 🔴 **유료·대량** — 실습에서 켜지 않음 |

기록 한 건에는 **누가(userIdentity) · 언제 · 어디서(sourceIP) · 무엇을(eventName) · 어떤 파라미터로** 가 전부 담깁니다. [04강](../01-cloud-foundation/lesson-04.md)의 키 유출 대응 절차 3단계("그 키가 무엇을 했는지 조사")가 바로 이것입니다.

### Systems Manager — 이미 쓰고 있었다

[06강](../01-cloud-foundation/lesson-06.md)부터 쓴 Session Manager가 SSM의 일부입니다. 오늘 나머지를 채웁니다.

| 기능 | 하는 일 | 비용 |
|---|---|---|
| **파라미터 스토어** | 설정값 중앙 저장. `String` / **`SecureString`(KMS 암호화)** | 표준 파라미터 **무료** |
| **Run Command** | SSH 없이 **여러 인스턴스에 동시에** 명령 실행 + 결과·기록 | 무료 |
| 패치 관리자 | OS 패치 일정·준수 현황 | 무료(인스턴스 비용만) |

**파라미터 스토어 vs Secrets Manager** ([15강](../02-compute-data/lesson-15.md) 복습)

| | 파라미터 스토어(표준) | Secrets Manager |
|---|---|---|
| 비용 | **무료** | 비밀당 월 $0.40 |
| 자동 교체 | ❌ | ✅ |
| 용도 | 일반 설정 · 교체 불필요한 값 | DB 자격 증명 등 교체가 필요한 비밀 |

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.1 ~ 0.2** — 퍼블릭 서브넷 EC2 1대(NAT 불필요) + 무료 한도 위주입니다.

### Step 1. 실습 서버 준비 (10분)

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh
$ MY_IP=$(curl -s https://checkip.amazonaws.com)
$ SG_MON=$(aws ec2 create-security-group --group-name course-sg-mon \
    --description "monitoring lab" --vpc-id $VPC_ID --query 'GroupId' --output text)
$ aws ec2 authorize-security-group-ingress --group-id $SG_MON \
    --protocol tcp --port 80 --cidr ${MY_IP}/32

# Agent가 지표를 올릴 권한 추가
$ aws iam attach-role-policy --role-name EC2-Course-Role \
    --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

$ AMI_ID=$(aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' --output text)
$ INST=$(aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro \
    --subnet-id $PUB_A --security-group-ids $SG_MON \
    --iam-instance-profile Name=EC2-Course-Role --associate-public-ip-address \
    --user-data file://user-data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-mon},{Key=Project,Value=aws-course},{Key=Week,Value=W11}]' \
    --query 'Instances[0].InstanceId' --output text)
$ aws ec2 wait instance-running --instance-ids $INST
$ PUB_IP=$(aws ec2 describe-instances --instance-ids $INST \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
```

([09강](../02-compute-data/lesson-09.md)의 `user-data.sh` 로 nginx가 자동 기동됩니다.)

### Step 2. CloudWatch Agent — 설정은 SSM 파라미터로 (20분)

**Agent 설정을 파라미터 스토어에 저장**합니다. 설정 파일을 서버마다 복사하는 대신, **모든 서버가 같은 파라미터를 읽는** 구조입니다.

```bash
$ cat > cw-agent.json <<'EOF'
{
  "metrics": {
    "namespace": "CWAgent",
    "append_dimensions": { "InstanceId": "${aws:InstanceId}" },
    "metrics_collected": {
      "mem":  { "measurement": ["mem_used_percent"] },
      "disk": { "measurement": ["used_percent"], "resources": ["/"] }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [{
          "file_path": "/var/log/nginx/access.log",
          "log_group_name": "/course/nginx/access",
          "log_stream_name": "{instance_id}",
          "retention_in_days": 7
        }]
      }
    }
  }
}
EOF

$ aws ssm put-parameter --name AmazonCloudWatch-course \
    --type String --value file://cw-agent.json --overwrite
```

**인스턴스에서 Agent 설치 + 파라미터로 설정 로드**

```bash
$ aws ssm start-session --target $INST
sh-5.2$ sudo dnf install -y amazon-cloudwatch-agent
sh-5.2$ sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
        -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-course
****** processing amazon-cloudwatch-agent ******
Successfully fetched the config and saved in /opt/aws/amazon-cloudwatch-agent/etc/...
sh-5.2$ sudo systemctl status amazon-cloudwatch-agent | head -3
● amazon-cloudwatch-agent.service - Amazon CloudWatch Agent
     Active: active (running)
sh-5.2$ exit
```

**5분 뒤 — 기본 지표에 없던 메모리가 보입니다.**

```bash
$ aws cloudwatch get-metric-statistics \
    --namespace CWAgent --metric-name mem_used_percent \
    --dimensions Name=InstanceId,Value=$INST \
    --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 --statistics Average \
    --query 'sort_by(Datapoints,&Timestamp)[-3:].[Timestamp,Average]' --output table
------------------------------------------------------
|  2026-08-13T16:10:00Z  |  21.4                     |
|  2026-08-13T16:11:00Z  |  21.6                     |
|  2026-08-13T16:12:00Z  |  21.5                     |
------------------------------------------------------
```

> ✅ **네임스페이스가 `AWS/EC2` 가 아니라 `CWAgent`** 입니다 — AWS 기본 지표가 아니라 **인스턴스 안에서** 게시한 사용자 지정 지표이기 때문입니다.

### Step 3. 로그 수집과 Logs Insights (20분)

**트래픽을 만들어** 로그를 쌓습니다 — 정상 30건 + 404 유발 10건.

```bash
$ for i in $(seq 1 30); do curl -s -o /dev/null http://$PUB_IP/; done
$ for i in $(seq 1 10); do curl -s -o /dev/null http://$PUB_IP/no-such-page-$i; done
```

**로그 도착 확인**

```bash
$ aws logs tail /course/nginx/access --since 5m | head -3
2026-08-13T16:18:22 i-0abc... 203.0.113.45 - - [13/Aug/2026:16:18:20 +0000] "GET / HTTP/1.1" 200 5754 "-" "curl/8.5.0" "-"
2026-08-13T16:18:24 i-0abc... 203.0.113.45 - - [13/Aug/2026:16:18:23 +0000] "GET /no-such-page-1 HTTP/1.1" 404 3971 "-" "curl/8.5.0" "-"
```

**Logs Insights로 질의** — "상태 코드별 개수"와 "404가 많은 경로".

```bash
$ QID=$(aws logs start-query \
    --log-group-name /course/nginx/access \
    --start-time $(date -d '30 minutes ago' +%s) --end-time $(date +%s) \
    --query-string 'parse @message /"(?<method>\S+) (?<path>\S+) \S+" (?<status>\d{3})/
                    | stats count(*) as cnt by status
                    | sort cnt desc' \
    --query 'queryId' --output text)

$ sleep 5 && aws logs get-query-results --query-id $QID \
    --query 'results[*][?field==`status` || field==`cnt`].value' --output table
-------------------
|  200  |  31     |
|  404  |  10     |
-------------------
```

> 💡 **Insights는 "사후 분석" 도구**입니다 — 장애 후 "언제부터, 어느 경로에서, 얼마나"를 몇 초 만에 셉니다. 스캔한 데이터량으로 과금(GB당 약 $0.0076)되므로 기간을 좁혀 질의합니다.

### Step 4. 지표 필터 → 알람 → 메일 ⭐ (25분)

**① 404를 세는 지표 필터** — 로그를 숫자로 바꿉니다.

```bash
$ aws logs put-metric-filter \
    --log-group-name /course/nginx/access \
    --filter-name http-404-count \
    --filter-pattern '[ip, ident, authuser, date, request, status=404, bytes, referrer, agent, xff]' \
    --metric-transformations \
      metricName=nginx404Count,metricNamespace=Course,metricValue=1,defaultValue=0
```

> 📌 공백 구분 패턴에서 `[...]`(날짜)와 `"..."`(요청·UA)는 **한 필드로** 취급됩니다. `status=404` 자리 매칭으로 404만 셉니다.

**② 알림 채널(SNS)**

```bash
$ ALARM_TOPIC=$(aws sns create-topic --name course-alarms --query 'TopicArn' --output text)
$ aws sns subscribe --topic-arn $ALARM_TOPIC --protocol email \
    --notification-endpoint 본인메일@example.com
# 📧 확인 메일의 링크를 클릭해야 전달됩니다!
```

**③ 알람 — "1분에 404가 5건 초과면"**

```bash
$ aws cloudwatch put-metric-alarm \
    --alarm-name course-404-surge \
    --alarm-description "404 acute surge on nginx" \
    --namespace Course --metric-name nginx404Count \
    --statistic Sum --period 60 \
    --evaluation-periods 1 --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions $ALARM_TOPIC --ok-actions $ALARM_TOPIC
```

| 선택 | 이유 |
|---|---|
| `treat-missing-data notBreaching` | 트래픽이 없을 때(데이터 없음)를 정상으로 — INSUFFICIENT_DATA 방치 방지 |
| `--ok-actions` 도 지정 | **복구도 통지** — "끝났는지"를 사람이 다시 확인하러 들어가지 않게 |

**④ 일부러 울리기**

```bash
$ for i in $(seq 1 20); do curl -s -o /dev/null http://$PUB_IP/broken-$i; done

$ sleep 90 && aws cloudwatch describe-alarms --alarm-names course-404-surge \
    --query 'MetricAlarms[0].[StateValue,StateReason]' --output text
ALARM    Threshold Crossed: 1 datapoint [20.0 (13/08/26 16:31:00)] was greater than the threshold (5.0).
```

**메일함 확인**

```
제목: ALARM: "course-404-surge" in Asia Pacific (Seoul)
...
NewStateValue: ALARM
NewStateReason: Threshold Crossed: 1 datapoint [20.0] was greater than the threshold (5.0).
```

> ✅ **사람이 로그를 보기 전에 시스템이 먼저 알렸습니다.** 몇 분 뒤 `OK: course-404-surge` 복구 메일도 옵니다. 이 두 통이 과제 증빙입니다.

**⑤ 대시보드에 모으기**

```bash
$ aws cloudwatch put-dashboard --dashboard-name course-dash \
    --dashboard-body '{
  "widgets": [
    {"type":"metric","x":0,"y":0,"width":12,"height":6,
     "properties":{"title":"CPU / MEM","region":"ap-northeast-2",
       "metrics":[["AWS/EC2","CPUUtilization","InstanceId","'$INST'"],
                  ["CWAgent","mem_used_percent","InstanceId","'$INST'"]],
       "period":60,"stat":"Average"}},
    {"type":"metric","x":12,"y":0,"width":12,"height":6,
     "properties":{"title":"HTTP 404 (1m sum)","region":"ap-northeast-2",
       "metrics":[["Course","nginx404Count"]],
       "period":60,"stat":"Sum"}}
  ]}'
```

> 💡 **알람이 먼저, 대시보드는 그다음**입니다. 대시보드는 사람이 봐야 동작하지만 알람은 잠든 사이에도 동작합니다.

### Step 5. CloudTrail — "누가 열었나" 추적 (15분)

**변경을 하나 일으키고**(보안 그룹에 임시 규칙) **추적해 봅니다.**

```bash
$ aws ec2 authorize-security-group-ingress --group-id $SG_MON \
    --protocol tcp --port 8443 --cidr 10.0.0.0/16

$ sleep 60 && aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=AuthorizeSecurityGroupIngress \
    --max-items 1 --query 'Events[0].CloudTrailEvent' --output text | jq '{
      누가: .userIdentity.arn,
      언제: .eventTime,
      어디서: .sourceIPAddress,
      무엇을: .eventName,
      대상: .requestParameters.groupId,
      포트: .requestParameters.ipPermissions.items[0].fromPort
    }'
{
  "누가": "arn:aws:iam::123456789012:user/admin",
  "언제": "2026-08-13T16:40:12Z",
  "어디서": "203.0.113.45",
  "무엇을": "AuthorizeSecurityGroupIngress",
  "대상": "sg-0f1e2d3c4b5a69870",
  "포트": 8443
}
```

> ✅ **"누가, 언제, 어디서, 무엇을, 어떤 값으로"가 전부** 나옵니다. 이벤트 기록은 90일 무료 — 자격 증명 유출 조사([04강](../01-cloud-foundation/lesson-04.md))의 근거가 이것입니다.

```bash
# 실험 규칙 원복
$ aws ec2 revoke-security-group-ingress --group-id $SG_MON \
    --protocol tcp --port 8443 --cidr 10.0.0.0/16
```

> 📌 CloudTrail 반영에는 **수 분의 지연**이 있습니다. 실시간 감시가 필요하면 CloudTrail → EventBridge 규칙([20강](lesson-20.md))으로 알람을 겁니다 — 최종 프로젝트 선택 과제입니다.

### Step 6. SSM 파라미터 스토어 · Run Command (15분)

**① 설정값 중앙화**

```bash
$ aws ssm put-parameter --name /course/app/site-title --type String --value "AWS Course"
$ aws ssm put-parameter --name /course/app/api-key --type SecureString --value "dummy-key-12345"

# SecureString은 복호화 옵션 없이는 암호문
$ aws ssm get-parameter --name /course/app/api-key \
    --query 'Parameter.Value' --output text
AQICAHh...(KMS 암호문)

$ aws ssm get-parameter --name /course/app/api-key --with-decryption \
    --query 'Parameter.Value' --output text
dummy-key-12345

# 계층 경로로 한 번에
$ aws ssm get-parameters-by-path --path /course/app --with-decryption \
    --query 'Parameters[*].[Name,Value]' --output table
--------------------------------------------------
|  /course/app/api-key     |  dummy-key-12345    |
|  /course/app/site-title  |  AWS Course         |
--------------------------------------------------
```

**② Run Command — 접속 없이, 태그로 골라서, 동시에**

```bash
$ CMD_ID=$(aws ssm send-command \
    --targets "Key=tag:Project,Values=aws-course" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["uptime","df -h / | tail -1","systemctl is-active nginx"]' \
    --query 'Command.CommandId' --output text)

$ sleep 10 && aws ssm list-command-invocations --command-id $CMD_ID --details \
    --query 'CommandInvocations[*].[InstanceId,Status,CommandPlugins[0].Output]' --output text
i-0abc123def456    Success    16:52:01 up 40 min, 0 users, load average: 0.00, 0.01, 0.00
/dev/nvme0n1p1  8.0G  1.7G  6.4G  21% /
active
```

> ✅ 인스턴스가 100대여도 **명령은 한 번**입니다. 누가 언제 무슨 명령을 실행했는지도 SSM에 기록됩니다 — "SSH로 들어가 손으로"의 종말입니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 이번 강 | 방치 시 월 |
|---|---|---|---|
| EC2 t3.micro | ✅ 750h | $0 | 약 $9.4 |
| CloudWatch 사용자 지정 지표(mem·disk·404) | ✅ **10개 무료** | $0 | 초과 개당 $0.30 |
| CloudWatch 알람 | ✅ 10개 무료 | $0 | 초과 개당 $0.10 |
| CloudWatch Logs 수집 | ✅ 5GB | $0 | 보존 7일 설정함 |
| Logs Insights 질의 | GB당 약 $0.0076 | ~$0 | 넓은 기간 반복 질의 주의 |
| 대시보드 | ✅ 3개 무료 | $0 | 초과 개당 $3 🔴 |
| CloudTrail 이벤트 기록 | ✅ 90일 무료 | $0 | Trail·데이터 이벤트는 별도 |
| SSM 파라미터(표준)·Run Command | ✅ 무료 | $0 | 고급 파라미터 개당 $0.05 |
| **합계** | | **$0 ~ 0.1** | — |

### 🧹 리소스 정리 체크리스트

```bash
# 1) 알람·대시보드·지표 필터
$ aws cloudwatch delete-alarms --alarm-names course-404-surge
$ aws cloudwatch delete-dashboards --dashboard-names course-dash
$ aws logs delete-metric-filter --log-group-name /course/nginx/access --filter-name http-404-count

# 2) SNS
$ aws sns delete-topic --topic-arn $ALARM_TOPIC

# 3) 로그 그룹 (보존 7일이지만 정리)
$ aws logs delete-log-group --log-group-name /course/nginx/access

# 4) SSM 파라미터
$ aws ssm delete-parameters --names AmazonCloudWatch-course /course/app/site-title /course/app/api-key

# 5) EC2 · SG · VPC
$ aws ec2 terminate-instances --instance-ids $INST
$ aws ec2 wait instance-terminated --instance-ids $INST
$ aws ec2 delete-security-group --group-id $SG_MON
# (VPC는 07강 절차로)

# 6) 확인
$ aws cloudwatch describe-alarms --query 'MetricAlarms[*].AlarmName' --output text
$ aws ssm describe-parameters --query 'Parameters[*].Name' --output text
```

- [ ] 알람 · 대시보드 · 지표 필터 삭제
- [ ] SNS 주제 삭제(메일 구독 함께 정리)
- [ ] 로그 그룹 · SSM 파라미터 삭제
- [ ] EC2 종료 · VPC 정리
- [ ] ⭐ `CloudWatchAgentServerPolicy` 는 역할에 유지([29강](../04-final-project/lesson-29.md)에서 다시 사용)
- [ ] 확인 명령 2개 빈 출력

---

## ⑤ 자주 하는 실수

### Agent를 설치했는데 메모리 지표가 안 보인다

**확인 순서**

| # | 확인 | 방법 |
|---|---|---|
| 1 | **네임스페이스를 `CWAgent` 로 봤나** | `AWS/EC2` 에는 영원히 안 나옵니다 |
| 2 | 역할에 `CloudWatchAgentServerPolicy` 있나 | 지표 게시 권한 |
| 3 | Agent가 실제로 도나 | `systemctl status amazon-cloudwatch-agent` |
| 4 | 설정 파싱 실패 | `/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log` |
| 5 | 5분 안 기다림 | 첫 게시까지 수 분 |

```bash
sh-5.2$ sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status
{ "status": "running", "configstatus": "configured", ... }
```

### 알람이 INSUFFICIENT_DATA에서 안 움직인다

**원인 후보**

| 원인 | 해결 |
|---|---|
| 지표 이름·네임스페이스·차원 **불일치** | 알람 설정과 `list-metrics` 출력을 글자 단위로 대조 |
| 데이터가 아예 없음 (트래픽 0 + defaultValue 미설정) | 지표 필터에 `defaultValue=0`, 알람에 `notBreaching` |
| period가 게시 주기보다 짧음 | 5분 지표에 60초 period → 결측 투성이 |

> 🔑 **차원 하나라도 다르면 다른 지표**입니다. `InstanceId` 차원이 붙은 지표를 차원 없이 조회하면 영원히 빈 결과입니다.

### 알람 메일이 안 온다

**원인 1순위** — SNS 이메일 구독이 `PendingConfirmation`. **확인 메일 링크를 눌러야** 전달됩니다([20강](lesson-20.md)과 동일).

```bash
$ aws sns list-subscriptions-by-topic --topic-arn $ALARM_TOPIC \
    --query 'Subscriptions[*].SubscriptionArn' --output text
PendingConfirmation      ← 이 상태면 알람이 울려도 메일은 안 감
```

그다음 확인 — 알람에 `--alarm-actions` 를 실제로 지정했는지, 알람 상태가 정말 바뀌었는지(같은 상태 유지 중엔 재발송 안 함).

### 지표 필터가 아무것도 못 센다

**원인** — 패턴이 로그 형식과 안 맞습니다. nginx combined 로그는 **필드 10개**(마지막 `"$http_x_forwarded_for"` 포함 여부는 배포판마다 다름)라 필드 수가 어긋나면 매칭 0건입니다.
**해결** — 콘솔의 지표 필터 편집 화면에 **실제 로그 줄을 붙여 넣고 패턴 테스트**를 먼저 합니다. CLI로는:

```bash
$ aws logs test-metric-filter \
    --filter-pattern '[ip, ident, authuser, date, request, status=404, bytes, referrer, agent, xff]' \
    --log-event-messages '203.0.113.45 - - [13/Aug/2026:16:18:23 +0000] "GET /x HTTP/1.1" 404 3971 "-" "curl/8.5.0" "-"'
{ "matches": [ { ... } ] }        ← matches가 비면 패턴 불일치
```

### CloudTrail에서 방금 한 일이 검색되지 않는다

| 원인 | 해결 |
|---|---|
| **반영 지연** | 최대 15분까지 기다립니다 |
| 조회 이벤트를 찾고 있음 | `Describe*`/`Get*` 는 관리 이벤트로 남지만, **S3 객체 GET 같은 데이터 이벤트는 기본 기록 안 됨** |
| 리전이 다름 | 이벤트는 **발생 리전**에 기록 — 글로벌 서비스(IAM)는 us-east-1 |

### SecureString 값이 암호문으로 나온다

**원인** — `--with-decryption` 누락. 기본은 암호문 반환입니다.
**추가 주의** — 읽는 주체(EC2 역할 등)에는 `ssm:GetParameter` 외에 **KMS 복호화 권한**(`kms:Decrypt`, 기본 키 사용 시 자동)이 필요할 수 있습니다.

### 대시보드는 화려한데 장애를 놓쳤다

**원인** — 대시보드는 **사람이 보고 있을 때만** 동작합니다. 새벽 3시의 장애는 아무도 못 봅니다.
**해결** — 원칙은 **"알람 먼저, 대시보드는 조사용"**. 울리면 반드시 행동할 것만 알람으로 만들고(개수 절제 — 알람 피로 방지), 대시보드는 알람이 울린 **뒤에** 원인을 좁히는 화면으로 씁니다.

---

## ⑥ 확인 문제

**1.** EC2 기본 지표에 CPU는 있는데 메모리 사용률이 없는 이유는 무엇이고, 어떻게 수집하나요?

<details>
<summary>답 보기</summary>

**AWS는 하이퍼바이저(가상화 계층) 밖에서 보이는 것만 기본 지표로 제공하기 때문**입니다.

- CPU 사용률·네트워크·디스크 I/O는 **하이퍼바이저가 밖에서** 관측 가능합니다.
- **메모리를 어떻게 쓰는지는 게스트 OS 안의 일**입니다. AWS가 OS 내부를 들여다보는 것은 책임 공유 모델([01강](../01-cloud-foundation/lesson-01.md))상 고객 영역 침범이기도 합니다. 디스크 "사용률"(파일 시스템 관점)도 마찬가지입니다.

**수집 방법 — CloudWatch Agent**

```
 ① 역할에 CloudWatchAgentServerPolicy
 ② Agent 설치 (dnf install amazon-cloudwatch-agent)
 ③ 설정(JSON)을 SSM 파라미터에 저장 → fetch-config -c ssm:파라미터명
 ④ 지표는 CWAgent 네임스페이스의 사용자 지정 지표로 게시됨
```

설정을 SSM 파라미터로 중앙화하면 서버 100대도 같은 한 줄로 구성됩니다. 흔한 함정 — 수집은 되는데 **`AWS/EC2` 네임스페이스에서 찾고 있는** 경우입니다. `CWAgent` 에서 찾으세요.
</details>

**2.** "어제 오후에 누가 이 보안 그룹의 22번 포트를 열었는지" 알아내야 합니다. CloudWatch가 아니라 CloudTrail을 봐야 하는 이유와, 실제 확인 절차를 쓰세요.

<details>
<summary>답 보기</summary>

**역할이 다르기 때문입니다.**

| | CloudWatch | CloudTrail |
|---|---|---|
| 기록 대상 | 리소스의 **상태**(지표)와 앱 **로그** | **API 호출**(누가 무엇을 요청했나) |
| 답할 수 있는 질문 | "언제 CPU가 튀었나" | **"누가 언제 설정을 바꿨나"** |

보안 그룹 변경은 `AuthorizeSecurityGroupIngress` 라는 **API 호출**이고, 그 기록은 CloudTrail의 영역입니다.

**확인 절차**

```bash
$ aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=AuthorizeSecurityGroupIngress \
    --start-time 2026-08-12T03:00:00Z --end-time 2026-08-12T12:00:00Z \
    --query 'Events[*].CloudTrailEvent' --output text | jq '{
      누가: .userIdentity.arn, 언제: .eventTime,
      어디서: .sourceIPAddress, 대상: .requestParameters.groupId,
      규칙: .requestParameters.ipPermissions }'
```

- 시간은 **UTC**로 변환(한국 오후 2시 = UTC 05:00).
- `userIdentity.arn` 이 `assumed-role/...` 이면 세션 이름까지 나와 **어느 서비스/파이프라인**이 했는지도 구분됩니다.
- 이벤트 기록은 **90일 무료** — 그 이상 보관이 필요하면 Trail(S3 저장)을 만듭니다.
- 이런 변경을 **실시간으로** 잡으려면 CloudTrail → EventBridge 규칙 → SNS 알림으로 연결합니다.
</details>

**3.** 알람을 30개 만들었더니 팀이 알람 메일을 무시하기 시작했습니다. 무엇이 잘못됐고, 알람 체계를 어떻게 재설계해야 하나요?

<details>
<summary>답 보기</summary>

**알람 피로(alarm fatigue)** 입니다. "행동이 필요 없는 알람"이 섞이면 사람은 전체를 무시하는 법을 학습하고, 진짜 장애가 그 속에 묻힙니다.

**재설계 원칙**

| 원칙 | 적용 |
|---|---|
| **① 알람 = 행동** | "울리면 반드시 지금 무언가 해야 하는 것"만 알람으로. 참고용 수치는 대시보드로 강등 |
| ② 원인이 아니라 **증상**에 건다 | CPU 80%(원인 후보)보다 **5xx 비율·p95 지연**(사용자 증상)이 우선 — 원인 알람 10개보다 증상 알람 2개 |
| ③ 임계값은 측정에서 | 정상 구간을 1~2주 관측한 뒤 그 밖에 선을 긋는다. 감으로 정하지 않음 |
| ④ 평가 기간으로 스파이크 흡수 | "5분 중 3회 위반" 식으로 일시 요동에 안 울리게 |
| ⑤ 복합 알람으로 묶기 | 연쇄 장애 때 30통 대신 대표 1통 (CloudWatch composite alarm) |
| ⑥ 심각도 분리 | 긴급(전화/페이저) vs 주의(메일/슬랙) 채널을 나눔 |

**점검 질문** — 지난달 울린 알람 각각에 대해 *"이 알람을 받고 실제로 뭔가 했는가?"* 를 묻고, "아니오"가 두 번이면 그 알람은 삭제하거나 대시보드로 내립니다. 알람의 가치는 개수가 아니라 **신뢰**입니다. [29강](../04-final-project/lesson-29.md)에서 팀 서비스의 SLI 기반으로 다시 설계합니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 3요소 | 지표(얼마나) · 로그(무슨 일) · 추적(어디서) |
| CloudWatch vs CloudTrail | **상태·언제** vs **누가·무엇을** |
| 기본 지표의 구멍 | 메모리·디스크 사용률 → **Agent** (`CWAgent` 네임스페이스) |
| Agent 설정 | **SSM 파라미터로 중앙화** → 서버 100대도 한 줄 |
| 로그 파이프라인 | 수집 → Insights(사후 질의) → **지표 필터 → 알람 → SNS** |
| 알람 설계 | 증상에 걸기 · 측정 기반 임계값 · `notBreaching` · **알람=행동** |
| CloudTrail | 관리 이벤트 90일 무료 · 데이터 이벤트는 유료 · 반영 지연 수 분 |
| SSM | 파라미터 스토어(표준 무료·SecureString) · Run Command(태그로 일괄) |

**한 장 요약**

```
  nginx 로그 ─Agent→ Logs ─필터→ 지표 ─알람→ SNS → 📧  (사람보다 먼저)
  CPU/MEM   ─Agent→ 지표 ─────────────┘
  "누가 바꿨나" → CloudTrail lookup-events
  설정·명령    → SSM 파라미터 / Run Command
```

**오늘 반드시 기억할 한 가지**
> **장애의 첫 발견자가 고객이면 관측성의 실패입니다.**
> 알람은 "울리면 행동하는 것"만 — 나머지는 대시보드로.

**과제**
1. **알람 왕복 증빙** — 404 폭주 유발 → ALARM 메일 → OK 복구 메일 두 통 캡처 + 알람 파라미터(기간·임계값·결측 처리)의 선택 이유 각 한 줄.
2. **Logs Insights 질의 2개** — 상태 코드별 집계, 404 상위 경로 5개. 질의문과 결과.
3. **CloudTrail 추적 기록** — 보안 그룹 변경의 누가/언제/어디서/무엇을 jq 출력.
4. **Run Command 실행 기록** — 태그 대상으로 명령 1회, 결과와 "SSH 대비 좋은 점" 3줄.
5. 내 서비스(16강 구성 기준)에 걸 **알람 5개를 설계**하세요 — 지표·임계값·근거·심각도 표. ([29강](../04-final-project/lesson-29.md)에서 실제로 만듭니다)
6. 정리 확인 — 알람·파라미터 목록 빈 출력.

---

[← 이전 21강](lesson-21.md) · [목차](README.md) · [다음 → 23강 Infrastructure as Code](lesson-23.md)
