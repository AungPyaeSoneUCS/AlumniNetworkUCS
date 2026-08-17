// file: app/page.tsx

"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";

const text = {
  en: {
    badge: "Alumni Network",
    line1: "University of Computer Studies (Hinthada)",
    line2: "Alumni Network",

    subtitle: "• Connecting Alumni ",
    subtitle2: "• Sharing Knowledge ",
    subtitle3: "• Inspiring Innovation",

    slogan: "Together Building Myanmar's Digital Future",
    join: "New Alumni Register",
    feeds: "Open Feeds",
    login: "Alumni Login",
    staff: "Staff Portal",
    admin: "Admin Portal",
    directory: "View Directory",
    about: "About Alumni Network",
  },
  mm: {
    badge: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    line1: "ကွန်ပျူတာတက္ကသိုလ် (ဟင်္သာတ)",
    line2: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    
    subtitle: "• ကျောင်းသားဟောင်းများချိတ်ဆက်ခြင်း ",
    subtitle2: "• အသိပညာမျှဝေခြင်း ",
    subtitle3: "• နည်းပညာတိုးတက်မှုအားပေးခြင်း",

    slogan: "မြန်မာ့ဒစ်ဂျစ်တယ်အနာဂတ်ကို အတူတကွတည်ဆောက်ကြမယ်",
    join: "အကောင့် ဖွင့်မယ်",
    feeds: "Feeds ကြည့်မယ်",
    login: "အကောင့် ဝင်မယ်",
    staff: "Staff Portal",
    admin: "Admin Portal",
    directory: "Directory ကြည့်မယ်",
    about: "ကျောင်းသားဟောင်းများကွန်ရက်အကြောင်း",
  },
};

export default function HomePage() {
  const { data: session } = useSession();
  const { lang } = useI18n();

  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const content = text[currentLang];
  const isLoggedIn = !!session?.user;

  return (
    <main className="min-h-[calc(75vh-65px)]  px-2 pb-6 pt-6 sm:px-3 ">
      <section className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/20 shadow-md bg-gradient-to-br from-[#3a6968] via-white to-[#eaffff]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/imgaes/background/background-1.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/55 to-slate-950/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(241,205,114,0.25),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(0,191,196,0.22),transparent_35%)]" />

        <div className="relative z-10 flex min-h-[520px] items-center px-5 py-12 sm:min-h-[570px] sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            
            <h1 className="space-y-1 text-[25px] font-black leading-[1.08] tracking-tight sm:text-[33px] md:text-[55px] lg:text-[54px]">
              <span className="animate-hero-2 block text-[#f1cd72] hero-stroke-gold outer-stroke">
                {content.line1}
              </span>
              <span className="animate-hero-3 block text-[#FFFFFF] hero-stroke-gold outer-stroke hero-stroke-gold">
                {content.line2}
              </span>
            </h1>

            <p className="animate-hero-5 mt-5 max-w-[680px] text-[16px] font-bold leading-snug text-white sm:text-[19px] md:text-[22px] hero-stroke-subtitle">
              {content.subtitle}
            </p>
            <p className="animate-hero-5 mt-2 max-w-[680px] text-[16px] font-bold leading-snug text-white sm:text-[19px] md:text-[22px] hero-stroke-subtitle">
              {content.subtitle2}
            </p>
            <p className="animate-hero-5 mt-2 max-w-[680px] text-[16px] font-bold leading-snug text-white sm:text-[19px] md:text-[22px] hero-stroke-subtitle">
              {content.subtitle3}
            </p>

            <p className="animate-hero-6 mt-4 max-w-[700px] text-[20px] font-black leading-tight text-[#f1cd72] sm:text-[24px] md:text-[28px] hero-stroke-slogan">
              {content.slogan}
            </p>

            <div className="animate-hero-7 mt-8 flex flex-col gap-3 sm:flex-row flex-wrap">
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
                  >
                    {content.join}
                  </Link>

                  <Link
                    href="/login"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
                  >
                    {content.login}
                  </Link>

              

                  <Link
                    href="/staff"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
                  >
                    {content.staff}
                  </Link>

                  <Link
                    href="/admin"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
                  >
                    {content.admin}
                  </Link>

                   <Link
                    href="/about"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
                  >
                    {content.about}
                  </Link>

                </>
              ) : (
                <>
                  <Link
                    href="/feeds"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
                  >
                    {content.feeds}
                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/directory"
                    className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                  >
                    {content.directory}
                  </Link>
                  
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                  >
                    {content.about}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
       .hero-stroke-gold {
          text-shadow:
             2px  2px 0 #673a06,
             0px -2px 0 #061720,
             0px  2px 0 #f49325,
             2px  0px 0 #c67f0d;
        }

        .hero-stroke-white {
          -webkit-text-stroke: 0.4px rgba(174, 174, 174, 0.6);
          text-shadow:
             2px  2px 0 #f5f5f5,
             0px -2px 0 #e6f6ff,
             0px  2px 0 #00ffd9,
            -2px  0px 0 #faffb7,
             2px  0px 0 #9f9e9b;
        }

        .hero-stroke-subtitle {
          -webkit-text-stroke: 0.0px rgba(0, 0, 0, 0.5);
          text-shadow: 0 4px 20px rgba(0,0,0,.5);
        }

        .hero-stroke-slogan {
          -webkit-text-stroke: 0.0px rgba(0, 0, 0, 0.55);
          text-shadow: 0 4px 20px rgba(0,0,0,.5);
        }

        @keyframes arriveText {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(9px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .animate-hero-1,
        .animate-hero-2,
        .animate-hero-3,
        .animate-hero-4,
        .animate-hero-5,
        .animate-hero-6,
        .animate-hero-7 {
          opacity: 0;
          animation: arriveText 0.75s ease-out both;
        }

        .animate-hero-1 { animation-delay: 0.08s; }
        .animate-hero-2 { animation-delay: 0.18s; }
        .animate-hero-3 { animation-delay: 0.3s; }
        .animate-hero-4 { animation-delay: 0.42s; }
        .animate-hero-5 { animation-delay: 0.56s; }
        .animate-hero-6 { animation-delay: 0.7s; }
        .animate-hero-7 { animation-delay: 0.84s; }
      `}</style>
    </main>
  );
}