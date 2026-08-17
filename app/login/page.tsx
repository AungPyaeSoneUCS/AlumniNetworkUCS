// file: app/login/page.tsx

"use client";

import type React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Home, Loader2, Sparkles } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/components/providers";

// Define the default redirect path as a variable
const DEFAULT_REDIRECT_URL = "/feeds";

type FocusState = {
  email: boolean;
  password: boolean;
};

type Lang = "en" | "mm";

function safeRedirect(value: string | null) {
  if (!value) return DEFAULT_REDIRECT_URL;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return DEFAULT_REDIRECT_URL;
}

function getEmailError(email: string, lang: Lang) {
  const value = email.trim();

  if (!value) return "";

  if (!value.includes("@")) {
    return lang === "mm"
      ? "Email တွင် @ ထည့်ရန်လိုအပ်ပါသည်။"
      : "Email must include @.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return lang === "mm"
      ? "Email format မမှန်ပါ။ example@gmail.com ပုံစံဖြစ်ရမည်။"
      : "Invalid email format. Example: example@gmail.com";
  }

  return "";
}

function getPasswordError(password: string, lang: Lang) {
  if (!password) return "";

  if (password.length < 8) {
    return lang === "mm"
      ? "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ဖြစ်ရမည်။"
      : "Password must be at least 8 characters.";
  }

  return "";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { lang, t } = useI18n();

  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const callbackUrl = safeRedirect(searchParams.get("callbackUrl"));
  const error = searchParams.get("error");

  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [focused, setFocused] = useState<FocusState>({
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(error ? t("loginFailed") : "");
  const [loading, setLoading] = useState(false);

  const emailError = getEmailError(email, currentLang);
  const passwordError = getPasswordError(password, currentLang);

  const showEmailError = focused.email && emailError;
  const showPasswordError = focused.password && passwordError;

  const canLogin =
    !emailError &&
    !passwordError &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !loading;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      router.replace(DEFAULT_REDIRECT_URL);
      return;
    }

    setCheckingSession(false);
  }, [status, router]);

  useEffect(() => {
    if (error) setMessage(t("loginFailed"));
  }, [error, t]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [message]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFocused({
      email: true,
      password: true,
    });

    const currentEmailError = getEmailError(email, currentLang);
    const currentPasswordError = getPasswordError(password, currentLang);

    if (currentEmailError) {
      setMessage(currentEmailError);
      return;
    }

    if (currentPasswordError) {
      setMessage(currentPasswordError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setMessage(
          currentLang === "mm"
            ? "Email သို့မဟုတ် စကားဝှက် မှားနေပါသည်။"
            : "Invalid email or password.",
        );
        return;
      }

      if (result?.ok) {
        window.location.replace(result.url || callbackUrl || DEFAULT_REDIRECT_URL);
        return;
      }

      window.location.replace(callbackUrl || DEFAULT_REDIRECT_URL);
    } catch (error) {
      console.error("Login failed:", error);
      setMessage(
        currentLang === "mm" ? "ဝင်ရောက်မှု မအောင်မြင်ပါ။" : "Login failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || checkingSession) {
    return (
      <main className="flex min-h-[calc(100vh-130px)] flex-col px-2 py-4 sm:px-3 sm:py-5">
        <section className="relative mx-auto flex w-full max-w-7xl flex-grow items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#3a6968] via-white to-[#eaffff] shadow-md">
          <BackgroundPhoto />

          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/25 bg-white/90 px-6 py-5 text-sm font-black text-[#008B8B] shadow-2xl backdrop-blur-2xl">
            <Loader2 className="h-5 w-5 animate-spin" />
            {currentLang === "mm" ? "စစ်ဆေးနေသည်..." : "Checking session..."}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-130px)] flex-col px-2 py-4 sm:px-3 sm:py-5">
      <section className="relative mx-auto grid w-full max-w-7xl flex-grow overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#3a6968] via-white to-[#eaffff] shadow-md lg:grid-cols-[0.95fr_1.05fr]">
        <BackgroundPhoto />

        {/* Left Column: Branding matching the Home Page Design Specification */}
        {/* Changed from "flex" to "hidden lg:flex" to hide on mobile screens */}
        <div className="relative z-10 hidden flex-grow items-center px-5 py-10 sm:px-8 lg:flex lg:px-12">
          {/* Gradient overlay positioned under text and over background photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/68 to-slate-950/25 lg:via-slate-950/55" />

          <div className="relative z-10 max-w-xl">
            <h1 className="space-y-1 text-[34px] font-black leading-[1.08] tracking-tight sm:text-[46px] md:text-[56px]">
              <span className="animate-hero-2 block text-[#f1cd72] hero-stroke-gold">
                {currentLang === "mm" ? "Alumni " : "Alumni"}
              </span>
              <span className="animate-hero-3 block text-[#FFFFFF] hero-stroke-gold">
                 {currentLang === "mm" ? "Network" : "Network"}
              </span>
            </h1>

            <p className="animate-hero-4 mt-4 max-w-[500px] text-[18px] font-black leading-tight text-[#f1cd72] sm:text-[22px] md:text-[24px] hero-stroke-slogan">
            </p>

            <p className="animate-hero-5 mt-3 max-w-[520px] text-[15px] font-bold leading-snug text-white sm:text-[17px] md:text-[18px] hero-stroke-subtitle">
              {currentLang === "mm"
                ? "သင်၏ ကျောင်းသားဟောင်းအကောင့်ဖြင့် ဝင်ရောက်၍ ကျောင်းသားဟောင်းကွန်ရက်တွင် ချိတ်ဆက်ပါ။"
                : "Login with your alumni account and join the alumni network."}
            </p>

            <div className="animate-hero-6 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <Home size={17} />
                {currentLang === "mm" ? "ပင်မစာမျက်နှာ" : "Home"}
              </Link>

              <Link
                href="/register"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
              >
                {currentLang === "mm" ? "အကောင့် ဖွင့်မယ်" : "Create Account"}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphism Login Form */}
        <div className="relative z-10 flex flex-grow items-center px-5 pb-8 sm:px-8 lg:px-10 lg:py-10 mt-5 lg:mt-0">
          <div className="animate-card w-full rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition duration-300 sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                {currentLang === "mm" ? "ပြန်လည်ကြိုဆိုပါတယ်" : "Welcome Back!"}
              </h2>

              <p className="mt-2 text-sm font-bold text-slate-600">
                {currentLang === "mm"
                  ? "Email နှင့် password ဖြင့် login ဝင်ပါ။"
                  : "Login with your email and password."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Input
                name="email"
                label="Email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onFocus={() =>
                  setFocused((prev) => ({
                    ...prev,
                    email: true,
                  }))
                }
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                }}
                error={showEmailError ? emailError : ""}
              />

              <PasswordInput
                name="password"
                label={currentLang === "mm" ? "စကားဝှက်" : "Password"}
                placeholder={
                  currentLang === "mm" ? "စကားဝှက် ထည့်ပါ" : "Enter password"
                }
                value={password}
                onFocus={() =>
                  setFocused((prev) => ({
                    ...prev,
                    password: true,
                  }))
                }
                onChange={(value) => {
                  setPassword(value);
                  setMessage("");
                }}
                show={showPassword}
                setShow={setShowPassword}
                error={showPasswordError ? passwordError : ""}
              />

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-black text-[#008B8B] transition hover:text-[#00BFC4] hover:underline"
                >
                  {currentLang === "mm"
                    ? "စကားဝှက် မေ့နေပါသလား?"
                    : "Forgot password?"}
                </Link>
              </div>

              {message && <ErrorBox message={message} />}

              <button
                type="submit"
                disabled={!canLogin}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-sm font-black text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading
                  ? currentLang === "mm"
                    ? "ခဏစောင့်ပါ..."
                    : "Please wait..."
                  : currentLang === "mm"
                    ? "ဝင်မည်"
                    : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-bold text-slate-600">
              {currentLang === "mm"
                ? "အကောင့်မရှိသေးပါသလား?"
                : "No account yet?"}{" "}
              <Link
                href="/register"
                className="font-black text-[#008B8B] transition hover:text-[#00BFC4] hover:underline"
              >
                {currentLang === "mm" ? "အကောင့် ဖွင့်မယ်" : "Create Account"}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <style>{`
        .hero-stroke-gold {
          text-shadow:
            2px 2px 0 #673a06,
            0px -2px 0 #061720,
            0px 2px 0 #f49325,
            2px 0px 0 #c67f0d;
        }

        .hero-stroke-white {
          -webkit-text-stroke: 0.4px rgba(174, 174, 174, 0.6);
          text-shadow:
             2px  2px 0 #f5f5f5,
             0px -2px 0 #e6f6ff,
             0px  2px 0 #00ffd9,
            -2px  0px 0 #faffb7,
             2px  0px 0 #9f9e9b;
        }

        .hero-stroke-subtitle {
          -webkit-text-stroke: 0.0px rgba(0, 0, 0, 0.5);
          text-shadow: 0 4px 20px rgba(0,0,0,.5);
        }

        .hero-stroke-slogan {
          -webkit-text-stroke: 0.0px rgba(0, 0, 0, 0.55);
          text-shadow: 0 4px 20px rgba(0,0,0,.5);
        }

        @keyframes arriveText {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(9px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-hero-1,
        .animate-hero-2,
        .animate-hero-3,
        .animate-hero-4,
        .animate-hero-5,
        .animate-hero-6 {
          opacity: 0;
          animation: arriveText 0.75s ease-out both;
        }

        .animate-hero-1 { animation-delay: 0.08s; }
        .animate-hero-2 { animation-delay: 0.18s; }
        .animate-hero-3 { animation-delay: 0.3s; }
        .animate-hero-4 { animation-delay: 0.42s; }
        .animate-hero-5 { animation-delay: 0.56s; }
        .animate-hero-6 { animation-delay: 0.7s; }

        .animate-card {
          opacity: 0;
          animation: cardIn 0.6s ease-out 0.28s both;
        }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-130px)] flex-col px-2 py-4 sm:px-3 sm:py-5">
          <section className="relative mx-auto flex w-full max-w-7xl flex-grow items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#3a6968] via-white to-[#eaffff] shadow-md">
            <BackgroundPhoto />
            <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/25 bg-white/90 px-6 py-5 text-sm font-black text-[#008B8B] shadow-2xl backdrop-blur-2xl">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </div>
          </section>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function BackgroundPhoto() {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/imgaes/background/background-0.jpg')",
        }}
      />
      {/* Dark overlay across the entire section photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/55 to-slate-950/25" />
      {/* Radial glows copied directly from reference app/page.tsx */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(241,205,114,0.25),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(0,191,196,0.22),transparent_35%)]" />
    </>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function Input({ label, error = "", ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-700">
        {label}
      </span>

      <input
        {...props}
        required
        className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-bold outline-none transition placeholder:text-slate-300 focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
            : "border-slate-200 focus:border-[#00BFC4] focus:ring-[#00BFC4]/15"
        }`}
      />

      {error && <FieldError message={error} />}
    </label>
  );
}

type PasswordInputProps = {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  show: boolean;
  setShow: (value: boolean) => void;
  error?: string;
};

function PasswordInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  onFocus,
  show,
  setShow,
  error = "",
}: PasswordInputProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-700">
        {label}
      </span>

      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          minLength={8}
          required
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border bg-white px-3 pr-11 text-sm font-bold outline-none transition placeholder:text-slate-300 focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
              : "border-slate-200 focus:border-[#00BFC4] focus:ring-[#00BFC4]/15"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#eaffff] hover:text-[#008B8B]"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {error && <FieldError message={error} />}
    </label>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600">
      {message}
    </p>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="animate-alert rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 shadow-sm">
      {message}
    </div>
  );
}