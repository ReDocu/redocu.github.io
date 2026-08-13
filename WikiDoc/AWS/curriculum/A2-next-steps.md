# 부록 A2 · 수료 후 학습 경로와 자격증 대비

> AWS 과정 · 색상 `#ff9900` · 문서 버전 v1.0 · 작성일 2026-08-13
> [← 전체 로드맵](README.md) · [← 부록 A1 용어집](A1-glossary.md)

16주가 끝난 시점에서 여러분은 **"요구사항을 받아 AWS로 서비스를 만들고 운영할 수 있는 사람"** 이 되어 있습니다.
그다음에 무엇을 할지는 목표에 따라 갈립니다. 아래 3개 경로 중 **하나를 골라 3개월 단위로** 진행하기를 권합니다.

---

## 1. 수료 직후 4주 — 공통 권장 작업

| 주 | 할 일 | 이유 |
|---|---|---|
| +1주 | 최종 프로젝트 저장소 README 정리(아키텍처 다이어그램·의사결정·비용) | 포트폴리오의 핵심은 코드가 아니라 **판단 근거** |
| +2주 | 프로젝트를 **혼자서 처음부터 재배포**해 보기 | 팀 작업에서 남이 한 부분을 내 것으로 만드는 과정 |
| +3주 | 비용을 절반으로 줄인 **경량 버전** 만들기(NAT 제거·서버리스 전환 등) | 제약 조건 아래서의 설계 능력이 실무 평가 기준 |
| +4주 | 자격증 응시 계획 확정 + 모의고사 1회 | 학습 내용이 가장 선명할 때 시험을 보는 것이 효율적 |

> **계정 관리** — 리소스를 모두 지운 뒤에도 Budgets 알림은 남겨 두세요. 몇 달 뒤 잊고 만든 리소스를 잡아 줍니다.

---

## 2. 자격증 경로 — SAA-C03

이 과정은 **AWS Certified Solutions Architect – Associate**(SAA-C03) 범위를 대부분 실습으로 다룹니다.

### 2-1. 과정 내용과 시험 도메인 매핑

| 시험 도메인 | 배점 | 이 과정에서 다룬 강 |
|---|---|---|
| 1. 보안 아키텍처 설계 | 30% | 02–04강(IAM) · 13강(S3 접근 제어) · 25강(KMS·시크릿·WAF) |
| 2. 복원력 있는 아키텍처 설계 | 26% | 07–08강(VPC) · 10강(ASG) · 11–12강(ELB·Route 53) · 15강(Multi-AZ) · 26강(DR) |
| 3. 고성능 아키텍처 설계 | 24% | 13–14강(스토리지·CDN) · 17강(DynamoDB·캐시) · 18–21강(서버리스·컨테이너) |
| 4. 비용 최적화 아키텍처 설계 | 20% | 02강(예산) · 09강(구매 옵션) · 31강(비용 최적화) · 매 강 비용 표 |

### 2-2. 4주 시험 대비 계획

| 주 | 학습 | 산출물 |
|---|---|---|
| 1주 | 과정 전체 퀴즈(80문항) 재풀이 + 오답 정리 | 오답 노트 |
| 2주 | 공식 시험 가이드 기준으로 **미실습 서비스 보충** — Direct Connect, Transit Gateway, Global Accelerator, Storage Gateway, Kinesis, Athena, OpenSearch, Cognito | 서비스 요약 1장씩 |
| 3주 | 모의고사 2회 + 시나리오 문제 훈련("가장 비용 효율적인", "가장 운영 부담이 적은" 키워드 해석) | 모의고사 정답률 |
| 4주 | 취약 도메인 집중 + 최종 모의고사 | 응시 |

### 2-3. 문제 유형별 판단 기준 (자주 나오는 함정)

| 지문의 키워드 | 우선 고려 |
|---|---|
| "가장 비용 효율적인" | 서버리스 · S3 계층화 · 스팟 · 엔드포인트로 NAT 제거 |
| "운영 부담을 최소화" | 관리형 서비스(RDS·Fargate·Lambda) |
| "가장 높은 가용성" | 다중 AZ, 필요 시 다중 리전 |
| "기존 애플리케이션 수정 없이" | ALB·EFS·Storage Gateway 같은 **호환 계층** |
| "최소 권한" | IAM 역할 + 조건 키, 액세스 키 사용 선택지는 대개 오답 |
| "실시간 스트리밍" | Kinesis(SQS와 구분) |
| "밀리초 단위 지연" | ElastiCache · DynamoDB(RDS 선택지는 대개 오답) |

### 2-4. 다음 자격증

