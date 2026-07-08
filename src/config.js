// Every tunable in one place so the look is easy to dial in.
export const config = {
  // Typography
  fontFamily:
    'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  wordmarkFontFamily:
    '"Mirava Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSizeMin: 12,
  fontSizeMax: 16,
  lineHeightRatio: 1.16, // cell height = fontSize * this

  // Palette (Claude light mode, warm cream). All tonal variation comes from
  // opacity, never color.
  bg: "#f2ead6",
  ink: "#2b2a27",

  // Canvas wordmark. It is drawn under the typographic field, and RAEM's
  // padded box becomes the alternate void shape while hovered.
  wordmarkLeadText: "HI",
  wordmarkIntroText: "I'M",
  wordmarkLeadMarginX: 36,
  wordmarkLeadMarginY: 32,
  wordmarkShadowColor: "rgba(255, 255, 255, 0.78)",
  wordmarkShadowBlur: 12,
  wordmarkShadowOffsetX: 0,
  wordmarkShadowOffsetY: 4,
  wordmarkRaemShadowColor: "rgba(255, 255, 255, 0.9)",
  wordmarkRaemShadowBlur: 22,
  wordmarkRaemShadowOffsetX: 0,
  wordmarkRaemShadowOffsetY: 7,
  raemText: "RAEM",
  raemFontScale: 0.135,
  wordmarkRaemScale: 1.1,
  raemFontSizeMin: 68,
  raemFontSizeMax: 156,
  raemMarginX: 36,
  raemMarginY: 30,
  raemPadX: 28,
  raemPadY: 18,
  raemRadius: 18,
  raemAlphaIdle: 0,
  raemAlphaReveal: 0.89,
  wordmarkRaemAlphaReveal: 1,
  raemRevealInSpeed: 5.2,
  raemRevealOutSpeed: 3.4,
  raemPulseInk: "#5B7C99",
  wordmarkGap: 0.28, // em
  wordmarkHiFadeMs: 420,
  wordmarkHiHoldMs: 620,
  wordmarkIntroFadeMs: 900,
  wordmarkBlueDelayMs: 900,
  wordmarkBlueFadeMs: 760,
  raemPulseSpeed: 180, // px/s
  raemPulsePeriod: 4000, // ms between emitted wavefronts
  raemPulseWidth: 84, // thickness of the brightened wavefront
  raemPulseAlpha: 1,
  raemPulseSourceRadius: 120,
  raemPulseSourceAlpha: 0.24,
  raemPulseFadeDistance: 860,
  raemPulseWobble: 38,
  raemPulseWobbleFreq: 0.007,
  raemPulseWobbleSpeed: 0.00022,
  seaClearSpeed: 720, // px/s
  seaClearSoftness: 170,
  seaClearWobble: 52,
  seaClearWobbleFreq: 0.006,
  seaClearWobbleSpeed: 0.00034,

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
  ambientFollowDelay: 2000, // ms before the ambient anchor starts chasing pointer movement
  ambientLerp: 0.005, // how slowly the ambient anchor chases the cursor
  // The ambient edge is fluid: it breathes with the flow field and surges with
  // the cursor's velocity, like a big slow body of liquid.
  ambientWobble: 60, // +/- px the ambient edge breathes with the noise
  ambientWobbleFreq: 0.004, // low frequency -> large, soft lobes
  ambientStretchK: 0.005, // how much speed elongates the ambient mass
  ambientStretchMax: 2.2, // cap on that elongation
  ambientTailBias: 1.6, // extra stretch in the wake behind the motion
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
  idleTimeout: 12000, // ms of stillness before the focus point drifts
  idleDriftSpeed: 0.00012,

  // Rendering.
  alphaBuckets: 12, // opacity is quantised into this many draw passes
  maxDPR: 2,
};
