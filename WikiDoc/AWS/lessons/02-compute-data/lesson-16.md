# 16강 · 🏁 중간 프로젝트 — 고가용성 웹 서비스

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **16강 / 총 32강**
> [← 이전 15강](lesson-15.md) · [목차](README.md) · [다음 → 17강 DynamoDB와 ElastiCache](../03-serverless-automation/lesson-17.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 요구사항 문장을 **아키텍처 다이어그램과 구축 순서**로 번역할 수 있다.
- W04–W15에서 배운 서비스를 **하나의 서비스로 통합**해 구축할 수 있다.
- 고가용성·확장성·데이터 보호를 **각각 실험으로 증명**할 수 있다.
- 완성한 아키텍처의 **월간 비용을 구성 요소별로 산정**하고 절감안을 제시할 수 있다.
- 3분 안에 **시연하고 설계 근거를 설명**할 수 있다.

---

## ② 왜 필요한가

지금까지 9주 동안 배운 것을 나열하면 이렇습니다.

```
 VPC · IAM · CLI · EC2 · AMI · 사용자 데이터 · Auto Scaling
 ALB · Route 53 · ACM · S3 · EBS · EFS · CloudFront · RDS
```

각각은 익혔지만, **이것을 조립해 본 적은 없습니다.** 그리고 실무에서 요구는 서비스 이름으로 오지 않습니다.

> "이벤트 신청 사이트를 여는데, 오픈 직후 트래픽이 몰려요. 서버 한 대 죽어도 안 멈춰야 하고, 신청 데이터는 절대 유실되면 안 됩니다."

이 문장에는 **EC2도 ALB도 RDS도 등장하지 않습니다.** 그것을 고르는 것이 오늘의 일입니다.

그리고 오늘 또 하나를 훈련합니다 — **증명**입니다.

| 말하는 것 | 증명하는 것 |
|---|---|
| "고가용성으로 구성했습니다" | 인스턴스를 죽이는 동안 **200 응답 20건** |
| "자동 확장됩니다" | 부하 시 **CloudWatch 그래프와 인스턴스 증가 기록** |
| "데이터가 안전합니다" | **장애 조치 전후 `COUNT(*)` 일치** |

[08강 미니 프로젝트](../01-cloud-foundation/lesson-08.md)에서 시작한 이 훈련이 최종 프로젝트의 평가 기준이 됩니다.

---

## ③ 개념 설명

### 프로젝트 요구사항

> **[과제 문장]**
> 사내 이벤트 신청 사이트를 오픈한다.
> ① 신청 폭주 시간대에 **자동으로 확장**되어야 한다.
> ② 서버 1대나 **AZ 하나가 죽어도** 서비스가 멈추면 안 된다.
> ③ 신청 데이터는 **유실되면 안 된다.**
> ④ 이미지 등 정적 자원은 **빠르게 제공**되어야 한다.
> ⑤ 모든 접속은 **HTTPS**여야 한다.
> ⑥ 서버와 DB는 **인터넷에서 직접 접근할 수 없어야** 한다.

### 요구사항 → 구성 요소 결정표 ⭐

**이 표가 프로젝트 산출물 1번입니다.** 대안을 비교하고 근거를 적는 것이 핵심입니다.

| 요구 | 선택 | 대안 | 선택 근거 |
|---|---|---|---|
| ① 자동 확장 | **ASG + 타깃 추적** | 수동 증설 / 큰 인스턴스 1대 | 사람 개입 없이 4~5분 내 대응 |
| ② 서버 장애 | **ASG 자동 복구 + ELB 헬스 체크** | 감시 스크립트 | 애플리케이션 장애까지 감지 ([11강](lesson-11.md)) |
| ② AZ 장애 | **2개 AZ 분산** (ALB·ASG·RDS 전부) | 단일 AZ | AZ는 물리적으로 분리됨 ([01강](../01-cloud-foundation/lesson-01.md)) |
| ③ 데이터 보호 | **RDS Multi-AZ + 자동 백업 7일** | EC2에 직접 DB 설치 | 동기 복제로 무손실, PITR 가능 |
| ④ 정적 자원 | **S3(비공개) + CloudFront(OAC)** | EC2에서 직접 서빙 | 전송비 절감·엣지 캐싱·서버 부하 감소 |
| ⑤ HTTPS | **ACM + ALB 443 + 80 리다이렉트** | EC2에 인증서 설치 | 무료·자동 갱신·서버마다 설치 불필요 |
| ⑥ 비공개 | **프라이빗 서브넷 + SG 참조 체인** | 퍼블릭 + 방화벽 규칙 | 라우팅 자체가 없어 도달 불가 |

### 목표 아키텍처

```
                            사용자
                              │
              ┌───────────────┴────────────────┐
              │                                │
       https://app.<도메인>              CloudFront (OAC)
              │  Route 53 Alias                │
              ▼                                ▼
   ┌──────── ALB (2 AZ, 443/80→301) ────┐   S3 (비공개, 정적 자산)
   │  퍼블릭 10.0.1.0/24 · 10.0.2.0/24   │
   └──────────────┬─────────────────────┘
                  │ SG 참조 (ALB SG → APP SG)
   ┌──────────────▼─────────────────────┐
   │  Auto Scaling Group (min2/max4)     │
   │  앱 10.0.11.0/24 (2a) · 10.0.12.0/24 (2c)
   │  [EC2] [EC2]  ← 시작 템플릿 부트스트랩
   └──────────────┬─────────────────────┘
                  │ SG 참조 (APP SG → DB SG), 3306
   ┌──────────────▼─────────────────────┐
   │  RDS MySQL Multi-AZ (암호화·백업 7일) │
   │  DB 10.0.21.0/24 (2a) · 10.0.22.0/24 (2c)
   └────────────────────────────────────┘
                  ▲
        Secrets Manager (DB 자격 증명)
```

### 구축 순서 — 왜 이 순서인가

```
 ① 네트워크   → 모든 것이 그 안에 들어가므로 가장 먼저
 ② 데이터     → 생성에 10~15분 걸리므로 일찍 시작 (그동안 다른 작업)
 ③ 컴퓨팅     → DB 접속 정보가 필요하므로 ② 다음
 ④ 트래픽     → 대상(컴퓨팅)이 있어야 헬스 체크가 성립
 ⑤ 정적 계층  → 독립적이므로 병렬 가능
 ⑥ 검증       → 전부 붙은 뒤
```

> 💡 **②를 먼저 시작해 두고 ③을 만드는 것**이 시간 절약의 핵심입니다. RDS 생성 대기 시간에 다른 작업을 합니다.

---

## ④ 단계별 실습 — 🏁 중간 프로젝트

> 💰 **예상 비용 $0.4 ~ 0.6** (Multi-AZ 시연 시간 최소화 기준)
> ⏱ **예상 소요 120분** — 사전 과제(설계) 완료를 전제로 합니다.

### Step 0. 사전 과제 — 설계 (수업 전 제출)

수업 전에 아래 3가지를 준비합니다.

- [ ] **아키텍처 다이어그램** (draw.io 등, AWS 아이콘 사용)
- [ ] **구성 요소 결정표** (위 표를 본인 언어로 작성, 대안과 근거 포함)
- [ ] **구축 순서 계획** (각 단계 예상 소요 시간 포함)

### Step 1. 네트워크 계층 (15분)

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh

$ aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[*].[Tags[?Key==`Name`]|[0].Value,CidrBlock,AvailabilityZone]' --output table
------------------------------------------------------------------
|  course-public-2a  |  10.0.1.0/24   |  ap-northeast-2a          |
|  course-public-2c  |  10.0.2.0/24   |  ap-northeast-2c          |
|  course-app-2a     |  10.0.11.0/24  |  ap-northeast-2a          |
|  course-app-2c     |  10.0.12.0/24  |  ap-northeast-2c          |
|  course-db-2a      |  10.0.21.0/24  |  ap-northeast-2a          |
|  course-db-2c      |  10.0.22.0/24  |  ap-northeast-2c          |
------------------------------------------------------------------
```

**NAT Gateway** (패키지 설치용)

```bash
$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
$ NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ALLOC \
    --query 'NatGateway.NatGatewayId' --output text)
