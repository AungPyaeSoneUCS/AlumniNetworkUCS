// file: components/admin/report-auto-filters.tsx

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import ModernSelect from "@/components/modern-select";

type Lang = "en" | "mm";

function useAutoSubmit() {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function navigate(query: string) {
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return { navigate };
}

function ResetButton({
  label,
  onReset,
}: {
  label: string;
  onReset: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex h-[46px] shrink-0 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm"
    >
      {label}
    </button>
  );
}

export function GraduatedYearsFilters({
  lang,
  degree,
  degreeOptions,
  startYear,
  endYear,
  yearOptions,
  labels,
}: {
  lang: Lang;
  degree: string;
  degreeOptions: string[];
  startYear: string;
  endYear: string;
  yearOptions: string[];
  labels: { allDegree: string; startYear: string; endYear: string; reset: string };
}) {
  const { navigate } = useAutoSubmit();
  const [localDegree, setLocalDegree] = useState(degree);
  const [localStartYear, setLocalStartYear] = useState(startYear);
  const [localEndYear, setLocalEndYear] = useState(endYear);

  useEffect(() => setLocalDegree(degree), [degree]);
  useEffect(() => setLocalStartYear(startYear), [startYear]);
  useEffect(() => setLocalEndYear(endYear), [endYear]);

  function buildQuery(next?: { degree?: string; gradStartYear?: string; gradEndYear?: string }) {
    const params = new URLSearchParams();
    const deg = next?.degree ?? localDegree;
    const start = next?.gradStartYear ?? localStartYear;
    const end = next?.gradEndYear ?? localEndYear;
    if (deg) params.set("degree", deg);
    if (start) params.set("gradStartYear", start);
    if (end) params.set("gradEndYear", end);
    if (lang === "mm") params.set("lang", "mm");
    return params.toString();
  }

  function applyDegree(value: string) {
    setLocalDegree(value);
    navigate(buildQuery({ degree: value }));
  }

  function applyStartYear(value: string) {
    setLocalStartYear(value);
    navigate(buildQuery({ gradStartYear: value }));
  }

  function applyEndYear(value: string) {
    setLocalEndYear(value);
    navigate(buildQuery({ gradEndYear: value }));
  }

  function reset() {
    setLocalDegree("");
    setLocalStartYear("");
    setLocalEndYear("");
    navigate(lang === "mm" ? "lang=mm" : "");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-64 shrink-0 sm:w-72">
        <ModernSelect
          value={localDegree}
          onChange={applyDegree}
          options={degreeOptions}
          placeholder={labels.allDegree}
        />
      </div>

      <div className="w-44 shrink-0 sm:w-52">
        <ModernSelect
          value={localStartYear}
          onChange={applyStartYear}
          options={yearOptions}
          placeholder={labels.startYear}
        />
      </div>

      <div className="w-44 shrink-0 sm:w-52">
        <ModernSelect
          value={localEndYear}
          onChange={applyEndYear}
          options={yearOptions}
          placeholder={labels.endYear}
        />
      </div>

      <ResetButton label={labels.reset} onReset={reset} />
    </div>
  );
}

export function JobStatusFilters({
  lang,
  startYear,
  endYear,
  yearOptions,
  labels,
}: {
  lang: Lang;
  startYear: string;
  endYear: string;
  yearOptions: string[];
  labels: { startYear: string; endYear: string; reset: string };
}) {
  const { navigate } = useAutoSubmit();
  const [localStartYear, setLocalStartYear] = useState(startYear);
  const [localEndYear, setLocalEndYear] = useState(endYear);

  useEffect(() => setLocalStartYear(startYear), [startYear]);
  useEffect(() => setLocalEndYear(endYear), [endYear]);

  function buildQuery(next?: { jobStartYear?: string; jobEndYear?: string }) {
    const params = new URLSearchParams();
    const start = next?.jobStartYear ?? localStartYear;
    const end = next?.jobEndYear ?? localEndYear;
    if (start) params.set("jobStartYear", start);
    if (end) params.set("jobEndYear", end);
    if (lang === "mm") params.set("lang", "mm");
    return params.toString();
  }

  function applyStartYear(value: string) {
    setLocalStartYear(value);
    navigate(buildQuery({ jobStartYear: value }));
  }

  function applyEndYear(value: string) {
    setLocalEndYear(value);
    navigate(buildQuery({ jobEndYear: value }));
  }

  function reset() {
    setLocalStartYear("");
    setLocalEndYear("");
    navigate(lang === "mm" ? "lang=mm" : "");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-44 shrink-0 sm:w-52">
        <ModernSelect
          value={localStartYear}
          onChange={applyStartYear}
          options={yearOptions}
          placeholder={labels.startYear}
        />
      </div>

      <div className="w-44 shrink-0 sm:w-52">
        <ModernSelect
          value={localEndYear}
          onChange={applyEndYear}
          options={yearOptions}
          placeholder={labels.endYear}
        />
      </div>

      <ResetButton label={labels.reset} onReset={reset} />
    </div>
  );
}

function SalaryAutocompleteField({
  value,
  placeholder,
  onPick,
}: {
  value: string;
  placeholder: string;
  onPick: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickAway(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickAway);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, []);

  function loadSuggestions(query: string) {
    fetch(`/api/suggestions?field=salary&q=${encodeURIComponent(query.trim())}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) =>
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []),
      )
      .catch(() => setSuggestions([]));
  }

  function handleChange(next: string) {
    onPick(next);
    setOpen(true);

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => loadSuggestions(next), 200);
  }

  function pick(suggestion: string) {
    onPick(suggestion);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onFocus={() => {
          setOpen(true);
          loadSuggestions(value);
        }}
        onChange={(event) =>
          handleChange(event.target.value.replace(/[^\d]/g, ""))
        }
        className="h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-600 sm:text-sm"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-[9999] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(suggestion)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:bg-[#94EFEE]/40 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="truncate">{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SalaryRangesFilters({
  lang,
  experience,
  experienceOptions,
  minIncome,
  maxIncome,
  labels,
}: {
  lang: Lang;
  experience: string;
  experienceOptions: string[];
  minIncome: string;
  maxIncome: string;
  labels: {
    anyExperience: string;
    minIncome: string;
    maxIncome: string;
    incomePlaceholder: string;
    reset: string;
  };
}) {
  const { navigate } = useAutoSubmit();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localExperience, setLocalExperience] = useState(experience);
  const [localMin, setLocalMin] = useState(minIncome);
  const [localMax, setLocalMax] = useState(maxIncome);

  useEffect(() => setLocalExperience(experience), [experience]);
  useEffect(() => setLocalMin(minIncome), [minIncome]);
  useEffect(() => setLocalMax(maxIncome), [maxIncome]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function buildQuery(next?: {
    experience?: string;
    minIncome?: string;
    maxIncome?: string;
  }) {
    const params = new URLSearchParams();
    const exp = next?.experience ?? localExperience;
    const min = next?.minIncome ?? localMin;
    const max = next?.maxIncome ?? localMax;
    if (exp) params.set("experience", exp);
    if (min.trim()) params.set("minIncome", min.trim());
    if (max.trim()) params.set("maxIncome", max.trim());
    if (lang === "mm") params.set("lang", "mm");
    return params.toString();
  }

  function applyExperience(value: string) {
    setLocalExperience(value);
    navigate(buildQuery({ experience: value }));
  }

  function updateIncome(
    field: "minIncome" | "maxIncome",
    value: string,
  ) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const sanitized = value.replace(/[^\d]/g, "");
    if (field === "minIncome") setLocalMin(sanitized);
    else setLocalMax(sanitized);

    timerRef.current = setTimeout(() => {
      navigate(
        field === "minIncome"
          ? buildQuery({ minIncome: sanitized })
          : buildQuery({ maxIncome: sanitized }),
      );
    }, 350);
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocalExperience("");
    setLocalMin("");
    setLocalMax("");
    navigate(lang === "mm" ? "lang=mm" : "");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-64 shrink-0 sm:w-72">
        <ModernSelect
          value={localExperience}
          onChange={applyExperience}
          options={experienceOptions}
          placeholder={labels.anyExperience}
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <SalaryAutocompleteField
          value={localMin}
          placeholder={labels.minIncome}
          onPick={(value) => updateIncome("minIncome", value)}
        />
      </div>

      <div className="w-40 shrink-0 sm:w-44">
        <SalaryAutocompleteField
          value={localMax}
          placeholder={labels.maxIncome}
          onPick={(value) => updateIncome("maxIncome", value)}
        />
      </div>

      <ResetButton label={labels.reset} onReset={reset} />
    </div>
  );
}