import jsPDF from 'jspdf'
import { fmtLocal, LEVEL_LABEL, stripEmoji, downloadBlob } from './helpers.js'
import {
  C, LEVEL_COLOR,
  drawHeader, drawMeta, drawTableHead, drawTableRow,
  cellText, applyFooters,
} from '../icsForms/_theme.js'

/**
 * Generic PDF builder used by exportLog and ad-hoc reports.
 * Versión institucional: fondo blanco, tipografía oscura, accent rojo.
 */
export function buildPDF({ title, subtitle, metaFields = [], tableHeaders, tableRows, logEntries }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const PAGE_BOTTOM = 268

  let y = drawHeader(doc, W, {
    formCode: 'REPORTE',
    title,
    subtitle: subtitle ?? 'Protección Civil CDMX · NIMS/ICS · SINAPROC',
    prepared: fmtLocal(Date.now()),
  })

  // Meta fields
  if (metaFields.length > 0) {
    y = drawMeta(doc, W, y, metaFields)
    y += 2
  }

  // Table
  if (tableHeaders && tableRows) {
    const colWidths = computeColWidths(tableHeaders, W - 20)
    y = drawTableHead(doc, W, y, tableHeaders, colWidths)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    for (let ri = 0; ri < tableRows.length; ri++) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 18; y = drawTableHead(doc, W, y, tableHeaders, colWidths) }
      const row = tableRows[ri]
      const rowH = drawTableRow(doc, W, y, ri)
      doc.setTextColor(...C.ink)
      let cx = 12
      for (let ci = 0; ci < row.length; ci++) {
        cellText(doc, row[ci] ?? '—', cx, y + 3.8, colWidths[ci] - 3)
        cx += colWidths[ci]
      }
      y += rowH
    }
    y += 4
  }

  // Log entries
  if (logEntries?.length) {
    // Encabezado de tabla log
    const cols = [22, 14, 18, 32, W - 106]
    y = drawTableHead(doc, W, y, ['Hora (UTC)', 'Nivel', 'Origen', 'Incidente', 'Mensaje'], cols)

    for (let i = 0; i < logEntries.length; i++) {
      if (y > PAGE_BOTTOM) { doc.addPage(); y = 18; y = drawTableHead(doc, W, y, ['Hora (UTC)', 'Nivel', 'Origen', 'Incidente', 'Mensaje'], cols) }
      const e = logEntries[i]
      const rowH = drawTableRow(doc, W, y, i)

      const time = new Date(e.t).toISOString().slice(11, 19) + 'Z'
      const lv   = LEVEL_LABEL[e.level] ?? 'INFO'
      const by   = e.by ?? 'SIM'
      const inc  = e.incidentId ?? '—'
      const msg  = stripEmoji(e.msg)
      const color = LEVEL_COLOR[e.level] ?? C.subInk

      let cx = 12
      doc.setFont('courier', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.muted)
      doc.text(time, cx, y + 3.8); cx += cols[0]

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...color)
      doc.text(lv, cx, y + 3.8); cx += cols[1]

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.subInk)
      cellText(doc, by, cx, y + 3.8, cols[2] - 3); cx += cols[2]
      cellText(doc, inc, cx, y + 3.8, cols[3] - 3); cx += cols[3]

      doc.setFontSize(7)
      doc.setTextColor(...C.ink)
      cellText(doc, msg, cx, y + 3.8, cols[4] - 3)
      y += rowH
    }
  }

  applyFooters(doc, W, 'Reporte SCI')
  return doc
}

function computeColWidths(headers, totalW) {
  const n = headers.length
  const base = totalW / n
  return headers.map(() => base)
}

export function downloadPDF(doc, filename = 'sci-reporte.pdf') {
  const blob = doc.output('blob')
  downloadBlob(filename, blob)
}
