// file: components/admin/auto-submit-posts-filters.tsx

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import ModernSelect from "@/components/modern-select";

type Lang = "en" | "mm";

type Author = { id: string; name: string };

type Props = {
  lang: Lang;
  q: string;
  category: string;
  author: string;
  from: string;
  to: string;
  categories: string[];
  authors: Author[];
  sortKey?: string;
  sortDir?: "asc" | "desc";
  labels: {
    searchPlaceholder: string;
    allCategories: string;
    allAuthors: string;
    from: string;
    to: string;
    reset: string;
    clearDate?: string;
  };
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PostsDateSelect({
  value,
  placeholder,
  onChange,
  lang,
  clearLabel,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  lang: Lang;
  clearLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? new Date(`${value}T00:00:00`) : new Date(),
  );
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

  useEffect(() => {
    if (value) {
      const parsed = new Date(`${value}T00:00:00`);
      if (!isNaN(parsed.getTime())) setViewMonth(parsed);
    }
  }, [value]);

  const year = viewMonth.getFullYear();
  const monthIndex = viewMonth.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startBlankCount = firstDay.getDay();

  const cells: Array<number | null> = [
    ...Array.from({ length: startBlankCount }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const monthLabel = viewMonth.toLocaleDateString(
    lang === "mm" ? "my-MM" : "en-US",
    { month: "long", year: "numeric" },
  );

  function moveMonth(step: number) {
    setViewMonth(new Date(year, monthIndex + step, 1));
  }

  const todayKey = toDateKey(new Date());
  const selectedLabel = value || placeholder;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-[46px] w-full items-center justify-between gap-2 rounded-xl border px-3 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:text-sm ${
          value
            ? "border-[#25C9C8]/50 bg-white text-[#008B8B] dark:border-[#25C9C8]/40 dark:bg-slate-900 dark:text-[#25C9C8]"
            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={16} className={`shrink-0 ${value ? "text-[#008B8B] dark:text-[#25C9C8]" : "text-slate-400"}`} />
          <span className={`truncate ${value ? "" : "text-slate-400 dark:text-slate-500"}`}>
            {selectedLabel}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#008B8B]" : "text-slate-400"
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[9999] mt-1.5 w-[290px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur animate-in fade-in zoom-in-95 duration-100 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-[#008B8B] dark:text-[#25C9C8]" />
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {monthLabel}
              </p>
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition hover:bg-cyan-50 hover:text-[#008B8B] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition hover:bg-cyan-50 hover:text-[#008B8B] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 dark:text-slate-500">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={`${day}-${index}`} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) {
                return <div key={`blank-${index}`} className="h-9" />;
              }

              const dateKey = toDateKey(new Date(year, monthIndex, day));
              const active = value === dateKey;
              const isToday = dateKey === todayKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    onChange(dateKey);
                    setOpen(false);
                  }}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-black transition ${
                    active
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md"
                      : isToday
                        ? "bg-cyan-50 text-[#008B8B] ring-1 ring-[#25C9C8]/40 dark:bg-[#008B8B]/15 dark:text-[#25C9C8]"
                        : "text-slate-600 hover:bg-cyan-50 hover:text-[#008B8B] dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-500 transition hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <X size={13} />
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AutoSubmitPostsFilters({
  lang,
  q,
  category,
  author,
  from,
  to,
  categories,
  authors,
  sortKey,
  sortDir,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const [localCategory, setLocalCategory] = useState(category);
  const [localAuthor, setLocalAuthor] = useState(
    authors.find((item) => item.id === author)?.name ?? "",
  );
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  useEffect(() => setLocalCategory(category), [category]);
  useEffect(
    () => setLocalAuthor(authors.find((item) => item.id === author)?.name ?? ""),
    [author, authors],
  );
  useEffect(() => setLocalFrom(from), [from]);
  useEffect(() => setLocalTo(to), [to]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const authorOptions = authors.map((item) => item.name);

  function authorNameToId(name: string) {
    return authors.find((item) => item.name === name)?.id ?? "";
  }

  function buildQuery(nextValues: {
    q?: string;
    category?: string;
    author?: string;
    from?: string;
    to?: string;
  }) {
    const params = new URLSearchParams();
    const nextQ = nextValues.q ?? q;
    const nextCategory = nextValues.category ?? localCategory;
    const nextAuthor = authorNameToId(nextValues.author ?? localAuthor);
    const nextFrom = nextValues.from ?? localFrom;
    const nextTo = nextValues.to ?? localTo;

    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextCategory) params.set("category", nextCategory);
    if (nextAuthor) params.set("author", nextAuthor);
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    if (lang === "mm") params.set("lang", "mm");
    if (sortKey) params.set("sort", sortKey);
    if (sortDir) params.set("dir", sortDir);

    return params.toString();
  }

  function navigate(query: string) {
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function updateFilter(
    next: { q?: string; category?: string; author?: string; from?: string; to?: string },
    delay = 0,
  ) {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      navigate(buildQuery(next));
    }, delay);
  }

  function resetFilters() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocalCategory("");
    setLocalAuthor("");
    setLocalFrom("");
    setLocalTo("");
    const params = new URLSearchParams();
    if (lang === "mm") params.set("lang", "mm");
    if (sortKey) params.set("sort", sortKey);
    if (sortDir) params.set("dir", sortDir);
    navigate(params.toString());
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1 basis-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          defaultValue={q}
          placeholder={labels.searchPlaceholder}
          onChange={(event) => updateFilter({ q: event.target.value }, 350)}
          className="h-[46px] w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <ModernSelect
          value={localCategory}
          onChange={(value) => {
            setLocalCategory(value);
            updateFilter({ category: value });
          }}
          options={categories}
          placeholder={labels.allCategories}
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <ModernSelect
          value={localAuthor}
          onChange={(value) => {
            setLocalAuthor(value);
            updateFilter({ author: value });
          }}
          options={authorOptions}
          placeholder={labels.allAuthors}
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <PostsDateSelect
          value={localFrom}
          placeholder={labels.from}
          lang={lang}
          clearLabel={labels.clearDate ?? "Clear"}
          onChange={(value) => {
            setLocalFrom(value);
            updateFilter({ from: value });
          }}
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <PostsDateSelect
          value={localTo}
          placeholder={labels.to}
          lang={lang}
          clearLabel={labels.clearDate ?? "Clear"}
          onChange={(value) => {
            setLocalTo(value);
            updateFilter({ to: value });
          }}
        />
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex h-[46px] shrink-0 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm"
      >
        {labels.reset}
      </button>
    </div>
  );
}