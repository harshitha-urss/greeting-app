const $ = (id) => document.getElementById(id);

const nameInput = $("nameInput");
const greetBtn = $("greetBtn");
const greetingEl = $("greeting");

const confettiCanvas = $("confettiCanvas");
const glowLayer = $("glowLayer");
const burstLayer = $("burstLayer");

const modes = ["confetti", "glow", "burst"];
const reduceMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Ensure only one animation runs at a time:
// - stopCurrent cancels timers/raf and clears any running effects.
let stopCurrent = null;

function pickRandomMode() {
  return modes[Math.floor(Math.random() * modes.length)];
}

function stopAnimation() {
  if (typeof stopCurrent === "function") stopCurrent();
  stopCurrent = null;
}

function startConfetti() {
  const ctx = confettiCanvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  // Match canvas to viewport (with DPR) so particles render crisply.
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  confettiCanvas.width = w;
  confettiCanvas.height = h;

  ctx.clearRect(0, 0, w, h);

  const durationMs = 1400;
  const start = performance.now();

  const rand = (min, max) => min + Math.random() * (max - min);
  const colors = [
    "#7ad2ff",
    "#7a57ff",
    "#ff5ea8",
    "#7dff9b",
    "#ffd35a",
    "#58a6ff",
    "#f79fff",
  ];

  const count = 160;
  const originX = w * (0.35 + Math.random() * 0.3);
  const originY = h * (0.2 + Math.random() * 0.15);

  const particles = Array.from({ length: count }, () => {
    const speed = rand(4.2, 10.5) * dpr;
    const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15);
    return {
      x: originX + rand(-14, 14) * dpr,
      y: originY + rand(-8, 8) * dpr,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      g: rand(0.16, 0.28) * dpr,
      rot: rand(0, Math.PI),
      vr: rand(-0.18, 0.18),
      size: rand(5, 10) * dpr,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: rand(0.75, 1.0),
    };
  });

  let rafId = 0;
  let lastT = performance.now();

  function frame(t) {
    const dt = Math.min(1.5, (t - lastT) / 16.666);
    lastT = t;

    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.life -= 0.004 * dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      const alpha = Math.max(0, p.life);
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      // Use rectangles (more festive than circles for confetti).
      ctx.fillRect(-p.size * 0.5, -p.size * 0.18, p.size, p.size * 0.36);
      ctx.restore();
    }

    if (t - start < durationMs) {
      rafId = window.requestAnimationFrame(frame);
      return;
    }

    // Clear the last drawn frame so the background resets even if
    // the user waits before the next click.
    ctx.clearRect(0, 0, w, h);
    stopCurrent = null;
  }

  rafId = window.requestAnimationFrame(frame);

  stopCurrent = () => {
    window.cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, w, h);
  };
}

function startGlow() {
  const hue = Math.floor(Math.random() * 360);
  const x = `${Math.floor(20 + Math.random() * 60)}%`;
  const y = `${Math.floor(15 + Math.random() * 55)}%`;

  glowLayer.style.setProperty("--glow-hue", hue);
  glowLayer.style.setProperty("--x", x);
  glowLayer.style.setProperty("--y", y);

  // Restart animation reliably: remove then re-add.
  glowLayer.classList.remove("is-running");
  // Force reflow so the same class triggers animation again.
  glowLayer.offsetHeight;
  glowLayer.classList.add("is-running");

  const onEnd = () => {
    glowLayer.classList.remove("is-running");
    glowLayer.removeEventListener("animationend", onEnd);
    stopCurrent = null;
  };

  glowLayer.addEventListener("animationend", onEnd);

  stopCurrent = () => {
    glowLayer.classList.remove("is-running");
    glowLayer.removeEventListener("animationend", onEnd);
  };
}

function startBurst() {
  const rand = (min, max) => min + Math.random() * (max - min);
  const hue = Math.floor(Math.random() * 360);

  burstLayer.innerHTML = "";

  const burstCount = 22;
  const durationMs = 1100;

  const created = [];
  for (let i = 0; i < burstCount; i++) {
    const el = document.createElement("span");
    el.className = "burst";

    const size = rand(10, 18);
    const x = `${rand(20, 80)}%`;
    const y = `${rand(18, 70)}%`;
    const delay = rand(0, 180);
    const localHue = (hue + Math.floor(rand(-55, 55)) + 360) % 360;
    const dur = Math.floor(durationMs + rand(-150, 250));

    el.style.setProperty("--size", `${size}px`);
    el.style.setProperty("--x", x);
    el.style.setProperty("--y", y);
    el.style.setProperty("--hue", localHue);
    el.style.setProperty("--delay", `${delay}ms`);
    el.style.setProperty("--duration", `${dur}ms`);

    burstLayer.appendChild(el);
    created.push(el);
  }

  const timeoutId = window.setTimeout(() => {
    burstLayer.innerHTML = "";
  }, durationMs + 300);

  stopCurrent = () => {
    window.clearTimeout(timeoutId);
    burstLayer.innerHTML = "";
    for (const el of created) el.remove();
  };
}

function startRandomBackgroundAnimation() {
  stopAnimation();
  const mode = pickRandomMode();
  if (mode === "confetti") return startConfetti();
  if (mode === "glow") return startGlow();
  return startBurst();
}

greetBtn.addEventListener("click", () => {
  const name = (nameInput.value || "").trim();
  greetingEl.textContent = name ? `Hello ${name}` : "Hello";

  // Randomly trigger one of the three animations per click.
  if (reduceMotion) {
    stopAnimation();
    return;
  }
  startRandomBackgroundAnimation();
});

// Optional: allow Enter to greet (nice UX).
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") greetBtn.click();
});

// Keep placeholder behavior: focus input on load.
nameInput?.focus?.();

