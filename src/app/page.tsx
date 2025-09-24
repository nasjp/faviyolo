"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ColorPicker } from "../components/color-picker";
import { FontPicker } from "../components/font-picker";
import { RadiusSlider } from "../components/radius-slider";
import { FONT_OPTIONS } from "../data/fonts";
import { loadFontFace } from "../lib/font-loader";

type FontStatus = "idle" | "loading" | "ready" | "error";

type FontConfig = {
  cssHref: string;
  fontFamily: string;
};

const CANVAS_SIZE = 256;
const FONT_WEIGHT = 700;

const DEFAULT_FONT_OPTION = FONT_OPTIONS[0];

function randomHexColor() {
  const value = Math.floor(Math.random() * 0xffffff);
  return `#${value.toString(16).padStart(6, "0")}`;
}

type UnicodeRange = {
  start: number;
  end: number;
};

type RandomCharCategory = {
  name: string;
  weight: number;
  ranges: UnicodeRange[];
};

const RANDOM_CHAR_CATEGORIES: RandomCharCategory[] = [
  {
    name: "digits",
    weight: 4,
    ranges: [{ start: 0x30, end: 0x39 }],
  },
  {
    name: "latin-upper",
    weight: 4,
    ranges: [{ start: 0x41, end: 0x5a }],
  },
  {
    name: "latin-lower",
    weight: 4,
    ranges: [{ start: 0x61, end: 0x7a }],
  },
  {
    name: "ascii-punctuation",
    weight: 3,
    ranges: [
      { start: 0x21, end: 0x2f },
      { start: 0x3a, end: 0x40 },
      { start: 0x5b, end: 0x60 },
      { start: 0x7b, end: 0x7e },
    ],
  },
  {
    name: "latin-extended",
    weight: 2,
    ranges: [{ start: 0xa1, end: 0x024f }],
  },
  {
    name: "cjk-punctuation",
    weight: 2,
    ranges: [{ start: 0x3001, end: 0x303f }],
  },
  {
    name: "hiragana",
    weight: 3,
    ranges: [{ start: 0x3041, end: 0x309f }],
  },
  {
    name: "katakana",
    weight: 3,
    ranges: [{ start: 0x30a0, end: 0x30ff }],
  },
  {
    name: "kanji",
    weight: 2,
    ranges: [{ start: 0x4e00, end: 0x9fff }],
  },
  {
    name: "full-width",
    weight: 2,
    ranges: [
      { start: 0xff01, end: 0xff60 },
      { start: 0xffe0, end: 0xffee },
    ],
  },
];

const MAX_RANDOM_CHAR_ATTEMPTS = 50;

const RANDOM_CHAR_EXCLUDED_CODEPOINTS = new Set<number>([0x3097]);

function shouldSkipCodePoint(codePoint: number, char: string) {
  if (codePoint < 0x20) {
    return true;
  }
  if (codePoint >= 0x7f && codePoint <= 0x9f) {
    return true;
  }
  if (codePoint === 0x00ad) {
    return true; // soft hyphen renders inconsistently
  }
  if (!char.trim()) {
    return true; // skip whitespace-like glyphs
  }
  if (RANDOM_CHAR_EXCLUDED_CODEPOINTS.has(codePoint)) {
    return true;
  }
  return false;
}

function createRandomCharPool(ranges: UnicodeRange[]) {
  const items: string[] = [];
  for (const { start, end } of ranges) {
    for (let codePoint = start; codePoint <= end; codePoint += 1) {
      const char = String.fromCodePoint(codePoint);
      if (shouldSkipCodePoint(codePoint, char)) {
        continue;
      }
      items.push(char);
    }
  }
  return items;
}

const RANDOM_CHAR_CATEGORY_POOLS = RANDOM_CHAR_CATEGORIES.map((category) => ({
  ...category,
  pool: createRandomCharPool(category.ranges),
})).filter((category) => category.pool.length > 0);

const RANDOM_CHAR_POOL = RANDOM_CHAR_CATEGORY_POOLS.flatMap(
  (category) => category.pool,
);

