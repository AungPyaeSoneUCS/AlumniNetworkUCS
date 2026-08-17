// file: app/admin/users/salary-ranges/page.tsx

import type React from "react";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { BarChart3, Printer } from "lucide-react";

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
  AdminGraph DESIGN SETTINGS
*/
const MIN_BAR_COLOR = "#f4762d";
const MAX_BAR_COLOR = "#35ea25";
const BAR_WIDTH = 34;
const BAR_MAX_HEIGHT = 160;
const BAR_MIN_HEIGHT = 24;
const CHART_HEIGHT_CLASS = "h-[275px] sm:h-[310px]";
const BAR_GAP_CLASS = "gap-8 sm:gap-10";
const BAR_FONT_CLASS = "text-[10px] sm:text-[11px]";
const LABEL_FONT_CLASS = "text-[11px] sm:text-xs";

const text = {
  en: {
    title: "Salary Range by Position",
    title2: "Salary Range ",
    subtitle: "",
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
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    exportTitle: "Salary Range Export",
    pdfLoading: "Creating PDF...",
    pdfError: "PDF export failed. Please try again.",
  },
  mm: {
    title: "အလုပ်အမျိုးအစား အလိုက် လစာ",
    title2: " လစာ ",
    subtitle: "",
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
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    exportTitle: "Salary Range Export",
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

function buildHtml(items: SalaryItem[], title: string, t: typeof text.en) {
  const max = Math.max(...items.map((item) => item.maxSalary), 1);

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
.stack{display:grid;grid-template-columns:1fr;gap:16px}
.box{overflow:hidden;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;padding:14px}
.chart-scroll{overflow-x:auto;overflow-y:hidden}
.legend{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 14px 8px;font-size:12px;font-weight:900;color:#475569}
.legend span{display:inline-flex;align-items:center;gap:7px}
.dot{width:12px;height:12px;border-radius:999px;display:inline-block}
.chart{height:310px;min-width:720px;display:flex;align-items:flex-end;gap:34px;border-left:4px solid #0f172a;border-bottom:4px solid #0f172a;padding:62px 20px 44px}
.group{flex:1;min-width:120px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.bars{display:flex;align-items:flex-end;gap:10px}
.bar-box{display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.value{font-size:11px;font-weight:900;margin-bottom:7px;background:#fff;border-radius:999px;padding:3px 6px}
.bar{width:${BAR_WIDTH}px;box-shadow:0 8px 16px rgba(15,23,42,.2)}
.label{font-size:12px;font-weight:900;margin-top:10px;color:#475569;line-height:1.2}
table{width:100%;border-collapse:collapse;background:white}
th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px}
th{background:#f1f5f9;font-weight:900}
@media(max-width:900px){.chart{height:290px;min-width:650px;padding-top:58px}}
@media(max-width:640px){body{padding:8px}.sheet{padding:10px;border-radius:16px}h1{font-size:19px}.chart{height:270px;min-width:620px;gap:28px;padding:56px 14px 40px}.bar{width:28px}.value,.label{font-size:10px}}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff;padding:0}.sheet{border:0;border-radius:0}.chart-scroll{overflow:visible}}
</style>
</head>
<body>
<div class="sheet">
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(t.subtitle)}</p>

<div class="stack">
<div class="box chart-scroll">
<div class="legend">
<span><i class="dot" style="background:${MIN_BAR_COLOR}"></i>${escapeHtml(t.minSalary)}</span>
<span><i class="dot" style="background:${MAX_BAR_COLOR}"></i>${escapeHtml(t.maxSalary)}</span>
</div>

<div class="chart">
${items
  .map((item) => {
    const minHeight = Math.max(
      (item.minSalary / max) * BAR_MAX_HEIGHT,
      item.minSalary ? BAR_MIN_HEIGHT : 6,
    );
    const maxHeight = Math.max(
      (item.maxSalary / max) * BAR_MAX_HEIGHT,
      item.maxSalary ? BAR_MIN_HEIGHT : 6,
    );

    return `<div class="group">
<div class="bars">
<div class="bar-box">
<div class="value">${escapeHtml(item.minSalary.toLocaleString())}</div>
<div class="bar" style="height:${minHeight}px;background:${MIN_BAR_COLOR}"></div>
</div>
<div class="bar-box">
<div class="value">${escapeHtml(item.maxSalary.toLocaleString())}</div>
<div class="bar" style="height:${maxHeight}px;background:${MAX_BAR_COLOR}"></div>
</div>
</div>
<div class="label">${escapeHtml(item.position)}</div>
</div>`;
  })
  .join("")}
</div>
</div>

<div class="box">
<table>
<thead>
<tr>
<th>${escapeHtml(t.position)}</th>
<th>${escapeHtml(t.minSalary)}</th>
<th>${escapeHtml(t.maxSalary)}</th>
</tr>
</thead>
<tbody>
${items
  .map(
    (item) => `<tr>
<td>${escapeHtml(item.position)}</td>
<td>${escapeHtml(item.minSalary.toLocaleString())}</td>
<td>${escapeHtml(item.maxSalary.toLocaleString())}</td>
</tr>`,
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
    )
    .slice(0, 8);

  const experienceOptions = Array.from(experienceOptionsSet).sort((a, b) =>
    a.localeCompare(b),
  );

  const title = selectedExperience
    ? `${selectedExperience} ${t.title2}`
    : t.title;

  const csv = buildCsv(salaryItems, t);
  const html = buildHtml(salaryItems, title, t);
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

                <div className="grid gap-2 sm:grid-cols-[auto_auto]">
                  <button
                    type="button"
                    id="salary-print-top"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#00BFC4] bg-white px-4 text-xs font-black text-[#008B8B] shadow-sm transition hover:bg-cyan-50 active:scale-95 dark:border-[#00BFC4]/40 dark:bg-slate-900 dark:text-[#25C9C8] dark:hover:bg-slate-800 sm:w-auto"
                  >
                    <Printer className="h-4 w-4" />
                    {t.print}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      id="salary-export-toggle"
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition hover:brightness-110 active:scale-95 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                    >
                      {t.export}
                    </button>

                    <div
                      id="salary-export-menu"
                      className="absolute right-0 top-12 z-50 hidden w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                      <ExportBtn action="excel">{t.excel}</ExportBtn>
                      <ExportBtn action="pdf">{t.pdf}</ExportBtn>
                      <ExportBtn action="web">{t.web}</ExportBtn>
                      <ExportBtn action="print">{t.print}</ExportBtn>
                    </div>
                  </div>
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

            {/* Chart Container */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/60 sm:px-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                   {t.position2} - {salaryItems.length}
                </p>
              </div>

              {salaryItems.length === 0 ? (
                <EmptyGraph text={t.noData} />
              ) : (
                <div className="overflow-x-auto overflow-y-hidden p-3 sm:p-5 md:p-6">
                  {/* Removed background colors here to make it transparent/white */}
                  <div className="relative min-w-[680px] rounded-2xl p-3 sm:min-w-[760px] sm:p-5">
                    <p className="absolute left-[-8px] top-32 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {t.salary}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-4 pl-8 text-[11px] font-black text-slate-600 dark:text-slate-300">
                      <Legend color={MIN_BAR_COLOR} label={t.minSalary} />
                      <Legend color={MAX_BAR_COLOR} label={t.maxSalary} />
                    </div>

                    <div
                      className={`ml-7 flex ${CHART_HEIGHT_CLASS} items-end border-b-2 border-l-2 border-slate-200 pb-10 pl-4 pt-14 dark:border-slate-700 ${BAR_GAP_CLASS}`}
                    >
                      {salaryItems.map((item) => {
                        const minHeight = Math.max(
                          (item.minSalary / maxSalaryValue) * BAR_MAX_HEIGHT,
                          item.minSalary ? BAR_MIN_HEIGHT : 6,
                        );
                        const maxHeight = Math.max(
                          (item.maxSalary / maxSalaryValue) * BAR_MAX_HEIGHT,
                          item.maxSalary ? BAR_MIN_HEIGHT : 6,
                        );

                        return (
                          <div
                            key={item.position}
                            className="flex min-w-[118px] flex-1 flex-col items-center text-center"
                          >
                            <div className="flex items-end gap-2">
                              <SalaryBar
                                value={item.minSalary}
                                height={minHeight}
                                color={MIN_BAR_COLOR}
                                label={t.minSalary}
                              />
                              <SalaryBar
                                value={item.maxSalary}
                                height={maxHeight}
                                color={MAX_BAR_COLOR}
                                label={t.maxSalary}
                              />
                            </div>

                            <p
                              title={item.position}
                              className={`mt-3 line-clamp-2 max-w-[108px] font-black leading-4 text-slate-500 transition-colors dark:text-slate-400 ${LABEL_FONT_CLASS}`}
                            >
                              {item.position}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {t.position}
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

function SalaryBar({
  value,
  height,
  color,
  label,
}: {
  value: number;
  height: number;
  color: string;
  label: string;
}) {
  return (
    <div className="group flex flex-col items-center">
      <p
        className={`mb-2 rounded-full bg-white px-1.5 py-0.5 font-black text-slate-900 shadow-sm transition-transform group-hover:-translate-y-1 dark:bg-slate-800 dark:text-white ${BAR_FONT_CLASS}`}
      >
        {value.toLocaleString()}
      </p>

      <div
        title={`${label}: ${value.toLocaleString()}`}
        className="shrink-0 rounded-t-lg shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
        style={{
          width: `${BAR_WIDTH}px`,
          height: `${height}px`,
          backgroundColor: color,
        }}
      />
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
      className="block w-full px-4 py-2.5 text-left text-xs font-black text-slate-700 transition-colors hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-slate-700"
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
          const printTop = document.getElementById("salary-print-top");

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
                  "/admin/users/salary-ranges" + (query ? "?" + query : "");
              });
            });
          }

          if (printTop && printTop.dataset.ready !== "1") {
            printTop.dataset.ready = "1";
            printTop.addEventListener("click", openPrintWindow);
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

function EmptyGraph({ text }: { text: string }) {
  return (
    <div className="p-10 text-center">
      <BarChart3 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{text}</h2>
    </div>
  );
}