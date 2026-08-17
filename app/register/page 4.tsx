// file: app/register/page.tsx

"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
} from "lucide-react";

import { useI18n } from "@/components/providers";

const OTP_LENGTH = 6;
const PREFIX = "CU(Hinthada)";

export default function RegisterPage() {
  const { lang } = useI18n();

  const [step, setStep] = useState<"approval" | "info" | "otp" | "success">(
    "approval",
  );

  const router = useRouter();
const { status } = useSession();

useEffect(() => {
  if (status === "authenticated") {
    router.replace("/feeds");
  }
}, [status, router]);

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [approved, setApproved] = useState(false);
  const [approvalChecking, setApprovalChecking] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [checkedStudentId, setCheckedStudentId] = useState("");

  const [focused, setFocused] = useState({
    name: false,
    number: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);

  const nameError = getNameError(name, lang);
  const numberError = getNumberError(number, lang);
  const emailError = getEmailError(email, lang);
  const strength = getPasswordStrength(password);
  const passwordError = getPasswordError(password, strength, lang);
  const confirmPasswordError = getConfirmPasswordError(
    password,
    confirmPassword,
    lang,
  );

  const isPasswordValid = password.length >= 8 && strength.passedCount >= 3;

  const canCheckApproval =
    !nameError &&
    !numberError &&
    name.trim().length > 0 &&
    number.trim().length > 0 &&
    !approvalChecking;

  const canRegister =
    approved &&
    !nameError &&
    !numberError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    name.trim().length > 0 &&
    number.trim().length > 0 &&
    email.trim().length > 0 &&
    isPasswordValid &&
    confirmPassword.length > 0 &&
    !loading;

  useEffect(() => {
    setApproved(false);
    setApprovalMessage("");
    setCheckedStudentId("");
  }, [name, number]);

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
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function checkApprovedStudent() {
    setFocused((prev) => ({ ...prev, name: true, number: true }));
    setMessage("");
    setApprovalMessage("");
    setApproved(false);

    if (nameError) return setApprovalMessage(nameError);
    if (numberError) return setApprovalMessage(numberError);

    setApprovalChecking(true);

    try {
      const res = await fetch("/api/register/check-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          number: number.trim(),
        }),
      });

      const data = await res.json();

      setApproved(Boolean(data.approved));
      setCheckedStudentId(data.studentId || `${PREFIX} ${number.trim()}`);
      setApprovalMessage(data.message || "");

      if (data.approved) {
        setTimeout(() => setStep("info"), 700);
      }

      if (!res.ok) setApproved(false);
    } catch {
      setApproved(false);
      setApprovalMessage(
        lang === "mm"
          ? "Admin approval စစ်ဆေးမှု မအောင်မြင်ပါ။"
          : "Admin approval check failed.",
      );
    } finally {
      setApprovalChecking(false);
    }
  }

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFocused({
      name: true,
      number: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (nameError) return setMessage(nameError);
    if (numberError) return setMessage(numberError);

    if (!approved) {
      return setMessage(
        lang === "mm"
          ? "OTP မပို့မီ Admin Approval ကို စစ်ဆေးပါ။"
          : "Please check admin approval before sending OTP.",
      );
    }

    if (emailError) return setMessage(emailError);
    if (passwordError) return setMessage(passwordError);
    if (confirmPasswordError) return setMessage(confirmPasswordError);

    setLoading(true);
    setMessage("");

    const emailValue = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          number: number.trim(),
          studentId: checkedStudentId || `${PREFIX} ${number.trim()}`,
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
          : "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const code = otpValue();

    if (code.length !== OTP_LENGTH) {
      setMessage(
        lang === "mm"
          ? "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။"
          : "OTP must be 6 digits.",
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
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
    <main className="mm page-wrapper relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="relative z-10 w-full max-w-md">
        <div className="ucsh-card ucsh-animate overflow-hidden p-0">
          <div className="h-1.5 bg-gradient-to-r from-[var(--ucsh-primary)] via-[var(--ucsh-secondary)] to-[var(--ucsh-accent)]" />

          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--ucsh-primary)]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-white/60 blur-3xl" />

            {step === "approval" && (
              <div className="relative space-y-5">
                <MinimalText>
                  {lang === "mm"
                    ? "Admin approval ရပြီးမှ registration ဆက်လုပ်နိုင်ပါသည်။"
                    : "You can continue registration only after admin approval."}
                </MinimalText>

                <Input
                  name="name"
                  label={lang === "mm" ? "အမည်အပြည့်အစုံ" : "Full name"}
                  placeholder="AungPyaeSone"
                  value={name}
                  onFocus={() =>
                    setFocused((prev) => ({ ...prev, name: true }))
                  }
                  onChange={(event) => {
                    setName(event.target.value);
                    setMessage("");
                  }}
                  error={focused.name ? nameError : ""}
                />

                <StudentNumberInput
                  number={number}
                  error={focused.number ? numberError : ""}
                  lang={lang}
                  onFocus={() =>
                    setFocused((prev) => ({ ...prev, number: true }))
                  }
                  onChange={(value) => {
                    setNumber(value);
                    setMessage("");
                  }}
                />

                <button
                  type="button"
                  onClick={checkApprovedStudent}
                  disabled={!canCheckApproval}
                  className="ucsh-btn h-14 w-full text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {approvalChecking && (
                    <Loader2 size={18} className="animate-spin" />
                  )}

                  {approvalChecking
                    ? lang === "mm"
                      ? "စစ်ဆေးနေသည်..."
                      : "Checking..."
                    : lang === "mm"
                      ? "Admin Approval စစ်မည်"
                      : "Check Admin Approval"}
                </button>

                {approvalMessage && (
                  <ApprovalBox approved={approved} message={approvalMessage} />
                )}
              </div>
            )}

            {step === "info" && (
              <form onSubmit={register} className="relative space-y-5">
                <MinimalText>
                  {lang === "mm"
                    ? "Email နှင့် password ထည့်ပြီး OTP ပို့ပါ။"
                    : "Enter your email and password to receive OTP."}
                </MinimalText>

                <Input
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onFocus={() =>
                    setFocused((prev) => ({ ...prev, email: true }))
                  }
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setMessage("");
                  }}
                  error={focused.email ? emailError : ""}
                />

                <div className="space-y-2">
                  <PasswordInput
                    name="password"
                    label={lang === "mm" ? "စကားဝှက်" : "Password"}
                    placeholder={
                      lang === "mm" ? "အနည်းဆုံး ၈ လုံး" : "At least 8 characters"
                    }
                    value={password}
                    onFocus={() =>
                      setFocused((prev) => ({ ...prev, password: true }))
                    }
                    onChange={(value) => {
                      setPassword(value);
                      setMessage("");
                    }}
                    show={showPassword}
                    setShow={setShowPassword}
                    error={focused.password ? passwordError : ""}
                  />

                  {focused.password && password.length > 0 && !isPasswordValid && (
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
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setMessage("");
                  }}
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                  error={focused.confirmPassword ? confirmPasswordError : ""}
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

                <BackButton onClick={() => setStep("approval")}>
                  {lang === "mm" ? "Approval ပြန်စစ်မည်" : "Back to approval"}
                </BackButton>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="relative space-y-5">
                <MinimalText>
                  {lang === "mm"
                    ? "Email သို့ ပို့ထားသော OTP ၆ လုံး ထည့်ပါ။"
                    : "Enter the 6-digit OTP sent to your email."}
                </MinimalText>

                <InfoBox>{email}</InfoBox>

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

                <BackButton
                  onClick={() => {
                    setStep("info");
                    setMessage("");
                    setOtp(Array(OTP_LENGTH).fill(""));
                  }}
                >
                  {lang === "mm" ? "ပြန်သွားမည်" : "Back"}
                </BackButton>
              </form>
            )}

            {step === "success" && (
              <div className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg">
                  <CheckCircle2 size={34} />
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-[var(--ucsh-text)]">
                  {lang === "mm" ? "အကောင့်ဖန်တီးပြီးပါပြီ" : "Account Created"}
                </h1>

                <p className="mt-3 text-sm font-bold leading-relaxed text-[var(--ucsh-muted)]">
                  {lang === "mm"
                    ? "ယခု ပြန်လည်ဝင်ရောက်ပြီး Alumni Network ကို အသုံးပြုနိုင်ပါပြီ။"
                    : "You can now login and start using Alumni Network."}
                </p>

                <Link
                  href="/login"
                  className="ucsh-btn mt-6 h-14 w-full text-sm font-black"
                >
                  {lang === "mm" ? "ဝင်မည်" : "Login"}
                </Link>
              </div>
            )}

            {step !== "success" && (
              <p className="relative mt-8 text-center text-sm font-bold text-[var(--ucsh-muted)]">
                {lang === "mm" ? "စာရင်းသွင်းပြီးပါသလား?" : "Already registered?"}{" "}
                <Link
                  href="/login"
                  className="font-black text-[var(--ucsh-primary-dark)] transition hover:text-[var(--ucsh-primary)] hover:underline"
                >
                  {lang === "mm" ? "ဝင်မည်" : "Login"}
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
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

function getNumberError(number: string, lang: string) {
  const value = number.trim();

  if (!value) return "";

  if (!/^[0-9]+$/.test(value)) {
    return lang === "mm"
      ? "မှတ်ပုံတင်အမှတ်တွင် ဂဏန်းများသာ ထည့်ပါ။"
      : "Register number must contain numbers only.";
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
  const checks = {
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasMinLength: password.length >= 8,
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  return {
    ...checks,
    passedCount: Object.values(checks).filter(Boolean).length,
  };
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

function StudentNumberInput({
  number,
  error,
  lang,
  onFocus,
  onChange,
}: {
  number: string;
  error: string;
  lang: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-[var(--ucsh-text)]">
        {lang === "mm"
          ? "တက္ကသိုလ်မှတ်ပုံတင်အမှတ်"
          : "University Register Number"}
      </label>

      <div
        className={`flex overflow-hidden rounded-[var(--ucsh-radius-md)] border bg-[var(--ucsh-card)] shadow-sm transition focus-within:ring-4 ${
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
            : "border-[var(--ucsh-border)] focus-within:border-[var(--ucsh-primary)] focus-within:ring-[rgba(37,201,200,0.14)]"
        }`}
      >
        <span className="flex shrink-0 items-center border-r border-[var(--ucsh-border)] px-3 text-[11px] font-black text-[var(--ucsh-primary-dark)] sm:px-4 sm:text-xs">
          {PREFIX}
        </span>

        <input
          name="number"
          value={number}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder="2532"
          required
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm font-bold text-[var(--ucsh-text)] outline-none placeholder:text-[var(--ucsh-muted)]"
        />
      </div>

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

function MinimalText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--ucsh-radius-md)] border border-[var(--ucsh-border)] bg-[var(--ucsh-bg-soft)] px-4 py-3 text-center text-sm font-bold leading-relaxed text-[var(--ucsh-muted)]">
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
      disabled={disabled}
      className="ucsh-btn h-14 w-full text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function BackButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 text-sm font-black text-[var(--ucsh-primary-dark)] transition hover:text-[var(--ucsh-primary)] hover:underline"
    >
      <ArrowLeft size={16} />
      {children}
    </button>
  );
}

function OtpBoxes({
  otp,
  refs,
  onChange,
  onKeyDown,
}: {
  otp: string[];
  refs: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onChange: (value: string, index: number) => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => void;
}) {
  return (
    <div className="flex justify-center gap-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(event) => onChange(event.target.value, index)}
          onKeyDown={(event) => onKeyDown(event, index)}
          maxLength={1}
          inputMode="numeric"
          className="h-12 w-12 rounded-[var(--ucsh-radius-md)] border border-[var(--ucsh-border)] bg-[var(--ucsh-card)] text-center text-xl font-black text-[var(--ucsh-text)] shadow-sm outline-none transition focus:border-[var(--ucsh-primary)] focus:ring-4 focus:ring-[rgba(37,201,200,0.14)]"
        />
      ))}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--ucsh-radius-md)] border border-[var(--ucsh-border)] bg-[var(--ucsh-bg-soft)] px-4 py-3 text-center text-sm font-black text-[var(--ucsh-primary-dark)] shadow-sm">
      {children}
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

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-top-1 rounded-[var(--ucsh-radius-md)] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 duration-150">
      {message}
    </div>
  );
}

function ApprovalBox({
  approved,
  message,
}: {
  approved: boolean;
  message: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-[var(--ucsh-radius-md)] border px-4 py-3 text-sm font-black shadow-sm ${
        approved
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-red-100 bg-red-50 text-red-600"
      }`}
    >
      {approved ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
      )}

      <span>{message}</span>
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