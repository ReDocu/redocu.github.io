# 23강 · Infrastructure as Code

> **AWS 학습 매뉴얼** · 🔴 대단원 03 · **23강 / 총 32강**
> [← 이전 22강](lesson-22.md) · [목차](README.md) · [다음 → 24강 🏁 CI/CD 자동 배포](lesson-24.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 셸 스크립트 방식과 IaC의 차이를 **상태·멱등성·삭제** 관점에서 설명할 수 있다.
- CloudFormation 템플릿의 **5개 섹션**을 읽고 쓸 수 있다.
- 매주 손으로 만들던 VPC를 **템플릿 한 장**으로 재현하고 스택 한 번에 지울 수 있다.
- **변경 세트**로 적용 전에 영향(특히 교체!)을 확인할 수 있다.
- **드리프트 감지**로 콘솔 수동 변경을 찾아낼 수 있다.

---

## ② 왜 필요한가

우리는 8주째 매번 이 일을 반복하고 있습니다.

```
 수업 시작: bash create-vpc.sh → NAT 생성 → 보안 그룹 ID 갱신 → ...
 수업 끝:   NAT 삭제 → EIP 반환 → SG 삭제(순서!) → 서브넷 → ... → VPC
```

`create-vpc.sh` 는 훌륭한 훈련이었지만, 스크립트 방식의 한계를 이미 몸으로 느꼈을 겁니다.

| 스크립트의 한계 | 겪었던 순간 |
|---|---|
| **두 번 실행하면 사고** | 이미 있는 VPC 위에 또 만들어짐 (멱등성 없음) |
| **삭제가 별도의 고통** | 의존 순서를 외워서 역순으로 — 하나 빠뜨리면 `DependencyViolation` |
| **중간 실패 시 반쪽 상태** | 어디까지 됐는지 스크립트는 모름 |
| ID 추적이 수동 | `course-vpc-env.sh` 파일로 변수 돌려막기 |
| VPC가 바뀌면 연쇄 수정 | [10강](../02-compute-data/lesson-10.md)에서 시작 템플릿 SG를 매번 갱신했던 것 |

**IaC(선언형)는 "절차"가 아니라 "원하는 상태"를 적습니다.**

| | 스크립트 (명령형) | CloudFormation (선언형) |
|---|---|---|
| 적는 것 | **어떻게** 만들지 (명령 순서) | **무엇이** 있어야 하는지 |
| 두 번 실행 | 중복 생성 | **차이만 반영** (멱등) |
| 삭제 | 역순 스크립트 직접 작성 | `delete-stack` **한 번** — 순서는 CFN이 계산 |
| 중간 실패 | 반쪽 상태 방치 | **자동 롤백** |
| 검토 | diff 불가 | 코드 리뷰 + **변경 세트** |

그리고 결정적 이점 하나 — **이 과정의 최대 관심사인 "정리"가 명령 한 줄이 됩니다.** 스택이 만든 것은 스택이 다 지웁니다. 오늘부터 콘솔에서 리소스를 만드는 일은 끝나고, [24강](lesson-24.md)에서 이 템플릿이 `git push` 로 배포됩니다.

---

## ③ 개념 설명

### 템플릿 → 스택 — 용어 정리

```
 템플릿 (course-network.yaml)      ← 설계도 (파일, Git으로 관리)
      │ create-stack / deploy
      ▼
 스택 (course-network)             ← 설계도로 지은 리소스 묶음 (생명주기 공유)
      │ delete-stack
      ▼
 전부 삭제 (역순은 CFN이 알아서)
```

### 템플릿 해부 — 5개 섹션

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: 한 줄 설명

Parameters:        # ① 입력값 — 환경마다 달라지는 것
  VpcCidr: {Type: String, Default: 10.0.0.0/16}

Mappings:          # ② 조회표 — 리전별 AMI 같은 것 (선택)

Conditions:        # ③ 조건 — "prod일 때만 Multi-AZ" (선택)

Resources:         # ④ ⭐ 핵심 — 만들 리소스 (유일한 필수 섹션)
  CourseVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr

Outputs:           # ⑤ 출력 — 다른 스택·사람에게 알려 줄 값
  VpcId:
    Value: !Ref CourseVpc
    Export: {Name: course-network-VpcId}
```

### 내장 함수 3총사

| 함수 | 뜻 | 예 |
|---|---|---|
| **`!Ref`** | 파라미터 값 또는 리소스의 **기본 식별자** | `!Ref CourseVpc` → vpc-0abc... |
| **`!GetAtt`** | 리소스의 **다른 속성** | `!GetAtt Alb.DNSName` |
| **`!Sub`** | 문자열 안에 값 끼워 넣기 | `!Sub "${AWS::StackName}-vpc"` |

> 💡 리소스 간 **의존 관계는 `!Ref`/`!GetAtt` 로 자동 추적**됩니다. "서브넷은 VPC를 참조하니 VPC 먼저" 를 CFN이 계산합니다 — 스크립트에서 우리가 외우던 그 순서입니다.

### 스택 수명 주기와 실패 롤백

```
 CREATE_IN_PROGRESS ──▶ CREATE_COMPLETE ✅
        │ 하나라도 실패
        ▼
 ROLLBACK_IN_PROGRESS (만든 것 자동 철거) ──▶ ROLLBACK_COMPLETE
                                               └ 🔴 이 상태의 스택은 업데이트 불가 — 삭제 후 재생성
```

**디버깅은 이벤트 탭** — 실패 시 `describe-stack-events` 에서 **첫 번째 `CREATE_FAILED`** 를 찾습니다(그 뒤의 실패들은 롤백 연쇄일 뿐).

### 변경 세트(Change Set) — 적용 전 미리 보기 ⭐

```
 템플릿 수정 → create-change-set → "무엇이 어떻게 바뀌는지" 목록
                                      │
              Action: Modify / Add / Remove
              Replacement: True 🔴  ← "수정"이 아니라 지우고 새로 만든다!
                                      │
              검토 후 execute-change-set (또는 폐기)
```

> 🔴 **Replacement: True가 핵심 위험**입니다. 예: VPC의 CIDR 변경은 수정이 불가능해 **VPC를 삭제 후 재생성** — 그 안의 모든 것이 함께 사라집니다. 변경 세트는 이것을 **적용 전에** 보여 주는 안전장치입니다. 운영 환경에서는 변경 세트 검토가 필수 절차입니다.

### 교차 스택 참조 — Export / ImportValue

```
 [course-network 스택]                [다른 스택]
  Outputs:
    VpcId:
      Export: course-network-VpcId ──▶ !ImportValue course-network-VpcId
```

| 규칙 | 내용 |
|---|---|
| Export 이름은 **리전 내 유일** | 접두사로 스택 이름을 붙이는 관례 |
| **참조되는 동안 삭제·변경 불가** 🔴 | "Export ... is in use" — 참조하는 스택부터 지워야 함 |
| 대안 | SSM 파라미터에 값 저장([22강](lesson-22.md)) — 느슨한 결합 |

### 드리프트(Drift) — 콘솔 손댐 탐지

```
 스택이 아는 상태:  SG 인바운드 = [80 from ALB-SG]
 실제 상태:        SG 인바운드 = [80 from ALB-SG, 22 from 0.0.0.0/0]  ← 누가 콘솔에서!
                                   └──── detect-stack-drift 가 MODIFIED로 보고
```

드리프트가 쌓이면 "템플릿 = 진실"이 무너집니다. **IaC를 시작했으면 수동 변경은 금지**이고, 드리프트 감지는 그 규율의 감사 도구입니다. (누가 바꿨는지는 [22강 CloudTrail](lesson-22.md)로 찾습니다.)

### 도구 비교 — CFN / Terraform / CDK

| | **CloudFormation** | Terraform | CDK |
|---|---|---|---|
| 언어 | YAML/JSON | HCL | **프로그래밍 언어**(TS/Python) |
| 범위 | AWS 전용 | **멀티 클라우드·SaaS** | AWS (CFN으로 합성) |
| 상태 관리 | **AWS가 관리** (스택) | 상태 파일 직접 관리(S3+잠금) | CFN에 위임 |
| 미리 보기 | 변경 세트 | `terraform plan` (호평) | `cdk diff` |
| 선택 기준 | AWS만 · 도구 추가 없이 | 여러 클라우드 병행 | 개발자 중심 팀·추상화 |

> 이 과정은 **CloudFormation**을 씁니다(추가 설치 없음 + 상태 관리 불필요 + 시험 범위). 개념(선언·계획·상태·드리프트)은 세 도구가 같아서 하나를 제대로 익히면 이동이 쉽습니다. 최종 프로젝트는 팀이 CFN/Terraform 중 선택할 수 있습니다.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0 ~ 0.1** — CloudFormation 자체는 무료, 오늘 만드는 리소스(VPC·서브넷·SG)도 전부 무료입니다. NAT는 만들지 않습니다.

### Step 1. 최소 스택 — 생성·이벤트·삭제 한 바퀴 (15분)

```bash
$ mkdir -p iac-lab && cd iac-lab
$ cat > minimal.yaml <<'EOF'
AWSTemplateFormatVersion: "2010-09-09"
Description: 최소 스택 - 비공개 S3 버킷 하나

Resources:
  CourseBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "course-cfn-${AWS::AccountId}"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  BucketName:
    Description: 생성된 버킷 이름
    Value: !Ref CourseBucket
EOF

$ aws cloudformation create-stack --stack-name course-minimal \
    --template-body file://minimal.yaml \
    --tags Key=Project,Value=aws-course
$ aws cloudformation wait stack-create-complete --stack-name course-minimal
```

**이벤트 = 스택의 블랙박스** (시간 역순으로 쌓입니다)

```bash
$ aws cloudformation describe-stack-events --stack-name course-minimal \
    --query 'StackEvents[*].[ResourceStatus,LogicalResourceId]' --output table
--------------------------------------------------
|  CREATE_COMPLETE     |  course-minimal          |
|  CREATE_COMPLETE     |  CourseBucket            |
|  CREATE_IN_PROGRESS  |  CourseBucket            |
|  CREATE_IN_PROGRESS  |  course-minimal          |
--------------------------------------------------
```

**출력값 확인 · 삭제 한 번으로 완전 정리**

```bash
$ aws cloudformation describe-stacks --stack-name course-minimal \
    --query 'Stacks[0].Outputs[0].OutputValue' --output text
course-cfn-123456789012

$ aws cloudformation delete-stack --stack-name course-minimal
$ aws cloudformation wait stack-delete-complete --stack-name course-minimal
$ aws s3 ls | grep course-cfn | wc -l
0
```

> ✅ **만든 것을 스택이 기억했다가 전부 지웁니다.** "지웠나?"를 리소스별로 확인하던 8주간의 체크리스트가 `wait stack-delete-complete` 한 줄로 줄었습니다.

### Step 2. `create-vpc.sh` 의 은퇴식 — 네트워크 템플릿 ⭐ (30분)

07강 스크립트가 하던 일 전부를 템플릿 하나로 옮깁니다. **이 파일이 24강과 최종 프로젝트의 `infra/network.yaml` 이 됩니다.**

```bash
$ cat > network.yaml <<'EOF'
AWSTemplateFormatVersion: "2010-09-09"
Description: AWS course network - 2AZ public/app subnets, IGW, SGs (NAT 없음 = 무료)

Parameters:
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: VPC CIDR (온프레미스와 겹치지 않게)

Resources:
  # ── VPC ────────────────────────────────────────
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags: [{Key: Name, Value: !Sub "${AWS::StackName}-vpc"}]

  # ── 인터넷 게이트웨이 ───────────────────────────
  Igw:
    Type: AWS::EC2::InternetGateway
  IgwAttach:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties: {VpcId: !Ref Vpc, InternetGatewayId: !Ref Igw}

  # ── 서브넷 4개 (퍼블릭 2 + 앱 2) ─────────────────
  PublicA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 8, 8]]   # 10.0.0.0/24
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags: [{Key: Name, Value: !Sub "${AWS::StackName}-public-a"}]
  PublicC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 8, 8]]   # 10.0.1.0/24
      AvailabilityZone: !Select [2, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags: [{Key: Name, Value: !Sub "${AWS::StackName}-public-c"}]
  AppA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 8, 8]]   # 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags: [{Key: Name, Value: !Sub "${AWS::StackName}-app-a"}]
  AppC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 8, 8]]   # 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs ""]
      Tags: [{Key: Name, Value: !Sub "${AWS::StackName}-app-c"}]

  # ── 라우팅: 퍼블릭 → IGW ────────────────────────
  PublicRt:
    Type: AWS::EC2::RouteTable
    Properties: {VpcId: !Ref Vpc}
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: IgwAttach
    Properties:
      RouteTableId: !Ref PublicRt
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref Igw
  PublicARtAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {SubnetId: !Ref PublicA, RouteTableId: !Ref PublicRt}
  PublicCRtAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {SubnetId: !Ref PublicC, RouteTableId: !Ref PublicRt}

  # ── 라우팅: 앱 (local만 — NAT는 필요할 때 추가) ──
  AppRt:
    Type: AWS::EC2::RouteTable
    Properties: {VpcId: !Ref Vpc}
  AppARtAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {SubnetId: !Ref AppA, RouteTableId: !Ref AppRt}
  AppCRtAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {SubnetId: !Ref AppC, RouteTableId: !Ref AppRt}

  # ── 보안 그룹 체인: web ← app ───────────────────
  WebSg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB layer - 80/443 from internet
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - {IpProtocol: tcp, FromPort: 80, ToPort: 80, CidrIp: 0.0.0.0/0}
        - {IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: 0.0.0.0/0}
  AppSg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: App layer - 8080 from WebSg only
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - {IpProtocol: tcp, FromPort: 8080, ToPort: 8080, SourceSecurityGroupId: !Ref WebSg}

