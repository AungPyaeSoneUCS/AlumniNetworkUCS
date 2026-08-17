// file: app/admin/contact/page.tsx

"use client";

import type React from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Globe, Loader2, Mail, MapPin, Phone, Save } from "lucide-react";
import { FaFacebookF } from "react-icons/fa6";

import AdminSidebar from "@/components/admin/admin-sidebar";

type Lang = "en" | "mm";

type ContactForm = {
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  website: string;
  facebookUrl: string;
  facebookName: string;
  mapUrl: string;
};

const emptyForm: ContactForm = {
  phone1: "",
  phone2: "",
  email: "",
  address: "",
  website: "",
  facebookUrl: "",
  facebookName: "",
  mapUrl: "",
};

const text = {
  en: {
    editTitle: "Edit Contact Data",
    editSubtitle: "Update public contact information from database.",
    phone1: "Phone 1",
    phone2: "Phone 2",
    email: "Email",
    website: "Website",
    facebookName: "Facebook Page Name",
    facebookUrl: "Facebook URL",
    address: "Address",
    mapUrl: "Google Map Embed URL",
    save: "Save Changes",
    saving: "Saving...",
    loadFailed: "Failed to load contact information.",
    updateFailed: "Failed to update contact information.",
    updated: "Contact information updated successfully.",
    mapPreview: "Map Live Preview",
    mapPreviewSubtitle: "Preview updates from the Google Map Embed URL.",
    mapEmpty: "Add Google Map Embed URL to preview map.",
    openMap: "Open Map",
    invalidMap: "Map preview works best with a Google Maps embed URL.",
  },
  mm: {
    editTitle: "ဆက်သွယ်ရန် အချက်အလက် ပြင်ရန်",
    editSubtitle: "Public contact page တွင် ပြမည့် အချက်အလက်များကို ပြင်နိုင်ပါသည်။",
    phone1: "ဖုန်းနံပါတ် ၁",
    phone2: "ဖုန်းနံပါတ် ၂",
    email: "အီးမေးလ်",
    website: "ဝက်ဘ်ဆိုဒ်",
    facebookName: "Facebook Page အမည်",
    facebookUrl: "Facebook URL",
    address: "လိပ်စာ",
    mapUrl: "Google Map Embed URL",
    save: "သိမ်းမည်",
    saving: "သိမ်းနေသည်...",
    loadFailed: "ဆက်သွယ်ရန် အချက်အလက်များ မဖတ်နိုင်ပါ။",
    updateFailed: "ဆက်သွယ်ရန် အချက်အလက်များ မပြင်နိုင်ပါ။",
    updated: "ဆက်သွယ်ရန် အချက်အလက်များ ပြင်ပြီးပါပြီ။",
    mapPreview: "မြေပုံ Live Preview",
    mapPreviewSubtitle: "Google Map Embed URL မှ Preview ပြပါသည်။",
    mapEmpty: "မြေပုံကြည့်ရန် Google Map Embed URL ထည့်ပါ။",
    openMap: "မြေပုံဖွင့်မည်",
    invalidMap: "Google Maps embed URL သုံးပါက Preview ပိုမှန်ပါသည်။",
  },
};

