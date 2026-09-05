// file: app/staff/manage-users/page.tsx

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Mail,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ApprovedStudent from "@/models/ApprovedStudent";
import StaffSidebar from "@/components/staff/staff-sidebar";
import ConfirmDelete from "@/components/admin/confirm-delete";
import AutoSubmitManageUsersFilters from "@/components/admin/auto-submit-manage-users-filters";
import PrintUsersButton from "@/components/admin/print-users-button";

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

const text = {
  en: {
    pageTitle: "Manage Alumni",
    pageSubtitle: " ",
    searchPlaceholder: "Search name, email, phone, degree...",
    allDegree: "All Degree",
    allYear: "All Year",
    no: "No.",
    user: "Alumni",
    degree: "Degree",
    year: "Year",
    phone: "Phone Number",
    actions: "Actions",
    delete: "Delete",
    view: "View",
    cancel: "Cancel",
    deleteConfirm: "Delete Alumni",
    cannotUndo: "This action cannot be undone.",
    unknownUser: "Unknown Alumni",
    noEmail: "No email",
    unknown: "Unknown",
    noUsersFound: "No Alumni Found",
    noUsersText: "Try changing search, year, or degree filters.",
    export: "Export",
    exportExcel: "Excel (CSV)",
    exportPrint: "Print Report",
    exportTitle: "Managed Alumni Export Report",
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
    totalUsers: "Alumni",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
  },
  mm: {
    pageTitle: "ကျောင်းသားဟောင်းများစီမံခန့်ခွဲမှု",
    pageSubtitle: " ",
    searchPlaceholder: "အမည်၊ အီးမေးလ်၊ ဖုန်းနံပါတ်၊ ဘွဲ့အမည် ဖြင့် ရှာရန်...",
    allDegree: "ဘွဲ့ အားလုံး",
    allYear: "ခုနှစ် အားလုံး",
    no: "စဉ်",
    user: "ကျောင်းသားဟောင်း",
    degree: "ဘွဲ့",
    year: "ခုနှစ်",
    phone: "ဖုန်းနံပါတ်",
    actions: "လုပ်ဆောင်ချက်များ",
    delete: "ဖျက်ရန်",
    view: "ကြည့်ရန်",
    cancel: "မဖျက်တော့ပါ",
    deleteConfirm: "ကျောင်းသားဟောင်း ဖျက်မည်လား",
    cannotUndo: "ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။",
    unknownUser: "အမည်မရှိသော ကျောင်းသားဟောင်း",
    noEmail: "Email မရှိပါ",
    unknown: "Unknown",
    noUsersFound: "အသုံးပြုသူ မတွေ့ပါ",
    noUsersText: "Search၊ ခုနှစ်၊ Degree filter ပြောင်းကြည့်ပါ။",
    export: "Export",
    exportExcel: "Excel (CSV)",
    exportPrint: "Print ထုတ်ရန်",
    exportTitle: "အသုံးပြုသူ စာရင်း Report",
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
    totalUsers: "Users",
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    page: "စာမျက်နှာ",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",
  },
};

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getDegree(user: any, t?: typeof text.en) {
  return cleanText(user?.degree || user?.department) || t?.unknown || "Unknown";
}

function getGraduatedYear(user: any, t?: typeof text.en) {
  return user?.graduatedYear
    ? String(user.graduatedYear)
    : t?.unknown || "Unknown";
}

