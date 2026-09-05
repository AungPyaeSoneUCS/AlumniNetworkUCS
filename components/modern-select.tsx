// file: components/modern-select.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type ModernSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  displayOptions?: Record<string, string>;
};

export default function ModernSelect({
  value,
  onChange,
  options,
  placeholder,
  displayOptions,
}: ModernSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const selectedLabel = value
    ? (displayOptions?.[value] ?? value)
    : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-3 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:text-sm ${
          value
            ? "border-[#25C9C8]/50 bg-white text-[#008B8B]"
            : "border-[var(--ucsh-border)] bg-[var(--ucsh-card)] text-[var(--ucsh-muted)]"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#008B8B]" : "text-[var(--ucsh-muted)]"
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-[var(--ucsh-border)] bg-white p-1 shadow-xl backdrop-blur animate-in fade-in zoom-in-95 duration-100 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
              !value
                ? "bg-[#94EFEE]/60 text-[#008B8B]"
                : "text-slate-600 hover:bg-[#94EFEE]/40 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span className="truncate">{placeholder}</span>
            {!value && <Check size={15} className="shrink-0 text-[#008B8B]" />}
          </button>

          {options.map((option) => {
            const isSelected = value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
                  isSelected
                    ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-sm"
                    : "text-slate-700 hover:bg-[#94EFEE]/40 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span className="truncate">{displayOptions?.[option] ?? option}</span>
                {isSelected && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}