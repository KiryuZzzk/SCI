import { downloadCSV }      from './format/csv.js'
import { downloadJSON }     from './format/json.js'
import { downloadTXT }      from './format/txt.js'
import { downloadMarkdown } from './format/markdown.js'
import { buildPDF, downloadPDF } from './format/pdf.js'

/**
 * Filter log entries by scope.
 * @param {object[]} entries  sci.eventLog
 * @param {'all'|'critical'|'incident'|'op'|'range'} scope
 * @param {*} scopeArg  incidentId | opId | [fromMs, toMs]
 */
export function filterLog(entries, scope, scopeArg) {
  switch (scope) {
    case 'critical':
      return entries.filter(e => e.level === 'critical')
    case 'incident':
      return entries.filter(e => e.incidentId === scopeArg)
    case 'op':
      return entries.filter(e => e.opId === scopeArg)
    case 'range': {
      const [from, to] = scopeArg ?? [0, Infinity]
      return entries.filter(e => e.t >= from && e.t <= to)
    }
    default:
      return [...entries]
  }
}

/**
 * Build meta object for reports from sci state snapshot.
 */
export function buildMeta(sci) {
  const activeOp = sci.operationalPeriods?.find(op => op.id === sci.activeOpId)
  const icId  = sci.command?.IC?.personnelId
  const ic    = icId
    ? (sci._personnelById?.[icId]?.name ?? icId)
    : '—'
  return {
    incident: sci.autoTimeline?.name ?? '—',
    ic,
    op: activeOp?.label ?? '—',
    exported: new Date().toISOString(),
  }
}

/**
 * Master export function.
 * @param {object} opts
 * @param {object[]} opts.entries      sci.eventLog
 * @param {object}  opts.sci           full sci state slice (for meta)
 * @param {'all'|'critical'|'incident'|'op'|'range'} opts.scope
 * @param {*}       opts.scopeArg
 * @param {'csv'|'json'|'txt'|'md'|'pdf'} opts.format
 */
export function exportLog({ entries, sci, scope = 'all', scopeArg, format }) {
  const filtered = filterLog(entries, scope, scopeArg)
  const meta     = buildMeta(sci ?? {})
  const dateStr  = new Date().toISOString().slice(0, 10)
  const base     = `sci-registro-${dateStr}`

  switch (format) {
    case 'csv':
      downloadCSV(filtered, `${base}.csv`)
      break
    case 'json':
      downloadJSON(filtered, meta, `${base}.json`)
      break
    case 'txt':
      downloadTXT(filtered, meta, `${base}.txt`)
      break
    case 'md':
      downloadMarkdown(filtered, meta, `${base}.md`)
      break
    case 'pdf': {
      const doc = buildPDF({
        title:   'ICS-214 — Registro de Actividad',
        subtitle: `Incidente: ${meta.incident}   OP: ${meta.op}   IC: ${meta.ic}`,
        metaFields: [
          { label: 'Incidente',  value: meta.incident },
          { label: 'IC',         value: meta.ic },
          { label: 'OP',         value: meta.op },
          { label: 'Exportado',  value: meta.exported },
          { label: 'Entradas',   value: filtered.length },
        ],
        logEntries: filtered,
      })
      downloadPDF(doc, `${base}-ics214.pdf`)
      break
    }
    default:
      console.warn('exportLog: formato desconocido', format)
  }
}
