# 17강 · DynamoDB와 ElastiCache

> **AWS 학습 매뉴얼** · 🟡 대단원 03 · **17강 / 총 32강**
> [← 이전 16강](../02-compute-data/lesson-16.md) · [목차](README.md) · [다음 → 18강 Lambda](lesson-18.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 데이터 저장소를 **접근 패턴 기준으로** 선택하고 근거를 댈 수 있다.
- DynamoDB 테이블을 **파티션 키·정렬 키부터 설계**하고 `query` 와 `scan` 의 비용 차이를 숫자로 설명할 수 있다.
- **GSI**로 새로운 접근 패턴을 추가하고 **TTL**로 만료 데이터를 자동 정리할 수 있다.
- ElastiCache(Redis)로 **cache-aside 패턴**을 구현하고 응답 시간 개선을 실측할 수 있다.
- "이 데이터에 캐시가 필요한가"를 판단할 수 있다.

---

## ② 왜 필요한가

[15강](../02-compute-data/lesson-15.md)에서 RDS를 배웠습니다. 관계형 DB는 훌륭하지만, 이런 요구 앞에서는 비싸고 느린 선택이 됩니다.

**상황 1 — 세션 저장소**
[10강](../02-compute-data/lesson-10.md)에서 "세션을 인스턴스 밖으로 빼라"고 했습니다. 세션 조회는 **키 하나로 한 건**을 읽는 작업이 초당 수천 번 일어납니다. 조인도 트랜잭션도 필요 없습니다. RDS로 하면 연결 수와 CPU만 낭비합니다.

**상황 2 — 같은 조회가 반복된다**
메인 페이지의 "인기 상품 10개"는 모든 사용자에게 같은 결과입니다. 그런데 사용자마다 DB에 같은 쿼리를 던지면, DB는 **같은 계산을 초당 수백 번** 반복합니다.

**상황 3 — 확장의 한계**
RDS의 확장은 결국 **더 큰 인스턴스**(수직)이거나 읽기 복제본 추가입니다. 쓰기 확장에는 한계가 있습니다. DynamoDB는 파티션을 늘려 **수평으로** 확장합니다.

그래서 저장소는 하나가 아니라 **역할별로 나눠** 씁니다.

```
 복잡한 질의·트랜잭션  →  RDS          (15강)
 키 조회·대규모 확장    →  DynamoDB     (오늘)
 반복 조회·세션        →  ElastiCache   (오늘)
 파일 원본             →  S3           (13강)
```

이 선택 기준이 [최종 프로젝트](../04-final-project/README.md)의 **구성 요소 결정표**에서 그대로 평가됩니다.

---

## ③ 개념 설명

### 데이터 저장소 선택 기준표 ⭐

| 요구 | 선택 | 이유 |
|---|---|---|
| 조인 · 트랜잭션 · 집계 · 유연한 질의 | **RDS / Aurora** | SQL과 관계 모델 |
| 키로 단건 조회 · 초저지연 · 무한 확장 | **DynamoDB** | 파티션 기반 수평 확장 |
| 반복 조회 결과 재사용 · 세션 · 순위표 | **ElastiCache** | 메모리 접근(밀리초 이하) |
| 대용량 파일 · 로그 원본 | **S3** | 저비용 객체 저장 |

> 한 서비스가 **네 가지를 함께** 쓰는 것이 보통입니다. "무엇으로 통일할까"가 아니라 "이 데이터는 어디에"가 올바른 질문입니다.

### DynamoDB의 구조

```
 테이블: Orders
 ┌──────────────────────────────────────────────────┐
 │ 파티션 키(userId)  정렬 키(orderDate)   그 외 속성  │
 │ ─────────────────────────────────────────────────│
 │ kim               2026-08-01          amount=15000│ ┐
 │ kim               2026-08-05          amount=8000 │ ├ 같은 파티션에 정렬되어 저장
 │ kim               2026-08-11          amount=23000│ ┘
 │ lee               2026-08-02          ...         │ ← 다른 파티션
 └──────────────────────────────────────────────────┘
      파티션 키를 해시 → 어느 물리 파티션에 둘지 결정
```

| 개념 | 뜻 |
|---|---|
| **파티션 키** | 해시되어 **저장 위치를 결정**. 조회의 출발점 |
| **정렬 키** | 같은 파티션 안에서의 **정렬 순서**. 범위 조회 가능 |
| 항목(Item) | 행에 해당. **스키마 없음** — 항목마다 속성이 달라도 됨 |
| 크기 제한 | 항목당 **최대 400KB** (큰 데이터는 S3에 두고 키만 저장) |

### 설계 순서가 관계형과 반대다 ⭐

| | 관계형(RDS) | DynamoDB |
|---|---|---|
| 1단계 | 데이터를 정규화해 테이블 설계 | **접근 패턴을 먼저 나열** |
| 2단계 | 필요한 질의를 SQL로 작성 | 패턴마다 **키·인덱스를 설계** |
| 유연성 | 나중에 어떤 질의든 가능 | **설계에 없는 패턴은 비효율**(scan) |

**오늘 테이블의 접근 패턴 3개**

| # | 패턴 | 키 설계 |
|---|---|---|
| 1 | 특정 사용자의 주문 목록 (최신순) | PK `userId` + SK `orderDate` |
| 2 | 특정 사용자의 특정 날짜 주문 | PK + SK 정확 일치 |
| 3 | **상태(status)별** 주문 목록 | 기본 키로 불가 → **GSI** |

### query vs scan — 비용이 갈리는 지점

| | `query` | `scan` |
|---|---|---|
| 동작 | 파티션 키로 **직행** | **테이블 전체**를 읽음 |
| 읽는 양 | 조건에 맞는 항목만 | 전부 (필터는 **읽은 뒤에** 거름) |
| 비용 | 결과 크기에 비례 | **테이블 크기에 비례** 🔴 |

```
 1GB 테이블에서 kim의 주문 10건(총 40KB)을 찾을 때
   query : 40KB ÷ 4KB(1RCU) = 최종 일관성 기준 약 5 RCU
   scan  : 1GB ÷ 4KB ÷ 2   = 약 131,000 RCU   ← 26,000배
```

> 🔴 **`FilterExpression` 은 비용을 줄여 주지 않습니다.** 읽기는 다 하고 결과만 걸러 냅니다. 실습에서 `ScannedCount` 와 `Count` 의 차이로 확인합니다.

### 용량 모드

| 모드 | 과금 | 언제 |
|---|---|---|
| **온디맨드** | 요청당 (쓰기 100만 건 ~$0.7, 읽기 ~$0.14 수준) | **트래픽 예측 불가.** 실습 기본 |
| 프로비저닝 | 예약한 RCU/WCU 시간당 | 트래픽이 일정 · **25 RCU/WCU까지 상시 무료** |

> 💡 저장 공간은 모드와 무관하게 **25GB까지 상시 무료**입니다. 실습 테이블은 지우지 않고 [20강](lesson-20.md)까지 씁니다.

### 핫 파티션 — 대표적 설계 실패

```
 ❌ PK = 주문 날짜 ("2026-08-13")
    → 오늘 주문이 전부 한 파티션에 몰림 → 스로틀링

 ✅ PK = userId (자연스럽게 분산)
 ✅ PK = 날짜 + 무작위 접미사 ("2026-08-13#7") — 샤딩 기법
```

**파티션 키는 값이 고르게 분산되는 속성**이어야 합니다. 날짜·상태값·고정 상수는 최악의 선택입니다.

### GSI(글로벌 보조 인덱스)와 TTL

| 기능 | 뜻 | 주의 |
|---|---|---|
| **GSI** | **다른 키 조합**으로 조회하는 인덱스(사실상 자동 복제 테이블) | 쓰기 비용 2배 · **최종 일관성**(약간의 지연) |
| **TTL** | 지정 속성(epoch 초)이 지나면 **무료로 자동 삭제** | 삭제는 보통 만료 후 **수 시간~48시간 내** — 즉시가 아님 |

### 캐시 전략 — cache-aside

```
 앱 ── ① GET order:kim:0801 ──▶ Redis
        ② 없음(miss)
 앱 ── ③ DB 조회 ──▶ DynamoDB/RDS
 앱 ── ④ SETEX(60초) ──▶ Redis      ← 다음부터는 ①에서 끝
```

| 전략 | 동작 | 특징 |
|---|---|---|
| **cache-aside** ⭐ | 없으면 DB에서 읽어 채움 | 가장 흔함. 필요한 것만 캐시됨 |
| write-through | 쓸 때 캐시도 함께 갱신 | 캐시가 항상 최신. 쓰기 지연 증가 |

**두 가지 함정**

| 함정 | 내용 | 대비 |
|---|---|---|
| **오래된 데이터(stale)** | 원본이 바뀌어도 캐시는 옛날 값 | 쓰기 시 캐시 삭제/갱신 + **TTL** |
| **스탬피드(stampede)** | 인기 키가 만료되는 순간 요청이 DB로 몰림 | TTL에 무작위 편차 · 잠금/선갱신 |

### Redis vs Memcached

| | **Redis** ⭐ | Memcached |
|---|---|---|
| 자료구조 | 문자열·리스트·해시·정렬 집합(순위표) | 문자열만 |
| 영속성·복제·장애 조치 | ✅ | ❌ |
| 언제 | **대부분의 경우** | 단순 캐시를 멀티스레드로 |

---

## ④ 단계별 실습

> 💰 **예상 비용 $0 ~ 0.1** — DynamoDB·저장 공간은 상시 무료 한도 안, Redis는 12개월 프리 티어(cache.t3.micro 750h).
> DynamoDB 실습(Step 1~4)은 **로컬 CLI만으로** 됩니다. VPC·EC2는 Step 5(Redis)에서만 필요합니다.

### Step 1. 테이블 만들기 (10분)

```bash
$ aws dynamodb create-table \
    --table-name Orders \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=orderDate,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=orderDate,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --tags Key=Project,Value=aws-course Key=Week,Value=W09 \
    --query 'TableDescription.[TableName,TableStatus]' --output text
Orders    CREATING

$ aws dynamodb wait table-exists --table-name Orders
```

> 📌 `--attribute-definitions` 에는 **키로 쓰는 속성만** 적습니다. 나머지 속성(amount 등)은 스키마가 없으므로 선언하지 않습니다.

**데이터 입력** — 사용자 3명 × 10건.

```bash
$ for U in kim lee park; do
    for D in 01 02 03 05 08 11 13 17 21 25; do
      aws dynamodb put-item --table-name Orders --item '{
        "userId":   {"S": "'$U'"},
        "orderDate":{"S": "2026-08-'$D'"},
        "item":     {"S": "상품-'$D'"},
        "amount":   {"N": "'$((RANDOM % 30000 + 1000))'"},
        "status":   {"S": "'$([ $((RANDOM % 3)) -eq 0 ] && echo SHIPPED || echo PENDING)'"}
      }'
    done
  done
$ echo "30건 입력 완료"
```

### Step 2. query vs scan — 소비 용량으로 비교 ⭐ (20분)

**① 패턴 1 — kim의 주문 목록 (query)**

```bash
$ aws dynamodb query --table-name Orders \
    --key-condition-expression "userId = :u" \
    --expression-attribute-values '{":u":{"S":"kim"}}' \
    --return-consumed-capacity TOTAL \
    --query '{건수:Count,읽은건수:ScannedCount,소비RCU:ConsumedCapacity.CapacityUnits}'
{
    "건수": 10,
    "읽은건수": 10,
    "소비RCU": 0.5
}
```

**② 범위 조건 — 8월 10일 이후만** (정렬 키의 힘)

```bash
$ aws dynamodb query --table-name Orders \
    --key-condition-expression "userId = :u AND orderDate >= :d" \
    --expression-attribute-values '{":u":{"S":"kim"},":d":{"S":"2026-08-10"}}' \
    --query 'Items[*].orderDate.S' --output text
2026-08-11    2026-08-13    2026-08-17    2026-08-21    2026-08-25
```

**③ 같은 결과를 scan + 필터로**

```bash
$ aws dynamodb scan --table-name Orders \
    --filter-expression "userId = :u" \
    --expression-attribute-values '{":u":{"S":"kim"}}' \
    --return-consumed-capacity TOTAL \
    --query '{건수:Count,읽은건수:ScannedCount,소비RCU:ConsumedCapacity.CapacityUnits}'
{
    "건수": 10,
    "읽은건수": 30,        ← 테이블 전체를 읽었다!
    "소비RCU": 0.5
}
```

> 🔑 **`읽은건수: 30`** — 필터는 30건을 **전부 읽은 뒤** 10건만 돌려줬습니다. 비용은 읽은 양 기준입니다.
> 지금은 테이블이 작아 둘 다 0.5 RCU지만, **1GB 테이블이면 query 5 RCU vs scan 131,000 RCU**입니다. 이 수치 비교표가 과제입니다.

### Step 3. GSI — 상태별 조회 패턴 추가 (20분)

패턴 3("PENDING 주문 전부")은 기본 키로 불가능합니다. **scan을 쓰는 대신 GSI를 만듭니다.**

```bash
$ aws dynamodb update-table --table-name Orders \
    --attribute-definitions \
        AttributeName=status,AttributeType=S \
        AttributeName=orderDate,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "status-index",
        "KeySchema": [
          {"AttributeName":"status","KeyType":"HASH"},
          {"AttributeName":"orderDate","KeyType":"RANGE"}
        ],
        "Projection": {"ProjectionType":"ALL"}
      }
    }]'

# 백필 완료 대기 (몇 분)
$ aws dynamodb describe-table --table-name Orders \
    --query 'Table.GlobalSecondaryIndexes[0].IndexStatus' --output text
ACTIVE
```

**GSI로 query** — `status` 는 **DynamoDB 예약어**라 별칭이 필요합니다.

```bash
$ aws dynamodb query --table-name Orders \
    --index-name status-index \
    --key-condition-expression "#s = :s" \
    --expression-attribute-names '{"#s":"status"}' \
    --expression-attribute-values '{":s":{"S":"PENDING"}}' \
    --query '{건수:Count,예시:Items[0:2].[userId.S,orderDate.S]}'
{
    "건수": 19,
    "예시": [["kim","2026-08-01"],["lee","2026-08-02"]]
}
```

> ✅ **scan 없이** 상태별 조회가 됩니다. "새 접근 패턴 = 새 인덱스"가 DynamoDB의 사고방식입니다.
> ⚠️ GSI는 **최종 일관성**입니다. 방금 쓴 항목이 인덱스에 반영되기까지 짧은 지연이 있을 수 있습니다.

### Step 4. TTL — 만료 데이터 자동 삭제 (10분)

```bash
$ aws dynamodb update-time-to-live --table-name Orders \
    --time-to-live-specification "Enabled=true, AttributeName=expireAt"

# 2분 뒤 만료되는 임시 항목
$ aws dynamodb put-item --table-name Orders --item '{
    "userId":  {"S":"temp"},
    "orderDate":{"S":"2026-08-13"},
    "expireAt": {"N":"'$(date -d "+2 minutes" +%s)'"}
  }'
```

> 📌 **삭제는 즉시가 아닙니다.** 만료 후 보통 몇 시간(최대 48시간) 안에 지워집니다.
> 🔴 따라서 **만료됐지만 아직 안 지워진 항목이 조회에 나올 수 있습니다.** 정확해야 한다면 애플리케이션에서 `expireAt > 현재시각` 필터를 함께 겁니다.

### Step 5. ElastiCache(Redis)와 cache-aside ⭐ (30분)

**① 환경 준비** — VPC 복원 + 퍼블릭 서브넷 EC2 1대(NAT 불필요).

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh
$ SG_CACHE=$(aws ec2 create-security-group --group-name course-sg-cache \
    --description "redis lab" --vpc-id $VPC_ID --query 'GroupId' --output text)
$ aws ec2 authorize-security-group-ingress --group-id $SG_CACHE \
    --protocol tcp --port 6379 --source-group $SG_CACHE

$ AMI_ID=$(aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' --output text)
$ INST=$(aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro \
    --subnet-id $PUB_A --security-group-ids $SG_CACHE \
    --iam-instance-profile Name=EC2-Course-Role --associate-public-ip-address \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-cache-client},{Key=Project,Value=aws-course}]' \
    --query 'Instances[0].InstanceId' --output text)
```

**② Redis 클러스터 생성** (약 5~10분)

```bash
$ aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name course-cache-subnet \
    --cache-subnet-group-description "course" \
    --subnet-ids $PUB_A $PUB_C

$ aws elasticache create-cache-cluster \
    --cache-cluster-id course-redis \
    --engine redis --cache-node-type cache.t3.micro \
    --num-cache-nodes 1 \
    --cache-subnet-group-name course-cache-subnet \
    --security-group-ids $SG_CACHE \
    --tags Key=Project,Value=aws-course

$ aws elasticache wait cache-cluster-available --cache-cluster-id course-redis
$ REDIS_EP=$(aws elasticache describe-cache-clusters --cache-cluster-id course-redis \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text)
$ echo $REDIS_EP
course-redis.abc123.0001.apn2.cache.amazonaws.com
```

**③ 접속과 기본 조작**

```bash
$ aws ssm start-session --target $INST
sh-5.2$ sudo dnf install -y redis6 jq
sh-5.2$ redis6-cli -h course-redis.abc123.0001.apn2.cache.amazonaws.com PING
PONG
sh-5.2$ redis6-cli -h $REDIS_EP --latency
min: 0, max: 2, avg: 0.28 (계속 측정 중... Ctrl+C)
```

> ✅ **평균 0.3ms.** 같은 조건에서 DynamoDB는 한 자릿수 ms, RDS는 수 ms~수십 ms입니다.

**④ cache-aside 구현**

```bash
sh-5.2$ REDIS_EP=course-redis.abc123.0001.apn2.cache.amazonaws.com
sh-5.2$ get_order() {
  KEY="order:$1:$2"
  VAL=$(redis6-cli -h $REDIS_EP GET "$KEY")
  if [ -n "$VAL" ]; then echo "[캐시 적중] $VAL"; return; fi
  VAL=$(aws dynamodb get-item --table-name Orders \
        --key '{"userId":{"S":"'$1'"},"orderDate":{"S":"'$2'"}}' \
        --region ap-northeast-2 --output json | jq -c '.Item')
  redis6-cli -h $REDIS_EP SETEX "$KEY" 60 "$VAL" > /dev/null
  echo "[미스 → DB 조회 후 적재] $VAL"
}

sh-5.2$ time get_order kim 2026-08-01
[미스 → DB 조회 후 적재] {"userId":{"S":"kim"},...,"amount":{"N":"15000"}}
real    0m0.612s

sh-5.2$ time get_order kim 2026-08-01
[캐시 적중] {"userId":{"S":"kim"},...}
real    0m0.024s
```

> ✅ **0.61초 → 0.02초.** (CLI 실행 오버헤드가 포함된 값이라 절대치보다 **비율**이 의미 있습니다. SDK 기준으로는 대략 5~10ms → 0.3ms입니다.)
> 60초 뒤 다시 실행하면 TTL 만료로 다시 미스가 됩니다 — **stale 데이터 방지의 기본 장치**입니다.

**⑤ 순위표 맛보기** — Redis 자료구조의 힘.

```bash
sh-5.2$ redis6-cli -h $REDIS_EP ZADD ranking 15000 kim 23000 lee 8000 park
sh-5.2$ redis6-cli -h $REDIS_EP ZREVRANGE ranking 0 2 WITHSCORES
1) "lee"    2) "23000"
3) "kim"    4) "15000"
5) "park"   6) "8000"
```

> 이런 실시간 순위는 RDS로 하면 매번 `ORDER BY` 정렬입니다. Redis 정렬 집합은 **삽입 시점에 이미 정렬**되어 있습니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| DynamoDB 저장(30건) | ✅ **25GB 상시 무료** | $0 | $0 |
| DynamoDB 요청(온디맨드) | 실습 수백 건 | ~$0 | 대량 scan 반복 시 증가 |
| GSI | 저장·쓰기 2배 계산 | $0 | 인덱스도 저장 과금 |
| **ElastiCache cache.t3.micro** | ✅ 750h(12개월) | $0 (초과 시 약 $0.1) | 🔴 **약 $12** |
| EC2 t3.micro | ✅ 750h 합산 | $0 | 약 $9.4 |
| **합계** | | **$0 ~ 0.1** | 약 $21 |

> 🔴 **이번 주 잔존 위험 1위는 Redis 클러스터**입니다. DynamoDB는 두고 가도 무료지만 Redis는 아닙니다.

### 🧹 리소스 정리 체크리스트

```bash
# 1) 🔴 Redis 클러스터 삭제 (몇 분 소요)
$ aws elasticache delete-cache-cluster --cache-cluster-id course-redis
$ aws elasticache wait cache-cluster-deleted --cache-cluster-id course-redis
$ aws elasticache delete-cache-subnet-group --cache-subnet-group-name course-cache-subnet

