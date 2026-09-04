// file: app/staff/forgot-password/page.tsx

"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/providers";

const OTP_LENGTH = 6;

type Step = "email" | "otp" | "password" | "success";

export default function StaffForgotPasswordPage() {
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

  const steps = ["Staff Email", "Secure OTP", "New Key", "Dashboard"];
  const activeStepIndex =
    step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;

  // STRICT STAFF/ADMIN SESSION VERIFICATION
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      fetch("/api/me")
        .then((res) => res.json())
        .then((data) => {
          const role = data?.role?.toLowerCase();
          if (role === "staff" || role === "admin") {
            window.location.replace("/staff/dashboard");
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
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (
      focused.confirmPassword &&
      confirmPassword.length > 0 &&
      !confirmPasswordError
    ) {
      setShowMatchSuccess(true);
      const timeout = window.setTimeout(() => setShowMatchSuccess(false), 5000);
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
    setFocused((prev) => ({ ...prev, email: true }));

    const currentEmailError = getEmailError(email, currentLang);
    if (currentEmailError) {
      setMessage(currentEmailError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/staff/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to initiate staff reset.");
        return;
      }

      setEmail(email.trim().toLowerCase());
      setOtp(Array(OTP_LENGTH).fill(""));
      setStep("otp");
      window.setTimeout(() => refs.current[0]?.focus(), 100);
    } catch (error) {
      console.error("Staff Send OTP failed:", error);
      setMessage("System verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otpCode.length !== OTP_LENGTH) {
      setMessage("Please enter the full 6-digit security token.");
      return;
    }
    setMessage("");
    setStep("password");
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFocused({ email: true, password: true, confirmPassword: true });

    const currentPasswordError = getPasswordError(newPassword, strength, currentLang);
    const currentConfirmError = getConfirmPasswordError(newPassword, confirmPassword, currentLang);

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
      const res = await fetch("/api/staff/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpCode,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Staff credential update rejected.");
        return;
      }

      setStep("success");

      const loginResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: newPassword,
        redirect: false,
        callbackUrl: "/staff/dashboard",
      });

      if (loginResult?.ok) {
        window.location.replace("/staff/dashboard");
        return;
      }

      window.setTimeout(() => {
        window.location.replace("/staff/login");
      }, 1500);
    } catch (error) {
      console.error("Staff Reset password failed:", error);
      setMessage("Staff credential update failed.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-card-in flex items-center gap-3 rounded-3xl border border-white/20 bg-white/10 px-6 py-5 text-sm font-black shadow-xl backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#77edec]" />
          Verifying staff clearance...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/background/background-0.jpg"
        alt="University of Computer Studies, Hinthada"
        fill
        priority
        sizes="100vw"
        className="hero-bg-motion object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/58 to-cyan-950/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,201,200,0.35),transparent_32%),radial-gradient(circle_at_86%_78%,rgba(0,191,196,0.28),transparent_30%)]" />

      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#00BFC4]/25 blur-3xl float-one" />
      <div className="pointer-events-none absolute -right-24 bottom-14 h-80 w-80 rounded-full bg-[#f1cd72]/20 blur-3xl float-two" />

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_480px] lg:px-8">
        
        {/* Left Hero Content */}
        <div className="admin-hero-in max-w-4xl">
          <div className="admin-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-black text-white shadow-xl backdrop-blur-xl">
            <Sparkles className="sparkle h-4 w-4 text-[#f1cd72]" />
             Account Recovery
          </div>

          <h1 className="admin-title mt-6 text-5xl font-black leading-tight tracking-tight drop-shadow-2xl sm:text-6xl lg:text-7xl">
            <span className="block text-[#f1cd72] hero-stroke-gold">
              Alumni Network
            </span>
            <span className="block text-white hero-stroke-gold">
              Staff Reset
            </span>
          </h1>

          <p className="admin-fade-up-delay mt-5 max-w-2xl text-base font-semibold leading-8 text-white/80 sm:text-lg">
            Execute an encrypted passkey override. All staff verification tokens and recovery handshakes are logged strictly to the central security audit ledger.
          </p>
        </div>

        {/* Right Form Card Layout */}
        <div className="animate-card-in w-full">
          <div className="rounded-[34px] border border-white/25 bg-white/90 p-5 text-slate-950 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-7">
            
            <Link
              href="/staff/login"
              className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-xl shadow-cyan-500/25">
                <KeyRound className="h-8 w-8" />
              </div>

              <h2 className="mt-4 text-3xl font-black">Recovery Portal</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Authorized Staff Access
              </p>
            </div>

            {/* Step Indicator Pill */}
            <div className="my-6 grid grid-cols-4 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-xl py-2.5 text-center text-[10px] font-black transition sm:text-xs ${
                    activeStepIndex >= index
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {message && (
              <div className="animate-error mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                {message}
              </div>
            )}

            {/* STEP 1: EMAIL */}
            {step === "email" && (
              <form onSubmit={sendOtp} className="space-y-5">
                <InputField
                  label="Staff Email"
                  type="email"
                  value={email}
                  onChange={(val) => { setEmail(val); setMessage(""); }}
                  placeholder="staff@ucsh.edu.mm"
                  icon={<Mail className="h-5 w-5" />}
                  error={showEmailError ? emailError : ""}
                />

                <PrimaryButton disabled={!canSendOtp || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Requesting Clearance...
                    </>
                  ) : (
                    <>
                      Transmit Security Token
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </PrimaryButton>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-5">
                <p className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-center text-sm font-black text-[#008B8B]">
                  Token sent to: {email}
                </p>

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { refs.current[index] = el; }}
                      value={digit}
                      inputMode="numeric"
                      maxLength={1}
                      onChange={(event) => changeOtp(event.target.value, index)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      className="h-13 rounded-2xl border border-slate-200 bg-slate-50 text-center text-lg font-black text-slate-900 outline-none transition focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    />
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setMessage(""); setStep("email"); }}
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                  >
                    Abort
                  </button>

                  <PrimaryButton disabled={otpCode.length !== OTP_LENGTH}>
                    Authorize Token
                  </PrimaryButton>
                </div>
              </form>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {step === "password" && (
              <form onSubmit={resetPassword} className="space-y-4">
                <PasswordField
                  label="New Staff Key"
                  value={newPassword}
                  onChange={(val) => { setNewPassword(val); setMessage(""); }}
                  show={showPassword}
                  setShow={setShowPassword}
                  placeholder="Enter encrypted passkey"
                  error={showPasswordError ? passwordError : ""}
                />

                {showPasswordHelp && (
                  <PasswordStrength strength={strength} />
                )}

                <PasswordField
                  label="Confirm Staff Key"
                  value={confirmPassword}
                  onChange={(val) => { setConfirmPassword(val); setMessage(""); }}
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                  placeholder="Re-verify passkey"
                  error={showConfirmError ? confirmPasswordError : ""}
                />

                {showMatchSuccess && (
                  <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-700">
                    Passkey parity verified.
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setMessage(""); setStep("otp"); }}
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                  >
                    Back
                  </button>

                  <PrimaryButton disabled={!canReset || loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Hydrating...
                      </>
                    ) : (
                      "Commit & Login"
                    )}
                  </PrimaryButton>
                </div>
              </form>
            )}

            {/* STEP 4: SUCCESS & REROUTE */}
            {step === "success" && (
              <div className="text-center py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg animate-bounce">
                  <CheckCircle2 size={36} />
                </div>

                <h3 className="mt-5 text-2xl font-black text-slate-900">
                  Clearance Granted
                </h3>

                <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500 max-w-xs mx-auto">
                  Cryptographic override successful. Rerouting authenticated session directly to the Staff Dashboard...
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-50 px-4 py-2.5 text-xs font-black text-[#008B8B]">
                  <Loader2 size={16} className="animate-spin" />
                  Connecting to /staff/dashboard
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-xs font-bold text-slate-400">
              © {new Date().getFullYear()} Alumni Network • Staff Control
            </p>
          </div>
        </div>
      </section>

      <style>{`
        .hero-bg-motion {
          animation: bgZoom 12s ease-in-out infinite alternate;
        }

        .hero-stroke-gold {
          text-shadow:
            2px 2px 0 #673a06,
            0px -2px 0 #061720,
            0px 2px 0 #f49325,
            2px 0px 0 #c67f0d,
            0 18px 55px rgba(0,0,0,.45);
        }

        .hero-stroke-white {
          -webkit-text-stroke: 0.4px rgba(174, 174, 174, 0.6);
          text-shadow:
            2px 2px 0 #f5f5f5,
            0px -2px 0 #e6f6ff,
            0px 2px 0 #00ffd9,
            -2px 0px 0 #faffb7,
            2px 0px 0 #9f9e9b,
            0 18px 55px rgba(0,0,0,.45);
        }

        .sparkle {
          animation: sparklePulse 1.8s ease-in-out infinite;
        }

        .float-one {
          animation: floatOne 8s ease-in-out infinite;
        }

        .float-two {
          animation: floatTwo 9s ease-in-out infinite;
        }

        .admin-hero-in {
          animation: adminSlideIn .85s ease-out both;
        }

        .animate-card-in {
          animation: adminCardIn .9s ease-out .15s both;
        }

        .admin-title {
          animation: adminFadeUp .85s ease-out .18s both, adminTitleGlow 3.2s ease-in-out infinite;
        }

        .admin-fade-up {
          animation: adminFadeUp .75s ease-out .1s both;
        }

        .admin-fade-up-delay {
          animation: adminFadeUp .75s ease-out .28s both;
        }

        .animate-error {
          animation: errorShake .35s ease-out both;
        }

        @keyframes bgZoom {
          from { transform: scale(1.04) translate3d(0, 0, 0); }
          to { transform: scale(1.1) translate3d(-1.2%, -1%, 0); }
        }

        @keyframes adminFadeUp {
          0% { opacity: 0; transform: translateY(34px); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes adminSlideIn {
          0% { opacity: 0; transform: translateX(-46px) scale(.98); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes adminCardIn {
          0% { opacity: 0; transform: translateX(46px) scale(.96); filter: blur(8px); }
          100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }

        @keyframes adminTitleGlow {
          0%, 100% { text-shadow: 0 18px 50px rgba(0,0,0,.35); }
          50% { text-shadow: 0 18px 70px rgba(119,237,236,.45); }
        }

        @keyframes sparklePulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: .8; }
          50% { transform: scale(1.25) rotate(16deg); opacity: 1; }
        }

        @keyframes floatOne {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(28px, 20px) scale(1.08); }
        }

        @keyframes floatTwo {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-24px, -18px) scale(1.06); }
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </main>
  );
}

// EXACT MATCH WITH STAFF LOGIN INPUTS
function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  error = "",
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2 text-left">
      <label className="block text-sm font-black text-slate-700">{label}</label>

      <div className="group relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]">
          {icon}
        </div>

        <input
          type={type}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-14 w-full rounded-2xl border bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            error 
              ? "border-red-300 focus:border-red-500 focus:ring-red-100" 
              : "border-slate-200 focus:border-[#00BFC4] focus:ring-cyan-100"
          }`}
        />
      </div>
      {error && <p className="text-xs font-bold text-red-500 pl-1">{error}</p>}
    </div>
  );
}

function PasswordField({
  label = "Password",
  value,
  onChange,
  show,
  setShow,
  placeholder = "Enter password",
  error = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2 text-left">
      <label className="block text-sm font-black text-slate-700">{label}</label>

      <div className="group relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]">
          <LockKeyhole className="h-5 w-5" />
        </div>

        <input
          type={show ? "text" : "password"}
          minLength={8}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-14 w-full rounded-2xl border bg-slate-50 pl-12 pr-14 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            error 
              ? "border-red-300 focus:border-red-500 focus:ring-red-100" 
              : "border-slate-200 focus:border-[#00BFC4] focus:ring-cyan-100"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#008B8B]"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="text-xs font-bold text-red-500 pl-1">{error}</p>}
    </div>
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
      className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function getEmailError(email: string, lang: string) {
  const value = email.trim();
  if (!value) return "";
  if (!value.includes("@")) return "Staff email must contain @ symbol.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address format.";
  return "";
}

function getPasswordError(password: string, strength: ReturnType<typeof getPasswordStrength>, lang: string) {
  if (!password) return "";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (strength.passedCount < 3) return "Password requires at least 3 types (Upper, Lower, Number, Symbol).";
  return "";
}

function getConfirmPasswordError(password: string, confirmPassword: string, lang: string) {
  if (!confirmPassword) return "";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
}

function getPasswordStrength(password: string) {
  const checks = [/[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  return { passedCount: checks.filter(Boolean).length, hasUpper: checks[0], hasLower: checks[1], hasNumber: checks[2], hasSpecial: checks[3] };
}

function PasswordStrength({ strength }: { strength: ReturnType<typeof getPasswordStrength> }) {
  const items = [
    { pass: strength.hasUpper, label: "ABC Upper" },
    { pass: strength.hasLower, label: "abc Lower" },
    { pass: strength.hasNumber, label: "123 Number" },
    { pass: strength.hasSpecial, label: "@#$ Symbol" },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 pt-1">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl px-3 py-2 text-center text-xs font-black ${
            item.pass ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
          }`}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}