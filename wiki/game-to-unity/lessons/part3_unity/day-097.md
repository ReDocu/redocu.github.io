# Day 097 · Git과 Unity 프로젝트 버전 관리

> **Week 20** · Part 3 마무리
> 선수: Day 096 (빌드와 최적화)

---

## 1. 오늘 하는 것

**팀원 간 프로젝트를 충돌 없이 공유한다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  $ git log --oneline --graph                           │
   │  * 8f3a21c (HEAD -> main) Merge PR #3 from feat/tower  │
   │  |╲                                                    │
   │  | * 4c9e02a feat: 타워 업그레이드 UI 추가              │
   │  | * 1b7d445 feat: TowerData에 레벨별 스탯              │
   │  |╱                                                    │
   │  * a2f8901 fix: 적 스폰 위치 NavMesh 보정              │
   │  * 5e1c334 chore: .gitignore Unity 템플릿 적용         │
   │  * 9d0b117 Initial commit                              │
   │                                                        │
   │  $ git status                                          │
   │  On branch feat/enemy-ai                               │
   │  Changes not staged:                                   │
   │    modified: Assets/Scripts/EnemyController.cs         │
   │    modified: Assets/Prefabs/P_Enemy.prefab             │
   │                                                        │
   │  저장소 크기  38 MB   (Library/ 제외)                   │
   └────────────────────────────────────────────────────────┘
```

<!-- SHOT: Day 97 Git 로그 -->

---

## 2. 막히는 상황

파이널 프로젝트는 4주다. 팀으로 만든다.

```
   ★ USB로 주고받으면?

   ① 누가 최신인지 모른다
   ② 두 사람이 같은 파일을 고치면 하나가 사라진다
   ③ "어제까지 되던 게 안 된다" → 되돌릴 수 없다
   ④ 프로젝트가 5GB
```

```
   ★ Git을 쓰면?

   ① 모든 변경이 기록된다
   ② 언제든 되돌릴 수 있다
   ③ 누가 무엇을 바꿨는지 보인다
   ④ 병합이 자동으로
```

```
   ⚠️ 그런데 Unity 프로젝트는 다르다

   ① .meta 파일을 빠뜨리면 모든 참조가 끊긴다
   ② Library/ 를 커밋하면 저장소가 수 GB
   ③ 씬 파일은 병합이 거의 불가능
   ④ 바이너리 애셋은 diff가 안 된다
```

> **Unity 전용 설정을 먼저 한다.**

---

## 3. 개념

### 3-1. Git 기본 개념

**왜 필요한가** — 용어를 알아야 대화가 된다.

```
   작업 디렉터리        스테이징           저장소
   (Working Dir)      (Staging)         (Repository)

      파일 수정  ──add──▶  준비  ──commit──▶  기록
         ▲                                      │
         └──────────── checkout ────────────────┘
```

| 명령 | 의미 |
|---|---|
| `git init` | 저장소 생성 |
| `git status` | 현재 상태 |
| `git add <파일>` | 스테이징 |
| `git commit -m "..."` | 커밋 (기록) |
| `git log` | 이력 보기 |
| `git diff` | 변경 내용 |
| `git checkout <커밋>` | 그 시점으로 이동 |
| `git restore <파일>` | 변경 취소 |

```
   ★ 커밋 = 스냅샷

   그 시점의 프로젝트 전체 상태
   → 언제든 되돌아갈 수 있다
```

### 3-2. `.gitignore` — 가장 중요

**왜 필요한가** — 이것 하나로 저장소 크기가 100배 달라진다.

```
   ★ Unity가 만드는 폴더

   Library/     캐시. 수 GB. 자동 재생성  ★ 반드시 제외
   Temp/        임시                      ★ 제외
   Obj/         빌드 중간물               ★ 제외
   Logs/        로그                      ★ 제외
   Build/       빌드 산출물               ★ 제외
   UserSettings/ 개인 설정                ★ 제외
   .vs/ .idea/  IDE 설정                  ★ 제외
```

```gitignore
# ─── Unity 생성 폴더 ───
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]serSettings/
[Mm]emoryCaptures/
[Rr]ecordings/

# ─── 애셋 스토어 ───
/[Aa]ssets/AssetStoreTools*
/[Aa]ssets/Plugins/Editor/JetBrains*

# ─── IDE ───
.vs/
.idea/
.vscode/
.gradle/
*.csproj
*.unityproj
*.sln
*.suo
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db

# ─── OS ───
.DS_Store
Thumbs.db
desktop.ini

# ─── 빌드 결과 ───
*.apk
*.aab
*.unitypackage
*.app
ExportedObj/
.consulo/
*.exe

