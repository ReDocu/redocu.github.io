# 06강 · 기록 들여다보기

> **Git 학습 매뉴얼** · 🟢 초급 · **06강 / 30**
> [← 이전 05강](lesson-05.md) · [목차](README.md) · [다음 → 07강 되돌리기 기초](lesson-07.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git log` 를 옵션과 함께 써서 원하는 커밋만 골라 볼 수 있다.
- `git diff` 세 가지 형태의 차이를 알고 상황에 맞게 쓸 수 있다.
- diff 출력(`@@`, `+`, `-`)을 읽고 무엇이 바뀌었는지 설명할 수 있다.
- `HEAD`, `HEAD~1` 같은 표기로 특정 커밋을 가리킬 수 있다.

---

## ② 왜 필요한가

지금까지 기록을 **쌓기만** 했습니다. 쌓아 둔 기록은 **꺼내 볼 수 있어야** 의미가 있습니다.

실무에서 매일 마주치는 질문들입니다.

| 질문 | 오늘 배우는 명령 |
|---|---|
| "이 파일 왜 이렇게 됐지?" | `git log -p <파일>` |
| "지난주에 내가 뭘 했더라?" | `git log --since="1 week ago"` |
| "커밋하기 전에 뭘 바꿨는지 확인하고 싶다" | `git diff` |
| "add 한 게 맞는지 보고 커밋하고 싶다" | `git diff --staged` |
| "이 커밋에서 정확히 뭐가 바뀌었나?" | `git show <해시>` |
| "누가 이 줄을 넣었나?" | `git log -S "검색어"` |

그리고 **`git diff` 로 확인한 다음 커밋하는 습관**은 실수를 막는 가장 값싼 방법입니다. 디버깅 코드나 주석을 실수로 올리는 사고의 대부분이 여기서 걸러집니다.

---

## ③ 개념 설명

### 커밋을 가리키는 방법

명령에 커밋을 지정할 때 쓰는 표기법입니다. 앞으로 계속 나옵니다.

| 표기 | 뜻 |
|---|---|
| `9f3c1a7` | 해시 앞 7자리 |
| **`HEAD`** | **지금 내가 있는 위치** (보통 최신 커밋) |
| `HEAD~1` 또는 `HEAD~` | HEAD의 **한 칸 전** |
| `HEAD~3` | HEAD의 **세 칸 전** |
| `main` | `main` 브랜치의 최신 커밋 |

```
4b8e2d5 ──▶ 9f3c1a7 ──▶ 7c9d1e2 ──▶ 5a7b3c9
 HEAD~3      HEAD~2       HEAD~1       HEAD
```

> `HEAD^` 라는 표기도 있는데, 커밋의 부모가 하나뿐일 때는 `HEAD~1` 과 같습니다.
> 둘이 달라지는 것은 **머지 커밋(부모가 둘)** 을 다룰 때뿐이라 [24강](lesson-24.md)에서 구분합니다. 지금은 `~` 만 쓰면 됩니다.

### 세 공간과 `git diff`

[03강](lesson-03.md)의 세 공간 그림이 여기서 다시 쓰입니다. **`git diff` 는 어느 두 공간을 비교하느냐**로 종류가 나뉩니다.

```
  작업 디렉터리        스테이지          저장소(HEAD)
       │                  │                  │
       │◀── git diff ────▶│                  │   ① 아직 add 안 한 변경
       │                  │◀ --staged ─────▶│   ② add 했지만 커밋 안 한 변경
       │◀──────── git diff HEAD ───────────▶│   ③ 커밋 이후 모든 변경
```

| 명령 | 비교 대상 | 언제 쓰나 |
|---|---|---|
| `git diff` | 작업 디렉터리 ↔ 스테이지 | **"내가 방금 뭘 고쳤지?"** |
| `git diff --staged` | 스테이지 ↔ HEAD | **"커밋하면 뭐가 들어가지?"** |
| `git diff HEAD` | 작업 디렉터리 ↔ HEAD | "마지막 커밋 이후 전부" |
| `git diff A B` | 커밋 A ↔ 커밋 B | 두 시점 비교 |

> `--staged` 와 `--cached` 는 **완전히 같은 옵션**입니다. 문서마다 다르게 쓰여 있어 헷갈리는데, 뜻이 분명한 `--staged` 를 권합니다.

### diff 출력 읽는 법

```diff
diff --git a/greeting.py b/greeting.py     ← ① 어떤 파일인지
index 3b18e51..8d0e412 100644              ← ② 내부 해시 (신경 안 써도 됨)
--- a/greeting.py                          ← ③ 이전 버전 (a = before)
+++ b/greeting.py                          ← ④ 이후 버전 (b = after)
@@ -1,3 +1,4 @@                            ← ⑤ 위치 정보
 name = input("이름을 입력하세요: ")          ← 앞이 공백 = 안 바뀐 줄 (문맥)
 print(f"안녕하세요, {name}님!")
-print("Git 연습을 시작합니다")               ← - 빨강 = 삭제된 줄
+print("Git 연습을 시작합니다!")              ← + 초록 = 추가된 줄
+print("오늘도 화이팅")
```

**⑤ `@@ -1,3 +1,4 @@` 읽는 법**

```
@@ -1,3 +1,4 @@
    │ │  │ │
    │ │  │ └── 4줄이 됨
    │ │  └──── 이후 파일의 1번째 줄부터
    │ └─────── 3줄이었음
    └───────── 이전 파일의 1번째 줄부터
```

> **한 줄을 고치면 `-` 와 `+` 가 한 쌍으로 나옵니다.** Git은 "수정"을 따로 표현하지 않고 **삭제 + 추가**로 봅니다.
> [01강](lesson-01.md)에서 본 스냅샷 개념과 이어집니다.

### 페이저(pager)

`git log` 결과가 길면 Git이 자동으로 **화면 단위 뷰어**에 넣어 보여 줍니다. 아래에 `:` 만 뜨고 멈춘 것처럼 보이는 상태입니다.

| 키 | 동작 |
|---|---|
| `↓` / `↑` 또는 `j` / `k` | 한 줄 이동 |
| `Space` | 다음 화면 |
| `/검색어` | 검색 |
| **`q`** | **빠져나오기** |

> 터미널이 먹통이 된 게 아닙니다. **`q`** 를 기억하세요.

---

## ④ 단계별 실습

### Step 0. 지금까지의 이력 확인

```bash
cd ~/Desktop/git-practice
git log --oneline
```

실행 결과 (여러분의 해시·개수는 다를 수 있습니다):

```
1d7a5f8 (HEAD -> main) chore: config.json 을 추적 대상에서 제외
6b4e9c3 chore: gitignore 추가
5a7b3c9 refactor: 고정 인사말을 사용자 입력 방식으로 변경
8d2f6b1 chore: 임시 파일 삭제
2e8f4a6 docs: README에 실행 방법 추가
7c9d1e2 feat: 인사말 한 줄 추가
9f3c1a7 docs: 프로젝트 소개 README 추가
4b8e2d5 feat: 인사 출력 프로그램 추가
```

### Step 1. `git log` 옵션 익히기

**개수 제한**

```bash
git log --oneline -3
```

실행 결과:

```
1d7a5f8 (HEAD -> main) chore: config.json 을 추적 대상에서 제외
6b4e9c3 chore: gitignore 추가
5a7b3c9 refactor: 고정 인사말을 사용자 입력 방식으로 변경
```

**변경 규모 함께 보기**

```bash
git log --stat -2
```

실행 결과:

```
commit 1d7a5f8b3c5e7a9f1d3b5c7e9a1f3d5b7c9e1a30 (HEAD -> main)
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 15:22:41 2026 +0900

    chore: config.json 을 추적 대상에서 제외

 config.json | 1 -
 1 file changed, 1 deletion(-)

commit 6b4e9c3a1f5d7b9e3c5a7f1d9b3e5c7a1f9d3b52
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 15:10:22 2026 +0900

    chore: gitignore 추가

 .gitignore     | 17 +++++++++++++++++
 important.log  |  1 +
 2 files changed, 18 insertions(+)
```

> `+++++` 와 `-----` 의 길이로 변경 규모가 한눈에 보입니다.

**그래프로 보기**

```bash
git log --oneline --graph --all --decorate
```

실행 결과:

```
* 1d7a5f8 (HEAD -> main) chore: config.json 을 추적 대상에서 제외
* 6b4e9c3 chore: gitignore 추가
* 5a7b3c9 refactor: 고정 인사말을 사용자 입력 방식으로 변경
* 8d2f6b1 chore: 임시 파일 삭제
* 2e8f4a6 docs: README에 실행 방법 추가
* 7c9d1e2 feat: 인사말 한 줄 추가
* 9f3c1a7 docs: 프로젝트 소개 README 추가
* 4b8e2d5 feat: 인사 출력 프로그램 추가
```

아직 브랜치가 하나뿐이라 일직선입니다. [08강](lesson-08.md)에서 브랜치를 만들면 이 명령의 진가가 드러납니다.

| 옵션 | 뜻 |
|---|---|
| `--graph` | 브랜치 갈라짐을 선으로 표시 |
| `--all` | 모든 브랜치를 함께 |
| `--decorate` | 브랜치·태그 이름 표시 (요즘 Git은 기본 적용) |

**조건으로 걸러 보기**

```bash
git log --oneline --author="Hong"          # 작성자로
git log --oneline --grep="gitignore"       # 메시지 내용으로
git log --oneline --since="1 week ago"     # 기간으로
git log --oneline --since="2026-08-01" --until="2026-08-10"
```

`--grep` 실행 결과:

```
6b4e9c3 chore: gitignore 추가
```

**특정 파일의 이력만**

```bash
git log --oneline -- README.md
```

실행 결과:

```
2e8f4a6 docs: README에 실행 방법 추가
9f3c1a7 docs: 프로젝트 소개 README 추가
```

> 파일 앞의 `--` 는 **"여기서부터는 파일 경로"** 라는 구분자입니다.
> 브랜치와 파일 이름이 같을 때 Git이 헷갈리지 않게 해 줍니다. 습관적으로 붙이면 안전합니다.

**변경 내용까지 함께**

```bash
git log -p -1 -- greeting.py
```

실행 결과:

```
commit 5a7b3c9e1d3f5b7a9c1e3d5f7b9a1c3e5d7f9b12
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 14:58:03 2026 +0900

    refactor: 고정 인사말을 사용자 입력 방식으로 변경

    항상 같은 문장만 출력해서 실습 예제로 밋밋했다.
    input() 사용법을 함께 익힐 수 있도록 이름을 입력받게 바꿨다.

diff --git a/hello.py b/hello.py
index 8d0e412..c4a7f39 100644
--- a/hello.py
+++ b/hello.py
@@ -1,3 +1,3 @@
-print("안녕하세요, Git!")
-print("두 번째 줄입니다")
-print("반갑습니다")
+name = input("이름을 입력하세요: ")
+print(f"안녕하세요, {name}님!")
+print("Git 연습을 시작합니다")
```

**출력 형식 직접 정하기**

```bash
git log --pretty=format:"%h %ad | %s [%an]" --date=short -5
```

실행 결과:

```
1d7a5f8 2026-08-10 | chore: config.json 을 추적 대상에서 제외 [Hong Gildong]
6b4e9c3 2026-08-10 | chore: gitignore 추가 [Hong Gildong]
5a7b3c9 2026-08-10 | refactor: 고정 인사말을 사용자 입력 방식으로 변경 [Hong Gildong]
8d2f6b1 2026-08-10 | chore: 임시 파일 삭제 [Hong Gildong]
2e8f4a6 2026-08-10 | docs: README에 실행 방법 추가 [Hong Gildong]
```

| 자리표시자 | 뜻 |
|---|---|
| `%h` | 짧은 해시 |
| `%s` | 커밋 제목 |
| `%an` | 작성자 이름 |
| `%ad` | 작성 날짜 |
| `%ar` | 상대 시간 (`3 hours ago`) |

### Step 2. `git show` 로 커밋 하나 뜯어보기

```bash
git show 6b4e9c3
```

실행 결과 (일부):

```
commit 6b4e9c3a1f5d7b9e3c5a7f1d9b3e5c7a1f9d3b52
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 15:10:22 2026 +0900

    chore: gitignore 추가

diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..a3f8b21
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,17 @@
+# 비밀 정보 — 절대 커밋 금지
+.env
+*.pem
+
+# 파이썬
+__pycache__/
...
```

> **`--- /dev/null`** 은 "이전 버전이 없다" = **새로 만들어진 파일**이라는 뜻입니다.
> 반대로 삭제된 파일은 `+++ /dev/null` 로 나옵니다.

상대 표기로도 됩니다.

```bash
git show HEAD          # 최신 커밋
git show HEAD~2        # 두 칸 전 커밋
```

**특정 시점의 파일 내용 통째로 보기** — 아주 유용합니다.

```bash
git show HEAD~3:README.md
```

실행 결과:

```
# Git 연습 프로젝트

Git 학습 매뉴얼 초급 과정에서 사용하는 연습용 저장소입니다.
```

> 형식은 `커밋:파일경로` 입니다. **파일을 되돌리지 않고 내용만 확인**할 수 있어 안전합니다.

### Step 3. `git diff` 세 가지 직접 비교하기

이번 강의 핵심입니다. **일부러 세 공간을 서로 다르게 만들어** 놓고 비교합니다.

`greeting.py` 를 고칩니다. (04강에서 `hello.py` → `greeting.py` 로 이름을 바꿨습니다)

```python
name = input("이름을 입력하세요: ")
print(f"안녕하세요, {name}님!")
print("Git 연습을 시작합니다!")
print("오늘도 화이팅")
```

**① 아직 `add` 하지 않은 변경 보기**

```bash
git diff
```

실행 결과:

```diff
diff --git a/greeting.py b/greeting.py
index c4a7f39..e91b5d8 100644
--- a/greeting.py
+++ b/greeting.py
@@ -1,3 +1,4 @@
 name = input("이름을 입력하세요: ")
 print(f"안녕하세요, {name}님!")
-print("Git 연습을 시작합니다")
+print("Git 연습을 시작합니다!")
+print("오늘도 화이팅")
```

**② `add` 한 뒤 다시 `git diff`**

```bash
git add greeting.py
git diff
```

실행 결과:

```
(아무것도 출력되지 않음)
```

> ⚠️ **여기서 많은 사람이 당황합니다.** "변경이 사라졌나?" 아닙니다.
> `git diff` 는 **작업 디렉터리 ↔ 스테이지**를 비교합니다. `add` 했으니 둘이 같아져서 차이가 없는 것뿐입니다.

**③ 스테이지의 내용 보기**

```bash
git diff --staged
```

실행 결과:

```diff
diff --git a/greeting.py b/greeting.py
index c4a7f39..e91b5d8 100644
--- a/greeting.py
+++ b/greeting.py
@@ -1,3 +1,4 @@
 name = input("이름을 입력하세요: ")
 print(f"안녕하세요, {name}님!")
-print("Git 연습을 시작합니다")
+print("Git 연습을 시작합니다!")
+print("오늘도 화이팅")
```

**이것이 커밋하면 들어갈 내용입니다.** 커밋 직전에 이 명령으로 확인하는 습관을 들이세요.

**④ 세 공간이 전부 다른 상태 만들기**

`greeting.py` 를 한 번 더 고칩니다. (`add` 는 하지 않습니다)

```python
name = input("이름을 입력하세요: ")
print(f"안녕하세요, {name}님!")
print("Git 연습을 시작합니다!")
print("오늘도 화이팅")
print("=" * 20)
```

이제 세 명령을 차례로 실행해 보세요.

```bash
git diff              # 작업 ↔ 스테이지  → "=" * 20 줄만 나옴
git diff --staged     # 스테이지 ↔ HEAD  → 앞의 두 줄 변경만 나옴
git diff HEAD         # 작업 ↔ HEAD      → 전부 나옴
```

`git diff HEAD` 실행 결과:

```diff
diff --git a/greeting.py b/greeting.py
index c4a7f39..7d2f8a1 100644
--- a/greeting.py
+++ b/greeting.py
@@ -1,3 +1,5 @@
 name = input("이름을 입력하세요: ")
 print(f"안녕하세요, {name}님!")
-print("Git 연습을 시작합니다")
+print("Git 연습을 시작합니다!")
+print("오늘도 화이팅")
+print("=" * 20)
```

**세 명령의 결과가 다르다는 것**을 눈으로 확인했다면 세 공간을 완전히 이해한 것입니다.

정리하고 커밋합니다.

```bash
git add greeting.py
git diff --staged        # 커밋 전 최종 확인
git commit -m "feat: 인사 문구와 구분선 추가"
```

### Step 4. 커밋끼리 비교하기

```bash
git diff HEAD~2 HEAD
```

두 커밋 사이의 모든 변경이 나옵니다. 파일 하나만 보려면:

```bash
git diff HEAD~2 HEAD -- greeting.py
```

**어떤 파일이 바뀌었는지만** 빠르게 보려면:

```bash
git diff --stat HEAD~3 HEAD
```

실행 결과:

```
 .gitignore    | 17 +++++++++++++++++
 config.json   |  1 -
 greeting.py   |  4 +++-
 important.log |  1 +
 4 files changed, 21 insertions(+), 2 deletions(-)
```

### Step 5. 내용으로 커밋 찾기 (곡괭이)

**"이 코드가 언제 들어왔지?"** 를 찾는 강력한 방법입니다.

```bash
git log -S "input" --oneline
```

실행 결과:

```
5a7b3c9 refactor: 고정 인사말을 사용자 입력 방식으로 변경
```

`input` 이라는 문자열이 **추가되거나 삭제된 커밋**만 찾아 줍니다.

> 이 기능을 **pickaxe(곡괭이)** 라고 부릅니다. 코드를 캐낸다는 뜻입니다.
> "누가 이 줄을 썼나"를 보는 `git blame` 과 함께 [25강](lesson-25.md)에서 본격적으로 다룹니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code |
|---|---|
| diff 보기 | Source Control에서 **파일 클릭** → 좌우 비교 화면 |
| 커밋 이력 | Source Control 패널의 **Graph** 영역 |
| 파일 한 줄의 작성자 | 줄 끝에 흐리게 표시 (GitLens 확장 설치 시) |
| 이력 그래프 | 확장 **Git Graph** 설치 권장 |

> `git log --graph` 를 매번 치는 것보다 GUI가 훨씬 편한 대표적인 영역입니다.
> 다만 `git diff --staged` 로 **커밋 직전 확인**하는 습관만큼은 명령어로 몸에 익혀 두세요.

---

## ⑤ 자주 하는 실수

### `git log` 를 쳤더니 화면이 멈췄습니다

```
...
(END)
```

또는 `:` 만 표시됩니다.

**원인** — 페이저에 들어간 것입니다. 멈춘 게 아닙니다.
**해결** — **`q`** 를 누르세요.

페이저를 아예 끄고 싶다면:

```bash
git --no-pager log --oneline      # 이번만
git config --global core.pager cat # 항상 (권장하지 않음)
```

### `git diff` 를 쳤는데 아무것도 안 나옵니다

**원인** — 대부분 **이미 `add` 했기 때문**입니다. `git diff` 는 작업 디렉터리 ↔ 스테이지 비교입니다.
**해결** — 상황에 맞는 명령을 쓰세요.

```bash
git diff              # add 안 한 변경
git diff --staged     # add 한 변경     ← 대부분 찾던 건 이것
git diff HEAD         # 둘 다
```

파일을 저장하지 않은 것도 흔한 원인입니다. `Ctrl+S` 를 확인하세요.

### `git show 커밋 파일` 이 안 됩니다

```bash
git show HEAD~3 README.md     # ❌
```

**원인** — 커밋과 파일 사이는 **콜론(`:`)** 으로 붙입니다. 공백이 아닙니다.
**해결** —

```bash
git show HEAD~3:README.md     # ✅ 그 시점의 파일 내용
git show HEAD~3 -- README.md  # ✅ 그 커밋에서 이 파일의 변경분(diff)
```

두 명령의 **결과가 다릅니다.** 앞은 파일 전체 내용, 뒤는 diff입니다.

### `HEAD~1` 과 `HEAD^` 를 헷갈림

**원인** — 둘 다 "한 칸 전"으로 보여서 같은 줄 압니다.
**해결** — **부모가 하나뿐이면 같습니다.** 지금 단계에서는 구분할 필요가 없습니다.
머지 커밋(부모가 둘)에서만 달라지며, 그때는 `HEAD^1`(첫 부모) / `HEAD^2`(둘째 부모)로 구분합니다. [24강](lesson-24.md)에서 다룹니다.

> PowerShell에서 `HEAD^` 를 쓰면 `^` 가 줄 이어쓰기 문자로 해석되어 이상하게 동작할 수 있습니다.
> **PowerShell에서는 `HEAD~1` 을 쓰거나 `"HEAD^"` 처럼 따옴표로 감싸세요.**

### 브랜치 이름과 파일 이름이 같아서 에러

```
fatal: ambiguous argument 'test': both revision and filename
```

**원인** — `test` 라는 이름의 브랜치와 파일이 둘 다 있어 Git이 무엇을 가리키는지 모릅니다.
**해결** — `--` 로 구분해 줍니다.

```bash
git log -- test        # test 는 파일
git log test           # test 는 브랜치
```

> 그래서 파일을 지정할 때는 항상 `--` 를 붙이는 습관이 좋습니다.

### 한글이 `<ED><95><9C>` 처럼 깨져 보임

**원인** — 페이저의 인코딩 설정 문제입니다.
**해결** —

```bash
git config --global core.pager "less -R"
```

또는 [02강](lesson-02.md)에서 설정한 `core.quotepath false` 를 확인하세요.

---

## ⑥ 확인 문제

**1.** 아래 상태에서 `git diff` · `git diff --staged` · `git diff HEAD` 는 각각 무엇을 보여 줄까요?

```
HEAD 커밋의 a.txt:   "사과"
스테이지의 a.txt:     "사과\n바나나"        (add 완료)
작업 디렉터리 a.txt:  "사과\n바나나\n포도"   (add 안 함)
```

<details>
<summary>답 보기</summary>

| 명령 | 비교 | 결과 |
|---|---|---|
| `git diff` | 작업 ↔ 스테이지 | `+포도` |
| `git diff --staged` | 스테이지 ↔ HEAD | `+바나나` |
| `git diff HEAD` | 작업 ↔ HEAD | `+바나나` `+포도` |

**지금 커밋하면?** → 스테이지의 내용, 즉 **"사과 / 바나나"** 만 기록됩니다. "포도"는 안 들어갑니다.

**외우는 법**

```
git diff           = "아직 안 담은 것"
git diff --staged  = "담았지만 아직 안 낸 것"   ← 커밋 직전에 볼 것
git diff HEAD      = "마지막 커밋 이후 전부"
```
</details>

**2.** 3개월 전에 누군가 `timeout` 값을 30에서 5로 바꿨습니다. **어느 커밋에서, 왜 바꿨는지** 찾으려면 어떤 명령을 쓸까요?

<details>
<summary>답 보기</summary>

**① 내용으로 커밋 찾기 (곡괭이)**

```bash
git log -S "timeout" --oneline -- config.py
```

`timeout` 이라는 문자열이 추가·삭제된 커밋만 나옵니다.

**② 찾은 커밋을 자세히 보기**

```bash
git show <해시>
```

**왜 바꿨는지**는 커밋 메시지 본문에 있습니다. [04강](lesson-04.md)에서 "본문에는 왜를 쓰라"고 한 이유가 바로 이것입니다.

**③ 다른 방법들**

```bash
git log -p -- config.py           # 이 파일의 모든 변경을 diff와 함께
git blame config.py               # 각 줄을 마지막으로 고친 커밋 (25강)
git log -L 10,20:config.py        # 특정 줄 범위의 변경 이력만 (25강)
```

**실무 순서** — `git blame` 으로 줄의 커밋을 찾고 → `git show` 로 이유를 읽는 흐름이 가장 빠릅니다.
</details>

**3.** 아래 diff를 읽고, ① 어떤 파일이 ② 어떻게 바뀌었는지 설명하세요.

```diff
diff --git a/app.py b/app.py
index 7a3f2c1..b8e4d90 100644
--- a/app.py
+++ b/app.py
@@ -10,7 +10,8 @@ def login(user_id, password):
     user = find_user(user_id)
     if user is None:
         return False
-    return user.password == password
+    if user.password != password:
+        return False
+    return not user.is_locked
```

<details>
<summary>답 보기</summary>

**① 파일** — `app.py`

**② 위치** — `@@ -10,7 +10,8 @@` → 10번째 줄부터, 7줄이 **8줄**이 되었습니다. (한 줄 늘어남)
뒤에 붙은 `def login(user_id, password):` 는 이 변경이 **어느 함수 안에서** 일어났는지 Git이 알려 주는 힌트입니다.

**③ 변경 내용**

| | 내용 |
|---|---|
| 삭제(`-`) | `return user.password == password` |
| 추가(`+`) | 비밀번호가 틀리면 `False` 반환 |
| 추가(`+`) | 비밀번호가 맞으면 **계정 잠김 여부(`is_locked`)까지 확인** |

**한 문장 요약** — 비밀번호만 검사하던 로그인에 **계정 잠김 검사를 추가**했습니다.

**읽는 요령**
- 앞이 공백인 줄은 **안 바뀐 문맥**입니다. 위치를 파악하는 용도입니다.
- `-` 와 `+` 가 붙어 있으면 대개 **한 줄을 고친 것**입니다.
- `@@` 뒤의 함수명은 큰 파일에서 위치를 잡을 때 큰 도움이 됩니다.
</details>

---

## 오늘의 정리

| 명령 | 하는 일 |
|---|---|
| `git log --oneline` | 이력 한 줄씩 |
| `git log --oneline --graph --all` | 브랜치 포함 그래프 |
| `git log --stat` | 변경 파일·규모 함께 |
| `git log -p` | 변경 내용(diff)까지 |
| `git log -3` | 최근 3개만 |
| `git log --author=` / `--grep=` / `--since=` | 작성자 · 메시지 · 기간으로 검색 |
| `git log -- <파일>` | 그 파일의 이력만 |
| `git log -S "문자열"` | 그 문자열이 추가·삭제된 커밋 찾기 |
| `git show <커밋>` | 커밋 하나의 전체 내용 |
| `git show <커밋>:<파일>` | **그 시점의 파일 내용 통째로** |
| **`git diff`** | 작업 ↔ 스테이지 (아직 안 담은 것) |
| **`git diff --staged`** | 스테이지 ↔ HEAD (**커밋될 것**) |
| `git diff HEAD` | 작업 ↔ HEAD (전부) |
| `git diff A B` | 커밋끼리 |

**커밋 가리키기**

```
HEAD    HEAD~1    HEAD~2    HEAD~3
 지금    한 칸 전   두 칸 전   세 칸 전
```

**페이저에 갇혔을 때 → `q`**

**오늘 반드시 기억할 한 가지**
> **커밋 직전에 `git diff --staged`.**
> 딱 3초면 디버깅 코드나 엉뚱한 파일이 들어가는 사고를 막을 수 있습니다.

**과제**
1. `git log --oneline --graph --all` 을 실행해 지금까지의 이력을 확인하세요.
2. 파일을 고친 뒤 `git diff` → `git add` → `git diff` → `git diff --staged` 순으로 실행하며 **출력이 어떻게 달라지는지** 관찰하세요.
3. `git show HEAD~2:README.md` 로 과거 시점의 파일 내용을 꺼내 보세요.
4. `git log --pretty=format:"%h %ar | %s"` 로 나만의 출력 형식을 만들어 보세요.

---

[← 이전 05강](lesson-05.md) · [목차](README.md) · [다음 → 07강 되돌리기 기초](lesson-07.md)
