import { fmtIso, fmtLocal, fmtUtcTime, LEVEL_LABEL, stripEmoji, downloadBlob } from './helpers.js'

function escapeCsv(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function logToCSV(entries) {
  const header = ['timestamp_iso', 'timestamp_local', 'timestamp_utc', 'level', 'incident_id', 'op_id', 'by', 'message']
  const rows = entries.map(e => [
    fmtIso(e.t),
    fmtLocal(e.t),
    fmtUtcTime(e.t),
    LEVEL_LABEL[e.level] ?? e.level?.toUpperCase() ?? 'INFO',
    e.incidentId ?? '',
    e.opId ?? '',
    e.by ?? 'SIM',
    stripEmoji(e.msg),
  ].map(escapeCsv).join(','))
  return [header.join(','), ...rows].join('\r\n')
}

export function downloadCSV(entries, filename = 'sci-registro.csv') {
  const content = logToCSV(entries)
  downloadBlob(filename, new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }))
}
