# 07강 · VPC 설계 — 서브넷·라우팅·게이트웨이

> **AWS 학습 매뉴얼** · 🟢 대단원 01 · **07강 / 총 32강**
> [← 이전 06강](lesson-06.md) · [목차](README.md) · [다음 → 08강 🏁 미니 프로젝트](lesson-08.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- CIDR를 계산해 **2개 AZ에 걸친 서브넷 구조를 직접 설계**할 수 있다.
- **"퍼블릭 서브넷"이 라우팅의 결과**임을 설명하고 그렇게 만들 수 있다.
- NAT Gateway · NAT 인스턴스 · VPC 엔드포인트를 **비용과 보안 기준으로 비교**해 선택할 수 있다.
- 보안 그룹과 네트워크 ACL의 차이를 **실험으로 구분**할 수 있다.
- 이 과정에서 16주 내내 쓸 **VPC를 CLI 스크립트로 재현**할 수 있다.

---

## ② 왜 필요한가

[06강](lesson-06.md)까지는 **기본 VPC**를 썼습니다. 계정을 만들면 자동으로 생기는 네트워크입니다. 편하지만 실무에서는 쓰지 않습니다. 이유는 하나입니다.

> **기본 VPC의 모든 서브넷은 퍼블릭입니다.**
> 즉, 거기에 만든 모든 인스턴스는 인터넷에서 도달 가능한 위치에 놓입니다.

실제 서비스 구조는 이렇게 생겨야 합니다.

```
       인터넷
          │
   ┌──────▼──────────────────────────────┐
   │  퍼블릭 서브넷                        │  ← 로드밸런서만
   │  (인터넷에서 보임)                    │
   ├──────────────────────────────────────┤
   │  프라이빗 서브넷 (앱)                 │  ← 웹/앱 서버
   │  (인터넷에서 안 보임, 나가기만 가능)   │
   ├──────────────────────────────────────┤
   │  프라이빗 서브넷 (DB)                 │  ← 데이터베이스
   │  (나가지도 못함)                      │
   └──────────────────────────────────────┘
```

이렇게 나누면 **공격자가 웹 서버를 뚫어도 데이터베이스에 직접 도달할 수 없습니다.** 계층마다 벽이 하나씩 더 있는 셈입니다.

그리고 실무적으로 더 중요한 사실이 있습니다.

> **VPC는 나중에 바꾸기 가장 어려운 것입니다.**
> 인스턴스는 지우고 다시 만들면 되지만, 서브넷 CIDR를 바꾸려면 그 안의 **모든 리소스를 옮겨야** 합니다. RDS는 서브넷을 옮길 수도 없습니다.

그래서 VPC 설계는 **처음에 제대로** 해야 합니다. 오늘 만드는 이 VPC가 **16주 내내 쓰이는 실습 무대**입니다.

---

## ③ 개념 설명

### VPC = 내 전용 가상 네트워크

```
   AWS 리전 (ap-northeast-2)
   ┌────────────────────────────────────────────┐
   │  VPC  10.0.0.0/16   (65,536개 IP)           │
   │  ┌──────────────┐      ┌──────────────┐    │
   │  │  AZ-2a        │      │  AZ-2c        │    │
   │  │ 10.0.1.0/24   │      │ 10.0.2.0/24   │    │
   │  │ 10.0.11.0/24  │      │ 10.0.12.0/24  │    │
   │  │ 10.0.21.0/24  │      │ 10.0.22.0/24  │    │
   │  └──────────────┘      └──────────────┘    │
   └────────────────────────────────────────────┘
```

| 규칙 | 내용 |
|---|---|
| VPC는 **리전 안에** 만든다 | 리전을 넘지 못함 |
| 서브넷은 **AZ 하나에** 속한다 | AZ를 넘지 못함 |
| CIDR는 **만든 뒤 축소 불가** | 확장(추가 CIDR)은 가능 |
| 사설 IP 대역을 쓴다 | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` |

### CIDR 계산 — 실무에 필요한 만큼만

```
   10.0.0.0/16
   └─┬──┘ └┬┘
     │     └── 뒤 16비트가 자유 → 2^16 = 65,536개
     └──────── 앞 16비트 고정
```

| 표기 | IP 개수 | AWS 사용 가능 | 쓰임 |
|---|---|---|---|
| `/16` | 65,536 | 65,531 | VPC 전체 |
| `/20` | 4,096 | 4,091 | 큰 서브넷 |
| **`/24`** | **256** | **251** | **일반 서브넷 (이 과정 기준)** |
| `/28` | 16 | 11 | 최소 크기 |

> 🔴 **AWS는 서브넷마다 IP 5개를 예약합니다.** `10.0.1.0/24` 의 경우:
>
> | IP | 용도 |
> |---|---|
> | `10.0.1.0` | 네트워크 주소 |
> | `10.0.1.1` | VPC 라우터 |
> | `10.0.1.2` | DNS 서버 |
> | `10.0.1.3` | 향후 사용 예약 |
> | `10.0.1.255` | 브로드캐스트(예약, 실제 미지원) |
>
> 따라서 **256 − 5 = 251개**만 쓸 수 있습니다. `/28`(16개)이면 11개뿐이라 금방 부족해집니다.

**CIDR 선택 시 반드시 피할 것** — 회사 사내망이나 다른 VPC와 **대역이 겹치면** 나중에 VPN·피어링 연결을 할 수 없습니다. 실무에서 `10.0.0.0/16` 을 아무 생각 없이 여러 VPC에 쓰다 나중에 후회하는 일이 매우 흔합니다.

### "퍼블릭 서브넷"이라는 설정은 없다 ⭐

오늘 가장 중요한 개념입니다.

> **서브넷에 "퍼블릭/프라이빗" 체크박스는 존재하지 않습니다.**
> **연결된 라우팅 테이블에 IGW로 향하는 `0.0.0.0/0` 경로가 있으면 퍼블릭**, 없으면 프라이빗입니다.

```
 [퍼블릭 서브넷의 라우팅 테이블]
   대상(Destination)      타겟(Target)
   10.0.0.0/16            local          ← VPC 내부 통신 (자동, 삭제 불가)
   0.0.0.0/0              igw-xxxxx      ← ⭐ 이 줄이 있으면 퍼블릭

 [프라이빗 서브넷 (앱)]
   10.0.0.0/16            local
   0.0.0.0/0              nat-xxxxx      ← NAT로 나가기만 가능

 [프라이빗 서브넷 (DB)]
   10.0.0.0/16            local          ← 이 줄뿐. 밖으로 못 나감
```

### 게이트웨이 3종 비교

| | 인터넷 게이트웨이(IGW) | NAT Gateway | VPC 엔드포인트 |
|---|---|---|---|
| 방향 | **양방향** | **아웃바운드 전용** | AWS 서비스 전용 |
| 퍼블릭 IP | 필요 | NAT가 대신 가짐 | 불필요 |
| 대상 | 인터넷 전체 | 인터넷 전체 | **특정 AWS 서비스만** |
| 비용 | **무료** | 시간당 $0.059 + GB당 $0.059 | 게이트웨이형 **무료** / 인터페이스형 시간당 $0.013 |
| 인터넷 경유 | 함 | 함 | **안 함** (AWS 백본) |

> 🔴 **NAT Gateway는 이 과정 최대의 비용 위험입니다.**
> 시간당 $0.059 × 730시간 = **월 약 $42**. 만들고 잊으면 프리 티어 계정에서도 청구서가 옵니다.
> **반드시 수업 종료 전에 삭제**하고, 다음 실습에서 스크립트로 다시 만듭니다.

### 프라이빗에서 밖으로 나가는 3가지 방법 — 선택 기준

| 방법 | 비용 | 보안 | 관리 | 언제 |
|---|---|---|---|---|
| **NAT Gateway** | 월 $42 + 전송 | 좋음 | AWS 관리 | 인터넷 전반이 필요할 때(패키지 설치 등) |
| **NAT 인스턴스** | t3.nano 월 약 $4 | 보통 | **직접 관리·SPOF** | 비용 극한 절감(학습·개인 환경) |
| **VPC 엔드포인트** | 게이트웨이형 무료 / 인터페이스형 시간당 $0.013 | **가장 좋음** | AWS 관리 | **AWS 서비스만** 접근하면 됨 |

**엔드포인트 두 종류**

| 유형 | 대상 서비스 | 동작 | 비용 |
|---|---|---|---|
| **게이트웨이형** | **S3, DynamoDB** 만 | 라우팅 테이블에 경로 추가 | **완전 무료** ⭐ |
| **인터페이스형** | 그 외 대부분(SSM, ECR, Secrets Manager...) | 서브넷에 ENI 생성 | 시간당 $0.013 × AZ 수 + 데이터 처리 |

> 💡 **실무 판단** — 프라이빗 서버가 S3에만 접근하면 **게이트웨이 엔드포인트로 NAT 없이** 해결됩니다. **월 $42를 $0으로** 만드는 결정입니다.
> [08강](lesson-08.md)에서 "SSM 접속에 NAT를 쓸까, 인터페이스 엔드포인트 3개를 쓸까"를 직접 계산해 봅니다.

### 보안 그룹 vs 네트워크 ACL

```
          인터넷
            │
   ┌────────▼────────────────────────┐
   │  서브넷                          │
   │   ┌── NACL (서브넷 경계) ──┐      │  ← ① 여기서 먼저 검사
   │   │                       │      │
   │   │   ┌─ 보안 그룹 ─┐      │      │  ← ② 그다음 검사
   │   │   │  인스턴스   │      │      │
   │   │   └───────────┘      │      │
   │   └───────────────────────┘      │
   └──────────────────────────────────┘
```

| 항목 | 보안 그룹 | 네트워크 ACL |
|---|---|---|
| 적용 단위 | **ENI(인스턴스)** | **서브넷** |
| 규칙 | **허용만** | **허용 + 거부** |
| 상태 | **상태 저장** | **상태 비저장** ⚠️ |
| 평가 | 모든 규칙을 종합 | **번호 순서대로, 첫 일치에서 결정** |
| 기본값 | 인바운드 차단 / 아웃바운드 허용 | 기본 NACL은 **전부 허용** |
| 소스에 SG 지정 | **가능** ⭐ | 불가(IP만) |

> 🔴 **상태 비저장이 만드는 대표적 장애**
> NACL에서 인바운드 80번만 열고 아웃바운드를 안 열면, **요청은 들어오는데 응답이 못 나갑니다.**
> 응답은 **임시 포트(ephemeral port, 1024–65535)** 로 나가므로 그 범위를 아웃바운드에 열어야 합니다.

**실무 원칙** — **보안 그룹을 주 수단으로 쓰고, NACL은 기본값(전체 허용) 그대로 두거나 특정 IP 차단 같은 용도로만** 씁니다. NACL을 세밀하게 쓰면 디버깅이 매우 어려워집니다.

### 오늘 만들 구조

```
 VPC 10.0.0.0/16
 ┌──────────────────────────────────────────────────────────┐
 │            AZ-2a                    AZ-2c                 │
 │  ┌────────────────────┐  ┌────────────────────┐          │
 │  │ 퍼블릭 10.0.1.0/24  │  │ 퍼블릭 10.0.2.0/24  │  ← IGW   │
 │  │  [NAT GW]          │  │                    │          │
 │  ├────────────────────┤  ├────────────────────┤          │
 │  │ 앱   10.0.11.0/24   │  │ 앱   10.0.12.0/24   │  ← NAT   │
 │  ├────────────────────┤  ├────────────────────┤          │
 │  │ DB   10.0.21.0/24   │  │ DB   10.0.22.0/24   │  ← 없음  │
 │  └────────────────────┘  └────────────────────┘          │
 └──────────────────────────────────────────────────────────┘
```

| 계층 | CIDR | 라우팅 | 들어갈 것 |
|---|---|---|---|
| 퍼블릭 | `10.0.1.0/24`, `10.0.2.0/24` | IGW | ALB([11강](../02-compute-data/lesson-11.md)), NAT |
| 앱(프라이빗) | `10.0.11.0/24`, `10.0.12.0/24` | NAT | EC2/ECS([10강](../02-compute-data/lesson-10.md)·[21강](../03-serverless-automation/lesson-21.md)) |
| DB(프라이빗) | `10.0.21.0/24`, `10.0.22.0/24` | **없음** | RDS([15강](../02-compute-data/lesson-15.md)) |

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.4 ~ 0.6** — NAT Gateway가 대부분입니다. **반드시 수업 안에서 삭제**합니다.
> 전 과정을 CLI로 진행하고, 마지막에 **재사용 가능한 스크립트**로 정리합니다.

### Step 1. VPC 만들기

```bash
$ VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=course-vpc},{Key=Project,Value=aws-course}]' \
    --query 'Vpc.VpcId' --output text)
