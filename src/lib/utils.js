export function promiseWithAbort(promiseOrFn, signal) {
  try {
    const p = typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
    if (!(p instanceof Promise)) return Promise.resolve(p);

    if (signal.aborted) return Promise.reject(new Error("shouldStop"));

    return Promise.race([
      p,
      new Promise((_, rej) => {
        signal.addEventListener("abort", () => rej(new Error("shouldStop")), {
          once: true
        });
      })
    ]);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const tweenEasing = {
  InLinear: (t) => t,
  OutLinear: (t) => t,
  InOutLinear: (t) => t,
  InSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  OutSine: (t) => Math.sin((t * Math.PI) / 2),
  InOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  InQuad: (t) => t * t,
  OutQuad: (t) => 1 - (1 - t) * (1 - t),
  InOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  InCubic: (t) => t * t * t,
  OutCubic: (t) => 1 - Math.pow(1 - t, 3),
  InOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  InQuart: (t) => t * t * t * t,
  OutQuart: (t) => 1 - Math.pow(1 - t, 4),
  InOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  InQuint: (t) => t * t * t * t * t,
  OutQuint: (t) => 1 - Math.pow(1 - t, 5),
  InOutQuint: (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  InExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  OutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  InOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  InCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  OutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  InOutCirc: (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  InBack: (t) => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  OutBack: (t) => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  InOutBack: (t) => {
    const c1 = 1.70158,
      c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2;
  },
  InElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  OutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  InOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  InBounce: (t) => 1 - tweenEasing.OutBounce(1 - t),
  OutBounce: (t) => {
    const n1 = 7.5625,
      d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  InOutBounce: (t) =>
    t < 0.5
      ? (1 - tweenEasing.OutBounce(1 - 2 * t)) / 2
      : (1 + tweenEasing.OutBounce(2 * t - 1)) / 2
};

/**
 * Blends a hex color toward white (positive percent) or black (negative percent).
 * @param {string} color An RGB hex color
 * @param {number} percent The percent to blend
 * @returns The shaded RGB hex color
 */
export function shadeColor(color, percent) {
  let f = parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Calculates brightness of a color.
 * @param {string} color An RGB hex color
 * @returns A number from 0 to 255, > 128 is generally considered light
 */
export function getLuminance(color) {
  let f = parseInt(color.slice(1), 16),
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (R * 299 + G * 587 + B * 114) / 1000;
}

/**
 * Capitalize the first letter in the string.
 * @param {string} string The string
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(string) {
  if (string.length === 0) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function escapeHtml(str) {
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function prettyXml(node, level = 0) {
  const indent = "  ".repeat(level);
  const childNodes = Array.from(node.childNodes);
  const elements = childNodes.filter((n) => n.nodeType === Node.ELEMENT_NODE);
  const text = childNodes
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.nodeValue.trim())
    .join("");

  const attrs = Array.from(node.attributes || [])
    .map((a) => ` ${a.name}="${escapeHtml(a.value)}"`)
    .join("");

  if (elements.length === 0) {
    return `${indent}<${node.nodeName}${attrs}>${escapeHtml(text)}</${node.nodeName}>`;
  }

  const inner = elements.map((child) => prettyXml(child, level + 1)).join("\n");
  return `${indent}<${node.nodeName}${attrs}>\n${inner}\n${indent}</${node.nodeName}>`;
}

export function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function isUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}