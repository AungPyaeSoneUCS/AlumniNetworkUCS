// file: app/admin/users/job-status/page.tsx

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
  AdminGraph DESIGN SETTINGS
*/
const TOTAL_BAR_COLOR = "#0b67a3";
const EMPLOYED_BAR_COLOR = "#35a4df";
const UNEMPLOYED_BAR_COLOR = "#86e4f5";
const BAR_WIDTH = 26;
const BAR_MAX_HEIGHT = 145;
const BAR_MIN_HEIGHT = 22;
const CHART_HEIGHT_CLASS = "h-[265px] sm:h-[290px]";
const BAR_GAP_CLASS = "gap-8 sm:gap-10";
const BAR_FONT_CLASS = "text-[10px] sm:text-[11px]";
const LABEL_FONT_CLASS = "text-[12px] sm:text-sm";

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
    startYear: "စတင်ခုနှစ်",
    endYear: "ပြီးဆုံးခုနှစ်",
    reset: "ပြန်ရှင်းမည်",
    graduatedYear: "ဘွဲ့ရခုနှစ်",
    percentage: "အလုပ်အကိုင်ရရှိမှုရာခိုင်နှုန်း",
    totalGraduate: "ဘွဲ့ရပြီး",
    employed: "အလုပ်ရှိ",
    unemployed: "အလုပ်မရှိ",
    totalCount: "စုစုပေါင်း",
    employedCount: "အလုပ်ရှိ",
    unemployedCount: "အလုပ်မရှိ",
    noData: "အလုပ်အကိုင်အချက်အလက် မတွေ့ပါ။",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print ထုတ်ရန်",
    exportTitle: "အလုပ်အကိုင်အခြေအနေ Report",
    pdfLoading: "PDF ပြုလုပ်နေသည်...",
    pdfError: "PDF export မအောင်မြင်ပါ။ ထပ်စမ်းကြည့်ပါ။",
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

  return user.experiences.some((exp: any) =>
    cleanText(
      exp?.position ||
        exp?.title ||
        exp?.employmentType ||
        exp?.company ||
        exp?.organization,
    ),
  );
}

