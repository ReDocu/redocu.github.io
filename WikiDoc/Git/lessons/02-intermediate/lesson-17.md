# 17강 · 안전하게 되돌리기

> **Git 학습 매뉴얼** · 🟡 중급 · **17강 / 30**
> [← 이전 16강](lesson-16.md) · [목차](README.md) · [다음 → 18강 히스토리 정리](lesson-18.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git revert` 로 **이미 push한 커밋**을 안전하게 되돌릴 수 있다.
- `reset` 과 `revert` 를 상황에 따라 구분해 쓸 수 있다.
- 머지 커밋을 되돌리고, 그때 생기는 **함정**을 피할 수 있다.
- `--force` 와 `--force-with-lease` 의 차이를 알고 안전하게 강제 push할 수 있다.

---

## ② 왜 필요한가

[07강](lesson-07.md)에서 **황금률**을 배웠습니다.

```
push 전  →  amend, reset 자유롭게
push 후  →  revert 만
```

오늘 그 `revert` 를 제대로 배웁니다. 그런데 왜 push한 뒤에는 다르게 다뤄야 할까요.

```
내 컴퓨터:   A ── B ── C            (C 를 reset 으로 지움)
                       ↓
             A ── B

GitHub:      A ── B ── C            (C 가 그대로)
팀원 컴퓨터:  A ── B ── C ── D       (C 위에 작업 중)
```

내가 `--force` 로 밀어 넣으면 **팀원의 D가 기반을 잃습니다.** 팀원이 `pull` 하면 이상한 충돌이 나거나, 최악의 경우 **D가 사라집니다.**

`revert` 는 이력을 지우는 대신 **"C를 취소하는 새 커밋 D"** 를 추가합니다.

```
A ── B ── C ── C'      (C' = C 의 정반대)
```

아무것도 사라지지 않으므로 **누구에게도 피해가 없습니다.** 게다가 "언제 무엇을 잘못했고 언제 되돌렸는지"까지 기록에 남습니다.

---

## ③ 개념 설명

### `revert` — 취소하는 커밋을 추가

```
git revert C
```

```
전:  A ── B ── C
후:  A ── B ── C ── C'

C  가 +5줄 추가했다면
C' 는 그 5줄을 삭제
```

**핵심 성질 네 가지**

| 성질 | 설명 |
|---|---|
| 새 커밋을 만든다 | 이력이 **늘어납니다** |
| 기존 커밋을 안 건드린다 | 해시가 그대로 → **push 후에도 안전** |
| 언제든 되돌릴 수 있다 | `revert` 를 다시 `revert` 하면 원상복구 |
| 중간 커밋도 가능 | `C` 뿐 아니라 `B` 만 골라 되돌릴 수도 있음 |

### `reset` vs `revert`

| | `git reset` | `git revert` |
|---|---|---|
| 방식 | 이력을 **되감음** | **취소 커밋**을 추가 |
| 커밋 개수 | 줄어듦 | **늘어남** |
| 해시 변경 | ✅ | ❌ |
| 되돌린 기록 | **안 남음** | 남음 |
| push 후 사용 | 🚨 안 됨 | ✅ 안전 |
| 협업 안전성 | 위험 | 안전 |

```
reset   A ── B ── C     →   A ── B              (C 가 사라짐)
revert  A ── B ── C     →   A ── B ── C ── C'   (C 는 남고 취소분 추가)
```

**판단은 단순합니다.**

```
아직 push 안 했나?  →  reset 써도 됨 (더 깔끔)
이미 push 했나?     →  revert 만
```

### 중간 커밋만 되돌리기

`revert` 는 **커밋 순서와 무관하게** 특정 커밋만 취소할 수 있습니다.

```
A ── B ── C ── D          B 만 되돌리고 싶다
             ↓
A ── B ── C ── D ── B'    B 의 변경만 취소하는 커밋 추가
```

> 단, `B` 이후에 같은 부분을 고친 커밋이 있으면 **충돌**이 납니다. 당연한 일이고, 해결하면 됩니다.

### 머지 커밋 되돌리기 — `-m` 이 필요합니다

머지 커밋은 **부모가 둘**입니다. 그래서 "어느 쪽을 기준으로 되돌릴지" 알려 줘야 합니다.

```
        ┌── X ── Y ──┐
A ── B ─┤            ├── M      ← 머지 커밋
        └── C ── D ──┘

