"use client";

import { useId } from "react";

type RadiusSliderProps = {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

export function RadiusSlider({
  label = "Radius",
  value,
  min = 0,
  max = 0.5,
  step = 0.01,
  onChange,
}: RadiusSliderProps) {
  const id = useId();

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-center justify-between text-xs uppercase text-gray-500"
      >
        <span>{label}</span>
        <span className="font-mono text-gray-400">
          {(value * 100).toFixed(0)}%
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-ew-resize appearance-none rounded bg-gray-200 accent-gray-900"
      />
    </div>
  );
}
