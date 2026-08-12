# 03강 · 저장소와 세 개의 공간

> **Git 학습 매뉴얼** · 🟢 초급 · **03강 / 30**
> [← 이전 02강](lesson-02.md) · [목차](README.md) · [다음 → 04강 변경 기록하기](lesson-04.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git init` 으로 저장소를 만들고, 그때 실제로 무엇이 생기는지 설명할 수 있다.
- **작업 디렉터리 · 스테이지 · 저장소** 세 공간의 역할을 그림으로 그려 설명할 수 있다.
- `git status` 출력을 읽고 지금 파일이 어느 공간에 있는지 판단할 수 있다.
- 추적되는 파일(tracked)과 추적되지 않는 파일(untracked)을 구분할 수 있다.

---

## ② 왜 필요한가

Git을 외워서 쓰는 사람과 이해하고 쓰는 사람은 여기서 갈립니다.

많은 사람이 이렇게 외웁니다.

```bash
git add .
git commit -m "수정"
git push
```

세 줄이 잘 될 때는 문제가 없습니다. 그런데 이런 상황이 오면 손을 못 댑니다.

- **"실수로 `add` 한 파일을 빼고 싶어요."** → `add` 가 무엇을 했는지 모르면 뺄 수도 없습니다.
- **"커밋은 했는데 파일이 안 올라갔어요."** → 그 파일이 스테이지에 없었던 것입니다.
- **"이 파일만 빼고 커밋하고 싶어요."** → `add .` 만 외웠다면 불가능합니다.

Git에는 **세 개의 공간**이 있고, 모든 명령은 결국 **"어느 공간에서 어느 공간으로 옮기는가"** 입니다. 이 그림 하나만 머리에 넣으면 앞으로 나올 `add` · `commit` · `restore` · `reset` 이 전부 같은 이야기의 변주로 보입니다.

---

## ③ 개념 설명

### 저장소(repository)란

**저장소**는 Git이 이력을 관리하는 폴더입니다. 평범한 폴더에 `.git` 이라는 숨김 폴더가 하나 생기면, 그 순간부터 그 폴더는 저장소가 됩니다.

```
git-practice/            ← 평범한 폴더
└── hello.py

git init 실행

git-practice/            ← 이제 "저장소"
├── .git/                  ← 이 폴더가 전부입니다
└── hello.py
```

> **`.git` 폴더가 곧 저장소입니다.** 이력·설정·객체가 전부 여기 들어 있습니다.
> 이 폴더를 지우면 **이력이 통째로 사라지고** 평범한 폴더로 돌아갑니다. 파일 자체는 남습니다.

### 세 개의 공간

Git의 전부라고 해도 좋습니다.

```
  작업 디렉터리            스테이지               저장소
 (Working Directory)   (Staging Area)      (Repository / .git)
 ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
 │  내가 파일을    │    │ 다음 커밋에    │    │  확정된 기록  │
 │  고치는 곳      │    │ 담을 것들을    │    │  (영구 보관)  │
 │               │    │ 골라 둔 곳     │    │              │
 └───────────────┘    └──────────────┘    └──────────────┘
         │    git add          │    git commit     │
         └───────────────────▶ └────────────────▶ │
         ◀───────────────────  ◀────────────────  │
            git restore          git restore --staged
```

| 공간 | 다른 이름 | 하는 일 |
|---|---|---|
| **작업 디렉터리** | Working Tree | 내가 실제로 파일을 만들고 고치는 곳. 눈에 보이는 그 폴더 |
| **스테이지** | Staging Area, **Index** | 다음 커밋에 **포함시킬 것만 골라 담아 두는 장바구니** |
| **저장소** | Repository, `.git` | 커밋된 기록이 영구히 쌓이는 곳 |

### 스테이지는 왜 있나요 — 장바구니 비유

가장 많이 나오는 질문입니다. **"바로 커밋하면 되지 왜 중간에 한 단계를 두나요?"**

온라인 쇼핑을 떠올리면 정확합니다.

| 쇼핑 | Git |
|---|---|
| 상품을 구경한다 | 파일을 고친다 (작업 디렉터리) |
| **장바구니에 담는다** | **`git add`** (스테이지) |
| 담은 것만 결제한다 | `git commit` (저장소) |
| 장바구니에서 뺀다 | `git restore --staged` |

장바구니가 있어서 좋은 점이 그대로 Git의 장점입니다.

**오늘 파일 3개를 고쳤다고 해 봅시다.**

```
login.py    ← 로그인 버그 수정
signup.py   ← 로그인 버그 수정 (같은 작업)
memo.txt    ← 그냥 끄적인 메모 (전혀 다른 것)
```

스테이지가 없으면 셋을 한 커밋에 몰아넣어야 합니다. 나중에 "로그인 버그 수정" 커밋만 되돌리려 하면 관계없는 메모까지 딸려 옵니다.

스테이지가 있으면 이렇게 나눌 수 있습니다.

```bash
git add login.py signup.py
git commit -m "fix: 로그인 실패 시 세션이 남는 문제 수정"

git add memo.txt
git commit -m "docs: 회의 메모 추가"
```

> **커밋 하나 = 의미 하나.** 이 원칙을 지킬 수 있게 해 주는 장치가 스테이지입니다.
> 파일 안에서 **일부 줄만** 골라 담는 것도 가능합니다 (`git add -p`, [15강](lesson-15.md)).

### 파일의 네 가지 상태

```
   Untracked          Unmodified         Modified          Staged
  (추적 안 함)         (변경 없음)         (수정됨)          (담김)
       │                   │                 │                │
       │  git add          │   파일 수정      │   git add      │
       └──────────────────────────────────────────────────────▶
                           ◀──────────────────────────────────┘
                                    git commit
```

| 상태 | 뜻 | `git status` 에서 |
|---|---|---|
| **Untracked** | Git이 존재를 모르는 새 파일 | `Untracked files:` |
| **Unmodified** | 마지막 커밋과 똑같음 | **아무 데도 안 나옴** |
| **Modified** | 커밋 이후 고쳐짐 | `Changes not staged for commit:` |
| **Staged** | 다음 커밋에 담김 | `Changes to be committed:` |

> **아무것도 안 나오는 것이 가장 깨끗한 상태**입니다.
> `nothing to commit, working tree clean` 이 뜨면 작업 디렉터리와 마지막 커밋이 완전히 같다는 뜻입니다.

### `git status` 읽는 법

Git에서 가장 많이 치게 될 명령입니다. **의심스러우면 일단 `git status`** 를 치세요. Git은 대부분 다음에 뭘 해야 하는지까지 알려 줍니다.

```
On branch main                                        ← ① 지금 브랜치

Changes to be committed:                              ← ② 스테이지 (커밋하면 들어감)
  (use "git restore --staged <file>..." to unstage)
	new file:   hello.py

Changes not staged for commit:                        ← ③ 수정됐지만 안 담김
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   README.md

Untracked files:                                      ← ④ Git이 모르는 파일
  (use "git add <file>..." to include in what will be committed)
	memo.txt
```

**②는 초록색, ③④는 빨간색**으로 표시됩니다. 색만 봐도 "초록은 커밋에 들어갈 것, 빨강은 안 들어갈 것" 으로 구분됩니다.

---

## ④ 단계별 실습

### Step 1. 연습용 저장소 만들기

**10강까지 계속 쓸 폴더**입니다. 바탕화면에 만들겠습니다.

```bash
cd ~/Desktop
mkdir git-practice
cd git-practice
```

> PowerShell에서는 `cd ~/Desktop` 대신 `cd $HOME\Desktop` 을 씁니다.
> OneDrive를 쓰고 있다면 바탕화면 경로가 다를 수 있습니다. `pwd` 로 현재 위치를 확인하세요.

이제 저장소로 만듭니다.

```bash
git init
```

실행 결과:

```
Initialized empty Git repository in C:/Users/LEE/Desktop/git-practice/.git/
```

> [02강](lesson-02.md)에서 `init.defaultBranch main` 을 설정하지 않았다면 아래 같은 안내(hint)가 함께 나오고 브랜치 이름이 `master` 가 됩니다.
> ```
> hint: Using 'master' as the name for the initial branch. This default branch name
> hint: is subject to change. To configure the initial branch name to use in all
> hint: of your new repositories, which will suppress this warning, call:
> hint:
> hint: 	git config --global init.defaultBranch <name>
> ```
> 지금이라도 설정하면 다음 저장소부터 적용됩니다.

### Step 2. 무엇이 생겼는지 눈으로 확인하기

```bash
ls -a
```

실행 결과:

```
./  ../  .git/
```

`.git` 폴더 하나가 전부입니다. 안을 열어 봅니다.

```bash
ls .git
```

실행 결과:

```
config  description  HEAD  hooks/  info/  objects/  refs/
```

| 항목 | 정체 |
|---|---|
| `config` | 이 저장소만의 설정 (`--local` 이 여기 저장됩니다) |
| `HEAD` | **지금 내가 어느 브랜치에 있는지** 를 가리키는 파일 |
| `objects/` | **커밋·파일 내용이 실제로 저장되는 곳** |
| `refs/` | 브랜치·태그가 어느 커밋을 가리키는지 |
| `hooks/` | 특정 시점에 자동 실행할 스크립트 ([26강](lesson-26.md)) |

`HEAD` 파일은 그냥 텍스트입니다. 열어 보세요.

```bash
cat .git/HEAD
```

실행 결과:

```
ref: refs/heads/main
```

> "나는 지금 `main` 브랜치에 있다" 는 한 줄입니다. Git의 내부는 생각보다 단순한 텍스트와 파일의 조합입니다.
> 본격적인 해부는 [21강](lesson-21.md)에서 합니다.

⚠️ **`.git` 폴더 안의 파일을 손으로 고치거나 지우지 마세요.** 지금은 구경만 합니다.

### Step 3. 빈 저장소의 상태 보기

```bash
git status
```

실행 결과:

```
On branch main

No commits yet

nothing to commit (create/copy files and use "git add" to track)
```

세 줄이 각각 이런 뜻입니다.

- `On branch main` — 지금 `main` 브랜치에 있습니다.
- `No commits yet` — 아직 커밋이 하나도 없습니다.
- `nothing to commit` — 기록할 것이 없습니다. (파일을 만들라고 안내까지 해 줍니다)

### Step 4. 파일을 만들고 상태 변화 관찰하기

이번 강의 핵심입니다. **매 단계마다 `git status` 를 치면서** 파일이 어느 공간에 있는지 확인합니다.

**① 파일 만들기 → Untracked**

`hello.py` 를 만듭니다.

```python
print("안녕하세요, Git!")
```

```bash
git status
```

실행 결과:

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	hello.py

nothing added to commit but untracked files present (use "git add" to track)
```

> **Untracked** — 폴더 안에 있긴 하지만 Git은 아직 이 파일을 관리 대상으로 보지 않습니다.
> Git은 **자동으로 추적하지 않습니다.** 내가 `add` 로 알려 줘야 합니다.

**② `git add` → Staged**

```bash
git add hello.py
git status
```

실행 결과:

```
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
	new file:   hello.py
```

> 문구가 `Untracked files` 에서 **`Changes to be committed`** 로 바뀌었습니다.
> 파일이 **작업 디렉터리 → 스테이지**로 이동한 것입니다. (원본은 그대로 있습니다. 복사해 담은 것에 가깝습니다)

**③ 파일을 또 고치면 → 같은 파일이 두 곳에**

`hello.py` 에 한 줄을 더 씁니다.

```python
print("안녕하세요, Git!")
print("두 번째 줄입니다")
```

```bash
git status
```

실행 결과:

```
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
	new file:   hello.py

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   hello.py
```

**같은 파일이 위아래에 동시에 나왔습니다.** 이 화면을 이해하면 세 공간을 이해한 것입니다.

```
작업 디렉터리:  print(...)          스테이지:  print(...)
               print("두 번째")               (1줄짜리 옛날 버전)
                     ▲                              ▲
          "modified" 로 나온 것             "new file" 로 나온 것
```

`git add` 는 **그 순간의 내용을 스냅샷으로 담습니다.** 그 뒤에 파일을 또 고치면 스테이지의 내용과 달라지고, 그래서 양쪽에 다 나오는 것입니다.

> **여기서 커밋하면 무엇이 기록될까요?** → **스테이지에 담긴 1줄짜리 버전**입니다. 두 번째 줄은 커밋에 안 들어갑니다.
> 이것이 "커밋했는데 왜 그 내용이 없죠?" 의 가장 흔한 원인입니다.

**④ 다시 `add` → 스테이지 갱신**

```bash
git add hello.py
git status
```

실행 결과:

```
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
	new file:   hello.py
```

한 줄로 정리됐습니다. 이제 작업 디렉터리와 스테이지의 내용이 같습니다.

> **오늘은 여기까지입니다.** 실제 커밋은 [04강](lesson-04.md)에서 합니다.
> `git-practice` 폴더는 **지우지 말고 그대로 두세요.** 10강까지 계속 씁니다.

### 같은 일을 GUI로 하면

VS Code에서 `git-practice` 폴더를 열고 `Ctrl+Shift+G` (Source Control).

| 화면 | 대응하는 공간 |
|---|---|
| **Changes** 영역 | 작업 디렉터리 (아직 안 담김) |
| **Staged Changes** 영역 | 스테이지 |
| 파일 옆 `+` 버튼 | `git add` |
| 파일 옆 `−` 버튼 | `git restore --staged` |
| 파일 옆 글자 `U` / `M` | Untracked / Modified |

> Step 4의 ③ 상황(같은 파일이 양쪽에)을 VS Code에서 보면 **Changes와 Staged Changes에 같은 파일이 동시에** 나타납니다. 명령어로 본 것과 정확히 같은 이야기입니다.

---

## ⑤ 자주 하는 실수

### `fatal: not a git repository`

```
fatal: not a git repository (or any of the parent directories): .git
```

**원인** — 지금 있는 위치가 Git 저장소가 아닙니다. 대부분 **폴더를 잘못 들어간** 경우입니다.
**해결** — 현재 위치와 `.git` 존재 여부를 확인합니다.

```bash
pwd          # 지금 어디에 있는지
ls -a        # .git 폴더가 보이는지
```

`.git` 이 없다면 폴더를 잘못 찾아온 것이거나, 아직 `git init` 을 안 한 것입니다.

### 바탕화면이나 홈 폴더 전체에 `git init` 실행

가장 흔하고 가장 당황스러운 사고입니다.

```bash
cd ~/Desktop
git init         # ← 폴더를 안 만들고 바로 실행!
```

**증상** — `git status` 를 치면 바탕화면의 모든 파일이 Untracked로 수백 줄 쏟아집니다.
**원인** — 프로젝트 폴더로 들어가지 않고 상위 폴더에서 실행했습니다.
**해결** — 잘못 만든 `.git` 폴더를 지우면 원래대로 돌아갑니다.

```bash
cd ~/Desktop
ls -a            # .git 이 있는지 반드시 먼저 확인
rm -rf .git      # 커밋한 게 없다면 안전합니다
```

> ⚠️ **`rm -rf .git` 은 이력을 통째로 지웁니다.** 실행 전에 **지금 위치가 맞는지** `pwd` 로 반드시 확인하세요.
> 진짜 프로젝트 폴더에서 이걸 치면 이력이 전부 사라집니다.

**예방법** — `git init` 전에 항상 `pwd` 로 위치를 확인하는 습관을 들이세요.

### 저장소 안에 또 저장소 만들기

```
project/
├── .git/
└── sub-project/
    └── .git/        ← 여기서 또 git init
```

**증상** — 바깥 저장소에서 `sub-project` 안의 파일이 안 보이거나, 폴더 하나가 통째로 이상하게 취급됩니다.
**원인** — Git은 `.git` 을 만나면 그 안쪽을 별개 저장소로 보고 관리에서 제외합니다.
**해결** — 의도한 게 아니면 안쪽 `.git` 을 지우세요. 의도한 것이라면 **서브모듈**이라는 정식 방법이 있습니다 ([28강](lesson-28.md)).

### `git add` 했으니 저장된 줄 알기

**원인** — `add` 는 **장바구니에 담은 것**일 뿐, 결제(커밋)가 아닙니다.
**해결** — `git commit` 까지 해야 이력에 남습니다. `git status` 에서 `Changes to be committed` 는 아직 **커밋 전**이라는 뜻입니다.

### 파일을 고치면 스테이지 내용도 같이 바뀔 것이라 생각하기

Step 4의 ③에서 본 상황입니다.

**원인** — `add` 는 그 순간의 내용을 **찍어서** 담습니다. 파일과 실시간으로 연결되어 있지 않습니다.
**해결** — 고칠 때마다 다시 `git add` 를 해야 합니다.

> 그래서 실무에서는 **커밋 직전에 `git status` 로 한 번 더 확인**하는 습관이 중요합니다.

### `.git` 폴더를 지우거나 옮기기

**증상** — 이력이 전부 사라지고 `fatal: not a git repository` 가 뜹니다.
**원인** — 저장소 자체를 지운 것입니다. 파일은 남지만 **모든 커밋 기록이 소실**됩니다.
**해결** — GitHub에 올려 둔 적이 있다면 다시 `clone` 해서 복구할 수 있습니다([09강](lesson-09.md)). 없다면 복구 불가입니다.

> `.git` 은 숨김 폴더라 파일 탐색기에서 "숨김 항목 표시"를 켜야 보입니다. 폴더를 복사·이동할 때 **`.git` 이 같이 따라갔는지** 꼭 확인하세요.

---

## ⑥ 확인 문제

**1.** 아래 `git status` 결과를 보고, 지금 커밋하면 **무엇이 기록되는지** 답하세요.

```
On branch main
Changes to be committed:
	modified:   a.txt

Changes not staged for commit:
	modified:   b.txt

Untracked files:
	c.txt
```

<details>
<summary>답 보기</summary>

**`a.txt` 의 변경 사항만** 기록됩니다.

| 파일 | 상태 | 커밋에 들어가나 |
|---|---|---|
| `a.txt` | Staged | ✅ 들어감 |
| `b.txt` | Modified (스테이지 안 됨) | ❌ 안 들어감 |
| `c.txt` | Untracked | ❌ 안 들어감 |

**판별법** — `Changes to be committed:` 아래에 있는 것만 커밋됩니다. 나머지는 전부 제외입니다.

셋 다 커밋하려면 먼저 담아야 합니다.

```bash
git add b.txt c.txt
```
</details>

**2.** 아래 순서로 작업했습니다. 커밋에는 **어떤 내용**이 들어갈까요?

```bash
# hello.txt 에 "첫 줄" 만 있는 상태
git add hello.txt
# 이후 hello.txt 에 "둘째 줄" 을 추가하고 저장
git commit -m "메모 추가"
```

<details>
<summary>답 보기</summary>

**"첫 줄" 만** 커밋됩니다. "둘째 줄"은 들어가지 않습니다.

`git add` 는 **그 순간의 파일 내용을 스테이지에 찍어 둡니다.** 이후에 파일을 고쳐도 스테이지의 내용은 바뀌지 않습니다.

```
작업 디렉터리: 첫 줄 / 둘째 줄     ← 실제 파일
스테이지:      첫 줄               ← add 한 시점의 사진  ← 이게 커밋됨
```

커밋 후 `git status` 를 치면 `hello.txt` 가 여전히 `modified` 로 남아 있는 것으로 확인할 수 있습니다.

**해결** — 커밋 전에 다시 `git add hello.txt` 를 하거나, 처음부터 `git commit -am "메모 추가"` 를 씁니다. (단, `-a` 는 **이미 추적 중인 파일만** 담습니다. 새 파일은 여전히 `add` 가 필요합니다 — [04강](lesson-04.md))
</details>

**3.** 팀원이 프로젝트 폴더를 압축해서 메일로 보내 줬는데, 압축을 풀고 `git log` 를 치니 `fatal: not a git repository` 가 뜹니다. 무슨 일이 있었을까요?

<details>
<summary>답 보기</summary>

**압축할 때 `.git` 폴더가 빠졌습니다.**

`.git` 은 숨김 폴더입니다. 파일 탐색기에서 "숨김 항목"을 꺼 둔 채로 내용물을 드래그해 압축하면 `.git` 이 통째로 누락됩니다. 그러면 파일은 다 있지만 **이력은 하나도 없는 평범한 폴더**가 됩니다.

**확인 방법**

```bash
ls -a           # .git 이 보이는지
```

**해결·예방**
- 폴더를 **통째로** 압축하거나(안의 내용물만 고르지 말 것), 숨김 항목 표시를 켜세요.
- 애초에 **압축파일로 코드를 주고받지 마세요.** 그러라고 GitHub가 있습니다([09강](lesson-09.md)).
  `git clone` 이면 이력까지 완전히 그대로 옵니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 저장소 | `.git` 폴더가 있는 폴더. **`.git` 이 곧 저장소** |
| `git init` | 현재 폴더를 저장소로 만듦 (`.git` 생성) |
| 작업 디렉터리 | 내가 파일을 고치는 곳 |
| **스테이지** | 다음 커밋에 담을 것을 골라 두는 **장바구니** |
| 저장소 | 커밋이 영구히 쌓이는 곳 |
| `git add` | 작업 디렉터리 → 스테이지 (**그 순간의 내용을 찍어서** 담음) |
| `git status` | 지금 어떤 파일이 어느 공간에 있는지 확인 |
| Untracked | Git이 모르는 파일. `add` 하기 전까지 관리되지 않음 |

**한 장 요약**

```
 작업 디렉터리  ──git add──▶  스테이지  ──git commit──▶  저장소
   (고친다)                   (고른다)                  (남긴다)
```

**오늘 반드시 기억할 한 가지**
> **막히면 `git status`.** Git은 지금 상태와 다음에 할 일까지 알려 줍니다.
> 그리고 `git add` 는 **담는 것**이지 저장이 아닙니다.

**과제**
1. `git-practice` 폴더에 `README.md` 를 만들고, `git status` → `git add` → `git status` 순으로 실행하며 문구가 어떻게 바뀌는지 관찰하세요.
2. `add` 한 뒤 파일을 한 번 더 고치고 `git status` 를 쳐서, **같은 파일이 위아래에 동시에 나오는 화면**을 직접 만들어 보세요.
3. `.git/HEAD` 와 `.git/config` 를 열어 내용을 확인하세요. (읽기만 하고 고치지 마세요)

---

[← 이전 02강](lesson-02.md) · [목차](README.md) · [다음 → 04강 변경 기록하기](lesson-04.md)
