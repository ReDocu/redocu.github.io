# 학습 매뉴얼 · Git — 강별 학습 문서

> **초급 · 중급 · 고급 3단계 · 총 30강 + 부록 3편 · 약 67시간** · 색상 `#f05033`
> 전체 로드맵: [`curriculum/README.md`](../curriculum/README.md) · 레벨별 상세: [🟢 초급](../curriculum/01-beginner.md) · [🟡 중급](../curriculum/02-intermediate.md) · [🔴 고급](../curriculum/03-advanced.md)

---

## 이 문서들을 읽는 법

각 강의 문서는 **6개 블록의 고정 구조**를 갖습니다. 어느 강을 펴도 같은 자리에 같은 종류의 내용이 있습니다.

| 블록 | 내용 | 이렇게 쓰세요 |
|---|---|---|
| ① 학습 목표 | 이 강을 마치면 할 수 있게 되는 것 | 수업 전에 읽고, 수업 후에 다시 읽어 체크 |
| ② 왜 필요한가 | 이 개념이 없으면 무엇이 안 되는지 | 이해가 안 갈 때 여기로 돌아오세요 |
| ③ 개념 설명 | 용어와 원리 | 표와 그림 위주. 용어는 처음 나올 때 풀어 씀 |
| ④ 단계별 실습 | Step 1 → N, 명령어 + 실행 결과 | **직접 타이핑**하세요. 복사만 하면 안 늡니다 |
| ⑤ 자주 하는 실수 | 에러 메시지 원문 + 원인 + 해결 | 에러가 났을 때 Ctrl+F로 검색 |
| ⑥ 확인 문제 | 3문항, 답은 접혀 있음 | 답을 보기 전에 반드시 먼저 풀어 보세요 |

**명령어 블록 규칙** — 실습 명령은 전부 **그대로 입력하면 실행되는 완성된 명령**입니다.
`$` 로 시작하는 줄은 입력할 명령, 그 아래는 실제로 나오는 출력입니다.

**Git은 "망가뜨려 보는" 것이 가장 빠른 학습법입니다.** 모든 실습은 버려도 되는 연습용 저장소에서 진행합니다.
회사·학교 저장소에서 연습하지 마세요.

---

## 진도표

### 🟢 초급 · 혼자 쓰는 Git

> **10강 · 약 20시간** · 선수 지식 없음
> **목표** — 내 프로젝트 하나를 Git으로 관리하고 GitHub에 올려 둘 수 있다.

| 강 | 제목 | 핵심 |
|---|---|---|
| [01](lesson-01.md) | 버전 관리가 필요한 이유 | `최종_진짜최종_v2` 의 문제 · 형상관리 · Git과 GitHub의 차이 |
| [02](lesson-02.md) | 설치와 최초 설정 | 설치 · `git config --global` · user.name/email · 기본 브랜치명 · 줄바꿈(CRLF) · 한글 파일명 |
| [03](lesson-03.md) | 저장소와 세 개의 공간 | `git init` · 작업 디렉터리 / 스테이지 / 저장소 · `.git` 폴더의 정체 |
| [04](lesson-04.md) | 변경 기록하기 | `git status` · `add` · `commit` · 커밋 하나에 무엇을 담을 것인가 |
| [05](lesson-05.md) | 무시할 파일 정하기 | `.gitignore` 패턴 문법 · 이미 추적 중인 파일 빼기(`rm --cached`) · 템플릿 |
| [06](lesson-06.md) | 기록 들여다보기 | `log --oneline --graph` · `show` · `diff` (작업 ↔ 스테이지 ↔ 커밋) |
| [07](lesson-07.md) | 되돌리기 기초 | `restore` · `restore --staged` · `commit --amend` · 실수 상황별 대처표 |
| [08](lesson-08.md) | 브랜치 만들고 합치기 | `branch` · `switch -c` · `merge` · fast-forward · 브랜치가 왜 필요한가 |
| [09](lesson-09.md) | GitHub에 올리기 | 원격 저장소 · `remote add` · `push` · `clone` · `pull` · 인증(PAT / SSH 키) |
| [10](lesson-10.md) | 초급 종합 실습 | 빈 폴더 → 커밋 → 브랜치 → GitHub 공개까지 한 번에 · 수료 체크리스트 |

### 🟡 중급 · 팀으로 쓰는 Git

> **10강 · 약 22시간** · 선수: 초급 수료
> **목표** — 여러 사람이 같은 저장소에서 일할 때 히스토리를 망가뜨리지 않고 협업할 수 있다.

