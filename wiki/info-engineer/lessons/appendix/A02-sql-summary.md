# A2 · SQL 핵심 문법 요약표

> [부록 목차](README.md) · 근거 강: [07](../03-database/lesson-07.md)~[10](../03-database/lesson-10.md)강 · 예제는 [공용 스키마](../03-database/lesson-07.md) 기준

## 1. SELECT 뼈대와 실행 순서

```sql
SELECT [DISTINCT] 열, 집계함수 [AS 별칭]   -- ⑤
FROM   테이블 [별칭]                        -- ①
[JOIN  테이블 ON 조건]                      -- ①
WHERE  행 조건                              -- ②
GROUP BY 열                                 -- ③
HAVING 그룹 조건                            -- ④
ORDER BY 열 [ASC|DESC];                     -- ⑥
```

📌 실행 순서: **FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY**

## 2. WHERE 도구

| 도구 | 형태 | 주의 |
|---|---|---|
| 비교 | `= <> < <= > >=` | 표준 "같지 않다"는 `<>` |
| LIKE | `이름 LIKE '김%'` | `%` 0글자 이상 / `_` 정확히 1글자 |
| BETWEEN | `BETWEEN 80 AND 90` | **양 끝 포함** |
| IN | `학년 IN (1, 3)` | OR의 줄임 |
| NULL | `IS NULL / IS NOT NULL` | **`= NULL`은 항상 0행** |

## 3. 집계·그룹

| 함수 | NULL 처리 |
|---|---|
| `COUNT(*)` | **NULL 포함** 행 수 |
| `COUNT(열)`·`SUM`·`AVG`·`MAX`·`MIN` | **NULL 제외** (AVG 분모 = COUNT(열)) |

- "~별" → `GROUP BY`, 그룹 조건 → `HAVING` (WHERE는 집계 함수 불가)
- GROUP BY 사용 시 SELECT에는 기준 열 + 집계 함수만

## 4. JOIN·서브쿼리·집합

| 패턴 | 템플릿 |
|---|---|
| INNER | `FROM A JOIN B ON A.키 = B.키` — 짝 있는 행만 |
| LEFT | `FROM A LEFT JOIN B ON ...` — A 전원 + 빈자리 NULL |
| LEFT+개수 | `COUNT(B.열)` 로 세야 0 (COUNT(*)는 1) |
| 카티션 곱 | 조건 없는 조인 = m × n 행 |
| 단일행 서브쿼리 | `WHERE 성적 = (SELECT MAX(성적) ...)` |
| 다중행 서브쿼리 | `WHERE 학번 IN (SELECT ...)` / `ANY` / `ALL` / `[NOT] EXISTS` |
| NOT IN 함정 | 서브쿼리에 NULL 있으면 0행 → NOT EXISTS 권장 |
| 집합 | `UNION`(중복 제거) / `UNION ALL`(유지) / `INTERSECT` / `EXCEPT`(Oracle MINUS) |

## 5. DDL·DML·DCL·TCL

| 분류 | 명령 | 핵심 템플릿 |
|---|---|---|
| DDL | CREATE·ALTER·DROP·TRUNCATE | `CREATE TABLE T (열 자료형 PRIMARY KEY / NOT NULL / UNIQUE / CHECK(...) / DEFAULT 값, FOREIGN KEY (열) REFERENCES 부모(열));` · `ALTER TABLE T ADD/MODIFY/DROP COLUMN 열` · `DROP TABLE T [CASCADE]` |
| DML | SELECT·INSERT·UPDATE·DELETE | `INSERT INTO T (열들) VALUES (값들);` · `UPDATE T SET 열=값 WHERE ...;` · `DELETE FROM T WHERE ...;` — **WHERE 없으면 전체** |
| DCL | GRANT·REVOKE | `GRANT SELECT, UPDATE ON T TO 사용자 [WITH GRANT OPTION];` · `REVOKE ... ON T FROM 사용자;` |
| TCL | COMMIT·ROLLBACK·SAVEPOINT | `SAVEPOINT p;` → `ROLLBACK TO p;` |

⚖️ DELETE(DML·ROLLBACK 가능) / TRUNCATE(DDL·불가) / DROP(구조째·DDL)

## 6. 뷰·인덱스

```sql
CREATE VIEW V AS SELECT ... ;   -- 가상 테이블, 정의 변경은 DROP 후 재생성
CREATE INDEX idx ON T(열);      -- 조회↑ / 저장 공간·갱신 비용↑
```

## 7. 작성형 판정 요령

| 지문 신호 | 키워드 |
|---|---|
| "~별" | GROUP BY |
| "그룹/평균/인원이 ~ 이상인 것만" | HAVING |
| "중복 없이" | DISTINCT |
| "포함하여 (없는 것도)" | LEFT JOIN |
| "~한 학생의 이름" (두 테이블) | JOIN 또는 IN 서브쿼리 |
| "가장 큰/작은" | 단일행 서브쿼리 (MAX/MIN) |
| "높은 순/최근 순" | ORDER BY … DESC |
