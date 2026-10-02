# 12강 · Route 53과 ACM으로 HTTPS

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **12강 / 총 32강**
> [← 이전 11강](lesson-11.md) · [목차](README.md) · [다음 → 13강 S3 — 객체 스토리지](lesson-13.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- DNS 조회 과정과 **TTL의 의미**를 설명할 수 있다.
- **Alias 레코드와 CNAME의 차이**를 알고 zone apex에 올바른 레코드를 만들 수 있다.
- ACM으로 **무료 TLS 인증서를 발급·검증**하고 ALB에 연결할 수 있다.
- HTTP 요청을 **HTTPS로 리다이렉트**해 전 구간 암호화를 강제할 수 있다.
- 가중치 라우팅으로 **카나리 배포**를 구성할 수 있다.

---

## ② 왜 필요한가

[11강](lesson-11.md)에서 만든 서비스의 주소는 이렇게 생겼습니다.

```
http://course-alb-1234567890.ap-northeast-2.elb.amazonaws.com
```

문제가 세 가지입니다.

| 문제 | 왜 문제인가 |
|---|---|
| **외우기 어렵다** | 사용자에게 이 주소를 알려 줄 수 없습니다 |
| **바뀔 수 있다** | ALB를 새로 만들면 DNS 이름이 달라집니다 |
| **`http://` 다** | 🔴 **로그인 정보가 평문으로 흐릅니다** |

세 번째가 가장 심각합니다. 요즘 브라우저는 HTTP 사이트에 **"안전하지 않음"** 경고를 띄우고, 로그인 폼이 있으면 더 강한 경고를 냅니다. 검색 순위에도 불리합니다.

그런데 예전에는 HTTPS를 붙이는 것이 번거로웠습니다.

```
 인증서 구입 ($50~200/년) → CSR 생성 → 검증 서류 제출 → 발급 →
 서버마다 설치 → 1년 뒤 갱신 (깜빡하면 서비스 중단)
```

**AWS에서는 이 과정이 이렇게 바뀝니다.**

```
 ACM에서 요청 → DNS 레코드로 자동 검증 → ALB에 붙이기 → 끝
 비용: $0 · 갱신: 자동
```

오늘 그 과정을 실습합니다. 그리고 이 HTTPS 엔드포인트가 [16강 중간 프로젝트](lesson-16.md)와 최종 프로젝트의 기본 요구사항이 됩니다.

---

## ③ 개념 설명

### DNS가 주소를 찾아가는 과정

```
 브라우저: app.example.com 이 어디죠?
     │
     ├─▶ ① 브라우저/OS 캐시 확인 (있으면 끝)
     │
     ├─▶ ② 리졸버(통신사 DNS)에 질의
     │        │
     │        ├─▶ 루트 네임서버:  "com 은 저쪽에"
     │        ├─▶ TLD(.com) 서버: "example.com 은 Route 53에"
     │        └─▶ 권한 있는 네임서버(Route 53): "13.125.1.2 입니다"
     │
     └─◀ IP 반환 (TTL 동안 캐시)
```

> **TTL(Time To Live)** — 이 응답을 몇 초간 캐시해도 되는지. TTL이 300이면 5분간 같은 답을 씁니다.
> 🔴 **IP를 바꾸기 전에는 TTL을 미리 줄여 둡니다.** TTL이 86400(하루)이면 변경이 하루 동안 반영되지 않습니다.

### 레코드 유형

| 유형 | 뜻 | 예 |
|---|---|---|
| **A** | 이름 → IPv4 | `app.example.com → 13.125.1.2` |
| AAAA | 이름 → IPv6 | |
| **CNAME** | 이름 → **다른 이름** | `www → app.example.com` |
| **Alias** ⭐ | 이름 → **AWS 리소스** (Route 53 전용) | `example.com → ALB` |
| NS | 이 도메인의 권한 있는 네임서버 | 위임에 사용 |
| MX / TXT | 메일 서버 / 텍스트(검증·SPF) | |

### Alias vs CNAME — 시험과 실무 단골

| | **Alias** | CNAME |
|---|---|---|
| 대상 | **AWS 리소스**(ALB·CloudFront·S3 웹사이트·API GW) | 아무 도메인 이름 |
| **zone apex**(`example.com`) | ✅ **사용 가능** | ❌ **불가능** (DNS 표준 위반) |
| 조회 요금 | **무료** | 과금 |
| 응답 | Route 53이 IP를 직접 반환 | 한 번 더 조회 필요 |
| 표준 | Route 53 전용 확장 | DNS 표준 |

> ⭐ **AWS 리소스를 가리킬 때는 항상 Alias**를 씁니다. 더 싸고, 빠르고, zone apex에도 쓸 수 있습니다.

### 라우팅 정책 5종

| 정책 | 동작 | 용도 |
|---|---|---|
| **단순(Simple)** | 하나의 대상 | 기본 |
| **가중치(Weighted)** | 비율대로 분배 (10:90 등) | **카나리 배포**, A/B 테스트 |
| 지연 시간(Latency) | 가장 빠른 리전으로 | 글로벌 서비스 |
| **장애 조치(Failover)** | 주 대상이 죽으면 보조로 | **재해 복구** ([26강](../04-final-project/lesson-26.md)) |
| 지리 위치(Geolocation) | 접속 국가별로 다르게 | 지역별 콘텐츠·규제 |

### ACM(AWS Certificate Manager)

| 항목 | 내용 |
|---|---|
| 비용 | **퍼블릭 인증서 무료** (사설 CA는 유료) |
| 갱신 | **자동** (DNS 검증을 유지하면) |
| 붙일 수 있는 곳 | ALB · NLB · CloudFront · API Gateway 등 **AWS 관리형 서비스** |
| ⚠️ 제약 | **EC2에 직접 설치 불가** (프라이빗 키를 내보낼 수 없음) |
| 리전 | **ALB용은 ALB와 같은 리전**, **CloudFront용은 반드시 `us-east-1`** 🔴 |

**검증 방식 2가지**

| 방식 | 절차 | 자동 갱신 |
|---|---|---|
| **DNS 검증** ⭐ | 지정된 CNAME 레코드를 도메인에 추가 | ✅ **레코드를 유지하면 자동** |
| 이메일 검증 | 도메인 관리자 메일로 승인 | ❌ 매번 수동 |

> 🔴 **검증용 CNAME 레코드를 나중에 지우면 자동 갱신이 실패합니다.** 발급 후에도 남겨 두세요.

### TLS 종료 위치

```
 사용자 ──[HTTPS 암호화]──▶ ALB ──[HTTP 평문]──▶ EC2
                            ▲
                      여기서 복호화(TLS 종료)
```

| 구간 | 이 과정 | 더 엄격한 요구가 있다면 |
|---|---|---|
| 사용자 ↔ ALB | **HTTPS** | HTTPS |
| ALB ↔ EC2 | HTTP (VPC 내부) | HTTPS (종단 간 암호화) |

> 💡 **VPC 내부는 AWS가 격리하므로 대부분 HTTP로 충분**합니다. 금융·의료 등 규제가 있으면 백엔드까지 HTTPS로 갑니다(백엔드에 자체 서명 인증서 사용 가능).

### 도메인이 없다면

이 과정은 **강사 공용 도메인의 서브도메인 위임**을 권장합니다.

```
 강사 도메인: awscourse.example
   └─ hong.awscourse.example  → 학습자 A의 호스팅 영역에 NS 위임
   └─ kim.awscourse.example   → 학습자 B의 호스팅 영역에 NS 위임
```

| 방식 | 비용 |
|---|---|
| 개인 도메인 등록 | `.click` `.link` 등 연 $3~5 + 호스팅 영역 월 $0.50 |
| **강사 도메인 서브 위임** | 호스팅 영역 월 $0.50만 |
| 도메인 없이 진행 | ALB DNS로 HTTP까지만 (HTTPS 실습 생략) |

> 🔴 **호스팅 영역은 만든 즉시 월 $0.50이 확정**됩니다(일할 계산 없음). 팀당 1개만 만드세요.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0.4 ~ 0.6** — ALB + NAT + 호스팅 영역 $0.50.
> ⚠️ [11강](lesson-11.md)의 ALB·ASG 구성이 필요합니다. 도메인(또는 위임받은 서브도메인)도 필요합니다.

### Step 1. 환경 복원 (10분)

[11강](lesson-11.md) Step 1~4를 반복해 **ALB + 대상 그룹 + ASG** 를 세웁니다.

```bash
$ bash create-vpc.sh && source ~/course-vpc-env.sh
# ... NAT, 대상 그룹, ALB, ASG 생성 (11강 참고) ...

$ ALB_ARN=$(aws elbv2 describe-load-balancers --names course-alb \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)
$ ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)
$ ALB_ZONE=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].CanonicalHostedZoneId' --output text)
$ echo "$ALB_DNS / $ALB_ZONE"
course-alb-1234567890.ap-northeast-2.elb.amazonaws.com / ZWKZPGTI48KDX
```

> 📌 **`CanonicalHostedZoneId`** 는 Alias 레코드를 만들 때 필요합니다. 리전별 ELB 고유값입니다.

### Step 2. 호스팅 영역 만들기 (15분)

**본인 도메인이 있는 경우**

```bash
$ DOMAIN=hong-aws.click
$ HZ_ID=$(aws route53 create-hosted-zone \
    --name $DOMAIN \
    --caller-reference "course-$(date +%s)" \
    --hosted-zone-config Comment="AWS course" \
    --query 'HostedZone.Id' --output text | cut -d/ -f3)
$ echo $HZ_ID
Z0123456789ABCDEFGHIJ
```

> 🔴 **여기서 월 $0.50이 확정됩니다.**

**네임서버 4개 확인** — 도메인 등록 기관(가비아·Namecheap 등)에 등록해야 합니다.

```bash
$ aws route53 get-hosted-zone --id $HZ_ID \
    --query 'DelegationSet.NameServers' --output table
------------------------------------------
|  ns-123.awsdns-45.com                   |
|  ns-678.awsdns-90.net                   |
|  ns-1011.awsdns-12.org                  |
|  ns-1314.awsdns-15.co.uk                |
------------------------------------------
```

**강사 도메인의 서브도메인을 위임받는 경우**

```bash
$ DOMAIN=hong.awscourse.example
$ HZ_ID=$(aws route53 create-hosted-zone --name $DOMAIN \
    --caller-reference "course-$(date +%s)" \
    --query 'HostedZone.Id' --output text | cut -d/ -f3)
```

위에서 나온 **네임서버 4개를 강사에게 전달**하면, 강사가 상위 도메인에 NS 레코드를 추가해 줍니다.

**위임 확인** (전파에 몇 분 걸립니다)

```bash
$ dig +short NS $DOMAIN
ns-123.awsdns-45.com.
ns-678.awsdns-90.net.
ns-1011.awsdns-12.org.
ns-1314.awsdns-15.co.uk.
```

> 이 출력이 나오면 위임 성공입니다. 안 나오면 몇 분 더 기다리거나 강사에게 확인하세요.

### Step 3. ACM 인증서 요청 (15분)

```bash
$ CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN \
    --subject-alternative-names "*.$DOMAIN" \
    --validation-method DNS \
    --region ap-northeast-2 \
    --query 'CertificateArn' --output text)
$ echo $CERT_ARN
arn:aws:acm:ap-northeast-2:123456789012:certificate/abcd1234-5678-90ef-ghij-klmnopqrstuv
```

> 📌 **`--subject-alternative-names "*.$DOMAIN"`** 으로 와일드카드까지 포함했습니다. `app.hong-aws.click`, `api.hong-aws.click` 을 모두 쓸 수 있습니다.
> 📌 **ALB용이므로 서울 리전(`ap-northeast-2`)에서 발급**합니다. CloudFront용이라면 `us-east-1` 이어야 합니다([14강](lesson-14.md)).

**검증용 CNAME 레코드 확인**

```bash
$ aws acm describe-certificate --certificate-arn $CERT_ARN \
    --query 'Certificate.DomainValidationOptions[*].ResourceRecord' --output json
[
  {
    "Name": "_a1b2c3d4e5f6.hong-aws.click.",
    "Type": "CNAME",
    "Value": "_9876543210fedcba.acm-validations.aws."
  }
]
```

**Route 53에 검증 레코드 추가**

```bash
$ VAL_NAME=$(aws acm describe-certificate --certificate-arn $CERT_ARN \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord.Name' --output text)
$ VAL_VALUE=$(aws acm describe-certificate --certificate-arn $CERT_ARN \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord.Value' --output text)

$ cat > validate.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "$VAL_NAME",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "$VAL_VALUE"}]
    }
  }]
}
EOF

$ aws route53 change-resource-record-sets --hosted-zone-id $HZ_ID \
    --change-batch file://validate.json \
    --query 'ChangeInfo.Status' --output text
PENDING
```

**발급 대기** (보통 2~10분)

```bash
$ aws acm wait certificate-validated --certificate-arn $CERT_ARN --region ap-northeast-2
$ aws acm describe-certificate --certificate-arn $CERT_ARN \
    --query 'Certificate.[Status,NotAfter]' --output text
ISSUED    2027-09-12T23:59:59+00:00
```

> ✅ **무료로 인증서를 받았습니다.** 유효기간은 약 13개월이고, **검증 CNAME을 유지하면 자동 갱신**됩니다.

### Step 4. ALB에 HTTPS 리스너 추가 ⭐ (15분)

```bash
$ HTTPS_LISTENER=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --query 'Listeners[0].ListenerArn' --output text)
```

> 📌 **SSL 정책**은 허용할 TLS 버전과 암호 스위트를 정합니다. `TLS13-1-2` 는 TLS 1.2 이상만 허용합니다(권장).

**보안 그룹에 443 허용**

```bash
$ MY_IP=$(curl -s https://checkip.amazonaws.com)
$ aws ec2 authorize-security-group-ingress --group-id $SG_WEB \
    --protocol tcp --port 443 --cidr ${MY_IP}/32
```

**80 리스너를 443으로 리다이렉트하도록 변경**

```bash
$ HTTP_LISTENER=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN \
    --query 'Listeners[?Port==`80`].ListenerArn' --output text)

$ aws elbv2 modify-listener --listener-arn $HTTP_LISTENER \
    --default-actions '[{
      "Type": "redirect",
      "RedirectConfig": {
        "Protocol": "HTTPS", "Port": "443",
        "Host": "#{host}", "Path": "/#{path}", "Query": "#{query}",
        "StatusCode": "HTTP_301"
      }
    }]' \
    --query 'Listeners[0].DefaultActions[0].Type' --output text
redirect
```

> 💡 `#{host}` `#{path}` `#{query}` 는 **원래 요청 값을 그대로 유지**하는 자리표시자입니다. `/products?id=3` 으로 들어오면 `https://.../products?id=3` 으로 보냅니다.

### Step 5. Route 53 Alias 레코드 만들기 (10분)

```bash
$ cat > alias.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$ALB_ZONE",
          "DNSName": "$ALB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$ALB_ZONE",
          "DNSName": "$ALB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

$ aws route53 change-resource-record-sets --hosted-zone-id $HZ_ID \
    --change-batch file://alias.json \
    --query 'ChangeInfo.[Id,Status]' --output text
/change/C0123456789ABC    PENDING
```

> ⭐ **두 번째 레코드가 zone apex(`hong-aws.click`)** 입니다. CNAME으로는 불가능하고 **Alias라서 가능**합니다.
> 📌 `EvaluateTargetHealth: true` — ALB가 비정상이면 이 레코드를 응답에서 제외합니다.

**전파 확인**

```bash
$ aws route53 wait resource-record-sets-changed --id C0123456789ABC

$ dig +short app.$DOMAIN
13.125.1.2
3.36.77.201
```

> ALB는 AZ마다 노드가 있어 **IP가 여러 개** 반환됩니다. 정상입니다.

### Step 6. 🔍 HTTPS 동작 증명 (15분)

**① HTTPS 접속**

```bash
$ curl -sI https://app.$DOMAIN | head -3
HTTP/2 200
date: Thu, 13 Aug 2026 17:22:41 GMT
content-type: text/html
```

**② HTTP → HTTPS 리다이렉트**

```bash
$ curl -sI http://app.$DOMAIN | head -3
HTTP/1.1 301 Moved Permanently
Location: https://app.hong-aws.click:443/
server: awselb/2.0
```

> ✅ **301로 HTTPS로 보냅니다.** 평문 접속 경로가 사라졌습니다.

**③ 인증서 확인**

```bash
$ echo | openssl s_client -connect app.$DOMAIN:443 -servername app.$DOMAIN 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
subject=CN = hong-aws.click
issuer=C = US, O = Amazon, CN = Amazon RSA 2048 M02
notBefore=Aug 13 00:00:00 2026 GMT
notAfter=Sep 12 23:59:59 2027 GMT
```

**④ TLS 버전 확인** — TLS 1.1로 접속을 시도하면 거부되어야 합니다.

```bash
$ curl -sI --tlsv1.1 --tls-max 1.1 https://app.$DOMAIN
curl: (35) error:0A00042E:SSL routines::tlsv1 alert protocol version
```

> ✅ **SSL 정책이 동작합니다.** 구버전 TLS는 차단됩니다.

**⑤ 브라우저에서 확인** — `https://app.<도메인>` 접속 → 주소창 **자물쇠 아이콘** → 인증서 상세를 캡처합니다.

**⑥ zone apex도 동작하는지**

```bash
$ curl -sI https://$DOMAIN | head -1
HTTP/2 200
```

### Step 7. 가중치 라우팅으로 카나리 구성 (선택, 15분)

새 버전을 **10%에만** 노출하는 구성입니다.

```bash
$ cat > weighted.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "canary.$DOMAIN", "Type": "A",
        "SetIdentifier": "current-v1", "Weight": 90,
        "AliasTarget": {
          "HostedZoneId": "$ALB_ZONE", "DNSName": "$ALB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "canary.$DOMAIN", "Type": "A",
        "SetIdentifier": "new-v2", "Weight": 10,
        "AliasTarget": {
          "HostedZoneId": "$ALB_ZONE", "DNSName": "$ALB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

$ aws route53 change-resource-record-sets --hosted-zone-id $HZ_ID \
    --change-batch file://weighted.json
```

> 💡 실습에서는 두 레코드가 같은 ALB를 가리키므로 결과가 같습니다. **실제로는 v2 ALB(또는 다른 대상 그룹)를 가리켜** 10%만 새 버전을 보게 합니다.
> ⚠️ **DNS 기반 카나리의 한계** — TTL 때문에 비율 조정이 즉시 반영되지 않고, 롤백도 느립니다.
> **더 정밀한 카나리는 ALB의 가중 대상 그룹**([24강](../03-serverless-automation/lesson-24.md))으로 합니다.

### 💰 이번 강 비용

| 리소스 | 프리 티어 | 6시간 사용 | 방치 시 월 |
|---|---|---|---|
| **Route 53 호스팅 영역** | ❌ | **월 $0.50 확정**(일할 없음) | $0.50 |
| Route 53 쿼리 | ❌ | 100만 건당 $0.40 → 실습은 $0.001 미만 | 트래픽 비례 |
| **ACM 퍼블릭 인증서** | ✅ **무료** | **$0** | $0 |
| **ALB** | ❌ | 약 $0.14 | 🔴 약 $16.4 |
| NAT Gateway | ❌ | 약 $0.36 | 🔴 약 $42 |
| EC2 t3.micro × 2 | ✅ 750h 합산 | $0 | 약 $19 |
| 도메인 등록(개인) | ❌ | — | 연 $3~15 |
| **합계** | | **약 $0.6** | **약 $78** |

> 💡 **호스팅 영역은 만든 달에 무조건 $0.50입니다.** 하루만 써도 같습니다. 그래서 **과정 내내 유지**하는 편이 낫습니다(매번 지웠다 만들면 매달 $0.50씩 반복).

### 🧹 리소스 정리 체크리스트

```bash
# 1) ASG · ALB · 대상 그룹 (11강과 동일)
$ aws autoscaling delete-auto-scaling-group --auto-scaling-group-name course-asg --force-delete
$ aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
$ sleep 30
$ aws elbv2 delete-target-group --target-group-arn $TG_ARN

# 2) NAT + EIP
$ aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
$ aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
$ aws ec2 release-address --allocation-id $EIP_ALLOC

# 3) Alias 레코드 삭제 (ALB가 사라졌으므로 무효 레코드)
#    호스팅 영역은 유지하되 Alias만 제거
$ sed -i 's/"Action": "UPSERT"/"Action": "DELETE"/g' alias.json
$ aws route53 change-resource-record-sets --hosted-zone-id $HZ_ID --change-batch file://alias.json
```

- [ ] ASG · ALB · 대상 그룹 삭제
- [ ] NAT Gateway 삭제 + EIP 반환
- [ ] 무효해진 Alias 레코드 삭제
- [ ] ⭐ **호스팅 영역은 유지** (과정 종료까지 · 월 $0.50)
- [ ] ⭐ **ACM 인증서와 검증 CNAME 레코드 유지** (무료 · 자동 갱신)
- [ ] ⭐ 시작 템플릿 유지
- [ ] 다음 날 Cost Explorer에서 ELB·NAT가 멈췄는지 확인

> 📌 **호스팅 영역과 인증서를 남기는 이유** — [14강](lesson-14.md) CloudFront, [16강](lesson-16.md) 중간 프로젝트, 최종 프로젝트에서 계속 씁니다. 매번 지우면 검증을 다시 해야 하고 호스팅 영역 요금도 매달 새로 발생합니다.

---

## ⑤ 자주 하는 실수

### 인증서가 계속 `PENDING_VALIDATION` 이다

```bash
$ aws acm describe-certificate --certificate-arn $CERT_ARN \
    --query 'Certificate.Status' --output text
PENDING_VALIDATION
```

**원인 3가지**

| 원인 | 확인 |
|---|---|
| 검증 CNAME을 **추가하지 않았다** | `aws route53 list-resource-record-sets` |
| 레코드 **이름/값에 오타** | 끝의 점(`.`)까지 정확히 |
| **네임서버 위임이 안 됐다** | `dig NS <도메인>` 이 Route 53 NS를 반환하는지 |

**직접 확인**

```bash
$ dig +short CNAME _a1b2c3d4e5f6.hong-aws.click
_9876543210fedcba.acm-validations.aws.
```

이 값이 나와야 합니다. 안 나오면 레코드나 위임 문제입니다.

> ⏱ **모든 게 맞아도 10~30분** 걸릴 수 있습니다. 조급해하지 마세요.

### CloudFront용 인증서가 목록에 안 보인다

**원인** — CloudFront는 **글로벌 서비스**라 인증서를 **`us-east-1`(버지니아 북부)** 에서만 참조합니다.
**해결** — 버지니아 북부에서 다시 발급합니다.

```bash
$ aws acm request-certificate --domain-name $DOMAIN \
    --validation-method DNS --region us-east-1
```

| 대상 | 인증서 리전 |
|---|---|
| ALB / NLB | **ALB와 같은 리전** (서울) |
| **CloudFront** | 🔴 **반드시 `us-east-1`** |
| API Gateway(엣지 최적화) | `us-east-1` |
| API Gateway(리전) | 해당 리전 |

> [14강](lesson-14.md)에서 CloudFront를 만들 때 이 문제를 다시 만납니다.

### zone apex에 CNAME을 만들려다 실패한다

```
An error occurred (InvalidChangeBatch) when calling the ChangeResourceRecordSets operation:
RRSet of type CNAME with DNS name hong-aws.click. is not permitted at apex in zone hong-aws.click.
```

**원인** — DNS 표준상 **zone apex에는 CNAME을 둘 수 없습니다.** apex에는 SOA·NS 레코드가 이미 있어야 하는데, CNAME은 다른 레코드와 공존할 수 없기 때문입니다.
**해결** — **Alias 레코드(A 타입)** 를 씁니다. Route 53의 확장 기능이라 apex에서도 동작합니다.

### 도메인은 뜨는데 인증서 경고가 난다

```
NET::ERR_CERT_COMMON_NAME_INVALID
이 서버가 hong-aws.click임을 증명할 수 없습니다.
```

**원인** — 인증서의 도메인 이름과 접속한 이름이 다릅니다.

| 인증서 | 접속 주소 | 결과 |
|---|---|---|
| `hong-aws.click` | `app.hong-aws.click` | 🚫 불일치 |
| `hong-aws.click` + `*.hong-aws.click` | `app.hong-aws.click` | ✅ 정상 |

**해결** — 인증서 요청 시 `--subject-alternative-names "*.도메인"` 을 포함합니다. 이미 발급했다면 **새로 발급**해야 합니다(기존 인증서에 도메인 추가 불가).

> ⚠️ **와일드카드는 한 단계만** 커버합니다. `*.example.com` 은 `a.example.com` 은 되지만 `a.b.example.com` 은 안 됩니다.

### 리다이렉트가 무한 루프에 빠진다

```
ERR_TOO_MANY_REDIRECTS
```

**원인** — ALB가 HTTP를 HTTPS로 보내는데, 백엔드 애플리케이션도 다시 HTTP로 리다이렉트하는 경우입니다.

```
 사용자 → ALB(80) → 301 → ALB(443) → EC2(80 평문) → 앱이 "HTTP네? HTTPS로 가!" → 301 → ...
```

**원인의 핵심** — EC2 입장에서는 요청이 **HTTP로 도착**합니다(ALB가 TLS를 종료했으므로).
**해결** — 애플리케이션이 **`X-Forwarded-Proto` 헤더**를 보고 판단하도록 합니다.

```
X-Forwarded-Proto: https        ← 원래 요청이 HTTPS였다는 뜻
X-Forwarded-For: 203.0.113.45   ← 원래 클라이언트 IP
```

nginx 예:

```nginx
if ($http_x_forwarded_proto = "http") { return 301 https://$host$request_uri; }
```

### DNS 변경이 반영되지 않는다

**원인** — TTL 동안 캐시된 옛 응답을 보고 있습니다.
**해결·확인**

```bash
# 권한 있는 네임서버에 직접 물어보기 (캐시 무시)
$ dig +short app.hong-aws.click @ns-123.awsdns-45.com

# 로컬 DNS 캐시 비우기
$ ipconfig /flushdns              # Windows
$ sudo dscacheutil -flushcache    # macOS
```

**예방** — IP나 대상을 바꾸기 **며칠 전에 TTL을 60초로 줄여 둡니다.** 변경 후 원래대로 되돌립니다.

### 호스팅 영역을 지웠다 만들면 네임서버가 바뀐다

**증상** — 도메인이 갑자기 조회되지 않습니다.
**원인** — 호스팅 영역을 새로 만들면 **네임서버 4개가 새 값으로 배정**됩니다. 등록 기관(또는 상위 도메인)의 NS 설정이 옛 값을 가리키고 있습니다.
**해결** — 새 네임서버를 등록 기관에 다시 설정합니다. 전파에 시간이 걸립니다.
**예방** — **호스팅 영역을 지우지 마세요.** 월 $0.50이 아까워 지웠다가 몇 시간을 잃는 경우가 많습니다.

---

## ⑥ 확인 문제

**1.** `example.com`(zone apex)을 ALB로 연결하려고 CNAME 레코드를 만들었더니 오류가 났습니다. 왜이고, 어떻게 해결하나요?

<details>
<summary>답 보기</summary>

**DNS 표준상 zone apex에는 CNAME을 둘 수 없습니다.**

apex에는 **SOA와 NS 레코드가 반드시 존재**해야 하는데, CNAME은 **같은 이름에 다른 레코드가 있으면 안 된다**는 규칙이 있습니다. 두 규칙이 충돌하므로 금지됩니다.

**해결 — Route 53의 Alias 레코드(A 타입)**

```json
{
  "Name": "example.com",
  "Type": "A",
  "AliasTarget": {
    "HostedZoneId": "<ALB의 CanonicalHostedZoneId>",
    "DNSName": "<ALB DNS 이름>",
    "EvaluateTargetHealth": true
  }
}
```

**Alias의 추가 이점**

| 항목 | Alias | CNAME |
|---|---|---|
| zone apex | ✅ | ❌ |
| 조회 요금 | **무료** | 과금 |
| 응답 속도 | Route 53이 IP 직접 반환 | 한 단계 더 조회 |
| 대상 헬스 체크 | `EvaluateTargetHealth` 지원 | 없음 |

> **원칙** — AWS 리소스(ALB·CloudFront·S3 웹사이트·API GW)를 가리킬 때는 **항상 Alias**.
</details>

**2.** CloudFront에 붙일 인증서를 서울 리전에서 발급했더니 CloudFront 콘솔의 인증서 목록에 나타나지 않습니다. 왜인가요?

<details>
<summary>답 보기</summary>

**CloudFront는 글로벌 서비스이고, 인증서를 `us-east-1`(버지니아 북부)에서만 참조하기 때문입니다.**

CloudFront는 전 세계 엣지 로케이션에서 동작하므로 특정 리전에 속하지 않습니다. AWS는 이런 글로벌 서비스의 리소스를 관례적으로 `us-east-1` 에 두고 관리합니다.

**해결**

```bash
$ aws acm request-certificate --domain-name example.com \
    --subject-alternative-names "*.example.com" \
    --validation-method DNS --region us-east-1
```

**정리 — 서비스별 인증서 리전**

| 서비스 | 인증서 리전 |
|---|---|
| ALB / NLB | 로드밸런서와 **같은 리전** |
| **CloudFront** | **`us-east-1` 고정** |
| API Gateway(엣지 최적화) | `us-east-1` |
| API Gateway(리전별) | 해당 리전 |

> 💡 CloudFront와 ALB를 함께 쓰면 **인증서가 2장** 필요합니다(us-east-1 하나, 서울 하나). 둘 다 무료이므로 비용 문제는 없습니다.
</details>

**3.** HTTPS를 적용했는데 사용자가 `ERR_TOO_MANY_REDIRECTS` 오류를 봅니다. 원인과 해결책을 설명하세요.

<details>
<summary>답 보기</summary>

**ALB와 애플리케이션이 서로에게 리다이렉트를 떠넘기고 있습니다.**

```
 사용자 → ALB:80 ─301→ ALB:443 ─(HTTP 평문)→ EC2:80
                                                │
                                   앱: "HTTP로 왔네? HTTPS로 보내야지" ─301→
                                                │
                                          다시 ALB:443 → EC2:80 → 301 → ... 무한 반복
```

**핵심 원인** — ALB가 TLS를 **종료(terminate)** 하므로 백엔드에는 **HTTP 평문으로 전달**됩니다. 애플리케이션은 이것을 "사용자가 HTTP로 접속했다"고 오해합니다.

**해결 — `X-Forwarded-Proto` 헤더를 보게 만듭니다.**

ALB는 원래 요청 정보를 헤더로 전달합니다.

| 헤더 | 값 |
|---|---|
| `X-Forwarded-Proto` | `https` (원래 프로토콜) |
| `X-Forwarded-For` | 클라이언트 실제 IP |
| `X-Forwarded-Port` | `443` |

**nginx**

```nginx
if ($http_x_forwarded_proto = "http") {
    return 301 https://$host$request_uri;
}
```

**애플리케이션 프레임워크** — 대부분 "프록시 신뢰" 설정이 있습니다.
- Django: `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`
- Express: `app.set('trust proxy', true)`
- Spring: `server.forward-headers-strategy=native`

**더 간단한 해법** — 애플리케이션의 HTTPS 리다이렉트를 **끄고 ALB에만 맡깁니다.** 리다이렉트 책임을 한 곳에만 두는 것이 가장 안전합니다.

> **덤** — 같은 이유로 애플리케이션 로그에 클라이언트 IP가 전부 ALB의 IP로 찍힙니다. `X-Forwarded-For` 를 로그 형식에 넣어야 실제 IP가 남습니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| TTL | 캐시 유지 시간. **변경 전 미리 줄여 둔다** |
| **Alias vs CNAME** | Alias는 **zone apex 가능·조회 무료·AWS 리소스 전용** |
| 라우팅 정책 | 단순 · **가중치(카나리)** · 지연 · **장애 조치** · 지리 |
| ACM | **퍼블릭 인증서 무료 + 자동 갱신**. EC2에 직접 설치 불가 |
| 인증서 리전 | ALB=같은 리전 / **CloudFront=`us-east-1`** 🔴 |
| DNS 검증 | 검증 CNAME을 **지우면 자동 갱신 실패** |
| TLS 종료 | ALB에서 복호화 → 백엔드는 HTTP. **`X-Forwarded-Proto`** 로 판단 |
| 리다이렉트 | 80 리스너를 **301 → HTTPS** 로 |
| 비용 | 호스팅 영역 **월 $0.50 확정**, 인증서 $0 |

**한 장 요약**

```
  사용자 ──https://app.example.com──▶ Route 53 (Alias A)
                                          │
                                          ▼
                                    ALB :443 (ACM 인증서)
                                     :80 → 301 → :443
                                          │ HTTP
                                          ▼
                                    대상 그룹 → EC2
```

**오늘 반드시 기억할 한 가지**
> **HTTPS는 이제 기본값입니다.** ACM은 무료이고 갱신도 자동이라 안 할 이유가 없습니다.
> 그리고 **AWS 리소스를 가리킬 땐 Alias**입니다.

**과제**
1. `https://app.<내도메인>` 접속 화면과 **인증서 상세**(발급자·유효기간·도메인) 캡처를 제출하세요.
2. **리다이렉트 증명** — `curl -sI http://app.<도메인>` 출력에서 `301` 과 `Location` 헤더가 보이는 화면.
3. **zone apex 레코드** — `https://<도메인>`(app 없이)도 동작하는 것을 보이고, 왜 CNAME이 아니라 Alias여야 했는지 3줄로 설명하세요.
4. `dig +short NS <도메인>` 과 `dig +short app.<도메인>` 출력을 제출하고 각 줄의 의미를 설명하세요.
5. **TLS 정책 실험** — TLS 1.1 접속이 거부되는 출력을 캡처하세요.
6. 이번 주 비용 확인 — **Route 53 호스팅 영역 $0.50** 과 **ELB 요금**이 청구서에 보이는지 확인하고 캡처하세요.

---

[← 이전 11강](lesson-11.md) · [목차](README.md) · [다음 → 13강 S3 — 객체 스토리지](lesson-13.md)
