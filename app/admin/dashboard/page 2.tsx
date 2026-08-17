// file: app/admin/dashboard/page.tsx

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
  isCurrent?: boolean;
};

const text = {
  en: {
    title: "Admin Dashboard",
    subtitle: "Overview of users, posts, jobs and register data.",
    users: "Users",
    posts: "Posts",
    jobs: "Jobs",
    registerData: "Student Registration Lists",
    totalRecords: "Total Records",
    totalUsers: "Total Users",
    totalPosts: "Total Posts",
    totalJobs: "Total Jobs",
    approvedStudents: "Approved Students",
    allData: "All Data",
    analyticsOverview: "Analytics Overview",
    analyticsSubtitle: "Main data comparison for the current system.",
    dataComparison: "Data Comparison",
    jobOverview: "Job Overview",
    currentJobs: "Current Jobs",
    pastJobs: "Past Jobs",
    companies: "Companies",
    total: "Total",
    viewDetails: "View Details",
  },
  mm: {
    title: "Admin Dashboard",
    subtitle: "Users, Posts, Jobs နှင့် Register Data အကျဉ်းချုပ်။",
    users: "အသုံးပြုသူများ",
    posts: "ပို့စ်များ",
    jobs: "အလုပ်အကိုင်များ",
    registerData: "မှတ်ပုံတင်သူများ",
    totalRecords: "စုစုပေါင်းဒေတာ",
    totalUsers: "အသုံးပြုသူစုစုပေါင်း",
    totalPosts: "ပို့စ်စုစုပေါင်း",
    totalJobs: "အလုပ်အကိုင်စုစုပေါင်း",
    approvedStudents: "အတည်ပြုပြီး ကျောင်းသားများ",
    allData: "ဒေတာအားလုံး",
    analyticsOverview: "စာရင်းဇယား အကျဉ်းချုပ်",
    analyticsSubtitle: "လက်ရှိ system အတွက် အဓိက data နှိုင်းယှဉ်ချက်။",
    dataComparison: "ဒေတာ နှိုင်းယှဉ်ချက်",
    jobOverview: "အလုပ်အကိုင် အကျဉ်းချုပ်",
    currentJobs: "လက်ရှိအလုပ်",
    pastJobs: "ပြီးဆုံးအလုပ်",
    companies: "ကုမ္ပဏီများ",
    total: "စုစုပေါင်း",
    viewDetails: "အသေးစိတ်ကြည့်ရန်",
  },
};

