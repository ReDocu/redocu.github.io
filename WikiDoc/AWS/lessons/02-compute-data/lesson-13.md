# 13강 · S3 — 객체 스토리지

> **AWS 학습 매뉴얼** · 🟡 대단원 02 · **13강 / 총 32강**
> [← 이전 12강](lesson-12.md) · [목차](README.md) · [다음 → 14강 EBS · EFS · CloudFront](lesson-14.md)

---

## ① 학습 목표

이 강을 마치면 이렇게 할 수 있습니다.

- 객체 스토리지가 파일 시스템과 **무엇이 다른지** 설명할 수 있다.
- **퍼블릭 액세스 차단 · 버킷 정책 · IAM 정책**의 관계를 이해하고 안전하게 접근을 제어할 수 있다.
- **사전 서명 URL**로 버킷을 공개하지 않고 임시 접근을 줄 수 있다.
- 버전 관리와 수명 주기 규칙으로 **실수 복구와 비용 관리**를 동시에 할 수 있다.
- 스토리지 클래스 6종을 **접근 빈도와 비용 기준으로 선택**할 수 있다.

---

## ② 왜 필요한가

[10강](lesson-10.md)에서 배운 원칙이 있었습니다.

> **상태를 인스턴스에 두지 마라.**

그런데 사용자가 프로필 사진을 업로드하면 그 파일은 어디에 둬야 할까요?

| 저장 위치 | 문제 |
|---|---|
| 인스턴스 로컬 디스크 | 🚫 스케일 인 시 **파일이 사라짐** |
| 인스턴스 로컬 + 서버 간 동기화 | 🚫 서버가 늘면 복잡도가 폭발 |
| 데이터베이스 BLOB | 🚫 DB가 비싸고 느려짐 |
| **S3** | ✅ 무제한 · 11개의 9 내구성 · 서버와 무관 |

S3는 단순한 "파일 저장소"가 아닙니다. AWS에서 S3는 **거의 모든 것의 기반**입니다.

```
 정적 웹사이트 호스팅   ·  CloudFront 오리진 (14강)
 백업·스냅샷 저장       ·  ALB 액세스 로그 (11강)
 데이터 레이크          ·  CloudFormation 템플릿 (23강)
 배포 아티팩트 (24강)   ·  CloudTrail 로그 (22강)
```

그리고 **보안 사고가 가장 많이 나는 서비스**이기도 합니다. "S3 버킷 공개로 개인정보 수백만 건 유출" 같은 뉴스의 원인은 대부분 **설정 실수 한 줄**입니다. 오늘 그 구조를 정확히 익힙니다.

---

## ③ 개념 설명

### 객체 스토리지가 다른 점

```
 [파일 시스템]                      [객체 스토리지]
  /home/user/docs/report.pdf         버킷: my-bucket
   ├─ 계층적 디렉터리                 키:   docs/report.pdf
   ├─ 부분 수정 가능                  ├─ "폴더"는 없다 (키의 일부일 뿐)
   ├─ 용량 한계                       ├─ 부분 수정 불가 (전체 교체)
   └─ 파일 잠금                       └─ 사실상 무제한
```

| 개념 | 뜻 |
|---|---|
| **버킷(Bucket)** | 최상위 컨테이너. **이름이 전 세계에서 고유**해야 함 |
| **키(Key)** | 객체의 전체 이름. `docs/2026/report.pdf` 전체가 하나의 키 |
| **객체(Object)** | 데이터 + 메타데이터. 최대 5TB |

> 💡 **S3에 폴더는 없습니다.** 콘솔에서 폴더처럼 보이는 것은 `/` 를 기준으로 화면에서 묶어 보여 주는 것뿐입니다.
> 그래서 "폴더 이름 바꾸기"가 없습니다. 모든 객체의 키를 새로 쓰는 복사 작업이 됩니다.

### 내구성과 가용성

| 지표 | S3 Standard | 뜻 |
|---|---|---|
| **내구성** | 99.999999999% (11개의 9) | 1,000만 개 객체를 넣으면 **1만 년에 1개** 손실 |
| **가용성** | 99.99% | 연간 약 53분 접근 불가 가능 |

> ⚠️ **내구성은 "데이터가 안 사라진다", 가용성은 "지금 접근할 수 있다"** 입니다. 다른 개념입니다.
> 그리고 **내구성이 실수 삭제를 막아 주지는 않습니다.** 그래서 버전 관리가 필요합니다.

### 접근 제어 4중 구조 ⭐ — 유출 사고의 지점

```
 요청 도착
    │
    ▼
 ① 퍼블릭 액세스 차단 (Block Public Access)  ← 계정/버킷 수준. 가장 먼저, 가장 강함
    │  차단 설정이 켜져 있으면 퍼블릭 정책 자체가 무시됨
    ▼
 ② 버킷 정책 (리소스 기반)                   ← "이 버킷에 누가 접근 가능한가"
    │
    ▼
 ③ IAM 정책 (아이덴티티 기반)                ← "이 사용자가 무엇을 할 수 있는가"
    │
    ▼
 ④ ACL (레거시)                             ← 신규 사용 비권장, 기본 비활성
    │
    ▼
  허용 여부 결정 (명시적 Deny가 하나라도 있으면 거부)
```