# ─── 크래시 ───
sysinfo.txt
crashlytics-build.properties

# ─── 절대 무시하면 안 되는 것 ───
# !*.meta          ← .meta는 반드시 커밋한다
```

```
   ★ 공식 템플릿

   github.com/github/gitignore/blob/main/Unity.gitignore
   → 이것을 그대로 쓴다
```

```
   ⚠️ .gitignore를 나중에 추가하면

   이미 추적 중인 파일은 계속 추적된다

   ★ 해결
   git rm -r --cached .
   git add .
   git commit -m "chore: apply gitignore"
```

### 3-3. `.meta` 파일 — 절대 지우지 않는다

**왜 필요한가** — Unity 참조의 핵심.

```
   ★ .meta 파일이 하는 일

   Assets/Art/Hero.fbx
   Assets/Art/Hero.fbx.meta   ← GUID 저장

   guid: 3f2a91c4b8e04d3e9a1c5f7d2b8e6a41
```

```
   ★ Unity의 참조 방식

   프리팹이 "Hero.fbx" 경로를 참조하는 게 아니라
   GUID를 참조한다

   → 파일을 옮기거나 이름을 바꿔도 참조가 유지된다
   → 하지만 .meta가 없으면 새 GUID가 생성된다
   → 모든 참조가 끊긴다  ✗
```

```
   ⚠️ .meta를 빠뜨리면 생기는 일

   ① 머티리얼이 전부 분홍색
   ② 프리팹의 스크립트가 "Missing"
   ③ 애니메이터 클립이 없어짐
   ④ Inspector 연결이 전부 None
```

```
   ★ 반드시 확인

   Project Settings → Editor
   → Version Control → Mode: Visible Meta Files  ★
```

```
   ★ 폴더에도 .meta가 있다

   Assets/Scripts/
   Assets/Scripts.meta

   → 폴더를 커밋할 때 함께
```

### 3-4. Asset Serialization — Force Text

**왜 필요한가** — diff와 병합이 가능해진다.

```
   Project Settings → Editor
   → Asset Serialization → Mode: Force Text  ★
```

| Mode | 형식 |
|---|---|
| Mixed | 일부만 텍스트 |
| **Force Text** | YAML 텍스트 ★ |
| Force Binary | 바이너리 |

```
   ★ Force Text의 효과

   .unity, .prefab, .asset, .mat 등이 YAML로 저장된다
   → git diff로 변경 내용이 보인다
   → 충돌 시 수동 병합이 (어렵지만) 가능하다
```

```yaml
   # 프리팹 diff 예시
   -  m_LocalScale: {x: 1, y: 1, z: 1}
   +  m_LocalScale: {x: 1.5, y: 1.5, z: 1.5}
```

```
   ⚠️ 파일 크기가 커진다

   바이너리보다 2~3배
   → 하지만 협업 이점이 훨씬 크다
```

```
   ★ Day 78에서 이미 설정했다

   ScriptableObject의 Git diff를 위해
```

### 3-5. Git LFS

**왜 필요한가** — 대용량 바이너리.

```
   ★ Git의 약점

   바이너리 파일은 변경할 때마다 전체가 저장된다

   10MB 텍스처를 10번 수정
   → 저장소에 100MB 누적
```

```
   ★ Git LFS (Large File Storage)

   실제 파일은 별도 서버에
   저장소에는 포인터만
```

```bash
   git lfs install

   git lfs track "*.psd"
   git lfs track "*.fbx"
   git lfs track "*.png"
   git lfs track "*.wav"
   git lfs track "*.mp3"
   git lfs track "*.tga"

   git add .gitattributes
   git commit -m "chore: setup Git LFS"
```

```
   ★ .gitattributes 예시
```

```gitattributes
# ─── Git LFS ───
*.psd  filter=lfs diff=lfs merge=lfs -text
*.fbx  filter=lfs diff=lfs merge=lfs -text
*.png  filter=lfs diff=lfs merge=lfs -text
*.jpg  filter=lfs diff=lfs merge=lfs -text
*.tga  filter=lfs diff=lfs merge=lfs -text
*.wav  filter=lfs diff=lfs merge=lfs -text
*.mp3  filter=lfs diff=lfs merge=lfs -text
*.ogg  filter=lfs diff=lfs merge=lfs -text
*.mp4  filter=lfs diff=lfs merge=lfs -text

