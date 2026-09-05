// file: components/admin/dashboard-filters.tsx

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

type DashboardState = {
  lang: Lang;
  degree: string;
  experience: string;
  startYear: string;
  endYear: string;
};

function buildQuery({
  lang,
  degree,
  experience,
  startYear,
  endYear,
}: DashboardState) {
  const params = new URLSearchParams();
  if (degree) params.set("degree", degree);
  if (experience) params.set("experience", experience);
  if (startYear) params.set("jobStartYear", startYear);
  if (endYear) params.set("jobEndYear", endYear);
  if (lang === "mm") params.set("lang", "mm");
  return params.toString();
}

function resetQuery(lang: Lang) {
  return lang === "mm" ? "lang=mm" : "";
}

export function DegreeGraphFilters({
  lang,
  degree,
  experience,
  startYear,
  endYear,
  degreeOptions,
  labels,
}: DashboardState & {
  degreeOptions: string[];
  labels: { allDegree: string; reset: string };
}) {
  const { navigate } = useAutoSubmit();
  const [localDegree, setLocalDegree] = useState(degree);

  useEffect(() => setLocalDegree(degree), [degree]);

  function applyDegree(value: string) {
    setLocalDegree(value);
    navigate(
      buildQuery({ lang, degree: value, experience, startYear, endYear }),
    );
  }

  function reset() {
    setLocalDegree("");
    navigate(resetQuery(lang));
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

export function SalaryGraphFilters({
  lang,
  degree,
  experience,
  startYear,
  endYear,
  experienceOptions,
  labels,
}: DashboardState & {
  experienceOptions: string[];
  labels: { anyExperience: string; reset: string };
}) {
  const { navigate } = useAutoSubmit();
  const [localExperience, setLocalExperience] = useState(experience);

  useEffect(() => setLocalExperience(experience), [experience]);

  function applyExperience(value: string) {
    setLocalExperience(value);
    navigate(
      buildQuery({ lang, degree, experience: value, startYear, endYear }),
    );
  }

  function reset() {
    setLocalExperience("");
    navigate(resetQuery(lang));
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

export function EmploymentGraphFilters({
  lang,
  degree,
  experience,
  startYear,
  endYear,
  yearOptions,
  labels,
}: DashboardState & {
  yearOptions: string[];
  labels: { startYear: string; endYear: string; reset: string };
}) {
  const { navigate } = useAutoSubmit();
  const [localStartYear, setLocalStartYear] = useState(startYear);
  const [localEndYear, setLocalEndYear] = useState(endYear);

  useEffect(() => setLocalStartYear(startYear), [startYear]);
  useEffect(() => setLocalEndYear(endYear), [endYear]);

  function applyStartYear(value: string) {
    setLocalStartYear(value);
    navigate(
      buildQuery({ lang, degree, experience, startYear: value, endYear }),
    );
  }

  function applyEndYear(value: string) {
    setLocalEndYear(value);
    navigate(
      buildQuery({ lang, degree, experience, startYear, endYear: value }),
    );
  }

  function reset() {
    setLocalStartYear("");
    setLocalEndYear("");
    navigate(resetQuery(lang));
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