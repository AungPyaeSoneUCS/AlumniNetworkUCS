// file: app/admin/manage-users/page.tsx

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Globe2,
  Mail,
  Trash2,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ApprovedStudent from "@/models/ApprovedStudent";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AutoSubmitManageUsersFilters from "@/components/admin/auto-submit-manage-users-filters";
import PrintUsersButton from "@/components/admin/print-users-button";

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

const text = {
  en: {
    pageTitle: "Manage Users",
    pageSubtitle: "",
    searchPlaceholder: "Search name, email, phone, degree...",
    allDegree: "All Degree",
    allYear: "All Year",
    user: "User",
    degree: "Degree",
    year: "Year",
    phone: "Phone Number",
    actions: "Actions",
    delete: "Delete",
    unknownUser: "Unknown User",
    noEmail: "No email",
    unknown: "Unknown",
    noUsersFound: "No Users Found",
    noUsersText: "Try changing search, year, or degree filters.",
    export: "Export",
    exportExcel: "Excel",
    exportPdf: "PDF",
    exportPrint: "Print",
    exportWeb: "Web",
    exportTitle: "Managed Users Report",
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
    totalUsers: "Users",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",

    reportTitle: "MANAGED USERS REPORT",
    reportGenerated: "Report Generated Date",
    totalUsersLabel: "Total Users",
    allManagedUsers: "All Managed Users",
    usersWithEmail: "Users With Email",
    usersWithPhone: "Users With Phone",
    degreeCategories: "Degree Categories",
    emailLabel: "Email",
    phoneLabel: "Phone",
    degreesLabel: "Degrees",
    officialReport: "Official Report • For Administrative Use Only",
    alumniNetwork: "Alumni Network System",
    noUsersReport: "No managed users found.",
  },

  mm: {
    pageTitle: "အသုံးပြုသူ စီမံခန့်ခွဲမှု",
    pageSubtitle: "",
    searchPlaceholder:
      "အမည်၊ အီးမေးလ်၊ ဖုန်းနံပါတ်၊ ဘွဲ့အမည် ဖြင့် ရှာရန်...",
    allDegree: "ဘွဲ့ အားလုံး",
    allYear: "ခုနှစ် အားလုံး",
    user: "အသုံးပြုသူ",
    degree: "ဘွဲ့",
    year: "ခုနှစ်",
    phone: "ဖုန်းနံပါတ်",
    actions: "လုပ်ဆောင်ချက်များ",
    delete: "ဖျက်ရန်",
    unknownUser: "အမည်မရှိသော အသုံးပြုသူ",
    noEmail: "Email မရှိပါ",
    unknown: "Unknown",
    noUsersFound: "အသုံးပြုသူ မတွေ့ပါ",
    noUsersText: "Search၊ ခုနှစ်၊ Degree filter ပြောင်းကြည့်ပါ။",
    export: "Export",
    exportExcel: "Excel",
    exportPdf: "PDF",
    exportPrint: "Print",
    exportWeb: "Web",
    exportTitle: "Managed Users Report",
    name: "Name",
    email: "Email",
    graduatedYear: "Graduated Year",
    totalUsers: "Users",
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    page: "စာမျက်နှာ",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",

    reportTitle: "MANAGED USERS REPORT",
    reportGenerated: "Report Generated Date",
    totalUsersLabel: "Total Users",
    allManagedUsers: "All Managed Users",
    usersWithEmail: "Users With Email",
    usersWithPhone: "Users With Phone",
    degreeCategories: "Degree Categories",
    emailLabel: "Email",
    phoneLabel: "Phone",
    degreesLabel: "Degrees",
    officialReport: "Official Report • For Administrative Use Only",
    alumniNetwork: "Alumni Network System",
    noUsersReport: "No managed users found.",
  },
};

/* ============================================================
   HELPERS
============================================================ */

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getDegree(user: any, t?: typeof text.en) {
  return cleanText(user?.degree || user?.department) || t?.unknown || "Unknown";
}

function getGraduatedYear(user: any, t?: typeof text.en) {
  return user?.graduatedYear
    ? String(user.graduatedYear)
    : t?.unknown || "Unknown";
}

function getPhone(user: any, t?: typeof text.en) {
  return (
    cleanText(user?.contactInfo?.phone) ||
    cleanText(user?.phone) ||
    cleanText(user?.phoneNumber) ||
    t?.unknown ||
    "Unknown"
  );
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ============================================================
   CSV EXPORT
============================================================ */

function exportRows(users: any[], t: typeof text.en) {
  return [
    [t.name, t.email, t.phone, t.degree, t.graduatedYear],

    ...users.map((user) => [
      user.name || t.unknownUser,
      user.email || "",
      getPhone(user, t),
      getDegree(user, t),
      getGraduatedYear(user, t),
    ]),
  ];
}

function csvCell(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function csvDataUrl(users: any[], t: typeof text.en) {
  const csv = exportRows(users, t)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(
    `\uFEFF${csv}`,
  )}`;
}

/* ============================================================
   JOBS-STYLE HTML / PRINT REPORT
============================================================ */

function exportHtml(users: any[], title: string, t: typeof text.en) {
  const totalUsers = users.length;

  const usersWithEmail = users.filter((user) =>
    cleanText(user?.email),
  ).length;

  const usersWithPhone = users.filter(
    (user) =>
      cleanText(user?.contactInfo?.phone) ||
      cleanText(user?.phone) ||
      cleanText(user?.phoneNumber),
  ).length;

  const degreeCount = new Set(
    users
      .map((user) => getDegree(user, t))
      .filter((degree) => degree && degree !== t.unknown),
  ).size;

  const now = new Date();

  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows =
    users.length > 0
      ? users
          .map(
            (user, index) => `
        <tr>
          <td class="center">${index + 1}</td>

          <td>
            <strong>
              ${escapeHtml(user.name || t.unknownUser)}
            </strong>
          </td>

          <td>
            ${escapeHtml(user.email || t.noEmail)}
          </td>

          <td>
            ${escapeHtml(getPhone(user, t))}
          </td>

          <td>
            <span class="degree-badge">
              ${escapeHtml(getDegree(user, t))}
            </span>
          </td>

          <td class="center">
            ${escapeHtml(getGraduatedYear(user, t))}
          </td>
        </tr>
      `,
          )
          .join("")
      : `
        <tr>
          <td colspan="6" class="empty-row">
            ${escapeHtml(t.noUsersReport)}
          </td>
        </tr>
      `;

  return `<!doctype html>

<html lang="${escapeHtml(
    t === text.mm ? "my" : "en",
  )}">

