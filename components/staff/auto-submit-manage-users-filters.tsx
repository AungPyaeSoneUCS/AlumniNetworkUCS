// file: components/admin/auto-submit-manage-users-filters.tsx

"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function updateFilter(next: { q?: string; degree?: string; year?: string }, delay = 0) {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      const nextQ = next.q ?? q;
      const nextDegree = next.degree ?? degree;
      const nextYear = next.year ?? year;

      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextDegree) params.set("degree", nextDegree);
      if (nextYear) params.set("year", nextYear);
      if (lang === "mm") params.set("lang", "mm");

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    }, delay);
  }

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_minmax(150px,1fr)_minmax(130px,0.8fr)]">
      <div className="relative md:col-span-2 xl:col-span-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          defaultValue={q}
          placeholder={labels.searchPlaceholder}
          onChange={(event) => updateFilter({ q: event.target.value }, 350)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
        />
      </div>

      <select
        defaultValue={degree}
        onChange={(event) => updateFilter({ degree: event.target.value })}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
      >
        <option value="">{labels.allDegree}</option>
        {degreeOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        defaultValue={year}
        onChange={(event) => updateFilter({ year: event.target.value })}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
      >
        <option value="">{labels.allYear}</option>
        {yearOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
