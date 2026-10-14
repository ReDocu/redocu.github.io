---
layout: doc
title: "CharacterChat 기술명세서"
description: "무엇을 만들었나 — 화면 구성, 기능 목록, 캐릭터·저장 데이터 모델, LLM 응답 규격, 외부 API 명세."
permalink: /projects/character-chat/spec/
---

이 문서는 "무엇을 만들었나"를 명세 형태로 정리한다. 기준일은 2026-10-15. 구현 방식은 [기술문서]({{ '/projects/character-chat/tech/' | relative_url }})에 있다.

## 1. 화면

| 화면 | 구성 |
|---|---|
| 인트로 | 한강 노을 배경 + 대표 캐릭터, 제목, 캐릭터 한마디, 시작 버튼 (Enter 가능). 시작하면 캐릭터가 윙크하고 사라진다. 캐릭터를 아직 고르지 않았을 때만 나온다 |
| 캐릭터 선택 | 캐릭터 카드(기본 포즈 그림, 이름·나이, 한 줄 소개). 그림 없는 캐릭터는 이름 첫 글자. 고른 캐릭터는 주소 `?c=<id>`로 유지 |
| 이름 입력 | 첫 방문만. 캐릭터가 부를 이름 |
| 대화 화면 | 상단 바(호감도 게이지·단계, 시각·날씨, 메뉴 버튼 7개) · 스테이지(배경 + 캐릭터) · 대사 박스(이름·대사, 재시도·재생성) · 입력줄(입력, 🎤, 전송, ▶ 혼잣말, 중지) |

**상단 바 메뉴**

| 버튼 | 다이얼로그 | 내용 |
|---|---|---|
| 👥 | 캐릭터 선택 | 다른 캐릭터로 바꾼다 (저장은 캐릭터별) |
| ⚙ | 설정 | LLM 주소·모델·API 키·temperature·최대 토큰·텍스트 속도·JSON 강제·사고 끄기, STT·TTS 주소, 사는 곳·날씨·위경도, 연결 테스트 |
| 👤 | 내 정보 | 이름, 호칭·성별·나이·직업·외모·성격·좋아하는 것·싫어하는 것·기타, "처음부터 안다 / 대화하며 알아간다" |
| 📜 | 대화 로그 | 전체 대화, 캐릭터 대사 옆에 당시 포즈 썸네일. 열람 전용 |
| 📖 | 이야기 로그 | 공략 기록(맨 위) + 사건 목록 |
| 💭 | 캐릭터의 메모 | 캐릭터가 사용자에 대해 적은 1인칭 메모. 항목별 삭제 가능 |
| 💾 | 저장 관리 | JSON 내보내기, 처음부터 |

![캐릭터의 메모](/projects/character-chat/img/notes.webp)

![대화 로그 — 당시 포즈 썸네일](/projects/character-chat/img/log.webp)

## 2. 기능 목록

| ID | 기능 | 상태 |
|---|---|---|
| F-01 | LLM 연결 설정 · 연결 테스트(모델 목록) | 완료 |
| F-02 | 캐릭터 카드 로드 · 캐릭터 선택 · 20세 미만 카드 거부 | 완료 |
| F-03 | 스트리밍 대화 · 중지 · 60초 타임아웃 · 재시도 | 완료 |
| F-04 | 구조화 응답 파싱 (JSON 스키마 강제 + 실패 시 원문 표시) | 완료 |
| F-05 | 포즈 자동 전환 · 옷차림 고정/갈아입기 | 완료 |
| F-06 | 대사 타이핑 · 클릭/Space로 건너뛰기 · `*행동*` 회색 기울임 | 완료 |
| F-07 | 자동 저장/복원 (IndexedDB) · JSON 내보내기 | 완료 |
| F-08 | 호감도 5단계 · 레벨업 토스트 · 단계별 해금 | 완료 |
| F-08a | 공략 완료 · 회상 요약 · 공략 기록 | 완료 |
| F-09 | 사건·메모 기억 | 단순형 완료 (점수 검색·망각은 계획) |
| F-10 | 배경 전환 | 완료 |
| F-11 | 대화 로그 · 마지막 응답 재생성 | 완료 |
| F-14 | 음성 입력 (로컬 STT) | 완료 |
| F-15 | 음성 출력 (로컬 TTS) | 완료 |
| — | 현실 시간·일정·날씨 연동, 재방문 시 먼저 말 걸기, 혼잣말 | 완료 |
| — | 인트로 화면 | 완료 |
| F-12 | 선택지 이벤트 | 계획 |
| F-13 | 캐릭터 가져오기 | 계획 |

## 3. 데이터 모델 — 캐릭터

캐릭터 추가 = `characters/<id>/` 폴더 + `characters/index.json`에 id 추가.