<head>

  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>${escapeHtml(title)}</title>

  <style>

    :root {
      --primary: #0f766e;
      --primary-dark: #115e59;
      --secondary: #00bfc4;

      --bg-light: #f8fafc;
      --bg-soft: #f1f5f9;

      --text-main: #0f172a;
      --text-muted: #64748b;

      --border: #cbd5e1;
      --border-light: #e2e8f0;

      --green: #16a34a;
      --blue: #0284c7;
      --orange: #d97706;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
    }

    body {
      font-family:
        "Segoe UI",
        Arial,
        Helvetica,
        sans-serif;

      padding: 20px 40px;

      color: var(--text-main);

      background: #ffffff;
    }

    /* ========================================================
       REPORT HEADER
    ======================================================== */

    .report-header {
      display: flex;

      align-items: center;

      border-bottom:
        2px solid var(--primary);

      padding-bottom: 15px;

      margin-bottom: 20px;
    }

    .logo-placeholder {
      width: 80px;
      height: 80px;

      background: var(--bg-light);

      border:
        1px solid var(--border);

      border-radius: 8px;

      margin-right: 20px;

      display: flex;

      align-items: center;
      justify-content: center;

      font-size: 10px;

      color: var(--text-muted);

      object-fit: contain;

      flex-shrink: 0;
    }

    .header-text {
      min-width: 0;
    }

    .header-text h1 {
      margin: 0;

      font-size: 24px;

      color: var(--text-main);

      line-height: 1.25;
    }

    .header-text h2 {
      margin: 4px 0;

      font-size: 14px;

      color: var(--primary);

      font-weight: 600;
    }

    .header-text h3 {
      margin: 0;

      font-size: 20px;

      color: var(--text-main);

      text-transform: uppercase;

      letter-spacing: 0.5px;
    }

    .header-meta {
      margin-top: 8px;

      font-size: 11px;

      color: var(--text-muted);
    }

    /* ========================================================
       SUMMARY CARDS
    ======================================================== */

    .summary-container {
      display: flex;

      gap: 15px;

      margin-bottom: 20px;
    }

    .summary-card {
      flex: 1;

      border:
        1px solid var(--border-light);

      border-radius: 12px;

      padding: 15px;

      display: flex;

      align-items: center;

      gap: 15px;

      background: var(--bg-light);

      min-width: 0;
    }

    .card-icon {
      width: 45px;
      height: 45px;

      border-radius: 50%;

      background: var(--primary);

      color: #ffffff;

      display: flex;

      align-items: center;
      justify-content: center;

      font-weight: bold;

      font-size: 20px;

      flex-shrink: 0;
    }

    .card-icon.blue {
      background: var(--blue);
    }

    .card-icon.green {
      background: var(--green);
    }

    .card-icon.orange {
      background: var(--orange);
    }

    .card-info {
      min-width: 0;
    }

    .card-info p {
      margin: 0;

      font-size: 11px;

      font-weight: bold;

      color: var(--text-muted);

      text-transform: uppercase;
    }

    .card-info h4 {
      margin: 2px 0 0 0;

      font-size: 24px;

      color: var(--text-main);
    }

    .card-info .description {
      text-transform: none;

      font-weight: normal;

      margin-top: 1px;
    }

    /* ========================================================
       TABLE
    ======================================================== */

    table {
      width: 100%;

      border-collapse: collapse;

      margin-bottom: 30px;
    }

    th,
    td {
      border:
        1px solid var(--border);

      padding: 10px 8px;

      font-size: 11px;

      text-align: left;

      vertical-align: middle;
    }

    th {
      background: var(--primary);

      color: #ffffff;

      font-weight: bold;

      text-transform: uppercase;

      font-size: 10px;

      letter-spacing: 0.2px;
    }

    tbody tr:nth-child(even) td {
      background: #f8fafc;
    }

    tbody tr:hover td {
      background: #ecfeff;
    }

    td.center,
    th.center {
      text-align: center;
    }

    td strong {
      font-weight: 700;
    }

    .degree-badge {
      display: inline-block;

      padding: 4px 8px;

      border-radius: 999px;

      background: #ccfbf1;

      color: #0f766e;

      font-size: 10px;

      font-weight: 700;
    }

    .empty-row {
      text-align: center;

      padding: 35px;

      color: var(--text-muted);
    }

    /* ========================================================
       FOOTER
    ======================================================== */

    .footer {
      display: flex;

      justify-content: space-between;

      border-top:
        1px solid var(--border);

      padding-top: 10px;

      font-size: 10px;

      color: var(--text-muted);
    }

    /* ========================================================
       PRINT
    ======================================================== */

    @media print {

      @page {
        size: landscape;

        margin: 0;
      }

      body {
        padding:
          15mm 15mm;

        -webkit-print-color-adjust:
          exact;

        print-color-adjust:
          exact;
      }

      .summary-card {
        break-inside: avoid;
      }

      thead {
        display: table-header-group;
      }

      tr {
        break-inside: avoid;
      }

      tbody tr:hover td {
        background: inherit;
      }
    }

    /* ========================================================
       RESPONSIVE WEB VIEW
    ======================================================== */

    @media screen and (max-width: 900px) {

      body {
        padding: 20px;
      }

      .summary-container {
        flex-wrap: wrap;
      }

      .summary-card {
        flex: 1 1 calc(50% - 15px);
      }

      .report-header {
        align-items: flex-start;
      }

      .header-text h1 {
        font-size: 20px;
      }

      .header-text h3 {
        font-size: 17px;
      }
    }

    @media screen and (max-width: 600px) {

      body {
        padding: 15px;
      }

      .report-header {
        flex-direction: column;
      }

      .logo-placeholder {
        margin-right: 0;
        margin-bottom: 12px;
      }

      .summary-card {
        flex: 1 1 100%;
      }

      .footer {
        flex-direction: column;
        gap: 5px;
      }

      table {
        min-width: 850px;
      }

      .table-wrapper {
        overflow-x: auto;
      }
    }

  </style>

