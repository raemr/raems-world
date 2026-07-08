import { config } from "./config.js";
import { ambientWords, personalWords, metaPhrases } from "./words.js";
import { fieldNoise, smoothstep, clamp, lerp } from "./noise.js";

// The typographic field. Owns the canvas, a monospace grid, three aligned
// character grids (one per cursor zone), and the per-frame render.
export function createField(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let cellW = 0;
  let cellH = 0;
  let fontSize = 14;

  let grids = null;
  const buckets = []; // reused each frame; buckets[i] = [x, y, char, x, y, char, ...]

  function pickFontSize(w) {
    return Math.round(clamp(w / 115, config.fontSizeMin, config.fontSizeMax));
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
  }

  function render(now, pointer) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.font = `${fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = config.ink;

    const nb = config.alphaBuckets;
    for (let i = 0; i <= nb; i++) {
      if (!buckets[i]) buckets[i] = [];
      else buckets[i].length = 0;
    }

    const px = pointer.x;
    const py = pointer.y;
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

        // The zone picks which vocabulary a cell shows. The character swaps at
        // the boundaries, but the tier opacity below is blended smoothly across
        // them, so the zones themselves never read as visible rings.
        let ch;
        if (dist < config.personalRadius) ch = personalRow[c];
        else if (dist < config.ambientRadius) ch = ambientRow[c];
        else ch = metaRow[c];
        if (ch === 0) continue; // empty cell (was a space)

        const toAmbient = smoothstep(
          config.personalRadius - config.tierBlend,
          config.personalRadius + config.tierBlend,
          dist
        );
        const toMeta = smoothstep(
          config.ambientRadius - config.tierBlend,
          config.ambientRadius + config.tierBlend,
          dist
        );
        let tierAlpha = lerp(config.alphaPersonal, config.alphaAmbient, toAmbient);
        tierAlpha = lerp(tierAlpha, config.alphaMeta, toMeta);
        let noiseAmt = lerp(config.noisePersonal, config.noiseAmbient, toAmbient);
        noiseAmt = lerp(noiseAmt, config.noiseMeta, toMeta);

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
        if (effDist < config.voidRadius + wobble) continue;

        const n = fieldNoise(c * config.noiseSpaceFreq, r * config.noiseSpaceFreq, time);
        const alpha = vignette * tierAlpha * lerp(1, n, noiseAmt);
        if (alpha < 0.015) continue;

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

        const b = buckets[Math.min(nb, Math.round(alpha * nb))];
        b.push(dx, dy, ch);
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
    ctx.globalAlpha = 1;
  }

  return { rebuild, render };
}
