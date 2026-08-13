# 14강 · EBS · EFS · CloudFront

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **14강 / 총 32강**
> [← 이전 13강](lesson-13.md) · [목차](README.md) · [다음 → 15강 RDS와 Aurora](lesson-15.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- **블록 · 파일 · 객체** 스토리지의 차이를 이해하고 용도에 맞게 선택할 수 있다.
- EBS 볼륨 타입을 고르고 **스냅샷으로 AZ 경계를 넘어 복원**할 수 있다.
- EFS를 여러 인스턴스에 **동시 마운트**해 공유 스토리지를 만들 수 있다.
- CloudFront + **OAC**로 S3를 비공개로 유지한 채 CDN 배포할 수 있다.
- 캐시 동작을 확인하고 **무효화와 버전 파일명 전략**을 비교할 수 있다.

---

## ② 왜 필요한가

[13강](lesson-13.md)에서 S3를 배웠습니다. 그런데 S3로 안 되는 일이 있습니다.

**① 운영체제를 S3에 설치할 수는 없다**
EC2의 루트 디스크는 블록 장치여야 합니다. → **EBS**

**② 여러 서버가 같은 폴더를 실시간으로 공유해야 한다**
레거시 애플리케이션이 `/var/uploads` 같은 경로를 직접 읽고 쓴다면 S3로 바꾸려면 코드를 고쳐야 합니다. → **EFS**

**③ 서울의 S3에서 미국 사용자에게 이미지를 보내면 느리다**
그리고 **전송 비용이 비쌉니다**(GB당 $0.126). → **CloudFront**

세 서비스는 경쟁 관계가 아니라 **역할이 다릅니다.** 오늘 그 경계를 확실히 그어 둡니다.
이 판단은 [16강 중간 프로젝트](lesson-16.md)와 최종 프로젝트의 **구성 요소 결정표**에서 그대로 쓰입니다.

---

## ③ 개념 설명

### 스토리지 3분류 — 선택 기준표 ⭐

| 유형 | 서비스 | 붙는 방식 | 동시 접근 | AZ 경계 | GB당 월(대략) | 언제 |
|---|---|---|---|---|---|---|
| **블록** | EBS | 인스턴스에 **1:1** 연결 | 기본 불가 | **AZ 종속** | $0.096(gp3) | OS 디스크, DB 데이터 |
| **파일** | EFS | NFS 마운트 | **여러 대 동시** ✅ | 리전 전체 | $0.36(Standard) | 공유 폴더, 레거시 앱 |
| **객체** | S3 | HTTP API | 무제한 | 리전 전체 | **$0.025** | 정적 자산, 백업, 로그 |

> 💡 **비용만 보면 S3가 압도적으로 쌉니다**(EFS의 1/14). 그래서 **가능하면 S3**가 원칙이고,
> "코드를 못 고친다", "파일 시스템 인터페이스가 꼭 필요하다"일 때만 EFS를 씁니다.

### EBS 볼륨 타입

| 타입 | 성격 | IOPS | 언제 |
|---|---|---|---|
| **gp3** ⭐ | 범용 SSD | **3,000 기본**(독립 설정 가능) | **기본 선택** |
| gp2 | 구형 범용 SSD | 용량에 비례(3 IOPS/GB) | 레거시 |
| io2 / io2 Block Express | 고성능 SSD | 최대 256,000 | 대형 DB |
| st1 | 처리량 HDD | — | 로그·빅데이터 순차 읽기 |
| sc1 | 콜드 HDD | — | 접근이 드문 대용량 |

> 💰 **gp2 → gp3 전환은 대표적인 비용 절감 수단**입니다. **약 20% 저렴하고 성능은 더 좋습니다.**
> gp2는 용량을 키워야 IOPS가 오르지만, gp3는 **용량과 IOPS를 따로** 설정합니다.
> [31강 비용 최적화](../04-final-project/lesson-31.md)에서 다시 나옵니다.

### EBS의 AZ 종속성과 스냅샷

```
 AZ-2a                         AZ-2c
 ┌──────────┐                  ┌──────────┐
 │ EC2      │                  │ EC2      │
 │  └ EBS   │  ✗ 직접 연결 불가  │          │
 └──────────┘                  └──────────┘
       │ 스냅샷 생성                  ▲
       ▼                             │ 스냅샷에서 볼륨 생성
   ┌────────────────────────────────┘
   │  S3에 저장 (리전 전체에서 사용 가능)
   └─ 스냅샷: 증분 저장
```

| 특징 | 내용 |
|---|---|
| **증분 저장** | 첫 스냅샷은 전체, 이후는 **변경분만** |
| 리전 간 복사 | 가능 → **재해 복구**([26강](../04-final-project/lesson-26.md)) |
| 삭제 | 증분이어도 **의존 관계를 AWS가 알아서 처리** — 안심하고 지워도 됨 |
| 자동화 | **DLM(데이터 수명 주기 관리자)** 로 일정 백업 |

> 🔴 **스냅샷은 지우기 전까지 계속 과금됩니다.** AMI를 등록 취소해도 스냅샷은 남습니다([09강](lesson-09.md) 참고).

### EFS

| 항목 | 내용 |
|---|---|
| 프로토콜 | NFS v4.1 |
| 동시 접근 | **수천 개 인스턴스** |
| 용량 | 자동 확장 (사전 프로비저닝 불필요) |
| **마운트 대상(Mount Target)** | **AZ마다 하나** — 이것이 접근 경로 |
| 보안 | 마운트 대상의 **보안 그룹(NFS 2049)** 으로 제어 |
| 스토리지 클래스 | Standard / One Zone / IA (수명 주기로 자동 전환) |

```
 EFS 파일 시스템 (리전)
   ├─ 마운트 대상 (AZ-2a, 서브넷 X, 보안 그룹 Y)  ◀── EC2 (2a)
   └─ 마운트 대상 (AZ-2c, 서브넷 Z, 보안 그룹 Y)  ◀── EC2 (2c)
```

> 🔴 **EFS는 GB당 $0.36으로 S3의 약 14배**입니다. 대용량을 넣으면 비용이 빠르게 커집니다.
> 수명 주기 정책으로 **30일 미접근 파일을 IA로 전환**하면 크게 절감됩니다.

### CloudFront — CDN이 하는 일

```
 [CDN 없이]
  도쿄 사용자 ──────── 200ms ────────▶ 서울 S3
  뉴욕 사용자 ──────── 380ms ────────▶ 서울 S3
                                       모든 요청이 오리진까지

 [CloudFront]
  도쿄 사용자 ── 15ms ─▶ 도쿄 엣지 ─(캐시 미스일 때만)─▶ 서울 S3
  뉴욕 사용자 ── 20ms ─▶ 뉴욕 엣지 ─┘
```

| 이점 | 설명 |
|---|---|
| **지연 감소** | 사용자 가까운 엣지에서 응답 |
| **오리진 부하 감소** | 캐시 적중분은 오리진에 안 감 |
| **전송 비용 절감** | CloudFront 전송이 S3 직접 전송보다 저렴하고, **월 1TB 상시 무료** |
| 보안 | HTTPS 강제 · WAF 연결 · **오리진 비공개 유지** |

### OAC — S3를 비공개로 유지하는 방법 ⭐

```
 사용자 ──▶ CloudFront ──[SigV4 서명된 요청]──▶ S3 (퍼블릭 차단 유지)
                              ▲
                  버킷 정책: 이 CloudFront 배포만 허용
```

| 구분 | OAI(구식) | **OAC(현재 권장)** |
|---|---|---|
| 지원 리전 | 일부 제한 | **모든 리전** |
| 지원 기능 | GET 위주 | **모든 HTTP 메서드 · SSE-KMS 지원** |
| 상태 | 레거시 | **신규는 OAC** |

**버킷 정책은 이렇게 생깁니다.**

```json
{
  "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/*",
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/E1ABCDEFGH"
    }
  }
}
```

> ⭐ **`Principal` 이 `*` 가 아니라 CloudFront 서비스**이고, **조건으로 내 배포만** 한정합니다. 버킷은 여전히 비공개입니다.

### 캐시 관리 — 무효화 vs 버전 파일명

| 방법 | 동작 | 비용 | 반영 속도 |
|---|---|---|---|
| **무효화(Invalidation)** | 엣지 캐시를 강제 만료 | **월 1,000경로 무료**, 초과 시 경로당 $0.005 | 몇 분 |
| **버전 파일명** ⭐ | `app.a1b2c3.js` 처럼 이름을 바꿔 배포 | **무료** | 즉시 |

> ⭐ **실무 표준은 버전 파일명입니다.** 새 URL이므로 캐시가 있을 수 없고, 롤백도 옛 파일명으로 되돌리면 끝입니다.
> 무효화는 `index.html` 처럼 이름을 바꿀 수 없는 소수 파일에만 씁니다.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.1 ~ 0.2** — 대부분 프리 티어. NAT는 이번 강에 필요 없습니다(퍼블릭 서브넷 사용).
> ⚠️ CloudFront 배포 생성·삭제에 각각 **5~15분**이 걸립니다. 시간 배분에 주의하세요.

### Step 1. EBS 볼륨 추가와 마운트 (20분)

**환경 준비 — 퍼블릭 서브넷에 인스턴스 2대**

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh
$ MY_IP=$(curl -s https://checkip.amazonaws.com)
$ SG_TEST=$(aws ec2 create-security-group --group-name course-sg-w07 \
    --description "week07" --vpc-id $VPC_ID --query 'GroupId' --output text)
$ aws ec2 authorize-security-group-ingress --group-id $SG_TEST \
    --protocol tcp --port 80 --cidr ${MY_IP}/32
# EFS용 NFS 포트 (같은 SG 내부 통신 허용)
$ aws ec2 authorize-security-group-ingress --group-id $SG_TEST \
    --protocol tcp --port 2049 --source-group $SG_TEST

$ AMI_ID=$(aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' --output text)

$ INST_A=$(aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro \
    --subnet-id $PUB_A --security-group-ids $SG_TEST \
    --iam-instance-profile Name=EC2-Course-Role --associate-public-ip-address \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-a},{Key=Project,Value=aws-course}]' \
    --query 'Instances[0].InstanceId' --output text)

$ INST_C=$(aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro \
    --subnet-id $PUB_C --security-group-ids $SG_TEST \
    --iam-instance-profile Name=EC2-Course-Role --associate-public-ip-address \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-c},{Key=Project,Value=aws-course}]' \
    --query 'Instances[0].InstanceId' --output text)

$ aws ec2 wait instance-running --instance-ids $INST_A $INST_C
```

**볼륨 생성과 연결**

```bash
$ VOL_ID=$(aws ec2 create-volume \
    --availability-zone ap-northeast-2a \
    --size 10 --volume-type gp3 \
    --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=course-data},{Key=Project,Value=aws-course}]' \
    --query 'VolumeId' --output text)