$ echo $VPC_ID
vpc-0b1c2d3e4f5061728
```

**DNS 설정 활성화** — 이걸 빠뜨리면 인스턴스가 내부 DNS 이름을 못 받고, VPC 엔드포인트도 제대로 동작하지 않습니다.

```bash
$ aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
$ aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
```

### Step 2. 서브넷 6개 만들기

```bash
# 퍼블릭
$ PUB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 \
    --availability-zone ap-northeast-2a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=course-public-2a}]' \
    --query 'Subnet.SubnetId' --output text)

$ PUB_C=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 \
    --availability-zone ap-northeast-2c \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=course-public-2c}]' \
    --query 'Subnet.SubnetId' --output text)

# 앱 (프라이빗)
$ APP_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 \
    --availability-zone ap-northeast-2a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=course-app-2a}]' \
    --query 'Subnet.SubnetId' --output text)

$ APP_C=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.12.0/24 \
    --availability-zone ap-northeast-2c \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=course-app-2c}]' \
    --query 'Subnet.SubnetId' --output text)

# DB (프라이빗)
$ DB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.21.0/24 \
    --availability-zone ap-northeast-2a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=course-db-2a}]' \
    --query 'Subnet.SubnetId' --output text)

$ DB_C=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.22.0/24 \
    --availability-zone ap-northeast-2c \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=course-db-2c}]' \
    --query 'Subnet.SubnetId' --output text)
