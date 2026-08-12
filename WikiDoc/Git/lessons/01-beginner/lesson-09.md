# 09강 · GitHub에 올리기

> **Git 학습 매뉴얼** · 🟢 초급 · **09강 / 30**
> [← 이전 08강](lesson-08.md) · [목차](README.md) · [다음 → 10강 초급 종합 실습](lesson-10.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- GitHub에 저장소를 만들고 내 로컬 저장소와 연결할 수 있다.
- `push` · `pull` · `clone` 으로 코드를 올리고 받아올 수 있다.
- `fetch` 와 `pull` 의 차이를 알고 상황에 맞게 쓸 수 있다.
- `origin/main` 같은 **원격 추적 브랜치**가 무엇인지 설명할 수 있다.
- HTTPS 인증(PAT)과 SSH 키 중 하나로 인증을 설정할 수 있다.

---

## ② 왜 필요한가

지금까지 만든 커밋은 전부 **내 노트북 안에만** 있습니다. 이러면 세 가지가 안 됩니다.

| 안 되는 것 | 결과 |
|---|---|
| **백업** | 노트북이 고장 나면 전부 사라집니다 |
| **다른 기기에서 이어 작업** | 집 컴퓨터와 회사 컴퓨터를 오갈 수 없습니다 |
| **협업** | 팀원에게 코드를 보여 줄 방법이 압축파일뿐입니다 |

그리고 하나 더. **GitHub 저장소는 그 자체로 포트폴리오입니다.** 취업·이직에서 실제로 봅니다. 커밋 이력이 곧 "이 사람이 어떻게 일하는지"의 증거가 됩니다.

오늘 이후로는 작업이 끝날 때마다 **`git push`** 를 습관으로 만드는 것이 목표입니다.

---

## ③ 개념 설명

### 원격 저장소(remote)

**인터넷(또는 다른 서버)에 있는 저장소**입니다. 내 로컬 저장소와 **똑같은 구조**를 갖습니다.

```
   내 컴퓨터                        GitHub
 ┌─────────────┐   git push    ┌─────────────┐
 │  로컬 저장소  │ ────────────▶ │  원격 저장소  │
 │  (.git)     │ ◀──────────── │  (origin)   │
 └─────────────┘   git pull    └─────────────┘
```

> **원격 저장소는 특별한 것이 아닙니다.** 내 것과 똑같은 Git 저장소가 인터넷에 하나 더 있는 것뿐입니다.
> [01강](lesson-01.md)에서 말한 "분산형"이 이런 뜻입니다.

### `origin` 이란

원격 저장소의 **별명**입니다. `https://github.com/user/repo.git` 을 매번 치기 번거로우니 짧은 이름을 붙여 둔 것입니다.

```bash
git remote add origin https://github.com/user/repo.git
                ↑           ↑
              별명        실제 주소
```

`origin` 은 **관례**일 뿐 규칙이 아닙니다. `upstream`, `backup` 등 여러 개를 등록할 수도 있습니다. 다만 첫 번째 원격은 거의 항상 `origin` 이라고 부릅니다.

### 원격 추적 브랜치 — `origin/main`

여기가 초급에서 가장 헷갈리는 부분입니다. **`main` 과 `origin/main` 은 다릅니다.**

| 이름 | 정체 |
|---|---|
| `main` | **내 로컬 브랜치** |
| `origin/main` | **"내가 마지막으로 확인했을 때 GitHub의 main 은 여기였다"는 기록** |

`origin/main` 은 GitHub를 실시간으로 비추는 거울이 **아닙니다.** 내 컴퓨터 안에 저장된 **캐시**입니다. `fetch` 나 `pull` 을 해야 갱신됩니다.

```
GitHub 서버:        A ── B ── C ── D     (팀원이 D를 올림)

내 컴퓨터:
  origin/main:      A ── B ── C          (아직 D를 모름)
  main:             A ── B ── C ── E     (내가 E를 만듦)

git fetch 하면 →
  origin/main:      A ── B ── C ── D     (이제 알게 됨)
  main:             A ── B ── C ── E     (내 것은 그대로)
```

### `fetch` 와 `pull`

```
git fetch  =  가져오기만 함 (origin/main 갱신)
git pull   =  git fetch + git merge origin/main
```

| | `git fetch` | `git pull` |
|---|---|---|
| 원격 내용 가져오기 | ✅ | ✅ |
| 내 브랜치에 합치기 | ❌ | ✅ |
| 안전한가 | **매우 안전** (내 작업 안 건드림) | 충돌·머지 커밋 발생 가능 |
| 언제 | "뭐 바뀌었나 확인만" | "받아서 바로 이어 작업" |

> **권장 습관** — 상황을 모를 땐 `fetch` 로 먼저 확인하고, 안전하면 `pull` 하세요.
> ```bash
> git fetch
> git log --oneline main..origin/main      # 원격에만 있는 커밋 미리보기
> git pull
> ```

### 인증 — 비밀번호는 더 이상 안 됩니다

**GitHub는 2021년 8월부터 비밀번호 인증을 폐지했습니다.** 방법은 두 가지입니다.

| | HTTPS + PAT | SSH 키 |
|---|---|---|
| 주소 형태 | `https://github.com/user/repo.git` | `git@github.com:user/repo.git` |
| 필요한 것 | **Personal Access Token** | 공개키/개인키 쌍 |
| 설정 난이도 | 쉬움 | 조금 번거로움 |
| Windows | **Git Credential Manager가 자동 처리** | 별도 설정 필요 |
| 회사 방화벽 | 대체로 통과 | 막히는 경우 있음 |
| 추천 | **초급자·Windows** | 여러 기기·장기 사용 |

> **Windows에서 Git을 설치했다면 Git Credential Manager가 함께 깔려 있습니다.**
> 첫 `push` 때 브라우저 로그인 창이 뜨고, 한 번 로그인하면 이후엔 자동입니다. **PAT를 직접 만들 필요도 없습니다.**
> 이 강에서는 이 방식을 기본으로 진행하고, PAT·SSH는 필요할 때 참고하도록 정리해 둡니다.

---

## ④ 단계별 실습

### Step 1. GitHub에 저장소 만들기

1. <https://github.com> 로그인 → 오른쪽 위 **`+`** → **New repository**
2. 아래처럼 채웁니다.

| 항목 | 값 | 이유 |
|---|---|---|
| Repository name | `git-practice` | 로컬 폴더명과 같게 |
| Description | `Git 학습 매뉴얼 연습 저장소` | 선택 |
| Public / Private | **Public** | 연습용이니 공개로 |
| **Add a README file** | **체크 해제** ⚠️ | **중요** — 아래 설명 참고 |
| Add .gitignore | **None** ⚠️ | 로컬에 이미 있습니다 |
| Choose a license | None | |

3. **Create repository**

> ⚠️ **README·.gitignore 체크를 반드시 해제하세요.**
> 체크하면 GitHub 쪽에 **커밋이 하나 생깁니다.** 그러면 내 로컬 이력과 공통 조상이 없어져서 첫 `push` 가 거부됩니다.
> (해결법은 ⑤에 적어 두었습니다. 이미 체크했다면 그쪽을 보세요)

만들고 나면 이런 안내 화면이 나옵니다. **`…or push an existing repository from the command line`** 부분이 우리가 쓸 것입니다.

```
git remote add origin https://github.com/hong-gildong/git-practice.git
git branch -M main
git push -u origin main
```

### Step 2. 원격 저장소 연결하기

**주소는 본인 것으로 바꿔서** 입력하세요.

```bash
cd ~/Desktop/git-practice
git remote add origin https://github.com/hong-gildong/git-practice.git
```

아무 출력이 없으면 성공입니다. 확인합니다.

```bash
git remote -v
```

실행 결과:

```
origin  https://github.com/hong-gildong/git-practice.git (fetch)
origin  https://github.com/hong-gildong/git-practice.git (push)
```

> `fetch`(받기)와 `push`(보내기) 주소가 따로 표시됩니다. 보통 같습니다.

### Step 3. 첫 push

```bash
git push -u origin main
```

**처음이라면 브라우저가 열리며 GitHub 로그인을 요구합니다.** `Authorize` 를 누르면 됩니다. (Windows의 Git Credential Manager가 자격 증명을 저장해 두므로 다음부터는 자동입니다)

실행 결과:

```
Enumerating objects: 42, done.
Counting objects: 100% (42/42), done.
Delta compression using up to 8 threads
Compressing objects: 100% (30/30), done.
Writing objects: 100% (42/42), 4.31 KiB | 1.08 MiB/s, done.
Total 42 (delta 12), reused 0 (delta 0), pack-reused 0
To https://github.com/hong-gildong/git-practice.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

**마지막 두 줄이 중요합니다.**

- `* [new branch] main -> main` — 원격에 `main` 브랜치가 새로 만들어졌습니다.
- `branch 'main' set up to track 'origin/main'` — **`-u` 옵션의 효과입니다.**

> **`-u` (= `--set-upstream`) 는 처음 한 번만** 붙이면 됩니다.
> "내 `main` 은 `origin/main` 과 짝" 이라고 등록하는 것이라, 이후로는 `git push` · `git pull` 만 쳐도 알아서 동작합니다.

브라우저에서 저장소를 새로고침하면 **파일이 전부 올라와 있습니다.**

연결 상태를 확인해 봅니다.

```bash
git branch -vv
```

실행 결과:

```
* main a8c3f01 [origin/main] feat: 인사말에 테두리 장식 추가
```

`[origin/main]` 이 붙어 있으면 짝이 지어진 것입니다.

### Step 4. 수정하고 다시 push

```bash
echo "## 라이선스" >> README.md
echo "MIT" >> README.md
git add README.md
git commit -m "docs: 라이선스 항목 추가"
git push
```

`-u` 를 이미 했으므로 `origin main` 을 생략할 수 있습니다.

실행 결과:

```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 341 bytes | 341.00 KiB/s, done.
Total 3 (delta 1), reused 0 (delta 0), pack-reused 0
To https://github.com/hong-gildong/git-practice.git
   a8c3f01..c2d5e78  main -> main
```

**`a8c3f01..c2d5e78`** — 원격의 `main` 이 이 범위만큼 앞으로 나갔다는 뜻입니다.

### Step 5. `clone` — 다른 컴퓨터인 척하기

집 컴퓨터에서 받는 상황을 흉내 냅니다. **다른 폴더**에 받아 보겠습니다.

```bash
cd ~/Desktop
git clone https://github.com/hong-gildong/git-practice.git git-practice-home
```

실행 결과:

```
Cloning into 'git-practice-home'...
remote: Enumerating objects: 45, done.
remote: Counting objects: 100% (45/45), done.
remote: Compressing objects: 100% (31/31), done.
remote: Total 45 (delta 13), reused 45 (delta 13), pack-reused 0
Receiving objects: 100% (45/45), 4.62 KiB | 4.62 MiB/s, done.
Resolving deltas: 100% (13/13), done.
```

```bash
cd git-practice-home
git log --oneline -3
```

실행 결과:

```
c2d5e78 (HEAD -> main, origin/main, origin/HEAD) docs: 라이선스 항목 추가
a8c3f01 feat: 인사말에 테두리 장식 추가
5e1d7f3 feat: 설명 출력 추가
```

**이력이 통째로 따라왔습니다.** 압축파일과 다른 점이 이것입니다.

> `git clone` 은 `git init` + `git remote add origin` + `git pull` 을 한 번에 합니다.
> 그래서 clone한 저장소는 `-u` 없이도 바로 `git push` 가 됩니다.

### Step 6. `fetch` 와 `pull` 차이 체감하기

**"집 컴퓨터"(`git-practice-home`)에서 커밋하고 올립니다.**

```bash
# git-practice-home 에서
echo "집에서 추가한 줄" >> README.md
git add README.md
git commit -m "docs: 집에서 작업한 내용 추가"
git push
```

**이제 "회사 컴퓨터"(원래 폴더)로 돌아갑니다.**

```bash
cd ~/Desktop/git-practice
git status
```

실행 결과:

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

> ⚠️ **`up to date` 라고 나오지만 사실이 아닙니다.**
> `origin/main` 은 **내 컴퓨터에 저장된 캐시**라 아직 갱신되지 않았습니다. Git은 자동으로 서버를 확인하지 않습니다.

`fetch` 로 서버 상태를 가져옵니다.

```bash
git fetch
```

실행 결과:

```
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 1), reused 3 (delta 1), pack-reused 0
From https://github.com/hong-gildong/git-practice
   c2d5e78..f4a9b31  main       -> origin/main
