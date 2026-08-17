// file: app/admin/profile/client-form.tsx

"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  User as UserIcon,
  UserCircle,
  XCircle,
} from "lucide-react";

type Lang = "en" | "mm";

const text = {
  en: {
    title: "Profile Update",
    subtitle: "Update your admin account details and security credentials.",
    name: "Admin Name",
    email: "Admin Email",
    newPassword: "New Password (Optional)",
    confirmPassword: "Confirm New Password",
    save: "Save Changes",
    saving: "Saving...",
    logout: "Logout current session",
    passwordMismatch: "Passwords do not match.",
    passwordLength: "Password must be at least 8 characters.",
    updateSuccess: "Profile updated successfully.",
    updateError: "Failed to update profile.",
  },
  mm: {
    title: "ပရိုဖိုင် ပြင်ဆင်ခြင်း",
    subtitle: "သင့် admin အကောင့်အချက်အလက်များနှင့် လုံခြုံရေးကို ပြင်ဆင်ပါ။",
    name: "အမည်",
    email: "အီးမေးလ်",
    newPassword: "စကားဝှက်အသစ် (ရွေးချယ်ရန်)",
    confirmPassword: "စကားဝှက်အသစ်ကို အတည်ပြုပါ",
    save: "သိမ်းဆည်းမည်",
    saving: "သိမ်းဆည်းနေသည်...",
    logout: "လက်ရှိ session မှ ထွက်မည်",
    passwordMismatch: "စကားဝှက်များ မတူညီပါ။",
    passwordLength: "စကားဝှက် အနည်းဆုံး ၈ လုံး ရှိရပါမည်။",
    updateSuccess: "ပရိုဖိုင်ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။",
    updateError: "ပရိုဖိုင်ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။",
  },
};

export default function ProfileClientForm({
  admin,
  lang,
}: {
  admin: { name: string; email: string };
  lang: Lang;
}) {
  const router = useRouter();
  const t = text[lang];

  const [name, setName] = useState(admin.name || "");
  const [email, setEmail] = useState(admin.email || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password || confirm) {
      if (password !== confirm) {
        setError(t.passwordMismatch);
        return;
      }
      if (password.length < 8) {
        setError(t.passwordLength);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password ? password : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.updateError);
        setLoading(false);
        return;
      }

      setMessage(t.updateSuccess);
      setPassword("");
      setConfirm("");
      
      // Force refresh Server Component to show updated name
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t.updateError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-8">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800/60">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-xl shadow-cyan-500/25">
          <UserCircle className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.title}
          </h1>
          
          
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-2xl space-y-5">
        <InputField
          label={t.name}
          type="text"
          value={name}
          onChange={setName}
          placeholder="Enter admin name"
          icon={<UserIcon className="h-5 w-5" />}
        />

        <InputField
          label={t.email}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter admin email"
          icon={<Mail className="h-5 w-5" />}
        />

        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/50 sm:p-6">
          <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white">Change Password</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField
              label={t.newPassword}
              value={password}
              onChange={setPassword}
              show={showPassword}
              setShow={setShowPassword}
              required={false}
            />

            <PasswordField
              label={t.confirmPassword}
              value={confirm}
              onChange={setConfirm}
              show={showPassword}
              setShow={setShowPassword}
              required={false}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <XCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="order-2 w-full text-center text-xs font-black text-slate-400 transition hover:text-red-500 sm:order-1 sm:w-auto"
          >
            {t.logout}
          </button>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="order-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-8 text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>{t.save}</>
            )}
          </button>
        </div>
      </form>
    </div>
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
      <label className="block text-sm font-black text-slate-700 dark:text-slate-300">
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
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4] dark:focus:bg-slate-900 dark:focus:ring-cyan-900/30"
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="group relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#008B8B]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <input
          type={show ? "text" : "password"}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-14 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4] dark:focus:ring-cyan-900/30"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#008B8B] dark:hover:bg-slate-800"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}