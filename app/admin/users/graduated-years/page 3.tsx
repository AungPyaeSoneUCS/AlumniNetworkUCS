// file: app/admin/users/graduated-years/page.tsx

import type React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";
import ExportGraphButtons from "@/components/admin/export-graph-buttons";
import AutoSubmitSelect from "@/components/admin/auto-submit-select";

type GraphItem = {
  label: string;
  value: number;
};

type SalaryItem = {
  position: string;
  minSalary: number;
  maxSalary: number;
};

type EmploymentItem = {
  year: string;
  totalPercent: number;
  employedPercent: number;
  unemployedPercent: number;
  totalCount: number;
  employedCount: number;
  unemployedCount: number;
};

type Lang = "en" | "mm";

const COLORS = {
  yearBar: "bg-[#af00f5]",
  salaryMin: "bg-[#f4762d]",
  salaryMax: "bg-[#35ea25]",
  totalGraduate: "bg-[#0b67a3]",
  employed: "bg-[#35a4df]",
  unemployed: "bg-[#86e4f5]",
};

const text = {
  en: {
    graduatedYearCount: "Graduated Year Count",
    salaryRangeByPosition: "Salary Range by Position",
    graduateJobStatus: "Graduate Students Job Status",
    subtitleYear: "Only normal users are counted. Admin accounts are excluded.",
    subtitleSalary: "Salary range is split into min and max vertical bars.",
    subtitleJob:
      "Shows graduates who have jobs or do not have jobs within selected years.",

    anyDegree: "Any Degree",
    anyExperience: "Any Experience",
    startYear: "Start Year",
    endYear: "End Year",
    apply: "Apply",
    reset: "Reset",

    count: "Count",
    graduatedYear: "Graduated Year",
    salary: "Salary",
    position: "Job Title",
    min: "Min",
    max: "Max",
    percentage: "Percentage",

    totalGraduate: "Graduates Percentage",
    employed: "Have Job Percentage",
    unemployed: "No Job Percentage",

    noYear: "No graduated year data found.",
    noSalary: "No salary and position data found.",
    noJob: "No employment data found.",

    export: "Export",
    exportExcel: "Excel (.csv)",
    exportWeb: "Web (.html)",
    exportPdf: "PDF (.pdf)",
    printPdf: "Print PDF",
    exportWord: "Word (.doc)",
  },
  mm: {
    graduatedYearCount: "ဘွဲ့ရခုနှစ်အလိုက် အရေအတွက်",
    salaryRangeByPosition: "ရာထူးအလိုက် လစာအပိုင်းအခြား",
    graduateJobStatus: "ဘွဲ့ရကျောင်းသားများ အလုပ်အကိုင် အခြေအနေ",
    subtitleYear: "Admin မဟုတ်သော user များကိုသာ ထည့်တွက်ထားသည်။",
    subtitleSalary:
      "အနိမ့်ဆုံးလစာနှင့် အမြင့်ဆုံးလစာကို vertical graph ဖြင့် ပြထားသည်။",
    subtitleJob:
      "ရွေးချယ်ထားသော ခုနှစ်အတွင်း အလုပ်ရှိ / အလုပ်မရှိ အခြေအနေကို ပြသည်။",

    anyDegree: "Degree အားလုံး",
    anyExperience: "Experience အားလုံး",
    startYear: "စတင်ခုနှစ်",
    endYear: "ဆုံးခုနှစ်",
    apply: "ရှာမည်",
    reset: "ပြန်ရှင်းမည်",

    count: "အရေအတွက်",
    graduatedYear: "ဘွဲ့ရခုနှစ်",
    salary: "လစာ",
    position: "ရာထူး",
    min: "အနိမ့်",
    max: "အမြင့်",
    percentage: "ရာခိုင်နှုန်း",

    totalGraduate: "ဘွဲ့ရပြီး ရာခိုင်နှုန်း",
    employed: "အလုပ်အကိုင်ရှိ ရာခိုင်နှုန်း",
    unemployed: "အလုပ်အကိုင်မရှိ ရာခိုင်နှုန်း",

    noYear: "ဘွဲ့ရခုနှစ်ဒေတာ မတွေ့ပါ။",
    noSalary: "လစာနှင့် ရာထူးဒေတာ မတွေ့ပါ။",
    noJob: "အလုပ်အကိုင်ဒေတာ မတွေ့ပါ။",

    export: "Export",
    exportExcel: "Excel (.csv)",
    exportWeb: "Web (.html)",
    exportPdf: "PDF (.pdf)",
    printPdf: "Print PDF",
    exportWord: "Word (.doc)",
  },
};

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getDegree(user: any) {
  return cleanText(user?.degree || user?.department) || "Unknown";
}

