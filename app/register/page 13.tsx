// file: app/register/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
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
const NRC_CACHE_KEY = "ucsh-nrc-json-cache-v1";
const mmDigits = ["á€", "á", "á‚", "áƒ", "á„", "á…", "á†", "á‡", "áˆ", "á‰"];
const nrcRegions = Array.from({ length: 14 }, (_, index) =>
  String(index + 1),
);

let nrcMemoryCache: NrcItem[] | null = null;

const fallbackNrcData: NrcItem[] = [
  {
    id: "14-á€Ÿá€žá€",
    name_en: "HaThaTa",
    name_mm: "á€Ÿá€žá€",
    nrc_code: "14",
    city_mm: "á€Ÿá€„á€ºá€¹á€žá€¬á€",
  },
];

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
    rollNumber: "Roll Number",
    nrc: "NRC",
    region: "No.",
    township: "Township",
    nrcType: "Type",
    nrcNumber: "NRC Number",
    graduatedYear: "Graduated Year",
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
    fatherNameInvalid: 'Father Name must start with "U ". Example: U Mg Mg',
    invalidEmail: "Invalid email format.",
    weakPassword:
      "Password must include uppercase, lowercase, number, symbol and at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    passwordMatched: "Passwords match.",
    checkFirst: "Please check approval first.",
    otpInvalid: "OTP must be 6 digits.",
    nrcPreview: "NRC Preview",
  },
  mm: {
    badge: "á€€á€»á€±á€¬á€„á€ºá€¸á€žá€¬á€¸á€Ÿá€±á€¬á€„á€ºá€¸ á€€á€½á€”á€ºá€›á€€á€º",
    title: "Alumni Account á€•á€¼á€¯á€œá€¯á€•á€ºá€›á€”á€º",
    subtitle:
      "Admin á€™á€¾ á€¡á€á€Šá€ºá€•á€¼á€¯á€‘á€¬á€¸á€žá€±á€¬ student information á€–á€¼á€„á€·á€º Alumni Network á€žá€­á€¯á€· á€á€„á€ºá€›á€±á€¬á€€á€ºá€•á€«á‹",
    step1: "Approval",
    step2: "Account",
    step3: "OTP",
    name: "á€¡á€™á€Šá€º",
    fatherName: "á€¡á€–á€¡á€™á€Šá€º",
    rollNumber: "Roll Number",
    nrc: "NRC",
    region: "á€¡á€™á€¾á€á€º",
    township: "á€™á€¼á€­á€¯á€·á€”á€šá€º",
    nrcType: "á€¡á€™á€»á€­á€¯á€¸á€¡á€…á€¬á€¸",
    nrcNumber: "NRC á€”á€¶á€•á€«á€á€º",
    graduatedYear: "á€˜á€½á€²á€·á€›á€”á€¾á€…á€º",
    email: "á€¡á€®á€¸á€™á€±á€¸á€œá€º",
    password: "á€…á€€á€¬á€¸á€á€¾á€€á€º",
    confirmPassword: "á€…á€€á€¬á€¸á€á€¾á€€á€º á€¡á€á€Šá€ºá€•á€¼á€¯",
    check: "Approval á€…á€…á€ºá€™á€Šá€º",
    checking: "á€…á€…á€ºá€†á€±á€¸á€”á€±á€žá€Šá€º...",
    sendOtp: "á€†á€€á€ºá€žá€½á€¬á€¸á€™á€Šá€º",
    sending: "á€•á€­á€¯á€·á€”á€±á€žá€Šá€º...",
    verifyOtp: "OTP á€¡á€á€Šá€ºá€•á€¼á€¯á€™á€Šá€º",
    verifying: "á€…á€…á€ºá€†á€±á€¸á€”á€±á€žá€Šá€º...",
    back: "á€”á€±á€¬á€€á€ºá€žá€­á€¯á€·",
    already: "Account á€›á€¾á€­á€•á€¼á€®á€¸á€žá€¬á€¸á€œá€¬á€¸?",
    login: "Login",
    home: "Home",
    approved: "Admin á€™á€¾ á€¡á€á€Šá€ºá€•á€¼á€¯á€‘á€¬á€¸á€žá€±á€¬ data á€á€½á€±á€·á€•á€«á€žá€Šá€ºá‹",
    required: "á€œá€­á€¯á€¡á€•á€ºá€žá€±á€¬ á€¡á€á€»á€€á€ºá€¡á€œá€€á€ºá€¡á€¬á€¸á€œá€¯á€¶á€¸ á€–á€¼á€Šá€·á€ºá€•á€«á‹",
    nameInvalid: "á€¡á€™á€Šá€ºá€žá€Šá€º á€¡á€”á€Šá€ºá€¸á€†á€¯á€¶á€¸ á€…á€¬á€œá€¯á€¶á€¸ á… á€œá€¯á€¶á€¸ á€›á€¾á€­á€›á€™á€Šá€ºá‹",
    fatherNameInvalid: 'á€¡á€–á€¡á€™á€Šá€ºá€žá€Šá€º "U " á€–á€¼á€„á€·á€º á€…á€›á€™á€Šá€ºá‹ á€¥á€•á€™á€¬ - U Mg Mg',
    invalidEmail: "Email format á€™á€™á€¾á€”á€ºá€•á€«á‹",
    weakPassword:
      "Password á€á€½á€„á€º á€¡á€€á€¼á€®á€¸á€…á€¬á€œá€¯á€¶á€¸áŠ á€¡á€žá€±á€¸á€…á€¬á€œá€¯á€¶á€¸áŠ á€”á€¶á€•á€«á€á€ºáŠ symbol á€”á€¾á€„á€·á€º 8 á€œá€¯á€¶á€¸á€¡á€‘á€€á€º á€•á€«á€›á€™á€Šá€ºá‹",
    passwordMismatch: "Password á€™á€á€°á€•á€«á‹",
    passwordMatched: "Password á€á€°á€Šá€®á€•á€«á€žá€Šá€ºá‹",
    checkFirst: "á€¡á€›á€„á€ºá€†á€¯á€¶á€¸ approval á€…á€…á€ºá€•á€«á‹",
    otpInvalid: "OTP á€žá€Šá€º á€‚á€á€”á€ºá€¸ á† á€œá€¯á€¶á€¸ á€–á€¼á€…á€ºá€›á€™á€Šá€ºá‹",
    nrcPreview: "NRC Preview",
  },
};

