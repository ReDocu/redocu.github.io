# 15강 · RDS와 Aurora

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **15강 / 총 32강**
> [← 이전 14강](lesson-14.md) · [목차](README.md) · [다음 → 16강 🏁 중간 프로젝트](lesson-16.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 관리형 데이터베이스가 **무엇을 대신해 주고 무엇을 못 하는지** 설명할 수 있다.
- DB 서브넷 그룹을 만들어 RDS를 **프라이빗 서브넷에 배치**할 수 있다.
- **Multi-AZ와 읽기 전용 복제본의 목적 차이**를 설명하고 장애 조치를 실행할 수 있다.
- 자동 백업·스냅샷·**특정 시점 복구(PITR)** 를 구분해 사용할 수 있다.
- DB 자격 증명을 **Secrets Manager**로 관리해 코드에서 분리할 수 있다.

---

## ② 왜 필요한가

지금까지 만든 서비스에는 데이터가 없습니다. [09강](lesson-09.md)의 웹 서버는 인스턴스 정보만 보여 줄 뿐이고, 사용자가 무언가를 저장하면 [10강](lesson-10.md)의 스케일 인과 함께 사라집니다.

그럼 EC2에 MySQL을 직접 설치하면 될까요? 그렇게 하면 이 일들이 전부 **내 일**이 됩니다.

| 해야 할 일 | 직접 설치 | RDS |
|---|---|---|
| 설치·초기 설정 | 🙋 나 | 🅰️ AWS |
| OS·DB 엔진 보안 패치 | 🙋 나 (매달) | 🅰️ AWS |
| 자동 백업 | 🙋 크론 스크립트 작성 | 🅰️ 설정 한 번 |
| 특정 시점 복구 | 🙋 바이너리 로그 직접 관리 | 🅰️ 클릭 몇 번 |
| **장애 시 자동 전환** | 🙋 직접 구성(매우 어려움) | 🅰️ **Multi-AZ** |
| 읽기 부하 분산 | 🙋 복제 직접 구성 | 🅰️ 복제본 생성 |
| 모니터링 | 🙋 직접 | 🅰️ CloudWatch 기본 제공 |

특히 **장애 조치**는 직접 만들기가 매우 어렵습니다. "주 DB가 죽었는지 어떻게 판단하고, 언제 대기 DB를 승격하고, 애플리케이션은 어떻게 새 주소를 알게 하는가" — 이 문제를 제대로 푸는 데 몇 달이 걸립니다.

RDS는 **체크박스 하나**로 해결합니다. 오늘 그것이 정말 동작하는지 **직접 장애를 일으켜** 확인합니다.

---

## ③ 개념 설명

### 관리형 DB가 대신해 주지 않는 것

| 대신해 준다 | 대신해 주지 않는다 |
|---|---|
| 설치·패치·백업·장애 조치 | **스키마 설계** |
| 하드웨어·복제 관리 | **쿼리 튜닝·인덱스** |
| 모니터링 지표 제공 | 어떤 지표가 위험한지 판단 |
| — | 🔴 **OS 접근** (SSH 불가) |
| — | 🔴 `SUPER` 권한이 필요한 일부 작업 |

> 📌 **OS에 접근할 수 없다는 것**이 가장 큰 제약입니다. 파일을 직접 복사하거나 커스텀 플러그인을 설치할 수 없습니다.
> 그런 요구가 있으면 EC2에 직접 설치해야 하는데, 그러면 위 표의 모든 일이 내 일이 됩니다.

### RDS 네트워크 구조

```
 VPC
 ┌────────────────────────────────────────────────┐
 │ 앱 서브넷 10.0.11.0/24 (2a)   10.0.12.0/24 (2c) │
 │   [EC2]                         [EC2]           │
 │      │ 3306                        │            │
 │ ─────┼────────────────────────────┼──────────── │
 │ DB 서브넷 10.0.21.0/24 (2a)   10.0.22.0/24 (2c) │
 │   [RDS 주]  ◀── 동기 복제 ──▶  [RDS 대기]        │
 └────────────────────────────────────────────────┘
              ▲
   DB 서브넷 그룹: 위 2개 서브넷의 묶음
```

| 요소 | 역할 |
|---|---|
| **DB 서브넷 그룹** | RDS가 배치될 서브넷 묶음. **최소 2개 AZ 필요** |
| DB 보안 그룹 | 소스를 **앱 보안 그룹**으로 지정 (IP 아님) |
| 퍼블릭 액세스 | 🔴 **반드시 "아니요"** |
| 엔드포인트 | `xxx.abc123.ap-northeast-2.rds.amazonaws.com` — **DNS 이름을 쓴다** |

> 🔴 **DB 서브넷 그룹은 2개 이상의 AZ를 요구합니다.** Multi-AZ를 안 쓰더라도 그렇습니다. 나중에 켤 수 있게 하기 위해서입니다.

### Multi-AZ vs 읽기 전용 복제본 ⭐

**시험과 실무에서 가장 많이 혼동되는 지점입니다.**

| | **Multi-AZ** | **읽기 전용 복제본** |
|---|---|---|
| 목적 | **가용성** (장애 대비) | **성능** (읽기 분산) |
| 복제 방식 | **동기** | **비동기** (지연 있음) |
| 대기 인스턴스 사용 | 평상시 트래픽 없음* | **읽기 쿼리 처리** |
| 장애 시 | **자동 승격**(1~2분) | 수동 승격 |
| 엔드포인트 | **동일 유지** ⭐ | 별도 엔드포인트 |
| 리전 간 | 불가(AZ 간) | **가능** |
| 개수 | 1개(또는 2개 읽기 가능 배포) | 최대 5~15개 |
| 비용 | **약 2배** | 복제본 수만큼 |

*Multi-AZ **클러스터 배포**를 쓰면 대기 인스턴스도 읽기를 처리할 수 있습니다(엔진·버전 제한 있음).

```
 [Multi-AZ]                          [읽기 전용 복제본]
  앱 ──▶ 주(2a) ═동기═ 대기(2c)        앱 ──쓰기──▶ 주
              (트래픽 없음)              └──읽기──▶ 복제본1, 복제본2

  주가 죽으면 → 대기가 자동 승격          복제본이 죽어도 → 서비스는 계속
  엔드포인트는 그대로!                     주가 죽으면 → 서비스 중단
```

> ⭐ **둘은 대체재가 아니라 보완재**입니다. 실무에서는 **Multi-AZ + 읽기 복제본**을 함께 씁니다.

### 백업 3종

| 종류 | 생성 | 보존 | 용도 |
|---|---|---|---|
| **자동 백업** | 매일 자동 + 트랜잭션 로그 | **1~35일** (0이면 비활성) | **PITR** |
| 수동 스냅샷 | 사용자가 실행 | **영구** (지울 때까지) | 특정 시점 보관, 마이그레이션 |
| 최종 스냅샷 | DB 삭제 시 선택 | 영구 | 삭제 전 안전장치 |

**PITR(특정 시점 복구)**

```
 백업 시점 ────── 트랜잭션 로그 ────── 지금
   03:00        (5분 단위 복구 가능)   19:00
                      ▲
              "17시 42분 상태로" 복원 요청
                      │
                      ▼
              🆕 새 DB 인스턴스로 복원
```

> 🔴 **PITR은 기존 인스턴스를 되돌리지 않습니다.** **새 인스턴스**를 만듭니다.
> 복구 후 애플리케이션의 접속 대상을 바꾸거나, 데이터를 옮겨야 합니다.

### Aurora가 다른 점

| 항목 | RDS(MySQL/PostgreSQL) | **Aurora** |
|---|---|---|
| 스토리지 | 인스턴스에 붙은 EBS | **6중 복제(3 AZ) 공유 스토리지** |
| 복제본 | 최대 5~15개, 비동기 | 최대 15개, **지연 밀리초 단위** |
| 장애 조치 | 1~2분 | **30초 이내** |
| 성능 | 표준 | MySQL 대비 최대 5배(AWS 주장) |
| 자동 확장 | 수동 | Serverless v2로 **자동 확장** |
| **프리 티어** | ✅ db.t3.micro 750h | 🔴 **없음** |
| 최소 비용 | 프리 티어면 $0 | Serverless v2 최소 0.5 ACU ≈ 시간당 $0.06 |

> 💡 **이 과정은 RDS를 기본으로** 씁니다. Aurora는 프리 티어가 없어 시연·비교용으로만 다룹니다.

### 데이터베이스 선택 기준 (미리 보기)

| 요구 | 선택 | 왜 |
|---|---|---|
| 조인·트랜잭션·집계·복잡한 질의 | **RDS / Aurora** | SQL과 관계 모델 |
| 키 기반 단건 조회, 대규모 확장, 밀리초 이하 | **DynamoDB** ([17강](../03-serverless-automation/lesson-17.md)) | 파티션 기반 |
| 반복 조회 결과 캐싱, 세션 | **ElastiCache** ([17강](../03-serverless-automation/lesson-17.md)) | 메모리 |
| 대용량 원본 파일 | **S3** | 저비용 |

### 비용 구조

```
 RDS 비용 = 인스턴스 시간 + 스토리지 + 백업 초과분 + I/O(엔진별) + 데이터 전송

 db.t3.micro 단일 AZ (서울)  시간당 약 $0.026 → 월 약 $19
 db.t3.micro Multi-AZ        시간당 약 $0.052 → 월 약 $38  🔴 2배
 gp3 스토리지 20GB           월 약 $2.9
```

| 항목 | 프리 티어(12개월) |
|---|---|
| 인스턴스 | db.t3.micro **단일 AZ** 750시간/월 |
| 스토리지 | 20GB |
| 백업 | 20GB |
| **Multi-AZ** | 🔴 **미포함** |

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.4 ~ 0.6** — Multi-AZ가 대부분입니다.
> ⏱ **RDS 생성에 10~15분**이 걸립니다. Step 2를 시작해 두고 개념을 복습하세요.

### Step 1. DB 서브넷 그룹과 보안 그룹 (15분)

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh

$ aws rds create-db-subnet-group \
    --db-subnet-group-name course-db-subnet-group \
    --db-subnet-group-description "Course private DB subnets" \
    --subnet-ids $DB_A $DB_C \
    --tags Key=Project,Value=aws-course \
    --query 'DBSubnetGroup.[DBSubnetGroupName,VpcId]' --output text
course-db-subnet-group    vpc-0c2d3e4f5a6b71829
```

**보안 그룹 확인** — [07강](../01-cloud-foundation/lesson-07.md)에서 만든 구조 그대로입니다.

```bash
$ aws ec2 describe-security-groups --group-ids $SG_DB \
    --query 'SecurityGroups[0].IpPermissions[*].{포트:FromPort,소스SG:UserIdGroupPairs[0].GroupId}' \
    --output table
--------------------------------
|  3306  |  sg-0app1234567890  |    ← 앱 계층 SG에서만
--------------------------------
```

> ⭐ **소스가 IP가 아니라 보안 그룹**입니다. 앱 인스턴스가 오토스케일링으로 늘고 줄어도 규칙을 고칠 필요가 없습니다.

### Step 2. Secrets Manager에 자격 증명 저장 (10분)

**비밀번호를 만들기 전에 저장 위치부터 정합니다.**

```bash
$ DB_PASSWORD=$(aws secretsmanager get-random-password \
    --exclude-punctuation --password-length 20 \
    --query 'RandomPassword' --output text)

$ SECRET_ARN=$(aws secretsmanager create-secret \
    --name course/db/credentials \
    --description "RDS master credentials for AWS course" \
    --secret-string "{\"username\":\"admin\",\"password\":\"$DB_PASSWORD\"}" \
    --tags Key=Project,Value=aws-course \
    --query 'ARN' --output text)
$ echo $SECRET_ARN
arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:course/db/credentials-AbCdEf
```

> 🔴 **비밀번호를 셸 히스토리나 파일에 남기지 않습니다.** 필요할 때 시크릿에서 꺼내 씁니다.
> 💰 **Secrets Manager는 비밀당 월 $0.40** 입니다(프리 티어 없음, 30일 무료 평가판).
> 단순 설정값이라면 **SSM 파라미터 스토어(표준은 무료)** 를 씁니다.

### Step 3. RDS 인스턴스 생성 ⭐ (20분)

```bash
$ aws rds create-db-instance \
    --db-instance-identifier course-mysql \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0 \
    --master-username admin \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --storage-encrypted \
    --db-subnet-group-name course-db-subnet-group \
    --vpc-security-group-ids $SG_DB \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --preferred-backup-window "18:00-18:30" \
    --preferred-maintenance-window "sun:19:00-sun:19:30" \
    --no-multi-az \
    --no-deletion-protection \
    --tags Key=Project,Value=aws-course Key=Week,Value=W08 \
    --query 'DBInstance.[DBInstanceIdentifier,DBInstanceStatus]' --output text
course-mysql    creating
```

**옵션별 의미 — 하나하나가 중요합니다**

| 옵션 | 의미 | 왜 |
|---|---|---|
| `--no-publicly-accessible` | 🔴 **인터넷에서 접근 불가** | 필수. 공개 DB는 즉시 스캔당함 |
| `--storage-encrypted` | 🔴 **저장 시 암호화** | **생성 시에만 켤 수 있음** |
| `--backup-retention-period 7` | 자동 백업 7일 | PITR 가능 기간 |
| `--preferred-backup-window` | UTC 기준(한국 새벽 3시) | 트래픽 적은 시간 |
| `--no-multi-az` | 단일 AZ로 시작 | 프리 티어 유지, Step 6에서 전환 |
| `--no-deletion-protection` | 삭제 방지 끔 | **실습용**. 운영에서는 켬 |

> 🔴 **암호화는 나중에 켤 수 없습니다.** 켜려면 스냅샷을 뜨고 암호화된 복사본으로 복원해야 합니다. **처음부터 켜세요.**

**생성 대기** (10~15분)

```bash
$ aws rds wait db-instance-available --db-instance-identifier course-mysql
$ DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier course-mysql \
    --query 'DBInstances[0].Endpoint.Address' --output text)
