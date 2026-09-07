// file: app/staff/users/graduated-years/page.tsx

import type React from "react";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffSidebar from "@/components/staff/staff-sidebar";
import GraduatedYearsChart from "@/components/admin/graduated-years-chart";
import GraduatedYearsExporter from "@/components/admin/graduated-years-exporter";
import { GraduatedYearsFilters } from "@/components/admin/report-auto-filters";

export const dynamic = "force-dynamic";

type Lang = "en" | "mm";

type GraphItem = {
  label: string;
  value: number;
};

type PivotRow = {
  no: number;
  year: string;
  cells: number[];
  total: number;
}

/*
  Distinct color per year - each academic year gets its own shade so bars
  are easy to tell apart. Mirrored here for the print template + table rows.
*/
const BAR_PALETTE = [
  "#06b6d4",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#f97316",
  "#10b981",
  "#14b8a6",
  "#3b82f6",
];

function yearColor(index: number) {
  return BAR_PALETTE[index % BAR_PALETTE.length];
}

/*
  GRAPH DESIGN SETTINGS
*/
const BAR_MAX_HEIGHT = 190;

// Max years per graph block on export; more years create additional blocks.
const GRAPH_MAX_YEARS = 5;

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const text = {
  en: {
    numberof: "Yearly",
    title: "Graduate Count",
    anyDegree: "Any Degree",
    startYear: "Start Year",
    endYear: "End Year",
    reset: "Reset",
    no: "No",
    graduatedYear: "Years",
    count: "Graduated Count",
    noData: "No graduated year data found.",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print Report",
    exportTitle: "Graduated Year Export Report",
    pdfLoading: "Creating PDF...",
    pdfError: "PDF export failed. Please try again.",
  },
  mm: {
    numberof: "နှစ်အလိုက်",
    title: "ဘွဲ့ရဦးရေ",
    anyDegree: "Degree အားလုံး",
    startYear: "စတင်သည့်နှစ်",
    endYear: "ပြီးဆုံးသည့်နှစ်",
    reset: "ပြန်လည်သတ်မှတ်မည်",
    no: "စဉ်",
    graduatedYear: "ဘွဲ့ရခုနှစ်",
    count: "ဘွဲ့ရဦးရေ",
    noData: "ဘွဲ့ရခုနှစ် ဒေတာ မတွေ့ပါ။",
    export: "တင်ပို့မည်",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "ပုံနှိပ်မည်",
    exportTitle: "ဘွဲ့ရခုနှစ် အစီရင်ခံစာ",
    pdfLoading: "PDF ပြုလုပ်နေသည်...",
    pdfError: "PDF တင်ပို့ရန် မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getDegree(user: any) {
  return cleanText(user?.degree || user?.department) || "Unknown";
}

function getGraduatedYear(user: any) {
  return user?.graduatedYear ? String(user.graduatedYear) : "Unknown";
}

// Extract the leading academic year (e.g. "2028" from "2028 (Senior)") for sorting
function cohortYear(label: string) {
  const match = String(label).match(/(\d{4})/);
  return match ? Number(match[1]) : Number.NaN;
}

// Sort years ascending (min -> max). Senior/Junior variants group by their year,
// then by label so Senior comes before Junior. "Unknown" always goes last.
function sortByCohortYear(a: GraphItem, b: GraphItem) {
  const ya = cohortYear(a.label);
  const yb = cohortYear(b.label);
  if (Number.isNaN(ya) && Number.isNaN(yb)) return a.label.localeCompare(b.label);
  if (Number.isNaN(ya)) return 1;
  if (Number.isNaN(yb)) return -1;
  if (ya !== yb) return ya - yb;
  return a.label.localeCompare(b.label);
}

// Compare two year labels by their leading numeric year so the Start/End Year
// filter can be applied to Senior/Junior-suffixed graduation labels too.
function isYearInRange(year: string, startYear: string, endYear: string) {
  const current = cohortYear(year);
  if (Number.isNaN(current)) return false;

  const start = cohortYear(startYear);
  const end = cohortYear(endYear);

  if (!Number.isNaN(start) && current < start) return false;
  if (!Number.isNaN(end) && current > end) return false;

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

function buildCsv(degrees: string[], rows: PivotRow[], t: typeof text.en) {
  const header = [t.no, t.graduatedYear, ...degrees, t.count];
  const body = rows.map((row) => [
    String(row.no),
    row.year,
    ...row.cells.map((cell) => String(cell)),
    String(row.total),
  ]);

  return `\uFEFF${[header, ...body].map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

function buildHtml(items: GraphItem[], degrees: string[], rows: PivotRow[], title: string, t: typeof text.en) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const totalGraduates = items.reduce((sum, item) => sum + item.value, 0);
  const colored = items.map((item, index) => ({ ...item, color: yearColor(index) }));

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const graphBlocks = chunkItems(colored, GRAPH_MAX_YEARS)
    .filter((block) => block.length > 0)
    .map((block) => {
      const barsHtml = block
        .map((item) => {
          const height = Math.max((item.value / max) * BAR_MAX_HEIGHT, item.value ? 8 : 4);
          return `<div class="year-group">
          <div class="bar-box">
            <div class="value">${escapeHtml(item.value.toLocaleString())}</div>
            <div class="bar" style="height:${height}px;background:linear-gradient(180deg, ${item.color} 0%, ${item.color}88 100%)"></div>
          </div>
          <div class="x-label">${escapeHtml(item.label)}</div>
        </div>`;
        })
        .join("");

      return `<div class="chart"><div class="bars-row">${barsHtml}</div></div>`;
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

  .summary-container { display: flex; gap: 15px; margin-bottom: 20px; }
  .summary-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 15px; background: var(--bg-light); }
  .card-info p { margin: 0; font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; }
  .card-info h4 { margin: 2px 0 0 0; font-size: 20px; color: var(--text-main); }

  .chart-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    margin-bottom: 40px;
  }
  .chart {
    position: relative;
    height: 360px;
    min-width: 620px;
    padding: 0 20px 0 20px;
    border-radius: 24px;
    background: var(--bg-light);
    border: 1px solid #e2e8f0;
  }
  .chart + .chart {
    margin-top: 30px;
  }
  .bars-row {
    position: relative;
    height: 360px;
    display: flex;
    gap: 40px;
    padding: 0 20px 0 20px;
  }
  .year-group {
    flex: 1;
    min-width: 80px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
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
    width: 42px;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  .x-label {
    margin-top: 12px;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: var(--text-muted);
  }

  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
  th { background: var(--primary); color: white; font-weight: bold; text-transform: uppercase; font-size: 10px; }
  .center { text-align: center; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr { page-break-inside: avoid; break-inside: avoid; }

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
        <p>${escapeHtml(t.graduatedYear)}</p>
        <h4>${colored.length}</h4>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-info">
        <p>${escapeHtml(t.count)}</p>
        <h4>${totalGraduates.toLocaleString()}</h4>
      </div>
    </div>
  </div>

  <div class="chart-scroll">
    ${graphBlocks}
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width: 5%;">${escapeHtml(t.no)}</th>
        <th>${escapeHtml(t.graduatedYear)}</th>
        ${degrees.map((degree) => `<th class="center">${escapeHtml(degree)}</th>`).join("")}
        <th class="center">${escapeHtml(t.count)}</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
            <td class="center">${row.no}</td>
            <td>${escapeHtml(row.year)}</td>
            ${row.cells.map((cell) => `<td class="center">${escapeHtml(String(cell))}</td>`).join("")}
            <td class="center">${escapeHtml(String(row.total))}</td>
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
function buildGraphHtml(items: GraphItem[], t: typeof text.en) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const colored = items.map((item, index) => ({ ...item, color: yearColor(index) }));

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
    border-radius: 24px;
    padding: 24px;
  }
  .graph-block + .graph-block { margin-top: 44px; }
  .year-group { flex: 1; min-width: 80px; text-align: center; }
  .bar-box { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
  .value { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
  .bar { width: 42px; border-top-left-radius: 6px; border-top-right-radius: 6px; }
  .x-label { margin-top: 12px; font-size: 13px; font-weight: 700; color: #64748b; }
</style>
</head>
<body>
  <div class="graph">
    <div class="legend">
      <span><i class="dot" style="background:${colored[0]?.color || "#06b6d4"}"></i>${escapeHtml(t.graduatedYear)}</span>
      <span><i class="dot" style="background:#0f766e"></i>${escapeHtml(t.count)}</span>
    </div>
    ${chunkItems(colored, GRAPH_MAX_YEARS)
      .filter((block) => block.length > 0)
      .map((block) => {
        const barsHtml = block
          .map((item) => {
            const height = Math.max((item.value / max) * 220, item.value ? 10 : 4);
            return `<div class="year-group">
            <div class="bar-box">
              <div class="value">${escapeHtml(item.value.toLocaleString())}</div>
              <div class="bar" style="height:${height}px;background:linear-gradient(180deg, ${item.color} 0%, ${item.color}88 100%)"></div>
            </div>
            <div class="x-label">${escapeHtml(item.label)}</div>
          </div>`;
          })
          .join("");

        return `<div class="graph-block"><div class="chart-row">${barsHtml}</div></div>`;
      })
      .join("")}
  </div>
</body>
</html>`;
}

export default async function StaffGraduatedYearsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ degree?: string; gradStartYear?: string; gradEndYear?: string; lang?: Lang }>
    | { degree?: string; gradStartYear?: string; gradEndYear?: string; lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedDegree = cleanText(resolvedSearchParams.degree);
  const selectedStartYear = cleanText(resolvedSearchParams.gradStartYear);
  const selectedEndYear = cleanText(resolvedSearchParams.gradEndYear);
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

  const users: any[] = await User.find({})
    .sort({ createdAt: -1 })
    .select("_id name email role degree department graduatedYear")
    .lean();

  // Only consider standard alumni users for metrics
  const normalUsers = users.filter((user) => user.role === "user");

  const degreeOptions = Array.from(
    new Set(
      normalUsers
        .map((user) => getDegree(user))
        .filter((degree) => degree && degree !== "Unknown"),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const yearOptions = Array.from(
    new Set(
      normalUsers
        .map((user) => getGraduatedYear(user))
        .filter((year) => year !== "Unknown"),
    ),
  ).sort((a, b) => {
    const ya = cohortYear(a);
    const yb = cohortYear(b);
    if (Number.isNaN(ya) && Number.isNaN(yb)) return a.localeCompare(b);
    if (Number.isNaN(ya)) return -1;
    if (Number.isNaN(yb)) return 1;
    return ya - yb;
  });

  const filteredUsers = normalUsers.filter((user) => {
    if (selectedDegree && getDegree(user) !== selectedDegree) return false;
    const year = getGraduatedYear(user);
    if (selectedStartYear || selectedEndYear) {
      return isYearInRange(year, selectedStartYear, selectedEndYear);
    }
    return true;
  });

  // Degrees present in the filtered data (from the DB), one table column each.
  // "Unknown" (no degree on file) is kept so per-year totals match the
  // dashboard / manage-users "Graduates by Year" counts.
  const degreeColumns = Array.from(
    new Set(
      filteredUsers
        .map((user) => getDegree(user))
        .filter((degree) => !!degree),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const yearMap = new Map<string, number>();
  const cellMap = new Map<string, Map<string, number>>();

  filteredUsers.forEach((user) => {
    const year = getGraduatedYear(user);
    const degree = getDegree(user);
    // Exclude only Unknown graduated years so the graph, summary count,
    // pivot table and exports all stay consistent with the dashboard /
    // manage-users alumni-by-year counts. Unknown degrees are kept in an
    // "Unknown" pivot column.
    if (year === "Unknown") return;

    yearMap.set(year, (yearMap.get(year) || 0) + 1);
    if (!cellMap.has(year)) cellMap.set(year, new Map());
    const cells = cellMap.get(year)!;
    cells.set(degree, (cells.get(degree) || 0) + 1);
  });

  const graphItems: GraphItem[] = Array.from(yearMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort(sortByCohortYear);

  const pivotRows: PivotRow[] = graphItems.map((item, index) => {
    const cells = degreeColumns.map((degree) => cellMap.get(item.label)?.get(degree) || 0);
    return {
      no: index + 1,
      year: item.label,
      cells,
      total: cells.reduce((sum, cell) => sum + cell, 0),
    };
  });

  const title = selectedDegree ? `${selectedDegree} ${t.title}` : t.title;

  // Export data always reflects the current filter selection:
  // a specific degree exports only its years, default (no filter) exports all years.
  const csv = buildCsv(degreeColumns, pivotRows, t);
  const html = buildHtml(graphItems, degreeColumns, pivotRows, title, t);
  const graphHtml = buildGraphHtml(graphItems, t);
  const reportTotals = { graduates: graphItems.reduce((sum, item) => sum + item.value, 0) };
  const exporterRows = pivotRows.map((row, index) => ({
    no: row.no,
    year: row.year,
    cells: row.cells,
    total: row.total,
    color: yearColor(index),
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <StaffSidebar active="users-graduated-years" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.numberof} {title}
                  </h1>
                </div>

                <div className="relative z-50 flex w-full flex-wrap items-center gap-2 overflow-visible xl:w-auto xl:justify-end">
                  <GraduatedYearsExporter
                    toggleId="graduated-export-toggle"
                    menuId="graduated-export-menu"
                    csv={csv}
                    html={html}
                    title={t.exportTitle}
                    pdfLoading={t.pdfLoading}
                    pdfError={t.pdfError}
                    graphHtml={graphHtml}
                    rows={exporterRows}
                    totals={reportTotals}
                    degrees={degreeColumns}
                    labels={{
                      export: t.export,
                      excel: t.excel,
                      pdf: t.pdf,
                      print: t.print,
                      no: t.no,
                      count: t.count,
                      years: t.graduatedYear,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <GraduatedYearsFilters
                  lang={lang}
                  degree={selectedDegree}
                  degreeOptions={degreeOptions}
                  startYear={selectedStartYear}
                  endYear={selectedEndYear}
                  yearOptions={yearOptions}
                  labels={{
                    allDegree: t.anyDegree,
                    startYear: t.startYear,
                    endYear: t.endYear,
                    reset: t.reset,
                  }}
                />
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              
              <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                {graphItems.length === 0 ? (
                  <EmptyGraph t={t} />
                ) : (
                  <div className="p-3 sm:p-5 md:p-6">
                    <GraduatedYearsChart items={graphItems} />
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/80">
                      <tr>
                        <TableHead className="text-center">{t.no}</TableHead>
                        <TableHead>{t.graduatedYear}</TableHead>
                        {degreeColumns.map((degree) => (
                          <TableHead key={degree} className="text-center">
                            {degree}
                          </TableHead>
                        ))}
                        <TableHead className="text-center">{t.count}</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {pivotRows.map((row, index) => (
                        <tr key={row.year} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3.5 text-center text-sm font-black text-slate-800 dark:text-slate-200">
                            {row.no}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-2.5 text-sm font-black text-slate-800 dark:text-slate-200">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: yearColor(index) }}
                              />
                              {row.year}
                            </span>
                          </td>
                          {row.cells.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-3.5 text-center text-sm font-black text-slate-800 dark:text-slate-200"
                            >
                              {cell.toLocaleString()}
                            </td>
                          ))}
                          <td className="px-4 py-3.5 text-center text-sm font-black text-[#0f766e] dark:text-teal-300">
                            {row.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {graphItems.length === 0 && <EmptyGraph t={t} />}
              </section>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

function EmptyGraph({ t }: { t: typeof text.en }) {
  return (
    <div className="p-10 text-center">
      <BarChart3 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{t.noData}</h2>
    </div>
  );
}
