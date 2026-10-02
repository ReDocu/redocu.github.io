# 10강 · SQL 분류 완성과 DB 이론

> **정보처리기사 실기 학습 매뉴얼** · SQL·데이터베이스 · **10강 / 총16**
> [← 이전 09강](lesson-09.md) · [목차](README.md) · [다음 → 11강 SW 공학·테스트·UML·디자인 패턴](../04-core-theory/lesson-11.md)

---

## ① 학습 목표

이 강을 마치면 다음을 할 수 있습니다.

- SQL 4분류(DDL·DML·DCL·TCL)와 소속 명령을 **안 보고 재현할 수 있다**
- INSERT·UPDATE·DELETE와 GRANT·REVOKE 문장을 **직접 작성할 수 있다**
- 트랜잭션의 ACID 4성질과 COMMIT·ROLLBACK 동작을 **설명할 수 있다**
- 인덱스·뷰의 특징(장단점·제약)을 **단답으로 쓸 수 있다**
- 이상현상 3종과 정규형(1NF~BCNF)을 **판정하고**, 관계대수 기호를 SQL에 **대응시킬 수 있다**

---

## ② 왜 필요한가

**SELECT만 알면 SQL의 절반만 아는 것입니다.** 시험은 "명령을 분류하시오"(DDL/DML/DCL/TCL), "권한을 부여하는 SQL을 쓰시오"(GRANT), "이 상황에서 실행할 명령은?"(ROLLBACK)처럼 **조작·정의·제어 전반**을 묻습니다. 특히 UPDATE·DELETE의 WHERE 누락은 "에러 없이 전체가 바뀌는" 실무 최악의 사고이자 오류 찾기 유형의 단골입니다.

정규화와 관계대수는 코드 없이 나오는 **이론 단답의 양대 산맥**입니다. "부분 함수 종속을 제거한 정규형은?"(2NF), "σ 연산이 하는 일은?"(행 선택) — 용어와 기호만 정확하면 그대로 점수입니다. DB 이론을 이론 주차(6주차)가 아니라 오늘 배우는 이유는, 방금까지 다룬 테이블·JOIN 경험 위에서라야 "왜 나누는가(정규화)"와 "잇는 연산(⋈)"이 몸으로 이해되기 때문입니다.

**시험에서의 중요도와 출제 형태** — 분류형(명령 골라 묶기), SQL 작성형(INSERT·GRANT), 단답형(ACID·정규형·기호), 판정형(이 릴레이션은 몇 정규형 위반인가).

---

## ③ 개념 설명

### 3-1. SQL 4분류 — 전체 지도

📌 **반드시 암기 (표째)**

| 분류 | 이름 | 명령 | 기억법 |
|---|---|---|---|
| **DDL** | 데이터 **정의**어 (Definition) | `CREATE` `ALTER` `DROP` `TRUNCATE` | 구조(그릇)를 만들고 부순다 |
| **DML** | 데이터 **조작**어 (Manipulation) | `SELECT` `INSERT` `UPDATE` `DELETE` | 내용물을 넣고 고치고 뺀다 |
| **DCL** | 데이터 **제어**어 (Control) | `GRANT` `REVOKE` | 권한을 주고 뺏는다 |
| **TCL** | **트랜잭션** 제어어 (Transaction Control) | `COMMIT` `ROLLBACK` `SAVEPOINT` | 작업 묶음을 확정·취소한다 |

- ⚖️ 교재에 따라 SELECT를 DQL(질의어)로 따로 분류하기도 합니다. 통용 답안은 "SELECT는 DML"이며, 문제 보기에 DQL이 있으면 그에 따릅니다. TCL을 DCL에 포함시키는 분류도 있으나 최근 통용은 4분류입니다.
- ⚖️ **TRUNCATE는 DDL**입니다 — "행을 지우니 DML 아닌가"가 대표 오답 포인트 (3-3 비교표 참고).

### 3-2. DDL — 구조를 만들고 고친다

