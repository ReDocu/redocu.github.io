# 대단원 03 · 🟡🔴 서버리스 · 컨테이너 · 자동화

> **기간** W09–W12 (4주 · 8강 · 24시간) · **색상** `#c925d1`
> **최종 프로젝트(종합 실습)** 24강 — CloudFormation 스택과 GitHub Actions(OIDC)로 코드 푸시만으로 배포되는 파이프라인 구축
> [← 이전 단원](02-compute-data.md) · [← 전체 로드맵](README.md) · [다음 단원 →](04-final-project.md)
> [진도표](../lessons/03-serverless-automation/README.md)

---

## 단원 개요

### 이 단원을 마치면

- 요구사항을 보고 **EC2 · 컨테이너 · Lambda 중 무엇으로 실행할지** 근거와 함께 선택할 수 있다.
- Lambda + API Gateway + DynamoDB로 **서버 없는 API**를 만들 수 있다.
- 큐와 이벤트로 서비스를 분리해 **한쪽이 죽어도 데이터가 유실되지 않는 구조**를 만들 수 있다.
- 애플리케이션을 컨테이너 이미지로 만들어 **ECR에 올리고 ECS Fargate로 배포**할 수 있다.
- 지금까지 손으로 만든 인프라를 **템플릿으로 재현하고 CI/CD로 자동 배포**할 수 있다.

### 왜 4주(8강)인가

앞 단원까지는 "**만드는 법**"을 배웠고, 이 단원은 "**손을 떼는 법**"을 배웁니다.
17–20강에서 서버를 관리하지 않는 실행 방식(서버리스)을, 21강에서 실행 환경을 통째로 포장하는 방식(컨테이너)을, 22강에서 그것을 지켜보는 방법(관측성)을, 23–24강에서 전부를 코드로 재현하는 방법(IaC·CI/CD)을 익힙니다.
**23강 이후로는 콘솔에서 리소스를 만들지 않습니다.** 최종 프로젝트의 모든 인프라는 코드로 제출되기 때문입니다.

### 주차 구성

| 주차 | 주제 | 강 | 핵심 산출물 |
|---|---|---|---|
| W09 | DynamoDB · ElastiCache · Lambda | 17–18 | 데이터 저장소 선택 기준표 + 첫 Lambda 함수 |
| W10 | API Gateway · SQS · SNS · EventBridge | 19–20 | 서버 없는 CRUD API + 비동기 처리 파이프라인 |
| W11 | 컨테이너(ECR/ECS) · 관측성 | 21–22 | Fargate로 굴러가는 컨테이너 서비스 + 대시보드/알람 |
| W12 | IaC · 🏁 **CI/CD 자동화 배포** | 23–24 | 스택 1개 + 푸시하면 배포되는 파이프라인 |

### 선행 지식

대단원 02 완료 — 특히 **VPC · 보안 그룹 · ALB · RDS**. 12주차 CI/CD를 위해 Git 기본(`add` `commit` `push` `branch`)이 필요합니다.

---

## W09 · DynamoDB · ElastiCache · Lambda

**17–18강** · 6시간 · 예상 비용 **$0.1 ~ 0.2**

> **주차 목표**
> - 관계형 / 키-값 / 캐시 저장소를 **접근 패턴 기준으로 선택**한다.
> - DynamoDB 테이블을 파티션 키 설계부터 만들고 조회 성능 차이를 확인한다.
> - Lambda 함수를 만들어 **서버 없이 코드를 실행**하고 권한·로그·한도를 이해한다.

**이전 주차와의 연결** — 15강 RDS와 같은 데이터를 DynamoDB로 저장해 보며 **왜 어떤 데이터는 관계형이 아니어야 하는지** 체감합니다. 또한 10강에서 배운 "상태를 인스턴스 밖으로"의 저장소가 여기서 완성됩니다.

| 강 | 제목 | 핵심 개념 | 다룰 서비스 |
|---|---|---|---|
| [**17**](../lessons/03-serverless-automation/lesson-17.md) | DynamoDB와 ElastiCache | 파티션 키/정렬 키 · 단일 테이블 설계 개요 · 용량 모드(온디맨드/프로비저닝) · GSI · TTL · 캐시 전략(cache-aside/write-through) · Redis vs Memcached | DynamoDB, ElastiCache(Redis) |
| [**18**](../lessons/03-serverless-automation/lesson-18.md) | Lambda | 이벤트 기반 실행 · 실행 역할 · 메모리/타임아웃/동시성 · 콜드 스타트 · 계층(Layer) · 환경 변수 · VPC 연결 시 고려사항 | Lambda, CloudWatch Logs, IAM |

### 이론 수업 내용

**17강 (60분)**
1. **데이터 저장소 선택 기준표**

| 요구 | 선택 | 이유 |
|---|---|---|
| 복잡한 조인·트랜잭션·집계 | RDS/Aurora | SQL과 관계 모델 |
| 키로 단건 조회, 초저지연, 대규모 확장 | DynamoDB | 파티션 기반 수평 확장 |
| 반복 조회 결과 재사용, 세션 저장 | ElastiCache | 메모리 접근(밀리초 이하) |
| 대용량 파일·로그 원본 | S3 | 저비용 객체 저장 |

2. DynamoDB의 핵심 제약 — **조회 패턴을 먼저 정하고 키를 설계**한다(관계형과 반대 순서). 핫 파티션 문제
3. 용량 모드 선택 — 트래픽 예측 가능하면 프로비저닝(+오토스케일링), 불규칙하면 온디맨드
4. GSI/LSI로 다른 접근 패턴 추가하기, TTL로 만료 데이터 자동 삭제
5. 캐시 전략 — cache-aside(가장 흔함) vs write-through, **캐시 무효화와 스탬피드** 문제
6. Redis vs Memcached — 자료구조·영속성·복제가 필요하면 Redis

**18강 (60분)**
1. 서버리스의 정의 — 서버가 없는 게 아니라 **내가 관리하지 않는 것**. 과금은 요청 수 × 실행 시간 × 메모리
2. Lambda 실행 모델 — 이벤트 소스 → 함수 → 실행 역할의 권한으로 다른 서비스 호출
3. 파라미터가 곧 성능이자 비용 — 메모리를 올리면 CPU도 올라 **오히려 총비용이 줄어드는** 구간이 있다
4. 콜드 스타트의 원인과 완화(프로비저닝된 동시성, 패키지 축소, 언어 선택)
5. **Lambda를 VPC에 넣어야 할 때와 넣지 말아야 할 때** — RDS 접근이 필요하면 VPC 연결(그러면 NAT 또는 엔드포인트 필요)
6. **선택 기준** — 실행 15분 초과·상시 트래픽·특수 런타임이면 컨테이너/EC2, 이벤트성·간헐적·짧은 작업이면 Lambda

