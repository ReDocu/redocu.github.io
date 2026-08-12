# 08강 · 브랜치 만들고 합치기

> **Git 학습 매뉴얼** · 🟢 초급 · **08강 / 30**
> [← 이전 07강](lesson-07.md) · [목차](README.md) · [다음 → 09강 GitHub에 올리기](lesson-09.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 브랜치가 **"커밋을 가리키는 이름표"** 라는 것을 그림으로 설명할 수 있다.
- 브랜치를 만들고 이동하고 삭제할 수 있다.
- `git merge` 로 브랜치를 합치고, **fast-forward 와 3-way merge** 를 구분할 수 있다.
- `git log --graph` 로 브랜치가 갈라지고 합쳐진 모양을 읽을 수 있다.

---

## ② 왜 필요한가

지금까지는 `main` 한 줄에만 커밋을 쌓았습니다. 실제 개발에서는 이런 일이 생깁니다.

**상황 1 — 새 기능을 만들다가 급한 버그가 터졌습니다.**

```
로그인 기능 절반쯤 만든 상태 (아직 동작 안 함)
        ↓
"결제가 안 됩니다! 지금 고쳐 주세요!"
        ↓
반쯤 만든 로그인 코드를 지울 수도, 그대로 배포할 수도 없음
```

**상황 2 — 두 명이 같은 프로젝트를 고칩니다.**

```
철수: 로그인 기능 작업 중
영희: 결제 화면 작업 중
        ↓
같은 곳에 커밋하면 서로의 반쪽짜리 코드가 뒤엉킴
```

**상황 3 — 두 가지 방법 중 뭐가 나을지 시험해 보고 싶습니다.**

```
A안으로 짜 보고, 별로면 B안으로... 폴더를 복사해 둘까?
```

셋 다 **브랜치**로 해결됩니다. 브랜치는 **본류를 건드리지 않고 갈라져 나와 작업하는 갈래**입니다. 완성되면 합치고, 아니면 통째로 버리면 됩니다.

그리고 브랜치는 **비싸지 않습니다.** 폴더를 복사하는 것과 달리 Git의 브랜치는 **파일 하나 만드는 수준**으로 가볍습니다. 그래서 부담 없이 만들고 지웁니다.

---

## ③ 개념 설명

### 브랜치는 "포인터"입니다

가장 중요한 개념입니다. 많은 사람이 브랜치를 **"코드 사본"** 으로 오해하는데, 실제로는 **커밋을 가리키는 이름표 하나**입니다.

```
                                    main
                                     ▼
   4b8e2d5 ──▶ 9f3c1a7 ──▶ 7c9d1e2 ──▶ 5e1d7f3
                                          ▲
                                        HEAD
```

`git branch feature` 를 하면 이렇게 됩니다.

```
                                    main
                                     ▼
   4b8e2d5 ──▶ 9f3c1a7 ──▶ 7c9d1e2 ──▶ 5e1d7f3
                                     ▲
                                  feature      ← 이름표 하나가 더 생겼을 뿐
```

**파일이 복사되지 않았습니다.** 그래서 브랜치 생성은 **즉시** 끝납니다. 커밋이 10만 개여도 마찬가지입니다.

> `.git/refs/heads/feature` 라는 파일이 하나 생기고, 그 안에는 커밋 해시 40자가 적혀 있을 뿐입니다.
> [22강](lesson-22.md)에서 직접 열어 봅니다.

### HEAD — 지금 내가 어디 있는지

**HEAD** 는 **"현재 위치"** 를 가리키는 포인터입니다. 보통 브랜치 이름을 가리킵니다.

```
   HEAD ──▶ main ──▶ 5e1d7f3
```

`git switch feature` 를 하면 HEAD가 옮겨 가고, **작업 디렉터리의 파일들이 그 브랜치의 내용으로 바뀝니다.**

```
   HEAD ──▶ feature ──▶ 5e1d7f3
```

### 커밋하면 브랜치가 따라 움직입니다

```
feature 브랜치에서 커밋 →

                              main
                               ▼
   7c9d1e2 ──▶ 5e1d7f3 ──▶ a8c3f01
                               │
                               └──▶ 3c9e2f7
                                       ▲
                                    feature ← HEAD
```

**커밋할 때마다 현재 브랜치의 이름표가 새 커밋으로 이동합니다.** `main` 은 그 자리에 그대로 있습니다.

### 두 가지 합치기 — fast-forward 와 3-way merge

**① Fast-forward (빨리 감기)**

`main` 이 갈라진 뒤로 **한 번도 커밋되지 않았다면**, Git은 그냥 이름표를 앞으로 옮깁니다.

```
합치기 전:
   A ──▶ B ──▶ C
         ▲     ▲
       main  feature

git switch main && git merge feature

합치기 후:
   A ──▶ B ──▶ C
               ▲
          main, feature      ← 이름표만 이동. 새 커밋 없음
```

> **커밋이 생기지 않습니다.** 이력이 일직선으로 남아 깔끔하지만, "여기서 브랜치를 썼다"는 흔적도 사라집니다.

**② 3-way merge (진짜 병합)**

양쪽 다 커밋이 있으면 Git은 **머지 커밋**을 새로 만듭니다.

```
합치기 전:
              ┌──▶ D ──▶ E   ← feature
   A ──▶ B ──▶ C
              └──▶ F         ← main

합치기 후:
              ┌──▶ D ──▶ E ──┐
   A ──▶ B ──▶ C             ├──▶ M   ← main (머지 커밋, 부모가 둘)
              └──▶ F ────────┘
```

**"3-way"** 인 이유는 Git이 **세 지점**을 보기 때문입니다.

| 지점 | 뜻 |
|---|---|
| **공통 조상** `C` | 갈라지기 전의 상태 |
| `E` | feature 쪽의 최종 |
| `F` | main 쪽의 최종 |

C를 기준으로 **양쪽이 각각 무엇을 바꿨는지** 비교해서 합칩니다. 서로 다른 파일이나 다른 줄을 고쳤다면 자동으로 합쳐지고, **같은 줄을 서로 다르게 고쳤다면 충돌(conflict)** 이 납니다.

> 충돌은 에러가 아니라 **"여기는 사람이 판단해 주세요"** 라는 요청입니다.
> 이번 강에서는 맛만 보고, 제대로 된 해결법은 [11강](lesson-11.md)에서 다룹니다.

### 브랜치 이름 짓기

정해진 규칙은 없지만, 널리 쓰이는 관례가 있습니다.

| 접두사 | 용도 | 예 |
|---|---|---|
| `feature/` | 새 기능 | `feature/login`, `feature/payment` |
| `fix/` 또는 `bugfix/` | 버그 수정 | `fix/login-session` |
| `hotfix/` | 운영 중 긴급 수정 | `hotfix/payment-error` |
| `docs/` | 문서 | `docs/readme-update` |
| `refactor/` | 구조 개선 | `refactor/user-model` |

**규칙**
- 소문자와 하이픈(`-`)을 씁니다. 공백은 쓸 수 없습니다.
- 한글도 되지만 **영문을 권합니다.** 터미널·CI 도구에서 문제가 생기는 경우가 있습니다.
- `/` 로 계층을 만들 수 있습니다. GUI 도구에서 폴더처럼 묶여 보입니다.

### `main` 과 `master`

예전 Git의 기본 브랜치 이름은 `master` 였고, 지금은 `main` 이 표준입니다. **기능은 완전히 같습니다.** 이름만 다릅니다. ([02강](lesson-02.md)에서 `init.defaultBranch main` 을 설정했습니다)

---

## ④ 단계별 실습

### Step 1. 브랜치 목록 보기

```bash
cd ~/Desktop/git-practice
git branch
```

실행 결과:

```
* main
```

`*` 이 **지금 있는 브랜치**입니다. 상세히 보려면:

```bash
git branch -v
```

실행 결과:

```
* main 5e1d7f3 feat: 설명 출력 추가
```

### Step 2. 브랜치 만들고 이동하기

```bash
git switch -c feature/greeting
```

실행 결과:

```
Switched to a new branch 'feature/greeting'
```

> `-c` 는 **create**입니다. `git branch feature/greeting` + `git switch feature/greeting` 을 한 번에 한 것입니다.
> 예전 방식인 `git checkout -b feature/greeting` 도 같은 뜻입니다. 오래된 문서에서 자주 보게 됩니다.

```bash
git branch
```

실행 결과:

```
* feature/greeting
  main
```

```bash
git log --oneline -1
```

실행 결과:

```
5e1d7f3 (HEAD -> feature/greeting, main) feat: 설명 출력 추가
```

**두 브랜치가 같은 커밋을 가리키고 있습니다.** 아직 아무것도 달라지지 않았습니다.

### Step 3. 브랜치에서 작업하고 커밋하기

`greeting.py` 를 고칩니다.

```python
name = input("이름을 입력하세요: ")
print("=" * 30)
print(f"  안녕하세요, {name}님!")
print(f"  Git 연습을 시작합니다")
print("=" * 30)
```

```bash
git add greeting.py
git commit -m "feat: 인사말에 테두리 장식 추가"
```

실행 결과:

```
[feature/greeting a8c3f01] feat: 인사말에 테두리 장식 추가
 1 file changed, 4 insertions(+), 3 deletions(-)
```

> `[feature/greeting ...]` — 커밋이 **어느 브랜치에** 들어갔는지 알려 줍니다.

```bash
git log --oneline --graph --all
```

실행 결과:

```
* a8c3f01 (HEAD -> feature/greeting) feat: 인사말에 테두리 장식 추가
* 5e1d7f3 (main) feat: 설명 출력 추가
* 3d9f1a4 feat: 출력 한 줄 추가
```

**`main` 은 그대로 있고 `feature/greeting` 만 앞으로 나갔습니다.**

### Step 4. 브랜치를 오가며 파일이 바뀌는 것 확인하기

이번 강에서 **가장 인상적인 실습**입니다.

```bash
git switch main
```

실행 결과:

```
Switched to branch 'main'
```

이제 `greeting.py` 를 **에디터에서 열어 보세요.**

```python
name = input("이름을 입력하세요: ")
print(f"안녕하세요, {name}님!")
print("Git 연습을 시작합니다!")
print("오늘도 화이팅")
print("=" * 20)
```

**테두리 장식이 사라졌습니다.** 파일 내용이 `main` 브랜치의 상태로 바뀐 것입니다.

```bash
git switch feature/greeting
```

다시 열어 보면 장식이 돌아와 있습니다.

> 🔑 **브랜치를 옮기면 작업 디렉터리의 파일이 실제로 바뀝니다.**
> VS Code를 열어 둔 채로 브랜치를 바꾸면 에디터의 내용도 따라 바뀝니다. 처음엔 놀라지만 정상입니다.
> 이래서 **브랜치 전환 전에는 반드시 커밋(또는 stash)** 을 해야 합니다.

### Step 5. Fast-forward 병합

`main` 으로 가서 합칩니다.

```bash
git switch main
git merge feature/greeting
```

실행 결과:

```
Updating 5e1d7f3..a8c3f01
Fast-forward
 greeting.py | 7 ++++---
 1 file changed, 4 insertions(+), 3 deletions(-)
```

**`Fast-forward`** 라고 나왔습니다. `main` 이 갈라진 뒤 커밋이 없었기 때문에 **이름표만 앞으로 옮긴 것**입니다.

```bash
git log --oneline --graph --all
```

실행 결과:

```
* a8c3f01 (HEAD -> main, feature/greeting) feat: 인사말에 테두리 장식 추가
* 5e1d7f3 feat: 설명 출력 추가
* 3d9f1a4 feat: 출력 한 줄 추가
```

**두 브랜치가 다시 같은 커밋을 가리킵니다.** 일직선입니다.

### Step 6. 다 쓴 브랜치 삭제하기

```bash
git branch -d feature/greeting
```

실행 결과:

```
Deleted branch feature/greeting (was a8c3f01).
```

> `-d` 는 **safe delete** 입니다. 아직 합쳐지지 않은 브랜치는 지우지 않고 경고합니다.
> 정말 버리려면 `-D` (대문자)를 씁니다. 이건 확인 없이 지웁니다.

**브랜치는 지워도 커밋은 남습니다.** 이름표만 없어질 뿐입니다.

```bash
git log --oneline -1
```

실행 결과:

```
a8c3f01 (HEAD -> main) feat: 인사말에 테두리 장식 추가
```

### Step 7. 3-way merge 만들어 보기

이번엔 **양쪽 모두 커밋이 있는 상황**을 만듭니다.

**① 브랜치를 만들어 작업**

```bash
git switch -c feature/farewell
echo 'print("안녕히 가세요!")' >> greeting.py
git add greeting.py
git commit -m "feat: 작별 인사 추가"
```

**② main 에서도 따로 작업** (여기가 핵심입니다)

```bash
git switch main
echo "## 작성자: 홍길동" >> README.md
git add README.md
git commit -m "docs: README에 작성자 추가"
```

지금 상태를 봅니다.

```bash
git log --oneline --graph --all
```

실행 결과:

```
* 4f8b2d6 (HEAD -> main) docs: README에 작성자 추가
| * 2c7e9a3 (feature/farewell) feat: 작별 인사 추가
|/
* a8c3f01 feat: 인사말에 테두리 장식 추가
* 5e1d7f3 feat: 설명 출력 추가
```

**`|/` 모양이 보입니다.** 이력이 갈라진 것입니다.

**③ 합치기**

```bash
git merge feature/farewell
```

편집기가 열리며 기본 메시지가 채워져 있습니다.

```
Merge branch 'feature/farewell'

# Please enter a commit message to explain why this merge is necessary,
# especially if it merges an updated upstream into a topic branch.
```

그대로 저장하고 닫습니다.

실행 결과:

```
Merge made by the 'ort' strategy.
 greeting.py | 1 +
 1 file changed, 1 insertion(+)
```

> **`Fast-forward` 가 아니라 `Merge made by...`** 입니다. 새 커밋(머지 커밋)이 만들어졌습니다.
> `ort` 는 Git이 쓰는 병합 알고리즘 이름입니다. 신경 쓰지 않아도 됩니다.

```bash
git log --oneline --graph --all
```

실행 결과:

```
*   9d1e4b7 (HEAD -> main) Merge branch 'feature/farewell'
|\
| * 2c7e9a3 (feature/farewell) feat: 작별 인사 추가
* | 4f8b2d6 docs: README에 작성자 추가
|/
* a8c3f01 feat: 인사말에 테두리 장식 추가
```

**갈라졌다가 합쳐진 모양**이 그대로 남았습니다. 이것이 3-way merge의 흔적입니다.

```bash
git branch -d feature/farewell
```

### Step 8. 충돌 맛보기

**같은 줄을 서로 다르게 고치면** 어떻게 되는지 한 번만 보고 갑니다.

```bash
git switch -c feature/title
```

`README.md` 의 첫 줄을 이렇게 고칩니다.

```markdown
# Git 실습 저장소
```

```bash
git add README.md
git commit -m "docs: 제목 변경 (실습 저장소)"
```

`main` 에서 **같은 줄을 다르게** 고칩니다.

```bash
git switch main
```

`README.md` 의 첫 줄:

```markdown
# Git 학습 프로젝트
```

```bash
git add README.md
git commit -m "docs: 제목 변경 (학습 프로젝트)"
git merge feature/title
```

실행 결과:

```
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

파일을 열어 보면 이렇게 되어 있습니다.

```
<<<<<<< HEAD
# Git 학습 프로젝트
=======
# Git 실습 저장소
>>>>>>> feature/title
```

| 표시 | 뜻 |
|---|---|
| `<<<<<<< HEAD` ~ `=======` | **현재 브랜치(main)** 의 내용 |
| `=======` ~ `>>>>>>> feature/title` | **합치려는 브랜치**의 내용 |

**지금은 일단 취소하고 넘어갑니다.**

```bash
git merge --abort
git status
```

실행 결과:

```
On branch main
nothing to commit, working tree clean
```

> `--abort` 는 병합을 **완전히 없던 일로** 되돌립니다. 충돌이 무서우면 언제든 쓸 수 있는 탈출구입니다.
> 제대로 해결하는 방법은 [11강](lesson-11.md)에서 배웁니다.

정리합니다.

```bash
git branch -D feature/title
```

### Step 9. 브랜치 상태 확인 명령

```bash
git branch -v              # 브랜치별 최신 커밋
git branch --merged        # 현재 브랜치에 이미 합쳐진 브랜치 (지워도 안전)
git branch --no-merged     # 아직 안 합쳐진 브랜치 (지우면 작업 사라짐)
```

`--merged` 실행 결과:

```
* main
```

> 브랜치가 쌓이면 `git branch --merged` 로 **정리해도 되는 것**을 골라낼 수 있습니다. 실무에서 자주 씁니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code |
|---|---|
| 현재 브랜치 확인 | **왼쪽 아래 상태 표시줄**의 가지 아이콘 |
| 브랜치 전환·생성 | 그 부분을 클릭 → 목록에서 선택 / `Create new branch` |
| 병합 | `Ctrl+Shift+P` → `Git: Merge Branch` |
| 그래프 보기 | 확장 **Git Graph** 설치 후 `Git Graph: View Graph` |

> 브랜치 그래프만큼은 GUI가 압도적으로 편합니다. **Git Graph** 확장을 꼭 설치해 보세요.

---

## ⑤ 자주 하는 실수

### 브랜치를 만들었는데 계속 `main` 에서 작업

```bash
git branch feature/login      # 만들기만 함
# ... 작업 ...
git commit -m "feat: 로그인"   # ← main 에 커밋됨!
```

**원인** — `git branch` 는 **만들기만** 하고 이동하지 않습니다.
**해결** — `git switch -c` 를 쓰세요. 만들면서 바로 이동합니다.

```bash
git switch -c feature/login
```

**이미 `main` 에 커밋해 버렸다면** 옮길 수 있습니다.

```bash
git branch feature/login       # 지금 커밋 위치에 브랜치 생성
git reset --hard HEAD~1        # main 을 한 칸 되돌림
git switch feature/login       # 브랜치로 이동
```

> 커밋할 때마다 출력되는 `[브랜치명 해시]` 를 확인하는 습관을 들이면 이 실수를 막을 수 있습니다.

### `error: Your local changes ... would be overwritten by checkout`

```
error: Your local changes to the following files would be overwritten by checkout:
	greeting.py
Please commit your changes or stash them before you switch branches.
Aborting
```

**원인** — 커밋하지 않은 변경이 있는데, 옮겨 갈 브랜치에서 **그 파일이 다릅니다.** 그냥 이동하면 작업이 사라지므로 Git이 막은 것입니다.
**해결** — 셋 중 하나입니다.

```bash
git commit -am "wip: 작업 중"    # ① 커밋하고 이동
git stash                        # ② 잠시 치워 두고 이동 (16강)
git restore greeting.py          # ③ 버리고 이동 ⚠️
```

> **Git이 막아 준 것입니다.** 고맙게 생각하고 셋 중 하나를 고르세요.

### `error: The branch 'feature/x' is not fully merged.`

```
error: The branch 'feature/x' is not fully merged.
If you are sure you want to delete it, run 'git branch -D feature/x'.
```

**원인** — 아직 합쳐지지 않은 커밋이 그 브랜치에만 있습니다. 지우면 **접근할 방법이 없어집니다.**
**해결** — 먼저 확인하세요.

```bash
git log main..feature/x --oneline    # 이 브랜치에만 있는 커밋 보기
```

- 필요한 작업이면 → 먼저 `git merge feature/x`
- 정말 버릴 거면 → `git branch -D feature/x`

> 실수로 `-D` 했더라도 [23강 reflog](lesson-23.md)로 대개 되살릴 수 있습니다.

### 현재 있는 브랜치를 삭제하려 함

```
error: Cannot delete branch 'feature/login' checked out at 'C:/Users/LEE/Desktop/git-practice'
```

**원인** — 앉아 있는 의자를 뺄 수는 없습니다.
**해결** — 다른 브랜치로 이동한 뒤 지웁니다.

```bash
git switch main
git branch -d feature/login
```

### `detached HEAD` 상태에 빠짐

```bash
git switch 5e1d7f3        # 브랜치가 아니라 커밋으로 이동
```

```
Note: switching to '5e1d7f3'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by switching back to a branch.
```

**원인** — HEAD가 **브랜치가 아니라 커밋을 직접** 가리키는 상태입니다. 과거 시점을 구경할 때 자주 들어갑니다.
**증상** — 여기서 커밋하면 **어느 브랜치에도 속하지 않아** 나중에 찾기 어렵습니다.
**해결** —

```bash
git switch -              # 원래 브랜치로 복귀 (- 는 "직전 브랜치")
git switch main
```

여기서 한 커밋을 살리고 싶다면 **브랜치를 만들어 붙잡으세요.**

```bash
git switch -c rescue-work
```

> 자세한 원리는 [22강](lesson-22.md)에서 다룹니다. 지금은 **"경고가 뜨면 `git switch -` 로 나온다"** 만 기억하면 됩니다.

### 브랜치 = 폴더 복사본이라고 생각하기

**증상** — "브랜치를 만들었는데 폴더가 왜 안 생기죠?"
**원인** — 브랜치는 **커밋을 가리키는 이름표**일 뿐입니다. 폴더는 하나이고, 그 안의 내용이 브랜치에 따라 바뀝니다.
**해결** — 정말로 두 브랜치를 **동시에 열어 두고** 비교하고 싶다면 `git worktree` 라는 기능이 있습니다 ([28강](lesson-28.md)).

### 브랜치를 안 만들고 계속 `main` 에만 작업

**원인** — 혼자 하는 프로젝트라 필요를 못 느낍니다.
**해결** — 혼자여도 브랜치가 이득입니다.

- 실험이 실패해도 **브랜치만 지우면** 끝입니다
- `main` 은 **항상 동작하는 상태**로 유지할 수 있습니다
- 나중에 팀 작업으로 넘어갈 때 습관이 이미 잡혀 있습니다

---

## ⑥ 확인 문제

**1.** 아래 상태에서 `git switch main && git merge feature` 를 실행하면 **fast-forward** 일까요, **3-way merge** 일까요?

```
              ┌──▶ D ──▶ E   ← feature
   A ──▶ B ──▶ C             ← main
```

<details>
<summary>답 보기</summary>

**Fast-forward 입니다.**

`main` 은 `C` 에 그대로 있고, `feature` 만 앞으로 나갔습니다. 즉 **`main` 에서 `feature` 까지 한 방향으로 이어져 있습니다.** 이럴 때 Git은 새 커밋을 만들지 않고 `main` 이름표를 `E` 로 옮기기만 합니다.

```
   A ──▶ B ──▶ C ──▶ D ──▶ E
                           ▲
                     main, feature
```

**3-way merge 가 되려면** `main` 쪽에도 커밋이 있어야 합니다.

```
              ┌──▶ D ──▶ E   ← feature
   A ──▶ B ──▶ C
              └──▶ F         ← main    ← 이러면 3-way
```

**확인 방법** — 미리 알고 싶다면:

```bash
git log --oneline --graph --all      # 갈라졌는지 눈으로
git merge --no-ff feature            # 무조건 머지 커밋을 만들고 싶을 때
```

`--no-ff` 는 fast-forward 가 가능해도 **일부러 머지 커밋을 만듭니다.** "여기서 기능 브랜치를 합쳤다"는 기록을 남기려는 팀에서 씁니다. [13강](lesson-13.md)에서 다시 다룹니다.
</details>

**2.** `feature/login` 브랜치에서 작업하다가 급한 버그 수정 요청을 받았습니다. **작업은 아직 커밋할 만한 상태가 아닙니다.** 어떤 순서로 처리해야 할까요?

<details>
<summary>답 보기</summary>

**핵심** — 그냥 `git switch main` 하면 막히거나(`error: Your local changes...`), 작업이 딸려 갑니다.

**방법 A — 임시 커밋 (초급에서 권장)**

```bash
git add .
git commit -m "wip: 로그인 폼 작업 중"     # wip = work in progress

git switch main
git switch -c fix/urgent-bug
# ... 수정 ...
git add . && git commit -m "fix: 긴급 버그 수정"
git switch main && git merge fix/urgent-bug

git switch feature/login                  # 돌아와서 계속
```

나중에 `wip` 커밋이 지저분하면 [18강](lesson-18.md)의 `rebase -i` 로 정리하거나, `git reset --soft HEAD~1` 로 풀어서 다시 커밋하면 됩니다.

**방법 B — stash (16강)**

```bash
git stash                    # 변경을 잠시 치워 둠
git switch main
# ... 수정 ...
git switch feature/login
git stash pop                # 치워 둔 작업 복구
```

**주의** — `git switch` 로 그냥 넘어가지는 마세요. Git이 막아 주면 다행이지만, 파일이 겹치지 않으면 **변경이 따라와서** 엉뚱한 브랜치에 커밋될 수 있습니다.
</details>

**3.** 아래 그래프를 읽고 ① 지금 어느 브랜치에 있는지 ② 몇 개의 브랜치가 있는지 ③ `9d1e4b7` 은 어떤 커밋인지 답하세요.

```
*   9d1e4b7 (HEAD -> main) Merge branch 'feature/farewell'
|\
| * 2c7e9a3 (feature/farewell) feat: 작별 인사 추가
* | 4f8b2d6 docs: README에 작성자 추가
|/
* a8c3f01 feat: 인사말에 테두리 장식 추가
```

<details>
<summary>답 보기</summary>

**① 현재 브랜치** — `main` 입니다. `HEAD -> main` 표시로 알 수 있습니다.

**② 브랜치 개수** — 2개입니다. `main` 과 `feature/farewell`.

**③ `9d1e4b7`** — **머지 커밋**입니다. 근거는 두 가지입니다.

- 메시지가 `Merge branch 'feature/farewell'`
- 바로 아래 `|\` 가 있음 → **부모가 둘**이라는 표시

**그래프 기호 읽기**

| 기호 | 뜻 |
|---|---|
| `*` | 커밋 하나 |
| `|\` | 여기서 **두 갈래가 합쳐짐** (머지 커밋의 바로 아래) |
| `|/` | 여기서 **갈라짐** (공통 조상) |
| `* |` / `| *` | 세로줄의 어느 갈래에 속한 커밋인지 |

**읽는 순서** — 위가 최신입니다. `a8c3f01` 에서 갈라져(`|/`) 양쪽이 각각 커밋한 뒤(`4f8b2d6`, `2c7e9a3`) 다시 합쳐졌습니다(`|\` → `9d1e4b7`).
</details>

---

## 오늘의 정리

| 명령 | 하는 일 |
|---|---|
| `git branch` | 브랜치 목록 (`*` 가 현재 위치) |
| `git branch -v` | 브랜치별 최신 커밋까지 |
| `git branch <이름>` | 브랜치 생성 (**이동은 안 함**) |
| **`git switch -c <이름>`** | 생성 + 이동 |
| `git switch <이름>` | 브랜치 이동 |
| `git switch -` | 직전 브랜치로 |
| `git merge <이름>` | 현재 브랜치에 합치기 |
| `git merge --no-ff <이름>` | 무조건 머지 커밋 만들기 |
| `git merge --abort` | 병합 취소 (충돌 시 탈출구) |
| `git branch -d <이름>` | 삭제 (합쳐진 것만) |
| `git branch -D <이름>` | 강제 삭제 |
| `git branch --merged` | 이미 합쳐진 브랜치 (정리 대상) |
| `git log --oneline --graph --all` | 브랜치 그래프 |

**핵심 개념**

```
브랜치 = 커밋을 가리키는 이름표 (파일 복사 아님)
HEAD   = 지금 내가 있는 위치
커밋   = 현재 브랜치의 이름표가 새 커밋으로 이동
```

**두 가지 병합**

| | 조건 | 결과 |
|---|---|---|
| **Fast-forward** | 갈라진 뒤 `main` 에 커밋 없음 | 이름표만 이동, 새 커밋 없음 |
| **3-way merge** | 양쪽 다 커밋 있음 | **머지 커밋** 생성 (부모 둘) |

**오늘 반드시 기억할 한 가지**
> **브랜치를 옮기면 작업 디렉터리의 파일이 실제로 바뀝니다.**
> 그러니 브랜치를 옮기기 전엔 **반드시 커밋하거나 stash** 하세요.

**과제**
1. `feature/practice` 브랜치를 만들어 파일을 고치고 커밋한 뒤, `main` 으로 돌아가 **파일 내용이 바뀌는 것**을 눈으로 확인하세요.
2. fast-forward 병합을 한 번, 3-way merge를 한 번 만들어 보고 `git log --graph --all` 로 모양의 차이를 비교하세요.
3. 같은 파일 같은 줄을 양쪽 브랜치에서 다르게 고쳐 **충돌을 일부러 내 보고**, `git merge --abort` 로 빠져나오세요.
4. `git branch --merged` 로 정리해도 되는 브랜치를 확인하고 `-d` 로 삭제하세요.

---

[← 이전 07강](lesson-07.md) · [목차](README.md) · [다음 → 09강 GitHub에 올리기](lesson-09.md)
