// file: components/admin/report-auto-filters.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
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
  labels,
}: {
  lang: Lang;
  degree: string;
  degreeOptions: string[];
  labels: { allDegree: string; reset: string };
}) {
  const { navigate } = useAutoSubmit();
  const [localDegree, setLocalDegree] = useState(degree);

  useEffect(() => setLocalDegree(degree), [degree]);

  function applyDegree(value: string) {
    setLocalDegree(value);
    const params = new URLSearchParams();
    if (value) params.set("degree", value);
    if (lang === "mm") params.set("lang", "mm");
    navigate(params.toString());
  }

  function reset() {
    setLocalDegree("");
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

export function SalaryRangesFilters({
  lang,
  experience,
  experienceOptions,
  labels,
}: {
  lang: Lang;
  experience: string;
  experienceOptions: string[];
  labels: { anyExperience: string; reset: string };
}) {
  const { navigate } = useAutoSubmit();
  const [localExperience, setLocalExperience] = useState(experience);

  useEffect(() => setLocalExperience(experience), [experience]);

  function applyExperience(value: string) {
    setLocalExperience(value);
    const params = new URLSearchParams();
    if (value) params.set("experience", value);
    if (lang === "mm") params.set("lang", "mm");
    navigate(params.toString());
  }

  function reset() {
    setLocalExperience("");
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

      <ResetButton label={labels.reset} onReset={reset} />
    </div>
  );
}