import { createNoise3D } from "simplex-noise";

const noise3D = createNoise3D();

// Flow field sampled in [0, 1].
export function fieldNoise(x, y, t) {
  return noise3D(x, y, t) * 0.5 + 0.5;
}

export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Smooth Hermite interpolation between two edges. Works in either direction
// (edge0 > edge1 gives a falling ramp), matching the GLSL smoothstep.
export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