$ aws ec2 wait volume-available --volume-ids $VOL_ID

$ aws ec2 attach-volume --volume-id $VOL_ID --instance-id $INST_A --device /dev/sdf
```

**인스턴스에서 마운트**

```bash
$ aws ssm start-session --target $INST_A

sh-5.2$ lsblk
NAME          MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
nvme0n1       259:0    0   8G  0 disk
├─nvme0n1p1   259:1    0   8G  0 part /
└─nvme0n1p128 259:2    0   1M  0 part
nvme1n1       259:3    0  10G  0 disk            ← 방금 붙인 볼륨
```

> 📌 **Nitro 기반 인스턴스에서는 `/dev/sdf` 로 지정해도 실제 이름은 `/dev/nvme1n1`** 입니다. 정상입니다.

```bash
sh-5.2$ sudo file -s /dev/nvme1n1
/dev/nvme1n1: data                    ← 파일 시스템이 없다는 뜻

sh-5.2$ sudo mkfs -t xfs /dev/nvme1n1
meta-data=/dev/nvme1n1     isize=512    agcount=4, agsize=655360 blks
...
sh-5.2$ sudo mkdir -p /data
sh-5.2$ sudo mount /dev/nvme1n1 /data
sh-5.2$ df -h /data
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme1n1    10G   104M  9.9G   2% /data

