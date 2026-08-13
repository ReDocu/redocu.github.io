# AWS 학습 매뉴얼 — 전체 진도표

> **AWS 과정** · 32강 · 96시간 · 색상 `#ff9900`
> 커리큘럼 원본: [`curriculum/README.md`](../curriculum/README.md)
> 문서 버전 v1.0 · 작성일 2026-08-13

---

## 이 문서들을 읽는 법

강별 본문은 **어느 문서를 펴도 같은 자리에 같은 종류의 내용**이 있도록 6블록 구조로 되어 있습니다.

| 블록 | 이름 | 내용 |
|---|---|---|
| ① | 학습 목표 | 이 강을 마치면 할 수 있게 되는 것 (행동 동사 3~5개) |
| ② | 왜 필요한가 | 이 개념이 없으면 무엇이 안 되는지 — 실패 상황과 비유 |
| ③ | 개념 설명 | 용어와 원리 · 서비스 선택 기준과 대안 비교표 |
| ④ | 단계별 실습 | Step 1 → N · 콘솔 작업 흐름 + CLI 명령 + **실제 출력** |
| ⑤ | 자주 하는 실수 | 에러 원문 + 원인 + 해결 (Ctrl+F로 검색 가능) |
| ⑥ | 확인 문제 | 3문항 · 답은 접어 둠 |

각 강의 ④블록 끝에는 **비용 표**와 **리소스 정리 체크리스트**가 항상 붙습니다. 정리는 실습의 일부입니다.

**명령 블록 규칙**

```bash
$ aws sts get-caller-identity          # $ 로 시작하는 줄 = 직접 입력할 명령
{
    "UserId": "AIDA...",               # 아래는 실제 출력
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/admin"
}
```

- 계정 ID·엔드포인트·도메인은 예시값입니다. 본인 환경 값으로 바꿔 실행하세요.
- 콘솔 화면은 수시로 바뀌므로 **버튼 위치가 아니라 작업 흐름**으로 서술합니다.
- 🔴 표시가 붙은 명령은 **비용이 발생**하는 리소스를 만듭니다.

---

## 대단원별 진도표

| 대단원 | 주차 | 강 | 진도표 |
|---|---|---|---|
| 🟢 01 · 클라우드 기초와 보안 네트워크 | W01–W04 | 01–08 | [바로가기](01-cloud-foundation/README.md) |
| 🟡 02 · 컴퓨팅 · 트래픽 · 데이터 계층 | W05–W08 | 09–16 | [바로가기](02-compute-data/README.md) |
| 🟡🔴 03 · 서버리스 · 컨테이너 · 자동화 | W09–W12 | 17–24 | [바로가기](03-serverless-automation/README.md) |
| 🔴 04 · 최종 프로젝트 | W13–W16 | 25–32 | [바로가기](04-final-project/README.md) |

---

## 전체 32강 한눈에 보기

