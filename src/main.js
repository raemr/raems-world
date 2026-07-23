import { createField } from "./field.js";
import { createPointer, updatePointer } from "./pointer.js";
import { createThemeController } from "./theme.js";

const canvas = document.getElementById("field");
const themeToggle = document.getElementById("theme-toggle");
const pointer = createPointer(window.innerWidth, window.innerHeight);
const theme = createThemeController();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const field = createField(canvas, {
  reducedMotion,
  onNeedsRedraw: () => drawStatic(performance.now()),
});

// The "move your cursor" hint has served its purpose the moment the cursor
// (or a touch) moves, so fade it out on the first interaction.
const hint = document.querySelector(".hint");
const dismissHint = () => hint && hint.classList.add("hint--dismissed");
window.addEventListener("pointermove", dismissHint, { once: true });
window.addEventListener("pointerdown", dismissHint, { once: true });

// CV reveal. field.js drives the canvas transition (parting the sea, morphing
// RAEM into the corner logo) and emits phase events; the DOM CV overlay is
// toggled in response so it emerges as the water recedes.
const body = document.body;
const cv = document.querySelector(".cv");
window.addEventListener("field:clearing", () => {
  body.classList.add("is-clearing");
  body.classList.remove("is-closing");
});
window.addEventListener("field:cv", () => {
  body.classList.remove("is-clearing");
  body.classList.add("is-cv");
  if (cv) cv.removeAttribute("inert");
});
window.addEventListener("field:closing", () => {
  body.classList.remove("is-cv");
  body.classList.add("is-closing");
  if (cv) cv.setAttribute("inert", "");
});
window.addEventListener("field:field", () => {
  body.classList.remove("is-clearing", "is-closing", "is-cv");
  if (cv) cv.setAttribute("inert", "");
});

// Return to the field: click the corner logo or press Escape.
const cvLogo = document.querySelector(".cv-logo");
if (cvLogo) cvLogo.addEventListener("click", () => field.close());
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && body.classList.contains("is-cv")) field.close();
});

function updateThemeToggleLabel() {
  const nextMode = theme.mode === "dark" ? "light" : "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${nextMode} mode`);
}

themeToggle.addEventListener("click", () => {
  theme.toggle();
  updateThemeToggleLabel();
  if (reducedMotion) drawStatic(performance.now());
});
updateThemeToggleLabel();

function drawStatic(now = 0) {
  pointer.x = window.innerWidth / 2;
  pointer.y = window.innerHeight / 2;
  field.render(now, pointer, theme.update(now));
}

async function start() {
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('400 16px "IBM Plex Mono"'),
        document.fonts.load('700 96px "Fraunces"'),
        document.fonts.load('italic 700 96px "Fraunces"'),
      ]);
      await document.fonts.ready;
    } catch {
      // The fallback stacks are good enough to render if remote fonts fail.
    }
  }

  field.rebuild();

  // Rebuild the grid on resize, but debounce it since it reallocates everything.
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      field.rebuild();
      if (reducedMotion) drawStatic();
    }, 150);
  });

  if (reducedMotion) {
    // Honour the user's preference: a single still frame, no animation loop.
    drawStatic();
  } else {
    const loop = (now) => {
      const palette = theme.update(now);
      updatePointer(pointer, now, window.innerWidth, window.innerHeight);
      field.render(now, pointer, palette);
      requestAnimationFrame(loop);
    };
    // Paint the first frame synchronously so the field appears immediately after
    // rebuild rather than waiting for the first rAF (avoids a brief blank/dark
    // gap right after load); the loop then sustains itself.
    loop(performance.now());
  }
}

start();
