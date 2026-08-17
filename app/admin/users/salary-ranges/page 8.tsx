// file: app/admin/users/salary-ranges/page.tsx

import type React from "react";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { BarChart3, ChevronDown, Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";

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
    title: "Salary Range by Position",
    title2: "Salary Range ",
    anyExperience: "All Job Types",
    reset: "Reset",
    salary: "Salary",
    position: "Job Title",
    position2: "Graduates by Job Title",
    min: "Min",
    max: "Max",
    minSalary: "Min Salary",
    maxSalary: "Max Salary",
    noData: "No salary and position data found.",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print Report",
    exportTitle: "Salary Range Export Report",
    pdfLoading: "Creating PDF...",
    pdfError: "PDF export failed. Please try again.",
    pageGroup: "Chart Group",
  },
  mm: {
    title: "အလုပ်အမျိုးအစား အလိုက် လစာ",
    title2: " လစာ ",
    anyExperience: "အလုပ်အမျိုးအစားအားလုံး",
    reset: "ပြန်ရှင်းမည်",
    salary: "လစာ",
    position: "အလုပ်ရာထူး",
    position2: "အလုပ်ရာထူးအလိုက် ဘွဲ့ရဦးရေ",
    min: "အနိမ့်",
    max: "အမြင့်",
    minSalary: "အနိမ့်ဆုံးလစာ",
    maxSalary: "အမြင့်ဆုံးလစာ",
    noData: "လစာနှင့် ရာထူးဒေတာ မတွေ့ပါ။",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print ထုတ်ရန်",
    exportTitle: "လစာ Range Report",
    pdfLoading: "PDF ပြုလုပ်နေသည်...",
    pdfError: "PDF export မအောင်မြင်ပါ။ ထပ်စမ်းကြည့်ပါ။",
    pageGroup: "ဇယားအုပ်စု",
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

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function buildHtml(chunks: SalaryItem[][], title: string, t: typeof text.en) {
  const globalMax = Math.max(...chunks.flat().map((item) => item.maxSalary), 1);
  const totalPositions = chunks.flat().length;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const sectionsHtml = chunks
    .map((chunk, index) => {
      const chartHtml = chunk
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

      const tableHtml = chunk
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.position)}</td>
            <td>${escapeHtml(item.minSalary.toLocaleString())}</td>
            <td>${escapeHtml(item.maxSalary.toLocaleString())}</td>
          </tr>`,
        )
        .join("");

      return `<div class="section-block">
        ${chunks.length > 1 ? `<h3 class="group-title">${escapeHtml(t.pageGroup)} ${index + 1}</h3>` : ""}
        <div class="v-chart">${chartHtml}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">${escapeHtml(t.position)}</th>
              <th>${escapeHtml(t.minSalary)}</th>
              <th>${escapeHtml(t.maxSalary)}</th>
            </tr>
          </thead>
          <tbody>${tableHtml}</tbody>
        </table>
      </div>`;
    })
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
  * { box-sizing: border-box; }
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
    font-size: 14px;
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

  .section-block {
    margin-bottom: 30px;
    page-break-inside: avoid;
  }
  .group-title {
    font-size: 13px;
    color: var(--primary);
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-bottom: 10px;
    text-transform: uppercase;
    font-weight: 900;
  }

  /* Vertical graph styles */
  .v-chart {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 15px;
  }
  .v-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .v-label {
    font-size: 12px;
    font-weight: 900;
    color: var(--text-main);
  }
  .v-bars-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .v-bar-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .v-bar {
    height: ${BAR_HEIGHT}px;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .v-val {
    font-size: 10px;
    font-weight: 900;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
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

  .footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #cbd5e1;
    padding-top: 10px;
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 20px;
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
  }
</style>
</head>
<body>

  <div class="report-header">
    <img src="/logo.png" alt="UCSH Logo" class="logo-placeholder" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>University of Computer Studies (Hinthada)</h1>
      <h2>Alumni Network System</h2>
      <h3>${escapeHtml(title).toUpperCase()} REPORT</h3>
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
        <p>Min Salary Indicator</p>
        <h4 style="font-size: 14px; margin-top:6px;">${escapeHtml(t.minSalary)}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon green">📈</div>
      <div class="card-info">
        <p>Max Salary Indicator</p>
        <h4 style="font-size: 14px; margin-top:6px;">${escapeHtml(t.maxSalary)}</h4>
      </div>
    </div>
  </div>

  <div class="legend">
    <span><i class="dot" style="background:${MIN_BAR_COLOR}"></i>${escapeHtml(t.minSalary)}</span>
    <span><i class="dot" style="background:${MAX_BAR_COLOR}"></i>${escapeHtml(t.maxSalary)}</span>
  </div>

  ${sectionsHtml}

  <div class="footer">
    <span>Alumni Network System</span>
    <span>Official Administrative Report</span>
  </div>

</body>
</html>`;
}

export default async function AdminSalaryRangesPage({
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
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const allUsers: any[] = await User.find({})
    .sort({ createdAt: -1 })
    .select("_id role experiences")
    .lean();

  const users = allUsers.filter((user) => user.role !== "admin");

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

  // Split into chunks of maximum 5 job items per vertical graph view
  const salaryChunks = chunkArray(salaryItems, 5);

  const experienceOptions = Array.from(experienceOptionsSet).sort((a, b) =>
    a.localeCompare(b),
  );

  const title = selectedExperience
    ? `${selectedExperience} ${t.title2}`
    : t.title;

  const csv = buildCsv(salaryItems, t);
  const html = buildHtml(salaryChunks, title, t);
  const maxSalaryValue = Math.max(...salaryItems.map((item) => item.maxSalary), 1);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="users-salary-ranges" lang={lang} />

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

              <form
                id="salary-auto-filter-form"
                action="/admin/users/salary-ranges"
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
              >
                <input type="hidden" name="lang" value={lang} />

                <select
                  name="experience"
                  defaultValue={selectedExperience}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-[#00BFC4]"
                >
                  <option value="">{t.anyExperience}</option>
                  {experienceOptions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>

                <Link
                  href={`/admin/users/salary-ranges?lang=${lang}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700 transition-colors hover:border-[#00BFC4] hover:bg-cyan-50 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  {t.reset}
                </Link>
              </form>

              <AutoScripts
                csv={csv}
                html={html}
                title={t.exportTitle}
                pdfLoading={t.pdfLoading}
                pdfError={t.pdfError}
              />
            </div>

            {/* Render Vertical Chunk Cards (Max 5 items each) */}
            {salaryChunks.length === 0 ? (
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                <EmptyGraph text={t.noData} />
              </section>
            ) : (
              salaryChunks.map((chunk, groupIndex) => (
                <div key={groupIndex} className="space-y-4 md:space-y-6">
                  {salaryChunks.length > 1 && (
                    <div className="px-1">
                      <h2 className="text-sm font-black uppercase tracking-wider text-[#008B8B] dark:text-[#00BFC4]">
                        {t.pageGroup} {groupIndex + 1}
                      </h2>
                    </div>
                  )}

                  {/* Vertical Chart Container */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/60 sm:px-5">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                         {t.position2} - {chunk.length}
                      </p>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="mb-4 flex flex-wrap gap-4 text-[11px] font-black text-slate-600 dark:text-slate-300">
                        <Legend color={MIN_BAR_COLOR} label={t.minSalary} />
                        <Legend color={MAX_BAR_COLOR} label={t.maxSalary} />
                      </div>

                      <div className="flex flex-col gap-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-950/50">
                        {chunk.map((item) => {
                          const minWidth = Math.max(
                            (item.minSalary / maxSalaryValue) * 320,
                            item.minSalary ? 6 : 2,
                          );
                          const maxWidth = Math.max(
                            (item.maxSalary / maxSalaryValue) * 320,
                            item.maxSalary ? 6 : 2,
                          );

                          return (
                            <div key={item.position} className="flex flex-col gap-1.5">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {item.position}
                              </p>
                              
                              <div className="flex flex-col gap-1 pl-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-4 rounded-r-md shadow-sm transition-all duration-300 hover:brightness-110"
                                    style={{
                                      width: `${minWidth}px`,
                                      backgroundColor: MIN_BAR_COLOR,
                                    }}
                                  />
                                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                                    {item.minSalary.toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-4 rounded-r-md shadow-sm transition-all duration-300 hover:brightness-110"
                                    style={{
                                      width: `${maxWidth}px`,
                                      backgroundColor: MAX_BAR_COLOR,
                                    }}
                                  />
                                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                                    {item.maxSalary.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  {/* Data Table */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
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
                          {chunk.map((item) => (
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
                  </section>
                </div>
              ))
            )}

          </div>
        </section>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
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
  html,
  title,
  pdfLoading,
  pdfError,
}: {
  csv: string;
  html: string;
  title: string;
  pdfLoading: string;
  pdfError: string;
}) {
  return (
    <Script id="salary-export-script" strategy="afterInteractive">
      {`
        (() => {
          const form = document.getElementById("salary-auto-filter-form");
          const toggle = document.getElementById("salary-export-toggle");
          const menu = document.getElementById("salary-export-menu");

          const csvData = ${JSON.stringify(csv)};
          const htmlData = ${JSON.stringify(html)};
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
              iframe.style.height = "900px";
              iframe.style.border = "0";
              document.body.appendChild(iframe);

              const doc = iframe.contentDocument || iframe.contentWindow.document;
              doc.open();
              doc.write(htmlData);
              doc.close();

              await new Promise((resolve) => setTimeout(resolve, 700));

              const targetElement = doc.body;

              const canvas = await window.html2canvas(targetElement, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
                logging: false,
                windowWidth: 1240,
              });

              const imgData = canvas.toDataURL("image/png");
              const jsPDF = window.jspdf.jsPDF;

              const pdf = new jsPDF("p", "mm", "a4");
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();

              const imgWidth = pageWidth;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;

              let heightLeft = imgHeight;
              let position = 0;

              pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;

              while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
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
            win.document.write(htmlData);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
          };

          if (form && form.dataset.ready !== "1") {
            form.dataset.ready = "1";

            form.querySelectorAll("select").forEach((el) => {
              el.addEventListener("change", () => {
                const params = new URLSearchParams(new FormData(form));
                for (const key of Array.from(params.keys())) {
                  if (!params.get(key)) params.delete(key);
                }

                const query = params.toString();
                window.location.href =
                  "/admin/users/salary-ranges" + (query ? "?" + query : "");
              });
            });
          }

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