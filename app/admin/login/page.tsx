// file: app/admin/login/page.tsx

"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
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
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAlreadyLoggedIn() {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        if (active) setCheckingAdmin(false);
        return;
      }

      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });

        if (!active) return;

        if (res.ok) {
          router.replace("/admin/dashboard");
          router.refresh();
          return;
        }

        await signOut({ redirect: false });
        setCheckingAdmin(false);
      } catch {
        if (active) setCheckingAdmin(false);
      }
    }

    checkAlreadyLoggedIn();

    return () => {
      active = false;
    };
  }, [status, router]);

  // Safety net: if the session check hangs, force-logout and show the form
  useEffect(() => {
    if (status !== "loading") return;

    const timer = window.setTimeout(() => {
      setCheckingAdmin(false);
      signOut({ redirect: false }).catch(() => {});
    }, 1_000);

    return () => window.clearTimeout(timer);
  }, [status]);

  // Hard cap: never show the "Checking admin session..." screen past 1s
  useEffect(() => {
    const timer = window.setTimeout(() => setCheckingAdmin(false), 1_000);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid admin email or password.");
        return;
      }

      const res = await fetch("/api/admin/me", { cache: "no-store" });

      if (!res.ok) {
        await signOut({ redirect: false });
        setError("Admin access only.");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Admin login failed:", error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-card-in flex items-center gap-3 rounded-3xl border border-white/20 bg-white/10 px-6 py-5 text-sm font-black shadow-xl backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#77edec]" />
          Checking admin session...
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
            Admin Secure Access
          </div>

          <h1 className="admin-title mt-6 text-5xl font-black leading-tight tracking-tight drop-shadow-2xl sm:text-6xl lg:text-7xl">
            <span className="block text-[#f1cd72] hero-stroke-gold">
              Alumni Network
            </span>
            <span className="block text-white hero-stroke-gold">
              Admin Login
            </span>
          </h1>

          <p className="admin-fade-up-delay mt-5 max-w-2xl text-base font-semibold leading-8 text-white/80 sm:text-lg">
            Manage users, analytics, posts, jobs, register data and contact
            information from one secure dashboard.
          </p>
        </div>

        <div className="animate-card-in w-full">
          <div className="rounded-[34px] border border-white/25 bg-white/90 p-5 text-slate-950 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
            <Link
              href="/admin"
              className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-xl shadow-cyan-500/25">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <h2 className="mt-4 text-3xl font-black">Admin Login</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Secure access to admin dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <InputField
                label="Admin Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter admin email"
                icon={<Mail className="h-5 w-5" />}
              />

              <div className="space-y-1">
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                />
                
                {/* UPGRADE: Injected Forgot Password Link */}
                <div className="flex justify-end pr-1 pt-1">
                  <Link
                    href="/admin/forgot-password"
                    className="text-xs font-bold text-slate-500 transition hover:text-[#00BFC4] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="animate-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Checking admin...
                  </>
                ) : (
                  <>
                    Login as Admin
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-bold text-slate-400">
              © {new Date().getFullYear()} Alumni Network
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
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
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
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-cyan-100"
        />
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  setShow,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2 text-left">
      <label className="block text-sm font-black text-slate-700">Password</label>

      <div className="group relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]">
          <LockKeyhole className="h-5 w-5" />
        </div>

        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter password"
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