# 18강 · Lambda

> **AWS 학습 매뉴얼** · 🟡 대단원 03 · **18강 / 총 32강**
> [← 이전 17강](lesson-17.md) · [목차](README.md) · [다음 → 19강 API Gateway와 서버리스 API](lesson-19.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 서버리스가 **무엇을 없애고 무엇을 남기는지** 설명할 수 있다.
- Lambda 함수를 만들어 **실행 역할 · 로그 · 환경 변수**를 구성할 수 있다.
- 메모리 설정을 바꿔 가며 **성능과 비용의 관계를 실측**할 수 있다.
- 타임아웃·권한 오류를 **로그로 진단**할 수 있다.
- S3 이벤트로 함수를 트리거하고 **무한 재귀를 예방하는 장치**를 걸 수 있다.

---

## ② 왜 필요한가

이런 요구를 받았다고 합시다.

> "사용자가 이미지를 올리면 썸네일을 만들어 주세요. 하루에 한 200번쯤 올라와요."

[10강](../02-compute-data/lesson-10.md)까지 배운 방식으로 하면 EC2를 한 대 상시로 돌려야 합니다.

```
 하루 24시간 중 실제 작업 시간:  200회 × 2초 = 약 7분
 나머지 23시간 53분:            대기 (그래도 과금)
 가동률:                        0.5%
```

**서버의 99.5%가 기다리는 데 쓰입니다.** 게다가 그 서버의 패치·모니터링·장애 대응은 전부 내 일입니다.

Lambda는 계산을 뒤집습니다.

| | EC2 상시 운영 | Lambda |
|---|---|---|
| 과금 | **켜 둔 시간** | **실행한 시간**(1ms 단위) |
| 유휴 비용 | 월 $9.4 (t3.micro) | **$0** |
| 이 작업의 월 비용 | 약 $9.4 | 약 **$0.01** (프리 티어면 $0) |
| 패치·용량 관리 | 내 일 | AWS |
| 확장 | ASG 구성 필요 | **자동**(요청마다 병렬) |

서버리스는 "서버가 없다"가 아니라 **"서버가 내 관심사가 아니다"** 입니다. 코드와 트리거만 남고, 나머지는 사라집니다.

단, 공짜 점심은 아닙니다 — **콜드 스타트, 15분 제한, 상시 고부하에서의 비용 역전**이라는 대가가 있습니다. 오늘 그 경계까지 함께 배웁니다. 그리고 이 함수들이 [19강 API](lesson-19.md)와 [20강 큐](lesson-20.md) 뒤에 놓이면서 서버리스 아키텍처가 완성됩니다.

---

## ③ 개념 설명

### Lambda 실행 모델

```
 이벤트 소스              함수                      다른 AWS 서비스
 ┌──────────┐      ┌──────────────────┐      ┌──────────────┐
 │ S3 업로드 │ ───▶ │  handler(event,  │ ───▶ │  DynamoDB    │
 │ API 요청  │      │          context)│      │  S3, SNS...  │
 │ 큐 메시지 │      │  실행 역할의 권한  │      └──────────────┘
 │ 스케줄    │      └──────────────────┘
 └──────────┘        요청마다 격리된 실행 환경(마이크로VM)
```

| 요소 | 뜻 |
|---|---|
| **핸들러(handler)** | 호출 진입점. `파일명.함수명` (예: `handler.handler`) |
| **event** | 트리거가 넘겨주는 데이터(JSON). **소스마다 구조가 다름** |
| **context** | 실행 정보(요청 ID, 남은 시간 등) |
| **실행 역할** | 함수가 다른 AWS 서비스를 호출할 때 쓰는 IAM 역할 ([03강](../01-cloud-foundation/lesson-03.md)의 "사람이 아니면 역할") |

### 과금 공식과 핵심 설정

```
 비용 = 요청 수 × $0.20/100만  +  실행 시간(GB-초) × $0.0000167
                                    └ 메모리(GB) × 시간(초)
```

| 설정 | 범위 | 의미 |
|---|---|---|
| **메모리** | 128MB ~ 10GB | 🔑 **CPU도 메모리에 비례해** 커진다 (약 1,769MB = 1 vCPU) |
| **타임아웃** | 최대 **15분** | 초과 시 강제 종료. 더 길면 Lambda가 아니라 컨테이너([21강](lesson-21.md)) |
| 임시 저장소 | /tmp 512MB~10GB | 실행 간 보존 보장 없음 |
| 환경 변수 | 4KB | 설정 주입. **비밀 값은 평문 금지** |

> ⭐ **메모리를 올리면 CPU가 함께 올라 실행이 빨라집니다.** 과금이 `메모리 × 시간`이므로 **총비용이 그대로이거나 오히려 줄면서 빨라지는 구간**이 존재합니다. 오늘 실측합니다.

### 콜드 스타트

```
 [콜드 스타트]  환경 준비 + 코드 로드 + 초기화  →  handler 실행
                └────── 수백 ms ~ 수 초 ──────┘
 [웜 스타트]    (환경 재사용)                  →  handler 실행
```

| 완화 방법 | 내용 |
|---|---|
| 패키지 축소 | 의존성을 줄여 로드 시간 단축 |
| 초기화 코드를 핸들러 밖으로 | 클라이언트 생성 등은 **재사용됨** |
| 프로비저닝된 동시성 | 미리 데워 둠(유료) |
| 언어 선택 | Python·Node가 Java·.NET보다 빠름 |

### VPC 연결 — 넣을 때와 넣지 말아야 할 때

| 상황 | VPC 연결 |
|---|---|
| DynamoDB·S3·SNS 등 퍼블릭 엔드포인트 서비스만 호출 | ❌ **불필요** (기본이 더 빠르고 단순) |
| **RDS·ElastiCache** 등 VPC 안 리소스 접근 | ✅ 필요 |

> 🔴 **VPC에 넣으면 그 서브넷의 규칙을 그대로 따릅니다.** 프라이빗 서브넷이면 인터넷 접근에 NAT나 엔드포인트가 필요해집니다([07강](../01-cloud-foundation/lesson-07.md)). "Lambda를 VPC에 넣었더니 외부 API 호출이 안 돼요"의 원인입니다.

### 실행 방식 선택 기준 (미리 보기)

| 조건 | 선택 |
|---|---|
| 이벤트성 · 짧은 작업(15분 미만) · 유휴 많음 | **Lambda** |
| 상시 트래픽 · 장시간 실행 · 특수 런타임 | 컨테이너/EC2 ([21강](lesson-21.md)에서 완성) |

### 무한 재귀 — Lambda 최대의 비용 사고 🔴

```
 S3 버킷 A 업로드 ─▶ Lambda 실행 ─▶ 결과를 버킷 A에 저장
        ▲──────────────────────────────────┘
              또 트리거! 무한 반복 → 비용 폭탄
```

**예방 3종** — ① 입력/출력 **버킷(또는 접두사) 분리** ② **예약된 동시성**으로 상한 설정 ③ 예산 알림([02강](../01-cloud-foundation/lesson-02.md)). AWS가 재귀 루프를 일부 자동 감지해 끊어 주지만, **설계로 막는 것이 원칙**입니다.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0 ~ 0.1** — Lambda 상시 무료(월 100만 요청 + 40만 GB-초) 안에서 끝납니다.
> VPC가 필요 없는 강입니다. [17강](lesson-17.md)의 `Orders` 테이블을 재사용합니다.

### Step 1. 실행 역할 만들기 (10분)

```bash
$ cat > lambda-trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

$ aws iam create-role --role-name course-lambda-role \
    --assume-role-policy-document file://lambda-trust.json \
    --query 'Role.Arn' --output text
arn:aws:iam::123456789012:role/course-lambda-role

$ aws iam attach-role-policy --role-name course-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

> 📌 `AWSLambdaBasicExecutionRole` 은 **CloudWatch Logs에 로그를 쓸 권한만** 담고 있습니다. 로그가 안 보이는 문제의 대부분이 이 정책 누락입니다.

### Step 2. 첫 함수 — 만들고, 호출하고, 로그 보기 (15분)

```bash
$ cat > handler.py <<'EOF'
import json

def handler(event, context):
    print("받은 이벤트:", json.dumps(event, ensure_ascii=False))
    print("남은 시간(ms):", context.get_remaining_time_in_millis())
    return {"message": "hello from lambda", "request_id": context.aws_request_id}
EOF

$ zip function.zip handler.py
$ ROLE_ARN=arn:aws:iam::123456789012:role/course-lambda-role

$ aws lambda create-function \
    --function-name course-hello \
    --runtime python3.12 \
    --handler handler.handler \
    --role $ROLE_ARN \
    --zip-file fileb://function.zip \
    --timeout 10 --memory-size 128 \
    --tags Project=aws-course,Week=W09 \
    --query '[FunctionName,State]' --output text
course-hello    Pending
```

> ⚠️ 역할 생성 직후에는 `The role defined for the function cannot be assumed by Lambda` 오류가 날 수 있습니다. **전파에 몇 초**가 걸리니 10초 뒤 재시도하세요.

**호출**

```bash
$ aws lambda invoke --function-name course-hello \
    --payload '{"name":"aws","week":"W09"}' \
    --cli-binary-format raw-in-base64-out out.json
{
    "StatusCode": 200,
    "ExecutedVersion": "$LATEST"
}
$ cat out.json
{"message": "hello from lambda", "request_id": "0a1b2c3d-..."}
```

**로그 확인** — `print` 가 전부 CloudWatch Logs로 갑니다.

```bash
$ aws logs tail /aws/lambda/course-hello --since 5m
2026-08-13T13:02:11 INIT_START Runtime Version: python:3.12
2026-08-13T13:02:11 START RequestId: 0a1b2c3d-... Version: $LATEST
2026-08-13T13:02:11 받은 이벤트: {"name": "aws", "week": "W09"}
2026-08-13T13:02:11 남은 시간(ms): 9998
2026-08-13T13:02:11 END RequestId: 0a1b2c3d-...
2026-08-13T13:02:11 REPORT RequestId: 0a1b2c3d-... Duration: 1.42 ms
    Billed Duration: 2 ms  Memory Size: 128 MB  Max Memory Used: 36 MB  Init Duration: 98.31 ms
```

**REPORT 줄 읽는 법** — 앞으로 계속 보게 될 가장 중요한 로그입니다.

| 필드 | 뜻 |
|---|---|
| `Duration` | 실제 실행 시간 |
| `Billed Duration` | **과금 시간**(1ms 단위 올림) |
| `Max Memory Used` | 실제 사용 메모리 — **적정 크기 판단 근거** |
| `Init Duration` | **콜드 스타트에만 나타남** — 이 줄이 없으면 웜 스타트 |

**로그 보존 설정** — 잊으면 영구 보관·영구 과금입니다.

```bash
$ aws logs put-retention-policy --log-group-name /aws/lambda/course-hello --retention-in-days 7
```

### Step 3. DynamoDB에 쓰는 함수 — 권한과 환경 변수 (20분)

```bash
$ cat > writer.py <<'EOF'
import os, json, datetime
import boto3

# 핸들러 밖: 실행 환경이 재사용될 때 함께 재사용된다 (콜드 스타트 최적화)
table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    item = {
        "userId":    event.get("userId", "lambda"),
        "orderDate": datetime.datetime.utcnow().isoformat(timespec="seconds"),
        "item":      event.get("item", "unknown"),
        "status":    "PENDING",
        "source":    "lambda-writer",
    }
    table.put_item(Item=item)
    print("저장:", json.dumps(item, ensure_ascii=False))
    return {"saved": item["orderDate"]}
EOF

$ zip writer.zip writer.py
$ aws lambda create-function --function-name course-order-writer \
    --runtime python3.12 --handler writer.handler \
    --role $ROLE_ARN --zip-file fileb://writer.zip \
    --timeout 10 --memory-size 128 \
    --environment 'Variables={TABLE_NAME=Orders}'
```

**지금 호출하면 실패합니다 — 일부러 확인합니다.**

```bash
$ aws lambda invoke --function-name course-order-writer \
    --payload '{"userId":"kim","item":"노트북"}' \
    --cli-binary-format raw-in-base64-out out.json
$ cat out.json
{"errorMessage": "An error occurred (AccessDeniedException) when calling the PutItem operation:
 User: arn:aws:sts::123456789012:assumed-role/course-lambda-role/course-order-writer
 is not authorized to perform: dynamodb:PutItem on resource: ...table/Orders ...",
 "errorType": "ClientError", ...}
```

> ✅ **실행 역할에 DynamoDB 권한이 없기 때문**입니다. [04강](../01-cloud-foundation/lesson-04.md)의 원칙대로 **필요한 테이블에 필요한 액션만** 부여합니다.

```bash
$ ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
$ cat > ddb-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:PutItem"],
    "Resource": "arn:aws:dynamodb:ap-northeast-2:$ACCOUNT:table/Orders"
  }]
}
EOF
$ aws iam put-role-policy --role-name course-lambda-role \
    --policy-name write-orders --policy-document file://ddb-policy.json

