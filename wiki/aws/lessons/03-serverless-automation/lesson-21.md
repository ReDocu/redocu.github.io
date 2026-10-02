# 21강 · 컨테이너 · ECR · ECS Fargate

> **AWS 학습 매뉴얼** · 🔴 대단원 03 · **21강 / 총 32강**
> [← 이전 20강](lesson-20.md) · [목차](README.md) · [다음 → 22강 CloudWatch · CloudTrail · Systems Manager](lesson-22.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 컨테이너가 AMI 방식과 **무엇이 다르고 왜 표준이 됐는지** 설명할 수 있다.
- 애플리케이션을 이미지로 만들어 **ECR에 푸시**할 수 있다.
- **태스크 역할과 실행 역할**을 구분하고 태스크 정의를 작성할 수 있다.
- ALB 뒤에서 도는 **ECS Fargate 서비스**를 만들고 자동 복구·롤링 배포를 확인할 수 있다.
- EC2 · Fargate · Lambda 중 **실행 방식을 근거와 함께 선택**할 수 있다.

---

## ② 왜 필요한가

[09강](../02-compute-data/lesson-09.md)에서 골든 AMI를 배웠습니다. 잘 동작하지만 불편함이 남았습니다.

| AMI 방식의 한계 | 결과 |
|---|---|
| 이미지 하나가 **수 GB** | 굽는 데 5분+, 리전마다 복사 |
| **EC2 전용** | 내 노트북에서 같은 환경을 재현 못 함 |
| OS 전체가 이미지에 포함 | 앱 한 줄 고쳐도 OS째 다시 굽기 |
| 서버 1대 = 앱 1개가 자연스러움 | 밀도(집적도)가 낮음 |

그리고 개발 현장의 고전적인 대화가 있습니다.

> "제 PC에서는 되는데요?" — "서버에는 Python 3.9가 깔려 있는데요?"

**컨테이너는 "앱 + 실행 환경"을 하나의 상자로 포장**합니다.

```
 [AMI]                          [컨테이너 이미지]
  OS 전체 + 에이전트 + 앱          앱 + 필요한 라이브러리만
  수 GB · EC2에서만               수십~수백 MB · 노트북/EC2/Fargate 어디서나
  굽기 5분+                      빌드 수 초~수십 초
```

노트북에서 빌드한 **바로 그 이미지**가 테스트를 거쳐 운영까지 갑니다. "환경이 달라서"라는 말이 사라집니다.

남는 질문은 하나 — **누가 이 컨테이너들을 어디에 몇 개 띄우고, 죽으면 다시 살리나?** 그것이 오케스트레이션(ECS)의 일이고, **서버 관리까지 지우는 것**이 Fargate입니다. [16강](../02-compute-data/lesson-16.md)에서 EC2로 만들던 앱 계층이 오늘 컨테이너로 바뀌고, [24강 CI/CD](lesson-24.md)에서 이 이미지가 파이프라인의 배포 단위가 됩니다.

---

## ③ 개념 설명

### 이미지 · 컨테이너 · 레지스트리

```
 Dockerfile ──build──▶ 이미지(불변 템플릿) ──run──▶ 컨테이너(실행 인스턴스)
                          │ push
                          ▼
                     레지스트리(ECR) ◀──pull── 어느 서버든
```

| 개념 | 비유 ([09강](../02-compute-data/lesson-09.md)과 대응) |
|---|---|
| Dockerfile | 사용자 데이터 스크립트 |
| 이미지 | 골든 AMI (단, 가볍고 어디서나) |
| 컨테이너 | 실행 중인 인스턴스 |
| **ECR** | 프라이빗 이미지 저장소 (AMI 목록에 해당) |

**Dockerfile 작성 원칙 3가지**

| 원칙 | 이유 |
|---|---|
| 작게 (slim 베이스, 필요한 것만) | 풀 속도 = 배포·복구 속도 |
| **루트로 실행하지 않기** (`USER`) | 컨테이너 탈출 시 피해 축소 |
| 자격 증명을 굽지 않기 | 이미지는 복제됩니다 — [09강](../02-compute-data/lesson-09.md) AMI와 동일 원칙 |

### ECS 구성 요소 — 4단 구조

```
 클러스터 (course-cluster)                ← 논리적 울타리
   └─ 서비스 (course-svc)                 ← "태스크 2개를 유지하라" + ALB 연결
        ├─ 태스크 (실행 중인 컨테이너 묶음)  ← ASG의 인스턴스에 해당
        └─ 태스크
             ▲
   태스크 정의 (course-app:3)             ← 시작 템플릿에 해당 (이미지·CPU·메모리·역할·로그)
```

| ECS | [10강](../02-compute-data/lesson-10.md) ASG 대응물 | 역할 |
|---|---|---|
| 태스크 정의 | 시작 템플릿 | 무엇을 어떻게 띄울지 (버전 관리됨) |
| **서비스** | ASG | 원하는 개수 유지 · 자동 복구 · ALB 등록 |
| 태스크 | 인스턴스 | 실행 단위 |

### 태스크 역할 vs 실행 역할 ⭐ — 시험·실무 최다 혼동

| | **실행 역할 (Execution Role)** | **태스크 역할 (Task Role)** |
|---|---|---|
| 쓰는 주체 | **ECS 에이전트** (컨테이너 시작 전) | **컨테이너 안의 애플리케이션** |
| 하는 일 | ECR에서 이미지 풀 · CloudWatch에 로그 전송 · 시크릿 주입 | 앱이 S3·DynamoDB 등 AWS 호출 |
| 이게 없으면 | **태스크가 시작조차 못 함** (CannotPull...) | 앱 코드에서 AccessDenied |
| 관리형 정책 | `AmazonECSTaskExecutionRolePolicy` | 앱 필요에 맞게 최소 권한 |

> 🔑 **판별법** — 오류가 **시작 전**(이미지 풀·로그 설정)이면 실행 역할, **실행 중**(앱의 API 호출)이면 태스크 역할입니다. [03강](../01-cloud-foundation/lesson-03.md)의 "사람이 아니면 역할"이 컨테이너에서는 둘로 나뉜 것입니다.

### Fargate vs EC2 시작 유형

| | **Fargate** | EC2 시작 유형 |
|---|---|---|
| 서버 관리 | **없음** (태스크 단위) | 인스턴스 패치·용량 내 일 |
| 과금 | 태스크의 vCPU·메모리 × 시간 | 인스턴스 시간 |
| 밀도 최적화 | 불가 | 가능 (빈틈에 채워 넣기) |
| GPU·특수 요구 | 제한적 | 자유 |
| **프리 티어** | 🔴 **없음** | EC2 프리 티어 적용 |

### 실행 방식 선택 기준표 ⭐ (18강의 표 완성판)

| 방식 | 적합 | 부적합 | 비용 감각 |
|---|---|---|---|
| **Lambda** | 이벤트성 · 15분 미만 · 유휴 많음 | 상시 고부하 · 장시간 | 유휴 $0 |
| **ECS Fargate** | 상시 서비스 · 서버 관리 최소화 | 극단적 비용 최적화 · GPU | 태스크 시간당 (0.25vCPU+0.5GB ≈ 월 $9/태스크) |
| ECS on EC2 | 대규모 · 밀도 최적화 · GPU | 소규모 팀 | 인스턴스 시간당 |
| EC2 직접 | 레거시 · 특수 요구 | 자동화가 필요한 모든 것 | 인스턴스 시간당 |

> **한 줄 기준** — 이벤트성이면 Lambda, 상시면 Fargate, 대규모 최적화면 EC2 기반. EKS(쿠버네티스)는 그 생태계가 필요할 때([A2](../../curriculum/A2-next-steps.md)).

### ECR 비용과 수명 주기

| 항목 | 내용 |
|---|---|
| 저장 | GB당 월 $0.10 · 프리 티어 500MB(12개월) |
| 문제 | CI/CD가 돌면 **이미지가 무한히 쌓임** 🔴 |
| 해결 | **수명 주기 정책** — "최근 5개만 유지" 자동 삭제 |
| 스캔 | 푸시 시 취약점 기본 스캔 (무료) |

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.5 ~ 0.7** — Fargate(프리 티어 없음) + ALB + NAT가 함께 돕니다. **수업 내 정리 필수.**
> 🖥 **Docker Desktop이 필요합니다**(CloudShell에서는 빌드 불가). 설치가 막히면 EC2 한 대에서 빌드하는 우회로를 강사가 안내합니다.

### Step 1. 애플리케이션과 Dockerfile (20분)

태스크 메타데이터를 읽어 **자기 정보를 보여 주는** 앱입니다 — ALB 분산과 롤링 배포를 눈으로 확인하는 용도입니다.

```bash
$ mkdir -p container-lab && cd container-lab
$ cat > app.py <<'EOF'
import json, os, urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler

META = os.environ.get("ECS_CONTAINER_METADATA_URI_V4")  # Fargate가 주입

def task_info():
    if not META:
        return {"task": "local", "az": "local"}
    try:
        with urllib.request.urlopen(META + "/task", timeout=1) as r:
            t = json.load(r)
        return {"task": t["TaskARN"].split("/")[-1][:8],
                "az": t.get("AvailabilityZone", "?")}
    except Exception:
        return {"task": "unknown", "az": "?"}

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/health"):
            body = b"OK"
        else:
            body = json.dumps({
                "app": "course-container",
                "version": os.environ.get("APP_VERSION", "v1"),
                **task_info()
            }, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, fmt, *args):
        print(self.address_string(), self.path)

print("listening :8080")
HTTPServer(("", 8080), H).serve_forever()
EOF

$ cat > Dockerfile <<'EOF'
FROM public.ecr.aws/docker/library/python:3.12-slim
WORKDIR /app
COPY app.py .
ENV APP_VERSION=v1
EXPOSE 8080
USER nobody
CMD ["python", "-u", "app.py"]
EOF
```

| Dockerfile 줄 | 원칙 |
|---|---|
| `python:3.12-slim` | 작은 베이스 (~50MB) — 원칙 ① |
| `USER nobody` | 루트로 실행 안 함 — 원칙 ② |
| 자격 증명 없음 | 필요한 권한은 **태스크 역할**로 — 원칙 ③ |
| `-u` | 로그 버퍼링 해제 (CloudWatch에 즉시 표시) |

**로컬에서 빌드·실행**

```bash
$ docker build --platform linux/amd64 -t course-app:v1 .
[+] Building 8.4s ... => naming to docker.io/library/course-app:v1

$ docker run -d --rm -p 8080:8080 --name test course-app:v1
$ curl -s localhost:8080 | jq .
{
  "app": "course-container",
  "version": "v1",
  "task": "local",
  "az": "local"
}
$ curl -s localhost:8080/health
OK
$ docker stop test
```

> ⚠️ **`--platform linux/amd64` 를 습관처럼 붙이세요.** Apple Silicon(M1~M4)에서 기본 빌드하면 ARM 이미지가 되고, x86 Fargate에서 `exec format error` 로 죽습니다. (⑤ 참고)

### Step 2. ECR에 푸시 (15분)

```bash
$ ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
$ ECR=$ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com

$ aws ecr create-repository --repository-name course-app \
    --image-scanning-configuration scanOnPush=true \
    --query 'repository.repositoryUri' --output text
123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/course-app

# 로그인 (12시간 유효)
$ aws ecr get-login-password | docker login --username AWS --password-stdin $ECR
Login Succeeded

$ docker tag course-app:v1 $ECR/course-app:v1
$ docker push $ECR/course-app:v1
The push refers to repository [...course-app]
v1: digest: sha256:a1b2c3... size: 1573
```

**스캔 결과와 수명 주기 정책**

```bash
$ aws ecr describe-image-scan-findings --repository-name course-app --image-id imageTag=v1 \
    --query 'imageScanFindings.findingSeverityCounts' 2>/dev/null
{ "LOW": 2 }

# 최근 5개만 유지 — CI/CD 시대의 필수 정리 장치
$ aws ecr put-lifecycle-policy --repository-name course-app \
    --lifecycle-policy-text '{
      "rules": [{
        "rulePriority": 1,
        "description": "keep last 5",
        "selection": {"tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 5},
        "action": {"type": "expire"}
      }]}'
```

### Step 3. 역할 2종과 태스크 정의 (20분)

**실행 역할** (ECS가 풀·로그에 사용)

```bash
$ cat > ecs-trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ecs-tasks.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

$ aws iam create-role --role-name course-ecs-exec-role \
    --assume-role-policy-document file://ecs-trust.json
$ aws iam attach-role-policy --role-name course-ecs-exec-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

**태스크 역할** (앱이 사용 — 오늘 앱은 AWS 호출이 없으므로 **빈 역할**로 구분만 명확히)

```bash
$ aws iam create-role --role-name course-ecs-task-role \
    --assume-role-policy-document file://ecs-trust.json
```

**클러스터·로그 그룹·태스크 정의**

```bash
$ aws ecs create-cluster --cluster-name course-cluster \
    --query 'cluster.clusterName' --output text
course-cluster

$ aws logs create-log-group --log-group-name /ecs/course-app
$ aws logs put-retention-policy --log-group-name /ecs/course-app --retention-in-days 7

$ cat > taskdef.json <<EOF
{
  "family": "course-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT:role/course-ecs-exec-role",
  "taskRoleArn": "arn:aws:iam::$ACCOUNT:role/course-ecs-task-role",
  "containerDefinitions": [{
    "name": "app",
    "image": "$ECR/course-app:v1",
    "essential": true,
    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/course-app",
        "awslogs-region": "ap-northeast-2",
        "awslogs-stream-prefix": "app"
      }
    }
  }]
}
EOF