$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID
```

**보안 그룹 체인 확인** — 이 구조가 요구사항 ⑥의 핵심입니다.

```
 인터넷 ─▶ SG_WEB (80/443 from 0.0.0.0/0 또는 내 IP)
              └─▶ SG_APP (80 from SG_WEB)
                     └─▶ SG_DB (3306 from SG_APP)
```

### Step 2. 데이터 계층 — 먼저 시작해 두기 (20분, 대기 시간 활용)

```bash
$ aws rds create-db-subnet-group \
    --db-subnet-group-name course-db-subnet-group \
    --db-subnet-group-description "midterm project" \
    --subnet-ids $DB_A $DB_C

$ DB_PASSWORD=$(aws secretsmanager get-random-password \
    --exclude-punctuation --password-length 20 --query 'RandomPassword' --output text)

$ SECRET_ARN=$(aws secretsmanager create-secret \
    --name course/midterm/db \
    --secret-string "{\"username\":\"admin\",\"password\":\"$DB_PASSWORD\",\"dbname\":\"eventapp\"}" \
    --query 'ARN' --output text)

$ aws rds create-db-instance \
    --db-instance-identifier midterm-mysql \
    --db-instance-class db.t3.micro --engine mysql --engine-version 8.0 \
    --master-username admin --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 --storage-type gp3 --storage-encrypted \
    --db-subnet-group-name course-db-subnet-group \
    --vpc-security-group-ids $SG_DB \
    --no-publicly-accessible --backup-retention-period 7 \
    --no-multi-az --no-deletion-protection \
    --tags Key=Project,Value=aws-course Key=Week,Value=W08
```

> ⏱ **여기서 기다리지 말고 Step 3으로 넘어갑니다.** 생성에 10~15분이 걸립니다.
> 📌 **Multi-AZ는 나중에 켭니다.** 요금이 2배이므로 시연 직전에 전환합니다.

**시크릿 읽기 권한**

```bash
$ cat > secret-policy.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow",
 "Action":["secretsmanager:GetSecretValue"],"Resource":"$SECRET_ARN"}]}
EOF
$ aws iam put-role-policy --role-name EC2-Course-Role \
    --policy-name read-midterm-secret --policy-document file://secret-policy.json
```

### Step 3. 컴퓨팅 계층 — 애플리케이션이 있는 시작 템플릿 (25분)

**신청 페이지가 있는 사용자 데이터**

```bash
$ cat > app-user-data.sh <<'EOF'
#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y nginx mariadb105 jq php-fpm php-mysqlnd

# 인스턴스 정보
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
IID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
      http://169.254.169.254/latest/meta-data/instance-id)
AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
     http://169.254.169.254/latest/meta-data/placement/availability-zone)

# DB 자격 증명 (Secrets Manager)
SECRET=$(aws secretsmanager get-secret-value --secret-id course/midterm/db \
         --query SecretString --output text --region ap-northeast-2)
DB_USER=$(echo "$SECRET" | jq -r .username)
DB_PASS=$(echo "$SECRET" | jq -r .password)
DB_NAME=$(echo "$SECRET" | jq -r .dbname)
DB_HOST=$(aws rds describe-db-instances --db-instance-identifier midterm-mysql \
          --query 'DBInstances[0].Endpoint.Address' --output text --region ap-northeast-2)

