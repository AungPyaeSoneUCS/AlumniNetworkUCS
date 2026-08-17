// file: app/admin/manage-users/page.tsx

import type React from "react";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Globe2,
  Mail,
  Printer,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PrintUsersButton from "@/components/admin/print-users-button";
import AdminSidebar from "@/components/admin/admin-sidebar";

type Lang = "en" | "mm";

const text = {
  en: {
    admin: "Admin",
    alumniPanel: "Alumni Panel",
    dashboard: "Dashboard",
    usersAnalytics: "Users Analytics",
    manageUsers: "Manage Users",
    jobs: "Jobs",
    posts: "Posts",
    registerData: "Register Data",
    logout: "Logout",
    english: "English",
    myanmar: "Myanmar",
    pageTitle: "Manage Users",
    pageSubtitle: "Filter, export, and delete user accounts.",
    searchPlaceholder: "Search name, email, phone, degree...",
    allDegree: "All Degree",
    allYear: "All Year",
    active: "Active",
    blocked: "Blocked",
    filter: "Filter",
    user: "User",
    degree: "Degree",
    year: "Year",
    phone: "Phone Number",
    actions: "Actions",
    delete: "Delete",
    unknownUser: "Unknown User",
    noEmail: "No email",
    unknown: "Unknown",
    noUsersFound: "No Users Found",
    noUsersText: "Try changing search, year, or degree filters.",
    export: "Export",
    exportExcel: "Excel (.csv)",
    exportPdf: "PDF (.pdf)",
    exportWeb: "Web (.html)",
    exportTitle: "Managed Users Export",
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
  },
  mm: {
    admin: "အက်မင်",
    alumniPanel: "Alumni Panel",
    dashboard: "Dashboard",
    usersAnalytics: "အသုံးပြုသူ စာရင်းဇယား",
    manageUsers: "အသုံးပြုသူ စီမံရန်",
    jobs: "အလုပ်အကိုင်များ",
    posts: "ပို့စ်များ",
    registerData: "မှတ်ပုံတင်ဒေတာ",
    logout: "ထွက်ရန်",
    english: "English",
    myanmar: "မြန်မာ",
    pageTitle: "အသုံးပြုသူ စီမံရန်",
    pageSubtitle:
      "အသုံးပြုသူများကို ရှာဖွေ၊ export ထုတ် နှင့် delete ပြုလုပ်နိုင်သည်။",
    searchPlaceholder: "နာမည်၊ email၊ phone၊ degree ဖြင့် ရှာရန်...",
    allDegree: "Degree အားလုံး",
    allYear: "ခုနှစ် အားလုံး",
    active: "အသုံးပြုနိုင်",
    blocked: "ပိတ်ထားသည်",
    filter: "ရှာမည်",
    user: "အသုံးပြုသူ",
    degree: "Degree",
    year: "ခုနှစ်",
    phone: "ဖုန်းနံပါတ်",
    actions: "လုပ်ဆောင်ချက်များ",
    delete: "ဖျက်ရန်",
    unknownUser: "အမည်မရှိသော အသုံးပြုသူ",
    noEmail: "Email မရှိပါ",
    unknown: "Unknown",
    noUsersFound: "အသုံးပြုသူ မတွေ့ပါ",
    noUsersText: "Search၊ ခုနှစ်၊ Degree filter ပြောင်းကြည့်ပါ။",
    export: "Export",
    exportExcel: "Excel (.csv)",
    exportPdf: "PDF (.pdf)",
    exportWeb: "Web (.html)",
    exportTitle: "Managed Users Export",
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
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
    [t.name, t.email, t.phone, t.degree, t.graduatedYear],
    ...users.map((user) => [
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

function csvDataUrl(users: any[], t: typeof text.en) {
  const csv = exportRows(users, t)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
}

function exportHtml(users: any[], title: string, t: typeof text.en) {
  const rows = users
    .map(
      (user) => `
        <tr>
          <td>${escapeHtml(user.name || t.unknownUser)}</td>
          <td>${escapeHtml(user.email || "")}</td>
          <td>${escapeHtml(getPhone(user, t))}</td>
          <td>${escapeHtml(getDegree(user, t))}</td>
          <td>${escapeHtml(getGraduatedYear(user, t))}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
    h1{font-size:24px;margin:0 0 18px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px}
    th{background:#f1f5f9;font-weight:700}
    tr:nth-child(even){background:#f8fafc}
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(t.name)}</th>
        <th>${escapeHtml(t.email)}</th>
        <th>${escapeHtml(t.phone)}</th>
        <th>${escapeHtml(t.degree)}</th>
        <th>${escapeHtml(t.graduatedYear)}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function htmlDataUrl(users: any[], title: string, t: typeof text.en) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    exportHtml(users, title, t),
  )}`;
}

function pdfEscape(value: any) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");
}

function pdfText(value: any, max = 30) {
  const clean = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

function base64Encode(value: string) {
  return Buffer.from(value, "binary").toString("base64");
}

function pdfDataUrl(users: any[], title: string, t: typeof text.en) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 32;
  const tableTop = 492;
  const rowHeight = 24;
  const colWidths = [140, 230, 140, 135, 95];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

  const headerRow = [t.name, t.email, t.phone, t.degree, t.graduatedYear];

  const dataRows = users.map((user) => [
    user.name || t.unknownUser,
    user.email || "",
    getPhone(user, t),
    getDegree(user, t),
    getGraduatedYear(user, t),
  ]);

  const rowsPerPage = 17;
  const pages: string[][][] = [];

  for (let i = 0; i < dataRows.length; i += rowsPerPage) {
    pages.push([headerRow, ...dataRows.slice(i, i + rowsPerPage)]);
  }

  if (pages.length === 0) {
    pages.push([headerRow]);
  }

  const colX = colWidths.reduce<number[]>(
    (acc, width) => [...acc, acc[acc.length - 1] + width],
    [margin],
  );

  const pageStreams = pages.map((pageRows, pageIndex) => {
    const tableHeight = pageRows.length * rowHeight;
    const commands: string[] = [];

    commands.push(
      "BT",
      "/F1 20 Tf",
      "0 0 0 rg",
      `${margin} 552 Td`,
      `(${pdfEscape(title)}) Tj`,
      "ET",
    );

    commands.push(
      "BT",
      "/F1 10 Tf",
      "0 0 0 rg",
      `${margin} 528 Td`,
      `(${pdfEscape(
        `Total users: ${users.length}    Page ${pageIndex + 1} of ${
          pages.length
        }`,
      )}) Tj`,
      "ET",
    );

    commands.push("0.94 0.96 0.99 rg");
    commands.push(
      `${margin} ${tableTop - rowHeight} ${tableWidth} ${rowHeight} re f`,
    );

    commands.push("0 0 0 RG");
    commands.push("0 0 0 rg");
    commands.push("0.7 w");

    for (let i = 0; i <= pageRows.length; i++) {
      const y = tableTop - i * rowHeight;
      commands.push(`${margin} ${y} m ${margin + tableWidth} ${y} l S`);
    }

    colX.forEach((x) => {
      commands.push(`${x} ${tableTop} m ${x} ${tableTop - tableHeight} l S`);
    });

    pageRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colX[colIndex] + 6;
        const y = tableTop - rowIndex * rowHeight - 16;
        const maxChars = [22, 38, 20, 22, 14][colIndex];

        commands.push(
          "BT",
          rowIndex === 0 ? "/F1 9 Tf" : "/F1 8 Tf",
          "0 0 0 rg",
          `${x} ${y} Td`,
          `(${pdfEscape(pdfText(cell, maxChars))}) Tj`,
          "ET",
        );
      });
    });

    return commands.join("\n");
  });

  let pdf = "%PDF-1.4\n";
  const objects: string[] = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  const pageObjectNumbers = pageStreams.map((_, index) => 3 + index * 2);
  const fontObjectNumber = 3 + pageStreams.length * 2;

  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers
      .map((num) => `${num} 0 R`)
      .join(" ")}] /Count ${pageStreams.length} >>\nendobj\n`,
  );

  pageStreams.forEach((stream, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;

    objects.push(
      `${pageObj} 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObj} 0 R >>
