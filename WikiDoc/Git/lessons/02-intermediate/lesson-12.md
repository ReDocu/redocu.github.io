# 12강 · merge vs rebase

> **Git 학습 매뉴얼** · 🟡 중급 · **12강 / 30**
> [← 이전 11강](lesson-11.md) · [목차](README.md) · [다음 → 13강 브랜치 전략](lesson-13.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `merge` 와 `rebase` 가 만드는 히스토리의 차이를 그림으로 그려 설명할 수 있다.
- `git rebase` 로 브랜치를 최신 `main` 위로 옮길 수 있다.
- rebase 중 충돌을 해결하고 `--continue` / `--skip` / `--abort` 를 구분해 쓸 수 있다.
- **rebase의 황금률**을 알고 언제 쓰면 안 되는지 판단할 수 있다.
- `git pull --rebase` 로 불필요한 머지 커밋을 없앨 수 있다.

---

## ② 왜 필요한가

[11강](lesson-11.md)에서 병합을 마치고 이력을 봤을 때 이런 모양이었습니다.

```
*   3a9f2c1 Merge branch 'feature/emoji'
|\
| * 8e2c4f7 feat: 목록 표시를 이모지로 변경
* | d7f1a93 feat: 목록 표시를 텍스트 라벨로 변경
|/
* b3e8d24 feat: 할 일 목록 출력 기능 구현
```

브랜치 하나에서는 볼 만합니다. 그런데 **팀이 5명이고 매일 pull 하면** 이렇게 됩니다.

```
*   5f1a9c3 Merge branch 'main' of github.com:team/project
|\
| *   9d2e7b4 Merge branch 'main' of github.com:team/project
| |\
* | | 7c3f8a1 fix: 오타
| |/
|/|
| * 2b9d4e6 Merge pull request #42
| |\
...  (읽을 수 없음)
```

**"이 기능이 언제 들어왔지?"** 를 추적할 수 없습니다. `git log` 의 절반이 `Merge branch 'main'` 이 됩니다.

`rebase` 는 이 문제를 **이력을 일직선으로 만들어** 해결합니다. 대신 **커밋을 다시 쓴다**는 대가가 따르고, 여기에 Git에서 가장 유명한 규칙 — **황금률** — 이 붙습니다.

오늘 배우는 것은 명령 하나가 아니라 **"우리 팀의 이력을 어떤 모양으로 남길 것인가"** 라는 선택입니다.

---

## ③ 개념 설명

### 같은 상황, 두 가지 결과

출발점은 같습니다.

```
              ┌──▶ X ──▶ Y     ← feature
   A ──▶ B ──▶ C
              └──▶ D ──▶ E     ← main
```

**① merge — 합치는 지점을 만든다**

```bash
git switch main
git merge feature
```

```
              ┌──▶ X ──▶ Y ────┐
   A ──▶ B ──▶ C               ├──▶ M     ← main
              └──▶ D ──▶ E ────┘
```

- 원래 커밋(`X`, `Y`)이 **그대로 보존**됩니다. 해시도 그대로입니다.
- **"언제 갈라져서 언제 합쳤는지"** 가 기록에 남습니다.
- 대신 이력이 **가지 모양**이 됩니다.

**② rebase — 뿌리를 옮겨 심는다**

```bash
git switch feature
git rebase main
```

```
   A ──▶ B ──▶ C ──▶ D ──▶ E ──▶ X' ──▶ Y'     ← feature
                              ▲
                            main
```

- `X`, `Y` 를 떼어 내 **`E` 뒤에 다시 붙였습니다.**
- 내용은 같지만 **부모가 달라졌으므로 해시가 바뀝니다** (`X` → `X'`).
- 이력이 **일직선**이 됩니다.

> 🔑 **rebase = re + base.** 브랜치의 **베이스(출발점)를 다시 정하는 것**입니다.
> `C` 에서 갈라졌던 것을 마치 `E` 에서 갈라진 것처럼 만듭니다.

### rebase가 실제로 하는 일

```
① feature 의 커밋들(X, Y)을 패치로 떼어 임시 보관
② feature 를 main 위치(E)로 이동
③ 보관해 둔 패치를 하나씩 다시 적용  →  X', Y'
④ 각 단계에서 충돌이 나면 멈추고 물어봄
```

**③이 중요합니다.** 커밋을 **하나씩** 다시 적용하므로, 충돌도 **커밋마다** 날 수 있습니다. 커밋이 5개면 최대 5번 멈춥니다.

### 비교표

| | `merge` | `rebase` |
|---|---|---|
| 기존 커밋 | **보존** (해시 유지) | **다시 씀** (해시 변경) |
| 이력 모양 | 가지 | **일직선** |
| 머지 커밋 | 생김 | 안 생김 |
| 갈라진 기록 | 남음 | **사라짐** |
| 충돌 처리 | **한 번** | 커밋마다 (여러 번 가능) |
| 안전성 | **항상 안전** | 공유 브랜치엔 위험 |
| push 후 사용 | ✅ | ❌ |

### 황금률

> ## **이미 공유한(push한) 브랜치는 rebase 하지 않는다.**

이유는 [07강](lesson-07.md)의 `--amend` 와 같습니다. **해시가 바뀌기 때문**입니다.

```
GitHub:     A ─ B ─ C ─ X ─ Y        (팀원이 이걸 받아 감)

내가 rebase 후 강제 push →

GitHub:     A ─ B ─ C ─ D ─ E ─ X' ─ Y'

팀원의 로컬: A ─ B ─ C ─ X ─ Y ─ (팀원이 추가한 Z)
             → X, Y 가 사라진 이력과 만나서 대혼란
             → 팀원이 pull 하면 X, Y 가 중복으로 되살아남
```

**혼자 쓰는 브랜치면 push한 뒤라도 rebase해도 됩니다.** 문제가 되는 것은 **남이 그 브랜치를 받아 갔을 때**입니다.

**실무 판단 기준**

| 브랜치 | rebase 해도 되나 |
|---|---|
| 아직 push 안 한 내 브랜치 | ✅ 마음껏 |
| push했지만 **나만 쓰는** feature 브랜치 | ✅ (`--force-with-lease` 로 push) |
| 팀원과 **같이 쓰는** 브랜치 | ❌ 절대 금지 |
| **`main`, `develop`** 등 공용 브랜치 | ❌ 절대 금지 |

### 실무에서 가장 많이 쓰는 조합

```bash
# ① 작업 중: main 의 최신 내용을 내 브랜치로 가져오기
git switch feature/my-work
git fetch
git rebase origin/main          # 내 커밋을 최신 main 위로 옮김

# ② 완료 후: main 에 합치기
git switch main
git merge feature/my-work       # 일직선이므로 fast-forward
```

**"내 브랜치를 최신으로 유지할 땐 rebase, 최종 통합은 merge"** 가 널리 쓰이는 형태입니다.
이때 ①에서 `git merge main` 을 쓰면 머지 커밋이 브랜치 안에 잔뜩 쌓입니다. rebase가 깔끔한 이유입니다.

### `git pull --rebase`

`git pull` 은 사실 `fetch + merge` 입니다. 그래서 내 로컬에 커밋이 있으면 **매번 머지 커밋**이 생깁니다.

```
git pull            =  git fetch + git merge origin/main     → 머지 커밋 발생
git pull --rebase   =  git fetch + git rebase origin/main    → 일직선 유지
```

항상 이렇게 하려면:

```bash
git config --global pull.rebase true
```

> **초급에서 "머지 커밋이 잔뜩 생겨요" 하던 문제([09강](lesson-09.md))의 정답이 이것입니다.**
> `origin/main` 을 rebase하는 것은 **황금률 위반이 아닙니다.** 다시 쓰이는 것은 아직 push하지 않은 **내 로컬 커밋**뿐이기 때문입니다.

### rebase 중에는 ours/theirs가 뒤집힙니다

[11강](lesson-11.md)에서 예고한 부분입니다.

| | ours | theirs |
|---|---|---|
| `git merge` | 현재 브랜치 | 합쳐 오는 브랜치 |
| **`git rebase`** | **베이스(main)** | **내가 옮기는 커밋** |

**왜 뒤집히나** — rebase는 `main` 위에 서서 내 커밋을 하나씩 **가져와 적용**합니다. 그래서 Git 입장에서 "현재 위치(ours)"는 `main` 이고, "적용하려는 것(theirs)"이 내 커밋입니다.

> 혼란을 피하는 가장 확실한 방법은 **마커에 적힌 브랜치명을 읽는 것**입니다. `--ours` / `--theirs` 를 기계적으로 쓰지 마세요.

---

## ④ 단계별 실습

### Step 1. 같은 상황을 두 번 만들어 비교하기

먼저 **merge 방식**부터 봅니다.

```bash
cd ~/Desktop/todo-app
git switch main
git pull
```

**① feature 브랜치에서 작업**

```bash
git switch -c feature/priority
```

`todo.py` 의 `add()` 함수를 고칩니다.

```python
def add(text, priority="보통"):
    todos = load()
    todos.append({"text": text, "done": False, "priority": priority})
    save(todos)
    print(f"추가됨: {text} (우선순위: {priority})")
```

```bash
git add todo.py
git commit -m "feat: 할 일에 우선순위 필드 추가"

echo "- 우선순위: 높음 / 보통 / 낮음" >> README.md
git add README.md
git commit -m "docs: 우선순위 설명 추가"
```

**② 그 사이 main 도 움직였다고 가정**

```bash
git switch main
echo "# 개발 메모" > NOTES.md
git add NOTES.md
git commit -m "docs: 개발 메모 파일 추가"
```

지금 그래프를 봅니다.

```bash
git log --oneline --graph --all -6
```

실행 결과:

```
* c4a8f21 (HEAD -> main) docs: 개발 메모 파일 추가
| * 6d3b9e5 (feature/priority) docs: 우선순위 설명 추가
| * 2f7c1a8 feat: 할 일에 우선순위 필드 추가
|/
* 3a9f2c1 (origin/main) Merge branch 'feature/emoji'
```

**갈라져 있습니다.** 이 상태를 **저장해 두고** 두 방식을 각각 시험해 보겠습니다.

```bash
git branch backup-merge feature/priority     # 나중을 위해 표시만 해 둠
```

### Step 2. merge 방식으로 합쳐 보기

```bash
git switch main
git merge feature/priority
```

편집기가 열리면 그대로 저장합니다.

실행 결과:

```
Merge made by the 'ort' strategy.
 README.md | 1 +
 todo.py   | 6 +++---
 2 files changed, 4 insertions(+), 3 deletions(-)
```

```bash
git log --oneline --graph -6
```

실행 결과:

```
*   9b2e7f4 (HEAD -> main) Merge branch 'feature/priority'
|\
| * 6d3b9e5 (feature/priority) docs: 우선순위 설명 추가
| * 2f7c1a8 feat: 할 일에 우선순위 필드 추가
* | c4a8f21 docs: 개발 메모 파일 추가
|/
* 3a9f2c1 (origin/main) Merge branch 'feature/emoji'
```

**가지가 생겼습니다.** 갈라진 사실이 그대로 기록됐습니다.

### Step 3. 되돌려서 rebase 방식으로 다시 하기

방금 병합을 취소하고 같은 상황을 재현합니다.

```bash
git reset --hard c4a8f21        # 병합 직전으로 (본인 화면의 해시를 쓰세요)
git log --oneline --graph --all -5
```

갈라진 상태로 돌아왔는지 확인합니다.

**이번엔 rebase 입니다. 중요한 것은 — 브랜치 쪽에서 실행합니다.**

```bash
git switch feature/priority
git rebase main
```

실행 결과:

```
Successfully rebased and updated refs/heads/feature/priority.
```

```bash
git log --oneline --graph --all -6
```

실행 결과:

```
* 8f4d2c9 (HEAD -> feature/priority) docs: 우선순위 설명 추가
* 1a7e5b3 feat: 할 일에 우선순위 필드 추가
* c4a8f21 (main) docs: 개발 메모 파일 추가
* 3a9f2c1 (origin/main) Merge branch 'feature/emoji'
```

**일직선입니다.** 그리고 해시를 비교해 보세요.

| 커밋 | rebase 전 | rebase 후 |
|---|---|---|
| feat: 우선순위 필드 추가 | `2f7c1a8` | **`1a7e5b3`** |
| docs: 우선순위 설명 추가 | `6d3b9e5` | **`8f4d2c9`** |

> **내용은 같지만 완전히 다른 커밋이 됐습니다.** 부모가 달라졌기 때문입니다.
> 이것이 황금률의 이유입니다.

**이제 main 에 합칩니다.**

```bash
git switch main
git merge feature/priority
```

실행 결과:

```
Updating c4a8f21..8f4d2c9
Fast-forward
 README.md | 1 +
 todo.py   | 6 +++---
 2 files changed, 4 insertions(+), 3 deletions(-)
```

**`Fast-forward` 입니다.** rebase로 일직선을 만들어 뒀으니 머지 커밋이 필요 없습니다.

```bash
git log --oneline --graph -5
```

실행 결과:

```
* 8f4d2c9 (HEAD -> main, feature/priority) docs: 우선순위 설명 추가
* 1a7e5b3 feat: 할 일에 우선순위 필드 추가
* c4a8f21 docs: 개발 메모 파일 추가
* 3a9f2c1 (origin/main) Merge branch 'feature/emoji'
```

**두 방식의 결과를 나란히 놓고 보세요.**

```
merge                                 rebase + merge
─────────────────────────             ─────────────────────
*   Merge branch 'feature'            * docs: 우선순위 설명 추가
|\                                    * feat: 우선순위 필드 추가
| * docs: 우선순위 설명 추가            * docs: 개발 메모 파일 추가
| * feat: 우선순위 필드 추가            * Merge branch 'feature/emoji'
* | docs: 개발 메모 파일 추가
|/
* Merge branch 'feature/emoji'
```

정리합니다.

```bash
git branch -d feature/priority
git branch -D backup-merge
git push
```

### Step 4. rebase 중 충돌 처리하기

rebase의 진짜 관문입니다. 충돌을 일부러 만듭니다.

**① 브랜치에서 작업**

```bash
git switch -c feature/message
```

`todo.py` 의 `add()` 함수 마지막 줄을 고칩니다.

```python
    print(f"[추가] {text}")
```

```bash
git add todo.py
git commit -m "feat: 추가 메시지 형식 변경"
```

**② main 에서 같은 줄을 다르게**

```bash
git switch main
```

같은 줄을 이렇게 고칩니다.

```python
    print(f"할 일이 등록되었습니다: {text}")
```

```bash
git add todo.py
git commit -m "feat: 추가 메시지를 친절하게 변경"
```

**③ rebase 시도**

```bash
git switch feature/message
git rebase main
```

실행 결과:

```
Auto-merging todo.py
CONFLICT (content): Merge conflict in todo.py
error: could not apply 5c9a2f7... feat: 추가 메시지 형식 변경
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply 5c9a2f7... feat: 추가 메시지 형식 변경
```

**hint에 선택지 세 개가 다 적혀 있습니다.** Git의 안내는 항상 끝까지 읽으세요.

```bash
git status
```

실행 결과:

```
interactive rebase in progress; onto 7e3d9a1
Last command done (1 command done):
   pick 5c9a2f7 feat: 추가 메시지 형식 변경
No commands remaining.
You are currently rebasing branch 'feature/message' on '7e3d9a1'.
  (fix conflicts and then run "git rebase --continue")
  (use "git rebase --skip" to skip this patch)
  (use "git rebase --abort" to check out the original branch)

Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   todo.py
```

**④ 마커 확인 — 여기가 헷갈리는 지점입니다**

파일을 열어 봅니다.

```python
<<<<<<< HEAD
    print(f"할 일이 등록되었습니다: {text}")
||||||| parent of 5c9a2f7 (feat: 추가 메시지 형식 변경)
    print(f"추가됨: {text} (우선순위: {priority})")
=======
    print(f"[추가] {text}")
>>>>>>> 5c9a2f7 (feat: 추가 메시지 형식 변경)
```

> ⚠️ **`HEAD` 가 `main` 쪽입니다.**
> merge에서는 `HEAD` 가 내 브랜치였지만, rebase에서는 **베이스(main)** 입니다. 내 커밋이 아래쪽에 있습니다.
> 그래서 `>>>>>>>` 옆에 브랜치명 대신 **커밋 해시와 메시지**가 붙습니다.

**⑤ 해결하고 계속**

두 문구를 합칩니다.

```python
    print(f"[추가] 할 일이 등록되었습니다: {text}")
```

```bash
git add todo.py
git rebase --continue
```

편집기가 열려 커밋 메시지를 확인시켜 줍니다. 그대로 저장하고 닫습니다.

실행 결과:

```
[detached HEAD 3b8e1d4] feat: 추가 메시지 형식 변경
 1 file changed, 1 insertion(+), 1 deletion(-)
Successfully rebased and updated refs/heads/feature/message.
```

> `detached HEAD` 라는 표시가 보이지만 **정상입니다.** rebase 중에는 임시로 그 상태가 되고, 끝나면 브랜치가 새 위치에 붙습니다.

```bash
git switch main
git merge feature/message
git branch -d feature/message
git push
```

**세 가지 선택지 정리**

| 명령 | 언제 |
|---|---|
| `git rebase --continue` | 충돌을 해결했다. 다음 커밋으로 진행 |
| `git rebase --skip` | **이 커밋을 통째로 버린다** (이미 main에 같은 내용이 있을 때) |
| `git rebase --abort` | 전부 취소하고 rebase 전으로 |

> `--skip` 은 조심하세요. **그 커밋의 변경이 통째로 사라집니다.** 정말 필요 없는 경우에만 씁니다.

### Step 5. `git pull --rebase` 체험하기

머지 커밋이 생기는 상황과 안 생기는 상황을 비교합니다.

**① 팀원이 push**

```bash
cd ~/Desktop/todo-app-teammate
git pull
echo "팀원이 추가한 줄" >> NOTES.md
git add NOTES.md
git commit -m "docs: 팀원 메모 추가"
git push
```

**② 나도 로컬에 커밋이 있는 상태**

```bash
cd ~/Desktop/todo-app
echo "내가 추가한 줄" >> README.md
git add README.md
git commit -m "docs: 내 메모 추가"
```

**③ 그냥 pull 하면**

```bash
git pull
```

실행 결과:

```
Merge made by the 'ort' strategy.
 NOTES.md | 1 +
 1 file changed, 1 insertion(+)
```

```bash
git log --oneline --graph -4
```

실행 결과:

```
*   2d9f4b1 (HEAD -> main) Merge branch 'main' of https://github.com/hong-gildong/todo-app
|\
| * 6a1c8e3 (origin/main) docs: 팀원 메모 추가
* | f7b2d5a docs: 내 메모 추가
|/
* 3b8e1d4 feat: 추가 메시지 형식 변경
```

**`Merge branch 'main' of ...`** — 아무 의미 없는 머지 커밋입니다. 이게 쌓이면 ②에서 본 그 지저분한 이력이 됩니다.

**④ rebase 방식으로 되돌려 다시**

```bash
git reset --hard f7b2d5a        # 머지 직전으로 (본인 해시)
git pull --rebase
```

실행 결과:

```
Successfully rebased and updated refs/heads/main.
```

```bash
git log --oneline --graph -4
```

실행 결과:

```
* 9c3e7a2 (HEAD -> main) docs: 내 메모 추가
* 6a1c8e3 (origin/main) docs: 팀원 메모 추가
* 3b8e1d4 feat: 추가 메시지 형식 변경
* 8f4d2c9 docs: 우선순위 설명 추가
```

**일직선입니다.** 내 커밋이 팀원 커밋 뒤로 옮겨졌습니다.

기본값으로 설정해 둡니다.

```bash
git config --global pull.rebase true
git push
```

### Step 6. rebase 후 push — `--force-with-lease`

이미 push한 **내 개인 브랜치**를 rebase하면 push가 거부됩니다.

```bash
git switch -c feature/cleanup
echo "정리 작업" > CLEANUP.md
git add CLEANUP.md
git commit -m "chore: 정리 파일 추가"
git push -u origin feature/cleanup
```

이제 `main` 이 앞서 나갔다고 가정하고 rebase합니다.

```bash
git rebase main
git push
```

실행 결과:

```
To https://github.com/hong-gildong/todo-app.git
 ! [rejected]        feature/cleanup -> feature/cleanup (non-fast-forward)
error: failed to push some refs to 'https://github.com/hong-gildong/todo-app.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart.
```

**당연합니다.** 해시가 바뀌었으니 원격과 이력이 어긋납니다.

```bash
git push --force-with-lease
```

실행 결과:

```
To https://github.com/hong-gildong/todo-app.git
 + 5e2a9c1...4d8f2a1 feature/cleanup -> feature/cleanup (forced update)
```

> 🔑 **`--force` 가 아니라 `--force-with-lease` 를 쓰세요.**
>
> | | 동작 |
> |---|---|
> | `--force` | **무조건** 덮어씀. 그 사이 남이 올린 커밋도 날아감 |
> | `--force-with-lease` | 내가 마지막으로 본 상태와 **원격이 같을 때만** 덮어씀. 달라졌으면 거부 |
>
> `--force-with-lease` 는 "내가 모르는 변경이 있으면 멈춰 줘" 라는 안전장치입니다.
> **`--force` 는 앞으로도 쓸 일이 거의 없습니다.**

정리합니다.

```bash
git switch main
git merge feature/cleanup
git push
git branch -d feature/cleanup
git push origin --delete feature/cleanup
```

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code |
|---|---|
| pull을 rebase로 | `Ctrl+,` → `git.rebaseWhenSync` 체크, 또는 `pull.rebase` 설정 |
| rebase 실행 | `Ctrl+Shift+P` → `Git: Rebase Branch...` |
| rebase 중 충돌 | 11강과 동일한 Merge Editor |
| 그래프로 확인 | **Git Graph** 확장 → 브랜치 우클릭 → `Rebase current branch on this Branch` |

> **Git Graph 확장**이 특히 유용합니다. rebase 전후 그래프 변화가 눈에 바로 보여서, 이 강의 내용을 이해하는 데 큰 도움이 됩니다.

---

## ⑤ 자주 하는 실수

### 방향을 반대로 실행

```bash
git switch main
git rebase feature/x      # ❌ main 의 커밋들이 다시 쓰임!
```

**원인** — `git rebase <대상>` 은 **"현재 브랜치를 <대상> 위로 옮긴다"** 는 뜻입니다. `main` 에서 실행하면 `main` 이 다시 쓰입니다.
**증상** — 공용 브랜치의 이력이 통째로 바뀌어 팀 전체가 영향을 받습니다.
**해결** —

```bash
git rebase --abort            # 진행 중이면
git reset --hard origin/main  # 이미 끝났다면 원격 상태로 복구
```

**외우는 법**
> **rebase는 항상 "옮겨질 쪽"에서 실행합니다.**
> `feature` 를 옮기고 싶으면 `feature` 에서 `git rebase main`.

### 공유 브랜치를 rebase하고 강제 push

**증상** — 팀원이 `git pull` 하면 이런 일이 벌어집니다.

- 사라진 줄 알았던 커밋이 **중복으로 되살아납니다**
- 이상한 충돌이 대량으로 납니다
- 팀원이 그 사이 만든 커밋이 사라질 수 있습니다

**해결** — 사고가 났다면 **즉시 팀에 알리세요.** 조용히 넘어가면 피해가 커집니다.

```bash
# 원래 이력을 아는 사람이 있다면 복구 가능
git reflog                          # 이전 위치 찾기
git reset --hard <원래 해시>
git push --force-with-lease
```

**예방** — GitHub의 **브랜치 보호 규칙**으로 `main` 에 대한 force push를 아예 막을 수 있습니다. [27강](lesson-27.md)에서 다룹니다.

### rebase 도중 방치

```bash
git rebase main
# 충돌 발생 → 다른 일을 하러 감 → 잊음
```

**증상** — 나중에 `git status` 를 치면 이런 게 나옵니다.

```
interactive rebase in progress; onto 7e3d9a1
```

브랜치 이름 대신 이상한 상태가 표시되고, 커밋도 브랜치 전환도 안 됩니다.

**해결** — 마무리하거나 취소하세요.

```bash
git rebase --continue     # 해결했다면
git rebase --abort        # 없던 일로
```

> **`git status` 는 항상 지금 무슨 작업이 진행 중인지 알려 줍니다.** 이상하면 일단 `git status`.

### 충돌이 커밋마다 반복돼서 지침

**원인** — rebase는 커밋을 **하나씩** 다시 적용합니다. 같은 파일을 여러 커밋에서 고쳤다면 매번 충돌합니다.
**해결** — 두 가지 방법이 있습니다.

```bash
git config --global rerere.enabled true   # ① 같은 충돌은 자동 재사용 (11강)
```

② 커밋 수가 많고 충돌이 심하면 **merge가 나은 선택**입니다. 충돌을 한 번만 해결하면 됩니다.

> **rebase를 신념처럼 쓰지 마세요.** 도구일 뿐입니다. 상황에 따라 merge가 정답입니다.

### `--skip` 을 잘못 써서 작업이 사라짐

**원인** — 충돌이 짜증나서 `--skip` 을 눌렀습니다. 그 커밋의 변경이 **통째로 버려집니다.**
**해결** —

```bash
git reflog                    # rebase 전 위치 찾기
git reset --hard <해시>        # 되돌리고 다시 시도
```

**`--skip` 은 "이 커밋은 이미 반영돼 있어서 필요 없다"가 확실할 때만** 쓰세요.

### rebase 후 `git push` 만 계속 시도

```
! [rejected] ... (non-fast-forward)
```

**원인** — rebase로 해시가 바뀌었으니 일반 push는 영원히 거부됩니다.
**해결** — 내 개인 브랜치인지 확인한 뒤:

```bash
git push --force-with-lease
```

⚠️ **`git pull` 을 하면 절대 안 됩니다.** rebase로 정리한 이력에 옛날 커밋이 다시 합쳐져서 **중복 커밋**이 생깁니다.

### `--force-with-lease` 도 거부됨

```
! [rejected]        feature/x -> feature/x (stale info)
```

**원인** — 그 사이 원격이 바뀌었습니다. **안전장치가 정상 작동한 것입니다.**
**해결** — 무엇이 바뀌었는지 먼저 확인하세요.

```bash
git fetch
git log --oneline HEAD..origin/feature/x    # 원격에만 있는 커밋
```

- 남의 커밋이라면 → **덮어쓰면 안 됩니다.** 상의하세요.
- 내가 다른 기기에서 올린 것이라면 → 확인 후 다시 `--force-with-lease`

---

## ⑥ 확인 문제

**1.** 아래 상황에서 `git rebase` 를 **어느 브랜치에서** 실행해야 할까요? 그리고 결과 그래프를 그려 보세요.

```
              ┌──▶ X ──▶ Y     ← feature/login
   A ──▶ B ──▶ C
              └──▶ D           ← main
```

<details>
<summary>답 보기</summary>

**`feature/login` 에서 실행합니다.**

```bash
git switch feature/login
git rebase main
```

**결과**

```
   A ──▶ B ──▶ C ──▶ D ──▶ X' ──▶ Y'     ← feature/login
                     ▲
                   main
```

`X`, `Y` 가 `D` 뒤로 옮겨졌고 **해시가 바뀌었습니다**(`X'`, `Y'`).

**반대로 하면 안 되는 이유**

```bash
git switch main
git rebase feature/login      # ❌
```

이러면 `main` 의 커밋 `D` 가 다시 쓰이면서 `main` 이 `Y` 뒤로 옮겨집니다. **공용 브랜치의 이력이 바뀌므로 황금률 위반**입니다.

**외우는 문장**
> `git rebase <대상>` = **"지금 있는 브랜치를 <대상> 위로 옮겨라"**
> 그러니 **옮겨질 쪽(feature)에 서서** 실행합니다.

**이어서 할 일**

```bash
git switch main
git merge feature/login       # 일직선이므로 fast-forward
```
</details>

**2.** `git merge` 와 `git rebase` 중 무엇을 쓸지 아래 각 상황에서 골라 보세요.

```
ⓐ 내 feature 브랜치에 main 의 최신 변경을 가져오고 싶다 (아직 push 안 함)
ⓑ 완성된 feature 브랜치를 main 에 합친다
ⓒ 팀원과 함께 쓰는 develop 브랜치를 최신화한다
ⓓ git pull 을 할 때
```

<details>
<summary>답 보기</summary>

| 상황 | 선택 | 이유 |
|---|---|---|
| ⓐ | **rebase** | 내 커밋만 다시 쓰이므로 안전. 이력이 일직선으로 깔끔 |
| ⓑ | **merge** | 원본 커밋 보존. `--no-ff` 로 "기능이 합쳐졌다"는 기록을 남기기도 함 |
| ⓒ | **merge** | 🚨 **공유 브랜치는 rebase 금지** (황금률) |
| ⓓ | **rebase** | `git pull --rebase`. 다시 쓰이는 건 아직 push 안 한 내 커밋뿐 |

**ⓐ 명령**

```bash
git switch feature/x
git fetch
git rebase origin/main
```

**ⓑ 명령** — 팀 정책에 따라 갈립니다.

```bash
git merge feature/x              # fast-forward 가능하면 일직선
git merge --no-ff feature/x      # 항상 머지 커밋 (기능 단위가 그래프에 남음)
```

[13강](lesson-13.md)·[14강](lesson-14.md)에서 팀 정책과 함께 다시 다룹니다.

**ⓒ 가 핵심입니다.** "일직선이 예쁘니까" 라는 이유로 공유 브랜치를 rebase하면 팀 전체가 피해를 봅니다. **미관보다 안전이 우선입니다.**
</details>

**3.** 팀원이 이렇게 말합니다. **"rebase가 이력이 깔끔하니까 우리 팀은 merge를 아예 쓰지 말자."** 어떻게 답하시겠습니까?

<details>
<summary>답 보기</summary>

**부분적으로만 맞습니다.** 두 가지를 짚어야 합니다.

**① rebase로 대체할 수 없는 경우가 있습니다**

- **공유 브랜치** (`main`, `develop`) — 황금률 위반입니다. 대안이 없습니다.
- **이미 여러 사람이 받아 간 feature 브랜치** — 같은 이유입니다.
- **충돌이 심한 긴 브랜치** — rebase는 커밋마다 충돌합니다. merge는 한 번이면 끝납니다.

**② "깔끔함"에는 대가가 있습니다**

| rebase가 잃는 것 | 설명 |
|---|---|
| 갈라진 시점 | 언제 브랜치를 팠는지 기록이 사라집니다 |
| 실제 작업 순서 | 커밋 날짜와 이력 순서가 어긋날 수 있습니다 |
| 원본 커밋 | 해시가 바뀌어 예전 참조(이슈·리뷰 링크)가 끊깁니다 |

**실무에서 널리 쓰이는 절충안**

```bash
# 작업 중: 내 브랜치를 최신으로 → rebase
git switch feature/x
git rebase origin/main

# 통합: main 에 합칠 때 → merge
git switch main
git merge --no-ff feature/x
```

이러면 **브랜치 내부는 일직선으로 깔끔하고**, `main` 에는 **"이 기능이 여기서 합쳐졌다"** 는 기록이 머지 커밋으로 남습니다. 양쪽의 장점을 취하는 방식입니다.

**결론**
> "무엇을 쓸까"보다 **"팀이 같은 규칙을 쓰는가"** 가 훨씬 중요합니다.
> 정하고 문서화하고 CI로 강제하는 것이 정답입니다. [13강](lesson-13.md)에서 그 규칙을 다룹니다.
</details>

---

## 오늘의 정리

| 명령 | 하는 일 |
|---|---|
| `git rebase <대상>` | **현재 브랜치**를 `<대상>` 위로 옮김 |
| `git rebase --continue` | 충돌 해결 후 계속 |
| `git rebase --skip` | 이 커밋 버리고 계속 ⚠️ |
| `git rebase --abort` | 전부 취소 |
| `git pull --rebase` | 머지 커밋 없이 당겨 오기 |
| `git push --force-with-lease` | rebase 후 안전하게 push |
| `git merge --no-ff` | 항상 머지 커밋 생성 |

**설정 (권장)**

```bash
git config --global pull.rebase true       # pull 은 항상 rebase
git config --global rerere.enabled true    # 같은 충돌 재사용
```

**핵심 비교**

| | merge | rebase |
|---|---|---|
| 커밋 | 보존 | **다시 씀 (해시 변경)** |
| 이력 | 가지 | 일직선 |
| 충돌 | 한 번 | 커밋마다 |
| 공유 브랜치 | ✅ | 🚨 **금지** |

**황금률**

> **이미 공유한(남이 받아 간) 브랜치는 rebase 하지 않는다.**

**실무 조합**

```
작업 중  →  git rebase origin/main    (내 브랜치를 최신으로)
통합     →  git merge feature/x       (main 에 합치기)
```

**오늘 반드시 기억할 한 가지**
> **rebase는 옮겨질 쪽(feature)에서 실행합니다.**
> 그리고 rebase 후 push는 **`--force` 가 아니라 `--force-with-lease`** 입니다.

**과제**
1. 같은 상황을 만들어 놓고 `merge` 로 한 번, `reset --hard` 로 되돌린 뒤 `rebase` 로 한 번 합쳐서 `git log --graph` 결과를 나란히 비교하세요.
2. rebase 중 충돌을 일부러 만들고, `HEAD` 가 **main 쪽**이라는 것을 마커에서 확인하세요.
3. `git pull` 과 `git pull --rebase` 를 각각 실행해 머지 커밋이 생기는지 비교하고, `pull.rebase true` 를 설정하세요.
4. push한 개인 브랜치를 rebase한 뒤 `--force-with-lease` 로 올려 보세요.
5. `git rebase --abort` 를 한 번 실행해 원상 복구되는 것을 확인하세요.

---

[← 이전 11강](lesson-11.md) · [목차](README.md) · [다음 → 13강 브랜치 전략](lesson-13.md)
