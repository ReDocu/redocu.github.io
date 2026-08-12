# 07강 · 되돌리기 기초

> **Git 학습 매뉴얼** · 🟢 초급 · **07강 / 30**
> [← 이전 06강](lesson-06.md) · [목차](README.md) · [다음 → 08강 브랜치 만들고 합치기](lesson-08.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 작업 디렉터리의 수정을 취소할 수 있다 (`git restore`).
- 스테이지에 잘못 담은 파일을 뺄 수 있다 (`git restore --staged`).
- 마지막 커밋의 메시지를 고치거나 파일을 추가할 수 있다 (`git commit --amend`).
- 마지막 커밋 자체를 취소할 수 있다 (`git reset`).
- **되돌릴 수 있는 것과 없는 것**을 구분해 위험한 명령을 조심할 수 있다.

---

## ② 왜 필요한가

Git을 쓰는 진짜 이유가 오늘 나옵니다. **되돌릴 수 있다는 것.**

초보자가 가장 많이 하는 질문 다섯 개입니다.

1. "파일을 엉망으로 고쳤어요. 마지막 커밋 상태로 돌아가고 싶어요."
2. "`git add` 를 잘못했어요. 빼고 싶어요."
3. "커밋 메시지에 오타가 났어요."
4. "커밋할 때 파일 하나를 빠뜨렸어요."
5. "방금 한 커밋 자체를 없던 일로 하고 싶어요."

다섯 개 모두 **명령 한 줄**로 해결됩니다. 문제는 **다섯 개가 서로 다른 명령**이라는 것입니다. 상황을 구분하지 못하면 엉뚱한 명령을 쓰게 되고, 그중 일부는 **되돌릴 수 없는 손실**을 냅니다.

그래서 오늘은 **"상황 → 명령" 대처표**를 만드는 것이 목표입니다. 이 표 하나면 초급 수준의 사고는 거의 다 수습됩니다.

---

## ③ 개념 설명

### 상황별 대처표 (오늘의 핵심)

이 표를 외우기보다 **책갈피해 두고 필요할 때 찾아 쓰세요.**

| # | 상황 | 명령 | 위험도 |
|---|---|---|---|
| 1 | 파일을 고쳤는데 **되돌리고 싶다** (add 전) | `git restore <파일>` | ⚠️ **작업 소실** |
| 2 | **`add` 를 취소**하고 싶다 (커밋 전) | `git restore --staged <파일>` | 안전 |
| 3 | 커밋 **메시지만** 고치고 싶다 | `git commit --amend -m "새 메시지"` | 조건부 ⚠️ |
| 4 | 커밋에 **파일을 빠뜨렸다** | `git add <파일>` → `git commit --amend --no-edit` | 조건부 ⚠️ |
| 5 | 마지막 커밋을 **취소**하고 작업은 남기고 싶다 | `git reset --soft HEAD~1` | 안전 |
| 6 | 마지막 커밋을 취소하고 **add도 풀고** 싶다 | `git reset HEAD~1` | 안전 |
| 7 | 마지막 커밋을 **작업까지 통째로 없애고** 싶다 | `git reset --hard HEAD~1` | 🚨 **매우 위험** |
| 8 | 실수로 **지운 파일**을 되살리고 싶다 | `git restore <파일>` | 안전 |
| 9 | **옛날 시점의 파일**로 되돌리고 싶다 | `git restore --source=HEAD~3 <파일>` | ⚠️ 현재 내용 소실 |

**조건부 ⚠️ 의 뜻** — `--amend` 와 `reset` 은 **이미 push한 커밋에 쓰면 안 됩니다.** 아래 "황금률"에서 설명합니다.

### 세 공간으로 다시 보기

[03강](lesson-03.md)의 그림에 되돌리기 명령을 얹으면 이렇게 됩니다.

```
  작업 디렉터리         스테이지            저장소(HEAD)
       │                  │                    │
       │◀── git add ──────┤                    │
       │                  │◀── git commit ─────┤
       │                  │                    │
       │──git restore ────│                    │   ① 작업 취소 (⚠️ 소실)
       │                  │─ restore --staged ─│   ② add 취소 (안전)
       │                  │                    │
       │◀──────── git reset --hard ────────────│   ⑦ 전부 되돌리기 (🚨)
```

**모든 되돌리기 명령은 "어느 공간의 내용을 어디 것으로 덮어쓰는가"** 입니다.

### `restore` 와 `checkout`

예전 Git에서는 이 두 가지를 **전부 `git checkout` 하나로** 했습니다.

```bash
git checkout -- file.txt      # 예전: 파일 되돌리기
git checkout main             # 예전: 브랜치 이동
```

같은 명령이 전혀 다른 일을 해서 사고가 잦았습니다. 그래서 Git 2.23(2019)부터 역할을 나눴습니다.

| 새 명령 | 하는 일 |
|---|---|
| **`git restore`** | 파일 내용 되돌리기 |
| **`git switch`** | 브랜치 이동 ([08강](lesson-08.md)) |

> `git checkout` 은 여전히 동작합니다. 오래된 블로그와 문서에 많이 나오니 **읽을 줄은 알아야 합니다.**
> 하지만 **새로 배울 때는 `restore` / `switch`** 를 쓰세요. 훨씬 안전하고 의도가 분명합니다.

### 세 개의 `reset`

`reset` 은 **HEAD를 과거로 옮기는** 명령입니다. 옵션에 따라 함께 되돌리는 범위가 달라집니다.

```
git reset --soft  HEAD~1    저장소만 되돌림     스테이지 유지 · 작업 유지
git reset         HEAD~1    저장소 + 스테이지   작업 유지            (기본값 = --mixed)
git reset --hard  HEAD~1    전부 되돌림        🚨 작업 소실
```

| 옵션 | 커밋 | 스테이지 | 작업 디렉터리 | 언제 쓰나 |
|---|---|---|---|---|
| `--soft` | 취소 | **유지** | 유지 | 커밋만 다시 하고 싶을 때 |
| `--mixed` (기본) | 취소 | 취소 | 유지 | `add` 부터 다시 하고 싶을 때 |
| `--hard` | 취소 | 취소 | **삭제** 🚨 | 전부 없던 일로 |

> 완전한 이해는 [24강 3-tree 모델](lesson-24.md)에서 합니다. 지금은 **`--hard` 만 위험하다**는 것을 기억하면 됩니다.

### 황금률 — push한 커밋은 건드리지 않는다

> **`--amend` 와 `reset` 은 커밋을 "다시 쓰는" 명령입니다.**
> 혼자 쓰는 로컬 커밋에는 자유롭게 써도 되지만, **이미 GitHub에 올린(push한) 커밋에는 쓰지 마세요.**

이유는 간단합니다. 남이 이미 받아 간 역사를 내가 바꾸면, 그 사람의 저장소와 어긋나 버립니다.

```
나:    A ── B ── C'     (C를 amend해서 C' 로 바뀜)
팀원:  A ── B ── C      (여전히 C를 갖고 있음)
                        → 충돌과 혼란
```

**push한 커밋을 되돌리려면 `git revert`** 를 씁니다. 이력을 고치지 않고 **"취소하는 새 커밋"** 을 만드는 안전한 방법입니다. [17강](lesson-17.md)에서 다룹니다.

**초급 단계의 안전 규칙**

```
push 전  →  amend, reset 자유롭게
push 후  →  revert 만
```

---

## ④ 단계별 실습

### Step 1. 작업 디렉터리의 수정 취소하기 (`git restore`)

```bash
cd ~/Desktop/git-practice
```

`greeting.py` 를 엉망으로 고칩니다.

```python
아무거나 막 쓴 내용
이건 실수입니다
```

```bash
git status
```

실행 결과:

```
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   greeting.py

no changes added to commit (use "git add" and/or "git commit -a")
```

> **Git이 답을 알려 주고 있습니다.** `(use "git restore <file>..." to discard changes...)`
> 되돌리기 명령을 몰라도 `git status` 만 보면 됩니다.

```bash
git restore greeting.py
```

아무 출력도 없으면 성공입니다.

```bash
git status
```

실행 결과:

```
On branch main
nothing to commit, working tree clean
```

파일을 열어 보면 마지막 커밋 상태로 돌아와 있습니다.

> 🚨 **`git restore` 는 되돌릴 수 없습니다.**
> 방금 지운 내용은 커밋된 적이 없으므로 Git 어디에도 남아 있지 않습니다. `Ctrl+Z` 로도 못 살립니다.
> **정말 버려도 되는지 확인하고** 실행하세요. 아깝다면 먼저 커밋하거나 `git stash` ([16강](lesson-16.md))를 쓰세요.

### Step 2. 실수로 지운 파일 되살리기

```bash
rm important.log        # PowerShell: Remove-Item important.log
git status
```

실행 결과:

```
On branch main
Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	deleted:    important.log

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git restore important.log
ls important.log
```

실행 결과:

```
important.log
```

**되살아났습니다.** 커밋된 파일이라면 실수로 지워도 안전합니다.

### Step 3. `add` 취소하기 (`git restore --staged`)

파일 두 개를 고칩니다.

```bash
echo "# 메모" > memo.md
echo "print('추가')" >> greeting.py
```

무심코 전부 담았다고 해 봅시다.

```bash
git add .
git status
```

실행 결과:

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   greeting.py
	new file:   memo.md
```

`memo.md` 는 이번 커밋에 넣고 싶지 않습니다. 빼냅니다.

```bash
git restore --staged memo.md
git status
```

실행 결과:

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   greeting.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	memo.md
```

`memo.md` 가 스테이지에서 빠져 원래 자리로 돌아갔습니다.

> ✅ **`--staged` 는 안전합니다.** 스테이지에서만 빼고 **파일 내용은 손대지 않습니다.**
>
> ⚠️ **두 명령을 절대 헷갈리지 마세요.**
> ```
> git restore --staged memo.md   → add 취소       (파일 내용 그대로) ✅
> git restore memo.md            → 수정 내용 삭제 (되돌릴 수 없음)   🚨
> ```
> `--staged` 하나 빠뜨렸다가 반나절 작업을 날리는 일이 실제로 자주 있습니다.

커밋해 둡니다.

```bash
git commit -m "feat: 출력 한 줄 추가"
```

### Step 4. 커밋 메시지 고치기 (`git commit --amend`)

오타가 난 커밋을 일부러 만듭니다.

```bash
echo "print('마지막 줄')" >> greeting.py
git add greeting.py
git commit -m "feat: 마지막 줄 추까"
```

실행 결과:

```
[main 3f7a2c8] feat: 마지막 줄 추까
 1 file changed, 1 insertion(+)
```

"추까" 를 고칩니다.

```bash
git commit --amend -m "feat: 마지막 줄 추가"
```

실행 결과:

```
[main 8c2e5b9] feat: 마지막 줄 추가
 Date: Mon Aug 10 16:04:12 2026 +0900
 1 file changed, 1 insertion(+)
```

```bash
git log --oneline -2
```

실행 결과:

```
8c2e5b9 (HEAD -> main) feat: 마지막 줄 추가
3d9f1a4 feat: 출력 한 줄 추가
```

**커밋 개수는 그대로인데 메시지가 바뀌었습니다.**

> ⚠️ **해시가 `3f7a2c8` → `8c2e5b9` 로 바뀐 것**을 눈여겨보세요.
> `--amend` 는 커밋을 수정하는 게 아니라 **새 커밋으로 갈아치우는 것**입니다. 그래서 push한 뒤에는 쓰면 안 됩니다.

### Step 5. 커밋에 빠뜨린 파일 추가하기

가장 자주 쓰는 `--amend` 용법입니다.

```bash
echo "print('함께 넣었어야 할 줄')" >> greeting.py
echo "추가 설명" >> memo.md
git add greeting.py
git commit -m "feat: 설명 출력 추가"
```

커밋하고 나서 `memo.md` 를 빠뜨린 걸 알았습니다.

```bash
git add memo.md
git commit --amend --no-edit
```

실행 결과:

```
[main 5e1d7f3] feat: 설명 출력 추가
 Date: Mon Aug 10 16:11:35 2026 +0900
 2 files changed, 2 insertions(+)
 create mode 100644 memo.md
```

> `--no-edit` 는 **메시지를 그대로 두고** 내용만 합치라는 뜻입니다. 편집기가 열리지 않습니다.
> `2 files changed` 로 바뀐 것을 확인하세요. 새 커밋을 만들지 않고 **직전 커밋에 흡수**시킨 것입니다.

### Step 6. 마지막 커밋 취소하기 (`git reset`)

**연습용 커밋을 하나 만듭니다.**

```bash
echo "실수로 커밋할 내용" > mistake.txt
git add mistake.txt
git commit -m "실수로 만든 커밋"
git log --oneline -3
```

실행 결과:

```
9a4c8e1 (HEAD -> main) 실수로 만든 커밋
5e1d7f3 feat: 설명 출력 추가
3d9f1a4 feat: 출력 한 줄 추가
```

**① `--soft` — 커밋만 취소, 스테이지는 유지**

```bash
git reset --soft HEAD~1
git log --oneline -2
```

실행 결과:

```
5e1d7f3 (HEAD -> main) feat: 설명 출력 추가
3d9f1a4 feat: 출력 한 줄 추가
```

```bash
git status
```

실행 결과:

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   mistake.txt
```

**커밋만 사라지고 파일은 스테이지에 그대로 있습니다.** 메시지만 다시 써서 커밋하면 되는 상태입니다.

**② `--mixed` (기본) — 스테이지도 취소**

다시 커밋했다가 이번엔 `--mixed` 로 되돌려 봅니다.

```bash
git commit -m "실수로 만든 커밋 2"
git reset HEAD~1
```

실행 결과:

```
Unstaged changes after reset:
M	memo.md
```

```bash
git status
```

실행 결과:

```
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	mistake.txt

nothing added to commit but untracked files present (use "git add" to track)
```

**커밋도 `add` 도 취소됐지만 파일은 살아 있습니다.**

**③ `--hard` — 전부 삭제** 🚨

```bash
git add mistake.txt
git commit -m "실수로 만든 커밋 3"
git reset --hard HEAD~1
```

실행 결과:

```
HEAD is now at 5e1d7f3 feat: 설명 출력 추가
```

```bash
ls mistake.txt
```

실행 결과:

```
ls: cannot access 'mistake.txt': No such file or directory
```

**파일이 통째로 사라졌습니다.**

> 🚨 **`--hard` 는 이 강에서 가장 위험한 명령입니다.**
> 커밋하지 않은 작업이 함께 사라지며, 그건 복구할 수 없습니다.
> 다만 **커밋했던 것**은 `git reflog` 로 되살릴 수 있습니다 ([23강](lesson-23.md)). 맛만 보겠습니다.

```bash
git reflog -5
```

실행 결과:

```
5e1d7f3 (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1
2b6f9d4 HEAD@{1}: commit: 실수로 만든 커밋 3
5e1d7f3 (HEAD -> main) HEAD@{2}: reset: moving to HEAD~1
7d3a1c8 HEAD@{3}: commit: 실수로 만든 커밋 2
5e1d7f3 (HEAD -> main) HEAD@{4}: reset: moving to HEAD~1
```

**지운 커밋이 아직 다 남아 있습니다.** `git reset --hard 2b6f9d4` 로 되살릴 수 있습니다.

> Git은 생각보다 훨씬 관대합니다. **한 번이라도 커밋했다면 웬만해선 잃어버리지 않습니다.**
> 위험한 것은 언제나 **커밋하지 않은 변경**입니다.

### Step 7. 옛날 시점의 파일로 되돌리기

파일 하나만 과거 버전으로 가져올 수 있습니다.

```bash
git restore --source=HEAD~3 README.md
git status
```

실행 결과:

```
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   README.md
```

**3개 커밋 전의 `README.md` 내용**이 작업 디렉터리에 들어왔습니다. 마음에 들면 커밋하고, 아니면 다시 되돌립니다.

```bash
git restore README.md        # 원래대로
```

> [06강](lesson-06.md)의 `git show HEAD~3:README.md` 는 **보기만** 하고, `git restore --source=` 는 **실제로 바꿉니다.**
> 확인만 하려면 `show` 를 쓰는 것이 안전합니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code |
|---|---|
| 수정 취소 (`restore`) | 파일 우클릭 → **Discard Changes** |
| add 취소 (`restore --staged`) | Staged Changes에서 파일 옆 `−` |
| 마지막 커밋 수정 (`--amend`) | Source Control `···` 메뉴 → **Commit** → **Commit Staged (Amend)** |
| 커밋 취소 (`reset`) | `···` → **Commit** → **Undo Last Commit** (= `reset --soft HEAD~1`) |

> **Discard Changes 는 `git restore` 와 똑같이 되돌릴 수 없습니다.** VS Code가 한 번 물어보긴 하지만, 습관적으로 확인 버튼을 누르지 마세요.

---

## ⑤ 자주 하는 실수

### `git restore` 로 작업을 날렸습니다

```bash
git restore app.py      # 반나절 작업이 사라짐
```

**원인** — 커밋하지 않은 변경은 Git 어디에도 저장되어 있지 않습니다.
**해결** — **거의 복구 불가**입니다. 시도해 볼 만한 것은 두 가지뿐입니다.

- VS Code의 **로컬 히스토리** — `Ctrl+Shift+P` → `Local History: Find Entry to Restore`
- 에디터를 아직 안 껐다면 `Ctrl+Z` 를 계속 눌러 보기

**예방이 유일한 답입니다.**

```bash
git stash              # 일단 안전하게 치워 두기 (16강)
git commit -m "wip"    # 임시 커밋 (나중에 정리 가능)
```

> 그래서 [04강](lesson-04.md)에서 **"작게, 자주 커밋"** 을 강조한 것입니다. 커밋은 안전망입니다.

### `--staged` 를 빼먹었습니다

```bash
git restore --staged memo.md    # 의도: add 취소
git restore memo.md             # 실수: 내용 삭제 🚨
```

**원인** — 두 명령이 한 글자 차이인데 결과는 정반대입니다.
**해결** — 실행 전에 **`--staged` 가 있는지 눈으로 확인**하세요.

> `git status` 를 보면 Git이 상황에 맞는 명령을 정확히 알려 줍니다. 그대로 복사해 쓰는 것이 가장 안전합니다.

### `--amend` 하고 나서 push가 거부됩니다

```
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/USER/REPO.git'
```

**원인** — 이미 push한 커밋을 `--amend` 로 갈아치웠습니다. 원격의 이력과 어긋납니다.
**해결** — 상황에 따라 다릅니다.

- **혼자 쓰는 저장소라면** — 강제 푸시가 가능합니다. 단, 안전 옵션을 쓰세요.
  ```bash
  git push --force-with-lease
  ```
- **팀 저장소라면** — 강제 푸시하지 마세요. 남의 작업을 날릴 수 있습니다.
  대신 **되돌리는 새 커밋**을 만듭니다. → `git revert` ([17강](lesson-17.md))

> `--force` 와 `--force-with-lease` 의 차이는 [17강](lesson-17.md)에서 다룹니다.
> 지금은 **"`--force` 는 절대 먼저 쓰지 않는다"** 만 기억하세요.

### `git reset --hard` 로 커밋을 날렸습니다

**해결** — **당황하지 말고 `git reflog`** 를 치세요.

```bash
git reflog
```

```
5e1d7f3 (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1
2b6f9d4 HEAD@{1}: commit: 중요한 작업
```

되살립니다.

```bash
git reset --hard 2b6f9d4
```

> reflog는 **HEAD가 움직인 모든 기록**을 남깁니다. 기본 90일간 보관됩니다.
> 단, **커밋하지 않은 변경은 여기에도 없습니다.** [23강](lesson-23.md)에서 자세히 다룹니다.

### `reset` 과 `revert` 를 혼동

| | `git reset` | `git revert` |
|---|---|---|
| 방식 | 이력을 **되감음** | **취소하는 새 커밋**을 추가 |
| 이력 | 커밋이 사라짐 | 커밋이 그대로 남고 하나 늘어남 |
| push 후 사용 | ❌ 안 됨 | ✅ 안전 |

**해결** — **push 전이면 `reset`, push 후면 `revert`.** 이 한 줄만 기억하세요.

### `HEAD~1` 을 `HEAD-1` 로 씀

```
fatal: ambiguous argument 'HEAD-1': unknown revision or path not in the working tree.
```

**원인** — 물결표(`~`)입니다. 빼기 기호가 아닙니다.
**해결** — `HEAD~1`. 키보드에서 `Shift + 백틱(₩ 또는 \ 옆)` 입니다.

---

## ⑥ 확인 문제

**1.** 아래 상황에서 각각 어떤 명령을 써야 할까요?

```
ⓐ config.py 를 고치다가 망쳤다. 마지막 커밋 상태로 되돌리고 싶다.
ⓑ .env 를 실수로 git add 했다. 커밋 전에 빼고 싶다.
ⓒ 방금 커밋 메시지에 오타를 냈다. (아직 push 안 함)
ⓓ 방금 커밋에 test.py 를 빠뜨렸다. (아직 push 안 함)
```

<details>
<summary>답 보기</summary>

```bash
# ⓐ 작업 디렉터리 되돌리기  ⚠️ 되돌릴 수 없음
git restore config.py

# ⓑ 스테이지에서 빼기  ✅ 안전 (파일 내용은 그대로)
git restore --staged .env

# ⓒ 메시지 수정
git commit --amend -m "fix: 올바른 메시지"

# ⓓ 파일 추가해서 직전 커밋에 흡수
git add test.py
git commit --amend --no-edit
```

**ⓑ 에서 주의** — `--staged` 를 빼면 `.env` 의 **내용이 마지막 커밋 상태로 되돌아갑니다.** `.env` 가 커밋된 적 없다면 `git restore .env` 는 에러가 나지만, 커밋된 적 있다면 애써 적어 둔 키가 날아갑니다.

**ⓒⓓ 는 push 전이라 안전합니다.** push한 뒤였다면 `git revert` 를 써야 합니다.
</details>

**2.** `git reset --soft HEAD~1` 과 `git reset --hard HEAD~1` 의 차이를 설명하고, **어떤 상황에 각각** 쓰는지 예를 들어 보세요.

<details>
<summary>답 보기</summary>

| | `--soft` | `--hard` |
|---|---|---|
| 커밋 | 취소 | 취소 |
| 스테이지 | **유지** | 비움 |
| 작업 디렉터리 | **유지** | 🚨 **되돌림 (작업 소실)** |

**`--soft` 를 쓰는 상황**

- 커밋 메시지를 완전히 다시 쓰고 싶을 때
- 커밋을 잘못 나눴을 때 (여러 개를 하나로 합치기)

```bash
git reset --soft HEAD~3      # 최근 3개 커밋을 취소하되 변경은 전부 스테이지에 유지
git commit -m "feat: 로그인 기능 구현"    # 하나로 다시 커밋
```

**`--hard` 를 쓰는 상황**

- 실험하다 망쳤고 **전부 버려도 되는 것이 확실할 때**
- 원격 상태와 완전히 똑같이 맞추고 싶을 때 (`git reset --hard origin/main`)

**실행 전 체크** — `--hard` 를 치기 전에 `git status` 로 **커밋 안 된 변경이 있는지** 꼭 확인하세요. 있다면 그건 복구되지 않습니다.
</details>

**3.** 팀 저장소에 이미 push한 커밋에서 실수를 발견했습니다. **`git commit --amend` 로 고치면 안 되는 이유**와 올바른 대처법은?

<details>
<summary>답 보기</summary>

**안 되는 이유 — 이력이 갈라집니다.**

`--amend` 는 커밋을 수정하는 것이 아니라 **해시가 다른 새 커밋으로 교체**합니다.

```
원격/팀원:  A ── B ── C       (모두 C를 받아 감)
나:         A ── B ── C'      (amend 후)
```

이제 push하면 거부되고(`non-fast-forward`), 억지로 `--force` 하면 이런 일이 벌어집니다.

- C를 기준으로 작업하던 팀원의 이력이 어긋납니다
- 팀원이 `pull` 하면 이상한 충돌이 나거나, 그 사이 올린 커밋이 사라질 수 있습니다

**올바른 대처 — `git revert`**

```bash
git revert <잘못된-커밋-해시>
```

C를 **취소하는 내용의 새 커밋 D** 가 만들어집니다.

```
A ── B ── C ── D        (D = C의 반대)
```

이력이 그대로 보존되므로 팀원 누구에게도 피해가 없습니다. "언제 무엇을 잘못했고 언제 되돌렸는지"까지 기록에 남는다는 장점도 있습니다. [17강](lesson-17.md)에서 다룹니다.

**정리**

```
push 전  →  amend / reset  (자유롭게)
push 후  →  revert         (이것만)
```
</details>

---

## 오늘의 정리

| 상황 | 명령 |
|---|---|
| 수정 취소 (add 전) | `git restore <파일>` ⚠️ |
| add 취소 | `git restore --staged <파일>` ✅ |
| 지운 파일 되살리기 | `git restore <파일>` |
| 과거 버전 가져오기 | `git restore --source=HEAD~3 <파일>` |
| 커밋 메시지 수정 | `git commit --amend -m "새 메시지"` |
| 커밋에 파일 추가 | `git add <파일>` → `git commit --amend --no-edit` |
| 커밋만 취소 | `git reset --soft HEAD~1` |
| 커밋 + add 취소 | `git reset HEAD~1` |
| 전부 되돌리기 | `git reset --hard HEAD~1` 🚨 |
| 날린 커밋 찾기 | `git reflog` |

**위험도 3단계**

```
✅ 안전       restore --staged · reset --soft · reset (mixed) · reflog
⚠️ 주의       restore · restore --source · amend · reset (push 전에만)
🚨 매우 위험  reset --hard  (커밋 안 한 작업은 영영 사라짐)
```

**황금률**

```
push 전  →  amend, reset 자유롭게
push 후  →  revert 만 (17강)
```

**오늘 반드시 기억할 한 가지**
> **커밋한 것은 거의 다 살릴 수 있고(`reflog`), 커밋 안 한 것은 못 살립니다.**
> 그러니 위험한 명령을 치기 전에 일단 커밋하거나 `git stash` 하세요.

**과제**
1. 파일을 고친 뒤 `git restore` 로 되돌려 보세요. (되돌릴 수 없다는 점을 체감해 보는 것이 목적입니다)
2. 파일 두 개를 `git add .` 로 담고, 그중 하나만 `git restore --staged` 로 빼내세요.
3. 커밋 메시지에 일부러 오타를 낸 뒤 `--amend` 로 고치고, `git log` 에서 **해시가 바뀐 것**을 확인하세요.
4. 연습용 커밋을 만들고 `--soft` → `--mixed` → `--hard` 를 차례로 실행하며 `git status` 결과가 어떻게 달라지는지 기록하세요.
5. `git reflog` 를 실행해 지금까지 HEAD가 어떻게 움직였는지 확인하세요.

---

[← 이전 06강](lesson-06.md) · [목차](README.md) · [다음 → 08강 브랜치 만들고 합치기](lesson-08.md)
