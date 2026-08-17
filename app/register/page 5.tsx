// file: app/register/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
} from "lucide-react";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";
type Step = "approval" | "info" | "otp";

type NrcItem = {
  id: string;
  name_en: string;
  name_mm: string;
  nrc_code: string;
  city_mm?: string;
};

const OTP_LENGTH = 6;
const mmDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

const text = {
  en: {
    title: "Registration",
    step1: "Checking State",
    step2: "Account Info",
    step3: "OTP",
    name: "Name",
    fatherName: "Father Name",
    rollNumber: "Roll Number",
    nrc: "NRC",
    township: "Township",
    graduatedYear: "Graduated Year",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    check: "Check Approval",
    checking: "Checking...",
    sendOtp: "Send OTP",
    sending: "Sending...",
    verifyOtp: "Verify OTP",
    verifying: "Verifying...",
    back: "Back",
    already: "Already have an account?",
    login: "Login",
    approvalHelp: "Enter the same data that admin added.",
    accountHelp: "Email must not already be registered. OTP will be sent after validation.",
    otpHelp: "Enter the 6-digit OTP sent to your email.",
    approved: "Approved register data found.",
    required: "Please fill all required fields.",
    invalidEmail: "Invalid email format. Example: example@gmail.com",
    weakPassword:
      "Password needs uppercase, lowercase, number, symbol and 8+ characters.",
    passwordMismatch: "Passwords do not match.",
    passwordMatched: "Passwords match.",
    checkFirst: "Please check approval first.",
    otpInvalid: "OTP must be 6 digits.",
  },
  mm: {
    title: "မှတ်ပုံတင်ရန်",
    step1: "ဒေတာစစ်ဆေးရန်",
    step2: "Account အချက်အလက်",
    step3: "OTP",
    name: "အမည်",
    fatherName: "အဖအမည်",
    rollNumber: "Roll Number",
    nrc: "NRC",
    township: "Township",
    graduatedYear: "ဘွဲ့ရနှစ်",
    email: "အီးမေးလ်",
    password: "စကားဝှက်",
    confirmPassword: "စကားဝှက် အတည်ပြု",
    check: "Approval စစ်မည်",
    checking: "စစ်ဆေးနေသည်...",
    sendOtp: "OTP ပို့မည်",
    sending: "ပို့နေသည်...",
    verifyOtp: "OTP အတည်ပြုမည်",
    verifying: "စစ်ဆေးနေသည်...",
    back: "နောက်သို့",
    already: "Account ရှိပြီးသားလား?",
    login: "Login",
    approvalHelp: "Admin ထည့်ထားသည့် data နှင့် တူအောင် ဖြည့်ပါ။",
    accountHelp: "Email စာရင်းသွင်းပြီးသား မဖြစ်ရပါ။ Validation မှန်မှ OTP ပို့ပါမည်။",
    otpHelp: "Email သို့ ပို့ထားသော OTP ၆ လုံး ထည့်ပါ။",
    approved: "Admin မှ အတည်ပြုထားသော data တွေ့ပါသည်။",
    required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ။",
    invalidEmail: "Email format မမှန်ပါ။ example@gmail.com ပုံစံဖြစ်ရမည်။",
    weakPassword:
      "Password တွင် အကြီးစာလုံး၊ အသေးစာလုံး၊ နံပါတ်၊ symbol နှင့် 8 လုံးအထက် ပါရမည်။",
    passwordMismatch: "Password မတူပါ။",
    passwordMatched: "Password တူညီပါသည်။",
    checkFirst: "အရင်ဆုံး approval စစ်ပါ။",
    otpInvalid: "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။",
  },
};

function enToMmDigit(value: string) {
  return value.replace(/[0-9]/g, (digit) => mmDigits[Number(digit)]);
}

