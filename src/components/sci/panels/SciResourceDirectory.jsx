import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_DEPENDENCIES, DEPENDENCY_KEYS } from '../../../constants/sciDependencies.js'
import SciResourceFilters from './SciResourceFilters.jsx'
import { fmtEta } from '../../../utils/etaModel.js'
import SciIcon from '../SciIcon.jsx'

const STATE_BADGE = {
  disponible:    { label: 'Disponible',    color: '#22c55e' },
  asignado:      { label: 'Asignado',      color: '#facc15' },
  'no-disponible': { label: 'No disponible', color: '#475569' },
}

export default function SciResourceDirectory() {
  const { state, dispatch } = useAppContext()
  const { byId, allIds } = state.sci.resources
  const f = state.sci.uiFilters

  const grouped = useMemo(() => {
    const groups = {}
    DEPENDENCY_KEYS.forEach(k => { groups[k] = [] })
    allIds.forEach(id => {
      const r = byId[id]
      if (!r) return
      if (f.dependency !== 'all' && r.dependency !== f.dependency) return
      if (f.state !== 'all' && r.state !== f.state) return
      groups[r.dependency].push(r)
    })
    return groups
  }, [byId, allIds, f])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col flex-1 min-h-0 bg-bg/90 backdrop-blur-md border border-surface-3 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-surface-3 flex items-center justify-between">
        <span className="text-xs font-display font-semibold text-foreground tracking-wide">Directorio de recursos</span>
        <span className="text-[10px] text-muted font-mono">{allIds.length} totales</span>
      </div>

      <SciResourceFilters />

      <div className="overflow-y-auto flex-1">
        {DEPENDENCY_KEYS.map(k => {
          const items = grouped[k]
          if (!items || items.length === 0) return null
          const dep = SCI_DEPENDENCIES[k]
          return (
            <div key={k} className="border-b border-surface-3/60">
              <div className="px-3 py-1.5 bg-surface/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SciIcon type="dep" code={k} size={13} />
                  <span className="text-[11px] font-display font-semibold text-foreground">{dep.label}</span>
                </div>
                <span className="text-[10px] text-muted font-mono">{items.length}</span>
              </div>
              {items.map(r => {
                const badge = STATE_BADGE[r.state]
                const selected = state.sci.selectedResourceId === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => dispatch({ type: 'SCI_SELECT_RESOURCE', payload: r.id })}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-surface-2 transition-colors ${selected ? 'bg-surface-2' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-foreground truncate">{r.label}</div>
                      <div className="text-[9px] text-muted font-mono truncate">{r.id}</div>
                    </div>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ backgroundColor: badge.color + '22', color: badge.color }}
                    >{badge.label}{r.eta != null && r.eta > 0 ? ` · ${fmtEta(r.eta)}` : ''}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