부모 1 (main 쪽):     D
부모 2 (feature 쪽):  Y
```

```bash
git revert -m 1 M      # 부모 1(main)을 기준으로 → feature 의 변경이 취소됨
```

| 옵션 | 뜻 |
|---|---|
| `-m 1` | **첫 번째 부모 기준.** 대부분 이것 |
| `-m 2` | 두 번째 부모 기준 |

**첫 번째 부모는 "머지를 실행한 브랜치"** 입니다. `main` 에서 `git merge feature` 를 했다면 `main` 쪽이 부모 1입니다.

### ⚠️ 머지 revert의 함정 — 반드시 알아야 합니다

**Git에서 가장 유명한 함정**입니다.

```
① feature 를 main 에 병합       →  M
② 문제가 있어서 revert          →  M'  (feature 의 변경이 취소됨)
③ feature 를 고쳐서 다시 병합    →  ???
```

**③에서 아무것도 안 들어옵니다.**

**왜 그럴까요.** Git은 병합할 때 **"어느 커밋이 이미 반영됐는가"** 를 봅니다. `feature` 의 커밋들은 ①에서 이미 병합 이력에 포함됐습니다. `revert` 는 **내용만 되돌렸을 뿐 "병합했다"는 사실은 지우지 않습니다.** 그래서 Git은 "이미 다 반영된 브랜치"로 판단합니다.

```
Already up to date.
```

**해결책 두 가지**

**① revert를 revert 한다** (권장)

```bash
git revert M'          # 취소를 취소 → feature 의 변경이 되살아남
# 그 뒤에 추가 수정을 커밋
```

**② feature 브랜치를 rebase해서 새 커밋으로 만든다**

```bash
git switch feature
git rebase main        # 해시가 바뀌어 "새로운 커밋"이 됨
git switch main
git merge feature
```

> 그래서 실무에서는 **머지 커밋을 revert하기 전에 한 번 더 생각**합니다.
> PR을 **Squash and merge**([14강](lesson-14.md))로 병합하면 `main` 에 일반 커밋 하나만 생기므로 이 함정 자체가 없습니다. Squash를 권하는 이유 중 하나입니다.

### `--force` 와 `--force-with-lease`

이력을 다시 쓴 뒤([12강](lesson-12.md) rebase, [18강](lesson-18.md) rebase -i) push하려면 강제 옵션이 필요합니다.

| 옵션 | 동작 |
|---|---|
| `--force` (`-f`) | **무조건** 덮어씀. 그 사이 남이 올린 커밋도 사라짐 🚨 |
| **`--force-with-lease`** | **내가 마지막으로 본 원격 상태와 같을 때만** 덮어씀 |
| `--force-if-includes` | 위에 더해, 원격 최신 커밋을 내가 실제로 받아 봤는지까지 확인 |

```bash
git push --force-with-lease
```

거부되면 이렇게 나옵니다.

```
 ! [rejected]        feature/x -> feature/x (stale info)
```

**이건 안전장치가 작동한 것입니다.** 원격에 내가 모르는 변경이 있다는 뜻이니, 확인부터 하세요.

> **`--force` 는 앞으로도 쓸 일이 거의 없습니다.** 항상 `--force-with-lease` 를 쓰세요.
> 별칭으로 등록해 두면 손이 먼저 안전한 쪽으로 갑니다.
> ```bash
> git config --global alias.pushf "push --force-with-lease"
> ```

---

## ④ 단계별 실습

### Step 1. 기본 revert

```bash
cd ~/Desktop/todo-app
git switch main
git pull
```

되돌릴 커밋을 하나 만듭니다.

```bash
git switch -c feature/experiment
```

`todo.py` 에 추가합니다.

```python
def reset_all():
    save([])
    print("모든 할 일을 삭제했습니다.")
```

```bash
git add todo.py
git commit -m "feat: 전체 초기화 기능 추가"
git switch main
git merge feature/experiment      # fast-forward
git push
git branch -d feature/experiment
git log --oneline -2
```

실행 결과:

```
9d2e7b4 (HEAD -> main, origin/main) feat: 전체 초기화 기능 추가
8d3f1a9 fix: todos.json 이 비어 있을 때 발생하는 오류 수정
```

**"확인 없이 전부 지우는 건 위험하다"는 지적이 나왔습니다.** 이미 push했으니 `revert` 로 되돌립니다.

```bash
git revert 9d2e7b4
```

편집기가 열립니다.

```
Revert "feat: 전체 초기화 기능 추가"

