// file: components/admin/import-data-client.tsx

"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  CloudUpload,
  Database,
  FileJson,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";

type Lang = "en" | "mm";

const text = {
  en: {
    subtitle:
      "Upload the JSON files you downloaded from the Backup page. Files of any size are supported and uploaded one at a time with live progress. Documents that already exist are skipped, never overwritten.",
    backupLink: "Download backups first",
    choose: "Choose files",
    orDrag: "or drag & drop",
    supports:
      "Supports multiple JSON files (one collection per file, e.g. posts.json → posts). Large files may take a while — keep this tab open.",
    selected: "selected files",
    importAll: "Import Files",
    importing: "Importing...",
    noFiles: "No files selected yet.",
    filename: "File",
    collection: "Collection",
    inserted: "Inserted",
    skipped: "Skipped",
    status: "Status",
    done: "Imported",
    failed: "Failed",
    uploading: "Uploading",
    processing: "Processing…",
    waiting: "Waiting",
    retry: "Retry",
    success: "All files imported successfully!",
    partialError: "Some files failed. See details below.",
    error: "Import failed. Please try again.",
    remove: "Remove",
  },
  mm: {
    subtitle:
      "Backup စာမျက်နှာမှ ဒေါင်းလုဒ်လုပ်ထားသော JSON ဖိုင်များကို ပြန်တင်ပါ။ မည်သည့်အရွယ်အစားမဆို အဆင်ပြေပြီး ဖိုင်တစ်ခုချင်း တင်မည်ဖြစ်ရာ တိုးတက်မှုရာခိုင်နှုန်း ပြပါမည်။ အရှိပြီးသား document များကို ကျော်ပြီး မဖျောက်ပါ။",
    backupLink: "အရင်ဆုံး Backup ဒေါင်းလုဒ်လုပ်ပါ",
    choose: "ဖိုင်များ ရွေးရန်",
    orDrag: "သို့မဟုတ် ဆွဲယူ၍ ချပါ",
    supports:
      "JSON ဖိုင်များ အများအပြား ပံ့ပိုးပါသည် (collection တစ်ခု ဖိုင်တစ်ခု၊ ဥပမာ posts.json → posts). ဖိုင်ကြီးများအတွက် အချိန်ယူနိုင်သည် — tab ကို ဖွင့်ထားပါ။",
    selected: "ရွေးထားသော ဖိုင်များ",
    importAll: "ဖိုင်များ တင်မည်",
    importing: "တင်နေသည်...",
    noFiles: "ဖိုင်များ မရွေးရသေးပါ။",
    filename: "ဖိုင်",
    collection: "Collection",
    inserted: "အသစ်ထည့်ပြီး",
    skipped: "ကျော်ထား",
    status: "အခြေအနေ",
    done: "ပြီးပါပြီ",
    failed: "မအောင်မြင်ပါ",
    uploading: "တင်နေသည်",
    processing: "လုပ်ဆောင်နေသည်…",
    waiting: "စောင့်နေသည်",
    retry: "ထပ်လုပ်မည်",
    success: "ဖိုင်များအားလုံး အောင်မြင်စွာ တင်ပြီးပါပြီ။",
    partialError: "အချို့ဖိုင်များ မအောင်မြင်ပါ။ အသေးစိတ်ကို အောက်တွင် ကြည့်ပါ။",
    error: "Import မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။",
    remove: "ဖယ်ရန်",
  },
} as const;

type Status = "pending" | "uploading" | "processing" | "done" | "error";

type Row = {
  id: string;
  file: File;
  progress: number;
  status: Status;
  inserted?: number;
  skipped?: number;
  collection?: string;
  error?: string;
};

