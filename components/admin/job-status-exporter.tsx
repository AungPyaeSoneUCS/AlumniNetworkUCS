// file: components/admin/job-status-exporter.tsx

"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

type RowItem = {
  year: string;
  totalPercent: number;
  employedPercent: number;
  unemployedPercent: number;
  totalCount: number;
  employedCount: number;
  unemployedCount: number;
};

type JobStatusExporterProps = {
  toggleId: string;
  menuId: string;
  csv: string;
  html: string;
  title: string;
  pdfLoading: string;
  pdfError: string;
  graphHtml: string;
  rows: RowItem[];
  totals: { graduates: number; employed: number; unemployed: number };
  labels: { export: string; excel: string; pdf: string; print: string };
};

function getTool() {
  const w = window as unknown as Record<string, any>;
  return { html2canvas: w.html2canvas, ExcelJS: w.ExcelJS };
}

export default function JobStatusExporter({
  toggleId,
  menuId,
  csv,
  html,
  title,
  pdfLoading,
  pdfError,
  graphHtml,
  rows,
  totals,
  labels,
}: JobStatusExporterProps) {
  const dataRef = useRef({ csv, html, title, pdfLoading, pdfError, graphHtml, rows, totals, labels });
  dataRef.current = { csv, html, title, pdfLoading, pdfError, graphHtml, rows, totals, labels };

  useEffect(() => {
    const toggle = document.getElementById(toggleId) as HTMLElement | null;
    const menu = document.getElementById(menuId) as HTMLElement | null;
    if (!toggle || !menu) return;

    const safeName =
      dataRef.current.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "export";

    const downloadFile = (content: string, type: string, filename: string) => {
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

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    const loadScriptOnce = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const old = document.querySelector(`script[src="${src}"]`);
        if (old) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    const downloadPdfFile = async () => {
      const current = dataRef.current;
      const originalHtml = toggle.innerHTML;

      try {
        toggle.innerHTML = current.pdfLoading;
        toggle.style.pointerEvents = "none";
        toggle.style.opacity = "0.7";

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

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error("iframe unavailable");
        doc.open();
        doc.write(current.html);
        doc.close();

        await new Promise((resolve) => setTimeout(resolve, 700));

        const reportHeight = Math.max(doc.body.scrollHeight || 900, 900);
        iframe.style.height = reportHeight + "px";

        const canvas = await getTool().html2canvas(doc.body, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          windowWidth: 1240,
          windowHeight: reportHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const PDF = (window as unknown as any).jspdf.jsPDF;
        const pdf = new PDF("p", "mm", "a4");
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
        alert(current.pdfError);
      } finally {
        toggle.innerHTML = originalHtml;
        toggle.style.pointerEvents = "auto";
        toggle.style.opacity = "1";
      }
    };

    const openPrintWindow = () => {
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.open();
      win.document.write(dataRef.current.html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    };

    const buildExcelFile = async () => {
      const current = dataRef.current;
      const originalHtml = toggle.innerHTML;

      try {
        if (!current.rows.length) throw new Error("No data");

        toggle.innerHTML = current.pdfLoading;
        toggle.style.pointerEvents = "none";
        toggle.style.opacity = "0.7";

        await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
        await loadScriptOnce("https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js");

        const ExcelJS = getTool().ExcelJS;
        if (typeof getTool().html2canvas !== "function" || !ExcelJS) {
          throw new Error("ExcelJS unavailable");
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Job Status Report");

        for (let i = 1; i <= 6; i++) ws.getColumn(i).width = 28;

        ws.mergeCells("A1:F1");
        const titleCell = ws.getCell("A1");
        titleCell.value = current.title;
        titleCell.font = { size: 18, bold: true, name: "Segoe UI" };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        ws.getRow(1).height = 30;

        ws.mergeCells("A2:F2");
        const subCell = ws.getCell("A2");
        subCell.value = "University of Computer Studies (Hinthada) - Alumni Network";
        subCell.font = { size: 12, bold: true, name: "Segoe UI", color: { argb: "FF0F766E" } };
        subCell.alignment = { vertical: "middle", horizontal: "center" };
        ws.getRow(2).height = 22;

        ws.mergeCells("A3:F3");
        const metaCell = ws.getCell("A3");
        metaCell.value = "Generated: " + new Date().toLocaleString();
        metaCell.font = { size: 10, name: "Segoe UI", color: { argb: "FF64748B" } };
        metaCell.alignment = { horizontal: "center" };
        ws.getRow(3).height = 18;

        const summary = [
          ["Total Graduates", current.totals.graduates, "FF0B67A3"],
          ["Total Employed", current.totals.employed, "FF008B8B"],
          ["Total Unemployed", current.totals.unemployed, "FF38BDF8"],
        ];
        summary.forEach((s, i) => {
          const row = 5;
          const col = i * 2 + 1;
          ws.mergeCells(row, col, row, col + 1);
          const c = ws.getCell(row, col);
          c.value = s[0] + ": " + String(s[1]).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          c.font = { size: 11, bold: true, name: "Segoe UI", color: { argb: s[2] } };
          c.alignment = { vertical: "middle", horizontal: "center" };
        });
        ws.getRow(5).height = 22;

        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.left = "-99999px";
        iframe.style.top = "0";
        iframe.style.width = "1200px";
        iframe.style.height = "700px";
        iframe.style.border = "0";
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error("iframe unavailable");
        doc.open();
        doc.write(current.graphHtml);
        doc.close();

        await new Promise((resolve) => setTimeout(resolve, 700));

        // Grow the iframe to fit stacked graph blocks so html2canvas captures
        // the full chart instead of clipping at the viewport height.
        const graphHeight = Math.max(doc.body.scrollHeight || 700, 700);
        iframe.style.height = graphHeight + "px";

        const canvas = await getTool().html2canvas(doc.body, {
          scale: 1,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          windowWidth: 1160,
          windowHeight: graphHeight,
        });
        iframe.remove();

        const imgW = canvas.width;
        const imgH = canvas.height;
        const imageId = wb.addImage({
          base64: canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""),
          extension: "png",
        });
        ws.addImage(imageId, {
          tl: { col: 0, row: 7 },
          ext: { width: imgW, height: imgH },
        });

        const imageRows = Math.ceil(imgH / 32) + 2;
        for (let r = 7; r < 7 + imageRows; r++) ws.getRow(r).height = 32;

        const tableRow = 7 + imageRows;

        const head = ["Graduated Year", "Total Count", "Employed", "Unemployed"];
        head.forEach((h, i) => {
          const c = ws.getCell(tableRow, i + 1);
          c.value = h;
          c.font = { size: 11, bold: true, name: "Segoe UI", color: { argb: "FFFFFFFF" } };
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
          c.alignment = { vertical: "middle", horizontal: "center" };
        });
        ws.getRow(tableRow).height = 20;

        current.rows.forEach((row, idx) => {
          const r = tableRow + 1 + idx;
          const cellValues = [
            row.year,
            String(row.totalCount),
            row.employedCount + " (" + row.employedPercent + "%)",
            row.unemployedCount + " (" + row.unemployedPercent + "%)",
          ];
          cellValues.forEach((val, i) => {
            const c = ws.getCell(r, i + 1);
            c.value = val;
            c.font = { size: 11, name: "Segoe UI", color: { argb: "FF0F172A" } };
            c.alignment = { vertical: "middle", horizontal: "center" };
          });
          ws.getRow(r).height = 18;
        });

        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
        });
        downloadBlob(blob, safeName + ".xlsx");
      } finally {
        toggle.innerHTML = originalHtml;
        toggle.style.pointerEvents = "auto";
        toggle.style.opacity = "1";
      }
    };

    const onDocumentClick = (event: MouseEvent) => {
      const details = toggle.closest("details");
      if (details && !details.contains(event.target as Node)) {
        details.removeAttribute("open");
      }
    };

    document.addEventListener("click", onDocumentClick);

    menu.querySelectorAll("[data-export-action]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();

        const details = btn.closest("details");
        if (details) details.removeAttribute("open");

        const action = btn.getAttribute("data-export-action");

        if (action === "excel") {
          buildExcelFile().catch(() => {
            downloadFile(dataRef.current.csv, "text/csv;charset=utf-8", safeName + ".csv");
          });
        } else if (action === "pdf") {
          downloadPdfFile();
        } else if (action === "print") {
          openPrintWindow();
        }
      });
    });

    return () => {
      document.removeEventListener("click", onDocumentClick);
    };
  }, [toggleId, menuId]);

  return (
    <details className="group relative z-[200] inline-flex overflow-visible">
      <summary
        id={toggleId}
        className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-xs font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 marker:hidden [&::-webkit-details-marker]:hidden"
      >
        <Download size={15} />
        {labels.export}
        <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
      </summary>

      <div
        id={menuId}
        className="absolute right-0 top-full z-[9999] mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-400/40 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/50 max-[420px]:left-0 max-[420px]:right-auto"
      >
        <ExportButton action="excel">
          <FileSpreadsheet size={16} className="text-emerald-500 dark:text-emerald-400" />
          {labels.excel}
        </ExportButton>
        <ExportButton action="pdf">
          <FileText size={16} className="text-red-500 dark:text-red-400" />
          {labels.pdf}
        </ExportButton>
        <ExportButton action="print">
          <Printer size={16} />
          {labels.print}
        </ExportButton>
      </div>
    </details>
  );
}

function ExportButton({
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