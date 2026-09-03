// file: app/admin/forgot-password/page.tsx

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
  ShieldCheck,
  KeyRound,
  Lock,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/providers";

const OTP_LENGTH = 6;

type Step = "email" | "otp" | "password" | "success";

export default function AdminForgotPasswordPage() {
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

  const steps = ["Admin Email", "Secure OTP", "New Key", "Dashboard"];

  const activeStepIndex =
    step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;

  // STRICT ADMIN SESSION VERIFICATION
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      // Fetch user role to ensure non-admins are ejected from this portal
      fetch("/api/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.role?.toLowerCase() === "admin") {
            window.location.replace("/admin/dashboard");
          } else {
            window.location.replace("/feeds");
          }
        })
        .catch(() => setCheckingSession(false));
      return;
    }

    setCheckingSession(false);
  }, [status]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 4000);

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
      // TARGETING EXCLUSIVE ADMIN OTP ENDPOINT
      const res = await fetch("/api/admin/forgot-password/send-otp", {
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
        setMessage(data.error || "Failed to initiate administrative reset.");
        return;
      }

      setEmail(email.trim().toLowerCase());
      setOtp(Array(OTP_LENGTH).fill(""));
      setStep("otp");

      window.setTimeout(() => refs.current[0]?.focus(), 100);
    } catch (error) {
      console.error("Admin Send OTP failed:", error);
      setMessage(
        currentLang === "mm"
          ? "á€…á€”á€…á€º á€…á€…á€ºá€†á€±á€¸á€™á€¾á€¯ á€™á€¡á€±á€¬á€„á€ºá€™á€¼á€„á€ºá€•á€«á‹"
          : "System verification failed.",
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
          ? "á€œá€¯á€¶á€á€¼á€¯á€¶á€›á€±á€¸á€€á€¯á€’á€º á† á€œá€¯á€¶á€¸ á€•á€¼á€Šá€·á€ºá€…á€¯á€¶á€…á€½á€¬ á€‘á€Šá€·á€ºá€•á€«á‹"
          : "Please enter the full 6-digit security token.",
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
      // TARGETING EXCLUSIVE ADMIN RESET ENDPOINT
      const res = await fetch("/api/admin/forgot-password/reset", {
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
        setMessage(data.error || "Administrative credential update rejected.");
        return;
      }

      setStep("success");

      // AUTO-LOGIN DIRECTLY TO ADMIN DASHBOARD
      const loginResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: newPassword,
        redirect: false,
        callbackUrl: "/admin/dashboard",
      });

      if (loginResult?.ok) {
        window.location.replace("/admin/dashboard");
        return;
      }

      // Fallback if NextAuth session hydration delays
      window.setTimeout(() => {
        window.location.replace("/admin/login");
      }, 1500);

    } catch (error) {
      console.error("Admin Reset password failed:", error);
      setMessage(
        currentLang === "mm"
          ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° á€…á€€á€¬á€¸á€á€¾á€€á€º á€•á€¼á€±á€¬á€„á€ºá€¸á€œá€²á€™á€¾á€¯ á€™á€¡á€±á€¬á€„á€ºá€™á€¼á€„á€ºá€•á€«á‹"
          : "Admin credential update failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || checkingSession) {
    return (
      <main className="min-h-[calc(100vh-60px)] px-2 pb-6 pt-6 sm:px-3 bg-slate-950">
        <section className="relative mx-auto flex min-h-[calc(100vh-112px)] max-w-7xl items-center justify-center overflow-hidden rounded-2xl border border-slate-800 shadow-md">
          <BackgroundPhoto />

          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-slate-900/90 px-6 py-5 text-sm font-black text-amber-500 shadow-2xl backdrop-blur-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            {currentLang === "mm" ? "á€œá€¯á€¶á€á€¼á€¯á€¶á€›á€±á€¸ á€…á€…á€ºá€†á€±á€¸á€”á€±á€žá€Šá€º..." : "Verifying Administrative Clearance..."}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-60px)] px-2 pb-6 pt-6 sm:px-3 bg-slate-950">
      <section className="relative mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-slate-800 shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <BackgroundPhoto />

        <div className="relative z-10 flex min-h-[calc(100vh-112px)] items-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="max-w-xl">
            <div className="animate-in-1 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 shadow-lg backdrop-blur">
              <ShieldCheck size={16} className="text-amber-400" />
              {currentLang === "mm"
                ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° á€¡á€‘á€°á€¸á€€á€½á€”á€ºá€›á€€á€º"
                : "UCSH Executive Control"}
            </div>

            <h1 className="mt-5 space-y-1 text-[34px] font-black leading-[1.05] tracking-tight sm:text-[48px] md:text-[58px]">
              <span className="animate-in-2 block text-amber-400 hero-title-amber">
                Admin
              </span>
              <span className="animate-in-3 block text-white hero-title-white">
                Recovery
              </span>
            </h1>

            <h2 className="animate-in-4 mt-4 text-xl font-black text-slate-300 hero-subtitle sm:text-2xl">
              {currentLang === "mm"
                ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€™á€¾á€¯á€¡á€†á€„á€·á€º á€…á€€á€¬á€¸á€á€¾á€€á€º á€•á€¼á€”á€ºá€žá€á€ºá€™á€¾á€á€ºá€›á€”á€º"
                : "Authorized Personnel Only"}
            </h2>

            <p className="animate-in-5 mt-4 max-w-lg text-base font-semibold leading-7 text-slate-400 drop-shadow-lg sm:text-lg">
              {currentLang === "mm"
                ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° Email á€žá€­á€¯á€· á€œá€»á€¾á€­á€¯á€·á€á€¾á€€á€ºá€€á€¯á€’á€º á€•á€­á€¯á€·á€•á€¼á€®á€¸ á€…á€”á€…á€ºá€’á€€á€ºá€›á€¾á€ºá€˜á€¯á€á€ºá€žá€­á€¯á€· á€á€­á€¯á€€á€ºá€›á€­á€¯á€€á€º á€•á€¼á€”á€ºá€œá€Šá€ºá€á€„á€ºá€›á€±á€¬á€€á€ºá€•á€«á‹"
                : "Execute an encrypted credential override. All recovery attempts are logged to the central security audit ledger."}
            </p>

            <div className="animate-in-6 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 text-sm font-black text-slate-300 shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-slate-800 hover:text-white"
              >
                <Home size={17} />
                Public Portal
              </Link>

              <Link
                href="/admin/login"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-black text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-amber-400 hover:shadow-amber-500/20 hover:shadow-xl"
              >
                {currentLang === "mm" ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° á€á€„á€ºá€•á€±á€«á€€á€º" : "Admin Login"}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center px-5 pb-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-form w-full rounded-[2rem] border border-slate-800 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
            
            {/* Executive Step Indicator */}
            <div className="mb-6 grid grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-2">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-xl px-1 py-3 text-center text-[10px] font-black transition sm:text-xs ${
                    activeStepIndex >= index
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md"
                      : "bg-slate-900 text-slate-600"
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
                    ? "á€™á€¾á€á€ºá€•á€¯á€¶á€á€„á€ºá€‘á€¬á€¸á€žá€±á€¬ á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° Email á€¡á€á€­á€¡á€€á€» á€‘á€Šá€·á€ºá€•á€«á‹"
                    : "Enter your assigned Executive Administrator Email."}
                </MinimalText>

                <Input
                  name="email"
                  type="email"
                  label="Administrator Email"
                  placeholder="admin.controller@ucsh.edu.mm"
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
                      ? "á€á€±á€¬á€„á€ºá€¸á€†á€­á€¯á€”á€±á€žá€Šá€º..."
                      : "Dispatching Token..."
                    : currentLang === "mm"
                      ? "á€œá€¯á€¶á€á€¼á€¯á€¶á€›á€±á€¸á€€á€¯á€’á€º á€•á€­á€¯á€·á€™á€Šá€º"
                      : "Transmit Security Token"}
                </PrimaryButton>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-5">
                <MinimalText>
                  {currentLang === "mm"
                    ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° Email á€žá€­á€¯á€· á€›á€±á€¬á€€á€ºá€›á€¾á€­á€œá€¬á€žá€±á€¬ á€‚á€á€”á€ºá€¸ á† á€œá€¯á€¶á€¸á€€á€­á€¯ á€‘á€Šá€·á€ºá€•á€«á‹"
                    : "Enter the 6-digit Level-1 Authorization Token."}
                </MinimalText>

                <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm font-black text-amber-400">
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
                      className="h-12 rounded-xl border border-slate-800 bg-slate-950 text-center text-lg font-black text-amber-400 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
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
                    className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-5 text-sm font-black text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    {currentLang === "mm" ? "á€”á€±á€¬á€€á€ºá€žá€­á€¯á€·" : "Abort"}
                  </button>

                  <PrimaryButton disabled={otpCode.length !== OTP_LENGTH}>
                    {currentLang === "mm" ? "á€á€­á€¯á€€á€„á€º á€…á€…á€ºá€™á€Šá€º" : "Authorize Token"}
                  </PrimaryButton>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={resetPassword} className="space-y-4">
                <MinimalText>
                  {currentLang === "mm"
                    ? "á€œá€¯á€¶á€á€¼á€¯á€¶á€›á€±á€¸á€¡á€†á€„á€·á€ºá€™á€¼á€„á€·á€º á€…á€€á€¬á€¸á€á€¾á€€á€ºá€¡á€žá€…á€º á€žá€á€ºá€™á€¾á€á€ºá€•á€«á‹"
                    : "Establish a high-entropy Executive Passkey."}
                </MinimalText>

                <PasswordInput
                  name="newPassword"
                  label={currentLang === "mm" ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° á€…á€€á€¬á€¸á€á€¾á€€á€ºá€¡á€žá€…á€º" : "New Executive Key"}
                  placeholder={
                    currentLang === "mm"
                      ? "á€…á€€á€¬á€¸á€á€¾á€€á€ºá€¡á€žá€…á€º á€›á€­á€¯á€€á€ºá€‘á€Šá€·á€ºá€•á€«"
                      : "Enter encrypted passkey"
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
                      ? "á€¡á€á€Šá€ºá€•á€¼á€¯ á€…á€€á€¬á€¸á€á€¾á€€á€º"
                      : "Confirm Executive Key"
                  }
                  placeholder={
                    currentLang === "mm"
                      ? "á€…á€€á€¬á€¸á€á€¾á€€á€º á€‘á€•á€ºá€™á€¶á€›á€­á€¯á€€á€ºá€‘á€Šá€·á€ºá€•á€«"
                      : "Re-verify passkey"
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
                  <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400">
                    {currentLang === "mm"
                      ? "á€…á€€á€¬á€¸á€á€¾á€€á€º á€€á€­á€¯á€€á€ºá€Šá€®á€™á€¾á€¯ á€¡á€á€Šá€ºá€•á€¼á€¯á€•á€¼á€®á€¸á€•á€«á€•á€¼á€®á‹"
                      : "Passkey cryptographic parity verified."}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setStep("otp");
                    }}
                    className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-5 text-sm font-black text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    {currentLang === "mm" ? "á€”á€±á€¬á€€á€ºá€žá€­á€¯á€·" : "Back"}
                  </button>

                  <PrimaryButton disabled={!canReset || loading}>
                    {loading && <Loader2 size={18} className="animate-spin text-slate-950" />}
                    {loading
                      ? currentLang === "mm"
                        ? "á€á€»á€­á€á€ºá€†á€€á€ºá€”á€±á€žá€Šá€º..."
                        : "Hydrating Session..."
                      : currentLang === "mm"
                        ? "á€…á€€á€¬á€¸á€á€¾á€€á€º á€¡á€á€Šá€ºá€•á€¼á€¯á€•á€¼á€®á€¸ á€á€„á€ºá€™á€Šá€º"
                        : "Commit & Auto-Login"}
                  </PrimaryButton>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="text-center py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-lg animate-pulse">
                  <KeyRound size={34} />
                </div>

                <h1 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {currentLang === "mm"
                    ? "á€…á€€á€¬á€¸á€á€¾á€€á€º á€¡á€±á€¬á€„á€ºá€™á€¼á€„á€ºá€…á€½á€¬ á€•á€¼á€±á€¬á€„á€ºá€¸á€œá€²á€•á€¼á€®á€¸á€•á€«á€•á€¼á€®"
                    : "Clearance Granted"}
                </h1>

                <p className="mt-3 text-xs font-bold leading-relaxed text-slate-400 max-w-sm mx-auto">
                  {currentLang === "mm"
                    ? "á€…á€”á€…á€ºá€’á€€á€ºá€›á€¾á€ºá€˜á€¯á€á€ºá€žá€­á€¯á€· á€¡á€œá€­á€¯á€¡á€œá€»á€±á€¬á€€á€º á€á€±á€«á€ºá€†á€±á€¬á€„á€ºá€žá€½á€¬á€¸á€”á€±á€•á€«á€žá€Šá€ºá‹ á€á€±á€á€¹á€á€…á€±á€¬á€„á€·á€ºá€†á€­á€¯á€„á€ºá€¸á€•á€±á€¸á€•á€«á‹"
                    : "Cryptographic handshakes completed. Redirecting your authenticated session to the Central Executive Dashboard..."}
                </p>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs font-black text-amber-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Rerouting to /admin/dashboard</span>
                </div>
              </div>
            )}

            {step !== "success" && (
              <Link
                href="/admin/login"
                className="mt-6 flex items-center justify-center gap-2 text-xs font-black text-slate-500 transition hover:text-amber-400"
              >
                <Lock size={13} />
                {currentLang === "mm" ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° á€á€„á€ºá€•á€±á€«á€€á€ºá€žá€­á€¯á€· á€•á€¼á€”á€ºá€žá€½á€¬á€¸á€™á€Šá€º" : "Return to Executive Sign-In"}
              </Link>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .hero-title-amber {
          text-shadow:
            2px 2px 0 #451a03,
            0px 2px 0 #d97706,
            2px 0px 0 #92400e,
            0 8px 22px rgba(0,0,0,.85);
        }

        .hero-title-white {
          text-shadow:
            1px 1px 0 rgba(255,255,255,.35),
            0 8px 22px rgba(0,0,0,.75);
        }

        .hero-subtitle {
          text-shadow: 0 4px 20px rgba(0,0,0,.8);
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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 grayscale filter"
        style={{
          backgroundImage: "url('/images/background/background-0.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(30,41,59,0.5),transparent_40%)]" />
    </>
  );
}

function MinimalText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-center text-xs font-black tracking-wide text-amber-400 sm:text-sm">
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
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <input
        {...props}
        required
        className={`h-11 w-full rounded-xl border bg-slate-950 px-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:ring-4 ${
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/15"
            : "border-slate-800 focus:border-amber-500 focus:ring-amber-500/15"
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
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">
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
          className={`h-11 w-full rounded-xl border bg-slate-950 px-3 pr-11 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:ring-4 ${
            error
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/15"
              : "border-slate-800 focus:border-amber-500 focus:ring-amber-500/15"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-amber-400"
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
    <p className="mt-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400">
      {message}
    </p>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black text-red-400 shadow-sm">
      <Lock size={16} className="shrink-0 text-red-400" />
      <span>{message}</span>
    </div>
  );
}

function getEmailError(email: string, lang: string) {
  const value = email.trim();
  if (!value) return "";

  if (!value.includes("@")) {
    return lang === "mm"
      ? "Email á€á€½á€„á€º @ á€•á€«á€á€„á€ºá€›á€™á€Šá€ºá‹"
      : "Malformed administrative identifier (@ missing).";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return lang === "mm"
      ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° Email á€•á€¯á€¶á€…á€¶ á€™á€™á€¾á€”á€ºá€€á€”á€ºá€•á€«á‹"
      : "Invalid domain structure for executive clearance.";
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
      ? "á€¡á€¯á€•á€ºá€á€»á€¯á€•á€ºá€žá€° á€œá€»á€¾á€­á€¯á€·á€á€¾á€€á€ºá€€á€¯á€’á€ºá€žá€Šá€º á€¡á€”á€Šá€ºá€¸á€†á€¯á€¶á€¸ á€‚á€á€”á€ºá€¸ áˆ á€œá€¯á€¶á€¸ á€›á€¾á€­á€›á€™á€Šá€ºá‹"
      : "Executive keys require a minimum entropy length of 8 characters.";
  }

  if (strength.passedCount < 3) {
    return lang === "mm"
      ? "á€…á€¬á€œá€¯á€¶á€¸á€¡á€€á€¼á€®á€¸áŠ á€¡á€žá€±á€¸áŠ á€”á€¶á€•á€«á€á€º á€žá€­á€¯á€·á€™á€Ÿá€¯á€á€º á€žá€„á€ºá€¹á€€á€±á€ á€¡á€”á€Šá€ºá€¸á€†á€¯á€¶á€¸ áƒ á€™á€»á€­á€¯á€¸ á€•á€«á€á€„á€ºá€›á€™á€Šá€ºá‹"
      : "Key complexity requirement failed: incorporate at least 3 character sets.";
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
    return lang === "mm" ? "á€…á€€á€¬á€¸á€á€¾á€€á€ºá€™á€»á€¬á€¸ á€™á€€á€­á€¯á€€á€ºá€Šá€®á€•á€«á‹" : "Cryptographic verification mismatch.";
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
    { pass: strength.hasUpper, label: lang === "mm" ? "ABC á€¡á€€á€¼á€®á€¸" : "Uppercase" },
    { pass: strength.hasLower, label: lang === "mm" ? "abc á€¡á€žá€±á€¸" : "Lowercase" },
    { pass: strength.hasNumber, label: lang === "mm" ? "123 á€”á€¶á€•á€«á€á€º" : "Digits" },
    { pass: strength.hasSpecial, label: "Symbol (@#$)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 pt-1">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-black tracking-wide transition ${
            item.pass
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-slate-800 bg-slate-950 text-slate-600"
          }`}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}