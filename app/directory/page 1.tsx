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
  FaMagnifyingGlass,
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
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [search, degree, year]);

  function clearFilters() {
    setSearch("");
    setDegree("");
    setYear("");
  }

  return (
    <section className="mm relative min-h-screen overflow-hidden bg-[#F1FFFF] px-3 py-6 text-slate-950 sm:px-4 sm:py-10">
      <GradientBackground />

      <style>{`
        @keyframes searchBarDown {
          from { opacity: 0; transform: translateY(-18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes cardFall {
          from { opacity: 0; transform: translateY(-22px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .search-bar-show {
          animation: searchBarDown 0.28s ease-out both;
        }

        .directory-card-fall {
          animation: cardFall 0.42s ease-out both;
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {showSearchBar && (
          <div className="search-bar-show mb-6 rounded-[1.5rem] border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur-xl sm:mb-8 sm:rounded-[2rem] sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#008B8B]" />

                <input
                  type="text"
                  placeholder={t.search}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 pl-12 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 sm:text-base"
                />
              </div>

              <select
                value={degree}
                onChange={(event) => setDegree(event.target.value)}
                className="w-full rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 sm:text-base"
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
                className="w-full rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 sm:text-base"
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
                className="w-full rounded-2xl border border-[#25C9C8]/30 bg-white px-5 py-3 text-sm font-black text-[#008B8B] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FFFF] hover:shadow-lg sm:text-base lg:w-auto"
              >
                {t.clear}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-[1.5rem] border border-white/60 bg-white/85 p-8 text-center shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-10">
            <p className="text-lg font-black text-[#008B8B] sm:text-xl">
              {t.loading}
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/60 bg-white/85 p-8 text-center shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-10">
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
              {t.empty}
            </h2>

            <p className="mt-3 text-sm font-bold text-slate-500 sm:text-base">
              {t.emptyText}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {users.map((user, index) => {
              const email = user.contactInfo?.email || user.email || "";
              const phone = user.contactInfo?.phone || "";
              const image = getUserImage(user);
              const userDegree = user.degree || user.department || "";

              return (
                <article
                  key={user._id}
                  className="directory-card-fall group overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/90 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:rounded-[2rem]"
                  style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
                >
                  <div className="h-16 bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#42D3E2]" />

                  <div className="px-4 pb-5">
                    <div className="-mt-10 flex justify-center">
                      <Image
                        src={image}
                        alt={user.name || "Alumni"}
                        width={92}
                        height={92}
                        className="h-20 w-20 rounded-3xl border-4 border-white object-cover shadow-2xl"
                      />
                    </div>

                    <div className="mt-4 text-center">
                      <h2 className="line-clamp-1 break-words text-xl font-black text-slate-950">
                        {user.name || "Alumni"}
                      </h2>

                      <p className="mt-1 line-clamp-1 break-all text-xs font-bold text-slate-500">
                        {user.email}
                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {userDegree && <Tag>{userDegree}</Tag>}

                        {user.graduatedYear && (
                          <Tag>
                            {t.classOf} {user.graduatedYear}
                          </Tag>
                        )}
                      </div>

                      <SocialIcons links={user.socialLinks} />
                    </div>

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
                        className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
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
      </div>
    </section>
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
    <span className="max-w-full rounded-full bg-[#F8FFFF] px-3 py-1 text-[11px] font-black text-[#008B8B] ring-1 ring-[#25C9C8]/30">
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
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
      >
        {icon}
      </div>
    );
  }

  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] text-[#008B8B] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
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
      href: links?.youtube,
      icon: <FaYoutube />,
      label: "YouTube",
      type: "youtube",
    },
    {
      href: links?.github,
      icon: <FaGithub />,
      label: "GitHub",
      type: "github",
    },
  ];

  return (
    <div className="mt-4 flex justify-center gap-2">
      {items.map((item) => {
        const active = Boolean(item.href);

        if (!active) {
          return (
            <span
              key={item.label}
              aria-label={item.label}
              title={item.label}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-300"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#25C9C8]/20 bg-[#F8FFFF] text-sm text-[#008B8B] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
          >
            {item.icon}
          </a>
        );
      })}
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

function GradientBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[#94EFEE]" />
      <div className="absolute left-0 top-0 -z-10 h-64 w-64 rounded-full bg-white/45 blur-3xl sm:h-80 sm:w-80" />
      <div className="absolute bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-[#25C9C8]/40 blur-3xl sm:h-96 sm:w-96" />
      <div className="absolute left-1/3 top-1/3 -z-10 h-80 w-80 rounded-full bg-white/25 blur-3xl sm:h-[500px] sm:w-[500px]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-3 bg-[#25C9C8] sm:h-4" />
    </>
  );
}