| 계층 | 언제 쓰나 |
|---|---|
| **퍼블릭 액세스 차단** | **항상 켜 둔다.** 실수로 공개되는 것을 막는 최후 방어선 |
| **버킷 정책** | 외부 계정·서비스(CloudFront 등)에 접근 허용 |
| **IAM 정책** | 내 계정의 사용자·역할에게 권한 부여 |
| ACL | 쓰지 않는다 (2023년부터 신규 버킷은 기본 비활성) |

> 🔴 **"S3 버킷 공개 유출" 사고의 대부분은 ①을 꺼 놓고 ②에 `"Principal": "*"` 를 쓴 경우**입니다.
> 정말 공개가 필요하면 S3를 직접 공개하지 말고 **CloudFront + OAC**([14강](lesson-14.md))를 씁니다.

### 사전 서명 URL(Presigned URL)

버킷을 공개하지 않고 **일정 시간만** 접근을 허용하는 방법입니다.

```
 앱 서버 (S3 권한 보유)
    │ ① 사전 서명 URL 생성 (예: 15분 유효)
    ▼
 사용자 브라우저
    │ ② 그 URL로 직접 S3에 접근 (앱 서버를 거치지 않음)
    ▼
 S3 (서명 검증 후 응답)
```

| 장점 | 설명 |
|---|---|
| 버킷 비공개 유지 | 정책 변경 불필요 |
| 서버 부하 감소 | 파일이 앱 서버를 통과하지 않음 |
| 시간 제한 | 만료 후 자동 무효 |
| 업로드도 가능 | `presign` + PUT |

### 버전 관리와 수명 주기

**버전 관리** — 같은 키에 덮어써도 이전 버전이 보존됩니다.

```
 report.pdf
   ├─ 버전 3 (최신)  ← 지금 보이는 것
   ├─ 버전 2
   └─ 버전 1
```

| 동작 | 결과 |
|---|---|
| 덮어쓰기 | 새 버전 생성, 이전 버전 보존 |
| 삭제 | **삭제 마커(delete marker)** 추가. 실제 데이터는 남음 |
| 삭제 마커 제거 | **복구됨** |

> 🔴 **버전 관리를 켜면 비용이 늘어납니다.** 모든 버전이 과금 대상입니다.
> 반드시 **수명 주기 규칙으로 오래된 버전을 정리**해야 합니다.
> 그리고 **한 번 켜면 완전히 끌 수 없습니다**(일시 중지만 가능).

**수명 주기 규칙** — 시간에 따라 자동으로 전환·삭제합니다.

```
 업로드 ──30일──▶ Standard-IA ──90일──▶ Glacier ──365일──▶ 삭제
 이전 버전 ──7일──▶ 삭제
 미완료 멀티파트 업로드 ──7일──▶ 정리     ← 잊기 쉬운 숨은 비용!
```

### 스토리지 클래스 6종 선택 기준

| 클래스 | GB당 월(서울, 대략) | 최소 보관 | 검색 비용 | 언제 |
|---|---|---|---|---|
| **Standard** | $0.025 | 없음 | 없음 | 자주 접근 |
| **Intelligent-Tiering** | $0.025~ + 모니터링비 | 없음 | 없음 | **접근 패턴을 모를 때** ⭐ |
| Standard-IA | $0.0138 | **30일** | GB당 $0.01 | 월 1회 미만 접근 |
| One Zone-IA | $0.011 | 30일 | GB당 $0.01 | 재생성 가능한 데이터 (AZ 1곳만) |
| Glacier Instant | $0.005 | **90일** | GB당 $0.03 | 분기 1회, 즉시 필요 |
| Glacier Deep Archive | $0.002 | **180일** | GB당 $0.02 + 복원 12시간 | 법정 보관 (7년) |

> 🔴 **함정은 최소 보관 기간과 검색 비용입니다.**
> Standard-IA에 넣고 **10일 만에 지우면 30일치 요금**을 냅니다. 자주 읽으면 검색 비용이 저장 비용을 넘습니다.
> **접근 패턴을 모르겠으면 Intelligent-Tiering** 이 안전합니다(객체당 소액의 모니터링 요금).

### S3 요금의 4가지 축

```
 ① 저장 용량   GB × 월
 ② 요청 수     PUT/COPY/POST/LIST: 1,000건당 $0.0045
               GET/SELECT:         1,000건당 $0.00035
 ③ 데이터 전송 아웃바운드(인터넷) GB당 $0.126 ← 실무에서 가장 큼
 ④ 관리 기능   수명 주기 전환, 복제, Intelligent-Tiering 모니터링
```

> 💡 **전송 비용을 줄이는 방법이 CloudFront**입니다([14강](lesson-14.md)). CDN 경유가 S3 직접 전송보다 쌉니다.

