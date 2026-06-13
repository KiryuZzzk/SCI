import { fmtUtcTime, LEVEL_LABEL, stripEmoji, downloadBlob } from './helpers.js'

export function logToTXT(entries, meta = {}) {
  const lines = []
  lines.push('='.repeat(60))
  lines.push('SCI/ICS — REGISTRO DE OPERACIONES')
  if (meta.incident) lines.push(`Incidente : ${meta.incident}`)
  if (meta.ic)       lines.push(`IC        : ${meta.ic}`)
  if (meta.op)       lines.push(`OP        : ${meta.op}`)
  lines.push(`Exportado : ${new Date().toISOString()}`)
  lines.push('='.repeat(60))
  lines.push('')
  for (const e of entries) {
    const lv = (LEVEL_LABEL[e.level] ?? 'INFO').padEnd(4)
    const by = (e.by ?? 'SIM').padEnd(6)
    const inc = (e.incidentId ?? '—').padEnd(22)
    lines.push(`[${fmtUtcTime(e.t)}] [${lv}] [${by}] [${inc}] ${stripEmoji(e.msg)}`)
  }
  lines.push('')
  lines.push(`Total: ${entries.length} entradas`)
  return lines.join('\n')
}

export function downloadTXT(entries, meta = {}, filename = 'sci-registro.txt') {
  const content = logToTXT(entries, meta)
  downloadBlob(filename, new Blob([content], { type: 'text/plain;charset=utf-8' }))
}