function enToMmDigit(value: string) {
  return value.replace(/[0-9]/g, (digit) => mmDigits[Number(digit)]);
}

function mmToEnDigit(value: string) {
  return value.replace(/[á€-á‰]/g, (digit) => String(mmDigits.indexOf(digit)));
}

function normalizeForMatch(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
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
  const [rollNumber, setRollNumber] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("2026");

  const [nrcData, setNrcData] = useState<NrcItem[]>(fallbackNrcData);
  const [nrcRegion, setNrcRegion] = useState("14");
  const [nrcCode, setNrcCode] = useState("á€Ÿá€žá€");
  const [nrcType, setNrcType] = useState("(á€”á€­á€¯á€„á€º)");
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

  const [touched, setTouched] = useState({
    name: false,
    fatherName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    async function loadNrcData() {
      try {
        if (nrcMemoryCache?.length) {
          setNrcData(nrcMemoryCache);
          return;
        }

        const cached = window.localStorage.getItem(NRC_CACHE_KEY);

        if (cached) {
          const cachedRows = JSON.parse(cached) as NrcItem[];
          if (Array.isArray(cachedRows) && cachedRows.length > 0) {
            nrcMemoryCache = cachedRows;
            setNrcData(cachedRows);
            return;
          }
        }

        const res = await fetch("/nrc.json", { cache: "force-cache" });
        const json = await res.json();

        const rows: NrcItem[] = Array.isArray(json)
          ? json.map(normalizeNrcRow)
          : Array.isArray(json?.data)
            ? json.data.map(normalizeNrcRow)
            : [];

        const validRows = rows.filter((item) => item.nrc_code && item.name_mm);

        if (validRows.length > 0) {
          nrcMemoryCache = validRows;
          window.localStorage.setItem(NRC_CACHE_KEY, JSON.stringify(validRows));
          setNrcData(validRows);
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

  const nrcValueMm = useMemo(() => {
    if (!nrcRegion || !nrcCode || !nrcType || nrcNumber.length !== 6) return "";
    return `${enToMmDigit(nrcRegion)}/${nrcCode}${nrcType}${nrcNumber}`;
  }, [nrcRegion, nrcCode, nrcType, nrcNumber]);

  const nrcValueEn = useMemo(() => {
    if (!nrcRegion || !nrcCode || !nrcType || nrcNumber.length !== 6) return "";
    return `${nrcRegion}/${nrcCode}${nrcType}${mmToEnDigit(nrcNumber)}`;
  }, [nrcRegion, nrcCode, nrcType, nrcNumber]);

  const nrcCandidates = useMemo(() => {
    if (!nrcValueMm) return [];

    const rMm = enToMmDigit(nrcRegion);
    const rEn = nrcRegion;
    const c = nrcCode;
    const t = nrcType;
    const nMm = enToMmDigit(nrcNumber);
    const nEn = mmToEnDigit(nrcNumber);

    const generateSpacingVariations = (r: string, n: string) => [
      `${r}/${c}${t}${n}`,
      `${r}/${c}${t} ${n}`,
      `${r}/${c} ${t}${n}`,
      `${r}/${c} ${t} ${n}`,
      `${r}/ ${c}${t}${n}`,
      `${r} /${c}${t}${n}`,
      `${r} / ${c} ${t} ${n}`,
    ];

    return Array.from(
      new Set([
        ...generateSpacingVariations(rMm, nMm),
        ...generateSpacingVariations(rEn, nEn),
        ...generateSpacingVariations(rMm, nEn),
        ...generateSpacingVariations(rEn, nMm),
      ]),
    );
  }, [nrcValueMm, nrcRegion, nrcCode, nrcType, nrcNumber]);

  useEffect(() => {
    setApproved(false);
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
    isNameValid(name) &&
    isFatherNameValid(fatherName) &&
    rollNumber.trim() &&
    graduatedYear.trim() &&
    Number(graduatedYear) >= 1900 &&
    Number(graduatedYear) <= 2100 &&
    nrcValueMm;

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
          rollNumber: rollNumber.trim(),
          graduatedYear: Number(graduatedYear),

          normalizedName: normalizeForMatch(name),
          normalizedFatherName: normalizeForMatch(fatherName),
          normalizedRollNumber: normalizeForMatch(rollNumber),

          nrc: nrcValueMm,
          nrcMm: nrcValueMm,
          nrcEn: nrcValueEn,
          nrcCandidates,

          normalizedNrcMm: normalizeForMatch(nrcValueMm),
          normalizedNrcEn: normalizeForMatch(nrcValueEn),

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
          rollNumber: rollNumber.trim(),
          graduatedYear: Number(graduatedYear),

          normalizedName: normalizeForMatch(name),
          normalizedFatherName: normalizeForMatch(fatherName),
          normalizedRollNumber: normalizeForMatch(rollNumber),

          nrc: nrcValueMm,
          nrcMm: nrcValueMm,
          nrcEn: nrcValueEn,
          nrcCandidates,

          normalizedNrcMm: normalizeForMatch(nrcValueMm),
          normalizedNrcEn: normalizeForMatch(nrcValueEn),

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
      <main className="min-h-[calc(100vh-70px)] px-2 pb-6 pt-6 sm:px-3">
        <section className="relative mx-auto flex min-h-[calc(100vh-112px)] max-w-7xl items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#3a6968] via-white to-[#eaffff] shadow-md">
          <BackgroundPhoto />
          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/25 bg-white/90 px-6 py-5 text-sm font-black text-[#008B8B] shadow-2xl backdrop-blur-2xl">
            <Loader2 className="h-5 w-5 animate-spin" />
            {currentLang === "mm" ? "á€…á€…á€ºá€†á€±á€¸á€”á€±á€žá€Šá€º..." : "Checking session..."}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-70px)] px-2 pb-6 pt-6 sm:px-3">
      <section className="relative mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#3a6968] via-white to-[#eaffff] shadow-md lg:grid-cols-[0.95fr_1.05fr]">
        <BackgroundPhoto />

        {/* Left Column: Branding matching app/page.tsx & app/login/page.tsx */}
        <div className="relative z-10 flex min-h-[calc(100vh-112px)] items-center px-5 py-10 sm:px-8 lg:px-12">
          {/* Dedicated gradient overlay positioned under text and over photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/68 to-slate-950/25 lg:via-slate-950/55" />

          <div className="relative z-10 max-w-xl">
            <div className="animate-in-1 mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
              <Sparkles size={15} className="text-[#f1cd72]" />
              {t.badge}
            </div>

            <h1 className="space-y-1 text-[34px] font-black leading-[1.08] tracking-tight sm:text-[46px] md:text-[56px]">
              <span className="animate-in-2 block text-[#f1cd72] hero-title-gold">
                Alumni
              </span>
              <span className="animate-in-3 block text-[#FFFFFF] hero-title-gold">
                Network
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

        {/* Right Column: Glassmorphism Register Form */}
        <div className="relative z-10 flex items-center px-5 pb-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="animate-form w-full rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition duration-300 sm:p-8">
            <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#25C9C8]/20 bg-[#eaffff]/80 p-2">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-xl px-3 py-3 text-center text-xs font-black transition ${
                    activeStepIndex >= index
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md"
                      : "bg-white/80 text-slate-500"
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t.name}
                    value={name}
                    onChange={setName}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, name: true }))
                    }
                    error={nameError ? t.nameInvalid : ""}
                  />
                  <Input
                    label={t.fatherName}
                    value={fatherName}
                    placeholder="U Mg Mg"
                    onChange={setFatherName}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, fatherName: true }))
                    }
                    error={fatherNameError ? t.fatherNameInvalid : ""}
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
                      {nrcRegions.map((region) => (
                        <option key={region} value={region}>
                          {enToMmDigit(region)}
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
                      <option value="(á€”á€­á€¯á€„á€º)">(á€”á€­á€¯á€„á€º)</option>
                      <option value="(á€§á€Šá€·á€º)">(á€§á€Šá€·á€º)</option>
                      <option value="(á€•á€¼á€¯)">(á€•á€¼á€¯)</option>
                    </Select>

                    <Input
                      label={t.nrcNumber}
                      value={nrcNumber}
                      placeholder="áá‚áƒá„á…á†"
                      inputMode="numeric"
                      onChange={(value) => {
                        const englishNumber = mmToEnDigit(value).replace(
                          /\D/g,
                          "",
                        );
                        setNrcNumber(enToMmDigit(englishNumber).slice(0, 6));
                      }}
                    />
                  </div>

                  {nrcValueMm && (
                    <p className="mt-3 rounded-xl bg-[#eaffff] px-3 py-2 text-sm font-black text-[#008B8B]">
                      {t.nrcPreview}: {nrcValueMm}
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
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
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
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, email: true }))
                  }
                  error={emailError ? t.invalidEmail : ""}
                />

                <PasswordInput
                  label={t.password}
                  value={password}
                  onChange={setPassword}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  show={showPassword}
                  setShow={setShowPassword}
                  error={passwordError ? t.weakPassword : ""}
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
          backgroundImage: "url('/images/background/background-0.jpg')",
        }}
      />
      {/* Dark overlay across the entire section photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/55 to-slate-950/25" />
      {/* Radial glows copied directly from reference pages */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(241,205,114,0.25),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(0,191,196,0.22),transparent_35%)]" />
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
  onBlur,
  type = "text",
  placeholder,
  inputMode,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
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
  onBlur,
  show,
  setShow,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  show: boolean;
  setShow: (value: boolean) => void;
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