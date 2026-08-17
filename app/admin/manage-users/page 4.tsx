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
  Phone,
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
    pageTitle: "Manage Users",
    pageSubtitle: "Filter, export, and delete user accounts.",
    searchPlaceholder: "Search name, email, phone, degree...",
    allDegree: "All Degree",
    allYear: "All Year",
    filter: "Filter",
    reset: "Reset",
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
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
    exportTitle: "Managed Users Export",
    totalUsers: "Total Users",
  },
  mm: {
    pageTitle: "အသုံးပြုသူ စီမံရန်",
    pageSubtitle: "အသုံးပြုသူများကို ရှာဖွေ၊ export ထုတ် နှင့် delete ပြုလုပ်နိုင်သည်။",
    searchPlaceholder: "နာမည်၊ email၊ phone၊ degree ဖြင့် ရှာရန်...",
    allDegree: "Degree အားလုံး",
    allYear: "ခုနှစ် အားလုံး",
    filter: "ရှာမည်",
    reset: "ပြန်စရန်",
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
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
    exportTitle: "Managed Users Export",
    totalUsers: "စုစုပေါင်း အသုံးပြုသူ",
  },
};

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getDegree(user: any, t?: typeof text.en) {
  return cleanText(user?.degree || user?.department) || t?.unknown || "Unknown";
}