$ echo $DB_ENDPOINT
course-mysql.abc123xyz.ap-northeast-2.rds.amazonaws.com
```

### Step 4. 앱 인스턴스에서 접속 (15분)

```bash
$ AMI_ID=$(aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' --output text)

# NAT 필요 (mysql 클라이언트 설치용)
$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
$ NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ALLOC \
    --query 'NatGateway.NatGatewayId' --output text)
$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID

$ APP_INST=$(aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro \
    --subnet-id $APP_A --security-group-ids $SG_APP \
    --iam-instance-profile Name=EC2-Course-Role \
    --no-associate-public-ip-address \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=course-app},{Key=Project,Value=aws-course}]' \
    --query 'Instances[0].InstanceId' --output text)
$ aws ec2 wait instance-running --instance-ids $APP_INST
```

**시크릿을 읽을 권한 부여**

```bash
$ cat > secret-read-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "$SECRET_ARN"
  }]
}
EOF
$ aws iam put-role-policy --role-name EC2-Course-Role \
    --policy-name read-db-secret --policy-document file://secret-read-policy.json
```

**접속** — 비밀번호를 타이핑하지 않습니다.

```bash
$ aws ssm start-session --target $APP_INST

sh-5.2$ sudo dnf install -y mariadb105 jq
sh-5.2$ SECRET=$(aws secretsmanager get-secret-value \
        --secret-id course/db/credentials --query SecretString --output text)