# 2) EC2 종료
$ aws ec2 terminate-instances --instance-ids $INST
$ aws ec2 wait instance-terminated --instance-ids $INST

# 3) VPC 정리 (07강 절차)

# 4) 확인
$ aws elasticache describe-cache-clusters --query 'CacheClusters[*].CacheClusterId' --output text
(빈 출력)
```

- [ ] 🔴 **Redis 클러스터 + 서브넷 그룹 삭제**
- [ ] EC2 종료 · VPC 정리
- [ ] ⭐ **`Orders` 테이블은 유지** — [18](lesson-18.md)·[19](lesson-19.md)·[20강](lesson-20.md)에서 재사용 (상시 무료 한도 내)
- [ ] TTL 임시 항목은 자동 삭제되므로 방치해도 무방

---

## ⑤ 자주 하는 실수

### query가 "키 조건이 없다"며 실패한다

```
An error occurred (ValidationException) when calling the Query operation:
Query condition missed key schema element: userId
```

**원인** — `query` 는 **파티션 키 등호 조건이 필수**입니다. "amount가 10000 이상인 주문"처럼 키가 없는 조건은 query로 못 합니다.
**해결** — 그 패턴이 자주 필요하면 **GSI를 설계**합니다. 일회성 분석이라면 scan(비용 인지하고) 또는 S3 내보내기 + Athena.

### 예약어 때문에 표현식이 거부된다

```
An error occurred (ValidationException): Invalid KeyConditionExpression:
Attribute name is a reserved keyword; reserved keyword: status
```

**원인** — `status` `name` `size` `date` `count` 등 **수백 개 예약어**가 있습니다.
**해결** — `--expression-attribute-names '{"#s":"status"}'` 로 별칭을 만들어 `#s = :s` 로 씁니다. (Step 3 참고)

