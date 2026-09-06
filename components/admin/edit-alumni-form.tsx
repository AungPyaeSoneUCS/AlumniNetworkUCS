// file: components/admin/edit-alumni-form.tsx
"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Search,
  XCircle,
} from "lucide-react";
import { FaPlus, FaTrash } from "react-icons/fa6";

import ImageUploadEditor from "@/components/image-upload-editor";
import ModernSelect from "@/components/modern-select";

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
  website?: string;
};

type FullUser = {
  _id: string;
  name: string;
  email: string;
  image: string;
  bio: string;
  degree: string;
  graduatedYear: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    company: string;
    position: string;
  };
  experiences: Experience[];
  socialLinks: SocialLinks;
};

type FormData = Omit<FullUser, "_id">;

type Props = {
  users: FullUser[];
  lang: "en" | "mm";
  initialSearch: string;
  onUpdate: (userId: string, data: any) => Promise<{ success?: boolean; error?: string }>;
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
}[] = [
  { key: "facebook", label: "Facebook", prefix: "https://facebook.com/" },
  { key: "telegram", label: "Telegram", prefix: "https://t.me/" },
  { key: "instagram", label: "Instagram", prefix: "https://instagram.com/" },
  { key: "youtube", label: "YouTube", prefix: "https://youtube.com/" },
  { key: "linkedin", label: "LinkedIn", prefix: "https://linkedin.com/in/" },
  { key: "github", label: "GitHub", prefix: "https://github.com/" },
  { key: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@" },
  { key: "viber", label: "Viber", prefix: "viber://chat?number=" },
  { key: "line", label: "Line", prefix: "https://line.me/ti/p/" },
  { key: "whatsapp", label: "WhatsApp", prefix: "https://wa.me/" },
];

const text = {
  en: {
    searchTitle: "Find Alumni",
    searchPlaceholder: "Search by name or email...",
    noUsers: "No alumni found.",
    selectUser: "Edit Profile",
    back: "Back to Search",
    editTitle: "Edit Alumni Profile",
    tabs: { personal: "Personal", experience: "Experience", social: "Social" },
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
    company: "Organization",
    position: "Position",
    addExperience: "Add Experience",
    employmentType: "Job Type",
    location: "Job Location",
    salary: "Income",
    website: "Website",
    startDate: "Start Date",
    endDate: "End Date",
    currentJob: "I am currently working here",
    experienceYear: "Experience Year",
    suggestionHint: "Suggestions from other alumni and posted jobs",
    saveBtn: "Save Changes",
    saving: "Saving...",
    success: "Alumni profile updated successfully!",
    networkError: "Network error.",
    dialogClose: "Close",
    validation: {
      requiredEmail: "Name and Email are required.",
      invalidEmail: "Please enter a valid mail.",
      invalidSalary: "Income must be at least 3 digits.",
      studentSalary: "Student income cannot exceed 1,000,000.",
      invalidDate: "End Date must be after Start Date.",
    },
  },
  mm: {
    searchTitle: "ကျောင်းသားဟောင်း ရှာရန်",
    searchPlaceholder: "အမည် သို့မဟုတ် အီးမေးလ် ဖြင့် ရှာရန်...",
    noUsers: "ကျောင်းသားဟောင်း မတွေ့ပါ။",
    selectUser: "ပရိုဖိုင် ပြင်မည်",
    back: "နောက်သို့ ပြန်သွားမည်",
    editTitle: "ကျောင်းသားဟောင်း ပရိုဖိုင် ပြင်ရန်",
    tabs: { personal: "အခြေခံ", experience: "အတွေ့အကြုံ", social: "Social" },
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
    company: "အဖွဲ့အစည်း",
    position: "ရာထူး",
    addExperience: "အတွေ့အကြုံ ထည့်မည်",
    employmentType: "အလုပ်အမျိုးအစား",
    location: "အလုပ်တည်နေရာ",
    salary: "ဝင်ငွေ",
    website: "Website",
    startDate: "စတင်ရက်",
    endDate: "ပြီးဆုံးရက်",
    currentJob: "ကျွန်ုပ်သည် လက်ရှိ ဤနေရာတွင် အလုပ်လုပ်နေသည်",
    experienceYear: "လုပ်သက်နှစ်",
    suggestionHint: "Alumni များနှင့် ပို့စ်တင်ထားသော အလုပ်များမှ အကြံပြုချက်များ",
    saveBtn: "သိမ်းဆည်းမည်",
    saving: "သိမ်းဆည်းနေသည်...",
    success: "ကျောင်းသားဟောင်း ပရိုဖိုင် ပြင်ဆင်ပြီးပါပြီ။",
    networkError: "Network error.",
    dialogClose: "ပိတ်မည်",
    validation: {
      requiredEmail: "အမည် နှင့် အီးမေးလ် လိုအပ်ပါသည်။",
      invalidEmail: "မှန်ကန်သော မေးလ် ထည့်ပါ။",
      invalidSalary: "လစာသည် အနည်းဆုံး ၃ လုံး ဖြစ်ရမည်။",
      studentSalary: "ကျောင်းသား ဝင်ငွေသည် ၁,၀၀၀,၀၀၀ ထက် မကျော်ရပါ။",
      invalidDate: "End Date သည် Start Date ထက် နောက်ကျရမည်။",
    },
  },
} as const;

const emptyForm: FormData = {
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
    website: "",
  },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function EditAlumniForm({ users, lang, initialSearch, onUpdate }: Props) {
  const t = text[lang];
  const processedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<FullUser | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "social">("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialSearch && !processedRef.current && users.length > 0) {
      processedRef.current = true;
      setSearchQuery(initialSearch);

      const exactMatch = users.find(
        (u) => u.name.toLowerCase() === initialSearch.toLowerCase(),
      );
      if (exactMatch) handleSelectUser(exactMatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch, users]);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function handleSelectUser(user: FullUser) {
    setSelectedUser(user);

    setForm({
      ...emptyForm,
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
      bio: user.bio || "",
      degree: user.degree || "",
      graduatedYear: user.graduatedYear || "",
      contactInfo: { ...emptyForm.contactInfo, ...user.contactInfo },
      experiences: Array.isArray(user.experiences) ? [...user.experiences] : [],
      socialLinks: { ...emptyForm.socialLinks, ...user.socialLinks },
    });

    setActiveTab("personal");
    setMessage("");
    setError("");
  }

  function handleBack() {
    setSelectedUser(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateContactField(
    key: keyof NonNullable<FormData["contactInfo"]>,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [key]: value },
    }));
  }

  function updateSocial(key: keyof SocialLinks, value: string, prefix: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: cleanSocialValue(value, prefix) },
    }));
  }

  function addExperience() {
    setActiveTab("experience");

    setForm((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
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
  }

  function removeExperience(index: number) {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, item) => item !== index),
    }));
  }

  function updateExperience(index: number, key: keyof Experience, value: string | boolean) {
    setForm((prev) => {
      const experiences = [...prev.experiences];
      experiences[index] = { ...experiences[index], [key]: value };

      if (key === "isCurrent" && value === true) experiences[index].endDate = "";

      return { ...prev, experiences };
    });
  }

  function validate(): string[] {
    const errors: string[] = [];

    if (!form.name.trim() || !form.email.trim()) {
      errors.push(t.validation.requiredEmail);
    }

    if (form.contactInfo?.email && !emailRegex.test(form.contactInfo.email.trim())) {
      errors.push(t.validation.invalidEmail);
    }

    for (let i = 0; i < (form.experiences || []).length; i++) {
      const exp = form.experiences[i];

      if (exp.salary && !/^\d{3,}$/.test(exp.salary.replace(/[,\s]/g, ""))) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidSalary}`);
      }

      const salaryNum = exp.salary ? Number(exp.salary.replace(/[,\s]/g, "")) : NaN;
      if (exp.employmentType === "Student" && !Number.isNaN(salaryNum) && salaryNum > 1000000) {
        errors.push(`Experience ${i + 1}: ${t.validation.studentSalary}`);
      }

      if (!exp.isCurrent && exp.startDate && exp.endDate && exp.endDate < exp.startDate) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidDate}`);
      }
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const errors = validate();
    if (errors.length > 0) {
      setError(errors.join(" • "));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        image: form.image || "",
        bio: form.bio || "",
        degree: form.degree || "",
        graduatedYear: form.graduatedYear || "",
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
          website: form.socialLinks?.website || "",
        },
      };

      const result = await onUpdate(selectedUser!._id, payload);

      if (result.error) {
        setError(result.error);
      } else {
        setMessage(t.success);
      }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  if (selectedUser) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#008B8B] dark:text-slate-400 dark:hover:text-[#25C9C8]"
        >
          <ArrowLeft size={16} />
          {t.back}
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
            <Save size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black dark:text-white">{t.editTitle}</h2>
            <p className="text-xs font-bold text-slate-400">
              {selectedUser.name} • {selectedUser.email}
            </p>
          </div>
        </div>

        {message && <Alert type="success" text={message} />}
        {error && <Alert type="error" text={error} />}

        <div className="mb-5 mt-4 flex gap-2 overflow-x-auto">
          {(["personal", "experience", "social"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${
                activeTab === tab
                  ? "bg-[#25C9C8]/15 text-[#008B8B]"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400"
              }`}
            >
              {t.tabs[tab]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "personal" && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <ImageUploadEditor
                  image={form.image || ""}
                  title={form.name || selectedUser.name || t.fullName}
                  description={t.profileInfo}
                  compact
                  rounded="square"
                  onChange={(url) => updateField("image", url)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t.fullName} value={form.name || ""} onChange={(v) => updateField("name", v)} />
                <Input label={t.email} type="email" value={form.email || ""} onChange={(v) => updateField("email", v)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t.degree}</Label>
                  <Select
                    value={form.degree || ""}
                    onChange={(v) => updateField("degree", v)}
                    placeholder={t.selectDegree}
                    options={degrees}
                  />
                </div>
                <Input label={t.graduatedYear} value={form.graduatedYear || ""} onChange={(v) => updateField("graduatedYear", v)} />
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

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.contactInfo}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label={t.phone} value={form.contactInfo?.phone || ""} onChange={(v) => updateContactField("phone", v)} />
                  <Input label={t.email} type="email" value={form.contactInfo?.email || ""} onChange={(v) => updateContactField("email", v)} />
                  <div className="sm:col-span-2">
                    <Label>{t.address}</Label>
                    <textarea
                      value={form.contactInfo?.address || ""}
                      onChange={(e) => updateContactField("address", e.target.value)}
                      rows={2}
                      className={inputClass("resize-none")}
                    />
                  </div>
                  <Input label={t.company} value={form.contactInfo?.company || ""} onChange={(v) => updateContactField("company", v)} />
                  <Input label={t.position} value={form.contactInfo?.position || ""} onChange={(v) => updateContactField("position", v)} />
                </div>
              </section>
            </>
          )}

          {activeTab === "experience" && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-4 space-y-4">
                {(form.experiences || []).map((exp, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                        {t.workExperience} {idx + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="rounded-lg bg-slate-100 p-2 text-slate-400 shadow-sm hover:text-red-500 dark:bg-slate-800"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <AutoCompleteInput field="position" label={t.position} value={exp.position || ""} onChange={(v) => updateExperience(idx, "position", v)} hint={t.suggestionHint} />
                      <AutoCompleteInput field="company" label={t.company} value={exp.company || ""} onChange={(v) => updateExperience(idx, "company", v)} hint={t.suggestionHint} />

                      <div>
                        <Label>{t.employmentType}</Label>
                        <ModernSelect
                          value={exp.employmentType || ""}
                          onChange={(v) => updateExperience(idx, "employmentType", v)}
                          options={employmentTypes}
                          placeholder=""
                        />
                      </div>

                      <AutoCompleteInput field="location" label={t.location} value={exp.location || ""} onChange={(v) => updateExperience(idx, "location", v)} hint={t.suggestionHint} />
                      <AutoCompleteInput field="salary" type="number" min="100" max={exp.employmentType === "Student" ? "1000000" : undefined} label={t.salary} value={exp.salary || ""} onChange={(v) => updateExperience(idx, "salary", v)} hint={t.suggestionHint} />

                      {exp.employmentType === "Student" && (
                        <p className="-mt-2 text-[11px] font-bold text-amber-600 md:col-span-2">
                          {t.validation.studentSalary}
                        </p>
                      )}

                      <Input label={t.experienceYear} type="number" min="0" value={exp.experienceYear || ""} onChange={(v) => updateExperience(idx, "experienceYear", v)} />
                      <MonthPickerInput lang={lang} label={t.startDate} value={exp.startDate || ""} onChange={(v) => updateExperience(idx, "startDate", v)} />
                      <MonthPickerInput lang={lang} label={t.endDate} value={exp.endDate || ""} disabled={Boolean(exp.isCurrent)} onChange={(v) => updateExperience(idx, "endDate", v)} />

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 md:col-span-2 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={Boolean(exp.isCurrent)}
                          onChange={(e) => updateExperience(idx, "isCurrent", e.target.checked)}
                          className="h-4 w-4 accent-[#008B8B]"
                        />
                        {t.currentJob}
                      </label>

                      <Input label={t.phone} value={exp.phone || ""} onChange={(v) => updateExperience(idx, "phone", v)} />
                      <Input label={t.email} type="email" value={exp.email || ""} onChange={(v) => updateExperience(idx, "email", v)} />
                      <Input label={t.website} type="url" value={exp.website || ""} placeholder="https://example.com" onChange={(v) => updateExperience(idx, "website", v)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={addExperience} className={gradientBtn}>
                  <FaPlus className="text-[11px]" />
                  {t.addExperience}
                </button>
              </div>
            </section>
          )}

          {activeTab === "social" && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="grid gap-3 sm:grid-cols-2">
                {socialConfigs.map((item) => (
                  <SocialInput
                    key={item.key}
                    label={item.label}
                    prefix={item.prefix}
                    value={form.socialLinks?.[item.key] || ""}
                    onChange={(v) => updateSocial(item.key, v, item.prefix)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              {loading ? t.saving : t.saveBtn}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
          <Search size={20} />
        </div>
        <h2 className="text-lg font-black dark:text-white">{t.searchTitle}</h2>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-slate-400">{t.noUsers}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredUsers.slice(0, 50).map((u) => (
              <div
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-white p-3 shadow-sm transition hover:border-[#00BFC4] hover:shadow-md dark:bg-slate-800 dark:hover:border-[#00BFC4]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900 group-hover:text-[#008B8B] dark:text-white dark:group-hover:text-[#25C9C8]">
                    {u.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                    {u.email} • {u.graduatedYear || "N/A"} • {u.experiences.length}{" "}
                    {lang === "mm" ? "အတွေ့အကြုံ" : "experience"}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition group-hover:bg-[#00BFC4]/10 group-hover:text-[#008B8B] dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-[#25C9C8]/10 dark:group-hover:text-[#25C9C8]"
                >
                  {t.selectUser}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Alert({ type, text: message }: { type: "success" | "error"; text: string }) {
  const success = type === "success";
  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
        success
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
      }`}
    >
      {success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      {message}
    </div>
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass()}
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <ModernSelect value={value} onChange={onChange} options={options} placeholder={placeholder} />
  );
}