$ sleep 10 && aws lambda invoke --function-name course-order-writer \
    --payload '{"userId":"kim","item":"노트북"}' \
    --cli-binary-format raw-in-base64-out out.json && cat out.json
{"saved": "2026-08-13T13:21:45"}
```

**테이블에서 확인**

```bash
$ aws dynamodb query --table-name Orders \
    --key-condition-expression "userId = :u" \
    --expression-attribute-values '{":u":{"S":"kim"}}' \
    --query 'Items[-1].[orderDate.S,item.S]' --output text
2026-08-13T13:21:45    노트북
```

> 💡 테이블 이름을 코드가 아니라 **환경 변수**로 받았습니다. dev/prod 테이블 전환이 코드 수정 없이 됩니다.

### Step 4. 메모리 = 성능 = 비용 실측 ⭐ (20분)

CPU를 쓰는 함수로 메모리 3단계를 비교합니다.

```bash
$ cat > bench.py <<'EOF'
import hashlib, time

def handler(event, context):
    t0 = time.time()
    h = b"seed"
    for _ in range(300_000):
        h = hashlib.sha256(h).digest()
    return {"seconds": round(time.time() - t0, 3)}
EOF

$ zip bench.zip bench.py
$ aws lambda create-function --function-name course-bench \
    --runtime python3.12 --handler bench.handler \
    --role $ROLE_ARN --zip-file fileb://bench.zip \
    --timeout 30 --memory-size 128