[07강 Step 2](lesson-07.md)의 CREATE TABLE이 바로 DDL이었습니다. 제약조건 어휘를 완성합니다.

| 제약조건 | 뜻 |
|---|---|
| `PRIMARY KEY` | 기본키 (NOT NULL + UNIQUE) |
| `FOREIGN KEY ... REFERENCES` | 외래키 — 참조 무결성 강제 |
| `UNIQUE` | 중복 금지 (NULL은 허용) |
| `NOT NULL` | NULL 금지 |
| `CHECK (조건)` | 값의 범위 제한 (예: `CHECK (학년 BETWEEN 1 AND 4)`) |
| `DEFAULT 값` | 생략 시 기본값 |

| 명령 | 형태 | 비고 |
|---|---|---|
| 열 추가 | `ALTER TABLE 테이블 ADD 열 자료형;` | |
| 열 변경 | `ALTER TABLE 테이블 MODIFY 열 자료형;` | ⚖️ Oracle·MySQL은 MODIFY, 표준·SQL Server는 `ALTER COLUMN` — 답안은 지문의 DBMS 표기를 따름 |
| 열 삭제 | `ALTER TABLE 테이블 DROP COLUMN 열;` | |
| 테이블 삭제 | `DROP TABLE 테이블 [CASCADE];` | ⚖️ CASCADE = 참조하는 객체까지 연쇄 삭제 (Oracle `CASCADE CONSTRAINTS`) — 단답 빈출 |

### 3-3. DML — 내용물을 다룬다

```sql
INSERT INTO 테이블 (열1, 열2, ...) VALUES (값1, 값2, ...);  -- 열 목록 생략 시 전체 열 순서대로
UPDATE 테이블 SET 열 = 값 WHERE 조건;
DELETE FROM 테이블 WHERE 조건;
```

📌 **반드시 암기 — WHERE를 빼면 전체가 대상**: `UPDATE ... SET 성적 = 0;`은 **모든 행**의 성적을 0으로, `DELETE FROM ENROLL;`은 **모든 행** 삭제. 에러가 나지 않는 것이 이 함정의 무서움입니다.

⚖️ **혼동 비교 — DELETE vs TRUNCATE vs DROP (빈출 3종 비교)**

| 구분 | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| 분류 | **DML** | **DDL** | **DDL** |
| 지우는 것 | 행 (WHERE로 일부 가능) | 전체 행 (조건 불가) | **테이블 구조째** |
| ROLLBACK | **가능** | 불가(원칙) | 불가(원칙) |
| 속도 | 행마다 기록해 상대적으로 느림 | 빠름 | — |

### 3-4. DCL — 권한을 주고 뺏는다

📌 **반드시 암기 (작성형 출제)**

```sql
GRANT SELECT, UPDATE ON STUDENT TO KIM;          -- 부여
GRANT SELECT ON STUDENT TO KIM WITH GRANT OPTION; -- KIM이 남에게 재부여도 가능
REVOKE UPDATE ON STUDENT FROM KIM;                -- 회수
```

- 어순 함정: GRANT는 `TO`, REVOKE는 `FROM`. `WITH GRANT OPTION`(재부여 권한)과 회수 시 `CASCADE`(재부여분까지 연쇄 회수)가 단답 소재입니다.
- ⚖️ SQLite는 단일 파일 DB라 GRANT/REVOKE가 **없습니다** — 이 부분만은 손코딩으로 연습합니다.

### 3-5. TCL과 트랜잭션

**트랜잭션(transaction)** 은 "하나로 취급해야 하는 작업 묶음"입니다 — 계좌 이체(출금+입금)는 반쪽만 실행되면 안 됩니다.

📌 **반드시 암기 — ACID 4성질** (이름과 뜻 모두)

