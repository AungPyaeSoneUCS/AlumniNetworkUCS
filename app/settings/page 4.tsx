// file: app/settings/page.tsx
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  FaBriefcase,
  FaBuilding,
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaLocationDot,
  FaPhone,
  FaPlus,
  FaFloppyDisk as FaSave,
  FaTelegram,
  FaTiktok,
  FaTrash,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";
import { SiLine, SiViber } from "react-icons/si";

import ImageUploadEditor from "@/components/image-upload-editor";
import { useI18n } from "@/components/providers";

type Experience = {
  company?: string;
  position?: string;
  employmentType?: string;
  location?: string;
  phone?: string;
  email?: string;
  salary?: string;
  website?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  experienceYear?: string;
};

type ProfileData = {
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  graduatedYear?: number | "";
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    company?: string;
    position?: string;
  };
  experiences?: Experience[];
  socialLinks?: {
    facebook?: string;
    telegram?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    github?: string;
    tiktok?: string;
    viber?: string;
    line?: string;
    x?: string;
    whatsapp?: string;
    website?: string;
  };
};

const employmentTypes = [
  "",
  "Full-Time",
  "Part-Time",
  "Freelance",
  "Internship",
  "Contract",
  "Remote",
  "Hybrid",
  "Temporary",
  "Volunteer",
  "Self-Employed",
];

const text = {
  en: {
    title: "Profile Settings",
    subtitle: "Edit your alumni profile.",
    loading: "Loading profile...",
    saveSuccess: "Profile updated successfully.",
    saveFailed: "Failed to save profile.",
    saving: "Saving...",
    saveChanges: "Save",
    profileInfo: "Register Data",
    contactInfo: "Contact",
    workExperience: "Experience",
    socialLinks: "Social Links",
    fullName: "Name",
    email: "Mail",
    graduatedYear: "Graduated Year",
    bio: "Bio",
    bioPlaceholder: "Tell alumni about yourself...",
    phone: "Phone",
    address: "Address",
    company: "Company",
    position: "Position",
    addExperience: "Add",
    employmentType: "Job Type",
    location: "Job Location",
    salary: "Salary",
    website: "Website",
    startDate: "Start Date",
    endDate: "End Date",
    currentJob: "Current",
    experienceYear: "Experience Year",
    tabs: {
      personal: "Personal",
      experience: "Experience",
      social: "Social",
    },
    validation: {
      required: "Please fill all required fields.",
      invalidEmail: "Please enter a valid mail.",
      invalidPhone: "Please enter a valid phone number.",
      invalidSalary: "Salary must be at least 3 digits.",
      invalidUrl: "URL must start with http:// or https://.",
      invalidDate: "End Date must be after Start Date.",
    },
  },
  mm: {
    title: "ပရိုဖိုင် ဆက်တင်များ",
    subtitle: "သင့် alumni profile ကို ပြင်ဆင်ပါ။",
    loading: "ပရိုဖိုင် ဖွင့်နေသည်...",
    saveSuccess: "ပရိုဖိုင် ပြင်ဆင်ပြီးပါပြီ။",
    saveFailed: "ပရိုဖိုင် သိမ်းဆည်းမှု မအောင်မြင်ပါ။",
    saving: "သိမ်းနေသည်...",
    saveChanges: "သိမ်းမည်",
    profileInfo: "Register Data",
    contactInfo: "ဆက်သွယ်ရန်",
    workExperience: "အတွေ့အကြုံ",
    socialLinks: "Social Links",
    fullName: "အမည်",
    email: "မေးလ်",
    graduatedYear: "ဘွဲ့ရနှစ်",
    bio: "Bio",
    bioPlaceholder: "သင့်အကြောင်း ရေးပါ...",
    phone: "ဖုန်း",
    address: "လိပ်စာ",
    company: "ကုမ္ပဏီ",
    position: "ရာထူး",
    addExperience: "ထည့်မည်",
    employmentType: "အလုပ်အမျိုးအစား",
    location: "အလုပ်တည်နေရာ",
    salary: "လစာ",
    website: "Website",
    startDate: "စတင်ရက်",
    endDate: "ပြီးဆုံးရက်",
    currentJob: "လက်ရှိ",
    experienceYear: "လုပ်သက်နှစ်",
    tabs: {
      personal: "အခြေခံ",
      experience: "အတွေ့အကြုံ",
      social: "Social",
    },
    validation: {
      required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ။",
      invalidEmail: "မှန်ကန်သော မေးလ် ထည့်ပါ။",
      invalidPhone: "မှန်ကန်သော ဖုန်းနံပါတ် ထည့်ပါ။",
      invalidSalary: "လစာသည် အနည်းဆုံး ၃ လုံး ဖြစ်ရမည်။",
      invalidUrl: "URL သည် http:// သို့မဟုတ် https:// ဖြင့် စရမည်။",
      invalidDate: "End Date သည် Start Date ထက် နောက်ကျရမည်။",
    },
  },
};

