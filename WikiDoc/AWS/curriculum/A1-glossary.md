# 부록 A1 · AWS 과정 용어집

> AWS 과정 · 색상 `#ff9900` · 문서 버전 v1.0 · 작성일 2026-08-13
> [← 전체 로드맵](README.md) · [부록 A2 — 수료 후 학습 경로 →](A2-next-steps.md)

이 과정에서 사용하는 용어를 처음 나오는 강 순서로 정리했습니다.
**약어는 반드시 풀어쓰기를 먼저 읽고** 그 뜻으로 기억하세요. 시험(SAA-C03)에서도 용어의 정확한 구분이 점수를 가릅니다.

---

## 1. 클라우드 기본 (01–02강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| 리전 (Region) | — | 지리적으로 분리된 AWS 인프라 지역. 이 과정은 서울 `ap-northeast-2` 사용 |
| 가용 영역 (AZ) | Availability Zone | 한 리전 안에서 전원·냉각·네트워크가 물리적으로 분리된 데이터센터 묶음. **고가용성의 최소 단위** |
| 엣지 로케이션 | Edge Location | CloudFront 등이 콘텐츠를 캐싱하는 전 세계 접점 |
| 책임 공유 모델 | Shared Responsibility Model | AWS는 "클라우드 자체(of)"를, 고객은 "클라우드 안(in)"을 책임 |
| 탄력성 | Elasticity | 수요에 따라 자원을 자동으로 늘리고 줄이는 성질 |
| 온디맨드 | On-Demand | 약정 없이 시간(초) 단위로 쓰는 기본 과금 방식 |
| Savings Plans | — | 1·3년 사용량 약정으로 할인받는 방식 |
| 스팟 인스턴스 | Spot Instance | 여유 용량을 크게 할인받아 쓰되 **2분 통보 후 회수될 수 있는** 인스턴스 |
| 프리 티어 | Free Tier | 무료 사용 한도. 12개월 무료 / 상시 무료 / 평가판 3종(계정 개설 시점에 따라 정책 상이) |
| CapEx / OpEx | Capital / Operational Expenditure | 자산 구매 비용 / 운영 비용. 클라우드는 후자 중심 |

## 2. 계정과 보안 (02–04강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| 루트 사용자 | Root User | 계정 생성 시 만들어지는 최고 권한 주체. **일상 작업에 쓰지 않는다** |
| IAM | Identity and Access Management | AWS 접근 권한 관리 서비스 |
| MFA | Multi-Factor Authentication | 비밀번호 외 추가 인증 수단(앱·하드웨어 키) |
| 주체 (Principal) | — | 요청을 보내는 대상(사용자·역할·서비스) |
| 정책 (Policy) | — | 무엇을 허용/거부할지 정의한 JSON 문서 |
| 역할 (Role) | Role | 임시 자격 증명을 발급받아 맡는 권한 묶음. **서비스·애플리케이션용** |
| 신뢰 정책 | Trust Policy | 누가 이 역할을 맡을 수 있는지 정의 |
| STS | Security Token Service | 만료되는 임시 자격 증명을 발급하는 서비스 |
| 인스턴스 프로파일 | Instance Profile | EC2에 IAM 역할을 붙이는 매개체 |
| 최소 권한 | Least Privilege | 필요한 작업에 필요한 만큼만 권한을 주는 원칙 |
| 권한 경계 | Permissions Boundary | 어떤 주체가 가질 수 있는 **권한의 상한** |
| SCP | Service Control Policy | AWS Organizations에서 계정 전체에 거는 권한 상한 |
| IAM Identity Center | (구 AWS SSO) | 여러 계정에 대한 통합 로그인·권한 관리 |