sh-5.2$ DB_USER=$(echo $SECRET | jq -r .username)
sh-5.2$ DB_PASS=$(echo $SECRET | jq -r .password)
sh-5.2$ DB_HOST=course-mysql.abc123xyz.ap-northeast-2.rds.amazonaws.com

sh-5.2$ mysql -h $DB_HOST -u $DB_USER -p"$DB_PASS" -e "SELECT VERSION(), @@hostname;"
+-----------+------------------+
| VERSION() | @@hostname       |
+-----------+------------------+
| 8.0.39    | ip-10-0-21-142   |
+-----------+------------------+
```

> ✅ **비밀번호가 어디에도 기록되지 않았습니다.** 코드·사용자 데이터·환경 변수 어디에도 없습니다.

**테스트 데이터 넣기**

```bash
sh-5.2$ mysql -h $DB_HOST -u $DB_USER -p"$DB_PASS" <<'SQL'
CREATE DATABASE IF NOT EXISTS course;
USE course;
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer VARCHAR(50),
  amount INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO orders (customer, amount) VALUES
  ('kim', 15000), ('lee', 23000), ('park', 8000);
SELECT * FROM orders;
SQL
+----+----------+--------+---------------------+
| id | customer | amount | created_at          |
+----+----------+--------+---------------------+
|  1 | kim      |  15000 | 2026-08-13 20:14:02 |
|  2 | lee      |  23000 | 2026-08-13 20:14:02 |
|  3 | park     |   8000 | 2026-08-13 20:14:02 |
+----+----------+--------+---------------------+
```

**격리 증명 — 인터넷에서 접근 불가**

```bash
$ nc -zv -w 5 $DB_ENDPOINT 3306
nc: connect to course-mysql.abc123xyz.ap-northeast-2.rds.amazonaws.com port 3306 (tcp) timed out

