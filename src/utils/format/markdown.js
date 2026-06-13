import { fmtIso, fmtLocal, LEVEL_LABEL, stripEmoji, downloadBlob } from './helpers.js'

export function logToMarkdown(entries, meta = {}) {
  const lines = []
  lines.push('# SCI/ICS — Registro de Operaciones')
  lines.push('')
  if (meta.incident) lines.push(`**Incidente:** ${meta.incident}  `)
  if (meta.ic)       lines.push(`**IC:** ${meta.ic}  `)
  if (meta.op)       lines.push(`**OP:** ${meta.op}  `)
  lines.push(`**Exportado:** ${fmtLocal(Date.now())}  `)
  lines.push(`**Entradas:** ${entries.length}  `)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('| Hora (UTC) | Nivel | Por | Incidente | Mensaje |')
  lines.push('|---|---|---|---|---|')
  for (const e of entries) {
    const time = fmtIso(e.t).slice(11, 19) + 'Z'
    const lv   = LEVEL_LABEL[e.level] ?? 'INFO'
    const by   = e.by ?? 'SIM'
    const inc  = e.incidentId ?? '—'
    const msg  = stripEmoji(e.msg).replace(/\|/g, '\\|')
    lines.push(`| \`${time}\` | **${lv}** | ${by} | ${inc} | ${msg} |`)
  }
  return lines.join('\n')
}

export function downloadMarkdown(entries, meta = {}, filename = 'sci-registro.md') {
  const content = logToMarkdown(entries, meta)
  downloadBlob(filename, new Blob([content], { type: 'text/markdown;charset=utf-8' }))
}