```

```bash
git status
```

실행 결과:

```
On branch main
Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)

nothing to commit, working tree clean
```

**이제 뒤처졌다는 것을 압니다.** 무엇이 달라졌는지 미리 볼 수도 있습니다.

```bash
git log --oneline main..origin/main
```

실행 결과:

```
f4a9b31 docs: 집에서 작업한 내용 추가
```

```bash
git diff main origin/main
```

내용을 확인했으니 합칩니다.

```bash
git pull
```

실행 결과:

```
Updating c2d5e78..f4a9b31
Fast-forward
 README.md | 1 +
 1 file changed, 1 insertion(+)
```

> **`fetch` → 확인 → `pull`** 이 안전한 흐름입니다.
> 익숙해지면 대부분 `pull` 만 쓰지만, **뭔가 이상할 때는 `fetch` 로 먼저 살펴보세요.**

### Step 7. 브랜치를 원격에 올리기

[08강](lesson-08.md)에서 배운 브랜치를 GitHub에도 올려 봅니다.

```bash
git switch -c feature/readme-badge
echo "![Git](https://img.shields.io/badge/git-practice-orange)" >> README.md
git add README.md
git commit -m "docs: README에 뱃지 추가"
git push
```

실행 결과:

```
fatal: The current branch feature/readme-badge has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin feature/readme-badge
```

**새 브랜치는 짝이 없으니 처음 한 번은 알려 줘야 합니다.** 안내대로 실행합니다.

```bash
git push -u origin feature/readme-badge
```

실행 결과:

```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), 389 bytes | 389.00 KiB/s, done.
Total 3 (delta 1), reused 0 (delta 0), pack-reused 0
remote:
remote: Create a pull request for 'feature/readme-badge' on GitHub by visiting:
remote:      https://github.com/hong-gildong/git-practice/pull/new/feature/readme-badge
remote:
To https://github.com/hong-gildong/git-practice.git
 * [new branch]      feature/readme-badge -> feature/readme-badge
