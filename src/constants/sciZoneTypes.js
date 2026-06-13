// Zonas SCI especiales (independientes de un incidente)
export const SCI_ZONE_TYPES = {
  helipuerto: { key:'helipuerto', label:'Helipuerto', icon:'🚁', color:'#22d3ee' },
  acv:        { key:'acv',        label:'ACV',        icon:'🏥', color:'#facc15' },
  pc:         { key:'pc',         label:'PC',         icon:'⭐', color:'#f97316' },
  triage:     { key:'triage',     label:'Triage',     icon:'🩹', color:'#22c55e' },
  staging:    { key:'staging',    label:'Staging',    icon:'📦', color:'#a78bfa' },
}

export const ZONE_TYPE_KEYS = Object.keys(SCI_ZONE_TYPES)
export const zoneType = (key) => SCI_ZONE_TYPES[key]