### 필터를 걸었으니 싸졌다고 생각한다

**증상** — `scan --filter-expression` 결과가 10건이라 10건 비용이라 생각합니다.
**원인** — 필터는 **읽기가 끝난 뒤** 적용됩니다. `ScannedCount`(읽은 양)가 청구 기준입니다.
**해결** — `--return-consumed-capacity TOTAL` 을 붙여 실제 소비를 확인하는 습관을 들입니다. 반복되는 패턴이면 GSI로 바꿉니다.

### 날짜를 파티션 키로 설계했다

```
An error occurred (ProvisionedThroughputExceededException) ... 또는 온디맨드에서도 지연 급증
```

**원인** — 오늘 날짜 파티션에 **모든 쓰기가 몰리는 핫 파티션**입니다. 온디맨드도 파티션당 처리량 한계(약 1,000 WCU/3,000 RCU)는 있습니다.
**해결** — 분산되는 속성(userId 등)을 PK로. 날짜 기준 조회가 필요하면 GSI 또는 `날짜#샤드번호` 샤딩.

### 방금 쓴 항목이 GSI 조회에 안 나온다

**원인** — GSI는 **비동기 복제(최종 일관성)** 입니다. 밀리초~수 초 지연이 정상입니다.
**해결** — "쓰고 바로 읽기"가 필요한 경로는 **기본 키로** 읽습니다. GSI는 목록·검색용으로 씁니다.

