import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'

const LEVEL_STYLE = {
  critical: { dot: 'bg-red-500',    text: 'text-red-400' },
  dispatch: { dot: 'bg-yellow-400', text: 'text-yellow-300' },
  info:     { dot: 'bg-sky-400',    text: 'text-sky-300' },
  arrival:  { dot: 'bg-green-400',  text: 'text-green-300' },
}

export default function SciEventLog() {
  const { state } = useAppContext()
  const log = state.sci.eventLog
  const bottomRef = useRef(null)

  // Auto-scroll to newest (log is prepended, so first item = newest)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="shrink-0 h-44 flex flex-col bg-bg/90 backdrop-blur-md border border-surface-3 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="px-3 py-1.5 border-b border-surface-3 shrink-0 flex items-center gap-2">
        <span className="text-[10px] font-display font-semibold text-muted uppercase tracking-wider">Registro de eventos</span>
        <span className="ml-auto text-[9px] text-muted font-mono">{log.length}</span>
      </div>

      <div className="overflow-y-auto flex-1 px-2 py-1.5 space-y-0.5 font-mono text-[10px]">
        {/* log is newest-first; display newest at bottom, so reverse for display */}
        {[...log].reverse().map((entry, i) => {
          const s = LEVEL_STYLE[entry.level] ?? LEVEL_STYLE.info
          return (
            <div key={i} className="flex items-start gap-1.5 leading-relaxed">
              <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
              <span className="text-surface-3 shrink-0">
                {new Date(entry.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={s.text}>{entry.msg}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </motion.div>
  )
}