branch 'feature/readme-badge' set up to track 'origin/feature/readme-badge'.
```

> **GitHub가 Pull Request 링크를 알려 줍니다.** PR은 "제 브랜치를 검토하고 합쳐 주세요" 라는 요청입니다.
> 팀 협업의 핵심이고, [14강](lesson-14.md)에서 본격적으로 다룹니다. 지금은 링크가 나온다는 것만 봐 두세요.

**매번 `-u` 를 치기 싫다면** 한 번 설정해 두면 됩니다.

```bash
git config --global push.autoSetupRemote true
```

이제 새 브랜치도 `git push` 만으로 올라갑니다.

**원격 브랜치 목록 보기**

```bash
git branch -a
```

실행 결과:

```
* feature/readme-badge
  main
  remotes/origin/HEAD -> origin/main
  remotes/origin/feature/readme-badge
  remotes/origin/main
```

**원격 브랜치 삭제**

```bash
git push origin --delete feature/readme-badge
```

### Step 8. 정리

연습용으로 만든 `git-practice-home` 폴더는 지워도 됩니다.

```bash
cd ~/Desktop
rm -rf git-practice-home        # PowerShell: Remove-Item -Recurse -Force git-practice-home
```

### 참고 — PAT와 SSH 키

Git Credential Manager가 동작하지 않거나, 여러 기기에서 쓰고 싶다면 아래를 참고하세요.

**① Personal Access Token (HTTPS)**

1. GitHub → 우측 상단 프로필 → **Settings**
2. 맨 아래 **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
   - Note: `내 노트북`
   - Expiration: 90 days (또는 필요한 기간)
   - **Select scopes: `repo` 체크** ← 이것만 있으면 됩니다
4. 생성된 토큰을 **복사해 안전한 곳에 보관** ← **화면을 벗어나면 다시 볼 수 없습니다**
5. `push` 시 비밀번호를 물으면 **토큰을 붙여넣습니다**

> 토큰은 **비밀번호와 똑같이** 취급하세요. 절대 코드나 커밋에 넣지 마세요([05강](lesson-05.md)).

**② SSH 키**

```bash
# 1) 키 만들기 (이메일은 GitHub 계정 것으로)
ssh-keygen -t ed25519 -C "hong@example.com"
# 물어보는 것은 전부 Enter (기본 위치, 비밀번호 없음)

