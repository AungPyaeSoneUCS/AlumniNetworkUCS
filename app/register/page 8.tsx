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
  Sparkles,
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
const regions = Array.from({ length: 14 }, (_, i) => String(i + 1));
const mmDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

const fallbackNrcData: NrcItem[] = [
  {
    id: "14-ဟသတ",
    name_en: "HaThaTa",
    name_mm: "ဟသတ",
    nrc_code: "14",
    city_mm: "ဟင်္သာတ",
  },
];

const text = {
  en: {
    badge: "Alumni Network",
    title: "Create Alumni Account",
    subtitle:
      "Register with the same information approved by the admin and continue to the Alumni Network.",
    step1: "Approval",
    step2: "Account",
    step3: "OTP",
    name: "Name",
    fatherName: "Father Name",
    rollNumber: "Roll Number",
    nrc: "NRC",
    region: "Region",
    township: "Township",
    nrcType: "Type",
    nrcNumber: "NRC Number",
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
    home: "Home",
    approved: "Approved register data found.",
    required: "Please fill all required fields.",
    invalidEmail: "Invalid email format.",
    weakPassword:
      "Password needs uppercase, lowercase, number, symbol and 8+ characters.",
    passwordMismatch: "Passwords do not match.",
    passwordMatched: "Passwords match.",
    checkFirst: "Please check approval first.",
    otpInvalid: "OTP must be 6 digits.",
    nrcPreview: "NRC Preview",
  },
  mm: {
    badge: "ကျောင်းသားဟောင်း ကွန်ရက်",
    title: "Alumni Account ပြုလုပ်ရန်",
    subtitle:
      "Admin မှ အတည်ပြုထားသော အချက်အလက်များဖြင့် Alumni Network သို့ ဝင်ရောက်ပါ။",
    step1: "Approval",
    step2: "Account",
    step3: "OTP",
    name: "အမည်",
    fatherName: "အဖအမည်",
    rollNumber: "Roll Number",
    nrc: "NRC",
    region: "တိုင်း/ပြည်နယ်",
    township: "မြို့နယ်",
    nrcType: "အမျိုးအစား",
    nrcNumber: "NRC နံပါတ်",
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
    home: "Home",
    approved: "Admin မှ အတည်ပြုထားသော data တွေ့ပါသည်။",
    required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ။",
    invalidEmail: "Email format မမှန်ပါ။",
    weakPassword:
      "Password တွင် အကြီးစာလုံး၊ အသေးစာလုံး၊ နံပါတ်၊ symbol နှင့် 8 လုံးအထက် ပါရမည်။",
    passwordMismatch: "Password မတူပါ။",
    passwordMatched: "Password တူညီပါသည်။",
    checkFirst: "အရင်ဆုံး approval စစ်ပါ။",
    otpInvalid: "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။",
    nrcPreview: "NRC Preview",
  },
};

function enToMmDigit(value: string) {
  return value.replace(/[0-9]/g, (digit) => mmDigits[Number(digit)]);
}

