# 05강 · 무시할 파일 정하기

> **Git 학습 매뉴얼** · 🟢 초급 · **05강 / 30**
> [← 이전 04강](lesson-04.md) · [목차](README.md) · [다음 → 06강 기록 들여다보기](lesson-06.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- `.gitignore` 를 만들어 Git이 무시할 파일을 지정할 수 있다.
- 무시 패턴 문법(`*`, `/`, `!`, `**`)을 읽고 쓸 수 있다.
- **이미 추적 중인 파일**을 추적 대상에서 빼낼 수 있다.
- 내 프로젝트에 맞는 `.gitignore` 템플릿을 가져다 쓸 수 있다.

---

## ② 왜 필요한가

[04강](lesson-04.md)에서 `git add .` 을 조심하라고 했습니다. 오늘은 **애초에 걸러내는 방법**을 배웁니다.

프로젝트 폴더에는 **커밋하면 안 되는 파일**이 항상 섞여 있습니다.

| 종류 | 예 | 왜 넣으면 안 되나 |
|---|---|---|
| **비밀 정보** | `.env`, `secrets.json`, `*.pem` | **공개되면 사고입니다.** API 키·비밀번호·인증서 |
| 자동 생성물 | `__pycache__/`, `*.pyc`, `dist/`, `build/` | 코드에서 다시 만들어집니다. 넣을 이유가 없음 |
| 라이브러리 | `venv/`, `node_modules/` | 수만 개 파일. `requirements.txt` 만 있으면 재설치 가능 |
| 개인 설정 | `.idea/`, `.vscode/` | 사람마다 다릅니다. 팀원 설정을 덮어씁니다 |
| OS 찌꺼기 | `.DS_Store`, `Thumbs.db` | 아무 의미 없습니다 |
| 큰 데이터 | `*.csv`(대용량), `*.mp4` | 저장소가 무거워지고 되돌릴 수 없습니다 |

무시하지 않으면 이렇게 됩니다.

```bash
git status
```

```
Untracked files:
	venv/
	__pycache__/
	.env
	...  (수천 줄)
```

**진짜 봐야 할 파일이 파묻힙니다.** 그리고 무심코 `git add .` 을 하는 순간 이 전부가 이력에 박힙니다.

> ⚠️ **가장 무서운 것은 `.env` 입니다.**
> 한 번 커밋해서 GitHub에 올라가면, 나중에 지워도 **이력에는 영원히 남습니다.** 자동 수집 봇이 몇 분 만에 긁어 갑니다.
> 실제로 클라우드 키가 유출되어 수천만 원이 청구된 사례가 흔합니다. 사고 대응 절차는 [29강](lesson-29.md)에서 다루지만, **애초에 안 올리는 것**이 유일하게 확실한 방법입니다.

---

## ③ 개념 설명

### `.gitignore` 란

**무시할 파일 목록을 적어 두는 텍스트 파일**입니다. 파일명이 곧 `.gitignore` 이고, 보통 프로젝트 루트에 둡니다.

```
git-practice/
├── .git/
├── .gitignore        ← 여기
├── greeting.py
└── venv/             ← 무시됨
```

여기 적힌 파일은 `git status` 의 `Untracked files` 에 아예 나타나지 않고, `git add .` 을 해도 담기지 않습니다.

> **`.gitignore` 자체는 반드시 커밋합니다.** 팀원 모두가 같은 규칙을 써야 하기 때문입니다.
> "무시 목록을 무시하면" 각자 다른 쓰레기를 올리게 됩니다.

### 패턴 문법

| 패턴 | 뜻 | 예 |
|---|---|---|
| `secret.txt` | 이름이 정확히 일치하는 파일 (**모든 하위 폴더에서**) | `secret.txt`, `src/secret.txt` |
| `*.log` | 확장자가 `.log` 인 모든 파일 | `error.log`, `logs/app.log` |
| `venv/` | **폴더만** 무시 (끝의 `/` 가 핵심) | `venv/` 폴더 · `venv` 라는 *파일*은 무시 안 함 |
| `/config.json` | **루트에 있는 것만** (앞의 `/`) | 루트의 `config.json` · `src/config.json` 은 무시 안 함 |
| `build/*` | `build` 안의 내용물만 | 폴더 자체는 남음 |
| `docs/**/*.pdf` | `docs` 아래 **모든 깊이**의 pdf | `docs/a.pdf`, `docs/x/y/b.pdf` |
| `temp?.txt` | `?` 는 **한 글자** | `temp1.txt`, `tempA.txt` |
| `*.[oa]` | `[]` 안의 한 글자 | `main.o`, `lib.a` |
| `!important.log` | **예외 (무시하지 않음)** | 위에서 `*.log` 로 막았어도 이건 통과 |
| `# 주석` | 설명 줄 | |

**앞에 `/` 가 있느냐 없느냐**가 가장 헷갈립니다.

```
config.json      →  어느 폴더에 있든 전부 무시
/config.json     →  .gitignore 가 있는 폴더의 것만 무시
```

### 예외 패턴(`!`)의 함정

```gitignore
logs/
!logs/important.log     ← 안 먹힙니다
```

**폴더 자체를 무시하면 그 안은 아예 들여다보지 않습니다.** 그래서 안쪽의 예외도 무효가 됩니다.

이렇게 써야 합니다.

```gitignore
logs/*                  ← 폴더가 아니라 "내용물"을 무시
!logs/important.log     ← 이제 통과됩니다
```

### 이미 추적 중인 파일은 무시되지 않습니다

**가장 많이 겪는 문제이고, 반드시 알아야 하는 규칙입니다.**

> **`.gitignore` 는 "아직 추적하지 않는 파일"에만 적용됩니다.**
> 한 번이라도 커밋된 파일은 `.gitignore` 에 뭐라고 쓰든 계속 추적됩니다.

```
.env 를 커밋함  →  나중에 .gitignore 에 추가  →  여전히 변경이 감지됨 😱
```

이미 추적 중인 것을 빼내려면 명시적으로 알려 줘야 합니다.

```bash
git rm --cached .env
```

| 명령 | 스테이지에서 | 실제 파일 |
|---|---|---|
| `git rm .env` | 제거 | **삭제됨** ⚠️ |
| `git rm --cached .env` | 제거 | **그대로 남음** ✅ |

`--cached` 를 빼면 진짜로 파일이 지워집니다. `.env` 같은 파일에는 절대 쓰면 안 됩니다.

### 어디에 둘 수 있나

| 위치 | 적용 범위 | 커밋되나 |
|---|---|---|
| **프로젝트 루트의 `.gitignore`** | 저장소 전체 | ✅ (팀 공유) |
| 하위 폴더의 `.gitignore` | 그 폴더 아래만 | ✅ |
| `.git/info/exclude` | 이 저장소, **나만** | ❌ |
| 전역 무시 파일 (`core.excludesFile`) | 내 컴퓨터의 모든 저장소 | ❌ |

> **판단 기준** — `venv/`, `__pycache__/` 처럼 **프로젝트의 성격상 누구에게나 필요한 것**은 프로젝트 `.gitignore` 에.
> `.DS_Store`, `.idea/` 처럼 **내 OS·내 에디터 사정**인 것은 전역 무시 파일에 두는 것이 예의입니다.

---

## ④ 단계별 실습

### Step 1. 무시할 만한 파일들 만들기

`git-practice` 폴더에서 실제 프로젝트 비슷한 상황을 만들어 봅니다.

```bash
cd ~/Desktop/git-practice

mkdir venv
echo "가짜 가상환경 파일" > venv/pyvenv.cfg

mkdir __pycache__
echo "컴파일 캐시" > __pycache__/greeting.cpython-312.pyc

echo "API_KEY=sk-secret-1234567890" > .env
echo "실행 로그" > app.log
echo "필독 로그" > important.log
```

상태를 봅니다.

```bash
git status
```

실행 결과:

```
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.env
	__pycache__/
	app.log
	important.log
	venv/

nothing added to commit but untracked files present (use "git add" to track)
```

지금 `git add .` 을 하면 **`.env` 의 API 키까지 커밋됩니다.** 막아야 합니다.

### Step 2. `.gitignore` 만들기

`.gitignore` 파일을 만들고 이렇게 씁니다.

```gitignore
# 비밀 정보 — 절대 커밋 금지
.env
*.pem

# 파이썬
__pycache__/
*.py[cod]
venv/
.venv/

# 로그 (단, important.log 는 예외)
*.log
!important.log

# OS / 에디터
.DS_Store
Thumbs.db
.idea/
```

> `*.py[cod]` 는 `.pyc`, `.pyo`, `.pyd` 를 한 번에 잡는 관용 패턴입니다.

다시 상태를 봅니다.

```bash
git status
```

실행 결과:

```
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.gitignore
	important.log

nothing added to commit but untracked files present (use "git add" to track)
```

**수북하던 목록이 두 줄로 줄었습니다.**

- `.env`, `venv/`, `__pycache__/`, `app.log` → 사라짐 ✅
- `important.log` → `!` 예외 덕분에 남아 있음 ✅
- `.gitignore` 자체는 **커밋해야 하니** 나오는 것이 정상입니다

커밋합니다.

```bash
git add .gitignore important.log
git commit -m "chore: gitignore 추가"
```

실행 결과:

```
[main 6b4e9c3] chore: gitignore 추가
 2 files changed, 18 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 important.log
```

### Step 3. 무시되고 있는지 확인하기

**무시된 파일까지 보기**

```bash
git status --ignored
```

실행 결과:

```
On branch main
Ignored files:
  (use "git add -f <file>..." if you really want to add them)
	.env
	__pycache__/
	app.log
	venv/

nothing to commit, working tree clean
```

**어떤 규칙 때문에 무시되는지 추적하기** — 이 명령을 알아 두면 디버깅이 아주 쉬워집니다.

```bash
git check-ignore -v .env
```

실행 결과:

```
.gitignore:2:.env	.env
```

읽는 법: **`.gitignore` 파일의 2번째 줄, `.env` 패턴** 때문에 `.env` 가 무시되고 있다는 뜻입니다.

```bash
git check-ignore -v important.log
```

실행 결과:

```
.gitignore:15:!important.log	important.log
```

> 아무 출력 없이 끝나면 **무시되지 않는 파일**입니다. 종료 코드로 구분하기 때문에 정상 동작입니다.

### Step 4. 이미 커밋해 버린 파일 빼내기 (핵심)

실무에서 가장 자주 겪는 상황을 **일부러 만들어** 봅니다.

먼저 실수로 커밋했다고 가정합니다.

```bash
echo "DB_PASSWORD=1234" > config.json
git add -f config.json          # -f 는 gitignore 를 무시하고 강제로 담기
git commit -m "chore: 설정 파일 추가"
```

실행 결과:

```
[main 1d7a5f8] chore: 설정 파일 추가
 1 file changed, 1 insertion(+)
 create mode 100644 config.json
```

이제 뒤늦게 `.gitignore` 에 추가합니다.

```gitignore
config.json
```

```bash
git status
```

실행 결과:

```
On branch main
nothing to commit, working tree clean
```

무시되는 것처럼 보이지만, 파일을 고쳐 보면 정체가 드러납니다.

```bash
echo "DB_PASSWORD=5678" >> config.json
git status
```

실행 결과:

```
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   config.json

no changes added to commit (use "git add" and/or "git commit -a")
```

**`.gitignore` 에 넣었는데도 여전히 추적되고 있습니다.** 이미 커밋된 파일이기 때문입니다.

추적을 끊습니다.

```bash
git rm --cached config.json
```

실행 결과:

```
rm 'config.json'
```

```bash
git status
```

실행 결과:

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	deleted:    config.json
```

> `deleted:` 라고 나오지만 **실제 파일은 그대로 있습니다.** 저장소에서만 빠지는 것입니다. 탐색기에서 확인해 보세요.

```bash
git commit -m "chore: config.json 을 추적 대상에서 제외"
git status
```

실행 결과:

```
On branch main
nothing to commit, working tree clean
```

이제 `config.json` 을 아무리 고쳐도 Git이 신경 쓰지 않습니다.

**폴더를 통째로 빼려면** `-r` 을 붙입니다.

```bash
git rm -r --cached venv/
```

> ⚠️ **중요** — 이렇게 해도 **과거 커밋에는 파일 내용이 그대로 남아 있습니다.**
> `config.json` 에 진짜 비밀번호가 들어 있었다면 이것만으로는 부족합니다.
> **① 그 비밀번호·키를 즉시 무효화하고 새로 발급받으세요.** 이게 1순위입니다.
> ② 이력에서 완전히 지우는 방법은 [29강](lesson-29.md)에서 다루지만, 이미 push했다면 **유출된 것으로 간주**해야 합니다.

### Step 5. 템플릿 가져다 쓰기

`.gitignore` 를 손으로 다 쓸 필요 없습니다. 언어·프레임워크별 표준 템플릿이 공개되어 있습니다.

| 방법 | 사용법 |
|---|---|
| **GitHub 공식 모음** | <https://github.com/github/gitignore> 에서 `Python.gitignore` 복사 |
| **gitignore.io** | <https://www.toptal.com/developers/gitignore> 에서 `python, vscode, windows` 입력 → 생성 |
| **GitHub 저장소 생성 시** | `Add .gitignore` 드롭다운에서 언어 선택 ([09강](lesson-09.md)) |

> 파이썬 프로젝트라면 `python`, `venv`, `vscode`, `windows` 를 함께 넣는 조합을 권합니다.
> 템플릿은 길지만 **그대로 붙여넣고 필요한 줄만 추가**하는 것이 안전합니다.

### Step 6. 전역 무시 파일 설정 (선택)

`.DS_Store`(macOS)나 `Thumbs.db`(Windows) 는 **내 OS 사정**이지 프로젝트 사정이 아닙니다. 이런 것은 전역으로 빼는 것이 팀에 대한 예의입니다.

```bash
git config --global core.excludesFile ~/.gitignore_global
```

`~/.gitignore_global` 파일을 만들고:

```gitignore
.DS_Store
Thumbs.db
desktop.ini
.idea/
*.swp
```

이제 모든 저장소에서 자동으로 무시됩니다.

### 같은 일을 GUI로 하면

VS Code Source Control 에서 파일을 **우클릭 → `Add to .gitignore`** 하면 해당 줄이 자동으로 추가됩니다.

다만 **이미 추적 중인 파일을 빼는 것(`git rm --cached`)은 GUI 메뉴에 없습니다.** 이 부분만큼은 명령어를 써야 합니다.

---

## ⑤ 자주 하는 실수

### `.gitignore` 에 넣었는데 계속 올라옵니다

**이 강에서 가장 중요한 실수입니다.**

**원인** — 그 파일이 **이미 추적 중(tracked)** 입니다. `.gitignore` 는 아직 추적하지 않는 파일에만 적용됩니다.
**해결** —

```bash
git rm --cached 파일명          # 파일 하나
git rm -r --cached 폴더명/      # 폴더
git commit -m "chore: 추적 대상에서 제외"
```

**전부 한 번에 정리하는 방법** — `.gitignore` 를 크게 고쳤을 때 유용합니다.

```bash
git rm -r --cached .
git add .
git commit -m "chore: gitignore 규칙 재적용"
```

> 인덱스를 통째로 비우고 `.gitignore` 를 적용해 다시 담는 것입니다. **작업 파일은 지워지지 않습니다.**
> 단, 커밋하기 전에 `git status` 로 **의도치 않게 빠지는 파일이 없는지 반드시 확인**하세요.

### 폴더 이름에 `/` 를 안 붙임

```gitignore
build          # 파일 build 도, 폴더 build/ 도 전부 무시
build/         # 폴더만 무시
```

**원인** — `/` 없이 쓰면 같은 이름의 **파일까지** 걸립니다.
**해결** — 폴더를 의도했다면 `/` 를 붙이세요. 의도가 명확해지고 성능에도 조금 유리합니다.

### `!` 예외가 안 먹힙니다

```gitignore
logs/
!logs/keep.log       # ❌ 동작 안 함
```

**원인** — 폴더 자체를 무시하면 Git이 그 안을 아예 탐색하지 않습니다.
**해결** — 내용물을 무시하는 방식으로 바꿉니다.

```gitignore
logs/*
!logs/keep.log       # ✅ 동작함
```

### `.env` 를 이미 GitHub에 올렸습니다

**원인** — `.gitignore` 를 만들기 전에 `git add .` 을 했습니다.
**해결** — **순서대로** 하세요.

1. **키·비밀번호를 즉시 무효화하고 새로 발급받습니다.** ← 가장 중요합니다. 나머지는 부차적입니다.
2. `git rm --cached .env` 로 추적 해제 후 커밋·푸시
3. 필요하면 이력에서 완전 삭제 ([29강](lesson-29.md))

> "비공개 저장소니까 괜찮다"고 생각하기 쉽지만, 나중에 공개로 바꾸거나 팀원이 늘어나면 그대로 노출됩니다.
> **커밋 전에 `git status` 를 보는 습관**이 이 사고를 막는 가장 싼 방법입니다.

### `.gitignore` 를 `.gitignore` 에 넣기

```gitignore
.gitignore       # ❌
```

**원인** — "설정 파일이니 개인적인 것"이라 생각해서.
**해결** — `.gitignore` 는 **팀 전체가 공유해야 하는 규칙**입니다. 반드시 커밋하세요. 나만의 규칙은 `.git/info/exclude` 에 씁니다.

### `git rm` 에서 `--cached` 를 빼먹음

```bash
git rm .env       # ⚠️ 진짜로 파일이 지워집니다
```

**원인** — `--cached` 는 "저장소에서만 빼기", 없으면 "저장소 + 디스크 둘 다 삭제"입니다.
**해결** — 실수로 지웠다면 마지막 커밋에 있는 경우 되살릴 수 있습니다.

```bash
git restore .env
```

커밋된 적이 없다면 **복구 불가**입니다. `--cached` 를 꼭 확인하세요.

### 빈 폴더가 안 올라갑니다

**원인** — [04강](lesson-04.md)에서 본 것처럼 Git은 빈 폴더를 기록하지 않습니다. `.gitignore` 와는 무관합니다.
**해결** — `logs/.gitkeep` 같은 빈 파일을 두되, `logs/*` 로 내용물을 무시했다면 예외를 걸어야 합니다.

```gitignore
logs/*
!logs/.gitkeep
```

---

## ⑥ 확인 문제

**1.** 아래 `.gitignore` 가 있을 때, 각 파일이 무시되는지 답하세요.

```gitignore
*.log
!error.log
/temp.txt
build/
```

```
ⓐ app.log            ⓑ error.log         ⓒ src/debug.log
ⓓ temp.txt           ⓔ src/temp.txt      ⓕ build/output.js
```

<details>
<summary>답 보기</summary>

| 파일 | 무시? | 이유 |
|---|---|---|
| ⓐ `app.log` | ✅ 무시 | `*.log` 에 해당 |
| ⓑ `error.log` | ❌ 안 함 | `!error.log` 예외 |
| ⓒ `src/debug.log` | ✅ 무시 | `*.log` 는 **모든 하위 폴더**에 적용 |
| ⓓ `temp.txt` | ✅ 무시 | `/temp.txt` — 루트에 있음 |
| ⓔ `src/temp.txt` | ❌ 안 함 | 앞의 `/` 때문에 **루트만** 해당 |
| ⓕ `build/output.js` | ✅ 무시 | `build/` 폴더 전체 |

**핵심 두 가지**
- 앞에 `/` 가 **없으면** 모든 깊이에 적용, **있으면** 루트만.
- `!` 는 앞선 규칙의 예외지만, **폴더 자체가 무시되면 안쪽 예외는 무효**입니다.

확인은 `git check-ignore -v <파일>` 로 하면 확실합니다.
</details>

**2.** 팀원이 이렇게 말합니다. **"`.gitignore` 에 `venv/` 를 넣었는데 `git status` 에 계속 나와요."** 무엇을 확인하고, 어떻게 해결해야 할까요?

<details>
<summary>답 보기</summary>

**확인** — 먼저 원인을 특정합니다.

```bash
git check-ignore -v venv/pyvenv.cfg
```

- **아무 출력이 없다면** → 패턴이 안 맞는 것입니다. 오타이거나 `.gitignore` 위치가 잘못됐을 수 있습니다.
- **패턴이 출력되는데도 `status` 에 나온다면** → **이미 추적 중인 파일**입니다.

```bash
git ls-files venv/ | head       # 추적 중인 파일 목록에 있는지 확인
```

**해결 (이미 추적 중인 경우)**

```bash
git rm -r --cached venv/
git commit -m "chore: venv 를 추적 대상에서 제외"
```

`--cached` 덕분에 **디스크의 `venv/` 는 그대로 남습니다.** 가상환경이 지워지지 않습니다.

**그 밖에 흔한 원인**
- `.gitignore` 를 프로젝트 루트가 아니라 다른 폴더에 만들었다
- 파일명이 `gitignore.txt` 로 저장됐다 (메모장이 `.txt` 를 붙임)
</details>

**3.** 파이썬 프로젝트를 새로 시작합니다. **`git init` 직후 가장 먼저 할 일**은 무엇이고, 왜 그런가요?

<details>
<summary>답 보기</summary>

**`.gitignore` 를 먼저 만들고 커밋하는 것**입니다.

**왜 먼저인가** — `.gitignore` 는 **아직 추적하지 않는 파일에만** 적용됩니다. 한 번이라도 `git add .` 을 해 버리면 그 뒤에 아무리 규칙을 추가해도 이미 늦습니다. `git rm --cached` 로 추가 작업을 해야 하고, `.env` 였다면 키를 새로 발급받아야 합니다.

**권장 순서**

```bash
mkdir my-project && cd my-project
git init

# 1) .gitignore 부터 (템플릿 사용 권장)
#    https://www.toptal.com/developers/gitignore 에서 python, venv, vscode, windows
git add .gitignore
git commit -m "chore: 프로젝트 초기 설정"

# 2) 그 다음에 코드
python -m venv venv
git status          # venv/ 가 안 보이는지 확인!
```

**습관으로 만들 것** — 첫 `git add .` 전에 반드시 `git status` 를 보고, **모르는 파일이 목록에 있으면 멈추세요.**
</details>

---

## 오늘의 정리

| 명령 / 문법 | 하는 일 |
|---|---|
| `.gitignore` | 무시할 파일 목록. **반드시 커밋** |
| `*.log` | 확장자 전체 (모든 하위 폴더 포함) |
| `venv/` | 폴더만 |
| `/config.json` | 루트에 있는 것만 |
| `!important.log` | 예외 (무시하지 않음) |
| `git check-ignore -v <파일>` | **어떤 규칙 때문에** 무시되는지 확인 |
| `git status --ignored` | 무시된 파일까지 보기 |
| `git rm --cached <파일>` | 추적만 해제 (**파일은 남김**) |
| `git rm -r --cached <폴더>/` | 폴더 추적 해제 |
| `git add -f <파일>` | 무시 규칙을 무시하고 강제로 담기 |
| `core.excludesFile` | 내 컴퓨터 전체에 적용되는 무시 목록 |

**가장 중요한 규칙**

```
.gitignore 는 "아직 추적하지 않는 파일"에만 적용됩니다.
이미 커밋된 파일 →  git rm --cached  로 빼내야 합니다.
```

**오늘 반드시 기억할 한 가지**
> **`.gitignore` 는 `git init` 다음에 곧바로 만드세요.**
> 그리고 `.env` 가 한 번이라도 올라갔다면, 지우는 것보다 **키를 새로 발급받는 것**이 먼저입니다.

**과제**
1. <https://www.toptal.com/developers/gitignore> 에서 `python, venv, vscode, windows` 로 템플릿을 만들어 `git-practice/.gitignore` 에 넣고 커밋하세요.
2. `git status --ignored` 로 무엇이 걸러졌는지 확인하세요.
3. `git check-ignore -v venv/pyvenv.cfg` 를 실행해 **몇 번째 줄의 어떤 규칙** 때문에 무시되는지 읽어 보세요.
4. `config.json` 을 만들어 커밋한 뒤, `.gitignore` 에 추가하고 `git rm --cached` 로 빼내는 과정을 직접 해 보세요.

---

[← 이전 04강](lesson-04.md) · [목차](README.md) · [다음 → 06강 기록 들여다보기](lesson-06.md)
