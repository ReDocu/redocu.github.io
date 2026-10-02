# 08강 · 🏁 미니 프로젝트 — 안전한 3계층 네트워크

> **AWS 학습 매뉴얼** · 🟢 대단원 01 · **08강 / 총 32강**
> [← 이전 07강](lesson-07.md) · [목차](README.md) · [다음 → 09강 AMI·사용자 데이터·시작 템플릿](../02-compute-data/lesson-09.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 요구사항 문장을 읽고 **필요한 네트워크 구조를 스스로 설계**할 수 있다.
- 인터넷에 노출되지 않는 서버를 만들고 **접속·업데이트·격리를 각각 증명**할 수 있다.
- SSM 접속 방식으로 **NAT와 인터페이스 엔드포인트 중 무엇이 유리한지 계산**해 선택할 수 있다.
- VPC Flow Logs로 **차단된 통신의 원인을 찾을** 수 있다.
- 대단원 01에서 배운 것만으로 **처음부터 끝까지 혼자 완주**할 수 있다.

---

## ② 왜 필요한가

01–07강에서 배운 것들은 각각은 조각입니다.

```
 02강 계정 안전장치     03·04강 IAM         05강 CLI
 06강 EC2·SSM 접속     07강 VPC·라우팅·SG
```

실무에서 요구사항은 이런 조각으로 오지 않습니다. **문장 하나**로 옵니다.

> "사내 관리 도구를 운영할 서버가 필요합니다. 외부에서 접근되면 안 되고, 운영자는 접속해야 하며, 보안 패치는 받아야 합니다."

이 문장을 **서브넷 몇 개, 라우팅 어떻게, 보안 그룹 어떻게** 로 번역하는 것이 아키텍트의 일입니다.

그리고 오늘 배울 또 하나가 있습니다. **"만들었다"와 "증명했다"는 다릅니다.**

- 만들었다 → "프라이빗 서브넷에 뒀습니다."
- **증명했다** → "퍼블릭 IP가 없고, 라우팅 테이블에 IGW 경로가 없으며, 외부 스캔에서 응답이 없고, Flow Logs에 REJECT가 찍힙니다."

앞으로 모든 프로젝트에서 **증명 기록**을 함께 제출합니다. 오늘이 그 첫 훈련입니다.

---

## ③ 개념 설명

### 프로젝트 요구사항

> **[과제 문장]**
> 사내 관리 도구를 운영한다.
> ① 웹 서버는 **인터넷에서 직접 접근할 수 없어야** 한다.
> ② 운영자는 **SSH 포트를 열지 않고** 접속할 수 있어야 한다.
> ③ 서버는 보안 패치를 위해 **외부에서 패키지를 내려받을 수** 있어야 한다.
> ④ 나중에 **데이터베이스 계층을 추가**할 자리가 있어야 한다.
> ⑤ **AZ 하나가 죽어도** 확장할 수 있는 구조여야 한다.

### 요구사항 → 설계 번역표

| 요구 | 설계 결정 | 근거 |
|---|---|---|
| ① 인터넷에서 접근 불가 | 앱 서브넷을 **프라이빗**으로, 퍼블릭 IP 미할당 | 라우팅에 IGW 경로 없음 → 도달 불가 |
| ② SSH 없이 접속 | **SSM Session Manager** + `AmazonSSMManagedInstanceCore` | 아웃바운드 연결 방식 |
| ③ 패키지 다운로드 | **NAT Gateway** 또는 인터페이스 엔드포인트 | 아웃바운드 경로 필요 |
| ④ DB 자리 확보 | **DB 서브넷을 미리** 분리 | 나중에 서브넷 추가는 어려움 |
| ⑤ AZ 확장 가능 | **2개 AZ**에 대칭 배치 | 고가용성의 최소 조건 |

### 오늘 만들 최종 구조

```
        인터넷
          │
      ┌───▼────────────────────── VPC 10.0.0.0/16 ──────────────────────┐
      │  IGW                                                            │
      │   │                                                             │
      │   │   AZ-2a                          AZ-2c                       │
      │  ┌┴──────────────────┐        ┌──────────────────┐              │
      │  │ 퍼블릭 10.0.1.0/24 │        │ 퍼블릭 10.0.2.0/24 │              │
      │  │   [NAT Gateway]   │        │   (ALB 자리)       │              │
      │  └────────┬──────────┘        └──────────────────┘              │
      │           │ 아웃바운드만                                          │
      │  ┌────────▼──────────┐        ┌──────────────────┐              │
      │  │ 앱   10.0.11.0/24  │        │ 앱   10.0.12.0/24  │              │
      │  │  🖥 web-01         │        │  (확장 자리)        │              │
      │  │  퍼블릭 IP 없음     │        │                    │              │
      │  └───────────────────┘        └──────────────────┘              │
      │  ┌───────────────────┐        ┌──────────────────┐              │
      │  │ DB   10.0.21.0/24  │        │ DB   10.0.22.0/24  │  ← 15강 자리 │
      │  │  (인터넷 경로 없음)  │        │                    │              │
      │  └───────────────────┘        └──────────────────┘              │
      │                                                                 │
      │  🔗 S3 게이트웨이 엔드포인트 (무료)                                 │
      └─────────────────────────────────────────────────────────────────┘

      🖥 접속: SSM Session Manager (인바운드 포트 0개)
```

### 네트워크 문제 해결 5단계 — 오늘 쓸 도구

접속이 안 될 때 **아무 데나 찔러 보지 않고** 이 순서로 확인합니다.

```
 ① 라우팅   — 그 서브넷에서 목적지로 가는 경로가 있나?
 ② 보안 그룹 — 인바운드/아웃바운드가 허용됐나?
 ③ NACL     — 서브넷 경계에서 막히나? (상태 비저장 주의)
 ④ DNS      — 이름을 IP로 풀 수 있나?
 ⑤ 애플리케이션 — 그 포트를 실제로 듣고 있나?
```

### VPC Flow Logs — 어디서 막혔는지 보는 눈

Flow Logs는 ENI를 지나는 트래픽의 **허용/거부 기록**을 남깁니다.

```
version account-id interface-id srcaddr      dstaddr      srcport dstport protocol packets bytes start      end        action log-status
2       1234567890 eni-0abc123  203.0.113.9  10.0.11.20   43122   22      6        1       40    1723556400 1723556460 REJECT OK
2       1234567890 eni-0abc123  10.0.11.20   52.219.60.10 51422   443     6        12      4380  1723556500 1723556560 ACCEPT OK
```

| 필드 | 뜻 |
|---|---|
| `srcaddr` / `dstaddr` | 출발지 / 목적지 IP |
| `dstport` | 목적지 포트 (22 = SSH 시도) |
| `protocol` | 6 = TCP, 17 = UDP, 1 = ICMP |
| **`action`** | **ACCEPT / REJECT** ⭐ |

> 💡 **REJECT가 보인다는 것은 방화벽이 일을 하고 있다는 뜻입니다.** 오늘 실습에서 REJECT를 일부러 만들어 확인합니다.

---

## ④ 단계별 실습 — 🏁 미니 프로젝트

> 💰 **예상 비용 $0.4 ~ 0.6.** NAT Gateway가 대부분입니다. **수업 안에서 반드시 삭제**합니다.
> ⏱ **예상 소요 100분.** 설계 15분 + 구축 40분 + 검증 30분 + 정리 15분.

### Step 0. 설계 먼저 (15분) — 코드보다 종이

구축을 시작하기 전에 아래를 채웁니다. **이 표가 프로젝트 산출물 1번**입니다.

| 항목 | 내 결정 | 근거 |
|---|---|---|
| VPC CIDR | `10.0.0.0/16` | 사내망(`192.168.x`)과 겹치지 않음 |
| 서브넷 개수 | 6개 (2AZ × 3계층) | 요구 ④⑤ |
| 웹 서버 위치 | 앱 프라이빗 `10.0.11.0/24` | 요구 ① |
| 접속 방식 | SSM Session Manager | 요구 ② |
| 아웃바운드 방식 | ⬜ NAT / ⬜ 인터페이스 엔드포인트 | **Step 3에서 계산 후 결정** |
| DB 계층 라우팅 | 인터넷 경로 없음 | 최소 노출 |

### Step 1. VPC 재구축 (10분)

[07강](lesson-07.md) 과제로 만든 `create-vpc.sh` 를 실행합니다. 없다면 07강 Step 1~3, 6을 다시 수행합니다.

```bash
$ bash create-vpc.sh
VPC 생성 완료: vpc-0b1c2d3e4f5061728
서브넷 6개 생성 완료
IGW 연결 완료
보안 그룹 3개 생성 완료
환경 변수 저장: ~/course-vpc-env.sh

$ source ~/course-vpc-env.sh
$ echo $VPC_ID
vpc-0b1c2d3e4f5061728
```

**여기서는 아직 NAT를 만들지 않습니다.** Step 3에서 결정한 뒤 만듭니다.

### Step 2. 프라이빗 서브넷에 웹 서버 시작 (10분)

```bash
$ AMI_ID=$(aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' --output text)

$ INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type t3.micro \
    --subnet-id $APP_A \
    --security-group-ids $SG_APP \
    --iam-instance-profile Name=EC2-Course-Role \
    --no-associate-public-ip-address \
    --metadata-options "HttpTokens=required" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-web-01},{Key=Project,Value=aws-course},{Key=Week,Value=W04}]' \
    --query 'Instances[0].InstanceId' --output text)

$ aws ec2 wait instance-running --instance-ids $INSTANCE_ID
$ echo $INSTANCE_ID
i-0f9e8d7c6b5a40312
```

**핵심 옵션 3가지**

| 옵션 | 의미 |
|---|---|
| `--subnet-id $APP_A` | **프라이빗** 앱 서브넷에 배치 |
| `--no-associate-public-ip-address` | **퍼블릭 IP를 주지 않음** |
| `--iam-instance-profile Name=EC2-Course-Role` | SSM 접속에 필요 |

**확인 — 퍼블릭 IP가 없어야 합니다.**

```bash
$ aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].{사설IP:PrivateIpAddress,공인IP:PublicIpAddress,서브넷:SubnetId}'
{
    "사설IP": "10.0.11.20",
    "공인IP": null,          ← ⭐ 없다
    "서브넷": "subnet-0app2a..."
}
```

### Step 3. ⭐ 아웃바운드 방식 결정 — 직접 계산해 보기 (10분)

지금 상태로는 **SSM 접속도, 패키지 설치도 안 됩니다.** 밖으로 나가는 경로가 없기 때문입니다.

두 가지 선택지가 있습니다. **계산하고 고르세요.**

| | NAT Gateway | 인터페이스 엔드포인트 3종 |
|---|---|---|
| 구성 | NAT 1개 + EIP + 라우팅 | `ssm`·`ssmmessages`·`ec2messages` × AZ 수 |
| 시간당 | $0.059 + 데이터 $0.059/GB | $0.013 × 3개 × AZ 수 |
| **1개 AZ · 3시간** | **약 $0.18** | 0.013×3×1×3 = **약 $0.12** |
| **2개 AZ · 3시간** | 약 $0.18 | 0.013×3×2×3 = **약 $0.23** |
| **한 달(1AZ)** | 약 $42 | 약 $28 |
| 패키지 설치(`dnf`) | ✅ 가능 | 🚫 **불가** (인터넷 전체가 아님) |
| 보안 | 인터넷 경유 | **AWS 내부만** |

**이번 실습의 결론** — 요구사항 ③(패키지 다운로드)이 있으므로 **NAT Gateway를 씁니다.**
단, 요구사항에 ③이 없었다면 **엔드포인트가 더 싸고 안전**합니다. 이 계산 과정을 산출물에 적으세요.

> 💡 **실무에서는** 골든 AMI에 패키지를 미리 굽고([09강](../02-compute-data/lesson-09.md)) 엔드포인트만 쓰는 방식으로 **NAT를 아예 없애는** 설계도 흔합니다.

**NAT Gateway 생성**

```bash
$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc \
    --query 'AllocationId' --output text)

$ NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ALLOC \
    --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=course-nat}]' \
    --query 'NatGateway.NatGatewayId' --output text)

$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
```

> 🔴 **과금 시작 시각을 기록하세요.** ______시 ______분

```bash
$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID
{ "Return": true }

# 환경 변수 파일에 추가
$ echo "export NAT_ID=$NAT_ID" >> ~/course-vpc-env.sh
$ echo "export EIP_ALLOC=$EIP_ALLOC" >> ~/course-vpc-env.sh
$ echo "export INSTANCE_ID=$INSTANCE_ID" >> ~/course-vpc-env.sh
```

### Step 4. 🔍 검증 ① — 접속 증명 (10분)

```bash
$ aws ssm describe-instance-information \
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --query 'InstanceInformationList[*].[InstanceId,PingStatus,IPAddress]' --output table
--------------------------------------------------------
|  i-0f9e8d7c6b5a40312 |  Online  |  10.0.11.20        |
--------------------------------------------------------
```

`Online` 이 나오기까지 1~3분 걸립니다. 안 나오면 [⑤ 자주 하는 실수](#-자주-하는-실수)를 보세요.

**접속**

```bash
$ aws ssm start-session --target $INSTANCE_ID

Starting session with SessionId: admin-0a1b2c3d4e5f
sh-5.2$ hostname -I
10.0.11.20
sh-5.2$ curl -s ifconfig.me
3.36.129.44          ← NAT Gateway의 EIP로 나간다
```

> ✅ **증명 1 완료** — 퍼블릭 IP가 없는 서버에 접속했습니다. 그리고 밖으로 나갈 때는 **NAT의 IP**로 나갑니다.
> 화면을 캡처하세요.

### Step 5. 🔍 검증 ② — 아웃바운드 증명 (5분)

```bash
sh-5.2$ sudo dnf install -y nginx
Last metadata expiration check: 0:00:03 ago
...
Complete!

sh-5.2$ sudo systemctl enable --now nginx
sh-5.2$ curl -s -o /dev/null -w "%{http_code}\n" localhost
200
```

**서버 정보를 보여 주는 페이지 만들기** — 나중에 로드밸런싱 확인에도 씁니다.

```bash
sh-5.2$ TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
sh-5.2$ IID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/instance-id)
sh-5.2$ AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/placement/availability-zone)

sh-5.2$ echo "<h1>course-web</h1><p>instance: $IID</p><p>az: $AZ</p>" \
        | sudo tee /usr/share/nginx/html/index.html

sh-5.2$ curl localhost
<h1>course-web</h1><p>instance: i-0f9e8d7c6b5a40312</p><p>az: ap-northeast-2a</p>
```

> ✅ **증명 2 완료** — 인바운드는 0개인데 패키지를 받아 왔습니다. 출력을 저장하세요.

### Step 6. 🔍 검증 ③ — 격리 증명 (10분)

**세 가지 방법으로 "밖에서 못 온다"를 증명합니다.**

**① 퍼블릭 IP가 없다**

```bash
$ aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress'
null
```

**② 라우팅 테이블에 인바운드 경로가 없다**

```bash
$ aws ec2 describe-route-tables --route-table-ids $RTB_APP \
    --query 'RouteTables[0].Routes[*].[DestinationCidrBlock,GatewayId,NatGatewayId]' --output table
------------------------------------------------------------
|  10.0.0.0/16  |  local          |  None                  |
|  0.0.0.0/0    |  None           |  nat-0a1b2c3d4e5f60718 |
------------------------------------------------------------
```

**IGW(`igw-`)가 없습니다.** 인터넷에서 들어올 길이 없습니다.

**③ 실제로 접근이 안 된다** — NAT의 퍼블릭 IP로 웹 접속을 시도해 봅니다.

```bash
$ NAT_IP=$(aws ec2 describe-addresses --allocation-ids $EIP_ALLOC \
    --query 'Addresses[0].PublicIp' --output text)
$ echo $NAT_IP
3.36.129.44

$ curl -m 5 http://$NAT_IP
curl: (28) Connection timed out after 5001 milliseconds
```

> **NAT Gateway는 아웃바운드 전용**이라 밖에서 들어오는 연결을 인스턴스로 전달하지 않습니다.
> ✅ **증명 3 완료.**

### Step 7. VPC Flow Logs로 차단 기록 확인 (15분)

**① 로그 그룹과 역할 만들기**

```bash
$ aws logs create-log-group --log-group-name /aws/vpc/course-flowlogs
$ aws logs put-retention-policy --log-group-name /aws/vpc/course-flowlogs --retention-in-days 1
```

> 💡 **보존 기간을 반드시 설정합니다.** 기본값은 "만료 없음"이라 로그가 영원히 쌓이고 계속 과금됩니다.

Flow Logs가 로그를 쓸 수 있는 역할을 만듭니다.

```bash
$ cat > flowlogs-trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "vpc-flow-logs.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

$ FL_ROLE_ARN=$(aws iam create-role --role-name course-flowlogs-role \
    --assume-role-policy-document file://flowlogs-trust.json \
    --query 'Role.Arn' --output text)

$ cat > flowlogs-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ],
    "Resource": "*"
  }]
}
EOF

$ aws iam put-role-policy --role-name course-flowlogs-role \
    --policy-name flowlogs-write --policy-document file://flowlogs-policy.json
```

**② Flow Logs 활성화**

```bash
$ aws ec2 create-flow-logs \
    --resource-type VPC --resource-ids $VPC_ID \
    --traffic-type ALL \
    --log-destination-type cloud-watch-logs \
    --log-group-name /aws/vpc/course-flowlogs \
    --deliver-logs-permission-arn $FL_ROLE_ARN \
    --query 'FlowLogIds' --output text
fl-0a1b2c3d4e5f60718
```

**③ 일부러 차단되는 통신 만들기**

세션에서 열려 있지 않은 포트로 접속을 시도합니다.

```bash
sh-5.2$ curl -m 3 http://10.0.21.5:9999
curl: (28) Connection timed out
```

또는 DB 서브넷에서 인터넷으로 나가려는 시도(경로 없음)를 만들 수도 있습니다.

**④ 5~10분 뒤 로그 확인** (Flow Logs는 집계 후 전송되므로 지연이 있습니다)

```bash
$ aws logs filter-log-events \
    --log-group-name /aws/vpc/course-flowlogs \
    --filter-pattern "REJECT" \
    --max-items 5 \
    --query 'events[*].message' --output text
2 123456789012 eni-0abc123def 10.0.11.20 10.0.21.5 51422 9999 6 1 40 1723556400 1723556460 REJECT OK
2 123456789012 eni-0abc123def 45.83.64.12 10.0.1.7 39122 22 6 1 44 1723556410 1723556470 REJECT OK
```

**해석 연습**

| 필드 | 첫 번째 줄 | 뜻 |
|---|---|---|
| `srcaddr` → `dstaddr` | `10.0.11.20` → `10.0.21.5` | 앱 서버가 DB 서브넷으로 |
| `dstport` | `9999` | 열려 있지 않은 포트 |
| `action` | **REJECT** | 보안 그룹이 차단 |

> ✅ **두 번째 줄이 더 흥미롭습니다.** 외부 IP(`45.83.64.12`)가 22번 포트를 두드리다 거부됐습니다. **인터넷은 항상 스캔당하고 있습니다.**
> 이것이 22번 포트를 열면 안 되는 이유입니다.

### Step 8. 다이어그램과 산출물 정리 (10분)

**아키텍처 다이어그램**을 그립니다(draw.io 등). 반드시 포함할 것:

- [ ] VPC CIDR와 리전
- [ ] AZ 2개 경계
- [ ] 서브넷 6개와 각 CIDR
- [ ] IGW · NAT Gateway 위치
- [ ] 라우팅 화살표 (퍼블릭→IGW, 앱→NAT, DB→없음)
- [ ] EC2 인스턴스 위치와 "퍼블릭 IP 없음" 표기
- [ ] S3 엔드포인트
- [ ] 접속 경로(SSM) 표시

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 3시간 사용 | 방치 시 월 |
|---|---|---|---|
| **NAT Gateway** | ❌ | **약 $0.18** | 🔴 **약 $42** |
| NAT용 탄력적 IP | ❌ | 약 $0.02 | 약 $3.6 |
| EC2 t3.micro | ✅ 750h | $0 | 약 $9.4 |
| EBS gp3 8GB | ✅ 30GB | $0 | 약 $0.7 |
| VPC Flow Logs (CloudWatch Logs) | ✅ 5GB 수집 | $0 ~ 0.1 | 트래픽 비례 |
| VPC · 서브넷 · IGW · SG | 무료 | $0 | $0 |
| **합계** | | **약 $0.2 ~ 0.4** | **약 $56** |

> 🔴 **Flow Logs는 트래픽이 많으면 로그 비용이 빠르게 커집니다.** 보존 1일로 설정했고, 정리에서 삭제합니다.

### 🧹 리소스 정리 체크리스트

```bash
$ source ~/course-vpc-env.sh

# 1) Flow Logs 삭제
$ FL_ID=$(aws ec2 describe-flow-logs --filter "Name=resource-id,Values=$VPC_ID" \
    --query 'FlowLogs[0].FlowLogId' --output text)
$ aws ec2 delete-flow-logs --flow-log-ids $FL_ID
$ aws logs delete-log-group --log-group-name /aws/vpc/course-flowlogs

# 2) 인스턴스 종료
$ aws ec2 terminate-instances --instance-ids $INSTANCE_ID
$ aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID

# 3) 🔴 NAT Gateway 삭제 (최우선 비용)
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID

# 4) 탄력적 IP 반환
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 5) VPC 엔드포인트 → 보안 그룹 → IGW → 서브넷 → 라우팅 → VPC
#    (07강 정리 스크립트와 동일)

# 6) IAM 역할 정리
$ aws iam delete-role-policy --role-name course-flowlogs-role --policy-name flowlogs-write
$ aws iam delete-role --role-name course-flowlogs-role
```

**최종 확인 4종**

```bash
$ aws ec2 describe-nat-gateways --filter "Name=state,Values=available,pending" \
    --query 'NatGateways[*].NatGatewayId' --output text
$ aws ec2 describe-addresses --query 'Addresses[*].PublicIp' --output text
$ aws ec2 describe-instances --filters "Name=instance-state-name,Values=running,stopped" \
    --query 'Reservations[*].Instances[*].InstanceId' --output text
$ aws ec2 describe-vpcs --query 'Vpcs[?IsDefault==`false`].VpcId' --output text
```

**네 명령이 모두 빈 출력이면 정리 완료입니다.**

- [ ] Flow Logs · 로그 그룹 삭제
- [ ] 인스턴스 종료 · 잔여 볼륨 없음
- [ ] 🔴 **NAT Gateway 삭제 확인**
- [ ] 탄력적 IP 반환
- [ ] VPC 전체 삭제
- [ ] IAM 역할(`course-flowlogs-role`) 삭제
- [ ] ⭐ `EC2-Course-Role` 은 유지
- [ ] 다음 날 Cost Explorer에서 **일 비용 $0.1 미만** 확인

---

## ⑤ 자주 하는 실수

### 프라이빗 인스턴스가 SSM에 안 잡힌다 (Online이 안 뜬다)

이 프로젝트에서 **가장 많이 막히는 지점**입니다.

**확인 순서**

| # | 확인 | 명령 |
|---|---|---|
| 1 | IAM 역할이 붙었나 | `aws ec2 describe-instances --instance-ids $INSTANCE_ID --query '...IamInstanceProfile'` |
| 2 | 역할에 `AmazonSSMManagedInstanceCore` 가 있나 | IAM 콘솔 |
| 3 | **NAT가 `available` 인가** | `aws ec2 describe-nat-gateways` |
| 4 | 앱 라우팅 테이블에 `0.0.0.0/0 → nat` 가 있나 | `describe-route-tables` |
| 5 | 그 라우팅 테이블이 **서브넷에 연결**됐나 | `Associations` 확인 |
| 6 | 보안 그룹 **아웃바운드 443**이 열려 있나 | 기본은 전체 허용 |

```bash
$ aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn'
"arn:aws:iam::123456789012:instance-profile/EC2-Course-Role"
```

**NAT를 나중에 만든 경우** — 인스턴스가 먼저 부팅해 SSM 연결에 실패했을 수 있습니다. 재부팅하면 대개 해결됩니다.

```bash
$ aws ec2 reboot-instances --instance-ids $INSTANCE_ID
```

**NAT 없이 하고 싶다면** 인터페이스 엔드포인트 3종이 필요합니다.

```bash
$ for SVC in ssm ssmmessages ec2messages; do
    aws ec2 create-vpc-endpoint --vpc-id $VPC_ID \
      --vpc-endpoint-type Interface \
      --service-name com.amazonaws.ap-northeast-2.$SVC \
      --subnet-ids $APP_A --security-group-ids $SG_APP \
      --private-dns-enabled
  done
```

> ⚠️ 이때 **엔드포인트용 보안 그룹이 443 인바운드를 허용**해야 합니다. `$SG_APP` 를 그대로 쓰면 실패할 수 있습니다.

### 인스턴스에 퍼블릭 IP가 붙어 버렸다

**원인** — 서브넷의 `map-public-ip-on-launch` 가 켜져 있거나, `--associate-public-ip-address` 를 썼습니다.
**해결** — `--no-associate-public-ip-address` 를 명시하고, 앱/DB 서브넷에는 자동 할당을 켜지 않습니다.

```bash
$ aws ec2 describe-subnets --subnet-ids $APP_A \
    --query 'Subnets[0].MapPublicIpOnLaunch'
false          ← 앱 서브넷은 false 여야 정상
```

> **퍼블릭 IP가 붙어도** 프라이빗 서브넷이면 IGW 경로가 없어 실제로 도달되지는 않습니다. 그래도 **요구사항 위반**이므로 산출물에서는 반드시 `null` 이어야 합니다.

### Flow Logs에 아무것도 안 찍힌다

**원인 3가지**

| 원인 | 해결 |
|---|---|
| **집계 지연** (기본 10분 간격) | 5~10분 기다립니다 |
| IAM 역할 권한 부족 | 역할 정책에 `logs:PutLogEvents` 가 있는지 확인 |
| 트래픽이 실제로 없음 | 일부러 요청을 만들어 봅니다 |

```bash
$ aws logs describe-log-streams --log-group-name /aws/vpc/course-flowlogs \
    --query 'logStreams[*].logStreamName' --output text
eni-0abc123def-all
```

스트림 자체가 없으면 권한 문제입니다.

### 정리했는데 다음 날 NAT 비용이 찍혀 있다

**원인** — NAT 삭제가 **완료되기 전에** 창을 닫았습니다. 삭제에는 2~3분이 걸립니다.
**해결** — 반드시 `wait` 로 확인합니다.

```bash
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 describe-nat-gateways --nat-gateway-ids $NAT_ID \
    --query 'NatGateways[0].State' --output text
deleted
```

> **NAT는 시간당 과금이므로 1시간 미만도 비례 청구됩니다.** 삭제가 늦어질수록 비용이 늘어납니다.

### VPC 삭제가 계속 실패한다

```
An error occurred (DependencyViolation) when calling the DeleteVpc operation
```

**원인** — 대개 **NAT의 ENI**가 아직 남아 있습니다.
**해결**

```bash
$ aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'NetworkInterfaces[*].[NetworkInterfaceId,Description,Status]' --output table
```

목록이 빌 때까지 몇 분 기다린 뒤 다시 삭제합니다. **삭제 순서(NAT → 인스턴스 → 엔드포인트 → SG → IGW → 서브넷 → VPC)를 지키는 것**이 최선의 예방입니다.

### 보안 그룹이 서로를 참조해 삭제되지 않는다

```
An error occurred (DependencyViolation) when calling the DeleteSecurityGroup operation:
resource sg-0app... has a dependent object
```

**원인** — `SG_DB` 가 `SG_APP` 를 소스로 참조하고 있습니다.
**해결** — **참조당하는 쪽을 나중에** 지웁니다. DB → 앱 → 웹 순서. 또는 규칙을 먼저 지웁니다.

```bash
$ aws ec2 revoke-security-group-ingress --group-id $SG_DB \
    --protocol tcp --port 3306 --source-group $SG_APP
```

---

## ⑥ 확인 문제

**1.** 프라이빗 서브넷의 인스턴스에 퍼블릭 IP를 붙이면 인터넷에서 접속할 수 있게 되나요?

<details>
<summary>답 보기</summary>

**아니요. 접속할 수 없습니다.**

퍼블릭 IP가 있어도 **그 서브넷의 라우팅 테이블에 IGW로 향하는 경로가 없으면** 트래픽이 오갈 수 없습니다.

```
 인터넷 ──▶ IGW ──▶ ??? ──✗── 프라이빗 서브넷 (IGW 경로 없음)
```

**인터넷 접근에 필요한 3가지가 모두 있어야** 합니다.

| 조건 | 프라이빗 서브넷에서 |
|---|---|
| ① 퍼블릭 IP | 붙일 수는 있음 |
| ② **라우팅 테이블의 IGW 경로** | ❌ **없음** |
| ③ 보안 그룹 허용 | 설정 가능 |

②가 없으므로 도달 불가입니다. 이것이 **"퍼블릭/프라이빗은 라우팅이 결정한다"** 의 의미입니다.

> 다만 **요구사항 위반**이므로 실제로는 퍼블릭 IP를 붙이지 않습니다. 붙어 있으면 서브넷을 옮겼을 때 즉시 노출될 수 있습니다.
</details>

**2.** 이 프로젝트에서 요구사항 ③(패키지 다운로드)이 **없었다면** 어떤 구성을 택하겠습니까? 비용 차이를 계산해 근거를 드세요.

<details>
<summary>답 보기</summary>

**인터페이스 VPC 엔드포인트 3종(`ssm`, `ssmmessages`, `ec2messages`)** 만 만들고 **NAT Gateway를 없앱니다.**

**비용 비교 (1개 AZ 기준, 서울)**

| 방식 | 시간당 | 월(730시간) |
|---|---|---|
| NAT Gateway | $0.059 + 데이터 처리 | **약 $42 + α** |
| 인터페이스 엔드포인트 3종 | $0.013 × 3 = $0.039 | **약 $28** |
| **차이** | | **약 $14 이상 절감** |

**비용 외의 이점**
- 트래픽이 **인터넷을 경유하지 않습니다**(AWS 백본만 사용) → 보안 향상
- NAT라는 **단일 지점**이 사라집니다

**단점**
- 필요한 AWS 서비스마다 엔드포인트를 만들어야 합니다 (ECR, S3, CloudWatch Logs 등이 추가되면 개수가 늘어남)
- **일반 인터넷 접근은 불가능**합니다 → 패키지 설치를 못 합니다

**실무 절충안** — 패키지는 **골든 AMI에 미리 굽고**([09강](../02-compute-data/lesson-09.md)) 운영 중에는 엔드포인트만 사용합니다. 대규모 환경에서 NAT 비용을 크게 줄이는 표준 기법입니다.
</details>

**3.** Flow Logs에서 아래 레코드를 발견했습니다. 무슨 일이 있었고, 조치가 필요한가요?

```
2 123456789012 eni-0abc123 45.83.64.12 10.0.1.7 39122 22 6 1 44 ... REJECT OK
2 123456789012 eni-0abc123 91.240.118.5 10.0.1.7 44210 3389 6 1 44 ... REJECT OK
2 123456789012 eni-0abc123 45.83.64.12 10.0.1.7 39144 22 6 1 44 ... REJECT OK
```

<details>
<summary>답 보기</summary>

**외부에서 자동화된 포트 스캔이 들어왔고, 전부 차단됐습니다.**

| 항목 | 해석 |
|---|---|
| 출발지 | `45.83.64.12`, `91.240.118.5` — 외부 IP |
| 목적지 | `10.0.1.7` — 퍼블릭 서브넷의 리소스 |
| 포트 | **22(SSH)**, **3389(RDP)** — 원격 접속 포트 |
| action | **REJECT** — 보안 그룹이 차단 |

**조치가 필요한가?** — **즉각적인 조치는 불필요합니다.** 방화벽이 정상 동작한 결과입니다.

**다만 확인할 것**
1. `10.0.1.7` 이 **의도적으로 퍼블릭에 둔 리소스**인가? (NAT나 ALB라면 정상)
2. 22·3389가 **어떤 보안 그룹에서도 열려 있지 않은지** 재확인
3. 이런 시도가 **ACCEPT로 바뀌는 순간**이 있는지 감시 → CloudWatch 알람 대상 ([22강](../03-serverless-automation/lesson-22.md))

**핵심 교훈** — **인터넷에 노출된 IP는 예외 없이 상시 스캔당합니다.** 몇 분 안에 시작됩니다.
그래서 이 과정은 22번 포트를 열지 않고 **SSM으로만 접속**하도록 가르칩니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 요구사항 → 설계 | 문장을 **서브넷·라우팅·보안 그룹 결정으로 번역** |
| 프라이빗 배치 | `--no-associate-public-ip-address` + 프라이빗 서브넷 |
| 접속 | SSM(인바운드 0개) — 역할 + Agent + **나가는 경로** |
| 아웃바운드 선택 | 인터넷 전체 필요 → NAT / AWS만 → **엔드포인트(더 싸고 안전)** |
| 증명 3종 | 퍼블릭 IP 없음 · IGW 경로 없음 · 외부 접근 타임아웃 |
| Flow Logs | `action` 이 **ACCEPT/REJECT**. 보존 기간 설정 필수 |
| 정리 순서 | **NAT → 인스턴스 → 엔드포인트 → SG → IGW → 서브넷 → VPC** |

**한 장 요약**

```
 만들었다 ≠ 증명했다
   ① 퍼블릭 IP null            ② 라우팅에 igw 없음
   ③ 외부 접근 타임아웃         ④ Flow Logs REJECT
   → 이 4개가 갖춰져야 "격리했다"고 말할 수 있다
```

**오늘 반드시 기억할 한 가지**
> **네트워크는 "만든 것"이 아니라 "증명한 것"만 신뢰합니다.**
> 그리고 **NAT Gateway는 만든 그날 지웁니다.**

**과제 — 미니 프로젝트 제출물 6종**

1. **아키텍처 다이어그램** (Step 8의 체크리스트 8개 항목 포함)
2. **설계 근거 문서**
   - CIDR를 `10.0.0.0/16` 으로 정한 이유
   - 서브넷을 6개로 나눈 이유
   - **SSM 접속에 NAT와 인터페이스 엔드포인트 중 무엇을 택했고 왜인지 — 비용 계산 포함**
3. **검증 기록 3종** — ① SSM 접속 성공 ② `dnf install` 성공 ③ 외부 접근 불가(3가지 증명)
4. **Flow Logs REJECT 레코드** 캡처와 필드별 해석
5. **정리 완료 증빙** — 최종 확인 4개 명령의 빈 출력
6. **(도전) `create-vpc.sh` 완성본** — 이 강의 전체 구성을 한 번에 재현하는 스크립트. [09강](../02-compute-data/lesson-09.md)부터 매주 사용합니다.

> 💡 6번은 [23강 IaC](../03-serverless-automation/lesson-23.md)의 예고편입니다. "스크립트로 재현"이 왜 필요한지 몸으로 느끼면, CloudFormation을 배울 때 훨씬 빠릅니다.

---

## 🎓 대단원 01 완료 체크리스트

- [ ] 루트를 봉인하고 IAM 사용자/역할로만 작업한다
- [ ] 예산 알림이 동작하고 매주 자기 비용을 확인한다
- [ ] 정책 JSON을 읽고 허용/거부를 근거와 함께 판정할 수 있다
- [ ] AWS CLI로 EC2·S3를 생성·조회·삭제할 수 있다
- [ ] 2AZ 퍼블릭/프라이빗 VPC를 처음부터 설계·구축할 수 있다
- [ ] 인터넷에 노출되지 않는 서버를 만들고 접속·격리를 증명할 수 있다
- [ ] 실습 후 리소스를 남기지 않고 정리한다

**다음 대단원 예고** — [09강](../02-compute-data/lesson-09.md)부터는 오늘 만든 VPC 안에 **스스로 늘어나고 스스로 고쳐지는 서버**를 올립니다. 지금까지는 "서버 1대", 앞으로는 "서비스"입니다.

---

[← 이전 07강](lesson-07.md) · [목차](README.md) · [다음 → 09강 AMI·사용자 데이터·시작 템플릿](../02-compute-data/lesson-09.md)
