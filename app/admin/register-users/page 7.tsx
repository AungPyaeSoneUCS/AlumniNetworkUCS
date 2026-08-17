// file: app/admin/register-users/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
  XCircle,
  List,
} from "lucide-react";

import AdminSidebar from "@/components/admin/admin-sidebar";

type Student = {
  _id: string;
  name: string;
  fatherName: string;
  graduatedYear: number;
  createdAt: string;
  approved?: boolean;
};

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

const text = {
  en: {
    title: "Student Registration Lists",
    subtitle: " ",
    exportExample: "Export Example",
    exportData: "Export Data",
    printData: "Print",
    importExcel: "Import Excel File",
    addStudent: "Add Student",
    viewLists: "View Records",
    manualAdd: " ",  
    name: "Alumni Name",
    fatherName: "Father Name",
    graduatedYear: "Graduated Year",
    adding: "Adding...",
    addRegisterData: "Add Register Data",
    approvedData: "Registered Student Records",
    searchPlaceholder: "Search alumni name, father name, or graduated year...",
    noData: "No data found",
    created: "Created Date",
    status: "Status",
    approved: "Approved",
    notApproved: "Not Approved",
    approve: "Approve",
    delete: "Delete",
    actions: "Action",
    loadFailed: "Failed to load data.",
    networkError: "Network error.",
    somethingWrong: "Something went wrong.",
    added: "Register data added.",
    deleted: "Register data deleted.",
    approvedMessage: "Register data approved.",
    importFailed: "Import failed.",
    importSuccess: "Excel imported successfully.",
    invalidExcel: "Invalid Excel file.",
    previous: "Previous",
    next: "Next",
    showing: "Showing",
    of: "of",
    required: "Please fill Alumni Name, Father Name, and Graduated Year.",
    namePlaceholder: "Enter alumni name",
    fatherNamePlaceholder: "Enter father name",
    selectYear: "Select Year",
  },
  mm: {
    title: "ကျောင်းသားအချက်အလက် မှတ်ပုံတင်ခြင်း",
    subtitle: " ",
    exportExample: "Export Example",
    exportData: "Export Data",
    printData: "Print",
    importExcel: "Import Excel File",
    addStudent: "အချက်အလက် ထည့်ရန်",
    viewLists: "စာရင်းများ ကြည့်ရန်",
    manualAdd: " ",  
    name: "ကျောင်းသားဟောင်းအမည်",
    fatherName: "အဖအမည်",
    graduatedYear: "ဘွဲ့ရနှစ်",
    adding: "ထည့်နေသည်...",
    addRegisterData: "Register Data ထည့်မည်",
    approvedData: "မှတ်ပုံတင်ထားသော ကျောင်းသားအချက်အလက်များ",
    searchPlaceholder: "အမည်၊ အဖအမည်၊ သို့မဟုတ် ဘွဲ့ရနှစ် ဖြင့် ရှာရန်...",
    noData: "ဒေတာ မတွေ့ပါ",
    created: "ဖန်တီးသည့်နေ့",
    status: "အခြေအနေ",
    approved: "အတည်ပြုပြီး",
    notApproved: "မအတည်ပြုရသေး",
    approve: "အတည်ပြုမည်",
    delete: "ဖျက်မည်",
    actions: "လုပ်ဆောင်ချက်",
    loadFailed: "ဒေတာ load မအောင်မြင်ပါ။",
    networkError: "Network error ဖြစ်နေသည်။",
    somethingWrong: "တစ်ခုခုမှားနေသည်။",
    added: "Register data ထည့်ပြီးပါပြီ။",
    deleted: "Register data ဖျက်ပြီးပါပြီ။",
    approvedMessage: "Register data အတည်ပြုပြီးပါပြီ။",
    importFailed: "Import မအောင်မြင်ပါ။",
    importSuccess: "Excel import အောင်မြင်ပါသည်။",
    invalidExcel: "Excel file မှားနေသည်။",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    required: "Alumni Name, Father Name, နှင့် Graduated Year အားလုံး ဖြည့်ပါ။",
    namePlaceholder: "ကျောင်းသားဟောင်းအမည် ရိုက်ထည့်ပါ",
    fatherNamePlaceholder: "အဖအမည် ရိုက်ထည့်ပါ",
    selectYear: "ခုနှစ် ရွေးချယ်ပါ",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function formatDate(date: string) {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportHtml(students: Student[], t: typeof text.en) {
  const rows = students
    .map(
      (student) => `
        <tr>
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(student.fatherName)}</td>
          <td>${escapeHtml(student.graduatedYear || "")}</td>
          <td>${escapeHtml(formatDate(student.createdAt))}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t.title)}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#0f172a;background:#fff}
    h1{font-size:24px;margin:0 0 6px}
    p{margin:0 0 14px;color:#64748b;font-weight:600}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px}
    th{background:#f1f5f9;font-weight:700}
    tr:nth-child(even){background:#f8fafc}
    @media print{body{padding:12px}}
  </style>
</head>
<body>
  <h1>${escapeHtml(t.title)}</h1>
  <p>${escapeHtml(t.subtitle)}</p>

  <table>
    <thead>
      <tr>
        <th>${escapeHtml(t.name)}</th>
        <th>${escapeHtml(t.fatherName)}</th>
        <th>${escapeHtml(t.graduatedYear)}</th>
        <th>${escapeHtml(t.created)}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function getPagination(currentPage: number, totalPages: number) {
  const pages: Array<number | "dots"> = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (currentPage > 4) pages.push("dots");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i += 1) pages.push(i);

  if (currentPage < totalPages - 3) pages.push("dots");
  pages.push(totalPages);

  return pages;
}

export default function RegisterUserDataAddPage() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "mm" ? "mm" : "en";
  const t = text[lang];

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false); // Toggle state

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [importing, setImporting] = useState(false);
  const [actionId, setActionId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Year range options (2020 to currentYear + 1)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 1;
    const years = [];
    for (let y = 2020; y <= maxYear; y++) {
      years.push(y);
    }
    return years.reverse(); // Newest first
  }, []);

  async function loadStudents() {
    try {
      setFetching(true);
      const res = await fetch("/api/admin/register-users", {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok) {
        setStudents(Array.isArray(data.students) ? data.students : []);
      } else {
        setError(data.error || t.loadFailed);
      }
    } catch {
      setError(t.networkError);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStudents = useMemo(() => {
    const keyword = query.toLowerCase().trim();
    if (!keyword) return students;

    return students.filter((student) =>
      [student.name, student.fatherName, student.graduatedYear]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [students, query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const totalPages = Math.max(Math.ceil(filteredStudents.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
  const pageNumbers = getPagination(safeCurrentPage, totalPages);
  const showingStart = filteredStudents.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, filteredStudents.length);

  function resetForm() {
    setName("");
    setFatherName("");
    setGraduatedYear("");
  }

  function validateForm() {
    const year = Number(graduatedYear);
    return (
      name.trim() &&
      fatherName.trim() &&
      graduatedYear.trim() &&
      !Number.isNaN(year) &&
      year >= 2020
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!validateForm()) {
      setError(t.required);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/register-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          graduatedYear: Number(graduatedYear),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.somethingWrong);
        return;
      }

      setMessage(data.message || t.added);
      resetForm();
      setShowAddForm(false); // Return to list on success
      await loadStudents();
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  async function approveStudent(id: string) {
    if (!confirm("Approve this register data?")) return;

    setActionId(id);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/register-users/${id}`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.somethingWrong);
        return;
      }

      setMessage(data.message || t.approvedMessage);
      await loadStudents();
    } catch {
      setError(t.networkError);
    } finally {
      setActionId("");
    }
  }

  async function deleteStudent(id: string) {
    if (!confirm("Delete this register data?")) return;

    setActionId(id);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/register-users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.somethingWrong);
        return;
      }

      setMessage(data.message || t.deleted);
      await loadStudents();
    } catch {
      setError(t.networkError);
    } finally {
      setActionId("");
    }
  }

  function exportTemplate() {
    const rows = [
      {
        name: "MgMg",
        fatherName: "U Mya Hlaing",
        graduatedYear: 2026,
      },
    ];

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "RegisterDataTemplate");
    XLSX.writeFile(book, "register-data-template.xlsx");
  }

  function exportCurrentData() {
    const rows = filteredStudents.map((student) => ({
      name: student.name,
      fatherName: student.fatherName,
      graduatedYear: student.graduatedYear,
      createdAt: student.createdAt,
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "RegisterData");
    XLSX.writeFile(book, "register-data.xlsx");
  }

  function printCurrentData() {
    const html = exportHtml(filteredStudents, t);
    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleImportExcel(file: File) {
    setImporting(true);
    setMessage("");
    setError("");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json<{
        name?: string;
        Name?: string;
        fatherName?: string;
        "Father Name"?: string;
        graduatedYear?: string | number;
        "Graduated Year"?: string | number;
      }>(sheet);

      const studentsToImport = rows
        .map((row) => ({
          name: cleanText(row.name || row.Name),
          fatherName: cleanText(row.fatherName || row["Father Name"]),
          graduatedYear: Number(row.graduatedYear || row["Graduated Year"]),
        }))
        .filter(
          (student) =>
            student.name &&
            student.fatherName &&
            student.graduatedYear
        );

      const res = await fetch("/api/admin/register-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: studentsToImport }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.importFailed);
        return;
      }

      setMessage(data.message || t.importSuccess);
      await loadStudents();
    } catch {
      setError(t.invalidExcel);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="register-users" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                <div>
                  <h1 className="text-2xl font-black sm:text-3xl">{t.title}</h1>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* View Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      setMessage("");
                      setError("");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#008B8B] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#007070]"
                  >
                    {showAddForm ? <List size={16} /> : <Plus size={16} />}
                    {showAddForm ? t.viewLists : t.addStudent}
                  </button>

                  <ActionButton onClick={exportTemplate} icon={<FileSpreadsheet />}>
                    {t.exportExample}
                  </ActionButton>

                  <ActionButton onClick={exportCurrentData} icon={<Download />}>
                    {t.exportData}
                  </ActionButton>

                  <ActionButton onClick={printCurrentData} icon={<Printer />}>
                    {t.printData}
                  </ActionButton>

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={importing}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#25C9C8] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#008B8B] disabled:opacity-60"
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

            {message && <Alert type="success" text={message} />}
            {error && <Alert type="error" text={error} />}

            <div className="grid gap-5">
              {showAddForm ? (
                /* Add Form View */
                <form
                  onSubmit={handleSubmit}
                  className="mx-auto w-full max-w-2xl rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100">
                      <Plus size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-black">{t.addStudent}</h2>
                      <p className="text-xs font-semibold text-slate-500">
                        {t.manualAdd}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Plus size={17} />
                      )}
                      {loading ? t.adding : t.addRegisterData}
                    </button>
                  </div>
                </form>
              ) : (
                /* Table View */
                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-lg font-black">{t.approvedData}</h2>
                      <p className="text-xs font-semibold text-slate-500">
                        {t.showing} {showingStart}-{showingEnd} {t.of}{" "}
                        {filteredStudents.length}
                      </p>
                    </div>

                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-bold outline-none transition focus:border-[#25C9C8] focus:bg-white focus:ring-4 focus:ring-[#25C9C8]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:w-96"
                      />
                    </div>
                  </div>

                  {fetching ? (
                    <div className="flex items-center justify-center p-10">
                      <Loader2 className="h-8 w-8 animate-spin text-[#008B8B]" />
                    </div>
                  ) : paginatedStudents.length === 0 ? (
                    <div className="p-10 text-center text-sm font-bold text-slate-500">
                      {t.noData}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950">
                            <tr>
                              <TableHead>{t.name}</TableHead>
                              <TableHead>{t.fatherName}</TableHead>
                              <TableHead>{t.graduatedYear}</TableHead>
                              <TableHead>{t.created}</TableHead>
                              <TableHead>{t.actions}</TableHead>
                            </tr>
                          </thead>

                          <tbody>
                            {paginatedStudents.map((student) => (
                              <tr
                                key={student._id}
                                className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                              >
                                <td className="px-5 py-4 font-black text-slate-900 dark:text-white">
                                  {student.name}
                                </td>
                                <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">
                                  {student.fatherName}
                                </td>
                                <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">
                                  {student.graduatedYear || "-"}
                                </td>
                                <td className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">
                                  {formatDate(student.createdAt)}
                                </td>
                                
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    {student.approved === false && (
                                      <ActionSmallButton
                                        color="green"
                                        disabled={actionId === student._id}
                                        onClick={() => approveStudent(student._id)}
                                      >
                                        <Check className="h-4 w-4" />
                                        {t.approve}
                                      </ActionSmallButton>
                                    )}

                                    <ActionSmallButton
                                      color="red"
                                      disabled={actionId === student._id}
                                      onClick={() => deleteStudent(student._id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t.delete}
                                    </ActionSmallButton>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                          <Pagination
                            currentPage={safeCurrentPage}
                            totalPages={totalPages}
                            pageNumbers={pageNumbers}
                            setCurrentPage={setCurrentPage}
                            t={t}
                          />
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
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
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-white [&_svg]:h-4 [&_svg]:w-4"
    >
      {icon}
      {children}
    </button>
  );
}

function ActionSmallButton({
  children,
  onClick,
  disabled,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color: "red" | "green";
}) {
  const className =
    color === "red"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-emerald-500 hover:bg-emerald-600";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-white transition disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function Alert({ type, text }: { type: "success" | "error"; text: string }) {
  const success = type === "success";

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${
        success
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
      }`}
    >
      {success ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
      {text}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
      {children}
    </label>
  );
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#25C9C8] focus:ring-4 focus:ring-[#25C9C8]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white ${extra}`;
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
    <div>
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
      className={inputClass()}
    >
      {children}
    </select>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-4 font-black">{children}</th>;
}

function StatusBadge({
  approved,
  approvedText,
  notApprovedText,
}: {
  approved: boolean;
  approvedText: string;
  notApprovedText: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
        approved
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      }`}
    >
      <CheckCircle2 className="h-4 w-4" />
      {approved ? approvedText : notApprovedText}
    </span>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  setCurrentPage,
  t,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: Array<number | "dots">;
  setCurrentPage: (page: number) => void;
  t: typeof text.en;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <PageButton
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
      >
        {t.previous}
      </PageButton>

      {pageNumbers.map((pageNumber, index) =>
        pageNumber === "dots" ? (
          <span
            key={`dots-${index}`}
            className="flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black text-slate-400"
          >
            ...
          </span>
        ) : (
          <PageButton
            key={pageNumber}
            active={pageNumber === currentPage}
            onClick={() => setCurrentPage(pageNumber)}
          >
            {pageNumber}
          </PageButton>
        ),
      )}

      <PageButton
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
      >
        {t.next}
      </PageButton>
    </div>
  );
}

function PageButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "bg-[#008B8B] text-white shadow-lg shadow-cyan-500/25"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}