# 10강 · 초급 종합 실습

> **Git 학습 매뉴얼** · 🟢 초급 · **10강 / 30** · 🏁 초급 마무리
> [← 이전 09강](lesson-09.md) · [목차](README.md) · [다음 → 11강 충돌 해결](lesson-11.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- **빈 폴더에서 시작해 GitHub 공개 저장소까지** 아무것도 보지 않고 완주할 수 있다.
- 작업을 의미 단위로 나눠 커밋하고, 브랜치를 만들어 기능을 개발하고 합칠 수 있다.
- 흔한 실수 다섯 가지를 스스로 복구할 수 있다.
- 초급 수료 체크리스트를 통과해 중급으로 넘어갈 준비를 마친다.

---

## ② 왜 필요한가

01~09강에서 명령을 하나씩 배웠습니다. 하지만 **실제 작업은 명령 하나로 끝나지 않습니다.**

```
새 프로젝트 시작
  → .gitignore 부터?  init 부터?
  → 브랜치는 언제 만들지?
  → 커밋은 어디서 끊지?
  → GitHub 저장소는 언제 만들지?
```

낱개로 아는 것과 **순서대로 꿰는 것**은 다른 능력입니다. 오늘은 배운 것을 한 줄기로 이어 **처음부터 끝까지 혼자 해 보는 날**입니다.

그리고 중급(11강~)은 **여러 사람이 같은 저장소를 쓰는 상황**을 다룹니다. 그전에 혼자 쓰는 Git이 몸에 붙어 있어야 합니다. 오늘의 체크리스트가 그 기준입니다.

---

## ③ 개념 설명 — 초급 전체 지도

### 한 장으로 보는 Git

지금까지 배운 것이 전부 이 그림 안에 있습니다.

```
  ┌──────────────────── 내 컴퓨터 ────────────────────┐      ┌── GitHub ──┐
  │                                                  │      │            │
  │  작업 디렉터리    스테이지        저장소(.git)      │      │   원격     │
  │       │             │               │            │      │   저장소   │
  │       │──git add───▶│               │            │      │            │
  │       │             │──git commit──▶│            │      │            │
  │       │             │               │──git push──┼─────▶│            │
  │       │             │               │◀─git pull──┼──────│            │
  │       │◀─git restore│               │            │      │            │
  │       │             │◀─restore --staged          │      │            │
  │       │◀────────────┴──git reset────│            │      │            │
  │                                                  │      │            │
  │        브랜치 = 커밋을 가리키는 이름표              │      │            │
  │        HEAD  = 지금 내가 있는 위치                 │      │            │
  └──────────────────────────────────────────────────┘      └────────────┘
```

### 강별 핵심 한 줄

| 강 | 핵심 |
|---|---|
| [01](lesson-01.md) | Git은 프로그램, GitHub는 웹 서비스. 커밋은 **스냅샷** |
| [02](lesson-02.md) | `user.name` · `user.email` 은 컴퓨터마다 **한 번** |
| [03](lesson-03.md) | **세 공간** — 작업 디렉터리 · 스테이지 · 저장소 |
| [04](lesson-04.md) | **커밋 하나 = 되돌릴 수 있는 의미 하나** |
| [05](lesson-05.md) | `.gitignore` 는 **`init` 직후 곧바로**. 이미 추적 중이면 `rm --cached` |
| [06](lesson-06.md) | 커밋 직전에 **`git diff --staged`** |
| [07](lesson-07.md) | 커밋한 건 살릴 수 있고, **커밋 안 한 건 못 살린다** |
| [08](lesson-08.md) | 브랜치는 **이름표**. 옮기기 전엔 커밋 또는 stash |
| [09](lesson-09.md) | push 거부되면 `--force` 가 아니라 **`git pull`** |

### 명령어 지도 — 상황에서 명령 찾기

| 하고 싶은 일 | 명령 |
|---|---|
| **시작** | |
| 저장소 만들기 | `git init` |
| 남의 저장소 받기 | `git clone <주소>` |
| **기록** | |
| 상태 확인 | `git status` |
| 담기 | `git add <파일>` |
| 커밋 | `git commit -m "메시지"` |
| **확인** | |
| 이력 보기 | `git log --oneline --graph --all` |
| 담기 전 변경 | `git diff` |
| **커밋될 내용** | **`git diff --staged`** |
| 커밋 하나 뜯어보기 | `git show <해시>` |
| **되돌리기** | |
| 수정 취소 | `git restore <파일>` ⚠️ |
| add 취소 | `git restore --staged <파일>` |
| 메시지 수정 | `git commit --amend -m "..."` |
| 커밋 취소 | `git reset --soft HEAD~1` |
| 날린 커밋 찾기 | `git reflog` |
| **브랜치** | |
| 만들고 이동 | `git switch -c <이름>` |
| 이동 | `git switch <이름>` |
| 합치기 | `git merge <이름>` |
| 삭제 | `git branch -d <이름>` |
| **원격** | |
| 연결 | `git remote add origin <주소>` |
| 올리기 | `git push -u origin main` → 이후 `git push` |
| 확인만 | `git fetch` |
| 받아서 합치기 | `git pull` |

---

## ④ 단계별 실습 — 미션 5개

**오늘의 과제** — `todo-app` 이라는 프로젝트를 **빈 폴더에서 시작해 GitHub에 공개**하기까지 완주합니다.

> 지금까지 쓰던 `git-practice` 는 그대로 두고, **새 폴더로** 시작합니다.
> 막히면 해당 강으로 돌아가되, **먼저 스스로 5분은 시도해 보세요.**

---

### 미션 1. 저장소 준비하기 (03·05강)

> **목표** — 첫 커밋이 `.gitignore` 인 저장소를 만든다.

```bash
cd ~/Desktop
mkdir todo-app
cd todo-app
pwd                    # ⚠️ 위치 확인 습관
git init
```

**`.gitignore` 를 가장 먼저 만듭니다.**

```gitignore
# 비밀 정보
.env

# 파이썬
__pycache__/
*.py[cod]
venv/
.venv/

# 데이터 (개인 기록이므로 공유하지 않음)
todos.json

# OS / 에디터
.DS_Store
Thumbs.db
.idea/
.vscode/
```

```bash
git add .gitignore
git commit -m "chore: 프로젝트 초기 설정"
```

**검증**

```bash
git log --oneline
```

```
7f2a9c1 (HEAD -> main) chore: 프로젝트 초기 설정
```

> ✅ **체크** — 첫 커밋이 `.gitignore` 인가요? [05강](lesson-05.md)에서 강조한 순서입니다.
> 코드를 먼저 넣고 나중에 `.gitignore` 를 만들면 이미 늦습니다.

---

### 미션 2. 브랜치로 기능 개발하기 (04·08강)

> **목표** — 브랜치에서 기능을 만들고, **의미 단위로 커밋을 나눠** `main` 에 합친다.

**① 브랜치 생성**

```bash
git switch -c feature/add-todo
```

**② `todo.py` 작성**

```python
import json
import os

FILE = "todos.json"


def load():
    if not os.path.exists(FILE):
        return []
    with open(FILE, encoding="utf-8") as f:
        return json.load(f)


def save(todos):
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(todos, f, ensure_ascii=False, indent=2)


def add(text):
    todos = load()
    todos.append({"text": text, "done": False})
    save(todos)
    print(f"추가됨: {text}")
```

```bash
git add todo.py
git commit -m "feat: 할 일 추가 기능 구현"
```

**③ `README.md` 작성** — 성격이 다르므로 **커밋을 나눕니다.**

````markdown
# TODO App

Git 학습 매뉴얼 초급 종합 실습용 할 일 관리 프로그램입니다.

## 실행 방법

```
python todo.py
```
````

```bash
git add README.md
git commit -m "docs: README 추가"
```

**④ 목록 출력 기능 추가** — 또 다른 의미이므로 세 번째 커밋입니다.

`todo.py` 맨 아래에 추가합니다.

```python
def show():
    todos = load()
    if not todos:
        print("할 일이 없습니다.")
        return
    for i, t in enumerate(todos, 1):
        mark = "v" if t["done"] else " "
        print(f"[{mark}] {i}. {t['text']}")
```

```bash
git add todo.py
git diff --staged          # ⚠️ 커밋 전 확인 습관 (06강)
git commit -m "feat: 할 일 목록 출력 기능 구현"
```

**⑤ `main` 에 합치기**

```bash
git switch main
git merge feature/add-todo
```

```
Updating 7f2a9c1..b3e8d24
Fast-forward
 README.md |  9 +++++++++
 todo.py   | 32 ++++++++++++++++++++++++++++++++
 2 files changed, 41 insertions(+)
```

```bash
git branch -d feature/add-todo
git log --oneline --graph
```

**검증**

```
* b3e8d24 (HEAD -> main) feat: 할 일 목록 출력 기능 구현
* 5c1f7a3 docs: README 추가
* 9e4b2d8 feat: 할 일 추가 기능 구현
* 7f2a9c1 chore: 프로젝트 초기 설정
```

> ✅ **체크 3가지**
> - 커밋이 **4개**인가요? (한 덩어리로 뭉치지 않았나요)
> - 메시지만 읽어도 무슨 일이 있었는지 보이나요?
> - `Fast-forward` 로 합쳐졌나요? ([08강](lesson-08.md) — `main` 에 커밋이 없었으므로)

---

### 미션 3. 실수 복구하기 (07강)

> **목표** — 흔한 실수 네 가지를 **일부러 만들고** 복구한다. 이 미션이 초급의 하이라이트입니다.

**① 커밋 메시지 오타**

```bash
echo 'print("완료 처리 기능 예정")' >> todo.py
git add todo.py
git commit -m "feat: 완료 처리 기능 초안 추까"
```

<details>
<summary>복구 방법 (먼저 스스로 해 보세요)</summary>

```bash
git commit --amend -m "feat: 완료 처리 기능 초안 추가"
```

`git log --oneline -1` 로 확인하면 메시지가 바뀌고 **해시도 달라져 있습니다.**
</details>

**② `.env` 를 실수로 담음**

```bash
echo "SECRET_KEY=abcd1234" > .env
git add -f .env            # -f 로 gitignore 무시하고 강제로 담기
git status
```

<details>
<summary>복구 방법</summary>

```bash
git restore --staged .env
git status                 # .env 가 목록에서 사라졌는지 확인
```

⚠️ **`--staged` 를 빼면 안 됩니다.** `git restore .env` 는 파일 내용을 되돌리는 명령입니다.
</details>

**③ 파일을 망쳐 놓음**

`todo.py` 의 내용을 전부 지우고 아무 글자나 씁니다.

```
망가진 파일
```

<details>
<summary>복구 방법</summary>

```bash
git restore todo.py
```

파일을 열어 원래 내용이 돌아왔는지 확인하세요.

> 이게 가능한 이유는 **커밋해 두었기 때문**입니다. 커밋 전이었다면 복구할 수 없습니다.
</details>

**④ 커밋에 파일을 빠뜨림**

```bash
echo "# 사용법" > USAGE.md
echo 'print("사용법 문서 참고")' >> todo.py
git add todo.py
git commit -m "docs: 사용법 안내 추가"
# 아차, USAGE.md 를 빠뜨렸다!
```

<details>
<summary>복구 방법</summary>

```bash
git add USAGE.md
git commit --amend --no-edit
git show --stat HEAD       # 두 파일이 함께 들어갔는지 확인
```

```
 todo.py  | 1 +
 USAGE.md | 1 +
 2 files changed, 2 insertions(+)
```
</details>

**⑤ 커밋 자체를 취소**

```bash
echo "쓸모없는 파일" > junk.txt
git add junk.txt
git commit -m "실수로 만든 커밋"
```

<details>
<summary>복구 방법</summary>

```bash
git reset --soft HEAD~1    # 커밋만 취소, 파일은 스테이지에 유지
git restore --staged junk.txt
rm junk.txt                # PowerShell: Remove-Item junk.txt
git status                 # clean 인지 확인
```

`--hard` 를 썼다면 한 번에 끝나지만, **커밋 안 한 다른 작업까지 날아갈 수 있어** 초급에서는 `--soft` 를 권합니다.
</details>

> ✅ **체크** — 다섯 가지를 **문서를 안 보고** 복구할 수 있나요? 못 했다면 [07강](lesson-07.md)을 한 번 더 읽고 오세요.
> 실무에서 가장 자주 쓰는 것이 바로 이 다섯 개입니다.

---

### 미션 4. GitHub에 공개하기 (09강)

> **목표** — 원격 저장소를 만들어 연결하고, 브랜치까지 올린다.

**① GitHub에서 저장소 생성**

- 이름 `todo-app` · **Public**
- **README·.gitignore·license 전부 체크 해제** ⚠️

**② 연결하고 올리기**

```bash
git remote add origin https://github.com/<내아이디>/todo-app.git
git remote -v
git push -u origin main
```

**③ 브랜치 하나를 원격에도 올리기**

```bash
git switch -c feature/done-command
```

`todo.py` 에 완료 처리 기능을 추가합니다.

```python
def done(index):
    todos = load()
    if 1 <= index <= len(todos):
        todos[index - 1]["done"] = True
        save(todos)
        print(f"완료 처리: {todos[index - 1]['text']}")
    else:
        print("그런 번호는 없습니다.")
```

```bash
git add todo.py
git commit -m "feat: 할 일 완료 처리 기능 구현"
git push -u origin feature/done-command
```

**검증** — GitHub 저장소 화면에서 확인하세요.

- 브랜치 드롭다운에 `feature/done-command` 가 보이나요?
- **`Compare & pull request`** 노란 배너가 떴나요? (PR은 [14강](lesson-14.md)에서 다룹니다)
- **Commits** 탭에서 커밋 메시지가 읽을 만한가요?
- 커밋 옆에 **내 프로필 사진**이 붙어 있나요? (안 붙었다면 [02강](lesson-02.md)의 이메일 설정을 확인하세요)

**④ 브랜치 합치고 정리**

```bash
git switch main
git merge feature/done-command
git push
git branch -d feature/done-command
git push origin --delete feature/done-command
```

---

### 미션 5. 다른 기기 시나리오 (09강)

> **목표** — `clone` → 원격 수정 → `fetch` → `pull` 흐름을 체험한다.

**① 다른 컴퓨터인 척 clone**

```bash
cd ~/Desktop
git clone https://github.com/<내아이디>/todo-app.git todo-app-home
cd todo-app-home
git log --oneline
```

이력이 통째로 따라왔는지 확인하세요.

**② GitHub 웹에서 직접 수정**

브라우저에서 `README.md` → 연필 아이콘 → 아래 줄을 추가하고 **Commit changes**.

```markdown
## 만든 사람
홍길동
```

**③ 원래 폴더에서 확인**

```bash
cd ~/Desktop/todo-app
git status              # "up to date" 라고 나오지만 사실이 아님!
git fetch
git status              # 이제 "behind by 1 commit"
git log --oneline main..origin/main
git pull
```

> ✅ **체크** — `fetch` 전후로 `git status` 메시지가 **어떻게 달라지는지** 눈으로 확인했나요?
> `origin/main` 이 **자동 갱신되지 않는 캐시**라는 것이 초급에서 가장 자주 오해하는 부분입니다.

**④ 정리**

```bash
cd ~/Desktop
rm -rf todo-app-home        # PowerShell: Remove-Item -Recurse -Force todo-app-home
```

---

## ⑤ 자주 하는 실수 — 트러블슈팅 빠른 참조

**에러 메시지로 검색하세요.** (`Ctrl+F`)

| 증상 / 메시지 | 원인 | 해결 |
|---|---|---|
| `not a git repository` | 저장소 밖 | `pwd` · `ls -a` 로 위치 확인 ([03](lesson-03.md)) |
| `Please tell me who you are` | 이름·이메일 미설정 | `git config --global user.name/email` ([02](lesson-02.md)) |
| `nothing to commit, working tree clean` | 변경 없음 | 파일 저장(`Ctrl+S`) 확인 ([04](lesson-04.md)) |
| `nothing added to commit but untracked files present` | 새 파일에 `-am` 사용 | `git add <파일>` 먼저 ([04](lesson-04.md)) |
| `.gitignore` 넣었는데 계속 올라옴 | 이미 추적 중 | `git rm --cached <파일>` ([05](lesson-05.md)) |
| `git diff` 가 빈 결과 | 이미 `add` 함 | `git diff --staged` ([06](lesson-06.md)) |
| `git log` 에서 화면 멈춤 | 페이저 | **`q`** ([06](lesson-06.md)) |
| `Your local changes would be overwritten` | 커밋 안 한 변경 | 커밋 / `git stash` / `git restore` ([08](lesson-08.md)) |
| `branch ... is not fully merged` | 안 합쳐진 커밋 존재 | 확인 후 `-D` ([08](lesson-08.md)) |
| `detached HEAD` | 커밋으로 직접 이동 | `git switch -` ([08](lesson-08.md)) |
| `CONFLICT (content)` | 같은 줄을 다르게 수정 | `git merge --abort` → [11강](lesson-11.md) |
| `remote origin already exists` | 이미 등록됨 | `git remote set-url origin <주소>` ([09](lesson-09.md)) |
| `! [rejected] ... (fetch first)` | 원격에 모르는 커밋 | **`git pull`** (`--force` 금지) ([09](lesson-09.md)) |
| `refusing to merge unrelated histories` | 저장소 생성 시 README 체크 | `git pull origin main --allow-unrelated-histories` ([09](lesson-09.md)) |
| `has no upstream branch` | 새 브랜치 | `git push -u origin <브랜치>` ([09](lesson-09.md)) |
| `Support for password authentication was removed` | 비밀번호 입력 | PAT 또는 SSH ([09](lesson-09.md)) |
| 커밋을 날렸다 | `reset --hard` 등 | **`git reflog`** ([07](lesson-07.md)) |

### 위험한 명령 3개

```
🚨 git reset --hard      커밋 안 한 작업이 사라짐        → 실행 전 git status
🚨 git restore <파일>     그 파일의 수정이 사라짐         → --staged 인지 확인
🚨 git push --force      원격의 남의 커밋이 사라짐        → 초급에서는 쓰지 않기
```

---

## ⑥ 확인 문제

**1.** 아무것도 없는 상태에서 **새 파이썬 프로젝트를 시작해 GitHub에 공개**하기까지의 명령을 **순서대로** 적어 보세요. (문서를 보지 말고)

<details>
<summary>답 보기</summary>

```bash
# 1) 폴더 만들고 저장소 초기화
mkdir my-project && cd my-project
pwd                                   # 위치 확인
git init

# 2) .gitignore 부터  ← 순서가 중요합니다
#    (템플릿: https://www.toptal.com/developers/gitignore)
git add .gitignore
git commit -m "chore: 프로젝트 초기 설정"

# 3) 브랜치에서 개발
git switch -c feature/first
# ... 코드 작성 ...
git status
git add <파일>
git diff --staged                     # 커밋 전 확인
git commit -m "feat: ..."

# 4) main 에 합치기
git switch main
git merge feature/first
git branch -d feature/first

# 5) GitHub 저장소 생성 (README 체크 해제!)

# 6) 연결하고 올리기
git remote add origin https://github.com/<아이디>/my-project.git
git push -u origin main
```

**꼭 들어가야 하는 3가지**
- `.gitignore` 를 **코드보다 먼저** ([05강](lesson-05.md))
- GitHub 저장소 생성 시 **README 체크 해제** ([09강](lesson-09.md))
- 첫 push에 **`-u`** ([09강](lesson-09.md))
</details>

**2.** 아래 상황을 각각 어떻게 해결할까요?

```
ⓐ 어제 push한 커밋의 메시지에 오타를 발견했다.
ⓑ push하려는데 "! [rejected] main -> main (fetch first)" 가 떴다.
ⓒ git reset --hard 로 중요한 커밋을 날렸다.
ⓓ 팀원이 "네가 올린 venv 폴더 때문에 clone이 5분 걸려" 라고 한다.
```

<details>
<summary>답 보기</summary>

**ⓐ 이미 push한 커밋의 메시지**

`--amend` 는 **쓰면 안 됩니다.** 이력이 갈라져 팀원과 어긋납니다([07강](lesson-07.md) 황금률).

- **혼자 쓰는 저장소** → `git commit --amend` 후 `git push --force-with-lease`
- **팀 저장소** → **그냥 둡니다.** 메시지 오타 하나 때문에 이력을 다시 쓰는 것은 손해가 더 큽니다. 정 필요하면 팀과 합의 후 [18강](lesson-18.md)의 방법을 씁니다.

**ⓑ push 거부**

```bash
git fetch
git log --oneline main..origin/main    # 무엇이 왔는지 확인
git pull
git push
```

`--force` 는 금지입니다. 원격의 남의 커밋이 사라집니다.

**ⓒ 날린 커밋 복구**

```bash
git reflog                  # HEAD가 움직인 기록에서 해시 찾기
git reset --hard <해시>
```

단, **커밋하지 않았던 변경은 복구되지 않습니다.**

**ⓓ venv 가 올라간 경우**

```bash
echo "venv/" >> .gitignore
git rm -r --cached venv/
git commit -m "chore: venv 를 추적 대상에서 제외"
git push
```

`--cached` 덕분에 내 디스크의 `venv/` 는 지워지지 않습니다.

> 다만 **과거 커밋에는 여전히 남아 저장소 용량은 줄지 않습니다.** 완전히 지우려면 이력 재작성이 필요합니다([29강](lesson-29.md)).
> 그래서 [05강](lesson-05.md)에서 **"`.gitignore` 를 가장 먼저"** 라고 한 것입니다.
</details>

**3.** 후배가 묻습니다. **"`git add` 는 왜 있어요? 그냥 `commit` 하면 되잖아요."** 어떻게 설명하시겠습니까?

<details>
<summary>답 보기</summary>

**핵심 — 커밋에 담을 것을 고를 수 있게 하려고.**

`add` 가 없다면 저장한 모든 변경이 통째로 한 커밋에 들어갑니다. 그러면 이런 일이 생깁니다.

```
오늘 고친 것:
  login.py    ← 로그인 버그 수정
  signup.py   ← 로그인 버그 수정 (같은 작업)
  memo.txt    ← 전혀 다른 메모
```

셋을 한 커밋에 넣으면 **"로그인 버그 수정" 커밋을 되돌릴 때 메모까지 딸려 옵니다.**

스테이지가 있어서 이렇게 나눌 수 있습니다.

```bash
git add login.py signup.py
git commit -m "fix: 로그인 실패 시 세션이 남는 문제 수정"

git add memo.txt
git commit -m "docs: 회의 메모 추가"
```

**부가 효과 3가지**

1. **커밋 직전 검토** — `git diff --staged` 로 "무엇이 들어가는지" 확인할 수 있습니다. 디버깅용 `print` 를 걸러내는 마지막 관문입니다.
2. **파일 일부만 담기** — `git add -p` 로 **같은 파일 안에서도 일부 줄만** 고를 수 있습니다([15강](lesson-15.md)).
3. **되돌리기의 기준점** — 스테이지가 있어서 `restore` 와 `restore --staged` 가 서로 다른 일을 할 수 있습니다.

**한 문장 요약**
> `add` 는 귀찮은 한 단계가 아니라, **"커밋 하나 = 의미 하나"를 지킬 수 있게 해 주는 장치**입니다.
</details>

---

## 🏁 초급 수료 체크리스트

**전부 ✅ 여야 중급으로 넘어갑니다.** 하나라도 막히면 해당 강으로 돌아가세요.

### 개념

- [ ] Git과 GitHub의 차이를 한 문장으로 설명할 수 있다 ([01](lesson-01.md))
- [ ] 세 공간(작업 디렉터리 · 스테이지 · 저장소)을 그림으로 그릴 수 있다 ([03](lesson-03.md))
- [ ] 브랜치가 "커밋을 가리키는 이름표"라는 것을 설명할 수 있다 ([08](lesson-08.md))
- [ ] `main` 과 `origin/main` 의 차이를 설명할 수 있다 ([09](lesson-09.md))
- [ ] fast-forward 와 3-way merge 를 구분할 수 있다 ([08](lesson-08.md))

### 손

- [ ] 빈 폴더 → `init` → `.gitignore` → 첫 커밋을 순서대로 할 수 있다
- [ ] 작업을 의미 단위로 나눠 **커밋 3개 이상**으로 만들 수 있다 ([04](lesson-04.md))
- [ ] `git diff` 와 `git diff --staged` 를 구분해서 쓴다 ([06](lesson-06.md))
- [ ] 브랜치를 만들어 작업하고 `main` 에 합치고 삭제할 수 있다 ([08](lesson-08.md))
- [ ] GitHub 저장소를 만들어 연결하고 push할 수 있다 ([09](lesson-09.md))
- [ ] `fetch` 로 확인하고 `pull` 로 받아올 수 있다 ([09](lesson-09.md))

### 사고 복구

- [ ] 수정 취소 (`git restore`) ([07](lesson-07.md))
- [ ] `add` 취소 (`git restore --staged`) ([07](lesson-07.md))
- [ ] 커밋 메시지 수정 (`git commit --amend`) ([07](lesson-07.md))
- [ ] 빠뜨린 파일 추가 (`--amend --no-edit`) ([07](lesson-07.md))
- [ ] 커밋 취소 (`git reset --soft HEAD~1`) ([07](lesson-07.md))
- [ ] 날린 커밋 되살리기 (`git reflog`) ([07](lesson-07.md))
- [ ] `.gitignore` 에 넣었는데도 추적되는 파일 빼내기 (`git rm --cached`) ([05](lesson-05.md))

### 습관

- [ ] `git add` 전에 **`git status`** 를 본다
- [ ] `git commit` 전에 **`git diff --staged`** 를 본다
- [ ] 커밋 메시지에 **타입과 내용**을 쓴다 (`feat:`, `fix:` …)
- [ ] 작업 시작 전 `pull`, 끝난 뒤 `push`
- [ ] `--force` 를 반사적으로 쓰지 않는다

---

## 📝 초급 실기 평가

> **제한 시간 30분 · 문서 참고 없이**

빈 폴더에서 시작해 아래를 전부 완료하세요.

| # | 과제 | 배점 |
|---|---|---|
| 1 | 저장소를 만들고 **첫 커밋이 `.gitignore`** 가 되게 한다 | 10 |
| 2 | 파일 3개를 만들되 **의미 단위로 커밋 3개**로 나눈다 | 20 |
| 3 | 브랜치를 만들어 기능을 추가하고 `main` 에 합친 뒤 브랜치를 삭제한다 | 20 |
| 4 | 커밋 메시지 오타를 **`--amend`** 로 고친다 | 10 |
| 5 | 커밋을 하나 만든 뒤 **`reset --soft`** 로 취소한다 | 10 |
| 6 | GitHub 저장소를 만들어 push한다 | 20 |
| 7 | `git log --oneline --graph --all` 결과를 캡처해 제출한다 | 10 |

**감점 항목**

- `.env` 나 `venv/` 가 커밋에 포함됨 **−20**
- 커밋 메시지가 "수정", "asdf" 등 의미 없음 **−10**
- 커밋이 하나로 뭉쳐 있음 **−10**

---

## 오늘의 정리

**초급에서 배운 것**

```
01  왜 Git인가          02  설정          03  세 공간
04  커밋               05  gitignore     06  log · diff
07  되돌리기            08  브랜치        09  GitHub
```

**앞으로 매일 쓰게 될 흐름**

```bash
git pull                          # 시작 전
git switch -c feature/작업이름      # 브랜치에서
git status                        # 뭐가 바뀌었나
git add <파일>                     # 골라 담고
git diff --staged                 # 들어갈 내용 확인
git commit -m "feat: ..."         # 의미 단위로
git switch main && git merge feature/작업이름
git push                          # 끝난 뒤
```

**초급 전체를 관통하는 한 가지**
> **커밋한 것은 거의 다 살릴 수 있습니다.**
> 그러니 겁내지 말고 **작게, 자주** 커밋하세요. 커밋은 기록이자 안전망입니다.

---

## 🟡 다음은 중급입니다

혼자 쓰는 Git은 여기까지입니다. 중급(11~20강)부터는 **여러 사람이 같은 저장소를 쓸 때** 생기는 문제를 다룹니다.

| 강 | 내용 |
|---|---|
| [11](lesson-11.md) | **충돌 해결** — 08강에서 `--abort` 로 도망쳤던 그것 |
| [12](lesson-12.md) | **merge vs rebase** — 이력을 어떤 모양으로 남길 것인가 |
| [13](lesson-13.md) | **브랜치 전략** — 팀에서 브랜치를 어떻게 운영하나 |
| [14](lesson-14.md) | **Pull Request** — 09강에서 본 그 배너의 정체 |
| [15](lesson-15.md) | **좋은 커밋** — `git add -p` 로 파일 일부만 담기 |
| [16](lesson-16.md) | **stash · cherry-pick** — 급한 일이 끼어들 때 |
| [17](lesson-17.md) | **revert** — push한 커밋을 안전하게 되돌리기 |
| [18](lesson-18.md) | **rebase -i** — 지저분한 커밋 정리하기 |
| [19](lesson-19.md) | **태그와 릴리스** — 버전 번호 붙이기 |
| [20](lesson-20.md) | 중급 종합 실습 |

**중급을 시작하기 전에 준비할 것**
- 위 체크리스트를 전부 통과하세요.
- 11강부터는 **2인 1조 실습**이 있습니다. 짝을 정해 두면 좋습니다.
- 짝이 없다면 GitHub 계정 하나로 **저장소를 두 폴더에 clone** 해서 혼자 두 사람 역할을 할 수 있습니다. (미션 5에서 해 본 방식입니다)

---

[← 이전 09강](lesson-09.md) · [목차](README.md) · [다음 → 11강 충돌 해결](lesson-11.md)
