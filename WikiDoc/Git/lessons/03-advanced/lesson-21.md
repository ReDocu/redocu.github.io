# 21강 · `.git` 폴더 해부

> **Git 학습 매뉴얼** · 🔴 고급 · **21강 / 30**
> [← 이전 20강](lesson-20.md) · [목차](README.md) · [다음 → 22강 참조와 HEAD](lesson-22.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- Git의 **객체 4종**(blob · tree · commit · tag)이 각각 무엇을 담는지 설명할 수 있다.
- 해시가 **내용에서 계산된다**는 것을 직접 확인할 수 있다.
- `git cat-file` 로 저장소 안의 객체를 꺼내 볼 수 있다.
- 배관 명령(plumbing)만으로 **커밋을 손으로 만들 수 있다.**
- loose object와 packfile의 차이를 알고 `git gc` 가 무엇을 하는지 안다.

---

## ② 왜 필요한가

지금까지 이런 표현을 반복해서 썼습니다.

- "커밋은 그 시점의 **스냅샷**입니다" ([01강](lesson-01.md))
- "브랜치는 커밋을 가리키는 **이름표**입니다" ([08강](lesson-08.md))
- "rebase는 커밋을 **다시 씁니다**" ([12강](lesson-12.md))

전부 맞는 말이지만 **비유**였습니다. 오늘 그 실체를 봅니다.

**왜 알아야 할까요.**

| 상황 | 내부를 알면 |
|---|---|
| `reset --hard` 로 커밋을 날렸다 | 객체는 **아직 살아 있다**는 걸 안다 → [23강](lesson-23.md) |
| `.git` 폴더가 5GB가 됐다 | 왜 커졌는지, 무엇을 지워야 하는지 안다 → [28강](lesson-28.md) |
| 비밀키를 커밋했다 | **파일을 지워도 객체는 남는다**는 걸 안다 → [29강](lesson-29.md) |
| rebase 후 해시가 왜 바뀌나 | 부모가 바뀌면 해시가 바뀌는 이유를 안다 |
| `reset` 세 옵션이 헷갈린다 | 세 공간이 각각 어떤 데이터인지 안다 → [24강](lesson-24.md) |

**고급 과정의 나머지 9개 강이 전부 오늘 배우는 것 위에 세워집니다.**

> Git 명령은 두 층으로 나뉩니다.
> **자기(porcelain)** — `add`, `commit`, `log` 처럼 사람이 쓰는 명령
> **배관(plumbing)** — `hash-object`, `cat-file`, `write-tree` 처럼 내부를 다루는 명령
> 오늘은 배관을 씁니다. 평소에 쓸 일은 없지만, **한 번 열어 보면 나머지가 전부 이해됩니다.**

---

## ③ 개념 설명

### Git은 "내용 주소 지정" 저장소입니다

일반 파일 시스템은 **이름**으로 파일을 찾습니다.

```
/home/user/note.txt  →  파일 내용
```

Git은 **내용을 해시로 변환한 값**으로 찾습니다.

```
8d0e41234f24b6da002d962a26c2495ea16a425f  →  "hello git\n"
```

이것을 **content-addressable storage(내용 주소 지정 저장소)** 라고 합니다. 결과가 세 가지입니다.

| 성질 | 의미 |
|---|---|
| **같은 내용 = 같은 해시** | 파일 10개가 내용이 같으면 **객체는 하나**만 저장됩니다 |
| **내용이 1비트라도 다르면 완전히 다른 해시** | 위조·손상을 즉시 감지할 수 있습니다 |
| **해시는 내용에서만 결정** | 파일 이름·경로·시각과 무관합니다 |

> Git은 SHA-1을 씁니다. 40자리 16진수(160비트)입니다.
> SHA-1의 충돌 취약점 때문에 **SHA-256 저장소**도 지원되지만, 아직 기본값은 SHA-1입니다.
> Git은 충돌 공격 탐지 코드를 넣어 두어 실사용에서는 문제가 없습니다.

### 객체 4종

`.git/objects/` 에 저장되는 것은 딱 네 종류입니다.

| 객체 | 담는 것 | 비유 |
|---|---|---|
| **blob** | **파일의 내용** (이름 없음!) | 종이 한 장 |
| **tree** | 파일 이름 · 권한 · blob/tree 참조 | 폴더 목록 |
| **commit** | tree 하나 + 부모 + 작성자 + 메시지 | 스냅샷 한 장 + 메모 |
| **tag** | commit 하나 + 태거 + 메시지 | 액자에 붙인 이름표 |

**전체 그림**

```
   commit ──── tree ────┬── blob (a.txt 의 내용)
     │                  │
     │                  └── tree (docs/) ── blob (guide.txt 의 내용)
     │
     └── parent ──▶ 이전 commit ── tree ── ...
```

**중요한 사실 두 가지**

1. **blob에는 파일 이름이 없습니다.** 이름은 **tree**가 가지고 있습니다.
   → 그래서 파일 이름만 바꾸면 blob은 재사용되고 tree만 새로 생깁니다.
2. **commit은 tree 하나만 가리킵니다.** 그 tree가 프로젝트 루트입니다.
   → 그래서 커밋 하나로 "그 시점 전체"를 꺼낼 수 있습니다.

### 왜 해시가 바뀌는가

commit 객체는 이런 텍스트입니다.

```
tree 6f684741235e178256f6632288c3fb4d724c885d
parent bf5de013ebaf49723a1c1062a602dd8ab7eea8ed
author Hong Gildong <hong@example.com> 1786365000 +0900
committer Hong Gildong <hong@example.com> 1786365000 +0900

feat: 둘째 줄 추가
```

이 **텍스트 전체**를 해시한 값이 커밋 해시입니다. 그러니 **부모가 바뀌면 해시도 바뀝니다.**

```
rebase  →  부모가 달라짐  →  해시가 달라짐  →  "다시 쓰인 커밋"
amend   →  내용·메시지가 달라짐  →  해시가 달라짐
```

[12강](lesson-12.md)의 황금률과 [07강](lesson-07.md)의 `--amend` 주의사항이 **전부 여기서 나옵니다.**

그리고 커밋에는 **커밋 시각과 작성자**가 들어갑니다. 그래서 같은 내용이라도 **사람마다 커밋 해시는 다릅니다.** 반면 **blob과 tree의 해시는 전 세계 누구나 같습니다.** 내용만으로 결정되기 때문입니다.

### 저장 방식 — loose object와 packfile

**loose object** — 객체 하나당 파일 하나입니다.

```
.git/objects/8d/0e41234f24b6da002d962a26c2495ea16a425f
             └┬┘ └──────────────┬─────────────────┘
          앞 2자리          나머지 38자리
```

앞 2자리로 폴더를 나누는 이유는 **한 폴더에 파일이 너무 많아지는 것을 막기 위해서**입니다.

내용은 **zlib으로 압축**되어 있어 `cat` 으로 열면 깨져 보입니다. `git cat-file` 을 써야 합니다.

**packfile** — 객체가 많아지면 Git이 **하나의 압축 파일로 묶습니다.**

```
.git/objects/pack/pack-e00141619fcad854a68c42a4ef49a06f0c560a7c.pack   실제 데이터
.git/objects/pack/pack-e00141619fcad854a68c42a4ef49a06f0c560a7c.idx    색인
```

이때 **델타 압축**이 적용됩니다. 비슷한 객체는 "차이만" 저장합니다.

> [01강](lesson-01.md)에서 "Git은 스냅샷을 저장하는데도 용량이 안 늘어난다"고 한 이유가 여기 있습니다.
> **논리적으로는 스냅샷**이지만 **물리적으로는 델타 압축**됩니다. 두 층이 분리되어 있습니다.

### `.git` 폴더 전체 지도

```
.git/
├── HEAD                 지금 어느 브랜치에 있는지 (텍스트 한 줄)
├── config               이 저장소 설정 (--local)
├── description          GitWeb 용. 거의 안 씀
├── index                ⭐ 스테이지 (바이너리 파일)
├── COMMIT_EDITMSG       마지막 커밋 메시지 임시 파일
├── hooks/               훅 스크립트 (26강)
├── info/
│   └── exclude          나만의 무시 목록 (05강)
├── logs/                ⭐ reflog (23강)
│   ├── HEAD
│   └── refs/heads/main
├── objects/             ⭐ 모든 객체
│   ├── 8d/0e4123...       loose object
│   ├── pack/              packfile
│   └── info/
└── refs/                ⭐ 브랜치·태그 (22강)
    ├── heads/main         → 커밋 해시 40자
    └── tags/v1.0.0
```

⭐ 표시된 넷이 핵심입니다. **objects**(내용) · **refs**(이름표) · **index**(스테이지) · **logs**(이동 기록).

---

## ④ 단계별 실습

### Step 0. 실험실 저장소 만들기

> ⚠️ **기존 프로젝트에서 하지 마세요.** 버려도 되는 새 폴더에서 진행합니다.

```bash
cd ~/Desktop
mkdir git-internals && cd git-internals
git init
git config user.name "Hong Gildong"
git config user.email "hong@example.com"
git config core.autocrlf false      # ⭐ 해시를 맞추기 위해 필수
```

> **`core.autocrlf false` 가 중요합니다.** Windows 기본값(`true`)이면 줄바꿈이 변환되어 이 문서와 다른 해시가 나올 수 있습니다.
> 이 실험실 저장소에서만 끄는 것이니 다른 프로젝트에는 영향이 없습니다 ([02강](lesson-02.md) 설정 우선순위).

```bash
ls -a .git
```

실행 결과:

```
.  ..  config  description  HEAD  hooks  info  objects  refs
```

```bash
find .git/objects -type f
```

**아무것도 안 나옵니다.** 객체가 하나도 없습니다.

### Step 1. 해시는 내용에서 나온다

**커밋도 파일 추가도 없이** 해시만 계산해 봅니다.

```bash
echo "hello git" | git hash-object --stdin
```

실행 결과:

```
8d0e41234f24b6da002d962a26c2495ea16a425f
```

> 🔑 **여러분 화면에도 정확히 같은 값이 나옵니다.**
> 시각도 이름도 파일명도 관계없습니다. **내용 `hello git\n` 하나가 이 해시를 결정합니다.**
> 다르게 나온다면 줄바꿈 문제입니다. `core.autocrlf` 를 확인하세요.

파일로 만들어도 같습니다.

```bash
printf 'hello git\n' > a.txt
git hash-object a.txt
```

실행 결과:

```
8d0e41234f24b6da002d962a26c2495ea16a425f
```

**파일 이름은 해시에 영향을 주지 않습니다.**

**Git이 실제로 해시하는 것**

```
"blob " + 내용의 바이트 수 + "\0" + 내용
 └─ 헤더 ────────────────────┘
```

즉 `blob 10\0hello git\n` 을 SHA-1한 값입니다. 헤더 때문에 **같은 내용이라도 타입이 다르면 다른 해시**가 됩니다.

**알아 두면 쓸모 있는 두 개**

```bash
printf '' | git hash-object --stdin          # 빈 파일
git hash-object -t tree /dev/null            # 빈 트리
```

실행 결과:

```
e69de29bb2d1d6434b8b29ae775ad8c2e48c5391
4b825dc642cb6eb9a060e54bf8d69288fbee4904
```

> 이 두 해시는 **모든 Git 저장소에서 동일**합니다. 스크립트에서 "빈 상태와 비교"할 때 씁니다.

### Step 2. 객체를 실제로 저장하고 꺼내 보기

```bash
mkdir docs
printf 'read me\n' > docs/guide.txt
git add a.txt docs/guide.txt
git commit -m "feat: 첫 커밋"
```

```bash
find .git/objects -type f | sort
```

실행 결과:

```
.git/objects/04/fb3258aa36b95e9631974a0f396a23392877fa
.git/objects/46/5fcdc29d0bc515201d25c02fdb47d07fa1333e
.git/objects/8d/0e41234f24b6da002d962a26c2495ea16a425f
.git/objects/bf/5de013ebaf49723a1c1062a602dd8ab7eea8ed
.git/objects/d9/b401251bb36c51ca5c56c2ffc8a24a78ff20ae
```

**파일 2개를 커밋했는데 객체가 5개입니다.** 무엇인지 확인해 봅시다.

```bash
git cat-file --batch-check --batch-all-objects
```

실행 결과:

```
04fb3258aa36b95e9631974a0f396a23392877fa tree 64
465fcdc29d0bc515201d25c02fdb47d07fa1333e tree 37
8d0e41234f24b6da002d962a26c2495ea16a425f blob 10
bf5de013ebaf49723a1c1062a602dd8ab7eea8ed commit 179
d9b401251bb36c51ca5c56c2ffc8a24a78ff20ae blob 8
```

| 개수 | 정체 |
|---|---|
| blob 2개 | `a.txt` 내용, `docs/guide.txt` 내용 |
| tree 2개 | 루트 폴더, `docs/` 폴더 |
| commit 1개 | 커밋 |

> **`8d0e412...` 가 그대로 있습니다.** Step 1에서 계산했던 그 해시입니다.

**`git cat-file` 사용법**

```bash
git cat-file -t 8d0e412      # 타입
git cat-file -s 8d0e412      # 크기(바이트)
git cat-file -p 8d0e412      # 내용 (pretty print)
```

실행 결과:

```
blob
10
hello git
```

> **해시는 앞 7자리만 써도 됩니다.** 저장소 안에서 유일하게 구분되면 충분합니다.
>
> ⚠️ `cat .git/objects/8d/0e4123...` 로 직접 열면 zlib 압축이라 깨져 보입니다. **반드시 `cat-file` 을 쓰세요.**

### Step 3. 커밋 → 트리 → blob 따라가기

**이번 강의 핵심 실습입니다.** 위에서 아래로 한 층씩 내려갑니다.

**① 커밋 객체**

```bash
git cat-file -p HEAD
```

실행 결과:

```
tree 04fb3258aa36b95e9631974a0f396a23392877fa
author Hong Gildong <hong@example.com> 1786363200 +0900
committer Hong Gildong <hong@example.com> 1786363200 +0900

feat: 첫 커밋
```

**커밋 객체는 이게 전부입니다.** 파일 내용은 한 글자도 없습니다. **tree 하나를 가리킬 뿐**입니다.

| 줄 | 뜻 |
|---|---|
| `tree ...` | 이 시점의 루트 폴더 |
| `parent ...` | 이전 커밋 (첫 커밋이라 없음) |
| `author` | **코드를 쓴 사람** + 작성 시각 |
| `committer` | **커밋을 만든 사람** + 커밋 시각 |
| 빈 줄 아래 | 커밋 메시지 |

> **author와 committer가 다를 수 있습니다.**
> [12강](lesson-12.md)의 rebase나 [16강](lesson-16.md)의 cherry-pick을 하면 **author는 원작자 그대로, committer는 나**가 됩니다.
> `1786363200` 은 유닉스 타임스탬프(초)입니다.

**② 루트 트리**

```bash
git cat-file -p 04fb3258
```

실행 결과:

```
100644 blob 8d0e41234f24b6da002d962a26c2495ea16a425f	a.txt
040000 tree 465fcdc29d0bc515201d25c02fdb47d07fa1333e	docs
```

**여기서 처음으로 파일 이름이 나옵니다.** tree가 이름을 가지고 있습니다.

`HEAD^{tree}` 라고 쓰면 해시를 몰라도 됩니다.

```bash
git cat-file -p HEAD^{tree}
```

**모드(왼쪽 숫자)의 뜻**

| 모드 | 의미 |
|---|---|
| `100644` | 일반 파일 |
| `100755` | 실행 가능 파일 |
| `120000` | 심볼릭 링크 |
| `040000` | 디렉터리(tree) |
| `160000` | **서브모듈** ([28강](lesson-28.md)) |

> Git이 저장하는 권한 정보는 **"실행 가능한가"** 뿐입니다. 소유자·그룹은 저장하지 않습니다.

**③ 하위 트리**

```bash
git cat-file -p HEAD:docs
```

실행 결과:

```
100644 blob d9b401251bb36c51ca5c56c2ffc8a24a78ff20ae	guide.txt
```

> `HEAD:docs` 는 **"HEAD 커밋의 docs 경로"** 라는 표기입니다. [06강](lesson-06.md)에서 `git show HEAD~3:README.md` 로 써 봤던 것과 같은 문법입니다.

**④ 최종 blob**

```bash
git cat-file -p d9b4012
```

실행 결과:

```
read me
```

**커밋 → 트리 → 트리 → blob** 까지 내려왔습니다. 이것이 Git 저장소의 전부입니다.

### Step 4. 부모와 해시의 관계

두 번째 커밋을 만듭니다.

```bash
printf 'hello git\nsecond line\n' > a.txt
git add a.txt
git commit -m "feat: 둘째 줄 추가"
git cat-file -p HEAD
```

실행 결과:

```
tree 6f684741235e178256f6632288c3fb4d724c885d
parent bf5de013ebaf49723a1c1062a602dd8ab7eea8ed
author Hong Gildong <hong@example.com> 1786365000 +0900
committer Hong Gildong <hong@example.com> 1786365000 +0900

feat: 둘째 줄 추가
```

**`parent` 줄이 생겼습니다.** 이것이 커밋들을 사슬로 잇습니다.

```bash
git cat-file -p HEAD^{tree}
```

실행 결과:

```
100644 blob 3fbbc42e5b9a7a4f0b9e26b0f8c1e5d7a2c9f4b1	a.txt
040000 tree 465fcdc29d0bc515201d25c02fdb47d07fa1333e	docs
```

> 🔑 **`docs` 트리의 해시가 첫 커밋과 똑같습니다** (`465fcdc...`).
> `docs/` 는 안 바뀌었으니 **새로 저장하지 않고 재사용**한 것입니다.
> [01강](lesson-01.md)에서 그림으로 설명한 "안 바뀐 파일은 이전 것을 가리킨다"가 바로 이것입니다.

**직접 확인해 봅시다.**

```bash
git cat-file --batch-check --batch-all-objects | wc -l
```

파일 하나를 고쳤을 뿐인데 늘어난 객체는 **3개**(새 blob, 새 루트 tree, 새 commit)뿐입니다. `docs` 트리와 그 안의 blob은 그대로입니다.

### Step 5. 태그 객체

```bash
git tag -a v1.0.0 -m "첫 릴리스"
git cat-file -t v1.0.0
git cat-file -p v1.0.0
```

실행 결과:

```
tag
object 22dfff0a279d3fc747d92e4e56616256835b81ab
type commit
tag v1.0.0
tagger Hong Gildong <hong@example.com> 1786365000 +0900

첫 릴리스
```

**annotated 태그는 독립된 객체**입니다. 커밋을 가리키고, 만든 사람과 메시지를 담습니다.

lightweight 태그와 비교해 봅시다.

```bash
git tag light-tag
git cat-file -t light-tag
```

실행 결과:

```
commit
```

> **lightweight 태그는 객체를 만들지 않습니다.** `refs/tags/light-tag` 라는 파일에 커밋 해시만 적어 둡니다.
> [19강](lesson-19.md)에서 "릴리스에는 `-a` 를 쓰라"고 한 이유가 이것입니다.

### Step 6. 커밋을 손으로 만들기

**Git의 마법이 사라지는 순간입니다.** `git commit` 없이 배관 명령만으로 커밋을 만듭니다.

새 실험실을 만듭니다.

```bash
cd ~/Desktop
mkdir manual-commit && cd manual-commit
git init
git config user.name "Hong Gildong"
git config user.email "hong@example.com"
git config core.autocrlf false
```

**① blob을 저장소에 기록**

```bash
printf 'Git 내부 구조 실습\n' > note.txt
git hash-object -w note.txt
```

실행 결과:

```
7d8c0d32ac996ef2018af8b9327333440c720fb1
```

> `-w` 가 **"계산만 하지 말고 실제로 저장하라"** 는 뜻입니다. 없으면 해시만 출력합니다.

```bash
find .git/objects -type f
```

객체 하나가 생겼습니다. 하지만 `git status` 를 보면 `note.txt` 는 여전히 untracked입니다. **blob은 저장됐지만 인덱스에는 없기 때문**입니다.

**② 인덱스(스테이지)에 등록**

```bash
git update-index --add note.txt
git ls-files -s
```

실행 결과:

```
100644 7d8c0d32ac996ef2018af8b9327333440c720fb1 0	note.txt
```

> **이것이 `.git/index` 의 내용입니다.** `git add` 가 하는 일이 바로 ①+②입니다.
> [03강](lesson-03.md)에서 "스테이지는 장바구니"라고 한 것의 실체는 **"파일 경로 → blob 해시" 목록**입니다.

**③ 인덱스로 tree 만들기**

```bash
git write-tree
```

실행 결과:

```
6708c45316888d19cacb0b01d5feb74f18a87624
```

```bash
git cat-file -p 6708c45
```

실행 결과:

```
100644 blob 7d8c0d32ac996ef2018af8b9327333440c720fb1	note.txt
```

**④ tree로 commit 만들기**

```bash
echo "chore: 손으로 만든 커밋" | git commit-tree 6708c45
```

실행 결과:

```
b789914bb0408684520f99dda50736461f2db5dc
```

```bash
git cat-file -p b789914
```

실행 결과:

```
tree 6708c45316888d19cacb0b01d5feb74f18a87624
author Hong Gildong <hong@example.com> 1786366800 +0900
committer Hong Gildong <hong@example.com> 1786366800 +0900

chore: 손으로 만든 커밋
```

**커밋이 만들어졌습니다.** 그런데 `git log` 를 치면?

```bash
git log
```

```
fatal: your current branch 'main' does not have any commits yet
```

**커밋 객체는 있는데 아무도 그것을 가리키지 않습니다.**

**⑤ 브랜치가 그 커밋을 가리키게 하기**

```bash
git update-ref refs/heads/main b789914
git log --oneline
```

실행 결과:

```
b789914 chore: 손으로 만든 커밋
```

```bash
git status
```

실행 결과:

```
On branch main
nothing to commit, working tree clean
```

**완전히 정상적인 커밋입니다.** `git commit` 을 한 번도 쓰지 않았습니다.

> 🔑 **`git commit` 은 결국 이 다섯 단계를 자동으로 하는 것입니다.**
> ```
> git add      = hash-object -w  +  update-index
> git commit   = write-tree  +  commit-tree  +  update-ref
> ```
> 이 구조를 이해하면 [24강](lesson-24.md)의 `reset` 세 옵션이 자명해집니다.

### Step 7. packfile과 `git gc`

첫 실험실로 돌아갑니다.

```bash
cd ~/Desktop/git-internals
git count-objects -v
```

실행 결과:

```
count: 9
size: 0
in-pack: 0
packs: 0
size-pack: 0
prune-packable: 0
garbage: 0
size-garbage: 0
```

**`count: 9`** — loose object가 9개, packfile은 0개입니다.

```bash
git gc
find .git/objects -type f | sort
```

실행 결과:

```
.git/objects/info/commit-graph
.git/objects/info/packs
.git/objects/pack/pack-e00141619fcad854a68c42a4ef49a06f0c560a7c.idx
.git/objects/pack/pack-e00141619fcad854a68c42a4ef49a06f0c560a7c.pack
.git/objects/pack/pack-e00141619fcad854a68c42a4ef49a06f0c560a7c.rev
```

**흩어져 있던 파일들이 사라지고 packfile로 묶였습니다.**

```bash
git count-objects -v
```

실행 결과:

```
count: 0
size: 0
in-pack: 9
packs: 1
size-pack: 2
prune-packable: 0
garbage: 0
size-garbage: 0
```

**객체는 그대로 접근됩니다.**

```bash
git cat-file -p 8d0e412
```

실행 결과:

```
hello git
```

> **`git gc` 는 자동으로도 실행됩니다.** loose object가 일정 수를 넘으면 Git이 알아서 돌립니다.
> `gc` 는 "garbage collection"이지만, **묶는 것이 주된 일**이고 삭제는 조건이 맞을 때만 합니다.
> **도달 불가 객체 삭제**는 [23강](lesson-23.md)에서 다룹니다.

**저장소 무결성 검사**

```bash
git fsck
```

아무것도 출력되지 않으면 정상입니다.

### 같은 일을 GUI로 하면

**이 영역은 GUI 도구가 거의 지원하지 않습니다.** 배관 명령은 사람이 쓰라고 만든 것이 아니기 때문입니다.

굳이 찾자면:

| 도구 | 지원 |
|---|---|
| VS Code | 없음 |
| **GitHub 웹** | URL로 객체 조회: `github.com/<user>/<repo>/tree/<커밋해시>` |
| `git log --format=raw` | 커밋 객체를 자기 명령으로 보기 |

```bash
git log --format=raw -1
```

실행 결과:

```
commit 22dfff0a279d3fc747d92e4e56616256835b81ab
tree 6f684741235e178256f6632288c3fb4d724c885d
parent bf5de013ebaf49723a1c1062a602dd8ab7eea8ed
author Hong Gildong <hong@example.com> 1786365000 +0900
committer Hong Gildong <hong@example.com> 1786365000 +0900

    feat: 둘째 줄 추가
```

> `--format=raw` 는 **일상적으로도 쓸 만합니다.** 커밋 객체의 실제 모습을 자기 명령으로 볼 수 있습니다.

---

## ⑤ 자주 하는 실수

### `.git/objects` 파일을 직접 열어 봄

```bash
cat .git/objects/8d/0e41234f24b6da002d962a26c2495ea16a425f
```

```
xK��OR04c(��H�,V����
```

**원인** — zlib 압축된 바이너리입니다.
**해결** — 항상 `git cat-file -p <해시>` 를 쓰세요.

### 해시가 문서와 다르게 나옴

**원인 대부분은 줄바꿈입니다.** Windows에서 메모장으로 파일을 만들면 CRLF가 들어갑니다.

**확인**

```bash
git config core.autocrlf
file a.txt                    # Git Bash 에서
xxd a.txt | head -1           # 바이트 직접 보기
```

**해결** — 실험실 저장소에서 `core.autocrlf false` 로 두고, 파일은 `printf` 로 만드세요.

```bash
printf 'hello git\n' > a.txt      # LF
echo "hello git" > a.txt          # 셸에 따라 다를 수 있음
```

> **커밋 해시는 애초에 다릅니다.** 작성자와 시각이 들어가기 때문입니다. **blob과 tree 해시만** 같아야 합니다.

### `.git` 폴더의 파일을 손으로 고침

**증상** — 저장소가 손상되어 `git status` 조차 안 됩니다.

```
error: object file .git/objects/8d/0e4123... is empty
fatal: loose object 8d0e4123... is corrupt
```

**해결** —

```bash
git fsck --full                      # 손상 범위 확인
```

원격에 push해 둔 상태라면 **다시 clone하는 것이 가장 빠릅니다.**

```bash
cd ..
git clone <원격 주소> repo-new
```

> **`.git` 안은 읽기만 하세요.** 유일하게 손으로 고쳐도 되는 것은 `.git/config` 와 `.git/info/exclude` 정도입니다.

### "파일을 지웠으니 저장소에서도 사라졌다"고 생각

```bash
git rm secret.env
git commit -m "chore: 비밀 파일 삭제"
```

**증상** — 저장소 용량이 그대로이고, 과거 커밋에서 파일이 그대로 조회됩니다.

```bash
git cat-file -p HEAD~1:secret.env      # 여전히 읽힘
```

**원인** — 객체는 **불변**입니다. 삭제 커밋은 "이 시점부터 없다"는 새 tree를 만들 뿐, **blob은 그대로 남습니다.**
**해결** — 이력에서 완전히 지우려면 **이력 재작성**이 필요합니다 ([29강](lesson-29.md)).

> 🚨 **비밀키를 커밋했다면 파일 삭제로는 절대 해결되지 않습니다.**
> [05강](lesson-05.md)에서 "키를 즉시 무효화하라"고 한 이유가 이것입니다. 객체는 남아 있고, 이미 push했다면 복제본이 여기저기 있습니다.

### `git gc` 를 하면 뭐든 정리될 거라 기대

**증상** — 큰 파일을 커밋에서 지우고 `git gc` 를 돌렸는데 용량이 그대로입니다.
**원인** — 그 객체가 **아직 커밋 이력에서 도달 가능**하기 때문입니다. `gc` 는 도달 가능한 객체를 지우지 않습니다.
**해결** — 이력에서 그 커밋 자체를 없애야 합니다 ([29강](lesson-29.md)).

도달 불가 객체를 즉시 정리하려면:

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

> 🚨 **이건 [23강](lesson-23.md)의 복구 수단을 없애는 명령입니다.** 실행 전에 정말 필요한지 확인하세요.

### 해시 앞자리가 겹쳐서 `ambiguous`

```
error: short object ID 8d0e is ambiguous
```

**원인** — 앞자리가 같은 객체가 둘 이상입니다.
**해결** — 자릿수를 늘리세요.

```bash
git cat-file -p 8d0e41234
git rev-parse --short=12 HEAD          # 12자리 짧은 해시
```

> 저장소가 커지면 Git이 자동으로 짧은 해시 길이를 늘립니다. 기본 7자리는 중소 규모 기준입니다.

---

## ⑥ 확인 문제

**1.** 파일 이름만 `a.txt` → `b.txt` 로 바꾸고 커밋했습니다. **새로 생기는 객체는 몇 개**이고 각각 무엇일까요?

<details>
<summary>답 보기</summary>

**2개**입니다. **새 tree 1개 + 새 commit 1개.**

**blob은 새로 생기지 않습니다.**

| 객체 | 새로 생기나 | 이유 |
|---|---|---|
| blob | ❌ | **blob에는 파일 이름이 없습니다.** 내용이 같으면 같은 해시 |
| tree | ✅ | 이름을 담는 것이 tree입니다. 목록이 바뀌었으니 새로 생김 |
| commit | ✅ | 가리키는 tree가 바뀌었으니 새로 생김 |

**직접 확인**

```bash
git cat-file -p HEAD~1^{tree}     # 이름 바꾸기 전
git cat-file -p HEAD^{tree}       # 후
```

```
100644 blob 8d0e41234f24b6da002d962a26c2495ea16a425f	a.txt      ← 전
100644 blob 8d0e41234f24b6da002d962a26c2495ea16a425f	b.txt      ← 후
       └───────────── 같은 blob 해시 ─────────────┘
```

**이래서 Git이 파일 이름 변경을 알아챕니다.** Git은 이름 변경을 따로 기록하지 않습니다. **같은 blob이 다른 이름으로 나타난 것을 보고 추론**할 뿐입니다.

[04강](lesson-04.md)에서 "`git mv` 를 써도 내용이 크게 바뀌면 삭제+추가로 보인다"고 한 이유가 이것입니다. blob이 달라지면 추론할 근거가 사라집니다.
</details>

**2.** 커밋 해시가 `abc123` 인 커밋에서 `src/main.py` 의 내용을 보고 싶습니다. **배관 명령만으로** 따라가는 과정을 적어 보세요.

<details>
<summary>답 보기</summary>

```bash
# ① 커밋 객체에서 tree 해시 얻기
git cat-file -p abc123
```

```
tree 04fb3258aa36b95e9631974a0f396a23392877fa
parent ...
```

```bash
# ② 루트 트리에서 src 찾기
git cat-file -p 04fb3258
```

```
100644 blob 8d0e4123...	README.md
040000 tree 465fcdc2...	src
```

```bash
# ③ src 트리에서 main.py 찾기
git cat-file -p 465fcdc2
```

```
100644 blob d9b40125...	main.py
```

```bash
# ④ blob 내용 보기
git cat-file -p d9b40125
```

**한 줄로 하는 방법**

```bash
git cat-file -p abc123:src/main.py
```

또는 자기 명령으로:

```bash
git show abc123:src/main.py
```

**`<커밋>:<경로>` 표기**를 Git이 알아서 ①~④를 해 주는 것입니다. [06강](lesson-06.md)에서 배운 그 문법입니다.

**연습 삼아 이런 것도 해 보세요.**

```bash
git rev-parse abc123:src/main.py       # 그 파일의 blob 해시만
git cat-file -s abc123:src/main.py     # 크기
```
</details>

**3.** 팀원이 이렇게 말합니다. **"비밀키가 든 `.env` 를 실수로 커밋했는데, `git rm` 하고 커밋했으니 이제 괜찮죠?"** 객체 모델로 설명해 보세요.

<details>
<summary>답 보기</summary>

**괜찮지 않습니다. 키는 그대로 저장소 안에 있습니다.**

**왜 그런가**

Git의 객체는 **불변(immutable)** 입니다. `git rm` + 커밋이 하는 일은 이것뿐입니다.

```
커밋 A: tree ──▶ .env 의 blob (키가 들어 있음)
                 ▲
                 │ 이 blob 은 그대로 남음
커밋 B: tree ──▶ (.env 항목이 없는 tree)
```

**새 tree를 만들었을 뿐, blob은 삭제되지 않았습니다.**

**직접 확인**

```bash
git cat-file -p HEAD~1:.env       # 여전히 읽힘
git log --all --oneline -- .env   # 이력에 남아 있음
```

**게다가 이미 push했다면**

- GitHub 서버에 남아 있습니다
- clone한 팀원 모두의 로컬에 있습니다
- fork되었다면 그쪽에도 있습니다
- 검색 봇이 이미 수집했을 수 있습니다

**올바른 대응 순서**

| 순서 | 할 일 | 중요도 |
|---|---|---|
| **1** | **키·비밀번호를 즉시 무효화하고 재발급** | 🚨 이게 전부입니다 |
| 2 | `.gitignore` 에 추가 ([05강](lesson-05.md)) | 재발 방지 |
| 3 | 이력에서 제거 (`git filter-repo`) ([29강](lesson-29.md)) | 정리 |
| 4 | 팀 전체에 재clone 안내 | 정리 |
| 5 | 노출 기간 동안의 접근 로그 확인 | 피해 파악 |

**1번이 나머지 전부보다 중요합니다.** 이력을 아무리 깨끗이 지워도, 유출된 키가 살아 있으면 의미가 없습니다.

> **핵심 원리 한 줄**
> **Git은 지우는 도구가 아니라 쌓는 도구입니다.** 삭제조차 "삭제했다는 사실을 추가"하는 방식으로 기록합니다.
</details>

---

## 오늘의 정리

**객체 4종**

| 객체 | 담는 것 |
|---|---|
| **blob** | 파일 **내용** (이름 없음) |
| **tree** | 이름 · 권한 · blob/tree 참조 |
| **commit** | tree 1개 + parent + author/committer + 메시지 |
| **tag** | commit + tagger + 메시지 (annotated만) |

```
commit ──▶ tree ──┬──▶ blob
                  └──▶ tree ──▶ blob
```

**배관 명령**

| 명령 | 하는 일 |
|---|---|
| `git hash-object <파일>` | 해시 계산 |
| `git hash-object -w <파일>` | 계산 + **저장** |
| `git cat-file -t <해시>` | 타입 |
| `git cat-file -s <해시>` | 크기 |
| **`git cat-file -p <해시>`** | **내용 출력** |
| `git cat-file --batch-check --batch-all-objects` | 모든 객체 나열 |
| `git ls-files -s` | 인덱스 내용 |
| `git update-index --add <파일>` | 인덱스에 등록 |
| `git write-tree` | 인덱스 → tree |
| `git commit-tree <tree>` | tree → commit |
| `git update-ref <ref> <해시>` | 브랜치가 커밋을 가리키게 |
| `git count-objects -v` | 객체 통계 |
| `git gc` | packfile로 묶기 |
| `git fsck` | 무결성 검사 |

**자기 명령 = 배관 명령의 조합**

```
git add     =  hash-object -w  +  update-index
git commit  =  write-tree  +  commit-tree  +  update-ref
```

**핵심 원리 3가지**

```
① 해시는 내용에서만 결정된다  →  같은 내용 = 같은 객체 (전 세계 공통)
② 객체는 불변이다            →  삭제해도 남는다 (29강)
③ 부모가 바뀌면 해시가 바뀐다  →  rebase·amend 는 "다시 쓰기" (12강 황금률)
```

**알아 두면 좋은 두 해시**

```
e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    빈 파일 (blob)
4b825dc642cb6eb9a060e54bf8d69288fbee4904    빈 트리
```

**오늘 반드시 기억할 한 가지**
> **blob에는 파일 이름이 없습니다.** 이름은 tree가 가지고, tree는 commit이 가리킵니다.
> 이 세 층 구조가 Git의 전부이고, 나머지 9개 강은 전부 이 위에 세워집니다.

**과제**
1. 실험실 저장소에서 `echo "hello git" | git hash-object --stdin` 을 실행해 **`8d0e412...` 가 나오는지** 확인하세요. 안 나오면 `core.autocrlf` 를 점검하세요.
2. 커밋 → 트리 → 하위 트리 → blob 까지 `git cat-file -p` 로 한 층씩 따라 내려가 보세요.
3. 파일 하나만 고쳐 커밋한 뒤, **바뀌지 않은 폴더의 tree 해시가 그대로인지** 비교하세요.
4. `hash-object -w` → `update-index` → `write-tree` → `commit-tree` → `update-ref` 로 **커밋을 손으로 만들어** 보세요.
5. `git gc` 를 실행해 loose object가 packfile로 묶이는 것을 확인하고, 묶인 뒤에도 `cat-file` 이 동작하는지 확인하세요.
6. `git log --format=raw -1` 로 커밋 객체의 실제 모습을 확인하세요.

---

[← 이전 20강](lesson-20.md) · [목차](README.md) · [다음 → 22강 참조와 HEAD](lesson-22.md)