$ aws ecs register-task-definition --cli-input-json file://taskdef.json \
    --query 'taskDefinition.[family,revision]' --output text
course-app    1
```

> 📌 `cpu 256 / memory 512` = **0.25 vCPU · 0.5GB** — Fargate 최소 조합. 시간당 약 $0.015/태스크입니다.

### Step 4. VPC · ALB · 서비스 생성 ⭐ (25분)

```bash
$ cd ~ && bash create-vpc.sh && source ~/course-vpc-env.sh

# NAT (프라이빗 태스크가 ECR에서 이미지를 당길 경로)  🔴 과금 시작
$ EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
$ NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_A --allocation-id $EIP_ALLOC \
    --query 'NatGateway.NatGatewayId' --output text)
$ aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
$ aws ec2 create-route --route-table-id $RTB_APP \
    --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID

# 앱 SG에 8080 허용 (소스 = ALB SG)
$ aws ec2 authorize-security-group-ingress --group-id $SG_APP \
    --protocol tcp --port 8080 --source-group $SG_WEB

# 대상 그룹 — target-type ip (Fargate 필수), 포트 8080
$ TG_ARN=$(aws elbv2 create-target-group --name course-ecs-tg \
    --protocol HTTP --port 8080 --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health --health-check-interval-seconds 10 \
    --healthy-threshold-count 2 --unhealthy-threshold-count 2 \
    --query 'TargetGroups[0].TargetGroupArn' --output text)
