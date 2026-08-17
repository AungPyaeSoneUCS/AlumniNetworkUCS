// file: app/admin/jobs/page.tsx

import type React from "react";
import { Buffer } from "node:buffer";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Printer,
  Search,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";

type Lang = "en" | "mm";

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
  description?: string;
};

type JobItem = Experience & {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  userDepartment?: string;
  userGraduatedYear?: number | null;
};

const text = {
  en: {
    title: "Jobs Management",
    subtitle: "Jobs are collected from alumni profile experience data.",
    searchPlaceholder: "Search position, company, location, alumni...",
    allCompanies: "All Companies",
    allLocations: "All Locations",
    allTypes: "All Types",
    allStatus: "All Status",
    current: "Current",
    past: "Past",
    job: "Job",
    company: "Company",
    type: "Type",
    location: "Location",
    salary: "Salary",
    contact: "Contact",
    phone: "Phone",
    duration: "Duration",
    alumni: "Alumni",
    status: "Status",
    reset: "Reset",
    noJobs: "No Jobs Found",
    noJobsText: "Alumni job experience data will appear here.",
    unknownAlumni: "Unknown Alumni",
    positionNotProvided: "Position not provided",
    companyNotProvided: "Company not provided",
    notAvailable: "N/A",
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    export: "Export",
    exportTitle: "Jobs Export",
  },
  mm: {
    title: "အလုပ်အကိုင်များ စီမံရန်",
    subtitle:
      "Alumni profile experience data မှ အလုပ်အကိုင်အချက်အလက်များကို ပြထားသည်။",
    searchPlaceholder: "ရာထူး၊ ကုမ္ပဏီ၊ နေရာ၊ alumni နာမည် ဖြင့် ရှာရန်...",
    allCompanies: "ကုမ္ပဏီ အားလုံး",
    allLocations: "နေရာ အားလုံး",
    allTypes: "အမျိုးအစား အားလုံး",
    allStatus: "အခြေအနေ အားလုံး",
    current: "လက်ရှိ",
    past: "ပြီးဆုံး",
    job: "အလုပ်အကိုင်",
    company: "ကုမ္ပဏီ",
    type: "အမျိုးအစား",
    location: "နေရာ",
    salary: "လစာ",
    contact: "ဆက်သွယ်ရန်",
    phone: "ဖုန်း",
    duration: "ကာလ",
    alumni: "Alumni",
    status: "အခြေအနေ",
    reset: "Reset",
    noJobs: "အလုပ်အကိုင် မတွေ့ပါ",
    noJobsText: "Alumni experience data ရှိလာပါက ဒီနေရာတွင် ပြပါမည်။",
    unknownAlumni: "အမည်မရှိသော Alumni",
    positionNotProvided: "ရာထူး မထည့်ထားပါ",
    companyNotProvided: "ကုမ္ပဏီ မထည့်ထားပါ",
    notAvailable: "မရှိပါ",
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    export: "Export",
    exportTitle: "အလုပ်အကိုင် စာရင်း Export",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function getDuration(job: Experience, t: typeof text.en) {
  const start = cleanText(job.startDate) || t.notAvailable;
  const end = job.isCurrent
    ? t.current
    : cleanText(job.endDate) || t.notAvailable;
  return `${start} - ${end}`;
}

function getContact(job: Experience, t: typeof text.en) {
  return cleanText(job.email) || cleanText(job.phone) || t.notAvailable;
}

function exportRows(jobs: JobItem[], title: string, t: typeof text.en) {
  return [
    ["Title", title],
    [],
    [
      t.job,
      t.company,
      t.type,
      t.location,
      t.salary,
      t.phone,
      t.contact,
      t.duration,
      t.alumni,
      t.status,
    ],
    ...jobs.map((job) => [
      job.position || t.positionNotProvided,
      job.company || t.companyNotProvided,
      job.employmentType || t.notAvailable,
      job.location || t.notAvailable,
      job.salary || t.notAvailable,
      job.phone || t.notAvailable,
      getContact(job, t),
      getDuration(job, t),
      job.userName,
      job.isCurrent ? t.current : t.past,
    ]),
  ];
}

function csvDataUrl(jobs: JobItem[], title: string, t: typeof text.en) {
  const csv = exportRows(jobs, title, t)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
}

function exportHtml(
  jobs: JobItem[],
  title: string,
  t: typeof text.en,
  autoPrint = false,
) {
  const rows =
    jobs
      .map(
        (job, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(job.position || t.positionNotProvided)}</td>
            <td>${escapeHtml(job.company || t.companyNotProvided)}</td>
            <td>${escapeHtml(job.employmentType || t.notAvailable)}</td>
            <td>${escapeHtml(job.location || t.notAvailable)}</td>
            <td>${escapeHtml(job.salary || t.notAvailable)}</td>
            <td>${escapeHtml(job.phone || t.notAvailable)}</td>
            <td>${escapeHtml(getContact(job, t))}</td>
            <td>${escapeHtml(getDuration(job, t))}</td>
            <td>${escapeHtml(job.userName)}</td>
            <td>${escapeHtml(job.isCurrent ? t.current : t.past)}</td>
          </tr>`,
      )
      .join("") ||
    `<tr><td colspan="11" class="empty">${escapeHtml(t.noJobs)}</td></tr>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page{size:A4 landscape;margin:12mm}
    *{box-sizing:border-box}
    body{margin:0;background:#eef2f7;color:#0f172a;font-family:Arial,Helvetica,sans-serif;padding:20px}
    .sheet{overflow:hidden;border:1px solid #cbd5e1;border-radius:18px;background:#fff;box-shadow:0 14px 35px rgba(15,23,42,.08)}
    .hero{background:linear-gradient(135deg,#25C9C8,#008B8B);color:#fff;padding:18px 20px}
    .hero h1{margin:0;font-size:24px;font-weight:900}
    .hero p{margin:5px 0 0;font-size:12px;font-weight:700;opacity:.9}
    .content{padding:16px;overflow-x:auto}
    table{width:100%;border-collapse:collapse;min-width:1120px}
    th,td{border:1px solid #dbeafe;padding:9px 10px;text-align:left;vertical-align:top;font-size:12px}
    th{background:#e6fffb;color:#0f766e;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
    tr:nth-child(even) td{background:#f8fafc}
    .empty{text-align:center;font-weight:900;color:#64748b;padding:24px}
    .print-btn{margin:0 0 12px;border:0;border-radius:12px;background:linear-gradient(135deg,#25C9C8,#008B8B);color:#fff;padding:10px 16px;font-weight:900;cursor:pointer}
    @media print{
      body{background:#fff;padding:0}
      .sheet{border:0;border-radius:0;box-shadow:none}
      .content{padding:10px;overflow:visible}
      .no-print{display:none!important}
      th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .hero{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>
  <section class="sheet">
    <div class="hero">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(jobs.length)} ${escapeHtml(t.job)}</p>
    </div>
    <div class="content">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>${escapeHtml(t.job)}</th>
            <th>${escapeHtml(t.company)}</th>
            <th>${escapeHtml(t.type)}</th>
            <th>${escapeHtml(t.location)}</th>
            <th>${escapeHtml(t.salary)}</th>
            <th>${escapeHtml(t.phone)}</th>
            <th>${escapeHtml(t.contact)}</th>
            <th>${escapeHtml(t.duration)}</th>
            <th>${escapeHtml(t.alumni)}</th>
            <th>${escapeHtml(t.status)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>
  ${
    autoPrint
      ? `<script>
          window.addEventListener("load", () => {
            setTimeout(() => window.print(), 350);
          });
        </script>`
      : ""
  }
</body>
</html>`;
}

function htmlDataUrl(
  jobs: JobItem[],
  title: string,
  t: typeof text.en,
  autoPrint = false,
) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    exportHtml(jobs, title, t, autoPrint),
  )}`;
}

function pdfEscape(value: unknown) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function makePdfDataUrl(jobs: JobItem[], title: string, t: typeof text.en) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 34;
  const lineHeight = 13;
  const rows = exportRows(jobs, title, t).filter((row) => row.length > 0);
  const lines: string[] = [];

  rows.forEach((row, index) => {
    if (index === 0) return;
    const line = row
      .map((cell) => String(cell ?? "").replace(/\s+/g, " ").trim())
      .join(" | ");
    const chunks = line.match(/.{1,150}(\s|$)/g) || [line];
    chunks.forEach((chunk) => lines.push(chunk.trim()));
    lines.push("");
  });

  const pages: string[] = [];
  let y = pageHeight - margin;
  let content = `0.93 0.98 0.98 rg\n0 ${pageHeight - 70} ${pageWidth} 70 re f\n0 0.55 0.55 rg\nBT /F1 20 Tf ${margin} ${pageHeight - 42} Td (${pdfEscape(title)}) Tj ET\n0 0 0 rg\n`;

  lines.forEach((line) => {
    if (y < margin) {
      pages.push(content);
      y = pageHeight - margin;
      content = "";
    }

    content += `BT /F1 8 Tf ${margin} ${y} Td (${pdfEscape(line)}) Tj ET\n`;
    y -= lineHeight;
  });

  pages.push(content || `BT /F1 12 Tf ${margin} ${y} Td (${pdfEscape(t.noJobs)}) Tj ET\n`);

  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };

  const fontObject = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  );
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  pages.forEach((pageContent) => {
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(pageContent, "binary")} >>\nstream\n${pageContent}\nendstream`,
    );
    contentObjectIds.push(contentId);
    const pageId = addObject("");
    pageObjectIds.push(pageId);
  });

  const pagesObject = addObject("");
  const catalogObject = addObject(
    `<< /Type /Catalog /Pages ${pagesObject} 0 R >>`,
  );

  pageObjectIds.forEach((pageId, index) => {
    objects[pageId - 1] =
      `<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`;
  });

  objects[pagesObject - 1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${Buffer.from(pdf, "binary").toString("base64")}`;
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{
        q?: string;
        company?: string;
        location?: string;
        type?: string;
        status?: string;
        lang?: Lang;
      }>
    | {
        q?: string;
        company?: string;
        location?: string;
        type?: string;
        status?: string;
        lang?: Lang;
      };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const rawQ = cleanText(resolvedSearchParams.q);
  const q = rawQ.toLowerCase();
  const selectedCompany = cleanText(resolvedSearchParams.company);
  const selectedLocation = cleanText(resolvedSearchParams.location);
  const selectedType = cleanText(resolvedSearchParams.type);
  const selectedStatus = cleanText(resolvedSearchParams.status);
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const users: any[] = await User.find({})
    .sort({ createdAt: -1 })
    .select(
      "_id name email image profileImage googleImage role department degree graduatedYear experiences",
    )
    .lean();

  const normalUsers = users.filter((user) => user.role !== "admin");

  const jobs: JobItem[] = normalUsers.flatMap((user) =>
    Array.isArray(user.experiences)
      ? user.experiences
          .filter(
            (job: Experience) =>
              job.company ||
              job.position ||
              job.employmentType ||
              job.location ||
              job.salary ||
              job.email ||
              job.phone ||
              job.website,
          )
          .map((job: Experience) => ({
            ...job,
            userId: String(user._id),
            userName: user.name || t.unknownAlumni,
            userEmail: user.email || "",
            userImage:
              user.profileImage || user.image || user.googleImage || "",
            userDepartment: user.degree || user.department || "",
            userGraduatedYear: user.graduatedYear || null,
          }))
      : [],
  );

  const companyOptions = Array.from(
    new Set(jobs.map((job) => cleanText(job.company)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const locationOptions = Array.from(
    new Set(jobs.map((job) => cleanText(job.location)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const typeOptions = Array.from(
    new Set(jobs.map((job) => cleanText(job.employmentType)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const filteredJobs = jobs.filter((job) => {
    const status = job.isCurrent ? "current" : "past";

    const searchable = [
      job.position,
      job.company,
      job.employmentType,
      job.location,
      job.salary,
      job.email,
      job.phone,
      job.userName,
      job.userEmail,
      job.userDepartment,
    ]
      .map((value) => cleanText(value).toLowerCase())
      .join(" ");

    return (
      (!q || searchable.includes(q)) &&
      (!selectedCompany || job.company === selectedCompany) &&
      (!selectedLocation || job.location === selectedLocation) &&
      (!selectedType || job.employmentType === selectedType) &&
      (!selectedStatus || status === selectedStatus)
    );
  });

  const excelHref = csvDataUrl(filteredJobs, t.exportTitle, t);
  const pdfHref = makePdfDataUrl(filteredJobs, t.exportTitle, t);
  const printHref = htmlDataUrl(filteredJobs, t.exportTitle, t, true);
  const webHref = htmlDataUrl(filteredJobs, t.exportTitle, t, false);

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar active="jobs" lang={lang} />

        <section className="min-w-0 flex-1 px-3 pb-5 pt-16 sm:px-4 md:px-5 lg:px-6 lg:pt-5">
          <div className="mx-auto max-w-7xl space-y-3">
            <div className="relative z-30 overflow-visible rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                    {t.title}
                  </h1>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.subtitle}
                  </p>
                </div>

                <div className="relative z-50 flex w-full flex-wrap items-center gap-2 overflow-visible sm:justify-end xl:w-auto">
                  <ExportButton
                    href={excelHref}
                    fileName="jobs.csv"
                    icon={<FileSpreadsheet size={15} />}
                    label={t.excel}
                  />
                  <ExportButton
                    href={pdfHref}
                    fileName="jobs.pdf"
                    icon={<FileText size={15} />}
                    label={t.pdf}
                  />
                  <ExportButton
                    href={printHref}
                    icon={<Printer size={15} />}
                    label={t.print}
                    newTab
                  />
                  <ExportButton
                    href={webHref}
                    fileName="jobs.html"
                    icon={<Download size={15} />}
                    label={t.web}
                  />

                  <details className="group relative z-[90] overflow-visible">
                    <summary className="inline-flex h-9 flex-none cursor-pointer list-none items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-3 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md [&::-webkit-details-marker]:hidden">
                      {t.export}
                      <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                    </summary>

                    <div className="absolute left-0 top-full z-[999] mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl sm:left-auto sm:right-0">
                      <ExportMenuItem
                        href={excelHref}
                        fileName="jobs.csv"
                        icon={<FileSpreadsheet size={15} />}
                        label={t.excel}
                      />
                      <ExportMenuItem
                        href={pdfHref}
                        fileName="jobs.pdf"
                        icon={<FileText size={15} />}
                        label={t.pdf}
                      />
                      <ExportMenuItem
                        href={printHref}
                        icon={<Printer size={15} />}
                        label={t.print}
                        newTab
                      />
                      <ExportMenuItem
                        href={webHref}
                        fileName="jobs.html"
                        icon={<Download size={15} />}
                        label={t.web}
                      />
                    </div>
                  </details>
                </div>
              </div>

              <form
                id="jobs-auto-filter-form"
                action="/admin/jobs"
                className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]"
              >
                <input type="hidden" name="lang" value={lang} />

                <div className="relative sm:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={rawQ}
                    placeholder={t.searchPlaceholder}
                    data-auto-filter="true"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15"
                  />
                </div>

                <SelectBox name="company" defaultValue={selectedCompany}>
                  <option value="">{t.allCompanies}</option>
                  {companyOptions.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </SelectBox>

                <SelectBox name="location" defaultValue={selectedLocation}>
                  <option value="">{t.allLocations}</option>
                  {locationOptions.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </SelectBox>

                <SelectBox name="type" defaultValue={selectedType}>
                  <option value="">{t.allTypes}</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </SelectBox>

                <SelectBox name="status" defaultValue={selectedStatus}>
                  <option value="">{t.allStatus}</option>
                  <option value="current">{t.current}</option>
                  <option value="past">{t.past}</option>
                </SelectBox>

                <Link
                  href={`/admin/jobs?lang=${lang}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-[#00BFC4] hover:bg-cyan-50 sm:col-span-2 xl:col-span-1"
                >
                  {t.reset}
                </Link>
              </form>

              <AutoFilterScript />
            </div>

            <div className="hidden overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="border-b border-slate-100 px-3 py-2 sm:px-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {filteredJobs.length} {t.job}
                </p>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="min-w-[1060px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead>{t.job}</TableHead>
                      <TableHead>{t.company}</TableHead>
                      <TableHead>{t.type}</TableHead>
                      <TableHead>{t.location}</TableHead>
                      <TableHead>{t.salary}</TableHead>
                      <TableHead>{t.phone}</TableHead>
                      <TableHead>{t.duration}</TableHead>
                      <TableHead>{t.alumni}</TableHead>
                      <TableHead>{t.status}</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredJobs.map((job, index) => (
                      <tr
                        key={`${job.userId}-${index}`}
                        className="transition hover:bg-cyan-50/40"
                      >
                        <td className="px-4 py-3">
                          <h3 className="line-clamp-1 text-sm font-black text-slate-900">
                            {job.position || t.positionNotProvided}
                          </h3>
                          <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-slate-400">
                            {job.description || job.website || t.notAvailable}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <Badge>{job.company || t.companyNotProvided}</Badge>
                        </td>

                        <td className="px-4 py-3">
                          <Badge>{job.employmentType || t.notAvailable}</Badge>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600">
                            <MapPin size={14} />
                            {job.location || t.notAvailable}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm font-black text-slate-700">
                          {job.salary || t.notAvailable}
                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-slate-600">
                          {job.phone || t.notAvailable}
                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-slate-600">
                          {getDuration(job, t)}
                        </td>

                        <td className="px-4 py-3">
                          <UserCell job={job} t={t} />
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge current={Boolean(job.isCurrent)} t={t} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredJobs.length === 0 && <EmptyJobs t={t} />}
            </div>

            <div className="grid gap-2 lg:hidden">
              {filteredJobs.map((job, index) => (
                <article
                  key={`${job.userId}-mobile-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 text-base font-black text-slate-900">
                        {job.position || t.positionNotProvided}
                      </h3>
                      <p className="mt-0.5 text-xs font-bold text-slate-400">
                        {job.company || t.companyNotProvided}
                      </p>
                    </div>

                    <StatusBadge current={Boolean(job.isCurrent)} t={t} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MiniInfo
                      label={t.type}
                      value={job.employmentType || t.notAvailable}
                    />
                    <MiniInfo
                      label={t.location}
                      value={job.location || t.notAvailable}
                    />
                    <MiniInfo
                      label={t.salary}
                      value={job.salary || t.notAvailable}
                    />
                    <MiniInfo
                      label={t.phone}
                      value={job.phone || t.notAvailable}
                    />
                    <MiniInfo label={t.duration} value={getDuration(job, t)} />
                    <MiniInfo label={t.contact} value={getContact(job, t)} />
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-2">
                    <UserCell job={job} t={t} />
                  </div>
                </article>
              ))}

              {filteredJobs.length === 0 && <EmptyJobs t={t} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AutoFilterScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (() => {
            const form = document.getElementById("jobs-auto-filter-form");
            if (!form) return;

            let timer = null;

            const submitForm = () => {
              if (typeof form.requestSubmit === "function") {
                form.requestSubmit();
              } else {
                form.submit();
              }
            };

            form.querySelectorAll("select").forEach((el) => {
              el.addEventListener("change", submitForm);
            });

            form.querySelectorAll("[data-auto-filter='true']").forEach((el) => {
              el.addEventListener("input", () => {
                clearTimeout(timer);
                timer = setTimeout(submitForm, 450);
              });
            });
          })();
        `,
      }}
    />
  );
}

function SelectBox({
  name,
  defaultValue,
  children,
}: {
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15"
    >
      {children}
    </select>
  );
}

function ExportButton({
  href,
  fileName,
  icon,
  label,
  newTab,
}: {
  href: string;
  fileName?: string;
  icon: React.ReactNode;
  label: string;
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      download={fileName}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className="inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-3 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function ExportMenuItem({
  href,
  fileName,
  icon,
  label,
  newTab,
}: {
  href: string;
  fileName?: string;
  icon: React.ReactNode;
  label: string;
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      download={fileName}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-cyan-50 hover:text-[#008B8B]"
    >
      {icon}
      {label}
    </a>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      } text-[11px] font-black uppercase tracking-widest text-slate-400`}
    >
      {children}
    </th>
  );
}

function UserCell({ job, t }: { job: JobItem; t: typeof text.en }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Image
        src={job.userImage || "/avatar.png"}
        alt={job.userName || t.unknownAlumni}
        width={36}
        height={36}
        className="h-9 w-9 rounded-xl bg-slate-100 object-cover"
      />

      <div className="min-w-0">
        <h4 className="line-clamp-1 text-sm font-black text-slate-900">
          {job.userName || t.unknownAlumni}
        </h4>

        <p className="line-clamp-1 text-xs font-semibold text-slate-400">
          {job.userDepartment || "Alumni"}
          {job.userGraduatedYear ? ` • ${job.userGraduatedYear}` : ""}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ current, t }: { current: boolean; t: typeof text.en }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ${
        current
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {current ? t.current : t.past}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 line-clamp-2 text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function EmptyJobs({ t }: { t: typeof text.en }) {
  return (
    <div className="p-8 text-center">
      <Briefcase className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-3 text-lg font-black text-slate-900">{t.noJobs}</h2>
      <p className="mt-1 text-sm font-bold text-slate-400">{t.noJobsText}</p>
    </div>
  );
}
