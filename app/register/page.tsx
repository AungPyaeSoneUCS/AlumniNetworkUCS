// file: app/register/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// UPGRADE: Added `signIn` to automatically log the user in after OTP success
import { useSession, signIn } from "next-auth/react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  Loader2,
  XCircle,
} from "lucide-react";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";
type Step = "approval" | "info" | "otp";

const OTP_LENGTH = 6;

const text = {
  en: {
    badge: "Alumni Network",
    title: "Create Alumni Account",
    subtitle:
      "Register with your approved student information and join the alumni community.",
    step1: "Approval",
    step2: "Account",
    step3: "OTP",
    name: "Name",
    fatherName: "Father Name",
    graduatedYear: "Year of Successful Completion",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    check: "Check Approval",
    checking: "Checking...",
    sendOtp: "Continue",
    sending: "Sending...",
    verifyOtp: "Verify OTP",
    verifying: "Verifying...",
    back: "Back",
    already: "Already have an account?",
    login: "Login",
    home: "Home",
    approved: "Approved register data found.",
    required: "Please fill all required fields.",
    nameInvalid: "Name must be at least 5 characters.",
    fatherNameInvalid: 'Father Name must start with "U ". ',
    invalidEmail: "Invalid email format.",
    weakPassword:
      "Password must include uppercase, lowercase, number, symbol and at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    passwordMatched: "Passwords match.",
    checkFirst: "Please check approval first.",
    otpInvalid: "OTP must be 6 digits.",
    nameHint: "Warning: Do not include 'Mg' or 'Ma' prefixes in your name.",
    fatherNameHint: 'Warning: Father Name must start with "U ". ',
    emailHint: "Enter your active email address to receive your verification OTP.",
    passwordHint:
      "Must be at least 8 characters with uppercase, lowercase, number, and symbol.",
  },
  mm: {
    badge: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    title: "ကျောင်းသားဟောင်းကွန်ရက် အကောင့်ဖွင့်ရန်",
    subtitle:
      "ကျောင်းသားရေးရာဌာနမှ အတည်ပြုထားသော ကျောင်းသား အချက်အလက်ဖြင့် ကျောင်းသားဟောင်းများကွန်ရက် သို့ ဝင်ရောက်ပါ။",
    step1: "Approval",
    step2: "Account",
    step3: "OTP",
    name: "အမည်",
    fatherName: "အဖအမည်",
    graduatedYear: "အောင်မြင်သည့်ခုနှစ်",
    email: "အီးမေးလ်",
    password: "စကားဝှက်",
    confirmPassword: "စကားဝှက် အတည်ပြု",
    check: "အတည်ပြုမှုအခြေအနေကိုစစ်ဆေးရန်",
    checking: "စစ်ဆေးနေသည်...",
    sendOtp: "ဆက်သွားမည်",
    sending: "ပို့နေသည်...",
    verifyOtp: "OTP အတည်ပြုမည်",
    verifying: "စစ်ဆေးနေသည်...",
    back: "နောက်သို့",
    already: "အကောင့် ရှိပြီးသားလား?",
    login: "အကောင့်ဝင်ရန်",
    home: "ပင်မစာမျက်နှာ",
    approved: "Admin မှ အတည်ပြုထားသော data တွေ့ပါသည်။",
    required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ။",
    nameInvalid: "အမည်သည် အနည်းဆုံး စာလုံး ၅ လုံး ရှိရမည်။",
    fatherNameInvalid: 'အဖအမည်သည် "U " ဖြင့် စရမည်။ ',
    invalidEmail: "Email format မမှန်ပါ။",
    weakPassword:
      "Password တွင် အကြီးစာလုံး၊ အသေးစာလုံး၊ နံပါတ်၊ symbol နှင့် 8 လုံးအထက် ပါရမည်။",
    passwordMismatch: "Password မတူပါ။",
    passwordMatched: "Password တူညီပါသည်။",
    checkFirst: "အရင်ဆုံး approval စစ်ပါ။",
    otpInvalid: "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။",
    nameHint: "သတိပြုရန် - အမည်တွင် 'Mg' သို့မဟုတ် 'Ma' ထည့်ရေးရန် မလိုပါ။",
    fatherNameHint: 'သတိပြုရန် - အဖအမည်ကို "U " ဖြင့် စရမည်။ ',
    emailHint: "OTP စစ်ဆေးရန်အတွက် လက်ရှိအသုံးပြုနေသည၏ အီးမေးလ်ကို ဖြည့်ပါ။",
    passwordHint:
      "အကြီးစာလုံး၊ အသေးစာလုံး၊ နံပါတ်၊ symbol နှင့် အနည်းဆုံး ၈ လုံး ပါရမည်။",
  },
};