### TTL이 지났는데 항목이 남아 있다

**원인** — 정상입니다. TTL 삭제는 **백그라운드 작업**으로, 만료 후 최대 48시간까지 걸릴 수 있습니다.
**해결** — 즉시성이 필요하면 조회 시 `FilterExpression "expireAt > :now"` 를 함께 겁니다.
**추가 실수** — `expireAt` 을 **밀리초**로 넣는 것. TTL은 **epoch 초** 기준입니다. 밀리초로 넣으면 서기 5만 년쯤에 만료됩니다.

### Redis에 접속이 안 된다 (타임아웃)

```
Could not connect to Redis at course-redis...:6379: Connection timed out
```

| 확인 | 내용 |
|---|---|
| **보안 그룹** | 6379 인바운드가 클라이언트 SG를 소스로 허용됐나 |
| **같은 VPC인가** | ElastiCache는 **퍼블릭 엔드포인트가 없습니다.** 밖에서는 원래 안 됩니다 |
| 클러스터 상태 | `available` 인지 |

> 📌 **"내 노트북에서 Redis에 접속이 안 돼요"는 정상 동작**입니다. VPC 안의 EC2(또는 SSM 포트 포워딩)로 접근합니다.

---

## ⑥ 확인 문제

**1.** `scan` 을 피해야 하는 이유를 소비 용량 관점에서 설명하고, "상태가 PENDING인 주문 전부"라는 요구를 어떻게 처리해야 하나요?

