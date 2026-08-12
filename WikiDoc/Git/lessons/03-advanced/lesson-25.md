# 25강 · 범인 찾기

> **Git 학습 매뉴얼** · 🔴 고급 · **25강 / 30**
> [← 이전 24강](lesson-24.md) · [목차](README.md) · [다음 → 26강 훅과 자동 검사](lesson-26.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git bisect` 로 버그가 들어온 커밋을 **이진 탐색**으로 찾을 수 있다.
- `git bisect run` 으로 탐색을 **완전히 자동화**할 수 있다.
- `git blame` 으로 각 줄을 마지막으로 고친 커밋을 찾고, **무의미한 커밋을 제외**할 수 있다.
- `git log -S` / `-G` / `-L` 로 코드 내용과 줄 범위로 이력을 추적할 수 있다.

---

## ② 왜 필요한가

**"두 달 전에는 되던 게 지금 안 됩니다. 커밋은 500개입니다."**

방법은 세 가지입니다.

| 방법 | 걸리는 시간 |
|---|---|
| 커밋을 하나씩 되돌아가며 확인 | 최악 500번 |
| 코드를 읽으며 추측 | 운에 따라 |
| **`git bisect`** | **약 9번** |

500개를 절반씩 좁히면 `log₂(500) ≈ 9` 입니다. **1000개여도 10번, 100만 개여도 20번**입니다.

그리고 커밋을 찾은 뒤에는 이런 것들이 필요합니다.

| 질문 | 명령 |
|---|---|
| "이 줄을 누가 언제 썼나" | `git blame` |
| "이 설정값이 언제 바뀌었나" | `git log -S` |
| "이 함수는 어떻게 변해 왔나" | `git log -L` |
| "이 문자열이 어느 파일에 있나" | `git grep` |

> **[15강](lesson-15.md)에서 커밋을 잘 나누라고 한 이유가 오늘 드러납니다.**
> `bisect` 가 "3일치 작업이 담긴 커밋"을 범인으로 지목하면, 그 안에서 다시 헤매야 합니다.
> 커밋이 잘 나뉘어 있으면 범인 커밋 = 원인 코드입니다.

---

## ③ 개념 설명

### `git bisect` — 이진 탐색

```
정상(good)                                   고장(bad)
   ●────────────────────────────────────────────●
   A                                            Z
                      ▲
                 여기서 확인  →  정상이면 오른쪽 절반, 고장이면 왼쪽 절반
```

Git이 **중간 커밋을 자동으로 체크아웃**해 주고, 나는 **"됩니다/안 됩니다"** 만 답하면 됩니다.

```
커밋 수    필요한 확인 횟수
   10          약 3~4번
  100          약 7번
 1000          약 10번
```

**용어**

| 용어 | 뜻 |
|---|---|
| `bad` | 문제가 **있는** 커밋 (보통 현재 `HEAD`) |
| `good` | 문제가 **없던** 커밋 (과거 어느 시점) |
| `skip` | 판단 불가 (빌드가 안 되는 등) |
| `first bad commit` | **처음으로 문제가 생긴 커밋** = 범인 |

> **`bad`/`good` 대신 `new`/`old` 도 쓸 수 있습니다.**
> "버그"가 아니라 "성능이 느려진 시점"이나 "동작이 바뀐 시점"을 찾을 때는 그쪽이 더 자연스럽습니다.
> ```bash
> git bisect start --term-new=slow --term-old=fast
> ```

### `git bisect run` — 자동화

**판정 스크립트**를 주면 Git이 끝까지 혼자 찾습니다.

```bash
git bisect run <명령>
```

| 종료 코드 | Git의 판단 |
|---|---|
| **0** | good |
| **1~124, 126, 127** | bad |
| **125** | skip (판단 불가) |
| 128 이상 | bisect 중단 |

```bash
git bisect run python -m pytest tests/test_login.py     # 테스트가 있다면
git bisect run ./check.sh                               # 직접 만든 스크립트
```

> 🚨 **가장 흔한 함정** — 빌드 산출물이나 캐시가 체크아웃 사이에 **남아 있으면 판정이 틀립니다.**
> 스크립트 첫 줄에서 **캐시를 지우세요.** ⑤에서 실제 사례로 다룹니다.

### `git blame` — 줄별 마지막 수정자

```
^a3d8917 (Hong Gildong 2026-08-10 16:41:04 +0900 1) def add(a, b):
baea7d65 (Hong Gildong 2026-08-10 16:41:04 +0900 2)     return a - b
   │            │              │                    │
  커밋        작성자          시각                 줄 번호
```

`^` 는 **첫 커밋(경계)** 을 뜻합니다. 더 거슬러 올라갈 수 없다는 표시입니다.

**주의** — blame은 **"마지막으로 고친 커밋"** 만 보여 줍니다. 들여쓰기만 바꾼 커밋이 원저자를 가려 버리는 일이 흔합니다. 그래서 아래 옵션들이 있습니다.

| 옵션 | 하는 일 |
|---|---|
| `-L 10,20` | 그 줄 범위만 |
| `-w` | **공백 변경 무시** |
| `-M` | 파일 안에서 **이동한** 코드 추적 |
| `-C` | **다른 파일에서 복사**된 코드까지 추적 |
| `--ignore-rev <해시>` | 그 커밋을 **없는 것으로 치고** blame |
| `--date=short` | 날짜만 표시 |

### `.git-blame-ignore-revs`

포맷터 일괄 적용([18강](lesson-18.md))처럼 **의미 없는 대형 커밋**을 blame에서 영구히 제외할 수 있습니다.

저장소 루트에 파일을 만들고,

```
# 전체 포맷터 적용 (2026-08-10)
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0

# 줄바꿈 정규화
b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
```

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

> **GitHub도 이 파일을 자동으로 인식합니다.** 웹 blame 화면에서도 해당 커밋이 제외됩니다.
> 대규모 포맷 변경을 할 때는 **커밋 직후 이 파일에 해시를 추가**하는 것이 관례입니다.

### 곡괭이 — `-S` 와 `-G`

[06강](lesson-06.md)에서 맛본 기능입니다. 둘의 차이가 중요합니다.

| 옵션 | 찾는 것 |
|---|---|
| **`-S <문자열>`** | 그 문자열의 **개수가 변한** 커밋 (추가 또는 삭제) |
| **`-G <정규식>`** | 그 패턴이 **diff에 등장한** 모든 커밋 |

```bash
git log -S "timeout" -- config.py        # timeout 이 추가/삭제된 커밋만
git log -G "return a [+-] b" -- calc.py  # 그 패턴이 스친 모든 커밋
```

> **`-S` 가 더 좁고 정확합니다.** "이 설정이 언제 들어왔나"를 찾을 때 씁니다.
> **`-G` 는 더 넓습니다.** 값만 바뀐 경우(`timeout = 30` → `timeout = 5`)는 `-S "timeout"` 으로는 안 잡히고 `-G` 로 잡힙니다.

### `git log -L` — 줄 범위의 역사

```bash
git log -L 10,20:app.py        # app.py 의 10~20번 줄
git log -L :login:app.py       # app.py 의 login 함수 (정규식으로 함수 찾기)
```

**그 줄들이 변해 온 과정을 diff와 함께** 보여 줍니다. 코드가 이동해도 따라갑니다.

### `git grep` — 저장소 안 검색

```bash
git grep "TODO"                    # 현재 작업 디렉터리
git grep "TODO" HEAD~10            # 10커밋 전 시점에서
git grep "TODO" $(git rev-list --all)   # 전체 이력에서 🐌
```

일반 `grep` 보다 빠릅니다. `.gitignore` 대상과 `.git` 을 자동으로 건너뛰고, **과거 시점에서도 검색**할 수 있기 때문입니다.

---

## ④ 단계별 실습

### Step 0. 버그를 심어 둔 실험실 만들기

```bash
cd ~/Desktop
mkdir bug-hunt && cd bug-hunt
git init
git config user.name "Hong Gildong"
git config user.email "hong@example.com"
git config core.autocrlf false
```

```bash
cat > calc.py << 'EOF'
def add(a, b):
    return a + b
EOF
git add . && git commit -qm "feat: 덧셈 추가"

for i in 2 3 4 5; do
  echo "# 작업 $i" >> notes.txt
  git add notes.txt && git commit -qm "chore: 작업 $i"
done

# 여기서 버그 삽입
sed -i 's/return a + b/return a - b/' calc.py
git add calc.py && git commit -qm "refactor: 덧셈 정리"

for i in 7 8 9 10; do
  echo "# 작업 $i" >> notes.txt
  git add notes.txt && git commit -qm "chore: 작업 $i"
done
```

```bash
git log --oneline
```

실행 결과:

```
65d9fe9 chore: 작업 10
cb299bc chore: 작업 9
5f32fa0 chore: 작업 8
a176453 chore: 작업 7
baea7d6 refactor: 덧셈 정리      ← 진짜 범인 (아직 모르는 척)
0c971b7 chore: 작업 5
2552c25 chore: 작업 4
b0e44cf chore: 작업 3
1f9ddd8 chore: 작업 2
a3d8917 feat: 덧셈 추가
```

**버그를 확인합니다.**

```bash
python -c "import calc; print(calc.add(2,3))"
```

실행 결과:

```
-1
```

**5가 나와야 하는데 -1입니다.** 언제부터 이랬을까요.

### Step 1. 수동 bisect

```bash
git bisect start
git bisect bad                # 현재(HEAD)는 고장
git bisect good a3d8917       # 첫 커밋은 정상이었다
```

실행 결과:

```
status: waiting for both good and bad commits
status: waiting for good commit(s), bad commit known
Bisecting: 4 revisions left to test after this (roughly 2 steps)
[0c971b797e61817614a3b1ec6febc9ee0ab1f776] chore: 작업 5
```

> **Git이 중간 지점으로 자동 체크아웃했습니다.** `roughly 2 steps` — 앞으로 두 번만 답하면 됩니다.

**테스트합니다.**

```bash
python -c "import calc; print(calc.add(2,3))"
```

실행 결과:

```
5
```

**정상입니다.**

```bash
git bisect good
```

실행 결과:

```
Bisecting: 2 revisions left to test after this (roughly 1 step)
[a176453e0d342cce0ff5693869a214db4ecb40a4] chore: 작업 7
```

```bash
python -c "import calc; print(calc.add(2,3))"
```

실행 결과:

```
-1
```

**고장입니다.**

```bash
git bisect bad
```

실행 결과:

```
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[baea7d65e5c47515f7915940f59fcc99ec7bcc98] refactor: 덧셈 정리
```

```bash
python -c "import calc; print(calc.add(2,3))"
git bisect bad
```

실행 결과:

```
-1
baea7d65e5c47515f7915940f59fcc99ec7bcc98 is the first bad commit
commit baea7d65e5c47515f7915940f59fcc99ec7bcc98
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 16:41:04 2026 +0900

    refactor: 덧셈 정리

 calc.py | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

**3번 만에 범인을 찾았습니다.**

> 커밋 메시지가 `refactor: 덧셈 정리` 인 것에 주목하세요. **"동작은 그대로"여야 할 refactor 커밋이 동작을 바꿨습니다.**
> [15강](lesson-15.md)에서 "refactor는 동작이 안 바뀔 때만"이라고 한 이유입니다.

**반드시 정리하세요.**

```bash
git bisect reset
```

실행 결과:

```
Previous HEAD position was baea7d6 refactor: 덧셈 정리
Switched to branch 'main'
```

> ⚠️ **`git bisect reset` 을 빼먹으면 detached HEAD 상태로 남습니다** ([22강](lesson-22.md)).
> 그 상태에서 작업하면 커밋이 어디에도 속하지 않게 됩니다.

### Step 2. 자동 bisect (`bisect run`)

판정 스크립트를 만듭니다.

```bash
cat > test.sh << 'EOF'
#!/bin/sh
rm -rf __pycache__                                   # ⭐ 캐시 삭제 (필수!)
python -c "import calc; exit(0 if calc.add(2,3)==5 else 1)"
EOF
chmod +x test.sh
```

> 🚨 **첫 줄의 `rm -rf __pycache__` 가 없으면 결과가 틀립니다.** 이유는 ⑤에서 다룹니다.

```bash
git bisect start HEAD a3d8917      # bad good 을 한 줄로
git bisect run ./test.sh
```

실행 결과:

```
Bisecting: 4 revisions left to test after this (roughly 2 steps)
[0c971b797e61817614a3b1ec6febc9ee0ab1f776] chore: 작업 5
running './test.sh'
Bisecting: 2 revisions left to test after this (roughly 1 step)
[a176453e0d342cce0ff5693869a214db4ecb40a4] chore: 작업 7
running './test.sh'
Bisecting: 0 revisions left to test after this (roughly 1 step)
[baea7d65e5c47515f7915940f59fcc99ec7bcc98] refactor: 덧셈 정리
running './test.sh'
baea7d65e5c47515f7915940f59fcc99ec7bcc98 is the first bad commit
commit baea7d65e5c47515f7915940f59fcc99ec7bcc98
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 16:41:04 2026 +0900

    refactor: 덧셈 정리

 calc.py | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
bisect found first bad commit
```

**손 하나 대지 않고 찾았습니다.**

```bash
git bisect reset
```

**실무에서는 대개 테스트 프레임워크를 그대로 씁니다.**

```bash
git bisect run python -m pytest tests/test_calc.py -q
git bisect run npm test
git bisect run make test
```

### Step 3. `bisect log` · `replay` · `skip`

**진행 기록 보기**

```bash
git bisect start
git bisect bad
git bisect good a3d8917
git bisect good
git bisect log
```

실행 결과:

```
git bisect start
# status: waiting for both good and bad commits
# bad: [65d9fe9...] chore: 작업 10
git bisect bad 65d9fe91600551163e1518ecdeb52cb26a5b2832
# status: waiting for good commit(s), bad commit known
# good: [a3d8917...] feat: 덧셈 추가
git bisect good a3d8917e5b04e3d6f9fe687298cc2044af7c843d
# good: [0c971b7...] chore: 작업 5
git bisect good 0c971b797e61817614a3b1ec6febc9ee0ab1f776
```

**저장했다가 다시 실행할 수 있습니다.**

```bash
git bisect log > bisect-session.txt
git bisect reset

# 나중에 이어서
git bisect replay bisect-session.txt
```

> 팀원에게 **"여기까지 확인했다"** 를 넘겨줄 때 유용합니다.

**판단할 수 없는 커밋 건너뛰기**

```bash
git bisect skip           # 이 커밋은 빌드가 안 된다
git bisect skip a176453   # 특정 커밋 지정
```

> `skip` 을 너무 많이 쓰면 Git이 범위를 좁히지 못하고 **후보를 여러 개** 내놓습니다.
> "이 커밋들 중 하나가 범인입니다"라고 나오면 그 안에서 직접 봐야 합니다.

**특정 경로만 대상으로**

```bash
git bisect start -- src/     # src/ 를 건드린 커밋만 후보로
```

문서·설정만 바꾼 커밋을 빼면 탐색 횟수가 줄어듭니다.

```bash
git bisect reset
```

### Step 4. `git blame`

```bash
git blame calc.py
```

실행 결과:

```
^a3d8917 (Hong Gildong 2026-08-10 16:41:04 +0900 1) def add(a, b):
baea7d65 (Hong Gildong 2026-08-10 16:41:04 +0900 2)     return a - b
```

**2번 줄이 `baea7d65` 에서 마지막으로 바뀌었습니다.** bisect가 찾은 그 커밋입니다.

**보기 좋게**

```bash
git blame --date=short -L 1,2 calc.py
```

실행 결과:

```
^a3d8917 (Hong Gildong 2026-08-10 1) def add(a, b):
baea7d65 (Hong Gildong 2026-08-10 2)     return a - b
```

**찾은 커밋의 전모 보기**

```bash
git show baea7d6
```

**blame → show 가 실무에서 가장 자주 쓰는 조합**입니다. 줄에서 커밋을 찾고, 커밋에서 이유를 읽습니다.

**유용한 옵션**

```bash
git blame -w calc.py           # 공백 변경 무시
git blame -M calc.py           # 파일 안 이동 추적
git blame -C calc.py           # 다른 파일에서 복사된 것까지
git blame --ignore-rev <해시> calc.py   # 그 커밋 제외
```

**한 줄만 빠르게 보기**

```bash
git blame -L 2,2 --porcelain calc.py | head -1
```

### Step 5. `.git-blame-ignore-revs` 만들기

포맷터를 돌린 상황을 만들어 봅니다.

```bash
sed -i 's/^    return/        return/' calc.py     # 들여쓰기만 변경
git add calc.py && git commit -qm "style: 들여쓰기 통일"
git blame calc.py
```

실행 결과 (예):

```
^a3d8917 (Hong Gildong 2026-08-10 1) def add(a, b):
7f2c9a1  (Hong Gildong 2026-08-10 2)         return a - b
```

> 🚨 **진짜 범인(`baea7d65`)이 가려졌습니다.** 들여쓰기만 바꾼 커밋이 blame을 덮어썼습니다.

**제외 목록을 만듭니다.**

```bash
git rev-parse HEAD > .git-blame-ignore-revs
git config blame.ignoreRevsFile .git-blame-ignore-revs
git blame calc.py
```

실행 결과:

```
^a3d8917 (Hong Gildong 2026-08-10 1) def add(a, b):
baea7d65 (Hong Gildong 2026-08-10 2)         return a - b
```

**진짜 커밋이 다시 보입니다.**

```bash
git add .git-blame-ignore-revs
git commit -qm "chore: blame 제외 목록 추가"
```

> **파일을 커밋해 두면 팀 전체가 혜택을 봅니다.** GitHub 웹 blame도 자동으로 인식합니다.
> 다만 `blame.ignoreRevsFile` **설정 자체는 각자 해야** 합니다. `CONTRIBUTING.md` 에 적어 두세요 ([13강](lesson-13.md)).

**일회성으로 제외하려면**

```bash
git blame --ignore-rev 7f2c9a1 calc.py
```

### Step 6. 곡괭이 — `-S` 와 `-G`

```bash
git log --oneline -S "a - b" -- calc.py
```

실행 결과:

```
baea7d6 refactor: 덧셈 정리
```

**`a - b` 라는 문자열이 등장한 커밋**을 정확히 짚었습니다.

```bash
git log --oneline -G "return a [+-] b" -- calc.py
```

실행 결과:

```
baea7d6 refactor: 덧셈 정리
a3d8917 feat: 덧셈 추가
```

**`-G` 는 더 넓습니다.** 그 패턴이 diff에 나타난 모든 커밋이 잡힙니다.

**차이를 정리하면**

```
-S "timeout"   →  timeout 의 개수가 변한 커밋 (추가·삭제)
-G "timeout"   →  timeout 이 diff 에 등장한 모든 커밋 (값만 바뀐 것 포함)
```

**실무 예**

```bash
git log -S "DEBUG = True" --oneline          # 이 설정이 언제 들어왔나
git log -S "def login" --oneline             # 이 함수가 언제 생기고 사라졌나
git log -G "password.*=" --oneline           # 비밀번호 관련 변경 추적
git log -S "api_key" --all --oneline         # 모든 브랜치에서
```

### Step 7. `git log -L` — 줄 범위 추적

```bash
git log -L 2,2:calc.py --oneline
```

실행 결과:

```
baea7d6 refactor: 덧셈 정리

diff --git a/calc.py b/calc.py
--- a/calc.py
+++ b/calc.py
@@ -2,1 +2,1 @@
-    return a + b
+    return a - b

a3d8917 feat: 덧셈 추가

diff --git a/calc.py b/calc.py
--- /dev/null
+++ b/calc.py
@@ -0,0 +2,1 @@
+    return a + b
```

**그 한 줄의 전체 역사**를 diff와 함께 보여 줍니다. 아래에서 위로 읽으면 됩니다.

**함수 이름으로 지정하기**

```bash
git log -L :add:calc.py --oneline
```

`:함수명:파일` 형식으로 쓰면 Git이 **함수 경계를 찾아** 그 범위를 추적합니다. 코드가 이동해도 따라갑니다.

> **`-L` 은 `blame` 보다 강력합니다.** blame은 "마지막 수정"만 보여 주지만, `-L` 은 **전체 변화 과정**을 보여 줍니다.

### Step 8. `git grep`

```bash
git grep -n "return"
```

실행 결과:

```
calc.py:2:        return a - b
```

**과거 시점에서 검색**

```bash
git grep -n "return" a3d8917
```

실행 결과:

```
a3d8917:calc.py:2:    return a + b
```

> 🔑 **파일을 체크아웃하지 않고 과거를 검색**할 수 있습니다. 일반 `grep` 으로는 불가능합니다.

**유용한 옵션**

```bash
git grep -i "todo"                  # 대소문자 무시
git grep -n "TODO" -- "*.py"        # 확장자 제한
git grep -c "import"                # 파일별 개수
git grep -l "api_key"               # 파일 이름만
git grep -A3 -B1 "def add"          # 앞뒤 문맥
git grep --all-match -e "def" -e "return"   # 둘 다 포함하는 파일
```

**전체 이력에서 검색** (느리지만 강력합니다)

```bash
git grep -n "api_key" $(git rev-list --all)
```

> **비밀키가 언제 어디에 들어갔는지** 찾을 때 씁니다 ([29강](lesson-29.md)).

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| blame | VS Code에 **GitLens** 확장 → 줄 끝에 작성자·커밋 자동 표시 |
| 파일 전체 blame | GitLens: `Toggle File Blame` |
| GitHub blame | 파일 화면 우측 상단 **Blame** 버튼 |
| 줄 이력 | GitHub blame 화면에서 왼쪽 아이콘 → 그 시점 이전 blame으로 |
| bisect | **지원하는 GUI가 사실상 없음** |

> **GitLens는 강력히 권합니다.** 커서를 올리기만 해도 그 줄의 커밋·작성자·메시지가 보입니다.
> 반면 **`bisect` 는 명령어로만** 가능합니다. 오늘 배운 것 중 가장 CLI 의존적인 기능입니다.

---

## ⑤ 자주 하는 실수

### `bisect run` 이 엉뚱한 커밋을 지목함 🚨

**이 강에서 가장 중요한 함정입니다. 실제로 재현해 봅시다.**

`test.sh` 에서 캐시 삭제 줄을 빼면:

```bash
cat > test-bad.sh << 'EOF'
#!/bin/sh
python -c "import calc; exit(0 if calc.add(2,3)==5 else 1)"
EOF
chmod +x test-bad.sh
git bisect start HEAD a3d8917
git bisect run ./test-bad.sh
```

실행 결과:

```
65d9fe91600551163e1518ecdeb52cb26a5b2832 is the first bad commit
    chore: 작업 10
```

**`chore: 작업 10` 이라고 나옵니다. 완전히 틀렸습니다.** 진짜 범인은 `baea7d6` 입니다.

**원인** — `__pycache__/calc.cpython-310.pyc` 가 **체크아웃 사이에 남아 있습니다.** untracked 파일이라 Git이 건드리지 않습니다. Python이 낡은 캐시를 그대로 써서 판정이 틀렸습니다.

**확인해 봅시다.**

```bash
git bisect reset
python -c "import calc; print(calc.add(2,3))"      # 5  (틀림)
rm -rf __pycache__
python -c "import calc; print(calc.add(2,3))"      # -1 (맞음)
```

**해결 — 스크립트 첫 줄에서 정리하세요.**

```sh
#!/bin/sh
rm -rf __pycache__ .pytest_cache        # Python
# rm -rf node_modules/.cache dist       # JS
# make clean                            # C/C++
python -c "..."
```

**언어별로 조심해야 할 것**

| 언어 | 남는 것 |
|---|---|
| Python | `__pycache__/`, `*.pyc`, `.pytest_cache/` |
| JavaScript | `node_modules/`, `dist/`, `.next/` |
| Java | `target/`, `build/`, `*.class` |
| C/C++ | `*.o`, 링크 산출물 |

> **의존성이 커밋마다 다르다면** 스크립트에 설치 단계까지 넣어야 합니다.
> ```sh
> pip install -r requirements.txt -q
> ```

### `git bisect reset` 을 잊음

```bash
git status
```

```
HEAD detached at baea7d6
```

**증상** — detached HEAD 상태로 남아, 여기서 커밋하면 어디에도 속하지 않습니다 ([22강](lesson-22.md)).
**해결** —

```bash
git bisect reset              # 원래 브랜치로 복귀
```

특정 브랜치로 가려면:

```bash
git bisect reset main
```

**bisect 중에 커밋해 버렸다면** — 그 해시로 브랜치를 만든 뒤 reset하세요.

```bash
git branch rescue-work
git bisect reset
```

### `good` 과 `bad` 를 반대로 지정

```bash
git bisect good           # 현재가 고장인데 good 이라고 함
git bisect bad <옛날 커밋>
```

**증상** — Git이 이상한 커밋을 지목하거나 이런 메시지가 나옵니다.

```
Some good revs are not ancestors of the bad rev.
```

**해결** — 다시 시작하세요.

```bash
git bisect reset
git bisect start
git bisect bad            # 지금 고장난 상태
git bisect good <정상이던 과거 커밋>
```

**외우는 법** — `bad` 는 **현재**(고장), `good` 은 **과거**(정상). 시간이 흐르며 good → bad로 바뀐 지점을 찾는 것입니다.

**중간에 잘못 답했다면** `bisect log` 를 편집해 `replay` 하면 됩니다.

```bash
git bisect log > fix.txt
# fix.txt 에서 잘못된 줄 수정
git bisect reset
git bisect replay fix.txt
```

### blame이 엉뚱한 사람을 가리킴

**증상** — 모든 줄이 "전체 포맷팅 적용" 커밋으로 나옵니다.
**원인** — 공백·들여쓰기만 바꾼 커밋이 blame을 덮어씁니다.
**해결** —

```bash
git blame -w calc.py                          # 공백 무시
git blame --ignore-rev <포맷팅 커밋> calc.py
git config blame.ignoreRevsFile .git-blame-ignore-revs   # 영구 적용
```

**예방** — 포맷터를 돌릴 때는 **반드시 단독 커밋**으로 만들고, 커밋 직후 `.git-blame-ignore-revs` 에 해시를 추가하세요 ([18강](lesson-18.md)).

### blame으로 "책임자 찾기"를 함

**증상** — "이거 누가 짰어?" 라는 대화가 시작되고 팀 분위기가 나빠집니다.
**문제** — blame은 **맥락을 보여 주지 않습니다.**

- 그 사람은 다른 사람의 코드를 옮겼을 수 있습니다 (`-M`, `-C` 로 확인)
- 급한 요구사항 때문에 임시로 넣은 것일 수 있습니다
- 당시에는 맞는 코드였을 수 있습니다

**바른 사용법** — **커밋 메시지를 읽으세요.**

```bash
git blame -L 42,42 app.py       # 커밋 해시 찾기
git show <해시>                  # 왜 그렇게 했는지 읽기
git log --merges --ancestry-path <해시>..HEAD | head    # 어느 PR 로 들어왔는지
```

> **blame의 목적은 "책임 추궁"이 아니라 "맥락 파악"** 입니다.
> [15강](lesson-15.md)에서 커밋 메시지에 "왜"를 쓰라고 한 이유가 이 순간을 위해서입니다.

### `-S` 로 못 찾음

```bash
git log -S "timeout" -- config.py     # 아무것도 안 나옴
```

**원인** — `-S` 는 그 문자열의 **개수가 변한** 커밋만 찾습니다. `timeout = 30` → `timeout = 5` 는 개수가 그대로라 안 잡힙니다.
**해결** —

```bash
git log -G "timeout" -- config.py      # diff 에 등장한 모든 커밋
git log -L :함수명:config.py            # 그 부분의 전체 이력
git log -p -- config.py                # 파일의 모든 변경
```

### bisect 결과가 "3일치 작업" 커밋

**증상** — 범인 커밋이 파일 40개, +2000줄입니다. 찾았어도 어디가 문제인지 모릅니다.
**원인** — 커밋 단위가 너무 큽니다.
**해결** — 그 커밋 안에서 다시 좁혀야 합니다.

```bash
git show --stat <범인 커밋>        # 어떤 파일이 바뀌었나
git show <범인 커밋> -- <의심 파일>
```

**예방이 유일한 답입니다.** [15강](lesson-15.md)의 원자적 커밋을 지키세요. `bisect` 는 **커밋이 잘 나뉜 저장소에서만 제값을 합니다.**

---

## ⑥ 확인 문제

**1.** 커밋 1000개가 쌓인 저장소에서 버그가 언제 들어왔는지 찾으려 합니다. **몇 번 정도 확인하면 되고**, 명령은 어떻게 될까요?

<details>
<summary>답 보기</summary>

**약 10번**입니다. `log₂(1000) ≈ 9.97`.

**수동 방식**

```bash
git bisect start
git bisect bad                     # 현재 = 고장
git bisect good v1.0.0             # 이 태그 시점엔 정상이었다

# Git 이 체크아웃해 주는 커밋마다 확인하고
git bisect good     # 또는 git bisect bad
# ... 약 10번 반복 ...

git bisect reset                   # ⭐ 반드시
```

**자동 방식 (테스트가 있다면)**

```bash
git bisect start HEAD v1.0.0
git bisect run python -m pytest tests/test_login.py -q
git bisect reset
```

**범위를 좁히면 더 빨라집니다.**

```bash
git bisect start -- src/           # src/ 를 건드린 커밋만 후보로
```

**good 시점을 잡는 요령**

- **태그**가 있다면 릴리스 태그를 쓰세요 ([19강](lesson-19.md)) — `git bisect good v1.2.0`
- 없다면 날짜로: `git rev-list -n1 --before="2026-06-01" main`
- 너무 옛날로 잡아도 괜찮습니다. **한두 번 더 확인**할 뿐입니다 (로그 스케일이라 비용이 작음)

**시작 전 준비**

```bash
git status          # 작업 디렉터리를 깨끗하게 (bisect 는 체크아웃을 반복함)
git stash -u        # 필요하면 보관
```
</details>

**2.** `git bisect run` 을 돌렸는데 명백히 관계없는 커밋(문서만 수정한 것)을 범인으로 지목했습니다. 무엇을 의심해야 할까요?

<details>
<summary>답 보기</summary>

**① 빌드 산출물·캐시가 체크아웃 사이에 남아 있다** (가장 흔함)

`__pycache__`, `node_modules`, `dist/`, `target/` 은 **untracked라서 Git이 건드리지 않습니다.** 낡은 산출물로 테스트가 실행되면 판정이 뒤집힙니다.

```sh
#!/bin/sh
rm -rf __pycache__ .pytest_cache dist        # ⭐ 첫 줄에서 정리
python -m pytest -q
```

**② 스크립트의 종료 코드가 의도와 다르다**

| 코드 | Git 판단 |
|---|---|
| 0 | good |
| 1~124, 126, 127 | bad |
| **125** | **skip** |
| 128+ | 중단 |

- 파일이 없어서 `127`(command not found)이 나면 **bad로 오해**합니다
- 빌드 실패는 **`exit 125`(skip)** 로 처리해야 합니다

```sh
#!/bin/sh
make build || exit 125          # 빌드 실패 = 판단 불가
./run-test || exit 1            # 테스트 실패 = bad
exit 0
```

**③ 테스트 자체가 불안정(flaky)하다**

무작위·시간·네트워크에 의존하면 같은 커밋에서도 결과가 달라집니다. 먼저 테스트를 안정시켜야 합니다.

**④ good/bad를 반대로 줬다**

```bash
git bisect log        # 판정 기록 확인
```

**검증 방법**

```bash
git bisect reset
git switch --detach <지목된 커밋>
./test.sh; echo "exit=$?"
git switch --detach <지목된 커밋>~1
./test.sh; echo "exit=$?"
```

**두 결과가 실제로 달라야** 그 커밋이 맞습니다. 같다면 판정 스크립트가 잘못된 것입니다.
</details>

**3.** `git blame` 으로 문제의 줄을 찾았더니 "전체 코드 포맷팅 적용" 커밋이 나왔습니다. **진짜 작성자**를 찾는 방법과, **애초에 이런 일을 막는 방법**은?

<details>
<summary>답 보기</summary>

**진짜 작성자 찾기**

```bash
# ① 공백 변경 무시
git blame -w app.py

# ② 그 커밋을 없는 것으로 치고 blame
git blame --ignore-rev <포맷팅 커밋> app.py

# ③ 그 커밋 직전 시점의 blame
git blame <포맷팅 커밋>~1 -- app.py

# ④ 줄 범위의 전체 이력 (가장 확실)
git log -L 42,42:app.py
```

**④가 가장 좋습니다.** "마지막 수정"이 아니라 **변화 전체**를 보여 줍니다.

**애초에 막는 방법**

**① 포맷 변경은 반드시 단독 커밋** ([18강](lesson-18.md))

```bash
black .
git add -A
git commit -m "style: black 포맷터 일괄 적용"     # 다른 변경 섞지 않기
```

**② `.git-blame-ignore-revs` 에 등록**

```bash
git rev-parse HEAD >> .git-blame-ignore-revs
git add .git-blame-ignore-revs
git commit -m "chore: blame 제외 목록에 포맷팅 커밋 추가"
```

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

**GitHub 웹 blame도 이 파일을 자동 인식합니다.**

**③ 애초에 포맷터를 자동화**

커밋 시점에 자동으로 적용되면 "일괄 적용" 커밋이 생길 일이 없습니다.

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black
```

[26강](lesson-26.md)에서 훅으로 자동화하는 방법을 실습합니다.

**④ 설정을 저장소에 커밋**

`pyproject.toml`, `.editorconfig`, `.prettierrc` 를 커밋해 두면 사람마다 다른 포맷이 적용되는 일이 없어집니다.
</details>

---

## 오늘의 정리

**`git bisect` — 이진 탐색으로 범인 찾기**

| 명령 | 하는 일 |
|---|---|
| `git bisect start` | 시작 |
| `git bisect bad` / `good <커밋>` | 고장 / 정상 지점 지정 |
| `git bisect start HEAD <good>` | 한 줄로 시작 |
| **`git bisect run <명령>`** | **완전 자동** |
| `git bisect skip` | 판단 불가 |
| `git bisect log` / `replay <파일>` | 기록 저장·재현 |
| **`git bisect reset`** | **반드시 정리** |

**판정 스크립트 종료 코드**

```
0        → good
1~127    → bad  (125 제외)
125      → skip (빌드 실패 등)
```

> 🚨 **스크립트 첫 줄에서 캐시·빌드 산출물을 지우세요.** 안 그러면 결과가 틀립니다.

**`git blame` — 줄별 마지막 수정**

| 옵션 | 하는 일 |
|---|---|
| `-L 10,20` | 줄 범위 |
| `-w` | **공백 무시** |
| `-M` / `-C` | 이동·복사 추적 |
| `--ignore-rev <해시>` | 그 커밋 제외 |
| `blame.ignoreRevsFile` | **영구 제외 목록** |

**코드로 이력 찾기**

| 명령 | 찾는 것 |
|---|---|
| `git log -S "문자열"` | 그 문자열의 **개수가 변한** 커밋 |
| `git log -G "정규식"` | diff에 **등장한** 모든 커밋 |
| `git log -L 10,20:파일` | 그 줄 범위의 **전체 이력** |
| `git log -L :함수명:파일` | 그 함수의 전체 이력 |
| `git grep "패턴" <커밋>` | **과거 시점 검색** |

**실무 흐름**

```
증상 발견
  → git bisect run <테스트>      범인 커밋 찾기
  → git show <범인>              무엇이 바뀌었나
  → git blame / git log -L       그 줄의 맥락
  → 커밋 메시지의 "왜" 읽기       의도 파악
  → git revert 또는 수정          (17강)
```

**오늘 반드시 기억할 한 가지**
> **`bisect run` 스크립트의 첫 줄은 캐시 삭제입니다.**
> 그리고 끝나면 **`git bisect reset`** 을 잊지 마세요.

**과제**
1. 커밋 10개짜리 실험실을 만들어 중간에 버그를 심고, **수동 bisect**로 몇 번 만에 찾는지 세어 보세요.
2. 판정 스크립트를 만들어 `git bisect run` 으로 자동 탐색하세요.
3. 스크립트에서 **캐시 삭제 줄을 빼고** 실행해 **결과가 틀리는 것**을 직접 확인하세요.
4. 들여쓰기만 바꾼 커밋을 만들어 `git blame` 이 가려지는 것을 확인하고, `.git-blame-ignore-revs` 로 해결하세요.
5. `git log -S` 와 `-G` 를 같은 문자열로 실행해 **결과 개수가 다른 것**을 확인하세요.
6. `git log -L :함수명:파일` 로 함수 하나의 전체 역사를 확인하세요.

---

[← 이전 24강](lesson-24.md) · [목차](README.md) · [다음 → 26강 훅과 자동 검사](lesson-26.md)
