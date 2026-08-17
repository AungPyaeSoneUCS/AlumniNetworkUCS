// file: app/admin/contact/page.tsx

"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Globe, Loader2, Mail, MapPin, Phone, Save } from "lucide-react";
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
    previewTitle: "Live Preview",
    previewSubtitle: "Preview of saved contact data.",
    phones: "Phones",
    facebook: "Facebook",
    mapPreview: "Map Preview",
    mapEmpty: "Add Google Map Embed URL to preview map.",
    notSet: "Not set",
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
    previewTitle: "Live Preview",
    previewSubtitle: "သိမ်းထားသော ဆက်သွယ်ရန် အချက်အလက် Preview",
    phones: "ဖုန်းနံပါတ်များ",
    facebook: "Facebook",
    mapPreview: "မြေပုံ Preview",
    mapEmpty: "မြေပုံကြည့်ရန် Google Map Embed URL ထည့်ပါ။",
    notSet: "မထည့်ရသေးပါ",
  },
};

export default function AdminContactPage() {
  const searchParams = useSearchParams();
  const queryLang = searchParams.get("lang");
  const currentLang: Lang = queryLang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

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
    <main className="min-h-screen overflow-hidden bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="contact" lang={currentLang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-5">
            {loading ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
                <Loader2 className="h-9 w-9 animate-spin text-[#008B8B]" />
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <form
                  onSubmit={submit}
                  className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
                >
                  <div className="mb-6">
                    <h1 className="text-2xl font-black sm:text-3xl">
                      {t.editTitle}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {t.editSubtitle}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputCard
                      icon={<Phone size={18} />}
                      label={t.phone1}
                      value={form.phone1}
                      onChange={(value) => updateField("phone1", value)}
                      placeholder="044 22725"
                    />

                    <InputCard
                      icon={<Phone size={18} />}
                      label={t.phone2}
                      value={form.phone2}
                      onChange={(value) => updateField("phone2", value)}
                      placeholder="09783543901"
                    />

                    <InputCard
                      icon={<Mail size={18} />}
                      label={t.email}
                      value={form.email}
                      onChange={(value) => updateField("email", value)}
                      placeholder="example@gmail.com"
                    />

                    <InputCard
                      icon={<Globe size={18} />}
                      label={t.website}
                      value={form.website}
                      onChange={(value) => updateField("website", value)}
                      placeholder="ucsh.edu.mm"
                    />

                    <InputCard
                      icon={<FaFacebookF size={18} />}
                      label={t.facebookName}
                      value={form.facebookName}
                      onChange={(value) => updateField("facebookName", value)}
                      placeholder="University of Computer Studies, Hinthada"
                    />

                    <InputCard
                      icon={<FaFacebookF size={18} />}
                      label={t.facebookUrl}
                      value={form.facebookUrl}
                      onChange={(value) => updateField("facebookUrl", value)}
                      placeholder="https://www.facebook.com/..."
                    />

                    <div className="md:col-span-2">
                      <TextareaCard
                        icon={<MapPin size={18} />}
                        label={t.address}
                        value={form.address}
                        onChange={(value) => updateField("address", value)}
                        placeholder={t.address}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <TextareaCard
                        icon={<MapPin size={18} />}
                        label={t.mapUrl}
                        value={form.mapUrl}
                        onChange={(value) => updateField("mapUrl", value)}
                        placeholder="https://www.google.com/maps?q=...&output=embed"
                      />
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${
                        isError
                          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      {saving ? t.saving : t.save}
                    </button>
                  </div>
                </form>

                <aside className="space-y-5">
                  <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <h2 className="text-2xl font-black">{t.previewTitle}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {t.previewSubtitle}
                    </p>

                    <div className="mt-5 space-y-3">
                      <PreviewItem
                        icon={<Phone size={17} />}
                        label={t.phones}
                        value={[form.phone1, form.phone2]
                          .filter(Boolean)
                          .join(" / ")}
                        emptyText={t.notSet}
                      />

                      <PreviewItem
                        icon={<Mail size={17} />}
                        label={t.email}
                        value={form.email}
                        emptyText={t.notSet}
                      />

                      <PreviewItem
                        icon={<Globe size={17} />}
                        label={t.website}
                        value={form.website}
                        emptyText={t.notSet}
                      />

                      <PreviewItem
                        icon={<FaFacebookF size={16} />}
                        label={t.facebook}
                        value={form.facebookName || form.facebookUrl}
                        emptyText={t.notSet}
                      />

                      <PreviewItem
                        icon={<MapPin size={17} />}
                        label={t.address}
                        value={form.address}
                        emptyText={t.notSet}
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                      <h3 className="font-black">{t.mapPreview}</h3>
                    </div>

                    <div className="h-[320px] bg-slate-100 dark:bg-slate-950">
                      {form.mapUrl ? (
                        <iframe
                          src={form.mapUrl}
                          width="100%"
                          height="100%"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          className="border-0"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm font-bold text-slate-400">
                          {t.mapEmpty}
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/20">
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
    <label className="block rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm transition focus-within:border-[#25C9C8] focus-within:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:focus-within:bg-slate-950">
      <div className="mb-3 flex items-center gap-3">
        <IconBox>{icon}</IconBox>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">
          {label}
        </span>
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm transition focus-within:border-[#25C9C8] focus-within:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:focus-within:bg-slate-950">
      <div className="mb-3 flex items-center gap-3">
        <IconBox>{icon}</IconBox>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">
          {label}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:ring-4 focus:ring-[#00BFC4]/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
    </label>
  );
}

function PreviewItem({
  icon,
  label,
  value,
  emptyText,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emptyText: string;
}) {
  return (
    <div className="flex gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EFFFFF] text-[#008B8B] dark:bg-[#00BFC4]/10">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-bold text-slate-700 dark:text-slate-200">
          {value || emptyText}
        </p>
      </div>
    </div>
  );
}