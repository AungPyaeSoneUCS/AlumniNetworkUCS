// file: app/page.tsx

"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Mail,
  MessageCircle,
  Newspaper,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";

const text = {
  en: {
    badge: "Alumni Network",
    line1: "Hinthada Computer",
    line2: "Science & Technology",
    line3: "Alumni Network",
    subtitle: "Connecting Alumni • Sharing Knowledge • Inspiring Innovation",
    slogan: "Together Building Myanmar's Digital Future",
    join: "Join Now",
    feeds: "Open Feeds",
    login: "Login",
    directory: "View Directory",
    explore: "Explore Platform",
    sectionTitle: "What can you do in Alumni Network?",
    cards: [
      {
        title: "Feeds",
        href: "/feeds",
        icon: Newspaper,
        description:
          "Read alumni posts, announcements, news, events, and shared community updates.",
        button: "Open Feeds",
      },
      {
        title: "Directory",
        href: "/directory",
        icon: Users,
        description:
          "Find alumni by name, department, graduation year, skills, and career information.",
        button: "Explore Directory",
      },
      {
        title: "Jobs",
        href: "/jobs",
        icon: Briefcase,
        description:
          "Discover job opportunities and professional experiences shared by alumni.",
        button: "View Jobs",
      },
      {
        title: "Messages",
        href: "/messages",
        icon: MessageCircle,
        description:
          "Connect and chat with alumni, classmates, and professional contacts.",
        button: "Start Chat",
      },
      {
        title: "Contact",
        href: "/contact",
        icon: Mail,
        description:
          "Contact the university or alumni network office for support and information.",
        button: "Contact Us",
      },
      {
        title: "Profile",
        href: "/profile",
        icon: UserRound,
        description:
          "Manage your profile, personal details, education, skills, and experience.",
        button: "My Profile",
      },
    ],
  },
  mm: {
    badge: "á€€á€»á€±á€¬á€„á€ºá€¸á€žá€¬á€¸á€Ÿá€±á€¬á€„á€ºá€¸ á€€á€½á€”á€ºá€›á€€á€º",
    line1: "Hinthada Computer",
    line2: "Science & Technology",
    line3: "Alumni Network",
    subtitle: "á€€á€»á€±á€¬á€„á€ºá€¸á€žá€¬á€¸á€Ÿá€±á€¬á€„á€ºá€¸á€™á€»á€¬á€¸á€á€»á€­á€á€ºá€†á€€á€ºá€á€¼á€„á€ºá€¸ • á€¡á€žá€­á€•á€Šá€¬á€™á€»á€¾á€á€±á€á€¼á€„á€ºá€¸ • á€”á€Šá€ºá€¸á€•á€Šá€¬á€á€­á€¯á€¸á€á€€á€ºá€™á€¾á€¯á€¡á€¬á€¸á€•á€±á€¸á€á€¼á€„á€ºá€¸",
    slogan: "á€™á€¼á€”á€ºá€™á€¬á€·á€’á€…á€ºá€‚á€»á€…á€ºá€á€šá€ºá€¡á€”á€¬á€‚á€á€ºá€€á€­á€¯ á€¡á€á€°á€á€€á€½á€á€Šá€ºá€†á€±á€¬á€€á€ºá€€á€¼á€™á€šá€º",
    join: "á€…á€¬á€›á€„á€ºá€¸á€žá€½á€„á€ºá€¸á€™á€šá€º",
    feeds: "Feeds á€€á€¼á€Šá€·á€ºá€™á€šá€º",
    login: "Login á€á€„á€ºá€™á€šá€º",
    directory: "Directory á€€á€¼á€Šá€·á€ºá€™á€šá€º",
    explore: "Platform á€€á€­á€¯ á€œá€±á€·á€œá€¬á€™á€šá€º",
    sectionTitle: "Alumni Network á€™á€¾á€¬ á€˜á€¬á€á€½á€± á€¡á€žá€¯á€¶á€¸á€•á€¼á€¯á€”á€­á€¯á€„á€ºá€œá€²?",
    cards: [
      {
        title: "Feeds",
        href: "/feeds",
        icon: Newspaper,
        description:
          "á€€á€»á€±á€¬á€„á€ºá€¸á€žá€¬á€¸á€Ÿá€±á€¬á€„á€ºá€¸á€™á€»á€¬á€¸á á€•á€­á€¯á€·á€…á€ºáŠ á€€á€¼á€±á€Šá€¬á€á€»á€€á€ºáŠ á€žá€á€„á€ºá€¸á€”á€¾á€„á€·á€º event á€™á€»á€¬á€¸á€€á€­á€¯ á€–á€á€ºá€”á€­á€¯á€„á€ºá€žá€Šá€ºá‹",
        button: "Feeds á€–á€½á€„á€·á€ºá€™á€šá€º",
      },
      {
        title: "Directory",
        href: "/directory",
        icon: Users,
        description:
          "á€¡á€™á€Šá€ºáŠ á€Œá€¬á€”áŠ á€€á€»á€±á€¬á€„á€ºá€¸á€•á€¼á€®á€¸á€”á€¾á€…á€ºá€”á€¾á€„á€·á€º á€¡á€œá€¯á€•á€ºá€¡á€€á€­á€¯á€„á€ºá€¡á€á€»á€€á€ºá€¡á€œá€€á€ºá€™á€»á€¬á€¸á€–á€¼á€„á€·á€º alumni á€™á€»á€¬á€¸á€€á€­á€¯ á€›á€¾á€¬á€”á€­á€¯á€„á€ºá€žá€Šá€ºá‹",
        button: "Directory á€€á€¼á€Šá€·á€ºá€™á€šá€º",
      },
      {
        title: "Jobs",
        href: "/jobs",
        icon: Briefcase,
        description:
          "Alumni á€™á€»á€¬á€¸á€™á€»á€¾á€á€±á€‘á€¬á€¸á€žá€±á€¬ á€¡á€œá€¯á€•á€ºá€¡á€€á€­á€¯á€„á€ºá€¡á€á€½á€„á€·á€ºá€¡á€œá€™á€ºá€¸á€™á€»á€¬á€¸á€€á€­á€¯ á€€á€¼á€Šá€·á€ºá€”á€­á€¯á€„á€ºá€žá€Šá€ºá‹",
        button: "Jobs á€€á€¼á€Šá€·á€ºá€™á€šá€º",
      },
      {
        title: "Messages",
        href: "/messages",
        icon: MessageCircle,
        description:
          "Alumni á€™á€»á€¬á€¸á€”á€¾á€„á€·á€º á€á€­á€¯á€€á€ºá€›á€­á€¯á€€á€º message á€•á€­á€¯á€·á€•á€¼á€®á€¸ á€†á€€á€ºá€žá€½á€šá€ºá€”á€­á€¯á€„á€ºá€žá€Šá€ºá‹",
        button: "Message á€•á€­á€¯á€·á€™á€šá€º",
      },
      {
        title: "Contact",
        href: "/contact",
        icon: Mail,
        description:
          "á€á€€á€¹á€€á€žá€­á€¯á€œá€º á€žá€­á€¯á€·á€™á€Ÿá€¯á€á€º alumni network office á€€á€­á€¯ á€†á€€á€ºá€žá€½á€šá€ºá€”á€­á€¯á€„á€ºá€žá€Šá€ºá‹",
        button: "á€†á€€á€ºá€žá€½á€šá€ºá€™á€šá€º",
      },
      {
        title: "Profile",
        href: "/profile",
        icon: UserRound,
        description:
          "á€€á€­á€¯á€šá€ºá€›á€±á€¸á€¡á€á€»á€€á€ºá€¡á€œá€€á€ºáŠ á€•á€Šá€¬á€›á€±á€¸áŠ skill á€”á€¾á€„á€·á€º experience á€™á€»á€¬á€¸á€€á€­á€¯ á€•á€¼á€„á€ºá€†á€„á€ºá€”á€­á€¯á€„á€ºá€žá€Šá€ºá‹",
        button: "Profile á€€á€¼á€Šá€·á€ºá€™á€šá€º",
      },
    ],
  },
};

