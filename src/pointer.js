import { config } from "./config.js";

// Tracks the raw pointer, exposes a smoothed position, and falls back to a
// slow drift when the pointer has been still or has left the window.
export function createPointer(width, height) {
  const p = {
    rawX: width / 2,
    rawY: height / 2,
    x: width / 2,
    y: height / 2,
    lastMove: -Infinity,
    inside: false,
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      p.rawX = e.clientX;
      p.rawY = e.clientY;
      p.lastMove = performance.now();
      p.inside = true;
    },
    { passive: true }
  );
  window.addEventListener("pointerdown", (e) => {
    p.rawX = e.clientX;
    p.rawY = e.clientY;
    p.lastMove = performance.now();
    p.inside = true;
  });
  window.addEventListener("pointerout", (e) => {
    if (!e.relatedTarget) p.inside = false;
  });
  window.addEventListener("blur", () => {
    p.inside = false;
  });

  return p;
}

export function updatePointer(p, now, width, height) {
  const idle = !p.inside || now - p.lastMove > config.idleTimeout;

  let tx = p.rawX;
  let ty = p.rawY;

  if (idle) {
    // A gentle Lissajous wander around the centre so the piece stays alive
    // with no input.
    const cx = width / 2;
    const cy = height / 2;
    const a = now * config.idleDriftSpeed;
    tx = cx + Math.cos(a) * width * 0.26 + Math.cos(a * 0.37) * width * 0.1;
    ty = cy + Math.sin(a * 1.3) * height * 0.28 + Math.sin(a * 0.53) * height * 0.08;
  }

  p.x += (tx - p.x) * config.pointerLerp;
  p.y += (ty - p.y) * config.pointerLerp;
}