$ dig +short $DB_ENDPOINT
10.0.21.142          ← 사설 IP만 반환된다
```

> ✅ **DNS도 사설 IP를 반환합니다.** 퍼블릭 액세스가 꺼져 있다는 증거입니다.

### Step 5. Multi-AZ 전환과 장애 조치 ⭐ (25분)

**① Multi-AZ로 전환**

```bash
$ aws rds modify-db-instance --db-instance-identifier course-mysql \
    --multi-az --apply-immediately \
    --query 'DBInstance.[MultiAZ,DBInstanceStatus]' --output text
False    modifying
```

> ⏱ 전환에 **5~15분**이 걸립니다. 🔴 **여기서부터 요금이 2배**가 됩니다.

```bash
$ aws rds wait db-instance-available --db-instance-identifier course-mysql
$ aws rds describe-db-instances --db-instance-identifier course-mysql \
    --query 'DBInstances[0].{MultiAZ:MultiAZ,주AZ:AvailabilityZone,대기AZ:SecondaryAvailabilityZone}'
{
    "MultiAZ": true,
    "주AZ": "ap-northeast-2a",
    "대기AZ": "ap-northeast-2c"
}
```

**② 장애 조치 실행 전 준비** — 다운타임을 측정합니다.

앱 인스턴스에서 1초마다 쿼리를 던지는 루프를 켭니다.

```bash
$ aws ssm start-session --target $APP_INST
sh-5.2$ while true; do
  T=$(date +%T)
  R=$(mysql -h $DB_HOST -u $DB_USER -p"$DB_PASS" -N -e "SELECT @@hostname" 2>&1 | head -1)
  echo "$T  $R"
  sleep 1
done
```

**③ 다른 터미널에서 장애 조치 강제 실행**

```bash
$ aws rds reboot-db-instance --db-instance-identifier course-mysql --force-failover
```

**④ 루프 출력 관찰**

```
20:31:40  ip-10-0-21-142                  ← 주(2a)
20:31:41  ip-10-0-21-142
20:31:42  ERROR 2003 (HY000): Can't connect to MySQL server ... (110)
20:31:43  ERROR 2003 (HY000): Can't connect to MySQL server ... (110)
...
20:32:38  ERROR 2003 (HY000): Can't connect to MySQL server ... (110)
20:32:41  ip-10-0-22-87                   ← 대기(2c)가 승격됨!
20:32:42  ip-10-0-22-87
```

| 항목 | 값 |
|---|---|
| 장애 조치 시작 | 20:31:42 |
| 복구 완료 | 20:32:41 |
| **총 다운타임** | **약 59초** |
| **엔드포인트** | 🔑 **바뀌지 않음** |

> ✅ **`@@hostname` 이 바뀌었습니다.** 물리적으로 다른 AZ의 인스턴스입니다.
> 그런데 **애플리케이션은 접속 문자열을 하나도 안 바꿨습니다.** DNS가 뒤에서 바뀌었기 때문입니다.
> 이것이 "엔드포인트를 IP로 적어 두면 안 되는" 이유입니다.

**⑤ 데이터 일관성 확인**

```bash
sh-5.2$ mysql -h $DB_HOST -u $DB_USER -p"$DB_PASS" -e "SELECT COUNT(*) FROM course.orders;"
+----------+
| COUNT(*) |
+----------+
|        3 |
+----------+
```

> ✅ **동기 복제이므로 데이터 손실이 없습니다.** 비동기인 읽기 복제본과의 결정적 차이입니다.

**⑥ 이벤트 로그 확인**

```bash
$ aws rds describe-events --source-identifier course-mysql \
    --source-type db-instance --duration 30 \
    --query 'Events[*].[Date,Message]' --output table
------------------------------------------------------------------------------
|  2026-08-13T20:31:42Z  |  Multi-AZ instance failover started                |
|  2026-08-13T20:32:38Z  |  Multi-AZ instance failover completed              |
|  2026-08-13T20:32:41Z  |  DB instance restarted                             |
------------------------------------------------------------------------------
```

### Step 6. PITR — 실수를 되돌리기 (20분)

**① 사고를 일으킵니다**

```bash
sh-5.2$ date -u
Thu Aug 13 20:40:15 UTC 2026

sh-5.2$ mysql -h $DB_HOST -u $DB_USER -p"$DB_PASS" -e "SELECT NOW(); DELETE FROM course.orders WHERE amount > 10000;"
+---------------------+
| NOW()               |
+---------------------+
| 2026-08-13 20:41:02 |
+---------------------+