# PHP 설정 파일 (웹 루트 밖에 두어 노출 방지)
mkdir -p /etc/eventapp
cat > /etc/eventapp/db.php <<PHP
<?php
\$DB_HOST='$DB_HOST'; \$DB_USER='$DB_USER'; \$DB_PASS='$DB_PASS'; \$DB_NAME='$DB_NAME';
\$IID='$IID'; \$AZ='$AZ';
PHP
chmod 640 /etc/eventapp/db.php
chown root:nginx /etc/eventapp/db.php

# 스키마 초기화 (여러 대가 동시에 실행해도 안전)
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" <<SQL || true
CREATE DATABASE IF NOT EXISTS $DB_NAME;
USE $DB_NAME;
CREATE TABLE IF NOT EXISTS signups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_by VARCHAR(30),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
SQL

# 신청 페이지
cat > /usr/share/nginx/html/index.php <<'PHP'
<?php require '/etc/eventapp/db.php';
$m = new mysqli($DB_HOST,$DB_USER,$DB_PASS,$DB_NAME);
if (!empty($_POST['name'])) {
  $s = $m->prepare("INSERT INTO signups(name, created_by) VALUES(?,?)");
  $s->bind_param('ss', $_POST['name'], $IID); $s->execute();
}
$cnt = $m->query("SELECT COUNT(*) c FROM signups")->fetch_assoc()['c'];
?>
<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>이벤트 신청</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:grid;place-items:center;height:100vh}
.c{background:#1e293b;padding:2rem 3rem;border-radius:12px;border-left:6px solid #ff9900}
h1{color:#ff9900;margin:0 0 1rem}input,button{padding:.5rem;font-size:1rem}
small{color:#94a3b8}</style></head><body><div class="c">
<h1>이벤트 신청</h1>
<form method="post"><input name="name" placeholder="이름" required><button>신청</button></form>
<p>총 신청 <b><?=$cnt?></b>건</p>
<small>served by <?=$IID?> / <?=$AZ?></small>
</div></body></html>
PHP

# 헬스 체크 (DB 의존 없이 가볍게)
mkdir -p /usr/share/nginx/html/health
echo "OK" > /usr/share/nginx/html/health/index.html

# nginx + php-fpm
sed -i 's|index  index.html index.htm;|index index.php index.html;|' /etc/nginx/nginx.conf
cat > /etc/nginx/conf.d/php.conf <<'CONF'
server {
  listen 80 default_server;
  root /usr/share/nginx/html;
  index index.php index.html;
  location ~ \.php$ {
    fastcgi_pass unix:/run/php-fpm/www.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
  }
}
CONF
rm -f /etc/nginx/conf.d/default.conf
systemctl enable --now php-fpm nginx

echo "app bootstrap 완료: $(date)"
EOF
```

**시작 템플릿 새 버전**

```bash
$ LT_ID=$(aws ec2 describe-launch-templates --launch-template-names course-web-template \
    --query 'LaunchTemplates[0].LaunchTemplateId' --output text)
$ B64=$(base64 -w 0 app-user-data.sh)

$ aws ec2 create-launch-template-version --launch-template-id $LT_ID \
    --source-version '$Latest' --version-description "midterm event app" \
    --launch-template-data "{\"UserData\":\"$B64\",\"SecurityGroupIds\":[\"$SG_APP\"]}" \
    --query 'LaunchTemplateVersion.VersionNumber' --output text
5
$ aws ec2 modify-launch-template --launch-template-id $LT_ID --default-version 5
```

> ⚠️ **역할에 `rds:DescribeDBInstances` 권한**이 필요합니다(엔드포인트 조회). 없으면 추가하세요.
> ```bash
> aws iam attach-role-policy --role-name EC2-Course-Role \
>   --policy-arn arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess
> ```

**DB가 준비됐는지 확인 후 ASG 생성**

```bash
$ aws rds wait db-instance-available --db-instance-identifier midterm-mysql
```

### Step 4. 트래픽 계층 — ALB + HTTPS (20분)

```bash
# 대상 그룹
$ TG_ARN=$(aws elbv2 create-target-group --name midterm-tg \
    --protocol HTTP --port 80 --vpc-id $VPC_ID --target-type instance \
    --health-check-path /health/ --health-check-interval-seconds 10 \
    --healthy-threshold-count 2 --unhealthy-threshold-count 2 \
    --query 'TargetGroups[0].TargetGroupArn' --output text)
$ aws elbv2 modify-target-group-attributes --target-group-arn $TG_ARN \
    --attributes Key=deregistration_delay.timeout_seconds,Value=30

# ALB
$ ALB_ARN=$(aws elbv2 create-load-balancer --name midterm-alb \
    --type application --scheme internet-facing \
    --subnets $PUB_A $PUB_C --security-groups $SG_WEB \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)
$ aws elbv2 wait load-balancer-available --load-balancer-arns $ALB_ARN

# HTTPS 리스너 (12강 인증서 재사용)
$ CERT_ARN=$(aws acm list-certificates --region ap-northeast-2 \
    --query 'CertificateSummaryList[0].CertificateArn' --output text)
$ aws elbv2 create-listener --load-balancer-arn $ALB_ARN \
    --protocol HTTPS --port 443 --certificates CertificateArn=$CERT_ARN \
    --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN

# HTTP → HTTPS 리다이렉트
$ aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 \
    --default-actions '[{"Type":"redirect","RedirectConfig":{"Protocol":"HTTPS","Port":"443","StatusCode":"HTTP_301"}}]'

# 보안 그룹
$ MY_IP=$(curl -s https://checkip.amazonaws.com)
$ aws ec2 authorize-security-group-ingress --group-id $SG_WEB --protocol tcp --port 80 --cidr ${MY_IP}/32
$ aws ec2 authorize-security-group-ingress --group-id $SG_WEB --protocol tcp --port 443 --cidr ${MY_IP}/32
```

**ASG 생성 + 대상 그룹 연결**

```bash
$ aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name midterm-asg \
    --launch-template "LaunchTemplateId=$LT_ID,Version=\$Default" \
    --min-size 2 --max-size 4 --desired-capacity 2 \
    --vpc-zone-identifier "$APP_A,$APP_C" \
    --target-group-arns $TG_ARN \
    --health-check-type ELB --health-check-grace-period 300 \
    --tags "Key=Name,Value=midterm-web,PropagateAtLaunch=true" \
           "Key=Project,Value=aws-course,PropagateAtLaunch=true"

$ aws autoscaling put-scaling-policy --auto-scaling-group-name midterm-asg \
    --policy-name cpu50 --policy-type TargetTrackingScaling \
    --estimated-instance-warmup 300 \
    --target-tracking-configuration \
      '{"TargetValue":50.0,"PredefinedMetricSpecification":{"PredefinedMetricType":"ASGAverageCPUUtilization"}}'
```

**Route 53 Alias**

```bash
$ ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)
$ ALB_ZONE=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].CanonicalHostedZoneId' --output text)
$ HZ_ID=$(aws route53 list-hosted-zones --query 'HostedZones[0].Id' --output text | cut -d/ -f3)
$ DOMAIN=$(aws route53 get-hosted-zone --id $HZ_ID --query 'HostedZone.Name' --output text | sed 's/\.$//')

$ cat > alias.json <<EOF
{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{
  "Name":"app.$DOMAIN","Type":"A",
  "AliasTarget":{"HostedZoneId":"$ALB_ZONE","DNSName":"$ALB_DNS","EvaluateTargetHealth":true}}}]}
