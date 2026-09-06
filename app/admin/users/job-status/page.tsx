// file: app/admin/users/job-status/page.tsx

import type React from "react";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";
import JobStatusChart from "@/components/admin/job-status-chart";
import JobStatusExporter from "@/components/admin/job-status-exporter";
import { JobStatusFilters } from "@/components/admin/report-auto-filters";

export const dynamic = "force-dynamic";

type Lang = "en" | "mm";

type EmploymentItem = {
  year: string;
  totalPercent: number;
  employedPercent: number;
  unemployedPercent: number;
  totalCount: number;
  employedCount: number;
  unemployedCount: number;
};

/*
  PrintGraph DESIGN SETTINGS (used by the print/PDF template)
*/
const EMPLOYED_BAR_COLOR = "#008B8B";
const UNEMPLOYED_BAR_COLOR = "#38bdf8";
const BAR_WIDTH = 26;
const BAR_MAX_HEIGHT = 190;

const text = {
  en: {
    title: "Alumni Job Status",
    subtitle: "",
    startYear: "Start Year",
    endYear: "End Year",
    reset: "Reset",
    graduatedYear: "Graduated Year",
    percentage: "Graduate Employment Rate",
    totalGraduate: "Graduates",
    employed: "Employed",
    unemployed: "Unemployed",
    totalCount: "Total Count",
    employedCount: "Employed Count",
    unemployedCount: "Unemployed Count",
    noData: "No employment data found.",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print Report",
    exportTitle: "Job Status Export Report",
    pdfLoading: "Creating PDF...",
    pdfError: "PDF export failed. Please try again.",
  },
  mm: {
    title: "ဘွဲ့ရကျောင်းသားများ အလုပ်အကိုင် အခြေအနေ",
    subtitle: "",
    startYear: "စတင်သည့်နှစ်",
    endYear: "ပြီးဆုံးသည့်နှစ်",
    reset: "ပြန်လည်သတ်မှတ်မည်",
    graduatedYear: "ဘွဲ့ရခုနှစ်",
    percentage: "အလုပ်အကိုင်ရရှိမှုရာခိုင်နှုန်း",
    totalGraduate: "ဘွဲ့ရပြီး",
    employed: "အလုပ်ရှိ",
    unemployed: "အလုပ်မရှိ",
    totalCount: "စုစုပေါင်း",
    employedCount: "အလုပ်ရှိ",
    unemployedCount: "အလုပ်မရှိ",
    noData: "အလုပ်အကိုင်အချက်အလက် မတွေ့ပါ။",
    export: "တင်ပို့မည်",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "ပုံနှိပ်မည်",
    exportTitle: "အလုပ်အကိုင် အခြေအနေ အစီရင်ခံစာ",
    pdfLoading: "PDF ပြုလုပ်နေသည်...",
    pdfError: "PDF တင်ပို့ရန် မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getGraduatedYear(user: any) {
  return user?.graduatedYear ? String(user.graduatedYear) : "Unknown";
}

function hasJob(user: any) {
  if (!Array.isArray(user?.experiences)) return false;

  return user.experiences.some((exp: any) => {
    const isCurrent = exp?.isCurrent === true || exp?.isCurrent === "true";
    const hasDetails = Boolean(
      cleanText(
        exp?.position ||
          exp?.title ||
          exp?.employmentType ||
          exp?.company ||
          exp?.organization,
      ),
    );

    return isCurrent && hasDetails;
  });
}

// Extract the leading cohort year (e.g. "2028" from "2028 (Senior)") so
// suffixed labels like Senior/Junior group under the same period as plain years.
function cohortYear(value: string) {
  const match = String(value).match(/(\d{4})/);
  const parsed = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

// Same-year ordering: Senior before Junior before plain year labels.
function periodRank(label: string) {
  const lower = String(label).toLowerCase();
  if (lower.includes("senior")) return 0;
  if (lower.includes("junior")) return 1;
  return 2;
}

// Sort periods descending: 2029, 2028 (Senior), 2028 (Junior), 2027 (Senior),
// 2027 (Junior), 2026, 2025, 2024.
function sortPeriodDesc(a: string, b: string) {
  const ya = cohortYear(a) ?? -Infinity;
  const yb = cohortYear(b) ?? -Infinity;
  if (ya !== yb) return yb - ya;
  return periodRank(a) - periodRank(b);
}

function isYearInRange(year: string, startYear: string, endYear: string) {
  const current = cohortYear(year);
  if (current === null) return false;

  const start = cohortYear(startYear);
  const end = cohortYear(endYear);

  if (start !== null && current < start) return false;
  if (end !== null && current > end) return false;

  return true;
}

// Split periods into export-sized blocks (max GRAPH_MAX_YEARS per block) so
// long ranges don't overflow the graph frame. Each block renders its own
// stacked graph; the data table follows after all graph blocks.
const GRAPH_MAX_YEARS = 5;

function chunkItems(items: EmploymentItem[], size: number): EmploymentItem[][] {
  const chunks: EmploymentItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
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

function buildCsv(items: EmploymentItem[], t: typeof text.en) {
  const rows = [
    [
      t.graduatedYear,
      t.totalGraduate,
      t.employed,
      t.unemployed,
      t.totalCount,
      t.employedCount,
      t.unemployedCount,
    ],
    ...items.map((item) => [
      item.year,
      `${item.totalPercent}%`,
      `${item.employedPercent}%`,
      `${item.unemployedPercent}%`,
      String(item.totalCount),
      String(item.employedCount),
      String(item.unemployedCount),
    ]),
  ];

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

function buildHtml(items: EmploymentItem[], title: string, t: typeof text.en) {
  const totalGraduates = items.reduce((sum, item) => sum + item.totalCount, 0);
  const totalEmployed = items.reduce((sum, item) => sum + item.employedCount, 0);
  const totalUnemployed = items.reduce((sum, item) => sum + item.unemployedCount, 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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
    background: var(--bg-light);
  }
  
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
  .x-label {
    margin-top: 12px;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
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
  td.center, th.center {
    text-align: center;
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
    .chart-scroll { 
      overflow: visible; 
    }
    .chart {
       min-width: 100%;
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
      <h3> REPORT OF ALUMNI JOB STATUS </h3>
      <div class="header-meta">
        Generated Date: ${dateStr} | Time: ${timeStr}
      </div>
    </div>
  </div>

  <div class="summary-container">
    <div class="summary-card">
      <div class="card-info">
        <p>Total Graduates</p>
        <h4>${totalGraduates}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-info">
        <p>Total Employed</p>
        <h4>${totalEmployed}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-info">
        <p>Total Unemployed</p>
        <h4>${totalUnemployed}</h4>
      </div>
    </div>
  </div>

  <div class="legend">
    <span><i class="dot" style="background:${EMPLOYED_BAR_COLOR}"></i>${escapeHtml(t.employed)}</span>
    <span><i class="dot" style="background:${UNEMPLOYED_BAR_COLOR}"></i>${escapeHtml(t.unemployed)}</span>
  </div>

  <div class="chart-scroll">
    ${chunkItems(items, GRAPH_MAX_YEARS)
      .filter((block) => block.length > 0)
      .map(
        (block) => `<div class="chart">
      <div class="bars-row">
      ${block
        .map((item) => {
          const employedHeight = Math.max((item.employedPercent / 100) * BAR_MAX_HEIGHT, item.employedPercent ? 8 : 4);
          const unemployedHeight = Math.max((item.unemployedPercent / 100) * BAR_MAX_HEIGHT, item.unemployedPercent ? 8 : 4);

          return `<div class="year-group">
          <div class="bars">
            <div class="bar-box">
              <div class="value">${item.employedCount}</div>
              <div class="bar" style="height:${employedHeight}px;background:${EMPLOYED_BAR_COLOR}"></div>
            </div>
            <div class="bar-box">
              <div class="value">${item.unemployedCount}</div>
              <div class="bar" style="height:${unemployedHeight}px;background:${UNEMPLOYED_BAR_COLOR}"></div>
            </div>
          </div>
          <div class="x-label">${escapeHtml(item.year)}</div>
        </div>`;
        })
        .join("")}
      </div>
      </div>`,
      )
      .join("")}
  </div>

  <table>
    <thead>
      <tr>
        <th class="center">${escapeHtml(t.graduatedYear)}</th>
        <th class="center">${escapeHtml(t.totalCount)}</th>
        <th>${escapeHtml(t.employedCount)}</th>
        <th>${escapeHtml(t.unemployedCount)}</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `<tr>
            <td class="center">${escapeHtml(item.year)}</td>
            <td class="center">${escapeHtml(item.totalCount)}</td>
            <td>${escapeHtml(item.employedCount)} (${escapeHtml(item.employedPercent)}%)</td>
            <td>${escapeHtml(item.unemployedCount)} (${escapeHtml(item.unemployedPercent)}%)</td>
          </tr>`,
        )
        .join("")}
    </tbody>
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
function buildGraphHtml(items: EmploymentItem[], t: typeof text.en) {
  const GRAPH_MAX_HEIGHT = 230;

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
  .graph-block + .graph-block { margin-top: 44px; }
  .year-group { flex: 1; min-width: 96px; text-align: center; }
  .bars { display: flex; align-items: flex-end; justify-content: center; gap: 0; }
  .bar-box { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
  .value { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
  .bar { width: 38px; border-top-left-radius: 5px; border-top-right-radius: 5px; }
  .x-label { margin-top: 12px; font-size: 13px; font-weight: 700; color: #64748b; }
</style>
</head>
<body>
  <div class="graph">
    <div class="legend">
      <span><i class="dot" style="background:${EMPLOYED_BAR_COLOR}"></i>${escapeHtml(t.employed)}</span>
      <span><i class="dot" style="background:${UNEMPLOYED_BAR_COLOR}"></i>${escapeHtml(t.unemployed)}</span>
    </div>
    ${chunkItems(items, GRAPH_MAX_YEARS)
      .filter((block) => block.length > 0)
      .map(
        (block) => `<div class="graph-block">
      <div class="chart-row">
      ${block
        .map((item) => {
          const employedHeight = Math.max((item.employedPercent / 100) * GRAPH_MAX_HEIGHT, item.employedPercent ? 10 : 4);
          const unemployedHeight = Math.max((item.unemployedPercent / 100) * GRAPH_MAX_HEIGHT, item.unemployedPercent ? 10 : 4);

          return `<div class="year-group">
            <div class="bars">
              <div class="bar-box">
                <div class="value">${item.employedCount}</div>
                <div class="bar" style="height:${employedHeight}px;background:${EMPLOYED_BAR_COLOR}"></div>
              </div>
              <div class="bar-box">
                <div class="value">${item.unemployedCount}</div>
                <div class="bar" style="height:${unemployedHeight}px;background:${UNEMPLOYED_BAR_COLOR}"></div>
              </div>
            </div>
            <div class="x-label">${escapeHtml(item.year)}</div>
          </div>`;
        })
        .join("")}
      </div>
      </div>`,
      )
      .join("")}
  </div>
</body>
</html>`;
}

export default async function AdminJobStatusPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ jobStartYear?: string; jobEndYear?: string; lang?: Lang }>
    | { jobStartYear?: string; jobEndYear?: string; lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedJobStartYear = cleanText(resolvedSearchParams.jobStartYear);
  const selectedJobEndYear = cleanText(resolvedSearchParams.jobEndYear);
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
    .select("_id role graduatedYear experiences")
    .lean();

  const users = allUsers.filter((user) => user.role !== "admin");

  const yearOptions = Array.from(
    new Set(
      users
        .map((user) => getGraduatedYear(user))
        .filter((year) => year !== "Unknown"),
    ),
  ).sort(sortPeriodDesc);

  const jobGraphUsers = users.filter((user) => {
    const year = getGraduatedYear(user);

    if (selectedJobStartYear || selectedJobEndYear) {
      return isYearInRange(year, selectedJobStartYear, selectedJobEndYear);
    }

    return year !== "Unknown";
  });

  const jobMap = new Map<string, { total: number; employed: number }>();

  jobGraphUsers.forEach((user) => {
    const year = getGraduatedYear(user);
    const old = jobMap.get(year) || { total: 0, employed: 0 };

    old.total += 1;
    if (hasJob(user)) old.employed += 1;

    jobMap.set(year, old);
  });

  const employmentItems: EmploymentItem[] = Array.from(jobMap.entries())
    .map(([year, data]) => {
      const employedPercent = Math.round(
        (data.employed / Math.max(data.total, 1)) * 100,
      );
      const unemployedPercent = 100 - employedPercent;

      return {
        year,
        totalPercent: 100,
        employedPercent,
        unemployedPercent,
        totalCount: data.total,
        employedCount: data.employed,
        unemployedCount: data.total - data.employed,
      };
    })
    .sort((a, b) => sortPeriodDesc(a.year, b.year));

  const title = t.title;
  const csv = buildCsv(employmentItems, t);
  const html = buildHtml(employmentItems, title, t);
  const graphHtml = buildGraphHtml(employmentItems, t);

  const reportTotals = {
    graduates: employmentItems.reduce((sum, item) => sum + item.totalCount, 0),
    employed: employmentItems.reduce((sum, item) => sum + item.employedCount, 0),
    unemployed: employmentItems.reduce((sum, item) => sum + item.unemployedCount, 0),
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="users-job-status" lang={lang} />

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
                  <JobStatusExporter
                    toggleId="job-status-export-toggle"
                    menuId="job-status-export-menu"
                    csv={csv}
                    html={html}
                    title={t.exportTitle}
                    pdfLoading={t.pdfLoading}
                    pdfError={t.pdfError}
                    graphHtml={graphHtml}
                    rows={employmentItems}
                    totals={reportTotals}
                    labels={{ export: t.export, excel: t.excel, pdf: t.pdf, print: t.print }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <JobStatusFilters
                  lang={lang}
                  startYear={selectedJobStartYear}
                  endYear={selectedJobEndYear}
                  yearOptions={yearOptions}
                  labels={{
                    startYear: t.startYear,
                    endYear: t.endYear,
                    reset: t.reset,
                  }}
                />
              </div>
            </div>

            {/* Chart Container */}
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/60 sm:px-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {employmentItems.length} {t.graduatedYear}
                </p>
              </div>

              {employmentItems.length === 0 ? (
                <EmptyGraph text={t.noData} />
              ) : (
                <div className="p-3 sm:p-5 md:p-6">
                  <JobStatusChart
                    items={employmentItems}
                    legendEmployed={t.employed}
                    legendUnemployed={t.unemployed}
                  />
                </div>
              )}
            </section>

            {/* Data Table */}
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[460px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80">
                    <tr>
                      <TableHead>{t.graduatedYear}</TableHead>
                      <TableHead>{t.totalCount}</TableHead>
                      <TableHead>{t.employedCount}</TableHead>
                      <TableHead>{t.unemployedCount}</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {employmentItems.map((item) => (
                      <tr key={item.year} className="transition hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10">
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                          {item.year}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                          {item.totalCount}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                          {item.employedCount} ({item.employedPercent}%)
                        </td>
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                          {item.unemployedCount} ({item.unemployedPercent}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {employmentItems.length === 0 && <EmptyGraph text={t.noData} />}
            </section>
          </div>
        </section>
      </div>
    </div>
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