<details>
<summary>답 보기</summary>

**scan은 결과가 아니라 "테이블 전체 크기"에 비례해 과금**됩니다.

```
 1GB 테이블에서 10건을 찾을 때
   query: 결과 40KB 기준 → 약 5 RCU
   scan : 1GB 전체 읽기  → 약 131,000 RCU (26,000배)
```

`FilterExpression` 을 걸어도 **읽기는 전부 수행**되고 결과만 걸러집니다(`ScannedCount` ≫ `Count`). 게다가 테이블이 커질수록 느려지고, 다른 트래픽의 처리량까지 잠식합니다.

**"PENDING 주문 전부" 처리법 — GSI**

```
 IndexName: status-index
 PK: status, SK: orderDate
 → query --index-name status-index --key-condition "#s = :PENDING"
```

접근 패턴이 새로 생기면 **인덱스를 새로 설계**하는 것이 DynamoDB의 방식입니다. 단, GSI는 쓰기 비용이 늘고 최종 일관성이라는 대가가 있으므로, **정말 반복되는 패턴에만** 만듭니다. 일회성 분석은 S3 내보내기 + Athena가 정답입니다.
</details>

**2.** 주문 테이블의 파티션 키를 `orderDate`(날짜)로 설계하면 어떤 문제가 생기나요? 올바른 설계와 함께 설명하세요.