EOF
$ aws route53 change-resource-record-sets --hosted-zone-id $HZ_ID --change-batch file://alias.json
```

**동작 확인**

```bash
$ curl -s https://app.$DOMAIN/ | grep -E '총 신청|served by'
<p>총 신청 <b>0</b>건</p>
<small>served by i-0a1b2c3d4e5f60718 / ap-northeast-2a</small>
```

### Step 5. 정적 계층 — S3 + CloudFront (15분)

```bash
$ CDN_BUCKET=midterm-static-$(date +%s)
$ aws s3api create-bucket --bucket $CDN_BUCKET --region ap-northeast-2 \
    --create-bucket-configuration LocationConstraint=ap-northeast-2

$ echo '<h1>Event assets</h1>' > banner.html
$ aws s3 cp banner.html s3://$CDN_BUCKET/assets/banner.v1.html

# OAC + 배포 (14강과 동일 절차)
$ OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
      'Name=midterm-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3' \
    --query 'OriginAccessControl.Id' --output text)
# ... dist-config.json 작성 후 create-distribution (14강 Step 4 참고)
```

> ⏱ CloudFront 배포에 5~15분이 걸립니다. **Step 6 검증을 먼저 진행**하고 나중에 확인하세요.

### Step 6. 🔍 검증 3종 — 오늘의 핵심 (30분)

#### 검증 ① 서버 장애에도 서비스 지속

**터미널 A — 1초마다 요청**

```bash
$ while true; do
    printf "%s  " "$(date +%T)"
    curl -s -o /dev/null -w "%{http_code}\n" https://app.$DOMAIN/
    sleep 1
  done
```

**터미널 B — 인스턴스 강제 종료**

```bash
$ VICTIM=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names midterm-asg \
    --query 'AutoScalingGroups[0].Instances[0].InstanceId' --output text)
$ date && aws ec2 terminate-instances --instance-ids $VICTIM
Thu Aug 13 21:12:04 UTC 2026
```

**터미널 A 출력**

```
21:12:03  200
21:12:04  200      ← 인스턴스 종료 시점
21:12:05  200
21:12:06  200
...
21:15:40  200      ← 오류 0건
```

**ASG 복구 기록**

```bash
$ aws autoscaling describe-scaling-activities --auto-scaling-group-name midterm-asg \
    --max-items 2 --query 'Activities[*].[StartTime,StatusCode,Description]' --output table
```

> ✅ **증명 1** — 20~200건 요청 중 **비200 응답 0건**. 스크린샷과 함께 제출.

#### 검증 ② DB 장애 조치와 데이터 무결성

**Multi-AZ로 전환** (시연 직전에)

```bash
$ aws rds modify-db-instance --db-instance-identifier midterm-mysql \
    --multi-az --apply-immediately
$ aws rds wait db-instance-available --db-instance-identifier midterm-mysql
```

> 🔴 **여기서부터 요금이 2배입니다.** 시연이 끝나면 즉시 단일 AZ로 되돌리거나 삭제하세요.

**데이터 입력** — 웹 페이지에서 신청 5건을 넣습니다.

```bash
$ for N in kim lee park choi jung; do
    curl -s -X POST -d "name=$N" https://app.$DOMAIN/ > /dev/null
  done
$ curl -s https://app.$DOMAIN/ | grep '총 신청'
<p>총 신청 <b>5</b>건</p>
```

**장애 조치 실행**

```bash
$ date && aws rds reboot-db-instance --db-instance-identifier midterm-mysql --force-failover
Thu Aug 13 21:24:10 UTC 2026
```

**복구 후 데이터 확인**

```bash
$ sleep 90
$ curl -s https://app.$DOMAIN/ | grep '총 신청'
<p>총 신청 <b>5</b>건</p>        ← 그대로!

$ aws rds describe-events --source-identifier midterm-mysql --source-type db-instance \
    --duration 20 --query 'Events[*].[Date,Message]' --output table
