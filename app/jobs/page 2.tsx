// file: app/jobs/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building,
  DollarSign,
  Filter,
  MapPin,
  User,
} from "lucide-react";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";

type Experience = {
  company?: string;
  position?: string;
  employmentType?: string;
  location?: string;
  phone?: string;
  email?: string;
  salary?: string;
  website?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
};

type AlumniUser = {
  _id: string;
  name?: string;
  email?: string;
  experiences?: Experience[];
};

type JobItem = Experience & {
  userId: string;
  userName: string;
  userEmail?: string;
};

const text = {
  en: {
    jobTitle: "Job Title",
    allJobTitles: "All Job Titles",
    jobType: "Job Type",
    allJobTypes: "All Job Types",
    location: "Location",
    allLocations: "All Locations",
    minSalary: "Min Salary",
    maxSalary: "Max Salary",
    clear: "Clear",
    loading: "Loading jobs...",
    noJobs: "No jobs found",
    noJobsText: "Try another filter.",
    unknownAlumni: "Unknown Alumni",
    positionNotProvided: "Position not provided",
    company: "Company",
    type: "Type",
    salary: "Salary",
    notProvided: "Not provided",
    view: "View",
  },
  mm: {
    jobTitle: "အလုပ်ရာထူး",
    allJobTitles: "အလုပ်ရာထူး အားလုံး",
    jobType: "အလုပ်အမျိုးအစား",
    allJobTypes: "အလုပ်အမျိုးအစား အားလုံး",
    location: "တည်နေရာ",
    allLocations: "တည်နေရာ အားလုံး",
    minSalary: "အနည်းဆုံး လစာ",
    maxSalary: "အများဆုံး လစာ",
    clear: "ရှင်းမည်",
    loading: "အလုပ်အကိုင်များ ဖွင့်နေသည်...",
    noJobs: "အလုပ်အကိုင် မတွေ့ပါ",
    noJobsText: "အခြား Filter ဖြင့် ထပ်စမ်းပါ။",
    unknownAlumni: "အမည်မသိ ကျောင်းသားဟောင်း",
    positionNotProvided: "ရာထူး မထည့်ရသေးပါ",
    company: "ကုမ္ပဏီ",
    type: "အမျိုးအစား",
    salary: "လစာ",
    notProvided: "မထည့်ရသေးပါ",
    view: "ကြည့်မည်",
  },
};

