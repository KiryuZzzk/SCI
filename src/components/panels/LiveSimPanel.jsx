import { motion, AnimatePresence } from 'framer-motion'
import { Gauge, RotateCcw, HeartPulse, Flame, Car, ShieldAlert, Ambulance } from 'lucide-react'
import { useAppContext } from '../../context/AppContext.jsx'
import { EASE_OUT_EXPO } from '../../constants/colors.js'

const INC_COLORS = { medical: '#f472b6', fire: '#fb923c', traffic: '#a78bfa', security: '#38bdf8' }
const INC_ICON   = { medical: HeartPulse, fire: Flame, traffic: Car, security: ShieldAlert }

const UNIT_COLORS = { ambulance: '#f472b6', police: '#38bdf8', firefighter: '#fb923c' }
const UNIT_ICON   = { ambulance: Ambulance, police: ShieldAlert, firefighter: Flame }
const UNIT_LABEL  = { ambulance: 'Ambulancias', police: 'Patrullas', firefighter: 'Bomberos' }
const INC_LABEL   = { medical: 'Médica', fire: 'Incendio', traffic: 'Vial', security: 'Seguridad' }

export default function LiveSimPanel({ units = [], incidents = [], log = [], onReset }) {
  const { state, dispatch } = useAppContext()
  const { liveSpeed } = state

  const activeInc = incidents.filter(i => !i.resolved)
  const byType = activeInc.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1
    return acc
  }, {})

  const unitStats = Object.entries(
    units.reduce((acc, u) => {
      if (!acc[u.type]) acc[u.type] = { patrol: 0, responding: 0, atScene: 0, returning: 0 }
      acc[u.type][u.status] = (acc[u.type][u.status] || 0) + 1
      return acc
    }, {})
  )

  const onCall = units.filter(u => u.status !== 'patrol' && u.status !== 'returning').length

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      className="absolute top-12 right-4 z-[1000] w-64 space-y-2"
    >
      {/* Header */}
      <div className="bg-bg/90 backdrop-blur-md border border-surface-3 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-foreground text-xs font-display font-semibold">Simulación en vivo</span>
          </div>
          <button
            onClick={onReset}
            className="text-muted hover:text-foreground transition-colors"
            title="Reiniciar"
          >
            <RotateCcw size={13} strokeWidth={1.75} />
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2">
          <Gauge size={13} strokeWidth={1.75} className="text-muted" />
          <span className="text-muted text-xs">Velocidad:</span>
          <div className="flex gap-1 ml-auto">
            {[1, 2, 3].map(s => (
              <button
                key={s}
                onClick={() => dispatch({ type: 'SET_LIVE_SPEED', payload: s })}
                className={`w-6 h-5 rounded text-[10px] font-mono transition-colors ${
                  liveSpeed === s
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-muted hover:text-foreground'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active incidents */}
      <div className="bg-bg/90 backdrop-blur-md border border-surface-3 rounded-xl p-3">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-2">
          Incidentes activos ({activeInc.length})
        </p>
        {activeInc.length === 0 ? (
          <p className="text-muted/50 text-xs">Sin incidentes</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(byType).map(([type, count]) => {
              const Icon = INC_ICON[type]
              return (
                <div key={type} className="flex items-center gap-1.5">
                  {Icon && <Icon size={12} strokeWidth={1.75} style={{ color: INC_COLORS[type] }} className="flex-shrink-0" />}
                  <span className="text-muted text-xs flex-1">{INC_LABEL[type]}</span>
                  <span className="text-foreground text-xs font-mono">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Unit status */}
      <div className="bg-bg/90 backdrop-blur-md border border-surface-3 rounded-xl p-3">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-2">
          Unidades ({onCall} en servicio)
        </p>
        <div className="space-y-1.5">
          {unitStats.map(([type, stats]) => {
            const UIcon = UNIT_ICON[type]
            return (
            <div key={type} className="flex items-center gap-2">
              {UIcon && <UIcon size={12} strokeWidth={1.75} style={{ color: UNIT_COLORS[type] }} className="flex-shrink-0" />}
              <span className="text-muted text-xs flex-1">{UNIT_LABEL[type]}</span>
              <span className="text-muted/60 text-[10px] font-mono">
                {stats.responding + stats.atScene > 0
                  ? <span className="text-accent">{stats.responding + stats.atScene}</span>
                  : null}
                {stats.patrol > 0 && <span> {stats.patrol}p</span>}
              </span>
            </div>
            )
          })}
        </div>
      </div>

      {/* Dispatch log */}
      {log.length > 0 && (
        <div className="bg-bg/90 backdrop-blur-md border border-surface-3 rounded-xl p-3">
          <p className="text-muted text-[10px] uppercase tracking-wider mb-2">Despachos recientes</p>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {log.map((entry, i) => (
                <motion.p
                  key={entry + i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1 - i * 0.15, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-muted text-[10px] leading-relaxed"
                >
                  {entry}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  )
}
