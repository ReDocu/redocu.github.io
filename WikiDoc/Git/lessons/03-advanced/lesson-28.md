# 28강 · 대형 저장소 다루기

> **Git 학습 매뉴얼** · 🔴 고급 · **28강 / 30**
> [← 이전 27강](lesson-27.md) · [목차](README.md) · [다음 → 29강 히스토리 재작성과 사고 대응](lesson-29.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 저장소가 무거워지는 원인을 진단하고 **가장 큰 객체를 찾아낼** 수 있다.
- **submodule**과 **subtree**로 외부 저장소를 포함시키고, 둘의 차이를 판단할 수 있다.
- **Git LFS**로 대용량 파일을 관리할 수 있다.
- **worktree**로 브랜치 여러 개를 동시에 열어 둘 수 있다.
- **sparse-checkout**과 **shallow clone**으로 큰 저장소를 부분만 받을 수 있다.

---

## ② 왜 필요한가

[21강](lesson-21.md)에서 배운 대로 **Git 객체는 불변**입니다. 한 번 들어간 것은 남습니다.

```
clone 에 20분
git status 에 5초
.git 폴더가 8GB
```

이런 저장소는 실제로 흔합니다. 원인은 세 가지입니다.

| 원인 | 왜 |
|---|---|
| **바이너리 파일** | 이미지·동영상·엑셀은 조금만 바뀌어도 **통째로 새 blob** ([01강](lesson-01.md)) |
| **긴 이력** | 커밋 수십만 개 |
| **큰 작업 디렉터리** | 파일 수십만 개 → `git status` 가 느려짐 |

그리고 이런 요구도 생깁니다.

| 요구 | 도구 |
|---|---|
| 여러 프로젝트가 **같은 라이브러리**를 쓴다 | submodule / subtree |
| 디자인 파일(.psd)을 **버전 관리하고 싶다** | LFS |
| 브랜치 두 개를 **동시에 열어 두고 싶다** | worktree |
| 모노레포에서 **내 담당 폴더만** 받고 싶다 | sparse-checkout |
| CI에서 **최신 커밋만** 있으면 된다 | shallow clone |

오늘은 이 도구들을 하나씩 다룹니다.

---

## ③ 개념 설명

### 저장소가 커지는 진짜 원인

**작업 디렉터리 크기와 `.git` 크기는 다릅니다.**

```
프로젝트 폴더 200MB
  ├── 작업 파일       50MB   ← 지금 보이는 것
  └── .git          150MB   ← 지금까지의 모든 버전
```

**핵심 성질** — 커밋에서 파일을 지워도 `.git` 은 줄지 않습니다. 과거 커밋에서 여전히 **도달 가능**하기 때문입니다 ([23강](lesson-23.md)).

```bash
git rm big-file.zip && git commit    # .git 크기 변화 없음
```

**정말 줄이려면 이력 재작성이 필요합니다** ([29강](lesson-29.md)).

### submodule — 저장소 안의 저장소

**다른 Git 저장소를 특정 커밋에 고정해서 포함**합니다.

```
main-app/
├── .gitmodules          어느 저장소를 어디에 둘지
├── app.py
└── vendor/lib/          ← 별개의 Git 저장소
```

**상위 저장소에는 파일이 아니라 "커밋 해시 하나"만 기록됩니다.**

```
160000 commit ac73321f66fbc2ed5ffc230245ffdfff41e10a56	lib
   │
   └── gitlink 모드 (21강의 파일 모드 표 참고)
```

| 장점 | 단점 |
|---|---|
| 상위 저장소가 가벼움 | **명령이 하나 더 필요** (`--recurse-submodules`) |
| 버전을 정확히 고정 | 팀원이 자주 빠뜨림 |
| 라이브러리 이력이 분리됨 | 서브모듈이 **detached HEAD** 상태로 옴 |

### subtree — 내용을 통째로 합치기

**다른 저장소의 파일을 내 저장소 안에 그대로 복사**합니다.

| | submodule | subtree |
|---|---|---|
| 저장 방식 | **커밋 해시 참조** | **파일을 통째로** |
| clone | `--recurse-submodules` 필요 | **그냥 clone** |
| 저장소 크기 | 가벼움 | 커짐 |
| 사용자 부담 | 있음 | **없음** |
| 원본에 기여 | 쉬움 | 어려움 (`subtree push`) |

> **판단 기준**
> **내가 그 라이브러리도 함께 개발한다** → submodule
> **가져다 쓰기만 한다 / 팀원이 Git에 익숙하지 않다** → subtree
>
> 그리고 대부분의 경우 **패키지 매니저(pip, npm)가 더 나은 선택**입니다. 둘 다 마지막 수단입니다.

### Git LFS — 큰 파일을 밖에 두기

**저장소에는 포인터만 넣고, 실제 파일은 별도 서버에 둡니다.**

```
저장소 안 (blob):
version https://git-lfs.github.com/spec/v1
oid sha256:be0f2b89a0df18d81f162e88489907552a602c64d22c8dd7b234194dec6d52cb
size 2000
```

**130바이트짜리 텍스트**입니다. 실제 파일은 LFS 서버에서 받아옵니다.

```
git clone  →  포인터를 받고  →  LFS 서버에서 실제 파일을 받음
```

| 대상 | 예 |
|---|---|
| 이미지·디자인 | `.psd`, `.ai`, `.sketch` |
| 미디어 | `.mp4`, `.wav` |
| 게임 에셋 | `.fbx`, `.unity` |
| 데이터 | 대용량 `.csv`, `.parquet` |

> ⚠️ **GitHub의 LFS 무료 할당량은 1GB 저장 / 월 1GB 전송**입니다. 초과하면 유료입니다.
> **소스 코드는 LFS에 넣지 마세요.** 텍스트는 델타 압축이 잘 되므로 오히려 손해입니다.

### worktree — 한 저장소, 여러 작업 폴더

```
project/            ← main 브랜치
project-hotfix/     ← hotfix 브랜치 (같은 .git 을 공유)
```

**`.git` 을 공유하므로 디스크를 거의 안 씁니다.** 브랜치를 오갈 때 [08강](lesson-08.md)에서 본 "파일이 통째로 바뀌는" 일이 없습니다.

**쓰는 상황**

- 작업 중인데 급한 hotfix가 들어옴 (stash 없이)
- 두 브랜치를 **나란히 놓고 비교**
- 한쪽에서 긴 빌드를 돌리며 다른 쪽에서 작업

### sparse-checkout — 일부 폴더만

모노레포에서 **내가 쓸 폴더만** 작업 디렉터리에 꺼냅니다.

```
전체 저장소 (10GB, 폴더 50개)
        ↓  sparse-checkout set backend
작업 디렉터리에는 backend/ 만 (500MB)
```

**이력은 전부 받습니다.** 꺼내는 파일만 줄이는 것입니다.

### shallow clone / partial clone — 이력을 줄이기

| 방식 | 명령 | 받는 것 |
|---|---|---|
| **shallow** | `--depth 1` | 최신 커밋 1개 |
| **treeless** | `--filter=tree:0` | 커밋만, 트리·파일은 필요할 때 |
| **blobless** | `--filter=blob:none` | 커밋·트리, 파일 내용은 필요할 때 |

```bash
git clone --depth 1 <주소>              # CI 에 최적
git clone --filter=blob:none <주소>     # 개발용으로 무난
```

> **`--depth 1` 은 CI의 기본**입니다 ([27강](lesson-27.md) `actions/checkout`).
> 다만 `git log`, `git blame`, `git bisect` 가 제대로 안 됩니다. 이력이 필요하면 `--filter=blob:none` 쪽이 낫습니다.

---

## ④ 단계별 실습

### Step 0. 실험실 준비

라이브러리 역할을 할 저장소와 앱 저장소를 만듭니다.

```bash
cd ~/Desktop
mkdir mylib && cd mylib
git init
git config user.name "Hong Gildong" && git config user.email "hong@example.com"
printf 'def helper():\n    return "v1"\n' > lib.py
git add . && git commit -qm "feat: 라이브러리 v1"

cd ~/Desktop
mkdir bigapp && cd bigapp
git init
git config user.name "Hong Gildong" && git config user.email "hong@example.com"
printf 'print("main app")\n' > app.py
git add . && git commit -qm "feat: 앱 초기"
```

> 로컬 폴더를 원격처럼 쓰려면 Git 2.38 이상에서 옵션이 필요합니다.
> ```bash
> git config --global protocol.file.allow always
> ```
> **실습용 설정입니다.** 보안 문제로 기본 차단되어 있으니, 실습이 끝나면 `git config --global --unset protocol.file.allow` 로 되돌리는 것을 권합니다.

### Step 1. submodule 추가

```bash
cd ~/Desktop/bigapp
git submodule add ../mylib vendor/lib
```

실행 결과:

```
Cloning into '.../bigapp/vendor/lib'...
done.
```

```bash
cat .gitmodules
```

실행 결과:

```
[submodule "vendor/lib"]
	path = vendor/lib
	url = ../mylib
```

```bash
git status --short
```

실행 결과:

```
A  .gitmodules
A  vendor/lib
```

**인덱스를 확인해 봅시다.**

```bash
git ls-files -s
```

실행 결과:

```
100644 3d62280140cf96ce0d80cf20933298d303d8822f 0	.gitmodules
100644 c441a09ecef43f57b7fc1aebd6c37c0995f25bbc 0	app.py
160000 ac73321f66fbc2ed5ffc230245ffdfff41e10a56 0	vendor/lib
```

> 🔑 **`160000`** — [21강](lesson-21.md)의 파일 모드 표에 나왔던 **gitlink**입니다.
> `vendor/lib` 은 blob도 tree도 아니고 **커밋 해시 하나**로 기록됩니다.

```bash
git commit -qm "chore: lib 서브모듈 추가"
git cat-file -p HEAD:vendor
```

실행 결과:

```
160000 commit ac73321f66fbc2ed5ffc230245ffdfff41e10a56	lib
```

**타입이 `commit`** 입니다. 상위 저장소에는 라이브러리 파일이 하나도 없습니다.

### Step 2. submodule 갱신 — 여기가 어렵습니다

라이브러리를 업데이트합니다.

```bash
cd ~/Desktop/mylib
printf 'def helper():\n    return "v2"\n' > lib.py
git commit -qam "feat: 라이브러리 v2"
```

**앱 저장소는 아직 v1을 가리킵니다.**

```bash
cd ~/Desktop/bigapp
git submodule status
```

실행 결과:

```
 ac73321f66fbc2ed5ffc230245ffdfff41e10a56 vendor/lib (heads/main)
```

**서브모듈을 최신으로 당겨옵니다.**

```bash
cd vendor/lib
git pull origin main
git log --oneline -1
cd ../..
```

실행 결과:

```
d4692a3 feat: 라이브러리 v2
```

**상위 저장소에서 보면**

```bash
git status --short
git diff --submodule=log
```

실행 결과:

```
 M vendor/lib
Submodule vendor/lib ac73321..d4692a3:
  > feat: 라이브러리 v2
```

> **상위 저장소는 "어느 커밋을 가리킬지"만 기록**합니다. 그래서 서브모듈을 갱신하면 **상위에서도 커밋해야** 합니다.

```bash
git add vendor/lib
git commit -qm "chore: lib 서브모듈 v2 로 갱신"
```

**팀원이 clone할 때**

```bash
git clone --recurse-submodules <주소>          # ⭐ 한 번에
```

이미 clone했다면:

```bash
git submodule update --init --recursive
```

**서브모듈까지 함께 pull하려면**

```bash
git pull --recurse-submodules
git submodule update --remote --merge     # 서브모듈을 원격 최신으로
```

**매번 치기 번거로우면 설정으로 자동화합니다.**

```bash
git config --global submodule.recurse true
git config --global diff.submodule log       # diff 를 읽기 쉽게
git config --global status.submoduleSummary true
```

**서브모듈 제거**

```bash
git submodule deinit -f vendor/lib
git rm -f vendor/lib
rm -rf .git/modules/vendor/lib
git commit -m "chore: lib 서브모듈 제거"
```

> **세 단계 모두 필요합니다.** `git rm` 만 하면 `.git/modules/` 에 잔재가 남습니다.

### Step 3. subtree — 파일을 통째로 가져오기

```bash
cd ~/Desktop
git clone bigapp subtree-app
cd subtree-app
git remote add mylib ../mylib
git fetch mylib
```

```bash
git subtree add --prefix=external/lib mylib main --squash
```

실행 결과:

```
git fetch mylib main
From ../mylib
 * branch            main       -> FETCH_HEAD
Added dir 'external/lib'
```

```bash
ls external/lib
git log --oneline -3
```

실행 결과:

```
lib.py
264edee Merge commit '6570714...' as 'external/lib'
6570714 Squashed 'external/lib/' content from commit d4692a3
a614de8 feat: 여러 폴더 추가
```

> **`--squash` 를 권합니다.** 없으면 라이브러리의 모든 커밋이 내 이력에 섞여 들어옵니다.

**파일이 실제로 들어와 있습니다.**

```bash
cat external/lib/lib.py
git ls-files -s external/lib
```

`160000` 이 아니라 **일반 `100644` blob** 입니다. **clone하는 사람은 아무것도 몰라도 됩니다.**

**나중에 라이브러리 갱신**

```bash
git subtree pull --prefix=external/lib mylib main --squash
```

**원본에 기여하기**

```bash
git subtree push --prefix=external/lib mylib feature/from-app
```

### Step 4. Git LFS

```bash
git lfs version
```

실행 결과:

```
git-lfs/3.5.1 (GitHub; windows amd64; go 1.21.7; git e237bb3a)
```

> 없다면 <https://git-lfs.com> 에서 설치하거나, Git for Windows 설치 시 함께 설치됩니다.

```bash
cd ~/Desktop
mkdir lfs-lab && cd lfs-lab
git init
git config user.name "Hong Gildong" && git config user.email "hong@example.com"
git lfs install
```

실행 결과:

```
Updated Git hooks.
Git LFS initialized.
```

> **`git lfs install` 은 훅을 설치합니다** ([26강](lesson-26.md)). `pre-push` 훅이 LFS 파일을 업로드합니다.

**추적할 패턴 지정**

```bash
git lfs track "*.psd"
cat .gitattributes
```

실행 결과:

```
*.psd filter=lfs diff=lfs merge=lfs -text
```

> **LFS는 `.gitattributes`([18강](lesson-18.md))로 동작합니다.** `filter=lfs` 가 핵심입니다.
> **이 파일을 반드시 먼저 커밋**하세요. 안 하면 큰 파일이 그냥 들어갑니다.

```bash
git add .gitattributes
git commit -qm "chore: LFS 추적 설정"
```

**큰 파일을 넣어 봅니다.**

```bash
head -c 2000 /dev/urandom > design.psd
git add design.psd
git commit -qm "feat: 디자인 파일 추가"
```

**저장소에 실제로 무엇이 들어갔는지 확인합니다.**

```bash
git cat-file -p HEAD:design.psd
```

실행 결과:

```
version https://git-lfs.github.com/spec/v1
oid sha256:be0f2b89a0df18d81f162e88489907552a602c64d22c8dd7b234194dec6d52cb
size 2000
```

> 🔑 **파일이 아니라 포인터입니다.** 130바이트짜리 텍스트가 blob으로 저장됐습니다.
> 작업 디렉터리에는 진짜 파일이 있습니다. Git이 **꺼낼 때 자동으로 교체**해 줍니다.

```bash
git lfs ls-files
git lfs track
```

실행 결과:

```
be0f2b89a0 * design.psd
Listing tracked patterns
    *.psd (.gitattributes)
```

**자주 쓰는 명령**

```bash
git lfs ls-files              # LFS 로 관리되는 파일
git lfs status                # 상태
git lfs pull                  # 실제 파일 받기
git lfs fetch --all           # 모든 브랜치의 LFS 파일
git lfs migrate info          # 어떤 파일을 옮기면 좋을지 분석
```

**이미 커밋된 파일을 LFS로 옮기려면** — 이력 재작성이 필요합니다 ([29강](lesson-29.md)).

```bash
git lfs migrate import --include="*.psd" --everything
```

> 🚨 **모든 커밋 해시가 바뀝니다.** 팀 전체와 합의하고 진행하세요.

### Step 5. worktree — 브랜치 여러 개 동시에

```bash
cd ~/Desktop/bigapp
git switch -c feature/x
printf 'print("feature")\n' >> app.py
git commit -qam "feat: 기능 추가"
git switch main
```

**작업 중인데 급한 hotfix가 들어왔다고 합시다.**

```bash
git worktree add ../bigapp-hotfix -b hotfix/urgent
```

실행 결과:

```
Preparing worktree (new branch 'hotfix/urgent')
HEAD is now at 8d1798f chore: lib 서브모듈 v2 로 갱신
```

```bash
git worktree list
```

실행 결과:

```
C:/Users/LEE/Desktop/bigapp         8d1798f [main]
C:/Users/LEE/Desktop/bigapp-hotfix  8d1798f [hotfix/urgent]
```

**두 폴더가 동시에 존재합니다.** `stash` 도 브랜치 전환도 필요 없습니다.

```bash
cat ../bigapp-hotfix/.git
```

실행 결과:

```
gitdir: C:/Users/LEE/Desktop/bigapp/.git/worktrees/bigapp-hotfix
```

> 🔑 **`.git` 이 폴더가 아니라 파일입니다.** 원본 저장소를 가리키는 한 줄이 전부입니다.
> 객체 저장소를 공유하므로 **디스크를 거의 안 씁니다.**

```bash
cd ../bigapp-hotfix
# ... 급한 수정 ...
cd ../bigapp
```

**정리**

```bash
git worktree remove ../bigapp-hotfix
git worktree list
git worktree prune                    # 수동 삭제한 worktree 정리
```

> ⚠️ **같은 브랜치를 두 worktree에서 동시에 체크아웃할 수 없습니다.**
> ```
> fatal: 'main' is already checked out at '...'
> ```
> 이건 사고 방지 장치입니다.

**활용 예**

```bash
git worktree add ../review-pr-42 origin/feature/login     # PR 리뷰용
git worktree add --detach ../compare v1.0.0               # 버전 비교용
```

### Step 6. sparse-checkout — 일부 폴더만

폴더를 여러 개 만들어 둡니다.

```bash
cd ~/Desktop/bigapp
mkdir -p frontend backend docs
echo "f" > frontend/a.js && echo "b" > backend/b.py && echo "d" > docs/d.md
git add . && git commit -qm "feat: 여러 폴더 추가"
```

```bash
cd ~/Desktop
git clone --no-checkout bigapp sparse-app
cd sparse-app
git sparse-checkout init --cone
git sparse-checkout set backend
git checkout main
ls
```

실행 결과:

```
app.py
backend
```

**`frontend/`, `docs/`, `vendor/` 가 없습니다.** 루트의 파일은 남습니다(cone 모드의 특성).

```bash
git sparse-checkout list
```

실행 결과:

```
backend
```

**폴더 추가**

```bash
git sparse-checkout add docs
ls
```

실행 결과:

```
app.py
backend
docs
```

**해제**

```bash
git sparse-checkout disable
ls
```

실행 결과:

```
app.py  backend  docs  frontend  vendor
```

> **`--cone` 모드를 쓰세요.** 폴더 단위로만 지정할 수 있는 대신 **훨씬 빠릅니다.**
> 파일 패턴까지 쓰려면 `--no-cone` 이지만 성능이 나빠집니다.
>
> **이력은 전부 받습니다.** 작업 디렉터리에 꺼내는 파일만 줄어드는 것입니다.

### Step 7. shallow clone과 partial clone

```bash
cd ~/Desktop
git clone --depth 1 "file://$HOME/Desktop/bigapp" shallow-app
cd shallow-app
git log --oneline | wc -l
git rev-parse --is-shallow-repository
```

실행 결과:

```
1
true
```

**커밋이 하나뿐입니다.**

```bash
cat .git/shallow
```

실행 결과:

```
a614de8b1f269160c9684a2acd42bb4cb695cd07
```

**이 커밋에서 이력이 잘렸다**는 표시입니다.

**필요하면 더 받아옵니다.**

```bash
git fetch --deepen=2
git log --oneline | wc -l
```

실행 결과:

```
3
```

**전체 받기**

```bash
git fetch --unshallow
git log --oneline | wc -l
git rev-parse --is-shallow-repository
```

실행 결과:

```
4
false
```

**partial clone — 더 나은 선택**

```bash
git clone --filter=blob:none <주소>
```

- 커밋과 트리는 전부 받습니다 → `git log`, `git bisect` 가 **정상 동작**
- 파일 내용(blob)만 **필요할 때 받아옵니다**

| 방식 | `log` | `blame` | `bisect` | 용도 |
|---|---|---|---|---|
| `--depth 1` | ❌ 1개만 | ❌ | ❌ | **CI** |
| `--filter=blob:none` | ✅ | ✅ (느림) | ✅ | **개발** |
| 전체 clone | ✅ | ✅ | ✅ | 기본 |

### Step 8. 저장소 진단

```bash
cd ~/Desktop/bigapp
git count-objects -vH
```

실행 결과:

```
count: 21
size: 1.92 KiB
in-pack: 0
packs: 0
size-pack: 0 bytes
prune-packable: 0
garbage: 0
size-garbage: 0 bytes
```

**가장 큰 객체 찾기** — 실무에서 아주 유용한 한 줄입니다.

```bash
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' \
  | sort -k3 -n -r \
  | head -10
```

실행 결과:

```
blob 3d62280140cf96ce0d80cf20933298d303d8822f 61 .gitmodules
blob 68c22587b8739152de9588bd636b144c303c4702 35 app.py
blob c441a09ecef43f57b7fc1aebd6c37c0995f25bbc 18 app.py
...
```

> **큰 저장소에서 이걸 돌리면 범인이 바로 나옵니다.** 대개 실수로 커밋된 zip, mp4, 빌드 산출물입니다.
> 찾았다면 [29강](lesson-29.md)에서 이력에서 제거하는 방법을 배웁니다.

**대용량 저장소 성능 개선**

```bash
git gc --aggressive          # 재압축 (오래 걸림)
git maintenance start        # 백그라운드 자동 최적화 (Git 2.30+)
git config core.fsmonitor true    # 파일 변경 감시 (status 가 빨라짐)
git config feature.manyFiles true # 파일이 매우 많은 저장소
```

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| submodule 확인 | VS Code Source Control에 **별도 저장소로 표시** |
| worktree | VS Code에서 **폴더를 그냥 열면** 됨 |
| LFS | 자동 처리 (파일은 평범하게 보임) |
| sparse-checkout | GUI 지원 거의 없음 |
| 저장소 크기 진단 | **git-sizer** 도구 권장 |

> **git-sizer** (<https://github.com/github/git-sizer>) 를 권합니다. 저장소의 문제 지점을 항목별로 점수화해 보여 줍니다.

---

## ⑤ 자주 하는 실수

### 서브모듈 폴더가 비어 있음

```bash
git clone <주소>
ls vendor/lib          # 비어 있음
```

**원인** — 일반 clone은 서브모듈 내용을 받지 않습니다.
**해결** —

```bash
git clone --recurse-submodules <주소>       # 처음부터
git submodule update --init --recursive     # 이미 clone 했다면
```

**예방**

```bash
git config --global submodule.recurse true
```

`README.md` 에도 반드시 적어 두세요. **서브모듈을 쓰는 저장소에서 가장 흔한 문의**입니다.

### 서브모듈이 detached HEAD 상태

```bash
cd vendor/lib
git status
```

```
HEAD detached at ac73321
```

**원인** — 서브모듈은 **브랜치가 아니라 특정 커밋**을 가리킵니다 ([22강](lesson-22.md)). 정상 동작입니다.
**해결** — 서브모듈에서 작업하려면 브랜치로 이동하세요.

```bash
cd vendor/lib
git switch main
# ... 작업 후 커밋 · push ...
cd ../..
git add vendor/lib          # 상위에서도 갱신 기록
git commit -m "chore: 서브모듈 갱신"
```

**브랜치를 추적하게 설정할 수도 있습니다.**

```bash
git submodule set-branch --branch main vendor/lib
git submodule update --remote
```

### 서브모듈 갱신을 상위에 커밋하지 않음

**증상** — 내 컴퓨터에서는 최신인데 팀원은 옛날 버전을 받습니다.
**원인** — 상위 저장소가 **여전히 옛 커밋 해시**를 기록하고 있습니다.
**해결** —

```bash
git status --short          # " M vendor/lib" 가 보이면 커밋 필요
git add vendor/lib
git commit -m "chore: 서브모듈 갱신"
```

**보이게 만들기**

```bash
git config --global status.submoduleSummary true
git config --global diff.submodule log
```

### LFS 설정 전에 큰 파일을 커밋

```bash
git add design.psd          # .gitattributes 없이
git commit
git lfs track "*.psd"       # 뒤늦게
```

**증상** — 저장소에 원본 파일이 그대로 들어갔고, `.git` 이 커진 채로 남습니다.
**원인** — LFS는 **커밋 시점의 `.gitattributes`** 를 봅니다.
**해결** — 이력 재작성이 필요합니다.

```bash
git lfs migrate import --include="*.psd" --everything
git push --force-with-lease --all
```

🚨 **모든 해시가 바뀝니다.** 팀 전체 합의 후 진행하세요 ([29강](lesson-29.md)).

**예방** — **`.gitattributes` 를 가장 먼저 커밋**하세요. [05강](lesson-05.md)의 `.gitignore` 와 같은 원칙입니다.

### LFS 파일이 포인터 텍스트로 보임

```bash
cat design.psd
```

```
version https://git-lfs.github.com/spec/v1
oid sha256:...
```

**원인** — LFS가 설치되지 않았거나 실제 파일을 받지 못했습니다.
**해결** —

```bash
git lfs install
git lfs pull
```

> **팀원 중 한 명이 LFS를 설치하지 않으면 그 사람만 파일이 깨져 보입니다.**
> `CONTRIBUTING.md` 에 설치 안내를 넣으세요 ([13강](lesson-13.md)).

### worktree에서 같은 브랜치 체크아웃 시도

```
fatal: 'main' is already checked out at '/home/user/project'
```

**원인** — 한 브랜치는 **한 worktree에서만** 체크아웃할 수 있습니다.
**해결** — 새 브랜치를 만들거나 detached로 여세요.

```bash
git worktree add ../review -b review-branch
git worktree add --detach ../compare v1.0.0
```

### worktree 폴더를 그냥 삭제

```bash
rm -rf ../bigapp-hotfix          # ❌
git worktree list                 # 여전히 목록에 있음 (prunable)
```

**해결** —

```bash
git worktree prune                # 잔재 정리
git worktree remove <경로>         # 처음부터 이렇게
```

### shallow clone에서 push가 거부됨

```
! [remote rejected] main -> main (shallow update not allowed)
```

**원인** — 얕은 저장소는 이력이 잘려 있어 서버가 거부할 수 있습니다.
**해결** —

```bash
git fetch --unshallow
git push
```

> **`--depth 1` 은 CI처럼 "받아서 쓰고 버리는" 용도**입니다. 개발용으로는 `--filter=blob:none` 을 쓰세요.

### 저장소를 줄이려고 파일을 지웠는데 그대로

```bash
git rm big-file.zip && git commit
git gc
du -sh .git          # 변화 없음
```

**원인** — 과거 커밋에서 **도달 가능**하므로 `gc` 가 지우지 않습니다 ([21강](lesson-21.md)·[23강](lesson-23.md)).
**해결** — 이력에서 그 파일을 제거해야 합니다 ([29강](lesson-29.md)).

```bash
git filter-repo --path big-file.zip --invert-paths
```

**먼저 진단하세요.**

```bash
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k3 -n -r | head
```

---

## ⑥ 확인 문제

**1.** 팀에서 공용 UI 컴포넌트 라이브러리를 여러 프로젝트가 함께 씁니다. **submodule과 subtree 중 무엇을 고를까요?** 판단 기준을 들어 설명하세요.

<details>
<summary>답 보기</summary>

**먼저 물어야 할 질문 — 패키지 매니저를 쓸 수 없나요?**

npm·pip 같은 **패키지 매니저가 최선**입니다. 버전 관리, 의존성 해결, 배포가 전부 표준화되어 있습니다. 사내 레지스트리(Verdaccio, GitHub Packages)를 세우는 방법도 있습니다.

**그게 안 될 때의 판단**

| 상황 | 선택 |
|---|---|
| **라이브러리도 함께 개발**한다 (양방향) | **submodule** |
| 가져다 **쓰기만** 한다 | **subtree** |
| 팀원이 Git에 익숙하지 않다 | **subtree** |
| 여러 프로젝트가 **정확히 같은 버전**을 써야 한다 | submodule |
| CI 설정을 단순하게 유지하고 싶다 | subtree |

**submodule을 고른 경우**

```bash
git submodule add <라이브러리 URL> packages/ui
git config --global submodule.recurse true
```

`README.md` 에 반드시 명시:

```markdown
## 설치
git clone --recurse-submodules <주소>
```

**장점** — 라이브러리 이력이 분리되고, 버전을 커밋 단위로 정확히 고정합니다.
**단점** — 팀원이 `--recurse-submodules` 를 빠뜨리는 사고가 반드시 일어납니다.

**subtree를 고른 경우**

```bash
git subtree add --prefix=packages/ui <URL> main --squash
git subtree pull --prefix=packages/ui <URL> main --squash    # 갱신
```

**장점** — 사용자는 아무것도 몰라도 됩니다. 그냥 clone하면 끝입니다.
**단점** — 저장소가 커지고, 원본에 기여할 때 `subtree push` 가 번거롭습니다.

**실무 권장**
> **팀 규모가 크고 Git 숙련도가 고르지 않다면 subtree**, 라이브러리를 활발히 함께 개발한다면 **submodule** 입니다.
> 그리고 가능하면 **둘 다 피하고 패키지 매니저**를 쓰세요.
</details>

**2.** `.git` 폴더가 5GB입니다. 원인을 찾고 줄이는 **순서**를 설명하세요.

<details>
<summary>답 보기</summary>

**① 진단 — 무엇이 큰지 찾기**

```bash
git count-objects -vH
```

```bash
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k3 -n -r | head -20
```

**더 편한 방법** — `git-sizer` 를 쓰면 항목별 점수로 보여 줍니다.

```bash
git-sizer --verbose
```

**② 원인 분류**

| 원인 | 대응 |
|---|---|
| 실수로 커밋된 zip·mp4·빌드 산출물 | 이력에서 제거 ([29강](lesson-29.md)) |
| 계속 관리해야 하는 디자인 파일 | **LFS 마이그레이션** |
| 단순히 커밋이 많음 | `gc`, partial clone |
| 도달 불가 객체가 쌓임 | `gc --prune` |

**③ 대응**

**먼저 안전한 것부터**

```bash
git gc --aggressive --prune=now
```

> 🚨 이건 [23강](lesson-23.md)의 복구 수단(reflog)을 없앱니다. 최근 사고가 없는지 확인하고 실행하세요.

**필요 없는 파일을 이력에서 제거** ([29강](lesson-29.md))

```bash
git filter-repo --path assets/old-video.mp4 --invert-paths
# 또는 크기 기준
git filter-repo --strip-blobs-bigger-than 10M
```

**계속 필요한 큰 파일은 LFS로**

```bash
git lfs migrate info --everything          # 먼저 분석
git lfs migrate import --include="*.psd" --everything
```

**④ 팀 공지 — 필수**

이력 재작성은 **모든 커밋 해시를 바꿉니다.** 반드시 사전 합의하고, 완료 후 전원 재clone해야 합니다.

```bash
git push --force-with-lease --all
git push --force-with-lease --tags
```

**⑤ 재발 방지**

```gitignore
*.zip
*.mp4
dist/
```

```yaml
# .pre-commit-config.yaml  (26강)
- id: check-added-large-files
  args: ['--maxkb=1000']
```

**당장 clone만 빠르게 하고 싶다면**

```bash
git clone --filter=blob:none <주소>
```

이력 재작성 없이도 체감 속도가 크게 개선됩니다.
</details>

**3.** `git worktree` 와 그냥 **폴더를 두 번 clone하는 것**의 차이는 무엇인가요?

<details>
<summary>답 보기</summary>

| | `git worktree` | 두 번 clone |
|---|---|---|
| 디스크 | **`.git` 공유** (작업 파일만 추가) | `.git` 이 두 벌 |
| 커밋·브랜치 | **즉시 공유** | `push`/`fetch` 필요 |
| stash·reflog | **공유** | 별개 |
| 설정 | 공유 (`.git/config`) | 각각 설정 |
| 같은 브랜치 동시 체크아웃 | **불가** (보호 장치) | 가능 |
| 원격 왕복 | 불필요 | 필요 |

**worktree가 유리한 경우 (대부분)**

```bash
# 작업 중인데 급한 hotfix
git worktree add ../project-hotfix -b hotfix/urgent
# stash 도, 브랜치 전환도 필요 없음
```

- **커밋이 즉시 공유됩니다.** A worktree에서 커밋하면 B에서 바로 보입니다
- **디스크를 아낍니다.** 5GB 저장소라면 clone은 5GB가 더 들지만 worktree는 작업 파일만
- **설정·훅이 공유됩니다** ([26강](lesson-26.md))

**두 번 clone이 나은 경우**

- **완전히 격리**해야 할 때 (파괴적인 실험, 이력 재작성 테스트)
- 다른 사람 계정·자격 증명으로 접근해야 할 때
- 같은 브랜치를 두 곳에서 체크아웃해야 할 때

**실전 활용**

```bash
git worktree add ../review-42 origin/feature/login    # PR 리뷰
git worktree add --detach ../v1 v1.0.0                # 버전 비교
git worktree add ../build main                        # 긴 빌드 전용
git worktree list
git worktree remove ../review-42
```

**주의 두 가지**

- 폴더를 `rm -rf` 로 지우지 말고 `git worktree remove` 를 쓰세요 (안 그러면 `git worktree prune` 필요)
- 각 worktree의 `.git` 은 **폴더가 아니라 파일**입니다. 원본을 옮기면 링크가 깨집니다
</details>

---

## 오늘의 정리

**submodule vs subtree**

| | submodule | subtree |
|---|---|---|
| 저장 | **커밋 해시** (`160000` gitlink) | **파일 통째로** |
| clone | `--recurse-submodules` 필요 | 그냥 clone |
| 크기 | 가벼움 | 커짐 |
| 용도 | 함께 개발 | 가져다 쓰기 |

```bash
git submodule add <URL> <경로>
git clone --recurse-submodules <URL>
git submodule update --init --recursive
git config --global submodule.recurse true

git subtree add  --prefix=<경로> <원격> <브랜치> --squash
git subtree pull --prefix=<경로> <원격> <브랜치> --squash
```

**Git LFS**

```bash
git lfs install
git lfs track "*.psd"        # ⭐ .gitattributes 를 먼저 커밋
git add .gitattributes && git commit
git lfs ls-files
git lfs migrate import --include="*.psd" --everything    # 🚨 이력 재작성
```

**worktree**

```bash
git worktree add ../폴더 -b <브랜치>
git worktree add --detach ../폴더 <커밋>
git worktree list
git worktree remove ../폴더
git worktree prune
```

**부분만 받기**

| 명령 | 받는 것 | 용도 |
|---|---|---|
| `git sparse-checkout set <폴더>` | 그 폴더만 꺼냄 (이력은 전부) | 모노레포 |
| `git clone --depth 1` | 최신 커밋만 | **CI** |
| `git clone --filter=blob:none` | 커밋·트리 전부, 파일은 필요할 때 | **개발** |
| `git fetch --unshallow` | 전체 이력 복원 | |

**진단**

```bash
git count-objects -vH

git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k3 -n -r | head
```

**오늘 반드시 기억할 한 가지**
> **커밋에서 파일을 지워도 `.git` 은 줄지 않습니다.** 객체는 과거 커밋에서 여전히 도달 가능하기 때문입니다.
> 그래서 **큰 파일은 처음부터 넣지 않는 것**이 유일하게 값싼 해결책입니다. `.gitignore` 와 LFS 설정을 **가장 먼저** 하세요.

**과제**
1. 라이브러리 저장소를 만들어 submodule로 추가하고, `git ls-files -s` 에서 **`160000`** 모드를 확인하세요.
2. 라이브러리를 갱신한 뒤 상위 저장소에서 `git status` 가 어떻게 나오는지 확인하고, 상위에도 커밋하세요.
3. 같은 라이브러리를 subtree로도 추가해 **파일이 실제로 들어오는 것**과 비교하세요.
4. LFS를 설정하고 `git cat-file -p HEAD:<파일>` 로 **포인터 텍스트**를 확인하세요.
5. `git worktree add` 로 폴더를 하나 더 만들고, `.git` 이 **파일**인 것을 확인하세요.
6. `sparse-checkout` 으로 폴더 하나만 꺼내 보고, `disable` 로 되돌리세요.
7. `--depth 1` 로 clone한 뒤 `--unshallow` 로 전체 이력을 복원해 보세요.
8. 가장 큰 blob을 찾는 한 줄 명령을 실제 프로젝트에서 실행해 보세요.

---

[← 이전 27강](lesson-27.md) · [목차](README.md) · [다음 → 29강 히스토리 재작성과 사고 대응](lesson-29.md)
