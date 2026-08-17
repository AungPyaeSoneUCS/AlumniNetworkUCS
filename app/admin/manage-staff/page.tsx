// file: app/admin/manage-staff/page.tsx

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Lock,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";
import PrintUsersButton from "@/components/admin/print-users-button";

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

const text = {
  en: {
    pageTitle: "Manage Staff",
    searchPlaceholder: "Search by staff name, email, or position...",
    staffListTab: "Staff List",
    addStaffTab: "Add Staff",
    addStaffTitle: "Create New Staff Account",
    addStaffSubtitle: "Fill in the details below to register a new staff member.",
    no: "No",
    staff: "Name",
    position: "Position",
    email: "Email",
    password: "Password",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    save: "Save Staff Account",
    unknownUser: "Unknown Staff",
    noEmail: "No email",
    unknown: "Unknown",
    noUsersFound: "No Staff Found",
    noUsersText: "Try changing your search query.",
    export: "Export",
    exportExcel: "Excel (CSV)",
    exportPrint: "Print Report",
    exportTitle: "Staff Accounts Report",
    totalStaff: "Total Staff",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
    emailExists: "This email is already registered.",
    successCreated: "Staff account created successfully.",
    missingFields: "All fields are required.",
    invalidPassword: "Password must be at least 8 chars with 1 uppercase, 1 lowercase, and 1 number.",
    invalidEmail: "Invalid email format.",
    pwdPlaceholder: "Min 8 chars, 1 uppercase, 1 lowercase, 1 number",
  },
  mm: {
    pageTitle: "Staff စီမံခန့်ခွဲမှု",
    searchPlaceholder: "အမည်၊ အီးမေးလ်၊ ရာထူး ဖြင့် ရှာရန်...",
    staffListTab: "Staff စာရင်း",
    addStaffTab: "Staff အသစ်ထည့်ရန်",
    addStaffTitle: "Staff အကောင့်အသစ် ဖန်တီးပါ",
    addStaffSubtitle: "အောက်ပါအချက်အလက်များကို ဖြည့်သွင်းပါ။",
    no: "စဉ်",
    staff: "အမည်",
    position: "ရာထူး",
    email: "အီးမေးလ်",
    password: "စကားဝှက်",
    actions: "လုပ်ဆောင်ချက်များ",
    edit: "ပြင်မည်",
    delete: "ဖျက်မည်",
    save: "အကောင့်သိမ်းမည်",
    unknownUser: "အမည်မရှိသော Staff",
    noEmail: "Email မရှိပါ",
    unknown: "Unknown",
    noUsersFound: "Staff မတွေ့ပါ",
    noUsersText: "Search စာသားပြောင်းရှာကြည့်ပါ။",
    export: "Export",
    exportExcel: "Excel (CSV)",
    exportPrint: "Print ထုတ်ရန်",
    exportTitle: "Staff စာရင်း Report",
    totalStaff: "Total Staff",
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    page: "စာမျက်နှာ",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",
    emailExists: "ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ထားပြီးဖြစ်သည်။",
    successCreated: "Staff အကောင့် ဖန်တီးမှု အောင်မြင်ပါသည်။",
    missingFields: "အချက်အလက်အားလုံး ဖြည့်သွင်းရန် လိုအပ်ပါသည်။",
    invalidPassword: "စကားဝှက်တွင် စာလုံးကြီး၊ စာလုံးသေး၊ ဂဏန်း ပါဝင်ရမည်ဖြစ်ပြီး အနည်းဆုံး ၈ လုံးဖြစ်ရမည်။",
    invalidEmail: "အီးမေးလ်ပုံစံ မှားယွင်းနေပါသည်။",
    pwdPlaceholder: "အနည်းဆုံး ၈ လုံး (A-Z, a-z, 0-9 ပါရမည်)",
  },
};

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportRows(users: any[], t: typeof text.en) {
  return [
    [t.no, t.staff, t.position, t.email],
    ...users.map((user, idx) => [
      String(idx + 1),
      user.name || t.unknownUser,
      user.position || t.unknown,
      user.email || "",
    ]),
  ];
}

