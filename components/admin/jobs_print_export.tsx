// file: components/admin/jobs_print_export.tsx
"use client";

import type React from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";

export type JobPrintExportItem = {
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
  userName?: string;
  userEmail?: string;
};

export type JobPrintExportLabels = {
  job: string;
  company: string;
  type: string;
  location: string;
  salary: string;
  phone: string;
  contact: string;
  duration: string;
  alumni: string;
  status: string;
  current: string;
  past: string;
  positionNotProvided: string;
  companyNotProvided: string;
  notAvailable: string;
  excel: string;
  pdf: string;
  print: string;
  export: string;
  unknownAlumni: string;
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

function getDuration(job: JobPrintExportItem, labels: JobPrintExportLabels) {
  const start = cleanText(job.startDate) || labels.notAvailable;
  const end = job.isCurrent
    ? labels.current
    : cleanText(job.endDate) || labels.notAvailable;
  return `${start} to ${end}`;
}

function getContact(job: JobPrintExportItem, labels: JobPrintExportLabels) {
  return cleanText(job.email) || cleanText(job.phone) || labels.notAvailable;
}

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

// SHARED HTML TEMPLATE MATCHING THE EXACT PRINT STYLE WITH LOGO
function generateFullReportHtml(
  jobs: JobPrintExportItem[],
  title: string,
  labels: JobPrintExportLabels,
  autoPrint = false
) {
  const totalJobs = jobs.length;
  const internships = jobs.filter((j) =>
    j.employmentType?.toLowerCase().includes("internship")
  ).length;
  const current = jobs.filter((j) => j.isCurrent).length;
  const past = totalJobs - current;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = jobs
    .map(
      (job, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(job.position || labels.positionNotProvided)}</td>
          <td>${escapeHtml(job.company || labels.companyNotProvided)}</td>
          <td>${escapeHtml(job.employmentType || labels.notAvailable)}</td>
          <td>${escapeHtml(job.location || labels.notAvailable)}</td>
          <td>${escapeHtml(job.salary || labels.notAvailable)}</td>
          <td>${escapeHtml(job.phone || labels.notAvailable)}</td>
          <td>${escapeHtml(getContact(job, labels))}</td>
          <td>${escapeHtml(getDuration(job, labels))}</td>
          <td>${escapeHtml(job.userName || labels.unknownAlumni)}</td>
          <td class="center">
            <span class="badge ${job.isCurrent ? "badge-current" : "badge-past"}">
              ${escapeHtml(job.isCurrent ? labels.current : labels.past)}
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
      font-size: 24px;
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
    .badge-past {
      color: #0284c7;
      border: 1px solid #0284c7;
      background: #f0f9ff;
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
        size: landscape; 
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
      <h3>JOBS REPORT</h3>
      <div class="header-meta">
        Report Generated Date: ${dateStr} | Time: ${timeStr}
      </div>
    </div>
  </div>

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

  <div class="footer">
    <span>Alumni Network</span>
    <span>Official Report • For Administrative Use Only</span>
  </div>

  ${
    autoPrint
      ? `<script>
          window.addEventListener("load", function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 650);
          });
        </script>`
      : ""
  }
</body>
</html>`;
}

// 1. EXCEL EXPORT (CSV format)
export function exportCsv(
  jobs: JobPrintExportItem[],
  title: string,
  labels: JobPrintExportLabels
) {
  const headers = [
    "#",
    labels.job,
    labels.company,
    labels.type,
    labels.location,
    labels.salary,
    labels.phone,
    labels.contact,
    labels.duration,
    labels.alumni,
    labels.status,
  ];
  const bodyRows = jobs.map((job, index) => [
    index + 1,
    job.position || labels.positionNotProvided,
    job.company || labels.companyNotProvided,
    job.employmentType || labels.notAvailable,
    job.location || labels.notAvailable,
    job.salary || labels.notAvailable,
    job.phone || labels.notAvailable,
    getContact(job, labels),
    getDuration(job, labels),
    job.userName || labels.unknownAlumni,
    job.isCurrent ? labels.current : labels.past,
  ]);

  const csv = [headers, ...bodyRows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  downloadBlob(`\uFEFF${csv}`, "jobs-report.csv", "text/csv;charset=utf-8");
}

// 2. PRINT EXPORT (Opens new browser window for printing)
export function printJobs(
  jobs: JobPrintExportItem[],
  title: string,
  labels: JobPrintExportLabels
) {
  const html = generateFullReportHtml(jobs, title, labels, true);
  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    alert("Please allow pop-ups to print this report.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

// 3. PDF DOWNLOAD EXPORT (Triggers direct download of structured HTML/PDF file)
export function exportPdf(
  jobs: JobPrintExportItem[],
  title: string,
  labels: JobPrintExportLabels
) {
  const html = generateFullReportHtml(jobs, title, labels, false);
  downloadBlob(html, "jobs-report.html", "text/html;charset=utf-8");
}

// DROPDOWN COMPONENT
export default function JobsPrintExport({
  jobs,
  title,
  labels,
}: {
  jobs: JobPrintExportItem[];
  title: string;
  labels: JobPrintExportLabels;
}) {
  return (
    <details className="group relative z-[200] inline-flex overflow-visible">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden">
        <Download size={15} />
        {labels.export}
        <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
      </summary>

      <div className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-400/40 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/50 max-[420px]:left-0 max-[420px]:right-auto">
        <button
          type="button"
          onClick={() => exportCsv(jobs, title, labels)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
        >
          <FileSpreadsheet size={16} />
          {labels.excel}
        </button>

        <button
          type="button"
          onClick={() => exportPdf(jobs, title, labels)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
        >
          <FileText size={16} />
          {labels.pdf}
        </button>

        <button
          type="button"
          onClick={() => printJobs(jobs, title, labels)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
        >
          <Printer size={16} />
          {labels.print}
        </button>
      </div>
    </details>
  );
}