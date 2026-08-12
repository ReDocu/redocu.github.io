# 30강 · 고급 종합 실습

> **Git 학습 매뉴얼** · 🔴 고급 · **30강 / 30** · 🏁 전 과정 마무리
> [← 이전 29강](lesson-29.md) · [목차](README.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `.git` 내부를 직접 열어 저장소 상태를 진단할 수 있다.
- 사고 유형 5가지를 **문서 없이** 복구할 수 있다.
- 규칙이 **훅 + CI + 브랜치 보호**로 자동 강제되는 저장소를 세팅할 수 있다.
- 비밀 유출 사고 대응을 처음부터 끝까지 수행할 수 있다.
- 30강 전 과정을 마치고 **후배에게 Git을 가르칠 수 있다.**

---

## ② 왜 필요한가

고급 9개 강은 **"Git이 어떻게 동작하는가"** 와 **"규칙을 어떻게 자동화하는가"** 였습니다.

낱개로는 다 해 봤지만, 실제 사고는 이렇게 옵니다.

```
09:00  팀원이 main 에 force push → 커밋 3개 소실
09:30  복구하다 reset --hard 로 내 작업까지 날림
10:00  복구 후 확인하니 어제부터 테스트가 깨져 있었음
11:00  bisect 로 범인 커밋을 찾음
13:00  그 커밋에 .env 가 딸려 들어간 것을 발견 🚨
13:05  키 재발급
14:00  이력 재작성 + 전원 재clone
16:00  재발 방지: 훅 + CI + 브랜치 보호
```

오늘은 이 하루를 **압축해서 직접 겪어 봅니다.**

---

## ③ 개념 설명 — 고급 전체 지도

### Git의 전체 구조 한 장

```
 ┌──────────────────────── .git ────────────────────────┐
 │                                                      │
 │  objects/            refs/              logs/        │
 │  ┌──────────┐      ┌──────────┐      ┌──────────┐   │
 │  │ blob     │◀─────│ heads/   │      │ HEAD     │   │
 │  │ tree     │      │ tags/    │      │ refs/    │   │
 │  │ commit   │      │ remotes/ │      └──────────┘   │
 │  │ tag      │      └──────────┘        reflog       │
 │  └──────────┘           ▲              (23강)       │
 │    (21강)               │                            │
 │                       HEAD ──▶ 브랜치 ──▶ 커밋      │
 │                       (22강)                         │
 │                                                      │
 │  index  ← 세 나무의 가운데 (24강)                     │
 │  hooks/ ← 자동 검사 (26강)                            │
 └──────────────────────────────────────────────────────┘
                          │
     ┌────────────────────┴────────────────────┐
     │                                          │
  진단·추적                                  자동화
  bisect · blame · log -S  (25강)      훅(26) · CI(27) · 보호(13)
     │                                          │
  대형 저장소 (28강)                    사고 대응 (29강)
  submodule · LFS · worktree           filter-repo · 유출 대응
```

### 강별 핵심 한 줄

| 강 | 핵심 |
|---|---|
| [21](lesson-21.md) | **blob에는 이름이 없다.** 이름은 tree가, tree는 commit이 가리킨다 |
| [22](lesson-22.md) | **브랜치는 해시 40자가 적힌 파일 하나.** `origin/main` 도 내 파일 |
| [23](lesson-23.md) | 커밋한 것은 **30일간 내 컴퓨터에서만** 복구된다 |
| [24](lesson-24.md) | **`--hard` 와 `clean` 만** 디스크를 덮어쓴다 |
| [25](lesson-25.md) | `bisect run` 스크립트 첫 줄은 **캐시 삭제** |
| [26](lesson-26.md) | `pre-commit` 은 **1~3초** 안에 끝나야 한다 |
| [27](lesson-27.md) | **브랜치 보호에 등록**해야 비로소 강제된다 |
| [28](lesson-28.md) | 파일을 지워도 **`.git` 은 줄지 않는다** |
| [29](lesson-29.md) | **키 재발급이 먼저**, 이력 정리는 그다음 |

### 고급 명령어 지도

| 하고 싶은 일 | 명령 |
|---|---|
| **진단** | |
| 객체 내용 보기 | `git cat-file -p <해시>` |
| 모든 객체 나열 | `git cat-file --batch-check --batch-all-objects` |
| 참조 전체 | `git show-ref` / `git for-each-ref` |
| 인덱스 | `git ls-files -s` |
| 저장소 크기 | `git count-objects -vH` |
| 가장 큰 blob | `rev-list --objects --all \| cat-file --batch-check ...` |
| **복구** | |
| 이동 기록 | `git reflog` |
| 직전 위치 | `ORIG_HEAD` |
| 고아 객체 | `git fsck --lost-found` |
| **추적** | |
| 범인 커밋 | `git bisect run <스크립트>` |
| 줄별 작성자 | `git blame -w --ignore-rev` |
| 코드로 검색 | `git log -S` / `-G` / `-L` |
| 과거 시점 검색 | `git grep <패턴> <커밋>` |
| **대형 저장소** | |
| 외부 저장소 | `git submodule` / `git subtree` |
| 큰 파일 | `git lfs track` |
| 동시 작업 | `git worktree add` |
| 부분 체크아웃 | `git sparse-checkout set` |
| **사고 대응** | |
| 이력 재작성 | `git filter-repo --path ... --invert-paths` |
| 값 치환 | `git filter-repo --replace-text` |

---

## ④ 단계별 실습 — 미션 6개

**오늘의 과제** — `final-project` 저장소를 만들어 **진단 → 사고 → 복구 → 자동화 → 사고 대응** 을 완주합니다.

```bash
cd ~/Desktop
mkdir final-project && cd final-project
git init
git config user.name "Hong Gildong" && git config user.email "hong@example.com"
git config core.autocrlf false
```

---

### 미션 1. 저장소 해부 (21·22강)

> **목표** — 커밋 하나를 객체 층까지 따라 내려간다.

```bash
mkdir src
printf 'def add(a, b):\n    return a + b\n' > src/calc.py
printf '# Final Project\n' > README.md
git add . && git commit -qm "feat: 계산 함수 추가"
```

**① 커밋 → 트리 → 트리 → blob 따라가기**

```bash
git cat-file -p HEAD                # tree 해시 확인
git cat-file -p HEAD^{tree}         # 루트 트리
git cat-file -p HEAD:src            # src 트리
git cat-file -p HEAD:src/calc.py    # blob 내용
```

**② 객체 개수 세기**

```bash
git cat-file --batch-check --batch-all-objects
```

> ✅ **체크** — 파일 2개를 커밋했는데 객체가 몇 개인가요? 각각 무엇인지 말할 수 있나요?
> (정답: 4개 — blob 2, tree 2, commit 1 … 은 5개입니다. 직접 세어 보세요)

**③ 참조 확인**

```bash
cat .git/HEAD
cat .git/refs/heads/main
git rev-parse HEAD main refs/heads/main       # 셋이 같은지
git show-ref
```

**④ 해시가 내용에서 나오는 것 확인**

```bash
printf 'hello git\n' | git hash-object --stdin
```

> ✅ **체크** — `8d0e41234f24b6da002d962a26c2495ea16a425f` 가 나왔나요?
> 안 나왔다면 `core.autocrlf` 를 확인하세요 ([21강](lesson-21.md)).

---

### 미션 2. 사고 복구 5종 (23·24강)

> **목표** — 대표적인 사고를 **일부러 만들고** 문서 없이 복구한다.

기반 커밋을 몇 개 만듭니다.

```bash
for i in 2 3 4; do
  printf "# 작업 $i\n" >> notes.md
  git add notes.md && git commit -qm "chore: 작업 $i"
done
git log --oneline
```

**① `reset --hard` 사고**

```bash
git reset --hard HEAD~3
git log --oneline
```

<details>
<summary>복구 방법 (먼저 스스로)</summary>

```bash
git reflog -5
git reset --hard HEAD@{1}
# 또는
git reset --hard ORIG_HEAD
```
</details>

**② rebase 실패**

```bash
git switch -qc feature/lost
printf 'print("중요한 작업")\n' > important.py
git add . && git commit -qm "feat: 중요한 작업"
git rebase -i HEAD~1
# 목록에서 그 줄을 지우고 저장 (= drop)
git log --oneline -1
```

<details>
<summary>복구 방법</summary>

```bash
git reflog
# "rebase (start)" 바로 위 항목을 찾는다
git reset --hard HEAD@{3}    # 본인 화면의 번호로
ls important.py
```
</details>

**③ 브랜치 삭제**

```bash
git switch -q main
git branch -D feature/lost
```

<details>
<summary>복구 방법</summary>

```bash
# 삭제 메시지에 나온 해시를 쓰거나
git reflog | grep "feature/lost"
git branch feature/lost <해시>
```
</details>

**④ detached HEAD에서 커밋하고 나옴**

```bash
git switch --detach HEAD~2
printf 'orphan\n' > orphan.txt
git add . && git commit -qm "feat: 고아 커밋"
git switch main        # 경고 메시지를 읽으세요
```

<details>
<summary>복구 방법</summary>

```bash
# 경고에 표시된 해시로
git branch rescued <해시>
# 또는
git reflog | head -5
```
</details>

**⑤ `--amend` 로 원본을 덮어씀**

```bash
git switch -qc amend-test
printf '원래 내용\n' > amend.txt
git add . && git commit -qm "feat: 원래 커밋"
printf '덮어쓴 내용\n' > amend.txt
git add . && git commit -q --amend -m "feat: 덮어쓴 커밋"
cat amend.txt
```

<details>
<summary>복구 방법</summary>

```bash
git show HEAD@{1}:amend.txt     # 원본 확인
git reset --hard HEAD@{1}
cat amend.txt
```
</details>

정리합니다.

```bash
git switch -q main
git branch -D amend-test feature/lost rescued 2>/dev/null
git clean -fdq
```

> ✅ **체크** — 다섯 가지를 **문서 없이** 복구할 수 있나요? 못 했다면 [23강](lesson-23.md)·[24강](lesson-24.md)을 다시 읽으세요.

---

### 미션 3. 범인 찾기 (25강)

> **목표** — `bisect run` 으로 버그 커밋을 자동 탐색한다.

```bash
git switch -q main
for i in 1 2 3; do
  printf "# 정상 작업 $i\n" >> notes.md
  git add . && git commit -qm "chore: 정상 $i"
done

# 버그 삽입
sed -i 's/return a + b/return a - b/' src/calc.py
git commit -qam "refactor: 계산 로직 정리"

for i in 4 5 6; do
  printf "# 정상 작업 $i\n" >> notes.md
  git add . && git commit -qm "chore: 정상 $i"
done
```

**판정 스크립트를 만듭니다.**

```bash
cat > check.sh << 'EOF'
#!/bin/sh
rm -rf src/__pycache__            # ⭐ 캐시 삭제 (필수)
cd src && python -c "import calc; exit(0 if calc.add(2,3)==5 else 1)"
EOF
chmod +x check.sh
```

```bash
FIRST=$(git rev-list --max-parents=0 HEAD)
git bisect start HEAD $FIRST
git bisect run ./check.sh
git bisect reset
```

> ✅ **체크** — `refactor: 계산 로직 정리` 가 나왔나요?
> **캐시 삭제 줄을 빼고** 다시 돌려서 **결과가 틀리는 것**도 확인해 보세요.

**찾은 뒤 맥락 파악**

```bash
git blame src/calc.py
git log -L :add:src/calc.py --oneline
git log --oneline -S "a - b" -- src/calc.py
```

**되돌립니다** ([17강](lesson-17.md)).

```bash
sed -i 's/return a - b/return a + b/' src/calc.py
git commit -qam "fix: 덧셈이 뺄셈으로 동작하던 문제 수정"
rm -f check.sh
```

---

### 미션 4. 규칙 자동화 (26·27·13강)

> **목표** — 세 층(훅 · CI · 브랜치 보호)으로 규칙을 강제한다.

**① 로컬 훅** ([26강](lesson-26.md))

```bash
mkdir -p .githooks
cat > .githooks/pre-commit << 'EOF'
#!/bin/sh
git diff --cached --check || exit 1

# 비밀 파일 차단
BLOCKED=$(git diff --cached --name-only --diff-filter=ACM \
          | grep -E '(^|/)\.env$|\.pem$|\.key$')
if [ -n "$BLOCKED" ]; then
    echo "❌ 비밀 정보 파일이 포함되어 있습니다:"
    echo "$BLOCKED"
    exit 1
fi

# 디버깅 코드 차단
FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.py')
if [ -n "$FILES" ] && git diff --cached -U0 -- $FILES | grep -q '^+.*DEBUG'; then
    echo "❌ 디버깅 코드가 포함되어 있습니다."
    exit 1
fi

echo "✅ pre-commit 통과"
EOF

cat > .githooks/commit-msg << 'EOF'
#!/bin/sh
PATTERN='^(feat|fix|docs|style|refactor|perf|test|chore|ci)(\(.+\))?!?: .{1,50}'
if ! head -1 "$1" | grep -qE "$PATTERN"; then
    echo "❌ 커밋 메시지 형식 오류: <타입>: <제목>"
    exit 1
fi
EOF

chmod +x .githooks/*
git config core.hooksPath .githooks
```

**② 기본 방어 파일들**

```bash
cat > .gitignore << 'EOF'
.env
.env.*
!.env.example
*.pem
*.key
__pycache__/
*.py[cod]
venv/
EOF

cat > .gitattributes << 'EOF'
* text=auto
*.py text eol=lf
*.md text eol=lf
*.png binary
EOF

cat > .env.example << 'EOF'
API_KEY=your-api-key-here
EOF
```

**③ CI** ([27강](lesson-27.md))

```bash
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    name: 테스트
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: cd src && python -c "import calc; assert calc.add(2,3)==5"

  security:
    name: 비밀정보 검사
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
EOF
```

**④ 문서** ([13강](lesson-13.md))

```bash
cat > CONTRIBUTING.md << 'EOF'
# 기여 가이드

## 초기 설정
```bash
git config core.hooksPath .githooks
```

## 브랜치 전략 — GitHub Flow
- `main` 직접 push 금지. 모든 변경은 PR로.
- 브랜치: `<타입>/<이슈번호>-<설명>`

## 커밋 메시지 — Conventional Commits
`<타입>: <제목>` (50자 이내)

## 금지 사항
- `.env` 등 비밀 정보 커밋
- 공유 브랜치 force push
- 공유 브랜치 rebase
EOF
```

```bash
git add . && git commit -m "chore: 자동 검사 체계 구축"
```

**⑤ 훅이 동작하는지 검증**

```bash
printf 'API_KEY=sk-test-123\n' > .env
git add -f .env
git commit -m "chore: 설정 추가"
```

실행 결과:

```
❌ 비밀 정보 파일이 포함되어 있습니다:
.env
```

```bash
git restore --staged .env
```

**⑥ GitHub 연동과 보호 규칙**

GitHub에 저장소를 만들고 push한 뒤:

```
Settings → Branches → main
  ☑ Require a pull request before merging
  ☑ Require status checks to pass before merging
      └── 테스트 / 비밀정보 검사
  ☐ Allow force pushes

Settings → Code security and analysis
  ☑ Secret scanning
  ☑ Push protection          ← 가장 강력
```

> ✅ **체크** — 세 층이 모두 동작하나요?
> **훅**(로컬 즉시) → **CI**(서버, 우회 불가) → **보호 규칙**(병합 차단)

---

### 미션 5. 비밀 유출 사고 대응 (29강)

> **목표** — 유출 사고를 처음부터 끝까지 처리한다. **가장 중요한 미션입니다.**

**① 사고 재현** (훅을 우회해서)

```bash
printf 'API_KEY=sk-live-SECRET1234567890\n' > .env
git add -f .env
git commit --no-verify -m "chore: 환경 설정"
printf '# 이후 작업\n' >> notes.md
git add . && git commit -qm "chore: 이후 작업"
```

**② 노출 범위 파악**

```bash
git log --all --oneline -- .env
git grep -n "sk-live" $(git rev-list --all)
```

> ✅ **체크** — **몇 개 커밋에서** 조회되나요? 왜 그런지 설명할 수 있나요? ([21강](lesson-21.md))

**③ 🚨 이 시점에서 해야 할 진짜 첫 번째 일**

실습이 아니라면 **여기서 명령을 멈추고 키를 재발급**받으러 가야 합니다.

```
AWS/GitHub/외부 서비스 콘솔 → 해당 키 비활성화 → 삭제 → 재발급
접근 로그 확인 → 오용 흔적 조사
```

**이력 정리보다 이것이 먼저입니다.**

**④ 백업**

```bash
cd ~/Desktop
cp -r final-project final-project-backup
cd final-project
```

**⑤ 이력에서 제거**

```bash
git filter-repo --path .env --invert-paths --force
```

**⑥ 검증**

```bash
git log --all --oneline -- .env
git grep -n "sk-live" $(git rev-list --all)
git log --oneline
```

> ✅ **체크** — 검색 결과가 비었나요? 커밋 해시가 전부 바뀌었나요?

**⑦ 원격 반영**

```bash
git remote -v                    # filter-repo 가 지웠습니다
git remote add origin <주소>
# 브랜치 보호에서 Allow force pushes 임시 활성화
git push --force --all
git push --force --tags
# 보호 규칙 즉시 복구 ⭐
```

**⑧ 팀 공지문 작성**

`INCIDENT.md` 를 만들어 [29강](lesson-29.md)의 템플릿대로 작성해 보세요.

**⑨ 재발 방지 확인**

미션 4에서 만든 장치들이 이 사고를 막았어야 합니다.

| 장치 | 이 사고를 막았나 |
|---|---|
| `.gitignore` | ✅ (`git add -f` 로 뚫음) |
| `pre-commit` 훅 | ✅ (`--no-verify` 로 뚫음) |
| CI gitleaks | ✅ **막았어야 함** |
| GitHub Push protection | ✅ **서버가 막았어야 함** |

> 🔑 **로컬 방어는 전부 우회 가능합니다.** 마지막 두 층이 진짜 방어선입니다.

---

### 미션 6. 대형 저장소 다루기 (28강)

> **목표** — worktree와 진단 도구를 실무처럼 써 본다.

**① 큰 파일을 넣고 진단**

```bash
head -c 500000 /dev/urandom > data.bin
git add data.bin && git commit -qm "chore: 데이터 추가"

git count-objects -vH
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k3 -n -r | head -5
```

**② 지워도 안 줄어드는 것 확인**

```bash
git rm data.bin && git commit -qm "chore: 데이터 삭제"
git gc -q
git count-objects -vH          # 크기가 그대로
```

> ✅ **체크** — 왜 안 줄어드는지 설명할 수 있나요? ([21강](lesson-21.md)·[28강](lesson-28.md))

**③ 이력에서 제거**

```bash
git filter-repo --strip-blobs-bigger-than 100K --force
git count-objects -vH
```

**④ worktree로 동시 작업**

```bash
git switch -qc feature/long-work
printf '# 진행 중\n' >> notes.md
git commit -qam "feat: 긴 작업 중"

git worktree add ../final-hotfix -b hotfix/urgent
git worktree list
cat ../final-hotfix/.git
```

> ✅ **체크** — `.git` 이 **폴더가 아니라 파일**인 것을 확인했나요?

```bash
git worktree remove ../final-hotfix
git branch -D hotfix/urgent
git switch -q main
```

---

## ⑤ 자주 하는 실수 — 고급 트러블슈팅 참조

| 증상 / 메시지 | 원인 | 해결 |
|---|---|---|
| `.git/objects` 파일이 깨져 보임 | zlib 압축 | `git cat-file -p <해시>` ([21](lesson-21.md)) |
| 해시가 문서와 다름 | 줄바꿈(CRLF) | `core.autocrlf false` ([21](lesson-21.md)) |
| `short object ID is ambiguous` | 앞자리 충돌 | 자릿수 늘리기 ([21](lesson-21.md)) |
| `.git/refs` 에 브랜치 파일이 없음 | `packed-refs` | `git show-ref` ([22](lesson-22.md)) |
| `ref HEAD is not a symbolic ref` | detached HEAD | `git switch -` ([22](lesson-22.md)) |
| `HEAD^2` 가 PowerShell에서 실패 | `^` 이스케이프 | `"HEAD^2"` 또는 `HEAD~1` ([22](lesson-22.md)) |
| `status` 는 최신인데 원격에 커밋 있음 | `origin/main` 은 캐시 | `git fetch` ([22](lesson-22.md)) |
| 커밋을 날림 | reset·rebase | `git reflog` → `reset --hard HEAD@{n}` ([23](lesson-23.md)) |
| reflog에도 없음 | 만료·clone 직후 | `git fsck --lost-found` ([23](lesson-23.md)) |
| 커밋 안 한 작업을 날림 | `--hard` / `restore` / `clean` | **복구 불가** ([24](lesson-24.md)) |
| `Cannot do hard reset with paths` | `--hard` + 경로 | `git restore --source=` ([24](lesson-24.md)) |
| `reset <경로>` 후 HEAD가 그대로 | 경로 지정 시 ①단계 생략 | 정상 동작 ([24](lesson-24.md)) |
| `bisect run` 이 엉뚱한 커밋 지목 | **캐시·빌드 산출물** | 스크립트 첫 줄에서 삭제 ([25](lesson-25.md)) |
| bisect 후 detached HEAD | `reset` 누락 | `git bisect reset` ([25](lesson-25.md)) |
| blame이 포맷팅 커밋을 가리킴 | 공백 변경 | `-w`, `.git-blame-ignore-revs` ([25](lesson-25.md)) |
| 훅이 실행 안 됨 | 권한·이름·shebang | `chmod +x`, 이름 확인 ([26](lesson-26.md)) |
| 훅이 자기 자신을 검사 | 패턴이 소스에 포함 | 확장자로 대상 제한 ([26](lesson-26.md)) |
| 훅이 팀원에게 적용 안 됨 | `.git/hooks` 는 커밋 안 됨 | `core.hooksPath` ([26](lesson-26.md)) |
| 워크플로가 실행 안 됨 | 경로·YAML 문법 | `.github/workflows/`, `actionlint` ([27](lesson-27.md)) |
| `git describe` 실패 (CI) | 얕은 clone | `fetch-depth: 0` ([27](lesson-27.md)) |
| CI는 도는데 병합이 됨 | 보호 규칙 미등록 | Require status checks ([27](lesson-27.md)) |
| 서브모듈 폴더가 빔 | 일반 clone | `--recurse-submodules` ([28](lesson-28.md)) |
| LFS 파일이 포인터로 보임 | LFS 미설치 | `git lfs install && git lfs pull` ([28](lesson-28.md)) |
| 파일 지웠는데 `.git` 그대로 | 객체는 불변 | `filter-repo` ([29](lesson-29.md)) |
| 재작성 후 팀원이 pull | 옛 이력 부활 | **재clone 필수** ([29](lesson-29.md)) |

### 위험한 명령 (고급판)

```
🚨🚨 git filter-repo            모든 해시 변경. 되돌릴 수 없음. 백업 필수
🚨🚨 git push --force           원격 이력 덮어씀 (29강의 재작성 때만)
🚨   git reset --hard           커밋 안 한 작업 소실
🚨   git clean -fdx             untracked + ignored 삭제 (.env, venv/)
🚨   git reflog expire --expire=now --all   복구 수단 제거
🚨   git gc --prune=now         도달 불가 객체 즉시 삭제
⚠️   git bisect (reset 누락)     detached HEAD 방치
```

---

## ⑥ 확인 문제

**1.** 저장소에서 `git log` 는 정상인데 `.git` 이 3GB입니다. **원인을 찾고 줄이는 전체 과정**을 명령과 함께 설명하세요.

<details>
<summary>답 보기</summary>

**① 진단**

```bash
git count-objects -vH

git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k3 -n -r | head -20
```

`git-sizer` 를 쓰면 더 편합니다.

```bash
git-sizer --verbose
```

**② 원인 분류**

| 나온 것 | 대응 |
|---|---|
| `*.zip`, `*.mp4`, 빌드 산출물 | 이력에서 제거 |
| 계속 관리해야 하는 `*.psd` | **LFS 마이그레이션** |
| 도달 불가 객체가 많음 | `gc --prune` |
| 그냥 커밋이 많음 | partial clone |

**③ 안전한 것부터**

```bash
git gc --aggressive --prune=now
```

> 🚨 [23강](lesson-23.md)의 복구 수단을 없앱니다. 최근 사고가 없는지 확인 후 실행하세요.

**④ 이력 재작성** ([29강](lesson-29.md))

```bash
cp -r project project-backup          # ⭐ 백업

git filter-repo --strip-blobs-bigger-than 10M --force
# 또는 특정 경로
git filter-repo --path assets/videos --invert-paths --force
```

계속 필요한 파일은 LFS로 ([28강](lesson-28.md)):

```bash
git lfs migrate info --everything      # 먼저 분석
git lfs migrate import --include="*.psd" --everything
```

**⑤ 팀 합의와 공지** — 이 단계를 빠뜨리면 안 됩니다

```
- 사전 공지 (작업 중단 요청)
- 보호 규칙 임시 해제
- git push --force --all --tags
- 보호 규칙 즉시 복구
- 전원 재clone 안내 (git pull 금지!)
```

**⑥ 재발 방지**

```gitignore
*.zip
*.mp4
dist/
```

```yaml
# .pre-commit-config.yaml
- id: check-added-large-files
  args: ['--maxkb=1000']
```

**⑦ 재작성이 부담스럽다면**

```bash
git clone --filter=blob:none <주소>
```

이력을 안 건드리고도 clone이 크게 빨라집니다.
</details>

**2.** 팀원이 `main` 에 force push해서 커밋 5개가 사라졌습니다. **복구 절차와 재발 방지책**을 순서대로 답하세요.

<details>
<summary>답 보기</summary>

**① 즉시 공지 — 아무도 `pull` 하지 않게**

지금 `pull` 하면 각자의 로컬도 오염됩니다. **가장 먼저 알리는 것**이 복구보다 중요합니다.

**② 사라진 커밋 찾기 — 네 곳**

```bash
# ⓐ 강제 push한 사람의 로컬
git reflog --date=iso | head -20

# ⓑ 최근에 pull 한 팀원의 로컬
git reflog show origin/main
git log --oneline origin/main

# ⓒ 서버에 남은 도달 불가 객체
git fsck --lost-found
```

ⓓ **GitHub** — Settings → Activity, PR·이슈의 커밋 링크, Actions 실행 기록, 이벤트 API

**③ 복구**

```bash
git fetch
git switch main
git log --oneline <찾은 해시> -5       # 맞는지 먼저 확인
git reset --hard <찾은 해시>
git push --force-with-lease
```

**④ 전원 동기화**

```bash
git fetch --prune
git status              # 로컬 변경 확인
git stash -u            # 있으면 보관
git switch main
git reset --hard origin/main
git stash pop
```

**⑤ 재발 방지 — 이게 진짜 대응입니다** ([13강](lesson-13.md)·[27강](lesson-27.md))

```
Settings → Branches → main
  ☐ Allow force pushes                          ← 물리적으로 차단
  ☑ Require a pull request before merging
  ☑ Require status checks to pass
  ☑ Do not allow bypassing the above settings   ← 관리자도 예외 없음
```

로컬에도 한 겹 ([26강](lesson-26.md)):

```sh
# .githooks/pre-push
if [ "$branch" = "main" ]; then
    echo "❌ main 직접 push 금지"
    exit 1
fi
```

별칭으로 `--force` 를 손에서 멀어지게:

```bash
git config --global alias.pushf "push --force-with-lease --force-if-includes"
```

**⑥ 회고 — 개인을 탓하지 않기**

> **막지 않은 설정의 책임입니다.** 사람은 반드시 실수하고, 실수할 수 있었다는 것은 시스템의 문제입니다.
> 사후 분석은 "누가"가 아니라 "무엇이 이걸 가능하게 했나"로 진행하세요.
</details>

**3.** 후배가 묻습니다. **"Git 잘한다는 게 뭔가요? 명령어를 많이 아는 건가요?"** 30강을 마친 사람으로서 답해 보세요.

<details>
<summary>답 보기</summary>

**아닙니다. 세 가지입니다.**

**① 모델을 갖고 있는가**

명령을 외우는 대신 **그림 몇 개**로 설명할 수 있는가입니다.

```
객체 3층      commit → tree → blob            (21강)
참조          HEAD → 브랜치 → 커밋             (22강)
세 나무       HEAD · 인덱스 · 작업 디렉터리      (24강)
```

이 셋이 있으면 처음 보는 명령도 **"어느 것을 어디에 맞추는 건가"** 로 이해됩니다. `reset` 세 옵션을 외울 필요가 없어집니다.

**② 되돌릴 수 있는가**

```
커밋한 것          →  reflog 로 30일간 복구 가능
커밋 안 한 것       →  복구 불가
공유한 것          →  revert 만
공유 안 한 것       →  reset·rebase·amend 자유
```

**"이거 하면 되돌릴 수 있나?"** 를 먼저 묻는 습관이 실력입니다.
그래서 위험한 명령 전에 `git status` 를 보고, `git stash -u` 를 하고, 백업 브랜치를 만듭니다.

**③ 팀을 위해 자동화하는가**

혼자 잘하는 것과 팀이 잘하는 것은 다릅니다.

```
문서 (CONTRIBUTING.md)   →  합의
훅 (pre-commit)          →  빠른 알림
CI (Actions)             →  우회 불가
브랜치 보호               →  최종 강제
```

**"조심하자"는 대책이 아닙니다.** 사람은 실수하고, 그걸 시스템으로 막는 것이 실력입니다.

**그리고 하나 더 — 커밋을 잘 쓰는가**

```bash
git bisect      커밋이 잘 나뉘어야 쓸모 있음    (25강)
git revert      커밋이 원자적이어야 안전         (17강)
git blame       메시지에 "왜"가 있어야 의미 있음  (15강)
```

**고급 도구들은 전부 초급·중급의 습관 위에서만 동작합니다.**
[04강](lesson-04.md)의 "커밋 하나 = 의미 하나"가 30강까지 이어지는 이유입니다.

**한 문장 요약**
> **Git을 잘한다는 것은 명령을 많이 아는 것이 아니라, 되돌릴 수 있는 방식으로 일하고 그것을 팀의 기본값으로 만드는 것입니다.**
</details>

---

## 🏁 고급 수료 체크리스트

### 개념

- [ ] 객체 4종과 commit → tree → blob 구조를 설명할 수 있다 ([21](lesson-21.md))
- [ ] 해시가 내용에서 결정되는 것과 rebase로 해시가 바뀌는 이유를 연결해 설명할 수 있다 ([21](lesson-21.md))
- [ ] 브랜치·HEAD·`origin/main` 의 실체를 파일 수준에서 설명할 수 있다 ([22](lesson-22.md))
- [ ] detached HEAD가 무엇이고 왜 위험한지 안다 ([22](lesson-22.md))
- [ ] 도달 가능성과 reflog 만료 정책을 설명할 수 있다 ([23](lesson-23.md))
- [ ] 세 나무와 `reset` 3단계를 그림으로 그릴 수 있다 ([24](lesson-24.md))
- [ ] 훅과 CI의 역할 차이를 설명할 수 있다 ([26](lesson-26.md)·[27](lesson-27.md))
- [ ] 파일을 지워도 `.git` 이 안 줄어드는 이유를 안다 ([28](lesson-28.md))

### 손

- [ ] `git cat-file -p` 로 커밋에서 blob까지 따라갈 수 있다 ([21](lesson-21.md))
- [ ] 배관 명령만으로 커밋을 만들 수 있다 ([21](lesson-21.md))
- [ ] `git rev-parse` 로 각종 표기를 해시로 변환할 수 있다 ([22](lesson-22.md))
- [ ] `git reflog` 로 사고 5종을 복구할 수 있다 ([23](lesson-23.md))
- [ ] `git fsck --lost-found` 로 고아 커밋을 찾을 수 있다 ([23](lesson-23.md))
- [ ] `reset` 세 옵션의 결과를 예측할 수 있다 ([24](lesson-24.md))
- [ ] `git bisect run` 으로 범인 커밋을 자동 탐색할 수 있다 ([25](lesson-25.md))
- [ ] `blame` · `log -S` · `log -L` 을 상황에 맞게 쓸 수 있다 ([25](lesson-25.md))
- [ ] 훅을 작성하고 `core.hooksPath` 로 공유할 수 있다 ([26](lesson-26.md))
- [ ] CI 워크플로를 작성하고 필수 통과 조건으로 등록할 수 있다 ([27](lesson-27.md))
- [ ] submodule · LFS · worktree · sparse-checkout 을 쓸 수 있다 ([28](lesson-28.md))
- [ ] `git filter-repo` 로 이력에서 파일·값·큰 파일을 제거할 수 있다 ([29](lesson-29.md))

### 사고 대응

- [ ] 비밀 유출 대응 절차를 **순서대로** 실행할 수 있다 ([29](lesson-29.md))
- [ ] force push 사고를 복구하고 재발을 막을 수 있다 ([29](lesson-29.md))
- [ ] 저장소 크기를 진단하고 가장 큰 blob을 찾을 수 있다 ([28](lesson-28.md))
- [ ] 이력 재작성 시 팀 공지·재clone 절차를 진행할 수 있다 ([29](lesson-29.md))

### 습관

- [ ] 위험한 명령 전에 `git status` 와 백업을 확인한다
- [ ] `--force` 대신 `--force-with-lease` 를 쓴다
- [ ] 규칙을 **문서 → 훅 → CI → 보호 규칙** 4층으로 강제한다
- [ ] 사고 회고를 "누가"가 아니라 "무엇이 가능하게 했나"로 진행한다

---

## 📝 고급 실기 평가

> **제한 시간 90분 · 문서 참고 없이**

| # | 과제 | 배점 |
|---|---|---|
| 1 | 커밋 하나를 `cat-file` 로 blob까지 따라가고, 객체 개수와 종류를 설명한다 | 10 |
| 2 | 배관 명령만으로 커밋을 하나 만든다 | 10 |
| 3 | `reset --hard` · rebase drop · 브랜치 삭제 · detached 커밋 · `--amend` **5종을 복구**한다 | 20 |
| 4 | `reset` 세 옵션 실행 후 **세 나무의 상태**를 정확히 답한다 | 10 |
| 5 | 버그를 심고 `bisect run` 으로 자동 탐색한다 (캐시 처리 포함) | 15 |
| 6 | `pre-commit` + `commit-msg` 훅을 만들어 `core.hooksPath` 로 공유한다 | 10 |
| 7 | CI 워크플로를 만들고 **필수 통과 조건**으로 등록해 병합이 막히는 것을 보인다 | 15 |
| 8 | `.env` 유출 사고를 `filter-repo` 로 처리하고 **대응 순서를 설명**한다 | 20 |

**감점 항목**

- 유출 대응에서 **키 재발급을 언급하지 않음** **−20**
- `filter-repo` 실행 전 백업 없음 **−10**
- `bisect reset` 누락 **−10**
- 이력 재작성 후 팀 공지 절차 누락 **−10**

---

## 오늘의 정리

**고급에서 배운 것**

```
21 .git 해부      22 참조와 HEAD      23 reflog
24 세 나무         25 범인 찾기        26 훅
27 GitHub Actions 28 대형 저장소      29 사고 대응
```

**Git의 전부를 세 문장으로**

```
① 객체는 불변이고, 해시는 내용에서 나온다        (21강)
② 참조는 그 객체를 가리키는 이름표일 뿐이다      (22강)
③ 모든 명령은 세 나무 중 어느 것을 어디에 맞출지다 (24강)
```

**사고가 났을 때의 순서**

```
1. 멈춘다 (pull·push 금지, 팀에 알린다)
2. git status / git reflog 로 현재 상태 파악
3. 백업 (cp -r 또는 브랜치 표시)
4. 복구
5. 재발 방지 장치 추가
```

**규칙 강제의 4층**

```
문서 (CONTRIBUTING.md)   합의
  ↓
훅 (pre-commit)          1~3초, 우회 가능
  ↓
CI (Actions)             몇 분, 우회 불가
  ↓
브랜치 보호               병합 차단  ← 여기서 진짜 강제
```

**오늘 반드시 기억할 한 가지**
> **"이거 하면 되돌릴 수 있나?"** 를 먼저 묻는 것이 Git 실력의 전부입니다.
> 커밋한 것은 살릴 수 있고, 커밋 안 한 것은 못 살립니다. 공유한 것은 다시 쓰지 않습니다.

---

## 🎓 전 과정 수료

**30강을 완주하셨습니다.**

```
🟢 초급 01–10   혼자 쓰는 Git
   세 공간 · 커밋 · gitignore · 되돌리기 · 브랜치 · GitHub

🟡 중급 11–20   팀으로 쓰는 Git
   충돌 · rebase · 브랜치 전략 · PR · 좋은 커밋 · revert · 태그

🔴 고급 21–30   Git 내부와 자동화
   객체 · 참조 · reflog · 3-tree · bisect · 훅 · CI · 대형 저장소 · 사고 대응
```

**이 과정을 마치면 할 수 있는 것** (커리큘럼의 최종 목표)

- [ ] Git의 세 공간과 객체 모델을 설명할 수 있다
- [ ] 혼자서든 팀에서든 브랜치 전략에 맞게 작업할 수 있다
- [ ] 어떤 실수를 해도 되돌릴 방법을 알고 있다
- [ ] 저장소의 규칙을 훅과 CI로 자동화할 수 있다
- [ ] **후배에게 Git을 가르칠 수 있다**

### 앞으로 할 일

**① 실제 프로젝트에 적용하세요**

배운 것은 쓰지 않으면 사라집니다. 지금 하고 있는 프로젝트에 이번 주 안에 적용해 보세요.

```
- CONTRIBUTING.md 작성        (13강)
- pre-commit 훅 도입          (26강)
- CI + 브랜치 보호 설정        (27강)
- .gitignore · .gitattributes 정비  (05·18강)
```

**② 부록을 곁에 두세요**

| 부록 | 용도 |
|---|---|
| A1 명령어 치트시트 | 상황별 1페이지 요약 |
| A2 에러 메시지 사전 | 에러 원문으로 검색 |
| A3 용어 사전 | 한글–영문 대조 |

**③ 더 읽을 것**

| 자료 | 링크 |
|---|---|
| Pro Git (한국어, 무료) | <https://git-scm.com/book/ko/v2> |
| Git 공식 문서 | <https://git-scm.com/docs> |
| Learn Git Branching (시각 학습) | <https://learngitbranching.js.org/?locale=ko> |
| Oh Shit, Git!?! | <https://ohshitgit.com/ko> |

**④ 가르쳐 보세요**

**가장 빠른 복습은 남에게 설명하는 것**입니다. 스터디에서 한 강씩 맡아 발표해 보세요.
특히 [21강](lesson-21.md)·[24강](lesson-24.md)은 설명해 보면 이해의 빈틈이 바로 드러납니다.

---

### 마지막 한마디

Git을 처음 배울 때 가장 무서운 것은 **"내가 뭘 망가뜨릴지 모른다"** 는 감각입니다.

30강을 지나온 지금, 그 감각의 자리에 이런 것이 들어와 있으면 성공입니다.

> **커밋한 것은 거의 다 살릴 수 있습니다.**
> **커밋하지 않은 것만 위험합니다.**
> **그러니 작게, 자주 커밋하세요.**

[01강](lesson-01.md)에서 한 말과 정확히 같습니다. 30강을 돌아 같은 자리에 왔는데, 이제는 **왜 그런지** 알고 있습니다.

수고하셨습니다. 🎉

---

[← 이전 29강](lesson-29.md) · [목차](README.md) · [처음으로 → 01강](lesson-01.md)