```

**확인**

```bash
$ aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[*].{이름:Tags[?Key==`Name`]|[0].Value,CIDR:CidrBlock,AZ:AvailabilityZone,가용IP:AvailableIpAddressCount}' \
    --output table
--------------------------------------------------------------------------
|                             DescribeSubnets                              |
+--------------------+------------------+-------------------+-------------+
|        AZ          |      CIDR        |      가용IP        |    이름     |
+--------------------+------------------+-------------------+-------------+
|  ap-northeast-2a   |  10.0.1.0/24     |  251              | course-public-2a |
|  ap-northeast-2c   |  10.0.2.0/24     |  251              | course-public-2c |
|  ap-northeast-2a   |  10.0.11.0/24    |  251              | course-app-2a    |
|  ap-northeast-2c   |  10.0.12.0/24    |  251              | course-app-2c    |
|  ap-northeast-2a   |  10.0.21.0/24    |  251              | course-db-2a     |
|  ap-northeast-2c   |  10.0.22.0/24    |  251              | course-db-2c     |
+--------------------+------------------+-------------------+-------------+
```

> ✅ **가용 IP가 251개**입니다. 256에서 예약 5개를 뺀 값입니다. 개념 설명에서 배운 것이 그대로 나옵니다.

### Step 3. 인터넷 게이트웨이 연결 + 퍼블릭 라우팅

```bash
$ IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=course-igw}]' \
    --query 'InternetGateway.InternetGatewayId' --output text)

$ aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
```

**퍼블릭 라우팅 테이블 만들기**

```bash
$ RTB_PUB=$(aws ec2 create-route-table --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=course-rtb-public}]' \
    --query 'RouteTable.RouteTableId' --output text)

# ⭐ 이 한 줄이 "퍼블릭 서브넷"을 만든다
$ aws ec2 create-route --route-table-id $RTB_PUB \
    --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
{ "Return": true }

# 퍼블릭 서브넷 2개에 연결
$ aws ec2 associate-route-table --route-table-id $RTB_PUB --subnet-id $PUB_A
$ aws ec2 associate-route-table --route-table-id $RTB_PUB --subnet-id $PUB_C
```

**퍼블릭 서브넷에서 시작하는 인스턴스가 자동으로 퍼블릭 IP를 받게 설정**

```bash
$ aws ec2 modify-subnet-attribute --subnet-id $PUB_A --map-public-ip-on-launch
$ aws ec2 modify-subnet-attribute --subnet-id $PUB_C --map-public-ip-on-launch
```

### Step 4. NAT Gateway 만들기 🔴 (비용 발생 시작)

```bash
# NAT에 붙일 탄력적 IP 할당
$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc \
    --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=course-nat-eip}]' \
    --query 'AllocationId' --output text)

# NAT Gateway는 "퍼블릭 서브넷"에 만든다  ← 자주 틀리는 부분
$ NAT_ID=$(aws ec2 create-nat-gateway \
    --subnet-id $PUB_A \
    --allocation-id $EIP_ALLOC \
    --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=course-nat}]' \
    --query 'NatGateway.NatGatewayId' --output text)
$ echo $NAT_ID
nat-0a1b2c3d4e5f60718
```

> 🔴 **이 순간부터 시간당 $0.059 과금이 시작됩니다.** 지금 시각을 적어 두세요.

```bash
# 사용 가능 상태가 될 때까지 대기 (2~3분)
$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
$ echo "NAT 준비 완료"
NAT 준비 완료
```

**앱 서브넷용 라우팅 테이블**

```bash
$ RTB_APP=$(aws ec2 create-route-table --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=course-rtb-app}]' \
    --query 'RouteTable.RouteTableId' --output text)

$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID

$ aws ec2 associate-route-table --route-table-id $RTB_APP --subnet-id $APP_A
$ aws ec2 associate-route-table --route-table-id $RTB_APP --subnet-id $APP_C
```

**DB 서브넷용 라우팅 테이블 — 밖으로 나가는 경로를 주지 않습니다**

```bash
$ RTB_DB=$(aws ec2 create-route-table --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=course-rtb-db}]' \
    --query 'RouteTable.RouteTableId' --output text)

# 0.0.0.0/0 경로를 만들지 않는다!  local 경로만 존재
$ aws ec2 associate-route-table --route-table-id $RTB_DB --subnet-id $DB_A
$ aws ec2 associate-route-table --route-table-id $RTB_DB --subnet-id $DB_C
```

**라우팅 테이블 3개 비교**

```bash
$ aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'RouteTables[*].{이름:Tags[?Key==`Name`]|[0].Value,경로:Routes[*].[DestinationCidrBlock,GatewayId,NatGatewayId]}' \
    --output json
[
    {
        "이름": "course-rtb-public",
        "경로": [ ["10.0.0.0/16","local",null], ["0.0.0.0/0","igw-0abc...",null] ]
    },
    {
        "이름": "course-rtb-app",
        "경로": [ ["10.0.0.0/16","local",null], ["0.0.0.0/0",null,"nat-0a1b..."] ]
    },
    {
        "이름": "course-rtb-db",
        "경로": [ ["10.0.0.0/16","local",null] ]
    }
]
```

> ✅ **이 출력이 오늘의 핵심 산출물입니다.** 세 서브넷 계층의 차이가 **라우팅 테이블 한 줄 차이**로 드러납니다.

### Step 5. S3 게이트웨이 엔드포인트 — NAT 없이 S3 접근하기

```bash
$ aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --service-name com.amazonaws.ap-northeast-2.s3 \
    --route-table-ids $RTB_APP $RTB_DB \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=course-s3-endpoint}]' \
    --query 'VpcEndpoint.VpcEndpointId' --output text
vpce-0a1b2c3d4e5f60718
```

**라우팅 테이블을 다시 보면 경로가 자동으로 추가되어 있습니다.**

```bash
$ aws ec2 describe-route-tables --route-table-ids $RTB_DB \
    --query 'RouteTables[0].Routes[*].[DestinationCidrBlock,DestinationPrefixListId,GatewayId]' \
    --output table
