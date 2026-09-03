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
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-slate-950">
        <div className="flex items-center gap-3 rounded-3xl border border-white/50 bg-white/90 px-6 py-5 text-sm font-black shadow-xl backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#008B8B]" />
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
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/45 to-cyan-950/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,201,200,0.35),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(0,191,196,0.28),transparent_30%)]" />

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <div className="hidden max-w-3xl space-y-6 lg:block">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-black text-white shadow-xl backdrop-blur-xl">
            <Image
              src="/logo/logo-250.png"
              alt="Alumni Network"
              width={30}
              height={30}
              priority
              className="object-contain"
            />
            Admin Secure Access
          </div>

          <h1 className="text-6xl font-black leading-tight tracking-tight drop-shadow-2xl">
            University Alumni
            <span className="block text-[#77edec]">Admin Portal</span>
          </h1>

          <p className="max-w-2xl text-lg font-semibold leading-8 text-white/80">
            Manage users, analytics, posts, jobs, and register data from one
            secure dashboard.
          </p>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <InfoCard title="Secure" text="Admin only" />
            <InfoCard title="Fast" text="Clean control" />
            <InfoCard title="Responsive" text="Mobile ready" />
          </div>
        </div>

        <div className="w-full">
          <div className="rounded-[34px] border border-white/25 bg-white/90 p-5 text-slate-950 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
            <Link
              href="/admin"
              className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="text-center">
              
              
              <h1 className="mt-4 text-3xl font-black">Admin Login</h1>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Secure access to admin dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <InputField
                label="Admin Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter admin email"
                icon={<Mail className="h-5 w-5" />}
              />

              <PasswordField
                value={password}
                onChange={setPassword}
                show={showPassword}
                setShow={setShowPassword}
              />

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Checking admin..." : "Login as Admin"}
                {!loading && (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-bold text-slate-400">
              Â© {new Date().getFullYear()} Alumni Network
            </p>
          </div>
        </div>
      </section>
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
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700">
        Password
      </label>

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
    <div className="rounded-3xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-1 text-sm font-bold text-white/70">{text}</p>
    </div>
  );
}