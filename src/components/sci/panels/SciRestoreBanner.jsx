import { motion } from 'framer-motion'
import { History, RotateCcw, X } from 'lucide-react'

function fmtAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'hace instantes'
  const m = Math.floor(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

export default function SciRestoreBanner({ savedAt, incidentCount, onRestore, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="fixed top-14 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-[#0c1520]/97 backdrop-blur-md border border-amber-700/50 rounded-xl px-4 py-2.5 shadow-2xl"
    >
      <span className="shrink-0 w-7 h-7 rounded-lg bg-amber-900/40 flex items-center justify-center">
        <History size={15} className="text-amber-400" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-100">Escenario previo encontrado</div>
        <div className="text-[9px] text-slate-500">
          {incidentCount} incidente{incidentCount !== 1 ? 's' : ''} · guardado {fmtAgo(savedAt)}
        </div>
      </div>
      <button
        onClick={onRestore}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-amber-600/90 hover:bg-amber-500 text-white transition-colors"
      >
        <RotateCcw size={11} strokeWidth={2.2} />
        Restaurar
      </button>
      <button
        onClick={onDismiss}
        title="Descartar"
        className="shrink-0 text-slate-500 hover:text-slate-200 transition-colors"
      >
        <X size={15} />
      </button>
    </motion.div>
  )
}