### 단계별 실습

| Step | 17강 실습 | 시간 |
|---|---|---|
| 1 | DynamoDB 테이블 생성(`Orders`, 파티션 키 `userId`, 정렬 키 `orderDate`) — 온디맨드 모드 | 15분 |
| 2 | CLI로 항목 입력·조회 — `put-item` / `get-item` / `query` / `scan` 비교, **`scan`이 왜 나쁜지** 소비 용량으로 확인 | 25분 |
| 3 | GSI 추가(`status` 기준 조회) → 새로운 접근 패턴 처리 | 20분 |
| 4 | TTL 속성 설정 → 만료 항목 자동 삭제 확인 | 10분 |
| 5 | ElastiCache(Redis) 생성 → EC2에서 `redis-cli` 접속 → DB 조회 결과 캐싱(cache-aside) 구현 → **응답 시간 비교** | 30분 |

| Step | 18강 실습 | 시간 |
|---|---|---|
| 1 | Lambda 함수 생성(Python) → 콘솔 테스트 이벤트로 실행 → CloudWatch Logs 확인 | 20분 |
| 2 | 실행 역할에 DynamoDB 권한 추가 → 함수에서 **17강 테이블에 항목 쓰기** | 25분 |
| 3 | 환경 변수로 테이블 이름 주입 → 하드코딩 제거 | 10분 |
| 4 | 메모리 128MB / 512MB / 1024MB로 바꿔가며 **실행 시간과 비용 비교표** 작성 | 20분 |
| 5 | 일부러 타임아웃·권한 오류 유발 → 에러 메시지와 로그로 원인 찾기 | 15분 |
| 6 | S3 업로드 트리거 연결 → 파일 올리면 자동 실행되는 것 확인 | 10분 |

### 실습을 통해 완성되는 결과물

- 접근 패턴에 맞게 설계된 **DynamoDB 테이블 + GSI + TTL**
- cache-aside로 응답 시간을 개선한 **ElastiCache 실측 비교표**
- S3 업로드에 반응해 DynamoDB에 기록하는 **Lambda 함수**
- 메모리별 성능/비용 비교표

### 실습 전제 조건

IAM 역할 생성 권한 · VPC 및 EC2 1대(ElastiCache 접속용) · Python 기본 문법(코드는 제공)

### 예상 실습 시간

강당 100분 (총 200분) + 과제 120분

### 예상 비용과 과금 주의 사항

| 리소스 | 프리 티어 | 예상 비용 | 과금 위험 |
|---|---|---|---|
| DynamoDB | ✅ 25GB · 25 WCU/RCU(상시, 프로비저닝 모드) | $0 | **온디맨드 모드는 프리 티어 적용 방식이 다름** — 대량 `scan` 주의 |
| Lambda | ✅ 월 100만 요청 + 40만 GB-초(상시) | $0 | 무한 재귀 호출(예: S3 트리거가 같은 버킷에 쓰기) — **비용 폭탄 대표 사례** |
| CloudWatch Logs | ✅ 5GB 수집 | $0 | 보존 기간 무제한이 기본 — **7일로 설정** |
| ElastiCache cache.t3.micro | ✅ 750시간(12개월) | $0~0.1 | 클러스터 방치 시 월 약 $12 |
| VPC 엔드포인트/NAT(필요 시) | ❌ | $0~0.4 | — |

> 🔴 **재귀 호출 주의** — S3 버킷 업로드 트리거 Lambda가 **같은 버킷에 파일을 쓰면 무한 루프**가 됩니다. 반드시 입력/출력 버킷(또는 접두사)을 분리하고 동시성 제한을 걸어 실습합니다.

### 보안 및 운영상 주의점

- Lambda 실행 역할은 **함수마다 별도**로, 필요한 테이블·버킷만 지정합니다.
- ElastiCache는 퍼블릭 접근이 불가하며 **보안 그룹으로 앱 계층만** 허용합니다. 전송 중 암호화/인증(AUTH) 옵션을 확인합니다.
- CloudWatch 로그 그룹의 **보존 기간을 반드시 설정**합니다(기본은 만료 없음 = 계속 과금).
- Lambda 환경 변수에 비밀 값을 평문으로 넣지 않습니다(KMS 암호화 또는 Secrets Manager).

### 리소스 정리 체크리스트

- [ ] ElastiCache 클러스터 삭제 (가장 비싼 항목)
- [ ] Lambda 함수 삭제 + **트리거 먼저 제거**(재귀 방지)
- [ ] CloudWatch 로그 그룹 삭제 또는 보존 7일 설정
- [ ] DynamoDB 테이블 삭제(프리 티어 내라면 유지 가능 — 20강에서 재사용)
- [ ] 실습용 S3 버킷 정리
- [ ] EC2 인스턴스 종료

### 복습 퀴즈 5문항

<details>
<summary>정답 보기</summary>

1. DynamoDB에서 `scan`을 피해야 하는 이유는? → **테이블 전체를 읽어** 읽기 용량과 시간을 크게 소비한다. 키 또는 인덱스를 이용한 `query`로 설계해야 한다.
2. DynamoDB 설계가 관계형과 반대인 지점은? → 관계형은 정규화 후 질의를 만들지만, DynamoDB는 **접근 패턴을 먼저 정하고 그에 맞게 키/인덱스를 설계**한다.
3. Lambda 메모리를 늘렸더니 비용이 줄었다. 어떻게 가능한가? → 메모리에 비례해 **CPU도 증가**하여 실행 시간이 짧아지고, 과금이 `GB-초`이므로 총액이 줄 수 있다.
4. Lambda를 VPC에 연결했더니 인터넷 접근이 안 된다. 왜? → VPC 안의 Lambda는 **프라이빗 서브넷 규칙을 그대로 따른다.** NAT Gateway 또는 VPC 엔드포인트가 필요하다.
5. 캐시를 도입할 때 가장 조심할 것은? → **무효화(stale 데이터).** cache-aside에서는 쓰기 시 캐시를 갱신/삭제하는 규칙과 TTL을 함께 정해야 한다.
</details>

