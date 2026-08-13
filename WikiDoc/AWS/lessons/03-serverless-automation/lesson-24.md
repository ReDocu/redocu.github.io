# 24강 · 🏁 CI/CD 자동 배포

> **AWS 학습 매뉴얼** · 🔴 대단원 03 · **24강 / 총 32강**
> [← 이전 23강](lesson-23.md) · [목차](README.md) · [다음 → 25강 요구사항 분석과 보안 설계](../04-final-project/lesson-25.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- **OIDC 신뢰 관계**로 GitHub Actions에 장기 액세스 키 없이 AWS 권한을 줄 수 있다.
- `git push` 한 번으로 **빌드 → 푸시 → 인프라 배포 → 스모크 테스트**가 도는 파이프라인을 만들 수 있다.
- CloudFormation이 ECS **롤링 배포와 실패 시 자동 롤백**을 수행하게 할 수 있다.
- 배포 역할의 신뢰 정책을 **특정 저장소·브랜치로 제한**할 수 있다.
- 파이프라인에 넣을 **안전장치**(린트·서킷 브레이커·스모크 테스트)를 설명할 수 있다.

---

## ② 왜 필요한가

> **[과제 문장]**
> 팀에 새 개발자가 왔다. 그는 **AWS 콘솔을 한 번도 열지 않고**, `git push` 만으로 애플리케이션을 배포할 수 있어야 한다.
> **인프라도 저장소에** 있어야 하며, 배포에 쓰는 **장기 자격 증명은 어디에도 저장되어 있지 않아야** 한다.

사람이 손으로 배포하던 시절의 사고 목록입니다.

| 사고 | 원인 |
|---|---|
| "제가 어제 배포한 거랑 오늘 거랑 달라요" | 사람마다 절차가 다름 — **재현 불가** |
| 금요일 저녁 배포 후 주말 장애 | 검증 단계 생략 — **사람은 단계를 건너뜀** |
| 저장소에 액세스 키 커밋 → 채굴 청구서 | 배포하려고 키를 여기저기 복사 |
| "롤백이요? 그게... 이전 버전이 뭐였죠?" | 배포 기록이 사람 기억 속에만 |

우리는 이미 부품을 다 만들었습니다.

```
 21강: 이미지 → ECR, ECS 서비스, 서킷 브레이커
 23강: 인프라 = 템플릿, cfn-lint, 변경의 미리 보기
 04강: "장기 키를 만들지 마라"
```

오늘은 이것을 **한 줄의 트리거**(`git push`)로 묶습니다. 그리고 열쇠가 하나 필요합니다 — GitHub의 러너가 내 AWS를 조작할 권한. 키를 저장소에 넣는 순간 [04강](../01-cloud-foundation/lesson-04.md)의 악몽이 시작되므로, **OIDC로 "키 없는 배포"** 를 만듭니다. 이것이 대단원 03의 졸업 작품이자, 최종 프로젝트 필수 요구 10번(CI/CD, OIDC, 스모크 테스트)의 원형입니다.

---

## ③ 개념 설명

### 파이프라인의 표준 단계

```
 push ──▶ ① 검증(lint) ──▶ ② 빌드 ──▶ ③ 이미지 푸시 ──▶ ④ 배포 ──▶ ⑤ 스모크 테스트
            cfn-lint        docker      ECR              CFN deploy    curl 200?
            수 초에 실패      build                        (롤링+롤백)    실패 = 파이프라인 실패
```

| 원칙 | 이유 |
|---|---|
| **싼 검증을 앞에** | lint 5초로 잡을 것을 배포 10분 뒤에 알면 낭비 |
| 배포 단위 = 이미지 태그 = **커밋 SHA** | "지금 뭐가 떠 있나" = "어느 커밋인가" 가 일치 |
| **배포 후 검증까지가 배포** | 200이 안 나오면 성공이 아님 |

### OIDC — 키 없는 배포의 원리 ⭐

```
 GitHub Actions 러너 (잡 실행 중)
    │ ① GitHub OIDC 공급자가 "이 잡의 신원 토큰" 발급
    │    (sub: repo:hong/course-deploy:ref:refs/heads/main)
    ▼
 AWS STS ── ② AssumeRoleWithWebIdentity(토큰) ──▶ 역할의 신뢰 정책과 대조
    │         "이 저장소의 main 브랜치 잡인가?" — 맞으면
    ▼
 ③ 임시 자격 증명 발급 (1시간, ASIA...)  ← 어디에도 저장된 키가 없다!
```

| | 액세스 키를 Secrets에 저장 | **OIDC** |
|---|---|---|
| 저장되는 비밀 | 장기 키 (유출 시 영구 유효) | **없음** |
| 교체 | 사람이 주기적으로 | 매 실행 자동 (임시) |
| 범위 제한 | 키를 아는 곳 어디서나 | **특정 저장소·브랜치의 잡만** |
| 유출 경로 | 로그·포크·내부자 | 신뢰 정책이 곧 방화벽 |

**신뢰 정책의 핵심은 `sub` 조건**입니다.

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:hong/course-deploy:ref:refs/heads/main"
  }
}
```

> 🔴 `sub` 를 `repo:hong/*` 처럼 넓히면 **그 계정의 아무 저장소나**(포크 포함 시나리오에 따라) 배포 역할을 맡을 수 있게 됩니다. **저장소와 브랜치까지 못 박는 것**이 이 방식의 안전성 그 자체입니다.

### CloudFormation이 배포까지 하게 하기

[21강](lesson-21.md)에서는 `update-service` 로 배포했습니다. 오늘은 한 단계 더 갑니다 — **태스크 정의의 이미지 태그를 템플릿 파라미터로** 두면:

```
 deploy --parameter-overrides ImageTag=<커밋SHA>
   → CFN이 새 태스크 정의 리비전 등록
   → ECS 서비스 롤링 교체 (minimumHealthyPercent 유지)
   → CFN은 서비스가 안정될 때까지 대기
   → 새 태스크가 계속 죽으면? 서킷 브레이커 발동 → 이전 버전으로 롤백 → 스택도 롤백 → 파이프라인 실패 ✅
```

**배포·롤백·기록이 전부 스택 히스토리에** 남습니다. "이전 버전이 뭐였죠?"라는 질문이 사라집니다.

### 배포 전략 3종 (지식 정리)

| 전략 | 동작 | 롤백 속도 | 오늘 실습 |
|---|---|---|---|
| **롤링** | 새 것을 띄우며 옛 것을 점진 교체 | 재배포 시간만큼 | ✅ (ECS 기본) |
| 블루/그린 | 새 환경을 통째로 띄우고 트래픽 전환 | **즉시**(되돌리기) | CodeDeploy 연동(소개) |
| 카나리 | 소수 비율만 새 버전 → 점진 확대 | 빠름 | [12강](../02-compute-data/lesson-12.md) 가중치 라우팅 참고 |

### GitHub Actions vs CodePipeline

| | **GitHub Actions** (이 과정) | CodePipeline + CodeBuild |
|---|---|---|
| 코드가 있는 곳 | GitHub이면 자연스러움 | AWS 안에서 완결 |
| 비용 | 퍼블릭 무료 / 프라이빗 월 2,000분 | 파이프라인 월 $1 + 빌드 분당 |
| 생태계 | 방대한 marketplace 액션 | AWS 서비스 연동 깊음 |
| 선택 기준 | **저장소가 GitHub인 팀 대부분** | 조직 정책상 AWS 내부 완결 필요 시 |

---

## ④ 단계별 실습 — 🏁 자동화·배포 프로젝트

> 💰 **예상 비용 $0.3 ~ 0.6** — 배포되는 Fargate·ALB가 비용의 전부입니다. NAT 없이 갑니다(아래 트레이드오프 참고).
> ⚠️ 전제: GitHub 계정 · [21강](lesson-21.md) ECR 리포지토리(`course-app`)와 역할 2종 · [23강](lesson-23.md) `course-network` 스택과 `network.yaml`.

### Step 0. 저장소 구조 (10분)

GitHub에 **새 저장소 `course-deploy`** 를 만들고(프라이빗 권장) 다음 구조로 시작합니다.

```
 course-deploy/
 ├── app/
 │   ├── app.py            ← 21강의 앱 그대로
 │   └── Dockerfile
 ├── infra/
 │   ├── network.yaml      ← 23강 산출물 그대로
 │   └── app.yaml          ← 오늘 작성 (Step 2)
 └── .github/workflows/
     └── deploy.yml        ← 오늘 작성 (Step 3)
```

```bash
$ git clone https://github.com/<내계정>/course-deploy && cd course-deploy
$ mkdir -p app infra .github/workflows
$ cp ~/container-lab/{app.py,Dockerfile} app/
$ cp ~/iac-lab/network.yaml infra/
```

### Step 1. OIDC 공급자와 배포 역할 ⭐ (25분)

**① OIDC 자격 증명 공급자 등록** (계정에 한 번만)

```bash
$ aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --query 'OpenIDConnectProviderArn' --output text
arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com
```

**② 신뢰 정책 — 내 저장소의 main 브랜치만**

```bash
$ ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
$ GH_REPO="<내계정>/course-deploy"        # 예: hong-gildong/course-deploy — 정확히!

$ cat > deploy-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:$GH_REPO:ref:refs/heads/main"
      }
    }
  }]
}
EOF

$ aws iam create-role --role-name course-deploy-role \
    --assume-role-policy-document file://deploy-trust.json \
    --query 'Role.Arn' --output text
arn:aws:iam::123456789012:role/course-deploy-role
```

**③ 권한 정책 — 파이프라인이 하는 일만**

```bash
$ cat > deploy-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrLogin",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "EcrPush",
      "Effect": "Allow",
      "Action": ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload",
                 "ecr:UploadLayerPart", "ecr:CompleteLayerUpload",
                 "ecr:PutImage", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
      "Resource": "arn:aws:ecr:ap-northeast-2:$ACCOUNT:repository/course-app"
    },
    {
      "Sid": "CfnDeploy",
      "Effect": "Allow",
      "Action": "cloudformation:*",
      "Resource": "arn:aws:cloudformation:ap-northeast-2:$ACCOUNT:stack/course-*/*"
    },
    {
      "Sid": "StackResources",
      "Effect": "Allow",
      "Action": ["ec2:*", "elasticloadbalancing:*", "ecs:*",
                 "logs:CreateLogGroup", "logs:PutRetentionPolicy",
                 "logs:DeleteLogGroup", "logs:DescribeLogGroups", "logs:TagResource"],
      "Resource": "*"
    },
    {
      "Sid": "PassEcsRoles",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": ["arn:aws:iam::$ACCOUNT:role/course-ecs-exec-role",
                   "arn:aws:iam::$ACCOUNT:role/course-ecs-task-role"],
      "Condition": {"StringEquals": {"iam:PassedToService": "ecs-tasks.amazonaws.com"}}
    }
  ]
}
EOF

