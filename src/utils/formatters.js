export function formatNumber(n) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('es-MX').format(Math.round(n))
}

export function formatCompact(n) {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

export function formatDistance(km) {
  if (km === null || km === undefined) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function formatPercent(value, total) {
  if (!total) return '—'
  return `${((value / total) * 100).toFixed(1)}%`
}

export function formatDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
