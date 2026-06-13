// Dependencias SCI con paleta y etiquetas
export const SCI_DEPENDENCIES = {
  ERUM: {
    key: 'ERUM',
    label: 'ERUM',
    fullName: 'Escuadrón de Rescate y Urgencias Médicas',
    color: '#f472b6',
    icon: '🚑',
  },
  SSC: {
    key: 'SSC',
    label: 'SSC',
    fullName: 'Secretaría de Seguridad Ciudadana',
    color: '#38bdf8',
    icon: '🚓',
  },
  PC: {
    key: 'PC',
    label: 'PC CDMX',
    fullName: 'Protección Civil CDMX',
    color: '#22c55e',
    icon: '🛡️',
  },
  BOMBEROS: {
    key: 'BOMBEROS',
    label: 'Bomberos',
    fullName: 'Heroico Cuerpo de Bomberos CDMX',
    color: '#fb923c',
    icon: '🚒',
  },
  CRUZROJA: {
    key: 'CRUZROJA',
    label: 'Cruz Roja',
    fullName: 'Cruz Roja Mexicana',
    color: '#ef4444',
    icon: '➕',
  },
  SEDENA: {
    key: 'SEDENA',
    label: 'SEDENA',
    fullName: 'Secretaría de la Defensa Nacional (Plan DN-III)',
    color: '#84cc16',
    icon: '🪖',
  },
  MARINA: {
    key: 'MARINA',
    label: 'Marina',
    fullName: 'SEMAR (Plan Marina)',
    color: '#0ea5e9',
    icon: '⚓',
  },
  HOSPITAL: {
    key: 'HOSPITAL',
    label: 'Hospital',
    fullName: 'Centro hospitalario receptor',
    color: '#a78bfa',
    icon: '🏥',
  },
  C5: {
    key: 'C5',
    label: 'C5',
    fullName: 'Centro de Comando, Control, Cómputo, Comunicaciones y Contacto Ciudadano',
    color: '#818cf8',
    icon: '📡',
  },
  CRUM: {
    key: 'CRUM',
    label: 'CRUM',
    fullName: 'Centro Regulador de Urgencias Médicas',
    color: '#e879f9',
    icon: '🏥',
  },
  SEMOVI: {
    key: 'SEMOVI',
    label: 'SEMOVI',
    fullName: 'Secretaría de Movilidad CDMX',
    color: '#34d399',
    icon: '🚦',
  },
  CFE: {
    key: 'CFE',
    label: 'CFE',
    fullName: 'Comisión Federal de Electricidad',
    color: '#fde047',
    icon: '⚡',
  },
  SACMEX: {
    key: 'SACMEX',
    label: 'SACMEX',
    fullName: 'Sistema de Aguas de la Ciudad de México',
    color: '#38bdf8',
    icon: '💧',
  },
  PEMEX: {
    key: 'PEMEX',
    label: 'PEMEX',
    fullName: 'Petróleos Mexicanos',
    color: '#f87171',
    icon: '🛢️',
  },
}

export const DEPENDENCY_KEYS = Object.keys(SCI_DEPENDENCIES)

export const dependencyColor = (dep) =>
  SCI_DEPENDENCIES[dep]?.color ?? '#94a3b8'

export const dependencyLabel = (dep) =>
  SCI_DEPENDENCIES[dep]?.label ?? dep
