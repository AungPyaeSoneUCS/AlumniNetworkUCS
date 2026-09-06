// file: components/admin/backup-client.tsx

"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CloudDownload,
  Database,
  Download,
  FileJson,
  Loader2,
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
    title: "Database Backup",
    subtitle: "Download every MongoDB collection as its own JSON file.",
    collectionsLabel: "Collections",
    downloadAll: "Download All (JSON)",
    downloadingAll: "Downloading...",
    download: "Download JSON",
    docsCount: "documents",
    noCollections: "No collections found.",
    success: "Backup completed successfully!",
    error: "Backup failed. Please try again.",
    filename: "File",
  },
  mm: {
    title: "Database Backup",
    subtitle: "MongoDB collection တိုင်းကို ၎င်း၏ JSON ဖိုင် အဖြစ် ဒေါင်းလုဒ်လုပ်ပါ။",
    collectionsLabel: "Collection များ",
    downloadAll: "အားလုံး ဒေါင်းလုဒ် (JSON)",
    downloadingAll: "ဒေါင်းလုဒ်လုပ်နေသည်...",
    download: "JSON ဒေါင်းလုဒ်",
    docsCount: "document များ",
    noCollections: "Collection မတွေ့ပါ။",
    success: "Backup အောင်မြင်ပါသည်။",
    error: "Backup မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။",
    filename: "ဖိုင်",
  },
} as const;

export default function BackupClient({
  collections,
  lang,
}: {
  collections: { name: string; count: number }[];
  lang: Lang;
}) {
  const t = text[lang];
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedCollections = [...collections].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  async function downloadCollection(name: string) {
    const res = await fetch(`/api/admin/backup?name=${encodeURIComponent(name)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to download");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDownload(name: string) {
    setMessage("");
    setError("");
    setDownloading(name);
    try {
      await downloadCollection(name);
    } catch {
      setError(t.error);
    } finally {
      setDownloading(null);
    }
  }

  async function handleDownloadAll() {
    setMessage("");
    setError("");
    setDownloadingAll(true);
    setProgress(0);
    const total = sortedCollections.length;

    try {
      for (let i = 0; i < total; i++) {
        const collectionName = sortedCollections[i].name;
        try {
          await downloadCollection(collectionName);
        } catch {
          // keep going, only report at the end
        }
        setProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setMessage(t.success);
    } catch {
      setError(t.error);
    } finally {
      setDownloadingAll(false);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {sortedCollections.length} {t.docsCount}
        </p>

        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={downloadingAll || sortedCollections.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-2.5 sm:text-sm"
        >
          {downloadingAll ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t.downloadingAll} ({progress}/{sortedCollections.length})
            </>
          ) : (
            <>
              <CloudDownload size={16} />
              {t.downloadAll}
            </>
          )}
        </button>
      </div>

      {downloadingAll && progress < sortedCollections.length && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00BFC4] to-[#008B8B] transition-all duration-300"
            style={{
              width: `${sortedCollections.length ? (progress / sortedCollections.length) * 100 : 0}%`,
            }}
          />
        </div>
      )}

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
                  <th className="px-5 py-3.5">{t.filename}</th>
                  <th className="px-5 py-3.5 text-center">{t.docsCount}</th>
                  <th className="px-5 py-3.5 text-right">{t.download}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sortedCollections.map((collection) => {
                  const isDownloading = downloading === collection.name;

                  return (
                    <tr
                      key={collection.name}
                      className="transition-colors hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
                            <Database size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-900 dark:text-white">
                              {getLabel(collection.name, lang)}
                            </p>
                            <p className="truncate text-[11px] font-bold text-slate-400">
                              {collection.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <FileJson size={13} />
                          {collection.name}.json
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                          {collection.count.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownload(collection.name)}
                          disabled={isDownloading || downloadingAll}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#008B8B]/10 px-3 py-1.5 text-[11px] font-black text-[#008B8B] transition hover:bg-[#008B8B] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#25C9C8]/10 dark:text-[#25C9C8] dark:hover:bg-[#25C9C8] dark:hover:text-slate-900"
                        >
                          {isDownloading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                          {isDownloading ? t.downloadingAll : t.download}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}