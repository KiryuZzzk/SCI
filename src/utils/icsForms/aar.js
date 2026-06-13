/**
 * AAR — After-Action Report (Informe Post-Operación)
 * Reporte analítico generado al cerrar un período operacional o bajo demanda.
 * Calcula KPIs derivables del estado SCI y los presenta en formato institucional.
 */

import jsPDF from 'jspdf'
import { fmtLocal, fmtUtcTime, stripEmoji } from '../format/helpers.js'
import { downloadPDF } from '../format/pdf.js'
import { SCI_INCIDENT_TYPES } from '../../constants/sciIncidentTypes.js'
import { SCI_DEPENDENCIES } from '../../constants/sciDependencies.js'
import { resolveChecklist, checklistProgress } from '../sciChecklistEngine.js'
import {
  C,
  drawHeader, drawSection, drawMeta, drawTableHead, drawTableRow,
  cellText, drawPageContinuation, applyFooters, drawEmpty,
} from './_theme.js'

const FORM_CODE = 'AAR'
const PAGE_BOTTOM = 268

// ── Cálculo de métricas ─────────────────────────────────────────────
export function computeAarMetrics(sci, op = null) {
  const incidents = sci.incidents ?? []
  const resources = sci.resources?.allIds?.map(id => sci.resources.byId[id]).filter(Boolean) ?? []

  const closed = incidents.filter(i => i.status === 'closed')
  const active = incidents.filter(i => i.status !== 'closed')

  // Por tipo
  const byType = {}
  for (const inc of incidents) {
    byType[inc.type] = (byType[inc.type] ?? 0) + 1
  }

  // Recursos engaged
  const engaged = resources.filter(r => ['asignado', 'enroute', 'on-scene'].includes(r.state))
  const byDep = {}
  for (const r of resources) {
    const dep = r.dependency ?? 'OTROS'
    if (!byDep[dep]) byDep[dep] = { total: 0, engaged: 0 }
    byDep[dep].total++
    if (['asignado', 'enroute', 'on-scene'].includes(r.state)) byDep[dep].engaged++
  }

  // ETAs de unidades asignadas
  const etas = engaged.map(r => r.eta).filter(e => e != null && e > 0)
  const avgEta = etas.length ? etas.reduce((a, b) => a + b, 0) / etas.length : null
  const maxEta = etas.length ? Math.max(...etas) : null
  const minEta = etas.length ? Math.min(...etas) : null

  // Checklist completion promedio
  const checklistPcts = incidents.map(inc => {
    const resolved = resolveChecklist(inc, sci)
    return checklistProgress(resolved).pct
  })
  const avgChecklist = checklistPcts.length
    ? Math.round(checklistPcts.reduce((a, b) => a + b, 0) / checklistPcts.length)
    : 0

  // Duración OP
  const opStart = op?.start ?? null
  const opEnd = op?.end ?? Date.now()
  const opDurationMs = opStart ? opEnd - opStart : null

  // Eventos críticos
  const critEvents = (sci.eventLog ?? []).filter(e => e.level === 'critical')

  return {
    incidents, closed, active, byType,
    resources, engaged, byDep,
    avgEta, maxEta, minEta,
    avgChecklist,
    opDurationMs, opStart, opEnd,
    critEvents,
    engagementPct: resources.length ? Math.round((engaged.length / resources.length) * 100) : 0,
  }
}

