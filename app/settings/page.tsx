// file: app/settings/page.tsx
"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Save, AlertCircle, Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaLocationDot,
  FaPhone,
  FaPlus,
  FaTelegram,
  FaTiktok,
  FaTrash,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";
import { SiLine, SiViber } from "react-icons/si";

import ImageUploadEditor from "@/components/image-upload-editor";
import ModernSelect from "@/components/modern-select";
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

type SocialLinks = {
  facebook?: string;
  telegram?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  github?: string;
  tiktok?: string;
  viber?: string;
  line?: string;
  whatsapp?: string;
};

type ProfileData = {
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  degree?: string;
  graduatedYear?: number | "";
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    company?: string;
    position?: string;
  };
  experiences?: Experience[];
  socialLinks?: SocialLinks;
};

const degrees = ["B.C.Sc", "B.C.Tech", "M.C.Sc", "M.C.Tech", "D.C.Sc", "M.I.Sc", "Ph.D"];

const employmentTypes = [
  "Full-Time",
  "Part-Time",
  "Freelance",
  "Internship",
  "Student",
  "Contract",
  "Remote",
  "Hybrid",
  "Temporary",
  "Volunteer",
  "Self-Employed",
];

const socialConfigs: {
  key: keyof SocialLinks;
  label: string;
  prefix: string;
  icon: React.ReactNode;
}[] = [
  { key: "facebook", label: "Facebook", prefix: "https://facebook.com/", icon: <FaFacebook /> },
  { key: "telegram", label: "Telegram", prefix: "https://t.me/", icon: <FaTelegram /> },
  { key: "instagram", label: "Instagram", prefix: "https://instagram.com/", icon: <FaInstagram /> },
  { key: "youtube", label: "YouTube", prefix: "https://youtube.com/", icon: <FaYoutube /> },
  { key: "linkedin", label: "LinkedIn", prefix: "https://linkedin.com/in/", icon: <FaLinkedin /> },
  { key: "github", label: "GitHub", prefix: "https://github.com/", icon: <FaGithub /> },
  { key: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@", icon: <FaTiktok /> },
  { key: "viber", label: "Viber", prefix: "viber://chat?number=", icon: <SiViber /> },
  { key: "line", label: "Line", prefix: "https://line.me/ti/p/", icon: <SiLine /> },
  { key: "whatsapp", label: "WhatsApp", prefix: "https://wa.me/", icon: <FaWhatsapp /> },
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
    profileInfo: "Personal Fields",
    contactInfo: "Contact",
    workExperience: "Experience",
    socialLinks: "Social Links",
    fullName: "Name",
    email: "Mail",
    degree: "Degree",
    selectDegree: "Select Degree",
    graduatedYear: "Graduated Year",
    bio: "Bio",
    bioPlaceholder: "Tell alumni about yourself...",
    phone: "Phone",
    address: "Address",
    addExperience: "Add Experience",
    employmentType: "Job Type",
    location: "Job Location",
    salary: "Income",
    website: "Website",
    company: "Organization",
    position: "Position",
    startDate: "Start Date",
    endDate: "End Date",
    currentJob: "I am currently working here",
    suggestionHint: "Suggestions from other alumni and posted jobs",
    experienceYear: "Experience Year",
    username: "username",
    tabs: { personal: "Personal", experience: "Experience", social: "Social" },
    dialogTitle: "Required Fields Missing",
    dialogClose: "Close",
    validation: {
      required: "is required.",
      invalidEmail: "Please enter a valid mail.",
      invalidPhone: "Please enter a valid phone number.",
      invalidSalary: "Income must be at least 3 digits.",
      studentSalary: "Student income cannot exceed 1,000,000.",
      invalidUrl: "Website URL must start with http:// or https://.",
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
    profileInfo: "ကိုယ်ရေးအချက်အလက်",
    contactInfo: "ဆက်သွယ်ရန်",
    workExperience: "အတွေ့အကြုံ",
    socialLinks: "Social Links",
    fullName: "အမည်",
    email: "မေးလ်",
    degree: "ဘွဲ့",
    selectDegree: "ဘွဲ့ ရွေးပါ",
    graduatedYear: "ဘွဲ့ရနှစ်",
    bio: "Bio",
    bioPlaceholder: "သင့်အကြောင်း ရေးပါ...",
    phone: "ဖုန်း",
    address: "လိပ်စာ",
    addExperience: "အတွေ့အကြုံ ထည့်မည်",
    employmentType: "အလုပ်အမျိုးအစား",
    location: "အလုပ်တည်နေရာ",
    salary: "ဝင်ငွေ",
    website: "Website",
    company: "အဖွဲ့အစည်း",
    position: "ရာထူး",
    startDate: "စတင်ရက်",
    endDate: "ပြီးဆုံးရက်",
    currentJob: "ကျွန်ုပ်သည် လက်ရှိ ဤနေရာတွင် အလုပ်လုပ်နေသည်",
    suggestionHint: "Alumni များနှင့် ပို့စ်တင်ထားသော အလုပ်များမှ အကြံပြုချက်များ",
    experienceYear: "လုပ်သက်နှစ်",
    username: "username",
    tabs: { personal: "အခြေခံ", experience: "အတွေ့အကြုံ", social: "Social" },
    dialogTitle: "လိုအပ်သော အချက်အလက်များ လိုအပ်နေပါသည်",
    dialogClose: "ပိတ်မည်",
    validation: {
      required: "လိုအပ်ပါသည်။",
      invalidEmail: "မှန်ကန်သော မေးလ် ထည့်ပါ။",
      invalidPhone: "မှန်ကန်သော ဖုန်းနံပါတ် ထည့်ပါ။",
      invalidSalary: "လစာသည် အနည်းဆုံး ၃ လုံး ဖြစ်ရမည်။",
      studentSalary: "ကျောင်းသား ဝင်ငွေသည် ၁,၀၀၀,၀၀၀ ထက် မကျော်ရပါ။",
      invalidUrl: "Website URL သည် http:// သို့မဟုတ် https:// ဖြင့် စရမည်။",
      invalidDate: "End Date သည် Start Date ထက် နောက်ကျရမည်။",
    },
  },
};

const emptyProfile: ProfileData = {
  name: "",
  email: "",
  image: "",
  bio: "",
  degree: "",
  graduatedYear: "",
  contactInfo: { phone: "", email: "", address: "", company: "", position: "" },
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
    whatsapp: "",
  },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{6,20}$/;
const urlRegex = /^https?:\/\/[^\s]+\.[^\s]+/i;

const gradientBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100";

function cleanSocialValue(value: string, prefix: string) {
  let next = value.trim();

  for (const config of socialConfigs) {
    if (next.startsWith(config.prefix)) next = next.replace(config.prefix, "");
  }

  next = next.replace(/^https?:\/\/(www\.)?/i, "");
  next = next.replace(/^@+/, "");
  next = next.replace(/^\/+/, "");

  if (prefix.includes("wa.me") || prefix.includes("viber")) {
    next = next.replace(/[^\d+]/g, "");
  }

  return next;
}

export default function SettingsPage() {
  const { lang } = useI18n();
  const currentLang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "social">("personal");
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dialogErrors, setDialogErrors] = useState<string[]>([]);
  const lastExperienceRef = useRef<HTMLDivElement | null>(null);

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
        degree: data.degree || "",
        graduatedYear: data.graduatedYear || "",
        contactInfo: { ...emptyProfile.contactInfo, ...data.contactInfo },
        experiences: Array.isArray(data.experiences) ? data.experiences : [],
        socialLinks: {
          ...emptyProfile.socialLinks,
          ...data.socialLinks,
          website: undefined,
        },
      });
    } catch {
      setDialogErrors([t.saveFailed]);
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

  function updateSocial(key: keyof SocialLinks, value: string, prefix: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: cleanSocialValue(value, prefix),
      },
    }));
  }

  function addExperience() {
    setActiveTab("experience");

    setForm((prev) => ({
      ...prev,
      experiences: [
        ...(prev.experiences || []),
        {
          position: "",
          company: "",
          employmentType: "Student",
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

    setTimeout(() => {
      lastExperienceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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

      if (key === "isCurrent" && value === true) experiences[index].endDate = "";

      return { ...prev, experiences };
    });
  }

  function validateData() {
    const errors: string[] = [];
    let firstErrorTab: "personal" | "experience" | "social" | null = null;

    // Personal Fields Validation
    if (!form.degree?.trim()) {
      errors.push(`${t.degree} ${t.validation.required}`);
      if (!firstErrorTab) firstErrorTab = "personal";
    }

    if (form.contactInfo?.email && !emailRegex.test(form.contactInfo.email.trim())) {
      errors.push(t.validation.invalidEmail);
      if (!firstErrorTab) firstErrorTab = "personal";
    }

    if (form.contactInfo?.phone && !phoneRegex.test(form.contactInfo.phone.trim())) {
      errors.push(t.validation.invalidPhone);
      if (!firstErrorTab) firstErrorTab = "personal";
    }

    // Experiences Validation
    for (let i = 0; i < (form.experiences || []).length; i++) {
      const exp = form.experiences![i];
      const missingExpFields: string[] = [];

      if (!exp.position?.trim()) missingExpFields.push(t.position);
      if (!exp.company?.trim()) missingExpFields.push(t.company);
      if (!exp.employmentType?.trim()) missingExpFields.push(t.employmentType);
      if (!exp.location?.trim()) missingExpFields.push(t.location);
      if (!exp.salary?.trim()) missingExpFields.push(t.salary);
      if (!exp.experienceYear?.trim()) missingExpFields.push(t.experienceYear);
      if (!exp.startDate?.trim()) missingExpFields.push(t.startDate);
      if (!exp.isCurrent && !exp.endDate?.trim()) missingExpFields.push(t.endDate);

      if (missingExpFields.length > 0) {
        errors.push(`Experience ${i + 1}: Missing ${missingExpFields.join(", ")}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }

      if (exp.salary && !/^\d{3,}$/.test(exp.salary.replace(/[,\s]/g, ""))) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidSalary}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }

      const salaryNum = exp.salary ? Number(exp.salary.replace(/[,\s]/g, "")) : NaN;
      if (exp.employmentType === "Student" && !Number.isNaN(salaryNum) && salaryNum > 1000000) {
        errors.push(`Experience ${i + 1}: ${t.validation.studentSalary}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }

      if (exp.email && !emailRegex.test(exp.email.trim())) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidEmail}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }

      if (exp.phone && !phoneRegex.test(exp.phone.trim())) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidPhone}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }

      if (exp.website && !urlRegex.test(exp.website.trim())) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidUrl}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }

      if (!exp.isCurrent && exp.startDate && exp.endDate && exp.endDate < exp.startDate) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidDate}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }
    }

    if (errors.length > 0) {
      if (firstErrorTab) setActiveTab(firstErrorTab);
      setDialogErrors(errors);
      return false;
    }

    return true;
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setDialogErrors([]);

    if (!validateData()) {
      setSaving(false);
      return;
    }

    try {
      const payload = {
        image: form.image || "",
        bio: form.bio || "",
        degree: form.degree || "",
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
        socialLinks: {
          facebook: form.socialLinks?.facebook || "",
          telegram: form.socialLinks?.telegram || "",
          instagram: form.socialLinks?.instagram || "",
          youtube: form.socialLinks?.youtube || "",
          linkedin: form.socialLinks?.linkedin || "",
          github: form.socialLinks?.github || "",
          tiktok: form.socialLinks?.tiktok || "",
          viber: form.socialLinks?.viber || "",
          line: form.socialLinks?.line || "",
          whatsapp: form.socialLinks?.whatsapp || "",
        },
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
        degree: updated.degree || "",
        graduatedYear: updated.graduatedYear || "",
        contactInfo: { ...emptyProfile.contactInfo, ...updated.contactInfo },
        experiences: Array.isArray(updated.experiences) ? updated.experiences : [],
        socialLinks: { ...emptyProfile.socialLinks, ...updated.socialLinks, website: undefined },
      });

      setMessage(t.saveSuccess);
    } catch {
      setDialogErrors([t.saveFailed]);
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
    <>
      <section className="min-h-screen bg-[#F0F2F5] px-3 py-4 text-slate-950 sm:px-4">
        <form onSubmit={saveProfile} className="mx-auto w-full max-w-4xl space-y-4">
          <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-24 bg-gradient-to-br from-[#00BFC4] via-[#25C9C8] to-[#008B8B] sm:h-32" />

            <div className="px-4 pb-4">
              <div className="-mt-10 flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-3">
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

                <button type="submit" disabled={saving} className={gradientBtn}>
                  <Save className="h-3.5 w-3.5" />
                  {saving ? t.saving : t.saveChanges}
                </button>
              </div>

              {message && (
                <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                  {message}
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

          {activeTab === "personal" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card title={t.profileInfo}>
                <div className="space-y-3">
                  <Input label={t.fullName} value={form.name || ""} disabled />
                  <Input label={t.email} type="email" value={form.email || ""} disabled />

                  <div>
                    <Label>{t.degree} *</Label>
                    <Select required value={form.degree || ""} onChange={(v) => updateField("degree", v)}>
                      <option value="">{t.selectDegree}</option>
                      {degrees.map((degree) => (
                        <option key={degree} value={degree}>
                          {degree}
                        </option>
                      ))}
                    </Select>
                  </div>

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
                  <Input
                    icon={<FaPhone />}
                    label={t.phone}
                    value={form.contactInfo?.phone || ""}
                    placeholder="+959123456789"
                    onChange={(v) => updateContactField("phone", v)}
                  />
                  <Input
                    icon={<FaEnvelope />}
                    label={t.email}
                    type="email"
                    value={form.contactInfo?.email || ""}
                    placeholder="name@example.com"
                    onChange={(v) => updateContactField("email", v)}
                  />

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
          )}

          {activeTab === "experience" && (
            <Card title={t.workExperience}>
              <div className="space-y-4">
                {(form.experiences || []).map((exp, idx) => (
                  <div
                    key={idx}
                    ref={idx === (form.experiences || []).length - 1 ? lastExperienceRef : null}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
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
                      <AutoCompleteInput field="position" required label={t.position} value={exp.position || ""} onChange={(v) => updateExperience(idx, "position", v)}  />
                      <AutoCompleteInput field="company" required label={t.company} value={exp.company || ""} onChange={(v) => updateExperience(idx, "company", v)}  />

                      <div>
                        <Label>{t.employmentType} *</Label>
                        <ModernSelect
                          value={exp.employmentType || ""}
                          onChange={(v) => updateExperience(idx, "employmentType", v)}
                          options={employmentTypes}
                          placeholder=""
                        />
                      </div>

                      <AutoCompleteInput field="location" required label={t.location} value={exp.location || ""} onChange={(v) => updateExperience(idx, "location", v)} />
                      <AutoCompleteInput field="salary" required type="number" min="100" max={exp.employmentType === "Student" ? "1000000" : undefined} label={t.salary} value={exp.salary || ""} onChange={(v) => updateExperience(idx, "salary", v)} />

                      {exp.employmentType === "Student" && (
                        <p className="-mt-2 text-[11px] font-bold text-amber-600 md:col-span-2">
                          {t.validation.studentSalary}
                        </p>
                      )}
                      <Input required label={t.experienceYear} type="number" min="0" value={exp.experienceYear || ""} onChange={(v) => updateExperience(idx, "experienceYear", v)} />
                      <MonthPickerInput required label={t.startDate} value={exp.startDate || ""} onChange={(v) => updateExperience(idx, "startDate", v)} />
                      <MonthPickerInput required={!exp.isCurrent} label={t.endDate} value={exp.endDate || ""} disabled={Boolean(exp.isCurrent)} onChange={(v) => updateExperience(idx, "endDate", v)} />

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
                      <Input label={t.website} type="url" value={exp.website || ""} placeholder="https://example.com" onChange={(v) => updateExperience(idx, "website", v)} />
                    </div>
                  </div>
                ))}

                <div className="flex justify-center pt-1 sm:justify-end">
                  <button type="button" onClick={addExperience} className={gradientBtn}>
                    <FaPlus className="text-[11px]" />
                    {t.addExperience}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "social" && (
            <Card title={t.socialLinks}>
              <div className="grid gap-3 sm:grid-cols-2">
                {socialConfigs.map((item) => (
                  <SocialInput
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    prefix={item.prefix}
                    value={form.socialLinks?.[item.key] || ""}
                    onChange={(v) => updateSocial(item.key, v, item.prefix)}
                  />
                ))}
              </div>
            </Card>
          )}

         
        </form>
      </section>

      {/* Validation Dialog Box */}
      {dialogErrors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="rounded-full bg-red-100 p-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">{t.dialogTitle}</h3>
            </div>
            
            <div className="mb-6 max-h-[50vh] overflow-y-auto">
              <ul className="list-inside list-disc space-y-1.5 text-sm font-bold text-slate-700">
                {dialogErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setDialogErrors([])}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 active:scale-95"
            >
              {t.dialogClose}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
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
  return (
    <label className="mb-1.5 block text-sm font-black uppercase tracking-wider text-slate-500">
      {children}
    </label>
  );
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#25C9C8] focus:bg-white focus:ring-4 focus:ring-[#25C9C8]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${extra}`;
}

function AutoCompleteInput({
  label,
  field,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder,
  min,
  max,
  hint,
}: {
  label: string;
  field: "position" | "company" | "location" | "salary";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClickAway(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickAway);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  function loadSuggestions(query: string) {
    fetch(`/api/suggestions?field=${field}&q=${encodeURIComponent(query.trim())}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []))
      .catch(() => setSuggestions([]));
  }

  function handleChange(next: string) {
    onChange(next);
    setOpen(true);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => loadSuggestions(next), 200);
  }

  function pick(value: string) {
    onChange(value);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      {label && (
        <Label>
          {label}
          {required ? " *" : ""}
        </Label>
      )}

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        onFocus={() => {
          setOpen(true);
          loadSuggestions(value);
        }}
        onChange={(event) => handleChange(event.target.value)}
        className={inputClass()}
      />

      {hint && <p className="mt-1 text-[11px] font-bold text-slate-400">{hint}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 z-30 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => pick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-[#25C9C8]/10 hover:text-[#008B8B] dark:text-slate-200"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MonthPickerInput({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const { lang } = useI18n();
  const locale = lang === "mm" ? "my-MM" : "en-US";
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [year, setYear] = useState(() => {
    const match = value ? /^(\d{4})-/.exec(value) : null;
    const parsed = match ? Number(match[1]) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
  });

  useEffect(() => {
    const match = value ? /^(\d{4})-/.exec(value) : null;
    const parsed = match ? Number(match[1]) : Number.NaN;
    if (Number.isFinite(parsed)) setYear(parsed);
  }, [value]);

  useEffect(() => {
    function handleClickAway(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const display = (() => {
    const match = /^(\d{4})-(\d{2})$/.exec(value || "");
    if (!match) return "";
    const month = Number(match[2]);
    if (month < 1 || month > 12) return "";
    return new Date(Number(match[1]), month - 1, 1).toLocaleDateString(locale, {
      month: "short",
      year: "numeric",
    });
  })();

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(year, i, 1).toLocaleDateString(locale, { month: "short" })
  );

  const selectedMonth =
    /^(\d{4})-(\d{2})$/.test(value || "") &&
    Number(value.slice(0, 4)) === year
      ? Number(value.slice(5, 7))
      : 0;

  return (
    <div ref={boxRef} className="relative">
      {label && (
        <Label>
          {label}
          {required ? " *" : ""}
        </Label>
      )}

      {disabled ? (
        <div className={`${inputClass()} flex items-center gap-2`}>
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate text-slate-500">{display || ""}</span>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={`${inputClass()} flex items-center gap-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            display ? "text-[#008B8B]" : ""
          }`}
        >
          <Calendar size={16} className="shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 truncate text-left">
            {display || placeholderText(locale)}
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-[#008B8B]" : ""}`}
          />
        </button>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYear((prev) => prev - 1)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-[#25C9C8]/10 hover:text-[#008B8B]"
            >
              <ChevronLeft size={16} />
            </button>

            <p className="text-xs font-black text-slate-800 dark:text-slate-100">{year}</p>

            <button
              type="button"
              onClick={() => setYear((prev) => prev + 1)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-[#25C9C8]/10 hover:text-[#008B8B]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {monthLabels.map((monthLabel, index) => {
              const isSelected = index + 1 === selectedMonth;

              return (
                <button
                  key={monthLabel}
                  type="button"
                  onClick={() => {
                    const padded = String(index + 1).padStart(2, "0");
                    onChange(`${year}-${padded}`);
                    setOpen(false);
                  }}
                  className={`rounded-lg px-2 py-2 text-[11px] font-black transition sm:text-xs ${
                    isSelected
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-sm"
                      : "text-slate-700 hover:bg-[#94EFEE]/40 dark:text-slate-200 hover:text-[#008B8B] dark:hover:bg-slate-800"
                  }`}
                >
                  {monthLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function placeholderText(locale: string) {
  return locale.startsWith("my")
    ? "ရက် ရွေး"
    : "Select Month";
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
  max,
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
  max?: string;
}) {
  return (
    <div>
      {label && (
        <Label>
          {label}
          {required ? " *" : ""}
        </Label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
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
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass("bg-white")}
    >
      {children}
    </select>
  );
}

function SocialInput({
  label,
  value,
  onChange,
  icon,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  prefix: string;
}) {
  return (
    <div>
      <Label>{label}</Label>

      <div className="flex min-h-[42px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-[#25C9C8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#25C9C8]/10">
        <span className="flex w-10 shrink-0 items-center justify-center text-sm text-slate-500">
          {icon}
        </span>

        <span className="hidden max-w-[180px] shrink-0 items-center truncate border-l border-slate-200 bg-white/80 px-2 text-[11px] font-black text-slate-400 sm:flex">
          {prefix}
        </span>

        <input
          type="text"
          value={value || ""}
          placeholder="username"
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      <p className="mt-1 block truncate text-sm font-bold text-slate-400 sm:hidden">
        {prefix}
      </p>
    </div>
  );
}