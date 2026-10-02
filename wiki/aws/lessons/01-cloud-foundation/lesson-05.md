# 05강 · AWS CLI와 CloudShell

> **AWS 학습 매뉴얼** · 🟢 대단원 01 · **05강 / 총 32강**
> [← 이전 04강](lesson-04.md) · [목차](README.md) · [다음 → 06강 리눅스 기본기와 첫 EC2](lesson-06.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- AWS CLI v2를 설치하고 **프로파일을 나눠** 안전하게 인증할 수 있다.
- 자격 증명 **탐색 순서**를 이해하고, 왜 EC2 안에서는 설정 없이 동작하는지 설명할 수 있다.
- `--query` 와 `--output` 으로 **필요한 값만 뽑아** 표로 볼 수 있다.
- `--dry-run` 으로 **실제 생성 없이 권한만 검증**할 수 있다.
- 콘솔·CLI·SDK·IaC 중 상황에 맞는 조작 방식을 **근거와 함께 선택**할 수 있다.

---

## ② 왜 필요한가

지금까지는 콘솔에서 클릭으로 작업했습니다. 콘솔은 훌륭하지만 세 가지를 못 합니다.

**① 반복** — 인스턴스 10대에 같은 태그를 붙이려면 클릭 수십 번입니다.

```bash
# CLI라면 한 줄
$ aws ec2 create-tags --resources i-01 i-02 i-03 --tags Key=Project,Value=aws-course
```

**② 기록과 공유** — "어떻게 만들었어요?"라는 질문에 콘솔은 스크린샷 20장으로 답해야 합니다. CLI는 명령 한 줄을 복사해 주면 끝입니다.

**③ 자동화** — 매일 새벽에 리소스를 정리하는 일을 콘솔로는 할 수 없습니다.

그리고 이 과정에서 특히 중요한 이유가 하나 더 있습니다.

> **정리 확인(cleanup verification)은 CLI로 해야 정확합니다.**
> 콘솔은 리전마다 화면이 달라 놓치기 쉽지만, `aws ec2 describe-instances` 는 **비었으면 비었다고 명확히 말해 줍니다.**
> 앞으로 모든 강의 정리 체크리스트가 CLI 명령으로 끝나는 이유입니다.

또한 12주차 IaC와 CI/CD는 **CLI를 안다는 전제** 위에서 진행됩니다. 오늘이 그 출발점입니다.

---

## ③ 개념 설명

### AWS를 조작하는 네 가지 경로

| 방식 | 장점 | 단점 | 언제 |
|---|---|---|---|
| **콘솔** | 직관적, 탐색에 좋음, 그림으로 이해 | 반복·재현·기록 불가 | 처음 배울 때, 상태 확인 |
| **CLI** | 반복·스크립트·정확한 기록 | 옵션을 알아야 함 | 반복 작업, 정리 확인, 자동화 |
| **SDK**(boto3 등) | 애플리케이션 코드에 통합 | 프로그래밍 필요 | 앱이 AWS를 호출할 때 |
| **IaC**(CloudFormation) | **재현·리뷰·일괄 삭제** | 학습 곡선 | 인프라 전체 관리 ([23강](../03-serverless-automation/lesson-23.md)) |

> **한 문장 기준** — **탐색은 콘솔, 반복은 CLI, 재현은 IaC.**
> 이 과정은 초반엔 콘솔+CLI를 병행하고, 12주차부터는 IaC로 넘어갑니다.

### 자격 증명 탐색 순서 — 가장 중요한 개념

CLI는 자격 증명을 **정해진 순서로** 찾습니다. 위에서 먼저 발견되면 아래는 보지 않습니다.

```
 ① 명령 옵션        --profile, --region
 ② 환경 변수        AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_PROFILE
 ③ CLI 자격 증명 파일  ~/.aws/credentials
 ④ CLI 설정 파일      ~/.aws/config
 ⑤ 컨테이너 자격 증명   (ECS 태스크 역할)
 ⑥ 인스턴스 프로파일   (EC2에 붙은 IAM 역할)  ← 메타데이터에서 자동 획득
```

**여기서 두 가지가 설명됩니다.**

1. **EC2 안에서 아무 설정 없이 `aws s3 ls` 가 되는 이유** → ①~⑤가 없으니 ⑥으로 내려가 **인스턴스에 붙은 역할**의 임시 자격 증명을 자동으로 씁니다. ([03강](lesson-03.md)에서 만든 역할이 여기서 쓰입니다)
2. **"분명히 프로파일을 바꿨는데 다른 계정으로 나가는" 사고의 원인** → 환경 변수(②)가 남아 있으면 파일(③)보다 **먼저 이깁니다.**

### 설정 파일 두 개

`aws configure` 를 실행하면 홈 디렉터리에 파일 두 개가 생깁니다.

```
~/.aws/credentials          ← 비밀 정보 (키)
[default]
aws_access_key_id = AKIAV3EXAMPLE7QZ2K4
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[course-admin]
aws_access_key_id = AKIAV3EXAMPLE9WNM2P
aws_secret_access_key = kJ8xB2...
```

```
~/.aws/config               ← 설정 (리전·출력 형식)
[default]
region = ap-northeast-2
output = json

[profile course-admin]      ← credentials 와 달리 "profile " 접두사가 붙는다
region = ap-northeast-2
output = json
```

> ⚠️ **`credentials` 파일은 평문입니다.** 공용 PC에서는 실습 후 삭제하세요.
> Windows 경로는 `C:\Users\<사용자>\.aws\` 입니다.

### 프로파일 — 사고를 막는 습관

계정이나 역할이 여러 개면 프로파일로 나눕니다.

```bash
aws s3 ls --profile course-admin      # 실습 계정
aws s3 ls --profile prod              # 운영 계정  ← 실수 방지
```

> 💡 **실무 팁** — 운영 계정 프로파일 이름에 `prod` 를 넣어 두면 명령을 칠 때마다 눈에 들어와 사고를 줄입니다.
> 더 안전한 방법은 운영 계정에 **아예 키를 두지 않고** 역할 전환/SSO로만 접근하는 것입니다.

### `--query` — JMESPath로 필요한 것만 뽑기

CLI 응답은 JSON이라 그대로 보면 수백 줄입니다. `--query` 로 필요한 값만 추립니다.

| 표현식 | 뜻 |
|---|---|
| `Reservations[*].Instances[*]` | 배열 전체 순회 |
| `Instances[0].InstanceId` | 첫 번째 요소의 필드 |
| `Images[*].[ImageId,Name]` | **여러 필드를 배열로** (표 출력에 좋음) |
| `Images[*].{ID:ImageId,이름:Name}` | **이름을 붙인 객체로** (헤더가 생김) |
| `Instances[?State.Name=='running']` | **필터** — 조건에 맞는 것만 |
| `length(Reservations)` | 개수 세기 |

### `--output` — 보기 좋게

| 형식 | 언제 |
|---|---|
| `json` (기본) | 프로그램이 처리할 때, 구조 확인 |
| `table` | **사람이 읽을 때** |
| `text` | 셸 스크립트에서 값 하나 꺼낼 때 (`| xargs`) |
| `yaml` | 사람이 읽는 구조적 출력 |

### `--dry-run` — 만들지 않고 권한만 확인

EC2 계열 명령은 `--dry-run` 을 붙이면 **실제로 만들지 않고 권한만 검사**합니다.

| 결과 | 뜻 |
|---|---|
| `DryRunOperation` | ✅ 권한 있음. 진짜로 실행하면 성공했을 것 |
| `UnauthorizedOperation` | 🚫 권한 없음 |

> 비싼 리소스를 만들기 전에 **먼저 `--dry-run`** 을 치는 습관은 비용과 사고를 함께 막습니다.

### CloudShell — 설치 없이 쓰는 CLI

콘솔 오른쪽 위 **`>_` 아이콘**을 누르면 브라우저에 리눅스 셸이 열립니다.

| 항목 | 내용 |
|---|---|
| 자격 증명 | **로그인한 사용자 권한이 자동 주입** (설정 불필요) |
| 홈 디렉터리 | **1GB 무료 보존** (리전별) |
| 초기화 | **120일 미사용 시 홈 디렉터리 삭제** |
| 비용 | **무료** (셸 자체) |
| 제한 | 세션 시간 제한, 무거운 빌드에는 부적합 |

> 💡 **CLI 설치가 막히는 학습자는 CloudShell로 모든 실습을 진행할 수 있습니다.** 회사 노트북 정책 때문에 설치가 안 되는 경우 유용합니다.

---

## ④ 단계별 실습

> **비용 $0.** 조회 명령과 S3 소량 사용만 합니다.

### Step 1. AWS CLI v2 설치

**Windows** (PowerShell)

```powershell
PS> msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

설치 후 **터미널을 새로 열어야** PATH가 적용됩니다.

**macOS**

```bash
$ curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
$ sudo installer -pkg AWSCLIV2.pkg -target /
```

**Linux (x86_64)**

```bash
$ curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
$ unzip awscliv2.zip
$ sudo ./aws/install
```

**설치 확인**

```bash
$ aws --version
aws-cli/2.17.42 Python/3.11.9 Windows/11 exe/AMD64
```

> ⚠️ `aws-cli/1.x` 가 나오면 **v1이 설치된 것**입니다. v2와 명령이 일부 다르므로 v1을 제거하고 v2를 설치하세요.

### Step 2. `aws configure` 로 프로파일 설정

[04강](lesson-04.md) Step 5에서 만든 액세스 키를 씁니다.

```bash
$ aws configure --profile course-admin
AWS Access Key ID [None]: AKIAV3EXAMPLE9WNM2P
AWS Secret Access Key [None]: kJ8xB2...생략...
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

**기본 프로파일도 같은 값으로 설정**해 두면 `--profile` 을 매번 안 써도 됩니다.

```bash
$ aws configure
```

**설정 확인**

```bash
$ aws configure list --profile course-admin
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile             course-admin           manual    --profile
access_key     ****************WNM2P shared-credentials-file
secret_key     ****************5nQ2k shared-credentials-file
    region           ap-northeast-2      config-file    ~/.aws/config
```

> **`Location` 열이 중요합니다.** 값이 어디서 왔는지 알려 줍니다. 환경 변수가 이기고 있으면 `env` 로 표시됩니다.

### Step 3. "지금 나는 누구인가" 확인 — 모든 문제의 출발점

```bash
$ aws sts get-caller-identity
{
    "UserId": "AIDAV3EXAMPLE7QZ2K4",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/admin"
}
```

> 🔑 **CLI에서 문제가 생기면 무조건 이 명령부터 칩니다.**
> 계정 ID가 예상과 다르면 프로파일이 잘못된 것이고, `assumed-role/...` 이 나오면 역할로 동작 중인 것입니다.

**리전도 확인합니다.**

```bash
$ aws configure get region
ap-northeast-2
```

### Step 4. 조회 명령과 `--output table`

**① 리전 목록**

```bash
$ aws ec2 describe-regions --query 'Regions[*].RegionName' --output table
-------------------------
|    DescribeRegions    |
+-----------------------+
|  ap-south-1           |
|  eu-north-1           |
|  eu-west-3            |
|  ap-northeast-2       |
|  ap-northeast-1       |
|  us-east-1            |
|  us-west-2            |
...
```

**② 서울 리전의 가용 영역**

```bash
$ aws ec2 describe-availability-zones \
    --query 'AvailabilityZones[*].[ZoneName,ZoneId,State]' \
    --output table
--------------------------------------------------
|             DescribeAvailabilityZones           |
+------------------+---------------+--------------+
|  ap-northeast-2a |  apne2-az1    |  available   |
|  ap-northeast-2b |  apne2-az2    |  available   |
|  ap-northeast-2c |  apne2-az3    |  available   |
|  ap-northeast-2d |  apne2-az4    |  available   |
+------------------+---------------+--------------+
```

> [01강](lesson-01.md)에서 콘솔로 봤던 AZ 목록입니다. `ZoneId`(`apne2-az1`)가 **계정과 무관한 물리적 식별자**입니다.

### Step 5. `--query` 로 원하는 값만 뽑기 ⭐

**① Amazon Linux 2023 최신 AMI 찾기** — [06강](lesson-06.md)에서 바로 쓸 값입니다.

```bash
$ aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
    --query 'reverse(sort_by(Images, &CreationDate))[:3].[ImageId,Name,CreationDate]' \
    --output table
----------------------------------------------------------------------------------------------
|                                       DescribeImages                                         |
+------------------------+---------------------------------------------+---------------------+
|  ami-0c9c942bd7bf113a2 |  al2023-ami-2023.5.20260805.0-kernel-6.1-x86_64 | 2026-08-05T10:22:11.000Z |
|  ami-0f3a6b1c8d2e94571 |  al2023-ami-2023.5.20260722.0-kernel-6.1-x86_64 | 2026-07-22T09:14:03.000Z |
|  ami-0b7d9e4f2a1c86032 |  al2023-ami-2023.5.20260710.0-kernel-6.1-x86_64 | 2026-07-10T11:41:55.000Z |
+------------------------+---------------------------------------------+---------------------+
```

**표현식 해석**

```
reverse(sort_by(Images, &CreationDate))[:3].[ImageId,Name,CreationDate]
  │        │                             │    └─ 뽑을 필드들
  │        └─ 생성일로 정렬               └─ 앞에서 3개만
  └─ 뒤집기(최신순)
```

> 💡 **더 간단한 방법** — AWS는 최신 AMI ID를 SSM 파라미터로 제공합니다.
> ```bash
> $ aws ssm get-parameter \
>     --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
>     --query 'Parameter.Value' --output text
> ami-0c9c942bd7bf113a2
> ```
> [09강](../02-compute-data/lesson-09.md) 시작 템플릿에서 이 방식을 씁니다.

**② 이름을 붙인 객체로 뽑기**

```bash
$ aws ec2 describe-vpcs \
    --query 'Vpcs[*].{ID:VpcId,CIDR:CidrBlock,기본:IsDefault}' \
    --output table
------------------------------------------------
|                 DescribeVpcs                  |
+--------+----------------+--------------------+
|  CIDR  |     ID         |       기본          |
+--------+----------------+--------------------+
| 172.31.0.0/16 | vpc-0a1b2c3d4e5f67890 | True |
+--------+----------------+--------------------+
```

**③ 필터로 조건에 맞는 것만**

```bash
$ aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running" \
    --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,PrivateIpAddress]' \
    --output table
```

지금은 인스턴스가 없으므로 빈 결과가 나옵니다.

```
----------------------
|DescribeInstances   |
+--------------------+
```

> ✅ **이 빈 화면이 정리 완료의 증거**입니다. 앞으로 모든 강의 정리 체크리스트에서 이 명령을 사용합니다.

### Step 6. `--dry-run` 으로 권한만 확인하기

```bash
$ aws ec2 run-instances \
    --image-id ami-0c9c942bd7bf113a2 \
    --instance-type t3.micro \
    --dry-run
An error occurred (DryRunOperation) when calling the RunInstances operation:
Request would have succeeded, but DryRun flag is set.
```

> **`DryRunOperation` 은 오류가 아니라 성공 신호입니다.** "진짜로 했으면 됐을 거야"라는 뜻입니다.
> 인스턴스는 **만들어지지 않았습니다.** 확인해 봅니다.

```bash
$ aws ec2 describe-instances --query 'length(Reservations)'
0
```

권한이 없을 때는 이렇게 나옵니다.

```
An error occurred (UnauthorizedOperation) when calling the RunInstances operation:
You are not authorized to perform this operation.
```

### Step 7. CLI만으로 S3 왕복하기

**① 버킷 생성** — 버킷 이름은 **전 세계에서 고유**해야 합니다.

```bash
$ aws s3 mb s3://course-cli-hong-20260813 --region ap-northeast-2
make_bucket: course-cli-hong-20260813
```

**② 파일 업로드**

```bash
$ echo "hello aws cli" > test.txt
$ aws s3 cp test.txt s3://course-cli-hong-20260813/
upload: ./test.txt to s3://course-cli-hong-20260813/test.txt
```

**③ 목록 확인**

```bash
$ aws s3 ls s3://course-cli-hong-20260813/
2026-08-13 14:22:07         14 test.txt
```

**④ 다운로드**

```bash
$ aws s3 cp s3://course-cli-hong-20260813/test.txt downloaded.txt
download: s3://course-cli-hong-20260813/test.txt to ./downloaded.txt
```

**⑤ 태그 붙이기** — 이 과정의 필수 습관입니다.

```bash
$ aws s3api put-bucket-tagging \
    --bucket course-cli-hong-20260813 \
    --tagging 'TagSet=[{Key=Project,Value=aws-course},{Key=Week,Value=W03}]'
```

**⑥ 삭제 (정리)**

```bash
$ aws s3 rb s3://course-cli-hong-20260813 --force
delete: s3://course-cli-hong-20260813/test.txt
remove_bucket: course-cli-hong-20260813
```

> 📌 **`s3` 와 `s3api` 의 차이** — `aws s3` 는 사람이 쓰기 편한 고수준 명령(`cp` `ls` `sync`), `aws s3api` 는 API를 그대로 노출하는 저수준 명령입니다. 세밀한 설정은 `s3api` 를 씁니다.

### Step 8. CloudShell에서 같은 명령 실행하기

콘솔 오른쪽 위 **`>_`** 아이콘 → CloudShell 실행.

```bash
[cloudshell-user@ip-10-134-30-12 ~]$ aws sts get-caller-identity
{
    "UserId": "AIDAV3EXAMPLE7QZ2K4",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/admin"
}
```

**`aws configure` 를 한 적이 없는데도 동작합니다.** 콘솔에 로그인한 사용자의 자격 증명이 자동으로 주입되기 때문입니다.

```bash
[cloudshell-user@ip-10-134-30-12 ~]$ aws configure list
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile                <not set>             None    None
access_key     ****************ABCD container-role
secret_key     ****************WXYZ container-role
    region           ap-northeast-2              env    AWS_REGION
```

> `Type` 이 **`container-role`** 입니다. 파일이 아니라 **역할**에서 온 자격 증명이라는 뜻입니다. 자격 증명 탐색 순서 ⑤에 해당합니다.

### 💰 이번 강 비용

| 항목 | 프리 티어 | 이번 강 비용 | 과금 위험 |
|---|---|---|---|
| CLI 조회 명령(`describe-*`) | 무료 | $0 | 없음 |
| S3 실습(파일 1개) | ✅ 5GB / 요청 일부 | $0 | 버킷 삭제 안 하면 누적 |
| CloudShell | 무료 | $0 | 홈 1GB 초과분만 과금 |
| `--dry-run` | 무료 | $0 | **실제 생성 안 됨** |
| **합계** | | **$0** | |

### 🧹 리소스 정리 체크리스트

- [ ] 실습 S3 버킷 삭제 — 확인:
  ```bash
  $ aws s3 ls
  (아무것도 출력되지 않으면 완료)
  ```
- [ ] `--dry-run` 으로 인스턴스가 생기지 않았는지 확인:
  ```bash
  $ aws ec2 describe-instances --query 'length(Reservations)'
  0
  ```
- [ ] 로컬 `test.txt`, `downloaded.txt` 삭제 (선택)
- [ ] ⭐ `~/.aws/` 설정과 액세스 키는 **유지** — 이후 전 과정에서 사용
- [ ] 공용 PC라면 `~/.aws/credentials` **삭제**

---

## ⑤ 자주 하는 실수

### 설치했는데 명령을 못 찾는다

```
aws : 'aws' 용어가 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다.
```
```
bash: aws: command not found
```

**원인** — PATH가 아직 적용되지 않았습니다.
**해결** — **터미널을 완전히 닫고 새로 엽니다.** VS Code에서 쓴다면 VS Code도 재시작합니다. 그래도 안 되면 설치 경로를 직접 확인합니다.

```powershell
PS> Get-Command aws
PS> & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" --version
```

### 자격 증명을 설정했는데 인증 오류가 난다

```
An error occurred (InvalidClientTokenId) when calling the GetCallerIdentity operation:
The security token included in the request is invalid.
```

| 원인 | 확인 |
|---|---|
| 키가 **비활성화/삭제**됨 | IAM → 사용자 → 보안 자격 증명 |
| 키를 복사할 때 **공백이나 줄바꿈**이 섞임 | `aws configure` 다시 실행 |
| **환경 변수**가 옛 키로 남아 있음 | `aws configure list` 의 `Type` 열 확인 |

**환경 변수가 이기고 있을 때 해결**

```bash
# Linux/macOS
$ unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
```
```powershell
# PowerShell
PS> Remove-Item Env:AWS_ACCESS_KEY_ID, Env:AWS_SECRET_ACCESS_KEY -ErrorAction SilentlyContinue
```

### 리전을 설정 안 해서 오류가 난다

```
You must specify a region. You can also configure your region by running "aws configure".
```

**원인** — 프로파일에 리전이 없습니다.
**해결** — `aws configure` 로 설정하거나 명령마다 `--region ap-northeast-2` 를 붙입니다.

> ⚠️ **더 위험한 경우** — 리전이 **다른 값으로** 설정되어 있으면 오류 없이 **엉뚱한 리전에 리소스가 만들어집니다.** 그래서 매번 `aws configure get region` 으로 확인하는 습관이 중요합니다.

### `--query` 를 썼는데 결과가 비어 있다

```bash
$ aws ec2 describe-instances --query 'Instances[*].InstanceId'
null
```

**원인** — 경로가 틀렸습니다. `describe-instances` 의 응답은 `Reservations` → `Instances` **2단 구조**입니다.
**해결** — 먼저 `--query` 없이 원본 JSON 구조를 확인합니다.

```bash
$ aws ec2 describe-instances | head -30
```

올바른 표현식:

```bash
$ aws ec2 describe-instances --query 'Reservations[*].Instances[*].InstanceId'
```

> 💡 **팁** — `--query` 는 **응답 JSON의 최상위부터** 경로를 씁니다. 요청 파라미터가 아니라 응답 구조를 보고 만듭니다.

### 따옴표 때문에 필터가 안 먹는다

**증상** — PowerShell에서 `--filters "Name=name,Values=al2023*"` 이 동작하지 않습니다.
**원인** — 셸마다 따옴표·와일드카드 처리 방식이 다릅니다.
**해결**

| 셸 | 권장 표기 |
|---|---|
| bash / zsh | 작은따옴표: `--query 'Images[*].ImageId'` |
| PowerShell | 큰따옴표 사용, 내부 작은따옴표는 그대로: `--query "Images[*].ImageId"` |
| cmd.exe | 큰따옴표만 사용 |

**가장 확실한 회피법** — 복잡한 명령은 **CloudShell(bash)** 에서 실행합니다. 문서의 예제도 bash 기준입니다.

### 프로파일을 바꿨는데 다른 계정으로 나간다

**원인** — 자격 증명 탐색 순서에서 **환경 변수(②)가 파일(③)보다 먼저** 적용됩니다.
**해결** — `aws configure list` 로 `Type`/`Location` 열을 확인하고, `env` 로 나오면 환경 변수를 지웁니다.
**예방** — 항상 `aws sts get-caller-identity` 로 **계정 ID를 눈으로 확인한 뒤** 작업을 시작합니다.

### `aws s3 rb` 가 실패한다

```
remove_bucket failed: s3://my-bucket An error occurred (BucketNotEmpty) when calling
the DeleteBucket operation: The bucket you tried to delete is not empty
```

**원인** — 버킷 안에 객체가 남아 있습니다.
**해결** — `--force` 를 붙입니다.

```bash
$ aws s3 rb s3://my-bucket --force
```

> ⚠️ **버전 관리가 켜진 버킷**은 `--force` 로도 지워지지 않습니다. 모든 **버전과 삭제 마커**를 지워야 합니다. ([13강](../02-compute-data/lesson-13.md)에서 다룹니다)

---

## ⑥ 확인 문제

**1.** EC2 인스턴스 안에서 `aws configure` 를 한 번도 하지 않았는데 `aws s3 ls` 가 정상 동작했습니다. 어떻게 가능한가요?

<details>
<summary>답 보기</summary>

**인스턴스에 붙은 IAM 역할(인스턴스 프로파일)** 덕분입니다.

CLI는 자격 증명을 순서대로 찾는데, ①명령 옵션 ②환경 변수 ③`~/.aws/credentials` ④config ⑤컨테이너 역할이 모두 없으면 **⑥ 인스턴스 메타데이터 서비스(169.254.169.254)** 에 물어봅니다. 여기서 역할의 **임시 자격 증명**을 받아 사용합니다.

**확인 방법**

```bash
$ aws sts get-caller-identity
{
    "Arn": "arn:aws:sts::123456789012:assumed-role/EC2-Course-Role/i-0abc123def456"
}
```

`assumed-role/...` 로 나오면 역할로 동작 중입니다.

> 이것이 **EC2에 액세스 키를 심으면 안 되는 이유**입니다. 심지어 심을 필요조차 없습니다.
</details>

**2.** 실행 중인 인스턴스의 **ID · 타입 · 프라이빗 IP** 만 표 형태로 보고 싶습니다. 명령을 쓰세요.

<details>
<summary>답 보기</summary>

```bash
$ aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running" \
    --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,PrivateIpAddress]' \
    --output table
```

**헤더까지 붙이고 싶다면** 객체 형태로 씁니다.

```bash
$ aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running" \
    --query 'Reservations[*].Instances[*].{ID:InstanceId,타입:InstanceType,IP:PrivateIpAddress}' \
    --output table
```

**틀리기 쉬운 점 3가지**

| 실수 | 올바른 것 |
|---|---|
| `Instances[*]` 로 시작 | `Reservations[*].Instances[*]` (2단 구조) |
| 필터를 `--query` 로 처리 | **서버 측 필터는 `--filters`** 가 빠르고 정확 |
| 상태 값을 `Running` | 소문자 `running` |
</details>

**3.** 비싼 리소스를 만드는 명령을 실행하기 전에 안전을 확인하는 방법 두 가지와, 각각 무엇을 확인해 주는지 쓰세요.

<details>
<summary>답 보기</summary>

**① `--dry-run` — 권한이 있는지**

```bash
$ aws ec2 run-instances --image-id ami-xxx --instance-type m5.large --dry-run
An error occurred (DryRunOperation) ... Request would have succeeded, but DryRun flag is set.
```

`DryRunOperation` 이면 권한 OK, `UnauthorizedOperation` 이면 권한 부족. **리소스는 만들어지지 않습니다.**

**② `aws sts get-caller-identity` + `aws configure get region` — 어느 계정·어느 리전인지**

```bash
$ aws sts get-caller-identity --query Account --output text
123456789012
$ aws configure get region
ap-northeast-2
```

계정과 리전을 잘못 잡으면 **엉뚱한 곳에 만들고 잊어버려** 비용이 새어 나갑니다.

> **추가로** — `describe` 로 현재 상태를 먼저 확인하는 습관도 중요합니다. CLI의 삭제 명령은 **확인 절차 없이 즉시 실행**되므로, 지우기 전에 대상을 눈으로 보는 것이 안전합니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 조작 4경로 | **탐색은 콘솔, 반복은 CLI, 재현은 IaC** |
| 자격 증명 순서 | 옵션 → 환경 변수 → credentials → config → 컨테이너 → **인스턴스 역할** |
| 프로파일 | `--profile` 로 계정 분리. 운영 계정은 이름에 `prod` |
| `aws sts get-caller-identity` | **문제 생기면 가장 먼저 치는 명령** |
| `--query` | JMESPath. `Reservations[*].Instances[*].[A,B]` |
| `--output table` | 사람이 읽을 때 |
| `--dry-run` | `DryRunOperation` = 권한 있음(만들어지진 않음) |
| CloudShell | 설치 불필요, 자격 증명 자동 주입, 홈 1GB |

**한 장 요약**

```
 확인 3종 세트 (실습 시작 전마다)
   aws sts get-caller-identity     ← 나는 누구인가
   aws configure get region        ← 어디에 만들 것인가
   aws ec2 describe-instances ...  ← 지금 무엇이 살아 있는가
```

**오늘 반드시 기억할 한 가지**
> **CLI는 "정리했는지"를 증명하는 도구입니다.**
> 콘솔은 못 본 것을 안 보이게 하지만, `describe` 명령은 남아 있으면 반드시 보여 줍니다.

**과제**
1. `aws --version`, `aws sts get-caller-identity`, `aws configure list` 세 명령의 출력을 캡처해 제출하세요.
2. `--query` 를 사용해 아래 세 가지를 각각 표로 출력하는 명령을 만들고 결과를 제출하세요.
   - ① 서울 리전의 AZ 이름과 ZoneId
   - ② 내 계정의 VPC ID와 CIDR
   - ③ Amazon Linux 2023 최신 AMI 3개의 ID와 생성일
3. S3 버킷을 CLI로 **생성 → 업로드 → 목록 → 태그 → 삭제**까지 왕복하고 전체 명령·출력 로그를 제출하세요.
4. 개인 **CLI 치트시트**를 만드세요. 조회 5개 · 생성 5개 · 삭제 5개 명령을 표로 정리합니다. (앞으로 계속 추가해 나갈 문서입니다)
5. 이번 주 Cost Explorer 일별 비용 스크린샷을 제출하세요. ($0에 가까워야 정상입니다)

---

[← 이전 04강](lesson-04.md) · [목차](README.md) · [다음 → 06강 리눅스 기본기와 첫 EC2](lesson-06.md)