Outputs:
  VpcId:
    Value: !Ref Vpc
    Export: {Name: !Sub "${AWS::StackName}-VpcId"}
  PublicSubnets:
    Value: !Join [",", [!Ref PublicA, !Ref PublicC]]
    Export: {Name: !Sub "${AWS::StackName}-PublicSubnets"}
  AppSubnets:
    Value: !Join [",", [!Ref AppA, !Ref AppC]]
    Export: {Name: !Sub "${AWS::StackName}-AppSubnets"}
  WebSgId:
    Value: !Ref WebSg
    Export: {Name: !Sub "${AWS::StackName}-WebSg"}
  AppSgId:
    Value: !Ref AppSg
    Export: {Name: !Sub "${AWS::StackName}-AppSg"}
EOF
```

**배포** — `deploy` 는 생성/업데이트를 알아서 구분합니다(멱등!).

```bash
$ aws cloudformation deploy --stack-name course-network \
    --template-file network.yaml \
    --tags Project=aws-course

Waiting for changeset to be created..
Waiting for stack create/update to complete
Successfully created/updated stack - course-network
```

**한 번 더 실행해도 안전합니다** — 스크립트와의 결정적 차이.

```bash
$ aws cloudformation deploy --stack-name course-network --template-file network.yaml
No changes to deploy. Stack course-network is up to date
```

**출력값 확인**

```bash
$ aws cloudformation describe-stacks --stack-name course-network \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' --output table
----------------------------------------------------------------
|  VpcId          |  vpc-0d1e2f3a4b5c60718                      |
|  PublicSubnets  |  subnet-0aa...,subnet-0bb...                |
|  AppSubnets     |  subnet-0cc...,subnet-0dd...                |
|  WebSgId        |  sg-0ee...                                  |
|  AppSgId        |  sg-0ff...                                  |
----------------------------------------------------------------
```

> ✅ `course-vpc-env.sh` 변수 돌려막기의 종말 — 이제 ID가 필요하면 **스택 출력을 조회**합니다.
> 💡 `!Cidr` 함수가 서브넷 CIDR를 자동 분할하고 `!GetAZs` 가 AZ를 자동 선택합니다 — 하드코딩이 사라졌습니다.

### Step 3. 교차 스택 참조 — Export가 만드는 잠금 (15분)

네트워크 스택의 출력을 **다른 스택**이 가져다 씁니다.

```bash
$ cat > extra-sg.yaml <<'EOF'
AWSTemplateFormatVersion: "2010-09-09"
Description: 교차 스택 참조 실습 - network 스택의 VPC를 Import

