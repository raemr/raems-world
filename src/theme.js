import { config } from "./config.js";
import { clamp } from "./noise.js";

const STORAGE_KEY = "raem-theme";

function parseColor(value) {
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }

  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`Unsupported color format: ${value}`);

  const parts = match[1].split(",").map((part) => Number(part.trim()));
  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
    a: parts[3] ?? 1,
  };
}

function colorToCss(color) {
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);
  if (color.a >= 0.999) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(3)})`;
}

function mixColor(from, to, t) {
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
    a: from.a + (to.a - from.a) * t,
  };
}

function parsePalette(palette) {
  return Object.fromEntries(
    Object.entries(palette).map(([key, value]) => [key, parseColor(value)])
  );
}

function mixPalette(from, to, t) {
  return Object.fromEntries(
    Object.keys(to).map((key) => [key, colorToCss(mixColor(from[key], to[key], t))])
  );
}

function ease(t) {
  return t * t * (3 - 2 * t);
}

function getStoredMode() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function getSystemMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function storeMode(mode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

export function createThemeController() {
  const parsedPalettes = {
    light: parsePalette(config.palettes.light),
    dark: parsePalette(config.palettes.dark),
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let mode = getStoredMode() || getSystemMode();
  let from = parsedPalettes[mode];
  let to = parsedPalettes[mode];
  let startedAt = 0;
  let current = mixPalette(from, to, 1);
  let progress = 1;

  function applyCss(palette) {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.setProperty("--bg", palette.bg);
    root.style.setProperty("--ink", palette.ink);
    // The RAEM brand accent (teal in light), shared by the field wordmark and
    // the CV logo so RAEM reads as the same mark across the reveal.
    root.style.setProperty("--accent", palette.raemPulseInk);
    root.style.setProperty("--toggle-bg", palette.toggleBg);
    root.style.setProperty("--toggle-border", palette.toggleBorder);
    root.style.setProperty("--toggle-ink", palette.toggleInk);
    root.style.setProperty("--toggle-shadow", palette.toggleShadow);
  }

  function setMode(nextMode, options = {}) {
    if (nextMode !== "light" && nextMode !== "dark") return;

    mode = nextMode;
    storeMode(mode);
    from = parsePalette(current);
    to = parsedPalettes[mode];
    startedAt = performance.now();
    progress = options.instant || reducedMotion ? 1 : 0;
    current = mixPalette(from, to, progress);
    applyCss(current);
  }

  function update(now) {
    if (progress < 1) {
      progress = clamp((now - startedAt) / config.themeTransitionMs, 0, 1);
      current = mixPalette(from, to, ease(progress));
      applyCss(current);
    }
    return current;
  }

  function toggle() {
    setMode(mode === "dark" ? "light" : "dark");
  }

  applyCss(current);

  return {
    get mode() {
      return mode;
    },
    get palette() {
      return current;
    },
    setMode,
    toggle,
    update,
  };
}
