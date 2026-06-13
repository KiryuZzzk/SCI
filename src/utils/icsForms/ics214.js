/**
 * ICS-214 — Registro de Actividades de la Unidad
 * Versión institucional: fondo blanco, log tabular legible.
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

const FORM_CODE = 'ICS-214'
const PAGE_BOTTOM = 268

const LEVEL_LABEL = {
  critical: 'CRIT',
  dispatch: 'DSP',
  info:     'INFO',
  arrival:  'ARR',
}

export function generateICS214({ incident, command = {}, op = null, log = [], personnelById = {}, scenario = null }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const now = Date.now()
  const opLabel = op?.label ?? '—'
  const ref = `${incident?.clave ?? '—'} · ${opLabel}`

  let y = drawHeader(doc, W, {
    formCode: FORM_CODE,
    title:    'Registro de Actividades de la Unidad',
    prepared: fmtLocal(now),
    scenario,
  })

  // ── 1. DATOS DEL INCIDENTE ────────────────────────────────────
  y = drawSection(doc, W, y, '1. DATOS DEL INCIDENTE')
  y = drawMeta(doc, W, y, [
    { label: 'Nombre / Clave',      value: incident?.clave ?? '—' },
    { label: 'Número de Incidente', value: incident?.id ?? '—' },
    { label: 'Tipo de Incidente',   value: incident?.type ?? '—' },
    { label: 'Período Operacional', value: opLabel },
    { label: 'Fecha/Hora Inicio',   value: op?.start ? fmtLocal(op.start) : '—' },
    { label: 'Fecha/Hora Fin',      value: op?.end ? fmtLocal(op.end) : 'Activo' },
  ])
  y += 2

  // ── 2. PERSONAL DE LA UNIDAD ──────────────────────────────────
  y = drawSection(doc, W, y, '2. PERSONAL DE LA UNIDAD')
  const cols2 = [70, 60, 60]
  y = drawTableHead(doc, W, y, ['Nombre', 'Cargo ICS', 'Organización'], cols2)

  const assignedRoles = Object.entries(command).filter(([, v]) => v?.personnelId)
  if (assignedRoles.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin personal asignado —')
  } else {
    for (let i = 0; i < assignedRoles.length; i++) {
      const [roleKey, assign] = assignedRoles[i]
      const p = personnelById[assign.personnelId]
      const role = ICS_ROLES[roleKey]
      const rowH = drawTableRow(doc, W, y, i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...C.ink)
      let cx = 12
      cellText(doc, p?.name ?? '—', cx, y + 3.8, cols2[0] - 3); cx += cols2[0]
      doc.setTextColor(...C.subInk)
      doc.setFont('helvetica', 'bold')
      cellText(doc, role?.label ?? roleKey, cx, y + 3.8, cols2[1] - 3); cx += cols2[1]
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.muted)
      cellText(doc, p?.org ?? '—', cx, y + 3.8, cols2[2] - 3)
      y += rowH
    }
    y += 3
  }

  // ── 3. REGISTRO DE ACTIVIDADES ────────────────────────────────
  y = drawSection(doc, W, y, '3. REGISTRO DE ACTIVIDADES')

  if (log.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin actividades registradas —')
  } else {
    const cols3 = [22, 14, 154]
    y = drawTableHead(doc, W, y, ['Hora (UTC)', 'Nivel', 'Actividad'], cols3)

    for (let i = 0; i < log.length; i++) {
      if (y > PAGE_BOTTOM) {
        doc.addPage()
        drawPageContinuation(doc, W, FORM_CODE, ref)
        y = 18
        y = drawTableHead(doc, W, y, ['Hora (UTC)', 'Nivel', 'Actividad'], cols3)
      }
      const e = log[i]
      const rowH = drawTableRow(doc, W, y, i)
      const time = fmtUtcTime(e.t)
      const level = LEVEL_LABEL[e.level] ?? 'INFO'
      const msg = stripEmoji(e.msg)
      const color = LEVEL_COLOR[e.level] ?? C.subInk

      doc.setFont('courier', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.muted)
      doc.text(time, 12, y + 3.8)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...color)
      doc.text(level, 12 + cols3[0], y + 3.8)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...C.ink)
      cellText(doc, msg, 12 + cols3[0] + cols3[1], y + 3.8, cols3[2] - 4)
      y += rowH
    }
    y += 3
  }

  // ── 4. PREPARADO POR ──────────────────────────────────────────
  if (y > 240) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '4. PREPARADO POR')
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

export function downloadICS214(params) {
  const doc = generateICS214(params)
  const clave = params.incident?.clave?.replace(/\//g, '-') ?? 'incidente'
  downloadPDF(doc, `ICS-214_${clave}.pdf`)
}