| 성질 | 뜻 |
|---|---|
| **원자성 (Atomicity)** | 전부 실행되거나 전부 취소된다 (All or Nothing) |
| **일관성 (Consistency)** | 실행 전후에 DB는 모순 없는 상태를 유지한다 |
| **고립성 (Isolation)** | 실행 중인 트랜잭션에 다른 트랜잭션이 끼어들 수 없다 |
| **지속성 (Durability)** | COMMIT된 결과는 장애가 나도 영구 보존된다 |

| 명령 | 뜻 |
|---|---|
| `COMMIT` | 지금까지의 변경을 **확정** (되돌릴 수 없음) |
| `ROLLBACK` | 마지막 COMMIT 시점으로 **취소** |
| `SAVEPOINT 이름` | 부분 취소 지점 표시 — `ROLLBACK TO 이름` |

### 3-6. 인덱스와 뷰

| 객체 | 정의 | 장점 | 단점·제약 (📌 단답 포인트) |
|---|---|---|---|
| **인덱스** | 검색 속도를 높이는 별도 자료구조 (책의 색인) — `CREATE INDEX 이름 ON 테이블(열);` | 조회(SELECT) 빠름 | 저장 공간 추가, **삽입·수정·삭제는 느려짐** (색인도 고쳐야 하므로) |
| **뷰** | SELECT 결과를 이름 붙여 저장한 **가상 테이블** — `CREATE VIEW 이름 AS SELECT ...;` | 보안(일부만 노출), 편리성, 논리적 독립성 | 물리적 저장 없음, 인덱스 불가(원칙), **ALTER VIEW로 정의 변경 불가 → DROP 후 재생성**, 뷰 통한 갱신 제한 |

### 3-7. 이상현상과 정규화

**이상현상(anomaly)** — 한 테이블에 너무 많은 정보를 뭉쳐 두면 생기는 부작용 3종: **삽입 이상**(불필요한 값 없이는 못 넣음), **갱신 이상**(같은 정보를 여러 곳에서 고쳐야 해 불일치 발생), **삭제 이상**(행 하나 지우다 무관한 정보까지 소실). **정규화(normalization)** 는 이를 없애려 테이블을 나누는 절차입니다.

📌 **반드시 암기 — 정규화 단계 (두문자: 도·부·이·결·다·조)**

| 정규형 | 제거(만족) 조건 | 두문자 |
|---|---|---|
| 1NF | 모든 속성이 원자값 (**도**메인이 원자값) | 도 |
| 2NF | **부**분 함수 종속 제거 (복합키의 일부에만 종속되는 속성 분리) | 부 |
| 3NF | **이**행 함수 종속 제거 (A→B→C 사슬 분리) | 이 |
| BCNF | 모든 **결**정자가 후보키 | 결 |
| 4NF / 5NF | **다**치 종속 / **조**인 종속 제거 | 다·조 (이름만 알면 충분 — 출제 빈도 낮아 축소) |

판정 감각: (학번, 과목코드)가 기본키인 테이블에서 `과목코드 → 과목명`처럼 **키의 일부**가 결정하면 부분 종속(2NF 위반), `학번 → 학과 → 학과전화`처럼 **징검다리로** 결정되면 이행 종속(3NF 위반). 우리가 07강에서 COURSE(과목명)와 DEPT(위치)를 따로 만든 것이 바로 이 정규화의 결과입니다.

### 3-8. 관계대수 — 기호 독해

**관계대수(relational algebra)** 는 릴레이션에서 원하는 데이터를 얻는 절차를 기호로 쓴 언어입니다.

📌 **반드시 암기 (기호·이름·SQL 대응)**

| 기호 | 이름 | 역할 | SQL 대응 |
|---|---|---|---|
| **σ** (시그마) | Select (셀렉트) | 조건에 맞는 **행**(튜플) 선택 | **WHERE** |
| **π** (파이) | Project (프로젝트) | 지정한 **열**(속성)만 추출 | **SELECT 절** |
| **⋈** | Join (조인) | 공통 속성으로 두 릴레이션 결합 | JOIN |
| **÷** | Division (디비전) | B의 모든 값을 가진 A의 튜플 선택 | (직접 대응 없음) |
| ∪ ∩ − × | 합·교·차집합·카티션 곱 | 집합 연산 | UNION·INTERSECT·EXCEPT·CROSS JOIN |

