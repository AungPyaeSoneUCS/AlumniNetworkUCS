// file: app/admin/posts/page.tsx

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Newspaper,
  Printer,
  Search,
  Trash2,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import AdminSidebar from "@/components/admin/admin-sidebar";

type Lang = "en" | "mm";

const PAGE_SIZE = 10;

const text = {
  en: {
    title: "Posts Management",
    subtitle: "Review alumni posts and remove unwanted content.",
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
    actions: "Actions",
    delete: "Delete",
    noPosts: "No Posts Found",
    noPostsText: "Alumni posts will appear here.",
    unknownAlumni: "Unknown Alumni",
    noEmail: "No email",
    general: "General",
    noContent: "No content",
    excel: "Excel",
    web: "Web",
    exportPdf: "PDF",
    print: "Print",
    export: "Export",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
    from: "From",
    to: "To",
  },

  mm: {
    title: "ပို့စ်များ စီမံရန်",
    subtitle: "Alumni posts များကို စစ်ဆေးပြီး မလိုအပ်သော content များကို ဖျက်နိုင်သည်။",
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
    noPosts: "ပို့စ် မတွေ့ပါ",
    noPostsText: "Alumni posts ရှိလာပါက ဒီနေရာတွင် ပြပါမည်။",
    unknownAlumni: "အမည်မရှိသော Alumni",
    noEmail: "Email မရှိပါ",
    general: "General",
    noContent: "Content မရှိပါ",
    excel: "Excel",
    web: "Web",
    exportPdf: "PDF",
    print: "Print",
    export: "Export",
    showing: "ပြနေသည်",
    of: "ထဲမှ",
    page: "စာမျက်နှာ",
    previous: "ရှေ့သို့",
    next: "နောက်သို့",
    from: "မှ",
    to: "ထိ",
  },
};

async function deletePost(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  if (!id) return;

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  await Post.findByIdAndDelete(id);

  revalidatePath("/admin/posts");
  revalidatePath("/admin/dashboard");
}

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value?: string | Date) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function isDateInRange(value: any, from: string, to: string) {
  if (!from && !to) return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (from) {
    const fromDate = new Date(from);
    if (current < fromDate) return false;
  }

  if (to) {
    const toDate = new Date(to);
    if (current > toDate) return false;
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

    return {
      author: author.name || t.unknownAlumni,
      email: author.email || "",
      category: post.category || t.general,
      content: post.content || "",
      likes: String(getLikesCount(post)),
      comments: String(getCommentsCount(post)),
      date: formatDate(post.createdAt),
    };
  });
}