--------------------------------------------------------------------------
|  2026-08-13T21:24:12Z  |  Multi-AZ instance failover started            |
|  2026-08-13T21:25:06Z  |  Multi-AZ instance failover completed          |
--------------------------------------------------------------------------
```

> ✅ **증명 2** — 다운타임 약 54초, **데이터 손실 0건**, 엔드포인트 불변.

#### 검증 ③ 부하 시 자동 확장

```bash
$ for I in $(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names midterm-asg \
      --query 'AutoScalingGroups[0].Instances[*].InstanceId' --output text); do
    aws ec2 modify-instance-credit-specification \
      --instance-credit-specification "InstanceId=$I,CpuCredits=standard"
    aws ssm send-command --instance-ids $I --document-name "AWS-RunShellScript" \
      --parameters 'commands=["nohup timeout 600 bash -c \"while :; do :; done\" &","nohup timeout 600 bash -c \"while :; do :; done\" &"]' \
      --query 'Command.CommandId' --output text
  done
```

**8~10분간 관찰**

```bash
$ aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization \
    --dimensions Name=AutoScalingGroupName,Value=midterm-asg \
    --start-time $(date -u -d '20 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 --statistics Average \
    --query 'sort_by(Datapoints,&Timestamp)[*].[Timestamp,Average]' --output table

$ aws autoscaling describe-scaling-activities --auto-scaling-group-name midterm-asg \
    --max-items 3 --query 'Activities[*].[StartTime,Description]' --output table
------------------------------------------------------------------------
|  2026-08-13T21:42:11Z  |  Launching a new EC2 instance: i-0e5f...     |
------------------------------------------------------------------------
```

> ✅ **증명 3** — CPU 그래프와 인스턴스 증가 기록.
> 🔴 **최대 용량 4를 넘지 않는지** 확인하고, 실습 후 부하가 멈췄는지(10분 뒤 자동 종료) 확인하세요.

### Step 7. 비용 산정 (15분)

**24시간 운영 기준 월 비용을 계산합니다.**

| 구성 요소 | 사양 | 시간당 | 월(730h) |
|---|---|---|---|
| ALB | 1대 | $0.0225 + LCU | **$16.4 +** |
| EC2 | t3.micro × 2 (평균) | $0.026 | **$19.0** |
| EBS | gp3 8GB × 2 | — | $1.4 |
| **NAT Gateway** | 1대 | $0.059 | **$43.1** |
| 탄력적 IP | 1개 | $0.005 | $3.6 |
| **RDS Multi-AZ** | db.t3.micro | $0.052 | **$38.0** |
| RDS 스토리지 | gp3 20GB | — | $2.9 |
| Route 53 | 호스팅 영역 1 | — | $0.5 |
| Secrets Manager | 비밀 1 | — | $0.4 |
| S3 + CloudFront | 소량 | — | ~$0.1 |
| **합계** | | | **약 $125 / 월** |

**30% 절감안 3가지** — 근거와 트레이드오프를 함께 씁니다.

| # | 방안 | 절감액 | 트레이드오프 |
|---|---|---|---|
| 1 | **NAT Gateway → VPC 엔드포인트** (S3·SSM) | **약 $43** | 일반 인터넷 접근 불가 → 골든 AMI 필요 |
| 2 | **EC2를 Savings Plans 1년** 약정 | 약 $7 (약 40%) | 1년 약정 |
| 3 | **RDS Multi-AZ → 단일 AZ** (개발 환경) | 약 $19 | 🔴 가용성 저하 — **운영에서는 부적절** |
| 4 | **Graviton(t4g) 전환** | 약 $4 (약 20%) | ARM AMI 필요 |
| 5 | 야간 자동 축소(ASG 0 / RDS 중지) | 약 $25 | 비운영 환경만 |

> 💡 **가장 큰 절감은 1번입니다.** 이 아키텍처에서 **NAT가 ALB보다 비쌉니다.**
> 💡 **Pricing Calculator로 견적 링크를 만들어** 제출하면 더 좋습니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 실습(6h) | 방치 시 월 |
|---|---|---|---|
| ALB | ❌ | 약 $0.14 | $16.4 |
| EC2 × 2~4 | ✅ 750h 합산 | $0~0.1 | $19~37 |
| NAT Gateway | ❌ | 약 $0.36 | **$43** |
| RDS 단일 AZ | ✅ 750h | $0 | $19 |
| **RDS Multi-AZ(시연 1h)** | ❌ | 약 $0.05 | $38 |
| Secrets Manager | ❌ | 약 $0.01 | $0.4 |
| CloudFront/S3/Route 53 | ✅/부분 | ~$0.02 | $0.6 |
| **합계** | | **약 $0.6** | **약 $125** |

### 🧹 리소스 정리 체크리스트

**삭제 순서가 중요합니다.**

```bash
# 1) ASG (인스턴스 함께 종료)
$ aws autoscaling delete-auto-scaling-group --auto-scaling-group-name midterm-asg --force-delete

# 2) ALB → 대상 그룹
$ aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
$ sleep 30
$ aws elbv2 delete-target-group --target-group-arn $TG_ARN

# 3) RDS (최종 스냅샷 없이)
$ aws rds delete-db-instance --db-instance-identifier midterm-mysql \
    --skip-final-snapshot --delete-automated-backups
$ aws rds wait db-instance-deleted --db-instance-identifier midterm-mysql
$ aws rds delete-db-subnet-group --db-subnet-group-name course-db-subnet-group

# 4) Secrets Manager
$ aws secretsmanager delete-secret --secret-id course/midterm/db --force-delete-without-recovery

# 5) CloudFront (비활성화 → 삭제, 시간 소요) + S3
# 6) NAT + EIP
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 7) Route 53 Alias 레코드 삭제 (호스팅 영역은 유지)
# 8) VPC 정리
# 9) IAM 인라인 정책
$ aws iam delete-role-policy --role-name EC2-Course-Role --policy-name read-midterm-secret
```

**최종 확인 — 7개 명령 모두 빈 출력**

```bash
$ aws elbv2 describe-load-balancers --query 'LoadBalancers[*].LoadBalancerName' --output text
$ aws autoscaling describe-auto-scaling-groups --query 'AutoScalingGroups[*].AutoScalingGroupName' --output text
$ aws rds describe-db-instances --query 'DBInstances[*].DBInstanceIdentifier' --output text
$ aws rds describe-db-snapshots --snapshot-type manual --query 'DBSnapshots[*].DBSnapshotIdentifier' --output text
$ aws ec2 describe-nat-gateways --filter "Name=state,Values=available,pending" --query 'NatGateways[*].NatGatewayId' --output text
$ aws ec2 describe-instances --filters "Name=instance-state-name,Values=running,stopped" --query 'Reservations[*].Instances[*].InstanceId' --output text
$ aws secretsmanager list-secrets --query 'SecretList[*].Name' --output text
```

- [ ] ASG · ALB · 대상 그룹 삭제
- [ ] 🔴 **RDS 삭제 (Multi-AZ 상태로 방치 금지)** · 스냅샷 0개
- [ ] Secrets Manager 강제 삭제
- [ ] CloudFront 비활성화 → 삭제 · S3 버킷 삭제
- [ ] NAT Gateway 삭제 + EIP 반환
- [ ] VPC 삭제 · IAM 인라인 정책 삭제
- [ ] ⭐ 호스팅 영역·ACM 인증서·시작 템플릿은 **유지**
- [ ] 다음 날 Cost Explorer에서 **일 비용 $0.1 미만** 확인

---

## ⑤ 자주 하는 실수

### 인스턴스가 계속 unhealthy 다 (프로젝트 최다 문제)

**증상** — 대상 그룹에 등록됐다 빠졌다를 반복하고, ASG가 인스턴스를 계속 교체합니다.

**진단 순서**

```bash
# ① 대상 그룹 상태와 이유
$ aws elbv2 describe-target-health --target-group-arn $TG_ARN \
    --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Description]' --output json