This reverts commit 9d2e7b4a1c3f5e7b9d1a3c5e7f9b1d3a5c7e9f21.
```

**되돌리는 이유를 덧붙이면 훨씬 좋습니다.**

```
Revert "feat: 전체 초기화 기능 추가"

This reverts commit 9d2e7b4a1c3f5e7b9d1a3c5e7f9b1d3a5c7e9f21.

확인 절차 없이 전체 데이터를 삭제하는 것은 위험하다는 리뷰 의견이 있었다.
확인 프롬프트를 추가한 뒤 다시 도입할 예정이다.
```

저장하고 닫습니다.

실행 결과:

```
[main 4f8a2c9] Revert "feat: 전체 초기화 기능 추가"
 1 file changed, 5 deletions(-)
```

```bash
git log --oneline -3
```

실행 결과:

```
4f8a2c9 (HEAD -> main) Revert "feat: 전체 초기화 기능 추가"
9d2e7b4 (origin/main) feat: 전체 초기화 기능 추가
8d3f1a9 fix: todos.json 이 비어 있을 때 발생하는 오류 수정
```

**원래 커밋이 그대로 남아 있고, 취소 커밋이 하나 추가됐습니다.**

```bash
git show 4f8a2c9
```

실행 결과:

```diff
diff --git a/todo.py b/todo.py
@@ -50,8 +50,3 @@ def search(keyword, include_done=True):
         print(f"{mark} {t['text']}")
-
-
-def reset_all():
-    save([])
-    print("모든 할 일을 삭제했습니다.")
```

**원래 커밋의 정확한 반대**입니다.

```bash
git push
```

### Step 2. revert를 다시 revert 하기

기능을 개선해서 되살리고 싶습니다.

```bash
git revert 4f8a2c9      # revert 커밋을 revert
```

실행 결과:

```
[main 2b7e9c4] Revert "Revert "feat: 전체 초기화 기능 추가""
 1 file changed, 5 insertions(+)
```

```bash
git log --oneline -4
```

실행 결과:

```
2b7e9c4 (HEAD -> main) Revert "Revert "feat: 전체 초기화 기능 추가""
4f8a2c9 Revert "feat: 전체 초기화 기능 추가"
9d2e7b4 feat: 전체 초기화 기능 추가
8d3f1a9 fix: todos.json 이 비어 있을 때 발생하는 오류 수정
```

**기능이 되살아났습니다.** 이제 확인 절차를 추가합니다.

```python
def reset_all(confirm=False):
    if not confirm:
        print("정말 삭제하려면 reset_all(confirm=True) 로 호출하세요.")
        return
    save([])
    print("모든 할 일을 삭제했습니다.")
```

```bash
git add todo.py
git commit -m "feat: 전체 초기화에 확인 절차 추가"
git push
```

> `Revert "Revert "..."` 라는 메시지는 보기 좋지 않습니다. **커밋할 때 메시지를 다듬으세요.**
> ```bash
> git revert 4f8a2c9 --no-edit    # 기본 메시지로
> git commit --amend -m "feat: 전체 초기화 기능 재도입"    # 다듬기 (push 전이라면)
> ```

### Step 3. 중간 커밋만 되돌리기

커밋 세 개를 만든 뒤 **가운데 것만** 되돌립니다.

```bash
echo "설정 A" > config_a.txt
git add config_a.txt
git commit -m "chore: 설정 A 추가"

echo "설정 B" > config_b.txt
git add config_b.txt
git commit -m "chore: 설정 B 추가"

echo "설정 C" > config_c.txt
git add config_c.txt
git commit -m "chore: 설정 C 추가"

git log --oneline -3
```

실행 결과:

```
5a1f8d2 (HEAD -> main) chore: 설정 C 추가
3e9c4b7 chore: 설정 B 추가
7d2a6f1 chore: 설정 A 추가
```

**B만 잘못됐습니다.**

```bash
git revert 3e9c4b7 --no-edit
```

실행 결과:

```
[main 9f3b1e8] Revert "chore: 설정 B 추가"
 1 file changed, 1 deletion(-)
 delete mode 100644 config_b.txt
```

```bash
ls config_*.txt
```

실행 결과:

```
config_a.txt  config_c.txt
```

**B만 정확히 사라졌습니다.** A와 C는 그대로입니다.

**여러 개를 한 번에**

```bash
git revert 7d2a6f1 5a1f8d2 --no-edit      # A 와 C 도 되돌리기 (커밋 2개 생성)
```