function csvCell(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
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

function csvDataUrl(users: any[], t: typeof text.en) {
  const csv = exportRows(users, t)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
}

function exportHtml(users: any[], title: string, t: typeof text.en) {
  const totalStaff = users.length;
  const positionsCount = new Set(
    users
      .map((u) => cleanText(u.position).toLowerCase())
      .filter((p) => p && p !== "unknown")
  ).size;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const rows = users
    .map(
      (user, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(user.name || t.unknownUser)}</td>
          <td style="text-transform: capitalize;">${escapeHtml(user.position || t.unknown)}</td>
          <td>${escapeHtml(user.email || t.noEmail)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
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
      margin-right: 20px;
      object-fit: contain;
    }
    .header-text h1 { margin: 0; font-size: 22px; color: var(--text-main); }
    .header-text h2 { margin: 4px 0; font-size: 14px; color: var(--primary); font-weight: 600; }
    .header-text h3 { margin: 0; font-size: 18px; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; }
    .header-meta { margin-top: 6px; font-size: 11px; color: var(--text-muted); }
    .summary-container { display: flex; gap: 15px; margin-bottom: 20px; }
    .summary-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; gap: 12px; background: var(--bg-light); }
    .card-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
    .card-info p { margin: 0; font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; }
    .card-info h4 { margin: 2px 0 0 0; font-size: 20px; color: var(--text-main); }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; text-align: left; }
    th { background: var(--primary); color: white; font-weight: bold; text-transform: uppercase; font-size: 10px; }
    tr:nth-child(even) td { background: #f8fafc; }
    td.center, th.center { text-align: center; }
    .footer { display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: var(--text-muted); }
    @media print {
      @page { size: portrait; margin: 0; }
      body { padding: 15mm 15mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .summary-card { break-inside: avoid; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <img src="/logo.png" alt="UCSH Logo" class="logo-placeholder" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>University of Computer Studies (Hinthada)</h1>
      <h2>Alumni Network System</h2>
      <h3>${escapeHtml(title)}</h3>
      <div class="header-meta">Generated Date: ${dateStr} | Time: ${timeStr}</div>
    </div>
  </div>
  <div class="summary-container">
    <div class="summary-card">
      <div class="card-icon" style="background: #0f766e;">👥</div>
      <div class="card-info"><p>Total Managed Staff</p><h4>${totalStaff}</h4></div>
    </div>
    <div class="summary-card">
      <div class="card-icon" style="background: #0284c7;">💼</div>
      <div class="card-info"><p>Distinct Positions</p><h4>${positionsCount}</h4></div>
    </div>
  </div>
  <table>
    <thead><tr><th class="center">#</th><th>NAME</th><th>POSITION</th><th>EMAIL</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer"><span>Alumni Network System</span><span>Official Administrative Report</span></div>
</body>
</html>`;
}

// SERVER ACTIONS
async function deleteStaffAccount(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  if (!id) return;

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");
  if (String(admin._id) === id) return; // Prevent self-deletion

  const userToDelete: any = await User.findById(id).select("role").lean();
  if (userToDelete && userToDelete.role === "staff") {
    await User.findByIdAndDelete(id);
  }

  revalidatePath("/admin/manage-staff");
}

async function addStaffAccount(formData: FormData) {
  "use server";
  
  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const lang = String(formData.get("lang") || "en");

  if (!name || !position || !email || !password) {
    redirect(`/admin/manage-staff?tab=add&lang=${lang}&error=missing_fields`);
  }

  // Server-side Regex Validation
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordRegex.test(password)) {
    redirect(`/admin/manage-staff?tab=add&lang=${lang}&error=invalid_password`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    redirect(`/admin/manage-staff?tab=add&lang=${lang}&error=invalid_email`);
  }

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const existingUser = await User.findOne({ email }).select("_id").lean();
  if (existingUser) {
    redirect(`/admin/manage-staff?tab=add&lang=${lang}&error=email_exists`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "staff",
    position, 
    isBlocked: false,
  });

  revalidatePath("/admin/manage-staff");
  redirect(`/admin/manage-staff?tab=list&lang=${lang}&success=created`);
}

export default async function AdminManageStaffPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string; lang?: Lang; sort?: string; dir?: "asc" | "desc"; tab?: string; error?: string; success?: string }> | any;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const currentTab = resolvedSearchParams.tab === "add" ? "add" : "list";
  const rawQ = cleanText(resolvedSearchParams.q);
  const q = rawQ.toLowerCase();
  const sortKey = cleanText(resolvedSearchParams.sort);
  const sortDir = resolvedSearchParams.dir === "desc" ? "desc" : "asc";
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const errorMsg = 
    resolvedSearchParams.error === "email_exists" ? t.emailExists : 
    resolvedSearchParams.error === "missing_fields" ? t.missingFields : 
    resolvedSearchParams.error === "invalid_password" ? t.invalidPassword : 
    resolvedSearchParams.error === "invalid_email" ? t.invalidEmail : null;
    
  const successMsg = resolvedSearchParams.success === "created" ? t.successCreated : null;

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const allStaff: any[] = await User.find({ role: "staff" })
    .sort({ createdAt: -1 })
    .select("_id name email image role position createdAt")
    .lean();

  let filteredStaff = allStaff.filter((user) => {
    const name = cleanText(user.name).toLowerCase();
    const email = cleanText(user.email).toLowerCase();
    const position = cleanText(user.position).toLowerCase();
    return !q || name.includes(q) || email.includes(q) || position.includes(q);
  });

  if (sortKey) {
    filteredStaff = [...filteredStaff].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortKey === "name") {
        aVal = cleanText(a.name).toLowerCase();
        bVal = cleanText(b.name).toLowerCase();
      } else if (sortKey === "position") {
        aVal = cleanText(a.position).toLowerCase();
        bVal = cleanText(b.position).toLowerCase();
      } else if (sortKey === "email") {
        aVal = cleanText(a.email).toLowerCase();
        bVal = cleanText(b.email).toLowerCase();
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.max(Math.ceil(filteredStaff.length / PAGE_SIZE), 1);
  const requestedPage = Number(resolvedSearchParams.page || "1");
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + PAGE_SIZE);

  const pageNumbers = getPagination(currentPage, totalPages);
  const showingStart = filteredStaff.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, filteredStaff.length);

  const makePageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (rawQ) params.set("q", rawQ);
    if (lang) params.set("lang", lang);
    if (sortKey) params.set("sort", sortKey);
    if (sortDir) params.set("dir", sortDir);
    params.set("page", String(pageNumber));
    params.set("tab", currentTab);
    return `/admin/manage-staff?${params.toString()}`;
  };

  const makeSortHref = (key: string) => {
    const params = new URLSearchParams();
    if (rawQ) params.set("q", rawQ);
    if (lang) params.set("lang", lang);
    params.set("page", "1");
    params.set("sort", key);
    params.set("dir", sortKey === key && sortDir === "asc" ? "desc" : "asc");
    params.set("tab", currentTab);
    return `/admin/manage-staff?${params.toString()}`;
  };

  const exportTitle = t.exportTitle;
  const excelHref = csvDataUrl(filteredStaff, t);
  const printHtml = exportHtml(filteredStaff, exportTitle, t);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="manage-staff" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            {/* Header */}
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white px-4 pt-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:px-5 sm:pt-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="mb-3 min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.pageTitle}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/manage-staff?tab=list&lang=${lang}`}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-black transition-colors ${
                      currentTab === "list"
                        ? "border-[#00BFC4] text-[#008B8B] dark:border-cyan-500 dark:text-cyan-400"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    {t.staffListTab}
                  </Link>
                  <Link
                    href={`/admin/manage-staff?tab=add&lang=${lang}`}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-black transition-colors ${
                      currentTab === "add"
                        ? "border-[#00BFC4] text-[#008B8B] dark:border-cyan-500 dark:text-cyan-400"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    {t.addStaffTab}
                  </Link>
                </div>
              </div>
            </div>

            {/* Success / Error Messages */}
            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* TAB CONTENT: ADD STAFF */}
            {currentTab === "add" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.addStaffTitle}</h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.addStaffSubtitle}</p>
                </div>

                <form action={addStaffAccount} className="max-w-xl space-y-5">
                  <input type="hidden" name="lang" value={lang} />
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {t.staff}
                    </label>
                    <div className="relative">
                      <UserCog className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        placeholder="U Htet Wai Lwin"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {t.position}
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="position"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        placeholder="Student Affairs Officer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {t.email}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                        title={lang === "mm" ? "အီးမေးလ်ပုံစံ မှန်ကန်စွာရိုက်ထည့်ပါ။" : "Please enter a valid email address."}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        placeholder="staff@ucsh.edu.mm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {t.password}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password-input"
                        type="password"
                        name="password"
                        required
                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title={lang === "mm" ? t.invalidPassword : t.invalidPassword}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        placeholder={t.pwdPlaceholder}
                      />
                      {/* Checkbox toggle trick to keep it purely server-component safe without client-side state */}
                      <label className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-[#008B8B] transition-colors">
                        <input type="checkbox" id="show-pwd-checkbox" className="peer sr-only" />
                        <Eye className="h-4 w-4 peer-checked:hidden" />
                        <EyeOff className="h-4 w-4 hidden peer-checked:block" />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
                  >
                    <UserCog className="h-4 w-4" />
                    {t.save}
                  </button>
                </form>

                <Script id="pwd-toggle" strategy="afterInteractive">
                  {`
                    document.getElementById('show-pwd-checkbox')?.addEventListener('change', function(e) {
                      const pwd = document.getElementById('password-input');
                      if (pwd) pwd.type = e.target.checked ? 'text' : 'password';
                    });
                  `}
                </Script>
              </div>
            )}

            {/* TAB CONTENT: STAFF LIST */}
            {currentTab === "list" && (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                  <form method="GET" action="/admin/manage-staff" className="flex w-full max-w-md items-center gap-2">
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="tab" value="list" />
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="q"
                        defaultValue={rawQ}
                        placeholder={t.searchPlaceholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                      />
                    </div>
                    <button type="submit" className="rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95">
                      Search
                    </button>
                  </form>
                  
                  <details className="group relative z-[200] inline-flex overflow-visible shrink-0">
                    <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden">
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>
                    <div className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/40 max-[420px]:left-0 max-[420px]:right-auto">
                      <ExportItem
                        href={excelHref}
                        fileName="staff-accounts.csv"
                        icon={<FileSpreadsheet size={16} className="text-emerald-500 dark:text-emerald-400" />}
                        text={t.exportExcel}
                      />
                      <div className="flex [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-xl [&>button]:px-3 [&>button]:py-2.5 [&>button]:text-left [&>button]:text-xs [&>button]:font-black [&>button]:text-slate-700 [&>button]:transition-colors [&>button]:hover:bg-cyan-50/60 dark:[&>button]:text-slate-200 dark:[&>button]:hover:bg-slate-800">
                        <PrintUsersButton html={printHtml} />
                      </div>
                    </div>
                  </details>
                </div>

                {/* Desktop Table View */}
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/80">
                        <tr>
                          <TableHead>{t.no}</TableHead>
                          <SortableTableHead label={t.staff} sortKey="name" currentSortKey={sortKey} currentDir={sortDir} makeSortHref={makeSortHref} />
                          <SortableTableHead label={t.position} sortKey="position" currentSortKey={sortKey} currentDir={sortDir} makeSortHref={makeSortHref} />
                          <SortableTableHead label={t.email} sortKey="email" currentSortKey={sortKey} currentDir={sortDir} makeSortHref={makeSortHref} />
                          <TableHead align="right">{t.actions}</TableHead>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {paginatedStaff.map((user, index) => (
                          <tr key={String(user._id)} className="transition-colors hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10">
                            <td className="px-4 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-4 py-3.5"><UserCell user={user} t={t} /></td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 capitalize">
                                {user.position || "Staff"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                              {user.email || t.noEmail}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/admin/manage-staff/${user._id}?lang=${lang}`}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                >
                                  <Pencil size={14} />
                                  {t.edit}
                                </Link>

                                <form action={deleteStaffAccount}>
                                  <input type="hidden" name="id" value={String(user._id)} />
                                  <button className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition-colors hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white">
                                    <Trash2 size={14} />
                                    {t.delete}
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredStaff.length === 0 && <EmptyUsers t={t} />}
                </div>

                {/* Mobile Card View */}
                <div className="grid gap-4 lg:hidden">
                  {paginatedStaff.map((user, index) => (
                    <article key={String(user._id)} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          #{startIndex + index + 1}
                        </span>
                        <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 capitalize">
                          {user.position || "Staff"}
                        </span>
                      </div>
                      
                      <UserCell user={user} t={t} />
                      
                      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <Link
                          href={`/admin/manage-staff/${user._id}?lang=${lang}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Pencil size={14} /> {t.edit}
                        </Link>
                        <form action={deleteStaffAccount} className="flex-1">
                          <input type="hidden" name="id" value={String(user._id)} />
                          <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-black text-red-600 transition-colors hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500">
                            <Trash2 size={14} /> {t.delete}
                          </button>
                        </form>
                      </div>
                    </article>
                  ))}
                  {filteredStaff.length === 0 && <EmptyUsers t={t} />}
                </div>

                {/* Pagination */}
                {filteredStaff.length > 0 && (
                  <Pagination
                    currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers}
                    makePageHref={makePageHref} showingStart={showingStart} showingEnd={showingEnd} totalItems={filteredStaff.length} t={t}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SortableTableHead({ label, sortKey, currentSortKey, currentDir, makeSortHref }: any) {
  const isActive = currentSortKey === sortKey;
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      <Link href={makeSortHref(sortKey)} className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-800 dark:hover:text-slate-200">
        {label}
        {isActive ? (
          currentDir === "asc" ? <ArrowUp size={14} className="text-[#008B8B] dark:text-[#00BFC4]" /> : <ArrowDown size={14} className="text-[#008B8B] dark:text-[#00BFC4]" />
        ) : (
          <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600" />
        )}
      </Link>
    </th>
  );
}

function ExportItem({ href, fileName, icon, text }: any) {
  return (
    <a href={href} download={fileName} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black text-slate-700 transition-colors hover:bg-cyan-50/60 dark:text-slate-200 dark:hover:bg-slate-800">
      {icon} {text}
    </a>
  );
}

function TableHead({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-3.5 ${align === "right" ? "text-right" : "text-left"} text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>
      {children}
    </th>
  );
}

function UserCell({ user, t }: any) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
        {user.image ? (
          <Image src={user.image} alt="Staff" width={40} height={40} className="h-full w-full rounded-xl object-cover" />
        ) : (
          <UserCog size={20} />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">{user.name || t.unknownUser}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <Mail size={12} className="shrink-0" />
          <span className="line-clamp-1">{user.email || t.noEmail}</span>
        </p>
      </div>
    </div>
  );
}

function EmptyUsers({ t }: any) {
  return (
    <div className="rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/50">
      <UserCog className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{t.noUsersFound}</h2>
      <p className="mt-1 text-sm font-bold text-slate-400">{t.noUsersText}</p>
    </div>
  );
}

function Pagination({ currentPage, totalPages, pageNumbers, makePageHref, showingStart, showingEnd, totalItems, t }: any) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {t.showing} {showingStart}-{showingEnd} {t.of} {totalItems} • {t.page} {currentPage}/{totalPages}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <PageLink href={makePageHref(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>{t.previous}</PageLink>
          {pageNumbers.map((num: any, i: number) =>
            num === "dots" ? (
              <span key={`dots-${i}`} className="flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-xs font-black text-slate-400 dark:text-slate-600">...</span>
            ) : (
              <PageLink key={num} href={makePageHref(num)} active={num === currentPage}>{num}</PageLink>
            )
          )}
          <PageLink href={makePageHref(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}>{t.next}</PageLink>
        </div>
      </div>
    </div>
  );
}

function PageLink({ href, active, disabled, children }: any) {
  if (disabled) return <span className="flex h-9 min-w-[36px] cursor-not-allowed items-center justify-center rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-300 dark:bg-slate-800/50 dark:text-slate-600">{children}</span>;
  return (
    <Link href={href} className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-3 text-xs font-black transition-all active:scale-95 ${active ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md shadow-cyan-500/20" : "bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-[#008B8B] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
      {children}
    </Link>
  );
}