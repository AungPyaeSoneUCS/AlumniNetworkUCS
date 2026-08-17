// file: components/admin/print-users-button.tsx

"use client";

import { Printer } from "lucide-react";

export default function PrintUsersButton({ html }: { html: string }) {
  function printPdf() {
    const printWindow = window.open("", "_blank", "width=1000,height=700");

    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  return (
    <button
      type="button"
      onClick={printPdf}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
    >
      <Printer size={16} />
      Print
    </button>
  );
}
