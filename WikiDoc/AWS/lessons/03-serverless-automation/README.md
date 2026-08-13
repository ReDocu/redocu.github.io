# 🟡🔴 대단원 03 · 서버리스 · 컨테이너 · 자동화 — 진도표

> **AWS 학습 매뉴얼** · W09–W12 · **17–24강 / 총 32강** · 24시간 · 색상 `#c925d1`
> 커리큘럼 원본: [`curriculum/03-serverless-automation.md`](../../curriculum/03-serverless-automation.md)
> [← 이전 단원 진도표](../02-compute-data/README.md) · [← 전체 진도표](../README.md) · [다음 단원 진도표 →](../04-final-project/README.md)

---

## 이 문서들을 읽는 법

| 블록 | 이름 | 내용 |
|---|---|---|
| ① | 학습 목표 | 마치면 할 수 있게 되는 것 (3~5개) |
| ② | 왜 필요한가 | 이 개념이 없으면 무엇이 안 되는지 |
| ③ | 개념 설명 | 용어·원리 · **실행 방식/저장소 선택 기준표** |
| ④ | 단계별 실습 | Step 1 → N · 명령과 실제 출력 · **비용 표 + 정리 체크리스트** |
| ⑤ | 자주 하는 실수 | 에러 원문 + 원인 + 해결 |
| ⑥ | 확인 문제 | 3문항 (답은 접어 둠) |

명령 블록 규칙은 [전체 진도표](../README.md#이-문서들을-읽는-법)를 참고하세요.

> 📌 **23강부터는 콘솔에서 리소스를 만들지 않습니다.** 이후 모든 인프라는 템플릿(코드)으로 만들고 `delete-stack` 으로 정리합니다.
> 🔴 18강 실습에는 **Lambda 무한 재귀**(같은 버킷 트리거) 위험이 있습니다. 입력/출력 버킷을 반드시 분리하세요.

---

## 진도표

| 강 | 주차 | 제목 | 핵심 | 실습 산출물 | 예상 비용 |
|---|---|---|---|---|---|
| [17](lesson-17.md) | W09 | DynamoDB와 ElastiCache | 파티션 키 설계 · GSI · TTL · cache-aside · Redis vs Memcached | 접근 패턴 기반 테이블 + 캐시 응답 시간 비교표 | $0~0.1 |
| [18](lesson-18.md) | W09 | Lambda | 실행 역할 · 메모리/타임아웃 · 콜드 스타트 · VPC 연결 | S3 트리거로 DynamoDB에 기록하는 함수 | $0~0.1 |
| [19](lesson-19.md) | W10 | API Gateway와 서버리스 API | HTTP vs REST API · 스테이지 · 권한 부여 · CORS · 스로틀링 | 인증·CORS가 적용된 CRUD API | $0 |
| [20](lesson-20.md) | W10 | SQS · SNS · EventBridge | 가시성 제한 시간 · DLQ · 팬아웃 · 스케줄 · 멱등성 | 실패해도 데이터가 안 사라지는 큐 파이프라인 | $0~0.1 |
| [21](lesson-21.md) | W11 | 컨테이너 · ECR · ECS Fargate | 태스크 정의 · 태스크 역할 vs 실행 역할 · 롤링 배포 | ALB 뒤에서 2태스크로 도는 Fargate 서비스 | $0.2~0.3 |
| [22](lesson-22.md) | W11 | CloudWatch · CloudTrail · Systems Manager | 지표·Logs Insights·알람 · 감사 추적 · 파라미터 스토어 | 지표 6종 대시보드 + 오류 알람 | $0.1~0.2 |
| [23](lesson-23.md) | W12 | Infrastructure as Code | 템플릿 구조 · 변경 세트 · 드리프트 · CFN vs Terraform vs CDK | VPC를 만드는 CloudFormation 템플릿 | $0.1~0.2 |
| [24](lesson-24.md) | W12 | 🏁 CI/CD 자동 배포 | GitHub Actions OIDC · 배포 전략 · 스모크 테스트 · 롤백 | 푸시하면 배포되는 파이프라인 | $0.2~0.4 |

---

## 이 단원의 완료 기준

- [ ] EC2·컨테이너·Lambda를 근거와 함께 선택할 수 있다
- [ ] DynamoDB를 접근 패턴 기준으로 설계하고 캐시를 적용한다
- [ ] Lambda + API Gateway로 서버 없는 API를 만든다
- [ ] 큐와 이벤트로 시스템을 분리하고 실패 메시지를 보존한다
- [ ] 컨테이너를 ECS Fargate로 배포하고 롤링 업데이트한다
- [ ] 지표·로그·알람으로 탐지하고 CloudTrail로 원인을 추적한다
- [ ] 인프라를 코드로 정의하고 CI/CD로 자동 배포한다

> 🏁 **24강 자동화·배포 프로젝트**의 과제 문장과 제출물은 [커리큘럼 대단원 문서](../../curriculum/03-serverless-automation.md#w12--iac와-cicd-자동화)에 있습니다.

**본문 작성 현황** — `lesson-17.md` ~ `lesson-24.md` ✅ 완료

---

[← 이전 단원 진도표](../02-compute-data/README.md) · [← 전체 진도표](../README.md) · [커리큘럼 원본](../../curriculum/03-serverless-automation.md) · [다음 단원 진도표 →](../04-final-project/README.md)