sh-5.2$ mysql -h $DB_HOST -u $DB_USER -p"$DB_PASS" -e "SELECT * FROM course.orders;"
+----+----------+--------+---------------------+
| id | customer | amount | created_at          |
+----+----------+--------+---------------------+
|  3 | park     |   8000 | 2026-08-13 20:14:02 |
+----+----------+--------+---------------------+
```

> 🔴 **2건이 사라졌습니다.** 실무에서 자주 벌어지는 `WHERE` 절 사고입니다.

**② 복구 가능 시점 확인**

```bash
$ aws rds describe-db-instances --db-instance-identifier course-mysql \
    --query 'DBInstances[0].LatestRestorableTime' --output text
2026-08-13T20:39:00+00:00
```

> 📌 **최신 복구 가능 시점은 보통 5분 전**입니다. 사고 직후에는 조금 기다려야 합니다.

**③ 사고 직전 시점으로 새 인스턴스 복원**

```bash
$ aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier course-mysql \
    --target-db-instance-identifier course-mysql-restored \
    --restore-time 2026-08-13T20:40:00Z \
    --db-subnet-group-name course-db-subnet-group \
    --vpc-security-group-ids $SG_DB \
    --no-publicly-accessible \
    --no-multi-az \
    --db-instance-class db.t3.micro \
    --query 'DBInstance.DBInstanceIdentifier' --output text
course-mysql-restored
```

> ⏱ 복원에 **10~20분**이 걸립니다.

**④ 복원 확인**

```bash
$ aws rds wait db-instance-available --db-instance-identifier course-mysql-restored
$ RESTORED_EP=$(aws rds describe-db-instances --db-instance-identifier course-mysql-restored \
    --query 'DBInstances[0].Endpoint.Address' --output text)

sh-5.2$ mysql -h course-mysql-restored.abc123xyz.ap-northeast-2.rds.amazonaws.com \
        -u $DB_USER -p"$DB_PASS" -e "SELECT * FROM course.orders;"
+----+----------+--------+---------------------+
| id | customer | amount | created_at          |
+----+----------+--------+---------------------+
|  1 | kim      |  15000 | 2026-08-13 20:14:02 |
|  2 | lee      |  23000 | 2026-08-13 20:14:02 |
|  3 | park     |   8000 | 2026-08-13 20:14:02 |
+----+----------+--------+---------------------+
```

> ✅ **삭제된 2건이 복구됐습니다.**
> 🔴 **단, 새 엔드포인트입니다.** 실무에서는 ① 복원본에서 데이터만 추출해 원본에 넣거나 ② 애플리케이션 접속 대상을 바꿉니다.
> 그리고 **복원본도 과금되므로 확인 후 즉시 삭제**합니다.

### Step 7. 읽기 전용 복제본 (선택, 10분)

```bash
$ aws rds create-db-instance-read-replica \
    --db-instance-identifier course-mysql-replica \
    --source-db-instance-identifier course-mysql \
    --db-instance-class db.t3.micro \
    --no-publicly-accessible \
    --query 'DBInstance.DBInstanceIdentifier' --output text
course-mysql-replica
```

**복제 지연 확인**

```bash
$ aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS --metric-name ReplicaLag \
    --dimensions Name=DBInstanceIdentifier,Value=course-mysql-replica \
    --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 --statistics Average \
    --query 'Datapoints[*].[Timestamp,Average]' --output table
```

> 💡 **비동기 복제**라 지연(보통 1초 미만)이 있습니다. **"방금 쓴 것을 바로 읽어야 하는" 로직은 주 인스턴스로** 보내야 합니다.
> 확인 후 바로 삭제하세요(복제본도 인스턴스 요금 발생).

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| RDS db.t3.micro **단일 AZ** | ✅ 750h(12개월) | $0 | 약 $19 |
| **RDS Multi-AZ** | 🔴 **미포함** | **약 $0.32** | 🔴 **약 $38** |
| 스토리지 gp3 20GB | ✅ 20GB | $0 | 약 $2.9 |
| 자동 백업 | ✅ 할당 용량까지 | $0 | 초과분 GB당 $0.095 |
| PITR 복원 인스턴스 | ❌(추가 인스턴스) | 약 $0.08 | 약 $19 |
| 읽기 복제본(선택) | ❌ | 약 $0.08 | 약 $19 |
| **Secrets Manager** | ❌ | 약 $0.01 | **$0.40/비밀** |
| NAT Gateway | ❌ | 약 $0.36 | 🔴 약 $42 |
| **합계** | | **약 $0.9** | **약 $140** |

> 🔴 **RDS 삭제 시 주의 3가지**
> ① **최종 스냅샷을 만들면 계속 과금**됩니다. 실습 데이터라면 만들지 마세요.
> ② **수동 스냅샷은 인스턴스를 지워도 남습니다.**
> ③ **PITR 복원본과 읽기 복제본은 별도 인스턴스**입니다. 각각 지워야 합니다.

### 🧹 리소스 정리 체크리스트

```bash
# 1) 읽기 복제본 (만들었다면 먼저)
$ aws rds delete-db-instance --db-instance-identifier course-mysql-replica \
    --skip-final-snapshot 2>/dev/null

# 2) PITR 복원 인스턴스
$ aws rds delete-db-instance --db-instance-identifier course-mysql-restored \
    --skip-final-snapshot --delete-automated-backups

