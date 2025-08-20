document.addEventListener("DOMContentLoaded", () => {
  const sliders = document.querySelectorAll(".slider-container");

  sliders.forEach((container) => {
    const wrapper = container.querySelector(".slider-wrapper");
    const track = container.querySelector(".slider-track");
    const prevBtn = container.querySelector(".slider-btn.left");
    const nextBtn = container.querySelector(".slider-btn.right");
    const dotsContainer = container.querySelector(".slider-dots");
    const slides = container.querySelectorAll(".slider");
    const slideWidth = 360 + 32; // 슬라이드 + gap
    let scrollPos = 0;
    let currentIndex = 0;

    // 🔁 자동 슬라이드
    /*
    const autoScroll = () => {
      currentIndex = (currentIndex + 1) % slides.length;
      scrollPos = slideWidth * currentIndex;
      wrapper.scrollTo({ left: scrollPos, behavior: "smooth" });
      updateDots(currentIndex);
    };
    setInterval(autoScroll, 3000);
*/
    // ◀️▶️ 버튼 이동
    prevBtn.addEventListener("click", () => {
      currentIndex = Math.max(0, currentIndex - 1);
      scrollPos = slideWidth * currentIndex;
      wrapper.scrollTo({ left: scrollPos, behavior: "smooth" });
      updateDots(currentIndex);
    });

    nextBtn.addEventListener("click", () => {
      currentIndex = Math.min(slides.length - 1, currentIndex + 1);
      scrollPos = slideWidth * currentIndex;
      wrapper.scrollTo({ left: scrollPos, behavior: "smooth" });
      updateDots(currentIndex);
    });

    // 👀 버튼 표시 여부
    const updateArrowVisibility = () => {
      if (track.scrollWidth > wrapper.clientWidth) {
        prevBtn.style.display = "block";
        nextBtn.style.display = "block";
      } else {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      }
    };

    updateArrowVisibility();
    window.addEventListener("resize", updateArrowVisibility);

    // ⭕ DOT 생성 및 클릭 이벤트 연결
    const updateDots = (activeIndex) => {
      if (!dotsContainer) return;
      dotsContainer.querySelectorAll(".dot").forEach((dot, idx) => {
        dot.classList.toggle("active", idx === activeIndex);
      });
    };

    if (dotsContainer) {
      slides.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.classList.add("dot");
        if (index === 0) dot.classList.add("active");

        dot.addEventListener("click", () => {
          currentIndex = index;
          scrollPos = slideWidth * index;
          wrapper.scrollTo({ left: scrollPos, behavior: "smooth" });
          updateDots(index);
        });

        dotsContainer.appendChild(dot);
      });
    }
  });
});