# 20강 · 중급 종합 실습

> **Git 학습 매뉴얼** · 🟡 중급 · **20강 / 30** · 🏁 중급 마무리
> [← 이전 19강](lesson-19.md) · [목차](README.md) · [다음 → 21강 .git 폴더 해부](lesson-21.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 팀 저장소를 처음부터 세팅하고 협업 규칙을 강제할 수 있다.
- **충돌 3종**(content · add/add · modify/delete)을 스스로 해결할 수 있다.
- PR 사이클을 이슈 생성부터 릴리스까지 완주할 수 있다.
- 사고가 났을 때 `revert` · `reflog` · `--force-with-lease` 로 수습할 수 있다.
- 중급 수료 체크리스트를 통과해 고급으로 넘어갈 준비를 마친다.

---

## ② 왜 필요한가

중급 9개 강은 전부 **"여러 사람이 같은 저장소를 쓸 때"** 의 이야기였습니다.

낱개로는 다 해 봤지만, 실제 팀에서는 이렇게 얽혀서 옵니다.

```
월요일  PR 올림
화요일  리뷰 3개 받음 → fixup 커밋
수요일  main 이 많이 변함 → rebase → 충돌 3개
목요일  병합 → 배포 → 버그 발견 → revert
금요일  고쳐서 다시 병합 → "Already up to date" ?!
        → 태그 붙이고 릴리스
```

오늘은 이 일주일을 **압축해서 한 번에** 겪어 봅니다. 그리고 고급(21강~)으로 넘어가기 전에 **손에 붙었는지** 점검합니다.

---

## ③ 개념 설명 — 중급 전체 지도

### 한 장으로 보는 협업 흐름

```
  ┌─── 내 로컬 ───────────────────┐        ┌─── GitHub ─────────────┐
  │                              │        │                        │
  │  main ──● 최신 유지           │◀─pull──│  main (보호됨)          │
  │         │                    │        │    ▲                   │
  │         └─▶ feature/42-xxx   │        │    │ Squash and merge   │
  │              ● ● ●           │─push──▶│  Pull Request          │
  │              │               │        │    ▲                   │
  │        rebase origin/main    │        │    │ 리뷰 · CI          │
  │        add -p / commit --fixup│        │    │                   │
  │        rebase -i --autosquash │        │  Issue #42             │
  │                              │        │                        │
  │  사고 → revert / reflog       │        │  Tag v1.2.0 → Release  │
  └──────────────────────────────┘        └────────────────────────┘
```

### 강별 핵심 한 줄

| 강 | 핵심 |
|---|---|
| [11](lesson-11.md) | 충돌은 **에러가 아니라 질문**. 언제든 `--abort` |
| [12](lesson-12.md) | rebase는 **옮겨질 쪽에서**. 공유 브랜치는 금지 |
| [13](lesson-13.md) | 대부분의 팀에 정답은 **GitHub Flow**. 규칙은 도구로 강제 |
| [14](lesson-14.md) | 리뷰 반영은 **추가 커밋**으로. 병합은 Squash |
| [15](lesson-15.md) | 작업은 흐름대로, 커밋은 **`add -p`** 로 나눠서 |
| [16](lesson-16.md) | `git stash` 에는 **`-u -m "설명"`** |
| [17](lesson-17.md) | push했으면 **`revert`**. 강제 push는 `--force-with-lease` |
| [18](lesson-18.md) | 리뷰 반영은 `--fixup`, 정리는 `rebase -i --autosquash` |
| [19](lesson-19.md) | 태그는 **push에 안 따라감**. 공개된 태그는 안 옮김 |

### 중급 명령어 지도

| 하고 싶은 일 | 명령 |
|---|---|
| **충돌** | |
| 충돌 파일 확인 | `git status` / `git diff --name-only --diff-filter=U` |
| 해결 표시 | `git add <파일>` |
| 취소 | `git merge --abort` |
| 마커 남았나 검사 | `git diff --check` |
| **이력 관리** | |
| 브랜치 최신화 | `git rebase origin/main` |
| 당겨 오기 | `git pull --rebase` |
| 정리 | `git rebase -i --autosquash HEAD~5` |
| 나중에 흡수될 커밋 | `git commit --fixup <해시>` |
| **골라 담기 / 옮기기** | |
| 파일 일부만 | `git add -p` |
| 임시 보관 | `git stash -u -m "설명"` |
| 커밋 복사 | `git cherry-pick -x <해시>` |
| **되돌리기** | |
| push 후 | `git revert <해시>` |
| 머지 커밋 | `git revert -m 1 <해시>` |
| 사고 복구 | `git reflog` → `git reset --hard <해시>` |
| 강제 push | `git push --force-with-lease` |
| **릴리스** | |
| 태그 | `git tag -a v1.0.0 -m "..."` |
| 올리기 | `git push --follow-tags` |
| 변경 목록 | `git log --oneline --no-merges v1.0.0..v1.1.0` |
| 현재 위치 | `git describe --tags --always --dirty` |

### 지금까지 권장한 설정 모음

```bash
git config --global merge.conflictStyle zdiff3    # 충돌에 공통 조상 표시 (11강)
git config --global rerere.enabled true           # 같은 충돌 재사용 (11강)
git config --global pull.rebase true              # pull 은 rebase 로 (12강)
git config --global commit.verbose true           # 커밋 시 diff 표시 (15강)
git config --global commit.template ~/.gitmessage # 메시지 템플릿 (15강)
git config --global rebase.autosquash true        # fixup 자동 배치 (18강)
git config --global push.followTags true          # 태그 함께 push (19강)
git config --global alias.pushf "push --force-with-lease --force-if-includes"
```

```bash
git config --global --list       # 지금 내 설정 확인
```

---

## ④ 단계별 실습 — 미션 6개

**오늘의 과제** — `team-project` 라는 새 저장소를 만들어 **팀 협업 한 사이클**을 완주합니다.

> 지금까지 쓰던 `todo-app` 은 그대로 두고 **새 저장소로 시작**합니다.
> "팀원" 역할은 두 번째 clone 폴더로 흉내 냅니다. 짝이 있다면 실제로 둘이서 하세요.

---

### 미션 1. 팀 저장소 세팅 (13·14강)

> **목표** — 규칙이 문서와 도구로 강제되는 저장소를 만든다.

**① 로컬 저장소와 첫 커밋**

```bash
cd ~/Desktop
mkdir team-project && cd team-project
pwd
git init
```

`.gitignore` 를 먼저 만듭니다 ([05강](lesson-05.md)).

```gitignore
.env
__pycache__/
*.py[cod]
venv/
.venv/
.DS_Store
Thumbs.db
.idea/
```

`.gitattributes` 도 함께 ([18강](lesson-18.md)).

```gitattributes
* text=auto
*.py  text eol=lf
*.md  text eol=lf
*.bat text eol=crlf
*.png binary
```

```bash
git add .gitignore .gitattributes
git commit -m "chore: 프로젝트 초기 설정"
```

**② 규칙 문서** — `CONTRIBUTING.md` ([13강](lesson-13.md))

```markdown
# 기여 가이드

## 브랜치 전략 — GitHub Flow

- `main` 은 항상 배포 가능한 상태를 유지합니다.
- `main` 에 직접 push하지 않습니다. 모든 변경은 PR로 들어옵니다.

## 브랜치 이름

`<타입>/<이슈번호>-<설명>`  예: `feature/1-calculator`

타입: `feature` `fix` `hotfix` `docs` `refactor` `chore`

## 커밋 메시지 — Conventional Commits

`<타입>: <제목>` (50자 이내, 마침표 없음)

## 병합 규칙

- 최신화는 `git rebase origin/main`
- 통합은 **Squash and merge**
- 공유 브랜치는 rebase 금지

## 금지 사항

- `main` 직접 push
- 공유 브랜치 force push
- `.env` 등 비밀 정보 커밋
```

**③ PR 템플릿** — `.github/pull_request_template.md` ([14강](lesson-14.md))

```markdown
## 무엇을

Closes #

## 왜

## 확인 방법

## 체크리스트

- [ ] 로컬에서 동작을 확인했습니다
- [ ] 커밋 메시지가 규칙에 맞습니다
- [ ] 비밀 정보가 포함되지 않았습니다
```

**④ 첫 코드**

`calc.py` 를 만듭니다.

```python
def add(a, b):
    return a + b


def sub(a, b):
    return a - b
```

`README.md` 도 만듭니다.

```markdown
# Team Project

Git 학습 매뉴얼 중급 종합 실습용 저장소입니다.
```

```bash
git add .
git commit -m "feat: 기본 사칙연산 함수 추가"
```

**⑤ GitHub 저장소 생성 후 push**

GitHub에서 `team-project` 저장소를 만듭니다. **README·.gitignore·license 전부 체크 해제.**

```bash
git remote add origin https://github.com/<내아이디>/team-project.git
git push -u origin main
```

**⑥ 보호 규칙 설정** ([13강](lesson-13.md))

Settings → Branches → Add rule → `main`

- ✅ `Require a pull request before merging`
- ⬜ `Require approvals` — **혼자 실습이면 해제** (본인 PR 승인 불가)
- ⬜ `Allow force pushes` — **해제 유지**

Settings → General → Pull Requests

- ✅ `Allow squash merging` 만 남기고 나머지 해제
- ✅ `Automatically delete head branches`

**⑦ 검증**

```bash
echo "직접 수정" >> README.md
git commit -am "test: 보호 규칙 확인"
git push
```

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
```

**막혔습니다.** 되돌립니다.

```bash
git reset --hard origin/main
```

**⑧ 팀원 환경 만들기**

```bash
cd ~/Desktop
git clone https://github.com/<내아이디>/team-project.git team-project-b
```

이제 두 폴더가 있습니다.

| 폴더 | 역할 |
|---|---|
| `team-project` | **나 (A)** |
| `team-project-b` | **팀원 (B)** |

---

### 미션 2. PR 사이클 완주 (14·15·18강)

> **목표** — 이슈 → 브랜치 → `add -p` → `--fixup` → `rebase -i` → PR → Squash merge 를 한 번에.

**① 이슈 생성**

GitHub Issues → New issue

```
제목: 곱셈과 나눗셈 기능이 필요합니다

본문:
현재 add, sub 만 있습니다. mul, div 를 추가해 주세요.
div 는 0으로 나누는 경우를 처리해야 합니다.
```

이슈 번호를 확인합니다 (예: `#1`).

**② 브랜치와 작업**

```bash
cd ~/Desktop/team-project
git switch -c feature/1-mul-div
```

`calc.py` 에 **세 가지가 섞인** 변경을 만듭니다.

```python
def add(a, b):
    return a + b


def sub(a, b):
    return a - b


def mul(a, b):                      # ← ① 새 기능
    return a * b


def div(a, b):                      # ← ② 또 다른 새 기능
    if b == 0:
        raise ValueError("0으로 나눌 수 없습니다")
    return a / b


print("DEBUG: 모듈 로드됨")           # ← ③ 디버깅용 (커밋 금지)
```

**③ `add -p` 로 나눠 담기** ([15강](lesson-15.md))

```bash
git add -p calc.py
```

- `mul` 부분 → `y` (필요하면 `s` 로 쪼개기)
- 나머지 → `n`

```bash
git diff --staged                    # mul 만 있는지 확인
git commit -m "feat: 곱셈 함수 추가"
```

```bash
git add -p calc.py
```

- `div` 부분 → `y`
- `DEBUG` 줄 → `n`

```bash
git commit -m "feat: 나눗셈 함수 추가 (0 나누기 예외 처리)"
```

```bash
git diff                             # DEBUG 줄만 남았는지
git restore calc.py                  # 폐기
```

**④ 문서 커밋**

```bash
cat >> README.md << 'EOF'

## 함수

- `add(a, b)` · `sub(a, b)` · `mul(a, b)` · `div(a, b)`
EOF
git add README.md
git commit -m "docs: 함수 목록 추가"
git push -u origin feature/1-mul-div
```

**⑤ PR 생성**

GitHub에서 PR을 만듭니다. 템플릿이 자동으로 채워집니다.

````markdown
## 무엇을

곱셈·나눗셈 함수를 추가했습니다.

Closes #1

## 왜

사칙연산 중 절반만 구현되어 있었습니다.

## 확인 방법

```python
from calc import mul, div
mul(3, 4)   # 12
div(10, 2)  # 5.0
div(1, 0)   # ValueError
```
````

**⑥ 셀프 리뷰 후 `--fixup` 으로 반영** ([18강](lesson-18.md))

Files changed 탭에서 코멘트를 답니다. 예: "div 결과를 정수로 나눌 옵션이 있으면 좋겠습니다."

```bash
git log --oneline -3
```

```
c4e8a19 (HEAD -> feature/1-mul-div) docs: 함수 목록 추가
7b2f5d3 feat: 나눗셈 함수 추가 (0 나누기 예외 처리)
9a1c8e6 feat: 곱셈 함수 추가
```

`calc.py` 의 `div` 를 고칩니다.

```python
def div(a, b, integer=False):
    if b == 0:
        raise ValueError("0으로 나눌 수 없습니다")
    return a // b if integer else a / b
```

```bash
git add calc.py
git commit --fixup 7b2f5d3
git log --oneline -4
```

```
2f9d4b8 (HEAD -> feature/1-mul-div) fixup! feat: 나눗셈 함수 추가 (0 나누기 예외 처리)
c4e8a19 docs: 함수 목록 추가
7b2f5d3 feat: 나눗셈 함수 추가 (0 나누기 예외 처리)
9a1c8e6 feat: 곱셈 함수 추가
```

**⑦ 이력 정리**

```bash
git rebase -i --autosquash HEAD~4
```

목록이 이미 정리된 채로 열립니다. 저장만 하면 됩니다.

```
pick  9a1c8e6 feat: 곱셈 함수 추가
pick  7b2f5d3 feat: 나눗셈 함수 추가 (0 나누기 예외 처리)
fixup 2f9d4b8 fixup! feat: 나눗셈 함수 추가 (0 나누기 예외 처리)
pick  c4e8a19 docs: 함수 목록 추가
```

```bash
git log --oneline -3
git push --force-with-lease
```

> ⚠️ 실무에서는 **리뷰 후 force push를 피하는 것**이 원칙입니다 ([14강](lesson-14.md)).
> 여기서는 `--fixup` + `--autosquash` 를 연습하기 위해 일부러 해 보는 것입니다.

**⑧ Squash and merge**

병합 메시지를 다듬습니다.

```
feat: 곱셈·나눗셈 함수 추가 (#2)

- mul(a, b)
- div(a, b, integer=False) — 0 나누기 예외 처리

Closes #1
```

병합 후 **이슈가 자동으로 닫혔는지** 확인하세요.

```bash
git switch main
git pull
git branch -D feature/1-mul-div      # Squash 병합이라 -d 는 거부될 수 있음
git fetch --prune
```

---

### 미션 3. 충돌 3종 해결 (11강)

> **목표** — content · add/add · modify/delete 를 각각 만들고 해결한다.

**① content 충돌**

```bash
# A (나)
cd ~/Desktop/team-project
git switch -c feature/greeting-a
```

`calc.py` 맨 위에 추가합니다.

```python
APP_NAME = "계산기 v1"
```

```bash
git add calc.py && git commit -m "feat: 앱 이름 상수 추가"
```

```bash
# B (팀원)
cd ~/Desktop/team-project-b
git pull
```

같은 위치에 다르게 추가합니다.

```python
APP_NAME = "Team Calculator"
```

```bash
git switch -c feature/greeting-b
git add calc.py && git commit -m "feat: 앱 이름 정의"
git push -u origin feature/greeting-b
```

B를 먼저 `main` 에 병합했다고 가정합니다. (PR로 하거나, 실습 편의상 아래처럼)

```bash
cd ~/Desktop/team-project
git fetch
git switch main
git merge origin/feature/greeting-b
git switch feature/greeting-a
git rebase main
```

**충돌 발생.** `zdiff3` 로 공통 조상까지 확인하고 해결합니다.

```python
APP_NAME = "Team Calculator (계산기 v1)"
```

```bash
git diff --check                  # 마커 남았나
git add calc.py
git rebase --continue
```

**② add/add 충돌**

```bash
git switch main
git switch -c feature/config-a
echo "DEBUG = True" > config.py
git add config.py && git commit -m "chore: 개발용 설정 추가"

git switch main
git switch -c feature/config-b
echo "DEBUG = False" > config.py
git add config.py && git commit -m "chore: 운영용 설정 추가"

git switch main
git merge feature/config-a
git merge feature/config-b
```

```
CONFLICT (add/add): Merge conflict in config.py
```

```bash
git checkout --theirs config.py       # 또는 --ours, 또는 직접 편집
git add config.py
git commit -m "Merge branch 'feature/config-b' (운영 설정 채택)"
```

**③ modify/delete 충돌**

```bash
git switch -c feature/remove-config
git rm config.py
git commit -m "chore: 설정 파일 제거 (환경변수로 대체 예정)"

git switch main
echo "LOG_LEVEL = 'INFO'" >> config.py
git add config.py && git commit -m "chore: 로그 레벨 설정 추가"

git merge feature/remove-config
```

```
CONFLICT (modify/delete): config.py deleted in feature/remove-config and modified in HEAD.
```

**마커가 없습니다. 결정만 하면 됩니다.**

```bash
git add config.py                     # 남기기로 결정
git commit -m "Merge branch 'feature/remove-config' (config.py 는 유지)"
```

정리합니다.

```bash
git branch -D feature/greeting-a feature/config-a feature/config-b feature/remove-config
```

> ✅ **체크** — 세 유형이 각각 어떻게 다른지 설명할 수 있나요?
> content는 마커, add/add도 마커, **modify/delete는 마커가 없고 결정만** 하면 됩니다.

---

### 미션 4. 사고와 복구 (16·17강)

> **목표** — 실무에서 자주 나는 사고 네 가지를 직접 만들고 수습한다.

**① 작업 중 급한 일** ([16강](lesson-16.md))

```bash
git switch -c feature/stats
cat >> calc.py << 'EOF'


def average(numbers):
    # TODO: 빈 리스트 처리
    return sum(numbers) / len(numbers)
EOF
echo "# 통계 함수 설계 메모" > STATS_NOTES.md

git stash -u -m "통계 함수 작업 중 (빈 리스트 미처리)"
git status                            # clean 확인
```

급한 수정을 처리합니다.

```bash
git switch main
git switch -c hotfix/div-message
sed -i 's/0으로 나눌 수 없습니다/0으로 나눌 수 없습니다. 두 번째 인자를 확인하세요./' calc.py
git add calc.py && git commit -m "fix: 나눗셈 예외 메시지 개선"
git switch main
git merge --no-ff hotfix/div-message
git branch -d hotfix/div-message
```

복귀합니다.

```bash
git switch feature/stats
git stash list
git stash show -p stash@{0}
git stash pop
```

`STATS_NOTES.md` 도 돌아왔는지 확인하세요. **`-u` 의 효과입니다.**

```bash
rm STATS_NOTES.md
git add calc.py && git commit -m "feat: 평균 계산 함수 추가"
git switch main && git merge --no-ff feature/stats && git branch -d feature/stats
```

**② push한 커밋 되돌리기** ([17강](lesson-17.md))

```bash
git switch -c feature/danger
cat >> calc.py << 'EOF'


def wipe_all():
    import os
    for f in os.listdir("."):
        print(f"삭제 대상: {f}")
EOF
git add calc.py && git commit -m "feat: 파일 정리 기능 추가"
git switch main && git merge --no-ff feature/danger && git branch -d feature/danger
git push
```

**위험한 기능이라 되돌리기로 했습니다.** 이미 push했으므로 `revert` 입니다.

```bash
git log --oneline --graph -3
git revert -m 1 HEAD          # 머지 커밋이므로 -m 1
git push
grep -c "wipe_all" calc.py    # 0
```

**③ 머지 revert의 함정 확인**

```bash
git switch -c feature/danger-v2 HEAD~2     # revert 전의 브랜치 지점
git log --oneline -1
```

기능을 안전하게 고쳤다고 가정하고 다시 병합해 봅니다.

```bash
git switch main
git merge --no-ff feature/danger-v2
grep -c "wipe_all" calc.py
```

**0이 나옵니다.** 함정이 재현됐습니다. 해결합니다.

```bash
git log --oneline -5           # revert 커밋 해시 찾기
git revert <revert 커밋 해시> --no-edit
grep -c "wipe_all" calc.py     # 1
```

```bash
git branch -D feature/danger-v2
git push
```

**④ reflog로 복구** ([07강](lesson-07.md)·[23강](lesson-23.md))

```bash
echo "중요한 작업" > important.txt
git add important.txt && git commit -m "feat: 중요한 작업"
git log --oneline -1
```

실수로 날립니다.

```bash
git reset --hard HEAD~1
ls important.txt              # 없음
```

복구합니다.

```bash
git reflog -5
```

```
a3f9c2e (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1
8d4b1f7 HEAD@{1}: commit: feat: 중요한 작업
```

```bash
git reset --hard 8d4b1f7
ls important.txt              # 돌아옴
```

```bash
git rm important.txt && git commit -m "chore: 실습 파일 정리"
git push
```

---

### 미션 5. 릴리스 (19강)

> **목표** — 태그 · CHANGELOG · GitHub Release 를 만든다.

```bash
git switch main
git pull
echo "VERSION = '1.0.0'" > version.py
git add version.py
git commit -m "chore: 버전 1.0.0"
```

> `main` 이 보호되어 있으면 이 커밋도 PR로 올려야 합니다. 실습에서는 PR을 하나 더 만들어 진행하세요.

```bash
git tag -a v1.0.0 -m "첫 정식 릴리스

- 사칙연산 (add, sub, mul, div)
- 평균 계산
- 0 나누기 예외 처리"

git push --follow-tags
git tag -n
```

GitHub의 **Tags** 에 나타나는지 확인합니다.

**변경 로그**

```bash
git log --oneline --no-merges v1.0.0
```

`CHANGELOG.md` 를 작성하고 커밋합니다.

```markdown
# 변경 이력

## [1.0.0] - 2026-08-10

### 추가
- 사칙연산 함수 (`add` `sub` `mul` `div`)
- 평균 계산 함수 (`average`)

### 수정
- 0으로 나눌 때의 예외 메시지 개선
```

**GitHub Release** — Releases → Draft a new release → `v1.0.0` 선택 → **Generate release notes** → Publish

```bash
git describe --tags --always --dirty
```

---

### 미션 6. 정리

```bash
cd ~/Desktop
rm -rf team-project-b          # PowerShell: Remove-Item -Recurse -Force team-project-b
```

```bash
cd team-project
git log --oneline --graph --all -20
git branch -a
git tag
```

**최종 확인**

- [ ] `main` 에 직접 push가 막혀 있다
- [ ] 모든 변경이 PR로 들어왔다
- [ ] 커밋 메시지가 Conventional Commits 규격이다
- [ ] `CONTRIBUTING.md` · PR 템플릿 · `.gitattributes` 가 있다
- [ ] 태그와 릴리스가 만들어져 있다

---

## ⑤ 자주 하는 실수 — 중급 트러블슈팅 참조

| 증상 / 메시지 | 원인 | 해결 |
|---|---|---|
| `CONFLICT (content)` | 같은 줄을 다르게 수정 | 마커 정리 → `git add` → `git commit` ([11](lesson-11.md)) |
| `CONFLICT (modify/delete)` | 한쪽 수정, 한쪽 삭제 | `git rm` 또는 `git add` 로 결정 ([11](lesson-11.md)) |
| 마커가 코드에 커밋됨 | 지우지 않고 `add` | `git diff --check` 로 사전 검사 ([11](lesson-11.md)) |
| `Committing is not possible because you have unmerged files` | 해결 표시 안 함 | `git add <파일>` ([11](lesson-11.md)) |
| `There is no merge to abort` | 이미 커밋 완료 | `reset --hard` (push 전) / `revert -m 1` ([11](lesson-11.md)) |
| rebase 후 `non-fast-forward` | 해시가 바뀜 | `git push --force-with-lease` ([12](lesson-12.md)) |
| `--force-with-lease` 도 `stale info` | 원격에 모르는 변경 | `git fetch` → **내용 확인** → 판단 ([17](lesson-17.md)) |
| `interactive rebase in progress` | rebase 방치 | `--continue` / `--abort` / `--edit-todo` ([18](lesson-18.md)) |
| `cannot 'squash' without a previous commit` | 첫 줄이 squash | 첫 줄은 `pick` ([18](lesson-18.md)) |
| `--autosquash` 가 동작 안 함 | 메시지 형식 불일치 | `git commit --fixup <해시>` 사용 ([18](lesson-18.md)) |
| stash 했는데 새 파일이 남음 | `-u` 누락 | `git stash -u` ([16](lesson-16.md)) |
| `git stash pop` 충돌 | 이후에 같은 곳이 바뀜 | 해결 후 **`git stash drop`** ([16](lesson-16.md)) |
| cherry-pick `is a merge but no -m` | 머지 커밋 | `git cherry-pick -m 1 <해시>` ([16](lesson-16.md)) |
| `Already up to date` (다시 병합했는데) | **머지 revert 함정** | revert 를 revert ([17](lesson-17.md)) |
| `commit ... is a merge but no -m option` | 머지 revert | `git revert -m 1 <해시>` ([17](lesson-17.md)) |
| 태그가 GitHub에 없음 | push 안 됨 | `git push --follow-tags` ([19](lesson-19.md)) |
| `No annotated tags can describe` | lightweight 태그 | `-a` 로 만들기 / `describe --tags` ([19](lesson-19.md)) |
| `Protected branch update failed` | main 직접 push | PR로 진행 ([13](lesson-13.md)) |
| Squash 병합 후 `-d` 거부 | 해시가 달라짐 | `git branch -D` ([14](lesson-14.md)) |

### 위험한 명령 (중급판)

```
🚨 git push --force            남의 커밋 소실 → --force-with-lease 를 쓸 것
🚨 공유 브랜치 rebase           팀 전체 이력 어긋남
🚨 git tag -f + push --force   배포된 태그 내용 변조
🚨 git stash clear             보관 중인 작업 전부 소실
⚠️ git rebase --skip           그 커밋의 변경이 통째로 사라짐
```

---

## ⑥ 확인 문제

**1.** 아래 상황을 **순서대로** 처리하는 명령을 적어 보세요.

```
feature/login 브랜치에서 3일간 작업했다. 커밋은 7개인데
그중 4개가 "리뷰 반영", "오타" 같은 것이다.
그 사이 main 에 10개 커밋이 쌓였다.
PR을 올리기 전에 정리하고 싶다.
```

<details>
<summary>답 보기</summary>

```bash
# ① 최신 main 을 가져온다
git fetch

# ② 내 브랜치를 최신 main 위로 옮긴다 (12강)
git switch feature/login
git rebase origin/main
#    충돌이 나면: 해결 → git add → git rebase --continue

# ③ 지저분한 커밋을 정리한다 (18강)
git rebase -i HEAD~7
```

목록에서 잡동사니를 `fixup` 으로 바꿉니다.

```
pick  aaa1111 feat: 로그인 폼 추가
fixup bbb2222 오타
pick  ccc3333 feat: 세션 처리 추가
fixup ddd4444 리뷰 반영
fixup eee5555 리뷰 반영 2
pick  fff6666 docs: 로그인 안내 추가
fixup ggg7777 오타 2
```

```bash
# ④ 각 커밋이 동작하는지 검증 (선택)
git rebase -i --exec "python -m pytest" HEAD~3

# ⑤ 올린다 (이력을 다시 썼으므로)
git push --force-with-lease

# ⑥ PR 생성
gh pr create --fill
```

**주의할 점**

- **②를 먼저** 하는 이유: `main` 위로 옮긴 뒤 정리해야 최종 결과가 깔끔합니다. 순서를 바꾸면 충돌을 두 번 겪을 수 있습니다.
- **나만 쓰는 브랜치인지 확인** — 팀원이 이 브랜치를 받아 갔다면 rebase 금지입니다 ([12강](lesson-12.md)).
- 불안하면 백업을 남기세요: `git branch backup-before-rebase`

**더 쉬운 대안** — 애초에 `git commit --fixup <해시>` 로 커밋했다면 ③이 이렇게 끝납니다.

```bash
git rebase -i --autosquash HEAD~7      # 저장만 하면 됨
```

**또는** — 정리가 귀찮다면 PR을 **Squash and merge** 로 병합하면 `main` 에는 커밋 하나만 들어갑니다 ([14강](lesson-14.md)).
</details>

**2.** 팀원이 다급하게 연락했습니다. **"제가 `main` 에 `git push --force` 를 했는데, 다른 분들 커밋이 사라진 것 같아요."** 어떻게 대응하시겠습니까?

<details>
<summary>답 보기</summary>

**① 즉시 팀에 공지 — 아무도 `pull` 하지 않게 합니다**

지금 `pull` 하면 각자의 로컬도 오염됩니다. **가장 먼저 할 일은 알리는 것**입니다.

**② 사라진 커밋 찾기**

강제 push한 사람의 로컬에 흔적이 남아 있습니다.

```bash
git reflog --date=iso
```

```
a3f9c2e HEAD@{0}: push: forced update
8d4b1f7 HEAD@{1}: pull: Fast-forward       ← 사라지기 전 상태
```

**다른 팀원의 로컬**에도 남아 있습니다. 가장 최근에 `pull` 한 사람의 `origin/main` 이 정답입니다.

```bash
git reflog show origin/main
git log --oneline origin/main
```

**GitHub에서도 찾을 수 있습니다** — Settings → **Activity** (또는 이벤트 API)에 force push 전후 해시가 기록됩니다.

**③ 복구**

```bash
git fetch
git switch main
git reset --hard <사라지기 전 해시>
git push --force-with-lease
```

복구 후 팀 전체가 갱신합니다.

```bash
git fetch --prune
git switch main
git reset --hard origin/main      # ⚠️ 로컬 변경은 먼저 stash
```

**④ 재발 방지** — 이게 진짜 대응입니다.

| 조치 | 설명 |
|---|---|
| **브랜치 보호에서 `Allow force pushes` 해제** | 물리적으로 불가능해집니다 ([13강](lesson-13.md)) |
| `Require a pull request before merging` | `main` 직접 push 자체를 차단 |
| 별칭 등록 | `git config --global alias.pushf "push --force-with-lease"` |
| 팀 교육 | `--force` 대신 `--force-with-lease` ([17강](lesson-17.md)) |

**핵심** — 개인을 탓하지 마세요. **막지 않은 설정의 책임**입니다.
</details>

**3.** 후배가 묻습니다. **"merge, rebase, cherry-pick, revert 다 커밋을 옮기는 거 아닌가요? 뭐가 다르죠?"** 표로 정리해 설명해 보세요.

<details>
<summary>답 보기</summary>

| | `merge` | `rebase` | `cherry-pick` | `revert` |
|---|---|---|---|---|
| **하는 일** | 두 갈래를 합침 | 브랜치의 베이스를 옮김 | 커밋 하나를 **복사** | 커밋을 **취소** |
| 대상 | 브랜치 전체 | 브랜치 전체 | **커밋 골라서** | 커밋 골라서 |
| 원본 커밋 | 보존 | **다시 씀 (해시 변경)** | 보존 (복사본 생성) | 보존 |
| 새 커밋 | 머지 커밋 1개 | 옮긴 개수만큼 | 가져온 개수만큼 | 취소 커밋 |
| 이력 모양 | 가지 | 일직선 | 일직선 | 일직선 |
| push 후 | ✅ 안전 | 🚨 공유 브랜치 금지 | ✅ 안전 | ✅ 안전 |

**언제 쓰나**

```
브랜치를 통합한다             →  merge
내 브랜치를 최신으로 만든다     →  rebase
커밋 하나만 다른 곳에 필요하다  →  cherry-pick
이미 배포된 것을 되돌린다      →  revert
```

**그림으로**

```
merge        A─B─┬─X─Y─┐
                 │     M       (합류 지점 M 생성)
                 └─C─D─┘

rebase       A─B─C─D─X'─Y'     (X,Y 를 D 뒤로 옮김. 해시 변경)

cherry-pick  A─B─C─D─X'        (X 만 복사. 원본 X 는 그대로)

revert       A─B─C─D─D'        (D 를 취소하는 커밋 추가)
```

**핵심 구분**

- **merge / rebase** — 브랜치 **전체**를 다룸
- **cherry-pick** — 커밋 **하나**를 가져옴
- **revert** — 커밋을 **없던 일로** 만듦 (이력은 남김)

**안전성 한 줄**
> **rebase만 이력을 다시 씁니다.** 나머지 셋은 기존 커밋을 건드리지 않으므로 push 후에도 안전합니다.
> 그래서 황금률은 rebase(와 `rebase -i`, `--amend`)에만 적용됩니다.
</details>

---

## 🏁 중급 수료 체크리스트

**전부 ✅ 여야 고급으로 넘어갑니다.**

### 개념

- [ ] 3-way merge에서 base / ours / theirs 를 설명할 수 있다 ([11](lesson-11.md))
- [ ] merge와 rebase가 만드는 이력의 차이를 그릴 수 있다 ([12](lesson-12.md))
- [ ] rebase의 황금률과 그 이유를 설명할 수 있다 ([12](lesson-12.md))
- [ ] GitHub Flow / Git Flow / Trunk-based 를 비교하고 고를 수 있다 ([13](lesson-13.md))
- [ ] Merge 버튼 3종의 결과 차이를 안다 ([14](lesson-14.md))
- [ ] reset과 revert를 언제 쓰는지 판단할 수 있다 ([17](lesson-17.md))
- [ ] SemVer 규칙으로 다음 버전을 정할 수 있다 ([19](lesson-19.md))

### 손

- [ ] content / add-add / modify-delete 충돌을 각각 해결할 수 있다 ([11](lesson-11.md))
- [ ] `git rebase origin/main` 으로 브랜치를 최신화할 수 있다 ([12](lesson-12.md))
- [ ] 브랜치 보호 규칙을 설정할 수 있다 ([13](lesson-13.md))
- [ ] PR을 만들고 리뷰를 반영해 Squash 병합할 수 있다 ([14](lesson-14.md))
- [ ] `git add -p` 로 파일 일부만 커밋할 수 있다 ([15](lesson-15.md))
- [ ] `git stash -u -m` 으로 작업을 보관하고 되찾을 수 있다 ([16](lesson-16.md))
- [ ] `git cherry-pick` 으로 커밋을 골라 가져올 수 있다 ([16](lesson-16.md))
- [ ] `git revert -m 1` 로 머지 커밋을 되돌릴 수 있다 ([17](lesson-17.md))
- [ ] `rebase -i` 로 squash/fixup/reword/drop 을 할 수 있다 ([18](lesson-18.md))
- [ ] `--fixup` + `--autosquash` 조합을 쓸 수 있다 ([18](lesson-18.md))
- [ ] annotated 태그를 만들고 릴리스를 공개할 수 있다 ([19](lesson-19.md))

### 사고 복구

- [ ] 충돌 중 `--abort` 로 안전하게 빠져나온다 ([11](lesson-11.md))
- [ ] rebase 중단 상태를 `--continue` / `--abort` 로 정리한다 ([12](lesson-12.md))
- [ ] 머지 revert 함정을 재현하고 해결할 수 있다 ([17](lesson-17.md))
- [ ] `--force-with-lease` 가 거부됐을 때 원인을 확인하고 판단한다 ([17](lesson-17.md))
- [ ] `reflog` 로 날린 커밋을 되살린다 ([07](lesson-07.md))

### 습관

- [ ] 브랜치를 **3일 이내**로 유지한다
- [ ] PR을 **400줄 이하**로 만든다
- [ ] 리뷰 반영은 **추가 커밋**으로 한다
- [ ] `--force` 대신 `--force-with-lease` 를 쓴다
- [ ] 공유 브랜치는 rebase하지 않는다
- [ ] 커밋 메시지에 **왜**를 쓴다

---

## 📝 중급 실기 평가

> **제한 시간 60분 · 2인 1조 (또는 clone 2개)**

| # | 과제 | 배점 |
|---|---|---|
| 1 | 저장소를 만들고 `main` 보호 규칙 · PR 템플릿 · `CONTRIBUTING.md` 를 설정한다 | 10 |
| 2 | 이슈를 만들고 `<타입>/<이슈번호>-<설명>` 브랜치로 작업한다 | 10 |
| 3 | 한 파일의 변경을 `add -p` 로 **커밋 2개 이상**으로 나눈다 | 15 |
| 4 | PR을 만들고 리뷰 코멘트를 **추가 커밋**으로 반영한다 | 10 |
| 5 | `--fixup` + `--autosquash` 로 이력을 정리한다 | 15 |
| 6 | 상대와 **content 충돌**을 만들고 해결해 병합한다 | 15 |
| 7 | 병합된 PR을 `revert` 하고, 다시 살린다 (**함정 처리 포함**) | 15 |
| 8 | `v1.0.0` 태그와 GitHub Release를 만든다 | 10 |

**감점 항목**

- 충돌 마커가 커밋에 포함됨 **−20**
- 공유 브랜치에 `--force` push **−20**
- `main` 에 직접 push **−10**
- 커밋 메시지가 규격 위반 **−10**

---

## 오늘의 정리

**중급에서 배운 것**

```
11 충돌 해결      12 merge vs rebase   13 브랜치 전략
14 Pull Request  15 좋은 커밋          16 stash · cherry-pick
17 revert         18 rebase -i         19 태그와 릴리스
```

**앞으로 매일 쓰게 될 흐름**

```bash
# 시작
git switch main && git pull
git switch -c feature/42-작업이름

# 작업 (커밋은 add -p 로 나눠서)
git add -p && git commit -m "feat: ..."

# 리뷰 반영
git commit --fixup <해시>

# 병합 직전
git fetch && git rebase origin/main
git rebase -i --autosquash HEAD~5
git push --force-with-lease

# PR → 리뷰 → Squash and merge → 브랜치 삭제

# 릴리스
git tag -a v1.1.0 -m "..." && git push --follow-tags
```

**중급 전체를 관통하는 세 가지**

```
① 충돌은 질문이다        →  --abort 로 언제든 물러설 수 있다
② 공유한 것은 다시 쓰지 않는다  →  rebase·amend·force 는 내 브랜치에서만
③ 규칙은 도구로 강제한다   →  보호 규칙 · 템플릿 · CI
```

**오늘 반드시 기억할 한 가지**
> **"이 커밋을 남이 받아 갔는가?"** 를 먼저 묻는 습관.
> 아니오면 `reset`·`rebase`·`amend` 자유롭게, 예면 `revert` 와 `merge` 만.

---

## 🔴 다음은 고급입니다

중급까지는 **Git을 쓰는 법**이었습니다. 고급(21~30강)은 **Git이 어떻게 동작하는지**와 **팀의 규칙을 자동화하는 법**입니다.

| 강 | 내용 |
|---|---|
| [21](lesson-21.md) | **`.git` 폴더 해부** — 커밋은 실제로 어떤 데이터인가 |
| [22](lesson-22.md) | **참조와 HEAD** — "브랜치는 포인터"의 실체 |
| [23](lesson-23.md) | **reflog** — 사라진 것처럼 보이는 커밋 되살리기 |
| [24](lesson-24.md) | **3-tree 모델** — reset 세 옵션을 완전히 이해하기 |
| [25](lesson-25.md) | **범인 찾기** — `bisect` · `blame` · 곡괭이 |
| [26](lesson-26.md) | **훅** — 커밋·push 시점에 자동 검사 |
| [27](lesson-27.md) | **GitHub Actions** — PR 자동 검사와 브랜치 보호 |
| [28](lesson-28.md) | **대형 저장소** — submodule · LFS · worktree |
| [29](lesson-29.md) | **사고 대응** — 비밀키 유출, 이력 재작성 |
| [30](lesson-30.md) | 고급 종합 실습 |

**고급을 시작하기 전에**
- 위 체크리스트를 전부 통과하세요.
- 21강부터는 **`.git` 폴더 안을 직접 열어 봅니다.** 버려도 되는 연습용 저장소를 하나 준비하세요.
- 22~24강은 개념 비중이 큽니다. **그림을 그려 가며** 읽는 것을 권합니다.

---

[← 이전 19강](lesson-19.md) · [목차](README.md) · [다음 → 21강 .git 폴더 해부](lesson-21.md)
