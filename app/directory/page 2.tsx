// file: app/directory/page.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaLinkedin,
  FaPhone,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";

import { useI18n } from "@/components/providers";

type User = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  profileImage?: string;
  googleImage?: string;
  googleProfileImage?: string;
  graduatedYear?: number | null;
  degree?: string;
  department?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    company?: string;
    position?: string;
  };
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    github?: string;
    tiktok?: string;
  };
};

const degrees = [
  "B.C.Sc",
  "B.C.Tech",
  "M.C.Sc",
  "M.C.Tech",
  "D.C.Sc",
  "M.I.Sc",
  "Ph.D",
];

const socialPrefixes = {
  facebook: "facebook.com/",
  linkedin: "linkedin.com/in/",
  tiktok: "tiktok.com/@",
  youtube: "youtube.com/@",
  github: "github.com/",
};

type SocialType = keyof typeof socialPrefixes;

const text = {
  en: {
    search: "Search name or email...",
    allDegrees: "All Degrees",
    allYears: "All Years",
    loading: "Loading alumni directory...",
    empty: "No alumni found",
    emptyText: "Try another search or filter.",
    classOf: "Class of",
    viewProfile: "View",
    clear: "Clear",
  },
  mm: {
    search: "အမည် သို့မဟုတ် Email ဖြင့် ရှာမည်...",
    allDegrees: "Degree အားလုံး",
    allYears: "ဘွဲ့ရနှစ် အားလုံး",
    loading: "ကျောင်းသားဟောင်းစာရင်း ဖွင့်နေသည်...",
    empty: "ကျောင်းသားဟောင်း မတွေ့ပါ",
    emptyText: "အခြားရှာဖွေမှု သို့မဟုတ် Filter ဖြင့် ထပ်စမ်းပါ။",
    classOf: "ဘွဲ့ရနှစ်",
    viewProfile: "ကြည့်မည်",
    clear: "ရှင်းမည်",
  },
};

