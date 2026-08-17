// file: app/forgot-password/page.tsx

"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  Loader2,
  Sparkles,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/providers";

const OTP_LENGTH = 6;

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { status } = useSession();
  const { lang } = useI18n();

  const [checkingSession, setCheckingSession] = useState(true);
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [focused, setFocused] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);

  const currentLang = lang === "mm" ? "mm" : "en";
  const otpCode = otp.join("");

  const emailError = getEmailError(email, currentLang);
  const strength = getPasswordStrength(newPassword);
  const passwordError = getPasswordError(newPassword, strength, currentLang);
  const confirmPasswordError = getConfirmPasswordError(
    newPassword,
    confirmPassword,
    currentLang,
  );

  const isPasswordValid = newPassword.length >= 8 && strength.passedCount >= 3;

  const showEmailError = focused.email && emailError;
  const showPasswordError = focused.password && passwordError;
  const showPasswordHelp =
    focused.password && newPassword.length > 0 && !isPasswordValid;
  const showConfirmError = focused.confirmPassword && confirmPasswordError;

  const canSendOtp = !emailError && email.trim().length > 0 && !loading;

  const canReset =
    !passwordError &&
    !confirmPasswordError &&
    isPasswordValid &&
    confirmPassword.length > 0 &&
    !loading;

  const steps = ["Email", "OTP", "Password", "Success"];

  const activeStepIndex =
    step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      window.location.replace("/feeds");
      return;
    }

    setCheckingSession(false);
  }, [status]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (
      focused.confirmPassword &&
      confirmPassword.length > 0 &&
      !confirmPasswordError
    ) {
      setShowMatchSuccess(true);

      const timeout = window.setTimeout(() => {
        setShowMatchSuccess(false);
      }, 5000);

      return () => window.clearTimeout(timeout);
    }

    setShowMatchSuccess(false);
  }, [focused.confirmPassword, confirmPassword, confirmPasswordError]);

  function changeOtp(value: string, index: number) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];

    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function sendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFocused((prev) => ({
      ...prev,
      email: true,
    }));

    const currentEmailError = getEmailError(email, currentLang);

    if (currentEmailError) {
      setMessage(currentEmailError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/forgot-password/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to send OTP.");
        return;
      }

      setEmail(email.trim().toLowerCase());
      setOtp(Array(OTP_LENGTH).fill(""));
      setStep("otp");

      window.setTimeout(() => refs.current[0]?.focus(), 100);
    } catch (error) {
      console.error("Send OTP failed:", error);
      setMessage(
        currentLang === "mm"
          ? "OTP ပို့ရန် မအောင်မြင်ပါ။"
          : "Failed to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  }

  function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (otpCode.length !== OTP_LENGTH) {
      setMessage(
        currentLang === "mm"
          ? "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။"
          : "OTP must be 6 digits.",
      );
      return;
    }

    setMessage("");
    setStep("password");
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFocused({
      email: true,
      password: true,
      confirmPassword: true,
    });

    const currentPasswordError = getPasswordError(
      newPassword,
      strength,
      currentLang,
    );
    const currentConfirmError = getConfirmPasswordError(
      newPassword,
      confirmPassword,
      currentLang,
    );

    if (currentPasswordError) {
      setMessage(currentPasswordError);
      return;
    }

    if (currentConfirmError) {
      setMessage(currentConfirmError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpCode,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to reset password.");
        return;
      }

      const loginResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: newPassword,
        redirect: false,
        callbackUrl: "/feeds",
      });

      if (loginResult?.ok) {
        window.location.replace(loginResult.url || "/feeds");
        return;
      }

      window.location.replace("/login");
    } catch (error) {
      console.error("Reset password failed:", error);
      setMessage(
        currentLang === "mm"
          ? "စကားဝှက် ပြန်သတ်မှတ်မှု မအောင်မြင်ပါ။"
          : "Failed to reset password.",
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

        {/* Left Column: Branding matched to app/page.tsx, login, and register */}
        <div className="relative z-10 hidden flex-grow items-center px-5 py-10 sm:px-8 lg:flex lg:px-12">
          {/* Gradient overlay positioned under text and over background photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/68 to-slate-950/25 lg:via-slate-950/55" />

          <div className="relative z-10 max-w-xl">
            <div className="animate-in-1 mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
              <Sparkles size={15} className="text-[#f1cd72]" />
              {currentLang === "mm"
                ? "ကျောင်းသားဟောင်း ကွန်ရက်"
                : "Alumni Network"}
            </div>

            <h1 className="space-y-1 text-[34px] font-black leading-[1.08] tracking-tight sm:text-[46px] md:text-[56px]">
              <span className="animate-in-2 block text-[#f1cd72] hero-title-gold">
                Forgot
              </span>
              <span className="animate-in-3 block text-[#FFFFFF] hero-title-gold">
                Password
              </span>
            </h1>

            <p className="animate-in-4 mt-4 max-w-[500px] text-[18px] font-black leading-tight text-[#f1cd72] sm:text-[22px] md:text-[24px] hero-subtitle">
              {currentLang === "mm"
                ? "စကားဝှက် ပြန်သတ်မှတ်ရန်"
                : "Reset Alumni Account"}
            </p>

            <p className="animate-in-5 mt-3 max-w-[520px] text-[15px] font-bold leading-snug text-white sm:text-[17px] md:text-[18px] hero-subtitle">
              {currentLang === "mm"
                ? "သင့် Email သို့ OTP ပို့ပြီး စကားဝှက်အသစ် ပြန်သတ်မှတ်နိုင်ပါသည်။"
                : "Reset your Alumni Network password securely using OTP verification."}
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
                href="/login"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-6 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-xl"
              >
                {currentLang === "mm" ? "ဝင်မည်" : "Login"}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphism Reset Form */}
        <div className="relative z-10 flex flex-grow items-center px-5 pb-8 sm:px-8 lg:px-10 lg:py-10 mt-5 lg:mt-0">
          <div className="animate-form w-full rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition duration-300 sm:p-8">
            <div className="mb-6 grid grid-cols-4 gap-2 rounded-2xl border border-[#25C9C8]/20 bg-[#eaffff]/80 p-2">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-xl px-2 py-3 text-center text-[11px] font-black transition sm:text-xs ${
                    activeStepIndex >= index
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md"
                      : "bg-white/80 text-slate-500"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {message && <ErrorBox message={message} />}

            {step === "email" && (
              <form onSubmit={sendOtp} className="space-y-4">
                <MinimalText>
                  {currentLang === "mm"
                    ? "သင့် Email ထည့်ပြီး OTP ရယူပါ။"
                    : "Enter your email to receive OTP."}
                </MinimalText>

                <Input
                  name="email"
                  type="email"
                  label="Email"
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

                <PrimaryButton disabled={!canSendOtp || loading}>
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading
                    ? currentLang === "mm"
                      ? "ပို့နေသည်..."
                      : "Sending..."
                    : currentLang === "mm"
                      ? "OTP ပို့မည်"
                      : "Send OTP"}
                </PrimaryButton>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-5">
                <MinimalText>
                  {currentLang === "mm"
                    ? "သင့် Email သို့ ပို့ထားသော OTP ၆ လုံးကို ထည့်ပါ။"
                    : "Enter the 6-digit OTP sent to your email."}
                </MinimalText>

                <p className="rounded-xl bg-[#eaffff] px-4 py-3 text-center text-sm font-black text-[#008B8B]">
                  {email}
                </p>

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        refs.current[index] = el;
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
                      setMessage("");
                      setStep("email");
                    }}
                    className="h-11 rounded-xl border border-[#25C9C8]/30 bg-white px-5 text-sm font-black text-[#008B8B] transition hover:bg-[#eaffff]"
                  >
                    {currentLang === "mm" ? "နောက်သို့" : "Back"}
                  </button>

                  <PrimaryButton disabled={otpCode.length !== OTP_LENGTH}>
                    {currentLang === "mm" ? "OTP စစ်မည်" : "Verify OTP"}
                  </PrimaryButton>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={resetPassword} className="space-y-4">
                <MinimalText>
                  {currentLang === "mm"
                    ? "စကားဝှက်အသစ် ထည့်ပါ။"
                    : "Enter your new password."}
                </MinimalText>

                <PasswordInput
                  name="newPassword"
                  label={currentLang === "mm" ? "စကားဝှက်အသစ်" : "New Password"}
                  placeholder={
                    currentLang === "mm"
                      ? "စကားဝှက်အသစ် ထည့်ပါ"
                      : "Enter new password"
                  }
                  value={newPassword}
                  onFocus={() =>
                    setFocused((prev) => ({
                      ...prev,
                      password: true,
                    }))
                  }
                  onChange={(value) => {
                    setNewPassword(value);
                    setMessage("");
                  }}
                  show={showPassword}
                  setShow={setShowPassword}
                  error={showPasswordError ? passwordError : ""}
                />

                {showPasswordHelp && (
                  <PasswordStrength strength={strength} lang={currentLang} />
                )}

                <PasswordInput
                  name="confirmPassword"
                  label={
                    currentLang === "mm"
                      ? "စကားဝှက် အတည်ပြု"
                      : "Confirm Password"
                  }
                  placeholder={
                    currentLang === "mm"
                      ? "စကားဝှက် ပြန်ထည့်ပါ"
                      : "Confirm password"
                  }
                  value={confirmPassword}
                  onFocus={() =>
                    setFocused((prev) => ({
                      ...prev,
                      confirmPassword: true,
                    }))
                  }
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setMessage("");
                  }}
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                  error={showConfirmError ? confirmPasswordError : ""}
                />

                {showMatchSuccess && (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                    {currentLang === "mm"
                      ? "စကားဝှက် တူညီပါသည်။"
                      : "Passwords match."}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setStep("otp");
                    }}
                    className="h-11 rounded-xl border border-[#25C9C8]/30 bg-white px-5 text-sm font-black text-[#008B8B] transition hover:bg-[#eaffff]"
                  >
                    {currentLang === "mm" ? "နောက်သို့" : "Back"}
                  </button>

                  <PrimaryButton disabled={!canReset || loading}>
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading
                      ? currentLang === "mm"
                        ? "ပြောင်းနေသည်..."
                        : "Resetting..."
                      : currentLang === "mm"
                        ? "စကားဝှက် ပြန်သတ်မှတ်မည်"
                        : "Reset Password"}
                  </PrimaryButton>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg">
                  <CheckCircle2 size={34} />
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                  {currentLang === "mm"
                    ? "စကားဝှက် ပြောင်းပြီးပါပြီ"
                    : "Password Reset"}
                </h1>

                <p className="mt-3 text-sm font-bold leading-relaxed text-slate-500">
                  {currentLang === "mm"
                    ? "Login page သို့ ပြန်သွားပါ။"
                    : "Please login again."}
                </p>

                <Link
                  href="/login"
                  className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {currentLang === "mm" ? "ဝင်မည်" : "Login"}
                </Link>
              </div>
            )}

            {step !== "success" && (
              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm font-black text-[#008B8B] transition hover:text-[#00BFC4] hover:underline"
              >
                {currentLang === "mm" ? "ဝင်ရန် ပြန်သွားမည်" : "Back to login"}
              </Link>
            )}
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
      {/* Radial glows matching home, login, and register pages */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(241,205,114,0.25),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(0,191,196,0.22),transparent_35%)]" />
    </>
  );
}