function getGraduatedYear(user: any) {
  if (user?.graduatedYear) return String(user.graduatedYear);
  return "Unknown";
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

function parseSalaryRange(value: any): {
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

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function csvCell(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

type ExportKind = "year" | "salary" | "employment";

function exportCsv(
  items: GraphItem[] | SalaryItem[] | EmploymentItem[],
  title: string,
  t: typeof text.en,
) {
  let rows: string[][] = [["Title", title], []];

  if (items.length > 0 && "position" in items[0]) {
    rows = [
      ...rows,
      [t.position, "Min Salary", "Max Salary"],
      ...(items as SalaryItem[]).map((item) => [
        item.position,
        String(item.minSalary),
        String(item.maxSalary),
      ]),
    ];
  } else if (items.length > 0 && "employedPercent" in items[0]) {
    rows = [
      ...rows,
      [
        t.graduatedYear,
        t.totalGraduate,
        t.employed,
        t.unemployed,
        "Total Count",
        "Employed Count",
        "Unemployed Count",
      ],
      ...(items as EmploymentItem[]).map((item) => [
        item.year,
        `${item.totalPercent}%`,
        `${item.employedPercent}%`,
        `${item.unemployedPercent}%`,
        String(item.totalCount),
        String(item.employedCount),
        String(item.unemployedCount),
      ]),
    ];
  } else {
    rows = [
      ...rows,
      [t.graduatedYear, t.count],
      ...(items as GraphItem[]).map((item) => [item.label, String(item.value)]),
    ];
  }

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

function exportTableHtml(
  items: GraphItem[] | SalaryItem[] | EmploymentItem[],
  title: string,
  t: typeof text.en,
) {
  if (items.length > 0 && "position" in items[0]) {
    const rows = (items as SalaryItem[])
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.position)}</td><td>${escapeHtml(
            item.minSalary.toLocaleString(),
          )}</td><td>${escapeHtml(item.maxSalary.toLocaleString())}</td></tr>`,
      )
      .join("");

    return `<h2 class="table-title">${escapeHtml(title)} ${escapeHtml(
      t.position,
    )}</h2>
<table>
  <thead>
    <tr>
      <th>${escapeHtml(t.position)}</th>
      <th>${escapeHtml(t.min)} ${escapeHtml(t.salary)}</th>
      <th>${escapeHtml(t.max)} ${escapeHtml(t.salary)}</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
  }

  if (items.length > 0 && "employedPercent" in items[0]) {
    const rows = (items as EmploymentItem[])
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.year)}</td><td>${escapeHtml(
            `${item.totalPercent}%`,
          )}</td><td>${escapeHtml(`${item.employedPercent}%`)}</td><td>${escapeHtml(
            `${item.unemployedPercent}%`,
          )}</td><td>${escapeHtml(item.totalCount)}</td><td>${escapeHtml(
            item.employedCount,
          )}</td><td>${escapeHtml(item.unemployedCount)}</td></tr>`,
      )
      .join("");

    return `<h2 class="table-title">${escapeHtml(title)} Table</h2>
<table>
  <thead>
    <tr>
      <th>${escapeHtml(t.graduatedYear)}</th>
      <th>${escapeHtml(t.totalGraduate)}</th>
      <th>${escapeHtml(t.employed)}</th>
      <th>${escapeHtml(t.unemployed)}</th>
      <th>Total Count</th>
      <th>Employed Count</th>
      <th>Unemployed Count</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
  }

  const rows = (items as GraphItem[])
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(
          item.value.toLocaleString(),
        )}</td></tr>`,
    )
    .join("");

  return `<h2 class="table-title">${escapeHtml(title)} Table</h2>
<table>
  <thead>
    <tr>
      <th>${escapeHtml(t.graduatedYear)}</th>
      <th>${escapeHtml(t.count)}</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

