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

const featureCards = [
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
];

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main className="min-h-[calc(100vh-70px)] bg-[#eaffff] px-2 pb-6 sm:px-3">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/20 shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/background/background-3.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(241,205,114,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(0,191,196,0.18),transparent_35%)]" />

        <div className="relative z-10 flex min-h-[calc(100vh-115px)] items-center px-5 py-12 sm:px-8 lg:px-12">
          <div className="animate-fade-up max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
              <Sparkles size={15} className="text-[#f1cd72]" />
              Alumni Network
            </div>

            <h1 className="text-[20px] font-black leading-[0.98] tracking-tight drop-shadow-xl sm:text-[56px] md:text-[72px] lg:text-[82px]">
              <span className="text-[#f1cd72]">Hinthada Computer</span>
              <br />
              <span className="text-white">Science & Technology</span>
              <br />
              <span className="text-white">Alumni Network</span>
            </h1>

            <p className="mt-5 max-w-[660px] text-[19px] font-medium leading-snug text-white drop-shadow-lg sm:text-[23px] md:text-[27px]">
              Connecting Alumni â€¢ Sharing Knowledge â€¢ Inspiring Innovation
            </p>

            <p className="mt-4 max-w-[700px] text-[23px] font-bold leading-tight text-[#f1cd72] drop-shadow-lg sm:text-[27px] md:text-[32px]">
              Together Building Myanmar&apos;s Digital Future
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isLoggedIn ? "/feeds" : "/register"}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
              >
                {isLoggedIn ? "Open Feeds" : "Join Now"}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href={isLoggedIn ? "/directory" : "/login"}
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                {isLoggedIn ? "View Directory" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="mx-auto mt-5 max-w-7xl rounded-2xl border border-white/70 bg-gradient-to-br from-[#94EFEE] via-white to-[#eaffff] px-5 py-8 shadow-md sm:px-8 lg:px-10">
        <div className="mb-7 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#008B8B]">
            Explore Platform
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            What can you do in Alumni Network?
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group animate-card rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[#25C9C8]/60 hover:bg-white hover:shadow-xl"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-sm transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon size={22} />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  What is {card.title}?
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
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
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
          animation: fadeUp 0.75s ease-out both;
        }

        .animate-card {
          animation: cardIn 0.55s ease-out both;
        }
      `}</style>
    </main>
  );
}