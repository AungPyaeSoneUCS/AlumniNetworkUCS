// file: app/vote/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// --- Translations Dictionary ---
const translations = {
  my: {
    title: "မဲပေးစနစ်သို့ ဝင်ရောက်ရန်",
    subtitle: "မဲပေးရန် သို့မဟုတ် သင့်ဒက်ရှ်ဘုတ်သို့ ဝင်ရောက်ရန် အကောင့်ဝင်ပါ။",
    email: "အီးမေးလ်လိပ်စာ",
    emailPlaceholder: "user@gmail.com သို့မဟုတ် @ucsh.edu.mm",
    password: "စကားဝှက်",
    passwordPlaceholder: "••••••••",
    submit: "အကောင့်ဝင်မည်",
    submitting: "ဝင်ရောက်နေပါသည်...",
    footer: "အက်ဒမင်များသာ မဲပေးအကောင့်အသစ်များကို ဖန်တီးနိုင်ပါသည်။",
    errEmail: "အီးမေးလ်သည် @gmail.com သို့မဟုတ် @ucsh.edu.mm သာဖြစ်ရမည်။",
    errPassword: "စကားဝှက်သည် အက္ခရာ ၈-၂၀ ရှိရမည်ဖြစ်ပြီး (အကြီး၊ အသေး၊ ဂဏန်း၊ အထူးအက္ခရာ) အနည်းဆုံး ၂ မျိုး ပါဝင်ရမည်။",
    errInvalid: "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။",
    errUnexpected: "မျှော်လင့်မထားသော အမှားတစ်ခု ဖြစ်ပွားခဲ့ပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။"
  },
  en: {
    title: "Voting System Login",
    subtitle: "Sign in to cast your vote or access your dashboard.",
    email: "Email address",
    emailPlaceholder: "user@gmail.com or @ucsh.edu.mm",
    password: "Password",
    passwordPlaceholder: "••••••••",
    submit: "Sign in",
    submitting: "Signing in...",
    footer: "Only Admins can create new voting accounts.",
    errEmail: "Email must end with @gmail.com or @ucsh.edu.mm",
    errPassword: "Password must be 8-20 characters and contain at least 2 conditions (Upper, Lower, Number, Special).",
    errInvalid: "Invalid email or password. Please try again.",
    errUnexpected: "An unexpected error occurred. Please try again."
  }
};

export default function VoteLogin() {
  const router = useRouter();
  
  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Settings States
  const [lang, setLang] = useState<"my" | "en">("my"); // Default to Myanmar
  const [isDark, setIsDark] = useState(false); // Default to Day mode
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const cleanEmail = email.trim();

    // 1. Client-Side Email Validation
    if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@ucsh.edu.mm")) {
      setError(t.errEmail);
      setIsLoading(false);
      return;
    }

    // 2. Client-Side Password Validation
    if (password.length < 8 || password.length > 20) {
      setError(t.errPassword);
      setIsLoading(false);
      return;
    }

    let conditionsMet = 0;
    if (/[A-Z]/.test(password)) conditionsMet++; // Uppercase
    if (/[a-z]/.test(password)) conditionsMet++; // Lowercase
    if (/[0-9]/.test(password)) conditionsMet++; // Number
    if (/[^A-Za-z0-9]/.test(password)) conditionsMet++; // Special Character

    if (conditionsMet < 2) {
      setError(t.errPassword);
      setIsLoading(false);
      return;
    }

    // 3. Authentication
    try {
      const res = await signIn("vote-login", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(t.errInvalid);
        setIsLoading(false);
        return;
      }

      // 4. Fetch the session to route user based on role
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      
      const role = sessionData?.user?.role;

      if (role === "ADMIN") {
        router.push("/vote/admin");
      } else if (role === "TEAM") {
        router.push("/vote/team");
      } else {
        // Rediecting voters directly to the voting dashboard
        router.push("/vote/dashboard"); 
      }
      
      router.refresh();

    } catch (err) {
      console.error("Login error:", err);
      setError(t.errUnexpected);
      setIsLoading(false);
    }
  };

  return (
    // Top level wrapper to control local dark mode
    <div className={`${isDark ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
        
        {/* Floating Controls (Theme & Lang Toggles) */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "my" ? "en" : "my")}
            className="flex items-center justify-center px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {lang === "my" ? "EN" : "မြန်မာ"}
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isDark ? (
              // Sun Icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            ) : (
              // Moon Icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            )}
          </button>
        </div>

        {/* Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">
            {t.title}
          </h2>
          
        </div>

        {/* Form Container */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.email}
                </label>
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder={t.emailPlaceholder}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.password}
                </label>
                <div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder={t.passwordPlaceholder}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all duration-200 ${
                    isLoading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  }`}
                >
                  {isLoading ? t.submitting : t.submit}
                </button>
              </div>
            </form>
            
            {/* Footer */}
            <div className="mt-8 text-center text-sm border-t border-gray-100 dark:border-gray-700 pt-6">
              <p className="text-gray-500 dark:text-gray-400">
                {t.footer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}