# 2) 공개키 내용 복사
cat ~/.ssh/id_ed25519.pub
```

출력된 `ssh-ed25519 AAAA...` 전체를 복사한 뒤,
GitHub → Settings → **SSH and GPG keys** → **New SSH key** 에 붙여넣습니다.

```bash
# 3) 연결 확인
ssh -T git@github.com
```

실행 결과:

```
Hi hong-gildong! You've successfully authenticated, but GitHub does not provide shell access.
```

```bash
# 4) 원격 주소를 SSH 형식으로 바꾸기
git remote set-url origin git@github.com:hong-gildong/git-practice.git
```

### 같은 일을 GUI로 하면

| 하고 싶은 일 | VS Code |
|---|---|
| push | Source Control `···` → **Push**, 또는 상태 표시줄의 **↑↓ 아이콘** |
| pull | `···` → **Pull** |
| 원격 추가 | `···` → **Remote** → **Add Remote** |
| 저장소 clone | `Ctrl+Shift+P` → `Git: Clone` |
| 자동 동기화 | 상태 표시줄 **↻ (Sync Changes)** 버튼 = `pull` + `push` |

> ⚠️ **Sync Changes 버튼은 `pull` 과 `push` 를 한 번에** 합니다. 편하지만 무슨 일이 일어났는지 보이지 않습니다.
> 초급 동안에는 `push` 와 `pull` 을 따로 하며 출력을 읽는 편이 배우기 좋습니다.

---

## ⑤ 자주 하는 실수

### `remote: Support for password authentication was removed`

```
remote: Support for password authentication was removed on August 13, 2021.
fatal: Authentication failed for 'https://github.com/hong-gildong/git-practice.git/'
```

**원인** — GitHub 계정 **비밀번호**를 입력했습니다. 2021년 8월부터 막혔습니다.
**해결** — 비밀번호 자리에 **PAT(토큰)** 를 넣거나, SSH 키를 씁니다. (Step 8 참고)

> Windows에서 잘못된 자격 증명이 저장돼 계속 실패한다면 초기화하세요.
> **제어판 → 자격 증명 관리자 → Windows 자격 증명** 에서 `git:https://github.com` 항목을 삭제하고 다시 push하면 로그인 창이 다시 뜹니다.

