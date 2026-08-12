# 29강 · 히스토리 재작성과 사고 대응

> **Git 학습 매뉴얼** · 🔴 고급 · **29강 / 30**
> [← 이전 28강](lesson-28.md) · [목차](README.md) · [다음 → 30강 고급 종합 실습](lesson-30.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- **비밀키 유출 사고**의 대응 절차를 순서대로 실행할 수 있다.
- `git filter-repo` 로 이력에서 파일·값·큰 파일을 제거할 수 있다.
- 이력 재작성이 팀에 미치는 영향을 알고 **공지·재clone 절차**를 진행할 수 있다.
- 잘못된 force push 사고를 복구할 수 있다.
- 재발을 막는 장치를 저장소에 심을 수 있다.

---

## ② 왜 필요한가

[21강](lesson-21.md)에서 배운 성질이 여기서 문제가 됩니다.

> **Git 객체는 불변입니다. 삭제조차 "삭제했다는 사실을 추가"하는 방식으로 기록합니다.**

```bash
git rm .env
git commit -m "chore: 환경 파일 삭제"
```

**키는 그대로 살아 있습니다.**

```bash
git show HEAD~1:.env
API_KEY=sk-live-SECRET1234567890
```

그리고 이미 push했다면 GitHub 서버, 팀원 로컬, fork, CI 캐시에 전부 복제되어 있습니다.

**오늘 다루는 상황**

| 상황 | 긴급도 |
|---|---|
| **비밀키·비밀번호를 커밋했다** | 🚨 최고 |
| 100MB 파일을 커밋해 저장소가 무거워졌다 | 중 |
| 잘못된 이메일로 수백 개 커밋을 했다 | 하 |
| 팀원이 `--force` push로 커밋을 날렸다 | 🚨 높음 |

> ⚠️ **오늘의 명령들은 이 커리큘럼에서 가장 위험합니다.**
> **모든 커밋 해시가 바뀌고**, 팀 전원이 영향을 받습니다. 반드시 **백업 후 합의하고** 진행하세요.

---

## ③ 개념 설명

### 이력 재작성이란

**과거 커밋의 내용을 바꿔서 저장소를 다시 만드는 것**입니다.

```
전:  A ── B ── C ── D        (B 에 .env 가 들어 있음)
              ↓
후:  A' ── C' ── D'          (B 는 사라지거나 내용이 바뀜)
     ↑     ↑     ↑
   모든 해시가 바뀝니다
```

[21강](lesson-21.md)에서 본 대로 커밋 객체는 **tree와 parent를 포함해 해시**됩니다. 하나가 바뀌면 그 뒤 전부가 바뀝니다.

**파급 효과**

| 영향 | 설명 |
|---|---|
| 모든 커밋 해시 변경 | 이슈·PR·문서의 해시 링크가 전부 깨짐 |
| 팀원 로컬과 불일치 | **전원 재clone 필요** |
| 태그 재지정 | 태그가 사라진 커밋을 가리킬 수 있음 ([19강](lesson-19.md)) |
| 열려 있는 PR | 대부분 깨짐 → 다시 만들어야 함 |
| fork | 원본과 무관해짐 (개별 대응 필요) |

### 🚨 비밀 유출 대응 절차 — 순서가 중요합니다

```
① 키·비밀번호를 즉시 무효화하고 재발급   ← 이게 전부입니다
② 노출 범위·기간 파악 (로그 확인)
③ .gitignore 에 추가 · 재발 방지 장치
④ 이력에서 제거 (filter-repo)
⑤ 팀 공지 · 전원 재clone
```

> 🔑 **①이 나머지 넷을 합친 것보다 중요합니다.**
> 이력을 아무리 깨끗이 지워도 **유출된 키가 살아 있으면 의미가 없습니다.**
> 공개 저장소는 봇이 수 분 내에 수집합니다. 비공개여도 fork·clone·백업에 남아 있습니다.
>
> **"지우면 없던 일이 된다"는 생각을 버리세요.** 노출된 순간 그 키는 죽은 것으로 취급해야 합니다.

### 도구 비교

| 도구 | 상태 | 특징 |
|---|---|---|
| **`git filter-repo`** | **권장** | 빠르고 안전. Git 공식 문서가 권장 |
| **BFG Repo-Cleaner** | 대안 | Java 기반. 큰 저장소에 빠름 |
| `git filter-branch` | **폐기** | 느리고 함정이 많음. Git이 경고를 띄움 |

`filter-branch` 를 실행하면 Git이 직접 경고합니다.

```
WARNING: git-filter-branch has a glut of gotchas generating mangled history
	 rewrites.  Hit Ctrl-C before proceeding to abort, then use an
	 alternative filtering tool such as 'git filter-repo'
```

> **`filter-branch` 를 쓰지 마세요.** 오래된 블로그에 많이 나오지만 Git 자체가 말리고 있습니다.

### `filter-repo` 의 안전장치

`filter-repo` 는 실수를 막기 위해 이런 동작을 합니다.

| 동작 | 이유 |
|---|---|
| **신선한 clone에서만 실행** (아니면 `--force` 요구) | 작업 중인 변경 보호 |
| **`origin` 원격을 자동 제거** | 실수로 push하는 것 방지 |
| reflog·원본 참조 삭제 | 옛 객체가 남지 않게 |

---

## ④ 단계별 실습

### Step 0. 유출 실험실 만들기

> ⚠️ **반드시 새 실험용 저장소에서** 하세요.

```bash
cd ~/Desktop
mkdir leak-lab && cd leak-lab
git init
git config user.name "Hong Gildong" && git config user.email "hong@example.com"
git config core.autocrlf false

printf 'print("app")\n' > app.py
git add . && git commit -qm "feat: 앱 초기"

printf 'API_KEY=sk-live-SECRET1234567890\nDB_PASSWORD=p@ssw0rd\n' > .env
git add .env && git commit -qm "chore: 환경 설정 추가"        # 🚨 사고 발생

printf 'print("more")\n' >> app.py
git add . && git commit -qm "feat: 기능 추가"

head -c 3000 /dev/urandom > big.bin
git add big.bin && git commit -qm "chore: 임시 데이터"

printf 'print("final")\n' >> app.py
git add . && git commit -qm "feat: 마무리"
```

```bash
git log --oneline
```

실행 결과:

```
f175666 feat: 마무리
7ec137d chore: 임시 데이터
ec9dd19 feat: 기능 추가
3b5cd30 chore: 환경 설정 추가
20f778f feat: 앱 초기
```

### Step 1. 유출 범위 파악

**어느 커밋에 들어 있는지**

```bash
git log --all --oneline -- .env
```

실행 결과:

```
3b5cd30 chore: 환경 설정 추가
```

**전체 이력에서 값 자체를 검색** ([25강](lesson-25.md))

```bash
git grep -n "sk-live" $(git rev-list --all)
```

실행 결과:

```
f1756668be6b8fa4d2babe79635217c54d9f666b:.env:1:API_KEY=sk-live-SECRET1234567890
7ec137d4ba08356869bb6db317cc1153c0de39d3:.env:1:API_KEY=sk-live-SECRET1234567890
ec9dd192cd8fa706959beb47fef9dfe6f623f8d0:.env:1:API_KEY=sk-live-SECRET1234567890
```

> 🚨 **커밋 3개에서 조회됩니다.** `.env` 를 추가한 뒤의 **모든 커밋**에서 그 시점 파일로 존재합니다.
> [21강](lesson-21.md)에서 본 대로, 각 커밋의 tree가 같은 blob을 계속 가리키기 때문입니다.

**내용 직접 확인**

```bash
git show 3b5cd30:.env
```

실행 결과:

```
API_KEY=sk-live-SECRET1234567890
DB_PASSWORD=p@ssw0rd
```

**이 시점에서 해야 할 진짜 첫 번째 일** — 실습이 아니라면 **여기서 명령을 멈추고** 키를 재발급받으러 가야 합니다.

| 확인할 것 | 어디서 |
|---|---|
| 언제 push됐나 | `git log --format="%ci %h %s" -- .env` |
| 공개 저장소였나 | GitHub 저장소 설정 |
| fork가 있나 | GitHub → Insights → Forks |
| 그 키로 무슨 일이 있었나 | **클라우드 제공자의 접근 로그** |

### Step 2. `git filter-repo` 설치

```bash
pip install git-filter-repo
git filter-repo --version
```

> Homebrew: `brew install git-filter-repo`
> Windows에서 pip으로 설치했는데 `git: 'filter-repo' is not a git command` 가 나오면,
> `filter-repo` 스크립트를 Git의 `libexec/git-core/` 폴더에 복사하거나 PATH를 확인하세요.

**작업 전 백업은 필수입니다.**

```bash
cd ~/Desktop
cp -r leak-lab leak-lab-backup       # PowerShell: Copy-Item -Recurse
```

> `filter-repo` 는 되돌릴 수 없습니다. **원본 사본을 반드시 남기세요.**

### Step 3. 파일을 이력에서 통째로 제거

```bash
cd ~/Desktop/leak-lab
git filter-repo --path .env --invert-paths --force
```

실행 결과:

```
Parsed 5 commits
HEAD is now at 1eb2b57 feat: 마무리

New history written in 0.12 seconds; now repacking/cleaning...
Repacking your repo and cleaning out old unneeded objects
Completely finished after 0.42 seconds.
```

| 옵션 | 뜻 |
|---|---|
| `--path .env` | 이 경로를 대상으로 |
| `--invert-paths` | **대상을 제외**하고 나머지를 유지 (없으면 이것만 남김) |
| `--force` | 신선한 clone이 아니어도 실행 |

**결과 확인**

```bash
git log --oneline
```

실행 결과:

```
1eb2b57 feat: 마무리
3dcef9c chore: 임시 데이터
ff4481c feat: 기능 추가
20f778f feat: 앱 초기
```

> 🔑 **두 가지가 일어났습니다.**
> **① `chore: 환경 설정 추가` 커밋이 통째로 사라졌습니다.** `.env` 만 담긴 커밋이라 비게 되어 제거된 것입니다.
> **② 그 뒤 커밋들의 해시가 전부 바뀌었습니다.** (`ec9dd19` → `ff4481c` 등). 첫 커밋 `20f778f` 만 그대로입니다.

**흔적 검증**

```bash
git log --all --oneline -- .env
git grep -n "sk-live" $(git rev-list --all)
```

**둘 다 아무것도 출력되지 않으면 성공**입니다.

**원격 확인**

```bash
git remote -v
```

실행 결과:

```
(비어 있음)
```

> **`filter-repo` 가 `origin` 을 제거했습니다.** 실수로 push하는 것을 막기 위한 안전장치입니다.
> 의도적으로 다시 등록해야 합니다.

**여러 경로를 한 번에**

```bash
git filter-repo --path .env --path secrets/ --path config/prod.json --invert-paths --force
git filter-repo --path-glob '*.pem' --invert-paths --force
git filter-repo --path-regex '.*credentials.*' --invert-paths --force
```

### Step 4. 값만 치환하기 (`--replace-text`)

파일은 남기고 **비밀 값만 지우고 싶을 때** 씁니다.

```bash
cd ~/Desktop
cp -r leak-lab-backup leak-lab2 && cd leak-lab2
```

치환 규칙 파일을 만듭니다.

```bash
cat > ../replace.txt << 'EOF'
sk-live-SECRET1234567890==>REMOVED
regex:DB_PASSWORD=.*==>DB_PASSWORD=REMOVED
EOF
```

| 형식 | 뜻 |
|---|---|
| `문자열==>대체값` | 문자열 그대로 치환 |
| `regex:패턴==>대체값` | 정규식 |
| `문자열` (화살표 없음) | `***REMOVED***` 로 치환 |

```bash
git filter-repo --replace-text ../replace.txt --force
```

**결과 확인**

```bash
git cat-file -p $(git rev-list --all -- .env | head -1):.env
```

실행 결과:

```
API_KEY=REMOVED
DB_PASSWORD=REMOVED
```

**파일과 커밋은 그대로 남고 값만 바뀌었습니다.**

> **어떤 방식을 고를까**
> **파일 자체가 필요 없다** (`.env`, `*.pem`) → `--path --invert-paths`
> **파일은 필요한데 값만 잘못 들어갔다** (설정 파일에 하드코딩) → `--replace-text`

### Step 5. 큰 파일 제거

```bash
cd ~/Desktop/leak-lab
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k3 -n -r | head -3
```

실행 결과:

```
blob b0ac8524f1124350e7a513b2dd7e1edf708b39b0 3000 big.bin
blob 098b746eafabd049904b551b5e2c0bd223566935 42 app.py
blob 865bec40fa40852e3d98842d4aca189e723fcc84 27 app.py
```

**크기 기준으로 한 번에 제거합니다.**

```bash
git filter-repo --strip-blobs-bigger-than 1K --force
```

> 실무에서는 `10M`, `50M` 같은 값을 씁니다.

```bash
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k3 -n -r | head -3
git log --oneline
```

실행 결과:

```
blob 098b746eafabd049904b551b5e2c0bd223566935 42 app.py
blob 865bec40fa40852e3d98842d4aca189e723fcc84 27 app.py
blob 84ca154c51756aebc0a58d22269227705dda5208 13 app.py
ac427dc feat: 마무리
ff4481c feat: 기능 추가
20f778f feat: 앱 초기
```

**`big.bin` 이 사라졌고, 그것만 담겼던 커밋도 제거됐습니다.**

**계속 필요한 큰 파일이라면 LFS로 옮기세요** ([28강](lesson-28.md)).

```bash
git lfs migrate import --include="*.psd" --everything
```

### Step 6. 작성자 정보 일괄 수정

[02강](lesson-02.md)에서 이메일을 잘못 설정한 채 수백 개를 커밋한 경우입니다.

```bash
git log -1 --format="%an <%ae>"
```

실행 결과:

```
Hong Gildong <hong@example.com>
```

**mailmap 파일을 만듭니다.**

```bash
cat > ../mailmap.txt << 'EOF'
Hong Gildong <new@example.com> <hong@example.com>
EOF
```

형식: `올바른 이름 <올바른 메일> <바꿀 메일>`

```bash
git filter-repo --mailmap ../mailmap.txt --force
git log --format="%an <%ae>" | sort -u
```

실행 결과:

```
Hong Gildong <new@example.com>
```

> ⚠️ **이력을 다시 쓰지 않고 표시만 바꾸는 방법도 있습니다.**
> 저장소 루트에 `.mailmap` 파일을 두면 `git log`, `git shortlog` 가 알아서 매핑합니다.
> ```
> Hong Gildong <new@example.com> <hong@example.com>
> ```
> **커밋 해시가 안 바뀌므로 훨씬 안전합니다.** 표시만 정리하면 되는 경우에는 이쪽을 쓰세요.

### Step 7. 원격 반영과 팀 공지

**① 원격 다시 등록**

```bash
git remote add origin https://github.com/<아이디>/<저장소>.git
```

**② 브랜치 보호를 잠시 해제** ([13강](lesson-13.md))

force push가 막혀 있으므로 Settings → Branches에서 `Allow force pushes` 를 임시로 켭니다.

**③ 강제 push**

```bash
git push --force --all
git push --force --tags
```

> 이력을 통째로 갈아치우는 것이므로 `--force-with-lease` 가 아니라 `--force` 를 씁니다.
> **이 강은 이 커리큘럼에서 `--force` 를 쓰는 유일한 곳입니다.**

**④ 보호 규칙 즉시 복구**

`Allow force pushes` 를 다시 끄세요. **가장 잊기 쉬운 단계**입니다.

**⑤ 팀 공지 — 이 문구를 그대로 쓰세요**

```markdown
## [긴급] 저장소 이력 재작성 안내

**언제**: 2026-08-10 15:00
**왜**: .env 파일이 이력에 포함되어 있어 제거했습니다.
**영향**: 모든 커밋 해시가 변경되었습니다.

### 모든 팀원이 해야 할 일

1. **작업 중인 내용을 백업하세요.**
   ```bash
   git stash list
   git log --oneline @{u}..     # push 안 한 커밋 확인
   git format-patch origin/main # 필요하면 패치로 저장
   ```

2. **기존 폴더를 지우고 다시 clone하세요.**
   ```bash
   cd ..
   mv project project-old        # 지우지 말고 이름만 변경
   git clone <주소> project
   ```

3. **열려 있던 PR은 다시 만들어 주세요.**

### ⚠️ 하지 마세요
- `git pull` 로 합치려 하지 마세요. 옛 이력이 되살아납니다.
- `git rebase` 로 옮기려 하지 마세요.

### 재발 방지
- `.env` 는 `.gitignore` 에 추가했습니다.
- pre-commit 훅에 `detect-private-key` 를 넣었습니다.
- CI에 gitleaks 검사를 추가했습니다.
```

> 🚨 **팀원이 `git pull` 을 하면 옛 이력이 되살아납니다.** 이 안내를 먼저 보내는 것이 무엇보다 중요합니다.

**⑥ GitHub 쪽 정리**

| 할 일 | 이유 |
|---|---|
| **GitHub 지원팀에 gc 요청** | 서버에 남은 도달 불가 객체가 URL로 조회될 수 있음 |
| 열린 PR 닫고 재생성 | 옛 커밋을 참조하고 있음 |
| fork 목록 확인 | fork에는 옛 이력이 남습니다 (개별 요청 필요) |
| Actions 캐시 삭제 | 옛 코드가 캐시에 남아 있을 수 있음 |

> **GitHub은 force push 후에도 옛 커밋을 `github.com/<user>/<repo>/commit/<해시>` 로 한동안 보여 줍니다.**
> 완전 삭제는 **GitHub Support에 요청**해야 합니다.

### Step 8. force push 사고 복구

[17강](lesson-17.md)·[23강](lesson-23.md)의 내용을 실전 절차로 정리합니다.

**상황** — 팀원이 `main` 에 `--force` push해서 다른 사람 커밋이 사라졌습니다.

**① 즉시 공지 — 아무도 `pull` 하지 않게**

지금 `pull` 하면 각자의 로컬도 오염됩니다.

**② 사라진 커밋 찾기 — 세 곳을 확인**

```bash
# 강제 push한 사람의 로컬
git reflog --date=iso | head -20

# 다른 팀원의 로컬 (가장 최근 pull 한 사람)
git reflog show origin/main
git log --oneline origin/main
```

**GitHub에서도 찾을 수 있습니다.**

- Settings → **Activity** (force push 전후 해시 기록)
- PR·이슈에 남은 커밋 링크
- Actions 실행 기록의 커밋 해시
- API: `/repos/{owner}/{repo}/events`

**③ 복구**

```bash
git fetch
git switch main
git reset --hard <사라지기 전 해시>
git push --force-with-lease
```

**④ 전원 동기화**

```bash
git fetch --prune
git status                    # 로컬 변경 확인
git stash -u                  # 있으면 보관
git switch main
git reset --hard origin/main
```

**⑤ 재발 방지** ([13강](lesson-13.md))

```
Settings → Branches → main
  ☐ Allow force pushes        ← 반드시 해제
  ☑ Require a pull request before merging
  ☑ Do not allow bypassing the above settings
```

### Step 9. 재발 방지 장치 심기

**① `.gitignore`** ([05강](lesson-05.md))

```gitignore
.env
.env.*
!.env.example
*.pem
*.key
secrets/
credentials.json
```

**② 예시 파일 제공** — 실수로 진짜 파일을 커밋하는 것을 줄입니다.

```bash
cat > .env.example << 'EOF'
API_KEY=your-api-key-here
DB_PASSWORD=your-password-here
EOF
git add .env.example
```

**③ pre-commit 훅** ([26강](lesson-26.md))

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
        args: ['--maxkb=1000']

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
```

**④ CI 검사** ([27강](lesson-27.md)) — 훅은 우회 가능하므로 서버에서도 검사합니다.

```yaml
name: Security

on: [push, pull_request]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0            # 전체 이력 검사
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**⑤ GitHub 기본 기능 켜기**

Settings → Code security and analysis

| 기능 | 하는 일 |
|---|---|
| **Secret scanning** | 알려진 형식의 키를 자동 탐지 |
| **Push protection** | **키가 든 push를 아예 차단** |
| Dependabot alerts | 취약한 의존성 알림 |

> **Push protection이 가장 강력합니다.** 커밋 시점이 아니라 **push 시점에 서버가 막습니다.**
> 공개 저장소는 무료입니다. **지금 바로 켜세요.**

**⑥ 비밀은 애초에 파일로 두지 않기**

| 방법 | 예 |
|---|---|
| 환경 변수 | `os.environ["API_KEY"]` |
| CI 시크릿 | GitHub Secrets ([27강](lesson-27.md)) |
| 비밀 관리 서비스 | AWS Secrets Manager, Vault, Doppler |

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| 이력 재작성 | **GUI 도구 없음** (CLI 전용) |
| 유출 탐지 | GitHub Security 탭 → Secret scanning alerts |
| force push 차단 | Settings → Branches |
| 큰 파일 진단 | `git-sizer` ([28강](lesson-28.md)) |

> 이력 재작성은 **위험도가 높아 GUI 도구가 지원하지 않습니다.** 그것이 정상입니다.

---

## ⑤ 자주 하는 실수

### 키를 재발급하지 않고 이력만 지움

**가장 위험하고 가장 흔한 실수입니다.**

**원인** — "지웠으니 괜찮다"고 생각합니다.
**현실** —

- 공개 저장소는 봇이 **수 분 내에** 수집합니다
- 팀원 로컬, fork, CI 캐시, 백업에 사본이 있습니다
- GitHub은 force push 후에도 옛 커밋을 URL로 한동안 제공합니다

**해결** — **키 재발급이 1순위입니다.** 이력 정리는 그다음입니다.

```
① 키 무효화 · 재발급    ← 5분 안에
② 접근 로그 확인        ← 피해 파악
③ 이력 정리             ← 그다음
```

### `filter-branch` 를 씀

```
WARNING: git-filter-branch has a glut of gotchas generating mangled history
```

**원인** — 오래된 블로그 글을 따라 했습니다.
**해결** — `git filter-repo` 를 쓰세요. **Git 공식 문서가 권장**합니다.

```bash
pip install git-filter-repo
```

### 백업 없이 실행

**원인** — `filter-repo` 는 되돌릴 수 없습니다. reflog까지 정리합니다.
**해결** — **실행 전에 반드시 사본을 만드세요.**

```bash
cp -r project project-backup
# 또는
git clone --mirror project project-backup.git
```

### 재작성 후 팀원이 `git pull` 을 함

**증상** — 지운 커밋이 되살아나고, 이력이 두 갈래로 섞입니다.
**원인** — `pull` 은 옛 로컬 이력과 새 원격 이력을 **합쳐 버립니다.**
**해결** — 팀원은 **반드시 재clone**해야 합니다.

```bash
cd ..
mv project project-old
git clone <주소> project
```

**공지가 늦으면 이 사고가 반드시 납니다.** 재작성 **전에** 공지하고, 작업을 잠시 멈추게 하세요.

### 브랜치 보호를 해제하고 안 되돌림

**증상** — 며칠 뒤 누군가 `main` 에 force push해서 커밋이 사라집니다.
**해결** — 작업 직후 **즉시** 복구하세요.

```
Settings → Branches → main
  ☐ Allow force pushes        ← 다시 해제
```

**체크리스트를 만들어 두는 것이 좋습니다.**

```
[ ] 백업 생성
[ ] 키 재발급 완료
[ ] 팀 공지 발송
[ ] 보호 규칙 해제
[ ] filter-repo 실행
[ ] 검증 (git grep)
[ ] force push
[ ] 보호 규칙 복구       ← 잊기 쉬움
[ ] 팀 재clone 확인
```

### 일부 브랜치만 정리

**증상** — `main` 은 깨끗한데 오래된 브랜치에 키가 남아 있습니다.
**원인** — `filter-repo` 는 기본적으로 **모든 참조**를 처리하지만, 이미 삭제된 브랜치나 태그는 대상이 아닙니다.
**해결** — 검증을 철저히 하세요.

```bash
git grep -n "sk-live" $(git rev-list --all)      # 모든 참조
git log --all --oneline -- .env
git fsck --unreachable                            # 도달 불가 객체까지
```

**서버 쪽도 확인**해야 합니다. GitHub Support에 gc를 요청하세요.

### fork를 잊음

**증상** — 원본은 정리했는데 fork에 키가 그대로입니다.
**원인** — fork는 **독립된 저장소**입니다. 재작성이 전파되지 않습니다.
**해결** —

1. GitHub → Insights → **Forks** 에서 목록 확인
2. 각 소유자에게 개별 요청
3. 필요하면 GitHub Support에 문의

> **fork가 많다면 사실상 회수가 불가능합니다.** 다시 한번, **키 재발급이 유일한 확실한 대응**입니다.

### 재작성 후 태그가 깨짐

**증상** — 태그가 존재하지 않는 커밋을 가리킵니다.
**해결** — `filter-repo` 는 태그도 함께 재작성하지만, push를 빠뜨리면 원격에 옛 태그가 남습니다.

```bash
git push --force --tags
git ls-remote --tags origin        # 확인
```

팀원 쪽에서도 정리해야 합니다.

```bash
git fetch --prune --prune-tags
```

---

## ⑥ 확인 문제

**1.** 팀원이 방금 알렸습니다. **"AWS 키가 든 `.env` 를 어제 공개 저장소에 push했어요."** 무엇부터 하시겠습니까? 순서대로 답하세요.

<details>
<summary>답 보기</summary>

**① 키 무효화·재발급 — 지금 즉시 (5분 안에)**

```
AWS 콘솔 → IAM → 해당 액세스 키 → 비활성화 → 삭제 → 새 키 발급
```

**이것이 전부입니다.** 나머지는 부차적입니다. 공개 저장소는 **봇이 수 분 내에 수집**합니다. 실제로 AWS 키 유출로 수천만 원이 청구된 사례가 흔합니다.

**② 피해 파악 — 동시에 진행**

```
AWS CloudTrail 에서 그 키의 사용 기록 확인
  - 모르는 IP 에서 호출이 있었나
  - EC2 인스턴스가 생성됐나 (암호화폐 채굴)
  - S3 데이터가 조회·유출됐나
```

의심스러우면 **AWS 지원팀에 즉시 신고**하세요.

**③ 노출 범위 확인**

```bash
git log --format="%ci %h %s" --all -- .env
git grep -n "AKIA" $(git rev-list --all)
```

```
- 언제 push 됐나 (노출 시간)
- fork 가 있나 (Insights → Forks)
- 저장소가 계속 공개 상태인가
```

**④ 재발 방지 장치 — 이력 정리보다 먼저**

```gitignore
.env
```

```yaml
# .pre-commit-config.yaml
- id: detect-private-key
```

GitHub Settings → Code security → **Secret scanning + Push protection** 활성화

**⑤ 이력에서 제거**

```bash
cp -r repo repo-backup
git filter-repo --path .env --invert-paths --force
git remote add origin <주소>
git push --force --all --tags
```

**⑥ 팀 공지 · 전원 재clone**

**⑦ GitHub Support에 gc 요청**

**핵심 한 문장**
> **①에 5분, 나머지에 하루를 써도 됩니다. 순서를 바꾸면 안 됩니다.**
> 이력을 완벽히 지워도 유출된 키가 살아 있으면 아무 의미가 없습니다.
</details>

**2.** `git filter-repo --path .env --invert-paths` 를 실행했더니 **커밋 하나가 통째로 사라지고 이후 해시가 전부 바뀌었습니다.** 왜 그런가요?

<details>
<summary>답 보기</summary>

**① 커밋이 사라진 이유 — 빈 커밋이 되었기 때문**

그 커밋이 **`.env` 만 담고 있었다면**, `.env` 를 제거한 뒤 아무 변경도 없는 커밋이 됩니다. `filter-repo` 는 이런 빈 커밋을 자동으로 제거합니다.

```
전:  A ── B(.env 추가) ── C ── D
후:  A ──────────────── C' ── D'
```

다른 파일도 함께 담겨 있었다면 커밋은 남고 `.env` 만 빠집니다.

**② 해시가 바뀐 이유 — 부모 사슬** ([21강](lesson-21.md))

커밋 객체는 이런 텍스트입니다.

```
tree <트리 해시>
parent <부모 해시>      ← 여기가 바뀌면
author ...
```

**전체를 해시**하므로 부모가 바뀌면 자신의 해시도 바뀝니다. 그리고 그 뒤 커밋의 부모가 또 바뀌므로 **연쇄적으로 전부** 바뀝니다.

```
A ── B ── C ── D
     ↓ B 제거
A ── C' ── D'        C, D 의 부모가 달라짐 → 해시 변경
```

**첫 커밋(A)만 그대로**입니다. 부모가 없어 영향을 받지 않습니다.

**③ 그래서 생기는 일**

| 영향 | 대응 |
|---|---|
| 팀원 로컬과 완전히 다른 이력 | **전원 재clone** |
| 문서·이슈의 커밋 링크가 깨짐 | 감수하거나 갱신 |
| 열린 PR이 깨짐 | 다시 생성 |
| 태그 재지정 | `push --force --tags` |
| CI 캐시 무효화 | 자동 |

**이것이 [12강](lesson-12.md) 황금률의 근본 이유**입니다. rebase도 `--amend`도 filter-repo도, 전부 **"부모가 바뀌면 해시가 바뀐다"** 는 같은 원리입니다.
</details>

**3.** 이력 재작성 없이 저장소를 깨끗하게 유지하려면 어떤 장치를 두어야 할까요? **계층별로** 정리해 보세요.

<details>
<summary>답 보기</summary>

**최선의 대응은 애초에 안 들어가게 하는 것입니다.** 다섯 겹으로 막습니다.

**1층 — 설계: 파일로 두지 않기**

```python
import os
API_KEY = os.environ["API_KEY"]      # 코드에 값이 없음
```

| 방법 | 용도 |
|---|---|
| 환경 변수 | 로컬 개발 |
| GitHub Secrets | CI/CD ([27강](lesson-27.md)) |
| Vault, AWS Secrets Manager | 운영 환경 |

**2층 — `.gitignore`** ([05강](lesson-05.md))

```gitignore
.env
.env.*
!.env.example
*.pem
*.key
secrets/
```

**`git init` 직후 가장 먼저** 만들어야 합니다.

**3층 — 로컬 훅** ([26강](lesson-26.md))

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
        args: ['--maxkb=1000']
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
```

빠르지만 `--no-verify` 로 우회 가능합니다.

**4층 — 서버 검사** ([27강](lesson-27.md))

```yaml
# .github/workflows/security.yml
- uses: gitleaks/gitleaks-action@v2
```

+ 브랜치 보호에서 **필수 통과 조건**으로 등록 → 우회 불가

**5층 — 플랫폼 기능**

Settings → Code security and analysis

| 기능 | 효과 |
|---|---|
| Secret scanning | 알려진 키 형식 자동 탐지 |
| **Push protection** | **키가 든 push를 서버가 차단** ← 가장 강력 |
| Dependabot | 취약 의존성 알림 |

**보조 장치**

- **`.env.example`** 제공 — 진짜 파일을 커밋할 이유를 없앰
- **`check-added-large-files`** — 저장소 비대화 예방 ([28강](lesson-28.md))
- **`CONTRIBUTING.md`** 에 규칙 명시 ([13강](lesson-13.md))
- **신규 입사자 온보딩**에 이 내용 포함

**비용 비교**

```
예방:  설정에 30분
사고:  키 재발급 + 이력 재작성 + 전원 재clone + 피해 조사 = 최소 하루
       (금전 피해가 있으면 그 이상)
```

**한 문장 요약**
> **Git은 지우는 도구가 아니라 쌓는 도구입니다.** 들어간 것은 남습니다.
> 그래서 유일하게 값싼 대책은 **처음부터 안 넣는 것**입니다.
</details>

---

## 오늘의 정리

**🚨 비밀 유출 대응 순서**

```
① 키 무효화 · 재발급        ← 이게 전부입니다
② 노출 범위 · 접근 로그 확인
③ 재발 방지 장치
④ 이력에서 제거
⑤ 팀 공지 · 전원 재clone
```

**`git filter-repo`**

```bash
pip install git-filter-repo
cp -r project project-backup           # ⭐ 백업 필수

# 파일 제거
git filter-repo --path .env --invert-paths --force
git filter-repo --path-glob '*.pem' --invert-paths --force

# 값만 치환
git filter-repo --replace-text ../replace.txt --force

# 큰 파일 제거
git filter-repo --strip-blobs-bigger-than 10M --force

# 작성자 수정
git filter-repo --mailmap ../mailmap.txt --force
```

**검증**

```bash
git grep -n "<비밀값>" $(git rev-list --all)     # 아무것도 안 나와야 함
git log --all --oneline -- .env
```

**push와 뒷정리**

```bash
git remote add origin <주소>        # filter-repo 가 지웠으므로
git push --force --all
git push --force --tags
# 브랜치 보호 즉시 복구 ⭐
# GitHub Support 에 gc 요청
```

**팀원이 할 일**

```bash
cd .. && mv project project-old      # 지우지 말고 이름만
git clone <주소> project
```

> 🚨 **`git pull` 하면 옛 이력이 되살아납니다.** 반드시 재clone.

**재발 방지 5계층**

```
1층  설계      환경 변수 · 비밀 관리 서비스
2층  gitignore .env, *.pem  (git init 직후)
3층  훅        detect-private-key, gitleaks   (26강)
4층  CI        gitleaks-action + 필수 통과 조건 (27강)
5층  플랫폼    Secret scanning + Push protection
```

**도구 선택**

```
git filter-repo   ✅ 권장
BFG               ⭕ 큰 저장소 대안
git filter-branch ❌ 폐기 (Git 이 직접 경고)
```

**오늘 반드시 기억할 한 가지**
> **키가 노출된 순간 그 키는 죽은 것입니다.** 지우는 것보다 **재발급이 먼저**입니다.
> 그리고 이력 재작성은 **모든 해시를 바꾸므로**, 팀 전체가 재clone해야 합니다. 반드시 사전 공지하세요.

**과제**
1. 실험용 저장소에 `.env` 를 커밋한 뒤, `git grep "값" $(git rev-list --all)` 로 **몇 개 커밋에서 조회되는지** 확인하세요.
2. `git filter-repo --path .env --invert-paths` 로 제거하고, **커밋이 사라지고 해시가 바뀌는 것**을 확인하세요.
3. `--replace-text` 로 파일은 남기고 값만 치환해 보세요.
4. `--strip-blobs-bigger-than` 으로 큰 파일을 제거하고, 가장 큰 blob 목록이 달라지는 것을 확인하세요.
5. `filter-repo` 실행 후 `git remote -v` 가 비는 것을 확인하고, 왜 그런지 설명해 보세요.
6. 팀 공지문을 실제로 작성해 보세요. (문제 1의 상황을 가정)
7. GitHub 저장소에서 **Secret scanning + Push protection** 을 활성화하세요.

---

[← 이전 28강](lesson-28.md) · [목차](README.md) · [다음 → 30강 고급 종합 실습](lesson-30.md)