Resources:
  MonitoringSg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: cross-stack demo
      VpcId: !ImportValue course-network-VpcId
EOF

$ aws cloudformation deploy --stack-name course-extra --template-file extra-sg.yaml
Successfully created/updated stack - course-extra
```

**이 상태에서 네트워크 스택을 지우면?**

```bash
$ aws cloudformation delete-stack --stack-name course-network
$ sleep 20 && aws cloudformation describe-stacks --stack-name course-network \
    --query 'Stacks[0].[StackStatus,StackStatusReason]' --output text
DELETE_FAILED    Export course-network-VpcId cannot be deleted as it is in use by course-extra
```

> ✅ **참조되는 동안은 못 지웁니다** — 남이 쓰는 VPC를 실수로 날리는 사고를 CFN이 막아 준 것입니다.
> 순서대로 지우면 됩니다: 참조하는 쪽부터.

```bash
$ aws cloudformation delete-stack --stack-name course-extra
$ aws cloudformation wait stack-delete-complete --stack-name course-extra
# course-network는 DELETE_FAILED 상태 → 삭제 재시도
$ aws cloudformation delete-stack --stack-name course-network
$ aws cloudformation wait stack-delete-complete --stack-name course-network
# 다음 실습을 위해 재배포
$ aws cloudformation deploy --stack-name course-network --template-file network.yaml
```

### Step 4. 변경 세트 — Replacement를 미리 본다 ⭐ (20분)

**위험한 변경**(VPC CIDR)을 시도해 봅니다 — 단, **적용 전에** 봅니다.

```bash
$ aws cloudformation create-change-set \
    --stack-name course-network \
    --change-set-name cidr-change-test \
    --template-body file://network.yaml \
    --parameters ParameterKey=VpcCidr,ParameterValue=10.1.0.0/16