⚖️ **최빈출 혼동**: 관계대수의 **σ(Select)는 SQL의 SELECT 절이 아니라 WHERE에 대응**합니다(행 고르기). SQL의 SELECT 절(열 고르기)에 대응하는 것은 **π**입니다. 예: `π 이름, 학년 (σ 학년=2 (STUDENT))` = `SELECT 이름, 학년 FROM STUDENT WHERE 학년 = 2;`

---

## ④ 단계별 실습

### Step 1. 🔁 복습 퀴즈 (09강 범위 · 5문항 · 10분)

1. STUDENT(5행)와 DEPT(3행)의 카티션 곱은 몇 행인가?
2. LEFT JOIN에서 짝이 없는 행의 오른쪽 열 값은?
3. 다중행 서브쿼리에 쓸 수 있는 연산자 4개는?
4. UNION과 UNION ALL의 차이는?
5. 서브쿼리가 있는 질의의 해석 순서는?

<details>
<summary>정답</summary>

1. 15행 2. NULL 3. IN, ANY, ALL, EXISTS 4. UNION은 중복 제거, UNION ALL은 유지 5. 안쪽(서브쿼리) → 바깥쪽

</details>

### Step 2. DDL — 열 추가와 제약조건 있는 테이블

**난이도: 🟡 기본 · 학습 개념: ALTER ADD, CHECK·DEFAULT**

```sql
ALTER TABLE STUDENT ADD 이메일 VARCHAR(30);

CREATE TABLE GRADE_RULE (
    등급   CHAR(1) PRIMARY KEY,
    하한   INT NOT NULL CHECK (하한 BETWEEN 0 AND 100),
    비고   VARCHAR(20) DEFAULT '자동등록'
);
INSERT INTO GRADE_RULE (등급, 하한) VALUES ('A', 90);
SELECT * FROM GRADE_RULE;
```

```
$ sqlite3 school.db
sqlite> SELECT 이름, 이메일 FROM STUDENT WHERE 학번 = 1001;
김하늘|
sqlite> SELECT * FROM GRADE_RULE;
A|90|자동등록
```

실행 원리: ALTER로 추가된 이메일 열은 기존 행에서 NULL(빈 출력)입니다. INSERT에서 비고를 생략하자 **DEFAULT '자동등록'** 이 채워졌습니다. `CHECK`에 어긋나는 값(예: 하한 200)을 넣으면 어떻게 되는지는 ⑤에서 확인합니다.

### Step 3. DML — 넣고, 고치고, 지우기 (트랜잭션 안에서)

**난이도: 🟡 기본 · 학습 개념: INSERT·UPDATE·DELETE, WHERE의 무게**

원본 데이터를 지키기 위해 Step 4의 트랜잭션으로 감싸고 마지막에 되돌립니다.

```sql
BEGIN;

INSERT INTO STUDENT (학번, 이름, 학년, 학과코드) VALUES (1006, '한지민', 1, 'D3');
UPDATE ENROLL SET 성적 = 88 WHERE 학번 = 1004 AND 과목코드 = 'C3';
DELETE FROM ENROLL WHERE 학번 = 1002 AND 과목코드 = 'C1';

SELECT COUNT(*) FROM STUDENT;                            -- 6
SELECT 성적 FROM ENROLL WHERE 학번 = 1004;               -- 88
SELECT COUNT(*) FROM ENROLL;                             -- 5
```

실행 원리: UPDATE·DELETE의 WHERE가 **복합 조건(학번+과목코드)** 인 이유 — ENROLL의 기본키가 복합키라서 한 행을 집으려면 둘 다 필요합니다. `WHERE 학번 = 1004`만 쓰면 그 학생의 **모든** 수강 행이 바뀝니다.

### Step 4. TCL — ROLLBACK으로 되돌리기