------------------------------------------------------------
|  10.0.0.0/16   |  None            |  local               |
|  None          |  pl-78a54011     |  vpce-0a1b2c3d...    |
------------------------------------------------------------
```

> 💡 **`pl-78a54011` 은 S3의 접두사 목록(prefix list)** 입니다. "S3의 IP 대역으로 가는 트래픽은 엔드포인트로 보내라"는 뜻입니다.
> 이제 **DB 서브넷조차** 인터넷 경로 없이 S3에 접근할 수 있습니다. **비용은 $0**, 트래픽은 인터넷을 경유하지 않습니다.

### Step 6. 보안 그룹 3계층 구성 — 소스를 보안 그룹으로

```bash
# 웹(ALB용) — 나중에 11강에서 사용
$ SG_WEB=$(aws ec2 create-security-group --group-name course-sg-web \
    --description "ALB layer" --vpc-id $VPC_ID --query 'GroupId' --output text)

# 앱
$ SG_APP=$(aws ec2 create-security-group --group-name course-sg-app \
    --description "App layer" --vpc-id $VPC_ID --query 'GroupId' --output text)

# DB
$ SG_DB=$(aws ec2 create-security-group --group-name course-sg-db \
    --description "DB layer" --vpc-id $VPC_ID --query 'GroupId' --output text)
```

**규칙 — IP가 아니라 보안 그룹을 소스로** ⭐

```bash
# 웹: 인터넷에서 80/443
$ aws ec2 authorize-security-group-ingress --group-id $SG_WEB \
    --protocol tcp --port 80 --cidr 0.0.0.0/0

# 앱: 웹 계층에서만 80
$ aws ec2 authorize-security-group-ingress --group-id $SG_APP \
    --protocol tcp --port 80 --source-group $SG_WEB

# DB: 앱 계층에서만 3306
$ aws ec2 authorize-security-group-ingress --group-id $SG_DB \
    --protocol tcp --port 3306 --source-group $SG_APP
```

**확인**

```bash
$ aws ec2 describe-security-groups --group-ids $SG_DB \
    --query 'SecurityGroups[0].IpPermissions[*].{포트:FromPort,소스SG:UserIdGroupPairs[0].GroupId}' \
    --output table
--------------------------------
|  3306  |  sg-0app1234567890   |
--------------------------------
```

> 💡 **왜 IP가 아니라 보안 그룹인가** — 앱 서버가 오토스케일링으로 늘고 줄면 IP가 계속 바뀝니다. 보안 그룹 ID는 **바뀌지 않습니다.**
> 실무에서 3계층 구조의 정석입니다.

### Step 7. NACL 실험 — 상태 비저장을 몸으로 확인하기

DB 서브넷에 커스텀 NACL을 붙여 보겠습니다.

```bash
$ NACL_ID=$(aws ec2 create-network-acl --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=network-acl,Tags=[{Key=Name,Value=course-nacl-db}]' \
    --query 'NetworkAcl.NetworkAclId' --output text)

# 인바운드: 앱 서브넷에서 오는 3306만 허용
$ aws ec2 create-network-acl-entry --network-acl-id $NACL_ID \
    --rule-number 100 --protocol tcp --port-range From=3306,To=3306 \
    --cidr-block 10.0.11.0/24 --rule-action allow --ingress

# ⚠️ 아웃바운드: 응답용 임시 포트를 열어야 한다!
$ aws ec2 create-network-acl-entry --network-acl-id $NACL_ID \
    --rule-number 100 --protocol tcp --port-range From=1024,To=65535 \
    --cidr-block 10.0.11.0/24 --rule-action allow --egress
```

**만약 두 번째 명령을 빼면?**

```
 앱 서버 ──3306 요청──▶ DB   (인바운드 규칙 100번이 허용 ✅)
 앱 서버 ◀──응답──✗──  DB   (아웃바운드 규칙이 없어 거부 🚫)
   → 결과: 연결이 되는 것 같다가 타임아웃
```

> 🔴 **이것이 NACL 관련 장애의 90%입니다.** 보안 그룹이었다면 응답은 자동 허용이었을 것입니다.
> **실무 권장** — NACL은 기본값(전체 허용)으로 두고 보안 그룹으로 통제합니다. NACL은 "특정 악성 IP 대역 차단" 같은 광역 차단에만 씁니다.

**규칙 확인**

```bash
$ aws ec2 describe-network-acls --network-acl-ids $NACL_ID \
    --query 'NetworkAcls[0].Entries[*].{번호:RuleNumber,방향:Egress,동작:RuleAction,포트:PortRange,소스:CidrBlock}' \
    --output table
```

> 규칙 번호 `32767` 의 `deny` 는 **삭제할 수 없는 기본 거부 규칙**입니다. 어떤 규칙에도 안 걸리면 여기서 막힙니다.

### Step 8. 환경 변수를 파일로 저장 — 다음 강 준비

```bash
$ cat > ~/course-vpc-env.sh <<EOF
export VPC_ID=$VPC_ID
export PUB_A=$PUB_A
export PUB_C=$PUB_C
export APP_A=$APP_A
export APP_C=$APP_C
export DB_A=$DB_A
export DB_C=$DB_C
export IGW_ID=$IGW_ID
export NAT_ID=$NAT_ID
export EIP_ALLOC=$EIP_ALLOC
export RTB_PUB=$RTB_PUB
export RTB_APP=$RTB_APP
export RTB_DB=$RTB_DB
export SG_WEB=$SG_WEB
export SG_APP=$SG_APP
export SG_DB=$SG_DB
EOF

$ cat ~/course-vpc-env.sh
export VPC_ID=vpc-0b1c2d3e4f5061728
export PUB_A=subnet-0a1b2c3d4e5f60718
...
```

다음에 이어서 작업할 때는 `source ~/course-vpc-env.sh` 한 줄이면 됩니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| VPC · 서브넷 · 라우팅 테이블 | 무료 | $0 | $0 |
| 인터넷 게이트웨이 | 무료 | $0 | $0 |
| **NAT Gateway** | ❌ **미포함** | **약 $0.36** | 🔴 **약 $42** |
| NAT용 탄력적 IP | ❌ | 약 $0.03 | 약 $3.6 |
| **S3 게이트웨이 엔드포인트** | **무료** ⭐ | **$0** | **$0** |
| 보안 그룹 · NACL | 무료 | $0 | $0 |
| **합계** | | **약 $0.4** | **약 $46** |

> 🔴 **NAT Gateway 삭제 확인은 콘솔이 아니라 CLI로 하세요.** 콘솔은 삭제된 NAT도 잠시 목록에 남습니다.

### 🧹 리소스 정리 체크리스트

**삭제 순서가 중요합니다.** 의존 관계 때문에 순서를 어기면 실패합니다.

```bash
$ source ~/course-vpc-env.sh

# 1) NAT Gateway 삭제 (가장 먼저! 2~3분 소요)
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID

# 2) 탄력적 IP 반환
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 3) VPC 엔드포인트 삭제
$ aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $(aws ec2 describe-vpc-endpoints \
    --filters "Name=vpc-id,Values=$VPC_ID" --query 'VpcEndpoints[*].VpcEndpointId' --output text)

