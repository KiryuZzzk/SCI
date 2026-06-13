/**
 * SciIcon — renderiza icono Lucide para dependencias, incidentes y zonas SCI.
 *
 * Props:
 *   type    'dep' | 'incident' | 'zone'
 *   code    clave del mapa (e.g. 'ERUM', 'sismo', 'acv')
 *   size    número de píxeles (default 14)
 *   color   color CSS; si omitido usa el del mapa de dependencias/incidentes
 *   className clases adicionales Tailwind
 */
import { DEP_ICON, INCIDENT_ICON, ZONE_ICON } from '../../constants/sciIconMap.js'
import { SCI_DEPENDENCIES } from '../../constants/sciDependencies.js'
import { SCI_INCIDENT_TYPES } from '../../constants/sciIncidentTypes.js'

const MAP = { dep: DEP_ICON, incident: INCIDENT_ICON, zone: ZONE_ICON }

// Default colors when none provided
function defaultColor(type, code) {
  if (type === 'dep')      return SCI_DEPENDENCIES[code]?.color ?? '#94a3b8'
  if (type === 'incident') return SCI_INCIDENT_TYPES[code]?.color ?? '#94a3b8'
  return '#94a3b8'
}

export default function SciIcon({ type, code, size = 14, color, className = '', strokeWidth = 1.75 }) {
  const IconComponent = MAP[type]?.[code]
  if (!IconComponent) return null

  const stroke = color ?? defaultColor(type, code)

  return (
    <IconComponent
      size={size}
      color={stroke}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  )
}