# ② 인스턴스 안에서 직접 확인
$ aws ssm start-session --target i-xxx
sh-5.2$ curl -s -o /dev/null -w "%{http_code}\n" localhost/health/
sh-5.2$ sudo tail -40 /var/log/cloud-init-output.log
```

| 원인 | 해결 |
|---|---|
| 사용자 데이터가 **중간에 실패** | `cloud-init-output.log` 의 마지막 명령 확인 |
| **Secrets Manager 권한 없음** | 역할에 `secretsmanager:GetSecretValue` |
| **`rds:DescribeDBInstances` 권한 없음** | `AmazonRDSReadOnlyAccess` 연결 |
| **DB가 아직 생성 중** | `wait db-instance-available` 후 ASG 생성 |
| 유예 기간이 짧다 | `--health-check-grace-period 300` |

> 💡 **`set -euxo pipefail` 덕분에 로그의 마지막 `+` 줄이 실패 지점**입니다. 거기부터 보세요.

### DB 연결이 안 된다

```
mysqli::__construct(): (HY000/2002): Connection timed out
```

**확인 순서**

```bash
# DB 보안 그룹이 앱 SG를 소스로 3306을 허용하나
$ aws ec2 describe-security-groups --group-ids $SG_DB \
    --query 'SecurityGroups[0].IpPermissions'

# 같은 VPC인가
$ aws rds describe-db-instances --db-instance-identifier midterm-mysql \
    --query 'DBInstances[0].DBSubnetGroup.VpcId'
```

> ⚠️ **VPC를 새로 만들면 보안 그룹 ID가 바뀝니다.** RDS의 보안 그룹도 갱신해야 합니다.
> ```bash
> aws rds modify-db-instance --db-instance-identifier midterm-mysql \
>   --vpc-security-group-ids $SG_DB --apply-immediately
> ```

### 여러 인스턴스가 동시에 스키마를 만들다 충돌한다

**증상** — 일부 인스턴스의 사용자 데이터가 실패합니다.
**원인** — ASG가 인스턴스 2대를 **동시에** 띄우고 둘 다 `CREATE TABLE` 을 실행합니다.
**해결** — `IF NOT EXISTS` 와 `|| true` 로 실패해도 부팅이 계속되게 합니다(위 스크립트에 반영됨).

> 💡 **실무 정답** — 스키마 마이그레이션은 **애플리케이션 부팅 시가 아니라 배포 파이프라인의 별도 단계**에서 합니다. [24강 CI/CD](../03-serverless-automation/lesson-24.md)에서 다룹니다.

### HTTPS가 안 되고 인증서 오류가 난다

| 증상 | 원인 | 해결 |
|---|---|---|
| `ERR_CERT_COMMON_NAME_INVALID` | 인증서 도메인 불일치 | 와일드카드(`*.도메인`) 포함해 재발급 |
| 443 접속 자체가 안 됨 | 보안 그룹에 443 없음 | `authorize-security-group-ingress --port 443` |
| `ERR_TOO_MANY_REDIRECTS` | 앱도 리다이렉트 중 | `X-Forwarded-Proto` 확인 ([12강](lesson-12.md)) |

### 부하 테스트로 비용이 튄다

**원인** — 최대 용량이 크거나, 부하가 안 멈추거나, Multi-AZ를 켜 둔 채 방치했습니다.
**예방 3가지**

```bash
# ① 최대 용량 확인
$ aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names midterm-asg \
    --query 'AutoScalingGroups[0].[MinSize,MaxSize,DesiredCapacity]' --output text
2   4   2