function csvDataUrl(posts: any[], t: typeof text.en) {
  const rows = [
    [t.author, t.email, t.category, t.content, t.likes, t.comments, t.date],
    ...makeExportRows(posts, t).map((row) => [
      row.author,
      row.email,
      row.category,
      row.content,
      row.likes,
      row.comments,
      row.date,
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
}

function exportDocumentHtml(posts: any[], t: typeof text.en, autoPrint = false) {
  const rows = makeExportRows(posts, t)
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.author)}</td>
          <td>${escapeHtml(row.email)}</td>
          <td>${escapeHtml(row.category)}</td>
          <td class="content">${escapeHtml(row.content || t.noContent)}</td>
          <td class="center">${escapeHtml(row.likes)}</td>
          <td class="center">${escapeHtml(row.comments)}</td>
          <td>${escapeHtml(row.date)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t.title)}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif;padding:24px}
    .sheet{max-width:1200px;margin:0 auto;background:white;border:1px solid #cbd5e1;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.12)}
    .hero{background:linear-gradient(135deg,#25C9C8,#008B8B);color:white;padding:22px 24px}
    .hero h1{font-size:24px;line-height:1.2;margin:0;font-weight:900}
    .hero p{margin:6px 0 0;font-size:13px;font-weight:700;opacity:.92}
    .body{padding:18px}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{border:1px solid #dbeafe;padding:10px 9px;text-align:left;font-size:12px;vertical-align:top;word-wrap:break-word}
    th{background:#e0fafa;color:#075985;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
    tr:nth-child(even) td{background:#f8fafc}
    td.center{text-align:center;font-weight:900}
    td.content{line-height:1.45}
    .footer{padding:0 18px 18px;color:#64748b;font-size:11px;font-weight:700}
    @media print{
      body{background:white;padding:0}
      .sheet{max-width:none;border:0;border-radius:0;box-shadow:none}
      .hero{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      tr:nth-child(even) td{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      @page{size:landscape;margin:12mm}
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="hero">
      <h1>${escapeHtml(t.title)}</h1>
      <p>Total: ${posts.length} • Exported: ${escapeHtml(formatDate(new Date()))}</p>
    </section>
    <section class="body">
      <table>
        <thead>
          <tr>
            <th style="width:44px">No</th>
            <th style="width:150px">${escapeHtml(t.author)}</th>
            <th style="width:190px">${escapeHtml(t.email)}</th>
            <th style="width:100px">${escapeHtml(t.category)}</th>
            <th>${escapeHtml(t.content)}</th>
            <th style="width:70px">${escapeHtml(t.likes)}</th>
            <th style="width:90px">${escapeHtml(t.comments)}</th>
            <th style="width:110px">${escapeHtml(t.date)}</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="8" class="center">${escapeHtml(t.noPosts)}</td></tr>`}</tbody>
      </table>
    </section>
    <p class="footer">Alumni Network Admin Export</p>
  </main>
  ${
    autoPrint
      ? `<script>
          window.addEventListener("load", () => {
            setTimeout(() => {
              window.focus();
              window.print();
            }, 350);
          });
        </script>`
      : ""
  }
</body>
</html>`;
}

function htmlDataUrl(posts: any[], t: typeof text.en) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(exportDocumentHtml(posts, t))}`;
}

function printDataUrl(posts: any[], t: typeof text.en) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(exportDocumentHtml(posts, t, true))}`;
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
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

function base64Encode(value: string) {
  return Buffer.from(value, "binary").toString("base64");
}

function pdfDataUrl(posts: any[], t: typeof text.en) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 28;
  const tableTop = 488;
  const rowHeight = 25;
  const colWidths = [32, 120, 165, 88, 235, 50, 70, 74];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

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

  const dataRows = makeExportRows(posts, t).map((row, index) => [
    String(index + 1),
    row.author,
    row.email,
    row.category,
    row.content,
    row.likes,
    row.comments,
    row.date,
  ]);

  const rowsPerPage = 17;
  const pages: string[][][] = [];

  for (let i = 0; i < dataRows.length; i += rowsPerPage) {
    pages.push([headerRow, ...dataRows.slice(i, i + rowsPerPage)]);
  }

  if (pages.length === 0) pages.push([headerRow]);

  const colX = colWidths.reduce<number[]>(
    (acc, width) => [...acc, acc[acc.length - 1] + width],
    [margin],
  );

  const pageStreams = pages.map((pageRows, pageIndex) => {
    const tableHeight = pageRows.length * rowHeight;
    const commands: string[] = [];

    commands.push(
      "0.145 0.788 0.784 rg",
      `${margin} 528 ${tableWidth} 40 re f`,
      "BT",
      "/F1 18 Tf",
      "1 1 1 rg",
      `${margin + 12} 552 Td`,
      `(${pdfEscape(t.title)}) Tj`,
      "ET",
      "BT",
      "/F1 9 Tf",
      "1 1 1 rg",
      `${margin + 12} 536 Td`,
      `(${pdfEscape(`Total: ${posts.length}   Page ${pageIndex + 1} of ${pages.length}`)}) Tj`,
      "ET",
    );

    commands.push(
      "0.878 0.980 0.980 rg",
      `${margin} ${tableTop - rowHeight} ${tableWidth} ${rowHeight} re f`,
    );

    commands.push("0.82 0.90 0.94 RG", "0.7 w");

    for (let i = 0; i <= pageRows.length; i += 1) {
      const y = tableTop - i * rowHeight;
      commands.push(`${margin} ${y} m ${margin + tableWidth} ${y} l S`);
    }

    colX.forEach((x) => {
      commands.push(`${x} ${tableTop} m ${x} ${tableTop - tableHeight} l S`);
    });

    pageRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colX[colIndex] + 4;
        const y = tableTop - rowIndex * rowHeight - 16;
        const maxChars = [4, 18, 27, 12, 38, 6, 8, 11][colIndex];

        commands.push(
          "BT",
          rowIndex === 0 ? "/F1 7.5 Tf" : "/F1 7 Tf",
          rowIndex === 0 ? "0.028 0.365 0.416 rg" : "0.06 0.09 0.16 rg",
          `${x} ${y} Td`,
          `(${pdfEscape(pdfText(cell, maxChars))}) Tj`,
          "ET",
        );
      });
    });

    return commands.join("\n");
  });

  let pdf = "%PDF-1.4\n";
  const objects: string[] = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  const pageObjectNumbers = pageStreams.map((_, index) => 3 + index * 2);
  const fontObjectNumber = 3 + pageStreams.length * 2;

  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers
      .map((num) => `${num} 0 R`)
      .join(" ")}] /Count ${pageStreams.length} >>\nendobj\n`,
  );

  pageStreams.forEach((stream, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;

    objects.push(
      `${pageObj} 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObj} 0 R >>
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
  });

  objects.push(
    `${fontObjectNumber} 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
`,
  );

  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${base64Encode(pdf)}`;
}

function getPagination(currentPage: number, totalPages: number) {
  const pages: Array<number | "dots"> = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (currentPage > 4) pages.push("dots");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i += 1) pages.push(i);

  if (currentPage < totalPages - 3) pages.push("dots");
  pages.push(totalPages);

  return pages;
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
      }>
    | {
        q?: string;
        category?: string;
        author?: string;
        from?: string;
        to?: string;
        page?: string;
        lang?: Lang;
      };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const rawQ = cleanText(resolvedSearchParams.q);
  const q = rawQ.toLowerCase();
  const selectedCategory = cleanText(resolvedSearchParams.category);
  const selectedAuthor = cleanText(resolvedSearchParams.author);
  const selectedFrom = cleanText(resolvedSearchParams.from);
  const selectedTo = cleanText(resolvedSearchParams.to);
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const posts: any[] = await Post.find({})
    .sort({ createdAt: -1 })
    .populate("author", "name email image profileImage googleImage googleProfileImage department graduatedYear")
    .lean();

  const categories = Array.from(
    new Set(posts.map((post) => cleanText(post.category || t.general))),
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

  const filteredPosts = posts.filter((post) => {
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
      (!selectedAuthor || String(author._id) === selectedAuthor) &&
      isDateInRange(post.createdAt, selectedFrom, selectedTo)
    );
  });

  const totalPages = Math.max(Math.ceil(filteredPosts.length / PAGE_SIZE), 1);
  const requestedPage = Number(resolvedSearchParams.page || "1");
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);

  const excelHref = csvDataUrl(filteredPosts, t);
  const webHref = htmlDataUrl(filteredPosts, t);
  const pdfHref = pdfDataUrl(filteredPosts, t);
  const printHref = printDataUrl(filteredPosts, t);

  const makePageHref = (pageNumber: number) => {
    const params = new URLSearchParams();

    if (rawQ) params.set("q", rawQ);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedAuthor) params.set("author", selectedAuthor);
    if (selectedFrom) params.set("from", selectedFrom);
    if (selectedTo) params.set("to", selectedTo);
    if (lang) params.set("lang", lang);
    params.set("page", String(pageNumber));

    return `/admin/posts?${params.toString()}`;
  };

  const pageNumbers = getPagination(currentPage, totalPages);
  const showingStart = filteredPosts.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, filteredPosts.length);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar active="posts" lang={lang} />

        <section className="min-w-0 flex-1 px-3 pb-5 pt-16 sm:px-4 lg:px-5 lg:pt-5">
          <div className="mx-auto max-w-7xl space-y-3">
            <div className="overflow-visible rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                    {t.title}
                  </h1>
                  <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.subtitle}
                  </p>
                </div>

                <div className="relative z-50 flex flex-wrap items-center gap-2 overflow-visible lg:justify-end">
                  <ExportButton href={excelHref} fileName="posts.csv">
                    <FileSpreadsheet className="h-4 w-4" />
                    {t.excel}
                  </ExportButton>

                  <ExportButton href={pdfHref} fileName="posts.pdf">
                    <FileText className="h-4 w-4" />
                    {t.exportPdf}
                  </ExportButton>

                  <a
                    href={printHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    {t.print}
                  </a>

                  <ExportButton href={webHref} fileName="posts.html">
                    <Download className="h-4 w-4" />
                    {t.web}
                  </ExportButton>

                  <div className="group relative overflow-visible">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                    >
                      {t.export}
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    <div className="invisible absolute right-0 top-full z-[999] mt-2 w-44 translate-y-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <DropdownExportItem href={excelHref} fileName="posts.csv">
                        {t.excel}
                      </DropdownExportItem>
                      <DropdownExportItem href={pdfHref} fileName="posts.pdf">
                        {t.exportPdf}
                      </DropdownExportItem>
                      <DropdownExportItem href={printHref} target>
                        {t.print}
                      </DropdownExportItem>
                      <DropdownExportItem href={webHref} fileName="posts.html">
                        {t.web}
                      </DropdownExportItem>
                    </div>
                  </div>
                </div>
              </div>

              <form
                id="posts-filter-form"
                action="/admin/posts"
                className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[1.4fr_170px_170px_150px_150px]"
              >
                <input type="hidden" name="lang" value={lang} />

                <label className="relative block md:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={rawQ}
                    placeholder={t.searchPlaceholder}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#25C9C8] focus:ring-2 focus:ring-[#25C9C8]/20"
                  />
                </label>

                <SelectBox name="category" defaultValue={selectedCategory}>
                  <option value="">{t.allCategories}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </SelectBox>

                <SelectBox name="author" defaultValue={selectedAuthor}>
                  <option value="">{t.allAuthors}</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </SelectBox>

                <input
                  type="date"
                  name="from"
                  aria-label={t.from}
                  defaultValue={selectedFrom}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#25C9C8] focus:ring-2 focus:ring-[#25C9C8]/20"
                />

                <input
                  type="date"
                  name="to"
                  aria-label={t.to}
                  defaultValue={selectedTo}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#25C9C8] focus:ring-2 focus:ring-[#25C9C8]/20"
                />
              </form>

              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (() => {
                      const form = document.getElementById("posts-filter-form");
                      if (!form) return;

                      let timer;

                      const submitForm = () => {
                        const pageInput = form.querySelector('input[name="page"]');
                        if (pageInput) pageInput.remove();

                        if (typeof form.requestSubmit === "function") {
                          form.requestSubmit();
                        } else {
                          form.submit();
                        }
                      };

                      form.querySelectorAll("select, input[type='date']").forEach((field) => {
                        field.addEventListener("change", submitForm);
                      });

                      const search = form.querySelector('input[name="q"]');
                      if (search) {
                        search.addEventListener("input", () => {
                          clearTimeout(timer);
                          timer = setTimeout(submitForm, 550);
                        });
                      }
                    })();
                  `,
                }}
              />
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full">
                  <thead className="bg-[#E0FAFA]">
                    <tr>
                      <TableHead>{t.author}</TableHead>
                      <TableHead>{t.category}</TableHead>
                      <TableHead>{t.content}</TableHead>
                      <TableHead align="center">{t.likes}</TableHead>
                      <TableHead align="center">{t.comments}</TableHead>
                      <TableHead>{t.date}</TableHead>
                      <TableHead align="right">{t.actions}</TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedPosts.map((post) => {
                      const author = post.author || {};
                      const likesCount = getLikesCount(post);
                      const commentsCount = getCommentsCount(post);

                      return (
                        <tr
                          key={String(post._id)}
                          className="border-t border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <AuthorCell author={author} t={t} />
                          </td>
                          <td className="px-4 py-3">
                            <Badge>{post.category || t.general}</Badge>
                          </td>
                          <td className="max-w-[430px] px-4 py-3">
                            <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                              {post.content || t.noContent}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-black">
                            {likesCount}
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-black">
                            {commentsCount}
                          </td>
                          <td className="px-4 py-3 text-xs font-black text-slate-600">
                            {formatDate(post.createdAt)}
                          </td>
                          <td className="px-4 py-3">
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

            <div className="grid gap-3 lg:hidden">
              {paginatedPosts.map((post) => {
                const author = post.author || {};
                const likesCount = getLikesCount(post);
                const commentsCount = getCommentsCount(post);

                return (
                  <article
                    key={`mobile-${String(post._id)}`}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <AuthorCell author={author} t={t} />
                      <Badge>{post.category || t.general}</Badge>
                    </div>

                    <p className="mt-3 line-clamp-4 text-xs font-semibold leading-5 text-slate-600">
                      {post.content || t.noContent}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniInfo label={t.likes} value={likesCount} />
                      <MiniInfo label={t.comments} value={commentsCount} />
                      <MiniInfo label={t.date} value={formatDate(post.createdAt)} />
                    </div>

                    <div className="mt-3">
                      <PostActions post={post} t={t} mobile />
                    </div>
                  </article>
                );
              })}

              {filteredPosts.length === 0 && <EmptyPosts t={t} />}
            </div>

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
    </main>
  );
}

function SelectBox({
  name,
  defaultValue,
  children,
}: {
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#25C9C8] focus:ring-2 focus:ring-[#25C9C8]/20"
    >
      {children}
    </select>
  );
}

function ExportButton({
  href,
  fileName,
  children,
}: {
  href: string;
  fileName: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      download={fileName}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
    >
      {children}
    </a>
  );
}

function DropdownExportItem({
  href,
  fileName,
  target,
  children,
}: {
  href: string;
  fileName?: string;
  target?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      download={fileName}
      target={target ? "_blank" : undefined}
      rel={target ? "noreferrer" : undefined}
      className="block rounded-lg px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-[#E0FAFA] hover:text-[#008B8B]"
    >
      {children}
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
      className={`px-4 py-3 ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      } text-[11px] font-black uppercase tracking-wider text-[#075985]`}
    >
      {children}
    </th>
  );
}

function AuthorCell({ author, t }: { author: any; t: typeof text.en }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Image
        src={getAuthorImage(author)}
        alt={author.name || t.unknownAlumni}
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-100"
      />

      <div className="min-w-0">
        <p className="line-clamp-1 text-xs font-black text-slate-950">
          {author.name || t.unknownAlumni}
        </p>
        <p className="line-clamp-1 text-[11px] font-bold text-slate-400">
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
    <div className={`flex gap-2 ${mobile ? "grid grid-cols-1" : "justify-end"}`}>
      <form action={deletePost} className="w-full">
        <input type="hidden" name="id" value={String(post._id)} />
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-600">
          <Trash2 size={14} />
          {t.delete}
        </button>
      </form>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-[#E0FAFA] px-2.5 py-1 text-[11px] font-black text-[#008B8B]">
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-xs font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function EmptyPosts({ t }: { t: typeof text.en }) {
  return (
    <div className="p-8 text-center">
      <Newspaper className="mx-auto h-9 w-9 text-slate-400" />
      <h2 className="mt-3 text-lg font-black text-slate-900">{t.noPosts}</h2>
      <p className="mt-1 text-xs font-bold text-slate-400">{t.noPostsText}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500">
          {t.showing} {showingStart}-{showingEnd} {t.of} {totalItems} • {t.page}{" "}
          {currentPage}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <PageLink
            href={makePageHref(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            {t.previous}
          </PageLink>

          {pageNumbers.map((pageNumber, index) =>
            pageNumber === "dots" ? (
              <span
                key={`dots-${index}`}
                className="flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-black text-slate-400"
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
            href={makePageHref(Math.min(currentPage + 1, totalPages))}
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
      <span className="flex h-9 min-w-9 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-2 text-xs font-black text-slate-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-black transition ${
        active
          ? "bg-gradient-to-r from-[#25C9C8] to-[#008B8B] text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-[#E0FAFA] hover:text-[#008B8B]"
      }`}
    >
      {children}
    </Link>
  );
}
