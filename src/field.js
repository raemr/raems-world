import { config } from "./config.js";
import { ambientWords, personalWords, metaPhrases } from "./words.js";
import { fieldNoise, smoothstep, clamp, lerp } from "./noise.js";

// The typographic field. Owns the canvas, a monospace grid, three aligned
// character grids (one per cursor zone), and the per-frame render.
export function createField(canvas, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = !!options.reducedMotion;
  const onNeedsRedraw = options.onNeedsRedraw || (() => {});

  // An opaque (alpha:false) canvas starts out black. On light mode that reads as
  // a dark flash while fonts load and the first frame is prepared, so paint the
  // themed background straight away - render() takes over from the first frame.
  const initialBg = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg")
    .trim();
  if (initialBg) {
    ctx.fillStyle = initialBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let cellW = 0;
  let cellH = 0;
  let fontSize = 14;
  let raemFontSize = 96;
  let raemBox = null;
  let wordmark = null;
  let reveal = 0;
  let italicReveal = 0;
  let lastNow = 0;
  let introStart = 0;
  let hoveringRaem = false;
  let seaClearStart = null;
  let seaClearOrigin = { x: 0, y: 0 };
  let seaClearComplete = false;
  // Phase machine for the CV reveal: field -> clearing -> cv -> closing -> field.
  let phase = "field";
  let seaCloseStart = null;
  let seaFarthest = 0; // fully-cleared radius, reused to flood back in
  let cvReveal = 0; // eased 0..1: RAEM morphed into the corner logo
  let logoTarget = null; // {x, baselineY, fontSize} the wordmark shrinks toward

  let grids = null;
  const buckets = []; // reused each frame; buckets[i] = [x, y, char, x, y, char, ...]
  const pulseBuckets = [];

  function emit(name) {
    window.dispatchEvent(new CustomEvent(name));
  }

  // Part the sea from RAEM and begin morphing it into the corner logo.
  function startClear() {
    if (!raemBox) return;
    seaClearOrigin = {
      x: raemBox.x + raemBox.w * 0.5,
      y: raemBox.y + raemBox.h * 0.5,
    };
    seaCloseStart = null;
    emit("field:clearing");
    if (reducedMotion) {
      phase = "cv";
      seaClearComplete = true;
      cvReveal = 1;
      emit("field:cv");
      onNeedsRedraw();
      return;
    }
    phase = "clearing";
    seaClearStart = performance.now();
    seaClearComplete = false;
  }

  // Flood the sea back in and return to the field.
  function startClose() {
    if (phase !== "cv") return;
    emit("field:closing");
    if (reducedMotion) {
      resetToField();
      emit("field:field");
      onNeedsRedraw();
      return;
    }
    phase = "closing";
    seaCloseStart = performance.now();
  }

  function resetToField() {
    phase = "field";
    seaClearStart = null;
    seaCloseStart = null;
    seaClearComplete = false;
    cvReveal = 0;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (phase !== "field") return;
    if (!isInsideRaemBox(e.clientX, e.clientY)) return;

    const state = wordmarkState(performance.now());
    if (state.blue < 0.96) return;

    startClear();
  });

  function pickFontSize(w) {
    return Math.round(clamp(w / 115, config.fontSizeMin, config.fontSizeMax));
  }

  function pickRaemFontSize(w) {
    return Math.round(clamp(w * config.raemFontScale, config.raemFontSizeMin, config.raemFontSizeMax));
  }

  function wordmarkFont(family, style = "normal", size = raemFontSize) {
    return `${style} 700 ${size}px ${family}`;
  }

  function applyWordmarkShadow(palette) {
    ctx.shadowColor = palette.wordmarkShadowColor;
    ctx.shadowBlur = config.wordmarkShadowBlur;
    ctx.shadowOffsetX = config.wordmarkShadowOffsetX;
    ctx.shadowOffsetY = config.wordmarkShadowOffsetY;
  }

  function applyRaemShadow(palette, revealMix = 0) {
    // The white halo lifts RAEM off the dense sea while it is hidden. Once the
    // hover clears a rounded rect around the word the halo only bleaches it, so
    // fade the halo out as the reveal comes in.
    const soften = 1 - revealMix;
    ctx.shadowColor = palette.wordmarkRaemShadowColor;
    ctx.shadowBlur = config.wordmarkRaemShadowBlur * soften;
    ctx.shadowOffsetX = config.wordmarkRaemShadowOffsetX;
    ctx.shadowOffsetY = config.wordmarkRaemShadowOffsetY * soften;
  }

  function clearShadow() {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function updateRaemLayout() {
    const pickedSize = pickRaemFontSize(cssW);
    const maxWidth = Math.max(160, cssW - config.raemMarginX * 2);
    const minSize = Math.min(config.raemFontSizeMin, 38);

    raemFontSize = pickedSize;
    const pickedRaemFontSize = pickedSize * config.wordmarkRaemScale;
    ctx.font = wordmarkFont(config.wordmarkFontFamily);
    const pickedGap = pickedSize * config.wordmarkGap;
    const pickedIntroWidth = ctx.measureText(config.wordmarkIntroText).width;
    ctx.font = wordmarkFont(config.wordmarkFontFamily, "normal", pickedRaemFontSize);
    const pickedWidth = pickedIntroWidth + pickedGap + ctx.measureText(config.raemText).width;

    raemFontSize = Math.round(clamp(pickedSize * Math.min(1, maxWidth / pickedWidth), minSize, pickedSize));
    const scaledRaemFontSize = raemFontSize * config.wordmarkRaemScale;
    ctx.textBaseline = "alphabetic";

    ctx.font = wordmarkFont(config.wordmarkFontFamily);
    const hiMetrics = ctx.measureText(config.wordmarkLeadText);
    const introMetrics = ctx.measureText(config.wordmarkIntroText);
    ctx.font = wordmarkFont(config.wordmarkFontFamily, "normal", scaledRaemFontSize);
    const raemMetrics = ctx.measureText(config.raemText);
    const gap = raemFontSize * config.wordmarkGap;
    const width = raemMetrics.width;
    const ascent = Math.max(
      hiMetrics.actualBoundingBoxAscent || raemFontSize * 0.74,
      introMetrics.actualBoundingBoxAscent || raemFontSize * 0.74,
      raemMetrics.actualBoundingBoxAscent || raemFontSize * 0.74
    );
    const descent = Math.max(
      hiMetrics.actualBoundingBoxDescent || raemFontSize * 0.18,
      introMetrics.actualBoundingBoxDescent || raemFontSize * 0.18,
      raemMetrics.actualBoundingBoxDescent || raemFontSize * 0.18
    );
    const textX = cssW - config.raemMarginX - width;
    const textY = cssH - config.raemMarginY - descent;
    const introX = textX - gap - introMetrics.width;
    const hiX = config.wordmarkLeadMarginX;
    const hiY = config.wordmarkLeadMarginY + ascent;

    raemBox = {
      textX,
      textY,
      x: textX - config.raemPadX,
      y: textY - ascent - config.raemPadY,
      w: width + config.raemPadX * 2,
      h: ascent + descent + config.raemPadY * 2,
    };
    wordmark = {
      hiX,
      hiY,
      introX,
      raemX: textX,
      textY,
    };

    // The small top-left slot RAEM shrinks into as the CV takes over.
    ctx.font = wordmarkFont(config.wordmarkFontFamily, "normal", config.logoFontSize);
    const logoMetrics = ctx.measureText(config.raemText);
    const logoAscent = logoMetrics.actualBoundingBoxAscent || config.logoFontSize * 0.74;
    logoTarget = {
      x: config.logoMarginX,
      baselineY: config.logoMarginY + logoAscent,
      fontSize: config.logoFontSize,
    };
  }

  function isInsideRaemBox(x, y) {
    return (
      raemBox &&
      x >= raemBox.x &&
      x <= raemBox.x + raemBox.w &&
      y >= raemBox.y &&
      y <= raemBox.y + raemBox.h
    );
  }

  function updateReveal(now, pointer) {
    const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.08) : 1 / 60;
    lastNow = now;

    const inField = phase === "field";
    hoveringRaem = inField && isInsideRaemBox(pointer.rawX, pointer.rawY);
    canvas.style.cursor = hoveringRaem && wordmarkState(now).blue >= 0.96 ? "pointer" : "";
    const target = hoveringRaem ? 1 : 0;
    const speed = target > reveal ? config.raemRevealInSpeed : config.raemRevealOutSpeed;
    reveal += (target - reveal) * (1 - Math.exp(-speed * dt));

    const italicSpeed =
      target > italicReveal ? config.wordmarkItalicInSpeed : config.wordmarkItalicOutSpeed;
    italicReveal += (target - italicReveal) * (1 - Math.exp(-italicSpeed * dt));

    // Ease RAEM's morph into (clearing/cv) and back out of (closing/field) the
    // corner-logo position.
    const cvTarget = phase === "clearing" || phase === "cv" ? 1 : 0;
    if (reducedMotion) {
      cvReveal = cvTarget;
    } else {
      const cvSpeed = cvTarget > cvReveal ? config.cvMorphInSpeed : config.cvMorphOutSpeed;
      cvReveal += (cvTarget - cvReveal) * (1 - Math.exp(-cvSpeed * dt));
    }
  }

  function pulseBoost(x, y, now, active) {
    if (!active || !raemBox) return 0;

    const ox = raemBox.x + raemBox.w * 0.5;
    const oy = raemBox.y + raemBox.h * 0.5;
    const dx = x - ox;
    const dy = y - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const fade = 1 - smoothstep(0, config.raemPulseFadeDistance, dist);
    if (fade <= 0) return 0;

    const pulseAge = now % config.raemPulsePeriod;
    const waveRadius = (pulseAge / 1000) * config.raemPulseSpeed;
    const maxWaveRadius = (config.raemPulsePeriod / 1000) * config.raemPulseSpeed;
    const radialFade = 1 - smoothstep(0, maxWaveRadius, waveRadius);
    const wobble =
      (fieldNoise(
        x * config.raemPulseWobbleFreq,
        y * config.raemPulseWobbleFreq,
        now * config.raemPulseWobbleSpeed
      ) -
        0.5) *
      2 *
      config.raemPulseWobble;
    const waveDist = dist + wobble;
    const wave = 1 - smoothstep(0, config.raemPulseWidth, Math.abs(waveDist - waveRadius));
    const sourceLife = 1 - smoothstep(0, config.raemPulseWidth * 2, waveRadius);
    const source = (1 - smoothstep(0, config.raemPulseSourceRadius, dist)) * sourceLife;

    return fade * radialFade * (wave * config.raemPulseAlpha + source * config.raemPulseSourceAlpha);
  }

  function wordmarkState(now) {
    // With no animation loop the intro can't play, so present it as finished
    // and let RAEM be clickable immediately.
    if (reducedMotion) return { hi: 1, intro: 1, blue: 1 };
    if (!introStart) introStart = now;

    const elapsed = now - introStart;
    const hi = smoothstep(0, config.wordmarkHiFadeMs, elapsed);
    const introAt = config.wordmarkHiFadeMs + config.wordmarkHiHoldMs;
    const intro = smoothstep(introAt, introAt + config.wordmarkIntroFadeMs, elapsed);
    const blueAt = introAt + config.wordmarkIntroFadeMs + config.wordmarkBlueDelayMs;
    const blue = smoothstep(blueAt, blueAt + config.wordmarkBlueFadeMs, elapsed);

    return { hi, intro, blue };
  }

  // Fraction a cell is cleared (1 = empty) for a given clearing radius. The same
  // shape is reused for the forward clear (growing radius) and the reverse flood
  // (shrinking radius), so the sea parts and re-forms with the same organic edge.
  function seaClearAmount(x, y, now, radius) {
    if (radius <= 0) return 0;

    const wobble =
      (fieldNoise(
        x * config.seaClearWobbleFreq,
        y * config.seaClearWobbleFreq,
        now * config.seaClearWobbleSpeed
      ) -
        0.5) *
      2 *
      config.seaClearWobble;
    const dx = x - seaClearOrigin.x;
    const dy = y - seaClearOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return 1 - smoothstep(radius - config.seaClearSoftness, radius + config.seaClearSoftness, dist + wobble);
  }

  function fullClearRadius() {
    return (
      Math.max(
        Math.hypot(seaClearOrigin.x, seaClearOrigin.y),
        Math.hypot(cssW - seaClearOrigin.x, seaClearOrigin.y),
        Math.hypot(seaClearOrigin.x, cssH - seaClearOrigin.y),
        Math.hypot(cssW - seaClearOrigin.x, cssH - seaClearOrigin.y)
      ) +
      config.seaClearSoftness +
      config.seaClearWobble
    );
  }

  // The clearing radius for the current phase: grows while clearing, shrinks
  // back to zero while closing, and is zero in the plain field phase.
  function currentClearRadius(now) {
    if (phase === "clearing") return ((now - seaClearStart) / 1000) * config.seaClearSpeed;
    if (phase === "closing") {
      const shrink = ((now - seaCloseStart) / 1000) * config.seaCloseSpeed;
      return Math.max(0, seaFarthest - shrink);
    }
    return 0;
  }

  function updateSeaClear(now) {
    if (phase !== "clearing") return;

    seaFarthest = fullClearRadius();
    const radius = ((now - seaClearStart) / 1000) * config.seaClearSpeed;
    if (radius > seaFarthest) {
      phase = "cv";
      seaClearComplete = true;
      emit("field:cv");
    }
  }

  function updateSeaClose(now) {
    if (phase !== "closing") return;

    const shrink = ((now - seaCloseStart) / 1000) * config.seaCloseSpeed;
    if (shrink >= seaFarthest) {
      resetToField();
      emit("field:field");
    }
  }

  function roundedRectSdf(x, y, box, radius) {
    const halfW = box.w * 0.5;
    const halfH = box.h * 0.5;
    const dx = Math.abs(x - (box.x + halfW)) - (halfW - radius);
    const dy = Math.abs(y - (box.y + halfH)) - (halfH - radius);
    const outsideX = Math.max(dx, 0);
    const outsideY = Math.max(dy, 0);
    return Math.sqrt(outsideX * outsideX + outsideY * outsideY) + Math.min(Math.max(dx, dy), 0) - radius;
  }

  function drawWordmark(now, palette) {
    if (!raemBox || !wordmark || !logoTarget) return;

    const state = wordmarkState(now);
    const leadAlpha = config.raemAlphaReveal;
    const raemAlpha = config.wordmarkRaemAlphaReveal;
    const italicMix = smoothstep(0, 1, italicReveal);
    const romanMix = 1 - italicMix;
    const cvMix = smoothstep(0, 1, cvReveal);
    ctx.textBaseline = "alphabetic";
    applyWordmarkShadow(palette);

    // HI and I'M belong to the intro only, so they fade out as the CV takes over.
    ctx.font = wordmarkFont(config.wordmarkFontFamily);
    ctx.fillStyle = palette.ink;
    ctx.globalAlpha = leadAlpha * state.hi * (1 - cvMix);
    ctx.fillText(config.wordmarkLeadText, wordmark.hiX, wordmark.hiY);
    ctx.globalAlpha = leadAlpha * state.intro * (1 - cvMix);
    ctx.fillText(config.wordmarkIntroText, wordmark.introX, wordmark.textY);

    // RAEM morphs from the big bottom-right wordmark toward the corner logo.
    const raemSize = lerp(raemFontSize * config.wordmarkRaemScale, logoTarget.fontSize, cvMix);
    const raemX = lerp(wordmark.raemX, logoTarget.x, cvMix);
    const raemBaseline = lerp(wordmark.textY, logoTarget.baselineY, cvMix);
    const revealMix = smoothstep(0, 1, reveal);
    applyRaemShadow(palette, Math.max(revealMix, cvMix));
    drawRaemStyle("normal", romanMix, revealMix);
    drawRaemStyle("italic", italicMix, revealMix);
    ctx.globalAlpha = 1;
    clearShadow();

    function drawRaemStyle(style, alphaMix, revealMix) {
      if (alphaMix <= 0.001) return;

      ctx.font = wordmarkFont(config.wordmarkFontFamily, style, raemSize);
      ctx.fillStyle = palette.ink;
      ctx.globalAlpha = raemAlpha * state.intro * (1 - state.blue) * alphaMix;
      ctx.fillText(config.raemText, raemX, raemBaseline);
      ctx.fillStyle = palette.raemPulseInk;
      ctx.globalAlpha = raemAlpha * state.intro * state.blue * alphaMix;
      ctx.fillText(config.raemText, raemX, raemBaseline);

      // On hover, deepen RAEM toward a high-contrast ink so the revealed word
      // reads as fully present in the cleared rounded rect around it.
      if (revealMix > 0.001) {
        ctx.fillStyle = palette.raemRevealInk;
        ctx.globalAlpha = raemAlpha * state.intro * alphaMix * revealMix;
        ctx.fillText(config.raemText, raemX, raemBaseline);
      }
      // As the CV takes over, settle RAEM to the solid teal accent as the
      // corner logo, matching the DOM logo it hands off to.
      if (cvMix > 0.001) {
        ctx.fillStyle = palette.raemPulseInk;
        ctx.globalAlpha = raemAlpha * state.intro * alphaMix * cvMix;
        ctx.fillText(config.raemText, raemX, raemBaseline);
      }
    }
  }

  // Build one row by concatenating entries (words or whole phrases) until the
  // row is wide enough, then slice to columns. Spaces become empty cells.
  function buildRow(entries, seed) {
    let s = "";
    let idx = ((seed % entries.length) + entries.length) % entries.length;
    while (s.length < cols + 8) {
      s += entries[idx % entries.length] + " ";
      idx++;
    }
    const row = new Array(cols);
    for (let c = 0; c < cols; c++) {
      const ch = s[c];
      row[c] = ch === " " ? 0 : ch;
    }
    return row;
  }

  function buildGrid(entries, seedBase) {
    const g = new Array(rows);
    for (let r = 0; r < rows; r++) {
      // Offset each row so vertical seams do not line up into columns.
      g[r] = buildRow(entries, seedBase + r * 7 + ((r * r) % 5));
    }
    return g;
  }

  function rebuild() {
    dpr = Math.min(window.devicePixelRatio || 1, config.maxDPR);
    cssW = window.innerWidth;
    cssH = window.innerHeight;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fontSize = pickFontSize(cssW);
    ctx.font = `${fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = "top";

    const charW = ctx.measureText("M").width || fontSize * 0.6;
    cellW = charW;
    cellH = fontSize * config.lineHeightRatio;
    cols = Math.ceil(cssW / cellW) + 1;
    rows = Math.ceil(cssH / cellH) + 1;

    grids = {
      personal: buildGrid(personalWords, 3),
      ambient: buildGrid(ambientWords, 11),
      meta: buildGrid(metaPhrases, 29),
    };

    updateRaemLayout();
  }

  function render(now, pointer, palette = config.palettes.light) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    updateReveal(now, pointer);
    updateSeaClear(now);
    updateSeaClose(now);
    const pulseActive = phase === "field" && wordmarkState(now).blue >= 0.96;

    // In the CV phase the sea is fully parted: paint just the background and the
    // shrunken RAEM corner logo, and let the DOM CV overlay carry the content.
    if (phase === "cv") {
      drawWordmark(now, palette);
      return;
    }

    const clearRadius = currentClearRadius(now);

    ctx.font = `${fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = palette.ink;

    const nb = config.alphaBuckets;
    for (let i = 0; i <= nb; i++) {
      if (!buckets[i]) buckets[i] = [];
      else buckets[i].length = 0;
      if (!pulseBuckets[i]) pulseBuckets[i] = [];
      else pulseBuckets[i].length = 0;
    }

    const px = pointer.x;
    const py = pointer.y;
    const ax = pointer.ax; // lagged anchor the ambient mass is centred on
    const ay = pointer.ay;
    const halfW = cssW / 2;
    const halfH = cssH / 2;
    const time = now * config.noiseTimeSpeed;

    // Velocity of the cursor sets up an anisotropic warp of the void: it gets
    // longer along the direction of travel (and longer still in the wake).
    const speed = pointer.speed;
    const moving = speed > 0.05;
    const ux = moving ? pointer.vx / speed : 0;
    const uy = moving ? pointer.vy / speed : 0;
    const stretchAmt = Math.min(speed * config.voidStretchK, config.voidStretchMax);
    // The ambient mass gets its own, larger velocity stretch so it surges and
    // sloshes like a big slow body of fluid.
    const ambientStretchAmt = Math.min(speed * config.ambientStretchK, config.ambientStretchMax);

    for (let r = 0; r < rows; r++) {
      const cy = r * cellH;
      const cyc = cy + cellH * 0.5;
      const ny = (cyc - halfH) / halfH;
      const vy = smoothstep(config.vignetteEnd, config.vignetteStart, Math.abs(ny));
      if (vy <= 0.001) continue;

      const personalRow = grids.personal[r];
      const ambientRow = grids.ambient[r];
      const metaRow = grids.meta[r];

      for (let c = 0; c < cols; c++) {
        const cx = c * cellW;
        const cxc = cx + cellW * 0.5;
        const nx = (cxc - halfW) / halfW;
        const vx = smoothstep(config.vignetteEnd, config.vignetteStart, Math.abs(nx));
        const vignette = vx * vy;
        if (vignette <= 0.001) continue;

        const ddx = cxc - px;
        const ddy = cyc - py;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.0001;

        // Distance from the lagged anchor decides the ambient/meta split, so
        // the big ambient mass sits where it drifts to rather than tracking the
        // cursor. The void and personal ring stay measured from the cursor.
        const adx = cxc - ax;
        const ady = cyc - ay;
        let distSlow = Math.sqrt(adx * adx + ady * ady);

        // Make the ambient edge fluid: stretch it with the cursor's velocity
        // (a big soft comet, with a longer wake) so the whole mass surges and
        // sloshes when you move.
        if (moving) {
          const along = adx * ux + ady * uy;
          const perpx = adx - along * ux;
          const perpy = ady - along * uy;
          const perp = Math.sqrt(perpx * perpx + perpy * perpy);
          const stretch = 1 + ambientStretchAmt * (along < 0 ? config.ambientTailBias : 1);
          const alongScaled = along / stretch;
          distSlow = Math.sqrt(alongScaled * alongScaled + perp * perp);
        }

        // ...and wobble the radius itself with the flow field so the boundary
        // is an organic, breathing shape rather than a circle.
        const ambientR =
          config.ambientRadius +
          (fieldNoise(cxc * config.ambientWobbleFreq, cyc * config.ambientWobbleFreq, time) - 0.5) *
            2 *
            config.ambientWobble;

        // The zone picks which vocabulary a cell shows. Personal hugs the
        // cursor; ambient vs meta follows the fluid anchor. Opacity is blended
        // smoothly below so no boundary ever reads as a visible ring.
        let ch;
        if (dist < config.personalRadius) ch = personalRow[c];
        else if (distSlow < ambientR) ch = ambientRow[c];
        else ch = metaRow[c];
        if (ch === 0) continue; // empty cell (was a space)

        // Ambient<->meta base opacity comes from the anchor; the personal ring
        // is layered on top from the cursor so it is never dimmed by the base.
        const wPersonal =
          1 -
          smoothstep(
            config.personalRadius - config.tierBlend,
            config.personalRadius + config.tierBlend,
            dist
          );
        const wMeta = smoothstep(
          ambientR - config.tierBlend,
          ambientR + config.tierBlend,
          distSlow
        );
        let tierAlpha = lerp(config.alphaAmbient, config.alphaMeta, wMeta);
        tierAlpha = lerp(tierAlpha, config.alphaPersonal, wPersonal);
        let noiseAmt = lerp(config.noiseAmbient, config.noiseMeta, wMeta);
        noiseAmt = lerp(noiseAmt, config.noisePersonal, wPersonal);

        // Drop cells inside a wobbling radius. The radius breathes with the
        // flow field, so the empty space is an irregular blob and its outline
        // is whatever words happen to sit just outside it - not a drawn circle.
        const wobble =
          (fieldNoise(cxc * config.voidWobbleFreq, cyc * config.voidWobbleFreq, time) - 0.5) *
          2 *
          config.voidWobble;

        // Warp the distance used for the void so a drag stretches it into a
        // fluid, comet-like shape instead of a rigid circle.
        let effDist = dist;
        if (moving) {
          const along = ddx * ux + ddy * uy;
          const perpx = ddx - along * ux;
          const perpy = ddy - along * uy;
          const perp = Math.sqrt(perpx * perpx + perpy * perpy);
          const stretch = 1 + stretchAmt * (along < 0 ? config.voidTailBias : 1);
          const alongScaled = along / stretch;
          effDist = Math.sqrt(alongScaled * alongScaled + perp * perp);
        }

        const cursorSdf = effDist - (config.voidRadius + wobble);
        const raemSdf = roundedRectSdf(cxc, cyc, raemBox, config.raemRadius);
        const voidSdf = lerp(cursorSdf, raemSdf, smoothstep(0, 1, reveal));
        if (voidSdf < 0) continue;

        const clear = seaClearAmount(cxc, cyc, now, clearRadius);
        if (clear >= 0.985) continue;

        const n = fieldNoise(c * config.noiseSpaceFreq, r * config.noiseSpaceFreq, time);
        const clearFade = 1 - clear;
        const alpha = vignette * tierAlpha * lerp(1, n, noiseAmt) * clearFade;
        const pulse = pulseBoost(cxc, cyc, now, pulseActive) * clearFade;
        if (alpha < 0.015 && pulse < 0.015) continue;

        // Lean the cell outward along a smooth, low-amplitude field so the
        // words back away from the cursor. The falloff uses the same warped
        // distance, so the lean follows the stretched void.
        let dx = cx;
        let dy = cy;
        const influence = smoothstep(config.displaceRadius, 0, effDist);
        if (influence > 0) {
          const push = config.displaceAmount * influence;
          dx += (ddx / dist) * push;
          dy += (ddy / dist) * push;
        }

        if (alpha >= 0.015) {
          const b = buckets[Math.min(nb, Math.round(alpha * nb))];
          b.push(dx, dy, ch);
        }
        if (pulse >= 0.015) {
          const pb = pulseBuckets[Math.min(nb, Math.round(pulse * nb))];
          pb.push(dx, dy, ch);
        }
      }
    }

    // One draw pass per opacity bucket keeps globalAlpha changes cheap.
    for (let i = 1; i <= nb; i++) {
      const b = buckets[i];
      if (b.length === 0) continue;
      ctx.globalAlpha = i / nb;
      for (let k = 0; k < b.length; k += 3) {
        ctx.fillText(b[k + 2], b[k], b[k + 1]);
      }
    }
    ctx.fillStyle = palette.raemPulseInk;
    for (let i = 1; i <= nb; i++) {
      const b = pulseBuckets[i];
      if (b.length === 0) continue;
      ctx.globalAlpha = i / nb;
      for (let k = 0; k < b.length; k += 3) {
        ctx.fillText(b[k + 2], b[k], b[k + 1]);
      }
    }
    ctx.globalAlpha = 1;
    drawWordmark(now, palette);
  }

  return { rebuild, render, close: startClose };
}