**하나의 커밋으로 묶어서**

```bash
git revert -n 7d2a6f1 5a1f8d2             # -n = 커밋하지 않고 적용만
git commit -m "chore: 실험용 설정 파일 일괄 제거"
```

**범위로**

```bash
git revert --no-edit HEAD~3..HEAD         # 최근 3개 (HEAD~3 자신은 제외)
```

정리합니다.

```bash
git status
git log --oneline -3
git push
```

### Step 4. 머지 커밋 되돌리기와 함정

**① 브랜치를 만들어 병합**

```bash
git switch -c feature/tags
```

`todo.py` 에 태그 기능을 추가합니다.

```python
def add_tag(index, tag):
    todos = load()
    if 1 <= index <= len(todos):
        todos[index - 1].setdefault("tags", []).append(tag)
        save(todos)
        print(f"태그 추가: {tag}")
```

```bash
git add todo.py
git commit -m "feat: 할 일에 태그 추가 기능"

echo "- \`add_tag(번호, 태그)\`" >> README.md
git add README.md
git commit -m "docs: 태그 기능 사용법 추가"

git switch main
git merge --no-ff feature/tags
git push
git log --oneline --graph -5
```

실행 결과:

```
*   6c4e8b3 (HEAD -> main, origin/main) Merge branch 'feature/tags'
|\
| * 1f7d3a9 (feature/tags) docs: 태그 기능 사용법 추가
| * 8e2b5c7 feat: 할 일에 태그 추가 기능
|/
* 9f3b1e8 Revert "chore: 설정 B 추가"
```

**② 병합을 되돌립니다**

```bash
git revert -m 1 6c4e8b3 --no-edit
```

실행 결과:

```
[main 7c1e5a3] Revert "Merge branch 'feature/tags'"
 2 files changed, 9 deletions(-)
```

```bash
grep -c "add_tag" todo.py
```

실행 결과:

```
0
```

**태그 기능이 사라졌습니다.**

**③ 함정을 직접 확인합니다**

기능을 고쳐서 다시 병합해 봅니다.

```bash
git switch feature/tags
echo "# 태그 기능 개선 예정" >> NOTES.md
git add NOTES.md
git commit -m "docs: 태그 기능 개선 메모"

git switch main
git merge --no-ff feature/tags
```

실행 결과:

```
Merge made by the 'ort' strategy.
 NOTES.md | 1 +
 1 file changed, 1 insertion(+)
```

```bash
grep -c "add_tag" todo.py
```

실행 결과:

```
0
```

> 🚨 **`NOTES.md` 만 들어오고 `add_tag` 함수는 안 들어왔습니다.**
> Git 입장에서 `8e2b5c7`, `1f7d3a9` 는 **이미 병합된 커밋**입니다. 내용이 revert됐다는 것은 병합 판단에 반영되지 않습니다.

**④ 해결 — revert를 revert**

```bash
git revert 7c1e5a3 --no-edit
grep -c "add_tag" todo.py
```

실행 결과:

```
1
```

**기능이 돌아왔습니다.**

```bash
git push
git branch -d feature/tags
```

> **기억할 것** — 머지 커밋을 revert했다면, 그 브랜치를 다시 살리려면 **revert를 revert**해야 합니다.
> 이 함정을 피하는 가장 쉬운 방법은 PR을 **Squash and merge** 로 병합하는 것입니다.

### Step 5. revert 충돌 처리

되돌리려는 부분이 이후에 또 수정됐다면 충돌합니다.

```bash
git switch -c fix/message
```

`todo.py` 의 `add()` 마지막 출력 줄을 고칩니다.

```python
    print(f"등록 완료: {text}")
```

```bash
git add todo.py
git commit -m "feat: 등록 완료 메시지로 변경"
git switch main
git merge fix/message
git branch -d fix/message
git log --oneline -1
```

실행 결과:

```
3f9a2e7 (HEAD -> main) feat: 등록 완료 메시지로 변경
```

같은 줄을 한 번 더 고칩니다.

```python
    print(f"✅ 등록 완료: {text}")
```

```bash
git add todo.py
git commit -m "feat: 등록 메시지에 아이콘 추가"
```

이제 **아래 커밋**을 되돌리려 하면 충돌합니다.

```bash
git revert 3f9a2e7
```

실행 결과:

