# 18강 · 히스토리 정리

> **Git 학습 매뉴얼** · 🟡 중급 · **18강 / 30**
> [← 이전 17강](lesson-17.md) · [목차](README.md) · [다음 → 19강 태그와 릴리스](lesson-19.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git rebase -i` 로 커밋을 합치고, 메시지를 고치고, 순서를 바꾸고, 삭제할 수 있다.
- `squash` 와 `fixup` 의 차이를 알고 골라 쓸 수 있다.
- `--fixup` + `--autosquash` 로 수정 커밋을 자동으로 흡수시킬 수 있다.
- 커밋 하나를 여러 개로 쪼갤 수 있다.
- `.gitattributes` 로 이력을 지저분하게 만드는 원인을 차단할 수 있다.

---

## ② 왜 필요한가

[15강](lesson-15.md)에서 **커밋을 잘 나누는 법**을 배웠습니다. 하지만 아무리 조심해도 작업하다 보면 이렇게 됩니다.

```
9f3b1e8 fix: 오타 2
5a1f8d2 feat: 로그인 검증 추가
3e9c4b7 fix: 오타
7d2a6f1 feat: 로그인 폼 추가
```

`fix: 오타` 커밋 두 개는 **`main` 에 남길 이유가 없습니다.** 각각 앞의 기능 커밋에 흡수돼야 맞습니다.

리뷰를 받다 보면 더 심해집니다 ([14강](lesson-14.md)).

```
b2c8e4f 리뷰 반영 3
7a3d9c1 리뷰 반영 2
4e1f8b5 리뷰 반영
5a1f8d2 feat: 로그인 검증 추가
```

**`rebase -i`(interactive rebase)** 는 이런 이력을 **PR을 올리기 전에** 깔끔하게 정리하는 도구입니다.

> **[12강](lesson-12.md)의 황금률은 여기서도 유효합니다.**
> `rebase -i` 는 커밋을 다시 씁니다. **아직 push하지 않았거나, push했더라도 나만 쓰는 브랜치**에서만 하세요.
>
> "그럼 Squash and merge([14강](lesson-14.md))를 쓰면 되지 않나요?" — 맞습니다. Squash는 **PR 전체를 커밋 하나**로 만듭니다.
> `rebase -i` 는 **커밋을 3개로 남기되 잡동사니만 정리**하고 싶을 때 씁니다. 둘은 목적이 다릅니다.

---

## ③ 개념 설명

### `git rebase -i` 의 동작

```bash
git rebase -i HEAD~4      # 최근 4개 커밋을 대상으로
```

편집기가 열리고 **할 일 목록(todo list)** 이 나타납니다.

```
pick 7d2a6f1 feat: 로그인 폼 추가
pick 3e9c4b7 fix: 오타
pick 5a1f8d2 feat: 로그인 검증 추가
pick 9f3b1e8 fix: 오타 2
```

> ⚠️ **순서가 `git log` 와 반대입니다.**
> `git log` 는 최신이 위, 이 목록은 **오래된 것이 위**입니다. 위에서 아래로 실행되기 때문입니다.

이 목록의 `pick` 을 다른 명령으로 바꾸고 저장하면, Git이 **위에서부터 하나씩 실행**합니다.

### 명령 8종

| 명령 | 축약 | 하는 일 |
|---|---|---|
| `pick` | `p` | 그대로 사용 (기본값) |
| **`reword`** | `r` | **메시지만 수정** |
| **`edit`** | `e` | 여기서 **멈춤** (내용 수정·쪼개기) |
| **`squash`** | `s` | **앞 커밋에 합침** (메시지도 합침) |
| **`fixup`** | `f` | 앞 커밋에 합침 (**이 커밋 메시지는 버림**) |
| `drop` | `d` | **커밋 삭제** |
| `break` | `b` | 이 지점에서 멈춤 |
| `exec` | `x` | 명령 실행 (예: 테스트) |

**줄을 지우는 것 = `drop`** 과 같습니다. 그래서 실수로 줄을 지우면 커밋이 사라집니다.

```
# If you remove a line here THAT COMMIT WILL BE LOST.
```

**전부 지우면 rebase가 취소됩니다.** 빠져나오고 싶을 때 쓸 수 있는 방법입니다.

### `squash` 와 `fixup`

가장 많이 쓰는 두 명령입니다. 차이는 **메시지 처리**뿐입니다.

```
pick   7d2a6f1 feat: 로그인 폼 추가
squash 3e9c4b7 fix: 오타
```

→ 편집기가 열리고 **두 메시지를 합쳐서** 새로 쓸 수 있습니다.

```
# This is a combination of 2 commits.
# This is the 1st commit message:

feat: 로그인 폼 추가

# This is the commit message #2:

fix: 오타
```

```
pick  7d2a6f1 feat: 로그인 폼 추가
fixup 3e9c4b7 fix: 오타
```

→ **아무것도 안 물어봅니다.** `feat: 로그인 폼 추가` 만 남고 `fix: 오타` 는 버려집니다.

| | `squash` | `fixup` |
|---|---|---|
| 메시지 | 합쳐서 편집 | **앞 것만 유지** |
| 편집기 | 열림 | 안 열림 |
| 언제 | 두 커밋 다 의미가 있을 때 | **오타·리뷰 반영처럼 버려도 될 때** |

> 실무에서는 **`fixup` 을 훨씬 많이 씁니다.** `오타 수정`, `리뷰 반영` 같은 메시지는 남길 가치가 없습니다.

### `--fixup` + `--autosquash` — 자동화

`rebase -i` 를 열어 손으로 `fixup` 을 타이핑하는 대신, **커밋할 때 미리 표시**해 둘 수 있습니다.

```bash
git commit --fixup 7d2a6f1
```

`fixup! feat: 로그인 폼 추가` 라는 메시지의 커밋이 만들어집니다.

나중에:

```bash
git rebase -i --autosquash HEAD~4
```

**할 일 목록이 이미 정리된 상태로 열립니다.**

```
pick  7d2a6f1 feat: 로그인 폼 추가
fixup 3e9c4b7 fixup! feat: 로그인 폼 추가      ← 자동으로 위치와 명령이 배치됨
pick  5a1f8d2 feat: 로그인 검증 추가
```

저장만 하면 끝입니다. 항상 이렇게 동작하게 하려면:

```bash
git config --global rebase.autosquash true
```

> **중급에서 가장 실용적인 조합**입니다. 리뷰 반영할 때 `--fixup` 으로 커밋해 두면, 병합 직전에 한 번에 정리됩니다.

### `edit` — 커밋 하나를 쪼개기

`edit` 을 만나면 rebase가 **그 커밋을 적용한 상태로 멈춥니다.**

```bash
git rebase -i HEAD~3
# 쪼갤 커밋을 edit 으로 변경
```

```
Stopped at 5a1f8d2...  feat: 로그인 검증 추가
You can amend the commit now, with

  git commit --amend

Once you are satisfied with your changes, run

  git rebase --continue
```

여기서 할 수 있는 일:

```bash
git commit --amend              # 내용·메시지 수정
git reset HEAD~1                # 커밋을 풀어서 다시 나누기 (15강의 add -p)
git rebase --continue           # 끝나면 계속
```

### `exec` — 각 커밋마다 검사 실행

```
pick 7d2a6f1 feat: 로그인 폼 추가
exec python -m pytest
pick 5a1f8d2 feat: 로그인 검증 추가
exec python -m pytest
```

**각 커밋 시점에서 테스트가 통과하는지** 확인할 수 있습니다. 한 번에 걸고 싶다면:

```bash
git rebase -i --exec "python -m pytest" HEAD~4
```

> [15강](lesson-15.md)에서 말한 **"각 커밋이 독립적으로 동작해야 한다"** 를 검증하는 방법입니다.
> [25강](lesson-25.md)의 `git bisect` 를 제대로 쓰려면 이 조건이 필요합니다.

---

## ④ 단계별 실습

### Step 1. 지저분한 이력 만들기

```bash
cd ~/Desktop/todo-app
git switch main
git pull
git switch -c feature/history-practice
```

**일부러 정리가 필요한 커밋들**을 만듭니다.

```bash
cat >> todo.py << 'EOF'


def rename(index, new_text):
    todos = load()
    if 1 <= index <= len(todos):
        old = todos[index - 1]["text"]
        todos[index - 1]["text"] = new_text
        save(todos)
        print(f"변경: {old} -> {new_text}")
EOF
git add todo.py
git commit -m "feat: 할 일 이름 변경 기능 추가"
```

```bash
echo "- \`rename(번호, 새이름)\`" >> README.md
git add README.md
git commit -m "docs: rename 사용법"
```

오타를 냈다가 고칩니다.

```bash
sed -i 's/변경:/이름 변경:/' todo.py
git add todo.py
git commit -m "오타"
```

```bash
echo "  (완료된 항목도 변경 가능)" >> README.md
git add README.md
git commit -m "오타2"
```

```bash
git log --oneline -4
```

실행 결과:

```
9f3b1e8 (HEAD -> feature/history-practice) 오타2
3e9c4b7 오타
5a1f8d2 docs: rename 사용법
7d2a6f1 feat: 할 일 이름 변경 기능 추가
```

**`오타`, `오타2` 는 남길 가치가 없습니다.** 그리고 순서도 뒤엉켰습니다.

### Step 2. `rebase -i` 로 정리하기

```bash
git rebase -i HEAD~4
```

편집기가 열립니다.

```
pick 7d2a6f1 feat: 할 일 이름 변경 기능 추가
pick 5a1f8d2 docs: rename 사용법
pick 3e9c4b7 오타
pick 9f3b1e8 오타2

# Rebase 8d3f1a9..9f3b1e8 onto 8d3f1a9 (4 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup [-C | -c] <commit> = like "squash" but keep only the previous
#                    commit's log message
# d, drop <commit> = remove commit
# ...
# If you remove a line here THAT COMMIT WILL BE LOST.
```

**아래처럼 고칩니다.** `오타` 는 코드 커밋에, `오타2` 는 문서 커밋에 붙여야 하므로 **순서도 바꿉니다.**

```
pick  7d2a6f1 feat: 할 일 이름 변경 기능 추가
fixup 3e9c4b7 오타
pick  5a1f8d2 docs: rename 사용법
fixup 9f3b1e8 오타2
```

저장하고 닫습니다.

실행 결과:

```
Successfully rebased and updated refs/heads/feature/history-practice.
```

```bash
git log --oneline -2
```

실행 결과:

```
4c8f2b1 (HEAD -> feature/history-practice) docs: rename 사용법
2e7c9f4 feat: 할 일 이름 변경 기능 추가
```

**커밋 4개가 2개로 정리됐습니다.** 내용은 그대로인지 확인해 봅시다.

```bash
git show 2e7c9f4 --stat
```

실행 결과:

```
 todo.py | 10 ++++++++++
 1 file changed, 10 insertions(+)
```

오타 수정까지 흡수된 상태로 하나의 커밋이 됐습니다.

### Step 3. `reword` — 메시지 다듬기

```bash
git rebase -i HEAD~2
```

```
pick   2e7c9f4 feat: 할 일 이름 변경 기능 추가
reword 4c8f2b1 docs: rename 사용법
```

저장하면 두 번째 커밋의 메시지 편집기가 열립니다.

```
docs: rename 사용법
```

이렇게 고칩니다.

```
docs: 할 일 이름 변경 기능 사용법 추가

완료된 항목도 이름을 바꿀 수 있다는 점을 함께 명시했다.
```

저장하고 닫습니다.

```bash
git log --oneline -2
```

실행 결과:

```
8b3e1d7 (HEAD -> feature/history-practice) docs: 할 일 이름 변경 기능 사용법 추가
2e7c9f4 feat: 할 일 이름 변경 기능 추가
```

### Step 4. `--fixup` + `--autosquash` (실무에서 가장 유용)

리뷰를 받고 수정하는 상황을 재현합니다.

```bash
git log --oneline -2
```

`2e7c9f4` (기능 커밋)에 대한 수정이 필요하다고 합시다.

```bash
sed -i 's/if 1 <= index <= len(todos):/if 1 <= index <= len(todos) and new_text.strip():/' todo.py
git add todo.py
git commit --fixup 2e7c9f4
```

실행 결과:

```
[feature/history-practice 6d4a8f2] fixup! feat: 할 일 이름 변경 기능 추가
 1 file changed, 1 insertion(+), 1 deletion(-)
```

```bash
git log --oneline -3
```

실행 결과:

```
6d4a8f2 (HEAD -> feature/history-practice) fixup! feat: 할 일 이름 변경 기능 추가
8b3e1d7 docs: 할 일 이름 변경 기능 사용법 추가
2e7c9f4 feat: 할 일 이름 변경 기능 추가
```

**메시지에 `fixup!` 이 붙었습니다.** 이제 자동 정리합니다.

```bash
git rebase -i --autosquash HEAD~3
```

편집기가 **이미 정리된 상태**로 열립니다.

```
pick  2e7c9f4 feat: 할 일 이름 변경 기능 추가
fixup 6d4a8f2 fixup! feat: 할 일 이름 변경 기능 추가
pick  8b3e1d7 docs: 할 일 이름 변경 기능 사용법 추가
```

> **순서까지 자동으로 옮겨졌습니다.** 손댈 것 없이 저장만 하면 됩니다.

```bash
git log --oneline -2
```

실행 결과:

```
1a9c7e3 (HEAD -> feature/history-practice) docs: 할 일 이름 변경 기능 사용법 추가
5f2d8b6 feat: 할 일 이름 변경 기능 추가
```

기본값으로 설정해 둡니다.

```bash
git config --global rebase.autosquash true
```

> 이제 `git rebase -i` 만 쳐도 `--autosquash` 가 적용됩니다.
> 리뷰 반영은 `git commit --fixup <해시>`, 병합 직전에 `git rebase -i` — 이 흐름이 실무의 표준입니다.

### Step 5. `edit` 으로 커밋 쪼개기

커밋 하나에 두 가지가 섞여 있는 상황을 만듭니다.

```bash
cat >> todo.py << 'EOF'


def stats():
    todos = load()
    print(f"총 {len(todos)}개")


def clear_all():
    save([])
    print("전체 삭제 완료")
EOF
git add todo.py
git commit -m "feat: 통계와 전체 삭제 기능 추가"
```

**두 기능이 한 커밋에 있습니다.** 나눕니다.

```bash
git rebase -i HEAD~1
```

```
edit 3c7f9a1 feat: 통계와 전체 삭제 기능 추가
```

저장하면 멈춥니다.

```
Stopped at 3c7f9a1...  feat: 통계와 전체 삭제 기능 추가
You can amend the commit now, with

  git commit --amend

Once you are satisfied with your changes, run

  git rebase --continue
```

```bash
git status
```

실행 결과:

```
interactive rebase in progress; onto 1a9c7e3
Last command done (1 command done):
   edit 3c7f9a1 feat: 통계와 전체 삭제 기능 추가
No commands remaining.
You are currently editing a commit while rebasing branch 'feature/history-practice' on '1a9c7e3'.
  (use "git commit --amend" to amend the current commit)
  (use "git rebase --continue" once you are satisfied with your changes)

nothing to commit, working tree clean
```

**커밋을 풀어서 다시 나눕니다.**

```bash
git reset HEAD~1        # 커밋 취소, 변경은 작업 디렉터리에 남김
git status
```

실행 결과:

```
Changes not staged for commit:
	modified:   todo.py
```

[15강](lesson-15.md)에서 배운 `add -p` 로 나눠 담습니다.

```bash
git add -p todo.py
```

`stats` 부분만 담고(`s` 로 쪼갠 뒤 `y`, `n`), 커밋합니다.

```bash
git commit -m "feat: 할 일 통계 출력 기능 추가"
git add todo.py
git commit -m "feat: 전체 삭제 기능 추가"
git rebase --continue
```

실행 결과:

```
Successfully rebased and updated refs/heads/feature/history-practice.
```

```bash
git log --oneline -4
```

실행 결과:

```
7e2b9d5 (HEAD -> feature/history-practice) feat: 전체 삭제 기능 추가
4a8c1f3 feat: 할 일 통계 출력 기능 추가
1a9c7e3 docs: 할 일 이름 변경 기능 사용법 추가
5f2d8b6 feat: 할 일 이름 변경 기능 추가
```

**커밋 하나가 둘로 쪼개졌습니다.**

### Step 6. `drop` 과 순서 바꾸기

```bash
echo "테스트용 파일" > junk.txt
git add junk.txt
git commit -m "chore: 테스트용 파일 (지울 것)"

git rebase -i HEAD~3
```

```
pick 4a8c1f3 feat: 할 일 통계 출력 기능 추가
pick 7e2b9d5 feat: 전체 삭제 기능 추가
drop 9b5e2c8 chore: 테스트용 파일 (지울 것)
```

저장하면 그 커밋이 통째로 사라집니다.

```bash
ls junk.txt
```

실행 결과:

```
ls: cannot access 'junk.txt': No such file or directory
```

**순서를 바꾸려면** 목록의 줄 순서를 바꾸면 됩니다.

```
pick 7e2b9d5 feat: 전체 삭제 기능 추가        ← 위아래 순서 교체
pick 4a8c1f3 feat: 할 일 통계 출력 기능 추가
```

> ⚠️ **순서를 바꾸면 충돌이 날 수 있습니다.** 서로 의존하는 커밋이라면 특히 그렇습니다.
> 충돌은 [12강](lesson-12.md)의 rebase 충돌과 동일하게 처리합니다: 해결 → `git add` → `git rebase --continue`

### Step 7. 정리하고 병합

```bash
git log --oneline -4
git switch main
git merge --no-ff feature/history-practice
git push
git branch -d feature/history-practice
```

**이미 push한 브랜치를 정리했다면** 강제 push가 필요합니다 ([17강](lesson-17.md)).

```bash
git push --force-with-lease
```

### Step 8. 덧붙임 — `.gitattributes` 로 잡음 차단

이력이 지저분해지는 원인이 커밋 습관만은 아닙니다. **줄바꿈과 파일 형식** 때문에 의미 없는 diff가 생기는 경우가 많습니다 ([02강](lesson-02.md)).

`.gitattributes` 를 저장소 루트에 두면 **팀 전체에 규칙이 강제**됩니다. 개인의 `core.autocrlf` 설정보다 우선합니다.

```gitattributes
# 기본: 텍스트 파일은 저장소에 LF 로 저장
* text=auto

# 명시적 지정
*.py    text eol=lf
*.js     text eol=lf
*.md     text eol=lf
*.json   text eol=lf
*.sh     text eol=lf
*.bat    text eol=crlf
*.ps1    text eol=crlf

# 바이너리 — 병합·diff 시도하지 않음
*.png    binary
*.jpg    binary
*.pdf    binary
*.xlsx   binary
*.zip    binary

# diff 를 보기 좋게 (함수 단위 인식)
*.py     diff=python
*.md     diff=markdown

# 아카이브(zip 다운로드)에서 제외
.github/     export-ignore
tests/       export-ignore
```

```bash
git add .gitattributes
git commit -m "chore: gitattributes 로 줄바꿈·바이너리 규칙 지정"
```

**기존 파일에 적용하려면** 인덱스를 갱신해야 합니다.

```bash
git add --renormalize .
git status                    # 줄바꿈만 바뀐 파일들이 나타남
git commit -m "chore: 줄바꿈 규칙 일괄 적용"
```

> ⚠️ 이 커밋은 **파일 전체가 바뀐 것처럼 보입니다.** 다른 작업과 섞지 말고 **단독 커밋**으로 만드세요.
> PR 하나에 이것만 담고, 리뷰어에게 "줄바꿈 정규화입니다"라고 알려 주면 됩니다.

**`binary` 지정의 효과** — 이미지·엑셀 파일에 대해 Git이 **무의미한 텍스트 diff를 시도하지 않고**, 병합 시 충돌 마커를 넣지 않습니다 ([11강](lesson-11.md)).

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code / GitHub |
|---|---|
| 커밋 합치기 | **Git Graph** 확장 → 커밋 우클릭 → **Interactive Rebase** (일부 기능만) |
| 마지막 커밋 수정 | Source Control `···` → Commit → **Commit Staged (Amend)** |
| PR 전체를 하나로 | **GitHub의 Squash and merge** ([14강](lesson-14.md)) |

> **`rebase -i` 는 GUI 지원이 약한 영역**입니다. 확장마다 지원 범위가 다르고 조작도 직관적이지 않습니다.
> 명령어가 오히려 빠르고 정확하니, 이건 터미널로 익히는 것을 권합니다.
>
> 반대로 **"PR 전체를 커밋 하나로"** 가 목적이라면 `rebase -i` 를 쓸 필요 없이 GitHub의 **Squash and merge** 를 쓰면 됩니다.

---

## ⑤ 자주 하는 실수

### 이미 공유한 브랜치를 `rebase -i`

**증상** — push가 거부되고, 억지로 force하면 팀원의 이력이 어긋납니다.
**원인** — [12강](lesson-12.md)의 황금률 위반입니다. `rebase -i` 는 커밋을 다시 씁니다.
**해결** —

| 브랜치 | 가능? |
|---|---|
| 아직 push 안 함 | ✅ 자유롭게 |
| push했지만 **나만 쓰는** feature 브랜치 | ✅ (`--force-with-lease`) |
| 팀원과 같이 쓰는 브랜치 | ❌ |
| `main` 등 공용 브랜치 | ❌ 절대 |

**대안** — 정리가 목적이라면 **PR을 Squash and merge** 로 병합하세요. 이력을 다시 쓰지 않고도 `main` 은 깔끔해집니다.

### 첫 번째 줄을 `squash` 로 지정

```
squash 7d2a6f1 feat: 첫 커밋      ← ❌
pick   3e9c4b7 fix: 오타
```

```
error: cannot 'squash' without a previous commit
```

**원인** — `squash` 와 `fixup` 은 **앞 커밋에 합치는** 명령입니다. 맨 위에는 합칠 대상이 없습니다.
**해결** — 첫 줄은 반드시 `pick`(또는 `reword`, `edit`, `drop`)이어야 합니다.

```
pick  7d2a6f1 feat: 첫 커밋
fixup 3e9c4b7 fix: 오타
```

### 실수로 줄을 지워서 커밋이 사라짐

**원인** — 줄 삭제 = `drop` 입니다.
**해결** — [23강](lesson-23.md)의 reflog로 복구합니다.

```bash
git reflog
```

```
1a9c7e3 HEAD@{0}: rebase (finish): returning to refs/heads/feature/x
...
9f3b1e8 HEAD@{5}: commit: 중요한 작업       ← rebase 전 위치
```

```bash
git reset --hard 9f3b1e8
```

**예방** — rebase 전에 표시를 남겨 두면 마음이 편합니다.

```bash
git branch backup-before-rebase
# rebase 수행
git branch -d backup-before-rebase        # 성공했으면 삭제
```

### rebase 도중 방치

```bash
git status
```

```
interactive rebase in progress; onto 8d3f1a9
```

**증상** — 커밋도 브랜치 전환도 안 됩니다.
**해결** —

```bash
git rebase --continue     # 마무리
git rebase --abort        # 취소
git rebase --edit-todo    # 남은 할 일 목록 다시 편집
```

> `--edit-todo` 는 **rebase 도중에 계획을 바꿀 수 있는** 유용한 명령입니다. 중간에 "아, 이건 fixup이 아니라 squash였는데" 할 때 씁니다.

### 커밋을 쪼갰더니 중간 커밋이 깨짐

**원인** — [15강](lesson-15.md)에서 다룬 문제입니다. 함수 정의와 호출부를 다른 커밋으로 나눴습니다.
**해결** — `exec` 로 검증하세요.

```bash
git rebase -i --exec "python -c 'import todo'" HEAD~4
```

각 커밋마다 실행해 보고, 실패하면 그 지점에서 멈춥니다.

### `--autosquash` 가 동작하지 않음

**원인** — 커밋 메시지가 정확히 `fixup! <원본 제목>` 이어야 합니다. 손으로 쓰면 오타가 나기 쉽습니다.
**해결** — 반드시 `git commit --fixup <해시>` 를 쓰세요. 메시지가 자동 생성됩니다.

```bash
git commit --fixup HEAD~2       # 상대 참조도 가능
git commit --squash HEAD~2      # squash 버전 (메시지를 합쳐서 편집)
```

**옵션이 안 켜져 있어서**일 수도 있습니다.

```bash
git config --global rebase.autosquash true
```

### 충돌이 커밋마다 반복돼서 지침

**원인** — 순서를 크게 바꿨거나, 같은 파일을 여러 커밋에서 고쳤습니다.
**해결** —

```bash
git config --global rerere.enabled true     # 같은 충돌 자동 재사용 (11강)
```

그래도 힘들면 `--abort` 하고 **더 작은 범위로 나눠서** 여러 번 하세요.

```bash
git rebase -i HEAD~2      # 4개를 한 번에 하지 말고 2개씩
```

### `.gitattributes` 적용 후 전체 파일이 변경으로 뜸

**원인** — 정상입니다. 줄바꿈이 정규화되면서 파일 내용이 실제로 바뀝니다.
**해결** — **단독 커밋**으로 분리하세요.

```bash
git add --renormalize .
git commit -m "chore: 줄바꿈 규칙 일괄 적용"
```

다른 작업과 섞으면 리뷰가 불가능해집니다. `git log` 에서도 나중에 이 커밋을 건너뛸 수 있게 표시해 두면 좋습니다.

> 큰 저장소라면 `.git-blame-ignore-revs` 파일에 이 커밋 해시를 적어 두면 `git blame` 에서 무시됩니다 ([25강](lesson-25.md)).

---

## ⑥ 확인 문제

**1.** 아래 이력을 **커밋 2개**로 정리하려면 `rebase -i` 목록을 어떻게 작성할까요?

```
9f3b1e8 리뷰 반영 2
5a1f8d2 리뷰 반영
3e9c4b7 docs: API 문서 추가
7d2a6f1 feat: 검색 API 구현
```

<details>
<summary>답 보기</summary>

```bash
git rebase -i HEAD~4
```

```
pick  7d2a6f1 feat: 검색 API 구현
fixup 5a1f8d2 리뷰 반영
fixup 9f3b1e8 리뷰 반영 2
pick  3e9c4b7 docs: API 문서 추가
```

**결과**

```
xxxxxxx docs: API 문서 추가
yyyyyyy feat: 검색 API 구현      (리뷰 반영 2개가 흡수됨)
```

**포인트 3가지**

1. **순서가 log와 반대** — 목록에서는 오래된 커밋이 위입니다. `7d2a6f1` 을 맨 위로 올려야 합니다.
2. **`fixup` 을 쓴 이유** — `리뷰 반영` 이라는 메시지는 남길 가치가 없습니다. `squash` 를 쓰면 편집기가 열려서 메시지를 합치라고 물어봅니다.
3. **순서를 바꿔야 함** — 리뷰 반영이 문서 커밋 뒤에 있으므로, 기능 커밋 바로 뒤로 옮겨야 흡수됩니다.

**충돌이 날 수 있습니다** — 리뷰 반영이 문서도 건드렸다면 순서를 바꿀 때 충돌합니다. 그럴 땐 해결 후 `git rebase --continue`.

**더 편한 방법** — 처음부터 이렇게 커밋했다면 자동입니다.

```bash
git commit --fixup 7d2a6f1      # "리뷰 반영" 대신
git rebase -i --autosquash HEAD~4
```
</details>

**2.** `squash` 와 `fixup` 의 차이를 설명하고, **각각 언제 쓰는지** 예를 들어 보세요.

<details>
<summary>답 보기</summary>

**차이는 메시지 처리뿐입니다.**

| | `squash` | `fixup` |
|---|---|---|
| 변경 내용 | 앞 커밋에 합침 | 앞 커밋에 합침 |
| 메시지 | **두 개를 합쳐 편집** | **앞 것만 유지, 뒤는 버림** |
| 편집기 | 열림 | 안 열림 |

**`fixup` 을 쓰는 경우 (대부분)**

```
pick  a1b2c3d feat: 로그인 기능 구현
fixup e4f5a6b 오타
fixup 7c8d9e0 리뷰 반영
fixup 1f2a3b4 세미콜론 추가
```

`오타`, `리뷰 반영` 같은 메시지는 **최종 이력에 남을 이유가 없습니다.**

**`squash` 를 쓰는 경우**

두 커밋 **모두 의미가 있어서** 메시지를 합치고 싶을 때입니다.

```
pick   a1b2c3d feat: 사용자 모델 추가
squash e4f5a6b feat: 사용자 검증 로직 추가
```

편집기에서 이렇게 합칩니다.

```
feat: 사용자 모델과 검증 로직 추가

- User 모델에 email, password 필드 추가
- 이메일 형식과 비밀번호 길이 검증 추가
```

**판단 기준 한 줄**

```
합쳐지는 커밋의 메시지를 남기고 싶은가?
  예   →  squash
  아니오 →  fixup     ← 대부분
```

**실무 팁** — 애초에 커밋할 때부터 구분해 두면 편합니다.

```bash
git commit --fixup <해시>     # 메시지 버릴 것
git commit --squash <해시>    # 메시지 합칠 것
```

둘 다 `--autosquash` 가 알아서 배치해 줍니다.
</details>

**3.** 커밋 하나에 **버그 수정**과 **새 기능**이 섞여 있습니다. 이미 커밋했지만 아직 push 전입니다. 두 개로 나누려면?

<details>
<summary>답 보기</summary>

**`rebase -i` 의 `edit` 을 씁니다.**

```bash
# ① 해당 커밋을 edit 으로 지정
git rebase -i HEAD~1        # 더 앞의 커밋이면 HEAD~3 등
```

```
edit a1b2c3d fix: 버그 수정 및 검색 기능 추가
```

```bash
# ② 커밋이 적용된 상태에서 멈춤. 커밋을 풀어 낸다
git reset HEAD~1
git status                  # 변경이 작업 디렉터리에 남아 있음

# ③ add -p 로 나눠 담기 (15강)
git add -p
#   버그 수정 부분만 y, 나머지는 n
git commit -m "fix: 빈 검색어 입력 시 전체 목록이 나오던 문제 수정"

git add .
git commit -m "feat: 검색 결과 하이라이트 기능 추가"

# ④ rebase 마무리
git rebase --continue
```

```bash
git log --oneline -3
```

```
yyyyyyy feat: 검색 결과 하이라이트 기능 추가
xxxxxxx fix: 빈 검색어 입력 시 전체 목록이 나오던 문제 수정
a0b1c2d (이전 커밋)
```

**더 간단한 경우 — 마지막 커밋이라면**

`rebase -i` 없이도 됩니다.

```bash
git reset HEAD~1            # 커밋만 취소
git add -p
git commit -m "fix: ..."
git add .
git commit -m "feat: ..."
```

**주의할 점**

- **각 커밋이 독립적으로 동작하는지** 확인하세요 ([15강](lesson-15.md)). 검증하려면:

```bash
git rebase -i --exec "python -c 'import todo'" HEAD~2
```

- **push한 뒤라면** 나만 쓰는 브랜치인지 확인하고 `--force-with-lease` 로 올려야 합니다.
- 실수가 두렵다면 미리 백업 브랜치를 만들어 두세요.

```bash
git branch backup-before-split
```
</details>

---

## 오늘의 정리

**`git rebase -i <범위>` 명령 8종**

| 명령 | 하는 일 |
|---|---|
| `pick` | 그대로 (기본) |
| `reword` | **메시지만 수정** |
| `edit` | 여기서 멈춤 (수정·쪼개기) |
| `squash` | 앞 커밋에 합침 (**메시지 합쳐서 편집**) |
| **`fixup`** | 앞 커밋에 합침 (**메시지 버림**) ← 가장 많이 씀 |
| `drop` | 삭제 (= 줄 지우기) |
| `break` | 이 지점에서 멈춤 |
| `exec` | 명령 실행 (테스트 검증) |

> ⚠️ 목록의 순서는 **`git log` 와 반대** (오래된 것이 위)
> ⚠️ 첫 줄에는 `squash` / `fixup` 을 쓸 수 없음

**자동화 조합 (실무 표준)**

```bash
git commit --fixup <해시>              # 작업 중: 수정 커밋에 표시
git rebase -i --autosquash HEAD~5      # 병합 직전: 자동 정리
```

```bash
git config --global rebase.autosquash true
git config --global rerere.enabled true
```

**진행 중 명령**

| 명령 | 하는 일 |
|---|---|
| `git rebase --continue` | 계속 |
| `git rebase --abort` | 취소 |
| `git rebase --edit-todo` | **남은 계획 다시 편집** |
| `git rebase --skip` | 이 커밋 건너뛰기 ⚠️ |

**`.gitattributes`**

```gitattributes
* text=auto              # 저장소에는 LF 로 통일
*.png binary             # 바이너리는 diff·merge 시도 안 함
*.bat text eol=crlf      # 예외 지정
```

```bash
git add --renormalize .    # 기존 파일에 적용 (단독 커밋으로!)
```

**황금률 (다시)**

```
push 전 · 나만 쓰는 브랜치  →  rebase -i 자유롭게
공유 브랜치                →  🚨 금지. 대신 Squash and merge
```

**오늘 반드시 기억할 한 가지**
> **리뷰 반영은 `git commit --fixup`, 병합 직전에 `git rebase -i`.**
> 손으로 목록을 편집하는 일이 크게 줄어듭니다.

**과제**
1. 일부러 `오타`, `수정` 같은 커밋을 섞어 만든 뒤 `rebase -i` 의 `fixup` 으로 정리하세요.
2. `reword` 로 커밋 메시지를 다듬고, `drop` 으로 커밋 하나를 삭제해 보세요.
3. `git commit --fixup <해시>` 로 커밋한 뒤 `git rebase -i --autosquash` 로 자동 정리되는 것을 확인하세요.
4. 두 가지가 섞인 커밋을 `edit` + `reset` + `add -p` 로 두 개로 쪼개세요.
5. rebase 전에 `git branch backup-...` 을 만들어 두고, 실패했을 때 되돌아가 보세요.
6. `.gitattributes` 를 만들어 커밋하고, `git add --renormalize .` 을 실행해 어떤 파일이 영향을 받는지 확인하세요.

---

[← 이전 17강](lesson-17.md) · [목차](README.md) · [다음 → 19강 태그와 릴리스](lesson-19.md)