```

**128 → 512 → 1024MB로 바꿔 가며 각 2회 호출**(두 번째 값 = 웜 스타트 기준):

```bash
$ for MEM in 128 512 1024; do
    aws lambda update-function-configuration --function-name course-bench \
        --memory-size $MEM > /dev/null
    aws lambda wait function-updated --function-name course-bench
    for i in 1 2; do
      aws lambda invoke --function-name course-bench \
          --cli-binary-format raw-in-base64-out /dev/null \
          --log-type Tail --query 'LogResult' --output text | base64 -d | grep REPORT
    done
  done
REPORT ... Billed Duration: 2412 ms  Memory Size: 128 MB   Max Memory Used: 37 MB
REPORT ... Billed Duration: 2398 ms  Memory Size: 128 MB   ...
REPORT ... Billed Duration: 601 ms   Memory Size: 512 MB   ...
REPORT ... Billed Duration: 596 ms   Memory Size: 512 MB   ...
REPORT ... Billed Duration: 302 ms   Memory Size: 1024 MB  ...
REPORT ... Billed Duration: 299 ms   Memory Size: 1024 MB  ...
```

**비교표 만들기** — 과금은 `GB × 초` 입니다.

| 메모리 | 실행 시간 | GB-초 | 100만 회 비용(대략) | 체감 |
|---|---|---|---|---|
| 128MB | 약 2,400ms | 0.125 × 2.4 = **0.300** | 약 $5.0 | 느림 |
| 512MB | 약 600ms | 0.5 × 0.6 = **0.300** | 약 $5.0 | 4배 빠름 |
| 1024MB | 약 300ms | 1.0 × 0.3 = **0.300** | 약 $5.0 | **8배 빠름** |

> 🔑 **비용이 거의 같은데 8배 빨라졌습니다.** CPU가 메모리에 비례하기 때문입니다.
> CPU 위주 작업은 메모리를 올리는 것이 **공짜 성능**입니다. (I/O 대기 위주 작업은 해당 없음 — 기다리는 시간은 메모리로 안 줄어듭니다.)

### Step 5. 실패를 일부러 — 타임아웃과 진단 (15분)

```bash
$ cat > slow.py <<'EOF'
import time
def handler(event, context):
    time.sleep(5)
    return "끝까지 왔다면 타임아웃이 아님"
