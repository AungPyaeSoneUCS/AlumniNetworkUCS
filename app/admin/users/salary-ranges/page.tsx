// file: app/admin/users/salary-ranges/page.tsx

import type React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";
import SalaryRangesExporter from "@/components/admin/salary-ranges-exporter";
import { SalaryRangesFilters } from "@/components/admin/report-auto-filters";

export const dynamic = "force-dynamic";

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
const BAR_WIDTH = 26;
const BAR_MAX_HEIGHT = 190;

// Max positions per graph block on export; more rows create additional blocks.
const GRAPH_MAX_ROWS = 5;

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

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
    minIncome: "Min Income",
    maxIncome: "Max Income",
    incomePlaceholder: "Income",
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
    minSalary: "ဝင်ငွေအနိမ့်ဆုံး",
    maxSalary: "ဝင်ငွေအမြင့်ဆုံး",
    minIncome: "အနည်းဆုံး ဝင်ငွေ",
    maxIncome: "အများဆုံး ဝင်ငွေ",
    incomePlaceholder: "ဝင်ငွေ",
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

// Build a single continuous print/PDF report: header, summary, legend,
// graph blocks (max 5 positions each), then the data table.
function buildHtml(items: SalaryItem[], title: string, t: typeof text.en) {
  const totalPositions = items.length;
  const globalMax = Math.max(...items.map((item) => item.maxSalary), 1);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const graphBlocks = chunkItems(items, GRAPH_MAX_ROWS)
    .filter((block) => block.length > 0)
    .map((block) => {
      const rowsHtml = block
        .map((item) => {
          const same = item.minSalary === item.maxSalary;
          const minH = Math.max((item.minSalary / globalMax) * BAR_MAX_HEIGHT, item.minSalary ? 8 : 4);
          const maxH = Math.max((item.maxSalary / globalMax) * BAR_MAX_HEIGHT, item.maxSalary ? 8 : 4);

          const minBar = !same
            ? `<div class="bar-box">
              <div class="value">${escapeHtml(item.minSalary.toLocaleString())}</div>
              <div class="bar" style="height:${minH}px;background:${MIN_BAR_COLOR}"></div>
            </div>`
            : `<div class="bar-box bar-box-empty"></div>`;

          return `<div class="year-group">
          <div class="bars">
            ${minBar}
            <div class="bar-box">
              <div class="value">${escapeHtml(item.maxSalary.toLocaleString())}</div>
              <div class="bar" style="height:${maxH}px;background:${MAX_BAR_COLOR}"></div>
            </div>
          </div>
          <div class="x-label">${escapeHtml(item.position)}</div>
        </div>`;
        })
        .join("");

      return `<div class="chart"><div class="bars-row">${rowsHtml}</div></div>`;
    })
    .join("");

  const tableRows = items
    .map((item) => `<tr>
      <td>${escapeHtml(item.position)}</td>
      <td>${escapeHtml(item.minSalary.toLocaleString())}</td>
      <td>${escapeHtml(item.maxSalary.toLocaleString())}</td>
    </tr>`)
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
  .header-text h1 { margin: 0; font-size: 22px; color: var(--text-main); }
  .header-text h2 { margin: 4px 0; font-size: 22px; color: var(--primary); font-weight: 600; }
  .header-text h3 { margin: 0; font-size: 18px; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; }
  .header-meta { margin-top: 6px; font-size: 11px; color: var(--text-muted); }

  .summary-container { display: flex; gap: 15px; margin-bottom: 20px; }
  .summary-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 15px; background: var(--bg-light); }
  .card-info p { margin: 0; font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; }
  .card-info h4 { margin: 2px 0 0 0; font-size: 20px; color: var(--text-main); }

  .legend {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    font-size: 12px;
    font-weight: bold;
    color: var(--text-muted);
  }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }

  .chart-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    margin-bottom: 40px;
  }
  .chart {
    position: relative;
    height: 360px;
    min-width: 620px;
    padding: 0 20px 0 44px;
  }
  .chart + .chart {
    margin-top: 30px;
  }
  .bars-row {
    position: relative;
    height: 360px;
    display: flex;
    gap: 40px;
    padding: 0 20px 0 44px;
  }
  .year-group {
    flex: 1;
    min-width: 96px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 0;
  }
  .bar-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
  }
  .value {
    font-size: 10px;
    font-weight: bold;
    margin-bottom: 4px;
    color: var(--text-main);
  }
  .bar {
    width: ${BAR_WIDTH}px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  .bar-box-empty {
    width: ${BAR_WIDTH}px;
  }
  .x-label {
    margin-top: 12px;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: var(--text-muted);
  }

  table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; text-align: left; }
  th { background: var(--primary); color: white; font-weight: bold; text-transform: uppercase; font-size: 10px; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  tr:nth-child(even) td { background: #f8fafc; }

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
    .chart-scroll { overflow: visible; }
    .chart { min-width: 100%; }
  }
</style>
</head>
<body>

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
      <div class="card-info">
        <p>Total Job Titles</p>
        <h4>${totalPositions}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-info">
        <p>Min Income Indicator</p>
        <h4 style="font-size: 14px; margin-top:6px;">${escapeHtml(t.minSalary)}</h4>
      </div>
    </div>
    <div class="summary-card">
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

  <div class="chart-scroll">
    ${graphBlocks}
  </div>

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

  <div class="footer">
    <span>Alumni Network</span>
    <span>Official Administrative Report</span>
  </div>

</body>
</html>`;
}

/*
  Standalone graph HTML used to render the chart as an image that gets
  embedded into the Excel export. Mirrors the on-page + print chart design.
*/
function buildGraphHtml(items: SalaryItem[], t: typeof text.en) {
  const globalMax = Math.max(...items.map((item) => item.maxSalary), 1);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Graph</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .graph { width: 1120px; padding: 20px; background: #ffffff; }
  .legend {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 700;
    color: #334155;
  }
  .legend span { display: inline-flex; align-items: center; gap: 8px; }
  .dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
  .chart-row { display: flex; align-items: flex-end; gap: 40px; padding: 0 8px; }
  .graph-block {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
  }
  .graph-block + .graph-block { margin-top: 44px; }
  .year-group { flex: 1; min-width: 96px; text-align: center; }
  .bars { display: flex; align-items: flex-end; justify-content: center; gap: 0; }
  .bar-box { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
  .value { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
  .bar { width: 38px; border-top-left-radius: 5px; border-top-right-radius: 5px; }
  .bar-box-empty { width: 38px; }
  .x-label { margin-top: 12px; font-size: 13px; font-weight: 700; color: #64748b; }
</style>
</head>
<body>
  <div class="graph">
    <div class="legend">
      <span><i class="dot" style="background:${MIN_BAR_COLOR}"></i>${escapeHtml(t.minSalary)}</span>
      <span><i class="dot" style="background:${MAX_BAR_COLOR}"></i>${escapeHtml(t.maxSalary)}</span>
    </div>
    ${chunkItems(items, GRAPH_MAX_ROWS)
      .filter((block) => block.length > 0)
      .map((block) => {
        const rowsHtml = block
          .map((item) => {
            const same = item.minSalary === item.maxSalary;
            const minH = Math.max((item.minSalary / globalMax) * 220, item.minSalary ? 10 : 4);
            const maxH = Math.max((item.maxSalary / globalMax) * 220, item.maxSalary ? 10 : 4);

            const minBar = !same
              ? `<div class="bar-box">
                <div class="value">${escapeHtml(item.minSalary.toLocaleString())}</div>
                <div class="bar" style="height:${minH}px;background:${MIN_BAR_COLOR}"></div>
              </div>`
              : `<div class="bar-box bar-box-empty"></div>`;

            return `<div class="year-group">
            <div class="bars">
              ${minBar}
              <div class="bar-box">
                <div class="value">${escapeHtml(item.maxSalary.toLocaleString())}</div>
                <div class="bar" style="height:${maxH}px;background:${MAX_BAR_COLOR}"></div>
              </div>
            </div>
            <div class="x-label">${escapeHtml(item.position)}</div>
          </div>`;
          })
          .join("");

        return `<div class="graph-block"><div class="chart-row">${rowsHtml}</div></div>`;
      })
      .join("")}
  </div>
</body>
</html>`;
}

