// file: app/vote/admin/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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
    profileTitle: "အက်ဒမင် ပရိုဖိုင်",
    profileDesc: "သင်၏ ကိုယ်ရေးအချက်အလက်များကို ကြည့်ရှု ပြင်ဆင်နိုင်သည်။",
    nameLabel: "အမည်",
    emailLabel: "အီးမေးလ် လိပ်စာ",
    pwdLabel: "စကားဝှက် အသစ်",
    editProfileBtn: "ပရိုဖိုင် ပြင်ဆင်မည်",
    cancelBtn: "ပယ်ဖျက်မည်",
    saveBtn: "သိမ်းဆည်းမည်",
    savingBtn: "သိမ်းဆည်းနေပါသည်...",
    leaveBlankPwd: "စကားဝှက် မပြောင်းလိုပါက အလွတ်ထားပါ။",
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
    profileTitle: "Admin Profile",
    profileDesc: "View and update your personal administrator information.",
    nameLabel: "Full Name",
    emailLabel: "Email Address",
    pwdLabel: "New Password",
    editProfileBtn: "Edit Profile",
    cancelBtn: "Cancel",
    saveBtn: "Save Changes",
    savingBtn: "Saving...",
    leaveBlankPwd: "Leave blank to keep current password.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
  }
};

export default function AdminProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // --- States ---
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // --- Profile Edit State ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profName, setProfName] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [profPassword, setProfPassword] = useState("");
  const [isUpdatingProf, setIsUpdatingProf] = useState(false);
  const [profMsg, setProfMsg] = useState({ type: "", text: "" });

  // Pre-fill profile form when session loads
  useEffect(() => {
    if (session?.user) {
      setProfName(session.user.name || "");
      setProfEmail(session.user.email || "");
    }
  }, [session]);

  // --- Form Handler ---
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProf(true);
    setProfMsg({ type: "", text: "" });

    try {
      const payload: any = { 
        id: (session?.user as any).id, 
        name: profName, 
        email: profEmail 
      };
      
      if (profPassword) {
        payload.password = profPassword;
      }

      const res = await fetch("/api/vote/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");

      setProfMsg({ type: "success", text: "Profile updated successfully." });
      setIsEditingProfile(false);
      setProfPassword(""); 
      
      await update({ name: profName, email: profEmail });
    } catch (error: any) {
      setProfMsg({ type: "error", text: error.message });
    } finally {
      setIsUpdatingProf(false);
    }
  };

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

        {/* Mobile Navbar Links */}
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

        {/* --- Main Scrollable Content (ADMIN PROFILE) --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{t.profileTitle}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium">{t.profileDesc}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              
              {/* Profile Header Block */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-8 flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl font-bold backdrop-blur-sm border border-white/30 shadow-inner">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-black">{user.name}</h2>
                  <p className="text-blue-100 font-medium">{user.email}</p>
                  <span className="mt-3 inline-block bg-white/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                    System Admin
                  </span>
                </div>
              </div>

              <div className="p-8">
                {profMsg.text && (
                  <div className={`p-4 mb-6 rounded-xl text-sm font-bold text-center border ${
                    profMsg.type === "success" 
                      ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" 
                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
                  }`}>
                    {profMsg.text}
                  </div>
                )}

                {/* View Mode */}
                {!isEditingProfile ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t.nameLabel}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t.emailLabel}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                      <button 
                        onClick={() => setIsEditingProfile(true)} 
                        className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
                      >
                        {t.editProfileBtn}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode Form */
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.nameLabel}</label>
                      <input 
                        type="text" 
                        required 
                        value={profName} 
                        onChange={(e) => setProfName(e.target.value)} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.emailLabel}</label>
                      <input 
                        type="email" 
                        required 
                        value={profEmail} 
                        onChange={(e) => setProfEmail(e.target.value)} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.pwdLabel}</label>
                      <input 
                        type="password" 
                        minLength={6} 
                        value={profPassword} 
                        onChange={(e) => setProfPassword(e.target.value)} 
                        placeholder={t.leaveBlankPwd} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" 
                      />
                    </div>
                    
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                      <button 
                        type="button" 
                        onClick={() => { 
                          setIsEditingProfile(false); 
                          setProfPassword(""); 
                        }} 
                        className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {t.cancelBtn}
                      </button>
                      <button 
                        type="submit" 
                        disabled={isUpdatingProf} 
                        className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:bg-blue-400 transition-colors transform hover:-translate-y-0.5 disabled:transform-none"
                      >
                        {isUpdatingProf ? t.savingBtn : t.saveBtn}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}