---

## ④ 단계별 실습

> 💰 **예상 비용 $0 ~ 0.1** — 프리 티어(5GB · PUT 2,000건 · GET 20,000건) 범위 안입니다.
> ALB·NAT가 필요 없는 강이므로 부담이 적습니다.

### Step 1. 버킷 만들기 — 안전한 기본값 확인 (10분)

```bash
$ BUCKET=course-s3-hong-$(date +%Y%m%d)
$ aws s3api create-bucket --bucket $BUCKET \
    --region ap-northeast-2 \
    --create-bucket-configuration LocationConstraint=ap-northeast-2
{
    "Location": "http://course-s3-hong-20260813.s3.amazonaws.com/"
}
```

> ⚠️ **서울 리전은 `--create-bucket-configuration` 이 필요합니다.** `us-east-1` 만 예외적으로 생략 가능합니다.

**퍼블릭 액세스 차단 확인 — 기본으로 켜져 있어야 정상**

```bash
$ aws s3api get-public-access-block --bucket $BUCKET \
    --query 'PublicAccessBlockConfiguration'
{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
}
```

| 설정 | 뜻 |
|---|---|
| `BlockPublicAcls` | 퍼블릭 ACL **설정 자체를 거부** |
| `IgnorePublicAcls` | 기존 퍼블릭 ACL을 **무시** |
| `BlockPublicPolicy` | 퍼블릭 버킷 정책 **설정 거부** |
| `RestrictPublicBuckets` | 퍼블릭 정책이 있어도 **접근 제한** |

**태그와 기본 암호화 확인**

```bash
$ aws s3api put-bucket-tagging --bucket $BUCKET \
    --tagging 'TagSet=[{Key=Project,Value=aws-course},{Key=Week,Value=W07}]'

$ aws s3api get-bucket-encryption --bucket $BUCKET \
    --query 'ServerSideEncryptionConfiguration.Rules[0]'
{
    "ApplyServerSideEncryptionByDefault": { "SSEAlgorithm": "AES256" },
    "BucketKeyEnabled": true
}
```

> ✅ **기본 암호화(SSE-S3)는 이제 자동으로 켜집니다.** 별도 설정이 필요 없습니다. KMS 키를 쓰려면 [25강](../04-final-project/lesson-25.md)에서 다룹니다.

### Step 2. 업로드하고 접근이 막히는 것 확인 (10분)

```bash
$ echo "AWS 과정 13강 테스트 파일" > sample.txt
$ aws s3 cp sample.txt s3://$BUCKET/docs/sample.txt
upload: ./sample.txt to s3://course-s3-hong-20260813/docs/sample.txt

$ aws s3 ls s3://$BUCKET/ --recursive
2026-08-13 18:02:11         32 docs/sample.txt
```

**브라우저(또는 인증 없는 curl)로 직접 접근 시도**

```bash
$ curl -s https://$BUCKET.s3.ap-northeast-2.amazonaws.com/docs/sample.txt
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
  <RequestId>ABCD1234567890EF</RequestId>
</Error>
```

> ✅ **막히는 것이 정상입니다.** 비공개 버킷의 기본 동작입니다.

**메타데이터 확인**

```bash
$ aws s3api head-object --bucket $BUCKET --key docs/sample.txt \
    --query '{크기:ContentLength,암호화:ServerSideEncryption,수정:LastModified}'
{
    "크기": 32,
    "암호화": "AES256",
    "수정": "2026-08-13T18:02:11+00:00"
}
```

### Step 3. 사전 서명 URL — 공개하지 않고 접근 허용 (15분)

```bash
$ PRESIGNED=$(aws s3 presign s3://$BUCKET/docs/sample.txt --expires-in 120)
$ echo $PRESIGNED
https://course-s3-hong-20260813.s3.ap-northeast-2.amazonaws.com/docs/sample.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...%2F20260813%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20260813T180500Z&X-Amz-Expires=120&X-Amz-SignedHeaders=host&X-Amz-Signature=abc123...
```

**유효 시간 안에는 성공**

```bash
$ curl -s "$PRESIGNED"
AWS 과정 13강 테스트 파일
```

**2분 뒤 다시 시도하면 실패**

```bash
$ sleep 125
$ curl -s "$PRESIGNED" | head -5
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Request has expired</Message>
  <Expires>2026-08-13T18:07:00Z</Expires>
```

> ✅ **버킷은 여전히 비공개인데 임시 접근을 줬습니다.** 이것이 "다운로드 링크"를 구현하는 표준 방법입니다.
> ⚠️ **URL 자체가 자격 증명입니다.** 링크를 받은 사람은 누구나 접근할 수 있으므로 유효 시간을 짧게 잡습니다.

### Step 4. 버전 관리 — 실수 복구 실습 ⭐ (20분)

```bash
$ aws s3api put-bucket-versioning --bucket $BUCKET \
    --versioning-configuration Status=Enabled

$ aws s3api get-bucket-versioning --bucket $BUCKET
{ "Status": "Enabled" }
```