# ② 부하에 자동 종료 시간 지정 (timeout 600)
# ③ 시연 후 Multi-AZ 즉시 해제
$ aws rds modify-db-instance --db-instance-identifier midterm-mysql --no-multi-az --apply-immediately
```

### 정리했는데 비용이 남아 있다

**흔한 잔존 리소스 6가지**

| 리소스 | 확인 명령 |
|---|---|
| RDS 최종 스냅샷 | `describe-db-snapshots --snapshot-type manual` |
| Secrets Manager (복구 대기 중) | `list-secrets` |
| NAT Gateway | `describe-nat-gateways` |
| 미사용 EIP | `describe-addresses` |
| CloudFront 배포 | `list-distributions` |
| ALB | `describe-load-balancers` |

> 💡 **태그로 한 번에 확인**하는 방법
> ```bash
> aws resourcegroupstaggingapi get-resources \
>   --tag-filters Key=Project,Values=aws-course \
>   --query 'ResourceTagMappingList[*].ResourceARN' --output table
> ```

---

## ⑥ 확인 문제

**1.** 이 아키텍처에서 **가장 먼저 죽는 지점(단일 장애점)** 은 어디이고, 어떻게 개선하겠습니까?

<details>
<summary>답 보기</summary>

**NAT Gateway입니다.** 하나의 AZ(`2a`)에만 있습니다.

```
 AZ-2a 장애 시:
   ALB      → 2c 노드가 처리 ✅
   ASG      → 2c 인스턴스가 처리 ✅
   RDS      → 2c 대기가 승격 ✅
   NAT      → 🔴 사라짐 → 2c의 인스턴스도 인터넷에 못 나감
```

앱 서브넷 두 곳 모두 **`2a`의 NAT를 바라보는 라우팅**이라, AZ-2a가 죽으면 **양쪽 AZ의 인스턴스가 모두** 패키지 설치·외부 API 호출을 못 합니다. 새 인스턴스는 부팅에 실패해 **자동 확장도 멈춥니다.**

**개선 3가지**

| 방법 | 비용 | 효과 |
|---|---|---|
| **AZ마다 NAT 하나씩** (라우팅 테이블 분리) | 월 +$43 | 표준 해법 |
| **VPC 엔드포인트로 NAT 제거** | **월 −$43** | 인터넷 접근이 필요 없다면 최선 |
| 골든 AMI + 엔드포인트 | 절감 | 부팅 시 외부 다운로드 불필요 |

> 💡 **비용과 가용성이 정면으로 충돌하는 대표 사례**입니다. 최종 프로젝트에서는 이 결정을 **근거와 함께 문서화**해야 합니다.

**그다음 단일 장애점** — 호스팅 영역/도메인(Route 53은 SLA 100%), ACM 인증서 만료(자동 갱신 실패 시), 그리고 **리전 전체 장애**(→ [26강 DR](../04-final-project/lesson-26.md)).
</details>

**2.** "서버가 죽어도 서비스가 지속된다"를 어떻게 **증명**하겠습니까? "인스턴스가 2대다"는 왜 증명이 아닌가요?

<details>
<summary>답 보기</summary>

**증명 = 장애를 실제로 일으키고, 그동안 사용자 관점의 응답을 기록하는 것**입니다.

**증명 절차**

```bash
# ① 사용자 관점 측정을 먼저 시작
$ while true; do
    printf "%s  " "$(date +%T)"
    curl -s -o /dev/null -w "%{http_code}\n" https://app.$DOMAIN/
    sleep 1
  done > result.log &

# ② 장애 주입
$ date && aws ec2 terminate-instances --instance-ids $VICTIM

# ③ 결과 집계
$ grep -c " 200$" result.log      # 200 응답 수
$ grep -vc " 200$" result.log     # 비200 응답 수  ← 0이어야 함
```

**"2대다"가 증명이 아닌 이유**

| 주장 | 실제로 확인되지 않은 것 |
|---|---|
| 인스턴스 2대 | 같은 AZ일 수도 있음 |
| ALB에 붙어 있음 | 헬스 체크가 실제로 제외해 주는지 |
| ASG가 있음 | 유예 기간·정책이 올바른지 |
| — | 세션·상태가 인스턴스에 묶여 있지는 않은지 |

**함께 제출할 증거 3종**
1. 요청 로그 (비200 = 0)
2. `describe-scaling-activities` 의 종료·시작 기록
3. 대상 그룹 상태 변화 (`healthy` → `draining` → 새 대상 `healthy`)

> **원칙** — *"장애를 겪어 보지 않은 고가용성은 가설이다."*
> 이 사고방식이 [30강 게임데이](../04-final-project/lesson-30.md)로 이어집니다.
</details>

**3.** 이 서비스의 월 비용을 **30% 줄이라**는 요구를 받았습니다. 무엇부터 보고, 각 방안의 트레이드오프는 무엇인가요?

<details>
<summary>답 보기</summary>

**먼저 비용 구성을 크기순으로 정렬합니다.** (월 약 $125 기준)

| 순위 | 항목 | 월 | 비중 |
|---|---|---|---|
| 1 | **NAT Gateway** | $43 | 34% |
| 2 | **RDS Multi-AZ** | $38 | 30% |
| 3 | **ALB** | $16 | 13% |
| 4 | EC2 × 2 | $19 | 15% |
| 5 | 기타 | $9 | 8% |

**절감안과 트레이드오프**

| # | 방안 | 절감 | 트레이드오프 | 권장 |
|---|---|---|---|---|
| 1 | **NAT → VPC 엔드포인트** | **$43 (34%)** | 일반 인터넷 접근 불가 → **골든 AMI 필요** | ⭐ 최우선 |
| 2 | EC2 **Savings Plans 1년** | $7 | 1년 약정 | ⭐ 안전 |
| 3 | **Graviton(t4g)** 전환 | $4 | ARM 이미지 필요 | ⭐ |
| 4 | 야간 자동 축소 | $25 | 비운영 환경만 | 개발 환경 ⭐ |
| 5 | RDS 단일 AZ | $19 | 🔴 **가용성 포기** | ❌ 운영 부적합 |
| 6 | ALB 제거(EC2 직접 노출) | $16 | 🔴 **가용성·보안 포기** | ❌ |

**1번만으로 34% 달성**됩니다. 요구를 충족하면서 **가용성을 전혀 해치지 않습니다.**

**하면 안 되는 절감**
- 5·6번처럼 **요구사항(가용성)을 깨는 방식**. 비용 목표를 위해 요구사항을 버리는 것은 절감이 아니라 **범위 축소**이며, 반드시 **의사결정자에게 알리고 승인**을 받아야 합니다.

> 💡 **비용 최적화의 첫 단계는 언제나 "안 쓰는 것 끄기"와 "과대 사양 줄이기"** 입니다.
> 그다음이 구매 옵션(Savings Plans), 마지막이 아키텍처 변경입니다. [31강](../04-final-project/lesson-31.md)에서 체계적으로 다룹니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 요구사항 번역 | 문장 → **구성 요소 결정표**(대안 + 근거) |
| 구축 순서 | 네트워크 → **데이터(먼저 시작)** → 컴퓨팅 → 트래픽 → 정적 |
| 고가용성 | 2 AZ × (ALB + ASG + RDS Multi-AZ) |
| 자동 복구 | ASG + **ELB 헬스 체크** |
| 데이터 보호 | Multi-AZ(동기) + 자동 백업(PITR) |
| 보안 | 프라이빗 배치 + **SG 참조 체인** + HTTPS + Secrets Manager |
| **증명** | 장애를 일으키고 **사용자 관점 응답을 기록** |
| 비용 | 이 구조에서 **NAT가 ALB보다 비싸다** |

**한 장 요약**

```
  ① 설계(결정표) → ② 구축(순서) → ③ 증명(3종) → ④ 비용 산정 → ⑤ 정리
                                      │
                    서버 죽여도 200 · DB 전환해도 데이터 동일 · 부하 시 확장
