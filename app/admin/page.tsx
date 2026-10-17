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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/background/background-0.jpg"
        alt="University of Computer Studies, Hinthada"
        fill
        priority
        sizes="100vw"
        className="hero-bg-motion object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/58 to-cyan-950/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,201,200,0.35),transparent_32%),radial-gradient(circle_at_86%_78%,rgba(0,191,196,0.28),transparent_30%)]" />

      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#00BFC4]/25 blur-3xl float-one" />
      <div className="pointer-events-none absolute -right-24 bottom-14 h-80 w-80 rounded-full bg-[#f1cd72]/20 blur-3xl float-two" />

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <div className="admin-hero-in max-w-4xl">
          <div className="admin-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-black text-white shadow-xl backdrop-blur-xl">
            <Sparkles className="sparkle h-4 w-4 text-[#f1cd72]" />
            {t.badge}
          </div>

          <h1 className="admin-title mt-6 text-5xl font-black leading-tight tracking-tight drop-shadow-2xl sm:text-6xl lg:text-7xl">
            <span className="block text-[#f1cd72] hero-stroke-gold">
              {t.title1}
            </span>
            <span className="block text-white hero-stroke-white">
              {t.title2}
            </span>
          </h1>

          <p className="admin-fade-up-delay mt-5 max-w-2xl text-base font-semibold leading-8 text-white/80 sm:text-lg">
            {t.subtitle}
          </p>

          <p className="admin-fade-up-delay-2 mt-4 max-w-2xl text-xl font-black leading-tight text-[#77edec] sm:text-2xl">
            {t.slogan}
          </p>

          <div className="admin-fade-up-delay-3 mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/20">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00BFC4]/25 text-[#77edec] ring-1 ring-white/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-lg font-black text-white">{t.secure}</h3>
              <p className="mt-1 text-sm font-bold text-white/70">{t.secureText}</p>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/20">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1cd72]/25 text-[#f1cd72] ring-1 ring-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-lg font-black text-white">{t.responsive}</h3>
              <p className="mt-1 text-sm font-bold text-white/70">{t.responsiveText}</p>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/20">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00BFC4]/25 text-[#77edec] ring-1 ring-white/20">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-lg font-black text-white">{t.fast}</h3>
              <p className="mt-1 text-sm font-bold text-white/70">{t.fastText}</p>
            </div>
          </div>
        </div>

        <div className="animate-card-in w-full">
          <div className="rounded-[34px] border border-white/25 bg-white/90 p-5 text-slate-950 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/30">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-2xl font-black">{t.title2}</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {t.slogan}
              </p>
            </div>

            <Link
              href={`/admin/login${lang === "mm" ? "?lang=mm" : ""}`}
              className="group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:shadow-2xl active:scale-95"
            >
              {t.login}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>

            <div className="mt-6 flex flex-col items-center border-t border-slate-200 pt-5">
              <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-slate-200">
                <Image
                  src="/images/ucshlogo.jpg"
                  alt="UCSH"
                  fill
                  className="object-cover"
                  sizes="48px"
                  priority
                />
              </div>
              <p className="mt-3 text-center text-xs font-bold text-slate-400">
                University of Computer Studies, Hinthada
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-lg font-black sm:text-xl">{t.features}</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <FeatureCard icon={Users} title={t.users} desc={t.usersText} />
          <FeatureCard icon={UserCog} title={t.staff} desc={t.staffText} />
          <FeatureCard icon={BarChart3} title={t.analytics} desc={t.analyticsText} />
          <FeatureCard icon={Newspaper} title={t.posts} desc={t.postsText} />
          <FeatureCard icon={Briefcase} title={t.jobs} desc={t.jobsText} />
          <FeatureCard icon={FileSpreadsheet} title={t.registerData} desc={t.registerDataText} />
        </div>
      </section>

      <style>{`
        .hero-bg-motion {
          animation: bgZoom 12s ease-in-out infinite alternate;
        }

        .hero-stroke-gold {
          text-shadow:
            2px 2px 0 #673a06,
            0px -2px 0 #061720,
            0px 2px 0 #f49325,
            2px 0px 0 #c67f0d,
            0 18px 55px rgba(0,0,0,.45);
        }

        .hero-stroke-white {
          -webkit-text-stroke: 0.4px rgba(174, 174, 174, 0.6);
          text-shadow:
            2px 2px 0 #f5f5f5,
            0px -2px 0 #e6f6ff,
            0px 2px 0 #00ffd9,
            -2px 0px 0 #faffb7,
            2px 0px 0 #9f9e9b,
            0 18px 55px rgba(0,0,0,.45);
        }

        .sparkle {
          animation: sparklePulse 1.8s ease-in-out infinite;
        }

        .float-one {
          animation: floatOne 8s ease-in-out infinite;
        }

        .float-two {
          animation: floatTwo 9s ease-in-out infinite;
        }

        .admin-hero-in {
          animation: adminSlideIn .85s ease-out both;
        }

        .animate-card-in {
          animation: adminCardIn .9s ease-out .15s both;
        }

        .admin-title {
          animation: adminFadeUp .85s ease-out .18s both, adminTitleGlow 3.2s ease-in-out infinite;
        }

        .admin-fade-up {
          animation: adminFadeUp .75s ease-out .1s both;
        }

        .admin-fade-up-delay {
          animation: adminFadeUp .75s ease-out .28s both;
        }

        .admin-fade-up-delay-2 {
          animation: adminFadeUp .75s ease-out .42s both;
        }

        .admin-fade-up-delay-3 {
          animation: adminFadeUp .75s ease-out .56s both;
        }

        @keyframes bgZoom {
          from {
            transform: scale(1.04) translate3d(0, 0, 0);
          }
          to {
            transform: scale(1.1) translate3d(-1.2%, -1%, 0);
          }
        }

        @keyframes adminFadeUp {
          0% {
            opacity: 0;
            transform: translateY(34px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes adminSlideIn {
          0% {
            opacity: 0;
            transform: translateX(-46px) scale(.98);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes adminCardIn {
          0% {
            opacity: 0;
            transform: translateX(46px) scale(.96);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes adminTitleGlow {
          0%, 100% {
            text-shadow: 0 18px 50px rgba(0,0,0,.35);
          }
          50% {
            text-shadow: 0 18px 70px rgba(119,237,236,.45);
          }
        }

        @keyframes sparklePulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: .8;
          }
          50% {
            transform: scale(1.25) rotate(16deg);
            opacity: 1;
          }
        }

        @keyframes floatOne {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(28px, 20px) scale(1.08);
          }
        }

        @keyframes floatTwo {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-24px, -18px) scale(1.06);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
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
    <div className="group flex flex-col items-start rounded-3xl border border-white/20 bg-white/10 p-5 text-left shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/30 hover:bg-white/20 sm:p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1cd72]/25 text-[#f1cd72] ring-1 ring-white/20 sm:h-11 sm:w-11">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <h3 className="mt-3 text-base font-black sm:mt-4">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/80">{desc}</p>
    </div>
  );
}