### 개인 또는 팀 과제

**[개인]** "저장소 선택과 서버리스 첫걸음"
1. 15강 RDS에 넣었던 데이터를 DynamoDB로 모델링 — 접근 패턴 3개를 먼저 쓰고 그에 맞는 키/GSI 설계 제출
2. 같은 조회를 RDS와 DynamoDB로 각각 수행한 **응답 시간 비교**(각 10회 평균)
3. Lambda 메모리 3단계 성능/비용 비교표와 최적값 선택 근거
4. "이 서비스에는 왜 캐시가 필요한가/필요 없는가" 5줄
5. 정리 완료 증빙

### 참고할 AWS 공식 문서 검색 키워드

`DynamoDB core components partition key` · `Best practices for designing and using partition keys` · `DynamoDB global secondary indexes` · `Time to Live DynamoDB` · `Caching strategies ElastiCache lazy loading write-through` · `Lambda execution role` · `Configuring Lambda function memory` · `Configuring a Lambda function to access resources in a VPC`

**주차 체크포인트** — 같은 요구를 RDS와 DynamoDB로 각각 설계하고 무엇을 왜 택할지 설명할 수 있는가. 코드를 서버 없이 실행하고 로그로 디버깅할 수 있는가.

---

## W10 · API Gateway · SQS · SNS · EventBridge

**19–20강** · 6시간 · 예상 비용 **$0 ~ 0.1**

> **주차 목표**
> - API Gateway로 Lambda를 HTTP 엔드포인트로 노출하고 스테이지·인증·CORS를 구성한다.
> - 큐를 사용해 **처리량이 다른 두 시스템을 분리**하고 실패 메시지를 DLQ로 보존한다.
> - SNS 팬아웃과 EventBridge 규칙으로 **이벤트 기반 아키텍처**를 구성한다.

**이전 주차와의 연결** — 18강 Lambda 함수가 이번 주에 **API 뒤(19강)** 와 **큐 뒤(20강)** 에 각각 놓입니다. 12강 ALB와 비교하며 "언제 ALB이고 언제 API Gateway인가"를 정리합니다.

| 강 | 제목 | 핵심 개념 | 다룰 서비스 |
|---|---|---|---|
| [**19**](../lessons/03-serverless-automation/lesson-19.md) | API Gateway와 서버리스 API | REST API vs HTTP API · 리소스/메서드/통합 · 스테이지와 배포 · 권한 부여(IAM/Cognito/Lambda 권한 부여자) · CORS · 사용량 계획·스로틀링 | API Gateway, Lambda, DynamoDB |
| [**20**](../lessons/03-serverless-automation/lesson-20.md) | SQS · SNS · EventBridge | 동기 vs 비동기 · 표준/FIFO 큐 · 가시성 제한 시간 · DLQ · 팬아웃(SNS→SQS) · 이벤트 버스와 규칙 · 스케줄 · 멱등성 | SQS, SNS, EventBridge, Lambda |

### 이론 수업 내용

**19강 (60분)**
1. API Gateway가 하는 일 — 라우팅 · 인증 · 스로틀링 · 변환 · 캐싱
2. **HTTP API vs REST API 선택 기준** — 대부분은 더 싸고 빠른 HTTP API. 요청/응답 변환, API 키, WAF 통합 등이 필요하면 REST API
3. **ALB vs API Gateway** — 상시 트래픽·컨테이너 백엔드는 ALB, 이벤트성·서버리스·API 관리 기능이 필요하면 API Gateway
4. 스테이지(dev/prod)와 배포의 관계, 스테이지 변수
5. CORS가 브라우저에서만 문제되는 이유와 프리플라이트(OPTIONS) 처리
6. 스로틀링·사용량 계획으로 **비용과 남용을 동시에 방어**

**20강 (60분)**
1. 동기 호출의 문제 — 뒤쪽이 느리면 앞쪽이 죽는다. **큐를 넣으면 생기는 4가지 이점**(버퍼링·재시도·분리·확장)
2. SQS 핵심 — 가시성 제한 시간, 롱 폴링, 표준(순서 미보장·중복 가능) vs FIFO(순서 보장·중복 제거)
3. **DLQ**(배달 못한 편지 큐) — 실패 메시지를 잃지 않고 분석하는 방법, `maxReceiveCount`
4. SNS 팬아웃 — 하나의 이벤트를 여러 구독자에게. **SNS → SQS 조합**이 표준 패턴인 이유
5. EventBridge — AWS 서비스 이벤트/커스텀 이벤트를 규칙으로 라우팅, **cron 스케줄**로 배치 실행
6. **멱등성** — 같은 메시지를 두 번 처리해도 결과가 같도록 설계(중복 배달은 정상 동작)

### 단계별 실습

| Step | 19강 실습 | 시간 |
|---|---|---|
| 1 | HTTP API 생성 → Lambda 통합 → `GET /orders`, `POST /orders` 라우트 구성 | 25분 |
| 2 | DynamoDB 연동으로 **CRUD API 완성** → `curl`로 호출 검증 | 25분 |
| 3 | 스테이지 `dev`/`prod` 분리 배포 + 스테이지 변수로 테이블 분리 | 15분 |
| 4 | CORS 설정 → 간단한 HTML 페이지(S3)에서 fetch 호출 성공 확인 | 15분 |
| 5 | 스로틀링(초당 5요청) 설정 → 부하 발생 시 429 응답 확인 | 10분 |
| 6 | IAM 권한 부여자 적용 → 인증 없는 호출 403 확인 | 10분 |

| Step | 20강 실습 | 시간 |
|---|---|---|
| 1 | SQS 표준 큐 + **DLQ** 생성(최대 수신 3회) | 15분 |
| 2 | 생산자 Lambda(메시지 발행) + 소비자 Lambda(큐 트리거) 구성 → 흐름 확인 | 25분 |
| 3 | 소비자에서 **일부러 예외 발생** → 3회 재시도 후 DLQ 적재 확인 → 원인 분석 후 재처리 | 25분 |
| 4 | SNS 주제 생성 → SQS 2개 + 이메일 구독 연결 → **팬아웃 확인** | 20분 |
| 5 | EventBridge 스케줄 규칙(5분마다) → Lambda 실행 → 로그로 확인 후 **규칙 비활성화** | 15분 |

### 실습을 통해 완성되는 결과물