function getPhone(user: any, t?: typeof text.en) {
  return (
    cleanText(user?.contactInfo?.phone) ||
    cleanText(user?.phone) ||
    cleanText(user?.phoneNumber) ||
    t?.unknown ||
    "Unknown"
  );
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
    [t.no, t.name, t.email, t.phone, t.degree, t.graduatedYear],
    ...users.map((user, index) => [
      index + 1,
      user.name || t.unknownUser,
      user.email || "",
      getPhone(user, t),
      getDegree(user, t),
      getGraduatedYear(user, t),
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
  const totalUsers = users.length;
  const yearsCount = new Set(
    users.map((u) => getGraduatedYear(u, t)).filter((y) => y && y !== t.unknown)
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
          <td>${escapeHtml(user.email || t.noEmail)}</td>
          <td>${escapeHtml(getPhone(user, t))}</td>
          <td>${escapeHtml(getDegree(user, t))}</td>
          <td class="center">${escapeHtml(getGraduatedYear(user, t))}</td>
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
    .header-text h1 {
      margin: 0;
      font-size: 22px;
      color: var(--text-main);
    }
    .header-text h2 {
      margin: 4px 0;
      font-size: 22px;
      color: var(--primary);
      font-weight: 600;
    }
    .header-text h3 {
      margin: 0;
      font-size: 18px;
      color: var(--text-main);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-meta {
      margin-top: 6px;
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
      padding: 12px 15px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-light);
    }
    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
    }
    
    .card-info p {
      margin: 0;
      font-size: 10px;
      font-weight: bold;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .card-info h4 {
      margin: 2px 0 0 0;
      font-size: 20px;
      color: var(--text-main);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
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
      <h2>Alumni Network</h2>
      <h3>Report of Alumni</h3>
      <div class="header-meta">
        Generated Date: ${dateStr} | Time: ${timeStr}
      </div>
    </div>
  </div>

  <div class="summary-container">
    <div class="summary-card">
      <div class="card-icon" style="background: #0f766e;">👥</div>
      <div class="card-info">
        <p>Total Managed Alumni</p>
        <h4>${totalUsers}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon" style="background: #0284c7;">🎓</div>
      <div class="card-info">
        <p>Graduated Years</p>
        <h4>${yearsCount}</h4>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center">No</th>
        <th>NAME</th>
        <th>EMAIL</th>
        <th>PHONE</th>
        <th>DEGREE</th>
        <th class="center">GRADUATED YEAR</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <span>Alumni Network</span>
    <span>Official Administrative Report</span>
  </div>

</body>
</html>`;
}

async function deleteUserAccount(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  if (!id) return;

  const session = await auth();
  if (!session?.user?.email) redirect("/staff/login");

  await connectDB();

  const staffUser: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!staffUser || (staffUser.role !== "staff" && staffUser.role !== "admin")) {
    redirect("/staff/login");
  }

  if (String(staffUser._id) === id) return;

  const userToDelete: any = await User.findById(id).lean();

  // Staff can only delete regular users/alumni
  if (userToDelete && userToDelete.role === "user") {
    if (userToDelete.name) {
      const safeName = userToDelete.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const queryFilter: any = {
        name: new RegExp(`^\\s*${safeName}\\s*$`, "i"),
      };

      if (userToDelete.graduatedYear) {
        queryFilter.graduatedYear = Number(userToDelete.graduatedYear);
      }

      await ApprovedStudent.updateMany(queryFilter, {
        $set: { registered: false },
      });
    }

    await User.findByIdAndDelete(id);
  }

  revalidatePath("/staff/manage-users");
  revalidatePath("/staff/register-users");
  revalidatePath("/staff/users");
  revalidatePath("/staff/dashboard");
}

export default async function StaffManageUsersPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{
        q?: string;
        degree?: string;
        year?: string;
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      }>
    | {
        q?: string;
        degree?: string;
        year?: string;
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const rawQ = cleanText(resolvedSearchParams.q);
  const q = rawQ.toLowerCase();
  const selectedDegree = cleanText(resolvedSearchParams.degree);
  const selectedYear = cleanText(resolvedSearchParams.year);
  const sortKey = cleanText(resolvedSearchParams.sort);
  const sortDir = resolvedSearchParams.dir === "desc" ? "desc" : "asc";
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();
  if (!session?.user?.email) redirect("/staff/login");

  await connectDB();

  const staffUser: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!staffUser || (staffUser.role !== "staff" && staffUser.role !== "admin")) {
    redirect("/staff/login");
  }

  // Strictly fetch only users with role === 'user' (Alumni)
  const allUsers: any[] = await User.find({ role: "user" })
    .sort({ createdAt: -1 })
    .select(
      "_id name email image role degree department graduatedYear contactInfo.phone phone phoneNumber createdAt",
    )
    .lean();

  const users = allUsers;

  const degreeOptions = Array.from(
    new Set(
      users
        .map((user) => getDegree(user))
        .filter((degree) => degree && degree !== "Unknown"),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const yearOptions = Array.from(
    new Set(
      users
        .map((user) => getGraduatedYear(user))
        .filter((year) => year && year !== "Unknown"),
    ),
  ).sort((a, b) => Number(b) - Number(a));

  let filteredUsers = users.filter((user) => {
    const name = cleanText(user.name).toLowerCase();
    const email = cleanText(user.email).toLowerCase();
    const degree = getDegree(user);
    const phone = getPhone(user).toLowerCase();
    const year = getGraduatedYear(user);

    return (
      (!q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        degree.toLowerCase().includes(q)) &&
      (!selectedDegree || degree === selectedDegree) &&
      (!selectedYear || year === selectedYear)
    );
  });

  if (sortKey) {
    filteredUsers = [...filteredUsers].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      if (sortKey === "name") {
        aVal = cleanText(a.name).toLowerCase();
        bVal = cleanText(b.name).toLowerCase();
      } else if (sortKey === "phone") {
        aVal = getPhone(a).toLowerCase();
        bVal = getPhone(b).toLowerCase();
      } else if (sortKey === "degree") {
        aVal = getDegree(a).toLowerCase();
        bVal = getDegree(b).toLowerCase();
      } else if (sortKey === "year") {
        aVal = getGraduatedYear(a);
        bVal = getGraduatedYear(b);
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.max(Math.ceil(filteredUsers.length / PAGE_SIZE), 1);
  const requestedPage = Number(resolvedSearchParams.page || "1");
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  const pageNumbers = getPagination(currentPage, totalPages);
  const showingStart = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, filteredUsers.length);

  const makePageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (rawQ) params.set("q", rawQ);
    if (selectedDegree) params.set("degree", selectedDegree);
    if (selectedYear) params.set("year", selectedYear);
    if (lang) params.set("lang", lang);
    if (sortKey) params.set("sort", sortKey);
    if (sortDir) params.set("dir", sortDir);
    params.set("page", String(pageNumber));
    return `/staff/manage-users?${params.toString()}`;
  };

  const makeSortHref = (key: string) => {
    const params = new URLSearchParams();
    if (rawQ) params.set("q", rawQ);
    if (selectedDegree) params.set("degree", selectedDegree);
    if (selectedYear) params.set("year", selectedYear);
    if (lang) params.set("lang", lang);
    params.set("page", "1");
    params.set("sort", key);
    params.set(
      "dir",
      sortKey === key && sortDir === "asc" ? "desc" : "asc",
    );
    return `/staff/manage-users?${params.toString()}`;
  };

  const exportTitle = t.exportTitle;
  const excelHref = csvDataUrl(filteredUsers, t);
  const printHtml = exportHtml(filteredUsers, exportTitle, t);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <StaffSidebar active="manage-users" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            {/* Control Header */}
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.pageTitle}
                  </h1>

                  <p className="mt-1 max-w-2xl text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.pageSubtitle}
                  </p>
                </div>

                <div className="relative z-50 flex w-full flex-wrap items-center gap-2 overflow-visible xl:w-auto xl:justify-end">
                  <details className="group relative z-[200] inline-flex overflow-visible">
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden">
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>

                    <div className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/40 max-[420px]:left-0 max-[420px]:right-auto">
                      <ExportItem
                        href={excelHref}
                        fileName="managed-alumni.csv"
                        icon={<FileSpreadsheet size={16} className="text-emerald-500 dark:text-emerald-400" />}
                        text={t.exportExcel}
                      />

                      <div className="flex [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-xl [&>button]:px-3 [&>button]:py-2.5 [&>button]:text-left [&>button]:text-xs [&>button]:font-black [&>button]:text-slate-700 [&>button]:transition-colors [&>button]:hover:bg-cyan-50/60 dark:[&>button]:text-slate-200 dark:[&>button]:hover:bg-slate-800">
                        <PrintUsersButton html={printHtml} />
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="mt-4">
                <AutoSubmitManageUsersFilters
                  lang={lang}
                  q={rawQ}
                  degree={selectedDegree}
                  year={selectedYear}
                  degreeOptions={degreeOptions}
                  yearOptions={yearOptions}
labels={{
                    searchPlaceholder: t.searchPlaceholder,
                    allDegree: t.allDegree,
                    allYear: t.allYear,
                  }}
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80">
                    <tr>
                      <TableHead>{t.no}</TableHead>
                      <SortableTableHead
                        label={t.user}
                        sortKey="name"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.phone}
                        sortKey="phone"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.degree}
                        sortKey="degree"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.year}
                        sortKey="year"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <TableHead align="right">{t.actions}</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedUsers.map((user, index) => (
                      <tr
                        key={String(user._id)}
                        className="transition-colors hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10"
                      >
                        <td className="px-4 py-3.5 text-sm font-black text-slate-700 dark:text-slate-200">
                          {startIndex + index + 1}
                        </td>

                        <td className="px-4 py-3.5">
                          <UserCell user={user} t={t} />
                        </td>

                        <td className="px-4 py-3.5 text-sm font-black text-slate-700 dark:text-slate-200">
                          {getPhone(user, t)}
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge>{getDegree(user, t)}</Badge>
                        </td>

                        <td className="px-4 py-3.5 text-sm font-black dark:text-slate-200">
                          {getGraduatedYear(user, t)}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/staff/view-profile/${user._id}`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-2 text-[11px] font-black text-[#008B8B] transition-colors hover:bg-[#008B8B] hover:text-white active:scale-95 dark:bg-[#008B8B]/10 dark:text-cyan-400 dark:hover:bg-[#008B8B] dark:hover:text-white"
                            >
                              <Eye size={13} />
                              {t.view}
                            </Link>
                            <ConfirmDelete
                              action={deleteUserAccount}
                              id={String(user._id)}
                              t={{ deleteConfirm: t.deleteConfirm, cancel: t.cancel, delete: t.delete, cannotUndo: t.cannotUndo }}
                              label={t.delete}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition-colors hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && <EmptyUsers t={t} />}
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 lg:hidden">
              {paginatedUsers.map((user, index) => (
                <article
                  key={String(user._id)}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
                >
                  <div className="mb-3 flex items-center">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {t.no} {startIndex + index + 1}
                    </span>
                  </div>
                  
                  <UserCell user={user} t={t} />

                  <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <MiniInfo label={t.phone} value={getPhone(user, t)} />
                    <MiniInfo label={t.degree} value={getDegree(user, t)} />
                    <MiniInfo
                      label={t.year}
                      value={getGraduatedYear(user, t)}
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Link
                      href={`/staff/view-profile/${user._id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 px-4 py-2 text-[11px] font-black text-[#008B8B] transition-colors hover:bg-[#008B8B] hover:text-white active:scale-95 dark:bg-[#008B8B]/10 dark:text-cyan-400 dark:hover:bg-[#008B8B] dark:hover:text-white"
                    >
                      <Eye size={13} />
                      {t.view}
                    </Link>
                    <ConfirmDelete
                      action={deleteUserAccount}
                      id={String(user._id)}
                      t={{ deleteConfirm: t.deleteConfirm, cancel: t.cancel, delete: t.delete, cannotUndo: t.cannotUndo }}
                      label={t.delete}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-[11px] font-black text-red-600 transition-colors hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                    />
                  </div>
                </article>
              ))}

              {filteredUsers.length === 0 && <EmptyUsers t={t} />}
            </div>

            {/* Pagination Component */}
            {filteredUsers.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageNumbers={pageNumbers}
                makePageHref={makePageHref}
                showingStart={showingStart}
                showingEnd={showingEnd}
                totalItems={filteredUsers.length}
                t={t}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SortableTableHead({
  label,
  sortKey,
  currentSortKey,
  currentDir,
  makeSortHref,
}: {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentDir: "asc" | "desc";
  makeSortHref: (key: string) => string;
}) {
  const isActive = currentSortKey === sortKey;

  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      <Link
        href={makeSortHref(sortKey)}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-800 dark:hover:text-slate-200"
      >
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp size={14} className="text-[#008B8B] dark:text-[#00BFC4]" />
          ) : (
            <ArrowDown size={14} className="text-[#008B8B] dark:text-[#00BFC4]" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600" />
        )}
      </Link>
    </th>
  );
}

function ExportItem({
  href,
  fileName,
  icon,
  text,
}: {
  href: string;
  fileName: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <a
      href={href}
      download={fileName}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black text-slate-700 transition-colors hover:bg-cyan-50/60 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {icon}
      {text}
    </a>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3.5 ${
        align === "right" ? "text-right" : "text-left"
      } text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}
    >
      {children}
    </th>
  );
}

function UserCell({ user, t }: { user: any; t: typeof text.en }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Image
        src={user.image || "/avatar.png"}
        alt={user.name || t.user}
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200/80 bg-slate-50 object-cover dark:border-slate-700/80 dark:bg-slate-900"
      />

      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">
          {user.name || t.unknownUser}
        </h3>

        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <Mail size={12} className="shrink-0" />
          <span className="line-clamp-1">{user.email || t.noEmail}</span>
        </p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-[#00BFC4]/10 px-2.5 py-1.5 text-[11px] font-black text-[#008B8B] dark:bg-[#008B8B]/20 dark:text-cyan-400">
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function EmptyUsers({ t }: { t: typeof text.en }) {
  return (
    <div className="rounded-2xl p-10 text-center">
      <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{t.noUsersFound}</h2>
      <p className="mt-1 text-sm font-bold text-slate-400">{t.noUsersText}</p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  makePageHref,
  showingStart,
  showingEnd,
  totalItems,
  t,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: Array<number | "dots">;
  makePageHref: (page: number) => string;
  showingStart: number;
  showingEnd: number;
  totalItems: number;
  t: typeof text.en;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {t.showing} {showingStart}-{showingEnd} {t.of} {totalItems} • {t.page}{" "}
          {currentPage}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <PageLink
            href={makePageHref(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            {t.previous}
          </PageLink>

          {pageNumbers.map((pageNumber, index) =>
            pageNumber === "dots" ? (
              <span
                key={`dots-${index}`}
                className="flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-xs font-black text-slate-400 dark:text-slate-600"
              >
                ...
              </span>
            ) : (
              <PageLink
                key={pageNumber}
                href={makePageHref(pageNumber)}
                active={pageNumber === currentPage}
              >
                {pageNumber}
              </PageLink>
            ),
          )}

          <PageLink
            href={makePageHref(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {t.next}
          </PageLink>
        </div>
      </div>
    </div>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
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
    <Link
      href={href}
      className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-3 text-xs font-black transition-all active:scale-95 ${
        active
          ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md shadow-cyan-500/20"
          : "bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-[#008B8B] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </Link>
  );
}