---
layout: main
title:  "ConfyUI"
date:   2025-01-20 22:40:16 +0900
categories: 생성형AI
index : 3
post_layout: true
---

`기본적인 세팅`
- Primitive
- Load CheckPoint
- CLIP Text Encode (Prompt)
- KSampler
  - positive
  - negative
  - latent_image
  - Seed 독립 [Convert seed to Widget]

`ConfyUI 핵심`
- TEXT - TENSOR
- IMAGE - TENSOR
- TENSOR = NUMBER
- Conditioning Group을 이용해 Load Image 불러오기

`CLIP Text Encode`
- 프롬프트

`Apply ControlNet`
- Detected Image 세팅
- Strength
- Load ControlNet Model - OpenPose

`Controlnet`
- DetectedMap
- SD 1.5 / SDXL 
- Huging 에서 다운

`Sampling Group`
- Seed[노이즈를 만들 때 필요한 숫자] + 해상도

`KSampler` 
- 노이즈 생성이후 노이즈 제거
- Seed 
