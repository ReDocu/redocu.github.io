# 04강 · 최소 권한 실전

> **AWS 학습 매뉴얼** · 🟢 대단원 01 · **04강 / 총 32강**
> [← 이전 03강](lesson-03.md) · [목차](README.md) · [다음 → 05강 AWS CLI와 CloudShell](lesson-05.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 요청 하나가 허용될지 거부될지를 **정책 평가 순서에 따라 예측**할 수 있다.
- **조건 키**로 MFA·리전·IP 같은 상황 제한을 정책에 걸 수 있다.
- 권한을 좁히는 **현실적인 절차**(넓게 시작 → 로그 확인 → 좁히기)를 실행할 수 있다.
- IAM Access Analyzer로 **외부에 공개된 리소스**를 탐지할 수 있다.
- 액세스 키가 유출됐을 때의 **대응 순서를 순서대로** 수행할 수 있다.

---

## ② 왜 필요한가

[03강](lesson-03.md)에서 정책을 만드는 법을 배웠습니다. 그런데 실무에서 진짜 어려운 것은 **정책을 쓰는 것이 아니라 좁히는 것**입니다.

현장에서 가장 흔한 대화는 이렇습니다.

> **개발자** — "권한이 없다고 나와요."
> **관리자** — "그럼 `AdministratorAccess` 붙여 드릴게요."

이렇게 6개월이 지나면 모든 사람이 관리자가 되어 있습니다. 그리고 어느 날 누군가 실수로 운영 데이터베이스를 지웁니다.

반대로 처음부터 지나치게 좁히면 이런 일이 벌어집니다.

```
An error occurred (UnauthorizedOperation) when calling the RunInstances operation:
You are not authorized to perform this operation.
```

배포가 새벽에 실패하고, 무엇이 부족한지 알 수 없어 결국 다시 `*` 로 돌아갑니다.

**최소 권한은 "처음부터 완벽하게 좁히는 것"이 아니라 "좁혀 가는 절차를 갖는 것"** 입니다. 오늘 그 절차를 익힙니다.

그리고 또 하나 — **사고는 반드시 납니다.** 액세스 키는 언젠가 유출됩니다. 그때 **무엇을 어떤 순서로 하는지**를 알고 있는지가 피해 규모를 결정합니다. 이것도 오늘 실습합니다.

---

## ③ 개념 설명

### 정책 평가 로직 — "Allow가 있는데 왜 안 되지?"

AWS는 모든 요청을 아래 순서로 판정합니다.

```
       요청 도착
          │
          ▼
   ① 기본값: 거부 (Implicit Deny)
          │
          ▼
   ② 명시적 Deny 가 하나라도 있나?  ──── 있다 ──▶ 🚫 거부 (끝)
          │ 없다
          ▼
   ③ 상한(SCP · 권한 경계)이 막나?  ──── 막는다 ──▶ 🚫 거부
          │ 안 막는다
          ▼
   ④ 명시적 Allow 가 있나?  ──── 없다 ──▶ 🚫 거부 (암묵적 거부)
          │ 있다
          ▼
        ✅ 허용
```

**외울 것은 세 문장입니다.**

1. **아무것도 없으면 거부** — 권한은 명시적으로 줘야만 생깁니다.
2. **명시적 Deny는 무엇보다 강하다** — Allow가 100개 있어도 Deny 하나면 끝입니다.
3. **상한을 넘을 수는 없다** — 조직의 SCP나 권한 경계가 막으면 Allow가 있어도 안 됩니다.

**"Allow가 있는데 막히는" 5가지 원인**

| # | 원인 | 확인 방법 |
|---|---|---|
| 1 | 다른 정책의 **명시적 Deny** | Policy Simulator의 Matched statements |
| 2 | **조건(Condition) 불일치** — MFA·IP·리전·태그 | 조건 키 값 확인 |
| 3 | **권한 경계** 또는 **SCP** 상한 | IAM → 사용자 → 권한 경계 탭 |
| 4 | **리소스 기반 정책**이 거부 (S3 버킷 정책 등) | 버킷 정책 확인 |
| 5 | ARN이 실제 리소스와 **불일치** | ARN 오타, `/*` 누락 |

### 조건 키 — 상황으로 권한을 제한하기

`Condition` 은 정책을 훨씬 안전하게 만듭니다. 이 과정에서 자주 쓰는 것들입니다.

| 조건 키 | 뜻 | 활용 |
|---|---|---|
| `aws:MultiFactorAuthPresent` | MFA로 로그인했는가 | 위험한 작업은 MFA 필수 |
| `aws:RequestedRegion` | 요청 대상 리전 | 서울 외 리전 전면 차단 |
| `aws:SourceIp` | 요청 출발 IP | 사무실 IP에서만 |
| `aws:PrincipalTag` / `aws:ResourceTag` | 주체·리소스 태그 | 내 태그가 붙은 것만 |
| `aws:CurrentTime` | 현재 시각 | 업무 시간에만 |

**연산자**를 잘못 고르면 의도가 뒤집힙니다.

| 연산자 | 예 |
|---|---|
| `StringEquals` / `StringNotEquals` | 정확히 일치 / 불일치 |
| `Bool` | `true` / `false` |
| `IpAddress` / `NotIpAddress` | CIDR 비교 |
| `...IfExists` 접미사 | **키가 없으면 조건을 무시**하고 통과 |

> ⚠️ **`IfExists` 함정** — `BoolIfExists` 로 MFA를 검사하면, **MFA 키 자체가 없는 요청**(예: 서비스 역할 호출)은 통과합니다.
> 사람에게만 적용하려면 `BoolIfExists` 가 안전하고, 반드시 MFA를 강제하려면 `Bool` 을 씁니다. 서비스 역할까지 막아 버리는 사고가 흔합니다.

### 권한 경계(Permissions Boundary) — 권한의 천장

```
        ┌──────────────────────────────┐
        │   권한 경계 (천장)             │   ← "여기까지만 가능"
        │  ┌────────────────────┐       │
        │  │  실제 권한 정책      │       │   ← 실제로 허용된 것
        │  │  (Allow)           │       │
        │  └────────────────────┘       │
        └──────────────────────────────┘
         실효 권한 = 권한 정책 ∩ 권한 경계 (교집합)
```

권한 경계를 붙이면 그 사용자/역할은 **아무리 넓은 정책을 받아도 경계를 넘지 못합니다.**

**언제 쓰나** — "개발자에게 IAM 역할을 만들 권한을 주되, 자기보다 강한 역할은 못 만들게" 같은 **권한 위임** 상황입니다.

| 개념 | 적용 대상 | 누가 설정 |
|---|---|---|
| 권한 경계 | IAM 사용자·역할 | 계정 관리자 |
| SCP | AWS Organizations의 계정 전체 | 조직 관리자 |

### 최소 권한을 만드는 현실적인 절차

이론적으로 "필요한 것만 주기"는 불가능합니다. 무엇이 필요한지 미리 알 수 없기 때문입니다. 실무는 이렇게 합니다.

```
① 넓게 시작한다        (예: PowerUserAccess)
        ↓  며칠~몇 주 운영
② 실제 사용을 관찰한다   (CloudTrail / Access Analyzer)
        ↓
③ 사용된 액션만 남긴다   (고객 관리형 정책으로 고정)
        ↓
④ 위험 액션은 Deny로 못 박는다  (삭제·IAM 변경 등)
        ↓
⑤ 정기적으로 재점검한다  (마지막 사용 시각 확인)
```

> **IAM Access Analyzer**의 **정책 생성** 기능은 CloudTrail 기록을 읽어 **실제로 사용한 액션만으로 정책 초안을 만들어 줍니다.** ②~③을 자동화해 줍니다.

### IAM Access Analyzer 두 가지 기능

| 기능 | 하는 일 | 비용 |
|---|---|---|
| **외부 액세스 분석기** | S3·IAM 역할·KMS 등이 **계정 외부에 공개**됐는지 탐지 | **무료** |
| 미사용 액세스 분석기 | 안 쓰는 권한·역할·키 탐지 | **유료**(리소스 수 기준) |

> 이 과정에서는 **무료인 외부 액세스 분석기만** 켭니다. 유료 유형을 잘못 켜면 비용이 나옵니다.

### 액세스 키 유출 대응 순서 (외워 두세요)

```
1. 🚨 해당 키 즉시 비활성화 (삭제보다 먼저 — 조사 흔적 보존)
2. 🔑 새 키 발급 후 애플리케이션 교체
3. 🔍 CloudTrail로 그 키가 무엇을 했는지 조사
4. 🧹 생성된 이상 리소스 정리 (전 리전 확인!)
5. 🗑 유출된 키 삭제
6. 📝 재발 방지 — 역할로 전환, 저장소 스캔 도구 도입
```

> ⚠️ **왜 삭제가 아니라 비활성화가 먼저인가** — 삭제해도 공격은 멈추지만, **조사에 필요한 연결 정보가 흐려집니다.** 비활성화로 즉시 무력화한 뒤 조사하고 마지막에 삭제합니다.
> ⚠️ **전 리전 확인이 중요합니다.** 공격자는 대개 감시가 느슨한 리전에 리소스를 만듭니다.

---

## ④ 단계별 실습

> **비용 $0.** IAM과 무료 분석기만 사용합니다.

### Step 1. 명시적 Deny가 Allow를 이기는 것 확인하기

**① 테스트 사용자 준비** — [03강](lesson-03.md)에서 만든 `dev-kim` 을 씁니다. (없으면 새로 만듭니다)

**② 충돌 정책 붙이기** — IAM → 정책 생성 → JSON

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEverythingOnS3",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    },
    {
      "Sid": "DenyDelete",
      "Effect": "Deny",
      "Action": [
        "s3:DeleteObject",
        "s3:DeleteBucket"
      ],
      "Resource": "*"
    }
  ]
}
```

정책 이름: `S3-Full-Except-Delete` → `dev-kim` 에 연결.

**③ Policy Simulator로 판정**

| 액션 | 예상 | 실제 |
|---|---|---|
| `s3:ListAllMyBuckets` | allowed | ✅ allowed |
| `s3:PutObject` | allowed | ✅ allowed |
| `s3:DeleteObject` | **denied** | 🚫 denied (explicit deny) |

**결론** — `s3:*` 로 전부 허용했는데도 삭제만 막혔습니다. **명시적 Deny가 이깁니다.**

> 💡 **실무 활용** — 넓은 Allow를 주되 위험 액션만 Deny로 못 박는 방식은 매우 흔한 패턴입니다.
> 예: 개발자에게 EC2 전권을 주되 `ec2:TerminateInstances` 와 `iam:*` 은 Deny.

### Step 2. MFA를 안 하면 위험 작업을 막는 정책 만들기

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyDangerousActionsWithoutMFA",
      "Effect": "Deny",
      "Action": [
        "ec2:TerminateInstances",
        "ec2:DeleteVolume",
        "rds:DeleteDBInstance",
        "s3:DeleteBucket"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

정책 이름: `Deny-Destructive-Without-MFA`

**읽는 법** — **"MFA로 로그인하지 않았다면(false), 이 파괴적인 작업들을 거부한다."**

**검증** — Policy Simulator에서 왼쪽 아래 **Global Settings** 를 열고 `aws:MultiFactorAuthPresent` 값을 바꿔 가며 실행합니다.

| `MultiFactorAuthPresent` | `ec2:TerminateInstances` |
|---|---|
| `false` | 🚫 denied |
| `true` | ✅ allowed (다른 정책이 허용한다면) |

### Step 3. 서울 외 리전 전면 차단하기

실습 계정에서 **가장 실용적인 정책**입니다. 다른 리전에 리소스를 만들어 잊는 사고를 원천 차단합니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyAllOutsideSeoul",
      "Effect": "Deny",
      "NotAction": [
        "iam:*",
        "sts:*",
        "organizations:*",
        "cloudfront:*",
        "route53:*",
        "support:*",
        "budgets:*",
        "ce:*",
        "s3:ListAllMyBuckets"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": "ap-northeast-2"
        }
      }
    }
  ]
}
```

