"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Translations Dictionary ---
const translations = {
  my: {
    title: "အကောင့် ဖန်တီးရန်",
    subtitle: "မှတ်ပုံတင်ရန် Environment Secret Key လိုအပ်ပါသည်။",
    name: "အမည်",
    namePlaceholder: "အက်ဒမင် အမည်",
    email: "အီးမေးလ်",
    emailPlaceholder: "admin@alumni.ucsh.edu.mm",
    password: "စကားဝှက်",
    passwordPlaceholder: "•••••••• (အနည်းဆုံး ၆ လုံး)",
    secretKey: "လျှို့ဝှက်ကုဒ် (Secret Key)",
    secretKeyPlaceholder: "VOTE_ADMIN_SETUP_SECRET",
    submit: "အကောင့် ဖန်တီးမည်",
    submitting: "ဖန်တီးနေပါသည်...",
    success: "အက်ဒမင် အကောင့် ဖန်တီးပြီးပါပြီ။ လော့ဂ်အင်သို့ သွားနေပါသည်...",
    backToLogin: "အက်ဒမင် လော့ဂ်အင်သို့ အမြန်သွားရန်",
    errUnexpected: "မျှော်လင့်မထားသော အမှားတစ်ခု ဖြစ်ပွားခဲ့ပါသည်။",
  },
  en: {
    title: "Admin Setup",
    subtitle: "Requires the environment secret key to register.",
    name: "Name",
    namePlaceholder: "Admin Name",
    email: "Email address",
    emailPlaceholder: "admin@alumni.ucsh.edu.mm",
    password: "Password",
    passwordPlaceholder: "•••••••• (Min 6 chars)",
    secretKey: "Setup Secret Key",
    secretKeyPlaceholder: "VOTE_ADMIN_SETUP_SECRET",
    submit: "Register",
    submitting: "Creating Admin...",
    success: "Admin account created! Redirecting to login...",
    backToLogin: "Return to Admin Login",
    errUnexpected: "An unexpected error occurred.",
  }
};

export default function AdminRegisterPage() {
  const router = useRouter();

  // States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Settings States
  const [lang, setLang] = useState<"my" | "en">("my"); // Default to Myanmar
  const [isDark, setIsDark] = useState(false); // Default to Day mode
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Send the data, including the secretKey, to the backend API for verification
      const res = await fetch("/api/vote/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, secretKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.errUnexpected);
      }

      setMessage({ type: "success", text: t.success });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/vote/admin/login");
      }, 2000);

    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
      setIsLoading(false);
    }
  };

  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
        
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
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>

        {/* Form Container */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            
            {message.text && (
              <div className={`mb-6 p-4 text-sm rounded-xl text-center font-medium border ${
                message.type === "success" 
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400" 
                  : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
              }`}>
                {message.text}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.name}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder={t.namePlaceholder}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.email}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder={t.emailPlaceholder}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.password}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder={t.passwordPlaceholder}
                />
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-sm font-bold text-red-600 dark:text-red-400 mb-1.5">{t.secretKey}</label>
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-800/50 rounded-xl shadow-sm placeholder-red-300 dark:placeholder-red-800/50 text-red-900 dark:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
                  placeholder={t.secretKeyPlaceholder}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all duration-200 ${
                    isLoading
                      ? "bg-blue-400 dark:bg-blue-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                  }`}
                >
                  {isLoading ? t.submitting : t.submit}
                </button>
              </div>
            </form>
            
            {/* Footer */}
            <div className="mt-8 text-center text-sm border-t border-gray-100 dark:border-gray-800 pt-6">
              <Link href="/vote/admin/login" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                &larr; {t.backToLogin}
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}