$ aws elbv2 modify-target-group-attributes --target-group-arn $TG_ARN \
    --attributes Key=deregistration_delay.timeout_seconds,Value=30

# ALB + 리스너
$ ALB_ARN=$(aws elbv2 create-load-balancer --name course-ecs-alb \
    --type application --scheme internet-facing \
    --subnets $PUB_A $PUB_C --security-groups $SG_WEB \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)
$ aws elbv2 wait load-balancer-available --load-balancer-arns $ALB_ARN
$ aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN > /dev/null
$ MY_IP=$(curl -s https://checkip.amazonaws.com)
$ aws ec2 authorize-security-group-ingress --group-id $SG_WEB \
    --protocol tcp --port 80 --cidr ${MY_IP}/32
```

**서비스 생성** — "태스크 2개를 프라이빗 서브넷 2AZ에 유지하라."

```bash
$ aws ecs create-service --cluster course-cluster \
    --service-name course-svc \
    --task-definition course-app:1 \
    --desired-count 2 --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$APP_A,$APP_C],securityGroups=[$SG_APP],assignPublicIp=DISABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=app,containerPort=8080" \
    --health-check-grace-period-seconds 60 \
    --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=100" \
    --query 'service.[serviceName,desiredCount]' --output text
course-svc    2

$ aws ecs wait services-stable --cluster course-cluster --services course-svc
```

> ⭐ **`deploymentCircuitBreaker`** — 새 버전이 계속 죽으면 배포를 **자동 중단하고 이전 버전으로 롤백**합니다. [24강](lesson-24.md) CI/CD의 안전장치가 됩니다.

**분산 확인**

```bash
$ ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)