```
Auto-merging todo.py
CONFLICT (content): Merge conflict in todo.py
error: could not revert 3f9a2e7... feat: 등록 완료 메시지로 변경
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run "git revert --continue".
hint: You can instead skip this commit with "git revert --skip".
hint: To abort and get back to the state before "git revert",
hint: run "git revert --abort".
```

[11강](lesson-11.md)과 동일하게 처리합니다.

```python
    print(f"[추가] 할 일이 등록되었습니다: {text}")
```

```bash
git add todo.py
git revert --continue
git push
```

**세 가지 선택지**

| 명령 | 뜻 |
|---|---|
| `git revert --continue` | 해결했다. 계속 |
| `git revert --skip` | 이 커밋 되돌리기는 건너뛴다 |
| `git revert --abort` | 전부 취소 |

### Step 6. 강제 push의 안전한 사용

**아직 push하지 않은 커밋**은 `reset` 이 더 깔끔합니다. 비교해 봅니다.

```bash
echo "임시" > temp.txt
git add temp.txt
git commit -m "chore: 임시 파일"
git log --oneline -1
```

**아직 push 안 했으니 reset**

```bash
git reset --hard HEAD~1
git log --oneline -1        # 커밋이 사라짐
```

**이제 push한 경우를 만들어 봅니다.**

```bash
echo "실험" > exp.txt
git add exp.txt
git commit -m "chore: 실험 파일"
git push
```

**push했으니 revert**

```bash
git revert HEAD --no-edit
git push
```

**강제 push가 필요한 경우** — 개인 브랜치를 rebase했을 때입니다.

```bash
git switch -c feature/force-demo
echo "A" > a.txt && git add a.txt && git commit -m "chore: A"
echo "B" > b.txt && git add b.txt && git commit -m "chore: B"
git push -u origin feature/force-demo

# 커밋 메시지를 고침 (이력 재작성)
git commit --amend -m "chore: B 파일 추가"
git push
```

실행 결과:

```
 ! [rejected]        feature/force-demo -> feature/force-demo (non-fast-forward)
```

```bash
git push --force-with-lease
```

실행 결과:

```
To https://github.com/hong-gildong/todo-app.git
 + 7d1a3e9...4c8f2b1 feature/force-demo -> feature/force-demo (forced update)
```

**안전장치 작동 확인** — 원격에 다른 변경이 있는 상황을 만들어 봅니다.

```bash
cd ~/Desktop/todo-app-teammate
git fetch
git switch feature/force-demo
echo "팀원 작업" > teammate.txt
git add teammate.txt
git commit -m "chore: 팀원이 추가한 파일"
git push
```

```bash
cd ~/Desktop/todo-app
git commit --amend -m "chore: B 파일 추가 (재수정)"
git push --force-with-lease
```

실행 결과:

```
 ! [rejected]        feature/force-demo -> feature/force-demo (stale info)
error: failed to push some refs to 'https://github.com/hong-gildong/todo-app.git'
```

**막혔습니다.** `--force` 였다면 팀원의 커밋이 사라졌을 것입니다.

```bash
git fetch
git log --oneline HEAD..origin/feature/force-demo
```

실행 결과:

```
2e7c9f4 chore: 팀원이 추가한 파일
```

**남의 커밋이 있으니 덮어쓰면 안 됩니다.** 확인하고 합칩니다.

```bash
git pull --rebase
git push --force-with-lease
```

정리합니다.

```bash
git switch main
git push origin --delete feature/force-demo
git branch -D feature/force-demo
git restore .
```

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code / GitHub |
|---|---|
| revert | **Git Graph** 확장 → 커밋 우클릭 → **Revert** |
| PR 통째로 되돌리기 | GitHub PR 화면 하단 **`Revert`** 버튼 → 자동으로 revert PR 생성 |
| reset | Git Graph → 커밋 우클릭 → **Reset current branch to this Commit** |

> **GitHub의 PR Revert 버튼**이 특히 편합니다. 눌러 보면 revert 커밋이 담긴 **새 PR**을 만들어 주므로, 리뷰를 거쳐 안전하게 되돌릴 수 있습니다.
> Squash로 병합한 PR이라면 커밋 하나만 되돌리면 되므로 함정도 없습니다.

---

## ⑤ 자주 하는 실수

### push한 커밋을 `reset` 하고 `--force`

```bash
git reset --hard HEAD~1
git push --force            # 🚨
```

**증상** — 팀원이 `pull` 할 때 이상한 충돌이 나거나, 그 사이 팀원이 올린 커밋이 사라집니다.
**해결** — 사고가 났다면 **즉시 팀에 알리고** 복구하세요.