**`card.json`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `id`, `name`, `age` | string, string, int | `age` 20 미만이면 로드 거부 |
| `persona`, `speechStyle`, `relationship` | string | 성격 · 말투 · 사용자와의 관계 |
| `greeting`, `entrance` | string | 첫 인사 · 대화 맨 앞 입장 지문 |
| `defaultPose` | string | 기본 포즈 ID |
| `outfits` | `{ id: { desc, pose } }` | 옷차림별 설명과 기본 포즈 |
| `schedule`, `scheduleDefault` | `[{ days, from, to, doing, place }]` | 요일·시간별 일정 (자정 넘김 허용) |
| `lore` | `[{ keys, text, minLevel?, belowLevel? }]` | 캐릭터의 과거. 키워드가 나오면 넣고, 단계 미달이면 회피 지시만 |
| `loreRules` | string | 과거를 지어내지 않게 하는 규칙 |
| `exampleDialogues` | `[{ user, char, pose }]` | 응답 형식 예시 |

**`poses.json`** — `[{ id, file, desc, outfit, minAffectionLv? }]`. 비어 있으면(`[]`) 그림 없이 이름표와 대사만 나온다.

**`backgrounds.json`** — `[{ id, file, desc, minAffectionLv? }]`.

## 4. 데이터 모델 — 저장

**진행 상태** (IndexedDB `cc_save_<캐릭터>`)

```json
{
  "characterId": "soyang",
  "userName": "준호",
  "affection": 34,
  "currentPose": "12",
  "currentBg": "02",
  "messages": [
    { "role": "user", "content": "...", "ts": 1760000000000 },
    { "role": "assistant", "content": "...", "pose": "12", "aff": 2, "bg": "02",
      "outfit": "sport", "event": "...", "memo": "...", "ts": 1760000060000 },
    { "role": "user", "content": "*(숨은 지문)*", "hidden": true, "ts": 1760000120000 }
  ],
  "cleared": { "at": 1760000000000, "turns": 120 },
  "story": "연인이 되기까지의 1인칭 회상"
}
```

- `affection`은 `messages[].aff`의 누적 합(하한 0)으로 다시 계산된다.
- `hidden` 메시지는 로그에 보이지 않는다 (혼잣말·재방문 지시).

**공략 기록** (IndexedDB `cc_clears_<캐릭터>`) — `[{ at, turns, userName, story }]`. 초기화해도 남는다.

**설정·프로필** (localStorage `cc_settings`, `cc_profile`) — 캐릭터 공통.

## 5. LLM 응답 규격

| 필드 | 타입 | 규칙 |
|---|---|---|
| `dialogue` | string | 필수. 1~3문장, 행동 묘사는 `*…*` |
| `pose` | string | 현재 옷차림·해금된 포즈 ID. 목록에 없으면 직전 포즈 유지 |
| `background` | string | 장소가 바뀔 때만 ID, 아니면 `""` |
| `outfit` | string | 갈아입을 때만 옷차림 ID, 아니면 `""` |
| `affection` | int | -2 ~ 2로 clamp. 진심 어린 말 +1~+2, 무례 -1~-2 |
| `event` | string | 의미 있는 사건을 3인칭 한 줄로, 잡담이면 `""` |
| `memo` | string | 사용자에 대해 새로 안 것·감정 변화를 캐릭터 1인칭 한 줄로, 없으면 `""` |

파싱 실패 시: 응답 원문을 대사로 표시하고 포즈·배경·호감도는 바꾸지 않는다.

## 6. 외부 API

모두 사용자가 설정에서 주소를 정한다. 기본값은 같은 PC의 로컬 서버다.

| 대상 | 요청 | 비고 |
|---|---|---|
| LLM 대화 | `POST {baseUrl}/chat/completions` — `stream: true`, `response_format: json_schema`, 선택 `reasoning_effort: "none"` | SSE `data:` 줄에서 `choices[0].delta.content` 누적 |
| LLM 회상 요약 | `POST {baseUrl}/chat/completions` — 비스트리밍, `max_tokens: 800` | 공략 완료 시 1회 |
| 모델 목록 | `GET {baseUrl}/models` | 연결 테스트 |
| 음성 입력 | `POST {sttUrl}` multipart — `file`(16kHz WAV), `model=whisper-1`, `language=ko` | 응답 `text` |
| 음성 출력 | `GET {ttsUrl}/tts?text=…&text_lang=ko&ref_audio_path=…&prompt_lang=ko&prompt_text=…` | `<audio>`로 재생 |
| 날씨 | `GET api.open-meteo.com/v1/forecast?latitude&longitude&current=temperature_2m,weather_code` | 5초 타임아웃, 실패 시 날씨 없이 진행. 30분마다 갱신 |

## 7. 예외 처리

| 상황 | 처리 |
|---|---|
| LLM 서버 미실행 · CORS | 배너로 안내, 누르면 설정 열림 |
| 60초 초과 | 배너 + 재시도 버튼 |
| 사용자 중지 | 받은 만큼으로 마무리, 받은 게 없으면 취소 |
| JSON 깨짐 | 원문을 대사로 표시 |
| 없는 포즈·배경 ID | 직전 상태 유지 |
| 그림 로드 실패 | 기본 포즈로 대체 |
| IndexedDB 열기 실패 | 배너로 알리고 중단 |
| 회상 요약 실패 | 다음 응답 뒤 다시 시도 |
| 마이크 · STT · TTS 실패 | 토스트로 안내 |