**난이도: 🟡 기본 · 학습 개념: 트랜잭션 경계, ROLLBACK**

```sql
ROLLBACK;

SELECT COUNT(*) FROM STUDENT;   -- 5  (한지민 삽입 취소)
SELECT 성적 FROM ENROLL WHERE 학번 = 1004;   -- (NULL — 88이 취소됨)
SELECT COUNT(*) FROM ENROLL;    -- 6  (삭제 취소)
```

```
sqlite> ROLLBACK;
sqlite> SELECT COUNT(*) FROM STUDENT;
5
sqlite> SELECT COUNT(*) FROM ENROLL;
6
```

실행 원리: BEGIN~ROLLBACK 사이의 세 DML이 **한 묶음으로 전부 취소**되었습니다 — 이것이 원자성(A)입니다. ROLLBACK 대신 COMMIT을 쳤다면 전부 확정되어 되돌릴 수 없습니다. "COMMIT 이후 ROLLBACK하면?"의 답은 "이미 확정되어 소용없다"입니다.

### Step 5. DCL — 손코딩 연습 (SQLite 미지원)

**난이도: 🟡 기본 · 학습 개념: GRANT·REVOKE 어순**

> 문제: 사용자 KIM에게 STUDENT 테이블의 조회·수정 권한을 부여하고, 그중 수정 권한만 회수하는 SQL을 쓰시오.

```sql
GRANT SELECT, UPDATE ON STUDENT TO KIM;
REVOKE UPDATE ON STUDENT FROM KIM;
```

어순 점검 — GRANT 권한 ON 대상 **TO** 사람 / REVOKE 권한 ON 대상 **FROM** 사람. "부여받은 권한을 다른 사용자에게 다시 부여할 수 있게" 하려면 끝에 `WITH GRANT OPTION`을 붙입니다(빈칸 단골).

### Step 6. 뷰 만들기와 정규화 판정

**난이도: 🟡 기본 · 학습 개념: CREATE VIEW, 가상 테이블**

```sql
CREATE VIEW V_고득점 AS
SELECT 학번, 과목코드, 성적 FROM ENROLL WHERE 성적 >= 85;

SELECT * FROM V_고득점;
```

| 학번 | 과목코드 | 성적 |
|---|---|---|
| 1001 | C1 | 90 |
| 1001 | C2 | 85 |
| 1003 | C1 | 95 |

뷰는 질의를 저장한 창문이라, 원본(ENROLL)이 바뀌면 뷰 결과도 따라 바뀝니다.

**난이도: 🔴 심화(판정 훈련) · 학습 개념: 부분·이행 종속 찾기**

> 다음 릴레이션의 기본키는 (학번, 과목코드)이다. 어떤 정규형 위반이 있는지 찾아보자.
> **수강내역(학번, 과목코드, 성적, 과목명, 학과코드, 학과전화)** — 단, 과목코드→과목명, 학번→학과코드, 학과코드→학과전화

| 종속 | 판정 | 이유 |
|---|---|---|
| (학번, 과목코드) → 성적 | 정상 | 키 전체가 결정 |
| 과목코드 → 과목명 | **부분 종속 (2NF 위반)** | 키의 **일부**만으로 결정 |
| 학번 → 학과코드 | **부분 종속 (2NF 위반)** | 키의 일부만으로 결정 |
| 학과코드 → 학과전화 | **이행 종속 (3NF 위반)** | 학번→학과코드→학과전화의 징검다리 |

해결이 곧 우리 스키마입니다: 과목명은 COURSE로, 학과 정보는 STUDENT와 DEPT로 분리 — **정규화의 결과가 4개 테이블**이고, 그래서 9강의 JOIN이 필요해진 것입니다. (정규화와 조인은 동전의 양면)

---

## ⑤ 자주 하는 실수

