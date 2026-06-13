/**
 * ICS-209 — Informe de Estado del Incidente
 * Versión institucional: fondo blanco, métricas en bloques claros.
 */

import jsPDF from 'jspdf'
import { fmtLocal, fmtUtcTime, stripEmoji } from '../format/helpers.js'
import { downloadPDF } from '../format/pdf.js'
import {
  C, LEVEL_COLOR,
  drawHeader, drawSection, drawMeta, drawTableHead, drawTableRow,
  cellText, drawPageContinuation, applyFooters, drawEmpty, drawSignatureBlock,
} from './_theme.js'

const FORM_CODE = 'ICS-209'
const PAGE_BOTTOM = 268

export function generateICS209({
  incident,
  command       = {},
  op            = null,
  resources     = [],
  log           = [],
  personnelById = {},
  scenario      = null,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const now = Date.now()
  const opLabel = op?.label ?? '—'
  const ref = `${incident?.clave ?? '—'} · ${opLabel}`

  let y = drawHeader(doc, W, {
    formCode: FORM_CODE,
    title:    'Informe de Estado del Incidente',
    prepared: fmtLocal(now),
    scenario,
  })

  // ── 1. IDENTIFICACIÓN ─────────────────────────────────────────
  y = drawSection(doc, W, y, '1. IDENTIFICACIÓN DEL INCIDENTE')
  const icPerson = command.IC ? personnelById[command.IC.personnelId] : null
  y = drawMeta(doc, W, y, [
    { label: 'Número de Incidente', value: incident?.id ?? '—' },
    { label: 'Nombre / Clave',      value: incident?.clave ?? '—' },
    { label: 'Tipo',                value: incident?.type ?? '—' },
    { label: 'Período OP',          value: opLabel },
    { label: 'Inicio OP',           value: op?.start ? fmtLocal(op.start) : '—' },
    { label: 'Comandante (IC)',     value: icPerson?.name ?? '— Sin asignar' },
    { label: 'Organización IC',     value: icPerson?.org ?? '—' },
  ])
  y += 2

  // ── 2. ESTADO OPERACIONAL ─────────────────────────────────────
  y = drawSection(doc, W, y, '2. ESTADO OPERACIONAL DE RECURSOS')

  const totals = {
    total:       resources.length,
    disponible:  resources.filter(r => r.state === 'disponible').length,
    asignado:    resources.filter(r => r.state === 'asignado').length,
    enroute:     resources.filter(r => r.state === 'enroute').length,
    onScene:     resources.filter(r => r.state === 'on-scene').length,
    noDisp:      resources.filter(r => r.state === 'no-disponible').length,
  }

  // Stat grid 3x2 — cajas claras con borde
  const statCells = [
    { label: 'Total',         value: totals.total,      color: C.ink },
    { label: 'Disponibles',   value: totals.disponible, color: C.ok },
    { label: 'Asignados',     value: totals.asignado,   color: C.warn },
    { label: 'En tránsito',   value: totals.enroute,    color: C.info },
    { label: 'En escena',     value: totals.onScene,    color: C.warn },
    { label: 'No disp.',      value: totals.noDisp,     color: C.crit },
  ]
  const cellW = (W - 20) / 3
  const cellH = 14
  for (let i = 0; i < statCells.length; i++) {
    const col = i % 3
    const row = Math.floor(i / 3)
    const cx = 10 + col * cellW
    const cy = y + row * cellH
    doc.setDrawColor(...C.rule)
    doc.setLineWidth(0.2)
    doc.rect(cx, cy, cellW, cellH, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text(statCells[i].label.toUpperCase(), cx + 3, cy + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...statCells[i].color)
    doc.text(String(statCells[i].value), cx + cellW - 3, cy + 11, { align: 'right' })
  }
  y += cellH * 2 + 4

  // ── 3. RECURSOS POR DEPENDENCIA ───────────────────────────────
  y = drawSection(doc, W, y, '3. RECURSOS POR DEPENDENCIA')

  const byDep = {}
  for (const r of resources) {
    const dep = r.dependency ?? 'OTROS'
    if (!byDep[dep]) byDep[dep] = { total: 0, asignado: 0, disponible: 0 }
    byDep[dep].total++
    if (r.state === 'asignado' || r.state === 'enroute' || r.state === 'on-scene') byDep[dep].asignado++
    if (r.state === 'disponible') byDep[dep].disponible++
  }
  const depRows = Object.entries(byDep)

  if (depRows.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin datos —')
  } else {
    const cols = [60, 30, 32, 32, 32]
    y = drawTableHead(doc, W, y, ['Dependencia', 'Total', 'Asignados', 'Disponibles', 'No disp.'], cols)

    for (let i = 0; i < depRows.length; i++) {
      if (y > PAGE_BOTTOM) {
        doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18
        y = drawTableHead(doc, W, y, ['Dependencia', 'Total', 'Asignados', 'Disponibles', 'No disp.'], cols)
      }
      const [dep, s] = depRows[i]
      const noDisp = s.total - s.asignado - s.disponible
      const rowH = drawTableRow(doc, W, y, i)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      let cx = 12
      doc.setTextColor(...C.ink)
      cellText(doc, dep, cx, y + 3.8, cols[0] - 3); cx += cols[0]
      doc.setFont('helvetica', 'normal')
      cellText(doc, String(s.total), cx, y + 3.8, cols[1] - 3); cx += cols[1]
      doc.setTextColor(...C.warn)
      cellText(doc, String(s.asignado), cx, y + 3.8, cols[2] - 3); cx += cols[2]
      doc.setTextColor(...C.ok)
      cellText(doc, String(s.disponible), cx, y + 3.8, cols[3] - 3); cx += cols[3]
      doc.setTextColor(...C.crit)
      cellText(doc, String(noDisp), cx, y + 3.8, cols[4] - 3)
      y += rowH
    }
    y += 3
  }

  // ── 4. EVENTOS CRÍTICOS ───────────────────────────────────────
  if (y > 215) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '4. EVENTOS CRÍTICOS / LOG RECIENTE')

  const critLog = log.filter(e => e.level === 'critical').slice(-20)
  const displayLog = critLog.length > 0 ? critLog : log.slice(-15)

  if (displayLog.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin eventos registrados —')
  } else {
    doc.setDrawColor(...C.rule)
    doc.setLineWidth(0.2)
    const blockH = displayLog.length * 5 + 3
    if (y + blockH > PAGE_BOTTOM) {
      doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18
    }
    doc.rect(10, y, W - 20, blockH, 'S')

    let ly = y + 4
    for (const e of displayLog) {
      if (ly > PAGE_BOTTOM) {
        doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref)
        y = 18; ly = y + 4
        const newBlockH = (displayLog.length - displayLog.indexOf(e)) * 5 + 3
        doc.rect(10, y, W - 20, Math.min(newBlockH, PAGE_BOTTOM - y), 'S')
      }
      const time = fmtUtcTime(e.t)
      const msg = stripEmoji(e.msg)
      const color = LEVEL_COLOR[e.level] ?? C.subInk
      doc.setFont('courier', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.muted)
      doc.text(time, 13, ly)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...color)
      cellText(doc, msg, 30, ly, W - 42)
      ly += 5
    }
    y += blockH + 2
  }

  // ── 5. PREPARADO POR ──────────────────────────────────────────
  if (y > 235) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '5. PREPARADO POR')
  drawSignatureBlock(doc, W, y, {
    name: icPerson?.name,
    role: 'IC — Comandante de Incidente',
    org:  icPerson?.org,
    datetime: fmtLocal(now),
  })

  applyFooters(doc, W, FORM_CODE)
  return doc
}

export function downloadICS209(params) {
  const doc = generateICS209(params)
  const clave = params.incident?.clave?.replace(/\//g, '-') ?? 'incidente'
  downloadPDF(doc, `ICS-209_${clave}.pdf`)
}