sh-5.2$ echo "EBS에 저장된 중요 데이터 $(date)" | sudo tee /data/important.txt
EBS에 저장된 중요 데이터 Thu Aug 13 19:02:11 UTC 2026
```

> ⚠️ **`mkfs` 는 디스크를 포맷합니다.** 기존 볼륨에 실행하면 **데이터가 전부 사라집니다.** `file -s` 로 `data` 라고 나올 때(=빈 디스크)만 실행하세요.

**부팅 시 자동 마운트 등록**

```bash
sh-5.2$ UUID=$(sudo blkid -s UUID -o value /dev/nvme1n1)
sh-5.2$ echo "UUID=$UUID  /data  xfs  defaults,nofail  0  2" | sudo tee -a /etc/fstab
sh-5.2$ sudo mount -a && echo "fstab 정상"
fstab 정상
```

> 🔴 **`nofail` 옵션이 중요합니다.** 이것이 없으면 볼륨이 없을 때 **인스턴스가 부팅되지 않습니다.**
> `mount -a` 로 검증하지 않고 재부팅했다가 접속 불가가 되는 사고가 흔합니다.

### Step 2. 스냅샷으로 AZ 경계 넘기 ⭐ (20분)

```bash
sh-5.2$ sync && exit

$ SNAP_ID=$(aws ec2 create-snapshot --volume-id $VOL_ID \
    --description "course lesson14 snapshot" \
    --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Project,Value=aws-course}]' \
    --query 'SnapshotId' --output text)
$ aws ec2 wait snapshot-completed --snapshot-ids $SNAP_ID
```

**다른 AZ에 볼륨 복원**

```bash
$ VOL_C=$(aws ec2 create-volume \
    --availability-zone ap-northeast-2c \
    --snapshot-id $SNAP_ID --volume-type gp3 \
    --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=course-data-restored}]' \
    --query 'VolumeId' --output text)
$ aws ec2 wait volume-available --volume-ids $VOL_C

$ aws ec2 attach-volume --volume-id $VOL_C --instance-id $INST_C --device /dev/sdf
```

**데이터가 그대로인지 확인**

```bash
$ aws ssm start-session --target $INST_C
sh-5.2$ sudo mkdir -p /data && sudo mount -o nouuid /dev/nvme1n1 /data
sh-5.2$ cat /data/important.txt
EBS에 저장된 중요 데이터 Thu Aug 13 19:02:11 UTC 2026
```

> ✅ **AZ-2a의 데이터를 AZ-2c에서 읽었습니다.** EBS는 AZ 종속이지만 **스냅샷은 리전 전체**에서 쓸 수 있습니다.
> 이것이 재해 복구의 기본 원리입니다.
> 📌 `-o nouuid` 는 XFS에서 **같은 UUID의 파일 시스템이 복제됐을 때** 필요한 옵션입니다.

### Step 3. EFS — 여러 인스턴스가 같은 폴더 (25분)

```bash
$ EFS_ID=$(aws efs create-file-system \
    --performance-mode generalPurpose \
    --throughput-mode elastic \
    --encrypted \
    --tags Key=Name,Value=course-efs Key=Project,Value=aws-course \
    --query 'FileSystemId' --output text)
$ echo $EFS_ID
fs-0a1b2c3d4e5f60718

# 마운트 대상: AZ마다 하나
$ aws efs create-mount-target --file-system-id $EFS_ID \
    --subnet-id $PUB_A --security-groups $SG_TEST
$ aws efs create-mount-target --file-system-id $EFS_ID \
    --subnet-id $PUB_C --security-groups $SG_TEST