$ sleep 10 && aws cloudformation describe-change-set \
    --stack-name course-network --change-set-name cidr-change-test \
    --query 'Changes[*].ResourceChange.[Action,LogicalResourceId,Replacement]' --output table
------------------------------------------------
|  Modify  |  Vpc         |  True     🔴       |
|  Modify  |  PublicA     |  True              |
|  Modify  |  PublicC     |  True              |
|  Modify  |  AppA        |  True              |
|  Modify  |  AppC        |  True              |
|  Modify  |  WebSg       |  True              |
|  ...     |  ...         |  ...               |
------------------------------------------------
```

> 🔴 **Replacement: True 의 연쇄** — CIDR "수정"이 사실은 **VPC 삭제 후 재생성**이고, 그 안의 모든 것이 딸려 갑니다. 운영 환경이었다면 서비스 전체가 사라졌다 다시 만들어지는 변경입니다.
> **변경 세트가 없었다면 이것을 적용하고 나서야 알았을 것입니다.**

**적용하지 않고 폐기합니다.**

```bash
$ aws cloudformation delete-change-set \
    --stack-name course-network --change-set-name cidr-change-test
```

**안전한 변경**(태그 추가)은 `Replacement: False` 로 나오는 것도 확인해 보세요 — `Vpc` 의 `Tags` 에 한 줄 추가 → 변경 세트 → `False` 확인 → 이번엔 `execute-change-set` 으로 적용.

### Step 5. 드리프트 — 콘솔 손댐 잡아내기 (15분)

**일부러 수동 변경**을 합니다(하지 말라는 그것).

```bash
$ APP_SG=$(aws cloudformation describe-stacks --stack-name course-network \
    --query "Stacks[0].Outputs[?OutputKey=='AppSgId'].OutputValue" --output text)