**같은 키로 3번 덮어쓰기**

```bash
$ echo "버전 1 - 원본 보고서" > report.txt && aws s3 cp report.txt s3://$BUCKET/report.txt
$ echo "버전 2 - 수정본"     > report.txt && aws s3 cp report.txt s3://$BUCKET/report.txt
$ echo "버전 3 - 실수로 망침" > report.txt && aws s3 cp report.txt s3://$BUCKET/report.txt
```

**모든 버전 확인**

```bash
$ aws s3api list-object-versions --bucket $BUCKET --prefix report.txt \
    --query 'Versions[*].[VersionId,IsLatest,LastModified,Size]' --output table
--------------------------------------------------------------------------
|  3HL4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo | True  | 2026-08-13T18:12 | 22 |
|  QUpfdndhfd8438MNFDN93jdnJFkdmqnh893                              | False | 2026-08-13T18:11 | 18 |
|  1JqZ.NfZfd8438MNFDN93jdnJFkdmqnh892                              | False | 2026-08-13T18:10 | 24 |
--------------------------------------------------------------------------
```

**"버전 1로 되돌리기"**

```bash
$ OLD_VER=$(aws s3api list-object-versions --bucket $BUCKET --prefix report.txt \
    --query 'Versions[?IsLatest==`false`] | sort_by(@, &LastModified)[0].VersionId' --output text)

$ aws s3api copy-object --bucket $BUCKET --key report.txt \
    --copy-source "$BUCKET/report.txt?versionId=$OLD_VER"

$ aws s3 cp s3://$BUCKET/report.txt -
버전 1 - 원본 보고서
```

> ✅ **복구했습니다.** 옛 버전을 최신 버전으로 복사하는 방식이며, 이력은 그대로 남습니다.

**삭제 마커 확인**

```bash
$ aws s3 rm s3://$BUCKET/report.txt
delete: s3://course-s3-hong-20260813/report.txt

$ aws s3 ls s3://$BUCKET/
                          (report.txt가 안 보인다)

$ aws s3api list-object-versions --bucket $BUCKET --prefix report.txt \
    --query 'DeleteMarkers[*].[VersionId,IsLatest]' --output table
------------------------------------------------------------
|  gPMFdnfj3nfd8438MNFDN93jdnJFkdmqnh8934  |  True         |
------------------------------------------------------------
```

**삭제 마커를 지우면 부활합니다.**

```bash
$ DM=$(aws s3api list-object-versions --bucket $BUCKET --prefix report.txt \
    --query 'DeleteMarkers[0].VersionId' --output text)
$ aws s3api delete-object --bucket $BUCKET --key report.txt --version-id $DM

$ aws s3 cp s3://$BUCKET/report.txt -
버전 1 - 원본 보고서
```

> 🎉 **삭제도 되돌릴 수 있습니다.** 이것이 버전 관리를 켜는 가장 큰 이유입니다.
> 🔴 **대신 모든 버전이 과금됩니다.** 다음 단계에서 정리 규칙을 겁니다.

### Step 5. 수명 주기 규칙 — 비용 관리 (15분)

```bash
$ cat > lifecycle.json <<'EOF'
{
  "Rules": [
    {
      "ID": "archive-old-objects",
      "Status": "Enabled",
      "Filter": { "Prefix": "docs/" },
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER_IR" }
      ],
      "Expiration": { "Days": 365 }
    },
    {
      "ID": "clean-old-versions",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": { "NoncurrentDays": 7 },
      "NoncurrentVersionTransitions": [
        { "NoncurrentDays": 3, "StorageClass": "STANDARD_IA" }
      ]
    },
    {
      "ID": "abort-incomplete-uploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    },
    {
      "ID": "expire-delete-markers",
      "Status": "Enabled",
      "Filter": {},
      "Expiration": { "ExpiredObjectDeleteMarker": true }
    }
  ]
}
EOF

$ aws s3api put-bucket-lifecycle-configuration --bucket $BUCKET \
    --lifecycle-configuration file://lifecycle.json

$ aws s3api get-bucket-lifecycle-configuration --bucket $BUCKET \
    --query 'Rules[*].[ID,Status]' --output table
--------------------------------------------------
|  archive-old-objects        |  Enabled          |
|  clean-old-versions         |  Enabled          |
|  abort-incomplete-uploads   |  Enabled          |
|  expire-delete-markers      |  Enabled          |
--------------------------------------------------
```

**각 규칙의 의미**

| 규칙 | 효과 |
|---|---|
| `archive-old-objects` | `docs/` 아래 객체를 30일 후 IA, 90일 후 Glacier, 1년 후 삭제 |
| `clean-old-versions` ⭐ | **이전 버전을 7일 후 삭제** — 버전 관리 비용 폭증 방지 |
| `abort-incomplete-uploads` ⭐ | **실패한 멀티파트 업로드 조각 정리** — 눈에 안 보이는 숨은 비용 |
| `expire-delete-markers` | 아무것도 안 남은 삭제 마커 정리 |

