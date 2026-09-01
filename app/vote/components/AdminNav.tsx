"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// Translations specific to the Navbar
const navTranslations = {
  my: {
    portalName: "အက်ဒမင်",
    logoutBtn: "ထွက်မည်",
    navResult: "မဲရလဒ်များ",
    navCreate: "အကောင့် စီမံခန့်ခွဲရန်",
    navVoterList: "မဲပေးသူ စာရင်း",
    navTeamList: "အဖွဲ့ စာရင်း",
    navGuest: "ဧည့်သည် မဲပေးရန်", // Added Guest Translation
    navTime: "မဲပေးချိန် သတ်မှတ်ရန်",
    navProfile: "ပရိုဖိုင်",
  },
  en: {
    portalName: "Admin",
    logoutBtn: "Log Out",
    navResult: "Voting Results",
    navCreate: "Account Management",
    navVoterList: "Voter Lists",
    navTeamList: "Team Lists",
    navGuest: "Guest Voting", // Added Guest Translation
    navTime: "Set Voting Times",
    navProfile: "Profile",
  },
};

type AdminNavProps = {
  lang: "my" | "en";
  setLang: (lang: "my" | "en") => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  user: { name?: string; [key: string]: any };
};

export default function AdminNav({ lang, setLang, isDark, setIsDark, user }: AdminNavProps) {
  const pathname = usePathname();
  const t = navTranslations[lang];

  // Added the new Guest route to the navigation links
  const navLinks = [
    { href: "/vote/admin", label: t.navResult },
    { href: "/vote/admin/create", label: t.navCreate },
    { href: "/vote/admin/voters", label: t.navVoterList },
    { href: "/vote/admin/teams", label: t.navTeamList },
    { href: "/vote/admin/guest", label: t.navGuest },
    { href: "/vote/admin/settings", label: t.navTime },
    { href: "/vote/admin/profile", label: t.navProfile },
  ];

  return (
    <>
      {/* --- Unified Single-Line Navigation Bar (Desktop) --- */}
      <nav className="flex-none bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800 shadow-md shadow-gray-200/50 dark:shadow-black/40 print:hidden transition-all duration-300 relative">
        <div className="max-w-[95rem] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Admin Identity */}
          <div className="flex items-center gap-3 whitespace-nowrap flex-shrink-0 group cursor-pointer">
            {/* Logo with gradient and colored drop shadow */}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-extrabold text-lg drop-shadow-md">A</span>
            </div>
            <span className="font-bold text-base tracking-tight hidden md:inline text-gray-900 dark:text-gray-100">
              {t.portalName} <span className="text-blue-500 dark:text-blue-400 font-medium">({user.name})</span>
            </span>
          </div>

          {/* Middle: Centered Navigation Links */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700/50 shadow-inner dark:shadow-black/20">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-bold transition-all duration-200 px-4 py-1.5 rounded-full whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Language, Theme Toggle & Logout Button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Language Toggle with hover shadow */}
            <button
              onClick={() => setLang(lang === "my" ? "en" : "my")}
              className="flex items-center justify-center px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs font-bold shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {lang === "my" ? "EN" : "မြန်မာ"}
            </button>

            {/* Theme Toggle with hover shadow */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isDark ? (
                <svg className="w-4 h-4 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              )}
            </button>

            {/* Logout Button with colored hover shadow */}
            <button
              onClick={() => signOut({ callbackUrl: "/vote" })}
              className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:shadow-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>
      </nav>

      {/* --- Mobile Navbar Links (Hidden on Print & Desktop) --- */}
      {/* Added shadow to the mobile nav bar so it stacks nicely above page content */}
      <div className="flex lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 overflow-x-auto no-scrollbar gap-5 flex-shrink-0 print:hidden transition-colors duration-300 shadow-md shadow-gray-200/40 dark:shadow-black/40 relative z-40">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-bold whitespace-nowrap pb-1.5 transition-all duration-200 ${
                isActive 
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 drop-shadow-[0_1px_1px_rgba(37,99,235,0.2)]" 
                  : "border-b-2 border-transparent text-gray-500 dark:text-gray-400"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}