# available 이 될 때까지 1~2분
$ aws efs describe-mount-targets --file-system-id $EFS_ID \
    --query 'MountTargets[*].[MountTargetId,AvailabilityZoneName,LifeCycleState]' --output table
------------------------------------------------------------------
|  fsmt-0abc123  |  ap-northeast-2a  |  available                 |
|  fsmt-0def456  |  ap-northeast-2c  |  available                 |
------------------------------------------------------------------
```

**인스턴스 A에서 마운트**

```bash
$ aws ssm start-session --target $INST_A
sh-5.2$ sudo dnf install -y amazon-efs-utils
sh-5.2$ sudo mkdir -p /shared
sh-5.2$ sudo mount -t efs -o tls fs-0a1b2c3d4e5f60718:/ /shared
sh-5.2$ df -hT /shared
Filesystem     Type  Size  Used Avail Use% Mounted on
127.0.0.1:/    nfs4  8.0E     0  8.0E   0% /shared

sh-5.2$ echo "인스턴스 A가 씀 - $(date +%T)" | sudo tee /shared/message.txt
인스턴스 A가 씀 - 19:20:33
sh-5.2$ exit
```

> 📌 **`Size 8.0E`** — EFS는 용량 제한이 없어 8엑사바이트로 표시됩니다. 실제로 쓴 만큼만 과금됩니다.
> 📌 `-o tls` 는 **전송 중 암호화**입니다. 항상 켜는 것이 좋습니다.

**인스턴스 C에서 같은 파일 읽기**

```bash
$ aws ssm start-session --target $INST_C
sh-5.2$ sudo dnf install -y amazon-efs-utils
sh-5.2$ sudo mkdir -p /shared
sh-5.2$ sudo mount -t efs -o tls fs-0a1b2c3d4e5f60718:/ /shared

sh-5.2$ cat /shared/message.txt
인스턴스 A가 씀 - 19:20:33          ← 즉시 보인다!

sh-5.2$ echo "인스턴스 C가 답장 - $(date +%T)" | sudo tee -a /shared/message.txt
```

> ✅ **다른 AZ의 두 인스턴스가 같은 파일을 실시간으로 공유**합니다. EBS로는 불가능한 일입니다.

**수명 주기 정책으로 비용 절감**

```bash
$ aws efs put-lifecycle-configuration --file-system-id $EFS_ID \
    --lifecycle-policies \
      '[{"TransitionToIA":"AFTER_30_DAYS"},{"TransitionToPrimaryStorageClass":"AFTER_1_ACCESS"}]'
```

> 💡 30일간 접근이 없으면 IA로 내려 **GB당 $0.36 → $0.027** 로 떨어지고, 다시 읽으면 자동으로 올라옵니다.

### Step 4. CloudFront + OAC로 S3 안전하게 공개 ⭐ (30분)

**① 비공개 버킷 준비**

```bash
$ CDN_BUCKET=course-cdn-hong-$(date +%Y%m%d)
$ aws s3api create-bucket --bucket $CDN_BUCKET --region ap-northeast-2 \
    --create-bucket-configuration LocationConstraint=ap-northeast-2

$ cat > index.html <<'EOF'
<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>CDN Test</title></head>
<body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;display:grid;place-items:center;height:100vh">
<div><h1 style="color:#ff9900">CloudFront + OAC</h1>
<p>이 파일은 비공개 S3 버킷에 있습니다.</p>
<p id="v">v1</p></div></body></html>
EOF

$ aws s3 cp index.html s3://$CDN_BUCKET/
$ aws s3 cp index.html s3://$CDN_BUCKET/assets/app.v1.html
```

**② OAC 생성**

```bash
$ OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
      'Name=course-oac,Description=course,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3' \
    --query 'OriginAccessControl.Id' --output text)
$ echo $OAC_ID
E2ABCDEFGHIJKL
```

**③ 배포 생성**

```bash
$ cat > dist-config.json <<EOF
{
  "CallerReference": "course-$(date +%s)",
  "Comment": "AWS course CDN",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "s3-origin",
      "DomainName": "$CDN_BUCKET.s3.ap-northeast-2.amazonaws.com",
      "OriginAccessControlId": "$OAC_ID",
      "S3OriginConfig": { "OriginAccessIdentity": "" }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2, "Items": ["GET","HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] }
    },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "PriceClass": "PriceClass_200"
}
EOF

$ DIST_ID=$(aws cloudfront create-distribution --distribution-config file://dist-config.json \
    --query 'Distribution.Id' --output text)
$ echo $DIST_ID
E1ABCDEFGHIJKL
```

**설정 해설**

| 항목 | 값 | 의미 |
|---|---|---|
| `ViewerProtocolPolicy` | `redirect-to-https` | HTTP를 HTTPS로 강제 |
| `CachePolicyId` | `658327ea-...` | AWS 관리형 **CachingOptimized** 정책 |
| `Compress` | `true` | gzip/brotli 자동 압축 → 전송비 절감 |
| `PriceClass_200` | 북미·유럽·아시아 | **전 세계(All)보다 저렴** |

**④ 버킷 정책으로 이 배포만 허용**

```bash
$ ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
$ cat > oac-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipal",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$CDN_BUCKET/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT:distribution/$DIST_ID"
      }
    }
  }]
}
EOF

