import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '../../constants/colors.js'
import { INCIDENT_TYPES } from '../../constants/incidentTypes.js'
import useFilters from '../../hooks/useFilters.js'
import { useAppContext } from '../../context/AppContext.jsx'
import GapIcon from '../GapIcon.jsx'

export default function FilterPanel() {
  const { activeTypes, toggleType } = useFilters()
  const { state, dispatch } = useAppContext()
  const { alcaldias, selectedAlcaldia } = state

  const alcaldiaOptions = alcaldias?.features?.map(f => ({
    value: f.properties.CVE_ALC || f.properties.NOMGEO,
    label: f.properties.NOMGEO,
  })) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.1 }}
      className="bg-bg/85 backdrop-blur-md border border-surface-3 rounded-xl p-3 space-y-3"
    >
      <p className="text-foreground text-xs font-display font-semibold">Filtros</p>

      {/* Incident type toggles */}
      <div className="space-y-1.5">
        <p className="text-muted text-[10px] uppercase tracking-wider">Tipo de incidente</p>
        {Object.values(INCIDENT_TYPES).map(type => {
          const active = activeTypes.includes(type.key)
          return (
            <button
              key={type.key}
              onClick={() => toggleType(type.key)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                active ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              <GapIcon
                iconName={type.icon}
                size={13}
                color={active ? type.color : '#243040'}
                className="flex-shrink-0"
              />
              <span className="flex-1 text-left">{type.label}</span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              )}
            </button>
          )
        })}
      </div>

      {/* Alcaldía filter */}
      {alcaldiaOptions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-muted text-[10px] uppercase tracking-wider">Alcaldía</p>
          <select
            value={selectedAlcaldia ?? ''}
            onChange={e => dispatch({ type: 'SET_ALCALDIA', payload: e.target.value || null })}
            className="w-full bg-surface border border-surface-3 text-xs text-foreground rounded-lg px-2.5 py-1.5 appearance-none"
          >
            <option value="">Toda la CDMX</option>
            {alcaldiaOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </motion.div>
  )
}
