---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matrix Effect</title>
  <style>
    body {
      background-color: black;
      overflow: hidden;
      margin: 0;
      display: absolute;
      justify-content: center;
      align-items: center;s
      height: 30vh;
    }
    .matrix-text {
      color: rgba(0, 255, 0, 0.1);
      font-family: 'Courier New', monospace;
      font-size: 20px;
      position: absolute;
      white-space: nowrap;
      display: absolute;
      flex-wrap: wrap;
    }
    .letter {
      display: inline-block;
      animation: falling 5s linear infinite, flicker 0.2s infinite alternate;
      text-shadow: 0 0 10px lime;
    }
    @keyframes falling {
      from {
        transform: translateY(-100%);
      }
      to {
        transform: translateY(100vh);
      }
    }
    @keyframes flicker {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
    .start-button {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background-color: rgba(0, 255, 0, 0.1);
      color: lime;
      border: none;
      cursor: pointer;
    }

    .start-button:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
  </style>
</head>
<body>
  <button class="start-button" onclick="startMatrixEffect()">REDOCUSPACE 블로그로 이동합니다.</button>
  <div class="matrix-text"></div>

  <script>
    const characters = 'REDOCUSPACE 블로그로 이동합니다.';
    const numberOfLines = 20;
    const lineSpeeds = [];
    const container = document.querySelector('.matrix-text');
    let isMatrixEffectStarted = false;

    // Create random speed for each line
    for (let i = 0; i < numberOfLines; i++) {
      lineSpeeds.push(Math.random() * 5 + 2);
    }

    function createMatrixEffect() {
      for (let i = 0; i < numberOfLines; i++) {
        const text = generateRandomString(Math.floor(Math.random() * 50) + 20);
        const line = document.createElement('div');
        line.className = 'line';
        line.style.animationDuration = lineSpeeds[i] + 's';

        for (let j = 0; j < text.length; j++) {
          const letter = document.createElement('span');
          letter.textContent = text[j];
          letter.className = 'letter';
          letter.style.animationDelay = (j * lineSpeeds[i] / text.length) + 's';
          line.appendChild(letter);
        }
        container.appendChild(line);
      }
    }

    function generateRandomString(length) {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }

    createMatrixEffect();
    function startMatrixEffect() {
      if (!isMatrixEffectStarted) {
        window.location.href = "/main";
        isMatrixEffectStarted = true;
      }
    }
  </script>
</body>
</html>