// file: app/download/page.tsx

"use client";

import Link from "next/link";
import { Download, Cloud, ArrowLeft } from "lucide-react";
import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";

const text = {
  en: {
    line1: "Alumni Network App",
    line2: "Download the Official APK",
    
    subtitle: "• Stay connected on the go ",
    subtitle2: "• Get real-time updates ",
    subtitle3: "• Access the directory anywhere",

    slogan: "Take the UCSH Community with you",
    
    directDownload: "Direct Download APK",
    driveDownload: "Google Drive Mirror",
    telegramDownload: "Telegram Channel",
    githubSource: "GitHub Source",
    backHome: "Back to Home",
  },
  mm: {
    line1: "ကျောင်းသားဟောင်းများ App",
    line2: "တရားဝင် APK ကို ဒေါင်းလုဒ်ဆွဲရန်",
    
    subtitle: "• ခရီးသွားရင်း ချိတ်ဆက်ထားပါ ",
    subtitle2: "• အချိန်နှင့်တပြေးညီ အသိပေးချက်များ ရရှိပါ ",
    subtitle3: "• Directory ကို အရာရာတွင် ဝင်ရောက်ပါ",

    slogan: "UCSH အသိုက်အဝန်းကို သင့်နှင့်အတူ ယူဆောင်လာပါ",
    
    directDownload: "တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲရန်",
    driveDownload: "Google Drive မှ ဒေါင်းလုဒ်ဆွဲရန်",
    telegramDownload: "Telegram မှ ဒေါင်းလုဒ်ဆွဲရန်",
    githubSource: "GitHub Source Code",
    backHome: "ပင်မစာမျက်နှာ",
  },
};

export default function DownloadPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const content = text[currentLang];

  return (
    <main className="flex min-h-[calc(100vh-130px)] flex-col px-2 py-4 sm:px-3 sm:py-5">
      <section className="relative mx-auto flex w-full max-w-7xl flex-grow flex-col overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#3a6968] via-white to-[#eaffff] shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/background/background-1.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/55 to-slate-950/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(241,205,114,0.25),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(0,191,196,0.22),transparent_35%)]" />

        <div className="relative z-10 flex flex-grow items-center px-5 py-12 sm:px-8 lg:px-12">
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

            <div className="animate-hero-7 mt-8 flex flex-col flex-wrap gap-3 sm:flex-row">
              {/* Direct APK Download Link */}
              <a
                href="/download/release.apk"
                download
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
              >
                <Download size={18} />
                {content.directDownload}
              </a>

              {/* Telegram Link */}
              <a
                href="https://t.me/AlumniNetwork"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ED9]/90 border border-[#229ED9]/50 px-6 py-3 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-[#229ED9]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                {content.telegramDownload}
              </a>

              {/* Google Drive Link */}
              <a
                href="https://drive.google.com/drive/folders/1-xS2-rm47469TX7fO0okNLcTq4-O_LfI?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/25 px-6 py-3 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <Cloud size={18} />
                {content.driveDownload}
              </a>

              {/* GitHub Link with Custom SVG instead of lucide-react */}
              <a
                href="https://github.com/AungPyaeSoneUCS/AlumniApk"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/25 px-6 py-3 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                {content.githubSource}
              </a>

              {/* Back to Home Link */}
              <Link
                href="/"
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white/80 transition duration-300 hover:text-white"
              >
                <ArrowLeft size={16} className="transition group-hover:-translate-x-1" />
                {content.backHome}
              </Link>
            </div>
            
            <p className="animate-hero-7 mt-6 max-w-[680px] text-[13px] font-medium leading-snug text-white/60 sm:text-[14px]">
              Note: You may need to enable "Install from Unknown Sources" in your device settings to install the downloaded APK.
            </p>
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