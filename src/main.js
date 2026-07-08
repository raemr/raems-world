import { createField } from "./field.js";
import { createPointer, updatePointer } from "./pointer.js";
import { createThemeController } from "./theme.js";

const canvas = document.getElementById("field");
const themeToggle = document.getElementById("theme-toggle");
const field = createField(canvas);
const pointer = createPointer(window.innerWidth, window.innerHeight);
const theme = createThemeController();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    requestAnimationFrame(loop);
  }
}

start();
