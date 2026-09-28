import { parseBlocks, slugify, splitTerms } from '@/lib/document'

const FOOTER = 'Generated with LegalEase - For drafting purposes only. Not legal advice.'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function loadLogo(): Promise<{ bytes: ArrayBuffer; dataUrl: string } | null> {
  try {
    const res = await fetch('/logo.png')
    if (!res.ok) return null
    const blob = await res.blob()
    const bytes = await blob.arrayBuffer()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return { bytes, dataUrl }
  } catch {
    return null
  }
}

export function exportTxt(text: string, docType: string) {
  triggerDownload(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${slugify(docType)}.txt`)
}

export async function exportDocx(text: string, docType: string, terms: string) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    HeadingLevel,
    ImageRun,
    Packer,
    PageNumber,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx')

  const logo = await loadLogo()
  const blocks = parseBlocks(text)
  const termList = splitTerms(terms)
  const font = 'Times New Roman'
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = []

  if (logo) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new ImageRun({ type: 'png', data: logo.bytes, transformation: { width: 72, height: 72 } }),
        ],
      }),
    )
  }

  for (const block of blocks) {
    if (block.kind === 'title') {
      children.push(
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: block.text, bold: true, size: 32, font })],
        }),
      )
    } else if (block.kind === 'heading') {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: block.text, bold: true, size: 24, font })],
        }),
      )
    } else if (block.kind === 'bullet') {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: block.text, size: 22, font })],
        }),
      )
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 300 },
          children: [new TextRun({ text: block.text, size: 22, font })],
        }),
      )
    }
  }

  if (termList.length) {
    const border = { style: BorderStyle.SINGLE, size: 4, color: '9CA3AF' }
    const borders = { top: border, bottom: border, left: border, right: border }
    const cell = (value: string, bold = false, width = 85) =>
      new TableCell({
        borders,
        width: { size: width, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value, bold, size: 20, font })] })],
      })

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 120 },
        children: [new TextRun({ text: 'SCHEDULE A: SUMMARY OF KEY TERMS', bold: true, size: 24, font })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ tableHeader: true, children: [cell('No.', true, 15), cell('Term', true)] }),
          ...termList.map((t, i) => new TableRow({ children: [cell(String(i + 1), false, 15), cell(t)] })),
        ],
      }),
    )
  }

  const doc = new Document({
    creator: 'LegalEase',
    title: docType,
    sections: [
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${FOOTER}  |  Page `, size: 16, font, color: '6B7280' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font, color: '6B7280' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  triggerDownload(await Packer.toBlob(doc), `${slugify(docType)}.docx`)
}

export async function exportPdf(text: string, docType: string, terms: string) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const logo = await loadLogo()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 64
  const contentWidth = pageWidth - margin * 2
  const top = 96
  const bottom = pageHeight - 64
  let y = top

  const drawChrome = () => {
    if (logo) pdf.addImage(logo.dataUrl, 'PNG', pageWidth / 2 - 14, 36, 28, 28)
    pdf.setDrawColor(200)
    pdf.line(margin, 76, pageWidth - margin, 76)
  }

  const ensureSpace = (needed: number) => {
    if (y + needed > bottom) {
      pdf.addPage()
      drawChrome()
      y = top
    }
  }

  const write = (value: string, opts: { size: number; bold?: boolean; indent?: number; gap?: number; align?: 'center' }) => {
    pdf.setFont('times', opts.bold ? 'bold' : 'normal')
    pdf.setFontSize(opts.size)
    const indent = opts.indent ?? 0
    const lines: string[] = pdf.splitTextToSize(value, contentWidth - indent)
    const lineHeight = opts.size * 1.4
    for (const line of lines) {
      ensureSpace(lineHeight)
      if (opts.align === 'center') pdf.text(line, pageWidth / 2, y, { align: 'center' })
      else pdf.text(line, margin + indent, y)
      y += lineHeight
    }
    y += opts.gap ?? 0
  }

  drawChrome()
  pdf.setTextColor(30, 35, 50)

  for (const block of parseBlocks(text)) {
    if (block.kind === 'title') write(block.text, { size: 17, bold: true, gap: 14, align: 'center' })
    else if (block.kind === 'heading') {
      ensureSpace(40)
      y += 6
      write(block.text, { size: 12, bold: true, gap: 4 })
    } else if (block.kind === 'bullet') {
      ensureSpace(16)
      pdf.setFont('times', 'normal')
      pdf.setFontSize(11)
      pdf.text('\u2022', margin + 8, y)
      write(block.text, { size: 11, indent: 22, gap: 3 })
    } else write(block.text, { size: 11, gap: 8 })
  }

  const termList = splitTerms(terms)
  if (termList.length) {
    ensureSpace(60)
    y += 12
    write('SCHEDULE A: SUMMARY OF KEY TERMS', { size: 12, bold: true, gap: 4 })
    termList.forEach((t, i) => {
      ensureSpace(16)
      pdf.setFont('times', 'bold')
      pdf.setFontSize(11)
      pdf.text(`${i + 1}.`, margin + 4, y)
      write(t, { size: 11, indent: 22, gap: 3 })
    })
  }

  const total = pdf.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(110)
    pdf.text(`${FOOTER}   |   Page ${i} of ${total}`, pageWidth / 2, pageHeight - 32, { align: 'center' })
  }

  pdf.save(`${slugify(docType)}.pdf`)
}
