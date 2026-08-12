# 27강 · GitHub Actions 기초

> **Git 학습 매뉴얼** · 🔴 고급 · **27강 / 30**
> [← 이전 26강](lesson-26.md) · [목차](README.md) · [다음 → 28강 대형 저장소 다루기](lesson-28.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 워크플로 파일의 구조(`on` · `jobs` · `steps`)를 읽고 쓸 수 있다.
- PR이 올라오면 **테스트가 자동 실행**되게 만들 수 있다.
- 캐시와 매트릭스로 CI를 빠르고 넓게 만들 수 있다.
- 브랜치 보호 규칙과 연결해 **검사를 통과해야만 병합**되게 할 수 있다.
- 태그를 push하면 **릴리스가 자동 생성**되게 할 수 있다.

---

## ② 왜 필요한가

[26강](lesson-26.md)에서 훅의 한계를 봤습니다.

```bash
git commit --no-verify -m "..."     # 훅 우회
git push --no-verify                # 훅 우회
```

게다가 훅은 **각자 설치**해야 하고, **사람마다 환경이 다릅니다.**

```
"제 컴퓨터에서는 테스트가 통과하는데요?"
```

**CI(Continuous Integration)** 는 이 둘을 동시에 해결합니다.

| | 훅 | **CI** |
|---|---|---|
| 실행 위치 | 내 컴퓨터 | **서버 (동일한 환경)** |
| 우회 | 가능 | **불가능** |
| 설치 | 각자 | 저장소에 파일 하나 |

그리고 [13강](lesson-13.md)의 브랜치 보호 규칙과 연결하면 이렇게 됩니다.

```
PR 생성  →  CI 자동 실행  →  실패하면 병합 버튼 비활성화
```

**이때 비로소 규칙이 진짜로 강제됩니다.** 문서(13강) → 훅(26강) → **CI(27강)** 의 마지막 단계입니다.

---

## ③ 개념 설명

### GitHub Actions란

**저장소에서 일어나는 이벤트에 반응해 서버에서 스크립트를 실행**해 주는 기능입니다.

```
push / PR / 태그 / 일정
        ↓
  워크플로 실행 (GitHub 서버의 가상 머신)
        ↓
  테스트 · 린트 · 빌드 · 배포
        ↓
  성공 / 실패를 PR 화면에 표시
```

**요금** — 공개 저장소는 **무료**, 비공개는 월 무료 사용량(계정 등급에 따라 다름) 후 과금됩니다. 학습·개인 프로젝트는 공개 저장소로 하면 부담이 없습니다.

### 워크플로 파일

`.github/workflows/` 아래의 `.yml` 파일입니다. **여러 개를 둘 수 있고, 파일마다 독립적으로 실행**됩니다.

```
.github/
└── workflows/
    ├── ci.yml          테스트·린트
    ├── release.yml     릴리스 자동화
    └── stale.yml       오래된 이슈 정리
```

### 기본 구조

```yaml
name: CI                          # ① 워크플로 이름 (Actions 탭에 표시)

on:                               # ② 언제 실행할까 (트리거)
  push:
    branches: [main]
  pull_request:

jobs:                             # ③ 실행할 작업들
  test:                           #    작업 이름 (자유)
    runs-on: ubuntu-latest        # ④ 어떤 가상 머신에서
    steps:                        # ⑤ 순서대로 실행할 단계들
      - uses: actions/checkout@v4 #    남이 만든 액션 사용
      - run: echo "안녕하세요"      #    셸 명령 직접 실행
```

| 항목 | 설명 |
|---|---|
| `name` | Actions 탭에 표시될 이름 |
| **`on`** | **트리거.** 언제 실행할지 |
| `jobs` | 작업 목록. **기본적으로 병렬 실행** |
| `runs-on` | `ubuntu-latest` · `windows-latest` · `macos-latest` |
| `steps` | 한 job 안에서 **순서대로** 실행 |
| `uses` | 남이 만든 **액션** 재사용 |
| `run` | 셸 명령 직접 실행 |

> **job은 서로 다른 가상 머신에서 병렬로 돕니다.** 그래서 job 사이에는 파일이 공유되지 않습니다.
> 순서를 강제하려면 `needs:` 를 씁니다.

### 주요 트리거

```yaml
on:
  push:
    branches: [main, 'release/**']
    paths: ['src/**', '!**.md']       # 이 경로가 바뀔 때만
    tags: ['v*']                       # 태그 push
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:                   # 수동 실행 버튼
  schedule:
    - cron: '0 3 * * 1'                # 매주 월요일 03:00 UTC
```

| 트리거 | 쓰임 |
|---|---|
| `push` | 커밋이 올라올 때 |
| **`pull_request`** | **PR 생성·갱신 시** ← 가장 중요 |
| `push.tags` | 릴리스 자동화 ([19강](lesson-19.md)) |
| `workflow_dispatch` | 버튼으로 수동 실행 |
| `schedule` | 정기 실행 (의존성 점검 등) |

> `paths` 로 **문서만 바뀐 PR에서는 테스트를 건너뛸 수 있습니다.** CI 시간과 비용이 크게 줄어듭니다.

### 액션(action) — 재사용 부품

`uses:` 로 남이 만든 것을 가져다 씁니다.

| 액션 | 하는 일 |
|---|---|
| **`actions/checkout@v4`** | **저장소 코드 받기** (거의 항상 첫 단계) |
| `actions/setup-python@v5` | 파이썬 설치 |
| `actions/setup-node@v4` | Node 설치 |
| `actions/cache@v4` | 의존성 캐시 |
| `actions/upload-artifact@v4` | 결과물 저장 |

```yaml
- uses: actions/setup-python@v5
  with:                          # 액션에 넘길 설정
    python-version: '3.12'
```

> ⚠️ **`actions/checkout` 은 기본적으로 얕은 clone(`--depth=1`)** 을 합니다 ([28강](lesson-28.md)).
> 전체 이력이 필요한 작업(태그 조회, `git describe`, 변경 로그 생성)에는 `fetch-depth: 0` 을 지정해야 합니다.

### 시크릿

비밀번호·토큰을 YAML에 직접 쓰면 안 됩니다 ([05강](lesson-05.md)).

**Settings → Secrets and variables → Actions → New repository secret**

```yaml
- run: ./deploy.sh
  env:
    API_KEY: ${{ secrets.API_KEY }}
```

**`GITHUB_TOKEN` 은 자동 제공**됩니다. 릴리스 생성, 이슈 댓글 등에 쓸 수 있습니다.

```yaml
permissions:
  contents: write        # 필요한 권한만 명시 (최소 권한 원칙)
```

### 필수 통과 조건 (required status checks)

**CI를 만들었다고 자동으로 강제되지는 않습니다.** 브랜치 보호에 등록해야 합니다.

**Settings → Branches → `main` 규칙 편집**

```
☑ Require status checks to pass before merging
   └── 검색창에 job 이름 입력 (예: test)
☑ Require branches to be up to date before merging
```

이렇게 하면 **CI가 실패한 PR은 병합 버튼이 비활성화**됩니다.

> ⚠️ **job 이름이 정확해야 합니다.** 워크플로 이름이 아니라 **job의 이름**(또는 `name:` 으로 지정한 표시 이름)입니다.
> 한 번이라도 실행된 적이 있어야 목록에 나타납니다.

---

## ④ 단계별 실습

### Step 0. 준비

[20강](lesson-20.md)의 `team-project` 를 씁니다. 없다면 새로 만들어도 됩니다.

```bash
cd ~/Desktop/team-project
git switch main
git pull
git switch -c chore/add-ci
mkdir -p .github/workflows
```

테스트 파일이 필요하니 준비합니다.

```bash
cat > test_calc.py << 'EOF'
from calc import add, sub, mul, div
import pytest


def test_add():
    assert add(2, 3) == 5


def test_sub():
    assert sub(5, 3) == 2


def test_mul():
    assert mul(3, 4) == 12


def test_div():
    assert div(10, 2) == 5.0


def test_div_by_zero():
    with pytest.raises(ValueError):
        div(1, 0)
EOF

cat > requirements-dev.txt << 'EOF'
pytest>=8.0
ruff>=0.5
EOF
```

### Step 1. 첫 워크플로

`.github/workflows/ci.yml` :

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 저장소 내용 확인
        run: |
          echo "브랜치: ${{ github.ref_name }}"
          echo "커밋:   ${{ github.sha }}"
          ls -la
```

```bash
git add .github test_calc.py requirements-dev.txt
git commit -m "ci: GitHub Actions 워크플로 추가"
git push -u origin chore/add-ci
```

**GitHub 저장소 → Actions 탭**을 열어 보세요. 워크플로가 실행 중이거나 완료되어 있습니다.

각 단계를 클릭하면 **실제 실행 로그**를 볼 수 있습니다.

> **`${{ }}` 는 표현식**입니다. `github.ref_name`, `github.sha`, `github.actor` 같은 **컨텍스트 값**을 꺼내 씁니다.

### Step 2. 테스트 실행 워크플로

`ci.yml` 을 실제 CI로 바꿉니다.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    name: 테스트
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: 의존성 설치
        run: pip install -r requirements-dev.txt

      - name: 테스트 실행
        run: pytest -v
```

```bash
git add .github && git commit -m "ci: 테스트 실행 단계 추가"
git push
```

Actions 탭에서 결과를 확인합니다.

**일부러 실패시켜 봅시다.**

```bash
sed -i 's/return a \* b/return a + b/' calc.py       # mul 을 망가뜨림
git commit -aqm "test: CI 실패 확인용"
git push
```

Actions에서 **빨간 X**가 뜨고, PR 화면에도 실패가 표시됩니다.

```
✗ CI / 테스트 (pull_request)     Failing after 32s
```

로그를 열면 실패한 테스트가 그대로 나옵니다.

```
FAILED test_calc.py::test_mul - assert 7 == 12
```

되돌립니다.

```bash
sed -i 's/return a + b/return a * b/' calc.py
git commit -aqm "fix: 곱셈 복구"
git push
```

### Step 3. 캐시로 빠르게

의존성 설치가 매번 반복되면 느립니다.

```yaml
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'                        # ⭐ 이 한 줄
          cache-dependency-path: requirements-dev.txt
```

> `setup-python` · `setup-node` 는 **캐시 기능이 내장**되어 있습니다. 별도 `actions/cache` 를 쓸 필요가 없습니다.

**직접 캐시를 다뤄야 한다면**

```yaml
      - uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements-dev.txt') }}
          restore-keys: ${{ runner.os }}-pip-
```

**`hashFiles()` 로 만든 키** — 의존성 파일이 바뀌면 자동으로 새 캐시를 만듭니다.

### Step 4. 매트릭스 — 여러 조합 한 번에

```yaml
jobs:
  test:
    name: 테스트 (Python ${{ matrix.python }} / ${{ matrix.os }})
    runs-on: ${{ matrix.os }}

    strategy:
      fail-fast: false            # 하나 실패해도 나머지 계속
      matrix:
        os: [ubuntu-latest, windows-latest]
        python: ['3.10', '3.12']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python }}
          cache: 'pip'
      - run: pip install -r requirements-dev.txt
      - run: pytest -v
```

**2 × 2 = 4개 job이 병렬로 실행**됩니다.

> **`fail-fast: false` 를 권합니다.** 기본값(`true`)이면 하나가 실패할 때 나머지가 취소되어, "어떤 조합에서 깨지는지"를 알 수 없습니다.
>
> ⚠️ **매트릭스는 비용을 곱합니다.** 비공개 저장소라면 조합 수를 신중하게 정하세요.
> Windows·macOS 러너는 Linux보다 분당 요금이 **2배·10배**입니다.

### Step 5. 린트 — 훅 설정 재사용

[26강](lesson-26.md)에서 만든 `pre-commit` 설정을 CI에서 그대로 씁니다.

```yaml
  lint:
    name: 린트
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - uses: pre-commit/action@v3.0.1        # pre-commit 전용 액션
```

이 액션이 `.pre-commit-config.yaml` 을 읽어 **로컬 훅과 완전히 같은 검사**를 실행합니다.

> 🔑 **설정 파일 하나로 로컬과 CI가 같은 규칙을 씁니다.**
> `--no-verify` 로 우회해도 여기서 걸립니다. [26강](lesson-26.md)에서 말한 "겹치게 두기"가 이것입니다.

`pre-commit` 을 안 쓴다면 직접 실행해도 됩니다.

```yaml
      - run: pip install ruff
      - run: ruff check .
      - run: ruff format --check .
```

### Step 6. PR 제목 검사 (Conventional Commits)

Squash 병합([14강](lesson-14.md))을 쓰면 **PR 제목이 곧 `main` 의 커밋 메시지**가 됩니다. 그러니 형식을 검사해야 합니다.

`.github/workflows/pr-title.yml` :

```yaml
name: PR 제목 검사

on:
  pull_request:
    types: [opened, edited, synchronize]

permissions:
  pull-requests: read

jobs:
  lint-title:
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            chore
            ci
          requireScope: false
```

**PR 제목이 `feat: ...` 형식이 아니면 실패**합니다. 제목을 고치면 자동으로 다시 검사합니다.

### Step 7. 브랜치 보호에 연결 — 여기서 진짜 강제됩니다

여기까지는 **"빨간 X가 뜨는 것"** 뿐입니다. 무시하고 병합할 수 있습니다.

```bash
git add .github && git commit -m "ci: 린트와 PR 제목 검사 추가"
git push
```

PR을 만들어 **한 번 실행시킨 뒤**, 저장소 설정으로 갑니다.

**Settings → Branches → `main` 규칙 편집**

```
☑ Require a pull request before merging
☑ Require status checks to pass before merging
   검색창에 입력해서 추가:
     - 테스트
     - 린트
     - lint-title
☑ Require branches to be up to date before merging
```

> ⚠️ **job이 한 번이라도 실행된 적이 있어야 검색 목록에 나타납니다.** 그래서 PR을 먼저 올려야 합니다.
> `name:` 을 지정했다면 **그 표시 이름**으로 등록됩니다. 매트릭스를 쓰면 조합마다 항목이 생깁니다.

**검증합니다.**

```bash
sed -i 's/return a \* b/return a + b/' calc.py
git commit -aqm "test: 필수 검사 확인"
git push
```

PR 화면에서 이렇게 보입니다.

```
✗ Some checks were not successful
  ✗ CI / 테스트 (pull_request)          Failed
  ✓ CI / 린트 (pull_request)            Successful

Merging is blocked
Required statuses must pass before merging
```

**병합 버튼이 회색으로 비활성화됩니다.** 이제 규칙이 진짜로 강제됩니다.

```bash
sed -i 's/return a + b/return a * b/' calc.py
git commit -aqm "fix: 곱셈 복구"
git push
```

초록 체크가 뜨면 병합할 수 있습니다.

### Step 8. 릴리스 자동화

[19강](lesson-19.md)의 태그를 트리거로 릴리스를 자동 생성합니다.

`.github/workflows/release.yml` :

```yaml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write          # 릴리스 생성 권한

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0           # ⭐ 전체 이력 (변경 로그 생성에 필요)

      - name: 이전 태그 찾기
        id: prev
        run: |
          PREV=$(git describe --tags --abbrev=0 "${{ github.ref_name }}^" 2>/dev/null || echo "")
          echo "tag=$PREV" >> "$GITHUB_OUTPUT"

      - name: 변경 로그 생성
        id: changelog
        run: |
          {
            echo "body<<EOF"
            if [ -n "${{ steps.prev.outputs.tag }}" ]; then
              echo "## 변경 사항"
              git log --no-merges --pretty=format:"- %s (%h)" \
                "${{ steps.prev.outputs.tag }}..${{ github.ref_name }}"
            else
              echo "## 첫 릴리스"
            fi
            echo ""
            echo "EOF"
          } >> "$GITHUB_OUTPUT"

      - name: 릴리스 생성
        uses: softprops/action-gh-release@v2
        with:
          name: ${{ github.ref_name }}
          body: ${{ steps.changelog.outputs.body }}
          generate_release_notes: true
```

**동작을 확인합니다.**

```bash
git switch main
git pull
git tag -a v1.1.0 -m "1.1.0 릴리스"
git push --follow-tags
```

Actions 탭에서 `Release` 워크플로가 돌고, **Releases 페이지에 자동으로 릴리스가 생성**됩니다.

> **`fetch-depth: 0` 이 핵심입니다.** 기본 얕은 clone에서는 이전 태그를 찾을 수 없어 변경 로그가 비게 됩니다.
>
> `$GITHUB_OUTPUT` 은 **단계 간에 값을 넘기는 방법**입니다. 예전의 `::set-output` 은 폐기됐습니다.

### Step 9. 완성된 `ci.yml`

지금까지의 내용을 합치면 이렇습니다.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

# 같은 PR 에서 새 커밋이 오면 이전 실행을 취소 (비용 절약)
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: 린트
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - uses: pre-commit/action@v3.0.1

  test:
    name: 테스트 (Python ${{ matrix.python }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        python: ['3.10', '3.12']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python }}
          cache: 'pip'
          cache-dependency-path: requirements-dev.txt
      - run: pip install -r requirements-dev.txt
      - run: pytest -v --junitxml=report.xml

      - name: 테스트 결과 저장
        if: always()                     # 실패해도 실행
        uses: actions/upload-artifact@v4
        with:
          name: test-report-${{ matrix.python }}
          path: report.xml
```

> **`concurrency` 를 꼭 넣으세요.** PR에 커밋을 연달아 push하면 이전 실행이 자동 취소되어 비용과 시간이 절약됩니다.
>
> **`if: always()`** — 앞 단계가 실패해도 이 단계는 실행됩니다. 테스트 리포트 수집처럼 "실패했을 때 더 필요한" 작업에 씁니다.

### 같은 일을 로컬에서 확인하려면

```bash
# act — 로컬에서 워크플로 실행 (Docker 필요)
act pull_request

# actionlint — 워크플로 문법 검사
actionlint .github/workflows/*.yml
```

> **`actionlint` 는 강력히 권합니다.** YAML 오타나 잘못된 표현식을 push 전에 잡아 줍니다.
> [26강](lesson-26.md)의 `pre-commit` 에도 등록할 수 있습니다.

---

## ⑤ 자주 하는 실수

### 워크플로가 아예 실행되지 않음

**확인 순서**

| 확인 | 흔한 실수 |
|---|---|
| 경로 | `.github/workflows/` (복수형 `workflows`, 점으로 시작) |
| 확장자 | `.yml` 또는 `.yaml` |
| 브랜치 | **기본 브랜치에 병합되어야 동작하는 트리거**가 있음 (`schedule` 등) |
| `on` 조건 | `branches` · `paths` 필터에 걸리지 않는지 |
| Actions 활성화 | Settings → Actions → Allow all actions |

**YAML 문법 오류일 수도 있습니다.** 이 경우 Actions 탭에 오류가 표시됩니다.

```bash
actionlint .github/workflows/ci.yml
python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"
```

> **YAML은 들여쓰기에 민감합니다.** 탭은 쓸 수 없고 **공백만** 가능합니다.

### `git describe` 나 태그 조회가 실패

```
fatal: No names found, cannot describe anything.
```

**원인** — `actions/checkout` 은 기본적으로 **얕은 clone(`--depth=1`)** 을 합니다. 이력도 태그도 없습니다.
**해결** —

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0        # 전체 이력
```

태그만 필요하다면:

```yaml
    fetch-tags: true
```

> **변경 로그 생성, `git log A..B`, `bisect`** 등 이력이 필요한 작업에는 전부 이 설정이 필요합니다.

### 브랜치 보호에 등록했는데 계속 "Expected"

```
Expected — Waiting for status to be reported
```

**원인** — 등록한 이름의 job이 **이번 PR에서 실행되지 않았습니다.**

흔한 경우:
- `paths` 필터 때문에 실행되지 않음 (문서만 바뀐 PR)
- job 이름을 잘못 등록 (워크플로 이름 ≠ job 이름)
- 매트릭스인데 조합 하나만 등록

**해결** —

```bash
# 1) 이름 확인: Actions 탭의 실행 결과에 나오는 이름 그대로
# 2) paths 필터를 쓴다면, 건너뛴 경우에도 성공을 보고하는 job 을 추가
```

```yaml
  ci-required:
    name: CI 통과
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: always()
    steps:
      - run: |
          if [ "${{ contains(needs.*.result, 'failure') }}" = "true" ]; then
            exit 1
          fi
```

이 하나만 필수 검사로 등록하면 매트릭스가 늘어도 설정을 바꿀 필요가 없습니다.

### 시크릿이 비어 있음

```
Error: API_KEY is empty
```

**원인 세 가지**

| 원인 | 확인 |
|---|---|
| 이름 오타 | Settings의 시크릿 이름과 정확히 일치하는지 |
| **fork PR** | **보안상 fork에서 온 PR에는 시크릿이 전달되지 않습니다** |
| 환경(Environment) 시크릿 | job에 `environment:` 지정이 필요 |

> **fork PR에서 시크릿이 없는 것은 의도된 동작입니다.** 악의적인 PR이 시크릿을 훔치는 것을 막기 위해서입니다.
> 배포 같은 작업은 `pull_request_target` 이나 병합 후 `push` 트리거로 분리하세요.
>
> 🚨 **`pull_request_target` 은 위험합니다.** PR의 코드를 체크아웃해 실행하면 시크릿이 유출될 수 있습니다. 꼭 필요할 때만, 코드를 실행하지 않는 방식으로 쓰세요.

### 시크릿을 로그에 출력

```yaml
- run: echo "${{ secrets.API_KEY }}"      # ❌
```

GitHub이 자동으로 마스킹(`***`)해 주지만 **완전하지 않습니다.** base64 인코딩이나 부분 출력은 걸러지지 않습니다.

**해결** — 시크릿은 환경 변수로만 전달하고 출력하지 마세요.

```yaml
- run: ./deploy.sh
  env:
    API_KEY: ${{ secrets.API_KEY }}
```

### CI가 너무 느리거나 비쌈

**대책**

```yaml
concurrency:                       # ① 이전 실행 자동 취소
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

on:
  pull_request:
    paths-ignore: ['**.md', 'docs/**']    # ② 문서만 바뀌면 건너뛰기

jobs:
  test:
    steps:
      - uses: actions/setup-python@v5
        with:
          cache: 'pip'                     # ③ 의존성 캐시
```

**④ 매트릭스 조합을 줄이세요.** Windows 러너는 Linux의 **2배**, macOS는 **10배** 요금입니다.

**⑤ 무거운 검사는 분리**

```yaml
on:
  schedule:
    - cron: '0 3 * * 1'      # 전체 브라우저 테스트는 주 1회만
```

### 권한 오류

```
Error: Resource not accessible by integration
```

**원인** — `GITHUB_TOKEN` 의 기본 권한이 읽기 전용입니다.
**해결** — 필요한 권한만 명시하세요.

```yaml
permissions:
  contents: write          # 릴리스·태그 생성
  pull-requests: write     # PR 댓글
  issues: write
```

> **최소 권한 원칙**을 지키세요. 워크플로 전체가 아니라 **필요한 job에만** 지정할 수도 있습니다.

### 서드파티 액션을 태그로 고정

```yaml
- uses: some-org/some-action@v1        # ⚠️ 태그는 옮겨질 수 있음
```

**위험** — 태그는 이동 가능합니다([19강](lesson-19.md)). 액션 작성자가 `v1` 을 악성 코드로 바꾸면 그대로 실행됩니다.
**해결** — 중요한 저장소에서는 **커밋 해시로 고정**하세요.

```yaml
- uses: some-org/some-action@a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0  # v1.2.3
```

`actions/*` 같은 GitHub 공식 액션은 태그로 써도 실무상 무방합니다.

---

## ⑥ 확인 문제

**1.** PR이 올라오면 **테스트가 자동 실행되고, 실패하면 병합할 수 없게** 만들려면 무엇을 해야 할까요? 두 단계로 나눠 답하세요.

<details>
<summary>답 보기</summary>

**① 워크플로 작성** — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:

jobs:
  test:
    name: 테스트
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r requirements-dev.txt
      - run: pytest -v
```

이것만으로는 **빨간 X가 뜰 뿐** 병합을 막지 못합니다.

**② 브랜치 보호에 등록** ← 이 단계가 핵심입니다

**Settings → Branches → `main`**

```
☑ Require a pull request before merging
☑ Require status checks to pass before merging
   └── 검색해서 "테스트" 추가
☑ Require branches to be up to date before merging
```

**순서 주의** — job이 **한 번이라도 실행된 적이 있어야** 검색 목록에 나타납니다. PR을 먼저 하나 올리세요.

**등록할 이름** — 워크플로 이름(`CI`)이 아니라 **job의 표시 이름**(`테스트`)입니다.

**검증**

```bash
# 일부러 테스트를 깨뜨리고 push
```

PR 화면에서:

```
✗ Some checks were not successful
Merging is blocked
```

병합 버튼이 비활성화되면 성공입니다.

**추가로 권장**

```
☑ Do not allow bypassing the above settings    (관리자도 예외 없음)
☐ Allow force pushes                            (해제 유지)
```
</details>

**2.** CI에서 `git describe --tags` 가 `fatal: No names found` 로 실패합니다. 원인과 해결책은?

<details>
<summary>답 보기</summary>

**원인** — `actions/checkout` 은 기본적으로 **얕은 clone**을 합니다.

```
fetch-depth: 1 (기본)  →  최신 커밋 1개만, 태그 없음
```

CI 속도를 위한 최적화인데, 이력이 필요한 작업에서는 문제가 됩니다.

**해결**

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0        # 전체 이력 + 모든 태그
```

태그만 필요하다면 더 가볍게:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-tags: true
```

**이 설정이 필요한 작업들**

| 작업 | 이유 |
|---|---|
| `git describe` | 태그가 필요 ([19강](lesson-19.md)) |
| 변경 로그 생성 (`git log A..B`) | 이력이 필요 |
| `git bisect` | 전체 이력 ([25강](lesson-25.md)) |
| 변경 파일 목록 (`git diff main...HEAD`) | 비교 대상 커밋 |
| SonarQube 등 코드 분석 | blame 정보 |

**대안 — 나중에 받아오기**

```yaml
- uses: actions/checkout@v4
- run: git fetch --prune --unshallow
```

**주의** — `fetch-depth: 0` 은 **큰 저장소에서 느립니다.** 정말 필요한 job에만 지정하세요.
</details>

**3.** 훅([26강](lesson-26.md))과 CI를 함께 쓸 때, **같은 검사를 양쪽에 두는 것이 낭비 아닌가요?** 답해 보세요.

<details>
<summary>답 보기</summary>

**낭비가 아니라 필수입니다. 역할이 다릅니다.**

| | 훅 | CI |
|---|---|---|
| 목적 | **빨리 알려 주기** | **통과시키지 않기** |
| 시점 | 커밋 전 (1~3초) | PR 후 (몇 분) |
| 우회 | `--no-verify` 로 가능 | **불가능** |
| 설치 | 각자 (안 한 사람도 있음) | 저장소에 있으면 끝 |
| 환경 | 사람마다 다름 | **동일** |

**훅만 있으면** — 우회하거나 설치를 안 한 사람의 코드가 그대로 들어옵니다.
**CI만 있으면** — 오타 하나 때문에 5분 기다렸다가 실패 알림을 받습니다. 그걸 여러 번 반복합니다.

**둘 다 있으면**

```
커밋 시점   훅이 1초 만에 알려 줌   →  대부분 여기서 걸러짐
PR 시점     CI 가 최종 확인        →  우회·미설치도 잡힘
```

**중복을 없애는 방법 — 설정 파일 공유**

```yaml
# .github/workflows/ci.yml
- uses: pre-commit/action@v3.0.1
```

`.pre-commit-config.yaml` 하나를 로컬 훅과 CI가 **똑같이** 사용합니다. **검사 로직은 한 곳에만** 있습니다.

```
.pre-commit-config.yaml
        ├──▶ 로컬: pre-commit install  (26강)
        └──▶ CI:   pre-commit/action   (27강)
```

**역할 분담 정리**

| 시점 | 무엇을 | 시간 |
|---|---|---|
| `pre-commit` 훅 | 포맷·린트·비밀정보 (**변경 파일만**) | 1~3초 |
| `pre-push` 훅 | 단위 테스트 | 10~30초 |
| **CI** | 전체 테스트 · 여러 OS/버전 · 빌드 · **위 전부 재확인** | 몇 분 |

**한 문장 요약**
> **훅은 나를 돕고, CI는 팀을 지킵니다.** 훅은 건너뛸 수 있어야 하고(급할 때), CI는 건너뛸 수 없어야 합니다.
</details>

---

## 오늘의 정리

**워크플로 구조**

```yaml
name: CI
on:                        # 트리거
  pull_request:
jobs:
  test:                    # job (병렬 실행)
    name: 테스트            # ← 브랜치 보호에 등록할 이름
    runs-on: ubuntu-latest
    steps:                 # 순서대로
      - uses: actions/checkout@v4     # 액션 사용
      - run: pytest                   # 명령 실행
```

**주요 트리거**

| 트리거 | 쓰임 |
|---|---|
| `pull_request` | **PR 검사** (가장 중요) |
| `push.branches` | 특정 브랜치 |
| `push.tags: ['v*']` | 릴리스 자동화 |
| `workflow_dispatch` | 수동 실행 버튼 |
| `schedule` | 정기 실행 |

**필수 액션**

| 액션 | 하는 일 |
|---|---|
| `actions/checkout@v4` | 코드 받기 (`fetch-depth: 0` 주의) |
| `actions/setup-python@v5` | 언어 설치 + `cache: 'pip'` |
| `actions/upload-artifact@v4` | 결과물 저장 |
| `pre-commit/action@v3.0.1` | **훅 설정 재사용** |

**비용·속도 최적화**

```yaml
concurrency:                              # 이전 실행 자동 취소
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

on:
  pull_request:
    paths-ignore: ['**.md']               # 문서만 바뀌면 건너뛰기

    cache: 'pip'                          # 의존성 캐시
```

**진짜 강제하는 마지막 단계**

```
Settings → Branches → main
  ☑ Require status checks to pass before merging
      └── job 이름 등록  ← 이걸 해야 병합이 막힙니다
```

**세 층의 방어**

```
문서 (13강)  →  훅 (26강)  →  CI + 브랜치 보호 (27강)
 합의           빠른 알림        최종 관문
```

**오늘 반드시 기억할 한 가지**
> **워크플로를 만드는 것만으로는 아무것도 강제되지 않습니다.**
> **브랜치 보호의 "Require status checks"에 등록**해야 비로소 병합이 막힙니다.

**과제**
1. `.github/workflows/ci.yml` 을 만들어 PR에서 테스트가 자동 실행되게 하세요.
2. 일부러 테스트를 깨뜨려 **PR 화면에 실패가 표시되는 것**을 확인하세요.
3. 브랜치 보호에 job을 등록하고, **실패 시 병합 버튼이 비활성화되는 것**을 확인하세요.
4. 매트릭스로 Python 두 버전에서 테스트를 돌려 보세요.
5. `cache: 'pip'` 를 추가하고 두 번째 실행이 얼마나 빨라지는지 비교하세요.
6. `concurrency` 를 추가한 뒤 커밋을 연달아 push해 이전 실행이 취소되는 것을 확인하세요.
7. 태그를 push해 릴리스가 자동 생성되는 워크플로를 만들어 보세요.

---

[← 이전 26강](lesson-26.md) · [목차](README.md) · [다음 → 28강 대형 저장소 다루기](lesson-28.md)