export default function HomePage() {
  const { data: session } = useSession();
  const { lang } = useI18n();

  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const content = text[currentLang];
  const isLoggedIn = !!session?.user;

  return (
    <main className="min-h-[calc(100vh-70px)]  px-2 pt-5 pb-7 sm:px-3">
      <section className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/20 shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/background/background-3.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/58 to-slate-950/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(241,205,114,0.22),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(0,191,196,0.18),transparent_34%)]" />

        <div className="relative z-10 flex min-h-[500px] items-center px-5 py-12 sm:min-h-[560px] sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <div className="animate-hero-1 mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
              <Sparkles size={15} className="text-[#f1cd72]" />
              {content.badge}
            </div>

            <h1 className="space-y-1 text-[32px] font-black leading-[1.08] tracking-tight drop-shadow-xl sm:text-[44px] md:text-[56px] lg:text-[64px]">
              <span className="animate-hero-2 block text-[#f1cd72]">
                {content.line1}
              </span>
              <span className="animate-hero-3 block text-white">
                {content.line2}
              </span>
              <span className="animate-hero-4 block text-white">
                {content.line3}
              </span>
            </h1>

            <p className="animate-hero-5 mt-5 max-w-[680px] text-[16px] font-semibold leading-snug text-white drop-shadow-lg sm:text-[19px] md:text-[22px]">
              {content.subtitle}
            </p>

            <p className="animate-hero-6 mt-4 max-w-[700px] text-[20px] font-black leading-tight text-[#f1cd72] drop-shadow-lg sm:text-[24px] md:text-[28px]">
              {content.slogan}
            </p>

            <div className="animate-hero-7 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isLoggedIn ? "/feeds" : "/register"}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
              >
                {isLoggedIn ? content.feeds : content.join}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href={isLoggedIn ? "/directory" : "/login"}
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                {isLoggedIn ? content.directory : content.login}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-5 max-w-7xl rounded-2xl border border-white/70 bg-gradient-to-br from-[#94EFEE] via-white to-[#eaffff] px-5 py-8 shadow-md sm:px-8 lg:px-10">
        <div className="mb-7 text-center">
          <p className="animate-card text-xs font-black uppercase tracking-[0.2em] text-[#008B8B]">
            {content.explore}
          </p>
          <h2 className="animate-card mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {content.sectionTitle}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group animate-card rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[#25C9C8]/60 hover:bg-white hover:shadow-xl"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-sm transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon size={22} />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  {currentLang === "mm"
                    ? `${card.title} á€†á€­á€¯á€á€¬á€˜á€¬á€œá€²?`
                    : `What is ${card.title}?`}
                </h3>

                <p className="mt-2 min-h-[78px] text-sm font-semibold leading-6 text-slate-600">
                  {card.description}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-[#008B8B]">
                  {card.button}
                  <ArrowRight
                    size={15}
                    className="transition group-hover:translate-x-1"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <style>{`
        @keyframes arriveText {
          from {
            opacity: 0;
            transform: translateY(22px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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
          animation: arriveText 0.7s ease-out both;
        }

        .animate-hero-1 {
          animation-delay: 0.08s;
        }

        .animate-hero-2 {
          animation-delay: 0.18s;
        }

        .animate-hero-3 {
          animation-delay: 0.3s;
        }

        .animate-hero-4 {
          animation-delay: 0.42s;
        }

        .animate-hero-5 {
          animation-delay: 0.56s;
        }

        .animate-hero-6 {
          animation-delay: 0.7s;
        }

        .animate-hero-7 {
          animation-delay: 0.84s;
        }

        .animate-card {
          opacity: 0;
          animation: cardIn 0.6s ease-out both;
        }
      `}</style>
    </main>
  );
}