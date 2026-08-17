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
  Search,
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
    searchPlaceholder: "Search company, position, type, location...",
    allTypes: "All Types",
    allLocations: "All Locations",
    allSalaries: "All Salaries",
    clear: "Clear",
    loading: "Loading jobs...",
    noJobs: "No jobs found",
    noJobsText: "Try another search or filter.",
    unknownAlumni: "Unknown Alumni",
    positionNotProvided: "Position not provided",
    postedBy: "Posted by",
    company: "Company",
    location: "Location",
    type: "Type",
    salary: "Salary",
    notProvided: "Not provided",
    view: "View",
    alumniProfile: "Alumni Profile",
  },

  mm: {
    searchPlaceholder: "ကုမ္ပဏီ၊ ရာထူး၊ အမျိုးအစား၊ တည်နေရာဖြင့် ရှာမည်...",
    allTypes: "အမျိုးအစား အားလုံး",
    allLocations: "တည်နေရာ အားလုံး",
    allSalaries: "လစာ အားလုံး",
    clear: "ရှင်းမည်",
    loading: "အလုပ်အကိုင်များ ဖွင့်နေသည်...",
    noJobs: "အလုပ်အကိုင် မတွေ့ပါ",
    noJobsText: "အခြားရှာဖွေမှု သို့မဟုတ် Filter ဖြင့် ထပ်စမ်းပါ။",
    unknownAlumni: "အမည်မသိ ကျောင်းသားဟောင်း",
    positionNotProvided: "ရာထူး မထည့်ရသေးပါ",
    postedBy: "တင်ထားသူ",
    company: "ကုမ္ပဏီ",
    location: "တည်နေရာ",
    type: "အမျိုးအစား",
    salary: "လစာ",
    notProvided: "မထည့်ရသေးပါ",
    view: "ကြည့်မည်",
    alumniProfile: "ကျောင်းသားဟောင်း ပရိုဖိုင်",
  },
};

export default function JobsPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");

  useEffect(() => {
    function handleSearchToggle() {
      setShowFilters((value) => !value);
    }

    window.addEventListener("alumni-search-toggle", handleSearchToggle);

    return () => {
      window.removeEventListener("alumni-search-toggle", handleSearchToggle);
    };
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
                    experience.description
                )
                .map((experience) => ({
                  ...experience,
                  userId: user._id,
                  userName: user.name || t.unknownAlumni,
                  userEmail: user.email,
                }))
            : []
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

  const employmentTypes = useMemo(() => {
    return getUniqueValues(jobs.map((job) => job.employmentType));
  }, [jobs]);

  const locations = useMemo(() => {
    return getUniqueValues(jobs.map((job) => job.location));
  }, [jobs]);

  const salaries = useMemo(() => {
    return getUniqueValues(jobs.map((job) => job.salary));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = search.toLowerCase().trim();

      const searchableText = [
        job.company,
        job.position,
        job.employmentType,
        job.location,
        job.salary,
        job.description,
        job.userName,
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = q ? searchableText.includes(q) : true;
      const matchType = employmentType
        ? job.employmentType === employmentType
        : true;
      const matchLocation = location ? job.location === location : true;
      const matchSalary = salary ? job.salary === salary : true;

      return matchSearch && matchType && matchLocation && matchSalary;
    });
  }, [jobs, search, employmentType, location, salary]);

  function clearFilters() {
    setSearch("");
    setEmploymentType("");
    setLocation("");
    setSalary("");
  }

  return (
    <section className="mm relative min-h-screen overflow-hidden bg-[#F1FFFF] px-3 py-5 text-slate-950 sm:px-4 sm:py-8">
      <GradientBackground />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes filterDrop {
          from { opacity: 0; transform: translateY(-14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .job-animate {
          animation: fadeUp 0.42s ease-out both;
        }

        .filter-animate {
          animation: filterDrop 0.28s ease-out both;
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {showFilters && (
          <div className="filter-animate mb-6 rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl sm:mb-8 sm:rounded-[2rem] sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#008B8B]" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 pl-12 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 sm:text-base"
                />
              </div>

              <select
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value)}
                className="w-full rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 sm:text-base"
              >
                <option value="">{t.allTypes}</option>

                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 sm:text-base"
              >
                <option value="">{t.allLocations}</option>

                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={salary}
                onChange={(event) => setSalary(event.target.value)}
                className="w-full rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 sm:text-base"
              >
                <option value="">{t.allSalaries}</option>

                {salaries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-2xl border border-[#25C9C8]/30 bg-white px-5 py-3 text-sm font-black text-[#008B8B] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FFFF] hover:shadow-lg sm:text-base lg:w-auto"
              >
                {t.clear}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-8 text-center shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-10">
            <p className="text-lg font-black text-[#008B8B] sm:text-xl">
              {t.loading}
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-8 text-center shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-10">
            <Filter className="mx-auto text-[#008B8B]" size={36} />

            <h2 className="mt-4 text-xl font-black text-slate-950 sm:text-2xl">
              {t.noJobs}
            </h2>

            <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
              {t.noJobsText}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </div>
    </section>
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
      className="job-animate group overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/90 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:rounded-[2rem]"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="h-16 bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#42D3E2]" />

      <div className="px-4 pb-5">
        <div className="-mt-10 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-2xl">
            <Briefcase size={30} />
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="line-clamp-1 break-words text-xl font-black text-slate-950">
            {job.position || t.positionNotProvided}
          </h2>

          <p className="mt-1 line-clamp-1 break-words text-xs font-bold text-slate-500">
            {t.postedBy} {job.userName}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <JobInfo
            icon={<Building size={17} />}
            label={t.company}
            value={job.company || t.notProvided}
          />

          <JobInfo
            icon={<MapPin size={17} />}
            label={t.location}
            value={job.location || t.notProvided}
          />

          <JobInfo
            icon={<Briefcase size={17} />}
            label={t.type}
            value={job.employmentType || t.notProvided}
          />

          <JobInfo
            icon={<DollarSign size={17} />}
            label={t.salary}
            value={job.salary || t.notProvided}
          />
        </div>

        {job.description && (
          <p className="mt-4 line-clamp-2 rounded-2xl border border-[#25C9C8]/20 bg-[#F8FFFF] p-3 text-sm font-bold leading-6 text-slate-600">
            {job.description}
          </p>
        )}

        <Link
          href={`/profile/${job.userId}`}
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          {t.view}
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}

function getUniqueValues(values: Array<string | undefined>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    ),
  ].sort((a, b) => a.localeCompare(b));
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
    <div className="flex items-start gap-3 rounded-2xl border border-[#25C9C8]/20 bg-[#F8FFFF] p-3 shadow-sm">
      <span className="mt-0.5 shrink-0 text-[#008B8B]">{icon}</span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>

        <p className="mt-1 line-clamp-1 break-words text-sm font-black text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

function GradientBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[#94EFEE]" />
      <div className="absolute left-0 top-0 -z-10 h-64 w-64 rounded-full bg-white/45 blur-3xl sm:h-80 sm:w-80" />
      <div className="absolute bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-[#25C9C8]/40 blur-3xl sm:h-96 sm:w-96" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-white/25 blur-3xl sm:h-[500px] sm:w-[500px]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-3 bg-[#25C9C8] sm:h-4" />
    </>
  );
}