# ─── Unity YAML 병합 도구 ───
*.unity   merge=unityyamlmerge eol=lf
*.prefab  merge=unityyamlmerge eol=lf
*.asset   merge=unityyamlmerge eol=lf
*.mat     merge=unityyamlmerge eol=lf
*.anim    merge=unityyamlmerge eol=lf
*.controller merge=unityyamlmerge eol=lf
```

```
   ⚠️ LFS 용량 제한

   GitHub 무료 계정: 1GB 저장 + 1GB/월 대역폭
   → 초과하면 유료

   ★ 학습용 프로젝트는 대부분 무료 범위 안
```

```
   ⚠️ LFS를 나중에 적용하면

   이미 커밋된 파일은 여전히 일반 파일
   → git lfs migrate 필요 (이력이 바뀐다)

   ★ 처음부터 설정한다
```

### 3-6. 브랜치

**왜 필요한가** — 병렬 작업.

```
   main    ●───●───●───────────●───▶
                    ╲         ╱
   feat/tower        ●───●───●
```

```bash
   git branch feat/tower          # 브랜치 생성
   git switch feat/tower          # 이동 (구: checkout)
   git switch -c feat/tower       # 생성 + 이동

   git branch                     # 목록
   git merge feat/tower           # 병합 (main에서)
   git branch -d feat/tower       # 삭제
```

```
   ★ 브랜치 전략 (팀 4명 기준)

   main          항상 동작하는 상태
   develop       통합 브랜치 (선택)
   feat/xxx      기능 개발
   fix/xxx       버그 수정
```

```
   ★ 커밋 메시지 규칙 (Conventional Commits)

   feat:     새 기능
   fix:      버그 수정
   refactor: 리팩터링
   chore:    설정·잡무
   docs:     문서
   perf:     성능
   test:     테스트

   예)
   feat: 타워 업그레이드 시스템 추가
   fix: 적이 NavMesh 밖에서 스폰되는 문제
   perf: 이펙트 풀링으로 GC 6KB 제거
```

```
   ★ 좋은 커밋

   ① 한 가지 일만 한다
   ② 빌드가 되는 상태로
   ③ 메시지로 무엇을 왜 했는지 알 수 있다
```

### 3-7. 씬 충돌 — 병합하지 않는다

**왜 필요한가** — Unity 협업의 최대 난제.

```
   ★ 씬 파일이 병합이 어려운 이유

   ① 수천 줄의 YAML
   ② 오브젝트가 GUID + fileID로 참조
   ③ 순서가 바뀌면 전체가 diff
   ④ 잘못 병합하면 씬이 깨진다
```

```
   ★ 해결책 3가지

   ① 분업 — 한 씬은 한 명만 (가장 확실)  ★
   ② 프리팹으로 분리 — 씬에는 배치만
   ③ 씬 분할 — Additive Loading
```

```
   ★ 프리팹 분리 패턴

   Scene: Game.unity
   ├─ _Managers (프리팹)      ← A가 담당
   ├─ _UI (프리팹)            ← B가 담당
   ├─ _Level (프리팹)         ← C가 담당
   └─ _Player (프리팹)        ← D가 담당

   → 씬 파일 자체는 거의 안 바뀐다
```

```
   ★ Unity YAML Merge Tool

   Unity가 제공하는 병합 도구
   Editor/Data/Tools/UnityYAMLMerge.exe
```

```bash
   # .git/config 또는 ~/.gitconfig
   [merge "unityyamlmerge"]
       tool = unityyamlmerge
       trustExitCode = false
       cmd = 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.0.30f1\\Editor\\Data\\Tools\\UnityYAMLMerge.exe' merge -p "$BASE" "$REMOTE" "$LOCAL" "$MERGED"
```

```
   ⚠️ 그래도 완벽하지 않다

   → 분업이 최선
```

```
   ★ 충돌이 났을 때 (씬)

   병합하려 하지 말고 한쪽을 선택한다

   git checkout --ours Assets/Scenes/Game.unity    # 내 것
   git checkout --theirs Assets/Scenes/Game.unity  # 상대 것
   git add Assets/Scenes/Game.unity
```

### 3-8. GitHub

**왜 필요한가** — 원격 저장소.

```bash
   # 원격 연결
   git remote add origin https://github.com/user/repo.git
   git branch -M main
   git push -u origin main

   # 이후
   git push
   git pull

   # 클론
   git clone https://github.com/user/repo.git
```

```
   ★ Pull Request (PR)

   ① 브랜치에서 작업
   ② push
   ③ GitHub에서 PR 생성
   ④ 팀원이 리뷰
   ⑤ 병합
```

```
   ★ PR의 이점

   ① 코드 리뷰
   ② 변경 내역이 문서화된다
   ③ main이 안전하다
