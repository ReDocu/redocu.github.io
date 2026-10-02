# 09강 · AMI · 사용자 데이터 · 시작 템플릿

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **09강 / 총 32강**
> [← 이전 08강](../01-cloud-foundation/lesson-08.md) · [목차](README.md) · [다음 → 10강 Auto Scaling 그룹](lesson-10.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 서버 설정을 **사용자 데이터(스크립트)** 로 자동화해 부팅만으로 서비스가 뜨게 만들 수 있다.
- 실행 중인 인스턴스로 **커스텀 AMI**를 만들고 그것으로 새 서버를 띄울 수 있다.
- 골든 AMI 방식과 부트스트랩 방식을 **부팅 속도·유지보수 관점에서 비교**해 선택할 수 있다.
- **시작 템플릿**을 만들고 버전으로 변경을 관리할 수 있다.
- 인스턴스 타입과 구매 옵션(온디맨드/스팟)을 **워크로드에 맞게 선택**할 수 있다.

---

## ② 왜 필요한가

[06강](../01-cloud-foundation/lesson-06.md)에서 서버에 접속해 손으로 nginx를 설치했습니다. 서버가 **1대**라면 괜찮습니다. 그런데 다음 강부터 이런 일이 벌어집니다.

> 트래픽이 늘어 서버가 **자동으로** 2대에서 4대로 늘어납니다.
> 새로 생긴 2대에는 **누가 nginx를 설치하나요?**

Auto Scaling이 만든 인스턴스에 사람이 접속해 설치할 수는 없습니다. 그 사이 사용자는 502 오류를 봅니다.

그래서 사고방식을 바꿔야 합니다.

| 옛 사고 | 새 사고 |
|---|---|
| 서버는 **애완동물** — 이름 붙이고 아프면 고친다 | 서버는 **가축** — 아프면 버리고 새로 만든다 |
| 설정을 서버에 직접 한다 | 설정을 **이미지나 스크립트에** 담는다 |
| "그 서버에 접속해서 고쳤어요" | "템플릿을 고치고 교체했어요" |

이 전환이 안 되면 이후 모든 것이 무너집니다. Auto Scaling도, 무중단 배포도, 컨테이너도 전부 **"서버를 언제든 버릴 수 있다"** 는 전제 위에 있습니다.

오늘 만드는 **사용자 데이터 스크립트와 시작 템플릿이 앞으로 8주간 계속 쓰입니다.**

---

## ③ 개념 설명

### 서버를 재현하는 두 가지 방법

```
 ① 부트스트랩 (사용자 데이터)          ② 골든 AMI
 ┌──────────────────┐                ┌──────────────────┐
 │ 기본 AMI          │                │ 미리 설치해 둔 AMI  │
 │  + 부팅 시 스크립트 │                │  (이미 다 들어 있음)│
 │    실행           │                │                  │
 └──────────────────┘                └──────────────────┘
   부팅 2~3분 (설치 시간)                부팅 40초
   변경이 쉬움                          이미지를 다시 구워야 함
   외부 저장소에 의존                    자기 완결적
```

| 항목 | 부트스트랩 | 골든 AMI |
|---|---|---|
| 부팅 속도 | 느림(설치 시간) | **빠름** |
| 일관성 | 패키지 버전이 그때그때 다를 수 있음 | **완전히 동일** |
| 변경 용이성 | **스크립트만 고치면 끝** | 이미지를 다시 구워야 함 |
| 외부 의존 | 리포지토리가 죽으면 부팅 실패 | **없음** |
| 적합 | 변경이 잦은 개발 환경 | 대규모·빠른 확장이 필요한 운영 |

> 💡 **실무는 혼합형입니다.** 무거운 것(런타임·에이전트·OS 패치)은 AMI에 굽고, 자주 바뀌는 것(애플리케이션 코드·설정)은 부팅 시 내려받습니다.

### 사용자 데이터(User Data)의 규칙

| 규칙 | 내용 |
|---|---|
| 실행 시점 | **최초 부팅 1회** (기본값). 재부팅 시 실행되지 않음 |
| 실행 사용자 | **root** (`sudo` 불필요) |
| 시작 줄 | `#!/bin/bash` 로 시작해야 셸 스크립트로 인식 |
| 로그 | `/var/log/cloud-init-output.log` |
| 크기 제한 | **16KB** (base64 인코딩 전) |
| 보안 | **메타데이터로 조회 가능** → 비밀번호·키 금지 🔴 |

**디버깅 위치를 외워 두세요.**

```bash
$ sudo cat /var/log/cloud-init-output.log        # 스크립트 출력·에러
$ sudo cloud-init status                          # 완료 여부
```

### 인스턴스 타입 선택 기준

| 패밀리 | 성격 | vCPU:메모리 | 대표 용도 |
|---|---|---|---|
| **T** (t3, t4g) | 버스터블 | 1:2~1:4 | 개발, 소규모 웹, **이 과정** |
| **M** (m5, m6i, m7g) | 범용 | 1:4 | 일반 앱 서버 |
| **C** (c6i, c7g) | 컴퓨팅 | 1:2 | 인코딩, 배치 |
| **R** (r6i) | 메모리 | 1:8 | 캐시, 인메모리 처리 |

**접미사 읽기**

| 표기 | 뜻 |
|---|---|
| `m6i` | Intel |
| `m6a` | AMD (대체로 약 10% 저렴) |
| `m6g`, `t4g` | **AWS Graviton(ARM)** — 대체로 **20% 저렴하고 성능/와트 우수** |
| `m6id` | 로컬 NVMe 디스크 포함 |

> 💡 **Graviton은 비용 최적화의 대표 수단**입니다. 단, **ARM 아키텍처**이므로 AMI와 컨테이너 이미지가 `arm64` 여야 합니다. [31강](../04-final-project/lesson-31.md) 비용 최적화에서 다시 다룹니다.

### T 계열의 CPU 크레딧

```
  CPU 사용률
   100% │        ▄▄▄▄  ← 크레딧 소비하며 버스트
        │      ▄▄    ▀▀▄▄
   20%  │▄▄▄▄▄▄            ▀▀▀▀▀▀  ← 크레딧 소진 후 기준선으로 하락
        └──────────────────────────▶ 시간
```

| 모드 | 동작 | 비용 |
|---|---|---|
| **standard** | 크레딧 소진 시 성능이 기준선으로 떨어짐 | 추가 비용 없음 |
| **unlimited** (t3 기본값) | 크레딧을 초과해도 성능 유지 | **초과분 vCPU-시간당 추가 과금** 🔴 |

> 🔴 **"프리 티어인데 왜 돈이 나오지?"의 숨은 원인 중 하나가 이것입니다.**
> `t3` 는 기본이 `unlimited` 입니다. 부하 테스트를 오래 돌리면 크레딧 초과 요금이 붙습니다. 실습에서는 필요 시 `standard` 로 바꿉니다.

### 구매 옵션 다시 보기

| 옵션 | 할인 | 중단 | 이 과정에서 |
|---|---|---|---|
| 온디맨드 | 기준가 | 없음 | **기본** |
| Savings Plans | ~72% | 없음 | 최종 프로젝트 비용 산정에서 계산 |
| 스팟 | ~90% | **2분 통보 후 회수** | Step 6에서 체험 |

### 시작 템플릿(Launch Template)

인스턴스를 만들 때 필요한 **모든 설정을 담은 틀**이며, **버전 관리**가 됩니다.

```
 시작 템플릿: course-web-template
   ├─ 버전 1  (nginx 기본 페이지)
   ├─ 버전 2  (헬스 체크 경로 /health 추가)    ← 11강
   └─ 버전 3  (애플리케이션 배포 추가)          ← 16강
```

| 담기는 것 | 예 |
|---|---|
| AMI ID | `ami-0c9c...` |
| 인스턴스 타입 | `t3.micro` |
| 보안 그룹 | `sg-app...` |
| **IAM 인스턴스 프로파일** | `EC2-Course-Role` |
| **사용자 데이터** | 부팅 스크립트 |
| 태그 | `Project` `Owner` `Week` |
| 메타데이터 옵션 | IMDSv2 필수 |

> 📌 **시작 구성(Launch Configuration)이라는 옛 기능도 있지만 신규 사용은 지원되지 않습니다.** 반드시 **시작 템플릿**을 씁니다.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.1 ~ 0.2** — EC2는 프리 티어, NAT Gateway가 대부분입니다.
> ⚠️ 시작 전에 [08강](../01-cloud-foundation/lesson-08.md)의 `create-vpc.sh` 로 VPC를 복원합니다.

### Step 1. VPC 복원 (5분)

```bash
$ bash create-vpc.sh
$ source ~/course-vpc-env.sh
$ echo "VPC: $VPC_ID / APP_A: $APP_A"
VPC: vpc-0c2d3e4f5a6b71829 / APP_A: subnet-0a1b2c3d4e5f60718
```

NAT Gateway도 만듭니다(패키지 설치에 필요).

```bash
$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
$ NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ALLOC \
    --query 'NatGateway.NatGatewayId' --output text)
$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID
```

> 🔴 **NAT 과금 시작.** 오늘도 수업 끝에 반드시 지웁니다.

### Step 2. 사용자 데이터 스크립트 작성 ⭐ (20분)

**앞으로 8주간 계속 쓸 스크립트**입니다. 잘 만들어 두세요.

```bash
$ cat > user-data.sh <<'EOF'
#!/bin/bash
set -euxo pipefail

# ── 1. 패키지 설치 ────────────────────────────────
dnf update -y
dnf install -y nginx

# ── 2. 인스턴스 정보 수집 (IMDSv2) ─────────────────
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
IID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
      http://169.254.169.254/latest/meta-data/instance-id)
AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
     http://169.254.169.254/latest/meta-data/placement/availability-zone)
ITYPE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/instance-type)
PRIVIP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
         http://169.254.169.254/latest/meta-data/local-ipv4)

# ── 3. 메인 페이지 ────────────────────────────────
cat > /usr/share/nginx/html/index.html <<HTML
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><title>course-web</title>
<style>
 body{font-family:system-ui;margin:0;display:grid;place-items:center;height:100vh;background:#0f172a;color:#e2e8f0}
 .card{background:#1e293b;padding:2rem 3rem;border-radius:12px;border-left:6px solid #ff9900}
 h1{margin:0 0 1rem;color:#ff9900} td{padding:.3rem 1rem} td:first-child{color:#94a3b8}
</style></head>
<body><div class="card">
<h1>AWS Course Web</h1>
<table>
<tr><td>instance</td><td><b>$IID</b></td></tr>
<tr><td>az</td><td><b>$AZ</b></td></tr>
<tr><td>type</td><td>$ITYPE</td></tr>
<tr><td>private ip</td><td>$PRIVIP</td></tr>
</table></div></body></html>
HTML

# ── 4. 헬스 체크 경로 (11강 ALB에서 사용) ───────────
mkdir -p /usr/share/nginx/html/health
echo "OK" > /usr/share/nginx/html/health/index.html

# ── 5. 서비스 기동 (부팅 시 자동 실행 등록 포함) ─────
systemctl enable --now nginx

echo "user-data 완료: $(date)"
EOF
```

**스크립트에서 눈여겨볼 점**

| 부분 | 이유 |
|---|---|
| `set -euxo pipefail` | 오류 시 즉시 중단(`e`), 실행 명령 출력(`x`) → **로그 디버깅이 쉬워짐** |
| `<<'EOF'` (따옴표) | 변수를 **지금** 치환하지 않고 스크립트 안에서 실행되게 함 |
| IMDSv2 토큰 | IMDSv1은 보안상 비활성화 권장 |
| `/health` 경로 | [11강 ALB 헬스 체크](lesson-11.md)에서 바로 사용 |
| `enable --now` | 재부팅해도 자동 기동 |

### Step 3. 사용자 데이터로 인스턴스 시작 (10분)

**퍼블릭 서브넷에 띄워 브라우저로 바로 확인**합니다. (테스트 목적)

```bash
# 내 IP만 80 허용하는 임시 보안 그룹
$ MY_IP=$(curl -s https://checkip.amazonaws.com)
$ SG_TEST=$(aws ec2 create-security-group --group-name course-sg-test \
    --description "temp test" --vpc-id $VPC_ID --query 'GroupId' --output text)
$ aws ec2 authorize-security-group-ingress --group-id $SG_TEST \
    --protocol tcp --port 80 --cidr ${MY_IP}/32

$ AMI_ID=$(aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' --output text)

$ INST1=$(aws ec2 run-instances \
    --image-id $AMI_ID --instance-type t3.micro \
    --subnet-id $PUB_A --security-group-ids $SG_TEST \
    --iam-instance-profile Name=EC2-Course-Role \
    --associate-public-ip-address \
    --metadata-options "HttpTokens=required" \
    --user-data file://user-data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-bootstrap},{Key=Project,Value=aws-course},{Key=Week,Value=W05}]' \
    --query 'Instances[0].InstanceId' --output text)

$ aws ec2 wait instance-running --instance-ids $INST1
```

**부팅 완료까지 기다렸다가 접속**

```bash
$ PUB_IP=$(aws ec2 describe-instances --instance-ids $INST1 \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

# 몇 번 실패하다 성공합니다 — 설치에 시간이 걸리기 때문
$ curl -s -o /dev/null -w "%{http_code}\n" http://$PUB_IP
000
$ curl -s -o /dev/null -w "%{http_code}\n" http://$PUB_IP
200
```

브라우저로 `http://<PUB_IP>` 를 열면 인스턴스 정보 카드가 보입니다.

**부팅 소요 시간 측정** — 이 값을 Step 4의 AMI 방식과 비교합니다.

```bash
$ aws ssm start-session --target $INST1
sh-5.2$ sudo cloud-init analyze show | tail -5
Finished stage: (modules-final) 118.42 seconds

sh-5.2$ sudo tail -3 /var/log/cloud-init-output.log
+ systemctl enable --now nginx
+ echo 'user-data 완료: Thu Aug 13 15:02:41 UTC 2026'
user-data 완료: Thu Aug 13 15:02:41 UTC 2026
```

> ⏱ **부트스트랩 방식: 약 2분** (패키지 설치 포함)

### Step 4. 커스텀 AMI 만들기 (20분)

**① AMI 생성 전 정리** — 이미지에 굽히면 안 되는 것을 지웁니다.

```bash
sh-5.2$ sudo rm -rf /var/log/cloud-init*.log /tmp/*
sh-5.2$ sudo dnf clean all
sh-5.2$ history -c
```

> ⚠️ **AMI에 굽히면 안 되는 것** — 자격 증명, SSH 호스트 키, 로그, 인스턴스 고유 정보.
> 특히 **`~/.aws/credentials` 가 있으면 그대로 복제**됩니다.

**② AMI 생성**

```bash
$ AMI_CUSTOM=$(aws ec2 create-image \
    --instance-id $INST1 \
    --name "course-web-ami-$(date +%Y%m%d-%H%M)" \
    --description "nginx + health endpoint" \
    --tag-specifications 'ResourceType=image,Tags=[{Key=Project,Value=aws-course}]' \
    --query 'ImageId' --output text)
$ echo $AMI_CUSTOM
ami-0d4e5f6a7b8c90123

$ aws ec2 wait image-available --image-ids $AMI_CUSTOM
$ echo "AMI 준비 완료"
AMI 준비 완료
```

> ⏱ AMI 생성에는 **3~7분**이 걸립니다. 그동안 Step 5의 개념을 읽으세요.
> 📌 `create-image` 는 기본적으로 **인스턴스를 재부팅**합니다. 재부팅 없이 만들려면 `--no-reboot` 을 쓰지만 **파일 시스템 일관성이 보장되지 않습니다.**

**③ AMI로 새 인스턴스 시작 — 사용자 데이터 없이**

```bash
$ INST2=$(aws ec2 run-instances \
    --image-id $AMI_CUSTOM --instance-type t3.micro \
    --subnet-id $PUB_A --security-group-ids $SG_TEST \
    --iam-instance-profile Name=EC2-Course-Role \
    --associate-public-ip-address \
    --metadata-options "HttpTokens=required" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-golden},{Key=Project,Value=aws-course}]' \
    --query 'Instances[0].InstanceId' --output text)

$ aws ec2 wait instance-running --instance-ids $INST2
$ PUB_IP2=$(aws ec2 describe-instances --instance-ids $INST2 \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

$ curl -s -o /dev/null -w "%{http_code}\n" http://$PUB_IP2
200
```

> ⏱ **골든 AMI 방식: 약 40초.** 사용자 데이터 없이도 nginx가 이미 떠 있습니다.

**④ 비교표 작성** — 과제에 넣을 값입니다.

| 방식 | 부팅~응답 | 변경 시 필요한 작업 | 외부 의존 |
|---|---|---|---|
| 부트스트랩 | 약 **120초** | 스크립트 수정만 | 패키지 리포지토리 |
| 골든 AMI | 약 **40초** | **AMI 재생성**(5분+) 후 템플릿 갱신 | 없음 |

> ⚠️ **AMI의 페이지 내용이 첫 인스턴스의 것으로 고정**되어 있는 것을 확인하세요. `instance` 값이 `INST1` 의 ID로 나옵니다.
> 이것이 골든 AMI의 함정입니다. **동적인 값은 부팅 시 생성해야** 합니다. → **혼합형**이 답인 이유.

### Step 5. 시작 템플릿 만들기 ⭐ (20분)

**혼합형으로 갑니다** — AMI는 기본 AMI를 쓰고, 사용자 데이터로 동적 구성.

```bash
$ B64_USERDATA=$(base64 -w 0 user-data.sh)     # macOS는 base64 -i user-data.sh

$ cat > lt-data.json <<EOF
{
  "ImageId": "$AMI_ID",
  "InstanceType": "t3.micro",
  "IamInstanceProfile": { "Name": "EC2-Course-Role" },
  "SecurityGroupIds": ["$SG_APP"],
  "UserData": "$B64_USERDATA",
  "MetadataOptions": { "HttpTokens": "required", "HttpEndpoint": "enabled" },
  "Monitoring": { "Enabled": false },
  "TagSpecifications": [{
    "ResourceType": "instance",
    "Tags": [
      {"Key": "Name", "Value": "course-web"},
      {"Key": "Project", "Value": "aws-course"},
      {"Key": "Week", "Value": "W05"}
    ]
  }]
}
EOF

$ LT_ID=$(aws ec2 create-launch-template \
    --launch-template-name course-web-template \
    --version-description "v1 nginx + health" \
    --launch-template-data file://lt-data.json \
    --query 'LaunchTemplate.LaunchTemplateId' --output text)
$ echo $LT_ID
lt-0a1b2c3d4e5f60718
```

> 📌 **보안 그룹을 `$SG_APP` 로 지정**했습니다. 앱 계층 보안 그룹이며, [11강](lesson-11.md)에서 ALB 보안 그룹으로부터만 80을 받도록 되어 있습니다.

**템플릿으로 인스턴스 시작해 보기**

```bash
$ INST3=$(aws ec2 run-instances \
    --launch-template LaunchTemplateId=$LT_ID,Version=1 \
    --subnet-id $APP_A \
    --query 'Instances[0].InstanceId' --output text)
$ aws ec2 wait instance-running --instance-ids $INST3
```

**버전 2 만들기 — 변경 관리 체험**

사용자 데이터에 한 줄을 추가한 뒤 새 버전을 만듭니다.

```bash
$ sed -i 's|echo "user-data 완료|echo "v2 배포됨" >> /usr/share/nginx/html/health/index.html\necho "user-data 완료|' user-data.sh
$ B64_V2=$(base64 -w 0 user-data.sh)

$ aws ec2 create-launch-template-version \
    --launch-template-id $LT_ID \
    --version-description "v2 health message" \
    --source-version 1 \
    --launch-template-data "{\"UserData\":\"$B64_V2\"}" \
    --query 'LaunchTemplateVersion.VersionNumber' --output text
2

# 기본 버전을 2로 지정
$ aws ec2 modify-launch-template --launch-template-id $LT_ID --default-version 2
```

```bash
$ aws ec2 describe-launch-template-versions --launch-template-id $LT_ID \
    --query 'LaunchTemplateVersions[*].[VersionNumber,VersionDescription,DefaultVersion]' \
    --output table
--------------------------------------------------------
|  1  |  v1 nginx + health      |  False               |
|  2  |  v2 health message      |  True                |
--------------------------------------------------------
```

> ✅ **이 템플릿이 [10강 Auto Scaling](lesson-10.md)의 입력값입니다.** 오늘 만든 것을 그대로 씁니다.

### Step 6. 스팟 인스턴스 체험 (10분)

```bash
$ aws ec2 describe-spot-price-history \
    --instance-types t3.micro --product-descriptions "Linux/UNIX" \
    --max-items 4 \
    --query 'SpotPriceHistory[*].[AvailabilityZone,SpotPrice,Timestamp]' --output table
------------------------------------------------------------------
|  ap-northeast-2a  |  0.003900  |  2026-08-13T14:00:00+00:00    |
|  ap-northeast-2b  |  0.004100  |  2026-08-13T14:00:00+00:00    |
|  ap-northeast-2c  |  0.003900  |  2026-08-13T14:00:00+00:00    |
|  ap-northeast-2d  |  0.004200  |  2026-08-13T14:00:00+00:00    |
------------------------------------------------------------------
```

**온디맨드 $0.0130 대비 약 $0.0039 — 70% 할인**입니다.

```bash
$ INST_SPOT=$(aws ec2 run-instances \
    --launch-template LaunchTemplateId=$LT_ID,Version=2 \
    --subnet-id $APP_A \
    --instance-market-options '{"MarketType":"spot","SpotOptions":{"SpotInstanceType":"one-time"}}' \
    --query 'Instances[0].InstanceId' --output text)

$ aws ec2 describe-instances --instance-ids $INST_SPOT \
    --query 'Reservations[0].Instances[0].{수명주기:InstanceLifecycle,상태:State.Name}'
{
    "수명주기": "spot",
    "상태": "running"
}
```

> ⚠️ **스팟은 언제든 회수될 수 있습니다.** 회수 2분 전에 메타데이터로 통보가 옵니다.
> ```bash
> curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
>   http://169.254.169.254/latest/meta-data/spot/instance-action
> ```
> 애플리케이션은 이 신호를 감지해 **정상 종료(graceful shutdown)** 하도록 만듭니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| EC2 t3.micro × 최대 4대 | ✅ 750h **합산** | $0 ~ 0.3 | 4대면 약 $37 |
| **EBS 스냅샷(AMI)** | ✅ 1GB | 약 $0.01 | 8GB면 약 $0.4 |
| **NAT Gateway** | ❌ | 약 $0.36 | 🔴 **약 $42** |
| 탄력적 IP | ❌ | 약 $0.03 | 약 $3.6 |
| 스팟 인스턴스 | ✅(프리 티어 시간에 합산) | 약 $0.01 | — |
| **합계** | | **약 $0.4** | **약 $83** |

> 🔴 **프리 티어 750시간은 인스턴스 대수 합산입니다.**
> 4대를 켜면 하루에 96시간이 소진되어 **8일이면 한 달치가 끝납니다.** 오늘처럼 여러 대를 띄우는 실습 후에는 반드시 종료하세요.
> 🔴 **AMI를 등록 취소해도 EBS 스냅샷은 남습니다.** 둘 다 지워야 과금이 멈춥니다.

### 🧹 리소스 정리 체크리스트

```bash
# 1) 인스턴스 전부 종료
$ aws ec2 terminate-instances --instance-ids $INST1 $INST2 $INST3 $INST_SPOT
$ aws ec2 wait instance-terminated --instance-ids $INST1 $INST2 $INST3 $INST_SPOT

# 2) 커스텀 AMI 등록 취소 + 스냅샷 삭제  ← 둘 다 필요!
$ SNAP_ID=$(aws ec2 describe-images --image-ids $AMI_CUSTOM \
    --query 'Images[0].BlockDeviceMappings[0].Ebs.SnapshotId' --output text)
$ aws ec2 deregister-image --image-id $AMI_CUSTOM
$ aws ec2 delete-snapshot --snapshot-id $SNAP_ID

# 3) NAT Gateway + EIP
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 4) 임시 보안 그룹
$ aws ec2 delete-security-group --group-id $SG_TEST

# 5) 확인
$ aws ec2 describe-snapshots --owner-ids self --query 'Snapshots[*].[SnapshotId,VolumeSize]' --output text
$ aws ec2 describe-images --owners self --query 'Images[*].ImageId' --output text
```

- [ ] 인스턴스 전부 종료 (스팟 포함)
- [ ] 🔴 **AMI 등록 취소 + 스냅샷 삭제** (`describe-snapshots --owner-ids self` 빈 출력)
- [ ] NAT Gateway 삭제 + EIP 반환
- [ ] 임시 보안 그룹 삭제
- [ ] ⭐ **시작 템플릿(`course-web-template`)은 유지** — [10강](lesson-10.md)에서 사용
- [ ] ⭐ `user-data.sh` 파일 보관
- [ ] VPC는 유지하거나 삭제(10강에서 재구축 가능)

---

## ⑤ 자주 하는 실수

### 사용자 데이터가 실행되지 않는다

**증상** — 인스턴스는 떴는데 nginx가 없습니다.

```bash
sh-5.2$ systemctl status nginx
Unit nginx.service could not be found.
```

**확인 순서**

```bash
sh-5.2$ sudo cloud-init status
status: error                      ← done 이어야 정상

sh-5.2$ sudo cat /var/log/cloud-init-output.log | tail -20
+ dnf install -y nginx
Errors during downloading metadata for repository 'amazonlinux':
Curl error (28): Timeout was reached
```

| 원인 | 해결 |
|---|---|
| **첫 줄에 `#!/bin/bash` 가 없다** | 셸 스크립트로 인식되지 않음. 첫 줄 확인 |
| **인터넷에 못 나간다** | NAT/라우팅 확인 — 위 예시가 이 경우 |
| 문법 오류 | `set -x` 로그에서 마지막 실행 줄 확인 |
| 재부팅했다 | 사용자 데이터는 **최초 1회만** 실행 |
| 16KB 초과 | 스크립트를 S3에 두고 내려받는 방식으로 변경 |

**수동 재실행으로 디버깅**

```bash
sh-5.2$ sudo cloud-init clean --logs
sh-5.2$ sudo cloud-init init && sudo cloud-init modules --mode=final
```

### 사용자 데이터의 변수가 이상하게 치환된다

**증상** — 페이지에 `$IID` 가 그대로 나오거나, 빈 값이 나옵니다.
**원인** — 히어독 따옴표 처리입니다.

```bash
cat > user-data.sh <<EOF      # ❌ 지금(로컬)에서 $IID 가 치환됨 → 빈 값
cat > user-data.sh <<'EOF'    # ✅ 그대로 파일에 기록 → 인스턴스에서 실행 시 치환
```

**해결** — 스크립트 파일을 만들 때는 **`<<'EOF'`(따옴표 있음)**, 스크립트 안에서 값을 넣을 때는 `<<HTML`(따옴표 없음)을 씁니다. Step 2의 예제가 정확히 그 구조입니다.

### AMI로 만든 인스턴스가 전부 같은 정보를 표시한다

**증상** — 인스턴스 3대가 전부 `i-0f9e8d...` 하나의 ID를 보여 줍니다.
**원인** — **AMI를 굽는 시점의 파일이 그대로 복제**됩니다. `index.html` 은 이미 만들어진 정적 파일입니다.
**해결** — 동적 값은 **부팅 시 생성**해야 합니다. 골든 AMI에는 패키지만 굽고, 인스턴스별 정보는 사용자 데이터로 채웁니다(혼합형).

> 이것이 실무에서 **"AMI에 무엇을 굽고 무엇을 굽지 않을지"** 를 가르는 기준입니다.
> - 굽는 것: 런타임, 에이전트, OS 패치, 공통 설정
> - 굽지 않는 것: 인스턴스 고유 값, 환경별 설정, 자주 바뀌는 애플리케이션 코드

### AMI를 지웠는데 비용이 계속 나온다

```bash
$ aws ec2 describe-snapshots --owner-ids self \
    --query 'Snapshots[*].[SnapshotId,VolumeSize,StartTime]' --output table
--------------------------------------------------------
|  snap-0a1b2c3d4e5f  |  8  |  2026-08-13T15:20:11+00 |
--------------------------------------------------------
```

**원인** — **`deregister-image` 는 AMI 등록만 해제**합니다. 실제 데이터인 **EBS 스냅샷은 남습니다.**
**해결** — 스냅샷 ID를 찾아 함께 삭제합니다. (정리 스크립트의 2번 단계)

### 시작 템플릿을 고쳤는데 반영이 안 된다

**원인** — 템플릿은 **불변(immutable)** 입니다. 수정이 아니라 **새 버전 생성**만 가능합니다. 그리고 새 버전을 만들어도 **기본 버전을 바꾸지 않으면** 이전 버전이 계속 쓰입니다.
**해결**

```bash
$ aws ec2 create-launch-template-version --launch-template-id $LT_ID --source-version 1 ...
$ aws ec2 modify-launch-template --launch-template-id $LT_ID --default-version 3
```

> [10강](lesson-10.md)에서 ASG가 `$Latest` 또는 `$Default` 를 참조하게 설정하면 자동으로 최신 버전을 쓰게 할 수 있습니다.

### `base64` 명령 옵션이 달라 실패한다

```
base64: invalid option -- 'w'
```

**원인** — macOS의 `base64` 는 `-w` 옵션이 없습니다.
**해결**

| OS | 명령 |
|---|---|
| Linux | `base64 -w 0 user-data.sh` |
| macOS | `base64 -i user-data.sh` |
| PowerShell | `[Convert]::ToBase64String([IO.File]::ReadAllBytes("user-data.sh"))` |

> 💡 **콘솔에서 시작 템플릿을 만들면** 사용자 데이터를 평문으로 붙여넣을 수 있어 이 문제가 없습니다.

### `t3.micro` 인데 CPU 요금이 추가로 나왔다

**원인** — `t3` 의 기본 크레딧 모드가 **`unlimited`** 입니다. 부하 테스트로 크레딧을 초과하면 추가 과금됩니다.
**해결** — 실습에서는 `standard` 로 바꿉니다.

```bash
$ aws ec2 modify-instance-credit-specification \
    --instance-credit-specification "InstanceId=$INST1,CpuCredits=standard"
```

> [10강](lesson-10.md) 부하 테스트 실습 전에 이 설정을 확인하세요.

---

## ⑥ 확인 문제

**1.** 인스턴스를 재부팅했더니 사용자 데이터가 다시 실행되지 않았습니다. 정상인가요? 매 부팅마다 실행되게 하려면?

<details>
<summary>답 보기</summary>

**정상입니다.** 사용자 데이터는 기본적으로 **최초 부팅 1회만** 실행됩니다.

cloud-init이 실행 기록을 남겨 두고 두 번째 부팅부터는 건너뜁니다.

**매 부팅마다 실행하려면** 세 가지 방법이 있습니다.

| 방법 | 내용 |
|---|---|
| cloud-init 지시자 | 사용자 데이터 첫 부분에 `#cloud-config` 와 `cloud_final_modules: [scripts-user, always]` |
| **systemd 유닛** | 스크립트를 서비스로 등록하고 `enable` (권장) |
| 수동 초기화 | `cloud-init clean` 후 재부팅 (테스트용) |

**실무 판단** — 매 부팅 실행이 필요하다면 그것은 사용자 데이터의 일이 아니라 **서비스(systemd)의 일**입니다. 사용자 데이터는 "이 서버를 처음 만들 때 한 번" 하는 초기화용입니다.
</details>

**2.** 골든 AMI 방식과 부트스트랩 방식의 트레이드오프를 3가지 관점에서 설명하고, "1분 안에 100대로 확장해야 하는 서비스"에는 무엇을 택할지 답하세요.

<details>
<summary>답 보기</summary>

| 관점 | 골든 AMI | 부트스트랩 |
|---|---|---|
| **부팅 속도** | 빠름(약 40초) | 느림(약 120초, 설치 시간) |
| **변경 용이성** | AMI 재생성 필요(5분+) | **스크립트 수정만** |
| **외부 의존** | 없음(자기 완결) | **패키지 리포지토리가 죽으면 부팅 실패** |

**"1분 안에 100대" → 골든 AMI**

이유:
1. 부트스트랩이면 **100대가 동시에 패키지를 내려받아** 리포지토리에 부하가 몰리고, 부팅이 더 느려집니다.
2. 부팅 시간이 곧 **장애 복구 시간(RTO)** 입니다. 급증 트래픽에는 40초와 120초의 차이가 결정적입니다.
3. 리포지토리 장애가 곧 **확장 실패**로 이어지는 위험을 제거합니다.

**실무 정답은 혼합형** — 무거운 것(런타임·에이전트·패치)은 AMI에 굽고, 인스턴스별 동적 값과 애플리케이션 코드는 부팅 시 처리합니다. 이 방식이면 부팅 시간을 짧게 유지하면서도 배포 유연성을 얻습니다.
</details>

**3.** 시작 템플릿의 사용자 데이터에 데이터베이스 비밀번호를 넣으면 안 되는 이유는? 대안은?

<details>
<summary>답 보기</summary>

**사용자 데이터는 인스턴스 메타데이터로 누구나 읽을 수 있기 때문입니다.**

```bash
sh-5.2$ TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
sh-5.2$ curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/../user-data
#!/bin/bash
DB_PASSWORD="p@ssw0rd123"        ← 그대로 노출
```

**노출 경로 3가지**
1. 인스턴스에 침입한 공격자(또는 SSRF 취약점)가 메타데이터로 조회
2. `ec2:DescribeLaunchTemplateVersions` 권한이 있는 IAM 주체가 콘솔/CLI로 조회
3. AMI를 공유하거나 템플릿을 내보낼 때 함께 유출

**대안**

| 용도 | 서비스 | 비용 |
|---|---|---|
| 자격 증명(자동 교체 필요) | **AWS Secrets Manager** | 비밀당 월 $0.40 |
| 일반 설정값 | **SSM 파라미터 스토어**(SecureString) | 표준 무료 |

**사용 방식** — 사용자 데이터에는 **"시크릿을 가져오는 명령"만** 넣습니다.

```bash
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id course/db/password --query SecretString --output text)
```

권한은 **IAM 역할**로 부여합니다. 값 자체는 어디에도 기록되지 않습니다. ([15강](lesson-15.md)·[25강](../04-final-project/lesson-25.md)에서 실습)
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 가축 vs 애완동물 | 서버는 고치는 것이 아니라 **버리고 새로 만드는 것** |
| 사용자 데이터 | **최초 부팅 1회**, root 실행, `#!/bin/bash` 필수, 16KB, **비밀 금지** |
| 디버깅 | `/var/log/cloud-init-output.log`, `cloud-init status` |
| 골든 AMI | 빠른 부팅·일관성 / 재생성 부담. **동적 값은 굽지 않는다** |
| AMI 정리 | **등록 취소 + 스냅샷 삭제** 둘 다 필요 |
| 시작 템플릿 | 불변·**버전 관리**. 기본 버전 지정 잊지 말 것 |
| 인스턴스 타입 | 패밀리·세대·크기. `g` = Graviton(약 20% 저렴, ARM) |
| T 계열 | `unlimited` 기본 → **크레딧 초과 시 추가 과금** |
| 스팟 | 최대 90% 할인, **2분 통보 후 회수** |

**한 장 요약**

```
  기본 AMI + 사용자 데이터  →  시작 템플릿(버전 관리)  →  10강 Auto Scaling
     (무거운 건 골든 AMI로, 동적인 건 부팅 시)

  정리: 인스턴스 종료 → AMI 등록 취소 → 스냅샷 삭제 → NAT 삭제
```

**오늘 반드시 기억할 한 가지**
> **서버에 손으로 한 일은 다음 서버에 남지 않습니다.**
> 모든 설정은 **스크립트나 이미지**에 있어야 합니다.

**과제**
1. `user-data.sh` 전문과, 그것으로 뜬 인스턴스의 웹 페이지 캡처(인스턴스 ID·AZ 표시)를 제출하세요.
2. **부팅 시간 비교표** — 부트스트랩 방식과 골든 AMI 방식의 "시작~HTTP 200 응답"까지 시간을 각 3회 측정해 평균을 내세요.
3. 시작 템플릿 **버전 1과 2의 차이**를 `describe-launch-template-versions` 출력으로 보여 주세요.
4. "내 서비스라면 골든 AMI와 부트스트랩 중 무엇을 택할지"를 **5줄로** 쓰세요. 부팅 시간·배포 주기·리포지토리 의존을 근거로 드세요.
5. 정리 확인 — `describe-snapshots --owner-ids self` 와 `describe-images --owners self` 가 **빈 출력**인 화면.
6. 이번 주 Cost Explorer 캡처. **EC2-Other 항목(NAT·EBS)** 이 있으면 무엇 때문인지 설명하세요.

---

[← 이전 08강](../01-cloud-foundation/lesson-08.md) · [목차](README.md) · [다음 → 10강 Auto Scaling 그룹](lesson-10.md)
