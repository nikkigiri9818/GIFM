"use strict";
/* =========================================================
   GIFM — effects.js
   1) Testimonial slider  ([data-slider])
   2) Cursor spotlight on cards (adds data-spot)
   Works on index.html and webinar.html, independent of app.js / webinar.js
   ========================================================= */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 1) Testimonial slider ---------- */
  function initSlider(root) {
    const viewport = root.querySelector(".ts-viewport");
    const track = root.querySelector(".ts-track");
    const cards = [...track.children];
    const prev = root.querySelector(".ts-btn.prev");
    const next = root.querySelector(".ts-btn.next");
    const dotsWrap = root.querySelector(".ts-dots");
    const bar = root.querySelector(".ts-progress span");
    const delay = reduce ? 0 : Number(root.dataset.autoplay) || 0;

    let page = 0;
    let pages = 1;
    let timer = 0;
    let raf = 0;
    let dragging = false;
    let hovering = false;
    let visible = true;

    const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = () => cards[0].getBoundingClientRect().width + gap();
    const perView = () =>
      Math.max(1, Math.round((viewport.clientWidth + gap()) / step()));
    const clamp = (n) => Math.max(0, Math.min(pages - 1, n));

    function buildDots() {
      pages = Math.max(1, cards.length - perView() + 1);
      dotsWrap.replaceChildren();
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "ts-dot";
        dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        dot.addEventListener("click", () => {
          goTo(i);
          restart();
        });
        dotsWrap.append(dot);
      }
      update();
    }

    function update() {
      page = clamp(Math.round(viewport.scrollLeft / step()));
      const first = page;
      const last = page + perView() - 1;
      dotsWrap.querySelectorAll(".ts-dot").forEach((d, i) =>
        d.classList.toggle("active", i === page),
      );
      cards.forEach((c, i) => c.classList.toggle("is-active", i >= first && i <= last));
      prev.disabled = page === 0;
      next.disabled = page >= pages - 1;
    }

    function goTo(i) {
      viewport.scrollTo({
        left: clamp(i) * step(),
        behavior: reduce ? "auto" : "smooth",
      });
    }

    /* autoplay with a progress bar */
    function stopBar() {
      if (!bar) return;
      bar.style.animation = "none";
      bar.style.width = "0";
    }
    function startBar() {
      if (!bar || !delay) return;
      bar.style.animation = "none";
      void bar.offsetWidth; // restart the animation
      bar.style.animation = "tsfill " + delay + "ms linear forwards";
    }
    function stop() {
      clearTimeout(timer);
      timer = 0;
      stopBar();
    }
    function play() {
      stop();
      if (!delay || hovering || dragging || !visible || document.hidden) return;
      startBar();
      timer = setTimeout(() => {
        goTo(page >= pages - 1 ? 0 : page + 1);
        play();
      }, delay);
    }
    function restart() {
      stop();
      play();
    }

    prev.addEventListener("click", () => {
      goTo(page - 1);
      restart();
    });
    next.addEventListener("click", () => {
      goTo(page + 1);
      restart();
    });
    viewport.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    });
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(page + 1);
        restart();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(page - 1);
        restart();
      }
    });

    /* mouse drag (touch uses native swipe) */
    let startX = 0;
    let startLeft = 0;
    viewport.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startLeft = viewport.scrollLeft;
      viewport.classList.add("dragging");
      viewport.setPointerCapture(e.pointerId);
      stop();
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      viewport.scrollLeft = startLeft - (e.clientX - startX);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("dragging");
      goTo(Math.round(viewport.scrollLeft / step()));
      play();
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    /* pause while the user is looking at it */
    root.addEventListener("mouseenter", () => {
      hovering = true;
      stop();
    });
    root.addEventListener("mouseleave", () => {
      hovering = false;
      play();
    });
    root.addEventListener("focusin", () => {
      hovering = true;
      stop();
    });
    root.addEventListener("focusout", () => {
      hovering = false;
      play();
    });
    document.addEventListener("visibilitychange", restart);
    window.addEventListener("resize", () => {
      buildDots();
      goTo(page);
    });

    /* fade-up on first view, and only autoplay while on screen */
    root.classList.add("ts-ready");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) root.classList.add("in");
          restart();
        },
        { threshold: 0.25 },
      ).observe(root);
    } else {
      root.classList.add("in");
      play();
    }

    buildDots();
  }
  document.querySelectorAll("[data-slider]").forEach(initSlider);

  /* ---------- 2) Cursor spotlight on cards ---------- */
  const spotSelector = [
    ".learning-grid article",
    ".batch-grid article",
    ".steps li",
    ".problem",
    ".benefit",
    ".bonus",
    ".ag-item",
    ".ts-card",
  ].join(",");
  const spotCards = document.querySelectorAll(spotSelector);
  spotCards.forEach((card) => card.setAttribute("data-spot", ""));
  /* ---------- 3) Mentor Gallery Slider (Left-to-Right) ---------- */
  function initMentorSlider() {
    const wrap = document.getElementById("mentorSliderWrap");
    if (!wrap) return;

    const track = document.getElementById("mentorSliderTrack");
    const slides = wrap.querySelectorAll(".mentor-slide");
    const prevBtn = document.getElementById("mentorPrevBtn");
    const nextBtn = document.getElementById("mentorNextBtn");
    const dots = wrap.querySelectorAll(".mentor-dot");

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoPlayTimer = null;
    let isPaused = false;

    function updateSlider(index) {
      currentIndex = (index + totalSlides) % totalSlides;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      dots.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === currentIndex);
      });
    }

    function nextSlide() {
      updateSlider(currentIndex + 1);
    }

    function prevSlide() {
      updateSlider(currentIndex - 1);
    }

    function startAutoPlay() {
      stopAutoPlay();
      if (!isPaused && !reduce) {
        autoPlayTimer = setInterval(nextSlide, 3500);
      }
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        nextSlide();
        startAutoPlay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        prevSlide();
        startAutoPlay();
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        updateSlider(idx);
        startAutoPlay();
      });
    });

    wrap.addEventListener("mouseenter", () => {
      isPaused = true;
      stopAutoPlay();
    });

    wrap.addEventListener("mouseleave", () => {
      isPaused = false;
      startAutoPlay();
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    wrap.addEventListener(
      "touchstart",
      (e) => {
        isPaused = true;
        stopAutoPlay();
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true },
    );

    wrap.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 35) {
          if (diff > 0) {
            nextSlide();
          } else {
            prevSlide();
          }
        }
        isPaused = false;
        startAutoPlay();
      },
      { passive: true },
    );

    startAutoPlay();
  }

  /* ---------- 4) Live Classroom Video Slider ---------- */
  function initVideoSlider() {
    const root = document.querySelector("[data-video-slider]");
    if (!root) return;

    const viewport = root.querySelector(".vslider-viewport");
    const track = root.querySelector(".vslider-track");
    const prevBtn = document.querySelector(".vslider-btn.prev");
    const nextBtn = document.querySelector(".vslider-btn.next");
    const dotsWrap = root.querySelector(".vslider-dots");
    const cards = [...track.querySelectorAll(".vslider-card")];
    const videos = [...track.querySelectorAll(".vcard-video")];

    if (!cards.length) return;

    // Single active video playback management
    videos.forEach((video) => {
      const cardMedia = video.closest(".vcard-media");
      const playBtn = cardMedia ? cardMedia.querySelector(".vcard-play-btn") : null;

      function updatePlayState(isPlaying) {
        if (cardMedia) {
          cardMedia.classList.toggle("is-playing", isPlaying);
        }
      }

      video.addEventListener("play", () => {
        // Pause all other videos
        videos.forEach((other) => {
          if (other !== video && !other.paused) {
            other.pause();
          }
        });
        updatePlayState(true);
      });

      video.addEventListener("pause", () => {
        updatePlayState(false);
      });

      video.addEventListener("ended", () => {
        updatePlayState(false);
      });

      if (playBtn) {
        playBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        });
      }

      // Clicking video toggles play if paused
      video.addEventListener("click", () => {
        if (video.paused) {
          video.play();
        }
      });
    });

    function getGap() {
      return parseFloat(getComputedStyle(track).gap) || 24;
    }

    function getStep() {
      return cards[0].getBoundingClientRect().width + getGap();
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      cards.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "vslider-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", "Go to video " + (i + 1));
        dot.addEventListener("click", () => {
          goToIndex(i);
        });
        dotsWrap.appendChild(dot);
      });
    }

    function update() {
      const step = getStep();
      const current = Math.min(cards.length - 1, Math.max(0, Math.round(viewport.scrollLeft / step)));

      if (dotsWrap) {
        const dots = dotsWrap.querySelectorAll(".vslider-dot");
        dots.forEach((dot, i) => {
          dot.classList.toggle("active", i === current);
        });
      }

      if (prevBtn) prevBtn.disabled = viewport.scrollLeft <= 5;
      if (nextBtn) {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth - 5;
        nextBtn.disabled = viewport.scrollLeft >= maxScroll;
      }
    }

    function goToIndex(index) {
      const step = getStep();
      viewport.scrollTo({
        left: index * step,
        behavior: reduce ? "auto" : "smooth"
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const step = getStep();
        viewport.scrollBy({ left: -step, behavior: reduce ? "auto" : "smooth" });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const step = getStep();
        viewport.scrollBy({ left: step, behavior: reduce ? "auto" : "smooth" });
      });
    }

    let raf = 0;
    viewport.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    });

    // Mouse Drag support for desktop
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    viewport.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isDown = true;
      viewport.classList.add("is-dragging");
      startX = e.pageX - viewport.offsetLeft;
      scrollLeft = viewport.scrollLeft;
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const walk = (x - startX) * 1.4;
      viewport.scrollLeft = scrollLeft - walk;
    });

    function endDrag() {
      if (!isDown) return;
      isDown = false;
      viewport.classList.remove("is-dragging");
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // Pause videos when section scrolls out of view
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            videos.forEach((v) => {
              if (!v.paused) v.pause();
            });
          }
        });
      }, { threshold: 0.1 });
      observer.observe(root);
    }

    window.addEventListener("resize", () => {
      update();
    });

    buildDots();
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initMentorSlider();
      initVideoSlider();
    });
  } else {
    initMentorSlider();
    initVideoSlider();
  }
})();