export default function DirectoryPage() {
  const { lang } = useI18n();
  const currentLang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [users, setUsers] = useState<User[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const [search, setSearch] = useState("");
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState("");

  const registeredYears = useMemo(() => {
    const yearsFromUsers = users
      .map((user) => user.graduatedYear)
      .filter(Boolean) as number[];

    return [...new Set([...allYears, ...yearsFromUsers])].sort((a, b) => b - a);
  }, [allYears, users]);

  useEffect(() => {
    function handleSearchToggle() {
      setShowSearchBar((value) => !value);
    }

    window.addEventListener("alumni-search-toggle", handleSearchToggle);

    return () => {
      window.removeEventListener("alumni-search-toggle", handleSearchToggle);
    };
  }, []);

  async function loadUsers() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("q", search.trim());
      if (degree) params.set("degree", degree);
      if (year) params.set("year", year);

      const res = await fetch(`/api/users?${params.toString()}`, {
        cache: "no-store",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load users failed:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRegisteredYears() {
    try {
      const res = await fetch("/api/users", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data)) return;

      const years = data
        .map((user: User) => user.graduatedYear)
        .filter(Boolean) as number[];

      setAllYears([...new Set(years)].sort((a, b) => b - a));
    } catch (error) {
      console.error("Load years failed:", error);
      setAllYears([]);
    }
  }

  useEffect(() => {
    loadRegisteredYears();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, 300);
    return () => window.clearTimeout(timer);
  }, [search, degree, year]);

  function clearFilters() {
    setSearch("");
    setDegree("");
    setYear("");
  }

  return (
    <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="ucsh-container relative z-10">
        {showSearchBar && (
          <div className="ucsh-card ucsh-animate mb-5 p-4 sm:mb-7 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
              <input
                type="text"
                placeholder={t.search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="ucsh-input h-12 px-4 text-sm font-bold sm:col-span-2 sm:text-base lg:col-span-1"
              />

              <select
                value={degree}
                onChange={(event) => setDegree(event.target.value)}
                className="ucsh-input h-12 px-4 text-sm font-bold sm:text-base"
              >
                <option value="">{t.allDegrees}</option>

                {degrees.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="ucsh-input h-12 px-4 text-sm font-bold sm:text-base"
              >
                <option value="">{t.allYears}</option>

                {registeredYears.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="ucsh-btn-outline rounded-[var(--ucsh-radius-md)] px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 sm:text-base"
              >
                {t.clear}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <EmptyState title={t.loading} />
        ) : users.length === 0 ? (
          <EmptyState title={t.empty} description={t.emptyText} />
        ) : (
          <div className="grid gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {users.map((user, index) => {
              const email = user.contactInfo?.email || user.email || "";
              const phone = user.contactInfo?.phone || "";
              const image = getUserImage(user);
              const userDegree = user.degree || user.department || "";

              return (
                <article
                  key={user._id}
                  className="ucsh-card ucsh-animate group overflow-hidden p-0"
                  style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                >
                  <div className="flex items-center gap-3 border-b border-[var(--ucsh-border)] p-4">
                    <Image
                      src={image}
                      alt={user.name || "Alumni"}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-white dark:ring-slate-900"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-black text-[var(--ucsh-text)]">
                        {user.name || "Alumni"}
                      </h2>

                      <p className="mt-1 truncate text-xs font-bold text-[var(--ucsh-muted)]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {userDegree && <Tag>{userDegree}</Tag>}

                      {user.graduatedYear && (
                        <Tag>
                          {t.classOf} {user.graduatedYear}
                        </Tag>
                      )}
                    </div>

                    <SocialIcons links={user.socialLinks} />

                    <div className="mt-5 grid grid-cols-[44px_44px_1fr] gap-2">
                      <IconAction
                        href={phone ? `tel:${phone}` : ""}
                        icon={<FaPhone />}
                        label="Call"
                      />

                      <IconAction
                        href={email ? `mailto:${email}` : ""}
                        icon={<FaEnvelope />}
                        label="Email"
                      />

                      <Link
                        href={`/profile/${user._id}`}
                        className="ucsh-btn px-4 py-3 text-sm"
                      >
                        {t.viewProfile}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function getUserImage(user: User) {
  return (
    user.profileImage ||
    user.image ||
    user.googleImage ||
    user.googleProfileImage ||
    "/avatar.png"
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-full rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black text-[var(--ucsh-primary-dark)] ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:ring-cyan-900">
      <span className="break-words">{children}</span>
    </span>
  );
}

function IconAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  if (!href) {
    return (
      <div
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"
      >
        {icon}
      </div>
    );
  }

  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ucsh-border)] bg-white/70 text-[var(--ucsh-primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-950/70"
    >
      {icon}
    </a>
  );
}

function SocialIcons({ links }: { links?: User["socialLinks"] }) {
  const items: {
    href?: string;
    icon: React.ReactNode;
    label: string;
    type: SocialType;
  }[] = [
    {
      href: links?.facebook,
      icon: <FaFacebook />,
      label: "Facebook",
      type: "facebook",
    },
    {
      href: links?.linkedin,
      icon: <FaLinkedin />,
      label: "LinkedIn",
      type: "linkedin",
    },
    {
      href: links?.tiktok,
      icon: <FaTiktok />,
      label: "TikTok",
      type: "tiktok",
    },
    
    
    {
      href: links?.github,
      icon: <FaGithub />,
      label: "GitHub",
      type: "github",
    },
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => {
        const active = Boolean(item.href);

        if (!active) {
          return (
            <span
              key={item.label}
              aria-label={item.label}
              title={item.label}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-300 dark:border-slate-800 dark:bg-slate-900"
            >
              {item.icon}
            </span>
          );
        }

        return (
          <a
            key={item.label}
            href={socialUrl(item.type, item.href || "")}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            title={item.label}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ucsh-border)] bg-white/70 text-sm text-[var(--ucsh-primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-950/70"
          >
            {item.icon}
          </a>
        );
      })}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="ucsh-card ucsh-animate p-8 text-center sm:p-10">
      <h2 className="text-xl font-black text-[var(--ucsh-text)] sm:text-2xl">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm font-bold text-[var(--ucsh-muted)] sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function cleanUsername(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^facebook\.com\//i, "")
    .replace(/^linkedin\.com\/in\//i, "")
    .replace(/^tiktok\.com\/@?/i, "")
    .replace(/^youtube\.com\/@?/i, "")
    .replace(/^github\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
}

function socialUrl(type: SocialType, value: string) {
  const username = cleanUsername(value);

  if (!username) return "#";

  return `https://${socialPrefixes[type]}${username}`;
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--ucsh-primary)]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
    </>
  );
}