$ aws s3api put-bucket-policy --bucket $CDN_BUCKET --policy file://oac-policy.json
```

**⑤ 배포 완료 대기** (5~15분)

```bash
$ aws cloudfront wait distribution-deployed --id $DIST_ID
$ CDN_DOMAIN=$(aws cloudfront get-distribution --id $DIST_ID \
    --query 'Distribution.DomainName' --output text)
$ echo $CDN_DOMAIN
d1a2b3c4d5e6f7.cloudfront.net
```

### Step 5. 🔍 CDN 동작과 비공개 유지 증명 (15분)

**① CDN으로는 접근된다**

```bash
$ curl -sI https://$CDN_DOMAIN/ | head -5
HTTP/2 200
content-type: text/html
x-cache: Miss from cloudfront
x-amz-cf-pop: ICN57-P2
x-amz-cf-id: aBcDeF...
```

**② 한 번 더 요청하면 캐시 적중**

```bash
$ curl -sI https://$CDN_DOMAIN/ | grep -i x-cache
x-cache: Hit from cloudfront
```

> ✅ **`Miss` → `Hit`.** 두 번째 요청은 **S3까지 가지 않았습니다.** 오리진 부하와 전송 비용이 절감됩니다.

**③ S3 직접 접근은 여전히 막힌다**

```bash
$ curl -s https://$CDN_BUCKET.s3.ap-northeast-2.amazonaws.com/index.html | head -4
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
```

> ✅ **버킷은 비공개인데 CDN으로는 서비스됩니다.** [13강](lesson-13.md)에서 예고한 정답 구성입니다.

**④ HTTP → HTTPS 리다이렉트**

```bash
$ curl -sI http://$CDN_DOMAIN/ | head -3
HTTP/1.1 301 Moved Permanently
Location: https://d1a2b3c4d5e6f7.cloudfront.net/
```

**⑤ 응답 시간 비교**

```bash
$ for i in 1 2 3; do
    curl -s -o /dev/null -w "CDN:  %{time_total}s\n" https://$CDN_DOMAIN/
  done
CDN:  0.213000s
CDN:  0.031000s        ← 캐시 적중 후 급감
CDN:  0.028000s
```

### Step 6. 캐시 무효화와 버전 파일명 비교 (15분)

**① 파일을 수정하고 그대로 두면?**

```bash
$ sed -i 's|<p id="v">v1</p>|<p id="v">v2 수정됨</p>|' index.html
$ aws s3 cp index.html s3://$CDN_BUCKET/

$ curl -s https://$CDN_DOMAIN/ | grep 'id="v"'
<p id="v">v1</p>          ← 옛날 내용! 캐시 때문
```

**② 무효화 실행**

```bash
$ INVAL_ID=$(aws cloudfront create-invalidation --distribution-id $DIST_ID \
    --paths "/index.html" --query 'Invalidation.Id' --output text)
$ aws cloudfront wait invalidation-completed --distribution-id $DIST_ID --id $INVAL_ID

$ curl -s https://$CDN_DOMAIN/ | grep 'id="v"'
<p id="v">v2 수정됨</p>    ← 반영됨
```

**③ 버전 파일명 방식**

```bash
$ aws s3 cp index.html s3://$CDN_BUCKET/assets/app.v2.html

$ curl -s https://$CDN_DOMAIN/assets/app.v2.html | grep 'id="v"'
<p id="v">v2 수정됨</p>    ← 무효화 없이 즉시 최신
```

**비교 정리**

| 방법 | 비용 | 속도 | 롤백 |
|---|---|---|---|
| 무효화 | 월 1,000경로 무료 / 초과 시 경로당 $0.005 | 몇 분 | 다시 무효화 |
| **버전 파일명** | **무료** | **즉시** | **옛 파일명으로 되돌리면 끝** |

> ⭐ **실무 원칙** — JS·CSS·이미지는 **빌드 시 해시를 붙여** 배포하고(`app.a1b2c3.js`), 캐시 TTL을 1년으로 길게 둡니다.
> 이름을 바꿀 수 없는 `index.html` 만 짧은 TTL + 필요 시 무효화로 관리합니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| EC2 t3.micro × 2 | ✅ 750h 합산 | $0 | 약 $19 |
| **EBS gp3 추가 10GB × 2** | ✅ 30GB(12개월) | $0 (초과 시 약 $0.03) | 약 $1.9 |
| EBS 스냅샷 | ✅ 1GB | 약 $0.01 | 10GB면 약 $0.5 |
| **EFS Standard** | ✅ 5GB(12개월) | $0 | **GB당 $0.36** 🔴 |
| **CloudFront** | ✅ **월 1TB 전송·1000만 요청(상시)** | **$0** | 초과분만 |
| CloudFront 무효화 | ✅ 월 1,000경로 | $0 | 경로당 $0.005 |
| S3 | ✅ 5GB | $0 | — |
| **합계** | | **약 $0.05** | 약 $25 |

> 💡 **CloudFront는 이 과정에서 가장 관대한 프리 티어**를 가집니다. 월 1TB 전송이 **상시 무료**입니다.
> 🔴 **EFS가 가장 비쌉니다.** 100GB를 넣으면 월 $36입니다. 실습 후 반드시 삭제하세요.

### 🧹 리소스 정리 체크리스트

```bash
# 1) CloudFront 배포 — 비활성화 후 삭제 (각 5~15분!)
$ aws cloudfront get-distribution-config --id $DIST_ID > dist.json
$ ETAG=$(jq -r '.ETag' dist.json)
$ jq '.DistributionConfig | .Enabled = false' dist.json > dist-disabled.json
$ aws cloudfront update-distribution --id $DIST_ID \
    --distribution-config file://dist-disabled.json --if-match $ETAG
