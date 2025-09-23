"use client";

import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { HsvaColor } from "../lib/color-utils";
import {
  formatColor,
  hexToHsva,
  hsvaToHex,
  hsvaToRgba,
  normalizeHsva,
} from "../lib/color-utils";

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

const FORMAT_OPTIONS = [
  { value: "hex", label: "HEX" },
  { value: "rgba", label: "RGBA" },
  { value: "hsla", label: "HSLA" },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type PointerEventLike = MouseEvent | TouchEvent;

function getRelativePosition(event: PointerEventLike, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  let clientX: number;
  let clientY: number;
  if (event instanceof TouchEvent) {
    clientX = event.touches[0]?.clientX ?? 0;
    clientY = event.touches[0]?.clientY ?? 0;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  const x = clamp((clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((clientY - rect.top) / rect.height, 0, 1);
  return { x, y };
}

type ColorPickerProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ id, label, value, onChange }: ColorPickerProps) {
  const reactId = useId();
  const inputId = id ?? `color-input-${reactId}`;
  const hueId = `${inputId}-hue`;
  const alphaId = `${inputId}-alpha`;
  const initial = useMemo(() => hexToHsva(value), [value]);
  const [hsva, setHsva] = useState<HsvaColor>(initial);
  const [format, setFormat] =
    useState<(typeof FORMAT_OPTIONS)[number]["value"]>("hex");
  const areaRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [eyeDropperAvailable, setEyeDropperAvailable] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHsva((prev) => normalizeHsva(prev, hexToHsva(value)));
  }, [value]);

  useEffect(() => {
    onChange(hsvaToHex(hsva));
  }, [hsva, onChange]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setEyeDropperAvailable(!!window.EyeDropper);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        !containerRef.current ||
        (target && containerRef.current.contains(target))
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const hueColor = useMemo(
    () => hsvaToHex({ ...hsva, s: 1, v: 1, a: 1 }),
    [hsva],
  );
  const rgba = useMemo(() => hsvaToRgba(hsva), [hsva]);
  const cssRgba = useMemo(
    () => `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
    [rgba],
  );
  const formatted = useMemo(() => formatColor(hsva, format), [hsva, format]);

  const handleAreaPointer = (event: PointerEventLike) => {
    event.preventDefault();
    const element = areaRef.current;
    if (!element) return;
    const { x, y } = getRelativePosition(event, element);
    setHsva((prev) => ({ ...prev, s: x, v: 1 - y }));
  };

  const startDragging = (startEvent: PointerEventLike) => {
    setOpen(true);
    handleAreaPointer(startEvent);
    const mouseMove = (moveEvent: MouseEvent) => {
      handleAreaPointer(moveEvent);
    };
    const touchMove = (moveEvent: TouchEvent) => {
      handleAreaPointer(moveEvent);
    };
    const stop = () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("touchmove", touchMove, {
      passive: false,
    });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
  };

  const handleAreaMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    startDragging(event.nativeEvent);
  };

  const handleAreaTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    startDragging(event.nativeEvent);
  };

  const handleHueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextHue = Number(event.target.value);
    setHsva((prev) => ({ ...prev, h: nextHue }));
  };

  const handleAlphaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextAlpha = Number(event.target.value);
    setHsva((prev) => ({ ...prev, a: nextAlpha }));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setHsva(hexToHsva(raw));
  };

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(event.target.value as (typeof FORMAT_OPTIONS)[number]["value"]);
  };

  const pickWithEyeDropper = async () => {
    if (!eyeDropperAvailable || !window.EyeDropper) return;
    try {
      const result = await new window.EyeDropper().open();
      if (result?.sRGBHex) {
        setHsva(hexToHsva(result.sRGBHex));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cursorStyle = {
    left: `${hsva.s * 100}%`,
    top: `${(1 - hsva.v) * 100}%`,
  } satisfies React.CSSProperties;

  const overlay = (
    <div
      role="dialog"
      aria-modal="false"
      className="absolute left-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
    >
      <div className="space-y-3">
        <div
          ref={areaRef}
          onMouseDown={handleAreaMouseDown}
          onTouchStart={handleAreaTouchStart}
          role="application"
          aria-label={label ? `${label} color area` : "color selection"}
          className="relative h-40 w-full cursor-crosshair overflow-hidden rounded border border-gray-300"
          style={{
            backgroundImage: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, ${hueColor})`,
          }}
        >
          <div
            className="pointer-events-none absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={cursorStyle}
          >
            <span className="block h-3 w-3 rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor={hueId}
            className="flex items-center justify-between text-xs uppercase text-gray-500"
          >
            <span>Hue</span>
            <span className="font-mono text-gray-400">
              {Math.round(hsva.h)}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={360}
            value={hsva.h}
            onChange={handleHueChange}
            id={hueId}
            className="h-2 w-full cursor-ew-resize appearance-none rounded bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor={alphaId}
            className="flex items-center justify-between text-xs uppercase text-gray-500"
          >
            <span>Alpha</span>
            <span className="font-mono text-gray-400">
              {Math.round(hsva.a * 100)}%
            </span>
          </label>
          <div
            className="relative h-2 w-full rounded"
            style={{
              background: `linear-gradient(90deg, rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0), ${cssRgba})`,
            }}
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={hsva.a}
              onChange={handleAlphaChange}
              id={alphaId}
              className="absolute inset-0 h-2 w-full cursor-ew-resize appearance-none bg-transparent"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <button
            type="button"
            onClick={pickWithEyeDropper}
            className="flex h-10 items-center gap-2 rounded border border-gray-900 px-3 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400"
            disabled={!eyeDropperAvailable}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Eyedropper</title>
              <path d="m12 2 6 6" />
              <path d="m11 3-9 9v3h3l9-9" />
              <path d="M16 7 7 16" />
              <path d="M4 13h4" />
            </svg>
            ピッカー
          </button>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              id={inputId}
              value={hsvaToHex(hsva)}
              onChange={handleInputChange}
              className="h-10 w-full rounded border border-gray-300 bg-white px-3 font-mono text-sm focus:border-gray-900 focus:outline-none"
            />
            <select
              value={format}
              onChange={handleFormatChange}
              className="h-10 rounded border border-gray-300 bg-white px-3 text-sm focus:border-gray-900 focus:outline-none"
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <span className="font-medium text-gray-500">Color</span>
          <span className="font-mono">{formatted}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${inputId}-panel`}
        className="flex w-full items-center justify-between gap-3 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <span className="flex flex-col">
          <span className="text-xs uppercase text-gray-500">
            {label ?? "Color"}
          </span>
          <span className="font-mono text-gray-700">{hsvaToHex(hsva)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="h-8 w-8 rounded border border-gray-200"
            style={{ backgroundColor: hsvaToHex(hsva) }}
            aria-hidden
          />
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-gray-500"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>色編集パネルを開閉</title>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <div id={`${inputId}-panel`} className="relative">
          {overlay}
        </div>
      )}
    </div>
  );
}

export function ColorPreview({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`h-12 w-12 rounded border border-gray-200 ${className ?? ""}`}
      style={{ backgroundColor: color }}
    />
  );
}
