// file: app/admin/page.tsx

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  FileSpreadsheet,
  LockKeyhole,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users,
  UserCog,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Lang = "en" | "mm";

const text = {
  en: {
    badge: "Admin Secure Access",
    title1: "Alumni Network",
    title2: "Admin Portal",
    subtitle:
      "Manage users, staff, analytics, posts, jobs, register data and contact information from one secure dashboard.",
    slogan: "Secure Control • Fast Management • Mobile Ready",
    login: "Admin Login",
    secure: "Secure",
    secureText: "Admin only",
    responsive: "Responsive",
    responsiveText: "Mobile ready",
    fast: "Fast",
    fastText: "Clean control",
    features: "Admin Features",
    users: "Users",
    usersText: "Manage alumni accounts and profile data.",
    staff: "Manage Staff",
    staffText: "Add, edit, or remove staff members securely.",
    analytics: "Analytics",
    analyticsText: "View graduated year, salary and job status graphs.",
    posts: "Posts",
    postsText: "Manage news, events, general and job posts.",
    jobs: "Jobs",
    jobsText: "Review alumni job and experience data.",
    registerData: "Register Data",
    registerDataText: "Import and control approved student data.",
  },
  mm: {
    badge: "Admin Secure Access",
    title1: "Alumni Network",
    title2: "Admin Portal",
    subtitle:
      "Users, staff, analytics, posts, jobs, register data နှင့် contact information များကို secure dashboard တစ်ခုတည်းမှ အလွယ်တကူစီမံနိုင်ပါသည်။",
    slogan: "Secure Control • Fast Management • Mobile Ready",
    login: "Admin Login",
    secure: "လုံခြုံပြီးယုံကြည်ရ",
    secureText: "Admin only",
    responsive: "Responsive",
    responsiveText: "Mobile ready",
    fast: "Fast",
    fastText: "Clean control",
    features: "Admin Features",
    users: "Users",
    usersText: "Alumni account နှင့် profile data များကို အလွယ်တကူစီမံနိုင်ပါသည်။",
    staff: "Staff အလွယ်တကူစီမံရန်",
    staffText: "Staff အသေးစိတ်ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်းနှင့် ဖျက်သိမ်းခြင်းများကို အလွယ်တကူစီမံနိုင်ပါသည်။",
    analytics: "Analytics",
    analyticsText: "Graduated year, salary နှင့် job status graph များကို ကြည့်ရှုနိုင်ပါသည်။",
    posts: "Posts",
    postsText: "News, events, general နှင့် job posts များကို အလွယ်တကူစီမံနိုင်ပါသည်။",
    jobs: "Jobs",
    jobsText: "Alumni job နှင့် experience data များကို ကြည့်ရှုနိုင်ပါသည်။",
    registerData: "Register Data",
    registerDataText: "Import and control approved student data.",
  },
};

export default async function AdminLandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: Lang }> | { lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();
  if (session?.user?.email) {
    const admin = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { role: true },
    });
    if (admin && admin.role === "admin") {
      redirect("/admin/dashboard");
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-[-10rem] h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_70%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/90 shadow-lg backdrop-blur sm:mb-8 sm:text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          {t.badge}
        </div>

        <h1 className="text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {t.title1}
          <span className="ml-2 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent sm:ml-4">
            {t.title2}
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-base text-white/80 sm:mt-6 sm:text-lg">
          {t.subtitle}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-8 sm:gap-4">
          <Link
            href={`/admin/login${lang === "mm" ? "?lang=mm" : ""}`}
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-black shadow-lg shadow-cyan-900/40 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95 sm:px-6 sm:py-3 sm:text-base"
          >
            {t.login}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/60 sm:mt-5">{t.slogan}</p>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
          <div className="group flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-center shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 sm:px-6 sm:py-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40 sm:h-12 sm:w-12">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mt-3 text-lg font-black sm:mt-4">{t.secure}</h3>
            <p className="mt-1 text-sm text-white/80">{t.secureText}</p>
          </div>

          <div className="group flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-center shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 sm:px-6 sm:py-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40 sm:h-12 sm:w-12">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mt-3 text-lg font-black sm:mt-4">{t.responsive}</h3>
            <p className="mt-1 text-sm text-white/80">{t.responsiveText}</p>
          </div>

          <div className="group flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-center shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 sm:px-6 sm:py-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/40 sm:h-12 sm:w-12">
              <LockKeyhole className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mt-3 text-lg font-black sm:mt-4">{t.fast}</h3>
            <p className="mt-1 text-sm text-white/80">{t.fastText}</p>
          </div>
        </div>

        <div className="mt-12 w-full max-w-5xl sm:mt-16">
          <h2 className="text-center text-lg font-black sm:text-xl">{t.features}</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <FeatureCard icon={Users} title={t.users} desc={t.usersText} />
            <FeatureCard icon={UserCog} title={t.staff} desc={t.staffText} />
            <FeatureCard icon={BarChart3} title={t.analytics} desc={t.analyticsText} />
            <FeatureCard icon={Newspaper} title={t.posts} desc={t.postsText} />
            <FeatureCard icon={Briefcase} title={t.jobs} desc={t.jobsText} />
            <FeatureCard icon={FileSpreadsheet} title={t.registerData} desc={t.registerDataText} />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center sm:mt-16">
          <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/30 sm:h-14 sm:w-14">
            <Image
              src="/images/ucshlogo.jpg"
              alt="UCSH"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 48px, 56px"
              priority
            />
          </div>
          <p className="mt-3 text-xs text-white/60 sm:mt-4">
            University of Computer Studies, Hinthada
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="group flex flex-col items-start rounded-3xl border border-white/10 bg-white/5 p-5 text-left shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 sm:p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 ring-1 ring-white/20 sm:h-11 sm:w-11">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <h3 className="mt-3 text-base font-black sm:mt-4">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/80">{desc}</p>
    </div>
  );
}