EOF
$ zip slow.zip slow.py
$ aws lambda create-function --function-name course-slow \
    --runtime python3.12 --handler slow.handler \
    --role $ROLE_ARN --zip-file fileb://slow.zip \
    --timeout 3 --memory-size 128        # 타임아웃 3초 < sleep 5초

$ aws lambda invoke --function-name course-slow \
    --cli-binary-format raw-in-base64-out out.json ; cat out.json
{"errorMessage": "2026-08-13T13:40:12.345Z 0a1b2c3d-... Task timed out after 3.00 seconds"}
```

```bash
$ aws logs tail /aws/lambda/course-slow --since 2m | grep -E "REPORT|timed"
2026-08-13T13:40:12 ... Task timed out after 3.00 seconds
REPORT ... Duration: 3000.00 ms  Billed Duration: 3000 ms  Memory Size: 128 MB
```

> 🔑 **타임아웃도 과금됩니다**(3초 전부). 진단 순서: `out.json` 의 errorType → 로그의 스택 트레이스 → REPORT의 Duration/Memory.
> `errorType` 별 대처 — `Task timed out` → 타임아웃 상향 또는 로직 분해 / `Runtime.ImportModuleError` → 핸들러 경로·패키징 / `ClientError(AccessDenied)` → 실행 역할.

### Step 6. S3 트리거 — 그리고 재귀 방지 (20분)

**입력 전용 버킷을 만들고**(출력과 분리 🔴) 업로드 이벤트로 함수를 실행합니다.

```bash
$ IN_BUCKET=course-lambda-in-$(date +%s)
$ aws s3 mb s3://$IN_BUCKET