> 🔴 **세 번째 규칙을 특히 기억하세요.** 대용량 업로드가 중간에 끊기면 조각이 남아 과금되는데, **`aws s3 ls` 로는 보이지 않습니다.**
> ```bash
> $ aws s3api list-multipart-uploads --bucket $BUCKET
> ```

### Step 6. 버킷 정책 — 특정 역할만 허용 (15분)

```bash
$ ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

$ cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCourseRoleReadOnly",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::$ACCOUNT:role/EC2-Course-Role" },
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::$BUCKET",
        "arn:aws:s3:::$BUCKET/*"
      ]
    },
    {
      "Sid": "DenyUnencryptedTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::$BUCKET",
        "arn:aws:s3:::$BUCKET/*"
      ],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    }
  ]
}
EOF

$ aws s3api put-bucket-policy --bucket $BUCKET --policy file://bucket-policy.json
```

**두 문장의 의미**

| Sid | 의미 |
|---|---|
| `AllowCourseRoleReadOnly` | EC2 역할에게 **읽기만** 허용 |
| `DenyUnencryptedTransport` ⭐ | **HTTP(평문) 접근을 전면 거부** — 실무 필수 패턴 |

> 💡 **`aws:SecureTransport` 조건은 모든 버킷 정책에 넣을 만합니다.** 보안 점검 도구가 반드시 확인하는 항목입니다.
> ⚠️ **ARN 두 개**(버킷·객체)를 모두 써야 합니다. `ListBucket` 은 버킷 ARN, `GetObject` 는 `/*` 가 붙은 객체 ARN을 씁니다. ([03강](../01-cloud-foundation/lesson-03.md)에서 배운 내용)

### Step 7. 정적 웹사이트 호스팅 — 그리고 왜 안 쓰는지 (10분)

```bash
$ WEB_BUCKET=course-web-hong-$(date +%Y%m%d)
$ aws s3api create-bucket --bucket $WEB_BUCKET --region ap-northeast-2 \
    --create-bucket-configuration LocationConstraint=ap-northeast-2

$ echo '<h1>Static site on S3</h1>' > index.html
$ echo '<h1>404</h1>' > error.html
$ aws s3 cp index.html s3://$WEB_BUCKET/
$ aws s3 cp error.html s3://$WEB_BUCKET/

$ aws s3 website s3://$WEB_BUCKET/ --index-document index.html --error-document error.html
```

**웹사이트 엔드포인트**

```
http://course-web-hong-20260813.s3-website.ap-northeast-2.amazonaws.com
```

지금 접속하면 **403**입니다. 퍼블릭 액세스 차단이 켜져 있기 때문입니다.

> 🔴 **여기서 멈춥니다.** 공개하려면 퍼블릭 액세스 차단을 끄고 `"Principal": "*"` 정책을 붙여야 하는데, **그것이 사고의 원인**입니다.

| 방식 | 보안 | HTTPS | 비용 | 권장 |
|---|---|---|---|---|
| S3 정적 웹사이트(공개) | 🚫 버킷 공개 필요 | ❌ **HTTP만** | 전송비 높음 | ❌ |
| **CloudFront + OAC** | ✅ **버킷 비공개 유지** | ✅ | 전송비 저렴 | ⭐ |

> ✅ **[14강](lesson-14.md)에서 CloudFront + OAC로 이 버킷을 안전하게 공개합니다.** 오늘은 "왜 직접 공개하면 안 되는지"를 이해하는 것으로 충분합니다.

### 💰 이번 강 비용

| 항목 | 프리 티어 | 이번 강 | 방치 시 월 |
|---|---|---|---|
| S3 Standard 저장 | ✅ **5GB**(12개월) | $0 | GB당 $0.025 |
| PUT/POST 요청 | ✅ 2,000건 | $0 | 1,000건당 $0.0045 |
| GET 요청 | ✅ 20,000건 | $0 | 1,000건당 $0.00035 |
| 데이터 전송(아웃) | ✅ 월 100GB | $0 | **GB당 $0.126** |
| 버전 관리 | — | $0 | **모든 버전이 과금** 🔴 |
| 수명 주기 전환 | — | $0 | 1,000건당 $0.01 |
| **합계** | | **$0** | 사용량 비례 |

> 🔴 **버전 관리 + 정리 규칙 없음 = 조용히 늘어나는 비용.**
> 수명 주기 규칙 `clean-old-versions` 를 반드시 함께 겁니다.

### 🧹 리소스 정리 체크리스트

**버전 관리 버킷은 일반 삭제로 지워지지 않습니다.**