정책 이름: `Deny-Regions-Except-Seoul`

> 📌 **`NotAction` 에 넣은 서비스들은 왜 예외인가?**
> IAM · STS · CloudFront · Route 53 · Billing 등은 **글로벌 서비스**라 요청이 `us-east-1` 로 갑니다. 예외로 빼지 않으면 **로그인조차 안 되거나 청구 화면이 막힙니다.**

**검증 방법**

1. 이 정책을 `dev-kim` 에 붙입니다.
2. Policy Simulator → Global Settings에서 `aws:RequestedRegion` 을 `us-east-1` 로 설정
3. `ec2:DescribeInstances` 실행 → **denied**
4. `ap-northeast-2` 로 바꿔 다시 실행 → **allowed**

⚠️ **`admin` 사용자에게는 붙이지 마세요.** 실수로 자신을 잠글 수 있습니다. 실습 후에는 `dev-kim` 에서도 떼어 냅니다.

### Step 4. IAM Access Analyzer로 외부 공개 리소스 찾기

**① 분석기 생성** — IAM → **액세스 분석기(Access Analyzer)** → **분석기 생성**

| 항목 | 값 |
|---|---|
| 분석기 유형 | **외부 액세스 분석(External access)** ⭐ 무료 |
| 이름 | `course-external-analyzer` |
| 신뢰 영역 | 현재 계정 |