- 인증·CORS·스로틀링이 구성된 **서버리스 CRUD API** (`https://xxxx.execute-api.../orders`)
- 실패 메시지를 잃지 않는 **큐 + DLQ 파이프라인**
- 하나의 이벤트가 여러 시스템으로 퍼지는 **SNS 팬아웃 구성**
- 5분마다 실행되는 **EventBridge 스케줄 작업**

### 실습 전제 조건

18강 Lambda 실습 완료 · DynamoDB 테이블 존재 · 메일 수신 가능(SNS 구독 확인)

### 예상 실습 시간

강당 100분 (총 200분) + 과제 120분

### 예상 비용과 과금 주의 사항

| 리소스 | 프리 티어 | 예상 비용 | 과금 위험 |
|---|---|---|---|
| API Gateway HTTP API | ✅ 월 100만 요청(12개월) | $0 | 스로틀링 없이 공개 시 남용 위험 |
| SQS | ✅ 월 100만 요청(상시) | $0 | 롱 폴링 미사용 시 빈 수신 요청 폭증 |
| SNS | ✅ 월 100만 게시(상시) | $0 | **SMS 구독은 유료** — 실습은 이메일만 |
| EventBridge | ✅ AWS 이벤트 무료 | $0 | 커스텀 이벤트 100만 건당 $1 |
| Lambda | ✅ | $0 | **스케줄 규칙을 끄지 않으면 계속 호출** |

> ⚠️ **EventBridge 스케줄 규칙은 실습 후 반드시 비활성화**합니다. 5분마다 도는 규칙 하나가 한 달이면 약 8,600회 호출입니다(무료 범위지만 로그·연쇄 비용 발생).

### 보안 및 운영상 주의점

- API를 **인증 없이 공개하지 않습니다.** 최소한 API 키 + 사용량 계획, 실무는 IAM/Cognito/JWT 권한 부여자.
- 스로틀링은 보안 조치이기도 합니다(비용 방어).
- SQS 소비자는 **처리 후 삭제**(delete)해야 합니다. 가시성 제한 시간보다 처리 시간이 길면 중복 처리됩니다.
- 큐·주제 접근 정책을 계정 외부에 열지 않습니다.
- 이벤트에 개인정보를 그대로 담지 않습니다(로그에 그대로 남습니다).

### 리소스 정리 체크리스트

- [ ] **EventBridge 규칙 비활성화 후 삭제**
- [ ] Lambda 트리거(SQS/S3/API) 제거 후 함수 삭제
- [ ] SQS 큐 + DLQ 삭제
- [ ] SNS 주제·구독 삭제(이메일 구독 해제)
- [ ] API Gateway API 삭제
- [ ] CloudWatch 로그 그룹 정리(보존 7일)
- [ ] DynamoDB 테이블 정리(다음 주 사용 예정이면 유지)

### 복습 퀴즈 5문항

<details>
<summary>정답 보기</summary>

1. 주문 API의 응답이 결제 처리 때문에 느리다. 큐를 넣으면 무엇이 좋아지나? → 주문 접수와 결제를 **분리(비동기)** 해 응답이 빨라지고, 결제 시스템 장애 시에도 **메시지가 큐에 보존**된다.
2. SQS 표준 큐는 메시지가 중복 전달될 수 있다. 애플리케이션은 어떻게 대비하나? → **멱등성** 있게 처리한다(처리 ID 기록 후 중복 무시). 순서·정확히 한 번이 필수면 FIFO 큐.
3. DLQ는 언제 쓰나? → 소비자가 지정 횟수만큼 처리에 실패한 메시지를 **버리지 않고 보관**해 원인 분석·재처리할 때.
4. ALB 대신 API Gateway를 택할 상황은? → 백엔드가 **Lambda(서버리스)** 이고 인증·스로틀링·스테이지 관리 등 **API 관리 기능**이 필요할 때. 상시 트래픽의 컨테이너/EC2 백엔드라면 ALB가 대체로 저렴하다.
5. SNS와 SQS의 차이를 한 문장으로? → SNS는 **푸시(발행/구독, 1:N 전달)**, SQS는 **풀(큐에 쌓아 두고 소비자가 가져감)**. 둘을 합친 SNS→SQS 팬아웃이 표준 패턴.
</details>

### 개인 또는 팀 과제

**[개인]** "비동기 주문 처리 파이프라인"
1. 아키텍처 다이어그램 — `API Gateway → Lambda(접수) → SQS → Lambda(처리) → DynamoDB`, 실패 시 DLQ
2. **실패 시나리오 실험 기록** — 처리 Lambda를 고장 낸 상태에서 요청 10건 전송 → 데이터 유실 0건임을 DLQ로 증명 → 복구 후 재처리
3. 동기 방식과 비동기 방식의 응답 시간 비교
4. 멱등성을 어떻게 보장했는지 설명 5줄
5. 정리 완료 증빙(EventBridge 규칙 0개 포함)

### 참고할 AWS 공식 문서 검색 키워드

`Choosing between HTTP APIs and REST APIs` · `Controlling access to HTTP APIs with JWT authorizers` · `Throttle API requests usage plans` · `Amazon SQS visibility timeout` · `Amazon SQS dead-letter queues` · `Fanout to Amazon SQS queues SNS` · `Amazon EventBridge rules schedule expressions`

**주차 체크포인트** — 처리 서버를 고장 낸 상태에서 요청을 보내도 데이터가 하나도 사라지지 않는 구조를 만들 수 있는가.

---

## W11 · 컨테이너와 관측성

**21–22강** · 6시간 · 예상 비용 **$0.3 ~ 0.5**

> **주차 목표**
> - 애플리케이션을 컨테이너 이미지로 만들어 ECR에 올리고 **ECS Fargate로 실행**한다.
> - EC2 · Fargate · Lambda의 **선택 기준**을 근거와 함께 설명한다.
> - CloudWatch 지표·로그·알람과 CloudTrail로 **문제를 탐지하고 원인을 추적**한다.

**이전 주차와의 연결** — 16강에서 EC2로 돌리던 앱을 **같은 ALB 뒤에서 컨테이너로 교체**합니다. 22강 관측성은 이후 모든 주차와 최종 프로젝트의 필수 요건이 됩니다.

