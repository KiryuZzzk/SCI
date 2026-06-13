import { motion } from 'framer-motion'
import { GAP_COLORS } from '../../constants/colors.js'
import { EASE_OUT_EXPO } from '../../constants/colors.js'
import { formatNumber } from '../../utils/formatters.js'

const LEGEND_ITEMS = [
  { color: GAP_COLORS.excellent, label: 'Excelente',        range: '< 0' },
  { color: GAP_COLORS.good,      label: 'Buena cobertura',  range: '0 – 20' },
  { color: GAP_COLORS.moderate,  label: 'Brecha moderada',  range: '20 – 50' },
  { color: GAP_COLORS.critical,  label: 'Brecha crítica',   range: '≥ 50' },
]

export default function MapLegend({ mapMode, summary }) {
  if (mapMode === 'heatmap') return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.3 }}
      className="absolute bottom-8 left-4 z-[1000] bg-bg/85 backdrop-blur-md border border-surface-3 rounded-xl p-3 w-48"
    >
      <p className="text-foreground text-xs font-display font-semibold mb-2.5">
        Índice de brecha
      </p>

      <div className="space-y-1.5 mb-3">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted text-xs flex-1">{item.label}</span>
            <span className="text-muted/60 text-[10px] font-mono">{item.range}</span>
          </div>
        ))}
      </div>

      {summary && summary.total > 0 && (
        <div className="border-t border-surface-3 pt-2 grid grid-cols-2 gap-1">
          <Stat label="Críticas" value={summary.critical} color="text-gap-critical" />
          <Stat label="Moderadas" value={summary.moderate} color="text-gap-moderate" />
          <Stat label="Buenas" value={summary.good} color="text-gap-good" />
          <Stat label="Excelentes" value={summary.excellent} color="text-gap-excellent" />
        </div>
      )}
    </motion.div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-bold font-mono ${color}`}>{formatNumber(value)}</p>
      <p className="text-muted/70 text-[10px]">{label}</p>
    </div>
  )
}