| 강 | 제목 | 핵심 |
|---|---|---|
| [11](lesson-11.md) | 충돌(conflict) 해결 | 충돌이 나는 원리 · 충돌 마커 읽는 법 · `merge --abort` · 3-way merge |
| [12](lesson-12.md) | merge vs rebase | 히스토리 모양의 차이 · rebase 절차 · **황금률**(공유 브랜치는 rebase 금지) |
| [13](lesson-13.md) | 브랜치 전략 | GitHub Flow · Git Flow · trunk-based · 우리 팀 규모에 맞는 선택 |
| [14](lesson-14.md) | Pull Request 워크플로 | fork vs 브랜치 · PR 작성법 · 리뷰 주고받기 · merge 버튼 3종의 차이 |
| [15](lesson-15.md) | 좋은 커밋 만들기 | Conventional Commits · `add -p` 로 쪼개기 · 원자적 커밋 · 메시지 본문 쓰는 법 |
| [16](lesson-16.md) | 임시 저장과 골라 옮기기 | `stash` · `cherry-pick` · 브랜치를 잘못 판 상황 구제하기 |
| [17](lesson-17.md) | 안전하게 되돌리기 | `revert` vs `reset` · 이미 push한 커밋 되돌리기 · `--force-with-lease` |
| [18](lesson-18.md) | 히스토리 정리 | `rebase -i` · squash / fixup / reword / drop · `--autosquash` |
| [19](lesson-19.md) | 태그와 릴리스 | 시맨틱 버저닝 · annotated tag · GitHub Releases · 변경 로그 자동 생성 |
| [20](lesson-20.md) | 중급 종합 실습 | 충돌 시나리오 재현·해결 · 2인 1조 PR 실습 · 수료 체크리스트 |

### 🔴 고급 · Git 내부와 자동화

> **10강 · 약 25시간** · 선수: 중급 수료
> **목표** — Git이 데이터를 어떻게 저장하는지 알고, 사고가 나도 복구하며, 저장소 규칙을 자동화할 수 있다.

| 강 | 제목 | 핵심 |
|---|---|---|
| [21](lesson-21.md) | `.git` 폴더 해부 | 객체 4종(blob · tree · commit · tag) · SHA 해시 · `cat-file` · `hash-object` |
| [22](lesson-22.md) | 참조와 HEAD | `refs/` 구조 · HEAD의 정체 · detached HEAD · "브랜치는 포인터일 뿐" |
| [23](lesson-23.md) | reflog — 잃어버린 커밋 되살리기 | `reflog` · 잘못된 reset/rebase 복구 · 도달 불가 객체와 `gc` |
| [24](lesson-24.md) | 세 그루의 나무(3-tree) 모델 | `reset --soft/--mixed/--hard` 완전 이해 · checkout · switch · restore 정리 |
| [25](lesson-25.md) | 범인 찾기 | `bisect` (수동·자동) · `blame` · `log -S`(곡괭이) · `log -L` |
| [26](lesson-26.md) | 훅(hooks)과 자동 검사 | `pre-commit` · `commit-msg` · `pre-push` · husky / lint-staged / pre-commit |
| [27](lesson-27.md) | GitHub Actions 기초 | 워크플로 문법 · PR 자동 검사 · 브랜치 보호 규칙 · 필수 통과 조건 |
| [28](lesson-28.md) | 대형 저장소 다루기 | `submodule` · `subtree` · LFS · `worktree` · sparse-checkout · shallow clone |
| [29](lesson-29.md) | 히스토리 재작성과 사고 대응 | `filter-repo` · **비밀키 유출 대응 절차** · force push 사고 복구 · 팀 공지 |
| [30](lesson-30.md) | 고급 종합 실습 | 규칙이 자동화된 저장소 세팅 · 사고 복구 시나리오 3종 · 최종 체크리스트 |

### 📎 부록

| 편 | 제목 | 핵심 |
|---|---|---|
| A1 | 명령어 치트시트 | 상황별 1페이지 요약 — "이럴 땐 이 명령" · *작성 예정* |
| A2 | 에러 메시지 사전 | 자주 만나는 Git 에러 원문 → 원인 → 해결 · *작성 예정* |
| A3 | 용어 사전 | 한글–영문 대조 (스테이지 / 인덱스 / HEAD / 업스트림 …) · *작성 예정* |

---

[← 커리큘럼](../curriculum/README.md)
