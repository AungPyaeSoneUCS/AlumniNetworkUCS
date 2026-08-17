// file: app/dashboard/page.tsx

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Briefcase,
  FolderOpen,
  GraduationCap,
  Settings,
  Sparkles,
  User as UserIcon,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

type Lang = "en" | "mm";

const text = {
  en: {
    dashboardBadge: "Alumni Dashboard",
    welcome: "Welcome",
    alumni: "Alumni",
    subtitle:
      "View alumni profiles freely, update your profile, and explore the full alumni network.",
    myProfile: "My Profile",
    exploreAlumni: "Explore Alumni",

    totalAlumni: "Total Alumni",
    totalAlumniSubtitle: "Public alumni profiles",
    graduatedYear: "Graduated Year",
    graduatedYearSubtitle: "Your graduation year",
    degree: "Degree",
    degreeSubtitle: "Your academic degree",
    profileStatus: "Profile Status",
    profileStatusSubtitle: "Public profile enabled",

    directory: "Directory",
    directoryDescription: "Browse all alumni profiles without connection limits.",
    profile: "Profile",
    profileDescription: "View your public alumni profile.",
    settings: "Settings",
    settingsDescription: "Update your profile and preferences.",
    careerProfile: "Career Profile",
    careerProfileDescription: "Add contact info and work experience.",
    openPage: "Open Page",

    recentActivity: "Recent Alumni",
    noRecentActivity: "No alumni profiles yet.",
    unknownAlumni: "An alumni",

    quickActions: "Quick Actions",
    editProfile: "Edit Profile",
    findAlumni: "Find Alumni",
    viewProfile: "View Profile",
    completeProfile: "Complete Profile",
    public: "Public",
    notProvided: "Not provided",
  },

  mm: {
    dashboardBadge: "ကျောင်းသားဟောင်း ဒက်ရှ်ဘုတ်",
    welcome: "ကြိုဆိုပါတယ်",
    alumni: "ကျောင်းသားဟောင်း",
    subtitle:
      "ကျောင်းသားဟောင်း ပရိုဖိုင်များကို လွတ်လပ်စွာ ကြည့်နိုင်ပြီး သင့်ပရိုဖိုင်ကို ပြင်ဆင်နိုင်ပါသည်။",
    myProfile: "ကျွန်ုပ်၏ ပရိုဖိုင်",
    exploreAlumni: "ကျောင်းသားဟောင်းများ ရှာဖွေမည်",

    totalAlumni: "စုစုပေါင်း ကျောင်းသားဟောင်း",
    totalAlumniSubtitle: "Public alumni profiles",
    graduatedYear: "ဘွဲ့ရနှစ်",
    graduatedYearSubtitle: "သင့် ဘွဲ့ရနှစ်",
    degree: "Degree",
    degreeSubtitle: "သင့် Degree",
    profileStatus: "ပရိုဖိုင် အခြေအနေ",
    profileStatusSubtitle: "Public profile ဖွင့်ထားသည်",

    directory: "အဖွဲ့ဝင်စာရင်း",
    directoryDescription:
      "Connection ကန့်သတ်ချက်မရှိဘဲ ကျောင်းသားဟောင်းများကို ကြည့်ရှုပါ။",
    profile: "ပရိုဖိုင်",
    profileDescription: "သင့် public alumni profile ကို ကြည့်ပါ။",
    settings: "ဆက်တင်များ",
    settingsDescription: "ပရိုဖိုင်နှင့် preference များကို ပြင်ဆင်ပါ။",
    careerProfile: "Career Profile",
    careerProfileDescription: "Contact info နှင့် work experience များ ထည့်ပါ။",
    openPage: "စာမျက်နှာ ဖွင့်မည်",

    recentActivity: "နောက်ဆုံး ကျောင်းသားဟောင်းများ",
    noRecentActivity: "ကျောင်းသားဟောင်း ပရိုဖိုင် မရှိသေးပါ။",
    unknownAlumni: "ကျောင်းသားဟောင်းတစ်ဦး",

    quickActions: "အမြန်လုပ်ဆောင်ချက်များ",
    editProfile: "ပရိုဖိုင် ပြင်မည်",
    findAlumni: "ကျောင်းသားဟောင်း ရှာမည်",
    viewProfile: "ပရိုဖိုင် ကြည့်မည်",
    completeProfile: "ပရိုဖိုင် ဖြည့်မည်",
    public: "Public",
    notProvided: "မထည့်ရသေးပါ",
  },
};

