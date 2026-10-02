# MLOps 엔지니어 양성과정 — 일차별 학습 문서

> **32주 · 160일 · 1,280시간** · 대단원 6개 · 미니프로젝트 4개 + 최종 팀 프로젝트 1개
> 커리큘럼 원본: [`curriculum/README.md`](../curriculum/README.md) · 색상 `#f59e0b`

---

## 이 문서들을 읽는 법

각 일차 문서는 **6개 블록의 고정 구조**를 갖습니다. 어느 날짜를 펴도 같은 자리에 같은 종류의 내용이 있습니다.

| 블록 | 내용 | 이렇게 쓰세요 |
|---|---|---|
| ① 학습 목표 | 오늘을 마치면 할 수 있게 되는 것 | 수업 전에 읽고, 수업 후에 다시 읽어 체크 |
| ② 왜 필요한가 | 이 개념이 없으면 무엇이 안 되는지 | 이해가 안 갈 때 여기로 돌아오세요 |
| ③ 개념 설명 | 용어와 원리 | 표와 그림 위주. 용어는 처음 나올 때 풀어 씀 |
| ④ 단계별 실습 | Step 1 → N, 코드 + 실행 결과 | **직접 타이핑**하세요. 복사만 하면 안 늡니다 |
| ⑤ 자주 하는 실수 | 에러 메시지 원문 + 원인 + 해결 | 에러가 났을 때 Ctrl+F로 검색 |
| ⑥ 확인 문제 | 3문항, 답은 접혀 있음 | 답을 보기 전에 반드시 먼저 풀어 보세요 |

**코드 블록 규칙** — 실습 코드는 전부 **복사해서 붙여넣으면 그대로 실행되는 완성된 코드**입니다.
명령은 `$` 로 시작하는 줄이 입력, 그 아래가 실제 출력입니다. `실행 결과:` 아래 블록은 그 코드를 실행했을 때 실제로 나오는 출력입니다.

> **Day 번호 기준** — `Day 001`~`Day 160`은 달력 날짜가 아니라 **수업일 일련번호**입니다.
> 공휴일·휴강이 생기면 이후 번호를 그대로 밀어서 운영합니다.

---

## 대단원별 문서

| 대단원 | 범위 | 진도표 | 커리큘럼 |
|---|---|---|---|
| **01 파이썬과 데이터 다루기** | W01–W06 · Day 001–030 | [진도표](01-python-data/README.md) | [커리큘럼](../curriculum/01-python-data.md) |
| **02 SQL과 데이터 파이프라인** | W07–W10 · Day 031–050 | [진도표](02-sql-pipeline/README.md) | [커리큘럼](../curriculum/02-sql-pipeline.md) |
| **03 머신러닝** | W11–W15 · Day 051–075 | [진도표](03-machine-learning/README.md) | [커리큘럼](../curriculum/03-machine-learning.md) |
| **04 딥러닝과 모델 서빙** | W16–W21 · Day 076–105 | [진도표](04-deep-learning-serving/README.md) | [커리큘럼](../curriculum/04-deep-learning-serving.md) |
| **05 인프라와 MLOps** | W22–W28 · Day 106–140 | [진도표](05-infra-mlops/README.md) | [커리큘럼](../curriculum/05-infra-mlops.md) |
| **06 최종 통합 팀 프로젝트** | W29–W32 · Day 141–160 | [진도표](06-final-project/README.md) | [커리큘럼](../curriculum/06-final-project.md) |

---

## 산출물이 이어지는 구조

이 과정의 문서는 매일 독립된 예제를 다루지 않습니다. **어제 만든 것이 오늘의 입력**입니다.

```
01 수집·전처리 패키지 ──▶ 02 DB 적재 ETL ──▶ MP1 분석 리포트
                                 │
                                 ▼
                    03 ML 모델 + 실험 기록 (MP2)
                                 │
                                 ▼
                    04 서빙 API (MP3) ──▶ 05 컨테이너·CI/CD 운영화 (MP4)
                                 │
                                 ▼
                    06 최종 팀 프로젝트 = 01~05 전체 통합
```

따라서 **결석한 날의 문서는 반드시 따라잡고 넘어가야 합니다.** 특히 아래 5개 일차는 이후 전 구간이 전제하는 내용입니다.

| Day | 내용 | 이걸 놓치면 |
|---|---|---|
| [013](01-python-data/day-013.md) | 모듈과 패키지 (src 레이아웃) | 이후 모든 제출물이 패키지 형태를 요구합니다 |
| [043](02-sql-pipeline/day-043.md) | ETL 구성과 멱등성 | MP1 이후 모든 파이프라인의 기본 골격입니다 |
| [063](03-machine-learning/day-063.md) | sklearn Pipeline | 누수 방지와 서빙 전처리 일치의 근거입니다 |
| [096](04-deep-learning-serving/day-096.md) | 추론 서버 구조 | MP3·MP4·최종 프로젝트의 서빙 골격입니다 |
| [117](05-infra-mlops/day-117.md) | Dockerfile | W24 이후 전부가 컨테이너 위에서 돌아갑니다 |

---

## 수료 시점 포트폴리오 (GitHub 공개 저장소 5개)

| # | 저장소 | 완성 시점 |
|---|---|---|
| 1 | 데이터 수집·전처리 파이썬 패키지 | [Day 030](01-python-data/day-030.md) |
| 2 | Python·SQL 데이터 분석 프로젝트 (MP1) | [Day 050](02-sql-pipeline/day-050.md) |
| 3 | ML 예측 모델 + 실험 기록 (MP2) | [Day 075](03-machine-learning/day-075.md) |
| 4 | DL 모델 서빙 API → 컨테이너·CI/CD 운영화 (MP3+MP4) | [Day 105](04-deep-learning-serving/day-105.md) → [Day 140](05-infra-mlops/day-140.md) |
| 5 | 최종 팀 프로젝트 | [Day 160](06-final-project/day-160.md) |

---

## 개발 환경 요약

| 대단원 | 도입 도구 |
|---|---|
| 01 파이썬 | Python 3.12, VS Code, venv, Git/GitHub, requests, BeautifulSoup, NumPy, Pandas, matplotlib, pytest |
| 02 SQL | PostgreSQL 16 (Docker 컨테이너), DBeaver, SQLAlchemy, psycopg |
| 03 ML | scikit-learn, XGBoost/LightGBM, MLflow, Optuna |
| 04 DL | PyTorch, torchvision, Hugging Face Transformers, FastAPI, uvicorn, Google Colab 🖥️ |
| 05 MLOps | Linux(Ubuntu) 또는 WSL2, Docker, Docker Compose, GitHub Actions, DVC, Airflow, nginx |
| 06 최종 | 위 전체 + 팀별 클라우드 인스턴스 1대 |

> 🖥️ GPU가 필요한 실습(W17–W18)은 **Google Colab 무료 티어** 기준으로 설계했습니다. 서빙 이후 구간은 CPU로 충분합니다.

---

[전체 로드맵](../curriculum/README.md) · [대단원 01 시작 →](01-python-data/README.md)
