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
  web: string;
  export: string;
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
  return `${start} - ${end}`;
}

function getContact(job: JobPrintExportItem, labels: JobPrintExportLabels) {
  return cleanText(job.email) || cleanText(job.phone) || labels.notAvailable;
}

function tableRows(jobs: JobPrintExportItem[], labels: JobPrintExportLabels) {
  return [
    [
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
    ],
    ...jobs.map((job) => [
      job.position || labels.positionNotProvided,
      job.company || labels.companyNotProvided,
      job.employmentType || labels.notAvailable,
      job.location || labels.notAvailable,
      job.salary || labels.notAvailable,
      job.phone || labels.notAvailable,
      getContact(job, labels),
      getDuration(job, labels),
      job.userName || labels.notAvailable,
      job.isCurrent ? labels.current : labels.past,
    ]),
  ];
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

function exportCsv(jobs: JobPrintExportItem[], title: string, labels: JobPrintExportLabels) {
  const rows = [["Title", title], [], ...tableRows(jobs, labels)];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  downloadBlob(`\uFEFF${csv}`, "jobs.csv", "text/csv;charset=utf-8");
}

function exportHtmlDocument(
  jobs: JobPrintExportItem[],
  title: string,
  labels: JobPrintExportLabels,
  autoPrint = false,
) {
  const rows = jobs
    .map(
      (job) => `
        <tr>
          <td>${escapeHtml(job.position || labels.positionNotProvided)}</td>
          <td>${escapeHtml(job.company || labels.companyNotProvided)}</td>
          <td>${escapeHtml(job.employmentType || labels.notAvailable)}</td>
          <td>${escapeHtml(job.location || labels.notAvailable)}</td>
          <td>${escapeHtml(job.salary || labels.notAvailable)}</td>
          <td>${escapeHtml(job.phone || labels.notAvailable)}</td>
          <td>${escapeHtml(getContact(job, labels))}</td>
          <td>${escapeHtml(getDuration(job, labels))}</td>
          <td>${escapeHtml(job.userName || labels.notAvailable)}</td>
          <td>${escapeHtml(job.isCurrent ? labels.current : labels.past)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #f8fafc; padding: 20px; }
    .print-btn { margin: 0 0 12px; padding: 10px 16px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #25C9C8, #008B8B); color: #fff; font-weight: 900; cursor: pointer; }
    .sheet { overflow: hidden; border: 1px solid #cbd5e1; border-radius: 18px; background: #fff; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
    .hero { padding: 18px 20px; color: #fff; background: linear-gradient(135deg, #25C9C8, #008B8B); }
    h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 900; }
    .meta { margin-top: 5px; color: #d9fffb; font-size: 12px; font-weight: 800; }
    .table-wrap { padding: 14px; background: #fff; overflow-x: auto; }
    table { width: 100%; min-width: 1020px; border-collapse: collapse; background: #fff; border: 1px solid #cbd5e1; }
    th, td { border: 1px solid #cbd5e1; padding: 9px; text-align: left; font-size: 12px; vertical-align: top; }
    th { background: #e6fffb !important; color: #0f766e; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
    td { color: #0f172a; font-weight: 700; }
    tr:nth-child(even) td { background: #f8fafc !important; }
    @media print {
      body { background: #fff; padding: 0; }
      .print-btn { display: none !important; }
      .sheet { border-radius: 0; box-shadow: none; }
      .table-wrap { padding: 0; overflow: visible; }
      table { min-width: 0; }
      th, td { padding: 7px; font-size: 10.5px; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.focus(); window.print();">${escapeHtml(labels.print)}</button>
  <div class="sheet">
    <div class="hero">
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">${jobs.length} ${escapeHtml(labels.job)} • Alumni Network Admin Export</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(labels.job)}</th>
            <th>${escapeHtml(labels.company)}</th>
            <th>${escapeHtml(labels.type)}</th>
            <th>${escapeHtml(labels.location)}</th>
            <th>${escapeHtml(labels.salary)}</th>
            <th>${escapeHtml(labels.phone)}</th>
            <th>${escapeHtml(labels.contact)}</th>
            <th>${escapeHtml(labels.duration)}</th>
            <th>${escapeHtml(labels.alumni)}</th>
            <th>${escapeHtml(labels.status)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
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

function exportWeb(jobs: JobPrintExportItem[], title: string, labels: JobPrintExportLabels) {
  downloadBlob(
    exportHtmlDocument(jobs, title, labels, false),
    "jobs.html",
    "text/html;charset=utf-8",
  );
}

function printJobs(jobs: JobPrintExportItem[], title: string, labels: JobPrintExportLabels) {
  const html = exportHtmlDocument(jobs, title, labels, true);
  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    alert("Please allow pop-ups to print this report.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function pdfEscape(value: unknown) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 180);
}

function truncatePdfText(value: unknown, max = 20) {
  const textValue = String(value ?? "").replace(/\s+/g, " ").trim();
  return textValue.length > max
    ? `${textValue.slice(0, Math.max(0, max - 1))}…`
    : textValue;
}

function exportPdf(jobs: JobPrintExportItem[], title: string, labels: JobPrintExportLabels) {
  const allRows = tableRows(jobs, labels);
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 26;
  const tableX = margin;
  const tableTop = 508;
  const rowHeight = 24;
  const colWidths = [96, 88, 64, 72, 62, 70, 92, 86, 80, 50];
  const rowsPerPage = 18;
  const pages: string[] = [];

  for (let start = 0; start < allRows.length; start += rowsPerPage) {
    const rows = allRows.slice(start, start + rowsPerPage);
    const commands: string[] = [];

    const rect = (x: number, y: number, w: number, h: number, rgb: [number, number, number]) => {
      commands.push(`q ${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x} ${y} ${w} ${h} re f Q`);
    };

    const strokeRect = (x: number, y: number, w: number, h: number) => {
      commands.push(`q 0.8 0.84 0.9 RG 0.7 w ${x} ${y} ${w} ${h} re S Q`);
    };

    const textAt = (
      x: number,
      y: number,
      value: unknown,
      size = 7.5,
      color: [number, number, number] = [0.08, 0.1, 0.16],
    ) => {
      commands.push(
        "BT",
        `${color[0]} ${color[1]} ${color[2]} rg`,
        `/F1 ${size} Tf`,
        `${x} ${y} Td`,
        `(${pdfEscape(value)}) Tj`,
        "ET",
      );
    };

    rect(0, 0, pageWidth, pageHeight, [0.97, 0.98, 0.99]);
    rect(margin, 544, pageWidth - margin * 2, 34, [0, 0.55, 0.55]);
    textAt(margin + 14, 557, title, 18, [1, 1, 1]);
    textAt(pageWidth - 160, 559, `${jobs.length} ${labels.job}`, 9, [0.85, 1, 1]);

    let y = tableTop;
    rows.forEach((row, rowIndex) => {
      const isHeader = start === 0 && rowIndex === 0;
      const fill: [number, number, number] = isHeader
        ? [0.9, 1, 0.98]
        : rowIndex % 2 === 0
          ? [1, 1, 1]
          : [0.97, 0.98, 0.99];

      let x = tableX;
      colWidths.forEach((width, colIndex) => {
        rect(x, y, width, rowHeight, fill);
        strokeRect(x, y, width, rowHeight);
        const maxChars = Math.max(6, Math.floor(width / 5.2));
        textAt(
          x + 4,
          y + 9,
          truncatePdfText(row[colIndex], maxChars),
          isHeader ? 7.2 : 6.7,
          isHeader ? [0, 0.46, 0.42] : [0.1, 0.12, 0.18],
        );
        x += width;
      });
      y -= rowHeight;
    });

    textAt(margin, 18, `Page ${pages.length + 1}`, 8, [0.38, 0.44, 0.52]);
    pages.push(commands.join("\n"));
  }

  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };

  const fontObject = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  pages.forEach((content) => {
    const contentId = addObject(
      `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
    );
    contentObjectIds.push(contentId);
    const pageId = addObject("");
    pageObjectIds.push(pageId);
  });

  const pagesObject = addObject("");
  const catalogObject = addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);

  pageObjectIds.forEach((pageId, index) => {
    objects[pageId - 1] =
      `<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`;
  });

  objects[pagesObject - 1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  downloadBlob(pdf, "jobs.pdf", "application/pdf");
}

function ExportButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-3 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ExportMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-black text-slate-700 transition hover:bg-cyan-50 hover:text-[#008B8B]"
    >
      {icon}
      {label}
    </button>
  );
}

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
    <div className="relative z-50 flex w-full flex-wrap items-center gap-2 overflow-visible sm:justify-end xl:w-auto">
      <ExportButton
        icon={<FileSpreadsheet size={15} />}
        label={labels.excel}
        onClick={() => exportCsv(jobs, title, labels)}
      />
      <ExportButton
        icon={<FileText size={15} />}
        label={labels.pdf}
        onClick={() => exportPdf(jobs, title, labels)}
      />
      <ExportButton
        icon={<Printer size={15} />}
        label={labels.print}
        onClick={() => printJobs(jobs, title, labels)}
      />
      <ExportButton
        icon={<Download size={15} />}
        label={labels.web}
        onClick={() => exportWeb(jobs, title, labels)}
      />

      <details className="group relative z-[90] overflow-visible">
        <summary className="inline-flex h-9 flex-none cursor-pointer list-none items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-3 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md [&::-webkit-details-marker]:hidden">
          {labels.export}
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>

        <div className="absolute left-0 top-full z-[999] mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl sm:left-auto sm:right-0">
          <ExportMenuItem
            icon={<FileSpreadsheet size={15} />}
            label={labels.excel}
            onClick={() => exportCsv(jobs, title, labels)}
          />
          <ExportMenuItem
            icon={<FileText size={15} />}
            label={labels.pdf}
            onClick={() => exportPdf(jobs, title, labels)}
          />
          <ExportMenuItem
            icon={<Printer size={15} />}
            label={labels.print}
            onClick={() => printJobs(jobs, title, labels)}
          />
          <ExportMenuItem
            icon={<Download size={15} />}
            label={labels.web}
            onClick={() => exportWeb(jobs, title, labels)}
          />
        </div>
      </details>
    </div>
  );
}