```

```
   ★ 저장소 설정

   Settings → Branches → Branch protection rules
   → main에 직접 push 금지
   → PR 필수
```

### 3-9. 흔한 실수와 복구

**왜 필요한가** — 반드시 겪는다.

**① 커밋을 잘못했다 (아직 push 전)**

```bash
   git commit --amend -m "새 메시지"     # 메시지 수정
   git reset --soft HEAD~1               # 커밋 취소 (변경은 유지)
   git reset --hard HEAD~1               # 커밋 + 변경 전부 취소  ⚠️
```

**② 잘못된 파일을 커밋했다**

```bash
   git rm --cached <파일>
   git commit -m "chore: remove accidentally committed file"
```

**③ Library/를 커밋했다**

```bash
   git rm -r --cached Library
   echo "Library/" >> .gitignore
   git add .gitignore
   git commit -m "chore: remove Library from tracking"
```

```
   ⚠️ 이력에서 완전히 지우려면

   git filter-repo 또는 BFG Repo-Cleaner
   → 이력이 바뀌므로 팀원 전체가 다시 클론해야 한다
```

**④ 작업 중인데 브랜치를 바꿔야 한다**

```bash
   git stash                    # 임시 보관
   git switch main
   # ... 작업 ...
   git switch feat/xxx
   git stash pop                # 복원
```

**⑤ 되돌리고 싶다 (push 후)**

```bash
   git revert <커밋>             # 반대 커밋을 만든다  ★ 안전
   # git reset은 이력을 바꾸므로 공유 브랜치에서 금지
```

### 3-10. Unity + Git 체크리스트

**왜 필요한가** — 한 번에 정리.

| 항목 | 설정 |
|---|---|
| **`.gitignore`** | Unity 템플릿 (`Library/`, `Temp/`, `Build/` 제외) |
| **Asset Serialization** | Project Settings → Editor → **Force Text** |
| **Version Control Mode** | **Visible Meta Files** |
| **`.meta` 파일** | **반드시 함께 커밋** |
| **Git LFS** | 이미지·모델·오디오 |
| **씬 충돌** | 분업. 프리팹으로 분리 |
| Line Endings | `.gitattributes`에 `* text=auto` |
| 커밋 단위 | 한 가지 일. 빌드되는 상태 |

```
   ★ 클론 후 첫 실행

   ① Unity Hub에서 프로젝트 열기
   ② Library/ 가 없으므로 재생성 (5~15분)
   ③ 정상 동작 확인
```

```
   ⚠️ 첫 오픈이 느린 것은 정상이다

   모든 애셋을 다시 임포트한다
```

### 3-11. 팀 협업 규칙

**왜 필요한가** — 사고를 예방한다.

```
   ★ 최소 규칙 5가지

   ① 작업 시작 전 반드시 git pull
   ② 하루에 최소 1회 커밋 + push
   ③ 씬 파일은 담당자만 수정
   ④ main에 직접 push 금지 (PR)
   ⑤ 커밋 전 빌드 확인
```

```
   ★ 데일리 스탠드업 (10분)

   ① 어제 한 것
   ② 오늘 할 것
   ③ 막힌 것

   → 충돌을 미리 발견한다
```

```
   ★ 씬 락 (Scene Lock) 관행

   "Game.unity 작업 시작합니다"
   → 채팅에 알린다
   "Game.unity 작업 끝, push 완료"

   → 도구 없이도 충돌을 크게 줄인다
```

### 3-12. README

**왜 필요한가** — 남이 열 수 있어야 한다.

```markdown
# 프로젝트 이름

한 줄 소개.

## 환경
- Unity 6000.0.30f1
- URP
- Windows

## 실행 방법
1. Unity Hub에서 이 폴더를 프로젝트로 추가
2. `Assets/Scenes/Title.unity` 열기
3. Play

## 조작
| 키 | 동작 |
|---|---|
| WASD | 이동 |
| Space | 점프 |

## 폴더 구조
Assets/
├─ Scenes/
├─ Scripts/
├─ Prefabs/
├─ Art/
└─ Data/

## 팀
- A: 게임플레이
- B: UI
- C: 레벨
- D: 아트·사운드

## 사용 애셋
- 캐릭터: Mixamo (무료)
- 아이콘: Kenney (CC0)
```

---

## 4. 따라 만들기

### Step 1 — Git 설치 확인

```bash
   git --version
```

```
   없으면 git-scm.com 에서 설치
