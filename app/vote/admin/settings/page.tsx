"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/app/vote/components/AdminNav"; // Adjust path if needed

// --- Translations Dictionary (Page Content Only) ---
const translations = {
  my: {
    title: "မဲပေးချိန် သတ်မှတ်ချက်များ",
    subtitle: "မဲပေးခွင့်ပြုမည့် အချိန်များကို တိကျစွာ သတ်မှတ်ထိန်းချုပ်ပါ။",
    statusOpen: "မဲပေးခြင်း ဖွင့်ထားပါသည်",
    statusClosed: "မဲပေးခြင်း ပိတ်ထားပါသည်",
    startLabel: "စတင်မည့် အချိန် (Start Time)",
    endLabel: "ပြီးဆုံးမည့် အချိန် (End Time)",
    saveBtn: "အချိန်ပြောင်းလဲမှုကို သိမ်းဆည်းမည်",
    savingBtn: "သိမ်းဆည်းနေပါသည်...",
    successMsg: "မဲပေးချိန်ကို အောင်မြင်စွာ သတ်မှတ်ပြီးပါပြီ။",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
  },
  en: {
    title: "Voting Schedule Settings",
    subtitle: "Configure the exact date and time when voters are allowed to cast their votes.",
    statusOpen: "Voting is Currently OPEN",
    statusClosed: "Voting is Currently CLOSED",
    startLabel: "Voting Start Time",
    endLabel: "Voting End Time",
    saveBtn: "Save Schedule",
    savingBtn: "Saving...",
    successMsg: "Voting schedule updated successfully.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
  }
};

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- UI Settings ---
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // --- Schedule State ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Determine if voting is currently active based on local time
  const [isVotingOpen, setIsVotingOpen] = useState(false);

  // Fetch current settings on load
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/vote/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.startDate) setStartDate(data.startDate);
          if (data.endDate) setEndDate(data.endDate);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [status]);

  // Live status checker
  useEffect(() => {
    if (!startDate || !endDate) {
      setIsVotingOpen(false);
      return;
    }

    const checkStatus = () => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      setIsVotingOpen(now >= start && now <= end);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/vote/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings.");
      }

      setMessage({ type: "success", text: t.successMsg });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Endpoint not configured yet. (Requires API)" });
    } finally {
      setIsSaving(false);
    }
  };

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
        
        {/* Render Reusable Admin Navbar */}
        <AdminNav 
          lang={lang} 
          setLang={setLang} 
          isDark={isDark} 
          setIsDark={setIsDark} 
          user={user} 
        />

        {/* --- Main Area (Centered Vertically and Horizontally) --- */}
        <main className="flex-1 p-4 flex flex-col items-center justify-center overflow-y-auto">
          <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-300">
            
            {/* Live Status Banner */}
            {!isLoading && (
              <div className={`mb-5 p-4 rounded-2xl shadow-sm border transition-all duration-300 flex items-center justify-center gap-3 ${
                isVotingOpen 
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400" 
                  : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
              }`}>
                {isVotingOpen ? (
                  <>
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">{t.statusOpen}</h2>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 opacity-80" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"></path></svg>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">{t.statusClosed}</h2>
                  </>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 transition-colors duration-300">
              
              {message.text && (
                <div className={`p-3 mb-5 rounded-lg text-sm font-bold text-center border ${
                  message.type === "success" 
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" 
                    : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
                }`}>
                  {message.text}
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  
                  {/* Start Date */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      {t.startLabel}
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-colors"
                    />
                  </div>

                  {/* End Date */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      {t.endLabel}
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-colors"
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      className={`w-full flex justify-center py-3 px-4 text-white font-bold rounded-xl shadow-md transition-all duration-200 text-sm ${
                        isSaving
                          ? "bg-blue-400 dark:bg-blue-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5"
                      }`}
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t.savingBtn}
                        </span>
                      ) : (
                        t.saveBtn
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}