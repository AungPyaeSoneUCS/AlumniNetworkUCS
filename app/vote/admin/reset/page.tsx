"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/app/vote/components/AdminNav"; // Adjust path if needed

// --- Translations Dictionary (Page Content Only) ---
const translations = {
  my: {
    title: "စနစ်တစ်ခုလုံးကို ပြန်လည်စတင်ရန် (System Reset)",
    subtitle: "သတိပြုရန် - ဤနေရာရှိ လုပ်ဆောင်ချက်များကို နောက်ပိုင်းတွင် ပြန်လည်ပြင်ဆင်၍ မရနိုင်ပါ။",
    dangerZone: "အန္တရာယ်ရှိသော ဇုန် (Danger Zone)",
    
    resetVotesTitle: "မဲရလဒ်များကိုသာ ဖျက်မည် (Reset Votes Only)",
    resetVotesDesc: "ပရောဂျက်များ၊ အဖွဲ့များနှင့် မဲပေးသူများ၏ အကောင့်များကို ဆက်လက်ထားရှိမည်။ သို့သော် ပရောဂျက်များ၏ မဲအရေအတွက် အားလုံးကို '၀' သို့ ပြောင်းလဲမည်ဖြစ်ပြီး မဲပေးသူများ အားလုံးကို အစကနေ ပြန်လည်မဲပေးခွင့်ပြုမည်။",
    resetVotesBtn: "မဲရလဒ်များကို ဖျက်မည်",
    
    factoryResetTitle: "စနစ်တစ်ခုလုံးကို ဖျက်သိမ်းမည် (Full Factory Reset)",
    factoryResetDesc: "အက်ဒမင် (Admin) အကောင့်များမှလွဲ၍ ကျန်ရှိသော ပရောဂျက်များ၊ အဖွဲ့များ (Teams)၊ မဲပေးသူများ (Voters) နှင့် ဧည့်သည်အကောင့်များ (Guests) အားလုံးကို အပြီးတိုင် ဖျက်ပစ်မည်။",
    factoryResetBtn: "အချက်အလက်အားလုံးကို ဖျက်မည်",

    modalTitle: "အတည်ပြုရန် လိုအပ်ပါသည်",
    modalWarning: "ဤလုပ်ဆောင်ချက်ကို ပြင်ဆင်၍မရပါ။ အတည်ပြုရန် အောက်ပါအကွက်တွင် ",
    modalTypeWord: "RESET",
    modalInstruction: " ဟု ရိုက်ထည့်ပါ။",
    placeholder: "RESET ဟု ရိုက်ထည့်ပါ",
    cancelBtn: "ပယ်ဖျက်မည်",
    confirmBtn: "အတည်ပြုပြီး ဖျက်မည်",
    processingBtn: "လုပ်ဆောင်နေပါသည်...",
    
    successMsg: "စနစ်ကို အောင်မြင်စွာ Reset ချလိုက်ပါပြီ။",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
  },
  en: {
    title: "System Reset & Wipe",
    subtitle: "WARNING: Actions taken here are permanent and cannot be undone.",
    dangerZone: "Danger Zone",
    
    resetVotesTitle: "Reset Votes Only",
    resetVotesDesc: "Keeps all Projects, Teams, and Voters intact. However, it will reset all project vote counts to '0' and allow all voters to vote again.",
    resetVotesBtn: "Reset All Votes",
    
    factoryResetTitle: "Full Factory Reset",
    factoryResetDesc: "Deletes EVERYTHING. All Projects, Teams, Voters, and Guest accounts will be permanently erased. Only Admin accounts will remain.",
    factoryResetBtn: "Wipe All Data",

    modalTitle: "Confirmation Required",
    modalWarning: "This action cannot be undone. To confirm, please type ",
    modalTypeWord: "RESET",
    modalInstruction: " in the box below.",
    placeholder: "Type RESET here",
    cancelBtn: "Cancel",
    confirmBtn: "Confirm & Execute",
    processingBtn: "Processing...",
    
    successMsg: "The system has been successfully reset.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
  }
};

export default function AdminResetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- States ---
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetMode, setResetMode] = useState<"votes" | "factory" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleOpenModal = (mode: "votes" | "factory") => {
    setResetMode(mode);
    setConfirmText("");
    setMessage({ type: "", text: "" });
    setIsModalOpen(true);
  };

  const executeReset = async () => {
    if (confirmText !== "RESET" || !resetMode) return;
    
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/vote/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: resetMode }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to reset system.");

      setMessage({ type: "success", text: t.successMsg });
      setIsModalOpen(false);
      setResetMode(null);
      setConfirmText("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 1. Loading State ---
  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
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

        {/* --- Main Area --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
          
          <div className="w-full max-w-3xl mx-auto mt-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-8">

              <p className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 inline-block px-4 py-1.5 rounded-full border border-red-200 dark:border-red-500/20 shadow-sm">
                {t.subtitle}
              </p>
            </div>

            {message.text && (
              <div className={`p-4 mb-8 rounded-xl text-sm font-bold text-center border shadow-sm ${
                message.type === "success" 
                  ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" 
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
              }`}>
                {message.text}
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-red-100 dark:border-red-900/30 overflow-hidden transition-colors duration-300">
              
              {/* Danger Zone Header */}
              <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center gap-3 text-white">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <h2 className="text-lg font-black tracking-wider uppercase">{t.dangerZone}</h2>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                
                {/* Option 1: Reset Votes Only */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.resetVotesTitle}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.resetVotesDesc}</p>
                  </div>
                  <button 
                    onClick={() => handleOpenModal("votes")}
                    className="flex-shrink-0 w-full sm:w-auto px-6 py-3 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 font-bold text-sm rounded-xl border border-yellow-300 dark:border-yellow-700 transition-colors shadow-sm"
                  >
                    {t.resetVotesBtn}
                  </button>
                </div>

                {/* Option 2: Factory Reset */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t.factoryResetTitle}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.factoryResetDesc}</p>
                  </div>
                  <button 
                    onClick={() => handleOpenModal("factory")}
                    className="flex-shrink-0 w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-red-500/20 transform hover:-translate-y-0.5 transition-all"
                  >
                    {t.factoryResetBtn}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- CONFIRMATION MODAL OVERLAY --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-red-200 dark:border-red-900/50 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-red-50 dark:bg-red-500/10">
              <h2 className="text-xl font-extrabold text-red-700 dark:text-red-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {t.modalTitle}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed font-medium">
                {t.modalWarning}
                <strong className="text-red-600 dark:text-red-400 mx-1 bg-red-50 dark:bg-red-500/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-500/30">
                  {t.modalTypeWord}
                </strong>
                {t.modalInstruction}
              </p>

              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t.placeholder}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white transition-colors text-center font-bold tracking-widest uppercase mb-6"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button 
                  onClick={executeReset}
                  disabled={confirmText !== "RESET" || isSubmitting} 
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? t.processingBtn : t.confirmBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}