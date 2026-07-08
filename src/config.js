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
  //   dist < voidRadius        -> empty, the field is pushed away
  //   voidRadius .. personal   -> "about you" words, high opacity
  //   personal .. ambient      -> abstract ambient words, medium opacity
  //   dist > ambient           -> meta easter-egg phrases, low opacity
  voidRadius: 64,
  personalRadius: 160,
  ambientRadius: 340,
  // How wide (px) the tier opacity blends across a zone boundary. The zones
  // still decide which words go where, but this keeps the boundaries from ever
  // reading as visible rings.
  tierBlend: 72,

  // Repulsion. Cells near the cursor are nudged outward by a smooth, low
  // amplitude field. Neighboring cells get near-identical vectors, so the text
  // keeps its spacing and flows around the cursor instead of piling up.
  displaceRadius: 230, // px of influence
  displaceAmount: 26, // max px a cell is pushed outward

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
  vignetteStart: 0.66,
  vignetteEnd: 1.02,

  // Pointer smoothing and idle behaviour.
  pointerLerp: 0.12,
  idleTimeout: 2600, // ms of stillness before the focus point drifts
  idleDriftSpeed: 0.00012,

  // Rendering.
  alphaBuckets: 12, // opacity is quantised into this many draw passes
  maxDPR: 2,
};