```bash
git reflog                     # 지우기 전 위치 찾기
git reset --hard <원래 해시>
git push --force-with-lease
```

팀원 쪽에서는 이렇게 확인합니다.

```bash
git reflog                     # 본인 로컬에 남아 있는 커밋 확인
```

**예방** — `main` 브랜치 보호에서 **`Allow force pushes` 를 해제**하세요 ([13강](lesson-13.md)).

### 머지 revert 후 다시 병합했는데 아무것도 안 들어옴

```
Already up to date.
```

**원인** — ③에서 설명한 함정입니다. Git은 그 커밋들을 **이미 병합됨**으로 봅니다.
**해결** —

```bash
git revert <revert 커밋 해시>     # revert 를 revert
```

또는 브랜치를 rebase해서 새 커밋으로 만듭니다.

```bash
git switch feature/x
git rebase main
git switch main
git merge feature/x
```

**예방** — PR을 **Squash and merge** 로 병합하면 이 문제가 생기지 않습니다.

### `-m` 없이 머지 커밋 revert

```
error: commit 6c4e8b3... is a merge but no -m option was given.
fatal: revert failed
```

**원인** — 부모가 둘이라 기준을 정해 줘야 합니다.
**해결** —

```bash
git revert -m 1 6c4e8b3
```

부모를 확인하려면:

```bash
git log --oneline --parents -1 6c4e8b3
```

실행 결과:

```
6c4e8b3 9f3b1e8 1f7d3a9 Merge branch 'feature/tags'
   │       │        └── 부모 2 (feature 쪽)
   │       └── 부모 1 (main 쪽)  ← -m 1
   └── 머지 커밋
```

### revert 커밋 메시지를 그대로 둠

```
Revert "Revert "Revert "feat: 기능 추가"""
```

**원인** — `--no-edit` 만 반복해서 썼습니다.
**해결** — push 전이라면 다듬으세요.

```bash
git commit --amend -m "feat: 기능 재도입 (확인 절차 추가 후)"
```

**되돌리는 이유를 본문에 쓰는 습관**이 중요합니다. 6개월 뒤에 "이거 왜 되돌렸지?" 를 답할 수 있어야 합니다.

### `git reset --hard origin/main` 을 아무 때나 실행

**증상** — 커밋하지 않은 작업이 전부 사라집니다.
**원인** — `--hard` 는 작업 디렉터리까지 덮어씁니다 ([07강](lesson-07.md)).
**해결** — 실행 전에 반드시 확인하세요.

```bash
git status              # 커밋 안 된 변경이 있는지
git stash -u            # 있으면 일단 보관 (16강)
git reset --hard origin/main
```

> 이 명령 자체는 **"원격 상태로 완전히 맞추기"** 에 유용합니다. 로컬이 꼬였을 때 자주 씁니다.
> 다만 **커밋 안 한 것은 복구되지 않습니다.**

### `--force-with-lease` 가 거부되는데 계속 시도

```
 ! [rejected]        feature/x -> feature/x (stale info)
```

**원인** — 원격에 내가 모르는 변경이 있습니다. **안전장치가 정상 작동한 것입니다.**
**해결** — `--force` 로 뚫지 말고 확인부터 하세요.

```bash
git fetch
git log --oneline HEAD..origin/feature/x
```

- 남의 커밋 → **덮어쓰면 안 됩니다.** `git pull --rebase` 로 흡수
- 내가 다른 기기에서 올린 것 → 확인 후 다시 시도

> ⚠️ **주의** — `git fetch` 만 해도 `--force-with-lease` 의 기준이 갱신되어 통과됩니다.
> 그래서 **`git fetch` 후 무조건 force** 하는 습관은 안전장치를 무력화합니다. **반드시 내용을 확인**하세요.
> Git 2.30 이상이라면 `--force-if-includes` 를 함께 쓰면 이 허점까지 막힙니다.

### revert 충돌이 무서워서 그냥 둠

**원인** — 되돌리려는 부분이 이후에 또 바뀌었습니다.
**해결** — 일반 충돌과 똑같습니다. 겁내지 말고 처리하세요.

```bash
git revert --abort      # 일단 물러서고 상황 파악
git log -p <되돌릴 커밋>  # 무엇을 되돌리는지 확인
git revert <커밋>        # 다시 시도
```

---

## ⑥ 확인 문제