function uploadFile(
  file: File,
  handlers: { onProgress: (pct: number) => void; onProcessing: () => void },
): Promise<{ inserted: number; skipped: number; collection: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `/api/admin/import-data?name=${encodeURIComponent(file.name)}`,
    );
    xhr.setRequestHeader("Content-Type", "application/json");

    let lastPct = -1;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total === 0) return;
      const pct = Math.min(100, Math.round((event.loaded / event.total) * 100));
      if (pct !== lastPct) {
        lastPct = pct;
        handlers.onProgress(pct);
      }
      if (pct >= 100) handlers.onProcessing();
    };

    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data && !data.error) {
        resolve({
          inserted: Number(data.inserted) || 0,
          skipped: Number(data.skipped) || 0,
          collection: String(data.collection || ""),
        });
      } else {
        reject(new Error(data?.error || `Upload failed (HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    xhr.send(file);
  });
}

export default function ImportDataClient({ lang }: { lang: Lang }) {
  const t = text[lang];
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    const added: Row[] = Array.from(list).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...added]);
    setMessage("");
    setError("");
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setFiles((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  }

  function clearFiles() {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    setMessage("");
    setError("");
  }

  async function handleImport() {
    const targets = files.filter((row) => row.status === "pending" || row.status === "error");
    if (targets.length === 0) return;

    setImporting(true);
    setMessage("");
    setError("");

    let failed = 0;

    for (const row of targets) {
      updateRow(row.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
        inserted: undefined,
        skipped: undefined,
      });

      try {
        const result = await uploadFile(row.file, {
          onProgress: (pct) => updateRow(row.id, { progress: pct }),
          onProcessing: () => updateRow(row.id, { status: "processing" }),
        });
        updateRow(row.id, {
          status: "done",
          progress: 100,
          inserted: result.inserted,
          skipped: result.skipped,
          collection: result.collection,
        });
      } catch (err: any) {
        failed += 1;
        updateRow(row.id, {
          status: "error",
          error: err?.message || t.error,
        });
      }
    }

    setImporting(false);
    if (failed === 0) setMessage(t.success);
    else if (failed < targets.length) setMessage(t.partialError);
    else setError(t.error);
  }

  const doneCount = files.filter((row) => row.status === "done").length;
  const active = files.find(
    (row) => row.status === "uploading" || row.status === "processing",
  );

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {t.subtitle}{" "}
        <a
          href="/admin/edit/backup"
          className="font-black text-[#008B8B] underline-offset-2 hover:underline dark:text-[#25C9C8]"
        >
          {t.backupLink} →
        </a>
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

      {/* DROP ZONE */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-[#00BFC4] dark:border-slate-700 dark:bg-slate-900/50"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
          <CloudUpload size={26} />
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CloudUpload size={16} />
          {t.choose}
        </button>
        <p className="mt-3 text-xs font-bold text-slate-400">
          {t.orDrag}, {t.supports}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* FILE LIST */}
      {files.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800/60">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {files.length} {t.selected}
              {importing || doneCount > 0 ? ` • ${doneCount}/${files.length}` : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFiles}
                disabled={importing}
                title={t.remove}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || files.every((row) => row.status === "done")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t.importing}
                  </>
                ) : (
                  <>
                    <CloudUpload size={14} />
                    {t.importAll}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* overall progress */}
          {importing && (
            <div className="h-1 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-[#00BFC4] to-[#008B8B] transition-all duration-300"
                style={{
                  width: `${files.length ? ((doneCount + (active ? active.progress / 100 : 0)) / files.length) * 100 : 0}%`,
                }}
              />
            </div>
          )}

          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {files.map((item) => (
              <li key={item.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
                      <FileJson size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900 dark:text-white">
                        {item.file.name}
                      </p>
                      <p className="truncate text-[11px] font-bold text-slate-400">
                        {(item.file.size / 1024).toFixed(1)} KB
                        {item.collection ? ` • ${getLabel(item.collection)}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {item.status === "done" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 size={12} />
                        {t.done} (+{item.inserted?.toLocaleString() ?? 0}/
                        {item.skipped?.toLocaleString() ?? 0})
                      </span>
                    ) : item.status === "error" ? (
                      <span
                        className="inline-flex max-w-[240px] items-center gap-1 truncate rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-600 dark:bg-red-500/20 dark:text-red-400"
                        title={item.error}
                      >
                        <XCircle size={12} />
                        {item.error || t.failed}
                      </span>
                    ) : item.status === "processing" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                        <Loader2 size={12} className="animate-spin" />
                        {t.processing}
                      </span>
                    ) : item.status === "uploading" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-black text-[#008B8B] dark:bg-[#008B8B]/20 dark:text-cyan-400">
                        <Loader2 size={12} className="animate-spin" />
                        {t.uploading} {item.progress}%
                      </span>
                    ) : (
                      !importing && (
                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {(item.status === "uploading" || item.status === "processing") && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00BFC4] to-[#008B8B] transition-all duration-200"
                      style={{
                        width:
                          item.status === "processing" ? "100%" : `${item.progress}%`,
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {files.some((item) => item.status === "done") && (
            <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800/60">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/80 dark:text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{t.filename}</th>
                    <th className="px-5 py-3">{t.collection}</th>
                    <th className="px-5 py-3 text-center">{t.inserted}</th>
                    <th className="px-5 py-3 text-center">{t.skipped}</th>
                    <th className="px-5 py-3 text-center">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {files
                    .filter((item) => item.status === "done" || item.status === "error")
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300">
                          {item.file.name}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Database size={12} />
                            {getLabel(item.collection || "")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                          {(item.inserted ?? 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-slate-400">
                          {(item.skipped ?? 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
                              item.status === "error"
                                ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            }`}
                          >
                            {item.status === "error" ? (
                              <>
                                <XCircle size={12} />
                                {t.failed}
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} />
                                {t.done}
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {files.length === 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center text-xs font-bold text-slate-400 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
          {t.noFiles}
        </div>
      )}
    </div>
  );
}

function getLabel(name: string) {
  if (!name) return "—";
  return name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