| 에러/증상 원문 | 원인 | 해결 |
|---|---|---|
| `Parse error: table STUDENT has 5 columns but 4 values were supplied` | 열 목록 생략 INSERT에서 값 개수 불일치 (Step 2에서 이메일 열이 늘어난 상태) | 열 목록 명시 습관: `INSERT INTO 테이블 (열, ...) VALUES (...)` |
| 에러 없이 전체 행이 바뀜/지워짐 | UPDATE·DELETE의 **WHERE 누락** | 실행 전 같은 조건으로 SELECT 해 보기 — 시험에서는 "이 문장의 문제점" 서술형 소재 |
| `Runtime error: UNIQUE constraint failed: STUDENT.학번` | 기본키 중복 삽입 (1001 재삽입) | 개체 무결성 위반 — 에러 메시지와 무결성 이름을 짝지어 암기 |
| `Runtime error: FOREIGN KEY constraint failed` | 없는 학과코드('D9')로 삽입 등 참조 무결성 위반 | ⚖️ SQLite는 `PRAGMA foreign_keys = ON;`을 켜야 검사함 — 자습 시 주의 |
| `Runtime error: CHECK constraint failed: 하한 BETWEEN 0 AND 100` | CHECK 범위 밖 값 (하한 200) | 도메인 무결성 위반 사례로 기억 |
| TRUNCATE를 DML로 분류 | "행을 지우니까 조작"이라는 직관 | TRUNCATE는 **DDL** — ROLLBACK 불가와 함께 묶어 암기 (3-3 비교표) |
| `REVOKE ... TO KIM` | GRANT의 TO를 그대로 복사 | 회수는 **FROM** — 어순 오답 포인트 |
| COMMIT 후 ROLLBACK이 안 먹힘 | COMMIT은 확정 — 취소 대상이 없음 | ROLLBACK은 "마지막 COMMIT 이후"만 되돌림 |
| 뷰를 ALTER VIEW로 고치려 함 | 뷰는 정의 변경 불가(원칙) | **DROP VIEW 후 재생성** — 단답 빈출 |

---

## ⑥ 확인 문제

1. [분류] 다음 명령을 DDL·DML·DCL·TCL로 분류하시오. → `ROLLBACK, CREATE, GRANT, UPDATE, TRUNCATE, COMMIT`
2. [SQL 작성] 사용자 LEE에게 ENROLL 테이블의 SELECT 권한을, 재부여 권한까지 포함해 부여하는 SQL을 쓰시오.
3. [판정] 기본키가 (사번, 프로젝트코드)인 릴레이션에서 `프로젝트코드 → 프로젝트명` 종속이 존재한다. 위반되는 정규형과 그 이유, 해결 방법을 쓰시오.

<details>
<summary>정답과 해설</summary>

1. **DDL: CREATE, TRUNCATE / DML: UPDATE / DCL: GRANT / TCL: ROLLBACK, COMMIT**
   - 대표 오답: TRUNCATE를 DML로 — 행을 지우지만 구조 초기화 명령으로 **DDL**이며 ROLLBACK 불가입니다.
2. `GRANT SELECT ON ENROLL TO LEE WITH GRANT OPTION;`
   - 대표 오답: `WITH GRANT OPTION` 누락(재부여 요구 미충족), `TO` 대신 `FOR`/`FROM`.
3. **2NF 위반 (부분 함수 종속)** — 프로젝트명이 복합키의 **일부**(프로젝트코드)만으로 결정되기 때문. 해결: 프로젝트(프로젝트코드, 프로젝트명) 릴레이션을 **분리**하고 원 릴레이션에는 프로젝트코드만 남긴다(외래키).
   - 대표 오답: 3NF 위반 — 이행 종속(A→B→C 사슬)과 부분 종속(키 일부가 결정)을 혼동한 경우. "키의 일부면 부분, 징검다리면 이행"으로 구분하세요.

</details>

---

## 마무리