$ for i in $(seq 1 8); do curl -s http://$ALB_DNS | jq -r '"\(.task)  \(.az)  \(.version)"'; done
2f8a1c3d  ap-northeast-2a  v1
9b4e7f21  ap-northeast-2c  v1
2f8a1c3d  ap-northeast-2a  v1
9b4e7f21  ap-northeast-2c  v1
...
```

> ✅ **두 태스크가 2AZ에 나뉘어** 트래픽을 번갈아 받습니다. [11강](../02-compute-data/lesson-11.md)의 EC2 자리에 컨테이너가 들어온 것뿐, 구조는 같습니다.

### Step 5. 🔍 자동 복구 — 태스크 죽이기 (10분)

```bash
$ VICTIM=$(aws ecs list-tasks --cluster course-cluster --service-name course-svc \
    --query 'taskArns[0]' --output text)
$ date && aws ecs stop-task --cluster course-cluster --task $VICTIM \
    --reason "lab: forced failure" > /dev/null
Thu Aug 13 15:02:10 UTC 2026

$ sleep 60 && aws ecs describe-services --cluster course-cluster --services course-svc \
    --query 'services[0].[runningCount,events[0].message]' --output text
2    (service course-svc) has reached a steady state.
```

**서비스 이벤트에서 전 과정 확인**

```bash
$ aws ecs describe-services --cluster course-cluster --services course-svc \
    --query 'services[0].events[0:4].message' --output json
