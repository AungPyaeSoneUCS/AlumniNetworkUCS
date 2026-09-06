// file: app/admin/edit/create-users/page.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Upload,
  UserPlus,
  XCircle,
  Eye,
  EyeOff,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit,
} from "lucide-react";

import EditNav from "@/components/admin/edit-nav";

type Lang = "en" | "mm";

type Student = {
  _id: string;
  name: string;
  fatherName: string;
  graduatedYear: string; // <-- Updated to string
  registered?: boolean;
  createdAt: string;
};

const text = {
  en: {
    title: "Direct Account Creation",
    subtitle: "Create verified alumni accounts directly without OTP verification.",
    exportExample: "Download Template",
    importExcel: "Bulk Create (Excel)",
    singleCreate: "Create Single Account",
    no: "No",
    name: "Alumni Name",
    fatherName: "Father Name",
    graduatedYear: "Graduated Year",
    email: "Email Address",
    password: "Password",
    creating: "Creating Account...",
    createAccount: "Create Account",
    networkError: "Network error occurred.",
    somethingWrong: "Something went wrong.",
    created: "Account created successfully.",
    importFailed: "Excel import failed.",
    importSuccess: "Bulk creation complete. Check console for skipped users.",
    invalidExcel: "Invalid Excel file format.",
    required: "Please fill all required fields.",
    namePlaceholder: "Enter alumni name",
    fatherNamePlaceholder: "Enter father name",
    emailPlaceholder: "alumniname@ucsh.edu.mm",
    passwordPlaceholder: "Enter strong password",
    selectYear: "Select Year",
    notApprovedError: "Student not found in approved list.",
    alreadyRegisteredError: "Student is already registered.",
    
    // Table Texts
    listTitle: "Approved Students List",
    searchPlaceholderList: "Search name or father name...",
    all: "All",
    registered: "Registered",
    notRegistered: "Not Registered",
    status: "Status",
    action: "Action",
    createBtn: "Create",
    editBtn: "Edit",
    noData: "No students found.",
  },
  mm: {
    title: "အကောင့်တိုက်ရိုက်ဖွင့်ရန်",
    subtitle: "OTP မလိုဘဲ အတည်ပြုပြီးသော ကျောင်းသားများအတွက် အကောင့် တိုက်ရိုက်ဖွင့်ပေးရန်။",
    exportExample: "နမူနာဖိုင် ဒေါင်းရန်",
    importExcel: "အများအပြား ဖွင့်မည် (Excel)",
    singleCreate: "အကောင့်တစ်ခု ဖွင့်ရန်",
    no: "စဉ်",
    name: "ကျောင်းသားဟောင်းအမည်",
    fatherName: "အဖအမည်",
    graduatedYear: "ဘွဲ့ရနှစ်",
    email: "အီးမေးလ်",
    password: "စကားဝှက်",
    creating: "အကောင့်ဖွင့်နေသည်...",
    createAccount: "အကောင့်ဖွင့်မည်",
    networkError: "Network error ဖြစ်နေသည်။",
    somethingWrong: "တစ်ခုခုမှားနေသည်။",
    created: "အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။",
    importFailed: "Import မအောင်မြင်ပါ။",
    importSuccess: "Excel ဖြင့် အကောင့်များဖွင့်ပြီးပါပြီ။",
    invalidExcel: "Excel file မှားနေသည်။",
    required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ။",
    namePlaceholder: "ကျောင်းသားဟောင်းအမည် ရိုက်ထည့်ပါ",
    fatherNamePlaceholder: "အဖအမည် ရိုက်ထည့်ပါ",
    emailPlaceholder: "alumniname@ucsh.edu.mm",
    passwordPlaceholder: "စကားဝှက် ရိုက်ထည့်ပါ",
    selectYear: "ခုနှစ် ရွေးချယ်ပါ",
    notApprovedError: "အတည်ပြုစာရင်းတွင် ဤကျောင်းသား မရှိပါ။",
    alreadyRegisteredError: "ဤကျောင်းသားသည် အကောင့်ဖွင့်ပြီးသား ဖြစ်သည်။",
    
    // Table Texts
    listTitle: "အတည်ပြုထားသော ကျောင်းသားစာရင်း",
    searchPlaceholderList: "အမည်၊ အဖအမည် ဖြင့် ရှာရန်...",
    all: "အားလုံး",
    registered: "အကောင့်ဖွင့်ပြီး",
    notRegistered: "အကောင့်မဖွင့်ရသေး",
    status: "အခြေအနေ",
    action: "လုပ်ဆောင်ချက်",
    createBtn: "အကောင့်ဖွင့်မည်",
    editBtn: "ပြင်မည်",
    noData: "ကျောင်းသားအချက်အလက် မတွေ့ပါ။",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

export default function AdminCreateUserPage() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "mm" ? "mm" : "en";
  const t = text[lang];

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("");
  const [email, setEmail] = useState("");
  // Default password configuration
  const [password, setPassword] = useState("Alumni@2026");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importStats, setImportStats] = useState<{ created: number; skipped: number } | null>(null);

  // Student List states
  const [students, setStudents] = useState<Student[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(true);
  const [listFilter, setListFilter] = useState<"all" | "registered" | "not_registered">("not_registered");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sort states
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Student | "status";
    direction: "asc" | "desc";
  } | null>(null);

  // <-- UPDATED: Fixed string list of specific years dynamically generated past 2030
  const yearOptions = useMemo(() => {
    const baseYears = [
      "2020",
      "2023",
      "2024",
      "2025",
      "2026",
      "2027 (Senior)",
      "2027 (Junior)",
      "2028 (Senior)",
      "2028 (Junior)",
      "2029",
      "2030",
    ];
    
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 1;
    
    if (maxYear > 2030) {
      for (let y = 2031; y <= maxYear; y++) {
        baseYears.push(String(y));
      }
    }
    
    return baseYears.reverse(); 
  }, []);

  // Fetch approved students list
  async function fetchStudents() {
    try {
      setFetchingStudents(true);
      const res = await fetch("/api/admin/register-users", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingStudents(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredAndSortedStudents = useMemo(() => {
    // 1. Filter
    let result = students.filter((s) => {
      if (listFilter === "registered" && !s.registered) return false;
      if (listFilter === "not_registered" && s.registered) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.fatherName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // 2. Sort
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "status") {
           aValue = a.registered ? 1 : 0;
           bValue = b.registered ? 1 : 0;
        } else {
           aValue = a[sortConfig.key] ?? "";
           bValue = b[sortConfig.key] ?? "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [students, listFilter, searchQuery, sortConfig]);

  function handleSort(key: keyof Student | "status") {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  }

  function resetForm() {
    setName("");
    setFatherName("");
    setGraduatedYear("");
    setEmail("");
    setPassword("Alumni@2026"); // Always reset back to default password
  }

  function validateForm() {
    // <-- UPDATED: Removed Number.isNaN() check
    return (
      name.trim().length > 0 &&
      fatherName.trim().length > 0 &&
      graduatedYear.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0
    );
  }

  // Pre-fill form when clicking 'Create' on the table
  function handlePopulateForm(student: Student) {
    setName(student.name);
    setFatherName(student.fatherName);
    setGraduatedYear(String(student.graduatedYear));
    
    // Auto-generate a fallback email based on their name for faster entry
    const formattedName = student.name.replace(/\s+/g, "").toLowerCase();
    setEmail(`${formattedName}@ucsh.edu.mm`);
    
    setPassword("Alumni@2026");
    setMessage("");
    setError("");
    
    // Scroll smoothly to the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");
    setImportStats(null);

    if (!validateForm()) {
      setError(t.required);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/create-users/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          graduatedYear: graduatedYear.trim(), // <-- Pass as string
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.somethingWrong);
        setLoading(false);
        return;
      }

      setMessage(data.message || t.created);
      resetForm();
      await fetchStudents(); // Refresh the list
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  function exportTemplate() {
    const rows = [
      {
        Name: "Kyaw Kyaw",
        "Father Name": "U Tun",
        "Graduated Year": "2026",
        Email: "kyawkyaw@ucsh.edu.mm",
        Password: "Alumni@2026",
      },
      {
        Name: "Su Su",
        "Father Name": "U Aung Aung",
        "Graduated Year": "2027 (Senior)",
        Email: "susu@ucsh.edu.mm",
        Password: "Alumni@2026",
      },
      {
        Name: "Zaw Zaw",
        "Father Name": "U Hla",
        "Graduated Year": "2027 (Junior)",
        Email: "zawzaw@ucsh.edu.mm",
        Password: "Alumni@2026",
      },
    ];

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "DirectCreateTemplate");
    XLSX.writeFile(book, "direct-create-template.xlsx");
  }

  async function performImportExcel(usersToImport: any[]) {
    try {
      const res = await fetch("/api/admin/create-users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: usersToImport }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.importFailed);
        setImporting(false);
        return;
      }

      setMessage(t.importSuccess);
      setImportStats({
        created: data.createdCount || 0,
        skipped: data.skippedCount || 0, 
      });
      await fetchStudents(); // Refresh the list
    } catch {
      setError(t.invalidExcel);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleImportExcel(file: File) {
    setImporting(true);
    setMessage("");
    setError("");
    setImportStats(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json<{
        Name?: string;
        name?: string;
        "Father Name"?: string;
        fatherName?: string;
        "Graduated Year"?: string | number;
        graduatedYear?: string | number;
        Email?: string;
        email?: string;
        Password?: string;
        password?: string;
      }>(sheet);

      const usersToImport = rows
        .map((row) => ({
          name: cleanText(row.name || row.Name),
          fatherName: cleanText(row.fatherName || row["Father Name"]),
          // <-- UPDATED: Convert graduatedYear to string to prevent bulk failures
          graduatedYear: cleanText(String(row.graduatedYear || row["Graduated Year"] || "")),
          email: cleanText(row.email || row.Email).toLowerCase(),
          password: cleanText(row.password || row.Password || "Alumni@2026"), // Fallback default
        }))
        .filter(
          (user) =>
            user.name &&
            user.fatherName &&
            user.graduatedYear &&
            user.email &&
            user.password
        );

      if (usersToImport.length === 0) {
        setError(t.invalidExcel);
        setImporting(false);
        return;
      }

      performImportExcel(usersToImport);
    } catch {
      setError(t.invalidExcel);
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <EditNav lang={lang} />

      <div className="flex min-h-screen">

        <section className="min-w-0 flex-1 px-4 pb-8 pt-6 sm:px-6 md:px-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            {/* Top Header & Actions */}
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.title}
                  </h1>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                    {t.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton onClick={exportTemplate} icon={<FileSpreadsheet />}>
                    {t.exportExample}
                  </ActionButton>

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={importing}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 sm:text-sm"
                  >
                    {importing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    {t.importExcel}
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleImportExcel(file);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Alerts */}
            {message && <Alert type="success" text={message} />}
            {error && <Alert type="error" text={error} />}
            
            {importStats && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Bulk Import Results</p>
                  <div className="flex gap-4 text-sm font-black">
                    <span className="text-emerald-600 dark:text-emerald-400">Created: {importStats.created}</span>
                    <span className="text-slate-500 dark:text-slate-400">Skipped (Not found / Already registered): {importStats.skipped}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Single Creation Form */}
            <form
              onSubmit={handleSubmit}
              className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black dark:text-white">
                    {t.singleCreate}
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label={t.name}
                    value={name}
                    onChange={setName}
                    placeholder={t.namePlaceholder}
                  />
                  <Input
                    label={t.fatherName}
                    value={fatherName}
                    onChange={setFatherName}
                    placeholder={t.fatherNamePlaceholder}
                  />
                  <div>
                    <Label>{t.graduatedYear}</Label>
                    <Select value={graduatedYear} onChange={setGraduatedYear}>
                      <option value="">-- {t.selectYear} --</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t.email}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder={t.emailPlaceholder}
                  />
                  
                  <div className="block">
                    <Label>{t.password}</Label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        className={inputClass("pr-11")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading || !validateForm()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Plus size={17} />
                    )}
                    {loading ? t.creating : t.createAccount}
                  </button>
                </div>
              </div>
            </form>

            {/* Approved Students Table Section */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
              <div className="border-b border-slate-200/80 p-4 dark:border-slate-800/60 sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-black dark:text-white">{t.listTitle}</h2>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Filter Tabs */}
                    <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                      {(["all", "registered", "not_registered"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setListFilter(mode)}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            listFilter === mode
                              ? "bg-white text-[#008B8B] shadow-sm dark:bg-slate-700 dark:text-[#25C9C8]"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          {mode === "all" ? t.all : mode === "registered" ? t.registered : t.notRegistered}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholderList}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4] sm:w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {fetchingStudents ? (
                <div className="flex items-center justify-center p-10">
                  <Loader2 className="h-8 w-8 animate-spin text-[#008B8B]" />
                </div>
              ) : filteredAndSortedStudents.length === 0 ? (
                <div className="p-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                  {t.noData}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-900/80 dark:text-slate-500">
                      <tr>
                        {/* <-- UPDATED: Added 'No' Column --> */}
                        <TableHead>{t.no}</TableHead>
                        <SortableTableHead label={t.name} sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                        <SortableTableHead label={t.fatherName} sortKey="fatherName" currentSort={sortConfig} onSort={handleSort} />
                        <SortableTableHead label={t.graduatedYear} sortKey="graduatedYear" currentSort={sortConfig} onSort={handleSort} />
                        <SortableTableHead label={t.status} sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                        <th className="px-5 py-3.5 font-black">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredAndSortedStudents.map((student, index) => (
                        <tr
                          key={student._id}
                          className="transition-colors hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10"
                        >
                          {/* <-- UPDATED: Added Index number td --> */}
                          <td className="px-5 py-3.5 font-bold text-slate-500 dark:text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-5 py-3.5 font-black text-slate-900 dark:text-white">
                            {student.name}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-200">
                            {student.fatherName}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-200">
                            {student.graduatedYear || "-"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                student.registered
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                              }`}
                            >
                              {student.registered ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {student.registered ? t.registered : t.notRegistered}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {!student.registered ? (
                              <button
                                onClick={() => handlePopulateForm(student)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#008B8B]/10 px-3 py-1.5 text-[11px] font-black text-[#008B8B] transition hover:bg-[#008B8B] hover:text-white dark:bg-[#25C9C8]/10 dark:text-[#25C9C8] dark:hover:bg-[#25C9C8] dark:hover:text-slate-900"
                              >
                                <Plus size={14} />
                                {t.createBtn}
                              </button>
                            ) : (
                              <Link
                                href={`/admin/edit/update-student?search=${encodeURIComponent(student.name)}&lang=${lang}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-[11px] font-black text-blue-700 transition hover:bg-blue-600 hover:text-white dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white"
                              >
                                <Edit size={14} />
                                {t.editBtn}
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        </section>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Reusable UI Components

function SortableTableHead({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: keyof Student | "status";
  currentSort: { key: keyof Student | "status"; direction: "asc" | "desc" } | null;
  onSort: (key: keyof Student | "status") => void;
}) {
  const isActive = currentSort?.key === sortKey;

  return (
    <th
      className="cursor-pointer select-none px-5 py-3.5 font-black transition hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {isActive ? (
          currentSort.direction === "asc" ? (
            <ArrowUp size={14} className="text-[#008B8B] dark:text-[#25C9C8]" />
          ) : (
            <ArrowDown size={14} className="text-[#008B8B] dark:text-[#25C9C8]" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600" />
        )}
      </div>
    </th>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3.5 font-black">{children}</th>;
}

function ActionButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm [&_svg]:h-4 [&_svg]:w-4"
    >
      {icon}
      {children}
    </button>
  );
}

function Alert({ type, text }: { type: "success" | "error"; text: string }) {
  const success = type === "success";
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
        success
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
      }`}
    >
      {success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      {text}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {children}
    </label>
  );
}

function inputClass(extra = "") {
  return `h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00BFC4] focus:bg-white focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4] ${extra}`;
}

function Input({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass()}
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass("appearance-none")}
    >
      {children}
    </select>
  );
}