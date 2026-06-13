import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { Play, Pause, SkipBack, X, Clock } from 'lucide-react'

const LEVEL_COLOR = {
  critical: '#ef4444',
  dispatch: '#f59e0b',
  arrival:  '#22c55e',
  info:     '#64748b',
}

function fmtClock(ms) {
  const d = new Date(ms)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtRel(ms, t0) {
  const s = Math.max(0, Math.floor((ms - t0) / 1000))
  const m = Math.floor(s / 60)
  return `+${m}:${String(s % 60).padStart(2, '0')}`
}

const SPEEDS = [1, 4, 12, 30]

/**
 * Revisión de línea de tiempo (debrief). Scrubber sobre el eventLog
 * timestamped: reproduce, pausa, navega; resalta el evento actual y
 * muestra solo lo ocurrido hasta el instante seleccionado.
 */
export default function SciTimeline({ open, onClose }) {
  const { state } = useAppContext()
  const { eventLog } = state.sci

  // Eventos en orden cronológico ascendente (eventLog está desc)
  const events = useMemo(
    () => [...(eventLog ?? [])].filter(e => e.t).sort((a, b) => a.t - b.t),
    [eventLog],
  )

  const t0 = events.length ? events[0].t : 0
  const tEnd = events.length ? events[events.length - 1].t : 0
  const span = Math.max(1, tEnd - t0)

  const [playhead, setPlayhead] = useState(tEnd) // ms absoluto
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(4)
  const rafRef = useRef(null)
  const lastTickRef = useRef(0)

  // Al abrir, posiciona al final (estado actual)
  useEffect(() => {
    if (open) { setPlayhead(tEnd); setPlaying(false) }
  }, [open, tEnd])

  // Motor de reproducción
  useEffect(() => {
    if (!playing) return
    lastTickRef.current = performance.now()
    const loop = (now) => {
      const dt = now - lastTickRef.current
      lastTickRef.current = now
      setPlayhead(prev => {
        const next = prev + dt * speed
        if (next >= tEnd) { setPlaying(false); return tEnd }
        return next
      })
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, tEnd])

  const shown = useMemo(
    () => events.filter(e => e.t <= playhead),
    [events, playhead],
  )
  const current = shown.length ? shown[shown.length - 1] : null

  const restart = () => { setPlayhead(t0); setPlaying(true) }
  const togglePlay = () => {
    if (playhead >= tEnd) { setPlayhead(t0); setPlaying(true) }
    else setPlaying(p => !p)
  }

  const pct = ((playhead - t0) / span) * 100

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-0 left-0 right-0 z-[1150] bg-[#0c1520]/97 backdrop-blur-md border-t border-slate-700/50 shadow-2xl"
        >
          <div className="max-w-5xl mx-auto px-5 py-3">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2.5">
              <Clock size={14} className="text-slate-400" strokeWidth={2} />
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Línea de tiempo</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {events.length} eventos · {Math.round(span / 60000)} min
              </span>
              <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-4 text-[11px] text-slate-600 italic">
                Sin eventos registrados aún
              </div>
            ) : (
              <>
                {/* Evento actual */}
                <div className="flex items-center gap-2 mb-2 min-h-[20px]">
                  {current && (
                    <>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LEVEL_COLOR[current.level] ?? LEVEL_COLOR.info }} />
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{fmtClock(current.t)}</span>
                      <span className="text-[11.5px] text-slate-200 truncate">{current.msg}</span>
                    </>
                  )}
                </div>

                {/* Pista del scrubber con marcadores */}
                <div className="relative h-8 mb-2">
                  {/* línea base */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-700/60 rounded-full" />
                  {/* progreso */}
                  <div className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-red-600 rounded-full" style={{ width: `${pct}%` }} />
                  {/* marcadores de evento */}
                  {events.map((e, i) => {
                    const left = ((e.t - t0) / span) * 100
                    const passed = e.t <= playhead
                    return (
                      <button
                        key={i}
                        onClick={() => { setPlaying(false); setPlayhead(e.t) }}
                        title={`${fmtClock(e.t)} · ${e.msg}`}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all hover:scale-150"
                        style={{
                          left: `${left}%`,
                          width: e.level === 'critical' ? 8 : 5,
                          height: e.level === 'critical' ? 8 : 5,
                          backgroundColor: LEVEL_COLOR[e.level] ?? LEVEL_COLOR.info,
                          opacity: passed ? 1 : 0.35,
                        }}
                      />
                    )
                  })}
                  {/* playhead */}
                  <div className="absolute top-0 bottom-0 w-px bg-white/80 pointer-events-none" style={{ left: `${pct}%` }}>
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow" />
                  </div>
                  {/* slider invisible para arrastrar */}
                  <input
                    type="range"
                    min={t0} max={tEnd} step={100}
                    value={playhead}
                    onChange={e => { setPlaying(false); setPlayhead(Number(e.target.value)) }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Controles */}
                <div className="flex items-center gap-2">
                  <button onClick={restart} title="Reiniciar"
                    className="w-8 h-8 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors">
                    <SkipBack size={13} />
                  </button>
                  <button onClick={togglePlay}
                    className="w-9 h-9 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors">
                    {playing ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  {/* velocidad */}
                  <div className="flex items-center bg-slate-800/70 rounded-lg p-0.5">
                    {SPEEDS.map(s => (
                      <button key={s} onClick={() => setSpeed(s)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                          speed === s ? 'bg-slate-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                        }`}>×{s}</button>
                    ))}
                  </div>
                  {/* tiempo */}
                  <div className="ml-auto flex items-center gap-3 font-mono text-[10px]">
                    <span className="text-slate-300">{fmtRel(playhead, t0)}</span>
                    <span className="text-slate-600">/ {fmtRel(tEnd, t0)}</span>
                    <span className="text-slate-500">{fmtClock(playhead)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