## 3. CLI와 컴퓨팅 (05–10강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| AWS CLI | Command Line Interface | 터미널에서 AWS를 조작하는 도구(v2 사용) |
| CloudShell | — | 브라우저에서 바로 쓰는 자격 증명이 주입된 셸 |
| JMESPath | — | CLI `--query` 에 쓰는 JSON 필터 문법 |
| EC2 | Elastic Compute Cloud | 가상 서버 서비스 |
| AMI | Amazon Machine Image | 인스턴스를 만들 때 쓰는 디스크 이미지(OS+설정) |
| 사용자 데이터 | User Data | 인스턴스 **최초 부팅 시 1회** 실행되는 스크립트 |
| IMDS | Instance Metadata Service | 인스턴스가 자기 정보·임시 자격 증명을 얻는 내부 엔드포인트. **IMDSv2 강제 권장** |
| 시작 템플릿 | Launch Template | 인스턴스 생성 설정을 버전으로 관리하는 틀 |
| ASG | Auto Scaling Group | 인스턴스 수를 자동으로 유지·확장·교체하는 그룹 |
| 타깃 추적 | Target Tracking | "CPU 50% 유지"처럼 목표값을 좇는 조정 정책 |
| 인스턴스 새로 고침 | Instance Refresh | ASG 인스턴스를 새 설정으로 순차 교체하는 기능 |
| 세션 관리자 | Session Manager | SSH 포트 없이 인스턴스에 접속하는 SSM 기능 |

## 4. 네트워크 (07–08, 11–12강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| VPC | Virtual Private Cloud | 내 전용 가상 네트워크 |
| CIDR | Classless Inter-Domain Routing | `10.0.0.0/16` 처럼 IP 대역을 표기하는 방식 |
| 서브넷 | Subnet | VPC를 AZ 단위로 나눈 IP 구간 |
| 퍼블릭 서브넷 | — | 라우팅 테이블에 **IGW로 향하는 `0.0.0.0/0`** 이 있는 서브넷 |
| IGW | Internet Gateway | VPC를 인터넷과 연결하는 관문(양방향) |
| NAT Gateway | Network Address Translation | 프라이빗 리소스의 **아웃바운드 전용** 인터넷 통로. 시간당·데이터당 과금 |
| 보안 그룹 | Security Group | ENI 단위 **상태 저장** 방화벽. 허용 규칙만 존재 |
| NACL | Network Access Control List | 서브넷 단위 **상태 비저장** 방화벽. 허용·거부 모두 가능 |
| VPC 엔드포인트 | VPC Endpoint | 인터넷을 거치지 않고 AWS 서비스에 접근하는 통로(게이트웨이형·인터페이스형) |
| Flow Logs | VPC Flow Logs | 네트워크 트래픽 허용/거부 기록 |
| ELB | Elastic Load Balancing | 트래픽 분산 서비스군 |
| ALB / NLB | Application / Network Load Balancer | L7(HTTP) / L4(TCP·UDP) 로드밸런서 |
| 대상 그룹 | Target Group | 로드밸런서가 트래픽을 보내는 대상(인스턴스·IP·Lambda) 묶음 |
| 헬스 체크 | Health Check | 대상이 정상인지 주기적으로 확인하는 절차 |
| 연결 드레이닝 | Deregistration Delay | 대상 제거 시 진행 중 요청을 마치도록 기다리는 시간 |
| Route 53 | — | AWS DNS 서비스 |
| Alias 레코드 | — | AWS 리소스를 가리키는 Route 53 전용 레코드. **zone apex 사용 가능·조회 무료** |
| ACM | AWS Certificate Manager | 무료 TLS 인증서 발급·자동 갱신 서비스 |

## 5. 스토리지와 데이터베이스 (13–17강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| S3 | Simple Storage Service | 객체 스토리지. 버킷–키–객체 구조 |
| 퍼블릭 액세스 차단 | Block Public Access | 버킷이 실수로 공개되는 것을 막는 계정·버킷 수준 설정 |
| 사전 서명 URL | Presigned URL | 버킷을 열지 않고 일정 시간만 접근을 허용하는 URL |
| 수명 주기 규칙 | Lifecycle Rule | 일정 기간 후 스토리지 클래스 전환·삭제를 자동화 |
| EBS | Elastic Block Store | 인스턴스에 붙이는 블록 스토리지(AZ 종속) |
| 스냅샷 | Snapshot | EBS의 증분 백업. 다른 AZ·리전으로 복원 가능 |
| EFS | Elastic File System | 여러 인스턴스가 동시 마운트하는 NFS 파일 스토리지 |
| CloudFront | — | CDN. 엣지에서 캐싱해 지연과 전송 비용을 줄임 |
| OAC | Origin Access Control | CloudFront만 S3에 접근하도록 제한하는 방식 |
| 무효화 | Invalidation | CDN 캐시를 강제로 만료시키는 작업(월 1000경로 초과 시 유료) |
| RDS | Relational Database Service | 관리형 관계형 데이터베이스 |
| Multi-AZ | — | 다른 AZ에 대기 인스턴스를 두는 **가용성** 구성(동기 복제) |
| 읽기 전용 복제본 | Read Replica | 읽기 부하 분산용 **성능** 구성(비동기 복제) |
| PITR | Point-In-Time Recovery | 특정 시점 상태로 복원하는 기능 |
| Aurora | — | AWS가 만든 고성능 관계형 DB(MySQL/PostgreSQL 호환) |
| DynamoDB | — | 관리형 키-값·문서 NoSQL. 파티션 키 기반 수평 확장 |
| 파티션 키 | Partition Key | DynamoDB에서 데이터 분산을 결정하는 기본 키 |
| GSI | Global Secondary Index | 다른 키로 조회할 수 있게 추가하는 인덱스 |
| ElastiCache | — | 관리형 Redis/Memcached 인메모리 캐시 |
| cache-aside | Lazy Loading | 캐시에 없으면 DB에서 읽고 캐시에 채우는 전략 |