$ aws iam put-role-policy --role-name course-deploy-role \
    --policy-name deploy-permissions --policy-document file://deploy-policy.json
```

> 📌 **`iam:PassRole` 을 특정 역할 2개로 좁힌 것**에 주목하세요 — 이 조건이 없으면 배포 역할이 임의의 역할을 ECS에 넘겨 **권한 상승**할 수 있습니다([04강](../01-cloud-foundation/lesson-04.md)의 단골 함정).
> `ec2:*` 등은 실습 편의상 넓습니다 — 좁히는 절차(Access Analyzer)는 04강 그대로이며, 최종 프로젝트에서 좁힌 버전이 평가 대상입니다.

### Step 2. 앱 스택 템플릿 — 배포까지 CFN에게 (25분)

`infra/app.yaml` — ALB + ECS 서비스 + 역할 참조. **`ImageTag` 파라미터가 배포의 손잡이**입니다.

```bash
$ cat > infra/app.yaml <<'EOF'
AWSTemplateFormatVersion: "2010-09-09"
Description: AWS course app - ALB + ECS Fargate service (image tag = deploy handle)

Parameters:
  ImageTag:
    Type: String
    Description: ECR image tag to deploy (commit SHA)
  NetworkStack:
    Type: String
    Default: course-network

Resources:
  Cluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub "${AWS::StackName}-cluster"

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/ecs/${AWS::StackName}"
      RetentionInDays: 7

  TaskDef:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub "${AWS::StackName}-app"
      Cpu: "256"
      Memory: "512"
      NetworkMode: awsvpc
      RequiresCompatibilities: [FARGATE]
      ExecutionRoleArn: !Sub "arn:aws:iam::${AWS::AccountId}:role/course-ecs-exec-role"
      TaskRoleArn: !Sub "arn:aws:iam::${AWS::AccountId}:role/course-ecs-task-role"
      ContainerDefinitions:
        - Name: app
          Image: !Sub "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/course-app:${ImageTag}"
          Essential: true
          PortMappings: [{ContainerPort: 8080}]
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref LogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: app

  Alb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
      Subnets: !Split [",", {"Fn::ImportValue": !Sub "${NetworkStack}-PublicSubnets"}]
      SecurityGroups: [{"Fn::ImportValue": !Sub "${NetworkStack}-WebSg"}]

  Tg:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: {"Fn::ImportValue": !Sub "${NetworkStack}-VpcId"}
      Protocol: HTTP
      Port: 8080
      TargetType: ip
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2
      TargetGroupAttributes:
        - {Key: deregistration_delay.timeout_seconds, Value: "30"}

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref Alb
      Protocol: HTTP
      Port: 80
      DefaultActions: [{Type: forward, TargetGroupArn: !Ref Tg}]

  Service:
    Type: AWS::ECS::Service
    DependsOn: Listener
    Properties:
      ServiceName: !Sub "${AWS::StackName}-svc"
      Cluster: !Ref Cluster
      TaskDefinition: !Ref TaskDef
      DesiredCount: 2
      LaunchType: FARGATE
      HealthCheckGracePeriodSeconds: 60
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 100
        DeploymentCircuitBreaker: {Enable: true, Rollback: true}
      NetworkConfiguration:
        AwsvpcConfiguration:
          # 실습 트레이드오프: NAT 비용 절감을 위해 퍼블릭 서브넷 + 퍼블릭 IP로 ECR 접근.
          # SG가 ALB 소스 8080만 허용하므로 노출은 제한적. 최종 프로젝트는 프라이빗+엔드포인트 필수!
          AssignPublicIp: ENABLED
          Subnets: !Split [",", {"Fn::ImportValue": !Sub "${NetworkStack}-PublicSubnets"}]
          SecurityGroups: [{"Fn::ImportValue": !Sub "${NetworkStack}-AppSg"}]