```bash
# ❌ 이렇게 하면 실패
$ aws s3 rb s3://$BUCKET --force
remove_bucket failed: ... BucketNotEmpty

# ✅ 모든 버전과 삭제 마커를 지워야 함
$ aws s3api list-object-versions --bucket $BUCKET \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --output json > versions.json
$ aws s3api delete-objects --bucket $BUCKET --delete file://versions.json

$ aws s3api list-object-versions --bucket $BUCKET \
    --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' \
    --output json > markers.json
$ aws s3api delete-objects --bucket $BUCKET --delete file://markers.json

$ aws s3api delete-bucket --bucket $BUCKET

# 웹 버킷
$ aws s3 rb s3://$WEB_BUCKET --force
```

**정리 확인**

```bash
$ aws s3 ls
(빈 출력)

$ aws s3api list-multipart-uploads --bucket $BUCKET 2>/dev/null
(버킷이 없으므로 오류 = 정상)
```

- [ ] 버전 관리 버킷의 **모든 버전 + 삭제 마커** 삭제
- [ ] 버킷 삭제 (`aws s3 ls` 빈 출력)
- [ ] 미완료 멀티파트 업로드 없음 확인
- [ ] 로컬 임시 파일(`versions.json`, `markers.json` 등) 정리
- [ ] ⭐ [14강](lesson-14.md) 실습을 이어서 한다면 **웹 버킷은 유지해도 됩니다**

---

## ⑤ 자주 하는 실수

### 버킷 이름을 만들 수 없다

```
An error occurred (BucketAlreadyExists) when calling the CreateBucket operation:
The requested bucket name is not available. The bucket namespace is shared by all
users of the system.
```

**원인** — 버킷 이름은 **전 세계에서 고유**해야 합니다. `my-bucket`, `test`, `data` 같은 이름은 이미 존재합니다.
**해결** — 계정 ID·날짜·본인 식별자를 붙입니다.

```bash
$ BUCKET=course-s3-hong-$(aws sts get-caller-identity --query Account --output text)
```

**이름 규칙** — 소문자·숫자·하이픈·점만, 3~63자, IP 형식 불가, 점(`.`)은 HTTPS 인증서 문제로 비권장.

```
An error occurred (IllegalLocationConstraintException)
```
**원인** — 서울 리전인데 `--create-bucket-configuration LocationConstraint=ap-northeast-2` 를 빠뜨렸습니다.

### 버킷을 지울 수 없다

```
remove_bucket failed: s3://course-s3-hong-20260813
An error occurred (BucketNotEmpty) when calling the DeleteBucket operation:
The bucket you tried to delete is not empty. You must delete all versions in the bucket.
```

**원인** — **버전 관리가 켜진 버킷**에는 `--force` 로도 지워지지 않는 **이전 버전과 삭제 마커**가 남아 있습니다.
**해결** — 정리 체크리스트의 `list-object-versions` → `delete-objects` 절차를 씁니다.

**더 쉬운 방법** — 수명 주기 규칙으로 하루 만에 비우기.

```json
{"Rules":[{"ID":"nuke","Status":"Enabled","Filter":{},
  "Expiration":{"Days":1},
  "NoncurrentVersionExpiration":{"NoncurrentDays":1},
  "AbortIncompleteMultipartUpload":{"DaysAfterInitiation":1}}]}
```

> ⏱ 규칙은 하루에 한 번 실행되므로 즉시 사라지지는 않습니다.

### 파일이 안 보이는데 요금이 나온다

**원인 후보 2가지**

**① 이전 버전**

```bash
$ aws s3 ls s3://$BUCKET/ --recursive --summarize
Total Objects: 0
Total Size: 0

$ aws s3api list-object-versions --bucket $BUCKET \
    --query 'length(Versions)'
147          ← 실제로는 147개가 있다!
```

**② 미완료 멀티파트 업로드**

```bash
$ aws s3api list-multipart-uploads --bucket $BUCKET \
    --query 'Uploads[*].[Key,Initiated]' --output table
------------------------------------------------------
|  bigfile.zip  |  2026-07-02T11:03:22+00:00         |
------------------------------------------------------
```

**해결** — 수명 주기 규칙에 `NoncurrentVersionExpiration` 과 `AbortIncompleteMultipartUpload` 를 반드시 넣습니다.

> 💡 **S3 Storage Lens**(무료 대시보드)로 이런 숨은 용량을 한눈에 볼 수 있습니다.

### 버킷 정책을 저장할 수 없다

```
An error occurred (AccessDenied) when calling the PutBucketPolicy operation:
Access Denied
```

**원인 후보**

| 원인 | 해결 |
|---|---|
| **퍼블릭 액세스 차단**이 퍼블릭 정책을 막음 | `"Principal": "*"` 를 쓰려 했다면 **의도된 차단**입니다 |
| IAM 권한 부족 | `s3:PutBucketPolicy` 필요 |
| 정책 JSON 오류 | ARN·따옴표 확인 |

```
Invalid policy: Policy has invalid resource
```
**원인** — ARN 오타. 특히 **객체 ARN의 `/*`** 를 빠뜨리는 경우가 많습니다.

### `GetObject` 권한을 줬는데 목록이 안 보인다

```
An error occurred (AccessDenied) when calling the ListObjectsV2 operation
```