[
  "(service course-svc) has reached a steady state.",
  "(service course-svc) registered 1 targets in (target-group ...)",
  "(service course-svc) has started 1 tasks: (task 5c6d7e8f...).",
  "(service course-svc) has begun draining connections on 1 tasks."
]
```

> ✅ **약 1분 만에 원상 복구.** [10강](../02-compute-data/lesson-10.md) ASG 실험과 같은 결론 — 서비스가 "원하는 개수"를 지키는 기계입니다. 단, 복구가 EC2(3~4분)보다 **빠릅니다**. 부팅할 OS가 없기 때문입니다.

### Step 6. v2 롤링 배포 (15분)

```bash
$ cd container-lab
$ sed -i 's/APP_VERSION=v1/APP_VERSION=v2/' Dockerfile
$ docker build --platform linux/amd64 -t course-app:v2 .
$ docker tag course-app:v2 $ECR/course-app:v2
$ docker push $ECR/course-app:v2

# 태스크 정의 리비전 2 (이미지 태그만 교체)
$ sed 's|course-app:v1|course-app:v2|' taskdef.json > taskdef-v2.json
$ aws ecs register-task-definition --cli-input-json file://taskdef-v2.json \
    --query 'taskDefinition.revision' --output text
2

# 롤링 시작
$ aws ecs update-service --cluster course-cluster --service course-svc \
    --task-definition course-app:2 > /dev/null
```

**교체되는 동안 버전 관찰**

```bash
$ for i in $(seq 1 30); do curl -s http://$ALB_DNS | jq -r .version; sleep 3; done | uniq -c
   7 v1
   9 v1        ← v2 태스크가 뜨고 헬스 체크 통과 대기
   6 v1
   4 v2        ← 섞이는 구간 (v1·v2 공존)
  ...
  10 v2        ← 전환 완료
```

```bash
$ for i in $(seq 1 20); do curl -s -o /dev/null -w "%{http_code} " http://$ALB_DNS; done; echo
200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200
```

> ✅ **오류 0건 무중단 교체.** `minimumHealthyPercent=100, maximumPercent=200` 이라 새 태스크가 정상 판정을 받은 뒤에야 옛 태스크가 빠집니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| **Fargate 0.25vCPU·0.5GB × 2태스크** | 🔴 **없음** | 약 $0.19 | 🔴 **약 $18~22** |
| **ALB** | ❌ | 약 $0.14 | 🔴 약 $16.4 |
| **NAT Gateway** | ❌ | 약 $0.36 | 🔴 약 $42 |
| ECR 저장(이미지 2개 ≈ 120MB) | ✅ 500MB(12개월) | $0 | 수명 주기 정책으로 통제 |
| CloudWatch Logs | ✅ 5GB | $0 | 보존 7일 설정함 |
| **합계** | | **약 $0.7** | **약 $80** |

> 🔴 **이번 강은 프리 티어 밖 리소스 3종(Fargate·ALB·NAT)이 동시에 돕니다.** 정리를 30분 전부터 시작하세요.
> 💡 NAT 대신 **ECR·S3·Logs용 VPC 엔드포인트**로 바꾸면 상시 운영 비용이 내려갑니다 — [최종 프로젝트](../04-final-project/README.md)의 표준 절감 수단입니다.

### 🧹 리소스 정리 체크리스트

```bash
# 1) 서비스 축소 → 삭제 → 클러스터 삭제 (순서 중요)
$ aws ecs update-service --cluster course-cluster --service course-svc --desired-count 0 > /dev/null
$ aws ecs delete-service --cluster course-cluster --service course-svc --force > /dev/null
$ aws ecs wait services-inactive --cluster course-cluster --services course-svc
$ aws ecs delete-cluster --cluster course-cluster > /dev/null

# 2) 태스크 정의 등록 해제(선택 — 목록 정리용)
$ for R in 1 2; do aws ecs deregister-task-definition --task-definition course-app:$R > /dev/null; done

# 3) ALB → 대상 그룹
$ aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
$ sleep 30 && aws elbv2 delete-target-group --target-group-arn $TG_ARN