| 강 | 주차 | 제목 | 핵심 |
|---|---|---|---|
| [01](01-cloud-foundation/lesson-01.md) | W01 | 클라우드 컴퓨팅과 AWS 글로벌 인프라 | 리전·AZ·엣지 · 책임 공유 모델 · 요금 모델 |
| [02](01-cloud-foundation/lesson-02.md) | W01 | 계정 만들기와 돈 새는 구멍 막기 | 루트 MFA · IAM 사용자 · Budgets 3단계 · 프리 티어 |
| [03](01-cloud-foundation/lesson-03.md) | W02 | IAM 핵심 — 사용자·그룹·역할·정책 | 정책 JSON · 역할과 신뢰 정책 · STS |
| [04](01-cloud-foundation/lesson-04.md) | W02 | 최소 권한 실전 | 평가 로직 · 조건 키 · Access Analyzer · 키 유출 대응 |
| [05](01-cloud-foundation/lesson-05.md) | W03 | AWS CLI와 CloudShell | 프로파일 · `--query` · `--dry-run` |
| [06](01-cloud-foundation/lesson-06.md) | W03 | 리눅스 기본기와 첫 EC2 | 인스턴스 수명 주기 · 보안 그룹 · SSM 접속 |
| [07](01-cloud-foundation/lesson-07.md) | W04 | VPC 설계 — 서브넷·라우팅·게이트웨이 | CIDR · IGW/NAT · SG vs NACL · 엔드포인트 |
| [08](01-cloud-foundation/lesson-08.md) | W04 | 🏁 미니 프로젝트 — 안전한 3계층 네트워크 | 2AZ VPC · 프라이빗 웹서버 · Flow Logs |
| [09](02-compute-data/lesson-09.md) | W05 | AMI · 사용자 데이터 · 시작 템플릿 | 골든 AMI vs 부트스트랩 · 구매 옵션 |
| [10](02-compute-data/lesson-10.md) | W05 | Auto Scaling 그룹 | 타깃 추적 · 헬스 체크 · 인스턴스 새로 고침 |
| [11](02-compute-data/lesson-11.md) | W06 | Elastic Load Balancing | ALB vs NLB · 대상 그룹 · 연결 드레이닝 |
| [12](02-compute-data/lesson-12.md) | W06 | Route 53과 ACM으로 HTTPS | Alias 레코드 · 인증서 · 443 리다이렉트 |
| [13](02-compute-data/lesson-13.md) | W07 | S3 — 객체 스토리지 | 퍼블릭 차단 · 버전 관리 · 수명 주기 · 스토리지 클래스 |
| [14](02-compute-data/lesson-14.md) | W07 | EBS · EFS · CloudFront | 볼륨 타입 · 공유 파일 시스템 · OAC · 캐시 |
| [15](02-compute-data/lesson-15.md) | W08 | RDS와 Aurora | Multi-AZ vs 읽기 복제본 · PITR · 서브넷 그룹 |
| [16](02-compute-data/lesson-16.md) | W08 | 🏁 중간 프로젝트 — 고가용성 웹 서비스 | ALB+ASG+RDS Multi-AZ+CDN+HTTPS |
| [17](03-serverless-automation/lesson-17.md) | W09 | DynamoDB와 ElastiCache | 파티션 키 · GSI · TTL · cache-aside |
| [18](03-serverless-automation/lesson-18.md) | W09 | Lambda | 실행 역할 · 메모리/타임아웃 · 콜드 스타트 |
| [19](03-serverless-automation/lesson-19.md) | W10 | API Gateway와 서버리스 API | HTTP vs REST API · 스테이지 · CORS · 스로틀링 |
| [20](03-serverless-automation/lesson-20.md) | W10 | SQS · SNS · EventBridge | 가시성 제한 시간 · DLQ · 팬아웃 · 멱등성 |
| [21](03-serverless-automation/lesson-21.md) | W11 | 컨테이너 · ECR · ECS Fargate | 태스크 정의 · 태스크 역할 vs 실행 역할 · 롤링 배포 |
| [22](03-serverless-automation/lesson-22.md) | W11 | CloudWatch · CloudTrail · Systems Manager | 지표·로그·알람 · 감사 추적 · 파라미터 스토어 |
| [23](03-serverless-automation/lesson-23.md) | W12 | Infrastructure as Code | 템플릿 구조 · 변경 세트 · 드리프트 · 도구 비교 |
| [24](03-serverless-automation/lesson-24.md) | W12 | 🏁 CI/CD 자동 배포 | GitHub Actions OIDC · 스모크 테스트 · 롤백 |
| [25](04-final-project/lesson-25.md) | W13 | 요구사항 분석과 보안 설계 | 구성 요소 결정표 · KMS · Secrets Manager · WAF |
| [26](04-final-project/lesson-26.md) | W13 | 백업·재해 복구 전략과 설계 리뷰 | RPO/RTO · DR 4전략 · AWS Backup · M1 리뷰 |
| [27](04-final-project/lesson-27.md) | W14 | 스프린트 1 — 네트워크·데이터 계층 | 스택 분리 · 교차 참조 · DeletionPolicy |
| [28](04-final-project/lesson-28.md) | W14 | 스프린트 2 — 애플리케이션·CI/CD | 무중단 배포 · 시크릿 주입 · 스모크 테스트 |
| [29](04-final-project/lesson-29.md) | W15 | 관측성과 부하 검증 | 골든 시그널 · 대시보드 · 알람 · 부하 테스트 |
| [30](04-final-project/lesson-30.md) | W15 | 게임데이 — 장애 주입과 복구 | MTTD/MTTR · 런북 · 회고 · 야간 자동 축소 |
| [31](04-final-project/lesson-31.md) | W16 | Well-Architected 리뷰와 비용 최적화 | 6개 기둥 · 위험 도출 · 비용 최적화 7수단 |
| [32](04-final-project/lesson-32.md) | W16 | 🏁 최종 발표 · 시연 · 정리 | 발표 구성 · 시연 · 동료 평가 · 계정 정리 |

---

## 작성 현황

| 구분 | 상태 |
|---|---|
| 커리큘럼(로드맵 · 대단원 4편 · 부록 2편) | ✅ 완료 |
| 진도표 인덱스 5편 | ✅ 완료 |
| 강별 본문 `lesson-01.md` ~ `lesson-32.md` (전 대단원) | ✅ **완료** |

---

[← 커리큘럼 로드맵](../curriculum/README.md) · [부록 A1 용어집](../curriculum/A1-glossary.md) · [부록 A2 학습 경로](../curriculum/A2-next-steps.md)
