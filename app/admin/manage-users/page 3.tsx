// file: app/admin/manage-users/page.tsx

import type React from "react";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
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
    exportWord: "Word (.doc)",
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
    exportWord: "Word (.doc)",
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

function wordDataUrl(users: any[], title: string, t: typeof text.en) {
  return `data:application/msword;charset=utf-8,${encodeURIComponent(
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
  const wordHref = wordDataUrl(filteredUsers, exportTitle, t);
  const pdfHref = pdfDataUrl(filteredUsers, exportTitle, t);
  const webHref = htmlDataUrl(filteredUsers, exportTitle, t);
  const printHtml = exportHtml(filteredUsers, exportTitle, t);

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="manage-users" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h1 className="text-2xl font-black sm:text-3xl">
                    {t.pageTitle}
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {t.pageSubtitle}
                  </p>
                </div>

                <div className="group relative inline-flex self-start xl:self-auto">
                  <div className="inline-flex rounded-2xl shadow-lg shadow-slate-900/20">
                    <a
                      href={excelHref}
                      download="managed-users.csv"
                      className="inline-flex items-center gap-2 rounded-l-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100"
                    >
                      <Download size={16} />
                      {t.export}
                    </a>

                    <button
                      type="button"
                      className="rounded-r-2xl border-l border-white/15 bg-slate-950 px-3 py-3 text-sm font-black text-white transition hover:bg-indigo-600 focus:outline-none dark:border-slate-300 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100"
                    >
                      ▾
                    </button>
                  </div>

                  <div className="invisible absolute right-0 top-full z-30 mt-2 w-56 translate-y-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-2xl shadow-slate-300/60 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-slate-800 dark:bg-slate-950">
                    <ExportItem
                      href={excelHref}
                      fileName="managed-users.csv"
                      icon={<FileSpreadsheet size={16} />}
                      text={t.exportExcel}
                    />
                    <ExportItem
                      href={wordHref}
                      fileName="managed-users.doc"
                      icon={<FileText size={16} />}
                      text={t.exportWord}
                    />
                    <ExportItem
                      href={pdfHref}
                      fileName="managed-users.pdf"
                      icon={<FileText size={16} />}
                      text={t.exportPdf}
                    />

                    <ExportItem
                      href={webHref}
                      fileName="managed-users.html"
                      icon={<FileText size={16} />}
                      text={t.exportWeb}
                    />

                    <PrintUsersButton html={printHtml} />
                  </div>
                </div>
              </div>

              <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_minmax(160px,1fr)_minmax(140px,1fr)_auto]">
                <input type="hidden" name="lang" value={lang} />

                <div className="relative md:col-span-2 xl:col-span-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={rawQ}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <select
                  name="degree"
                  defaultValue={selectedDegree}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none dark:border-slate-800 dark:bg-slate-950"
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="">{t.allYear}</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-indigo-600 dark:bg-white dark:text-slate-950 md:col-span-2 xl:col-span-1">
                  {t.filter}
                </button>
              </form>
            </div>

            <div className="hidden overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 lg:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[980px]">
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
                        className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                      >
                        <td className="px-6 py-4">
                          <UserCell user={user} t={t} />
                        </td>

                        <td className="px-6 py-4 text-sm font-black text-slate-700 dark:text-slate-200">
                          {getPhone(user, t)}
                        </td>

                        <td className="px-6 py-4">
                          <Badge>{getDegree(user, t)}</Badge>
                        </td>

                        <td className="px-6 py-4 text-sm font-black">
                          {getGraduatedYear(user, t)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <form action={deleteUserAccount}>
                              <input
                                type="hidden"
                                name="id"
                                value={String(user._id)}
                              />
                              <button className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white hover:bg-red-600">
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

              {filteredUsers.length === 0 && <EmptyUsers t={t} />}
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredUsers.map((user) => (
                <article
                  key={String(user._id)}
                  className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900"
                >
                  <UserCell user={user} t={t} />

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniInfo label={t.phone} value={getPhone(user, t)} />
                    <MiniInfo label={t.degree} value={getDegree(user, t)} />
                    <MiniInfo
                      label={t.year}
                      value={getGraduatedYear(user, t)}
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <form action={deleteUserAccount}>
                      <input type="hidden" name="id" value={String(user._id)} />
                      <button className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white">
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
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
      className={`px-6 py-4 ${
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
        width={46}
        height={46}
        className="h-11 w-11 rounded-2xl object-cover"
      />

      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-black">
          {user.name || t.unknownUser}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Mail size={12} />
          <span className="line-clamp-1">{user.email || t.noEmail}</span>
        </p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function EmptyUsers({ t }: { t: typeof text.en }) {
  return (
    <div className="p-10 text-center">
      <Users className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-4 text-xl font-black">{t.noUsersFound}</h2>
      <p className="mt-1 text-sm font-bold text-slate-400">{t.noUsersText}</p>
    </div>
  );
}