function getDegree(user: any) {
  return user?.degree || user?.department || "";
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();

  const currentUser: any = await User.findOne({
    email: session.user.email,
  }).lean();

  if (!currentUser) {
    redirect("/login");
  }

  const lang: Lang = currentUser.languagePreference === "mm" ? "mm" : "en";
  const t = text[lang];
  const userId = String(currentUser._id);
  const currentUserDegree = getDegree(currentUser);

  const currentUserImage =
    currentUser.image || session.user.image || "/avatar.png";

  const publicFilter = {
    $or: [{ isProfilePublic: true }, { isProfilePublic: { $exists: false } }],
  };

  const totalAlumni = await User.countDocuments(publicFilter);

  const recentUsers = await User.find({
    ...publicFilter,
    _id: { $ne: currentUser._id },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name image degree department graduatedYear createdAt")
    .lean();

  const cards = [
    {
      title: t.directory,
      description: t.directoryDescription,
      href: "/directory",
      icon: Users,
    },
    {
      title: t.profile,
      description: t.profileDescription,
      href: `/profile/${userId}`,
      icon: UserIcon,
    },
    {
      title: t.careerProfile,
      description: t.careerProfileDescription,
      href: "/settings",
      icon: Briefcase,
    },
    {
      title: t.settings,
      description: t.settingsDescription,
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <section className="mm relative min-h-screen overflow-hidden bg-[#94EFEE] px-3 py-6 text-slate-950 sm:px-4 sm:py-10">
      <GradientBackground />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/85 shadow-2xl backdrop-blur-xl sm:rounded-[2.5rem]">
          <div className="grid lg:min-h-[430px] lg:grid-cols-2">
            <div className="flex items-center bg-white/90 p-4 sm:p-8 lg:p-12">
              <div className="w-full">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#25C9C8]/40 bg-[#F8FFFF] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#008B8B] shadow-md sm:px-4 sm:text-xs">
                  <Sparkles size={14} />
                  {t.dashboardBadge}
                </span>

                <div className="mt-6 flex flex-col items-center gap-4 text-center sm:mt-8 sm:flex-row sm:text-left">
                  <Image
                    src={currentUserImage}
                    alt={currentUser.name || session.user.name || t.alumni}
                    width={120}
                    height={120}
                    className="h-[96px] w-[96px] rounded-3xl border-4 border-white object-cover shadow-2xl sm:h-[120px] sm:w-[120px]"
                  />

                  <div className="min-w-0 flex-1">
                    <h1 className="break-words text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                      {t.welcome},{" "}
                      {currentUser.name || session.user.name || t.alumni}
                    </h1>

                    <p className="mt-4 max-w-xl text-sm font-bold leading-7 text-slate-700 sm:text-base sm:leading-8">
                      {t.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/profile/${userId}`}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-3 text-center text-sm font-black text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:w-auto sm:text-base"
                  >
                    {t.myProfile}
                  </Link>

                  <Link
                    href="/directory"
                    className="w-full rounded-2xl border border-[#25C9C8]/50 bg-white px-5 py-3 text-center text-sm font-black text-[#008B8B] shadow-md transition hover:-translate-y-1 hover:bg-[#F8FFFF] hover:shadow-xl sm:w-auto sm:text-base"
                  >
                    {t.exploreAlumni}
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#00BFC4] via-[#25C9C8] to-[#008B8B] p-4 sm:p-8">
              <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
              <div className="absolute bottom-10 right-10 h-52 w-52 rounded-full bg-white/20 blur-3xl" />

              <div className="relative w-full max-w-md rounded-[1.5rem] border border-white/40 bg-white/95 p-4 text-black shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
                <p className="break-words text-xs font-black uppercase tracking-widest text-black sm:text-sm">
                  UCSH Alumni Network
                </p>

                <h2 className="mt-4 text-5xl font-black text-black">
                  {totalAlumni}
                </h2>

                <p className="mt-2 text-base font-bold leading-7 text-slate-800 sm:text-lg">
                  {t.totalAlumniSubtitle}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                  <HeroMiniCard label={t.totalAlumni} value={totalAlumni} />

                  <HeroMiniCard label={t.profileStatus} value={t.public} />

                  <HeroMiniCard
                    label={t.graduatedYear}
                    value={currentUser.graduatedYear || t.notProvided}
                  />

                  <HeroMiniCard
                    label={t.degree}
                    value={currentUserDegree || t.notProvided}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          <StatCard
            icon={Users}
            title={t.totalAlumni}
            value={String(totalAlumni)}
            subtitle={t.totalAlumniSubtitle}
          />

          <StatCard
            icon={GraduationCap}
            title={t.graduatedYear}
            value={String(currentUser.graduatedYear || "-")}
            subtitle={t.graduatedYearSubtitle}
          />

          <StatCard
            icon={FolderOpen}
            title={t.degree}
            value={currentUserDegree || "-"}
            subtitle={t.degreeSubtitle}
          />

          <StatCard
            icon={Sparkles}
            title={t.profileStatus}
            value={t.public}
            subtitle={t.profileStatusSubtitle}
          />
        </div>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {cards.map((card) => (
            <DashboardCard
              key={card.href}
              title={card.title}
              description={card.description}
              href={card.href}
              icon={card.icon}
              openPage={t.openPage}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#25C9C8]/25 bg-white/95 p-5 shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <Activity className="shrink-0 text-[#008B8B]" />

              <h2 className="break-words text-xl font-black text-black sm:text-2xl">
                {t.recentActivity}
              </h2>
            </div>

            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              {recentUsers.length === 0 ? (
                <p className="rounded-2xl border border-[#25C9C8]/20 bg-[#F8FFFF] p-4 text-sm font-bold text-slate-700 sm:text-base">
                  {t.noRecentActivity}
                </p>
              ) : (
                recentUsers.map((user: any) => {
                  const userDegree = getDegree(user);

                  return (
                    <Link
                      key={String(user._id)}
                      href={`/profile/${String(user._id)}`}
                      className="flex items-center gap-4 rounded-2xl border border-[#25C9C8]/20 bg-[#F8FFFF] p-4 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                    >
                      <Image
                        src={user.image || "/avatar.png"}
                        alt={user.name || t.unknownAlumni}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-black text-slate-900 sm:text-base">
                          {user.name || t.unknownAlumni}
                        </p>

                        <p className="mt-1 break-words text-xs font-bold text-slate-500 sm:text-sm">
                          {userDegree || t.notProvided}
                          {user.graduatedYear
                            ? ` • ${user.graduatedYear}`
                            : ""}
                        </p>
                      </div>

                      <ArrowRight
                        size={18}
                        className="shrink-0 text-[#008B8B]"
                      />
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#25C9C8]/25 bg-white/95 p-5 shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="shrink-0 text-[#008B8B]" />

              <h2 className="break-words text-xl font-black text-black sm:text-2xl">
                {t.quickActions}
              </h2>
            </div>

            <div className="mt-5 space-y-3 sm:mt-6">
              <QuickLink href={`/profile/${userId}`} label={t.viewProfile} />
              <QuickLink href="/settings" label={t.editProfile} />
              <QuickLink href="/directory" label={t.findAlumni} />
              <QuickLink href="/settings" label={t.completeProfile} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMiniCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[#25C9C8]/30 bg-white/95 p-3 shadow-lg backdrop-blur sm:p-4">
      <p className="truncate text-2xl font-black text-black">{value}</p>

      <p className="mt-1 break-words text-xs font-bold leading-5 text-slate-800">
        {label}
      </p>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  openPage,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  openPage: string;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-[1.5rem] border border-[#25C9C8]/25 bg-white/95 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:rounded-[2rem] sm:hover:-translate-y-2"
    >
      <div className="h-2 bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#42D3E2]" />

      <div className="p-5 sm:p-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg transition group-hover:scale-110 sm:h-14 sm:w-14">
          <Icon size={24} />
        </div>

        <h2 className="mt-5 break-words text-xl font-black text-black sm:text-2xl">
          {title}
        </h2>

        <p className="mt-3 text-sm font-bold leading-7 text-slate-700">
          {description}
        </p>

        <div className="mt-6 flex items-center font-black text-[#008B8B]">
          {openPage}

          <ArrowRight
            size={18}
            className="ml-2 transition group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="group rounded-[1.5rem] border border-[#25C9C8]/30 bg-white/95 p-5 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl sm:rounded-[2rem] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] p-3 text-white shadow-lg transition group-hover:scale-110 sm:h-14 sm:w-14">
          <Icon size={24} />
        </div>

        <span className="rounded-full bg-[#94EFEE]/70 px-3 py-1 text-xs font-black text-black">
          UCSH
        </span>
      </div>

      <p className="mt-5 break-words text-sm font-black uppercase tracking-widest text-black">
        {title}
      </p>

      <h2 className="mt-3 break-words text-4xl font-black text-black sm:text-5xl">
        {value}
      </h2>

      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
        {subtitle}
      </p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-[#25C9C8]/20 bg-[#F8FFFF] px-4 py-4 font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFC4] hover:bg-white hover:shadow-lg"
    >
      <span className="break-words">{label}</span>

      <ArrowRight
        size={18}
        className="shrink-0 text-[#008B8B] transition group-hover:translate-x-1"
      />
    </Link>
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