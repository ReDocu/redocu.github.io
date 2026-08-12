# 04강 · 변경 기록하기

> **Git 학습 매뉴얼** · 🟢 초급 · **04강 / 30**
> [← 이전 03강](lesson-03.md) · [목차](README.md) · [다음 → 05강 무시할 파일 정하기](lesson-05.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git add` → `git commit` 으로 변경 사항을 기록으로 남길 수 있다.
- 커밋 하나에 무엇을 담아야 하는지 판단하고, 작업을 여러 커밋으로 나눌 수 있다.
- 남이 읽을 수 있는 커밋 메시지를 쓸 수 있다.
- 파일 삭제·이름 변경을 Git에 제대로 기록할 수 있다.

---

## ② 왜 필요한가

[03강](lesson-03.md)에서 장바구니(스테이지)에 물건을 담는 것까지 했습니다. 오늘은 **결제**를 합니다.

커밋은 단순히 "저장"이 아닙니다. **미래의 나와 팀원에게 보내는 편지**입니다.

6개월 뒤 이런 이력을 만나면 어떨까요.

```
a3f9c21 수정
8e1d4b0 수정2
c7b2a95 asdf
2f8e6d4 최종
1a4c9e7 진짜최종
```

무엇 하나 알 수 없습니다. 버그가 언제 들어왔는지 찾으려면 커밋을 하나씩 열어 봐야 합니다.

반면 이렇게 되어 있다면,

```
a3f9c21 fix: 로그인 실패 시 세션이 남아 있는 문제 수정
8e1d4b0 feat: 회원가입에 이메일 중복 검사 추가
c7b2a95 docs: README에 설치 방법 추가
```

**커밋 목록만 읽어도 프로젝트의 역사가 보입니다.** 그리고 나중에 배울 `bisect`([25강](lesson-25.md))나 `revert`([17강](lesson-17.md)) 같은 강력한 도구는 **커밋이 잘 나뉘어 있을 때만** 쓸모가 있습니다.

오늘 들이는 습관이 앞으로 26강 동안의 난이도를 결정합니다.

---

## ③ 개념 설명

### 커밋이란

**커밋(commit)** 은 스테이지에 담긴 내용을 저장소에 **영구 기록으로 확정**하는 것입니다. 커밋 하나에는 이런 정보가 함께 저장됩니다.

| 정보 | 예 |
|---|---|
| 변경된 내용(스냅샷) | `hello.py` 가 이런 모습이었다 |
| 작성자 | `Hong Gildong <hong@example.com>` ([02강](lesson-02.md)에서 설정한 것) |
| 시각 | `Mon Aug 10 14:32:05 2026 +0900` |
| 메시지 | `feat: 인사 출력 프로그램 추가` |
| 이전 커밋 | `4b8e2d5` (부모 커밋을 가리킴) |
| **커밋 해시** | `9f3c1a7e2b4d...` (이 전부를 계산해서 만든 이름표) |

### 커밋 해시

커밋마다 붙는 40자리 16진수 이름입니다. 내용을 조금이라도 바꾸면 완전히 다른 값이 나옵니다.

```
9f3c1a7e2b4d6f8a0c1e3d5b7a9f2c4e6d8b0a12
└──────┘
 앞 7자리만 써도 보통 구분됩니다 → 9f3c1a7
```

> Git에서 커밋을 가리킬 땐 `9f3c1a7` 처럼 **앞 7자리만** 써도 됩니다.
> 그래서 이 강의 예시 결과에 나오는 해시는 **여러분 화면과 다릅니다.** 시각·작성자가 다르면 해시도 달라지기 때문입니다. 당연한 일이니 놀라지 마세요.

### 커밋 하나에 무엇을 담을까 — 원자적 커밋

가장 중요한 원칙 하나입니다.

> **커밋 하나 = 되돌릴 수 있는 의미 하나**

"이 커밋만 취소해도 프로젝트가 말이 되는가?" 를 기준으로 삼으면 됩니다.

| 이렇게 하세요 ✅ | 이러지 마세요 ❌ |
|---|---|
| 로그인 버그 수정 → 커밋 | 3일치 작업을 한 번에 커밋 |
| README 오타 수정 → 커밋 | 버그 수정 + 새 기능 + 오타를 한 커밋에 |
| 기능 하나 완성 → 커밋 | 파일 저장할 때마다 커밋 |

**커밋을 나누는 기준**

```
"그리고" 를 넣어야 설명된다면 → 나눠야 합니다
  "로그인 버그를 고치고 README도 수정했다"  →  커밋 2개
```

**너무 잘게 쪼개도 문제입니다.** `print` 한 줄 지운 것까지 커밋하면 이력이 노이즈로 가득 찹니다. 실무 감각으로는 **하루에 3~10개** 정도가 적당합니다.

> 작업하다 보면 여러 가지가 뒤섞이기 마련입니다. 그때 파일 안의 **일부 줄만 골라 담는** 방법(`git add -p`)이 있습니다. [15강](lesson-15.md)에서 다룹니다.

### 커밋 메시지 쓰는 법

기본 형식은 이렇습니다.

```
<타입>: <무엇을 했는지 한 줄>       ← 제목 (50자 이내)
                                  ← 빈 줄 (필수)
왜 이렇게 했는지, 어떤 문제가 있었는지.  ← 본문 (선택, 72자에서 줄바꿈)
```

**타입**은 팀마다 다르지만 아래가 가장 널리 쓰입니다 (Conventional Commits, [15강](lesson-15.md)에서 자세히).

| 타입 | 언제 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서만 수정 |
| `style` | 코드 동작과 무관한 형식 (공백, 세미콜론) |
| `refactor` | 동작은 그대로, 구조 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드·설정 등 잡일 |

**세 가지 규칙**

1. **제목은 무엇을 했는지.** 마침표는 안 찍습니다.
2. **본문은 "왜"를 씁니다.** "무엇을 바꿨는지"는 코드를 보면 압니다. **왜 그랬는지는 코드에 안 남습니다.**
3. **명령형으로 씁니다.** "추가함" 보다 "추가" — "이 커밋을 적용하면 ~한다" 로 읽히게.

```
❌ 수정
❌ 버그 고침
❌ ㅁㄴㅇㄹ
❌ 오늘 작업분

✅ fix: 장바구니에서 수량 0 입력 시 에러 발생하는 문제 수정
✅ feat: 비밀번호 재설정 메일 발송 기능 추가
✅ docs: README에 로컬 실행 방법 추가
```

> 한글로 써도 전혀 문제없습니다. **팀 안에서 일관되면** 됩니다.

### 세 공간에서 커밋의 위치

```
 작업 디렉터리  ──git add──▶  스테이지  ──git commit──▶  저장소
                                            ▲
                                   오늘 배우는 곳
```

`commit` 은 **스테이지에 있는 것만** 가져갑니다. 작업 디렉터리에만 있는 변경은 남겨 둡니다.

---

## ④ 단계별 실습

### Step 0. 지난 강 상태 확인

[03강](lesson-03.md)에서 만든 폴더로 이동합니다.

```bash
cd ~/Desktop/git-practice
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

`hello.py` 가 스테이지에 담긴 상태입니다. (다르게 나와도 괜찮습니다. 아래를 그대로 따라오면 됩니다)

### Step 1. 첫 커밋 만들기

```bash
git commit -m "feat: 인사 출력 프로그램 추가"
```

실행 결과:

```
[main (root-commit) 4b8e2d5] feat: 인사 출력 프로그램 추가
 1 file changed, 2 insertions(+)
 create mode 100644 hello.py
```

출력을 한 줄씩 읽어 봅시다.

| 부분 | 뜻 |
|---|---|
| `[main ...]` | `main` 브랜치에 커밋됨 |
| `(root-commit)` | **부모가 없는 최초의 커밋** (이 표시는 첫 커밋에만 나옵니다) |
| `4b8e2d5` | 이 커밋의 해시 앞 7자리 |
| `1 file changed, 2 insertions(+)` | 파일 1개, 2줄 추가 |
| `create mode 100644` | 새 파일이 만들어짐 (`100644` 는 일반 파일이라는 뜻) |

바로 상태를 확인합니다.

```bash
git status
```

실행 결과:

```
On branch main
nothing to commit, working tree clean
```

> **`working tree clean`** — 작업 디렉터리와 마지막 커밋이 완전히 같습니다. 가장 깨끗한 상태입니다.
> `No commits yet` 이 사라진 것도 확인하세요. 이제 이력이 생겼습니다.

### Step 2. 기록 확인하기

```bash
git log
```

실행 결과:

```
commit 4b8e2d5c9a1f3e7b0d2c4a6e8f0b1d3c5a7e9f21 (HEAD -> main)
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 14:32:05 2026 +0900

    feat: 인사 출력 프로그램 추가
```

[02강](lesson-02.md)에서 설정한 이름과 이메일이 여기 새겨져 있습니다.

한 줄로 짧게 보려면:

```bash
git log --oneline
```

실행 결과:

```
4b8e2d5 (HEAD -> main) feat: 인사 출력 프로그램 추가
```

> `git log` 를 쳤을 때 화면 아래에 `:` 만 뜨고 멈춘 것 같으면 페이저(pager)에 들어간 것입니다.
> **`q` 를 누르면 빠져나옵니다.** 위아래 화살표로 스크롤할 수 있습니다. 자세한 것은 [06강](lesson-06.md)에서 다룹니다.

### Step 3. 여러 파일을 나눠서 커밋하기

이번 강의 핵심 연습입니다. 파일 두 개를 만들되 **서로 다른 커밋**으로 나눕니다.

`README.md` 를 만듭니다.

```markdown
# Git 연습 프로젝트

Git 학습 매뉴얼 초급 과정에서 사용하는 연습용 저장소입니다.
```

`hello.py` 도 고칩니다.

```python
print("안녕하세요, Git!")
print("두 번째 줄입니다")
print("반갑습니다")
```

지금 상태를 봅니다.

```bash
git status
```

실행 결과:

```
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   hello.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md

no changes added to commit (use "git add" and/or "git commit -a")
```

두 변경은 **성격이 다릅니다.** 하나는 문서 추가, 하나는 코드 수정입니다. 그러니 커밋을 나눕니다.

```bash
git add README.md
git commit -m "docs: 프로젝트 소개 README 추가"
```

실행 결과:

```
[main 9f3c1a7] docs: 프로젝트 소개 README 추가
 1 file changed, 3 insertions(+)
 create mode 100644 README.md
```

```bash
git add hello.py
git commit -m "feat: 인사말 한 줄 추가"
```

실행 결과:

```
[main 7c9d1e2] feat: 인사말 한 줄 추가
 1 file changed, 1 insertion(+)
```

> 두 번째 커밋에는 `create mode` 줄이 없습니다. **새 파일이 아니라 기존 파일 수정**이기 때문입니다.

이력을 확인합니다.

```bash
git log --oneline
```

실행 결과:

```
7c9d1e2 (HEAD -> main) feat: 인사말 한 줄 추가
9f3c1a7 docs: 프로젝트 소개 README 추가
4b8e2d5 feat: 인사 출력 프로그램 추가
```

**최신 커밋이 맨 위**입니다. 세 줄만 읽어도 이 프로젝트가 어떻게 자랐는지 보입니다.

### Step 4. `-am` 으로 한 번에 하기

이미 추적 중인 파일만 고쳤다면 `add` 와 `commit` 을 합칠 수 있습니다.

`README.md` 에 한 줄 추가합니다.

```markdown
# Git 연습 프로젝트

Git 학습 매뉴얼 초급 과정에서 사용하는 연습용 저장소입니다.

## 실행 방법
python hello.py
```

```bash
git commit -am "docs: README에 실행 방법 추가"
```

실행 결과:

```
[main 2e8f4a6] docs: README에 실행 방법 추가
 1 file changed, 3 insertions(+)
```

> ⚠️ **`-a` 는 이미 추적 중인 파일만 담습니다.** 새로 만든 파일(Untracked)은 **절대 포함되지 않습니다.**
> 새 파일이 있으면 `git add` 를 먼저 해야 합니다. 이걸 모르고 "커밋했는데 파일이 없어요" 하는 경우가 정말 많습니다.

### Step 5. 긴 메시지 쓰기 (본문 포함)

`-m` 없이 실행하면 [02강](lesson-02.md)에서 설정한 편집기가 열립니다.

`hello.py` 를 이렇게 고칩니다.

```python
name = input("이름을 입력하세요: ")
print(f"안녕하세요, {name}님!")
print("Git 연습을 시작합니다")
```

```bash
git add hello.py
git commit
```

VS Code가 열리면 이렇게 씁니다. (`#` 으로 시작하는 줄은 무시되니 지우지 않아도 됩니다)

```
refactor: 고정 인사말을 사용자 입력 방식으로 변경

항상 같은 문장만 출력해서 실습 예제로 밋밋했다.
input() 사용법을 함께 익힐 수 있도록 이름을 입력받게 바꿨다.

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
```

**저장하고 창을 닫으면** 커밋이 완료됩니다. (`Ctrl+S` → `Ctrl+W`)

실행 결과:

```
[main 5a7b3c9] refactor: 고정 인사말을 사용자 입력 방식으로 변경
 1 file changed, 3 insertions(+), 2 deletions(-)
```

> 제목과 본문 사이의 **빈 줄은 필수**입니다. 빈 줄이 없으면 Git이 전체를 제목으로 봅니다.
> `git log --oneline` 에는 제목만 나오고, `git log` 에는 본문까지 나옵니다.

### Step 6. 파일 삭제와 이름 변경

**삭제**

연습용으로 `temp.txt` 를 만들고 커밋한 뒤 지워 보겠습니다.

```bash
echo "임시 파일" > temp.txt
git add temp.txt
git commit -m "chore: 임시 파일 추가"
```

이제 지웁니다.

```bash
git rm temp.txt
```

실행 결과:

```
rm 'temp.txt'
```

```bash
git status
```

실행 결과:

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	deleted:    temp.txt
```

> `git rm` 은 **파일을 지우고 그 사실을 스테이지에 담는 것**까지 한 번에 합니다.
> 탐색기에서 그냥 지웠다면 `git add temp.txt` 를 따로 해 줘야 삭제가 기록됩니다. (지운 파일에 `add` 를 하는 게 어색하지만 맞습니다)

```bash
git commit -m "chore: 임시 파일 삭제"
```

실행 결과:

```
[main 8d2f6b1] chore: 임시 파일 삭제
 1 file changed, 1 deletion(-)
 delete mode 100644 temp.txt
```

**이름 변경**

```bash
git mv hello.py greeting.py
git status
```

실행 결과:

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	renamed:    hello.py -> greeting.py
```

```bash
git commit -m "refactor: hello.py 를 greeting.py 로 이름 변경"
```

> `renamed:` 로 깔끔하게 나오는 것을 봐 두세요. 탐색기에서 이름만 바꾸면 Git은 **"파일 하나 삭제 + 새 파일 하나 추가"** 로 인식합니다. 결과는 같지만 이력이 지저분해집니다.
>
> 되돌리자면, Git이 이름 변경을 알아채는 것은 **내용이 비슷하기 때문**입니다. 이름과 내용을 동시에 크게 바꾸면 `git mv` 를 써도 삭제+추가로 보일 수 있습니다.

### 같은 일을 GUI로 하면

VS Code Source Control (`Ctrl+Shift+G`):

| 하고 싶은 일 | 방법 |
|---|---|
| 스테이지에 담기 | 파일 위 `+` |
| 커밋 메시지 | 위쪽 입력칸에 작성 |
| 커밋 | `Ctrl+Enter` 또는 ✓ 버튼 |
| 여러 줄 메시지 | 입력칸에서 그냥 줄바꿈해도 됩니다 |

> ⚠️ VS Code에서 아무것도 스테이지하지 않고 커밋 버튼을 누르면 **"변경 사항 전부를 담고 커밋할까요?"** 를 묻습니다.
> 여기서 습관적으로 `Yes` 를 누르면 `git commit -am` 과 같아져서, 나누려던 커밋이 뭉쳐 버립니다. 주의하세요.

---

## ⑤ 자주 하는 실수

### `nothing added to commit but untracked files present`

```
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	newfile.txt

nothing added to commit but untracked files present (use "git add" to track)
```

**원인** — 새 파일을 `git add` 하지 않고 `git commit -am` 을 실행했습니다. `-a` 는 **추적 중인 파일만** 담습니다.
**해결** — 새 파일은 반드시 `git add` 를 먼저 합니다.

```bash
git add newfile.txt
git commit -m "feat: 새 파일 추가"
```

### `nothing to commit, working tree clean`

```
On branch main
nothing to commit, working tree clean
```

**원인** — 커밋할 변경이 없습니다. **에러가 아닙니다.** 이미 커밋했거나, 파일을 저장하지 않았을 가능성이 큽니다.
**해결** — 에디터에서 `Ctrl+S` 로 저장했는지 확인하세요. VS Code라면 제목 탭의 ● 표시가 남아 있는지 보면 됩니다.

### `*** Please tell me who you are.`

**원인** — [02강 Step 2](lesson-02.md)의 이름·이메일 설정을 건너뛰었습니다.
**해결** — 메시지에 적힌 두 명령을 실행하면 됩니다. 커밋 내용은 스테이지에 그대로 남아 있으니 다시 `git commit` 하면 됩니다.

### `-m` 을 빼먹고 편집기에 갇힘

**원인** — `git commit` 만 치면 메시지를 편집기에서 받습니다.
**해결** — [02강](lesson-02.md)의 `core.editor` 를 설정했다면 VS Code가 열립니다. 저장 후 창을 닫으면 됩니다.
Vim이 열렸다면 `Esc` → `:wq` → `Enter` 로 저장, `Esc` → `:q!` → `Enter` 로 취소합니다.

> **메시지를 비우고 저장하면 커밋이 취소됩니다.** 실수로 열렸을 때 빠져나오는 안전한 방법입니다.
> ```
> Aborting commit due to empty commit message.
> ```

### `git add .` 을 습관적으로 쓰기

```bash
git add .        # 현재 폴더 아래 모든 변경을 담음
```

**원인** — 편하다는 이유로 항상 이것만 씁니다.
**증상** — 이런 것들이 통째로 딸려 들어갑니다.

- `venv/`, `__pycache__/` — 용량만 차지하는 자동 생성 파일
- `.env` — **비밀번호·API 키.** 공개 저장소에 올라가면 사고입니다
- 편집 중이던 관계없는 파일 — 커밋의 의미가 흐려집니다

**해결** — 두 가지를 같이 하세요.

1. **`git add` 전에 `git status` 로 확인**하는 습관
2. **`.gitignore` 로 애초에 걸러내기** → 바로 다음 [05강](lesson-05.md)에서 합니다

### 빈 폴더는 커밋되지 않습니다

```bash
mkdir logs
git status
```

실행 결과:

```
On branch main
nothing to commit, working tree clean
```

**원인** — Git은 **파일**을 추적합니다. 폴더는 파일의 경로 일부일 뿐이라 **빈 폴더는 기록 대상이 아닙니다.**
**해결** — 폴더 구조를 유지해야 한다면 안에 빈 파일을 하나 둡니다. 관례적으로 `.gitkeep` 을 씁니다.

```bash
touch logs/.gitkeep
git add logs/.gitkeep
git commit -m "chore: logs 폴더 구조 추가"
```

> `.gitkeep` 은 Git의 공식 기능이 아니라 **개발자들의 관례**입니다. 이름은 아무거나 상관없습니다.

### 커밋 메시지를 "수정" 으로 통일하기

**원인** — 귀찮아서, 또는 뭐라고 써야 할지 몰라서.
**해결** — 한 문장으로 못 쓰겠다면 **커밋에 너무 많은 것이 들어 있다는 신호**입니다. 나눠 보세요.

> 팁 — 커밋 메시지를 먼저 써 보고, 그 문장에 맞는 것만 `add` 하는 순서로 작업해 보세요. 커밋 단위가 자연스럽게 정리됩니다.

---

## ⑥ 확인 문제

**1.** 아래 상황에서 `git commit -am "작업"` 을 실행하면 **무엇이 커밋될까요?**

```
On branch main
Changes not staged for commit:
	modified:   a.txt

Untracked files:
	b.txt
```

<details>
<summary>답 보기</summary>

**`a.txt` 만** 커밋됩니다. `b.txt` 는 들어가지 않습니다.

`-a` 옵션은 **이미 추적 중인(tracked) 파일의 변경만** 자동으로 담습니다. `b.txt` 는 Untracked라서 대상이 아닙니다.

```
-a 가 담는 것:   modified, deleted (추적 중인 파일)
-a 가 못 담는 것: untracked (새 파일)  ← git add 필수
```

둘 다 커밋하려면:

```bash
git add b.txt
git commit -am "작업"     # a.txt 는 -a 로, b.txt 는 이미 add 됨
```

또는 그냥:

```bash
git add .
git commit -m "작업"
```
</details>

**2.** 오늘 이런 작업을 했습니다. **커밋을 몇 개로 나누는 것이 좋을까요?** 메시지도 함께 적어 보세요.

```
① 로그인 시 비밀번호가 틀려도 통과되던 버그 수정 (login.py)
② 그 버그를 검증하는 테스트 추가 (test_login.py)
③ README의 오타 "설차" → "설치" 수정 (README.md)
④ 회원가입 화면에 이메일 중복 검사 추가 (signup.py)
```

<details>
<summary>답 보기</summary>

**3개**로 나누는 것이 자연스럽습니다.

```bash
git add login.py test_login.py
git commit -m "fix: 비밀번호 검증이 항상 통과하던 문제 수정"

git add README.md
git commit -m "docs: README 오타 수정"

git add signup.py
git commit -m "feat: 회원가입 이메일 중복 검사 추가"
```

**왜 ①과 ②를 묶었나** — 테스트는 그 수정이 맞다는 **근거**입니다. 나중에 이 커밋을 `revert` 하면 수정과 테스트가 함께 사라져야 앞뒤가 맞습니다. 둘을 나누면 "테스트만 있고 코드는 없는" 중간 상태가 이력에 남습니다.

**왜 ③을 따로 뒀나** — 버그 수정과 아무 관계가 없습니다. 섞으면 나중에 "이 커밋이 README를 왜 건드렸지?" 하게 됩니다.

**4개도 답이 될 수 있습니다.** ①과 ②를 나누는 팀도 있습니다. 정답이 하나는 아니고, **기준을 갖고 나눴는가**가 중요합니다.
</details>

**3.** 커밋을 했는데 `git log --oneline` 에 메시지가 이상하게 나옵니다. 왜 그럴까요?

```
3c8a1f4 (HEAD -> main) fix: 로그인 버그 수정 세션이 남아 있어서 로그아웃이 안 되는 문제였다
```

<details>
<summary>답 보기</summary>

**제목과 본문 사이에 빈 줄을 넣지 않았습니다.**

이렇게 썼을 것입니다.

```
fix: 로그인 버그 수정
세션이 남아 있어서 로그아웃이 안 되는 문제였다
```

빈 줄이 없으면 Git은 **전체를 하나의 제목**으로 봅니다. 그래서 `--oneline` 에 다 나옵니다.

**올바른 형식**

```
fix: 로그인 버그 수정
                              ← 이 빈 줄이 필수
세션이 남아 있어서 로그아웃이 안 되는 문제였다.
Session.clear() 를 로그아웃 처리에 추가했다.
```

**터미널에서 여러 줄 메시지 쓰기** — `-m` 을 여러 번 쓰면 각각이 문단이 됩니다.

```bash
git commit -m "fix: 로그인 버그 수정" -m "세션이 남아 있어서 로그아웃이 안 되는 문제였다."
```

**이미 커밋했다면** 고칠 수 있습니다.

```bash
git commit --amend
```

[07강](lesson-07.md)에서 다룹니다.
</details>

---

## 오늘의 정리

| 명령 | 하는 일 |
|---|---|
| `git add <파일>` | 스테이지에 담기 |
| `git add .` | 현재 폴더 아래 전부 담기 (⚠️ 확인 후 사용) |
| `git commit -m "메시지"` | 스테이지의 내용을 기록으로 확정 |
| `git commit` | 편집기를 열어 긴 메시지 작성 |
| `git commit -am "메시지"` | add + commit (⚠️ **새 파일 제외**) |
| `git rm <파일>` | 파일 삭제 + 스테이지에 담기 |
| `git mv <이전> <이후>` | 이름 변경 + 스테이지에 담기 |
| `git log --oneline` | 이력 한 줄씩 보기 |

**커밋 메시지 형식**

```
<타입>: <무엇을 했는지>      ← 50자 이내, 마침표 없음

왜 그렇게 했는지.            ← 빈 줄 뒤에 본문 (선택)
```

`feat` 새 기능 · `fix` 버그 수정 · `docs` 문서 · `refactor` 구조 개선 · `test` 테스트 · `chore` 잡일

**오늘 반드시 기억할 한 가지**
> **커밋 하나 = 되돌릴 수 있는 의미 하나.**
> 메시지를 쓸 때 "그리고"가 들어간다면, 커밋을 나눠야 한다는 신호입니다.

**과제**
1. `git-practice` 에 파일 두 개를 만들고, 성격이 다르므로 **커밋 두 개**로 나눠 기록하세요.
2. 그중 한 커밋은 `git commit` (편집기)으로 **제목 + 빈 줄 + 본문** 형식을 갖춰 작성하세요.
3. `git log` 로 본문까지 잘 들어갔는지, `git log --oneline` 으로 제목만 나오는지 각각 확인하세요.
4. 파일 하나의 이름을 `git mv` 로 바꾸고 커밋해 `renamed:` 로 기록되는 것을 확인하세요.

---

[← 이전 03강](lesson-03.md) · [목차](README.md) · [다음 → 05강 무시할 파일 정하기](lesson-05.md)