**1.** 아래 각 상황에서 `reset` 과 `revert` 중 무엇을 쓸까요? 명령까지 적어 보세요.

```
ⓐ 방금 커밋했는데 오타를 발견했다. 아직 push 안 함.
ⓑ 어제 push한 커밋에 버그가 있다. 팀원 3명이 이미 pull 했다.
ⓒ 로컬에서 실험용 커밋 5개를 만들었는데 전부 버리고 싶다. push 안 함.
ⓓ 지난주 병합한 PR을 통째로 되돌려야 한다.
```

<details>
<summary>답 보기</summary>

**ⓐ → `reset` (또는 `--amend`)**

```bash
git commit --amend -m "올바른 메시지"      # 메시지만 고칠 때
# 또는
git reset --soft HEAD~1                    # 커밋 취소, 변경은 유지
```

push 전이므로 이력을 다시 써도 아무 문제 없습니다.

**ⓑ → `revert`**

```bash
git revert <커밋 해시>
git push
```

팀원이 이미 받아 갔으므로 이력을 바꾸면 안 됩니다. **황금률.**

**ⓒ → `reset`**

```bash
git reset --hard HEAD~5       # ⚠️ 커밋 안 한 변경도 사라짐
```

먼저 `git status` 로 확인하고, 아까운 것이 있으면 `git stash -u` 로 빼 두세요.
잘못 지웠다면 `git reflog` 로 복구할 수 있습니다.

**ⓓ → `revert -m 1`**

```bash
git revert -m 1 <머지 커밋 해시>
git push
```

또는 **GitHub PR 화면의 `Revert` 버튼**을 쓰면 revert PR을 자동으로 만들어 줍니다.

⚠️ **함정 주의** — 이 PR을 나중에 다시 살리려면 **revert를 revert**해야 합니다.

**판단 기준 한 줄**
```
push 했나?  →  했으면 revert, 안 했으면 reset
```
</details>

**2.** 팀원이 이렇게 보고합니다. **"`feature/login` 을 `main` 에 병합했다가 revert했는데, 버그를 고치고 다시 병합하니 `Already up to date` 가 뜹니다."** 원인과 해결책은?

<details>
<summary>답 보기</summary>

**원인 — 머지 revert의 함정입니다.**

`git revert -m 1` 은 **파일 내용만 되돌립니다.** "이 브랜치를 병합했다"는 **이력은 그대로 남습니다.**

```
main:  A ── B ──── M ──── M'
                  ╱       (M' = M 의 내용 취소)
feature:   X ── Y

Git 의 판단: "X, Y 는 M 을 통해 이미 병합됨"  →  Already up to date
```

Git은 **커밋 단위로 병합 여부를 판단**하기 때문에, 내용이 되돌려졌다는 사실을 알지 못합니다.

**해결책 ① revert를 revert (권장)**

```bash
git switch main
git revert <M' 의 해시>      # 취소를 취소 → 원래 기능이 되살아남
# 그 뒤 버그 수정을 별도 커밋으로
git switch feature/login
# ... 버그 수정 ...
git switch main
git merge feature/login
```

**해결책 ② 브랜치를 rebase해서 새 커밋으로**

```bash
git switch feature/login
git rebase main              # 해시가 바뀌어 "새 커밋"이 됨
# 버그 수정 후
git switch main
git merge feature/login
```

**해결책 ③ 새 브랜치로 다시 시작**

```bash
git switch -c feature/login-v2 feature/login
git rebase main
```

**예방책**

PR을 **Squash and merge** 로 병합하세요 ([14강](lesson-14.md)). `main` 에 일반 커밋 하나만 생기므로

- 되돌리기: `git revert <커밋 하나>`
- 다시 넣기: 새 브랜치에서 새 커밋으로

함정 자체가 생기지 않습니다.
</details>

**3.** `git push --force` 와 `git push --force-with-lease` 의 차이를 설명하고, **`--force-with-lease` 도 완벽하지 않은 이유**를 말해 보세요.

<details>
<summary>답 보기</summary>

**차이**

| | `--force` | `--force-with-lease` |
|---|---|---|
| 조건 | **무조건** 덮어씀 | 원격이 **내가 마지막으로 본 상태**와 같을 때만 |
| 남의 커밋 | 소실 🚨 | 거부됨 (`stale info`) |

```
원격:  A ── B ── C ── D        (D 는 팀원이 방금 올림)
나:    A ── B ── C'            (C 를 amend)

--force            →  D 가 사라짐 🚨
--force-with-lease →  거부. "내가 알던 원격은 C 였는데 D 가 생겼다"
```