const emptyProfile: ProfileData = {
  name: "",
  email: "",
  image: "",
  bio: "",
  graduatedYear: "",
  contactInfo: {
    phone: "",
    email: "",
    address: "",
    company: "",
    position: "",
  },
  experiences: [],
  socialLinks: {
    facebook: "",
    telegram: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    github: "",
    tiktok: "",
    viber: "",
    line: "",
    x: "",
    whatsapp: "",
    website: "",
  },
};

export default function SettingsPage() {
  const { lang } = useI18n();
  const currentLang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "social">("personal");
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      setForm({
        ...emptyProfile,
        ...data,
        graduatedYear: data.graduatedYear || "",
        contactInfo: { ...emptyProfile.contactInfo, ...data.contactInfo },
        experiences: Array.isArray(data.experiences) ? data.experiences : [],
        socialLinks: { ...emptyProfile.socialLinks, ...data.socialLinks },
      });
    } catch {
      setError(t.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateContactField(key: keyof NonNullable<ProfileData["contactInfo"]>, value: string) {
    setForm((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [key]: value },
    }));
  }

  function addExperience() {
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...(prev.experiences || []),
        {
          position: "",
          company: "",
          employmentType: "",
          location: "",
          salary: "",
          experienceYear: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          phone: "",
          email: "",
          website: "",
        },
      ],
    }));
  }

  function removeExperience(index: number) {
    setForm((prev) => ({
      ...prev,
      experiences: (prev.experiences || []).filter((_, item) => item !== index),
    }));
  }

  function updateExperience(index: number, key: keyof Experience, value: string | boolean) {
    setForm((prev) => {
      const experiences = [...(prev.experiences || [])];
      experiences[index] = { ...experiences[index], [key]: value };

      if (key === "isCurrent" && value === true) {
        experiences[index].endDate = "";
      }

      return { ...prev, experiences };
    });
  }

  function validateData() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s()]{6,20}$/;
    const urlRegex = /^https?:\/\/.+/i;

    if (form.contactInfo?.email && !emailRegex.test(form.contactInfo.email)) {
      setActiveTab("personal");
      setError(t.validation.invalidEmail);
      return false;
    }

    if (form.contactInfo?.phone && !phoneRegex.test(form.contactInfo.phone)) {
      setActiveTab("personal");
      setError(t.validation.invalidPhone);
      return false;
    }

    if (form.socialLinks?.website && !urlRegex.test(form.socialLinks.website)) {
      setActiveTab("social");
      setError(t.validation.invalidUrl);
      return false;
    }

    for (let i = 0; i < (form.experiences || []).length; i++) {
      const exp = form.experiences![i];

      if (
        !exp.position?.trim() ||
        !exp.company?.trim() ||
        !exp.employmentType?.trim() ||
        !exp.location?.trim() ||
        !exp.salary?.trim() ||
        !exp.experienceYear?.trim() ||
        !exp.startDate?.trim() ||
        (!exp.isCurrent && !exp.endDate?.trim())
      ) {
        setActiveTab("experience");
        setError(`${t.workExperience} ${i + 1}: ${t.validation.required}`);
        return false;
      }

      if (!/^\d{3,}$/.test(exp.salary.replace(/[,\s]/g, ""))) {
        setActiveTab("experience");
        setError(`${t.workExperience} ${i + 1}: ${t.validation.invalidSalary}`);
        return false;
      }

      if (exp.email && !emailRegex.test(exp.email)) {
        setActiveTab("experience");
        setError(`${t.workExperience} ${i + 1}: ${t.validation.invalidEmail}`);
        return false;
      }

      if (exp.phone && !phoneRegex.test(exp.phone)) {
        setActiveTab("experience");
        setError(`${t.workExperience} ${i + 1}: ${t.validation.invalidPhone}`);
        return false;
      }

      if (exp.website && !urlRegex.test(exp.website)) {
        setActiveTab("experience");
        setError(`${t.workExperience} ${i + 1}: ${t.validation.invalidUrl}`);
        return false;
      }

      if (!exp.isCurrent && exp.startDate && exp.endDate && exp.endDate < exp.startDate) {
        setActiveTab("experience");
        setError(`${t.workExperience} ${i + 1}: ${t.validation.invalidDate}`);
        return false;
      }
    }

    return true;
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    if (!validateData()) {
      setSaving(false);
      return;
    }

    try {
      const payload = {
        image: form.image || "",
        bio: form.bio || "",
        contactInfo: {
          phone: form.contactInfo?.phone || "",
          email: form.contactInfo?.email || "",
          address: form.contactInfo?.address || "",
          company: form.contactInfo?.company || "",
          position: form.contactInfo?.position || "",
        },
        experiences: (form.experiences || []).map((item) => ({
          position: item.position || "",
          company: item.company || "",
          employmentType: item.employmentType || "",
          location: item.location || "",
          salary: item.salary || "",
          experienceYear: item.experienceYear || "",
          startDate: item.startDate || "",
          endDate: item.isCurrent ? "" : item.endDate || "",
          isCurrent: Boolean(item.isCurrent),
          phone: item.phone || "",
          email: item.email || "",
          website: item.website || "",
        })),
        socialLinks: form.socialLinks || {},
      };

      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");

      const updated = await res.json();

      setForm({
        ...emptyProfile,
        ...updated,
        graduatedYear: updated.graduatedYear || "",
        contactInfo: { ...emptyProfile.contactInfo, ...updated.contactInfo },
        experiences: Array.isArray(updated.experiences) ? updated.experiences : [],
        socialLinks: { ...emptyProfile.socialLinks, ...updated.socialLinks },
      });

      setMessage(t.saveSuccess);
    } catch {
      setError(t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25C9C8] border-t-transparent" />
      </main>
    );
  }

  return (
    <section className="min-h-screen bg-[#F0F2F5] px-3 py-4 text-slate-950 sm:px-4">
      <form onSubmit={saveProfile} className="mx-auto w-full max-w-4xl space-y-4">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-24 bg-gradient-to-br from-[#00BFC4] via-[#25C9C8] to-[#008B8B] sm:h-32" />

          <div className="px-4 pb-4">
            <div className="-mt-10 flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-3">
                <ImageUploadEditor
                  image={form.image || ""}
                  title={form.name || t.title}
                  description={form.email || t.subtitle}
                  compact
                  rounded="square"
                  onChange={(url) => updateField("image", url)}
                />

                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-xl font-black text-slate-950 sm:text-2xl">
                    {form.name || t.title}
                  </h1>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {form.email || t.subtitle}
                  </p>
                </div>
              </div>

              <button type="submit" disabled={saving} className="save-btn">
                <FaSave />
                {saving ? t.saving : t.saveChanges}
              </button>
            </div>

            {(message || error) && (
              <div
                className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${
                  message
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-red-50 text-red-700 ring-1 ring-red-100"
                }`}
              >
                {message || error}
              </div>
            )}

            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(["personal", "experience", "social"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${
                    activeTab === tab
                      ? "bg-[#25C9C8]/15 text-[#008B8B]"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t.tabs[tab]}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className={activeTab === "personal" ? "block" : "hidden"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title={t.profileInfo}>
              <div className="space-y-3">
                <Input label={t.fullName} value={form.name || ""} disabled />
                <Input label={t.email} type="email" value={form.email || ""} disabled />
                <Input label={t.graduatedYear} value={String(form.graduatedYear || "")} disabled />

                <div>
                  <Label>{t.bio}</Label>
                  <textarea
                    value={form.bio || ""}
                    onChange={(e) => updateField("bio", e.target.value)}
                    placeholder={t.bioPlaceholder}
                    rows={3}
                    className={inputClass("resize-none")}
                  />
                </div>
              </div>
            </Card>

            <Card title={t.contactInfo}>
              <div className="space-y-3">
                <Input icon={<FaPhone />} label={t.phone} value={form.contactInfo?.phone || ""} onChange={(v) => updateContactField("phone", v)} />
                <Input icon={<FaEnvelope />} label={t.email} type="email" value={form.contactInfo?.email || ""} onChange={(v) => updateContactField("email", v)} />

                <div>
                  <Label>{t.address}</Label>
                  <div className="relative">
                    <FaLocationDot className="absolute left-3 top-3.5 text-xs text-slate-400" />
                    <textarea
                      value={form.contactInfo?.address || ""}
                      onChange={(e) => updateContactField("address", e.target.value)}
                      rows={2}
                      className={inputClass("resize-none pl-9")}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className={activeTab === "experience" ? "block" : "hidden"}>
          <Card
            title={t.workExperience}
            action={
              <button type="button" onClick={addExperience} className="add-btn">
                <FaPlus size={11} /> {t.addExperience}
              </button>
            }
          >
            <div className="space-y-4">
              {(form.experiences || []).map((exp, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {t.workExperience} {idx + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="rounded-lg bg-white p-2 text-slate-400 shadow-sm hover:text-red-500"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Input required label={t.position} value={exp.position || ""} onChange={(v) => updateExperience(idx, "position", v)} />
                    <Input required label={t.company} value={exp.company || ""} onChange={(v) => updateExperience(idx, "company", v)} />

                    <div>
                      <Label>{t.employmentType} *</Label>
                      <Select value={exp.employmentType || ""} onChange={(v) => updateExperience(idx, "employmentType", v)} required>
                        {employmentTypes.map((type) => (
                          <option key={type || "empty"} value={type}>
                            {type || t.employmentType}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <Input required label={t.location} value={exp.location || ""} onChange={(v) => updateExperience(idx, "location", v)} />

                    <Input
                      required
                      label={t.salary}
                      type="number"
                      min="100"
                      placeholder="100000"
                      value={exp.salary || ""}
                      onChange={(v) => updateExperience(idx, "salary", v)}
                    />

                    <Input
                      required
                      label={t.experienceYear}
                      type="number"
                      min="0"
                      placeholder="2"
                      value={exp.experienceYear || ""}
                      onChange={(v) => updateExperience(idx, "experienceYear", v)}
                    />

                    <Input required label={t.startDate} type="month" value={exp.startDate || ""} onChange={(v) => updateExperience(idx, "startDate", v)} />

                    <Input
                      required={!exp.isCurrent}
                      label={t.endDate}
                      type="month"
                      value={exp.endDate || ""}
                      disabled={Boolean(exp.isCurrent)}
                      onChange={(v) => updateExperience(idx, "endDate", v)}
                    />

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={Boolean(exp.isCurrent)}
                        onChange={(e) => updateExperience(idx, "isCurrent", e.target.checked)}
                        className="h-4 w-4 accent-[#008B8B]"
                      />
                      {t.currentJob}
                    </label>

                    <Input icon={<FaPhone />} label={t.phone} value={exp.phone || ""} onChange={(v) => updateExperience(idx, "phone", v)} />
                    <Input icon={<FaEnvelope />} label={t.email} type="email" value={exp.email || ""} onChange={(v) => updateExperience(idx, "email", v)} />
                    <Input label={t.website} type="url" value={exp.website || ""} onChange={(v) => updateExperience(idx, "website", v)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={activeTab === "social" ? "block" : "hidden"}>
          <Card title={t.socialLinks}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SocialInput icon={<FaFacebook />} label="Facebook" value={form.socialLinks?.facebook || ""} onChange={(v) => updateSocial("facebook", v)} />
              <SocialInput icon={<FaLinkedin />} label="LinkedIn" value={form.socialLinks?.linkedin || ""} onChange={(v) => updateSocial("linkedin", v)} />
              <SocialInput icon={<FaGithub />} label="GitHub" value={form.socialLinks?.github || ""} onChange={(v) => updateSocial("github", v)} />
              <SocialInput icon={<FaTelegram />} label="Telegram" value={form.socialLinks?.telegram || ""} onChange={(v) => updateSocial("telegram", v)} />
              <SocialInput icon={<FaInstagram />} label="Instagram" value={form.socialLinks?.instagram || ""} onChange={(v) => updateSocial("instagram", v)} />
              <SocialInput icon={<FaYoutube />} label="YouTube" value={form.socialLinks?.youtube || ""} onChange={(v) => updateSocial("youtube", v)} />
              <SocialInput icon={<FaTiktok />} label="TikTok" value={form.socialLinks?.tiktok || ""} onChange={(v) => updateSocial("tiktok", v)} />
              <SocialInput icon={<SiLine />} label="Line" value={form.socialLinks?.line || ""} onChange={(v) => updateSocial("line", v)} />
              <SocialInput icon={<SiViber />} label="Viber" value={form.socialLinks?.viber || ""} onChange={(v) => updateSocial("viber", v)} />
              <SocialInput icon={<FaWhatsapp />} label="WhatsApp" value={form.socialLinks?.whatsapp || ""} onChange={(v) => updateSocial("whatsapp", v)} />
            </div>
          </Card>
        </div>

        <button type="submit" disabled={saving} className="save-btn w-full sm:w-auto">
          <FaSave />
          {saving ? t.saving : t.saveChanges}
        </button>
      </form>
    </section>
  );

  function updateSocial(key: keyof NonNullable<ProfileData["socialLinks"]>, value: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: cleanUsername(value) },
    }));
  }
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">{children}</label>;
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#25C9C8] focus:bg-white focus:ring-4 focus:ring-[#25C9C8]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${extra}`;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  icon,
  placeholder,
  required = false,
  min,
}: {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <div>
      {label && <Label>{label}{required ? " *" : ""}</Label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{icon}</span>}

        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          min={min}
          onChange={(event) => onChange?.(event.target.value)}
          className={inputClass(icon ? "pl-9" : "")}
        />
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
  required = false,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass("bg-white")}>
      {children}
    </select>
  );
}

function SocialInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex h-[42px] items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-[#25C9C8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#25C9C8]/10">
        <span className="flex w-10 shrink-0 justify-center text-sm text-slate-500">{icon}</span>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm font-bold text-slate-800 outline-none"
        />
      </div>
    </div>
  );
}

function cleanUsername(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^@/, "");
}