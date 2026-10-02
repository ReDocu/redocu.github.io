# 03강 · IAM 핵심 — 사용자·그룹·역할·정책

> **AWS 학습 매뉴얼** · 🟢 대단원 01 · **03강 / 총 32강**
> [← 이전 02강](lesson-02.md) · [목차](README.md) · [다음 → 04강 최소 권한 실전](lesson-04.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 정책 JSON을 **"누가 무엇을 어디에 어떤 조건에서"** 라는 문장으로 읽을 수 있다.
- **사용자와 역할의 차이**를 설명하고 상황에 맞게 고를 수 있다.
- 역할의 **신뢰 정책과 권한 정책** 2단 구조를 이해하고 직접 만들 수 있다.
- 고객 관리형 정책을 **직접 작성**하고 Policy Simulator로 검증할 수 있다.
- EC2에 붙일 **IAM 역할**을 만들어 다음 강 실습을 준비할 수 있다.

---

## ② 왜 필요한가

[02강](lesson-02.md)에서 `AdministratorAccess` 를 붙인 사용자를 하나 만들었습니다. 편하지만, 실무에서 그대로 두면 이런 일이 벌어집니다.

**상황 1 — 신입 개발자에게 계정을 준다**
`AdministratorAccess` 를 주면 그 사람은 **운영 데이터베이스를 삭제할 수 있습니다.** 악의가 없어도 실수 한 번이면 끝입니다.

**상황 2 — EC2 안의 애플리케이션이 S3에 파일을 올려야 한다**
가장 흔한 잘못된 해법이 이것입니다.

```python
# ❌ 절대 하면 안 되는 코드
s3 = boto3.client(
    's3',
    aws_access_key_id='AKIAIOSFODNN7EXAMPLE',
    aws_secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
)
```

이 코드가 Git에 올라가는 순간 **스캔 봇이 몇 분 안에 찾아냅니다.** 서버 이미지를 복제해도 키가 따라갑니다. 키를 바꾸려면 모든 서버를 다시 배포해야 합니다.

AWS의 답은 **"키를 주지 말고 역할을 맡겨라"** 입니다.

```python
# ✅ 정답 — 키가 코드에 없다
s3 = boto3.client('s3')     # 인스턴스에 붙은 IAM 역할이 알아서 인증
```

이게 가능한 이유, 그리고 어떤 원리로 동작하는지가 오늘의 내용입니다. **IAM은 AWS에서 가장 먼저 배워야 하고 가장 자주 틀리는 주제**입니다. 앞으로 만들 모든 리소스가 여기에 기댑니다.

---

## ③ 개념 설명

### IAM의 네 가지 구성 요소

```
 ┌─────────────┐        ┌─────────────┐
 │   사용자     │  소속   │    그룹      │
 │   (User)    │ ─────▶ │   (Group)    │
 │  사람 1명    │        │  사람 묶음    │
 └─────────────┘        └─────────────┘
        │                      │
        │  연결                 │  연결
        ▼                      ▼
 ┌──────────────────────────────────────┐
 │           정책 (Policy)               │
 │   "무엇을 허용/거부하는가" JSON 문서    │
 └──────────────────────────────────────┘
        ▲
        │  연결
 ┌─────────────┐
 │   역할       │   ← 사람이 아니라 "맡는 것"
 │   (Role)    │      EC2·Lambda·다른 계정이 맡는다
 └─────────────┘
```

| 요소 | 정체 | 예 |
|---|---|---|
| **사용자(User)** | 사람 한 명에 대응하는 영구 자격 증명 | `admin`, `hong-gildong` |
| **그룹(Group)** | 사용자 묶음. **정책을 붙이는 대상** | `Developers`, `Billing-Viewers` |
| **정책(Policy)** | 허용/거부를 적은 JSON 문서 | `AmazonS3ReadOnlyAccess` |
| **역할(Role)** | 임시 자격 증명을 발급받아 **맡는** 권한 묶음 | `EC2-S3-ReadOnly-Role` |

> ⚠️ **그룹에는 역할을 붙일 수 없습니다.** 그룹에는 정책만 붙습니다. 시험 단골 함정입니다.

### 정책 JSON — 6개 요소로 읽기

가장 중요한 기술입니다. 아래 정책을 **문장으로** 읽어 봅시다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowReadEC2InSeoul",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeImages"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ap-northeast-2"
        }
      }
    }
  ]
}
```

> **"서울 리전에서(Condition) 모든 리소스에 대해(Resource) EC2 조회 작업을(Action) 허용한다(Effect)."**

| 요소 | 뜻 | 값 예시 |
|---|---|---|
| `Version` | 정책 문법 버전. **항상 `2012-10-17`** | 고정값 |
| `Sid` | 문장 이름표(선택). 사람이 읽기 위한 것 | `AllowReadEC2InSeoul` |
| `Effect` | **`Allow`** 또는 **`Deny`** | `Allow` |
| `Action` | 어떤 API 작업인가. `서비스:작업` 형식 | `s3:GetObject`, `ec2:*` |
| `Resource` | 어떤 리소스에 적용되나. ARN 형식 | `arn:aws:s3:::my-bucket/*` |
| `Condition` | 언제만 적용되나(선택) | IP·리전·MFA·태그 |

**ARN(Amazon Resource Name)** 은 AWS 리소스의 주소입니다.

```
arn:aws:s3:::my-bucket/reports/2026.csv
 │   │  │  │ │      │
 │   │  │  │ │      └─ 리소스 경로
 │   │  │  │ └──────── 리소스(버킷 이름)
 │   │  │  └────────── 계정 ID (S3는 전역이라 비어 있음)
 │   │  └───────────── 리전 (S3는 비어 있음)
 │   └──────────────── 서비스
 └──────────────────── 파티션 (aws / aws-cn / aws-us-gov)

arn:aws:ec2:ap-northeast-2:123456789012:instance/i-0abc123
```

> 💡 **`Resource: "*"` 는 "계정 안의 모든 해당 리소스"** 라는 뜻입니다. 편하지만 위험하므로, 왜 `*` 여야 하는지 설명할 수 없다면 좁혀야 합니다.
> 다만 `ec2:DescribeInstances` 처럼 **리소스 수준 권한을 지원하지 않는 조회 작업**은 `*` 밖에 쓸 수 없습니다. 이건 정상입니다.

### 정책의 세 종류

| 종류 | 특징 | 언제 쓰나 |
|---|---|---|
| **AWS 관리형 정책** | AWS가 만들고 관리. `AmazonS3ReadOnlyAccess` 등 | 표준적인 권한. 빠르게 시작할 때 |
| **고객 관리형 정책** | 내가 만들어 여러 대상에 재사용 | **실무 표준.** 우리 조직에 맞게 좁힌 권한 |
| **인라인 정책** | 특정 사용자/역할 하나에만 붙어 함께 사라짐 | 그 대상 전용의 예외적 권한 |

> **권장 순서** — 관리형으로 시작 → 실제 사용 액션을 확인 → **고객 관리형으로 좁혀 고정**. 인라인은 재사용·감사가 어려워 최소한으로 씁니다.

### 사용자 vs 역할 — 오늘의 핵심

|  | 사용자(User) | 역할(Role) |
|---|---|---|
| 대상 | **사람** | **애플리케이션·서비스·다른 계정** |
| 자격 증명 | 비밀번호 / 액세스 키 (**영구**) | STS 임시 자격 증명 (**만료됨**) |
| 발급 방식 | 미리 만들어 보관 | 필요할 때 **맡아서(assume)** 받음 |
| 유출 시 | 바꾸기 전까지 계속 유효 | 몇 시간 뒤 자동 만료 |
| 예 | `admin` 이 콘솔 로그인 | EC2가 S3를 읽음, Lambda가 DynamoDB에 씀 |

**역할이 왜 안전한가** — 세 가지 이유입니다.

1. **자격 증명이 어디에도 저장되지 않는다.** 코드에도 파일에도 없습니다.
2. **자동으로 만료되고 교체된다.** 보통 1시간 단위로 갱신됩니다.
3. **누가 맡을 수 있는지 신뢰 정책으로 제한된다.**

### 역할의 2단 구조 — 신뢰 정책 + 권한 정책

역할에는 **정책이 두 개** 붙습니다. 이 구분을 놓치면 역할을 이해할 수 없습니다.

```
 ┌──────────────── 역할: EC2-S3-ReadOnly-Role ────────────────┐
 │                                                            │
 │  ① 신뢰 정책 (Trust Policy)  — "누가 맡을 수 있나"          │
 │     Principal: ec2.amazonaws.com                           │
 │     Action:    sts:AssumeRole                              │
 │                                                            │
 │  ② 권한 정책 (Permission Policy) — "무엇을 할 수 있나"      │
 │     Action:   s3:GetObject, s3:ListBucket                  │
 │     Resource: arn:aws:s3:::my-bucket/*                     │
 └────────────────────────────────────────────────────────────┘
```

**① 신뢰 정책** (역할 생성 시 "신뢰할 수 있는 엔터티" 선택이 이것)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

> **"EC2 서비스가 이 역할을 맡는 것을 허용한다."**
> `Principal` 자리에는 서비스(`lambda.amazonaws.com`), 다른 계정(`arn:aws:iam::999...:root`), 외부 IdP(GitHub OIDC — [24강](../03-serverless-automation/lesson-24.md))가 올 수 있습니다.

**② 권한 정책** — 앞에서 본 일반 정책과 같은 형식입니다.

### 역할을 맡으면 실제로 무슨 일이 일어나나

```
 EC2 인스턴스
    │ ① "나한테 붙은 역할의 자격 증명 줘"
    ▼
 인스턴스 메타데이터 서비스 (169.254.169.254)
    │ ② STS에 AssumeRole 요청 (자동)
    ▼
 AWS STS
    │ ③ 임시 자격 증명 발급
    │    AccessKeyId / SecretAccessKey / SessionToken / Expiration
    ▼
 애플리케이션이 그 자격 증명으로 S3 호출
    (만료 전에 자동으로 갱신됨)
```

**임시 자격 증명은 이렇게 생겼습니다.**

```json
{
    "Credentials": {
        "AccessKeyId": "ASIAI44QH8DHBEXAMPLE",
        "SecretAccessKey": "je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY",
        "SessionToken": "AQoDYXdzEJr...<매우 긴 문자열>...==",
        "Expiration": "2026-08-13T15:30:00Z"
    }
}
```

> `AccessKeyId` 가 **`ASIA`** 로 시작하면 임시 자격 증명, **`AKIA`** 로 시작하면 영구 액세스 키입니다. 한눈에 구분하는 방법입니다.

### 그래서 언제 무엇을 쓰나 — 결정표

| 상황 | 선택 | 이유 |
|---|---|---|
| 사람이 콘솔에 로그인 | **IAM 사용자 + MFA** (조직이면 IAM Identity Center) | 사람에게는 로그인 주체가 필요 |
| EC2 안의 앱이 S3 접근 | **IAM 역할** (인스턴스 프로파일) | 키를 심을 필요가 없음 |
| Lambda가 DynamoDB 접근 | **IAM 역할** (실행 역할) | 함수마다 별도 역할 |
| 다른 AWS 계정이 내 버킷 접근 | **IAM 역할** (교차 계정) | 계정 간 신뢰 관계 |
| GitHub Actions가 배포 | **IAM 역할** (OIDC) | 저장소에 키를 두지 않음 |
| 내 노트북에서 CLI 사용 | 액세스 키 또는 SSO | [05강](lesson-05.md)에서 다룸 |

> **한 문장** — **"사람이 아니면 역할."** 이 원칙만 지켜도 실무 사고의 절반이 사라집니다.

### IAM Identity Center — 규모가 커지면

사용자가 수십 명, 계정이 여러 개가 되면 IAM 사용자를 하나씩 만드는 방식은 무너집니다.

| 구분 | IAM 사용자 | IAM Identity Center |
|---|---|---|
| 자격 증명 | 계정마다 따로 | **한 번 로그인해 여러 계정 사용** |
| 자격 증명 유형 | 영구 | **임시(자동 만료)** |
| 회사 계정 연동 | 어려움 | AD/Okta/Google 등과 연동 |
| 적합 규모 | 개인·소수 | 팀·조직 |

이 과정은 **개인 계정 하나**를 쓰므로 IAM 사용자로 진행하지만, 실무에 가면 대부분 Identity Center를 쓴다는 점을 알아 두세요.

---

## ④ 단계별 실습

> **이번 강도 리소스를 만들지 않아 비용은 $0** 입니다. IAM은 상시 무료입니다.
> 반드시 [02강](lesson-02.md)에서 만든 `admin` 사용자로 로그인한 상태에서 진행합니다.

### Step 1. 그룹을 만들고 사용자를 넣기

**작업 흐름** — IAM → **사용자 그룹(User groups)** → **그룹 생성**

| 항목 | 값 |
|---|---|
| 그룹 이름 | `Developers` |
| 권한 정책 연결 | `AmazonEC2ReadOnlyAccess` |

그룹을 만든 뒤 **사용자 2명**을 만들어 넣습니다.

IAM → 사용자 → **사용자 생성**

| 사용자 | 콘솔 액세스 | 그룹 |
|---|---|---|
| `dev-kim` | 활성화(비밀번호) | `Developers` |
| `dev-lee` | 활성화(비밀번호) | `Developers` |

> 💡 **왜 사용자마다 정책을 붙이지 않고 그룹을 쓰나요?**
> 사람이 20명이면 정책을 20번 붙여야 하고, 권한을 바꿀 때도 20번 고쳐야 합니다. 그룹에 붙이면 **한 번**입니다.
> 실무 원칙 — **정책은 그룹(또는 역할)에 붙이고, 사용자에게 직접 붙이지 않습니다.**

### Step 2. 고객 관리형 정책 직접 작성하기

"서울 리전에서 EC2를 **조회만** 할 수 있고, 시작·종료는 못 하게" 하는 정책을 만듭니다.

**작업 흐름** — IAM → **정책(Policies)** → **정책 생성** → **JSON** 탭

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDescribeEC2InSeoulOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ap-northeast-2"
        }
      }
    },
    {
      "Sid": "DenyDangerousActions",
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:StopInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

정책 이름: **`EC2-ReadOnly-Seoul-NoLaunch`**

> ⚠️ **`ec2:Describe*` 는 `Resource` 에 `*` 만 쓸 수 있습니다.** 조회 API는 리소스 수준 권한을 지원하지 않기 때문입니다.
> 정책 생성 화면에서 이런 경고가 나오는 것은 정상입니다.
> ```
> 이 작업은 리소스 수준 권한을 지원하지 않습니다. 모든 리소스를 선택해야 합니다.
> This action does not support resource-level permissions. Use "*" in the resource field.
> ```

이 정책을 `Developers` 그룹에 추가로 연결합니다.

### Step 3. Policy Simulator로 검증하기

정책을 만들었으면 **의도대로 동작하는지 시험**해야 합니다. 실제 리소스를 만들지 않고 판정할 수 있는 도구가 있습니다.

**작업 흐름** — IAM → **정책 시뮬레이터(Policy Simulator)** 열기 (또는 `policysim.aws.amazon.com`)

1. 왼쪽에서 **Users → `dev-kim`** 선택
2. **Select service** → `EC2`
3. **Select actions** → `DescribeInstances`, `RunInstances`, `TerminateInstances` 체크
4. **Run Simulation**

**결과**

```
Service   Action               Resource   Permission
EC2       DescribeInstances    *          allowed      ✅
EC2       RunInstances         *          denied       ❌  (explicit deny)
EC2       TerminateInstances   *          denied       ❌  (explicit deny)
```

**조건까지 시험하기** — `RunInstances` 행의 오른쪽 화살표를 펼치면 어떤 정책의 어느 `Sid` 가 판정했는지 나옵니다.

```
Matched statements:
  EC2-ReadOnly-Seoul-NoLaunch : DenyDangerousActions   ← 여기서 막혔다
```

> 💡 **Global Settings** 에서 `aws:RequestedRegion` 을 `us-east-1` 로 바꾼 뒤 다시 실행하면 `DescribeInstances` 도 **denied(implicitly denied)** 가 됩니다. 조건이 실제로 동작하는 것을 눈으로 확인하세요.

### Step 4. EC2용 IAM 역할 만들기 ⭐

**다음 강에서 실제로 쓸 역할**입니다. 반드시 만들어 두세요.

**작업 흐름** — IAM → **역할(Roles)** → **역할 생성**

| 단계 | 선택 |
|---|---|
| 신뢰할 수 있는 엔터티 유형 | **AWS 서비스** |
| 사용 사례 | **EC2** |
| 권한 정책 | `AmazonS3ReadOnlyAccess` + **`AmazonSSMManagedInstanceCore`** |
| 역할 이름 | **`EC2-Course-Role`** |

> 🔑 **`AmazonSSMManagedInstanceCore` 가 오늘의 숨은 주인공입니다.**
> 이 정책이 있어야 [06강](lesson-06.md)에서 **SSH 포트를 열지 않고** Session Manager로 인스턴스에 접속할 수 있습니다.

**만든 뒤 신뢰 관계 확인** — 역할 상세 → **신뢰 관계(Trust relationships)** 탭

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

> **"EC2 서비스만 이 역할을 맡을 수 있다."** Lambda는 이 역할을 맡을 수 없습니다. 맡게 하려면 `Principal` 에 `lambda.amazonaws.com` 을 추가해야 합니다.

### Step 5. 역할이 실제로 임시 자격 증명을 주는지 보기 (CloudShell)

콘솔 오른쪽 위 **터미널 아이콘( >_ )** 을 눌러 **CloudShell**을 엽니다. 브라우저에서 바로 열리는 리눅스 셸이며 **내 자격 증명이 이미 주입**되어 있습니다. (CLI는 [05강](lesson-05.md)에서 정식으로 다룹니다.)

```bash
$ aws sts get-caller-identity
{
    "UserId": "AIDAV3EXAMPLE7QZ2K4",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/admin"
}
```

> **"지금 나는 누구인가"** 를 알려 주는 명령입니다. IAM 문제를 만나면 **가장 먼저 치는 명령**이 이것입니다.

역할을 직접 맡아 보겠습니다. 먼저 내가 이 역할을 맡을 수 있도록 신뢰 정책에 나를 추가합니다.
(IAM → 역할 → `EC2-Course-Role` → 신뢰 관계 → **신뢰 정책 편집**)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": { "Service": "ec2.amazonaws.com" },
            "Action": "sts:AssumeRole"
        },
        {
            "Effect": "Allow",
            "Principal": { "AWS": "arn:aws:iam::123456789012:user/admin" },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

> `123456789012` 를 **본인 계정 ID**로 바꾸세요. (`aws sts get-caller-identity` 결과의 `Account` 값)

이제 CloudShell에서 역할을 맡아 봅니다.

```bash
$ aws sts assume-role \
    --role-arn arn:aws:iam::123456789012:role/EC2-Course-Role \
    --role-session-name test-session
{
    "Credentials": {
        "AccessKeyId": "ASIAV3EXAMPLE5NKQZP",
        "SecretAccessKey": "kJ8x...생략...",
        "SessionToken": "IQoJb3JpZ2luX2VjE...생략...",
        "Expiration": "2026-08-13T16:42:11+00:00"
    },
    "AssumedRoleUser": {
        "AssumedRoleId": "AROAV3EXAMPLE2M:test-session",
        "Arn": "arn:aws:sts::123456789012:assumed-role/EC2-Course-Role/test-session"
    }
}
```

**여기서 확인할 것 3가지**

| 항목 | 값 | 의미 |
|---|---|---|
| `AccessKeyId` | `ASIA...` 로 시작 | **임시** 자격 증명이다 |
| `SessionToken` | 존재함 | 임시 자격 증명은 이 토큰이 반드시 함께 필요 |
| `Expiration` | 1시간 뒤 | **자동으로 만료된다** |

> 🔒 **실험이 끝나면 신뢰 정책에서 방금 추가한 `admin` 항목을 지우세요.** 원래대로 EC2만 맡을 수 있게 되돌립니다.

### 💰 이번 강 비용

| 항목 | 프리 티어 | 이번 강 비용 | 과금 위험 |
|---|---|---|---|
| IAM 사용자·그룹·역할·정책 | **상시 무료** | $0 | 없음 |
| STS AssumeRole 호출 | 무료 | $0 | 없음 |
| CloudShell | 무료 | $0 | 홈 디렉터리 1GB 무료, 초과분만 과금 |
| **합계** | | **$0** | |

### 🧹 리소스 정리 체크리스트

- [ ] `EC2-Course-Role` **신뢰 정책에서 `admin` 항목 제거** (Step 5 실험분)
- [ ] 테스트 사용자 `dev-kim`, `dev-lee` 삭제 (또는 04강까지 유지)
- [ ] ⭐ **`EC2-Course-Role` 은 삭제하지 않습니다** — [06강](lesson-06.md)에서 사용
- [ ] `EC2-ReadOnly-Seoul-NoLaunch` 정책 유지 (04강에서 재사용)
- [ ] 실습 중 액세스 키를 만들었다면 **삭제**

**확인 방법** — IAM → 역할 목록에 `EC2-Course-Role` 이 있고, 사용자 목록에 `admin` 만 남아 있으면 정리 완료입니다.

---

## ⑤ 자주 하는 실수

### 역할을 만들 때 사용 사례를 잘못 골라 Principal이 어긋난다

```
An error occurred (AccessDenied) when calling the AssumeRole operation:
User: arn:aws:iam::123456789012:user/admin is not authorized to perform:
sts:AssumeRole on resource: arn:aws:iam::123456789012:role/EC2-Course-Role
```

**원인** — 역할의 **신뢰 정책에 나(또는 그 서비스)가 없습니다.** 권한 정책이 아무리 넓어도 신뢰 정책이 막으면 맡을 수 없습니다.
**해결** — 역할 → **신뢰 관계** 탭에서 `Principal` 을 확인하고 필요한 주체를 추가합니다.
**기억할 것** — **역할 문제는 90%가 신뢰 정책 문제**입니다. 권한 정책부터 뒤지지 마세요.

### 인스턴스에 역할을 붙였는데도 권한이 없다

```
An error occurred (AccessDenied) when calling the ListBuckets operation:
Access Denied
```

**원인 후보**

| 원인 | 확인 방법 |
|---|---|
| 역할의 **권한 정책**에 해당 액션이 없다 | IAM → 역할 → 권한 탭 |
| 인스턴스에 **역할이 안 붙었다** | EC2 → 인스턴스 → 보안 탭 → IAM 역할 |
| 역할을 붙였지만 **자격 증명이 캐시**되어 있다 | 몇 분 대기하거나 인스턴스 재시작 |
| 애플리케이션이 **다른 자격 증명**을 먼저 찾았다 | 환경 변수·`~/.aws/credentials` 확인 ([05강](lesson-05.md)) |

**해결 순서** — 인스턴스 안에서 `aws sts get-caller-identity` 를 먼저 칩니다. `assumed-role/역할이름/...` 이 나오면 역할은 제대로 붙은 것이고, 문제는 권한 정책입니다.

### `Resource` 에 ARN을 잘못 써서 아무것도 안 된다

**잘못된 예**

```json
"Resource": "arn:aws:s3:::my-bucket"          ← 버킷 자체만 지정
```

```json
"Action": "s3:GetObject",
"Resource": "arn:aws:s3:::my-bucket"          ← ❌ 객체를 못 읽음
```

**원인** — S3에서 **버킷 ARN과 객체 ARN은 다릅니다.**

| 대상 | ARN | 쓰이는 액션 |
|---|---|---|
| 버킷 | `arn:aws:s3:::my-bucket` | `s3:ListBucket` |
| **객체** | `arn:aws:s3:::my-bucket/*` | `s3:GetObject`, `s3:PutObject` |

**해결** — 둘 다 필요하면 둘 다 씁니다.

```json
"Resource": [
  "arn:aws:s3:::my-bucket",
  "arn:aws:s3:::my-bucket/*"
]
```

### 그룹에 역할을 붙이려다 안 된다

**원인** — **그룹에는 역할을 붙일 수 없습니다.** 그룹은 정책만 받습니다.
**해결** — 사용자가 역할을 맡게 하려면, 그룹에 **`sts:AssumeRole` 을 허용하는 정책**을 붙이고 역할의 신뢰 정책에 그 사용자/그룹의 주체를 넣습니다.

### 정책을 저장하려는데 문법 오류가 난다

```
This policy contains the following error: Has prohibited field Resource
```

**원인** — **신뢰 정책(Trust policy)에는 `Resource` 를 쓰지 않습니다.** 권한 정책과 문법이 조금 다릅니다.
**해결** — 신뢰 정책은 `Effect` / `Principal` / `Action`(보통 `sts:AssumeRole`) / `Condition`(선택)만 씁니다.

```
Syntax errors in policy. (JSON 오류)
```
**원인** — 마지막 항목 뒤의 쉼표, 따옴표 누락 같은 JSON 문법 오류. 콘솔 편집기가 줄 번호를 알려 줍니다.

### 액세스 키를 코드에 넣는다

**원인** — 역할을 몰라서, 또는 "일단 되게 하려고".
**해결** — EC2/Lambda/ECS에서는 **역할이 항상 정답**입니다. 로컬 개발이라면 [05강](lesson-05.md)의 프로파일 방식을 쓰고, 키가 Git에 올라가지 않도록 `.gitignore` 에 `.env` 와 `credentials` 를 넣습니다.
**이미 올렸다면** — 즉시 키 비활성화 → 새 키 발급 → CloudTrail 조사. 파일만 지우고 커밋해도 **Git 히스토리에는 남습니다.** 키 자체를 무효화해야 합니다. ([04강](lesson-04.md)에서 절차 실습)

---

## ⑥ 확인 문제

**1.** 다음 정책이 붙은 사용자가 **서울 리전에서 `i-0abc123` 인스턴스를 종료**하려 합니다. 성공할까요?

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "ec2:*", "Resource": "*" },
    {
      "Effect": "Deny",
      "Action": "ec2:TerminateInstances",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": { "aws:RequestedRegion": "us-east-1" }
      }
    }
  ]
}
```

<details>
<summary>답 보기</summary>

**실패합니다(거부).**

읽는 순서대로 따라가 봅니다.

1. 첫 문장: `ec2:*` **Allow** → 종료도 일단 허용됩니다.
2. 둘째 문장: `ec2:TerminateInstances` **Deny**, 조건은 `aws:RequestedRegion` 이 **`us-east-1`이 아닐 때**.
3. 지금 요청은 **서울(`ap-northeast-2`)** → 조건이 참 → **Deny 적용**.

**명시적 Deny는 어떤 Allow보다 강합니다.** 따라서 최종 결과는 거부입니다.

> 이 정책의 의도는 **"버지니아 북부에서만 인스턴스를 종료할 수 있다"** 입니다.
> `StringNotEquals` 라는 부정형 때문에 헷갈리기 쉬운데, **"us-east-1이 아니면 막는다" = "us-east-1에서만 허용"** 으로 읽으면 됩니다.
</details>

**2.** EC2 안의 애플리케이션이 S3를 읽어야 합니다. ① 액세스 키를 인스턴스에 저장하는 방법과 ② IAM 역할을 붙이는 방법의 차이를 **보안·운영 관점에서 3가지** 설명하세요.

<details>
<summary>답 보기</summary>

| 관점 | 액세스 키 저장 | IAM 역할 |
|---|---|---|
| **유출 위험** | 파일·이미지·Git에 남고 **영구 유효** | 자격 증명이 저장되지 않고 **몇 시간 뒤 만료** |
| **교체(rotation)** | 모든 서버를 다시 배포해야 함 | **자동 갱신**, 사람이 할 일 없음 |
| **감사** | 누가 그 키를 썼는지 구분 어려움 | CloudTrail에 `assumed-role/역할명/세션명` 으로 기록 |

**추가로** — 인스턴스를 AMI로 복제하면 키도 함께 복제됩니다. 역할은 인스턴스에 **부착 정보만** 있으므로 복제해도 자격 증명이 따라가지 않습니다.

**한 줄 결론** — *"사람이 아니면 역할."* EC2·Lambda·ECS·CI/CD 어디에서도 키를 심지 않습니다.
</details>

**3.** 팀원이 만든 역할을 EC2에 붙였는데 `sts:AssumeRole` 오류가 납니다. **권한 정책**과 **신뢰 정책** 중 어디를 먼저 봐야 하며, 무엇을 확인해야 할까요?

<details>
<summary>답 보기</summary>

**신뢰 정책(Trust policy)을 먼저 봅니다.**

`AssumeRole` 오류는 "이 역할을 **맡을 수 있는가**"의 문제이지, "맡은 뒤 **무엇을 할 수 있는가**"의 문제가 아닙니다. 후자가 권한 정책입니다.

**확인할 것**

```json
"Principal": { "Service": "ec2.amazonaws.com" }
```

- 사용 사례를 **Lambda**로 만들어 놓고 EC2에 붙이려 하지 않았는지 (`lambda.amazonaws.com` 으로 되어 있으면 EC2는 못 맡음)
- 계정 ID·서비스 이름 오타
- `Action` 이 `sts:AssumeRole` 인지

**진단 순서 정리**

```
① 신뢰 정책의 Principal 확인      ← AssumeRole 오류는 대부분 여기
② 역할이 인스턴스에 실제로 붙었는지
③ 인스턴스 안에서 aws sts get-caller-identity
④ 그다음에 권한 정책(AccessDenied가 날 때)
```
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 사용자 / 그룹 | 사람 / 사람 묶음. **정책은 그룹에 붙인다** |
| **역할(Role)** | 서비스·앱·타 계정이 **맡는** 권한. 임시 자격 증명 |
| 정책 6요소 | `Version` `Sid` `Effect` `Action` `Resource` `Condition` |
| ARN | 리소스 주소. **S3는 버킷과 객체(`/*`) ARN이 다르다** |
| 신뢰 정책 | **누가 맡을 수 있나** (`Principal` + `sts:AssumeRole`) |
| 권한 정책 | **무엇을 할 수 있나** |
| STS | 임시 자격 증명 발급. `ASIA...` 로 시작하면 임시 |
| 정책 종류 | AWS 관리형 / **고객 관리형(실무 표준)** / 인라인 |

**한 장 요약**

```
   사람     ──▶ IAM 사용자 (+MFA)  ──▶ 그룹 ──▶ 정책
   서비스   ──▶ IAM 역할
                 ├─ 신뢰 정책 : 누가 맡나  (AssumeRole 오류는 여기)
                 └─ 권한 정책 : 뭘 하나    (AccessDenied는 여기)
```

**오늘 반드시 기억할 한 가지**
> **사람이 아니면 역할.** 그리고 문제가 생기면 **`aws sts get-caller-identity`** 로 "지금 나는 누구인가"부터 확인합니다.

**과제**
1. 다음 3개 정책을 JSON으로 작성해 제출하세요.
   - ① 개발자용: EC2 조회 + 시작/중지 허용, **종료는 금지**
   - ② 경리용: Billing 읽기 전용
   - ③ 백업 서버용: 특정 S3 버킷에 **쓰기만** 허용(읽기·삭제 불가)
2. 각 정책에 대해 **거부되어야 하는 요청 2개씩**을 Policy Simulator로 검증하고 결과를 캡처하세요.
3. `EC2-Course-Role` 의 신뢰 관계 JSON을 캡처하고 **한 문장으로 해석**해 제출하세요.
4. "액세스 키를 쓰지 않고 EC2에서 S3에 접근하게 하는 방법"을 후배에게 설명하듯 5줄로 쓰세요.

---

[← 이전 02강](lesson-02.md) · [목차](README.md) · [다음 → 04강 최소 권한 실전](lesson-04.md)