| 강 | 제목 | 핵심 개념 | 다룰 서비스 |
|---|---|---|---|
| [**21**](../lessons/03-serverless-automation/lesson-21.md) | 컨테이너 · ECR · ECS Fargate | 이미지와 컨테이너 · Dockerfile · 레지스트리 · 태스크 정의 · 서비스와 원하는 개수 · 태스크 역할 vs 실행 역할 · Fargate vs EC2 시작 유형 | Docker, ECR, ECS, Fargate, ALB |
| [**22**](../lessons/03-serverless-automation/lesson-22.md) | CloudWatch · CloudTrail · Systems Manager | 지표/네임스페이스/차원 · 사용자 지정 지표 · Logs Insights 쿼리 · 알람과 복합 알람 · 대시보드 · CloudTrail 이벤트 · SSM 파라미터 스토어/Run Command/패치 | CloudWatch, CloudTrail, Systems Manager |

### 이론 수업 내용

**21강 (60분)**
1. 컨테이너가 해결하는 문제 — "내 PC에선 되는데요"의 종말. 가상 머신과의 차이(커널 공유)
2. 이미지 레이어와 캐시, `Dockerfile` 작성 원칙(작게, 재현 가능하게, 루트로 실행하지 않기)
3. ECS 구성 요소 — 클러스터 / 태스크 정의(컨테이너 스펙) / 태스크(실행 단위) / 서비스(원하는 개수 유지 + ALB 연결)
4. **태스크 역할 vs 태스크 실행 역할** — 앱이 쓰는 권한 vs ECS가 이미지를 당기고 로그를 쓰는 권한. 시험·실무 단골 혼동 지점
5. **실행 방식 선택 기준표**

| 방식 | 적합 | 부적합 | 비용 감각 |
|---|---|---|---|
| Lambda | 이벤트성·짧은 작업 | 15분 초과·상시 고부하 | 요청 단위, 유휴 시 $0 |
| ECS Fargate | 컨테이너·서버 관리 싫음 | 극단적 비용 최적화 | vCPU·메모리 시간당 |
| ECS/EKS on EC2 | 대규모·GPU·세밀 튜닝 | 소규모 팀 | 인스턴스 시간당 |
| EC2 직접 | 레거시·특수 요구 | 확장 자동화 부담 | 인스턴스 시간당 |

6. ECR — 프라이빗 레지스트리, 수명 주기 정책으로 오래된 이미지 자동 삭제(비용)

**22강 (60분)**
1. 관측성 3요소 — 지표(무엇이 얼마나) · 로그(무슨 일이) · 추적(어디서 느린가, X-Ray 소개)
2. CloudWatch 지표 구조와 **기본 지표에 없는 것**(메모리 사용률·디스크 사용률 → CloudWatch Agent 필요)
3. Logs Insights 쿼리로 에러 급증 구간 찾기
4. 알람 설계 — 임계값 · 평가 기간 · 결측 데이터 처리 · SNS 알림 연결. **알람 피로**를 줄이는 법
5. CloudTrail — "누가 언제 무엇을 했나". 관리 이벤트 vs 데이터 이벤트, 추적 생성과 보존
6. Systems Manager — 파라미터 스토어(설정값 관리, **SecureString**), Run Command(SSH 없이 명령 실행), 패치 관리자, 인벤토리

### 단계별 실습

| Step | 21강 실습 | 시간 |
|---|---|---|
| 1 | 간단한 웹 앱 `Dockerfile` 작성 → 로컬 빌드 → 실행 확인 | 20분 |
| 2 | **ECR 리포지토리 생성** → 로그인 → 이미지 푸시 → 태그 관리 | 20분 |
| 3 | ECS 클러스터(Fargate) + **태스크 정의** 작성(CPU 0.25 vCPU, 메모리 0.5GB, 로그 드라이버 awslogs) | 20분 |
| 4 | **서비스 생성** — 원하는 개수 2, 프라이빗 서브넷, ALB 대상 그룹 연결(IP 유형) | 25분 |
| 5 | 태스크 1개 강제 중지 → **서비스가 자동 복구**하는 것 확인 | 10분 |
| 6 | 새 이미지 푸시 → 서비스 업데이트로 **롤링 배포** 확인 → ECR 수명 주기 정책 설정 | 15분 |

| Step | 22강 실습 | 시간 |
|---|---|---|
| 1 | CloudWatch 대시보드 생성 — ALB 요청 수·5xx, ECS CPU/메모리, RDS 연결 수 위젯 배치 | 20분 |
| 2 | CloudWatch Agent 설치(EC2) → **메모리·디스크 지표 수집** 확인 | 15분 |
| 3 | Logs Insights로 5xx 발생 시각·경로 상위 5개 추출 쿼리 작성 | 20분 |
| 4 | **알람 생성** — 5xx 5분간 5건 초과 시 SNS 이메일. 일부러 오류 발생시켜 알림 수신 확인 | 20분 |
| 5 | CloudTrail 이벤트 기록에서 "누가 이 보안 그룹을 바꿨나" 추적 실습 | 15분 |
| 6 | SSM 파라미터 스토어에 설정값 저장(SecureString) → 애플리케이션에서 조회 → Run Command로 원격 명령 실행 | 20분 |

### 실습을 통해 완성되는 결과물

- ECR에 저장된 컨테이너 이미지와 **ALB 뒤에서 2개 태스크로 돌아가는 ECS Fargate 서비스**
- 지표 6종이 배치된 **CloudWatch 대시보드**
- 오류 급증 시 메일이 오는 **알람**
- 설정값을 코드에서 분리한 **SSM 파라미터 스토어** 구성

### 실습 전제 조건

Docker Desktop 설치 · ECR 푸시 권한 · VPC/ALB 존재 · 프라이빗 서브넷에서 ECR 접근 경로(NAT 또는 VPC 엔드포인트) 확보

### 예상 실습 시간

강당 100분 (총 200분) + 과제 150분

### 예상 비용과 과금 주의 사항

| 리소스 | 프리 티어 | 예상 비용(6h) | 과금 위험 |
|---|---|---|---|
| **ECS Fargate** | ❌ **없음** | 0.25vCPU·0.5GB × 2태스크 ≈ $0.15 | 태스크 방치 시 월 약 $18/2태스크 |
| ECR | ✅ 500MB(12개월) | $0~0.05 | 이미지 누적 — 수명 주기 정책 필수 |
| ALB | ❌ | $0.14 | 월 $17 |
| CloudWatch 사용자 지정 지표 | ✅ 10개 · 알람 10개 | $0 | 지표당 월 $0.30, 상세 모니터링 주의 |
| CloudWatch Logs | ✅ 5GB | $0~0.1 | **보존 무제한 기본값** |
| CloudTrail | ✅ 관리 이벤트 90일 | $0 | **데이터 이벤트(S3/Lambda)는 유료** — 실습에서 켜지 않기 |
| SSM 파라미터(표준) | ✅ | $0 | 고급 파라미터는 개당 월 $0.05 |

