# 22강 · 참조와 HEAD

> **Git 학습 매뉴얼** · 🔴 고급 · **22강 / 30**
> [← 이전 21강](lesson-21.md) · [목차](README.md) · [다음 → 23강 reflog](lesson-23.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- **참조(ref)** 가 "해시 40자가 적힌 파일 하나"라는 것을 확인하고 설명할 수 있다.
- `HEAD` 가 **심볼릭 참조**라는 것과 detached HEAD의 정체를 안다.
- `origin/main` 이 왜 자동 갱신되지 않는지 **refspec**으로 설명할 수 있다.
- `ORIG_HEAD` 같은 **의사 참조**로 사고를 복구할 수 있다.
- `HEAD~2`, `@{u}`, `@{-1}`, `:/검색어` 같은 리비전 표기를 자유롭게 쓸 수 있다.

---

## ② 왜 필요한가

[08강](lesson-08.md)에서 이렇게 배웠습니다.

> **브랜치는 커밋을 가리키는 이름표일 뿐입니다.**

[21강](lesson-21.md)에서 객체를 봤으니, 오늘은 **그 이름표의 실체**를 봅니다. 결론부터 말하면 이렇습니다.

```bash
cat .git/refs/heads/main
```

```
22dfff0a279d3fc747d92e4e56616256835b81ab
```

**이게 전부입니다.** 브랜치는 **해시 40자가 적힌 텍스트 파일 하나**입니다.

이걸 알면 그동안 애매했던 것들이 한 번에 정리됩니다.

| 그동안 애매했던 것 | 오늘 알게 되는 것 |
|---|---|
| "브랜치 생성이 왜 즉시 끝나지?" | 파일 하나 쓰는 것뿐이니까 |
| `origin/main` 이 왜 자동 갱신 안 되지? | 그냥 **로컬 파일**이니까 |
| `detached HEAD` 가 정확히 뭐지? | HEAD가 브랜치 대신 커밋을 직접 가리키는 상태 |
| rebase 중에 왜 브랜치 이름이 안 보이지? | HEAD가 임시로 분리되니까 |
| `git reset --hard` 후 어떻게 되살리지? | `ORIG_HEAD` 가 남아 있으니까 |

---

## ③ 개념 설명

### 참조(ref)란

**참조**는 커밋 해시에 붙인 사람이 읽을 수 있는 이름입니다. `.git/refs/` 아래에 **파일**로 저장됩니다.

```
.git/refs/
├── heads/           로컬 브랜치
│   ├── main
│   └── feature/login          ← "/" 는 실제 폴더가 됩니다
├── tags/            태그
│   └── v1.0.0
└── remotes/         원격 추적 브랜치
    └── origin/
        ├── main
        └── HEAD
```

각 파일의 내용은 **해시 40자 + 줄바꿈**, 그것뿐입니다.

| 참조 종류 | 전체 이름 | 짧게 |
|---|---|---|
| 로컬 브랜치 | `refs/heads/main` | `main` |
| 태그 | `refs/tags/v1.0.0` | `v1.0.0` |
| 원격 추적 | `refs/remotes/origin/main` | `origin/main` |

> **`refs/heads/main` 을 그냥 `main` 이라고 쓸 수 있는 이유** — Git이 정해진 순서로 찾아 줍니다.
> 그래서 `main` 이라는 이름의 **브랜치와 태그가 동시에 있으면** 헷갈립니다. 그럴 땐 전체 경로를 쓰세요.

### packed-refs

브랜치·태그가 많아지면 Git이 **파일 하나로 묶습니다.** `git gc` 를 하면 일어납니다.

```bash
cat .git/packed-refs
```

```
# pack-refs with: peeled fully-peeled sorted
22dfff0a279d3fc747d92e4e56616256835b81ab refs/heads/main
59da14de0f48a04a9beaaef605b5abd2ad462654 refs/tags/v1.0.0
^22dfff0a279d3fc747d92e4e56616256835b81ab
```

> **`^` 로 시작하는 줄**은 바로 위 태그 객체가 **최종적으로 가리키는 커밋**입니다. annotated 태그는 태그 객체를 거치므로 한 단계 더 들어가야 하는데, 그걸 미리 계산해 둔 것입니다(peeled).

**주의** — `.git/refs/heads/main` 파일이 없어도 브랜치가 있을 수 있습니다. `packed-refs` 에 들어갔기 때문입니다. **직접 파일을 찾지 말고 `git show-ref` 를 쓰세요.**

### HEAD — 심볼릭 참조

```bash
cat .git/HEAD
```

```
ref: refs/heads/main
```

**HEAD는 해시가 아니라 다른 참조를 가리킵니다.** 이것을 **심볼릭 참조(symbolic ref)** 라고 합니다.

```
HEAD ──▶ refs/heads/main ──▶ 22dfff0... ──▶ 실제 커밋 객체
 (심볼릭)      (참조)            (해시)
```

**이 한 단계 간접 참조가 Git 동작의 핵심입니다.**

```
git commit  →  ① 새 커밋 객체 생성
               ② HEAD 가 가리키는 브랜치의 파일에 새 해시를 씀
                  → 브랜치가 자동으로 따라 움직임
```

[08강](lesson-08.md)에서 "커밋하면 브랜치가 따라 움직인다"고 한 것의 정체입니다.

### detached HEAD

`git switch --detach <커밋>` 이나 `git switch <태그>` 를 하면 이렇게 됩니다.

```bash
cat .git/HEAD
```

```
bf5de013ebaf49723a1c1062a602dd8ab7eea8ed
```

**`ref:` 가 없습니다.** HEAD가 **브랜치를 건너뛰고 커밋을 직접** 가리킵니다.

```
평소:      HEAD ──▶ refs/heads/main ──▶ 커밋
detached:  HEAD ─────────────────────▶ 커밋
```

**여기서 커밋하면 어떻게 될까요.**

```
HEAD ──▶ 새 커밋 (어느 브랜치에도 속하지 않음)
```

브랜치가 따라오지 않으므로, **다른 브랜치로 이동하는 순간 그 커밋을 가리키는 것이 아무것도 없게 됩니다.** 그래서 Git이 경고합니다.

> **detached HEAD는 고장이 아닙니다.** 과거 시점을 보거나([19강](lesson-19.md) 태그 확인), rebase 중에는 Git이 **일부러** 이 상태를 씁니다.
> 위험한 건 **이 상태에서 커밋하고 그냥 나가는 것**뿐입니다.

### 의사 참조(pseudo-ref)

`.git/` 바로 아래에 있는 특수한 참조들입니다. Git이 작업 중에 자동으로 만듭니다.

| 이름 | 언제 생기나 | 쓰임 |
|---|---|---|
| **`ORIG_HEAD`** | `reset`, `merge`, `rebase`, `pull` **직전 위치** | **사고 복구** |
| `FETCH_HEAD` | `git fetch` | 방금 받아 온 것 |
| `MERGE_HEAD` | 병합 중 (충돌 상태) | 합치려는 쪽 |
| `CHERRY_PICK_HEAD` | cherry-pick 중 | 가져오려는 커밋 |
| `REVERT_HEAD` | revert 중 | 되돌리려는 커밋 |
| `REBASE_HEAD` | rebase 중 | 적용 중인 커밋 |

```bash
git reset --hard HEAD~3     # 아차!
git reset --hard ORIG_HEAD  # 되돌리기
```

> **`ORIG_HEAD` 는 [23강](lesson-23.md)의 reflog보다 간편한 1단계 되돌리기**입니다. 다만 **직전 것 하나**만 남습니다.
>
> `git status` 가 충돌 중인지 판단하는 것도 `MERGE_HEAD` 파일의 존재 여부입니다. [11강](lesson-11.md)에서 `--abort` 가 안 되던 이유(`MERGE_HEAD missing`)가 이것입니다.

### refspec — `origin/main` 의 정체

[09강](lesson-09.md)에서 **"`origin/main` 은 캐시라서 `fetch` 해야 갱신된다"** 고 했습니다. 그 규칙이 설정에 적혀 있습니다.

```bash
git config --get-all remote.origin.fetch
```

```
+refs/heads/*:refs/remotes/origin/*
│└────┬─────┘ └────────┬──────────┘
│   원격의 이것을      내 로컬의 이 위치에 저장
└── + 는 "강제로 덮어써도 됨"
```

**읽는 법** — "원격의 `refs/heads/` 아래 모든 것을 내 `refs/remotes/origin/` 아래에 복사하라"

즉 `origin/main` 은 **내 디스크에 있는 파일**입니다. `git fetch` 를 실행할 때만 갱신됩니다. 서버를 실시간으로 비추는 창이 아닙니다.

**upstream 연결**은 별도 설정입니다.

```bash
git config --get branch.main.remote     # origin
git config --get branch.main.merge      # refs/heads/main
```

[09강](lesson-09.md)의 `git push -u` 가 이 두 줄을 써 주는 것입니다.

### 리비전 표기법 총정리

| 표기 | 뜻 |
|---|---|
| `HEAD` | 현재 위치 |
| `HEAD~1` `HEAD~2` | **첫 부모를 따라** 1칸, 2칸 전 |
| `HEAD^` | `HEAD~1` 과 같음 (부모가 하나일 때) |
| **`HEAD^1` / `HEAD^2`** | **머지 커밋의 첫째 / 둘째 부모** |
| `HEAD^{tree}` | 그 커밋의 트리 |
| `v1.0.0^{}` | 태그가 **최종적으로 가리키는 커밋** |
| `HEAD:src/main.py` | 그 시점의 파일 blob |
| **`@{u}`** / `@{upstream}` | 현재 브랜치의 upstream (= `origin/main`) |
| `@{-1}` | **직전에 있던 브랜치** (`git switch -` 의 그것) |
| `main@{0}` `HEAD@{2}` | reflog 기준 위치 ([23강](lesson-23.md)) |
| `main@{yesterday}` | 시간 기준 |
| `:/로그인` | **메시지에 "로그인"이 들어간 가장 최근 커밋** |
| `A..B` | B에는 있고 A에는 없는 커밋 |
| `A...B` | 양쪽 중 한쪽에만 있는 커밋 |

**`~` 와 `^` 의 차이**

```
        ┌── B ── C
   A ───┤          
        └── D ── E ──┐
                     M   ← 머지 커밋
```

```
M^1  = M~1 = C 쪽 부모 (머지를 실행한 브랜치)
M^2  = E 쪽 부모 (합쳐 들어온 브랜치)
M~2  = M^1^1 = 첫 부모를 두 번 따라간 것
```

> **`~` 는 항상 첫 부모만 따라갑니다.** 그래서 `M~2` 는 `M^2` 와 완전히 다릅니다.
> [17강](lesson-17.md)의 `git revert -m 1` 이 이 `^1` 을 말하는 것입니다.
>
> ⚠️ **PowerShell에서 `^` 는 특수문자**입니다. `"HEAD^2"` 처럼 따옴표로 감싸거나 `HEAD~1` 을 쓰세요.

---

## ④ 단계별 실습

### Step 0. 실험실 준비

[21강](lesson-21.md)에서 만든 `git-internals` 를 계속 씁니다.

```bash
cd ~/Desktop/git-internals
git log --oneline
```

실행 결과:

```
22dfff0 (HEAD -> main, tag: v1.0.0) feat: 둘째 줄 추가
bf5de01 feat: 첫 커밋
```

### Step 1. 참조를 파일로 확인하기

```bash
find .git/refs -type f | sort
```

실행 결과:

```
.git/refs/heads/main
.git/refs/tags/v1.0.0
```

```bash
cat .git/refs/heads/main
```

실행 결과:

```
22dfff0a279d3fc747d92e4e56616256835b81ab
```

> 🔑 **브랜치는 이게 전부입니다.** 해시 40자가 적힌 텍스트 파일 한 개.
> 브랜치를 100개 만들어도 저장소는 몇 KB밖에 안 늘어납니다.

**참조 전체 목록 보기** (packed-refs까지 포함)

```bash
git show-ref
```

실행 결과:

```
22dfff0a279d3fc747d92e4e56616256835b81ab refs/heads/main
59da14de0f48a04a9beaaef605b5abd2ad462654 refs/tags/v1.0.0
```

> **태그 해시(`59da14d`)가 커밋 해시(`22dfff0`)와 다릅니다.**
> annotated 태그는 [21강](lesson-21.md)에서 본 **태그 객체**를 가리키기 때문입니다.

**태그가 최종적으로 가리키는 커밋 얻기**

```bash
git rev-parse v1.0.0        # 태그 객체
git rev-parse v1.0.0^{}     # 그 태그가 가리키는 커밋
```

실행 결과:

```
59da14de0f48a04a9beaaef605b5abd2ad462654
22dfff0a279d3fc747d92e4e56616256835b81ab
```

> **`^{}` 는 "끝까지 따라가라"** 는 표기입니다. 스크립트에서 태그를 다룰 때 필수입니다.

**보기 좋게 정리해서 보기**

```bash
git for-each-ref --format='%(refname) %(objecttype) %(objectname:short) %(subject)'
```

실행 결과:

```
refs/heads/main commit 22dfff0 feat: 둘째 줄 추가
refs/tags/v1.0.0 tag 59da14d 첫 릴리스
```

> `for-each-ref` 는 **스크립트용 명령**입니다. 브랜치 정리 자동화 등에 자주 씁니다.
> ```bash
> git for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' refs/heads
> ```
> 이러면 **최근에 작업한 브랜치 순으로** 정렬됩니다. 실무에서 유용합니다.

### Step 2. 브랜치를 손으로 만들기

`git branch` 를 쓰지 않고 브랜치를 만들어 봅니다.

```bash
git update-ref refs/heads/manual-branch bf5de01
git branch
```

실행 결과:

```
* main
  manual-branch
```

```bash
git log --oneline manual-branch
```

실행 결과:

```
bf5de01 feat: 첫 커밋
```

**정상적인 브랜치입니다.** `git branch` 가 하는 일이 이것뿐입니다.

**더 원시적으로 — 파일을 직접 써도 됩니다.**

```bash
git rev-parse HEAD > .git/refs/heads/raw-branch
git branch
```

실행 결과:

```
* main
  manual-branch
  raw-branch
```

> ⚠️ **파일 직접 쓰기는 실습으로만 하세요.** 실무에서는 `git update-ref` 를 씁니다.
> `update-ref` 는 **reflog를 함께 기록**하고 잠금 처리도 합니다. 파일을 직접 쓰면 그게 빠집니다.

정리합니다.

```bash
git branch -D manual-branch raw-branch
```

### Step 3. HEAD의 실체

```bash
cat .git/HEAD
git symbolic-ref HEAD
```

실행 결과:

```
ref: refs/heads/main
refs/heads/main
```

```bash
git rev-parse HEAD              # HEAD 가 최종적으로 가리키는 커밋
git rev-parse --abbrev-ref HEAD # 브랜치 이름만
```

실행 결과:

```
22dfff0a279d3fc747d92e4e56616256835b81ab
main
```

> `git rev-parse --abbrev-ref HEAD` 는 **현재 브랜치 이름을 얻는 표준 방법**입니다.
> 셸 프롬프트나 CI 스크립트에서 매우 자주 씁니다.

**세 가지가 모두 같은 커밋을 가리키는 것을 확인해 봅시다.**

```bash
git rev-parse HEAD main refs/heads/main
```

실행 결과:

```
22dfff0a279d3fc747d92e4e56616256835b81ab
22dfff0a279d3fc747d92e4e56616256835b81ab
22dfff0a279d3fc747d92e4e56616256835b81ab
```

### Step 4. detached HEAD 깊이 보기

```bash
git switch --detach HEAD~1
```

실행 결과:

```
Note: switching to 'HEAD~1'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by switching back to a branch.
...
HEAD is now at bf5de01 feat: 첫 커밋
```

```bash
cat .git/HEAD
```

실행 결과:

```
bf5de013ebaf49723a1c1062a602dd8ab7eea8ed
```

**`ref:` 가 사라지고 해시가 직접 들어갔습니다.**

```bash
git symbolic-ref HEAD
```

실행 결과:

```
fatal: ref HEAD is not a symbolic ref
```

**여기서 커밋해 봅니다.**

```bash
printf 'detached 상태에서 만든 파일\n' > lost.txt
git add lost.txt
git commit -m "chore: detached 상태의 커밋"
```

실행 결과:

```
[detached HEAD 4f2a8c9] chore: detached 상태의 커밋
 1 file changed, 1 insertion(+)
```

```bash
git log --oneline -2
git branch
```

브랜치 목록에는 아무것도 안 늘었습니다. **이 커밋을 가리키는 브랜치가 없습니다.**

```bash
git rev-parse HEAD        # 해시를 적어 두세요
```

**돌아가면 잃어버립니다.**

```bash
git switch main
```

실행 결과:

```
Warning: you are leaving 1 commit behind, not connected to
any of your branches:

  4f2a8c9 chore: detached 상태의 커밋

If you want to keep it by creating a new branch, this may be a good time
to do so with:

 git branch <new-branch-name> 4f2a8c9

Switched to branch 'main'
```

> **Git이 해시와 되살리는 방법까지 알려 줍니다.** 이 경고를 그냥 지나치지 마세요.

**되살려 봅시다.**

```bash
git branch rescued 4f2a8c9
git log --oneline rescued -1
```

실행 결과:

```
4f2a8c9 chore: detached 상태의 커밋
```

**돌아왔습니다.** 해시를 몰라도 [23강](lesson-23.md)의 reflog로 찾을 수 있습니다.

```bash
git branch -D rescued
```

**detached 상태에서 안전하게 나오는 법**

```bash
git switch -              # 직전 브랜치로 (= @{-1})
git switch main           # 특정 브랜치로
git switch -c new-branch  # 여기서 브랜치를 만들며 나가기 ← 커밋을 살릴 때
```

### Step 5. 원격 추적 브랜치의 실체

로컬에 가짜 원격을 만들어 실험합니다.

```bash
cd ~/Desktop
git init --bare fake-remote.git
cd git-internals
git remote add origin ../fake-remote.git
git push -u origin main --tags
```

```bash
find .git/refs -type f | sort
```

실행 결과:

```
.git/refs/heads/main
.git/refs/remotes/origin/main
.git/refs/tags/v1.0.0
```

**`refs/remotes/origin/main` 이 생겼습니다. 그냥 내 디스크의 파일입니다.**

```bash
cat .git/refs/remotes/origin/main
```

실행 결과:

```
22dfff0a279d3fc747d92e4e56616256835b81ab
```

**refspec 확인**

```bash
git config --get-all remote.origin.fetch
```

실행 결과:

```
+refs/heads/*:refs/remotes/origin/*
```

**upstream 설정 확인**

```bash
git config --get branch.main.remote
git config --get branch.main.merge
```

실행 결과:

```
origin
refs/heads/main
```

```bash
git branch -vv
```

실행 결과:

```
* main 22dfff0 [origin/main] feat: 둘째 줄 추가
```

**`@{u}` 표기 써 보기**

```bash
git rev-parse @{u}
git rev-parse --abbrev-ref @{u}
```

실행 결과:

```
22dfff0a279d3fc747d92e4e56616256835b81ab
origin/main
```

> **`@{u}` 를 알면 명령이 짧아집니다.**
> ```bash
> git log @{u}..            # 내가 push하지 않은 커밋
> git log ..@{u}            # 내가 아직 안 받은 커밋
> git diff @{u}             # 원격과의 차이
> ```
> [09강](lesson-09.md)에서 `git log main..origin/main` 이라고 쓴 것을 `git log ..@{u}` 로 줄일 수 있습니다.

### Step 6. `ORIG_HEAD` 로 사고 복구

```bash
git log --oneline -2
```

실행 결과:

```
22dfff0 (HEAD -> main, tag: v1.0.0, origin/main) feat: 둘째 줄 추가
bf5de01 feat: 첫 커밋
```

**실수로 되감아 봅니다.**

```bash
git reset --hard HEAD~1
git log --oneline -1
```

실행 결과:

```
bf5de01 (HEAD -> main) feat: 첫 커밋
```

**커밋이 사라졌습니다. `ORIG_HEAD` 를 봅니다.**

```bash
cat .git/ORIG_HEAD
```

실행 결과:

```
22dfff0a279d3fc747d92e4e56616256835b81ab
```

```bash
git reset --hard ORIG_HEAD
git log --oneline -1
```

실행 결과:

```
22dfff0 (HEAD -> main, tag: v1.0.0, origin/main) feat: 둘째 줄 추가
```

**돌아왔습니다.**

> **`ORIG_HEAD` 는 `reset` · `merge` · `rebase` · `pull` 직전 위치**를 기록합니다.
> 다만 **가장 최근 것 하나**만 남으므로, 여러 번 실수했다면 [23강](lesson-23.md)의 reflog를 써야 합니다.

**병합 중에만 존재하는 참조도 확인해 봅시다.**

```bash
git switch -c conflict-test HEAD~1
printf '충돌용\n' > a.txt
git commit -aqm "test: 충돌 유발"
git switch main
git merge conflict-test
```

충돌이 나면:

```bash
ls .git/MERGE_HEAD
cat .git/MERGE_HEAD
git rev-parse MERGE_HEAD
```

**합치려는 쪽 커밋 해시**가 들어 있습니다. `git status` 가 "병합 중"이라고 판단하는 근거입니다.

```bash
git merge --abort
ls .git/MERGE_HEAD          # 사라짐
git branch -D conflict-test
```

### Step 7. 리비전 표기법 실습

```bash
git rev-parse HEAD                # 현재
git rev-parse HEAD~1              # 한 칸 전
git rev-parse HEAD^{tree}         # 그 커밋의 트리
git rev-parse v1.0.0^{}           # 태그가 가리키는 커밋
```

**메시지로 커밋 찾기**

```bash
git rev-parse ":/첫"
```

실행 결과:

```
bf5de013ebaf49723a1c1062a602dd8ab7eea8ed
```

> **`:/텍스트`** 는 "메시지에 이 문자열이 들어간 **가장 최근** 커밋"입니다. 해시를 모를 때 편합니다.
> ```bash
> git show :/로그인
> git diff :/리팩터링 HEAD
> ```

**직전 브랜치**

```bash
git switch -c temp-branch
git switch main
git rev-parse --abbrev-ref @{-1}
```

실행 결과:

```
temp-branch
```

```bash
git branch -D temp-branch
```

**저장소 정보**

```bash
git rev-parse --show-toplevel     # 저장소 루트 경로
git rev-parse --git-dir           # .git 위치
git rev-parse --is-inside-work-tree
```

> 스크립트 첫 줄에서 **"여기가 Git 저장소인가"** 를 확인할 때 씁니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| 현재 브랜치 확인 | VS Code 왼쪽 아래 상태 표시줄 |
| detached HEAD 경고 | 상태 표시줄에 커밋 해시가 표시됨 |
| 참조 전체 보기 | **Git Graph** 확장에서 브랜치·태그·원격이 색으로 구분 |
| 원격 추적 상태 | `git branch -vv` (GUI에는 대응 기능이 약함) |

> 참조를 다루는 일은 대부분 **스크립트 영역**이라 GUI 지원이 거의 없습니다.
> 다만 detached HEAD에 빠졌을 때 VS Code 상태 표시줄에 **브랜치명 대신 해시**가 뜨는 것은 좋은 경고 신호입니다.

---

## ⑤ 자주 하는 실수

### `.git/refs/` 를 뒤졌는데 브랜치 파일이 없음

```bash
ls .git/refs/heads
```

```
main
```

분명 브랜치가 10개인데 하나만 보입니다.

**원인** — 나머지는 `.git/packed-refs` 에 묶여 있습니다. `git gc` 후에 자주 일어납니다.
**해결** — 파일을 직접 찾지 말고 명령을 쓰세요.

```bash
git show-ref
git for-each-ref refs/heads
git branch -a
```

### detached HEAD에서 커밋하고 그냥 나감

**증상** — 작업이 사라진 것처럼 보입니다.
**해결** — 세 단계로 찾습니다.

```bash
# ① 나올 때 Git 이 알려 준 해시가 있다면
git branch rescued <해시>

# ② 없다면 reflog (23강)
git reflog
git branch rescued HEAD@{3}

# ③ 그것도 없다면 도달 불가 객체 검색
git fsck --lost-found
```

**예방** — detached 상태에서 커밋할 일이 있으면 **먼저 브랜치를 만드세요.**

```bash
git switch -c experiment    # detached 상태에서 실행하면 그 자리에서 브랜치 생성
```

### `HEAD^2` 를 PowerShell에서 실행

```powershell
git rev-parse HEAD^2
```

```
fatal: ambiguous argument 'HEAD2': unknown revision
```

**원인** — PowerShell에서 `^` 는 **이스케이프 문자**라 사라집니다.
**해결** —

```powershell
git rev-parse "HEAD^2"      # 따옴표
git rev-parse HEAD~1        # 또는 ~ 사용 (첫 부모라면)
```

> Git Bash에서는 문제없습니다. 이 커리큘럼이 Git Bash 기준인 이유 중 하나입니다.

### `HEAD~2` 와 `HEAD^2` 를 혼동

```
        ┌── C
   A ── B ── D ── M
```

**원인** — 생김새가 비슷해서 같은 것으로 봅니다.
**해결** — 규칙은 단순합니다.

```
~  =  세대를 거슬러 올라간다 (항상 첫 부모)
^  =  이번 커밋의 몇 번째 부모인가
```

```bash
git log --oneline --parents -1 <머지커밋>     # 부모 확인
```

실무에서는 `~` 만 쓰고, `^` 는 **머지 커밋을 다룰 때만** 쓰면 됩니다 ([17강](lesson-17.md)의 `revert -m 1`).

### `origin/main` 을 직접 고치려고 함

```bash
git switch origin/main
```

```
You are in 'detached HEAD' state.
```

**원인** — `origin/main` 은 **원격 추적 브랜치**라 체크아웃하면 detached가 됩니다. 여기에 커밋해도 원격에 반영되지 않습니다.
**해결** — 로컬 브랜치를 만들어 작업하세요.

```bash
git switch -c fix/something origin/main
```

> `git switch main` 처럼 **로컬에 없는 브랜치 이름**을 쓰면, 원격에 같은 이름이 하나뿐일 때 Git이 알아서 추적 브랜치를 만들어 줍니다.

### `refs/` 를 손으로 고쳐서 reflog가 안 남음

```bash
echo "abc123..." > .git/refs/heads/main      # ❌
```

**증상** — 나중에 `git reflog` 로 되돌릴 수가 없습니다.
**해결** — 항상 `git update-ref` 를 쓰세요. reflog 기록과 잠금 처리를 함께 해 줍니다.

```bash
git update-ref refs/heads/main abc123
git update-ref -d refs/heads/main            # 삭제
```

### 브랜치와 태그 이름이 같아서 헷갈림

```
warning: refname 'release' is ambiguous.
```

**원인** — `refs/heads/release` 와 `refs/tags/release` 가 둘 다 있습니다.
**해결** — 전체 경로를 쓰세요.

```bash
git log refs/heads/release
git log refs/tags/release
```

**예방** — 태그에는 `v` 접두사를 붙이는 관례를 지키면 충돌하지 않습니다 ([19강](lesson-19.md)).

---

## ⑥ 확인 문제

**1.** `.git/HEAD` 의 내용이 아래와 같습니다. 각각 어떤 상태이고, `git commit` 을 하면 무슨 일이 일어날까요?

```
ⓐ ref: refs/heads/feature/login
ⓑ 4f2a8c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f21
```

<details>
<summary>답 보기</summary>

**ⓐ 정상 상태 (브랜치에 붙어 있음)**

```
HEAD ──▶ refs/heads/feature/login ──▶ 커밋
```

`git commit` 하면:
1. 새 커밋 객체가 만들어지고
2. **`refs/heads/feature/login` 파일에 새 해시가 기록됩니다**
3. 브랜치가 자동으로 새 커밋으로 이동합니다

**ⓑ detached HEAD (커밋을 직접 가리킴)**

```
HEAD ──▶ 커밋
```

`git commit` 하면:
1. 새 커밋 객체가 만들어지고
2. **`.git/HEAD` 파일에 새 해시가 기록됩니다**
3. **어떤 브랜치도 이 커밋을 가리키지 않습니다**

→ 다른 브랜치로 이동하는 순간 **접근할 방법이 사라집니다.** Git이 경고를 띄웁니다.

**확인 방법**

```bash
git symbolic-ref HEAD
# ⓐ: refs/heads/feature/login
# ⓑ: fatal: ref HEAD is not a symbolic ref

git status
# ⓑ: HEAD detached at 4f2a8c9
```

**ⓑ에서 안전하게 나오려면**

```bash
git switch -c rescue-branch     # 커밋을 살리려면
git switch -                    # 그냥 나가려면 (커밋은 버려짐)
```
</details>

**2.** 팀원이 묻습니다. **"`git status` 는 최신이라는데 GitHub에는 새 커밋이 있어요. 왜죠?"** `refs` 구조로 설명해 보세요.

<details>
<summary>답 보기</summary>

**`origin/main` 은 서버가 아니라 내 디스크의 파일이기 때문입니다.**

```
GitHub 서버:              A ── B ── C ── D    (팀원이 D 를 올림)

내 컴퓨터:
  .git/refs/remotes/origin/main  →  C 의 해시    ← 갱신 안 됨
  .git/refs/heads/main           →  C 의 해시
```

`git status` 는 **`refs/heads/main` 과 `refs/remotes/origin/main` 을 비교**할 뿐입니다. 둘 다 `C` 이니 "up to date"라고 답합니다. **서버에 물어보지 않습니다.**

**직접 확인**

```bash
cat .git/refs/remotes/origin/main       # 또는
git rev-parse origin/main
git ls-remote origin main               # ← 이건 실제로 서버에 물어봄
```

두 값이 다르면 캐시가 낡은 것입니다.

**갱신하는 방법**

```bash
git fetch
```

refspec에 따라 서버의 `refs/heads/*` 를 내 `refs/remotes/origin/*` 에 복사합니다.

```bash
git config --get-all remote.origin.fetch
# +refs/heads/*:refs/remotes/origin/*
```

**갱신 후**

```bash
git status
# Your branch is behind 'origin/main' by 1 commit
git log --oneline ..@{u}       # 원격에만 있는 커밋
```

**핵심 한 줄**
> **`git fetch` 는 "서버에 물어보는" 유일한 읽기 명령입니다.**
> `status`, `log`, `diff` 는 전부 로컬 파일만 봅니다.
</details>

**3.** `git rebase` 를 하다 잘못돼서 브랜치가 엉망이 됐습니다. **rebase 시작 전으로 되돌리는 방법**을 두 가지 이상 설명하세요.

<details>
<summary>답 보기</summary>

**① rebase가 아직 진행 중이라면 — `--abort`**

```bash
git status                # "interactive rebase in progress" 확인
git rebase --abort
```

가장 깨끗한 방법입니다. 완전히 원래대로 돌아갑니다.

**② 이미 끝났다면 — `ORIG_HEAD`**

```bash
cat .git/ORIG_HEAD
git reset --hard ORIG_HEAD
```

`rebase` 는 시작 전 위치를 `ORIG_HEAD` 에 기록합니다.

⚠️ **주의** — `ORIG_HEAD` 는 `reset`·`merge`·`pull` 로도 덮어써집니다. rebase 후에 다른 작업을 했다면 값이 바뀌었을 수 있습니다.

**③ reflog** ([23강](lesson-23.md))

가장 확실한 방법입니다.

```bash
git reflog
```

```
a3f9c2e HEAD@{0}: rebase (finish): returning to refs/heads/feature/x
1a9c7e3 HEAD@{1}: rebase (pick): feat: ...
...
9f3b1e8 HEAD@{5}: checkout: moving from main to feature/x    ← rebase 직전
```

```bash
git reset --hard 9f3b1e8
```

**④ 미리 만들어 둔 백업 브랜치** ([18강](lesson-18.md))

```bash
git branch backup-before-rebase      # rebase 전에 만들어 뒀다면
git reset --hard backup-before-rebase
```

**추천 순서**

```
진행 중       →  ① --abort
방금 끝남     →  ② ORIG_HEAD
그 이후       →  ③ reflog
미리 대비     →  ④ 백업 브랜치  ← 가장 확실
```

**이미 push한 뒤라면** — 로컬을 되돌린 다음 `git push --force-with-lease` 가 필요합니다. 개인 브랜치인지 반드시 확인하세요 ([17강](lesson-17.md)).
</details>

---

## 오늘의 정리

**참조의 실체**

```
.git/refs/heads/main   →  "22dfff0a279d..." (해시 40자, 텍스트 파일)
.git/HEAD              →  "ref: refs/heads/main" (심볼릭 참조)

HEAD ──▶ 브랜치 ──▶ 커밋 객체
```

**detached HEAD**

```
평소:      HEAD ──▶ refs/heads/main ──▶ 커밋
detached:  HEAD ─────────────────────▶ 커밋   ← 커밋해도 브랜치가 안 따라옴
```

**명령**

| 명령 | 하는 일 |
|---|---|
| `git show-ref` | 모든 참조 (packed 포함) |
| `git for-each-ref --format=...` | 스크립트용 참조 목록 |
| `git symbolic-ref HEAD` | HEAD가 가리키는 **브랜치 이름** |
| `git rev-parse <표기>` | 표기를 **해시로 변환** |
| `git rev-parse --abbrev-ref HEAD` | **현재 브랜치 이름** |
| `git rev-parse --show-toplevel` | 저장소 루트 경로 |
| `git update-ref <ref> <해시>` | 참조 설정 (reflog 기록됨) |
| `git update-ref -d <ref>` | 참조 삭제 |
| `git ls-remote origin` | **서버에 직접 물어보기** |

**의사 참조**

| 이름 | 언제 |
|---|---|
| **`ORIG_HEAD`** | reset·merge·rebase·pull **직전 위치** → 복구용 |
| `MERGE_HEAD` | 병합 중 (있으면 충돌 상태) |
| `FETCH_HEAD` | 방금 fetch한 것 |
| `CHERRY_PICK_HEAD` / `REVERT_HEAD` | 각 작업 진행 중 |

**리비전 표기**

| 표기 | 뜻 |
|---|---|
| `HEAD~2` | 첫 부모를 2번 따라감 |
| `HEAD^2` | **둘째 부모** (머지 커밋) |
| `v1.0.0^{}` | 태그가 최종적으로 가리키는 커밋 |
| `HEAD^{tree}` | 그 커밋의 트리 |
| **`@{u}`** | upstream (`origin/main`) |
| `@{-1}` | 직전 브랜치 |
| `:/텍스트` | 메시지로 커밋 찾기 |

**refspec**

```
+refs/heads/*:refs/remotes/origin/*
  원격의 이것을    내 로컬 이 위치로

→ origin/main 은 내 디스크의 파일. git fetch 때만 갱신됨
```

**오늘 반드시 기억할 한 가지**
> **브랜치는 해시 40자가 적힌 파일 하나입니다.**
> 그래서 만들기·지우기가 공짜이고, `origin/main` 도 서버가 아니라 **내 파일**입니다.

**과제**
1. `cat .git/refs/heads/main` 과 `git rev-parse HEAD` 결과가 같은지 확인하세요.
2. `git update-ref` 로 브랜치를 만들고, `git branch` 에 나타나는지 확인한 뒤 삭제하세요.
3. detached HEAD 상태에서 커밋한 뒤 `git switch main` 으로 나오면서 **경고 메시지**를 읽고, 그 해시로 브랜치를 만들어 되살리세요.
4. `git reset --hard HEAD~1` 후 `cat .git/ORIG_HEAD` 로 복구하세요.
5. 가짜 원격(`git init --bare`)을 만들어 push한 뒤 `refs/remotes/origin/main` 파일이 생기는 것을 확인하세요.
6. `git log ..@{u}` 와 `git log @{u}..` 를 실행해 각각 무엇을 보여 주는지 확인하세요.
7. `git rev-parse ":/첫"` 으로 메시지 검색이 동작하는지 확인하세요.

---

[← 이전 21강](lesson-21.md) · [목차](README.md) · [다음 → 23강 reflog](lesson-23.md)