$ aws ec2 authorize-security-group-ingress --group-id $APP_SG \
    --protocol tcp --port 22 --cidr 0.0.0.0/0        # 😱 누군가 콘솔에서 이런 짓을
```

**드리프트 감지**

```bash
$ DRIFT_ID=$(aws cloudformation detect-stack-drift --stack-name course-network \
    --query 'StackDriftDetectionId' --output text)
$ sleep 15 && aws cloudformation describe-stack-resource-drifts \
    --stack-name course-network \
    --stack-resource-drift-status-filters MODIFIED \
    --query 'StackResourceDrifts[*].[LogicalResourceId,StackResourceDriftStatus]' --output table
--------------------------------------
|  AppSg  |  MODIFIED                |
--------------------------------------

$ aws cloudformation describe-stack-resource-drifts --stack-name course-network \
    --stack-resource-drift-status-filters MODIFIED \
    --query 'StackResourceDrifts[0].PropertyDifferences[0]' --output json
{
    "PropertyPath": "/SecurityGroupIngress/2",
    "ExpectedValue": "null",
    "ActualValue": "{\"CidrIp\":\"0.0.0.0/0\",\"FromPort\":22,...}",
    "DifferenceType": "ADD"
}
```

> ✅ **템플릿에 없는 22번 규칙이 정확히 지목**됐습니다. 누가 했는지는 [22강 CloudTrail](lesson-22.md)로 찾고, 원복은 수동 제거 또는 스택 재배포로 합니다.

```bash
$ aws ec2 revoke-security-group-ingress --group-id $APP_SG \
    --protocol tcp --port 22 --cidr 0.0.0.0/0
```

### Step 6. cfn-lint — 배포 전에 잡는다 (10분)

```bash
$ pip install cfn-lint --quiet
$ cfn-lint network.yaml
(출력 없음 = 통과)

# 일부러 오류를 심어 보면
$ sed 's/EnableDnsSupport/EnableDnsSupportt/' network.yaml > broken.yaml
$ cfn-lint broken.yaml
E3002 Additional properties are not allowed ('EnableDnsSupportt' was unexpected.
Did you mean 'EnableDnsSupport'?)
broken.yaml:12:7
$ rm broken.yaml
```

> 💡 **배포해서(수 분) 실패하는 것보다 lint(수 초)로 잡는 것이 쌉니다.** [24강](lesson-24.md) 파이프라인의 첫 단계가 됩니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 이번 강 | 방치 시 월 |
|---|---|---|---|
| CloudFormation | **무료** (리소스만 과금) | $0 | — |
| VPC·서브넷·IGW·라우팅·SG | 무료 | $0 | **$0** ⭐ |
| S3 버킷(Step 1, 삭제함) | ✅ | $0 | — |
| **합계** | | **$0** | **$0** |

> 💡 **오늘의 네트워크 스택은 방치해도 $0입니다**(NAT를 뺐으므로). 그래서 [24강](lesson-24.md)까지 **지우지 않고 둡니다** — IaC가 처음으로 "정리 압박 없는 실습"을 만들어 준 날입니다.

### 🧹 리소스 정리 체크리스트

```bash
# 오늘은 대부분 "유지"가 정답입니다
$ aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
    --query 'StackSummaries[*].StackName' --output text
