---
layout: main
title:  "언리얼 - VR 강의 [방탈출 게임을 위한 Gimmick만들기] - 1차"
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

<span class="image fit"><img src="/images/post_image/VR_03_1-9.png" alt="" /></span>

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

  - Widget을 이용하여 힌트만들기
  <span class="image fit"><img src="/images/post_image/VR_03_1-10.png" alt="" /></span>


### 3교시
- Gimmick 여러개 기획하고 만들어보기

## `2일차`

### 1교시
- Widget 관리하기
  - UI 모드를 전환할 수 있는 Menu에서의 코드 가져오기
    - MotionController 변수 만들어주기
    - BeginPlay
    <span class="image fit"><img src="/images/post_image/VR_03_2-1.png" alt="" /></span>
      - EnableInput
      - Add Mapping Context
      - SetWidget Interaction Reference
    - ClosePad
    <span class="image fit"><img src="/images/post_image/VR_03_2-2.png" alt="" /></span>
    - IA_Menu_Interact_[Left/Right]_Pressed
    <span class="image fit"><img src="/images/post_image/VR_03_2-3.png" alt="" /></span>
    - 지속적으로 플레이어를 바라보게 하기
    <span class="image fit"><img src="/images/post_image/VR_03_2-4.png" alt="" /></span>
  - VRPawn에서 Toggle Menu 바꿔주기
    <span class="image fit"><img src="/images/post_image/VR_03_2-5.png" alt="" /></span>
    - 오른쪽 왼쪽에 따른 구분 지어주기
    - Pad로 돌아와 Pad가 바라보는 방향 지정해주기
    - Pad 껐다 키면서 Show Debug 설정해주기
  - Password Widget 생성 이후, Password 입력 Gimmick 만들기
    - Widget 구성하기
    <span class="image fit"><img src="/images/post_image/VR_03_2-6.png" alt="" /></span>
    - 버튼 구성하기
    <span class="image fit"><img src="/images/post_image/VR_03_2-7.png" alt="" /></span>
    - 텍스트 조정하는 함수 만들기
    <span class="image fit"><img src="/images/post_image/VR_03_2-8.png" alt="" /></span>
    - 형태 구성하기
    <span class="image fit"><img src="/images/post_image/VR_03_2-9.png" alt="" /></span>
    - 디스패처 연결하기
    <span class="image fit"><img src="/images/post_image/VR_03_2-10.png" alt="" /></span>

### 2교시
- 아이텝 집고 넣기
  - 현재 집고 있는 GrabComponent Actor 가져오기 및 세팅해주기
   <span class="image fit"><img src="/images/post_image/VR_03_2-11.png" alt="" /></span>
    - CurrentGrabComponentLeft : GrabComponent
    - CurrentGrabComponentLeft : GrabComponent
    - 변수 세팅해주기
    - 초기화도 해주기
    - Pulled도 세팅했기 때문에 같이 해주기
  - Input 추가하기
    - IA_Grab_Take_Left : A
    - IA_Grab_Take_Right : X 
    - Default에 넣어주기
  - GrabComponent에 아이템 타입 설정하기
    - E_ItemType
      - 아이템 타입
    - ST_ItemType
      - Name : String
      - Actor : Actor
      - type : E_ItemType
    - GrabComponent에 E_ItemType 변수 추가하기
  - BP_Inven_Component
    - Slot : ST_ItemType - Array
    - 아이템 추가하기 : AddItem
    - 아이템 삭제하기 : RemoveItem
  - VRPawn 세팅하기
    - TakeItem
    <span class="image fit"><img src="/images/post_image/VR_03_2-12.png" alt="" /></span>
    - Actor Disable [삭제하지 않고, 어딘가에 보관해 놓기]
    <span class="image fit"><img src="/images/post_image/VR_03_2-13.png" alt="" /></span>

### 3교시
- 특정 아이템을 먹으면 문이 열리는 콘텐츠를 구현해봅시다.
  - VR에 TakeItem Bind 추가하기
  <span class="image fit"><img src="/images/post_image/VR_03_2-14.png" alt="" /></span>
  - Gimmick 블루프린트
  <span class="image fit"><img src="/images/post_image/VR_03_2-15.png" alt="" /></span>
  - BP_Inven에 FindItem 추가하기
  <span class="image fit"><img src="/images/post_image/VR_03_2-16.png" alt="" /></span>


## `3일차`

### 1교시
- 블루프린트 만들기
  - WB_ItemList
  - WB_ItemObjectListEntry

  - WB_ItemObjectListEntry - Class Setting으로 오버라이드 해주기
    - 변수
      - ItemData : ST Item Type
      - Select : Boolean
    <span class="image fit"><img src="/images/post_image/VR_03_3-1.png" alt="" /></span>
    - 오버라이드 한 함수로 값 설정해주기
      - 선택한 객체 색깔 미리 저장해주기
  
  - WB_ItemList
    - TileView 세팅해주기
    <span class="image fit"><img src="/images/post_image/VR_03_3-2.png" alt="" /></span>
    - 함수 생성하기 [Tile 리셋 이후 갱신하는 Update]
    <span class="image fit"><img src="/images/post_image/VR_03_3-3.png" alt="" /></span>
    - WB_ItemList에서 버튼 설정해주기
    <span class="image fit"><img src="/images/post_image/VR_03_3-4.png" alt="" /></span>
   
  - VRPawn
    - UpdateInvenWidget 세팅해주기
    <span class="image fit"><img src="/images/post_image/VR_03_3-5.png" alt="" /></span>
    - SelectItem : ST Item Type 변수 추가하기
    - Set Select Item 생성 이후 버튼 클릭시 Select 되도록 선정하기
    <span class="image fit"><img src="/images/post_image/VR_03_3-6.png" alt="" /></span>
    - 추가하기
    <span class="image fit"><img src="/images/post_image/VR_03_3-7.png" alt="" /></span>

- 선택한 아이템 출력하기
  - [ActorDisable] VRPawn Actor 위치 설정하는 곳 [ActorDisable] 에서 위치값 조정해주기
    <span class="image fit"><img src="/images/post_image/VR_03_3-8.png" alt="" /></span>
  - SpawnItem 함수 만들기
    <span class="image fit"><img src="/images/post_image/VR_03_3-9.png" alt="" /></span>

### 2교시

- 기믹과 연결하기


### 3교시


## `4일차`

- 간단한 요소로 방탈출 게임 만들기

## `5일차`

- 시험 및 실습

## 참고 강의

https://www.youtube.com/watch?v=lN3b6Bc_hk4&list=PLf7ONQN30DwNaHw5xMIheVtUjb3P3KXhH