| 자격증 | 언제 | 비고 |
|---|---|---|
| SAA-C03 | 수료 직후 1~2개월 | 이 과정의 직접 연계 |
| AWS Certified Developer – Associate | SAA 후 2~3개월 | Lambda·API GW·DynamoDB·CI/CD 심화 |
| AWS Certified SysOps Administrator – Associate | 운영 직무 지향 시 | 모니터링·자동화 중심 |
| AWS Certified Solutions Architect – Professional | 실무 1~2년 후 | 다중 계정·하이브리드·마이그레이션 |
| AWS Certified Security – Specialty | 보안 직무 | KMS·GuardDuty·Security Hub 심화 |

---

## 3. 직무별 심화 경로

### 3-1. 클라우드 인프라 / DevOps 엔지니어

| 순서 | 주제 | 왜 |
|---|---|---|
| 1 | **Terraform 심화** — 모듈·워크스페이스·원격 상태 | 실무 IaC 표준의 한 축 |
| 2 | **Kubernetes / EKS** | 컨테이너 오케스트레이션의 사실상 표준 |
| 3 | **다중 계정 전략** — Organizations · Control Tower · SCP | 조직이 커지면 반드시 마주침 |
| 4 | **네트워크 심화** — Transit Gateway · VPC 피어링 · Direct Connect · PrivateLink | 하이브리드/멀티 VPC 설계 |
| 5 | **관측성 심화** — OpenTelemetry · X-Ray · Prometheus/Grafana | 분산 추적 |
| 6 | **SRE 실천** — SLO·에러 예산·카오스 엔지니어링 | 30강 게임데이의 확장 |

### 3-2. 백엔드 / 애플리케이션 개발자

| 순서 | 주제 | 왜 |
|---|---|---|
| 1 | **AWS SDK 심화**(Python boto3 / Node.js) | 코드에서 AWS를 다루는 표준 방식 |
| 2 | **AWS CDK** | 인프라를 익숙한 언어로 |
| 3 | **SAM / 서버리스 프레임워크** | Lambda 기반 서비스 개발·로컬 테스트 |
| 4 | **인증·인가** — Cognito · JWT · API 권한 부여자 | 실제 서비스의 필수 요소 |
| 5 | **이벤트 기반 아키텍처 심화** — Step Functions · EventBridge 스키마 | 20강의 확장 |
| 6 | **성능·비용 튜닝** — Lambda 파워 튜닝, DynamoDB 용량 설계 | 실측 기반 최적화 |

### 3-3. 데이터 / ML 방향

| 순서 | 주제 | 왜 |
|---|---|---|
| 1 | **데이터 레이크** — S3 + Glue + Athena | 로그·이벤트 분석의 기본형 |
| 2 | **스트리밍** — Kinesis Data Streams / Firehose | 실시간 수집 |
| 3 | **분석 서비스** — Redshift · OpenSearch · QuickSight | 저장·검색·시각화 |
| 4 | **SageMaker** | 모델 학습·배포 |
| 5 | **MLOps** | 저장소 내 [MLOps 과정](../../MLOps/curriculum/README.md) 대단원 05 참고 |

---

## 4. 실무 감각을 키우는 방법

1. **매달 하나씩 아키텍처를 그려 보세요.** 실제로 쓰는 서비스(배달 앱, 스트리밍, 티켓 예매)를 골라 "나라면 이렇게"를 다이어그램으로 그리고, 가정과 비용을 적습니다.
2. **AWS 공식 블로그와 What's New를 주 1회** 훑습니다. 서비스가 자주 바뀌므로 커리큘럼 지식은 6개월이면 일부가 낡습니다.
3. **비용 감각을 유지하세요.** 새 서비스를 볼 때마다 "이건 무엇으로 과금되는가"를 먼저 확인하는 습관이 실무에서 가장 크게 평가받습니다.
4. **재현 가능한 저장소를 늘리세요.** "이런 걸 해봤습니다"보다 "이 저장소를 클론해 배포하면 동작합니다"가 훨씬 강력합니다.
5. **장애 사례를 읽으세요.** 대규모 서비스의 포스트모템(공개 사고 보고서)은 최고의 아키텍처 교재입니다.

---

## 5. 참고 자료 유형별 검색 키워드

| 유형 | 검색 키워드 |
|---|---|
| 아키텍처 예시 | `AWS Architecture Center reference architectures` |
| 설계 원칙 | `AWS Well-Architected Framework whitepaper` |
| 비용 | `AWS Pricing Calculator` · `AWS Cost Optimization Pillar` |
| 시험 | `AWS Certified Solutions Architect Associate exam guide SAA-C03` · `AWS Skill Builder exam prep` |
| 실습 | `AWS Workshops` · `AWS Samples GitHub` |
| 최신 소식 | `AWS What's New` · `AWS Architecture Blog` |
| 장애 대응 | `AWS Post-Event Summaries` · `Chaos engineering AWS FIS` |

---

[← 전체 로드맵](README.md) · [← 부록 A1 용어집](A1-glossary.md) · [← 최종 프로젝트](04-final-project.md)
