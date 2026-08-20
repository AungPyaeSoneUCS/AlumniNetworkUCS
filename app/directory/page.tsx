// file: app/directory/page.tsx
"use client";

import type React from "react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaLinkedin,
  FaPhone,
  FaTiktok,
} from "react-icons/fa6";

import { useI18n } from "@/components/providers";

type User = {
  _id: string;
  name: string;
  email: string;
  role?: string; 
  image?: string;
  profileImage?: string;
  googleImage?: string;
  googleProfileImage?: string;
  graduatedYear?: string; // Safely typed as string
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
    linkedin?: string;
    github?: string;
    tiktok?: string;
  };
};

type SavedFilters = {
  search: string;
  degree: string;
  year: string;
};

const DIRECTORY_FILTER_STORAGE_KEY = "ucsh-directory-filters";
const DIRECTORY_SCROLL_STORAGE_KEY = "ucsh-directory-scroll-y";

const socialPrefixes = {
  facebook: "facebook.com/",
  linkedin: "linkedin.com/in/",
  tiktok: "tiktok.com/@",
  github: "github.com/",
};

type SocialType = keyof typeof socialPrefixes;

const text = {
  en: {
    search: "Search name or email...",
    allDegrees: " Degree Names ",
    allYears: " Year of Successful Completion",
    loading: "Loading alumni directory...",
    empty: "No alumni found",
    emptyText: "Try another search or filter.",
    classOf: "Class of",
    viewProfile: "Profile View",
    clear: "Clear",
    call: "Call",
    email: "Email",
  },
  mm: {
    search: "အမည် သို့မဟုတ် Email ဖြင့် ရှာမည်...",
    allDegrees: " ဘွဲ့အမည်များ ",
    allYears: "အောင်မြင်သည့် ခုနှစ် ",
    loading: "ကျောင်းသားဟောင်းစာရင်း ဖွင့်နေသည်...",
    empty: "ကျောင်းသားဟောင်း မတွေ့ပါ",
    emptyText: "အခြားရှာဖွေမှု သို့မဟုတ် Filter ဖြင့် ထပ်စမ်းပါ။",
    classOf: "ဘွဲ့ရနှစ်",
    viewProfile: "Profile ကြည့်မည်",
    clear: "ရှင်းမည်",
    call: "ဖုန်း",
    email: "အီးမေးလ်",
  },
};

function getInitialFilters(searchParams: URLSearchParams): SavedFilters {
  if (typeof window === "undefined") {
    return { search: "", degree: "", year: "" };
  }

  const queryFilters: SavedFilters = {
    search: searchParams.get("q") || "",
    degree: searchParams.get("degree") || "",
    year: searchParams.get("year") || "",
  };

  if (Object.values(queryFilters).some(Boolean)) return queryFilters;

  try {
    const saved = sessionStorage.getItem(DIRECTORY_FILTER_STORAGE_KEY);
    if (!saved) return queryFilters;

    const parsed = JSON.parse(saved) as Partial<SavedFilters>;
    return {
      search: parsed.search || "",
      degree: parsed.degree || "",
      year: parsed.year || "",
    };
  } catch {
    return queryFilters;
  }
}

// Helper to reliably strip admins from any user array
function filterNonAdmins(userList: any[]): User[] {
  if (!Array.isArray(userList)) return [];
  return userList.filter((u: User) => u?.role?.toLowerCase() !== "admin" && u?.role?.toLowerCase() !== "staff");
}

function DirectoryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { lang } = useI18n();
  const currentLang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const restoredScroll = useRef(false);

  const initialFilters = useMemo(
    () => getInitialFilters(new URLSearchParams(searchParams.toString())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialFilters.search);
  const [degree, setDegree] = useState(initialFilters.degree);
  const [year, setYear] = useState(initialFilters.year);

  const saveScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(DIRECTORY_SCROLL_STORAGE_KEY, String(window.scrollY));
  }, []);

  const registeredDegrees = useMemo(() => {
    return getUniqueValues(
      allUsers.map((user) => user.degree || user.department),
    );
  }, [allUsers]);

  const registeredYears = useMemo(() => {
    const uniqueYears = new Set(
      allUsers
        .map((user) => String(user.graduatedYear || "").trim())
        .filter((y) => Boolean(y) && y !== "undefined" && y !== "null")
    );
    // Sort strings descending alphabetically
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [allUsers]);

  // Fetch all data once on mount
  useEffect(() => {
    async function loadAllUsers() {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!res.ok) return;

        const data = await res.json();
        setAllUsers(filterNonAdmins(data));
      } catch (error) {
        console.error("Load all users failed:", error);
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    }

    loadAllUsers();
  }, []);

  // CLIENT-SIDE FILTERING (Fast & avoids API casting errors)
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      // Search matching
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);

      // Degree matching
      const userDegree = String(user.degree || user.department || "").trim();
      const matchDegree = degree === "" || userDegree === degree;

      // Year matching (Safe string comparison)
      const userYear = String(user.graduatedYear || "").trim();
      const matchYear = year === "" || userYear === year;

      return matchSearch && matchDegree && matchYear;
    });
  }, [allUsers, search, degree, year]);

  // Sync state to URL and SessionStorage
  useEffect(() => {
    const filters: SavedFilters = { search, degree, year };
    sessionStorage.setItem(
      DIRECTORY_FILTER_STORAGE_KEY,
      JSON.stringify(filters),
    );

    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (degree) params.set("degree", degree);
    if (year) params.set("year", year);

    router.replace(params.toString() ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
  }, [search, degree, year, pathname, router]);

  // Restore scroll position
  useEffect(() => {
    window.addEventListener("beforeunload", saveScrollPosition);
    return () => {
      saveScrollPosition();
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, [saveScrollPosition]);

  useEffect(() => {
    if (loading || restoredScroll.current) return;
    const savedScrollY = sessionStorage.getItem(DIRECTORY_SCROLL_STORAGE_KEY);
    if (!savedScrollY) return;

    restoredScroll.current = true;
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: Number(savedScrollY) || 0,
        behavior: "auto",
      });
    });
  }, [loading, filteredUsers.length]);

  function clearFilters() {
    setSearch("");
    setDegree("");
    setYear("");
    sessionStorage.removeItem(DIRECTORY_FILTER_STORAGE_KEY);
    sessionStorage.removeItem(DIRECTORY_SCROLL_STORAGE_KEY);
    router.replace(pathname, { scroll: false });
  }

  return (
    <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
      <BackgroundDecor />
      <section className="ucsh-container relative z-10">
        <div className="ucsh-card ucsh-animate mb-4 rounded-2xl p-3 sm:mb-5 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_auto]">
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="ucsh-input w-full rounded-xl px-3 py-2 text-xs font-bold sm:text-sm"
            />
            <select
              value={degree}
              onChange={(event) => setDegree(event.target.value)}
              className="ucsh-input w-full rounded-xl px-3 py-2 text-xs font-bold sm:text-sm"
            >
              <option value="">{t.allDegrees}</option>
              {registeredDegrees.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="ucsh-input w-full rounded-xl px-3 py-2 text-xs font-bold sm:text-sm"
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
              className="ucsh-btn-outline w-full rounded-xl px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 sm:text-sm lg:w-auto"
            >
              {t.clear}
            </button>
          </div>
        </div>
        {loading ? (
          <EmptyState title={t.loading} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState title={t.empty} description={t.emptyText} />
        ) : (
          <div className="grid gap-3 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user, index) => (
              <DirectoryCard
                key={user._id}
                user={user}
                index={index}
                t={t}
                onViewProfile={saveScrollPosition}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
          <BackgroundDecor />
          <section className="ucsh-container relative z-10">
            <EmptyState title="Loading alumni directory..." />
          </section>
        </main>
      }
    >
      <DirectoryContent />
    </Suspense>
  );
}

function DirectoryCard({
  user,
  index,
  t,
  onViewProfile,
}: {
  user: User;
  index: number;
  t: (typeof text)["en"];
  onViewProfile: () => void;
}) {
  const email = user.contactInfo?.email || user.email || "";
  const phone = user.contactInfo?.phone || "";
  const image = getUserImage(user);
  const userDegree = user.degree || user.department || "";

  return (
    <article
      className="ucsh-card ucsh-animate group overflow-hidden rounded-2xl p-4 text-center"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <div className="flex flex-col items-center">
        <Image
          src={image}
          alt={user.name || "Alumni"}
          width={78}
          height={78}
          className="h-[78px] w-[78px] rounded-full object-cover shadow-md ring-4 ring-white dark:ring-slate-900"
        />
        <h2 className="mt-3 line-clamp-1 text-base font-black text-[var(--ucsh-text)]">
          {user.name || "Alumni"}
        </h2>
        <p className="mt-1 line-clamp-1 max-w-full text-[11px] font-bold text-[var(--ucsh-muted)]">
          {user.email}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {userDegree && <Tag>{userDegree}</Tag>}
          {user.graduatedYear && (
            <Tag>
               {user.graduatedYear}
            </Tag>
          )}
        </div>
      </div>
      <SocialIcons links={user.socialLinks} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <IconAction
          href={phone ? `tel:${phone}` : ""}
          icon={<FaPhone />}
          label={t.call}
          text={t.call}
        />
        <IconAction
          href={email ? `mailto:${email}` : ""}
          icon={<FaEnvelope />}
          label={t.email}
          text={t.email}
        />
      </div>
      <Link
        href={`/profile/${user._id}`}
        onClick={onViewProfile}
        className="ucsh-btn mt-3 w-full rounded-xl px-3 py-2 text-xs"
      >
        {t.viewProfile}
      </Link>
    </article>
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
    <span className="max-w-full rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-black text-[var(--ucsh-primary-dark)] ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:ring-cyan-900">
      <span className="break-words">{children}</span>
    </span>
  );
}

function IconAction({
  href,
  icon,
  label,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  const className =
    "flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--ucsh-border)] px-3 text-xs font-black shadow-sm transition";

  if (!href) {
    return (
      <div
        aria-label={label}
        className={`${className} bg-slate-100 text-slate-400 dark:bg-slate-800`}
      >
        {icon}
        <span>{text}</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      aria-label={label}
      className={`${className} bg-white/70 text-[var(--ucsh-primary-dark)] hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-950/70`}
    >
      {icon}
      <span>{text}</span>
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
    <div className="mt-3 grid grid-cols-4 gap-2">
      {items.map((item) => {
        if (!item.href) {
          return (
            <span
              key={item.label}
              aria-label={item.label}
              title={item.label}
              className="flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-300 dark:border-slate-800 dark:bg-slate-900"
            >
              {item.icon}
            </span>
          );
        }

        return (
          <a
            key={item.label}
            href={socialUrl(item.type, item.href)}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            title={item.label}
            className="flex h-9 items-center justify-center rounded-xl border border-[var(--ucsh-border)] bg-white/70 text-xs text-[var(--ucsh-primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-950/70"
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
    <div className="ucsh-card ucsh-animate rounded-2xl p-6 text-center sm:p-8">
      <h2 className="text-lg font-black text-[var(--ucsh-text)] sm:text-xl">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs font-bold text-[var(--ucsh-muted)] sm:text-sm">
          {description}
        </p>
      )}
    </div>
  );
}

function getUniqueValues(values: Array<string | undefined>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function cleanUsername(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^facebook\.com\//i, "")
    .replace(/^linkedin\.com\/in\//i, "")
    .replace(/^tiktok\.com\/@?/i, "")
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