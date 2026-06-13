import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_AUTO_SCENARIOS, AUTO_SCENARIO_KEYS } from '../../../constants/sciAutoScenarios.js'
import SciIcon from '../SciIcon.jsx'
import { SCI_INCIDENT_TYPES } from '../../../constants/sciIncidentTypes.js'

const SEVERITY_BADGE = {
  critical: { label: 'CRÍTICO', cls: 'bg-red-900/80 text-red-300 border-red-700/60' },
  high:     { label: 'ALTO',    cls: 'bg-amber-900/80 text-amber-300 border-amber-700/60' },
  medium:   { label: 'MEDIO',   cls: 'bg-slate-800 text-slate-400 border-slate-600' },
}

export default function SciAutoScenarioModal({ open, onClose }) {
  const { dispatch } = useAppContext()

  const load = (key) => {
    const scenario = SCI_AUTO_SCENARIOS[key]
    dispatch({ type: 'SCI_RESET' })
    dispatch({
      type: 'SCI_LOAD_AUTO_SCENARIO',
      payload: { key: scenario.key, name: scenario.name, events: scenario.events },
    })
    dispatch({ type: 'SCI_SET_RUNNING', payload: true })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.97 }}
            className="bg-[#080f18] border border-slate-700/50 rounded-2xl shadow-2xl w-[520px] max-h-[88vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/40">
              <div>
                <div className="text-[13px] font-display font-bold text-slate-100">Escenarios de simulación</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Simulación automatizada de incidentes — el sistema despachará unidades y narrará los eventos
                </div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
            </div>

            {/* Scenarios */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {AUTO_SCENARIO_KEYS.map(key => {
                const s = SCI_AUTO_SCENARIOS[key]
                const sevCfg = SEVERITY_BADGE[s.severity] ?? SEVERITY_BADGE.medium
                const evCount = s.events.length

                return (
                  <button
                    key={key}
                    onClick={() => load(key)}
                    className="w-full flex items-start gap-4 p-4 bg-slate-900/60 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-500/60 rounded-xl transition-all text-left group"
                  >
                    <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: (SCI_INCIDENT_TYPES[s.events[0]?.type]?.color ?? '#94a3b8') + '22' }}>
                      <SciIcon type="incident" code={s.events[0]?.type} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-display font-bold text-slate-100 group-hover:text-white">
                          {s.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${sevCfg.cls}`}>
                          {sevCfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {s.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-500">
                          {evCount} evento{evCount !== 1 ? 's' : ''}
                        </span>
                        {s.estimatedDuration && (
                          <span className="text-[10px] text-slate-600">⏱ {s.estimatedDuration}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-500 group-hover:text-slate-200 text-lg shrink-0 self-center transition-colors">▶</span>
                  </button>
                )
              })}
            </div>

            <div className="px-6 py-3 border-t border-slate-700/40 flex items-center justify-between bg-slate-900/30">
              <div className="text-[10px] text-slate-600">
                Al iniciar se reinicia la sesión actual
              </div>
              <button onClick={onClose} className="text-[11px] text-slate-500 hover:text-slate-300">Cancelar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
