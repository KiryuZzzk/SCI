/**
 * GapIcon — icono Lucide para tipos de incidente y recursos del modo Brecha.
 *
 * Props:
 *   iconName  string — nombre del componente Lucide (de INCIDENT_TYPES[x].icon)
 *   size      número (default 13)
 *   color     color CSS
 *   className clases adicionales
 */
import {
  HeartPulse, Flame, Car, ShieldAlert,
  Building2, Ambulance, Stethoscope, Gauge,
} from 'lucide-react'

const ICON_MAP = {
  HeartPulse,
  Flame,
  Car,
  ShieldAlert,
  Building2,
  Ambulance,
  Stethoscope,
  Gauge,
}

export default function GapIcon({ iconName, size = 13, color, className = '', strokeWidth = 1.75 }) {
  const Icon = ICON_MAP[iconName]
  if (!Icon) return null
  return <Icon size={size} color={color} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
}

// Exportar mapa también para uso en DivIcon Leaflet
export { ICON_MAP }
