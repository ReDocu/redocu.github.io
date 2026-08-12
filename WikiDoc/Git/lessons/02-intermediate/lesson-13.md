# 13강 · 브랜치 전략

> **Git 학습 매뉴얼** · 🟡 중급 · **13강 / 30**
> [← 이전 12강](lesson-12.md) · [목차](README.md) · [다음 → 14강 Pull Request 워크플로](lesson-14.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 대표적인 브랜치 전략 세 가지(GitHub Flow · Git Flow · Trunk-based)의 구조와 차이를 설명할 수 있다.
- 팀 규모·배포 주기에 맞는 전략을 근거를 들어 고를 수 있다.
- 브랜치 이름 규칙을 정하고 문서로 남길 수 있다.
- `main` 브랜치를 보호해 사고를 예방하는 방법을 안다.

---

## ② 왜 필요한가

[08강](lesson-08.md)에서 브랜치를, [12강](lesson-12.md)에서 합치는 방법을 배웠습니다. 그런데 **"언제 어떤 브랜치를 만들고 언제 합칠 것인가"** 는 아직 정하지 않았습니다.

규칙이 없으면 이런 저장소가 됩니다.

```
main
test
test2
새브랜치
feature-login
feature/login-fix
hong_work
temp-20260810
asdf
```

이런 문제가 따라옵니다.

| 증상 | 결과 |
|---|---|
| 어느 브랜치가 **지금 운영 중인 코드**인지 모른다 | 배포 사고 |
| 브랜치가 **6개월째 살아 있다** | 병합할 때 충돌 100개 |
| 급한 버그를 **어디서 고쳐야 할지** 모른다 | 고쳤는데 다음 배포 때 되살아남 |
| `main` 에 아무나 직접 push | 빌드가 깨진 채로 배포 |

**브랜치 전략은 팀의 합의**입니다. 정답이 하나 있는 게 아니라 **팀 규모와 배포 방식에 맞는 것**이 정답입니다. 규모에 안 맞는 무거운 전략을 쓰면 오히려 생산성이 떨어집니다.

---

## ③ 개념 설명

### 브랜치의 두 종류

전략을 이해하려면 먼저 이 구분이 필요합니다.

| 종류 | 수명 | 예 |
|---|---|---|
| **장수 브랜치** (long-lived) | 영구적 | `main`, `develop`, `release` |
| **단명 브랜치** (short-lived) | 며칠 | `feature/login`, `fix/typo`, `hotfix/payment` |

> **전략의 차이는 결국 "장수 브랜치를 몇 개 둘 것인가"** 입니다.
> 장수 브랜치가 많을수록 관리가 복잡해지지만, 복잡한 릴리스 일정을 감당할 수 있습니다.

---

### ① GitHub Flow — 가장 단순하고 가장 많이 씁니다

**장수 브랜치는 `main` 하나뿐입니다.**

```
main  ──●──────●────────●────────●──▶  (항상 배포 가능한 상태)
         \    /  \     /  \     /
          ●──●    ●───●    ●───●
       feature/  fix/     feature/
       login     typo     payment
```

**규칙 6개**

1. `main` 은 **항상 배포 가능한 상태**여야 한다
2. 작업은 `main` 에서 브랜치를 따서 시작한다
3. 브랜치 이름은 **무슨 일을 하는지 알 수 있게** 짓는다
4. 자주 커밋하고 자주 push한다
5. **Pull Request** 로 리뷰를 받는다 ([14강](lesson-14.md))
6. 승인되면 `main` 에 합치고 **바로 배포**한다

| 장점 | 단점 |
|---|---|
| 배우기 쉽다 (브랜치 2종류뿐) | 여러 버전을 동시에 유지할 수 없다 |
| 배포가 빠르다 | `main` 이 깨지면 즉시 영향 |
| 이력이 단순하다 | 배포 자동화(CI/CD)가 없으면 위험 |

**적합** — 웹 서비스, SaaS, 지속적 배포를 하는 팀, **소규모 팀**, 그리고 **대부분의 스터디·개인 프로젝트**

---

### ② Git Flow — 정해진 릴리스 주기가 있을 때

**장수 브랜치가 둘입니다.** `main` 과 `develop`.

```
main     ──●──────────────────●──────────────●──▶  (배포된 버전만)
            \                /  \           /
release      \          ●───●    \     ●───●        (배포 준비)
              \        /          \   /
develop  ──●───●──●───●────────●───●─●──────▶      (다음 릴리스 통합)
            \    /  \         /
feature      ●──●    ●───────●
```

**브랜치 5종류**

| 브랜치 | 출발 | 합류 | 용도 |
|---|---|---|---|
| `main` | — | — | **배포된 코드만.** 태그가 붙음 |
| `develop` | `main` | — | 다음 릴리스를 위한 통합 |
| `feature/*` | `develop` | `develop` | 기능 개발 |
| `release/*` | `develop` | `main` + `develop` | 릴리스 준비 (버그 수정만) |
| `hotfix/*` | **`main`** | **`main` + `develop`** | 운영 긴급 수정 |

> ⚠️ **`hotfix` 와 `release` 는 `main` 과 `develop` 양쪽에 반드시 모두 합쳐야 합니다.**
> 한쪽만 하면 **다음 릴리스에서 같은 버그가 되살아납니다.** Git Flow에서 가장 흔한 사고입니다.

| 장점 | 단점 |
|---|---|
| 릴리스 준비와 개발을 분리 | **복잡하다** (브랜치 5종, 규칙 많음) |
| 여러 버전 동시 유지 가능 | 병합이 잦고 충돌이 많음 |
| 역할이 명확 | 지속적 배포와 잘 안 맞음 |

**적합** — 버전 번호를 붙여 배포하는 제품(설치형 소프트웨어, 모바일 앱), **QA 기간이 정해진 팀**, 여러 버전을 동시에 지원해야 하는 경우

> **참고** — Git Flow를 만든 Vincent Driessen 본인이 2020년 원문에 **"웹 앱이라면 GitHub Flow 같은 더 단순한 방식을 쓰라"** 는 주석을 달았습니다.
> 유명하다는 이유로 무조건 채택하지 마세요.

---

### ③ Trunk-Based Development — 가장 빠른 팀

**브랜치를 거의 안 만듭니다.** 만들어도 **하루 이내**로 끝냅니다.

```
main  ──●─●─●─●─●─●─●─●─●──▶
          \_/   \_/   \_/
         몇 시간짜리 짧은 브랜치
```

**핵심 규칙**

- 브랜치 수명 **최대 1~2일**
- 완성되지 않은 기능은 **기능 플래그(feature flag)** 로 숨겨 두고 코드는 합친다
- **자동 테스트가 필수** — 없으면 성립하지 않는 전략

```python
if FEATURE_FLAGS["new_checkout"]:
    new_checkout()          # 아직 미완성이지만 main 에 들어가 있음
else:
    old_checkout()
```

| 장점 | 단점 |
|---|---|
| 충돌이 거의 없다 | **높은 수준의 테스트 자동화 필수** |
| 통합이 항상 최신 | 기능 플래그 관리 부담 |
| 배포가 매우 빠름 | 미숙한 팀에는 위험 |

**적합** — CI/CD가 잘 갖춰진 팀, 하루에도 여러 번 배포하는 조직

---

### 한눈에 비교

| | GitHub Flow | Git Flow | Trunk-Based |
|---|---|---|---|
| 장수 브랜치 | `main` | `main`, `develop` | `main` |
| 브랜치 수명 | 며칠 | 몇 주 | **몇 시간** |
| 배포 주기 | 수시 | 정해진 일정 | 하루 여러 번 |
| 난이도 | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| 필수 조건 | PR 리뷰 | 규칙 준수 | **자동 테스트** |
| 팀 규모 | 1~20명 | 10명 이상 | 어디든 |

### 우리 팀은 뭘 쓸까 — 의사결정

```
버전 번호를 붙여 배포하나요? (v1.2.0 처럼)
│
├─ 아니오 (웹서비스, 수시 배포)
│   │
│   └─ 자동 테스트가 충분한가요?
│       ├─ 예   →  Trunk-Based
│       └─ 아니오 →  GitHub Flow   ← 대부분 여기
│
└─ 예 (앱 스토어 심사, 설치형, QA 기간 존재)
    │
    └─ 여러 버전을 동시에 지원해야 하나요?
        ├─ 예   →  Git Flow
        └─ 아니오 →  GitHub Flow + 릴리스 태그 ([19강](lesson-19.md))
```

> **스터디·개인 프로젝트·소규모 팀이라면 고민 없이 GitHub Flow** 입니다.
> 나중에 필요해지면 그때 develop 브랜치를 추가하면 됩니다. **처음부터 무겁게 시작하지 마세요.**

### 브랜치 이름 규칙

전략보다 **먼저 정해야 하는 것**이고, 안 지켜지면 전략도 무너집니다.

```
<타입>/<이슈번호>-<간단한-설명>

feature/42-login-form
fix/57-session-timeout
hotfix/payment-error
docs/readme-update
refactor/user-model
chore/update-deps
```

| 규칙 | 이유 |
|---|---|
| 영문 소문자 + 하이픈 | 터미널·CI 도구 호환 |
| `/` 로 타입 구분 | GUI에서 폴더처럼 묶여 보임 |
| **이슈 번호 포함** | PR·이슈와 자동 연결 |
| 공백·한글·특수문자 금지 | 스크립트에서 문제 발생 |

> 이름만 봐도 **"누가 무엇을 왜"** 가 보여야 합니다. `test2`, `hong_work` 같은 이름은 일주일만 지나도 본인도 모릅니다.

### `main` 보호하기

전략을 아무리 잘 세워도 **`main` 에 직접 push할 수 있으면** 언젠가 사고가 납니다. GitHub에서 막을 수 있습니다.

**Settings → Branches → Add branch protection rule**

| 설정 | 효과 |
|---|---|
| `Require a pull request before merging` | **직접 push 금지.** PR로만 합칠 수 있음 |
| `Require approvals` | 리뷰 승인 N명 필요 |
| `Require status checks to pass` | 테스트 통과해야 병합 가능 ([27강](lesson-27.md)) |
| `Do not allow bypassing` | 관리자도 예외 없음 |
| `Allow force pushes` **해제** | 🚨 `--force` 로 이력이 날아가는 사고 방지 |

> 규칙은 **말보다 도구로 강제**해야 지켜집니다. 자세한 설정은 [27강](lesson-27.md)에서 다룹니다.

---

## ④ 단계별 실습

### Step 1. GitHub Flow 한 사이클 돌려 보기

`todo-app` 에 GitHub Flow를 적용해 **기능 하나를 끝까지** 진행합니다.

```bash
cd ~/Desktop/todo-app
git switch main
git pull
```

**① 브랜치 생성 — 이름 규칙을 지켜서**

```bash
git switch -c feature/delete-todo
```

**② 작업하고 커밋** — 작게 나눠서 ([04강](lesson-04.md))

`todo.py` 아래에 추가합니다.

```python
def delete(index):
    todos = load()
    if 1 <= index <= len(todos):
        removed = todos.pop(index - 1)
        save(todos)
        print(f"삭제됨: {removed['text']}")
    else:
        print("그런 번호는 없습니다.")
```

```bash
git add todo.py
git commit -m "feat: 할 일 삭제 기능 구현"
```

```bash
echo "- \`delete(번호)\` : 할 일 삭제" >> README.md
git add README.md
git commit -m "docs: 삭제 기능 사용법 추가"
```

**③ 자주 push** — 백업이자 팀원에게 진행 상황 공유

```bash
git push -u origin feature/delete-todo
```

**④ 작업 중 `main` 이 움직였다면 최신화** ([12강](lesson-12.md))

```bash
git fetch
git rebase origin/main
git push --force-with-lease      # rebase 했으므로
```

**⑤ `main` 에 병합**

실제 팀에서는 여기서 **Pull Request**를 씁니다([14강](lesson-14.md)). 지금은 로컬에서 합칩니다.

```bash
git switch main
git pull
git merge --no-ff feature/delete-todo
```

실행 결과:

```
Merge made by the 'ort' strategy.
 README.md | 1 +
 todo.py   | 9 +++++++++
 2 files changed, 10 insertions(+)
```

> **`--no-ff` 를 쓴 이유** — fast-forward가 가능한 상황이지만 일부러 머지 커밋을 만들었습니다.
> 그러면 **"여기서 `feature/delete-todo` 기능이 통합됐다"** 는 사실이 그래프에 남습니다. 기능 단위로 되돌리기([17강](lesson-17.md))도 쉬워집니다.

**⑥ 배포하고 브랜치 정리**

```bash
git push
git branch -d feature/delete-todo
git push origin --delete feature/delete-todo
```

```bash
git log --oneline --graph -6
```

실행 결과:

```
*   7f2b9d1 (HEAD -> main, origin/main) Merge branch 'feature/delete-todo'
|\
| * 4c8e3a7 docs: 삭제 기능 사용법 추가
| * 9d1f5b2 feat: 할 일 삭제 기능 구현
|/
* 9c3e7a2 docs: 내 메모 추가
* 6a1c8e3 docs: 팀원 메모 추가
```

**기능 하나가 그래프에서 하나의 덩어리로 보입니다.**

### Step 2. hotfix 시나리오

운영 중 급한 버그가 터진 상황입니다. **GitHub Flow에서는 특별할 게 없습니다.**

```bash
git switch main
git pull
git switch -c hotfix/empty-text
```

`todo.py` 의 `add()` 에 검증을 넣습니다.

```python
def add(text, priority="보통"):
    if not text or not text.strip():
        print("할 일 내용을 입력해 주세요.")
        return
    todos = load()
    todos.append({"text": text.strip(), "done": False, "priority": priority})
    save(todos)
    print(f"[추가] 할 일이 등록되었습니다: {text}")
```

```bash
git add todo.py
git commit -m "fix: 빈 문자열로 할 일이 등록되던 문제 수정"
git push -u origin hotfix/empty-text

git switch main
git merge --no-ff hotfix/empty-text
git push
git branch -d hotfix/empty-text
git push origin --delete hotfix/empty-text
```

> **Git Flow였다면** 여기서 `develop` 에도 합쳐야 합니다.
> ```bash
> git switch develop
> git merge --no-ff hotfix/empty-text     # ← 이걸 빼먹는 사고가 정말 많습니다
> ```
> 브랜치가 하나뿐인 GitHub Flow에는 이 문제 자체가 없습니다. **단순함의 가치입니다.**

### Step 3. Git Flow 흉내 내 보기 (선택)

차이를 체감하기 위해 `develop` 브랜치를 만들어 봅니다.

```bash
git switch -c develop
git push -u origin develop
```

기능은 `develop` 에서 갈라집니다.

```bash
git switch -c feature/search develop
```

`todo.py` 에 검색 기능을 추가합니다.

```python
def search(keyword):
    todos = load()
    found = [t for t in todos if keyword in t["text"]]
    if not found:
        print(f"'{keyword}' 를 포함한 할 일이 없습니다.")
        return
    for t in found:
        print(f"- {t['text']}")
```

```bash
git add todo.py
git commit -m "feat: 할 일 검색 기능 추가"

git switch develop
git merge --no-ff feature/search
git branch -d feature/search
```

릴리스 준비 브랜치를 만들고,

```bash
git switch -c release/1.1.0 develop
echo "VERSION = '1.1.0'" > version.py
git add version.py
git commit -m "chore: 버전 1.1.0"
```

**양쪽에 합칩니다. 이것이 Git Flow의 핵심이자 부담입니다.**

```bash
git switch main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "1.1.0 릴리스"      # 태그는 19강

git switch develop
git merge --no-ff release/1.1.0          # ← 여기를 빼먹으면 안 됩니다

git branch -d release/1.1.0
```

```bash
git log --oneline --graph --all -12
```

**merge 횟수가 눈에 띄게 늘어난 것**을 확인하세요. 이것이 Git Flow의 비용입니다.

연습이 끝났으면 정리합니다. (계속 GitHub Flow로 갈 예정입니다)

```bash
git switch main
git push
git push origin --delete develop
git branch -D develop
```

### Step 4. 규칙을 문서로 남기기

**전략은 문서화하지 않으면 지켜지지 않습니다.** 저장소 루트에 `CONTRIBUTING.md` 를 만듭니다.

````markdown
# 기여 가이드

## 브랜치 전략 — GitHub Flow

- `main` 은 **항상 배포 가능한 상태**를 유지합니다.
- `main` 에 **직접 push하지 않습니다.** 모든 변경은 PR로 들어옵니다.
- 작업은 `main` 에서 브랜치를 따서 시작하고, 완료되면 삭제합니다.

## 브랜치 이름

```
<타입>/<이슈번호>-<설명>
```

| 타입 | 용도 |
|---|---|
| `feature/` | 새 기능 |
| `fix/` | 버그 수정 |
| `hotfix/` | 운영 긴급 수정 |
| `docs/` | 문서 |
| `refactor/` | 구조 개선 |
| `chore/` | 설정·의존성 등 |

예: `feature/42-login-form`, `fix/57-session-timeout`

- 영문 소문자와 하이픈만 사용합니다.
- 브랜치 수명은 **3일 이내**를 목표로 합니다. 길어지면 작업을 쪼개세요.

## 커밋 메시지

```
<타입>: <무엇을 했는지>

왜 그렇게 했는지 (선택)
```

타입은 브랜치 타입과 동일합니다. 자세한 규칙은 15강 참고.

## 병합 규칙

- `main` 최신화는 **rebase**: `git rebase origin/main`
- `main` 으로의 통합은 **merge --no-ff** (또는 PR의 Merge commit)
- 공유 브랜치는 **절대 rebase하지 않습니다.**

## 금지 사항

- `main` 에 직접 push
- 공유 브랜치에 `--force` push (`--force-with-lease` 도 마찬가지)
- `.env` 등 비밀 정보 커밋
````

```bash
git add CONTRIBUTING.md
git commit -m "docs: 기여 가이드와 브랜치 전략 문서화"
git push
```

> **GitHub는 `CONTRIBUTING.md` 를 특별 취급합니다.** PR을 열 때 링크가 자동으로 노출됩니다.
> 새로 합류한 사람이 가장 먼저 읽게 되는 문서입니다.

### Step 5. `main` 브랜치 보호하기

GitHub 저장소에서 설정합니다.

1. **Settings** → 왼쪽 **Branches**
2. **Add branch protection rule** (또는 **Add rule**)
3. Branch name pattern: **`main`**
4. 체크할 항목

| 항목 | 설명 |
|---|---|
| ✅ `Require a pull request before merging` | 직접 push 차단 |
| ✅ └ `Require approvals` (1명) | 리뷰 승인 필요 |
| ⬜ `Allow force pushes` | **반드시 해제 상태 유지** |
| ⬜ `Allow deletions` | **반드시 해제 상태 유지** |

5. **Create** / **Save changes**

**확인해 봅시다.**

```bash
echo "직접 수정" >> README.md
git add README.md
git commit -m "test: 보호 규칙 확인"
git push
```

실행 결과:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
To https://github.com/hong-gildong/todo-app.git
 ! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs to 'https://github.com/hong-gildong/todo-app.git'
```

**막혔습니다.** 이제 실수로 `main` 을 건드릴 수 없습니다.

방금 만든 커밋은 브랜치로 옮기면 됩니다.

```bash
git switch -c chore/protection-test
git push -u origin chore/protection-test
git switch main
git reset --hard origin/main
```

> ⚠️ **혼자 실습 중이라면 `Require approvals` 는 빼는 게 좋습니다.**
> 본인 PR을 본인이 승인할 수 없어서 병합이 막힙니다. [14강](lesson-14.md) 실습에 지장이 생깁니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| 브랜치 목록·정리 | GitHub 저장소 → **Branches** 탭 (병합된 브랜치 일괄 삭제 가능) |
| 병합 후 브랜치 자동 삭제 | Settings → General → **Automatically delete head branches** ✅ |
| 브랜치 그래프 | VS Code **Git Graph** 확장 |
| 보호 규칙 | GitHub Settings → Branches |

> **`Automatically delete head branches` 를 꼭 켜세요.** PR이 병합되면 브랜치가 자동으로 지워져서 목록이 깔끔하게 유지됩니다.

---

## ⑤ 자주 하는 실수

### 팀 규모에 안 맞는 무거운 전략 채택

**증상** — 3명짜리 팀이 Git Flow를 도입하고, `develop` 과 `main` 이 갈라진 채 **6개월째 병합되지 않습니다.**
**원인** — "유명하니까", "제대로 하는 것 같으니까" 라는 이유로 골랐습니다.
**해결** — **작게 시작하세요.**

```
GitHub Flow 로 시작
  → 릴리스 일정이 생기면 develop 추가
  → 여러 버전 지원이 필요하면 release 브랜치 추가
```

필요해질 때 추가하는 것은 쉽지만, 이미 복잡한 것을 단순화하는 것은 어렵습니다.

### hotfix를 `develop` 에 반영하지 않음 (Git Flow)

**증상** — 급한 버그를 `main` 에서 고쳐 배포했는데, **다음 릴리스에서 같은 버그가 되살아납니다.**
**원인** — `hotfix` 를 `main` 에만 합치고 `develop` 을 빼먹었습니다. `develop` 에는 아직 옛날 코드가 있으니 다음 릴리스 때 덮어씁니다.
**해결** —

```bash
git switch develop
git merge --no-ff hotfix/payment-error
```

**예방** — 체크리스트를 만들거나, 애초에 브랜치가 하나뿐인 GitHub Flow를 쓰세요.

### `main` 에 직접 push

**증상** — 테스트 안 된 코드가 운영에 배포됩니다.
**원인** — 규칙은 있지만 강제하지 않았습니다.
**해결** — **브랜치 보호 규칙**으로 막습니다 (Step 5). 말로 하는 규칙은 언젠가 깨집니다.

### 브랜치가 너무 오래 삽니다

**증상** — 2주 된 브랜치를 병합하려니 충돌 40개 ([11강](lesson-11.md)).
**원인** — 기능 단위가 너무 큽니다.
**해결** — 쪼개세요.

```
❌ feature/user-system              (2주)

✅ feature/user-model               (1일)
✅ feature/user-signup-form         (1일)
✅ feature/user-login               (1일)
✅ feature/user-profile             (1일)
```

**"완성되지 않아도 합칠 수 있는 단위"** 로 나누는 것이 요령입니다. 화면이 미완성이면 라우팅만 빼 두거나, 기능 플래그로 숨기면 됩니다.

### 브랜치 이름이 제각각

```
login
Login-Feature
feature_login
feature/로그인
hong-login-2
```

**원인** — 규칙을 정하지 않았거나 문서화하지 않았습니다.
**해결** — `CONTRIBUTING.md` 에 적고(Step 4), 팀에 공유하세요. GitHub Actions로 브랜치명을 검사할 수도 있습니다 ([27강](lesson-27.md)).

### 병합한 브랜치를 안 지움

**증상** — 브랜치 목록에 50개가 쌓여 뭐가 살아 있는지 모릅니다.
**해결** —

```bash
git branch --merged main         # 지워도 되는 것 확인
git branch -d <이름>

# 원격에서 사라진 브랜치의 로컬 흔적 정리
git fetch --prune
```

GitHub에서 **Automatically delete head branches** 를 켜면 자동으로 처리됩니다.

### 전략을 정했는데 아무도 모름

**원인** — 회의에서 말로만 정했습니다.
**해결** — `CONTRIBUTING.md` 로 남기고, PR 템플릿([14강](lesson-14.md))에 체크리스트를 넣고, 브랜치 보호 규칙으로 강제하세요.

> **규칙은 문서 → 템플릿 → 자동화 순으로 단단해집니다.** 문서만으로는 부족합니다.

---

## ⑥ 확인 문제

**1.** 아래 팀에 어떤 전략을 추천하고, 그 이유는 무엇인가요?

```
ⓐ 4명 스타트업. 웹 서비스. 하루 2~3회 배포. 자동 테스트는 아직 없음.
ⓑ 15명 팀. 모바일 앱. 2주마다 앱스토어 심사 후 배포. QA 기간 있음.
ⓒ 8명 팀. 사내 시스템. 테스트 커버리지 80%, CI/CD 완비. 수시 배포.
```

<details>
<summary>답 보기</summary>

**ⓐ → GitHub Flow**

- 팀이 작고 배포가 잦으므로 `develop` 브랜치를 둘 이유가 없습니다.
- 자동 테스트가 없으니 Trunk-Based는 위험합니다. **PR 리뷰가 품질 게이트** 역할을 해야 합니다.
- 브랜치 보호 규칙으로 `main` 직접 push를 막고, 리뷰 1명 승인을 필수로 둡니다.

**ⓑ → Git Flow (또는 GitHub Flow + release 브랜치)**

- **앱스토어 심사 기간** 동안 코드가 얼어 있어야 하는데, 그동안에도 다음 기능 개발은 계속돼야 합니다. `release` 브랜치가 필요한 전형적인 이유입니다.
- 심사 중 발견된 버그는 `release` 브랜치에서 고치고 `main`·`develop` 양쪽에 반영합니다.
- 구버전 사용자 지원이 필요하면 Git Flow가 더 잘 맞습니다.

**ⓒ → Trunk-Based**

- 테스트와 CI/CD가 갖춰져 있어 **안전망이 있습니다.**
- 브랜치를 짧게 유지하면 충돌이 거의 없어져 8명이 동시에 작업해도 부딪히지 않습니다.
- 미완성 기능은 기능 플래그로 숨깁니다.

**판단 순서**
```
① 버전을 붙여 배포하나?  →  예면 Git Flow 계열
② 자동 테스트가 충분한가?  →  예면 Trunk-Based
③ 둘 다 아니면          →  GitHub Flow
```
</details>

**2.** Git Flow를 쓰는 팀에서 운영 중 결제 오류가 발견됐습니다. **어느 브랜치에서 시작해 어디에 합쳐야** 할까요? 명령까지 적어 보세요.

<details>
<summary>답 보기</summary>

**`main` 에서 시작해 `main` 과 `develop` 양쪽에 합칩니다.**

```bash
# ① main 에서 hotfix 브랜치 생성  ← develop 이 아닙니다
git switch main
git pull
git switch -c hotfix/payment-error

# ② 수정하고 커밋
git add .
git commit -m "fix: 결제 금액이 0원일 때 발생하는 오류 수정"

# ③ main 에 병합 + 태그 + 배포
git switch main
git merge --no-ff hotfix/payment-error
git tag -a v1.2.1 -m "긴급 수정: 결제 오류"
git push origin main --tags

# ④ develop 에도 반드시 병합  ← 여기가 핵심
git switch develop
git merge --no-ff hotfix/payment-error
git push origin develop

# ⑤ 정리
git branch -d hotfix/payment-error
```

**왜 `main` 에서 시작하나** — `develop` 에는 아직 배포되지 않은 기능이 잔뜩 들어 있습니다. 거기서 고치면 **검증 안 된 기능까지 함께 배포**됩니다. 지금 운영 중인 코드(`main`)에서 최소한만 고쳐야 합니다.

**④를 빼먹으면** — `develop` 에는 여전히 버그 있는 코드가 남습니다. 다음 릴리스 때 `develop` 이 `main` 을 덮어쓰면서 **버그가 되살아납니다.** Git Flow에서 가장 흔한 사고입니다.

**GitHub Flow라면** — `main` 하나뿐이니 ①②③만 하면 끝입니다. 이 단순함이 GitHub Flow의 가장 큰 장점입니다.
</details>

**3.** 팀에 새로 합류한 사람이 첫날 `main` 에 직접 push해서 빌드가 깨졌습니다. **재발을 막기 위해** 무엇을 하시겠습니까? 세 단계로 답하세요.

<details>
<summary>답 보기</summary>

**개인을 탓하는 대신 시스템으로 막는 것이 정답입니다.**

**① 문서 — 규칙을 적어 둔다**

`CONTRIBUTING.md` 에 브랜치 전략과 금지 사항을 명시합니다.

```markdown
- `main` 에 직접 push하지 않습니다. 모든 변경은 PR로 들어옵니다.
```

`README.md` 상단에서 링크해 두면 첫날 볼 확률이 높아집니다.

**② 도구 — 규칙을 강제한다**

GitHub → Settings → Branches → `main` 보호 규칙

| 항목 | 효과 |
|---|---|
| `Require a pull request before merging` | **직접 push 물리적으로 차단** |
| `Require approvals` (1명 이상) | 리뷰 없이는 병합 불가 |
| `Require status checks to pass` | 테스트 실패 시 병합 불가 ([27강](lesson-27.md)) |
| `Allow force pushes` **해제** | 이력 소실 사고 방지 |

**③ 자동화 — 실수해도 안전하게**

- **CI로 테스트 자동 실행** — 빌드가 깨지면 PR 단계에서 걸립니다 ([27강](lesson-27.md))
- **pre-push 훅** — 로컬에서 `main` push를 시도하면 경고 ([26강](lesson-26.md))
- **PR 템플릿에 체크리스트** ([14강](lesson-14.md))

**핵심 원칙**
> **"조심하자"는 대책이 아닙니다.** 사람은 반드시 실수합니다.
> 문서 → 도구 → 자동화 순으로 겹겹이 막아야 합니다. 신입이 실수할 수 있었다는 것은 **막지 않은 팀의 책임**입니다.
</details>

---

## 오늘의 정리

**세 가지 전략**

| | GitHub Flow | Git Flow | Trunk-Based |
|---|---|---|---|
| 장수 브랜치 | `main` | `main` + `develop` | `main` |
| 브랜치 수명 | 며칠 | 몇 주 | 몇 시간 |
| 적합 | 웹서비스·소규모 | 버전 배포·QA 기간 | CI/CD 완비 팀 |
| 난이도 | ⭐ | ⭐⭐⭐ | ⭐⭐ |

**GitHub Flow 6규칙**

```
① main 은 항상 배포 가능
② main 에서 브랜치를 딴다
③ 이름은 알아볼 수 있게
④ 자주 커밋·자주 push
⑤ PR로 리뷰받는다
⑥ 승인되면 병합하고 배포
```

**브랜치 이름**

```
<타입>/<이슈번호>-<설명>       feature/42-login-form
```

`feature` · `fix` · `hotfix` · `docs` · `refactor` · `chore`

**필수 명령**

| 명령 | 하는 일 |
|---|---|
| `git switch -c <이름> <출발점>` | 지정한 곳에서 브랜치 생성 |
| `git merge --no-ff <브랜치>` | 기능 단위를 그래프에 남기며 병합 |
| `git branch --merged main` | 지워도 되는 브랜치 확인 |
| `git fetch --prune` | 원격에서 사라진 브랜치 정리 |

**오늘 반드시 기억할 한 가지**
> **작게 시작하세요. 대부분의 팀에게 정답은 GitHub Flow입니다.**
> 그리고 규칙은 **말이 아니라 브랜치 보호 규칙으로 강제**해야 지켜집니다.

**과제**
1. `todo-app` 에 `CONTRIBUTING.md` 를 만들어 브랜치 전략·이름 규칙·금지 사항을 문서화하고 커밋하세요.
2. GitHub에서 `main` 브랜치 보호 규칙을 설정하고, 직접 push가 **실제로 막히는지** 확인하세요.
3. GitHub Flow로 기능 하나를 브랜치 생성부터 병합·삭제까지 한 사이클 완주하세요.
4. Settings에서 **Automatically delete head branches** 를 켜세요.
5. (선택) `develop` 브랜치를 만들어 Git Flow를 흉내 내 보고, merge 횟수가 얼마나 늘어나는지 체감해 보세요.

---

[← 이전 12강](lesson-12.md) · [목차](README.md) · [다음 → 14강 Pull Request 워크플로](lesson-14.md)
