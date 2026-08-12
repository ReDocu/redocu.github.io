# 19강 · 태그와 릴리스

> **Git 학습 매뉴얼** · 🟡 중급 · **19강 / 30**
> [← 이전 18강](lesson-18.md) · [목차](README.md) · [다음 → 20강 중급 종합 실습](lesson-20.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 시맨틱 버저닝 규칙에 따라 다음 버전 번호를 정할 수 있다.
- `annotated tag` 를 만들고 원격에 올릴 수 있다.
- 두 버전 사이의 변경 목록을 뽑아 변경 로그를 작성할 수 있다.
- GitHub Releases로 배포본을 공개할 수 있다.
- `git describe` 로 현재 코드가 어느 버전 기준인지 확인할 수 있다.

---

## ② 왜 필요한가

지금까지 커밋 해시로 시점을 가리켰습니다.

```bash
git switch 8f4d2c9
```

그런데 이런 대화는 불가능합니다.

```
"고객이 쓰는 버전에서 버그가 났대요. 어느 커밋이죠?"
"음... 지난주에 배포한 게 8f4d2c9 였던가 4c8f2b1 이었던가..."
```

**태그**는 특정 커밋에 **사람이 읽을 수 있는 이름표**를 붙입니다.

```bash
git switch v1.2.0        # 훨씬 명확합니다
```

태그가 있으면 이런 것들이 가능해집니다.

| 하고 싶은 일 | 명령 |
|---|---|
| "1.2.0 배포 시점 코드를 보고 싶다" | `git switch v1.2.0` |
| "1.1.0에서 1.2.0 사이에 뭐가 바뀌었나" | `git log v1.1.0..v1.2.0` |
| "지금 코드는 어느 버전 기준인가" | `git describe` |
| "1.2.0 배포본을 내려받게 하고 싶다" | GitHub Releases |

그리고 [15강](lesson-15.md)의 Conventional Commits를 지켜 왔다면, **다음 버전 번호와 변경 로그를 거의 자동으로** 만들 수 있습니다.

---

## ③ 개념 설명

### 시맨틱 버저닝 (SemVer)

가장 널리 쓰이는 버전 번호 규칙입니다.

```
   1  .  4  .  2
   │     │     │
   │     │     └── PATCH  버그 수정 (호환됨)
   │     └──────── MINOR  기능 추가 (호환됨)
   └────────────── MAJOR  호환성이 깨지는 변경
```

**올리는 규칙**

| 무엇을 했나 | 올릴 자리 | 예 |
|---|---|---|
| 버그 수정 (`fix`) | PATCH | `1.4.2` → `1.4.3` |
| 기능 추가 (`feat`) | MINOR (PATCH는 0으로) | `1.4.2` → `1.5.0` |
| 호환성 깨짐 (`BREAKING CHANGE`) | MAJOR (나머지 0으로) | `1.4.2` → `2.0.0` |

> **[15강](lesson-15.md)의 커밋 타입과 정확히 대응합니다.**
> 커밋 메시지만 규칙대로 써 왔다면, 다음 버전 번호는 **계산해서 나옵니다.**

**부가 표기**

```
1.0.0-alpha.1      정식 전 시험판 (pre-release)
1.0.0-beta.2
1.0.0-rc.1         release candidate
1.0.0+20260810     빌드 메타데이터
```

**0.x.y 는 특별합니다** — `1.0.0` 이전에는 **아무 때나 깨져도 된다**는 뜻입니다. 개발 초기에는 `0.1.0`, `0.2.0` 으로 올리다가, 안정되면 `1.0.0` 을 붙입니다.

### 태그 두 종류

| | **Annotated (`-a`)** | Lightweight |
|---|---|---|
| 만드는 법 | `git tag -a v1.0.0 -m "메시지"` | `git tag v1.0.0` |
| 저장 방식 | **독립된 객체** | 커밋을 가리키는 이름표만 |
| 담기는 정보 | 만든 사람 · 날짜 · 메시지 · 서명 | 없음 |
| `git describe` | 기본으로 인식 | `--tags` 필요 |
| 용도 | **릴리스** | 개인적인 임시 표시 |

> **릴리스에는 반드시 `-a` 를 쓰세요.** "누가 언제 왜 이 버전을 냈는가"가 기록에 남습니다.
> 이 커리큘럼에서는 특별한 언급이 없으면 항상 annotated 태그를 씁니다.

### 태그는 자동으로 push되지 않습니다

**가장 많이 겪는 함정입니다.**

```bash
git tag -a v1.0.0 -m "첫 릴리스"
git push                          # ← 태그는 안 올라갑니다!
```

태그는 **따로 올려야 합니다.**

```bash
git push origin v1.0.0            # 하나만
git push origin --tags            # 전부
git push --follow-tags            # 커밋 + annotated 태그 함께  ← 권장
```

```bash
git config --global push.followTags true
```

이렇게 설정해 두면 `git push` 만으로 annotated 태그가 함께 올라갑니다.

### `git describe`

**"지금 코드가 어느 태그로부터 얼마나 떨어져 있는가"** 를 알려 줍니다.

```bash
git describe
```

```
v1.1.0-3-g8f4d2c9
  │     │  │
  │     │  └── 현재 커밋 해시 (g = git)
  │     └───── 그 태그 이후 3개의 커밋
  └─────────── 가장 가까운 태그
```

정확히 태그 위에 있다면 태그 이름만 나옵니다.

```
v1.1.0
```

> 빌드 스크립트에서 **버전 문자열을 자동 생성**할 때 널리 쓰입니다.
> ```bash
> VERSION=$(git describe --tags --always --dirty)
> ```
> `--dirty` 는 커밋하지 않은 변경이 있으면 `-dirty` 를 붙여 줍니다.

### 태그 vs 브랜치

| | 태그 | 브랜치 |
|---|---|---|
| 움직이나 | **고정** | 커밋할 때마다 이동 |
| 용도 | "이 시점" 표시 | "이 작업 갈래" |
| 삭제·변경 | **하면 안 됨** | 자유롭게 |

> 🔑 **태그는 한 번 공개하면 절대 옮기지 마세요.**
> 남들이 이미 그 태그로 코드를 받아 갔습니다. 내용이 바뀌면 **"같은 v1.0.0인데 내용이 다른"** 상황이 됩니다.
> 잘못 붙였으면 **새 버전을 내세요.** (`v1.0.1`)

---

## ④ 단계별 실습

### Step 1. 첫 릴리스 태그 붙이기

```bash
cd ~/Desktop/todo-app
git switch main
git pull
git log --oneline -3
```

버전 파일을 만들고 커밋합니다.

```bash
echo "VERSION = '1.0.0'" > version.py
git add version.py
git commit -m "chore: 버전 1.0.0"
```

**annotated 태그를 붙입니다.**

```bash
git tag -a v1.0.0 -m "첫 정식 릴리스

- 할 일 추가 / 목록 / 완료 / 삭제
- 검색과 통계
- JSON 파일 저장"
```

아무 출력이 없으면 성공입니다.

```bash
git tag
```

실행 결과:

```
v1.0.0
```

메시지까지 보려면:

```bash
git tag -n
```

실행 결과:

```
v1.0.0          첫 정식 릴리스
```

**태그의 전체 내용 보기**

```bash
git show v1.0.0
```

실행 결과:

```
tag v1.0.0
Tagger: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 20:14:33 2026 +0900

첫 정식 릴리스

- 할 일 추가 / 목록 / 완료 / 삭제
- 검색과 통계
- JSON 파일 저장

commit 7f2b9d1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b32 (HEAD -> main, tag: v1.0.0)
Author: Hong Gildong <hong@example.com>
Date:   Mon Aug 10 20:12:05 2026 +0900

    chore: 버전 1.0.0

diff --git a/version.py b/version.py
new file mode 100644
...
```

**태그 정보 + 가리키는 커밋 + 그 커밋의 변경 내용**이 모두 나옵니다. lightweight 태그였다면 커밋 정보만 나옵니다.

### Step 2. 원격에 올리기

```bash
git push
git tag                          # 로컬에는 있음
```

브라우저에서 저장소를 열고 **Tags** 를 확인해 보세요. **아직 없습니다.**

```bash
git push origin v1.0.0
```

실행 결과:

```
Enumerating objects: 1, done.
Counting objects: 100% (1/1), done.
Writing objects: 100% (1/1), 189 bytes | 189.00 KiB/s, done.
Total 1 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/hong-gildong/todo-app.git
 * [new tag]         v1.0.0 -> v1.0.0
```

이제 GitHub의 **Tags** 에 나타납니다.

**앞으로 자동으로 따라 올라가게 설정합니다.**

```bash
git config --global push.followTags true
```

### Step 3. 기능을 추가하고 다음 버전 내기

```bash
git switch -c feature/priority-sort
```

`todo.py` 에 정렬 기능을 추가합니다.

```python
PRIORITY_ORDER = {"높음": 0, "보통": 1, "낮음": 2}


def show_by_priority():
    todos = load()
    if not todos:
        print("할 일이 없습니다.")
        return
    ordered = sorted(todos, key=lambda t: PRIORITY_ORDER.get(t.get("priority", "보통"), 1))
    for i, t in enumerate(ordered, 1):
        mark = "✅" if t["done"] else "⬜"
        print(f"{mark} [{t.get('priority', '보통')}] {i}. {t['text']}")
```

```bash
git add todo.py
git commit -m "feat: 우선순위 순으로 정렬해 보는 기능 추가"
```

버그도 하나 고칩니다.

```bash
sed -i 's/def search(keyword, include_done=True):/def search(keyword, include_done=True):\n    if not keyword:\n        print("검색어를 입력해 주세요.")\n        return/' todo.py
git add todo.py
git commit -m "fix: 빈 검색어 입력 시 전체 목록이 나오던 문제 수정"
```

```bash
git switch main
git merge --no-ff feature/priority-sort
git branch -d feature/priority-sort
```

**버전 번호를 정합니다.**

```bash
git log --oneline v1.0.0..HEAD
```

실행 결과:

```
2c8f5a1 Merge branch 'feature/priority-sort'
9e4b2d8 fix: 빈 검색어 입력 시 전체 목록이 나오던 문제 수정
6d3b9e5 feat: 우선순위 순으로 정렬해 보는 기능 추가
```

**`feat` 가 있으니 MINOR를 올립니다.** `1.0.0` → **`1.1.0`**

```bash
echo "VERSION = '1.1.0'" > version.py
git add version.py
git commit -m "chore: 버전 1.1.0"

git tag -a v1.1.0 -m "1.1.0 릴리스

새 기능
- 우선순위 순 정렬 보기 (show_by_priority)

버그 수정
- 빈 검색어 입력 시 전체 목록이 출력되던 문제"

git push
```

`push.followTags` 를 설정했으므로 태그가 함께 올라갑니다.

실행 결과 (마지막 부분):

```
To https://github.com/hong-gildong/todo-app.git
   7f2b9d1..4a1e8c3  main -> main
 * [new tag]         v1.1.0 -> v1.1.0
```

### Step 4. 변경 로그 만들기

**두 태그 사이의 커밋 뽑기**

```bash
git log --oneline v1.0.0..v1.1.0
```

**머지 커밋 제외하고 보기**

```bash
git log --oneline --no-merges v1.0.0..v1.1.0
```

실행 결과:

```
4a1e8c3 chore: 버전 1.1.0
9e4b2d8 fix: 빈 검색어 입력 시 전체 목록이 나오던 문제 수정
6d3b9e5 feat: 우선순위 순으로 정렬해 보는 기능 추가
```

**타입별로 분류하기** — Conventional Commits의 보상입니다.

```bash
echo "### 새 기능"
git log --no-merges --pretty=format:"- %s" v1.0.0..v1.1.0 --grep="^feat"
echo
echo "### 버그 수정"
git log --no-merges --pretty=format:"- %s" v1.0.0..v1.1.0 --grep="^fix"
```

실행 결과:

```
### 새 기능
- feat: 우선순위 순으로 정렬해 보는 기능 추가
### 버그 수정
- fix: 빈 검색어 입력 시 전체 목록이 나오던 문제 수정
```

**`CHANGELOG.md` 로 정리합니다.**

```markdown
# 변경 이력

이 프로젝트는 [시맨틱 버저닝](https://semver.org/lang/ko/)을 따릅니다.

## [1.1.0] - 2026-08-10

### 추가
- 우선순위 순으로 정렬해서 보는 `show_by_priority()` 기능

### 수정
- 빈 검색어를 입력하면 전체 목록이 출력되던 문제

## [1.0.0] - 2026-08-10

### 추가
- 할 일 추가 / 목록 / 완료 처리 / 삭제
- 검색과 통계
- JSON 파일 저장
```

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG 추가"
git push
```

> 형식은 **[Keep a Changelog](https://keepachangelog.com/ko/)** 가 사실상 표준입니다.
> 분류는 `추가(Added)` · `변경(Changed)` · `deprecated` · `제거(Removed)` · `수정(Fixed)` · `보안(Security)` 을 씁니다.

### Step 5. GitHub Releases

태그는 Git의 기능이고, **Release는 GitHub의 기능**입니다. 태그에 **설명과 첨부 파일**을 붙인 것입니다.

**① 웹에서 만들기**

1. 저장소 → 오른쪽 **Releases** → **Draft a new release**
2. **Choose a tag** → `v1.1.0` 선택 (이미 push한 태그)
3. **Release title**: `v1.1.0 - 우선순위 정렬`
4. 본문 작성 — 여기서 **`Generate release notes`** 버튼을 누르면 GitHub가 **PR 목록과 기여자를 자동으로** 채워 줍니다.

```markdown
## 새 기능
- 우선순위 순 정렬 보기 (#12)

## 버그 수정
- 빈 검색어 처리 (#13)

**Full Changelog**: https://github.com/hong-gildong/todo-app/compare/v1.0.0...v1.1.0
```

5. 필요하면 **빌드 결과물(zip, exe 등)을 첨부**합니다.
6. **Publish release**

> GitHub는 소스 코드 `.zip` 과 `.tar.gz` 를 **자동으로 첨부**합니다. 별도로 올릴 필요 없습니다.

**② CLI로 만들기**

```bash
gh release create v1.1.0 --title "v1.1.0 - 우선순위 정렬" --generate-notes
```

`--generate-notes` 가 변경 내역을 자동으로 채웁니다.

```bash
gh release list
gh release view v1.1.0
gh release upload v1.1.0 dist/todo-app.zip     # 파일 첨부
```

### Step 6. 태그 활용

**특정 버전으로 이동해서 확인**

```bash
git switch --detach v1.0.0
```

실행 결과:

```
Note: switching to 'v1.0.0'.

You are in 'detached HEAD' state. ...
HEAD is now at 7f2b9d1 chore: 버전 1.0.0
```

```bash
cat version.py
```

실행 결과:

```
VERSION = '1.0.0'
```

**1.0.0 시점의 코드**를 그대로 보고 있습니다. 확인이 끝나면 돌아옵니다.

```bash
git switch main
```

> [08강](lesson-08.md)에서 본 `detached HEAD` 입니다. 태그는 브랜치가 아니므로 이 상태가 됩니다.
> **여기서 수정하려면 브랜치를 만들어야 합니다.**
> ```bash
> git switch -c hotfix/1.0.1 v1.0.0
> ```

**현재 위치 확인**

```bash
git switch main
echo "실험" > exp.txt && git add exp.txt && git commit -m "chore: 실험"
git describe
```

실행 결과:

```
v1.1.0-2-g5c2f9a1
```

**v1.1.0 에서 2개 커밋 뒤**라는 뜻입니다.

```bash
git describe --tags --always --dirty
```

정리합니다.

```bash
git reset --hard HEAD~1
```

**태그 검색과 목록**

```bash
git tag -l "v1.*"              # 패턴으로
git tag --sort=-v:refname      # 버전 순 정렬 (최신 먼저)
git tag --contains 9e4b2d8     # 이 커밋을 포함하는 태그 찾기
```

`--contains` 는 실무에서 아주 유용합니다. **"이 버그 수정이 어느 버전부터 들어갔나"** 를 바로 알 수 있습니다.

**과거 커밋에 태그 붙이기**

```bash
git tag -a v0.9.0 <해시> -m "베타 릴리스"
```

### Step 7. 태그 수정과 삭제

> ⚠️ **이미 공개한 태그는 건드리지 않는 것이 원칙입니다.** 아래는 **push 전** 또는 **정말 불가피한 경우**에만 씁니다.

**로컬 태그 삭제**

```bash
git tag -d v1.1.0
```

실행 결과:

```
Deleted tag 'v1.1.0' (was 3f8a2c1)
```

**원격 태그 삭제**

```bash
git push origin --delete v1.1.0
```

실행 결과:

```
To https://github.com/hong-gildong/todo-app.git
 - [deleted]         v1.1.0
```

**태그 위치 옮기기 (강제)**

```bash
git tag -f -a v1.1.0 -m "메시지" <새 해시>
git push --force origin v1.1.0
```

> 🚨 **이미 배포된 태그에는 절대 하지 마세요.**
> 남들이 받아 간 `v1.1.0` 과 내용이 달라집니다. CI 캐시, 패키지 저장소, 사용자 로컬이 전부 어긋납니다.
> **잘못 붙였으면 새 버전(`v1.1.1`)을 내는 것이 정답입니다.**

다시 만들어 둡니다.

```bash
git tag -a v1.1.0 -m "1.1.0 릴리스"
git push origin v1.1.0
```

### Step 8. 자동화 맛보기

[15강](lesson-15.md)의 Conventional Commits를 지켜 왔다면, 버전 결정부터 릴리스까지 자동화할 수 있습니다.

| 도구 | 하는 일 |
|---|---|
| **release-please** (Google) | 커밋을 분석해 **버전 올리는 PR을 자동 생성** |
| **semantic-release** | 커밋 분석 → 버전 결정 → 태그 → 릴리스 → 배포까지 |
| **git-cliff** | 커밋으로 CHANGELOG 자동 생성 (Rust 기반, 언어 무관) |

동작 원리는 단순합니다.

```
마지막 태그 이후의 커밋을 분석
  ├─ BREAKING CHANGE 있음  →  MAJOR
  ├─ feat 있음             →  MINOR
  └─ fix 만 있음           →  PATCH
        ↓
버전 결정 → CHANGELOG 생성 → 태그 → GitHub Release
```

> 설정은 [27강 GitHub Actions](lesson-27.md)에서 다룹니다.
> 지금 기억할 것은 **"커밋 메시지를 규칙대로 쓰면 이 모든 게 공짜"** 라는 점입니다.

### 같은 일을 GUI로 하면

| 하고 싶은 일 | 방법 |
|---|---|
| 태그 목록 | GitHub 저장소 → **Tags** |
| 릴리스 만들기 | **Releases** → Draft a new release |
| 변경 내역 자동 생성 | 릴리스 작성 화면의 **Generate release notes** |
| 두 버전 비교 | `github.com/<user>/<repo>/compare/v1.0.0...v1.1.0` |
| 태그 생성 | VS Code `Ctrl+Shift+P` → `Git: Create Tag` |

> **compare URL** 을 기억해 두세요. 두 버전 사이의 모든 커밋과 diff를 웹에서 한눈에 볼 수 있습니다.

---

## ⑤ 자주 하는 실수

### 태그를 만들었는데 GitHub에 없음

**원인** — `git push` 는 태그를 올리지 않습니다.
**해결** —

```bash
git push origin v1.0.0            # 하나
git push origin --tags            # 전부
git push --follow-tags            # 커밋 + annotated 태그
```

```bash
git config --global push.followTags true    # 항상 자동으로
```

> `--tags` 는 lightweight 태그까지 전부 올립니다. 개인용 임시 태그가 섞여 있다면 `--follow-tags` 가 안전합니다.

### lightweight 태그를 릴리스에 사용

```bash
git tag v1.0.0        # -a 없음
git show v1.0.0
```

**증상** — 누가 언제 만들었는지 정보가 없습니다. `git describe` 도 기본으로는 인식하지 못합니다.
**해결** — 릴리스에는 항상 `-a` 를 쓰세요.

```bash
git tag -a v1.0.0 -m "첫 정식 릴리스"
```

**이미 lightweight로 만들었다면** (push 전이라면) 다시 만들면 됩니다.

```bash
git tag -d v1.0.0
git tag -a v1.0.0 -m "첫 정식 릴리스"
```

### 이미 배포된 태그를 옮김

**증상** — 팀원이 받은 `v1.0.0` 과 내 `v1.0.0` 의 내용이 다릅니다. CI가 캐시된 옛날 코드를 씁니다.
**원인** — `git tag -f` + `git push --force` 를 썼습니다.
**해결** — **되돌리지 말고 새 버전을 내세요.**

```bash
git tag -a v1.0.1 -m "1.0.0 의 잘못된 빌드 대체"
git push origin v1.0.1
```

**팀원이 이미 잘못된 태그를 받았다면** 각자 갱신해야 합니다.

```bash
git fetch --prune --prune-tags
```

### 버전 번호를 잘못 올림

```
기능을 추가했는데 1.4.2 → 1.4.3 (PATCH)
```

**원인** — SemVer 규칙을 헷갈렸습니다.
**해결** — 기준을 다시 확인하세요.

| 커밋 타입 | 올릴 자리 |
|---|---|
| `fix` 만 있음 | PATCH |
| `feat` 가 하나라도 있음 | **MINOR** |
| `BREAKING CHANGE` 가 있음 | **MAJOR** |

**"사용자가 코드를 고쳐야 하는가?"** 가 MAJOR 판단의 기준입니다. 함수 이름을 바꾸거나 인자를 없앴다면 MAJOR입니다.

### `v` 접두사를 섞어 씀

```
v1.0.0
1.1.0        ← 일관성 없음
v1.2.0
```

**해결** — 팀에서 하나로 정하세요. **Git 태그에는 `v` 를 붙이는 것이 관례**입니다 (`v1.0.0`).
다만 **패키지 버전 필드에는 `v` 를 붙이지 않습니다** (`package.json` 의 `"version": "1.0.0"`).

### 태그가 있는데 `git describe` 가 실패

```
fatal: No annotated tags can describe '8f4d2c9'.
```

**원인** — lightweight 태그만 있습니다.
**해결** —

```bash
git describe --tags        # lightweight 도 포함
```

또는 annotated 태그를 쓰세요.

### 태그가 있는 커밋이 사라짐

**증상** — rebase나 reset으로 이력을 바꿨더니 태그가 **아무 브랜치에도 속하지 않은 커밋**을 가리킵니다.
**원인** — [12강](lesson-12.md)의 rebase는 커밋을 다시 씁니다. 태그는 옛날 커밋을 그대로 가리킵니다.
**해결** — 태그가 있는 범위는 **rebase하지 마세요.** 태그가 붙었다는 것은 **이미 배포됐다**는 뜻입니다.

> 이것도 황금률의 연장입니다. **배포된 이력은 다시 쓰지 않습니다.**

### 원격에서 삭제한 태그가 로컬에 남음

```bash
git fetch --prune
git tag                    # 여전히 있음
```

**원인** — `--prune` 은 브랜치만 정리합니다.
**해결** —

```bash
git fetch --prune --prune-tags
```

---

## ⑥ 확인 문제

**1.** 현재 버전이 `2.3.1` 입니다. 아래 변경 후 다음 버전은?

```
ⓐ 오타로 인한 계산 오류 수정
ⓑ 새로운 내보내기 형식(CSV) 추가
ⓒ 함수 export_data() 의 인자 순서를 변경 (기존 코드 수정 필요)
ⓓ 내부 리팩터링만 수행. 동작 변화 없음
```

<details>
<summary>답 보기</summary>

| | 다음 버전 | 이유 |
|---|---|---|
| ⓐ | **2.3.2** | 버그 수정 → PATCH |
| ⓑ | **2.4.0** | 기능 추가 → MINOR (PATCH는 0으로) |
| ⓒ | **3.0.0** | 호환성 깨짐 → MAJOR (나머지 0으로) |
| ⓓ | **2.3.2** 또는 버전 안 올림 | 사용자에게 영향 없음 |

**ⓑ 주의** — `2.3.2` 가 아니라 `2.4.0` 입니다. **MINOR를 올리면 PATCH는 0으로** 되돌립니다.

**ⓒ 판단 기준** — **"이 버전을 올리면 사용자가 코드를 고쳐야 하는가?"** 인자 순서가 바뀌면 기존 호출이 전부 깨집니다. MAJOR입니다.

**ⓓ** — 리팩터링만 했다면 릴리스할 이유가 없을 수도 있습니다. 다른 수정과 함께 배포된다면 그때의 규칙을 따릅니다.

**여러 변경이 섞여 있다면 가장 큰 것을 따릅니다.**

```
fix 3개 + feat 1개        →  MINOR
fix 5개 + BREAKING 1개    →  MAJOR
```

**커밋으로 확인하는 방법**

```bash
git log --oneline v2.3.1..HEAD --grep="^feat"      # 있으면 최소 MINOR
git log v2.3.1..HEAD --grep="BREAKING CHANGE"      # 있으면 MAJOR
```
</details>

**2.** `v1.2.0` 을 태그하고 push했는데 GitHub의 Tags에 없습니다. 원인과 해결책, 그리고 **재발 방지책**은?

<details>
<summary>답 보기</summary>

**원인** — `git push` 는 **커밋만** 올립니다. 태그는 별도입니다.

**해결**

```bash
git push origin v1.2.0            # 이 태그 하나만
git push origin --tags            # 로컬의 모든 태그
git push --follow-tags            # 커밋 + annotated 태그
```

**확인**

```bash
git ls-remote --tags origin       # 원격에 있는 태그 목록
```

실행 결과:

```
7f2b9d1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b32	refs/tags/v1.0.0
3f8a2c1b5d7e9f1a3c5b7d9e1f3a5c7b9d1e3f52	refs/tags/v1.1.0
```

**재발 방지**

```bash
git config --global push.followTags true
```

이제 `git push` 만으로 annotated 태그가 함께 올라갑니다.

> **`--tags` 대신 `--follow-tags` 를 권하는 이유** — `--tags` 는 로컬의 **모든** 태그를 올립니다. 개인적으로 표시해 둔 임시 태그까지 공개됩니다.
> `--follow-tags` 는 **push하는 커밋에 도달 가능한 annotated 태그만** 올립니다.

**CI에서 태그를 트리거로 쓴다면** 특히 중요합니다. 태그가 안 올라가면 릴리스 워크플로가 아예 돌지 않습니다 ([27강](lesson-27.md)).
</details>

**3.** 팀원이 `v1.0.0` 태그를 잘못된 커밋에 붙여 push했습니다. **이미 다른 팀원 2명이 받아 갔습니다.** 어떻게 해야 할까요?

<details>
<summary>답 보기</summary>

**원칙 — 이미 공개된 태그는 옮기지 않고, 새 버전을 냅니다.**

**① 잘못된 정도를 먼저 판단합니다**

```bash
git show v1.0.0                          # 어느 커밋인지
git log --oneline v1.0.0..main           # 빠진 것이 무엇인지
```

**② 아직 배포·공개 전이고 팀 내부뿐이라면** (되도록 피할 것)

```bash
# 팀 전체에 먼저 공지한 뒤
git tag -f -a v1.0.0 -m "1.0.0 릴리스" <올바른 해시>
git push --force origin v1.0.0
```

팀원들은 각자 이렇게 갱신해야 합니다.

```bash
git fetch --prune --prune-tags
```

**③ 이미 외부에 공개됐거나 CI가 돌았다면 → 새 버전 (권장)**

```bash
git tag -a v1.0.1 -m "1.0.0 릴리스 정정

v1.0.0 태그가 잘못된 커밋에 붙어 일부 수정이 누락되었습니다.
v1.0.1 을 사용해 주세요."
git push origin v1.0.1
```

그리고 GitHub Releases에서 `v1.0.0` 릴리스에 **경고 문구를 추가**하거나, 사용하지 않도록 표시합니다.

**왜 강제 이동이 위험한가**

| 문제 | 설명 |
|---|---|
| 내용 불일치 | 같은 `v1.0.0` 인데 사람마다 다른 코드 |
| CI 캐시 | 빌드 시스템이 옛날 태그를 캐시하고 있을 수 있음 |
| 패키지 저장소 | npm·PyPI 등은 **같은 버전 재배포를 아예 금지** |
| 재현 불가 | "v1.0.0에서 버그가 났다"는 보고를 재현할 수 없음 |

**핵심 원칙**
> **태그는 불변(immutable)입니다.** 브랜치는 움직이라고 있는 것이고, 태그는 고정하라고 있는 것입니다.
> 실수했으면 **덮지 말고 다음 번호를 붙이세요.** 버전 번호는 무한합니다.
</details>

---

## 오늘의 정리

**시맨틱 버저닝**

```
MAJOR . MINOR . PATCH

BREAKING CHANGE  →  MAJOR   (나머지 0으로)
feat             →  MINOR   (PATCH 0으로)
fix              →  PATCH
```

**태그 명령**

| 명령 | 하는 일 |
|---|---|
| **`git tag -a v1.0.0 -m "메시지"`** | annotated 태그 생성 |
| `git tag -a v1.0.0 <해시> -m "..."` | 과거 커밋에 태그 |
| `git tag` / `git tag -n` | 목록 / 메시지까지 |
| `git tag -l "v1.*"` | 패턴 검색 |
| `git tag --sort=-v:refname` | 버전 순 정렬 |
| `git tag --contains <해시>` | **이 커밋을 포함하는 태그** |
| `git show v1.0.0` | 태그 + 커밋 상세 |
| **`git push origin v1.0.0`** | 태그 하나 올리기 |
| `git push --follow-tags` | 커밋 + annotated 태그 |
| `git tag -d v1.0.0` | 로컬 삭제 |
| `git push origin --delete v1.0.0` | 원격 삭제 |
| `git describe --tags --always --dirty` | 현재 위치를 버전으로 |
| `git fetch --prune --prune-tags` | 사라진 태그 정리 |

**설정**

```bash
git config --global push.followTags true
```

**변경 로그**

```bash
git log --oneline --no-merges v1.0.0..v1.1.0
git log --pretty=format:"- %s" v1.0.0..v1.1.0 --grep="^feat"
```

**태그 vs 브랜치**

```
태그    고정. 한 번 공개하면 옮기지 않는다
브랜치  이동. 커밋할 때마다 따라온다
```

**오늘 반드시 기억할 한 가지**
> **태그는 `git push` 로 안 올라갑니다.** `push.followTags true` 를 설정해 두세요.
> 그리고 **공개된 태그는 절대 옮기지 말고, 새 버전을 내세요.**

**과제**
1. `todo-app` 에 `v1.0.0` annotated 태그를 붙이고 원격에 올린 뒤, GitHub의 **Tags** 에 나타나는지 확인하세요.
2. `push.followTags true` 를 설정하고, 다음 태그는 `git push` 만으로 올라가는지 확인하세요.
3. 기능과 버그 수정을 하나씩 추가한 뒤 SemVer 규칙에 따라 다음 버전을 정하고 태그하세요.
4. `git log v1.0.0..v1.1.0` 으로 변경 목록을 뽑아 `CHANGELOG.md` 를 작성하세요.
5. GitHub Releases에서 **Generate release notes** 로 릴리스를 만들어 보세요.
6. `git switch --detach v1.0.0` 으로 과거 버전 코드를 확인하고 `git switch main` 으로 복귀하세요.
7. `git describe` 를 실행해 현재 위치가 어떻게 표시되는지 확인하세요.

---

[← 이전 18강](lesson-18.md) · [목차](README.md) · [다음 → 20강 중급 종합 실습](lesson-20.md)
