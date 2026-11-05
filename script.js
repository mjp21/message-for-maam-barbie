document.addEventListener("DOMContentLoaded", () => {
  // Background music: visitors start it themselves because browsers block autoplay.
  const music = document.getElementById("backgroundMusic");
  const musicButton = document.getElementById("musicToggle");
  const musicLabel = musicButton ? musicButton.querySelector(".music-label") : null;

  function updateMusicButton(isPlaying) {
    if (!musicButton) return;
    musicButton.classList.toggle("is-playing", isPlaying);
    musicButton.setAttribute("aria-pressed", String(isPlaying));
    musicButton.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    if (musicLabel) musicLabel.textContent = isPlaying ? "Pause music" : "Play music";
  }

  function startBackgroundMusic() {
    if (!music) return;
    // Called directly from the visitor's envelope click/keypress, so browsers
    // are more likely to allow playback than if we wait for an animation timer.
    const playRequest = music.play();
    if (playRequest && typeof playRequest.then === "function") {
      playRequest.then(() => updateMusicButton(true))
        .catch(() => {
          if (musicLabel) musicLabel.textContent = "Tap Play music";
          musicButton?.setAttribute("aria-label", "Play background music");
        });
    }
  }
  if (music && musicButton) {
    musicButton.addEventListener("click", async () => {
      if (music.paused) {
        try {
          await music.play();
          updateMusicButton(true);
        } catch (error) {
          if (musicLabel) musicLabel.textContent = "Tap to play";
        }
      } else {
        music.pause();
        updateMusicButton(false);
      }
    });

    music.addEventListener("ended", () => updateMusicButton(false));
    music.addEventListener("pause", () => updateMusicButton(false));
    music.addEventListener("play", () => updateMusicButton(true));
  }


  // Mobile navigation
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const opened = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(opened));
      menuButton.textContent = opened ? "✕" : "☰";
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "☰";
    }));
  }

  // Reveal sections while scrolling
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  // Falling flower petals
  const petals = document.querySelector(".petals");
  if (petals && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    function addPetal() {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.textContent = Math.random() > 0.5 ? "✿" : "❀";
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.fontSize = `${10 + Math.random() * 10}px`;
      petal.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      petal.style.animationDuration = `${9 + Math.random() * 8}s`;
      petals.appendChild(petal);
      setTimeout(() => petal.remove(), 18000);
    }
    for (let i = 0; i < 8; i++) setTimeout(addPetal, i * 450);
    setInterval(addPetal, 1500);
  }

  // Envelope opens the appreciation letter
  const envelope = document.getElementById("envelope");
  const letter = document.getElementById("letter");
  const hint = document.getElementById("envelopeHint");
  const closeButton = document.getElementById("closeLetter");
  const skipTypingButton = document.getElementById("skipTyping");
  let typingTimers = [];
  let typingActive = false;

  function clearTypingTimers() {
    typingTimers.forEach(timer => clearTimeout(timer));
    typingTimers = [];
  }

  function showFullLetter() {
    clearTypingTimers();
    typingActive = false;
    if (!letter) return;
    letter.querySelectorAll("[data-typing-original]").forEach(element => {
      element.textContent = element.dataset.typingOriginal;
      element.removeAttribute("data-typing-original");
      element.classList.remove("typing-cursor");
    });
    if (skipTypingButton) skipTypingButton.hidden = true;
  }

  function startLetterTyping() {
    if (!letter) return;
    clearTypingTimers();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const textElements = Array.from(letter.querySelectorAll("p"))
      .filter(element => element.textContent.trim().length > 0);

    if (reduceMotion) {
      if (skipTypingButton) skipTypingButton.hidden = true;
      return;
    }

    typingActive = true;
    if (skipTypingButton) skipTypingButton.hidden = false;

    const originals = textElements.map(element => {
      const original = element.textContent;
      element.dataset.typingOriginal = original;
      element.textContent = "";
      return { element, original };
    });

    let itemIndex = 0;
    let charIndex = 0;

    function typeNextCharacter() {
      if (!typingActive || itemIndex >= originals.length) {
        showFullLetter();
        return;
      }

      const current = originals[itemIndex];
      current.element.classList.add("typing-cursor");
      current.element.textContent = current.original.slice(0, charIndex + 1);
      charIndex += 1;

      if (charIndex >= current.original.length) {
        current.element.classList.remove("typing-cursor");
        current.element.removeAttribute("data-typing-original");
        itemIndex += 1;
        charIndex = 0;
        typingTimers.push(setTimeout(typeNextCharacter, 260));
      } else {
        typingTimers.push(setTimeout(typeNextCharacter, 9));
      }
    }

    typeNextCharacter();
  }

  if (skipTypingButton) {
    skipTypingButton.addEventListener("click", showFullLetter);
  }

  function openLetter() {
    if (!envelope || !letter || envelope.classList.contains("open")) return;
    startBackgroundMusic();
    envelope.classList.add("open");
    if (hint) hint.textContent = "A letter prepared especially for you";
    setTimeout(() => {
      letter.classList.add("show");
      letter.setAttribute("aria-hidden", "false");
      if (closeButton) closeButton.hidden = false;
      startLetterTyping();
      letter.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 700);
  }

  if (envelope) {
    envelope.addEventListener("click", openLetter);
    envelope.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLetter();
      }
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      showFullLetter();
      letter.classList.remove("show");
      letter.setAttribute("aria-hidden", "true");
      envelope.classList.remove("open");
      closeButton.hidden = true;
      if (hint) hint.textContent = "Click the envelope to open your letter";
      envelope.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
});
