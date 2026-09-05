// file: app/admin/posts/page.tsx

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MessageCircle,
  Newspaper,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Globe2,
  Heart,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import AdminSidebar from "@/components/admin/admin-sidebar";
import ConfirmDelete from "@/components/admin/confirm-delete";
import PrintUsersButton from "@/components/admin/print-users-button";
import AutoSubmitPostsFilters from "@/components/admin/auto-submit-posts-filters";

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

const text = {
  en: {
    title: "Posts Management",
    title2: "Posts",
    subtitle: " ",
    searchPlaceholder: "Search content, author, email, category...",
    allCategories: "All Categories",
    allAuthors: "All Authors",
    author: "Author",
    email: "Email",
    category: "Category",
    content: "Content",
    likes: "Likes",
    comments: "Comments",
    date: "Date",
    actions: "Action",
    delete: "Delete",
    cancel: "Cancel",
    deleteConfirm: "Delete Post",
    cannotUndo: "This action cannot be undone.",
    noPosts: "No Posts Found",
    noPostsText: "Alumni posts will appear here.",
    unknownAlumni: "Unknown Alumni",
    noEmail: "No email",
    general: "General",
    noContent: "No content",
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    export: "Export",
    reset: "Reset",
    exportTitle: "Posts Export",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
    from: "From",
    to: "To",
    clearDate: "Clear",
  },

  mm: {
    title: "ပို့စ်များ စီမံခန့်ခွဲမှု",
    title2: "ပို့စ်",
    subtitle: " ",
    searchPlaceholder: "Content၊ author၊ email၊ category ဖြင့် ရှာရန်...",
    allCategories: "Category အားလုံး",
    allAuthors: "Author အားလုံး",
    author: "Author",
    email: "Email",
    category: "Category",
    content: "Content",
    likes: "Likes",
    comments: "Comments",
    date: "ရက်စွဲ",
    actions: "လုပ်ဆောင်ချက်",
    delete: "ဖျက်ရန်",
    cancel: "မဖျက်တော့ပါ",
    deleteConfirm: "ပို့စ် ဖျက်မည်လား",
    cannotUndo: "ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။",
    noPosts: "ပို့စ် မတွေ့ပါ",
    noPostsText: "Alumni posts ရှိလာပါက ဒီနေရာတွင် ပြပါမည်။",
    unknownAlumni: "အမည်မရှိသော Alumni",
    noEmail: "Email မရှိပါ",
    general: "General",
    noContent: "Content မရှိပါ",
    excel: "Excel",
    pdf: "PDF",
    web: "Web",
    print: "Print",
    export: "Export",
    reset: "ပြန်စရန်",
    exportTitle: "ပို့စ်စာရင်း Export",
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    page: "စာမျက်နှာ",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",
    from: "မှ",
    to: "ထိ",
    clearDate: "ရှင်းမည်",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value?: string | Date) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const month = date.toLocaleString("en-US", {
    month: "short",
  });

  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function isDateInRange(value: any, from: string, to: string) {
  if (!from && !to) return true;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const current = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (from) {
    const fromDate = new Date(`${from}T00:00:00`);

    if (current < fromDate) {
      return false;
    }
  }

  if (to) {
    const toDate = new Date(`${to}T00:00:00`);

    if (current > toDate) {
      return false;
    }
  }

  return true;
}

function getLikesCount(post: any) {
  return Array.isArray(post.likes) ? post.likes.length : 0;
}

function getCommentsCount(post: any) {
  return Array.isArray(post.comments)
    ? post.comments.length
    : post.commentsCount || 0;
}

function getAuthorImage(author: any) {
  return (
    author?.profileImage ||
    author?.image ||
    author?.googleImage ||
    author?.googleProfileImage ||
    "/avatar.png"
  );
}

function csvCell(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function makeExportRows(posts: any[], t: typeof text.en) {
  return posts.map((post) => {
    const author = post.author || {};

    return [
      author.name || t.unknownAlumni,
      author.email || "",
      post.category || t.general,
      post.content || t.noContent,
      String(getLikesCount(post)),
      String(getCommentsCount(post)),
      formatDate(post.createdAt),
    ];
  });
}

function csvDataUrl(posts: any[], t: typeof text.en) {
  const rows = [
    [
      t.author,
      t.email,
      t.category,
      t.content,
      t.likes,
      t.comments,
      t.date,
    ],
    ...makeExportRows(posts, t),
  ];

  const csv = rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(
    `\uFEFF${csv}`,
  )}`;
}

function exportHtml(posts: any[], title: string, t: typeof text.en) {
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

  const rows = posts
    .map((post, index) => {
      const author = post.author || {};

      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(author.name || t.unknownAlumni)}</td>
          <td>${escapeHtml(author.email || t.noEmail)}</td>
          <td>${escapeHtml(post.category || t.general)}</td>
          <td>${escapeHtml(post.content || t.noContent)}</td>
          <td class="center">${getLikesCount(post)}</td>
          <td class="center">${getCommentsCount(post)}</td>
          <td>${escapeHtml(formatDate(post.createdAt))}</td>
        </tr>
      `;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>

  <style>
    :root {
      --primary: #008B8B;
      --secondary: #00BFC4;
      --bg-light: #f8fafc;
      --text-main: #0f172a;
      --text-muted: #64748b;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: "Segoe UI", Arial, sans-serif;
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
      background: var(--bg-light);
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      object-fit: contain;
    }

    .header-text h1 {
      margin: 0;
      font-size: 24px;
    }

    .header-text h2 {
      margin: 4px 0;
      font-size: 24px;
      color: var(--primary);
      font-weight: 600;
    }

    .header-text h3 {
      margin: 0;
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .header-meta {
      margin-top: 8px;
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
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      background: var(--bg-light);
    }

    .card-icon {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .card-info p {
      margin: 0;
      font-size: 11px;
      font-weight: bold;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .card-info h4 {
      margin: 2px 0 0;
      font-size: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    th,
    td {
      border: 1px solid #cbd5e1;
      padding: 10px 8px;
      font-size: 11px;
      text-align: left;
      vertical-align: top;
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

    td.center,
    th.center {
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
        padding: 15mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
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
    }
  </style>
</head>

<body>

  <div class="report-header">
    <img
      src="/logo.png"
      alt="UCSH Logo"
      class="logo-placeholder"
      onerror="this.style.display='none'"
    />

    <div class="header-text">
      <h1>University of Computer Studies (Hinthada)</h1>
      <h2>Alumni Network</h2>
      <h3>Report of Posts</h3>

      <div class="header-meta">
        Report Generated Date: ${dateStr} | Time: ${timeStr}
      </div>
    </div>
  </div>

  <div class="summary-container">

    <div class="summary-card">
      <div class="card-icon">📰</div>

      <div class="card-info">
        <p>Total Posts</p>
        <h4>${posts.length}</h4>
        <p style="text-transform:none;font-weight:normal;">
          All Alumni Posts
        </p>
      </div>
    </div>

    <div class="summary-card">
      

      <div class="card-info">
        <p>Total Likes</p>
        <h4>
          ${posts.reduce(
            (sum, post) => sum + getLikesCount(post),
            0,
          )}
        </h4>

        <p style="text-transform:none;font-weight:normal;">
          Post Engagement
        </p>
      </div>
    </div>

    <div class="summary-card">
      

      <div class="card-info">
        <p>Total Comments</p>

        <h4>
          ${posts.reduce(
            (sum, post) => sum + getCommentsCount(post),
            0,
          )}
        </h4>

        <p style="text-transform:none;font-weight:normal;">
          Discussions
        </p>
      </div>
    </div>

    <div class="summary-card">
      <div
        class="card-icon"
        style="background:#d97706;"
      >
        👥
      </div>

      <div class="card-info">
        <p>Authors</p>

        <h4>
          ${
            new Set(
              posts
                .map((post) =>
                  post.author?._id
                    ? String(post.author._id)
                    : "",
                )
                .filter(Boolean),
            ).size
          }
        </h4>

        <p style="text-transform:none;font-weight:normal;">
          Alumni Authors
        </p>
      </div>
    </div>

  </div>

  <table>
    <thead>
      <tr>
        <th class="center">#</th>
        <th>${escapeHtml(t.author)}</th>
        <th>${escapeHtml(t.email)}</th>
        <th>${escapeHtml(t.category)}</th>
        <th>${escapeHtml(t.content)}</th>
        <th class="center">${escapeHtml(t.likes)}</th>
        <th class="center">${escapeHtml(t.comments)}</th>
        <th>${escapeHtml(t.date)}</th>
      </tr>
    </thead>

    <tbody>
      ${
        rows ||
        `<tr>
          <td colspan="8" class="center">
            ${escapeHtml(t.noPosts)}
          </td>
        </tr>`
      }
    </tbody>
  </table>

  <div class="footer">
    <span>Alumni Network</span>
    <span>Official Report • For Administrative Use Only</span>
  </div>

</body>
</html>`;
}

function htmlDataUrl(posts: any[], title: string, t: typeof text.en) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    exportHtml(posts, title, t),
  )}`;
}

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

function pdfDataUrl(posts: any[], title: string, t: typeof text.en) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 28;
  const tableTop = 490;
  const rowHeight = 25;

  const colWidths = [
    32,
    110,
    150,
    85,
    235,
    55,
    70,
    75,
  ];

  const maxChars = [
    4,
    18,
    25,
    12,
    38,
    6,
    8,
    11,
  ];

  const tableWidth = colWidths.reduce(
    (sum, width) => sum + width,
    0,
  );

  const headerRow = [
    "No",
    t.author,
    t.email,
    t.category,
    t.content,
    t.likes,
    t.comments,
    t.date,
  ];

  const dataRows = posts.map((post, index) => {
    const author = post.author || {};

    return [
      String(index + 1),
      author.name || t.unknownAlumni,
      author.email || t.noEmail,
      post.category || t.general,
      post.content || t.noContent,
      String(getLikesCount(post)),
      String(getCommentsCount(post)),
      formatDate(post.createdAt),
    ];
  });

  const rowsPerPage = 17;
  const pages: string[][][] = [];

  for (let i = 0; i < dataRows.length; i += rowsPerPage) {
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

  const pageStreams = pages.map((pageRows, pageIndex) => {
    const tableHeight = pageRows.length * rowHeight;

    const commands: string[] = [];

    commands.push(
      "0.0 0.75 0.77 rg",
      `${margin} 530 ${tableWidth} 38 re f`,
      "BT",
      "/F1 18 Tf",
      "1 1 1 rg",
      `${margin + 12} 552 Td`,
      `(${pdfEscape(title)}) Tj`,
      "ET",
    );

    commands.push(
      "BT",
      "/F1 9 Tf",
      "1 1 1 rg",
      `${margin + 12} 537 Td`,
      `(${pdfEscape(
        `Total: ${posts.length}   Page ${
          pageIndex + 1
        } of ${pages.length}`,
      )}) Tj`,
      "ET",
    );

    commands.push(
      "0.90 0.98 0.98 rg",
      `${margin} ${tableTop - rowHeight} ${tableWidth} ${rowHeight} re f`,
      "0.82 0.90 0.94 RG",
      "0.7 w",
    );

    for (let i = 0; i <= pageRows.length; i += 1) {
      const y = tableTop - i * rowHeight;

      commands.push(
        `${margin} ${y} m ${margin + tableWidth} ${y} l S`,
      );
    }

    colX.forEach((x) => {
      commands.push(
        `${x} ${tableTop} m ${x} ${tableTop - tableHeight} l S`,
      );
    });

    pageRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colX[colIndex] + 4;

        const y = tableTop - rowIndex * rowHeight - 16;

        commands.push(
          "BT",
          rowIndex === 0 ? "/F1 7.5 Tf" : "/F1 7 Tf",
          rowIndex === 0
            ? "0.028 0.365 0.416 rg"
            : "0.06 0.09 0.16 rg",
          `${x} ${y} Td`,
          `(${pdfEscape(
            pdfText(cell, maxChars[colIndex]),
          )}) Tj`,
          "ET",
        );
      });
    });

    return commands.join("\n");
  });

  let pdf = "%PDF-1.4\n";
  const objects: string[] = [];

  objects.push(
    "1 0 obj\n" +
      "<< /Type /Catalog /Pages 2 0 R >>\n" +
      "endobj\n",
  );

  const pageObjectNumbers = pageStreams.map(
    (_, index) => 3 + index * 2,
  );

  const fontObjectNumber = 3 + pageStreams.length * 2;

  objects.push(
    `2 0 obj\n` +
      `<< /Type /Pages /Kids [` +
      `${pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")}` +
      `] /Count ${pageStreams.length} >>\n` +
      `endobj\n`,
  );

  pageStreams.forEach((stream, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;

    objects.push(
      `${pageObj} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R ` +
        `/MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
        `/Resources << /Font << /F1 ` +
        `${fontObjectNumber} 0 R >> >> ` +
        `/Contents ${contentObj} 0 R >>\n` +
        `endobj\n`,
    );

    objects.push(
      `${contentObj} 0 obj\n` +
        `<< /Length ${stream.length} >>\n` +
        `stream\n${stream}\n` +
        `endstream\n` +
        `endobj\n`,
    );
  });

  objects.push(
    `${fontObjectNumber} 0 obj\n` +
      `<< /Type /Font /Subtype /Type1 ` +
      `/BaseFont /Helvetica >>\n` +
      `endobj\n`,
  );

  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n`;

  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\n`;

  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${base64Encode(pdf)}`;
}

function getPagination(currentPage: number, totalPages: number) {
  const pages: Array<number | "dots"> = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }

    return pages;
  }

  pages.push(1);

  if (currentPage > 4) {
    pages.push("dots");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (currentPage < totalPages - 3) {
    pages.push("dots");
  }

  pages.push(totalPages);

  return pages;
}

async function deletePost(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");

  if (!id) return;

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  await connectDB();

  const admin: any = await User.findOne({
    email: session.user.email,
  })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") {
    redirect("/admin/login");
  }

  await Post.findByIdAndDelete(id);

  revalidatePath("/admin/posts");
  revalidatePath("/admin/dashboard");
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{
        q?: string;
        category?: string;
        author?: string;
        from?: string;
        to?: string;
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      }>
    | {
        q?: string;
        category?: string;
        author?: string;
        from?: string;
        to?: string;
        page?: string;
        lang?: Lang;
        sort?: string;
        dir?: "asc" | "desc";
      };
}) {
  const resolvedSearchParams = await Promise.resolve(
    searchParams || {},
  );

  const rawQ = cleanText(resolvedSearchParams.q);

  const q = rawQ.toLowerCase();

  const selectedCategory = cleanText(resolvedSearchParams.category);

  const selectedAuthor = cleanText(resolvedSearchParams.author);

  const selectedFrom = cleanText(resolvedSearchParams.from);

  const selectedTo = cleanText(resolvedSearchParams.to);

  const sortKey = cleanText(resolvedSearchParams.sort);

  const sortDir =
    resolvedSearchParams.dir === "desc" ? "desc" : "asc";

  const lang: Lang =
    resolvedSearchParams.lang === "mm" ? "mm" : "en";

  const t = text[lang];

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  await connectDB();

  const admin: any = await User.findOne({
    email: session.user.email,
  })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") {
    redirect("/admin/login");
  }

  const posts: any[] = await Post.find({})
    .sort({ createdAt: -1 })
    .populate(
      "author",
      "name email image profileImage googleImage googleProfileImage department graduatedYear",
    )
    .lean();

  const categories = Array.from(
    new Set(
      posts
        .map((post) =>
          cleanText(post.category || t.general),
        )
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const authors = Array.from(
    new Map(
      posts
        .map((post) => post.author)
        .filter(Boolean)
        .map((author: any) => [
          String(author._id),
          {
            id: String(author._id),
            name: author.name || t.unknownAlumni,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  let filteredPosts = posts.filter((post) => {
    const author = post.author || {};

    const likesCount = getLikesCount(post);

    const commentsCount = getCommentsCount(post);

    const searchable = [
      post.content,
      post.category,
      author.name,
      author.email,
      String(likesCount),
      String(commentsCount),
    ]
      .map((value) => cleanText(value).toLowerCase())
      .join(" ");

    return (
      (!q || searchable.includes(q)) &&
      (!selectedCategory ||
        (post.category || t.general) === selectedCategory) &&
      (!selectedAuthor ||
        String(author._id) === selectedAuthor) &&
      isDateInRange(post.createdAt, selectedFrom, selectedTo)
    );
  });

  if (sortKey) {
    filteredPosts = [...filteredPosts].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      if (sortKey === "author") {
        aVal = cleanText(a.author?.name).toLowerCase();
        bVal = cleanText(b.author?.name).toLowerCase();
      } else if (sortKey === "category") {
        aVal = cleanText(a.category).toLowerCase();
        bVal = cleanText(b.category).toLowerCase();
      } else if (sortKey === "content") {
        aVal = cleanText(a.content).toLowerCase();
        bVal = cleanText(b.content).toLowerCase();
      } else if (sortKey === "likes") {
        aVal = getLikesCount(a);
        bVal = getLikesCount(b);
      } else if (sortKey === "comments") {
        aVal = getCommentsCount(a);
        bVal = getCommentsCount(b);
      } else if (sortKey === "date") {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      }

      if (aVal < bVal) {
        return sortDir === "asc" ? -1 : 1;
      }

      if (aVal > bVal) {
        return sortDir === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  const totalPages = Math.max(
    Math.ceil(filteredPosts.length / PAGE_SIZE),
    1,
  );

  const requestedPage = Number(
    resolvedSearchParams.page || "1",
  );

  const currentPage = Math.min(
    Math.max(
      Number.isFinite(requestedPage) ? requestedPage : 1,
      1,
    ),
    totalPages,
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedPosts = filteredPosts.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const pageNumbers = getPagination(currentPage, totalPages);

  const showingStart =
    filteredPosts.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(
    startIndex + PAGE_SIZE,
    filteredPosts.length,
  );

  const makePageHref = (pageNumber: number) => {
    const params = new URLSearchParams();

    if (rawQ) params.set("q", rawQ);

    if (selectedCategory) params.set("category", selectedCategory);

    if (selectedAuthor) params.set("author", selectedAuthor);

    if (selectedFrom) params.set("from", selectedFrom);

    if (selectedTo) params.set("to", selectedTo);

    if (lang) params.set("lang", lang);

    if (sortKey) params.set("sort", sortKey);

    if (sortDir) params.set("dir", sortDir);

    params.set("page", String(pageNumber));

    return `/admin/posts?${params.toString()}`;
  };

  const makeSortHref = (key: string) => {
    const params = new URLSearchParams();

    if (rawQ) params.set("q", rawQ);

    if (selectedCategory) params.set("category", selectedCategory);

    if (selectedAuthor) params.set("author", selectedAuthor);

    if (selectedFrom) params.set("from", selectedFrom);

    if (selectedTo) params.set("to", selectedTo);

    if (lang) params.set("lang", lang);

    params.set("page", "1");

    params.set("sort", key);

    params.set(
      "dir",
      sortKey === key && sortDir === "asc" ? "desc" : "asc",
    );

    return `/admin/posts?${params.toString()}`;
  };

  const exportTitle = t.exportTitle;

  const excelHref = csvDataUrl(filteredPosts, t);

  const pdfHref = pdfDataUrl(filteredPosts, exportTitle, t);

  const webHref = htmlDataUrl(filteredPosts, exportTitle, t);

  const printHtml = exportHtml(filteredPosts, exportTitle, t);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="posts" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">

            {/* Header + Filters */}
            <div className="relative overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">

              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.title}
                  </h1>

                  <p className="mt-1 max-w-2xl text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.subtitle}
                  </p>
                </div>

                <div className="relative flex w-full flex-wrap items-center justify-end gap-2 overflow-visible xl:w-auto">

                  <details className="group relative inline-flex overflow-visible xl:z-[200]">

                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden">
                      <Download size={15} />
                      {t.export}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>

                    <div className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-400/40 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/50">

                      <ExportItem
                        href={excelHref}
                        fileName="posts-export.csv"
                        icon={<FileSpreadsheet size={16} />}
                        text={t.excel}
                      />

                      <div className="flex [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-xl [&>button]:px-3 [&>button]:py-2.5 [&>button]:text-left [&>button]:text-sm [&>button]:font-black [&>button]:text-slate-700 [&>button]:transition-colors [&>button]:hover:bg-slate-100 dark:[&>button]:text-slate-200 dark:[&>button]:hover:bg-slate-700/50">
                        <PrintUsersButton html={printHtml} />
                      </div>

                    </div>
                  </details>

                </div>
              </div>

              <div className="mt-4">
                <AutoSubmitPostsFilters
                  lang={lang}
                  q={rawQ}
                  category={selectedCategory}
                  author={selectedAuthor}
                  from={selectedFrom}
                  to={selectedTo}
                  categories={categories}
                  authors={authors}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  labels={{
                    searchPlaceholder: t.searchPlaceholder,
                    allCategories: t.allCategories,
                    allAuthors: t.allAuthors,
                    from: t.from,
                    to: t.to,
                    reset: t.reset,
                    clearDate: t.clearDate,
                  }}
                />
              </div>

            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-visible rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 lg:block">

              <div className="w-full overflow-x-auto rounded-2xl">

                <table className="w-full min-w-[1100px] text-left">

                  <thead className="bg-slate-50 dark:bg-slate-900/80">
                    <tr>

                      <TableHead align="center">No</TableHead>

                      <SortableTableHead
                        label={t.author}
                        sortKey="author"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />

                      <SortableTableHead
                        label={t.category}
                        sortKey="category"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />

                      <SortableTableHead
                        label={t.content}
                        sortKey="content"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />

                      <SortableTableHead
                        label={t.likes}
                        sortKey="likes"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                        align="center"
                      />

                      <SortableTableHead
                        label={t.comments}
                        sortKey="comments"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                        align="center"
                      />

                      <SortableTableHead
                        label={t.date}
                        sortKey="date"
                        currentSortKey={sortKey}
                        currentDir={sortDir}
                        makeSortHref={makeSortHref}
                      />

                      <TableHead align="right">{t.actions}</TableHead>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">

                    {paginatedPosts.map((post, index) => {
                      const author = post.author || {};

                      return (
                        <tr
                          key={String(post._id)}
                          className="transition hover:bg-cyan-50/40 dark:hover:bg-[#008B8B]/10"
                        >

                          <td className="px-4 py-3.5 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                            {startIndex + index + 1}
                          </td>

                          <td className="px-4 py-3.5">
                            <AuthorCell author={author} t={t} />
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge>
                              {post.category || t.general}
                            </Badge>
                          </td>

                          <td className="max-w-[430px] px-4 py-3.5">
                            <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-600 dark:text-slate-300">
                              {post.content || t.noContent}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center gap-1 text-sm font-black text-slate-700 dark:text-slate-300">
                              {getLikesCount(post)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center gap-1 text-sm font-black text-slate-700 dark:text-slate-300">
                              {getCommentsCount(post)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                            {formatDate(post.createdAt)}
                          </td>

                          <td className="px-4 py-3.5">
                            <PostActions post={post} t={t} />
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>
                </table>
              </div>

              {filteredPosts.length === 0 && <EmptyPosts t={t} />}

            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 lg:hidden">

              {paginatedPosts.map((post, index) => {
                const author = post.author || {};

                return (
                  <article
                    key={`mobile-${String(post._id)}`}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-start gap-2">
                        <span className="mt-2 text-xs font-black text-slate-400">
                          #{startIndex + index + 1}
                        </span>
                        <AuthorCell author={author} t={t} />
                      </div>

                      <Badge>
                        {post.category || t.general}
                      </Badge>

                    </div>

                    <p className="mt-4 line-clamp-4 text-sm font-semibold leading-5 text-slate-600 dark:text-slate-300">
                      {post.content || t.noContent}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3">

                      <MiniInfo
                        label={t.likes}
                        value={getLikesCount(post)}
                      />

                      <MiniInfo
                        label={t.comments}
                        value={getCommentsCount(post)}
                      />

                      <MiniInfo
                        label={t.date}
                        value={formatDate(post.createdAt)}
                      />

                    </div>

                    <div className="mt-4">
                      <PostActions post={post} t={t} mobile />
                    </div>

                  </article>
                );
              })}

              {filteredPosts.length === 0 && <EmptyPosts t={t} />}

            </div>

            {/* Pagination */}
            {filteredPosts.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageNumbers={pageNumbers}
                makePageHref={makePageHref}
                showingStart={showingStart}
                showingEnd={showingEnd}
                totalItems={filteredPosts.length}
                t={t}
              />
            )}

          </div>
        </section>
      </div>
    </div>
  );
}

function SortableTableHead({
  label,
  sortKey,
  currentSortKey,
  currentDir,
  makeSortHref,
  align = "left",
}: {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentDir: "asc" | "desc";
  makeSortHref: (key: string) => string;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentSortKey === sortKey;

  const alignClasses =
    align === "right"
      ? "text-right justify-end"
      : align === "center"
        ? "text-center justify-center"
        : "text-left justify-start";

  return (
    <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      <Link
        href={makeSortHref(sortKey)}
        className={`inline-flex w-full items-center gap-1.5 transition-colors hover:text-slate-800 dark:hover:text-slate-200 ${alignClasses}`}
      >
        {label}

        {isActive ? (
          currentDir === "asc" ? (
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

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={`px-4 py-3.5 ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      } text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500`}
    >
      {children}
    </th>
  );
}

function AuthorCell({
  author,
  t,
}: {
  author: any;
  t: typeof text.en;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Image
        src={getAuthorImage(author)}
        alt={author.name || t.unknownAlumni}
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200/80 bg-slate-50 object-cover dark:border-slate-700/80 dark:bg-slate-900"
      />

      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">
          {author.name || t.unknownAlumni}
        </p>

        <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          {author.email || t.noEmail}
        </p>
      </div>
    </div>
  );
}

function PostActions({
  post,
  t,
  mobile,
}: {
  post: any;
  t: typeof text.en;
  mobile?: boolean;
}) {
  return (
    <div
      className={`flex gap-2 ${
        mobile ? "grid grid-cols-1" : "justify-end"
      }`}
    >
      <ConfirmDelete
        action={deletePost}
        id={String(post._id)}
        t={{ deleteConfirm: t.deleteConfirm, cancel: t.cancel, delete: t.delete, cannotUndo: t.cannotUndo }}
        label={t.delete}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition-colors hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
      />
    </div>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </span>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/50">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-black text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function EmptyPosts({
  t,
}: {
  t: typeof text.en;
}) {
  return (
    <div className="p-10 text-center">
      <Newspaper className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />

      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
        {t.noPosts}
      </h2>

      <p className="mt-1 text-sm font-bold text-slate-400">
        {t.noPostsText}
      </p>
    </div>
  );
}

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
  pageNumbers: Array<number | "dots">;
  makePageHref: (page: number) => string;
  showingStart: number;
  showingEnd: number;
  totalItems: number;
  t: typeof text.en;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {t.showing} {showingStart}-{showingEnd} {t.of}{" "}
          {totalItems} • {t.page} {currentPage}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <PageLink
            href={makePageHref(
              Math.max(currentPage - 1, 1),
            )}
            disabled={currentPage === 1}
          >
            {t.previous}
          </PageLink>

          {pageNumbers.map((pageNumber, index) =>
            pageNumber === "dots" ? (
              <span
                key={`dots-${index}`}
                className="flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-xs font-black text-slate-400 dark:text-slate-600"
              >
                ...
              </span>
            ) : (
              <PageLink
                key={pageNumber}
                href={makePageHref(pageNumber)}
                active={pageNumber === currentPage}
              >
                {pageNumber}
              </PageLink>
            ),
          )}

          <PageLink
            href={makePageHref(
              Math.min(currentPage + 1, totalPages),
            )}
            disabled={currentPage === totalPages}
          >
            {t.next}
          </PageLink>
        </div>
      </div>
    </div>
  );
}

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