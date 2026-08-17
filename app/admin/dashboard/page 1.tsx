// file: app/admin/dashboard/page.tsx

import type React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Newspaper,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import ApprovedStudent from "@/models/ApprovedStudent";
import AdminSidebar from "@/components/admin/admin-sidebar";

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

const text = {
  en: {
    users: "Users",
    posts: "Posts",
    jobs: "Jobs",
    registerData: "Register Data",
    totalRecords: "Total Records",
    totalUsers: "Total Users",
    totalPosts: "Total Posts",
    totalJobs: "Total Jobs",
    approvedStudents: "Approved Students",
    allData: "All Data",
    analyticsOverview: "Analytics Overview",
    analyticsSubtitle: "Users, posts, jobs and register data overview",
    dataComparison: "Data Comparison",
    currentSystemSummary: "Current system summary",
    jobOverview: "Job Overview",
    currentJobs: "Current Jobs",
    pastJobs: "Past Jobs",
    companies: "Companies",
    total: "Total",
  },
  mm: {
    users: "အသုံးပြုသူများ",
    posts: "ပို့စ်များ",
    jobs: "အလုပ်အကိုင်များ",
    registerData: "မှတ်ပုံတင်ဒေတာ",
    totalRecords: "စုစုပေါင်းဒေတာ",
    totalUsers: "အသုံးပြုသူစုစုပေါင်း",
    totalPosts: "ပို့စ်စုစုပေါင်း",
    totalJobs: "အလုပ်အကိုင်စုစုပေါင်း",
    approvedStudents: "အတည်ပြုပြီး ကျောင်းသားများ",
    allData: "ဒေတာအားလုံး",
    analyticsOverview: "စာရင်းဇယား အကျဉ်းချုပ်",
    analyticsSubtitle: "Users, posts, jobs နှင့် register data overview",
    dataComparison: "ဒေတာ နှိုင်းယှဉ်ချက်",
    currentSystemSummary: "လက်ရှိ system အကျဉ်းချုပ်",
    jobOverview: "အလုပ်အကိုင် အကျဉ်းချုပ်",
    currentJobs: "လက်ရှိအလုပ်",
    pastJobs: "ပြီးဆုံးအလုပ်",
    companies: "ကုမ္ပဏီများ",
    total: "စုစုပေါင်း",
  },
};

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidJobExperience(job: Experience) {
  return Boolean(
    cleanText(job.company) ||
      cleanText(job.position) ||
      cleanText(job.employmentType) ||
      cleanText(job.location) ||
      cleanText(job.salary) ||
      cleanText(job.email) ||
      cleanText(job.phone) ||
      cleanText(job.website)
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ lang?: Lang }>
    | {
        lang?: Lang;
      };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();

  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const [allUsers, totalPosts, totalRegisterData] = await Promise.all([
    User.find({})
      .select("_id role experiences")
      .lean(),
    Post.countDocuments(),
    ApprovedStudent.countDocuments(),
  ]);

  const normalUsers = allUsers.filter((user: any) => user.role !== "admin");
  const totalUsers = normalUsers.length;

  const allJobs = normalUsers.flatMap((user: any) =>
    Array.isArray(user.experiences)
      ? user.experiences.filter((job: Experience) => isValidJobExperience(job))
      : []
  );

  const totalJobs = allJobs.length;
  const currentJobs = allJobs.filter((job: Experience) => job.isCurrent).length;
  const pastJobs = totalJobs - currentJobs;

  const totalCompanies = new Set(
    allJobs.map((job: Experience) => cleanText(job.company)).filter(Boolean)
  ).size;

  const totalRecords =
    totalUsers + totalPosts + totalJobs + totalRegisterData;

  const maxValue = Math.max(
    totalUsers,
    totalPosts,
    totalJobs,
    totalRegisterData,
    1
  );

  const chartData = [
    {
      title: t.users,
      label: t.totalUsers,
      value: totalUsers,
      href: `/admin/manage-users?lang=${lang}`,
      icon: Users,
      color: "from-blue-500 to-cyan-400",
      bg: "bg-blue-500",
    },
    {
      title: t.posts,
      label: t.totalPosts,
      value: totalPosts,
      href: `/admin/posts?lang=${lang}`,
      icon: Newspaper,
      color: "from-pink-500 to-rose-400",
      bg: "bg-pink-500",
    },
    {
      title: t.jobs,
      label: t.totalJobs,
      value: totalJobs,
      href: `/admin/jobs?lang=${lang}`,
      icon: Briefcase,
      color: "from-emerald-500 to-green-400",
      bg: "bg-emerald-500",
    },
    {
      title: t.registerData,
      label: t.approvedStudents,
      value: totalRegisterData,
      href: `/admin/register-users?lang=${lang}`,
      icon: UserCheck,
      color: "from-violet-500 to-indigo-400",
      bg: "bg-violet-500",
    },
  ];

  const jobData = [
    {
      title: t.totalJobs,
      value: totalJobs,
      icon: Briefcase,
      bg: "bg-indigo-500",
    },
    {
      title: t.currentJobs,
      value: currentJobs,
      icon: CheckCircle2,
      bg: "bg-emerald-500",
    },
    {
      title: t.pastJobs,
      value: pastJobs,
      icon: TrendingUp,
      bg: "bg-amber-500",
    },
    {
      title: t.companies,
      value: totalCompanies,
      icon: Database,
      bg: "bg-violet-500",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="dashboard" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {chartData.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black uppercase tracking-widest text-slate-400">
                          {item.title}
                        </p>

                        <h2 className="mt-3 text-4xl font-black">
                          {item.value}
                        </h2>

                        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {item.label}
                        </p>
                      </div>

                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br ${item.color} text-white shadow-lg transition group-hover:scale-110`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </Link>
                );
              })}

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t.totalRecords}
                    </p>

                    <h2 className="mt-3 text-4xl font-black">
                      {totalRecords}
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {t.allData}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                    <Database className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">
                      {t.analyticsOverview}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {t.analyticsSubtitle}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {t.total}: {totalRecords}
                  </div>
                </div>

                <div className="relative h-[340px] overflow-hidden">
                  <div className="absolute inset-0">
                    {[100, 75, 50, 25, 0].map((number) => (
                      <div
                        key={number}
                        className="flex h-1/5 items-start gap-4 text-xs font-bold text-slate-400"
                      >
                        <span className="w-7">{number}%</span>
                        <div className="mt-2 flex-1 border-t border-dashed border-slate-200 dark:border-slate-800" />
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-12 right-2 flex h-[285px] items-end justify-around gap-3 border-b border-slate-200 dark:border-slate-800">
                    {chartData.map((item) => (
                      <div
                        key={item.title}
                        className="flex min-w-[60px] flex-1 flex-col items-center text-center"
                      >
                        <p className="mb-2 text-xs font-black">
                          {item.value}
                        </p>

                        <div
                          className={`w-full max-w-[86px] rounded-t-[24px] bg-gradient-to-t ${item.color} shadow-lg transition hover:scale-105`}
                          style={{
                            height: `${Math.max(
                              (item.value / maxValue) * 205,
                              item.value === 0 ? 4 : 44
                            )}px`,
                          }}
                        />

                        <p className="mt-3 line-clamp-1 text-xs font-black sm:text-sm">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-6">
                  <h2 className="text-2xl font-black">{t.dataComparison}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {t.currentSystemSummary}
                  </p>

                  <div className="mt-7 space-y-6">
                    {chartData.map((item) => (
                      <div key={item.title}>
                        <div className="mb-3 flex justify-between gap-4 text-sm font-black">
                          <span>{item.title}</span>
                          <span>{item.value}</span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${item.bg}`}
                            style={{
                              width: `${Math.max(
                                (item.value / maxValue) * 100,
                                item.value === 0 ? 0 : 8
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-6">
                  <h2 className="text-2xl font-black">{t.jobOverview}</h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {jobData.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.title}
                          href={`/admin/jobs?lang=${lang}`}
                          className="rounded-[24px] bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                {item.title}
                              </p>
                              <h3 className="mt-2 text-3xl font-black">
                                {item.value}
                              </h3>
                            </div>

                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg} text-white`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}