```

**오늘 반드시 기억할 한 가지**
> **"구성했습니다"가 아니라 "깨뜨려 봤고 견뎠습니다"** 가 아키텍처의 증명입니다.

---

## 📦 중간 프로젝트 제출물

| # | 산출물 | 형식 |
|---|---|---|
| 1 | **아키텍처 다이어그램** (모든 구성 요소·AZ·서브넷·보안 그룹 흐름) | 이미지 |
| 2 | **구성 요소 결정표** (요구 6개 각각에 선택·대안·근거) | 문서 |
| 3 | **구축 절차 문서** (순서와 이유, 실제 소요 시간) | 문서 |
| 4 | **검증 기록 ①** 서버 강제 종료 중 200 응답 로그 + ASG 활동 기록 | 로그/캡처 |
| 5 | **검증 기록 ②** RDS 장애 조치 전후 데이터 일치 + 이벤트 로그 | 로그/캡처 |
| 6 | **검증 기록 ③** 부하 시 CPU 그래프 + 인스턴스 증가 기록 | 캡처 |
| 7 | **월간 비용 산정서** + 30% 절감안 3가지(트레이드오프 포함) | 표 |
| 8 | **보안 점검표** (퍼블릭 노출 리소스 목록·인스턴스 인바운드·DB 접근 경로) | 문서 |
| 9 | **정리 완료 증빙** (7개 확인 명령 빈 출력) | 로그 |
| 10 | **3분 시연** (라이브 또는 녹화) | 발표 |

### 평가 루브릭 (100점)

| 항목 | 배점 | 기준 |
|---|---|---|
| 네트워크 설계 | 15 | 2AZ 분리 · 퍼블릭/프라이빗 분리 · 라우팅 정확성 |
| 고가용성 | 20 | ASG 2AZ · ELB 헬스 체크 · RDS Multi-AZ · **장애 시연 성공** |
| 확장성 | 10 | 조정 정책 동작 · 스케일 아웃 증빙 |
| 보안 | 15 | 인스턴스/DB 비공개 · **SG 참조 방식** · HTTPS · 자격 증명 관리 |
| 데이터 | 10 | 백업 설정 · PITR 이해 · 암호화 |
| 정적 자산·CDN | 10 | S3 비공개 유지 + CloudFront OAC |
| 비용 산정 | 10 | 산정 정확성 · 절감안의 타당성과 트레이드오프 |
| 문서·시연 | 10 | 다이어그램 정확성 · 구축 순서 설명 · 3분 시연 |
| **합계** | **100** | **70점 이상 통과** |

**감점** — 리소스 미정리 −10 · 인스턴스나 DB가 인터넷에 직접 노출 −15 · 저장소/문서에 자격 증명 노출 −20

---

## 🎓 대단원 02 완료 체크리스트

- [ ] 서버 구성을 사용자 데이터/AMI로 재현할 수 있다
- [ ] Auto Scaling으로 자동 확장·자동 복구되는 구조를 만들 수 있다
- [ ] ALB·Route 53·ACM으로 HTTPS 서비스를 제공할 수 있다
- [ ] S3·EBS·EFS·CloudFront를 용도에 맞게 선택하고 근거를 댈 수 있다
- [ ] RDS를 프라이빗에 이중화 배치하고 백업·복구·장애 조치를 수행할 수 있다
- [ ] 3계층 고가용성 서비스를 혼자 구축하고 **비용을 산정**할 수 있다
- [ ] 고가용성을 **증명**할 수 있다

**다음 대단원 예고** — [17강](../03-serverless-automation/lesson-17.md)부터는 **"서버를 관리하지 않는 방법"** 을 배웁니다.
오늘 만든 것과 같은 서비스를 Lambda·API Gateway·컨테이너로 다시 만들어 보고, 마지막에는 **이 전부를 코드로 재현**합니다.

---

[← 이전 15강](lesson-15.md) · [목차](README.md) · [다음 → 17강 DynamoDB와 ElastiCache](../03-serverless-automation/lesson-17.md)