$ cat > s3handler.py <<'EOF'
import json, os, urllib.parse, datetime
import boto3
table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    for rec in event["Records"]:
        bucket = rec["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(rec["s3"]["object"]["key"])
        size = rec["s3"]["object"].get("size", 0)
        print(f"업로드 감지: s3://{bucket}/{key} ({size} bytes)")
        table.put_item(Item={
            "userId": "s3-upload",
            "orderDate": datetime.datetime.utcnow().isoformat(timespec="seconds"),
            "item": key, "status": "RECEIVED",
        })
    return {"processed": len(event["Records"])}
EOF

$ zip s3handler.zip s3handler.py
$ aws lambda create-function --function-name course-s3-handler \
    --runtime python3.12 --handler s3handler.handler \
    --role $ROLE_ARN --zip-file fileb://s3handler.zip \
    --timeout 10 --memory-size 128 \
    --environment 'Variables={TABLE_NAME=Orders}'
```

**안전장치 ① — 동시 실행 상한** (폭주해도 2개까지만)

```bash
$ aws lambda put-function-concurrency --function-name course-s3-handler \
    --reserved-concurrent-executions 2
```

**S3가 이 함수를 호출할 권한** (리소스 기반 정책)

```bash
$ aws lambda add-permission --function-name course-s3-handler \
    --statement-id s3-invoke --action lambda:InvokeFunction \
    --principal s3.amazonaws.com \
    --source-arn arn:aws:s3:::$IN_BUCKET
```

**버킷에 알림 연결**

```bash
$ FN_ARN=$(aws lambda get-function --function-name course-s3-handler \
    --query 'Configuration.FunctionArn' --output text)
$ aws s3api put-bucket-notification-configuration --bucket $IN_BUCKET \
    --notification-configuration '{
      "LambdaFunctionConfigurations": [{
        "LambdaFunctionArn": "'$FN_ARN'",
        "Events": ["s3:ObjectCreated:*"]
      }]}'
```

**동작 확인**

```bash
$ echo "테스트 파일" > upload-test.txt
$ aws s3 cp upload-test.txt s3://$IN_BUCKET/photos/upload-test.txt

$ sleep 5 && aws logs tail /aws/lambda/course-s3-handler --since 2m | grep 감지
2026-08-13T13:55:02 업로드 감지: s3://course-lambda-in-.../photos/upload-test.txt (20 bytes)

$ aws dynamodb query --table-name Orders \
    --key-condition-expression "userId = :u" \
    --expression-attribute-values '{":u":{"S":"s3-upload"}}' \
    --query 'Items[-1].item.S' --output text
