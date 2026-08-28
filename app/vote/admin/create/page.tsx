// file: app/vote/admin/create/page.tsx
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
    createTitle: "အကောင့် ဖန်တီးခြင်း",
    whatAdminCanDo: "အက်ဒမင် ဘာလုပ်နိုင်သလဲ? ",
    formDesc: "မဲပေးစနစ်တွင် ပါဝင်မည့်သူအသစ်ကို မှတ်ပုံတင်ရန် အောက်ပါအချက်အလက်များကို ဖြည့်စွက်ပါ။",
    nameLabel: "အမည် သို့မဟုတ် အဖွဲ့အမည်",
    emailLabel: "အီးမေးလ် လိပ်စာ",
    pwdLabel: "ယာယီ စကားဝှက်",
    roleLabel: "ရာထူး သတ်မှတ်ရန်",
    roleVoter: "မဲပေးသူ (Voter) - မဲတစ်မဲ ပေးနိုင်သည်",
    roleTeam: "ပရောဂျက်အဖွဲ့ (Team) - ပရောဂျက် တင်သွင်းနိုင်သည်",
    createBtn: "အကောင့် ဖန်တီးမည်",
    creatingBtn: "ဖန်တီးနေပါသည်...",
    emailError: "အီးမေးလ်သည် @gmail.com သို့မဟုတ် @ucsh.edu.mm ဖြင့်သာ ပြီးဆုံးရမည်။",
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
    createTitle: "Account Creation",
    whatAdminCanDo: "What can Admin do? ",
    formDesc: "Fill out the details below to securely register a new participant.",
    nameLabel: "Full Name or Team Name",
    emailLabel: "Email Address",
    pwdLabel: "Temporary Password",
    roleLabel: "Assign Role",
    roleVoter: "Voter - Can cast one vote",
    roleTeam: "Project Team - Can submit a project",
    createBtn: "Register Account",
    creatingBtn: "Creating...",
    emailError: "Email must end with @gmail.com or @ucsh.edu.mm only.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
  }
};

export default function AdminCreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // --- States ---
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // --- Create Form State ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VOTER");
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState({ type: "", text: "" });
  const [emailValidationWarning, setEmailValidationWarning] = useState("");

  // Live Email Validation as Admin is Typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);

    if (val.trim() === "") {
      setEmailValidationWarning("");
      return;
    }

    const cleanEmail = val.trim().toLowerCase();
    const isValid = cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@ucsh.edu.mm");

    if (!isValid) {
      setEmailValidationWarning(t.emailError);
    } else {
      setEmailValidationWarning("");
    }
  };

  // --- Typing Effect State ---
  const phrases = [
    "Add new Project Teams.",
    "Register official Voters.",
    "Secure voting integrity.",
    "Manage the System.",
  ];
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const typeSpeed = isDeleting ? 40 : 80;
    const timer = setTimeout(() => {
      const fullText = phrases[phraseIndex];
      if (!isDeleting && currentPhrase === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && currentPhrase === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        setCurrentPhrase(fullText.substring(0, currentPhrase.length + (isDeleting ? -1 : 1)));
      }
    }, typeSpeed);
    return () => clearTimeout(timer);
  }, [currentPhrase, isDeleting, phraseIndex, status]);

  // --- Form Handler ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg({ type: "", text: "" });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@ucsh.edu.mm")) {
      setCreateMsg({ type: "error", text: t.emailError });
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/vote/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: cleanEmail, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setCreateMsg({ type: "success", text: data.message });
      setName(""); setEmail(""); setPassword(""); setRole("VOTER");
      setEmailValidationWarning("");
    } catch (error: any) {
      setCreateMsg({ type: "error", text: error.message });
    } finally {
      setIsCreating(false);
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

        {/* --- Main Scrollable Content (CREATE ACCOUNT FORM) --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{t.createTitle}</h1>
              <div className="h-8 flex items-center justify-center text-lg text-gray-600 dark:text-gray-400 font-medium">
                <span>{t.whatAdminCanDo}</span>
                <span className="text-blue-600 dark:text-blue-400 ml-1 font-bold">
                  {currentPhrase}
                  <span className="animate-pulse border-r-2 border-blue-600 dark:border-blue-400 ml-1"></span>
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-center font-medium">{t.formDesc}</p>

              {createMsg.text && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-bold text-center border ${
                  createMsg.type === "success" 
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" 
                    : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
                }`}>
                  {createMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Name Input */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.nameLabel}</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" 
                    />
                  </div>

                  {/* Email Input */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.emailLabel}</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={handleEmailChange} 
                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:ring-2 dark:text-white transition-colors ${
                        emailValidationWarning 
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                          : "border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                      }`} 
                      placeholder="user@gmail.com or user@ucsh.edu.mm"
                    />
                    {emailValidationWarning && (
                      <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        {emailValidationWarning}
                      </p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.pwdLabel}</label>
                    <input 
                      type="password" 
                      required 
                      minLength={6} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" 
                    />
                  </div>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.roleLabel}</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors appearance-none"
                  >
                    <option value="VOTER">{t.roleVoter}</option>
                    <option value="TEAM">{t.roleTeam}</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isCreating || Boolean(emailValidationWarning)} 
                    className="w-full py-3.5 px-4 text-white font-bold rounded-xl shadow-md transition-all duration-200 bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.creatingBtn}
                      </span>
                    ) : (
                      t.createBtn
                    )}
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}