</head>

<body>

  <!-- ========================================================
       HEADER
  ======================================================== -->

  <div class="report-header">

    <img
      src="/logo.png"
      alt="UCSH Logo"
      class="logo-placeholder"
      onerror="this.style.display='none'"
    />

    <div class="header-text">

      <h1>
        University of Computer Studies (Hinthada)
      </h1>

      <h2>
        Alumni Network System
      </h2>

      <h3>
        ${escapeHtml(t.reportTitle)}
      </h3>

      <div class="header-meta">

        ${escapeHtml(t.reportGenerated)}:
        ${escapeHtml(dateStr)}

        &nbsp; | &nbsp;

        Time:
        ${escapeHtml(timeStr)}

      </div>

    </div>

  </div>


  <!-- ========================================================
       SUMMARY CARDS
  ======================================================== -->

  <div class="summary-container">

    <!-- TOTAL USERS -->

    <div class="summary-card">

      <div class="card-icon">
        👥
      </div>

      <div class="card-info">

        <p>
          ${escapeHtml(t.totalUsersLabel)}
        </p>

        <h4>
          ${totalUsers}
        </h4>

        <p class="description">
          ${escapeHtml(t.allManagedUsers)}
        </p>

      </div>

    </div>


    <!-- EMAIL -->

    <div class="summary-card">

      <div class="card-icon blue">
        ✉
      </div>

      <div class="card-info">

        <p>
          ${escapeHtml(t.emailLabel)}
        </p>

        <h4>
          ${usersWithEmail}
        </h4>

        <p class="description">
          ${escapeHtml(t.usersWithEmail)}
        </p>

      </div>

    </div>


    <!-- PHONE -->

    <div class="summary-card">

      <div class="card-icon green">
        ☎
      </div>

      <div class="card-info">

        <p>
          ${escapeHtml(t.phoneLabel)}
        </p>

        <h4>
          ${usersWithPhone}
        </h4>

        <p class="description">
          ${escapeHtml(t.usersWithPhone)}
        </p>

      </div>

    </div>


    <!-- DEGREES -->

    <div class="summary-card">

      <div class="card-icon orange">
        🎓
      </div>

      <div class="card-info">

        <p>
          ${escapeHtml(t.degreesLabel)}
        </p>

        <h4>
          ${degreeCount}
        </h4>

        <p class="description">
          ${escapeHtml(t.degreeCategories)}
        </p>

      </div>

    </div>

  </div>


  <!-- ========================================================
       DATA TABLE
  ======================================================== -->

  <div class="table-wrapper">

    <table>

      <thead>

        <tr>

          <th class="center">
            #
          </th>

          <th>
            ${escapeHtml(t.name)}
          </th>

          <th>
            ${escapeHtml(t.email)}
          </th>

          <th>
            ${escapeHtml(t.phone)}
          </th>

          <th>
            ${escapeHtml(t.degree)}
          </th>

          <th class="center">
            ${escapeHtml(t.graduatedYear)}
          </th>

        </tr>

      </thead>

      <tbody>

        ${rows}

      </tbody>

    </table>

  </div>


  <!-- ========================================================
       FOOTER
  ======================================================== -->

  <div class="footer">

    <span>
      ${escapeHtml(t.alumniNetwork)}
    </span>

    <span>
      ${escapeHtml(t.officialReport)}
    </span>

  </div>

</body>

</html>`;
}

/* ============================================================
   HTML DATA URL
============================================================ */

function htmlDataUrl(
  users: any[],
  title: string,
  t: typeof text.en,
) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    exportHtml(users, title, t),
  )}`;
}

/* ============================================================
   PDF HELPERS
============================================================ */

function pdfEscape(value: any) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");
}

function pdfText(value: any, max = 30) {
  const clean = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  return clean.length > max
    ? `${clean.slice(0, max - 3)}...`
    : clean;
}

function base64Encode(value: string) {
  return Buffer.from(value, "binary").toString("base64");
}

