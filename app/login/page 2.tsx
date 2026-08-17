// file: app/login/page.tsx

"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/components/providers";

type FocusState = {
  email: boolean;
  password: boolean;
};

function safeRedirect(value: string | null) {
  if (!value) return "/feeds";

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/feeds";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { lang, t } = useI18n();

  const currentLang = lang === "mm" ? "mm" : "en";
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
      window.location.replace("/feeds");
      return;
    }

    setCheckingSession(false);
  }, [status]);

  useEffect(() => {
    if (error) setMessage(t("loginFailed"));
  }, [error, t]);

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
        window.location.href = result.url || callbackUrl || "/feeds";
        return;
      }

      window.location.href = "/feeds";
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
      <main className="mm page-wrapper relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[var(--ucsh-text)]">
        <BackgroundDecor />

        <div className="relative z-10 flex items-center gap-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-[var(--ucsh-card)] px-6 py-5 text-sm font-black shadow-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--ucsh-primary-dark)]" />
          {currentLang === "mm" ? "စစ်ဆေးနေသည်..." : "Checking session..."}
        </div>
      </main>
    );
  }

  return (
    <main className="mm page-wrapper relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="relative z-10 w-full max-w-md">
        <div className="ucsh-card ucsh-animate overflow-hidden p-0">
          <div className="h-1.5 bg-gradient-to-r from-[var(--ucsh-primary)] via-[var(--ucsh-secondary)] to-[var(--ucsh-accent)]" />

          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--ucsh-primary)]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-white/60 blur-3xl" />

            <div className="relative mb-8 text-center">
              <h1 className="text-3xl font-black tracking-tight text-[var(--ucsh-text)]">
                {currentLang === "mm"
                  ? "Alumni Network သို့ ဝင်မည်"
                  : "Login to Alumni Network"}
              </h1>

              <p className="mt-2 text-sm font-bold text-[var(--ucsh-muted)]">
                {currentLang === "mm"
                  ? "သင့်အကောင့်ဖြင့် ဆက်လက်ဝင်ရောက်ပါ"
                  : "Continue with your alumni account"}
              </p>
            </div>

            <form onSubmit={submit} className="relative space-y-5">
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
                  className="text-sm font-black text-[var(--ucsh-primary-dark)] transition hover:text-[var(--ucsh-primary)] hover:underline"
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
                className="flex h-14 w-full items-center justify-center rounded-[var(--ucsh-radius-md)] bg-gradient-to-r from-[var(--ucsh-primary)] via-[var(--ucsh-secondary)] to-[var(--ucsh-accent)] text-sm font-black tracking-wide text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading
                  ? currentLang === "mm"
                    ? "ခဏစောင့်ပါ..."
                    : "Please wait..."
                  : currentLang === "mm"
                    ? "ဝင်မည်"
                    : "Login"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-bold text-[var(--ucsh-muted)]">
              {currentLang === "mm"
                ? "အကောင့်မရှိသေးပါသလား?"
                : "No account yet?"}{" "}
              <Link
                href="/register"
                className="font-black text-[var(--ucsh-primary-dark)] transition hover:text-[var(--ucsh-primary)] hover:underline"
              >
                {currentLang === "mm" ? "စာရင်းသွင်းမည်" : "Create one"}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function getEmailError(email: string, lang: string) {
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

function getPasswordError(password: string, lang: string) {
  if (!password) return "";

  if (password.length < 8) {
    return lang === "mm"
      ? "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ဖြစ်ရမည်။"
      : "Password must be at least 8 characters.";
  }

  return "";
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function Input({ label, error = "", ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-[var(--ucsh-text)]">
        {label}
      </label>

      <input
        {...props}
        required
        className={`ucsh-input h-12 w-full px-4 text-sm font-bold ${
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""
        }`}
      />

      {error && <FieldError message={error} />}
    </div>
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
    <div className="space-y-2">
      <label className="block text-sm font-black text-[var(--ucsh-text)]">
        {label}
      </label>

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
          className={`ucsh-input h-12 w-full pl-4 pr-14 text-sm font-bold ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : ""
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--ucsh-muted)] transition hover:bg-cyan-50 hover:text-[var(--ucsh-primary-dark)] dark:hover:bg-slate-800"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {error && <FieldError message={error} />}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="animate-in fade-in slide-in-from-top-1 text-xs font-black text-red-600 duration-150">
      {message}
    </p>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--ucsh-radius-md)] border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 shadow-sm">
      {message}
    </div>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--ucsh-primary)]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
    </>
  );
}