**원인** — `s3:GetObject`(객체 읽기)와 `s3:ListBucket`(목록 조회)은 **다른 권한**이고, **적용 대상 ARN도 다릅니다.**

| 액션 | Resource |
|---|---|
| `s3:ListBucket` | `arn:aws:s3:::my-bucket` (버킷) |
| `s3:GetObject` | `arn:aws:s3:::my-bucket/*` (객체) |

**해결** — 둘 다 각각의 ARN으로 지정합니다. (Step 6 정책 참고)

### 사전 서명 URL이 바로 만료된다

**원인 후보**

| 원인 | 해결 |
|---|---|
| `--expires-in` 기본값이 3600초(1시간) | 명시적으로 지정 |
| **임시 자격 증명(역할)으로 서명** | 🔴 **세션이 만료되면 URL도 무효** — 최대 유효 시간이 세션 남은 시간으로 제한 |
| 시스템 시간이 어긋남 | 시간 동기화 확인 |

> 💡 **역할로 서명한 URL은 아무리 `--expires-in` 을 길게 줘도 세션 만료 시각을 넘길 수 없습니다.**
> 장시간 유효한 URL이 필요하면 IAM 사용자 자격 증명으로 서명하거나, 애플리케이션이 필요할 때마다 새로 발급하는 구조로 갑니다.

### 스토리지 클래스를 바꿨는데 비용이 더 나왔다

**원인** — **최소 보관 기간**과 **검색 비용**입니다.

| 상황 | 결과 |
|---|---|
| Standard-IA에 넣고 10일 뒤 삭제 | **30일치 요금** 청구 |
| Glacier에 넣고 자주 조회 | **검색 비용**이 저장 비용을 초과 |
| 작은 파일 수백만 개를 IA로 전환 | **전환 요청 비용**(1,000건당 $0.01) + IA 최소 객체 크기 128KB 규칙 |

**해결** — 접근 패턴을 모르면 **Intelligent-Tiering**을 씁니다. AWS가 자동으로 계층을 옮기고, 최소 보관 기간·검색 비용이 없습니다(객체당 소액 모니터링 요금만).

---

## ⑥ 확인 문제

**1.** S3 버킷을 퍼블릭으로 열지 않고 웹에 이미지를 제공하는 방법 두 가지를 설명하고, 각각 언제 쓰는지 답하세요.

<details>
<summary>답 보기</summary>

**① CloudFront + OAC (Origin Access Control)** ⭐

```
 사용자 ──▶ CloudFront (공개) ──[서명된 요청]──▶ S3 (비공개)
```

버킷 정책은 **CloudFront 배포만** 허용합니다.

| 언제 | 상시 공개해야 하는 정적 자산 (이미지·CSS·JS) |
|---|---|
| 장점 | HTTPS · 엣지 캐싱 · **전송 비용 절감** · 버킷 완전 비공개 |
| 다음 강 | [14강](lesson-14.md)에서 실습 |

**② 사전 서명 URL(Presigned URL)**

앱 서버가 권한을 가지고 있고, 요청 시점에 **시간 제한 URL**을 만들어 줍니다.

| 언제 | 특정 사용자에게만·일시적으로 주는 파일 (주문서, 개인 다운로드) |
|---|---|
| 장점 | 정책 변경 불필요, 사용자별 통제 가능 |
| 주의 | **URL 자체가 자격 증명** — 유효 시간을 짧게 |

**선택 기준 한 줄**
- **누구나 봐도 되는 것** → CloudFront + OAC
- **그 사람만 봐야 하는 것** → 사전 서명 URL

> 반대로 **하면 안 되는 것** — 퍼블릭 액세스 차단을 끄고 `"Principal": "*"` 버킷 정책을 붙이는 것. 대형 유출 사고의 전형적 원인입니다.
</details>

**2.** 버전 관리를 켰더니 S3 비용이 3배가 됐습니다. 원인과 해결책은?

<details>
<summary>답 보기</summary>

**원인 — 덮어쓴 이전 버전이 모두 보존되어 각각 과금되고 있습니다.**

```
 report.pdf (10MB) 를 매일 갱신 → 30일 후
   현재 버전:   10MB
   이전 버전 29개: 290MB
   ─────────────────────
   과금 대상: 300MB (보이는 것의 30배)
```

**여기에 두 가지가 더 숨어 있습니다.**
- 삭제한 객체도 **삭제 마커 + 실제 데이터**가 남아 있음
- **미완료 멀티파트 업로드** 조각

**해결 — 수명 주기 규칙**

```json
{
  "Rules": [{
    "ID": "clean-old-versions",
    "Status": "Enabled",
    "Filter": {},
    "NoncurrentVersionTransitions": [
      { "NoncurrentDays": 7, "StorageClass": "STANDARD_IA" }
    ],
    "NoncurrentVersionExpiration": { "NoncurrentDays": 30 },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
```

**현재 상태 진단**

```bash
$ aws s3api list-object-versions --bucket $BUCKET --query 'length(Versions)'
$ aws s3api list-multipart-uploads --bucket $BUCKET
```

