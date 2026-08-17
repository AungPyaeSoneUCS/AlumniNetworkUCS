// file: components/nav.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Briefcase,
  Edit,
  Mail,
  Menu,
  MessageCircle,
  Newspaper,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useI18n } from "@/components/providers";
import NotificationBell from "@/components/notification-bell";

const navText = {
  en: {
    brand: "Alumni Network",
    feeds: "Feeds",
    jobs: "Jobs",
    directory: "Directories",
    messages: "Messages",
    contact: "Contact",
    about: "About Alumni Network",
    register: "New Alumni Register",
    login: "Alumni Login",
    logout: "Logout",
    profile: "Profile",
    viewProfile: "View Profile",
    editProfile: "Edit Profile",
    settings: "Settings",
    pleaseWait: "Please wait...",
    notifications: "Notifications",
  },
  mm: {
    brand: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    feeds: "သတင်းများ",
    jobs: "အလုပ်အကိုင်များ",
    directory: "အဖွဲ့ဝင်စာရင်းများ",
    messages: "စာတိုများ",
    contact: "ဆက်သွယ်ရန်",
    about: "ကျောင်းသားဟောင်းများကွန်ရက်အကြောင်း",
    register: "ကျောင်းသားဟောင်းအသစ် မှတ်ပုံတင်မည်",
    login: "ကျောင်းသားဟောင်း အကောင့်ဝင်မည်",
    logout: "ထွက်မည်",
    profile: "ပရိုဖိုင်",
    viewProfile: "ပရိုဖိုင်ကြည့်မည်",
    editProfile: "ပရိုဖိုင်ပြင်မည်",
    settings: "ဆက်တင်",
    pleaseWait: "ခဏစောင့်ပါ...",
    notifications: "အသိပေးချက်များ",
  },
};

type MeUser = {
  _id?: string;
  name?: string;
  image?: string;
};