**`--force-with-lease` 의 허점**

기준이 되는 것은 **내 로컬의 `origin/main` 값**입니다. 그런데 `git fetch` 를 하면 이 값이 **자동으로 갱신됩니다.**

```bash
git fetch                       # origin/main 이 최신으로 갱신됨
git push --force-with-lease     # "내가 아는 값 = 원격 값" 이 되어 통과!
```

**내용을 보지도 않고 fetch만 했는데 안전장치가 풀립니다.** 그래서 이런 습관은 위험합니다.

```bash
git fetch && git push --force-with-lease      # ❌ 안전장치 무력화
```

**올바른 사용**

```bash
git fetch
git log --oneline HEAD..origin/feature/x      # 무엇이 왔는지 반드시 확인
git diff HEAD origin/feature/x                # 내용까지 확인
# 확인 후 판단
git push --force-with-lease
```

**더 강한 옵션 (Git 2.30+)**

```bash
git push --force-with-lease --force-if-includes
```

`--force-if-includes` 는 **원격의 최신 커밋을 내가 실제로 로컬 이력에 반영했는지**까지 검사합니다. fetch만 하고 확인 안 한 경우를 걸러냅니다.

**가장 확실한 예방**

- 브랜치 보호 규칙에서 **`Allow force pushes` 해제** ([13강](lesson-13.md))
- 공유 브랜치에는 **애초에 force push하지 않기**
- 별칭 등록으로 `--force` 를 손에서 멀어지게 하기

```bash
git config --global alias.pushf "push --force-with-lease --force-if-includes"
```
</details>

---

## 오늘의 정리

| 명령 | 하는 일 |
|---|---|
| `git revert <해시>` | **취소하는 새 커밋** 생성 |
| `git revert --no-edit <해시>` | 기본 메시지로 바로 |
| `git revert -n <해시>...` | 커밋하지 않고 적용만 (여러 개를 하나로) |
| `git revert -m 1 <머지커밋>` | **머지 커밋 되돌리기** |
| `git revert --continue` / `--abort` | 충돌 시 |
| `git reset --hard <해시>` | 이력 되감기 (push 전에만) 🚨 |
| `git push --force-with-lease` | 안전한 강제 push |
| `git log --oneline --parents -1 <해시>` | 머지 커밋의 부모 확인 |

**reset vs revert**

| | reset | revert |
|---|---|---|
| 이력 | 되감음 (사라짐) | 커밋 추가 (남음) |
| push 후 | 🚨 금지 | ✅ 안전 |

```
push 전  →  reset
push 후  →  revert
```

**머지 revert의 함정**

```
병합 → revert → 다시 병합  ⇒  "Already up to date" (아무것도 안 들어옴)

해결:  revert 를 revert  또는  브랜치를 rebase
예방:  PR 을 Squash and merge 로 병합
```

**force push**

```
--force              🚨 무조건 덮어씀. 쓰지 마세요
--force-with-lease   ✅ 원격이 내가 아는 상태일 때만
--force-if-includes  ✅✅ 실제로 받아 봤는지까지 확인
```

**오늘 반드시 기억할 한 가지**
> **push했으면 `revert`.** 이력을 지우지 않고 취소분을 더하는 것이 협업에서 유일하게 안전한 방법입니다.
> 그리고 강제 push는 **항상 `--force-with-lease`**, 그전에 **무엇이 왔는지 반드시 확인**하세요.

**과제**
1. 커밋을 하나 push한 뒤 `git revert` 로 되돌리고, 원본 커밋이 이력에 남아 있는 것을 확인하세요.
2. 그 revert 커밋을 다시 `revert` 해서 기능이 되살아나는 것을 확인하세요.
3. 커밋 3개 중 **가운데 것만** 되돌려 보세요.
4. `--no-ff` 로 병합한 뒤 `git revert -m 1` 로 되돌리고, **다시 병합했을 때 `Already up to date` 가 뜨는 함정**을 직접 재현하세요. 그리고 해결하세요.
5. 개인 브랜치를 `--amend` 로 고친 뒤 `--force-with-lease` 로 push하고, 팀원 폴더에서 커밋을 올린 뒤 다시 시도해 **거부되는 것**을 확인하세요.

---

[← 이전 16강](lesson-16.md) · [목차](README.md) · [다음 → 18강 히스토리 정리](lesson-18.md)