function exportGraphHtml(
  items: GraphItem[] | SalaryItem[] | EmploymentItem[],
  title: string,
  subtitle: string,
  kind: ExportKind,
  t: typeof text.en,
) {
  const graphHtml = renderExportGraph(items, kind, t);
  const tableHtml = exportTableHtml(items, title, t);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#0f172a;background:#f8fafc}
    .sheet{max-width:1120px;margin:0 auto;background:#fff;border:1px solid #dbe4ef;border-radius:24px;padding:24px}
    h1{font-size:26px;margin:0 0 6px;font-weight:900}
    .subtitle{font-size:13px;color:#64748b;margin:0 0 20px;font-weight:700}
    .chart-wrap{border:1px solid #e2e8f0;border-radius:22px;background:#f8fafc;padding:20px;margin-bottom:24px;overflow-x:auto}
    .chart{height:360px;min-width:760px;display:flex;align-items:flex-end;gap:26px;border-left:4px solid #0f172a;border-bottom:4px solid #0f172a;padding:20px 20px 36px 26px}
    .bar-group{display:flex;flex:1;min-width:72px;align-items:flex-end;justify-content:center;gap:8px;text-align:center;position:relative}
    .bar-box{display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
    .bar{width:42px;min-height:6px;box-shadow:0 10px 20px rgba(15,23,42,.18)}
    .bar.slim{width:28px}.bar.percent{width:34px}
    .value{font-size:10px;font-weight:900;margin-bottom:6px;white-space:nowrap}
    .label{position:absolute;bottom:-30px;left:0;right:0;font-size:10px;font-weight:900;color:#475569;line-height:1.1}
    .legend{display:flex;gap:18px;flex-wrap:wrap;margin:0 0 18px 8px;font-size:12px;font-weight:900;color:#475569}
    .legend span{display:inline-flex;align-items:center;gap:7px}.dot{width:12px;height:12px;border-radius:999px;display:inline-block}
    .table-title{font-size:18px;font-weight:900;margin:10px 0 12px}
    table{width:100%;border-collapse:collapse;background:#fff;margin-top:16px}
    th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px}
    th{background:#eef2f7;font-weight:900}tr:nth-child(even){background:#f8fafc}
    @media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff;padding:0}.sheet{border:0;border-radius:0}.chart-wrap{break-inside:avoid}button{display:none}}
  </style>
</head>
<body>
  <div class="sheet">
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
    ${graphHtml}
    ${tableHtml}
  </div>
</body>
</html>`;
}

function renderExportGraph(
  items: GraphItem[] | SalaryItem[] | EmploymentItem[],
  kind: ExportKind,
  t: typeof text.en,
) {
  if (items.length === 0) {
    return `<div class="chart-wrap"><p>No data found.</p></div>`;
  }

  if (kind === "salary") {
    const salaryItems = items as SalaryItem[];
    const max = Math.max(...salaryItems.map((item) => item.maxSalary), 1);
    return `<div class="chart-wrap">
      <div class="legend"><span><i class="dot" style="background:#f4762d"></i>${escapeHtml(t.min)}</span><span><i class="dot" style="background:#35ea25"></i>${escapeHtml(t.max)}</span></div>
      <div class="chart">
        ${salaryItems
          .map((item) => {
            const minHeight = Math.max(
              (item.minSalary / max) * 245,
              item.minSalary ? 26 : 6,
            );
            const maxHeight = Math.max(
              (item.maxSalary / max) * 245,
              item.maxSalary ? 26 : 6,
            );
            return `<div class="bar-group">
              <div class="bar-box"><div class="value">${escapeHtml(item.minSalary.toLocaleString())}</div><div class="bar slim" style="height:${minHeight}px;background:#f4762d"></div></div>
              <div class="bar-box"><div class="value">${escapeHtml(item.maxSalary.toLocaleString())}</div><div class="bar slim" style="height:${maxHeight}px;background:#35ea25"></div></div>
              <div class="label">${escapeHtml(item.position)}</div>
            </div>`;
          })
          .join("")}
      </div>
    </div>`;
  }

  if (kind === "employment") {
    const employmentItems = items as EmploymentItem[];
    return `<div class="chart-wrap">
      <div class="legend"><span><i class="dot" style="background:#0b67a3"></i>${escapeHtml(t.totalGraduate)}</span><span><i class="dot" style="background:#35a4df"></i>${escapeHtml(t.employed)}</span><span><i class="dot" style="background:#86e4f5"></i>${escapeHtml(t.unemployed)}</span></div>
      <div class="chart">
        ${employmentItems
          .map((item) => {
            const values = [
              {
                value: item.totalPercent,
                count: item.totalCount,
                color: "#0b67a3",
              },
              {
                value: item.employedPercent,
                count: item.employedCount,
                color: "#35a4df",
              },
              {
                value: item.unemployedPercent,
                count: item.unemployedCount,
                color: "#86e4f5",
              },
            ];
            return `<div class="bar-group">
              ${values
                .map((bar) => {
                  const height = Math.max(
                    (bar.value / 100) * 245,
                    bar.value ? 22 : 6,
                  );
                  return `<div class="bar-box"><div class="value">${bar.value}%</div><div class="bar percent" style="height:${height}px;background:${bar.color}"></div><div class="value">${bar.count}</div></div>`;
                })
                .join("")}
              <div class="label">${escapeHtml(item.year)}</div>
            </div>`;
          })
          .join("")}
      </div>
    </div>`;
  }

  const graphItems = items as GraphItem[];
  const max = Math.max(...graphItems.map((item) => item.value), 1);
  return `<div class="chart-wrap"><div class="chart">
    ${graphItems
      .map((item) => {
        const height = Math.max((item.value / max) * 245, item.value ? 26 : 6);
        return `<div class="bar-group"><div class="bar-box"><div class="value">${escapeHtml(item.value.toLocaleString())}</div><div class="bar" style="height:${height}px;background:#af00f5"></div></div><div class="label">${escapeHtml(item.label)}</div></div>`;
      })
      .join("")}
  </div></div>`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{
        degree?: string;
        experience?: string;
        jobStartYear?: string;
        jobEndYear?: string;
        lang?: Lang;
      }>
    | {
        degree?: string;
        experience?: string;
        jobStartYear?: string;
        jobEndYear?: string;
        lang?: Lang;
      };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const selectedDegree = cleanText(resolvedSearchParams.degree);
  const selectedExperience = cleanText(resolvedSearchParams.experience);
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
    .select(
      "_id name email role degree department graduatedYear experiences createdAt",
    )
    .lean();

  const users = allUsers.filter((user) => user.role !== "admin");

  const degreeOptions = Array.from(
    new Set(
      users
        .map((user) => getDegree(user))
        .filter((degree) => degree && degree !== "Unknown"),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const yearOptions = Array.from(
    new Set(
      users
        .map((user) => getGraduatedYear(user))
        .filter((year) => year !== "Unknown"),
    ),
  ).sort((a, b) => Number(a) - Number(b));

  const degreeGraphUsers = selectedDegree
    ? users.filter((user) => getDegree(user) === selectedDegree)
    : users;

  const yearMap = new Map<string, number>();

  degreeGraphUsers.forEach((user) => {
    const year = getGraduatedYear(user);
    yearMap.set(year, (yearMap.get(year) || 0) + 1);
  });

  const graduatedYearGraph = Array.from(yearMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => {
      if (a.label === "Unknown") return 1;
      if (b.label === "Unknown") return -1;
      return Number(a.label) - Number(b.label);
    });

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

  const yearTitle = selectedDegree
    ? `${selectedDegree} ${t.graduatedYearCount}`
    : t.graduatedYearCount;

  const salaryTitle = selectedExperience
    ? `${selectedExperience} ${t.salaryRangeByPosition}`
    : t.salaryRangeByPosition;

  const jobTitle = t.graduateJobStatus;

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="users" lang={lang} />

        <section className="min-w-0 flex-1 p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8">
          <div className="mx-auto max-w-[1600px] space-y-5">
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="xl:col-span-2">
                <VerticalGraphCard
                  title={yearTitle}
                  subtitle={t.subtitleYear}
                  items={graduatedYearGraph}
                  barClassName={COLORS.yearBar}
                  emptyText={t.noYear}
                  axisY={t.count}
                  axisX={t.graduatedYear}
                  csvContent={exportCsv(graduatedYearGraph, yearTitle, t)}
                  exportHtml={exportGraphHtml(
                    graduatedYearGraph,
                    yearTitle,
                    t.subtitleYear,
                    "year",
                    t,
                  )}
                  fileTitle={yearTitle}
                  t={t}
                  selectBox={
                    <form className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input type="hidden" name="lang" value={lang} />

                      <AutoSubmitSelect
                        name="degree"
                        defaultValue={selectedDegree}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none transition focus:border-[#0b67a3] dark:border-slate-800 dark:bg-slate-950"
                      >
                        <option value="">{t.anyDegree}</option>
                        {degreeOptions.map((degree) => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                      </AutoSubmitSelect>

                      <Link
                        href={`/admin/users/graduated-years?lang=${lang}`}
                        className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {t.reset}
                      </Link>
                    </form>
                  }
                />
              </div>

              
              
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function VerticalGraphCard({
  title,
  subtitle,
  items,
  barClassName,
  emptyText,
  selectBox,
  csvContent,
  exportHtml,
  fileTitle,
  axisY,
  axisX,
  t,
}: {
  title: string;
  subtitle: string;
  items: GraphItem[];
  barClassName: string;
  emptyText: string;
  selectBox: React.ReactNode;
  csvContent: string;
  exportHtml: string;
  fileTitle: string;
  axisY: string;
  axisX: string;
  t: typeof text.en;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
      <GraphHeader
        title={title}
        subtitle={subtitle}
        selectBox={selectBox}
        csvContent={csvContent}
        exportHtml={exportHtml}
        fileTitle={fileTitle}
        t={t}
      />

      {items.length === 0 ? (
        <EmptyGraph text={emptyText} />
      ) : (
        <div className="overflow-x-auto px-4 pb-5 sm:px-5">
          <div className="relative min-w-[540px] rounded-[28px] bg-slate-50 p-4 dark:bg-slate-950">
            <p className="absolute left-2 top-28 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {axisY}
            </p>

            <div className="ml-8 flex h-[330px] items-end gap-3 border-b-4 border-l-4 border-slate-900 pb-8 pl-4 dark:border-slate-300">
              {items.map((item) => (
                <VerticalBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={maxValue}
                  barClassName={barClassName}
                />
              ))}
            </div>

            <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {axisX}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function SalaryGraphCard({
  title,
  subtitle,
  items,
  emptyText,
  selectBox,
  csvContent,
  exportHtml,
  fileTitle,
  t,
}: {
  title: string;
  subtitle: string;
  items: SalaryItem[];
  emptyText: string;
  selectBox: React.ReactNode;
  csvContent: string;
  exportHtml: string;
  fileTitle: string;
  t: typeof text.en;
}) {
  const maxValue = Math.max(...items.map((item) => item.maxSalary), 1);

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
      <GraphHeader
        title={title}
        subtitle={subtitle}
        selectBox={selectBox}
        csvContent={csvContent}
        exportHtml={exportHtml}
        fileTitle={fileTitle}
        t={t}
      />

      {items.length === 0 ? (
        <EmptyGraph text={emptyText} />
      ) : (
        <div className="overflow-x-auto px-4 pb-5 sm:px-5">
          <div className="relative min-w-[620px] rounded-[28px] bg-slate-50 p-4 dark:bg-slate-950">
            <p className="absolute left-2 top-28 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t.salary}
            </p>

            <div className="mb-4 flex flex-wrap gap-4 pl-9 text-[11px] font-black text-slate-600 dark:text-slate-300">
              <Legend color={COLORS.salaryMin} label={t.min} />
              <Legend color={COLORS.salaryMax} label={t.max} />
            </div>

            <div className="ml-8 flex h-[330px] items-end gap-4 border-b-4 border-l-4 border-slate-900 pb-8 pl-4 dark:border-slate-300">
              {items.map((item) => (
                <div
                  key={item.position}
                  className="flex min-w-[82px] flex-1 flex-col items-center text-center"
                >
                  <div className="flex h-[240px] items-end gap-2">
                    <SalaryBar
                      value={item.minSalary}
                      max={maxValue}
                      label={t.min}
                      className={COLORS.salaryMin}
                    />
                    <SalaryBar
                      value={item.maxSalary}
                      max={maxValue}
                      label={t.max}
                      className={COLORS.salaryMax}
                    />
                  </div>

                  <p
                    title={item.position}
                    className="mt-3 line-clamp-2 max-w-[90px] text-[10px] font-black leading-3 text-slate-600 dark:text-slate-300"
                  >
                    {item.position}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t.position}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function EmploymentGraphCard({
  title,
  subtitle,
  items,
  emptyText,
  selectBox,
  csvContent,
  exportHtml,
  fileTitle,
  t,
}: {
  title: string;
  subtitle: string;
  items: EmploymentItem[];
  emptyText: string;
  selectBox: React.ReactNode;
  csvContent: string;
  exportHtml: string;
  fileTitle: string;
  t: typeof text.en;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
      <GraphHeader
        title={title}
        subtitle={subtitle}
        selectBox={selectBox}
        csvContent={csvContent}
        exportHtml={exportHtml}
        fileTitle={fileTitle}
        t={t}
      />

      {items.length === 0 ? (
        <EmptyGraph text={emptyText} />
      ) : (
        <div className="overflow-x-auto px-4 pb-5 sm:px-5">
          <div className="relative min-w-[760px] rounded-[28px] bg-slate-50 p-4 dark:bg-slate-950">
            <p className="absolute left-[-4px] top-32 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t.percentage}
            </p>

            <div className="mb-4 flex flex-wrap gap-4 pl-9 text-[11px] font-black text-slate-600 dark:text-slate-300">
              <Legend color={COLORS.totalGraduate} label={t.totalGraduate} />
              <Legend color={COLORS.employed} label={t.employed} />
              <Legend color={COLORS.unemployed} label={t.unemployed} />
            </div>

            <div className="ml-8 flex h-[350px] items-end gap-10 border-b-4 border-l-4 border-slate-900 pb-8 pl-5 dark:border-slate-300">
              {items.map((item) => (
                <div
                  key={item.year}
                  className="flex min-w-[120px] flex-1 flex-col items-center text-center"
                >
                  <div className="flex h-[250px] items-end gap-2.5">
                    <PercentBar
                      value={item.totalPercent}
                      count={item.totalCount}
                      label={t.totalGraduate}
                      className={COLORS.totalGraduate}
                    />
                    <PercentBar
                      value={item.employedPercent}
                      count={item.employedCount}
                      label={t.employed}
                      className={COLORS.employed}
                    />
                    <PercentBar
                      value={item.unemployedPercent}
                      count={item.unemployedCount}
                      label={t.unemployed}
                      className={COLORS.unemployed}
                    />
                  </div>

                  <p className="mt-3 text-[12px] font-black text-slate-700 dark:text-slate-200">
                    {item.year}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t.graduatedYear}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function GraphHeader({
  title,
  subtitle,
  selectBox,
  csvContent,
  exportHtml,
  fileTitle,
  t,
}: {
  title: string;
  subtitle: string;
  selectBox: React.ReactNode;
  csvContent: string;
  exportHtml: string;
  fileTitle: string;
  t: typeof text.en;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 p-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-5">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-black sm:text-2xl">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {subtitle}
          </p>
        </div>

        <ExportGraphButtons
          title={fileTitle}
          csv={csvContent}
          html={exportHtml}
          labels={{
            export: t.export,
            exportExcel: t.exportExcel,
            exportWeb: t.exportWeb,
            exportPdf: t.exportPdf,
            printPdf: t.printPdf,
            exportWord: t.exportWord,
          }}
        />
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"></div>
        {selectBox}
      </div>
    </div>
  );
}

function VerticalBar({
  label,
  value,
  max,
  barClassName,
}: {
  label: string;
  value: number;
  max: number;
  barClassName: string;
}) {
  const height = Math.max((value / max) * 230, value === 0 ? 4 : 28);

  return (
    <div className="flex min-w-[54px] flex-1 flex-col items-center text-center">
      <p className="mb-2 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white">
        {value.toLocaleString()}
      </p>

      <div
        className={`w-full max-w-[58px] shadow-xl transition-all duration-300 hover:scale-105 ${barClassName}`}
        style={{ height: `${height}px` }}
      />

      <p
        title={label}
        className="mt-3 line-clamp-2 max-w-[78px] text-[10px] font-black leading-3 text-slate-600 dark:text-slate-300"
      >
        {label}
      </p>
    </div>
  );
}

function SalaryBar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className: string;
}) {
  const height = Math.max((value / max) * 225, value === 0 ? 4 : 28);

  return (
    <div className="flex flex-col items-center">
      <p className="mb-1 text-[9px] font-black text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mb-2 text-[9px] font-black text-slate-800 dark:text-white">
        {value.toLocaleString()}
      </p>

      <div
        className={`w-7 shadow-xl transition-all duration-300 hover:scale-105 ${className}`}
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

function PercentBar({
  value,
  count,
  label,
  className,
}: {
  value: number;
  count: number;
  label: string;
  className: string;
}) {
  const height = Math.max((value / 100) * 235, value === 0 ? 4 : 22);

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-[10px] font-black text-slate-800 dark:text-white">
        {value} %
      </p>

      <div
        title={`${label}: ${value}% (${count})`}
        className={`w-9 shadow-xl transition-all duration-300 hover:scale-105 ${className}`}
        style={{ height: `${height}px` }}
      />

      <p className="mt-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
        {count}
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function EmptyGraph({ text }: { text: string }) {
  return (
    <div className="m-4 rounded-[24px] bg-slate-50 p-10 text-center text-sm font-bold text-slate-400 dark:bg-slate-950 sm:m-5">
      {text}
    </div>
  );
}
