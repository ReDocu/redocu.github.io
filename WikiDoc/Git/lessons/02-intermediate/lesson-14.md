# 14강 · Pull Request 워크플로

> **Git 학습 매뉴얼** · 🟡 중급 · **14강 / 30**
> [← 이전 13강](lesson-13.md) · [목차](README.md) · [다음 → 15강 좋은 커밋 만들기](lesson-15.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- Pull Request를 만들고 리뷰를 주고받아 병합할 수 있다.
- **브랜치 모델과 fork 모델**의 차이를 알고 상황에 맞게 쓸 수 있다.
- PR 본문과 템플릿을 작성해 리뷰어가 읽기 쉽게 만들 수 있다.
- **Merge 버튼 3종**의 차이를 알고 팀 정책에 맞게 고를 수 있다.
- 리뷰 코멘트를 반영하는 올바른 방법을 안다.

---

## ② 왜 필요한가

[09강](lesson-09.md)에서 브랜치를 push했을 때 이런 안내가 나왔습니다.

```
remote: Create a pull request for 'feature/readme-badge' on GitHub by visiting:
remote:      https://github.com/hong-gildong/todo-app/pull/new/feature/readme-badge
```

그리고 [13강](lesson-13.md)에서 `main` 을 보호하자 **직접 push가 아예 막혔습니다.**

```
remote: error: Changes must be made through a pull request.
```

이제 **PR 없이는 코드를 합칠 수 없습니다.** PR은 단순한 병합 요청 버튼이 아니라 팀의 **품질 관문**입니다.

| PR이 없는 팀 | PR이 있는 팀 |
|---|---|
| 코드를 나만 본다 | 최소 한 명이 더 본다 |
| 버그가 운영에서 발견된다 | 리뷰·CI 단계에서 걸린다 |
| "왜 이렇게 짰지?" 를 물을 곳이 없다 | 논의가 PR에 기록된다 |
| 신입이 코드를 배울 곳이 없다 | PR이 교육 자료가 된다 |

**PR은 코드를 합치는 절차이자 팀의 기억 장치입니다.** 6개월 뒤 "이 코드 왜 이래?" 를 물으면, 답은 대개 그 PR의 대화에 있습니다.

---

## ③ 개념 설명

### Pull Request란

**"제 브랜치를 검토하고 합쳐 주세요"** 라는 요청입니다. Git의 기능이 아니라 **GitHub·GitLab 같은 서비스의 기능**입니다. (GitLab에서는 Merge Request라고 부릅니다)

```
내 브랜치                                    main
  ●──●──●   ──▶  [ PR 생성 ]  ──▶  [ 리뷰 ]  ──▶  [ 병합 ]  ──▶  ●
                      │              │
                  변경 내용        코멘트·승인
                  자동 diff        CI 검사
```

PR 하나에 이런 것들이 모입니다.

| 요소 | 내용 |
|---|---|
| **변경 내용** | 브랜치와 `main` 의 diff가 자동으로 표시 |
| **설명** | 무엇을 왜 바꿨는지 (내가 작성) |
| **커밋 목록** | 이 브랜치의 커밋들 |
| **리뷰** | 코멘트, 승인, 변경 요청 |
| **CI 결과** | 테스트 통과 여부 ([27강](lesson-27.md)) |
| **연결된 이슈** | `Closes #42` |

### 두 가지 모델 — 브랜치 vs fork

| | **브랜치 모델** | **fork 모델** |
|---|---|---|
| 방식 | 같은 저장소에 브랜치 생성 | 저장소를 **내 계정으로 복사**한 뒤 작업 |
| 권한 | 저장소 **쓰기 권한 필요** | 권한 불필요 (누구나) |
| PR 방향 | `feature/x` → `main` | `내계정/repo:main` → `원본/repo:main` |
| 쓰는 곳 | **회사·팀 내부 프로젝트** | **오픈소스 기여** |

**fork 모델의 구조**

```
   원본 저장소 (upstream)          내 fork (origin)
   github.com/team/project   ──▶  github.com/me/project
            ▲                              │
            │                              │ clone
            └──────── PR ──────────┐       ▼
                                   └── 내 컴퓨터
```

원격이 **두 개**가 됩니다.

| 별명 | 가리키는 곳 | 용도 |
|---|---|---|
| `origin` | 내 fork | push |
| `upstream` | 원본 저장소 | 최신 내용 받아오기 (`fetch`) |

> 이 커리큘럼의 실습은 **브랜치 모델**로 진행합니다. 팀 내부 프로젝트가 대부분 그렇기 때문입니다.
> fork 모델은 Step 6에서 따로 다룹니다.

### Merge 버튼 3종 — 반드시 구분해야 합니다

GitHub의 병합 버튼에는 **세 가지 선택지**가 있고, 결과가 완전히 다릅니다.

**① Create a merge commit** (= `git merge --no-ff`)

```
main:     A ── B ────────── M
                \          /
feature:         X ── Y ──┘

결과: A, B, X, Y, M 이 모두 남음
```

| 장점 | 단점 |
|---|---|
| 모든 커밋 보존 | 이력이 가지 모양 |
| 언제 합쳐졌는지 기록 | 잡다한 커밋(`wip`, `오타 수정`)까지 `main` 에 |

**② Squash and merge** (= 커밋들을 하나로 압축)

```
main:     A ── B ── S          (S = X + Y 를 합친 커밋 하나)
```

| 장점 | 단점 |
|---|---|
| `main` 이력이 **매우 깔끔** | 중간 커밋 이력이 사라짐 |
| PR 하나 = 커밋 하나 | 큰 PR이면 커밋 하나가 거대해짐 |
| 되돌리기 쉬움 (커밋 하나만) | 브랜치를 계속 쓰면 문제 발생 |

**③ Rebase and merge** (= `git rebase` 후 fast-forward)

```
main:     A ── B ── X' ── Y'   (해시는 바뀜)
```

| 장점 | 단점 |
|---|---|
| 일직선 + 커밋 보존 | 해시가 바뀜 |
| 머지 커밋 없음 | PR 단위가 그래프에서 안 보임 |

**어떤 것을 쓸까**

| 팀 상황 | 추천 |
|---|---|
| 커밋을 깔끔하게 못 나누는 팀 | **Squash and merge** |
| 커밋 하나하나가 의미 있는 팀 | Merge commit 또는 Rebase and merge |
| 기능 단위로 되돌리는 일이 잦음 | **Squash** 또는 Merge commit |
| 이력을 일직선으로 유지 | Squash 또는 Rebase |

> **가장 무난한 기본값은 Squash and merge** 입니다. `main` 의 커밋 하나가 PR 하나에 대응해서 이력이 아주 읽기 쉬워집니다.
> 팀에서 **하나로 정하고** Settings → General → Pull Requests 에서 **나머지는 아예 꺼 두는 것**을 권합니다.

### 이슈 연결 키워드

PR 본문에 이렇게 쓰면 병합될 때 이슈가 **자동으로 닫힙니다.**

```markdown
Closes #42
Fixes #57
Resolves #13
```

| 키워드 | 비고 |
|---|---|
| `Closes` / `Close` / `Closed` | 일반적인 작업 |
| `Fixes` / `Fix` / `Fixed` | 버그 |
| `Resolves` / `Resolve` / `Resolved` | 논의·요청 |

> **자동으로 닫히지 않게 하려면** `#42` 만 쓰거나 `Related to #42` 라고 씁니다. 링크는 걸리되 닫히진 않습니다.

### 리뷰의 세 가지 결과

| 종류 | 뜻 | 언제 |
|---|---|---|
| **Comment** | 의견만 | 질문, 제안, 칭찬 |
| **Approve** | 승인 | 병합해도 좋다 |
| **Request changes** | 변경 요청 | **고쳐야 병합 가능** |

`Request changes` 는 **병합을 막습니다.** 강한 신호이므로 정말 고쳐야 할 때만 쓰고, 취향 차이는 `Comment` 로 남기는 것이 좋습니다.

---

## ④ 단계별 실습

### Step 1. 이슈 만들기

실무는 대개 이슈에서 시작합니다.

1. GitHub 저장소 → **Issues** 탭 → **New issue**
2. 작성

```
제목: 완료된 할 일만 따로 보는 기능이 필요합니다

본문:
## 문제
할 일이 많아지면 완료된 항목과 진행 중인 항목이 섞여서 보기 어렵습니다.

## 제안
`show_done()` 함수를 추가해 완료된 항목만 출력하게 합니다.

## 완료 조건
- [ ] 완료된 항목만 출력
- [ ] 완료된 항목이 없으면 안내 메시지
- [ ] README에 사용법 추가
```

3. **Submit new issue** → 이슈 번호(예: `#1`)를 확인합니다.

### Step 2. 브랜치 만들고 작업하기

```bash
cd ~/Desktop/todo-app
git switch main
git pull
git switch -c feature/1-show-done
```

> 브랜치 이름에 **이슈 번호를 넣는 것**이 [13강](lesson-13.md)의 규칙이었습니다.

`todo.py` 에 추가합니다.

```python
def show_done():
    todos = load()
    done = [t for t in todos if t["done"]]
    if not done:
        print("완료된 할 일이 없습니다.")
        return
    print("=== 완료한 일 ===")
    for i, t in enumerate(done, 1):
        print(f"✅ {i}. {t['text']}")
```

```bash
git add todo.py
git commit -m "feat: 완료된 할 일만 출력하는 기능 추가"
```

```bash
echo "- \`show_done()\` : 완료된 할 일만 보기" >> README.md
git add README.md
git commit -m "docs: show_done 사용법 추가"
```

```bash
git push -u origin feature/1-show-done
```

### Step 3. PR 만들기

**① GitHub 화면에서**

브랜치를 push하면 저장소 상단에 노란 배너가 뜹니다.

```
feature/1-show-done had recent pushes 1 minute ago
                                          [ Compare & pull request ]
```

버튼을 누르거나, **Pull requests** 탭 → **New pull request** 로 들어갑니다.

**② base와 compare 확인** — 여기를 틀리는 사람이 많습니다.

```
base: main   ←   compare: feature/1-show-done
 (합쳐질 곳)        (합쳐질 것)
```

> ⚠️ **`base` 가 목적지**입니다. 방향을 반대로 하면 `main` 을 내 브랜치에 합치는 PR이 됩니다.

**③ 본문 작성** — 리뷰어가 읽을 문서입니다.

````markdown
## 무엇을

완료된 할 일만 따로 출력하는 `show_done()` 함수를 추가했습니다.

Closes #1

## 왜

할 일이 많아지면 완료/미완료가 섞여 있어 진행 상황을 파악하기 어렵다는
의견이 있었습니다.

## 어떻게

- `load()` 결과에서 `done == True` 인 항목만 필터링
- 완료 항목이 없으면 안내 메시지 출력
- 기존 `show()` 는 건드리지 않음 (동작 변경 없음)

## 확인 방법

```python
add("장보기")
add("청소")
done(1)
show_done()     # "✅ 1. 장보기" 만 출력
```

## 리뷰 포인트

- 함수 이름이 `show_done` 이 맞을까요? `show_completed` 도 고민했습니다.
````

**④ Create pull request**

> **`Create draft pull request`** 옵션도 있습니다. **아직 작업 중이지만 미리 보여 주고 싶을 때** 씁니다.
> Draft 상태에서는 병합 버튼이 비활성화되고, 준비되면 **Ready for review** 를 누릅니다.

### Step 4. 리뷰 주고받기

**리뷰어 입장 (Files changed 탭)**

1. **Files changed** 탭에서 diff를 봅니다.
2. 코멘트를 달 줄 옆의 **`+`** 를 누릅니다.
3. 여러 줄을 고르려면 드래그합니다.
4. 코멘트를 쓰고 **Start a review** (모아서 한 번에 보내기) 또는 **Add single comment**

**코드 제안 기능** — 아주 유용합니다. 코멘트에 이렇게 쓰면,

````
```suggestion
    print("=== 완료한 일 ===\n")
```
````

작성자가 **Commit suggestion** 버튼 한 번으로 바로 반영할 수 있습니다.

5. 오른쪽 위 **Review changes** → 셋 중 하나 선택

| | 사용 |
|---|---|
| Comment | 의견만 남김 |
| Approve | 승인 |
| Request changes | 수정 요청 (병합 차단) |

> 혼자 실습 중이라면 **본인 PR은 승인할 수 없습니다.** 코멘트만 달아 보고 넘어가세요.
> [13강](lesson-13.md)에서 `Require approvals` 를 켰다면 병합이 막히므로, 실습을 위해 잠시 꺼 두면 됩니다.

**작성자 입장 — 리뷰 반영**

리뷰를 받았다면 **추가 커밋**으로 반영합니다.

```bash
# 함수 이름을 바꾸기로 했다고 가정
git switch feature/1-show-done
```

`todo.py` 를 수정한 뒤:

```bash
git add todo.py
git commit -m "refactor: show_done 을 show_completed 로 이름 변경"
git push
```

**PR이 자동으로 갱신됩니다.** 새로고침하면 커밋과 diff가 반영돼 있습니다.

> 🔑 **리뷰 반영은 `--amend` + force push가 아니라 추가 커밋으로 하세요.**
>
> | 방식 | 문제 |
> |---|---|
> | `--amend` → `--force-with-lease` | 리뷰어가 **"뭘 고쳤는지"** 를 볼 수 없음. 코멘트가 outdated 처리됨 |
> | **추가 커밋 → push** | 리뷰어가 변경분만 확인 가능 ✅ |
>
> 지저분한 커밋이 걱정된다면 **Squash and merge** 로 병합하면 됩니다. `main` 에는 어차피 하나로 들어갑니다.

코멘트에 답을 달고 **Resolve conversation** 을 눌러 처리 완료 표시를 합니다.

### Step 5. 병합하기

1. PR 화면 아래 병합 버튼의 **드롭다운**을 눌러 방식을 고릅니다.
2. **Squash and merge** 를 선택합니다.
3. 커밋 메시지를 정리합니다. **여기서 다듬는 것이 중요합니다.**

```
feat: 완료된 할 일만 출력하는 기능 추가 (#2)

- show_completed() 함수 추가
- 완료 항목이 없을 때 안내 메시지
- README 사용법 추가

Closes #1
```

> GitHub는 기본 메시지에 브랜치의 커밋 제목을 전부 나열합니다. **`wip`, `오타 수정` 같은 줄은 지우세요.**
> `(#2)` 는 PR 번호로, GitHub가 자동으로 붙입니다. 나중에 `main` 이력에서 PR로 바로 갈 수 있어 유용합니다.

4. **Confirm squash and merge**
5. **Delete branch** 버튼으로 원격 브랜치를 정리합니다.

**로컬 정리**

```bash
git switch main
git pull
git branch -d feature/1-show-done
git fetch --prune
```

> ⚠️ **Squash로 병합했다면 `git branch -d` 가 거부될 수 있습니다.**
> ```
> error: The branch 'feature/1-show-done' is not fully merged.
> ```
> `main` 에 들어간 커밋(하나로 합쳐진 것)과 브랜치의 커밋들이 **다른 해시**라 Git이 "안 합쳐졌다"고 판단하기 때문입니다.
> 병합된 것이 확실하다면 `-D` 로 지우면 됩니다.

**이슈 확인** — Issues 탭에서 `#1` 이 **자동으로 닫혀 있는지** 보세요. `Closes #1` 의 효과입니다.

### Step 6. PR 템플릿 만들기

매번 형식을 기억할 필요 없게 템플릿을 둡니다.

`.github/pull_request_template.md` 를 만듭니다.

```markdown
## 무엇을

<!-- 이 PR이 무엇을 하는지 한두 문장으로 -->

Closes #

## 왜

<!-- 왜 필요한지. 어떤 문제를 해결하는지 -->

## 어떻게

<!-- 주요 구현 방식. 리뷰어가 알아야 할 결정 사항 -->

## 확인 방법

<!-- 리뷰어가 직접 검증할 수 있는 절차 -->

## 체크리스트

- [ ] 로컬에서 실행해 동작을 확인했습니다
- [ ] 관련 문서(README 등)를 갱신했습니다
- [ ] 커밋 메시지가 규칙에 맞습니다
- [ ] 비밀 정보(.env, 키)가 포함되지 않았습니다
```

```bash
git switch -c chore/pr-template
git add .github/pull_request_template.md
git commit -m "chore: PR 템플릿 추가"
git push -u origin chore/pr-template
```

PR을 만들어 보면 **본문이 템플릿으로 자동으로 채워져 있습니다.**

> 이슈 템플릿은 `.github/ISSUE_TEMPLATE/` 폴더에 둡니다. 같은 방식으로 동작합니다.

### Step 7. fork 모델 맛보기 (오픈소스 기여)

권한이 없는 저장소에 기여하는 방법입니다. 아무 오픈소스 저장소로 연습해 볼 수 있습니다.

**① fork** — 저장소 오른쪽 위 **Fork** 버튼 → 내 계정으로 복사됩니다.

**② clone하고 원격 두 개 설정**

```bash
git clone https://github.com/<내아이디>/<프로젝트>.git
cd <프로젝트>

# 원본 저장소를 upstream 으로 등록
git remote add upstream https://github.com/<원본계정>/<프로젝트>.git
git remote -v
```

실행 결과:

```
origin    https://github.com/hong-gildong/project.git (fetch)
origin    https://github.com/hong-gildong/project.git (push)
upstream  https://github.com/original/project.git (fetch)
upstream  https://github.com/original/project.git (push)
```

**③ 최신 상태로 맞추기** — fork는 자동으로 갱신되지 않습니다.

```bash
git fetch upstream
git switch main
git rebase upstream/main       # 또는 merge
git push
```

**④ 작업하고 내 fork에 push**

```bash
git switch -c fix/typo-in-readme
# ... 작업 ...
git commit -m "docs: README 오타 수정"
git push -u origin fix/typo-in-readme
```

**⑤ 원본 저장소로 PR** — GitHub가 자동으로 안내합니다.

```
base repository: original/project    base: main
head repository: hong-gildong/project    compare: fix/typo-in-readme
```

> **오픈소스 기여 전 확인할 것** — 저장소의 `CONTRIBUTING.md` 를 반드시 먼저 읽으세요.
> 커밋 메시지 규칙, 테스트 실행 방법, 서명(DCO) 요구 등 프로젝트마다 규칙이 다릅니다.

### 같은 일을 CLI로 하면 — `gh`

GitHub 공식 CLI를 쓰면 터미널에서 PR을 다룰 수 있습니다.

```bash
# 설치 확인 (없으면 https://cli.github.com)
gh --version
gh auth login
```

```bash
gh pr create --fill                       # 커밋 내용으로 PR 자동 생성
gh pr create --title "..." --body "..."   # 직접 지정
gh pr list                                # PR 목록
gh pr view 3                              # PR 내용 보기
gh pr view 3 --web                        # 브라우저로 열기
gh pr checkout 3                          # 남의 PR을 로컬에서 받아 확인
gh pr review 3 --approve                  # 승인
gh pr merge 3 --squash --delete-branch     # 병합 + 브랜치 삭제
```

> **`gh pr checkout <번호>`** 가 특히 유용합니다. 리뷰할 때 **남의 PR을 내 컴퓨터에서 직접 실행**해 볼 수 있습니다.
> 화면만 보고 하는 리뷰와 실제로 돌려 보는 리뷰는 품질이 다릅니다.

---

## ⑤ 자주 하는 실수

### base와 compare를 반대로 설정

**증상** — PR을 열었더니 내 변경은 없고 `main` 의 커밋 수십 개가 나옵니다.
**원인** — `base` 와 `compare` 가 뒤바뀌었습니다.
**해결** — PR 화면 상단에서 **Switch branches** (⇄ 아이콘)를 누르거나, PR을 닫고 다시 만드세요.

```
base: main   ←   compare: feature/x       ✅
base: feature/x   ←   compare: main       ❌
```

### PR이 너무 큽니다

**증상** — 변경 파일 50개, +2000 −800. 리뷰어가 이틀째 안 봅니다.
**원인** — 브랜치를 오래 끌었습니다 ([13강](lesson-13.md)).
**해결** — 지금 것은 어쩔 수 없으니 **리뷰 순서를 안내**하세요.

```markdown
## 리뷰 순서 제안
1. `models.py` — 핵심 로직입니다
2. `views.py` — 위 모델을 쓰는 부분
3. 나머지는 자동 생성 파일이라 훑어보셔도 됩니다
```

**예방** — PR 하나는 **400줄 이하**를 목표로 하세요. 리뷰 품질이 급격히 떨어지는 경계선입니다.

### 리뷰 반영을 `--amend` + force push로

**증상** — 리뷰어의 코멘트가 `Outdated` 로 회색 처리되고, 무엇이 바뀌었는지 볼 수 없습니다.
**원인** — 커밋을 다시 써서 diff 기준점이 사라졌습니다.
**해결** — **추가 커밋으로 반영**하세요. 지저분해도 괜찮습니다. **Squash and merge** 하면 `main` 에는 하나로 들어갑니다.

> 예외 — 아직 아무도 리뷰하지 않은 PR이라면 `--amend` 해도 문제없습니다.

### Squash 병합 후 그 브랜치에서 계속 작업

**증상** — 다음 PR에 **이미 병합된 커밋이 또 나타납니다.**
**원인** — Squash는 새 커밋 하나를 만들 뿐, 브랜치의 원래 커밋들과는 **다른 해시**입니다. Git은 그 커밋들이 아직 병합되지 않았다고 봅니다.
**해결** — 병합된 브랜치는 **반드시 삭제하고 새로 만드세요.**

```bash
git switch main
git pull
git branch -D feature/old        # -d 로는 안 지워질 수 있음
git switch -c feature/next       # 최신 main 에서 새로 시작
```

### fork를 최신화하지 않음

**증상** — PR에 내 커밋 3개 대신 **50개**가 나옵니다. 충돌도 잔뜩입니다.
**원인** — fork는 원본이 갱신돼도 **자동으로 따라가지 않습니다.**
**해결** —

```bash
git fetch upstream
git switch main
git rebase upstream/main
git push
git switch feature/x
git rebase main
git push --force-with-lease
```

GitHub 웹의 **Sync fork** 버튼으로도 `main` 을 맞출 수 있습니다.

### 이슈가 안 닫힘

**원인** — 키워드나 위치가 잘못됐습니다.

| 안 되는 것 | 되는 것 |
|---|---|
| `Close to #42` | `Closes #42` |
| `#42 해결` | `Fixes #42` |
| 코드 블록 안에 쓴 경우 | 본문에 일반 텍스트로 |
| **다른 저장소의 이슈** | `Closes owner/repo#42` |

> 키워드가 **PR 본문**이나 **커밋 메시지**에 있어야 하고, PR이 **기본 브랜치로 병합**될 때만 동작합니다.

### `Request changes` 를 남발

**증상** — 사소한 취향 차이로 병합이 막히고 분위기가 나빠집니다.
**해결** — 강도를 구분해 쓰세요.

| 상황 | 리뷰 종류 |
|---|---|
| 버그, 보안 문제, 명백한 오류 | **Request changes** |
| 개선 제안, 취향, 궁금한 점 | **Comment** |
| 문제없음 | **Approve** |

코멘트에 **강도를 표시**하는 관례도 널리 쓰입니다.

```
[must] 여기 None 체크가 없어서 크래시가 납니다.
[should] 이 부분은 함수로 빼는 게 좋겠습니다.
[nit] 오타입니다. 고치지 않아도 무방합니다.
[question] 이 조건이 필요한 이유가 궁금합니다.
```

### 자기 PR을 승인하려 함

**증상** — `Approve` 옵션이 비활성화되어 있습니다.
**원인** — GitHub는 **본인 PR 승인을 허용하지 않습니다.**
**해결** — 혼자 실습 중이라면 브랜치 보호의 `Require approvals` 를 꺼 두세요. 팀이라면 당연히 다른 사람이 봐야 합니다.

---

## ⑥ 확인 문제

**1.** GitHub의 병합 버튼 3종 중, 아래 팀에는 무엇을 추천하시겠습니까?

```
팀원들이 커밋을 "작업중", "수정", "다시 수정" 식으로 남깁니다.
main 이력을 깔끔하게 유지하고 싶고, 기능 단위 되돌리기가 자주 필요합니다.
```

<details>
<summary>답 보기</summary>

**Squash and merge** 입니다.

**이유**

1. **지저분한 커밋이 `main` 에 남지 않습니다.** 브랜치의 `작업중`, `수정` 커밋들이 하나로 압축됩니다.
2. **PR 하나 = 커밋 하나** 라 `git log --oneline` 이 곧 기능 목록이 됩니다.
3. **되돌리기가 간단합니다.**

```bash
git revert <그 커밋 하나>      # 기능 전체가 되돌아감
```

머지 커밋 방식이라면 `git revert -m 1 <머지커밋>` 을 써야 하고, Rebase 방식이라면 여러 커밋을 각각 되돌려야 합니다.

**설정 방법** — 실수를 막으려면 다른 옵션을 아예 끄세요.

```
Settings → General → Pull Requests
  ☑ Allow squash merging
  ☐ Allow merge commits
  ☐ Allow rebase merging
```

**주의할 점** — Squash 후에는 **그 브랜치를 재사용하면 안 됩니다.** 반드시 삭제하고 최신 `main` 에서 새로 만드세요.

**Squash가 안 맞는 경우** — 커밋 하나하나가 의미 있게 잘 나뉜 팀이라면 오히려 정보가 손실됩니다. 그런 팀은 Rebase and merge가 낫습니다.
</details>

**2.** 리뷰어가 3개의 코멘트를 남겼습니다. 어떻게 반영하는 것이 좋을까요? **`--amend` 를 쓰면 안 되는 이유**와 함께 설명하세요.

<details>
<summary>답 보기</summary>

**추가 커밋으로 반영합니다.**

```bash
git switch feature/x
# ... 코멘트대로 수정 ...
git add .
git commit -m "refactor: 리뷰 반영 - 함수 이름 변경 및 None 체크 추가"
git push          # force 아님
```

**`--amend` + force push가 나쁜 이유**

| 문제 | 설명 |
|---|---|
| 리뷰 코멘트가 `Outdated` 처리 | 어느 줄에 달렸던 건지 추적이 어려워짐 |
| **변경분을 볼 수 없음** | 리뷰어가 PR 전체를 처음부터 다시 봐야 함 |
| 논의 맥락 소실 | "이거 반영하셨나요?" 를 확인할 방법이 없음 |

리뷰어 입장에서는 **"내 코멘트가 어떻게 반영됐는지"** 만 보면 되는데, force push는 그 기준점을 없애 버립니다.

**"그럼 커밋이 지저분해지지 않나요?"**

괜찮습니다. **Squash and merge** 로 병합하면 `main` 에는 커밋 하나로 들어갑니다. 브랜치의 커밋 이력은 병합 후 브랜치와 함께 사라집니다.

**추가로 할 일**

- 각 코멘트에 **답글**을 답니다: "반영했습니다", "이 부분은 이런 이유로 유지했습니다"
- 해결된 대화는 **Resolve conversation** 으로 정리합니다
- 반영이 끝나면 **Re-request review** 로 다시 리뷰를 요청합니다

**예외** — 아직 아무도 리뷰하지 않았다면 `--amend` 해도 무방합니다.
</details>

**3.** 오픈소스 프로젝트에 처음 기여하려 합니다. **fork부터 PR까지의 순서**와, 브랜치 모델과 다른 점을 설명하세요.

<details>
<summary>답 보기</summary>

**순서**

```bash
# ① GitHub 웹에서 Fork 버튼 → 내 계정으로 복사

# ② 내 fork 를 clone
git clone https://github.com/<내아이디>/<프로젝트>.git
cd <프로젝트>

# ③ 원본 저장소를 upstream 으로 등록  ← 브랜치 모델에는 없는 단계
git remote add upstream https://github.com/<원본>/<프로젝트>.git

# ④ 최신 상태로 맞추기  ← fork 는 자동 갱신되지 않음
git fetch upstream
git switch main
git rebase upstream/main
git push

# ⑤ 브랜치를 파서 작업
git switch -c fix/typo-in-docs
# ... 작업 ...
git commit -m "docs: 오타 수정"

# ⑥ 내 fork 로 push  (원본에는 권한이 없음)
git push -u origin fix/typo-in-docs

# ⑦ 원본 저장소로 PR
#    base: 원본/main   ←   compare: 내계정/fix/typo-in-docs
```

**브랜치 모델과의 차이**

| | 브랜치 모델 | fork 모델 |
|---|---|---|
| 원격 | `origin` 하나 | **`origin` + `upstream` 둘** |
| 권한 | 쓰기 권한 필요 | 불필요 |
| push 대상 | 원본 저장소 | **내 fork** |
| 최신화 | `git pull` | **`git fetch upstream`** |
| PR 방향 | 같은 저장소 안 | 저장소 → 저장소 |

**기여 전 반드시 확인할 것**

1. **`CONTRIBUTING.md`** — 커밋 규칙, 테스트 방법, PR 형식
2. **기존 이슈** — 이미 누가 작업 중일 수 있습니다. `good first issue` 라벨을 찾아보세요
3. **큰 변경은 이슈로 먼저 논의** — 코드부터 쓰면 "그건 저희 방향과 안 맞습니다" 로 거절될 수 있습니다
4. **작게 시작** — 첫 기여는 오타 수정이나 문서 개선이 좋습니다. 절차를 익히는 것이 목적입니다
</details>

---

## 오늘의 정리

**PR 흐름**

```
이슈 생성  →  브랜치 생성  →  작업·커밋  →  push
   →  PR 생성 (base=main, compare=feature)
   →  리뷰  →  추가 커밋으로 반영  →  승인
   →  Squash and merge  →  브랜치 삭제  →  이슈 자동 닫힘
```

**Merge 버튼 3종**

| | 결과 | 특징 |
|---|---|---|
| Create a merge commit | 커밋 전부 + 머지 커밋 | 이력 보존, 가지 모양 |
| **Squash and merge** | **커밋 하나** | `main` 깔끔, 되돌리기 쉬움 |
| Rebase and merge | 커밋 전부, 일직선 | 해시 변경, PR 단위 안 보임 |

**리뷰 3종**

```
Comment          의견만
Approve          승인
Request changes  수정 요청 (병합 차단)
```

**주요 명령 (`gh` CLI)**

| 명령 | 하는 일 |
|---|---|
| `gh pr create --fill` | PR 생성 |
| `gh pr list` | PR 목록 |
| `gh pr checkout <번호>` | **남의 PR을 로컬에서 확인** |
| `gh pr review <번호> --approve` | 승인 |
| `gh pr merge <번호> --squash --delete-branch` | 병합 + 정리 |

**설정 파일**

```
.github/pull_request_template.md      PR 본문 템플릿
.github/ISSUE_TEMPLATE/               이슈 템플릿
CONTRIBUTING.md                       기여 가이드 (13강)
```

**이슈 자동 닫기** — PR 본문에 `Closes #42`

**오늘 반드시 기억할 한 가지**
> **리뷰 반영은 추가 커밋으로.** `--amend` + force push는 리뷰어의 시야를 지웁니다.
> 지저분해도 괜찮습니다. **Squash and merge** 하면 `main` 에는 하나로 들어갑니다.

**과제**
1. `todo-app` 에 이슈를 만들고, 브랜치 이름에 이슈 번호를 넣어 작업한 뒤 PR을 만드세요.
2. PR 본문에 **무엇을 / 왜 / 어떻게 / 확인 방법**을 채우고 `Closes #번호` 를 넣으세요.
3. 본인 PR의 **Files changed** 탭에서 스스로 코멘트를 3개 이상 달아 보세요. (셀프 리뷰도 실제로 효과가 있습니다)
4. 코멘트를 **추가 커밋**으로 반영하고, PR이 자동 갱신되는 것을 확인하세요.
5. **Squash and merge** 로 병합하고, 이슈가 자동으로 닫히는지 확인하세요.
6. `.github/pull_request_template.md` 를 만들고, 다음 PR에서 자동으로 채워지는지 확인하세요.

---

[← 이전 13강](lesson-13.md) · [목차](README.md) · [다음 → 15강 좋은 커밋 만들기](lesson-15.md)