# 4) NAT + EIP
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 5) ECR — ⭐ 24강에서 재사용하므로 이미지·리포지토리 유지 (수명 주기 정책이 관리)
# 6) VPC 정리 · 로그 그룹은 보존 7일이라 방치 무방

# 7) 확인 — 전부 빈 출력
$ aws ecs list-clusters --query 'clusterArns' --output text
$ aws elbv2 describe-load-balancers --query 'LoadBalancers[*].LoadBalancerName' --output text
$ aws ec2 describe-nat-gateways --filter "Name=state,Values=available,pending" --query 'NatGateways[*].NatGatewayId' --output text
```

- [ ] 🔴 **서비스 desired 0 → 삭제 → 클러스터 삭제** (태스크 0개 확인)
- [ ] ALB · 대상 그룹 삭제
- [ ] NAT 삭제 + EIP 반환 · VPC 정리
- [ ] ⭐ **ECR 리포지토리와 역할 2종(`course-ecs-*`)은 유지** — [24강](lesson-24.md)에서 사용
- [ ] 다음 날 Cost Explorer에서 Fargate·ELB 항목 중지 확인

---

## ⑤ 자주 하는 실수

### 태스크가 시작하자마자 STOPPED 된다 — 이유 읽는 법부터

**진단의 첫 명령** — 멈춘 태스크의 `stoppedReason` 을 봅니다.

```bash
$ TASK=$(aws ecs list-tasks --cluster course-cluster --desired-status STOPPED \
    --query 'taskArns[0]' --output text)
$ aws ecs describe-tasks --cluster course-cluster --tasks $TASK \
    --query 'tasks[0].[stoppedReason,containers[0].reason]' --output text