### 보안 및 운영상 주의점

- 컨테이너를 **루트로 실행하지 않습니다**(`USER` 지시어). 이미지에 자격 증명을 굽지 않습니다.
- ECR 이미지 스캔(기본 스캔)을 켜서 취약점을 확인합니다.
- 태스크 역할은 **애플리케이션 권한만**, 실행 역할은 **ECR/로그 권한만** 부여합니다.
- CloudTrail은 **모든 리전**에 대해 켜는 것이 원칙(실습에선 비용 확인 후 결정).
- 알람 없는 모니터링은 의미가 적습니다. 대시보드보다 **알람이 먼저**입니다.

### 리소스 정리 체크리스트

- [ ] ECS **서비스 원하는 개수 0 → 서비스 삭제 → 클러스터 삭제** (순서 중요)
- [ ] 실행 중인 태스크 0개 확인 (`aws ecs list-tasks`)
- [ ] ECR 이미지 삭제 또는 수명 주기 정책 적용 후 리포지토리 삭제
- [ ] ALB · 대상 그룹 삭제
- [ ] CloudWatch 알람·대시보드 삭제, 로그 그룹 보존 7일 설정
- [ ] CloudTrail 추가 추적(Trail) 삭제 및 S3 버킷 정리
- [ ] NAT/VPC 엔드포인트 삭제

### 복습 퀴즈 5문항

<details>
<summary>정답 보기</summary>

1. 태스크 역할과 태스크 실행 역할의 차이는? → **태스크 역할**은 컨테이너 안의 애플리케이션이 AWS 서비스를 호출할 때 쓰는 권한, **실행 역할**은 ECS가 ECR에서 이미지를 가져오고 CloudWatch에 로그를 보낼 때 쓰는 권한.
2. Fargate와 EC2 시작 유형의 차이를 한 문장으로? → Fargate는 **서버(인스턴스)를 관리하지 않고** 태스크 단위로 과금, EC2 유형은 직접 인스턴스를 운영하며 밀도·비용을 세밀히 조정.
3. EC2 CloudWatch 기본 지표에 메모리 사용률이 없다. 어떻게 얻나? → **CloudWatch Agent**를 설치해 사용자 지정 지표로 게시한다.
4. "어제 누가 이 보안 그룹을 열었는가"를 어디서 확인하나? → **CloudTrail** 이벤트 기록(`AuthorizeSecurityGroupIngress`).
5. 설정값과 비밀번호를 코드에서 분리하려면? → 일반 설정은 **SSM 파라미터 스토어**, 교체가 필요한 자격 증명은 **Secrets Manager**.
</details>

### 개인 또는 팀 과제

**[개인]** "컨테이너 전환과 관측성 리포트"
1. 16강의 EC2 앱을 컨테이너로 전환한 `Dockerfile`과 태스크 정의 JSON
2. **EC2 방식 vs Fargate 방식 비교** — 배포 시간, 월 비용, 운영 부담 각각 3줄
3. 대시보드 캡처 + 알람 수신 메일 캡처 + Logs Insights 쿼리와 결과
4. CloudTrail로 특정 변경을 추적한 기록
5. 정리 완료 증빙(태스크 0, 서비스 0)

### 참고할 AWS 공식 문서 검색 키워드

`Amazon ECS task definitions` · `Amazon ECS task IAM role vs execution role` · `AWS Fargate for Amazon ECS` · `Pushing a Docker image to Amazon ECR` · `ECR lifecycle policies` · `CloudWatch agent collect memory metrics` · `Analyzing log data with CloudWatch Logs Insights` · `Creating CloudWatch alarms SNS` · `AWS CloudTrail event history` · `AWS Systems Manager Parameter Store SecureString`

**주차 체크포인트** — 이미지를 새로 푸시하면 서비스가 무중단으로 교체되는가. 서비스에 오류가 생겼을 때 알림을 받고 로그로 원인 위치를 찾을 수 있는가.

---

## W12 · IaC와 CI/CD 자동화

**23–24강** · 6시간 · 예상 비용 **$0.3 ~ 0.6** · 🏁 **자동화·배포 프로젝트**

> **주차 목표**
> - 지금까지 콘솔로 만든 인프라를 **템플릿으로 정의하고 스택으로 배포·삭제**한다.
> - 변경 세트와 드리프트 감지로 **변경을 예측 가능하게** 관리한다.
> - 코드를 푸시하면 **자동으로 빌드·배포되는 파이프라인**을 완성한다.

**이전 주차와의 연결** — 08강 VPC, 11강 ALB, 21강 ECS까지 손으로 만든 것을 **한 개의 템플릿으로 재현**합니다. 그다음 그 배포를 사람 손에서 떼어냅니다.

| 강 | 제목 | 핵심 개념 | 다룰 서비스 |
|---|---|---|---|
| [**23**](../lessons/03-serverless-automation/lesson-23.md) | Infrastructure as Code | 선언형 인프라 · 템플릿 구조(파라미터/리소스/출력) · 변경 세트 · 드리프트 · 중첩 스택 · **CloudFormation vs Terraform vs CDK** | CloudFormation, (비교) Terraform, AWS CDK |
| [**24**](../lessons/03-serverless-automation/lesson-24.md) | 🏁 CI/CD 자동 배포 | 파이프라인 단계(소스→빌드→배포) · **GitHub Actions OIDC로 키 없는 배포** · 아티팩트 · 배포 전략(롤링/블루그린) · 롤백 | GitHub Actions, CodePipeline·CodeBuild(비교), ECR, ECS, S3, CloudFormation |

### 이론 수업 내용

