// file: app/staff/dashboard/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Newspaper, UserCheck, Users, GraduationCap, LineChart, PieChart, ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import ApprovedStudent from "@/models/ApprovedStudent";
import StaffSidebar from "@/components/staff/staff-sidebar";

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
  isCurrent?: boolean | string;
};

const text = {
  en: {
    // Stat Cards Title
    alumni: "Alumni",
    posts: "Posts",
    jobs: "Jobs",
    registerData: "Registrations",

    // Chart Titles
    chartUsersTitle: "Graduates by Year",
    chartJobsTitle: "Employment Status",
    chartPostsTitle: "Posts by Category",
    chartRegTitle: "Registrations by Year",
    
    employed: "Employed",
    unemployed: "Unemployed",
    registered: "Registered",
    notRegistered: "Unregistered",
    general: "General",
    noData: "No sufficient data",
  },
  mm: {
    // Stat Cards Title
    alumni: "ကျောင်းသားဟောင်းများ",
    posts: "ပို့စ်များ",
    jobs: "အလုပ်အကိုင်များ",
    registerData: "မှတ်ပုံတင်သူများ",

    // Chart Titles
    chartUsersTitle: "နှစ်အလိုက် ဘွဲ့ရဦးရေ",
    chartJobsTitle: "အလုပ်အကိုင် အခြေအနေ",
    chartPostsTitle: "ကဏ္ဍအလိုက် ပို့စ်များ",
    chartRegTitle: "နှစ်အလိုက် မှတ်ပုံတင်မှု",

    employed: "အလုပ်ရှိ",
    unemployed: "အလုပ်မရှိ",
    registered: "အတည်ပြုပြီး",
    notRegistered: "မပြုရသေး",
    general: "အထွေထွေ",
    noData: "ဒေတာ မလုံလောက်ပါ",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidJobExperience(job: Experience) {
  const isCurrent = job?.isCurrent === true || String(job?.isCurrent) === "true";
  const hasDetails = Boolean(
    cleanText(job?.company) ||
      cleanText(job?.position) ||
      cleanText(job?.employmentType) ||
      cleanText(job?.location) ||
      cleanText(job?.salary) ||
      cleanText(job?.email) ||
      cleanText(job?.phone) ||
      cleanText(job?.website)
  );

  return isCurrent && hasDetails;
}

function hasJob(user: any) {
  if (!Array.isArray(user?.experiences)) return false;
  return user.experiences.some((exp: any) => isValidJobExperience(exp));
}

function getGraduatedYear(item: any) {
  return item?.graduatedYear ? String(item.graduatedYear) : "Unknown";
}

export default async function StaffDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: Lang }> | { lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();
  if (!session?.user?.email) redirect("/staff/login");

  await connectDB();

  const staffUser: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!staffUser || (staffUser.role !== "staff" && staffUser.role !== "admin")) {
    redirect("/staff/login");
  }

  const [allUsers, allPosts, allRegisteredData] = await Promise.all([
    User.find({}).select("_id role experiences graduatedYear").lean(),
    Post.find({}).select("_id category").lean(),
    ApprovedStudent.find({}).select("_id graduatedYear registered").lean(),
  ]);

  // Only include users with role === 'user' (excludes 'admin' and 'staff')
  const alumniUsers = allUsers.filter((user: any) => user.role === "user");

  // ---------------------------------------------------------
  // 1. TOP CARDS AGGREGATION (1x4 Grid)
  // ---------------------------------------------------------
  const totalAlumni = alumniUsers.length;
  const totalPosts = allPosts.length;
  const totalRegisterData = allRegisteredData.length;

  const allJobs = alumniUsers.flatMap((user: any) =>
    Array.isArray(user.experiences)
      ? user.experiences.filter((job: Experience) => isValidJobExperience(job))
      : [],
  );
  const totalJobs = allJobs.length;

  const mainCards = [
    {
      title: t.alumni,
      value: totalAlumni,
      href: `/staff/manage-users?lang=${lang}`,
      icon: Users,
      color: "from-[#00BFC4] to-[#008B8B]",
    },
    {
      title: t.posts,
      value: totalPosts,
      href: `/staff/posts?lang=${lang}`,
      icon: Newspaper,
      color: "from-pink-500 to-rose-400",
    },
    {
      title: t.jobs,
      value: totalJobs,
      href: `/staff/jobs?lang=${lang}`,
      icon: Briefcase,
      color: "from-emerald-400 to-emerald-600",
    },
    {
      title: t.registerData,
      value: totalRegisterData,
      href: `/staff/register-users?lang=${lang}`,
      icon: UserCheck,
      color: "from-violet-500 to-indigo-500",
    },
  ];

  // ---------------------------------------------------------
  // 2. CHART AGGREGATIONS (2x2 Grid)
  // ---------------------------------------------------------

  // Chart 1: Alumni by Year
  const userYearsMap = new Map<string, number>();
  alumniUsers.forEach((user) => {
    const year = getGraduatedYear(user);
    if (year !== "Unknown") userYearsMap.set(year, (userYearsMap.get(year) || 0) + 1);
  });
  const usersChartData = Array.from(userYearsMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(a.label) - Number(b.label))
    .slice(-10);

  // Chart 2: Jobs by Year (Employed vs Unemployed)
  const jobYearsMap = new Map<string, { total: number; employed: number }>();
  alumniUsers.forEach((user) => {
    const year = getGraduatedYear(user);
    if (year !== "Unknown") {
      const old = jobYearsMap.get(year) || { total: 0, employed: 0 };
      old.total += 1;
      if (hasJob(user)) old.employed += 1;
      jobYearsMap.set(year, old);
    }
  });
  const jobsChartData = Array.from(jobYearsMap.entries())
    .map(([year, data]) => ({
      label: year,
      value1: data.employed,
      value2: data.total - data.employed,
    }))
    .sort((a, b) => Number(a.label) - Number(b.label))
    .slice(-10);

  // Chart 3: Posts by Category
  const categoryMap = new Map<string, number>();
  allPosts.forEach((post: any) => {
    const cat = cleanText(post.category) || t.general;
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const postsChartData = Array.from(categoryMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Chart 4: Registrations by Year (Registered vs Not Registered)
  const regYearsMap = new Map<string, { total: number; registered: number }>();
  allRegisteredData.forEach((student: any) => {
    const year = getGraduatedYear(student);
    if (year !== "Unknown") {
      const old = regYearsMap.get(year) || { total: 0, registered: 0 };
      old.total += 1;
      if (student.registered) old.registered += 1;
      regYearsMap.set(year, old);
    }
  });
  const regChartData = Array.from(regYearsMap.entries())
    .map(([year, data]) => ({
      label: year,
      value1: data.registered,
      value2: data.total - data.registered,
    }))
    .sort((a, b) => Number(a.label) - Number(b.label))
    .slice(-10);

  return (
    <div className="min-h-screen w-full bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white lg:h-screen lg:overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <StaffSidebar active="dashboard" lang={lang} />

        <section className="flex flex-1 flex-col h-full min-w-0 p-3 sm:p-4 md:p-6 lg:overflow-hidden">
          <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:overflow-y-auto lg:pr-2 pb-6 lg:pb-0">

            {/* 1x4 Grid - Summary Count Cards */}
            <div className="grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {mainCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group relative overflow-hidden rounded-[16px] border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-95 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700 sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {item.title}
                        </p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                          {item.value.toLocaleString()}
                        </h2>
                      </div>

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm transition-transform group-hover:scale-110 group-hover:-rotate-3 sm:h-10 sm:w-10`}
                      >
                        <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 2x2 Grid - Flexible Graphs */}
            <div className="grid flex-1 min-h-0 grid-cols-1 grid-rows-1 xl:grid-cols-2 xl:grid-rows-2 gap-3 sm:gap-4">
              
              {/* TOP LEFT - Chart 1: Alumni */}
              <ChartWrapper 
                title={t.chartUsersTitle} 
                icon={GraduationCap}
                colorClass="text-[#008B8B] dark:text-[#25C9C8]"
                bgClass="bg-cyan-50 dark:bg-[#008B8B]/10"
                href={`/staff/users/graduated-years?lang=${lang}`}
              >
                {usersChartData.length > 0 ? (
                  <SimpleBarChart 
                    data={usersChartData} 
                    color="from-[#00BFC4] to-[#008B8B]" 
                  />
                ) : (
                  <EmptyChart text={t.noData} />
                )}
              </ChartWrapper>

              {/* TOP RIGHT - Chart 3: Posts */}
              <ChartWrapper 
                title={t.chartPostsTitle} 
                icon={PieChart}
                colorClass="text-[#008B8B] dark:text-[#25C9C8]"
                bgClass="bg-cyan-50 dark:bg-[#008B8B]/10"
                href={`/staff/posts?lang=${lang}`}
              >
                {postsChartData.length > 0 ? (
                  <SimpleBarChart 
                    data={postsChartData} 
                    color="from-[#00BFC4] to-[#008B8B]" 
                  />
                ) : (
                  <EmptyChart text={t.noData} />
                )}
              </ChartWrapper>

              {/* BOTTOM LEFT - Chart 2: Jobs */}
              <ChartWrapper 
                title={t.chartJobsTitle} 
                icon={Briefcase}
                colorClass="text-[#008B8B] dark:text-[#25C9C8]"
                bgClass="bg-cyan-50 dark:bg-[#008B8B]/10"
                href={`/staff/users/job-status?lang=${lang}`}
              >
                {jobsChartData.length > 0 ? (
                  <GroupedBarChart 
                    data={jobsChartData} 
                    color1="from-[#00BFC4] to-[#008B8B]" 
                    color2="from-violet-500 to-indigo-500" 
                    label1={t.employed}
                    label2={t.unemployed}
                  />
                ) : (
                  <EmptyChart text={t.noData} />
                )}
              </ChartWrapper>

              {/* BOTTOM RIGHT - Chart 4: Registrations */}
              <ChartWrapper 
                title={t.chartRegTitle} 
                icon={UserCheck}
                colorClass="text-[#008B8B] dark:text-[#25C9C8]"
                bgClass="bg-cyan-50 dark:bg-[#008B8B]/10"
                href={`/staff/register-users?lang=${lang}`}
              >
                {regChartData.length > 0 ? (
                  <GroupedBarChart 
                    data={regChartData} 
                    color1="from-[#00BFC4] to-[#008B8B]" 
                    color2="from-violet-500 to-indigo-500" 
                    label1={t.registered}
                    label2={t.notRegistered}
                  />
                ) : (
                  <EmptyChart text={t.noData} />
                )}
              </ChartWrapper>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// REUSABLE DASHBOARD CHART COMPONENTS
// ----------------------------------------------------------------------

function ChartWrapper({
  title,
  icon: Icon,
  colorClass,
  bgClass,
  href,
  children,
}: {
  title: string;
  icon: any;
  colorClass: string;
  bgClass: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[250px] xl:min-h-0 h-full overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800/60 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bgClass} ${colorClass}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h2 className="truncate text-xs font-black tracking-tight text-slate-900 dark:text-white sm:text-sm">
            {title}
          </h2>
        </div>
        
        <Link 
          href={href}
          className="group flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all hover:bg-[#00BFC4] hover:text-white active:scale-95 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-[#25C9C8] dark:hover:text-slate-900"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex-1 flex flex-col min-h-0 p-2.5 sm:p-3">
        {children}
      </div>
    </div>
  );
}

function SimpleBarChart({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const totalItems = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-x-auto rounded-xl bg-slate-50/50 p-2 dark:bg-slate-950/50">
      <div className="relative flex flex-1 h-full min-h-[140px] min-w-max items-end justify-around gap-3 sm:gap-4 pb-1 pt-6 mt-2">
        {data.map((item, index) => {
          const percentage = totalItems > 0 ? Math.round((item.value / totalItems) * 100) : 0;
          const heightPercent = Math.max((item.value / max) * 72, item.value ? 8 : 4);
          
          return (
            <div key={index} className="group flex flex-1 flex-col items-center h-full text-center">
              <div className="flex-1 w-full flex items-end justify-center min-h-0 relative">
                <div className="relative flex h-full flex-col items-center justify-end">
                  <div className="absolute -top-6 flex h-4 w-full items-center justify-center">
                    <span className="absolute text-xs sm:text-sm font-black text-slate-500 transition-all duration-300 group-hover:-translate-y-2 group-hover:opacity-0 dark:text-slate-400">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="absolute translate-y-2 text-xs sm:text-sm font-black text-slate-900 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:text-white">
                      {percentage}%
                    </span>
                  </div>
                  <div
                    className={`w-7 shrink-0 rounded-t-md bg-gradient-to-t transition-all duration-500 hover:brightness-110 dark:opacity-90 dark:hover:opacity-100 sm:w-8 ${color}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              </div>

              <p className="mt-1.5 shrink-0 line-clamp-2 w-full px-1 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupedBarChart({
  data,
  color1,
  color2,
  label1,
  label2,
}: {
  data: { label: string; value1: number; value2: number }[];
  color1: string;
  color2: string;
  label1: string;
  label2: string;
}) {
  const max = Math.max(...data.map((d) => Math.max(d.value1, d.value2)), 1);

  return (
    <div className="flex flex-col flex-1 h-full w-full overflow-x-auto rounded-xl bg-slate-50/50 p-2 dark:bg-slate-950/50">
      <div className="mb-2 flex shrink-0 gap-3 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-t ${color1}`} />
          {label1}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-t ${color2}`} />
          {label2}
        </span>
      </div>

      <div className="relative flex flex-1 h-full min-h-[140px] min-w-max items-end justify-around gap-3 sm:gap-5 pb-1 pt-6">
        {data.map((item, index) => {
          const itemTotal = item.value1 + item.value2;
          const p1 = itemTotal > 0 ? Math.round((item.value1 / itemTotal) * 100) : 0;
          const p2 = itemTotal > 0 ? Math.round((item.value2 / itemTotal) * 100) : 0;

          const h1Percent = Math.max((item.value1 / max) * 72, item.value1 ? 8 : 4);
          const h2Percent = Math.max((item.value2 / max) * 72, item.value2 ? 8 : 4);

          return (
            <div key={index} className="group flex flex-1 flex-col items-center h-full">
              <div className="flex flex-1 w-full items-end justify-center gap-0.5 min-h-0">
                <div className="relative flex h-full flex-col items-center justify-end">
                  <div className="absolute -top-6 flex h-4 w-full items-center justify-center -translate-x-1.5 sm:-translate-x-2">
                    <span className="absolute text-xs sm:text-sm font-black text-slate-500 transition-all duration-300 group-hover:-translate-y-2 group-hover:opacity-0 dark:text-slate-400">
                      {item.value1.toLocaleString()}
                    </span>
                    <span className="absolute translate-y-2 text-xs sm:text-sm font-black text-[#008B8B] dark:text-[#00BFC4] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {p1}%
                    </span>
                  </div>
                  <div
                    className={`w-3.5 shrink-0 rounded-t-[3px] bg-gradient-to-t transition-all duration-300 group-hover:brightness-110 sm:w-4 ${color1}`}
                    style={{ height: `${h1Percent}%` }}
                  />
                </div>

                <div className="relative flex h-full flex-col items-center justify-end">
                  <div className="absolute -top-6 flex h-4 w-full items-center justify-center translate-x-1.5 sm:translate-x-2">
                    <span className="absolute text-xs sm:text-sm font-black text-slate-500 transition-all duration-300 group-hover:-translate-y-2 group-hover:opacity-0 dark:text-slate-400">
                      {item.value2.toLocaleString()}
                    </span>
                    <span className="absolute translate-y-2 text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {p2}%
                    </span>
                  </div>
                  <div
                    className={`w-3.5 shrink-0 rounded-t-[3px] bg-gradient-to-t transition-all duration-300 group-hover:brightness-110 sm:w-4 ${color2}`}
                    style={{ height: `${h2Percent}%` }}
                  />
                </div>
              </div>

              <p className="mt-1.5 shrink-0 line-clamp-1 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[140px] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="text-center">
        <LineChart className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600" />
        <p className="mt-1 text-xs sm:text-sm font-bold text-slate-400">{text}</p>
      </div>
    </div>
  );
}