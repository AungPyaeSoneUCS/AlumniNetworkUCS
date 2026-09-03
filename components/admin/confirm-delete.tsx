// file: components/admin/confirm-delete.tsx

"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

type Props = {
  action?: (formData: FormData) => Promise<void>;
  onClientConfirm?: (id: string) => void | Promise<void>;
  id: string;
  t: {
    deleteConfirm: string;
    cancel: string;
    delete: string;
    cannotUndo: string;
  };
  className?: string;
  label?: string;
  iconSize?: number;
};

export default function ConfirmDelete({
  action,
  onClientConfirm,
  id,
  t,
  className = "",
  label,
  iconSize = 14,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      if (onClientConfirm) {
        await onClientConfirm(id);
      } else if (action) {
        const fd = new FormData();
        fd.set("id", id);
        await action(fd);
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Trash2 size={iconSize} className="shrink-0" />
        {label ? <span>{label}</span> : null}
      </button>

      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 size={28} />
            </div>
            <h3 className="mb-2 text-lg font-black text-slate-900 dark:text-white">
              {t.deleteConfirm}
            </h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {t.cannotUndo}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}