function normalizeForMatch(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isPasswordStrong(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function isNameValid(value: string) {
  return value.trim().length >= 5;
}

function isFatherNameValid(value: string) {
  return value.trimStart().startsWith("U ") && value.trim().length >= 3;
}

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const { lang } = useI18n();

  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [step, setStep] = useState<Step>("approval");

  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("2026");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [activeHint, setActiveHint] = useState<string | null>(null);

  const [touched, setTouched] = useState({
    name: false,
    fatherName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const graduatedYears = useMemo(() => {
    const startYear = 2020;
    const endYear = new Date().getFullYear() + 1;
    const years: string[] = [];

    for (let y = endYear; y >= startYear; y--) {
      years.push(String(y));
    }

    return years;
  }, []);

  useEffect(() => {
    if (!activeHint) return;

    const timer = window.setTimeout(() => {
      setActiveHint(null);
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [activeHint]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/feeds");
  }, [status, router]);

  useEffect(() => {
    if (!message && !error) return;

    const timer = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [message, error]);

  useEffect(() => {
    setApproved(false);
  }, [name, fatherName, graduatedYear]);

  const approvalValid =
    isNameValid(name) &&
    isFatherNameValid(fatherName) &&
    graduatedYear.trim() &&
    Number(graduatedYear) >= 2020 &&
    Number(graduatedYear) <= new Date().getFullYear() + 1;

  const accountValid =
    email.trim() &&
    isEmailValid(email) &&
    password &&
    isPasswordStrong(password) &&
    confirmPassword &&
    password === confirmPassword;

  function resetStatus() {
    setMessage("");
    setError("");
  }

  async function checkApproval() {
    resetStatus();

    setTouched((prev) => ({
      ...prev,
      name: true,
      fatherName: true,
    }));

    if (!isNameValid(name)) {
      setError(t.nameInvalid);
      return;
    }

    if (!isFatherNameValid(fatherName)) {
      setError(t.fatherNameInvalid);
      return;
    }

    if (!approvalValid) {
      setError(t.required);
      return;
    }

    setApproved(false);
    setChecking(true);

    try {
      const res = await fetch("/api/register/check-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          graduatedYear: Number(graduatedYear),
          normalizedName: normalizeForMatch(name),
          normalizedFatherName: normalizeForMatch(fatherName),
          lang: currentLang,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.approved) {
        setError(data.error || data.message || t.required);
        return;
      }

      setApproved(true);
      setMessage(data.message || t.approved);

      window.setTimeout(() => {
        setStep("info");
        resetStatus();
      }, 500);
    } catch {
      setError("Server error.");
    } finally {
      setChecking(false);
    }
  }

  async function sendOtp() {
    resetStatus();

    setTouched((prev) => ({
      ...prev,
      email: true,
      password: true,
      confirmPassword: true,
    }));

    if (!approved) {
      setStep("approval");
      setError(t.checkFirst);
      return;
    }

    if (!isEmailValid(email)) {
      setError(t.invalidEmail);
      return;
    }

    if (!isPasswordStrong(password)) {
      setError(t.weakPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    if (!accountValid) {
      setError(t.required);
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          graduatedYear: Number(graduatedYear),
          normalizedName: normalizeForMatch(name),
          normalizedFatherName: normalizeForMatch(fatherName),
          email: email.trim().toLowerCase(),
          password,
          lang: currentLang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Registration failed.");
        return;
      }

      setEmail(email.trim().toLowerCase());
      setOtp(Array(OTP_LENGTH).fill(""));
      setMessage(data.message || "");
      setStep("otp");

      window.setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Registration failed.");
    } finally {
      setSendingOtp(false);
    }
  }

  function changeOtp(value: string, index: number) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];

    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    resetStatus();

    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setError(t.otpInvalid);
      return;
    }

    setVerifyingOtp(true);

    try {
      // 1. Verify OTP and Create User
      const res = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Invalid OTP.");
        return;
      }

      // UPGRADE: 2. Automatically log the user in right after OTP is verified
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password: password, // The password they just typed in Step 2 is still in state!
      });

      if (signInResult?.error) {
        // If automatic login fails for some reason, safely fallback to the normal redirect
        router.replace("/login");
      } else {
        // Auto-login successful! Skip the login page entirely.
        router.replace(data.redirect || "/settings");
      }
    } catch {
      setError("OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  const steps = [t.step1, t.step2, t.step3];
  const activeStepIndex = step === "approval" ? 0 : step === "info" ? 1 : 2;

  const nameError = touched.name && name && !isNameValid(name);
  const fatherNameError =
    touched.fatherName && fatherName && !isFatherNameValid(fatherName);
  const emailError = touched.email && email && !isEmailValid(email);
  const passwordError =
    touched.password && password && !isPasswordStrong(password);
  const confirmError =
    touched.confirmPassword &&
    confirmPassword &&
    password !== confirmPassword;

  if (status === "loading") {
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

        <div className="relative z-10 hidden flex-grow items-center px-5 py-10 sm:px-8 lg:flex lg:px-12">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/68 to-slate-950/25 lg:via-slate-950/55" />

          <div className="relative z-10 max-w-xl">
            <h1 className="space-y-1 text-[34px] font-black leading-[1.08] tracking-tight sm:text-[46px] md:text-[56px]">
              <span className="animate-in-2 block text-[#f1cd72] hero-title-gold">
                {currentLang === "mm" ? "Alumni " : "Alumni"}
              </span>
              <span className="animate-in-3 block text-[#FFFFFF] hero-title-gold">
                {currentLang === "mm" ? "Network" : "Network"}
              </span>
            </h1>

            <p className="animate-in-4 mt-4 max-w-[500px] text-[18px] font-black leading-tight text-[#f1cd72] sm:text-[22px] md:text-[24px] hero-subtitle">
              {t.title}
            </p>

            <p className="animate-in-5 mt-3 max-w-[520px] text-[15px] font-bold leading-snug text-white sm:text-[17px] md:text-[18px] hero-subtitle">
              {t.subtitle}
            </p>

            <div className="animate-in-6 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-black text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <Home size={17} />
                {t.home}
              </Link>

              <Link
                href="/login"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
              >
                {t.login}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-grow items-center px-5 pb-8 sm:px-8 lg:px-10 lg:py-10 mt-5 lg:mt-0">
          <div className="animate-form w-full rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition duration-300 sm:p-8">
            <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#25C9C8]/20 bg-[#eaffff]/80 p-2">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-xl px-3 py-3 text-center text-xs font-black transition ${
                    activeStepIndex >= index
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#00BFC4] text-white shadow-md"
                      : "bg-white/20 text-slate-500"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {(message || error) && (
              <div
                className={`mb-4 flex animate-alert items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
                  error
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {error ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                {error || message}
              </div>
            )}

            {step === "approval" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-1">
                  <Input
                    label={t.name}
                    value={name}
                    placeholder="Aung Aung or Mya Mya"
                    onChange={setName}
                    onFocus={() => setActiveHint("name")}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, name: true }))
                    }
                    error={nameError ? t.nameInvalid : ""}
                    hint={activeHint === "name" ? t.nameHint : ""}
                  />

                  <Input
                    label={t.fatherName}
                    value={fatherName}
                    placeholder="U -- --"
                    onChange={setFatherName}
                    onFocus={() => setActiveHint("fatherName")}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, fatherName: true }))
                    }
                    error={fatherNameError ? t.fatherNameInvalid : ""}
                    hint={activeHint === "fatherName" ? t.fatherNameHint : ""}
                  />

                  <Select
                    label={t.graduatedYear}
                    value={graduatedYear}
                    onChange={setGraduatedYear}
                  >
                    {graduatedYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </div>

                <button
                  type="button"
                  disabled={!approvalValid || checking}
                  onClick={checkApproval}
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checking && <Loader2 size={18} className="animate-spin" />}
                  {checking ? t.checking : t.check}
                </button>
              </div>
            )}

            {step === "info" && (
              <div className="space-y-4">
                <Input
                  label={t.email}
                  type="email"
                  value={email}
                  placeholder="example@gmail.com"
                  onChange={setEmail}
                  onFocus={() => setActiveHint("email")}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, email: true }))
                  }
                  error={emailError ? t.invalidEmail : ""}
                  hint={activeHint === "email" ? t.emailHint : ""}
                />

                <PasswordInput
                  label={t.password}
                  value={password}
                  onChange={setPassword}
                  onFocus={() => setActiveHint("password")}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  show={showPassword}
                  setShow={setShowPassword}
                  error={passwordError ? t.weakPassword : ""}
                  hint={activeHint === "password" ? t.passwordHint : ""}
                />

                <PasswordInput
                  label={t.confirmPassword}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, confirmPassword: true }))
                  }
                  show={showConfirm}
                  setShow={setShowConfirm}
                  error={confirmError ? t.passwordMismatch : ""}
                />

                {confirmPassword && !confirmError && (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                    {t.passwordMatched}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetStatus();
                      setStep("approval");
                    }}
                    className="h-11 rounded-xl border border-[#25C9C8]/30 bg-white px-5 text-sm font-black text-[#008B8B] transition hover:bg-[#eaffff]"
                  >
                    {t.back}
                  </button>

                  <button
                    type="button"
                    disabled={!accountValid || sendingOtp}
                    onClick={sendOtp}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingOtp && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {sendingOtp ? t.sending : t.sendOtp}
                  </button>
                </div>
              </div>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-5">
                <p className="rounded-xl bg-[#eaffff] px-4 py-3 text-center text-sm font-black text-[#008B8B]">
                  {email}
                </p>

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      value={digit}
                      inputMode="numeric"
                      maxLength={1}
                      onChange={(event) => changeOtp(event.target.value, index)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      className="h-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-black outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/15"
                    />
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetStatus();
                      setStep("info");
                    }}
                    className="h-11 rounded-xl border border-[#25C9C8]/30 bg-white px-5 text-sm font-black text-[#008B8B] transition hover:bg-[#eaffff]"
                  >
                    {t.back}
                  </button>

                  <button
                    type="submit"
                    disabled={otp.join("").length !== OTP_LENGTH || verifyingOtp}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyingOtp && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {verifyingOtp ? t.verifying : t.verifyOtp}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm font-bold text-slate-600">
              {t.already}{" "}
              <Link
                href="/login"
                className="font-black text-[#008B8B] transition hover:text-[#00BFC4] hover:underline"
              >
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <style>{`
        .hero-title-gold {
          text-shadow:
            2px 2px 0 #673a06,
            0px -2px 0 #061720,
            0px 2px 0 #f49325,
            2px 0px 0 #c67f0d;
        }

        .hero-title-white {
          -webkit-text-stroke: 0.4px rgba(174, 174, 174, 0.6);
          text-shadow:
            2px 2px 0 #f5f5f5,
            0px -2px 0 #e6f6ff,
            0px 2px 0 #00ffd9,
            -2px 0px 0 #faffb7,
            2px 0px 0 #9f9e9b;
        }

        .hero-subtitle {
          -webkit-text-stroke: 0.0px rgba(0, 0, 0, 0.5);
          text-shadow: 0 4px 20px rgba(0,0,0,.5);
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
        .animate-form,
        .animate-alert {
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
        .animate-alert { animation-delay: 0s; }
      `}</style>
    </main>
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
      {/* Radial glows copied directly from reference pages */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(22, 22, 21, 0.25),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(0,191,196,0.22),transparent_35%)]" />
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-black text-slate-700">
      {children}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  type = "text",
  placeholder,
  inputMode,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-bold outline-none transition placeholder:text-slate-300 focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
            : "border-slate-200 focus:border-[#00BFC4] focus:ring-[#00BFC4]/15"
        }`}
      />
      {error && <FieldError message={error} />}
      {!error && hint && <FieldHint message={hint} />}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/15"
      >
        {children}
      </select>
    </label>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  show,
  setShow,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  show: boolean;
  setShow: (value: boolean) => void;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border bg-white px-3 pr-11 text-sm font-bold outline-none transition focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
              : "border-slate-200 focus:border-[#00BFC4] focus:ring-[#00BFC4]/15"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#eaffff] hover:text-[#008B8B]"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {error && <FieldError message={error} />}
      {!error && hint && <FieldHint message={hint} />}
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

function FieldHint({ message }: { message: string }) {
  return (
    <p className="mt-1.5 animate-in-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition-all duration-300">
      ⚠️ {message}
    </p>
  );
}