export default async function AdminSalaryRangesPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ experience?: string; minIncome?: string; maxIncome?: string; lang?: Lang }>
    | { experience?: string; minIncome?: string; maxIncome?: string; lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedExperience = cleanText(resolvedSearchParams.experience);
  const minIncomeFilter = cleanText(resolvedSearchParams.minIncome);
  const maxIncomeFilter = cleanText(resolvedSearchParams.maxIncome);
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

  const minIncomeNum = Number(minIncomeFilter);
  const maxIncomeNum = Number(maxIncomeFilter);
  const hasMinFilter = Number.isFinite(minIncomeNum) && minIncomeNum > 0;
  const hasMaxFilter = Number.isFinite(maxIncomeNum) && maxIncomeNum > 0;

  const filteredSalaryItems =
    hasMinFilter || hasMaxFilter
      ? salaryItems.filter((item) => {
          const lower = hasMinFilter ? minIncomeNum : 0;
          const upper = hasMaxFilter ? maxIncomeNum : Number.POSITIVE_INFINITY;
          return item.maxSalary >= lower && item.minSalary <= upper;
        })
      : salaryItems;

  const experienceOptions = Array.from(experienceOptionsSet).sort((a, b) =>
    a.localeCompare(b),
  );

  const title = selectedExperience
    ? `${selectedExperience} ${t.title2}`
    : t.title;

  function positionHref(position: string) {
    const params = new URLSearchParams();
    params.set("experience", position);
    if (minIncomeFilter) params.set("minIncome", minIncomeFilter);
    if (maxIncomeFilter) params.set("maxIncome", maxIncomeFilter);
    if (lang === "mm") params.set("lang", "mm");
    return `?${params.toString()}`;
  }

  const csv = buildCsv(filteredSalaryItems, t);

  // Single continuous report used for both print and PDF: header, graph
  // blocks (max 5 rows each), then the data table.
  const html = buildHtml(filteredSalaryItems, title, t);
  const graphHtml = buildGraphHtml(filteredSalaryItems, t);

  const maxSalaryValue = Math.max(...filteredSalaryItems.map((item) => item.maxSalary), 1);

  const reportTotals = { positions: filteredSalaryItems.length };

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
                  <SalaryRangesExporter
                    toggleId="salary-export-toggle"
                    menuId="salary-export-menu"
                    csv={csv}
                    html={html}
                    title={t.exportTitle}
                    pdfLoading={t.pdfLoading}
                    pdfError={t.pdfError}
                    graphHtml={graphHtml}
                    rows={filteredSalaryItems}
                    totals={reportTotals}
                    labels={{ export: t.export, excel: t.excel, pdf: t.pdf, print: t.print }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <SalaryRangesFilters
                  lang={lang}
                  experience={selectedExperience}
                  experienceOptions={experienceOptions}
                  minIncome={minIncomeFilter}
                  maxIncome={maxIncomeFilter}
                  labels={{
                    anyExperience: t.anyExperience,
                    minIncome: t.minIncome,
                    maxIncome: t.maxIncome,
                    incomePlaceholder: t.incomePlaceholder,
                    reset: t.reset,
                  }}
                />
              </div>
            </div>

            {/* Vertical Bar Chart Container */}
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/60 sm:px-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                   {t.position2} - {filteredSalaryItems.length}
                </p>
              </div>

              {filteredSalaryItems.length === 0 ? (
                <EmptyGraph text={t.noData} />
              ) : (
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="mb-6 flex flex-wrap gap-6 text-xs font-black text-slate-600 dark:text-slate-300">
                    <Legend color={MIN_BAR_COLOR} label={t.minSalary} />
                    <Legend color={MAX_BAR_COLOR} label={t.maxSalary} />
                  </div>

                  <div className="flex flex-col items-center gap-8 rounded-[28px] bg-slate-50 p-5 dark:bg-slate-950 sm:p-6">
                    <div className="w-full overflow-x-auto pb-2">
                      <div className="flex min-w-max items-end justify-center gap-6 sm:gap-8">
                        {filteredSalaryItems.map((item) => {
                          const same = item.minSalary === item.maxSalary;
                          const minHeight = Math.max(
                            (item.minSalary / maxSalaryValue) * BAR_MAX_HEIGHT,
                            item.minSalary ? 8 : 4,
                          );
                          const maxHeight = Math.max(
                            (item.maxSalary / maxSalaryValue) * BAR_MAX_HEIGHT,
                            item.maxSalary ? 8 : 4,
                          );

                          const Track = ({ color, height, value }: { color: string; height: number; value: string }) => (
                            <div className="flex flex-col items-center">
                              <p className="mb-1 text-[10px] font-black leading-3 text-slate-600 dark:text-slate-300">
                                {value}
                              </p>
                              <div
                                className="w-8 rounded-t-md transition-transform duration-300 hover:-translate-y-0.5 sm:w-10"
                                style={{
                                  height: `${height}px`,
                                  background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                                  boxShadow: `0 8px 16px -8px ${color}aa`,
                                }}
                              />
                            </div>
                          );

                          return (
                            <div key={item.position} className="flex flex-col items-center">
                              <div className="flex items-end justify-center gap-0">
                                {!same && (
                                  <Track color={MIN_BAR_COLOR} height={minHeight} value={item.minSalary.toLocaleString()} />
                                )}
                                <Track color={MAX_BAR_COLOR} height={maxHeight} value={item.maxSalary.toLocaleString()} />
                              </div>
                              <Link
                                href={positionHref(item.position)}
                                className="mt-2 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-center text-[10px] font-black text-slate-600 transition hover:border-[#00BFC4] hover:bg-[#00BFC4] hover:text-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#00BFC4] dark:hover:bg-[#00BFC4] dark:hover:text-white"
                              >
                                {item.position}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
                    {filteredSalaryItems.map((item) => (
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

              {filteredSalaryItems.length === 0 && <EmptyGraph text={t.noData} />}
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