export default function JobsPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [location, setLocation] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          setJobs([]);
          return;
        }

        const jobItems: JobItem[] = data.flatMap((user: AlumniUser) =>
          Array.isArray(user.experiences)
            ? user.experiences
                .filter(
                  (experience) =>
                    experience.company ||
                    experience.position ||
                    experience.employmentType ||
                    experience.location ||
                    experience.salary ||
                    experience.description,
                )
                .map((experience) => ({
                  ...experience,
                  userId: user._id,
                  userName: user.name || t.unknownAlumni,
                  userEmail: user.email,
                }))
            : [],
        );

        setJobs(jobItems);
      } catch (error) {
        console.error("Load jobs failed:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [t.unknownAlumni]);

  const positions = useMemo(() => {
    return getUniqueValues(jobs.map((job) => job.position));
  }, [jobs]);

  const employmentTypes = useMemo(() => {
    return getUniqueValues(jobs.map((job) => job.employmentType));
  }, [jobs]);

  const locations = useMemo(() => {
    return getUniqueValues(jobs.map((job) => job.location));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const jobSalary = getSalaryNumber(job.salary);
      const min = minSalary ? Number(minSalary) : null;
      const max = maxSalary ? Number(maxSalary) : null;

      const matchPosition = position ? job.position === position : true;
      const matchType = employmentType
        ? job.employmentType === employmentType
        : true;
      const matchLocation = location ? job.location === location : true;

      const matchMinSalary =
        min !== null && !Number.isNaN(min)
          ? jobSalary !== null && jobSalary >= min
          : true;

      const matchMaxSalary =
        max !== null && !Number.isNaN(max)
          ? jobSalary !== null && jobSalary <= max
          : true;

      return (
        matchPosition &&
        matchType &&
        matchLocation &&
        matchMinSalary &&
        matchMaxSalary
      );
    });
  }, [jobs, position, employmentType, location, minSalary, maxSalary]);

  function clearFilters() {
    setPosition("");
    setEmploymentType("");
    setLocation("");
    setMinSalary("");
    setMaxSalary("");
  }

  return (
    <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="ucsh-container relative z-10">
        <div className="ucsh-card ucsh-animate mb-5 p-4 sm:mb-7 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1.2fr_1fr_1fr_auto]">
            <FilterField label={t.jobTitle}>
              <FilterSelect
                value={position}
                onChange={setPosition}
                options={positions}
                placeholder={t.allJobTitles}
              />
            </FilterField>

            <FilterField label={t.jobType}>
              <FilterSelect
                value={employmentType}
                onChange={setEmploymentType}
                options={employmentTypes}
                placeholder={t.allJobTypes}
              />
            </FilterField>

            <FilterField label={t.location}>
              <FilterSelect
                value={location}
                onChange={setLocation}
                options={locations}
                placeholder={t.allLocations}
              />
            </FilterField>

            <FilterField label={t.minSalary}>
              <input
                type="number"
                min="0"
                value={minSalary}
                onChange={(event) => setMinSalary(event.target.value)}
                placeholder="1000"
                className="ucsh-input w-full px-4 text-sm font-bold sm:text-base"
              />
            </FilterField>

            <FilterField label={t.maxSalary}>
              <input
                type="number"
                min="0"
                value={maxSalary}
                onChange={(event) => setMaxSalary(event.target.value)}
                placeholder="50000000000"
                className="ucsh-input w-full px-4 text-sm font-bold sm:text-base"
              />
            </FilterField>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="ucsh-btn-outline w-full rounded-[var(--ucsh-radius-md)] px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 sm:text-base lg:w-auto"
              >
                {t.clear}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <EmptyState title={t.loading} />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Filter size={38} />}
            title={t.noJobs}
            description={t.noJobsText}
          />
        ) : (
          <div className="grid gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredJobs.map((job, index) => (
              <JobCard
                key={`${job.userId}-${index}`}
                job={job}
                index={index}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="ucsh-input w-full text-sm font-bold sm:text-base"
    >
      <option value="">{placeholder}</option>

      {options.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

function JobCard({
  job,
  index,
  t,
}: {
  job: JobItem;
  index: number;
  t: (typeof text)["en"];
}) {
  return (
    <article
      className="ucsh-card ucsh-animate group overflow-hidden p-0"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex items-center gap-3 border-b border-[var(--ucsh-border)] p-4">
        

        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-[var(--ucsh-text)]">
            {job.position || t.positionNotProvided}
          </h2>

          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[var(--ucsh-muted)]">
            <User size={12} />
            <span className="truncate">{job.userName}</span>
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          <JobInfo
            icon={<Building size={16} />}
            label={t.company}
            value={job.company || t.notProvided}
          />

          <JobInfo
            icon={<MapPin size={16} />}
            label={t.location}
            value={job.location || t.notProvided}
          />

          <JobInfo
            icon={<Briefcase size={16} />}
            label={t.type}
            value={job.employmentType || t.notProvided}
          />

          <JobInfo
            icon={<DollarSign size={16} />}
            label={t.salary}
            value={job.salary || t.notProvided}
          />
        </div>

        {job.description && (
          <p className="mt-3 line-clamp-2 rounded-[var(--ucsh-radius-md)] border border-[var(--ucsh-border)] bg-white/60 p-3 text-sm font-bold leading-6 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">
            {job.description}
          </p>
        )}

        <Link
          href={`/profile/${job.userId}`}
          className="ucsh-btn mt-4 w-full px-4 py-3 text-sm"
        >
          {t.view}
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}

function JobInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--ucsh-radius-md)] border border-[var(--ucsh-border)] bg-white/60 p-3 shadow-sm transition duration-300 group-hover:bg-white dark:bg-slate-950/60 dark:group-hover:bg-slate-900">
      <span className="mt-0.5 shrink-0 text-[var(--ucsh-primary-dark)]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
          {label}
        </p>

        <p className="mt-1 line-clamp-1 break-words text-sm font-black text-slate-700 dark:text-slate-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="ucsh-card ucsh-animate p-8 text-center sm:p-10">
      {icon && (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--ucsh-radius-lg)] bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-[var(--ucsh-shadow-md)]">
          {icon}
        </div>
      )}

      <h2 className="mt-4 text-xl font-black text-[var(--ucsh-text)] sm:text-2xl">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm font-bold text-[var(--ucsh-muted)] sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function getUniqueValues(values: Array<string | undefined>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function getSalaryNumber(value?: string) {
  if (!value) return null;

  const numbers = value.match(/\d+/g);

  if (!numbers) return null;

  return Number(numbers.join(""));
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--ucsh-primary)]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
    </>
  );
}