# 4) 보안 그룹 삭제 (참조 관계 때문에 DB→앱→웹 순서)
$ aws ec2 delete-security-group --group-id $SG_DB
$ aws ec2 delete-security-group --group-id $SG_APP
$ aws ec2 delete-security-group --group-id $SG_WEB

# 5) IGW 분리 후 삭제
$ aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
$ aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID

# 6) 서브넷 삭제
$ for S in $PUB_A $PUB_C $APP_A $APP_C $DB_A $DB_C; do aws ec2 delete-subnet --subnet-id $S; done

# 7) 라우팅 테이블 삭제 (기본 테이블은 못 지움 — 정상)
$ for R in $RTB_PUB $RTB_APP $RTB_DB; do aws ec2 delete-route-table --route-table-id $R; done

# 8) VPC 삭제
$ aws ec2 delete-vpc --vpc-id $VPC_ID
```

**최종 확인 — 기본 VPC 외에 남은 것이 없어야 합니다.**

```bash
$ aws ec2 describe-vpcs --query 'Vpcs[?IsDefault==`false`].[VpcId,CidrBlock]' --output text
(빈 출력 = 완료)

$ aws ec2 describe-nat-gateways --filter "Name=state,Values=available,pending" \
    --query 'NatGateways[*].NatGatewayId' --output text
(빈 출력 = 완료)

$ aws ec2 describe-addresses --query 'Addresses[*].PublicIp' --output text
(빈 출력 = 완료)
```

- [ ] 🔴 **NAT Gateway 삭제** — `describe-nat-gateways` 빈 출력
- [ ] 탄력적 IP 반환 — `describe-addresses` 빈 출력
- [ ] VPC 엔드포인트 삭제
- [ ] 보안 그룹·서브넷·라우팅 테이블·IGW 삭제
- [ ] VPC 삭제 — 기본 VPC만 남음
- [ ] `~/course-vpc-env.sh` 는 참고용으로 보관(ID는 무효)
- [ ] 다음 날 Cost Explorer에서 NAT 비용이 멈췄는지 확인

---

## ⑤ 자주 하는 실수

### 서브넷 CIDR가 겹쳐서 만들어지지 않는다

```
An error occurred (InvalidSubnet.Conflict) when calling the CreateSubnet operation:
The CIDR '10.0.1.0/24' conflicts with another subnet
```

**원인** — 이미 같은 대역을 쓰는 서브넷이 있습니다.
**해결** — 기존 서브넷 목록을 확인하고 겹치지 않는 대역을 씁니다.

```bash
$ aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[*].CidrBlock' --output text
```

### NAT Gateway를 프라이빗 서브넷에 만들었다

**증상** — NAT는 만들어졌지만 프라이빗 인스턴스가 인터넷에 나가지 못합니다.
**원인** — **NAT Gateway는 퍼블릭 서브넷에 있어야 합니다.** NAT 자신이 IGW를 통해 나가야 하기 때문입니다.
**해결** — 삭제하고 퍼블릭 서브넷에 다시 만듭니다.

```
 프라이빗 인스턴스 → NAT(퍼블릭 서브넷) → IGW → 인터넷
                     ↑ 여기가 퍼블릭이어야 함