/* ============================================================
   PDF EXPORT
============================================================ */

function pdfDataUrl(
  users: any[],
  title: string,
  t: typeof text.en,
) {
  const pageWidth = 842;
  const pageHeight = 595;

  const margin = 32;

  const tableTop = 492;

  const rowHeight = 24;

  const colWidths = [
    35,
    130,
    210,
    125,
    145,
    95,
  ];

  const tableWidth = colWidths.reduce(
    (sum, width) => sum + width,
    0,
  );

  const headerRow = [
    "#",
    t.name,
    t.email,
    t.phone,
    t.degree,
    t.graduatedYear,
  ];

  const dataRows = users.map((user, index) => [
    String(index + 1),
    user.name || t.unknownUser,
    user.email || "",
    getPhone(user, t),
    getDegree(user, t),
    getGraduatedYear(user, t),
  ]);

  const rowsPerPage = 17;

  const pages: string[][][] = [];

  for (
    let i = 0;
    i < dataRows.length;
    i += rowsPerPage
  ) {
    pages.push([
      headerRow,
      ...dataRows.slice(i, i + rowsPerPage),
    ]);
  }

  if (pages.length === 0) {
    pages.push([headerRow]);
  }

  const colX = colWidths.reduce<number[]>(
    (acc, width) => [
      ...acc,
      acc[acc.length - 1] + width,
    ],
    [margin],
  );

  const pageStreams = pages.map(
    (pageRows, pageIndex) => {
      const tableHeight =
        pageRows.length * rowHeight;

      const commands: string[] = [];

      /* Header */

      commands.push(
        "BT",
        "/F1 20 Tf",
        "0 0 0 rg",
        `${margin} 552 Td`,
        `(${pdfEscape(title)}) Tj`,
        "ET",
      );

      commands.push(
        "BT",
        "/F1 10 Tf",
        "0 0 0 rg",
        `${margin} 528 Td`,
        `(${pdfEscape(
          `University of Computer Studies (Hinthada) | Alumni Network System | Total users: ${users.length} | Page ${
            pageIndex + 1
          } of ${pages.length}`,
        )}) Tj`,
        "ET",
      );

      /* Table header background */

      commands.push(
        "0.91 1 1 rg",
      );

      commands.push(
        `${margin} ${
          tableTop - rowHeight
        } ${tableWidth} ${rowHeight} re f`,
      );

      commands.push(
        "0 0 0 RG",
        "0 0 0 rg",
        "0.7 w",
      );

      /* Horizontal lines */

      for (
        let i = 0;
        i <= pageRows.length;
        i += 1
      ) {
        const y =
          tableTop - i * rowHeight;

        commands.push(
          `${margin} ${y} m ${
            margin + tableWidth
          } ${y} l S`,
        );
      }

      /* Vertical lines */

      colX.forEach((x) => {
        commands.push(
          `${x} ${tableTop} m ${x} ${
            tableTop - tableHeight
          } l S`,
        );
      });

      /* Cells */

      pageRows.forEach(
        (row, rowIndex) => {
          row.forEach(
            (cell, colIndex) => {
              const x =
                colX[colIndex] + 6;

              const y =
                tableTop -
                rowIndex *
                  rowHeight -
                16;

              const maxChars = [
                5,
                20,
                35,
                20,
                22,
                14,
              ][colIndex];

              commands.push(
                "BT",

                rowIndex === 0
                  ? "/F1 9 Tf"
                  : "/F1 8 Tf",

                "0 0 0 rg",

                `${x} ${y} Td`,

                `(${pdfEscape(
                  pdfText(
                    cell,
                    maxChars,
                  ),
                )}) Tj`,

                "ET",
              );
            },
          );
        },
      );

      return commands.join("\n");
    },
  );

  let pdf = "%PDF-1.4\n";

  const objects: string[] = [];

  objects.push(
    "1 0 obj\n" +
      "<< /Type /Catalog /Pages 2 0 R >>\n" +
      "endobj\n",
  );

  const pageObjectNumbers =
    pageStreams.map(
      (_, index) =>
        3 + index * 2,
    );

  const fontObjectNumber =
    3 + pageStreams.length * 2;

  objects.push(
    `2 0 obj\n` +
      `<< /Type /Pages /Kids [` +
      `${pageObjectNumbers
        .map(
          (num) =>
            `${num} 0 R`,
        )
        .join(" ")}` +
      `] /Count ${pageStreams.length} >>\n` +
      `endobj\n`,
  );

  pageStreams.forEach(
    (stream, index) => {
      const pageObj =
        3 + index * 2;

      const contentObj =
        pageObj + 1;

      objects.push(
        `${pageObj} 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 ${pageWidth} ${pageHeight}]
  /Resources <<
    /Font <<
      /F1 ${fontObjectNumber} 0 R
    >>
  >>
  /Contents ${contentObj} 0 R
>>
endobj
`,
      );

      objects.push(
        `${contentObj} 0 obj
<< /Length ${stream.length} >>
stream
${stream}
endstream
endobj
`,
      );
    },
  );

  objects.push(
    `${fontObjectNumber} 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
`,
  );

  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);

    pdf += obj;
  });

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${
    objects.length + 1
  }\n`;

  pdf +=
    "0000000000 65535 f \n";

  offsets.slice(1).forEach(
    (offset) => {
      pdf += `${String(
        offset,
      ).padStart(
        10,
        "0",
      )} 00000 n \n`;
    },
  );

  pdf +=
    `trailer\n` +
    `<< /Size ${
      objects.length + 1
    } /Root 1 0 R >>\n`;

  pdf +=
    `startxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${base64Encode(
    pdf,
  )}`;
}

/* ============================================================
   DELETE USER
============================================================ */

async function deleteUserAccount(
  formData: FormData,
) {
  "use server";

  const id = String(
    formData.get("id") || "",
  );

  if (!id) return;

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  await connectDB();

  const admin: any =
    await User.findOne({
      email: session.user.email,
    })
      .select("_id role")
      .lean();

  if (
    !admin ||
    admin.role !== "admin"
  ) {
    redirect("/admin/login");
  }

  if (
    String(admin._id) === id
  ) {
    return;
  }

  const userToDelete: any =
    await User.findById(id).lean();

  if (userToDelete) {
    if (userToDelete.name) {
      const safeName =
        userToDelete.name
          .trim()
          .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );

      const queryFilter: any = {
        name: new RegExp(
          `^\\s*${safeName}\\s*$`,
          "i",
        ),
      };

      if (
        userToDelete.graduatedYear
      ) {
        queryFilter.graduatedYear =
          Number(
            userToDelete.graduatedYear,
          );
      }

      await ApprovedStudent.updateMany(
        queryFilter,
        {
          $set: {
            registered: false,
          },
        },
      );
    }

    await User.findByIdAndDelete(id);
  }

  revalidatePath(
    "/admin/manage-users",
  );

  revalidatePath(
    "/admin/register-users",
  );

  revalidatePath(
    "/admin/users",
  );

  revalidatePath(
    "/admin/dashboard",
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default async function AdminManageUsersPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{
        q?: string;
        degree?: string;
        year?: string;
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      }>
    | {
        q?: string;
        degree?: string;
        year?: string;
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      };
}) {
  const resolvedSearchParams =
    await Promise.resolve(
      searchParams || {},
    );

  const rawQ = cleanText(
    resolvedSearchParams.q,
  );

  const q =
    rawQ.toLowerCase();

  const selectedDegree =
    cleanText(
      resolvedSearchParams.degree,
    );

  const selectedYear =
    cleanText(
      resolvedSearchParams.year,
    );

  const sortKey =
    cleanText(
      resolvedSearchParams.sort,
    );

  const sortDir =
    resolvedSearchParams.dir ===
    "desc"
      ? "desc"
      : "asc";

  const lang: Lang =
    resolvedSearchParams.lang ===
    "mm"
      ? "mm"
      : "en";

  const t = text[lang];

  /* ----------------------------------------------------------
     AUTH
  ---------------------------------------------------------- */

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  await connectDB();

  const admin: any =
    await User.findOne({
      email: session.user.email,
    })
      .select("_id role")
      .lean();

  if (
    !admin ||
    admin.role !== "admin"
  ) {
    redirect("/admin/login");
  }

  /* ----------------------------------------------------------
     USERS
  ---------------------------------------------------------- */

  const allUsers: any[] =
    await User.find({})
      .sort({
        createdAt: -1,
      })
      .select(
        "_id name email image role degree department graduatedYear contactInfo.phone phone phoneNumber createdAt",
      )
      .lean();

  const users =
    allUsers.filter(
      (user) =>
        user.role !== "admin",
    );

  /* ----------------------------------------------------------
     DEGREE OPTIONS
  ---------------------------------------------------------- */

  const degreeOptions =
    Array.from(
      new Set(
        users
          .map((user) =>
            getDegree(user),
          )
          .filter(
            (degree) =>
              degree &&
              degree !==
                "Unknown",
          ),
      ),
    ).sort((a, b) =>
      a.localeCompare(b),
    );

  /* ----------------------------------------------------------
     YEAR OPTIONS
  ---------------------------------------------------------- */

  const yearOptions =
    Array.from(
      new Set(
        users
          .map((user) =>
            getGraduatedYear(
              user,
            ),
          )
          .filter(
            (year) =>
              year &&
              year !==
                "Unknown",
          ),
      ),
    ).sort(
      (a, b) =>
        Number(b) -
        Number(a),
    );

  /* ----------------------------------------------------------
     FILTER
  ---------------------------------------------------------- */

  let filteredUsers =
    users.filter(
      (user) => {
        const name =
          cleanText(
            user.name,
          ).toLowerCase();

        const email =
          cleanText(
            user.email,
          ).toLowerCase();

        const degree =
          getDegree(user);

        const phone =
          getPhone(
            user,
          ).toLowerCase();

        const year =
          getGraduatedYear(
            user,
          );

        return (
          (!q ||
            name.includes(q) ||
            email.includes(q) ||
            phone.includes(q) ||
            degree
              .toLowerCase()
              .includes(q)) &&

          (!selectedDegree ||
            degree ===
              selectedDegree) &&

          (!selectedYear ||
            year ===
              selectedYear)
        );
      },
    );

  /* ----------------------------------------------------------
     SORT
  ---------------------------------------------------------- */

  if (sortKey) {
    filteredUsers =
      [...filteredUsers].sort(
        (a, b) => {
          let aVal = "";
          let bVal = "";

          if (
            sortKey ===
            "name"
          ) {
            aVal =
              cleanText(
                a.name,
              ).toLowerCase();

            bVal =
              cleanText(
                b.name,
              ).toLowerCase();
          }

          else if (
            sortKey ===
            "phone"
          ) {
            aVal =
              getPhone(
                a,
              ).toLowerCase();

            bVal =
              getPhone(
                b,
              ).toLowerCase();
          }

          else if (
            sortKey ===
            "degree"
          ) {
            aVal =
              getDegree(
                a,
              ).toLowerCase();

            bVal =
              getDegree(
                b,
              ).toLowerCase();
          }

          else if (
            sortKey ===
            "year"
          ) {
            aVal =
              getGraduatedYear(
                a,
              );

            bVal =
              getGraduatedYear(
                b,
              );
          }

          if (
            aVal < bVal
          ) {
            return sortDir ===
              "asc"
              ? -1
              : 1;
          }

          if (
            aVal > bVal
          ) {
            return sortDir ===
              "asc"
              ? 1
              : -1;
          }

          return 0;
        },
      );
  }

  /* ----------------------------------------------------------
     PAGINATION
  ---------------------------------------------------------- */

  const totalPages =
    Math.max(
      Math.ceil(
        filteredUsers.length /
          PAGE_SIZE,
      ),
      1,
    );

  const requestedPage =
    Number(
      resolvedSearchParams.page ||
        "1",
    );

  const currentPage =
    Math.min(
      Math.max(
        Number.isFinite(
          requestedPage,
        )
          ? requestedPage
          : 1,
        1,
      ),
      totalPages,
    );

  const startIndex =
    (currentPage - 1) *
    PAGE_SIZE;

  const paginatedUsers =
    filteredUsers.slice(
      startIndex,
      startIndex +
        PAGE_SIZE,
    );

  const pageNumbers =
    getPagination(
      currentPage,
      totalPages,
    );

  const showingStart =
    filteredUsers.length ===
    0
      ? 0
      : startIndex + 1;

  const showingEnd =
    Math.min(
      startIndex +
        PAGE_SIZE,
      filteredUsers.length,
    );

  /* ----------------------------------------------------------
     PAGE URL
  ---------------------------------------------------------- */

  const makePageHref = (
    pageNumber: number,
  ) => {
    const params =
      new URLSearchParams();

    if (rawQ) {
      params.set(
        "q",
        rawQ,
      );
    }

    if (
      selectedDegree
    ) {
      params.set(
        "degree",
        selectedDegree,
      );
    }

    if (selectedYear) {
      params.set(
        "year",
        selectedYear,
      );
    }

    if (lang) {
      params.set(
        "lang",
        lang,
      );
    }

    if (sortKey) {
      params.set(
        "sort",
        sortKey,
      );
    }

    if (sortDir) {
      params.set(
        "dir",
        sortDir,
      );
    }

    params.set(
      "page",
      String(pageNumber),
    );

    return `/admin/manage-users?${params.toString()}`;
  };

  /* ----------------------------------------------------------
     SORT URL
  ---------------------------------------------------------- */

  const makeSortHref = (
    key: string,
  ) => {
    const params =
      new URLSearchParams();

    if (rawQ) {
      params.set(
        "q",
        rawQ,
      );
    }

    if (
      selectedDegree
    ) {
      params.set(
        "degree",
        selectedDegree,
      );
    }

    if (selectedYear) {
      params.set(
        "year",
        selectedYear,
      );
    }

    if (lang) {
      params.set(
        "lang",
        lang,
      );
    }

    params.set(
      "page",
      "1",
    );

    params.set(
      "sort",
      key,
    );

    params.set(
      "dir",
      sortKey === key &&
        sortDir ===
          "asc"
        ? "desc"
        : "asc",
    );

    return `/admin/manage-users?${params.toString()}`;
  };

  /* ----------------------------------------------------------
     EXPORT DATA
  ---------------------------------------------------------- */

  const exportTitle =
    t.exportTitle;

  const excelHref =
    csvDataUrl(
      filteredUsers,
      t,
    );

  const pdfHref =
    pdfDataUrl(
      filteredUsers,
      exportTitle,
      t,
    );

  const webHref =
    htmlDataUrl(
      filteredUsers,
      exportTitle,
      t,
    );

  const printHtml =
    exportHtml(
      filteredUsers,
      exportTitle,
      t,
    );

  /* ----------------------------------------------------------
     UI
  ---------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">

      <div className="flex min-h-screen">

        <AdminSidebar
          active="manage-users"
          lang={lang}
        />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">

          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">

            {/* ==================================================
                CONTROL HEADER
            ================================================== */}

            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">

              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                <div className="min-w-0">

                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.pageTitle}
                  </h1>

                  <p className="mt-1 max-w-2xl text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.pageSubtitle}
                  </p>

                </div>

                <div className="relative z-50 flex w-full flex-wrap items-center gap-2 overflow-visible xl:w-auto xl:justify-end">

                  {/* EXPORT DROPDOWN */}

                  <details className="group relative z-[200] inline-flex overflow-visible">

                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden">

                      <Download size={15} />

                      {t.export}

                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />

                    </summary>

                    <div className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-400/40 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/50 max-[420px]:left-0 max-[420px]:right-auto">

                      <ExportItem
                        href={excelHref}
                        fileName="managed-users.csv"
                        icon={
                          <FileSpreadsheet
                            size={16}
                          />
                        }
                        text={
                          t.exportExcel
                        }
                      />

                      

                      <div className="flex [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-xl [&>button]:px-3 [&>button]:py-2.5 [&>button]:text-left [&>button]:text-sm [&>button]:font-black [&>button]:text-slate-700 [&>button]:transition-colors [&>button]:hover:bg-slate-100 dark:[&>button]:text-slate-200 dark:[&>button]:hover:bg-slate-700/50">

                        <PrintUsersButton
                          html={
                            printHtml
                          }
                        />

                      </div>

                     

                    </div>

                  </details>

                </div>

              </div>

              {/* FILTERS */}

              <div className="mt-4">

                <AutoSubmitManageUsersFilters
                  lang={lang}
                  q={rawQ}
                  degree={
                    selectedDegree
                  }
                  year={
                    selectedYear
                  }
                  degreeOptions={
                    degreeOptions
                  }
                  yearOptions={
                    yearOptions
                  }
                  labels={{
                    searchPlaceholder:
                      t.searchPlaceholder,

                    allDegree:
                      t.allDegree,

                    allYear:
                      t.allYear,
                  }}
                />

              </div>

            </div>

            {/* ==================================================
                DESKTOP TABLE
            ================================================== */}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 lg:block">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[920px] text-left">

                  <thead className="bg-slate-50 dark:bg-slate-900/80">

                    <tr>

                      <SortableTableHead
                        label={t.user}
                        sortKey="name"
                        currentSortKey={
                          sortKey
                        }
                        currentDir={
                          sortDir
                        }
                        makeSortHref={
                          makeSortHref
                        }
                      />

                      <SortableTableHead
                        label={t.phone}
                        sortKey="phone"
                        currentSortKey={
                          sortKey
                        }
                        currentDir={
                          sortDir
                        }
                        makeSortHref={
                          makeSortHref
                        }
                      />

                      <SortableTableHead
                        label={t.degree}
                        sortKey="degree"
                        currentSortKey={
                          sortKey
                        }
                        currentDir={
                          sortDir
                        }
                        makeSortHref={
                          makeSortHref
                        }
                      />

                      <SortableTableHead
                        label={t.year}
                        sortKey="year"
                        currentSortKey={
                          sortKey
                        }
                        currentDir={
                          sortDir
                        }
                        makeSortHref={
                          makeSortHref
                        }
                      />

                      <TableHead align="right">
                        {t.actions}
                      </TableHead>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">

                    {paginatedUsers.map(
                      (user) => (
                        <tr
                          key={String(
                            user._id,
                          )}
                          className="transition-colors hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10"
                        >

                          <td className="px-4 py-3.5">

                            <UserCell
                              user={
                                user
                              }
                              t={t}
                            />

                          </td>

                          <td className="px-4 py-3.5 text-sm font-black text-slate-700 dark:text-slate-200">

                            {getPhone(
                              user,
                              t,
                            )}

                          </td>

                          <td className="px-4 py-3.5">

                            <Badge>
                              {getDegree(
                                user,
                                t,
                              )}
                            </Badge>

                          </td>

                          <td className="px-4 py-3.5 text-sm font-black dark:text-slate-200">

                            {getGraduatedYear(
                              user,
                              t,
                            )}

                          </td>

                          <td className="px-4 py-3.5">

                            <div className="flex justify-end gap-2">

                              <form
                                action={
                                  deleteUserAccount
                                }
                              >

                                <input
                                  type="hidden"
                                  name="id"
                                  value={String(
                                    user._id,
                                  )}
                                />

                                <button className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition-colors hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white">

                                  <Trash2
                                    size={
                                      14
                                    }
                                  />

                                  {t.delete}

                                </button>

                              </form>

                            </div>

                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>

              </div>

              {filteredUsers.length ===
                0 && (
                <EmptyUsers t={t} />
              )}

            </div>

            {/* ==================================================
                MOBILE CARDS
            ================================================== */}

            <div className="grid gap-4 lg:hidden">

              {paginatedUsers.map(
                (user) => (
                  <article
                    key={String(
                      user._id,
                    )}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
                  >

                    <UserCell
                      user={user}
                      t={t}
                    />

                    <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">

                      <MiniInfo
                        label={t.phone}
                        value={getPhone(
                          user,
                          t,
                        )}
                      />

                      <MiniInfo
                        label={t.degree}
                        value={getDegree(
                          user,
                          t,
                        )}
                      />

                      <MiniInfo
                        label={t.year}
                        value={getGraduatedYear(
                          user,
                          t,
                        )}
                      />

                    </div>

                    <div className="mt-4 flex justify-end">

                      <form
                        action={
                          deleteUserAccount
                        }
                      >

                        <input
                          type="hidden"
                          name="id"
                          value={String(
                            user._id,
                          )}
                        />

                        <button className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-[11px] font-black text-red-600 transition-colors hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white">

                          <Trash2
                            size={14}
                          />

                          {t.delete}

                        </button>

                      </form>

                    </div>

                  </article>
                ),
              )}

              {filteredUsers.length ===
                0 && (
                <EmptyUsers t={t} />
              )}

            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            {filteredUsers.length >
              0 && (
              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                pageNumbers={
                  pageNumbers
                }
                makePageHref={
                  makePageHref
                }
                showingStart={
                  showingStart
                }
                showingEnd={
                  showingEnd
                }
                totalItems={
                  filteredUsers.length
                }
                t={t}
              />
            )}

          </div>

        </section>

      </div>

    </div>
  );
}

/* ============================================================
   PAGINATION NUMBERS
============================================================ */

function getPagination(
  currentPage: number,
  totalPages: number,
) {
  const pages: Array<
    number | "dots"
  > = [];

  if (totalPages <= 7) {
    for (
      let i = 1;
      i <= totalPages;
      i += 1
    ) {
      pages.push(i);
    }

    return pages;
  }

  pages.push(1);

  if (currentPage > 4) {
    pages.push("dots");
  }

  const start =
    Math.max(
      2,
      currentPage - 1,
    );

  const end =
    Math.min(
      totalPages - 1,
      currentPage + 1,
    );

  for (
    let i = start;
    i <= end;
    i += 1
  ) {
    pages.push(i);
  }

  if (
    currentPage <
    totalPages - 3
  ) {
    pages.push("dots");
  }

  pages.push(totalPages);

  return pages;
}

/* ============================================================
   SORTABLE HEADER
============================================================ */

function SortableTableHead({
  label,
  sortKey,
  currentSortKey,
  currentDir,
  makeSortHref,
}: {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentDir: "asc" | "desc";
  makeSortHref: (
    key: string,
  ) => string;
}) {
  const isActive =
    currentSortKey ===
    sortKey;

  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">

      <Link
        href={makeSortHref(
          sortKey,
        )}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-800 dark:hover:text-slate-200"
      >

        {label}

        {isActive ? (
          currentDir ===
          "asc" ? (
            <ArrowUp
              size={14}
              className="text-[#008B8B] dark:text-[#00BFC4]"
            />
          ) : (
            <ArrowDown
              size={14}
              className="text-[#008B8B] dark:text-[#00BFC4]"
            />
          )
        ) : (
          <ArrowUpDown
            size={14}
            className="text-slate-300 dark:text-slate-600"
          />
        )}

      </Link>

    </th>
  );
}

/* ============================================================
   EXPORT BUTTON
============================================================ */

function ExportButton({
  href,
  fileName,
  icon,
  text,
}: {
  href: string;
  fileName: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <a
      href={href}
      download={fileName}
      className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
    >
      {icon}
      {text}
    </a>
  );
}

/* ============================================================
   EXPORT ITEM
============================================================ */

function ExportItem({
  href,
  fileName,
  icon,
  text,
}: {
  href: string;
  fileName: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <a
      href={href}
      download={fileName}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
    >
      {icon}
      {text}
    </a>
  );
}

/* ============================================================
   TABLE HEAD
============================================================ */

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3.5 ${
        align === "right"
          ? "text-right"
          : "text-left"
      } text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}
    >
      {children}
    </th>
  );
}

/* ============================================================
   USER CELL
============================================================ */

function UserCell({
  user,
  t,
}: {
  user: any;
  t: typeof text.en;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">

      <Image
        src={
          user.image ||
          "/avatar.png"
        }
        alt={
          user.name ||
          t.user
        }
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200/80 bg-slate-50 object-cover dark:border-slate-700/80 dark:bg-slate-900"
      />

      <div className="min-w-0">

        <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">

          {user.name ||
            t.unknownUser}

        </h3>

        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">

          <Mail
            size={12}
            className="shrink-0"
          />

          <span className="line-clamp-1">
            {user.email ||
              t.noEmail}
          </span>

        </p>

      </div>

    </div>
  );
}

/* ============================================================
   BADGE
============================================================ */

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full bg-[#00BFC4]/10 px-2.5 py-1.5 text-[11px] font-black text-[#008B8B] dark:bg-[#008B8B]/20 dark:text-cyan-400">
      {children}
    </span>
  );
}

/* ============================================================
   MOBILE INFO
============================================================ */

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">

      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-slate-800 dark:text-slate-200">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   EMPTY USERS
============================================================ */

function EmptyUsers({
  t,
}: {
  t: typeof text.en;
}) {
  return (
    <div className="rounded-2xl p-10 text-center">

      <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />

      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
        {t.noUsersFound}
      </h2>

      <p className="mt-1 text-sm font-bold text-slate-400">
        {t.noUsersText}
      </p>

    </div>
  );
}

/* ============================================================
   PAGINATION
============================================================ */

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  makePageHref,
  showingStart,
  showingEnd,
  totalItems,
  t,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: Array<
    number | "dots"
  >;
  makePageHref: (
    page: number,
  ) => string;
  showingStart: number;
  showingEnd: number;
  totalItems: number;
  t: typeof text.en;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">

          {t.showing}{" "}

          {showingStart}-
          {showingEnd}{" "}

          {t.of}{" "}

          {totalItems}{" "}

          • {t.page}{" "}

          {currentPage}/
          {totalPages}

        </p>

        <div className="flex flex-wrap items-center gap-1.5">

          <PageLink
            href={makePageHref(
              Math.max(
                currentPage - 1,
                1,
              ),
            )}
            disabled={
              currentPage === 1
            }
          >
            {t.previous}
          </PageLink>

          {pageNumbers.map(
            (
              pageNumber,
              index,
            ) =>
              pageNumber ===
              "dots" ? (
                <span
                  key={`dots-${index}`}
                  className="flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-xs font-black text-slate-400 dark:text-slate-600"
                >
                  ...
                </span>
              ) : (
                <PageLink
                  key={
                    pageNumber
                  }
                  href={makePageHref(
                    pageNumber,
                  )}
                  active={
                    pageNumber ===
                    currentPage
                  }
                >
                  {
                    pageNumber
                  }
                </PageLink>
              ),
          )}

          <PageLink
            href={makePageHref(
              Math.min(
                currentPage + 1,
                totalPages,
              ),
            )}
            disabled={
              currentPage ===
              totalPages
            }
          >
            {t.next}
          </PageLink>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   PAGE LINK
============================================================ */

function PageLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="flex h-9 min-w-[36px] cursor-not-allowed items-center justify-center rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-300 dark:bg-slate-800/50 dark:text-slate-600">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-3 text-xs font-black transition-all active:scale-95 ${
        active
          ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md shadow-cyan-500/20"
          : "bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-[#008B8B] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </Link>
  );
}