Outputs:
  ServiceUrl:
    Value: !Sub "http://${Alb.DNSName}"
EOF
```

> 📌 **트레이드오프를 코드에 주석으로 남겼습니다.** 파이프라인 실습의 초점을 위해 NAT($42/월)를 빼고 퍼블릭 서브넷+SG 제한으로 대신했습니다 — [08강](../01-cloud-foundation/lesson-08.md)에서 배운 "의도적 결정의 문서화"입니다. **최종 프로젝트에서는 프라이빗+엔드포인트가 필수 요구**입니다.

### Step 3. 워크플로 작성 (20분)

`.github/workflows/deploy.yml` — 파이프라인 전체입니다.

```bash
$ cat > .github/workflows/deploy.yml <<'EOF'
name: deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write      # ⭐ OIDC 토큰 발급 허가 — 없으면 자격 증명 단계가 실패
  contents: read

env:
  AWS_REGION: ap-northeast-2
  ECR_REPO: course-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 체크아웃
        uses: actions/checkout@v4

      - name: AWS 자격 증명 (OIDC — 키 없음)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/course-deploy-role
          aws-region: ${{ env.AWS_REGION }}

      - name: 템플릿 린트 (싼 검증을 앞에)
        run: |
          pip install cfn-lint --quiet
          cfn-lint infra/*.yaml

      - name: ECR 로그인
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: 이미지 빌드·푸시 (태그 = 커밋 SHA)
        run: |
          IMAGE=${{ steps.ecr.outputs.registry }}/${{ env.ECR_REPO }}:${{ github.sha }}
          docker build --platform linux/amd64 -t "$IMAGE" app/
          docker push "$IMAGE"

      - name: 네트워크 스택 배포 (멱등)
        run: |
          aws cloudformation deploy \
            --stack-name course-network \
            --template-file infra/network.yaml \
            --no-fail-on-empty-changeset

      - name: 앱 스택 배포 (롤링 + 실패 시 자동 롤백)
        run: |
          aws cloudformation deploy \
            --stack-name course-app \
            --template-file infra/app.yaml \
            --parameter-overrides ImageTag=${{ github.sha }} \
            --no-fail-on-empty-changeset

      - name: 스모크 테스트 (배포 후 검증까지가 배포)
        run: |
          URL=$(aws cloudformation describe-stacks --stack-name course-app \
            --query "Stacks[0].Outputs[?OutputKey=='ServiceUrl'].OutputValue" --output text)
          echo "서비스 URL: $URL"
          for i in $(seq 1 12); do
            CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || true)
            echo "[$i/12] HTTP $CODE"
            if [ "$CODE" = "200" ]; then
              curl -s "$URL" | head -1
              exit 0
            fi
            sleep 10
          done
          echo "::error::스모크 테스트 실패 - 200이 오지 않음"
          exit 1
EOF
```

> 📌 `role-to-assume` 의 계정 ID를 **본인 것으로** 바꾸세요.
> 📌 저장소에 **secrets가 하나도 없습니다.** 그것이 이 실습의 요점입니다.

### Step 4. 🚀 첫 배포 — push가 곧 배포 (15분)

```bash
$ git add -A
$ git commit -m "feat: 초기 파이프라인 - 앱/인프라/워크플로"
$ git push origin main
```

GitHub 저장소 → **Actions 탭**에서 실행을 지켜봅니다.

```
 ✅ 체크아웃                       2s
 ✅ AWS 자격 증명 (OIDC — 키 없음)  1s
 ✅ 템플릿 린트                    18s
 ✅ ECR 로그인                     2s
 ✅ 이미지 빌드·푸시                45s
 ✅ 네트워크 스택 배포              12s   (No changes — 23강에서 이미 있음)
 ✅ 앱 스택 배포                   4m 10s
 ✅ 스모크 테스트                  22s
      서비스 URL: http://course-app-alb-1234.ap-northeast-2.elb.amazonaws.com
      [1/12] HTTP 503
      [2/12] HTTP 200
      {"app": "course-container", "version": "v2", "task": "3f8a...", "az": "ap-northeast-2a"}
```

**로컬에서도 확인**

```bash
$ URL=$(aws cloudformation describe-stacks --stack-name course-app \
    --query "Stacks[0].Outputs[?OutputKey=='ServiceUrl'].OutputValue" --output text)
$ for i in 1 2 3 4; do curl -s $URL | jq -r '"\(.task)  \(.az)"'; done
3f8a1c2d  ap-northeast-2a
7b9e4f01  ap-northeast-2c
3f8a1c2d  ap-northeast-2a
7b9e4f01  ap-northeast-2c
```

> ✅ **콘솔을 한 번도 열지 않고** ALB + ECS 서비스가 배포됐습니다. 과제 문장의 새 개발자가 할 일은 push뿐입니다.

### Step 5. 🔍 변경 배포 — 무중단 확인 (15분)

**앱을 한 줄 고치고** push 합니다.

```bash
$ sed -i 's/"APP_VERSION", "v1"/"APP_VERSION", "v3-pipeline"/' app/app.py
$ git commit -am "feat: v3 - 파이프라인 배포 표시" && git push
```

**배포가 도는 동안 요청 루프** (다른 터미널)

```bash
$ while true; do
    printf "%s  " "$(date +%T)"
    curl -s -m 3 $URL | jq -r .version 2>/dev/null || echo "FAIL"
    sleep 2
  done
17:20:11  v2
17:20:13  v2
17:24:02  v2
17:24:04  v3-pipeline     ← 새 태스크 투입
17:24:06  v2              ← 공존 구간
17:24:08  v3-pipeline
17:25:30  v3-pipeline     ← 전환 완료
17:25:32  v3-pipeline
```

> ✅ **FAIL 없이 버전이 넘어갔습니다** — `MinimumHealthyPercent: 100` + 헬스 체크 + 드레이닝의 합작입니다. push부터 반영까지 약 6분, 사람의 개입 0회.

### Step 6. 🔍 실패 배포 — 자동 롤백 확인 ⭐ (20분)

**일부러 죽는 버전**을 push 합니다.

```bash
$ sed -i '1i import sys; sys.exit(1)  # 배포 실패 실험' app/app.py
$ git commit -am "test: 고의 실패 - 롤백 검증" && git push
```

**관찰 포인트 3곳**

**① ECS 이벤트** — 새 태스크가 뜨자마자 죽기를 반복하다 서킷 브레이커 발동:

```bash
$ aws ecs describe-services --cluster course-app-cluster --services course-app-svc \
    --query 'services[0].events[0:3].message' --output json
[
  "(service course-app-svc) rolling back to deployment ecs-svc/123456. (reason: deployment circuit breaker triggered)",
  "(service course-app-svc) has started 2 tasks: ...",
  "(service course-app-svc) task ... failed container health checks."
]
```

**② 스택 상태** — CFN도 함께 롤백:

```bash
$ aws cloudformation describe-stacks --stack-name course-app \
    --query 'Stacks[0].StackStatus' --output text
UPDATE_ROLLBACK_COMPLETE
```

**③ Actions** — 앱 스택 배포 단계가 ❌ 실패로 표시.

**그리고 가장 중요한 것 — 서비스는 살아 있습니다.**

```bash
$ curl -s $URL | jq -r .version
v3-pipeline        ← 이전 정상 버전 그대로!
```

> ✅ **나쁜 배포가 사용자에게 도달하지 못했고, 사람이 롤백 명령을 친 적도 없습니다.**
> 서킷 브레이커(21강) + CFN 롤백(23강) + 파이프라인 실패 표시가 겹겹이 동작한 결과입니다. 이 3개 화면이 과제의 핵심 증빙입니다.

**원상 복구**

```bash
$ sed -i '1d' app/app.py
$ git commit -am "fix: 실험 코드 제거" && git push
# Actions 초록불 확인
```

### Step 7. 신뢰 정책 검증 — main 외 브랜치는 거부 (10분)

```bash
$ git checkout -b feature/test
$ git commit --allow-empty -m "test: 브랜치에서 배포 시도" && git push origin feature/test
```

**워크플로의 `on.push.branches` 가 main뿐이라 아예 실행되지 않습니다.** 트리거를 임시로 넓혀 실험하면:

```
 ❌ AWS 자격 증명 (OIDC — 키 없음)
    Error: Could not assume role with OIDC:
    Not authorized to perform sts:AssumeRoleWithWebIdentity
```

> ✅ **신뢰 정책의 `sub` 조건이 main 브랜치가 아닌 토큰을 거부**했습니다. 워크플로 파일을 고칠 수 있는 사람도 **AWS 쪽 정책은 못 바꾸므로** 이중 방어가 성립합니다.

```bash
$ git checkout main && git branch -D feature/test && git push origin --delete feature/test
```

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| **Fargate 2태스크** | 🔴 없음 | 약 $0.19 | 🔴 약 $18~22 |
| **ALB** | ❌ | 약 $0.14 | 🔴 약 $16.4 |
| ECR (이미지 누적) | ✅ 500MB | $0 | 수명 주기 정책(최근 5개)이 통제 ⭐ |
| GitHub Actions | 퍼블릭 무료 / 프라이빗 월 2,000분 | ~15분 → $0 | — |
| CloudFormation · OIDC · IAM | 무료 | $0 | $0 |
| 네트워크 스택 | 무료 | $0 | $0 |
| **합계** | | **약 $0.4** | **약 $38** |

> 💡 **IaC의 정리 방식** — 앱 스택만 지우면 Fargate·ALB가 사라지고, 네트워크 스택($0)과 파이프라인은 남습니다. **다음에 push 하면 앱이 다시 생깁니다** — "지웠다가 다시 만들기"의 비용이 명령 한 줄로 떨어졌습니다.

### 🧹 리소스 정리 체크리스트

```bash
# 1) 앱 스택 삭제 — 비용 나는 것 전부 (Fargate·ALB·TG·로그)
$ aws cloudformation delete-stack --stack-name course-app
$ aws cloudformation wait stack-delete-complete --stack-name course-app

# 2) 확인
$ aws ecs list-clusters --query 'clusterArns' --output text
$ aws elbv2 describe-load-balancers --query 'LoadBalancers[*].LoadBalancerName' --output text
(둘 다 빈 출력)

# 3) ECR 오래된 이미지 — 수명 주기 정책이 자동 정리 (수동 확인)
$ aws ecr describe-images --repository-name course-app \
    --query 'length(imageDetails)' 
```

- [ ] **`course-app` 스택 삭제** — Fargate·ALB 소멸 확인
- [ ] ⭐ **유지 목록**: `course-network` 스택($0) · ECR 리포지토리 · `course-deploy-role` · OIDC 공급자 · GitHub 저장소 — **전부 최종 프로젝트의 출발점**
- [ ] 다음 날 Cost Explorer에서 Fargate·ELB 중지 확인

---

## ⑤ 자주 하는 실수

### OIDC 자격 증명 단계가 실패한다

```
Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**원인 4대장 — 위에서부터 확인**

| # | 원인 | 확인 |
|---|---|---|
| 1 | **워크플로에 `permissions: id-token: write` 누락** | 이게 없으면 토큰 발급 자체가 안 됨 |
| 2 | **`sub` 불일치** — 저장소 이름 오타·대소문자, 브랜치 다름 | 신뢰 정책의 `repo:계정/저장소:ref:refs/heads/main` 을 글자 단위 대조 |
| 3 | OIDC 공급자 미등록 | `aws iam list-open-id-connect-providers` |
| 4 | `aud` 조건 불일치 | `sts.amazonaws.com` 인지 |

> 💡 **실제 sub 값을 눈으로 보려면** 워크플로에 임시 스텝을 넣습니다: Actions 로그의 토큰 클레임 디버깅 액션 또는 신뢰 정책을 잠시 `StringLike` + `repo:계정/저장소:*` 로 넓혀 성공시킨 뒤 CloudTrail의 `AssumeRoleWithWebIdentity` 이벤트에서 `subject` 를 확인하고 다시 좁힙니다.

### PassRole 거부로 앱 스택 배포가 실패한다

```
API: iam:PassRole User: arn:...role/course-deploy-role is not authorized to perform:
iam:PassRole on resource: arn:...role/course-ecs-exec-role
```

**원인** — 배포 역할이 태스크 정의에 실행/태스크 역할을 **넘길 권한**이 없습니다. ECS 리소스를 만들 권한과 별개입니다.
**해결** — Step 1의 `PassEcsRoles` 문(특정 역할 + `iam:PassedToService` 조건)을 확인합니다. `Resource: "*"` 로 넓히지 마세요 — 권한 상승 통로가 됩니다.

### 앱 스택 배포가 20분씩 걸리다 실패한다

**원인** — 새 태스크가 **헬스 체크를 통과하지 못해** CFN이 안정화를 기다리다 실패 → 롤백. 서킷 브레이커가 없으면 이 대기가 훨씬 깁니다.
**진단 순서**

```bash
# ① 태스크가 왜 죽는지 (21강의 그 명령)
$ aws ecs describe-tasks --cluster course-app-cluster \
    --tasks $(aws ecs list-tasks --cluster course-app-cluster --desired-status STOPPED --query 'taskArns[0]' --output text) \
    --query 'tasks[0].[stoppedReason,containers[0].reason]'
# ② 앱 로그
$ aws logs tail /ecs/course-app --since 15m
```

| 흔한 원인 | 해결 |
|---|---|
| SG가 8080을 안 열음 | network.yaml의 AppSg 확인 |
| 이미지 풀 실패 (태그 오타) | `ImageTag` 파라미터 = 실제 푸시된 태그인지 |
| 앱이 뜨자마자 죽음 | Step 6에서 일부러 만든 그 상황 — 로그 확인 |

> 💡 **서킷 브레이커 + `Rollback: true`** 덕에 실패해도 서비스는 이전 버전으로 살아 있습니다. 이 안전망 없이 운영 배포를 하지 마세요.

### `UPDATE_ROLLBACK_FAILED` 로 스택이 굳었다

**원인** — 롤백 중에 또 실패(드물지만 수동 변경·리소스 한도 등).
**해결** — `continue-update-rollback` 으로 롤백을 재개합니다.

```bash
$ aws cloudformation continue-update-rollback --stack-name course-app
```

그래도 안 되면 문제 리소스를 `--resources-to-skip` 으로 건너뛰고, 원인을 고친 뒤 재배포합니다.

### 러너에서 빌드한 이미지가 플랫폼 불일치로 죽는다

**사실 관계** — GitHub 호스팅 `ubuntu-latest` 러너는 **x86_64**라 기본 빌드로도 Fargate(x86)와 맞습니다. 문제는 **로컬(M1~M4)에서 푸시한 이미지와 섞일 때**입니다.
**해결** — 워크플로와 로컬 모두 `--platform linux/amd64` 를 명시(우리 워크플로는 이미 명시)해 어디서 빌드해도 같은 결과가 나오게 합니다.

### 포크 PR에서 배포가 돌까 봐 걱정된다

**3중 방어를 확인하세요**

| 층 | 내용 |
|---|---|
| 트리거 | `on.push.branches: [main]` — PR에서는 배포 잡이 안 돎 |
| GitHub | 포크 PR에는 기본적으로 `id-token: write` 가 제한됨 |
| **AWS 신뢰 정책** | `sub` 가 main push 토큰만 허용 — **워크플로 파일을 고쳐도 못 뚫음** ⭐ |

마지막 층이 핵심입니다 — **보안 경계는 저장소 설정이 아니라 AWS 쪽 정책**에 두는 것.

### 파이프라인은 초록불인데 옛 버전이 떠 있다

| 원인 | 해결 |
|---|---|
| 이미지 태그를 `latest` 로 고정 | CFN이 "파라미터 무변화 = 배포 없음"으로 판단 — **커밋 SHA 태그**를 쓰는 이유 |
| 브라우저/CDN 캐시 | `curl` 로 직접 확인 |
| 스모크 테스트가 너무 관대 | 버전 문자열까지 검증하도록 강화 |

---

## ⑥ 확인 문제

**1.** GitHub Secrets에 액세스 키를 저장하는 방식과 OIDC 방식의 차이를 설명하고, OIDC 신뢰 정책에서 `sub` 조건이 왜 "안전성 그 자체"인지 설명하세요.

<details>
<summary>답 보기</summary>

**액세스 키 저장 방식의 문제**

| 문제 | 내용 |
|---|---|
| 장기 자격 증명 존재 | 유출되면 **교체 전까지 영구 유효** ([04강](../01-cloud-foundation/lesson-04.md)의 그 사고) |
| 유출 경로가 많음 | 액션 로그 출력·악성 서드파티 액션·내부자·포크 워크플로 |
| 교체가 사람 일 | 잊히고, 잊히면 몇 년짜리 키가 됨 |

**OIDC 방식** — 잡이 실행될 때마다 GitHub이 **그 잡의 신원을 증명하는 단명 토큰**을 발급하고, AWS STS가 신뢰 정책과 대조해 **1시간짜리 임시 자격 증명**을 줍니다. 저장된 비밀이 0개이므로 "유출될 키" 자체가 없습니다.

**`sub` 조건이 핵심인 이유** — 토큰의 `sub` 는 `repo:계정/저장소:ref:refs/heads/main` 형태로 **어느 저장소의 어느 브랜치 잡인지**를 담습니다. 신뢰 정책이 이것을 정확히 못 박으면:
- 다른 저장소·포크·다른 브랜치의 잡은 **토큰이 있어도 역할을 못 맡습니다.**
- 공격자가 워크플로 파일을 고쳐도 **AWS 쪽 정책은 저장소 밖**이라 못 바꿉니다 — 보안 경계가 올바른 위치에 있는 것입니다.
- 반대로 `sub` 를 `repo:계정/*` 로 넓히는 순간 그 계정의 아무 저장소나 배포 권한을 얻습니다 — **이 조건의 정밀도가 곧 보안 수준**입니다.
</details>

**2.** 이 파이프라인에서 "나쁜 배포가 사용자에게 도달하지 않게" 막아 주는 장치를 단계 순서대로 나열하고, 각각 무엇을 잡는지 쓰세요.

<details>
<summary>답 보기</summary>

**4겹 방어선 (앞이 쌀수록 좋다)**

| 순서 | 장치 | 잡는 것 | 실패 비용 |
|---|---|---|---|
| ① | **cfn-lint** (push 후 수 초) | 템플릿 문법·스키마 오류 | 수 초 |
| ② | **ELB 헬스 체크 + MinimumHealthyPercent 100** | 응답 못 하는 새 태스크 — 트래픽을 아예 안 줌 | 무중단 |
| ③ | **배포 서킷 브레이커 + Rollback** | 반복해서 죽는 새 버전 — **자동으로 이전 버전 복귀** | 수 분, 사용자 영향 0 |
| ④ | **스모크 테스트** | 배포는 됐지만 실제 응답이 이상한 경우 — 파이프라인을 빨간불로 만들어 **사람에게 통보** | 후속 push 차단 신호 |

여기에 암묵적 0번 — **이미지 태그 = 커밋 SHA** 라서 "무엇이 배포됐는지"가 항상 추적 가능하고, 롤백 대상이 명확합니다.

**교훈** — 배포의 안전은 한 방이 아니라 **겹**으로 만듭니다. Step 6 실험에서 ②③④가 실제로 연쇄 동작해 사용자는 옛 버전(v3)을 계속 봤습니다.
</details>

**3.** 배포 역할(course-deploy-role)의 권한 정책에서 `iam:PassRole` 을 특정 역할 2개 + `iam:PassedToService` 조건으로 제한한 이유는? 만약 `Resource: "*"` 로 열면 어떤 공격이 가능한가요?

<details>
<summary>답 보기</summary>

**PassRole이 하는 일** — "이 서비스(ECS)야, 앞으로 이 역할의 권한으로 일해"라고 **역할을 넘겨주는** 행위입니다. 태스크 정의의 `TaskRoleArn` 이 바로 그것입니다.

**`Resource: "*"` 로 열었을 때의 공격 — 권한 상승(privilege escalation)**

```
 전제: 계정에 AdminRole(관리자 권한, ecs-tasks 신뢰 가능)이 존재
 공격: 저장소에 쓰기 권한을 얻은 누군가가 app.yaml 한 줄을 수정
        TaskRoleArn: .../course-ecs-task-role  →  .../AdminRole
 push → 파이프라인이 성실하게 배포 → 컨테이너가 관리자 권한 획득
 → 컨테이너 안에서 aws iam create-user ... 무엇이든 가능
```

배포 역할 자체는 제한적이어도, **아무 역할이나 넘길 수 있으면 그 계정의 가장 강한 역할만큼 강해집니다.**

**제한이 막는 것**

| 조건 | 효과 |
|---|---|
| `Resource: [exec-role, task-role]` | 넘길 수 있는 역할이 **미리 정한 2개뿐** — AdminRole 지정 시 배포가 거부됨 |
| `iam:PassedToService: ecs-tasks.amazonaws.com` | 그 2개조차 **ECS 태스크 용도로만** — 다른 서비스(EC2·Lambda)에 끼워 넣는 우회 차단 |

**일반 원칙** — 파이프라인처럼 **자동으로 실행되는 주체의 권한은 곧 그 저장소에 쓰기 권한이 있는 모든 사람의 권한**입니다. 그래서 배포 역할의 최소 권한은 선택이 아니라 필수이고, 최종 프로젝트에서 `AdministratorAccess` 배포 역할이 감점인 이유입니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 파이프라인 | lint → 빌드 → 푸시 → 배포 → **스모크 테스트** (싼 검증 먼저) |
| **OIDC** | 저장된 키 0개. `id-token: write` + 신뢰 정책 `sub` 로 저장소·브랜치 못 박기 |
| 배포 손잡이 | 이미지 태그 = **커밋 SHA** → CFN 파라미터 → 롤링 |
| 자동 롤백 | 서킷 브레이커 + CFN 롤백 — 나쁜 버전이 사용자에 도달 안 함 |
| PassRole | 특정 역할 + `PassedToService` — 권한 상승 차단 |
| 실패 진단 | OIDC는 `sub` 대조 · 배포는 stoppedReason · 스택은 이벤트 |
| 정리 | 앱 스택만 지우면 비용 소멸, **push 하면 부활** |

**한 장 요약**

```
  git push (main)
    → OIDC로 1시간짜리 신원 획득 (키 없음)
    → lint → build(SHA 태그) → ECR
    → cfn deploy network(멱등) → cfn deploy app(ImageTag=SHA)
         └ 롤링 · 죽으면 서킷 브레이커가 자동 롤백
    → smoke test 200?  ✅ 초록불 / ❌ 빨간불 + 서비스는 이전 버전 유지
```

**오늘 반드시 기억할 한 가지**
> **배포의 주체를 사람에서 파이프라인으로 바꾸는 순간, 파이프라인의 권한이 곧 팀의 보안 수준이 됩니다.**
> 키는 저장하지 말고(OIDC), 권한은 좁히고(PassRole 조건), 실패는 자동으로 되돌리게(서킷 브레이커) 하세요.

---

## 📦 자동화·배포 프로젝트 제출물

| # | 산출물 | 형식 |
|---|---|---|
| 1 | **GitHub 저장소 링크** — `app/` · `infra/` · 워크플로 포함, secrets 0개 | 링크 |
| 2 | **배포 성공 기록** — Actions 전체 초록불 + 서비스 URL 응답 | 캡처 |
| 3 | **OIDC 신뢰 정책 JSON** + "각 조건이 무엇을 막는지" 설명 | 문서 |
| 4 | **무중단 변경 증빙** — v2→v3 전환 중 요청 루프 출력(FAIL 0건) | 로그 |
| 5 | **자동 롤백 증빙 3종** — ECS 서킷 브레이커 이벤트 · 스택 `UPDATE_ROLLBACK_COMPLETE` · 그 순간에도 200을 반환한 curl | 캡처/로그 |
| 6 | **브랜치 차단 증빙** — main 외 토큰의 AssumeRole 거부 | 캡처 |
| 7 | 배포 역할 권한 정책과 **PassRole 제한의 이유** 5줄 | 문서 |
| 8 | 정리 확인 — 앱 스택 삭제 후 클러스터·ALB 빈 출력 | 로그 |
| 9 | (도전) 워크플로에 **변경 세트 검토 단계** 추가 — deploy 대신 create-change-set → describe → execute | 코드 |

### 평가 기준 (통과/보완)

- [ ] 저장소에 자격 증명이 없다 (있으면 **즉시 불통과** — [04강](../01-cloud-foundation/lesson-04.md) 유출 대응부터)
- [ ] push만으로 배포된다 (콘솔 수동 단계 0)
- [ ] 실패 배포가 사용자에게 도달하지 않는다 (롤백 증빙)
- [ ] 스모크 테스트가 실패를 빨간불로 만든다
- [ ] 배포 역할이 `AdministratorAccess` 가 아니다

---

## 🎓 대단원 03 완료 체크리스트

- [ ] 요구에 따라 EC2·컨테이너·Lambda를 근거와 함께 선택할 수 있다
- [ ] DynamoDB를 접근 패턴 기준으로 설계하고 캐시를 적용할 수 있다
- [ ] Lambda + API Gateway로 서버 없는 API를 만들 수 있다
- [ ] 큐와 DLQ로 "실패해도 잃지 않는" 구조를 만들 수 있다
- [ ] 컨테이너를 ECS Fargate로 배포하고 롤링·롤백을 다룰 수 있다
- [ ] 지표·로그·알람·감사 추적으로 시스템을 관측할 수 있다
- [ ] 인프라를 코드로 정의하고 **push 한 번으로 배포**할 수 있다

**다음 대단원 예고** — [25강](../04-final-project/lesson-25.md)부터는 **최종 팀 프로젝트**입니다. 오늘 남겨 둔 것들(네트워크 스택 · ECR · 배포 역할 · 저장소)이 그대로 팀 프로젝트의 뼈대가 됩니다. 이제 배운 것을 조립하는 것이 아니라, **요구사항에서 출발해 설계하고, 지키고, 증명하는** 4주가 시작됩니다.

---

[← 이전 23강](lesson-23.md) · [목차](README.md) · [다음 → 25강 요구사항 분석과 보안 설계](../04-final-project/lesson-25.md)
