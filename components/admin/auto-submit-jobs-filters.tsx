// file: components/admin/auto-submit-jobs-filters.tsx

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import ModernSelect from "@/components/modern-select";

type Lang = "en" | "mm";

type Props = {
  lang: Lang;
  q: string;
  company: string;
  location: string;
  type: string;
  status: string;
  companyOptions: string[];
  locationOptions: string[];
  typeOptions: string[];
  statusLabels: { current: string; past: string };
  sortKey?: string;
  sortDir?: "asc" | "desc";
  labels: {
    searchPlaceholder: string;
    allCompanies: string;
    allLocations: string;
    allTypes: string;
    allStatus: string;
    reset: string;
  };
};

export default function AutoSubmitJobsFilters({
  lang,
  q,
  company,
  location,
  type,
  status,
  companyOptions,
  locationOptions,
  typeOptions,
  statusLabels,
  sortKey,
  sortDir,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const [localCompany, setLocalCompany] = useState(company);
  const [localLocation, setLocalLocation] = useState(location);
  const [localType, setLocalType] = useState(type);
  const [localStatus, setLocalStatus] = useState(
    status === "current"
      ? statusLabels.current
      : status === "past"
        ? statusLabels.past
        : "",
  );

  useEffect(() => setLocalCompany(company), [company]);
  useEffect(() => setLocalLocation(location), [location]);
  useEffect(() => setLocalType(type), [type]);
  useEffect(
    () =>
      setLocalStatus(
        status === "current"
          ? statusLabels.current
          : status === "past"
            ? statusLabels.past
            : "",
      ),
    [status, statusLabels],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const statusOptions = [statusLabels.current, statusLabels.past];

  function statusToValue(label: string) {
    if (label === statusLabels.current) return "current";
    if (label === statusLabels.past) return "past";
    return "";
  }

  function buildQuery(nextValues: {
    q?: string;
    company?: string;
    location?: string;
    type?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    const nextQ = nextValues.q ?? q;
    const nextCompany = nextValues.company ?? localCompany;
    const nextLocation = nextValues.location ?? localLocation;
    const nextType = nextValues.type ?? localType;
    const nextStatus = statusToValue(nextValues.status ?? localStatus);

    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextCompany) params.set("company", nextCompany);
    if (nextLocation) params.set("location", nextLocation);
    if (nextType) params.set("type", nextType);
    if (nextStatus) params.set("status", nextStatus);
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
    next: { q?: string; company?: string; location?: string; type?: string; status?: string },
    delay = 0,
  ) {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      navigate(buildQuery(next));
    }, delay);
  }

  function resetFilters() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocalCompany("");
    setLocalLocation("");
    setLocalType("");
    setLocalStatus("");
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
          value={localCompany}
          onChange={(value) => {
            setLocalCompany(value);
            updateFilter({ company: value });
          }}
          options={companyOptions}
          placeholder={labels.allCompanies}
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <ModernSelect
          value={localLocation}
          onChange={(value) => {
            setLocalLocation(value);
            updateFilter({ location: value });
          }}
          options={locationOptions}
          placeholder={labels.allLocations}
        />
      </div>

      <div className="w-36 shrink-0 sm:w-40">
        <ModernSelect
          value={localType}
          onChange={(value) => {
            setLocalType(value);
            updateFilter({ type: value });
          }}
          options={typeOptions}
          placeholder={labels.allTypes}
        />
      </div>

      <div className="w-32 shrink-0 sm:w-36">
        <ModernSelect
          value={localStatus}
          onChange={(value) => {
            setLocalStatus(value);
            updateFilter({ status: statusToValue(value) });
          }}
          options={statusOptions}
          placeholder={labels.allStatus}
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