**23강 (60분)**
1. 왜 코드인가 — 재현성 · 검토(코드 리뷰) · 이력(Git) · **삭제의 완전성**(스택 삭제 = 전부 정리)
2. 템플릿 구조 — `Parameters` / `Mappings` / `Resources` / `Outputs` / `Conditions`, 의존성과 `!Ref`·`!GetAtt`
3. 스택 생성 실패 시 롤백 동작과 디버깅 방법(이벤트 탭 읽기)
4. **변경 세트** — 적용 전에 무엇이 바뀌는지 미리 보기. 운영에서 필수
5. 드리프트 감지 — 누군가 콘솔에서 손댄 것을 찾아내기
6. **도구 비교표**

| 도구 | 장점 | 단점 | 언제 |
|---|---|---|---|
| CloudFormation | AWS 네이티브, 추가 도구 불필요, 스택 단위 정리 | AWS 전용, YAML이 장황 | AWS만 쓰는 조직 |
| Terraform | 멀티 클라우드, 모듈 생태계, 계획(plan)이 명확 | 상태 파일 관리 필요 | 여러 클라우드/SaaS 병행 |
| AWS CDK | 프로그래밍 언어로 작성, 추상화 | 학습 곡선, 합성 결과 이해 필요 | 개발자 중심 팀 |

**24강 (30분 이론 + 프로젝트)**
1. CI와 CD의 구분, 파이프라인 단계 설계
2. **키 없는 배포** — GitHub Actions ↔ AWS를 OIDC 신뢰 관계로 연결(장기 액세스 키를 저장소에 두지 않음)
3. 배포 전략 — 롤링 / 블루그린 / 카나리와 각각의 롤백 방법
4. 파이프라인에 넣어야 할 안전장치 — 린트(`cfn-lint`), 변경 세트 승인, 배포 후 헬스 체크

### 단계별 실습 — 23강

| Step | 내용 | 시간 |
|---|---|---|
| 1 | S3 버킷 1개짜리 최소 템플릿 작성 → 스택 생성 → **삭제로 완전 정리 확인** | 15분 |
| 2 | **VPC 템플릿 작성** — VPC·서브넷 4개·IGW·라우팅(파라미터로 CIDR 주입) | 30분 |
| 3 | 출력(Outputs)으로 서브넷 ID 내보내기 → 다른 스택에서 `ImportValue` 로 참조 | 15분 |
| 4 | 파라미터를 바꿔 **변경 세트 생성** → 무엇이 교체(Replacement)되는지 확인 후 실행 | 20분 |
| 5 | 콘솔에서 보안 그룹 규칙을 임의로 수정 → **드리프트 감지**로 탐지 | 10분 |
| 6 | `cfn-lint` 로 템플릿 검사 → 오류 수정 | 10분 |

### 단계별 실습 — 24강 🏁 자동화·배포 프로젝트

> **과제 문장** — "팀에 새 개발자가 왔다. 그는 AWS 콘솔을 한 번도 열지 않고, `git push` 만으로 애플리케이션을 배포할 수 있어야 한다. 인프라도 저장소에 있어야 하며, 배포에 사용하는 장기 자격 증명은 어디에도 저장되어 있지 않아야 한다."

| Step | 내용 | 시간 |
|---|---|---|
| 1 | GitHub 저장소 구성 — `app/`(애플리케이션), `infra/`(CloudFormation), `.github/workflows/` | 15분 |
| 2 | **IAM OIDC 자격 증명 공급자 + 배포 역할** 생성(신뢰 조건: 특정 저장소/브랜치만) | 25분 |
| 3 | 워크플로 작성 — ① 체크아웃 ② 역할 수임(`configure-aws-credentials`) ③ 이미지 빌드·ECR 푸시 ④ CloudFormation 배포 ⑤ ECS 서비스 업데이트 | 30분 |
| 4 | `main` 에 푸시 → **자동 배포 성공 확인** → 앱 화면 변경 확인 | 15분 |
| 5 | 일부러 실패하는 배포(잘못된 이미지) → **롤백 동작 확인** 및 로그 분석 | 20분 |
| 6 | 배포 후 헬스 체크 단계 추가(엔드포인트 200 확인 실패 시 파이프라인 실패 처리) | 15분 |
| 7 | 파이프라인 문서화 + **스택 삭제로 전체 정리** | 10분 |

### 실습을 통해 완성되는 결과물

- **인프라 템플릿**(VPC·보안 그룹·ALB·ECS 서비스)과 그것으로 만든 스택
- **GitHub Actions 워크플로** — 푸시 → 빌드 → 푸시 → 배포 → 헬스 체크
- 저장소에 액세스 키가 하나도 없는 **OIDC 기반 배포 역할**
- 배포 실패 시 롤백 기록
- `delete-stack` 한 번으로 정리되는 환경

### 실습 전제 조건

GitHub 계정 및 저장소 · Docker 이미지 빌드 가능 · 21강 ECS 구성 이해 · IAM 역할·자격 증명 공급자 생성 권한

### 예상 실습 시간

23강 100분 + 24강 120분(연장) + 과제 180분

### 예상 비용과 과금 주의 사항

| 리소스 | 프리 티어 | 예상 비용 | 과금 위험 |
|---|---|---|---|
| CloudFormation | 무료(AWS 리소스만) | $0 | **스택이 만드는 리소스가 비용** — 삭제 실패 스택 주의 |
| GitHub Actions | 퍼블릭 저장소 무료 / 프라이빗 월 2,000분 | $0 | 빌드 시간 초과 시 유료 |
| ECR · ECS Fargate · ALB | ❌ | $0.3~0.5 | 방치 시 월 $35+ |
| CodePipeline(비교 실습 시) | 파이프라인 1개 무료(월) | $0~1 | 활성 파이프라인당 월 $1 |
| S3(아티팩트) | ✅ | $0 | 아티팩트 누적 — 수명 주기 규칙 |

> 💡 **IaC의 비용상 이점** — 이 주차 이후 정리는 `aws cloudformation delete-stack` 한 번입니다. 리소스 누락으로 인한 과금 사고가 급감합니다. 단, **스택 삭제가 실패하는 경우**(S3 버킷에 객체가 남음, ENI 점유 등)를 반드시 실습에서 경험합니다.

### 보안 및 운영상 주의점

- **저장소에 AWS 액세스 키를 저장하지 않습니다.** OIDC 역할 수임이 표준이며, 신뢰 정책에 `repo:조직/저장소:ref:refs/heads/main` 조건을 반드시 넣습니다.
- 배포 역할 권한은 **필요한 서비스로 한정**합니다(`AdministratorAccess` 금지 — 평가 항목).
- 템플릿에 비밀번호를 넣지 않습니다. `NoEcho` 파라미터, SSM 파라미터, Secrets Manager 동적 참조를 사용합니다.
- 스택 삭제 정책(`DeletionPolicy: Retain`)을 데이터 리소스(RDS·S3)에 적용할지 **의도적으로 결정**합니다.
- 파이프라인에 승인 단계 또는 변경 세트 검토를 넣어 **사고를 코드 리뷰 단계에서 잡습니다**.

