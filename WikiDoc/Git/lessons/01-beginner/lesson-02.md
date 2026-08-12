# 02강 · 설치와 최초 설정

> **Git 학습 매뉴얼** · 🟢 초급 · **02강 / 30**
> [← 이전 01강](lesson-01.md) · [목차](README.md) · [다음 → 03강 저장소와 세 개의 공간](lesson-03.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- Windows에 Git을 설치하고 설치 옵션의 의미를 알고 고를 수 있다.
- `git config` 로 이름과 이메일을 등록하고, 그것이 왜 필요한지 설명할 수 있다.
- 설정이 저장되는 **세 곳(system / global / local)** 의 우선순위를 안다.
- 줄바꿈(CRLF) 과 한글 파일명 문제를 미리 막는 설정을 할 수 있다.

---

## ② 왜 필요한가

Git은 커밋할 때마다 **"이 변경은 누가 했다"** 를 기록에 새깁니다. 그래서 내가 누구인지 먼저 알려 주지 않으면 첫 커밋부터 이렇게 막힙니다.

```
*** Please tell me who you are.
fatal: unable to auto-detect email address
```

이 설정은 **컴퓨터마다 딱 한 번**만 하면 됩니다. 오늘 5분 투자하면 앞으로 30강 내내 다시 볼 일이 없습니다.

그런데 Windows 사용자에게는 **두 가지 함정**이 더 있습니다. 지금 막아 두지 않으면 나중에 이렇게 됩니다.

- 아무것도 안 고쳤는데 **파일 전체가 바뀐 것으로 나옵니다.** → 줄바꿈(CRLF) 문제
- 한글 파일명이 `"\355\225\234\352\270\200.txt"` 처럼 **외계어로 보입니다.** → 인코딩 표시 문제

둘 다 오늘 한 줄씩이면 해결됩니다.

---

## ③ 개념 설명

### 설치할 때 고민되는 옵션들

Git for Windows 설치 화면은 단계가 열 개가 넘습니다. **대부분 기본값 그대로 두면 되고**, 아래 네 개만 봐 두면 됩니다.

| 설치 화면 | 권장 선택 | 이유 |
|---|---|---|
| **Select Components** | `Windows Explorer integration` 체크 유지 | 폴더에서 우클릭 → `Open Git Bash here` 가 생겨 아주 편합니다 |
| **Choosing the default editor** | `Use Visual Studio Code as Git's default editor` | 기본값 Vim은 초보자가 빠져나오지 못합니다 |
| **Adjusting the name of the initial branch** | `Override... ` → **`main`** | 요즘 표준이 `main` 입니다. 안 고르면 `master` 가 됩니다 |
| **Adjusting your line ending conversions** | `Checkout Windows-style, commit Unix-style` (기본값) | 아래 CRLF 설명 참고 |

> 이미 설치했더라도 괜찮습니다. 위 네 가지는 전부 **설치 후에 명령어로 바꿀 수 있습니다.** Step 2에서 합니다.

### Git Bash와 PowerShell

Windows에서는 터미널이 두 가지입니다. 둘 다 `git` 명령은 똑같이 됩니다.

| | Git Bash | PowerShell |
|---|---|---|
| 같이 설치되나 | Git 설치 시 함께 | Windows에 기본 탑재 |
| `git` 명령 | 동일 | 동일 |
| 파일 다루는 명령 | `ls` `cp` `rm` `mkdir` (Linux식) | `ls`(별칭) `Copy-Item` `Remove-Item` |
| 강의 문서 기준 | **이쪽** | 다를 때만 따로 표기 |

> 이 커리큘럼의 명령어는 **Git Bash 기준**입니다. `git` 으로 시작하는 명령은 어디서 치든 같으니
> PowerShell을 써도 무방하고, 파일 복사·삭제 같은 곳만 다르게 쓰면 됩니다.

### 설정은 세 군데에 저장됩니다

`git config` 는 설정을 세 곳 중 하나에 씁니다. **아래로 갈수록 우선**합니다.

| 범위 | 옵션 | 저장 위치 | 적용 대상 |
|---|---|---|---|
| system | `--system` | Git 설치 폴더의 `etc/gitconfig` | 이 컴퓨터의 **모든 사용자** |
| **global** | `--global` | `C:\Users\사용자명\.gitconfig` | **내 계정의 모든 저장소** ← 보통 여기 |
| local | `--local` (기본값) | 그 저장소의 `.git/config` | **그 저장소 하나만** |

```
system  (전체)
   └── global  (내 계정)          ← 같은 항목이 겹치면
          └── local  (이 저장소)     아래쪽이 이깁니다
```

**언제 local을 쓰나요** — 회사 저장소에는 회사 이메일, 개인 저장소에는 개인 이메일을 쓰고 싶을 때입니다.

```bash
# 이 저장소에서만 회사 이메일 사용
git config --local user.email "hong@company.com"
```

### 줄바꿈(CRLF) 문제 — Windows에서 꼭 알아야 합니다

눈에 안 보이지만, **줄을 바꾸는 문자**가 운영체제마다 다릅니다.

| 운영체제 | 줄바꿈 문자 | 이름 |
|---|---|---|
| Windows | `\r\n` | **CRLF** |
| macOS · Linux | `\n` | **LF** |

같은 파일을 Windows에서 저장했다가 Mac 사용자가 열면, Git은 **모든 줄이 바뀐 것**으로 봅니다. 한 글자도 안 고쳤는데 `diff` 에 파일 전체가 빨갛고 파랗게 뜹니다.

해결책이 `core.autocrlf` 입니다.

| 값 | 동작 | 쓰는 곳 |
|---|---|---|
| `true` | 받을 때 CRLF로 바꾸고, **커밋할 때 LF로 바꿔 저장** | **Windows** |
| `input` | 받을 때 그대로, 커밋할 때만 LF로 | macOS · Linux |
| `false` | 아무것도 안 함 | 권장하지 않음 |

> 핵심은 **"저장소 안에는 항상 LF로 통일해 넣는다"** 입니다. 그러면 어느 OS에서 작업하든 이력이 깨끗합니다.
> 팀 프로젝트라면 여기에 더해 `.gitattributes` 파일로 규칙을 못 박는 것이 정석인데, 그건 [18강](lesson-18.md)에서 다룹니다.

### 한글 파일명이 깨져 보이는 이유

Git은 기본적으로 ASCII가 아닌 문자를 **8진수 이스케이프**로 출력합니다. 파일이 깨진 게 아니라 **화면 표시만** 그런 것입니다.

```
	"\355\225\234\352\270\200\355\214\214\354\235\274.txt"
```

`core.quotepath` 를 끄면 원래대로 보입니다.

```
	한글파일.txt
```

---

## ④ 단계별 실습

### Step 1. 설치하고 확인하기

이미 [01강 Step 1](lesson-01.md)에서 버전이 나왔다면 이 단계는 건너뛰세요.

1. <https://git-scm.com/download/win> 접속 → 자동으로 설치 파일이 내려받아집니다.
2. 실행 후 **③ 개념 설명의 표에 있는 네 항목**만 확인하고, 나머지는 `Next` 를 눌러 진행합니다.
3. 설치가 끝나면 **터미널을 새로 열고** 확인합니다.

```bash
git --version
```

실행 결과:

```
git version 2.45.2.windows.1
```

### Step 2. 이름과 이메일 등록하기 (가장 중요)

**따옴표 안의 내용만 본인 것으로 바꿔서** 입력하세요.

```bash
git config --global user.name "Hong Gildong"
git config --global user.email "hong@example.com"
```

아무것도 출력되지 않으면 성공입니다. 확인해 봅니다.

```bash
git config --global user.name
git config --global user.email
```

실행 결과:

```
Hong Gildong
hong@example.com
```

> **이메일은 GitHub 가입 이메일과 같게 맞추세요.** 그래야 GitHub에서 커밋에 내 프로필 사진과 잔디(활동 그래프)가 붙습니다. 다르면 "누군지 모르는 사람"의 커밋으로 표시됩니다.
>
> ⚠️ **이 이메일은 커밋마다 기록되어 공개 저장소에서 누구나 볼 수 있습니다.** 노출이 꺼려진다면 GitHub의 비공개 이메일(`12345678+아이디@users.noreply.github.com`)을 쓰세요. GitHub → Settings → Emails 에서 확인할 수 있습니다.

### Step 3. 나머지 필수 설정 4줄

```bash
# 새 저장소의 기본 브랜치 이름을 main 으로
git config --global init.defaultBranch main

# 커밋 메시지를 VS Code 로 작성 (창을 닫을 때까지 Git이 기다림)
git config --global core.editor "code --wait"

# Windows 줄바꿈 자동 변환
git config --global core.autocrlf true

# 한글 파일명이 깨져 보이지 않게
git config --global core.quotepath false
```

> `core.editor` 는 VS Code가 설치되어 있고 터미널에서 `code` 명령이 동작할 때만 유효합니다.
> `code --version` 이 안 되면, VS Code에서 `Ctrl+Shift+P` → `Shell Command: Install 'code' command in PATH` 를 실행하세요.

### Step 4. 설정 전체 확인하기

```bash
git config --global --list
```

실행 결과:

```
user.name=Hong Gildong
user.email=hong@example.com
init.defaultbranch=main
core.editor=code --wait
core.autocrlf=true
core.quotepath=false
```

> 출력에서 `init.defaultbranch` 처럼 **소문자로 보이는 것은 정상**입니다. Git은 설정 이름의 대소문자를 구분하지 않습니다.

어떤 설정이 **어느 파일에서** 왔는지 보려면 `--show-origin` 을 붙입니다. 우선순위 문제를 추적할 때 유용합니다.

```bash
git config --list --show-origin
```

실행 결과 (일부):

```
file:C:/Program Files/Git/etc/gitconfig   core.symlinks=false
file:C:/Program Files/Git/etc/gitconfig   core.fscache=true
file:C:/Users/LEE/.gitconfig              user.name=Hong Gildong
file:C:/Users/LEE/.gitconfig              user.email=hong@example.com
file:C:/Users/LEE/.gitconfig              init.defaultbranch=main
```

### Step 5. 자주 쓰는 명령에 별칭 붙이기 (선택)

`git status` 를 하루에 50번 칩니다. 짧게 줄여 두면 손이 편합니다.

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --all --decorate"
```

이제 `git st` 만 쳐도 `git status` 가 실행됩니다.

```bash
git lg
```

실행 결과:

```
* 9f3c1a7 (HEAD -> main) 김치를 썰어 넣는 단계 추가, 두부 추가
* 4b8e2d5 김치찌개 레시피 초안
```

> ⚠️ 초급 동안에는 **별칭을 쓰지 말고 전체 명령을 치는 것**을 권합니다. 손에 익어야 남의 컴퓨터에서도 작업할 수 있습니다.
> 별칭은 명령이 완전히 익은 뒤에 붙이세요.

### Step 6. 설정 파일 직접 열어 보기

`git config` 명령이 실제로 하는 일은 그냥 **텍스트 파일을 고치는 것**입니다.

```bash
git config --global --edit
```

VS Code가 열리고 이런 내용이 보입니다.

```ini
[user]
	name = Hong Gildong
	email = hong@example.com
[init]
	defaultBranch = main
[core]
	editor = code --wait
	autocrlf = true
	quotepath = false
[alias]
	st = status
```

> 이 파일이 `C:\Users\사용자명\.gitconfig` 입니다. 새 컴퓨터로 옮길 때 이 파일 하나만 복사하면 설정이 그대로 따라옵니다.

### 같은 일을 GUI로 하면

VS Code에서 `Ctrl+,` (설정) → `git` 검색으로도 일부 설정을 바꿀 수 있지만, **`user.name` · `user.email` 은 GUI에 없습니다.** 이 두 개만큼은 명령어로 넣어야 합니다.

---

## ⑤ 자주 하는 실수

### `*** Please tell me who you are.`

```
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

to set your account's default identity.
Omit --global to set the identity only in this repository.

fatal: unable to auto-detect email address (got 'LEE@DESKTOP-A1B2C3.(none)')
```

**원인** — Step 2를 건너뛰었습니다. Git이 커밋에 새길 이름을 모릅니다.
**해결** — 에러 메시지에 적힌 두 줄을 그대로 실행하면 됩니다. 이름·이메일만 본인 것으로 바꾸세요.

> Git의 에러 메시지는 **해결 명령까지 알려 주는 경우가 많습니다.** 겁먹고 닫지 말고 끝까지 읽는 습관을 들이세요.

### `git config` 를 저장소 밖에서 `--global` 없이 실행

```
fatal: not in a git directory
```

**원인** — `--global` 을 빼면 기본값이 `--local`(이 저장소만) 인데, 지금 위치가 Git 저장소가 아닙니다.
**해결** — 컴퓨터 전체 설정이라면 `--global` 을 꼭 붙이세요.

### 이메일을 GitHub와 다르게 등록

**증상** — GitHub에서 커밋을 보면 프로필 사진 대신 회색 아바타가 뜨고, 잔디가 안 심어집니다.
**원인** — Git의 `user.email` 과 GitHub 계정 이메일이 달라 **같은 사람으로 인식되지 않습니다.**
**해결** — 둘을 맞추거나, GitHub → Settings → Emails 에 그 이메일을 추가로 등록합니다.

> **이미 올린 커밋의 이메일도 고칠 수 있나요?** 됩니다. 다만 히스토리를 다시 쓰는 작업이라 위험합니다. [29강](lesson-29.md)에서 다룹니다. 지금은 **처음부터 맞춰 두는 것**이 훨씬 쌉니다.

### `warning: ... LF will be replaced by CRLF`

```
warning: in the working copy of 'hello.txt', LF will be replaced by CRLF the next time Git touches it
```

**원인** — 에러가 아니라 **경고**입니다. `core.autocrlf=true` 가 의도대로 동작하면서 "이 파일은 받을 때 CRLF로 바꿔 줄게" 라고 알려 주는 것입니다.
**해결** — **무시해도 됩니다.** 커밋은 정상적으로 됩니다.

> 이 메시지가 거슬린다면 팀 차원에서 `.gitattributes` 를 두는 것이 정답입니다. 개인 설정으로 억지로 끄지 마세요.

### 한글 파일명이 `"\355\225\234..."` 로 보임

```
Untracked files:
	"\355\225\234\352\270\200\355\214\214\354\235\274.txt"
```

**원인** — `core.quotepath` 기본값이 `true` 라서 ASCII가 아닌 문자를 이스케이프해 보여 줍니다. **파일이 깨진 것이 아닙니다.**
**해결** — `git config --global core.quotepath false`

### Vim에 갇혔습니다

`core.editor` 를 설정하지 않고 `git commit` 을 하면 이런 화면이 뜹니다.

```
  1
  2 # Please enter the commit message for your changes. Lines starting
  3 # with '#' will be ignored, and an empty message aborts the commit.
~
~
"~/project/.git/COMMIT_EDITMSG" 9L, 293B
```

**원인** — 기본 편집기가 Vim이고, 일반 프로그램처럼 타이핑·닫기가 되지 않습니다.
**해결** — 탈출 순서를 외워 두세요.

| 하고 싶은 일 | 키 |
|---|---|
| 글자 입력 시작 | `i` |
| 입력 끝내기 | `Esc` |
| **저장하고 나가기** | `Esc` → `:wq` → `Enter` |
| **저장 안 하고 나가기** | `Esc` → `:q!` → `Enter` |

그리고 Step 3의 `core.editor` 설정을 하면 다시는 만나지 않습니다.

---

## ⑥ 확인 문제

**1.** 아래 순서로 설정했습니다. 이 저장소에서 커밋하면 어떤 이메일이 기록될까요?

```bash
git config --global user.email "personal@gmail.com"
git config --local  user.email "work@company.com"
```

<details>
<summary>답 보기</summary>

**`work@company.com`** 입니다.

`local`(저장소 하나) 이 `global`(내 계정 전체) 보다 **우선**합니다.

```
system  →  global  →  local     오른쪽으로 갈수록 강함
```

이 성질을 이용해 **평소엔 개인 이메일을 global로 두고, 회사 저장소에서만 local로 덮어쓰는** 방식이 실무에서 흔합니다.

확인은 이렇게 합니다.

```bash
git config user.email          # 지금 실제로 적용되는 값
git config --show-origin user.email   # 그 값이 어느 파일에서 왔는지
```
</details>

**2.** Windows에서 작업한 파일을 팀원(macOS)이 받았더니, 한 줄도 안 고쳤는데 `git diff` 에 **파일 전체가 변경된 것**으로 나옵니다. 원인과 해결책은?

<details>
<summary>답 보기</summary>

**원인** — 줄바꿈 문자가 다릅니다. Windows는 `CRLF(\r\n)`, macOS·Linux는 `LF(\n)` 를 씁니다. Git은 눈에 안 보이는 이 문자까지 비교하므로, 줄바꿈만 달라도 **모든 줄이 바뀐 것**으로 봅니다.

**해결** — 각자 OS에 맞게 설정합니다.

```bash
# Windows
git config --global core.autocrlf true

# macOS / Linux
git config --global core.autocrlf input
```

핵심 원칙은 **"저장소 안에는 LF로 통일해서 저장한다"** 입니다.

**더 확실한 방법** — 개인 설정은 사람마다 빠뜨릴 수 있으므로, 저장소 루트에 `.gitattributes` 를 두면 팀 전체에 강제됩니다.

```
* text=auto
```
</details>

**3.** 새 노트북을 받았습니다. Git을 설치한 직후 **반드시 해야 할 설정**을 명령어로 적어 보세요. (최소 2개는 필수, 나머지는 권장)

<details>
<summary>답 보기</summary>

**필수 (이게 없으면 커밋 자체가 안 됩니다)**

```bash
git config --global user.name "Hong Gildong"
git config --global user.email "hong@example.com"
```

**권장 (Windows라면 사실상 필수)**

```bash
git config --global init.defaultBranch main    # 기본 브랜치를 main 으로
git config --global core.editor "code --wait"  # Vim 탈출 사태 방지
git config --global core.autocrlf true         # 줄바꿈 자동 변환
git config --global core.quotepath false       # 한글 파일명 표시
```

**더 쉬운 방법** — 기존 컴퓨터의 `C:\Users\사용자명\.gitconfig` 파일을 새 컴퓨터의 같은 위치에 복사하면 끝입니다. `git config` 명령은 결국 이 파일을 편집하는 것뿐이니까요.
</details>

---

## 오늘의 정리

| 항목 | 명령 |
|---|---|
| 버전 확인 | `git --version` |
| **이름 등록** | `git config --global user.name "이름"` |
| **이메일 등록** | `git config --global user.email "메일"` |
| 기본 브랜치명 | `git config --global init.defaultBranch main` |
| 기본 편집기 | `git config --global core.editor "code --wait"` |
| 줄바꿈 (Windows) | `git config --global core.autocrlf true` |
| 한글 파일명 | `git config --global core.quotepath false` |
| 전체 확인 | `git config --global --list` |
| 출처까지 확인 | `git config --list --show-origin` |
| 설정 파일 직접 열기 | `git config --global --edit` |

**설정 우선순위**

```
--system (컴퓨터 전체)  <  --global (내 계정)  <  --local (이 저장소)
```

**오늘 반드시 기억할 한 가지**
> `user.name` 과 `user.email` 은 **컴퓨터마다 한 번**만 하면 됩니다.
> 그리고 그 이메일은 **모든 커밋에 영구히 남아 공개**됩니다. 처음에 신중히 정하세요.

**과제**
1. Step 2~3의 설정을 모두 마치고 `git config --global --list` 결과를 캡처해 두세요.
2. `git config --global --edit` 으로 `.gitconfig` 파일을 열어 보고, 방금 넣은 값이 어떤 모양으로 저장되었는지 확인하세요.

---

[← 이전 01강](lesson-01.md) · [목차](README.md) · [다음 → 03강 저장소와 세 개의 공간](lesson-03.md)