course-network
```

- [ ] `course-minimal` · `course-extra` 스택 삭제 확인 (Step 1·3에서 완료)
- [ ] 드리프트 실험의 22번 규칙 원복 확인 (Step 5에서 완료)
- [ ] ⭐ **`course-network` 스택은 유지** — 비용 $0, [24강](lesson-24.md)의 기반
- [ ] ⭐ `network.yaml` 파일 보관 — 24강 저장소의 `infra/network.yaml` 이 됩니다
- [ ] `create-vpc.sh` 는 은퇴 — 기념으로 보관만

---

## ⑤ 자주 하는 실수

### 스택이 ROLLBACK_COMPLETE 에서 꼼짝 안 한다

```
An error occurred (ValidationError): Stack:... is in ROLLBACK_COMPLETE state and can not be updated.
```

**원인** — **최초 생성이 실패**해 롤백까지 끝난 스택은 껍데기만 남은 상태라 업데이트가 불가합니다.
**해결** — 삭제 후 원인을 고쳐 재생성합니다.

```bash
$ aws cloudformation delete-stack --stack-name 실패한스택
```

**원인 찾기** — 이벤트에서 **가장 이른 `CREATE_FAILED`** 를 봅니다(뒤의 실패들은 롤백 연쇄).

```bash
$ aws cloudformation describe-stack-events --stack-name 실패한스택 \
    --query "StackEvents[?ResourceStatus=='CREATE_FAILED'].[LogicalResourceId,ResourceStatusReason]" \
    --output table
