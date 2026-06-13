// Shared formatting helpers for all export formats

export function fmtIso(ms) {
  return new Date(ms).toISOString()
}

export function fmtLocal(ms) {
  return new Date(ms).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

export function fmtLocalTime(ms) {
  return new Date(ms).toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

export function fmtUtcTime(ms) {
  const d = new Date(ms)
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')}Z`
}

export const LEVEL_LABEL = {
  critical: 'CRIT',
  dispatch: 'DSP',
  info:     'INFO',
  arrival:  'ARR',
}

// Strip emoji from message for plain-text exports
export function stripEmoji(str) {
  return str.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, '').trim()
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 1000)
}
