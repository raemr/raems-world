import { config } from "./config.js";

// Tracks the raw pointer, exposes a smoothed position, and falls back to a
// slow drift when the pointer has been still or has left the window.
export function createPointer(width, height) {
  const p = {
    rawX: width / 2,
    rawY: height / 2,
    x: width / 2,
    y: height / 2,
    vx: 0, // smoothed velocity of the eased position, px/frame
    vy: 0,
    speed: 0,
    ax: width / 2, // heavily-lagged anchor for the big ambient mass
    ay: height / 2,
    ambientHistory: [],
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

  const prevX = p.x;
  const prevY = p.y;
  p.x += (tx - p.x) * config.pointerLerp;
  p.y += (ty - p.y) * config.pointerLerp;

  // Track how fast the eased position is moving, smoothed so the void warp
  // builds and relaxes fluidly instead of snapping.
  p.vx += (p.x - prevX - p.vx) * config.velocitySmoothing;
  p.vy += (p.y - prevY - p.vy) * config.velocitySmoothing;
  p.speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

  p.ambientHistory.push({ t: now, x: p.x, y: p.y });
  const followAt = now - config.ambientFollowDelay;
  while (p.ambientHistory.length > 2 && p.ambientHistory[1].t <= followAt) {
    p.ambientHistory.shift();
  }

  let targetAx = p.ax;
  let targetAy = p.ay;
  const first = p.ambientHistory[0];
  const second = p.ambientHistory[1];
  if (second && first.t <= followAt) {
    const span = second.t - first.t || 1;
    const t = (followAt - first.t) / span;
    targetAx = first.x + (second.x - first.x) * t;
    targetAy = first.y + (second.y - first.y) * t;
  } else if (first && first.t <= followAt) {
    targetAx = first.x;
    targetAy = first.y;
  }

  // The ambient mass is its own thing: a big region that follows a delayed
  // cursor sample, then eases toward it, so it has both a time lag and drift.
  p.ax += (targetAx - p.ax) * config.ambientLerp;
  p.ay += (targetAy - p.ay) * config.ambientLerp;
}
