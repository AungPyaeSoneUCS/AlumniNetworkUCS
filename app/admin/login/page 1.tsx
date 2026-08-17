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
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-black shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-5 w-5 animate-spin text-[#008B8B]" />
          Checking admin session...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef2f7] px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-140px] top-[-140px] h-[360px] w-[360px] rounded-full bg-[#25C9C8]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-160px] h-[400px] w-[400px] rounded-full bg-[#42D3E2]/30 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <div className="hidden space-y-6 lg:block">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-[#008B8B] shadow-lg shadow-slate-300/50 dark:border-cyan-500/20 dark:bg-slate-900 dark:text-cyan-300 dark:shadow-black/20">
            <Image
              src="/logo/logo-250.png"
              alt="Alumni Network"
              width={28}
              height={28}
              priority
              className="object-contain"
            />
            Admin Secure Access
          </div>

          <h1 className="max-w-3xl text-6xl font-black leading-tight tracking-tight">
            Welcome back to{" "}
            <span className="text-[#008B8B] dark:text-cyan-300">
              Alumni Network
            </span>
            .
          </h1>

          <p className="max-w-2xl text-lg font-semibold leading-8 text-slate-500 dark:text-slate-400">
            Sign in to manage users, analytics, posts, jobs, and register data
            from one clean admin dashboard.
          </p>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <InfoCard title="Secure" text="Admin only" />
            <InfoCard title="Fast" text="Clean control" />
            <InfoCard title="Responsive" text="Mobile ready" />
          </div>
        </div>

        <div className="w-full">
          <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-6">
            <Link
              href="/admin"
              className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
                  <Image
                    src="/logo/logo-250.png"
                    alt="Alumni Network"
                    fill
                    priority
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
              </div>

              <h1 className="mt-5 text-3xl font-black">Admin Login</h1>
              <p className="mt-2 text-sm font-bold text-slate-400">
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
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
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
              © {new Date().getFullYear()} Alumni Network
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
      <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
        {label}
      </label>

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
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
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
      <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
        Password
      </label>

      <div className="group relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]" />

        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter admin password"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-14 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#008B8B] dark:hover:bg-slate-800"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">{text}</p>
    </div>
  );
}