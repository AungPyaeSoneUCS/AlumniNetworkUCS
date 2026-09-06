// file: app/jobs/page.tsx

"use client";

import type React from "react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Building,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Filter,
  MapPin,
  User,
} from "lucide-react";

import { useI18n } from "@/components/providers";
import ModernSelect from "@/components/modern-select";

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
  experienceYear?: string;
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

type SavedFilters = {
  position: string;
  employmentType: string;
  location: string;
  minSalary: string;
  maxSalary: string;
};

const JOB_FILTER_STORAGE_KEY = "ucsh-jobs-filters";
const JOB_SCROLL_STORAGE_KEY = "ucsh-jobs-scroll-y";

const text = {
  en: {
    jobTitle: "Job Title",
    allJobTitles: "All Job Titles",
    jobType: "Job Type",
    allJobTypes: "All Job Types",
    location: "Location",
    allLocations: "All Locations",
    minSalary: "Min Income",
    maxSalary: "Max Income",
    clear: "Clear",
    loading: "Loading jobs...",
    noJobs: "No jobs found",
    noJobsText: "Try another filter.",
    unknownAlumni: "Unknown Alumni",
    positionNotProvided: "Position not provided",
    company: "Organization",
    type: "Type",
    salary: "Income",
    notProvided: "Not provided",
    view: "View Profile",
    year: "yr",
    alumni: "Alumni",
    experienceNotProvided: "Experience not provided",
    experienceLabel1: "Experience",
  },
  mm: {
    jobTitle: "အလုပ်ရာထူး",
    allJobTitles: "အလုပ်ရာထူး အားလုံး",
    jobType: "အလုပ်အမျိုးအစား",
    allJobTypes: "အလုပ်အမျိုးအစား အားလုံး",
    location: "တည်နေရာ",
    allLocations: "တည်နေရာ အားလုံး",
    minSalary: "အနည်းဆုံး ဝင်ငွေ",
    maxSalary: "အများဆုံး ဝင်ငွေ",
    clear: "ရှင်းမည်",
    loading: "အလုပ်အကိုင်များ ဖွင့်နေသည်...",
    noJobs: "အလုပ်အကိုင် မတွေ့ပါ",
    noJobsText: "အခြား Filter ဖြင့် ထပ်စမ်းပါ။",
    unknownAlumni: "အမည်မသိ ကျောင်းသားဟောင်း",
    positionNotProvided: "ရာထူး မထည့်ရသေးပါ",
    company: "ကုမ္ပဏီ",
    type: "အမျိုးအစား",
    salary: "ဝင်ငွေ",
    notProvided: "မထည့်ရသေးပါ",
    view: "ပရိုဖိုင် ကြည့်မည်",
    year: "နှစ်",
    alumni: "ဦး",
    experienceNotProvided: "အတွေ့အကြုံ မထည့်ရသေးပါ",
    experienceLabel1: "အတွေ့အကြုံ",
  },
};

function getInitialFilters(searchParams: URLSearchParams): SavedFilters {
  if (typeof window === "undefined") {
    return {
      position: "",
      employmentType: "",
      location: "",
      minSalary: "",
      maxSalary: "",
    };
  }

  const queryFilters: SavedFilters = {
    position: searchParams.get("position") || "",
    employmentType: searchParams.get("employmentType") || "",
    location: searchParams.get("location") || "",
    minSalary: searchParams.get("minSalary") || "",
    maxSalary: searchParams.get("maxSalary") || "",
  };

  if (Object.values(queryFilters).some(Boolean)) {
    return queryFilters;
  }

  try {
    const saved = sessionStorage.getItem(JOB_FILTER_STORAGE_KEY);
    if (!saved) return queryFilters;

    const parsed = JSON.parse(saved) as Partial<SavedFilters>;

    return {
      position: parsed.position || "",
      employmentType: parsed.employmentType || "",
      location: parsed.location || "",
      minSalary: parsed.minSalary || "",
      maxSalary: parsed.maxSalary || "",
    };
  } catch {
    return queryFilters;
  }
}

function JobsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const restoredScroll = useRef(false);

  const initialFilters = useMemo(
    () => getInitialFilters(new URLSearchParams(searchParams.toString())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [position, setPosition] = useState(initialFilters.position);
  const [employmentType, setEmploymentType] = useState(
    initialFilters.employmentType,
  );
  const [location, setLocation] = useState(initialFilters.location);
  const [minSalary, setMinSalary] = useState(initialFilters.minSalary);
  const [maxSalary, setMaxSalary] = useState(initialFilters.maxSalary);

  const saveScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(JOB_SCROLL_STORAGE_KEY, String(window.scrollY));
  }, []);

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

  useEffect(() => {
    const filters: SavedFilters = {
      position,
      employmentType,
      location,
      minSalary,
      maxSalary,
    };

    sessionStorage.setItem(JOB_FILTER_STORAGE_KEY, JSON.stringify(filters));

    const params = new URLSearchParams();

    if (position) params.set("position", position);
    if (employmentType) params.set("employmentType", employmentType);
    if (location) params.set("location", location);
    if (minSalary) params.set("minSalary", minSalary);
    if (maxSalary) params.set("maxSalary", maxSalary);

    const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [
    position,
    employmentType,
    location,
    minSalary,
    maxSalary,
    pathname,
    router,
  ]);

  useEffect(() => {
    window.addEventListener("beforeunload", saveScrollPosition);

    return () => {
      saveScrollPosition();
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, [saveScrollPosition]);

  useEffect(() => {
    if (loading || restoredScroll.current) return;

    const savedScrollY = sessionStorage.getItem(JOB_SCROLL_STORAGE_KEY);
    if (!savedScrollY) return;

    restoredScroll.current = true;

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: Number(savedScrollY) || 0,
        behavior: "auto",
      });
    });
  }, [loading, jobs.length]);

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

  const groupedJobs = useMemo(() => {
    const groups: Record<string, JobItem[]> = {};

    filteredJobs.forEach((job) => {
      const title = job.position?.trim() || t.positionNotProvided;

      if (!groups[title]) {
        groups[title] = [];
      }

      groups[title].push(job);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([title, groupJobs]): [string, JobItem[]] => [
          title,
          [...groupJobs].sort(
            (jobA, jobB) =>
              (getSalaryNumber(jobA.salary) ?? Infinity) -
              (getSalaryNumber(jobB.salary) ?? Infinity),
          ),
        ],
      );
  }, [filteredJobs, t.positionNotProvided]);

  function clearFilters() {
    setPosition("");
    setEmploymentType("");
    setLocation("");
    setMinSalary("");
    setMaxSalary("");
    setOpenGroups({});

    sessionStorage.removeItem(JOB_FILTER_STORAGE_KEY);
    sessionStorage.removeItem(JOB_SCROLL_STORAGE_KEY);

    router.replace(pathname, { scroll: false });
  }

  function toggleGroup(positionTitle: string) {
    setOpenGroups((prev) => ({
      ...prev,
      [positionTitle]: !prev[positionTitle],
    }));
  }

  return (
    <main className="mm page-wrapper ucsh-screen-page relative overflow-hidden text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="ucsh-container relative z-10 lg:flex lg:h-[calc(100vh-134px)] lg:flex-col lg:overflow-hidden">
        <div
          id="page-search"
          className="ucsh-card ucsh-animate relative z-10 mb-4 rounded-2xl p-3 sm:mb-5 sm:p-4 lg:shrink-0"
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1.2fr_1fr_1fr_auto]">
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
              <SalaryAutocompleteInput value={minSalary} onChange={setMinSalary} />
            </FilterField>

            <FilterField label={t.maxSalary}>
              <SalaryAutocompleteInput value={maxSalary} onChange={setMaxSalary} />
            </FilterField>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="ucsh-btn-outline w-full rounded-xl px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 sm:text-sm lg:w-auto"
              >
                {t.clear}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1.5">
        {loading ? (
          <EmptyState title={t.loading} />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Filter size={32} />}
            title={t.noJobs}
            description={t.noJobsText}
          />
        ) : (
          <div className="space-y-3 pb-8">
            {groupedJobs.map(([positionTitle, groupJobs]) => {
              const isOpen = Boolean(openGroups[positionTitle]);

              return (
                <section
                  key={positionTitle}
                  className="ucsh-card ucsh-animate overflow-hidden rounded-2xl p-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(positionTitle)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-white/70 dark:hover:bg-slate-900/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-[var(--ucsh-shadow-md)]">
                        <Briefcase size={18} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-black text-[var(--ucsh-text)] sm:text-lg">
                          {positionTitle}
                        </h2>

                        <p className="mt-0.5 text-xs font-bold text-[var(--ucsh-muted)]">
                          {groupJobs.length} {t.alumni}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[var(--ucsh-primary-dark)]">
                      {isOpen ? (
                        <ChevronDown size={22} />
                      ) : (
                        <ChevronRight size={22} />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[var(--ucsh-border)] p-3 sm:p-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {groupJobs.map((job, index) => (
                          <JobCard
                            key={`${job.userId}-${positionTitle}-${index}`}
                            job={job}
                            index={index}
                            t={t}
                            onViewProfile={saveScrollPosition}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
      </section>
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
          <BackgroundDecor />
          <section className="ucsh-container relative z-10">
            <EmptyState title="Loading jobs..." />
          </section>
        </main>
      }
    >
      <JobsContent />
    </Suspense>
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
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SalaryAutocompleteInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClickAway(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickAway);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      if (timerRef.current) window.clearTimeout(timerRef.current);
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
    onChange(next);
    setOpen(true);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => loadSuggestions(next), 200);
  }

  function pick(suggestion: string) {
    onChange(suggestion);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="number"
        min="0"
        value={value}
        placeholder=""
        onFocus={() => {
          setOpen(true);
          loadSuggestions(value);
        }}
        onChange={(event) => handleChange(event.target.value)}
        className="ucsh-input w-full rounded-xl px-3 py-2 text-xs font-bold sm:text-sm"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-[9999] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-[var(--ucsh-border)] bg-white p-1 shadow-xl dark:bg-slate-900">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
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
    <ModernSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  );
}

function JobCard({
  job,
  index,
  t,
  onViewProfile,
}: {
  job: JobItem;
  index: number;
  t: (typeof text)["en"];
  onViewProfile: () => void;
}) {
  const experienceLabel = job.experienceYear?.trim()
    ? `${job.experienceYear} ${t.year}`
    : t.experienceNotProvided;

  return (
    <article
      className="ucsh-card ucsh-animate group overflow-hidden rounded-2xl border border-[var(--ucsh-border)] bg-white/90 p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/70"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <div className="border-b border-[var(--ucsh-border)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-[var(--ucsh-text)] sm:text-base">
              {job.userName}
            </h3>
            {job.userEmail && (
              <p className="mt-0.5 truncate text-xs font-bold text-[var(--ucsh-muted)]">
                {job.userEmail}
              </p>
            )}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[var(--ucsh-primary)] dark:bg-slate-900">
            <User size={16} />
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="space-y-1.5">
          <JobInfo
            icon={<Building size={14} />}
            label={t.company}
            value={job.company || t.notProvided}
          />

          <JobInfo
            icon={<MapPin size={14} />}
            label={t.location}
            value={job.location || t.notProvided}
          />

          <JobInfo
            icon={<Briefcase size={14} />}
            label={t.jobType}
            value={job.employmentType || t.notProvided}
          />

          <JobInfo
            icon={<Briefcase size={14} />}
            label={t.experienceLabel1}
            value={experienceLabel}
          />

          <JobInfo
            icon={<DollarSign size={14} />}
            label={t.salary}
            value={job.salary || t.notProvided}
          />
        </div>

        {job.description && (
          <p className="mt-2 line-clamp-2 rounded-xl border border-[var(--ucsh-border)] bg-white/60 p-2 text-xs font-bold leading-5 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">
            {job.description}
          </p>
        )}

        <Link
          href={`/profile/${job.userId}`}
          onClick={onViewProfile}
          className="ucsh-btn mt-3 w-full rounded-xl px-3 py-2 text-xs"
        >
          {t.view}
          <ArrowRight size={15} />
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
    <div className="flex items-start gap-2 rounded-xl border border-[var(--ucsh-border)] bg-white/60 p-2 shadow-sm transition duration-300 group-hover:bg-white dark:bg-slate-950/60 dark:group-hover:bg-slate-900">
      <span className="mt-0.5 shrink-0 text-[var(--ucsh-primary-dark)]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
          {label}
        </p>

        <p className="mt-0.5 line-clamp-1 break-words text-xs font-black text-slate-700 dark:text-slate-200">
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
    <div className="ucsh-card ucsh-animate rounded-2xl p-6 text-center sm:p-8">
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-[var(--ucsh-shadow-md)]">
          {icon}
        </div>
      )}

      <h2 className="mt-3 text-lg font-black text-[var(--ucsh-text)] sm:text-xl">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-xs font-bold text-[var(--ucsh-muted)] sm:text-sm">
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
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-[420px] w-[420px] rounded-full bg-white/25 blur-3xl" />
    </>
  );
}