### 리소스 정리 체크리스트

- [ ] `aws cloudformation delete-stack --stack-name <스택>` 실행 후 **`DELETE_COMPLETE` 확인**
- [ ] 삭제 실패 시 원인 확인(S3 객체 잔존 · ENI 점유 · 삭제 방지 설정) 후 재시도
- [ ] ECR 이미지 삭제
- [ ] GitHub OIDC 공급자·배포 역할은 유지(최종 프로젝트에서 사용) 또는 과정 종료 시 삭제
- [ ] 아티팩트 S3 버킷 비우기
- [ ] CloudWatch 로그 그룹 정리
- [ ] 남은 리소스 전수 확인 — `aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=aws-course`

### 복습 퀴즈 5문항

<details>
<summary>정답 보기</summary>

1. IaC의 이점 4가지는? → **재현성 · 버전 관리(이력) · 코드 리뷰 가능 · 일괄 삭제(정리 누락 방지).**
2. 변경 세트(Change Set)를 쓰는 이유는? → 템플릿 변경을 적용하기 **전에** 어떤 리소스가 수정/교체/삭제되는지 미리 확인해 사고를 막기 위해서.
3. GitHub Actions에서 AWS 액세스 키 없이 배포하는 방법은? → **OIDC 자격 증명 공급자**를 등록하고, 특정 저장소·브랜치만 수임할 수 있는 IAM 역할을 신뢰 정책으로 제한한다.
4. 스택 삭제가 실패하는 흔한 원인 2가지는? → ① **S3 버킷에 객체가 남아 있음** ② ENI/보안 그룹이 다른 리소스에 점유됨(또는 `DeletionPolicy: Retain`, 삭제 방지 설정).
5. CloudFormation과 Terraform 중 무엇을 택할지 판단 기준은? → **AWS 단일 클라우드**면 CloudFormation(네이티브·상태 관리 불필요), **멀티 클라우드/외부 SaaS 병행**이면 Terraform.
</details>

### 개인 또는 팀 과제

**[개인 또는 2인] 자동화·배포 프로젝트 제출물**
1. GitHub 저장소 링크 — `infra/` 템플릿, `app/`, 워크플로 파일 포함
2. **배포 성공 로그**(Actions 실행 화면) + 배포된 서비스 URL 응답 캡처
3. OIDC 신뢰 정책 JSON과 "왜 이 조건이 필요한가" 설명
4. **실패·롤백 기록** — 고의 실패 → 롤백 → 원인 수정 → 재배포 전 과정
5. 스택 삭제 후 잔존 리소스 0건 증빙
6. (도전) 배포 전에 `cfn-lint` 와 보안 점검 단계를 추가한 워크플로

### 참고할 AWS 공식 문서 검색 키워드

`AWS CloudFormation template anatomy` · `Updating stacks using change sets` · `Detecting unmanaged configuration changes drift` · `CloudFormation deletion policy` · `Configuring OpenID Connect in Amazon Web Services GitHub Actions` · `Amazon ECS deployment types rolling update blue green` · `AWS CodePipeline tutorial ECS`

**주차 체크포인트** — 콘솔을 열지 않고 `git push` 만으로 애플리케이션을 배포할 수 있는가. `delete-stack` 한 번으로 모든 리소스가 사라지는가.

---

## 단원 완료 조건

- [ ] 요구사항에 따라 EC2·컨테이너·Lambda를 근거와 함께 선택할 수 있다
- [ ] DynamoDB를 접근 패턴 기준으로 설계하고 캐시를 적용할 수 있다
- [ ] Lambda + API Gateway로 서버 없는 API를 만들 수 있다
- [ ] 큐와 이벤트로 시스템을 분리하고 실패 메시지를 보존할 수 있다
- [ ] 컨테이너 이미지를 만들어 ECS Fargate로 배포·롤링 업데이트할 수 있다
- [ ] 지표·로그·알람으로 문제를 탐지하고 CloudTrail로 원인을 추적할 수 있다
- [ ] 인프라를 코드로 정의하고 CI/CD로 자동 배포할 수 있다

---

## 이 단원에서 자주 나오는 질문

| 질문 | 답 |
|---|---|
| 서버리스면 무조건 싼가요? | 아닙니다. **유휴 시간이 많으면** 압도적으로 싸지만, 상시 고부하는 컨테이너/EC2가 더 쌉니다. 요청 수 × 실행 시간으로 계산해 비교해야 합니다. (18강) |
| DynamoDB가 RDS보다 항상 빠른가요? | 접근 패턴이 **키 기반 단건 조회**일 때 그렇습니다. 조인·집계·유연한 질의가 필요하면 RDS가 맞습니다. (17강) |
| Lambda를 VPC에 넣어야 하나요? | RDS·ElastiCache 등 **VPC 내부 리소스에 접근할 때만**. 넣으면 인터넷 접근에 NAT/엔드포인트가 필요해집니다. (18강) |
| ECS와 EKS 중 무엇을 배워야 하나요? | 이 과정은 **ECS(+Fargate)** 로 컨테이너 개념을 익힙니다. 쿠버네티스 생태계가 필요해지면 EKS로 확장하세요. (21강 · [A2](A2-next-steps.md)) |
| CloudFormation과 Terraform 중 뭐가 실무에서 쓰이나요? | 둘 다 씁니다. 이 과정은 **CloudFormation을 기본**으로 하고 23강에서 Terraform 문법·차이를 함께 다룹니다. 최종 프로젝트는 둘 중 하나를 선택해 제출합니다. (23강) |
| 액세스 키를 GitHub Secrets에 넣으면 안 되나요? | 동작은 하지만 **장기 자격 증명 유출 위험**이 남습니다. OIDC 역할 수임이 현재 권장 방식입니다. (24강) |

---

[← 이전 단원](02-compute-data.md) · [← 전체 로드맵](README.md) · [진도표](../lessons/03-serverless-automation/README.md) · [다음 단원 — 최종 프로젝트 →](04-final-project.md)
