// file: app/login/page.tsx

"use client";

import type React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Home, Loader2, Sparkles } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/components/providers";

type FocusState = {
  email: boolean;
  password: boolean;
};

type Lang = "en" | "mm";

function safeRedirect(value: string | null) {
  if (!value) return "/feeds";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/feeds";
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
      router.replace("/feeds");
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
        //window.location.href = result.url || callbackUrl || "/feeds";
        window.location.href = "https://ucshalumninetwork.netlify.app/feeds";
        return;
      }

      window.location.href = "https://ucshalumninetwork.netlify.app/feeds";
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
      <main className="min-h-[calc(100vh-60px)] px-2 pb-6 pt-6 sm:px-3">
        <section className="relative mx-auto flex min-h-[calc(100vh-112px)] max-w-7xl items-center justify-center overflow-hidden rounded-2xl border border-white/20 shadow-md">
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
    <main className="min-h-[calc(100vh-60px)] px-2 pb-6 pt-6 sm:px-3">
      <section className="relative mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-white/20 shadow-md lg:grid-cols-[0.9fr_1.1fr]">
        <BackgroundPhoto />

        

        <div className="relative z-10 flex min-h-[calc(100vh-112px)] items-center px-5 py-10 sm:px-8 lg:px-12">

         

          <div className="max-w-xl">
            <div className="animate-in-1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
              <Sparkles size={15} className="text-[#f1cd72]" />
              {currentLang === "mm"
                ? "ကျောင်းသားဟောင်း ကွန်ရက်"
                : "Alumni Network"}
            </div>

            <h1 className="mt-5 space-y-1 text-[34px] font-black leading-[1.05] tracking-tight sm:text-[48px] md:text-[58px]">
              <span className="animate-in-2 block text-[#f1cd72] hero-title-gold">
                Alumni
              </span>
              <span className="animate-in-3 block text-white hero-title-white">
                Network
              </span>
            </h1>

            <h2 className="animate-in-4 mt-4 text-xl font-black text-white hero-subtitle sm:text-2xl">
              {currentLang === "mm"
                ? "Alumni Network သို့ ဝင်မည်"
                : "Login to Alumni Network"}
            </h2>

            <p className="animate-in-5 mt-4 max-w-lg text-base font-semibold leading-7 text-white/90 drop-shadow-lg sm:text-lg">
              {currentLang === "mm"
                ? "Admin မှ အတည်ပြုထားသော alumni account ဖြင့် ဆက်လက်ဝင်ရောက်ပါ။"
                : "Continue with your approved alumni account and connect with the community."}
            </p>

            <div className="animate-in-6 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <Home size={17} />
                Home
              </Link>

              <Link
                href="/register"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
              >
                {currentLang === "mm" ? "စာရင်းသွင်းမည်" : "Join Now"}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center px-5 pb-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-form w-full rounded-[2rem] border border-white/30 bg-white/92 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
                {currentLang === "mm" ? "ဝင်ရောက်ရန်" : "Welcome Back"}
              </h2>

              <p className="mt-2 text-sm font-bold text-slate-500">
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
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

            <p className="mt-5 text-center text-sm font-bold text-slate-600">
              {currentLang === "mm"
                ? "အကောင့်မရှိသေးပါသလား?"
                : "No account yet?"}{" "}
              <Link
                href="/register"
                className="font-black text-[#008B8B] transition hover:text-[#00BFC4] hover:underline"
              >
                {currentLang === "mm" ? "စာရင်းသွင်းမည်" : "Create one"}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <style>{`
        .hero-title-gold {
          text-shadow:
            2px 2px 0 #673a06,
            0px 2px 0 #f49325,
            2px 0px 0 #c67f0d,
            0 8px 22px rgba(0,0,0,.45);
        }

        .hero-title-white {
          text-shadow:
            1px 1px 0 rgba(255,255,255,.75),
            0 8px 22px rgba(0,0,0,.55);
        }

        .hero-subtitle {
          text-shadow:
            0 4px 20px rgba(0,0,0,.6);
        }

        @keyframes arrive {
          from {
            opacity: 0;
            transform: translateY(22px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .animate-in-1,
        .animate-in-2,
        .animate-in-3,
        .animate-in-4,
        .animate-in-5,
        .animate-in-6,
        .animate-form {
          opacity: 0;
          animation: arrive 0.65s ease-out both;
        }

        .animate-in-1 { animation-delay: 0.04s; }
        .animate-in-2 { animation-delay: 0.14s; }
        .animate-in-3 { animation-delay: 0.24s; }
        .animate-in-4 { animation-delay: 0.34s; }
        .animate-in-5 { animation-delay: 0.46s; }
        .animate-in-6 { animation-delay: 0.58s; }
        .animate-form { animation-delay: 0.28s; }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-60px)] px-2 pb-6 pt-6 sm:px-3">
          <section className="relative mx-auto flex min-h-[calc(100vh-112px)] max-w-7xl items-center justify-center overflow-hidden rounded-2xl border border-white/20 shadow-md">
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
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/62 to-slate-950/28" />
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