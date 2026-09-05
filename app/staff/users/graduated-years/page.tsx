// file: app/staff/users/graduated-years/page.tsx

import type React from "react";
import Script from "next/script";
import { redirect } from "next/navigation";
import { BarChart3, ChevronDown, Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffSidebar from "@/components/staff/staff-sidebar";
import GraduatedYearsChart from "@/components/admin/graduated-years-chart";
import { GraduatedYearsFilters } from "@/components/admin/report-auto-filters";

type Lang = "en" | "mm";

type GraphItem = {
  label: string;
  value: number;
};

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
const BAR_MIN_HEIGHT = 30;

const text = {
  en: {
    numberof: "Yearly",
    title: " Graduate Count",
    anyDegree: "Any Degree",
    reset: "Reset",
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
    numberof: " ခုနှစ်အလိုက် ",
    title: " ဘွဲ့ရ အရေအတွက်",
    anyDegree: "Degree အားလုံး",
    reset: "Reset",
    graduatedYear: "ဘွဲ့ရခုနှစ်",
    count:  " ဘွဲ့ရအရေအတွက်",
    noData: "ဘွဲ့ရခုနှစ်ဒေတာ မတွေ့ပါ။",
    export: "Export",
    excel: "Excel (CSV)",
    pdf: "PDF Document",
    print: "Print ထုတ်ရန်",
    exportTitle: "Graduated Year Export Report",
    pdfLoading: "PDF ပြုလုပ်နေသည်...",
    pdfError: "PDF export မအောင်မြင်ပါ။ ထပ်စမ်းကြည့်ပါ။",
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

function buildCsv(items: GraphItem[], t: typeof text.en) {
  const rows = [
    [t.graduatedYear, t.count],
    ...items.map((item) => [item.label, String(item.value)]),
  ];

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

function buildHtml(items: GraphItem[], title: string, t: typeof text.en) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const totalGraduates = items.reduce((sum, item) => sum + item.value, 0);

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

  .grid {
    display: grid;
    grid-template-columns: 1.35fr 0.65fr;
    gap: 20px;
    align-items: start;
    margin-bottom: 30px;
  }
  .box {
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    background: #f8fafc;
    padding: 15px;
  }

  .chart-scroll {
    overflow-x: auto;
    overflow-y: hidden;
  }
  .chart {
    height: 300px;
    min-width: 520px;
    display: flex;
    align-items: flex-end;
    gap: 20px;
    border-left: 2px solid #94a3b8;
    border-bottom: 2px solid #94a3b8;
    padding: 40px 20px 20px 10px;
    margin-top: 5px;
  }
  .bar-group {
    flex: 1;
    min-width: 45px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
  }
  .bar {
    width: 42px;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    transition: none;
  }
  .label {
    font-size: 11px;
    font-weight: 900;
    margin-top: 8px;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 8px 10px;
    text-align: left;
    font-size: 11px;
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
      margin: 10mm; 
    }
    body { 
      padding: 0;
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    .chart-scroll { 
      overflow: visible !important; 
    }
    .chart { 
      min-width: 100% !important; 
      gap: 12px;
    }
    .grid { 
      grid-template-columns: 1.35fr 0.65fr; 
      break-inside: avoid;
    }
    .bar-group { 
      break-inside: avoid; 
    }
    .report-header, .grid, .footer {
      page-break-inside: avoid;
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
      <h3> REPORT OF ${escapeHtml(title).toUpperCase()} </h3>
      <div class="header-meta">
        Generated Date: ${dateStr} | Time: ${timeStr} | Total Graduates Counted: ${totalGraduates}
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="box chart-scroll">
      <div class="chart">
        ${items
          .map((item, index) => {
            const height = Math.max((item.value / max) * BAR_MAX_HEIGHT, BAR_MIN_HEIGHT);
            const color = yearColor(index);
            return `<div class="bar-group">
              <div class="bar" style="height:${height}px;background:linear-gradient(180deg, ${color} 0%, ${color}88 100%)"></div>
              <div class="label">${escapeHtml(item.label)}</div>
            </div>`;
          })
          .join("")}
      </div>
    </div>
    
    <div class="box">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t.graduatedYear)}</th>
            <th>${escapeHtml(t.count)}</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) =>
                `<tr>
                  <td>${escapeHtml(item.label)}</td>
                  <td>${escapeHtml(item.value.toLocaleString())}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    <span>Alumni Network</span>
    <span>Official Administrative Report</span>
  </div>

</body>
</html>`;
}

export default async function StaffGraduatedYearsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ degree?: string; lang?: Lang }>
    | { degree?: string; lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedDegree = cleanText(resolvedSearchParams.degree);
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

  const filteredUsers = selectedDegree
    ? normalUsers.filter((user) => getDegree(user) === selectedDegree)
    : normalUsers;

  const yearMap = new Map<string, number>();

  filteredUsers.forEach((user) => {
    const year = getGraduatedYear(user);
    yearMap.set(year, (yearMap.get(year) || 0) + 1);
  });

  const graphItems: GraphItem[] = Array.from(yearMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort(sortByCohortYear);

  const title = selectedDegree ? `${selectedDegree} ${t.title}` : t.title;
  const csv = buildCsv(graphItems, t);
  const html = buildHtml(graphItems, title, t);

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
                  <details className="group relative z-[200] inline-flex overflow-visible">
                    <summary
                      id="graduated-export-toggle"
                      className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden"
                    >
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>

                    <div
                      id="graduated-export-menu"
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
                <GraduatedYearsFilters
                  lang={lang}
                  degree={selectedDegree}
                  degreeOptions={degreeOptions}
                  labels={{ allDegree: t.anyDegree, reset: t.reset }}
                />
              </div>

              <AutoScripts
                csv={csv}
                html={html}
                title={t.exportTitle}
                pdfLoading={t.pdfLoading}
                pdfError={t.pdfError}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] md:gap-6">
              
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
                  <table className="w-full min-w-[360px] text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/80">
                      <tr>
                        <TableHead>{t.graduatedYear}</TableHead>
                        <TableHead>{t.count}</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {graphItems.map((item, index) => (
                        <tr key={item.label} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-2.5 text-sm font-black text-slate-800 dark:text-slate-200">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: yearColor(index) }}
                              />
                              {item.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                            {item.value.toLocaleString()}
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
    <Script id="graduated-export-script" strategy="afterInteractive">
      {`
        (() => {
          const toggle = document.getElementById("graduated-export-toggle");
          const menu = document.getElementById("graduated-export-menu");

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

function EmptyGraph({ t }: { t: typeof text.en }) {
  return (
    <div className="p-10 text-center">
      <BarChart3 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{t.noData}</h2>
    </div>
  );
}