import { createField } from "./field.js";
import { createPointer, updatePointer } from "./pointer.js";

const canvas = document.getElementById("field");
const field = createField(canvas);
const pointer = createPointer(window.innerWidth, window.innerHeight);

field.rebuild();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rebuild the grid on resize, but debounce it since it reallocates everything.
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    field.rebuild();
    if (reducedMotion) drawStatic();
  }, 150);
});

function drawStatic() {
  pointer.x = window.innerWidth / 2;
  pointer.y = window.innerHeight / 2;
  field.render(0, pointer);
}

if (reducedMotion) {
  // Honour the user's preference: a single still frame, no animation loop.
  drawStatic();
} else {
  const loop = (now) => {
    updatePointer(pointer, now, window.innerWidth, window.innerHeight);
    field.render(now, pointer);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