### `error: remote origin already exists.`

```
error: remote origin already exists.
```

**원인** — 이미 `origin` 이 등록되어 있습니다. (주소를 잘못 넣고 다시 시도할 때 흔합니다)
**해결** — 현재 주소를 확인하고 바꿉니다.

```bash
git remote -v                                        # 현재 주소 확인
git remote set-url origin <올바른 주소>                # 주소 변경
# 또는
git remote remove origin && git remote add origin <주소>
```

### `! [rejected] main -> main (fetch first)`

```
To https://github.com/hong-gildong/git-practice.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/hong-gildong/git-practice.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
```

**원인** — 원격에 **내가 모르는 커밋**이 있습니다. 다른 기기에서 올렸거나, 팀원이 올렸거나, **저장소 생성 시 README를 체크**한 경우입니다.
**해결** — 먼저 받아서 합친 뒤 올립니다.

```bash
git pull
git push
```

> 🚨 **여기서 `git push --force` 를 쓰면 안 됩니다.** 원격에 있던 남의 작업이 통째로 사라집니다.
> "거부됐으니 강제로" 는 초급에서 가장 위험한 반사 행동입니다.

### `refusing to merge unrelated histories`

```
fatal: refusing to merge unrelated histories
```

**원인** — GitHub 저장소를 만들 때 **README를 체크**해서 원격에 커밋이 생겼고, 내 로컬 이력과 **공통 조상이 없습니다.**
**해결** — 관계없는 이력을 합치도록 허용합니다.

```bash
git pull origin main --allow-unrelated-histories
# 충돌이 나면 해결 후
git push -u origin main
```

**예방** — 저장소를 만들 때 **README·.gitignore·license를 전부 체크 해제**하세요. (Step 1)

### `fatal: The current branch ... has no upstream branch.`

**원인** — 새로 만든 브랜치는 원격의 짝이 없습니다.
**해결** — 안내 그대로 실행합니다.

```bash
git push -u origin <브랜치명>
```

매번 귀찮다면:

```bash
git config --global push.autoSetupRemote true
```

### `git status` 는 최신이라는데 실제로는 아님