```

```bash
   # 최초 1회 설정
   git config --global user.name "이름"
   git config --global user.email "이메일"

   # 기본 브랜치 이름
   git config --global init.defaultBranch main

   # 한글 파일명 깨짐 방지 (Windows)
   git config --global core.quotepath false
```

**✅ 여기까지 하면** — Git 준비 완료.

### Step 2 — Unity 설정

```
   Project Settings → Editor

   Version Control
     Mode: Visible Meta Files     ★

   Asset Serialization
     Mode: Force Text             ★
```

**✅ 여기까지 하면** — 협업 준비 완료.

```
   ⚠️ 프로젝트를 만든 직후에 설정한다

   나중에 바꾸면 모든 애셋이 재직렬화된다 (시간 소요)
```

### Step 3 — .gitignore

```
   프로젝트 루트에 .gitignore 생성
   → 3-2절의 내용 붙여넣기
```

```
   ⚠️ 위치

   MyProject/
   ├─ .gitignore     ★ 여기
   ├─ Assets/
   ├─ Packages/
   ├─ ProjectSettings/
   └─ Library/       (제외 대상)
```

**✅ 여기까지 하면** — 준비 완료.

### Step 4 — 저장소 초기화

```bash
   cd MyProject
   git init
   git add .
   git status
```

**✅ 여기까지 하면**

```
   ★ 확인 사항

   [ ] Library/ 가 목록에 없다
   [ ] Temp/ 가 없다
   [ ] .meta 파일이 있다
   [ ] Assets/, Packages/, ProjectSettings/ 가 있다
```

```
   ⚠️ Library/ 가 보이면

   .gitignore 위치나 내용 확인
