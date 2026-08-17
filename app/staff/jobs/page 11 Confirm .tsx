// file: app/admin/jobs/page.tsx

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  MapPin,
  Search,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Globe2,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";
import PrintUsersButton from "@/components/admin/print-users-button";

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

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
    subtitle: " ",
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
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
  },
  mm: {
    title: "အလုပ်အကိုင်များ စီမံခန့်ခွဲမှု",
    subtitle: " ",
    searchPlaceholder: "ရာထူး၊ ကုမ္ပဏီ၊ နေရာ၊ ကျောင်းသားအမည်ဖြင့် ရှာရန်...",
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
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    page: "စာမျက်နှာ",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getDuration(job: Experience, t: typeof text.en) {
  const start = cleanText(job.startDate) || t.notAvailable;
  const end = job.isCurrent ? t.current : cleanText(job.endDate) || t.notAvailable;
  return `${start} to  ${end}`;
}

function getContact(job: Experience, t: typeof text.en) {
  return cleanText(job.email) || cleanText(job.phone) || t.notAvailable;
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

// -------------------------------------------------------------
// EXPORT & DATA URL UTILITIES
// -------------------------------------------------------------
function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportRows(jobs: JobItem[], t: typeof text.en) {
  return [
    [t.alumni, t.job, t.company, t.type, t.location, t.salary, t.contact, t.duration, t.status],
    ...jobs.map((job) => [
      job.userName || t.unknownAlumni,
      job.position || t.positionNotProvided,
      job.company || t.companyNotProvided,
      job.employmentType || t.notAvailable,
      job.location || t.notAvailable,
      job.salary || t.notAvailable,
      getContact(job, t),
      getDuration(job, t),
      job.isCurrent ? t.current : t.past,
    ]),
  ];
}

function csvCell(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function csvDataUrl(jobs: JobItem[], t: typeof text.en) {
  const csv = exportRows(jobs, t)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
}

// CUSTOM PRINT EXPORT
function exportHtml(jobs: JobItem[], title: string, t: typeof text.en) {
  const totalJobs = jobs.length;
  const internships = jobs.filter((j) => j.employmentType?.toLowerCase().includes("internship")).length;
  const current = jobs.filter((j) => j.isCurrent).length;
  const past = totalJobs - current;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const rows = jobs
    .map(
      (job, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(job.position || t.positionNotProvided)}</td>
          <td>${escapeHtml(job.company || t.companyNotProvided)}</td>
          <td>${escapeHtml(job.employmentType || t.notAvailable)}</td>
          <td>${escapeHtml(job.location || t.notAvailable)}</td>
          <td>${escapeHtml(job.salary || t.notAvailable)}</td>
          <td>${escapeHtml(job.phone || t.notAvailable)}</td>
          <td>${escapeHtml(getContact(job, t))}</td>
          <td>${escapeHtml(getDuration(job, t))}</td>
          <td>${escapeHtml(job.userName || t.unknownAlumni)}</td>
          <td class="center">
            <span class="badge ${job.isCurrent ? "badge-current" : "badge-past"}">
              ${escapeHtml(job.isCurrent ? t.current : t.past)}
            </span>
          </td>
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
    
    /* Header Styles */
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

    /* Summary Cards */
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

    /* Table Styles */
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

    /* Badges */
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
    .badge-past {
      color: #0284c7;
      border: 1px solid #0284c7;
      background: #f0f9ff;
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      font-size: 10px;
      color: var(--text-muted);
    }

    /* Print Specific Styles */
    @media print {
      @page { 
        size: landscape; 
        margin: 0; /* Removes browser default headers/footers (time, URL, title) */
      }
      body { 
        padding: 15mm 15mm; /* Restore padding because margin is 0 */
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

  <!-- Header -->
  <div class="report-header">
    <img src="/logo.png" alt="UCSH Logo" class="logo-placeholder" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>University of Computer Studies (Hinthada)</h1>
      <h2>Alumni Network System</h2>
      <h3>JOBS REPORT</h3>
      <div class="header-meta">
        Report Generated Date: ${dateStr} | Time: ${timeStr}
      </div>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-container">
    <div class="summary-card">
      <div class="card-icon" style="background: #0f766e;">💼</div>
      <div class="card-info">
        <p>Total Jobs</p>
        <h4>${totalJobs}</h4>
        <p style="text-transform: none; font-weight: normal;">All Opportunities</p>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon blue">🎓</div>
      <div class="card-info">
        <p>Internships</p>
        <h4>${internships}</h4>
        <p style="text-transform: none; font-weight: normal;">Internship Programs</p>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon green">📅</div>
      <div class="card-info">
        <p>Current</p>
        <h4>${current}</h4>
        <p style="text-transform: none; font-weight: normal;">Active Opportunities</p>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon orange">⏱️</div>
      <div class="card-info">
        <p>Past</p>
        <h4>${past}</h4>
        <p style="text-transform: none; font-weight: normal;">Closed Opportunities</p>
      </div>
    </div>
  </div>

  <!-- Data Table -->
  <table>
    <thead>
      <tr>
        <th class="center">#</th>
        <th>JOB</th>
        <th>COMPANY</th>
        <th>TYPE</th>
        <th>LOCATION</th>
        <th>SALARY</th>
        <th>PHONE</th>
        <th>CONTACT</th>
        <th>DURATION</th>
        <th>ALUMNI</th>
        <th class="center">STATUS</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <span>Alumni Network System</span>
    <span>Official Report • For Administrative Use Only</span>
  </div>

</body>
</html>`;
}

function htmlDataUrl(jobs: JobItem[], title: string, t: typeof text.en) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(exportHtml(jobs, title, t))}`;
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

function pdfDataUrl(jobs: JobItem[], title: string, t: typeof text.en) {
  const pageWidth = 842; 
  const pageHeight = 595;
  const margin = 32;
  const tableTop = 492;
  const rowHeight = 24;
  
  const colWidths = [95, 105, 95, 75, 75, 65, 100, 110, 50]; 
  const maxChars =  [16, 18,  16, 13, 13, 11, 17,  19,  8];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

  const headerRow = [t.alumni, t.job, t.company, t.type, t.location, t.salary, t.contact, t.duration, t.status];

  const dataRows = jobs.map((job) => [
    job.userName || t.unknownAlumni,
    job.position || t.positionNotProvided,
    job.company || t.companyNotProvided,
    job.employmentType || t.notAvailable,
    job.location || t.notAvailable,
    job.salary || t.notAvailable,
    getContact(job, t),
    getDuration(job, t),
    job.isCurrent ? t.current : t.past,
  ]);

  const rowsPerPage = 17;
  const pages: string[][][] = [];

  for (let i = 0; i < dataRows.length; i += rowsPerPage) {
    pages.push([headerRow, ...dataRows.slice(i, i + rowsPerPage)]);
  }

  if (pages.length === 0) pages.push([headerRow]);

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
        `Total jobs: ${jobs.length}    Page ${pageIndex + 1} of ${
          pages.length
        }`,
      )}) Tj`,
      "ET",
    );

    commands.push("0.91 1 1 rg");
    commands.push(`${margin} ${tableTop - rowHeight} ${tableWidth} ${rowHeight} re f`);
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
        const charsLimit = maxChars[colIndex];

        commands.push(
          "BT",
          rowIndex === 0 ? "/F1 9 Tf" : "/F1 8 Tf",
          "0 0 0 rg",
          `${x} ${y} Td`,
          `(${pdfEscape(pdfText(cell, charsLimit))}) Tj`,
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
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`,
    );

    objects.push(
      `${contentObj} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  });

  objects.push(
    `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
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
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      }>
    | {
        q?: string;
        company?: string;
        location?: string;
        type?: string;
        status?: string;
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const rawQ = cleanText(resolvedSearchParams.q);
  const q = rawQ.toLowerCase();
  const selectedCompany = cleanText(resolvedSearchParams.company);
  const selectedLocation = cleanText(resolvedSearchParams.location);
  const selectedType = cleanText(resolvedSearchParams.type);
  const selectedStatus = cleanText(resolvedSearchParams.status);
  const sortKey = cleanText(resolvedSearchParams.sort);
  const sortDir = resolvedSearchParams.dir === "desc" ? "desc" : "asc";
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
            userImage: user.profileImage || user.image || user.googleImage || "",
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

  let filteredJobs = jobs.filter((job) => {
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

  // Sorting Handler
  if (sortKey) {
    filteredJobs = [...filteredJobs].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      if (sortKey === "job") {
        aVal = cleanText(a.position).toLowerCase();
        bVal = cleanText(b.position).toLowerCase();
      } else if (sortKey === "company") {
        aVal = cleanText(a.company).toLowerCase();
        bVal = cleanText(b.company).toLowerCase();
      } else if (sortKey === "type") {
        aVal = cleanText(a.employmentType).toLowerCase();
        bVal = cleanText(b.employmentType).toLowerCase();
      } else if (sortKey === "location") {
        aVal = cleanText(a.location).toLowerCase();
        bVal = cleanText(b.location).toLowerCase();
      } else if (sortKey === "salary") {
        aVal = cleanText(a.salary).toLowerCase();
        bVal = cleanText(b.salary).toLowerCase();
      } else if (sortKey === "phone") {
        aVal = cleanText(a.phone).toLowerCase();
        bVal = cleanText(b.phone).toLowerCase();
      } else if (sortKey === "duration") {
        aVal = cleanText(a.startDate).toLowerCase();
        bVal = cleanText(b.startDate).toLowerCase();
      } else if (sortKey === "alumni") {
        aVal = cleanText(a.userName).toLowerCase();
        bVal = cleanText(b.userName).toLowerCase();
      } else if (sortKey === "status") {
        aVal = a.isCurrent ? "1" : "0"; 
        bVal = b.isCurrent ? "1" : "0";
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Calculate Pagination Slices & Ranges
  const totalPages = Math.max(Math.ceil(filteredJobs.length / PAGE_SIZE), 1);
  const requestedPage = Number(resolvedSearchParams.page || "1");
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);

  const pageNumbers = getPagination(currentPage, totalPages);
  const showingStart = filteredJobs.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, filteredJobs.length);

  const makePageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (rawQ) params.set("q", rawQ);
    if (selectedCompany) params.set("company", selectedCompany);
    if (selectedLocation) params.set("location", selectedLocation);
    if (selectedType) params.set("type", selectedType);
    if (selectedStatus) params.set("status", selectedStatus);
    if (lang) params.set("lang", lang);
    if (sortKey) params.set("sort", sortKey);
    if (sortDir) params.set("dir", sortDir);
    params.set("page", String(pageNumber));
    return `/admin/jobs?${params.toString()}`;
  };

  const makeSortHref = (key: string) => {
    const params = new URLSearchParams();
    if (rawQ) params.set("q", rawQ);
    if (selectedCompany) params.set("company", selectedCompany);
    if (selectedLocation) params.set("location", selectedLocation);
    if (selectedType) params.set("type", selectedType);
    if (selectedStatus) params.set("status", selectedStatus);
    if (lang) params.set("lang", lang);
    params.set("page", "1");
    params.set("sort", key);
    params.set(
      "dir",
      sortKey === key && sortDir === "asc" ? "desc" : "asc",
    );
    return `/admin/jobs?${params.toString()}`;
  };

  const exportTitle = t.exportTitle;
  const excelHref = csvDataUrl(filteredJobs, t);
  const pdfHref = pdfDataUrl(filteredJobs, exportTitle, t);
  const webHref = htmlDataUrl(filteredJobs, exportTitle, t);
  
  // Custom generated print layout
  const printHtml = exportHtml(filteredJobs, exportTitle, t);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="jobs" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.title}
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.subtitle}
                  </p>
                </div>

                <div className="relative z-50 flex w-full flex-wrap items-center gap-2 overflow-visible xl:w-auto xl:justify-end">
                  <details className="group relative z-[200] inline-flex overflow-visible">
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden">
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>

                    <div className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-400/40 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/50 max-[420px]:left-0 max-[420px]:right-auto">
                      <ExportItem
                        href={excelHref}
                        fileName="jobs-export.csv"
                        icon={<FileSpreadsheet size={16} />}
                        text={t.excel}
                      />

                      <ExportItem
                        href={pdfHref}
                        fileName="jobs-export.pdf"
                        icon={<FileText size={16} />}
                        text={t.pdf}
                      />

                      <div className="flex [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-xl [&>button]:px-3 [&>button]:py-2.5 [&>button]:text-left [&>button]:text-sm [&>button]:font-black [&>button]:text-slate-700 [&>button]:transition-colors [&>button]:hover:bg-slate-100 dark:[&>button]:text-slate-200 dark:[&>button]:hover:bg-slate-700/50">
                        <PrintUsersButton html={printHtml} />
                      </div>

                      <ExportItem
                        href={webHref}
                        fileName="jobs-export.html"
                        icon={<Globe2 size={16} />}
                        text={t.web}
                      />
                    </div>
                  </details>
                </div>
              </div>

              <form
                id="jobs-auto-filter-form"
                className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]"
                action="/admin/jobs"
              >
                <input type="hidden" name="lang" value={lang} />
                {sortKey && <input type="hidden" name="sort" value={sortKey} />}
                {sortDir && <input type="hidden" name="dir" value={sortDir} />}

                <div className="relative sm:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    name="q"
                    defaultValue={rawQ}
                    placeholder={t.searchPlaceholder}
                    data-auto-filter="true"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-[#00BFC4]"
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
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700 transition hover:border-[#00BFC4] hover:bg-cyan-50 active:scale-95 sm:col-span-2 xl:col-span-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  {t.reset}
                </Link>
              </form>

              <AutoFilterScript />
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-visible rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 lg:block">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/60 sm:px-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {filteredJobs.length} {t.job}
                </p>
              </div>

              <div className="w-full overflow-x-auto rounded-b-2xl">
                <table className="w-full min-w-[1060px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80">
                    <tr>
                      <SortableTableHead
                        label={t.job}
                        sortKey="job"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.company}
                        sortKey="company"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.type}
                        sortKey="type"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.location}
                        sortKey="location"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.salary}
                        sortKey="salary"
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
                        label={t.duration}
                        sortKey="duration"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.alumni}
                        sortKey="alumni"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />
                      <SortableTableHead
                        label={t.status}
                        sortKey="status"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                        align="center"
                      />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedJobs.map((job, index) => (
                      <tr key={`${job.userId}-${index}`} className="transition hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10">
                        <td className="px-4 py-3.5">
                          <h3 className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white">
                            {job.position || t.positionNotProvided}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {job.description || job.website || t.notAvailable}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge>{job.company || t.companyNotProvided}</Badge>
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge>{job.employmentType || t.notAvailable}</Badge>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                            <MapPin size={14} className="dark:text-slate-400" />
                            {job.location || t.notAvailable}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-sm font-black text-slate-700 dark:text-slate-200">
                          {job.salary || t.notAvailable}
                        </td>

                        <td className="px-4 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {job.phone || t.notAvailable}
                        </td>

                        <td className="px-4 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {getDuration(job, t)}
                        </td>

                        <td className="px-4 py-3.5">
                          <UserCell job={job} t={t} />
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge current={Boolean(job.isCurrent)} t={t} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredJobs.length === 0 && <EmptyJobs t={t} />}
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 lg:hidden">
              {paginatedJobs.map((job, index) => (
                <article
                  key={`${job.userId}-mobile-${index}`}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 text-base font-black text-slate-900 dark:text-white">
                        {job.position || t.positionNotProvided}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500">
                        {job.company || t.companyNotProvided}
                      </p>
                    </div>

                    <StatusBadge current={Boolean(job.isCurrent)} t={t} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniInfo label={t.type} value={job.employmentType || t.notAvailable} />
                    <MiniInfo label={t.location} value={job.location || t.notAvailable} />
                    <MiniInfo label={t.salary} value={job.salary || t.notAvailable} />
                    <MiniInfo label={t.phone} value={job.phone || t.notAvailable} />
                    <MiniInfo label={t.duration} value={getDuration(job, t)} />
                    <MiniInfo label={t.contact} value={getContact(job, t)} />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <UserCell job={job} t={t} />
                  </div>
                </article>
              ))}

              {filteredJobs.length === 0 && <EmptyJobs t={t} />}
            </div>

            {/* Pagination Segment Embedded Legibly */}
            {filteredJobs.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageNumbers={pageNumbers}
                makePageHref={makePageHref}
                showingStart={showingStart}
                showingEnd={showingEnd}
                totalItems={filteredJobs.length}
                t={t}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AutoFilterScript() {
  return (
    <Script id="jobs-auto-filter-script" strategy="afterInteractive">
      {`
        (() => {
          const form = document.getElementById("jobs-auto-filter-form");
          if (!form || form.dataset.autoReady === "1") return;
          form.dataset.autoReady = "1";

          let timer = null;

          const submitForm = () => {
            const params = new URLSearchParams(new FormData(form));

            for (const key of Array.from(params.keys())) {
              if (!params.get(key)) params.delete(key);
            }

            const query = params.toString();
            const action = form.getAttribute("action") || "/admin/jobs";
            window.location.href = action + (query ? "?" + query : "");
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
      `}
    </Script>
  );
}

// Subcomponents definitions below 
function SortableTableHead({
  label,
  sortKey,
  currentSortKey,
  currentDir,
  makeSortHref,
  align = "left",
}: {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentDir: "asc" | "desc";
  makeSortHref: (key: string) => string;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentSortKey === sortKey;

  const alignClasses =
    align === "right"
      ? "text-right justify-end"
      : align === "center"
        ? "text-center justify-center"
        : "text-left justify-start";

  return (
    <th className={`px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}>
      <Link
        href={makeSortHref(sortKey)}
        className={`inline-flex w-full items-center gap-1.5 transition-colors hover:text-slate-800 dark:hover:text-slate-200 ${alignClasses}`}
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
      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-[#00BFC4]"
    >
      {children}
    </select>
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
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
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={`px-4 py-3.5 ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      } text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}
    >
      {children}
    </th>
  );
}

function UserCell({ job, t }: { job: JobItem; t: typeof text.en }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Image
        src={job.userImage || "/avatar.png"}
        alt={job.userName || t.unknownAlumni}
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-xl border border-slate-200/80 bg-slate-50 object-cover dark:border-slate-700/80 dark:bg-slate-900"
      />

      <div className="min-w-0">
        <h4 className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white">
          {job.userName || t.unknownAlumni}
        </h4>

        <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
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
      className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-[11px] font-black ${
        current 
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {current ? t.current : t.past}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/50">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-black text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function EmptyJobs({ t }: { t: typeof text.en }) {
  return (
    <div className="p-10 text-center">
      <Briefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{t.noJobs}</h2>
      <p className="mt-1 text-sm font-bold text-slate-400">{t.noJobsText}</p>
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