```

| stoppedReason / reason | 원인 | 해결 |
|---|---|---|
| `CannotPullContainerError: ... i/o timeout` | **ECR로 가는 경로 없음** (NAT/엔드포인트) | 프라이빗 서브넷의 라우팅 확인 |
| `CannotPullContainerError: pull access denied` | **실행 역할** 없음/권한 부족 | `AmazonECSTaskExecutionRolePolicy` 확인 |
| `exec /usr/local/bin/python: exec format error` | **아키텍처 불일치** (ARM 빌드) | `--platform linux/amd64` 재빌드 |
| `Essential container in task exited` | CMD가 종료됨(포그라운드 아님) | 서버 프로세스가 전면에서 돌게 |
| `ResourceInitializationError: ... log group does not exist` | 로그 그룹 없음 | `create-log-group` 먼저 |

### 이미지 풀 실패와 앱 권한 오류를 혼동한다

| 증상 | 어느 역할 문제인가 |
|---|---|
| 태스크가 **시작을 못 함** (`CannotPull...`) | **실행 역할** |
| 태스크는 돌지만 앱 로그에 `AccessDenied ... s3:GetObject` | **태스크 역할** |

**두 역할을 하나로 합쳐 넓게 주는 것은 정답이 아닙니다** — 앱이 탈취돼도 이미지 풀 권한만으로는 피해가 제한되도록 분리가 원칙입니다.

### 대상 그룹이 unhealthy — EC2 때와 한 가지가 다르다

**원인 후보** ([11강](../02-compute-data/lesson-11.md)과 동일한 절차 + 컨테이너 특유 1가지)

| # | 확인 |
|---|---|
| 1 | 앱 SG가 **ALB SG 소스로 8080** 허용하나 (80이 아니라!) |
| 2 | 헬스 체크 경로 `/health` 가 200인가 |
| 3 | **target-type이 `ip` 인가** — Fargate(awsvpc)는 `instance` 유형에 등록 불가 🔴 |
| 4 | 컨테이너가 `0.0.0.0:8080` 에 바인딩했나 (`127.0.0.1` 바인딩이면 밖에서 못 봄) |

### `docker push` 가 거부된다

```
denied: Your authorization token has expired. Reauthenticate and try again.
```
**원인** — ECR 로그인 토큰은 **12시간 유효**입니다.
**해결** — `aws ecr get-login-password | docker login ...` 재실행.

```
name unknown: The repository with name 'course-app' does not exist
```
**원인** — 리포지토리를 먼저 만들어야 합니다(도커 허브와 달리 자동 생성 안 됨). 태그의 레지스트리 주소 오타도 흔합니다.

### Apple Silicon에서 빌드한 이미지가 Fargate에서 죽는다

```
exec /usr/local/bin/python: exec format error
```
**원인** — M1~M4의 기본 빌드는 **ARM64**, 우리 태스크 정의는 x86입니다.
**해결 2가지** — ① `docker build --platform linux/amd64`(수업 표준) ② 태스크 정의에 `"runtimePlatform": {"cpuArchitecture": "ARM64"}` 를 넣어 **Graviton Fargate**로 실행(약 20% 저렴 — [31강](../04-final-project/lesson-31.md) 비용 최적화 소재).

### 서비스를 지웠는데 태스크가 남아 돈다

**원인** — `delete-service` 는 desired가 0이 아니면 거부되고, `--force` 없이 진행이 안 되며, 삭제 후에도 드레이닝에 시간이 걸립니다.
**해결** — 정리 체크리스트 순서(desired 0 → delete `--force` → `wait services-inactive` → 클러스터 삭제)를 지키고, 마지막에 `list-tasks` 로 0개를 확인합니다.

### 로그가 CloudWatch에 안 보인다

| 원인 | 해결 |
|---|---|
| 로그 그룹이 없어서 태스크가 죽음 | 미리 `create-log-group` |
| 파이썬 출력 버퍼링 | `python -u` 또는 `PYTHONUNBUFFERED=1` |
| 실행 역할에 logs 권한 없음 | 관리형 정책 확인 |

---

## ⑥ 확인 문제

**1.** 태스크 역할과 태스크 실행 역할의 차이를 설명하고, 다음 두 오류가 각각 어느 역할 문제인지 판정하세요.
㉮ `CannotPullContainerError: pull access denied` ㉯ 앱 로그의 `AccessDenied when calling PutItem`

<details>
<summary>답 보기</summary>

| | 실행 역할 | 태스크 역할 |
|---|---|---|
| 사용 주체 | **ECS 에이전트** (컨테이너 시작 전) | **컨테이너 안의 앱** (실행 중) |
| 용도 | ECR 이미지 풀 · CloudWatch 로그 전송 · 시크릿 주입 | 앱의 AWS API 호출 (S3·DynamoDB…) |

**판정**
- **㉮ → 실행 역할.** 이미지 풀은 컨테이너가 뜨기 **전** ECS의 일입니다. `AmazonECSTaskExecutionRolePolicy` 부착 여부를 봅니다.
- **㉯ → 태스크 역할.** 앱이 DynamoDB를 호출하다 거부됐습니다. 태스크 역할에 해당 테이블의 `dynamodb:PutItem` 을 추가합니다.

**판별 공식** — *"시작을 못 하면 실행 역할, 돌다가 막히면 태스크 역할."*
둘을 분리하는 이유는 최소 권한입니다 — 앱이 탈취돼도 앱에 준 권한(태스크 역할)까지만 노출됩니다.
</details>

**2.** 프라이빗 서브넷의 Fargate 태스크가 `CannotPullContainerError ... i/o timeout` 으로 시작하지 못합니다. 원인과 해결 방법 2가지, 그리고 각 방법의 비용 특성을 쓰세요.

<details>
<summary>답 보기</summary>

**원인** — 프라이빗 서브넷에서 **ECR(및 S3·CloudWatch Logs)로 나가는 경로가 없습니다.** 이미지 풀은 아웃바운드 HTTPS 호출인데, 라우팅 테이블에 인터넷/엔드포인트 경로가 없는 상태입니다. ([07강](../01-cloud-foundation/lesson-07.md)의 라우팅 문제가 컨테이너 옷을 입고 재등장한 것입니다.)

**해결 2가지**

| 방법 | 구성 | 비용 특성 |
|---|---|---|
| **NAT Gateway** | 앱 라우팅에 `0.0.0.0/0 → nat` | 시간당 $0.059 + **데이터 처리 GB당 $0.059** — 이미지가 클수록 풀 때마다 과금. 월 $42+ |
| **VPC 엔드포인트 세트** | `ecr.api`·`ecr.dkr`(인터페이스) + **S3 게이트웨이**(레이어 실제 다운로드 경로) + `logs` | 인터페이스 3개 × $0.013/h ≈ 월 $28, S3 게이트웨이 무료. **데이터 처리비가 훨씬 저렴**하고 트래픽이 AWS 내부에만 |

**판단** — ECR·AWS 서비스 접근이 전부라면 **엔드포인트가 싸고 안전**합니다. 컨테이너가 일반 인터넷(외부 API)도 호출해야 하면 NAT가 필요합니다.
⚠️ 엔드포인트 구성 시 **S3 게이트웨이를 빠뜨리는 실수**가 흔합니다 — 이미지 레이어 실체는 S3에서 내려오기 때문에 ecr 엔드포인트 2개만으론 여전히 실패합니다.
</details>

**3.** 상시 초당 50요청을 받는 API 서비스의 실행 방식으로 Lambda · ECS Fargate · EC2(ASG) 중 무엇을 고르겠습니까? 계산 근거와 함께 답하세요.

<details>
<summary>답 보기</summary>

**권장 — ECS Fargate** (규모가 커지면 ECS on EC2 검토)

**대략 계산 (요청당 100ms·128MB급 처리 가정)**

| 방식 | 월 비용 추정 | 비고 |
|---|---|---|
| **Lambda** | 요청 1.3억 건 × $0.2/100만 ≈ $26 + GB-초 1.3억×0.1×0.125×$0.0000167 ≈ $27 → **약 $53+** | 상시 부하에선 요청당 과금이 누적 |
| **Fargate** | 0.5vCPU·1GB × 2태스크 ≈ **약 $36** + ALB $16 ≈ **$52** | 부하 여유 있고 지연 일정(콜드 스타트 없음) |
| EC2 ASG | t4g.small 2대 SP 약정 ≈ **$17** + ALB | 최저가지만 패치·AMI·용량 관리가 내 일 |

숫자만 보면 EC2가 싸지만 **운영 인건비**(패치·튜닝·장애 대응)를 포함하면 소규모 팀에겐 Fargate의 총비용이 낮은 경우가 많습니다. Lambda는 이 케이스에서 이점(유휴 $0)이 사라지고 콜드 스타트·동시성 관리 부담만 남습니다.

**결론 규칙**

```
 간헐적·이벤트성            → Lambda
 상시·예측 가능·중소 규모    → Fargate (+ Savings Plans / Graviton으로 절감)
 대규모·밀도 최적화·GPU     → ECS/EKS on EC2
