// file: components/admin/auto-submit-manage-users-filters.tsx

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import ModernSelect from "@/components/modern-select";

type Lang = "en" | "mm";

type Props = {
  lang: Lang;
  q: string;
  degree: string;
  year: string;
  degreeOptions: string[];
  yearOptions: string[];
  labels: {
    searchPlaceholder: string;
    allDegree: string;
    allYear: string;
    reset?: string;
  };
};

export default function AutoSubmitManageUsersFilters({
  lang,
  q,
  degree,
  year,
  degreeOptions,
  yearOptions,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const [localDegree, setLocalDegree] = useState(degree);
  const [localYear, setLocalYear] = useState(year);

  useEffect(() => setLocalDegree(degree), [degree]);
  useEffect(() => setLocalYear(year), [year]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function buildQuery(next: { q?: string; degree?: string; year?: string }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextDegree = next.degree ?? localDegree;
    const nextYear = next.year ?? localYear;

    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextDegree) params.set("degree", nextDegree);
    if (nextYear) params.set("year", nextYear);
    if (lang === "mm") params.set("lang", "mm");

    return params.toString();
  }

  function navigate(query: string) {
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function updateFilter(
    next: { q?: string; degree?: string; year?: string },
    delay = 0
  ) {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      navigate(buildQuery(next));
    }, delay);
  }

  function resetFilters() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocalDegree("");
    setLocalYear("");
    navigate(lang === "mm" ? "lang=mm" : "");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1 basis-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          defaultValue={q}
          placeholder={labels.searchPlaceholder}
          onChange={(event) => updateFilter({ q: event.target.value }, 350)}
          className="h-[46px] w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <ModernSelect
          value={localDegree}
          onChange={(value) => {
            setLocalDegree(value);
            updateFilter({ degree: value });
          }}
          options={degreeOptions}
          placeholder={labels.allDegree}
        />
      </div>

      <div className="w-32 shrink-0 sm:w-36">
        <ModernSelect
          value={localYear}
          onChange={(value) => {
            setLocalYear(value);
            updateFilter({ year: value });
          }}
          options={yearOptions}
          placeholder={labels.allYear}
        />
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex h-[46px] shrink-0 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm"
      >
        {labels.reset ?? (lang === "mm" ? "ပြန်စရန်" : "Reset")}
      </button>
    </div>
  );
}