```

### 프라이빗 인스턴스가 인터넷에 못 나간다

**확인 순서**

| # | 확인 | 명령 |
|---|---|---|
| 1 | NAT가 `available` 인가 | `aws ec2 describe-nat-gateways` |
| 2 | 앱 라우팅 테이블에 `0.0.0.0/0 → nat-xxx` 가 있나 | `describe-route-tables` |
| 3 | 그 라우팅 테이블이 **서브넷에 연결**됐나 | `Associations` 확인 |
| 4 | NAT가 **퍼블릭 서브넷**에 있나 | NAT의 SubnetId 확인 |
| 5 | 보안 그룹 아웃바운드가 열려 있나 | 기본은 전체 허용 |

**가장 흔한 원인은 3번** — 라우팅 테이블을 만들고 경로까지 넣었지만 **서브넷에 연결(associate)하지 않은** 경우입니다.

```bash
$ aws ec2 describe-route-tables --route-table-ids $RTB_APP \
    --query 'RouteTables[0].Associations[*].SubnetId' --output text
subnet-0app2a...  subnet-0app2c...     ← 비어 있으면 연결 안 된 것
```

### VPC를 지우려는데 삭제되지 않는다

```
An error occurred (DependencyViolation) when calling the DeleteVpc operation:
The vpc 'vpc-0b1c2d3e4f5061728' has dependencies and cannot be deleted.
```

**원인** — 안에 리소스가 남아 있습니다. **NAT Gateway, ENI, 엔드포인트**가 대표적입니다.
**해결** — 남은 ENI를 찾습니다. 대개 이것이 범인입니다.

```bash
$ aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'NetworkInterfaces[*].[NetworkInterfaceId,Description,Status]' --output table
------------------------------------------------------------------------
|  eni-0abc123  |  Interface for NAT Gateway nat-0a1b...  |  in-use    |
------------------------------------------------------------------------
```

NAT를 지우면 이 ENI도 몇 분 뒤 사라집니다. **삭제 순서를 지키는 것**이 가장 확실한 예방책입니다.

### DB 서브넷에서 패키지 설치가 안 된다

```
Errors during downloading metadata for repository 'amazonlinux':
Curl error (28): Timeout was reached
```

**원인** — **의도된 동작입니다.** DB 서브넷에는 `0.0.0.0/0` 경로가 없습니다.
**해결** — 데이터 계층은 원래 밖으로 나갈 필요가 없습니다. 정말 필요하다면 앱 서브넷에 두거나, 필요한 AWS 서비스만 **VPC 엔드포인트**로 열어 줍니다.

### NACL을 건드렸더니 통신이 전부 끊겼다

**원인** — 커스텀 NACL을 만들면 **기본적으로 모든 트래픽을 거부**합니다. 기본 NACL(전체 허용)과 정반대입니다.
**해결** — 서브넷의 NACL을 기본 NACL로 되돌립니다.

```bash
# 기본 NACL ID 찾기
$ aws ec2 describe-network-acls --filters "Name=vpc-id,Values=$VPC_ID" "Name=default,Values=true" \
    --query 'NetworkAcls[0].NetworkAclId' --output text
acl-0default123

# 연결(association)을 기본 NACL로 교체
$ aws ec2 replace-network-acl-association \
    --association-id aclassoc-0abc123 --network-acl-id acl-0default123
```

**교훈** — NACL은 웬만하면 건드리지 않습니다.

### DNS 이름을 못 받는다 / VPC 엔드포인트가 동작하지 않는다

**원인** — `enableDnsSupport` 또는 `enableDnsHostnames` 가 꺼져 있습니다. `create-vpc` 로 만든 VPC는 **후자가 기본 꺼짐**입니다.
**해결** — Step 1의 `modify-vpc-attribute` 두 줄을 반드시 실행합니다. 인터페이스 엔드포인트의 프라이빗 DNS도 이 설정에 의존합니다.

---

## ⑥ 확인 문제

**1.** 어떤 서브넷을 "퍼블릭 서브넷"으로 만드는 것은 정확히 무엇인가요? 서브넷 설정에 퍼블릭 옵션이 있나요?

<details>
<summary>답 보기</summary>

**연결된 라우팅 테이블에 인터넷 게이트웨이(IGW)로 향하는 `0.0.0.0/0` 경로가 있는 것**입니다. **퍼블릭 옵션 같은 설정은 존재하지 않습니다.**

```
 퍼블릭 서브넷의 라우팅 테이블
   10.0.0.0/16  →  local
   0.0.0.0/0    →  igw-xxxxx     ← 이 줄이 전부