```

### Step 5 — 크기 확인

```bash
   # Windows PowerShell
   (Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
```

```
   ★ 비교

   .gitignore 없이:  4,200 MB
   .gitignore 적용:     38 MB

   → 110배 차이
```

### Step 6 — 첫 커밋

```bash
   git commit -m "Initial commit: Unity 6 URP project setup"
   git log --oneline
```

**✅ 여기까지 하면**

```
   9d0b117 (HEAD -> main) Initial commit: Unity 6 URP project setup
```

<!-- SHOT: Step 6 첫 커밋 -->

### Step 7 — Git LFS

```bash
   git lfs install

   git lfs track "*.psd"
   git lfs track "*.fbx"
   git lfs track "*.png"
   git lfs track "*.jpg"
   git lfs track "*.tga"
   git lfs track "*.wav"
   git lfs track "*.mp3"
   git lfs track "*.ogg"

   git add .gitattributes
   git commit -m "chore: setup Git LFS for binary assets"
```

```bash
   # 확인
   git lfs ls-files
```

**✅ 여기까지 하면** — 바이너리가 LFS로 관리된다.

```
   ⚠️ 이미 커밋된 파일은 LFS로 안 간다

   → 처음부터 설정하거나
   → git lfs migrate import --include="*.png"
```

### Step 8 — .meta 실험

**Assets에 새 스크립트를 만든다.**

```bash
   git status
```

```
   Untracked files:
     Assets/Scripts/Test.cs
     Assets/Scripts/Test.cs.meta      ★ 함께 나온다
```

**`.meta`만 제외하고 커밋해 본다.**

```bash
   git add Assets/Scripts/Test.cs
   git commit -m "test: add without meta"
```

**다른 폴더에 클론해서 열어 본다.**

**✅ 이렇게 하면**

```
   ★ Unity가 새 .meta를 생성한다
   ★ GUID가 달라진다
   ★ 프리팹에 붙였던 스크립트가 "Missing"
```

> ### ★ 이것이 3-3절의 함정이다
>
> **`.meta`를 함께 커밋한다.**

### Step 9 — GitHub 저장소

```
   github.com → New repository
   이름: my-final-project
   Private (또는 Public)
   README, .gitignore, license는 추가하지 않는다 (이미 있음)
```

```bash
   git remote add origin https://github.com/user/my-final-project.git
   git branch -M main
   git push -u origin main
```

**✅ 여기까지 하면** — GitHub에 올라간다.

```
   ⚠️ 인증

   비밀번호 대신 Personal Access Token 사용
   Settings → Developer settings → Personal access tokens

   또는 GitHub CLI (gh auth login)
   또는 SSH 키
```

### Step 10 — 팀원 클론

**옆자리 PC에서:**

```bash
   git clone https://github.com/user/my-final-project.git
   cd my-final-project
```

```
   Unity Hub → Add → 이 폴더 선택
   → 열기 (Library 재생성, 5~15분)
```

**✅ 여기까지 하면**

```
   ★ 확인 사항

   [ ] 씬이 정상적으로 열린다
   [ ] 머티리얼이 분홍색이 아니다
   [ ] 프리팹의 스크립트가 연결돼 있다
   [ ] Inspector 참조가 살아 있다
   [ ] Play가 된다
```

```
   ⚠️ 참조가 끊겼다면

   .meta 누락 → .gitignore 확인
```

<!-- SHOT: Step 10 클론 후 정상 오픈 -->

### Step 11 — 브랜치 작업

**A가 작업:**

```bash
   git switch -c feat/tower-upgrade
   # ... 작업 ...
   git add .
   git commit -m "feat: 타워 업그레이드 시스템 추가"
   git push -u origin feat/tower-upgrade
```

**B가 작업:**

```bash
   git switch -c feat/enemy-ai
   # ... 작업 ...
   git add .
   git commit -m "feat: 적 AI 순찰 상태 추가"
   git push -u origin feat/enemy-ai
```

**✅ 여기까지 하면** — 브랜치 2개가 병렬로.

### Step 12 — Pull Request

```
   GitHub → Pull requests → New pull request
   base: main  ←  compare: feat/tower-upgrade

   제목: 타워 업그레이드 시스템
   설명:
   - TowerData에 레벨별 스탯 추가
   - 업그레이드 UI 구현
   - 판매 시 투자액 70% 반환

   테스트: 웨이브 5까지 진행하며 업그레이드 확인
```

**팀원이 리뷰 → Merge.**

**✅ 여기까지 하면** — main에 병합된다.

### Step 13 — 충돌 만들기 (스크립트)

**A와 B가 같은 파일의 같은 줄을 수정한다.**

```csharp
    // A: enemySpeed = 5f;
    // B: enemySpeed = 3.5f;
```

**A가 먼저 병합한 뒤 B가 pull:**

```bash
   git switch main
   git pull
   git switch feat/enemy-ai
   git merge main
```

**✅ 이렇게 하면**

```
   Auto-merging Assets/Scripts/EnemyController.cs
   CONFLICT (content): Merge conflict in EnemyController.cs
```

```csharp
<<<<<<< HEAD
    private float enemySpeed = 3.5f;
=======
    private float enemySpeed = 5f;
>>>>>>> main
```

**해결:**

```csharp
    private float enemySpeed = 4f;             // 합의한 값
```

```bash
   git add Assets/Scripts/EnemyController.cs
   git commit -m "fix: resolve enemySpeed conflict"
```

**✅ 여기까지 하면** — 충돌 해결 경험 완료.

<!-- SHOT: Step 13 충돌 해결 -->

### Step 14 — 충돌 만들기 (씬)

**A와 B가 같은 씬에 오브젝트를 추가한다.**

**병합해 본다.**

**✅ 이렇게 하면**

```
   CONFLICT (content): Merge conflict in Assets/Scenes/Game.unity

   → YAML이 수천 줄
   → 수동 병합이 사실상 불가능
```

```bash
   # 한쪽을 선택한다
   git checkout --theirs Assets/Scenes/Game.unity
   git add Assets/Scenes/Game.unity
   git commit -m "fix: resolve scene conflict (take remote)"
```

```
   ★ 잃어버린 작업은 다시 한다
   → 그래서 분업이 중요하다
```

> ### ★ 3-7절의 교훈

### Step 15 — 프리팹 분리

```
   Game.unity
   ├─ _Managers (프리팹)
   ├─ _UI (프리팹)
   ├─ _Level (프리팹)
   └─ _Player (프리팹)
```

**각자 자기 프리팹만 수정한다.**

**✅ 여기까지 하면**

```
   ★ 씬 파일이 거의 안 바뀐다
   ★ 프리팹 충돌은 씬보다 훨씬 다루기 쉽다
```

```
   ⚠️ 프리팹 안에서 다른 프리팹을 참조하면

   여전히 충돌 가능
   → 코드로 찾거나 (Day 78의 SO 이벤트 채널)
   → 매니저를 통해 연결
```

### Step 16 — Library를 실수로 커밋

**일부러 .gitignore에서 Library/ 를 빼고 커밋해 본다.**

```bash
   git add .
   git status | Select-Object -First 20
```

```
   → 수만 개 파일
   → 커밋하면 저장소가 GB 단위
```

```bash
   # 복구
   git rm -r --cached Library
   # .gitignore에 Library/ 복구
   git add .gitignore
   git commit -m "chore: remove Library from tracking"
```

```
   ⚠️ 이미 push했다면

   이력에 남는다 → 저장소는 계속 크다
   → git filter-repo 또는 새 저장소
```

### Step 17 — 되돌리기 실습

```bash
   # 이력 확인
   git log --oneline

   # 특정 커밋의 파일 내용 보기
   git show <커밋>:Assets/Scripts/Player.cs

   # 그 시점으로 파일 복원
   git checkout <커밋> -- Assets/Scripts/Player.cs

   # 커밋 자체를 되돌리기 (안전)
   git revert <커밋>
```

**✅ 여기까지 하면** — 되돌리기를 익혔다.

```
   ★ "어제까지 되던 게 안 된다"

   git log 로 어제 커밋을 찾는다
   git diff <어제커밋> HEAD 로 무엇이 바뀌었는지
   → 원인을 좁힌다
```

```
   ★ git bisect (고급)

   이분 탐색으로 버그가 들어온 커밋을 찾는다
   → Day 63의 이진 탐색과 같은 원리
```

### Step 18 — Branch Protection

```
   GitHub → Settings → Branches → Add rule

   Branch name pattern: main
   ✔ Require a pull request before merging
   ✔ Require approvals: 1
```

**✅ 여기까지 하면** — main에 직접 push가 막힌다.

### Step 19 — README

3-12절의 템플릿으로 작성한다.

```bash
   git add README.md
   git commit -m "docs: add README"
   git push
```

**✅ 여기까지 하면** — GitHub 첫 화면에 표시된다.

### Step 20 — 파이널 프로젝트 저장소

```
   ① 팀 저장소 생성
   ② .gitignore + Force Text + Visible Meta Files
   ③ Git LFS 설정
   ④ README 뼈대
   ⑤ 브랜치 규칙
   ⑥ 전원 클론 + 빌드 성공 확인
```

```
   ★ 폴더 구조 합의
```

```
   Assets/
   ├─ _Project/           ★ 우리가 만든 것
   │   ├─ Scenes/
   │   ├─ Scripts/
   │   ├─ Prefabs/
   │   ├─ Art/
   │   ├─ Audio/
   │   └─ Data/
   ├─ ThirdParty/         ★ 외부 애셋
   │   ├─ Mixamo/
   │   └─ Kenney/
   └─ Plugins/
```

```
   ★ _Project 폴더를 쓰는 이유

   ① 애셋 스토어 패키지와 섞이지 않는다
   ② 정렬 시 맨 위 (언더스코어)
   ③ 우리 것만 백업·이동하기 쉽다
```

**✅ 여기까지 하면** — 파이널 프로젝트 준비 완료.

---

## 5. 실행 결과

**정상이라면 이렇게 보인다.**

```
   ┌────────────────────────────────────────────────────────┐
   │  $ git log --oneline --graph                           │
   │  * 8f3a21c (HEAD -> main) Merge PR #3 from feat/tower  │
   │  |╲                                                    │
   │  | * 4c9e02a feat: 타워 업그레이드 UI 추가              │
   │  | * 1b7d445 feat: TowerData에 레벨별 스탯              │
   │  |╱                                                    │
   │  * a2f8901 fix: 적 스폰 위치 NavMesh 보정              │
   │  * 5e1c334 chore: setup Git LFS                        │
   │  * 9d0b117 Initial commit                              │
   │                                                        │
   │  $ git lfs ls-files | head -3                          │
   │  3f2a91c4b8 * Assets/_Project/Art/Textures/road.png    │
   │  8e1d4a20c9 * Assets/_Project/Art/Models/car.fbx       │
   │  1c7b93f5e2 * Assets/_Project/Audio/bgm.ogg            │
   │                                                        │
   │  저장소 크기  38 MB   (Library/ 제외)                   │
   └────────────────────────────────────────────────────────┘
```

- [ ] Git을 설치하고 사용자 정보를 설정했다
- [ ] **Version Control Mode: Visible Meta Files**
- [ ] **Asset Serialization: Force Text**
- [ ] Unity `.gitignore`를 적용했다
- [ ] `Library/`가 추적되지 않는다
- [ ] 저장소 크기가 4GB → 40MB 수준
- [ ] 첫 커밋을 만들었다
- [ ] Git LFS를 설정했다
- [ ] **`.meta`를 빠뜨리면 참조가 끊긴다는 것을 확인했다**
- [ ] GitHub에 push했다
- [ ] **다른 PC에서 클론해 정상 오픈했다**
- [ ] 머티리얼·프리팹 참조가 살아 있다
- [ ] 브랜치를 만들어 작업했다
- [ ] Pull Request로 병합했다
- [ ] 스크립트 충돌을 해결했다
- [ ] **씬 충돌은 병합이 불가능하다는 것을 확인했다**
- [ ] 프리팹 분리로 씬 충돌을 회피했다
- [ ] Library를 실수로 커밋했을 때의 복구를 익혔다
- [ ] `git revert`로 안전하게 되돌렸다
- [ ] Branch Protection을 설정했다
- [ ] README를 작성했다
- [ ] **파이널 프로젝트 저장소가 준비됐다**

---

## 6. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| **참조가 다 끊김** | `.meta` 미커밋 | `.gitignore` 확인 |
| 참조가 다 끊김 | Hidden Meta Files | Visible Meta Files |
| **저장소가 수 GB** | `Library/` 커밋 | `git rm -r --cached Library` |
| diff가 안 보임 | Force Binary | Force Text |
| **씬 병합 충돌** | 동시 수정 | 분업. 한쪽 선택 |
| LFS가 안 먹힘 | 이미 커밋됨 | `git lfs migrate` |
| push 인증 실패 | 비밀번호 방식 폐지 | Personal Access Token |
| 한글 파일명 깨짐 | quotepath | `core.quotepath false` |
| 줄바꿈 경고 | CRLF/LF | `.gitattributes`에 `* text=auto` |
| 클론 후 오래 걸림 | Library 재생성 | 정상 (5~15분) |
| 커밋했는데 반영 안 됨 | push 안 함 | `git push` |
| main에 push 거부 | Branch Protection | PR 사용 |
| 프리팹 충돌 | 동시 수정 | 담당 분리 |
| 빌드 폴더 커밋 | `.gitignore` 누락 | `Build/` 추가 |

---

## 7. 정리

### 오늘 배운 것

| 개념 | 한 줄 요약 |
|---|---|
| Git 3영역 | 작업 디렉터리 → 스테이징 → 저장소 |
| **`.gitignore`** | `Library/` 제외. 저장소 크기 100배 차이 |
| **`.meta` 파일** | GUID 저장. **절대 빠뜨리지 않는다** |
| Visible Meta Files | 협업 필수 설정 |
| **Force Text** | YAML 직렬화. diff 가능 |
| **Git LFS** | 바이너리 대용량 |
| 브랜치 | `feat/xxx`, `fix/xxx` |
| 커밋 메시지 | `feat:`, `fix:`, `chore:` ... |
| **씬 충돌** | 병합 불가. **분업이 최선** |
| 프리팹 분리 | 씬 파일 변경 최소화 |
| Pull Request | 리뷰 + 문서화 + main 보호 |
| `git revert` | 안전한 되돌리기 |
| `git stash` | 임시 보관 |
| `_Project` 폴더 | 우리 것과 외부 애셋 분리 |
| README | 남이 열 수 있게 |

### Part 2와의 대응

| Part 2 | Unity + Git |
|---|---|
| Day 59 파일 포맷 버전 | 커밋 이력 |
| Day 59 안전 저장 | 커밋 = 스냅샷 |
| Day 70 통합 점검 | 클론 후 빌드 확인 |
| Day 78 Force Text | 오늘 다시 |

### 이 개념이 앞으로 쓰이는 곳

| 언제 | 어떻게 |
|---|---|
| **Day 99** | 저장소 세팅 완료 |
| Day 100 | 3차 평가 (Git 이력) |
| Day 101~120 | 파이널 프로젝트 내내 |

### 직접 해보기

| 난이도 | 과제 | 힌트 |
|:--:|---|---|
| ★ | 커밋 10개를 만들고 이력 확인 | `git log --graph` |
| ★★ | `.gitattributes`로 줄바꿈 통일 | `* text=auto` |
| ★★ | GitHub Issues로 작업 관리 | 커밋에 `#3` 참조 |
| ★★★ | `git bisect`로 버그 커밋 찾기 | 이분 탐색 |
| ★★★ | GitHub Actions로 자동 빌드 | game-ci/unity-builder |
| ★★★★ | Unity YAML Merge Tool 설정 | `.git/config` |

### 다음 시간

> 협업 준비가 끝났다. 그런데 **무엇을 만들지 정해야 한다.**
>
> ```
>   파이널 프로젝트는 4주다

>   × "RPG를 만들겠습니다" → 4주에 불가능
>   × "재미있는 게임" → 무엇을 만들지 모른다
>   × 범위를 정하지 않으면 아무것도 완성되지 않는다
> ```
>
> **GDD(게임 디자인 문서)**를 쓴다.
>
> 그리고 오늘의 진짜 목적은 **깎는 것**이다.
> 제외 목록에 무엇을 넣느냐가 완성을 결정한다.
>
> → **Day 98, GDD 작성**
