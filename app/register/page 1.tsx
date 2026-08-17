// file: app/register/page.tsx

"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useI18n } from "@/components/providers";

const OTP_LENGTH = 6;

export default function RegisterPage() {
  const { lang } = useI18n();

  const [step, setStep] = useState<"info" | "otp" | "success">("info");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [focused, setFocused] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);

  const nameError = getNameError(name, lang);
  const emailError = getEmailError(email, lang);
  const strength = getPasswordStrength(password);
  const passwordError = getPasswordError(password, strength, lang);
  const confirmPasswordError = getConfirmPasswordError(
    password,
    confirmPassword,
    lang
  );

  const isPasswordValid = password.length >= 8 && strength.passedCount >= 3;

  const showNameError = focused.name && nameError;
  const showEmailError = focused.email && emailError;
  const showPasswordError = focused.password && passwordError;
  const showPasswordHelp =
    focused.password && password.length > 0 && !isPasswordValid;
  const showConfirmError = focused.confirmPassword && confirmPasswordError;

  const canRegister =
    !nameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    isPasswordValid &&
    confirmPassword.length > 0 &&
    !loading;

  useEffect(() => {
    if (
      focused.confirmPassword &&
      confirmPassword.length > 0 &&
      !confirmPasswordError
    ) {
      setShowMatchSuccess(true);

      const timeout = setTimeout(() => {
        setShowMatchSuccess(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }

    setShowMatchSuccess(false);
  }, [focused.confirmPassword, confirmPassword, confirmPasswordError]);

  function otpValue() {
    return otp.join("");
  }

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
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setFocused({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (nameError) return setMessage(nameError);
    if (emailError) return setMessage(emailError);
    if (passwordError) return setMessage(passwordError);
    if (confirmPasswordError) return setMessage(confirmPasswordError);

    setLoading(true);
    setMessage("");

    const emailValue = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: emailValue,
          password,
          lang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Registration failed.");
        return;
      }

      setEmail(emailValue);
      setStep("otp");
    } catch (error) {
      console.error("Register failed:", error);
      setMessage(
        lang === "mm"
          ? "စာရင်းသွင်းမှု မအောင်မြင်ပါ။"
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const code = otpValue();

    if (code.length !== OTP_LENGTH) {
      setMessage(
        lang === "mm"
          ? "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။"
          : "OTP must be 6 digits."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Invalid OTP.");
        return;
      }

      setStep("success");
    } catch (error) {
      console.error("Verify OTP failed:", error);
      setMessage(lang === "mm" ? "OTP စစ်ဆေးမှု မအောင်မြင်ပါ။" : "OTP failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mm relative flex min-h-screen items-center justify-center overflow-hidden bg-[#94EFEE] px-4 py-10 text-slate-950">
      <GradientBackground />

      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-2 animate-pulse bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#42D3E2]" />

        {step === "info" && (
          <>
            <h1 className="relative mb-8 text-center text-3xl font-black tracking-tight text-slate-950">
              {lang === "mm" ? "အကောင့်ဖန်တီးမည်" : "Create Account"}
            </h1>

            <form onSubmit={register} className="relative space-y-5">
              <Input
                name="name"
                label={lang === "mm" ? "အမည်အပြည့်အစုံ" : "Full name"}
                placeholder={
                  lang === "mm"
                    ? "အနည်းဆုံး ၅ လုံး ထည့်ပါ"
                    : "At least 5 characters"
                }
                icon={<UserRound size={20} />}
                value={name}
                onFocus={() =>
                  setFocused((prev) => ({ ...prev, name: true }))
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setName(event.target.value);
                  setMessage("");
                }}
                error={showNameError ? nameError : ""}
              />

              <Input
                name="email"
                label="Email"
                type="email"
                placeholder="example@gmail.com"
                icon={<Mail size={20} />}
                value={email}
                onFocus={() =>
                  setFocused((prev) => ({ ...prev, email: true }))
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(event.target.value);
                  setMessage("");
                }}
                error={showEmailError ? emailError : ""}
              />

              <div className="space-y-2">
                <PasswordInput
                  name="password"
                  label={lang === "mm" ? "စကားဝှက်" : "Password"}
                  placeholder={
                    lang === "mm"
                      ? "အနည်းဆုံး ၈ လုံး"
                      : "At least 8 characters"
                  }
                  value={password}
                  onFocus={() =>
                    setFocused((prev) => ({ ...prev, password: true }))
                  }
                  onChange={(value: string) => {
                    setPassword(value);
                    setMessage("");
                  }}
                  show={showPassword}
                  setShow={setShowPassword}
                  error={showPasswordError ? passwordError : ""}
                />

                {showPasswordHelp && (
                  <PasswordStrength strength={strength} lang={lang} />
                )}
              </div>

              <PasswordInput
                name="confirmPassword"
                label={
                  lang === "mm" ? "စကားဝှက် အတည်ပြုရန်" : "Confirm password"
                }
                placeholder={
                  lang === "mm"
                    ? "စကားဝှက် ထပ်ထည့်ပါ"
                    : "Enter password again"
                }
                value={confirmPassword}
                onFocus={() =>
                  setFocused((prev) => ({
                    ...prev,
                    confirmPassword: true,
                  }))
                }
                onChange={(value: string) => {
                  setConfirmPassword(value);
                  setMessage("");
                }}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                error={showConfirmError ? confirmPasswordError : ""}
              />

              {showMatchSuccess && (
                <SuccessBox
                  message={
                    lang === "mm" ? "စကားဝှက် တူညီပါသည်။" : "Passwords match."
                  }
                />
              )}

              {message && <ErrorBox message={message} />}

              <PrimaryButton disabled={!canRegister}>
                {loading
                  ? lang === "mm"
                    ? "ပို့နေသည်..."
                    : "Sending..."
                  : lang === "mm"
                    ? "OTP ပို့မည်"
                    : "Send OTP"}
              </PrimaryButton>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <Header
              icon={<ShieldCheck size={28} />}
              title={lang === "mm" ? "Email အတည်ပြုမည်" : "Verify Email"}
              description={
                lang === "mm"
                  ? "သင့် Email သို့ ပို့ထားသော OTP ကို ထည့်ပါ။"
                  : "Enter the OTP sent to your email."
              }
            />

            <div className="relative mb-6 rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] px-4 py-3 text-center text-sm font-black text-[#008B8B] shadow-sm">
              {email}
            </div>

            <form onSubmit={verifyOtp} className="relative space-y-5">
              <OtpBoxes
                otp={otp}
                refs={refs}
                onChange={changeOtp}
                onKeyDown={handleOtpKeyDown}
              />

              {message && <ErrorBox message={message} />}

              <PrimaryButton disabled={loading}>
                {loading
                  ? lang === "mm"
                    ? "စစ်ဆေးနေသည်..."
                    : "Verifying..."
                  : lang === "mm"
                    ? "OTP အတည်ပြုမည်"
                    : "Verify OTP"}
              </PrimaryButton>

              <button
                type="button"
                onClick={() => {
                  setStep("info");
                  setMessage("");
                  setOtp(Array(OTP_LENGTH).fill(""));
                }}
                className="flex w-full items-center justify-center gap-2 text-sm font-black text-[#008B8B] transition hover:underline"
              >
                <ArrowLeft size={16} />
                {lang === "mm" ? "ပြန်သွားမည်" : "Back"}
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="relative text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg">
              <CheckCircle2 size={34} />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              {lang === "mm" ? "အကောင့်ဖန်တီးပြီးပါပြီ" : "Account Created"}
            </h1>

            <p className="mt-3 text-sm font-bold leading-relaxed text-slate-500">
              {lang === "mm"
                ? "ယခု ပြန်လည်ဝင်ရောက်ပြီး Alumni Network ကို အသုံးပြုနိုင်ပါပြီ။"
                : "You can now login and start using Alumni Network."}
            </p>

            <Link
              href="/login"
              className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black tracking-wide text-white shadow-lg transition hover:scale-[1.02]"
            >
              {lang === "mm" ? "ဝင်မည်" : "Login"}
            </Link>
          </div>
        )}

        {step !== "success" && (
          <p className="relative mt-8 text-center text-sm font-bold text-slate-500">
            {lang === "mm"
              ? "စာရင်းသွင်းပြီးပါသလား?"
              : "Already registered?"}{" "}
            <Link
              href="/login"
              className="font-black text-[#008B8B] transition hover:underline"
            >
              {lang === "mm" ? "ဝင်မည်" : "Login"}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

function getNameError(name: string, lang: string) {
  const value = name.trim();

  if (!value) return "";

  if (value.length < 5) {
    return lang === "mm"
      ? "အမည်သည် အနည်းဆုံး စာလုံး ၅ လုံး ဖြစ်ရမည်။"
      : "Name must be at least 5 characters.";
  }

  return "";
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
  lang: string
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
  lang: string
) {
  if (!confirmPassword) return "";

  if (password !== confirmPassword) {
    return lang === "mm" ? "စကားဝှက် မတူပါ။" : "Passwords do not match.";
  }

  return "";
}

function getPasswordStrength(password: string) {
  const checks = {
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasMinLength: password.length >= 8,
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  return {
    ...checks,
    passedCount,
  };
}

function PasswordStrength({
  strength,
  lang,
}: {
  strength: ReturnType<typeof getPasswordStrength>;
  lang: string;
}) {
  const percentage = (strength.passedCount / 5) * 100;

  const color =
    strength.passedCount <= 1
      ? "from-red-500 to-red-400"
      : strength.passedCount === 2
        ? "from-orange-500 to-yellow-400"
        : strength.passedCount === 3
          ? "from-yellow-400 to-lime-400"
          : strength.passedCount === 4
            ? "from-cyan-500 to-teal-400"
            : "from-emerald-500 to-green-400";

  const items = [
    {
      passed: strength.hasMinLength,
      text: lang === "mm" ? "အနည်းဆုံး ၈ လုံး" : "8+ characters",
    },
    {
      passed: strength.hasUppercase,
      text: lang === "mm" ? "အက္ခရာအကြီး" : "Uppercase",
    },
    {
      passed: strength.hasLowercase,
      text: lang === "mm" ? "အက္ခရာအသေး" : "Lowercase",
    },
    {
      passed: strength.hasNumber,
      text: lang === "mm" ? "ဂဏန်း" : "Number",
    },
    {
      passed: strength.hasSpecial,
      text: lang === "mm" ? "Special character" : "Special character",
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-top-2 space-y-3 duration-200">
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.text}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
              item.passed
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <CheckCircle2 size={14} />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative mb-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg">
        {icon}
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mx-auto mt-3 max-w-sm text-sm font-bold leading-relaxed text-slate-500">
        {description}
      </p>
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
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] via-[#25C9C8] to-[#008B8B] text-sm font-black tracking-wide text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function OtpBoxes({ otp, refs, onChange, onKeyDown }: any) {
  return (
    <div className="flex justify-center gap-2">
      {otp.map((digit: string, index: number) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => onChange(e.target.value, index)}
          onKeyDown={(e) => onKeyDown(e, index)}
          maxLength={1}
          inputMode="numeric"
          className="h-12 w-12 rounded-2xl border border-[#25C9C8]/30 bg-[#F8FFFF] text-center text-xl font-black text-slate-900 shadow-sm outline-none transition focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-[#00BFC4]/10"
        />
      ))}
    </div>
  );
}

function Input({ label, icon, error, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700">{label}</label>

      <div className="group relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]">
          {icon}
        </div>

        <input
          {...props}
          required
          className={`w-full rounded-2xl border bg-[#F8FFFF] px-12 py-3.5 text-sm font-bold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
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
        <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]" />

        <input
          name={name}
          type={show ? "text" : "password"}
          minLength={8}
          required
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-[#F8FFFF] px-12 py-3.5 pr-14 text-sm font-bold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-[#25C9C8]/30 focus:border-[#00BFC4] focus:ring-[#00BFC4]/10"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-[#94EFEE]/60 hover:text-[#008B8B]"
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

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-top-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 duration-150">
      {message}
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