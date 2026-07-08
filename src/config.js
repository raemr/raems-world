// Every tunable in one place so the look is easy to dial in.
export const config = {
  // Typography
  // The generative word field stays monospace so the grid measures cleanly.
  fontFamily: '"IBM Plex Mono", "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
  // The intro wordmark gets a warmer display face than the gridded sea.
  wordmarkFontFamily: '"Fraunces", Georgia, serif',
  // Smallest sea-text size, in CSS pixels.
  fontSizeMin: 12,
  // Largest sea-text size, in CSS pixels.
  fontSizeMax: 16,
  // Multiplier from font size to row height.
  lineHeightRatio: 1.16, // cell height = fontSize * this

  // Theme
  // Duration for CSS and canvas colors to ease between light and dark.
  themeTransitionMs: 720,
  // Canvas and CSS colors by mode. The theme controller interpolates these.
  palettes: {
    light: {
      bg: "#eef1e8",
      ink: "#222820",
      raemPulseInk: "#426f82",
      wordmarkShadowColor: "rgba(255, 255, 255, 0.82)",
      wordmarkRaemShadowColor: "rgba(255, 255, 255, 0.94)",
      toggleBg: "rgba(238, 241, 232, 0.62)",
      toggleBorder: "rgba(34, 40, 32, 0.22)",
      toggleInk: "#222820",
      toggleShadow: "rgba(47, 64, 54, 0.16)",
    },
    dark: {
      bg: "#101615",
      ink: "#e9ecdf",
      raemPulseInk: "#90bbc8",
      wordmarkShadowColor: "rgba(144, 187, 200, 0.18)",
      wordmarkRaemShadowColor: "rgba(144, 187, 200, 0.34)",
      toggleBg: "rgba(16, 22, 21, 0.68)",
      toggleBorder: "rgba(233, 236, 223, 0.24)",
      toggleInk: "#e9ecdf",
      toggleShadow: "rgba(0, 0, 0, 0.38)",
    },
  },

  // Canvas wordmark. It is drawn under the typographic field, and RAEM's
  // padded box becomes the alternate void shape while hovered.
  // First word in the intro sequence.
  wordmarkLeadText: "HI",
  // Second word in the intro sequence, drawn beside RAEM.
  wordmarkIntroText: "I'M",
  // Top-left horizontal offset for the lead word.
  wordmarkLeadMarginX: 36,
  // Top-left vertical offset for the lead word.
  wordmarkLeadMarginY: 32,
  // Soft shadow blur for HI and I'M.
  wordmarkShadowBlur: 12,
  // Horizontal shadow offset for HI and I'M.
  wordmarkShadowOffsetX: 0,
  // Vertical shadow offset for HI and I'M.
  wordmarkShadowOffsetY: 4,
  // Stronger shadow blur for RAEM.
  wordmarkRaemShadowBlur: 22,
  // Horizontal shadow offset for RAEM.
  wordmarkRaemShadowOffsetX: 0,
  // Vertical shadow offset for RAEM.
  wordmarkRaemShadowOffsetY: 7,
  // Clickable wordmark text.
  raemText: "RAEM",
  // Base wordmark scale relative to viewport width.
  raemFontScale: 0.135,
  // Extra scale applied only to RAEM.
  wordmarkRaemScale: 1.1,
  // Minimum wordmark size before RAEM's extra scale.
  raemFontSizeMin: 68,
  // Maximum wordmark size before RAEM's extra scale.
  raemFontSizeMax: 156,
  // Bottom-right horizontal margin for RAEM.
  raemMarginX: 36,
  // Bottom-right vertical margin for RAEM.
  raemMarginY: 30,
  // Horizontal padding used by the RAEM hover/click hitbox.
  raemPadX: 28,
  // Vertical padding used by the RAEM hover/click hitbox.
  raemPadY: 18,
  // Corner radius for the RAEM-shaped clear area.
  raemRadius: 18,
  // Historical idle alpha; kept for compatibility with earlier tuning.
  raemAlphaIdle: 0,
  // Opacity for HI and I'M after they fade in.
  raemAlphaReveal: 0.89,
  // Opacity for RAEM after it fades in.
  wordmarkRaemAlphaReveal: 1,
  // How quickly the RAEM-shaped void appears on hover.
  raemRevealInSpeed: 5.2,
  // How quickly the RAEM-shaped void relaxes after hover.
  raemRevealOutSpeed: 3.4,
  // Horizontal gap between I'M and RAEM, measured in ems.
  wordmarkGap: 0.28, // em
  // Fade-in duration for HI.
  wordmarkHiFadeMs: 420,
  // Pause after HI appears before I'M RAEM starts.
  wordmarkHiHoldMs: 620,
  // Fade-in duration for I'M RAEM.
  wordmarkIntroFadeMs: 900,
  // Delay before RAEM turns blue.
  wordmarkBlueDelayMs: 900,
  // Duration of RAEM's blue transition.
  wordmarkBlueFadeMs: 760,
  // Speed of the repeating RAEM pulse wavefront.
  raemPulseSpeed: 180, // px/s
  // Time between emitted pulse wavefronts.
  raemPulsePeriod: 4000, // ms between emitted wavefronts
  // Thickness of the pulse wavefront.
  raemPulseWidth: 84, // thickness of the brightened wavefront
  // Maximum opacity contribution from the moving pulse.
  raemPulseAlpha: 1,
  // Radius of the pulse source glow around RAEM.
  raemPulseSourceRadius: 120,
  // Opacity contribution from the pulse source glow.
  raemPulseSourceAlpha: 0.24,
  // Distance over which the RAEM pulse fades out.
  raemPulseFadeDistance: 860,
  // Organic distortion applied to pulse wavefronts.
  raemPulseWobble: 38,
  // Spatial frequency for pulse wobble.
  raemPulseWobbleFreq: 0.007,
  // Temporal speed for pulse wobble.
  raemPulseWobbleSpeed: 0.00022,
  // Expansion speed for the click-to-clear sea transition.
  seaClearSpeed: 720, // px/s
  // Feather width around the clearing edge.
  seaClearSoftness: 170,
  // Organic distortion applied to the clearing edge.
  seaClearWobble: 52,
  // Spatial frequency for the clearing-edge wobble.
  seaClearWobbleFreq: 0.006,
  // Temporal speed for the clearing-edge wobble.
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
