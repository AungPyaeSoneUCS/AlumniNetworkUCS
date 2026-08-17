// file: app/login/page.tsx

"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/components/providers";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useI18n();

  const callbackUrl = searchParams.get("callbackUrl") || "/feeds";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [focused, setFocused] = useState({
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(error ? t("loginFailed") : "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const emailError = getEmailError(email, lang);
  const passwordError = getPasswordError(password, lang);

  const showEmailError = focused.email && emailError;
  const showPasswordError = focused.password && passwordError;

  const canLogin =
    !emailError &&
    !passwordError &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !loading &&
    !googleLoading;

  useEffect(() => {
    if (error) setMessage(t("loginFailed"));
  }, [error, t]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setFocused({
      email: true,
      password: true,
    });

    const currentEmailError = getEmailError(email, lang);
    const currentPasswordError = getPasswordError(password, lang);

    if (currentEmailError) return setMessage(currentEmailError);
    if (currentPasswordError) return setMessage(currentPasswordError);

    setLoading(true);
    setMessage("");

    const emailValue = email.trim().toLowerCase();

    try {
      const result = await signIn("credentials", {
        email: emailValue,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage(
          lang === "mm"
            ? "Email သို့မဟုတ် စကားဝှက် မှားနေပါသည်။"
            : "Invalid email or password."
        );
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setMessage(
        lang === "mm" ? "ဝင်ရောက်မှု မအောင်မြင်ပါ။" : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
    setGoogleLoading(false);
  }

  return (
    <section className="mm relative flex min-h-screen items-center justify-center overflow-hidden bg-[#94EFEE] px-4 py-10 text-slate-950">
      <GradientBackground />

      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-2 animate-pulse bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#42D3E2]" />

        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#25C9C8]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#00BFC4]/20 blur-3xl" />

        <div className="relative mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {lang === "mm"
              ? "Alumni Network သို့ ဝင်မည်"
              : "Login to Alumni Network"}
          </h1>
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
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(event.target.value);
              setMessage("");
            }}
            error={showEmailError ? emailError : ""}
          />

          <PasswordInput
            name="password"
            label={lang === "mm" ? "စကားဝှက်" : "Password"}
            placeholder={
              lang === "mm" ? "စကားဝှက် ထည့်ပါ" : "Enter your password"
            }
            value={password}
            onFocus={() =>
              setFocused((prev) => ({
                ...prev,
                password: true,
              }))
            }
            onChange={(value: string) => {
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
              {lang === "mm"
                ? "စကားဝှက် မေ့နေပါသလား?"
                : "Forgot password?"}
            </Link>
          </div>

          {message && <ErrorBox message={message} />}

          <button
            disabled={!canLogin}
            className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#008B8B] text-sm font-black tracking-wide text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 animate-pulse bg-white/10 opacity-0 transition group-hover:opacity-100" />

            <span className="relative z-10">
              {loading
                ? lang === "mm"
                  ? "ခဏစောင့်ပါ..."
                  : "Please wait..."
                : lang === "mm"
                  ? "ဝင်မည်"
                  : "Login"}
            </span>
          </button>
        </form>

        <Divider text={lang === "mm" ? "သို့မဟုတ်" : "or"} />

        <button
          type="button"
          onClick={googleLogin}
          disabled={loading || googleLoading}
          className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#25C9C8]/30 bg-white/90 px-4 font-black text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:text-[#008B8B] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FcGoogle size={24} />

          <span>
            {googleLoading
              ? lang === "mm"
                ? "ချိတ်ဆက်နေသည်..."
                : "Connecting..."
              : lang === "mm"
                ? "Google ဖြင့် ဝင်မည်"
                : "Continue with Google"}
          </span>
        </button>

        <p className="mt-8 text-center text-sm font-bold text-slate-500">
          {lang === "mm" ? "အကောင့်မရှိသေးပါသလား?" : "No account yet?"}{" "}
          <Link
            href="/register"
            className="font-black text-[#008B8B] transition hover:text-[#00BFC4] hover:underline"
          >
            {lang === "mm" ? "စာရင်းသွင်းမည်" : "Create one"}
          </Link>
        </p>
      </div>
    </section>
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

function Input({ label, error, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700">{label}</label>

      <div className="group relative">
        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-all duration-300 group-focus-within:text-[#008B8B]" />

        <input
          {...props}
          required
          className={`w-full rounded-2xl border bg-[#F8FFFF] px-12 py-3.5 text-sm font-bold text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-[#25C9C8]/30 focus:border-[#00BFC4] focus:ring-[#00BFC4]/10"
          }`}
        />
      </div>

      {error && <FieldError message={error} />}
    </div>
  );
}

function PasswordInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  onFocus,
  show,
  setShow,
  error,
}: any) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700">{label}</label>

      <div className="group relative">
        <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-all duration-300 group-focus-within:text-[#008B8B]" />

        <input
          name={name}
          type={show ? "text" : "password"}
          minLength={8}
          required
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-[#F8FFFF] px-12 py-3.5 pr-14 text-sm font-bold text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-[#25C9C8]/30 focus:border-[#00BFC4] focus:ring-[#00BFC4]/10"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-all duration-300 hover:bg-[#94EFEE]/60 hover:text-[#008B8B]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
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
    <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-black text-red-700 shadow-sm">
      {message}
    </div>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="my-7 flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#25C9C8] to-transparent" />

      <span className="text-xs font-black uppercase tracking-[0.25em] text-[#008B8B]">
        {text}
      </span>

      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#25C9C8] to-transparent" />
    </div>
  );
}

function GradientBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[#94EFEE]" />
      <div className="absolute -left-20 top-10 -z-10 h-80 w-80 animate-pulse rounded-full bg-white/45 blur-3xl" />
      <div className="absolute -right-20 bottom-10 -z-10 h-96 w-96 animate-pulse rounded-full bg-[#25C9C8]/45 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/25 blur-3xl" />
      <div className="absolute inset-x-0 top-0 -z-10 h-4 animate-pulse bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#42D3E2]" />
    </>
  );
}