// file: components/admin/delete-data-client.tsx

"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Database,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type Lang = "en" | "mm";

const collectionLabels: Record<string, { en: string; mm: string }> = {
  users: { en: "Alumni Users", mm: "ကျောင်းသားဟောင်း အသုံးပြုသူများ" },
  jobs: { en: "Jobs", mm: "အလုပ်များ" },
  approvedstudents: { en: "Approved Students", mm: "အတည်ပြုကျောင်းသားများ" },
  posts: { en: "Posts", mm: "ပို့စ်များ" },
  messages: { en: "Messages", mm: "စာများ" },
  settings: { en: "Settings", mm: "ဆက်တင်များ" },
  notifications: { en: "Notifications", mm: "အသိပေးချက်များ" },
  vote_projects: { en: "Vote Projects", mm: "မဲပေးပရောဂျက်များ" },
  vote_users: { en: "Vote Users", mm: "မဲပေးအသုံးပြုသူများ" },
  contactsettings: { en: "Contact Settings", mm: "ဆက်သွယ်ရန် ဆက်တင်များ" },
  otps: { en: "OTP Codes", mm: "OTP ကုဒ်များ" },
};

function getLabel(name: string, lang: Lang) {
  const known = collectionLabels[name.toLowerCase()];
  if (known) return known[lang];

  const readable = name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return readable;
}

const text = {
  en: {
    subtitle: "Permanently delete all documents from a collection. This cannot be undone.",
    collectionsLabel: "Collections",
    docsCount: "documents",
    delete: "Delete All",
    deleting: "Deleting...",
    noCollections: "No collections found.",
    confirmTitle: "Delete all documents?",
    confirmBody: (name: string) =>
      `This will permanently delete all "${name}" documents. This cannot be undone.`,
    confirmHint: "Type the exact collection name to confirm:",
    usersWarning:
      "Warning: deleting Users removes every account except your current admin login.",
    cancel: "Cancel",
    deleteForever: "Delete Forever",
    placeholder: "Type collection name",
    mismatch: "Name does not match",
    success: (name: string, count: number) =>
      `${getLabel(name, "en")}: ${count.toLocaleString()} document(s) deleted.`,
    error: "Delete failed. Please try again.",
  },
  mm: {
    subtitle: "Collection တစ်ခုရှိ document များအားလုံးကို အပြီးအပိုင် ဖျက်နိုင်သည်။ နောက်ပြန်မဖျက်နိုင်ပါ။",
    collectionsLabel: "Collection များ",
    docsCount: "document များ",
    delete: "အားလုံး ဖျက်မည်",
    deleting: "ဖျက်နေသည်...",
    noCollections: "Collection မတွေ့ပါ။",
    confirmTitle: "Document အားလုံး ဖျက်မည်လား?",
    confirmBody: (name: string) =>
      `"${name}" collection ရှိ document အားလုံးကို အပြီးအပိုင် ဖျက်မည်။ နောက်ပြန်မရနိုင်ပါ။`,
    confirmHint: "အတည်ပြုရန် collection အမည်ကို အတိအကျ ရိုက်ထည့်ပါ:",
    usersWarning:
      "သတိပေးချက်: Users ဖျက်ပါက လက်ရှိ သင့် အက်ဒမင် အကောင့် မှလွဲ၍ အကောင့် အားလုံး ဖျက်မည်။",
    cancel: "မဖျက်တော့ပါ",
    deleteForever: "အပြီးအပိုင် ဖျက်မည်",
    placeholder: "Collection အမည် ရိုက်ပါ",
    mismatch: "အမည် မကိုက်ညီပါ",
    success: (name: string, count: number) =>
      `${getLabel(name, "en")}: document ${count.toLocaleString()} ခု ဖျက်ပြီးပါပြီ။`,
    error: "ဖျက်ရန် မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။",
  },
} as const;

export default function DeleteDataClient({
  collections,
  lang,
}: {
  collections: { name: string; count: number }[];
  lang: Lang;
}) {
  const t = text[lang];

  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(collections.map((c) => [c.name, c.count])),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedCollections = [...collections].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  function openConfirm(name: string) {
    setMessage("");
    setError("");
    setPending(name);
    setTyped("");
  }

  async function confirmDelete() {
    if (!pending) return;
    if (typed.trim() !== pending) return;

    setDeleting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(
        `/api/admin/delete-data?name=${encodeURIComponent(pending)}&confirm=${encodeURIComponent(pending)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || t.error);
      } else {
        setCounts((prev) => ({
          ...prev,
          [pending]: 0,
        }));
        setMessage(t.success(pending, data?.deletedCount ?? 0));
      }
    } catch {
      setError(t.error);
    } finally {
      setDeleting(false);
      setPending(null);
      setTyped("");
    }
  }

  const isMatch = pending ? typed.trim() === pending : false;

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {t.subtitle}
      </p>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-500/20 dark:text-red-400">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {sortedCollections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm font-bold text-slate-400 dark:border-slate-700">
          {t.noCollections}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/80 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">{t.collectionsLabel}</th>
                  <th className="px-5 py-3.5 text-center">{t.docsCount}</th>
                  <th className="px-5 py-3.5 text-right">{t.delete}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sortedCollections.map((collection) => (
                  <tr
                    key={collection.name}
                    className="transition-colors hover:bg-red-50/40 dark:hover:bg-red-500/10"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
                          <Database size={16} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-black text-slate-900 dark:text-white">
                              {getLabel(collection.name, lang)}
                            </p>
                            {collection.name === "users" && (
                              <ShieldAlert size={14} className="shrink-0 text-amber-500" />
                            )}
                          </div>
                          <p className="truncate text-[11px] font-bold text-slate-400">
                            {collection.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        {(counts[collection.name] ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openConfirm(collection.name)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-black text-red-500 transition hover:bg-red-500 hover:text-white dark:text-red-400 dark:hover:bg-red-500"
                      >
                        <Trash2 size={14} />
                        {t.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400">
                  <Trash2 size={20} />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t.confirmTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
              {t.confirmBody(pending)}
            </p>

            {pending === "users" && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                {t.usersWarning}
              </div>
            )}

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.confirmHint}
              </p>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={t.placeholder}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              {!isMatch && typed && (
                <p className="mt-1.5 text-[11px] font-bold text-red-500">{t.mismatch}</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={!isMatch || deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    {t.deleteForever}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}