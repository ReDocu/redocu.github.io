# 20강 · SQS · SNS · EventBridge

> **AWS 학습 매뉴얼** · 🟡 대단원 03 · **20강 / 총 32강**
> [← 이전 19강](lesson-19.md) · [목차](README.md) · [다음 → 21강 컨테이너 · ECR · ECS Fargate](lesson-21.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 동기 호출 사슬의 문제를 설명하고 **큐가 주는 4가지 이점**을 댈 수 있다.
- SQS의 **가시성 제한 시간**을 이해하고 소비자 Lambda를 연결할 수 있다.
- **DLQ**로 실패 메시지를 보존하고, 원인 수정 후 **재처리(redrive)** 할 수 있다.
- SNS **팬아웃**으로 하나의 이벤트를 여러 시스템에 전달할 수 있다.
- EventBridge로 **스케줄 실행**을 구성하고, **멱등성**의 필요를 설명할 수 있다.

---

## ② 왜 필요한가

주문 API를 동기 사슬로 만들면 이렇게 됩니다.

```
 사용자 → [주문 접수] → [재고 차감] → [결제] → [영수증 메일] → 응답
              50ms        80ms       900ms       1200ms
                                                  └ 응답까지 2.2초
```

**문제 세 가지**

| 문제 | 결과 |
|---|---|
| 가장 느린 단계가 전체를 지배 | 메일 서버가 느리면 **주문 접수도** 느려짐 |
| 하나가 죽으면 전부 실패 | 메일 장애 = **주문 불가** (본질과 무관한데!) |
| 트래픽 폭주가 그대로 전파 | 이벤트 오픈 순간 결제 시스템까지 함께 무너짐 |

**큐를 끼우면 사슬이 끊어집니다.**

```
 사용자 → [주문 접수] → 큐에 넣고 즉시 응답 (60ms)
                          │
                          ▼  소비자가 자기 속도로 꺼내 처리
                    [재고] [결제] [메일]   ← 죽어도 메시지는 큐에 안전
```

| 이점 | 설명 |
|---|---|
| **버퍼링** | 폭주를 큐가 흡수, 소비자는 일정한 속도로 |
| **재시도** | 실패하면 메시지가 큐로 돌아와 다시 시도 |
| **분리(decoupling)** | 한쪽 장애가 다른 쪽으로 전파되지 않음 |
| **독립 확장** | 접수와 처리를 따로 확장 |

이번 강의 핵심 실험은 하나입니다 — **"처리 서버를 고장 낸 상태로 요청을 보내도 데이터가 하나도 사라지지 않는다"** 를 증명하는 것. 최종 프로젝트의 필수 요구(비동기 처리 1개 이상)가 바로 이 구조입니다.

---

## ③ 개념 설명

### SQS — 꺼내 가는 큐(풀 모델)

```
 생산자 ── SendMessage ──▶ [ 큐 ] ◀── ReceiveMessage ── 소비자
                                    ── DeleteMessage ──   (처리 성공 후 직접 삭제!)
```

**가시성 제한 시간(Visibility Timeout)** — SQS의 가장 중요한 개념.

```
 소비자 A가 메시지 수신
    │  ← 이 순간부터 30초(기본)간 다른 소비자에게 "안 보임"
    ├─ 처리 성공 → DeleteMessage → 완전히 제거 ✅
    └─ 처리 실패(삭제 안 함) → 30초 뒤 다시 보임 → 다른 소비자가 재시도 🔁
```

| 규칙 | 이유 |
|---|---|
| **받는 것과 지우는 것은 별개** | 처리 도중 죽어도 메시지가 살아남게 |
| 가시성 시간 < 처리 시간이면 | 처리 중인데 다시 보임 → **중복 처리** 🔴 |
| Lambda 트리거 사용 시 | **가시성 ≥ 함수 타임아웃** 필수 (권장 6배) |

### 표준 큐 vs FIFO 큐

| | 표준(Standard) | FIFO |
|---|---|---|
| 순서 | 보장 안 함(대체로 순서) | **보장** (그룹 내) |
| 중복 | **최소 1회 전달**(중복 가능) 🔴 | 정확히 1회 처리 |
| 처리량 | 사실상 무제한 | 초당 300~3,000 |
| 요건 | — | `MessageGroupId` 필수 |
| 언제 | **대부분** — 멱등성으로 중복 방어 | 순서·정확성이 계약인 경우(잔액 등) |

### DLQ — 실패 메시지의 병원

```
 큐 ── 처리 실패 ×3 (maxReceiveCount) ──▶ DLQ (배달 못한 편지 큐)
                                            │
                                   사람이 원인 분석 → 코드 수정
                                            │
                                   redrive ─┘ (원래 큐로 되돌려 재처리)
```

> 🔴 **DLQ가 없으면 독약 메시지(poison message)가 큐를 막습니다** — 계속 실패 → 계속 재시도 → 뒤의 정상 메시지까지 지연. DLQ는 "버리지 않고 옆으로 빼 두는" 장치입니다.

### SNS — 밀어 주는 발행/구독(푸시 모델)

```
                       ┌──▶ SQS 큐 A (재고 시스템)
 발행자 ──▶ [SNS 주제] ─┼──▶ SQS 큐 B (알림 시스템)
                       └──▶ 이메일 구독자
        하나의 이벤트가 N곳으로 = 팬아웃(fan-out)
```

| | SNS | SQS |
|---|---|---|
| 모델 | **푸시** (즉시 전달) | **풀** (꺼내 갈 때까지 보관) |
| 대상 수 | 1 : N | 1 : 1 (소비자 그룹) |
| 보관 | ❌ 전달 실패 시 정책에 따라 유실 가능 | ✅ 최대 14일 |

> ⭐ **SNS → SQS 조합이 표준 패턴**인 이유 — SNS가 **배달**을, SQS가 **보관·재시도**를 맡아 서로의 약점을 지웁니다. 구독자를 추가해도 발행자는 코드를 한 줄도 안 바꿉니다.

### EventBridge — 규칙 기반 이벤트 버스

| 기능 | 예 |
|---|---|
| AWS 서비스 이벤트 라우팅 | "EC2가 종료되면" → Lambda |
| 커스텀 이벤트 + 패턴 매칭 | `{"detail": {"status": ["FAILED"]}}` 만 골라 전달 |
| **스케줄** | `rate(5 minutes)` · `cron(0 18 * * ? *)` — 서버리스 크론 |

SNS와의 구분 — SNS는 **단순 팬아웃**, EventBridge는 **내용 기반 라우팅·스케줄·서드파티 연동**. 둘 다 쓰는 서비스가 많습니다.

### 멱등성 — 중복은 버그가 아니라 전제

표준 큐·SNS·재시도는 모두 **"같은 메시지가 두 번 올 수 있다"** 를 전제합니다.

```
 ❌ 잔액 -= 금액                     (두 번 오면 두 번 차감)
 ✅ if 이미 처리한 messageId: skip   (두 번 와도 결과 동일 = 멱등)
```

| 구현 기법 | 예 |
|---|---|
| 처리 기록 + 조건부 쓰기 | DynamoDB `attribute_not_exists(msgId)` |
| 자연스러운 멱등 연산 | "상태를 SHIPPED로 **설정**"(덧셈이 아니라 대입) |
| 고유 키 제약 | 주문번호 UNIQUE |

---

## ④ 단계별 실습

> 💰 **예상 비용 $0 ~ 0.1** — SQS·SNS·EventBridge·Lambda 모두 상시 무료 한도 안입니다.
> [17강](lesson-17.md) `Orders` 테이블과 [18강](lesson-18.md) `course-lambda-role` 을 재사용합니다. VPC 불필요.

### Step 1. 큐 + DLQ 만들기 (15분)

**DLQ부터** 만듭니다(본 큐가 참조해야 하므로).

```bash
$ DLQ_URL=$(aws sqs create-queue --queue-name course-orders-dlq \
    --tags Project=aws-course --query 'QueueUrl' --output text)
$ DLQ_ARN=$(aws sqs get-queue-attributes --queue-url $DLQ_URL \
    --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)

$ Q_URL=$(aws sqs create-queue --queue-name course-orders \
    --attributes '{
      "VisibilityTimeout": "30",
      "ReceiveMessageWaitTimeSeconds": "10",
      "RedrivePolicy": "{\"deadLetterTargetArn\":\"'$DLQ_ARN'\",\"maxReceiveCount\":\"3\"}"
    }' \
    --tags Project=aws-course --query 'QueueUrl' --output text)
$ Q_ARN=$(aws sqs get-queue-attributes --queue-url $Q_URL \
    --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
```

| 설정 | 값 | 이유 |
|---|---|---|
| `VisibilityTimeout: 30` | 소비자 타임아웃(10초)의 3배 | 처리 중 재노출 방지 |
| `ReceiveMessageWaitTimeSeconds: 10` | **롱 폴링** | 빈 응답 요청 낭비 제거 |
| `maxReceiveCount: 3` | 3회 실패 시 DLQ로 | 독약 메시지 격리 |

**수동으로 한 번 왕복** — 받는 것과 지우는 것이 별개임을 체감합니다.

```bash
$ aws sqs send-message --queue-url $Q_URL \
    --message-body '{"user":"manual","item":"수동 테스트"}'

$ aws sqs receive-message --queue-url $Q_URL \
    --query 'Messages[0].[Body,ReceiptHandle]' --output text
{"user":"manual","item":"수동 테스트"}    AQEBz1...(긴 문자열)

# 삭제하지 않고 다시 받아 보면? → 30초간 안 보임(가시성), 30초 뒤 다시 등장
$ aws sqs receive-message --queue-url $Q_URL --query 'Messages'   # 즉시 재시도
null

# 삭제해야 진짜 끝
$ RH=$(aws sqs receive-message --queue-url $Q_URL --wait-time-seconds 20 \
    --query 'Messages[0].ReceiptHandle' --output text)
$ aws sqs delete-message --queue-url $Q_URL --receipt-handle "$RH"
```

### Step 2. 소비자 Lambda 연결 (20분)

**본문에 `FAIL` 이 있으면 일부러 실패**하는 소비자입니다(Step 3의 독약 실험용).

```bash
$ cat > consumer.py <<'EOF'
import json, os, datetime
import boto3
table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    for rec in event["Records"]:
        body = json.loads(rec["body"])
        msg_id = rec["messageId"]
        print(f"수신 [{msg_id[:8]}] 시도 {rec['attributes']['ApproximateReceiveCount']}회차:", body)

        if body.get("item") == "FAIL":
            raise RuntimeError("독약 메시지 - 처리 불가")

        # 멱등성: messageId 기준 조건부 쓰기 (중복 배달 대비)
        try:
            table.put_item(
                Item={"userId": body.get("user", "queue"),
                      "orderDate": datetime.datetime.utcnow().isoformat(timespec="milliseconds"),
                      "item": body.get("item", "?"),
                      "status": "PROCESSED",
                      "msgId": msg_id},
                ConditionExpression="attribute_not_exists(msgId)")
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            print(f"중복 감지 → 건너뜀: {msg_id[:8]}")
    return {"ok": True}
EOF

$ zip consumer.zip consumer.py
$ ROLE_ARN=$(aws iam get-role --role-name course-lambda-role --query 'Role.Arn' --output text)

$ aws lambda create-function --function-name course-order-consumer \
    --runtime python3.12 --handler consumer.handler \
    --role $ROLE_ARN --zip-file fileb://consumer.zip \
    --timeout 10 --memory-size 128 \
    --environment 'Variables={TABLE_NAME=Orders}'
```

**역할에 SQS 소비 권한 추가**

```bash
$ aws iam attach-role-policy --role-name course-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole
```

**이벤트 소스 매핑** — Lambda가 큐를 대신 폴링합니다.

```bash
$ aws lambda create-event-source-mapping \
    --function-name course-order-consumer \
    --event-source-arn $Q_ARN \
    --batch-size 1 \
    --query '[UUID,State]' --output text
a1b2c3d4-...    Creating
```

**정상 흐름 확인**

```bash
$ aws sqs send-message --queue-url $Q_URL \
    --message-body '{"user":"queue-kim","item":"이어폰"}'

$ sleep 10 && aws logs tail /aws/lambda/course-order-consumer --since 2m | grep 수신
수신 [3f7a2b1c] 시도 1회차: {'user': 'queue-kim', 'item': '이어폰'}

$ aws dynamodb query --table-name Orders \
    --key-condition-expression "userId = :u" \
    --expression-attribute-values '{":u":{"S":"queue-kim"}}' \
    --query 'Items[-1].[item.S,status.S]' --output text
이어폰    PROCESSED
```

### Step 3. 🔍 핵심 실험 — 실패해도 데이터는 안 사라진다 (25분)

**① 독약 메시지 1건 + 정상 메시지 5건을 섞어 보냅니다.**

```bash
$ aws sqs send-message --queue-url $Q_URL --message-body '{"user":"poison","item":"FAIL"}'
$ for N in 모니터 마우스 키보드 스피커 웹캠; do
    aws sqs send-message --queue-url $Q_URL \
      --message-body '{"user":"queue-kim","item":"'$N'"}' > /dev/null
  done
```

**② 관찰** — 정상 5건은 즉시 처리되고, 독약은 재시도를 반복합니다.

```bash
$ aws logs tail /aws/lambda/course-order-consumer --since 5m | grep -E "수신|ERROR" | head -12
수신 [9c1d...] 시도 1회차: {'user': 'poison', 'item': 'FAIL'}
[ERROR] RuntimeError: 독약 메시지 - 처리 불가
수신 [4e2f...] 시도 1회차: {'user': 'queue-kim', 'item': '모니터'}
수신 [7a8b...] 시도 1회차: {'user': 'queue-kim', 'item': '마우스'}
...
수신 [9c1d...] 시도 2회차: {'user': 'poison', 'item': 'FAIL'}     ← 30초 뒤 재시도
[ERROR] RuntimeError: 독약 메시지 - 처리 불가
```

> ✅ **`batch-size 1` 이라 독약이 정상 메시지의 처리를 막지 않습니다.** 배치가 크면 독약과 같은 배치에 묶인 정상 메시지도 함께 재시도됩니다.

**③ 약 2분 뒤 — 3회 실패한 독약이 DLQ로 이동합니다.**

```bash
$ aws sqs get-queue-attributes --queue-url $DLQ_URL \
    --attribute-names ApproximateNumberOfMessages \
    --query 'Attributes.ApproximateNumberOfMessages' --output text
1

$ aws sqs receive-message --queue-url $DLQ_URL --visibility-timeout 0 \
    --query 'Messages[0].Body' --output text
{"user":"poison","item":"FAIL"}
```

> ✅ **유실 0건.** 정상 5건은 처리됐고, 실패 1건은 DLQ에 **원문 그대로** 보존됐습니다. 이 두 출력이 과제의 핵심 증빙입니다.

**④ 원인 수정 후 재처리** — "코드를 고쳤다"를 재현합니다.

```bash
# FAIL을 보정 처리하도록 수정
$ sed -i 's|raise RuntimeError("독약 메시지 - 처리 불가")|body["item"] = "FAIL(보정됨)"; print("보정 처리")|' consumer.py
$ zip consumer.zip consumer.py
$ aws lambda update-function-code --function-name course-order-consumer \
    --zip-file fileb://consumer.zip > /dev/null
$ aws lambda wait function-updated --function-name course-order-consumer

# DLQ → 원래 큐로 재이동 (redrive)
$ aws sqs start-message-move-task --source-arn $DLQ_ARN
{ "TaskHandle": "eyJ0YXNr..." }

$ sleep 15 && aws logs tail /aws/lambda/course-order-consumer --since 2m | grep 보정
보정 처리
$ aws sqs get-queue-attributes --queue-url $DLQ_URL \
    --attribute-names ApproximateNumberOfMessages \
    --query 'Attributes.ApproximateNumberOfMessages' --output text
0
```

> 🔑 **실패 → 격리 → 수정 → 재처리** 사이클이 완성됐습니다. 이것이 DLQ의 존재 이유입니다.
> ⚠️ **코드를 고치기 전에 redrive 하면** 같은 실패를 반복하다 다시 DLQ로 옵니다. 순서가 중요합니다.

### Step 4. SNS 팬아웃 — 이벤트 하나, 목적지 셋 (20분)

```bash
$ TOPIC_ARN=$(aws sns create-topic --name course-events \
    --query 'TopicArn' --output text)

# 이메일 구독 (확인 메일의 링크를 반드시 클릭!)
$ aws sns subscribe --topic-arn $TOPIC_ARN --protocol email \
    --notification-endpoint 본인메일@example.com

# 팬아웃용 큐 2개
$ QA_URL=$(aws sqs create-queue --queue-name course-fanout-a --query 'QueueUrl' --output text)
$ QB_URL=$(aws sqs create-queue --queue-name course-fanout-b --query 'QueueUrl' --output text)
$ QA_ARN=$(aws sqs get-queue-attributes --queue-url $QA_URL --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
$ QB_ARN=$(aws sqs get-queue-attributes --queue-url $QB_URL --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
```

**⚠️ 가장 많이 빠뜨리는 단계 — 큐 정책.** SNS가 큐에 넣을 수 있도록 **큐 쪽에서** 허용해야 합니다.

```bash
$ for PAIR in "$QA_URL $QA_ARN" "$QB_URL $QB_ARN"; do
    set -- $PAIR
    aws sqs set-queue-attributes --queue-url $1 --attributes '{
      "Policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"sns.amazonaws.com\"},\"Action\":\"sqs:SendMessage\",\"Resource\":\"'$2'\",\"Condition\":{\"ArnEquals\":{\"aws:SourceArn\":\"'$TOPIC_ARN'\"}}}]}"
    }'
  done
```

**구독 연결** (원문 그대로 받도록 raw delivery)

```bash
$ for ARN in $QA_ARN $QB_ARN; do
    aws sns subscribe --topic-arn $TOPIC_ARN --protocol sqs \
      --notification-endpoint $ARN --attributes RawMessageDelivery=true
  done
```

**발행 한 번 → 세 곳 도착**

```bash
$ aws sns publish --topic-arn $TOPIC_ARN \
    --message '{"event":"order_created","orderId":1001,"user":"kim"}' \
    --query 'MessageId' --output text
b2c3d4e5-...

$ aws sqs receive-message --queue-url $QA_URL --wait-time-seconds 10 \
    --query 'Messages[0].Body' --output text
{"event":"order_created","orderId":1001,"user":"kim"}
$ aws sqs receive-message --queue-url $QB_URL --wait-time-seconds 10 \
    --query 'Messages[0].Body' --output text
{"event":"order_created","orderId":1001,"user":"kim"}
```

메일함에도 같은 내용이 도착해 있습니다.

> ✅ **발행자는 구독자가 몇인지 모릅니다.** 다음 달에 "포인트 적립 시스템"이 생기면 큐 하나 더 구독시키면 끝 — 발행 코드는 그대로입니다.

### Step 5. EventBridge 스케줄 — 서버리스 크론 (15분)

```bash
$ aws events put-rule --name course-every-5min \
    --schedule-expression 'rate(5 minutes)' \
    --query 'RuleArn' --output text
arn:aws:events:ap-northeast-2:123456789012:rule/course-every-5min

# 대상: 소비자 함수 재활용 (호출 권한 + 타깃 연결)
$ FN_ARN=$(aws lambda get-function --function-name course-order-consumer \
    --query 'Configuration.FunctionArn' --output text)
$ aws lambda add-permission --function-name course-order-consumer \
    --statement-id eventbridge-invoke --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn arn:aws:events:ap-northeast-2:$(aws sts get-caller-identity --query Account --output text):rule/course-every-5min

$ aws events put-targets --rule course-every-5min \
    --targets 'Id=1,Arn='$FN_ARN',Input="{\"Records\":[{\"messageId\":\"schedule\",\"attributes\":{\"ApproximateReceiveCount\":\"1\"},\"body\":\"{\\\"user\\\":\\\"scheduler\\\",\\\"item\\\":\\\"5분 배치\\\"}\"}]}"'
```

5~10분 기다렸다가 확인합니다.

```bash
$ aws logs tail /aws/lambda/course-order-consumer --since 12m | grep scheduler
수신 [schedule] 시도 1회차: {'user': 'scheduler', 'item': '5분 배치'}
```

> 🔴 **확인했으면 즉시 비활성화합니다.** 5분마다 도는 규칙은 방치하면 월 8,600회 호출입니다.

```bash
$ aws events disable-rule --name course-every-5min
```

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 이번 강 | 방치 시 월 |
|---|---|---|---|
| SQS | ✅ **월 100만 요청(상시)** | $0 | — (롱 폴링이면 무시 가능) |
| SNS 게시·SQS/이메일 전달 | ✅ 월 100만 게시(상시) | $0 | 🔴 **SMS 구독은 유료** |
| EventBridge (스케줄·AWS 이벤트) | ✅ 무료 | $0 | 규칙 방치 시 연쇄 호출 |
| Lambda · DynamoDB · Logs | ✅ | $0 | — |
| **합계** | | **$0** | — |

### 🧹 리소스 정리 체크리스트

```bash
# 1) 🔴 EventBridge 규칙 — 타깃 제거 후 삭제
$ aws events remove-targets --rule course-every-5min --ids 1
$ aws events delete-rule --name course-every-5min

# 2) 이벤트 소스 매핑 → 함수 삭제
$ ESM=$(aws lambda list-event-source-mappings --function-name course-order-consumer \
    --query 'EventSourceMappings[0].UUID' --output text)
$ aws lambda delete-event-source-mapping --uuid $ESM
$ aws lambda delete-function --function-name course-order-consumer
$ aws logs delete-log-group --log-group-name /aws/lambda/course-order-consumer

# 3) 큐 4개 삭제
$ for U in $Q_URL $DLQ_URL $QA_URL $QB_URL; do aws sqs delete-queue --queue-url $U; done

# 4) SNS — 주제 삭제(구독 함께 삭제), 이메일 구독 해제 확인
$ aws sns delete-topic --topic-arn $TOPIC_ARN

# 5) 대단원 03 전반부 마무리 정리 (17~20강 공유 자원)
$ aws dynamodb delete-table --table-name Orders
$ aws iam delete-role-policy --role-name course-lambda-role --policy-name write-orders
$ aws iam detach-role-policy --role-name course-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
$ aws iam detach-role-policy --role-name course-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole
$ aws iam delete-role --role-name course-lambda-role

# 6) 확인 — 전부 빈 출력
$ aws sqs list-queues --query 'QueueUrls' --output text
$ aws sns list-topics --query 'Topics' --output text
$ aws events list-rules --query 'Rules[*].Name' --output text
$ aws dynamodb list-tables --query 'TableNames' --output text
```

- [ ] 🔴 **EventBridge 규칙 삭제** (비활성화만으론 남음)
- [ ] 이벤트 소스 매핑 → 함수 → 로그 삭제
- [ ] 큐 4개(본 큐·DLQ·팬아웃 2) 삭제
- [ ] SNS 주제 삭제 · 메일 구독 정리
- [ ] `Orders` 테이블 · `course-lambda-role` 삭제 (17~20강 공유분 최종 정리)
- [ ] 확인 명령 4개 빈 출력

---

## ⑤ 자주 하는 실수

### SNS에 발행했는데 큐에 메시지가 안 온다

**증상** — 구독은 `Confirmed` 인데 `receive-message` 가 비어 있습니다.
**원인** — **큐 정책이 없습니다.** IAM은 "내가 큐에 접근"을 다루고, **SNS 서비스가 큐에 넣는 것**은 큐의 리소스 기반 정책이 허용해야 합니다.
**해결** — Step 4의 `set-queue-attributes` 로 `sns.amazonaws.com` 에 `sqs:SendMessage` 를 허용(주제 ARN 조건 포함).

> 🔑 [13강](../02-compute-data/lesson-13.md) S3 버킷 정책, [19강](lesson-19.md) Lambda 리소스 정책과 같은 원리입니다 — **"서비스가 내 리소스를 건드리려면 리소스 쪽 정책이 열려 있어야 한다."**

### 같은 메시지가 두 번 처리됐다

**원인 3가지**

| 원인 | 설명 |
|---|---|
| **가시성 시간 < 처리 시간** | 처리 중인데 다시 보여서 다른 소비자가 또 집음 |
| 표준 큐의 최소 1회 전달 | 드물지만 **정상 동작** |
| 처리 성공 후 삭제 전에 죽음 | 재시도 시 이미 처리된 메시지 재수신 |

**해결** — ① 가시성을 처리 시간의 3~6배로 ② **멱등 처리**(Step 2의 `attribute_not_exists(msgId)` 조건부 쓰기). 중복을 없애려 하지 말고 **중복이 와도 무해하게** 만드는 것이 정답입니다.

### 이벤트 소스 매핑 생성이 거부된다

```
An error occurred (InvalidParameterValueException):
Queue visibility timeout: 10 seconds is less than Function timeout: 30 seconds
```

**원인** — Lambda 트리거는 **큐 가시성 ≥ 함수 타임아웃**을 요구합니다. 처리 중 재노출을 막기 위해서입니다.
**해결** — 큐 가시성을 올리거나 함수 타임아웃을 내립니다(권장: 가시성 = 타임아웃 × 6).

### 수동 receive-message가 계속 비어 있다

**원인 후보**

| 원인 | 설명 |
|---|---|
| **이벤트 소스 매핑이 먼저 집어감** | Lambda 폴러와 **경쟁**하고 있습니다 — 매핑이 붙은 큐를 수동으로 읽지 마세요 |
| 다른 소비자의 가시성 시간 안 | 잠시 뒤 재시도 |
| 숏 폴링의 빈 응답 | `--wait-time-seconds 10~20` 롱 폴링 사용 |

### FIFO 큐로 바꿨더니 전송이 실패한다

```
An error occurred (MissingParameter): The request must contain the parameter MessageGroupId.
```

**원인** — FIFO 큐는 `MessageGroupId`(순서 보장 단위)가 **필수**이고, 콘텐츠 중복 제거를 안 켰다면 `MessageDeduplicationId` 도 필요합니다. 큐 이름도 `.fifo` 로 끝나야 합니다.
**해결** — `--message-group-id order-123` 지정. 그리고 정말 FIFO가 필요한지 재검토 — 대부분은 표준 큐 + 멱등성으로 충분합니다.

### 이메일 구독이 동작하지 않는다

**원인** — 구독 상태가 `PendingConfirmation` — **확인 메일의 링크를 누르기 전**에는 전달되지 않습니다.
**해결** — 메일함(스팸 포함)에서 "AWS Notification - Subscription Confirmation" 확인.

```bash
$ aws sns list-subscriptions-by-topic --topic-arn $TOPIC_ARN \
    --query 'Subscriptions[*].[Protocol,SubscriptionArn]' --output table
| email | PendingConfirmation |     ← 아직 확인 안 함
| sqs   | arn:aws:sns:...     |     ← 정상
```

### 재처리(redrive)했더니 다시 DLQ로 돌아온다

**원인** — **코드를 고치기 전에** 되돌렸습니다. 같은 이유로 3번 실패하고 다시 DLQ행입니다.
**해결** — 순서를 지킵니다: **원인 분석 → 코드 수정·배포 → redrive.** DLQ 메시지를 먼저 `receive-message`(visibility 0)로 들여다보고 원인을 찾는 것이 첫 단계입니다.

---

## ⑥ 확인 문제

**1.** 주문 API의 응답이 결제 처리 때문에 2초씩 걸립니다. 큐를 도입하면 무엇이 어떻게 좋아지고, 대신 무엇을 포기하나요?

<details>
<summary>답 보기</summary>

**좋아지는 것 4가지**

| 이점 | 구체적으로 |
|---|---|
| 응답 속도 | 접수 즉시 응답(60ms) — 결제는 뒤에서 |
| **내결함성** | 결제 시스템이 죽어도 주문은 계속 접수, 메시지는 큐에 보존 |
| 부하 흡수 | 폭주 시 큐가 버퍼 — 결제는 자기 속도로 소진 |
| 독립 확장 | 접수와 처리를 따로 확장 |

**포기하는 것 — 즉시성(강한 일관성)**

- 응답 시점에 결제는 **아직 안 끝났습니다.** "주문이 접수되었습니다(결제 확인 중)"로 UX를 바꿔야 합니다.
- 결과 통지가 별도로 필요합니다(폴링·웹소켓·푸시).
- 실패 처리도 비동기 — 결제 실패 시 "취소" 흐름을 따로 설계해야 합니다.
- 중복 배달 가능성 → **멱등 처리 필수.**

**판단 기준** — 사용자가 결과를 **그 자리에서** 알아야 하면(잔액 조회 등) 동기, "받아 두고 나중에 처리해도 되는" 것(메일·집계·썸네일·결제 확정)은 비동기가 정답입니다.
</details>

**2.** DLQ의 `maxReceiveCount: 3` 은 정확히 어떤 동작을 만들며, DLQ가 없으면 어떤 문제가 생기나요? DLQ에 쌓인 메시지의 처리 절차도 쓰세요.

<details>
<summary>답 보기</summary>

**동작** — 메시지의 수신 횟수(`ApproximateReceiveCount`)가 3을 **초과**하면(= 3번 실패해 4번째로 보이려 할 때) SQS가 그 메시지를 본 큐에서 빼서 **DLQ로 이동**시킵니다. 실패는 "처리 후 삭제하지 않고 가시성 시간이 만료됨"으로 판정됩니다.

**DLQ가 없으면**
- 독약 메시지가 **영원히 재시도**됩니다 — 실패 → 재노출 → 실패 → …
- 소비자 자원(Lambda 호출 비용 포함)이 계속 낭비되고
- 배치로 묶인 정상 메시지까지 지연되며
- 결국 보존 기간(기본 4일)이 지나면 **조용히 유실**됩니다 — 원인 분석 기회조차 사라짐.

**DLQ 메시지 처리 절차**

```
 ① 들여다보기   receive-message --visibility-timeout 0 로 원문 확인
 ② 원인 분석    로그의 예외와 대조 (데이터 문제? 코드 버그? 의존 서비스 장애?)
 ③ 수정 배포    코드/데이터 수정이 먼저
 ④ 재처리       start-message-move-task 로 본 큐로 되돌림
 ⑤ 재발 방지    검증 로직·알람(DLQ 깊이 > 0 알람, 22강) 추가
```

⚠️ ③ 전에 ④를 하면 같은 실패를 반복하고 다시 DLQ로 옵니다.
</details>

**3.** "주문 생성" 이벤트를 재고·알림·포인트 세 시스템이 받아야 합니다. ① SNS 없이 SQS 세 개에 직접 넣는 방식과 ② SNS→SQS 팬아웃 방식을 비교하고, SNS에서 Lambda를 직접 구독시키는 것 대비 SQS를 끼우는 이점도 쓰세요.

<details>
<summary>답 보기</summary>

**① 발행자가 큐 3개에 직접 send (안티패턴)**

- 발행 코드가 **구독자 목록을 알아야** 합니다 — 시스템 추가마다 발행 코드 수정·배포.
- 3번의 전송 중 2번째에서 죽으면? **부분 전송** 상태를 발행자가 수습해야 합니다.
- 결합도가 높아져 "분리"라는 목적 자체가 훼손됩니다.

**② SNS → SQS 팬아웃 (표준 패턴)**

- 발행자는 **주제 하나만** 압니다. 구독 추가는 발행자와 무관.
- SNS가 각 구독자 전달을 책임지고, 실패 시 재시도 정책 적용.
- 구독자별로 필터 정책을 걸어 필요한 이벤트만 받게 할 수도 있습니다.

**SNS→Lambda 직접 대비, 중간에 SQS를 끼우는 이점**

| 관점 | SNS→Lambda 직접 | **SNS→SQS→Lambda** |
|---|---|---|
| 소비자 장애 시 | SNS 재시도 정책 소진 후 **유실 위험** | 큐가 **최대 14일 보관** |
| 폭주 시 | 동시 실행 폭발 | 큐가 흡수, 소비 속도 제어 |
| 실패 관리 | 함수별 설정 | **DLQ + redrive** 체계 |

**한 줄 결론** — *"배달은 SNS, 보관·재시도는 SQS."* 각자 잘하는 것만 시키는 조합이라 표준이 됐습니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 큐의 4이점 | 버퍼링 · 재시도 · **분리** · 독립 확장 |
| 가시성 제한 시간 | 받는 동안 안 보임. **처리 시간의 3~6배**, Lambda 타임아웃 이상 |
| 수신 ≠ 삭제 | 성공 후 **직접 삭제**해야 제거됨 |
| 표준 vs FIFO | 표준 + **멱등성**이 기본. FIFO는 순서가 계약일 때 |
| **DLQ** | 3회 실패 → 격리 → 분석 → **수정 후** redrive |
| SNS 팬아웃 | 발행자는 주제만 안다. **큐 정책** 필수 |
| SNS+SQS 조합 | 배달은 SNS, 보관·재시도는 SQS |
| EventBridge | 내용 기반 라우팅 + 스케줄. **규칙 방치 금지** |
| 멱등성 | `attribute_not_exists(msgId)` — 중복은 전제 조건 |

**한 장 요약**

```
  API(19강) ─▶ [SQS] ─▶ Lambda 소비자 ─▶ DynamoDB
                 │ 3회 실패
                 ▼
               [DLQ] ─ 수정 후 redrive ─▶ 다시 [SQS]
  이벤트 확산: 발행 ─▶ [SNS] ─┬▶ SQS-A ─▶ 재고
                             ├▶ SQS-B ─▶ 알림
                             └▶ email
```

**오늘 반드시 기억할 한 가지**
> **비동기의 성공 기준은 속도가 아니라 "실패해도 잃지 않는 것"입니다.**
> 그리고 중복 배달은 버그가 아니라 전제입니다 — 멱등하게 설계하세요.

**과제**
1. **유실 0건 증명** — 독약 1건+정상 5건 실험의 전체 기록: 소비자 로그(재시도 횟수 포함), DLQ 깊이 1, DynamoDB의 정상 5건, redrive 후 DLQ 깊이 0.
2. **멱등성 실험** — 같은 messageId의 메시지를 수동으로 두 번 흘려 "중복 감지 → 건너뜀" 로그를 캡처.
3. **팬아웃 증빙** — 발행 1회에 대해 큐 2개 + 이메일 3곳의 수신 확인.
4. 아키텍처 다이어그램 — `API GW → Lambda(접수) → SQS → Lambda(처리) → DynamoDB` + DLQ, 실패 경로를 점선으로 표시.
5. "우리 서비스에서 비동기로 바꿀 작업 2개와 동기로 남겨야 할 작업 1개"를 근거와 함께 5줄.
6. 정리 확인 — 큐·주제·규칙·테이블 목록 모두 빈 출력.

---

[← 이전 19강](lesson-19.md) · [목차](README.md) · [다음 → 21강 컨테이너 · ECR · ECS Fargate](lesson-21.md)
