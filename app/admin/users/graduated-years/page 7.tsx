// file: app/admin/users/graduated-years/page.tsx

import type React from "react";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";

type Lang = "en" | "mm";

type GraphItem = {
  label: string;
  value: number;
};

/*
  GRAPH DESIGN SETTINGS
*/
const BAR_COLOR = "#b800f5"; // Reverted to original purple
const BAR_WIDTH = 42;
const BAR_MAX_HEIGHT = 170;
const BAR_MIN_HEIGHT = 28;
const CHART_HEIGHT_CLASS = "h-[260px] sm:h-[300px]";
const BAR_GAP_CLASS = "gap-6 sm:gap-8";
const BAR_FONT_CLASS = "text-[13px] sm:text-sm";
const LABEL_FONT_CLASS = "text-[12px] sm:text-sm";

const text = {
  en: {
    numberof: "Yearly",
    title: " Graduate Count",
    subtitle: "Only normal users are counted. Admin accounts are excluded.",
    anyDegree: "Any Degree",
    reset: "Reset",
    graduatedYear: "Years",
    count: "Graduated Count",
    noData: "No graduated year data found.",
    export: "Export",
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    exportTitle: "Graduated Year Export",
    pdfLoading: "Creating PDF...",
    pdfError: "PDF export failed. Please try again.",
  },
  mm: {
    numberof: " ခုနှစ်အလိုက် ",
    title: " ဘွဲ့ရ အရေအတွက်",
    subtitle: "Admin မဟုတ်သော user များကိုသာ ထည့်တွက်ထားသည်။",
    anyDegree: "Degree အားလုံး",
    reset: "Reset",
    graduatedYear: "ဘွဲ့ရခုနှစ်",
    count:  " ဘွဲ့ရအရေအတွက်",
    noData: "ဘွဲ့ရခုနှစ်ဒေတာ မတွေ့ပါ။",
    export: "Export",
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    exportTitle: "Graduated Year Export",
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

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#eef2f7;margin:0;padding:18px;color:#0f172a}
.sheet{max-width:1200px;margin:0 auto;background:#fff;border:1px solid #dbe4ef;border-radius:22px;padding:18px}
h1{font-size:24px;margin:0 0 6px;font-weight:900}
p{margin:0 0 16px;color:#64748b;font-weight:700}
.grid{display:grid;grid-template-columns:1.35fr .65fr;gap:16px;align-items:start}
.box{overflow:hidden;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;padding:14px}
.chart-scroll{overflow-x:auto;overflow-y:hidden}
.chart{height:300px;min-width:520px;display:flex;align-items:flex-end;gap:20px;border-left:4px solid #0f172a;border-bottom:4px solid #0f172a;padding:60px 20px 34px}
.bar-group{flex:1;min-width:58px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.value{font-size:13px;font-weight:900;margin-bottom:8px;background:#fff;border-radius:999px;padding:4px 8px;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
.bar{width:${BAR_WIDTH}px;background:${BAR_COLOR};box-shadow:0 8px 16px rgba(184,0,245,.2);border-top-left-radius:6px;border-top-right-radius:6px}
.label{font-size:13px;font-weight:900;margin-top:10px;color:#475569}
table{width:100%;border-collapse:collapse;background:white}
th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px}
th{background:#f1f5f9;font-weight:900}
@media(max-width:900px){.grid{grid-template-columns:1fr}.chart{height:270px;min-width:500px;padding-top:58px}}
@media(max-width:640px){body{padding:8px}.sheet{padding:10px;border-radius:16px}h1{font-size:19px}.chart{height:260px;min-width:470px;gap:24px;padding:58px 14px 32px}.bar{width:38px}.value,.label{font-size:12px}}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff;padding:0}.sheet{border:0;border-radius:0}.chart-scroll{overflow:visible}.grid{grid-template-columns:1.35fr .65fr}}
</style>
</head>
<body>
<div class="sheet">
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(t.subtitle)}</p>
<div class="grid">
<div class="box chart-scroll">
<div class="chart">
${items
  .map((item) => {
    const height = Math.max((item.value / max) * BAR_MAX_HEIGHT, BAR_MIN_HEIGHT);
    return `<div class="bar-group">
<div class="value">${escapeHtml(item.value.toLocaleString())}</div>
<div class="bar" style="height:${height}px"></div>
<div class="label">${escapeHtml(item.label)}</div>
</div>`;
  })
  .join("")}
</div>
</div>
<div class="box">
<table>
<thead><tr><th>${escapeHtml(t.graduatedYear)}</th><th>${escapeHtml(t.count)}</th></tr></thead>
<tbody>
${items
  .map(
    (item) =>
      `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(
        item.value.toLocaleString(),
      )}</td></tr>`,
  )
  .join("")}
</tbody>
</table>
</div>
</div>
</div>
</body>
</html>`;
}

export default async function AdminGraduatedYearsPage({
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
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const users: any[] = await User.find({})
    .sort({ createdAt: -1 })
    .select("_id name email role degree department graduatedYear")
    .lean();

  const normalUsers = users.filter((user) => user.role !== "admin");

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
    .sort((a, b) => {
      if (a.label === "Unknown") return 1;
      if (b.label === "Unknown") return -1;
      return Number(a.label) - Number(b.label);
    });

  const title = selectedDegree ? `${selectedDegree} ${t.title}` : t.title;
  const csv = buildCsv(graphItems, t);
  const html = buildHtml(graphItems, title, t);
  const maxValue = Math.max(...graphItems.map((item) => item.value), 1);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="users-graduated-years" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            
            {/* 
              Changed z-index from z-30 to z-20. 
              The mobile navbar in AdminSidebar is z-30, so this ensures the content properly slides UNDER the navbar on scroll. 
            */}
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.numberof} {title}
                  </h1>
                </div>

                <div className="relative mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
                  <button
                    type="button"
                    id="graduated-export-toggle"
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-95 sm:w-auto"
                  >
                    {t.export}
                  </button>

                  <div
                    id="graduated-export-menu"
                    className="absolute right-0 top-12 z-50 hidden w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
                  >
                    <ExportBtn action="excel">{t.excel}</ExportBtn>
                    <ExportBtn action="pdf">{t.pdf}</ExportBtn>
                    <ExportBtn action="web">{t.web}</ExportBtn>
                    <ExportBtn action="print">{t.print}</ExportBtn>
                  </div>
                </div>
              </div>

              <form
                id="graduated-auto-filter-form"
                action="/admin/users/graduated-years"
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
              >
                <input type="hidden" name="lang" value={lang} />

                <select
                  name="degree"
                  defaultValue={selectedDegree}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-[#00BFC4]"
                >
                  <option value="">{t.anyDegree}</option>
                  {degreeOptions.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>

                <Link
                  href={`/admin/users/graduated-years?lang=${lang}`}
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

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] md:gap-6">
              
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                {graphItems.length === 0 ? (
                  <EmptyGraph t={t} />
                ) : (
                  <div className="overflow-x-auto overflow-y-hidden p-3 sm:p-5 md:p-6">
                    <div className="relative min-w-[520px] rounded-2xl bg-slate-50/80 p-3 dark:bg-slate-950/50 sm:min-w-[600px] sm:p-5">
                      <p className="absolute left-[-25px] top-28 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {t.count}
                      </p>

                      <div
                        className={`ml-7 flex ${CHART_HEIGHT_CLASS} items-end border-b-2 border-l-2 border-slate-200 pb-8 pl-4 pt-14 dark:border-slate-700 ${BAR_GAP_CLASS}`}
                      >
                        {graphItems.map((item) => {
                          const height = Math.max(
                            (item.value / maxValue) * BAR_MAX_HEIGHT,
                            BAR_MIN_HEIGHT,
                          );

                          return (
                            <div
                              key={item.label}
                              className="group flex min-w-[60px] flex-1 flex-col items-center text-center"
                            >
                              <p
                                className={`mb-2 rounded-full bg-white px-2.5 py-1 font-black text-slate-900 shadow-sm transition-transform group-hover:-translate-y-1 dark:bg-slate-800 dark:text-white ${BAR_FONT_CLASS}`}
                              >
                                {item.value.toLocaleString()}
                              </p>

                              <div
                                className="shrink-0 rounded-t-lg shadow-lg shadow-[#b800f5]/20 transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                                style={{
                                  width: `${BAR_WIDTH}px`,
                                  height: `${height}px`,
                                  backgroundColor: BAR_COLOR,
                                }}
                              />

                              <p
                                title={item.label}
                                className={`mt-3 line-clamp-2 max-w-[80px] font-black leading-4 text-slate-500 transition-colors group-hover:text-slate-900 dark:group-hover:text-white ${LABEL_FONT_CLASS}`}
                              >
                                {item.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {t.graduatedYear}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[360px] text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/80">
                      <tr>
                        <TableHead>{t.graduatedYear}</TableHead>
                        <TableHead>{t.count}</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {graphItems.map((item) => (
                        <tr key={item.label} className="transition-colors hover:bg-[#b800f5]/5 dark:hover:bg-[#b800f5]/10">
                          <td className="px-4 py-3.5 text-sm font-black text-slate-800 dark:text-slate-200">
                            {item.label}
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
      className="block w-full px-4 py-2.5 text-left text-xs font-black text-slate-700 transition-colors hover:bg-[#b800f5]/10 dark:text-slate-300 dark:hover:bg-slate-700"
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
          const form = document.getElementById("graduated-auto-filter-form");
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
            const oldText = toggle ? toggle.textContent : "";
            try {
              if (toggle) {
                toggle.textContent = pdfLoadingText;
                toggle.disabled = true;
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

              const sheet = doc.querySelector(".sheet") || doc.body;

              const canvas = await window.html2canvas(sheet, {
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
                toggle.textContent = oldText || "Export";
                toggle.disabled = false;
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
                  "/admin/users/graduated-years" + (query ? "?" + query : "");
              });
            });
          }

          if (toggle && menu && toggle.dataset.ready !== "1") {
            toggle.dataset.ready = "1";

            toggle.addEventListener("click", (event) => {
              event.stopPropagation();
              menu.classList.toggle("hidden");
            });

            document.addEventListener("click", () => {
              menu.classList.add("hidden");
            });

            menu.querySelectorAll("[data-export-action]").forEach((btn) => {
              btn.addEventListener("click", (event) => {
                event.stopPropagation();
                menu.classList.add("hidden");

                const action = btn.getAttribute("data-export-action");

                if (action === "excel") {
                  downloadFile(csvData, "text/csv;charset=utf-8", safeName + ".csv");
                }

                if (action === "web") {
                  downloadFile(htmlData, "text/html;charset=utf-8", safeName + ".html");
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