## 6. 서버리스와 통합 (18–20강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| Lambda | — | 서버 관리 없이 코드를 실행하는 서비스. 요청·실행시간·메모리로 과금 |
| 콜드 스타트 | Cold Start | 실행 환경이 새로 준비될 때 생기는 초기 지연 |
| 동시성 | Concurrency | 동시에 실행되는 함수 인스턴스 수(예약·프로비저닝 설정 가능) |
| API Gateway | — | API를 게시·인증·스로틀링하는 관문 서비스 |
| 스테이지 | Stage | `dev`·`prod` 처럼 API 배포 환경을 나눈 단위 |
| CORS | Cross-Origin Resource Sharing | 다른 출처의 브라우저 요청을 허용하는 규약 |
| SQS | Simple Queue Service | 메시지 큐. 시스템 간 결합을 끊고 버퍼 역할 |
| 가시성 제한 시간 | Visibility Timeout | 소비자가 메시지를 가져간 뒤 다른 소비자에게 보이지 않는 시간 |
| DLQ | Dead-Letter Queue | 반복 실패한 메시지를 보관하는 큐 |
| FIFO 큐 | First In First Out | 순서 보장·중복 제거가 되는 큐 |
| SNS | Simple Notification Service | 발행/구독 방식 알림. 1:N 팬아웃 |
| EventBridge | — | 이벤트 버스와 규칙으로 서비스 간 연동·스케줄 실행 |
| 멱등성 | Idempotency | 같은 요청을 여러 번 처리해도 결과가 같은 성질 |

## 7. 컨테이너와 운영 (21–22강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| 컨테이너 | Container | 애플리케이션과 실행 환경을 함께 포장한 실행 단위 |
| ECR | Elastic Container Registry | 컨테이너 이미지 저장소 |
| ECS | Elastic Container Service | AWS 컨테이너 오케스트레이션 서비스 |
| Fargate | — | 서버(인스턴스) 관리 없이 컨테이너를 실행하는 방식 |
| 태스크 정의 | Task Definition | 컨테이너 스펙(이미지·CPU·메모리·로그·역할) 문서 |
| 태스크 역할 / 실행 역할 | Task Role / Task Execution Role | 앱이 쓰는 권한 / ECS가 이미지·로그를 다룰 때 쓰는 권한 |
| CloudWatch | — | 지표·로그·알람·대시보드 서비스 |
| Logs Insights | — | 로그를 쿼리로 분석하는 기능 |
| CloudTrail | — | "누가 언제 무엇을 했나"를 남기는 API 감사 기록 |
| Systems Manager (SSM) | — | 파라미터 스토어·Run Command·패치 관리 등 운영 도구 모음 |
| 파라미터 스토어 | Parameter Store | 설정값 저장소(SecureString으로 암호화 가능, 표준은 무료) |

## 8. 자동화와 아키텍처 (23–32강)