> 🔴 **"미사용 액세스 분석(Unused access)"을 고르지 마세요. 유료입니다.**

**② 일부러 공개 리소스를 만들어 탐지시키기**

S3 버킷을 하나 만들고(이름은 전역 고유해야 하므로 `course-test-<본인영문이름>-<숫자>` 형태) **퍼블릭 액세스 차단을 해제한 뒤** 아래 버킷 정책을 붙입니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::course-test-hong-01/*"
    }
  ]
}
```

**③ 몇 분 뒤 분석기 화면 확인**

```
결과(Findings)
상태    리소스                          리소스 유형   외부 주체    액세스
활성    course-test-hong-01             S3 버킷      전체 공개    s3:GetObject
```

**이 화면이 뜨는 것이 목적입니다.** 실무에서 이 목록이 비어 있어야 정상입니다.

**④ 즉시 정리** — 버킷 정책 삭제 → 퍼블릭 액세스 차단 다시 켜기 → 버킷 삭제.
분석기 결과가 **해결됨(Resolved)** 으로 바뀌는 것을 확인합니다.

### Step 5. 액세스 키 수명 주기 실습 — 만들고, 교체하고, 지우기

앞으로 [05강](lesson-05.md) CLI에서 쓸 키를 여기서 만들고, 동시에 **유출 대응 절차**를 연습합니다.

**① 키 발급** — IAM → 사용자 → `admin` → **보안 자격 증명** 탭 → **액세스 키 만들기**

| 단계 | 선택 |
|---|---|
| 사용 사례 | **Command Line Interface (CLI)** |
| 확인 체크박스 | "위 권장 사항을 이해했으며..." 체크 |
| 설명 태그 | `local-cli-laptop` |

```
액세스 키:      AKIAV3EXAMPLE7QZ2K4
비밀 액세스 키:  wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

> 🔴 **비밀 액세스 키는 이 화면에서만 보입니다.** 창을 닫으면 다시 볼 수 없습니다. `.csv` 파일 다운로드 또는 안전한 곳에 저장하세요.
> 🔴 **절대 하면 안 되는 것** — 카카오톡·이메일·슬랙으로 전송, Git 커밋, 스크린샷 후 클라우드 동기화.

**② 유출을 가정하고 대응 절차 수행**

| 순서 | 작업 | 화면 |
|---|---|---|
| 1 | 해당 키 **비활성화** | 액세스 키 목록 → 작업 → **비활성화** → 상태가 `비활성`으로 |
| 2 | **새 키 발급** | 두 번째 키 생성 (사용자당 **최대 2개**) |
| 3 | 애플리케이션 교체 | (05강에서 이 키로 CLI 설정) |
| 4 | 사용 이력 조사 | 액세스 키 목록의 **마지막 사용 시각 / 리전 / 서비스** 확인 |
| 5 | 옛 키 **삭제** | 작업 → 삭제 |

**③ 마지막 사용 시각 확인**

```
액세스 키              상태     생성일         마지막 사용         리전            서비스
AKIAV3EXAMPLE7QZ2K4   비활성   2026-08-13   사용 안 함          해당 없음        해당 없음
AKIAV3EXAMPLE9WNM2P   활성     2026-08-13   2026-08-13 14:02   ap-northeast-2   sts
```

> 💡 **"마지막 사용: 사용 안 함"이면서 며칠 지난 키는 정리 대상**입니다. 실무 점검의 기본 항목입니다.

**④ 남길 키 하나만 유지** — [05강](lesson-05.md)에서 씁니다. 나머지는 삭제하세요.

### 💰 이번 강 비용

| 항목 | 프리 티어 | 이번 강 비용 | 과금 위험 |
|---|---|---|---|
| IAM 정책·사용자·키 | 상시 무료 | $0 | 없음 |
| **Access Analyzer (외부 액세스)** | **무료** | $0 | 🔴 **미사용 액세스 분석기는 유료** |
| S3 테스트 버킷 | ✅ 5GB | $0 | 삭제 안 하면 누적 |
| CloudTrail 이벤트 기록(90일) | 무료 | $0 | **추적(Trail) 생성 시 S3 저장 비용** |
| **합계** | | **$0** | |

### 🧹 리소스 정리 체크리스트

- [ ] 테스트 S3 버킷 **삭제** (퍼블릭 정책 해제 후)
- [ ] `Deny-Regions-Except-Seoul` 정책을 `dev-kim` 에서 **분리** (이후 실습 방해)
- [ ] 테스트 사용자 `dev-kim`, `dev-lee` **삭제**
- [ ] 액세스 키 — **1개만 남기고 나머지 삭제**
- [ ] Access Analyzer — **외부 액세스 분석기만 유지**(무료), 유료 유형이 있으면 삭제
- [ ] ⭐ `EC2-Course-Role` 유지 ([06강](lesson-06.md)에서 사용)
- [ ] IAM 대시보드 **보안 권장 사항**에 경고 없음 확인

---

## ⑤ 자주 하는 실수

### 리전 차단 정책을 자기 자신에게 붙여 콘솔이 먹통이 된다

```
액세스 거부됨: 이 페이지를 표시할 권한이 없습니다.
User: arn:aws:iam::123456789012:user/admin is not authorized to perform:
iam:ListUsers ... with an explicit deny in an identity-based policy
```

**원인** — `NotAction` 에 `iam:*`, `sts:*` 를 넣지 않고 리전 차단을 걸면 **글로벌 서비스가 전부 막힙니다.** IAM 요청은 `us-east-1` 로 가기 때문입니다.
**해결** — **루트로 로그인**해 해당 정책을 떼어 냅니다. (루트는 모든 정책의 영향을 받지 않습니다)
**예방** — 위험한 정책은 **테스트 사용자(`dev-kim`)에게 먼저 붙여 보고**, `admin` 에는 검증 후에 붙입니다. 이것이 루트를 봉인하되 삭제하지 않는 이유이기도 합니다.

### `IfExists` 를 써서 MFA 강제가 무력화된다

**증상** — MFA 없이도 삭제가 됩니다.
**원인** — `BoolIfExists` 는 **키가 없으면 조건을 건너뜁니다.** 일부 요청 경로에는 `aws:MultiFactorAuthPresent` 키 자체가 없습니다.
**해결** — 사람에 대해서만 엄격히 강제하려면 `Bool` 을 씁니다. 단, **서비스 역할까지 막지 않도록** 적용 대상을 사용자/그룹으로 한정하세요.

> 실무 권장 — 역할과 사용자에 **같은 정책을 붙이지 않습니다.** 사람용 정책과 서비스용 정책을 분리하면 이 문제가 사라집니다.

### 권한을 좁혔더니 배포가 실패한다

```
An error occurred (UnauthorizedOperation) when calling the RunInstances operation
```

**원인** — 실제로 필요한 액션 중 일부를 빠뜨렸습니다. `RunInstances` 하나에도 보통 `ec2:CreateTags`, `ec2:DescribeImages`, `iam:PassRole` 등이 함께 필요합니다.
**해결 순서**

1. **CloudTrail**에서 실패한 요청의 `eventName` 과 `errorCode` 확인
2. Access Analyzer의 **정책 생성(Generate policy)** 으로 실제 사용 액션 기반 초안 생성
3. 초안을 검토해 위험 액션만 제거하고 적용

> ⚠️ **`iam:PassRole` 을 자주 빠뜨립니다.** "EC2에 역할을 붙여서 시작"하려면 그 역할을 **넘길 권한**이 따로 필요합니다.
> 그리고 `PassRole` 은 넓게 주면 위험하므로 `Resource` 를 특정 역할 ARN으로 좁힙니다.

### 정책은 맞는데 S3 접근이 안 된다

**원인** — S3에는 **두 종류의 정책**이 있습니다.

| 종류 | 붙는 곳 | 역할 |
|---|---|---|
| **아이덴티티 기반 정책** | 사용자·역할 | "이 사람이 무엇을 할 수 있나" |
| **리소스 기반 정책(버킷 정책)** | 버킷 | "이 버킷에 누가 접근할 수 있나" |

둘 중 하나라도 **명시적으로 거부**하면 막힙니다. 또한 **퍼블릭 액세스 차단** 설정이 버킷 정책보다 먼저 적용됩니다.
**해결** — IAM 정책 → 버킷 정책 → 퍼블릭 액세스 차단 순서로 확인합니다. ([13강](../02-compute-data/lesson-13.md)에서 자세히)

### 액세스 키를 3개 만들려다 실패한다

```
An error occurred (LimitExceeded) when calling the CreateAccessKey operation:
Cannot exceed quota for AccessKeysPerUser: 2
```

**원인** — IAM 사용자당 액세스 키는 **최대 2개**입니다.
**이유** — 이 제한은 **교체(rotation)를 위한 설계**입니다. 새 키를 만들어 교체하고 → 옛 키를 지우는 흐름을 강제합니다.
**해결** — 안 쓰는 키를 삭제하고 다시 만듭니다.

### 유출된 키를 삭제만 하고 조사를 안 한다

**증상** — 키를 지웠는데 다음 달에 이상한 리전에서 청구서가 옵니다.
**원인** — 키가 살아 있는 동안 공격자가 **다른 IAM 사용자나 역할을 새로 만들어 두었을 수 있습니다.** 키를 지워도 그 사용자는 남습니다.
**해결** — 대응 절차 3~4단계(CloudTrail 조사 + 전 리전 리소스 확인)를 반드시 수행합니다. 확인 대상은 IAM 사용자/역할/키 목록, EC2 인스턴스, 그리고 **모든 리전**입니다.

---

## ⑥ 확인 문제

**1.** 사용자 `dev-kim` 에게 아래 두 정책이 붙어 있습니다. `dev-kim` 이 서울 리전에서 MFA 없이 로그인해 EC2 인스턴스를 **시작(RunInstances)** 하려 합니다. 성공할까요?

```json
// 정책 A
{ "Effect": "Allow", "Action": "ec2:*", "Resource": "*" }

// 정책 B
{
  "Effect": "Deny", "Action": "ec2:*", "Resource": "*",
  "Condition": { "Bool": { "aws:MultiFactorAuthPresent": "false" } }
}
```

<details>
<summary>답 보기</summary>

**실패합니다(거부).**

1. 정책 A가 `ec2:*` 를 허용합니다.
2. 정책 B는 **MFA 미인증 상태에서 `ec2:*` 를 거부**합니다. 지금 MFA 없이 로그인했으므로 조건이 참입니다.
3. **명시적 Deny 우선** → 거부.

**MFA로 다시 로그인하면** `aws:MultiFactorAuthPresent` 가 `true` 가 되어 정책 B의 조건이 거짓이 되고, 정책 A의 Allow만 남아 **성공**합니다.

> 이 구성이 실무에서 매우 유용합니다. "권한은 넉넉히 주되, MFA 없이는 아무것도 못 하게" 만드는 표준 패턴입니다.
</details>

**2.** 리전 차단 정책을 만들면서 `NotAction` 에 `iam:*` 과 `sts:*` 를 넣어야 하는 이유는 무엇인가요? 넣지 않으면 어떤 일이 벌어지나요?

<details>
<summary>답 보기</summary>

**IAM·STS는 글로벌 서비스이고, 그 요청은 `us-east-1` 로 전송되기 때문입니다.**

`aws:RequestedRegion` 이 `ap-northeast-2` 가 아니면 거부하는 정책을 만들면, IAM 요청은 항상 `us-east-1` 이므로 **전부 거부**됩니다.

**증상**
- 콘솔에서 IAM 화면이 열리지 않음
- `sts:AssumeRole` 실패 → 역할 전환 불가
- 심하면 **콘솔 로그인 자체가 정상 동작하지 않음**
- CloudFront·Route 53·Billing 화면도 막힘 (역시 글로벌)

**복구 방법** — 루트로 로그인해 해당 정책을 분리합니다. 루트는 IAM 정책의 제약을 받지 않습니다.

**교훈 두 가지**
1. 위험한 정책은 **테스트 사용자에게 먼저** 적용해 본다.
2. **루트를 봉인하되 없애지는 않는 이유**가 이런 상황 때문이다.
</details>

**3.** 후배가 실수로 액세스 키를 공개 GitHub 저장소에 커밋했습니다. **가장 먼저 할 일**은 무엇이고, 왜 그 순서인가요? 이후 절차도 순서대로 쓰세요.

<details>
<summary>답 보기</summary>

**가장 먼저 — 해당 키를 즉시 "비활성화"합니다.** (삭제가 아니라 비활성화)

| 순서 | 작업 | 이유 |
|---|---|---|
| 1 | **키 비활성화** | 몇 분 안에 스캔봇이 찾아 씁니다. 즉시 무력화가 최우선. **삭제보다 비활성화가 먼저**인 이유는 조사에 필요한 연결 정보를 남기기 위해서 |
| 2 | 새 키 발급 + 애플리케이션 교체 | 서비스 중단을 최소화 |
| 3 | **CloudTrail 조사** | 그 키가 무엇을 했는지, 언제부터인지 확인 |
| 4 | **전 리전** 이상 리소스 정리 | 공격자는 감시가 느슨한 리전을 씁니다. IAM 사용자/역할이 새로 생겼는지도 확인 |
| 5 | 유출된 키 삭제 | 조사 완료 후 |
| 6 | 재발 방지 | 역할로 전환, `.gitignore` 정비, 저장소 시크릿 스캔 도구 도입 |

**하면 안 되는 것** — "커밋을 지우면 되겠지" 하고 파일만 삭제하는 것. **Git 히스토리에는 그대로 남습니다.** 키 자체를 무효화해야 합니다.

**근본 해결** — 애초에 키를 쓰지 않는 구조로 갑니다. EC2·Lambda·ECS는 **역할**, GitHub Actions는 **OIDC**([24강](../03-serverless-automation/lesson-24.md))를 씁니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 평가 순서 | 기본 거부 → **명시적 Deny** → 상한(SCP·경계) → Allow |
| 명시적 Deny | **어떤 Allow보다 강하다** |
| 조건 키 | `MultiFactorAuthPresent` · `RequestedRegion` · `SourceIp` · 태그 |
| `IfExists` | **키가 없으면 조건 무시** — MFA 강제 시 주의 |
| 권한 경계 | 실효 권한 = 권한 정책 **∩** 경계 |
| 좁히는 절차 | 넓게 시작 → CloudTrail·Analyzer로 관찰 → 좁혀 고정 → 재점검 |
| Access Analyzer | 외부 액세스 분석은 **무료**, 미사용 액세스 분석은 유료 |
| 키 유출 대응 | **비활성화 → 새 키 → 조사 → 정리 → 삭제 → 재발 방지** |
| 액세스 키 제한 | 사용자당 **최대 2개** (교체를 위한 설계) |

**한 장 요약**

```
   요청 ─▶ [기본 거부] ─▶ [명시적 Deny?] ─▶ [상한?] ─▶ [Allow?] ─▶ 허용
                   ▲ 하나라도 걸리면 즉시 거부

   좁히기:  넓게 시작 → 관찰(CloudTrail/Analyzer) → 고정 → 위험 액션 Deny
   사고 시:  비활성화 → 교체 → 조사 → 정리 → 삭제
```

**오늘 반드시 기억할 한 가지**
> **Deny는 이긴다. 그리고 "권한이 있는데 안 된다"면 Deny·조건·상한 셋 중 하나다.**

**과제**
1. **MFA 강제 정책**과 **서울 리전 전용 정책**을 각각 작성하고, Policy Simulator에서 조건 값을 바꿔 가며 판정이 뒤집히는 화면을 캡처하세요.
2. Access Analyzer로 공개 리소스를 **일부러 만들어 탐지 → 해결(Resolved)** 까지 진행한 기록을 제출하세요.
3. 액세스 키 **비활성화 → 새 키 발급 → 옛 키 삭제** 전 과정을 캡처하고, "마지막 사용 시각" 화면도 함께 제출하세요.
4. `AdministratorAccess` 를 쓰지 않고 **이 과정의 실습에 필요한 최소 권한 정책**의 초안을 작성해 보세요. (완벽하지 않아도 됩니다. 무엇을 넣고 뺐는지 근거를 쓰는 것이 목적입니다)

---

[← 이전 03강](lesson-03.md) · [목차](README.md) · [다음 → 05강 AWS CLI와 CloudShell](lesson-05.md)
