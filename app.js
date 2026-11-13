/* ═══════════════════════════════════════════════════════════════
   URBAN RESILIENCE & SPATIAL DIAGNOSIS — KSAR EL BOUKHARI
   Presentation controller
   • Slide state management (currentSlideIndex)
   • Next / Prev buttons, dots, keyboard arrows, touch swipe
   • Top progress bar + slide counter
   • Local JPG/PNG image loader for every interactive frame
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── 1. Core references ─────────────────────────────────────── */
  const slides      = Array.from(document.querySelectorAll(".slide"));
  const totalSlides = slides.length;

  const progressFill = document.getElementById("progressFill");
  const slideCounter = document.getElementById("slideCounter");
  const dotsWrap     = document.getElementById("dots");
  const prevBtn      = document.getElementById("prevBtn");
  const nextBtn      = document.getElementById("nextBtn");

  if (!totalSlides) return;

  let currentSlideIndex = 0;

  /* ── 2. Build slide indicator dots ──────────────────────────── */
  const dots = slides.map(function (slide, index) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", "Go to slide " + (index + 1) + ": " + (slide.dataset.title || ""));
    dot.title = slide.dataset.title || "Slide " + (index + 1);
    dot.addEventListener("click", function () { goToSlide(index); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  /* ── 3. Render current state ────────────────────────────────── */
  function render() {
    slides.forEach(function (slide, index) {
      const isActive = index === currentSlideIndex;

      slide.classList.toggle("is-active", isActive);
      slide.classList.toggle("is-before", index < currentSlideIndex);
      slide.classList.toggle("is-after",  index > currentSlideIndex);

      slide.setAttribute("aria-hidden", String(!isActive));
      if ("inert" in slide) slide.inert = !isActive;
      if (isActive) slide.scrollTop = 0;
    });

    dots.forEach(function (dot, index) {
      const isActive = index === currentSlideIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });

    /* Progress bar — advancement across the whole deck */
    const progress = ((currentSlideIndex + 1) / totalSlides) * 100;
    progressFill.style.width = progress + "%";

    /* Counter — 01 / 05 */
    slideCounter.textContent =
      String(currentSlideIndex + 1).padStart(2, "0") +
      " / " +
      String(totalSlides).padStart(2, "0");

    /* Boundary buttons */
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === totalSlides - 1;

    /* URL hash keeps the deck deep-linkable */
    const hash = "#slide-" + (currentSlideIndex + 1);
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash);
    }

    document.title =
      (slides[currentSlideIndex].dataset.title || "Presentation").replace(/&amp;/g, "&") +
      " — Urban Resilience & Spatial Diagnosis";
  }

  /* ── 4. Navigation API ──────────────────────────────────────── */
  function goToSlide(index) {
    const target = Math.min(Math.max(index, 0), totalSlides - 1);
    if (target === currentSlideIndex) return;
    currentSlideIndex = target;
    render();
  }

  function nextSlide() { goToSlide(currentSlideIndex + 1); }
  function prevSlide() { goToSlide(currentSlideIndex - 1); }

  /* ── 5. Controls ────────────────────────────────────────────── */
  prevBtn.addEventListener("click", prevSlide);
  nextBtn.addEventListener("click", nextSlide);

  document.addEventListener("keydown", function (event) {
    const tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    switch (event.key) {
      case "ArrowRight":
      case "PageDown":
        event.preventDefault();
        nextSlide();
        break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        prevSlide();
        break;
      case "Home":
        event.preventDefault();
        goToSlide(0);
        break;
      case "End":
        event.preventDefault();
        goToSlide(totalSlides - 1);
        break;
      default:
        break;
    }
  });

  /* Touch swipe (tablets / touch projectors) */
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener("touchstart", function (event) {
    const t = event.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  document.addEventListener("touchend", function (event) {
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx < 0 ? nextSlide() : prevSlide();
    }
  }, { passive: true });

  /* ── 6. Local image loader for every frame ──────────────────── */
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

  document.querySelectorAll("[data-frame]").forEach(function (frame) {
    const input = frame.querySelector(".img-frame__input");
    const img   = frame.querySelector(".img-frame__img");
    if (!input || !img) return;

    /* Shared loader: read any local image into this frame */
    function loadFile(file) {
      if (!file) return;

      if (ACCEPTED.indexOf(file.type) === -1) {
        window.alert("Please select a JPG, PNG or WebP image file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (loadEvent) {
        img.src = loadEvent.target.result;
        frame.classList.add("has-image");
        frame.classList.remove("is-dragover");
        frame.setAttribute(
          "aria-label",
          "Loaded image: " + file.name + ". Click to swap with another local image."
        );
      };
      reader.onerror = function () {
        window.alert("The image could not be read. Please try another file.");
      };
      reader.readAsDataURL(file);
    }

    /* Click anywhere on the placeholder box → open the file dialog */
    frame.addEventListener("click", function () {
      input.value = "";
      input.click();
    });

    /* Keyboard accessibility (frame is role="button") */
    frame.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input.value = "";
        input.click();
      }
    });

    /* Load the chosen local JPG/PNG directly into the presentation */
    input.addEventListener("change", function () {
      loadFile(input.files && input.files[0]);
    });

    /* Drag & drop a local image onto the frame */
    frame.addEventListener("dragenter", function (event) {
      event.preventDefault();
      frame.classList.add("is-dragover");
    });
    frame.addEventListener("dragover", function (event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      frame.classList.add("is-dragover");
    });
    frame.addEventListener("dragleave", function () {
      frame.classList.remove("is-dragover");
    });
    frame.addEventListener("drop", function (event) {
      event.preventDefault();
      frame.classList.remove("is-dragover");
      loadFile(event.dataTransfer.files && event.dataTransfer.files[0]);
    });

    /* Hover zoom origin — zoom follows the cursor */
    frame.addEventListener("mousemove", function (event) {
      const rect = frame.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      frame.style.setProperty("--ox", x.toFixed(2) + "%");
      frame.style.setProperty("--oy", y.toFixed(2) + "%");
    });

    frame.addEventListener("mouseleave", function () {
      frame.style.setProperty("--ox", "50%");
      frame.style.setProperty("--oy", "50%");
    });
  });

  /* ── 7. Boot: honour #slide-N deep link ─────────────────────── */
  (function initFromHash() {
    const match = /^#slide-(\d+)$/.exec(window.location.hash || "");
    if (match) {
      const requested = parseInt(match[1], 10) - 1;
      if (requested >= 0 && requested < totalSlides) currentSlideIndex = requested;
    }
  })();

  window.addEventListener("hashchange", function () {
    const match = /^#slide-(\d+)$/.exec(window.location.hash || "");
    if (match) goToSlide(parseInt(match[1], 10) - 1);
  });

  render();
})();
