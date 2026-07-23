# Google Contact Form — English Edition

한국어 폼의 영문 쌍둥이 문서. **설계 원칙·주의사항·폼 설정의 근거는 [CONTACT_FORM.md](CONTACT_FORM.md)에만
적는다** — 여기에는 영문 폼에 실제로 입력할 내용만 둔다. 문항을 고칠 때는 두 문서를 함께 갱신한다.

- 폼 제목: `Contact DOCU`
- 폼 주소를 넣는 곳: `_config.yml`의 `contact_form_url_en`
- 구조는 한국어 폼과 동일하다 — 공통 2섹션 + 유형별 6섹션, 총 8섹션.

**입력 방법** — 선택지 묶음은 줄바꿈으로 구분되어 있으므로 구글 폼의 첫 선택지 칸에 통째로 붙여 넣으면
각 줄이 개별 선택지로 분리된다. `※`로 시작하는 줄은 입력용이 아니라 작업 지시다.

## 폼 설정

한국어 폼과 동일하게 잡는다. 근거는 [CONTACT_FORM.md](CONTACT_FORM.md#폼-설정-문항보다-먼저) 참고.

| 설정 위치 | 값 |
| --- | --- |
| 설정 > 응답 > 이메일 주소 수집 | `응답자 입력` |
| 설정 > 응답 > 응답 사본 전송 | `요청 시` |
| 설정 > 응답 > 로그인 필요 | **해제** |
| 설정 > 응답 > 응답 편집 허용 | 켬 |
| 설정 > 프레젠테이션 > 진행률 표시줄 | 켬 |
| 응답 탭 > 스프레드시트 연결 + 이메일 알림 | 켬 |

> 파일 업로드 문항은 영문 폼에도 넣지 않는다. 하나라도 넣으면 폼 전체가 구글 로그인 필수가 된다.
> 한국어 폼과 **같은 스프레드시트에 연결**하면 응답이 두 시트 탭으로 모여 관리가 편하다.

**폼 설명**
```
Thank you for reaching out after visiting my portfolio site (redocu.github.io).
I'm open to job offers, headhunting, teaching, project collaboration and tool feedback.
I usually reply within 1-2 business days.
```

---

## Section 1 · Start

**Section title**
```
Getting started
```

**Section description**
```
Hello, this is DOCU. I usually review and reply to messages within 1-2 business days.
Pick the type of inquiry first and you'll only see the fields that apply. It takes 1-2 minutes.
```

**Q1 · Multiple choice · Required · Go to section based on answer**
```
What is your inquiry about?
```
```
Job offer (directly from a company)
Headhunting / search firm
Teaching, training or mentoring
Project request, contract work or collaboration
Feedback or bug report on a tool
Something else
```
※ Branching, in order: Section 2 / 3 / 4 / 5 / 6 / 7

**Q2 · Short answer · Required**
```
Your name
```

**Q3 · Short answer**
```
Company, organization or team
```
Description:
```
Leave this blank if you're reaching out as an individual.
```

---

## Section 2 · Job Offer

**Section title**
```
Job offer
```

**Q1 · Short answer · Required**
```
Company name
```

**Q2 · Short answer · Required**
```
Position title
```

**Q3 · Paragraph · Required**
```
Briefly describe the role and the team
```

**Q4 · Multiple choice · Required**
```
Employment type
```
```
Full-time
Contract
Intern (conversion to full-time)
Intern
Other
```

**Q5 · Checkboxes**
```
Technologies the role mainly involves
```
```
Unity
Unreal Engine
C / C++
C#
Python · AI · Computer vision
Web (Next.js, Node.js, etc.)
Other
```

**Q6 · Short answer**
```
Work location
```

**Q7 · Multiple choice**
```
Work arrangement
```
```
On-site
Hybrid
Fully remote
```

**Q8 · Short answer**
```
Salary range you can offer
```
Description:
```
An exact figure isn't necessary — a range is perfectly fine.
```

**Q9 · Short answer**
```
Link to the job posting
```

※ End of section: `Go to section 8 (Wrap-up)`

---

## Section 3 · Headhunting / Search Firm

**Section title**
```
Headhunting / search firm
```

**Section description**
```
If you can't disclose the client company yet, question 3 below has an option for that —
please go ahead and continue.
```

**Q1 · Short answer · Required**
```
Search firm / company name
```

**Q2 · Paragraph · Required**
```
Position overview (role, responsibilities, required experience)
```

**Q3 · Multiple choice · Required**
```
Can the client company be disclosed?
```
```
Yes, I can share it now
No, it's under NDA for the time being
I can share it after an initial call
```

**Q4 · Short answer**
```
Client company name, if you can share it
```

**Q5 · Checkboxes**
```
Industry / domain
```
```
Games
AI · Computer vision
Web services
EdTech
SI · Outsourcing
Other
```

**Q6 · Short answer**
```
Salary range you can offer
```

**Q7 · Multiple choice**
```
Current stage
```
```
Introducing the position
Collecting applications
Scheduling interviews
Urgent hire
```

**Q8 · Short answer**
```
Phone number I can reach you at
```

※ End of section: `Go to section 8 (Wrap-up)`

---

## Section 4 · Teaching / Training / Mentoring

**Section title**
```
Teaching, training or mentoring
```

**Q1 · Short answer · Required**
```
Institution or organization name
```

**Q2 · Multiple choice · Required**
```
Format
```
```
In-person class
Live online class
Pre-recorded course
1:1 mentoring
Guest lecture / seminar
Writing course material or content
```

**Q3 · Checkboxes · Required**
```
Topics you'd like covered
```
```
C / C++ game programming fundamentals
Unity client development
Vision AI model training and deployment
Claude Code · AI-assisted (vibe) coding
Web service development
Other
```

**Q4 · Short answer · Required**
```
Audience and expected number of participants
```

**Q5 · Short answer**
```
Total hours or number of sessions
```

**Q6 · Short answer**
```
Preferred timeframe
```

**Q7 · Short answer**
```
Venue (if in person)
```

**Q8 · Short answer**
```
Rate basis
```
Description:
```
Per hour, per session or total — whichever is easiest for you.
```

**Q9 · Paragraph**
```
Anything else you'd like to add
```

※ End of section: `Go to section 8 (Wrap-up)`

---

## Section 5 · Project / Contract / Collaboration

**Section title**
```
Project request, contract work or collaboration
```

**Q1 · Paragraph · Required**
```
Project overview
```

**Q2 · Checkboxes · Required**
```
Project type
```
```
Game
Web service
AI · Data
Automation tool
Educational content
Other
```

**Q3 · Multiple choice · Required**
```
How would you like me to be involved?
```
```
Contract work
Part-time contribution
Joining the team
Co-founding / equity
Not decided yet
```

**Q4 · Multiple choice**
```
Current status
```
```
Idea stage
Planning complete
In development
Live / in maintenance
```

**Q5 · Short answer**
```
Preferred timeline (start and expected end)
```

**Q6 · Short answer**
```
Budget range
```

**Q7 · Short answer**
```
Reference links (spec, repository, demo, etc.)
```

※ End of section: `Go to section 8 (Wrap-up)`

---

## Section 6 · Tool Feedback / Bug Report

**Section title**
```
Feedback or bug report
```

**Q1 · Multiple choice · Required**
```
Which project is this about?
```
```
ClaudeCockpit
Knowledge Sharing Center
EduCraft
CSGP framework
Puzzle Lab (Sudoku · Kakuro)
This website (redocu.github.io)
Other
```

**Q2 · Multiple choice · Required**
```
Type of message
```
```
Bug report
Feature suggestion
Question about usage
Praise / review
```

**Q3 · Paragraph · Required**
```
Please describe it in detail
```

**Q4 · Paragraph**
```
Steps to reproduce (for bugs, in order)
```

**Q5 · Short answer**
```
Version you're using
```
Description:
```
e.g. ClaudeCockpit v0.3.0
```

**Q6 · Short answer**
```
Environment (OS, browser, etc.)
```

**Q7 · Short answer**
```
Screenshot link
```
Description:
```
Please paste a link (Drive, image host). File uploads aren't accepted on this form.
```
※ 반드시 단답으로 둔다. 파일 업로드로 만들면 폼 전체가 구글 로그인 필수가 된다.

※ End of section: `Go to section 8 (Wrap-up)`

---

## Section 7 · Something Else

**Section title**
```
Something else
```

**Q1 · Paragraph · Required**
```
Your message
```

**Q2 · Short answer**
```
Reference link
```

※ End of section: `Go to section 8 (Wrap-up)`

---

## Section 8 · Wrap-up

**Section title**
```
Wrap-up
```

**Q1 · Multiple choice**
```
How soon do you need a reply?
```
```
Urgent (within 2-3 days)
Within a week
No rush
```

**Q2 · Paragraph**
```
Anything else you'd like to add
```

**Q3 · Checkboxes · Required · single item**
```
I consent to the collection and use of my personal information
```
```
I agree
```
Description:
```
Data collected: name, affiliation, email address, and the content of your inquiry
(plus your phone number if you choose to provide it).
Purpose: replying to your inquiry and any follow-up discussion.
Retention: one year after the inquiry is closed, then deleted.
You may decline, but in that case I won't be able to reply.
```

**Confirmation message** (Settings > Presentation > Confirmation message)
```
Thank you for getting in touch. I'll review your message and reply within 1-2 business days.
If it's urgent, feel free to email me directly at dlehrb103@gmail.com.
```
