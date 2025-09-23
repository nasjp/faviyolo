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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">favigen</h1>
          <p className="text-sm text-slate-300">
            Google
            FontsのURLと1文字を入力するだけでfaviconをプレビュー&ダウンロード。
          </p>
        </header>

        <section className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40">
          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr] sm:items-end">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Font URL
              </span>
              <input
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition hover:border-white/20 focus:border-sky-400"
                placeholder="https://fonts.google.com/specimen/Orbitron"
                value={fontInput}
                onChange={(event) => setFontInput(event.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={handleApplyFont}
              className="h-10 rounded-lg bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
              disabled={!derivedConfig}
            >
              フォントを適用
            </button>
          </div>
          <p className="text-xs text-slate-400">
            fonts.google.comの"/specimen"またはfonts.googleapis.comのCSS
            URLに対応しています。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Character
              </span>
              <input
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-2xl text-white outline-none transition hover:border-white/20 focus:border-sky-400"
                maxLength={4}
                value={charInput}
                onChange={(event) => setCharInput(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Background
              </span>
              <input
                type="color"
                className="h-10 w-full rounded-lg border border-white/10 bg-transparent"
                value={bgColor}
                onChange={(event) => setBgColor(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Foreground
              </span>
              <input
                type="color"
                className="h-10 w-full rounded-lg border border-white/10 bg-transparent"
                value={fgColor}
                onChange={(event) => setFgColor(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <span className="text-xs text-slate-400">
              {fontStatus === "loading" && "フォント読み込み中..."}
              {fontStatus === "ready" &&
                fontConfig &&
                `Using "${fontConfig.fontFamily}"`}
              {fontStatus === "error" && "フォントの読み込みに失敗しました"}
              {fontStatus === "idle" && "デフォルトフォントを使用中"}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-6">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="aspect-square h-auto w-full max-w-xs rounded-2xl shadow-inner shadow-black/60"
              />
            </div>
            <div className="flex flex-col justify-between gap-4">
              <p className="text-sm text-slate-300">
                プレビュー下のボタンからPNG / ICOをダウンロードできます。
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
                >
                  favicon.png
                </button>
                <button
                  type="button"
                  onClick={handleDownloadIco}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  favicon.ico
                </button>
              </div>
            </div>
          </div>
          {previewDataUrl && (
            <div className="grid gap-4 rounded-xl border border-white/5 bg-white/5 p-4 text-slate-100 lg:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3 shadow-inner shadow-black/40">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-md border border-white/5 bg-slate-900/80 px-3 py-2">
                    <Image
                      src={previewDataUrl}
                      alt="16px favicon tab preview"
                      width={16}
                      height={16}
                      className="h-4 w-4 rounded"
                      style={{ imageRendering: "pixelated" }}
                      unoptimized
                    />
                    <span className="text-sm font-medium text-slate-100">
                      favigen - Sample Tab
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md border border-white/10 bg-slate-950/80 p-3">
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
                    <div className="rounded-md border border-white/10 bg-slate-950/80 p-3">
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
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-lg shadow-black/50">
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900">
                    <Image
                      src={previewDataUrl}
                      alt="iPhone share sheet preview"
                      width={96}
                      height={96}
                      className="h-12 w-12 rounded-xl"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col text-sm text-slate-100">
                    <span className="font-semibold">ホーム画面に追加</span>
                    <span className="text-xs text-slate-300">favigen.app</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
