# 06강 · 리눅스 기본기와 첫 EC2

> **AWS 학습 매뉴얼** · 🟢 대단원 01 · **06강 / 총 32강**
> [← 이전 05강](lesson-05.md) · [목차](README.md) · [다음 → 07강 VPC 설계](lesson-07.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- EC2 인스턴스의 **6가지 구성 요소**를 설명하고 인스턴스 타입 이름을 해석할 수 있다.
- **인바운드 포트를 하나도 열지 않고** Session Manager로 서버에 접속할 수 있다.
- 리눅스에서 **패키지 설치 → 서비스 기동 → 로그 확인**까지 수행할 수 있다.
- 보안 그룹이 **상태 저장(stateful)** 방화벽이라는 의미를 실험으로 확인할 수 있다.
- 인스턴스를 **종료하고 잔여 리소스까지 정리**해 비용을 0으로 되돌릴 수 있다.

---

## ② 왜 필요한가

드디어 서버를 만듭니다. 그런데 대부분의 입문 자료는 이렇게 가르칩니다.

```
1. 키 페어(.pem)를 만든다
2. 보안 그룹에서 22번 포트를 0.0.0.0/0 으로 연다
3. ssh -i mykey.pem ec2-user@13.125.xxx.xxx
```

동작은 합니다. 그러나 **실무에서는 하면 안 되는 방식**입니다.

| 문제 | 결과 |
|---|---|
| 22번 포트를 전 세계에 열었다 | 몇 분 안에 자동 스캔·무차별 대입 공격이 시작됩니다 |
| `.pem` 키 파일을 관리해야 한다 | 잃어버리면 접속 불가, 유출되면 서버가 넘어감 |
| 누가 언제 접속했는지 기록이 없다 | 사고가 나도 추적할 수 없습니다 |
| 인스턴스에 퍼블릭 IP가 필요하다 | **시간당 $0.005 과금**, 공격 표면 증가 |

AWS의 현재 권장 방식은 **Session Manager**입니다. 인스턴스가 **바깥으로** 연결을 걸기 때문에 **인바운드 포트를 하나도 열지 않아도** 접속할 수 있고, 누가 언제 무슨 명령을 쳤는지 기록도 남습니다.

이 강에서는 처음부터 그 방식으로 배웁니다. [03강](lesson-03.md)에서 만든 `EC2-Course-Role` 에 `AmazonSSMManagedInstanceCore` 를 넣어 둔 것이 바로 이것을 위한 준비였습니다.

---

## ③ 개념 설명

### EC2 인스턴스를 만든다는 것 — 6가지 결정

인스턴스 하나를 만들 때 정하는 것은 결국 여섯 가지입니다.

```
 ┌──────────── EC2 인스턴스 ────────────┐
 │                                      │
 │  ① AMI          어떤 디스크 이미지로  │
 │  ② 인스턴스 타입  어느 정도 성능으로   │
 │  ③ 스토리지      EBS 볼륨 크기·종류   │
 │  ④ 네트워크      VPC·서브넷·보안 그룹 │
 │  ⑤ IAM 역할      어떤 AWS 권한으로    │
 │  ⑥ 사용자 데이터  부팅 시 뭘 실행할지  │
 └──────────────────────────────────────┘
```

| # | 요소 | 이번 강에서 | 심화 |
|---|---|---|---|
| ① | AMI | Amazon Linux 2023 | [09강 커스텀 AMI](../02-compute-data/lesson-09.md) |
| ② | 인스턴스 타입 | `t3.micro` (프리 티어) | [09강 타입 선택](../02-compute-data/lesson-09.md) |
| ③ | 스토리지 | 기본 gp3 8GB | [14강 EBS](../02-compute-data/lesson-14.md) |
| ④ | 네트워크 | 기본 VPC | [07강 직접 만든 VPC](lesson-07.md) |
| ⑤ | IAM 역할 | `EC2-Course-Role` | [03강](lesson-03.md) |
| ⑥ | 사용자 데이터 | 맛보기 | [09강 부트스트랩](../02-compute-data/lesson-09.md) |

### 인스턴스 타입 이름 읽기

```
    t3.micro
    │ │  │
    │ │  └── 크기 (nano < micro < small < medium < large < xlarge ...)
    │ └───── 세대 (숫자가 클수록 최신·대체로 가성비 좋음)
    └─────── 패밀리
```

| 패밀리 | 성격 | 대표 용도 |
|---|---|---|
| **T** (t3, t4g) | **버스터블** — 평소 적게 쓰다 필요할 때 순간 상승 | 개발 서버, 소규모 웹 |
| **M** (m5, m6i) | 범용 — CPU:메모리 = 1:4 | 일반 애플리케이션 서버 |
| **C** (c6i) | 컴퓨팅 최적화 | 배치 처리, 인코딩 |
| **R** (r6i) | 메모리 최적화 | 캐시, 인메모리 DB |
| **I / D** | 스토리지 최적화 | 대용량 로컬 디스크 |

> ⚠️ **T 계열의 CPU 크레딧 함정** — `t3` 는 평소 사용률이 낮을 때 **크레딧을 모아 두었다가** 부하가 오면 그 크레딧으로 성능을 냅니다.
> 크레딧이 바닥나면 **성능이 기준선(t3.micro는 vCPU의 10~20%)으로 떨어집니다.**
> 게다가 기본값인 **`unlimited` 모드**에서는 크레딧을 초과해 쓰면 **추가 요금이 붙습니다.** "프리 티어인데 왜 돈이 나오지?"의 숨은 원인 중 하나입니다.

### 인스턴스 수명 주기 — 중지와 종료는 다르다

```
                    ┌──────────────┐
      실행 ────────▶│   running    │◀──── 시작(start)
                    └──────┬───────┘
                    중지    │    종료
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐              ┌────────────┐
        │ stopped  │              │ terminated │
        │          │              │            │
        │ 💾 EBS 유지 │              │ 💾 EBS 삭제  │
        │ 💰 계속 과금 │              │ 💰 과금 종료 │
        │ 🔄 IP 변경  │              │ ❌ 복구 불가 │
        └──────────┘              └────────────┘
```

| 항목 | 중지(stop) | 종료(terminate) |
|---|---|---|
| 인스턴스 요금 | ❌ 안 나감 | ❌ 안 나감 |
| **EBS 루트 볼륨** | ✅ **유지 → 계속 과금** | 기본적으로 함께 삭제 |
| 퍼블릭 IP | **바뀜** (EIP가 아니면) | 반환 |
| 프라이빗 IP | 유지 | 반환 |
| 되돌리기 | 다시 시작 가능 | **불가능** |

> 🔴 **실습 리소스는 "중지"가 아니라 "종료"가 정답입니다.**
> 중지만 하면 EBS 8GB(월 약 $0.7)와 붙어 있는 EIP(월 약 $3.6)가 계속 나갑니다.

### 보안 그룹 — 상태 저장 방화벽

```
   인터넷 ──── 인바운드 규칙 검사 ────▶ 인스턴스
          ◀─── 응답은 자동 허용 ────────
                (상태를 기억하기 때문)
```

| 특징 | 내용 |
|---|---|
| 적용 대상 | **ENI(네트워크 인터페이스)** — 즉 인스턴스 단위 |
| 규칙 종류 | **허용(Allow)만 가능.** 거부 규칙이 없음 |
| 상태 | **상태 저장(stateful)** — 나간 요청의 응답은 자동 허용 |
| 기본값 | 인바운드 전부 차단 / **아웃바운드 전부 허용** |
| 소스 지정 | IP(CIDR) 또는 **다른 보안 그룹** |

> 💡 **"인바운드를 하나도 안 열었는데 `dnf install` 이 되는" 이유** — 패키지 다운로드는 **인스턴스가 먼저 나가는 요청**이고, 아웃바운드가 열려 있으며, 그 **응답은 상태 저장 덕분에 자동 허용**되기 때문입니다.

**소스를 다른 보안 그룹으로 지정하는 것**이 실무의 정석입니다.

```
ALB 보안 그룹 (인터넷 80/443 허용)
       │
       ▼  소스 = ALB 보안 그룹 ID
앱 보안 그룹 (80 허용)
       │
       ▼  소스 = 앱 보안 그룹 ID
DB 보안 그룹 (3306 허용)
```

IP는 바뀌지만 보안 그룹 ID는 안 바뀌므로 훨씬 견고합니다. [11강](../02-compute-data/lesson-11.md)·[15강](../02-compute-data/lesson-15.md)에서 이 구조를 만듭니다.

### 접속 방식 비교 — 왜 Session Manager인가

| 항목 | SSH (키 페어) | **Session Manager** |
|---|---|---|
| 인바운드 포트 | 22번 열어야 함 | **열 필요 없음** |
| 퍼블릭 IP | 대체로 필요 | **불필요** |
| 자격 증명 | `.pem` 파일 관리 | **IAM 권한으로 제어** |
| 접속 기록 | 별도 설정 필요 | **CloudTrail에 자동 기록** |
| 세션 로그 | 직접 구성 | S3/CloudWatch로 저장 가능 |
| 동작 원리 | 외부 → 인스턴스 (인바운드) | **인스턴스 → SSM (아웃바운드)** |

**동작 원리**

```
  인스턴스 (프라이빗도 가능)
      │  ① SSM Agent가 아웃바운드로 연결 유지
      ▼
  AWS Systems Manager
      ▲  ② 콘솔/CLI에서 세션 시작 요청
      │
  나 (콘솔 또는 CLI)
```

**필요한 조건 3가지** — 이 중 하나라도 빠지면 접속이 안 됩니다.

1. 인스턴스에 **SSM Agent** 설치 (Amazon Linux 2023·Ubuntu 최신 AMI에는 기본 포함)
2. IAM 역할에 **`AmazonSSMManagedInstanceCore`** 정책 ([03강](lesson-03.md)에서 준비함)
3. SSM 엔드포인트로 **나가는 경로** — 퍼블릭 서브넷(IGW) 또는 NAT 또는 **VPC 인터페이스 엔드포인트** ([07강](lesson-07.md))

---

## ④ 단계별 실습

> 💰 **예상 비용 $0 ~ 0.15** — t3.micro는 프리 티어(월 750시간)이지만, **퍼블릭 IPv4는 프리 티어 750시간을 초과하면 시간당 $0.005** 입니다.
> 오늘은 기본 VPC를 씁니다. 직접 만든 VPC는 [07강](lesson-07.md)부터입니다.

### Step 1. 최신 AMI ID 확인

```bash
$ aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' --output text
ami-0c9c942bd7bf113a2
```

이 값을 적어 둡니다. AMI ID는 **리전마다 다릅니다.**

### Step 2. 보안 그룹 만들기 — 인바운드 0개

```bash
$ VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
           --query 'Vpcs[0].VpcId' --output text)
$ echo $VPC_ID
vpc-0a1b2c3d4e5f67890

$ aws ec2 create-security-group \
    --group-name course-web-sg \
    --description "Course lesson06 web server" \
    --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=security-group,Tags=[{Key=Project,Value=aws-course},{Key=Week,Value=W03}]'
{
    "GroupId": "sg-0f1e2d3c4b5a69870"
}
```

> **인바운드 규칙을 하나도 추가하지 않습니다.** 이것이 오늘의 핵심입니다.
> 아웃바운드는 기본으로 전체 허용이라 별도 설정이 필요 없습니다.

### Step 3. 인스턴스 시작 — 콘솔 작업 흐름

CLI로도 되지만, 처음이므로 **콘솔에서 각 항목의 의미를 보며** 만듭니다.

EC2 → **인스턴스 시작(Launch instances)**

| 항목 | 값 | 왜 |
|---|---|---|
| 이름 | `course-web-01` | 태그 `Name` 이 됩니다 |
| AMI | **Amazon Linux 2023** | SSM Agent 기본 포함 |
| 인스턴스 유형 | **t3.micro** | 프리 티어 |
| **키 페어** | **키 페어 없이 계속 진행** ⭐ | Session Manager를 쓰므로 불필요 |
| 네트워크 | 기본 VPC, 아무 서브넷 | 07강에서 직접 만든 VPC로 이전 |
| **퍼블릭 IP 자동 할당** | **활성화** | 이번 강은 SSM 엔드포인트 접근 경로로 IGW를 사용 |
| 방화벽(보안 그룹) | **기존 보안 그룹 선택** → `course-web-sg` | 인바운드 0개 |
| 스토리지 | gp3 8GB (기본값) | 프리 티어 30GB 이내 |
| **고급 세부 정보 → IAM 인스턴스 프로파일** | **`EC2-Course-Role`** ⭐ | **이걸 빠뜨리면 접속 불가** |
| 고급 세부 정보 → 메타데이터 버전 | **IMDSv2 필수(required)** | 보안 권장 |

**태그 추가** — 고급 세부 정보 아래 태그 섹션에서

| 키 | 값 |
|---|---|
| `Project` | `aws-course` |
| `Owner` | `<본인 이름>` |
| `Week` | `W03` |

**인스턴스 시작** 후 상태를 확인합니다.

```bash
$ aws ec2 describe-instances \
    --filters "Name=tag:Project,Values=aws-course" "Name=instance-state-name,Values=running" \
    --query 'Reservations[*].Instances[*].{ID:InstanceId,상태:State.Name,사설IP:PrivateIpAddress,공인IP:PublicIpAddress}' \
    --output table
------------------------------------------------------------------------
|                          DescribeInstances                             |
+------------------------+------------+----------------+----------------+
|          ID            |  공인IP     |     사설IP      |     상태        |
+------------------------+------------+----------------+----------------+
|  i-0abc123def4567890   | 13.125.1.2 |  172.31.10.45  |   running      |
+------------------------+------------+----------------+----------------+
```

### Step 4. Session Manager로 접속 — 포트 0개로

**콘솔 방식** — EC2 → 인스턴스 선택 → **연결(Connect)** → **세션 관리자** 탭 → **연결**

```
sh-5.2$ whoami
ssm-user
```

> 🎉 **인바운드 규칙이 0개인 서버에 접속했습니다.** 키 파일도 없고 22번 포트도 닫혀 있습니다.

**연결 버튼이 비활성화되어 있다면** SSM이 아직 인스턴스를 인식하지 못한 것입니다. 1~2분 기다린 뒤 확인합니다.

```bash
$ aws ssm describe-instance-information \
    --query 'InstanceInformationList[*].[InstanceId,PingStatus,PlatformName]' \
    --output table
-------------------------------------------------------------
|              DescribeInstanceInformation                    |
+-----------------------+-----------+-------------------------+
|  i-0abc123def4567890  |  Online   |  Amazon Linux           |
+-----------------------+-----------+-------------------------+
```

`Online` 이 아니면 [⑤ 자주 하는 실수](#-자주-하는-실수)의 첫 항목을 보세요.

**CLI 방식** (Session Manager 플러그인 설치 필요)

```bash
$ aws ssm start-session --target i-0abc123def4567890

Starting session with SessionId: admin-0a1b2c3d4e5f
sh-5.2$
```

### Step 5. 리눅스 기본 — 웹 서버 올리기

접속한 셸에서 진행합니다. `ssm-user` 는 기본적으로 `sudo` 를 쓸 수 있습니다.

**① 내가 누구인지, 어디에 있는지**

```bash
sh-5.2$ whoami
ssm-user
sh-5.2$ pwd
/usr/bin
sh-5.2$ cd ~ && pwd
/home/ssm-user
```

**② 시스템 정보 확인**

```bash
sh-5.2$ cat /etc/os-release | head -3
NAME="Amazon Linux"
VERSION="2023"
ID="amzn"

sh-5.2$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1  8.0G  1.6G  6.5G  20% /

sh-5.2$ free -m
               total        used        free      shared  buff/cache   available
Mem:             949         182         512           0         254         627
```

> 💡 **t3.micro는 메모리가 1GB(약 949MB 사용 가능)입니다.** 무거운 것을 올리면 바로 부족해집니다.

**③ 인스턴스가 자기 자신에 대해 아는 것 — 메타데이터(IMDSv2)**

```bash
sh-5.2$ TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
                -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

sh-5.2$ curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/instance-id
i-0abc123def4567890

sh-5.2$ curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/placement/availability-zone
ap-northeast-2a
```

> **IMDSv2는 토큰을 먼저 받아야 합니다.** IMDSv1(토큰 없이 바로 조회)은 SSRF 공격에 악용될 수 있어 비활성화하는 것이 권장입니다.
> [09강](../02-compute-data/lesson-09.md)에서 이 값들을 웹 페이지에 출력해 로드밸런싱을 눈으로 확인할 때 다시 씁니다.

**④ IAM 역할이 붙어 있는지 확인**

```bash
sh-5.2$ aws sts get-caller-identity
{
    "UserId": "AROAV3EXAMPLE2M:i-0abc123def4567890",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/EC2-Course-Role/i-0abc123def4567890"
}
```

> **`assumed-role/EC2-Course-Role/...`** — 키를 심지 않았는데 AWS 권한이 있습니다. [03강](lesson-03.md)에서 배운 역할이 실제로 동작하는 순간입니다.

```bash
sh-5.2$ aws s3 ls
2026-08-13 05:22:07 course-cli-hong-20260813
```

역할에 `AmazonS3ReadOnlyAccess` 가 있으므로 조회가 됩니다. 쓰기를 시도하면 거부됩니다.

**⑤ nginx 설치와 기동**

```bash
sh-5.2$ sudo dnf install -y nginx
Last metadata expiration check: 0:00:12 ago on Thu Aug 13 14:31:02 2026.
Dependencies resolved.
================================================================================
 Package              Arch      Version                Repository        Size
================================================================================
Installing:
 nginx                x86_64    1:1.24.0-1.amzn2023    amazonlinux       33 k
Installing dependencies:
 nginx-core           x86_64    1:1.24.0-1.amzn2023    amazonlinux      1.3 M
...
Complete!
```

> 이 설치가 성공했다는 것은 **인스턴스가 인터넷으로 나갈 수 있다**는 뜻입니다. 인바운드는 0개인데도 말입니다. (상태 저장 방화벽 + 아웃바운드 허용)

```bash
sh-5.2$ sudo systemctl enable --now nginx
Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service → /usr/lib/systemd/system/nginx.service.

sh-5.2$ systemctl status nginx
● nginx.service - The nginx HTTP and reverse proxy server
     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: disabled)
     Active: active (running) since Thu 2026-08-13 14:33:21 UTC; 5s ago
   Main PID: 3241 (nginx)
      Tasks: 2 (limit: 1112)
     Memory: 2.1M
```

| 명령 | 뜻 |
|---|---|
| `systemctl start` | 지금 실행 |
| `systemctl enable` | **부팅 시 자동 실행** 등록 |
| `enable --now` | 둘 다 한 번에 |
| `systemctl status` | 상태 확인 |

**⑥ 내 안에서 접속 테스트**

```bash
sh-5.2$ curl -I localhost
HTTP/1.1 200 OK
Server: nginx/1.24.0
Date: Thu, 13 Aug 2026 14:34:02 GMT
Content-Type: text/html
Content-Length: 5754
```

**⑦ 페이지 내용 바꾸기**

```bash
sh-5.2$ echo "<h1>Hello from $(hostname)</h1>" | sudo tee /usr/share/nginx/html/index.html
<h1>Hello from ip-172-31-10-45.ap-northeast-2.compute.internal</h1>

sh-5.2$ curl localhost
<h1>Hello from ip-172-31-10-45.ap-northeast-2.compute.internal</h1>
```

**⑧ 로그 보기**

```bash
sh-5.2$ sudo journalctl -u nginx --no-pager -n 5
Aug 13 14:33:21 ip-172-31-10-45 systemd[1]: Starting nginx.service...
Aug 13 14:33:21 ip-172-31-10-45 nginx[3239]: nginx: configuration file /etc/nginx/nginx.conf test is successful
Aug 13 14:33:21 ip-172-31-10-45 systemd[1]: Started nginx.service.

sh-5.2$ sudo tail -3 /var/log/nginx/access.log
127.0.0.1 - - [13/Aug/2026:14:34:02 +0000] "HEAD / HTTP/1.1" 200 0 "-" "curl/8.5.0"
```

### Step 6. 보안 그룹 실험 — 열고, 확인하고, 닫기

지금 브라우저에서 퍼블릭 IP로 접속하면 **연결되지 않습니다.** 인바운드가 0개이기 때문입니다.

**① 내 공인 IP 확인**

```bash
$ curl -s https://checkip.amazonaws.com
203.0.113.45
```

**② 내 IP만 80번 허용**

```bash
$ aws ec2 authorize-security-group-ingress \
    --group-id sg-0f1e2d3c4b5a69870 \
    --protocol tcp --port 80 \
    --cidr 203.0.113.45/32
{
    "Return": true,
    "SecurityGroupRules": [
        {
            "SecurityGroupRuleId": "sgr-0123456789abcdef0",
            "IsEgress": false,
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIpv4": "203.0.113.45/32"
        }
    ]
}
```

> 🔴 **`0.0.0.0/0` 을 쓰지 않습니다.** `/32` 는 "이 IP 하나만"이라는 뜻입니다.

**③ 브라우저에서 `http://<퍼블릭IP>` 접속** → `Hello from ip-172-31-...` 이 보이면 성공입니다.

**④ 규칙을 지우고 다시 확인**

```bash
$ aws ec2 revoke-security-group-ingress \
    --group-id sg-0f1e2d3c4b5a69870 \
    --protocol tcp --port 80 --cidr 203.0.113.45/32
{ "Return": true }
```

브라우저를 새로고침하면 이제 **연결되지 않습니다.** 하지만 **Session Manager 접속은 여전히 됩니다.**

> ✅ **이 실험이 오늘의 핵심 학습입니다.** 관리 접속(SSM)과 서비스 접속(80번)이 **완전히 분리**되어 있습니다.

### Step 7. 중지 → 시작으로 IP가 바뀌는 것 확인

```bash
$ aws ec2 stop-instances --instance-ids i-0abc123def4567890
$ aws ec2 wait instance-stopped --instance-ids i-0abc123def4567890

$ aws ec2 start-instances --instance-ids i-0abc123def4567890
$ aws ec2 wait instance-running --instance-ids i-0abc123def4567890

$ aws ec2 describe-instances --instance-ids i-0abc123def4567890 \
    --query 'Reservations[0].Instances[0].{공인IP:PublicIpAddress,사설IP:PrivateIpAddress}'
{
    "공인IP": "3.36.77.201",      ← 바뀌었다
    "사설IP": "172.31.10.45"      ← 그대로
}
```

> 💡 **퍼블릭 IP가 바뀌므로 DNS나 방화벽에 IP를 적어 두면 안 됩니다.**
> 고정이 필요하면 **탄력적 IP(EIP)** 를 쓰지만, EIP도 **시간당 $0.005 과금**됩니다.
> 실무에서는 IP를 고정하는 대신 **로드밸런서 뒤에 두는 것**이 정답입니다 ([11강](../02-compute-data/lesson-11.md)).

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| EC2 t3.micro | ✅ 750시간/월(12개월) | $0 (초과 시 약 $0.08) | 약 $9.4 |
| EBS gp3 8GB | ✅ 30GB/월 | $0 | 약 $0.7 |
| **퍼블릭 IPv4** | ✅ 750시간/월(12개월) | $0 (초과 시 $0.03) | **약 $3.6** |
| Session Manager | 무료 | $0 | $0 |
| 보안 그룹·VPC | 무료 | $0 | $0 |
| **합계** | | **$0 ~ 0.15** | **약 $13.7** |

> 🔴 **가장 흔한 사고 3가지**
> ① 인스턴스를 **중지만** 하고 넘어감 → EBS·EIP 계속 과금
> ② 인스턴스 종료 후 **EBS 볼륨이 남음** (루트 볼륨을 "종료 시 삭제 안 함"으로 만든 경우)
> ③ **탄력적 IP를 만들고 연결 해제만** 함 → 미사용 EIP도 과금

### 🧹 리소스 정리 체크리스트

```bash
# 1) 인스턴스 종료 (중지 아님!)
$ aws ec2 terminate-instances --instance-ids i-0abc123def4567890
$ aws ec2 wait instance-terminated --instance-ids i-0abc123def4567890

# 2) 실행 중 인스턴스가 없는지 확인  ← 비어 있어야 함
$ aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running,stopped" \
    --query 'Reservations[*].Instances[*].InstanceId' --output text

# 3) 사용 가능(미연결) 상태로 남은 EBS 볼륨 확인  ← 비어 있어야 함
$ aws ec2 describe-volumes --filters "Name=status,Values=available" \
    --query 'Volumes[*].[VolumeId,Size]' --output text

# 4) 미사용 탄력적 IP 확인  ← 비어 있어야 함
$ aws ec2 describe-addresses \
    --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]' --output text

# 5) 실습 보안 그룹 삭제
$ aws ec2 delete-security-group --group-id sg-0f1e2d3c4b5a69870
```

- [ ] 인스턴스 **종료(terminated)** 확인
- [ ] 미연결 EBS 볼륨 0개
- [ ] 미사용 EIP 0개
- [ ] 실습 보안 그룹 삭제
- [ ] ⭐ `EC2-Course-Role` 은 **유지** ([07강](lesson-07.md)에서 사용)
- [ ] 다음 날 Cost Explorer에서 EC2 비용 확인

---

## ⑤ 자주 하는 실수

### Session Manager 연결 버튼이 회색이고 눌리지 않는다

```
연결할 수 없음: 이 인스턴스에 대해 SSM Agent를 사용할 수 없습니다.
We weren't able to connect to your instance.
```

**원인 4가지를 순서대로 확인**합니다.

| # | 확인 | 명령/화면 |
|---|---|---|
| 1 | **IAM 역할이 붙었나** | EC2 → 인스턴스 → 보안 탭 → IAM 역할 |
| 2 | 역할에 **`AmazonSSMManagedInstanceCore`** 가 있나 | IAM → 역할 → 권한 |
| 3 | 인스턴스가 **밖으로 나갈 수 있나** | 퍼블릭 서브넷+IGW / NAT / VPC 엔드포인트 |
| 4 | **1~2분 기다렸나** | `aws ssm describe-instance-information` |

```bash
$ aws ssm describe-instance-information \
    --query 'InstanceInformationList[*].[InstanceId,PingStatus]' --output text
i-0abc123def4567890    Online
```

**목록에 아예 없다면** 1~3번 문제입니다. **역할을 나중에 붙였다면** 인스턴스를 재부팅하면 대개 해결됩니다.

> 📌 [08강](lesson-08.md)에서 **프라이빗 서브넷**의 인스턴스에 접속할 때 이 문제를 다시 만납니다. 그때는 **VPC 인터페이스 엔드포인트 3종**(`ssm`, `ssmmessages`, `ec2messages`)이 답입니다.

### 브라우저에서 접속이 안 된다 (타임아웃)

```
이 사이트에 연결할 수 없음 — 13.125.1.2에서 응답하는 데 시간이 너무 오래 걸립니다.
ERR_CONNECTION_TIMED_OUT
```

**타임아웃**과 **연결 거부**는 원인이 다릅니다.

| 증상 | 의미 | 원인 |
|---|---|---|
| **타임아웃** | 패킷이 도달조차 못 함 | **보안 그룹/NACL/라우팅** |
| **Connection refused** | 도달했지만 듣는 프로그램이 없음 | **서비스가 안 떠 있음** |

**확인 순서**

```bash
# ① 보안 그룹에 규칙이 있나
$ aws ec2 describe-security-groups --group-ids sg-0f1e2d3c4b5a69870 \
    --query 'SecurityGroups[0].IpPermissions'

# ② 내 IP가 바뀌지 않았나 (공유기 재시작·카페 이동 시 바뀝니다)
$ curl -s https://checkip.amazonaws.com

# ③ 인스턴스 안에서 서비스가 떠 있나
sh-5.2$ curl -I localhost
sh-5.2$ sudo ss -tlnp | grep :80
```

### 중지했는데 요금이 계속 나온다

**원인** — 중지는 **컴퓨팅 요금만** 멈춥니다.

| 계속 과금되는 것 | 월 비용(대략) |
|---|---|
| EBS 루트 볼륨 8GB | 약 $0.7 |
| 탄력적 IP(연결 여부 무관) | 약 $3.6 |
| 스냅샷·AMI | 용량만큼 |

**해결** — 실습은 **종료(terminate)** 로 마칩니다.

### 인스턴스를 지웠는데 EBS 볼륨이 남았다

```bash
$ aws ec2 describe-volumes --filters "Name=status,Values=available" \
    --query 'Volumes[*].[VolumeId,Size,CreateTime]' --output table
-----------------------------------------------------
|  vol-0a1b2c3d4e5f67890 |  8  |  2026-08-13T14:20 |
-----------------------------------------------------
```

**원인** — 인스턴스 시작 시 스토리지 설정의 **"종료 시 삭제(Delete on termination)"** 를 해제했거나, 추가 볼륨을 붙였습니다. 추가 볼륨은 **기본값이 유지**입니다.
**해결**

```bash
$ aws ec2 delete-volume --volume-id vol-0a1b2c3d4e5f67890
```

**예방** — 매 강 정리 체크리스트의 `status=available` 조회를 습관화합니다.

### `sudo` 없이 설치하려다 실패한다

```
Error: This command has to be run with superuser privileges (under the root user on most systems).
```

**원인** — 패키지 설치는 관리자 권한이 필요합니다.
**해결** — `sudo` 를 붙입니다. `ssm-user` 는 `sudo` 권한을 가지고 있습니다.

### `yum` 이 없다고 나온다

```
sh-5.2$ sudo yum install nginx
sudo: yum: command not found
```

**원인** — Amazon Linux **2023**부터 패키지 관리자가 `dnf` 입니다. (Amazon Linux 2는 `yum`)
**해결** — `sudo dnf install -y nginx`
**참고** — Ubuntu 계열이면 `sudo apt update && sudo apt install -y nginx` 입니다.

### nginx를 껐다 켰더니 부팅 후 안 뜬다

**원인** — `systemctl start` 만 했습니다. 이것은 **지금만** 실행합니다.
**해결** — `sudo systemctl enable nginx` 로 부팅 시 자동 실행을 등록합니다. (`enable --now` 면 둘 다)

> 이 문제는 [09강 사용자 데이터](../02-compute-data/lesson-09.md)에서 다시 중요해집니다. Auto Scaling이 만든 새 인스턴스는 **부팅만으로** 서비스가 떠야 하기 때문입니다.

---

## ⑥ 확인 문제

**1.** 보안 그룹의 인바운드 규칙이 **하나도 없는** 인스턴스에서 `sudo dnf install -y nginx` 가 성공했습니다. 어떻게 가능한가요?

<details>
<summary>답 보기</summary>

**보안 그룹이 상태 저장(stateful) 방화벽이고, 아웃바운드가 기본 전체 허용이기 때문입니다.**

```
 인스턴스 ──① 패키지 서버로 요청(아웃바운드) ──▶ 리포지토리
          ◀─② 응답(인바운드처럼 보이지만 자동 허용)──
```

- ①은 **아웃바운드**입니다. 기본 규칙이 `0.0.0.0/0` 전체 허용이라 나갑니다.
- ②의 응답 트래픽은 보안 그룹이 **"내가 보낸 요청의 응답"임을 기억하고 있어** 인바운드 규칙 없이도 통과합니다.

**인바운드 규칙은 "밖에서 먼저 말을 거는 연결"에만 적용됩니다.**

> **대조** — 네트워크 ACL(NACL)은 **상태 비저장**이라 응답용 임시 포트(1024–65535) 아웃바운드를 직접 열어야 합니다. [07강](lesson-07.md)에서 비교합니다.
</details>

**2.** 중지(stop)와 종료(terminate)의 차이를 **비용·데이터·IP** 관점에서 각각 설명하세요. 실습이 끝났을 때 무엇을 해야 하나요?

<details>
<summary>답 보기</summary>

| 관점 | 중지(stop) | 종료(terminate) |
|---|---|---|
| **비용** | 인스턴스 요금만 멈춤. **EBS·EIP는 계속 과금** | 전부 종료(루트 볼륨이 함께 삭제되는 경우) |
| **데이터** | EBS 볼륨과 데이터 **유지** | 루트 볼륨 삭제 → **복구 불가** |
| **IP** | 퍼블릭 IP **변경됨**, 프라이빗 IP 유지 | 둘 다 반환 |

**실습 후에는 종료(terminate)** 가 정답입니다. 그리고 종료만으로 끝이 아니라 아래까지 확인해야 합니다.

```bash
$ aws ec2 describe-volumes --filters "Name=status,Values=available"   # 남은 볼륨
$ aws ec2 describe-addresses --query 'Addresses[?AssociationId==null]' # 미사용 EIP
```

> **중지가 맞는 경우도 있습니다** — 개발 서버를 밤에 꺼서 컴퓨팅 비용을 아끼고 아침에 데이터 그대로 켜는 경우. [30강](../04-final-project/lesson-30.md)의 야간 자동 축소가 이 방식입니다.
</details>

**3.** 팀 후배가 "서버에 접속하려면 22번 포트를 `0.0.0.0/0` 으로 열어야 하지 않나요?"라고 묻습니다. 어떻게 답하고, 대안의 동작 원리를 어떻게 설명하겠습니까?

<details>
<summary>답 보기</summary>

**"열지 않아도 됩니다. Session Manager를 쓰면 인바운드를 하나도 열 필요가 없습니다."**

**동작 원리**

```
 인스턴스의 SSM Agent ──아웃바운드──▶ AWS Systems Manager
                                          ▲
 나(콘솔/CLI) ──── 세션 시작 요청 ─────────┘
```

접속이 **인스턴스에서 밖으로 나가는 방향**으로 성립하므로, 방화벽에 인바운드 구멍을 뚫을 필요가 없습니다.

**필요 조건 3가지**
1. SSM Agent (Amazon Linux 2023·최신 Ubuntu AMI에는 기본 포함)
2. IAM 역할에 `AmazonSSMManagedInstanceCore`
3. SSM 엔드포인트로 나가는 경로 (IGW / NAT / **VPC 인터페이스 엔드포인트**)

**추가 이점**
- 키 파일(`.pem`) 관리가 사라짐 → 분실·유출 위험 제거
- **누가 언제 접속했는지 CloudTrail에 기록**되고, 세션 내용도 S3/CloudWatch에 저장 가능
- 접근 통제를 **IAM 정책**으로 세밀하게 (예: 특정 태그의 인스턴스만 접속 허용)
- 퍼블릭 IP가 필요 없어 **비용과 공격 표면이 함께 감소**

> **한 줄 요약** — *"포트를 여는 대신 권한으로 통제한다."*
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| EC2 6요소 | AMI · 타입 · 스토리지 · 네트워크 · **IAM 역할** · 사용자 데이터 |
| 인스턴스 타입 | `t3.micro` = 패밀리·세대·크기. **T 계열은 CPU 크레딧 주의** |
| 중지 vs 종료 | 중지는 **EBS·EIP 계속 과금**, 종료는 복구 불가 |
| 보안 그룹 | ENI 단위 · **허용만** · **상태 저장** · 기본 아웃바운드 전체 허용 |
| Session Manager | **인바운드 0개로 접속.** 역할 + Agent + 나가는 경로 |
| IMDSv2 | 토큰을 먼저 받아야 메타데이터 조회 가능 |
| systemd | `enable --now` = 지금 실행 + 부팅 시 자동 실행 |
| 퍼블릭 IP | 중지·시작 시 **변경됨**. 고정하려면 EIP(유료) 또는 ALB |

**한 장 요약**

```
  관리 접속 : SSM (포트 0개, IAM으로 통제, 기록 남음)
  서비스 접속: 보안 그룹 인바운드 (내 IP만, 나중엔 ALB만)
  정리      : terminate → 볼륨 확인 → EIP 확인
```

**오늘 반드시 기억할 한 가지**
> **포트를 여는 대신 권한으로 통제합니다.**
> 그리고 실습이 끝나면 **중지가 아니라 종료**입니다.

**과제**
1. 인스턴스를 **CLI만으로** 시작 → 태그 부착 → 조회 → 종료까지 왕복하고 전체 명령·출력 로그를 제출하세요.
   (힌트: `aws ec2 run-instances --iam-instance-profile Name=EC2-Course-Role ...`)
2. Session Manager 접속 화면과 `aws sts get-caller-identity` 결과(`assumed-role` 확인)를 캡처하세요.
3. 보안 그룹 실험 기록 — **규칙 추가 전 실패 → 추가 후 성공 → 삭제 후 실패** 3장의 화면.
4. 중지 → 시작 후 **퍼블릭 IP가 바뀐 것**을 보여 주는 before/after 출력.
5. 정리 체크리스트 5개 명령의 출력(전부 비어 있음)을 제출하세요.
6. 이번 주 Cost Explorer 일별 비용 캡처와, 예상과 다른 항목이 있으면 원인 분석 3줄.

---

[← 이전 05강](lesson-05.md) · [목차](README.md) · [다음 → 07강 VPC 설계 — 서브넷·라우팅·게이트웨이](lesson-07.md)
