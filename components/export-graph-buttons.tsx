// file: components/admin/export-graph-buttons.tsx

"use client";

import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

type ExportLabels = {
  export: string;
  exportExcel: string;
  exportWeb: string;
  exportPdf: string;
  printPdf: string;

  // Keep optional to prevent old TypeScript error.
  // No Word button is shown.
  exportWord?: string;
};

type ExportGraphButtonsProps = {
  title: string;
  csv: string;
  html: string;
  labels: ExportLabels;
};

function safeFileName(value: string, ext: string) {
  const name = value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return `${name || "export"}.${ext}`;
}

function downloadBlob(content: string, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=1200,height=900");

  if (!win) {
    alert("Popup blocked. Please allow popups for this website.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  win.onload = () => {
    win.focus();
    win.print();
  };
}

export default function ExportGraphButtons({
  title,
  csv,
  html,
  labels,
}: ExportGraphButtonsProps) {
  return (
    <div className="group relative inline-flex self-start">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition hover:bg-[#0b67a3] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        <Download className="h-4 w-4" />
        {labels.export}
        <span>▾</span>
      </button>

      <div className="invisible absolute right-0 top-full z-40 mt-2 w-64 translate-y-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-2xl shadow-slate-300/60 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          onClick={() =>
            downloadBlob(
              csv,
              "text/csv;charset=utf-8",
              safeFileName(title, "csv"),
            )
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {labels.exportExcel}
        </button>

        <button
          type="button"
          onClick={() =>
            downloadBlob(
              html,
              "text/html;charset=utf-8",
              safeFileName(title, "html"),
            )
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <FileText className="h-4 w-4" />
          {labels.exportWeb}
        </button>

        <button
          type="button"
          onClick={() => openPrintWindow(html)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <FileText className="h-4 w-4" />
          {labels.exportPdf}
        </button>

        <button
          type="button"
          onClick={() => openPrintWindow(html)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <Printer className="h-4 w-4" />
          {labels.printPdf}
        </button>
      </div>
    </div>
  );
}