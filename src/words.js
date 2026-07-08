// Three vocabularies, one per cursor-distance zone.

// Ambient texture: short, evocative, weather-and-signal words, plus a few
// pure-ASCII tokens sprinkled in for grain. This is the bulk of the field.
export const ambientWords = [
  "TIDE", "DRIFT", "FLOW", "SIGNAL", "ECHO", "NOISE", "PULSE", "GRAIN",
  "STATIC", "FIELD", "TRACE", "SHIFT", "LOOP", "FADE", "BLOOM", "VOID",
  "FORM", "WAVE", "HUM", "DRONE", "MURMUR", "EMBER", "GLINT", "HUSH",
  "*+=", "RIPPLE", "SPARK", "VAPOR", "ORBIT", "::::", "DUSK", "RELAY",
  "QUIET", "BLUR", "SEEP", "GLOW", "//\\", "WANE", "FLUX", "MOTE",
  "SHOAL", "GRACE", "STILL", "DEEP", "#%#", "KEEN", "SWELL", "GLEAN",
  "SONAR", "REEF", "~~~", "CREST", "DEPTH", "SENSE", "<>", "GLASS",
];

// The near ring: the words you actually want read. PLACEHOLDER for now.
// TODO(raem): swap these for your real name / skills / roles.
export const personalWords = [
  "RAEM", "DESIGN", "ENGINEER", "SYSTEMS", "INTERFACE", "MOTION", "TYPE",
  "CANVAS", "CRAFT", "BUILD", "CODE", "PRODUCT", "DETAIL", "RIGOR",
  "TASTE", "SHIP", "MAKE", "THINK",
];

// The far reaches: self-aware phrases that reward wandering away from where
// the interesting stuff is. Each entry is a full phrase; they tile as blocks.
export const metaPhrases = [
  "WHY ARE YOU LOOKING HERE",
  "NOTHING OUT HERE",
  "THE GOOD PART IS BACK BY YOUR CURSOR",
  "STILL LOOKING",
  "YOU WANDERED OFF",
  "NO ANSWERS AT THE EDGE",
  "YOU CAN STOP READING NOW",
  "THERE IS NOTHING TO FIND THIS FAR OUT",
  "GO BACK",
  "KEEP GOING IF YOU MUST",
  "THIS IS JUST TEXTURE",
];