photos/upload-test.txt
```

> ✅ **업로드 → 자동 실행 → 기록.** 서버는 어디에도 없습니다.
> 🔴 **이 함수가 같은 버킷에 파일을 쓰도록 고치는 순간 무한 재귀입니다.** 출력이 필요하면 반드시 **다른 버킷**(또는 트리거에 접두사 필터를 걸고 다른 접두사)에 씁니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 이번 강 | 방치 시 월 |
|---|---|---|---|
| Lambda 요청 | ✅ **월 100만 건(상시)** | ~30건 → $0 | — |
| Lambda 실행 시간 | ✅ **월 40만 GB-초(상시)** | ~20 GB-초 → $0 | — |
| CloudWatch Logs | ✅ 5GB 수집 | $0 | 보존 무제한 방치 시 누적 🔴 |
| S3 버킷 | ✅ | $0 | — |
| DynamoDB | ✅ 상시 무료 한도 | $0 | — |
| **합계** | | **$0** | — |

> 🔴 **Lambda의 위험은 유휴가 아니라 폭주입니다.** 무한 재귀·무한 재시도가 100만 무료 한도를 순식간에 넘깁니다. 예약된 동시성과 예산 알림이 안전벨트입니다.

### 🧹 리소스 정리 체크리스트

```bash
# 1) S3 트리거부터 제거 (재귀·오호출 방지) 후 버킷 삭제
$ aws s3api put-bucket-notification-configuration --bucket $IN_BUCKET \
    --notification-configuration '{}'
$ aws s3 rb s3://$IN_BUCKET --force

# 2) 실험용 함수 삭제 (writer는 19강 참고용으로 삭제해도 무방 — 19강에서 새로 만듦)
$ for FN in course-hello course-bench course-slow course-s3-handler course-order-writer; do
    aws lambda delete-function --function-name $FN
  done

# 3) 로그 그룹 정리
$ for LG in $(aws logs describe-log-groups --log-group-name-prefix /aws/lambda/course- \
      --query 'logGroups[*].logGroupName' --output text); do
    aws logs delete-log-group --log-group-name $LG
  done

# 4) 확인
$ aws lambda list-functions --query 'Functions[*].FunctionName' --output text
(빈 출력)
```

- [ ] S3 알림 해제 → 버킷 삭제
- [ ] 함수 5개 삭제 · 로그 그룹 삭제
- [ ] ⭐ **`course-lambda-role` 은 유지** — [19](lesson-19.md)·[20강](lesson-20.md)에서 재사용
- [ ] ⭐ `Orders` 테이블 유지
- [ ] 인라인 정책 `write-orders` 유지(19강에서 확장)

---

## ⑤ 자주 하는 실수

### `Unable to import module` — 함수가 시작조차 못 한다

```
{"errorMessage": "Unable to import module 'handler': No module named 'handler'",
 "errorType": "Runtime.ImportModuleError"}
