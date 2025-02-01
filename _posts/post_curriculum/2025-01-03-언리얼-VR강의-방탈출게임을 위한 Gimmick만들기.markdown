---
layout: main
title:  "언리얼 - VR 강의 [방탈출 게임을 위한 Gimmick만들기]"
date:   2025-01-03 00:00:00 +0900
categories: 언리얼
index : 3
post_layout: true
---

## `기본구성`

<div class="row">
    <div class="col-6 col-12-xsmall">
    <ol>
      <li><a href="#1일차">방탈출 구현을 위한 요소 만들기</a></li>
      <li><a href="#2일차">Widget 관리하기</a></li>
      <li><a href="#3일차">목차3</a></li>
      <li><a href="#4일차">목차4</a></li>
      <li><a href="#5일차">목차5</a></li>
    </ol>
  </div>
</div>

<hr/>

## `1일차`

### 1교시

<span class="image fit"><img src="/images/post_image/VR_03_1일차_01.png" alt="" /></span>

- 기믹 환경 만들어보기
  - BP_Door 구성하기
  - Static Mesh 설정하기 
  - TimeLine 만들기- 문에 대한 설정 조정하기
  <span class="image fit"><img src="/images/post_image/VR_03_1-1.png" alt="" /></span>
  
  - BP_Gimmick 만들기
    - IsComplete : boolean 변수만들기
    - Event Dispatcher 구성하기 : QuestComplete 
  <span class="image fit"><img src="/images/post_image/VR_03_1-2.png" alt="" /></span>
   
  - BP_GimmickComponent 만들기
    - BP_Gimmick을 담고 있는 컴포넌트 생성하기
    - 컴포넌트에 있는 Complete 확인하여 클리어 구현하기
  <span class="image fit"><img src="/images/post_image/VR_03_1-3.png" alt="" /></span>

  - BP_Door에서 BP_GimmickComponent 연결하기
    - QuestComplete를 실행할 때마다 문이 열릴 수 있는 결과 확인하기
  <span class="image fit"><img src="/images/post_image/VR_03_1-4.png" alt="" /></span>

  - BP_SubGimmick
    - Box 만들고, Casting을 이용해 객체 필터링해서 OnCheckQuest 만들기
  <span class="image fit"><img src="/images/post_image/VR_03_1-5.png" alt="" /></span>

### 2교시

- Resources - Gimmicks 가져오기
  - 리소스 가져오기

- 버튼 만들기
  - BP_Gimmick 자식으로 BP_PhysicsButton 생성
  - 컴포넌트 구성 - Button - Box Collision
  - BoxCollision[Collision Preset - OverlapAllDynamic]
  - OnComponentBeginOverlap / OnComponentOverlap
  - TimeLine 만들기
    - ButtonTimeline을 더블 클릭하여 Float Track 추가
    - Key 0: Time = 0.0, Value = 0.0
    - Key 1: Time = 0.1, Value = 1.0
  - Lerp(기본 위치, 눌린 위치, Timeline 값)
  - 변수 구성
    - InitialLocation : Vector
    - PressedOffset : Vector
  - Event Begin Play - Set InitialLocation = ButtonMesh.WorldLocation
  - OnComponentBeginOverlap (Box Collision)
    - Play (ButtonTimeline)
  - OnComponentEndOverlap (Box Collision)
    - Reverse (ButtonTimeline)
  - ButtonTimeline Update
    - Set ButtonMesh.WorldLocation = Lerp(InitialLocation, InitialLocation - (0,0,5), Timeline Alpha)
  <span class="image fit"><img src="/images/post_image/VR_03_1-6.png" alt="" /></span>

- 서랍 만들기
  - SkeletalMesh 만들기
  - 소켓 생성하기
  - SkeletalMesh - GrabComponent 세팅하기
  - 변수 만들기
    - Grabbed : boolean
    - GrabLocation : Vector
  - 초기값 세팅하기
  <span class="image fit"><img src="/images/post_image/VR_03_1-7.png" alt="" /></span>
  - Grab 해서 내적을 통해 앞쪽으로 움직이는 손을 움직이기
  <span class="image fit"><img src="/images/post_image/VR_03_1-8.png" alt="" /></span>

- 레바 만들기


### 3교시
- Gimmick 상태 확인하는 Widget[World] 만들기

## `2일차`

### 1교시
- Widget 관리하기
- 인벤토리 만들기
- 수집한 아이템 인벤토리에 넣기

### 2교시
- 인벤토리에서 아이템 선택하기
- 아이템 스폰하기

### 3교시
- 특정 아이템을 먹으면 문이 열리는 콘텐츠를 구현해봅시다.

## `3일차`

### 1교시



### 2교시

### 3교시

## `4일차`

- 간단한 요소로 방탈출 게임 만들기

## `5일차`

- 시험 및 실습

## 참고 강의

https://www.youtube.com/watch?v=lN3b6Bc_hk4&list=PLf7ONQN30DwNaHw5xMIheVtUjb3P3KXhH

