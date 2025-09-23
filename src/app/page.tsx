"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ColorPicker } from "../components/color-picker";
import { FontPicker } from "../components/font-picker";
import { FONT_OPTIONS, toFontStack } from "../data/fonts";

type FontStatus = "idle" | "loading" | "ready" | "error";

type FontConfig = {
  cssHref: string;
  fontFamily: string;
};

const CANVAS_SIZE = 256;
const FONT_WEIGHT = 700;

const DEFAULT_FONT_OPTION = FONT_OPTIONS[0];

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
  const [selectedFontId, setSelectedFontId] = useState(
    DEFAULT_FONT_OPTION?.id ?? "",
  );
  const selectedFont = useMemo(
    () =>
      FONT_OPTIONS.find((item) => item.id === selectedFontId) ??
      DEFAULT_FONT_OPTION,
    [selectedFontId],
  );
  const activeFontStack = useMemo(
    () => (selectedFont ? toFontStack(selectedFont.fontFamily) : undefined),
    [selectedFont],
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
      return undefined;
    }
    const identifier = `favigen-${btoa(fontConfig.cssHref)
      .replace(/=+/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-12 lg:gap-12">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">favigen</h1>
          <p className="text-sm text-gray-600">
            Google
            FontsのURLと1文字を入力するだけでfaviconをプレビュー&ダウンロード。
          </p>
        </header>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <section className="space-y-4">
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
                  <div
                    className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white shadow-sm"
                    style={{
                      fontFamily: activeFontStack,
                      fontWeight: FONT_WEIGHT,
                    }}
                  >
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
                <div
                  className="flex items-center gap-3 rounded-2xl border border-gray-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-4 text-white shadow-md"
                  style={{
                    fontFamily: activeFontStack,
                    fontWeight: FONT_WEIGHT,
                  }}
                >
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
          <aside className="space-y-6">
            <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
              <FontPicker
                label="Font"
                value={selectedFontId}
                onChange={setSelectedFontId}
                options={FONT_OPTIONS}
              />
              <p className="text-xs text-gray-500">
                プリセットからフォントを検索・選択すると即座にプレビューへ適用されます。
              </p>
            </section>
            <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase text-gray-500">
                  Character
                </span>
                <input
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-2xl focus:border-gray-900 focus:outline-none"
                  maxLength={4}
                  value={charInput}
                  onChange={(event) => setCharInput(event.target.value)}
                />
              </label>
              <div className="grid gap-4">
                <ColorPicker
                  id="background-color"
                  label="Background"
                  value={bgColor}
                  onChange={setBgColor}
                />
                <ColorPicker
                  id="foreground-color"
                  label="Foreground"
                  value={fgColor}
                  onChange={setFgColor}
                />
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
