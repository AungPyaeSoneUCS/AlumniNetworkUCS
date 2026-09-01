"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/app/vote/components/AdminNav"; // Adjust path if needed

// --- Translations Dictionary (Page Content Only) ---
const translations = {
  my: {
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
    emailError: "အီးမေးလ်သည် @gmail.com (သို့) @ucsh.edu.mm ဖြစ်ရမည်။",
    pwdError: "စကားဝှက်သည် အနည်းဆုံး စာလုံးရေ ၆ လုံး ရှိရပါမည်။",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
  },
  en: {
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
    emailError: "Email must end with @gmail.com or @ucsh.edu.mm only.",
    pwdError: "Password must be at least 6 characters.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
  }
};

export default function AdminProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

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
  
  // Validation States
  const [emailValidationWarning, setEmailValidationWarning] = useState("");
  const [pwdValidationWarning, setPwdValidationWarning] = useState("");

  // Pre-fill profile form when session loads
  useEffect(() => {
    if (session?.user) {
      setProfName(session.user.name || "");
      setProfEmail(session.user.email || "");
    }
  }, [session]);

  // Live Email Validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProfEmail(val);

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

  // Live Password Validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProfPassword(val);

    if (val.length > 0 && val.length < 6) {
      setPwdValidationWarning(t.pwdError);
    } else {
      setPwdValidationWarning("");
    }
  };

  // --- Form Handler ---
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = profEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@ucsh.edu.mm")) {
      setProfMsg({ type: "error", text: t.emailError });
      return;
    }

    if (profPassword && profPassword.length < 6) {
      setProfMsg({ type: "error", text: t.pwdError });
      return;
    }

    setIsUpdatingProf(true);
    setProfMsg({ type: "", text: "" });

    try {
      const payload: any = { 
        id: (session?.user as any).id, 
        name: profName, 
        email: cleanEmail 
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
      setEmailValidationWarning("");
      setPwdValidationWarning("");
      
      await update({ name: profName, email: cleanEmail });
    } catch (error: any) {
      setProfMsg({ type: "error", text: error.message });
    } finally {
      setIsUpdatingProf(false);
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

        {/* --- Main Area (Scroll enabled with proper padding) --- */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          <div className="w-full max-w-xl mx-auto mt-4 mb-20">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t.profileDesc}</p>
            </div>

            <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300 animate-in fade-in zoom-in-95">
              
              {/* Modern Profile Header Block (Banner + Avatar) */}
              <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
                <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm"></div>
              </div>
              
              <div className="px-6 sm:px-10 pb-8 pt-0 relative">
                
                {/* Floating Avatar Overlapping the Header */}
                <div className="flex justify-center -mt-16 mb-4 relative z-10">
                  <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg border-2 border-gray-100 dark:border-gray-700">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-inner">
                      {user?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {profMsg.text && (
                  <div className={`p-3 mb-5 rounded-lg text-sm font-bold text-center border ${
                    profMsg.type === "success" 
                      ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" 
                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
                  }`}>
                    {profMsg.text}
                  </div>
                )}

                {/* View Mode */}
                {!isEditingProfile ? (
                  <div className="text-center space-y-6">
                    
                    {/* Name & Email Info Centered */}
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{user.name}</h2>
                      <p className="text-gray-500 dark:text-gray-400 font-medium flex justify-center items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        {user.email}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        System Admin
                      </span>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={() => setIsEditingProfile(true)} 
                        className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
                      >
                        {t.editProfileBtn}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode Form */
                  <form onSubmit={handleProfileUpdate} className="space-y-5 text-left">
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t.nameLabel}</label>
                      <input 
                        type="text" 
                        required 
                        value={profName} 
                        onChange={(e) => setProfName(e.target.value)} 
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors text-sm font-medium" 
                      />
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t.emailLabel}</label>
                      <input 
                        type="email" 
                        required 
                        value={profEmail} 
                        onChange={handleEmailChange} 
                        className={`w-full px-4 py-2.5 bg-white dark:bg-gray-900 border rounded-xl focus:ring-2 dark:text-white transition-colors text-sm font-medium ${
                          emailValidationWarning 
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        }`} 
                      />
                      {emailValidationWarning && (
                        <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                          {emailValidationWarning}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t.pwdLabel}</label>
                      <input 
                        type="password" 
                        minLength={6} 
                        value={profPassword} 
                        onChange={handlePasswordChange} 
                        placeholder={t.leaveBlankPwd} 
                        className={`w-full px-4 py-2.5 bg-white dark:bg-gray-900 border rounded-xl focus:ring-2 dark:text-white transition-colors text-sm font-medium ${
                          pwdValidationWarning
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      />
                      {pwdValidationWarning && (
                        <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                          {pwdValidationWarning}
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-3 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => { 
                          setIsEditingProfile(false); 
                          setProfPassword(""); 
                          setEmailValidationWarning("");
                          setPwdValidationWarning("");
                          // Reset email to original if canceled
                          if (session?.user?.email) {
                            setProfEmail(session.user.email);
                          }
                        }} 
                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {t.cancelBtn}
                      </button>
                      <button 
                        type="submit" 
                        disabled={isUpdatingProf || Boolean(emailValidationWarning) || Boolean(pwdValidationWarning)} 
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 disabled:transform-none"
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