```
Your branch is up to date with 'origin/main'.
```

**원인** — `origin/main` 은 **내 컴퓨터의 캐시**입니다. Git은 자동으로 서버를 확인하지 않습니다.
**해결** — `git fetch` 로 갱신한 뒤 다시 보세요.

```bash
git fetch
git status
```

### `git pull` 했더니 머지 커밋이 잔뜩 생김

```
Merge branch 'main' of https://github.com/... into main
```

**원인** — 내 로컬에도 커밋이 있고 원격에도 커밋이 있어서 매번 3-way merge가 일어납니다.
**해결** — 이력을 일직선으로 유지하고 싶다면 rebase 방식으로 당겨 옵니다.

```bash
git pull --rebase
```

항상 그렇게 하려면:

```bash
git config --global pull.rebase true
```

> `rebase` 의 원리와 주의사항은 [12강](lesson-12.md)에서 제대로 다룹니다. 지금은 옵션이 있다는 정도만 알아 두세요.

### `remote: error: File xxx is 123.00 MB; this exceeds GitHub's file size limit of 100.00 MB`

**원인** — GitHub는 **파일 하나당 100MB** 제한이 있습니다.
**해결** —

```bash
# 아직 push 전이라면 커밋에서 빼내기
git rm --cached big-file.zip
echo "big-file.zip" >> .gitignore
git commit --amend --no-edit
```

이미 여러 커밋 전에 들어갔다면 이력에서 지워야 합니다([29강](lesson-29.md)). 큰 파일을 계속 관리해야 한다면 **Git LFS**([28강](lesson-28.md))를 씁니다.

### 파일명 대소문자만 바꿨는데 반영이 안 됨

**원인** — Windows는 파일명 대소문자를 구분하지 않아 Git이 변경을 못 알아챕니다. macOS·Linux 팀원 쪽에서는 파일이 중복돼 보일 수 있습니다.
**해결** — `git mv` 를 두 단계로 씁니다.

```bash
git mv Readme.md temp.md
git mv temp.md README.md
git commit -m "chore: 파일명 대소문자 정정"
```

---

## ⑥ 확인 문제

**1.** `git fetch` 와 `git pull` 의 차이를 설명하고, **`fetch` 를 먼저 쓰는 것이 좋은 상황**을 예로 들어 보세요.

<details>
<summary>답 보기</summary>

```
git fetch  =  원격의 변경을 가져와 origin/main 만 갱신 (내 브랜치는 그대로)
git pull   =  git fetch + git merge origin/main
```

**`fetch` 를 먼저 쓰면 좋은 상황**

1. **내 로컬에도 커밋이 있을 때** — 바로 `pull` 하면 충돌이나 머지 커밋이 생깁니다. 먼저 무엇이 왔는지 확인하는 편이 안전합니다.

```bash
git fetch
git log --oneline main..origin/main     # 원격에만 있는 커밋
git diff main origin/main               # 무엇이 달라지는지
git pull                                # 확인했으니 합치기
```

2. **오랜만에 프로젝트를 열었을 때** — 그동안 얼마나 바뀌었는지 파악하고 나서 합치는 게 좋습니다.

3. **충돌이 예상될 때** — `fetch` 만 하면 작업 디렉터리가 전혀 건드려지지 않습니다. 마음의 준비를 하고 `pull` 할 수 있습니다.

**핵심** — `fetch` 는 **읽기 전용**이라 절대 손해 볼 일이 없습니다. 궁금하면 그냥 하세요.
</details>

**2.** `git push` 를 했더니 이런 에러가 났습니다. 원인과 **올바른 해결 순서**는?

```
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '...'
```

<details>
<summary>답 보기</summary>

**원인** — 원격에 **내가 갖고 있지 않은 커밋**이 있습니다. Git은 남의 작업을 덮어쓰지 않으려고 거부한 것입니다.

가능한 상황:
- 팀원이 먼저 push했다
- 다른 컴퓨터에서 내가 push했다
- GitHub 웹에서 파일을 직접 수정했다
- 저장소 생성 시 README를 체크했다

**해결 순서**

```bash
git fetch                                # ① 무엇이 왔는지 확인
git log --oneline main..origin/main      # ② 원격에만 있는 커밋 보기
git pull                                 # ③ 합치기 (충돌 나면 해결)
git push                                 # ④ 다시 올리기
```

