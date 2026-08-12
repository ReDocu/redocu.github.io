# 23강 · reflog — 잃어버린 커밋 되살리기

> **Git 학습 매뉴얼** · 🔴 고급 · **23강 / 30**
> [← 이전 22강](lesson-22.md) · [목차](README.md) · [다음 → 24강 세 그루의 나무](lesson-24.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `git reflog` 를 읽고 HEAD가 어떻게 움직였는지 추적할 수 있다.
- `reset --hard`, 잘못된 rebase, 브랜치 삭제, `--amend` 사고를 각각 복구할 수 있다.
- **도달 가능성(reachability)** 개념으로 "왜 커밋이 살아 있는가"를 설명할 수 있다.
- reflog가 없을 때 `git fsck` 로 고아 객체를 찾아낼 수 있다.
- **reflog로도 복구되지 않는 것**이 무엇인지 안다.

---

## ② 왜 필요한가

지금까지 여러 번 이렇게 말했습니다.

> **"커밋한 것은 거의 잃어버리지 않습니다."** ([01강](lesson-01.md), [07강](lesson-07.md), [10강](lesson-10.md))

오늘 그 근거를 배웁니다. 근거는 두 가지입니다.

1. **객체는 불변입니다** ([21강](lesson-21.md)) — `reset` 은 객체를 지우지 않고 **참조만 옮깁니다**
2. **reflog가 옛 위치를 기억합니다** — 참조가 어디에 있었는지 전부 기록됩니다

```
git reset --hard HEAD~3

이력:    A ── B ── C ── D
                 ▲       ▲
              main     사라진 것처럼 보이는 커밋들
                        (객체는 그대로 살아 있음)

reflog:  "main 은 조금 전까지 D 였다"  ← 이 기록만 있으면 되돌릴 수 있음
```

**실무에서 이 강의 내용을 쓰게 되는 순간**

| 사고 | 빈도 |
|---|---|
| `git reset --hard` 를 잘못된 대상에 실행 | 매우 흔함 |
| rebase 도중 `--skip` 을 눌러 커밋을 날림 | 흔함 |
| 브랜치를 `-D` 로 지웠는데 필요했음 | 흔함 |
| `--amend` 로 원래 커밋 내용을 덮어씀 | 흔함 |
| `git checkout` / `switch` 로 detached에서 나옴 | 흔함 |
| 팀원이 `--force` push로 커밋을 날림 | 가끔 ([17강](lesson-17.md)) |

**전부 reflog로 복구됩니다.** 단, 조건이 있습니다. 그 조건도 오늘 배웁니다.

---

## ③ 개념 설명

### reflog란

**참조(ref)가 움직인 기록(log)** 입니다. `.git/logs/` 에 텍스트로 쌓입니다.

```
.git/logs/
├── HEAD                     ⭐ HEAD 가 움직인 모든 기록
└── refs/
    └── heads/
        ├── main             main 브랜치가 움직인 기록
        └── feature          feature 브랜치가 움직인 기록
```

**`git log` 와는 완전히 다릅니다.**

| | `git log` | `git reflog` |
|---|---|---|
| 보여 주는 것 | **커밋의 부모 사슬** | **참조가 이동한 순서** |
| 순서 | 이력 구조상의 순서 | **시간 순** |
| 사라진 커밋 | 안 보임 | **보임** |
| 공유되나 | ✅ push·clone으로 전달 | ❌ **내 컴퓨터에만** |
| 보존 기간 | 영구 | 기본 90일 |

> 🔑 **reflog는 로컬 전용입니다.** push해도 안 올라가고, clone해도 안 따라옵니다.
> 그래서 **clone 직후의 저장소에는 reflog가 거의 없습니다.**

### reflog 읽는 법

```
0052d15 HEAD@{0}: merge feature: Merge made by the 'ort' strategy.
58511c1 HEAD@{1}: checkout: moving from feature to main
3c5253c HEAD@{2}: commit: feat: 기능 작업
   │        │        │
   │        │        └── 어떤 명령으로 움직였는가
   │        └── 몇 번째 전인가 (0 = 가장 최근)
   └── 그 시점에 HEAD 가 가리키던 커밋
```

**`HEAD@{n}` 은 "n번 전의 위치"** 입니다. `HEAD~n`(n세대 조상)과 전혀 다릅니다.

| 표기 | 뜻 |
|---|---|
| `HEAD~2` | **이력상** 2세대 위 조상 |
| `HEAD@{2}` | **시간상** 2번 전에 HEAD가 있던 곳 |

**동작 종류**

| 표시 | 무슨 일 |
|---|---|
| `commit` | 커밋 생성 |
| `commit (initial)` | 첫 커밋 |
| `commit (amend)` | `--amend` |
| `checkout: moving from A to B` | 브랜치 이동 |
| `reset: moving to X` | reset |
| `merge <브랜치>` | 병합 |
| `rebase (start)` / `(pick)` / `(finish)` | rebase 각 단계 |
| `pull` / `clone` | 원격 작업 |

### 도달 가능성 (reachability)

**Git이 객체를 지울지 말지 판단하는 기준**입니다.

```
어떤 참조(브랜치·태그·HEAD·reflog·stash)에서
부모를 따라 내려가다 만날 수 있으면  →  도달 가능 (안 지움)
아무 데서도 만날 수 없으면          →  도달 불가 (gc 대상)
```

```
      main
        ▼
   A ── B ── C
        │
        └──▶ D  (브랜치 삭제됨)
             ▲
          reflog 에 기록이 남아 있으면 → 여전히 도달 가능!
```

> **reflog가 커밋을 "붙잡고" 있는 것**입니다. 그래서 reflog가 만료되기 전까지는 복구가 가능합니다.

### 만료 정책

reflog 항목은 영원히 남지 않습니다.

| 설정 | 기본값 | 대상 |
|---|---|---|
| `gc.reflogExpire` | **90일** | 도달 가능한 커밋의 reflog 항목 |
| `gc.reflogExpireUnreachable` | **30일** | **도달 불가** 커밋의 reflog 항목 |

```bash
git config --global gc.reflogExpire "180 days"
git config --global gc.reflogExpireUnreachable "90 days"
```

> **"reset --hard 로 날린 커밋은 30일 안에 복구하라"** 가 실무 기준입니다.
> 그 뒤에는 `git gc` 가 돌면서 객체까지 삭제될 수 있습니다.

### reflog로도 복구되지 않는 것

**이것이 오늘의 가장 중요한 경계선입니다.**

| 대상 | 복구 가능? |
|---|---|
| 커밋한 것 | ✅ reflog |
| `git add` 만 하고 커밋 안 한 것 | ⚠️ `fsck` 로 blob은 찾을 수 있음 (파일명은 모름) |
| **`git add` 도 안 한 작업 디렉터리 변경** | ❌ **불가능** |
| `git restore <파일>` 로 날린 수정 | ❌ **불가능** |
| `git stash clear` 후의 stash | ⚠️ `fsck` 로 가능성 있음 |
| 다른 사람이 force push로 날린 커밋 | ✅ 그 사람 로컬 reflog에 있음 |

> 🚨 **커밋하지 않은 변경은 Git 어디에도 없습니다.**
> [07강](lesson-07.md)에서 강조한 **"작게, 자주 커밋"** 이 유일한 대비책입니다.

---

## ④ 단계별 실습

### Step 0. 실험실 만들기

```bash
cd ~/Desktop
mkdir reflog-lab && cd reflog-lab
git init
git config user.name "Hong Gildong"
git config user.email "hong@example.com"
git config core.autocrlf false
```

커밋 몇 개와 브랜치 하나를 만듭니다.

```bash
for i in 1 2 3; do
  printf "line $i\n" >> f.txt
  git add f.txt
  git commit -qm "feat: 작업 $i"
done

git switch -qc feature
printf "feature work\n" > g.txt
git add g.txt
git commit -qm "feat: 기능 작업"

git switch -q main
git merge --no-ff feature -m "Merge branch 'feature'"
```

```bash
git log --oneline --graph
```

실행 결과:

```
*   0052d15 Merge branch 'feature'
|\
| * 3c5253c (feature) feat: 기능 작업
|/
* 58511c1 feat: 작업 3
* ad43525 feat: 작업 2
* ddb3556 feat: 작업 1
```

### Step 1. reflog 읽기

```bash
git reflog
```

실행 결과:

```
0052d15 HEAD@{0}: merge feature: Merge made by the 'ort' strategy.
58511c1 HEAD@{1}: checkout: moving from feature to main
3c5253c HEAD@{2}: commit: feat: 기능 작업
58511c1 HEAD@{3}: checkout: moving from main to feature
58511c1 HEAD@{4}: commit: feat: 작업 3
ad43525 HEAD@{5}: commit: feat: 작업 2
ddb3556 HEAD@{6}: commit (initial): feat: 작업 1
```

**`git log` 와 비교해 보세요.**

| | 항목 수 | 내용 |
|---|---|---|
| `git log` | 5개 | 커밋만 |
| `git reflog` | 7개 | 커밋 + **브랜치 이동 2번** |

**reflog는 "내가 무엇을 했는가"의 일지**입니다. 커밋이 아닌 동작도 전부 기록됩니다.

**브랜치별 reflog**

```bash
git reflog show main
```

실행 결과:

```
0052d15 main@{0}: merge feature: Merge made by the 'ort' strategy.
58511c1 main@{1}: commit: feat: 작업 3
ad43525 main@{2}: commit: feat: 작업 2
ddb3556 main@{3}: commit (initial): feat: 작업 1
```

> **`main` 브랜치가 움직인 기록만** 나옵니다. `feature` 에서 한 커밋은 없습니다. HEAD reflog와 다른 점입니다.

**시각과 함께 보기**

```bash
git reflog --date=iso -3
```

실행 결과:

```
0052d15 HEAD@{2026-08-10 16:33:37 +0900}: merge feature: Merge made by the 'ort' strategy.
ddb3556 HEAD@{2026-08-10 16:33:37 +0900}: reset: moving to HEAD~3
0052d15 HEAD@{2026-08-10 16:33:22 +0900}: merge feature: Merge made by the 'ort' strategy.
```

**시간 기준 표기도 됩니다.**

```bash
git show "main@{1.hour.ago}"
git log "HEAD@{yesterday}"
git diff "main@{2.days.ago}" main
```

### Step 2. 원본 파일 확인

reflog는 그냥 텍스트 파일입니다.

```bash
cat .git/logs/HEAD
```

실행 결과 (일부):

```
0000000000000000000000000000000000000000 ddb3556e7476ff2a8c99efdf7abb352601aaaa42 Hong Gildong <hong@example.com> 1786347202 +0900	commit (initial): feat: 작업 1
ddb3556e7476ff2a8c99efdf7abb352601aaaa42 ad43525fa090bf7982e9934ec435bccd34b4727a Hong Gildong <hong@example.com> 1786347202 +0900	commit: feat: 작업 2
ad43525fa090bf7982e9934ec435bccd34b4727a 58511c1261090ec56bbe9d053051d4d627c0fdce Hong Gildong <hong@example.com> 1786347202 +0900	commit: feat: 작업 3
```

**각 줄의 구조**

```
<이전 해시> <이후 해시> <누가> <언제> \t <무슨 동작>
```

> **첫 줄의 `0000000...`** 은 "이전 상태가 없음"(첫 커밋)을 뜻합니다.
> 위에서 아래로 시간 순이고, `git reflog` 는 이걸 **뒤집어서** 보여 줍니다.

### Step 3. `reset --hard` 사고 복구

**가장 흔한 사고입니다.**

```bash
git reset --hard HEAD~3
git log --oneline
```

실행 결과:

```
ddb3556 feat: 작업 1
```

**커밋 4개가 사라진 것처럼 보입니다.**

```bash
git reflog -6
```

실행 결과:

```
ddb3556 HEAD@{0}: reset: moving to HEAD~3
0052d15 HEAD@{1}: merge feature: Merge made by the 'ort' strategy.
58511c1 HEAD@{2}: checkout: moving from feature to main
3c5253c HEAD@{3}: commit: feat: 기능 작업
58511c1 HEAD@{4}: checkout: moving from main to feature
58511c1 HEAD@{5}: commit: feat: 작업 3
```

**`HEAD@{1}` 이 reset 직전 위치입니다.**

```bash
git reset --hard HEAD@{1}
git log --oneline | head -3
```

실행 결과:

```
0052d15 Merge branch 'feature'
58511c1 feat: 작업 3
3c5253c feat: 기능 작업
```

**완전히 돌아왔습니다.**

> **더 간단한 방법** — [22강](lesson-22.md)에서 배운 `ORIG_HEAD` 도 됩니다.
> ```bash
> git reset --hard ORIG_HEAD
> ```
> 다만 `ORIG_HEAD` 는 **직전 것 하나**만 남습니다. 여러 번 실수했다면 reflog를 쓰세요.

**⚠️ 되돌리기 전에 확인할 것**

```bash
git status          # 커밋 안 한 변경이 있는지
git stash -u        # 있으면 먼저 보관 (reset --hard 는 그걸 날립니다)
```

### Step 4. rebase 사고 복구

rebase 중 실수로 커밋을 버린 상황을 만듭니다.

```bash
git switch -qc rebase-test HEAD~2
printf "중요한 작업\n" > important.txt
git add important.txt
git commit -qm "feat: 아주 중요한 기능"
printf "추가\n" >> important.txt
git commit -qam "feat: 중요한 기능 보완"
git log --oneline -2
```

이제 rebase를 하다가 `--skip` 으로 커밋을 버립니다.

```bash
git rebase -i main
```

목록에서 **커밋 하나의 줄을 지우고** 저장합니다. (= `drop`)

```bash
git log --oneline -2
```

**커밋 하나가 사라졌습니다.**

```bash
git reflog -8
```

실행 결과 (예):

```
7a2c9e1 HEAD@{0}: rebase (finish): returning to refs/heads/rebase-test
7a2c9e1 HEAD@{1}: rebase (pick): feat: 중요한 기능 보완
0052d15 HEAD@{2}: rebase (start): checkout main
4f8d2b3 HEAD@{3}: commit: feat: 중요한 기능 보완
9c1e5a7 HEAD@{4}: commit: feat: 아주 중요한 기능
```

> **`rebase (start)` 바로 위(`HEAD@{3}`)가 rebase 직전 상태**입니다.
> reflog에서 `rebase (start)` 를 찾으면 됩니다.

```bash
git reset --hard HEAD@{3}
git log --oneline -2
```

**두 커밋이 돌아왔습니다.**

```bash
git switch -q main
git branch -D rebase-test
```

### Step 5. 삭제한 브랜치 복구

```bash
git switch -qc to-delete
printf "삭제될 브랜치의 작업\n" > deleted.txt
git add deleted.txt
git commit -qm "feat: 지워질 브랜치의 커밋"
git switch -q main
git branch -D to-delete
```

실행 결과:

```
Deleted branch to-delete (was 8f3a2c1).
```

> 🔑 **삭제 메시지에 해시가 들어 있습니다.** 이것만 적어 두면 바로 복구됩니다.

```bash
git branch to-delete 8f3a2c1
git log --oneline to-delete -1
```

**해시를 놓쳤다면** HEAD reflog에서 찾습니다.

```bash
git reflog | grep "to-delete"
```

실행 결과:

```
8f3a2c1 HEAD@{2}: commit: feat: 지워질 브랜치의 커밋
0052d15 HEAD@{3}: checkout: moving from main to to-delete
```

```bash
git branch to-delete HEAD@{2}
```

> ⚠️ **브랜치를 삭제하면 그 브랜치의 reflog(`.git/logs/refs/heads/to-delete`)도 함께 삭제됩니다.**
> ```bash
> git reflog show to-delete
> fatal: ambiguous argument 'to-delete': unknown revision
> ```
> 그래서 **HEAD reflog** 를 봐야 합니다. HEAD reflog는 모든 브랜치의 이동을 통합해 기록합니다.

```bash
git branch -D to-delete
```

### Step 6. `--amend` 되돌리기

`--amend` 는 원래 커밋을 새 커밋으로 갈아치웁니다 ([07강](lesson-07.md)). 원본은 어떻게 될까요.

```bash
git switch -qc amend-test
printf "원래 내용\n" > amend.txt
git add amend.txt
git commit -qm "feat: 원래 커밋"
git rev-parse --short HEAD
```

```bash
printf "덮어쓴 내용\n" > amend.txt
git add amend.txt
git commit -q --amend -m "feat: 덮어쓴 커밋"
git log --oneline -1
cat amend.txt
```

**원래 내용이 사라졌습니다. reflog를 봅니다.**

```bash
git reflog -3
```

실행 결과 (예):

```
b4e8f21 HEAD@{0}: commit (amend): feat: 덮어쓴 커밋
2c9a5f3 HEAD@{1}: commit: feat: 원래 커밋
0052d15 HEAD@{2}: checkout: moving from main to amend-test
```

**`HEAD@{1}` 이 amend 전의 원본입니다.**

```bash
git show HEAD@{1}:amend.txt
```

실행 결과:

```
원래 내용
```

**되살립니다.**

```bash
git reset --hard HEAD@{1}
cat amend.txt
```

```bash
git switch -q main
git branch -D amend-test
```

### Step 7. reflog가 없을 때 — `git fsck`

reflog가 만료되거나 지워졌다면 마지막 수단이 있습니다.

**고아 커밋을 일부러 만들어 봅니다.**

```bash
git switch -qc orphan
printf "orphan work\n" > orphan.txt
git add orphan.txt
git commit -qm "feat: 고아가 될 커밋"
git rev-parse --short HEAD
git switch -q main
git branch -D orphan
```

**reflog를 강제로 만료시킵니다.**

```bash
git reflog expire --expire=now --expire-unreachable=now --all
git reflog
```

실행 결과:

```
(비어 있음)
```

**이제 reflog로는 찾을 수 없습니다. `fsck` 를 씁니다.**

```bash
git fsck --unreachable
```

실행 결과:

```
unreachable tree 7290317b8399ff8371836fa075913c12c461b15b
unreachable commit 52f52f402ad0bf246ae480f826af7f7d5c3b63e9
unreachable blob f90fbc44df612850060143707ad319eee50208f3
```

**커밋 객체가 아직 살아 있습니다.**

```bash
git fsck --lost-found
```

실행 결과:

```
dangling commit 52f52f402ad0bf246ae480f826af7f7d5c3b63e9
```

`.git/lost-found/` 폴더에도 파일로 정리해 줍니다.

```bash
ls .git/lost-found/commit/
```

**내용을 확인하고 되살립니다.**

```bash
git show --stat 52f52f4
git branch rescued 52f52f4
git log --oneline rescued -1
```

실행 결과:

```
52f52f4 feat: 고아가 될 커밋
```

**커밋이 여러 개라면 한 번에 훑어보는 방법**

```bash
git fsck --unreachable | grep commit | cut -d' ' -f3 | xargs -n1 git log -1 --format='%h %ci %s'
```

> **`fsck` 는 마지막 수단입니다.** 출력이 수백 줄일 수 있고, 어느 것이 필요한 커밋인지 직접 판단해야 합니다.
> **reflog가 있을 때 복구하는 것이 훨씬 쉽습니다.**

```bash
git branch -D rescued
```

### Step 8. 만료 정책 확인과 조정

```bash
git config gc.reflogExpire
git config gc.reflogExpireUnreachable
```

아무것도 안 나오면 기본값(90일 / 30일)입니다.

**보관 기간을 늘리려면**

```bash
git config --global gc.reflogExpire "180 days"
git config --global gc.reflogExpireUnreachable "90 days"
```

**⚠️ 반대로 즉시 정리하는 명령** — 무엇을 하는지 알고 쓰세요.

```bash
git reflog expire --expire=now --all
git gc --prune=now
```

> 🚨 **이 두 줄은 복구 수단을 없앱니다.** 실행하면 그동안의 안전망이 사라집니다.
> **딱 한 가지 정당한 용도**가 있습니다 — [29강](lesson-29.md)에서 이력 재작성 후 **유출된 비밀키를 확실히 지울 때**입니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| reflog 보기 | **Git Graph** 확장에서 일부 표시 (지원이 약함) |
| 커밋 되살리기 | Git Graph → 해시 검색 → 우클릭 → Create Branch |
| VS Code 로컬 히스토리 | `Ctrl+Shift+P` → `Local History: Find Entry to Restore` |

> **VS Code 로컬 히스토리는 Git과 무관한 기능**입니다. 파일 저장 시점마다 사본을 남기므로
> **커밋하지 않아 reflog로도 복구 못 하는 변경**을 살릴 수 있는 유일한 수단이 되기도 합니다. 기억해 두세요.

---

## ⑤ 자주 하는 실수

### `HEAD@{2}` 와 `HEAD~2` 를 혼동

```bash
git reset --hard HEAD~2      # 2세대 조상으로 (또 되돌아감!)
git reset --hard HEAD@{2}    # 2번 전 위치로
```

**원인** — 표기가 비슷합니다.
**해결** — 규칙을 외우세요.

```
~  →  이력 구조 (조상)
@{} →  시간 (내가 있었던 곳)
```

**복구할 때는 항상 `@{}`** 입니다. reflog 출력에 적힌 표기를 그대로 복사하세요.

### 복구하려다 `--hard` 로 작업까지 날림

```bash
git reset --hard HEAD@{1}    # 커밋 안 한 변경이 함께 사라짐
```

**원인** — `--hard` 는 작업 디렉터리까지 덮어씁니다 ([24강](lesson-24.md)).
**해결** — 복구 전에 항상 확인하세요.

```bash
git status
git stash -u -m "복구 전 임시 보관"
git reset --hard HEAD@{1}
git stash pop
```

**더 안전한 방법 — 브랜치로 먼저 확인**

```bash
git branch check HEAD@{1}      # 되돌리지 않고 표시만
git log --oneline check         # 내용 확인
git reset --hard check          # 맞으면 이동
git branch -D check
```

### 브랜치를 지운 뒤 그 브랜치 reflog를 찾음

```bash
git reflog show deleted-branch
```

```
fatal: ambiguous argument 'deleted-branch': unknown revision
```

**원인** — 브랜치를 지우면 `.git/logs/refs/heads/<이름>` 도 함께 삭제됩니다.
**해결** — **HEAD reflog** 를 보세요. 모든 브랜치의 이동이 통합되어 있습니다.

```bash
git reflog | grep "deleted-branch"
git reflog --all | grep "커밋 메시지 일부"
```

**가장 쉬운 방법** — 삭제 시 출력된 메시지를 읽으세요.

```
Deleted branch to-delete (was 8f3a2c1).
                              └── 이 해시
```

### clone한 저장소에서 reflog를 찾음

```bash
git clone <주소>
cd repo
git reflog
```

```
abc1234 HEAD@{0}: clone: from https://github.com/...
```

**항목이 하나뿐입니다.**

**원인** — **reflog는 로컬 전용**입니다. push·clone으로 전달되지 않습니다.
**해결** — 그 저장소에서 작업한 **사람의 로컬**을 확인해야 합니다.

> 팀원이 force push로 커밋을 날렸다면, **그 팀원의 컴퓨터**에서 reflog를 봐야 합니다 ([17강](lesson-17.md)).
> GitHub이라면 Settings → Activity 나 이벤트 API에서도 force push 전 해시를 찾을 수 있습니다.

### 커밋 안 한 변경을 reflog로 찾으려 함

```bash
git restore app.py     # 반나절 작업이 사라짐
git reflog             # 여기엔 없습니다
```

**원인** — reflog는 **참조의 이동**만 기록합니다. 커밋되지 않은 것은 애초에 참조가 없습니다.
**해결** — 시도해 볼 수 있는 것들:

| 방법 | 조건 |
|---|---|
| `git add` 는 했다면 → `git fsck --lost-found` | blob은 남아 있음 (**파일명은 모름**) |
| **VS Code 로컬 히스토리** | 그 파일을 VS Code로 저장했었다면 |
| 에디터 `Ctrl+Z` | 아직 안 껐다면 |
| OS 파일 히스토리 / 백업 | 설정되어 있다면 |

`git add` 만 했던 경우 blob 찾기:

```bash
git fsck --lost-found
ls .git/lost-found/other/          # blob 들이 파일로 저장됨
```

**예방이 유일한 답입니다.** 위험한 명령 전에는 커밋하거나 `git stash` 하세요.

### `git gc --prune=now` 를 습관적으로 실행

**증상** — 복구하려는데 객체가 이미 사라졌습니다.
**원인** — 인터넷에서 "저장소 용량 줄이는 법"으로 자주 소개되는 명령입니다.
**해결** — **일상적으로 쓰지 마세요.** Git은 알아서 gc를 돌립니다.

```bash
git gc                    # 안전 (기본 만료 정책 존중)
git gc --prune=now        # ⚠️ 도달 불가 객체 즉시 삭제
```

### reflog에 항목이 너무 많아 못 찾음

**해결** — 걸러서 보세요.

```bash
git reflog | grep "commit:"                  # 커밋만
git reflog | grep "rebase (start)"           # rebase 직전 찾기
git reflog --date=iso | grep "2026-08-10"    # 날짜로
git reflog -20                               # 최근 20개만
git reflog --all                             # 모든 참조의 reflog
```

**커밋 메시지로 찾는 것이 가장 빠릅니다.**

```bash
git reflog --all | grep "로그인"
```

---

## ⑥ 확인 문제

**1.** `git reset --hard HEAD~5` 를 실수로 실행했습니다. 아래 reflog를 보고 **복구 명령**을 적어 보세요. 그리고 **실행 전에 확인할 것**은?

```
a1b2c3d HEAD@{0}: reset: moving to HEAD~5
9f8e7d6 HEAD@{1}: commit: feat: 결제 기능 완성
5c4b3a2 HEAD@{2}: commit: feat: 결제 검증 추가
```

<details>
<summary>답 보기</summary>

**복구 명령**

```bash
git reset --hard HEAD@{1}
```

`HEAD@{1}` 이 reset **직전** 위치(`9f8e7d6`)입니다. 해시를 직접 써도 됩니다.

```bash
git reset --hard 9f8e7d6
```

**실행 전에 반드시 확인할 것**

```bash
git status
```

**커밋하지 않은 변경이 있으면 `--hard` 가 그것까지 날립니다.** reflog로도 복구되지 않습니다.

```bash
git stash -u -m "복구 전 보관"     # 있으면 먼저 치워 두기
git reset --hard HEAD@{1}
git stash pop
```

**더 안전한 순서 — 확인 후 이동**

```bash
git log --oneline HEAD@{1} -5      # 되돌아갈 곳이 맞는지 먼저 확인
git branch check HEAD@{1}           # 브랜치로 표시만 해 두고
git log --oneline check             # 내용 확인
git reset --hard check              # 확실하면 이동
git branch -D check
```

**`ORIG_HEAD` 로도 됩니다** ([22강](lesson-22.md)).

```bash
git reset --hard ORIG_HEAD
```

다만 `ORIG_HEAD` 는 직전 것 하나만 남으므로, 그사이 다른 `reset`·`merge`·`pull` 을 했다면 값이 바뀌었을 수 있습니다.
</details>

**2.** `git reflog` 가 비어 있는데 3일 전 커밋을 되살려야 합니다. 어떤 방법이 있을까요?

<details>
<summary>답 보기</summary>

**① `git fsck` 로 고아 객체 찾기**

```bash
git fsck --unreachable
git fsck --lost-found
```

```
dangling commit 52f52f402ad0bf246ae480f826af7f7d5c3b63e9
```

내용을 확인하고 되살립니다.

```bash
git show --stat 52f52f4
git branch rescued 52f52f4
```

커밋이 여러 개라 어느 것인지 모르겠다면:

```bash
git fsck --unreachable | grep commit | cut -d' ' -f3 \
  | xargs -n1 git log -1 --format='%h %ci %s'
```

날짜와 메시지로 골라낼 수 있습니다.

**② 원격 저장소 확인**

push한 적이 있다면 서버에 남아 있습니다.

```bash
git fetch origin
git log --oneline origin/main
git ls-remote origin
```

GitHub이라면 웹에서 브랜치·PR·Actions 로그에서도 해시를 찾을 수 있습니다.

**③ 팀원의 로컬**

reflog는 로컬 전용이지만, **다른 사람은 그 커밋을 갖고 있을 수 있습니다.**

```bash
# 팀원 컴퓨터에서
git reflog --all | grep "커밋 메시지"
```

**④ 다른 clone / 백업**

같은 저장소를 두 번 clone했거나, `git worktree`([28강](lesson-28.md))를 쓰고 있다면 그쪽에 남아 있을 수 있습니다.

**⚠️ 시간이 중요합니다**

`gc` 가 돌면 도달 불가 객체는 **30일 후 삭제**됩니다(`gc.reflogExpireUnreachable`). 그 전에 찾아야 합니다.
알아차린 즉시 **`git gc` 를 실행하지 마세요.** 오히려 지워질 수 있습니다.
</details>

**3.** 후배가 묻습니다. **"reflog가 있으면 뭘 해도 복구되는 거죠?"** 정확히 답해 주세요.

<details>
<summary>답 보기</summary>

**아닙니다. 세 가지 조건이 있습니다.**

**조건 ① 커밋된 것이어야 합니다**

| 대상 | 복구 |
|---|---|
| 커밋한 것 | ✅ reflog |
| `git add` 만 한 것 | ⚠️ blob은 `fsck` 로 찾을 수 있지만 **파일명·구조는 모름** |
| **아무것도 안 한 작업 디렉터리 변경** | ❌ **불가능** |

```bash
git restore app.py       # 반나절 작업 → 복구 불가
git reset --hard         # 커밋 안 한 변경 → 복구 불가
git clean -fd            # untracked 파일 삭제 → 복구 불가
```

**Git이 모르는 것은 Git이 되살릴 수 없습니다.**

**조건 ② 내 컴퓨터여야 합니다**

reflog는 **로컬 전용**입니다. push·clone으로 전달되지 않습니다.

```bash
git clone <주소>
git reflog        # 항목 1개 (clone) 뿐
```

팀원이 날린 커밋은 **그 팀원의 컴퓨터**에서 찾아야 합니다.

**조건 ③ 만료 전이어야 합니다**

| 설정 | 기본 |
|---|---|
| `gc.reflogExpire` | 90일 |
| `gc.reflogExpireUnreachable` | **30일** |

`reset --hard` 로 날린 커밋은 **30일 안에** 찾아야 합니다. 그 뒤에는 `gc` 가 객체까지 지울 수 있습니다.

그리고 이 명령을 실행하면 **즉시** 사라집니다.

```bash
git reflog expire --expire=now --all
git gc --prune=now
```

**정확한 한 문장**

> **커밋한 것은 30~90일간, 내 컴퓨터에서만 복구할 수 있습니다.**

**그래서 진짜 대비책은**

| 대비 | 효과 |
|---|---|
| **작게 자주 커밋** | reflog의 사정권에 들어옴 |
| **자주 push** | 원격에도 사본이 생김 |
| 위험한 명령 전 `git stash -u` | 커밋 안 한 것도 보호 |
| rebase 전 `git branch backup-...` | 명시적 안전망 ([18강](lesson-18.md)) |
| VS Code 로컬 히스토리 활성화 | Git 밖의 마지막 안전망 |
</details>

---

## 오늘의 정리

**reflog란**

```
참조(HEAD·브랜치)가 움직인 기록.  .git/logs/ 에 텍스트로 저장.

git log     →  커밋의 부모 사슬 (구조)
git reflog  →  내가 있었던 위치들 (시간)  ← 사라진 커밋도 보임
```

**명령**

| 명령 | 하는 일 |
|---|---|
| **`git reflog`** | HEAD 이동 기록 |
| `git reflog show <브랜치>` | 그 브랜치의 기록 |
| `git reflog --all` | 모든 참조 |
| `git reflog --date=iso` | 시각 표시 |
| **`git reset --hard HEAD@{n}`** | **n번 전 위치로 복구** |
| `git branch <이름> HEAD@{n}` | 되돌리지 않고 브랜치로 표시 |
| `git show HEAD@{1}:<파일>` | 그 시점의 파일 내용 |
| **`git fsck --lost-found`** | 도달 불가 객체 찾기 (마지막 수단) |
| `git fsck --unreachable` | 고아 객체 목록 |
| `git reflog expire --expire=now --all` | 🚨 reflog 삭제 |

**표기 구분**

```
HEAD~2   →  이력상 2세대 조상
HEAD@{2} →  시간상 2번 전 내 위치     ← 복구에는 이것
```

**사고별 복구**

| 사고 | 복구 |
|---|---|
| `reset --hard` | `git reset --hard HEAD@{1}` 또는 `ORIG_HEAD` |
| rebase 실패 | reflog에서 `rebase (start)` 바로 위 |
| 브랜치 삭제 | 삭제 메시지의 해시, 또는 HEAD reflog |
| `--amend` | `HEAD@{1}` 이 원본 |
| detached에서 나옴 | 경고에 표시된 해시 ([22강](lesson-22.md)) |
| reflog 없음 | `git fsck --lost-found` |

**만료 정책**

```
gc.reflogExpire             90일  (도달 가능)
gc.reflogExpireUnreachable  30일  (도달 불가)  ← 실질적 시한
```

**복구되지 않는 것**

```
❌ 커밋하지 않은 작업 디렉터리 변경
❌ git restore 로 날린 수정
❌ 다른 사람 컴퓨터의 reflog (로컬 전용)
```

**오늘 반드시 기억할 한 가지**
> **커밋한 것은 30일간, 내 컴퓨터에서만 복구됩니다.**
> 그러니 위험한 명령 전에는 **커밋하거나 `git stash -u`**, 그리고 **자주 push** 하세요.

**과제**
1. 실험실 저장소에서 `git reset --hard HEAD~3` 후 reflog로 복구하세요.
2. `git reflog` 와 `git log` 의 항목 수를 비교하고, **왜 다른지** 설명해 보세요.
3. `cat .git/logs/HEAD` 로 원본 파일 구조를 확인하세요.
4. 브랜치를 만들어 커밋한 뒤 `-D` 로 지우고, HEAD reflog에서 찾아 되살리세요.
5. `--amend` 로 커밋을 덮어쓴 뒤 `git show HEAD@{1}:<파일>` 로 원본 내용을 확인하세요.
6. `git reflog expire --expire=now --all` 후 `git fsck --lost-found` 로 고아 커밋을 찾아 되살려 보세요. **반드시 실험실 저장소에서만** 하세요.

---

[← 이전 22강](lesson-22.md) · [목차](README.md) · [다음 → 24강 세 그루의 나무](lesson-24.md)
