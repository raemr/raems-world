// Every tunable in one place so the look is easy to dial in.
export const config = {
  // Typography
  fontFamily:
    'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  fontSizeMin: 12,
  fontSizeMax: 16,
  lineHeightRatio: 1.16, // cell height = fontSize * this

  // Palette (Claude light mode, warm cream). All tonal variation comes from
  // opacity, never color.
  bg: "#f2ead6",
  ink: "#2b2a27",

  // Cursor zones, in CSS pixels, measured from the (smoothed) pointer.
  //   dist < voidRadius        -> cell is dropped; the surrounding words draw
  //                               the (irregular) outline of the empty space
  //   voidRadius .. personal   -> "about you" words, high opacity
  //   personal .. ambient      -> abstract ambient words, medium opacity
  //   dist > ambient           -> meta easter-egg phrases, low opacity
  voidRadius: 64,
  personalRadius: 130,
  // The ambient mass is large and decoupled from the cursor: its centre is a
  // heavily-lagged anchor (see ambientLerp), so it sits there and drifts slowly
  // rather than tracking the pointer. Void + personal still hug the cursor.
  ambientRadius: 320,
  ambientLerp: 0.005, // how slowly the ambient anchor chases the cursor
  // How wide (px) the tier opacity blends across a zone boundary. The zones
  // still decide which words go where, but this keeps the boundaries from ever
  // reading as visible rings.
  tierBlend: 72,

  // The void is never a drawn circle. Its radius wobbles with the flow field,
  // so the empty space is an irregular blob whose edge is defined only by which
  // words fall outside it - form from text, not a polygon.
  voidWobble: 26, // +/- px the void radius breathes with the noise
  voidWobbleFreq: 0.008, // spatial frequency of that wobble

  // Cells near the cursor lean outward along a smooth, low-amplitude field so
  // the surrounding words back away from it. Kept small to avoid any obvious
  // curved warping of the lines.
  displaceRadius: 210, // px of influence
  displaceAmount: 14, // max px a cell is pushed outward

  // Dragging the cursor stretches the void along the direction of motion, with
  // a longer wake trailing behind, so it reads like a shape moving through
  // fluid rather than a rigid circle.
  voidStretchK: 0.028, // how much speed (px/frame) elongates the void
  voidStretchMax: 1.5, // cap on that elongation
  voidTailBias: 1.5, // extra stretch behind the cursor vs. in front
  velocitySmoothing: 0.16, // how quickly tracked velocity eases in/out

  // Flow field that drives the soft organic shapes.
  noiseSpaceFreq: 0.021,
  noiseTimeSpeed: 0.00017,

  // Per-tier base opacity and how strongly the flow field modulates it.
  alphaPersonal: 1.0,
  alphaAmbient: 0.5,
  alphaMeta: 0.16,
  noisePersonal: 0.3, // low -> stays readable
  noiseAmbient: 0.68,
  noiseMeta: 0.82, // high -> flickers in and out, ghostly

  // Edge fade. Fraction of the half-dimension where the vignette runs from
  // full (start) to gone (end).
  vignetteStart: 0.86,
  vignetteEnd: 1.05,

  // Pointer smoothing and idle behaviour.
  pointerLerp: 0.12,
  idleTimeout: 2600, // ms of stillness before the focus point drifts
  idleDriftSpeed: 0.00012,

  // Rendering.
  alphaBuckets: 12, // opacity is quantised into this many draw passes
  maxDPR: 2,
};
