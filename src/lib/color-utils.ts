export type HsvaColor = {
  h: number;
  s: number;
  v: number;
  a: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHex(input: string) {
  let hex = input.trim();
  if (!hex.startsWith("#")) {
    hex = `#${hex}`;
  }
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (hex.length >= 7) {
    return hex.slice(0, 7);
  }
  return "#000000";
}

export function hexToHsva(hex: string): HsvaColor {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v, a: 1 };
}

export function hsvaToRgba({ h, s, v, a }: HsvaColor) {
  const c = v * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hh >= 0 && hh < 1) {
    r = c;
    g = x;
  } else if (hh >= 1 && hh < 2) {
    r = x;
    g = c;
  } else if (hh >= 2 && hh < 3) {
    g = c;
    b = x;
  } else if (hh >= 3 && hh < 4) {
    g = x;
    b = c;
  } else if (hh >= 4 && hh < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toByte = (value: number) => Math.round((value + m) * 255);

  return {
    r: clamp(toByte(r), 0, 255),
    g: clamp(toByte(g), 0, 255),
    b: clamp(toByte(b), 0, 255),
    a: clamp(a, 0, 1),
  };
}

export function hsvaToHex(color: HsvaColor) {
  const { r, g, b } = hsvaToRgba(color);
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbaToCss({ r, g, b, a }: ReturnType<typeof hsvaToRgba>) {
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

export function hsvaToHslaString(color: HsvaColor) {
  const { h, s, v, a } = color;
  const l = v - (v * s) / 2;
  const sat = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  return `hsla(${Math.round(h)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%, ${a.toFixed(2)})`;
}

export function formatColor(color: HsvaColor, format: "hex" | "rgba" | "hsla") {
  switch (format) {
    case "rgba":
      return rgbaToCss(hsvaToRgba(color));
    case "hsla":
      return hsvaToHslaString(color);
    default:
      return hsvaToHex(color);
  }
}

export function normalizeHsva(
  value: Partial<HsvaColor>,
  fallback: HsvaColor,
): HsvaColor {
  return {
    h: clamp(value.h ?? fallback.h ?? 0, 0, 360),
    s: clamp(value.s ?? fallback.s ?? 0, 0, 1),
    v: clamp(value.v ?? fallback.v ?? 0, 0, 1),
    a: clamp(value.a ?? fallback.a ?? 1, 0, 1),
  };
}

export function withAlphaHex(hex: string, alpha: number) {
  const normalized = normalizeHex(hex);
  const value = Math.round(clamp(alpha, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${normalized}${value}`;
}
