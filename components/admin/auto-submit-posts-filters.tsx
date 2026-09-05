// file: components/admin/auto-submit-posts-filters.tsx

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
  };
};

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

  const inputClass =
    "h-[46px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 [color-scheme:light] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:[color-scheme:dark] sm:text-sm";

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
        <input
          type="date"
          aria-label={labels.from}
          value={localFrom}
          onChange={(event) => {
            setLocalFrom(event.target.value);
            updateFilter({ from: event.target.value });
          }}
          className={inputClass}
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <input
          type="date"
          aria-label={labels.to}
          value={localTo}
          onChange={(event) => {
            setLocalTo(event.target.value);
            updateFilter({ to: event.target.value });
          }}
          className={inputClass}
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