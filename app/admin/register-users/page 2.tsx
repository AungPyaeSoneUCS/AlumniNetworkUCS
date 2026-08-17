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
} from "lucide-react";

import AdminSidebar from "@/components/admin/admin-sidebar";

type Student = {
  _id: string;
  name: string;
  fatherName: string;
  rollNumber: string;
  graduatedYear: number;
  nrc: string;
  createdAt: string;
  approved?: boolean;
};

type NrcItem = {
  id: string;
  name_en: string;
  name_mm: string;
  nrc_code: string;
  city_mm?: string;
};

type Lang = "en" | "mm";

const PAGE_SIZE = 10;
const mmDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

const text = {
  en: {
    title: "Register Data",
    subtitle: "Add approved student register data. Excel import/export supported.",
    exportExample: "Export Example",
    exportData: "Export Data",
    printData: "Print",
    importExcel: "Import Excel",
    addStudent: "Add Student",
    manualAdd: "Manual register data add.",
    name: "Name",
    fatherName: "Father Name",
    rollNumber: "Roll Number",
    graduatedYear: "Graduated Year",
    nrc: "NRC",
    cityHint: "Township",
    adding: "Adding...",
    addRegisterData: "Add Register Data",
    approvedData: "Register Data",
    searchPlaceholder:
      "Search name, father name, roll number, NRC or graduated year...",
    noData: "No data found",
    created: "Created",
    status: "Status",
    approved: "Approved",
    notApproved: "Not Approved",
    approve: "Approve",
    delete: "Delete",
    actions: "Actions",
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
    required:
      "Please fill Name, Father Name, Roll Number, Graduated Year and NRC.",
    nrcJsonNotFound: "nrc.json not found. Put nrc.json inside public folder.",
    cannotLoadNrc: "Cannot load nrc.json.",
  },
  mm: {
    title: "မှတ်ပုံတင်ဒေတာ",
    subtitle: "Approved student register data ထည့်နိုင်သည်။ Excel import/export လုပ်နိုင်သည်။",
    exportExample: "နမူနာ Export",
    exportData: "ဒေတာ Export",
    printData: "Print",
    importExcel: "Excel Import",
    addStudent: "ကျောင်းသား ထည့်ရန်",
    manualAdd: "Register data ကို manually ထည့်နိုင်သည်။",
    name: "အမည်",
    fatherName: "အဖအမည်",
    rollNumber: "Roll Number",
    graduatedYear: "ဘွဲ့ရနှစ်",
    nrc: "NRC",
    cityHint: "Township",
    adding: "ထည့်နေသည်...",
    addRegisterData: "Register Data ထည့်မည်",
    approvedData: "Register Data",
    searchPlaceholder:
      "အမည်၊ အဖအမည်၊ Roll Number၊ NRC သို့မဟုတ် ဘွဲ့ရနှစ် ဖြင့် ရှာရန်...",
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
    required:
      "Name, Father Name, Roll Number, Graduated Year နှင့် NRC အားလုံး ဖြည့်ပါ။",
    nrcJsonNotFound: "nrc.json မတွေ့ပါ။ public folder ထဲထည့်ပါ။",
    cannotLoadNrc: "nrc.json load မရပါ။",
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

function enToMmDigit(value: string) {
  return value.replace(/[0-9]/g, (digit) => mmDigits[Number(digit)]);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeNrcRow(item: any): NrcItem {
  const rawName = String(item.name_mm || "").trim();
  const match = rawName.match(/\((.*?)\)\s*(.*)/);

  return {
    id: String(item.id || `${item.nrc_code}-${rawName}`),
    name_en: String(item.name_en || ""),
    name_mm: match ? match[1] : rawName,
    nrc_code: String(item.nrc_code || ""),
    city_mm: String(item.city_mm || (match ? match[2] : "")),
  };
}

function exportHtml(students: Student[], t: typeof text.en) {
  const rows = students
    .map(
      (student) => `
        <tr>
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(student.fatherName)}</td>
          <td>${escapeHtml(student.rollNumber)}</td>
          <td>${escapeHtml(student.graduatedYear || "")}</td>
          <td>${escapeHtml(student.nrc)}</td>
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
        <th>${escapeHtml(t.rollNumber)}</th>
        <th>${escapeHtml(t.graduatedYear)}</th>
        <th>${escapeHtml(t.nrc)}</th>
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

  const [name, setName] = useState("MgMg");
  const [fatherName, setFatherName] = useState("U Mya Hlaing");
  const [rollNumber, setRollNumber] = useState("5CS-1");
  const [graduatedYear, setGraduatedYear] = useState("2026");

  const [nrcData, setNrcData] = useState<NrcItem[]>([]);
  const [nrcRegion, setNrcRegion] = useState("14");
  const [nrcCode, setNrcCode] = useState("ဟသတ");
  const [nrcType, setNrcType] = useState("(နိုင်)");
  const [nrcNumber, setNrcNumber] = useState("၁၂၃၄၅၆");

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [importing, setImporting] = useState(false);
  const [actionId, setActionId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredTownships = useMemo(() => {
    return nrcData.filter((item) => item.nrc_code === nrcRegion);
  }, [nrcData, nrcRegion]);

  const selectedTownship = filteredTownships.find(
    (item) => item.name_mm === nrcCode,
  );

  const nrcValue = useMemo(() => {
    if (!nrcRegion || !nrcCode || !nrcType || !nrcNumber) return "";
    return `${enToMmDigit(nrcRegion)}/${nrcCode}${nrcType}${nrcNumber}`;
  }, [nrcRegion, nrcCode, nrcType, nrcNumber]);

  async function loadNrcData() {
    try {
      const res = await fetch("/nrc.json", { cache: "no-store" });

      if (!res.ok) {
        setError(t.nrcJsonNotFound);
        setNrcData([]);
        return;
      }

      const json = await res.json();

      const rows: NrcItem[] = Array.isArray(json)
        ? json.map(normalizeNrcRow)
        : Array.isArray(json?.data)
          ? json.data.map(normalizeNrcRow)
          : [];

      const validRows = rows.filter((item) => item.name_mm && item.nrc_code);
      setNrcData(validRows);

      const defaultTownship = validRows.find(
        (item) => item.nrc_code === "14" && item.name_mm === "ဟသတ",
      );

      if (defaultTownship) {
        setNrcRegion("14");
        setNrcCode(defaultTownship.name_mm);
      }
    } catch {
      setError(t.cannotLoadNrc);
      setNrcData([]);
    }
  }

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
    loadNrcData();
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStudents = useMemo(() => {
    const keyword = query.toLowerCase().trim();

    if (!keyword) return students;

    return students.filter((student) =>
      [
        student.name,
        student.fatherName,
        student.rollNumber,
        student.graduatedYear,
        student.nrc,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [students, query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    const firstTownship = filteredTownships[0];
    const exists = filteredTownships.some((item) => item.name_mm === nrcCode);

    if (!exists && firstTownship) {
      setNrcCode(firstTownship.name_mm);
    }
  }, [filteredTownships, nrcCode]);

  const totalPages = Math.max(Math.ceil(filteredStudents.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );
  const pageNumbers = getPagination(safeCurrentPage, totalPages);
  const showingStart = filteredStudents.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, filteredStudents.length);

  function resetForm() {
    setName("MgMg");
    setFatherName("U Mya Hlaing");
    setRollNumber("5CS-1");
    setGraduatedYear("2026");
    setNrcRegion("14");
    setNrcCode("ဟသတ");
    setNrcType("(နိုင်)");
    setNrcNumber("၁၂၃၄၅၆");
  }

  function validateForm() {
    const year = Number(graduatedYear);

    return (
      name.trim() &&
      fatherName.trim() &&
      rollNumber.trim() &&
      graduatedYear.trim() &&
      !Number.isNaN(year) &&
      year >= 1900 &&
      year <= 2100 &&
      nrcRegion &&
      nrcCode &&
      nrcType &&
      nrcNumber.trim().length === 6
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
          rollNumber: rollNumber.trim(),
          graduatedYear: Number(graduatedYear),
          nrc: nrcValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.somethingWrong);
        return;
      }

      setMessage(data.message || t.added);
      resetForm();
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
        rollNumber: "5CS-1",
        graduatedYear: 2026,
        nrc: "၁၄/ဟသတ(နိုင်)၁၂၃၄၅၆",
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
  rollNumber: student.rollNumber,
  graduatedYear: student.graduatedYear,
  nrc: student.nrc,
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
        rollNumber?: string;
        "Roll Number"?: string;
        graduatedYear?: string | number;
        "Graduated Year"?: string | number;
        nrc?: string;
        NRC?: string;
      }>(sheet);

      const studentsToImport = rows
        .map((row) => ({
          name: cleanText(row.name || row.Name),
          fatherName: cleanText(row.fatherName || row["Father Name"]),
          rollNumber: cleanText(row.rollNumber || row["Roll Number"]),
          graduatedYear: Number(row.graduatedYear || row["Graduated Year"]),
          nrc: cleanText(row.nrc || row.NRC),
        }))
        .filter(
          (student) =>
            student.name &&
            student.fatherName &&
            student.rollNumber &&
            student.graduatedYear &&
            student.nrc,
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

            <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
              <form
                onSubmit={handleSubmit}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-center gap-3">
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

                <div className="space-y-3">
                  <Input label={t.name} value={name} onChange={setName} />
                  <Input
                    label={t.fatherName}
                    value={fatherName}
                    onChange={setFatherName}
                  />
                  <Input
                    label={t.rollNumber}
                    value={rollNumber}
                    onChange={setRollNumber}
                  />
                  <Input
                    label={t.graduatedYear}
                    type="number"
                    value={graduatedYear}
                    onChange={setGraduatedYear}
                  />

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <Label>{t.nrc}</Label>

                    <div className="grid grid-cols-2 gap-2">
                      <Select value={nrcRegion} onChange={setNrcRegion}>
                        {Array.from({ length: 14 }, (_, index) =>
                          String(index + 1),
                        ).map((region) => (
                          <option key={region} value={region}>
                            {enToMmDigit(region)}
                          </option>
                        ))}
                      </Select>

                      <Select value={nrcCode} onChange={setNrcCode}>
                        {filteredTownships.length === 0 ? (
                          <option value="">--</option>
                        ) : (
                          filteredTownships.map((item) => (
                            <option key={item.id} value={item.name_mm}>
                              ({item.name_mm})
                            </option>
                          ))
                        )}
                      </Select>

                      <Select value={nrcType} onChange={setNrcType}>
                        <option value="(နိုင်)">(နိုင်)</option>
                        <option value="(ဧည့်)">(ဧည့်)</option>
                        <option value="(ပြု)">(ပြု)</option>
                      </Select>

                      <input
                        type="text"
                        maxLength={6}
                        value={nrcNumber}
                        placeholder="၁၂၃၄၅၆"
                        onChange={(event) => {
                          const value = enToMmDigit(event.target.value).replace(
                            /[^၀-၉]/g,
                            "",
                          );
                          setNrcNumber(value.slice(0, 6));
                        }}
                        className={inputClass()}
                      />
                    </div>

                    {selectedTownship?.city_mm && (
                      <div className="mt-3 rounded-xl bg-cyan-50 px-3 py-2 ring-1 ring-cyan-100 dark:bg-cyan-950/20">
                        <p className="text-sm font-black text-[#008B8B]">
                          Township - {selectedTownship.city_mm}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] disabled:opacity-60"
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
                            <TableHead>{t.rollNumber}</TableHead>
                            <TableHead>{t.graduatedYear}</TableHead>
                            <TableHead>{t.nrc}</TableHead>
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
                                {student.rollNumber}
                              </td>
                              <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">
                                {student.graduatedYear || "-"}
                              </td>
                              <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">
                                {student.nrc}
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
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
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