<details>
<summary>답 보기</summary>

**핫 파티션이 생깁니다.**

DynamoDB는 파티션 키의 해시로 데이터를 물리 파티션에 분산합니다. PK가 날짜면 **오늘 들어오는 모든 주문이 단 하나의 파티션**에 쓰입니다.

**결과**
- 파티션당 처리량 한계(약 1,000 WCU)에 걸려 **스로틀링** — 테이블 전체 용량이 아무리 커도 소용없음
- 온디맨드 모드여도 파티션 한계는 존재
- 어제 파티션들은 놀고 오늘 파티션만 과열 — 확장의 이점이 사라짐

**올바른 설계**

| 접근 패턴 | 설계 |
|---|---|
| 사용자별 주문 조회 | **PK `userId`** + SK `orderDate` (자연 분산) |
| 날짜별 전체 조회가 꼭 필요 | GSI로 빼거나, PK를 `2026-08-13#0`~`#9` 처럼 **샤드 접미사**로 분산 후 조회 시 병합 |

**원칙** — 파티션 키는 ① 값의 종류가 많고 ② 접근이 고르게 분산되는 속성. 날짜·상태값·상수는 실격입니다.
</details>

**3.** 상품 상세 페이지에 cache-aside를 적용했더니, 관리자가 가격을 바꿔도 사용자에게 옛 가격이 보입니다. 원인과 해결책 두 가지는?

