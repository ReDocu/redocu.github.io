# 25강 · 요구사항 분석과 보안 설계

> **AWS 학습 매뉴얼** · 🔴 대단원 04 · **25강 / 총 32강**
> [← 이전 24강](../03-serverless-automation/lesson-24.md) · [목차](README.md) · [다음 → 26강 백업·재해 복구 전략과 설계 리뷰](lesson-26.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 흐릿한 요구사항을 **기능/비기능으로 분해**하고 간단한 용량 산정을 할 수 있다.
- 각 계층마다 **대안을 비교한 구성 요소 결정표**를 작성할 수 있다.
- KMS 봉투 암호화로 **저장 데이터를 암호화**하고 키 정책을 이해한다.
- Secrets Manager로 자격 증명을 관리하고 **자동 교체**를 설정할 수 있다.
- WAF로 애플리케이션 계층 공격을 차단하고 **IAM 역할표**로 최소 권한을 재점검할 수 있다.

---

## ② 왜 필요한가

지난 24주 동안 우리는 **주어진 것을 만들었습니다.** [16강](../02-compute-data/lesson-16.md)·[24강](../03-serverless-automation/lesson-24.md) 프로젝트도 과제 문장이 미리 정해져 있었습니다.

최종 프로젝트는 다릅니다. **아무도 정답을 주지 않습니다.**

```
 고객/기획자: "이벤트 신청 서비스 하나 만들어 주세요."
                    │
                    ▼  ← 이 사이의 번역이 아키텍트의 일
 여러분:      VPC 몇 개, 서브넷 어떻게, DB는 RDS인가 DynamoDB인가,
             암호화 키는 몇 개, 이 결정의 근거는...
```

현장에서 실패하는 프로젝트의 대부분은 기술이 부족해서가 아니라 **이 번역을 건너뛰어서**입니다. "일단 만들고 보자"로 시작하면, 3주 뒤 "왜 이렇게 만들었죠?"라는 질문에 답하지 못합니다.

그래서 이번 4주는 순서를 뒤집습니다 — **설계(W13) → 구축(W14) → 검증(W15) → 리뷰(W16)**. 실무 프로젝트가 흘러가는 그 순서 그대로입니다.

오늘은 그 첫 단추 — **"무엇을 만들 것이고, 왜 그렇게 만드는가"를 문서로** 만듭니다. 그리고 24주간 강마다 조금씩 다뤘던 보안(IAM·암호화·HTTPS)을 **하나의 기준선으로 통합**합니다. 이 문서들이 26강 M1 설계 리뷰에서 심사받습니다.

---

## ③ 워크숍 가이드 — 요구사항에서 보안까지

### 팀 구성 확인

3~4인 1팀. 오늘 시작 전에 역할의 **1차 책임자**를 정합니다(겸직 가능).

| 역할 | 이번 주 책임 |
|---|---|
| 아키텍트 | 요구사항 분해 · 구성 요소 결정표 · 다이어그램 주도 |
| 인프라/네트워크 | 계층 구조·서브넷 설계 |
| 애플리케이션 | 데이터 모델·저장소 선택 |
| 운영/보안 | KMS·시크릿·WAF·IAM 역할표 |

### 요구사항 → 아키텍처, 4단계

```
 ① 기능 요구      "무엇을 하는가"      → 사용자가 할 수 있는 일 목록
 ② 비기능 요구    "얼마나 잘"          → 가용성·성능·보안·비용 목표(숫자로!)
 ③ 제약          "무엇을 못 하는가"    → 예산·기술·규제·팀 역량
 ④ 구성 요소 결정  "무엇으로"           → 각 계층 서비스 + 대안 비교
```

> 🔑 **가장 많이 빠뜨리는 것은 ②를 "숫자로" 적는 것**입니다. "빠르게"가 아니라 "p95 응답 300ms 이내", "안정적으로"가 아니라 "AZ 하나가 죽어도 서비스 지속"이어야 검증할 수 있습니다.

### 간단한 용량 산정 — 감이 아니라 계산

```
 일일 활성 사용자(DAU)    5,000명
 1인당 요청/일            20회       → 일 100,000 요청
 피크 집중 배수           10배        → 피크 시 시간당 요청 ÷ 유효 초
   100,000 × 0.4(피크 4시간에 40% 집중) ÷ (4×3600) ≈ 초당 2.8 요청
   피크 순간(×3 여유)     → 목표 처리량 약 초당 8~10 요청
 요청당 CPU 시간          50ms
   → 필요 동시성 ≈ 10 × 0.05 = 0.5 → t3.micro 2대로 충분 + 여유
```

> 💡 **정확할 필요 없습니다.** 자릿수(초당 10인가 1,000인가)만 맞으면 인스턴스 타입·대수·DB 크기의 출발점이 잡힙니다. [29강](lesson-29.md) 부하 테스트에서 이 가정을 검증합니다.

### 구성 요소 결정표 — 이 프로젝트의 심장 ⭐

각 계층마다 **후보 2개 이상 + 선택 + 근거 + 예상 비용**을 적습니다. "그냥 EC2"는 감점입니다.

| 계층 | 후보 | 선택 | 근거 | 월 비용(대략) |
|---|---|---|---|---|
| 컴퓨팅 | EC2 ASG / **Fargate** / Lambda | Fargate | 상시 트래픽·서버 관리 최소화, 이미지 재현성 | $18/2태스크 |
| DB | **RDS** / DynamoDB | RDS Multi-AZ | 신청 데이터에 조인·집계 필요, 트랜잭션 | $38 |
| 캐시 | 없음 / ElastiCache | 없음(1차) | 트래픽 규모상 불필요, 커지면 추가 | $0 |
| 정적 | EC2 서빙 / **S3+CloudFront** | S3+CDN(OAC) | 전송비·엣지 캐싱·서버 부하 | ~$1 |
| 관문 | **ALB** / API GW | ALB | 상시 컨테이너 백엔드 | $16 |

> 리뷰어(26강)는 이 표의 **"근거"** 열을 봅니다. 기술을 나열하지 말고 **"왜 대안이 아니라 이것인가"** 를 씁니다.

### 보안 기준선 4요소 — 흩어진 것을 모은다

24주간 강마다 조금씩 나온 보안을 **하나의 문서**로 통합합니다.

| 요소 | 어디서 배웠나 | 이번 주 통합 |
|---|---|---|
| **IAM 최소 권한** | [03·04강](../01-cloud-foundation/lesson-04.md) | 역할표로 전 역할 정리 |
| **저장 시 암호화(KMS)** | [13·15강](../02-compute-data/lesson-15.md) | 어느 데이터에 어느 키 |
| **자격 증명(Secrets Manager)** | [15강](../02-compute-data/lesson-15.md) | 시크릿 목록 + 교체 |
| **HTTPS + WAF** | [12강](../02-compute-data/lesson-12.md) | 경계 방어 |

### KMS — 봉투 암호화

```
 [봉투 암호화]
  ① 데이터 키 생성 → 이 키로 실제 데이터 암호화 (빠른 대칭키)
  ② 데이터 키 자체를 KMS 마스터 키(CMK)로 암호화해 함께 저장
  ③ 복호화 시 KMS에 "이 암호화된 데이터 키를 풀어 줘" 요청
```

| 구분 | AWS 관리형 키 | **고객 관리 키(CMK)** |
|---|---|---|
| 비용 | 무료 | 월 $1/키 |
| 키 정책 제어 | ❌ | ✅ **누가 쓸 수 있는지 직접** |
| 교체 주기·감사 | 제한적 | 완전 제어 |
| 언제 | 기본 암호화면 충분 | 규제·감사 요건 |

> 🔴 **키 정책에서 자기 자신을 잠그지 마세요** — 키 관리자(`kms:*` 권한 주체)를 반드시 포함해야 합니다. 없으면 **키를 영원히 못 씁니다.**

### WAF — L7 방어

| 규칙 유형 | 막는 것 |
|---|---|
| AWS 관리형 규칙 그룹 | 공통 위협(OWASP)·SQL 인젝션·나쁜 입력 |
| 속도 기반 규칙 | 특정 IP의 폭주(DDoS·스크래핑) |
| IP 평판/지리 | 알려진 악성 IP·차단 국가 |

> ⚠️ **WAF는 만능이 아닙니다.** 애플리케이션 입력 검증을 대체하지 않습니다 — 겹겹의 한 겹일 뿐입니다. 비용도 있으니(웹 ACL $5/월 + 규칙) 시연 구간에만 켜는 계획을 세웁니다.

---

## ④ 스프린트 작업 (M1을 향해)

> 💰 **예상 비용 $0 ~ 0.3** — 대부분 설계(무료). KMS·Secrets·WAF를 잠깐 만들어 보고 정리합니다.
> 이번 주 산출물은 26강 M1 리뷰에서 발표합니다.

### Step 1. 요구사항 정의서 (팀, 40분)

팀 주제를 정하고([최종 프로젝트 1절](README.md) 참고) 아래를 채웁니다.

**기능 요구 8개 이상** (예: 이벤트 신청 서비스)

```
 F1  사용자가 이름·연락처로 신청한다
 F2  신청 내역을 조회한다
 F3  관리자가 전체 신청 목록을 본다
 F4  신청 시 확인 알림을 받는다 (비동기)
 F5  신청 정원 초과 시 대기 등록된다
 F6  이벤트 포스터 이미지를 본다 (정적)
 F7  관리자가 신청을 취소 처리한다
 F8  신청 통계를 집계해 본다
 ...
```

**비기능 요구 6개 이상 — 반드시 숫자로**

| # | 항목 | 목표(숫자) |
|---|---|---|
| N1 | 가용성 | AZ 하나 장애 시 서비스 지속, 월 99.9% |
| N2 | 성능 | p95 응답 300ms 이내 |
| N3 | 확장성 | 피크 시 자동으로 2→4대 |
| N4 | 데이터 보호 | RPO 5분, RTO 30분 (26강에서 확정) |
| N5 | 보안 | 전 구간 HTTPS, 저장 암호화, DB 비공개 |
| N6 | 비용 | 팀 4주 합계 $60 이하 |

### Step 2. 용량 산정 + 구성 요소 결정표 (팀, 40분)

위 워크숍 가이드의 산정 공식으로 **자릿수**를 잡고, 결정표를 작성합니다. **각 행에 대안·근거·비용을 반드시.**

이 표가 M1 산출물 1번이자, 다음 주 IaC 구축의 청사진입니다.

### Step 3. KMS 고객 관리 키 (운영/보안, 20분)

```bash
$ ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
$ cat > key-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "KeyAdmins",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::$ACCOUNT:root"},
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}
EOF

$ KEY_ID=$(aws kms create-key \
    --description "course final project data key" \
    --policy file://key-policy.json \
    --tags TagKey=Project,TagValue=aws-course \
    --query 'KeyMetadata.KeyId' --output text)

$ aws kms create-alias --alias-name alias/course-final --target-key-id $KEY_ID
$ aws kms enable-key-rotation --key-id $KEY_ID    # 연 1회 자동 교체
```

> 📌 `Principal: root` 는 "계정 루트가 아니라 **계정의 IAM 주체가 IAM 정책으로 접근 가능**"을 뜻하는 관용구입니다. 이게 있어야 자기 잠금을 피합니다.

**봉투 암호화를 눈으로 확인**

```bash
$ aws kms encrypt --key-id alias/course-final \
    --plaintext "$(echo -n '신청자 주민번호 같은 민감정보' | base64)" \
    --query 'CiphertextBlob' --output text | head -c 80
AQICAHh...(암호문)

# 복호화하려면 KMS 권한이 있어야 함
$ CIPHER=$(aws kms encrypt --key-id alias/course-final \
    --plaintext fileb://<(echo -n "test") --query CiphertextBlob --output text)
$ echo $CIPHER | base64 -d > cipher.bin
$ aws kms decrypt --ciphertext-blob fileb://cipher.bin \
    --query 'Plaintext' --output text | base64 -d
test
```

**적용 계획을 표로** (실제 적용은 W14):

| 데이터 | 서비스 | 키 |
|---|---|---|
| DB 데이터 | RDS `storage-encrypted` | alias/course-final |
| 정적 자산 | S3 SSE-KMS | alias/course-final |
| 볼륨 | EBS | alias/course-final |
| 시크릿 | Secrets Manager | (기본 aws/secretsmanager 또는 CMK) |

### Step 4. Secrets Manager + 자동 교체 (운영/보안, 20분)

```bash
$ DB_PASSWORD=$(aws secretsmanager get-random-password \
    --exclude-punctuation --password-length 20 --query 'RandomPassword' --output text)

$ SECRET_ARN=$(aws secretsmanager create-secret \
    --name course/final/db \
    --kms-key-id alias/course-final \
    --secret-string "{\"username\":\"admin\",\"password\":\"$DB_PASSWORD\",\"dbname\":\"eventapp\"}" \
    --tags Key=Project,Value=aws-course \
    --query 'ARN' --output text)

$ aws secretsmanager describe-secret --secret-id course/final/db \
    --query '[Name,KmsKeyId,RotationEnabled]' --output text
course/final/db    alias/course-final    False
```

> 📌 **자동 교체(rotation)** 는 RDS가 만들어진 뒤(W14) 연결합니다 — 교체 Lambda가 실제 DB에 접속해 비밀번호를 바꿔야 하기 때문입니다. 오늘은 **구조와 KMS 연동**만 확인합니다.

### Step 5. WAF 웹 ACL (운영/보안, 20분)

```bash
$ WAF_ARN=$(aws wafv2 create-web-acl \
    --name course-final-waf --scope REGIONAL \
    --default-action Allow={} \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=courseWaf \
    --rules '[
      {
        "Name": "AWSCommonRules", "Priority": 1,
        "Statement": {"ManagedRuleGroupStatement": {"VendorName": "AWS", "Name": "AWSManagedRulesCommonRuleSet"}},
        "OverrideAction": {"None": {}},
        "VisibilityConfig": {"SampledRequestsEnabled": true, "CloudWatchMetricsEnabled": true, "MetricName": "common"}
      },
      {
        "Name": "RateLimit", "Priority": 2,
        "Statement": {"RateBasedStatement": {"Limit": 100, "AggregateKeyType": "IP"}},
        "Action": {"Block": {}},
        "VisibilityConfig": {"SampledRequestsEnabled": true, "CloudWatchMetricsEnabled": true, "MetricName": "rate"}
      }
    ]' \
    --tags Key=Project,Value=aws-course \
    --query 'Summary.ARN' --output text)
```

> 🔴 **WAF는 웹 ACL $5/월 + 규칙당 $1** 입니다. 오늘 구조만 확인하고 **정리에서 삭제**한 뒤, [29~30강](lesson-30.md) 시연 구간에 다시 붙입니다. ALB 연결은 W14에서 ALB가 생긴 뒤 합니다.

### Step 6. IAM 역할표 작성 (운영/보안, 30분)

프로젝트에 등장할 **모든 역할을 표로** 정리합니다. `AdministratorAccess` 가 하나라도 있으면 감점 — 좁혀야 합니다.

| 역할 | 신뢰 주체 | 허용 액션(핵심) | 자원 범위 | `*` 있나? |
|---|---|---|---|---|
| `course-ecs-task-role` | ecs-tasks | secretsmanager:GetSecretValue, kms:Decrypt | 특정 시크릿·키 | ❌ |
| `course-ecs-exec-role` | ecs-tasks | (관리형) ECR 풀·로그 | — | 관리형 |
| `course-deploy-role` | GitHub OIDC | ECR·CFN·PassRole(조건부) | 특정 스택·역할 | 일부(좁힐 것) |
| `course-lambda-rotate` | lambda | secretsmanager 교체·rds 접속 | 특정 시크릿 | ❌ |

> 이 표는 M1 산출물 3번이며, [31강 WA 리뷰](lesson-31.md)의 보안 기둥에서 다시 검증됩니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 이번 강 | 방치 시 월 |
|---|---|---|---|
| **KMS 고객 관리 키** | ❌ | 즉시 $0(월 단위) | **$1/키** + 요청 |
| **Secrets Manager** | ❌(30일 평가판) | ~$0 | **$0.40/비밀** |
| **WAF 웹 ACL** | ❌ | 짧게 켜면 ~$0.2 | **$5 + 규칙당 $1** |
| 요구사항·결정표 작성 | — | $0 | — |
| **합계** | | **$0 ~ 0.3** | — |

> 💡 **비용 설계도 설계입니다** — KMS/Secrets/WAF는 이번 주에 붙였다 W14 배포 전까지 비활성화하고, 시연이 있는 W15–W16에 다시 켜는 계획을 팀이 세웁니다.

### 🧹 리소스 정리 체크리스트

```bash
# WAF — 시연 전까지 불필요, 삭제
$ LOCK=$(aws wafv2 get-web-acl --name course-final-waf --scope REGIONAL \
    --id $(aws wafv2 list-web-acls --scope REGIONAL --query "WebACLs[?Name=='course-final-waf'].Id" --output text) \
    --query 'LockToken' --output text)
$ WAF_ID=$(aws wafv2 list-web-acls --scope REGIONAL --query "WebACLs[?Name=='course-final-waf'].Id" --output text)
$ aws wafv2 delete-web-acl --name course-final-waf --scope REGIONAL --id $WAF_ID --lock-token $LOCK

# 테스트 시크릿 — 즉시 삭제 (복구 대기 없이)
$ aws secretsmanager delete-secret --secret-id course/final/db --force-delete-without-recovery

# KMS 키 — 삭제 예약 (최소 7일 대기)
$ aws kms delete-alias --alias-name alias/course-final
$ aws kms schedule-key-deletion --key-id $KEY_ID --pending-window-in-days 7
```

- [ ] WAF 웹 ACL 삭제 (시연 전 불필요 · 월 $5)
- [ ] 테스트 시크릿 `--force-delete-without-recovery`
- [ ] KMS 키 삭제 예약(7일) — **단, W14에서 실제 쓸 키라면 유지**하고 계획서에 기록
- [ ] cipher.bin 등 로컬 임시 파일 정리
- [ ] ⭐ **설계 문서(요구사항·결정표·역할표)는 저장** — M1 제출물

> 📌 **판단**: KMS 키를 W14에서 데이터 암호화에 쓸 것이면 지우지 말고 유지하세요(월 $1). 이번 주엔 구조만 익히고 실제 적용은 W14인 팀은 지웠다가 다시 만들어도 됩니다 — 팀 계획서에 어느 쪽인지 명시합니다.

---

## ⑤ 자주 하는 실수

### 요구사항을 "기능"만 적고 "비기능"을 빠뜨린다

**증상** — "신청한다, 조회한다, 취소한다..." 기능은 10개인데 가용성·성능·비용 목표가 없습니다.
**결과** — 26강 리뷰에서 "AZ 하나 죽으면요?", "느리면 얼마나 느려도 되나요?"에 답을 못 합니다. **검증(W15)의 기준 자체가 없어집니다.**
**해결** — 비기능 요구를 **숫자로** 적습니다. 이것이 나중에 알람 임계값([29강](lesson-29.md))·부하 테스트 성공 기준·비용 상한이 됩니다.

### 구성 요소를 나열만 하고 대안을 안 적는다

**증상** — 결정표에 "컴퓨팅: EC2" 한 줄.
**문제** — 왜 EC2인지, Fargate·Lambda는 왜 아닌지가 없으면 **판단한 것이 아니라 습관대로 고른 것**입니다.
**해결** — 각 행에 후보 2개 이상 + 근거. 근거는 이 프로젝트의 요구(비기능)와 연결합니다. "상시 트래픽이라(N3) Fargate, 이벤트성이 아니라 Lambda 제외."

### KMS 키 정책에서 자기 자신을 잠근다

```
An error occurred (AccessDeniedException) when calling the Encrypt operation:
The ciphertext refers to a customer master key that does not exist ... or you do not have access
```

**원인** — 키 정책에 **키 관리자(관리 권한 주체)를 넣지 않았습니다.** CMK는 IAM 정책만으로는 접근이 안 되고 **키 정책이 최종 관문**입니다.
**해결** — 최소한 `Principal: {AWS: "arn:...:root"}` + `kms:*` 문을 포함합니다(Step 3). 이미 잠갔다면 AWS Support를 통해야 하므로 **처음부터 조심**합니다.

### Secrets Manager를 만들었는데 앱이 못 읽는다

**원인** — 시크릿을 KMS CMK로 암호화했는데, 읽는 역할에 **`kms:Decrypt` 권한이 없습니다.** `secretsmanager:GetSecretValue` 만으로는 부족합니다.
**해결** — 태스크/실행 역할에 해당 키의 `kms:Decrypt` 를 추가합니다. 기본 키(`aws/secretsmanager`)를 쓰면 이 문제가 없지만 감사 요건이 있으면 CMK가 필요합니다.

### WAF를 만들어 두고 잊어서 과금된다

**원인** — 웹 ACL은 **연결 여부와 무관하게 월 $5** + 규칙당 $1이 나갑니다.
**해결** — "구조 학습 → 삭제 → 시연 때 재생성" 계획을 세웁니다. WAF 설정을 **템플릿(W14)에 넣어 두면** 재생성이 명령 한 줄이 됩니다.

### 역할표에 AdministratorAccess가 남아 있다

**원인** — 24강까지 실습 편의로 넓은 권한을 썼고, 그대로 프로젝트로 넘어왔습니다.
**결과** — 최종 프로젝트 평가에서 **감점**이며, [24강](../03-serverless-automation/lesson-24.md)에서 봤듯 배포 역할의 과대 권한은 곧 팀 전체의 보안 구멍입니다.
**해결** — 역할표를 만들며 각 역할의 실제 필요 액션을 적고, Access Analyzer([04강](../01-cloud-foundation/lesson-04.md))로 좁힙니다. [31강](lesson-31.md)에서 재검증됩니다.

---

## ⑥ 마일스톤 점검 (M1 준비)

이번 주 산출물이 26강 M1 설계 리뷰의 재료입니다. 아래를 준비하세요.

**M1 제출물 (26강 리뷰에서 발표)**

- [ ] **요구사항 정의서** — 기능 8+ / 비기능 6+(숫자로) + 간단한 용량 산정
- [ ] **구성 요소 결정표** — 각 계층 대안 2+·선택·근거·예상 비용
- [ ] **보안 기준선 문서** — KMS 적용 범위 표 · 시크릿 목록 · WAF 규칙 · **IAM 역할표**
- [ ] (26강에서 추가) 아키텍처 다이어그램 · DR 전략서

**스스로 점검하는 질문 3개**

<details>
<summary>1. "이 서비스에서 가장 민감한 데이터는 무엇이고, 어떻게 보호하나요?"에 답할 수 있는가?</summary>

답할 수 있어야 합니다. 예: "신청자 연락처가 가장 민감하다 → RDS 저장 시 KMS CMK 암호화 + DB 프라이빗 서브넷 + Secrets Manager로 접속 자격 증명 관리 + 전송 구간 HTTPS." 데이터 흐름을 따라가며 **각 지점의 보호 수단**을 말할 수 있으면 됩니다.
</details>

<details>
<summary>2. 결정표의 모든 선택에 "왜 대안이 아닌가"를 말할 수 있는가?</summary>

각 행마다 탈락시킨 후보와 그 이유가 있어야 합니다. "DynamoDB가 아니라 RDS — 신청 통계 집계와 관리자 조회에 조인·GROUP BY가 필요해서." 근거가 **이 프로젝트의 요구**와 연결되어야 합니다.
</details>

<details>
<summary>3. IAM 역할표에 AdministratorAccess가 하나도 없는가?</summary>

없어야 합니다. 있다면 그 역할이 실제로 필요한 액션만 골라 좁힙니다. "일단 넓게 주고 나중에"는 그 "나중에"가 오지 않는 것이 현장의 법칙입니다 — 지금 좁힙니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 요구사항 4단계 | 기능 → **비기능(숫자!)** → 제약 → 구성 요소 |
| 용량 산정 | 자릿수만 맞으면 됨. 감이 아니라 계산 |
| **구성 요소 결정표** | 대안 2+·선택·**근거(요구와 연결)**·비용 |
| KMS | 봉투 암호화 · CMK는 키 정책 제어 · **자기 잠금 주의** |
| Secrets Manager | KMS 연동 · 자동 교체(RDS 생성 후) · 읽는 역할에 kms:Decrypt |
| WAF | 관리형+속도 규칙 · 만능 아님 · 시연 구간만(비용) |
| IAM 역할표 | 전 역할 정리 · **AdministratorAccess 금지** |

**한 장 요약**

```
  요구사항(기능+비기능 숫자) → 용량 산정 → 구성 요소 결정표(대안·근거·비용)
                                              │
  보안 기준선: KMS(어디에) + Secrets(무엇을) + WAF(경계) + IAM 역할표(누가)
                                              ▼
                                        M1 설계 리뷰(26강)
```

**오늘 반드시 기억할 한 가지**
> **아키텍처는 "무엇을 만들었나"가 아니라 "왜 그렇게 만들었나"입니다.**
> 근거 없는 선택은 리뷰에서 무너집니다 — 지금 문서로 남기세요.

**과제 (팀)**
1. 요구사항 정의서 완성 (기능 8+ / 비기능 6+ 숫자 / 용량 산정).
2. 구성 요소 결정표 — 5개 계층 이상, 각 행 대안·근거·비용.
3. 보안 기준선 문서 — KMS 적용 표 · 시크릿 목록 · WAF 규칙 · IAM 역할표.
4. (개인) "우리 서비스에서 가장 민감한 데이터와 그 보호 경로"를 데이터 흐름으로 5줄.
5. W14 구축 계획 초안 — 무엇을 어떤 순서로, 누가.

---

[← 이전 24강](../03-serverless-automation/lesson-24.md) · [목차](README.md) · [다음 → 26강 백업·재해 복구 전략과 설계 리뷰](lesson-26.md)