# 3) 원본 RDS
$ aws rds delete-db-instance --db-instance-identifier course-mysql \
    --skip-final-snapshot --delete-automated-backups
$ aws rds wait db-instance-deleted --db-instance-identifier course-mysql

# 4) 남은 스냅샷 확인 및 삭제
$ aws rds describe-db-snapshots --snapshot-type manual \
    --query 'DBSnapshots[*].[DBSnapshotIdentifier,AllocatedStorage]' --output table

# 5) Secrets Manager — 복구 대기 기간 없이 즉시 삭제
$ aws secretsmanager delete-secret --secret-id course/db/credentials \
    --force-delete-without-recovery

# 6) EC2 · NAT · DB 서브넷 그룹
$ aws ec2 terminate-instances --instance-ids $APP_INST
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 release-address --allocation-id $EIP_ALLOC
$ aws rds delete-db-subnet-group --db-subnet-group-name course-db-subnet-group
$ aws iam delete-role-policy --role-name EC2-Course-Role --policy-name read-db-secret
```

**최종 확인**

```bash
$ aws rds describe-db-instances --query 'DBInstances[*].DBInstanceIdentifier' --output text
$ aws rds describe-db-snapshots --snapshot-type manual --query 'DBSnapshots[*].DBSnapshotIdentifier' --output text
$ aws secretsmanager list-secrets --query 'SecretList[*].Name' --output text
```

- [ ] 읽기 복제본 · PITR 복원본 · 원본 RDS **모두 삭제**
- [ ] `--skip-final-snapshot` 사용 (실습 데이터)
- [ ] 수동 스냅샷 0개 확인
- [ ] 🔴 **Secrets Manager 시크릿 `--force-delete-without-recovery`** 로 삭제 (기본 30일 대기 중에도 과금)
- [ ] NAT Gateway 삭제 + EIP 반환
- [ ] DB 서브넷 그룹 삭제
- [ ] 다음 날 Cost Explorer에서 RDS 항목 확인

---

## ⑤ 자주 하는 실수

### RDS 생성이 실패한다

```
An error occurred (InvalidVPCNetworkStateFault) when calling the CreateDBInstance operation:
DB Subnet Group doesn't meet availability zone coverage requirement.
Please add subnets to cover at least 2 availability zones.
```

**원인** — DB 서브넷 그룹에 **AZ가 2개 이상** 없습니다.
**해결** — 서로 다른 AZ의 서브넷 2개를 넣습니다. Multi-AZ를 안 쓰더라도 필수입니다.

```
An error occurred (InvalidParameterValue): Cannot find version 8.0.35 for mysql
```
**원인** — 지정한 엔진 버전이 그 리전에 없습니다.
**해결** — 사용 가능한 버전을 조회합니다.

```bash
$ aws rds describe-db-engine-versions --engine mysql \
    --query 'DBEngineVersions[*].EngineVersion' --output text
```

### 앱에서 DB에 접속할 수 없다

```
ERROR 2003 (HY000): Can't connect to MySQL server on 'course-mysql...' (110)
```

**110은 타임아웃**입니다. 패킷이 도달하지 못했다는 뜻이므로 **네트워크 문제**입니다.

| # | 확인 | 명령 |
|---|---|---|
| 1 | **DB 보안 그룹이 앱 SG로부터 3306을 허용하나** | `describe-security-groups` |
| 2 | 앱과 DB가 같은 VPC인가 | `describe-db-instances --query '...DBSubnetGroup.VpcId'` |
| 3 | 엔드포인트 이름이 정확한가 | 복사 오타 |
| 4 | DB가 `available` 상태인가 | `describe-db-instances` |

**반면 이 오류는 네트워크 문제가 아닙니다.**

```
ERROR 1045 (28000): Access denied for user 'admin'@'10.0.11.20' (using password: YES)
```

**연결은 됐고 인증이 틀렸습니다.** 비밀번호나 사용자 이름을 확인하세요.

> 💡 **오류 번호로 구분하는 습관** — `2003`(타임아웃) = 네트워크, `1045` = 자격 증명.

### 퍼블릭 액세스를 켜서 만들었다

**증상** — 며칠 뒤 CloudTrail에 모르는 IP의 접속 시도가 잔뜩 찍힙니다.
**원인** — `--publicly-accessible` 로 만들었고 보안 그룹이 넓게 열려 있습니다.
**해결**

```bash
$ aws rds modify-db-instance --db-instance-identifier course-mysql \
    --no-publicly-accessible --apply-immediately
```

**확인**

```bash
$ dig +short course-mysql.abc123xyz.ap-northeast-2.rds.amazonaws.com
10.0.21.142        ← 사설 IP면 정상. 공인 IP가 나오면 아직 공개 상태
```

> 🔴 **공개된 데이터베이스는 몇 시간 안에 스캔당합니다.** 관리 도구로 접속하고 싶다면 **배스천 대신 SSM 포트 포워딩**을 쓰세요.
> ```bash
> aws ssm start-session --target $APP_INST \
>   --document-name AWS-StartPortForwardingSessionToRemoteHost \
>   --parameters '{"host":["<DB엔드포인트>"],"portNumber":["3306"],"localPortNumber":["13306"]}'
> ```

### 암호화를 나중에 켜려는데 안 된다

**원인** — **저장 시 암호화는 생성 시점에만** 설정할 수 있습니다.
**해결** — 스냅샷을 뜨고 **암호화된 복사본**을 만들어 복원합니다.

```bash
$ aws rds create-db-snapshot --db-instance-identifier course-mysql \
    --db-snapshot-identifier snap-plain
