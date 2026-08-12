# 11강 · 충돌(conflict) 해결

> **Git 학습 매뉴얼** · 🟡 중급 · **11강 / 30**
> [← 이전 10강](lesson-10.md) · [목차](README.md) · [다음 → 12강 merge vs rebase](lesson-12.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 충돌이 **왜** 나는지 3-way merge 원리로 설명할 수 있다.
- 충돌 마커(`<<<<<<<`, `=======`, `>>>>>>>`)를 읽고 어느 쪽이 누구 것인지 판단할 수 있다.
- 충돌을 해결하고 병합을 완료할 수 있다.
- `merge --abort` 로 안전하게 빠져나올 수 있다.
- 충돌이 덜 나게 만드는 작업 습관을 안다.

---

## ② 왜 필요한가

[08강](lesson-08.md)에서 충돌을 만나자마자 `git merge --abort` 로 도망쳤습니다. 오늘은 정면으로 마주합니다.

충돌은 **협업하는 팀에서 매주 일어나는 일상**입니다. 그런데 여기서 사람이 둘로 갈립니다.

| 충돌을 무서워하는 사람 | 충돌을 아는 사람 |
|---|---|
| 브랜치를 안 만들고 `main` 에만 작업 | 브랜치를 자유롭게 판다 |
| 며칠씩 `pull` 을 미룬다 → 충돌이 더 커짐 | 매일 `pull` 해서 작게 처리 |
| 충돌 나면 폴더를 지우고 다시 clone | 5분 안에 해결하고 넘어감 |
| 겁나서 `--force` 로 밀어 버림 → **팀원 작업 소실** | 마커를 읽고 판단한다 |

**충돌은 에러가 아닙니다.** Git이 "여기는 제가 판단할 수 없으니 사람이 정해 주세요" 하고 물어보는 것입니다. Git 입장에서는 오히려 **정직한 행동**입니다. 조용히 한쪽을 골라 버렸다면 그게 진짜 사고입니다.

---

## ③ 개념 설명

### 충돌은 언제 나는가

**결론부터** — 같은 파일을 고쳤다고 해서 충돌이 나는 게 아닙니다.

| 상황 | 충돌? |
|---|---|
| 서로 **다른 파일**을 수정 | ❌ 자동 병합 |
| 같은 파일의 **다른 줄**을 수정 | ❌ 자동 병합 |
| 같은 파일의 **같은 줄**을 서로 다르게 수정 | ✅ **충돌** |
| 같은 파일의 **바로 인접한 줄**을 각각 수정 | ✅ 충돌 (경계가 겹침) |
| 한쪽은 **수정**, 한쪽은 **삭제** | ✅ 충돌 (modify/delete) |
| 양쪽이 **같은 이름의 새 파일**을 만듦 | ✅ 충돌 (add/add) |

> Git은 생각보다 똑똑합니다. **파일 단위가 아니라 줄 단위**로 판단합니다.
> 100줄짜리 파일을 둘이 동시에 고쳐도, 겹치는 줄이 없으면 조용히 합쳐집니다.

### 3-way merge 다시 보기

[08강](lesson-08.md)에서 본 그림입니다. Git은 **세 지점**을 비교합니다.

```
              ┌──▶ E   ← feature  (theirs, 합쳐 오는 쪽)
   A ──▶ B ──▶ C
              └──▶ F   ← main     (ours, 현재 브랜치)
                   ▲
                  HEAD
```

| 이름 | 정체 | 별칭 |
|---|---|---|
| `C` | **공통 조상** (base) | — |
| `F` | 현재 브랜치의 내용 | **ours** |
| `E` | 합쳐 오는 브랜치의 내용 | **theirs** |

Git의 판단 규칙은 단순합니다.

```
base 대비 한쪽만 바뀌었다  →  바뀐 쪽을 채택 (자동)
base 대비 양쪽 다 바뀌었다  →  ⚠️ 충돌 (사람에게 물어봄)
```

> ⚠️ **`ours` / `theirs` 는 명령에 따라 뒤집힙니다.**
> `git merge` 에서는 **ours = 지금 있는 브랜치**입니다. 하지만 [12강](lesson-12.md)의 `rebase` 에서는 **반대**가 됩니다.
> 헷갈리면 이름에 의존하지 말고 **파일 안의 마커에 적힌 브랜치명**을 보세요.

### 충돌 마커 읽는 법

충돌이 나면 Git이 파일 안에 이런 표시를 넣습니다.

```
<<<<<<< HEAD
priority = "high"          ← 현재 브랜치(ours)의 내용
=======
priority = 1               ← 합쳐 오는 브랜치(theirs)의 내용
>>>>>>> feature/priority
```

| 표시 | 뜻 |
|---|---|
| `<<<<<<< HEAD` | 여기부터 **현재 브랜치** 내용 |
| `=======` | 경계선 |
| `>>>>>>> feature/priority` | 여기까지 **합쳐 오는 브랜치** 내용 |

**해결한다는 것은 = 이 파일을 "최종적으로 있어야 할 모습"으로 만드는 것**입니다.

- 한쪽을 고르거나
- 양쪽을 합치거나
- 아예 새로 쓰거나

**어느 쪽이든 마커 세 줄은 반드시 지워야 합니다.**

### 더 나은 마커 — `zdiff3`

기본 마커에는 큰 약점이 있습니다. **"원래 뭐였는지"** 가 안 보입니다.

```
<<<<<<< HEAD
timeout = 30
=======
timeout = 5
>>>>>>> feature/perf
```

30과 5 중 뭘 고를까요? **원래 값이 10이었다면** 양쪽 다 바꾼 것이고, **원래가 30이었다면** 상대만 바꾼 것입니다. 판단이 완전히 달라집니다.

설정 한 줄로 공통 조상까지 보여 줄 수 있습니다.

```bash
git config --global merge.conflictStyle zdiff3
```

```
<<<<<<< HEAD
timeout = 30
||||||| 공통 조상
timeout = 10          ← 원래 이랬구나!
=======
timeout = 5
>>>>>>> feature/perf
```

> **중급에 올라왔다면 지금 바로 설정하세요.** 충돌 해결 난이도가 체감상 절반으로 떨어집니다.
> (`zdiff3` 는 Git 2.35 이상. 그보다 낮으면 `diff3` 를 쓰세요)

### 해결 절차 5단계

```
① git status          →  어떤 파일이 충돌했는지 확인
② 파일 열어서 편집     →  마커를 지우고 최종 모습으로
③ git add <파일>       →  "해결했습니다" 표시
④ git status          →  남은 게 없는지 확인
⑤ git commit          →  병합 완료
```

**③이 핵심입니다.** 충돌 상황에서 `git add` 는 "담기"가 아니라 **"이 파일은 해결됐다고 표시"** 하는 의미입니다.

### 언제든 도망칠 수 있습니다

```bash
git merge --abort
```

**병합 전 상태로 완전히 되돌립니다.** 충돌이 너무 크거나, 지금 처리할 상황이 아니거나, 뭘 잘못했는지 모르겠으면 언제든 쓰세요. 손해가 없습니다.

> 단, **`git commit` 으로 병합을 완료한 뒤에는 `--abort` 가 안 됩니다.** 그때는 [17강](lesson-17.md)의 `revert` 나 `reset` 을 씁니다.

---

## ④ 단계별 실습

### Step 0. 팀 작업 환경 만들기

11강부터는 **두 사람이 같은 저장소를 쓰는 상황**을 흉내 냅니다. [10강](lesson-10.md)에서 만든 `todo-app` 을 한 벌 더 clone합니다.

```bash
cd ~/Desktop
git clone https://github.com/<내아이디>/todo-app.git todo-app-teammate
```

이제 두 폴더가 있습니다.

| 폴더 | 역할 |
|---|---|
| `~/Desktop/todo-app` | **나** |
| `~/Desktop/todo-app-teammate` | **팀원(영희)** |

> 터미널 창을 **두 개** 열어 각각 한 폴더씩 들어가 두면 훨씬 편합니다.
> 20강까지 이 구성을 계속 씁니다.

먼저 `zdiff3` 를 설정합니다.

```bash
git config --global merge.conflictStyle zdiff3
```

### Step 1. 충돌 만들기 — 같은 줄을 다르게

**① 나: 브랜치를 파고 `todo.py` 의 출력 형식을 바꿉니다.**

```bash
cd ~/Desktop/todo-app
git switch -c feature/emoji
```

`todo.py` 의 `show()` 함수에서 표시 기호를 바꿉니다.

```python
def show():
    todos = load()
    if not todos:
        print("할 일이 없습니다.")
        return
    for i, t in enumerate(todos, 1):
        mark = "✅" if t["done"] else "⬜"
        print(f"{mark} {i}. {t['text']}")
```

```bash
git add todo.py
git commit -m "feat: 목록 표시를 이모지로 변경"
```

**② 팀원: `main` 에서 같은 줄을 다르게 바꿉니다.**

```bash
cd ~/Desktop/todo-app-teammate
```

`todo.py` 의 같은 부분을 이렇게 고칩니다.

```python
def show():
    todos = load()
    if not todos:
        print("할 일이 없습니다.")
        return
    for i, t in enumerate(todos, 1):
        mark = "[완료]" if t["done"] else "[진행]"
        print(f"{mark} {i}. {t['text']}")
```

```bash
git add todo.py
git commit -m "feat: 목록 표시를 텍스트 라벨로 변경"
git push
```

**③ 나: 팀원 작업을 받아 옵니다.**

```bash
cd ~/Desktop/todo-app
git switch main
git pull
```

실행 결과:

```
Updating b3e8d24..d7f1a93
Fast-forward
 todo.py | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
```

**④ 내 브랜치를 합칩니다. 여기서 충돌이 납니다.**

```bash
git merge feature/emoji
```

실행 결과:

```
Auto-merging todo.py
CONFLICT (content): Merge conflict in todo.py
Automatic merge failed; fix conflicts and then commit the result.
```

### Step 2. 상태 확인하기

**충돌이 나면 가장 먼저 `git status` 입니다.**

```bash
git status
```

실행 결과:

```
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   todo.py

no changes added to commit (use "git add" and/or "git commit -a")
```

읽어야 할 것 세 가지입니다.

| 문구 | 뜻 |
|---|---|
| `You have unmerged paths` | 병합이 **진행 중**이고 아직 안 끝났다 |
| `both modified: todo.py` | 이 파일이 **양쪽에서 수정**되어 충돌 |
| `(use "git merge --abort" ...)` | 탈출구 안내 |

충돌 파일 목록만 뽑고 싶다면:

```bash
git diff --name-only --diff-filter=U
```

실행 결과:

```
todo.py
```

### Step 3. 파일 열어서 해결하기

`todo.py` 를 열면 이렇게 되어 있습니다.

```python
def show():
    todos = load()
    if not todos:
        print("할 일이 없습니다.")
        return
    for i, t in enumerate(todos, 1):
<<<<<<< HEAD
        mark = "[완료]" if t["done"] else "[진행]"
||||||| b3e8d24
        mark = "v" if t["done"] else " "
=======
        mark = "✅" if t["done"] else "⬜"
>>>>>>> feature/emoji
        print(f"{mark} {i}. {t['text']}")
```

`zdiff3` 덕분에 **세 가지 버전이 다 보입니다.**

| 구간 | 내용 | 정체 |
|---|---|---|
| `<<<<<<< HEAD` ~ | `[완료]` / `[진행]` | 현재 `main` (팀원이 바꾼 것) |
| `\|\|\|\|\|\|\|` ~ | `v` / ` ` | **원래 값** (공통 조상) |
| `=======` ~ | `✅` / `⬜` | `feature/emoji` (내가 바꾼 것) |

**양쪽 다 원본에서 바꿨습니다.** 둘 다 의도가 있으니 합의가 필요합니다. 여기서는 **이모지 + 라벨을 함께** 쓰기로 결정했다고 합시다.

**마커 4줄을 전부 지우고** 최종 모습으로 만듭니다.

```python
def show():
    todos = load()
    if not todos:
        print("할 일이 없습니다.")
        return
    for i, t in enumerate(todos, 1):
        mark = "✅ 완료" if t["done"] else "⬜ 진행"
        print(f"{mark} {i}. {t['text']}")
```

> 🔑 **충돌 해결은 "한쪽 고르기"가 아닙니다.**
> 양쪽 의도를 살린 제3의 답이 정답인 경우가 많습니다. 코드가 **의미상 맞는지**를 기준으로 판단하세요.

### Step 4. 해결 표시하고 커밋하기

**마커가 남아 있지 않은지 먼저 확인합니다.** 이 습관 하나가 사고를 막습니다.

```bash
grep -rn "<<<<<<<\|>>>>>>>\|=======" todo.py
```

아무것도 안 나오면 됩니다.

```bash
git add todo.py
git status
```

실행 결과:

```
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	modified:   todo.py
```

**`All conflicts fixed`** — 이제 마무리합니다.

```bash
git commit
```

편집기에 기본 메시지가 채워져 있습니다. 그대로 저장해도 되지만, **충돌을 어떻게 해결했는지 적어 두면** 나중에 큰 도움이 됩니다.

```
Merge branch 'feature/emoji'

목록 표시 형식이 양쪽에서 충돌했다.
이모지(가독성)와 텍스트 라벨(명확성) 중 하나를 고르는 대신
둘을 합쳐 "✅ 완료" 형태로 정리했다.
```

실행 결과:

```
[main 3a9f2c1] Merge branch 'feature/emoji'
```

```bash
git log --oneline --graph -5
```

실행 결과:

```
*   3a9f2c1 (HEAD -> main) Merge branch 'feature/emoji'
|\
| * 8e2c4f7 (feature/emoji) feat: 목록 표시를 이모지로 변경
* | d7f1a93 (origin/main) feat: 목록 표시를 텍스트 라벨로 변경
|/
* b3e8d24 feat: 할 일 목록 출력 기능 구현
```

```bash
git push
git branch -d feature/emoji
```

### Step 5. 파일 통째로 한쪽 고르기

설정 파일이나 자동 생성 파일처럼 **줄 단위로 섞을 필요가 없는** 경우가 있습니다. 이럴 땐 통째로 한쪽을 고를 수 있습니다.

충돌 상황을 다시 만들어 봅니다.

```bash
git switch -c feature/version
echo "VERSION = '2.0.0'" > version.py
git add version.py
git commit -m "chore: 버전을 2.0.0 으로"

git switch main
echo "VERSION = '1.5.0'" > version.py
git add version.py
git commit -m "chore: 버전을 1.5.0 으로"

git merge feature/version
```

실행 결과:

```
CONFLICT (add/add): Merge conflict in version.py
Auto-merging version.py
Automatic merge failed; fix conflicts and then commit the result.
```

**양쪽이 같은 이름의 새 파일을 만든** add/add 충돌입니다.

```bash
git checkout --ours version.py     # 현재 브랜치(main) 것 채택
# 또는
git checkout --theirs version.py   # 합쳐 오는 브랜치 것 채택
```

여기서는 상대 것을 고르겠습니다.

```bash
git checkout --theirs version.py
cat version.py
```

실행 결과:

```
VERSION = '2.0.0'
```

```bash
git add version.py
git commit -m "Merge branch 'feature/version' (2.0.0 채택)"
git branch -d feature/version
```

> ⚠️ **`--ours` / `--theirs` 는 파일 전체를 통째로 덮어씁니다.**
> 코드 파일에 쓰면 상대 작업이 **통째로 사라집니다.** 정말 한쪽만 맞는 경우에만 쓰세요.
> 헷갈리면 `git checkout --merge version.py` 로 마커 상태로 되돌릴 수 있습니다.

### Step 6. 수정/삭제 충돌 (modify/delete)

의외로 자주 만나고, 마커가 안 생겨서 당황하는 유형입니다.

```bash
git switch -c feature/cleanup
git rm USAGE.md
git commit -m "chore: 사용하지 않는 USAGE.md 삭제"

git switch main
echo "## 자세한 사용법은 위키 참고" >> USAGE.md
git add USAGE.md
git commit -m "docs: USAGE에 위키 안내 추가"

git merge feature/cleanup
```

실행 결과:

```
CONFLICT (modify/delete): USAGE.md deleted in feature/cleanup and modified in HEAD.  Version HEAD of USAGE.md left in tree.
Automatic merge failed; fix conflicts and then commit the result.
```

**메시지를 그대로 읽으면 됩니다.**
- `feature/cleanup` 에서는 **삭제**했고
- `HEAD`(main) 에서는 **수정**했으며
- 일단 **HEAD 버전을 남겨 뒀다**

파일 안에 마커는 없습니다. **결정만 하면 됩니다.**

```bash
# 삭제를 채택하려면
git rm USAGE.md

# 남기려면
git add USAGE.md
```

여기서는 남기겠습니다.

```bash
git add USAGE.md
git commit -m "Merge branch 'feature/cleanup' (USAGE.md 는 유지)"
git branch -d feature/cleanup
```

### Step 7. 도망치는 법

```bash
git switch -c feature/mess
echo "완전히 다른 내용" > todo.py
git add todo.py
git commit -m "test: 충돌 유발용"

git switch main
git merge feature/mess
```

충돌이 났습니다. **그냥 없던 일로 합니다.**

```bash
git merge --abort
git status
```

실행 결과:

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

**완전히 원래대로 돌아왔습니다.**

```bash
git branch -D feature/mess
```

> **`--abort` 를 부끄러워하지 마세요.** 상황을 파악하고 다시 시작하는 것이 억지로 밀어붙이는 것보다 훨씬 낫습니다.

### 같은 일을 GUI로 하면

VS Code에는 **3-way 병합 편집기**가 있습니다. 충돌 해결에 관해서는 명령어보다 확실히 편합니다.

1. 충돌 파일을 열면 상단에 **`Resolve in Merge Editor`** 버튼이 나옵니다.
2. 화면이 셋으로 나뉩니다.

```
┌─────────────┬─────────────┐
│  Incoming   │   Current   │   ← 양쪽 버전
│  (theirs)   │   (ours)    │
├─────────────┴─────────────┤
│         Result            │   ← 여기가 최종 결과
└───────────────────────────┘
```

3. 각 충돌 블록에 **`Accept Incoming` / `Accept Current` / `Accept Combination`** 버튼이 있습니다.
4. Result 영역은 **직접 타이핑해서 고칠 수도 있습니다.** 세 번째 답을 쓸 때 씁니다.
5. 다 되면 **`Complete Merge`** → 터미널에서 `git commit`

**인라인 편집만 쓸 거라면** 충돌 블록 위의 `Accept Current Change` / `Accept Incoming Change` / `Accept Both Changes` 링크를 눌러도 됩니다.

> ⚠️ **버튼만 누르고 넘어가지 마세요.** 특히 `Accept Both Changes` 는 양쪽을 위아래로 붙이기만 합니다.
> 코드라면 **문법이 깨지거나 로직이 중복**될 수 있습니다. 항상 결과를 읽고 실행해 보세요.

---

## ⑤ 자주 하는 실수

### 마커를 지우지 않고 커밋

```python
<<<<<<< HEAD
mark = "[완료]"
=======
mark = "✅"
>>>>>>> feature/emoji
```

이 상태로 `git add` 하면 **Git은 막지 않습니다.** 그대로 커밋되고, 코드는 당연히 실행되지 않습니다.

```
  File "todo.py", line 12
    <<<<<<< HEAD
    ^
SyntaxError: invalid syntax
```

**해결 · 예방** — 커밋 전에 검사하는 습관을 들이세요.

```bash
git diff --check                 # 충돌 마커·공백 오류 검사
grep -rn "<<<<<<<" .             # 직접 검색
```

`git diff --check` 실행 결과:

```
todo.py:12: leftover conflict marker
```

> 팀 차원에서는 **`pre-commit` 훅으로 자동 차단**하는 것이 정석입니다. [26강](lesson-26.md)에서 다룹니다.

### `error: Committing is not possible because you have unmerged files.`

```
U	todo.py
error: Committing is not possible because you have unmerged files.
hint: Fix them up in the work tree, and then use 'git add/rm <file>'
hint: as appropriate to mark resolution and make a commit.
fatal: Exiting because of an unresolved conflict.
```

**원인** — 파일은 고쳤지만 `git add` 로 **"해결했다"고 표시하지 않았습니다.**
**해결** —

```bash
git add <해결한 파일>
git commit
```

충돌 상황에서 `git add` 는 **해결 완료 도장**이라고 생각하세요.

### 충돌 도중에 브랜치를 옮기려 함

```
error: you need to resolve your current index first
```

**원인** — 병합이 진행 중인 상태에서는 브랜치를 옮길 수 없습니다.
**해결** — 먼저 끝내거나 취소하세요.

```bash
git merge --abort      # 취소하고 나서 이동
```

### `--abort` 가 안 됩니다

```
fatal: There is no merge to abort (MERGE_HEAD missing).
```

**원인** — 이미 `git commit` 으로 병합을 **완료**했습니다. 되돌릴 병합이 없습니다.
**해결** — 상황에 따라 다릅니다.

```bash
git reset --hard HEAD~1     # 아직 push 안 했다면 (⚠️ 위험, 07강)
git revert -m 1 HEAD        # 이미 push했다면 (17강)
```

### `ours` 와 `theirs` 를 반대로 이해

**원인** — 이름이 직관과 어긋납니다. 게다가 `rebase` 에서는 **뒤집힙니다.**

| 명령 | ours | theirs |
|---|---|---|
| `git merge` | **현재 브랜치** | 합쳐 오는 브랜치 |
| `git rebase` | **베이스 브랜치** | 내가 옮기는 커밋 ⚠️ |

**해결** — 이름을 믿지 말고 **마커에 적힌 브랜치명**을 보세요.

```
<<<<<<< HEAD              ← 이 이름을 확인
...
>>>>>>> feature/emoji     ← 이 이름을 확인
```

### 같은 충돌을 매번 다시 해결

긴 브랜치를 여러 번 병합하다 보면 **똑같은 충돌**을 반복해 만나게 됩니다.

**해결** — Git이 해결 방법을 기억하게 할 수 있습니다.

```bash
git config --global rerere.enabled true
```

**rerere** = **RE**use **RE**corded **RE**solution. 한 번 해결한 충돌은 다음에 자동으로 같은 방식으로 풀립니다.

> 자동 해결된 것도 **반드시 확인**하세요. 상황이 달라졌는데 예전 해결책이 적용될 수 있습니다.

### 바이너리 파일 충돌

```
warning: Cannot merge binary files: logo.png (HEAD vs. feature/design)
CONFLICT (content): Merge conflict in logo.png
```

**원인** — 이미지·엑셀·PDF 등은 **줄 단위 병합이 불가능**합니다.
**해결** — 한쪽을 통째로 고르는 수밖에 없습니다.

```bash
git checkout --ours logo.png      # 또는 --theirs
git add logo.png
```

**예방** — 디자인 파일 같은 것은 **담당자를 정해 한 사람만 수정**하는 규칙이 현실적입니다.

### 충돌이 너무 자주, 너무 크게 남

**원인** — 브랜치를 오래 방치하면 그동안 `main` 이 저만치 가 버립니다.
**해결 — 습관 4가지**

| 습관 | 효과 |
|---|---|
| **매일 `main` 을 브랜치에 반영** (`git merge main` 또는 `git rebase main`) | 충돌을 작게 쪼개서 만남 |
| **브랜치 수명을 짧게** (1~3일) | 겹칠 기회 자체가 줄어듦 |
| **PR을 작게** | 리뷰도 쉽고 충돌도 적음 |
| **코드 포맷터 통일** (black, prettier 등) | 들여쓰기·따옴표 때문에 나는 무의미한 충돌 제거 |

> 마지막 항목이 의외로 큽니다. 포맷터 설정이 사람마다 다르면 **파일 전체가 충돌**합니다.
> 팀 설정을 저장소에 커밋해 두고([26강](lesson-26.md)) 자동 적용하세요.

---

## ⑥ 확인 문제

**1.** 아래 충돌 마커를 보고 ① 각 구간이 무엇인지 ② 어떻게 해결할지 판단하세요. (`zdiff3` 스타일)

```python
<<<<<<< HEAD
    timeout = 30
||||||| 9f3c1a7
    timeout = 10
=======
    timeout = 5
>>>>>>> feature/perf
```

<details>
<summary>답 보기</summary>

**① 각 구간**

| 구간 | 값 | 정체 |
|---|---|---|
| `<<<<<<< HEAD` | 30 | 현재 브랜치(ours) |
| `\|\|\|\|\|\|\|` | **10** | **공통 조상 (원래 값)** |
| `=======` ~ `>>>>>>>` | 5 | `feature/perf` (theirs) |

**② 판단**

원래 10이었는데 **한쪽은 30으로 늘렸고, 한쪽은 5로 줄였습니다.** 방향이 정반대입니다. 즉 두 사람의 **의도가 충돌**하는 것이지 단순 실수가 아닙니다.

기계적으로 한쪽을 고르면 안 됩니다. 해야 할 일:

1. 두 커밋의 메시지를 읽어 **왜 바꿨는지** 확인합니다.

```bash
git log --oneline -S "timeout" -- config.py
git show <해당 커밋>
```

2. 예를 들어 이런 사정이 있을 수 있습니다.
   - 30으로: "느린 API 때문에 타임아웃이 나서 늘렸다"
   - 5로: "응답 없는 서버에 너무 오래 매달려서 줄였다"

3. **둘 다 맞는 요구입니다.** 이럴 땐 코드로 답을 내야 합니다.

```python
    timeout = 30 if is_slow_api else 5
```

**핵심** — 공통 조상이 보이면 **"양쪽 다 바꿨는가, 한쪽만 바꿨는가"** 를 알 수 있습니다.
한쪽만 바꿨다면 그쪽을 고르면 되고, 양쪽 다 바꿨다면 **사람의 합의가 필요합니다.**
</details>

**2.** 충돌 해결 중인데 상황이 복잡해 손을 놓고 싶습니다. **아직 `git commit` 은 안 했습니다.** 어떻게 할까요? 그리고 **이미 커밋했다면**?

<details>
<summary>답 보기</summary>

**① 아직 커밋 전 → `--abort`**

```bash
git merge --abort
```

병합 시작 전 상태로 **완전히** 돌아갑니다. 손해가 전혀 없습니다.

`git status` 로 `nothing to commit, working tree clean` 을 확인하세요.

**② 이미 커밋했다면**

`--abort` 는 안 됩니다.

```
fatal: There is no merge to abort (MERGE_HEAD missing).
```

두 가지 경우로 나뉩니다.

**push 전이라면** — 되감으면 됩니다.

```bash
git reset --hard HEAD~1
```

⚠️ 커밋 안 한 다른 변경이 있으면 함께 사라집니다. `git status` 로 먼저 확인하세요.

**이미 push했다면** — 이력을 지우면 안 됩니다. 되돌리는 커밋을 만듭니다.

```bash
git revert -m 1 <머지커밋해시>
```

`-m 1` 은 **"첫 번째 부모(합쳐 들어간 쪽) 기준으로 되돌려라"** 는 뜻입니다. 머지 커밋은 부모가 둘이라 어느 쪽을 기준으로 삼을지 알려 줘야 합니다. [17강](lesson-17.md)에서 다룹니다.

**예방** — 충돌이 클 것 같으면 **병합 전에 미리 확인**할 수 있습니다.

```bash
git merge --no-commit --no-ff feature/x    # 커밋하지 않고 결과만 만들어 보기
git merge --abort                          # 마음에 안 들면 취소
```
</details>

**3.** 팀원이 하소연합니다. **"브랜치를 2주 동안 작업했는데 merge하려니 충돌이 40군데예요."** 원인과, 앞으로의 예방책을 말해 보세요.

<details>
<summary>답 보기</summary>

**원인 — 브랜치가 너무 오래 살았습니다.**

```
main:     A ─ B ─ C ─ D ─ E ─ F ─ G ─ H    (2주간 8커밋)
                │
feature:        └─ X ─ Y ─ Z              (2주간 내 작업)
                                ↑
                        여기서 한 번에 충돌 40개
```

`main` 이 2주치 움직인 것을 **마지막에 한꺼번에** 만나기 때문입니다.

**지금 당장의 대처**

```bash
# 한 번에 다 하지 말고 부분적으로
git switch feature/x
git merge main              # main 을 브랜치로 먼저 가져와 충돌 처리
                            # (main 을 오염시키지 않으니 안전)
```

충돌 파일이 많으면 **한 번에 다 고치지 말고** 파일별로 처리하며 중간중간 `git add` 하세요. 진행 상황은 `git status` 로 확인됩니다.

정 안 되면 `--abort` 하고 **작은 단위로 쪼개서** 여러 번 merge하는 것도 방법입니다.

**예방책 4가지**

| 방법 | 설명 |
|---|---|
| **매일 main 반영** | `git merge main` 또는 `git rebase main` ([12강](lesson-12.md)). 하루치 충돌은 대개 1~2개 |
| **브랜치 수명 1~3일** | 기능이 크면 잘게 쪼갭니다. "로그인 기능" → "로그인 폼" + "세션 처리" + "에러 화면" |
| **PR을 작게** | 리뷰도 빨라지고 merge도 빨라집니다 ([14강](lesson-14.md)) |
| **포맷터 통일** | 들여쓰기·따옴표 차이로 나는 가짜 충돌을 없앱니다 |

**핵심 원리**
> 충돌의 크기는 **브랜치가 살아 있던 시간에 비례**합니다.
> 자주 합치면 매번 작게 만나고, 미루면 한 번에 크게 만납니다. 총량은 오히려 미룰수록 늘어납니다.
</details>

---

## 오늘의 정리

| 명령 | 하는 일 |
|---|---|
| `git status` | **충돌 파일 확인** (가장 먼저) |
| `git diff --name-only --diff-filter=U` | 충돌 파일 목록만 |
| `git add <파일>` | **"이 파일 해결 완료" 표시** |
| `git commit` | 병합 마무리 |
| **`git merge --abort`** | 병합 취소 (커밋 전에만) |
| `git checkout --ours <파일>` | 현재 브랜치 것 통째로 |
| `git checkout --theirs <파일>` | 상대 브랜치 것 통째로 |
| `git checkout --merge <파일>` | 마커 상태로 되돌리기 |
| `git diff --check` | **마커 남았는지 검사** |
| `git merge --no-commit --no-ff` | 결과만 미리 보기 |

**설정 (지금 해 두세요)**

```bash
git config --global merge.conflictStyle zdiff3   # 공통 조상까지 표시
git config --global rerere.enabled true          # 같은 충돌 자동 재사용
```

**해결 절차**

```
① git status        어떤 파일이?
② 파일 편집          마커 지우고 최종 모습으로
③ git add           해결 완료 표시
④ git diff --check  마커 안 남았나
⑤ git commit        병합 완료
```

**충돌 유형**

| 유형 | 표시 | 해결 |
|---|---|---|
| content | `both modified` + 마커 | 편집 후 `add` |
| add/add | 양쪽이 같은 파일 생성 | 편집 또는 `--ours`/`--theirs` |
| modify/delete | 마커 없음 | `git rm` 또는 `git add` 로 결정 |
| binary | 병합 불가 | 한쪽 통째로 선택 |

**오늘 반드시 기억할 한 가지**
> **충돌은 에러가 아니라 질문입니다.** Git이 판단할 수 없어 물어보는 것입니다.
> 그리고 **언제든 `git merge --abort` 로 원점으로 돌아갈 수 있습니다.** 겁먹지 마세요.

**과제**
1. `merge.conflictStyle zdiff3` 를 설정하고, 설정 전후의 충돌 마커가 어떻게 다른지 비교해 보세요.
2. `todo-app` 과 `todo-app-teammate` 를 오가며 **content 충돌**을 만들고 해결한 뒤 push하세요.
3. **modify/delete 충돌**을 일부러 만들어 보고, 마커가 없다는 것을 확인한 뒤 `git rm` / `git add` 로 결정해 보세요.
4. 해결 도중 `git diff --check` 를 실행해 마커가 남았을 때 어떤 경고가 나오는지 확인하세요.
5. VS Code의 **Merge Editor** 로 같은 충돌을 해결해 보고, 명령어 방식과 비교해 보세요.

---

[← 이전 10강](lesson-10.md) · [목차](README.md) · [다음 → 12강 merge vs rebase](lesson-12.md)