| 용어 | 풀어쓰기 | 뜻 |
|---|---|---|
| IaC | Infrastructure as Code | 인프라를 코드로 정의·배포·삭제하는 방식 |
| CloudFormation | — | AWS 네이티브 IaC 서비스. 템플릿 → 스택 |
| 스택 | Stack | 템플릿으로 함께 생성·삭제되는 리소스 묶음 |
| 변경 세트 | Change Set | 적용 전에 무엇이 바뀔지 미리 보는 기능 |
| 드리프트 | Drift | 템플릿과 실제 리소스 상태가 어긋난 것 |
| Terraform | — | 멀티 클라우드 IaC 도구(HashiCorp) |
| CDK | Cloud Development Kit | 프로그래밍 언어로 인프라를 정의하는 도구 |
| CI / CD | Continuous Integration / Delivery·Deployment | 통합 자동화 / 배포 자동화 |
| OIDC | OpenID Connect | 장기 액세스 키 없이 외부(GitHub)에서 AWS 역할을 맡게 하는 인증 방식 |
| 블루/그린 배포 | Blue/Green | 새 환경을 띄워 전환하는 배포 방식(빠른 롤백) |
| KMS | Key Management Service | 암호화 키 관리 서비스. 고객 관리 키는 월 $1 |
| 봉투 암호화 | Envelope Encryption | 데이터 키로 데이터를 암호화하고, 그 키를 마스터 키로 암호화 |
| Secrets Manager | — | 자격 증명 저장·자동 교체 서비스(비밀당 월 $0.40) |
| WAF | Web Application Firewall | SQL 인젝션·봇 등 웹 계층 공격을 차단 |
| RPO / RTO | Recovery Point / Time Objective | 허용 데이터 손실 시간 / 허용 복구 소요 시간 |
| 파일럿 라이트 | Pilot Light | 데이터만 복제하고 컴퓨팅은 꺼두는 DR 전략 |
| 웜 스탠바이 | Warm Standby | 축소된 규모로 상시 가동하는 DR 전략 |
| 게임데이 | Game Day | 계획된 장애를 주입해 대응 절차를 시험하는 훈련 |
| MTTD / MTTR | Mean Time To Detect / Recover | 평균 탐지 시간 / 평균 복구 시간 |
| 런북 | Runbook | 장애 시 따라 하는 복구 절차서 |
| SLI | Service Level Indicator | 서비스 상태를 나타내는 지표(가용성·지연·오류율 등) |
| Well-Architected | — | 6개 기둥(운영 우수성·보안·안정성·성능 효율성·비용 최적화·지속 가능성)으로 아키텍처를 점검하는 프레임워크 |
| HRI | High Risk Issue | WA 리뷰에서 도출된 높은 위험 항목 |
| 적정 크기 조정 | Right Sizing | 실제 사용량에 맞게 리소스 크기를 줄이는 비용 최적화 수단 |

---

## 자주 헷갈리는 짝 10개

| 비교 | 핵심 차이 |
|---|---|
| 보안 그룹 ↔ NACL | ENI 단위·상태 저장·허용만 ↔ 서브넷 단위·상태 비저장·허용/거부 |
| Multi-AZ ↔ 읽기 전용 복제본 | 가용성(동기, 자동 장애 조치) ↔ 성능(비동기, 읽기 분산) |
| IGW ↔ NAT Gateway | 양방향·무료 ↔ 아웃바운드 전용·유료 |
| 사용자 ↔ 역할 | 사람용 영구 자격 증명 ↔ 임시 자격 증명을 맡는 방식 |
| ALB ↔ API Gateway | 상시 트래픽·컨테이너/EC2 ↔ 이벤트성·서버리스·API 관리 기능 |
| S3 ↔ EFS ↔ EBS | 객체(HTTP) ↔ 공유 파일(NFS) ↔ 단일 인스턴스 블록 |
| SNS ↔ SQS | 푸시 1:N 발행/구독 ↔ 풀, 큐에 쌓고 소비 |
| 파라미터 스토어 ↔ Secrets Manager | 설정값·무료(표준) ↔ 자격 증명·자동 교체·유료 |
| 중지(stop) ↔ 종료(terminate) | EBS 유지·과금 계속 ↔ 인스턴스 삭제 |
| CloudWatch ↔ CloudTrail | 무슨 일이 벌어졌나(지표·로그) ↔ 누가 무엇을 했나(API 감사) |

---

[← 전체 로드맵](README.md) · [부록 A2 — 수료 후 학습 경로 →](A2-next-steps.md)
