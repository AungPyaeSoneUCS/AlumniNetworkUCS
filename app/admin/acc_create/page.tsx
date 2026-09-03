//file app/admin/acc_create/page.tsx

"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  KeyRound,
} from "lucide-react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secretKey, setSecretKey] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin/dashboard");
      router.refresh();
    }
  }, [status, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!secretKey.trim()) {
      setError("Admin Secret Key is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          secretKey: secretKey.trim(), // Sent to backend for .env validation
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Admin register failed. Check your Secret Key.");
        return;
      }

      setMessage("Admin account created successfully.");
      setTimeout(() => router.push("/admin/login"), 800);
    } catch (error) {
      console.error("Admin register failed:", error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-card-in flex items-center gap-3 rounded-3xl border border-white/20 bg-white/10 px-6 py-5 text-sm font-black shadow-xl backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#77edec]" />
          Redirecting...
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

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <div className="admin-hero-in max-w-4xl">
          <div className="admin-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-black text-white shadow-xl backdrop-blur-xl">
            <Sparkles className="sparkle h-4 w-4 text-[#f1cd72]" />
            Temporary Admin Setup
          </div>

          <h1 className="admin-title mt-6 text-5xl font-black leading-tight tracking-tight drop-shadow-2xl sm:text-6xl lg:text-7xl">
            <span className="block text-[#f1cd72] hero-stroke-gold">
              Create Admin
            </span>
            <span className="block text-white hero-stroke-white">
              Secure Account
            </span>
          </h1>

          <p className="admin-fade-up-delay mt-5 max-w-2xl text-base font-semibold leading-8 text-white/80 sm:text-lg">
            Use this page only during development or first setup. You will need the system's Master Secret Key to authorize this creation.
          </p>

          <p className="admin-fade-up-delay-2 mt-4 max-w-2xl text-xl font-black leading-tight text-[#77edec] sm:text-2xl">
            Admin Only â€¢ Secure Setup â€¢ Key Required
          </p>

          <div className="admin-fade-up-delay-3 mt-8 grid gap-3 sm:grid-cols-3">
            <InfoCard title="Secure" text="Admin access" />
            <InfoCard title="Setup" text="First account" />
            <InfoCard title="Protected" text="Env Key Required" />
          </div>
        </div>

        <div className="animate-card-in w-full">
          <div className="rounded-[34px] border border-white/25 bg-white/90 p-5 text-slate-950 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
            
            <div className="text-center">
              <h2 className="mt-2 text-2xl font-black">Admin Register</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <InputField
                label="Admin Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Enter admin name"
                icon={<User className="h-5 w-5" />}
              />

              <InputField
                label="Admin Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter admin email"
                icon={<Mail className="h-5 w-5" />}
              />

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                setShow={setShowPassword}
                icon={<LockKeyhole className="h-5 w-5" />}
              />

              <PasswordField
                label="Confirm Password"
                value={confirm}
                onChange={setConfirm}
                show={showPassword}
                setShow={setShowPassword}
                icon={<LockKeyhole className="h-5 w-5" />}
              />

              {/* Secret Key Field */}
              <PasswordField
                label="System Secret Key"
                value={secretKey}
                onChange={setSecretKey}
                show={showSecret}
                setShow={setShowSecret}
                icon={<KeyRound className="h-5 w-5" />}
                placeholder="Enter environment secret key"
              />

              {error && (
                <div className="animate-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                  {error}
                </div>
              )}

              {message && (
                <div className="animate-success rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-600">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !name.trim() ||
                  !email.trim() ||
                  !password ||
                  !confirm ||
                  !secretKey.trim()
                }
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating admin...
                  </>
                ) : (
                  <>
                    Create Admin
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="w-full text-center text-xs font-black text-slate-400 transition hover:text-red-500"
              >
                Logout current session
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-bold text-slate-400">
              Â© {new Date().getFullYear()} Alumni Network
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

        .admin-fade-up-delay-2 {
          animation: adminFadeUp .75s ease-out .42s both;
        }

        .admin-fade-up-delay-3 {
          animation: adminFadeUp .75s ease-out .56s both;
        }

        .animate-error {
          animation: errorShake .35s ease-out both;
        }

        .animate-success {
          animation: adminFadeUp .35s ease-out both;
        }

        @keyframes bgZoom {
          from {
            transform: scale(1.04) translate3d(0, 0, 0);
          }
          to {
            transform: scale(1.1) translate3d(-1.2%, -1%, 0);
          }
        }

        @keyframes adminFadeUp {
          0% {
            opacity: 0;
            transform: translateY(34px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes adminSlideIn {
          0% {
            opacity: 0;
            transform: translateX(-46px) scale(.98);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes adminCardIn {
          0% {
            opacity: 0;
            transform: translateX(46px) scale(.96);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes adminTitleGlow {
          0%, 100% {
            text-shadow: 0 18px 50px rgba(0,0,0,.35);
          }
          50% {
            text-shadow: 0 18px 70px rgba(119,237,236,.45);
          }
        }

        @keyframes sparklePulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: .8;
          }
          50% {
            transform: scale(1.25) rotate(16deg);
            opacity: 1;
          }
        }

        @keyframes floatOne {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(28px, 20px) scale(1.08);
          }
        }

        @keyframes floatTwo {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-24px, -18px) scale(1.06);
          }
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
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
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-cyan-100"
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
  icon,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  icon: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700">{label}</label>

      <div className="group relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]">
          {icon}
        </div>

        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-14 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-cyan-100"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#008B8B]"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/20">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-1 text-sm font-bold text-white/70">{text}</p>
    </div>
  );
}