```

트래픽이 "간헐적 ↔ 상시" 사이 어디냐가 갈림길이고, 그 경계는 대략 "**유휴 시간이 절반을 넘는가**"입니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 컨테이너 vs AMI | 앱+라이브러리만 포장 · 어디서나 동일 · 빌드 수 초 |
| Dockerfile 원칙 | 작게 · **USER 지정** · 자격 증명 금지 |
| ECS 4단 | 태스크 정의(=시작 템플릿) → 서비스(=ASG) → 태스크 → 클러스터 |
| **역할 2종** | 시작 전=실행 역할 / 실행 중=태스크 역할 |
| Fargate | 서버 관리 제로 · **프리 티어 없음** · 태스크당 과금 |
| 대상 그룹 | Fargate는 **target-type `ip`** |
| 배포 | 리비전 등록 → update-service → 롤링 · **서킷 브레이커로 자동 롤백** |
| 진단 | `describe-tasks` 의 **stoppedReason** 부터 |
| ECR | 로그인 12시간 · **수명 주기 정책** 필수 · `--platform linux/amd64` |

**한 장 요약**

```
  Dockerfile → 이미지 → ECR ─┐
                             ▼
  태스크 정의(cpu/mem/역할2종/로그) → 서비스(desired 2, ALB, 서킷 브레이커)
                             │
        죽으면 1분 내 복구 · 새 리비전이면 무중단 롤링
```

**오늘 반드시 기억할 한 가지**
> **"시작을 못 하면 실행 역할, 돌다가 막히면 태스크 역할."**
> 그리고 태스크가 죽으면 추측 말고 `stoppedReason` 을 읽으세요.

**과제**
1. **이미지 빌드·푸시 기록** — Dockerfile 전문, 로컬 curl 결과, ECR 푸시 로그, 스캔 결과.
2. **분산·복구 증빙** — 8회 호출의 task/az 분포, 태스크 강제 종료 후 복구까지의 서비스 이벤트와 소요 시간.
3. **무중단 롤링 증빙** — v1→v2 전환 중 버전 분포 변화와 20회 연속 200 출력.
4. **16강 비교** — EC2(ASG) 방식과 Fargate 방식의 배포 시간·복구 시간·월 비용·운영 부담을 표로 비교하고 결론 5줄.
5. `CannotPullContainerError` 를 **일부러 재현**(NAT 경로 제거)하고 stoppedReason 캡처 + 복구 과정 기록. (도전)
6. 정리 확인 — 클러스터·ALB·NAT 목록 빈 출력, ECR 리포지토리는 유지.

---

[← 이전 20강](lesson-20.md) · [목차](README.md) · [다음 → 22강 CloudWatch · CloudTrail · Systems Manager](lesson-22.md)
