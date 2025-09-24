"use client";

import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { FontOption } from "../data/fonts";
import { toFontStack } from "../data/fonts";

type FontPickerProps = {
  label?: string;
  value: string;
  onChange: (id: string) => void;
  options: FontOption[];
};

export function FontPicker({
  label,
  value,
  onChange,
  options,
}: FontPickerProps) {
  const reactId = useId();
  const buttonId = `${reactId}-font-trigger`;
  const panelId = `${reactId}-font-panel`;
  const searchId = `${reactId}-font-search`;
  const searchRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOption = useMemo(
    () => options.find((item) => item.id === value) ?? options[0],
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return options;
    }
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(keyword) ||
        option.fontFamily.toLowerCase().includes(keyword),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

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

  const handleSelect = (option: FontOption) => {
    onChange(option.id);
    setOpen(false);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!filteredOptions.length) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length,
      );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const next = filteredOptions[activeIndex] ?? filteredOptions[0];
      handleSelect(next);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {label && (
        <span className="text-xs uppercase text-gray-500">
          {label ?? "Font"}
        </span>
      )}
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setActiveIndex(0);
            }
            return next;
          })
        }
        className="flex w-full items-center justify-between gap-3 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <span className="flex flex-col">
          <span className="font-medium">{selectedOption?.name ?? "Font"}</span>
          <span className="text-xs text-gray-500">
            {selectedOption?.fontFamily}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-base"
            style={{
              fontFamily: selectedOption
                ? toFontStack(selectedOption.fontFamily)
                : undefined,
            }}
            aria-hidden
          >
            {selectedOption?.sample ?? "Aa"}
          </span>
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
            <title>Toggle font list</title>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={buttonId}
          className="relative z-30"
        >
          <div className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
            <div className="relative">
              <input
                id={searchId}
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search..."
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div className="mt-3 max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-gray-500">
                  No matching fonts.
                </p>
              )}
              <div
                className="space-y-1"
                role="listbox"
                aria-labelledby={buttonId}
              >
                {filteredOptions.map((option, index) => {
                  const isActive = index === activeIndex;
                  const isSelected = option.id === selectedOption?.id;
                  return (
                    <div key={option.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(option)}
                        className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? "bg-gray-900 text-white"
                            : isSelected
                              ? "border border-gray-300 bg-gray-100"
                              : "hover:bg-gray-100"
                        }`}
                        style={{ fontFamily: toFontStack(option.fontFamily) }}
                      >
                        <span>{option.name}</span>
                        <span className="text-xs text-gray-500">
                          {option.fontFamily}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
