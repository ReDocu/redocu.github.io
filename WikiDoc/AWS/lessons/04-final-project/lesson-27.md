# 27강 · 스프린트 1 — 네트워크·데이터 계층

> **AWS 학습 매뉴얼** · 🔴 대단원 04 · **27강 / 총 32강**
> [← 이전 26강](lesson-26.md) · [목차](README.md) · [다음 → 28강 스프린트 2 — 애플리케이션·CI/CD](lesson-28.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 스택을 **수명 주기 기준으로 분리**(네트워크/데이터/앱)해 설계할 수 있다.
- 교차 스택 참조와 SSM 파라미터 중 상황에 맞는 결합 방식을 선택할 수 있다.
- 네트워크 스택을 배포하고 **M1 설계대로 구현됐는지 대조**할 수 있다.
- 데이터 계층을 **KMS 암호화·프라이빗 배치**로 배포할 수 있다.
- `DeletionPolicy` 로 **데이터 리소스가 실수로 삭제되지 않게** 보호할 수 있다.

---

## ② 왜 필요한가

M1에서 그린 다이어그램을 이제 **실체로** 만듭니다. 그런데 24강까지처럼 하나의 큰 템플릿에 다 넣으면 문제가 생깁니다.

```
 [단일 스택]
  network + data + app 을 한 템플릿에
  → 앱 코드 한 줄 고쳐 배포할 때마다 VPC·RDS까지 변경 검토 대상
  → 앱 배포 실패가 롤백되며 네트워크·DB를 위협
  → 배포가 느리고 무섭다
```

실무는 **수명 주기가 다른 것을 분리**합니다.

```
 [분리된 스택]
  course-network  ← 거의 안 바뀜 (한 번 만들고 몇 달)
  course-data     ← 가끔 바뀜 (스키마·백업 정책)
  course-app      ← 하루에도 여러 번 (24강 파이프라인이 이것만 건드림)
```

이렇게 하면 [24강](../03-serverless-automation/lesson-24.md) 파이프라인이 **app 스택만 롤링**하면서, 네트워크와 데이터는 안전하게 자리를 지킵니다. 우리는 이미 그 구조의 절반(network + app)을 24강에서 만들었습니다. 오늘은 **데이터 계층을 추가**하고 세 스택 체계를 완성합니다.

이번 주 목표는 **M2** — 서비스가 실제로 배포되어 `https://` 로 열리는 것. 오늘(27강)은 그 아래 두 층(네트워크·데이터)을 세웁니다.

---

## ③ 워크숍 가이드 — 스택 분리 전략

### 저장소 구조 확정

24강 `course-deploy` 저장소를 이어 씁니다. 데이터 스택을 추가합니다.

```
 course-deploy/
 ├── app/
 ├── infra/
 │   ├── network.yaml    ← 23강 (그대로)
 │   ├── data.yaml       ← 오늘 추가
 │   └── app.yaml        ← 24강 (28강에서 보강)
 └── .github/workflows/deploy.yml
```

### 스택을 나누는 기준 — 수명 주기

| 스택 | 변경 빈도 | 무엇이 들어가나 | `DeletionPolicy` |
|---|---|---|---|
| network | 거의 없음 | VPC·서브넷·라우팅·SG·(NAT/엔드포인트) | — |
| **data** | 가끔 | RDS·시크릿 연결·백업·KMS 참조 | **Snapshot/Retain** ⭐ |
| app | 매우 잦음 | ALB·ECS·태스크 정의 | Delete(기본) |

> 🔑 **기준은 "함께 태어나고 함께 죽는가"** 입니다. RDS는 앱보다 오래 살아야 하고(데이터!), 앱 롤백에 딸려 삭제되면 안 됩니다. 그래서 분리합니다.

### 스택 간 값 전달 — 두 가지 방법

| | Export/ImportValue | SSM 파라미터 |
|---|---|---|
| 결합 | 강함(참조 중 삭제 방지) | 느슨함 |
| 보호 | ✅ 참조되면 삭제 불가 | ❌ 값이 없어도 배포됨(런타임 실패) |
| 언제 | 인프라 뼈대(VPC·SG) | 자주 바뀌는 값·순환 참조 회피 |

> [23강](../03-serverless-automation/lesson-23.md)에서 network가 Export한 VpcId·서브넷·SG를 data와 app이 ImportValue로 씁니다. 강한 결합이 여기선 **안전장치**입니다 — network를 실수로 못 지우게 하니까.

### DeletionPolicy — 데이터를 지키는 한 줄 ⭐

```yaml
Resources:
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot        # 스택 삭제 시 스냅샷 뜨고 삭제
    UpdateReplacePolicy: Snapshot   # 교체(Replacement) 시에도 스냅샷
    Properties: ...
```

| 값 | 스택/리소스 삭제 시 |
|---|---|
| `Delete`(기본) | **함께 삭제** — 앱 리소스엔 OK, 데이터엔 🔴 재앙 |
| `Snapshot` | 스냅샷을 뜨고 삭제(RDS·EBS) |
| `Retain` | 삭제하지 않고 남김 |

> 🔴 **`DeletionPolicy` 없이 RDS를 스택에 넣으면**, 누군가 `delete-stack` 하거나 CIDR 변경 같은 Replacement가 일어날 때 **데이터가 사라집니다.** [23강 변경 세트](../03-serverless-automation/lesson-23.md)에서 본 그 위험입니다. 이 한 줄이 방어선입니다.

### 데이터 스택에 들어갈 것 (M1 설계 반영)

```
 data.yaml
   ├─ DB 서브넷 그룹 (network의 DB 서브넷 Import)
   ├─ DB 보안 그룹 (network의 AppSg를 소스로 3306)
   ├─ RDS 인스턴스 (Multi-AZ, KMS 암호화, 자동 백업 7일, 프라이빗)
   │    DeletionPolicy: Snapshot
   └─ Outputs: DB 엔드포인트 → app 스택이 사용
```

> ⚠️ **비밀번호는 템플릿에 넣지 않습니다.** [15강](../02-compute-data/lesson-15.md)·[25강](lesson-25.md)대로 Secrets Manager 동적 참조(`{{resolve:secretsmanager:...}}`)를 씁니다.

### 이번 주 비용 경보 🔴

27강부터가 **최종 프로젝트 최대 비용 구간**입니다.

| 리소스 | 상시 가동 시 월 |
|---|---|
| RDS Multi-AZ | ~$38 |
| NAT Gateway | ~$42 |
| ALB(28강) | ~$16 |
| KMS·Secrets | ~$1.4 |

팀 4주 합계 $60 한도를 지키려면 **세 가지 중 최소 두 개**를 반드시 적용:
① 작업 시간 외 축소(RDS 중지·ECS 0) ② NAT → VPC 엔드포인트 ③ 야간 자동 축소([30강](lesson-30.md)).

---

## ④ 스프린트 작업 — 네트워크·데이터 배포

> 💰 **예상 비용 $0.5 ~ 1.0/팀·주** — RDS·NAT가 주요 비용. **작업 후 RDS 중지·NAT 삭제 필수.**
> 24강 `course-network` 스택과 배포 역할·저장소가 전제입니다.

### Step 1. network.yaml 완성 — DB 서브넷 추가 (인프라, 25분)

23강 network.yaml에 **DB 서브넷 2개와 DbSg**를 추가합니다(23강 과제 4번). Resources에 추가:

```yaml
  DbA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Select [4, !Cidr [!Ref VpcCidr, 8, 8]]   # 10.0.4.0/24
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags: [{Key: Name, Value: !Sub "${AWS::StackName}-db-a"}]
  DbC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Select [5, !Cidr [!Ref VpcCidr, 8, 8]]   # 10.0.5.0/24
      AvailabilityZone: !Select [2, !GetAZs ""]
      Tags: [{Key: Name, Value: !Sub "${AWS::StackName}-db-c"}]
  DbSg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: DB layer - 3306 from AppSg only
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - {IpProtocol: tcp, FromPort: 3306, ToPort: 3306, SourceSecurityGroupId: !Ref AppSg}
```

Outputs에 추가:

```yaml
  DbSubnets:
    Value: !Join [",", [!Ref DbA, !Ref DbC]]
    Export: {Name: !Sub "${AWS::StackName}-DbSubnets"}
  DbSgId:
    Value: !Ref DbSg
    Export: {Name: !Sub "${AWS::StackName}-DbSg"}
```

**변경 세트로 먼저 확인** (23강 교훈 — 서브넷 추가는 안전하지만 습관을)

```bash
$ cd course-deploy
$ aws cloudformation deploy --stack-name course-network \
    --template-file infra/network.yaml --no-execute-changeset
# 출력된 change-set 검토 → Add만 있고 Replacement 없음 확인 후:
$ aws cloudformation deploy --stack-name course-network --template-file infra/network.yaml
```

### Step 2. VPC 엔드포인트로 NAT 대체 계획 (인프라, 15분)

M1 리뷰에서 "단일 NAT" 지적을 받았다면 여기서 해결합니다. 앱이 ECR·S3·Secrets·Logs만 접근한다면 NAT가 필요 없습니다.

```yaml
  # network.yaml 또는 별도 endpoints 섹션
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.s3"
      VpcEndpointType: Gateway
      RouteTableIds: [!Ref AppRt]
  # ecr.api, ecr.dkr, secretsmanager, logs 는 인터페이스형 (선택)
```

> 💡 **판단**: 앱이 외부 인터넷(타사 API)을 호출하면 NAT가 필요합니다. AWS 서비스만 접근하면 **엔드포인트로 NAT $42를 없앱니다.** 팀 결정표에 근거를 남기세요. (S3 게이트웨이 엔드포인트는 무료 — ECR 이미지 레이어가 S3에서 오므로 필수)

### Step 3. data.yaml 작성 (애플리케이션, 30분)

```bash
$ cat > infra/data.yaml <<'EOF'
AWSTemplateFormatVersion: "2010-09-09"
Description: Course final - data layer (RDS Multi-AZ, encrypted, private)

Parameters:
  NetworkStack:
    Type: String
    Default: course-network
  SecretArn:
    Type: String
    Description: Secrets Manager ARN for DB credentials
  KmsKeyId:
    Type: String
    Description: KMS key for storage encryption

Resources:
  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: course db subnets
      SubnetIds: !Split [",", {"Fn::ImportValue": !Sub "${NetworkStack}-DbSubnets"}]

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-mysql"
      Engine: mysql
      EngineVersion: "8.0"
      DBInstanceClass: db.t3.micro
      AllocatedStorage: "20"
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KmsKeyId
      MultiAZ: true
      PubliclyAccessible: false
      MasterUsername: !Sub "{{resolve:secretsmanager:${SecretArn}:SecretString:username}}"
      MasterUserPassword: !Sub "{{resolve:secretsmanager:${SecretArn}:SecretString:password}}"
      DBName: eventapp
      DBSubnetGroupName: !Ref DbSubnetGroup
      VPCSecurityGroups: [{"Fn::ImportValue": !Sub "${NetworkStack}-DbSg"}]
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "18:00-18:30"
      DeletionProtection: false      # 실습용. 운영은 true
      Tags: [{Key: Project, Value: aws-course}]

Outputs:
  DbEndpoint:
    Value: !GetAtt Database.Endpoint.Address
    Export: {Name: !Sub "${AWS::StackName}-DbEndpoint"}
EOF
```

> 📌 **`{{resolve:secretsmanager:...}}`** 가 비밀번호를 템플릿에 노출하지 않고 배포 시점에 주입합니다. 시크릿은 25강에서 만든 `course/final/db`(W14용으로 유지했다면) 또는 새로 만듭니다.

### Step 4. 시크릿·키 준비 후 데이터 스택 배포 (30분)

```bash
# 25강 시크릿을 지웠다면 다시 생성
$ DB_PW=$(aws secretsmanager get-random-password --exclude-punctuation \
    --password-length 20 --query RandomPassword --output text)
$ SECRET_ARN=$(aws secretsmanager create-secret --name course/final/db \
    --secret-string "{\"username\":\"admin\",\"password\":\"$DB_PW\"}" \
    --query ARN --output text)

# 25강 KMS 키 (유지했으면 그 ID, 아니면 재생성)
$ KEY_ID=$(aws kms describe-key --key-id alias/course-final \
    --query 'KeyMetadata.KeyId' --output text 2>/dev/null || \
    aws kms create-key --query 'KeyMetadata.KeyId' --output text)

# 데이터 스택 배포 (RDS 생성 10~15분)
$ aws cloudformation deploy --stack-name course-data \
    --template-file infra/data.yaml \
    --parameter-overrides SecretArn=$SECRET_ARN KmsKeyId=$KEY_ID \
    --tags Project=aws-course
```

> ⏱ RDS 생성 대기 중 Step 5를 진행합니다.

### Step 5. 설계 대조 검증 (인프라, 20분)

배포 결과가 **M1 설계와 일치하는지** CLI로 대조합니다.

```bash
# 서브넷 6개, DB 서브넷이 프라이빗(라우팅에 IGW 없음)인가
$ VPC=$(aws cloudformation describe-stacks --stack-name course-network \
    --query "Stacks[0].Outputs[?OutputKey=='VpcId'].OutputValue" --output text)
$ aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC" \
    --query 'length(Subnets)'
6

# RDS가 암호화·Multi-AZ·비공개인가
$ aws cloudformation wait stack-create-complete --stack-name course-data 2>/dev/null || \
  aws cloudformation wait stack-update-complete --stack-name course-data 2>/dev/null
$ aws rds describe-db-instances --db-instance-identifier course-data-mysql \
    --query 'DBInstances[0].[StorageEncrypted,MultiAZ,PubliclyAccessible]' --output text
True    True    False

# DB 엔드포인트가 사설 IP만 반환하는가
$ DB_EP=$(aws cloudformation describe-stacks --stack-name course-data \
    --query "Stacks[0].Outputs[?OutputKey=='DbEndpoint'].OutputValue" --output text)
$ dig +short $DB_EP | head -1
10.0.4.xxx      ← 사설 IP = 비공개 확인
```

> ✅ **설계서의 각 항목(암호화·Multi-AZ·프라이빗)이 실제로 True인지** 대조하는 것이 이 단계입니다. 문서와 실물이 어긋나면 드리프트의 시작입니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 작업(6h) | 상시 월 |
|---|---|---|---|
| **RDS Multi-AZ** | ❌ | 약 $0.32 | 🔴 **$38** |
| RDS 스토리지 | ✅ 20GB | $0 | $2.9 |
| **NAT Gateway**(엔드포인트 미채택 시) | ❌ | 약 $0.36 | 🔴 **$42** |
| VPC 엔드포인트(채택 시) | ❌ | 약 $0.08 | ~$28(NAT보다 저렴) |
| KMS·Secrets | ❌ | ~$0 | $1.4 |
| **합계(팀·주)** | | **약 $0.8** | — |

> 🔴 **작업이 끝나면 RDS를 중지**하세요(최대 7일). Multi-AZ RDS를 4주 상시 켜면 그것만으로 한도를 넘습니다.

### 🧹 리소스 정리 체크리스트

```bash
# 작업 종료 시: RDS 중지 (삭제 아님 — 데이터 유지, 7일 후 자동 재시작 주의)
$ aws rds stop-db-instance --db-instance-identifier course-data-mysql

# NAT를 썼다면 삭제(엔드포인트는 유지)
# (NAT ID 확인 후 delete-nat-gateway + release-address)

# 주말·장기 중단이면 데이터 스택 삭제 (DeletionPolicy:Snapshot이 지켜줌)
# → 재개 시 deploy로 복원 + 스냅샷에서 데이터
```

- [ ] 작업 후 **RDS 중지**(또는 데이터 스택 삭제 — 스냅샷 확인)
- [ ] NAT 삭제(엔드포인트 채택 시 불필요)
- [ ] ⭐ **network·data 스택 유지**(28강에서 app이 참조)
- [ ] ⭐ 시크릿·KMS 키 유지
- [ ] 팀 주간 비용 확인·공유

---

## ⑤ 자주 하는 실수

### 데이터 스택을 지웠는데 DB가 함께 사라졌다

**원인** — `DeletionPolicy: Snapshot`(또는 Retain)을 빠뜨렸습니다. 기본값 Delete라 스택 삭제 시 RDS와 데이터가 함께 소멸합니다.
**해결** — RDS·EBS 같은 데이터 리소스에는 **반드시 `DeletionPolicy`** 를 붙입니다(Step 3). 이미 늦었다면 자동 백업이 있으면 그것으로, 없으면 복구 불가 — 그래서 이 한 줄이 중요합니다.

### `{{resolve:secretsmanager}}` 가 그대로 문자열로 들어간다

**증상** — DB 비밀번호가 `{{resolve:...}}` 리터럴이 됩니다.
**원인** — 동적 참조 문법 오타(콜론 구분자·시크릿 키 이름) 또는 배포 역할에 시크릿 읽기 권한 없음.
**해결** — 형식은 `{{resolve:secretsmanager:시크릿ARN또는이름:SecretString:JSON키}}`. 배포 역할에 `secretsmanager:GetSecretValue` 확인.

### RDS 생성이 KMS 접근 거부로 실패한다

```
Access to KMS is not allowed
```
**원인** — 배포 역할 또는 RDS 서비스가 그 KMS 키를 쓸 권한이 없습니다.
**해결** — KMS 키 정책에 RDS 서비스와 배포 역할의 사용 권한을 추가하거나, 실습에선 기본 키(`alias/aws/rds`)를 씁니다. CMK를 쓰면 키 정책 관리가 따라옵니다([25강](lesson-25.md)).

### ImportValue가 "cannot be imported" 오류

```
No export named course-network-DbSubnets found
```
**원인** — network 스택에 DbSubnets Export를 추가하기 전에 data를 배포했습니다(순서 문제), 또는 Export 이름 오타.
**해결** — network를 먼저 배포(Step 1)해 Export가 존재하는지 `aws cloudformation list-exports` 로 확인 후 data 배포.

### 앱에서 DB 연결이 안 된다 (아직 앱이 없어도 미리 점검)

**원인** — DbSg가 AppSg를 소스로 3306을 허용해야 하는데, 두 SG가 같은 VPC가 아니거나 참조가 끊김.
**해결** — network 스택 안에서 DbSg가 `!Ref AppSg` 로 참조하게 합니다(Step 1). 스택을 나눠 SG가 다른 스택이면 SourceSecurityGroupId를 ImportValue로.

### RDS를 중지했는데 7일 뒤 다시 켜져 과금된다

**원인** — RDS 중지는 **최대 7일** 후 AWS가 자동 재시작합니다([15강](../02-compute-data/lesson-15.md)).
**해결** — 장기 중단이면 **스냅샷 뜨고 삭제**(또는 데이터 스택 삭제 — Snapshot 정책이 처리). 재개 시 deploy로 복원. 7일 이내 재개면 중지로 충분합니다.

---

## ⑥ 마일스톤 점검 (M2 진행 중)

오늘은 M2(28강 완료)의 절반 — 네트워크·데이터 층입니다.

**오늘 완료 확인**

- [ ] network 스택에 DB 서브넷 2개 + DbSg 추가·배포
- [ ] NAT vs 엔드포인트 결정(근거 기록)
- [ ] data 스택 배포 — RDS Multi-AZ·KMS 암호화·프라이빗
- [ ] 설계 대조 검증 3종(서브넷 수·RDS 속성·사설 IP) 통과
- [ ] 작업 후 RDS 중지 + 비용 확인

**스스로 점검하는 질문 3개**

<details>
<summary>1. 왜 network·data·app을 하나의 스택에 넣지 않았나요?</summary>

**수명 주기가 다르기 때문**입니다. app은 하루에도 여러 번 배포되지만 network는 거의 안 바뀌고 data는 그 사이입니다. 하나로 묶으면 ① 앱 배포마다 VPC·RDS까지 변경 검토 대상이 되고 ② 앱 배포 실패 롤백이 네트워크·DB를 위협하며 ③ 배포가 느립니다. 분리하면 [24강](../03-serverless-automation/lesson-24.md) 파이프라인이 app만 안전하게 롤링합니다.
</details>

<details>
<summary>2. data 스택에 DeletionPolicy가 없으면 어떤 사고가 나나요?</summary>

**RDS와 데이터가 실수로 삭제됩니다.** 누군가 `delete-stack` 하거나, CIDR 변경 같은 Replacement가 일어나거나, 파이프라인이 스택을 재생성할 때 — 기본값 Delete면 데이터가 사라집니다. `DeletionPolicy: Snapshot`(+`UpdateReplacePolicy: Snapshot`)이 스냅샷을 뜨고 지우게 해 최소한 복구 지점을 남깁니다. [23강 변경 세트](../03-serverless-automation/lesson-23.md)에서 본 Replacement 위험의 방어선입니다.
</details>

<details>
<summary>3. NAT를 VPC 엔드포인트로 바꾸면 무엇을 얻고 무엇을 포기하나요?</summary>

**얻는 것**: 월 ~$14 절감(NAT $42 vs 엔드포인트 ~$28), 트래픽이 AWS 내부에만 흘러 보안 향상, 단일 NAT 장애점 제거. **포기하는 것**: 일반 인터넷 접근 — 앱이 타사 API를 호출하면 안 됩니다. 그래서 판단은 "앱이 AWS 서비스만 접근하는가"입니다. ECR·S3·Secrets·Logs만 쓰면 엔드포인트가 낫고, 외부 API(결제 게이트웨이 등)를 부르면 NAT가 필요합니다. S3는 **게이트웨이 엔드포인트가 무료**라 어느 경우든 붙입니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 스택 분리 | **수명 주기 기준** — network/data/app |
| Export/Import | 강한 결합 = **삭제 방지 안전장치** |
| **DeletionPolicy** | 데이터 리소스에 Snapshot/Retain 필수 |
| 동적 참조 | `{{resolve:secretsmanager:...}}` — 비밀번호 미노출 |
| NAT vs 엔드포인트 | AWS만 접근하면 엔드포인트(절감), 외부 API면 NAT |
| 설계 대조 | 배포 후 M1 설계와 실물을 CLI로 대조 |
| 비용 | RDS Multi-AZ·NAT — **작업 후 중지·삭제 필수** |

**한 장 요약**

```
  network.yaml (VPC·서브넷·SG·엔드포인트)
       │ Export
       ▼
  data.yaml (RDS Multi-AZ·KMS·프라이빗, DeletionPolicy:Snapshot)
       │ Export: DbEndpoint
       ▼
  app.yaml (28강) → M2 완성
```

**오늘 반드시 기억할 한 가지**
> **데이터 리소스에는 DeletionPolicy를, 스택은 수명 주기로 나눕니다.**
> 그리고 RDS Multi-AZ는 작업이 끝나면 반드시 중지합니다 — 4주 상시면 한도를 넘습니다.

**과제 (팀)**
1. network.yaml에 DB 서브넷·DbSg 추가 배포 증빙(변경 세트에 Replacement 없음 확인 포함).
2. NAT vs 엔드포인트 결정서 + 근거.
3. data.yaml 전문 + 배포 성공 + 설계 대조 검증 3종 출력.
4. `DeletionPolicy` 를 뺐을 때/넣었을 때의 차이를 3줄로 설명.
5. 팀 주간 비용 리포트 + 적용한 절감 조치.

---

[← 이전 26강](lesson-26.md) · [목차](README.md) · [다음 → 28강 스프린트 2 — 애플리케이션·CI/CD](lesson-28.md)