> **원칙** — **버전 관리를 켤 때는 수명 주기 규칙을 반드시 함께 겁니다.** 두 가지는 한 세트입니다.
</details>

**3.** 다음 5가지 데이터에 적합한 스토리지 클래스를 고르고 근거를 쓰세요.

```
㉮ 매일 조회되는 서비스 이미지
㉯ 접근 패턴을 전혀 예측할 수 없는 사용자 업로드 파일
㉰ 월 1회 정도 조회하는 지난 분기 리포트
㉱ 법규상 7년 보관해야 하는 감사 로그 (거의 안 봄)
㉲ 언제든 원본에서 다시 만들 수 있는 썸네일 이미지
```

<details>
<summary>답 보기</summary>

| 데이터 | 선택 | 근거 |
|---|---|---|
| ㉮ 매일 조회 이미지 | **Standard** | 접근이 잦아 검색 비용이 없는 것이 유리 |
| ㉯ 패턴 예측 불가 | **Intelligent-Tiering** ⭐ | AWS가 자동 계층화. **최소 보관 기간·검색 비용 없음** |
| ㉰ 월 1회 리포트 | **Standard-IA** | 접근이 드물어 저장비 절감(약 45%). 30일 최소 보관은 문제없음 |
| ㉱ 7년 감사 로그 | **Glacier Deep Archive** | GB당 $0.002로 가장 저렴. 복원 12시간이 걸려도 무방 |
| ㉲ 재생성 가능한 썸네일 | **One Zone-IA** | AZ 1곳에만 저장해 20% 더 저렴. **잃어도 원본에서 재생성 가능** |

**판단 3요소**

| 질문 | 영향 |
|---|---|
| 얼마나 자주 읽나 | 자주 → Standard, 드물게 → IA/Glacier |
| 얼마나 빨리 필요한가 | 즉시 → Glacier Instant, 몇 시간 OK → Deep Archive |
| 잃어도 되나 | 재생성 가능 → One Zone-IA |

**흔한 실수** — ㉲를 Deep Archive로 고르는 것. 썸네일은 **사용자 요청 시 즉시** 필요하므로 복원에 12시간이 걸리면 안 됩니다. "거의 안 본다"와 "느려도 된다"는 다른 조건입니다.
</details>

---

## 오늘의 정리

| 개념 | 핵심 |
|---|---|
| 객체 스토리지 | **폴더가 없다.** 키 전체가 이름. 부분 수정 불가 |
| 버킷 이름 | **전 세계 고유**. 서울은 `LocationConstraint` 필요 |
| 접근 제어 | **퍼블릭 차단 → 버킷 정책 → IAM 정책** 순 |
| 사전 서명 URL | 버킷 비공개 유지 + **시간 제한 접근**. URL 자체가 자격 증명 |
| 버전 관리 | 덮어쓰기·삭제 복구 가능. **끄지 못함(중지만)**. **비용 증가** |
| 삭제 마커 | 지우면 객체가 **부활** |
| 수명 주기 | 전환·삭제 + **이전 버전 정리 + 멀티파트 정리** ⭐ |
| 스토리지 클래스 | 최소 보관 기간과 **검색 비용**이 함정. 모르면 Intelligent-Tiering |
| ARN | 버킷(`:::b`)과 객체(`:::b/*`)가 **다르다** |

**한 장 요약**

```
  안전한 기본값:  퍼블릭 차단 ON + 기본 암호화 + 버전 관리 + 수명 주기
  공개가 필요하면: CloudFront + OAC (14강)
  개인에게만:      사전 서명 URL
  절대 하지 말 것: 퍼블릭 차단 OFF + Principal "*"
```

**오늘 반드시 기억할 한 가지**
> **S3는 기본이 비공개입니다. 그 기본값을 끄는 순간이 사고의 시작입니다.**
> 그리고 **버전 관리를 켜면 수명 주기 규칙도 함께** 겁니다.

**과제**
1. 버킷을 만들고 **퍼블릭 액세스 차단 4개 설정이 모두 `true`** 인 출력을 캡처하세요.
2. **사전 서명 URL 실험** — 유효 시간 안 성공 / 만료 후 실패 두 출력을 제출하세요.
3. **버전 복구 실험** — 3번 덮어쓰기 → 버전 목록 → 첫 버전으로 복구 → 삭제 → 삭제 마커 제거로 부활까지 전 과정 로그.
4. **수명 주기 규칙 JSON**을 제출하고, 4개 규칙이 각각 무엇을 막아 주는지 한 줄씩 설명하세요.
5. **스토리지 선택 리포트** — ⑥번 3번 문제의 5가지 데이터에 대해 클래스와 근거를 표로 정리하세요.
6. 정리 확인 — `aws s3 ls` 빈 출력.

---

[← 이전 12강](lesson-12.md) · [목차](README.md) · [다음 → 14강 EBS · EFS · CloudFront](lesson-14.md)