```

### Export가 물려 있어 삭제/변경이 안 된다

```
DELETE_FAILED ... Export course-network-VpcId cannot be deleted as it is in use by course-extra
```

**원인** — 다른 스택이 `!ImportValue` 로 쓰는 중입니다. **보호 동작**입니다.
**해결** — 참조하는 스택부터 지우거나, 참조를 끊는 업데이트를 먼저 합니다.
**설계 팁** — 스택 간 결합을 느슨하게 하려면 Export 대신 **SSM 파라미터**로 값을 넘기는 방법도 있습니다(참조 잠금이 없는 대신 보호도 없음 — 트레이드오프).

### IAM 리소스가 있는데 Capabilities 오류가 난다

```
An error occurred (InsufficientCapabilitiesException): Requires capabilities : [CAPABILITY_NAMED_IAM]
```

**원인** — 템플릿이 **IAM 역할/정책을 만들면** "권한을 만드는 템플릿임을 인지했다"는 명시적 승인이 필요합니다.
**해결** — `--capabilities CAPABILITY_NAMED_IAM` 을 붙입니다([24강](lesson-24.md)의 app 스택에서 실제로 사용). 이름 없는 IAM이면 `CAPABILITY_IAM`.

### YAML 들여쓰기·문법으로 배포 자체가 거부된다

```
An error occurred (ValidationError): Template format error: YAML not well-formed. (line 23, column 5)
```

**원인** — 들여쓰기(탭 금지, 공백만) · 콜론 뒤 공백 누락 · `!Ref` 오타.
**해결** — **`cfn-lint` 를 먼저** 돌립니다. 문법+스키마+모범 사례까지 잡아 줍니다. 편집기는 YAML 확장(공백 표시)을 켭니다.

### deploy가 "No changes" 라는데 분명히 바꿨다

**원인 후보**

| 원인 | 해결 |
|---|---|
| **다른 파일**을 편집 (network.yaml vs 복사본) | `--template-file` 경로 확인 |
| 파라미터만 바꿨는데 `--parameter-overrides` 누락 | deploy에 명시 |
| 주석·공백만 변경 | 실제 리소스 변화가 없으면 정상 |

### 삭제가 DELETE_FAILED 로 끝난다

**흔한 원인 2가지** ([13강](../02-compute-data/lesson-13.md)·[07강](../01-cloud-foundation/lesson-07.md)의 재림)

| 원인 | 해결 |
|---|---|
| **S3 버킷에 객체가 남음** | 버킷을 비우고 재시도 (CFN은 비우기까지 해 주지 않음) |
| 스택 밖 리소스가 물고 있음 (수동 생성 ENI·SG 참조) | 그 리소스 정리 후 재시도 — **콘솔 수동 작업이 낳은 업보** |

> 💡 반복되는 원인이라면 `delete-stack --retain-resources` 로 문제 리소스만 남기고 지운 뒤 수동 정리하는 최후 수단도 있습니다.

### 파라미터 기본값을 바꿨는데 스택에 반영이 안 된다

**원인** — 스택은 **생성 시점의 파라미터 값**을 기억합니다. 템플릿의 `Default` 는 새 스택에만 적용됩니다.
**해결** — `deploy --parameter-overrides VpcCidr=10.1.0.0/16` 처럼 명시적으로 넘깁니다. 단, **그 변경이 Replacement인지 변경 세트로 먼저 확인**하세요(Step 4의 교훈).

---

## ⑥ 확인 문제

**1.** `create-vpc.sh` 같은 셸 스크립트 대비 CloudFormation이 나은 점을 **멱등성·삭제·실패 처리** 세 관점에서 구체적으로 설명하세요.

<details>
<summary>답 보기</summary>

**① 멱등성** — 스크립트를 두 번 실행하면 VPC가 두 개 생기거나 "이미 존재" 오류로 중단됩니다. `aws cloudformation deploy` 는 **현재 상태와 템플릿의 차이만 계산해 반영**하고, 차이가 없으면 "No changes"로 끝납니다. 같은 명령을 몇 번을 실행해도 결과가 같습니다.

**② 삭제** — 스크립트 시절엔 삭제 순서(NAT→EIP→SG→IGW→서브넷→VPC)를 외워 역순 스크립트를 따로 관리했고, 하나 빠뜨리면 `DependencyViolation` 과 유령 과금이 남았습니다. 스택은 **자신이 만든 리소스 목록과 의존 그래프를 기억**하므로 `delete-stack` 한 번에 올바른 순서로 전부 지웁니다. "정리했는가"의 확인도 `wait stack-delete-complete` 하나입니다.

**③ 실패 처리** — 스크립트가 5번째 명령에서 죽으면 1~4번 리소스가 **반쪽 상태로 방치**되고, 어디까지 됐는지 스크립트는 모릅니다. 스택은 생성 중 실패하면 **만든 것을 자동 롤백**해 "전부 있거나 전부 없거나"를 보장하고, 실패 원인은 이벤트에 기록됩니다.

(덤: 코드 리뷰·변경 세트로 **적용 전 검토**가 가능하다는 것, ID를 변수 파일로 돌려막지 않고 Outputs로 조회한다는 것.)
</details>

**2.** 운영 중인 스택의 파라미터를 바꾸기 전에 변경 세트를 만들어 보니 `Replacement: True` 가 떠 있습니다. 이것이 의미하는 것과, 이때의 올바른 대응 절차는?

<details>
<summary>답 보기</summary>

**의미** — 그 변경은 리소스를 "제자리에서 수정"할 수 없어 **삭제하고 새로 만든다**는 뜻입니다. 예: VPC CIDR, RDS의 일부 속성, 이름이 지정된 리소스의 이름 변경 등.

**그 결과 벌어지는 일**
- 리소스가 **새 물리 ID**로 교체됩니다 (vpc-aaa → vpc-bbb).
- 교체 동안 **중단**이 있을 수 있고, 그 리소스에 담긴 **데이터·상태는 사라질 수 있습니다** (RDS라면 데이터!).
- 그것을 참조하던 리소스들이 **연쇄 교체**될 수 있습니다 (Step 4에서 본 서브넷·SG 연쇄).

**올바른 대응 절차**

```
 ① 변경 세트에서 교체 대상과 연쇄 범위를 확인한다 (이미 했음 — 잘한 것)
 ② 그 변경이 정말 필요한지 재검토 — 대안(새 리소스 병행 생성 후 전환)이 있는가
 ③ 데이터 리소스라면 스냅샷/백업 먼저 + DeletionPolicy 확인
 ④ 진행한다면 점검 시간(유지보수 창)에 execute-change-set
 ⑤ 진행하지 않으면 delete-change-set 으로 폐기 — 스택은 무변화
