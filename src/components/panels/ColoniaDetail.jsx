import { motion } from 'framer-motion'
import { Building2, Flame } from 'lucide-react'
import { EASE_OUT_EXPO, scoreToColor, scoreToLabel, GAP_COLORS } from '../../constants/colors.js'
import { INCIDENT_TYPES } from '../../constants/incidentTypes.js'
import { formatNumber, formatDistance, formatPercent } from '../../utils/formatters.js'
import { useAppContext } from '../../context/AppContext.jsx'
import GapIcon from '../GapIcon.jsx'

export default function ColoniaDetail({ cveGeo, properties, scores }) {
  const { state } = useAppContext()
  const { incidents } = state

  const entry = scores?.get(cveGeo)
  const inc = incidents?.data?.[cveGeo]
  const score = entry?.score ?? null
  const color = scoreToColor(score)
  const label = scoreToLabel(score)

  const pop = properties?.population
  const alcaldia = properties?.NOMGEO_ALC || properties?.alcaldia

  return (
    <div className="p-4 space-y-4">
      {/* Score badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        className="flex items-center gap-3 p-3 rounded-xl border"
        style={{ borderColor: color + '40', backgroundColor: color + '12' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold font-mono flex-shrink-0"
          style={{ backgroundColor: color + '25', color }}
        >
          {score !== null ? score : '—'}
        </div>
        <div>
          <p className="text-foreground text-sm font-semibold" style={{ color }}>
            {label}
          </p>
          <p className="text-muted text-xs">Índice de brecha de cobertura</p>
        </div>
      </motion.div>

      {/* Colonia info */}
      <div className="space-y-1.5 text-xs">
        {alcaldia && (
          <Row label="Alcaldía" value={alcaldia} />
        )}
        {pop && (
          <Row label="Población" value={formatNumber(pop)} />
        )}
        {entry?.nearestHospitalKm != null && (
          <Row
            label="Hospital más cercano"
            value={formatDistance(entry.nearestHospitalKm)}
            icon={<Building2 size={13} className="text-incident-medical" strokeWidth={1.75} />}
          />
        )}
        {entry?.nearestFireStationKm != null && (
          <Row
            label="Estación más cercana"
            value={formatDistance(entry.nearestFireStationKm)}
            icon={<Flame size={13} className="text-incident-fire" strokeWidth={1.75} />}
          />
        )}
      </div>

      {/* Incident breakdown */}
      {inc && (
        <div className="space-y-2">
          <p className="text-muted text-[10px] uppercase tracking-wider">Incidentes registrados</p>
          {Object.values(INCIDENT_TYPES).map(type => {
            const count = inc.byType?.[type.key] || 0
            if (!count) return null
            return (
              <div key={type.key} className="flex items-center gap-2">
                <GapIcon iconName={type.icon} size={12} color={type.color} className="flex-shrink-0" />
                <span className="text-muted text-xs flex-1">{type.labelShort}</span>
                <span className="text-foreground text-xs font-mono">{formatNumber(count)}</span>
                <span className="text-muted/50 text-[10px] w-10 text-right">
                  {formatPercent(count, inc.total)}
                </span>
              </div>
            )
          })}
          <div className="flex items-center justify-between pt-1 border-t border-surface-3">
            <span className="text-muted text-xs">Total</span>
            <span className="text-foreground text-xs font-mono font-semibold">{formatNumber(inc.total)}</span>
          </div>
        </div>
      )}

      {!inc && (
        <p className="text-muted/60 text-xs text-center py-4">Sin datos de incidentes</p>
      )}
    </div>
  )
}

function Row({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-foreground font-mono">{value}</span>
    </div>
  )
}
