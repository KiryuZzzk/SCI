// NIMS Resource Typing — Type I (máxima capacidad) → IV (básica)
export const NIMS_TYPE = {
  'ambulancia-intensiva': 'I',
  'ambulancia-basica':    'III',
  'rescate-erum':         'I',
  'rescate-bomberos':     'II',
  'pipa-bomberos':        'II',
  'patrulla-ssc':         'III',
  'k9-ssc':               'II',
  'pc-busqueda-rescate':  'I',
  'pc-evaluacion':        'I',
  'cruzroja-intensiva':   'I',
  'cruzroja-basica':      'III',
  'convoy-sedena':        'I',
  'ingenieros-sedena':    'I',
  'marina-refuerzo':      'I',
  'helicoptero-condor':   'I',
  'helicoptero-marina':   'I',
  'hospital-3er-nivel':   'I',
  'hospital-2do-nivel':   'II',
}

export const NIMS_TYPE_COLOR = {
  'I':   '#dc2626',   // ops-crit
  'II':  '#d97706',   // ops-warn
  'III': '#2563eb',   // ops-info
  'IV':  '#64748b',   // muted
}
