import { downloadBlob } from './helpers.js'

export function logToJSON(entries, meta = {}) {
  return JSON.stringify({
    exported: new Date().toISOString(),
    meta,
    count: entries.length,
    entries: entries.map(e => ({ ...e })),
  }, null, 2)
}

export function downloadJSON(entries, meta = {}, filename = 'sci-registro.json') {
  const content = logToJSON(entries, meta)
  downloadBlob(filename, new Blob([content], { type: 'application/json' }))
}