function fmtDuration(ms) {
  if (ms == null) return '—'
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtEtaShort(ms) {
  if (ms == null) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

// ── Lecciones aprendidas auto-derivadas ─────────────────────────────
function deriveFindings(m) {
  const findings = []
  if (m.avgChecklist < 60) {
    findings.push(`Cumplimiento de checklist SCI bajo (${m.avgChecklist}%): reforzar adherencia al protocolo de mando.`)
  }
  if (m.avgEta != null && m.avgEta > 8 * 60000) {
    findings.push(`Tiempo de respuesta promedio elevado (${fmtEtaShort(m.avgEta)}): revisar posicionamiento de recursos.`)
  }
  if (m.active.length > 0) {
    findings.push(`${m.active.length} incidente(s) permanecen activos al cierre del período.`)
  }
  if (m.engagementPct > 80) {
    findings.push(`Alta saturación de recursos (${m.engagementPct}% comprometidos): considerar refuerzos mutuos.`)
  }
  if (m.engagementPct < 20 && m.incidents.length > 0) {
    findings.push(`Baja utilización de recursos (${m.engagementPct}%): capacidad ociosa disponible.`)
  }
  if (findings.length === 0) {
    findings.push('Operación dentro de parámetros normales. Sin hallazgos críticos.')
  }
  return findings
}

// ── Generador PDF ───────────────────────────────────────────────────
export function generateAAR({ sci, op = null, scenario = null }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const now = Date.now()
  const m = computeAarMetrics(sci, op)
  const ref = op?.label ?? 'Operación general'

  let y = drawHeader(doc, W, {
    formCode: FORM_CODE,
    title: 'Informe Post-Operación (AAR)',
    subtitle: 'After-Action Report · NIMS/ICS · SINAPROC · PC-CDMX',
    prepared: fmtLocal(now),
    scenario,
  })

  // ── 1. RESUMEN EJECUTIVO ──────────────────────────────────────
  y = drawSection(doc, W, y, '1. RESUMEN EJECUTIVO')
  y = drawMeta(doc, W, y, [
    { label: 'Período operacional', value: op?.label ?? 'Operación general' },
    { label: 'Inicio',             value: m.opStart ? fmtLocal(m.opStart) : '—' },
    { label: 'Cierre',             value: op?.end ? fmtLocal(op.end) : fmtLocal(now) },
    { label: 'Duración',           value: fmtDuration(m.opDurationMs) },
    { label: 'Incidentes totales', value: `${m.incidents.length} (${m.closed.length} cerrados · ${m.active.length} activos)` },
    { label: 'Recursos comprometidos', value: `${m.engaged.length} / ${m.resources.length} (${m.engagementPct}%)` },
  ])
  y += 2

  // ── 2. KPIs ───────────────────────────────────────────────────
  y = drawSection(doc, W, y, '2. INDICADORES CLAVE (KPI)')
  const kpis = [
    { label: 'ETA PROMEDIO',   value: fmtEtaShort(m.avgEta), color: C.info },
    { label: 'ETA MÁXIMO',     value: fmtEtaShort(m.maxEta), color: C.warn },
    { label: 'ETA MÍNIMO',     value: fmtEtaShort(m.minEta), color: C.ok },
    { label: 'CHECKLIST SCI',  value: `${m.avgChecklist}%`,  color: m.avgChecklist >= 60 ? C.ok : C.crit },
    { label: 'COMPROMISO',     value: `${m.engagementPct}%`, color: C.info },
    { label: 'EVENTOS CRÍT.',  value: String(m.critEvents.length), color: C.crit },
  ]
  const cellW = (W - 20) / 3
  const cellH = 15
  for (let i = 0; i < kpis.length; i++) {
    const col = i % 3
    const row = Math.floor(i / 3)
    const cx = 10 + col * cellW
    const cy = y + row * cellH
    doc.setDrawColor(...C.rule)
    doc.setLineWidth(0.2)
    doc.rect(cx, cy, cellW, cellH, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text(kpis[i].label, cx + 3, cy + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...kpis[i].color)
    doc.text(kpis[i].value, cx + cellW - 3, cy + 11.5, { align: 'right' })
  }
  y += cellH * 2 + 4

  // ── 3. INCIDENTES POR TIPO ────────────────────────────────────
  y = drawSection(doc, W, y, '3. INCIDENTES ATENDIDOS')
  const typeRows = Object.entries(m.byType)
  if (typeRows.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin incidentes registrados —')
  } else {
    const cols = [110, 70]
    y = drawTableHead(doc, W, y, ['Tipo de incidente', 'Cantidad'], cols)
    for (let i = 0; i < typeRows.length; i++) {
      const [type, count] = typeRows[i]
      const def = SCI_INCIDENT_TYPES[type]
      const rowH = drawTableRow(doc, W, y, i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...C.ink)
      cellText(doc, def?.label ?? type, 12, y + 3.8, cols[0] - 3)
      doc.setFont('helvetica', 'bold')
      doc.text(String(count), 12 + cols[0], y + 3.8)
      y += rowH
    }
    y += 3
  }

  // ── 4. RECURSOS POR DEPENDENCIA ───────────────────────────────
  if (y > 215) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '4. PARTICIPACIÓN POR DEPENDENCIA')
  const depRows = Object.entries(m.byDep)
  if (depRows.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin datos —')
  } else {
    const cols = [90, 45, 45]
    y = drawTableHead(doc, W, y, ['Dependencia', 'Comprometidos', 'Total'], cols)
    for (let i = 0; i < depRows.length; i++) {
      const [dep, s] = depRows[i]
      const def = SCI_DEPENDENCIES[dep]
      const rowH = drawTableRow(doc, W, y, i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...C.ink)
      cellText(doc, def?.fullName ?? dep, 12, y + 3.8, cols[0] - 3)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.warn)
      doc.text(String(s.engaged), 12 + cols[0], y + 3.8)
      doc.setTextColor(...C.ink)
      doc.setFont('helvetica', 'normal')
      doc.text(String(s.total), 12 + cols[0] + cols[1], y + 3.8)
      y += rowH
    }
    y += 3
  }

  // ── 5. HALLAZGOS Y LECCIONES ──────────────────────────────────
  if (y > 215) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '5. HALLAZGOS Y LECCIONES APRENDIDAS')
  const findings = deriveFindings(m)
  doc.setDrawColor(...C.rule)
  doc.setLineWidth(0.2)
  const fh = findings.length * 8 + 3
  doc.rect(10, y, W - 20, fh, 'S')
  let fy = y + 5
  for (let i = 0; i < findings.length; i++) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C.accent)
    doc.text(`${i + 1}.`, 13, fy)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.ink)
    const lines = doc.splitTextToSize(findings[i], W - 30)
    doc.text(lines, 19, fy)
    fy += Math.max(8, lines.length * 4 + 2)
  }
  y += fh + 4

  // ── 6. CRONOLOGÍA DE EVENTOS CRÍTICOS ─────────────────────────
  if (y > 230) { doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18 }
  y = drawSection(doc, W, y, '6. CRONOLOGÍA DE EVENTOS CRÍTICOS')
  const events = [...m.critEvents].reverse().slice(0, 30)
  if (events.length === 0) {
    y = drawEmpty(doc, W, y, '— Sin eventos críticos —')
  } else {
    const cols = [24, W - 44]
    y = drawTableHead(doc, W, y, ['Hora (UTC)', 'Evento'], cols)
    for (let i = 0; i < events.length; i++) {
      if (y > PAGE_BOTTOM) {
        doc.addPage(); drawPageContinuation(doc, W, FORM_CODE, ref); y = 18
        y = drawTableHead(doc, W, y, ['Hora (UTC)', 'Evento'], cols)
      }
      const e = events[i]
      const rowH = drawTableRow(doc, W, y, i)
      doc.setFont('courier', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.muted)
      doc.text(fmtUtcTime(e.t), 12, y + 3.8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...C.crit)
      cellText(doc, stripEmoji(e.msg), 12 + cols[0], y + 3.8, cols[1] - 3)
      y += rowH
    }
  }

  applyFooters(doc, W, FORM_CODE)
  return doc
}

export function downloadAAR(params) {
  const doc = generateAAR(params)
  const label = (params.op?.label ?? 'operacion').replace(/\s+/g, '-')
  const stamp = new Date().toISOString().slice(0, 10)
  downloadPDF(doc, `AAR_${label}_${stamp}.pdf`)
}