function AdminContactContent() {
  const searchParams = useSearchParams();
  const queryLang = searchParams.get("lang");
  const currentLang: Lang = queryLang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const safeMapUrl = useMemo(() => form.mapUrl.trim(), [form.mapUrl]);
  const isLikelyMapUrl = useMemo(() => {
    if (!safeMapUrl) return false;
    return /^(https?:\/\/)/i.test(safeMapUrl) && /google\.[^/]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(safeMapUrl);
  }, [safeMapUrl]);

  useEffect(() => {
    async function loadContact() {
      setLoading(true);

      try {
        const res = await fetch("/api/admin/contact", { cache: "no-store" });

        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        if (!res.ok) {
          setIsError(true);
          setMessage(t.loadFailed);
          return;
        }

        const data = await res.json();

        setForm({
          phone1: data.phone1 || "",
          phone2: data.phone2 || "",
          email: data.email || "",
          address: data.address || "",
          website: data.website || "",
          facebookUrl: data.facebookUrl || "",
          facebookName: data.facebookName || "",
          mapUrl: data.mapUrl || "",
        });
      } catch (error) {
        console.error("Load contact failed:", error);
        setIsError(true);
        setMessage(t.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    loadContact();
  }, [t.loadFailed]);

  function updateField(name: keyof ContactForm, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setIsError(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        setIsError(true);
        setMessage(t.updateFailed);
        return;
      }

      const data = await res.json();

      if (data?.contact) {
        setForm({
          phone1: data.contact.phone1 || "",
          phone2: data.contact.phone2 || "",
          email: data.contact.email || "",
          address: data.contact.address || "",
          website: data.contact.website || "",
          facebookUrl: data.contact.facebookUrl || "",
          facebookName: data.contact.facebookName || "",
          mapUrl: data.contact.mapUrl || "",
        });
      }

      setMessage(t.updated);
    } catch (error) {
      console.error("Update contact failed:", error);
      setIsError(true);
      setMessage(t.updateFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="contact" lang={currentLang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                <Loader2 className="h-10 w-10 animate-spin text-[#008B8B]" />
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="relative z-20 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
              >
                {/* Header Section 
                <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-5 dark:border-slate-800/60 dark:bg-slate-900/80 sm:px-6">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                      {t.editTitle}
                    </h1>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                      {t.editSubtitle}
                    </p>
                  </div>
                </div>
                */}

                {/* Form Fields Section */}
                <div className="space-y-4 p-4 sm:p-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <InputCard icon={<Phone size={17} />} label={t.phone1} value={form.phone1} onChange={(value) => updateField("phone1", value)} placeholder="044 22725" />
                    <InputCard icon={<Phone size={17} />} label={t.phone2} value={form.phone2} onChange={(value) => updateField("phone2", value)} placeholder="09783543901" />
                    <InputCard icon={<Mail size={17} />} label={t.email} value={form.email} onChange={(value) => updateField("email", value)} placeholder="example@gmail.com" />
                    <InputCard icon={<Globe size={17} />} label={t.website} value={form.website} onChange={(value) => updateField("website", value)} placeholder="ucsh.edu.mm" />
                    <InputCard icon={<FaFacebookF size={17} />} label={t.facebookName} value={form.facebookName} onChange={(value) => updateField("facebookName", value)} placeholder="University of Computer Studies, Hinthada" />
                    <InputCard icon={<FaFacebookF size={17} />} label={t.facebookUrl} value={form.facebookUrl} onChange={(value) => updateField("facebookUrl", value)} placeholder="https://www.facebook.com/..." />
                  </div>

                  <TextareaCard icon={<MapPin size={17} />} label={t.address} value={form.address} onChange={(value) => updateField("address", value)} placeholder={t.address} rows={3} />

                  <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                    <TextareaCard
                      icon={<MapPin size={17} />}
                      label={t.mapUrl}
                      value={form.mapUrl}
                      onChange={(value) => updateField("mapUrl", value)}
                      placeholder="https://www.google.com/maps?q=...&output=embed"
                      rows={8}
                    />

                    <MapPreview
                      safeMapUrl={safeMapUrl}
                      isLikelyMapUrl={isLikelyMapUrl}
                      title={t.mapPreview}
                      subtitle={t.mapPreviewSubtitle}
                      emptyText={t.mapEmpty}
                      openText={t.openMap}
                      invalidText={t.invalidMap}
                    />
                  </div>
                </div>

                {/* Footer Section with Save Button */}
                <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800/60 dark:bg-slate-900/80 sm:flex-row sm:px-6">
                  <div className="w-full sm:w-auto">
                    {message && (
                      <div
                        className={`rounded-xl border px-4 py-2.5 text-sm font-black shadow-sm ${
                          isError
                            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                        }`}
                      >
                        {message}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? t.saving : t.save}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen overflow-hidden bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#008B8B]" />
          </div>
        </div>
      }
    >
      <AdminContactContent />
    </Suspense>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-sm shadow-cyan-500/20">
      {children}
    </div>
  );
}

function InputCard({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200/80 bg-slate-50 p-3 shadow-sm transition-all focus-within:border-[#00BFC4] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00BFC4]/15 dark:border-slate-700/80 dark:bg-slate-900/40 dark:focus-within:border-[#00BFC4] dark:focus-within:bg-slate-900/80">
      <div className="mb-3 flex items-center gap-2.5">
        <IconBox>{icon}</IconBox>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{label}</span>
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
      />
    </label>
  );
}

function TextareaCard({
  icon,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="block h-full rounded-2xl border border-slate-200/80 bg-slate-50 p-3 shadow-sm transition-all focus-within:border-[#00BFC4] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00BFC4]/15 dark:border-slate-700/80 dark:bg-slate-900/40 dark:focus-within:border-[#00BFC4] dark:focus-within:bg-slate-900/80">
      <div className="mb-3 flex items-center gap-2.5">
        <IconBox>{icon}</IconBox>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{label}</span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-[110px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
      />
    </label>
  );
}

function MapPreview({
  safeMapUrl,
  isLikelyMapUrl,
  title,
  subtitle,
  emptyText,
  openText,
  invalidText,
}: {
  safeMapUrl: string;
  isLikelyMapUrl: boolean;
  title: string;
  subtitle: string;
  emptyText: string;
  openText: string;
  invalidText: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/40">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-white px-4 py-4 dark:border-slate-800/80 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 text-sm font-black text-slate-800 dark:text-slate-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#008B8B] dark:bg-[#00BFC4]/10 dark:text-[#25C9C8]">
              <MapPin size={17} />
            </span>
            <span className="truncate">{title}</span>
          </div>
          <p className="mt-1 pl-[46px] text-xs font-bold text-slate-400 dark:text-slate-500">{subtitle}</p>
        </div>

        {safeMapUrl && (
          <a
            href={safeMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            <ExternalLink size={14} />
            {openText}
          </a>
        )}
      </div>

      <div className="min-h-[260px] flex-1 bg-slate-100 dark:bg-slate-950 sm:min-h-[320px] lg:min-h-[360px]">
        {safeMapUrl ? (
          <iframe
            key={safeMapUrl}
            src={safeMapUrl}
            title="Contact map live preview"
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-black text-slate-400 dark:text-slate-500">
            {emptyText}
          </div>
        )}
      </div>

      {safeMapUrl && !isLikelyMapUrl && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          {invalidText}
        </div>
      )}
    </div>
  );
}