function mmToEnDigit(value: string) {
  return value.replace(/[၀-၉]/g, (digit) => String(mmDigits.indexOf(digit)));
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

function isPasswordStrong(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
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
  const [rollNumber, setRollNumber] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("2026");

  const [nrcData, setNrcData] = useState<NrcItem[]>(fallbackNrcData);
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
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/feeds");
  }, [status, router]);

  useEffect(() => {
    async function loadNrcData() {
      try {
        const res = await fetch("/nrc.json", { cache: "no-store" });
        const json = await res.json();

        const rows: NrcItem[] = Array.isArray(json)
          ? json.map(normalizeNrcRow)
          : Array.isArray(json?.data)
            ? json.data.map(normalizeNrcRow)
            : [];

        const validRows = rows.filter((item) => item.nrc_code && item.name_mm);

        if (validRows.length > 0) {
          setNrcData(validRows);

          const defaultTownship =
            validRows.find(
              (item) => item.nrc_code === "14" && item.name_mm === "ဟသတ",
            ) || validRows.find((item) => item.nrc_code === "14");

          if (defaultTownship) {
            setNrcRegion(defaultTownship.nrc_code);
            setNrcCode(defaultTownship.name_mm);
          }
        }
      } catch {
        setNrcData(fallbackNrcData);
      }
    }

    loadNrcData();
  }, []);

  const filteredTownships = useMemo(() => {
    return nrcData.filter((item) => String(item.nrc_code) === nrcRegion);
  }, [nrcData, nrcRegion]);

  useEffect(() => {
    if (filteredTownships.length === 0) {
      setNrcCode("");
      return;
    }

    const exists = filteredTownships.some((item) => item.name_mm === nrcCode);
    if (!exists) setNrcCode(filteredTownships[0].name_mm);
  }, [filteredTownships, nrcCode]);

  const selectedTownship = filteredTownships.find(
    (item) => item.name_mm === nrcCode,
  );

  const nrcValue = useMemo(() => {
    if (!nrcRegion || !nrcCode || !nrcType || nrcNumber.length !== 6) return "";
    return `${nrcRegion}/${nrcCode}${nrcType}${nrcNumber}`;
  }, [nrcRegion, nrcCode, nrcType, nrcNumber]);

  const nrcValueMm = useMemo(() => {
    if (!nrcValue) return "";
    return `${enToMmDigit(nrcRegion)}/${nrcCode}${nrcType}${enToMmDigit(
      nrcNumber,
    )}`;
  }, [nrcValue, nrcRegion, nrcCode, nrcType, nrcNumber]);

  const nrcCandidates = useMemo(() => {
    if (!nrcValue) return [];
    return [
      nrcValue,
      nrcValueMm,
      `${nrcRegion}/${nrcCode}${nrcType}${enToMmDigit(nrcNumber)}`,
      `${enToMmDigit(nrcRegion)}/${nrcCode}${nrcType}${nrcNumber}`,
    ];
  }, [nrcValue, nrcValueMm, nrcRegion, nrcCode, nrcType, nrcNumber]);

  useEffect(() => {
    setApproved(false);
    setMessage("");
    setError("");
  }, [
    name,
    fatherName,
    rollNumber,
    graduatedYear,
    nrcRegion,
    nrcCode,
    nrcType,
    nrcNumber,
  ]);

  const approvalValid =
    name.trim() &&
    fatherName.trim() &&
    rollNumber.trim() &&
    graduatedYear.trim() &&
    Number(graduatedYear) >= 1900 &&
    Number(graduatedYear) <= 2100 &&
    nrcValue;

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
          graduatedYear: Number(graduatedYear),
          nrc: nrcValue,
          nrcMm: nrcValueMm,
          nrcCandidates,
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
      }, 600);
    } catch {
      setError("Server error.");
    } finally {
      setChecking(false);
    }
  }

  async function sendOtp() {
    resetStatus();

    if (!approved) {
      setStep("approval");
      setError(t.checkFirst);
      return;
    }

    if (!accountValid) {
      if (!isEmailValid(email)) setError(t.invalidEmail);
      else if (!isPasswordStrong(password)) setError(t.weakPassword);
      else if (password !== confirmPassword) setError(t.passwordMismatch);
      else setError(t.required);
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
          graduatedYear: Number(graduatedYear),
          nrc: nrcValue,
          nrcMm: nrcValueMm,
          nrcCandidates,
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
    <main className="min-h-[calc(100vh-60px)] px-2 pb-6 pt-6 sm:px-3">
      <section className="relative mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-white/20 shadow-md lg:grid-cols-[0.9fr_1.1fr]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/imgaes/background/background-0.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/86 via-slate-950/60 to-slate-950/32" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(241,205,114,0.28),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(0,191,196,0.22),transparent_36%)]" />

        <div className="relative z-10 flex min-h-[720px] items-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="max-w-xl">
            <Link
              href="/"
              className="animate-in-1 mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft size={15} />
              {t.home}
            </Link>

            <div className="animate-in-2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
              <Sparkles size={15} className="text-[#f1cd72]" />
              {t.badge}
            </div>

            <h1 className="animate-in-3 mt-5 text-[34px] font-black leading-tight text-white drop-shadow-2xl sm:text-[46px] md:text-[56px]">
              {t.title}
            </h1>

            <p className="animate-in-4 mt-4 max-w-lg text-base font-semibold leading-7 text-white/90 drop-shadow-lg sm:text-lg">
              {t.subtitle}
            </p>

            <div className="animate-in-5 mt-7 grid max-w-md grid-cols-3 gap-2">
              {[t.step1, t.step2, t.step3].map((label, index) => {
                const activeIndex =
                  step === "approval" ? 0 : step === "info" ? 1 : 2;

                return (
                  <div
                    key={label}
                    className={`rounded-2xl border px-3 py-3 text-center text-xs font-black backdrop-blur ${
                      activeIndex >= index
                        ? "border-[#f1cd72]/60 bg-[#f1cd72]/20 text-[#f1cd72]"
                        : "border-white/20 bg-white/10 text-white/70"
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center px-5 pb-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-form w-full rounded-[2rem] border border-white/25 bg-white/92 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
            {(message || error) && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label={t.name} value={name} onChange={setName} />
                  <Input
                    label={t.fatherName}
                    value={fatherName}
                    onChange={setFatherName}
                  />
                  <Input
                    label={t.rollNumber}
                    value={rollNumber}
                    onChange={setRollNumber}
                  />
                  <Input
                    label={t.graduatedYear}
                    type="number"
                    value={graduatedYear}
                    onChange={setGraduatedYear}
                  />
                </div>

                <div>
                  <Label>{t.nrc}</Label>

                  <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr_0.9fr_1fr]">
                    <Select
                      label={t.region}
                      value={nrcRegion}
                      onChange={setNrcRegion}
                    >
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label={t.township}
                      value={nrcCode}
                      onChange={setNrcCode}
                    >
                      {filteredTownships.length === 0 ? (
                        <option value="">--</option>
                      ) : (
                        filteredTownships.map((item) => (
                          <option key={item.id} value={item.name_mm}>
                            {item.name_mm}
                          </option>
                        ))
                      )}
                    </Select>

                    <Select
                      label={t.nrcType}
                      value={nrcType}
                      onChange={setNrcType}
                    >
                      <option value="(နိုင်)">(နိုင်)</option>
                      <option value="(ဧည့်)">(ဧည့်)</option>
                      <option value="(ပြု)">(ပြု)</option>
                    </Select>

                    <Input
                      label={t.nrcNumber}
                      value={nrcNumber}
                      placeholder="123456"
                      onChange={(value) => {
                        const normalized = mmToEnDigit(value).replace(/\D/g, "");
                        setNrcNumber(normalized.slice(0, 6));
                      }}
                    />
                  </div>

                  {nrcValue && (
                    <p className="mt-3 rounded-xl bg-[#eaffff] px-3 py-2 text-sm font-black text-[#008B8B]">
                      {t.nrcPreview}: {nrcValue} / {nrcValueMm}
                    </p>
                  )}

                  {selectedTownship?.city_mm && (
                    <p className="mt-2 rounded-xl bg-yellow-50 px-3 py-2 text-sm font-black text-yellow-700">
                      {t.township}: {selectedTownship.city_mm}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!approvalValid || checking}
                  onClick={checkApproval}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                  onChange={setEmail}
                />

                <PasswordInput
                  label={t.password}
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                />

                <PasswordInput
                  label={t.confirmPassword}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  setShow={setShowConfirm}
                />

                {confirmPassword && (
                  <p
                    className={`rounded-xl px-3 py-2 text-xs font-black ${
                      password === confirmPassword
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {password === confirmPassword
                      ? t.passwordMatched
                      : t.passwordMismatch}
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
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f1cd72] px-5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyingOtp && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {verifyingOtp ? t.verifying : t.verifyOtp}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-5 text-center text-sm font-bold text-slate-600">
              {t.already}{" "}
              <Link href="/login" className="font-black text-[#008B8B]">
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <style>{`
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
        .animate-form {
          opacity: 0;
          animation: arrive 0.65s ease-out both;
        }

        .animate-in-1 { animation-delay: 0.04s; }
        .animate-in-2 { animation-delay: 0.12s; }
        .animate-in-3 { animation-delay: 0.22s; }
        .animate-in-4 { animation-delay: 0.34s; }
        .animate-in-5 { animation-delay: 0.46s; }
        .animate-form { animation-delay: 0.28s; }
      `}</style>
    </main>
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
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition placeholder:text-slate-300 focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/15"
      />
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
  show,
  setShow,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-11 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/15"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}