export default function Nav() {
  const { data } = useSession();
  const { lang, setLang } = useI18n();

  const router = useRouter();
  const pathname = usePathname() || "";

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [me, setMe] = useState<MeUser | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = lang === "mm" ? "mm" : "en";
  const t = navText[currentLang];

  const hideNav = pathname.startsWith("/admin") || pathname.startsWith("/staff");

  const links = [
    { href: "/feeds", label: t.feeds, icon: Newspaper },
    { href: "/jobs", label: t.jobs, icon: Briefcase },
    { href: "/directory", label: t.directory, icon: Users },
    { href: "/messages", label: t.messages, icon: MessageCircle },
    { href: "/contact", label: t.contact, icon: Mail },
  ];

  const profileHref = me?._id ? `/profile/${me._id}` : "/settings";
  const editProfileHref = "/settings";

  useEffect(() => {
    if (!data?.user) {
      setMe(null);
      return;
    }

    let mounted = true;

    async function loadMe() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) return;

        const user = await res.json();
        if (!mounted) return;

        setMe({
          _id: user?._id,
          name: user?.name,
          image: user?.image,
        });
      } catch (error) {
        console.error("Load current user failed:", error);
      }
    }

    loadMe();

    return () => {
      mounted = false;
    };
  }, [data?.user]);

  // Close menus when route changes
  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function toggleLang() {
    await setLang(currentLang === "en" ? "mm" : "en");
    router.refresh();
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout-mail", {
        method: "POST",
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout mail failed:", error);
    } finally {
      await signOut({ redirect: false });
      window.location.href = "/login";
    }
  }

  if (hideNav) return null;

  const iconBtnClass =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#25C9C8]/30 bg-white/85 px-2 text-[#008B8B] shadow-sm transition hover:-translate-y-0.5 hover:bg-white active:scale-95";

  const textBtnClass =
    "inline-flex h-9 items-center justify-center rounded-lg border border-[#25C9C8]/30 bg-white/85 px-3 text-xs font-black text-[#008B8B] shadow-sm transition hover:-translate-y-0.5 hover:bg-white active:scale-95";

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 px-0 py-0 sm:px-0">
        <div className="mx-auto max-w-7xl rounded-b-2xl border-x border-b border-white/60 bg-[#94EFEE]/95 px-4 py-2 shadow-md backdrop-blur-2xl sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={data?.user ? "/feeds" : "/"}
              className="flex min-w-0 items-center gap-2"
            >
              {/* --- LOGO STYLING --- */}
              {/* 1. SIZE: Change 'h-10 w-10' to adjust the logo size (e.g., h-9 w-9 or h-12 w-12) */}
              {/* 2. SHAPE: 'rounded-[10px]' or 'rounded-xl' matches the rounded square of the app icon to avoid white circular gaps */}
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-transparent shadow-sm">
                <Image
                  src="/logo/logo-250.png"
                  alt={t.brand}
                  fill
                  sizes="40px"
                  // 3. ZOOM/CROP: 'object-cover' and 'scale-110' slightly zoom the image to completely cut off the outer white corners from the original file
                  className="object-cover scale-110"
                  priority
                />
              </span>

              <span className="hidden max-w-[170px] truncate text-sm font-black text-[#008B8B] sm:inline md:max-w-[210px]">
                {t.brand}
              </span>
            </Link>

            {data?.user && (
              <div className="hidden items-center gap-1 rounded-xl border border-white/60 bg-white/65 p-0.5 shadow-sm backdrop-blur-xl lg:flex">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition xl:px-3 ${
                        active
                          ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-sm"
                          : "text-slate-700 hover:bg-[#94EFEE]/70 hover:text-[#008B8B]"
                      }`}
                    >
                      <Icon size={14} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="flex shrink-0 items-center gap-1.5">
              {data?.user && me?._id && (
                <div className="flex h-9 min-w-9 items-center justify-center">
                  <NotificationBell userId={me._id} />
                </div>
              )}

              {data?.user && !me?._id && (
                <button
                  type="button"
                  title={t.notifications}
                  aria-label={t.notifications}
                  className={iconBtnClass}
                >
                  <Bell size={17} />
                </button>
              )}

              
              <button
                type="button"
                onClick={toggleLang}
                className={textBtnClass}
              >
                {currentLang === "en" ? "မြန်မာ" : "EN"}
              </button>
              {/* Show About Network button before language switch (Only when Logged Out) */}
              {!data?.user && (
                <Link
                  href="/about"
                  className={`hidden md:inline-flex ${textBtnClass}`}
                >
                  {t.about}
                </Link>
              )}


              {/* Profile Dropdown Container */}
              {data?.user && (
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    title={t.profile}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-[#008B8B] shadow-sm transition hover:scale-105 active:scale-95"
                  >
                    {me?.image || data.user.image ? (
                      <Image
                        src={me?.image || data.user.image || "/avatar.png"}
                        alt={me?.name || data.user.name || t.profile}
                        width={36}
                        height={36}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle size={23} />
                    )}
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/60 bg-white/95 p-1.5 shadow-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                      <div className="space-y-1">
                        <Link
                          href={profileHref}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-[#94EFEE]/70 hover:text-[#008B8B]"
                        >
                          <UserCircle size={16} />
                          {t.viewProfile}
                        </Link>

                        <Link
                          href={editProfileHref}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-[#94EFEE]/70 hover:text-[#008B8B]"
                        >
                          <Edit size={16} />
                          {t.editProfile}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {data?.user ? (
                <>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="hidden h-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
                  >
                    {loggingOut ? t.pleaseWait : t.logout}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className={iconBtnClass + " lg:hidden"}
                    aria-label="Open menu"
                  >
                    {open ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className={`hidden sm:inline-flex ${textBtnClass}`}
                  >
                    {t.register}
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {t.login}
                  </Link>
                </>
              )}
            </div>
          </div>

          {open && data?.user && (
            <div className="mt-2 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-lg backdrop-blur-xl lg:hidden">
              <div className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-black transition ${
                        active
                          ? "bg-[#94EFEE]/70 text-[#008B8B]"
                          : "text-slate-700 hover:bg-[#94EFEE]/70 hover:text-[#008B8B]"
                      }`}
                    >
                      <Icon size={18} />
                      {link.label}
                    </Link>
                  );
                })}

                <Link
                  href={profileHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-[#94EFEE]/70 hover:text-[#008B8B]"
                >
                  <UserCircle size={18} />
                  {t.viewProfile}
                </Link>

                <Link
                  href={editProfileHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-[#94EFEE]/70 hover:text-[#008B8B]"
                >
                  <Edit size={18} />
                  {t.editProfile}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-2 flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? t.pleaseWait : t.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="h-[58px] sm:h-[60px]" />
    </>
  );
}