$ aws rds copy-db-snapshot --source-db-snapshot-identifier snap-plain \
    --target-db-snapshot-identifier snap-encrypted --kms-key-id alias/aws/rds
$ aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier course-mysql-enc --db-snapshot-identifier snap-encrypted
```

**다운타임이 발생합니다.** 그래서 **처음부터 켜는 것**이 정답입니다.

### 삭제했는데 계속 요금이 나온다

**원인 3가지**

| 원인 | 확인 |
|---|---|
| **최종 스냅샷**을 만들었다 | `describe-db-snapshots --snapshot-type manual` |
| **자동 백업이 남아 있다** | `describe-db-instance-automated-backups` |
| **읽기 복제본·복원본**을 안 지웠다 | `describe-db-instances` |

**해결**

```bash
$ aws rds delete-db-instance --db-instance-identifier course-mysql \
    --skip-final-snapshot --delete-automated-backups
```

> ⚠️ **운영 환경에서는 반대로 하세요.** 최종 스냅샷을 반드시 만들고 삭제 방지도 켭니다. `--skip-final-snapshot` 은 **실습 전용**입니다.

### PITR로 복원했는데 원래 DB가 안 바뀐다

**원인** — **정상 동작입니다.** PITR은 **새 인스턴스**를 만듭니다. 기존 인스턴스는 그대로입니다.
**실무 절차**

```
 ① 복원본 생성 (새 엔드포인트)
 ② 데이터 확인
 ③ 둘 중 하나:
     a. 복원본에서 필요한 데이터만 추출해 원본에 넣기 (부분 사고)
     b. 애플리케이션 접속 대상을 복원본으로 전환 (전면 사고)
 ④ 불필요한 인스턴스 삭제
```

> 💡 **b를 택하면 다운타임이 생깁니다.** 그래서 복구 절차서(런북)에 **어느 쪽을 언제 택할지** 미리 적어 둡니다. [26강 DR](../04-final-project/lesson-26.md)에서 다룹니다.

### Secrets Manager 시크릿이 지워지지 않는다

```bash
$ aws secretsmanager list-secrets --query 'SecretList[*].[Name,DeletedDate]' --output table
--------------------------------------------------------
|  course/db/credentials  |  2026-09-12T00:00:00+00:00  |
--------------------------------------------------------
```

**원인** — 기본 삭제는 **복구 대기 기간(7~30일)** 을 둡니다. **그동안 계속 과금**됩니다.
**해결**

```bash
$ aws secretsmanager delete-secret --secret-id course/db/credentials \
    --force-delete-without-recovery
```

> ⚠️ **운영에서는 이 옵션을 쓰지 마세요.** 실수로 지운 시크릿을 되살릴 수 없습니다.

---

## ⑥ 확인 문제

**1.** 읽기 성능이 부족합니다. Multi-AZ를 켜면 해결될까요? 아니라면 무엇을 해야 하나요?

<details>
<summary>답 보기</summary>

**해결되지 않습니다.**

| | Multi-AZ | 읽기 전용 복제본 |
|---|---|---|
| 목적 | **가용성** | **성능(읽기 분산)** |
| 대기 인스턴스 | 평상시 트래픽 없음 | **읽기 쿼리 처리** |
| 복제 | 동기 | 비동기 |

Multi-AZ의 대기 인스턴스는 **장애를 대비해 대기할 뿐** 쿼리를 받지 않습니다(클러스터 배포 예외). 켜도 읽기 성능은 그대로이고 **비용만 2배**가 됩니다.

**읽기 부하 해결책 순서**

| 순서 | 방법 | 비용 |
|---|---|---|
| 1 | **쿼리·인덱스 튜닝** | $0 (가장 먼저 할 일) |
| 2 | **ElastiCache 캐싱** ([17강](../03-serverless-automation/lesson-17.md)) | 낮음 |
| 3 | **읽기 전용 복제본** | 인스턴스 하나 추가 |
| 4 | 인스턴스 크기 상향 | 비쌈 |

> ⚠️ **복제본을 쓸 때 주의** — 비동기 복제라 지연이 있습니다. **"방금 쓴 것을 바로 읽는" 로직**은 반드시 주 인스턴스로 보내야 합니다.
</details>

**2.** 어제 오후 3시 상태로 되돌리고 싶습니다. 무엇을 쓰고, 어떤 조건이 필요하며, 결과는 어떻게 되나요?

<details>
<summary>답 보기</summary>

**PITR(특정 시점 복구)** 을 씁니다.

**필요 조건**
- **자동 백업이 켜져 있어야** 합니다(`backup-retention-period` ≥ 1)
- 되돌릴 시점이 **보존 기간 안**이어야 합니다(최대 35일)
- 최신 복구 가능 시점은 보통 **5분 전**까지입니다

**명령**

```bash
$ aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier course-mysql \
    --target-db-instance-identifier course-mysql-restored \
    --restore-time 2026-08-12T06:00:00Z
```

> 📌 시각은 **UTC**입니다. 한국 시각 오후 3시 = UTC 06:00.

**🔴 결과 — 기존 인스턴스는 바뀌지 않고 새 인스턴스가 생깁니다.**

```
 course-mysql           (그대로, 현재 데이터)
 course-mysql-restored  (새 인스턴스, 어제 15시 데이터, 새 엔드포인트)