$ aws cloudfront wait distribution-deployed --id $DIST_ID

$ ETAG2=$(aws cloudfront get-distribution-config --id $DIST_ID --query 'ETag' --output text)
$ aws cloudfront delete-distribution --id $DIST_ID --if-match $ETAG2

# 2) OAC 삭제
$ OAC_ETAG=$(aws cloudfront get-origin-access-control --id $OAC_ID --query 'ETag' --output text)
$ aws cloudfront delete-origin-access-control --id $OAC_ID --if-match $OAC_ETAG

# 3) EFS — 마운트 대상 먼저, 그다음 파일 시스템
$ for MT in $(aws efs describe-mount-targets --file-system-id $EFS_ID \
      --query 'MountTargets[*].MountTargetId' --output text); do
    aws efs delete-mount-target --mount-target-id $MT
  done
$ sleep 60
$ aws efs delete-file-system --file-system-id $EFS_ID

# 4) EC2 · 볼륨 · 스냅샷
$ aws ec2 terminate-instances --instance-ids $INST_A $INST_C
$ aws ec2 wait instance-terminated --instance-ids $INST_A $INST_C
$ aws ec2 delete-volume --volume-id $VOL_ID
$ aws ec2 delete-volume --volume-id $VOL_C
$ aws ec2 delete-snapshot --snapshot-id $SNAP_ID

# 5) S3
$ aws s3 rb s3://$CDN_BUCKET --force
```

**최종 확인**

```bash
$ aws cloudfront list-distributions --query 'DistributionList.Items[*].Id' --output text
$ aws efs describe-file-systems --query 'FileSystems[*].FileSystemId' --output text
$ aws ec2 describe-volumes --filters "Name=status,Values=available" --query 'Volumes[*].VolumeId' --output text
$ aws ec2 describe-snapshots --owner-ids self --query 'Snapshots[*].SnapshotId' --output text
```

- [ ] CloudFront 배포 **비활성화 → 삭제** (시간이 오래 걸리니 정리를 일찍 시작)
- [ ] OAC 삭제
- [ ] 🔴 **EFS 삭제** (마운트 대상 먼저)
- [ ] EC2 종료 · **추가 볼륨 2개 삭제** · 스냅샷 삭제
- [ ] S3 버킷 삭제
- [ ] 4개 확인 명령 모두 빈 출력

---

## ⑤ 자주 하는 실수

### 볼륨을 붙였는데 안 보인다

```bash
sh-5.2$ ls /dev/sdf
ls: cannot access '/dev/sdf': No such file or directory
```

**원인** — **Nitro 기반 인스턴스**(t3, m5 이후)는 EBS를 **NVMe 장치**로 노출합니다. 지정한 이름과 실제 이름이 다릅니다.
**해결**

```bash
sh-5.2$ lsblk
sh-5.2$ sudo nvme list           # NVMe 장치와 원래 이름 매핑 확인
```

> 📌 그래서 `/etc/fstab` 에는 장치 이름 대신 **UUID**를 씁니다. 장치 이름은 재부팅 시 바뀔 수 있습니다.

### 재부팅 후 인스턴스에 접속이 안 된다

**원인** — `/etc/fstab` 에 등록한 볼륨이 없거나 마운트에 실패해 **부팅이 멈췄습니다.**
**해결·예방**

```bash
# 반드시 이 옵션을 넣는다
UUID=xxx  /data  xfs  defaults,nofail  0  2
                             ^^^^^^

# 재부팅 전에 검증
sh-5.2$ sudo mount -a && echo OK
```

**이미 접속 불가라면** — 볼륨을 분리해 다른 인스턴스에 붙여 `/etc/fstab` 을 수정한 뒤 되돌립니다. (또는 EC2 직렬 콘솔 사용)

### 복원한 볼륨을 마운트할 수 없다

```
mount: /data: wrong fs type, bad option, bad superblock on /dev/nvme1n1,
       missing codepage or helper program, or other error.
```

또는

```
mount: /data: mount(2) system call failed: Structure needs cleaning.
```

**원인** — XFS는 **파일 시스템 UUID가 중복**되면 마운트를 거부합니다. 스냅샷 복원 볼륨은 원본과 UUID가 같습니다.
**해결**

```bash
sh-5.2$ sudo mount -o nouuid /dev/nvme1n1 /data
# 또는 UUID를 새로 생성
sh-5.2$ sudo xfs_admin -U generate /dev/nvme1n1
```

### EFS 마운트가 멈춘다(타임아웃)

```
mount.nfs4: Connection timed out
```

**원인 4가지를 순서대로 확인**

| # | 확인 | 방법 |
|---|---|---|
| 1 | **마운트 대상 보안 그룹이 NFS 2049를 허용하나** | 대부분 이 문제 |
| 2 | 마운트 대상이 그 AZ에 있나 | `describe-mount-targets` |
| 3 | 마운트 대상이 `available` 인가 | 생성 직후 1~2분 대기 |
| 4 | `amazon-efs-utils` 가 설치됐나 | `dnf install -y amazon-efs-utils` |

```bash
$ aws ec2 authorize-security-group-ingress --group-id $SG_TEST \
    --protocol tcp --port 2049 --source-group $SG_TEST