function isYearInRange(year: string, startYear: string, endYear: string) {
  if (year === "Unknown") return false;

  const current = Number(year);
  const start = Number(startYear);
  const end = Number(endYear);

  if (!Number.isFinite(current)) return false;
  if (startYear && Number.isFinite(start) && current < start) return false;
  if (endYear && Number.isFinite(end) && current > end) return false;

  return true;
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
  .card-icon.blue { background: #35a4df; }
  .card-icon.cyan { background: #86e4f5; color: #0f172a; }
  
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
    height: 290px;
    min-width: 620px; 
    display: flex;
    align-items: flex-end;
    gap: 28px;
    border-left: 2px solid #cbd5e1;
    border-bottom: 2px solid #cbd5e1;
    padding: 40px 20px 30px 10px;
  }
  .year-group {
    flex: 1;
    min-width: 108px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 7px;
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
    margin-bottom: 5px;
    color: var(--text-main);
  }
  .count {
    font-size: 10px;
    font-weight: bold;
    margin-top: 5px;
    color: var(--text-muted);
  }
  .bar {
    width: ${BAR_WIDTH}px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  .label {
    font-size: 12px;
    font-weight: bold;
    margin-top: 10px;
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
      <h2>Alumni Network System</h2>
      <h3> REPORT OF ALUMNI JOB STATUS </h3>
      <div class="header-meta">
        Generated Date: ${dateStr} | Time: ${timeStr}
      </div>
    </div>
  </div>

  <div class="summary-container">
    <div class="summary-card">
      <div class="card-icon" style="background: ${TOTAL_BAR_COLOR};">🎓</div>
      <div class="card-info">
        <p>Total Graduates</p>
        <h4>${totalGraduates}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon blue">💼</div>
      <div class="card-info">
        <p>Total Employed</p>
        <h4>${totalEmployed}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon cyan">📉</div>
      <div class="card-info">
        <p>Total Unemployed</p>
        <h4>${totalUnemployed}</h4>
      </div>
    </div>
  </div>

  <div class="legend">
    <span><i class="dot" style="background:${TOTAL_BAR_COLOR}"></i>${escapeHtml(t.totalGraduate)}</span>
    <span><i class="dot" style="background:${EMPLOYED_BAR_COLOR}"></i>${escapeHtml(t.employed)}</span>
    <span><i class="dot" style="background:${UNEMPLOYED_BAR_COLOR}"></i>${escapeHtml(t.unemployed)}</span>
  </div>

  <div class="chart-scroll">
    <div class="chart">
    ${items
      .map((item) => {
        const bars = [
          { value: item.totalPercent, count: item.totalCount, color: TOTAL_BAR_COLOR },
          { value: item.employedPercent, count: item.employedCount, color: EMPLOYED_BAR_COLOR },
          { value: item.unemployedPercent, count: item.unemployedCount, color: UNEMPLOYED_BAR_COLOR },
        ];

        return `<div class="year-group">
          <div class="bars">
          ${bars
            .map((bar) => {
              const height = Math.max((bar.value / 100) * BAR_MAX_HEIGHT, bar.value ? BAR_MIN_HEIGHT : 6);
              return `<div class="bar-box">
                <div class="value">${bar.value}%</div>
                <div class="bar" style="height:${height}px;background:${bar.color}"></div>
                <div class="count">${bar.count}</div>
              </div>`;
            })
            .join("")}
          </div>
          <div class="label">${escapeHtml(item.year)}</div>
        </div>`;
      })
      .join("")}
    </div>
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
    <span>Alumni Network System</span>
    <span>Official Administrative Report</span>
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
  ).sort((a, b) => Number(a) - Number(b));

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
    .sort((a, b) => Number(a.year) - Number(b.year));

  const title = t.title;
  const csv = buildCsv(employmentItems, t);
  const html = buildHtml(employmentItems, title, t);

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
                  <details className="group relative z-[200] inline-flex overflow-visible">
                    <summary
                      id="job-status-export-toggle"
                      className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden"
                    >
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>

                    <div
                      id="job-status-export-menu"
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
                id="job-status-auto-filter-form"
                action="/admin/users/job-status"
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input type="hidden" name="lang" value={lang} />

                <select
                  name="jobStartYear"
                  defaultValue={selectedJobStartYear}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-[#00BFC4]"
                >
                  <option value="">{t.startYear}</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  name="jobEndYear"
                  defaultValue={selectedJobEndYear}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-[#00BFC4]"
                >
                  <option value="">{t.endYear}</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <Link
                  href={`/admin/users/job-status?lang=${lang}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700 transition hover:border-[#00BFC4] hover:bg-cyan-50 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
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

            {/* Chart Container */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/60 sm:px-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {employmentItems.length} {t.graduatedYear}
                </p>
              </div>

              {employmentItems.length === 0 ? (
                <EmptyGraph text={t.noData} />
              ) : (
                <div className="overflow-x-auto overflow-y-hidden p-3 sm:p-5 md:p-6">
                  <div className="relative min-w-[620px] rounded-2xl bg-slate-50/80 p-3 dark:bg-slate-950/50 sm:min-w-[720px] sm:p-5">
                    <p className="absolute left-[-45px] top-32 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {t.percentage}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-4 pl-8 text-[11px] font-black text-slate-600 dark:text-slate-300">
                      <Legend color={TOTAL_BAR_COLOR} label={t.totalGraduate} />
                      <Legend color={EMPLOYED_BAR_COLOR} label={t.employed} />
                      <Legend color={UNEMPLOYED_BAR_COLOR} label={t.unemployed} />
                    </div>

                    <div
                      className={`ml-7 flex ${CHART_HEIGHT_CLASS} items-end border-b-2 border-l-2 border-slate-200 pb-8 pl-4 pt-14 dark:border-slate-700 ${BAR_GAP_CLASS}`}
                    >
                      {employmentItems.map((item) => (
                        <div
                          key={item.year}
                          className="flex min-w-[112px] flex-1 flex-col items-center text-center"
                        >
                          <div className="flex items-end gap-2">
                            <PercentBar
                              value={item.totalPercent}
                              count={item.totalCount}
                              color={TOTAL_BAR_COLOR}
                              label={t.totalGraduate}
                            />
                            <PercentBar
                              value={item.employedPercent}
                              count={item.employedCount}
                              color={EMPLOYED_BAR_COLOR}
                              label={t.employed}
                            />
                            <PercentBar
                              value={item.unemployedPercent}
                              count={item.unemployedCount}
                              color={UNEMPLOYED_BAR_COLOR}
                              label={t.unemployed}
                            />
                          </div>

                          <p
                            className={`mt-3 line-clamp-2 max-w-[90px] font-black leading-4 text-slate-500 transition-colors dark:text-slate-400 ${LABEL_FONT_CLASS}`}
                          >
                            {item.year}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {t.graduatedYear}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Data Table */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
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

function PercentBar({
  value,
  count,
  color,
  label,
}: {
  value: number;
  count: number;
  color: string;
  label: string;
}) {
  const height = Math.max(
    (value / 100) * BAR_MAX_HEIGHT,
    value ? BAR_MIN_HEIGHT : 6,
  );

  return (
    <div className="group flex flex-col items-center">
      <p
        className={`mb-2 rounded-full bg-white px-1.5 py-0.5 font-black text-slate-900 shadow-sm transition-transform group-hover:-translate-y-1 dark:bg-slate-800 dark:text-white ${BAR_FONT_CLASS}`}
      >
        {value}%
      </p>

      <div
        title={`${label}: ${value}% (${count})`}
        className="shrink-0 rounded-t-lg shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
        style={{
          width: `${BAR_WIDTH}px`,
          height: `${height}px`,
          backgroundColor: color,
        }}
      />

      <p className="mt-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
        {count}
      </p>
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
    <Script id="job-status-export-script" strategy="afterInteractive">
      {`
        (() => {
          const form = document.getElementById("job-status-auto-filter-form");
          const toggle = document.getElementById("job-status-export-toggle");
          const menu = document.getElementById("job-status-export-menu");

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

              // We render the whole body since we updated the template
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
                  "/admin/users/job-status" + (query ? "?" + query : "");
              });
            });
          }

          if (toggle && menu && toggle.dataset.ready !== "1") {
            toggle.dataset.ready = "1";

            // Click outside to close <details>
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