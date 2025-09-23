"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FontStatus = "idle" | "loading" | "ready" | "error";

type FontConfig = {
  cssHref: string;
  fontFamily: string;
};

const CANVAS_SIZE = 256;
const FONT_WEIGHT = 700;

const GOOGLE_SPECIMEN_PREFIX = "/specimen/";
const DEFAULT_FONT_URL = "https://fonts.google.com/specimen/Orbitron";

function normalizeFontName(rawName: string) {
  return decodeURIComponent(rawName.replace(/\+/g, " "));
}

function buildCssUrlFromSpecimen(pathname: string) {
  const specimenIndex = pathname.indexOf(GOOGLE_SPECIMEN_PREFIX);
  if (specimenIndex === -1) {
    return null;
  }
  const raw = pathname
    .slice(specimenIndex + GOOGLE_SPECIMEN_PREFIX.length)
    .split("/")[0];
  if (!raw) {
    return null;
  }
  const familyName = normalizeFontName(raw);
  const familyParam = familyName.trim().replace(/\s+/g, "+");
  return {
    cssHref: `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400;500;700&display=swap`,
    fontFamily: familyName,
  } satisfies FontConfig;
}

function buildConfigFromGoogleCss(url: URL) {
  const family = url.searchParams.get("family");
  if (!family) {
    return null;
  }
  const rawFamily = family.split(":")[0];
  const fontFamily = normalizeFontName(rawFamily);
  return {
    cssHref: url.href,
    fontFamily,
  } satisfies FontConfig;
}

function deriveFontConfig(input: string): FontConfig | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("fonts.googleapis.com")) {
      const config = buildConfigFromGoogleCss(parsed);
      return config ?? null;
    }
    if (parsed.hostname.includes("fonts.google.com")) {
      return buildCssUrlFromSpecimen(parsed.pathname);
    }
  } catch (error) {
    console.error("Invalid font URL", error);
    return null;
  }
  return null;
}

const DEFAULT_FONT_CONFIG = deriveFontConfig(DEFAULT_FONT_URL);