```

**핵심** — 변경 세트는 "적용 버튼"이 아니라 **"미리 보기"** 입니다. 만들어 보고 폐기하는 것은 공짜이고, 운영에서는 이 검토가 필수 절차(그리고 [24강](lesson-24.md) 파이프라인의 승인 단계)입니다.
</details>

**3.** 팀원이 급하다며 콘솔에서 스택 관리 하의 보안 그룹에 규칙을 직접 추가했습니다. 어떤 문제가 생기고, 무엇으로 탐지하며, 팀 규칙은 어떻게 세워야 하나요?

<details>
<summary>답 보기</summary>

**생기는 문제 — 드리프트(스택 ≠ 실제)**

1. **템플릿이 더 이상 진실이 아닙니다.** 코드만 보고 내린 판단("22번은 안 열려 있다")이 틀리게 됩니다.
2. 다음 스택 업데이트 때 CFN이 그 리소스를 건드리면 수동 변경이 **소리 없이 사라지거나**, 반대로 예상 못 한 충돌이 납니다.
3. 재해 복구 시 템플릿으로 재구축하면 **그 변경만 빠진 환경**이 만들어집니다.

**탐지**

```bash
$ aws cloudformation detect-stack-drift --stack-name course-network
$ aws cloudformation describe-stack-resource-drifts --stack-name course-network \
    --stack-resource-drift-status-filters MODIFIED DELETED
```

`PropertyDifferences` 가 추가/변경/삭제된 속성을 정확히 보여 줍니다. **누가** 했는지는 CloudTrail(`AuthorizeSecurityGroupIngress` 조회, [22강](lesson-22.md))로 찾습니다.

**팀 규칙**

| 규칙 | 내용 |
|---|---|
| **모든 변경은 템플릿으로** | 급한 변경도 "템플릿 수정 → deploy" — 이 경로가 5분이면 예외의 명분이 사라짐([24강](lesson-24.md) 파이프라인이 이를 만듦) |
| 긴급 수동 변경을 했다면 | **즉시 템플릿에 반영**해 드리프트를 0으로 복귀 |
| 정기 드리프트 감지 | 주기 실행(EventBridge 스케줄) + 발견 시 알림 |
| 권한으로 강제 | 운영 환경의 콘솔 쓰기 권한 회수 — 사람은 읽기, 변경은 파이프라인 역할만 |
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 선언형 | "어떻게"가 아니라 **"무엇이 있어야 하는가"** |
| 템플릿 5섹션 | Parameters · Mappings · Conditions · **Resources(필수)** · Outputs |
| 함수 3총사 | `!Ref`(기본 ID) · `!GetAtt`(속성) · `!Sub`(치환) — 의존 순서 자동 |
| deploy | 생성/업데이트 자동 구분 · **멱등** · No changes면 무변화 |
| **변경 세트** | 적용 전 미리 보기 — **Replacement: True** 를 잡는 안전장치 |
| Export/Import | 교차 스택 참조 + **참조 중 삭제 방지** |
| 드리프트 | 콘솔 수동 변경 탐지 — IaC 규율의 감사 도구 |
| 실패 시 | 첫 CREATE_FAILED 이벤트 · ROLLBACK_COMPLETE는 삭제 후 재생성 |
| cfn-lint | 배포(분)보다 린트(초) — 파이프라인 1단계 |

**한 장 요약**

```
  network.yaml (Git) ──cfn-lint──▶ deploy ──▶ 스택 course-network
                                     │            ├ Outputs/Export → 다른 스택이 Import
        바꾸고 싶으면: 변경 세트 ──검토(Replacement?)──▶ execute
        지우고 싶으면: delete-stack 한 줄  /  손대면: 드리프트로 발각
```

**오늘 반드시 기억할 한 가지**
> **오늘부터 인프라의 진실은 콘솔이 아니라 Git의 템플릿입니다.**
> 그리고 운영 변경은 반드시 변경 세트로 미리 봅니다 — Replacement는 수정이 아니라 재생성입니다.

**과제**
1. **network.yaml 배포 증빙** — deploy 성공, 재실행 시 "No changes", Outputs 표.
2. **변경 세트 실험 기록** — CIDR 변경의 Replacement: True 연쇄 목록과 "운영이었다면 무슨 일이 났을지" 3줄, 그리고 폐기 확인.
3. **드리프트 실험 기록** — 수동 규칙 추가 → MODIFIED 탐지 → PropertyDifferences → 원복까지.
4. network.yaml 에 **DB 서브넷 2개(10.0.4.0/24, 10.0.5.0/24)와 DbSg(3306 from AppSg)를 추가**해 배포하세요 — 07강 구조의 완성판. (변경 세트로 먼저 확인!)
5. CFN/Terraform/CDK 비교표를 직접 작성하고 "우리 팀이라면"의 선택과 근거 5줄.
6. 정리 확인 — `list-stacks` 에 `course-network` 하나만 남은 출력.

---

[← 이전 22강](lesson-22.md) · [목차](README.md) · [다음 → 24강 🏁 CI/CD 자동 배포](lesson-24.md)
