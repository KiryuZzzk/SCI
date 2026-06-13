import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { TriangleAlert, Radio, CheckCircle } from 'lucide-react'

const LEVELS = {
  critical: {
    bg:     'bg-red-950/96',
    border: 'border-red-500/80',
    Icon:   TriangleAlert,
    iconColor: '#f87171',
    text:   'text-red-100',
    badge:  'text-red-400',
    pulse:  true,
  },
  dispatch: {
    bg:     'bg-amber-950/95',
    border: 'border-amber-500/70',
    Icon:   Radio,
    iconColor: '#fbbf24',
    text:   'text-amber-100',
    badge:  'text-amber-400',
    pulse:  false,
  },
  arrival: {
    bg:     'bg-green-950/95',
    border: 'border-green-600/70',
    Icon:   CheckCircle,
    iconColor: '#4ade80',
    text:   'text-green-100',
    badge:  'text-green-400',
    pulse:  false,
  },
}

let _id = 0
const nextId = () => ++_id

export default function SciToast() {
  const { state } = useAppContext()
  const [toasts, setToasts] = useState([])
  const prevLen = useRef(0)

  useEffect(() => {
    const log = state.sci.eventLog
    if (log.length <= prevLen.current) {
      prevLen.current = log.length
      return
    }
    const newCount = log.length - prevLen.current
    prevLen.current = log.length

    // log is newest-first; slice(0, newCount) = new entries
    log.slice(0, newCount).forEach(entry => {
      if (!LEVELS[entry.level]) return
      const id = nextId()
      setToasts(prev => [{ id, ...entry }, ...prev].slice(0, 5))
      const ttl = entry.level === 'critical' ? 7000 : 4500
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ttl)
    })
  }, [state.sci.eventLog.length]) // eslint-disable-line

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <div
      className="absolute z-[1050] flex flex-col gap-2 pointer-events-none"
      style={{ top: '6.5rem', left: '50%', transform: 'translateX(-50%)', minWidth: '400px', maxWidth: '500px' }}
    >
      <AnimatePresence initial={false}>
        {toasts.map(t => {
          const cfg = LEVELS[t.level]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              className={`${cfg.bg} border ${cfg.border} rounded-xl shadow-2xl overflow-hidden pointer-events-auto`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="relative shrink-0">
                  <cfg.Icon size={18} strokeWidth={1.75} color={cfg.iconColor} />
                  {cfg.pulse && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-semibold ${cfg.badge} uppercase tracking-wider mb-0.5`}>
                    {t.level === 'critical' ? 'ALERTA CRÍTICA' :
                     t.level === 'dispatch' ? 'DESPACHO' : 'UNIDAD EN SITIO'}
                  </div>
                  <div className={`text-[12px] font-medium ${cfg.text} leading-snug`}>
                    {t.msg}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-slate-500 hover:text-slate-300 text-lg leading-none shrink-0 ml-1"
                >×</button>
              </div>
              {/* Progress bar */}
              <motion.div
                className={`h-0.5 ${t.level === 'critical' ? 'bg-red-500' : t.level === 'dispatch' ? 'bg-amber-500' : 'bg-green-500'}`}
                initial={{ scaleX: 1, originX: 0 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: t.level === 'critical' ? 7 : 4.5, ease: 'linear' }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
