// file: components/admin/add-staff-form.tsx

"use client";

import { useState } from "react";
import { Briefcase, Eye, EyeOff, Lock, Mail, UserCog } from "lucide-react";

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddStaffForm({
  t,
  lang,
  action,
}: {
  t: any;
  lang: "en" | "mm";
  action: (formData: FormData) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(true); // shown by default, not auto-hidden
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    position?: string;
    email?: string;
    password?: string;
  }>({});

  function validate() {
    const next: typeof errors = {};
    const mail = email.trim().toLowerCase();
    if (!mail) next.email = t.emailRequired || "Email is required.";
    else if (!emailRegex.test(mail)) next.email = t.invalidEmail;

    if (!password) next.password = t.passwordRequired || "Password is required.";
    else if (!passwordRegex.test(password)) next.password = t.invalidPassword;
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      e.preventDefault();
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-slate-50 py-2.5 text-sm font-bold outline-none transition focus:ring-2 dark:bg-slate-800/50 dark:text-white";
  const okBorder = " border-slate-200 focus:border-[#00BFC4] focus:ring-[#00BFC4]/20 dark:border-slate-700";
  const errBorder = " border-red-400 focus:border-red-400 focus:ring-red-400/20 dark:border-red-500";

  return (
    <form action={action} onSubmit={handleSubmit} className="max-w-xl space-y-5" noValidate>
      <input type="hidden" name="lang" value={lang} />

      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {t.staff}
        </label>
        <div className="relative">
          <UserCog className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="name"
            required
            className={`${inputBase} pl-10 pr-4 ${okBorder}`}
            placeholder="U Htet Wai Lwin"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {t.position}
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="position"
            required
            className={`${inputBase} pl-10 pr-4 ${okBorder}`}
            placeholder="Student Affairs Officer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {t.email}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            className={`${inputBase} pl-10 pr-4 ${errors.email ? errBorder : okBorder}`}
            placeholder="staff@ucsh.edu.mm"
          />
        </div>
        {errors.email && (
          <p className="text-xs font-bold text-red-500 dark:text-red-400">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {t.password}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type={passwordVisible ? "text" : "password"}
            name="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            className={`${inputBase} pl-10 pr-10 ${errors.password ? errBorder : okBorder}`}
            placeholder={t.pwdPlaceholder}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#008B8B]"
            aria-label="Toggle password visibility"
          >
            {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-bold text-red-500 dark:text-red-400">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
      >
        <UserCog className="h-4 w-4" />
        {t.save}
      </button>
    </form>
  );
}