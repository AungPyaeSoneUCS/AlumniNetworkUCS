// file: components/admin/update-student-form.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Save, 
  User as UserIcon,
  Mail,
  Phone,
  Key,
  Lock
} from "lucide-react";

type UserType = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  graduatedYear: string | number;
  degree: string;
};

type Props = {
  users: UserType[];
  lang: "en" | "mm";
  initialSearch: string;
  onUpdate: (userId: string, data: any) => Promise<{ success?: boolean; error?: string }>;
};

const translations = {
  en: {
    searchTitle: "Find Student",
    searchPlaceholder: "Search by name or email...",
    noUsers: "No students found.",
    selectUser: "Edit Account",
    back: "Back to Search",
    editTitle: "Update Account Info",
    name: "Alumni Name",
    email: "Email Address",
    phone: "Phone Number",
    oldPassword: "Current Password",
    oldPasswordPlaceholder: "•••••••• (Encrypted)",
    password: "New Password",
    passwordHint: "Leave blank to keep the current password",
    updateBtn: "Save Changes",
    updating: "Saving...",
    success: "Account updated successfully!",
    required: "Name and Email are required.",
  },
  mm: {
    searchTitle: "ကျောင်းသား ရှာရန်",
    searchPlaceholder: "အမည် သို့မဟုတ် အီးမေးလ် ဖြင့် ရှာရန်...",
    noUsers: "ကျောင်းသား မတွေ့ပါ။",
    selectUser: "ပြင်မည်",
    back: "နောက်သို့ ပြန်သွားမည်",
    editTitle: "အကောင့် အချက်အလက်ပြင်ရန်",
    name: "ကျောင်းသားဟောင်းအမည်",
    email: "အီးမေးလ်",
    phone: "ဖုန်းနံပါတ်",
    oldPassword: "လက်ရှိ စကားဝှက်",
    oldPasswordPlaceholder: "•••••••• (ဝှက်ထားသည်)",
    password: "စကားဝှက်အသစ်",
    passwordHint: "စကားဝှက်မပြောင်းလိုပါက အလွတ်ထားပါ",
    updateBtn: "သိမ်းဆည်းမည်",
    updating: "သိမ်းဆည်းနေသည်...",
    success: "အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။",
    required: "အမည် နှင့် အီးမေးလ် လိုအပ်ပါသည်။",
  }
};

export default function DynamicStudentRegistrationForm({ users, lang, initialSearch, onUpdate }: Props) {
  const t = translations[lang];
  const processedRef = useRef(false);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Handle URL pre-fill from `create-users` page
  useEffect(() => {
    if (initialSearch && !processedRef.current && users.length > 0) {
      processedRef.current = true;
      setSearchQuery(initialSearch);
      
      const exactMatch = users.find(u => u.name.toLowerCase() === initialSearch.toLowerCase());
      if (exactMatch) handleSelectUser(exactMatch);
    }
  }, [initialSearch, users]);

  // Filter users
  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function handleSelectUser(user: UserType) {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: "", // Always start empty
    });
    setMessage("");
    setError("");
  }

  function handleBack() {
    setSelectedUser(null);
    setMessage("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setError(t.required);
      return;
    }

    setLoading(true);
    try {
      const result = await onUpdate(selectedUser!._id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(t.success);
        setFormData(prev => ({ ...prev, password: "" })); // Clear password field after success
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  // Render Form UI
  if (selectedUser) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
        <button 
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#008B8B] dark:text-slate-400 dark:hover:text-[#25C9C8]"
        >
          <ArrowLeft size={16} />
          {t.back}
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
            <Save size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black dark:text-white">{t.editTitle}</h2>
            <p className="text-xs font-bold text-slate-400">{selectedUser.name}</p>
          </div>
        </div>

        {message && <Alert type="success" text={message} />}
        {error && <Alert type="error" text={error} />}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Name & Email Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input 
              icon={<UserIcon size={16} />}
              label={t.name} 
              value={formData.name} 
              onChange={(v: string) => setFormData(prev => ({...prev, name: v}))} 
            />
            <Input 
              icon={<Mail size={16} />}
              label={t.email} 
              type="email" 
              value={formData.email} 
              onChange={(v: string) => setFormData(prev => ({...prev, email: v}))} 
            />
          </div>

          {/* Phone & Current Password (Read-Only) Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input 
              icon={<Phone size={16} />}
              label={t.phone} 
              value={formData.phone} 
              onChange={(v: string) => setFormData(prev => ({...prev, phone: v}))} 
            />
            
            <div className="block">
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.oldPassword}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="text"
                  readOnly
                  value={t.oldPasswordPlaceholder}
                  className="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-3 text-sm font-bold text-slate-400 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* New Password Row */}
          <div className="grid gap-4 sm:grid-cols-1">
            <div className="block">
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.password}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  placeholder={t.passwordHint}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#00BFC4] focus:bg-white focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              {loading ? t.updating : t.updateBtn}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Render Search UI
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
          <Search size={20} />
        </div>
        <h2 className="text-lg font-black dark:text-white">{t.searchTitle}</h2>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-slate-400">
            {t.noUsers}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredUsers.slice(0, 50).map((u) => (
              <div 
                key={u._id} 
                onClick={() => handleSelectUser(u)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-white p-3 shadow-sm transition hover:border-[#00BFC4] hover:shadow-md dark:bg-slate-800 dark:hover:border-[#00BFC4]"
              >
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#008B8B] dark:group-hover:text-[#25C9C8]">
                    {u.name}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">
                    {u.email} • {u.graduatedYear || "N/A"}
                  </p>
                </div>
                <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition group-hover:bg-[#00BFC4]/10 group-hover:text-[#008B8B] dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-[#25C9C8]/10 dark:group-hover:text-[#25C9C8]">
                  {t.selectUser}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Reusable UI Components
function Alert({ type, text }: { type: "success" | "error"; text: string }) {
  const success = type === "success";
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
      success ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
              : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
    }`}>
      {success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      {text}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  icon
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="block">
      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full rounded-xl border border-slate-200 bg-slate-50 ${icon ? "pl-10" : "pl-3"} pr-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]`}
        />
      </div>
    </div>
  );
}