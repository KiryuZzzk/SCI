/**
 * ICS-201 — Resumen de Briefing del Incidente
 * Versión institucional: fondo blanco, tipografía oscura, accent rojo.
 */

import jsPDF from 'jspdf'
import { fmtLocal, fmtUtcTime, stripEmoji } from '../format/helpers.js'
import { ICS_ROLES } from '../../constants/icsRoles.js'
import { downloadPDF } from '../format/pdf.js'
import {
  C, LEVEL_COLOR,
  drawHeader, drawSection, drawMeta, drawTableHead, drawTableRow,
  cellText, drawPageContinuation, applyFooters, drawEmpty, drawSignatureBlock,
} from './_theme.js'

const STATE_LABEL = {
  disponible:      'Disponible',
  asignado:        'Asignado',
  'no-disponible': 'No disp.',
  enroute:         'En tránsito',
  'on-scene':      'En escena',
}

const FORM_CODE = 'ICS-201'
const PAGE_BOTTOM = 270

export function generateICS201({
  incident,
  command   = {},
  op        = null,
  resources = [],
  log       = [],
  personnelById = {},
  scenario  = null,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const now = Date.now()
  const opLabel = op?.label ?? '—'
  const ref = `${incident?.clave ?? '—'} · ${opLabel}`

  let y = drawHeader(doc, W, {
    formCode: FORM_CODE,
    title:    'Briefing / Resumen del Incidente',
    prepared: fmtLocal(now),
    scenario,
  })

  // ── 1. DATOS DEL INCIDENTE ────────────────────────────────────
  y = drawSection(doc, W, y, '1. DATOS DEL INCIDENTE')
  y = drawMeta(doc, W, y, [
    { label: 'Nombre / Clave',      value: incident?.clave ?? '—' },
    { label: 'Número de Incidente', value: incident?.id ?? '—' },
    { label: 'Tipo de Incidente',   value: incident?.type ?? '—' },
    { label: 'Ubicación',           value: incident?.lat != null ? `${incident.lat.toFixed(5)}, ${incident.lng.toFixed(5)}` : '—' },
    { label: 'Período Operacional', value: opLabel },
    { label: 'Inicio OP',           value: op?.start ? fmtLocal(op.start) : '—' },
    { label: 'Cierre OP',           value: op?.end ? fmtLocal(op.end) : 'Activo' },
  ])
  y += 2

  // ── 2. SITUACIÓN ACTUAL ───────────────────────────────────────
  y = drawSection(doc, W, y, '2. SITUACIÓN ACTUAL / RESUMEN DE ACCIONES')
  const recentLog = log.slice(-10)
  if (recentLog.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin actividad registrada —')
  } else {
    doc.setDrawColor(...C.rule)
    doc.setLineWidth(0.2)
    const blockH = recentLog.length * 5 + 3
    doc.rect(10, y, W - 20, blockH, 'S')
    let ly = y + 4
    for (const e of recentLog) {
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
  y += 1

  // ── 3. ORGANIZACIÓN DE MANDO ──────────────────────────────────
  y = drawSection(doc, W, y, '3. ORGANIZACIÓN DE MANDO (ESTADO MAYOR)')
  const roleEntries = Object.entries(ICS_ROLES)
  const commandRows = roleEntries.map(([roleKey, roleDef]) => {
    const assign = command[roleKey]
    const person = assign ? personnelById[assign.personnelId] : null
    return {
      label: roleDef.short,
      value: person ? `${person.name}  (${person.org})` : '— Sin asignar',
    }
  })
  y = drawMeta(doc, W, y, commandRows, { rowH: 5, labelW: 50 })
  y += 2

  // ── 4. RESUMEN DE RECURSOS ────────────────────────────────────
  if (y > 200) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '4. RESUMEN DE RECURSOS')

  const assignedRes = resources.filter(r => r.state === 'asignado' || r.state === 'enroute' || r.state === 'on-scene')
  const allRes = assignedRes.length > 0 ? assignedRes : resources.slice(0, 30)

  if (allRes.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin recursos registrados —')
  } else {
    const cols = [50, 28, 28, 50, 24]
    y = drawTableHead(doc, W, y, ['Recurso / ID', 'Tipo', 'Estado', 'Asignado a', 'ETA'], cols)

    for (let i = 0; i < allRes.length; i++) {
      if (y > PAGE_BOTTOM) {
        doc.addPage()
        drawPageContinuation(doc, W, FORM_CODE, ref)
        y = 18
        y = drawTableHead(doc, W, y, ['Recurso / ID', 'Tipo', 'Estado', 'Asignado a', 'ETA'], cols)
      }
      const r = allRes[i]
      const rowH = drawTableRow(doc, W, y, i)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      let cx = 12

      doc.setTextColor(...C.ink)
      cellText(doc, r.label ?? r.id, cx, y + 3.8, cols[0] - 3); cx += cols[0]
      doc.setTextColor(...C.subInk)
      cellText(doc, r.typeCode ?? '—', cx, y + 3.8, cols[1] - 3); cx += cols[1]

      const stateLbl = STATE_LABEL[r.state] ?? r.state ?? '—'
      const stColor = r.state === 'asignado' || r.state === 'on-scene' ? C.warn
                    : r.state === 'disponible' ? C.ok
                    : r.state === 'enroute' ? C.info
                    : C.muted
      doc.setTextColor(...stColor)
      doc.setFont('helvetica', 'bold')
      cellText(doc, stateLbl, cx, y + 3.8, cols[2] - 3); cx += cols[2]

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.ink)
      cellText(doc, r.assignedIncidentId ?? '—', cx, y + 3.8, cols[3] - 3); cx += cols[3]

      const etaStr = r.eta != null && r.eta > 0 ? `${Math.round(r.eta / 1000)}s` : '—'
      doc.setTextColor(...C.subInk)
      cellText(doc, etaStr, cx, y + 3.8, cols[4] - 3)
      y += rowH
    }

    // Totales
    const totDisp = resources.filter(r => r.state === 'disponible').length
    const totAsig = resources.filter(r => r.state === 'asignado').length
    const totNoDisp = resources.filter(r => r.state === 'no-disponible').length
    y += 2
    doc.setFillColor(...C.band)
    doc.rect(10, y, W - 20, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...C.ink)
    doc.text(
      `Total: ${resources.length}   ·   Disponibles: ${totDisp}   ·   Asignados: ${totAsig}   ·   No disp.: ${totNoDisp}`,
      W / 2, y + 4.7, { align: 'center' },
    )
    y += 10
  }

  // ── 5. PREPARADO POR ──────────────────────────────────────────
  if (y > 235) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '5. PREPARADO POR / IC')
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

export function downloadICS201(params) {
  const doc = generateICS201(params)
  const clave = params.incident?.clave?.replace(/\//g, '-') ?? 'incidente'
  downloadPDF(doc, `ICS-201_${clave}.pdf`)
}
