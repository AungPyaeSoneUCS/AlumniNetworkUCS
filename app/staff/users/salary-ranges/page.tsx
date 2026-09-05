// file: app/staff/users/salary-ranges/page.tsx

import type React from "react";
import Script from "next/script";
import { redirect } from "next/navigation";
import { BarChart3, ChevronDown, Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffSidebar from "@/components/staff/staff-sidebar";
import { SalaryRangesFilters } from "@/components/admin/report-auto-filters";

type Lang = "en" | "mm";

type SalaryItem = {
  position: string;
  minSalary: number;
  maxSalary: number;
};

/*
  Vertical Graph Design Settings
*/
const MIN_BAR_COLOR = "#f4762d";
const MAX_BAR_COLOR = "#35ea25";
const BAR_MAX_WIDTH = 450; // Max pixel width for 100% scale
const BAR_HEIGHT = 16;     // Height of individual horizontal bars

const text = {
  en: {
    title: "Income Range by Position",
    title2: "Income Range ",
    anyExperience: "All Job Types",
    reset: "Reset",
    salary: "Income",
    position: "Job Title",
    position2: "Graduates by Job Title",
    min: "Min",
    max: "Max",
    minSalary: "Min Income",
    maxSalary: "Max Income",
    noData: "No income and position data found.",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print Report",
    exportTitle: "Income Range Export Report",
    pdfLoading: "Creating PDF...",
    pdfError: "PDF export failed. Please try again.",
  },
  mm: {
    title: "အလုပ်အမျိုးအစား အလိုက် ဝင်ငွေ",
    title2: " ဝင်ငွေ ",
    anyExperience: "အလုပ်အမျိုးအစားအားလုံး",
    reset: "ပြန်ရှင်းမည်",
    salary: "ဝင်ငွေ",
    position: "အလုပ်ရာထူး",
    position2: "အလုပ်ရာထူးအလိုက် ဘွဲ့ရဦးရေ",
    min: "အနိမ့်",
    max: "အမြင့်",
    minSalary: "အနိမ့်ဆုံးဝင်ငွေ",
    maxSalary: "အမြင့်ဆုံးဝင်ငွေ",
    noData: "ဝင်ငွေနှင့် ရာထူးဒေတာ မတွေ့ပါ။",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print ထုတ်ရန်",
    exportTitle: "ဝင်ငွေ Range Report",
    pdfLoading: "PDF ပြုလုပ်နေသည်...",
    pdfError: "PDF export မအောင်မြင်ပါ။ ထပ်စမ်းကြည့်ပါ။",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseSalaryRange(value: unknown): {
  minSalary: number;
  maxSalary: number;
} {
  if (typeof value === "number") {
    return { minSalary: value, maxSalary: value };
  }

  const textValue = cleanText(value);
  if (!textValue) return { minSalary: 0, maxSalary: 0 };

  const numbers =
    textValue
      .match(/\d[\d,]*/g)
      ?.map((num) => Number(num.replace(/,/g, "")))
      .filter((num) => Number.isFinite(num) && num > 0) || [];

  if (numbers.length === 0) return { minSalary: 0, maxSalary: 0 };
  if (numbers.length === 1) {
    return { minSalary: numbers[0], maxSalary: numbers[0] };
  }

  return {
    minSalary: Math.min(...numbers),
    maxSalary: Math.max(...numbers),
  };
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

function buildCsv(items: SalaryItem[], t: typeof text.en) {
  const rows = [
    [t.position, t.minSalary, t.maxSalary],
    ...items.map((item) => [
      item.position,
      String(item.minSalary),
      String(item.maxSalary),
    ]),
  ];

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

// buildHtml now accepts `isPdf` flag to change styles solely for PDF export, leaving print unharmed
function buildHtml(
  items: SalaryItem[],
  title: string,
  t: typeof text.en,
  firstChunkSize: number,
  subsequentChunkSize: number,
  isPdf: boolean
) {
  const globalMax = Math.max(...items.map((item) => item.maxSalary), 1);
  const totalPositions = items.length;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Increased spacing strictly for PDF
  const vChartGap = isPdf ? "32px" : "16px";
  const vRowGap = isPdf ? "12px" : "4px";

  // SPLITTING LOGIC FOR GRAPHS ONLY
  const graphChunks: SalaryItem[][] = [];
  if (items.length > 0) {
    graphChunks.push(items.slice(0, firstChunkSize));
    let remaining = items.slice(firstChunkSize);
    while (remaining.length > 0) {
      graphChunks.push(remaining.slice(0, subsequentChunkSize));
      remaining = remaining.slice(subsequentChunkSize);
    }
  }

  const pagesHtml = graphChunks
    .map((chunk, index) => {
      const graphRows = chunk
        .map((item) => {
          const minW = Math.max((item.minSalary / globalMax) * BAR_MAX_WIDTH, item.minSalary ? 6 : 2);
          const maxW = Math.max((item.maxSalary / globalMax) * BAR_MAX_WIDTH, item.maxSalary ? 6 : 2);

          return `<div class="v-row">
            <div class="v-label">${escapeHtml(item.position)}</div>
            <div class="v-bars-wrapper">
              <div class="v-bar-line">
                <div class="v-bar" style="width:${minW}px;background:${MIN_BAR_COLOR}"></div>
                <span class="v-val">${escapeHtml(item.minSalary.toLocaleString())}</span>
              </div>
              <div class="v-bar-line">
                <div class="v-bar" style="width:${maxW}px;background:${MAX_BAR_COLOR}"></div>
                <span class="v-val">${escapeHtml(item.maxSalary.toLocaleString())}</span>
              </div>
            </div>
          </div>`;
        })
        .join("");
        
      const chunkHtml = `<div class="v-chart">${graphRows}</div>`;

      // If it's the very first page, we wrap it with the header and summaries
      if (index === 0) {
        return `
          <div class="page">
            <div class="report-header">
              <img src="/logo.png" alt="UCSH Logo" class="logo-placeholder" onerror="this.style.display='none'">
              <div class="header-text">
                <h1>University of Computer Studies (Hinthada)</h1>
                <h2>Alumni Network</h2>
                <h3> REPORT OF ${escapeHtml(title).toUpperCase()} </h3>
                <div class="header-meta">
                  Generated Date: ${dateStr} | Time: ${timeStr}
                </div>
              </div>
            </div>

            <div class="summary-container">
              <div class="summary-card">
                <div class="card-icon" style="background: #0f766e;">💼</div>
                <div class="card-info">
                  <p>Total Job Titles</p>
                  <h4>${totalPositions}</h4>
                </div>
              </div>
              <div class="summary-card">
                <div class="card-icon orange">💰</div>
                <div class="card-info">
                  <p>Min Income Indicator</p>
                  <h4 style="font-size: 14px; margin-top:6px;">${escapeHtml(t.minSalary)}</h4>
                </div>
              </div>
              <div class="summary-card">
                <div class="card-icon green">📈</div>
                <div class="card-info">
                  <p>Max Income Indicator</p>
                  <h4 style="font-size: 14px; margin-top:6px;">${escapeHtml(t.maxSalary)}</h4>
                </div>
              </div>
            </div>

            <div class="legend">
              <span><i class="dot" style="background:${MIN_BAR_COLOR}"></i>${escapeHtml(t.minSalary)}</span>
              <span><i class="dot" style="background:${MAX_BAR_COLOR}"></i>${escapeHtml(t.maxSalary)}</span>
            </div>

            ${chunkHtml}
            ${isPdf ? '<div class="footer"><span>Alumni Network</span><span>Official Administrative Report</span></div>' : ''}
          </div>
        `;
      }

      // For subsequent pages
      return `
        <div class="page" style="${!isPdf ? 'page-break-before: always; margin-top: 20px;' : ''}">
          ${chunkHtml}
          ${isPdf ? '<div class="footer" style="margin-top:20px;"><span>Alumni Network</span><span>Official Administrative Report</span></div>' : ''}
        </div>
      `;
    })
    .join("");

  // TABLE GENERATION
  let tablePagesHtml = "";
  if (isPdf) {
    // For PDF: Split into strict page containers (Max 25 rows per page)
    const TABLE_ROWS_PER_PAGE = 25;
    const tableChunks: SalaryItem[][] = [];
    if (items.length > 0) {
      let remainingTableRows = items;
      while (remainingTableRows.length > 0) {
        tableChunks.push(remainingTableRows.slice(0, TABLE_ROWS_PER_PAGE));
        remainingTableRows = remainingTableRows.slice(TABLE_ROWS_PER_PAGE);
      }
    }

    tablePagesHtml = tableChunks.map((chunk) => {
      const rows = chunk.map((item) => `<tr>
          <td>${escapeHtml(item.position)}</td>
          <td>${escapeHtml(item.minSalary.toLocaleString())}</td>
          <td>${escapeHtml(item.maxSalary.toLocaleString())}</td>
        </tr>`).join("");

      return `
        <div class="page">
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">${escapeHtml(t.position)}</th>
                <th>${escapeHtml(t.minSalary)}</th>
                <th>${escapeHtml(t.maxSalary)}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer" style="margin-top:25px;"><span>Alumni Network</span><span>Official Administrative Report</span></div>
        </div>
      `;
    }).join("");
  } else {
    // For Print: One continuous table (native print handles breaks beautifully)
    const tableRows = items.map((item) => `<tr>
        <td>${escapeHtml(item.position)}</td>
        <td>${escapeHtml(item.minSalary.toLocaleString())}</td>
        <td>${escapeHtml(item.maxSalary.toLocaleString())}</td>
      </tr>`).join("");

    tablePagesHtml = items.length > 0 ? `
      <div class="page" style="margin-top: 30px; page-break-before: always;">
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">${escapeHtml(t.position)}</th>
              <th>${escapeHtml(t.minSalary)}</th>
              <th>${escapeHtml(t.maxSalary)}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    ` : "";
  }

  // Inject different base CSS for PDF canvas rendering vs Printing
  const pageStyle = isPdf ? `
    body { background: #e2e8f0; margin: 0; padding: 0; }
    .page {
      width: 1240px;
      min-height: 1754px; /* A4 aspect ratio height to prevent arbitrary clipping */
      background: #fff;
      margin: 0 auto 20px auto;
      padding: 60px;
      box-sizing: border-box;
      position: relative;
    }
  ` : `
    body { margin: 0; padding: 20px 40px; }
    .page { page-break-after: auto; }
  `;

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
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: var(--text-main);
    background: #fff;
  }

  ${pageStyle}

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
  .card-icon.orange { background: #f4762d; }
  .card-icon.green { background: #35ea25; }
  
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

  .legend {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    font-size: 12px;
    font-weight: bold;
    color: var(--text-muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
  }

  /* Vertical graph styles */
  .v-chart {
    display: flex;
    flex-direction: column;
    gap: ${vChartGap};
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 25px;
  }
  .v-row {
    display: flex;
    flex-direction: column;
    gap: ${vRowGap};
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .v-label {
    font-size: 14px;
    font-weight: 900;
    color: var(--text-main);
  }
  .v-bars-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .v-bar-line {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .v-bar {
    height: ${BAR_HEIGHT}px;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .v-val {
    font-size: 12px;
    font-weight: 900;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 10px 14px;
    font-size: 12px;
    text-align: left;
  }
  th {
    background: var(--primary);
    color: white;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 11px;
  }
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #cbd5e1;
    padding-top: 10px;
    font-size: 10px;
    color: var(--text-muted);
    page-break-inside: avoid;
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
    .page {
      width: 100% !important;
      min-height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
    }
  }
</style>
</head>
<body>

  ${pagesHtml}
  
  ${tablePagesHtml}

  ${!isPdf ? '<div class="footer"><span>Alumni Network</span><span>Official Administrative Report</span></div>' : ''}

</body>
</html>`;
}

export default async function StaffSalaryRangesPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ experience?: string; lang?: Lang }>
    | { experience?: string; lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedExperience = cleanText(resolvedSearchParams.experience);
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

  const allUsers: any[] = await User.find({})
    .sort({ createdAt: -1 })
    .select("_id role experiences")
    .lean();

  // Only consider standard alumni users for metrics
  const users = allUsers.filter((user) => user.role === "user");

  const experienceOptionsSet = new Set<string>();
  const salaryMap = new Map<string, { minSalary: number; maxSalary: number }>();

  users.forEach((user) => {
    if (!Array.isArray(user.experiences)) return;

    user.experiences.forEach((exp: any) => {
      const position =
        cleanText(exp?.position || exp?.title || exp?.employmentType) ||
        "Unknown";

      const { minSalary, maxSalary } = parseSalaryRange(exp?.salary);

      if (!position || position === "Unknown" || maxSalary <= 0) return;

      experienceOptionsSet.add(position);

      if (selectedExperience && position !== selectedExperience) return;

      const old = salaryMap.get(position);

      salaryMap.set(position, {
        minSalary: old ? Math.min(old.minSalary, minSalary) : minSalary,
        maxSalary: old ? Math.max(old.maxSalary, maxSalary) : maxSalary,
      });
    });
  });

  const salaryItems: SalaryItem[] = Array.from(salaryMap.entries())
    .map(([position, data]) => ({
      position,
      minSalary: data.minSalary,
      maxSalary: data.maxSalary,
    }))
    .sort(
      (a, b) =>
        b.maxSalary - a.maxSalary || a.position.localeCompare(b.position),
    );

  const experienceOptions = Array.from(experienceOptionsSet).sort((a, b) =>
    a.localeCompare(b),
  );

  const title = selectedExperience
    ? `${selectedExperience} ${t.title2}`
    : t.title;

  const csv = buildCsv(salaryItems, t);
  
  // Create TWO distinct versions: 
  // Print handles its own pagination natively, chunking is 5/10.
  const printHtml = buildHtml(salaryItems, title, t, 5, 10, false);
  // PDF is strictly customized to slice perfectly at 10 items on page 1, and 15 items on subpages.
  const pdfHtml = buildHtml(salaryItems, title, t, 10, 15, true);
  
  const maxSalaryValue = Math.max(...salaryItems.map((item) => item.maxSalary), 1);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <StaffSidebar active="users-salary-ranges" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            {/* Top Control Header Box */}
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {title}
                  </h1>
                </div>

                <div className="relative z-50 flex w-full flex-wrap items-center gap-2 overflow-visible xl:w-auto xl:justify-end">
                  <details className="group relative z-[200] inline-flex overflow-visible">
                    <summary
                      id="salary-export-toggle"
                      className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden"
                    >
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>

                    <div
                      id="salary-export-menu"
                      className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-400/40 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/50 max-[420px]:left-0 max-[420px]:right-auto"
                    >
                      <ExportBtn action="excel">
                        <FileSpreadsheet size={16} className="text-emerald-500 dark:text-emerald-400" />
                        {t.excel}
                      </ExportBtn>
                      <ExportBtn action="pdf">
                        <FileText size={16} className="text-red-500 dark:text-red-400" />
                        {t.pdf}
                      </ExportBtn>
                      <ExportBtn action="print">
                        <Printer size={16} />
                        {t.print}
                      </ExportBtn>
                    </div>
                  </details>
                </div>
              </div>

              <div className="mt-4">
                <SalaryRangesFilters
                  lang={lang}
                  experience={selectedExperience}
                  experienceOptions={experienceOptions}
                  labels={{ anyExperience: t.anyExperience, reset: t.reset }}
                />
              </div>

              <AutoScripts
                csv={csv}
                pdfHtml={pdfHtml}
                printHtml={printHtml}
                title={t.exportTitle}
                pdfLoading={t.pdfLoading}
                pdfError={t.pdfError}
              />
            </div>

            {/* Vertical Bar Chart Container */}
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/60 sm:px-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                   {t.position2} - {salaryItems.length}
                </p>
              </div>

              {salaryItems.length === 0 ? (
                <EmptyGraph text={t.noData} />
              ) : (
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="mb-6 flex flex-wrap gap-6 text-xs font-black text-slate-600 dark:text-slate-300">
                    <Legend color={MIN_BAR_COLOR} label={t.minSalary} />
                    <Legend color={MAX_BAR_COLOR} label={t.maxSalary} />
                  </div>

                  <div className="flex flex-col gap-5 rounded-[28px] bg-slate-50 p-5 dark:bg-slate-950 sm:p-6">
                    {salaryItems.map((item) => {
                      const minWidth = Math.max(
                        (item.minSalary / maxSalaryValue) * BAR_MAX_WIDTH,
                        item.minSalary ? 8 : 2,
                      );
                      const maxWidth = Math.max(
                        (item.maxSalary / maxSalaryValue) * BAR_MAX_WIDTH,
                        item.maxSalary ? 8 : 2,
                      );

                      return (
                        <div key={item.position} className="flex flex-col gap-2.5 border-b border-slate-200/60 pb-5 last:border-0 dark:border-slate-800/60">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {item.position}
                          </p>

                          <div className="flex flex-col gap-2 pl-2 sm:pl-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-6 rounded-r-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                                style={{
                                  width: `${minWidth}px`,
                                  backgroundColor: MIN_BAR_COLOR,
                                  boxShadow: `0 4px 12px -2px ${MIN_BAR_COLOR}44`,
                                }}
                              />
                              <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                {item.minSalary.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div
                                className="h-6 rounded-r-lg shadow-md transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                                style={{
                                  width: `${maxWidth}px`,
                                  backgroundColor: MAX_BAR_COLOR,
                                  boxShadow: `0 4px 12px -2px ${MAX_BAR_COLOR}44`,
                                }}
                              />
                              <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                {item.maxSalary.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Data Table */}
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[460px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80">
                    <tr>
                      <TableHead>{t.position}</TableHead>
                      <TableHead>{t.minSalary}</TableHead>
                      <TableHead>{t.maxSalary}</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {salaryItems.map((item) => (
                      <tr key={item.position} className="transition hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10">
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                          {item.position}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                          {item.minSalary.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                          {item.maxSalary.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {salaryItems.length === 0 && <EmptyGraph text={t.noData} />}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ExportBtn({
  action,
  children,
}: {
  action: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-export-action={action}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
    >
      {children}
    </button>
  );
}

function AutoScripts({
  csv,
  pdfHtml,
  printHtml,
  title,
  pdfLoading,
  pdfError,
}: {
  csv: string;
  pdfHtml: string;
  printHtml: string;
  title: string;
  pdfLoading: string;
  pdfError: string;
}) {
  return (
    <Script id="salary-export-script" strategy="afterInteractive">
      {`
        (() => {
          const toggle = document.getElementById("salary-export-toggle");
          const menu = document.getElementById("salary-export-menu");

          const csvData = ${JSON.stringify(csv)};
          const pdfHtmlData = ${JSON.stringify(pdfHtml)};
          const printHtmlData = ${JSON.stringify(printHtml)};
          const fileTitle = ${JSON.stringify(title)};
          const pdfLoadingText = ${JSON.stringify(pdfLoading)};
          const pdfErrorText = ${JSON.stringify(pdfError)};

          const safeName = fileTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "export";

          const downloadFile = (content, type, filename) => {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          };

          const loadScriptOnce = (src) => {
            return new Promise((resolve, reject) => {
              const old = document.querySelector("script[src='" + src + "']");
              if (old) {
                resolve();
                return;
              }

              const script = document.createElement("script");
              script.src = src;
              script.async = true;
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          };

          const downloadPdfFile = async () => {
            const originalHtml = toggle ? toggle.innerHTML : "";

            try {
              if (toggle) {
                toggle.innerHTML = pdfLoadingText;
                toggle.style.pointerEvents = "none";
                toggle.style.opacity = "0.7";
              }

              await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
              await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

              const iframe = document.createElement("iframe");
              iframe.style.position = "fixed";
              iframe.style.left = "-99999px";
              iframe.style.top = "0";
              iframe.style.width = "1240px";
              iframe.style.height = "2000px";
              iframe.style.border = "0";
              document.body.appendChild(iframe);

              const doc = iframe.contentDocument || iframe.contentWindow.document;
              doc.open();
              doc.write(pdfHtmlData);
              doc.close();

              // Wait heavily for internal rendering
              await new Promise((resolve) => setTimeout(resolve, 800));

              const jsPDF = window.jspdf.jsPDF;
              const pdf = new jsPDF("p", "mm", "a4");
              const pdfWidth = pdf.internal.pageSize.getWidth();
              
              // We grab all our pre-formatted explicit chunks
              const pages = Array.from(doc.querySelectorAll('.page'));

              if (pages.length > 0) {
                 for (let i = 0; i < pages.length; i++) {
                   if (i > 0) pdf.addPage();
                   
                   const pageEl = pages[i];
                   
                   const canvas = await window.html2canvas(pageEl, {
                     scale: 2,
                     backgroundColor: "#ffffff",
                     useCORS: true,
                     logging: false,
                     windowWidth: 1240, 
                   });
                   
                   const imgData = canvas.toDataURL("image/png");
                   const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                   
                   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
                 }
              }

              pdf.save(safeName + ".pdf");
              iframe.remove();
            } catch (error) {
              console.error(error);
              alert(pdfErrorText);
            } finally {
              if (toggle) {
                toggle.innerHTML = originalHtml;
                toggle.style.pointerEvents = "auto";
                toggle.style.opacity = "1";
              }
            }
          };

          const openPrintWindow = () => {
            const win = window.open("", "_blank");
            if (!win) return;
            win.document.open();
            win.document.write(printHtmlData);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
          };

          if (toggle && menu && toggle.dataset.ready !== "1") {
            toggle.dataset.ready = "1";

            document.addEventListener("click", (event) => {
              const details = toggle.closest("details");
              if (details && !details.contains(event.target)) {
                details.removeAttribute("open");
              }
            });

            menu.querySelectorAll("[data-export-action]").forEach((btn) => {
              btn.addEventListener("click", (event) => {
                event.stopPropagation();
                
                const details = btn.closest("details");
                if (details) details.removeAttribute("open");

                const action = btn.getAttribute("data-export-action");

                if (action === "excel") {
                  downloadFile(csvData, "text/csv;charset=utf-8", safeName + ".csv");
                }

                if (action === "pdf") {
                  downloadPdfFile();
                }

                if (action === "print") {
                  openPrintWindow();
                }
              });
            });
          }
        })();
      `}
    </Script>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {children}
    </th>
  );
}

function EmptyGraph({ text }: { text: string }) {
  return (
    <div className="p-10 text-center">
      <BarChart3 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{text}</h2>
    </div>
  );
}