<details>
<summary>답 보기</summary>

**원인 — 원본(DB)은 바뀌었지만 캐시에는 옛 값이 TTL이 끝날 때까지 남아 있기 때문**입니다. cache-aside는 읽기 경로만 캐시를 채울 뿐, 쓰기 경로는 캐시를 모릅니다.

**해결책**

| # | 방법 | 내용 |
|---|---|---|
| 1 | **쓰기 시 캐시 무효화** | 가격 변경 트랜잭션에서 `DEL product:123` 을 함께 실행. 다음 조회가 미스가 되어 새 값을 적재 |
| 2 | **짧은 TTL** | `SETEX 60` 처럼 만료를 짧게 → 최대 60초의 불일치만 허용. 무효화 로직이 빠진 경로까지 보호하는 **안전망** |

**실무는 둘 다** 씁니다 — 무효화가 1차, TTL이 2차 방어선.

**보너스 주의점** — 인기 상품의 캐시가 만료되는 순간 수천 요청이 동시에 DB로 몰리는 **스탬피드**가 생길 수 있습니다. TTL에 무작위 편차(50~70초)를 주거나, 만료 전에 백그라운드에서 미리 갱신하는 방법으로 완화합니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 저장소 선택 | 질의 복잡 → RDS / 키 조회·확장 → DynamoDB / 반복 조회 → 캐시 / 파일 → S3 |
| 설계 순서 | **접근 패턴 먼저**, 키는 그다음 (관계형과 반대) |
| 파티션 키 | 고르게 분산되는 속성. **날짜·상태값은 핫 파티션** |
| query vs scan | scan은 **테이블 크기에 비례** 과금. 필터는 비용을 안 줄임 |
| GSI | 새 접근 패턴용 인덱스. 쓰기 2배 · **최종 일관성** |
| TTL | epoch **초** 단위, 삭제는 최대 48시간 지연 |
| cache-aside | miss → DB → SETEX. **쓰기 시 무효화 + TTL** 이중 방어 |
| Redis | 자료구조·영속성·복제. 순위표는 정렬 집합 |

