---
layout: main
title:  "언리얼 개발 강의 관련 커리큘럼 연구 노트 1주차"
date:   2025-01-09 23:00:00 +0900
categories: 언리얼
index : 1
post_layout: true
---

<h4>Level Editor 구성요소 </h4>

- Level Editor Overview
- Select Editing Mode
- Viewport 1 - Navigating Within the Viewport
- Viewport 2 - Moving, Rotating, and Scaling
- Viewport 3 - Snapping
- Viewport 4 - Different Ways To View Your Level
- Content Browser 1 - Overview & Finding Content
- Content Browser 2 - Adding, Importing, and Saving
- Content Browser 3 - The Settings Menu
- Content Browser 4 - Content Browser Windows
- Details Panel 1 - Details Panel Interface
- Details Panel 2 - The Transform Category
- Outliner

<h4>Actor의 요소</h4>

- Static Meshes
- Brushes
- Materials
- Lights
- Atmosphere & Clouds
- Player Start
- Components
- Volumes

<h4>Empty Level에서</h4>

<h5>실습</h5>

1. Sky 만들기
- Sky Atmosphere
- DirectionLight [Movable]
- VolumetricCloud
- SkyLight [Real Time Capture]
- ExponentialHeightFog [Fog Density : 0.0001]

2. 플레이어 공간
- Box [Transform : 0/0/-5 , Brush Settings : 2800/5000/10]
- Box [Transform : 0/8700/-5 , Brush Settings : 2800/10000/10]
- StartContent - M_Ground_Grass 추가
- Materials - M_Ground_Grass
- PlayerStart 위치 설정
- Alt Key를 활용한 Box 복붙
- Box - LeftWall [Transform : 1350/5600/200, Brush Settings : 2800/10000/10]
- Box - RightWall [Transform : -1350/5600/200, Brush Settings : 2800/10000/10]
- Box - TopWall [Transform : 0/13500/200, Brush Settings : 2600/100/400]
- Box - BottomWall [Transform : 0/-2450/200, Brush Settings : 2600/100/400]

3. 플레이어 공간 꾸미기
- Box - Low Wall Bottom Left [Transform : 900/5900/100 ,Brush Settings : 800/200/200]
- Box - Low Wall Bottom Right [Transform : -900/5900/100 ,Brush Settings : 800/200/200]
- Box - Low Wall Top Left [Transform : 700/8500/100 ,Brush Settings : 800/200/200]
- Box - Low Wall Top Right [Transform : -700/8500/100 ,Brush Settings : 1200/200/200]
- Box - Platform Block 1 [Transform : 900/5900/100 ,Brush Settings : 1200/200/200]
- Box - Platform Block 2 [Transform : 900/5900/100 ,Brush Settings : 1200/200/200]
- Box - Platform Block 3 [Transform : 900/5900/100 ,Brush Settings : 1200/200/200]
- Materials - M_CobbleStone_Rough