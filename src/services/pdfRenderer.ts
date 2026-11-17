import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"
import type { PdfDocument } from "../features/membership/services/reports.ts"

export type PdfAssets = { font: string; logo: string }
export function renderPdf(
  document: PdfDocument,
  exportedBy: string,
  assets: PdfAssets,
  date = new Date(),
) {
  const pdf = new jsPDF({
    orientation: document.landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: true,
  })
  pdf.addFileToVFS("DejaVuSans.ttf", assets.font)
  pdf.addFont("DejaVuSans.ttf", "ISPAU", "normal")
  pdf.setFont("ISPAU", "normal")
  pdf.setProperties({
    title: document.title,
    author: "ISPAU",
    subject: document.description,
  })
  const width = pdf.internal.pageSize.getWidth(),
    height = pdf.internal.pageSize.getHeight()
  const wine: [number, number, number] = [101, 11, 35]
  const generated = date.toLocaleString("en-GB", {
    timeZone: "Africa/Kampala",
    dateStyle: "medium",
    timeStyle: "short",
  })
  let y = 57
  for (const section of document.sections) {
    if (y > height - 45) {
      pdf.addPage()
      y = 57
    }
    pdf.setTextColor(...wine)
    pdf.setFontSize(12)
    const heading = pdf.splitTextToSize(section.title, width - 32)
    pdf.text(heading, 16, y)
    y += heading.length * 6 + 2
    autoTable(pdf, {
      startY: y,
      margin: { top: 57, bottom: 20, left: 16, right: 16 },
      head: [section.columns],
      body: section.rows.length
        ? section.rows
        : [
            [
              {
                content: "No records for this report.",
                colSpan: section.columns.length,
              },
            ],
          ],
      theme: "grid",
      showHead: "everyPage",
      rowPageBreak: "avoid",
      styles: {
        font: "ISPAU",
        fontStyle: "normal",
        fontSize: 9,
        cellPadding: 3,
        textColor: [43, 28, 33],
        overflow: "linebreak",
        lineColor: [227, 214, 218],
        lineWidth: 0.2,
      },
      headStyles: { fillColor: wine, textColor: 255, fontStyle: "normal" },
      alternateRowStyles: { fillColor: [247, 240, 242] },
    })
    y =
      (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 6
    if (section.note) {
      pdf.setTextColor(108, 89, 96)
      pdf.setFontSize(9)
      const lines: string[] = pdf.splitTextToSize(section.note, width - 32)
      for (const line of lines) {
        if (y > height - 22) {
          pdf.addPage()
          y = 57
        }
        pdf.text(line, 16, y)
        y += 4.5
      }
    }
    y += 9
  }
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    pdf.setFont("ISPAU", "normal")
    const image = pdf.getImageProperties(assets.logo)
    pdf.addImage(
      assets.logo,
      "PNG",
      16,
      9,
      28,
      (28 * image.height) / image.width,
    )
    pdf.setFontSize(8)
    pdf.setTextColor(108, 89, 96)
    pdf.text(`Generated ${generated} EAT`, width - 16, 15, { align: "right" })
    pdf.text(
      pdf.splitTextToSize(`Exported by ${exportedBy}`, width - 90),
      width - 16,
      20,
      { align: "right" },
    )
    pdf.setTextColor(...wine)
    pdf.setFontSize(16)
    pdf.text(pdf.splitTextToSize(document.title, width - 32), 16, 33)
    pdf.setFontSize(8)
    pdf.setTextColor(108, 89, 96)
    pdf.text(pdf.splitTextToSize(document.description, width - 32), 16, 42)
    pdf.setDrawColor(...wine)
    pdf.setLineWidth(0.5)
    pdf.line(16, 50, width - 16, 50)
    pdf.setFontSize(8)
    pdf.text(
      "ISPAU | Membership services | Private workspace copy",
      16,
      height - 10,
    )
    pdf.text(`Page ${page} of ${pages}`, width - 16, height - 10, {
      align: "right",
    })
  }
  return pdf.output("arraybuffer")
}
