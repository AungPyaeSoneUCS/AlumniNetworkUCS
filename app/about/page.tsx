// file: app/about/page.tsx

"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Mail,
  MessageCircle,
  Newspaper,
  UserRound,
  Users,
} from "lucide-react";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";

const text = {
  en: {
    pageTitle: "About Alumni Network",
    pageSubtitle: "Discover the features tailored for our university graduates.",
    explore: "Explore Platform",
    sectionTitle: "What can you do in Alumni Network?",
    whatIs: "",
    cards: [
      {
        title: "Feeds",
        href: "/feeds",
        icon: Newspaper,
        description:
          "Stay updated with alumni posts, events, and community news.",
        button: "Browse Feeds",
      },
      {
        title: "Directories",
        href: "/directory",
        icon: Users,
        description:
          "Search alumni by name, email, graduation year and degree name.",
        button: "Search Directory",
      },
      {
        title: "Jobs",
        href: "/jobs",
        icon: Briefcase,
        description:
          "Find job opportunities and career updates from alumni.",
        button: "Browse Jobs",
      },
      {
        title: "Messages",
        href: "/messages",
        icon: MessageCircle,
        description:
          "Chat with alumni, classmates, and friends directly through the platform.",
        button: "Open Messages",
      },
      {
        title: "Contact",
        href: "/contact",
        icon: Mail,
        description:
          "Need help? Contact the Student Affairs Department for assistance.",
        button: "Get Support",
      },
      {
        title: "Profile",
        href: "/settings",
        icon: UserRound,
        description:
          "Update your personal information, education and experience.",
        button: "Edit Profile",
      },
    ],
  },
  mm: {
    pageTitle: "Alumni Network အကြောင်း",
    pageSubtitle: "ကျောင်းသားဟောင်းများအတွက် ပြင်ဆင်ထားသော လုပ်ဆောင်ချက်များကို လေ့လာပါ။",
    explore: "Platform ကို လေ့လာမယ်",
    sectionTitle: "Alumni Network မှာ ဘာတွေ အသုံးပြုနိုင်လဲ?",
    whatIs: "",
    cards: [
      {
        title: "သတင်းစုံ",
        href: "/feeds",
        icon: Newspaper,
        description:
          "ကျောင်းသားဟောင်းများ၏ ပို့စ်များ၊ ပွဲအစီအစဉ်များနှင့် သတင်းများကို ကြည့်ရှုနိုင်ပါသည်။",
        button: "သတင်းများ ကြည့်ရှုရန် ",
      },
      {
        title: "ကျောင်းသားဟောင်းများ စာရင်း",
        href: "/directory",
        icon: Users,
        description:
          "အမည်၊ အီးမေးလ်၊ အောင်မြင်သည့်ခုနှစ် နှင့် ဘွဲ့အမည်တို့ဖြင့် ရှာဖွေနိုင်ပါသည်။",
        button: "စာရင်း ရှာဖွေရန် ",
      },
      {
        title: "အလုပ်အကိုင်များ",
        href: "/jobs",
        icon: Briefcase,
        description:
          "ကျောင်းသားဟောင်းများ မျှဝေထားသော အလုပ်အကိုင်အခွင့်အလမ်းများနှင့် အလုပ်အကိုင်ဆိုင်ရာ သတင်းများကို ကြည့်ရှုနိုင်ပါသည်။",
        button: "အလုပ်အကိုင်များ ကြည့်ရှုရန်",
      },
      {
        title: "စာတိုပေးပို့မှုများ",
        href: "/messages",
        icon: MessageCircle,
        description:
          "ကျောင်းသားဟောင်းများ၊ အတန်းဖော်များနှင့် သူငယ်ချင်းများကို တိုက်ရိုက် စကားပြောနိုင်ပါသည်။",
        button: "စာတိုများ ဖွင့်ရန်",
      },
      {
        title: "ဆက်သွယ်ရန်",
        href: "/contact",
        icon: Mail,
        description:
          "အကူအညီလိုအပ်ပါက ကျောင်းသားရေးရာဌာန သို့ ဆက်သွယ်နိုင်ပါသည်။",
        button: "အကူအညီရယူရန်",
      },
      {
        title: "ကိုယ်ရေးအကျဉ်း",
        href: "/settings",
        icon: UserRound,
        description:
          "ကိုယ်ရေးအချက်အလက်၊ ပညာရေး နှင့် လုပ်ငန်းအတွေ့အကြုံများကို ပြင်ဆင်နိုင်ပါသည်။",
        button: "ကိုယ်ရေးအကျဉ်း ပြင်ဆင်ရန် ",
      },
    ],
  },
};

export default function AboutPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const content = text[currentLang];

  return (
    <main className="flex min-h-[calc(100vh-130px)] flex-col px-2 py-4 sm:px-3 sm:py-5">
      
      {/* Explore Platform Cards Section */}
      {/* Reduced py-10 to py-6 lg:py-8 to decrease overall height */}
      <section className="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center rounded-[2rem] border border-white/60 bg-white/60 px-5 py-6 shadow-xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50 sm:px-8 lg:px-12 lg:py-8 bg-gradient-to-br from-[#d4f5f5] via-blue-100 to-[#eaffff] dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/20">
        
        {/* Reduced margin bottom from mb-8 to mb-5/mb-6 and removed mt-2 from h2 to reduce upper margin */}
        <div className="mb-5 text-center lg:mb-6">
          <h2 className="animate-card text-2xl font-black text-slate-900 dark:text-white sm:text-3xl md:text-4xl">
            {content.sectionTitle}
          </h2>
        </div>

        {/* Reduced gap from gap-5 to gap-4 to pull cards tighter together */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                // Reduced padding inside card from p-6 to p-5
                className="group animate-card rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#25C9C8]/60 hover:bg-white hover:shadow-2xl dark:border-slate-800/80 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Reduced bottom margin of icon from mb-5 to mb-3 */}
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon size={24} />
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentLang === "mm"
                    ? `${card.title} ${content.whatIs}`
                    : `${content.whatIs} ${card.title}`}
                </h3>

                {/* Reduced top margin and minimum height of description for space efficiency */}
                <p className="mt-1.5 min-h-[60px] text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                  {card.description}
                </p>

                {/* Reduced top margin of button text from mt-5 to mt-3 */}
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-[#008B8B] dark:text-[#00BFC4]">
                  {card.button}
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <style>{`
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-card {
          opacity: 0;
          animation: cardIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  );
}