```

> 💡 **인스턴스와 마운트 대상이 같은 AZ**에 있어야 성능도 좋고 AZ 간 전송료도 없습니다.

### CloudFront에서 403이 뜬다

```xml
<Error><Code>AccessDenied</Code></Error>
```

**원인 후보**

| 원인 | 확인 |
|---|---|
| 버킷 정책에 **OAC 허용이 없다** | `get-bucket-policy` |
| 정책의 **`AWS:SourceArn` 배포 ID가 다르다** | 배포 ID 대조 |
| 오리진 도메인을 **웹사이트 엔드포인트**로 지정했다 | `s3.ap-northeast-2.amazonaws.com` 이어야 함 |
| 배포가 아직 **배포 중** | `Status: Deployed` 확인 |
| 객체가 없다 | `aws s3 ls` |

> ⚠️ **오리진 도메인 함정** — S3 REST 엔드포인트(`bucket.s3.리전.amazonaws.com`)와 **정적 웹사이트 엔드포인트**(`bucket.s3-website.리전.amazonaws.com`)는 다릅니다.
> **OAC는 REST 엔드포인트에서만 동작**합니다.

### 파일을 바꿨는데 CDN에 옛 내용이 나온다

**원인** — **캐시 TTL이 남아 있습니다.** 정상 동작입니다.
**해결 2가지**

```bash
# 방법 1: 무효화 (월 1,000경로 무료)
$ aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/index.html"

# 방법 2: 버전 파일명 (권장, 무료)
$ aws s3 cp app.js s3://$BUCKET/assets/app.$(md5sum app.js | cut -c1-8).js
```

> 🔴 **`--paths "/*"` 로 전체 무효화하는 습관은 위험합니다.** 경로 하나로 계산되지만 캐시가 전부 날아가 오리진 부하가 폭증합니다.

### CloudFront 삭제가 안 된다

```
An error occurred (DistributionNotDisabled) when calling the DeleteDistribution operation:
The distribution you are trying to delete has not been disabled.
```

**원인** — CloudFront는 **비활성화 → 전파 완료 → 삭제** 순서를 요구합니다.
**해결** — 정리 체크리스트의 절차를 따릅니다. **각 단계마다 5~15분**이 걸리므로 **수업 종료 30분 전에는 정리를 시작**하세요.

> 💡 배포가 비활성 상태면 요청을 처리하지 않으므로 **전송 비용은 발생하지 않습니다.** 급하면 비활성화까지만 해 두고 나중에 삭제해도 됩니다.

### EFS를 삭제할 수 없다

```
An error occurred (FileSystemInUse) when calling the DeleteFileSystem operation
```

**원인** — **마운트 대상이 남아 있습니다.**
**해결** — 마운트 대상을 모두 삭제하고 1분쯤 기다린 뒤 파일 시스템을 지웁니다. (정리 체크리스트 3번)

---

## ⑥ 확인 문제

**1.** 여러 EC2가 같은 파일을 동시에 읽고 써야 합니다. EBS로는 왜 안 되고, 어떤 선택지가 있나요?

<details>
<summary>답 보기</summary>

**EBS가 안 되는 이유 두 가지**

1. **AZ 종속** — EBS 볼륨은 특정 AZ에만 존재하며, 다른 AZ의 인스턴스에 붙일 수 없습니다.
2. **기본적으로 1:1 연결** — 하나의 볼륨은 한 인스턴스에만 붙습니다.

> 📌 예외로 **Multi-Attach**(io1/io2, 같은 AZ 내 최대 16대)가 있지만, **클러스터 파일 시스템 없이 동시에 쓰면 데이터가 깨집니다.** 일반 용도로는 쓰지 않습니다.

**선택지 3가지**

| 방법 | 적합 | 비용(GB/월) |
|---|---|---|
| **EFS** | 파일 시스템 인터페이스가 꼭 필요한 레거시 앱 | $0.36 |
| **S3** ⭐ | 코드를 고칠 수 있다면 **거의 항상 정답** | **$0.025** |
| FSx | Windows 공유(SMB)나 고성능 컴퓨팅 | 용도별 |

**판단 기준**

```
 코드를 고칠 수 있나?
   ├─ 예  → S3 (14배 저렴, 무제한 확장, 서버와 완전 분리)
   └─ 아니오 → EFS (POSIX 파일 시스템 그대로)
```

> **실무 조언** — 신규 개발이면 **처음부터 S3**로 설계합니다. EFS는 "지금 당장 옮겨야 하는데 코드를 못 고칠 때"의 선택지입니다.
</details>

**2.** CloudFront를 붙였는데 S3 직접 URL로도 여전히 파일이 열립니다. 무엇이 잘못됐고 어떻게 고치나요?

<details>
<summary>답 보기</summary>

**버킷이 퍼블릭 상태입니다.** CloudFront를 앞에 세워도 **S3가 열려 있으면 우회 접근이 가능**합니다.

**문제점**
- CDN을 우회하므로 **전송 비용 절감 효과가 사라짐**
- WAF·서명 URL 같은 **CloudFront의 보안 통제를 우회**
- 접근 로그가 CloudFront에 남지 않음

**해결 절차**

```bash
# ① 퍼블릭 액세스 차단 4개 모두 켜기
$ aws s3api put-public-access-block --bucket $BUCKET \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# ② 퍼블릭 버킷 정책 제거
$ aws s3api delete-bucket-policy --bucket $BUCKET

