// icon: nombre del componente Lucide (importar desde lucide-react)
export const INCIDENT_TYPES = {
  medical: {
    key: 'medical',
    label: 'Urgencias médicas',
    labelShort: 'Médico',
    color: '#f472b6',
    tailwind: 'incident-medical',
    icon: 'HeartPulse',
    resourceType: 'hospital',
    description: 'Emergencias que requieren atención médica inmediata',
  },
  fire: {
    key: 'fire',
    label: 'Incendios',
    labelShort: 'Incendio',
    color: '#fb923c',
    tailwind: 'incident-fire',
    icon: 'Flame',
    resourceType: 'fireStation',
    description: 'Incendios estructurales, vehiculares y forestales',
  },
  traffic: {
    key: 'traffic',
    label: 'Accidentes viales',
    labelShort: 'Vial',
    color: '#a78bfa',
    tailwind: 'incident-traffic',
    icon: 'Car',
    resourceType: 'hospital',
    description: 'Colisiones, atropellamientos y accidentes en vía pública',
  },
  security: {
    key: 'security',
    label: 'Seguridad pública',
    labelShort: 'Seguridad',
    color: '#38bdf8',
    tailwind: 'incident-security',
    icon: 'ShieldAlert',
    resourceType: null,
    description: 'Reportes de incidentes de seguridad al 911',
  },
}

export const INCIDENT_TYPE_KEYS = Object.keys(INCIDENT_TYPES)
