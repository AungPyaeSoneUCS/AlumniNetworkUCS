// file: app/settings/page.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  FaUpload,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";
import { SiLine, SiViber } from "react-icons/si";

import { useI18n } from "@/components/providers";

type Degree =
  | ""
  | "B.C.Sc"
  | "B.C.Tech"
  | "M.C.Sc"
  | "M.C.Tech"
  | "D.C.Sc"
  | "M.I.Sc"
  | "Ph.D";

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
  _id?: string;
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  graduatedYear?: number | "";
  degree?: Degree;
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
    twitter?: string;
    x?: string;
    whatsapp?: string;
    website?: string;
  };
};

const degrees: Degree[] = [
  "",
  "B.C.Sc",
  "B.C.Tech",
  "M.C.Sc",
  "M.C.Tech",
  "D.C.Sc",
  "M.I.Sc",
  "Ph.D",
];

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

function buildSalaryOptions() {
  const options = ["", "Under 300,000"];

  for (let start = 300000; start < 1500000; start += 200000) {
    const end = start + 200000;
    options.push(`${start.toLocaleString()} - ${end.toLocaleString()}`);
  }

  options.push("Upper 1,500,000");
  return options;
}

const socialPrefixes = {
  facebook: "facebook.com/",
  telegram: "t.me/",
  instagram: "instagram.com/",
  youtube: "youtube.com/@",
  linkedin: "linkedin.com/in/",
  github: "github.com/",
  tiktok: "tiktok.com/@",
  viber: "viber://chat?number=",
  line: "line.me/R/ti/p/@",
  x: "x.com/",
  whatsapp: "wa.me/",
};

const text = {
  en: {
    title: "Profile Settings",
    subtitle: "Edit your alumni profile.",
    loading: "Loading profile...",
    saveSuccess: "Profile updated successfully.",
    saveFailed: "Failed to save profile.",
    photoUploadFailed: "Photo upload failed.",
    saving: "Saving...",
    saveChanges: "Save",
    profileInfo: "Profile",
    contactInfo: "Contact",
    workExperience: "Experience",
    socialLinks: "Social Links",
    fullName: "Full Name",
    email: "Email",
    graduatedYear: "Graduated Year",
    degree: "Degree",
    selectDegree: "Select degree",
    bio: "Bio",
    bioPlaceholder: "Tell alumni about yourself...",
    phone: "Phone",
    address: "Address",
    company: "Company",
    position: "Position",
    addExperience: "Add",
    employmentType: "Type",
    location: "Location",
    companyPhone: "Company Phone",
    companyMail: "Company Email",
    salary: "Salary",
    website: "Website",
    startDate: "Start Date",
    endDate: "End Date",
    currentJob: "I currently work here",
    experienceYear: "Experience Year",
    facebook: "Facebook",
    telegram: "Telegram",
    instagram: "Instagram",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    github: "GitHub",
    tiktok: "TikTok",
    viber: "Viber",
    line: "Line",
    whatsapp: "WhatsApp",
    tabs: {
      personal: "Personal",
      experience: "Experience",
      social: "Social",
    },
    validation: {
      invalidEmail: "Please enter a valid email.",
      invalidUrl: "URL must start with http:// or https://.",
      invalidPhone: "Please enter a valid phone number.",
    },
  },
  mm: {
    title: "ပရိုဖိုင် ဆက်တင်များ",
    subtitle: "သင့် alumni profile ကို ပြင်ဆင်ပါ။",
    loading: "ပရိုဖိုင် ဖွင့်နေသည်...",
    saveSuccess: "ပရိုဖိုင် ပြင်ဆင်ပြီးပါပြီ။",
    saveFailed: "ပရိုဖိုင် သိမ်းဆည်းမှု မအောင်မြင်ပါ။",
    photoUploadFailed: "ပုံတင်၍မရပါ။",
    saving: "သိမ်းနေသည်...",
    saveChanges: "သိမ်းမည်",
    profileInfo: "ပရိုဖိုင်",
    contactInfo: "ဆက်သွယ်ရန်",
    workExperience: "အတွေ့အကြုံ",
    socialLinks: "Social Links",
    fullName: "အမည်",
    email: "အီးမေးလ်",
    graduatedYear: "ဘွဲ့ရနှစ်",
    degree: "Degree",
    selectDegree: "Degree ရွေးမည်",
    bio: "Bio",
    bioPlaceholder: "သင့်အကြောင်း ရေးပါ...",
    phone: "ဖုန်း",
    address: "လိပ်စာ",
    company: "ကုမ္ပဏီ",
    position: "ရာထူး",
    addExperience: "ထည့်မည်",
    employmentType: "အမျိုးအစား",
    location: "တည်နေရာ",
    companyPhone: "ကုမ္ပဏီ ဖုန်း",
    companyMail: "ကုမ္ပဏီ အီးမေးလ်",
    salary: "လစာ",
    website: "Website",
    startDate: "စတင်ရက်",
    endDate: "ပြီးဆုံးရက်",
    currentJob: "လက်ရှိ အလုပ်လုပ်နေသည်",
    experienceYear: "လုပ်သက် အတွေ့အကြုံ",
    facebook: "Facebook",
    telegram: "Telegram",
    instagram: "Instagram",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    github: "GitHub",
    tiktok: "TikTok",
    viber: "Viber",
    line: "Line",
    whatsapp: "WhatsApp",
    tabs: {
      personal: "အခြေခံ",
      experience: "အတွေ့အကြုံ",
      social: "Social",
    },
    validation: {
      invalidEmail: "မှန်ကန်သော အီးမေးလ် ထည့်ပါ။",
      invalidUrl: "URL သည် http:// သို့မဟုတ် https:// ဖြင့် စရမည်။",
      invalidPhone: "မှန်ကန်သော ဖုန်းနံပါတ် ထည့်ပါ။",
    },
  },
};