# ③ OAC 허용 정책만 다시 부여
$ aws s3api put-bucket-policy --bucket $BUCKET --policy file://oac-policy.json
```

**검증**

```bash
$ curl -sI https://$BUCKET.s3.ap-northeast-2.amazonaws.com/index.html | head -1
HTTP/1.1 403 Forbidden        ← 이래야 정상

$ curl -sI https://$CDN_DOMAIN/index.html | head -1
HTTP/2 200                    ← CDN으로는 정상
```

> **원칙 한 줄** — **"오리진은 CDN에게만 열려 있어야 한다."**
</details>

**3.** JS·CSS 파일을 배포할 때마다 CloudFront 무효화를 실행하고 있습니다. 더 나은 방법과 그 이유는?

<details>
<summary>답 보기</summary>

**버전이 포함된 파일명(콘텐츠 해시)으로 배포합니다.**

```
 ❌ app.js         → 배포할 때마다 무효화 필요
 ✅ app.a1b2c3d4.js → 새 파일이므로 캐시가 있을 수 없음
```

**이유 4가지**

| 항목 | 무효화 | 버전 파일명 |
|---|---|---|
| **비용** | 월 1,000경로 초과 시 경로당 $0.005 | **무료** |
| **속도** | 전파에 몇 분 | **즉시** |
| **롤백** | 다시 배포 + 무효화 | **옛 파일명을 다시 참조**하면 끝 |
| **캐시 효율** | TTL을 짧게 둘 수밖에 없음 | **TTL 1년**으로 극대화 가능 |

**실무 구성**

| 파일 | 캐시 정책 | 관리 |
|---|---|---|
| `app.<hash>.js`, `style.<hash>.css`, 이미지 | `max-age=31536000, immutable` (1년) | 버전 파일명 |
| `index.html` | `max-age=0, must-revalidate` (또는 짧게) | 필요 시 무효화 |

`index.html` 이 새 해시 파일을 참조하므로, **HTML만 갱신되면 나머지는 자동으로 새 파일을 받습니다.**

> 💡 웹팩·Vite 같은 번들러는 이 해시 파일명을 **기본으로 생성**합니다. 별도 작업이 거의 필요 없습니다.
> 🔴 **`--paths "/*"` 전체 무효화는 피하세요.** 캐시가 전부 사라져 오리진에 순간 부하가 몰립니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 스토리지 3분류 | 블록(EBS·1:1·AZ 종속) / 파일(EFS·동시 마운트) / 객체(S3·가장 저렴) |
| EBS 타입 | **gp3가 기본**. gp2 → gp3 전환은 대표 절감 수단 |
| 스냅샷 | **증분 저장**, 리전 전체 사용 가능 → **AZ·리전 경계 극복** |
| fstab | **`nofail` 필수**, UUID로 지정, `mount -a` 로 검증 |
| EFS | 마운트 대상은 **AZ마다**, 보안 그룹 **2049**, GB당 $0.36(비쌈) |
| CloudFront | 지연·오리진 부하·**전송비 절감**. 월 1TB 상시 무료 |
| **OAC** | S3를 **비공개로 유지**한 채 CDN 서비스. REST 엔드포인트에만 동작 |
| 캐시 갱신 | **버전 파일명(무료·즉시)** > 무효화 |
| 삭제 | CloudFront는 **비활성화 → 삭제**, 각 5~15분 |

**한 장 요약**

```
  OS 디스크 · DB 데이터   → EBS  (AZ 종속, 스냅샷으로 이동)
  여러 서버가 같은 폴더    → EFS  (비싸다. 가능하면 S3로)
  정적 자산 · 백업 · 로그  → S3   (가장 저렴)
                            └─ 공개는 CloudFront + OAC로
```

**오늘 반드시 기억할 한 가지**
> **S3는 CloudFront 뒤에 숨기고, 캐시는 파일 이름으로 관리합니다.**

**과제**
1. **스토리지 선택 리포트** — 다음 5가지에 EBS/EFS/S3 중 무엇을 택할지와 근거
   ① DB 데이터 파일 ② 사용자 업로드 이미지 ③ 여러 서버가 공유하는 리포트 폴더 ④ 7년 보관 감사 로그 ⑤ 배포용 JS/CSS
2. **스냅샷 AZ 이동 실험** — AZ-2a에서 쓴 파일을 AZ-2c에서 읽은 전체 로그.
3. **EFS 동시 접근 증명** — 인스턴스 A에서 쓰고 인스턴스 C에서 읽은 출력(시각 포함).
4. **OAC 증명 2종** — ① CDN URL 200 ② S3 직접 URL 403.
5. **캐시 효과 측정** — `X-Cache: Miss` / `Hit` 헤더와 응답 시간 3회 비교표.
6. **무효화 vs 버전 파일명** 비교표를 작성하고, 내 서비스에 무엇을 쓸지 근거 5줄.
7. 정리 확인 — CloudFront·EFS·미연결 볼륨·스냅샷 4개 명령 빈 출력.

---

[← 이전 13강](lesson-13.md) · [목차](README.md) · [다음 → 15강 RDS와 Aurora](lesson-15.md)