```

**추가로 필요한 것**
- 인스턴스에 **퍼블릭 IP**가 있어야 실제로 인터넷에서 도달 가능합니다. (`map-public-ip-on-launch` 또는 EIP)
- 보안 그룹이 해당 포트를 허용해야 합니다.

> **자주 하는 오해** — "퍼블릭 서브넷에 두면 무조건 인터넷에 노출된다"고 생각하는 것. 퍼블릭 IP가 없으면 밖에서 도달할 수 없습니다.
> 반대로 **프라이빗 서브넷에 있으면 퍼블릭 IP를 줘도 도달 불가**합니다. 라우팅 경로가 없기 때문입니다.
</details>

**2.** 프라이빗 서브넷의 인스턴스가 S3에 접근해야 합니다. NAT Gateway를 쓰는 방법과 게이트웨이 엔드포인트를 쓰는 방법을 **비용·보안·성능** 관점에서 비교하세요.

<details>
<summary>답 보기</summary>

| 관점 | NAT Gateway | **S3 게이트웨이 엔드포인트** |
|---|---|---|
| **비용** | 시간당 $0.059 (월 약 $42) + **데이터 처리 GB당 $0.059** | **완전 무료** |
| **보안** | 트래픽이 인터넷을 경유 | **AWS 내부 네트워크만 경유** + 엔드포인트 정책으로 특정 버킷만 허용 가능 |
| **성능** | NAT를 한 번 거침 | 직접 라우팅, 대역폭 제한 없음 |
| **범위** | 인터넷 전체 | **S3(및 DynamoDB)만** |

**결론** — S3만 필요하다면 **게이트웨이 엔드포인트가 모든 면에서 낫습니다.** 월 $42를 $0으로 만듭니다.

**단, 다른 것도 필요하면** — 예를 들어 `dnf update` 로 패키지를 받아야 한다면 인터넷 접근이 필요하므로 NAT가 필요합니다. 실무에서는 **골든 AMI에 패키지를 미리 굽고**([09강](../02-compute-data/lesson-09.md)) 엔드포인트만 쓰는 방식으로 NAT를 없애기도 합니다.
</details>

**3.** DB 서브넷에 NACL을 붙여 "앱 서브넷(`10.0.11.0/24`)에서 오는 3306만 허용"하도록 인바운드 규칙을 만들었습니다. 그런데 앱 서버에서 DB 접속이 **타임아웃**됩니다. 무엇을 빠뜨렸나요?

<details>
<summary>답 보기</summary>

**아웃바운드 규칙 — 응답용 임시 포트(1024–65535)** 를 열지 않았습니다.

```
 앱(10.0.11.5:52341) ──[3306 요청]──▶ DB(10.0.21.9:3306)   ✅ 인바운드 100번 허용
 앱(10.0.11.5:52341) ◀──[응답]──✗───  DB(10.0.21.9:3306)   🚫 아웃바운드 규칙 없음 → 거부
```

**NACL은 상태 비저장(stateless)** 이라 "요청의 응답"을 기억하지 않습니다. 나가는 트래픽도 따로 허용해야 합니다.

**해결**

```bash
$ aws ec2 create-network-acl-entry --network-acl-id $NACL_ID \
    --rule-number 100 --protocol tcp --port-range From=1024,To=65535 \
    --cidr-block 10.0.11.0/24 --rule-action allow --egress
```

**보안 그룹이었다면?** 이 문제가 생기지 않습니다. 상태 저장이라 응답이 자동 허용됩니다.

> **실무 원칙** — 통제는 **보안 그룹**으로 하고, NACL은 기본값 그대로 둡니다. 필요할 때만 광역 차단 용도로 씁니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| VPC | 리전 안의 전용 가상 네트워크. CIDR는 **나중에 축소 불가** |
| 서브넷 | **AZ 하나**에 속함. IP 5개는 AWS 예약(`/24` → 251개) |
| **퍼블릭 서브넷** | 라우팅 테이블에 **`0.0.0.0/0 → IGW`** 가 있는 것 |
| IGW | 양방향·**무료** |
| **NAT Gateway** | 아웃바운드 전용·**월 $42**·**퍼블릭 서브넷에 배치** |
| VPC 엔드포인트 | 게이트웨이형(S3·DynamoDB) **무료** / 인터페이스형 시간당 $0.013 |
| 보안 그룹 | ENI 단위·허용만·**상태 저장**·**소스에 SG 지정 가능** |
| NACL | 서브넷 단위·허용/거부·**상태 비저장**(임시 포트 주의)·번호 순 평가 |

**한 장 요약**

```
 퍼블릭  10.0.1/2.0/24   → IGW      : ALB · NAT
 앱      10.0.11/12.0/24 → NAT      : EC2 · ECS
 DB      10.0.21/22.0/24 → (없음)   : RDS
                          + S3 엔드포인트(무료)

 통제는 보안 그룹(소스=다른 SG), NACL은 기본값 유지
```

**오늘 반드시 기억할 한 가지**
> **퍼블릭/프라이빗은 라우팅이 결정합니다.** 그리고 **NAT Gateway는 만든 그날 지웁니다.**

**과제**
1. 오늘 만든 VPC 구조를 **아키텍처 다이어그램**으로 그리세요. (VPC · AZ 2개 · 서브넷 6개 · IGW · NAT · 라우팅 화살표 · 엔드포인트)
2. 라우팅 테이블 3개의 경로를 조회한 출력을 제출하고, **세 계층의 차이를 각각 한 줄로** 설명하세요.
3. **`create-vpc.sh` 스크립트**를 작성하세요. Step 1~6을 한 번에 실행해 VPC를 재생성하는 스크립트입니다. ([08강](lesson-08.md)과 [09강](../02-compute-data/lesson-09.md)에서 실제로 사용합니다)
4. **비용 비교표** — "프라이빗 서버가 S3에만 접근하면 되는 서비스"에서 NAT Gateway 방식과 게이트웨이 엔드포인트 방식의 **월 비용 차이**를 계산하세요.
5. 정리 체크리스트 3개 명령의 출력(전부 비어 있음)을 제출하세요.

---

[← 이전 06강](lesson-06.md) · [목차](README.md) · [다음 → 08강 🏁 미니 프로젝트 — 안전한 3계층 네트워크](lesson-08.md)
