// file: app/admin/register/page.tsx

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
  User,
} from "lucide-react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
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

    setLoading(true);

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Admin register failed.");
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
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-black shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-5 w-5 animate-spin text-[#008B8B]" />
          Redirecting...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef2f7] px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-140px] top-[-140px] h-[360px] w-[360px] rounded-full bg-[#25C9C8]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-160px] h-[400px] w-[400px] rounded-full bg-[#42D3E2]/30 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]">
        <div className="hidden space-y-6 lg:block">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-[#008B8B] shadow-lg">
            <Image
              src="/logo/logo-250.png"
              alt="Alumni Network"
              width={28}
              height={28}
              priority
              className="object-contain"
            />
            Temporary Admin Setup
          </div>

          <h1 className="max-w-3xl text-6xl font-black leading-tight">
            Create temporary admin account.
          </h1>

          <p className="max-w-2xl text-lg font-semibold leading-8 text-slate-500">
            Use this page only during development or first setup. After creating
            admin account, remove or protect this page.
          </p>
        </div>

        <div className="w-full">
          <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/60 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <Link
              href="/admin/login"
              className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back Login
            </Link>

            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
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

              <h1 className="mt-5 text-3xl font-black">Admin Register</h1>
              <p className="mt-2 text-sm font-bold text-slate-400">
                Temporary admin account creation
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              />

              <PasswordField
                label="Confirm Password"
                value={confirm}
                onChange={setConfirm}
                show={showPassword}
                setShow={setShowPassword}
              />

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-600">
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
                  !confirm
                }
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating admin..." : "Create Admin"}
                {!loading && <ArrowRight className="h-4 w-4" />}
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

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        <input
          type={type}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

        <input
          type={show ? "text" : "password"}
          required
          minLength={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-14 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
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