function MinimalText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-[#eaffff] px-4 py-3 text-center text-sm font-black text-[#008B8B]">
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
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
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 shadow-sm">
      {message}
    </div>
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

function getPasswordError(
  password: string,
  strength: ReturnType<typeof getPasswordStrength>,
  lang: string,
) {
  if (!password) return "";

  if (password.length < 8) {
    return lang === "mm"
      ? "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ဖြစ်ရမည်။"
      : "Password must be at least 8 characters.";
  }

  if (strength.passedCount < 3) {
    return lang === "mm"
      ? "စကားဝှက်တွင် အနည်းဆုံး ၃ မျိုး ပါရမည်။"
      : "Password needs at least 3 types: uppercase, lowercase, number, or special character.";
  }

  return "";
}

function getConfirmPasswordError(
  password: string,
  confirmPassword: string,
  lang: string,
) {
  if (!confirmPassword) return "";

  if (password !== confirmPassword) {
    return lang === "mm" ? "စကားဝှက် မတူပါ။" : "Passwords do not match.";
  }

  return "";
}

function getPasswordStrength(password: string) {
  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  return {
    passedCount: checks.filter(Boolean).length,
    hasUpper: checks[0],
    hasLower: checks[1],
    hasNumber: checks[2],
    hasSpecial: checks[3],
  };
}

function PasswordStrength({
  strength,
  lang,
}: {
  strength: ReturnType<typeof getPasswordStrength>;
  lang: string;
}) {
  const items = [
    {
      pass: strength.hasUpper,
      label: lang === "mm" ? "အကြီးစာလုံး" : "Uppercase",
    },
    {
      pass: strength.hasLower,
      label: lang === "mm" ? "အသေးစာလုံး" : "Lowercase",
    },
    {
      pass: strength.hasNumber,
      label: lang === "mm" ? "နံပါတ်" : "Number",
    },
    {
      pass: strength.hasSpecial,
      label: "Symbol",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg px-3 py-2 text-xs font-black ${
            item.pass
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}