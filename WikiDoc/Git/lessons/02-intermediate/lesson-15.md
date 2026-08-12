# 15강 · 좋은 커밋 만들기

> **Git 학습 매뉴얼** · 🟡 중급 · **15강 / 30**
> [← 이전 14강](lesson-14.md) · [목차](README.md) · [다음 → 16강 임시 저장과 골라 옮기기](lesson-16.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- Conventional Commits 규격에 맞는 커밋 메시지를 쓸 수 있다.
- **`git add -p`** 로 파일 안에서 **일부 줄만 골라** 커밋할 수 있다.
- 뒤섞인 작업을 의미 단위 커밋 여러 개로 나눌 수 있다.
- 커밋 메시지 템플릿을 만들어 형식을 자동으로 갖출 수 있다.

---

## ② 왜 필요한가

[04강](lesson-04.md)에서 **"커밋 하나 = 의미 하나"** 를 배웠습니다. 그런데 실제로 작업해 보면 이렇게 됩니다.

```
todo.py 를 고치다 보니...
  ├─ 삭제 기능을 추가했고
  ├─ 그 김에 위쪽 오타도 고쳤고
  ├─ 들여쓰기가 이상해서 정리했고
  └─ 디버깅용 print 를 넣었다 (지워야 함)
```

**파일 하나 안에 네 가지 일이 섞여 있습니다.** `git add todo.py` 를 하면 넷이 한 커밋에 들어갑니다.

지금까지 배운 것으로는 방법이 없습니다. 스테이지는 **파일 단위**로만 다뤄 왔으니까요.

오늘 배우는 **`git add -p`** 가 이 문제를 해결합니다. 파일 안에서 **덩어리(hunk) 단위, 필요하면 줄 단위**로 골라 담을 수 있습니다.

그리고 커밋 메시지에도 **규격**이 있습니다. 규격을 지키면 사람이 읽기 좋을 뿐 아니라 **변경 로그 자동 생성**([19강](lesson-19.md)), **버전 번호 자동 결정**, **CI 자동화**([27강](lesson-27.md))까지 딸려 옵니다.

---

## ③ 개념 설명

### Conventional Commits

가장 널리 쓰이는 커밋 메시지 규격입니다.

```
<타입>(<범위>): <제목>
                                    ← 빈 줄 필수
<본문>
                                    ← 빈 줄 필수
<꼬리말>
```

**실제 예**

```
feat(todo): 할 일 삭제 기능 추가

번호를 입력하면 해당 항목을 목록에서 제거한다.
잘못된 번호를 입력하면 안내 메시지를 출력하고 아무것도 지우지 않는다.

Closes #12
```

**타입 8종**

| 타입 | 언제 | 버전 영향 |
|---|---|---|
| `feat` | 새 기능 | minor ↑ |
| `fix` | 버그 수정 | patch ↑ |
| `docs` | 문서만 | — |
| `style` | 동작과 무관한 형식 (공백, 세미콜론) | — |
| `refactor` | 동작 그대로, 구조 개선 | — |
| `perf` | 성능 개선 | patch ↑ |
| `test` | 테스트 추가·수정 | — |
| `chore` | 빌드·설정·의존성 등 잡일 | — |

> 오른쪽 열은 [19강](lesson-19.md)의 **시맨틱 버저닝**과 연결됩니다. 커밋 타입만 잘 붙여도 다음 버전 번호를 자동으로 정할 수 있습니다.

**범위(scope)** 는 선택입니다. 어느 부분을 건드렸는지 표시합니다.

```
feat(auth): 소셜 로그인 추가
fix(api): 응답 타임아웃 처리
docs(readme): 설치 방법 보완
```

**호환성이 깨지는 변경**은 `!` 를 붙이거나 꼬리말에 명시합니다.

```
feat(api)!: 응답 형식을 JSON 배열에서 객체로 변경

BREAKING CHANGE: 기존 클라이언트는 res.items 로 접근하도록 수정해야 한다.
```

### 제목 쓰는 법

| 규칙 | 예 |
|---|---|
| **50자 이내** | 길면 `git log --oneline` 에서 잘립니다 |
| **마침표 없음** | `추가` (O) / `추가.` (X) |
| **명령형·현재형** | "이 커밋을 적용하면 ~한다" 로 읽히게 |
| **무엇을 했는지** | "왜"는 본문에 |

```
❌ 수정했음
❌ 로그인 버그를 고쳤습니다.
❌ feat: 여러 가지 기능 추가 및 리팩터링과 문서 수정

✅ fix: 로그인 실패 시 세션이 남는 문제 수정
✅ feat: 비밀번호 재설정 메일 발송 추가
```

> **판별법** — 제목에 **"그리고", "및", "와/과"** 가 들어간다면 커밋을 나눠야 한다는 신호입니다.

### 본문에는 "왜"를 씁니다

**무엇을 바꿨는지는 코드를 보면 압니다. 왜 그랬는지는 코드에 안 남습니다.**

```
❌ 본문:
   todo.py 의 add 함수에서 strip() 을 호출하도록 변경했다.
   (→ diff 를 보면 알 수 있는 내용)

✅ 본문:
   사용자가 공백만 입력해도 빈 할 일이 등록되는 문제가 있었다.
   프론트에서 막을 수도 있지만, CLI 로도 호출되므로 여기서 검증한다.
   (→ 6개월 뒤의 나에게 필요한 정보)
```

**본문에 쓰면 좋은 것**

- 이 변경이 필요했던 **배경·문제 상황**
- **다른 방법을 검토했다면** 왜 이 방법을 골랐는지
- 알아 두어야 할 **부작용이나 제약**
- 참고 링크, 이슈 번호

### 원자적 커밋 — 나누는 기준

> **"이 커밋만 되돌려도 프로젝트가 말이 되는가?"**

| 함께 묶어야 하는 것 | 나눠야 하는 것 |
|---|---|
| 기능 + 그 기능의 테스트 | 기능 + 무관한 오타 수정 |
| 함수 이름 변경 + 호출부 전체 수정 | 기능 A + 기능 B |
| 버그 수정 + 재발 방지 테스트 | 로직 변경 + 코드 포맷 정리 |

> **포맷 변경을 따로 커밋하는 것**은 특히 중요합니다.
> 로직 수정 3줄과 들여쓰기 정리 500줄이 한 커밋에 있으면, 리뷰어는 3줄을 찾을 수 없습니다.

### `git add -p` — 파일 안에서 골라 담기

```bash
git add -p <파일>
```

Git이 변경을 **덩어리(hunk)** 로 쪼개서 하나씩 물어봅니다.

```
(1/3) Stage this hunk [y,n,q,a,d,j,J,g,/,e,?]?
```

**자주 쓰는 키 6개만 외우면 됩니다.**

| 키 | 뜻 |
|---|---|
| **`y`** | **담는다** (yes) |
| **`n`** | **안 담는다** (no) |
| **`s`** | **더 잘게 쪼갠다** (split) |
| **`e`** | 직접 편집해서 원하는 줄만 (edit) |
| `q` | 끝내기 (quit) |
| `?` | 도움말 |

| 그 밖의 키 | 뜻 |
|---|---|
| `a` | 이 덩어리와 **이후 전부** 담기 |
| `d` | 이 덩어리와 **이후 전부** 안 담기 |
| `j` / `k` | 판단 미루고 다음 / 이전으로 |
| `g` | 특정 덩어리로 이동 |
| `/` | 정규식으로 덩어리 검색 |

> `s` 는 **쪼갤 수 있을 때만** 선택지에 나타납니다. 변경된 줄 사이에 바뀌지 않은 줄이 있어야 쪼개집니다.
> 더 이상 안 쪼개지면 `e` 로 직접 편집합니다.

### `git commit -v` — 커밋하면서 diff 보기

```bash
git commit -v
```

편집기에 **커밋될 내용의 diff가 함께 표시**됩니다. (그 부분은 커밋 메시지에 포함되지 않습니다)

메시지를 쓰면서 변경 내용을 보게 되므로

- 디버깅 코드가 섞였는지 바로 보이고
- 메시지를 정확하게 쓸 수 있습니다

```bash
git config --global commit.verbose true    # 항상 -v 로 동작
```

> **중급에서 가장 가성비 좋은 설정 중 하나입니다.** 지금 설정해 두세요.

---

## ④ 단계별 실습

### Step 1. 뒤섞인 변경 만들기

일부러 **네 가지 일이 섞인** 상황을 만듭니다.

```bash
cd ~/Desktop/todo-app
git switch main
git pull
git switch -c feature/mixed-work
```

`todo.py` 전체를 아래로 바꿉니다. (변경점은 주석으로 표시해 뒀습니다)

```python
import json
import os

FILE = "todos.json"


def load():
    if not os.path.exists(FILE):
        return []
    with open(FILE, encoding="utf-8") as f:
        return json.load(f)


def save(todos):
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(todos, f, ensure_ascii=False, indent=2)


def add(text, priority="보통"):
    if not text or not text.strip():
        print("할 일 내용을 입력해 주세요.")
        return
    todos = load()
    todos.append({"text": text.strip(), "done": False, "priority": priority})
    save(todos)
    print(f"[추가] 할 일이 등록되었습니다: {text}")
    print("DEBUG:", todos)                      # ← ③ 디버깅용 (지울 것)


def show():
    todos = load()
    if not todos:
        print("할 일이 없습니다.")
        return
    for i, t in enumerate(todos, 1):
        mark = "✅ 완료" if t["done"] else "⬜ 진행"
        print(f"{mark} {i}. {t['text']}")


def clear_done():                               # ← ① 새 기능
    todos = load()
    remaining = [t for t in todos if not t["done"]]
    removed = len(todos) - len(remaining)
    save(remaining)
    print(f"완료된 항목 {removed}개를 정리했습니다.")


def count():                                    # ← ② 또 다른 새 기능
    todos = load()
    done = sum(1 for t in todos if t["done"])
    print(f"전체 {len(todos)}개 · 완료 {done}개 · 남음 {len(todos) - done}개")
```

`README.md` 의 오타도 고칩니다. (④)

```bash
git status
```

실행 결과:

```
On branch feature/mixed-work
Changes not staged for commit:
	modified:   README.md
	modified:   todo.py
```

**한 파일 안에 세 가지, 전체로는 네 가지 일**이 섞여 있습니다.

### Step 2. `git add -p` 로 골라 담기

```bash
git add -p todo.py
```

첫 번째 덩어리가 나옵니다.

```diff
diff --git a/todo.py b/todo.py
index 8f3a2c1..d7b4e90 100644
--- a/todo.py
+++ b/todo.py
@@ -22,6 +22,7 @@ def add(text, priority="보통"):
     save(todos)
     print(f"[추가] 할 일이 등록되었습니다: {text}")
+    print("DEBUG:", todos)


 def show():
(1/2) Stage this hunk [y,n,q,a,d,j,J,g,/,e,?]?
```

**디버깅 코드입니다. 담으면 안 됩니다.**

```
n
```

다음 덩어리가 나옵니다.

```diff
@@ -32,3 +33,18 @@ def show():
         print(f"{mark} {i}. {t['text']}")
+
+
+def clear_done():
+    todos = load()
+    remaining = [t for t in todos if not t["done"]]
+    removed = len(todos) - len(remaining)
+    save(remaining)
+    print(f"완료된 항목 {removed}개를 정리했습니다.")
+
+
+def count():
+    todos = load()
+    done = sum(1 for t in todos if t["done"])
+    print(f"전체 {len(todos)}개 · 완료 {done}개 · 남음 {len(todos) - done}개")
(2/2) Stage this hunk [y,n,q,a,d,K,g,/,e,?]?
```

**두 기능이 한 덩어리로 묶여 있습니다.** 쪼갭니다.

```
s
```

실행 결과:

```
Split into 2 hunks.
@@ -33,2 +34,10 @@
         print(f"{mark} {i}. {t['text']}")
+
+
+def clear_done():
+    todos = load()
+    remaining = [t for t in todos if not t["done"]]
+    removed = len(todos) - len(remaining)
+    save(remaining)
+    print(f"완료된 항목 {removed}개를 정리했습니다.")
(2/3) Stage this hunk [y,n,q,a,d,K,j,J,g,/,e,?]?
```

**`clear_done` 만 분리됐습니다. 이건 담습니다.**

```
y
```

```
(3/3) Stage this hunk [y,n,q,a,d,K,g,/,e,?]?
```

`count` 함수입니다. **이번 커밋에는 넣지 않습니다.**

```
n
```

**확인합니다.**

```bash
git diff --staged
```

실행 결과:

```diff
diff --git a/todo.py b/todo.py
@@ -33,2 +34,10 @@
         print(f"{mark} {i}. {t['text']}")
+
+
+def clear_done():
+    todos = load()
+    remaining = [t for t in todos if not t["done"]]
+    removed = len(todos) - len(remaining)
+    save(remaining)
+    print(f"완료된 항목 {removed}개를 정리했습니다.")
```

**`clear_done` 만 정확히 담겼습니다.** 파일은 그대로인데 스테이지에는 일부만 들어간 상태입니다.

```bash
git commit -m "feat: 완료된 할 일 일괄 정리 기능 추가"
```

### Step 3. 나머지도 하나씩

**두 번째 커밋 — `count` 기능**

```bash
git add -p todo.py
```

이제 덩어리가 둘 남아 있습니다. 디버깅 줄에는 `n`, `count` 함수에는 `y`.

```bash
git diff --staged           # count 만 들어갔는지 확인
git commit -m "feat: 할 일 개수 통계 기능 추가"
```

**세 번째 커밋 — 문서 오타**

```bash
git add README.md
git commit -m "docs: README 오타 수정"
```

**디버깅 코드는 커밋하지 않고 지웁니다.**

```bash
git diff                    # 남아 있는 것 확인 → DEBUG 줄만 있어야 함
```

실행 결과:

```diff
@@ -22,6 +22,7 @@ def add(text, priority="보통"):
     save(todos)
     print(f"[추가] 할 일이 등록되었습니다: {text}")
+    print("DEBUG:", todos)
```

```bash
git restore todo.py         # 디버깅 코드 폐기
git status
```

실행 결과:

```
On branch feature/mixed-work
nothing to commit, working tree clean
```

**결과를 봅니다.**

```bash
git log --oneline -3
```

실행 결과:

```
4e9c2a7 (HEAD -> feature/mixed-work) docs: README 오타 수정
b1f8d35 feat: 할 일 개수 통계 기능 추가
7a2e6c9 feat: 완료된 할 일 일괄 정리 기능 추가
```

**뒤죽박죽이던 작업이 의미 단위 커밋 3개가 됐고, 디버깅 코드는 걸러졌습니다.**

> 🔑 `git add -p` 를 쓰면 **"일단 다 짜고 나중에 정리"** 가 가능해집니다.
> 작업할 때는 흐름에 집중하고, 커밋할 때 나누면 됩니다.

### Step 4. `e` 로 줄 단위 편집하기

`s` 로도 안 쪼개지는 경우가 있습니다. 그때 쓰는 방법입니다.

```bash
git switch main
git switch -c feature/edit-hunk
```

`README.md` 의 **연속된 두 줄**을 각각 다른 목적으로 고칩니다.

```markdown
# TODO App

Git 학습 매뉴얼 중급 과정 실습용 할 일 관리 프로그램입니다.
작성자: 홍길동
```

(설명 줄 수정 + 작성자 줄 추가가 붙어 있어 한 덩어리가 됩니다)

```bash
git add -p README.md
```

`s` 를 눌러도 더 이상 안 쪼개진다면:

```
e
```

편집기가 열립니다.

```diff
# Manual hunk edit mode -- see bottom for a quick guide.
@@ -1,3 +1,4 @@
 # TODO App

-Git 학습 매뉴얼 초급 종합 실습용 할 일 관리 프로그램입니다.
+Git 학습 매뉴얼 중급 과정 실습용 할 일 관리 프로그램입니다.
+작성자: 홍길동
# ---
# To remove '-' lines, make them ' ' lines (context).
# To remove '+' lines, delete them.
```

**"작성자" 줄을 이번엔 안 담으려면 그 `+` 줄을 지웁니다.**

```diff
@@ -1,3 +1,4 @@
 # TODO App

-Git 학습 매뉴얼 초급 종합 실습용 할 일 관리 프로그램입니다.
+Git 학습 매뉴얼 중급 과정 실습용 할 일 관리 프로그램입니다.
```

저장하고 닫으면 그 줄만 담깁니다.

```bash
git diff --staged
git commit -m "docs: 프로젝트 설명을 중급 과정에 맞게 수정"

git add README.md
git commit -m "docs: 작성자 정보 추가"
```

> **편집 규칙 두 줄만 기억하세요.**
> - `+` 줄을 빼려면 → **그 줄을 삭제**
> - `-` 줄을 빼려면 → **맨 앞 `-` 를 공백으로** (문맥 줄로 바꿈)
>
> 잘못 편집하면 `error: patch failed` 가 나옵니다. 당황하지 말고 다시 시도하면 됩니다.

### Step 5. 커밋 메시지 템플릿 만들기

형식을 매번 기억하지 않아도 되게 합니다.

`~/.gitmessage` 파일을 만듭니다.

```
# <타입>(<범위>): <제목>  — 50자 이내, 마침표 없이, 명령형
#
# 타입: feat fix docs style refactor perf test chore
#
# ────────────────────────────────────────────────
# 본문 — 무엇이 아니라 "왜" 를 씁니다. 72자에서 줄바꿈.
#
# - 어떤 문제가 있었는가
# - 왜 이 방법을 골랐는가
# - 알아 둘 부작용이 있는가
#
# ────────────────────────────────────────────────
# 꼬리말
#
# Closes #이슈번호
# BREAKING CHANGE: 호환성이 깨지는 변경이면 설명
```

```bash
git config --global commit.template ~/.gitmessage
git config --global commit.verbose true
```

이제 `git commit` 을 실행하면 편집기에 이 안내가 뜨고, 아래에 diff까지 함께 보입니다. **`#` 으로 시작하는 줄은 자동으로 무시됩니다.**

### Step 6. 커밋 나누는 실전 요령

**① 커밋 메시지를 먼저 정하기**

```
"이번엔 'feat: 삭제 기능 추가' 를 커밋하겠다"
   → 그 문장에 맞는 것만 add -p 로 담는다
```

이 순서로 하면 커밋 단위가 자연스럽게 정리됩니다.

**② 나중에 정리할 것을 표시해 두기**

작업 중에는 흐름을 끊지 말고, 나중에 고칠 곳을 표시만 해 둡니다.

```python
# TODO: 이 부분은 별도 커밋으로 분리
```

**③ 이미 커밋한 것을 나누고 싶다면**

```bash
git reset --soft HEAD~1     # 커밋만 취소, 변경은 스테이지에 유지
git reset                   # 스테이지도 풀어서 처음부터
git add -p                  # 다시 나눠 담기
```

또는 [18강](lesson-18.md)의 `rebase -i` + `edit` 을 씁니다.

**④ 실수를 나중에 고칠 커밋 예약하기**

```bash
git commit --fixup <고칠 커밋 해시>
```

`fixup! 원래 메시지` 라는 커밋이 만들어지고, 나중에 `git rebase -i --autosquash` 로 **자동으로 원래 커밋에 흡수**됩니다. [18강](lesson-18.md)에서 다룹니다.

### 같은 일을 GUI로 하면

VS Code에서 **줄 단위 스테이징**이 가능합니다. `add -p` 보다 편할 수 있습니다.

1. Source Control에서 파일을 클릭해 diff 화면을 엽니다.
2. 담고 싶은 줄(또는 여러 줄)을 **드래그해 선택**합니다.
3. 우클릭 → **`Stage Selected Ranges`**
4. 덩어리 단위라면 변경 블록 옆 아이콘 → **`Stage Change`**

| 명령어 | VS Code |
|---|---|
| `git add -p` → `y` | Stage Change |
| `git add -p` → `e` | **Stage Selected Ranges** (드래그) |
| `git diff --staged` | Staged Changes에서 파일 클릭 |

> 줄 단위로 정밀하게 고를 때는 **VS Code 쪽이 확실히 편합니다.**
> 다만 `add -p` 는 서버나 남의 컴퓨터에서도 쓸 수 있으니 양쪽 다 익혀 두세요.

---

## ⑤ 자주 하는 실수

### `add -p` 에서 키를 잘못 눌러 헤맴

**증상** — `a` 나 `d` 를 눌러 원치 않는 것까지 담기거나 빠졌습니다.
**해결** — 스테이지를 비우고 다시 시작하면 됩니다. **파일 내용은 안 건드려집니다.**

```bash
git restore --staged .      # 스테이지만 초기화
git add -p todo.py          # 다시
```

> 헷갈리면 **`?`** 를 눌러 도움말을 보세요. `q` 로 언제든 중단해도 그때까지 담은 것은 유지됩니다.

### `s` 가 선택지에 없음

```
(1/1) Stage this hunk [y,n,q,a,d,e,?]?
```

**원인** — 변경된 줄들이 **붙어 있어서** 더 쪼갤 수 없습니다. Git은 바뀌지 않은 줄을 경계로 쪼갭니다.
**해결** — **`e`** 로 직접 편집하세요 (Step 4).

### `e` 편집 후 `error: patch does not apply`

```
error: patch failed: todo.py:22
error: todo.py: patch does not apply
```

**원인** — 편집 규칙을 어겼습니다. 줄 번호나 문맥 줄을 건드렸을 가능성이 큽니다.
**해결** — 규칙 두 개만 지키세요.

```
+ 줄을 빼려면  →  그 줄을 삭제
- 줄을 빼려면  →  맨 앞 '-' 를 공백으로 바꾸기
```

`@@ -22,6 +22,7 @@` 같은 **헤더는 절대 수정하지 마세요.** Git이 알아서 계산합니다.

### 커밋을 쪼갰더니 중간 상태가 깨짐

**증상** — 커밋 3개로 나눴는데, 두 번째 커밋 시점의 코드는 실행되지 않습니다.
**원인** — 함수 정의와 호출부를 다른 커밋으로 나눴습니다.

```python
# 커밋 1: 호출부만
result = calculate(x)      # ← calculate 가 아직 없음. 여기서 실행 불가

# 커밋 2: 함수 정의
def calculate(x): ...
```

**왜 문제인가** — [25강](lesson-25.md)의 `git bisect` 는 **각 커밋을 실행해 보며** 버그를 찾습니다. 중간에 깨진 커밋이 있으면 추적이 어려워집니다.

**해결** — **각 커밋이 독립적으로 동작하도록** 나누세요. 함수 정의와 첫 사용은 함께 커밋합니다.

### 제목이 너무 길다

```
feat: 사용자가 할 일을 삭제할 수 있도록 delete 함수를 추가하고 잘못된 번호 입력에 대한 예외 처리도 함께 구현
```

**원인** — 제목에 본문 내용까지 넣었습니다.
**해결** — 제목은 50자, 나머지는 본문으로.

```
feat: 할 일 삭제 기능 추가

번호를 받아 해당 항목을 제거한다.
범위를 벗어난 번호는 안내 메시지를 출력하고 아무것도 지우지 않는다.
```

### 타입을 남발하거나 잘못 붙임

| 잘못된 예 | 올바른 타입 | 이유 |
|---|---|---|
| `feat: 오타 수정` | `docs` 또는 `fix` | 새 기능이 아님 |
| `fix: 로그인 기능 추가` | `feat` | 새 기능임 |
| `chore: 결제 버그 수정` | `fix` | 사용자에게 영향 있음 |
| `refactor: 정렬 순서 변경` | `feat` 또는 `fix` | **동작이 바뀌면 refactor 아님** |

> **`refactor` 의 정의** — **겉으로 보이는 동작은 그대로**이고 내부 구조만 바꾼 것.
> 동작이 조금이라도 바뀌면 `feat` 이나 `fix` 입니다.

### 한글과 영어를 섞어 씀

```
feat: add 할일 삭제 function
```

**해결** — **팀에서 하나로 정하세요.** 무엇이든 일관되면 됩니다.

```
✅ feat: 할 일 삭제 기능 추가         (타입은 영어, 내용은 한글)
✅ feat: add delete todo feature     (전부 영어)
```

첫 번째 방식이 국내 팀에서 가장 흔합니다. **타입은 규격이라 영어로 고정**하고 내용만 한글로 씁니다.

### 규칙이 지켜지지 않음

**원인** — 문서로만 정했습니다.
**해결** — **도구로 강제**하세요.

| 도구 | 하는 일 |
|---|---|
| **commitlint** | 규격에 안 맞는 커밋 메시지를 거부 |
| **commitizen** | 대화형으로 물어보며 메시지를 만들어 줌 |
| **커밋 템플릿** | 형식을 미리 채워 둠 (Step 5) |
| **commit-msg 훅** | 커밋 시점에 자동 검사 ([26강](lesson-26.md)) |

> [26강](lesson-26.md)에서 훅으로 자동 검사하는 방법을 실습합니다. 오늘은 템플릿까지만 해 두면 충분합니다.

---

## ⑥ 확인 문제

**1.** 아래 커밋 메시지들을 Conventional Commits 규격에 맞게 고쳐 보세요.

```
ⓐ 수정
ⓑ feat: 로그인 버그 고침
ⓒ 회원가입 기능 추가하고 README도 업데이트했습니다.
ⓓ refactor: 정렬을 최신순에서 오래된순으로 변경
```

<details>
<summary>답 보기</summary>

**ⓐ `수정`**

정보가 전혀 없습니다. 무엇을 했는지에 따라 다시 씁니다.

```
fix: 장바구니 수량이 0일 때 발생하는 오류 수정
```

**ⓑ `feat: 로그인 버그 고침`**

**타입이 틀렸습니다.** 버그 수정은 `fix` 입니다. 그리고 어떤 버그인지 구체적으로.

```
fix: 로그인 실패 후에도 세션이 남아 있는 문제 수정
```

**ⓒ `회원가입 기능 추가하고 README도 업데이트했습니다.`**

**"그리고"가 있으니 커밋을 나눠야 합니다.** 마침표와 경어체도 제거합니다.

```
feat: 회원가입 기능 추가
docs: README에 회원가입 절차 추가
```

**ⓓ `refactor: 정렬을 최신순에서 오래된순으로 변경`**

**타입이 틀렸습니다.** `refactor` 는 **동작이 변하지 않을 때**만 씁니다. 정렬 순서가 바뀌면 사용자에게 보이는 결과가 달라집니다.

```
feat: 목록 정렬을 오래된순으로 변경

최신순은 오래된 할 일이 뒤로 밀려 잊히기 쉽다는 의견이 있었다.
기존 동작이 필요하면 sort 옵션으로 지정할 수 있게 남겨 두었다.
```

호환성이 깨지는 변경이라면 `feat!:` 로 표시합니다.
</details>

**2.** 파일 하나에 **버그 수정**과 **디버깅용 print** 가 섞여 있습니다. 버그 수정만 커밋하려면?

<details>
<summary>답 보기</summary>

**`git add -p` 로 골라 담습니다.**

```bash
git add -p app.py
```

각 덩어리를 보고

| 내용 | 키 |
|---|---|
| 버그 수정 부분 | `y` |
| `print("DEBUG...")` | `n` |
| 두 개가 한 덩어리라면 | `s` 로 쪼개고, 안 되면 `e` 로 편집 |

**확인 후 커밋**

```bash
git diff --staged            # 버그 수정만 있는지 확인 ← 중요
git commit -m "fix: 잔액이 음수일 때 결제가 되는 문제 수정"
```

**남은 디버깅 코드 처리**

```bash
git diff                     # DEBUG 줄만 남았는지 확인
git restore app.py           # 폐기
```

아직 더 디버깅해야 한다면 그냥 두고 작업을 이어가면 됩니다. 커밋에는 안 들어갔으니 안전합니다.

**예방책** — 커밋 전에 자동으로 걸러낼 수도 있습니다.

```bash
git diff --staged | grep -n "DEBUG\|console.log\|print("
```

[26강](lesson-26.md)의 `pre-commit` 훅으로 자동화하면 실수 자체가 불가능해집니다.
</details>

**3.** 팀에서 이런 이야기가 나왔습니다. **"커밋 메시지 규칙까지 정할 필요가 있나요? 코드만 잘 짜면 되죠."** 어떻게 답하시겠습니까?

<details>
<summary>답 보기</summary>

**커밋 메시지는 "코드에 담을 수 없는 정보"를 담는 유일한 곳입니다.**

**① 코드는 "무엇"만 말하고 "왜"는 말하지 못합니다**

```python
if user.age >= 19 and not user.is_restricted:
```

이 조건이 **왜** 필요한지는 코드 어디에도 없습니다. 주석으로 쓸 수도 있지만, 주석은 코드가 바뀌면 낡습니다. **커밋 메시지는 그 시점의 맥락을 영구히 보존**합니다.

**② 규격을 지키면 자동화가 딸려 옵니다**

| 자동화 | 근거 |
|---|---|
| **변경 로그 자동 생성** | `feat`/`fix` 를 골라서 릴리스 노트로 ([19강](lesson-19.md)) |
| **버전 번호 자동 결정** | `feat` → minor, `fix` → patch, `BREAKING` → major |
| **CI 분기** | `docs` 만 바뀌면 테스트 건너뛰기 ([27강](lesson-27.md)) |
| **이슈 자동 연결** | `Closes #42` ([14강](lesson-14.md)) |

**③ 디버깅 속도가 달라집니다**

버그가 언제 들어왔는지 찾을 때 ([25강](lesson-25.md)):

```bash
git log --oneline --grep="결제"     # 메시지로 검색
git log -S "timeout"                # 코드 내용으로 검색
git bisect                          # 커밋을 이분 탐색
```

셋 다 **커밋이 잘 나뉘고 메시지가 정확해야** 쓸모가 있습니다. 커밋 하나에 3일치 작업이 들어 있으면 `bisect` 로 범인을 찾아도 그 안에서 다시 헤매야 합니다.

**④ 비용이 거의 안 듭니다**

템플릿(Step 5)과 훅([26강](lesson-26.md))을 설정하면 **추가로 드는 시간은 커밋당 10초** 정도입니다. 반면 6개월 뒤 "이 코드 왜 이래?" 를 추적하는 데는 몇 시간이 듭니다.

**한 문장 요약**
> 커밋 메시지는 **미래의 팀(그리고 미래의 나)에게 보내는 문서**입니다.
> 코드는 "지금 어떻게 동작하는가"를, 커밋은 "왜 이렇게 됐는가"를 기록합니다. 둘 다 필요합니다.
</details>

---

## 오늘의 정리

**Conventional Commits**

```
<타입>(<범위>): <제목>          50자 이내, 마침표 없음, 명령형

<본문>                          "왜" 를 쓴다. 72자 줄바꿈

<꼬리말>                        Closes #42 / BREAKING CHANGE:
```

| 타입 | 용도 |
|---|---|
| `feat` `fix` | 기능 추가 · 버그 수정 |
| `docs` `style` `test` `chore` | 문서 · 형식 · 테스트 · 잡일 |
| `refactor` `perf` | 구조 개선 · 성능 (**동작 변화 없음**) |

**`git add -p` 키**

| 키 | 뜻 |
|---|---|
| `y` / `n` | 담기 / 안 담기 |
| **`s`** | **더 쪼개기** |
| **`e`** | **직접 편집** |
| `a` / `d` | 이후 전부 담기 / 안 담기 |
| `q` / `?` | 끝내기 / 도움말 |

**명령**

| 명령 | 하는 일 |
|---|---|
| `git add -p <파일>` | 덩어리 단위로 골라 담기 |
| `git add -i` | 대화형 스테이징 (메뉴 방식) |
| `git diff --staged` | **담긴 내용 확인** (커밋 전 필수) |
| `git commit -v` | 편집기에 diff 함께 표시 |
| `git commit --fixup <해시>` | 나중에 흡수될 수정 커밋 ([18강](lesson-18.md)) |

**설정 (권장)**

```bash
git config --global commit.template ~/.gitmessage
git config --global commit.verbose true
```

**나누는 기준**

```
"이 커밋만 되돌려도 프로젝트가 말이 되는가?"

함께  →  기능 + 그 테스트, 이름 변경 + 호출부 전체
따로  →  기능 + 오타 수정, 로직 + 포맷 정리
```

**오늘 반드시 기억할 한 가지**
> **작업할 때는 흐름대로, 커밋할 때 `git add -p` 로 나누세요.**
> 그리고 커밋 제목에 **"그리고"** 가 들어간다면 나눠야 한다는 신호입니다.

**과제**
1. `~/.gitmessage` 템플릿을 만들고 `commit.template` 과 `commit.verbose` 를 설정하세요.
2. 파일 하나에 **세 가지 성격의 변경**을 일부러 만든 뒤, `git add -p` 로 커밋 3개로 나누세요.
3. 그 과정에서 `s` 로 덩어리를 쪼개 보고, 안 쪼개지는 상황을 만들어 `e` 로 편집해 보세요.
4. 디버깅용 `print` 를 섞어 넣고 **커밋에는 포함되지 않게** 걸러낸 뒤 `git restore` 로 폐기하세요.
5. VS Code의 **Stage Selected Ranges** 로 같은 작업을 해 보고 `add -p` 와 비교하세요.

---

[← 이전 14강](lesson-14.md) · [목차](README.md) · [다음 → 16강 임시 저장과 골라 옮기기](lesson-16.md)
