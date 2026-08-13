# 19강 · API Gateway와 서버리스 API

> **AWS 학습 매뉴얼** · 🟡 대단원 03 · **19강 / 총 32강**
> [← 이전 18강](lesson-18.md) · [목차](README.md) · [다음 → 20강 SQS · SNS · EventBridge](lesson-20.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- HTTP API와 REST API의 차이를 알고 **상황에 맞게 선택**할 수 있다.
- Lambda를 **HTTP 엔드포인트로 노출**해 서버 없는 CRUD API를 완성할 수 있다.
- **CORS**가 왜 브라우저에서만 문제인지 설명하고 올바르게 설정할 수 있다.
- **스로틀링**으로 남용과 비용 폭주를 동시에 방어할 수 있다.
- ALB와 API Gateway 중 무엇을 쓸지 **비용·기능 기준으로 판단**할 수 있다.

---

## ② 왜 필요한가

[18강](lesson-18.md)에서 만든 함수는 이렇게만 호출할 수 있습니다.

```bash
$ aws lambda invoke --function-name course-order-writer ...
```

**AWS 자격 증명이 있어야만** 호출됩니다. 브라우저의 자바스크립트도, 모바일 앱도 이 함수를 부를 수 없습니다.

함수를 세상에 내놓으려면 **HTTP 관문**이 필요합니다. 그런데 관문은 단순한 전달자가 아닙니다. 인터넷에 문을 여는 순간 이 문제들이 한꺼번에 옵니다.

| 문제 | 관문이 하는 일 |
|---|---|
| 아무나 마구 호출하면? | **스로틀링·사용량 계획** |
| 인증은 누가? | **권한 부여자**(IAM/JWT/Lambda) |
| 브라우저 교차 출처 요청은? | **CORS 처리** |
| dev와 prod를 나누려면? | **스테이지** |
| 어떤 요청이 왔는지 기록은? | 액세스 로그 |

[11강](../02-compute-data/lesson-11.md)의 ALB도 관문이었습니다. 그럼 언제 ALB이고 언제 API Gateway일까요? — 오늘 이 질문에 답할 수 있게 됩니다. 이 API가 [20강](lesson-20.md)에서 큐 앞단이 되고, 최종 프로젝트의 비동기 처리 입구가 됩니다.

---

## ③ 개념 설명

### HTTP API vs REST API — 이름이 헷갈리는 두 형제

API Gateway에는 두 세대가 있습니다. 이름과 달리 **둘 다 RESTful API를 만듭니다.**

| | **HTTP API** (v2) ⭐ | REST API (v1) |
|---|---|---|
| 가격(100만 요청) | **약 $1.0** | 약 $3.5 |
| 지연 | 더 낮음 | — |
| JWT 권한 부여자 | ✅ 내장 | Lambda 권한 부여자로 |
| 요청/응답 **변환**(매핑 템플릿) | ❌ | ✅ |
| API 키·사용량 계획 | ❌ | ✅ |
| WAF 직접 연결 · 캐싱 | ❌ | ✅ |
| 언제 | **대부분의 경우 — 이 과정 기본** | 변환·API 키·WAF가 꼭 필요할 때 |

### ALB vs API Gateway — 관문 선택 기준

| 기준 | ALB | API Gateway |
|---|---|---|
| 과금 | **시간당**(월 $16+) + LCU | **요청당**($1/100만) |
| 트래픽 성격 | **상시·대량**일수록 유리 | **간헐적·소량**일수록 유리 |
| 백엔드 | EC2·ECS·IP·Lambda | **Lambda 중심**(HTTP 백엔드도 가능) |
| API 관리 기능(인증·스로틀·스테이지) | 빈약 | **풍부** |
| 손익분기(대략) | 월 수천만 요청 이상이면 ALB가 저렴 | 그 미만이면 API GW가 저렴 |

> **한 줄 기준** — 백엔드가 **서버리스이고 API 관리 기능이 필요**하면 API Gateway, **상시 트래픽의 컨테이너/EC2**면 ALB.

### 구성 요소 — 라우트 · 통합 · 스테이지

```
 https://a1b2c3.execute-api.ap-northeast-2.amazonaws.com/dev/orders?user=kim
        └────────── API ──────────────────────────┘└스테이지┘└─ 라우트 ─┘

 라우트: "GET /orders"  ──▶  통합(integration): Lambda orders-api
 라우트: "POST /orders" ──▶  통합: 같은 함수 (routeKey로 분기)
 $default 라우트        ──▶  안 잡힌 요청 전부
```

| 요소 | 뜻 |
|---|---|
| **라우트(Route)** | `메서드 + 경로` (정확히 일치해야 함) |
| **통합(Integration)** | 라우트가 호출할 대상(Lambda·HTTP·AWS 서비스) |
| **스테이지(Stage)** | 배포 환경 단위. `$default`(경로 없음) 또는 `dev`/`prod` |
| 페이로드 형식 2.0 | HTTP API의 event 구조 — `routeKey` · `rawPath` · `queryStringParameters` |

### CORS — 서버 설정인데 브라우저에서만 문제인 이유

```
 브라우저의 JS (출처: https://myapp.com)
    │  fetch("https://api.example.com/orders")   ← 다른 출처!
    ▼
 브라우저: "먼저 물어보고 올게" → OPTIONS 예비 요청(preflight)
    ▼
 서버 응답에 Access-Control-Allow-Origin: https://myapp.com 이 있으면 → 본 요청 진행
                                        없으면 → 브라우저가 차단 (서버는 멀쩡히 응답했는데!)
```

| 핵심 사실 | 설명 |
|---|---|
| **차단의 주체는 브라우저** | curl·서버 간 호출은 CORS와 무관하게 잘 됩니다 |
| 허용의 주체는 서버 | 응답 헤더로 "이 출처는 허용"을 선언 |
| HTTP API는 설정 한 번 | preflight 응답을 게이트웨이가 대신 처리 |
| `*` 주의 | 자격 증명(쿠키) 포함 요청에는 `*` 를 쓸 수 없음 |

### 스로틀링 — 보안이자 비용 방어

```
 한도: 초당 5요청 (버스트 10)
   요청 1~5   → 200
   요청 6~... → 429 Too Many Requests
```

| 이유 | 설명 |
|---|---|
| 남용 방어 | 봇·실수 루프로부터 백엔드 보호 |
| **비용 방어** 🔴 | 요청당 과금인 서버리스에서 스로틀 없는 공개 API = **한도 없는 신용카드** |
| 연쇄 보호 | Lambda 동시성·DynamoDB 처리량을 지켜 줌 |

### 인증 선택지

| 방식 | 내용 | 언제 |
|---|---|---|
| **IAM 권한 부여** | SigV4 서명 요청만 허용 | 내부 서비스 간 · 오늘 실습 |
| **JWT 권한 부여자** | Cognito·Auth0 등의 토큰 검증 | 일반 사용자 로그인 |
| Lambda 권한 부여자 | 커스텀 로직 | 특수한 인증 체계 |
| 없음 + 스로틀링 | 완전 공개 | 공개 데이터 · 데모만 |

---

## ④ 단계별 실습

> 💰 **예상 비용 $0** — HTTP API 프리 티어(월 100만 요청, 12개월) + Lambda·DynamoDB 무료 한도 안입니다.
> [17강](lesson-17.md)의 `Orders` 테이블, [18강](lesson-18.md)의 `course-lambda-role` 을 재사용합니다.

### Step 1. API용 Lambda 함수 (15분)

한 함수가 `routeKey` 로 GET/POST를 분기합니다.

```bash
$ cat > api.py <<'EOF'
import json, os, datetime
import boto3
from boto3.dynamodb.conditions import Key

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def res(code, body):
    return {"statusCode": code,
            "headers": {"Content-Type": "application/json; charset=utf-8"},
            "body": json.dumps(body, ensure_ascii=False, default=str)}

def handler(event, context):
    route = event.get("routeKey", "")
    qs = event.get("queryStringParameters") or {}

    if route == "GET /orders":
        user = qs.get("user", "kim")
        r = table.query(KeyConditionExpression=Key("userId").eq(user),
                        ScanIndexForward=False, Limit=10)
        return res(200, {"user": user, "count": r["Count"], "items": r["Items"]})

    if route == "POST /orders":
        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return res(400, {"error": "본문이 JSON이 아닙니다"})
        if "user" not in body or "item" not in body:
            return res(400, {"error": "user와 item은 필수입니다"})
        item = {"userId": body["user"],
                "orderDate": datetime.datetime.utcnow().isoformat(timespec="seconds"),
                "item": body["item"],
                "amount": int(body.get("amount", 0)),
                "status": "PENDING"}
        table.put_item(Item=item)
        return res(201, {"saved": item})

    return res(404, {"error": f"알 수 없는 라우트: {route}"})
EOF

$ zip api.zip api.py
$ ROLE_ARN=$(aws iam get-role --role-name course-lambda-role --query 'Role.Arn' --output text)

$ aws lambda create-function --function-name orders-api \
    --runtime python3.12 --handler api.handler \
    --role $ROLE_ARN --zip-file fileb://api.zip \
    --timeout 10 --memory-size 256 \
    --environment 'Variables={TABLE_NAME=Orders}' \
    --tags Project=aws-course,Week=W10
```

**역할에 Query 권한 추가** (18강 정책은 PutItem뿐이었습니다)

```bash
$ ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
$ cat > ddb-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:PutItem", "dynamodb:Query"],
    "Resource": "arn:aws:dynamodb:ap-northeast-2:$ACCOUNT:table/Orders"
  }]
}
EOF
$ aws iam put-role-policy --role-name course-lambda-role \
    --policy-name write-orders --policy-document file://ddb-policy.json
```

### Step 2. HTTP API 만들기 — 라우트·통합·스테이지 (20분)

```bash
$ API_ID=$(aws apigatewayv2 create-api \
    --name orders-api --protocol-type HTTP \
    --query 'ApiId' --output text)
$ echo $API_ID
a1b2c3d4e5

$ FN_ARN=$(aws lambda get-function --function-name orders-api \
    --query 'Configuration.FunctionArn' --output text)

# 통합(integration) — Lambda 프록시, 페이로드 2.0
$ INTEG_ID=$(aws apigatewayv2 create-integration --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri $FN_ARN \
    --payload-format-version 2.0 \
    --query 'IntegrationId' --output text)

# 라우트 2개 → 같은 통합
$ aws apigatewayv2 create-route --api-id $API_ID \
    --route-key 'GET /orders' --target integrations/$INTEG_ID
$ aws apigatewayv2 create-route --api-id $API_ID \
    --route-key 'POST /orders' --target integrations/$INTEG_ID

# 스테이지 — $default, 자동 배포
$ aws apigatewayv2 create-stage --api-id $API_ID \
    --stage-name '$default' --auto-deploy
```

**API Gateway가 함수를 호출할 권한** — 이걸 빠뜨리면 500이 납니다(⑤ 참고).

```bash
$ aws lambda add-permission --function-name orders-api \
    --statement-id apigw-invoke --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:ap-northeast-2:$ACCOUNT:$API_ID/*"
```

**호출해 보기**

```bash
$ API_URL=https://$API_ID.execute-api.ap-northeast-2.amazonaws.com
$ curl -s -X POST $API_URL/orders \
    -H 'Content-Type: application/json' \
    -d '{"user":"web-kim","item":"키보드","amount":45000}' | jq .
{
  "saved": {
    "userId": "web-kim",
    "orderDate": "2026-08-13T14:20:31",
    "item": "키보드",
    "amount": 45000,
    "status": "PENDING"
  }
}

$ curl -s "$API_URL/orders?user=web-kim" | jq '{count, first: .items[0].item}'
{
  "count": 1,
  "first": "키보드"
}
```

> ✅ **브라우저에서도 열리는 진짜 HTTP API**가 됐습니다. 서버는 한 대도 없습니다.

**검증 응답도 확인** — 잘못된 요청에 400이 나오는지.

```bash
$ curl -s -X POST $API_URL/orders -d '{"user":"kim"}' | jq .
{ "error": "user와 item은 필수입니다" }
$ curl -s -o /dev/null -w "%{http_code}\n" -X POST $API_URL/orders -d 'not-json'
400
```

### Step 3. dev 스테이지 분리 (10분)

```bash
$ aws apigatewayv2 create-stage --api-id $API_ID --stage-name dev --auto-deploy \
    --stage-variables env=development

$ curl -s "$API_URL/dev/orders?user=web-kim" | jq .count
1
```

| 스테이지 | URL | 용도 |
|---|---|---|
| `$default` | `/orders` | 운영 |
| `dev` | `/dev/orders` | 개발 — **스로틀·로그를 따로** 설정 가능 |

> 💡 실무에서는 스테이지 변수(`env`)를 통합 대상에 끼워 **dev 스테이지 → dev용 Lambda 별칭/테이블**로 분리합니다. 오늘은 구조만 확인합니다.

### Step 4. CORS — 브라우저의 벽 넘기 (15분)

**① 설정 전** — preflight가 거부됩니다.

```bash
$ curl -s -i -X OPTIONS $API_URL/orders \
    -H "Origin: https://myapp.example" \
    -H "Access-Control-Request-Method: POST" | head -3
HTTP/2 404
```

**② CORS 설정**

```bash
$ aws apigatewayv2 update-api --api-id $API_ID \
    --cors-configuration \
      AllowOrigins="https://myapp.example",AllowMethods="GET,POST",AllowHeaders="content-type",MaxAge=3600
```

**③ 설정 후** — 게이트웨이가 preflight를 대신 응답합니다.

```bash
$ curl -s -i -X OPTIONS $API_URL/orders \
    -H "Origin: https://myapp.example" \
    -H "Access-Control-Request-Method: POST" | grep -iE "^(HTTP|access-control)"
HTTP/2 204
access-control-allow-origin: https://myapp.example
access-control-allow-methods: GET,POST
access-control-allow-headers: content-type
access-control-max-age: 3600
```

```bash
# 허용 안 된 출처는?
$ curl -s -i -X OPTIONS $API_URL/orders \
    -H "Origin: https://evil.example" \
    -H "Access-Control-Request-Method: POST" | grep -ic "access-control-allow-origin"
0        ← 허용 헤더가 없다 → 브라우저가 차단
```

> 🔑 **서버(curl)는 언제나 응답합니다.** 차단은 허용 헤더가 없을 때 **브라우저가** 합니다. "포스트맨에선 되는데 브라우저에선 안 돼요"의 정체가 이것입니다.

### Step 5. 스로틀링 — 429 만들어 보기 (15분)

```bash
$ aws apigatewayv2 update-stage --api-id $API_ID --stage-name '$default' \
    --default-route-settings ThrottlingRateLimit=5,ThrottlingBurstLimit=5
```

**40회 연속 호출**

```bash
$ for i in $(seq 1 40); do
    curl -s -o /dev/null -w "%{http_code} " "$API_URL/orders?user=web-kim"
  done; echo
200 200 200 200 200 200 429 429 200 429 429 429 200 429 ... 
```

```bash
$ curl -s "$API_URL/orders?user=web-kim" -w "\n" | head -1     # 한도 안에서는 정상
$ for i in 1 2 3 4 5 6 7 8; do curl -s "$API_URL/orders"; done | grep -c "Too Many"
3
```

> ✅ **한도를 넘는 요청은 백엔드에 도달하기 전에 429로 잘립니다.** Lambda 호출도, DynamoDB 읽기도 일어나지 않습니다 — **비용 방어가 게이트웨이 계층에서** 끝난 것입니다.
> 클라이언트는 429를 받으면 **지수 백오프로 재시도**하는 것이 예의입니다.

### Step 6. IAM 인증 — 아무나 못 쓰게 (10분)

쓰기(POST)만 인증을 요구해 봅니다.

```bash
$ POST_ROUTE=$(aws apigatewayv2 get-routes --api-id $API_ID \
    --query "Items[?RouteKey=='POST /orders'].RouteId" --output text)

$ aws apigatewayv2 update-route --api-id $API_ID --route-id $POST_ROUTE \
    --authorization-type AWS_IAM
```

**서명 없는 요청은 거부됩니다.**

```bash
$ curl -s -X POST $API_URL/orders -d '{"user":"x","item":"y"}' -w "\n[%{http_code}]\n"
{"message":"Forbidden"}
[403]

$ curl -s "$API_URL/orders?user=web-kim" -o /dev/null -w "%{http_code}\n"   # GET은 여전히 공개
200
```

> 📌 인증된 호출은 **SigV4 서명**이 필요합니다 — SDK·`awscurl`·포스트맨의 AWS 서명 기능으로 가능합니다. 사람 사용자용 로그인은 **JWT 권한 부여자 + Cognito**가 정석이며 [최종 프로젝트](../04-final-project/README.md)에서 선택 과제로 다룹니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 이번 강 | 방치 시 월 |
|---|---|---|---|
| HTTP API 요청 | ✅ 월 100만 건(12개월) | ~200건 → $0 | 초과 시 100만 건당 약 $1 |
| Lambda | ✅ 상시 무료 | $0 | — |
| DynamoDB | ✅ 상시 무료 | $0 | — |
| CloudWatch Logs | ✅ 5GB | $0 | 보존 설정 필수 |
| **합계** | | **$0** | — |

> 🔴 **API 자체는 무료여도, 인증·스로틀 없이 공개된 API는 "남이 쓰는 내 지갑"입니다.** 스로틀링이 없는 공개 API를 만들지 않는 것이 이 강의 결론입니다.

### 🧹 리소스 정리 체크리스트

```bash
# 1) API 삭제 (라우트·통합·스테이지 함께 삭제됨)
$ aws apigatewayv2 delete-api --api-id $API_ID

# 2) 함수·로그는 20강에서 재사용하므로 오늘은 유지 여부 선택
#    (20강까지 이어서 한다면 orders-api 유지, 아니라면:)
$ aws lambda delete-function --function-name orders-api
$ aws logs delete-log-group --log-group-name /aws/lambda/orders-api

# 3) 확인
$ aws apigatewayv2 get-apis --query 'Items[*].Name' --output text
(빈 출력)
```

- [ ] API Gateway 삭제 (`get-apis` 빈 출력)
- [ ] ⭐ `Orders` 테이블 · `course-lambda-role` 유지 ([20강](lesson-20.md) 사용)
- [ ] 로그 그룹 보존 7일 확인
- [ ] 함수는 20강 진행 여부에 따라 유지/삭제

---

## ⑤ 자주 하는 실수

### `{"message":"Not Found"}` 가 나온다

**원인** — 라우트는 **메서드+경로가 정확히** 일치해야 합니다.

| 요청 | 라우트 | 결과 |
|---|---|---|
| `GET /orders/` (슬래시) | `GET /orders` | 404 |
| `GET /Orders` (대문자) | `GET /orders` | 404 |
| `PUT /orders` | 등록 안 됨 | 404 |

**해결** — `aws apigatewayv2 get-routes` 로 등록된 라우트를 확인하고 정확히 맞춥니다. 유연하게 받으려면 `ANY /orders` 나 경로 변수 `GET /orders/{id}`, 최후에는 `$default` 라우트를 씁니다.

### `{"message":"Internal Server Error"}` — 원인은 둘 중 하나

**① API Gateway가 Lambda를 호출할 권한이 없다** (가장 흔함)

```bash
$ aws lambda get-policy --function-name orders-api --query 'Policy' 2>&1 | head -1
An error occurred (ResourceNotFoundException) ...     ← 리소스 정책이 아예 없다!
```

**해결** — Step 2의 `add-permission` 을 실행합니다. `--source-arn` 의 API ID가 맞는지도 확인합니다.

**② 함수 자체가 죽었다**

```bash
$ aws logs tail /aws/lambda/orders-api --since 5m | grep -A3 ERROR
```

로그에 스택 트레이스가 있으면 함수 문제(대부분 KeyError·권한), 로그에 **호출 기록 자체가 없으면** ①번입니다.

> 🔑 **판별법 한 줄** — "함수 로그에 START가 찍혔는가?" 안 찍혔으면 게이트웨이→함수 사이, 찍혔으면 함수 안의 문제입니다.

### 포스트맨/curl은 되는데 브라우저만 안 된다

```
Access to fetch at 'https://...' from origin 'https://myapp.example'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**원인** — CORS는 **브라우저만** 시행하는 정책입니다. curl은 검사하지 않습니다.
**해결** — Step 4처럼 API의 CORS 설정에 **정확한 출처**(프로토콜 포함, 끝 슬래시 없이)를 등록합니다.

| 실수 | 문제 |
|---|---|
| `AllowOrigins=myapp.example` | 프로토콜 누락 — `https://myapp.example` 이어야 함 |
| `https://myapp.example/` | 끝 슬래시 — 불일치 |
| 프록시 통합에서 함수만 헤더 반환 | HTTP API는 **API 수준 CORS 설정**이 정답 (둘 다 하면 중복 헤더로 오히려 실패) |

### `event["httpMethod"]` 가 없다며 함수가 죽는다

```
KeyError: 'httpMethod'
```

**원인** — 인터넷 예제 코드가 **REST API(페이로드 1.0)** 기준입니다. HTTP API 2.0의 event는 구조가 다릅니다.

| 정보 | 1.0 (REST API) | **2.0 (HTTP API)** |
|---|---|---|
| 메서드+경로 | `httpMethod`, `path` | **`routeKey`** (`"GET /orders"`) |
| 원본 경로 | `path` | `rawPath` |
| 쿼리 문자열 | `queryStringParameters` | 동일 (없으면 `None` — `or {}` 필수) |

**해결** — `routeKey` 기준으로 작성(오늘 코드처럼)하거나 통합 생성 시 `--payload-format-version 1.0` 으로 맞춥니다.

### 스로틀을 걸었는데 429가 안 나온다

**원인 후보**

| 원인 | 해결 |
|---|---|
| 스테이지를 잘못 지정 (`dev` 에 걸고 `$default` 호출) | `update-stage --stage-name '$default'` 확인 |
| 순차 호출이라 초당 한도에 안 걸림 | `&` 병렬 호출 또는 한도를 1로 낮춰 실험 |
| 버스트 허용치 안 | Burst 만큼은 순간 초과 허용 — 정상 |

### 만들자마자 지운 API가 계속 과금될까 불안하다

**사실** — HTTP API는 **요청이 없으면 비용이 없습니다**(시간당 요금 없음). ALB와 다른 점입니다. 다만 **함수의 로그 그룹**은 남으므로 보존 설정/삭제를 확인합니다.

---

## ⑥ 확인 문제

**1.** 새 서비스의 API 관문으로 ALB와 API Gateway 중 무엇을 쓸지, 판단에 필요한 질문 3가지와 각 답이 이끄는 결론을 쓰세요.

<details>
<summary>답 보기</summary>

**질문 ① — 백엔드가 무엇인가?**
- Lambda(서버리스) → **API Gateway** (통합이 자연스럽고 요청당 과금이 어울림)
- 상시 실행되는 ECS/EC2 → **ALB** (대상 그룹·헬스 체크가 본업)

**질문 ② — 트래픽이 상시인가, 간헐적인가?**
- ALB는 **시간당**(월 $16+) — 요청이 0이어도 나갑니다.
- API GW는 **요청당**($1/100만) — 안 쓰면 $0.
- 간헐적/소규모 → API GW, 월 수천만 요청 이상 상시 → ALB가 역전.

**질문 ③ — API 관리 기능(인증·스로틀·스테이지·사용량 계획)이 필요한가?**
- 필요 → API Gateway (내장)
- 불필요(내부 서비스 간 단순 라우팅) → ALB로 충분

**예시 판정**
- 하루 1만 요청의 모바일 백엔드(JWT 로그인) → **API GW + Lambda**
- 초당 500요청 상시 웹 서비스(ECS) → **ALB**
- 혼합이면 둘 다 쓰기도 합니다 — 웹은 ALB, 이벤트성 API는 API GW.
</details>

**2.** "포스트맨에서는 API가 잘 되는데 웹사이트에서 fetch로 부르면 실패해요." 원인을 설명하고, 고치는 위치가 어디인지(클라이언트/서버) 답하세요.

<details>
<summary>답 보기</summary>

**원인 — CORS. 그리고 차단한 주체는 서버가 아니라 브라우저입니다.**

브라우저는 **다른 출처**(도메인·프로토콜·포트가 하나라도 다름)로의 스크립트 요청에 대해:
1. 먼저 `OPTIONS` **예비 요청(preflight)** 을 보내고
2. 응답에 `Access-Control-Allow-Origin`(내 출처 포함)이 없으면 **본 요청 결과를 스크립트에 주지 않습니다.**

포스트맨·curl·서버 간 호출은 이 검사를 하지 않으므로 잘 됩니다. **서버는 두 경우 모두 정상 응답했습니다.**

**고치는 위치 — 서버(API) 쪽 설정입니다.**

```bash
aws apigatewayv2 update-api --api-id $API_ID --cors-configuration \
  AllowOrigins="https://myapp.example",AllowMethods="GET,POST",AllowHeaders="content-type"
```

클라이언트에서 할 수 있는 것은 없습니다(브라우저 보안 정책이므로). 흔한 함정:
- 출처는 **프로토콜 포함, 끝 슬래시 없이** 정확히
- 쿠키를 보내는 요청이면 `AllowOrigins="*"` 불가
- HTTP API에서는 함수가 헤더를 직접 넣는 것보다 **API 수준 CORS 설정**이 정답 (중복되면 오히려 실패)
</details>

**3.** 인증 없는 공개 API에 스로틀링을 반드시 걸어야 하는 이유를 **비용 관점**으로 설명하세요. 429를 받은 클라이언트는 어떻게 동작해야 하나요?

<details>
<summary>답 보기</summary>

**서버리스 API의 모든 계층이 "요청당 과금"이기 때문입니다.**

```
 악성 봇이 초당 1,000회 × 24시간 = 8,640만 요청/일 을 보낸다면:
   API GW  8,640만 × $1/100만       ≈ $86
   Lambda  8,640만 × 실행 비용       ≈ $50+
   DynamoDB 읽기                    ≈ $10+
   ────────────────────────────────────────
   하루 $150 — 내 서비스가 아니라 공격자가 결제 버튼을 누르는 셈
```

스로틀링(예: 초당 5)을 걸면 **한도를 넘는 요청은 게이트웨이에서 429로 잘려** Lambda도 DynamoDB도 호출되지 않습니다. 방어가 가장 싼 계층에서 끝납니다. EC2 시절의 "서버가 죽는" 위험이 서버리스에서는 **"지갑이 죽는"** 위험으로 바뀌었고, 스로틀은 그 상한선입니다. (같은 이유로 [02강](../01-cloud-foundation/lesson-02.md) 예산 알림, [18강](lesson-18.md) 예약 동시성이 이중 안전벨트입니다.)

**429를 받은 클라이언트의 예의 — 지수 백오프 + 지터**

```
 1차 실패 → 1초 뒤 재시도 → 2초 → 4초 → 8초 ... (+ 무작위 편차)
```

즉시 재시도를 반복하면 스스로 429를 더 만드는 악순환이 됩니다. AWS SDK들은 이 로직을 기본 내장하고 있습니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| HTTP API vs REST API | 기본은 **HTTP API**(싸고 빠름). 변환·API 키·WAF 필요 시 REST |
| ALB vs API GW | 상시·컨테이너 → ALB / 서버리스·관리 기능 → API GW |
| 구조 | 라우트(메서드+경로 정확 일치) → 통합 → 스테이지 |
| 페이로드 2.0 | `routeKey` 로 분기. 1.0 예제 코드 주의 |
| Lambda 권한 | `add-permission` 없으면 **500** — 리소스 기반 정책 |
| CORS | **차단은 브라우저, 허용은 서버.** 출처는 프로토콜 포함 정확히 |
| 스로틀링 | 백엔드 도달 전 429 → **비용 방어의 최전선** |
| 인증 | 서비스 간 IAM / 사용자 JWT(Cognito) |

**한 장 요약**

```
  브라우저/앱 ──HTTPS──▶ API Gateway ──▶ Lambda ──▶ DynamoDB
                          ├ CORS (preflight 대응)
                          ├ 스로틀 (초당 N, 429)
                          └ 인증 (IAM/JWT)          서버 0대, 유휴 비용 $0
```

**오늘 반드시 기억할 한 가지**
> **공개 API의 스로틀링은 선택이 아니라 지갑의 잠금장치입니다.**
> 그리고 500이 나면 "함수 로그에 START가 찍혔는가"부터 봅니다.

**과제**
1. **CRUD API 완성 증빙** — POST 201 / GET 200 / 검증 실패 400 세 가지 curl 출력.
2. **CORS 실험 기록** — 설정 전 preflight 실패, 설정 후 허용 헤더, 미허용 출처의 빈 헤더 세 출력과 각 해석 한 줄.
3. **스로틀링 실험** — 40회 호출의 200/429 분포와, "이때 Lambda가 몇 번 호출됐는지"를 로그로 확인한 결과.
4. ALB vs API Gateway **비용 비교** — 월 10만 요청/월 1억 요청 두 시나리오의 대략적 월 비용을 계산하고 어느 쪽을 택할지 결론.
5. 정리 확인 — `get-apis` 빈 출력.

---

[← 이전 18강](lesson-18.md) · [목차](README.md) · [다음 → 20강 SQS · SNS · EventBridge](lesson-20.md)
