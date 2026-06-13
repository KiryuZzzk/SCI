import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import {
  ClipboardCheck, ChevronDown, Check, Lock, Circle, Minus, ArrowRight,
} from 'lucide-react'
import { CHECKLIST_PHASES } from '../../../constants/sciChecklist.js'
import { resolveChecklist, checklistProgress, nextPendingStep } from '../../../utils/sciChecklistEngine.js'

function progressColor(pct) {
  if (pct >= 80) return '#22c55e'
  if (pct >= 45) return '#f59e0b'
  return '#fb923c'
}

export default function SciChecklistPanel({ incident }) {
  const { state, dispatch } = useAppContext()
  const [open, setOpen] = useState(false)

  const resolved = useMemo(
    () => resolveChecklist(incident, state.sci),
    [incident, state.sci],
  )
  const progress = useMemo(() => checklistProgress(resolved), [resolved])
  const next = useMemo(() => nextPendingStep(resolved), [resolved])

  const toggle = (stepKey, source) => {
    if (source === 'auto') return // auto steps no editables
    dispatch({ type: 'SCI_CHECKLIST_TOGGLE', payload: { incidentId: incident.id, stepKey } })
  }

  const col = progressColor(progress.pct)

  return (
    <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg overflow-hidden">
      {/* Header con progreso */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/50 transition-colors"
      >
        <ClipboardCheck size={13} className="shrink-0" style={{ color: col }} strokeWidth={2} />
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Checklist SCI</span>
        <span className="text-[10px] font-mono font-bold ml-auto" style={{ color: col }}>
          {progress.done}/{progress.total}
        </span>
        <ChevronDown size={13} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Barra de progreso siempre visible */}
      <div className="px-2.5 pb-1.5">
        <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: col }}
            initial={false}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        {/* Próxima acción */}
        {!open && next && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-slate-500">
            <ArrowRight size={10} className="shrink-0" style={{ color: col }} />
            <span className="truncate">Siguiente: <span className="text-slate-300">{next.label}</span></span>
          </div>
        )}
      </div>

      {/* Detalle por fase */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-2">
              {CHECKLIST_PHASES.map(phase => {
                const steps = resolved.filter(s => s.phase === phase.key && s.applicable)
                if (steps.length === 0) return null
                const ph = progress.byPhase[phase.key]
                return (
                  <div key={phase.key}>
                    {/* Phase header */}
                    <div className="flex items-center gap-1.5 px-1 mb-1">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: phase.color }} />
                      <span className="text-[8.5px] font-semibold uppercase tracking-wider" style={{ color: phase.color }}>
                        {phase.label}
                      </span>
                      <span className="text-[8px] font-mono text-slate-600 ml-auto">{ph.done}/{ph.total}</span>
                    </div>
                    {/* Steps */}
                    <div className="space-y-px">
                      {steps.map(step => {
                        const isAuto = step.source === 'auto'
                        const isNext = next?.key === step.key
                        return (
                          <button
                            key={step.key}
                            onClick={() => toggle(step.key, step.source)}
                            disabled={isAuto}
                            title={isAuto ? 'Detectado automáticamente' : 'Marcar manualmente'}
                            className={`w-full flex items-start gap-2 px-1.5 py-1.5 rounded-md text-left transition-colors ${
                              isAuto ? 'cursor-default' : 'hover:bg-slate-800/60'
                            } ${isNext ? 'bg-slate-800/40 ring-1 ring-amber-700/30' : ''}`}
                          >
                            {/* Checkbox */}
                            <span className="shrink-0 mt-0.5">
                              {step.done ? (
                                <span className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ backgroundColor: phase.color }}>
                                  <Check size={9} className="text-slate-900" strokeWidth={3.5} />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded border border-slate-600 flex items-center justify-center">
                                  <Circle size={4} className="text-slate-700" fill="currentColor" />
                                </span>
                              )}
                            </span>
                            {/* Texto */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] leading-tight ${step.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                  {step.label}
                                </span>
                                {isAuto && (
                                  <Lock size={8} className="text-slate-600 shrink-0" />
                                )}
                              </div>
                              <div className="text-[8.5px] text-slate-600 leading-tight mt-0.5">{step.hint}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* N/A steps note */}
              {resolved.some(s => !s.applicable) && (
                <div className="flex items-center gap-1.5 px-1.5 pt-1 text-[8px] text-slate-600">
                  <Minus size={9} />
                  <span>{resolved.filter(s => !s.applicable).length} paso(s) no aplican a este incidente</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