```

**이후 해야 할 일**
1. 복원본에서 데이터 확인
2. 부분 사고면 → 필요한 행만 원본으로 이관
3. 전면 사고면 → 애플리케이션 접속 대상 전환
4. **불필요한 인스턴스 삭제** (둘 다 과금 중)

**스냅샷 복원과의 차이**

| | PITR | 스냅샷 복원 |
|---|---|---|
| 시점 | **임의의 시각(5분 단위)** | 스냅샷을 뜬 시점만 |
| 조건 | 자동 백업 활성화 | 스냅샷 존재 |
| 결과 | 둘 다 **새 인스턴스** | |
</details>

**3.** DB 비밀번호를 애플리케이션에 안전하게 전달하는 방법을 설명하고, 하면 안 되는 방법 3가지를 드세요.

<details>
<summary>답 보기</summary>

**권장 — AWS Secrets Manager + IAM 역할**

```bash
# 애플리케이션은 값이 아니라 "이름"만 안다
SECRET=$(aws secretsmanager get-secret-value \
  --secret-id course/db/credentials --query SecretString --output text)
DB_PASS=$(echo $SECRET | jq -r .password)
```

**동작 구조**

```
 EC2/ECS/Lambda ──(IAM 역할)──▶ Secrets Manager ──▶ 비밀번호
    │
    └─ 코드·이미지·환경변수 어디에도 비밀번호가 없다
```

| 이점 | 설명 |
|---|---|
| 코드에 값이 없음 | Git·이미지·AMI 어디에도 남지 않음 |
| **자동 교체(rotation)** | RDS와 연동해 주기적으로 자동 변경 |
| 감사 | 누가 언제 조회했는지 CloudTrail에 기록 |
| 접근 제어 | IAM 정책으로 시크릿 단위 제어 |

**🔴 하면 안 되는 방법 3가지**

| 방법 | 왜 위험한가 |
|---|---|
| **① 코드에 하드코딩** | Git에 올라가면 영구히 남고 스캔봇이 찾음 |
| **② 사용자 데이터·시작 템플릿에 기록** | **메타데이터로 조회 가능**([09강](lesson-09.md)) |
| **③ 평문 환경 변수·설정 파일** | 프로세스 목록·컨테이너 검사·로그에 노출 |

**비용 고려**

| 서비스 | 비용 | 언제 |
|---|---|---|
| **Secrets Manager** | 비밀당 월 $0.40 | 자격 증명, **자동 교체 필요** |
| **SSM 파라미터 스토어(SecureString)** | 표준은 **무료** | 일반 설정값, 교체가 필요 없는 값 |

> 💡 **비용이 부담되면** 파라미터 스토어 SecureString(KMS 암호화)도 충분히 안전합니다. 자동 교체 기능만 없습니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 관리형 DB | 패치·백업·장애 조치를 대신. **OS 접근 불가** |
| DB 서브넷 그룹 | **최소 2개 AZ** 필요 |
| 보안 | `--no-publicly-accessible` · 소스는 **앱 보안 그룹** |
| 암호화 | 🔴 **생성 시에만** 켤 수 있음 |
| **Multi-AZ** | **가용성**·동기·자동 승격·**엔드포인트 동일**·비용 2배 |
| **읽기 복제본** | **성능**·비동기·별도 엔드포인트·지연 존재 |
| 백업 | 자동(PITR용) / 수동 스냅샷(영구) / 최종 스냅샷 |
| PITR | 자동 백업 필요 · **새 인스턴스로 복원** |
| Aurora | 6중 복제·빠른 장애 조치·**프리 티어 없음** |
| 자격 증명 | **Secrets Manager + IAM 역할**. 코드·사용자 데이터 금지 |

**한 장 요약**

```
  앱(프라이빗) ──3306──▶ RDS(프라이빗, 암호화, 퍼블릭 액세스 아니요)
                          ├─ Multi-AZ  → 죽으면 1분 내 자동 전환 (엔드포인트 그대로)
                          ├─ 자동 백업  → PITR로 임의 시점 복원 (새 인스턴스)
                          └─ 자격 증명  → Secrets Manager
```

**오늘 반드시 기억할 한 가지**
> **Multi-AZ는 가용성, 읽기 복제본은 성능.** 둘을 바꿔 쓰면 돈만 쓰고 문제는 안 풀립니다.
> 그리고 **암호화와 퍼블릭 액세스 설정은 생성 시점의 결정**입니다.

**과제**
1. **장애 조치 실험 기록** — 1초 간격 쿼리 루프 출력 전체, `@@hostname` 변화, **총 다운타임**, 엔드포인트가 그대로인 것 확인.
2. **PITR 복구 기록** — 삭제 전 데이터 / 삭제 후 / 복원본에서 복구된 데이터, 그리고 **복원본이 새 엔드포인트**임을 보이는 출력.
3. **격리 증명 2종** — 인터넷에서 3306 타임아웃 / `dig` 결과가 사설 IP.
4. **자격 증명 관리** — 사용자 데이터·코드·환경 변수 어디에도 비밀번호가 없음을 보이고, Secrets Manager에서 읽는 명령을 제출하세요.
5. **Multi-AZ vs 읽기 복제본 비교표**를 직접 작성하고, "우리 서비스에 무엇이 필요한가"를 5줄로 쓰세요.
6. 정리 확인 — RDS 인스턴스 0개, 수동 스냅샷 0개, 시크릿 0개.

---

[← 이전 14강](lesson-14.md) · [목차](README.md) · [다음 → 16강 🏁 중간 프로젝트 — 고가용성 웹 서비스](lesson-16.md)