**오늘의 요약** — SQL 지도는 정의(DDL: CREATE·ALTER·DROP·TRUNCATE)·조작(DML: SELECT·INSERT·UPDATE·DELETE)·제어(DCL: GRANT TO·REVOKE FROM)·트랜잭션(TCL: COMMIT·ROLLBACK·SAVEPOINT)의 4구역입니다. WHERE 없는 UPDATE/DELETE는 전체를 바꾸고, DELETE(DML·복구 가능)/TRUNCATE(DDL·불가)/DROP(구조째)이 3종 비교로 나옵니다. 트랜잭션은 ACID(원자·일관·고립·지속), 인덱스는 조회↑·갱신↓, 뷰는 가상 테이블(ALTER 불가). 정규화는 도·부·이·결(+다·조), 관계대수는 σ=WHERE(행)·π=SELECT 절(열)·⋈=JOIN입니다. 이것으로 3단원(SQL·DB)이 완성되었습니다.

**복습 체크리스트**

- [ ] 4분류 표를 명령까지 안 보고 재현할 수 있다
- [ ] DELETE/TRUNCATE/DROP 비교표를 재현할 수 있다
- [ ] Step 3~4에서 ROLLBACK 후 세 값(5·NULL·6)이 되돌아온 이유를 ACID와 연결해 설명할 수 있다
- [ ] "도부이결"의 각 글자가 뜻하는 정규형 조건을 말할 수 있다
- [ ] σ와 π 중 SQL의 WHERE에 대응하는 것을 즉답할 수 있다

**과제 — 5주차 형성평가 (10문항, 11강 첫 복습 퀴즈와 연동)**

1. 빈칸: `INSERT ______ STUDENT (학번, 이름, 학년) ______ (1007, '오세훈', 1);`
2. SQL 작성: 김하늘(학번 1001)의 학년을 2로 변경하는 UPDATE 문을 쓰시오.
3. DELETE와 TRUNCATE의 차이를 분류와 ROLLBACK 가능 여부로 쓰시오.
4. 빈칸: `______ SELECT ON STUDENT ______ PARK;` (PARK에게 조회 권한 부여)
5. 트랜잭션을 마지막 COMMIT 시점으로 되돌리는 명령은?
6. ACID 4성질의 이름을 모두 쓰시오.
7. SELECT 결과를 이름 붙여 저장한 가상 테이블을 무엇이라 하는가?
8. 부분 함수 종속을 제거하면 몇 정규형이 되는가?
9. 관계대수에서 σ의 이름과 역할(행/열)을 쓰시오.
10. LEFT JOIN에서 짝이 없는 행의 반대쪽 열에 채워지는 값은? (09강 누적)

<details>
<summary>형성평가 정답</summary>

| 번호 | 정답 | 측정 개념 |
|---|---|---|
| 1 | `INTO`, `VALUES` | INSERT 구문 |
| 2 | `UPDATE STUDENT SET 학년 = 2 WHERE 학번 = 1001;` | UPDATE 작성 (WHERE 필수) |
| 3 | DELETE는 DML·ROLLBACK 가능, TRUNCATE는 DDL·ROLLBACK 불가 | 3종 비교 |
| 4 | `GRANT`, `TO` | DCL 어순 |
| 5 | `ROLLBACK` | TCL |
| 6 | 원자성, 일관성, 고립성, 지속성 | ACID |
| 7 | 뷰(VIEW) | 가상 테이블 |
| 8 | 제2정규형(2NF) | 정규화 단계 |
| 9 | Select(셀렉트) — 조건에 맞는 **행** 선택 (WHERE 대응) | 관계대수 |
| 10 | NULL | OUTER JOIN (누적 복습) |

</details>

**다음 강 예고** — 11강부터 4단원(핵심 이론)입니다. SW 공학 계열 — 요구사항·UML·디자인 패턴·테스트·결합도/응집도 — 을 "설명을 주면 용어를 쓰는" 시험 형태 그대로 훈련합니다. 코드·SQL 복습 퀴즈는 계속됩니다.

---

> [← 이전 09강](lesson-09.md) · [목차](README.md) · [다음 → 11강 SW 공학·테스트·UML·디자인 패턴](../04-core-theory/lesson-11.md)
