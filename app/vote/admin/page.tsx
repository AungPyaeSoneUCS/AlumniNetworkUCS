// file: app/vote/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type Project = {
  _id: string;
  title: string;
  voteCount: number;
  teamId: { name: string };
};

// --- Translations Dictionary ---
const translations = {
  my: {
    portalName: "အက်ဒမင်",
    logoutBtn: "ထွက်မည်",
    navResult: "မဲရလဒ်များ",
    navCreate: "အကောင့် ဖန်တီးရန်",
    navVoterList: "မဲပေးသူ စာရင်း",
    navTeamList: "အဖွဲ့ စာရင်း",
    navTime: "မဲပေးချိန် သတ်မှတ်ရန်",
    navProfile: "ပရိုဖိုင်",
    title: "မဲရလဒ်များ (တိုက်ရိုက်)",
    subtitle: "လက်ရှိ မဲရလဒ်များကို အများဆုံးမှ အနည်းဆုံးသို့ အလိုအလျောက် စဉ်ပြထားပါသည်။",
    rank: "အဆင့်",
    project: "ပရောဂျက် အမည်",
    team: "အဖွဲ့ အမည်",
    votes: "ရရှိသော မဲ",
    totalVotes: "စုစုပေါင်း ပေးထားသော မဲ",
    noProjects: "ယခုလောလောဆယ် ပြသရန် ပရောဂျက် မရှိသေးပါ။",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
  },
  en: {
    portalName: "Admin",
    logoutBtn: "Log Out",
    navResult: "Voting Results",
    navCreate: "Create Accounts",
    navVoterList: "Voter Lists",
    navTeamList: "Team Lists",
    navTime: "Set Voting Times",
    navProfile: "Profile",
    title: "Live Voting Results",
    subtitle: "Real-time voting results automatically sorted from highest to lowest.",
    rank: "Rank",
    project: "Project Title",
    team: "Team Name",
    votes: "Votes Cast",
    totalVotes: "Total System Votes",
    noProjects: "No projects have been submitted yet.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
  }
};

export default function AdminResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // --- States ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // Fetch and sort projects (with live polling)
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const fetchProjects = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const res = await fetch("/api/vote/projects");
        const data = await res.json();
        if (res.ok) {
          const sorted = data.sort((a: Project, b: Project) => b.voteCount - a.voteCount);
          setProjects(sorted);
        }
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };
    
    fetchProjects(true);

    const intervalId = setInterval(() => {
      fetchProjects(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [status]);

  // --- Dynamic Navbar Links ---
  const navLinks = [
    { href: "/vote/admin", label: t.navResult },
    { href: "/vote/admin/create", label: t.navCreate },
    { href: "/vote/admin/voters", label: t.navVoterList },
    { href: "/vote/admin/teams", label: t.navTeamList },
    { href: "/vote/admin/settings", label: t.navTime },
    { href: "/vote/admin/profile", label: t.navProfile },
  ];

  // --- 1. Loading State ---
  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- 2. Auth Protection ---
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN" || !user?.isVoteSystem) {
    return (
      <div className={`${isDark ? "dark" : ""}`}>
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-700">
            <h1 className="text-2xl font-bold text-white mb-2">{t.accessRestricted}</h1>
            <p className="text-gray-400 mb-8">{t.loginRequired}</p>
            <Link href="/vote/admin/login" className="w-full block py-3 px-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors">
              {t.goLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? "dark" : ""} h-screen flex flex-col overflow-hidden`}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        
        {/* --- Unified Single-Line Navigation Bar --- */}
        <nav className="flex-none bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-[95rem] mx-auto px-4 h-16 flex items-center justify-between gap-4">
            
            {/* Left: Admin Identity */}
            <div className="flex items-center gap-2.5 whitespace-nowrap flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-lg">A</span>
              </div>
              <span className="font-bold text-base tracking-tight hidden md:inline">
                {t.portalName} <span className="text-blue-500 dark:text-blue-400 font-medium">({user.name})</span>
              </span>
            </div>

            {/* Middle: Centered Navigation Links */}
            <div className="hidden lg:flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-bold transition-colors pb-0.5 whitespace-nowrap ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Right: Language, Theme Toggle & Logout Button */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => setLang(lang === "my" ? "en" : "my")} 
                className="flex items-center justify-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {lang === "my" ? "EN" : "မြန်မာ"}
              </button>
              
              <button 
                onClick={() => setIsDark(!isDark)} 
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isDark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
              </button>

              <button 
                onClick={() => signOut({ callbackUrl: "/vote" })} 
                className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                {t.logoutBtn}
              </button>
            </div>

          </div>
        </nav>

        {/* Mobile Navbar Links (Visible on smaller screens below top bar) */}
        <div className="flex lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 overflow-x-auto no-scrollbar gap-4 flex-shrink-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-bold whitespace-nowrap pb-1 border-b-2 ${
                  isActive ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* --- Main Scrollable Content (VOTING RESULTS) --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{t.title}</h1>
                  <span className="flex h-3 w-3 relative mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{t.subtitle}</p>
              </div>

              {!isLoading && projects.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center px-8 transition-colors">
                  <div className="text-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-1">
                      {t.totalVotes}
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                      {projects.reduce((acc, curr) => acc + curr.voteCount, 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm transition-colors">
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t.noProjects}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 transition-colors">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.rank}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.project}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.team}</th>
                        <th className="px-6 py-5 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.votes}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {projects.map((proj, idx) => (
                        <tr key={proj._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap">
                            {idx === 0 ? (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 font-black text-xl border-2 border-yellow-300 dark:border-yellow-600 shadow-sm">1</span>
                            ) : idx === 1 ? (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-black text-xl border-2 border-gray-300 dark:border-gray-500 shadow-sm">2</span>
                            ) : idx === 2 ? (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-500 font-black text-xl border-2 border-amber-300 dark:border-amber-700 shadow-sm">3</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 font-bold text-lg">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-bold text-gray-900 dark:text-white text-lg">{proj.title}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 inline-block px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                              {proj.teamId?.name || "Unknown Team"}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-black text-2xl border border-blue-200 dark:border-blue-800 transition-colors">
                              {proj.voteCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}