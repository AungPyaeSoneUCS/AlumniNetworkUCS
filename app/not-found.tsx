// file: app/not-found.tsx

"use client";

import Link from "next/link";
import { ArrowRight, Home, Search, Sparkles } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/components/providers";

export default function NotFound() {
  const { lang } = useI18n();
  const [showMore, setShowMore] = useState(false);

  const currentLang = lang === "mm" ? "mm" : "en";

  const text = {
    en: {
      badge: "Lost Page",
      code: "404",
      title: "Page Not Found",
      subtitle:
        "The page you are looking for does not exist or may have been moved.",
      hint: "Return to the Alumni Network and continue exploring.",
      home: "Back Home",
      directory: "Open Directory",
      seeMore: "See More",
      seeLess: "See Less",
      feeds: "Open Feeds",
      jobs: "View Jobs",
      contact: "Contact Us",
    },
    mm: {
      badge: "စာမျက်နှာ မတွေ့ပါ",
      code: "၄၀၄",
      title: "စာမျက်နှာ မတွေ့ပါ",
      subtitle:
        "သင်ရှာနေသော စာမျက်နှာ မရှိတော့ပါ သို့မဟုတ် ရွှေ့ထားနိုင်ပါသည်။",
      hint: "Alumni Network သို့ ပြန်သွားပြီး ဆက်လက်အသုံးပြုနိုင်ပါသည်။",
      home: "မူလစာမျက်နှာသို့",
      directory: "Directory ဖွင့်မည်",
      seeMore: "ပိုကြည့်မည်",
      seeLess: "လျှော့ပြမည်",
      feeds: "Feeds ဖွင့်မည်",
      jobs: "Jobs ကြည့်မည်",
      contact: "ဆက်သွယ်မည်",
    },
  }[currentLang];

  return (
    <main className="relative min-h-[calc(100vh-70px)] overflow-hidden px-2 pb-6 sm:px-3">
      <section className="relative mx-auto min-h-[calc(100vh-82px)] max-w-7xl overflow-hidden rounded-2xl shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/imgaes/background/background-1.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/25" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 36 }).map((_, index) => (
            <span
              key={index}
              className="fall-404 absolute -top-16 select-none text-sm font-black text-white/25 sm:text-base"
              style={{
                left: `${(index * 13) % 100}%`,
                animationDelay: `${index * 0.22}s`,
                animationDuration: `${5 + (index % 6)}s`,
              }}
            >
              404
            </span>
          ))}
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-82px)] items-center px-5 py-14 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="hero-in-1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white backdrop-blur">
              <Sparkles size={15} className="text-[#f1cd72]" />
              {text.badge}
            </div>

            <h1 className="hero-in-2 mt-5 text-[82px] font-black leading-none tracking-tight text-[#f1cd72] drop-shadow-2xl sm:text-[120px] md:text-[150px]">
              {text.code}
            </h1>

            <h2 className="hero-in-3 mt-2 text-[34px] font-black leading-tight text-white drop-shadow-2xl sm:text-[48px] md:text-[60px]">
              {text.title}
            </h2>

            <p className="hero-in-4 mt-4 max-w-xl text-base font-semibold leading-7 text-white drop-shadow-lg sm:text-xl">
              {text.subtitle}
            </p>

            <p className="hero-in-5 mt-2 max-w-xl text-sm font-bold leading-6 text-[#f1cd72] drop-shadow-lg sm:text-base">
              {text.hint}
            </p>

            <div className="hero-in-6 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200"
              >
                <Home size={18} />
                {text.home}
              </Link>

              <Link
                href="/directory"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-black text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <Search size={18} />
                {text.directory}
              </Link>

              <button
                type="button"
                onClick={() => setShowMore((value) => !value)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#f1cd72]/50 bg-[#f1cd72]/10 px-6 text-sm font-black text-[#f1cd72] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-[#f1cd72]/20"
              >
                {showMore ? text.seeLess : text.seeMore}
                <ArrowRight
                  size={17}
                  className={`transition ${showMore ? "rotate-90" : ""}`}
                />
              </button>
            </div>

            {showMore && (
              <div className="more-in mt-4 flex flex-wrap gap-3">
                <Link
                  href="/feeds"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur transition hover:bg-white/20"
                >
                  {text.feeds}
                </Link>

                <Link
                  href="/jobs"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur transition hover:bg-white/20"
                >
                  {text.jobs}
                </Link>

                <Link
                  href="/contact"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur transition hover:bg-white/20"
                >
                  {text.contact}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fall404 {
          0% {
            transform: translateY(-90px) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes heroIn {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .fall-404 {
          animation: fall404 linear infinite;
        }

        .hero-in-1,
        .hero-in-2,
        .hero-in-3,
        .hero-in-4,
        .hero-in-5,
        .hero-in-6,
        .more-in {
          opacity: 0;
          animation: heroIn 0.7s ease-out both;
        }

        .hero-in-1 {
          animation-delay: 0.08s;
        }

        .hero-in-2 {
          animation-delay: 0.18s;
        }

        .hero-in-3 {
          animation-delay: 0.3s;
        }

        .hero-in-4 {
          animation-delay: 0.44s;
        }

        .hero-in-5 {
          animation-delay: 0.56s;
        }

        .hero-in-6 {
          animation-delay: 0.7s;
        }

        .more-in {
          animation-delay: 0.05s;
        }
      `}</style>
    </main>
  );
}