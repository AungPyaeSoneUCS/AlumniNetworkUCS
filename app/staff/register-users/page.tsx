// file: app/staff/register-users/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit,
  FileSpreadsheet,
  List,
  Loader2,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

import StaffSidebar from "@/components/staff/staff-sidebar";

type Student = {
  _id: string;
  name: string;
  fatherName: string;
  graduatedYear: string; // <-- Updated to string
  createdAt: string;
  registered?: boolean;
};

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

const text = {
  en: {
    title: "Alumni Registration Lists",
    subtitle: " ",
    export: "Export",
    exportExample: "Excel (Template)",
    exportData: "Excel (Data)",
    printData: "Print Report",
    importExcel: "Import Excel",
    addStudent: "Add Alumni",
    editStudent: "Edit Alumni",
    viewLists: "View Records",
    manualAdd: " ",  
    no: "No",
    name: "Alumni Name",
    fatherName: "Father Name",
    graduatedYear: "Graduated Year",
    adding: "Saving...",
    addRegisterData: "Save Register Data",
    updateRegisterData: "Update Register Data",
    approvedData: "Registered Alumni Records",
    searchPlaceholder: "Search alumni name, father name, or graduated year...",
    noData: "No data found",
    created: "Created Date",
    status: "Status",
    registered: "Registered",
    notRegistered: "Not Registered",
    approve: "Approve",
    edit: "Edit",
    delete: "Delete",
    actions: "Action",
    loadFailed: "Failed to load data.",
    networkError: "Network error.",
    somethingWrong: "Something went wrong.",
    added: "Register data saved.",
    updated: "Register data updated.",
    deleted: "Register data deleted.",
    approvedMessage: "Status updated.",
    importFailed: "Import failed.",
    importSuccess: "Excel imported successfully.",
    invalidExcel: "Invalid Excel file.",
    previous: "Previous",
    next: "Next",
    showing: "Showing",
    of: "of",
    page: "Page",
    required: "Please fill Alumni Name, Father Name, and Graduated Year.",
    namePlaceholder: "Enter alumni name",
    fatherNamePlaceholder: "Enter father name",
    selectYear: "Select Year",
    allYears: "All Years",
    allStatuses: "All Status",
  },
  mm: {
    title: "ကျောင်းသားအချက်အလက် မှတ်ပုံတင်ခြင်း",
    subtitle: " ",
    export: "Export",
    exportExample: "Excel (Template)",
    exportData: "Excel (Data)",
    printData: "Print Report",
    importExcel: "Import Excel",
    addStudent: "အချက်အလက် ထည့်ရန်",
    editStudent: "အချက်အလက် ပြင်မည်",
    viewLists: "စာရင်းများ ကြည့်ရန်",
    manualAdd: " ",  
    no: "စဉ်",
    name: "ကျောင်းသားဟောင်းအမည်",
    fatherName: "အဖအမည်",
    graduatedYear: "ဘွဲ့ရနှစ်",
    adding: "သိမ်းဆည်းနေသည်...",
    addRegisterData: "Data သိမ်းမည်",
    updateRegisterData: "Data ပြင်မည်",
    approvedData: "မှတ်ပုံတင်ထားသော ကျောင်းသားအချက်အလက်များ",
    searchPlaceholder: "အမည်၊ အဖအမည်၊ သို့မဟုတ် ဘွဲ့ရနှစ် ဖြင့် ရှာရန်...",
    noData: "ဒေတာ မတွေ့ပါ",
    created: "ဖန်တီးသည့်နေ့",
    status: "အခြေအနေ",
    registered: "စာရင်းသွင်းပြီး",
    notRegistered: "စာရင်းမသွင်းရသေးပါ",
    approve: "အတည်ပြုမည်",
    edit: "ပြင်မည်",
    delete: "ဖျက်မည်",
    actions: "လုပ်ဆောင်ချက်",
    loadFailed: "ဒေတာ load မအောင်မြင်ပါ။",
    networkError: "Network error ဖြစ်နေသည်။",
    somethingWrong: "တစ်ခုခုမှားနေသည်။",
    added: "Register data ထည့်ပြီးပါပြီ။",
    updated: "Register data ပြင်ဆင်ပြီးပါပြီ။",
    deleted: "Register data ဖျက်ပြီးပါပြီ။",
    approvedMessage: "Status ပြင်ဆင်ပြီးပါပြီ။",
    importFailed: "Import မအောင်မြင်ပါ။",
    importSuccess: "Excel import အောင်မြင်ပါသည်။",
    invalidExcel: "Excel file မှားနေသည်။",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    page: "စာမျက်နှာ",
    required: "Alumni Name, Father Name, နှင့် Graduated Year အားလုံး ဖြည့်ပါ။",
    namePlaceholder: "ကျောင်းသားဟောင်းအမည် ရိုက်ထည့်ပါ",
    fatherNamePlaceholder: "အဖအမည် ရိုက်ထည့်ပါ",
    selectYear: "ခုနှစ် ရွေးချယ်ပါ",
    allYears: "ခုနှစ်အားလုံး",
    allStatuses: "အခြေအနေအားလုံး",
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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportHtml(students: Student[], t: typeof text.en) {
  const totalStudents = students.length;
  const registeredCount = students.filter((s) => s.registered).length;
  const notRegisteredCount = totalStudents - registeredCount;
  const yearsCount = new Set(students.map((s) => s.graduatedYear).filter(Boolean)).size;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const rows = students
    .map(
      (student, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(student.fatherName)}</td>
          <td class="center">${escapeHtml(student.graduatedYear || "")}</td>
          <td class="center">
            <span class="badge ${student.registered ? "badge-current" : "badge-pending"}">
              ${escapeHtml(student.registered ? t.registered : t.notRegistered)}
            </span>
          </td>
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
    :root {
      --primary: #0f766e;
      --secondary: #00BFC4;
      --bg-light: #f8fafc;
      --text-main: #0f172a;
      --text-muted: #64748b;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 20px 40px;
      color: var(--text-main);
      background: #fff;
    }
    
    .report-header {
      display: flex;
      align-items: center;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      background: var(--bg-light);
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--text-muted);
      object-fit: contain;
    }
    .header-text h1 {
      margin: 0;
      font-size: 24px;
      color: var(--text-main);
    }
    .header-text h2 {
      margin: 4px 0;
      font-size: 14px;
      color: var(--primary);
      font-weight: 600;
    }
    .header-text h3 {
      margin: 0;
      font-size: 20px;
      color: var(--text-main);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-meta {
      margin-top: 8px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .summary-container {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
    }
    .summary-card {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      background: var(--bg-light);
    }
    .card-icon {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
    }
    .card-icon.blue { background: #0284c7; }
    .card-icon.green { background: #16a34a; }
    .card-icon.orange { background: #d97706; }
    
    .card-info p {
      margin: 0;
      font-size: 11px;
      font-weight: bold;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .card-info h4 {
      margin: 2px 0 0 0;
      font-size: 24px;
      color: var(--text-main);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 8px;
      font-size: 11px;
      text-align: left;
    }
    th {
      background: var(--primary);
      color: white;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    td.center, th.center {
      text-align: center;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
    }
    .badge-current {
      color: #16a34a;
      border: 1px solid #16a34a;
      background: #f0fdf4;
    }
    .badge-pending {
      color: #d97706;
      border: 1px solid #d97706;
      background: #fffbeb;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      font-size: 10px;
      color: var(--text-muted);
    }

    @media print {
      @page { 
        size: portrait; 
        margin: 0;
      }
      body { 
        padding: 15mm 15mm;
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
      .summary-card { 
        break-inside: avoid; 
      }
      thead { 
        display: table-header-group; 
      }
      tr { 
        break-inside: avoid; 
      }
    }
  </style>
</head>
<body>

  <div class="report-header">
    <img src="/logo.png" alt="UCSH Logo" class="logo-placeholder" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>University of Computer Studies (Hinthada)</h1>
      <h2>Alumni Network System</h2>
      <h3>REGISTRATION REPORT OF ALUMNI</h3>
      <div class="header-meta">
        Generated Date: ${dateStr} | Time: ${timeStr}
      </div>
    </div>
  </div>

  <div class="summary-container">
    <div class="summary-card">
      <div class="card-icon" style="background: #0f766e;">📋</div>
      <div class="card-info">
        <p>Total Data</p>
        <h4>${totalStudents}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon green">✅</div>
      <div class="card-info">
        <p>Registered</p>
        <h4>${registeredCount}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon orange">⏳</div>
      <div class="card-info">
        <p>Not Registered</p>
        <h4>${notRegisteredCount}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon blue">🎓</div>
      <div class="card-info">
        <p>Graduated Years</p>
        <h4>${yearsCount}</h4>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center">${escapeHtml(t.no)}</th>
        <th>${escapeHtml(t.name)}</th>
        <th>${escapeHtml(t.fatherName)}</th>
        <th class="center">${escapeHtml(t.graduatedYear)}</th>
        <th class="center">${escapeHtml(t.status)}</th>
        <th>${escapeHtml(t.created)}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <span>Alumni Network System</span>
    <span>Official Administrative Report</span>
  </div>

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

export default function StaffRegisterUserDataAddPage() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "mm" ? "mm" : "en";
  const t = text[lang];

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  // Sort state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Student | "status";
    direction: "asc" | "desc";
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [importing, setImporting] = useState(false);
  const [actionId, setActionId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // <-- UPDATED: Fixed string list of specific years. Extends past 2030 dynamically if needed.
  const formYearOptions = useMemo(() => {
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

  // <-- UPDATED: Convert to string BEFORE adding to the Set to prevent duplicate keys
  const filterYearOptions = useMemo(() => {
    const uniqueYears = new Set(
      students
        .map((s) => String(s.graduatedYear || "").trim())
        .filter((y) => Boolean(y) && y !== "undefined" && y !== "null")
    );
    // Sort strings descending
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [students]);

  async function performSubmit() {
    try {
      const url = editingId
        ? `/api/admin/register-users/${editingId}`
        : "/api/admin/register-users";
      
      const method = editingId ? "PUT" : "POST"; 

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          graduatedYear: graduatedYear.trim(), // <-- Pass directly as string
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresIndexDrop) {
          const confirmDrop = window.confirm(
            `Old database indexes (like ${data.conflictingIndex}) are blocking this save.\n\nDo you want to drop these old indexes and continue?`
          );
          
          if (confirmDrop) {
            await fetch("/api/admin/register-users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "sync_indexes" }),
            });
            return performSubmit();
          }
        }

        setError(data.error || t.somethingWrong);
        setLoading(false);
        return;
      }

      setMessage(data.message || (editingId ? t.updated : t.added));
      resetForm();
      setShowAddForm(false);
      await loadStudents();
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
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
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students;
    const keyword = query.toLowerCase().trim();
    if (keyword) {
      filtered = filtered.filter((student) =>
        [student.name, student.fatherName, student.graduatedYear]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      );
    }

    if (filterYear !== "all") {
      filtered = filtered.filter((s) => String(s.graduatedYear) === filterYear);
    }

    if (filterStatus !== "all") {
      const isRegistered = filterStatus === "registered";
      filtered = filtered.filter((s) => !!s.registered === isRegistered);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
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

    return filtered;
  }, [students, query, filterYear, filterStatus, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterYear, filterStatus, sortConfig]);

  const totalPages = Math.max(Math.ceil(filteredAndSortedStudents.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedStudents = filteredAndSortedStudents.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
  const pageNumbers = getPagination(safeCurrentPage, totalPages);
  const showingStart = filteredAndSortedStudents.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, filteredAndSortedStudents.length);

  function handleSort(key: keyof Student | "status") {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  }

  function resetForm() {
    setName("");
    setFatherName("");
    setGraduatedYear("");
    setEditingId(null);
  }

  function toggleView() {
    if (showAddForm) {
      resetForm();
    }
    setShowAddForm(!showAddForm);
    setMessage("");
    setError("");
  }

  function handleEditClick(student: Student) {
    setName(student.name);
    setFatherName(student.fatherName);
    setGraduatedYear(String(student.graduatedYear));
    setEditingId(student._id);
    setShowAddForm(true);
    setMessage("");
    setError("");
  }

  function validateForm() {
    // <-- UPDATED: Removed numeric checks
    return (
      name.trim().length > 0 &&
      fatherName.trim().length > 0 &&
      graduatedYear.trim().length > 0
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!validateForm()) {
      setError(t.required);
      setLoading(false);
      return;
    }

    performSubmit();
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
    // <-- UPDATED: Changed template examples to show string formats
    const rows = [
      {
        name: "Kyaw Kyaw",
        fatherName: "U Tun",
        graduatedYear: "2026",
      },
      {
        name: "Su Su",
        fatherName: "U Aung Aung",
        graduatedYear: "2027 (Senior)",
      },
      {
        name: "Zaw Zaw",
        fatherName: "U Hla",
        graduatedYear: "2027 (Junior)",
      },
      {
        name: "Mya Mya",
        fatherName: "U Bo Bo",
        graduatedYear: "2028 (Senior)",
      },
      {
        name: "Hla Hla",
        fatherName: "U Nyi Nyi",
        graduatedYear: "2028 (Junior)",
      },
    ];

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "RegisterDataTemplate");
    XLSX.writeFile(book, "register-data-template.xlsx");
  }

  function exportCurrentData() {
    const rows = filteredAndSortedStudents.map((student) => ({
      name: student.name,
      fatherName: student.fatherName,
      graduatedYear: student.graduatedYear,
      status: student.registered ? "Registered" : "Not Registered",
      createdAt: student.createdAt,
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "RegisterData");
    XLSX.writeFile(book, "register-data.xlsx");
  }

  function printCurrentData() {
    const html = exportHtml(filteredAndSortedStudents, t);
    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function performImportExcel(studentsToImport: any[]) {
    try {
      const res = await fetch("/api/admin/register-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: studentsToImport }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresIndexDrop) {
          const confirmDrop = window.confirm(
            `Old database indexes (like ${data.conflictingIndex}) are blocking this import.\n\nDo you want to drop these old indexes and continue the import?`
          );
          
          if (confirmDrop) {
            await fetch("/api/admin/register-users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "sync_indexes" }),
            });
            return performImportExcel(studentsToImport);
          }
        }

        setError(data.error || t.importFailed);
        setImporting(false);
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
          // <-- UPDATED: Map to string and cleanly trim instead of Number()
          graduatedYear: cleanText(String(row.graduatedYear || row["Graduated Year"] || "")),
        }))
        .filter(
          (student) =>
            student.name &&
            student.fatherName &&
            student.graduatedYear
        );

      performImportExcel(studentsToImport);
    } catch {
      setError(t.invalidExcel);
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <StaffSidebar active="register-users" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            {/* Top Control Header Box */}
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

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleView}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:brightness-110 active:scale-95"
                  >
                    {showAddForm ? <List size={15} /> : <Plus size={15} />}
                    {showAddForm ? t.viewLists : t.addStudent}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={importing}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60"
                  >
                    {importing ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Upload size={15} />
                    )}
                    {t.importExcel}
                  </button>

                  {/* Dropdown for Export Options */}
                  <details className="group relative z-[200] inline-flex overflow-visible">
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden">
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>

                    <div className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-400/40 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/50 max-[420px]:left-0 max-[420px]:right-auto">
                      <button
                        type="button"
                        onClick={exportTemplate}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
                      >
                        <FileSpreadsheet size={16} />
                        {t.exportExample}
                      </button>

                      <button
                        type="button"
                        onClick={exportCurrentData}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
                      >
                        <FileSpreadsheet size={16} className="text-emerald-500 dark:text-emerald-400" />
                        {t.exportData}
                      </button>

                      <button
                        type="button"
                        onClick={printCurrentData}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
                      >
                        <Printer size={16} />
                        {t.printData}
                      </button>
                    </div>
                  </details>

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

            <div className="grid gap-4 md:gap-6">
              {showAddForm ? (
                /* Add / Edit Form View */
                <form
                  onSubmit={handleSubmit}
                  className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
                      {editingId ? <Edit size={20} /> : <Plus size={20} />}
                    </div>

                    <div>
                      <h2 className="text-lg font-black dark:text-white">
                        {editingId ? t.editStudent : t.addStudent}
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                        {formYearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] hover:brightness-110 active:scale-95 disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : editingId ? (
                        <Check size={17} />
                      ) : (
                        <Plus size={17} />
                      )}
                      {loading 
                        ? t.adding 
                        : editingId 
                          ? t.updateRegisterData 
                          : t.addRegisterData}
                    </button>
                  </div>
                </form>
              ) : (
                /* Table View */
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 p-4 dark:border-slate-800/60 lg:flex-row lg:items-center sm:p-5">
                    <div className="mb-2 lg:mb-0">
                      <h2 className="text-lg font-black dark:text-white">{t.approvedData}</h2>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t.showing} {showingStart}-{showingEnd} {t.of}{" "}
                        {filteredAndSortedStudents.length}
                      </p>
                    </div>

                    <div className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-center">
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="h-10 w-full sm:w-36 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
                      >
                        <option value="all">{t.allYears}</option>
                        {filterYearOptions.map((year) => (
                          <option key={year} value={String(year)}>
                            {year}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-10 w-full sm:w-40 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
                      >
                        <option value="all">{t.allStatuses}</option>
                        <option value="registered">{t.registered}</option>
                        <option value="notRegistered">{t.notRegistered}</option>
                      </select>

                      <div className="relative w-full sm:w-64">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder={t.searchPlaceholder}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
                        />
                      </div>
                    </div>
                  </div>

                  {fetching ? (
                    <div className="flex items-center justify-center p-10">
                      <Loader2 className="h-8 w-8 animate-spin text-[#008B8B]" />
                    </div>
                  ) : paginatedStudents.length === 0 ? (
                    <div className="p-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                      {t.noData}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-900/80 dark:text-slate-500">
                            <tr>
                              <TableHead>{t.no}</TableHead>
                              <SortableTableHead
                                label={t.name}
                                sortKey="name"
                                currentSort={sortConfig}
                                onSort={handleSort}
                              />
                              <SortableTableHead
                                label={t.fatherName}
                                sortKey="fatherName"
                                currentSort={sortConfig}
                                onSort={handleSort}
                              />
                              <SortableTableHead
                                label={t.graduatedYear}
                                sortKey="graduatedYear"
                                currentSort={sortConfig}
                                onSort={handleSort}
                              />
                              <SortableTableHead
                                label={t.status}
                                sortKey="status"
                                currentSort={sortConfig}
                                onSort={handleSort}
                              />
                              <TableHead>{t.actions}</TableHead>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {paginatedStudents.map((student, index) => (
                              <tr
                                key={student._id}
                                className="transition-colors hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10"
                              >
                                <td className="px-5 py-3.5 font-bold text-slate-500 dark:text-slate-400">
                                  {startIndex + index + 1}
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
                                <td className="px-5 py-3.5 font-bold">
                                  <StatusBadge 
                                    approved={student.registered === true}
                                    approvedText={t.registered}
                                    notApprovedText={t.notRegistered}
                                  />
                                </td>
                                
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <ActionSmallButton
                                      color="blue"
                                      disabled={actionId === student._id}
                                      onClick={() => handleEditClick(student)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      {t.edit}
                                    </ActionSmallButton>

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
                        <div className="border-t border-slate-200/80 p-4 dark:border-slate-800/80">
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
    </div>
  );
}

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

function ActionSmallButton({
  children,
  onClick,
  disabled,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color: "red" | "green" | "blue";
}) {
  let className = "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white";
  if (color === "red") className = "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white";
  if (color === "blue") className = "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black transition-colors active:scale-95 disabled:opacity-60 ${className}`}
    >
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
      className={inputClass("appearance-none")}
    >
      {children}
    </select>
  );
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${
        approved
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
      }`}
    >
      {approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
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
            className="flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-xs font-black text-slate-400 dark:text-slate-600"
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
  if (disabled) {
    return (
      <span className="flex h-9 min-w-[36px] cursor-not-allowed items-center justify-center rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-300 dark:bg-slate-800/50 dark:text-slate-600">
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-3 text-xs font-black transition-all active:scale-95 ${
        active
          ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md shadow-cyan-500/20"
          : "bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-[#008B8B] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}