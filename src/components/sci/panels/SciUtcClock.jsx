import { useState, useEffect } from 'react'

function fmtUTC(d) {
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')}Z`
}

function fmtLocal(d) {
  return d.toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

export default function SciUtcClock() {
  const [now,  setNow]  = useState(() => new Date())
  const [utc,  setUtc]  = useState(true)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <button
      onClick={() => setUtc(u => !u)}
      title={utc ? 'Cambiar a hora local' : 'Cambiar a UTC'}
      className="font-mono text-[10px] text-slate-400 hover:text-slate-200 transition-colors tabular-nums"
    >
      {utc ? fmtUTC(now) : fmtLocal(now)}
    </button>
  )
}
