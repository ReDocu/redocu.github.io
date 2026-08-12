# 26강 · 훅(hooks)과 자동 검사

> **Git 학습 매뉴얼** · 🔴 고급 · **26강 / 30**
> [← 이전 25강](lesson-25.md) · [목차](README.md) · [다음 → 27강 GitHub Actions 기초](lesson-27.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- Git 훅이 **언제 실행되고 무엇을 막을 수 있는지** 안다.
- `pre-commit` · `commit-msg` · `pre-push` 훅을 직접 작성할 수 있다.
- `core.hooksPath` 로 훅을 **팀 전체에 공유**할 수 있다.
- `--no-verify` 로 우회할 수 있다는 한계를 알고, **CI가 왜 필요한지** 설명할 수 있다.
- `pre-commit` · `husky` 같은 프레임워크를 도입할 수 있다.

---

## ② 왜 필요한가

지금까지 여러 규칙을 배웠습니다.

| 강 | 규칙 |
|---|---|
| [05](lesson-05.md) | `.env` 를 커밋하지 말 것 |
| [11](lesson-11.md) | 충돌 마커를 남긴 채 커밋하지 말 것 |
| [13](lesson-13.md) | `main` 에 직접 push하지 말 것 |
| [15](lesson-15.md) | 커밋 메시지는 `<타입>: <제목>` |
| [15](lesson-15.md) | 디버깅 코드를 커밋하지 말 것 |

**그런데 사람은 반드시 잊습니다.** [13강](lesson-13.md)에서 이렇게 정리했습니다.

> **규칙은 문서 → 도구 → 자동화 순으로 단단해집니다.**

훅은 **"도구" 단계**입니다. 커밋·push 같은 시점에 **자동으로 스크립트를 실행**해서, 규칙을 어기면 아예 진행되지 않게 합니다.

```
git commit
    ↓
pre-commit 훅 실행  ──▶ 실패하면 커밋 자체가 안 됨
    ↓
commit-msg 훅 실행  ──▶ 메시지 형식이 틀리면 거부
    ↓
커밋 완료
```

**훅의 장점** — 문제를 **가장 이른 시점에** 잡습니다. CI에서 10분 뒤 실패 알림을 받는 것보다, 커밋 순간에 1초 만에 막히는 편이 훨씬 낫습니다.

**훅의 한계** — `--no-verify` 로 우회할 수 있고, **각자 설정해야** 합니다. 그래서 [27강](lesson-27.md)의 CI가 함께 필요합니다.

---

## ③ 개념 설명

### 훅이란

`.git/hooks/` 에 있는 **실행 가능한 스크립트**입니다. 특정 시점에 Git이 자동으로 실행합니다.

```bash
ls .git/hooks/
```

```
applypatch-msg.sample     pre-commit.sample        pre-receive.sample
commit-msg.sample         pre-merge-commit.sample  prepare-commit-msg.sample
fsmonitor-watchman.sample pre-push.sample          push-to-checkout.sample
post-update.sample        pre-rebase.sample        sendemail-validate.sample
pre-applypatch.sample     update.sample
```

**모두 `.sample` 확장자**입니다. Git은 이 확장자가 붙은 파일은 실행하지 않습니다.
**`.sample` 을 떼면** 그 순간부터 동작합니다.

| 조건 | 설명 |
|---|---|
| 이름이 정확해야 함 | `pre-commit` (`.sh` 붙이면 안 됨) |
| **실행 권한** 필요 | `chmod +x` |
| 언어 무관 | shebang(`#!/bin/sh`, `#!/usr/bin/env python`)만 맞으면 됨 |
| **종료 코드 0이 아니면 차단** | (차단 가능한 훅에 한해) |

### 클라이언트 훅

| 훅 | 실행 시점 | 인자 | 차단 |
|---|---|---|---|
| **`pre-commit`** | 커밋 메시지 입력 **전** | 없음 | ✅ |
| `prepare-commit-msg` | 메시지 편집기 열기 전 | `$1` 메시지 파일, `$2` 출처 | ✅ |
| **`commit-msg`** | 메시지 작성 **후** | `$1` 메시지 파일 | ✅ |
| `post-commit` | 커밋 완료 후 | 없음 | ❌ |
| **`pre-push`** | push 직전 | `$1` 원격명, `$2` URL (+ stdin) | ✅ |
| `pre-rebase` | rebase 시작 전 | `$1` upstream, `$2` 브랜치 | ✅ |
| `post-checkout` | 체크아웃 후 | `$1` 이전, `$2` 이후, `$3` 플래그 | ❌ |
| `post-merge` | 병합 후 | `$1` squash 여부 | ❌ |

**가장 많이 쓰는 셋**

```
pre-commit   →  린트 · 포맷 · 비밀정보 · 디버깅 코드 검사
commit-msg   →  커밋 메시지 형식 검증
pre-push     →  테스트 실행 · 보호 브랜치 차단
```

> **`pre-commit` 은 스테이지된 내용을 검사해야 합니다.**
> 작업 디렉터리에는 담지 않은 변경도 있으므로, `git diff --cached` 를 기준으로 삼아야 정확합니다.

### 서버 훅

원격 저장소(bare repository) 쪽에서 실행됩니다. **우회할 수 없다는 것이 결정적인 차이**입니다.

| 훅 | 시점 |
|---|---|
| `pre-receive` | push를 받기 직전 (전체 거부 가능) |
| `update` | 참조(브랜치)마다 |
| `post-receive` | 받은 뒤 (알림·배포) |

> ⚠️ **GitHub·GitLab 같은 관리형 서비스에서는 서버 훅을 직접 설정할 수 없습니다.**
> 대신 **브랜치 보호 규칙**([13강](lesson-13.md))과 **GitHub Actions**([27강](lesson-27.md))를 씁니다.
> 사내 Git 서버(Gitea, GitLab self-hosted)라면 직접 설정할 수 있습니다.

### 훅은 커밋되지 않습니다

**결정적인 제약입니다.**

```
.git/hooks/     ←  .git 폴더 안에 있음  →  clone 해도 안 따라옴
```

팀원이 clone해도 훅은 없습니다. **각자 설치해야 합니다.**

**해결책 — `core.hooksPath`**

```bash
mkdir .githooks              # 저장소 안의 일반 폴더
git config core.hooksPath .githooks
```

이러면 `.githooks/` 폴더의 스크립트가 훅으로 동작합니다. **이 폴더는 커밋할 수 있습니다.**

다만 `git config` 명령 자체는 여전히 각자 실행해야 합니다. 그래서 `README.md` 나 `CONTRIBUTING.md` 에 **초기 설정 안내**를 적어 두거나, 설치 스크립트를 제공합니다.

> **프레임워크(pre-commit, husky)를 쓰면 이 설치 과정까지 자동화**됩니다.

### 훅은 우회할 수 있습니다

```bash
git commit --no-verify -m "메시지"     # pre-commit · commit-msg 건너뜀
git push --no-verify                   # pre-push 건너뜀
```

**이것이 훅의 근본적 한계입니다.**

```
훅   →  빠르지만 우회 가능 · 각자 설치
CI   →  느리지만 우회 불가 · 서버에서 강제
```

**둘 다 필요합니다.**

| | 훅 | CI ([27강](lesson-27.md)) |
|---|---|---|
| 실행 위치 | 내 컴퓨터 | 서버 |
| 속도 | 즉시 | 수 분 |
| 우회 | `--no-verify` 로 가능 | **불가능** |
| 설치 | 각자 | 저장소에 설정하면 끝 |
| 역할 | **빠른 1차 방어** | **최종 관문** |

> 훅은 **친절한 알림**이고, CI는 **문지기**입니다. 훅에서 걸리는 것을 CI에서도 검사하는 것이 정석입니다.

### 프레임워크

훅을 직접 관리하는 대신 도구를 쓰면 **설치·공유·업데이트가 자동화**됩니다.

| 도구 | 생태계 | 특징 |
|---|---|---|
| **pre-commit** | Python 기반, **언어 무관** | `.pre-commit-config.yaml` 하나로 관리 |
| **husky** + **lint-staged** | JavaScript | npm 설치 시 자동 등록 |
| **commitlint** | JavaScript | 커밋 메시지 규격 검증 |
| **commitizen** | 여러 언어 | 대화형으로 메시지 작성 |

---

## ④ 단계별 실습

### Step 0. 실험실 만들기

```bash
cd ~/Desktop
mkdir hook-lab && cd hook-lab
git init
git config user.name "Hong Gildong"
git config user.email "hong@example.com"
git config core.autocrlf false
```

```bash
ls .git/hooks/
```

실행 결과:

```
applypatch-msg.sample     pre-commit.sample        pre-receive.sample
commit-msg.sample         pre-merge-commit.sample  prepare-commit-msg.sample
fsmonitor-watchman.sample pre-push.sample          push-to-checkout.sample
post-update.sample        pre-rebase.sample        sendemail-validate.sample
pre-applypatch.sample     update.sample
```

**샘플 하나를 열어 봅시다.**

```bash
head -20 .git/hooks/pre-commit.sample
```

> 기본 제공 샘플들은 그 자체로 좋은 예제입니다. 특히 `pre-commit.sample` 은 **공백 오류와 비ASCII 파일명**을 검사합니다.

### Step 1. `pre-commit` 훅 만들기

**충돌 마커**([11강](lesson-11.md))와 **디버깅 코드**([15강](lesson-15.md))를 막습니다.

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# 1) 충돌 마커 · 공백 오류 검사
git diff --cached --check || exit 1

# 2) 디버깅 코드 검사 — .py 파일만
FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.py')
[ -z "$FILES" ] && { echo "✅ pre-commit 통과 (검사 대상 없음)"; exit 0; }

if git diff --cached -U0 -- $FILES | grep -q '^+.*DEBUG'; then
    echo "❌ 디버깅 코드가 포함되어 있습니다:"
    git diff --cached -U0 -- $FILES | grep '^+.*DEBUG'
    exit 1
fi

echo "✅ pre-commit 통과"
EOF
chmod +x .git/hooks/pre-commit
```

**세 가지 포인트**

| 항목 | 이유 |
|---|---|
| `git diff --cached` | **스테이지된 내용**만 검사 (작업 디렉터리 아님) |
| `--diff-filter=ACM` | 추가·복사·수정된 파일만 (삭제 제외) |
| `exit 1` | 0이 아니면 커밋이 **차단**됨 |

**정상 커밋을 해 봅니다.**

```bash
printf 'print("hello")\n' > app.py
git add app.py
git commit -m "feat: 첫 코드"
```

실행 결과:

```
✅ pre-commit 통과
[main (root-commit) 7104e55] feat: 첫 코드
 1 file changed, 1 insertion(+)
 create mode 100644 app.py
```

### Step 2. 훅이 막는 것 확인하기

```bash
printf 'print("hello")\nprint("DEBUG: 값 확인")\n' > app.py
git add app.py
git commit -m "feat: 기능 추가"
```

실행 결과:

```
❌ 디버깅 코드가 포함되어 있습니다:
+print("DEBUG: 값 확인")
```

```bash
git log --oneline -1
```

**커밋이 안 됐습니다.** 훅이 막았습니다.

**충돌 마커도 막히는지 확인합니다.**

```bash
cat > conflict.txt << 'EOF'
<<<<<<< HEAD
버전 A
=======
버전 B
>>>>>>> feature
EOF
git add conflict.txt
git commit -m "test: 마커 테스트"
```

실행 결과:

```
conflict.txt:1: leftover conflict marker
```

**`git diff --cached --check` 가 잡았습니다.**

**우회 방법도 확인합니다.**

```bash
git commit --no-verify -m "feat: 훅 우회"
git log --oneline -1
```

실행 결과:

```
34214b9 feat: 훅 우회
```

> 🚨 **`--no-verify` 하나로 뚫립니다.**
> 이것이 훅만으로는 부족한 이유입니다. [27강](lesson-27.md)의 CI가 반드시 필요합니다.

정리합니다.

```bash
git reset --hard HEAD~1 -q
rm -f conflict.txt
git checkout -q -- app.py 2>/dev/null || printf 'print("hello")\n' > app.py
```

### Step 3. `commit-msg` 훅 — 메시지 규격 검증

[15강](lesson-15.md)의 Conventional Commits를 강제합니다.

```bash
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/sh
PATTERN='^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?!?: .{1,50}'

if ! head -1 "$1" | grep -qE "$PATTERN"; then
    echo "❌ 커밋 메시지 형식이 올바르지 않습니다."
    echo "   형식: <타입>: <제목>"
    echo "   타입: feat fix docs style refactor perf test chore"
    echo "   입력: $(head -1 "$1")"
    exit 1
fi
EOF
chmod +x .git/hooks/commit-msg
```

> **`$1` 은 커밋 메시지가 들어 있는 임시 파일 경로**(`.git/COMMIT_EDITMSG`)입니다.
> `commit-msg` 훅은 이 파일을 **읽을 수도, 고칠 수도** 있습니다.

**잘못된 메시지로 시도합니다.**

```bash
printf 'print("ok")\n' > app.py
git add app.py
git commit -m "수정함"
```

실행 결과:

```
✅ pre-commit 통과
❌ 커밋 메시지 형식이 올바르지 않습니다.
   형식: <타입>: <제목>
   타입: feat fix docs style refactor perf test chore
   입력: 수정함
```

**올바른 메시지로 시도합니다.**

```bash
git commit -m "fix: 디버깅 코드 제거"
```

실행 결과:

```
✅ pre-commit 통과
[main 1ce2e39] fix: 디버깅 코드 제거
 1 file changed, 1 insertion(+), 2 deletions(-)
```

> **`pre-commit` 이 먼저, `commit-msg` 가 나중**에 실행되는 순서도 확인하세요.

### Step 4. `core.hooksPath` 로 팀 공유하기

지금까지 만든 훅은 `.git/hooks/` 에 있어 **커밋되지 않습니다.** 옮깁니다.

```bash
mkdir .githooks
mv .git/hooks/pre-commit .githooks/
mv .git/hooks/commit-msg .githooks/
git config core.hooksPath .githooks
```

```bash
ls -l .githooks
```

실행 결과:

```
-rwxr-xr-x 1 LEE 197121 379 Aug 10 17:02 commit-msg
-rwxr-xr-x 1 LEE 197121 412 Aug 10 17:02 pre-commit
```

**동작을 확인합니다.**

```bash
printf 'print("ok")\nprint("DEBUG: x")\n' > app.py
git add app.py
git commit -m "test: 훅 확인"
```

실행 결과:

```
❌ 디버깅 코드가 포함되어 있습니다:
+print("DEBUG: x")
```

**여전히 동작합니다.** 이제 커밋할 수 있습니다.

```bash
git checkout -q -- app.py
git add .githooks
git commit -m "chore: 공유 훅 추가"
```

**팀원을 위한 설치 안내**를 `README.md` 에 넣습니다.

```markdown
## 개발 환경 설정

clone 후 한 번 실행해 주세요.

```bash
git config core.hooksPath .githooks
```
```

**설치 스크립트로 만들어 두면 더 좋습니다.**

```bash
cat > setup.sh << 'EOF'
#!/bin/sh
git config core.hooksPath .githooks
chmod +x .githooks/*
echo "✅ Git 훅이 설정되었습니다."
EOF
chmod +x setup.sh
git add setup.sh && git commit -qm "chore: 훅 설치 스크립트 추가"
```

> ⚠️ **Windows에서는 실행 권한이 유실될 수 있습니다.** 그래서 설치 스크립트에 `chmod +x` 를 넣어 둡니다.
> Git은 실행 권한을 `100755` 모드로 저장하므로([21강](lesson-21.md)) 대부분 유지되지만, 안전장치를 두는 편이 낫습니다.

### Step 5. `pre-push` 훅 — 보호 브랜치 차단

`main` 에 직접 push하는 것을 로컬에서 막습니다 ([13강](lesson-13.md)).

```bash
cat > .githooks/pre-push << 'EOF'
#!/bin/sh
protected="main"

while read local_ref local_sha remote_ref remote_sha; do
    branch=$(echo "$remote_ref" | sed 's|refs/heads/||')
    if [ "$branch" = "$protected" ]; then
        echo "❌ $protected 브랜치에 직접 push할 수 없습니다. PR을 사용하세요."
        exit 1
    fi
done
exit 0
EOF
chmod +x .githooks/pre-push
git add .githooks && git commit -qm "chore: pre-push 훅 추가"
```

> **`pre-push` 훅은 stdin으로 push 대상 목록을 받습니다.**
> ```
> <local ref> <local sha> <remote ref> <remote sha>
> ```
> 한 줄씩 읽어 어느 브랜치로 가는지 판단합니다.

**테스트합니다.**

```bash
cd ~/Desktop
git init --bare hook-remote.git
cd hook-lab
git remote add origin ../hook-remote.git
git push origin main
```

실행 결과:

```
❌ main 브랜치에 직접 push할 수 없습니다. PR을 사용하세요.
error: failed to push some refs to '../hook-remote.git'
```

**다른 브랜치는 통과합니다.**

```bash
git switch -c feature/x
git push origin feature/x
```

실행 결과:

```
...
 * [new branch]      feature/x -> feature/x
```

```bash
git switch main
```

**테스트를 돌리는 `pre-push` 도 흔한 형태입니다.**

```sh
#!/bin/sh
echo "테스트 실행 중..."
python -m pytest -q || {
    echo "❌ 테스트 실패. push를 중단합니다."
    exit 1
}
```

> **`pre-commit` 이 아니라 `pre-push` 에 테스트를 두는 이유** — 테스트는 느립니다.
> 커밋마다 30초씩 기다리면 커밋을 안 하게 됩니다. **커밋은 가볍게, push는 무겁게**가 실무 감각입니다.

### Step 6. `pre-commit` 프레임워크 (권장)

훅을 직접 관리하는 대신 도구를 쓰면 훨씬 편합니다. **언어와 무관하게** 쓸 수 있습니다.

```bash
pip install pre-commit
```

`.pre-commit-config.yaml` 을 만듭니다.

```yaml
repos:
  # 기본 검사 모음
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: check-merge-conflict      # 충돌 마커
      - id: trailing-whitespace       # 줄 끝 공백
      - id: end-of-file-fixer         # 파일 끝 개행
      - id: check-added-large-files   # 큰 파일 차단
        args: ['--maxkb=1000']
      - id: check-yaml
      - id: check-json
      - id: detect-private-key        # ⭐ 비밀키 차단 (05강)

  # 파이썬 포맷터
  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black

  # 커밋 메시지 검증
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.2.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

```bash
pre-commit install                          # pre-commit 훅 설치
pre-commit install --hook-type commit-msg   # commit-msg 훅도
```

실행 결과:

```
pre-commit installed at .git/hooks/pre-commit
pre-commit installed at .git/hooks/commit-msg
```

**전체 파일에 한 번 돌려 보기**

```bash
pre-commit run --all-files
```

**장점**

| 장점 | 설명 |
|---|---|
| **자동 설치** | `pre-commit install` 한 줄 |
| **버전 고정** | `rev` 로 팀 전체가 같은 도구 버전 |
| **캐시** | 도구를 자동 설치·캐시 |
| **CI 재사용** | [27강](lesson-27.md)에서 같은 설정을 그대로 사용 |
| **`detect-private-key`** | [05강](lesson-05.md)의 사고를 원천 차단 |

> **`detect-private-key` 하나만으로도 도입 가치가 있습니다.** `.env` 나 `id_rsa` 가 커밋되는 사고를 막습니다.

### Step 7. husky + lint-staged (JavaScript)

Node 프로젝트라면 이쪽이 표준입니다.

```bash
npm install --save-dev husky lint-staged
npx husky init
```

`package.json` 에 추가합니다.

```json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

`.husky/pre-commit` :

```sh
npx lint-staged
```

`.husky/commit-msg` :

```sh
npx --no -- commitlint --edit "$1"
```

> **`lint-staged` 의 핵심 가치** — **스테이지된 파일만** 검사합니다.
> 저장소 전체에 린터를 돌리면 몇 분씩 걸리지만, 방금 고친 파일 3개만 검사하면 1초입니다.

**husky는 `npm install` 시점에 훅을 자동 설치**하므로, 팀원이 `core.hooksPath` 를 설정할 필요가 없습니다. 이것이 프레임워크의 가장 큰 이점입니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| 훅 동작 확인 | VS Code Source Control에서 커밋 시 **오류가 출력 패널에 표시** |
| 훅 우회 | VS Code `···` → **Commit (no verify)** |
| 훅 편집 | 그냥 파일 편집 (GUI 전용 기능 없음) |

> ⚠️ **VS Code에서 커밋이 실패하면 원인이 잘 안 보일 수 있습니다.**
> `View → Output → Git` 패널을 열면 훅의 출력이 나옵니다. 훅을 도입할 때 팀에 알려 주세요.

---

## ⑤ 자주 하는 실수

### 훅이 실행되지 않음

**확인 순서**

```bash
ls -l .git/hooks/pre-commit          # ① 파일이 있나
                                     # ② 이름이 정확한가 (.sample, .sh 없이)
                                     # ③ 실행 권한(x)이 있나
head -1 .git/hooks/pre-commit        # ④ shebang 이 있나
git config core.hooksPath            # ⑤ 다른 경로로 설정돼 있나
```

**가장 흔한 원인 셋**

```bash
chmod +x .git/hooks/pre-commit                    # 권한 없음
mv .git/hooks/pre-commit.sample .git/hooks/pre-commit   # .sample 안 뗌
# 첫 줄에 #!/bin/sh 없음
```

> **`core.hooksPath` 를 설정했다면 `.git/hooks/` 는 무시됩니다.** 둘 다 있으면 헷갈리니 하나만 쓰세요.

### 훅이 자기 자신을 검사해서 막힘

**실제로 겪는 함정입니다.**

```bash
git add .githooks/pre-commit
git commit -m "chore: 훅 추가"
```

```
❌ 디버깅 코드가 포함되어 있습니다:
+if git diff --cached | grep '^+.*DEBUG'; then
```

**원인** — 훅 스크립트 안에 검사 패턴(`DEBUG`)이 문자열로 들어 있어서, 훅이 자기 소스 코드를 잡았습니다.
**해결** — 검사 대상을 좁히세요.

```sh
FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.py')   # 확장자 제한
```

또는 훅 디렉터리를 제외합니다.

```sh
FILES=$(git diff --cached --name-only | grep -v '^\.githooks/')
```

### 작업 디렉터리를 검사해서 오탐

```sh
grep -r "DEBUG" .        # ❌ 스테이지 안 한 파일까지 검사
```

**원인** — `pre-commit` 은 **스테이지된 내용**을 검사해야 합니다. 작업 디렉터리에는 커밋하지 않을 변경도 있습니다.
**해결** —

```sh
git diff --cached --name-only --diff-filter=ACM     # 스테이지된 파일 목록
git diff --cached -U0 -- <파일>                      # 스테이지된 변경 내용
```

> **더 정확하게 하려면** 스테이지된 내용만 임시 폴더에 꺼내 검사합니다. `pre-commit` 프레임워크가 이걸 자동으로 해 줍니다.

### 훅이 너무 느려서 아무도 안 씀

**증상** — 커밋할 때마다 30초씩 걸리자 팀원들이 `--no-verify` 를 쓰기 시작합니다.
**해결** — **시점별로 나누세요.**

| 훅 | 넣을 것 | 목표 시간 |
|---|---|---|
| `pre-commit` | 린트·포맷·비밀정보 검사 (**변경 파일만**) | **1~3초** |
| `pre-push` | 단위 테스트 | 10~30초 |
| CI ([27강](lesson-27.md)) | 전체 테스트·빌드·통합 테스트 | 몇 분 |

**변경 파일만 검사하는 것이 핵심입니다.**

```sh
FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.py')
[ -z "$FILES" ] && exit 0
black --check $FILES
```

`lint-staged` 나 `pre-commit` 프레임워크는 이걸 기본으로 해 줍니다.

### 훅을 만들었는데 팀원에게 적용 안 됨

**원인** — `.git/hooks/` 는 **커밋되지 않습니다.**
**해결** — `core.hooksPath` 를 쓰거나 프레임워크를 도입하세요.

```bash
mkdir .githooks && git config core.hooksPath .githooks
```

⚠️ **`git config` 는 여전히 각자 실행해야 합니다.** 안내를 어디에 둘지가 중요합니다.

- `README.md` 상단의 "개발 환경 설정"
- `setup.sh` 설치 스크립트
- **프레임워크** (husky는 `npm install` 시 자동, pre-commit은 `pre-commit install`)

### `--no-verify` 가 남용됨

**증상** — 훅을 만들었는데 아무도 안 걸립니다.
**원인** — 훅이 느리거나, 오탐이 많거나, 규칙에 동의하지 않기 때문입니다.
**해결** — 두 방향으로 접근하세요.

1. **훅을 빠르고 정확하게** — 오탐이 잦으면 신뢰를 잃습니다
2. **CI에서 같은 검사를 반복** — 우회해도 PR에서 걸립니다 ([27강](lesson-27.md))

> **훅은 "빨리 알려 주는 친절"이고, CI는 "통과해야 하는 관문"입니다.**
> 훅만으로 강제하려 하면 실패합니다.

### 훅에서 대화형 입력을 시도

```sh
read -p "정말 커밋하시겠습니까? (y/n) " answer     # ❌
```

**증상** — GUI 도구에서 커밋이 멈추거나 실패합니다.
**원인** — 훅은 stdin이 연결되지 않은 상태로 실행될 수 있습니다.
**해결** — 대화형 입력을 쓰지 마세요. 꼭 필요하다면 터미널을 직접 엽니다.

```sh
exec < /dev/tty      # 터미널 연결 (GUI 에서는 여전히 위험)
```

### Windows에서 실행 권한이 유실됨

**증상** — 팀원(macOS/Linux)에게서는 되는데 Windows에서 안 됩니다. 또는 그 반대.
**해결** —

```bash
git update-index --chmod=+x .githooks/pre-commit
git commit -m "chore: 훅 실행 권한 부여"
```

Git은 실행 권한을 `100755` 모드로 저장합니다 ([21강](lesson-21.md)). 위 명령으로 명시적으로 지정할 수 있습니다.

설치 스크립트에 `chmod +x .githooks/*` 를 넣어 두는 것도 좋습니다.

---

## ⑥ 확인 문제

**1.** `.env` 파일이 커밋되는 것을 막는 `pre-commit` 훅을 작성해 보세요. 그리고 **이것만으로 충분한지** 답하세요.

<details>
<summary>답 보기</summary>

**훅 작성**

```sh
#!/bin/sh
# 비밀 파일 차단
BLOCKED=$(git diff --cached --name-only --diff-filter=ACM \
          | grep -E '(^|/)\.env$|\.pem$|id_rsa$|credentials\.json$')

if [ -n "$BLOCKED" ]; then
    echo "❌ 비밀 정보 파일이 포함되어 있습니다:"
    echo "$BLOCKED"
    echo ""
    echo "제외하려면: git restore --staged <파일>"
    exit 1
fi

# 내용으로도 검사
if git diff --cached -U0 | grep -qE '(api[_-]?key|password|secret)\s*=\s*["\x27][^"\x27]{8,}'; then
    echo "❌ 비밀 정보로 보이는 값이 포함되어 있습니다."
    exit 1
fi
```

```bash
chmod +x .githooks/pre-commit
```

**충분한가 — 아닙니다. 세 가지가 더 필요합니다.**

**① `.gitignore`** ([05강](lesson-05.md))

애초에 스테이지에 올라오지 않게 하는 것이 1차 방어입니다.

```gitignore
.env
*.pem
```

**② CI 검사** ([27강](lesson-27.md))

`--no-verify` 로 우회하면 훅은 무력합니다. 서버에서 다시 검사해야 합니다.

```yaml
- uses: gitleaks/gitleaks-action@v2
```

**③ 비밀 관리 도구**

애초에 파일로 두지 않는 것이 근본 해결입니다. GitHub Secrets, AWS Secrets Manager, Vault 등.

**그리고 이미 커밋된 경우의 대응 절차** ([29강](lesson-29.md))

```
1. 키를 즉시 무효화·재발급    ← 가장 중요
2. .gitignore 추가
3. 이력에서 제거 (filter-repo)
4. 팀에 재clone 안내
```

**검증된 도구를 쓰는 것이 낫습니다.**

```yaml
# .pre-commit-config.yaml
- repo: https://github.com/pre-commit/pre-commit-hooks
  hooks:
    - id: detect-private-key
- repo: https://github.com/gitleaks/gitleaks
  hooks:
    - id: gitleaks
```
</details>

**2.** 팀에서 훅을 도입했는데 몇 주 뒤 확인해 보니 절반이 `--no-verify` 를 쓰고 있습니다. **원인과 대책**은?

<details>
<summary>답 보기</summary>

**원인은 대개 셋 중 하나입니다.**

**① 너무 느리다**

커밋마다 20초 이상 걸리면 반드시 우회하게 됩니다.

**대책 — 시점을 나누고, 변경 파일만 검사**

```
pre-commit  →  1~3초  (변경 파일만 린트·포맷)
pre-push    →  10~30초 (단위 테스트)
CI          →  몇 분   (전체)
```

```sh
FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.py')
[ -z "$FILES" ] && exit 0
black --check $FILES        # 전체가 아니라 변경분만
```

`lint-staged`(JS)나 `pre-commit`(Python) 프레임워크가 이걸 기본으로 해 줍니다.

**② 오탐이 많다**

정상 코드가 자꾸 막히면 신뢰를 잃습니다.

**대책** — 검사 범위를 좁히고, 확실한 것만 차단하세요. 애매한 것은 **경고만** 출력하고 통과시킵니다.

```sh
echo "⚠️  TODO 주석이 있습니다 (커밋은 진행됩니다)"
exit 0
```

**③ 규칙에 동의하지 않는다**

일방적으로 도입했다면 반발이 생깁니다.

**대책** — 규칙을 함께 정하고 `CONTRIBUTING.md` 에 **이유와 함께** 적으세요 ([13강](lesson-13.md)).

**근본 대책 — CI를 함께 두기** ([27강](lesson-27.md))

```
훅   →  1차 방어. 빠르고 친절. 우회 가능
CI   →  최종 관문. 우회 불가
```

같은 검사를 CI에도 두면, `--no-verify` 로 넘어가도 **PR에서 막힙니다.**

```yaml
- name: Lint
  run: pre-commit run --all-files
```

브랜치 보호 규칙에서 이 검사를 **필수 통과 조건**으로 지정하면 완성됩니다.

**핵심 관점 전환**
> **훅은 강제 수단이 아니라 편의 수단입니다.**
> "CI에서 걸릴 것을 미리 알려 주는 것"이 훅의 역할입니다. 그렇게 설명하면 팀도 우회할 이유가 줄어듭니다.
</details>

**3.** 훅과 CI(GitHub Actions)의 역할을 비교하고, **각각 무엇을 넣어야 하는지** 정리해 보세요.

<details>
<summary>답 보기</summary>

| | **훅** | **CI** |
|---|---|---|
| 실행 위치 | 내 컴퓨터 | 서버 |
| 실행 시점 | 커밋·push **직전** | push·PR **이후** |
| 속도 | 1~30초 | 수 분 |
| 우회 | `--no-verify` 로 **가능** | **불가능** |
| 설치 | 각자 (또는 프레임워크) | 저장소에 설정하면 끝 |
| 환경 | 사람마다 다름 | **일정함** |
| 피드백 | 즉시 | 몇 분 뒤 |
| 역할 | **빠른 1차 방어** | **최종 관문** |

**훅에 넣을 것 — 빠르고 확실한 것**

```
✅ 포맷터 (black, prettier) — 변경 파일만
✅ 린터 — 변경 파일만
✅ 충돌 마커 검사
✅ 비밀정보 검사 (detect-private-key)
✅ 큰 파일 차단
✅ 커밋 메시지 형식 (commit-msg)
✅ 보호 브랜치 push 차단 (pre-push)
```

**CI에 넣을 것 — 느리지만 반드시 통과해야 하는 것**

```
✅ 전체 테스트 스위트
✅ 여러 OS·버전 조합 테스트
✅ 빌드
✅ 커버리지 측정
✅ 보안 스캔 (의존성 취약점)
✅ 훅에서 하던 검사 전부 (우회 대비)
```

**핵심 원칙 — 겹치게 두세요**

```
훅에서 검사하는 것은 CI 에서도 검사한다
```

훅은 우회 가능하고 설치 안 한 사람도 있으므로, **CI가 마지막 방어선**이어야 합니다.

**설정을 공유하면 중복이 사라집니다.**

```yaml
# .github/workflows/ci.yml
- run: pre-commit run --all-files     # 훅과 완전히 같은 설정 재사용
```

`.pre-commit-config.yaml` 하나로 로컬 훅과 CI가 **똑같은 검사**를 하게 됩니다.

**마무리 — 브랜치 보호와 연결** ([13강](lesson-13.md)·[27강](lesson-27.md))

CI 검사를 **필수 통과 조건**으로 지정하면, 실패한 PR은 병합 버튼 자체가 비활성화됩니다. 이때 비로소 규칙이 진짜로 강제됩니다.
</details>

---

## 오늘의 정리

**훅이란**

```
.git/hooks/ 의 실행 가능한 스크립트
  → 이름 정확 · chmod +x · shebang · 종료 코드 0 아니면 차단
```

**주요 클라이언트 훅**

| 훅 | 시점 | 인자 | 넣을 것 |
|---|---|---|---|
| **`pre-commit`** | 커밋 전 | 없음 | 린트·포맷·비밀정보 (**1~3초**) |
| **`commit-msg`** | 메시지 작성 후 | `$1` 메시지 파일 | 메시지 형식 검증 |
| **`pre-push`** | push 직전 | stdin으로 ref 목록 | 테스트·보호 브랜치 |
| `post-commit` / `post-merge` | 완료 후 | — | 알림 (차단 불가) |

**검사 대상은 스테이지**

```bash
git diff --cached --name-only --diff-filter=ACM     # 파일 목록
git diff --cached -U0 -- <파일>                      # 변경 내용
git diff --cached --check                            # 충돌 마커·공백
```

**팀 공유**

```bash
mkdir .githooks
git config core.hooksPath .githooks      # ← 각자 한 번 실행 필요
git add .githooks && git commit
```

**프레임워크 (권장)**

| 도구 | 설정 파일 | 설치 |
|---|---|---|
| **pre-commit** (언어 무관) | `.pre-commit-config.yaml` | `pre-commit install` |
| **husky + lint-staged** (JS) | `package.json`, `.husky/` | `npm install` 시 자동 |

**한계와 보완**

```
훅  →  빠름 · 친절 · 우회 가능(--no-verify) · 각자 설치
CI  →  느림 · 강제 · 우회 불가 · 서버에서 실행

→ 훅에서 검사하는 것은 CI 에서도 검사한다  (27강)
```

**오늘 반드시 기억할 한 가지**
> **`pre-commit` 은 1~3초 안에 끝나야 합니다.** 느리면 아무도 안 씁니다.
> 그리고 훅은 우회 가능하므로, **진짜 강제는 CI + 브랜치 보호**로 합니다.

**과제**
1. `pre-commit` 훅을 만들어 충돌 마커와 디버깅 코드를 차단해 보세요.
2. 훅이 막는 것을 확인한 뒤 `--no-verify` 로 우회되는 것도 확인하세요.
3. `commit-msg` 훅으로 Conventional Commits 형식을 강제해 보세요.
4. `core.hooksPath` 로 `.githooks/` 를 커밋해 팀 공유가 가능하게 만드세요.
5. `pre-push` 훅으로 `main` 직접 push를 막고, 다른 브랜치는 통과하는지 확인하세요.
6. `pre-commit` 프레임워크를 설치하고 `detect-private-key` · `check-merge-conflict` 를 적용해 보세요.

---

[← 이전 25강](lesson-25.md) · [목차](README.md) · [다음 → 27강 GitHub Actions 기초](lesson-27.md)