const RANDOM_CHAR_TOTAL_WEIGHT = RANDOM_CHAR_CATEGORY_POOLS.reduce(
  (total, category) => total + category.weight,
  0,
);

function pickRandomCategory() {
  if (RANDOM_CHAR_TOTAL_WEIGHT <= 0) {
    return null;
  }
  const target = Math.random() * RANDOM_CHAR_TOTAL_WEIGHT;
  let cumulative = 0;
  for (const category of RANDOM_CHAR_CATEGORY_POOLS) {
    cumulative += category.weight;
    if (target < cumulative) {
      return category;
    }
  }
  return (
    RANDOM_CHAR_CATEGORY_POOLS[RANDOM_CHAR_CATEGORY_POOLS.length - 1] ?? null
  );
}

type RandomCharOptions = {
  validator?: (char: string) => boolean;
};

function randomChar(options: RandomCharOptions = {}) {
  const { validator } = options;
  if (RANDOM_CHAR_POOL.length === 0) {
    return "F";
  }
  for (let attempt = 0; attempt < MAX_RANDOM_CHAR_ATTEMPTS; attempt += 1) {
    const category = pickRandomCategory();
    const sourcePool = category?.pool ?? RANDOM_CHAR_POOL;
    if (sourcePool.length === 0) {
      continue;
    }
    const candidate = sourcePool[Math.floor(Math.random() * sourcePool.length)];
    if (!candidate) {
      continue;
    }
    if (validator && !validator(candidate)) {
      continue;
    }
    return candidate;
  }
  if (validator) {
    const fallback = RANDOM_CHAR_POOL.find((item) => validator(item));
    if (fallback) {
      return fallback;
    }
  }
  return "F";
}

function getLuminance(hex: string) {
  const parsed = hex.replace("#", "");
  const r = parseInt(parsed.slice(0, 2), 16) / 255;
  const g = parseInt(parsed.slice(2, 4), 16) / 255;
  const b = parseInt(parsed.slice(4, 6), 16) / 255;
  const toLinear = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  const linearR = toLinear(r);
  const linearG = toLinear(g);
  const linearB = toLinear(b);
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

async function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to generate PNG"));
      }
    }, "image/png");
  });
}

