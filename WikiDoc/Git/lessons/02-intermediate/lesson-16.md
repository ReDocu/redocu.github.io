# 16강 · 임시 저장과 골라 옮기기

> **Git 학습 매뉴얼** · 🟡 중급 · **16강 / 30**
> [← 이전 15강](lesson-15.md) · [목차](README.md) · [다음 → 17강 안전하게 되돌리기](lesson-17.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git stash` 로 작업 중인 변경을 임시 보관하고 되찾을 수 있다.
- `pop` 과 `apply` 의 차이를 알고 상황에 맞게 쓸 수 있다.
- `git cherry-pick` 으로 특정 커밋만 다른 브랜치로 가져올 수 있다.
- 브랜치를 잘못 파서 엉뚱한 곳에 커밋한 상황을 수습할 수 있다.

---

## ② 왜 필요한가

**상황 1 — 작업 중인데 급한 일이 끼어들었습니다.**

```
feature/search 작업 중 (절반쯤, 커밋하기엔 애매함)
        ↓
"운영에서 결제가 안 됩니다. 지금 봐 주세요."
        ↓
git switch main
error: Your local changes to the following files would be overwritten by checkout:
	todo.py
```

[08강](lesson-08.md)에서 이 에러를 만났을 때는 **"커밋하거나 stash 하세요"** 라고만 하고 넘어갔습니다. 오늘 그 `stash` 를 배웁니다.

**상황 2 — 커밋을 엉뚱한 브랜치에 했습니다.**

```
아차, main 에서 작업했네... 브랜치를 안 팠구나
```

**상황 3 — 이 수정만 다른 브랜치에도 필요합니다.**

```
hotfix/payment 에서 고친 버그
  → main 에는 합쳤는데
  → release/1.2 브랜치에도 이 커밋 하나만 필요함
```

**상황 4 — 리뷰 중인 팀원의 커밋 하나만 미리 가져오고 싶습니다.**

2·3·4번의 답이 **`cherry-pick`** 입니다. **커밋을 골라서 복사해 오는 것**입니다.

---

## ③ 개념 설명

### `git stash` — 작업을 서랍에 넣어 두기

**현재 변경 사항을 따로 보관하고 작업 디렉터리를 깨끗하게 만듭니다.**

```
작업 디렉터리 (수정 중)                   stash 보관함
┌─────────────────┐   git stash      ┌──────────────┐
│ todo.py  (수정)  │ ───────────────▶ │  stash@{0}   │
│ README   (수정)  │                  └──────────────┘
└─────────────────┘
        ↓
┌─────────────────┐   git stash pop
│  clean 상태      │ ◀───────────────
└─────────────────┘
```

**스택(stack) 구조**입니다. 나중에 넣은 것이 `stash@{0}` 이 됩니다.

```
stash@{0}   ← 가장 최근
stash@{1}
stash@{2}   ← 가장 오래된
```

### `pop` 과 `apply`

| 명령 | 동작 | 보관함 |
|---|---|---|
| `git stash pop` | 꺼내서 적용 | **삭제됨** |
| `git stash apply` | 복사해서 적용 | **남아 있음** |

> **여러 브랜치에 같은 변경을 적용해 보고 싶다면 `apply`**, 한 번 쓰고 끝이면 `pop` 입니다.
> `apply` 를 쓴 뒤에는 `git stash drop` 으로 직접 지워야 합니다.

### stash가 담지 않는 것

**기본 `git stash` 는 추적 중인(tracked) 파일의 변경만 보관합니다.**

| 대상 | 기본 | `-u` | `-a` |
|---|---|---|---|
| 수정된 추적 파일 | ✅ | ✅ | ✅ |
| 스테이지에 담긴 변경 | ✅ | ✅ | ✅ |
| **새 파일 (untracked)** | ❌ | ✅ | ✅ |
| **무시된 파일 (.gitignore)** | ❌ | ❌ | ✅ |

```bash
git stash        # 추적 중인 변경만
git stash -u     # + 새 파일          ← 대부분 이걸 원합니다
git stash -a     # + 무시된 파일까지  ⚠️ venv 까지 들어감
```

> ⚠️ **"stash 했는데 새로 만든 파일이 그대로 있어요"** 는 이 때문입니다. `-u` 를 붙이세요.
> `-a` 는 `.gitignore` 대상까지 담으므로 `venv/` 같은 것이 통째로 들어갑니다. 거의 쓸 일이 없습니다.

### `git cherry-pick` — 커밋을 골라 복사

**다른 브랜치의 특정 커밋을 현재 브랜치로 가져옵니다.**

```
main       ●───●───●                    ← HEAD
                     ↖ cherry-pick X
hotfix     ●───●───X───●
```

결과:

```
main       ●───●───●───X'               (X 와 내용은 같지만 새 커밋)
hotfix     ●───●───X───●
```

> **복사이지 이동이 아닙니다.** 원본은 그대로 남고, **새 해시**를 가진 커밋이 만들어집니다.
> [12강](lesson-12.md)의 rebase와 같은 원리입니다. 부모가 달라지니 해시도 달라집니다.

**언제 쓰나**

| 상황 | 설명 |
|---|---|
| 브랜치를 잘못 파서 엉뚱한 곳에 커밋 | 옳은 브랜치로 옮기기 |
| hotfix를 여러 브랜치에 반영 | `main` 과 `release/1.2` 양쪽에 |
| 긴 브랜치에서 급한 수정만 먼저 | 완성 전에 그 커밋만 배포 |
| 리뷰 중인 PR의 커밋 하나만 미리 | 다른 작업의 선행 조건일 때 |

**언제 쓰면 안 되나**

- **브랜치 전체를 옮길 때** — 그건 `merge` 나 `rebase` 입니다
- **습관적으로** — 같은 변경이 서로 다른 해시로 여러 곳에 생겨 이력이 지저분해지고, 나중에 병합할 때 충돌의 원인이 됩니다

---

## ④ 단계별 실습

### Step 1. 급한 일이 끼어든 상황

```bash
cd ~/Desktop/todo-app
git switch main
git pull
git switch -c feature/search
```

`todo.py` 에 검색 기능을 **절반만** 만듭니다.

```python
def search(keyword):
    todos = load()
    # TODO: 대소문자 무시, 완료 항목 제외 옵션 추가해야 함
    found = [t for t in todos if keyword in t["text"]]
```

새 파일도 하나 만듭니다.

```bash
echo "# 검색 기능 설계 메모" > SEARCH_NOTES.md
```

```bash
git status
```

실행 결과:

```
On branch feature/search
Changes not staged for commit:
	modified:   todo.py

Untracked files:
	SEARCH_NOTES.md
```

**여기서 급한 버그 신고가 들어왔습니다.** 커밋하기엔 코드가 미완성입니다.

```bash
git stash -u -m "검색 기능 작업 중 (필터 옵션 미구현)"
```

실행 결과:

```
Saved working directory and index state On feature/search: 검색 기능 작업 중 (필터 옵션 미구현)
```

```bash
git status
```

실행 결과:

```
On branch feature/search
nothing to commit, working tree clean
```

**깨끗해졌습니다.** `SEARCH_NOTES.md` 도 사라진 것을 확인하세요. `-u` 덕분입니다.

> **`-m "메시지"` 를 꼭 붙이세요.** 안 붙이면 `WIP on feature/search: 4e9c2a7 ...` 같은 자동 메시지가 붙어서,
> 며칠 뒤 `git stash list` 를 봤을 때 무엇이 뭔지 알 수 없습니다.

### Step 2. 급한 일 처리하고 돌아오기

```bash
git switch main
git switch -c fix/priority-default
```

`todo.py` 의 `add()` 함수 기본값을 고칩니다.

```python
def add(text, priority="보통"):
    if priority not in ("높음", "보통", "낮음"):
        print(f"알 수 없는 우선순위입니다: {priority}")
        return
```

```bash
git add todo.py
git commit -m "fix: 잘못된 우선순위 값이 그대로 저장되던 문제 수정"
git push -u origin fix/priority-default

git switch main
git merge --no-ff fix/priority-default
git push
git branch -d fix/priority-default
```

**이제 원래 작업으로 돌아갑니다.**

```bash
git switch feature/search
git stash list
```

실행 결과:

```
stash@{0}: On feature/search: 검색 기능 작업 중 (필터 옵션 미구현)
```

**꺼내기 전에 내용을 확인**할 수 있습니다.

```bash
git stash show -p stash@{0}
```

실행 결과:

```diff
diff --git a/todo.py b/todo.py
index d7b4e90..a2f8c31 100644
--- a/todo.py
+++ b/todo.py
@@ -45,3 +45,9 @@ def count():
     done = sum(1 for t in todos if t["done"])
     print(f"전체 {len(todos)}개 · 완료 {done}개 · 남음 {len(todos) - done}개")
+
+
+def search(keyword):
+    todos = load()
+    # TODO: 대소문자 무시, 완료 항목 제외 옵션 추가해야 함
+    found = [t for t in todos if keyword in t["text"]]
```

```bash
git stash pop
```

실행 결과:

```
On branch feature/search
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   todo.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	SEARCH_NOTES.md

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (a3f9c2e8b1d5f7a9c3e5b7d9f1a3c5e7b9d1f3a5)
```

**작업이 그대로 돌아왔습니다.** 마지막 줄 `Dropped ...` 가 보관함에서 제거됐다는 뜻입니다.

```bash
git stash list        # 비어 있음
```

작업을 마저 완성합니다.

```python
def search(keyword, include_done=True):
    todos = load()
    keyword = keyword.lower()
    found = [
        t for t in todos
        if keyword in t["text"].lower() and (include_done or not t["done"])
    ]
    if not found:
        print(f"'{keyword}' 를 포함한 할 일이 없습니다.")
        return
    for t in found:
        mark = "✅" if t["done"] else "⬜"
        print(f"{mark} {t['text']}")
```

```bash
rm SEARCH_NOTES.md
git add todo.py
git commit -m "feat: 할 일 검색 기능 추가"
git switch main
git merge --no-ff feature/search
git push
git branch -d feature/search
```

### Step 3. stash 활용 기술

**① 여러 개 쌓아 두고 골라 쓰기**

```bash
echo "실험 A" >> NOTES.md
git stash -m "실험 A"

echo "실험 B" >> NOTES.md
git stash -m "실험 B"

git stash list
```

실행 결과:

```
stash@{0}: On main: 실험 B
stash@{1}: On main: 실험 A
```

**나중에 넣은 것이 `{0}`** 입니다.

```bash
git stash apply stash@{1}      # A 를 적용 (보관함에 남김)
git stash list                 # 둘 다 그대로 있음
```

**② 특정 파일만 stash**

```bash
git stash push -m "todo.py 만 보관" -- todo.py
```

**③ 스테이지 상태 유지하며 stash**

```bash
git stash --keep-index         # add 한 것은 그대로 두고, 안 담은 것만 보관
```

> 커밋 직전에 **"담은 것만으로 테스트가 통과하는지"** 확인할 때 씁니다.

**④ stash에서 바로 브랜치 만들기**

```bash
git stash branch feature/experiment stash@{0}
```

실행 결과:

```
Switched to a new branch 'feature/experiment'
On branch feature/experiment
Changes not staged for commit:
	modified:   NOTES.md
Dropped refs/stash@{0} (...)
```

**stash를 만들었던 시점의 커밋에서 새 브랜치를 만들고, 변경을 복원하고, stash를 삭제**까지 한 번에 합니다.
`pop` 할 때 충돌이 예상되는 오래된 stash에 특히 유용합니다.

**⑤ 정리**

```bash
git stash drop stash@{0}       # 하나 삭제
git stash clear                # 전부 삭제 ⚠️ 되돌릴 수 없음
```

실습 정리:

```bash
git switch main
git branch -D feature/experiment
git stash clear
git restore .
```

### Step 4. 브랜치를 잘못 파서 커밋한 상황

**가장 흔한 cherry-pick 활용 사례입니다.**

```bash
git switch main
```

브랜치를 만드는 걸 깜빡하고 `main` 에서 작업했다고 가정합니다.

```python
def export_csv():
    todos = load()
    with open("todos.csv", "w", encoding="utf-8") as f:
        f.write("text,done,priority\n")
        for t in todos:
            f.write(f"{t['text']},{t['done']},{t.get('priority', '보통')}\n")
    print("todos.csv 로 내보냈습니다.")
```

```bash
git add todo.py
git commit -m "feat: CSV 내보내기 기능 추가"
git log --oneline -2
```

실행 결과:

```
c8e2f4a (HEAD -> main) feat: CSV 내보내기 기능 추가
7b1d9c3 (origin/main) Merge branch 'feature/search'
```

**아차, `main` 에 직접 커밋했습니다.** ([13강](lesson-13.md)에서 보호 규칙을 걸었다면 push 단계에서 막힙니다)

**수습 순서**

```bash
# ① 올바른 브랜치를 만들고
git switch -c feature/export-csv

# ② 그 커밋을 가져온다 — 이미 이 브랜치에 있으므로 cherry-pick 불필요
#    (브랜치를 지금 만들었으니 커밋이 그대로 딸려 옵니다)

# ③ main 을 원격 상태로 되돌린다
git switch main
git reset --hard origin/main

git log --oneline -1
```

실행 결과:

```
7b1d9c3 (HEAD -> main, origin/main) Merge branch 'feature/search'
```

**`main` 은 깨끗해졌고, 커밋은 `feature/export-csv` 에 살아 있습니다.**

```bash
git log --oneline -1 feature/export-csv
```

실행 결과:

```
c8e2f4a feat: CSV 내보내기 기능 추가
```

> **이미 `main` 에서 여러 커밋을 하고 그중 일부만 옮기고 싶다면** 그때가 진짜 cherry-pick 차례입니다. Step 5에서 합니다.

### Step 5. cherry-pick 으로 커밋 골라 가져오기

**여러 커밋 중 하나만** 다른 브랜치로 가져오는 상황을 만듭니다.

```bash
git switch feature/export-csv
```

커밋을 두 개 더 만듭니다.

```bash
echo "- \`export_csv()\` : CSV 내보내기" >> README.md
git add README.md
git commit -m "docs: CSV 내보내기 사용법 추가"
```

`todo.py` 의 `load()` 함수에 버그 수정을 넣습니다. **이건 급해서 `main` 에 먼저 넣어야 합니다.**

```python
def load():
    if not os.path.exists(FILE):
        return []
    with open(FILE, encoding="utf-8") as f:
        content = f.read().strip()
        if not content:            # ← 빈 파일 처리
            return []
        return json.loads(content)
```

```bash
git add todo.py
git commit -m "fix: todos.json 이 비어 있을 때 발생하는 오류 수정"
git log --oneline -3
```

실행 결과:

```
9f4b2e8 (HEAD -> feature/export-csv) fix: todos.json 이 비어 있을 때 발생하는 오류 수정
3a7c1d5 docs: CSV 내보내기 사용법 추가
c8e2f4a feat: CSV 내보내기 기능 추가
```

**CSV 기능은 아직 미완성이지만, 버그 수정 하나만 `main` 에 급히 넣어야 합니다.**

```bash
git switch main
git cherry-pick 9f4b2e8
```

실행 결과:

```
[main 8d3f1a9] fix: todos.json 이 비어 있을 때 발생하는 오류 수정
 Date: Mon Aug 10 18:22:05 2026 +0900
 1 file changed, 4 insertions(+), 1 deletion(-)
```

```bash
git log --oneline -2
```

실행 결과:

```
8d3f1a9 (HEAD -> main) fix: todos.json 이 비어 있을 때 발생하는 오류 수정
7b1d9c3 (origin/main) Merge branch 'feature/search'
```

> **해시가 `9f4b2e8` → `8d3f1a9` 로 바뀌었습니다.** 복사본이지 원본이 아닙니다.
> `feature/export-csv` 에는 원래 커밋이 그대로 남아 있습니다.

```bash
git push
```

**여러 개 가져오기**

```bash
git cherry-pick <해시1> <해시2> <해시3>     # 여러 개
git cherry-pick A..B                       # A 다음부터 B까지 (A 제외)
git cherry-pick A^..B                      # A 부터 B까지 (A 포함)
```

**유용한 옵션**

```bash
git cherry-pick -x <해시>       # 메시지에 "(cherry picked from commit ...)" 기록
git cherry-pick -n <해시>       # 적용만 하고 커밋은 안 함 (수정 후 커밋하고 싶을 때)
git cherry-pick -e <해시>       # 메시지를 편집하면서 가져오기
```

> **`-x` 를 권합니다.** 나중에 "이 커밋 어디서 왔지?" 를 추적할 수 있습니다.
> 특히 여러 릴리스 브랜치에 같은 수정을 뿌릴 때 필수입니다.

### Step 6. cherry-pick 충돌 처리

`main` 이 앞서 나간 뒤 옛날 커밋을 가져오면 충돌할 수 있습니다.

```bash
git switch main
```

`todo.py` 의 `show()` 를 고칩니다.

```python
def show():
    todos = load()
    if not todos:
        print("등록된 할 일이 없습니다. add() 로 추가해 보세요.")
        return
```

```bash
git add todo.py
git commit -m "feat: 빈 목록 안내 문구 개선"
```

```bash
git switch feature/export-csv
```

같은 줄을 다르게 고칩니다.

```python
def show():
    todos = load()
    if not todos:
        print("[안내] 할 일 목록이 비어 있습니다.")
        return
```

```bash
git add todo.py
git commit -m "feat: 빈 목록 메시지에 태그 추가"
git log --oneline -1
```

실행 결과:

```
2c8f5a1 (HEAD -> feature/export-csv) feat: 빈 목록 메시지에 태그 추가
```

```bash
git switch main
git cherry-pick 2c8f5a1
```

실행 결과:

```
Auto-merging todo.py
CONFLICT (content): Merge conflict in todo.py
error: could not apply 2c8f5a1... feat: 빈 목록 메시지에 태그 추가
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
```

**[11강](lesson-11.md)과 똑같이 처리하면 됩니다.**

파일을 열어 마커를 정리합니다.

```python
        print("[안내] 등록된 할 일이 없습니다. add() 로 추가해 보세요.")
```

```bash
git add todo.py
git cherry-pick --continue
```

편집기가 열리면 메시지를 확인하고 저장합니다.

**세 가지 선택지**

| 명령 | 뜻 |
|---|---|
| `git cherry-pick --continue` | 해결했다. 계속 |
| `git cherry-pick --skip` | 이 커밋은 건너뛴다 |
| `git cherry-pick --abort` | 전부 취소 |

정리합니다.

```bash
git push
git switch main
git branch -D feature/export-csv
```

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code |
|---|---|
| stash 저장 | Source Control `···` → **Stash** → **Stash (Include Untracked)** |
| stash 목록·적용 | `···` → **Stash** → **Pop Stash** / **Apply Stash** |
| cherry-pick | **Git Graph** 확장 → 커밋 우클릭 → **Cherry Pick** |
| 커밋 옮기기 | Git Graph에서 커밋을 보며 브랜치 조작 |

> **Git Graph 확장**에서는 커밋을 우클릭해 cherry-pick, revert, reset 등을 바로 할 수 있습니다.
> 어느 커밋이 어느 브랜치에 있는지 눈으로 보면서 하니 실수가 줄어듭니다.

---

## ⑤ 자주 하는 실수

### stash 했는데 새 파일이 그대로 있음

**원인** — 기본 `git stash` 는 **추적 중인 파일만** 보관합니다.
**해결** —

```bash
git stash -u        # untracked 포함
```

> 이미 stash한 뒤에 알았다면, 새 파일만 다시 stash하면 됩니다.

### `git stash pop` 에서 충돌

```
Auto-merging todo.py
CONFLICT (content): Merge conflict in todo.py
The stash entry is kept in case you need it again.
```

**원인** — stash한 뒤 그 부분이 다른 커밋으로 바뀌었습니다.
**해결** — 일반 충돌처럼 해결한 뒤, **stash를 직접 지웁니다.**

```bash
# 마커 정리 후
git add todo.py
git stash drop        # ← pop 이 실패했으므로 자동 삭제되지 않음
```

> **마지막 줄이 중요합니다.** `The stash entry is kept` — 충돌 시 Git은 stash를 지우지 않고 남겨 둡니다.
> 안전장치이지만, 지우지 않으면 보관함에 계속 쌓입니다.

**충돌이 두렵다면** `git stash branch` 를 쓰세요. stash를 만든 시점에서 브랜치를 만들므로 충돌이 나지 않습니다.

### `apply` 쓰고 보관함이 계속 쌓임

```bash
git stash list
```

```
stash@{0}: WIP on main: ...
stash@{1}: WIP on main: ...
stash@{2}: WIP on feature/x: ...
...
stash@{12}: WIP on main: ...
```

**원인** — `apply` 는 보관함을 지우지 않습니다.
**해결** —

```bash
git stash drop stash@{3}     # 하나씩
git stash clear              # 전부 ⚠️
```

> **stash는 임시 저장소입니다.** 며칠 이상 두지 마세요.
> 오래 보관해야 한다면 **브랜치를 만들어 커밋**하는 것이 맞습니다.

### stash를 실수로 지웠습니다

```bash
git stash clear      # 아차
```

**해결** — 어렵지만 가능합니다. stash도 커밋으로 저장되므로 **도달 불가 객체**로 남아 있습니다.

```bash
git fsck --unreachable | grep commit
```

나온 해시를 하나씩 확인합니다.

```bash
git show <해시>
git stash apply <해시>
```

> 성공률이 100%는 아닙니다(가비지 컬렉션이 돌면 사라집니다). **`clear` 는 신중하게.**
> 자세한 복구 원리는 [23강](lesson-23.md)에서 다룹니다.

### stash가 어느 브랜치 것인지 모름

```
stash@{0}: WIP on main: 4e9c2a7 docs: README 오타 수정
stash@{1}: WIP on main: 4e9c2a7 docs: README 오타 수정
stash@{2}: WIP on main: 4e9c2a7 docs: README 오타 수정
```

**원인** — 메시지를 안 붙였습니다.
**해결** — **항상 `-m` 을 붙이세요.**

```bash
git stash -u -m "검색 기능: 필터 옵션 구현 중"
```

내용을 확인하려면:

```bash
git stash show -p stash@{1}
```

### cherry-pick 후 나중에 병합하니 커밋이 중복

**증상** — `main` 에 cherry-pick한 커밋과, 나중에 브랜치를 병합하며 들어온 원본 커밋이 **둘 다 이력에 보입니다.**

```
8d3f1a9 fix: 빈 파일 오류 수정        ← cherry-pick 한 것
...
9f4b2e8 fix: 빈 파일 오류 수정        ← 병합으로 들어온 원본
```

**원인** — cherry-pick은 **복사**입니다. 원본은 그대로 남아 있다가 나중에 함께 병합됩니다.
**해결** — 대개는 **Git이 알아서 처리합니다.** 내용이 같으면 병합 시 충돌 없이 흡수됩니다. 하지만 이력에는 둘 다 남습니다.

**예방**
- `-x` 옵션으로 출처를 남겨 두면 나중에 이해하기 쉽습니다
- **cherry-pick은 예외적인 상황에만** 쓰세요. 상시로 쓰면 이력이 지저분해집니다
- 브랜치 전체를 옮길 거라면 `merge` 나 `rebase` 를 쓰세요

### cherry-pick을 습관적으로 사용

**증상** — 같은 변경이 서로 다른 해시로 브랜치마다 존재합니다. 나중에 병합할 때 충돌이 쏟아집니다.
**원인** — 브랜치 전략이 없어서 그때그때 커밋을 옮기고 있습니다.
**해결** — [13강](lesson-13.md)의 브랜치 전략을 세우세요. cherry-pick이 자주 필요하다면 **전략 자체에 문제가 있다는 신호**입니다.

**cherry-pick이 정당한 경우**

- hotfix를 `main` 과 `release/*` 양쪽에 반영 (Git Flow)
- 잘못된 브랜치에 커밋한 것을 수습
- 긴 브랜치에서 급한 수정 하나만 먼저 배포

### 병합 커밋을 cherry-pick 하려다 실패

```
error: commit 3a9f2c1... is a merge but no -m option was given.
fatal: cherry-pick failed
```

**원인** — 머지 커밋은 **부모가 둘**이라 어느 쪽 기준으로 변경을 계산할지 알 수 없습니다.
**해결** —

```bash
git cherry-pick -m 1 3a9f2c1     # 첫 번째 부모 기준
```

> 대개 `-m 1` (합쳐 들어간 쪽, 보통 `main`)이 맞습니다.
> 하지만 **머지 커밋을 cherry-pick하는 것 자체가 대개 잘못된 접근**입니다. 원래 커밋들을 개별로 가져오는 편이 낫습니다.

---

## ⑥ 확인 문제

**1.** `feature/x` 에서 작업 중인데 급한 버그 수정 요청이 왔습니다. **새로 만든 파일도 있고**, 커밋하기엔 미완성입니다. 어떻게 처리할까요?

<details>
<summary>답 보기</summary>

```bash
# ① 새 파일까지 포함해서 보관 + 설명 붙이기
git stash -u -m "검색 기능 작업 중 (필터 미구현)"

# ② 깨끗해진 것 확인
git status          # nothing to commit, working tree clean

# ③ 급한 일 처리
git switch main
git pull
git switch -c fix/urgent
# ... 수정 ...
git commit -m "fix: ..."
git push -u origin fix/urgent
# PR → 병합

# ④ 원래 자리로 복귀
git switch feature/x
git stash list                    # 확인
git stash show -p stash@{0}       # 내용 미리보기 (선택)
git stash pop                     # 꺼내서 적용 + 보관함에서 삭제
```

**핵심 3가지**

- **`-u`** — 없으면 새 파일이 그대로 남아 브랜치를 따라다닙니다
- **`-m "설명"`** — 없으면 나중에 뭐가 뭔지 모릅니다
- **`pop`** — 한 번 쓰고 끝이니 `apply` 대신 `pop`

**대안 — 임시 커밋**

```bash
git commit -am "wip: 검색 기능 작업 중"
# ... 급한 일 처리 ...
git switch feature/x
git reset --soft HEAD~1      # 커밋 풀고 작업 상태로 복귀
```

stash보다 안전합니다(브랜치에 기록으로 남으므로 잃어버릴 일이 없습니다). 다만 새 파일은 `git add` 를 먼저 해야 합니다.

**⚠️ 절대 하면 안 되는 것** — 그냥 `git switch main`. 파일이 겹치지 않으면 **변경이 따라와서** 엉뚱한 브랜치에 커밋될 수 있습니다.
</details>

**2.** `feature/big-work` 브랜치에 커밋이 10개 있습니다. 그중 **3번째 커밋의 버그 수정만** `main` 에 급히 반영해야 합니다. 어떻게 할까요?

<details>
<summary>답 보기</summary>

**`cherry-pick` 을 씁니다.**

```bash
# ① 해당 커밋 해시 찾기
git log --oneline feature/big-work
```

```
...
9f4b2e8 fix: 결제 금액이 음수일 때 오류      ← 이것
...
```

```bash
# ② main 으로 가서 가져오기
git switch main
git pull
git cherry-pick -x 9f4b2e8
```

`-x` 를 붙이면 메시지에 출처가 기록됩니다.

```
fix: 결제 금액이 음수일 때 오류

(cherry picked from commit 9f4b2e8a...)
```

```bash
# ③ 충돌이 나면 해결
git add <파일>
git cherry-pick --continue

# ④ 확인하고 push
git log --oneline -2
git push
```

**주의할 점**

- **해시가 바뀝니다.** `main` 의 커밋과 브랜치의 원본은 다른 커밋입니다
- 나중에 `feature/big-work` 를 병합하면 **원본도 함께 들어옵니다.** 내용이 같으면 충돌 없이 흡수되지만 이력에는 둘 다 남습니다
- 그래서 `-x` 로 출처를 남겨 두는 것이 좋습니다

**더 나은 접근** — 애초에 급한 수정은 **별도 브랜치로 분리**하는 것이 정석입니다.

```bash
git switch main
git switch -c fix/negative-amount
# 수정만 따로 커밋 → PR → main 병합
# feature/big-work 는 나중에 main 을 rebase 로 흡수
```

**cherry-pick이 자주 필요하다면** 브랜치를 너무 크게 잡고 있다는 신호입니다 ([13강](lesson-13.md)).
</details>

**3.** `git stash pop` 과 `git stash apply` 의 차이를 설명하고, **`apply` 를 써야 하는 상황**을 예로 들어 보세요.

<details>
<summary>답 보기</summary>

| | `pop` | `apply` |
|---|---|---|
| 적용 | ✅ | ✅ |
| 보관함에서 삭제 | ✅ | ❌ **남아 있음** |

**`apply` 를 써야 하는 상황**

**① 같은 변경을 여러 브랜치에 적용해 보고 싶을 때**

```bash
git stash -m "성능 개선 실험"

git switch feature/a
git stash apply          # A 에 적용해 보고 테스트
git restore .            # 되돌리기

git switch feature/b
git stash apply          # B 에도 적용해 보고 비교

git stash drop           # 다 끝나면 삭제
```

**② 충돌이 예상될 때 (안전장치)**

`pop` 은 충돌이 나면 stash를 남겨 두지만, 성공하면 지웁니다. 적용 결과가 마음에 안 들어도 되돌릴 수 없습니다.

```bash
git stash apply          # 먼저 시도
# 결과가 이상하면
git restore .            # 깨끗이 되돌리고
git stash list           # stash 는 그대로 있음 → 다시 시도 가능
```

**③ 잘못 꺼낼까 봐 불안할 때**

stash가 여러 개인데 어느 것인지 확실하지 않다면 `apply` 로 확인하고, 맞으면 `drop` 합니다.

```bash
git stash show -p stash@{2}     # 먼저 내용 확인
git stash apply stash@{2}
git stash drop stash@{2}        # 확인됐으면 삭제
```

**정리**

```
확실하면        →  pop   (적용 + 정리를 한 번에)
확실하지 않으면  →  apply (확인 후 직접 drop)
```

⚠️ **`apply` 를 쓰고 `drop` 을 잊으면** 보관함이 계속 쌓입니다. 주기적으로 `git stash list` 를 확인하세요.
</details>

---

## 오늘의 정리

**stash**

| 명령 | 하는 일 |
|---|---|
| `git stash -u -m "설명"` | **새 파일 포함 + 설명 붙여 보관** (권장 형태) |
| `git stash list` | 보관 목록 |
| `git stash show -p stash@{0}` | 내용 미리보기 |
| `git stash pop` | 꺼내서 적용 (**보관함 삭제**) |
| `git stash apply` | 복사해서 적용 (보관함 유지) |
| `git stash drop stash@{0}` | 하나 삭제 |
| `git stash clear` | 전부 삭제 ⚠️ |
| `git stash branch <이름>` | stash로 새 브랜치 만들기 |
| `git stash push -m "..." -- <파일>` | 특정 파일만 |
| `git stash --keep-index` | 스테이지는 두고 나머지만 |

**stash 대상 범위**

```
기본  →  추적 중인 파일의 변경만
-u    →  + 새 파일          ← 대부분 이것
-a    →  + 무시된 파일까지  ⚠️
```

**cherry-pick**

| 명령 | 하는 일 |
|---|---|
| `git cherry-pick <해시>` | 그 커밋을 현재 브랜치로 복사 |
| `git cherry-pick A..B` | 범위로 (A 제외) |
| `git cherry-pick -x <해시>` | **출처 기록** (권장) |
| `git cherry-pick -n <해시>` | 적용만, 커밋 안 함 |
| `git cherry-pick -m 1 <머지커밋>` | 머지 커밋 가져오기 |
| `git cherry-pick --continue` | 충돌 해결 후 계속 |
| `git cherry-pick --abort` | 취소 |

**cherry-pick 판단 기준**

```
커밋 하나만 필요       →  cherry-pick
브랜치 전체가 필요     →  merge 또는 rebase
자주 필요하다면        →  브랜치 전략을 다시 검토 (13강)
```

**오늘 반드시 기억할 한 가지**
> **`git stash` 에는 항상 `-u -m "설명"` 을 붙이세요.**
> 새 파일이 빠지는 사고와, 며칠 뒤 뭐가 뭔지 모르는 사고를 동시에 막습니다.

**과제**
1. 새 파일을 포함한 작업 중간에 `git stash -u -m` 으로 보관하고, 다른 브랜치에서 급한 수정을 한 뒤 `pop` 으로 복귀하세요.
2. `-u` 없이 stash했을 때 새 파일이 남는 것을 직접 확인하세요.
3. stash를 두 개 만들고 `stash@{1}` 을 `apply` 로 적용한 뒤 `drop` 으로 정리하세요.
4. `git stash branch` 로 stash에서 브랜치를 만들어 보세요.
5. 브랜치의 커밋 하나를 `git cherry-pick -x` 로 `main` 에 가져오고, **해시가 달라진 것**과 메시지에 출처가 남은 것을 확인하세요.
6. cherry-pick 충돌을 일부러 만들어 `--continue` 와 `--abort` 를 모두 써 보세요.

---

[← 이전 15강](lesson-15.md) · [목차](README.md) · [다음 → 17강 안전하게 되돌리기](lesson-17.md)