async function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG生成に失敗しました"));
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
  const [fontInput, setFontInput] = useState(DEFAULT_FONT_URL);
  const [fontConfig, setFontConfig] = useState<FontConfig | null>(
    DEFAULT_FONT_CONFIG,
  );
  const [fontStatus, setFontStatus] = useState<FontStatus>(
    DEFAULT_FONT_CONFIG ? "loading" : "idle",
  );
  const [charInput, setCharInput] = useState("F");
  const [bgColor, setBgColor] = useState("#020617");
  const [fgColor, setFgColor] = useState("#ffffff");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const displayChar = useMemo(() => {
    const chars = Array.from(charInput);
    if (chars.length === 0) {
      return "F";
    }
    return chars[0];
  }, [charInput]);

  const derivedConfig = useMemo(() => deriveFontConfig(fontInput), [fontInput]);

  useEffect(() => {
    if (!fontConfig) {
      setFontStatus("idle");
      return undefined;
    }
    const identifier = btoa(fontConfig.cssHref).replace(/=/g, "").slice(0, 12);
    const existing = document.querySelector<HTMLLinkElement>(
      `link[data-favigen="${identifier}"]`,
    );

    let linkElement = existing;
    let appended = false;
    let active = true;

    const ensureLink = () => {
      if (linkElement) {
        return;
      }
      linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = fontConfig.cssHref;
      linkElement.dataset.favigen = identifier;
      document.head.appendChild(linkElement);
      appended = true;
    };

    const handleError = () => {
      if (active) {
        setFontStatus("error");
      }
    };

    ensureLink();
    linkElement?.addEventListener("error", handleError);

    const supportsFontLoading = typeof document.fonts !== "undefined";
    if (!supportsFontLoading) {
      setFontStatus("ready");
      return () => {
        active = false;
        linkElement?.removeEventListener("error", handleError);
        if (appended && linkElement && document.head.contains(linkElement)) {
          document.head.removeChild(linkElement);
        }
      };
    }

    setFontStatus("loading");

    const fontFaceSet = document.fonts;

    const loadFont = async () => {
      try {
        await fontFaceSet.load(
          `${FONT_WEIGHT} ${CANVAS_SIZE}px "${fontConfig.fontFamily}"`,
        );
        if (active) {
          setFontStatus("ready");
        }
      } catch (error) {
        console.error(error);
        handleError();
      }
    };

    void loadFont();

    return () => {
      active = false;
      linkElement?.removeEventListener("error", handleError);
      if (appended && linkElement && document.head.contains(linkElement)) {
        document.head.removeChild(linkElement);
      }
    };
  }, [fontConfig]);

  const drawPreview = useCallback(() => {
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
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fgColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontFamily =
      fontStatus === "ready" && fontConfig
        ? fontConfig.fontFamily
        : "sans-serif";
    const fontSize = Math.round(size * 0.68);
    ctx.font = `${FONT_WEIGHT} ${fontSize}px "${fontFamily}"`;
    ctx.fillText(displayChar, size / 2, size / 2 + size * 0.04);
    const nextDataUrl = canvas.toDataURL("image/png");
    setPreviewDataUrl(nextDataUrl);
  }, [bgColor, fgColor, displayChar, fontConfig, fontStatus]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleApplyFont = useCallback(() => {
    if (!derivedConfig) {
      return;
    }
    setFontStatus("loading");
    setFontConfig(derivedConfig);
  }, [derivedConfig]);

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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">favigen</h1>
          <p className="text-sm text-gray-600">
            Google
            FontsのURLと1文字を入力するだけでfaviconをプレビュー&ダウンロード。
          </p>
        </header>
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase text-gray-500">Font URL</span>
              <input
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="https://fonts.google.com/specimen/Orbitron"
                value={fontInput}
                onChange={(event) => setFontInput(event.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={handleApplyFont}
              className="h-10 rounded border border-gray-900 px-4 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400"
              disabled={!derivedConfig}
            >
              フォントを適用
            </button>
          </div>
          <p className="text-xs text-gray-500">
            fonts.google.comの"/specimen"またはfonts.googleapis.comのCSS
            URLに対応しています。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase text-gray-500">Character</span>
              <input
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-2xl focus:border-gray-900 focus:outline-none"
                maxLength={4}
                value={charInput}
                onChange={(event) => setCharInput(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase text-gray-500">
                Background
              </span>
              <input
                type="color"
                className="h-10 w-full rounded border border-gray-300 bg-white"
                value={bgColor}
                onChange={(event) => setBgColor(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase text-gray-500">
                Foreground
              </span>
              <input
                type="color"
                className="h-10 w-full rounded border border-gray-300 bg-white"
                value={fgColor}
                onChange={(event) => setFgColor(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <h2 className="text-base font-medium text-gray-900">Preview</h2>
            <span>
              {fontStatus === "loading" && "フォント読み込み中"}
              {fontStatus === "ready" &&
                fontConfig &&
                `Using "${fontConfig.fontFamily}"`}
              {fontStatus === "error" && "フォントの読み込みに失敗しました"}
              {fontStatus === "idle" && "デフォルトフォントを使用中"}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex items-center justify-center rounded border border-gray-300 p-4">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="aspect-square h-auto w-full max-w-xs"
              />
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <p>PNG / ICOをダウンロードしてすぐに使えます。</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="rounded border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                >
                  favicon.png
                </button>
                <button
                  type="button"
                  onClick={handleDownloadIco}
                  className="rounded border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                >
                  favicon.ico
                </button>
              </div>
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
                    favigen - Sample Tab
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md border border-gray-200 bg-white p-3 shadow-inner">
                    <Image
                      src={previewDataUrl}
                      alt="16px favicon standalone"
                      width={16}
                      height={16}
                      className="h-4 w-4"
                      style={{ imageRendering: "pixelated" }}
                      unoptimized
                    />
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-3 shadow-inner">
                    <Image
                      src={previewDataUrl}
                      alt="32px favicon standalone"
                      width={32}
                      height={32}
                      className="h-8 w-8"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-4 text-white shadow-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40">
                  <Image
                    src={previewDataUrl}
                    alt="iPhone share sheet preview"
                    width={96}
                    height={96}
                    className="h-12 w-12 rounded-xl"
                    unoptimized
                  />
                </div>
                <div className="text-sm">
                  <span className="font-medium">ホーム画面に追加</span>
                  <div className="text-xs text-white/70">favigen.app</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