const emptyProfile: ProfileData = {
  name: "",
  email: "",
  image: "",
  bio: "",
  graduatedYear: "",
  degree: "",
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

  const fileRef = useRef<HTMLInputElement | null>(null);
  const salaryOptions = useMemo(() => buildSalaryOptions(), []);
  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = currentYear; year >= 2015; year--) years.push(year);
    return years;
  }, [currentYear]);

  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "social">("personal");
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    try {
      const res = await fetch("/api/me", { cache: "no-store" });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      setForm({
        ...emptyProfile,
        ...data,
        degree: data.degree || data.department || "",
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

  function updateSocialField(key: keyof NonNullable<ProfileData["socialLinks"]>, value: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: key === "website" ? value : cleanUsername(value),
      },
    }));
  }

  function addExperience() {
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...(prev.experiences || []),
        {
          company: "",
          position: "",
          employmentType: "",
          location: "",
          phone: "",
          email: "",
          salary: "",
          website: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          experienceYear: "",
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

  async function uploadPhoto(file?: File) {
    if (!file) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/profile-photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      updateField("image", data.image || data.url || "");
    } catch {
      setError(t.photoUploadFailed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validateData(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^https?:\/\/.+/i;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (form.contactInfo?.email && !emailRegex.test(form.contactInfo.email)) {
      setActiveTab("personal");
      setError(`${t.contactInfo}: ${t.validation.invalidEmail}`);
      return false;
    }

    if (form.contactInfo?.phone && !phoneRegex.test(form.contactInfo.phone)) {
      setActiveTab("personal");
      setError(`${t.contactInfo}: ${t.validation.invalidPhone}`);
      return false;
    }

    if (form.socialLinks?.website && !urlRegex.test(form.socialLinks.website)) {
      setActiveTab("social");
      setError(`${t.socialLinks}: ${t.validation.invalidUrl}`);
      return false;
    }

    for (let i = 0; i < (form.experiences || []).length; i++) {
      const exp = form.experiences![i];

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
        name: form.name || "",
        image: form.image || "",
        bio: form.bio || "",
        graduatedYear: form.graduatedYear === "" ? null : Number(form.graduatedYear),
        degree: form.degree || "",
        contactInfo: {
          phone: form.contactInfo?.phone || "",
          email: form.contactInfo?.email || "",
          address: form.contactInfo?.address || "",
          company: form.contactInfo?.company || "",
          position: form.contactInfo?.position || "",
        },
        experiences: (form.experiences || []).map((item) => ({
          company: item.company || "",
          position: item.position || "",
          employmentType: item.employmentType || "",
          location: item.location || "",
          phone: item.phone || "",
          email: item.email || "",
          salary: item.salary || "",
          website: item.website || "",
          startDate: item.startDate || "",
          endDate: item.isCurrent ? "" : item.endDate || "",
          isCurrent: Boolean(item.isCurrent),
          experienceYear: item.experienceYear || "",
        })),
        socialLinks: {
          facebook: cleanUsername(form.socialLinks?.facebook || ""),
          telegram: cleanUsername(form.socialLinks?.telegram || ""),
          instagram: cleanUsername(form.socialLinks?.instagram || ""),
          youtube: cleanUsername(form.socialLinks?.youtube || ""),
          linkedin: cleanUsername(form.socialLinks?.linkedin || ""),
          github: cleanUsername(form.socialLinks?.github || ""),
          tiktok: cleanUsername(form.socialLinks?.tiktok || ""),
          viber: cleanUsername(form.socialLinks?.viber || ""),
          line: cleanUsername(form.socialLinks?.line || ""),
          x: cleanUsername(form.socialLinks?.x || form.socialLinks?.twitter || ""),
          whatsapp: cleanUsername(form.socialLinks?.whatsapp || ""),
          website: form.socialLinks?.website || "",
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
        degree: updated.degree || updated.department || "",
        graduatedYear: updated.graduatedYear || "",
        contactInfo: { ...emptyProfile.contactInfo, ...updated.contactInfo },
        experiences: Array.isArray(updated.experiences) ? updated.experiences : [],
        socialLinks: { ...emptyProfile.socialLinks, ...updated.socialLinks },
      });

      setMessage(t.saveSuccess);
      setTimeout(() => setMessage(""), 4000);
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
                <div className="group relative shrink-0">
                  <Image
                    src={form.image || "/avatar.png"}
                    alt={form.name || "Profile"}
                    width={88}
                    height={88}
                    priority
                    className="h-20 w-20 rounded-2xl border-4 border-white bg-slate-50 object-cover shadow-sm sm:h-24 sm:w-24"
                  />

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <FaUpload />
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => uploadPhoto(event.target.files?.[0])}
                  />
                </div>

                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-xl font-black text-slate-950 sm:text-2xl">
                    {form.name || t.title}
                  </h1>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {form.email || t.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-60"
              >
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

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
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
                <Input label={t.fullName} value={form.name || ""} onChange={(v) => updateField("name", v)} />
                <Input label={t.email} type="email" value={form.email || ""} disabled />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t.degree}</Label>
                    <Select value={form.degree || ""} onChange={(v) => updateField("degree", v as Degree)}>
                      <option value="">{t.selectDegree}</option>
                      {degrees
                        .filter(Boolean)
                        .map((degree) => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                    </Select>
                  </div>

                  <div>
                    <Label>{t.graduatedYear}</Label>
                    <Select
                      value={form.graduatedYear || ""}
                      onChange={(v) => updateField("graduatedYear", v ? Number(v) : "")}
                    >
                      <option value="">{t.graduatedYear}</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

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

            <div className="space-y-4">
              <Card title={t.contactInfo}>
                <div className="space-y-3">
                  <Input icon={<FaPhone />} label={t.phone} value={form.contactInfo?.phone || ""} onChange={(v) => updateContactField("phone", v)} />
                  <Input icon={<FaEnvelope />} label={t.email} value={form.contactInfo?.email || ""} onChange={(v) => updateContactField("email", v)} />

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

              <Card title="Professional">
                <div className="space-y-3">
                  <Input icon={<FaBriefcase />} label={t.company} value={form.contactInfo?.company || ""} onChange={(v) => updateContactField("company", v)} />
                  <Input icon={<FaBuilding />} label={t.position} value={form.contactInfo?.position || ""} onChange={(v) => updateContactField("position", v)} />
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className={activeTab === "experience" ? "block" : "hidden"}>
          <Card
            title={t.workExperience}
            action={
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2]/10 px-3 py-1.5 text-xs font-black text-[#1877F2] hover:bg-[#1877F2]/20"
              >
                <FaPlus size={11} /> {t.addExperience}
              </button>
            }
          >
            <div className="space-y-4">
              {(form.experiences || []).map((exp, idx) => (
                <div key={idx} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                    <Input label={t.position} value={exp.position || ""} onChange={(v) => updateExperience(idx, "position", v)} />
                    <Input label={t.company} value={exp.company || ""} onChange={(v) => updateExperience(idx, "company", v)} />

                    <div>
                      <Label>{t.employmentType}</Label>
                      <Select value={exp.employmentType || ""} onChange={(v) => updateExperience(idx, "employmentType", v)}>
                        {employmentTypes.map((type) => (
                          <option key={type || "empty"} value={type}>
                            {type || t.employmentType}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <Input label={t.location} value={exp.location || ""} onChange={(v) => updateExperience(idx, "location", v)} />
                    <Input label={t.startDate} type="month" value={exp.startDate || ""} onChange={(v) => updateExperience(idx, "startDate", v)} />
                    <Input label={t.endDate} type="month" value={exp.endDate || ""} disabled={Boolean(exp.isCurrent)} onChange={(v) => updateExperience(idx, "endDate", v)} />

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={Boolean(exp.isCurrent)}
                        onChange={(e) => updateExperience(idx, "isCurrent", e.target.checked)}
                        className="h-4 w-4 accent-[#008B8B]"
                      />
                      {t.currentJob}
                    </label>

                    <div>
                      <Label>{t.salary}</Label>
                      <Select value={exp.salary || ""} onChange={(v) => updateExperience(idx, "salary", v)}>
                        {salaryOptions.map((salary) => (
                          <option key={salary || "empty"} value={salary}>
                            {salary || t.salary}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <Input label={t.companyPhone} value={exp.phone || ""} onChange={(v) => updateExperience(idx, "phone", v)} />
                    <Input label={t.companyMail} type="email" value={exp.email || ""} onChange={(v) => updateExperience(idx, "email", v)} />
                    <Input label={t.website} type="url" value={exp.website || ""} onChange={(v) => updateExperience(idx, "website", v)} />

                    <Input
                      label={t.experienceYear}
                      value={exp.experienceYear || ""}
                      onChange={(v) => updateExperience(idx, "experienceYear", v)}
                      placeholder="e.g. 2 years / ၂ နှစ်"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={activeTab === "social" ? "block" : "hidden"}>
          <Card title={t.socialLinks}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SocialInput icon={<FaFacebook />} label={t.facebook} prefix={socialPrefixes.facebook} value={form.socialLinks?.facebook || ""} onChange={(v) => updateSocialField("facebook", v)} />
              <SocialInput icon={<FaLinkedin />} label={t.linkedin} prefix={socialPrefixes.linkedin} value={form.socialLinks?.linkedin || ""} onChange={(v) => updateSocialField("linkedin", v)} />
              <SocialInput icon={<FaGithub />} label={t.github} prefix={socialPrefixes.github} value={form.socialLinks?.github || ""} onChange={(v) => updateSocialField("github", v)} />
              <SocialInput icon={<FaTelegram />} label={t.telegram} prefix={socialPrefixes.telegram} value={form.socialLinks?.telegram || ""} onChange={(v) => updateSocialField("telegram", v)} />
              <SocialInput icon={<FaInstagram />} label={t.instagram} prefix={socialPrefixes.instagram} value={form.socialLinks?.instagram || ""} onChange={(v) => updateSocialField("instagram", v)} />
              <SocialInput icon={<FaYoutube />} label={t.youtube} prefix={socialPrefixes.youtube} value={form.socialLinks?.youtube || ""} onChange={(v) => updateSocialField("youtube", v)} />
              <SocialInput icon={<FaTiktok />} label={t.tiktok} prefix={socialPrefixes.tiktok} value={form.socialLinks?.tiktok || ""} onChange={(v) => updateSocialField("tiktok", v)} />
              <SocialInput icon={<SiLine />} label={t.line} prefix={socialPrefixes.line} value={form.socialLinks?.line || ""} onChange={(v) => updateSocialField("line", v)} />
              <SocialInput icon={<SiViber />} label={t.viber} prefix="+95" placeholder="Type Phone Number" value={form.socialLinks?.viber || ""} onChange={(v) => updateSocialField("viber", v)} />
              <SocialInput icon={<FaWhatsapp />} label={t.whatsapp} prefix="+95" placeholder="Type Phone Number" value={form.socialLinks?.whatsapp || ""} onChange={(v) => updateSocialField("whatsapp", v)} />
            </div>
          </Card>
        </div>

        <div className="flex justify-end pb-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
          >
            <FaSave />
            {saving ? t.saving : t.saveChanges}
          </button>
        </div>
      </form>
    </section>
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
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
      {children}
    </label>
  );
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#25C9C8] focus:bg-white focus:ring-4 focus:ring-[#25C9C8]/10 disabled:cursor-not-allowed disabled:opacity-60 ${extra}`;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  icon,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
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
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass("bg-white")}>
      {children}
    </select>
  );
}

function SocialInput({
  label,
  prefix,
  value,
  onChange,
  icon,
  placeholder,
}: {
  label: string;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex h-[42px] items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-[#25C9C8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#25C9C8]/10">
        <span className="flex w-10 shrink-0 justify-center text-sm text-slate-500">
          {icon}
        </span>

        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `${prefix}username`}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm font-bold text-slate-800 outline-none placeholder:text-xs placeholder:font-medium placeholder:text-slate-400"
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
    .replace(/^facebook\.com\//i, "")
    .replace(/^t\.me\//i, "")
    .replace(/^telegram\.me\//i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^youtube\.com\/@?/i, "")
    .replace(/^linkedin\.com\/in\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/^tiktok\.com\/@?/i, "")
    .replace(/^x\.com\//i, "")
    .replace(/^twitter\.com\//i, "")
    .replace(/^wa\.me\//i, "")
    .replace(/^line\.me\/R\/ti\/p\/@?/i, "")
    .replace(/^viber:\/\/chat\?number=/i, "")
    .replace(/^@/, "");
}