function normalizeNrcRow(item: any): NrcItem {
  const rawName = String(item.name_mm || "").trim();
  const match = rawName.match(/\((.*?)\)\s*(.*)/);

  return {
    id: String(item.id || `${item.nrc_code}-${rawName}`),
    name_en: String(item.name_en || ""),
    name_mm: match ? match[1] : rawName,
    nrc_code: String(item.nrc_code || ""),
    city_mm: String(item.city_mm || (match ? match[2] : "")),
  };
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function passwordRules(password: string) {
  return [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

function isPasswordStrong(password: string) {
  return passwordRules(password).every((rule) => rule.valid);
}

export default function RegisterPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState<Step>("approval");

  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("2026");

  const [nrcData, setNrcData] = useState<NrcItem[]>([]);
  const [nrcRegion, setNrcRegion] = useState("14");
  const [nrcCode, setNrcCode] = useState("ဟသတ");
  const [nrcType, setNrcType] = useState("(နိုင်)");
  const [nrcNumber, setNrcNumber] = useState("");

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    fatherName: false,
    rollNumber: false,
    nrc: false,
    graduatedYear: false,
    email: false,
    password: false,
    confirmPassword: false,
    otp: false,
  });


  

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadNrcData() {
      try {
        const res = await fetch("/nrc.json");
        const json = await res.json();

        const rows: NrcItem[] = Array.isArray(json)
          ? json.map(normalizeNrcRow)
          : Array.isArray(json?.data)
            ? json.data.map(normalizeNrcRow)
            : [];

        const validRows = rows.filter((item) => item.name_mm && item.nrc_code);
        setNrcData(validRows);

        const defaultTownship = validRows.find(
          (item) => item.nrc_code === "14" && item.name_mm === "ဟသတ",
        );

        if (defaultTownship) {
          setNrcRegion("14");
          setNrcCode(defaultTownship.name_mm);
        }
      } catch {
        setNrcData([]);
      }
    }

    loadNrcData();
  }, []);

  const filteredTownships = useMemo(() => {
    return nrcData.filter((item) => item.nrc_code === nrcRegion);
  }, [nrcData, nrcRegion]);

  const selectedTownship = filteredTownships.find(
    (item) => item.name_mm === nrcCode,
  );

  const nrcValue = useMemo(() => {
    if (!nrcRegion || !nrcCode || !nrcType || nrcNumber.length !== 6) return "";
    return `${enToMmDigit(nrcRegion)}/${nrcCode}${nrcType}${nrcNumber}`;
  }, [nrcRegion, nrcCode, nrcType, nrcNumber]);

  useEffect(() => {
    const exists = filteredTownships.some((item) => item.name_mm === nrcCode);

    if (!exists && filteredTownships[0]) {
      setNrcCode(filteredTownships[0].name_mm);
    }
  }, [filteredTownships, nrcCode]);

  useEffect(() => {
    setApproved(false);
    setMessage("");
    setError("");
  }, [
    name,
    fatherName,
    rollNumber,
    nrcRegion,
    nrcCode,
    nrcType,
    nrcNumber,
    graduatedYear,
  ]);

  useEffect(() => {
    if (
      touched.confirmPassword &&
      confirmPassword &&
      password &&
      password === confirmPassword
    ) {
      setShowMatchSuccess(true);
      const timer = window.setTimeout(() => setShowMatchSuccess(false), 5000);
      return () => window.clearTimeout(timer);
    }

    setShowMatchSuccess(false);
  }, [password, confirmPassword, touched.confirmPassword]);

  const fieldErrors = {
    name: touched.name && !name.trim() ? t.required : "",
    fatherName: touched.fatherName && !fatherName.trim() ? t.required : "",
    rollNumber: touched.rollNumber && !rollNumber.trim() ? t.required : "",
    nrc: touched.nrc && !nrcValue ? t.required : "",
    graduatedYear:
      touched.graduatedYear &&
      (!graduatedYear.trim() ||
        Number.isNaN(Number(graduatedYear)) ||
        Number(graduatedYear) < 1900 ||
        Number(graduatedYear) > 2100)
        ? t.required
        : "",
    email:
      touched.email && email.trim() && !isEmailValid(email)
        ? t.invalidEmail
        : "",
    password:
      touched.password && password && !isPasswordStrong(password)
        ? t.weakPassword
        : "",
    confirmPassword:
      touched.confirmPassword && confirmPassword && password !== confirmPassword
        ? t.passwordMismatch
        : "",
    otp:
      touched.otp && otp.join("").length > 0 && otp.join("").length !== OTP_LENGTH
        ? t.otpInvalid
        : "",
  };

  const approvalValid =
    Boolean(name.trim()) &&
    Boolean(fatherName.trim()) &&
    Boolean(rollNumber.trim()) &&
    Boolean(nrcValue) &&
    Boolean(graduatedYear.trim()) &&
    !fieldErrors.graduatedYear;

  const accountValid =
    Boolean(email.trim()) &&
    isEmailValid(email) &&
    Boolean(password) &&
    isPasswordStrong(password) &&
    Boolean(confirmPassword) &&
    password === confirmPassword;

  function resetMessages() {
    setMessage("");
    setError("");
  }

  function markApprovalTouched() {
    setTouched((prev) => ({
      ...prev,
      name: true,
      fatherName: true,
      rollNumber: true,
      nrc: true,
      graduatedYear: true,
    }));
  }

  function markAccountTouched() {
    setTouched((prev) => ({
      ...prev,
      email: true,
      password: true,
      confirmPassword: true,
    }));
  }

  async function checkApproval() {
    resetMessages();
    markApprovalTouched();
    setApproved(false);

    if (!approvalValid) {
      setError(t.required);
      return;
    }

    setChecking(true);

    try {
      const res = await fetch("/api/register/check-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          rollNumber: rollNumber.trim(),
          nrc: nrcValue,
          graduatedYear: Number(graduatedYear),
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
        resetMessages();
      }, 600);
    } catch {
      setError("Server error.");
    } finally {
      setChecking(false);
    }
  }

  async function sendOtp() {
    resetMessages();
    markAccountTouched();

    if (!approved) {
      setStep("approval");
      setError(t.checkFirst);
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
          rollNumber: rollNumber.trim(),
          nrc: nrcValue,
          graduatedYear: Number(graduatedYear),
          email: email.trim(),
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

      window.setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
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
    setTouched((prev) => ({ ...prev, otp: true }));

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
    resetMessages();
    setTouched((prev) => ({ ...prev, otp: true }));

    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setError(t.otpInvalid);
      return;
    }

    setVerifyingOtp(true);

    try {
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

      router.replace(data.redirect || "/settings");
    } catch {
      setError("OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  return (
    <main className="mm page-wrapper relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="relative z-10 w-full max-w-md">
        <div className="ucsh-card ucsh-animate overflow-hidden p-0">
          <div className="h-1.5 bg-gradient-to-r from-[var(--ucsh-primary)] via-[var(--ucsh-secondary)] to-[var(--ucsh-accent)]" />

          <div className="relative p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ucsh-muted)] hover:text-[var(--ucsh-primary-dark)]"
              >
                <ArrowLeft size={16} />
                {t.login}
              </Link>

              <h1 className="text-xl font-black">{t.title}</h1>

              <span className="w-14" />
            </div>

            <Stepper step={step} t={t} />

            {(message || error) && (
              <div
                className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
                  error
                    ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                }`}
              >
                {error ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                <span>{error || message}</span>
              </div>
            )}

            {step === "approval" && (
              <div className="mt-6 space-y-4">
                <Help>{t.approvalHelp}</Help>

                <Input
                  label={t.name}
                  value={name}
                  onChange={setName}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  error={fieldErrors.name}
                />

                <Input
                  label={t.fatherName}
                  value={fatherName}
                  onChange={setFatherName}
                  onBlur={() => setTouched((p) => ({ ...p, fatherName: true }))}
                  error={fieldErrors.fatherName}
                />

                <Input
                  label={t.rollNumber}
                  value={rollNumber}
                  onChange={setRollNumber}
                  onBlur={() => setTouched((p) => ({ ...p, rollNumber: true }))}
                  error={fieldErrors.rollNumber}
                />

                <div>
                  <Label>{t.nrc}</Label>

                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={nrcRegion}
                      onChange={(value) => {
                        setNrcRegion(value);
                        setTouched((p) => ({ ...p, nrc: true }));
                      }}
                    >
                      {Array.from({ length: 14 }, (_, i) => String(i + 1)).map(
                        (region) => (
                          <option key={region} value={region}>
                            {enToMmDigit(region)}
                          </option>
                        ),
                      )}
                    </Select>

                    <Select
                      value={nrcCode}
                      onChange={(value) => {
                        setNrcCode(value);
                        setTouched((p) => ({ ...p, nrc: true }));
                      }}
                    >
                      {filteredTownships.length === 0 ? (
                        <option value="">--</option>
                      ) : (
                        filteredTownships.map((item) => (
                          <option key={item.id} value={item.name_mm}>
                            ({item.name_mm})
                          </option>
                        ))
                      )}
                    </Select>

                    <Select
                      value={nrcType}
                      onChange={(value) => {
                        setNrcType(value);
                        setTouched((p) => ({ ...p, nrc: true }));
                      }}
                    >
                      <option value="(နိုင်)">(နိုင်)</option>
                      <option value="(ဧည့်)">(ဧည့်)</option>
                      <option value="(ပြု)">(ပြု)</option>
                    </Select>

                    <input
                      type="text"
                      maxLength={6}
                      value={nrcNumber}
                      placeholder="၁၂၃၄၅၆"
                      onBlur={() => setTouched((p) => ({ ...p, nrc: true }))}
                      onChange={(event) => {
                        const value = enToMmDigit(event.target.value).replace(
                          /[^၀-၉]/g,
                          "",
                        );
                        setNrcNumber(value.slice(0, 6));
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  {selectedTownship?.city_mm && (
                    <p className="mt-2 rounded-xl bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-700">
                      {t.township} - {selectedTownship.city_mm}
                    </p>
                  )}

                  <FieldError text={fieldErrors.nrc} />
                </div>

                <Input
                  label={t.graduatedYear}
                  type="number"
                  value={graduatedYear}
                  onChange={setGraduatedYear}
                  onBlur={() =>
                    setTouched((p) => ({ ...p, graduatedYear: true }))
                  }
                  error={fieldErrors.graduatedYear}
                />

                <button
                  type="button"
                  disabled={!approvalValid || checking}
                  onClick={checkApproval}
                  className="ucsh-btn h-13 w-full text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking && <Loader2 size={18} className="animate-spin" />}
                  {checking ? t.checking : t.check}
                </button>
              </div>
            )}

            {step === "info" && (
              <div className="mt-6 space-y-4">
                <Help>{t.accountHelp}</Help>

                <Input
                  label={t.email}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  error={fieldErrors.email}
                />

                <PasswordInput
                  label={t.password}
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  error={fieldErrors.password}
                />

                {touched.password && password && !isPasswordStrong(password) && (
                  <PasswordStrength password={password} />
                )}

                <PasswordInput
                  label={t.confirmPassword}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                  onBlur={() =>
                    setTouched((p) => ({ ...p, confirmPassword: true }))
                  }
                  error={fieldErrors.confirmPassword}
                />

                {showMatchSuccess && (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                    {t.passwordMatched}
                  </p>
                )}

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setStep("approval");
                    }}
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                  >
                    {t.back}
                  </button>

                  <button
                    type="button"
                    disabled={!accountValid || sendingOtp}
                    onClick={sendOtp}
                    className="ucsh-btn px-8 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingOtp && <Loader2 size={18} className="animate-spin" />}
                    {sendingOtp ? t.sending : t.sendOtp}
                  </button>
                </div>
              </div>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="mt-6 space-y-5">
                <Help>{t.otpHelp}</Help>

                <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm font-black text-slate-700">
                  {email}
                </p>

                <div className="flex justify-center gap-2">
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
                      className="h-12 w-11 rounded-xl border border-slate-300 text-center text-lg font-black outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />
                  ))}
                </div>

                <FieldError text={fieldErrors.otp} />

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setStep("info");
                    }}
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                  >
                    {t.back}
                  </button>

                  <button
                    type="submit"
                    disabled={otp.join("").length !== OTP_LENGTH || verifyingOtp}
                    className="ucsh-btn px-8 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {verifyingOtp && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {verifyingOtp ? t.verifying : t.verifyOtp}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-center text-sm font-bold text-[var(--ucsh-muted)]">
              {t.already}{" "}
              <Link
                href="/login"
                className="font-black text-[var(--ucsh-primary-dark)] hover:underline"
              >
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stepper({ step, t }: { step: Step; t: (typeof text)["en"] }) {
  const steps = [
    { id: "approval", number: 1, label: t.step1 },
    { id: "info", number: 2, label: t.step2 },
    { id: "otp", number: 3, label: t.step3 },
  ] as const;

  const currentIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="mx-auto max-w-md">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-10 right-10 top-5 h-0.5 bg-slate-300" />

        {steps.map((item, index) => {
          const active = index <= currentIndex;

          return (
            <div
              key={item.id}
              className="relative z-10 flex w-28 flex-col items-center"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-black ${
                  active
                    ? "border-slate-700 text-slate-900"
                    : "border-slate-300 text-slate-300"
                }`}
              >
                {item.number}
              </div>

              <p
                className={`mt-2 text-center text-xs font-bold ${
                  active ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">
      {children}
    </p>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 block text-sm font-bold text-slate-700">{children}</p>
  );
}

function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mt-1 text-xs font-bold text-red-600">{text}</p>;
}

function Input({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>

      <input
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      />

      <FieldError text={error} />
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
    >
      {children}
    </select>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  setShow,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <FieldError text={error} />
    </label>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const rules = passwordRules(password);

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-3">
      {rules.map((rule) => (
        <p
          key={rule.label}
          className={`text-xs font-bold ${
            rule.valid ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {rule.valid ? "✓" : "•"} {rule.label}
        </p>
      ))}
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