function getGraduatedYear(user: any, t?: typeof text.en) {
  return user?.graduatedYear ? String(user.graduatedYear) : t?.unknown || "Unknown";
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
    body{font-family:Arial,sans-serif;padding:18px;color:#0f172a;background:#f8fafc}
    h1{font-size:22px;margin:0 0 14px}
    table{width:100%;border-collapse:collapse;background:white;border-radius:14px;overflow:hidden}
    th,td{border:1px solid #e2e8f0;padding:9px 10px;text-align:left;font-size:13px}
    th{background:#00BFC4;color:white;font-weight:800}
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
  return `data:text/html;charset=utf-8,${encodeURIComponent(exportHtml(users, title, t))}`;
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
  const clean = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

function base64Encode(value: string) {
  return Buffer.from(value, "binary").toString("base64");
}

function pdfDataUrl(users: any[], title: string, t: typeof text.en) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 30;
  const tableTop = 492;
  const rowHeight = 24;
  const colWidths = [155, 230, 130, 130, 105];
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
  if (pages.length === 0) pages.push([headerRow]);

  const colX = colWidths.reduce<number[]>((acc, width) => [...acc, acc[acc.length - 1] + width], [margin]);
  const pageStreams = pages.map((pageRows, pageIndex) => {
    const tableHeight = pageRows.length * rowHeight;
    const commands: string[] = [];
    commands.push("BT", "/F1 20 Tf", "0 0 0 rg", `${margin} 552 Td`, `(${pdfEscape(title)}) Tj`, "ET");
    commands.push("BT", "/F1 10 Tf", "0 0 0 rg", `${margin} 528 Td`, `(${pdfEscape(`Total users: ${users.length}    Page ${pageIndex + 1} of ${pages.length}`)}) Tj`, "ET");
    commands.push("0 0.75 0.77 rg", `${margin} ${tableTop - rowHeight} ${tableWidth} ${rowHeight} re f`);
    commands.push("0.15 0.2 0.25 RG", "0 0 0 rg", "0.6 w");
    for (let i = 0; i <= pageRows.length; i++) {
      const y = tableTop - i * rowHeight;
      commands.push(`${margin} ${y} m ${margin + tableWidth} ${y} l S`);
    }
    colX.forEach((x) => commands.push(`${x} ${tableTop} m ${x} ${tableTop - tableHeight} l S`));
    pageRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colX[colIndex] + 6;
        const y = tableTop - rowIndex * rowHeight - 16;
        const maxChars = [24, 38, 20, 20, 16][colIndex];
        commands.push("BT", rowIndex === 0 ? "/F1 9 Tf" : "/F1 8 Tf", rowIndex === 0 ? "1 1 1 rg" : "0 0 0 rg", `${x} ${y} Td`, `(${pdfEscape(pdfText(cell, maxChars))}) Tj`, "ET");
      });
    });
    return commands.join("\n");
  });

  let pdf = "%PDF-1.4\n";
  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  const pageObjectNumbers = pageStreams.map((_, index) => 3 + index * 2);
  const fontObjectNumber = 3 + pageStreams.length * 2;
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")}] /Count ${pageStreams.length} >>\nendobj\n`);
  pageStreams.forEach((stream, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    objects.push(`${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`);
    objects.push(`${contentObj} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
  });
  objects.push(`${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return `data:application/pdf;base64,${base64Encode(pdf)}`;
}

async function deleteUserAccount(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  if (!id) return;

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();
  const admin: any = await User.findOne({ email: session.user.email }).select("_id role").lean();
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
    | Promise<{ q?: string; degree?: string; year?: string; lang?: Lang }>
    | { q?: string; degree?: string; year?: string; lang?: Lang };
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
  const admin: any = await User.findOne({ email: session.user.email }).select("_id role").lean();
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const allUsers: any[] = await User.find({})
    .sort({ createdAt: -1 })
    .select("_id name email image profileImage googleImage googleProfileImage role degree department graduatedYear phone phoneNumber contactInfo.phone createdAt")
    .lean();

  const users = allUsers.filter((user) => user.role !== "admin");

  const degreeOptions = Array.from(
    new Set(users.map((user) => getDegree(user)).filter((degree) => degree && degree !== "Unknown")),
  ).sort((a, b) => a.localeCompare(b));

  const yearOptions = Array.from(
    new Set(users.map((user) => getGraduatedYear(user)).filter((year) => year && year !== "Unknown")),
  ).sort((a, b) => Number(b) - Number(a));

  const filteredUsers = users.filter((user) => {
    const name = cleanText(user.name).toLowerCase();
    const email = cleanText(user.email).toLowerCase();
    const phone = getPhone(user).toLowerCase();
    const degree = getDegree(user);
    const year = getGraduatedYear(user);
    return (
      (!q || name.includes(q) || email.includes(q) || phone.includes(q) || degree.toLowerCase().includes(q)) &&
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
            <div className="rounded-[22px] border border-white/70 bg-white/90 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#008B8B] dark:bg-cyan-500/10 dark:text-cyan-200">
                    <Users className="h-3.5 w-3.5" />
                    {t.totalUsers}: {filteredUsers.length}
                  </div>
                  <h1 className="mt-2 text-xl font-black sm:text-2xl">{t.pageTitle}</h1>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{t.pageSubtitle}</p>
                </div>

                <div className="group relative inline-flex self-start xl:self-auto">
                  <div className="inline-flex rounded-2xl shadow-lg shadow-cyan-500/20">
                    <a
                      href={excelHref}
                      download="managed-users.csv"
                      className="inline-flex items-center gap-2 rounded-l-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2.5 text-xs font-black text-white transition hover:scale-[1.02] active:scale-95"
                    >
                      <Download size={15} />
                      {t.export}
                    </a>
                    <button
                      type="button"
                      className="rounded-r-2xl border-l border-white/20 bg-[#008B8B] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#007777]"
                    >
                      ▾
                    </button>
                  </div>

                  <div className="invisible absolute right-0 top-full z-30 mt-2 w-52 translate-y-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-2xl shadow-slate-300/60 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-slate-800 dark:bg-slate-950">
                    <ExportItem href={excelHref} fileName="managed-users.csv" icon={<FileSpreadsheet size={15} />} text={t.exportExcel} />
                    <ExportItem href={pdfHref} fileName="managed-users.pdf" icon={<FileText size={15} />} text={t.exportPdf} />
                    <ExportItem href={webHref} fileName="managed-users.html" icon={<FileText size={15} />} text={t.exportWeb} />
                    <PrintUsersButton html={printHtml} />
                  </div>
                </div>
              </div>

              <form className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_auto_auto]">
                <input type="hidden" name="lang" value={lang} />

                <div className="relative md:col-span-2 xl:col-span-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={rawQ}
                    placeholder={t.searchPlaceholder}
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-cyan-100 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-cyan-500/10"
                  />
                </div>

                <select name="degree" defaultValue={selectedDegree} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-cyan-100 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-cyan-500/10">
                  <option value="">{t.allDegree}</option>
                  {degreeOptions.map((degree) => <option key={degree} value={degree}>{degree}</option>)}
                </select>

                <select name="year" defaultValue={selectedYear} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-[#00BFC4] focus:ring-4 focus:ring-cyan-100 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-cyan-500/10">
                  <option value="">{t.allYear}</option>
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>

                <button className="h-10 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 text-xs font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] active:scale-95 md:col-span-1">
                  {t.filter}
                </button>

                <a href={`/admin/manage-users?lang=${lang}`} className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                  {t.reset}
                </a>
              </form>
            </div>

            <div className="hidden overflow-hidden rounded-[22px] border border-white/70 bg-white/90 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[940px] w-full border-collapse">
                  <thead className="bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white">
                    <tr>
                      <TableHead>{t.user}</TableHead>
                      <TableHead>{t.phone}</TableHead>
                      <TableHead>{t.degree}</TableHead>
                      <TableHead>{t.year}</TableHead>
                      <TableHead align="right">{t.actions}</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={String(user._id)} className="transition hover:bg-cyan-50/60 dark:hover:bg-slate-950">
                        <td className="px-4 py-2.5"><UserCell user={user} t={t} /></td>
                        <td className="px-4 py-2.5"><PhoneCell phone={getPhone(user, t)} /></td>
                        <td className="px-4 py-2.5"><Badge>{getDegree(user, t)}</Badge></td>
                        <td className="px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200">{getGraduatedYear(user, t)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end">
                            <form action={deleteUserAccount}>
                              <input type="hidden" name="id" value={String(user._id)} />
                              <button className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-500 hover:text-white active:scale-95 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
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
                <article key={String(user._id)} className="rounded-[20px] border border-white/70 bg-white/90 p-3 shadow-lg shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-900/90">
                  <UserCell user={user} t={t} />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MiniInfo label={t.phone} value={getPhone(user, t)} />
                    <MiniInfo label={t.degree} value={getDegree(user, t)} />
                    <MiniInfo label={t.year} value={getGraduatedYear(user, t)} />
                  </div>
                  <form action={deleteUserAccount} className="mt-3">
                    <input type="hidden" name="id" value={String(user._id)} />
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-500 hover:text-white">
                      <Trash2 size={14} />
                      {t.delete}
                    </button>
                  </form>
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

function ExportItem({ href, fileName, icon, text }: { href: string; fileName: string; icon: React.ReactNode; text: string }) {
  return (
    <a href={href} download={fileName} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-cyan-50 hover:text-[#008B8B] dark:text-slate-200 dark:hover:bg-slate-900">
      {icon}
      {text}
    </a>
  );
}

function TableHead({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"} text-[11px] font-black uppercase tracking-widest`}>
      {children}
    </th>
  );
}

function UserCell({ user, t }: { user: any; t: typeof text.en }) {
  const image = user.profileImage || user.image || user.googleImage || user.googleProfileImage || "/avatar.png";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Image src={image} alt={user.name || t.user} width={40} height={40} className="h-10 w-10 rounded-2xl border border-slate-100 bg-slate-50 object-cover dark:border-slate-800" />
      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white">{user.name || t.unknownUser}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Mail size={11} />
          <span className="line-clamp-1">{user.email || t.noEmail}</span>
        </p>
      </div>
    </div>
  );
}

function PhoneCell({ phone }: { phone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-[#008B8B] dark:bg-cyan-500/10 dark:text-cyan-200">
      <Phone size={12} />
      {phone}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-slate-950 dark:text-slate-300">{children}</span>;
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-2.5 dark:bg-slate-950">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xs font-black text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function EmptyUsers({ t }: { t: typeof text.en }) {
  return (
    <div className="p-8 text-center">
      <Users className="mx-auto h-9 w-9 text-slate-400" />
      <h2 className="mt-3 text-lg font-black">{t.noUsersFound}</h2>
      <p className="mt-1 text-xs font-bold text-slate-400">{t.noUsersText}</p>
    </div>
  );
}