function cleanText(value: unknown) {
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
      cleanText(job.website),
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: Lang }> | { lang?: Lang };
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
    User.find({}).select("_id role experiences").lean(),
    Post.countDocuments(),
    ApprovedStudent.countDocuments(),
  ]);

  const normalUsers = allUsers.filter((user: any) => user.role !== "admin");
  const totalUsers = normalUsers.length;

  const allJobs = normalUsers.flatMap((user: any) =>
    Array.isArray(user.experiences)
      ? user.experiences.filter((job: Experience) => isValidJobExperience(job))
      : [],
  );

  const totalJobs = allJobs.length;
  const currentJobs = allJobs.filter((job: Experience) => job.isCurrent).length;
  const pastJobs = totalJobs - currentJobs;

  const totalCompanies = new Set(
    allJobs.map((job: Experience) => cleanText(job.company)).filter(Boolean),
  ).size;

  const totalRecords = totalUsers + totalPosts + totalJobs + totalRegisterData;

  const mainCards = [
    {
      title: t.users,
      label: t.totalUsers,
      value: totalUsers,
      href: `/admin/manage-users?lang=${lang}`,
      icon: Users,
      color: "from-[#00BFC4] to-[#008B8B]",
      bar: "bg-[#00BFC4]",
    },
    {
      title: t.posts,
      label: t.totalPosts,
      value: totalPosts,
      href: `/admin/posts?lang=${lang}`,
      icon: Newspaper,
      color: "from-pink-500 to-rose-400",
      bar: "bg-pink-500",
    },
    {
      title: t.jobs,
      label: t.totalJobs,
      value: totalJobs,
      href: `/admin/jobs?lang=${lang}`,
      icon: Briefcase,
      color: "from-emerald-500 to-green-400",
      bar: "bg-emerald-500",
    },
    {
      title: t.registerData,
      label: t.approvedStudents,
      value: totalRegisterData,
      href: `/admin/register-users?lang=${lang}`,
      icon: UserCheck,
      color: "from-violet-500 to-indigo-400",
      bar: "bg-violet-500",
    },
  ];

  const jobCards = [
    {
      title: t.totalJobs,
      value: totalJobs,
      icon: Briefcase,
      color: "bg-[#00BFC4]",
    },
    {
      title: t.currentJobs,
      value: currentJobs,
      icon: CheckCircle2,
      color: "bg-emerald-500",
    },
    {
      title: t.pastJobs,
      value: pastJobs,
      icon: TrendingUp,
      color: "bg-amber-500",
    },
    {
      title: t.companies,
      value: totalCompanies,
      icon: Database,
      color: "bg-violet-500",
    },
  ];

  const maxValue = Math.max(
    totalUsers,
    totalPosts,
    totalJobs,
    totalRegisterData,
    1,
  );

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar active="dashboard" lang={lang} />

        <section className="min-w-0 flex-1 px-3 pb-5 pt-16 sm:px-4 md:px-5 lg:px-6 lg:pt-5">
          <div className="mx-auto max-w-7xl space-y-3">
            
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {mainCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black uppercase tracking-widest text-slate-400">
                          {item.title}
                        </p>

                        <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                          {item.value.toLocaleString()}
                        </h2>

                        <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
                          {item.label}
                        </p>
                      </div>

                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg transition group-hover:scale-110 sm:h-14 sm:w-14`}
                      >
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.bar}`}
                        style={{
                          width: `${Math.max((item.value / maxValue) * 100, item.value ? 8 : 0)}%`,
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </section>

            <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                    {t.analyticsOverview}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {t.analyticsSubtitle}
                  </p>
                </div>

                <div className="overflow-x-auto overflow-y-hidden p-3">
                  <div className="relative min-w-[560px] rounded-2xl bg-slate-50 p-3">
                    <div className="ml-7 flex h-[280px] items-end gap-6 border-b-4 border-l-4 border-slate-900 pb-8 pl-4 pt-12">
                      {mainCards.map((item) => (
                        <div
                          key={item.title}
                          className="flex min-w-[90px] flex-1 flex-col items-center text-center"
                        >
                          <p className="mb-2 rounded-full bg-white px-2 py-1 text-xs font-black text-slate-900 shadow-sm">
                            {item.value.toLocaleString()}
                          </p>

                          <div
                            className={`w-12 shrink-0 rounded-t-2xl shadow-xl transition hover:scale-105 ${item.bar}`}
                            style={{
                              height: `${Math.max(
                                (item.value / maxValue) * 170,
                                item.value ? 28 : 6,
                              )}px`,
                            }}
                          />

                          <p className="mt-3 line-clamp-2 max-w-[90px] text-xs font-black leading-4 text-slate-600">
                            {item.title}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {t.dataComparison}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                
                <div className="p-4">
                  <div className="rounded-2xl bg-gradient-to-br from-[#00BFC4] to-[#008B8B] p-5 text-white shadow-lg shadow-cyan-500/20">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white/80">
                          {t.totalRecords}
                        </p>
                        <h3 className="mt-3 text-4xl font-black">
                          {totalRecords.toLocaleString()}
                        </h3>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                        <Database className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {mainCards.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-black text-slate-600">
                          {item.title}
                        </span>
                        <span className="text-sm font-black text-slate-950">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                  {t.jobOverview}
                </h2>
              </div>

              <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
                {jobCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {item.title}
                          </p>
                          <h3 className="mt-3 text-3xl font-black text-slate-950">
                            {item.value.toLocaleString()}
                          </h3>
                        </div>

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${item.color}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <QuickLink
                href={`/admin/manage-users?lang=${lang}`}
                icon={Users}
                title={t.users}
                label={t.viewDetails}
              />
              <QuickLink
                href={`/admin/posts?lang=${lang}`}
                icon={Newspaper}
                title={t.posts}
                label={t.viewDetails}
              />
              <QuickLink
                href={`/admin/jobs?lang=${lang}`}
                icon={Briefcase}
                title={t.jobs}
                label={t.viewDetails}
              />
              <QuickLink
                href={`/admin/register-users?lang=${lang}`}
                icon={FileSpreadsheet}
                title={t.registerData}
                label={t.viewDetails}
              />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  label,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-[#00BFC4] hover:shadow-lg"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] transition group-hover:bg-[#00BFC4] group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-900">
            {title}
          </h3>
          <p className="mt-0.5 text-xs font-bold text-slate-400">{label}</p>
        </div>
      </div>

      <span className="text-lg font-black text-slate-300 transition group-hover:text-[#00BFC4]">
        →
      </span>
    </Link>
  );
}