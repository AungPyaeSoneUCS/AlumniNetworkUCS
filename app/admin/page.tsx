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
  UserCog, // Added UserCog icon for Staff Management
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

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
    staff: "Manage Staff", // Added
    staffText: "Add, edit, or remove staff members securely.", // Added
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
    staff: "Staff အလွယ်တကူစီမံရန်", // Added
    staffText: "Staff အသေးစိတ်ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်းနှင့် ဖျက်သိမ်းခြင်းများကို အလွယ်တကူစီမံနိုင်ပါသည်။", // Added
    analytics: "Analytics",
    analyticsText: "Graduated year, salary နှင့် job status graph များကို ကြည့်ရှုနိုင်ပါသည်။",
    posts: "Posts",
    postsText: "News, events, general နှင့် job posts များကို အလွယ်တကူစီမံနိုင်ပါသည်။",
    jobs: "Jobs",
    jobsText: "Alumni job နှင့် experience data များကို ကြည့်ရှုနိုင်ပါသည်။",
    registerData: "Register Data",
    registerDataText: "Approved student data များကို import/control လုပ်နိုင်ပါသည်။",
  },
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: Lang }> | { lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();

  if (session?.user?.email) {
    await connectDB();

    const admin: any = await User.findOne({ email: session.user.email })
      .select("_id role")
      .lean();

    if (admin?.role === "admin") {
      redirect(`/admin/dashboard?lang=${lang}`);
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

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <div className="admin-hero-in max-w-4xl">
          <div className="admin-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-black text-white shadow-xl backdrop-blur-xl">
            <Sparkles className="sparkle h-4 w-4 text-[#f1cd72]" />
            {t.badge}
          </div>

          <h1 className="admin-title mt-6 text-5xl font-black leading-tight tracking-tight drop-shadow-2xl sm:text-6xl lg:text-7xl">
            <span className="block text-[#f1cd72] hero-stroke-gold">
              {t.title1}
            </span>
            <span className="block text-white hero-stroke-gold">
              {t.title2}
            </span>
          </h1>

          <p className="admin-fade-up-delay mt-5 max-w-2xl text-base font-semibold leading-8 text-white/80 sm:text-lg">
            {t.subtitle}
          </p>

          <div className="admin-fade-up-delay-4 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/admin/login?lang=${lang}`}
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 text-sm font-black text-white shadow-2xl shadow-cyan-500/25 transition hover:-translate-y-1 hover:shadow-cyan-500/40"
            >
              <LockKeyhole className="h-5 w-5" />
              {t.login}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <section className="admin-card-in rounded-[34px] border border-white/25 bg-white/90 p-5 text-slate-950 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/25">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#008B8B]">
                Secure
              </p>
              <h2 className="text-2xl font-black">{t.features}</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Feature icon={Users} title={t.users} text={t.usersText} />
            <Feature icon={UserCog} title={t.staff} text={t.staffText} /> 
            <Feature icon={BarChart3} title={t.analytics} text={t.analyticsText} />
            <Feature icon={Newspaper} title={t.posts} text={t.postsText} />
            <Feature icon={Briefcase} title={t.jobs} text={t.jobsText} />
            <Feature
              icon={FileSpreadsheet}
              title={t.registerData}
              text={t.registerDataText}
            />
          </div>
        </section>
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

        .admin-card-in {
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

        .admin-fade-up-delay-4 {
          animation: adminFadeUp .75s ease-out .7s both;
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

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/20">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-1 text-sm font-bold text-white/70">{text}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition duration-300 hover:-translate-y-2 hover:border-[#00BFC4] hover:bg-white hover:shadow-xl">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] transition duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-[#00BFC4] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}