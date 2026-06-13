/**
 * ICS-211 — Lista de Check-In de Recursos
 * Versión institucional (landscape): tabla principal en blanco con bordes.
 */

import jsPDF from 'jspdf'
import { fmtLocal, fmtUtcTime } from '../format/helpers.js'
import { downloadPDF } from '../format/pdf.js'
import {
  C,
  drawHeader, drawSection, drawTableHead, drawTableRow,
  cellText, drawPageContinuation, applyFooters, drawSignatureBlock,
} from './_theme.js'

const FORM_CODE = 'ICS-211'

const STATE_LABEL = {
  disponible:      'DISP',
  asignado:        'ASIG',
  enroute:         'TRNS',
  'on-scene':      'ESC',
  'no-disponible': 'NODISP',
}

const STATE_COLOR = {
  disponible:      C.ok,
  asignado:        C.warn,
  enroute:         C.info,
  'on-scene':      C.accent,
  'no-disponible': C.muted,
}

export function generateICS211({
  incident,
  command       = {},
  op            = null,
  resources     = [],
  personnelById = {},
  scenario      = null,
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // ~297mm
  const PAGE_BOTTOM = 185                       // landscape, alto ~210mm
  const now = Date.now()
  const opLabel = op?.label ?? '—'
  const ref = `${incident?.clave ?? '—'} · ${opLabel}`

  let y = drawHeader(doc, W, {
    formCode: FORM_CODE,
    title:    'Lista de Check-In de Recursos',
    prepared: fmtLocal(now),
    scenario,
  })

  // ── Stats row ─────────────────────────────────────────────────
  const totals = {
    total:    resources.length,
    disp:     resources.filter(r => r.state === 'disponible').length,
    asig:     resources.filter(r => r.state === 'asignado' || r.state === 'enroute' || r.state === 'on-scene').length,
    noDisp:   resources.filter(r => r.state === 'no-disponible').length,
  }
  const statCells = [
    { label: 'TOTAL',        val: totals.total,  color: C.ink },
    { label: 'DISPONIBLES',  val: totals.disp,   color: C.ok },
    { label: 'ASIGNADOS',    val: totals.asig,   color: C.warn },
    { label: 'NO DISP.',     val: totals.noDisp, color: C.crit },
  ]
  const cellW = (W - 20) / 4
  const cellH = 13
  for (let i = 0; i < statCells.length; i++) {
    const cx = 10 + i * cellW
    doc.setDrawColor(...C.rule)
    doc.setLineWidth(0.2)
    doc.rect(cx, y, cellW, cellH, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text(statCells[i].label, cx + 3, y + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...statCells[i].color)
    doc.text(String(statCells[i].val), cx + cellW - 4, y + 10.5, { align: 'right' })
  }
  y += cellH + 4

  // ── Tabla recursos ────────────────────────────────────────────
  y = drawSection(doc, W, y, 'REGISTRO DE RECURSOS')

  const cols = [8, 52, 32, 32, 22, 50, 38, 18, 25]
  const headers = ['#', 'Recurso / Identificador', 'Tipo', 'Dependencia', 'Estado', 'Incidente Asig.', 'Posición', 'ETA', 'Hora Check-In']

  y = drawTableHead(doc, W, y, headers, cols)

  const checkInBase = now - (resources.length * 12000)

  for (let i = 0; i < resources.length; i++) {
    if (y > PAGE_BOTTOM) {
      doc.addPage()
      drawPageContinuation(doc, W, FORM_CODE, ref)
      y = 18
      y = drawTableHead(doc, W, y, headers, cols)
    }
    const r = resources[i]
    const rowH = drawTableRow(doc, W, y, i)
    const stateColor = STATE_COLOR[r.state] ?? C.muted
    const stateLabel = STATE_LABEL[r.state] ?? r.state ?? '—'
    const etaStr = r.eta != null && r.eta > 0 ? `${Math.round(r.eta / 1000)}s` : '—'
    const posStr = r.lat != null ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}` : '—'
    const checkIn = fmtUtcTime(checkInBase + i * 12000)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    let cx = 12

    doc.setTextColor(...C.muted)
    cellText(doc, String(i + 1).padStart(2, '0'), cx, y + 3.8, cols[0] - 1); cx += cols[0]

    doc.setTextColor(...C.ink)
    doc.setFont('helvetica', 'bold')
    cellText(doc, r.label ?? r.id, cx, y + 3.8, cols[1] - 3); cx += cols[1]

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.subInk)
    cellText(doc, r.typeCode ?? '—', cx, y + 3.8, cols[2] - 3); cx += cols[2]
    cellText(doc, r.dependency ?? '—', cx, y + 3.8, cols[3] - 3); cx += cols[3]

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...stateColor)
    cellText(doc, stateLabel, cx, y + 3.8, cols[4] - 3); cx += cols[4]

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.ink)
    cellText(doc, r.assignedIncidentId ?? '—', cx, y + 3.8, cols[5] - 3); cx += cols[5]

    doc.setTextColor(...C.muted)
    cellText(doc, posStr, cx, y + 3.8, cols[6] - 3); cx += cols[6]
    cellText(doc, etaStr, cx, y + 3.8, cols[7] - 3); cx += cols[7]
    cellText(doc, checkIn, cx, y + 3.8, cols[8] - 3)
    y += rowH
  }

  // ── Firma IC ──────────────────────────────────────────────────
  y += 6
  if (y > 170) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, 'VERIFICADO POR (IC)')
  const icPerson = command.IC ? personnelById[command.IC.personnelId] : null
  drawSignatureBlock(doc, W, y, {
    name: icPerson?.name,
    role: 'IC — Comandante de Incidente',
    org:  icPerson?.org,
    datetime: fmtLocal(now),
  })

  applyFooters(doc, W, FORM_CODE)
  return doc
}

export function downloadICS211(params) {
  const doc = generateICS211(params)
  const clave = params.incident?.clave?.replace(/\//g, '-') ?? 'incidente'
  downloadPDF(doc, `ICS-211_${clave}.pdf`)
}
