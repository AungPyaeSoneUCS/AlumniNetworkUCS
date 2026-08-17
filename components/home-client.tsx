// file: components/home-client.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  MessageCircle,
  Newspaper,
  Users,
} from "lucide-react";

import { useI18n } from "@/components/providers";

const content = {
  en: {
    feeds: "Feeds",
    directory: "Directory",
    jobs: "Jobs",
    messages: "Messages",
    open: "Open",
    connected: "Connected Again",
    alumni: "UCSH Alumni Network",
    title: "Reconnect with your UCSH alumni community",
    subtitle:
      "Find alumni, share updates, discover jobs, and message your friends in one simple network.",
    start: "Get Started",
    explore: "Explore Directory",
  },
  mm: {
    feeds: "Feed",
    directory: "အဖွဲ့ဝင်စာရင်း",
    jobs: "အလုပ်အကိုင်",
    messages: "စာတိုများ",
    open: "ဖွင့်မည်",
    connected: "ပြန်လည်ချိတ်ဆက်ခြင်း",
    alumni: "UCSH ကျောင်းသားဟောင်းကွန်ယက်",
    title: "UCSH ကျောင်းသားဟောင်းများ ပြန်လည်ချိတ်ဆက်ရာနေရာ",
    subtitle:
      "Alumni များကိုရှာဖွေ၊ update များမျှဝေ၊ အလုပ်အကိုင်များကြည့်ရှု၊ စာတိုပို့နိုင်သော network ဖြစ်သည်။",
    start: "စတင်မည်",
    explore: "အဖွဲ့ဝင်များကြည့်မည်",
  },
};

export default function HomeClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { lang } = useI18n();
  const t = content[lang === "mm" ? "mm" : "en"];

  const items = [
    { href: isLoggedIn ? "/feeds" : "/login", title: t.feeds, icon: Newspaper },
    { href: isLoggedIn ? "/directory" : "/login", title: t.directory, icon: Users },
    { href: isLoggedIn ? "/jobs" : "/login", title: t.jobs, icon: Briefcase },
    {
      href: isLoggedIn ? "/messages" : "/login",
      title: t.messages,
      icon: MessageCircle,
    },
  ];

  return (
    <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
      <HomeBackground />

      <section className="ucsh-container relative z-10 flex min-h-[82vh] items-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ucsh-border)] bg-white/70 px-4 py-2 text-xs font-black text-[var(--ucsh-primary-dark)] shadow-sm backdrop-blur dark:bg-slate-950/70">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {t.connected}
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-[-0.04em] text-[var(--ucsh-text)] sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-5 max-w-xl text-sm font-bold leading-7 text-[var(--ucsh-muted)] sm:text-base">
              {t.subtitle}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isLoggedIn ? "/feeds" : "/login"}
                className="ucsh-btn px-6 py-3 text-sm"
              >
                {t.start}
                <ArrowRight size={18} />
              </Link>

              <Link
                href={isLoggedIn ? "/directory" : "/login"}
                className="ucsh-btn-outline inline-flex items-center justify-center rounded-[var(--ucsh-radius-md)] px-6 py-3 text-sm font-black"
              >
                {t.explore}
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.08 }}
                  >
                    <Link
                      href={item.href}
                      className="group flex flex-col gap-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-4 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:shadow-md dark:bg-slate-950/70 dark:hover:bg-slate-900"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md transition group-hover:scale-110">
                        <Icon size={20} />
                      </span>

                      <span className="text-sm font-black text-[var(--ucsh-text)]">
                        {item.title}
                      </span>

                      <span className="flex items-center gap-1 text-xs font-black text-[var(--ucsh-primary-dark)]">
                        {t.open}
                        <ArrowRight
                          size={14}
                          className="transition group-hover:translate-x-1"
                        />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 36, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.65 }}
            className="order-1 lg:order-2"
          >
            <div className="ucsh-card relative mx-auto max-w-xl overflow-hidden p-4 sm:p-5">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--ucsh-primary)]/25 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/60 blur-3xl" />

              <div className="relative overflow-hidden rounded-[var(--ucsh-radius-xl)] border border-[var(--ucsh-border)] bg-white/70 p-4 shadow-[var(--ucsh-shadow-md)] dark:bg-slate-950/70">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white shadow-md">
                      <Image
                        src="/logo/logo-250.png"
                        alt={t.alumni}
                        fill
                        sizes="48px"
                        className="object-cover"
                        priority
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[var(--ucsh-text)]">
                        {t.alumni}
                      </p>
                      <p className="truncate text-xs font-bold text-[var(--ucsh-primary-dark)]">
                        {t.connected}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-[var(--ucsh-primary-dark)] ring-1 ring-cyan-200">
                    LIVE
                  </span>
                </div>

                <div className="relative flex h-[340px] items-center justify-center overflow-hidden rounded-[var(--ucsh-radius-xl)] bg-gradient-to-br from-white via-cyan-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:h-[430px]">
                  <Image
                    src="/logo/logo-250.png"
                    alt={t.alumni}
                    width={260}
                    height={260}
                    className="relative z-10 h-44 w-44 rounded-[2rem] object-cover shadow-2xl ring-8 ring-white/70 sm:h-60 sm:w-60"
                    priority
                  />

                  <FloatingBadge
                    className="left-4 top-5"
                    label={t.feeds}
                    icon={<Newspaper size={16} />}
                  />

                  <FloatingBadge
                    className="right-4 top-16"
                    label={t.jobs}
                    icon={<Briefcase size={16} />}
                  />

                  <FloatingBadge
                    className="bottom-6 left-5"
                    label={t.directory}
                    icon={<Users size={16} />}
                  />

                  <FloatingBadge
                    className="bottom-12 right-5"
                    label={t.messages}
                    icon={<MessageCircle size={16} />}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function FloatingBadge({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute z-20 flex items-center gap-2 rounded-2xl border border-[var(--ucsh-border)] bg-white/90 px-3 py-2 text-xs font-black text-[var(--ucsh-primary-dark)] shadow-lg backdrop-blur dark:bg-slate-900/90 ${className}`}
    >
      {icon}
      {label}
    </motion.div>
  );
}

function HomeBackground() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[var(--ucsh-primary)]/30 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
    </>
  );
}