`--allow-unrelated-histories` 가 필요한 경우는 ⑤의 `refusing to merge unrelated histories` 항목을 보세요.

**절대 하면 안 되는 것**

```bash
git push --force        # 🚨 원격의 남의 커밋이 사라집니다
```

거부는 **Git이 사고를 막아 준 것**입니다. 강제로 뚫지 말고 원인을 확인하세요.
</details>

**3.** 회사 컴퓨터에서 작업하고 push했습니다. 집에 와서 집 컴퓨터로 이어서 작업하려면 **어떤 명령**을 써야 할까요? 두 가지 경우로 나눠 답하세요.

<details>
<summary>답 보기</summary>

**① 집 컴퓨터에 저장소가 아직 없다 → `clone`**

```bash
cd ~/Desktop
git clone https://github.com/hong-gildong/git-practice.git
cd git-practice
```

`clone` 은 **이력 전체**를 받아 오고, `origin` 연결과 브랜치 추적까지 자동으로 설정됩니다. 바로 작업하고 `git push` 하면 됩니다.

**② 집 컴퓨터에 이미 있다 → `pull`**

```bash
cd ~/Desktop/git-practice
git pull
```

⚠️ **주의** — 집 컴퓨터에 **커밋 안 한 작업**이 남아 있으면 `pull` 이 막히거나 충돌합니다. 먼저 정리하세요.

```bash
git status              # 확인
git stash               # 잠시 치워 두기 (16강)
git pull
git stash pop           # 다시 꺼내기
```

**습관으로 만들 것**

```
작업 시작 전:  git pull     ← 최신 상태에서 시작
작업 끝난 뒤:  git push     ← 다른 기기에서 이어받을 수 있게
```

이 두 줄만 지키면 기기 간 작업이 꼬이는 일이 거의 없습니다.
</details>

---

## 오늘의 정리

| 명령 | 하는 일 |
|---|---|
| `git remote add origin <주소>` | 원격 저장소 연결 |
| `git remote -v` | 연결된 원격 확인 |
| `git remote set-url origin <주소>` | 주소 변경 |
| **`git push -u origin main`** | 첫 push (+ 추적 설정) |
| `git push` | 이후의 push |
| `git push -u origin <브랜치>` | 새 브랜치 올리기 |
| `git push origin --delete <브랜치>` | 원격 브랜치 삭제 |
| **`git clone <주소>`** | 저장소 통째로 받기 |
| `git fetch` | 원격 변경 **확인만** (안전) |
| `git pull` | `fetch` + `merge` |
| `git pull --rebase` | 머지 커밋 없이 당겨 오기 |
| `git branch -a` | 원격 포함 전체 브랜치 |
| `git branch -vv` | 브랜치별 추적 상태 |
| `git log main..origin/main` | 원격에만 있는 커밋 |

**핵심 개념**

```
main         = 내 로컬 브랜치
origin/main  = "마지막으로 확인했을 때 원격은 여기였다"는 캐시
             → git fetch 를 해야 갱신됩니다
```

**작업 흐름**

```
git pull        작업 시작 전 (최신 상태에서 시작)
   ↓
... 작업 · 커밋 ...
   ↓
git push        작업 끝난 뒤
```

**오늘 반드시 기억할 한 가지**
> **push가 거부되면 `--force` 가 아니라 `git pull` 입니다.**
> 거부는 에러가 아니라 Git이 남의 작업을 지키려고 막아 준 것입니다.

**과제**
1. GitHub에 `git-practice` 저장소를 만들고 지금까지의 이력을 전부 push하세요.
2. GitHub 웹에서 `README.md` 를 직접 수정해 커밋한 뒤, 로컬에서 `git fetch` → `git status` → `git pull` 순으로 실행하며 메시지가 어떻게 바뀌는지 관찰하세요.
3. 새 브랜치를 만들어 push하고, GitHub 화면에 브랜치가 나타나는 것과 **Pull Request 안내 배너**가 뜨는 것을 확인하세요.
4. 다른 폴더에 `clone` 해서 이력이 그대로 따라오는지 확인하세요.

---

[← 이전 08강](lesson-08.md) · [목차](README.md) · [다음 → 10강 초급 종합 실습](lesson-10.md)