async function createIcoFromPng(pngBlob: Blob) {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngBuffer);
  const header = new ArrayBuffer(22);
  const view = new DataView(header);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // icon type
  view.setUint16(4, 1, true); // image count
  view.setUint8(6, 0); // width 256 encoded as 0
  view.setUint8(7, 0); // height 256 encoded as 0
  view.setUint8(8, 0); // color palette
  view.setUint8(9, 0); // reserved
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, pngBytes.length, true); // image size
  view.setUint32(18, 22, true); // offset
  return new Blob([header, pngBytes], { type: "image/x-icon" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [selectedFontId, setSelectedFontId] = useState(
    DEFAULT_FONT_OPTION?.id ?? "",
  );
  const selectedFont = useMemo(
    () =>
      FONT_OPTIONS.find((item) => item.id === selectedFontId) ??
      DEFAULT_FONT_OPTION,
    [selectedFontId],
  );
  const [fontConfig, setFontConfig] = useState<FontConfig | null>(
    selectedFont
      ? {
          cssHref: selectedFont.cssHref,
          fontFamily: selectedFont.fontFamily,
        }
      : null,
  );
  const [fontStatus, setFontStatus] = useState<FontStatus>(
    selectedFont ? "loading" : "idle",
  );
  const [previewFontFamily, setPreviewFontFamily] = useState("sans-serif");
  const [charInput, setCharInput] = useState("F");
  const [bgColor, setBgColor] = useState("#020617");
  const [fgColor, setFgColor] = useState("#ffffff");
  const [cornerRadius, setCornerRadius] = useState(0.2);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const randomizeTimeoutRef = useRef<number | null>(null);
  const randomizeIntervalRef = useRef<number | null>(null);

  const getMeasureContext = useCallback(() => {
    if (typeof document === "undefined") {
      return null;
    }
    if (!measureCanvasRef.current) {
      measureCanvasRef.current = document.createElement("canvas");
      measureCanvasRef.current.width = CANVAS_SIZE;
      measureCanvasRef.current.height = CANVAS_SIZE;
    }
    return measureCanvasRef.current.getContext("2d");
  }, []);

  const createCharFitsValidator = useCallback(
    (fontFamily: string) => {
      const ctx = getMeasureContext();
      if (!ctx) {
        return undefined;
      }
      const fontSize = Math.round(CANVAS_SIZE * 0.68);
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `${FONT_WEIGHT} ${fontSize}px "${fontFamily}"`;
      const safeBounds = CANVAS_SIZE * 0.92;
      return (char: string) => {
        const metrics = ctx.measureText(char);
        const widthLeft = metrics.actualBoundingBoxLeft ?? 0;
        const widthRight = metrics.actualBoundingBoxRight ?? 0;
        const totalWidth = widthLeft + widthRight || metrics.width;
        const ascent = metrics.actualBoundingBoxAscent ?? fontSize * 0.7;
        const descent = metrics.actualBoundingBoxDescent ?? fontSize * 0.3;
        const totalHeight = ascent + descent;
        return totalWidth <= safeBounds && totalHeight <= safeBounds;
      };
    },
    [getMeasureContext],
  );

  const clearRandomizeTimers = useCallback(() => {
    if (randomizeTimeoutRef.current !== null) {
      window.clearTimeout(randomizeTimeoutRef.current);
      randomizeTimeoutRef.current = null;
    }
    if (randomizeIntervalRef.current !== null) {
      window.clearInterval(randomizeIntervalRef.current);
      randomizeIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearRandomizeTimers();
    };
  }, [clearRandomizeTimers]);

  const displayChar = useMemo(() => {
    const chars = Array.from(charInput);
    if (chars.length === 0) {
      return "F";
    }
    return chars[0];
  }, [charInput]);

  useEffect(() => {
    if (!selectedFont) {
      setFontConfig(null);
      setFontStatus("idle");
      return;
    }
    setFontStatus("loading");
    setFontConfig({
      cssHref: selectedFont.cssHref,
      fontFamily: selectedFont.fontFamily,
    });
  }, [selectedFont]);

  useEffect(() => {
    if (!fontConfig) {
      setFontStatus("idle");
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        await loadFontFace({
          cssHref: fontConfig.cssHref,
          fontFamily: fontConfig.fontFamily,
          weight: String(FONT_WEIGHT),
          size: CANVAS_SIZE,
        });
        if (!cancelled) {
          setFontStatus("ready");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setFontStatus("error");
        }
      }
    };

    setFontStatus("loading");
    void load();

    return () => {
      cancelled = true;
    };
  }, [fontConfig]);

  useEffect(() => {
    if (!fontConfig) {
      setPreviewFontFamily("sans-serif");
      return;
    }
    if (fontStatus === "ready") {
      setPreviewFontFamily(fontConfig.fontFamily);
      return;
    }
    if (fontStatus === "error") {
      setPreviewFontFamily("sans-serif");
    }
  }, [fontConfig, fontStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const size = CANVAS_SIZE;
    ctx.clearRect(0, 0, size, size);
    const radiusPx = Math.min(size / 2, size * cornerRadius);
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (radiusPx >= size / 2) {
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    } else {
      ctx.moveTo(radiusPx, 0);
      ctx.arcTo(size, 0, size, size, radiusPx);
      ctx.arcTo(size, size, 0, size, radiusPx);
      ctx.arcTo(0, size, 0, 0, radiusPx);
      ctx.arcTo(0, 0, size, 0, radiusPx);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fgColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const fontFamily = previewFontFamily;
    const fontSize = Math.round(size * 0.68);
    ctx.font = `${FONT_WEIGHT} ${fontSize}px "${fontFamily}"`;
    const metrics = ctx.measureText(displayChar);
    const ascent = metrics.actualBoundingBoxAscent ?? fontSize * 0.7;
    const descent = metrics.actualBoundingBoxDescent ?? fontSize * 0.3;
    const baselineY = size / 2 + (ascent - descent) / 2;
    const left = metrics.actualBoundingBoxLeft ?? metrics.width / 2;
    const right = metrics.actualBoundingBoxRight ?? metrics.width / 2;
    const xOffset = (left - right) / 2;
    ctx.fillText(displayChar, size / 2 + xOffset, baselineY);
    const nextDataUrl = canvas.toDataURL("image/png");
    setPreviewDataUrl(nextDataUrl);
  }, [bgColor, fgColor, cornerRadius, displayChar, previewFontFamily]);

  const handleDownloadPng = useCallback(async () => {
    if (!canvasRef.current) {
      return;
    }
    const pngBlob = await canvasToPngBlob(canvasRef.current);
    downloadBlob(pngBlob, "favicon.png");
  }, []);

  const handleDownloadIco = useCallback(async () => {
    if (!canvasRef.current) {
      return;
    }
    const pngBlob = await canvasToPngBlob(canvasRef.current);
    const icoBlob = await createIcoFromPng(pngBlob);
    downloadBlob(icoBlob, "favicon.ico");
  }, []);

  const randomizeOnce = useCallback(() => {
    const randomFont =
      FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)] ??
      DEFAULT_FONT_OPTION;
    setSelectedFontId(randomFont.id);

    const validator = createCharFitsValidator(randomFont.fontFamily);
    const nextChar = validator ? randomChar({ validator }) : randomChar();
    setCharInput(nextChar);

    let resolvedBg = randomHexColor();
    setBgColor((previous) => {
      let nextBg = resolvedBg;
      let safety = 0;
      while (nextBg.toLowerCase() === previous.toLowerCase() && safety < 5) {
        nextBg = randomHexColor();
        safety += 1;
      }
      resolvedBg = nextBg;
      return nextBg;
    });

    const luminance = getLuminance(resolvedBg);
    setFgColor(
      luminance > 0.6 ? "#0f172a" : luminance < 0.2 ? "#fafafa" : "#ffffff",
    );

    const nextRadius = Math.round(Math.random() * 50) / 100;
    setCornerRadius(nextRadius);
  }, [createCharFitsValidator]);

  const handleRandomizeClick = useCallback(() => {
    clearRandomizeTimers();
    randomizeOnce();
  }, [clearRandomizeTimers, randomizeOnce]);

  const handleRandomizePointerDown = useCallback(() => {
    clearRandomizeTimers();
    randomizeTimeoutRef.current = window.setTimeout(() => {
      randomizeOnce();
      randomizeIntervalRef.current = window.setInterval(randomizeOnce, 200);
    }, 350);
  }, [clearRandomizeTimers, randomizeOnce]);

  const handleRandomizePointerEnd = useCallback(() => {
    clearRandomizeTimers();
  }, [clearRandomizeTimers]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-12 lg:gap-12">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">faviyolo</h1>
            <p className="text-sm text-gray-600">
              Generate a favicon by picking a Google Font and a single
              character.
            </p>
          </div>
          <a
            href="https://github.com/nasjp/faviyolo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Open repository</title>
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M21 21H3V3" />
            </svg>
            View on GitHub
          </a>
        </header>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <section className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <h2 className="text-base font-medium text-gray-900">Preview</h2>
              <span>
                {fontStatus === "error" && "Failed to load font"}
                {fontStatus === "idle" && "Using default font"}
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex items-center justify-center rounded border border-gray-300 p-4">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="aspect-square h-auto w-full max-w-xs"
                  style={{ borderRadius: `${cornerRadius * 100}%` }}
                />
              </div>
              <div className="space-y-4 text-sm text-gray-600">
                <p>Download both formats straight from the live preview.</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Download PNG</title>
                      <path d="M12 3v12" />
                      <path d="m8 11 4 4 4-4" />
                      <path d="M5 19h14" />
                    </svg>
                    favicon.png
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadIco}
                    className="flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Download ICO</title>
                      <path d="M12 3v12" />
                      <path d="m8 11 4 4 4-4" />
                      <path d="M5 19h14" />
                    </svg>
                    favicon.ico
                  </button>
                </div>
                {previewDataUrl && (
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div
                      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded"
                      style={{ borderRadius: `${cornerRadius * 100}%` }}
                    >
                      <Image
                        src={previewDataUrl}
                        alt="Download preview"
                        width={48}
                        height={48}
                        className="h-full w-full object-contain"
                        unoptimized
                      />
                    </div>
                    <span>256×256 px</span>
                  </div>
                )}
              </div>
            </div>
            {previewDataUrl && (
              <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-800 lg:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white shadow-sm">
                    <Image
                      src={previewDataUrl}
                      alt="16px favicon tab preview"
                      width={16}
                      height={16}
                      className="h-4 w-4 rounded"
                      style={{ imageRendering: "pixelated" }}
                      unoptimized
                    />
                    <span className="text-sm font-medium">
                      faviyolo - Sample Tab
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-4 text-white shadow-md">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40">
                    <div
                      className="flex h-12 w-12 items-center justify-center"
                      style={{
                        borderRadius: `${cornerRadius * 100}%`,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={previewDataUrl}
                        alt="iPhone share sheet preview"
                        width={48}
                        height={48}
                        className="h-full w-full object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Add to Home Screen</span>
                    <div className="text-xs text-white/70">faviyolo.app</div>
                  </div>
                </div>
              </div>
            )}
            {previewDataUrl && (
              <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 text-gray-700 lg:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
                  <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm">
                    <Image
                      src={previewDataUrl}
                      alt="16px favicon tab preview (light)"
                      width={16}
                      height={16}
                      className="h-4 w-4 rounded"
                      style={{ imageRendering: "pixelated" }}
                      unoptimized
                    />
                    <span className="text-sm font-medium">
                      faviyolo – Light Tab
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-100 to-gray-100 px-4 py-4 text-gray-800 shadow-md">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                    <div
                      className="flex h-12 w-12 items-center justify-center"
                      style={{
                        borderRadius: `${cornerRadius * 100}%`,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={previewDataUrl}
                        alt="iPhone share sheet preview (light)"
                        width={48}
                        height={48}
                        className="h-full w-full object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Add to Home Screen</span>
                    <div className="text-xs text-gray-500">faviyolo.app</div>
                  </div>
                </div>
              </div>
            )}
          </section>
          <aside className="space-y-6">
            <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
              <button
                type="button"
                onClick={handleRandomizeClick}
                onPointerDown={handleRandomizePointerDown}
                onPointerUp={handleRandomizePointerEnd}
                onPointerLeave={handleRandomizePointerEnd}
                onPointerCancel={handleRandomizePointerEnd}
                className="flex w-full items-center justify-center gap-2 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>Generate random favicon</title>
                  <path d="m3 3 3 3-3 3" />
                  <path d="M21 21l-3-3 3-3" />
                  <path d="M6 6h9a3 3 0 0 1 3 3v1" />
                  <path d="M18 18h-9a3 3 0 0 1-3-3v-1" />
                </svg>
                Randomize
              </button>
              <div className="space-y-3">
                <FontPicker
                  label="Font"
                  value={selectedFontId}
                  onChange={setSelectedFontId}
                  options={FONT_OPTIONS}
                />
              </div>
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <label className="space-y-1 text-sm">
                  <span className="text-xs uppercase text-gray-500">
                    Character
                  </span>
                  <input
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-2xl focus:border-gray-900 focus:outline-none"
                    maxLength={4}
                    value={charInput}
                    onChange={(event) => setCharInput(event.target.value)}
                    onBlur={(event) => {
                      const chars = Array.from(event.target.value);
                      if (chars.length > 1) {
                        setCharInput(chars[0] ?? "");
                      }
                    }}
                  />
                </label>
              </div>
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <ColorPicker
                  key={`bg-${bgColor}`}
                  id="background-color"
                  label="Background"
                  value={bgColor}
                  onChange={setBgColor}
                />
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <ColorPicker
                    key={`fg-${fgColor}`}
                    id="foreground-color"
                    label="Foreground"
                    value={fgColor}
                    onChange={setFgColor}
                  />
                </div>
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <RadiusSlider
                    label="Corner Radius"
                    value={cornerRadius}
                    min={0}
                    max={0.5}
                    step={0.01}
                    onChange={setCornerRadius}
                  />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
