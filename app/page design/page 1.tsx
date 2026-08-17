// file: app/page.tsx

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

import { auth } from "@/auth";

const cards = [
  {
    title: "Feeds",
    href: "/feeds",
    icon: Newspaper,
    text: "See news, announcements, events, and alumni updates.",
  },
  {
    title: "Directory",
    href: "/directory",
    icon: Users,
    text: "Find alumni by name, department, year, and career.",
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    text: "Explore jobs and career opportunities from alumni.",
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageCircle,
    text: "Chat and stay connected with alumni members.",
  },
  {
    title: "Contact",
    href: "/contact",
    icon: Mail,
    text: "Contact the university and alumni network office.",
  },
  {
    title: "Profile",
    href: "/settings",
    icon: UserRound,
    text: "Update your personal information and experience.",
  },
];

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main className="min-h-[calc(100vh-70px)] bg-[#eaffff] px-2 pb-6 sm:px-3">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-[#94EFEE] via-white to-[#eaffff] shadow-md">
        <div className="relative overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#00BFC4]/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#f1cd72]/30 blur-3xl" />

          <div className="relative grid min-h-[calc(100vh-110px)] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="animate-fade-up">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25C9C8]/30 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#008B8B] shadow-sm">
                <Sparkles size={15} />
                Alumni Network
              </div>

              <h1 className="max-w-2xl text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Welcome to{" "}
                <span className="text-[#008B8B]">Alumni Network</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                A modern platform for alumni to connect, share posts, find jobs,
                send messages, and build a stronger community.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={isLoggedIn ? "/feeds" : "/register"}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {isLoggedIn ? "Open Feeds" : "Join Now"}
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href={isLoggedIn ? "/directory" : "/login"}
                  className="inline-flex items-center justify-center rounded-xl border border-[#25C9C8]/30 bg-white/80 px-5 py-3 text-sm font-black text-[#008B8B] shadow-sm transition hover:-translate-y-1 hover:bg-white"
                >
                  {isLoggedIn ? "View Directory" : "Login"}
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="group animate-card rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[#25C9C8]/50 hover:bg-white hover:shadow-xl"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-sm transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <Icon size={22} />
                    </div>

                    <h2 className="text-base font-black text-slate-900">
                      What is {card.title}?
                    </h2>

                    <p className="mt-2 min-h-[72px] text-sm font-semibold leading-6 text-slate-600">
                      {card.text}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-[#008B8B]">
                      Open {card.title}
                      <ArrowRight
                        size={15}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        .animate-fade-up {
          animation: fadeUp 0.7s ease-out both;
        }

        .animate-card {
          animation: cardIn 0.55s ease-out both;
        }
      `}</style>
    </main>
  );
}