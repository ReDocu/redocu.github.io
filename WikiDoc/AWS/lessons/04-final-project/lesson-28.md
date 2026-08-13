# 28강 · 스프린트 2 — 애플리케이션·CI/CD

> **AWS 학습 매뉴얼** · 🔴 대단원 04 · **28강 / 총 32강** · 🏁 **M2 배포 완료**
> [← 이전 27강](lesson-27.md) · [목차](README.md) · [다음 → 29강 관측성과 부하 검증](lesson-29.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 애플리케이션을 이미지로 만들어 **파이프라인으로 배포**할 수 있다.
- app 스택을 network·data 스택과 **연결**해 3계층을 완성할 수 있다.
- HTTPS·시크릿·암호화가 **실제로 적용된 상태로** 엔드포인트를 공개할 수 있다.
- 배포 후 **스모크 테스트**로 검증하고 코드 변경을 무중단 반영할 수 있다.
- **M2** — 서비스가 `https://` 로 열리고 push로 배포되는 상태를 달성한다.

---

## ② 왜 필요한가

27강에서 네트워크와 데이터를 세웠습니다. 아직 **사용자가 접속할 무언가**가 없습니다.

```
 27강까지:  [VPC] [프라이빗 RDS]        ← 아무도 못 씀
 오늘:      [VPC] [RDS] [ALB→ECS 앱]    ← https://로 열림
                          │
              24강 파이프라인이 이 층을 배포
```

우리는 24강에서 이미 **push 한 번으로 배포되는 파이프라인**을 만들었습니다. 오늘은 그 파이프라인이 배포하는 **app 스택을 실제 서비스로** 완성합니다 — 신청 기능이 있고, DB에 쓰고, HTTPS로 열리는.

이번 주 관문 **M2** — "서비스가 배포되어 도메인으로 열리고, 인프라와 코드가 저장소에 있으며, `git push` 로 갱신된다." 이것이 되면 다음 주 검증(W15)의 대상이 생깁니다.

24강과 다른 점은 하나 — 이번엔 **진짜 데이터 계층에 연결**됩니다. 24강 앱은 자기 정보만 보여 줬지만, 오늘 앱은 27강 RDS에 신청을 기록합니다.

---

## ③ 워크숍 가이드 — 앱 배포와 파이프라인 연결

### 무중단 배포 점검표

[11강](../02-compute-data/lesson-11.md)·[21강](../03-serverless-automation/lesson-21.md)에서 배운 것을 M2 기준으로 정리합니다.

| 설정 | 값 | 역할 |
|---|---|---|
| 헬스 체크 경로 | `/health` (DB 의존 없이 가볍게) | 준비된 태스크만 트래픽 |
| MinimumHealthyPercent | 100 | 배포 중 용량 유지 |
| 등록 취소 지연 | 30~60초 | 진행 중 요청 완료 |
| 배포 서킷 브레이커 | Enable + Rollback | 실패 시 자동 롤백 |
| 헬스 체크 유예 | 60초 | 부팅 중 오판 방지 |

> ⚠️ **헬스 체크에 DB 조회를 넣지 마세요.** DB가 잠깐 느리면 모든 태스크가 한꺼번에 비정상 판정되어 서비스 전체가 무너집니다. `/health` 는 "이 프로세스가 살아 있나"만 봅니다.

### 스택 3층 연결 구조

```
 course-network (Export: VpcId, PublicSubnets, AppSubnets, WebSg, AppSg, DbSg)
       │ ImportValue
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
 course-data      course-app (오늘 완성)
 (Export:          ├─ ALB (PublicSubnets, WebSg)
  DbEndpoint) ────▶├─ ECS 서비스 (AppSubnets, AppSg)
                   │    └─ 태스크: DB_ENDPOINT 환경변수 = data의 Export
                   │            시크릿 = Secrets Manager
                   └─ 443 리스너 (ACM 인증서)
```

### 시크릿·DB 연결을 앱에 전달하는 법

앱이 DB에 접속하려면 **엔드포인트 + 자격 증명**이 필요합니다. 둘 다 코드에 넣지 않습니다.

| 값 | 전달 방법 |
|---|---|
| DB 엔드포인트 | data 스택 Export → app 태스크 환경변수 |
| DB 자격 증명 | Secrets Manager → 태스크가 런타임에 조회(태스크 역할 권한) |

> 📌 태스크 정의의 `Secrets` 필드로 Secrets Manager 값을 환경변수에 주입할 수도 있습니다 — 이때 **실행 역할**에 시크릿·KMS 권한이 필요합니다([21강](../03-serverless-automation/lesson-21.md) 역할 구분).

### HTTPS 마무리

[12강](../02-compute-data/lesson-12.md)에서 만든 도메인·ACM 인증서(과정 내내 유지)를 app 스택에 붙입니다.

```
 사용자 ─https─▶ Route 53 Alias ─▶ ALB :443(ACM) ─▶ 대상 그룹 ─▶ ECS 태스크
                                    :80 → 301 리다이렉트
```

### 스키마 마이그레이션 — 어디서 하나

[16강](../02-compute-data/lesson-16.md)에서 여러 태스크가 동시에 `CREATE TABLE` 하다 충돌했습니다. 실무 정답:

| 방법 | 평가 |
|---|---|
| 태스크 부팅 시(각자) | ❌ 동시 실행 충돌·중복 |
| **파이프라인의 별도 단계** | ✅ 배포 전 한 번만 |
| `IF NOT EXISTS` + 멱등 | 차선(실습 허용) |

> 이 프로젝트는 실습 규모상 `IF NOT EXISTS` 멱등 방식을 허용하되, **"실무는 마이그레이션 전용 단계"** 라는 것을 문서에 명시합니다.

---

## ④ 스프린트 작업 — 앱 배포로 M2 달성

> 💰 **예상 비용 $0.5 ~ 1.0/팀·주** — ALB·Fargate·RDS. **작업 후 app 스택 삭제 or ECS 0 + RDS 중지.**
> 27강 network·data 스택, 24강 파이프라인·저장소가 전제입니다.

### Step 1. 애플리케이션 작성 (애플리케이션, 30분)

24강 앱을 확장해 **DB에 신청을 기록**합니다. `app/app.py`:

```python
import json, os, urllib.request, pymysql, boto3
from http.server import HTTPServer, BaseHTTPRequestHandler

# 초기화(핸들러 밖 = 재사용)
DB_HOST = os.environ["DB_ENDPOINT"]
sm = boto3.client("secretsmanager")
cred = json.loads(sm.get_secret_value(SecretId=os.environ["SECRET_NAME"])["SecretString"])

def db():
    return pymysql.connect(host=DB_HOST, user=cred["username"],
                           password=cred["password"], database="eventapp",
                           connect_timeout=3, autocommit=True)

def init_schema():
    with db() as c, c.cursor() as cur:
        cur.execute("""CREATE TABLE IF NOT EXISTS signups(
          id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")

class H(BaseHTTPRequestHandler):
    def _send(self, code, body):
        b = json.dumps(body, ensure_ascii=False, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/health"):
            self.send_response(200); self.send_header("Content-Length","2")
            self.end_headers(); self.wfile.write(b"OK"); return
        with db() as c, c.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM signups")
            cnt = cur.fetchone()[0]
        self._send(200, {"service": "event-signup", "total": cnt,
                         "version": os.environ.get("APP_VERSION", "v1")})

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(n) or "{}")
        except json.JSONDecodeError:
            return self._send(400, {"error": "invalid json"})
        if not data.get("name"):
            return self._send(400, {"error": "name required"})
        with db() as c, c.cursor() as cur:
            cur.execute("INSERT INTO signups(name) VALUES(%s)", (data["name"],))
        return self._send(201, {"registered": data["name"]})

    def log_message(self, *a): pass

init_schema()
print("listening :8080")
HTTPServer(("", 8080), H).serve_forever()
```

`app/Dockerfile`:

```dockerfile
FROM public.ecr.aws/docker/library/python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir pymysql boto3
COPY app.py .
ENV APP_VERSION=v1
EXPOSE 8080
USER nobody
CMD ["python", "-u", "app.py"]
```

### Step 2. app.yaml 보강 — DB 연결·HTTPS (인프라, 30분)

24강 `infra/app.yaml` 에 환경변수·시크릿 권한·443 리스너를 추가합니다. 핵심 변경:

**태스크 정의 컨테이너에 환경변수·시크릿:**

```yaml
      ContainerDefinitions:
        - Name: app
          Image: !Sub "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/course-app:${ImageTag}"
          Environment:
            - Name: DB_ENDPOINT
              Value: {"Fn::ImportValue": course-data-DbEndpoint}
            - Name: SECRET_NAME
              Value: course/final/db
          PortMappings: [{ContainerPort: 8080}]
          LogConfiguration: { ... }
```

**태스크 역할에 시크릿·KMS 권한** (별도 정책 리소스 또는 25강 역할표대로):

```yaml
  TaskRolePolicy:
    Type: AWS::IAM::RolePolicy
    Properties:
      RoleName: course-ecs-task-role
      PolicyName: read-db-secret
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Action: secretsmanager:GetSecretValue
            Resource: !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:course/final/db-*"
          - Effect: Allow
            Action: kms:Decrypt
            Resource: "*"    # 실습. 운영은 키 ARN으로 좁힘
```

**443 리스너 + HTTP 리다이렉트** (ACM 인증서 파라미터 추가):

```yaml
  HttpsListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref Alb
      Protocol: HTTPS
      Port: 443
      Certificates: [{CertificateArn: !Ref CertArn}]
      SslPolicy: ELBSecurityPolicy-TLS13-1-2-2021-06
      DefaultActions: [{Type: forward, TargetGroupArn: !Ref Tg}]
  HttpRedirect:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref Alb
      Protocol: HTTP
      Port: 80
      DefaultActions:
        - Type: redirect
          RedirectConfig: {Protocol: HTTPS, Port: "443", StatusCode: HTTP_301}
```

> 📌 DB 접근을 위해 ECS 태스크는 **AppSubnets(프라이빗)** 에 있어야 하고, DbSg가 AppSg를 소스로 3306을 허용해야 합니다(27강 구성). 태스크가 시크릿·ECR을 읽으려면 **NAT 또는 엔드포인트** 경로가 필요합니다.

### Step 3. 파이프라인 확장 (인프라, 20분)

`.github/workflows/deploy.yml` 에 data 스택 배포와 파라미터를 추가합니다.

```yaml
      - name: 데이터 스택 배포
        run: |
          aws cloudformation deploy --stack-name course-data \
            --template-file infra/data.yaml \
            --parameter-overrides SecretArn=${{ secrets.NONE || '' }}... \
            --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM

      - name: 앱 스택 배포
        run: |
          aws cloudformation deploy --stack-name course-app \
            --template-file infra/app.yaml \
            --parameter-overrides ImageTag=${{ github.sha }} CertArn=${{ vars.CERT_ARN }} \
            --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
```

> 📌 IAM 리소스(TaskRolePolicy)가 있으므로 **`--capabilities CAPABILITY_NAMED_IAM`** 필수([23강](../03-serverless-automation/lesson-23.md)). 인증서 ARN 같은 값은 GitHub 저장소 변수(`vars`)로 전달 — 비밀이 아니므로 secrets 아님.

### Step 4. 🚀 배포 (전체, 20분)

```bash
$ cd course-deploy
$ git add -A
$ git commit -m "feat: M2 - 신청 앱 + DB 연결 + HTTPS"
$ git push origin main
```

Actions에서 전 단계 초록불을 확인합니다. 스모크 테스트까지 통과하면 M2 배포 성공입니다.

**로컬 검증**

```bash
$ DOMAIN=app.<팀도메인>
$ curl -sI https://$DOMAIN/ | head -1
HTTP/2 200

# 신청 → 조회
$ curl -s -X POST https://$DOMAIN/ -d '{"name":"홍길동"}'
{"registered": "홍길동"}
$ curl -s https://$DOMAIN/ | jq '{total, version}'
{ "total": 1, "version": "v1" }

# HTTP 리다이렉트
$ curl -sI http://$DOMAIN/ | grep -i location
location: https://app.<팀도메인>:443/
```

> ✅ **M2 핵심 달성** — HTTPS로 열리고, DB에 쓰고, push로 배포됩니다.

### Step 5. 무중단 변경 확인 (애플리케이션, 15분)

```bash
$ sed -i 's/"APP_VERSION", "v1"/"APP_VERSION", "v2"/' app/app.py
$ git commit -am "feat: v2" && git push

# 배포 중 요청 루프 (다른 터미널)
$ while true; do
    printf "%s " "$(date +%T)"
    curl -s -m 3 https://$DOMAIN/ | jq -r .version 2>/dev/null || echo FAIL
    sleep 2
  done
# v1 ... v1 v2 v1 v2 ... v2  (FAIL 없이 전환)
```

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 작업(6h) | 상시 월 |
|---|---|---|---|
| **ALB** | ❌ | 약 $0.14 | 🔴 $16.4 |
| **Fargate 2태스크** | ❌ | 약 $0.19 | 🔴 $18~22 |
| **RDS Multi-AZ** | ❌ | 약 $0.32 | 🔴 $38 |
| NAT/엔드포인트 | ❌ | $0.08~0.36 | $28~42 |
| Route 53·ACM·KMS·Secrets | 부분 | ~$0.02 | ~$2.3 |
| **합계(팀·주)** | | **약 $0.9** | 상시 시 **$100+** 🔴 |

> 🔴 **작업 종료 시 반드시**: `aws cloudformation delete-stack --stack-name course-app`(ALB·Fargate 소멸) + RDS 중지. app 스택은 push로 언제든 부활합니다.

### 🧹 리소스 정리 체크리스트

```bash
# app 스택 삭제 (ALB·Fargate·태스크 소멸)
$ aws cloudformation delete-stack --stack-name course-app
$ aws cloudformation wait stack-delete-complete --stack-name course-app

# RDS 중지 (데이터 유지)
$ aws rds stop-db-instance --db-instance-identifier course-data-mysql

# NAT 삭제(썼다면)
```

- [ ] **app 스택 삭제** — ALB·Fargate 중지 확인
- [ ] RDS 중지(또는 data 스택 삭제 — 스냅샷 확인)
- [ ] NAT 삭제(엔드포인트면 유지)
- [ ] ⭐ network 스택·시크릿·KMS·도메인·인증서 유지
- [ ] 팀 주간 비용 확인 + 절감 조치 점검

---

## ⑤ 자주 하는 실수

### 태스크가 unhealthy — 이번엔 DB 연결이 원인

24강과 달리 이제 DB가 얽혀 있습니다. 진단:

```bash
$ aws ecs describe-tasks --cluster course-app-cluster \
    --tasks $(aws ecs list-tasks --cluster course-app-cluster --desired-status STOPPED --query 'taskArns[0]' --output text) \
    --query 'tasks[0].[stoppedReason,containers[0].reason]'
$ aws logs tail /ecs/course-app --since 10m | grep -iE "error|timeout|denied"
```

| 로그 증상 | 원인 | 해결 |
|---|---|---|
| `Can't connect to MySQL ... timed out` | DbSg가 AppSg 3306 미허용 or 다른 VPC | 27강 SG 체인 확인 |
| `Access denied for user` | 시크릿 비밀번호와 RDS 불일치 | 같은 시크릿으로 RDS 생성했는지 |
| `secretsmanager ... AccessDenied` | 태스크 역할에 시크릿·KMS 권한 없음 | Step 2 TaskRolePolicy |
| `CannotPull...` | ECR 경로 없음 | NAT/엔드포인트 |

### 헬스 체크에 DB를 넣어 서비스가 무너진다

**증상** — DB가 잠깐 느려지자 모든 태스크가 unhealthy → 전체 교체 루프.
**원인** — `/health` 가 DB를 조회합니다.
**해결** — 헬스 체크는 **DB 의존 없이** "프로세스 살아 있음"만. DB 상태는 별도 지표([29강](lesson-29.md))로 봅니다.

### 시크릿 주입은 실행 역할, 앱 조회는 태스크 역할

**혼동** — 태스크 정의의 `Secrets` 필드로 주입하면 **실행 역할**에 권한이 필요하고, 앱 코드가 `boto3` 로 직접 조회하면 **태스크 역할**에 필요합니다.
**해결** — 이 프로젝트는 앱이 직접 조회(코드 방식)하므로 **태스크 역할**에 `GetSecretValue`+`kms:Decrypt`. 둘을 헷갈리면 "권한을 줬는데 안 된다"가 됩니다([21강](../03-serverless-automation/lesson-21.md) 역할 구분).

### HTTPS 리다이렉트 무한 루프

**증상** — `ERR_TOO_MANY_REDIRECTS`.
**원인** — ALB가 HTTPS로 보내는데 앱도 다시 리다이렉트([12강](../02-compute-data/lesson-12.md)).
**해결** — 앱은 리다이렉트하지 않고 ALB에만 맡기거나 `X-Forwarded-Proto` 를 봅니다. 이 프로젝트 앱은 리다이렉트를 안 하므로 ALB 리스너 설정만 확인.

### 여러 태스크가 동시에 스키마를 만든다

**원인** — 각 태스크가 부팅 시 `init_schema()` 실행.
**완화** — `CREATE TABLE IF NOT EXISTS`(멱등)로 실습은 안전. **실무는 파이프라인의 마이그레이션 단계**에서 한 번만 — 문서에 명시.

### 스택 삭제했는데 network가 안 지워진다

**원인** — app이 network의 Export를 참조 중이었고, app 삭제 전에 network를 지우려 함([23강](../03-serverless-automation/lesson-23.md)).
**해결** — 삭제 순서 app → data → network. 참조하는 쪽부터.

---

## ⑥ 마일스톤 점검 — 🏁 M2

**M2 통과 기준**

- [ ] `https://<팀도메인>` 으로 서비스가 열린다
- [ ] 신청(POST)이 RDS에 기록되고 조회(GET)로 확인된다
- [ ] HTTP → HTTPS 리다이렉트, 저장 암호화, DB 비공개
- [ ] IaC 저장소에 network·data·app 3스택 + 워크플로
- [ ] `git push` 로 배포되고 스모크 테스트가 검증한다
- [ ] 무중단 변경 확인(FAIL 0건)

**M2 제출물**

- [ ] 배포된 서비스 URL + 신청/조회 동작 캡처
- [ ] IaC 저장소 링크(3스택 구조 설명)
- [ ] 파이프라인 실행 로그(성공 + 무중단 변경)
- [ ] 설계(M1) 대비 실제 구축 차이와 이유

**스스로 점검하는 질문 3개**

<details>
<summary>1. 앱이 DB 비밀번호를 어떻게 얻나요? 어디에도 평문이 없는 것을 증명할 수 있나요?</summary>

앱은 **태스크 역할 권한으로 Secrets Manager에서 런타임에 조회**합니다. 증명: ① 코드에 비밀번호 없음(`git grep` 으로 확인) ② 태스크 정의 환경변수에 `SECRET_NAME`(이름)만 있고 값 없음 ③ 이미지에 없음 ④ CFN 템플릿은 `{{resolve:}}` 로 참조만. 전 경로에 평문이 없어야 M2 통과입니다.
</details>

<details>
<summary>2. app 스택을 지워도 데이터가 안전한 이유는?</summary>

**데이터가 app이 아니라 data 스택(RDS)에 있고**, data 스택은 `DeletionPolicy: Snapshot`([27강](lesson-27.md))으로 보호됩니다. app 스택 삭제는 ALB·Fargate만 없앱니다. 이것이 스택을 수명 주기로 분리한 이유 — 자주 지웠다 만드는 앱과, 지켜야 할 데이터를 나눈 것입니다.
</details>

<details>
<summary>3. 이 서비스에서 "가장 먼저 죽는 지점"은 M1 리뷰 지적과 비교해 해결됐나요?</summary>

팀마다 다릅니다. M1에서 "단일 NAT"를 지적받았다면 엔드포인트로 바꿨는지, "넓은 IAM"을 지적받았다면 태스크 역할을 좁혔는지 대조합니다. 해결 못 한 것은 [29·30강](lesson-30.md) 검증·게임데이에서 드러나므로, M2 시점에 남은 위험을 목록으로 갖고 있어야 합니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 3스택 연결 | network Export → data·app이 Import |
| DB 연결 | 엔드포인트는 환경변수, 자격 증명은 시크릿 조회 |
| 시크릿 권한 | 코드 조회면 **태스크 역할**, 주입이면 실행 역할 |
| 헬스 체크 | **DB 의존 금지** — 프로세스 생존만 |
| HTTPS | 443(ACM) + 80→301, 앱은 리다이렉트 안 함 |
| 마이그레이션 | 실습은 멱등, 실무는 파이프라인 별도 단계 |
| 정리 | app 스택 삭제 = 비용 소멸, push로 부활 |

**한 장 요약**

```
  git push → 파이프라인
    → data 스택(RDS, 유지) + app 스택(ALB·ECS, 재생성)
    → 태스크: DB_ENDPOINT(env) + 시크릿(런타임 조회)
    → https://<도메인> 200, 신청→RDS, push로 무중단 갱신
    = M2 달성
```

**오늘 반드시 기억할 한 가지**
> **M2는 "열린다"가 아니라 "열리고, 안전하고, push로 갱신된다"입니다.**
> 평문 비밀번호가 한 곳이라도 있으면 M2가 아닙니다.

**과제 (팀) — M2 제출**
1. 서비스 URL + 신청/조회 동작 캡처.
2. IaC 저장소(3스택) + 파이프라인 성공 로그.
3. 무중단 변경 증빙(요청 루프 FAIL 0건).
4. **비밀번호 무노출 증명** — 코드·이미지·템플릿 어디에도 없음을 보이는 3가지.
5. M1 대비 변경 관리 기록(무엇을 왜 바꿨나) + 팀 주간 비용.

---

[← 이전 27강](lesson-27.md) · [목차](README.md) · [다음 → 29강 관측성과 부하 검증](lesson-29.md)