**한 장 요약**

```
  패턴 1·2 → PK userId + SK orderDate (query)
  패턴 3   → GSI status-index          (scan 금지)
  반복 조회 → Redis cache-aside (TTL 60s + 쓰기 무효화)
```

**오늘 반드시 기억할 한 가지**
> **DynamoDB는 "질문을 먼저 정하고 표를 만드는" 데이터베이스입니다.**
> 그리고 scan이 보이면 설계를 의심하세요.

**과제**
1. 15강 RDS에 넣었던 주문 데이터를 DynamoDB로 다시 모델링하세요 — **접근 패턴 3개를 먼저 쓰고**, 그에 맞는 키/GSI 설계를 표로 제출.
2. `query` 와 `scan --filter` 의 `Count`/`ScannedCount`/`ConsumedCapacity` 비교 출력 + **1GB 테이블 가정 시 비용 차이 계산**.
3. cache-aside 실습의 **미스/적중 시간 비교**(각 3회 평균)와, TTL 만료 후 다시 미스가 되는 것을 보이는 출력.
4. "우리 서비스에서 캐시를 붙일 데이터 2개와 붙이면 안 되는 데이터 1개"를 근거와 함께 5줄로.
5. 정리 확인 — ElastiCache 목록 빈 출력, `Orders` 테이블 유지 확인.

---

[← 이전 16강](../02-compute-data/lesson-16.md) · [목차](README.md) · [다음 → 18강 Lambda](lesson-18.md)
