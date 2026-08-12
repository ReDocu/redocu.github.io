# 24강 · 세 그루의 나무(3-tree) 모델

> **Git 학습 매뉴얼** · 🔴 고급 · **24강 / 30**
> [← 이전 23강](lesson-23.md) · [목차](README.md) · [다음 → 25강 범인 찾기](lesson-25.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- **세 그루의 나무**(HEAD · 인덱스 · 작업 디렉터리)가 각각 무엇인지 설명할 수 있다.
- `reset` 의 세 옵션이 **어느 나무까지 건드리는지** 정확히 안다.
- `reset` 과 `checkout`(`switch`)이 **무엇을 옮기는지**의 차이를 설명할 수 있다.
- `reset <경로>` 가 왜 HEAD를 안 움직이는지 안다.
- 상황에 맞는 명령을 표를 보지 않고 고를 수 있다.

---

## ② 왜 필요한가

[03강](lesson-03.md)에서 "세 개의 공간"을 배웠고, [07강](lesson-07.md)에서 `reset` 세 옵션을 외웠습니다. 하지만 이런 질문에는 아직 답하기 어렵습니다.

- `git reset HEAD~1` 과 `git reset HEAD~1 -- file.txt` 는 왜 결과가 전혀 다른가?
- `git reset <커밋>` 과 `git switch --detach <커밋>` 은 무엇이 다른가?
- `git restore --staged` 는 `git reset` 과 뭐가 다른가?
- `--hard` 로 날린 건 왜 복구가 안 되는데 `--soft` 는 안전한가?

[21강](lesson-21.md)에서 객체를, [22강](lesson-22.md)에서 참조를 봤으니, 이제 이 모든 명령을 **하나의 모델**로 설명할 수 있습니다.

> **Git 명령의 대부분은 "세 나무 중 어느 것을 어디에 맞출 것인가"** 입니다.
> 이 모델을 이해하면 명령 20개를 외우는 대신 **그림 하나**를 기억하면 됩니다.

---

## ③ 개념 설명

### 세 그루의 나무

Git 문서에서 "tree"는 **파일 상태의 스냅샷**을 뜻합니다.

```
   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
   │     HEAD     │   │    인덱스     │   │  작업 디렉터리     │
   │ (마지막 커밋)  │   │  (스테이지)   │   │  (내 파일들)       │
   └──────────────┘   └──────────────┘   └──────────────────┘
        커밋된 것        다음 커밋 예정        지금 편집 중
```

| 나무 | 실체 | 확인 명령 |
|---|---|---|
| **HEAD** | 현재 브랜치가 가리키는 **커밋의 tree** | `git ls-tree -r HEAD` |
| **인덱스** | `.git/index` 파일 (**경로 → blob 해시** 목록) | `git ls-files -s` |
| **작업 디렉터리** | 실제 디스크의 파일들 | `ls`, 에디터 |

> [21강](lesson-21.md) Step 6에서 인덱스의 실체를 봤습니다. **파일 경로와 blob 해시의 목록**이었습니다.
> [03강](lesson-03.md)의 "장바구니" 비유가 이것입니다.

### `git status` 는 두 번의 비교

```
   HEAD  ◀── 비교 1 ──▶  인덱스  ◀── 비교 2 ──▶  작업 디렉터리
        "Changes to be           "Changes not staged
         committed"                for commit"
        (초록, 스테이지됨)          (빨강, 안 담김)
```

`git status --short` 는 이 두 비교를 **두 글자**로 보여 줍니다.

```
MM f.txt
││
│└── 비교 2: 인덱스 ↔ 작업 디렉터리
└─── 비교 1: HEAD ↔ 인덱스
```

| 표시 | 뜻 |
|---|---|
| `M ` | 스테이지됨 (HEAD와 다름, 작업 디렉터리와 같음) |
| ` M` | 수정됨, 안 담김 |
| `MM` | 담은 뒤 **또 고침** ([03강](lesson-03.md)에서 본 그 상황) |
| `A ` | 새로 추가됨 (스테이지) |
| `??` | untracked |
| (빈칸) | 깨끗함 |

### `reset` 의 3단계

**`git reset` 은 최대 세 단계를 순서대로 수행합니다.**

```
① 브랜치가 가리키는 커밋을 옮긴다      ← --soft 는 여기까지
② 인덱스를 그 커밋 내용으로 덮어쓴다     ← --mixed(기본) 는 여기까지
③ 작업 디렉터리를 그 내용으로 덮어쓴다   ← --hard 는 여기까지  🚨
```

| 옵션 | ① 브랜치 | ② 인덱스 | ③ 작업 디렉터리 | 위험도 |
|---|---|---|---|---|
| `--soft` | ✅ | — | — | 안전 |
| `--mixed` (기본) | ✅ | ✅ | — | 안전 |
| `--hard` | ✅ | ✅ | ✅ | 🚨 **작업 소실** |

**왜 `--hard` 만 위험한가** — ①②는 **참조와 인덱스**만 바꿉니다. 원래 커밋은 객체로 남아 있고([21강](lesson-21.md)) reflog가 위치를 기억합니다([23강](lesson-23.md)).
③은 **디스크의 파일을 덮어씁니다.** 커밋되지 않은 내용은 Git 어디에도 없으므로 복구가 불가능합니다.

### `reset <경로>` — 완전히 다른 명령

```bash
git reset HEAD~1              # 브랜치를 옮김
git reset HEAD~1 -- f.txt     # 브랜치를 안 옮김!
```

**경로를 지정하면 ①단계를 건너뜁니다.**

```
경로 없음:  ① 브랜치 이동 → ② 인덱스 → (③)
경로 지정:            ② 인덱스의 그 경로만
```

브랜치를 옮기지 않는 이유는 간단합니다. **"커밋 절반만 되돌린 상태"라는 건 존재할 수 없기 때문**입니다. 그래서 경로를 주면 인덱스만 손봅니다.

> 그리고 **`--hard` 는 경로와 함께 쓸 수 없습니다.**
> ```
> fatal: Cannot do hard reset with paths.
> ```
> 파일 하나만 작업 디렉터리까지 되돌리려면 `git restore --source=<커밋> <파일>` 을 씁니다.

**`git reset HEAD <파일>` 이 곧 "add 취소"** 입니다. 인덱스의 그 파일을 HEAD 내용으로 되돌리는 것이니까요. 요즘은 의미가 분명한 `git restore --staged <파일>` 을 권합니다 ([07강](lesson-07.md)).

### `reset` vs `checkout`/`switch` — 무엇을 옮기는가

**이것이 두 명령의 진짜 차이입니다.**

```
git reset <커밋>        →  브랜치를 옮긴다  (HEAD 는 브랜치를 가리키므로 따라옴)
git switch <브랜치>      →  HEAD 를 다른 브랜치로 옮긴다  (브랜치는 그대로)
git switch --detach <커밋> →  HEAD 를 커밋에 직접 붙인다  (브랜치는 그대로)
```

그림으로 보면 명확합니다.

```
처음:      HEAD ──▶ main ──▶ C

git reset --hard B
           HEAD ──▶ main ──▶ B        ← main 이 움직임 (C 를 가리키는 게 없어짐)

git switch --detach B
           HEAD ──────────▶ B         ← main 은 C 에 그대로
                  main ──▶ C
```

| | `reset` | `switch` / `checkout` |
|---|---|---|
| 옮기는 것 | **브랜치** | **HEAD** |
| 이력 | 되감김 (커밋이 떨어져 나감) | 그대로 |
| 커밋 안 한 변경 | `--hard` 면 **삭제** | **막아 줌** (덮어쓸 위험이 있으면 거부) |
| 위험도 | `--hard` 는 높음 | 낮음 |

> [08강](lesson-08.md)에서 브랜치를 옮길 때 `error: Your local changes would be overwritten` 이 떴던 것 기억하시나요.
> **`switch` 는 사용자를 보호합니다.** `reset --hard` 는 묻지 않고 덮어씁니다.

### `restore` — 파일 단위 전용

Git 2.23부터 `checkout` 의 파일 관련 기능이 `restore` 로 분리됐습니다 ([07강](lesson-07.md)).

```bash
git restore <파일>                       # 작업 디렉터리를 인덱스 내용으로
git restore --staged <파일>              # 인덱스를 HEAD 내용으로  (= add 취소)
git restore --staged --worktree <파일>   # 둘 다 (= 완전히 되돌리기)
git restore --source=HEAD~3 <파일>       # 특정 커밋 내용으로 작업 디렉터리를
```

**세 나무로 정리하면**

```
                --source=<커밋> 로 출처 지정 가능
                          │
   HEAD ──▶ 인덱스 ──▶ 작업 디렉터리
        │         │
        │         └── git restore <파일>           (기본: --worktree)
        └── git restore --staged <파일>
```

### `git clean` — 네 번째 영역

세 나무 어디에도 속하지 않는 것이 있습니다. **untracked 파일**입니다.

```bash
git clean -n         # 무엇이 지워질지 미리보기 (반드시 먼저!)
git clean -f         # 파일 삭제
git clean -fd        # 폴더까지
git clean -fdx       # .gitignore 대상까지 🚨
```

> 🚨 **`git clean` 은 되돌릴 수 없습니다.** Git이 추적한 적 없는 파일이라 어디에도 기록이 없습니다.
> **항상 `-n` 으로 먼저 확인**하세요. 특히 `-x` 는 `.env` 와 `venv/` 까지 지웁니다.

---

## ④ 단계별 실습

### Step 0. 실험실 만들기

```bash
cd ~/Desktop
mkdir tree-lab && cd tree-lab
git init
git config user.name "Hong Gildong"
git config user.email "hong@example.com"
git config core.autocrlf false

printf 'v1\n' > f.txt && git add f.txt && git commit -qm "feat: v1"
printf 'v2\n' > f.txt && git add f.txt && git commit -qm "feat: v2"
printf 'v3\n' > f.txt && git add f.txt && git commit -qm "feat: v3"
```

```bash
git log --oneline
cat f.txt
```

실행 결과:

```
965ccbc feat: v3
8fddb1d feat: v2
9b981ae feat: v1
v3
```

**각 버전의 blob 해시를 미리 확인해 둡니다.** 앞으로 인덱스를 볼 때 이 값으로 구분합니다.

```bash
printf 'v1\n' | git hash-object --stdin
printf 'v2\n' | git hash-object --stdin
printf 'v3\n' | git hash-object --stdin
```

실행 결과:

```
626799f0f85326a8c1fc522db584e86cdfccd51f     ← v1
8c1384d825dbbe41309b7dc18ee7991a9085c46e     ← v2
29ef827e8a45b1039d908884aae4490157bcb2b4     ← v3
```

> 🔑 **여러분 화면에도 같은 값이 나옵니다.** blob 해시는 내용만으로 결정됩니다 ([21강](lesson-21.md)).

### Step 1. 세 나무를 동시에 들여다보는 명령

```bash
git ls-tree -r HEAD        # ① HEAD 의 tree
git ls-files -s            # ② 인덱스
cat f.txt                  # ③ 작업 디렉터리
```

실행 결과:

```
100644 blob 29ef827e8a45b1039d908884aae4490157bcb2b4	f.txt
100644 29ef827e8a45b1039d908884aae4490157bcb2b4 0	f.txt
v3
```

**셋 다 v3(`29ef827`)입니다.** `git status` 가 깨끗한 상태의 정의가 이것입니다.

**이 세 줄을 한 번에 보는 함수를 만들어 두면 편합니다.**

```bash
tree3() {
  echo "① HEAD    : $(git ls-tree HEAD -- f.txt | awk '{print substr($3,1,7)}')"
  echo "② 인덱스   : $(git ls-files -s f.txt | awk '{print substr($2,1,7)}')"
  echo "③ 작업파일 : $(cat f.txt)"
  echo "  status  : '$(git status --short)'"
}
```

```bash
tree3
```

실행 결과:

```
① HEAD    : 29ef827
② 인덱스   : 29ef827
③ 작업파일 : v3
  status  : ''
```

### Step 2. `--soft` — 브랜치만 옮긴다

```bash
git reset --soft HEAD~1
tree3
```

실행 결과:

```
① HEAD    : 8c1384d
② 인덱스   : 29ef827
③ 작업파일 : v3
  status  : 'M  f.txt'
```

**HEAD만 v2로 갔습니다.** 인덱스와 작업 디렉터리는 v3 그대로입니다.

```bash
git log --oneline -1
git status
```

실행 결과:

```
8fddb1d feat: v2
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   f.txt
```

> **`M ` (앞칸 M)** — 인덱스가 HEAD와 다릅니다. **"커밋할 준비가 된 상태"** 입니다.
> 그래서 `--soft` 는 **"커밋만 취소하고 바로 다시 커밋"** 할 때 씁니다.
> ```bash
> git commit -m "새 메시지"        # 커밋 합치기·메시지 다시 쓰기
> ```

```bash
git reset --hard ORIG_HEAD -q      # 원복
```

### Step 3. `--mixed` — 인덱스까지

```bash
git reset HEAD~1          # 옵션 없으면 --mixed
tree3
```

실행 결과:

```
Unstaged changes after reset:
M	f.txt
① HEAD    : 8c1384d
② 인덱스   : 8c1384d
③ 작업파일 : v3
  status  : ' M f.txt'
```

**HEAD와 인덱스가 v2로 갔고, 작업 파일만 v3입니다.**

> **` M` (뒤칸 M)** — 인덱스와 작업 디렉터리가 다릅니다. **"add부터 다시 해야 하는 상태"** 입니다.
> `--soft` 와 결과가 미묘하게 다른 것을 확인하세요. 표시 위치가 앞칸에서 뒤칸으로 바뀌었습니다.

```bash
git reset --hard ORIG_HEAD -q
```

### Step 4. `--hard` — 작업 디렉터리까지 🚨

```bash
git reset --hard HEAD~1
tree3
```

실행 결과:

```
HEAD is now at 8fddb1d feat: v2
① HEAD    : 8c1384d
② 인덱스   : 8c1384d
③ 작업파일 : v2
  status  : ''
```

**세 나무가 전부 v2입니다. 파일 내용이 실제로 바뀌었습니다.**

```bash
cat f.txt
```

실행 결과:

```
v2
```

> 🚨 **v3의 내용은 디스크에서 사라졌습니다.**
> 이 경우는 커밋되어 있었으므로 reflog로 복구되지만([23강](lesson-23.md)), **커밋하지 않았던 변경이 있었다면 영영 사라집니다.**

```bash
git reset --hard ORIG_HEAD -q
tree3
```

**세 옵션을 한 표로 정리하면**

| | HEAD | 인덱스 | 작업 파일 | `status --short` |
|---|---|---|---|---|
| `--soft HEAD~1` | v2 | v3 | v3 | `M ` |
| `--mixed HEAD~1` | v2 | v2 | v3 | ` M` |
| `--hard HEAD~1` | v2 | v2 | **v2** | (빈칸) |

### Step 5. `reset <경로>` — 브랜치가 안 움직인다

```bash
git reset HEAD~1 -- f.txt
```

실행 결과:

```
Unstaged changes after reset:
M	f.txt
```

```bash
git log --oneline -1
tree3
```

실행 결과:

```
965ccbc feat: v3
① HEAD    : 29ef827
② 인덱스   : 8c1384d
③ 작업파일 : v3
  status  : 'MM f.txt'
```

> 🔑 **HEAD는 여전히 v3(`965ccbc`)입니다.** 브랜치가 움직이지 않았습니다.
> 인덱스만 v2로 바뀌었고, 그래서 **`MM`** — HEAD↔인덱스도 다르고 인덱스↔작업파일도 다릅니다.

```bash
git restore --staged f.txt     # 인덱스를 HEAD 내용으로 원복
tree3
```

실행 결과:

```
① HEAD    : 29ef827
② 인덱스   : 29ef827
③ 작업파일 : v3
  status  : ''
```

**`--hard` 와 경로는 함께 쓸 수 없습니다.**

```bash
git reset --hard HEAD~1 -- f.txt
```

실행 결과:

```
fatal: Cannot do hard reset with paths.
```

**파일 하나만 과거 내용으로 되돌리려면 `restore` 를 씁니다.**

```bash
git restore --source=HEAD~2 f.txt
cat f.txt
git status --short
```

실행 결과:

```
v1
 M f.txt
```

```bash
git restore f.txt        # 인덱스 내용으로 원복
cat f.txt
```

실행 결과:

```
v3
```

### Step 6. `reset` 과 `switch` — 무엇이 움직이는가

**이 실습이 오늘의 핵심입니다.**

```bash
git log --oneline
git rev-parse --short main
```

실행 결과:

```
965ccbc feat: v3
8fddb1d feat: v2
9b981ae feat: v1
965ccbc
```

**① `switch --detach` — HEAD만 움직인다**

```bash
git switch --detach HEAD~1
echo "HEAD  : $(cut -c1-7 .git/HEAD)"
echo "main  : $(git rev-parse --short main)"
```

실행 결과:

```
HEAD  : 8fddb1d
main  : 965ccbc
```

**HEAD는 v2로 갔지만 `main` 은 여전히 v3입니다.** 아무 커밋도 잃지 않았습니다.

```bash
git switch main
git log --oneline -1
```

실행 결과:

```
965ccbc feat: v3
```

**② `reset` — 브랜치가 움직인다**

```bash
git reset --hard HEAD~1
echo "HEAD  : $(git rev-parse --short HEAD)"
echo "main  : $(git rev-parse --short main)"
git log --oneline
```

실행 결과:

```
HEAD  : 8fddb1d
main  : 8fddb1d
main  : 8fddb1d
8fddb1d feat: v2
9b981ae feat: v1
```

**`main` 자체가 v2로 옮겨졌고, v3 커밋은 이력에서 사라졌습니다.**

```bash
git reset --hard ORIG_HEAD -q
```

**③ 보호 장치의 차이**

```bash
printf 'v3 + 아직 커밋 안 한 소중한 작업\n' > f.txt
git switch --detach HEAD~1
```

실행 결과:

```
error: Your local changes to the following files would be overwritten by checkout:
	f.txt
Please commit your changes or stash them before you switch branches.
Aborting
```

**`switch` 가 막아 줬습니다.** 같은 상황에서 `reset --hard` 는?

```bash
git reset --hard HEAD~1
cat f.txt
```

실행 결과:

```
HEAD is now at 8fddb1d feat: v2
v2
```

> 🚨 **묻지 않고 덮어썼습니다.** "아직 커밋 안 한 소중한 작업"은 사라졌고 복구 방법이 없습니다.
> **`switch` 는 사용자를 보호하고, `reset --hard` 는 보호하지 않습니다.**

```bash
git reset --hard ORIG_HEAD -q
```

### Step 7. `git clean` — 네 번째 영역

```bash
touch junk1.txt junk2.txt
mkdir junkdir && touch junkdir/x.txt
git status --short
```

실행 결과:

```
?? junk1.txt
?? junk2.txt
?? junkdir/
```

**`?? ` 는 세 나무 어디에도 없는 파일**입니다. `reset --hard` 로도 안 지워집니다.

```bash
git reset --hard HEAD -q
ls
```

실행 결과:

```
f.txt  junk1.txt  junk2.txt  junkdir
```

**그대로 있습니다.** 지우려면 `clean` 입니다.

```bash
git clean -nd          # ⭐ 항상 -n 으로 먼저 확인
```

실행 결과:

```
Would remove junk1.txt
Would remove junk2.txt
Would remove junkdir/
```

```bash
git clean -fd
ls
```

실행 결과:

```
f.txt
```

> 🚨 **`git clean -fdx`** 는 `.gitignore` 대상까지 지웁니다. `.env` 와 `venv/` 가 통째로 날아갑니다.
> **반드시 `-n` 으로 먼저 확인**하고, `-x` 는 정말 필요할 때만 쓰세요.
> 대화형으로 고르는 `git clean -i` 도 있습니다.

### Step 8. 상황별 명령 정리표

**세 나무 모델로 보면 모든 명령이 한 표에 들어갑니다.**

| 하고 싶은 일 | 명령 | 건드리는 나무 |
|---|---|---|
| 커밋만 취소, 스테이지 유지 | `git reset --soft HEAD~1` | ① |
| 커밋 + add 취소 | `git reset HEAD~1` | ①② |
| 전부 되돌리기 🚨 | `git reset --hard HEAD~1` | ①②③ |
| **add 취소** (파일 하나) | `git restore --staged <파일>` | ② |
| **수정 취소** (파일 하나) 🚨 | `git restore <파일>` | ③ |
| add·수정 모두 취소 🚨 | `git restore --staged --worktree <파일>` | ②③ |
| 과거 버전 가져오기 | `git restore --source=<커밋> <파일>` | ③ |
| 과거 버전을 스테이지까지 | `git restore --source=<커밋> --staged --worktree <파일>` | ②③ |
| 브랜치 이동 | `git switch <브랜치>` | HEAD |
| 과거 시점 구경 | `git switch --detach <커밋>` | HEAD |
| untracked 파일 삭제 🚨 | `git clean -fd` | (없음) |
| 완전 초기화 🚨🚨 | `git reset --hard && git clean -fd` | ①②③ + untracked |

---

## ⑤ 자주 하는 실수

### `reset --hard` 로 커밋 안 한 작업을 날림

**증상** — 반나절 작업이 사라지고 reflog에도 없습니다.
**원인** — ③단계가 작업 디렉터리를 덮어씁니다. 커밋되지 않은 내용은 Git 어디에도 없습니다.
**해결** — 거의 불가능합니다. 시도해 볼 것은 [23강](lesson-23.md)에 정리했습니다.

**예방 — 실행 전 3초**

```bash
git status              # 커밋 안 된 변경이 있나
git stash -u            # 있으면 보관
git reset --hard <대상>
git stash pop
```

> **습관으로 만들 것** — `--hard` 를 타이핑하기 전에 반드시 `git status` 를 한 번 칩니다.

### `reset <경로>` 를 브랜치 되돌리기로 착각

```bash
git reset HEAD~1 -- src/
git log --oneline -1        # 어? 그대로네?
```

**원인** — 경로를 주면 **브랜치를 옮기지 않습니다.** 인덱스만 손봅니다.
**해결** — 의도에 맞게 고르세요.

```bash
git reset HEAD~1                # 커밋 되돌리기 (경로 없이)
git reset HEAD~1 -- src/        # src/ 의 인덱스만 그 시점으로
```

### `git reset HEAD <파일>` 과 `git restore <파일>` 혼동

```bash
git reset HEAD f.txt        # 인덱스를 HEAD 로 → add 취소 (안전)
git restore f.txt           # 작업 파일을 인덱스로 → 수정 삭제 (🚨)
```

**해결** — 요즘 문법을 쓰면 의미가 분명해집니다.

```bash
git restore --staged f.txt      # add 취소  ✅
git restore f.txt               # 수정 취소 🚨
```

> `--staged` 한 단어 차이로 결과가 정반대입니다 ([07강](lesson-07.md)). `git status` 가 알려 주는 명령을 그대로 복사하는 것이 가장 안전합니다.

### `switch` 가 막는데 `--force` 로 뚫음

```
error: Your local changes would be overwritten by checkout
```

```bash
git switch -f main       # 🚨 변경이 사라집니다
```

**원인** — Git이 보호해 주는 것을 무력화했습니다.
**해결** — 셋 중 하나를 고르세요.

```bash
git commit -am "wip"     # 커밋
git stash -u             # 보관 (16강)
git restore .            # 정말 버릴 거면 (🚨)
```

### `git clean -fdx` 를 무심코 실행

**증상** — `.env` 가 사라지고, `venv/` 를 다시 만들어야 하고, IDE 설정이 초기화됩니다.
**원인** — `-x` 는 `.gitignore` 대상까지 지웁니다.
**해결** — 복구 불가입니다. `.env` 는 백업이나 팀원에게 다시 받아야 합니다.

**예방**

```bash
git clean -nd            # 항상 먼저
git clean -ndx           # -x 를 쓸 거면 특히
git clean -i             # 대화형으로 하나씩 고르기
```

### `reset` 후 push가 거부됨

```
! [rejected] main -> main (non-fast-forward)
```

**원인** — 로컬 브랜치를 되감았는데 원격은 앞서 있습니다.
**해결** — **push 여부에 따라 대응이 완전히 다릅니다** ([17강](lesson-17.md)).

```
아직 push 안 한 커밋만 되감았다  →  git push --force-with-lease (개인 브랜치)
이미 공유된 커밋을 되감았다      →  🚨 되감지 말고 git revert 를 썼어야 함
```

**되돌리기**

```bash
git reset --hard origin/main      # 원격 상태로 복구
```

### 인덱스가 꼬였을 때

```
error: Entry 'f.txt' not uptodate. Cannot merge.
```

또는 `git status` 가 이상하게 느리거나 변경이 없는데도 modified로 뜹니다.

**해결** — 인덱스를 새로 만듭니다.

```bash
git rm --cached -r . -q     # 인덱스 비우기 (⚠️ 작업 파일은 안 지워짐)
git reset                   # HEAD 기준으로 재구성
git status
```

또는 파일 상태 캐시만 갱신합니다.

```bash
git update-index --refresh
```

> 줄바꿈 설정을 바꾼 뒤 전체가 modified로 뜬다면 `git add --renormalize .` 입니다 ([18강](lesson-18.md)).

---

## ⑥ 확인 문제

**1.** 아래 상태에서 각 명령을 실행하면 **세 나무가 어떻게 되는지** 채워 보세요.

```
HEAD 커밋의 f.txt  : "B"
인덱스의 f.txt     : "C"
작업 디렉터리 f.txt : "D"

(HEAD~1 커밋의 f.txt 는 "A")
```

```
ⓐ git reset --soft HEAD~1
ⓑ git reset HEAD~1
ⓒ git reset --hard HEAD~1
ⓓ git restore --staged f.txt
ⓔ git restore f.txt
```

<details>
<summary>답 보기</summary>

| | HEAD | 인덱스 | 작업 디렉터리 | `status --short` |
|---|---|---|---|---|
| 시작 | B | C | D | `MM` |
| ⓐ `--soft HEAD~1` | **A** | C | D | `MM` |
| ⓑ `HEAD~1` (mixed) | **A** | **A** | D | ` M` |
| ⓒ `--hard HEAD~1` | **A** | **A** | **A** | (빈칸) |
| ⓓ `restore --staged` | B | **B** | D | ` M` |
| ⓔ `restore` | B | C | **C** | `M ` |

**읽는 법**

- **ⓐⓑⓒ** — `reset` 은 위에서 아래로 순서대로 적용됩니다. `--soft`는 ①까지, `--mixed`는 ②까지, `--hard`는 ③까지.
- **ⓓ** — `restore --staged` 는 **인덱스를 HEAD 내용으로**. 작업 디렉터리는 안 건드립니다.
- **ⓔ** — `restore` 는 **작업 디렉터리를 인덱스 내용으로**. `--source` 를 안 주면 기준이 인덱스입니다.

**ⓔ가 특히 헷갈립니다.** `git restore f.txt` 를 하면 HEAD가 아니라 **인덱스(C)** 내용이 됩니다. HEAD 내용으로 되돌리려면:

```bash
git restore --source=HEAD f.txt
# 또는
git restore --staged --worktree f.txt
```

**🚨 ⓒ와 ⓔ에서 "D"가 사라집니다.** 커밋되지 않았으므로 복구 불가입니다.
</details>

**2.** `git reset --hard <커밋>` 과 `git switch --detach <커밋>` 은 결과적으로 "그 커밋 상태의 파일"을 보게 해 줍니다. **무엇이 다른가요?**

<details>
<summary>답 보기</summary>

**옮기는 대상이 다릅니다.**

```
시작:      HEAD ──▶ main ──▶ C

git reset --hard B
           HEAD ──▶ main ──▶ B      ← main 이 이동. C 는 이력에서 떨어짐

git switch --detach B
           HEAD ─────────▶ B        ← HEAD 만 이동
                  main ──▶ C          main 은 그대로
```

| | `reset --hard B` | `switch --detach B` |
|---|---|---|
| 옮기는 것 | **브랜치** | **HEAD** |
| `main` 의 위치 | B로 이동 | C 그대로 |
| C 커밋 | 이력에서 떨어짐 (reflog로 복구) | 멀쩡함 |
| 커밋 안 한 변경 | **덮어씀** 🚨 | **막아 줌** |
| 되돌아오기 | `git reset --hard ORIG_HEAD` | `git switch -` |

**언제 무엇을 쓰나**

```
과거 코드를 구경만 하고 싶다        →  switch --detach   (안전)
브랜치를 정말 되감고 싶다           →  reset --hard      (되돌리기 어려움)
과거 버전에서 새 작업을 시작하고 싶다 →  git switch -c fix/x <커밋>
```

**확인 방법**

```bash
git rev-parse --short HEAD main     # 둘이 같으면 브랜치에 붙어 있음
git symbolic-ref HEAD                # 실패하면 detached (22강)
```

**핵심 한 줄**
> **구경할 땐 `switch --detach`, 되감을 땐 `reset`.**
> 잘 모르겠으면 `switch --detach` 를 쓰세요. 아무것도 잃지 않습니다.
</details>

**3.** 저장소를 **완전히 처음 clone한 상태**로 되돌리고 싶습니다. 명령을 순서대로 적고, **각각 어떤 위험이 있는지** 설명하세요.

<details>
<summary>답 보기</summary>

**명령**

```bash
git fetch origin                  # ① 원격 최신 상태 받기
git reset --hard origin/main      # ② 세 나무를 원격 기준으로
git clean -fdx                    # ③ untracked + ignored 전부 삭제
```

**각 단계의 위험**

| 단계 | 사라지는 것 | 복구 |
|---|---|---|
| ② `reset --hard` | **커밋 안 한 모든 변경** | ❌ 불가능 |
| ② `reset --hard` | push 안 한 로컬 커밋 | ✅ reflog (30일) |
| ③ `clean -fdx` | untracked 새 파일 | ❌ 불가능 |
| ③ `clean -fdx` | **`.env`, `venv/`, IDE 설정** | ❌ 불가능 |

**안전한 순서**

```bash
# 0) 무엇이 사라질지 먼저 확인
git status
git stash list
git log --oneline @{u}..           # push 안 한 커밋 (22강)
git clean -ndx                     # 지워질 파일 미리보기 ⭐

# 1) 아까운 것 백업
git stash -u -m "초기화 전 보관"
cp .env ~/backup/.env              # ignored 파일은 stash 로도 안 잡힘

# 2) 실행
git fetch origin
git reset --hard origin/main
git clean -fd                      # -x 는 정말 필요할 때만

# 3) 복원
cp ~/backup/.env .
```

**`-x` 를 뺄 것을 권합니다.** `venv/` 를 지우면 재설치에 몇 분이 걸리고, `.env` 는 다시 만들 수 없을 수도 있습니다.

**차라리 다시 clone하는 것이 나은 경우도 많습니다.**

```bash
cd ..
mv project project-old            # 지우지 말고 이름만 바꿔 두기
git clone <주소> project
```

원본을 남겨 두므로 **되돌릴 수 있습니다.** 확인이 끝난 뒤 `project-old` 를 지우면 됩니다.
</details>

---

## 오늘의 정리

**세 그루의 나무**

```
   HEAD          인덱스          작업 디렉터리
(마지막 커밋)   (.git/index)     (디스크의 파일)
      │             │                 │
      └─ 비교1 ─────┴──── 비교2 ──────┘
       "to be committed"   "not staged"
```

| 나무 | 확인 |
|---|---|
| HEAD | `git ls-tree -r HEAD` |
| 인덱스 | `git ls-files -s` |
| 작업 디렉터리 | `ls` / `cat` |

**`reset` 3단계**

```
① 브랜치 이동   ← --soft
② 인덱스 갱신   ← --mixed (기본)
③ 작업파일 갱신 ← --hard  🚨
```

| 옵션 | ① | ② | ③ |
|---|---|---|---|
| `--soft` | ✅ | | |
| `--mixed` | ✅ | ✅ | |
| `--hard` | ✅ | ✅ | ✅ 🚨 |

**`reset` vs `switch`**

```
reset  →  브랜치를 옮긴다  (이력이 되감김, 보호 없음)
switch →  HEAD 를 옮긴다   (이력 그대로, 덮어쓰기 막아 줌)
```

**`restore` (파일 단위)**

| 명령 | 방향 |
|---|---|
| `git restore --staged <파일>` | HEAD → 인덱스 (**add 취소**) |
| `git restore <파일>` | 인덱스 → 작업파일 (🚨) |
| `git restore --staged --worktree <파일>` | HEAD → 둘 다 |
| `git restore --source=<커밋> <파일>` | 그 커밋 → 작업파일 |

**`reset <경로>`**

```
경로를 주면 ① 브랜치 이동을 건너뛴다  →  인덱스만 바뀜
--hard 와 경로는 함께 못 씀
```

**`git clean`**

```
git clean -n     미리보기 ⭐ 항상 먼저
git clean -fd    untracked 삭제
git clean -fdx   ignored 까지 🚨 (.env, venv/)
git clean -i     대화형
```

**오늘 반드시 기억할 한 가지**
> **`--hard` 와 `clean` 만이 디스크의 파일을 덮어씁니다.** 나머지는 전부 참조와 인덱스만 건드립니다.
> 그래서 이 둘만 복구가 불가능하고, 실행 전 `git status` 와 `git clean -n` 이 필요합니다.

**과제**
1. 실험실을 만들어 `--soft` / `--mixed` / `--hard` 를 각각 실행하고, **매번 세 나무의 상태와 `git status --short`** 를 기록해 비교하세요.
2. `git reset HEAD~1 -- f.txt` 후 `git log --oneline -1` 로 **HEAD가 안 움직인 것**을 확인하세요.
3. 커밋하지 않은 변경을 만든 뒤 `git switch --detach HEAD~1` 이 **거부되는 것**과, 같은 상황에서 `git reset --hard` 가 **묻지 않고 덮어쓰는 것**을 비교하세요.
4. `git restore --source=HEAD~2 <파일>` 로 과거 버전을 가져와 보세요.
5. untracked 파일을 만들고 `git reset --hard` 로는 안 지워지는 것을 확인한 뒤, `git clean -nd` → `-fd` 로 지우세요.

---

[← 이전 23강](lesson-23.md) · [목차](README.md) · [다음 → 25강 범인 찾기](lesson-25.md)