endobj
`,
    );

    objects.push(
      `${contentObj} 0 obj
<< /Length ${stream.length} >>
stream
${stream}
endstream
endobj
`,
    );
  });

  objects.push(
    `${fontObjectNumber} 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
`,
  );

  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${base64Encode(pdf)}`;
}

async function deleteUserAccount(formData: FormData) {
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
  if (String(admin._id) === id) return;

  await User.findByIdAndDelete(id);

  revalidatePath("/admin/manage-users");
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
}

export default async function AdminManageUsersPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{
        q?: string;
        degree?: string;
        year?: string;
        lang?: Lang;
      }>
    | {
        q?: string;
        degree?: string;
        year?: string;
        lang?: Lang;
      };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const rawQ = cleanText(resolvedSearchParams.q);
  const q = rawQ.toLowerCase();
  const selectedDegree = cleanText(resolvedSearchParams.degree);
  const selectedYear = cleanText(resolvedSearchParams.year);
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const allUsers: any[] = await User.find({})
    .sort({ createdAt: -1 })
    .select(
      "_id name email image role degree department graduatedYear contactInfo.phone phone phoneNumber createdAt",
    )
    .lean();

  const users = allUsers.filter((user) => user.role !== "admin");

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

  const filteredUsers = users.filter((user) => {
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

  const exportTitle = t.exportTitle;
  const excelHref = csvDataUrl(filteredUsers, t);
  const pdfHref = pdfDataUrl(filteredUsers, exportTitle, t);
  const webHref = htmlDataUrl(filteredUsers, exportTitle, t);
  const printHtml = exportHtml(filteredUsers, exportTitle, t);

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="manage-users" lang={lang} />

        <section className="min-w-0 flex-1 px-3 pb-5 pt-16 sm:px-4 lg:px-5 lg:pt-5">
          <div className="mx-auto max-w-7xl space-y-3">
            <div className="overflow-visible rounded-2xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
              <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#00BFC4]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#008B8B]">
                    <Users size={13} />
                    {filteredUsers.length} / {users.length}
                  </div>
                  <h1 className="mt-2 text-xl font-black sm:text-2xl">
                    {t.pageTitle}
                  </h1>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400 sm:text-sm">
                    {t.pageSubtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 overflow-visible">
                  <ExportButton
                    href={excelHref}
                    fileName="managed-users.csv"
                    icon={<FileSpreadsheet size={15} />}
                    text="Excel"
                  />
                  <ExportButton
                    href={pdfHref}
                    fileName="managed-users.pdf"
                    icon={<FileText size={15} />}
                    text="PDF"
                  />
                  <span className="inline-flex [&>button]:inline-flex [&>button]:items-center [&>button]:gap-2 [&>button]:rounded-xl [&>button]:bg-gradient-to-r [&>button]:from-[#00BFC4] [&>button]:to-[#008B8B] [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:font-black [&>button]:text-white [&>button]:shadow-md [&>button]:shadow-cyan-500/20 [&>button]:transition [&>button]:hover:scale-[1.02]">
                    <PrintUsersButton html={printHtml} />
                  </span>
                  <ExportButton
                    href={webHref}
                    fileName="managed-users.html"
                    icon={<Globe2 size={15} />}
                    text="Web"
                  />

                  <div className="group relative z-[200] inline-flex overflow-visible">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-md shadow-slate-900/20 transition hover:scale-[1.02] hover:bg-[#008B8B] dark:bg-white dark:text-slate-950"
                    >
                      <Download size={15} />
                      {t.export}
                      <span className="text-[10px]">▾</span>
                    </button>

                    <div className="invisible absolute right-0 top-full z-[9999] mt-2 w-56 translate-y-1 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-2xl shadow-slate-400/40 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-slate-800 dark:bg-slate-950">
                      <ExportItem
                        href={excelHref}
                        fileName="managed-users.csv"
                        icon={<FileSpreadsheet size={16} />}
                        text="Excel"
                      />
                      <ExportItem
                        href={pdfHref}
                        fileName="managed-users.pdf"
                        icon={<FileText size={16} />}
                        text="PDF"
                      />
                      <div className="rounded-xl px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:text-left">
                        <Printer size={16} />
                        <PrintUsersButton html={printHtml} />
                      </div>
                      <ExportItem
                        href={webHref}
                        fileName="managed-users.html"
                        icon={<Globe2 size={16} />}
                        text="Web"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <form className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_auto]">
                <input type="hidden" name="lang" value={lang} />

                <div className="relative md:col-span-2 xl:col-span-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={rawQ}
                    placeholder={t.searchPlaceholder}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                  />
                </div>

                <select
                  name="degree"
                  defaultValue={selectedDegree}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                >
                  <option value="">{t.allDegree}</option>
                  {degreeOptions.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>

                <select
                  name="year"
                  defaultValue={selectedYear}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                >
                  <option value="">{t.allYear}</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <button className="h-10 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition hover:scale-[1.02] md:col-span-2 xl:col-span-1">
                  {t.filter}
                </button>
              </form>
            </div>

            <div className="hidden overflow-visible rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 lg:block">
              <div className="w-full overflow-x-auto rounded-2xl">
                <table className="min-w-[920px] w-full border-separate border-spacing-0">
                  <thead className="bg-slate-50 dark:bg-slate-950">
                    <tr>
                      <TableHead>{t.user}</TableHead>
                      <TableHead>{t.phone}</TableHead>
                      <TableHead>{t.degree}</TableHead>
                      <TableHead>{t.year}</TableHead>
                      <TableHead align="right">{t.actions}</TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={String(user._id)}
                        className="border-t border-slate-100 transition hover:bg-[#00BFC4]/5 dark:border-slate-800 dark:hover:bg-slate-950"
                      >
                        <td className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                          <UserCell user={user} t={t} />
                        </td>

                        <td className="border-t border-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 dark:border-slate-800 dark:text-slate-200">
                          {getPhone(user, t)}
                        </td>

                        <td className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                          <Badge>{getDegree(user, t)}</Badge>
                        </td>

                        <td className="border-t border-slate-100 px-4 py-2.5 text-xs font-black dark:border-slate-800">
                          {getGraduatedYear(user, t)}
                        </td>

                        <td className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                          <div className="flex justify-end gap-2">
                            <form action={deleteUserAccount}>
                              <input
                                type="hidden"
                                name="id"
                                value={String(user._id)}
                              />
                              <button className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-red-600">
                                <Trash2 size={13} />
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

              {filteredUsers.length === 0 && <EmptyUsers t={t} />}
            </div>

            <div className="grid gap-2 lg:hidden">
              {filteredUsers.map((user) => (
                <article
                  key={String(user._id)}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900"
                >
                  <UserCell user={user} t={t} />

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MiniInfo label={t.phone} value={getPhone(user, t)} />
                    <MiniInfo label={t.degree} value={getDegree(user, t)} />
                    <MiniInfo
                      label={t.year}
                      value={getGraduatedYear(user, t)}
                    />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <form action={deleteUserAccount}>
                      <input type="hidden" name="id" value={String(user._id)} />
                      <button className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-black text-white">
                        <Trash2 size={13} />
                        {t.delete}
                      </button>
                    </form>
                  </div>
                </article>
              ))}

              {filteredUsers.length === 0 && <EmptyUsers t={t} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


function ExportButton({
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
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-3 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition hover:scale-[1.02]"
    >
      {icon}
      {text}
    </a>
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
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
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
      className={`px-4 py-3 ${
        align === "right" ? "text-right" : "text-left"
      } text-xs font-black uppercase tracking-widest text-slate-400`}
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
        className="h-10 w-10 rounded-xl object-cover"
      />

      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-black">
          {user.name || t.unknownUser}
        </h3>

        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Mail size={12} />
          <span className="line-clamp-1">{user.email || t.noEmail}</span>
        </p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#00BFC4]/10 px-2.5 py-1 text-[11px] font-black text-[#008B8B] dark:bg-slate-950 dark:text-cyan-300">
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-black">{value}</p>
    </div>
  );
}

function EmptyUsers({ t }: { t: typeof text.en }) {
  return (
    <div className="p-8 text-center">
      <Users className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-4 text-xl font-black">{t.noUsersFound}</h2>
      <p className="mt-1 text-sm font-bold text-slate-400">{t.noUsersText}</p>
    </div>
  );
}
