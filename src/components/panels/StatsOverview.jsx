import { motion } from 'framer-motion'
import { EASE_OUT_EXPO, GAP_COLORS } from '../../constants/colors.js'
import { formatNumber } from '../../utils/formatters.js'

export default function StatsOverview({ summary }) {
  if (!summary || summary.total === 0) return null

  const stats = [
    { label: 'Críticas',    value: summary.critical,  color: GAP_COLORS.critical,  pct: summary.critical  / summary.total },
    { label: 'Moderadas',   value: summary.moderate,  color: GAP_COLORS.moderate,  pct: summary.moderate  / summary.total },
    { label: 'Buenas',      value: summary.good,      color: GAP_COLORS.good,      pct: summary.good      / summary.total },
    { label: 'Excelentes',  value: summary.excellent, color: GAP_COLORS.excellent, pct: summary.excellent / summary.total },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className="bg-bg/85 backdrop-blur-md border border-surface-3 rounded-xl p-3"
    >
      <div className="flex items-baseline justify-between mb-2.5">
        <p className="text-foreground text-xs font-display font-semibold">Resumen CDMX</p>
        {summary.avgScore !== null && (
          <span className="text-muted text-xs font-mono">
            Promedio: <span className="text-foreground">{summary.avgScore}</span>
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mb-3">
        {stats.filter(s => s.value > 0).map(s => (
          <div
            key={s.label}
            style={{ width: `${s.pct * 100}%`, backgroundColor: s.color }}
            className="rounded-full"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-muted text-xs flex-1">{s.label}</span>
            <span className="text-foreground text-xs font-mono">{formatNumber(s.value)}</span>
          </div>
        ))}
      </div>

      <p className="text-muted/50 text-[10px] mt-2 text-right">
        {formatNumber(summary.noData)} sin datos
      </p>
    </motion.div>
  )
}