function AutoCompleteInput({
  label,
  field,
  value,
  onChange,
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
      .then((data) =>
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []),
      )
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
      {label && <Label>{label}</Label>}

      <input
        type={type}
        value={value}
        placeholder={placeholder}
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
  disabled = false,
  lang,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  lang: "en" | "mm";
}) {
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
    new Date(year, i, 1).toLocaleDateString(locale, { month: "short" }),
  );

  const selectedMonth =
    /^(\d{4})-(\d{2})$/.test(value || "") && Number(value.slice(0, 4)) === year
      ? Number(value.slice(5, 7))
      : 0;

  return (
    <div ref={boxRef} className="relative">
      {label && <Label>{label}</Label>}

      {disabled ? (
        <div className={`${inputClass()} flex items-center gap-2`}>
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate text-slate-500">{display || ""}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`${inputClass()} flex items-center gap-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            display ? "text-[#008B8B]" : ""
          }`}
        >
          <Calendar size={16} className="shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 truncate text-left">
            {display || (lang === "mm" ? "ရက် ရွေး" : "Select Month")}
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

function SocialInput({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix: string;
}) {
  return (
    <div>
      <Label>{label}</Label>

      <div className="flex min-h-[42px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-[#25C9C8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#25C9C8]/10">
        <span className="hidden max-w-[180px] shrink-0 items-center truncate border-r border-slate-200 bg-white/80 px-2 text-[11px] font-black text-slate-400 sm:flex">
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