```

| 원인 | 해결 |
|---|---|
| **핸들러 설정과 파일명 불일치** | `handler.handler` = `handler.py` 안의 `handler` 함수 |
| zip 안에 **폴더째** 들어감 | zip 최상위에 .py가 오도록: `cd src && zip ../function.zip .` 방식 주의 |
| 외부 라이브러리 미포함 | `pip install -t . 패키지` 후 함께 zip, 또는 **Layer** 사용 |

### 로그가 CloudWatch에 안 보인다

**원인** — 실행 역할에 `AWSLambdaBasicExecutionRole`(logs:CreateLogGroup 등)이 없습니다. 함수는 정상 실행되는데 로그만 조용히 사라집니다.
**해결** — Step 1의 정책 연결 확인. 그리고 로그는 **약간의 지연**(수 초)이 있으니 `aws logs tail --follow` 로 기다려 봅니다.

### 역할 권한을 붙였는데도 AccessDenied가 난다

**원인 후보**

| 원인 | 확인 |
|---|---|
| IAM 전파 지연 | 10~30초 후 재시도 |
| **리소스 ARN 불일치** | 테이블 이름·리전·계정 ID 오타 |
| 액션 누락 | `PutItem` 만 주고 `Query` 를 호출 |
| **웜 환경의 옛 자격 증명** | 드물게 발생 — 함수 설정을 살짝 바꿔 새 환경 유도 |

**진단 한 줄** — 오류 메시지의 `is not authorized to perform: X on resource: Y` 에서 **X와 Y를 정책과 그대로 대조**하면 끝납니다.

### VPC에 넣었더니 외부 API 호출이 안 된다

**증상** — 함수가 타임아웃까지 멈춰 있다가 죽습니다.
**원인** — VPC 연결 Lambda는 **그 서브넷의 라우팅**을 따릅니다. 프라이빗 서브넷 + NAT 없음 = 인터넷 불가. 심지어 DynamoDB·S3도 (엔드포인트 없이는) 못 갑니다.
**해결** — ① VPC 리소스 접근이 정말 필요한지 재검토(아니면 빼기) ② 필요하면 NAT 또는 **VPC 엔드포인트** 구성 ③ RDS 접근이 목적이면 함수를 RDS와 같은 VPC의 프라이빗 서브넷에 + 보안 그룹 체인.

### 같은 이벤트가 두 번 처리됐다

**원인** — **비동기 호출(S3 등)은 실패 시 자동 재시도(기본 2회)** 하고, 드물게 정상 상황에서도 **중복 전달**이 있을 수 있습니다.
**해결** — 함수를 **멱등**하게 만듭니다. 예: 이벤트의 객체 키+버전을 조건부 쓰기(`attribute_not_exists`)로 기록해 중복이면 건너뜀. [20강](lesson-20.md)에서 큐와 함께 정식으로 다룹니다.

### 콜드 스타트가 너무 잦고 느리다

**진단** — REPORT 줄에 `Init Duration` 이 자주 보이면 콜드 스타트가 잦은 것입니다.
**해결 순서** — ① import·클라이언트 생성을 **핸들러 밖으로**(Step 3처럼) ② 패키지 다이어트 ③ 그래도 SLA가 안 나오면 프로비저닝된 동시성(유료) ④ 근본적으로 상시 트래픽이라면 **Lambda가 맞는지** 재검토([21강](lesson-21.md)).

### 실습 후 함수는 지웠는데 로그 그룹이 남았다

**원인** — 함수를 삭제해도 `/aws/lambda/함수명` 로그 그룹은 **남습니다.** 보존 기간을 설정하지 않았다면 영구 보관·과금됩니다.
**해결** — 정리 체크리스트 3번처럼 로그 그룹을 별도로 삭제하거나, 만들 때마다 보존 7일을 겁니다.

---

## ⑥ 확인 문제

**1.** CPU 위주 작업의 Lambda 메모리를 128MB에서 1024MB로 올렸더니 비용이 거의 그대로면서 8배 빨라졌습니다. 어떻게 가능한가요? 이 논리가 통하지 않는 작업은?

<details>
<summary>답 보기</summary>

**Lambda는 메모리에 비례해 CPU를 배정하고, 과금은 `메모리 × 시간`이기 때문**입니다.

```
 128MB : 0.125GB × 2.4s = 0.300 GB-초
 1024MB: 1.0GB   × 0.3s = 0.300 GB-초   ← 같은 비용, 8배 빠름
```

메모리를 8배 올리면 CPU도 대략 8배(약 1,769MB에서 1 vCPU) → CPU 위주 작업은 시간이 1/8 → 곱이 그대로입니다. 여기에 응답 지연 개선은 덤이 아니라 **공짜**입니다.

**통하지 않는 작업 — I/O 대기 위주**

외부 API 응답이나 DB를 **기다리는 시간**은 CPU가 빨라져도 줄지 않습니다. 대기 2초짜리 함수의 메모리를 8배 올리면 시간은 그대로인데 **비용만 8배**가 됩니다.

**실무 방법** — REPORT의 `Max Memory Used` 와 Duration을 보고 몇 단계 실측해 최적점을 찾습니다(AWS Lambda Power Tuning 도구가 이를 자동화). 판단 기준은 "이 함수는 CPU를 쓰는가, 기다리는가"입니다.
</details>

**2.** Lambda를 VPC에 연결해야 하는 경우와 하지 말아야 하는 경우를 구분하고, 연결했을 때 생기는 제약을 설명하세요.

<details>
<summary>답 보기</summary>

| 상황 | VPC 연결 |
|---|---|
| **RDS · ElastiCache** 등 VPC 안 리소스 접근 | ✅ 필요 (다른 방법이 없음) |
| DynamoDB · S3 · SNS · 외부 API만 호출 | ❌ **불필요** — 기본(비VPC)이 단순하고 빠름 |

**연결 시 생기는 제약**

1. **그 서브넷의 라우팅을 그대로 따릅니다.** 프라이빗 서브넷이면 인터넷 접근에 **NAT Gateway**(월 $42)나 **VPC 엔드포인트**가 필요합니다. "VPC에 넣었더니 외부 API가 타임아웃"의 원인.
2. DynamoDB·S3 같은 AWS 서비스 호출도 경로가 필요해집니다(게이트웨이 엔드포인트 권장 — 무료, [07강](../01-cloud-foundation/lesson-07.md)).
3. ENI 준비로 콜드 스타트가 소폭 늘 수 있습니다(현재는 Hyperplane ENI로 크게 개선됨).
4. 보안 그룹 체인을 함수에도 설계해야 합니다(함수 SG → DB SG 소스 지정).

**한 줄 원칙** — *"VPC 리소스를 만질 때만 VPC에 넣는다. 넣었다면 나가는 길(NAT/엔드포인트)까지 설계한다."*
</details>

**3.** S3 업로드 트리거 Lambda가 처리 결과를 S3에 저장해야 합니다. 어떤 사고가 가능하고, 예방 장치 3가지는 무엇인가요?

<details>
<summary>답 보기</summary>

**무한 재귀 — Lambda 최대의 비용 사고**입니다.

```
 업로드 → 함수 실행 → 같은 버킷에 결과 저장 → 그 저장이 또 트리거 → …
 (몇 분 만에 수십만 호출 + S3 PUT 요금 + 로그 폭증)
```

**예방 장치 3가지**

| # | 장치 | 내용 |
|---|---|---|
| 1 | **입력/출력 분리** ⭐ | 출력은 **다른 버킷**에. 같은 버킷을 써야 한다면 트리거에 `prefix=in/` 필터를 걸고 출력은 `out/` 에 — 단, 필터 실수 하나로 뚫리므로 버킷 분리가 정석 |
| 2 | **예약된 동시성 상한** | `put-function-concurrency 2` — 사고가 나도 폭주 속도를 제한 |
| 3 | **예산 알림 + 이상 탐지** | [02강](../01-cloud-foundation/lesson-02.md)의 Budgets — 마지막 방어선 |

AWS가 일부 재귀 패턴을 자동 감지해 중단시키지만, **설계(1번)로 막는 것이 원칙**이고 2·3번은 그것이 실패했을 때의 완충입니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 서버리스 | 유휴 비용 $0 · 자동 확장 · 요청/시간 과금. 대가는 콜드 스타트·15분 제한 |
| 핸들러 | `파일.함수`. event 구조는 **트리거마다 다름** |
| 실행 역할 | 함수마다 최소 권한. 로그 권한(`BasicExecutionRole`)은 기본 |
| **메모리=CPU** | CPU 작업은 메모리 상향이 공짜 성능. I/O 대기는 예외 |
| REPORT 로그 | Billed Duration · Max Memory Used · **Init Duration(콜드)** |
| VPC 연결 | VPC 리소스 접근 시에만. 나가는 길(NAT/엔드포인트) 필수 |
| 초기화 위치 | 클라이언트 생성은 **핸들러 밖**(재사용) |
| 🔴 재귀 방지 | 입출력 버킷 분리 + 동시성 상한 + 예산 알림 |
| 로그 그룹 | 함수 삭제 후에도 남음. **보존 7일** 습관 |

**한 장 요약**

```
  트리거(S3/API/큐/스케줄) → handler(event) → 실행 역할 권한으로 AWS 호출
     과금 = 요청 수 + GB×초  /  진단 = out.json errorType → 로그 → REPORT
```

**오늘 반드시 기억할 한 가지**
> **Lambda의 비용 사고는 "켜 둔 것"이 아니라 "폭주한 것"에서 납니다.**
> 입출력을 분리하고, 동시성에 상한을 걸어 두세요.

**과제**
1. **메모리 3단계 비교표** — 128/512/1024MB의 Billed Duration과 GB-초 계산, 그리고 "내 결론" 3줄.
2. **실패 진단 기록 2종** — 타임아웃과 AccessDenied 각각의 `out.json` + 로그 + 원인/해결 한 줄.
3. S3 업로드 → DynamoDB 기록까지의 **전체 흐름 로그**와, 적용한 재귀 방지 장치 2가지 설명.
4. "이 작업은 Lambda가 맞는가?" — 다음 3개를 판정하고 근거를 쓰세요: ① 매일 새벽 10분짜리 집계 배치 ② 초당 500요청 상시 API ③ 영상 1시간 인코딩.
5. 정리 확인 — `list-functions` 빈 출력, 로그 그룹 0개, `Orders` 테이블과 `course-lambda-role` 유지.

---

[← 이전 17강](lesson-17.md) · [목차](README.md) · [다음 → 19강 API Gateway와 서버리스 API](lesson-19.md)
